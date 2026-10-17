# Execution Log

## 2026-10-18 — Database Migration: Prisma to Appwrite
### Completed implementation
- [x] Extracted and backed up all existing SQLite data (`User`, `PlayerStats`, `Wallet`, `VehicleInventory`, `WeaponInventory`) to `server/scripts/migrated-data.json`.
- [x] Removed Prisma dependencies (`@prisma/client`, `prisma`), `prisma.config.js`, and the entire `server/prisma/` folder.
- [x] Integrated `node-appwrite` and created a decoupled database service layer (`server/src/db.ts`) with typed models and zero-downtime offline fallback for unit tests.
- [x] Configured environment variables across `server/src/config.ts`, `server/.env.example`, `server/.env.production.example`, and initialized `server/.env`.
- [x] Refactored `server/src/auth.ts` and `server/src/index.ts` to use Appwrite data access methods with consistent error handling and 409 conflict detection.
- [x] Built the idempotent setup and data migration tool `server/scripts/migrate-appwrite.mjs` with npm scripts `npm run db:setup` and `npm run db:migrate`.
- [x] Removed `JWT_SECRET` from `server/.env.example`, `server/.env.production.example`, and `server/.env`, and removed the startup validation throw condition in `server/src/config.ts`.
- [x] Verified connection to Appwrite Cloud (`https://nyc.cloud.appwrite.io/v1`) using user project and database ID.
- [x] Created `server/.gitignore` to properly isolate secrets (`.env*`), build outputs (`dist/`), dependencies (`node_modules/`), and editor/agent artifacts for the standalone repository.

### Next Steps (User Action Required)
- [ ] Grant database scopes to your Appwrite API Key in the Appwrite Console (`collections.*`, `documents.*`, `attributes.*`, `indexes.*`, `databases.*`).
- [ ] Run `npm --prefix server run db:migrate` to push all collections, indexes, and existing player accounts to Appwrite.



## 2026-10-08 — Imported Vehicle Asset Integration
### Completed implementation
- [x] Integrated `Police_Sports.glb` as the Interceptor base and `Pickup.glb` as the Juggernaut base with proper scaling and low triangle counts.
- [x] Retained existing Havok physics roots and procedural weapon mounting structure for consistency.
- [x] Dynamically rebuilt all four wheel pivots from the imported tire and rim pairs to support steering and spin animations.
- [x] Sanitized imported meshes by culling specific tokens (e.g., removing police flashers and sirens) and enforcing predictable material groups.
- [x] Fixed restrictive bounds scaling by injecting a `scaleMultiplier` per model to give the imported assets an appropriately imposing presence.
- [x] Mapped all remaining vehicle classes (Phantom, Manticore, Valkyrie, Wraith, Behemoth) to stable imported assets, complete with targeted token filtering and scale overrides.
- [x] Verified the TypeScript production build and headless model regressions.


## 2026-10-08 — Combat VFX asset research and spectacle audit
### Map Clutter and Atmospheric Realism
- [x] Architected a high-performance map clutter scatter system utilizing Babylon.js Thin Instances to bypass draw call limits.
- [x] Dynamically distributed theme-specific elements (rocks, scrub grass, rusted metal, glowing neon shards, frozen debris) across the map center using radial bias algorithms.
- [x] Verified zero-impact shadow-receiving logic without casting shadows, maintaining 60FPS lock under load.
- [x] Produced `docs/vfx-asset-research.md` with a ranked asset shortlist, effect-by-effect direction, asset pipeline, architecture corrections, quality budgets, and phased implementation plan.

### Decisions
- Use locally hosted, engine-neutral flipbooks and masks rather than importing Unity/Unreal particle prefabs or adding a new VFX runtime.
- First-choice free stack: Unity Labs CC0 pyro flipbooks, selected Dolkyns electric PNG sheets, and Kenney CC0 particle/smoke masks.
- Centralize local and remote ability presentation in `VfxManager` before expanding the art pass; every recipe must obey quality, distance, concurrency, and importance budgets.
- Keep Babylon CPU particles for pooled short bursts; consider GPU particles only for profiled high-count sustained weather/trails.

### Completed implementation spike
- [x] Acquired four Unity Labs CC0 source sheets, converted them to browser-ready PNG atlases, and preserved provenance in `public/assets/vfx/LICENSES.md`.
- [x] Added a typed local VFX manifest and Babylon animated-particle helper; all runtime VFX URLs are local and the selected atlas payload is 3.30 MiB.
- [x] Replaced blob-style blasts with animated explosion/fireball layers and added an animated rolling-smoke layer to vehicle destruction.
- [x] Gave plasma hitscan a compact cyan energy packet, halo, muzzle profile, impact splash, ring, and light distinct from minigun tracers.
- [x] Added graphics-tier scaling to local and remote dash trails, EMP sparks, shockwave dust, stun sparks, and Aegis particles.
- [x] Added a scene-wide transient-light cap (0/2/6 for Low/Medium/High) and repaired tracer observer/material cleanup.
- [x] Added `npm run test:vfx`; VFX validation, model regression, application lint, and production build pass.

### Remaining VFX phases
- [ ] Complete material-aware impact variants and capped scorch decals.
- [ ] Centralize the duplicated local/remote ability mesh recipes in `VfxManager` and finish their authored texture pass.
- [ ] Vendor existing remote arena textures and environment maps locally.
- [ ] Benchmark the real 5v5 stress scene across all graphics tiers; browser playtest remains user-controlled per the execution guide.

## 2026-10-08 — Projectile trails and vehicle ability VFX
### Completed implementation
- [x] Added distinct missile, mortar, and nuke flight profiles with rear-mounted emitters, weapon-scaled flame/smoke tails, and pulsing emissive core/halo geometry.
- [x] Replaced Juggernaut's fiery explosion and oversized yellow geometry with a clean dual pressure wave, cool light impulse, and restrained ground dust.
- [x] Rebuilt Interceptor lightning as a short-lived multi-strand white-blue bolt with corona, secondary branches, an impact discharge, and transient light.
- [x] Rebuilt Manticore EMP as layered cyan/violet waves, branching electric arcs, sparks, and a light pulse.
- [x] Unified those three ability visuals across local and remote vehicles through `VfxManager` recipes.
- [x] Verified TypeScript/production build, all 35 loadouts, and expanded VFX regression coverage.

## 2026-10-08 — Missile self-collision correction and Behemoth activation burst
### Completed implementation
- [x] Traced immediate muzzle explosions to the projectile ray colliding with its newly added glow/halo child meshes.
- [x] Replaced fragile mesh-name exclusions with one hierarchy-aware collision predicate covering every current and future projectile visual child.
- [x] Added a headless regression proving missile body/glow and owner meshes are excluded while arena obstacles remain collidable.
- [x] Added quality-scaled white-blue shining particles to the pressure shockwave and a gold-white radial particle blast to Behemoth's Aegis activation.
- [x] Verified production build, VFX regression suite, and application lint.

