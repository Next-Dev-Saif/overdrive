import { Matrix, type Mesh, Vector3 } from '@babylonjs/core';

/** Chassis bounds in the unscaled vehicle root's coordinates, excluding weapons and transient effects. */
export function getVehicleChassisBounds(root: Mesh): { center: Vector3; size: Vector3 } {
    const center = Vector3.Zero();
    const size = new Vector3(3, 2, 5).scale(root.metadata?.vehicleScale ?? 1);
    const chassis = root.getChildTransformNodes(false).find(node => node.name === 'chassisRoot');
    if (!chassis) return { center, size };
    const inverse = Matrix.Invert(root.computeWorldMatrix(true));
    const min = new Vector3(Infinity, Infinity, Infinity), max = new Vector3(-Infinity, -Infinity, -Infinity);
    const mounts = chassis.getChildTransformNodes(false).filter(node => node.name.startsWith('weapon_mount_'));
    for (const mesh of chassis.getChildMeshes()) {
        if (!mesh.isEnabled() || mesh.getTotalVertices() === 0 || mounts.some(mount => mesh.isDescendantOf(mount))) continue;
        mesh.computeWorldMatrix(true);
        for (const corner of mesh.getBoundingInfo().boundingBox.vectorsWorld) {
            const local = Vector3.TransformCoordinates(corner, inverse);
            min.minimizeInPlace(local); max.maximizeInPlace(local);
        }
    }
    if (Number.isFinite(min.x)) { center.copyFrom(min.add(max).scale(0.5)); size.copyFrom(max.subtract(min)); }
    return { center, size };
}
