# Fight for Trotro game design

The objective is to get home by winning three contested trotro seats in one run. Each stop has a marked doorway rival who must be knocked down before the player can board. Once that rival falls, other commuters race for the seat. Hesitating can lose the ride even when the player still has plenty of health.

The intended feel is a short, readable fighting challenge with an urgent escape. Realistic human meshes and movement support exaggerated, non-graphic crowd combat. The current environment uses independently built, approximate Accra-inspired layouts; it is not a surveyed reconstruction of every stop.

## The home run

Choose a starting stop and Easy, Normal, or Hard. The menu previews a three-stop route through the six-arena roster. Starting at Circle gives Circle, Madina, then Lapaz. These are fictional game circuits, not a public-transport journey planner.

At each stop:

1. Locate the marked doorway rival. Their health and the immediate objective appear in the HUD. A world label and a distance marker help the player find them.
2. Fight through the crowd. Grab the nearby travel bag for wider, stronger swings, or save stamina for a dodge and shove.
3. Knock down the doorway rival. This immediately opens boarding; there is no waiting timer.
4. Reach the glowing door and hold Board. A hit interrupts the attempt. Use a power shove to create a short opening.
5. Watch the rival boarding bar. A rushing commuter can claim the seat first. Strike or shove that commuter to cancel their attempt, or board before they finish.
6. Bank the ride and score, recover 25 health, keep an acquired travel bag, and advance to a larger crowd. Win the third stop to reach the home-run victory.

Lose the run when health reaches zero, the trotro departs, or another commuter finishes boarding. The result explains that specific failure and offers an immediate retry. Personal best scores are saved locally per difficulty and starting stop.

## Combat choices

| Action | Behaviour and purpose |
| --- | --- |
| Strike | Tap or hold J. Each connected hit advances a three-hit chain; the third knocks the opponent back. Missing does not build a combo. Basic hits spend 9 stamina and return 2 on contact. |
| Travel bag | A pickup that increases damage and reach and can hit two nearby rivals. It stays with the player between won stops. |
| Block | Hold K to reduce damage. Raising the guard just before contact gives a perfect block, stuns the attacker, and awards 75 points. Sustained blocking costs more stamina. |
| Dodge | L or Space. A short movement burst with brief invulnerability, costing 19 stamina. Avoiding a live strike awards a dodge bonus. |
| Power shove | F. Costs 28 stamina and recharges over four seconds. Pushes up to four nearby rivals away, interrupts boarding, and gives a recovery window. It creates space rather than replacing the normal damage combo. |
| Pick up | R near a bag or drink. A drink restores 30 health and is consumed once. |
| Board | Hold E near the door after the doorway rival is down. The contextual prompt explains when the player must move closer. |

Short impact pauses, damage numbers, sound effects, stagger poses and a brief shove ring communicate contact. Camera impacts can be disabled, reduced-motion preference is respected, and sound can be muted from the menu or pause screen. Backgrounding the game pauses the simulation.

## Opponents and pressure

The doorway rival stays near the bus instead of following the player across the arena. They are the required fight target and stay down after defeat. Other rivals recover after knockdowns and return from their starting area.

Rushers move toward the door after the doorway clears and can steal the seat. Bag swingers use a slower wind-up; umbrella jabbers have longer reach. Only a bounded number of opponents can wind up simultaneously, preserving readable counter opportunities. Rivals route around the solid bus rather than becoming stuck against its side.

| Mode | Starting crowd | Departure | Base damage | Wind-up | Rival boarding | Player boarding |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Easy | 4 | 85 sec | 8 | 1.00 sec | 5.0 sec | 1.15 sec |
| Normal | 6 | 75 sec | 11 | 0.80 sec | 4.0 sec | 1.30 sec |
| Hard | 8 | 65 sec | 15 | 0.64 sec | 3.3 sec | 1.40 sec |

The second and third stops each add another rival. Rival health, doorway-rival health and movement speed also increase. The initial doorway rival has 68, 88 or 112 health, depending on difficulty. These are tuning values; automated rule checks do not establish that a game is fun or replace player feedback.

## Reward and replay

Each hit adds a small score, ordinary knockdowns award 150 points and the doorway rival awards 500. Winning a seat adds a clear bonus, remaining-time bonus and health bonus. Perfect blocks and successful dodges reward active defence. The final score combines all three stops.

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

## Validation scope

The test suite checks required doorway combat, hit chains, cooldowns, interrupted boarding, rival seat theft, power shoves, perfect blocks, dodge protection, attack concurrency, collision, pickups, terminal outcomes and three-stop carry-over. Character checks cover weighted meshes, animation targets and independent crowd skeletons.

Browser QA includes a complete Easy home run, a Normal stop, the seat-theft loss flow, pause/resume and desktop/narrow HUD layouts. Balance, sustained device performance and enjoyment need broader playtesting with the intended audience.