## 2026-10-08 — Unified vehicle ability visual redesign
### Completed implementation
- [x] Rebuilt Manticore EMP around three expanding jagged circular lightning circuits, layered energy fronts, blue-white charge particles, surface arcs, sparks, and a transient light pulse.
- [x] Upgraded Juggernaut shockwave with a clean pressure front, concentrated shining debris, ground dust, and cool light response.
- [x] Upgraded Interceptor lightning with a multi-strand core/corona bolt, branches, flicker, impact ring, and light flash.
- [x] Replaced Valkyrie's purple box hazard with a pulsing plasma perimeter, rising hazard field, launch ring, shining burst, and compact warp streaks.
- [x] Added Phantom cloak/decloak scan rings and silver-blue particulate dissolve cues around the existing transparency transition.
- [x] Replaced Wraith's plain torus with violet/cyan gravity fronts, collapse sparks, and a broad vertical lift stream.
- [x] Replaced Behemoth's wireframe sphere with a Fresnel-edged energy dome, counter-rotating orbital bands, surface glints, and gold-white ignition blast.
- [x] Centralized every chassis ability presentation in `VfxManager` so local and remote vehicles render the same recipes.

### 🟢 Completed
- [x] Read and understand agent execution guidelines and dev personality
- [x] Add `start`, `dev`, and `build` scripts to `server/package.json`
- [x] Replaced deprecated `ts-node` with `tsx` to fix Node 24 incompatibility crash
- [x] Refined UI system according to design guidelines
- [x] Rebuilt Main Menu (`HomeScreen.tsx`) to match requirements (PLAY, GARAGE, ARMORY, PROFILE, SETTINGS)
- [x] Implemented fully functional `GarageScreen.tsx` with premium glassmorphic UI and stat visualization
- [x] Wired up routing in `App.tsx` for new screens
- [x] Synchronized remote projectile weapons (missiles, etc.) across clients by passing targetId over the network.
- [x] Refined trajectory of nukes and mortars to launch steeply towards the sky and fall fast with high gravity.
- [x] Analyzed and fixed deployment physics race condition: Forced immediate `computeWorldMatrix(true)` on terrain meshes to guarantee `recoveryHeight` raycasts hit the ground on the first frame even if renderLoop drops frames.
- [x] Integrated logical cinematic background images into collapsible map cards in `ModeSelectScreen` (Iron Wasteland, Abandoned Facility, Glacial Outpost, Neon Sector, and Blacktop Circuit for Death Race) and unified local asset paths in `MapSelectScreen`.

### 🟡 In Progress
- [ ] Implement shop and garage upgrades (Weapon tiers, Chassis stats)

### ⚪ Pending (Will Work On)
- [x] Implement robust user authentication (Player IDs, JWT Backend)
- [x] Implement robust user authentication (Frontend AuthContext, Login Modal)
- [x] Implement progression system (XP, Levels, Matchmaking Rating)
- [x] Implement economy (Virtual Currencies: Scrap / Premium Credits)

### 🔴 Cancelled

## 2026-10-03 — Complete interface and procedural model pass
### Completed implementation
- [x] Read master index, relevant design/accessibility/React/state/performance/QA guidance and game requirements; inspect current runtime.
- [x] Establish baseline: build currently fails on duplicate dispose, missing isPlayer and type-only imports.
- [x] Industrial design tokens, responsive screen shell, complete screen inventory and honest unavailable states.
- [x] Main menu, garage/armory/details, mode/arena/setup, profile/inventory/missions/notifications and settings.
- [x] Loading/error, match objective, pause/leave and session summary presentation.
- [x] Seven shaped procedural vehicle bodies and five mechanically detailed weapon models shared by preview/game.
- [x] Headless geometry checks, TypeScript/build/lint; manual walkthrough documented (no browser per execution guide).
### Decisions
- Use the explicit game-requirements industrial direction over the current soft UI styling. Keep Babylon 9.28.0 and React 19; no new animation dependencies. Native transitions suffice; GSAP is an optional future choice for cinematic transitions, requiring approval before installation.
- Preserve physics dimensions, equipment IDs, weapon pivot names and controller discovery contracts.
- Unimplemented progression/race/matchmaking functionality gets clearly labeled unavailable states, never fabricated data or purchases.

### Verification / remaining manual work
- Model regression: all 35 loadouts pass, including gameplay ray hits; max 31 render meshes / 38,792 vertices.
- Application lint passes cleanly; TypeScript + Vite production build passes with existing Babylon chunk-size warning.
- Repository-wide lint blocked by untouched pre-existing truncated `recovered_original.ts:743`.
- Palette contrast checked at >=4.5:1 for text on three surfaces.
- Browser visual/playability/performance checks intentionally pending user verification per execution guide; see `docs/ui-experience-plan.md`.
- Missing race, economy, progression and matchmaking backends are not invented: UI presents unavailable/empty states, and the debrief reports actual session duration only.
- Fixed baseline compile blockers, preview cancellation/material cleanup, input-listener cleanup, engine event cleanup, and misleading static HUD values. No git comparisons or commits performed.

## Focused correction pass
- [ ] Replace fragile thin central terrain collision and add safe ground recovery.
- [ ] Add map-specific scenery, lighting and bounded particles to the four arenas.
- [ ] Correct chassis face winding and replace full tire rings with upper fenders.
- [ ] Simplify existing menus/HUD into compact game overlays; no additional screens.
- [ ] Run model/terrain regressions, application lint and build. Browser verification remains user-controlled.

## 2026-10-06 — Match-start vehicle deformation
### Completed implementation
- [x] Prevented Babylon's delayed global mesh merge from detaching articulated vehicle wheels and turret parts after the countdown.
- [x] Restored hierarchy-safe mesh compaction within each chassis, wheel, and turret articulation frame.
- [x] Added headless regression checks for optimizer configuration, articulation ownership, root movement, all 35 loadouts, and render-mesh budget.
- [x] Declared the controller's vehicle ID for correct bot network broadcasts and corrected the existing React type-only import build blocker.

### Decision and verification
- Dynamic scenes retain Babylon's configured quality degradations except `MergeMeshesOptimization`; that optimization disregards moving parent boundaries and disposes the articulated source meshes.
- Model regression passes: 35 loadouts, moving-root articulation, finite geometry, gameplay muzzles/rays, maximum 31 render meshes / 35,192 vertices.
- Application lint passes with pre-existing React/Auth warnings; TypeScript and the Vite production build pass with the existing Babylon chunk-size warning.
- Browser verification intentionally remains user-controlled per `Agent-execution-guide.md`.

## 2026-10-06 — 5v5 Team Deathmatch evolution
### Completed planning
- [x] Audited current matchmaking, room events, bot ownership, targeting, damage, respawn, scoring, HUD, and debrief flows.
- [x] Defined the authoritative team roster, match snapshot, combat policy, lifecycle, visuals, testing strategy, and phased rollout in `docs/tdm-5v5-plan.md`.

### Completed implementation
- [x] Phase 0: shared 5v5 contracts, centralized mode rules, team spawns, and rule regression tests.
- [x] Phase 1: exact 5+5 server match sessions, bot fill, room-scoped traffic, authoritative health/score/result, disconnect cleanup, and explicit host-loss draw.
- [x] Phase 2: typed match/network state plus stable entity/team metadata for local players, remote players, and bots.
- [x] Phase 3: opponent-only targeting and AI, shared friendly-fire policy across weapons/abilities/status/physics effects, server identity/damage validation, and authoritative kill reporting.
- [x] Phase 4: authored team formations, server-timed intro/countdown/match, delayed respawn, two-second protected respawn, first-to-25/timeout results, and one-time progression settlement.
- [x] Phase 5: Alpha/Bravo matchmaking formation, non-color vehicle markers, radar/nameplates, score/timer HUD, team kill feed, held roster, and victory/defeat/draw debrief.
- [x] Phase 6 automated acceptance: client/server builds, lint, shared-rule tests, all-loadout headless model regression, and a real two-client socket match covering 5v5 bot fill, friendly-fire rejection, kill, respawn, and protection.

