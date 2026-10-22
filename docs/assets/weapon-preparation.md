# Downloaded weapon preparation and vehicle mounting

Rebuild all five weapon geometry profiles with `npm run prepare:weapons`.

The offline preparation pipeline bakes CC0 and CC-BY-SA 3D source files into synchronous, typed vertex geometry in `src/assets/models/prepared/WeaponGeometry.ts`. No runtime GLB downloads, external buffers, textures, or runtime decoders are required. Provenance is tracked in `docs/assets/weapon-sources.json` and deployed attribution is located in `public/assets/weapon-model-credits.txt`.

## Source models and weapon roles

| Weapon | Source model | Author | Upstream License | Triangle Count | Authoritative Muzzles |
| --- | --- | --- | --- | --- | --- |
| Minigun | `rotary-turret.blend` | Lewis W. Veasey | CC0-1.0 | 4,668 | 6 rotary bores |
| Missile | `van.blend` | johndh | CC-BY-SA-3.0 | 12,600 | 18 pod exits |
| Mortar | `van.blend` | johndh | CC-BY-SA-3.0 | 530 | 1 heavy cannon bore |
| Plasma | `plasma/plasma.blend` | Unnamed (Viktor Hahn) | CC-BY-SA-3.0 | 14,427 | 1 forward emitter |
| Nuke | `rocket-launcher/rocket_launcher.blend` | Unnamed (Viktor Hahn) | CC-BY-SA-3.0 | 8,371 | 1 heavy launcher bore |

## Preparation pipeline (`scripts/prepare-weapons.py`)

Run via `npm run prepare:weapons` using Blender 5.1.2:
1. **Extraction**: Links relevant weapon mechanism objects from source `.blend` files (`Cube.001`, `Cylinder.002`, `Cube.003` for minigun; `Rocket pods.001`, `Mini rockets.001` for missile launcher; `Heavy cannon.001` for mortar; `plasma` and `rocket_launcher` for plasma and nuke). Strips non-essential modifiers (armatures, handheld grips) while preserving weapon mechanism geometry.
2. **Axis & Orientation Normalization**: Centers geometry, rotates into Babylon's +Z forward coordinate space, and aligns bore axes.
3. **Muzzle Socket Extraction**:
   - Minigun: Extracts six distinct bore exit coordinates arranged around the rotary axis.
   - Missile: Solves forward component tips for 18 distinct rocket pod launch apertures.
   - Mortar: Derives cannon bore centerline at the front face.
   - Plasma & Nuke: Extracts native `tag_muzzle` bone positions directly from source armatures.
4. **Machined Edge Bevel & Normal Splitting**: Applies subtle beveling (0.008 width) and 35-degree angle edge splits to preserve crisp metallic highlights and smooth barrel contours.
5. **Winding & Format**: Enforces Babylon left-handed clockwise front-face winding and categorizes surface partitions (`steel`, `alloy`, `accent`).
6. **Code Generation**: Emits `src/assets/models/prepared/WeaponGeometry.ts` and `docs/assets/prepared-weapons.json`.

## Runtime integration

- **Geometry Templating & Caching** (`ImportedWeaponModel.ts`): Scene-scoped `WeakMap` caches template meshes with shared PBR materials. Meshes are cloned onto the pitch node (`turretbox`) with `muzzle_socket` transform nodes positioned at authored muzzle coordinates.
- **Turret Articulation** (`WeaponModel.ts`): Builds `turret_base` (yaw bearing) and `turretbox` (pitch trunnion).
- **Direct Deck Mounting** (`WeaponAttachments.ts`): Replaces long side outriggers with a direct bonnet-mounted plinth (`deck-plinth`) and saddle (`mount-saddle`), scaled uniformly with `WEAPON_ASSEMBLY_SCALE = 0.65`.
- **Armored Cassette & Sliding Bay Doors** (`WeaponBay.ts`): Hosts the weapon inside an armored cassette with sliding split doors (`weapon-bay-door`). Turret is retracted and disabled until bay doors open.
- **Weapon Controller Integration** (`WeaponController.ts`): Auto-discovers `muzzle_socket` nodes and rotates muzzles during lock-on, ballistic arcs, and firing. Smoothly animates bay door deployment before firing commences.
- **Race Pickup Swaps** (`RaceVehicleEquipment.ts`): Supports hot-swapping weapons upon collecting track pickups without GPU texture allocation or memory leaks.

## Verification

- `npm run test:imported-weapons`: Validates SHA-256 checksums of original source files, CC licenses, triangle budgets, face winding, and bay envelope constraints.
- `npm run test:models`: Verifies all 70 vehicle/weapon combinations across imported and procedural models, checking finite geometry, wheel discovery, muzzle socket hierarchy, ray intersection, moving-root articulation, and race pickup swaps.
- `npm run test:projectiles`: Verifies weapon bay deployment/retraction, one-shot audio, upward muzzles, readiness, EMP handling, and projectile silhouettes.
