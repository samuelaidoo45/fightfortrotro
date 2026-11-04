# Fight for Trotro — version 0.9 — Rush Hour

Win three contested last seats to get home. The same crowd that blocks your entry now competes to board before you. Combat is non-graphic and uses original moves inspired by fighting-game fundamentals: startup, active contact, recovery, confirmed combo branches, guard breaks, low attacks, throws, launchers and air juggles. This is a browser prototype, not a finished AAA production.

## The roadside loop

1. Choose a commuter, difficulty and starting stop. A three-stop route uses six Accra-inspired environments.
2. Start close to the action. The first available trotro pulls in over 3.6 seconds. Prepare on the pavement while traffic passes on separate lanes. Pick up a weapon or water. Trotros pull into a marked bay parallel to the road.
3. If the bus is full, wait. The next bus is guaranteed to have space. When an available bus approaches, passengers gather at the door.
4. Fight for the opening. Rivals guard the doorway and return to their posts after being displaced; they do not chase you across the arena. No knockout is mandatory to board.
5. A rival eventually rushes for the last seat. An orange marker, warning and boarding meter identify the threat. Hit, throw, launch or shove them to cancel their attempt. A stopped attempt delays the next rush by 3.2 seconds.
6. Hold E at the open door to win. If a rival's boarding meter fills first, they disappear into the bus, it becomes full and departs. Keep your health, gear and score, then try the next trotro.
7. Each successful ride banks score and restores 25 health (40 for the nurse). Choose one of three offered upgrades after each of the first two rides. Each stop has a different condition, and the last has a captain. Win three rides; reaching zero health ends the run. There is no separate service-expiry timer.

Before condition and upgrade modifiers, available boarding windows are 38 / 32 / 26 seconds on Easy / Normal / Hard. The first rival rush begins after 9 / 7 / 5.5 seconds, followed by a 3.4 / 2.9 / 2.5-second boarding attempt. The player boards in 1 / 1.1 / 1.2 seconds. A departing full bus guarantees an available replacement. A seat stolen by a rival uses a 1.6-second full-bus notice before the normal 3.2-second departure, 4.2-second wait and 3.6-second arrival.

## Reasons to play another run

The run offers different combat decisions, not just larger health bars. Three distinct conditions are drawn from six: extra boarding time with fewer rivals; a short express window extended by finishers; a larger market crowd with faster shoves; increased special gain against harder-hitting rivals; early boarding attempts with health rewards for interruptions; and fewer tougher rivals vulnerable to stronger throws.

After a successful ride, choose one of three unowned upgrades. Eight upgrades support damage, movement, crowd control, specials, counters, finisher recovery, boarding, or damage resistance. Two choices carry through the run and reset on replay. The next stop's condition and final captain are shown before choosing. Character perks combine with upgrades.

The final captain has a fixed repeating pattern: The Wall (heavy/low/heavy), Quickstep (jab/kick/low), or Big Swing (low/heavy/kick). Captains guard the door rather than taking the seat. A braced captain resists a raw shove; attacks, guard breaks and whiff recovery create an opening. Captain knockouts grant 350 extra points and refill the special meter. Boarding never requires a mandatory knockout.

Four different connected moves or successful defensive actions within a fixed six-second window trigger a six-second Rush: 25% extra damage, full stamina on activation and half-cost dodges. Repeating jab/cross counts as one style. A ten-second cooldown from activation prevents immediate loops. Whiffs grant no style. Throws and finishers can crash a moving rival into up to two passengers for 14 damage and a stagger; each collision target can be rewarded once per launch.

A real boarding interruption grants 100 points, 15 special charge and two extra boarding seconds (five with Door specialist), capped at the base window plus eight seconds. Market scramble adds 12 health. Hit confirmations, not button presses, grant finisher recovery. Counter healing is once per confirmed move. Existing rivals keep their remaining health when a bus leaves; a departed passenger is replaced at full health.

### Career and daily challenge

Career XP is awarded exactly once at a non-practice round result, including a small reward on defeat. Winning a stop gives 120 XP; losing gives 20. Knockdowns add up to 80, interruptions up to 60, a bonus challenge gives 40, and completing the run gives 160 more. Seven rank thresholds: 0, 300, 900, 1800, 3200, 5200 and 8000 XP. Each fighter also earns mastery titles at 0, 450, 1200 and 2400 XP. Six badges track home runs, interrupts, Rush activations, captains, clean boarding and trying the roster.

Daily challenges use a UTC-date seed, fixed Normal difficulty and a fixed fighter. Route generation and upgrade offers use a separate random stream from combat, so spending longer in one fight cannot reroll later offers or spawns. Replays keep the same day until returning to the lobby; a fresh daily start uses the current UTC date. Best score and furthest seat count are saved locally, with no global ranking claims.

