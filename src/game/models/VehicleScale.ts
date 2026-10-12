import { type TransformNode } from '@babylonjs/core';

/** Match proportions relative to arena cover; previews keep their authored size. */
export const MATCH_VEHICLE_SCALE = 1.5;

/** Scale the complete visual hierarchy without scaling the physics/network root twice. */
export function scaleVehicleVisuals(root: TransformNode, scale: number): void {
    const visual = root.getChildTransformNodes(true).find(node => node.name === 'visualRoot');
    if (!visual) throw new Error('Vehicle has no visualRoot to scale.');
    visual.scaling.scaleInPlace(scale);
    // Procedural fallbacks carry a suspension offset on this node.
    visual.position.scaleInPlace(scale);
}
