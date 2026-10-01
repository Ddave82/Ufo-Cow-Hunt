import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { loadModelLibrary, createModel, modelForMesh, modelForInstances, retainModelResources, modelLibraryStats } from '../src/models/library.js';
import { createUfo } from '../src/models/ufo.js';

const buffer = readFileSync(new URL('../assets/models/library/models.glb', import.meta.url));
await loadModelLibrary(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
const stats = modelLibraryStats();
assert.equal(stats.loaded, 39);
const manifest = JSON.parse(readFileSync(new URL('../assets/models/library/manifest.json', import.meta.url), 'utf8'));
for (const asset of stats.assets) {
  assert.equal(asset.triangles, manifest.assets[asset.id].triangles, `${asset.id}: export lost faces`);
  assert(asset.triangles <= (asset.id === 'ufo' ? 4500 : 3000), `${asset.id}: geometry budget`);
  assert(asset.draws <= (asset.id === 'ufo' ? 6 : asset.id === 'drone' ? 7 : 4), `${asset.id}: draw budget`);
  const model = createModel(asset.id);
  model.traverse((part) => {
    if (!part.isMesh) return;
    for (const attribute of ['position','normal','color']) {
      assert(part.geometry.attributes[attribute], `${asset.id}: missing ${attribute}`);
      for (const value of part.geometry.attributes[attribute].array) assert(Number.isFinite(value), `${asset.id}: invalid ${attribute}`);
    }
  });
  const box = new THREE.Box3().setFromObject(model);
  assert(!box.isEmpty() && box.getSize(new THREE.Vector3()).length() > 0, `${asset.id}: empty bounds`);
}
const ufo = createUfo();
for (const key of ['rim','trail','engineGlow','boostGlow']) assert(ufo[key], `Missing ${key}`);
assert(new THREE.Box3().setFromObject(ufo.group).getSize(new THREE.Vector3()).x <= 9.8);
const hull = ufo.group.children.filter(o=>o.isMesh && !o.material.transparent);
ufo.group.updateMatrixWorld(true);
const hits = new THREE.Raycaster(new THREE.Vector3(2.3,20,18), new THREE.Vector3(0,-1,0)).intersectObjects(hull);
assert(hits.some(hit=>hit.face.normal.y > 0), 'Hull top winding');
for (const id of ['cow','camel','polar_bear']) {
  const box = new THREE.Box3().setFromObject(createModel(id));
  assert(Math.abs(box.min.y) < 0.04, `${id}: feet must touch the ground`);
  assert(box.max.x < 2.5 && box.min.x > -1.7, `${id}: footprint`);
}
const drone = createModel('drone');
assert(drone.getObjectByName('joint_rotor_-1'));
assert(drone.getObjectByName('joint_rotor_1'));
assert(createModel('windmill').getObjectByName('joint_rotor'));
// Placement adapters must preserve bounds, instance transforms and shared resources.
const source = new THREE.Mesh(new THREE.BoxGeometry(4.6,1.2,1.5), new THREE.MeshStandardMaterial());
const fitted = modelForMesh(source,'ice_block');
const targetBox = new THREE.Box3().setFromObject(source);
const fitBox = new THREE.Box3().setFromObject(fitted);
assert(targetBox.min.distanceTo(fitBox.min)<1e-5 && targetBox.max.distanceTo(fitBox.max)<1e-5);
const instance = new THREE.InstancedMesh(source.geometry,source.material,2);
const matrix = new THREE.Matrix4().makeTranslation(3,4,5);
instance.setMatrixAt(0,matrix); instance.setMatrixAt(1,new THREE.Matrix4().makeTranslation(-2,1,0));
const instanced = modelForInstances(instance,'ice_block');
const actual = new THREE.Matrix4();
instanced.children[0].getMatrixAt(0,actual);
assert.deepEqual(actual.elements,matrix.elements);
const retained = {geometries:new Set(),materials:new Set()};
retainModelResources(retained);
assert(retained.geometries.has(instanced.children[0].geometry));
console.table(stats.assets);
console.log(`PASS: ${stats.loaded} Blender assets, ${stats.assets.reduce((sum,a)=>sum+a.triangles,0)} unique triangles; valid pivots, instance placement, shared resources and UFO bindings.`);
