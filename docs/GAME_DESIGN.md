# Fight for Trotro — version 1.4.4 — Rivals Challenge the Player

Play an 18-encounter City Journey, an Endless Commute, or a three-stop Quick ride. The same crowd that blocks your entry now competes to board before you. Combat is non-graphic and uses original moves inspired by fighting-game fundamentals: startup, active contact, recovery, confirmed combo branches, guard breaks, low attacks, throws, launchers and air juggles. This is a browser prototype, not a finished AAA production.

## The roadside loop

1. Choose a commuter, difficulty, starting stop and mode. City Journey is the default: three encounters in each of six Accra-inspired districts, 18 encounters total. Endless Commute keeps going; Quick ride and daily routes retain three stops.
2. Start close to the action. The first available trotro pulls in over 3.6 seconds. Prepare on the pavement while traffic passes on separate lanes. Pick up a weapon or water. Trotros pull into a marked bay parallel to the road.
3. If the bus is full, wait. The next bus is guaranteed to have space. When an available bus approaches, passengers gather at the door.
4. Fight for the opening. Rivals guard the doorway and return to their posts after being displaced; they do not chase you across the arena. No knockout is mandatory to board.
5. A rival eventually rushes for the last seat. An orange marker, warning and boarding meter identify the threat. Hit, throw, launch or shove them to cancel their attempt. A stopped attempt delays the next rush by 3.2 seconds.
6. Clear every rival to unlock the door, then hold E. Defeated rivals stay down for the current vehicle; the next arrival removes every old passenger and spawns a fresh crowd. Both entrances require winning the fight. Early window attempts cannot finish while a rival is alive; nearby rivals can still pull you down. Attempt the marked window with G: shove the watching mate with F or wait for his look-away phase. Nearby rivals reach for you with a 0.55-second warning and pull you down for 5 damage. Hold Fight/J during the 1.65-second climb to kick them away (12 stamina per kick, 0.5-second cooldown). Starting a climb costs 20 stamina. Rival AI and the seat race continue during your climb. Rivals alternate door/window routes; a window attempt takes 0.45 seconds longer. Hit, throw or shove them to interrupt either entrance. A rival taking the seat cancels your vault, fills the bus and forces you to wait for its replacement.
7. Each successful campaign ride banks progress and opens a compact next-fight summary with starting health and a Continue button. Continue keeps existing upgrades and defaults to recovery. Optional choices allow an upgrade plus recovery (+40 health), readiness (+15 health and full special), or risk (+25 health, +30% next encounter score, enemies deal +20% damage). The nurse receives 15 extra recovery. Losing retries the current encounter with a 70-health floor and preserves banked progress. There is no service-expiry timer. Quick rides retain their three-stop end and fixed between-stop healing.

Before condition and upgrade modifiers, available boarding windows are 38 / 32 / 26 seconds on Easy / Normal / Hard. The first rival rush begins after 9 / 7 / 5.5 seconds, followed by a 3.4 / 2.9 / 2.5-second boarding attempt. The player boards in 1 / 1.1 / 1.2 seconds. A departing full bus guarantees an available replacement. In player runs, a stolen seat uses a 0.8-second notice, 1.6-second departure, 2.1-second wait and 1.8-second arrival.

## Reasons to play another run

The run offers different combat decisions, not just larger health bars. Each campaign encounter draws a condition, with all six appearing once per shuffled block. Quick rides draw three distinct conditions. The six conditions are: extra boarding time with fewer rivals; a short express window extended by finishers; a larger market crowd with faster shoves; increased special gain against harder-hitting rivals; early boarding attempts with health rewards for interruptions; and fewer tougher rivals vulnerable to stronger throws.

After a successful City Journey or Endless ride, optionally choose one of three unowned upgrades or keep your current upgrades. Eight upgrades support damage, movement, crowd control, specials, counters, finisher recovery, boarding, or damage resistance. City Journey and Endless allow three active upgrades. Once full, a new choice requires explicitly replacing one; all eight cannot stack. Quick rides still require their two between-stop choices. Character perks combine with upgrades.

Every third campaign encounter has a captain, rotating through three fixed repeating patterns: The Wall (heavy/low/heavy), Quickstep (jab/kick/low), or Big Swing (low/heavy/kick). Captains guard the door rather than taking the seat. A braced captain resists a raw shove; attacks, guard breaks and whiff recovery create an opening. Captain knockouts grant 350 extra points and refill the special meter. Door entry requires defeating the captain and every rival in all modes. Window entry requires the same last-standing victory.

Four different connected moves or successful defensive actions within a fixed six-second window trigger a six-second Rush: 25% extra damage, full stamina on activation and half-cost dodges. Repeating jab/cross counts as one style. A ten-second cooldown from activation prevents immediate loops. Whiffs grant no style. Throws and finishers can crash a moving rival into up to two passengers for 14 damage and a stagger; each collision target can be rewarded once per launch.

