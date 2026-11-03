# Fight for Trotro

A playable browser prototype of a 3D arena fighting game about reaching the last seat in a trotro. A three-stop home run across six Accra-inspired environments, Easy/Normal/Hard, doorway rivals, defenders who hold their entrance posts, crowd combat, stamina, pickups, and contested boarding.

Version 0.5 adds full buses, replacement arrivals, and five weapon pickups. A full trotro leaves, the crowd steps back, and another bus pulls in; a full bus is always followed by one with a free seat. The capacity indicator and next-arrival countdown explain when to wait. Missing one bus keeps the stop alive until service ends. The entrance remains the fight: knock down the marked doorway rival, push aside the remaining blockers, and enter before they regroup. Opponents stay at the doorway and return to their posts after being displaced; they do not chase the player around or board themselves. Win three stops in one run to get home. Later stops add rivals and increase pressure; health, the equipped weapon, and score carry forward. Characters use textured, rigged Microsoft Rocketbox models with skeletal movement and combat poses. The independently built environment remains approximate; this is not a fully photorealistic recreation of Accra. The production plan is in [the game design](docs/GAME_DESIGN.md).

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
| Strike / connected three-hit combo | Tap or hold J |
| Power shove / clear the entrance | F |
| Block | Hold K |
| Dodge | L or Space |
| Board at the glowing door | Hold E |
| Equip a weapon or drink | R |
| Pause | Esc or P |

Touch controls appear on narrow screens and devices with a coarse pointer. Audio can be muted. Pausing freezes the simulation; switching tabs pauses automatically. Escape closes the result screen and returns to the lobby. Personal best home-run scores are stored only in the browser, per starting stop and difficulty. Sound starts enabled and can be muted in the menu or pause screen.

## Weapons and arrivals

Press R near a labelled pickup. Equipping a new weapon replaces the current one. Weapons persist through bus changes and won stops.

| Weapon | Advantage | Trade-off |
| --- | --- | --- |
| Travel bag | Wide swings hit two rivals | Moderate reach |
| Umbrella | Longest reach, 3.05 m | Lower damage, one target |
| Baton | Fast strikes, low stamina cost | Shorter reach, one target |
| Market stool | Heavy sweep hits three rivals | Slow recovery, high stamina cost |
| Suitcase | Strong knockback, hits two rivals | Slower than bag or baton |

Full buses close their doors and leave. The next bus takes 8.5 seconds from the full-bus notice to parking. Waiting is a chance to collect supplies; defenders step back and do not attack until boarding opens. An available bus stays 34/30/26 seconds on Easy/Normal/Hard. The whole stop has an 85/75/65-second service deadline. Capacity, boarding time and service time appear separately. Defenders regroup for each available arrival.

## Source

- `dist/core.js`: rendering-independent combat, AI, collision, pickups, and round outcomes.
- `dist/stage.js`: environment and minibus geometry, physical materials, Three.js rendering, camera and impact effects.
- `dist/humans.js`: licensed human models, skeletal animation, independent crowd rigs, and two-bone arm posing for combat.
- `dist/game.js`: input, menus, HUD, sound, pause and local records.
- `dist/game-ui.css`: full-screen menu, responsive game HUD, dialogs and touch controls.
- `tests/core.test.mjs`: behavioral tests for the game rules.
- `tests/buses-weapons.test.mjs`: full-bus lifecycle, missed arrivals, capacity, weapon reach, damage, crowd coverage, stamina and carry-over tests.
- `dist/vendor/`: Three.js r170 (MIT), Barlow and Barlow Condensed (SIL Open Font License); license texts included.
- `dist/assets/`: local models, animation, textures and credits. Human models/motion are Microsoft Rocketbox (MIT); Asphalt 02 by Rob Tuytel / Poly Haven is CC0. See `assets/CREDITS.txt` and the included notices.
- `scripts/realism-sources.json`: pinned source revision and asset URLs. Developers can use `fetch-realism-assets.mjs` (Node 22+) then `convert-character-textures.py` (Pillow) to refresh local assets. Raw TGA downloads go to a temporary folder, outside the repository.

There is no backend, player tracking, paid API, or Google Maps key. The Maps links use Google's documented universal URL format. No Google Street View imagery or extracted map geometry is packaged. Arena designs are approximate creative interpretations, not location reconstructions. The referenced YouTube clip could not be retrieved during this build, so the gameplay is based on the creator's written description.

## Verified in this build

JavaScript syntax checks and all 35 tests pass: 32 gameplay/progression checks and three character/animation checks. This version’s browser QA covered a full first bus and an available second arrival, travel-bag and umbrella pickup/replacement, a market-stool fight, a won Easy stop, and desktop/narrow HUD layouts. Earlier QA covered Normal doorway fights and stop progression. Character tests verify weighted meshes, combat joints, matching animation targets and independent crowd skeletons. Broad device compatibility, sustained performance, and combat balance still need playtesting.

## Design tokens

Route-board gold `#f3b942`, night blue `#12191d`, light stone `#ece8de`, steel blue `#315563`, and muted grey `#a5aaa9`. Barlow Condensed carries the game title and timers; Barlow carries instructions and controls. The full-window arena and a human commuter form the menu background. A compact left menu opens the rush; stops form a route strip at the foot of the screen. Combat uses readable wind-ups, a small player ring, damage feedback, and a persistent door marker.
