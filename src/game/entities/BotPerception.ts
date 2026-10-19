import { Ray, Vector3, type Mesh, type Scene } from '@babylonjs/core';
import { getCombatantMetadata } from '../match/CombatRules';

/** Ignore presentation geometry; terrain and combatants still occlude bot sight. */
function blocksSight(mesh: import('@babylonjs/core').AbstractMesh, owner: Mesh): boolean {
    return mesh !== owner && !mesh.isDescendantOf(owner) && mesh.isEnabled() && mesh.isVisible &&
        !mesh.metadata?.presentationOnly && !mesh.metadata?.arenaRoad && mesh.name !== 'skyBox' &&
        (mesh.isPickable || Boolean(getCombatantMetadata(mesh)));
}

export function botCanSee(scene: Scene, owner: Mesh, target: Mesh): boolean {
    const origin = owner.getAbsolutePosition().add(new Vector3(0, 1, 0));
    const destination = target.getAbsolutePosition().add(new Vector3(0, 1, 0));
    const direction = destination.subtract(origin), distance = direction.length();
    if (distance < .01) return true;
    const hit = scene.pickWithRay(new Ray(origin, direction.scale(1 / distance), distance), mesh => blocksSight(mesh, owner));
    return !hit?.hit || hit.pickedMesh === target || Boolean(hit.pickedMesh?.isDescendantOf(target));
}

/** Three bounded feelers; speed extends the braking horizon. Returns normalized clearance. */
export function botClearance(scene: Scene, owner: Mesh, speed: number): { front: number; left: number; right: number } {
    const origin = owner.getAbsolutePosition().add(new Vector3(0, .5, 0));
    const forward = owner.forward;
    const yaw = Math.atan2(forward.x, forward.z);
    const length = Math.min(24, 7 + Math.abs(speed) * .4);
    const probe = (angle: number) => {
        const direction = new Vector3(Math.sin(yaw + angle), 0, Math.cos(yaw + angle));
        const hit = scene.pickWithRay(new Ray(origin, direction, length), mesh => blocksSight(mesh, owner));
        return hit?.hit ? Math.min(1, hit.distance / length) : 1;
    };
    return { front: probe(0), left: probe(-.65), right: probe(.65) };
}
