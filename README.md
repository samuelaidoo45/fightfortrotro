# Fight for Trotro

A playable browser prototype of a 3D arena fighting game about reaching the last seat in a trotro, with ten fighters, Easy/Normal/Hard, contested boarding and six Accra-inspired districts.

Version 1.4, **New Trotro, New Crowd**, replaces the entire crowd whenever a new vehicle starts arriving. Old passengers, including defeated bodies, are removed from the scene. Fresh passengers have new identities, rotated appearances and equipment, and full health. Fight progress resets for that vehicle; player health, equipment, score, special charge and journey progress carry over. Full arrivals bring a waiting crowd, with combat starting only when a bus has a free seat. Captain encounters bring a fresh captain with the new crowd.

The free-for-all crowd fight continues. Rivals choose nearby opponents, retaliate against attackers and challenge passengers trying to board. They damage and defeat one another with visible wind-ups, blocks, knockback and impact effects. Their knockouts count toward clearing the fight but do not award the player kills, points, special charge or captain rewards. Attacks stay locked onto their chosen target through wind-up, and the difficulty limit still caps attackers targeting the player. Combat stays near the stop.

The mobile arena remains clear: a small health/timer strip, thumb joystick, four combat buttons and one contextual action replace the stacked overlays. Game options expand from the menu, and objectives/move details live in Pause.

Be the last fighter standing to board through either the door or window; defeated rivals stay down until the next vehicle arrives. Early window attempts can be pulled down and cannot finish boarding while any rival is alive. Shove the watching conductor or wait for him to look away, then vault for 20 stamina. Nearby rivals telegraph a grab and can pull you down for 5 damage. Hold Fight (J) while climbing to kick them away for 12 stamina. Rivals alternate between door and window attempts; hit, throw or shove them before they claim the seat. The contextual button offers Pull rival down when within throwing range of a window climber. A stolen seat or departing bus cancels your climb.

Enemy damage is reduced by 35%, with 0.65 seconds of protection after an unblocked hit. Four seconds without damage, away from the doorway or between buses, restores 3 health per second up to 70. Clearing a vehicle’s crowd adds 12 health and eight boarding seconds once for that vehicle. The mate calls the destination on arrival using available device speech, alongside engine/brake and combat effects.

Street tricks and crowd dares remain: R kicks a luggage trolley or tips a cooler into a trip zone. Props reset for the next bus. Dares reward health, stamina, score and special charge; they no longer unlock the door. Dodge cancels attack recovery after contact. Repeated jabs provoke guards on Normal/Hard, and one critical-health comeback fills special and stamina. Replacement buses return faster. Existing saved journeys continue to work.

City Journey has 18 encounters across six districts, alternating queue fights, boarding scrambles and captain encounters. Every new vehicle resets its crowd and boarding objective while preserving the player’s earned progress.

Every successful ride banks progress. Defeat retries only the current encounter with at least 70 health, keeping completed encounters and the build. Between rides, choose from eight upgrades with three active slots, replacing one when full. Recover health, arrive with a full special, or accept harder hits for a score bonus. Conditions change each encounter. Endless Commute continues beyond the campaign with capped enemy counts and difficulty scaling; Quick ride preserves the original three-stop arcade run.

City Journey and Endless each have an independent device-local checkpoint. Leaving mid-fight resumes from the **start of that encounter**, not the exact combat frame. Travel choices save immediately. Career XP, seven ranks, fighter mastery, eight badges and personal daily records also persist. A completed-encounter ledger prevents duplicate XP on reload; campaign losses and practice award no XP. All fighters and upgrades are available immediately, with no paid upgrades or login rewards.

Ten selectable commuters have distinct human models, starting gear and modest play-style bonuses. Three confirmed combo routes lead to launchers, spinning kicks and shoulder drives. Heavy attacks, low sweeps, throws, counters, air juggles and a three-hit cinematic special provide the combat vocabulary. A practice mode and paused move list help learn timing.

