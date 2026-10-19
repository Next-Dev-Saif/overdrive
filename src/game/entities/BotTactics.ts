export type BotState = 'search' | 'approach' | 'engage' | 'withdraw' | 'recover';
export interface TacticalContext {
    vehicleId: string; weaponId: string; distance: number; facing: number;
    health: number; underFire: boolean; nearbyEnemies: number;
    reloading: boolean; clearRoute: boolean; visible: boolean; targetStable: boolean;
}

/** Desired combat envelope leaves space for turning and explosive splash. */
export function weaponSpacing(weapon: string): { min: number; ideal: number; max: number } {
    switch (weapon) {
        case 'nuke': return { min: 75, ideal: 95, max: 120 };
        case 'mortar': return { min: 35, ideal: 65, max: 100 };
        case 'missile': return { min: 28, ideal: 50, max: 90 };
        case 'plasma': return { min: 22, ideal: 42, max: 80 };
        default: return { min: 16, ideal: 32, max: 65 };
    }
}

/** Hysteresis keeps vehicles from switching direction on every range-boundary crossing. */
export function chooseBotState(context: TacticalContext, previous: BotState): BotState {
    if (!context.visible) return 'search';
    const range = weaponSpacing(context.weaponId);
    if (context.distance < range.min || (context.health < .3 && context.underFire) || context.reloading && context.distance < range.ideal) return 'withdraw';
    if (previous === 'withdraw' && context.distance < range.ideal && context.health < .6) return 'withdraw';
    if (context.distance > range.max || previous === 'approach' && context.distance > range.ideal) return 'approach';
    return 'engage';
}

/** Ability thresholds include margin for the 1.1s deployment wind-up. No random frame rolls. */
export function shouldUseBotAbility(context: TacticalContext): boolean {
    if (!context.visible || !context.targetStable) return false;
    const pressure = context.underFire || context.nearbyEnemies >= 2;
    switch (context.vehicleId) {
        case 'juggernaut': return context.distance < 23;
        case 'manticore': return context.distance < 38 && (pressure || context.facing > .5);
        case 'wraith': return context.distance < 30 && (context.nearbyEnemies >= 2 || context.reloading);
        case 'phantom': return pressure && context.health < .6;
        case 'behemoth': return pressure && context.health < .75;
        case 'valkyrie': return context.clearRoute && (context.health < .4 && context.underFire && context.facing < -.3 || context.distance > 50 && context.distance < 95 && context.facing > .92);
        default: return context.distance < 62 && context.facing > .75;
    }
}
