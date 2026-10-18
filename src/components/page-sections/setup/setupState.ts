import { arenas, vehicles, weapons } from '../../../data/catalog';

export const SETUP_MODES = [
    { id: 'deathmatch', name: 'Team battle', detail: '5 vs 5 · Online players with bot fill', action: 'Choose room' },
    { id: 'freeroam', name: 'Free roam', detail: 'Explore an arena and try your loadout', action: 'Enter arena' },
    { id: 'deathrace', name: 'Death race', detail: '6 drivers · 3 laps · Online players with bot fill', action: 'Join race' },
] as const;
export interface MatchSetup { mode: string; map: string; vehicle: string; weapon: string; color: string }
export const DEFAULT_SETUP: MatchSetup = { mode: 'deathmatch', map: 'wasteland', vehicle: 'interceptor', weapon: 'minigun', color: '#f8fafc' };

/** Validate saved preferences; race overrides never erase the player's arena loadout. */
export function validateSetup(value: unknown): MatchSetup {
    const data = value && typeof value === 'object' ? value as Partial<MatchSetup> : {};
    return {
        mode: SETUP_MODES.some(item => item.id === data.mode) ? data.mode! : DEFAULT_SETUP.mode,
        map: arenas.some(item => item.id === data.map) ? data.map! : DEFAULT_SETUP.map,
        vehicle: vehicles.some(item => item.id === data.vehicle) ? data.vehicle! : DEFAULT_SETUP.vehicle,
        weapon: weapons.some(item => item.id === data.weapon) ? data.weapon! : DEFAULT_SETUP.weapon,
        color: typeof data.color === 'string' && /^#[\da-f]{6}$/i.test(data.color) ? data.color : DEFAULT_SETUP.color,
    };
}

/** Only this explicit launch decision enters a session; choosing a card never launches. */
export function setupDestination(mode: string): 'game' | 'race' | 'queue' {
    return mode === 'deathrace' ? 'race' : mode === 'freeroam' ? 'game' : 'queue';
}
