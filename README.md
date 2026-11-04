# Fight for Trotro

A playable browser prototype of a 3D arena fighting game about reaching the last seat in a trotro. A three-stop home run across six Accra-inspired environments, Easy/Normal/Hard, doorway rivals, defenders who hold their entrance posts, crowd combat, stamina, pickups, and contested boarding.

Version 0.9, **Rush Hour**, adds a replayable run structure: three different stop conditions, eight possible upgrades (choose one after each of the first two rides), and one of three final captains. Mix four moves or defensive actions within six seconds to trigger Rush. Throws and heavy finishers can crash rivals into nearby passengers. Interrupting a boarding rival buys time and earns points. Damage dealt persists across missed buses.

The daily route fixes the fighter, difficulty, conditions and random seeds for that UTC day, with personal bests on this device. Career XP, seven ranks, four fighter-mastery titles and six achievement badges persist in local storage. Practice awards no XP. Every fighter and run upgrade is available immediately; there are no paid upgrades or login rewards. The first trotro at each stop arrives with space in 3.6 seconds.

Ten selectable commuters have distinct human models, starting gear and modest play-style bonuses. Three confirmed combo routes lead to launchers, spinning kicks and shoulder drives. Heavy attacks, low sweeps, throws, counters, air juggles and a three-hit cinematic special provide the combat vocabulary. A practice mode and paused move list help learn timing.

Rivals now compete for the last seat: they hold the doorway, then rush to board. Interrupt the highlighted rival with an attack or shove. If they board first, the bus leaves full and you fight for the next arrival, keeping health, gear and score. Passing traffic, curbside bus movement, three-stop runs and six Accra-inspired arenas remain part of the game.

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
| Light / heavy / kick / throw | J / I / U / O |
| Combo routes | J J I / J U U / U J I |
| Low sweep / flying knee | S + U / W + U |
| Power shove / clear the entrance | F |
| Last Seat Special (full charge, close to a rival) | Q |
| Switch focus / paused move list | Tab / M |
| High / low block | K / S + K |
| Dodge | L or Space |
| Board at the glowing door | Hold E |
| Equip a weapon or drink | R |
| Pause | Esc or P |

Touch controls appear on narrow screens and devices with a coarse pointer. Audio can be muted. Pausing freezes the simulation; switching tabs pauses automatically. Escape closes the result screen and returns to the lobby. Personal best home-run scores are stored only in the browser, per starting stop, difficulty and character. Career and daily records are also device-local; clearing browser data removes them. Daily records retain the most recent 30 dates. No global leaderboard or cloud save is implied. Sound starts enabled and can be muted in the menu or pause screen.

## Fight for the opening

Combos, knockdowns, perfect blocks and live dodges charge Last Seat Special. Q delivers three timed strikes; the final hit launches nearby rivals. Each move has startup, contact and recovery. Two buffered inputs can form a confirmed combo branch; whiffs and guarded hits do not advance the route. After a launcher, follow with light strikes or kicks for a capped air juggle. The focused rival displays health and guard. Sweeps and throws bypass high guard; heavy strikes break it. A perfect block or live dodge opens a launching I counter.

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

Full buses close their doors and leave. From the full-bus notice, the next available bus parks after 13.4 seconds: 2.4 seconds full, 3.2 departing, 4.2 waiting and 3.6 arriving. Preparation and transit do not spend the boarding window or challenge timer. Before stop-rule modifiers, an available bus stays 38/32/26 seconds on Easy/Normal/Hard. Rivals begin rushing to board after 9/7/5.5 seconds. Their boarding attempts take 3.4/2.9/2.5 seconds; interrupting resets the race delay. Every replacement reforms the doorway crowd, keeping damage dealt to existing rivals. A passenger who boarded is replaced by a fresh rival. Stay alive and keep trying if a bus leaves.

## Source