### User-controlled verification
- [ ] Optional browser playtest at desktop/mobile widths and longer multiplayer soak, intentionally not launched automatically per the execution guide.

## 2026-10-07 — In-match HUD refinement
### Completed implementation
- [x] Moved the session exit control to the top-right safe area and retained the confirmation menu plus Escape shortcut.
- [x] Rebuilt the TDM scoreboard with distinct Alpha/Bravo score zones, local-team badges, score-limit progress, and a dedicated authoritative clock.
- [x] Added final-minute urgency, responsive compact layouts, non-color team glyphs, focus treatment, and mobile-safe touch sizing.

## 2026-10-07 — Player respawn lifecycle correction
### Completed implementation
- [x] Unified combat deaths and local self-destruction under one deduplicated server respawn scheduler.
- [x] Added an authenticated player respawn request for locally detected network-match destruction without awarding an enemy score.
- [x] Replaced zero-damage health synchronization with explicit authoritative health application and deterministic explosion handling.
- [x] Extended socket integration coverage to verify a destroyed human player receives a restored-health respawn event.

## 2026-10-07 — Enemy bot damage correction
### Completed implementation
- [x] Replaced the obsolete `bot_` ID-prefix checks with explicit combatant-kind and host-authority checks.
- [x] Restored server damage reporting for host-simulated bot missiles, mortars, and nukes against human players.
- [x] Restored bot-shot replication while keeping remote bot weapons visual-only to prevent duplicated client damage.

## 2026-10-07 — Player third-person camera
### Completed implementation
- [x] Reframed the chase camera above and behind the complete vehicle with forward road visibility.
- [x] Added frame-rate-independent yaw, position, and look-target smoothing plus subtle speed-based pullback.
- [x] Added obstruction handling to keep the camera in front of walls and large scenery instead of clipping through them.

## 2026-10-07 — Camera stability and combatant tag alignment
### Completed implementation
- [x] Restricted chase-camera obstruction to terrain and physical scenery so ability, missile, mortar, and explosion VFX cannot force a close-up.
- [x] Separated the smoothed camera base position from transient shake offsets to prevent repeated impacts from drifting the camera into the vehicle.
- [x] Projected HUD tags in CSS viewport coordinates and anchored them to an authored height above each vehicle class.
- [x] Detached in-world team badges from chassis rotation and made them follow the vehicle center along world-up, preventing roll/pitch misalignment.

## 2026-10-07 — Post-match return and VFX texture refinement
### Completed implementation
- [x] Added an eight-second visible results countdown followed by automatic return to the selected match lobby.
- [x] Added an immediate lobby action while preserving replay, garage, and menu choices.
- [x] Replaced the shared blocky flare image with local procedural spark, turbulent smoke, and shaped flame textures.
- [x] Switched smoke and dust to natural alpha blending, reused the refined textures across local/remote combat effects, and removed combat VFX network texture dependencies.

## 2026-10-07 — Weapon muzzle and cinematic combat VFX pass
### Completed implementation
- [x] Added authored muzzle sockets for every barrel and launch tube, including six minigun barrels and four missile tubes.
- [x] Removed the artificial projectile height offset so every tracer, projectile, flash, and replicated shot begins at its turret muzzle.
- [x] Added scaled muzzle fire and pressure smoke for each weapon class.
- [x] Reworked missile and heavy-projectile exhaust into a compact hot core with longer turbulent smoke trails.
- [x] Added layered vehicle destruction with fireball, shockwave, rotating metal debris, embers, and lingering dark smoke.

## 2026-10-09 — Battle FPS and post-match MVP correction
### Completed
- [x] Read the master index and relevant execution, persona, performance, refactoring, state, React, QA, Git, UI and accessibility guidance; checked installed Babylon 9.28.0 APIs.
- [x] Bounded weapon acquisition/LOS to 10 Hz while retaining per-frame turret tracking; ranked cheap candidates first, stopped at the best visible target, and retained immediate death/cloak invalidation.
- [x] Cached terrain candidates instead of repeatedly scanning every vehicle detail; restricted grounded checks to physical surfaces and stopped after the first valid contact.
- [x] Removed global new-mesh shadow registration, which included combat VFX; completed local/remote vehicles now explicitly register their geometry.
- [x] Disabled unnecessary preserved drawing buffers, fixed callback removal for vehicle/bot weapon updates, and suspended simulation/targeting after match end.
- [x] Replaced MVP mutation of live physics/network vehicles with an isolated presentation clone, dedicated layer/camera, frame-rate-independent orbit/rotation, bounds-based portrait framing, reduced-motion support, and deterministic disposal. Removed the unowned fireworks interval.
- [x] Prevented match snapshots/render-loop phase resolution from resetting MVP presentation.
- [x] Extracted the post-match sequence into a hook and tested timeline: outcome 4s → MVP 7s → results 10s → lobby. Final roster/result are preserved; duplicate completion and React-updater navigation side effects are removed. Missing presentation target skips directly to results.
- [x] Updated responsive result overlays and made the lobby action navigate to the selected lobby.

### Validation
- [x] `npx tsc -b` passed.
- [x] `npm run lint:app` completed; 12 existing warnings remain outside the new logic (existing state-in-effect patterns, unused catch parameter and Fast Refresh export).
- [x] `npm run test:battle` passed: timing boundaries/fallback, dead/remote-source MVP framing/orbit/isolation, reduced motion, cleanup, shadow registration, terrain cache, cloak and wall occlusion. The visible-target workload used 10 LOS rays across 60 frames; the previous descending-distance loop would use 180 for this target order. This is a raycast-work reduction, not a measured FPS claim.
- [x] `node scripts/verify-terrain.mjs` passed all 2,880 actual Havok checks. Replaced exact floating-point recovery equality with a 1e-6 tolerance after the new query produced a 1.3e-13 difference.
- [x] Existing match-rule, 35-loadout model, and VFX checks passed.
- [x] No production bundle build or browser verification launched, following the execution guide's opt-in requirements.

### Decisions / user-controlled next steps
- [ ] Compare battle FPS in the same arena/loadouts/graphics preset on host and client, including simultaneous heavy explosions. GPU timing and actual FPS remain unmeasured.
- [ ] Play through win, loss and draw; confirm full-vehicle orbit, dead/remote representative visibility, portrait framing, lobby return and a second match.
- MVP selection retains the existing winning-team representative policy (with connected-player filtering). The match snapshot has no per-player performance statistics; a true statistical MVP requires a separate server contract change.
- Kept 120 Hz physics substeps intact to preserve the existing anti-tunneling behavior.

## 2026-10-09 — Grounded garage redesign
### Completed
- [x] Replaced the floating glass panels and oversized carousel with an equipment list, unobstructed vehicle bay, catalog specifications and a persistent equip action.
- [x] Used the existing neutral/amber game palette, compact typography, flat section divisions and restrained selection states. Removed decorative glow, entry animation and fabricated performance bars.
- [x] Added a garage-only matte service bay, painted floor lines and shutter backdrop. Other preview screens retain their existing showroom environment.
- [x] Added model-bounds/aspect-aware camera framing, user-controlled garage orbit, a reset-view button and keyboard instructions. One-sided backdrop surfaces avoid obscuring the car when viewed from behind.
- [x] Preserved equipment drafts, immediate paint saving, URL category selection, back navigation and equipped indicators; connected the supplied Upgrades action.
- [x] Split selection, details, scene dressing and scoped styles into the garage feature directory.
- [x] Added named paint controls, pressed states, visible focus styles, reduced-motion support and mobile scrolling with the equip action outside the scrolling content.
- [x] TypeScript passed. Focused garage lint passed with no warnings. Application lint has 11 existing warnings; removed the garage's unnecessary mounted-state effect.
### User-controlled verification
- [ ] Inspect desktop, tablet and phone layouts; try every vehicle/weapon, paint, reset view, equip and back navigation.
- [ ] Browser visual verification and production build remain opt-in per the execution guide; neither was launched.

