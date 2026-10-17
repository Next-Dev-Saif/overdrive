# New assets: audio integration and visual adoption plan

Audited 2026-10-17. The manifest matches the on-disk counts: **35 audio clips, 109 OBJ files, 287 PNGs**. Full per-file sizes, audio duration/sample rates, mesh counts/bounds and texture dimensions are in [new-assets-inventory.csv](new-assets-inventory.csv). This is a structural/content inventory, not a listening or in-game visual approval.

## Audio implemented first

17 original Ogg clips (277,523 bytes total) are copied to `public/assets/audio/imported/`. `src/game/engine/AudioAssets.ts` is the runtime manifest. Existing music, menu sounds and session master volume are retained. Clips use the existing Web Audio spatial routing.

| Event | Clip | Placement |
| --- | --- | --- |
| Minigun | rebgun | Local/bot/remote weapon firing, including race |
| Plasma | laser | Same shared weapon presentation |
| Missile launch | rerocket2 | Same shared weapon presentation |
| Mortar fire | rebangmortar | Distinct report instead of generic explosion |
| Nuke launch | launch_nook | Distinct launch instead of generic explosion |
| Projectile explosion | rebangrcrocket | Shared projectile detonation |
| Nuclear explosion | bang_nook | Nuke detonation |
| Vehicle destruction | death_explosion | Local/bot and remote vehicle deaths |
| Driving | v8deep | Loop, speed-dependent pitch, acceleration-dependent gain |
| Race weapon pickup | repickup | Local snapshot weapon change/ammo increase |
| Lightning | schterminator | Completed arena ability / race lightning impact |
| Shockwave | sonic_shot | Completed ability |
| Cloak | stealth | Completed ability |
| EMP | airblast | Completed ability |
| Dash | speed_boost | Completed ability |
| Gravity pulse | singularity | Completed ability |
| Aegis shield | superchargedpowerup | Completed ability |

The engine begins after its buffer decodes, eliminating the unbounded polling timer. HTTP/decode failures are reported without stopping the game. A 32-voice limit bounds overlap; finished voices disconnect and match cleanup stops transient sounds. Gesture retries support blocked music/context playback. Race driving audio stops while paused, dead, finished or outside racing. Existing scene-volume control remains shared with music.

Audio mapping is based on filenames, event roles and measured durations. Levels and engine loop seam need listening in-game. Ogg decode failures remain silent for the affected cue; there is no alternate-codec export in this source pack. First events before decoding completes are skipped, not replayed late. Race pickup detection covers weapon swaps and increased ammo; a same-weapon pickup at already-full ammo is not distinguishable from current snapshots without a server pickup event.

### Remaining 18 clips

- `vloop` (0.12s), `jetengine` (4.03s), `saber2` (9.71s): alternative engine/hover loops; audition before choosing per-chassis profiles.
- `rebangrocketx4`: optional alternate missile impact; retain the current single impact cue until listening confirms useful variation.
- `missilelock`: reserve for an explicit lock-transition cue with a cooldown; never trigger per target-tracking frame.
- `minedrop`, `flamethrower`: reserve for future mine/flame weapons, which are absent from the current five-weapon runtime.
- `airdrop_siren`, `air_bomb_whistle`: future airstrike warning/drop system, not ordinary missile firing.
- `teleportin`, `teleportout`, `singularity_reverse`: teleport and ability-ending transitions; require reliable completion/cancellation events.
- `capturepoint`, `uberthon`: future objective/announcer events; no matching current capture-point mode.
- `tap2`: potential UI alternate; keep existing menu sounds consistent for now.
- `pig_squeal`, `pig_squeal2`, `spider_splat`: creature/gore cues with no current vehicle-combat role.

## Models and textures: ordered implementation plan

OBJ files contain positions, UVs and normals, but no supplied MTL files/material-library links. They do not preserve gameplay pivots, animation rigs, physics or original shader settings. Names suggest material pairings; verify them visually before committing those pairings. Convert selected objects to compact GLB with explicit materials instead of shipping all source OBJ files.

| Priority | Assets | Use in this game | Integration requirement |
| --- | --- | --- | --- |
| 1 | chaingun (512 faces), lasergun (260), rocketlauncher (268), guidedmissilelauncher, mortarlauncher, nooklauncher | Optional weapon housing replacements | Adapt `WeaponModel.ts`; preserve `turret_base`, `turretbox`, barrel discovery and `muzzle_socket`. Normalize bounds and forward axis; keep current muzzle positions and aim behavior. |
| 1 | guidedmissile (136), rocket, mortar (104), nook, shell | Better projectile silhouettes | Use existing pooled projectile lifecycle in `WeaponController`; preserve collision radii/speeds. No separate per-shot material loads. |
| 2 | health (124), speed (172), weapon meshes; i_heal, i_speed and matching i_* icons | Race pickup silhouettes/icons | Reuse `RacePickup.ts` bobbing/glow and server item IDs. Health/speed are future pickup types, not a reason to silently add gameplay rules. Keep current readable label scale. |
| 2 | weapon_panel_diffuse/bump, tank_weapon_diffuse/bump | Weapon material candidates | Validate UV atlas correspondence; determine whether each bump image is height or normal data. Do not assign a height map as tangent-space normals blindly. |
| 3 | rock1/2/3 (300 faces each), pine2 (1,228), columns | Close-range arena cover and track-side details | Use bounded instancing in existing scenery paths; collision must match cover. Preserve the recent lightweight panoramic backgrounds; do not restore removed outer forests. |
| 3 | CliffLayeredRock, GrassRock, Grass, Grass2, GrassHill, concrete_panel, wood_panel, barkpine, spruce | Terrain/prop material variants | Check tiling and alpha; compress selected color textures, share materials and keep native source maps outside runtime. Test foliage cutout versus blended rendering cost. |
| 4 | tank (2,285), HK (1,707), trooper, wheel and s_* parts | Future distinct vehicle/robot classes | Requires assembly, correct wheel/weapon anchors, handling/collision bounds and team materials. Keep existing seven classes until a complete class is reviewed. |
| 4 | tank_red/blue_diffuse variants, hk_red/blue1, trooper_red/blue1, sentry_parts/covers | Candidate team skins | Bind only after UV inspection. Old lightmaps are not reusable dynamic lighting; avoid double-lighting assets. |
| Later | spawn, capturepoint, teleporter, teleporter_swirl | Spawn/objective landmarks | Current spawn rules can use visual markers; capture/teleport mechanics need a separately scoped feature. |

