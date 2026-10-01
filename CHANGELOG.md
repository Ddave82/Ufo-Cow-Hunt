# Changelog

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