## 2026-10-09 — Garage theme alignment and upgrade removal
### Completed
- [x] Matched the actual HomeScreen/LobbyScreen theme: slate-black backgrounds, white primary actions, rounded dark translucent panels, pill category navigation, uppercase bold headings and monospace labels.
- [x] Replaced the amber garage treatment with scoped monochrome tokens; updated preview colors to the same dark environment. Kept real catalog specs, named paint choices, camera reset and loadout state behavior.
- [x] Removed the garage Upgrades button and callback, workshop view/route, operations Upgrades section, placeholder upgrade content and all unused upgrade CSS. Old workshop hashes fall back to Home; old upgrade section query values fall back to Profile through existing validation.
- [x] Preserved responsive equipment browsing, independently scrollable panels, keyboard focus and reduced-motion rules.
- [x] TypeScript passed; app lint completed with 11 existing warnings and no new warnings.
### User-controlled verification
- [ ] Inspect garage alongside Home/Lobby at desktop and phone sizes; check selecting/equipping vehicles and weapons, paint changes, and Back.
- [ ] Browser verification and production build were not launched, per execution guidance.

## 2026-10-09 — Battle audio assets and match sound design
### In progress
- [ ] Research downloadable combat music, weapon effects and recorded announcer packs; retain source/license/attribution records.
- [ ] Curate and validate local assets, replacing remote placeholder music and auditing existing sample quality.
- [ ] Implement bounded spatial effects, music/announcer mixing, loading/autoplay recovery and deterministic session cleanup.
- [ ] Wire countdown, first kill, match results and combat sounds; add audio controls and regression checks.
### Verification
- [ ] Asset format/duration/license checks, event/mixer regressions, TypeScript and application lint. No automatic browser launch.

## 2026-10-09 — Vehicle-specific weapon attachments
### Completed
- [x] Read guidance and relevant persona, execution, refactoring, performance, QA and Git standards; checked installed Babylon 9.28.0 and inspected all seven imported GLBs, procedural fallback geometry and weapon/controller discovery.
- [x] Audited source models: Police Sports 1,418 triangles; Pickup 1,658; Hatchback 1,378; Police SUV 1,700; Muscle 2 1,936; Sedan 1,466; Firetruck 3,544. The former shared placement used the highest model bound, putting the firetruck weapon above its ladder.
- [x] Added vehicle-specific hardpoints: Interceptor/Valkyrie sporting bonnet assemblies; Wraith compact bonnet assembly; Phantom compact side pods; Juggernaut/Manticore armored side pods; Behemoth industrial side pods below its ladder.
- [x] Measured bonnet surfaces and side-panel contact points directly from imported geometry before applying spawn transforms. Added fixed rails, saddles, outriggers and panel anchors; weapons retain independent yaw/pitch articulation.
- [x] Added sport, compact, armored and industrial receiver housings, vehicle-specific scale/trim and outward-facing minigun ammunition drums. All five weapon mechanisms, authored muzzle sockets, damage, ammunition and firing cadence are retained.
- [x] Applied the same layouts to procedural fallbacks and the shared factory used by previews, local vehicles and remote vehicles.
### Validation
- [x] Expanded `npm run test:models` to load the actual seven GLBs: all 70 imported/procedural loadouts pass finite geometry, wheel discovery, mount counts/symmetry, articulation, muzzle hierarchy, hit testing, moving-root and mesh-budget checks.
- [x] Imported mounts remain below roof/ladder height; side muzzles clear the body at the center and both ends of the 60-degree acquisition cone. All seven imported layouts remain invariant under translated/rotated spawn transforms.
- [x] Maximum 47 render meshes / 44,616 vertices, retaining the existing under-50-mesh budget.
- [x] TypeScript and focused lint pass. Application lint has 11 existing warnings outside this change. Battle targeting/regression checks and VFX checks pass.
### User-controlled verification
- [ ] Review every vehicle and weapon in the garage from front, side and rear; check bonnet fit, side brackets, firetruck ladder clearance and firing while turning/on slopes in battle.
- Browser visual review and production build were not launched, following the execution guide. Headless checks establish geometry/hierarchy constraints, not final visual approval.

## 2026-10-09 — Preview unavailable after weapon attachments
### Completed
- [x] Reproduced the screenshot's post-load failure headlessly: `TypeError: mesh.getTotalVertices is not a function` in the preview hierarchy-bounds predicate. Babylon 9.28.0 invokes that predicate for TransformNodes as well as meshes.
- [x] Added a shared AbstractMesh type guard to preview/MVP bounds filters, preserving enabled/visible geometry checks and excluding transform-only nodes. Preview failures now log their actual cause; failed engine initialization clears the scene reference.
- [x] All 70 actual imported/procedural loadouts pass the preview bounds regression, including transform nodes and hidden-helper exclusion. Battle/MVP regression checks, TypeScript and focused lint pass.
- Browser verification and production build were not launched, per project guidance.

## 2026-10-09 — Behemoth persistent Aegis wireframe
### Completed
- [x] Identified missing disposal of `aegis-grid-dome` and its material in the shared six-second shield timeout used by local and remote vehicles.
- [x] Dispose the grid sphere and its material alongside the energy shell and orbit rings at the existing six-second expiry. Shared fix applies to local and remote Behemoth overdrive.
- [x] Added headless lifecycle coverage: shield remains through 5,999 ms and all shield meshes/materials disappear at 6,000 ms; particles and animation callbacks clean up; three repeated activations pass with particles both enabled and disabled.
- [x] VFX regressions, TypeScript and focused lint pass. No browser or production build launched under project guidance.

## 2026-10-09 — Terrain-grounded scenery and Wraith particles
### Completed
- [x] Located flat-zero placement in arena clutter/markings and pre-heightmap placement of map covers/walls; located dark mesh debris and smoke in Wraith's shared gravity pulse.
- [x] Added a static terrain sampler using Babylon heightmap quad lookup plus ray intersection for raised geometry. Clutter, grass, landmark groups, pipes and vent origins use terrain-relative heights; scatter remains inside the arena boundary.
- [x] Replaced rigid road-marking boxes with subdivided strips sampled along their length. Map walls/covers/poles now wait for heightmap completion and are placed relative to the terrain before physics bodies are created.
- [x] Removed Wraith's dark polyhedron debris and smoke ribbons; added green additive spark particles, green shockwave rings/burst/light and retained particle-quality scaling, cleanup and shared local/remote behavior.
- [x] New `npm run test:scenery` passes across four themes: 88 conforming road strips and 18,800 terrain-grounded clutter instances on non-flat geometry. Fast sampler agrees with actual ray intersections, including raised terrain.
- [x] VFX checks verify Wraith additive green sprites, absence of dark debris meshes, quality gating and cleanup. Existing Aegis lifecycle checks and 2,880 Havok terrain checks pass; TypeScript and focused lint pass.
### User-controlled review
- [ ] Inspect map markings/clutter on hills and valleys, and trigger Wraith overdrive in-game. Browser verification and production build were not launched, following project guidance.

