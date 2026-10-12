import { Color3, Mesh, Ray, Scene, StandardMaterial, Vector3, VertexData } from '@babylonjs/core';

/** Stable, continuous spatial noise: each biome keeps its own recognizable geography. */
export function landscapeNoise(x: number, z: number, seed: number): number {
    const hash = (a: number, b: number) => { const n = Math.sin(a * 127.1 + b * 311.7 + seed * 19.19) * 43758.5453; return n - Math.floor(n); };
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
    const a = hash(ix, iz) * (1 - sx) + hash(ix + 1, iz) * sx;
    const b = hash(ix, iz + 1) * (1 - sx) + hash(ix + 1, iz + 1) * sx;
    return a * (1 - sz) + b * sz;
}

/** Uneven mountain ranges with broad valleys and a buried inner skirt, entirely outside play. */
export function buildLandscapeTerrain(scene: Scene, theme: string, radius: number): (x: number, z: number) => number {
    const desert = theme === 'wasteland', ice = theme === 'glacial', city = theme === 'neon';
    const seed = desert ? 17 : ice ? 53 : city ? 91 : 37;
    const peaks = Array.from({ length: ice ? 17 : 12 }, (_, i) => {
        const a = i * 2.399963 + seed, distance = radius + 140 + landscapeNoise(i, 2, seed) * 320;
        return { x: Math.cos(a) * distance, z: Math.sin(a) * distance, width: 45 + landscapeNoise(i, 4, seed) * 100, height: (ice ? 180 : desert ? 100 : city ? 65 : 85) * (.6 + landscapeNoise(i, 9, seed)) };
    });
    const heightAt = (x: number, z: number) => {
        const distance = Math.hypot(x, z) - radius;
        const blend = Math.max(0, Math.min(1, (distance - 12) / 70));
        const noise = landscapeNoise(x / 100, z / 100, seed);
        let height = 8 + noise * (ice ? 38 : 22) + landscapeNoise(x / 29, z / 29, seed + 3) * (ice ? 20 : 7);
        for (const peak of peaks) {
            const d = Math.hypot(x - peak.x, z - peak.z) / peak.width;
            const shape = desert ? Math.min(1, Math.max(0, 1.65 - d * 1.4)) : Math.exp(-d * d * (ice ? 1.8 : .85));
            height += shape * peak.height;
        }
        return -5 + blend * height;
    };
    const colors = desert ? ['#826551', '#b58a60', '#c5a17a'] : ice ? ['#627e91', '#9fb6c3', '#e0eaeb'] : city ? ['#26353b', '#40504f', '#6c7c7d'] : ['#455647', '#76836a', '#92948a'];
    const mat = new StandardMaterial('horizon-terrain', scene); mat.diffuseColor.setAll(1); mat.specularColor.setAll(0);
    mat.emissiveColor.setAll(.17); mat.fogEnabled = false;
    const segments = 160, rings = [12, 26, 46, 72, 105, 145, 195, 255, 325, 410, 510, 625, 750];
    const positions: number[] = [], indices: number[] = [], colorsData: number[] = [];
    for (let ring = 0; ring < rings.length; ring++) for (let i = 0; i <= segments; i++) {
        const a = (i % segments) / segments * Math.PI * 2;
        const r = radius + rings[ring];
        const x = Math.cos(a) * r, z = Math.sin(a) * r, y = heightAt(x, z);
        positions.push(x, ring === rings.length - 1 ? -15 : y, z);
        const noise = landscapeNoise(x / 38, z / 38, seed);
        const snowLine = ice ? Math.max(0, Math.min(1, (y - 75 - noise * 45) / 30)) : Math.min(1, y / 200);
        let color = Color3.Lerp(Color3.FromHexString(colors[0]), Color3.FromHexString(colors[1]), noise * .7 + .2);
        color = Color3.Lerp(color, Color3.FromHexString(colors[2]), snowLine);
        // Sedimentary bands break up desert cliff faces; distance desaturates all biomes.
        if (desert) color.scaleInPlace(.87 + .13 * Math.sin(y * .24 + noise));
        color = Color3.Lerp(color, scene.fogColor, Math.min(.78, rings[ring] / 850));
        colorsData.push(color.r, color.g, color.b, 1);
        if (ring < rings.length - 1 && i < segments) {
            const k = ring * (segments + 1) + i, next = k + segments + 1;
            if ((i + ring) % 2) indices.push(k, k + 1, next, k + 1, next + 1, next);
            else indices.push(k, k + 1, next + 1, k, next + 1, next);
        }
    }
    const mesh = new Mesh('horizon-geography', scene), data = new VertexData(), normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    data.positions = positions; data.indices = indices; data.normals = normals; data.colors = colorsData; data.applyToMesh(mesh);
    mesh.convertToFlatShadedMesh(); mesh.material = mat; mesh.isPickable = false;
    mesh.metadata = { presentationOnly: true, outerLandscape: true }; mesh.freezeWorldMatrix();
    mesh.computeWorldMatrix(true);
    // Ground details on the rendered triangles, not the smoother source height function.
    return (x, z) => {
        const hit = new Ray(new Vector3(x, 600, z), Vector3.Down(), 1000).intersectsMesh(mesh, false);
        return hit.hit && hit.pickedPoint ? hit.pickedPoint.y : heightAt(x, z);
    };
}
