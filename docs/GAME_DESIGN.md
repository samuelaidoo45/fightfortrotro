# Fight for Trotro game design

The objective is to get home by winning three contested trotro seats in one run. Passengers wait on the pavement until a trotro with space approaches, then gather at the entrance in a defensive formation. Boarding depends on a physical opening; no opponent must be knocked out first. The player must fight or shove them aside and use the opening before they return to their posts. Opponents do not chase the player around the arena or board the trotro themselves.

The intended feel is a short, readable fighting challenge with an urgent escape. Realistic human meshes and movement support exaggerated, non-graphic crowd combat. The current environment uses independently built, approximate Accra-inspired layouts; it is not a surveyed reconstruction of every stop.

## The home run

Choose a starting stop and Easy, Normal, or Hard. The menu previews a three-stop route through the six-arena roster. Starting at Circle gives Circle, Madina, then Lapaz. These are fictional game circuits, not a public-transport journey planner.

At each stop:

1. Prepare on the pavement. Collect a weapon or drink while cars pass. The mate calls the destination and capacity as the bus pulls into the parallel bay. A full bus leaves and is always followed by an available one. Passengers approach their assigned doorway posts during an available arrival, before combat starts.
2. Fight through the crowd. Choose a nearby weapon for reach, attack speed, wide swings or knockback. Save stamina for a dodge and shove.
3. Read the swings and break the formation. A counter, shove or finisher staggers defenders and opens an entry window; defeating the heavy blocker is optional.
4. Fight or shove the remaining blockers out of the doorway. The HUD reports how many opponents still block entry.
5. Reach the glowing door and hold Board while a gap is open. An active blocker in the doorway or a hit interrupts the attempt. Defenders recover and return to their assigned posts, so the opening is temporary.
6. Bank the ride and score, recover 25 health, keep the equipped weapon, and advance to a larger crowd. Win the third stop to reach the home-run victory.

A bus departure does not immediately lose the run: wait for the replacement and fight the regrouped doorway crowd. Health, weapon, pickups and score persist. Lose when health reaches zero. There is no overall stop deadline; urgency comes from each individual departure. The result explains that specific failure and offers an immediate retry. Personal best scores are saved locally per difficulty and starting stop.

## Combat choices

| Action | Behaviour and purpose |
| --- | --- |
| Strike | Tap or hold J. Each connected hit advances a three-hit chain; the third knocks the opponent back. Missing does not build a combo. Unarmed hits spend 9 stamina; weapon costs vary. Contact returns 2 stamina. |
| Weapons | Five pickups offer different reach, speed, damage and crowd coverage. Each stays equipped between arrivals and won stops until replaced. |
| Block | Hold K to reduce damage. Raising the guard just before contact gives a perfect block, stuns the attacker, and awards 75 points. Sustained blocking costs more stamina. |
| Dodge | L or Space. A short movement burst with brief invulnerability, costing 19 stamina. Avoiding a live strike awards a dodge bonus. |
| Power shove | F. Costs 28 stamina and recharges over four seconds. Pushes up to four nearby rivals away and gives an entry window. It creates space rather than replacing the normal damage combo. |
| Pick up | R near a weapon or drink. Equipping a new weapon replaces the old one. A drink restores 30 health and is consumed once. |
| Board | Hold E within 1.3 metres of the door while the blockers are clear or staggered. The contextual prompt explains when to shove or move closer. |

Short impact pauses, damage numbers, sound effects, stagger poses and a brief shove ring communicate contact. Camera impacts can be disabled, reduced-motion preference is respected, and sound can be muted from the menu or pause screen. Backgrounding the game pauses the simulation.

## A living stop and combat rewards

Marked boarding bays, a bus-stop flag, shelter, bench and six waiting passengers establish the station. Bystanders step toward the curb during arrivals while the fighting crowd moves from its waiting area to the doorway; fighters then hold posts and never pursue the player or board themselves. Cars, taxis and trotros move in both directions on dedicated lanes outside the playable arena. Ambient traffic has fixed lane spacing and pauses with the game. Boarding vehicles decelerate along a dedicated approach shoulder into a bay parallel to the road. Their doors open toward the pavement, and they depart along the curb without crossing the playable space. A shared layout module aligns the scene, door target, guard posts and simulation boundaries. The traffic is scenery, not a vehicle-collision survival mechanic.

