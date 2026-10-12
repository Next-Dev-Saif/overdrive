# Overdrive combat VFX audit and asset research

Date: 2026-10-08  
Runtime inspected: Babylon.js 9.28.0, React 19.2.8, Vite 8.3.0

## Implementation status

The first combat spike is implemented. Four Unity Labs CC0 atlases are now stored locally in `public/assets/vfx/pyro/` and registered through `src/game/vfx/VfxAssets.ts`. Normal and nuclear blasts use different animated explosion sheets, high quality adds an animated fireball core, and destroyed vehicles add an animated rolling-smoke layer. Plasma now has a moving cyan core/halo plus its own muzzle and impact treatment instead of sharing the minigun's solid tracer language.

The spike also establishes safety rails: transient combat lights are capped at 0/2/6 by quality tier, several previously unbounded ability emitters now scale or disappear by tier for both local and remote vehicles, and tracer observers/materials are cleaned up deterministically. `npm run test:vfx` validates atlas dimensions, frame registration, local-only URLs, provenance, budget integration, and the 5 MiB runtime cap.

Still intentionally deferred: material-aware decals, full local/remote ability recipe centralization, local arena texture vendoring, and an interactive 5v5 performance benchmark.

## Executive recommendation

Do not import a Unity or Unreal VFX package wholesale. Overdrive already has the correct foundation—a centralized `VfxManager`, shared textures, effect pooling, quality tiers, glow, camera shake, and authored muzzle sockets—but its visual vocabulary is constrained by four procedural 128×128 sprites and several temporary primitive meshes.

The best upgrade is a small, locally hosted texture library:

1. Unity Labs CC0 flipbooks for realistic explosions, fireballs, flames, and rolling smoke.
2. Dolkyns Electric VFX Pack for plasma orbs, EMP discharges, electric shockwaves, and lightning.
3. Kenney Particle Pack, Smoke Particles, and Light Masks for sparks, glints, soft smoke variants, trail masks, and light cookies.
4. Selected ambientCG PBR surfaces/decals and Poly Haven HDRIs only after the combat pass, because better arena response makes light and explosions feel grounded.

This provides more visual improvement than adding a new VFX runtime. Babylon 9.28 already supports animated particle textures, layered particle systems, GPU particles, local JSON particle sets, glow, custom particle shaders, and textured GreasedLine meshes.

## Current project findings

### What is already good

- `VfxManager` owns shared spark, smoke, fire, and debris textures and pools the common impact, muzzle, explosion, and projectile-trail systems.
- Explosions already use a readable sequence: white flash, fireball, smoke, shock ring, transient light, sound, and camera shake.
- Vehicle destruction adds debris, embers, and wreck smoke instead of merely enlarging the normal explosion.
- Every weapon has an authored muzzle socket, so improved flashes and projectile effects can start at the correct barrel or tube.
- Weapon projectiles are pooled, and the graphics setting already supplies particle multipliers of 0, 0.5, and 1.
- High quality enables glow, while lower tiers remove it.

### Why it still looks synthetic

- Four generated 128×128 images supply almost every combat effect. They are useful masks, but they cannot show evolving fire, turbulent smoke, rolling blast fronts, or animated electrical structure.
- Minigun and plasma share the same cylinder-tracer implementation. Plasma is functionally hitscan, but visually it should read as a fast energy packet with a bright core, trailing filaments, and a distinct impact.
- Missile, mortar, and nuke projectiles differ mainly in scale and color. Their launch, flight, and detonation silhouettes need stronger identities.
- EMP, shockwave, gravity pulse, Aegis shield, lightning, and the afterburner trap are built independently in `VehicleController` and again in `RemoteVehicle`. Local and replicated versions already differ.
- Many ability effects bypass the quality multiplier and pooling. Examples include the 200-particle EMP burst, 400 particles/second dash trail, 300-particle shockwave dust burst, 300 particles/second shield, and stun sparks.
- Every vehicle owns CPU particle systems with capacities of 500 tire smoke + 200 exhaust flame + 300 wind streaks. Ten vehicles therefore reserve a theoretical capacity of 10,000 particles before weather, weapons, and abilities.
- Arena weather adds capacities of 1,500–2,000 particles. Emit rates scale by quality, but systems and remote textures are still created on low quality.
- Map materials, environment maps, skyboxes, and weather flares load from Babylon Playground or GitHub at runtime. That is a production reliability and caching risk, even before visual quality is considered.
- One-shot shockwave and ability meshes create new materials repeatedly. Disposing a Babylon mesh does not automatically make a shared/attached material lifecycle safe; the effect factory should own and reuse or explicitly dispose those materials.
- The only scene-wide polish layer is `GlowLayer`. There is no controlled bloom/tone-mapping pipeline, impact decal system, heat distortion, chromatic hit impulse, or damage-state fire/smoke.