## 2026-10-09 — Match vehicle scale balance
### Completed
- [x] Selected a shared 1.5× match scale; garage previews retain authored size.
- [x] Scaled local/bot collision dimensions and complete local/remote visual hierarchies, including weapons and wheels. Kept physics/network roots unscaled and retained vehicle handling/damage tuning.
- [x] Adjusted spawn/respawn terrain clearance, wheel rotation radius, label heights and modest chase-camera clearance so vehicles appear larger against the arena.
- [x] All 70 imported/procedural loadouts pass uniform-scale and muzzle-position checks; physics/network roots remain unit scale. Terrain regression now covers both original and 1.5× collision shapes (5,760 Havok checks). Battle/MVP regressions, TypeScript and focused lint pass.
- [x] Behemoth shield radius follows the match scale so it still encloses the enlarged vehicle.
### User-controlled review
- [ ] Review the 50% increase in a match, including heavy-vehicle camera framing, tight passages and multiplayer proportions. Browser verification and production build were not launched under project guidance.

## 2026-10-09 — Shared ability vortex wind-up
### Completed
- [x] Traced local player/bot activation and replicated remote ability dispatch.
- [x] Added a 1.1-second additive particle sequence: chassis emergence, revolving helix, inward collapse, then existing ability execution. Colors follow the ability, including green Wraith and gold Behemoth.
- [x] Broadcast activation at wind-up start; maintain shared duration on remote vehicles. Bound particle count and cancel pending execution on death, disposal, disabling status or match end.
- [x] Verify sequencing, transformed/moving chassis tracking, cancellation, resource cleanup, TypeScript and lint.
### User-controlled review
- [ ] In a match, test the ability of a local, bot, or remote vehicle to observe the shiny vortex wind-up animation before the ability executes. Browser verification and production build were not launched following project guidance.

## 2026-10-10 — Repeatable overdrive, deploying hardware and combat HUD
### Completed
- [x] Read the master index and relevant persona, execution, UI/creative/accessibility, state/React, refactoring/performance, QA and Git standards. Inspected installed Babylon 9.28.0 particle lifecycle and optimizer source.
- [x] Reproduced persistent particle shutdown from Babylon's default adaptive optimizer. Excluded its global particle-disable step while retaining tiered density and other safe optimizations.
- [x] Replaced vehicle-cached vortex systems with activation-owned emitters; dispose buffers/callbacks on completion, cancellation, parent/scene disposal without disposing the shared sprite. Retained the 1.1-second wind-up and local/bot/remote dispatch.
- [x] Added seven chassis-relative hardware recipes: Interceptor conductors, Juggernaut impact rams, Phantom cloak vanes, Manticore coils, Valkyrie rear exhaust nozzles, Wraith gravity coils and Behemoth shield projectors. Hardware extends, holds through the effect and retracts; cancellation/death/match-end cleanup is bounded.
- [x] Added a hostile tracking rectangle from eight projected chassis corners, cached local bounds, camera-frame updates outside React state, acquiring/engaging states and clipping/dead/cloak guards.
- [x] Replaced the central colored targeting display and boxed kill banners with a quiet white reticle, monochrome insignia, unboxed display typography and reward line. Latest accolade takes precedence to prevent stacking over the aiming area. Preserved existing award rules/copy; added live announcements and reduced-motion styling.
### Validation
- [x] TypeScript passes. Application lint reports 11 existing warnings outside this work; focused changed-file lint passes.
- [x] VFX regression exercises actual particle emission for all seven abilities, replay after cancellation/disabled/match-end, shared texture preservation, mechanism extension and mesh/material cleanup, parent/scene disposal, the optimizer shutdown reproduction and target-frame movement/dead/cloak/depth rejection.
- [x] Existing battle targeting/MVP regressions and all 70 imported/procedural vehicle/weapon loadouts pass.
### Decisions / manual verification
- Existing Babylon render callbacks and native CSS provide the required motion; no new dependencies.
- Particle telegraphs remain enabled under adaptive degradation; actual FPS impact requires an in-game comparison.
- [ ] Play each vehicle through repeated abilities, combat death and self-destruction/respawn; check local, bot and remote visuals and hardware fit while turning/on slopes.
- [ ] Review target tracking at different distances/resolutions and first/double-kill presentation at desktop/mobile sizes.
- Browser visual verification and production bundle were not launched, per execution guidance. Headless checks establish behavior and cleanup, not final visual approval.

## 2026-10-11 — Particle follow-up and compact vehicle HUD
### Findings
- User confirmed the mechanical deployment and main ability still execute when the vortex disappears. This isolates the reported symptom to the wind-up visual path.
- Previous tests used `animate(true)`, which bypasses Babylon readiness and scene draw dispatch. An isolated normal-render replay of the previous emitter succeeded; the exact live-session failure was not captured headlessly, so the earlier optimizer change was not a demonstrated complete fix.
- Found a separate concrete ownership defect: VehicleController disposal freed the manager-owned smoke/fire textures used by other vehicles. These three particle systems now dispose with `false` to retain shared textures.
### Completed
- [x] Replaced the wind-up ParticleSystem dependency with a self-contained batch of camera-facing additive spark quads (one mesh/draw call, 24–100 sprites). It owns its sprite texture and material, follows the moving chassis and retains emergence/orbit/collapse timing and per-vehicle colors.
- [x] The vortex now renders through the mesh path even if ordinary scene particles are disabled; unrelated pooled emitter/texture cleanup cannot affect it. Completion/cancel/death/scene cleanup disposes all owned resources. Shared local/bot/remote activation remains in place.
- [x] Added a circular ability button with progress ring, readiness/countdown, keyboard focus, touch activation and seven selected-vehicle SVG silhouettes. Replaced the old touch ability button so there is one functional control.
- [x] Rebuilt hull information as a segmented monochrome meter with numerical health and explicit critical/destroyed status. Retained ammo/reload information.
- [x] Moved team kills and remaining time into one compact top-center strip; moved kill feed below top controls. Mobile keeps the radar/speed at reduced scale and reserves separate joystick/ability areas.
### Validation
- [x] VFX tests pass: all seven sprite recipes follow the chassis, completion/retry/cancellation cleanup, existing Aegis lifecycle and targeting projections.
- [x] Three full NullEngine scene-render cycles reach the vortex draw callback with global particles disabled, an invisible physics root, and disable/re-enable between uses. NullEngine's owned raw texture is explicitly marked ready because no GPU upload occurs; material/shader readiness and scene dispatch remain exercised.
- [x] TypeScript and focused lint pass. Application lint retains 11 unrelated warnings. Existing battle/MVP regressions pass.
- [x] Server-rendered HUD checks cover ready/cooling/destroyed states, all seven selected chassis and clock formatting.
### User-controlled verification
- [ ] Start a fresh match and repeat overdrive before/after death and self-destruction. Review the particle appearance and HUD at desktop/phone sizes.
- No browser launch or production build, following execution guidance. Headless draw-dispatch tests do not constitute GPU/visual confirmation in the user's browser.

