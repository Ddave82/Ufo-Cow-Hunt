import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const libraryUrl = new URL("../../assets/models/library/models.glb", import.meta.url).href;
const templates = new Map();
const fittedTemplates = new Map();
const finishes = new Map();
const bounds = new Map();

// Bake opaque palette colors into vertices: a whole prop normally needs one draw,
// while glass, glowing parts, metal and articulated rotors retain their finishes.
function finishFor(source) {
  const emission = source.emissive?.getHex() || 0;
  const kind = source.transparent ? `glass-${source.uuid}` : emission
    ? `light-${emission}-${source.emissiveIntensity}`
    : source.metalness > 0.3 ? "metal" : source.roughness < 0.26 ? "gloss" : "matte";
  if (!finishes.has(kind)) {
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      color: 0xffffff,
      roughness: kind === "metal" ? 0.36 : kind === "gloss" ? 0.2 : 0.7,
      metalness: kind === "metal" ? 0.5 : 0,
      side: THREE.DoubleSide
    });
    if (emission) {
      material.emissive.copy(source.emissive);
      material.emissiveIntensity = source.emissiveIntensity;
    }
    if (source.transparent) {
      material.transparent = true;
      material.opacity = source.opacity;
      material.roughness = 0.18;
      material.depthWrite = false;
      material.side = THREE.FrontSide;
    }
    material.name = `library-${kind}`;
    finishes.set(kind, material);
  }
  return finishes.get(kind);
}

function prepare(source, key) {
  source.updateWorldMatrix(true, true);
  const root = new THREE.Group();
  root.name = `asset_${key}`;
  root.userData.modelAsset = key;
  const inverse = source.matrixWorld.clone().invert();
  const moving = new Map();
  source.traverse((node) => {
    if (!node.name.startsWith("joint_rotor")) return;
    const target = new THREE.Group();
    target.name = node.name;
    new THREE.Matrix4().multiplyMatrices(inverse, node.matrixWorld)
      .decompose(target.position, target.quaternion, target.scale);
    root.add(target);
    moving.set(node, target);
  });
  const batches = new Map();
  source.traverse((mesh) => {
    if (!mesh.isMesh) return;
    let ancestor = mesh.parent;
    while (ancestor !== source && ancestor && !moving.has(ancestor)) ancestor = ancestor.parent;
    const target = moving.get(ancestor) || root;
    const material = finishFor(mesh.material);
    const signature = `${target.uuid}:${material.uuid}`;
    if (!batches.has(signature)) batches.set(signature, { target, material, geometries: [] });
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    for (const attribute of Object.keys(geometry.attributes)) {
      if (attribute !== "position" && attribute !== "normal") geometry.deleteAttribute(attribute);
    }
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    const color = mesh.material.color;
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = color.r; colors[i + 1] = color.g; colors[i + 2] = color.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const toLocal = moving.has(ancestor) ? ancestor.matrixWorld.clone().invert() : inverse;
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(toLocal, mesh.matrixWorld));
    // The old placement matrices expect a cylinder whose local axis is Y.
    if (key === "hay_bale") geometry.rotateX(Math.PI / 2);
    geometry.clearGroups();
    batches.get(signature).geometries.push(geometry);
  });
  for (const { target, material, geometries } of batches.values()) {
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((part) => part.dispose());
    if (!geometry) throw new Error(`Cannot batch asset ${key}`);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${key}-${material.name}`;
    mesh.castShadow = !material.transparent && material.emissiveIntensity <= 1;
    mesh.receiveShadow = !material.transparent;
    target.add(mesh);
  }
  bounds.set(key, new THREE.Box3().setFromObject(root));
  return root;
}

export async function loadModelLibrary(data) {
  const loader = new GLTFLoader();
  const { scene } = data ? await loader.parseAsync(data, "") : await loader.loadAsync(libraryUrl);
  const roots = [];
  scene.traverse((node) => { if (node.name.startsWith("asset_")) roots.push(node); });
  for (const root of roots) {
    const key = root.name.slice(6);
    templates.set(key, prepare(root, key));
  }
  if (templates.size !== 39) throw new Error(`Incomplete model library (${templates.size}/39)`);
  const geometries = new Set(), materials = new Set();
  scene.traverse((node) => {
    if (node.geometry) geometries.add(node.geometry);
    if (node.material) materials.add(node.material);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

export function createModel(key) {
  const template = templates.get(key);
  if (!template) throw new Error(`Missing Blender model: ${key}`);
  return template.clone(true);
}

function fitted(key, targetBounds) {
  const cacheKey = `${key}:${targetBounds.min.toArray()}:${targetBounds.max.toArray()}`;
  if (fittedTemplates.has(cacheKey)) return fittedTemplates.get(cacheKey);
  const root = createModel(key);
  const source = bounds.get(key);
  const size = source.getSize(new THREE.Vector3());
  const targetSize = targetBounds.getSize(new THREE.Vector3());
  const scale = new THREE.Vector3(...size.toArray().map((value, i) => targetSize.getComponent(i) / Math.max(value, 0.001)));
  const translation = targetBounds.getCenter(new THREE.Vector3()).sub(source.getCenter(new THREE.Vector3()).multiply(scale));
  const matrix = new THREE.Matrix4().compose(translation, new THREE.Quaternion(), scale);
  root.traverse((node) => {
    if (node.isMesh) node.geometry = node.geometry.clone().applyMatrix4(matrix);
  });
  fittedTemplates.set(cacheKey, root);
  return root;
}

// Match the existing procedural part's footprint and pivot, retaining its placement.
export function modelForMesh(source, key) {
  source.geometry.computeBoundingBox();
  const group = fitted(key, source.geometry.boundingBox).clone(true);
  group.position.copy(source.position);
  group.quaternion.copy(source.quaternion);
  group.scale.copy(source.scale);
  return group;
}

export function modelForInstances(source, key) {
  if (!source || !source.count) return new THREE.Group();
  source.geometry.computeBoundingBox();
  const template = fitted(key, source.geometry.boundingBox);
  const group = new THREE.Group();
  group.name = `instances-${key}`;
  group.userData.modelAsset = key;
  template.traverse((part) => {
    if (!part.isMesh) return;
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, source.count);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < source.count; i += 1) {
      source.getMatrixAt(i, matrix);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.castShadow = source.castShadow;
    mesh.receiveShadow = source.receiveShadow;
    group.add(mesh);
  });
  group.position.copy(source.position); group.quaternion.copy(source.quaternion); group.scale.copy(source.scale);
  source.dispose();
  return group;
}

export function modelInstances(key, matrices) {
  const group = new THREE.Group();
  group.name = `instances-${key}`; group.userData.modelAsset = key;
  if (!matrices.length) return group;
  templates.get(key).traverse((part) => {
    if (!part.isMesh) return;
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, matrices.length);
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.castShadow = part.castShadow; mesh.receiveShadow = part.receiveShadow;
    group.add(mesh);
  });
  return group;
}

// Cached models survive mission switches; per-level instance buffers are disposable.
export function retainModelResources(resources) {
  for (const root of [...templates.values(), ...fittedTemplates.values()]) {
    root.traverse((node) => {
      if (node.geometry) resources.geometries.add(node.geometry);
      if (node.material) resources.materials.add(node.material);
    });
  }
}

export function modelLibraryStats() {
  return { loaded: templates.size, fitted: fittedTemplates.size,
    assets: [...templates].map(([id, root]) => {
      let draws = 0, triangles = 0;
      root.traverse((o) => { if (o.isMesh) { draws++; triangles += o.geometry.attributes.position.count / 3; } });
      return { id, draws, triangles };
    }) };
}