Most textures are small: 88 are 64×64, 48 are 128×128, 44 are 256×256 and 37 are 512×512. Only two are 1024×1024. Numerous tiny buttons, digits and editor icons are unsuitable for replacing the current responsive UI. Keep branding/payment/editor textures (`paypal`, `gamevial`, `steamgreenlight`, terrain editor icons) out of runtime. Existing VFX atlases already provide explosions/smoke; consider `tracer128`, `tracerlaser128`, `tele_puff`, `starflare` and `pickup_lightening` only if a side-by-side visual test establishes an improvement. Atlas layout/alpha must be checked first.

Do not import `CombinedMeshrootscene` wholesale (10,294 faces, 32 groups), ambiguous `p*`/`bpc*` fragments, old sky/water planes or baked scene lightmaps without reconstructing their intended grouping. The current camera-centered skies should remain intact.

### Acceptance criteria for the next visual phase

1. Import one weapon and one projectile first, using explicit materials and preserved mount names; verify aim, muzzle flash, shots and remote/race presentation.
2. Check UV alignment, axis, unit scale and bounding box in a local preview; record chosen material pairing.
3. Measure exported payload and draw calls against current models; cache/instance reusable geometry and keep disposal ownership clear.
4. Add only approved model conversions and their required textures to public assets. Keep fallbacks until the replacement is verified.

## Verification and manual listening checklist

Headless audio checks exercise asset parity, playback, voice limits, mute, cleanup, pitch bounds and failed engine loading. TypeScript and lint also run. Browser verification is intentionally left to the user under Agent-execution-guide.md.

Manually start arena and race after a click/tap; compare all five weapons and both explosion types; activate each ability; destroy local/remote vehicles; collect a race weapon; change volume/mute; pause and leave/re-enter a match. Listen for clipping, excessive rapid-fire overlap, engine-loop clicks and ability tails masking combat. Check the supported browser/device set for Ogg decoding. No license/provenance document was supplied in new-assets; the audit does not establish redistribution rights.

## 2026-10-17 update: projectile-only adoption implemented

The current mounted weapon meshes remain unchanged. Missile shots now use `rocket.obj` (80 triangles), mortar shots use `mortar.obj` (104), and nukes use `nook.obj` (56). The rocket's fins make it more recognizable at distance than the narrower guidedmissile asset. The nuke retains its broad, distinctive source shape.

For this unusually small set (240 triangles total), `scripts/prepare-projectiles.mjs` bakes OBJ positions, authored normals, UVs and indices into typed vertex data instead of asynchronous GLB loading. Run `npm run prepare:projectiles` after changing the originals. Conversion centers the meshes, preserves +Z forward, normalizes lengths to 1.8/1.25/3 world units and reverses OBJ face winding for Babylon's default left-handed scene. The reproducible report in `prepared-projectiles.json` records source hashes and dimensions.

`ProjectileModel.ts` shares one geometry and shell material per kind per scene. Muted metal/olive/brass finishes distinguish the silhouettes without guessing texture-atlas pairings. Compact tail glows and the existing smoke/fire trails remain; no projectile damage, homing, speed, gravity, blast radius or networking rules were changed. The projectile pool is now scoped by scene to prevent reuse of disposed meshes when entering another match. Bullet/plasma tracers and mounted weapons are untouched.

Headless checks cover imported geometry, winding/normals, source hashes, normalized bounds, shared resources, collision exclusions, tail anchors, pool reuse and scene isolation. Manual in-game verification remains: check the three silhouettes during launch/climb/descent, smoke alignment, bloom in dark maps and local/remote/race shots.

## 2026-10-17 update: ability audibility and laser mix

Supersedes the earlier completed-ability timing: all seven mapped ability clips now start when an activation is accepted, including network-presented arena abilities and race lightning wind-up. Cancellation/EMP/death during the wind-up stops that cue. Race lightning does not replay the same clip at impact.

Ability gain rises from 0.50 to 0.95. The local player's ability is listener-relative so chase-camera distance cannot suppress it; opponents retain spatial sound with a 20-unit reference distance. At the 32-voice limit an ability can replace an ordinary effect, while other ability voices remain protected. Master volume/mute still applies. Laser/plasma shot gain rises from 0.55 to 0.95; its appearance is unchanged per user clarification.

Extended tests verify every ability's actual buffer/gain, local non-spatial routing, priority under saturation, idempotent sound cancellation and cancellation on invalidated/removed activations. Browser listening remains user-led.