## 2026-10-11 — Death Race
### In progress
- [ ] Add isolated online race queue, six-racer bot-filled grid and server-owned race simulation.
- [ ] Build a dedicated paved circuit with barriers, start/finish markings, checkpoints and weapon pickups.
- [ ] Implement three-lap validation, standings, limited pickup ammunition, destruction/recovery and results.
- [ ] Integrate mode selection, Interceptor restriction, race HUD, controls and disconnect/error cleanup.
- [ ] Verify race physics/rules, bot completion, real socket integration, TypeScript and lint.
### Decisions
- User selected online players with bot fill. Six racers, no teams; first three-lap finisher wins. The server simulates every racer from validated inputs so race authority is independent of a player host.
- Dedicated flat tarmac circuit uses a fixed-step vehicle model (acceleration/braking, lateral tire grip, speed-sensitive steering, barrier/car impacts). No terrain jumps or heightmap seams.

## 2026-10-11 — Death Race immersion follow-up
### Completed
- [x] Restore validated ability inputs, shared auto-targeting/lock-on and player/bot combat with TDM weapon presentation.
- [x] Synchronize Interceptor lightning wind-up, cooldown, impact and cancellation under server authority.
- [x] Tune launch acceleration, braking, corner grip and slope response; share elevation with prediction/rendering.
- [x] Add elevated bridge spans and supports; replace pickups with labeled glowing translucent spheres.
- [x] Run race simulation/network, rendering geometry, TypeScript, lint and relevant combat regressions.
### Decisions
- Preserve the existing Interceptor-only race roster and server-owned damage/lap rules.
- Reuse installed Babylon 9.28.0 and existing combat VFX. No additional animation library is needed for this engine-level work.
- Browser playtesting remains user-controlled per Agent-execution-guide.md; no browser or production bundle requested.

### Validation and findings
- [x] All six bots finish three laps with combat and bridge grades enabled. Tests cover all five weapons, lock delay, cadence, limited ammo, ordered checkpoints, protection and recovery.
- [x] Human/bot lightning tests cover first activation, 1.1-second wind-up, impact, repeat use, cooldown, death and protected-target cancellation.
- [x] Two-client socket regression passes, including malformed ability rejection, actual player activation/impact/cooldown, input authority and disconnect continuity.
- [x] Babylon NullEngine verifies the full road corridor, upward-facing triangles, road/simulation height agreement and fewer than 40 static meshes. Fixed pre-existing downward road triangle winding and increased curve sampling for ramp alignment.
- [x] Actual pickup meshes/materials verify transparency, labels, road-relative elevation, collection/respawn visibility and scene cleanup (text canvas substituted headlessly).
- [x] Battle targeting and VFX regressions pass; race presentation targets cannot trigger client firing. Weapon swaps now dispose prior targeting observers/materials and first-shot events equip their own weapon.
- [x] Frontend and backend TypeScript and focused lint pass. Application lint has 11 existing warnings outside this change.
### User-controlled review
- [ ] Play a race to judge acceleration, cornering, bridge framing, pickup glow and combat appearance on desktop/mobile. Headless checks do not establish visual quality or live GPU performance.
- No browser or production bundle was launched, following the execution guide. Elevated road-constrained driving replaces the earlier flat-circuit decision; the Interceptor-only roster is unchanged.

## 2026-10-11 — Roads across TDM arenas
### Completed
- [x] Add a connected terrain-conforming road network across Wasteland, Facility, Glacial and Neon maps.
- [x] Author local procedural road textures with themed asphalt, shoulders, lane markings and junctions.
- [x] Keep scenery scatter off the road and preserve existing vehicle/terrain physics.
- [x] Verify all four map sizes/themes, road connectivity, terrain alignment, cleanup, TypeScript and lint.
### Decisions
- Reuse the completed terrain triangles for a thin road overlay, avoiding floating strips and new collision seams.
- Use local generated texture data and Babylon 9.28.0; no downloaded assets or new dependencies.
- Browser review remains user-controlled under the existing execution guidance.

### Validation
- [x] Scenery regression passes for Wasteland/Glacial/Neon at 600m and Facility at 500m: all spawn slots and routes connected, road footprints clear authored cover, exact terrain topology/height/UV alignment and scene cleanup.
- [x] Verified all 18,800 grass/debris/stone/shard instances stay grounded and outside pavement/shoulders.
- [x] Visual overlays remain outside Havok, spawn/recovery sampling, targeting picks and projectile collision; underlying terrain retains its collision behavior.
- [x] Battle and VFX regression suites pass. TypeScript and focused lint pass; full app lint retains the same 11 unrelated warnings.
- [x] Inspected the generated texture atlas for connected lanes, junction paint and shoulders without opening a browser.
### Manual review
- [ ] Drive through each map to judge road contrast, near-wheel detail and performance across graphics settings. No browser or production build was launched under the execution guide.

## 2026-10-11 — Minimal central TDM cover
### Completed
- [x] Place four balanced, terrain-grounded cover islands around the central crossing on every map.
- [x] Match each map's scenery and give cover real collision and line-of-sight blocking.
- [x] Verify road/spawn clearance, concealment, collision, TypeScript and focused lint.
### Decisions
- Four isolated obstacles leave the intersection and broad escape paths open; no enclosed compounds or additional road barriers.
- Browser playtesting remains user-controlled under project guidance.

### Validation
- [x] All four maps pass: exactly four cover islands each, terrain-embedded bases, seven metres of concealment above local high ground, symmetric positions and clear roads/spawns.
- [x] Vehicle-height visibility rays and actual Havok raycasts hit each cover body; projectile collision accepts the obstacles.
- [x] Existing road/scenery cleanup and all 18,800 clutter checks pass. Battle targeting regression, TypeScript and focused lint pass.
### Manual review
- [ ] Drive around central cover in each map and judge hiding/escape balance. Browser verification remains user-controlled; no production bundle was launched.

## 2026-10-11 — Valkyrie dash collision launch
### In progress
- [ ] Add bounded swept vehicle contact detection during executed Valkyrie overdrive.
- [ ] Route validated multiplayer impacts to the physics owner for human and host-controlled bot targets; preserve remote replication.
- [ ] Apply mass-scaled forward/upward launch once per target per dash, with cancellation/protection/team guards and impact VFX.
- [ ] Verify collision geometry, lifecycle, Havok launch, real socket authority, TypeScript and lint.
### Decisions
- Remote meshes remain presentation proxies. Only the victim's owner applies physics, and normal state replication displays the launch elsewhere.
- The collision boost lasts 1.5 seconds after the existing 1.1-second wind-up; the five-second ground hazard remains separate.

## 2026-10-12 — Outer horizons and downloaded vehicle fleet
### Implemented
- [x] Audit and prepare both downloaded GLBs: normalize axes/scale, reduce geometry/material cost, expose wheel corners and paint.
- [x] Apply four distinct body styles across all seven IDs, retaining abilities, weapons, showroom and race integration.
- [x] Add themed low-poly surroundings beyond all arena boundaries and the race circuit.
- [ ] Final validation deferred at user request; prior model/scenery, combat, VFX, race and TypeScript/lint checks covered the earlier iteration only.
### Decisions
- User confirmed seven gameplay vehicles with four visual styles.
- Keep original downloads untouched; generate repeatable optimized runtime assets.
- Use Babylon 9.28.0 and glTF Transform 4.5.1. Browser verification remains user-controlled; no production build requested.

### 2026-10-13 — User-directed refinement
- [x] Correct Babylon GLB axis conversion and restore larger class-specific model sizes.
- [x] Replace instantaneous yaw overrides with bounded weight/wheelbase-sensitive Havok torque; brake before reverse with a separate reverse-speed limit.
- [x] Replace repetitive horizon rings with varied biome terrain, clustered foliage and authored regional landmarks.
- Testing paused at the user's explicit request. Earlier checks do not validate these subsequent handling/scenery refinements.