## Best asset sources

| Priority | Source | License / cost | Best Overdrive use | Integration verdict |
| --- | --- | --- | --- | --- |
| 1 | [Unity Labs free VFX flipbooks](https://unity.com/blog/engine-platform/free-vfx-image-sequences-flipbooks) | CC0, free | `Explosion02HD`, `Explosion01-light`, `DiscSmoke01`, `FireBall01–04`, `SmallFlame01`, `WispySmoke01–03b` | Best realistic blast source. Download the premade flipbooks or TGA sequences, then convert selected sheets to browser-ready local textures. The images are engine-neutral despite being published by Unity. |
| 1 | [Dolkyns Electric VFX Pack](https://dolkyns.itch.io/electric-vfx-pack) | Name-your-price; commercial use and modification allowed; no standalone redistribution | Plasma projectile/impact, EMP shell, energy shockwave, ball lightning, lightning strike | Best direct match for the missing energy vocabulary. It provides 256×256 transparent PNG frames plus grid and strip sheets, with alpha/additive blending guidance. Import only selected colors/effects, not the 150 MB source archive. |
| 2 | [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) | CC0, free; 80 files at 512×512 | Muzzle star, spark streak, soft glow, ring, trail/noise masks | Excellent utility library for layered effects and custom shaders. These masks should support the hero flipbooks, not replace them. |
| 2 | [Kenney Smoke Particles](https://kenney.nl/assets/smoke-particles) | CC0, free; 70 files | Tire smoke variation, impact dust, exhaust, damage smoke | A low-risk way to eliminate repeated identical smoke silhouettes. Choose 4–8 complementary sprites and atlas them. |
| 2 | [Kenney Light Masks](https://kenney.nl/assets/light-masks) | CC0, free; 150 files | Facility lamps, headlamps, muzzle-light cookies, arena searchlights | Useful after combat VFX. Select a very small subset; 150 masks would be asset hoarding disguised as progress. |
| 3 | [OpenGameArt lightning animation](https://opengameart.org/content/lightning-animation) | CC0, free | Lightweight fallback lightning strip | Usable, but it requires black-to-alpha cleanup and is less cohesive than the Dolkyns set. Keep as fallback, not the first choice. |
| 3 | [ambientCG](https://ambientcg.com/) | CC0, free | Asphalt, concrete, scorched metal, cracks, grunge and decal source textures | Use 1K/2K PBR sets to make impacts and arena lighting believable. Build actual projected scorch/crack decals from selected textures; do not download an entire category. |
| 3 | [Poly Haven: Quarry 01](https://polyhaven.com/a/quarry_01), [Goegap](https://polyhaven.com/a/goegap), [Snowy Field](https://polyhaven.com/a/snowy_field) | CC0, free | Wasteland/glacial image-based lighting and sky reference | Good environment follow-up. Convert a selected low-resolution HDR to a local Babylon `.env`; do not ship the 16K–29K originals. |
| Optional authoring | [JangaFX EmberGen](https://jangafx.com/embergen) | Paid authoring tool/trial | Bespoke Overdrive explosion, smoke, flame, and energy flipbooks | Best route when a distinctive hero nuke is worth custom production. It exports game-ready flipbooks, but it is a tool, not a free shippable asset library. |

### Sources deliberately rejected

- Unity/Unreal prefab-only marketplace effects: their engine graphs, shaders, materials, and licenses do not automatically transfer to Babylon.js. Raw texture rights must be checked separately.
- Random Google Images/Pinterest/YouTube downloads: provenance and redistribution rights are unclear.
- Very high-resolution VDB or EXR sequences at runtime: excellent source material, terrible web payloads.
- Pixel-art packs: technically compatible, visually incompatible with Overdrive's industrial 3D direction.
- Remote hotlinks to third-party textures: unreliable, cache-hostile, and inappropriate for production.

## Effect direction by gameplay event

### Weapons

| Event | Required layers | Asset choice | Visual identity |
| --- | --- | --- | --- |
| Minigun shot | 1-frame star flash, hot tracer, 2–4 sparks, faint pressure smoke | Kenney masks + existing procedural sprites | Amber-white, extremely short, precise; keep the target readable. |
| Minigun impact | spark fan, tiny debris, surface-tinted dust, short scorch | Kenney Particle/Smoke + local decal | Directional and material-aware; metal sparks, concrete dust, vehicle chip/flash. |
| Plasma shot | compressed muzzle bloom, fast cyan energy packet along the hitscan path, filament tail | Dolkyns electric orb/discharge | White-hot cyan core with restrained blue rim; never a solid cylinder. |
| Plasma impact | electric splash, radial arc, brief target crawl | Dolkyns discharge/shockwave | Sharper and cleaner than an explosion so players instantly read energy damage. |
| Missile launch | tube flash, backblast cone, hot exhaust core, turbulent smoke | Unity SmallFlame + WispySmoke | Orange core and gray-brown trail; launch pressure should feel heavier than minigun fire. |
| Missile impact | flash, compact fireball, debris, smoke, dirt ring | Unity FireBall + DiscSmoke | Fast and punchy, roughly 0.6–1.2 seconds. |
| Mortar | soot-heavy muzzle puff, arcing ember, ground plume, debris curtain | Unity FireBall/Explosion + Kenney smoke | Dirt-first explosion with less clean fire than a missile. |
| Nuke | pre-impact warning, whiteout core, layered fireball, expanding condensation/shock disc, column smoke, embers, lingering dust | Unity Explosion02HD/Explosion01-light/DiscSmoke; custom EmberGen later | A staged event, not simply `normalExplosion × 3`. Maintain a clear outer damage radius and avoid full-screen opacity for more than a few frames. |

### Vehicle and abilities

- Boost/overdrive: replace orange idle exhaust with a throttle-sensitive core, blue-white afterburner at full boost, heat haze ribbon, and edge wind streaks. Color temperature should communicate power, not become permanent rainbow neon.
- Drift: emit smoke from rear tire contact points rather than the single exhaust node; tint dust by arena and stop additive blending on opaque smoke.
- Damage states: add intermittent sparks below 50% health, localized dark smoke below 30%, and small flame licks below 15%. Keep these pooled and distance-limited.
- EMP: Dolkyns electric shockwave plus an inward charge, expanding transparent shell, branching surface arcs, and a short desaturation impulse. The current solid torus/sphere should become only the geometry carrier or disappear.
- Lightning: use a textured GreasedLine or regenerated thin tube for the main branch, add 2–3 secondary branches, a Dolkyns impact sheet, ground decal, and a 60–100 ms light pulse. The current thick 0.8-radius tube reads like plumbing struck by divine intervention.
- Aegis: fresnel shell + hex/noise mask + localized impact ripple. Emit particles only on activation/impact, not continuously at 300 per second.
- Shockwave/gravity: flat distortion disc, ground dust ring, debris lift, and clear edge timing. Avoid thick emissive toruses as the final look.
- Cloak: fresnel/refraction dissolve with a brief scanline transition. Do not only fade every child material to 15% alpha, because transparent-material sorting will become visible around complex vehicles.

### Arenas

- Wasteland: local dust atlas, heat shimmer over vents, drifting embers near fires, occasional far lightning/dust wall—not uniform screen-wide dust.
- Facility: vent steam, electrical cabinet arcs, warning strobes, leaking pipe mist, small weld sparks.
- Glacial: varied snowflake atlas, tire powder, ice chips on impact, cold breath/steam, subtle sparkling ice—not 1,800 identical flare sprites.
- Neon: streak rain with local splash ripples, wet-surface reflections, sign flicker, drain steam. Keep magenta/cyan scenery subordinate to team and combat markers.

## Asset pipeline

1. Store source downloads and their license files outside the runtime tree, then copy only approved derivatives into `public/assets/vfx/`.
2. Use a manifest with stable IDs such as `explosion.fireball`, `smoke.wispy`, `electric.orb`, `electric.shockwave`, `mask.ring`, and `decal.scorch`.
3. Standardize animated sheets to power-of-two atlases, preferably 4×4 or 8×8. Use lossless WebP/PNG first; evaluate KTX2 UASTC after visual validation. Host all KTX2 decoders locally if adopted.
4. Trim transparent margins, use premultiplied-alpha-safe export, add 2–4 px edge dilation, and test both standard and additive blend modes. This prevents the familiar black-square halo, nature's way of announcing that alpha was handled casually.
5. Limit hero sheets to 1024² or 2048². Utility masks can be 256²/512². A selected runtime set should target roughly 8–20 MB compressed, not the source archives' hundreds of megabytes.
6. Keep source attribution/license metadata in `public/assets/vfx/LICENSES.md` even for CC0 assets. The Dolkyns license file must ship with the repository's asset records because it is not CC0.
7. Preload the match's selected atlas group during the loading screen. Do not fetch effects during the first explosion.

Babylon's particle documentation confirms sprite-sheet particle textures, noise textures, local-space emission, and visually authored particle sets; the Particle Helper can also create GPU-backed sets. Keep the initial implementation on the existing API, then move only sustained high-count weather/trails to GPU particles after profiling. Short pooled bursts are simpler and sufficiently fast on CPU.

References: [Babylon particle overview](https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_intro), [Particle Helper and local JSON sets](https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particleHelper), [Particle Editor](https://doc.babylonjs.com/toolsAndResources/inspector/particleEditor), [GreasedLine](https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/greased_line/).

## Architecture changes required before the art pass

### Centralize all effects

Move ability presentation out of both vehicle classes and into reusable `VfxManager` recipes. Local and remote calls must invoke the same visual recipe with parameters such as position, direction, radius, team tint, quality tier, and importance.

Recommended API shape:

```ts
type VfxImportance = 'critical' | 'combat' | 'ambient';
type SurfaceType = 'metal' | 'concrete' | 'sand' | 'ice' | 'vehicle';

interface VfxContext {
  position: Vector3;
  direction?: Vector3;
  radius?: number;
  color?: Color3;
  importance: VfxImportance;
  distanceToCamera?: number;
  surface?: SurfaceType;
}
```

Effects should be recipes composed of pooled layers, not bespoke blocks that allocate meshes, materials, lights, observers, and timers in gameplay controllers.

### Introduce budgets, not only a multiplier

| Tier | Critical gameplay cue | Combat decoration | Ambient weather | Dynamic lights |
| --- | --- | --- | --- | --- |
| Low | Always retain flash/radius/impact cue | 20–30% particles, no lingering smoke | Off or camera-local minimum | Off |
| Medium | Full cue | 50–60%, reduced smoke lifetime and decals | Camera-local, capped | Nearest 1–2 effects |
| High | Full cue | Full authored layers with distance LOD | Full but camera-local | Nearest 4–6 effects |

Add a global active-particle/effect budget, camera-distance LOD, importance-based eviction, and maximum concurrent transient lights. A ten-player firefight must not create ten full Aegis emitters plus weather plus every explosion at maximum density.

### Improve rendering deliberately

- Keep `GlowLayer` for emissive selection, but use selective inclusion so all emissive arena materials do not bloom equally.
- Add a restrained HDR default rendering pipeline on high quality: tone mapping, modest bloom, and FXAA. Medium should keep tone mapping/FXAA without bloom. Low stays lean.
- Use 60–120 ms exposure/light impulses for major detonations instead of long opaque screen flashes.
- Add decals with strict caps and expiry. Start with 24–40 nearby impact marks, fade oldest first, and omit on low.
- Use surface metadata from arena/vehicle meshes to choose impact color, dust, sparks, and decals.
- Apply `prefers-reduced-motion`/game comfort settings to camera shake, FOV kick, chromatic effects, and flashes while preserving the gameplay cue.

## Prioritized delivery plan

### Phase 0 — Safety and consistency

- Centralize local/remote ability VFX recipes.
- Make every effect obey the graphics tier and global budget.
- Pool/reuse transient meshes, materials, lights, and particles; remove observer/timer leaks.
- Vendor existing remote map textures locally.
- Add counters for active particles, effects, transient lights, decals, and draw calls.

### Phase 1 — Highest return combat pass

- Import the selected Unity CC0 sheets: one main explosion, one light-only companion, one fireball, one disc smoke, two wispy smoke variants, and one flame.
- Import a selected cyan subset of the Dolkyns orb, discharge, shockwave, and lightning effects.
- Build the asset manifest and flipbook particle helper.
- Give minigun, plasma, missile, mortar, and nuke distinct muzzle, flight, impact, and light profiles.
- Add metal/concrete/sand/ice/vehicle impact variants and capped scorch decals.

### Phase 2 — Vehicle feel

- Attach tire smoke to rear wheel contact points.
- Add boost core, heat haze, wind streak LOD, landing dust, scrape sparks, and health-driven damage smoke/fire.
- Tune camera/FOV/audio impulses together with the effect timings.

### Phase 3 — Ability pass

- EMP, lightning, Aegis, shockwave, gravity, cloak, and afterburner share one recipe across local and remote vehicles.
- Replace solid primitive-looking carriers with flipbooks, noise masks, fresnel/distortion, and thin textured lines.

### Phase 4 — Arena response and atmosphere

- Local PBR textures and `.env` lighting.
- Camera-local weather volumes and event pockets.
- Material-aware splashes, dust, ice chips, steam, embers, and arena hazards.

### Phase 5 — Acceptance

- Benchmark a real 5v5 stress scene on all three quality tiers.
- Verify no first-use hitch after preload.
- Check alpha halos, sorting, overdraw, and bloom against all four arenas.
- Confirm enemy/team markers, crosshair, health, lock state, and hazard radii remain readable through maximum combat density.
- Suggested performance gates: 60 FPS target on recommended desktop, no combat-event frame over 33 ms in the reference stress test, bounded particle/light/decal counts, and stable memory over a 20-minute match.

## Recommended first download list

Download only these candidates for the first implementation spike:

- Unity Labs: `Explosion02HD`, `Explosion01-light`, `DiscSmoke01`, `FireBall02` or `FireBall03`, `SmallFlame01-temperature`, `WispySmoke01`, and `WispySmoke03b` flipbooks.
- Dolkyns: one cyan `Electric Orb`, one `Electric Discharge`, one `Electric Shockwave`, one `Energy Shockwave`, and one `Lightning` grid sheet.
- Kenney: 6–10 masks total from Particle Pack, 4–8 smoke sprites, and at most 4 light masks.
- ambientCG: one asphalt, one concrete, one scorched/dirty metal, and a small crack/grunge/decal subset at 1K or 2K.
- Poly Haven: one 1K/2K HDR per arena candidate, converted to local `.env` only after the combat spike proves the lighting direction.

No purchase is necessary for the first pass. The optional spend is EmberGen only if the game needs a bespoke signature nuke after the free stack has been tested in motion.
