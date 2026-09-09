import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// All rigid details sharing a finish are baked once into a single mesh.
// No textures, environment captures, extra lights, or per-frame allocations.
export function createUfo() {
  const group = new THREE.Group();
  group.name = "Scout-07";
  group.position.set(0, 12, 18);
  const finishes = {
    ceramic: new THREE.MeshStandardMaterial({ color: 0xd6e1dd, metalness: 0.32, roughness: 0.32 }),
    graphite: new THREE.MeshStandardMaterial({ color: 0x172b36, metalness: 0.48, roughness: 0.42 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xe5a668, metalness: 0.45, roughness: 0.35 }),
    light: new THREE.MeshBasicMaterial({ color: new THREE.Color(0x65ffe1).multiplyScalar(1.8) }),
    skin: new THREE.MeshStandardMaterial({ color: 0xa3dd9d, roughness: 0.65, emissive: 0x285234, emissiveIntensity: 0.25 }),
    eyes: new THREE.MeshBasicMaterial({ color: 0x06141c })
  };
  const batches = new Map();
  const transform = new THREE.Object3D();
  function part(finish, geometry, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
    transform.position.set(...position);
    transform.rotation.set(...rotation);
    transform.scale.set(...scale);
    transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);
    if (!batches.has(finish)) batches.set(finish, []);
    batches.get(finish).push(geometry);
  }
  function ring(finish, radius, tube, y, arc = Math.PI * 2, angle = 0) {
    part(finish, new THREE.TorusGeometry(radius, tube, 6, Math.max(4, Math.ceil(48 * arc / (Math.PI * 2))), arc), [0, y, 0], [Math.PI / 2, 0, angle]);
  }
  function shell(finish, profile) {
    part(finish, new THREE.LatheGeometry([...profile].reverse().map(([r, y]) => new THREE.Vector2(r, y)), 48));
  }

  shell("ceramic", [[0, 0.62], [1.55, 0.92], [2.1, 0.86], [3.35, 0.45], [4.34, 0.06], [4.5, -0.08], [4.36, -0.22]]);
  shell("graphite", [[4.36, -0.22], [3.65, -0.58], [2.15, -0.86], [0.95, -0.72], [0, -0.72]]);
  ring("graphite", 4.35, 0.075, -0.12);
  ring("copper", 1.73, 0.09, 0.89);
  ring("graphite", 2.05, 0.038, 0.88);
  ring("light", 1.64, 0.04, 0.95);
  ring("copper", 1.05, 0.09, -0.74);
  ring("light", 0.91, 0.07, -0.8);

  // Clearly separated radial panels and recessed engine slots.
  for (let i = 0; i < 12; i += 1) {
    const a = i / 12 * Math.PI * 2;
    part("graphite", new THREE.BoxGeometry(0.24, 0.055, 0.8),
      [Math.sin(a) * 2.92, 0.62, Math.cos(a) * 2.92], [0, a, 0]);
    part(i % 3 === 0 ? "copper" : "ceramic", new THREE.BoxGeometry(0.085, 0.065, 0.55),
      [Math.sin(a) * 2.91, 0.66, Math.cos(a) * 2.91], [0, a, 0]);
    ring("light", 4.49, 0.05, -0.075, Math.PI / 10, a);
  }
  // Four raised navigation pods give the craft a readable outline from above.
  for (let i = 0; i < 4; i += 1) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    part("graphite", new THREE.CapsuleGeometry(0.19, 0.6, 2, 6),
      [Math.sin(a) * 3.63, 0.32, Math.cos(a) * 3.63], [Math.PI / 2, 0, -a]);
    part("light", new THREE.SphereGeometry(0.12, 8, 4),
      [Math.sin(a) * 3.63, 0.5, Math.cos(a) * 3.63], [0, 0, 0], [1, 0.45, 1]);
  }

  // Cockpit seat, pilot, and instrument panel remain visible through the canopy.
  part("graphite", new THREE.BoxGeometry(0.72, 0.42, 0.48), [0, 1.04, -0.42]);
  part("skin", new THREE.SphereGeometry(0.43, 12, 8), [0, 1.65, 0], [0, 0, 0], [0.88, 1.08, 0.8]);
  part("skin", new THREE.CapsuleGeometry(0.22, 0.28, 2, 8), [0, 1.14, 0]);
  for (const x of [-0.16, 0.16]) {
    part("eyes", new THREE.SphereGeometry(0.1, 8, 6), [x, 1.7, 0.29], [0, 0, x * -1.3], [1, 1.5, 0.45]);
  }
  part("graphite", new THREE.BoxGeometry(0.9, 0.13, 0.4), [0, 1.11, 0.63], [-0.22, 0, 0]);
  part("light", new THREE.BoxGeometry(0.55, 0.025, 0.22), [0, 1.19, 0.63], [-0.22, 0, 0]);

  for (const [finish, geometries] of batches) {
    const mesh = new THREE.Mesh(mergeGeometries(geometries), finishes[finish]);
    geometries.forEach((geometry) => geometry.dispose());
    mesh.name = `scout-${finish}`;
    mesh.castShadow = finish !== "light" && finish !== "eyes";
    mesh.receiveShadow = mesh.castShadow;
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;
    group.add(mesh);
  }

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.54, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { tint: { value: new THREE.Color(0x72dded) } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vec4 p = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = -p.xyz;
          gl_Position = projectionMatrix * p;
        }
      `,
      fragmentShader: `
        uniform vec3 tint;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vec3 n = normalize(vNormal);
          float edge = pow(1.0 - max(dot(n, normalize(vView)), 0.0), 3.0);
          float highlight = pow(max(dot(n, normalize(vec3(-0.5, 0.8, 0.6))), 0.0), 28.0);
          gl_FragColor = vec4(tint * (0.45 + edge * 0.85) + highlight * 0.8,
            0.13 + edge * 0.62 + highlight * 0.25);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    })
  );
  dome.position.y = 0.94;
  dome.scale.y = 0.92;
  group.add(dome);

  // Keep the existing animation contract: rim, trail, engineGlow, boostGlow.
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.04, 5, 48, Math.PI * 1.65), finishes.light);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.65;
  const engineGlow = new THREE.PointLight(0x72fff0, 7.5, 28);
  engineGlow.position.y = -0.35;
  const boostGlow = new THREE.Mesh(new THREE.SphereGeometry(3.15, 24, 8), new THREE.MeshBasicMaterial({
    color: 0x8ffff1, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  boostGlow.scale.set(1.55, 0.18, 1.55);
  boostGlow.position.y = -0.02;
  const trail = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3.2, 12, 1, true), new THREE.MeshBasicMaterial({
    color: 0x86fff0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide
  }));
  trail.rotation.x = Math.PI;
  trail.position.y = -1.8;
  group.add(rim, engineGlow, boostGlow, trail);
  return { group, rim, trail, engineGlow, boostGlow };
}