### Implementation notes
- Driving now uses a rate-limited steering rack, signed-speed wheelbase yaw target, bounded inertia-scaled angular impulses, capped tire grip and a lowered centre of mass. Havok retains collision/airborne rotation.
- Opposite throttle brakes to zero before accelerating the other way. Reverse uses 36% of forward top speed and reduced acceleration; visual steering does not invert while reversing.
- Surroundings now use seeded spatial terrain, asymmetrical mountain groups, sediment/snow/distance vertex colors, clustered multi-tier foliage and terrain-grounded boulders. Facility has tank/gantry districts; Neon has staggered towers, rooftops and light bands.
- No tests, browser checks or builds run after the user requested pausing testing. Driving feel and final scenery appearance remain unverified in-game.

## 2026-10-13 — Stronger driving response and clean roads
### Implemented
- [x] Increase forward acceleration by 35%, reverse acceleration by about 42%, steering lock/rack speed and bounded yaw response; raise grip to support the tighter turns.
- [x] Keep class weight differences, speed limits and braking-before-reverse behavior.
- [x] Remove separate circular rise platforms; bake smoothly tapered hills directly into the heightfield before building Havok collision.
- [x] Replace noisy, randomly punctured road paint with filtered continuous markings, smooth asphalt and subtle detail grain. Increase atlas resolution and anisotropy; use blended edges and depth bias against terrain flicker.
### Verification
- Testing remains paused per the user's prior request. No browser, tests or build run for this refinement.

## 2026-10-13 — Matchmaking socket lifecycle
### Implemented
- [x] Move queue transport into MatchmakingService with an explicit cancellation/transfer boundary.
- [x] Defer connect until after synchronous React Strict Mode effect replay; cancel connections even while pending/reconnecting.
- [x] Clear delayed handoff on teardown/disconnect, ignore duplicate match events, and remove queue listeners before gameplay ownership transfer.
- [x] Surface authentication, connection and exhausted-retry errors; centralize socket server origin through VITE_SERVER_URL.
### Verification
- Source inspection found lifecycle races, but the reported browser warning alone cannot prove which closure triggered it. Testing/browser verification remains paused under the user's prior instruction.

## 2026-10-13 — Rejected session blocking matchmaking
### Implemented
- [x] Handle server authentication rejection as terminal: close the socket, clear the invalid saved session, close matchmaking and return to sign-in with a reason.
- [x] Count queue time only after connection/authentication succeeds; stop counting on a match or connection failure.
- [x] Use the shared backend origin for login/register as well as matchmaking, preventing authentication against a different server when VITE_SERVER_URL is set.
### Findings
- Screenshot confirms a successful WebSocket upgrade followed by the server's generic authentication rejection. It does not establish whether the token expired or became invalid for another reason.
- The server queue already starts a five-second timer and fills vacancies with bots. Rejected connections never enter that queue; no legitimate match can be created by bypassing authentication.
- Tests/browser checks remain paused under the user's prior instruction.

## 2026-10-15 — Arena backgrounds, steering and combat readability
### Completed
- [x] Replaced outer terrain/tree/rock/district batches and duplicate skies with one camera-centred panoramic sky per map, including race. Procedural illustrations show dunes, snowy peaks, refinery silhouettes, a lit city and wooded hills. Removed extra outer neon towers and race pit blocks; retained gameplay terrain, walls and cover.
- [x] Increased steering lock/rack speed, yaw response and lateral force budget across all seven arena classes. Updated shared race steering so server simulation and client prediction agree. Weight, reverse steering, braking-before-reverse and speed limits remain intact.
- [x] All graphics presets use 1 / window.devicePixelRatio. Arena/race resize and garage resize update scaling; automatic optimization cannot downscale the framebuffer. Updated settings copy. Excluded sky from arena bloom.
- [x] Replaced floating relationship/name labels with shield/crosshair markers, and status sentences with distinct animated effects (lift, shield, electrical, dash, cloak, radiation). Kept accessible descriptions, health bars and reduced-motion support. Target acquisition/lock uses frame styling without floating words.
### Verification
- Passed production build and TypeScript; build reports the existing large Babylon bundle warning.
- Passed scenery and race suites, including all six race bots completing the course.
- Added and passed scripts/verify-driving-presentation.mjs: all seven vehicle configurations turn at least 20% faster under simultaneous forward/steer; reverse, braking and frame-rate checks; native DPR for all presets; optimizer guard; five seamless skies and texture disposal.
- Updated stale scenery expectations from the removed outer terrain and old four-mesh road arrangement to one sky and one overlay per current terrain mesh.
- Changed-file lint clean. App-wide lint has ten warnings in existing React/auth files.
- Browser and visual playtesting left to the user under Agent-execution-guide.md. Native DPI increases pixel workload on high-density displays; lower presets still reduce shadows/particles/glow.

## 2026-10-16 — Visible themed skies and manual firing
### Completed
- [x] Fixed white sky output: StandardMaterial adds emissiveColor to emissiveTexture, so the white base saturated every pixel. Set the base to black and retained all five distinct, seamless map illustrations.
- [x] Kept automatic target acquisition/tracking; human arena weapons require a held firing request. Race input now sends the held trigger instead of unconditional fire; server targeting remains automatic and bots retain their own firing behavior.
- [x] Space fires; E activates chassis abilities in both modes. Added reusable mobile HoldFireButton with pointer capture, pressed feedback, accessible label and release/cancel/blur/visibility/unmount cleanup. Touch controls also appear on coarse-pointer tablets.
- [x] Cleared held input on lost focus, hidden documents, menus and teardown. Updated loading, settings, ability and race hints.
### Verification
- Production build and TypeScript passed; existing large Babylon bundle warning remains.
- Battle, race and driving/presentation checks pass, including lock-without-shots, trigger/release, disabled/dead driver gates, distinct sky pixels and additive-color saturation regression.
- Browser/visual verification remains for the user under project guidance. Headless checks do not confirm the final on-screen appearance.

## 2026-10-16 — Shift ability binding
- [x] Changed the special-ability keyboard trigger from E to Shift in arena and race. Space continues firing; touch ability controls remain available. Updated HUD, loading and settings hints.
- Verification: TypeScript and targeted lint checks passed.

## 2026-10-16 — Gun and plasma damage increase
- [x] Doubled arena minigun damage 5 → 10 and plasma damage 15 → 30 in the shared vehicle weapon controller; synchronized multiplayer server damage caps. Applies equally to local players, host bots and remote attackers.
- [x] Doubled race minigun damage 12 → 24 and plasma damage 45 → 90 in the shared race weapon definitions. Fire rate, ammo and other weapons unchanged.
- Verification: client TypeScript, server build, targeted lint and race combat/simulation checks passed. Restart the running server to load the updated arena damage caps.

## 2026-10-16 — Separate production deployments
### In progress
- [ ] Validate frontend backend-origin env at build time; configure Netlify and provide env examples.
- [ ] Validate server runtime env, restrict HTTP/WebSocket origins, remove production secret/database fallbacks, add health and shutdown handling.
- [ ] Provide SQLite migrations and a self-contained backend package including compiled shared game rules.
- [ ] Verify production configuration, clean database setup, authentication/network behavior and builds. Confirm exact Blitz service/URLs with user; do not deploy.