Connected hits build a streak with score multipliers at four and eight hits, capped at ×3. An unblocked hit or 3.5 seconds without a connection breaks the streak. A separate momentum meter starts at 35 percent and charges from connected hits, knockdowns and active defence. At 100 percent, Q releases Crowd Breaker: a 3.8-metre knockback, 22 base damage, a three-second stagger, full stamina, brief protection and four seconds of 25-percent extra damage. It cannot be activated while waiting for a bus.

Each stop offers an optional 30-second challenge: two three-hit finishers, a shove hitting at least three rivals, or a perfect block/live dodge. Challenge time advances only while boarding is open. Completion awards 300 points, 15 health and 25 momentum once. An expired challenge never prevents boarding. The result records completed challenges and the best hit streak.

Every third doorway-rival attack is a slower heavy sweep, shown with a large red ring and an on-screen dodge warning. Blocking takes 55 percent of its damage instead of the normal 12 percent; dodge protection avoids it. A last-call announcement fires once per available bus when eight seconds remain.

## Weapon tuning

All weapons use J and a three-hit chain. The third hit has stronger damage and knockback. These are melee pickups; they have no ammo or durability meter.

| Weapon | Reach | Damage / third hit | Stamina | Recovery | Targets |
| --- | ---: | ---: | ---: | ---: | ---: |
| Bare hands | 2.05 m | 22 / 36 | 9 | .30 sec | 1 |
| Travel bag | 2.50 m | 29 / 43 | 9 | .34 sec | 2 |
| Umbrella | 3.05 m | 20 / 34 | 8 | .29 sec | 1 |
| Baton | 2.20 m | 24 / 38 | 7 | .24 sec | 1 |
| Market stool | 2.45 m | 37 / 54 | 17 | .62 sec | 3 |
| Suitcase | 2.65 m | 32 / 48 | 13 | .46 sec | 2 |

Pickups have distinct models, coloured ground rings, names and contextual descriptions. The player’s HUD shows the equipped weapon and its advantage. Rivals also carry the five objects; their wind-up, reach and damage reflect their weapon.

## Bus service

Each arrival may be full. The first-bus probability is 35/45/55 percent on Easy/Normal/Hard. Consecutive full buses are prevented. Full buses remain for 2.4 seconds, leave over 3.2 seconds, then a 4.2-second wait and 3.6-second arrival lead to the next parked trotro. Each new stop starts with the waiting and arrival phases, giving time to prepare. The bus has a closed sliding door and FULL placard when unavailable, seated occupants, and a 1 SEAT placard when available. Replacement buses have a different paint colour and a new number in the HUD.

An available bus stays for 32/25/19 seconds on Easy/Normal/Hard. Its departure resets doorway combat and boarding progress, while health, weapon, pickups and earned score persist. Defenders step to waiting posts during the gap, then return to guard the next available bus. Combat and boarding are disabled while the bus is full or moving. The HUD shows the arrival/boarding countdown, Wait–Arrival–Fight–Board phase, capacity, doorway blockers and subtitles. Engine revs, brake sounds and optional local-device speech reinforce the mate calls. Last call triggers at eight seconds; the door starts closing in the final second.

## Opponents and pressure

During waiting and full-bus phases opponents remain in the waiting area. On an available approach, they gather at assigned posts around the trotro entrance. They attack only when the player approaches the doorway and comes within reach. They never use the player's position as a movement destination. A defender pushed away from a post returns to it after recovering. The marked doorway rival stays down after defeat; other knocked-down defenders eventually recover at their posts.

Stool carriers have a slower, heavier swing; umbrella carriers have longer reach; baton carriers wind up faster. A bounded number of defenders can wind up simultaneously. The playable pavement stays outside both the moving bus bay and the through lanes, including while the bay is empty. A standing, active opponent close to the door physically blocks boarding; a staggered or displaced defender leaves an opening.

| Mode | Starting crowd | Boarding window | Base damage | Wind-up | Player boarding |
| --- | ---: | ---: | ---: | ---: | ---: |
| Easy | 4 | 32 sec | 8 | 1.10 sec | 1.00 sec |
| Normal | 6 | 25 sec | 11 | 0.85 sec | 1.10 sec |
| Hard | 8 | 19 sec | 15 | 0.66 sec | 1.20 sec |

Easy allows one simultaneous attacker, Normal two, and Hard three. The second and third stops each add another rival. Rival health, doorway-rival health and movement speed also increase. The initial doorway rival has 68, 88 or 112 health, depending on difficulty. These are tuning values; automated rule checks do not establish that a game is fun or replace player feedback.

