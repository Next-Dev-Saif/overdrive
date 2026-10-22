# Downloaded vehicle preparation

Run `npm run prepare:vehicles` to rebuild the two retained runtime GLBs from the untouched downloads in `public/assets`.

The offline pipeline uses glTF Transform 4.5.1 and meshoptimizer 0.25.0. It removes invisible duplicate surfaces and hidden interiors, replaces texture-heavy materials with separate paint/glass/metal/rubber surfaces, welds and simplifies geometry, merges by material and wheel corner, and normalizes body length to five source units. Runtime files have no texture or decoder dependencies. `prepared-vehicles.json` records sizes and triangle counts.

Babylon's default left-handed GLB loader reflects **X**, preserving **Z**. Prepared cars face +Z; their glTF right wheels are on -X. Runtime wheel pivots use the controller's existing naming conventions. Vehicle fitting uses body footprint and class-specific multipliers, keeping wheel bottoms at the collider contact level.

| Vehicle | Runtime base | Source |
| --- | --- | --- |
| Interceptor | muscle-coupe.glb | Existing download 2, unchanged |
| Juggernaut | armored-suv.glb | Existing download 1, unchanged |
| Phantom | phantom.glb | Stunt Rally Y7 / Lamborghini Veneno |
| Valkyrie | valkyrie.glb | Stunt Rally XZ / BMW M3 GT3 |
| Wraith | wraith.glb | Stunt Rally SX / Subaru BRZ Varis |
| Manticore | manticore.glb | Stunt Rally HR / Hummer |
| Behemoth | behemoth.glb | Stunt Rally OT / off-road truck |

Player paint remains separate from trim and wheels. The shared vehicle factory uses these models for local vehicles, bots, remote vehicles and previews; racing uses the same Interceptor. Existing IDs, abilities, loadouts and network rules remain intact. Failed imports dispose partial models before the procedural fallback.

Latest handling and scenery changes have not been playtested or run through automated checks, per the user's request to pause testing.


## Five distinct replacements — 2026-10-22

The original `.blend` downloads, wheel files, author/license records and wheel-position definitions are preserved in `assets-source/vehicles/`. They are offline preparation sources and are not placed in the public deployment. `vehicle-sources.json` records pinned upstream URLs and SHA-256 hashes; every downloaded Blender/license file was checked against the pinned repository's Git blob hash. Attribution is also deployed at `/assets/vehicle-model-credits.txt`.

Rebuild with `npm run prepare:vehicles:distinct` using Blender 5.1.2 (macOS app path is detected; elsewhere use `BLENDER_BIN` or put `blender` on PATH), glTF Transform 4.5.1 and meshoptimizer 0.25.0. The pipeline selects authored body/glass/interior meshes, discards unused source variations, converts each source's axes, assembles four wheels from upstream axle positions, separates tire/alloy surfaces, replaces materials with recolorable PBR surfaces, applies bounded detail reduction and exports standalone GLBs. No runtime textures, external buffers or compression decoders are needed. Wheels use bounded-error meshoptimizer simplification to retain round profiles and tread. Source roof racks, wings and open utility-body details remain alongside the game's existing style kits.

`distinct-vehicles.json` records the final geometry costs: Phantom 26,789 triangles / 575,780 bytes; Valkyrie 19,951 / 412,856; Wraith 42,695 / 913,216; Manticore 34,346 / 866,512; Behemoth 53,276 / 1,027,084. Each base has 11 meshes. These are medium-detail smooth-surface assets; the heavier truck retains extra chassis/tire detail. Player paint covers body panels; opaque glass and neutral trim replace the original texture liveries.

Verification: `npm run test:imported-models` checks all seven assets, geometry/transfer budgets, axes, grounding, four tire/rim corners, five unique runtime mappings and original checksums. `npm run test:models` exercises all 70 imported/procedural weapon combinations, wheel articulation, paint, attachment clearance, relocated spawns, pickup swaps and cleanup. TypeScript and app lint also pass (four pre-existing app warnings). Offline Blender renders were inspected, including corrected off-road tire profiles. Per project guidance no browser was opened and no production bundle was requested.

Manual acceptance: inspect all seven garage previews in different paint colors, then drive the five replacements with each weapon. Check wheel motion, terrain contact, existing style-kit placement and shadows, plus bot/remote appearances. GPU timing and in-game visual quality still require that browser playtest.
