# UFO shadow and rendering check — 2026-10-02

The itch.io path throttled the shared shadow map to 30 Hz. Its elapsed-time
comparison skipped additional updates at floating-point boundaries: the fixed
60 Hz test flight produced only 61 shadow updates for 180 displayed frames.
The UFO moved between updates, making its ground silhouette jump. The normal
path regenerated the map twice per frame, including the GTAO normals pass.

Both paths now request one shadow update immediately before the main render.
Automatic updates are disabled so the later normals pass reuses it. The 2048²
map, shadow filter, model geometry and SMAA remain unchanged. Redundant canvas
MSAA is disabled; postprocessing already renders through separate targets and
uses final-image SMAA. Movement safety checks reuse terrain sampling offsets,
early-exit invalid ground and compare squared animal distances without allocating
intermediate arrays each step. Spawn safety and clearance rules are unchanged.

## Chrome before/after sample

One local Chrome run per mode/version, three worlds, 60 warm-up frames followed
by 180 measured frames per world. Fixed flight path and camera, wave-three animals
and moving drones. Normal buffer: 3168×1532; compatibility buffer: 2592×1254.
Animal layouts remain random, so draw counts can vary slightly. CPU values measure
JavaScript simulation/render submission, not GPU execution. This short test does
not establish sustained performance under every background workload.

| Path | World | Shadow updates / 180 frames | Draw calls p50 | Frame p95 (ms) | CPU submission p50 (ms) |
|---|---|---:|---:|---:|---:|
| normal | farm | 360 → 180 | 477 → 358 | 17.6 → 17.6 | 4.3 → 3.9 |
| normal | desert | 360 → 180 | 331 → 246 | 17.7 → 17.5 | 3.2 → 3.1 |
| normal | ice | 360 → 180 | 342 → 265 | 17.6 → 17.6 | 3.8 → 3.1 |
| compat | farm | 61 → 180 | 281 → 366 | 17.6 → 17.5 | 4.0 → 4.0 |
| compat | desert | 61 → 180 | 207 → 250 | 17.5 → 17.6 | 3.4 → 3.0 |
| compat | ice | 61 → 180 | 220 → 271 | 17.7 → 17.7 | 3.4 → 3.2 |

The normal path submits roughly 23–26% fewer draws in this sample. The compatibility
path deliberately does more shadow work to keep motion synchronized; frame cadence
remained around 60 FPS on this machine. There is no claim of an FPS increase from
these vsync-limited measurements or that unrelated system-load hitches are fixed.

## Reproduction and regression

- `npm run check:models` and `npm run check:spawns`.
- Development `/?modelTest=1`, then `/?modelTest=1&forceItchCompat=1`: real shadow
  updates are counted across consecutive frames; expect exactly one per frame.
  The suite also exercises all missions/waves, terrain, spacing and movement,
  abductions, drones, pickups and repeated mission changes.
- Development `/?flightTest=1`, then `/?flightTest=1&forceItchCompat=1`: wait for
  the on-screen report. The scripted flight stops after the final world and
  does not save scores/settings. Profiling includes neither audio nor HUD/radar
  updates, and is a render/movement comparison rather than a full gameplay run.
- Production builds omit both development runners. `?perfDebug=1` remains available
  for observing full gameplay frame times on a particular device.
