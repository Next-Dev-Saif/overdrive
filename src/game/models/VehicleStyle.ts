import { TransformNode } from '@babylonjs/core';
import { ModelBuilder } from './ModelBuilder';
import type { WeaponEnvelope } from './WeaponAttachments';

export type VehicleStyle = 'muscle' | 'track' | 'armored' | 'expedition';

/** Four silhouette kits shared by the roster; body paint remains player-selected. */
export function buildVehicleStyle(parent: TransformNode, style: VehicleStyle, envelope: WeaponEnvelope): void {
    const { width: w, height: h, depth: d, bottom } = envelope;
    const kit = new TransformNode(`style-${style}`, parent.getScene()); kit.parent = parent;
    const b = new ModelBuilder(parent.getScene(), kit);
    const dark = b.material('kit-carbon', '#252d33', .35, .62);
    const metal = b.material('kit-metal', style === 'expedition' ? '#aa946b' : '#839299', .65, .4);
    if (style === 'track') {
        for (const side of [-1, 1]) b.box('wing-stay', w * .04, h * .24, d * .035, metal, side * w * .32, bottom + h * .67, -d * .4);
        b.box('rear-aero-wing', w * 1.04, h * .055, d * .12, dark, 0, bottom + h * .8, -d * .4);
        b.box('front-splitter', w * .92, h * .05, d * .1, dark, 0, bottom + h * .18, d * .47);
    } else if (style === 'muscle') {
        b.box('hood-intake', w * .22, h * .12, d * .16, dark, 0, envelope.bonnetHeight + h * .04, d * .18);
        for (const side of [-1, 1]) b.cylinder('side-exhaust', h * .085, d * .46, metal, side * w * .46, bottom + h * .17, -d * .04, 'z');
    } else if (style === 'armored') {
        for (const side of [-1, 1]) {
            b.box('door-armor', w * .045, h * .29, d * .36, dark, side * w * .46, bottom + h * .51, -d * .02);
            b.box('armor-stripe', w * .049, h * .035, d * .31, metal, side * w * .46, bottom + h * .57, -d * .02);
        }
        b.loft('reinforced-bumper', [[d * .45, w * .82, bottom + h * .18, bottom + h * .34], [d * .52, w * .65, bottom + h * .19, bottom + h * .25]], dark);
    } else {
        for (const side of [-1, 1]) b.box('roof-rack-rail', w * .04, h * .08, d * .35, metal, side * w * .32, bottom + h * 1.01, -d * .12);
        for (const z of [-.27, -.12, .03]) b.box('roof-rack-crossbar', w * .68, h * .055, d * .025, dark, 0, bottom + h * 1.025, d * z);
        b.box('roof-cargo', w * .44, h * .15, d * .2, dark, 0, bottom + h * 1.09, -d * .17);
        for (const side of [-1, 1]) b.box('running-board', w * .12, h * .055, d * .45, metal, side * w * .45, bottom + h * .18, 0);
    }
    b.compact();
    // Kits are vehicle bodywork: combat rays must resolve them to the owning root.
    for (const mesh of kit.getChildMeshes()) mesh.isPickable = true;
}