## 2026-10-17 — New asset audit and audio integration
### Completed
- [x] Inventory the 35 audio clips, 109 OBJ meshes and 287 PNG textures; document suitability and import constraints.
- [x] Integrate a curated audio subset with existing combat, abilities and driving; retain music/UI and volume controls.
- [x] Verify audio asset paths, lifecycle behavior, TypeScript and lint; leave browser listening/playtesting to the user.
- [x] Deliver a prioritized model/texture adoption plan without changing the current visuals.
### Decisions
- Reuse the existing Web Audio SoundManager, with no new dependencies. Copy only used clips into public assets.

### Verification
- Passed `npm run test:audio`: 17 copied clips (277,523 bytes), playback, 32-voice budget, mute, cleanup/re-entry, pitch cap and failed-load behavior.
- Passed TypeScript, targeted lint, battle checks and race checks. App-wide lint reports ten existing warnings in unchanged UI/auth files.
- Production build could not proceed past the existing configuration guard: `VITE_SERVER_URL` is not set to the public HTTPS backend origin. No deployment configuration was changed for this audio task.
- No browser was opened. Listening, codec compatibility and final mix/loop quality remain manual checks per project guidance.
- Full 431-file structural inventory: docs/assets/new-assets-inventory.csv. Adoption priorities, remaining audio roles and manual QA: docs/assets/new-assets-plan.md.

## 2026-10-17 — OBJ projectile visuals only
### Completed
- [x] Prepare rocket.obj, mortar.obj and nook.obj as lightweight reusable projectile geometry.
- [x] Replace missile/mortar/nuke projectile visuals only; preserve mounted weapons, trajectory, damage and network behavior.
- [x] Keep tail trails/glow readable and verify pooling, collision exclusions, orientation, types and regressions.
### Decisions
- Inspected offline top/side wireframe projections. Choose the finned rocket over the narrow guidedmissile for silhouette readability.
- Bake these three small OBJ meshes into typed vertex data offline, avoiding asynchronous per-shot loading or an additional runtime parser. Original files remain intact.

### Verification
- Passed TypeScript and targeted lint; projectile tests validate source hashes, 240 triangles, winding/normals, centered bounds, shared geometry/materials, non-colliding visuals, tail anchors, pool reuse and separate scene ownership.
- Passed battle, VFX and race regression suites.
- Production bundle passed into /tmp/overdrive-projectile-build using a command-scoped https://build-validation.invalid backend placeholder solely for compilation. No deployment/env configuration changed; that temporary build is not configured for live backend use. Existing Babylon chunk-size warning remains.
- Browser playtesting remains for the user per project instructions. Existing mounted weapon models, bullet/plasma tracers and gameplay rules were not edited.

## 2026-10-17 — Audible abilities and louder laser shots
### Completed
- [x] Raise laser/plasma shot gain; preserve its projectile appearance per user clarification.
- [x] Play supplied special-ability clips at accepted activation, increase gain and prevent chase-camera attenuation for the local player.
- [x] Prioritize ability cues during dense combat, cancel interrupted wind-ups and verify arena/remote/race paths.

### Verification
- TypeScript, targeted lint, audio, VFX, battle and race checks passed. Extended tests cover all seven clips, louder gains, local listener-relative routing, priority during voice saturation and cancellation on interrupted wind-ups.
- Production bundle passed with a command-only validation backend placeholder into /tmp/overdrive-audio-mix-build; no environment/deployment settings changed. Existing large Babylon bundle warning remains.
- Projectile appearance and weapon models unchanged. Manual listening remains for the user; no browser opened.

## 2026-10-17 — Simplified black-and-white match setup
### Completed
- [x] Replace disconnected home/map/lobby/garage steps with one accessible setup screen and explicit start action.
- [x] Keep working modes/settings; remove spectator and placeholder operations routes from the menu.
- [x] Preserve selections, expose race restrictions, simplify matchmaking status/cancel/retry, and support small screens.
- [x] Verify selection/launch rules, markup, TypeScript, lint and build without browser testing per project guidance.

### Decisions and verification
- One signed-in setup page replaces home/mode/map/lobby/garage hops. Removed the retired page implementations and placeholder operations screen; old hashes resolve safely to setup. Functional settings and paint remain available.
- Native selection controls apply immediately; setup is validated/persisted. Race shows its fixed chassis/unarmed start without changing arena choices. A single explicit action enters arena/race/queue.
- Native matchmaking dialog adds focus containment, cancel/Escape and retry; reconnect clears the error state. Existing transport ownership/handoff remains unchanged.
- Passed setup interaction/headless markup checks, TypeScript and changed-file lint. App-wide lint has five existing warnings in AuthContext, AuthScreen and GameCanvas.
- Production bundle passed with a temporary validation backend URL into /tmp/overdrive-menu-build; existing Babylon chunk warning remains. No deployment configuration changed.
- Manual responsive, preview, keyboard/dialog and live-server checks remain for the user per project guidance; no browser opened. Details: docs/match-setup-flow.md.

## 2026-10-17 — Game-first hangar presentation correction
### Completed
- [x] Replace the dashboard-like setup layout with a vehicle-dominant combat hangar, direct chassis/armament buttons, a compact arena strip and deploy control.
- [x] Preserve existing launch rules, saved choices, keyboard operation and mobile layout; verify without opening a browser.

- Verification: setup interaction tests, TypeScript, targeted lint and production bundle passed (temporary validation backend URL; existing Babylon chunk-size warning). Browser appearance remains for user verification per project guidance.

## 2026-10-17 — Tactical Minimalist Black & White UI/UX Redesign
### Completed implementation
- [x] Redesigned **Before Battle** screens:
  - `AuthScreen`: Transformed from a generic web login box into an immersive tactical combat uplink terminal with corner brackets, monospace callsign inputs, mode toggles, and zero-latency audio hooks.
  - `MatchSetupScreen` & `EquipmentPicker`: Upgraded into a military-spec combat hangar HUD with index numerals, chassis telemetry, tactile paint swatches, sector map cards, and high-impact deployment CTA.
  - `MatchmakingOverlay`: Converted to an orbital satellite uplink modal with live telemetry, radar sweep animation, and responsive tactical action buttons.
  - `SettingsScreen`: Overhauled into a tactical configuration matrix with segmented graphics presets, custom audio gain slider, and combat keymap table.
- [x] Redesigned **In Match (Combat HUD)**:
  - `MatchStrip`: Precision tournament scoreline with dual-team brackets, digital clock alarm, and clean typography.
  - `VehicleSystems`: Cockpit status console with Overdrive ability dial, segmented armor bar, and high-contrast ordnance counter.
  - `HUD`: High-contrast tactical radar with cardinal marks and distinct pip silhouettes, digital KPH speedometer, horizontal combat log kill feed, and high-stakes debriefing screen.
  - `SessionMenu`: Transformed from a bubbly web dialog into a high-stakes tactical pause HUD (`TACTICAL OVERRIDE // LIVE THREAT ACTIVE`).
- [x] Redesigned **In Race (Death Race)**:
  - `RaceHud`: Motorsport telemetry HUD (`POS 01 / 08`, `LAP 02 / 03`, `CIRCUIT TIME`), circuit vector minimap, live standings column, cockpit status, and post-race podium leaderboard.
  - `DeathRaceScreen`: Grid assembly telemetry and tactical confirm leave dialog.
- [x] Preserved 100% of functional game logic, state management, socket transport, and test assertions. Strict black-and-white theme, zero SaaS/web UI elements.
- [x] Verified `npm run test:setup`, `npm run test:match`, `npm run test:race`, `npm run test:vfx`, `npm run lint:app`, and production compilation.
