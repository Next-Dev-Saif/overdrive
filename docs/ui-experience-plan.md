# Overdrive interface / model direction

Graphite workshop surfaces, bone typography, amber actions and machined edges. The vehicle is the focal point of home and garage. Panels are opaque enough to read over moving scenes. Body copy uses Outfit; tabular numerals support changing telemetry. Selection always includes text or a border, and keyboard focus remains visible. Motion follows the system preference.

## Screen coverage
| Requirement screens | Implementation destination | Behavior |
| --- | --- | --- |
| Splash, main menu | Home | Vehicle hero, play, garage, armory, profile, settings |
| Garage, vehicle selection/details | Garage | Seven selectable chassis, live preview, explicit equip |
| Armory, weapon details | Garage / Armory | Five selectable systems, details and live mount preview |
| Upgrade, parts, customization, inventory | Workshop sections | Available chassis/weapon inventory; unavailable progression/cosmetics explicitly labeled |
| Mode selection | Play step 01 | Existing free roam and deathmatch; future modes locked |
| Arena selection | Play step 02 | Four existing arena IDs |
| Setup, pre-match lobby | Play step 03 | Loadout and objective review; actual default bot count |
| Loading | Game bootstrap | Indeterminate initialization, loadout/tip; retry on failure |
| Gameplay HUD, objective, warning, target lock | Game | Existing live telemetry restyled with shared tokens |
| Race HUD, position | Mode catalog | Race mode unavailable until checkpoints/laps exist |
| Pause | Game overlay | Input suspended; network world may continue; explicit leave action |
| Results, rewards | Session debrief | Session duration; rewards unavailable until authoritative scoring exists |
| Profile/player profile | Driver | Active equipment and local identity, no fabricated stats |
| Missions, leaderboard | Operations | Explicit empty/unavailable states with useful return action |
| Settings/controls/graphics/audio | Settings tabs | Actual graphics quality and audio levels; current binding reference |
| Matchmaking/private lobby | Operations | Explicit unavailable state, local combat alternative |
| Notifications/unlocks | Operations | Empty state, no fake activity |

## Procedural models
Seven archetypes keep existing collision envelopes and gameplay settings. Lofted body sections produce sloped hoods, shoulders, wheel arches and glass cabins. Rubber tires, alloy rims, mechanical suspension, grille slats, brake discs, lamps and exhaust add material and scale cues. Wraith uses ducted hover pods. Weapons use machined receivers, hollow bores, recoil hardware, heat sinks and distinct ammunition systems. Static submeshes are merged by material within each articulated group; wheels and turret pivots remain independent.

## Manual acceptance walkthrough
1. Home → Garage: cycle all seven vehicles and five weapons rapidly. Confirm preview and equipped labels agree; return home and verify loadout.
2. Use Tab/Enter through navigation and equipment. Check visible focus, disabled reasons, 200% zoom, short desktop and narrow viewport scrolling.
3. Visit every Operations and Settings tab. Adjust graphics/audio, return and confirm values. No unavailable action should imply success.
4. Play → both modes → each arena → lobby → load. Check loading and failure/retry presentation.
5. Drive, steer, fire and use ability: wheels, suspension and turret must track correctly. Open pause with Escape, resume, leave and review debrief.
6. Compare all models from front/side/rear and observe shadows, bores, rims and glass. Check at least 10 vehicles under combat load with FPS tools; no 60 FPS claim until measured.

Browser visual and gameplay verification intentionally left to the user per Agent-execution-guide.md. Automated checks cover build, lint, model geometry and articulation contracts.

## Verification results — 2026-10-03
- `npm run test:models`: all 35 chassis/weapon combinations passed finite-position/normal checks, expected wheel counts, turret/muzzle discovery, yaw articulation, gameplay ray intersection and a <50 render-mesh budget. Measured maximum: 31 render meshes, 38,792 vertices per loadout.
- `npm run lint:app`: application, scripts and Vite configuration pass without warnings.
- `npm run build`: TypeScript and Vite pass. The existing Babylon vendor bundle still exceeds the configured 5 MB warning threshold (about 7.25 MB before gzip).
- Main primary, secondary, muted and amber text tokens pass WCAG AA 4.5:1 against background, surface and raised surface tokens.
- Repository-wide `npm run lint` remains blocked by pre-existing truncated `recovered_original.ts:743`; the recovery file was not edited.
- Browser visuals, real WebGL rendering, gameplay feel, 200% zoom, keyboard walkthrough and live frame rate require the manual acceptance pass above. No browser was opened.

## Runtime boundaries
The full screen inventory is mapped above, but this is a UI/model pass, not implementation of missing game systems. Race/lap HUDs cannot receive live data until race mode exists. Rewards, missions, accounts, private matchmaking, upgrades and cosmetic purchases remain explicitly unavailable. The session debrief reports time only. Session menu suspends driver controls, while the live simulation continues.
