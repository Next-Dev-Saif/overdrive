# Downloaded vehicle preparation

Run `npm run prepare:vehicles` to rebuild the two runtime GLBs from the untouched downloads in `public/assets`.

The offline pipeline uses glTF Transform 4.5.1 and meshoptimizer 0.25.0. It removes invisible duplicate surfaces and hidden interiors, replaces texture-heavy materials with separate paint/glass/metal/rubber surfaces, welds and simplifies geometry, merges by material and wheel corner, and normalizes body length to five source units. Runtime files have no texture or decoder dependencies. `prepared-vehicles.json` records sizes and triangle counts.

Babylon's default left-handed GLB loader reflects **X**, preserving **Z**. Prepared cars face +Z; their glTF right wheels are on -X. Runtime wheel pivots use the controller's existing naming conventions. Vehicle fitting uses body footprint and class-specific multipliers, keeping wheel bottoms at the collider contact level.

| Style | Source | Vehicle IDs |
| --- | --- | --- |
| Muscle: intake and side exhausts | Download 2, coupe | Interceptor, Wraith |
| Track: aero wing and splitter | Download 2, coupe | Phantom, Valkyrie |
| Armored: door armor and reinforced bumper | Download 1, SUV | Juggernaut, Behemoth |
| Expedition: roof rack, cargo, running boards | Download 1, SUV | Manticore |

Player paint remains separate from trim and wheels. The shared vehicle factory uses these models for local vehicles, bots, remote vehicles and previews; racing uses the same Interceptor. Existing IDs, abilities, loadouts and network rules remain intact. Failed imports dispose partial models before the procedural fallback.

Latest handling and scenery changes have not been playtested or run through automated checks, per the user's request to pause testing.