A real boarding interruption grants 100 points, 15 special charge and two extra boarding seconds (five with Door specialist), capped at the base window plus eight seconds. Market scramble adds 12 health. Hit confirmations, not button presses, grant finisher recovery. Counter healing is once per confirmed move. An available trotro leaving without the player costs five health, once per vehicle, including seats taken by rivals. Already-full arrivals, completed rounds and practice are exempt. This fixed penalty bypasses combat armour and dodge protection, resets the four-second recovery delay, cancels window climbing and ends the round if health reaches zero. A brief message, health flash and sound confirm the loss. Remaining health, weapon, score and special charge carry over when a bus leaves. When a different vehicle starts arriving, every old passenger is replaced by a fresh, full-health rival.

### Career and daily challenge

Career XP is awarded once per result. City Journey and Endless reward only wins, using a saved encounter ledger to prevent replaying a checkpoint for duplicate XP; their losses award nothing. Quick rides and daily routes retain a small defeat reward. Winning a stop gives 120 XP; losing gives 20. Knockdowns add up to 80, interruptions up to 60, a bonus challenge gives 40, and completing the run gives 160 more. Seven rank thresholds: 0, 300, 900, 1800, 3200, 5200 and 8000 XP. Each fighter also earns mastery titles at 0, 450, 1200 and 2400 XP. Eight badges track completed routes, interrupts, Rush activations, captains, clean boarding, trying the roster, the full City Journey and 12 Endless encounters.

Daily challenges use a UTC-date seed, fixed Normal difficulty and a fixed fighter. Route generation and upgrade offers use a separate random stream from combat, so spending longer in one fight cannot reroll later offers or spawns. Replays keep the same day until returning to the lobby; a fresh daily start uses the current UTC date. Best score and furthest seat count are saved locally, with no global ranking claims.

All fighters and build options are available from the start. Career rewards recognise mastery without making a new player weaker. There is no streak penalty, login reward or daily currency. Progress stays in the browser; a storage failure is disclosed and retains progress in memory for the current session.

## Street Tricks: decisions inside the fight

The stop contains two interactive opportunities, visible as labelled props with green rings. R activates a ready prop within 1.8 metres, costing 10 stamina and requiring a neutral combat state. A luggage trolley aims at the nearest living rival and rolls for 1.35 seconds, dealing 42 damage and knockback once per target. A cooler creates a 2.3-metre spill zone for seven seconds; grounded rivals trip and take 14 damage once per spill. Props are unavailable during transit and spent props reset on the next arrival. The goal is to reposition for a multi-target opening, not stand still pressing light attack.

Five crowd dares cycle: hit a rival with a trick, connect a throw, connect three different attack types, perfectly defend a live swing, or confirm a combo finisher. Jabs and crosses count as one type, whiffs never count, and specials do not substitute for a finisher dare. The 22-second clock runs only during combat; success pauses it for three seconds before the next dare. Rewards are 150/300/450 points for an uninterrupted success streak, 10 health, full stamina and 20 base special charge. Expiry only resets the score streak and changes the request. Dares grant bonuses only. They never bypass the all-rival door gate.

After an attack's contact frame, dodge can cancel recovery (except a special). A short approach assist on connected strings or timed counters closes small gaps without extending a neutral weapon's reach. On Normal/Hard, three repeated jabs provoke an adaptive high guard; sweeps and throws bypass it, and heavy strikes break it. Confirmed different attacks reset the read. At 25 health or lower, once per encounter, a living fighter gets full special/stamina and 1.3 seconds of protection; this never revives a defeated player or heals them automatically.

Player-run bus transit is twice as fast after the first arrival. The initial preparation remains 3.6 seconds, and boarding windows keep their original duration. These mechanics support an intended sequence such as trolley strike → close throw → dodge a swing → win the crowd fight → choose the door or distract the mate for a window entry. They are implemented mechanics, not evidence of improved retention; real-player observation remains necessary.

## Saved journeys and pacing

The default 18-encounter journey replaces the forced three-stop finish. Each district follows queue clash → seat defence → captain, with a new condition per encounter. Door progress counts defeated rivals in the current vehicle’s crowd. Each new arrival clears that progress, removes defeated bodies and replaces every passenger, including the captain in captain encounters. Completing a vehicle’s crowd restores 12 health and adds boarding time once for that vehicle.

City and Endless use separate local-storage slots. Checkpoints store the encounter boundary, fighter, difficulty, starting district, seed, banked score, health, weapon and three-slot build. Intermissions also save upgrade, replacement and travel selections. Resume starts the current encounter again; it does not restore mid-swing positions. Losing keeps earlier progress and offers a retry. Starting over requires an explicit new-journey confirmation. Storage failure is reported as session-only progress. Clearing browser data removes saves; no cloud sync is implied.

