import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createUfo } from '../src/models/ufo.js';

const baselineRef = process.argv[2] || 'backup/pre-visual-refresh-2026-09-09';
const baseline = execFileSync('git', ['show', `${baselineRef}:src/main.js`], { encoding: 'utf8' });
const source = baseline.slice(baseline.indexOf('function createUfo() {'), baseline.indexOf('function createBeam() {'));
const oldUfo = new Function('THREE', 'tempObject', `${source}; return createUfo();`)(THREE, new THREE.Object3D());
const newUfo = createUfo();
function stats(ufo) {
  let meshes = 0, triangles = 0, shadowTriangles = 0, transparentMeshes = 0;
  ufo.group.traverse((mesh) => {
    if (!mesh.isMesh) return;
    meshes++;
    const geometry = mesh.geometry;
    const count = (geometry.index?.count ?? geometry.attributes.position.count) / 3 * (mesh.isInstancedMesh ? mesh.count : 1);
    triangles += count;
    if (mesh.castShadow) shadowTriangles += count;
    if (mesh.material.transparent) transparentMeshes++;
    for (const v of geometry.attributes.position.array) assert(Number.isFinite(v));
  });
  return { meshes, triangles, shadowTriangles, transparentMeshes };
}
const before = stats(oldUfo), after = stats(newUfo);
for (const metric of Object.keys(before)) assert(after[metric] <= before[metric], `${metric} regressed`);
assert(after.triangles < before.triangles * 0.4, 'Ship must retain substantial geometry headroom');
for (const key of ['rim', 'trail', 'engineGlow', 'boostGlow']) assert(newUfo[key], `Missing animation binding: ${key}`);
newUfo.group.updateMatrixWorld(true);
const bounds = new THREE.Box3().setFromObject(newUfo.group);
assert(bounds.max.x - bounds.min.x <= 9.8, 'Craft silhouette exceeded original footprint');
// The top shell must be visible from above, rather than inside-out.
const ray = new THREE.Raycaster(new THREE.Vector3(2.3, 20, 18), new THREE.Vector3(0, -1, 0));
const shell = newUfo.group.getObjectByName('scout-ceramic');
const hits = ray.intersectObject(shell);
assert(hits.length > 0 && hits[0].face.normal.y > 0, 'Top hull winding is incorrect');
console.log(JSON.stringify({ baselineRef, before, after }, null, 2));

const current = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
function extract(code, name) {
  const start = code.indexOf(`function ${name}(`);
  assert(start >= 0, `Missing function ${name}`);
  const end = code.indexOf('\nfunction ', start + 1);
  return code.slice(start, end < 0 ? code.length : end);
}
function animalStats(code, name, beveled) {
  const helpers = ['batchOpaqueMeshes', 'hasMovingAncestor', 'geometryAttributeSignature'];
  if (beveled) helpers.push('animalBodyGeometry');
  const functions = [...helpers, name].map((name) => extract(code, name)).join('\n');
  const create = new Function('THREE', 'tempObject', 'RoundedBoxGeometry', 'mergeVertices', 'mergeGeometries',
    `${functions}; const animal = ${name}(0); batchOpaqueMeshes(animal); return animal;`);
  return stats({ group: create(THREE, new THREE.Object3D(), RoundedBoxGeometry, mergeVertices, mergeGeometries) });
}
for (const name of ['createCow', 'createCamel', 'createPolarBear']) {
  const oldAnimal = animalStats(baseline, name, false);
  const newAnimal = animalStats(current, name, true);
  // Maximum wave size: all 20 animals plus the ship. Account for shadow work too.
  const oldTotal = before.triangles + oldAnimal.triangles * 20;
  const newTotal = after.triangles + newAnimal.triangles * 20;
  assert(newTotal < oldTotal, `${name}: maximum-wave geometry regressed`);
  assert(newAnimal.meshes <= oldAnimal.meshes, `${name}: batching regressed`);
  assert(after.shadowTriangles + newAnimal.shadowTriangles * 20 <= before.shadowTriangles + oldAnimal.shadowTriangles * 20,
    `${name}: maximum-wave shadow geometry regressed`);
  console.log(`${name}: 20 animals + ship: ${oldTotal} -> ${newTotal} triangles; animal meshes ${oldAnimal.meshes} -> ${newAnimal.meshes}`);
}
