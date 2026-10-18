import { Color3, Matrix, Mesh, Quaternion, Scene, StandardMaterial, Texture, Vector3, VertexData } from '@babylonjs/core';
import { GraphicsSettingsManager } from '../settings/GraphicsSettingsManager';

/** Folded, tapering blades give each tuft a real silhouette from every viewing angle. */
function grassBladeGeometry(blades: number): VertexData {
    const positions: number[] = [], indices: number[] = [], uvs: number[] = [], colors: number[] = [];
    for (let blade = 0; blade < blades; blade++) {
        const angle = blade * 2.399963;
        const height = .38 + (blade * .137 % .38);
        const width = .025 + (blade % 3) * .009;
        const lean = .12 + (blade % 4) * .045;
        const radius = .035 + (blade % 3) * .025;
        const dx = Math.cos(angle), dz = Math.sin(angle);
        const start = positions.length / 3;
        // Three folded sections widen the base, then bend and taper toward a pointed tip.
        for (const t of [0, .42, .76]) {
            const spread = width * (1 - t * .85);
            const bend = radius + lean * t * t;
            for (const edge of [-1, 0, 1]) {
                const ridge = edge === 0 ? spread * .32 : 0;
                positions.push(dx * (bend + ridge) - dz * spread * edge, height * t, dz * (bend + ridge) + dx * spread * edge);
                // Sample the dense lower-middle grass, not the transparent sprite silhouette.
                uvs.push(.35 + (blade % 4) * .065 + edge * .012, .08 + t * .3);
                const shade = .62 + t * .38 + (blade % 3) * .04;
                colors.push(shade, shade, shade * .93, 1);
            }
        }
        positions.push(dx * (radius + lean), height, dz * (radius + lean));
        uvs.push(.35 + (blade % 4) * .065, .42);
        colors.push(1, 1, .93, 1);
        for (let row = 0; row < 2; row++) for (let half = 0; half < 2; half++) {
            const i = start + row * 3 + half;
            indices.push(i, i + 1, i + 3, i + 1, i + 4, i + 3);
        }
        indices.push(start + 6, start + 7, start + 9, start + 7, start + 8, start + 9);
    }
    const data = new VertexData(), normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    data.positions = positions; data.indices = indices; data.normals = normals; data.uvs = uvs; data.colors = colors;
    return data;
}

/** One instanced draw per map, with blade silhouettes instead of intersecting texture cards. */
export function plantGrass(scene: Scene, theme: string, sample: () => { x: number; z: number; y: number | null }): Mesh {
    const quality = GraphicsSettingsManager.getInstance().getQuality();
    const mesh = new Mesh('clutter-grass', scene);
    grassBladeGeometry(quality === 'LOW' ? 4 : quality === 'MEDIUM' ? 6 : 9).applyToMesh(mesh);
    const material = new StandardMaterial('grass-blades', scene);
    material.diffuseTexture = new Texture('/assets/scenery/Grass.png', scene);
    // Geometry defines coverage. Ignoring sprite alpha avoids rectangular edges and card overlap.
    material.diffuseTexture.hasAlpha = false;
    material.transparencyMode = StandardMaterial.MATERIAL_OPAQUE;
    material.backFaceCulling = false;
    material.twoSidedLighting = true;
    material.specularColor = Color3.Black();
    material.diffuseColor = Color3.FromHexString(theme === 'glacial' ? '#cadde1' : theme === 'wasteland' ? '#b6a376' : '#a6b8a0');
    mesh.material = material; mesh.isPickable = false; mesh.receiveShadows = true;
    const count = quality === 'LOW' ? 600 : quality === 'MEDIUM' ? 1500 : 3000;
    const matrices: number[] = [];
    for (let i = 0; i < count; i++) {
        const point = sample();
        if (point.y === null) continue;
        const scale = .7 + Math.random() * .5;
        const matrix = Matrix.Compose(new Vector3(scale, scale * (.8 + Math.random() * .4), scale), Quaternion.RotationAxis(Vector3.Up(), Math.random() * Math.PI * 2), new Vector3(point.x, point.y - .03, point.z));
        matrices.push(...matrix.asArray());
    }
    if (matrices.length) mesh.thinInstanceSetBuffer('matrix', new Float32Array(matrices), 16, true);
    else mesh.setEnabled(false);
    return mesh;
}
