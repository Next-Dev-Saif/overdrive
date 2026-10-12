import { Color3, Constants, Matrix, Mesh, RawTexture, StandardMaterial, Texture, Vector3, VertexData } from '@babylonjs/core';

/** Chassis emergence, rising orbit and inward collapse, in vehicle-local space. */
export function vortexPosition(progress: number, index: number, center: Vector3, size: Vector3, result: Vector3): void {
    const t = Math.max(0, Math.min(1, progress));
    const expansion = t < 0.3 ? Math.sin(t / 0.3 * Math.PI / 2) : t < 0.65 ? 1 : Math.pow((1 - t) / 0.35, 1.5);
    const angle = index * 2.399963 + t * Math.PI * 5;
    const strand = 0.85 + (index % 5) * 0.04;
    result.set(center.x + Math.cos(angle) * size.x * 0.7 * expansion * strand,
        center.y + (Math.sin(angle * 0.5 + index) * 0.25 + t * 0.65) * size.y * expansion,
        center.z + Math.sin(angle) * size.z * 0.65 * expansion * strand);
}

/** One draw call of camera-facing sparks, with private geometry/material/texture ownership.
 * This gameplay telegraph must survive scene particle suppression and unrelated VFX disposal.
 */
export function createAbilityVortex(parent: Mesh, center: Vector3, size: Vector3, count: number, color: Color3) {
    const scene = parent.getScene();
    const mesh = new Mesh('ability-activation-vortex', scene);
    mesh.isPickable = false;
    mesh.alwaysSelectAsActiveMesh = true;
    mesh.renderingGroupId = 1;
    const pixels = new Uint8Array(32 * 32 * 4);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const dx = (x - 15.5) / 15.5, dy = (y - 15.5) / 15.5;
        const alpha = Math.max(0, 1 - Math.hypot(dx, dy));
        const offset = (y * 32 + x) * 4;
        pixels.set([255, 255, 255, Math.round(alpha * alpha * 255)], offset);
    }
    const texture = RawTexture.CreateRGBATexture(pixels, 32, 32, scene, false, false, Texture.BILINEAR_SAMPLINGMODE);
    texture.name = 'ability-vortex-sprite'; texture.hasAlpha = true;
    const material = new StandardMaterial('ability-vortex-material', scene);
    material.disableLighting = true; material.backFaceCulling = false;
    material.emissiveColor = color; material.diffuseTexture = texture;
    material.useAlphaFromDiffuseTexture = true;
    material.alphaMode = Constants.ALPHA_ADD;
    material.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
    material.disableDepthWrite = true;
    mesh.material = material;
    const positions = new Float32Array(count * 12), uvs = new Float32Array(count * 8), indices: number[] = [];
    for (let i = 0; i < count; i++) {
        uvs.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8);
        const base = i * 4; indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    const data = new VertexData(); data.positions = positions; data.uvs = uvs; data.indices = indices;
    data.applyToMesh(mesh, true);
    const local = Vector3.Zero(), worldPoint = Vector3.Zero();
    const right = Vector3.Zero(), up = Vector3.Zero();
    const inverseView = Matrix.Identity();
    let disposed = false;
    return {
        /** Update the entire sprite batch without per-spark meshes, timers or allocations. */
        update(progress: number) {
            if (disposed) return;
            const camera = scene.activeCamera;
            if (!camera) return;
            camera.getViewMatrix().invertToRef(inverseView);
            Vector3.TransformNormalToRef(Vector3.RightReadOnly, inverseView, right);
            Vector3.TransformNormalToRef(Vector3.UpReadOnly, inverseView, up);
            const world = parent.computeWorldMatrix(true);
            for (let i = 0; i < count; i++) {
                vortexPosition(progress, i, center, size, local);
                Vector3.TransformCoordinatesToRef(local, world, worldPoint);
                const radius = 0.18 + (i % 5) * 0.06;
                for (let corner = 0; corner < 4; corner++) {
                    const dx = (corner === 0 || corner === 3 ? -1 : 1) * radius;
                    const dy = (corner < 2 ? -1 : 1) * radius;
                    const offset = i * 12 + corner * 3;
                    positions[offset] = worldPoint.x + right.x * dx + up.x * dy;
                    positions[offset + 1] = worldPoint.y + right.y * dx + up.y * dy;
                    positions[offset + 2] = worldPoint.z + right.z * dx + up.z * dy;
                }
            }
            material.alpha = Math.max(0, Math.min(1, progress * 8, (1 - progress) * 10));
            mesh.updateVerticesData('position', positions, false, false);
        },
        dispose() {
            if (disposed) return;
            disposed = true;
            mesh.dispose(); material.dispose(false, true);
        },
    };
}
