import type { Node } from '@babylonjs/core';
import { areOpponents, type TeamId } from '../../../shared/match';

export interface CombatantMetadata {
    entityId?: string;
    playerId?: string;
    aiId?: string;
    displayName?: string;
    teamId?: TeamId;
    kind?: 'human' | 'bot';
    vehicle?: unknown;
}

/** Host simulation authority is explicit; entity ID formatting is never gameplay identity. */
export function isAuthoritativeBotSource(metadata: CombatantMetadata | null | undefined, networkAttached: boolean, isPlayer: boolean): boolean {
    return !isPlayer && networkAttached && metadata?.kind === 'bot';
}

/** Resolves combat metadata from a picked detail mesh up to its vehicle root. */
export function getCombatantMetadata(node: Node | null): CombatantMetadata | null {
    let current: Node | null = node;
    while (current) {
        const metadata = current.metadata as CombatantMetadata | null;
        if (metadata?.entityId || metadata?.playerId || metadata?.aiId || metadata?.vehicle) return metadata;
        current = current.parent;
    }
    return null;
}

/** Free-roam entities without teams retain the existing all-versus-all behavior. */
export function canAffect(source: Node, target: Node): boolean {
    if (source === target || target.isDescendantOf(source)) return false;
    const sourceMeta = getCombatantMetadata(source);
    const targetMeta = getCombatantMetadata(target);
    if (!sourceMeta?.teamId || !targetMeta?.teamId) return sourceMeta?.entityId !== targetMeta?.entityId;
    return areOpponents(sourceMeta.teamId, targetMeta.teamId);
}