All fighters and build options are available from the start. Career rewards recognise mastery without making a new player weaker. There is no streak penalty, login reward or daily currency. Progress stays in the browser; a storage failure is disclosed and retains progress in memory for the current session.

## The fighter roster

Ten fictional commuters use ten separate licensed, textured and rigged human models. Selection includes live-rendered portraits, role, perk and starting gear; the choice persists in local storage. NPCs and waiting passengers also draw from the roster.

| Fighter | Role | Advantage | Starting item |
| --- | --- | --- | --- |
| Kweku | School pupil | 12% faster movement | Bare hands |
| Abena | School pupil | 18% faster stamina recovery | Umbrella |
| Auntie Esi | Market woman | 20% stronger shove displacement | Travel bag |
| Yaw | Construction worker | 12% less damage taken | Bare hands |
| Kojo | Office worker | 15% faster special charge | Suitcase |
| Akosua | Office worker | 30% longer perfect-block window | Umbrella |
| Kwame | Mechanic | 15% lower light/heavy stamina cost | Baton |
| Adjoa | Nurse | Recover 40 health between rides | Travel bag |
| Nii | Footballer | 15% stronger kicks | Bare hands |
| Sena | Delivery rider | 25% lower dodge stamina cost | Travel bag |

These advantages remain deliberately small. Every fighter shares the complete move list. Children use their own child rigs and shorter silhouettes. Current clothing and faces are licensed stock assets, not scans of Accra commuters or bespoke Ghanaian uniforms.

## Combat

| Input | Result |
| --- | --- |
| J | Light jab / cross. Hold for basic repeated strikes. |
| I | Heavy cross; depletes high guard rapidly. |
| U | Roundhouse kick. |
| S + U / W + U | Low sweep / flying knee. Touch: hold ▼ / ▲ and tap Kick. |
| O | Short-range throw; bypasses high guard. |
| J J I | Circle Uppercut: confirmed three-hit route launches. |
| J U U | Roundabout: spinning crowd-clearing finish. |
| U J I | Last Stop: shoulder drive breaks through the crowd. |
| K / S + K | High / low guard. A fresh guard within 0.2 seconds gives a perfect block, except against heavies. |
| L / Space | Directional dodge with brief invulnerability. |
| I after perfect block or live dodge | Launching counter with extra damage. |
| F | Crowd shove: 28 stamina, four-second cooldown. |
| Q at full charge | Last Seat Special: three delayed strikes, final crowd launch, brief protection and camera emphasis. Needs a nearby target. |
| Tab | Cycle nearby focus. A boarding rival is prioritised unless manually overridden. |
| M | Paused move list. |

Each attack has startup and recovery; damage lands at contact rather than immediately on input. The input buffer holds at most two actions. Only confirmed hits permit combo recovery cancels. A miss or a blocked hit cannot advance a route. The visible input trail and move name teach timing. Weapons affect hand-strike reach, power, pace and target count; kicks remain distinct body moves.

An uppercut gives time to follow with J or U. Airborne hits scale down in damage, and a third air hit forces descent. Knockback is integrated over time. Two-bone limb posing, full-body rotation, launch height, impact pauses, short limb trails, sparks, damage numbers and impact sound distinguish strikes. Camera impact effects follow reduced-motion preferences and can be disabled.

Normal and Hard rivals use timed high guards. Cyan marks guarding; sweeps and throws bypass it, heavies break it. Orange windups warn of regular strikes, yellow of low sweeps, and large red rings of heavy attacks. Hard bruisers can follow up an attack. The focused rival's health, guard and counter opportunity appear in the HUD.

## Practice and scoring

Combat practice uses the selected fighter, one respawning opponent, unlimited health, a replenishing special meter and no boarding race or deadline. The same controls and combat simulation apply. Pause, quit and move-list controls are available by keyboard and touch.

A hit streak expires after 3.5 seconds or an unblocked hit. Multipliers rise to ×2 at four hits and ×3 at eight. A timed bonus challenge asks for finishers, a crowd shove or a well-timed defence; it rewards 300 points, 15 health and meter without gating boarding. Records are stored locally per starting stop, difficulty and character, under a new version-specific key.

## Art, implementation and limits

Three.js r170 renders original bus, road and station geometry. Microsoft Rocketbox provides stock human models and idle/walk animation under MIT; combat posing is procedural and original. Poly Haven asphalt is CC0. All runtime assets are local. The reference video informed the roadside waiting and scramble sequence; its images and audio are not bundled.

Google Maps links open real stops for exploration. The six arenas are approximate, creative interpretations; Google Street View images and extracted geometry are not bundled. Character selection and gameplay are offline simulations with local preferences, no player tracking, multiplayer, backend or paid Maps API.

The current scope prioritises readable combat and a contested boarding objective. Authored motion capture, custom local wardrobe, more locations, sustained mobile performance and balance across the expanded roster remain future production work.
