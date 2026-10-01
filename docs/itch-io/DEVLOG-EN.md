# A new look for UFO Cow Hunt: 39 models, three refreshed worlds

The latest visual update gives UFO Cow Hunt a much more consistent low-poly look —
from the little alien in the cockpit to the landscapes underneath the saucer.
The idea was to make every world feel like part of the same game while keeping the
arcade action easy to read.

![Blender key art featuring the actual UFO and animal models](media/banner-1920x1080.png)

## One model library for the whole game

The game now uses a coordinated library of **39 models created in Blender**. That
includes the UFO, cows, camels, polar bears, three bonus characters, patrol drones,
energy pickups, buildings, plants and landscape props.

The Scout-07 UFO combines a pale ceramic hull with copper details, a glowing engine
rim and a glass cockpit with a visible pilot. The animals have clearer silhouettes,
and scenery uses the same restrained palette and chunky forms.

![All 39 game models together in the Blender catalogue](media/models-overview.png)

*Behind the scenes: the complete Blender catalogue. Models are arranged at display
scales so even small props are visible; this is a studio render, not a gameplay view.*

![The redesigned Scout-07 UFO in a Blender studio render](media/ufo-studio.png)

## More character in each world

**Farm Night** keeps its rolling green landscape, ponds and moonlit farm buildings.
Small wildflower patches and floating light motes add a little life around the fields.

![Farm Night — actual browser gameplay](media/gameplay-farm.jpg)

**Desert Hunt** now has more pronounced dunes and irregular sandstone formations
instead of repeated block rows around the edge. Subtle wind patterns, scattered
stone groups and drifting dust help the sand feel less empty.

![Desert Hunt — actual browser gameplay](media/gameplay-desert.jpg)

**Ice Drift** gets snowdrifts, snow-capped ice peaks and smoother transitions around
frozen lakes. Small ice-colored stones and gently drifting snow finish the scene.

![Ice Drift — actual browser gameplay](media/gameplay-ice.jpg)

## Smoother ground, fewer distractions

The ground needed its own pass. Hard color boundaries and visible triangle shading
made some surfaces look rough and pixelated. Ground colors and lighting now blend
more smoothly, and fine sand/snow patterns fade with distance instead of turning into
flickering stripes. Final-image anti-aliasing and better contact-shadow filtering
help keep the image clean while the objects retain their low-poly character.

## Keeping the browser build lean

The entire model library contains **21,480 unique triangles** and exports to a
**1.96 MB GLB**. Repeated props share geometry, static scenery is batched, and each
world's ambient particles use one draw call. The desert and ice ground meshes each
stay at 25,088 triangles, including the new terrain shapes.

This is not a promise of a particular frame rate on every device. It is a way to
keep the artwork within clear budgets while improving the look. The update has
passed automated checks through all three missions in both rendering modes,
including repeated level changes to check resource cleanup.

## Same questionable mission

There are still three timed waves per mission: 10, 15 and 20 animals. Fly, beam up
targets, collect energy, find the hidden bonus character and keep clear of patrol
drones. The visual update keeps those rules intact.

**Which world is your favorite: the farm, desert or ice?** Feedback on readability
and performance is especially useful — include your browser and device if something
looks wrong or runs slowly.