Rivals now compete for the last seat: they guard the stop, then race through either the door or window. Interrupt the highlighted rival with an attack or shove. If they board first, the bus leaves full and you fight for the next arrival, keeping health, gear and score. Passing traffic, curbside bus movement and six Accra-inspired arenas remain part of the game.

The camera follows from behind the player and keeps the entrance in view. Subtitled mate calls, engine/brake effects, a last-call countdown and a sliding door signal each phase. Spoken calls prefer a Ghanaian English device voice, then another English voice; availability depends on the browser and device. Textured, rigged Microsoft Rocketbox models supply natural human proportions and skeletal movement. The environment remains an original Accra-inspired interpretation, not a surveyed or fully photorealistic reconstruction. See [the game design](docs/GAME_DESIGN.md).

## Run

Requires Node 18 or newer. No installation or build step is needed; runtime dependencies are included.

```sh
npm start
```

Open http://127.0.0.1:4173. Set `TROTRO_PORT` to use a separate preview origin when testing cached assets. The `dist/` directory can also be served by any static web server. ES modules require HTTP rather than opening index.html directly.

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
| Board at the glowing door after clearing all rivals | Hold E |
| Vault through the window / kick grabbers away | G / hold J |
| Street trick / equip a weapon / drink | R |
| Pause | Esc or P |

Touch controls use a camera-relative joystick, hold-to-combo Fight, Guard, Dodge, Special and a contextual action. They appear on narrow screens and devices with a coarse pointer. Audio can be muted. Pausing freezes the simulation; switching tabs pauses automatically. Escape closes the result screen and returns to the lobby. Personal best home-run scores are stored only in the browser, per starting stop, difficulty and character. Career and daily records are also device-local; clearing browser data removes them. Daily records retain the most recent 30 dates. No global leaderboard or cloud save is implied. Sound starts enabled and can be muted in the menu or pause screen.

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

Full buses close their doors and leave. In player runs, transit is accelerated: a full-bus notice to the next available bus takes 6.7 seconds (1.2 full, 1.6 departing, 2.1 waiting, 1.8 arriving). A stolen seat uses a shorter 0.8-second notice, for 6.3 seconds total. Preparation and transit do not spend the boarding window or challenge timer. Before stop-rule modifiers, an available bus stays 38/32/26 seconds on Easy/Normal/Hard. Rivals begin rushing to board after 9/7/5.5 seconds. Their boarding attempts take 3.4/2.9/2.5 seconds; interrupting resets the race delay. Every replacement removes the old crowd and creates fresh passengers. The old fight’s knockdowns do not unlock the new vehicle. Stay alive and keep trying if a bus leaves.

## Source

