import assert from 'node:assert/strict';
import { findSpawnSpot, SpawnObstacleIndex } from '../src/gameplay/spawn.js';
const zones = [{ x: 0, z: 0, width: 1, depth: 1 }];
const obstacle = new SpawnObstacleIndex();
obstacle.add({ min: { x: -4, z: -4 }, max: { x: 4, z: 4 } });
assert.equal(obstacle.isClear(6, 0), false, 'Animal footprint must clear the building');
assert.equal(obstacle.isClear(6.5, 0), true);
assert.equal(obstacle.isClear(-6, -6), false, 'Negative spatial cells');
let previous = [];
for (let wave = 0; wave < 3; wave++) {
  const used = [];
  for (let i = 0; i < [10, 15, 20][wave]; i++) {
    // Force every random attempt into the blocked origin: the complete grid
    // must still find distinct, dry spots without relaxing minimum spacing.
    const spot = findSpawnSpot({ zones, used, previous, minDistance: 9.5, limit: 65,
      isSafe: (x, z) => obstacle.isClear(x, z) && !(x > 20 && z > 20), random: () => 0 });
    assert(used.every(p => Math.hypot(p.x - spot.x, p.z - spot.z) >= 9.5));
    assert(previous.every(p => Math.hypot(p.x - spot.x, p.z - spot.z) >= 4));
    assert(obstacle.isClear(spot.x, spot.z));
    assert(!(spot.x > 20 && spot.z > 20), 'Water region');
    used.push(spot);
  }
  previous = used;
}
assert.throws(() => findSpawnSpot({ zones, limit: 2, isSafe: () => false }), /No safe/);
console.log('PASS: crowded-zone fallback, 3 waves, spacing, fresh positions, obstacles, water, impossible map');
