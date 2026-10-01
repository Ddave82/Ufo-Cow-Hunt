// Search all zones before falling back to a complete world grid. Safety and
// spacing are invariants: a crowded zone must never force a duplicate spawn.
export function findSpawnSpot({ zones, used = [], previous = [], minDistance = 9.5,
  isSafe, limit, random = Math.random }) {
  const valid = (x, z) => isSafe(x, z) &&
    used.every(p => Math.hypot(p.x - x, p.z - z) >= minDistance) &&
    previous.every(p => Math.hypot(p.x - x, p.z - z) >= 4);
  for (let attempt = 0; attempt < 240; attempt++) {
    const zone = attempt < 60 ? zones[0] : zones[Math.floor(random() * zones.length)];
    const x = zone.x + (random() - 0.5) * zone.width;
    const z = zone.z + (random() - 0.5) * zone.depth;
    if (valid(x, z)) return { x, z };
  }
  const candidates = [];
  for (let x = -limit; x <= limit; x += 2) {
    for (let z = -limit; z <= limit; z += 2) {
      if (valid(x, z)) candidates.push({ x, z });
    }
  }
  if (!candidates.length) throw new Error("No safe, separated spawn position available");
  return candidates[Math.floor(random() * candidates.length)];
}

// Expanded prop footprints, indexed once per mission; movement checks only
// nearby cells instead of traversing rendered meshes every frame.
export class SpawnObstacleIndex {
  cells = new Map();
  add(box, clearance = 2.4) {
    const bounds = { minX: box.min.x - clearance, maxX: box.max.x + clearance,
      minZ: box.min.z - clearance, maxZ: box.max.z + clearance };
    for (let x = Math.floor(bounds.minX / 10); x <= Math.floor(bounds.maxX / 10); x++) {
      for (let z = Math.floor(bounds.minZ / 10); z <= Math.floor(bounds.maxZ / 10); z++) {
        const key = `${x}:${z}`;
        if (!this.cells.has(key)) this.cells.set(key, []);
        this.cells.get(key).push(bounds);
      }
    }
  }
  isClear(x, z) {
    return (this.cells.get(`${Math.floor(x / 10)}:${Math.floor(z / 10)}`) || [])
      .every(b => x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ);
  }
}
