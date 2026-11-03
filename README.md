# Fight for Trotro

A playable browser prototype of a 3D arena fighting game about reaching the last seat in a trotro. Six Accra-inspired environments, Easy/Normal/Hard, third-person combat, crowd AI, stamina, pickups, and timed boarding.

Version 0.2 replaces the primitive characters with textured, rigged human models from Microsoft Rocketbox. It includes skeletal idle/walk animation, combat arm posing, a closer camera, physical asphalt materials, detailed foliage, and a full-screen game menu. The independently built environment remains approximate; this is not a fully photorealistic recreation of Accra. The production plan is in [the game design](docs/GAME_DESIGN.md).

## Run

Requires Node 18 or newer. No installation or build step is needed; runtime dependencies are included.

```sh
npm start
```

Open http://127.0.0.1:4173. The `dist/` directory can also be served by any static web server. ES modules require HTTP rather than opening index.html directly.

```sh
npm run check
npm test
```

## Controls

| Action | Keyboard |
| --- | --- |
| Move | WASD or arrow keys |
| Strike | J |
| Block | Hold K |
| Dodge | L or Space |
| Board at the glowing door | Hold E |
| Pick up bag or drink | R |
| Pause | Esc or P |

Touch controls appear on narrow screens and devices with a coarse pointer. Audio is optional and starts muted. Pausing freezes the simulation; switching tabs pauses automatically. Escape closes the result screen and returns to the lobby. Personal best times are stored only in the browser, per stop and difficulty.

## Source

- `dist/core.js`: rendering-independent combat, AI, collision, pickups, and round outcomes.
- `dist/stage.js`: environment and minibus geometry, physical materials, Three.js rendering, camera and impact effects.
- `dist/humans.js`: licensed human models, skeletal animation, independent crowd rigs, and two-bone arm posing for combat.
- `dist/game.js`: input, menus, HUD, sound, pause and local records.
- `dist/game-ui.css`: full-screen menu, responsive game HUD, dialogs and touch controls.
- `tests/core.test.mjs`: behavioral tests for the game rules.
- `dist/vendor/`: Three.js r170 (MIT), Barlow and Barlow Condensed (SIL Open Font License); license texts included.
- `dist/assets/`: local models, animation, textures and credits. Human models/motion are Microsoft Rocketbox (MIT); Asphalt 02 by Rob Tuytel / Poly Haven is CC0. See `assets/CREDITS.txt` and the included notices.
- `scripts/realism-sources.json`: pinned source revision and asset URLs. Developers can use `fetch-realism-assets.mjs` (Node 22+) then `convert-character-textures.py` (Pillow) to refresh local assets. Raw TGA downloads go to a temporary folder, outside the repository.

There is no backend, player tracking, paid API, or Google Maps key. The Maps links use Google's documented universal URL format. No Google Street View imagery or extracted map geometry is packaged. Arena designs are approximate creative interpretations, not location reconstructions. The referenced YouTube clip could not be retrieved during this build, so the gameplay is based on the creator's written description.

## Verified in this build

JavaScript syntax checks, nine game-rule tests and three character/animation compatibility tests pass. Character tests verify weighted meshes, required combat joints, matching animation targets, and independent crowd skeletons. Browser QA checks desktop and narrow layouts, gameplay, character poses and the boarding result. Broad device compatibility, sustained performance, and combat balance still need playtesting.

## Design tokens

Route-board gold `#f3b942`, night blue `#12191d`, light stone `#ece8de`, steel blue `#315563`, and muted grey `#a5aaa9`. Barlow Condensed carries the game title and timers; Barlow carries instructions and controls. The full-window arena and a human commuter form the menu background. A compact left menu opens the rush; stops form a route strip at the foot of the screen. Combat uses readable wind-ups, a small player ring, damage feedback, and a persistent door marker.
