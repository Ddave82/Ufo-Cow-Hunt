# itch.io publication kit — 1 October 2026

This folder contains ready-to-use copy and images for the visual update. Nothing in
this kit automatically publishes to itch.io.

## Upload the game

Run `npm run package:itch` from the repository root (Node/npm + Python 3 required).
Upload **`releases/ufo-cow-hunt-itch.zip`**, not the press kit, as the HTML game.
The archive contains `index.html` at its root and all bundled runtime assets with
relative paths. Select the option that makes this file playable in the browser.

Suggested setup: HTML game, desktop keyboard, click to play, fullscreen available.
Do not mark the game mobile-friendly: touch controls are not implemented. Preview
both the embedded and fullscreen versions before making the new upload public.
Use the fresh upload to verify sound after the first click, keyboard focus, mission
selection, beam collection, and the fullscreen resize behavior.

The packaging script validates the archive layout and basic limits; local tests do
not replace checking the actual itch.io iframe. See the official
[HTML5 upload guide](https://itch.io/docs/creators/html5).

## Devlog and page text

- `DEVLOG-EN.md` / `DEVLOG-EN.html`: English public devlog, matching the game UI.
- `DEVLOG-DE.md` / `DEVLOG-DE.html`: German version of the same story.
- `PAGE-COPY.md`: short project-page description and controls.

Open an HTML devlog in a browser for a formatted preview, then copy its text into
the itch.io editor. Upload the local image files there and place them at the matching
captions. Repository-relative image paths will not automatically become itch.io
uploads when you paste text. Review the draft before publishing.

Suggested title: **A new look for UFO Cow Hunt: 39 models, three refreshed worlds**.
Suggested teaser: **A coordinated Blender model library, smoother terrain, and more
character across the farm, desert and ice missions.**

## Images and placement

| File in `media/` | Use | What it actually shows |
| --- | --- | --- |
| `cover-1260x1000.png` | Project cover / thumbnail | Staged Blender key art with real game models |
| `banner-1920x1080.png` | Page or devlog header | Wide Blender key art; not a gameplay screenshot |
| `gameplay-farm.jpg` | Screenshot gallery | Actual current Farm Night gameplay, with HUD |
| `gameplay-desert.jpg` | Screenshot gallery | Actual current Desert Hunt gameplay, with HUD |
| `gameplay-ice.jpg` | Screenshot gallery | Actual current Ice Drift gameplay, with HUD |
| `models-overview.png` | Main behind-the-scenes image | All 39 models in Blender, at normalized display scales |
| `ufo-studio.png` | UFO design detail | Scout-07 Blender studio render |
| `camel-studio.png` | Optional extra behind-the-scenes image | Camel Blender studio render |

Recommended gallery order: desert, farm, ice, model overview, UFO detail. Use the
cover for the thumbnail and the overview prominently inside the devlog. The cover
has a 1.26:1 aspect ratio; the wide artwork is 16:9. Screenshots are unaltered captures
from the current game, not mockups. Render sources are in
`assets/models/library/press-kit.blend` and `library.blend` in the repository.

Suggested theme colors: page `#071C24`, content `#102C35`, text `#E6F5F0`, accents
`#80E5C5`. Use an opaque content background for readable copy. For embedded HTML games,
itch.io may hide the screenshot sidebar by default; place key images in the
body as well. See [itch.io page design](https://itch.io/docs/creators/design).

## Scope and validation

This update covers the coordinated model library, landscape refinement, smoother
surface rendering, ambient motion, final-image anti-aliasing and resource batching.
It does not add missions, multiplayer, touch controls or articulated animal walk cycles.

`npm run check:models` checks the 39 exported models. The development-only
`?modelTest=1` runner checks all three waves of all missions; add
`&forceItchCompat=1` for the compatibility renderer. It advances simulation directly,
so describe it as automated integration testing, not a manual end-to-end playthrough.
No fixed FPS or across-the-board performance percentage is promised.

The separate `releases/ufo-cow-hunt-press-kit.zip` includes this folder's copy and
images. Build outputs are not committed; regenerate them with `npm run package:itch`.
The release manifest records the source commit and SHA-256 hashes for both archives.
