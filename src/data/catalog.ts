/** Presentation catalog for the existing playable content. Numeric tuning stays in gameplay systems. */
export const vehicles = [
    { id: 'interceptor', name: 'Interceptor', role: 'Assault', detail: 'A balanced pursuit chassis with a supercharged engine and reinforced front end.', ability: 'Lightning Strike', handling: 'Balanced', mass: '1,000 kg' },
    { id: 'juggernaut', name: 'Juggernaut', role: 'Heavy siege', detail: 'Armored shoulders and a reinforced ram for deliberate, close-range combat.', ability: 'Kinetic Shockwave', handling: 'Heavy', mass: '3,500 kg' },
    { id: 'phantom', name: 'Phantom', role: 'Scout', detail: 'Low-profile bodywork and a lightweight frame built for evasive driving.', ability: 'Optical Camouflage', handling: 'Agile', mass: '800 kg' },
    { id: 'manticore', name: 'Manticore', role: 'Support', detail: 'An armored utility platform with strong area-control capability.', ability: 'EMP Burst', handling: 'Stable', mass: '2,500 kg' },
    { id: 'valkyrie', name: 'Valkyrie', role: 'Interceptor', detail: 'A long, low aerodynamic chassis for aggressive hit-and-run attacks.', ability: 'Afterburner Dash', handling: 'Agile', mass: '1,200 kg' },
    { id: 'wraith', name: 'Wraith', role: 'Hovercraft', detail: 'Four ducted lift units suspend a compact high-mobility combat platform.', ability: 'Grav-Pulse', handling: 'Drifting', mass: '600 kg' },
    { id: 'behemoth', name: 'Behemoth', role: 'Mobile fortress', detail: 'Heavy industrial armor, oversized running gear and a reinforced plow.', ability: 'Aegis Dome', handling: 'Heavy', mass: '6,000 kg' },
] as const;
export const weapons = [
    { id: 'minigun', name: 'Vulcan Minigun', role: 'Kinetic / sustained fire', detail: 'Six machined barrels, an ammunition drum and a rigid rotor assembly.', damage: 5, interval: 120, range: 150, ammo: 'Unlimited' },
    { id: 'plasma', name: 'Plasma Cannon', role: 'Energy / armor pressure', detail: 'An induction barrel with exposed coils and alloy heat sinks.', damage: 15, interval: 500, range: 180, ammo: 'Unlimited' },
    { id: 'missile', name: 'Hellfire Missiles', role: 'Guided / tracking', detail: 'Four launch tubes with visible payloads and a stabilized sight.', damage: 45, interval: 400, range: 200, ammo: '4 / magazine' },
    { id: 'mortar', name: 'Heavy Mortar', role: 'Artillery / area damage', detail: 'A reinforced bore, recoil pistons and an oversized muzzle brake.', damage: 80, interval: 600, range: 250, ammo: '4 / magazine' },
    { id: 'nuke', name: 'Tactical Nuke', role: 'Heavy payload / area denial', detail: 'A restrained payload in an armored launch cradle. Long reload cycle.', damage: 1500, interval: 1200, range: 300, ammo: '1 / magazine' },
] as const;
export const arenas = [
    { id: 'wasteland', name: 'Iron Wasteland', terrain: 'Desert / open terrain', detail: 'Long sightlines and room to build speed. Keep moving when exposed.', motif: 'desert' },
    { id: 'facility', name: 'Abandoned Facility', terrain: 'Industrial / close quarters', detail: 'Hard cover, tight turns and machinery. Heavy armor earns its keep.', motif: 'factory' },
    { id: 'glacial', name: 'Glacial Outpost', terrain: 'Ice / low traction', detail: 'Open tundra and frozen surfaces. Brake early and control your approach.', motif: 'ice' },
    { id: 'neon', name: 'Neon Sector', terrain: 'Urban / vertical routes', detail: 'Sharp corners and dense cover. Break line of sight, then strike.', motif: 'city' },
] as const;
export const raceArena = { id: 'blacktop', name: 'Blacktop Circuit', terrain: 'Paved circuit / 3 laps', detail: 'Six Interceptors. Three laps. Start unarmed, collect trackside weapons and race to the finish. Online drivers with bot fill.', motif: 'race' } as const;
export const futureModes = [ 'Elimination', 'Team Combat', 'Survival', 'Time Trial'];