- `dist/street.js`: physical street tricks, rotating crowd dares, bonus rewards and one-use comebacks.
- `tests/street-play.test.mjs`: trick collisions, reward eligibility, varied attacks, dodge cancellation, anti-spam guards and faster bus returns.
- `dist/campaign.js`: saved City Journey and Endless progression, encounter objectives, travel choices and validated checkpoints.
- `dist/journey.js`: conditions, upgrades, captains, seeded daily routes and career rewards.
- `dist/campaign-ui.css`: campaign menu, district map, travel decisions and responsive layouts.
- `tests/campaign.test.mjs`: campaign completion, objective gates, retries, three-slot builds, checkpoint validation, reward deduplication and 40-encounter endless progression.
- `dist/layout.js`: shared curb, door, guard posts, traffic lanes and bus movement paths.
- `tests/crowd-arrivals.test.mjs`: new identities, state resets, full-bus waiting, repeated arrivals and removal of old scene objects.
- `dist/crowd.js` and `tests/crowd.test.mjs`: rival targeting, retaliation, crowd damage, interruption and knockout attribution.
- `dist/boarding.js` and `dist/mobile.js`: contested window climbing and compact touch controls.
- `tests/mobile-boarding.test.mjs`: window/door competition, interruption, health and touch helpers.
- `dist/core.js`: rendering-independent AI, boarding competition, collision, pickups and round outcomes.
- `dist/combat.js`: move timing, buffered input, confirmed branches, guards, counters and air juggles.
- `dist/characters.js`: ten playable commuters, model mapping, starting equipment and perks.
- `dist/traffic.js`: lane movement, spacing and traffic wrapping.
- `dist/stage.js`: environment and minibus geometry, physical materials, Three.js rendering, camera and impact effects.
- `dist/humans.js`: licensed human models, skeletal animation, independent crowd rigs, and two-bone arm/leg posing for combat.
- `dist/game.js`: input, menus, HUD, sound, pause and local records.
- `dist/game-ui.css`: full-screen menu, responsive game HUD, dialogs and touch controls.
- `tests/street-challenge.test.mjs`: traffic movement/spacing, charge, score streaks, timed rewards, heavy attacks and last-call cues.
- `tests/roadside.test.mjs`: preparation, gathering, all-rival door gating, regrouping, full-bus waiting and parallel-bus geometry.
- `tests/core.test.mjs`: behavioral tests for the game rules.
- `tests/combat.test.mjs`: combo timing, guard interaction, counter windows, juggling, interruptions and boarding races.
- `tests/characters.test.mjs`: roster uniqueness, equipment/appearance carry-over and working perks.
- `tests/buses-weapons.test.mjs`: full-bus lifecycle, missed arrivals, capacity, weapon reach, damage, crowd coverage, stamina and carry-over tests.
- `dist/vendor/`: Three.js r170 (MIT), Barlow and Barlow Condensed (SIL Open Font License); license texts included.
- `dist/assets/`: local models, animation, textures and credits. Human models/motion are Microsoft Rocketbox (MIT); Asphalt 02 by Rob Tuytel / Poly Haven is CC0. See `assets/CREDITS.txt` and the included notices.
- `scripts/realism-sources.json`: pinned source revision and asset URLs. Developers can use `fetch-realism-assets.mjs` (Node 22+) then `convert-character-textures.py` (Pillow) to refresh local assets. Raw TGA downloads go to a temporary folder, outside the repository.

There is no backend, player tracking, paid API, or Google Maps key. The Maps links use Google's documented universal URL format. No Google Street View imagery or extracted map geometry is packaged. Arena designs are approximate creative interpretations, not location reconstructions. The narration and key scenes of [Why Lagos Bus Stops Turn Into a Fight](https://www.youtube.com/watch?v=NQvoIqS8W8c) informed the roadside waiting and scramble sequence. It is an illustrated Lagos explainer; its footage or illustrations are not packaged as game assets.

## Verified in this build

`npm run check` and 140 Node tests cover combat, journeys, saves, traffic, knockdowns lasting until the next arrival, fresh-crowd resets, bounded scene replacement, the all-rival door gate, last-standing window gating, rival target selection and retaliation, NPC damage and reward isolation, conductor rebuffs, rival grabs, kick escapes, window-rival interruptions, seat theft during a vault, safer health tuning, joystick math and assisted combos. Version 1.2 browser QA checked the compact menu, pause/move list, joystick and held Fight control, window-climb rendering and contextual rival-window interruption at 390 × 844, 360 × 740 and 844 × 390, with no logged errors or warnings. Real-device audio, touch ergonomics across devices and long-term retention still need player testing.

## Design tokens

Route-board gold `#f3b942`, night blue `#12191d`, light stone `#ece8de`, steel blue `#315563`, and muted grey `#a5aaa9`. Barlow Condensed carries the game title and timers; Barlow carries instructions and controls. The full-window arena and a human commuter form the menu background. A compact left menu opens the rush; stops form a route strip at the foot of the screen. Combat uses readable wind-ups, a small player ring, damage feedback, and a persistent door marker.
