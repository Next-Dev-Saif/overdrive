import type { Material, Mesh } from '@babylonjs/core';
import { buildVehicleWeapons, type WeaponEnvelope } from '../models/WeaponAttachments';
import type { RaceWeapon } from '../../../shared/race/types';

/** Swap the pickup's visible weapon at the original measured Interceptor bonnet hardpoint. */
export function equipRaceWeapon(root: Mesh, weapon: RaceWeapon | null): void {
    const chassis = root.getChildTransformNodes(false).find(node => node.name === 'chassisRoot');
    const envelope = chassis?.metadata?.weaponEnvelope as WeaponEnvelope | undefined;
    if (!chassis || !envelope) throw new Error('Race vehicle is missing its weapon hardpoint.');
    const owned = new Set<Material>(chassis.metadata.raceWeaponMaterials ?? []);
    for (const mount of chassis.getChildTransformNodes(true).filter(node => node.name.startsWith('weapon_mount_'))) {
        mount.getChildMeshes().forEach(mesh => { if (mesh.material) owned.add(mesh.material); });
        mount.dispose();
    }
    owned.forEach(material => material.dispose());
    const before = new Set(root.getScene().materials);
    if (weapon) buildVehicleWeapons(chassis, 'interceptor', weapon, envelope);
    // Weapon recipes may also allocate unused materials; own those too.
    chassis.metadata.raceWeaponMaterials = root.getScene().materials.filter(material => !before.has(material));
}
