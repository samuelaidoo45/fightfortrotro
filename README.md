# Fight for Trotro

A playable browser prototype of a 3D arena fighting game about reaching the last seat in a trotro. Six original Accra-inspired environments, Easy/Normal/Hard, third-person combat, crowd AI, stamina, pickups, and timed boarding.

This prototype uses simplified, independently constructed models. The proposed photorealistic production game and the plan for expanding to Accra's stops are in [the game design](docs/GAME_DESIGN.md).

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
- `dist/stage.js`: original procedural scene and character models, Three.js rendering, camera, animation and impact effects.
- `dist/game.js`: input, menus, HUD, sound, pause and local records.
- `dist/style.css`: responsive lobby, game HUD, dialogs and touch controls.
- `tests/core.test.mjs`: behavioral tests for the game rules.
- `dist/vendor/`: Three.js r170 (MIT), Barlow and Barlow Condensed (SIL Open Font License); license texts included.

There is no backend, player tracking, paid API, or Google Maps key. The Maps links use Google's documented universal URL format. No Google Street View imagery or extracted map geometry is packaged. Arena designs are approximate creative interpretations, not location reconstructions. The referenced YouTube clip could not be retrieved during this build, so the gameplay is based on the creator's written description.

## Verified in this build

JavaScript syntax checks and all nine game-rule tests pass. Browser QA covered the narrow touch layout and a 1440 × 900 desktop layout, arena switching, difficulty selection, instructions, keyboard movement/strike/dodge, pause/resume, and a complete Easy escape through the boarding result screen. The completed escape took 10.3 seconds with 97 health remaining. No browser warnings or errors were reported during that run. Broad device compatibility, sustained performance, and combat balance still need playtesting.

## Design tokens

Trotro blue `#2d8698`, route-board gold `#ffcf49`, deep blue ink `#122b34`, warm paper `#fff8e9`, weathered grey `#56666a`. Barlow Condensed carries the game title and timers; Barlow carries instructions and controls. A full-window 3D arena is the visual focus. Lobby content sits to the left; stops form a single route strip below. Combat is communicated through readable wind-ups, a player ring, damage feedback, and a persistent door marker.