- `dist/layout.js`: shared curb, door, guard posts, traffic lanes and bus movement paths.
- `dist/core.js`: rendering-independent AI, boarding competition, collision, pickups and round outcomes.
- `dist/combat.js`: move timing, buffered input, confirmed branches, guards, counters and air juggles.
- `dist/characters.js`: ten playable commuters, model mapping, starting equipment and perks.
- `dist/traffic.js`: lane movement, spacing and traffic wrapping.
- `dist/stage.js`: environment and minibus geometry, physical materials, Three.js rendering, camera and impact effects.
- `dist/humans.js`: licensed human models, skeletal animation, independent crowd rigs, and two-bone arm/leg posing for combat.
- `dist/game.js`: input, menus, HUD, sound, pause and local records.
- `dist/game-ui.css`: full-screen menu, responsive game HUD, dialogs and touch controls.
- `tests/street-challenge.test.mjs`: traffic movement/spacing, charge, score streaks, timed rewards, heavy attacks and last-call cues.
- `tests/roadside.test.mjs`: preparation, gathering, zero-knockdown boarding, regrouping, full-bus waiting and parallel-bus geometry.
- `tests/core.test.mjs`: behavioral tests for the game rules.
- `tests/combat.test.mjs`: combo timing, guard interaction, counter windows, juggling, interruptions and boarding races.
- `tests/characters.test.mjs`: roster uniqueness, equipment/appearance carry-over and working perks.
- `tests/buses-weapons.test.mjs`: full-bus lifecycle, missed arrivals, capacity, weapon reach, damage, crowd coverage, stamina and carry-over tests.
- `dist/vendor/`: Three.js r170 (MIT), Barlow and Barlow Condensed (SIL Open Font License); license texts included.
- `dist/assets/`: local models, animation, textures and credits. Human models/motion are Microsoft Rocketbox (MIT); Asphalt 02 by Rob Tuytel / Poly Haven is CC0. See `assets/CREDITS.txt` and the included notices.
- `scripts/realism-sources.json`: pinned source revision and asset URLs. Developers can use `fetch-realism-assets.mjs` (Node 22+) then `convert-character-textures.py` (Pillow) to refresh local assets. Raw TGA downloads go to a temporary folder, outside the repository.

There is no backend, player tracking, paid API, or Google Maps key. The Maps links use Google's documented universal URL format. No Google Street View imagery or extracted map geometry is packaged. Arena designs are approximate creative interpretations, not location reconstructions. The narration and key scenes of [Why Lagos Bus Stops Turn Into a Fight](https://www.youtube.com/watch?v=NQvoIqS8W8c) informed the roadside waiting and scramble sequence. It is an illustrated Lagos explainer; its footage or illustrations are not packaged as game assets.

## Verified in this build

JavaScript syntax checks and 66 behavioural/rig tests cover combat timing, boarding races, character perks, bus cycles, weapons, route progression and traffic. Rig checks load every character, verify animation targets and exercise kick/launch/guard poses. Browser verification covers all ten roster portraits, selected fighter, a confirmed J J I launcher, practice, special, move list and responsive controls. A live run also verified a rival taking the first seat, a guaranteed available replacement, interrupting another boarding attempt, claiming the seat without a knockout, and character/gear/score carry-over to Madina. No current browser console errors or warnings were observed. Broad device compatibility, sustained performance and combat balance still need playtesting.

## Design tokens

Route-board gold `#f3b942`, night blue `#12191d`, light stone `#ece8de`, steel blue `#315563`, and muted grey `#a5aaa9`. Barlow Condensed carries the game title and timers; Barlow carries instructions and controls. The full-window arena and a human commuter form the menu background. A compact left menu opens the rush; stops form a route strip at the foot of the screen. Combat uses readable wind-ups, a small player ring, damage feedback, and a persistent door marker.

# fightfortrotro

## Rush Hour validation

`npm run check` and 83 Node tests cover the original combat, rigs and traffic plus upgrades, fixed daily seeds, captain patterns, crowd crashes, reward idempotency, malformed saves and persistence of enemy damage. Browser QA completed a three-stop run, selected and carried upgrades, used a special to board the last stop, reloaded career progress, and exercised the daily challenge and upgrade selection at 390 × 844. Fun and long-term retention still need observation with real players; these checks establish correct behaviour.
