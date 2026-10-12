import type { AbstractMesh, Node } from '@babylonjs/core';

/** Keeps swept projectile rays from colliding with the shooter's or projectile's visual hierarchy. */
export function isProjectileCollisionCandidate(candidate: AbstractMesh, projectile: Node, owner: Node): boolean {
    if (!candidate.isVisible || candidate.metadata?.arenaRoad || candidate.metadata?.presentationOnly || candidate.name === 'skyBox') return false;
    if (candidate === projectile || candidate.isDescendantOf(projectile)) return false;
    if (candidate === owner || candidate.isDescendantOf(owner)) return false;
    
    // Ignore VFX, muzzle flashes, and projectile glows
    if (candidate.name.includes('muzzle-flash') || 
        candidate.name.includes('-flight-core') || 
        candidate.name.includes('-flight-halo')) {
        return false;
    }
    
    return true;
}
