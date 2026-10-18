import { Mesh, TransformNode } from '@babylonjs/core';
import { ModelBuilder } from './ModelBuilder';

/** Armored cassette with sliding doors; moving parts remain independent of compacted geometry. */
export function buildWeaponBay(mount: TransformNode, turret: Mesh, scale: number): void {
    const builder = new ModelBuilder(mount.getScene(), mount);
    const armor = builder.material('bay-armor', '#303b43', .7, .4);
    builder.box('bay-floor', 1.65 * scale, .1 * scale, 3.2 * scale, armor, 0, 0, .55 * scale);
    for (const side of [-1, 1]) builder.box('bay-wall', .12 * scale, .65 * scale, 3.2 * scale, armor, side * .83 * scale, .32 * scale, .55 * scale);
    for (const end of [-1.05, 2.15]) builder.box('bay-end', 1.65 * scale, .65 * scale, .1 * scale, armor, 0, .32 * scale, end * scale);
    builder.compact();
    for (const side of [-1, 1]) {
        const door = new TransformNode('weapon-bay-door', mount.getScene()); door.parent = mount;
        door.position.set(side * .42 * scale, .69 * scale, .55 * scale);
        door.metadata = { side, scale, closedX: door.position.x };
        const b = new ModelBuilder(mount.getScene(), door);
        b.box('bay-door', .84 * scale, .09 * scale, 3.3 * scale, armor); b.compact();
    }
    turret.metadata = { ...turret.metadata, bayScale: scale, deployedY: .95 * scale };
    turret.position.y = -.7 * scale; turret.setEnabled(false);
}

/** Progress is deterministic and frame-rate independent; doors open before the lift rises. */
export function poseWeaponBay(turrets: Mesh[], doors: TransformNode[], progress: number): void {
    const opening = Math.min(1, progress / .35);
    const lift = Math.max(0, (progress - .25) / .75);
    for (const door of doors) door.position.x = door.metadata.closedX + door.metadata.side * door.metadata.scale * .9 * opening;
    for (const turret of turrets) {
        if (!turret.metadata?.bayScale) continue;
        turret.setEnabled(progress > .25);
        turret.position.y = -turret.metadata.bayScale * .7 + (turret.metadata.deployedY + turret.metadata.bayScale * .7) * lift;
    }
}
