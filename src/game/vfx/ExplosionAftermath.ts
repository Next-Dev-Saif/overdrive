import { Color3, Matrix, Mesh, MeshBuilder, RawTexture, Ray, Scene, StandardMaterial, Texture, Vector3, VertexData } from '@babylonjs/core';

const active = new WeakMap<Scene, Set<() => void>>();

/** Persistent presentation only: bounded marks/clouds, no damage, picking or collision. */
export function createExplosionAftermath(scene: Scene, impact: Vector3, radius: number, nuke: boolean, smoke: Texture, density: number): () => void {
    let effects = active.get(scene);
    if (!effects) { effects = new Set(); active.set(scene, effects); }
    const budget = density <= 0 ? 3 : 6;
    while (effects.size >= budget) effects.values().next().value?.();
    const meshes: Mesh[] = [], materials: StandardMaterial[] = [];
    const surface = scene.pickWithRay(new Ray(impact.add(new Vector3(0, 5, 0)), new Vector3(0, -1, 0), 100), mesh =>
        mesh.isEnabled() && mesh.isVisible && Boolean(mesh.metadata?.terrain || mesh.metadata?.arenaRoad));
    let scorch: Mesh | undefined;
    let scorchTexture: Texture | undefined;
    if (surface?.pickedMesh && surface.pickedPoint) {
        const diameter = radius * (nuke ? 1.25 : .8);
        scorch = MeshBuilder.CreateDecal('ordnance-scorch', surface.pickedMesh, {
            position: surface.pickedPoint, normal: Vector3.Up(), size: new Vector3(diameter, diameter, 12),
        });
        const bytes = new Uint8Array(64 * 64 * 4);
        for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
            const dx = (x - 31.5) / 31.5, dy = (y - 31.5) / 31.5;
            const r = Math.hypot(dx, dy), angle = Math.atan2(dy, dx);
            const edge = .84 + .07 * Math.sin(angle * 11) + .035 * Math.cos(angle * 19);
            const alpha = Math.min(1, Math.max(0, (edge - r) * 5));
            const grain = (x * 17 + y * 31 + x * y) % 19;
            bytes.set([24 + grain, 19 + grain, 15 + grain, alpha * 210], (y * 64 + x) * 4);
        }
        scorchTexture = RawTexture.CreateRGBATexture(bytes, 64, 64, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
        scorchTexture.hasAlpha = true;
        const material = new StandardMaterial('ordnance-char', scene);
        material.diffuseTexture = scorchTexture; material.useAlphaFromDiffuseTexture = true;
        material.specularColor = Color3.Black(); material.zOffset = -2;
        material.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
        material.disableDepthWrite = true;
        scorch.material = material; materials.push(material); meshes.push(scorch);
    }
    // One draw call of billowing sprites forms the entire stem and cap, including on LOW.
    const count = density <= 0 ? 14 : density < 1 ? 22 : 30;
    const stemCount = Math.floor(count * .4);
    const positions = new Float32Array(count * 12), colors = new Float32Array(count * 16);
    let cloud: Mesh | undefined;
    let cloudMaterial: StandardMaterial | undefined;
    if (nuke) {
        cloud = new Mesh('nuclear-mushroom-cloud', scene);
        cloud.alwaysSelectAsActiveMesh = true;
        const uvs = new Float32Array(count * 8), indices: number[] = [];
        for (let i = 0; i < count; i++) {
            uvs.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8);
            const v = i * 4; indices.push(v, v + 1, v + 2, v, v + 2, v + 3);
        }
        const data = new VertexData(); data.positions = positions; data.colors = colors; data.uvs = uvs; data.indices = indices;
        data.applyToMesh(cloud, true);
        cloudMaterial = new StandardMaterial('nuclear-billowing-smoke', scene);
        cloudMaterial.disableLighting = true; cloudMaterial.emissiveColor = Color3.White();
        cloudMaterial.diffuseTexture = smoke; cloudMaterial.useAlphaFromDiffuseTexture = true;
        cloudMaterial.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
        cloudMaterial.backFaceCulling = false; cloudMaterial.disableDepthWrite = true;
        cloud.material = cloudMaterial; meshes.push(cloud); materials.push(cloudMaterial);
    }
    for (const mesh of meshes) { mesh.isPickable = false; mesh.checkCollisions = false; mesh.metadata = { presentationOnly: true }; }
    const inverseView = Matrix.Identity(), right = Vector3.Zero(), up = Vector3.Zero();
    const start = performance.now(), lifetime = nuke ? 24000 : 14000;
    let disposed = false;
    const cleanup = () => {
        if (disposed) return;
        disposed = true; effects.delete(cleanup);
        scene.onBeforeRenderObservable.remove(observer); scene.onDisposeObservable.remove(disposeObserver);
        meshes.forEach(mesh => mesh.dispose()); materials.forEach(material => material.dispose()); scorchTexture?.dispose();
    };
    const update = () => {
        const age = (performance.now() - start) / 1000;
        if (age * 1000 >= lifetime) { cleanup(); return; }
        if (scorch) scorch.visibility = Math.min(1, Math.max(0, (lifetime / 1000 - age) / 5));
        if (!cloud || !cloudMaterial || !scene.activeCamera) return;
        if (age >= 16) { cloud.setEnabled(false); return; }
        scene.activeCamera.getViewMatrix().invertToRef(inverseView);
        Vector3.TransformNormalToRef(Vector3.RightReadOnly, inverseView, right);
        Vector3.TransformNormalToRef(Vector3.UpReadOnly, inverseView, up);
        const rise = Math.min(1, age / 5), growth = .22 + .78 * Math.sqrt(rise);
        const height = radius * 2.2 * growth;
        const heat = Math.max(0, 1 - age / 5);
        for (let i = 0; i < count; i++) {
            const stem = i < stemCount;
            const angle = i * 2.39996 + age * .12;
            const fraction = stem ? (i + .5) / stemCount : (i - stemCount) / (count - stemCount);
            const ring = stem ? radius * .07 : radius * .58 * growth;
            const x = impact.x + Math.cos(angle) * ring;
            const y = impact.y + (stem ? height * fraction * .85 : height + Math.sin(fraction * Math.PI * 2) * radius * .12 * growth);
            const z = impact.z + Math.sin(angle) * ring;
            const size = radius * (stem ? .22 : .4) * growth * (1 + .06 * Math.sin(age * 1.5 + i));
            for (let corner = 0; corner < 4; corner++) {
                const dx = (corner === 0 || corner === 3 ? -1 : 1) * size, dy = (corner < 2 ? -1 : 1) * size;
                const p = i * 12 + corner * 3, c = i * 16 + corner * 4;
                positions[p] = x + right.x * dx + up.x * dy; positions[p + 1] = y + right.y * dx + up.y * dy; positions[p + 2] = z + right.z * dx + up.z * dy;
                const shade = .48 + (i % 4) * .055;
                colors.set([shade + heat * .5, shade + heat * .12, shade * (1 - heat * .5), 1], c);
            }
        }
        cloudMaterial.alpha = Math.min(1, age * 3, (16 - age) / 5);
        cloud.updateVerticesData('position', positions, false, false); cloud.updateVerticesData('color', colors, false, false);
    };
    const observer = scene.onBeforeRenderObservable.add(update);
    const disposeObserver = scene.onDisposeObservable.add(cleanup);
    effects.add(cleanup); update();
    return cleanup;
}
