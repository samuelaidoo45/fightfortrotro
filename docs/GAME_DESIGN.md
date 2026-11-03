# Fight for Trotro game design

The player is a commuter trying to claim the last seat on a departing trotro. The arena is the bus stop, the opponents are other fictional commuters, and the finish line is the sliding door. Combat creates space for an escape. Knocking everyone down is optional.

The intended full game has realistic 3D environments and human movement, with exaggerated, playful action. The browser prototype proves the combat and boarding loop with simplified original models. It includes six location-inspired arenas; it does not reproduce every stop in Accra.

## The round

1. Choose a stop and difficulty. Read the local arena description and pick a route.
2. Spawn with a clear view of the trotro and its marked passenger door. The mate checks the last seat for eight seconds while the crowd closes in.
3. Move, strike, block, and dodge. A three-hit chain finishes with a stronger shove. Spend stamina deliberately; a tired commuter cannot dodge.
4. Grab a travel bag to extend the swing, or a drink to recover 30 health. Bag swings can catch two close rivals.
5. When the mate calls, reach the door and hold Board for 1.6 seconds. Taking damage interrupts boarding. You may fight, lure the crowd away, or slip through an opening.
6. Win by boarding with health remaining before departure. Lose by running out of health or time. Retry immediately or choose another stop.

The first satisfying moment should arrive within ten seconds: dodge an obvious wind-up, land a counter, and see the opponent stagger clear of your path. The final seconds should create a story worth sharing: almost no health, an empty stamina bar, a bag swinging past, and a last-second boarding.

## Combat and crowd behaviour

| Mechanic | Prototype behaviour | Production direction |
| --- | --- | --- |
| Basic strikes | Nearest rival in reach; 11 stamina per strike; 3-hit shove | Directional punches, shoulder bumps, animation-driven contact and stronger hit reactions |
| Block | Hold to reduce damage substantially; incoming hits cost stamina | Facing-sensitive guard, brief perfect-block window, clear guard-break feedback |
| Dodge | 23 stamina, short movement burst and brief invulnerability | Lateral sidesteps, readable recovery, animation warping around close crowds |
| Bags | Pick up once; wider, stronger swings, up to two targets | Carry weight, recovery tradeoffs, varied bag silhouettes and collision |
| Rival weapons | Bags, long folded umbrellas and hand luggage | Readable styles: sweeping bag, straight umbrella jab, slow luggage shove |
| Knockdowns | Count as points; rival rejoins after seven seconds | Ragdoll blend, safe stand-up zone and temporary crowd opening |
| Health | Drops on unblocked hits; drinks restore health | Localised reactions and non-graphic injury feedback |
| Stamina | Spent by attacks, blocks and dodges; regenerates after a short rest | Tune fatigue against escapes so the last two metres remain tense |

Opponents have distinct wind-up, swing, recovery, chase and knockdown states. An orange ring identifies a coming attack. They pursue around the solid bus and separate from one another so the crowd stays readable. Production AI should also compete for door position, react to other commuters, retreat when hurt, and form temporary gaps. Limit simultaneous attackers so a player can read the encounter.

Avoid random unavoidable hits, hidden damage, or a requirement to eliminate every opponent. Provide a visible wind-up and recovery opportunity for every attack. Ordinary commuters and vendors outside the combat area are scenery; the fight is between fictional participants in the arena.

## Difficulty

| Mode | Rivals | Departure | Base incoming damage | Wind-up | Intended experience |
| --- | ---: | ---: | ---: | ---: | --- |
| Easy | 4 | 95 sec | 8 | 0.95 sec | Learn movement, recover from mistakes, make the first escape |
| Normal | 6 | 75 sec | 12 | 0.72 sec | Balance pressure, stamina and door timing |
| Hard | 9 | 60 sec | 17 | 0.50 sec | Read overlapping attacks and conserve resources |

Rival health and movement speed also rise with difficulty. Umbrella strikes have a small damage multiplier. These are initial tuning values, not fixed production requirements. Measure win rate, damage sources, time at the door, and whether players understand why boarding was interrupted. Target early playtest win rates of roughly 75%, 45%, and 20% for Easy, Normal, and Hard; these targets require testing.

## Arenas

The prototype uses the same combat footprint across six original environmental variants so gameplay can be compared. Signs and shop names are fictional. Each production arena should gain its own verified layout and tactics.

| Stop | Prototype treatment | Proposed full-game identity |
| --- | --- | --- |
| Circle | Flyover backdrop, shops, roadside stalls | Pillars that break sightlines, dense pedestrian streams, loud evening traffic |
| Kaneshie | Market stalls and warm market buildings | Narrow stall corridors and wider boarding pockets |
| Madina | Additional colourful market awnings | Market crowd surges and several approach lanes |
| 37 Station | Larger trees and a roadside setting | Short sightlines, shaded waiting areas and sudden rushes |
| Lapaz | Shop-front strip and roadside traffic | Longer curbside approach with limited lateral escape space |
| Tema Station in central Accra | Additional parked trotros | A dense transport yard with multiple door-shaped decoys and clear route signs |

These identities are creative proposals. Field verification determines the final layout. “Tema Station” here means the central Accra station, not a claim that this prototype recreates a terminal in Tema city.

## Covering Accra's stops

Treat “all stops” as a maintained catalogue rather than an unverified completeness claim. Informal stop names, boarding sides, route changes and multiple nearby stations require local checking. A place search result alone does not establish an exact boarding location.

Maintain one record per candidate arena with:

