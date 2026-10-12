import { Mesh, ShadowGenerator } from '@babylonjs/core';

/** Register a completed vehicle once; transient battle effects never enter the shadow draw list. */
export function registerVehicleShadows(root: Mesh): void {
    const meshes = root.getChildMeshes().filter(mesh => mesh instanceof Mesh && mesh.getTotalVertices() > 0 && mesh.name !== 'healthBar');
    for (const light of root.getScene().lights) {
        const shadows = light.getShadowGenerator();
        if (!(shadows instanceof ShadowGenerator)) continue;
        for (const mesh of meshes) {
            shadows.addShadowCaster(mesh, false);
            mesh.receiveShadows = true;
        }
    }
}
