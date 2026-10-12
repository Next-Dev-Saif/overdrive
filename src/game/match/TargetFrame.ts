import { type Mesh, Vector3 } from '@babylonjs/core';
import { getVehicleChassisBounds } from '../models/VehicleBounds';

export interface TargetFrame { x: number; y: number; width: number; height: number; locked: boolean }
const boundsCache = new WeakMap<Mesh, ReturnType<typeof getVehicleChassisBounds>>();

/** Project eight chassis corners in CSS pixels; reject behind-camera and offscreen targets. */
export function projectTargetFrame(target: Mesh, project: (x: number, y: number, z: number) => { x: number; y: number; z: number } | null, width: number, height: number, locked: boolean): TargetFrame | null {
    if (target.isDisposed() || !target.isEnabled() || target.metadata?.vehicle?.isDead || target.metadata?.vehicle?.isCloaked) return null;
    let bounds = boundsCache.get(target);
    if (!bounds) { bounds = getVehicleChassisBounds(target); boundsCache.set(target, bounds); }
    const world = target.computeWorldMatrix(true);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const x of [-0.5, 0.5]) for (const y of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) {
        const point = Vector3.TransformCoordinates(new Vector3(bounds.center.x + bounds.size.x * x, bounds.center.y + bounds.size.y * y, bounds.center.z + bounds.size.z * z), world);
        const screen = project(point.x, point.y, point.z);
        if (!screen || screen.z <= 0 || screen.z >= 1 || !Number.isFinite(screen.x + screen.y)) return null;
        minX = Math.min(minX, screen.x); minY = Math.min(minY, screen.y);
        maxX = Math.max(maxX, screen.x); maxY = Math.max(maxY, screen.y);
    }
    if (maxX < 0 || maxY < 0 || minX > width || minY > height) return null;
    minX = Math.max(4, minX - 8); minY = Math.max(4, minY - 8);
    maxX = Math.min(width - 4, maxX + 8); maxY = Math.min(height - 4, maxY + 8);
    return { x: minX, y: minY, width: Math.max(0, maxX - minX), height: Math.max(0, maxY - minY), locked };
}
