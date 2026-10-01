# Changelog

## 2026-10-02 — Smooth UFO ground shadows

- Synchronize the ground shadow with every rendered frame on itch.io.
- Remove duplicate shadow-map rendering during the normal-path GTAO pass.
- Disable redundant canvas MSAA while preserving final-image SMAA.
- Reduce temporary allocations in animal movement safety checks.
- Add a reproducible flight profiler and a one-shadow-update-per-frame regression check.

## 2026-10-02 — Safe animal distribution

- Give every wave fresh animal positions with at least 9.5 units of separation.
- Search other zones and a complete safe-ground grid when a preferred zone is full; never fall back to a duplicate or unchecked position.
- Index actual transformed building, tree, rock and fence footprints once per mission.
- Keep moving animals apart, check their routes and remove end-of-movement teleporting.
- Add regression coverage for crowded zones, obstacles, water, all wave sizes and movement in all three worlds.

## 2026-10-02 — UFO lighting and farm polish

- Exclude transparent engine/beam effects from GTAO to prevent phantom contact shadows.
- Preserve the UFO ground shadow while avoiding stale self-shadowing on its moving hull.
- Remodel oak fence posts and rails in Blender; connect rails, add braces and pasture entrances.
- Mix short perimeter fences with instanced trees, rocks and grass in Farm Night.
- Add an updated overview card and farm scenery captures for the itch.io gallery.

## Unreleased

- Added an illustrated README, English/German itch.io devlogs, current screenshots, Blender cover/banner art and a reproducible HTML-game/press-kit packaging command.

- Smoothed ground color/lighting transitions, added distance-filtered sand/snow patterns, sculpted low dunes and snowdrifts, and blended icy shore heights.
- Added final-image SMAA and improved AO denoising to reduce jagged, grainy ground rendering.
- Added sparse instanced ground details while keeping the terrain mesh budgets unchanged.

- Replaced desert/ice perimeter block rows with natural faceted formations and terrain-following ground accents.
- Added subtle GPU-animated dust, snow and meadow motes, plus instanced wildflowers; respects reduced motion.
- Reduced desert/ice terrain geometry and batched static scenery across prop roots, with render-budget and resource checks.

- Replaced procedural object models with a coordinated 39-asset Blender library: UFO,
  animals, bonus characters, drone, pickups, architecture and scenery in all three missions.
- Added editable Blender sources, a complete preview catalogue and reproducible generation scripts.
- Added material batching, instanced props, shared-resource retention and a model loading state.
- Added asset-budget checks and optional development integration checks for all missions.

- Simplified the main menu flow with direct Play, Select Mission, and Settings actions.
- Reworked mission selection into compact level cards that launch missions directly.
- Added contextual tutorial hints with settings controls to disable or replay the tutorial.
- Expanded energy crystal pickup contact so the UFO rim can collect them.
- Increased the energy crystal pickup sound and lowered the default music volume.
- Changed energy crystals to float at UFO flight height and collect on contact without the beam.
- Added Easy, Normal, and Hard difficulty settings for drone count.
- Reduced drone detection radius slightly.
- Expanded the mission-complete screen with collected animals versus total available animals.
- Added the new Ice Drift mission zone.
- Added collectible polar bears as the Ice Drift wave targets.
- Added snowy terrain, frozen lakes, icebergs, snow pines, ice crystals, and an ice-block igloo.
- Added a polar explorer bonus character for the ice level.
- Updated level selection, HUD text, and README documentation for the third mission zone.

## Previous Updates

- Added Desert Hunt with camels, dunes, oases, Bedouin tents, and a collidable pyramid.
- Added three timed waves per mission with score bonuses and final score breakdowns.
- Added wave timer behavior where time-up advances to the next wave until all three waves are played.
- Improved drone feedback with stronger alarms, HUD flashes, slowdown, and energy drain.
- Added GitHub Pages build support and public README cover artwork.