Endless rotates the six districts indefinitely in ordinary play. Enemy count is capped at ten and district scaling at four increases, avoiding unbounded health growth. Conditions and upgrade offers use random streams separate from combat. The restore validator bounds the encounter index at 10,000 as a defensive input limit. History stores the latest 24 encounter results; the career ledger keeps 300 settled IDs.

Progress comes from encounter mastery, build changes and personal records. The game does not claim measured retention or a guaranteed duration. Larger content variety and repeated playtests with real players remain necessary to judge whether players return voluntarily.

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

## New-vehicle crowds

At the start of each new vehicle’s arrival, replace all passenger state and scene actors. Rotate ordinary character appearances and weapons, assign fresh IDs, restore rival health and clear defeated/interrupted sets, target locks, boarding progress and the once-per-crowd clear reward. The player and pickup scene objects remain; player health, equipment, scores, charge and banked journey progress carry over. Defeated bodies disappear with the old crowd. New passengers gather from the waiting area; a full bus never activates their combat. Initial arrival and repeated phase notifications for the same vehicle do not duplicate crowds. Practice keeps its existing sparring partner.

## Crowd free-for-all

Within 7.2 metres of the door, the nearest eligible rivals prioritise the player, even if an NPC is closer or hits them. Reserve up to one/two/three challengers on Easy/Normal/Hard, limited to half the available fighters (at least one). A small preference for an existing player target reduces target switching. Other rivals choose nearby opponents, retaliate for three seconds and prioritise seat thieves. Boarding, airborne and pulling rivals are not assigned to player pressure. Targets are locked during attack wind-up so a dodging or displaced target causes a miss. Rival-to-rival strikes apply damage, guard reduction, knockback and recovery, and interrupt door or window boarding. At most two attackers commit to each NPC target; the existing difficulty cap remains for attacks on the player. Rivals stay near the stop rather than pursuing a retreating player into the street.

An NPC knockout removes that rival from the current vehicle’s fight but awards no player kill, hit points, interruption bonus, special charge or captain bonus. The remaining fighter must still be beaten: waiting for the crowd cannot produce a win on its own. Both player boarding routes require all rivals down. Practice retains its single sparring partner and full buses pause crowd combat.

## Mobile readability and recovery

The centre of the arena stays clear. Health, stamina, a timer and one status line sit above play. A thumb joystick sits bottom-left; Fight, Guard, Dodge, Special and a contextual action sit bottom-right. Hold Fight chains original combo routes and sweeps guarded opponents. The context action changes to nearby props, throws, boarding, mate shoves, vaulting, kick-free or pulling a window rival down. Pause contains detailed objectives and moves; Game Setup opens a modal for mode, difficulty, starting stop and expandable route progress. The main menu presents one Play/Continue action, Fighter and Game Setup rows, and smaller Practice, Daily Challenge and Career actions.

Incoming enemy damage is 65% of the previous values. Unblocked damage grants 0.65 seconds of protection. After four damage-free seconds, being more than 7.2 metres from the door or between buses restores 3 health/second up to 70. Conductor rebuffs deal 6 damage with a repeat cooldown. Full buses cannot be boarded by either route. Engine sounds, impact effects, optional vibration and device-speech mate calls provide feedback; sound and camera effects can be disabled.

## Practice and scoring

Combat practice uses the selected fighter, one respawning opponent, unlimited health, a replenishing special meter and no boarding race or deadline. The same controls and combat simulation apply. Pause, quit and move-list controls are available by keyboard and touch.

A hit streak expires after 3.5 seconds or an unblocked hit. Multipliers rise to ×2 at four hits and ×3 at eight. A timed bonus challenge asks for finishers, a crowd shove or a well-timed defence; it rewards 300 points, 15 health and meter without gating boarding. Records are stored locally per starting stop, difficulty and character, under a new version-specific key.

## Art, implementation and limits

Three.js r170 renders original bus, road and station geometry. Microsoft Rocketbox provides stock human models and idle/walk animation under MIT; combat posing is procedural and original. Poly Haven asphalt is CC0. All runtime assets are local. The reference video informed the roadside waiting and scramble sequence; its images and audio are not bundled.

Google Maps links open real stops for exploration. The six arenas are approximate, creative interpretations; Google Street View images and extracted geometry are not bundled. Character selection and gameplay are offline simulations with local preferences, no player tracking, multiplayer, backend or paid Maps API.

The current scope prioritises readable combat and a contested boarding objective. Authored motion capture, custom local wardrobe, more locations, sustained mobile performance and balance across the expanded roster remain future production work.

## Between-fight navigation

The result screen shows the next arena, fight objective and exact starting health, including the healer bonus and 100-health cap. Upgrades and recovery alternatives share a closed disclosure; the route map has its own disclosure. A pending three-slot replacement opens the choices on resume and requires an explicit replacement or Keep current upgrades. Outside clicks, Escape and unexpected dialog closure save and return to the menu. Continue starts the next fight; its queued close event must not redirect to the menu.
