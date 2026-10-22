import { Mesh, TransformNode } from '@babylonjs/core';
import { ModelBuilder } from './ModelBuilder';
import { buildImportedWeapon, type ImportedWeaponKind } from './ImportedWeaponModel';

export type WeaponHousing = 'sport' | 'compact' | 'armored' | 'industrial';

/** Downloaded weapon mechanisms on compact yaw bearings and pitch trunnions. */
export function buildWeaponModel(parent: TransformNode, id: string, height: number, scale = 1, housing: WeaponHousing = 'sport', accent = '#cf973f', _side = 0): Mesh {
    if (!['minigun', 'plasma', 'missile', 'mortar', 'nuke'].includes(id)) throw new Error(`Unknown mounted weapon: ${id}`);
    const scene = parent.getScene();
    const yaw = new Mesh('turret_base', scene);
    yaw.parent = parent; yaw.position.y = height; yaw.scaling.setAll(scale);
    const b = new ModelBuilder(scene, yaw);
    const steel = ModelBuilder.steelSurface(scene);
    const alloy = ModelBuilder.steelSurface(scene, true);
    const marking = b.material('weapon-mount-marking', accent, .35, .48);
    b.cylinder('bearing', .95, .16, steel);
    b.ring('bearing-race', .8, .06, alloy, 0, .09, 0);
    for (const side of [-1, 1]) {
        b.box('trunnion-cheek', .12, .42, .45, steel, side * .48, .24, 0);
        b.cylinder('trunnion', .24, .16, alloy, side * .48, .38, 0, 'x');
    }
    b.box(`${housing}-mount-stripe`, .5, .025, .09, marking, 0, .1, -.25);
    b.compact();
    const pitch = new Mesh('turretbox', scene);
    pitch.parent = yaw; pitch.position.y = .38;
    buildImportedWeapon(pitch, id as ImportedWeaponKind);
    return yaw;
}