## Reward and replay

Each hit adds a small score, ordinary knockdowns award 150 points and the doorway rival awards 500. Winning a seat adds a clear bonus, speed bonus (floored at zero) and health bonus. Perfect blocks and successful dodges reward active defence. The final score combines all three stops.

The result screen stamps each cleared stop and identifies the next destination. The player can see the unfinished journey instead of receiving the same isolated win screen repeatedly. Best scores use a new versioned local record store so earlier walk-to-the-door times do not compete with this challenge.

Keep later additions aligned with this loop. Useful extensions include different crowd entry points, distinct doorway rivals, independently verified arena layouts and locally recorded mate calls. Additional mechanics should create decisions about reaching the seat, rather than add unrelated currencies or mandatory eliminations.

## Arenas and location expansion

The current roster is Circle, Kaneshie, Madina, 37 Station, Lapaz and Tema Station in central Accra. Each has an independently built environmental variant. The core fighting footprint remains shared so combat can be tuned before producing detailed location-specific geometry.

To expand toward all Accra stops, maintain a verified catalogue with a stable internal ID, canonical name, local aliases, corridor, independently verified boarding coordinates and side, map link, review date, source provenance, capture permissions and release status. Define the geographic boundary of Accra, deduplicate aliases and review stops with local commuters and operators. Release arenas in verified batches rather than claim complete coverage from a place search alone.

## Maps and Street View

The game supplies Google Maps search links for exploration. Google's documented Maps URLs work without an API key. The links use location names rather than unverified precise stop coordinates. [Google Maps URL documentation](https://developers.google.com/maps/documentation/urls/get-started).

For environment research, inspect available imagery within Google's own interface or an approved viewer, retain required attribution, and verify the boarding area locally. Street View is dated and coverage varies. Do not extract or trace its content into playable meshes, textures or reconstructed scenery. Create game assets from independently owned or appropriately licensed captures. [Street View imagery policy](https://www.google.com/streetview/policy/), [API policies](https://developers.google.com/maps/documentation/streetview/policies), [geographic content guidelines](https://about.google/brand-resource-center/products-and-services/geo-guidelines/).

A live in-app Maps or Street View viewer needs the appropriate service configuration, credentials, billing and attribution. The present build uses external links and includes no Google imagery or extracted map geometry.

## Realistic art production

The browser build uses Microsoft Rocketbox human models, skeletal idle/walk motion and procedural combat poses. Characters and motion are licensed under MIT; resized colour textures, asset provenance and the license notice are bundled locally. Asphalt 02 by Rob Tuytel / Poly Haven supplies CC0 surface textures. Full credits appear in the game.

The next environment quality milestone is one independently captured stop with worn surfaces, kerbs, drainage, shops, a detailed trotro interior and a sliding-door boarding animation. Follow with locally appropriate character wardrobes, stronger combat and reaction animation, original traffic and mate recordings, camera collision testing and target-device performance work. Evaluate the full-game engine against team capability and budget in a technical spike before committing.

Target readable, responsive combat alongside natural proportions and material detail. Avoid camera occlusion, exaggerated motion blur and visual noise that hide a coming attack. Full accessibility work should include remapping, gamepad support, scalable text, subtitles, alternate telegraph colours and hold/toggle choices for guard and boarding.

## Reference and validation

The narration and representative scenes in [Why Lagos Bus Stops Turn Into a Fight](https://www.youtube.com/watch?v=NQvoIqS8W8c) informed the wait, arrival and doorway scramble sequence. The reference is an illustrated Lagos transport explainer, not live Accra footage or a source of combat animation. The game uses original environment geometry and its existing licensed assets.

All 49 automated tests pass. Six roadside checks cover safe preparation, a crowd formed before boarding, zero-knockdown wins on all difficulties, defender regrouping without pursuit, full arrivals keeping the crowd back, aligned bus/door coordinates and vehicle paths clear of the pavement. Existing tests cover combat, weapons, bus capacity and persistence, traffic spacing, score/challenges, three-stop carry-over and character rigs. Updated tests reflect the physical gap goal and removal of the overall service deadline.

Browser QA verified preparation pickups, missed-bus persistence, full-bus replacement, visible crowd formation, a zero-knockdown win with full health, next-stop weapon/score retention, pause/resume, moving traffic and responsive controls. Automated checks cannot establish enjoyment; difficulty and longer-term replay value need player feedback.
