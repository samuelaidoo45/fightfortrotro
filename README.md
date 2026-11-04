# Fight for Trotro

A playable browser prototype of a 3D arena fighting game about reaching the last seat in a trotro. A three-stop home run across six Accra-inspired environments, Easy/Normal/Hard, doorway rivals, defenders who hold their entrance posts, crowd combat, stamina, pickups, and contested boarding.

Version 0.7 implements the roadside scramble. Trotros decelerate into a parallel curbside bay while cars, taxis and buses continue along the road. Every stop begins with a preparation period: choose a weapon, watch the incoming bus and position yourself as passengers gather at its door. Defenders hold their posts and return after being displaced; they never chase the player or board themselves. A shove, counter or combo can create the opening needed to board, with no mandatory knockout. Full buses leave, and the following bus is guaranteed to have space. Health, weapons, pickups and score persist through missed departures; there is no overall service deadline. Win three rides to get home, recovering 25 health between stops. Distinct weapons, timed optional challenges, hit streaks and Crowd Breaker add combat choices.

The camera follows from behind the player and keeps the entrance in view. Subtitled mate calls, engine/brake effects, a last-call countdown and a sliding door signal each phase. Spoken calls use a local English device voice when one is available. Textured, rigged Microsoft Rocketbox models supply natural human proportions and skeletal movement. The environment remains an original Accra-inspired interpretation, not a surveyed or fully photorealistic reconstruction. See [the game design](docs/GAME_DESIGN.md).

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
| Crowd Breaker (at full charge) | Q |
| Block | Hold K |
| Dodge | L or Space |
| Board at the glowing door | Hold E |
| Equip a weapon or drink | R |
| Pause | Esc or P |

Touch controls appear on narrow screens and devices with a coarse pointer. Audio can be muted. Pausing freezes the simulation; switching tabs pauses automatically. Escape closes the result screen and returns to the lobby. Personal best home-run scores are stored only in the browser, per starting stop and difficulty. Sound starts enabled and can be muted in the menu or pause screen.

## Fight for the opening

Combos, knockdowns, perfect blocks and live dodges charge Crowd Breaker. Press Q when ready to knock nearby rivals back, restore stamina and gain four seconds of extra damage. The meter starts at 35 percent each stop. Keeping hits connected builds a score multiplier up to ×3; an unblocked hit or 3.5 seconds without a connection resets it.

Each stop has a different optional 30-second challenge: land two finishers, shove three rivals together, or defend a live attack. The timer runs only while boarding is open. Completion awards 300 points, 15 health and extra charge. A large red wind-up ring warns of the doorway rival’s heavy attack; dodging avoids the damage that leaks through a block. The last eight boarding seconds trigger a last-call cue.

## Weapons and arrivals

Press R near a labelled pickup. Equipping a new weapon replaces the current one. Weapons persist through bus changes and won stops.

| Weapon | Advantage | Trade-off |
| --- | --- | --- |
| Travel bag | Wide swings hit two rivals | Moderate reach |
| Umbrella | Longest reach, 3.05 m | Lower damage, one target |
| Baton | Fast strikes, low stamina cost | Shorter reach, one target |
| Market stool | Heavy sweep hits three rivals | Slow recovery, high stamina cost |
| Suitcase | Strong knockback, hits two rivals | Slower than bag or baton |

Full buses close their doors and leave. From the full-bus notice, the next available bus parks after 13.4 seconds: 2.4 seconds full, 3.2 departing, 4.2 waiting and 3.6 arriving. Preparation and transit do not spend the boarding window or challenge timer. An available bus stays 32/25/19 seconds on Easy/Normal/Hard. Every replacement reforms the doorway crowd. Stay alive and keep trying if a bus leaves.

## Source

- `dist/layout.js`: shared curb, door, guard posts, traffic lanes and bus movement paths.
- `dist/core.js`: rendering-independent combat, AI, collision, pickups, and round outcomes.
- `dist/traffic.js`: lane movement, spacing and traffic wrapping.
- `dist/stage.js`: environment and minibus geometry, physical materials, Three.js rendering, camera and impact effects.
- `dist/humans.js`: licensed human models, skeletal animation, independent crowd rigs, and two-bone arm posing for combat.
- `dist/game.js`: input, menus, HUD, sound, pause and local records.
- `dist/game-ui.css`: full-screen menu, responsive game HUD, dialogs and touch controls.
- `tests/street-challenge.test.mjs`: traffic movement/spacing, charge, score streaks, timed rewards, heavy attacks and last-call cues.
- `tests/roadside.test.mjs`: preparation, gathering, zero-knockdown boarding, regrouping, full-bus waiting and parallel-bus geometry.
- `tests/core.test.mjs`: behavioral tests for the game rules.
- `tests/buses-weapons.test.mjs`: full-bus lifecycle, missed arrivals, capacity, weapon reach, damage, crowd coverage, stamina and carry-over tests.
- `dist/vendor/`: Three.js r170 (MIT), Barlow and Barlow Condensed (SIL Open Font License); license texts included.
- `dist/assets/`: local models, animation, textures and credits. Human models/motion are Microsoft Rocketbox (MIT); Asphalt 02 by Rob Tuytel / Poly Haven is CC0. See `assets/CREDITS.txt` and the included notices.
- `scripts/realism-sources.json`: pinned source revision and asset URLs. Developers can use `fetch-realism-assets.mjs` (Node 22+) then `convert-character-textures.py` (Pillow) to refresh local assets. Raw TGA downloads go to a temporary folder, outside the repository.

There is no backend, player tracking, paid API, or Google Maps key. The Maps links use Google's documented universal URL format. No Google Street View imagery or extracted map geometry is packaged. Arena designs are approximate creative interpretations, not location reconstructions. The narration and key scenes of [Why Lagos Bus Stops Turn Into a Fight](https://www.youtube.com/watch?v=NQvoIqS8W8c) informed the roadside waiting and scramble sequence. It is an illustrated Lagos explainer; its footage or illustrations are not packaged as game assets.

## Verified in this build

JavaScript syntax checks and all 49 tests pass, including six new roadside scenarios. Browser QA verified preparation pickups, a missed departure retaining health and gear, full-bus replacement, crowd gathering, a successful zero-knockdown boarding with 100 health, next-stop score/weapon carry-over, pause/resume, passing traffic, and desktop/phone controls. Character tests verify weighted meshes, combat joints, matching animation targets and independent crowd skeletons. Broad device compatibility, sustained performance and combat balance still need playtesting.

## Design tokens

Route-board gold `#f3b942`, night blue `#12191d`, light stone `#ece8de`, steel blue `#315563`, and muted grey `#a5aaa9`. Barlow Condensed carries the game title and timers; Barlow carries instructions and controls. The full-window arena and a human commuter form the menu background. A compact left menu opens the rush; stops form a route strip at the foot of the screen. Combat uses readable wind-ups, a small player ring, damage feedback, and a persistent door marker.