- Stable internal ID, canonical name, local aliases, corridor and neighbourhood.
- Independently verified coordinates, boarding side and arena bounds, with provenance and review date.
- Google Maps place/search link for exploration; Street View coverage and capture date when available.
- Field photographs or scans that the team has permission to use, with ownership and releases recorded.
- Distinctive landmarks, road width, entrances, vendor areas, obstacles, crowd density and lighting observations.
- Arena status: candidate, verified, captured, modelled, playtested, or released.

Start with the six hubs, then expand by corridor with local transport operators and commuters. Define the geographic boundary of “Accra” before promising complete coverage. Deduplicate aliases and have a local reviewer confirm every released stop. A completeness claim needs a defined source, boundary, last-verified date and a process for additions.

## Google Maps and Street View workflow

The current game offers genuine Google Maps search links for each selected stop. Google's documented Maps URLs work without an API key and can open maps or available panoramas. The prototype uses name searches rather than invented precise stop coordinates. [Google Maps URL documentation](https://developers.google.com/maps/documentation/urls/get-started).

For the production research tool, open the place in Google Maps, confirm the boarding location with a local reviewer, and inspect available Street View in Google's own interface or an approved API viewer. Display required attribution whenever Google content is shown. Street View imagery is dated and coverage varies. [Street View imagery policy](https://www.google.com/streetview/policy/), [Street View API attribution policies](https://developers.google.com/maps/documentation/streetview/policies).

Do not turn Street View images into game textures or extract, trace, stitch, scrape, or reconstruct environment data from them. Google's published guidelines restrict these uses. Create the playable meshes and textures from independently owned or licensed captures and other appropriately licensed references. [Google geographic content guidelines](https://about.google/brand-resource-center/products-and-services/geo-guidelines/).

A live in-app Maps or Street View viewer would need the appropriate configured Maps Platform service, API key, billing setup and attribution. It is not included in this build. External Maps links let the prototype work without those credentials.

## Realistic 3D production direction

Use the browser build as a mechanics prototype. For the full PC and console game, evaluate Unreal Engine against the team's existing tools, target hardware and production budget in a technical spike before committing. Target 60 fps for responsive combat; offer a stable lower-spec setting and scalable crowd counts.

Build a small, convincing vertical slice before modelling the city:

1. **One verified stop:** an independently captured ground surface, kerbs, drainage, shops and a hero trotro with a detailed interior and animated sliding door.
2. **One player and three rival styles:** realistic proportions, locally appropriate clothing, varied faces, bags and umbrellas, with distinct silhouettes.
3. **Combat animation:** motion-captured or carefully keyed strikes, blocks, dodges, crowd contact, stagger reactions, knockdown recovery and boarding. Keep input responsive while animation preserves weight.
4. **Materials and lighting:** worn paint, dust, dents, oxidised metal, cloth, rubber and glass; natural Ghanaian daylight, an evening lighting pass and believable contact shadows.
5. **Sound:** original recordings of traffic, engines, doors, footsteps and market ambience. Record local performers for mate calls in the languages appropriate to each stop. Subtitle meaningful calls; do not rely on sound alone for timing.
6. **Camera:** a collision-aware over-shoulder or elevated third-person camera with clear door visibility. Use very short impact movement and provide a motion-reduction option. Make crowd occlusion and camera clipping first-class acceptance criteria.

Photorealism must support readable play. Keep silhouettes distinct from the crowd, avoid excessive motion blur, and let objects carry believable weight. Use restrained dust and impact effects rather than graphic gore. Keep the humour in timing, personalities and escapes.

## Progression and replay

The prototype saves fastest escapes per stop and difficulty in the local browser. For production, award mastery for a clean counter, a no-pickup escape, a low-damage run, or a last-second boarding. Unlock clothing, bag styles and route-themed cosmetics through play. Keep character strength equal so progress never makes lower-skill players impossible to beat.

Add a short Accra circuit after the single-stop loop is proven: survive several stops with limited recovery and a final crowded hub. Daily seeded rushes can create fair comparisons. Multiplayer and leaderboards are later milestones because networked crowd combat needs dedicated design, anti-cheat and performance work.

## Controls and accessibility

The browser build supports WASD/arrows, J strike, hold K block, L/Space dodge, hold E board, R pickup and Esc/P pause. Narrow and coarse-pointer devices get touch controls. Health, stamina, the door objective and the departure countdown stay visible. The page respects reduced-motion preference for camera impacts. Sound is opt-in, instructions are available before play, and backgrounding the game pauses the simulation.

For production, add full input remapping, gamepad support, scalable text, subtitles, high-contrast telegraphs, hold/toggle choices for guard and boarding, and separate camera-shake and audio-mix controls. Test the smallest supported screen with the largest supported text size.

## Delivery gates

- **Playable foundation, delivered:** six selectable inspired environments, three difficulties, combat, pickups, crowd pressure, win/loss flow and local records.
- **Combat vertical slice:** local playtests demonstrate readable attacks, reliable hit reactions, a fun escape and a stable camera in one detailed arena.
- **Realism vertical slice:** original captured assets, one finished trotro, production characters, animation, sound, lighting and target-hardware performance.
- **Accra expansion:** verified stop catalogue, local reviews and a reusable environment kit; release arenas in batches after gameplay and location checks.
- **Release preparation:** accessibility, input coverage, save reliability, performance budgets and device testing. Online modes require their own production plan.

The creator's [reference clip](https://www.youtube.com/shorts/dOuFxjeqBK0) remains part of the brief. It could not be retrieved during this build; no shot-by-shot observations from it are asserted.
