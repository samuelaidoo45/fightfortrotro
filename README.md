# Fight for Trotro

A playable browser prototype of a 3D arena fighting game about reaching the last seat in a trotro, with ten fighters, Easy/Normal/Hard, contested boarding and six Accra-inspired districts.

Version 1.0, **The Accra Circuit**, makes City Journey the default: 18 encounters across six districts. Every district has a queue clash (knock down two different rivals), seat defence (interrupt or knock down three different rivals), and a captain showdown. Complete the objective before boarding; a single shove cannot skip the encounter. Missed buses preserve objective progress and enemy damage.

Every successful ride banks progress. Defeat retries only the current encounter with at least 70 health, keeping completed encounters and the build. Between rides, choose from eight upgrades with three active slots, replacing one when full. Recover health, arrive with a full special, or accept harder hits for a score bonus. Conditions change each encounter. Endless Commute continues beyond the campaign with capped enemy counts and difficulty scaling; Quick ride preserves the original three-stop arcade run.

City Journey and Endless each have an independent device-local checkpoint. Leaving mid-fight resumes from the **start of that encounter**, not the exact combat frame. Travel choices save immediately. Career XP, seven ranks, fighter mastery, eight badges and personal daily records also persist. A completed-encounter ledger prevents duplicate XP on reload; campaign losses and practice award no XP. All fighters and upgrades are available immediately, with no paid upgrades or login rewards.

Ten selectable commuters have distinct human models, starting gear and modest play-style bonuses. Three confirmed combo routes lead to launchers, spinning kicks and shoulder drives. Heavy attacks, low sweeps, throws, counters, air juggles and a three-hit cinematic special provide the combat vocabulary. A practice mode and paused move list help learn timing.

Rivals now compete for the last seat: they hold the doorway, then rush to board. Interrupt the highlighted rival with an attack or shove. If they board first, the bus leaves full and you fight for the next arrival, keeping health, gear and score. Passing traffic, curbside bus movement and six Accra-inspired arenas remain part of the game.

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

- `dist/campaign.js`: saved City Journey and Endless progression, encounter objectives, travel choices and validated checkpoints.
- `dist/journey.js`: conditions, upgrades, captains, seeded daily routes and career rewards.
- `dist/campaign-ui.css`: campaign menu, district map, travel decisions and responsive layouts.
- `tests/campaign.test.mjs`: campaign completion, objective gates, retries, three-slot builds, checkpoint validation, reward deduplication and 40-encounter endless progression.
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

`npm run check` and 96 Node tests cover combat, rigs, traffic, bus cycles, the complete 18-encounter campaign, 40 endless encounters, objective gates, captain defeat, upgrades, recovery, save validation and reward deduplication. Browser QA verified two distinct knockdowns, an encounter retry, missed buses preserving objective progress, winning a seat, upgrade/travel selection and restoring those choices after reload. The travel dialog was checked at 390 × 844. Long-term retention, broad device compatibility and combat balance still need real-player testing.

## Design tokens

Route-board gold `#f3b942`, night blue `#12191d`, light stone `#ece8de`, steel blue `#315563`, and muted grey `#a5aaa9`. Barlow Condensed carries the game title and timers; Barlow carries instructions and controls. The full-window arena and a human commuter form the menu background. A compact left menu opens the rush; stops form a route strip at the foot of the screen. Combat uses readable wind-ups, a small player ring, damage feedback, and a persistent door marker.
