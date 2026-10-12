import { Color3, Material, Mesh, RawTexture, Scene, StandardMaterial, Texture, Vector3, VertexBuffer, VertexData } from '@babylonjs/core';
import { createArenaRoadLayout, sampleArenaRoad, type ArenaRoadLayout } from './ArenaRoadLayout';
import { GraphicsSettingsManager } from '../settings/GraphicsSettingsManager';

const PALETTES: Record<string, { asphalt: number[]; shoulder: number[]; paint: number[] }> = {
    wasteland: { asphalt: [77, 67, 56], shoulder: [126, 104, 76], paint: [204, 187, 145] },
    facility: { asphalt: [48, 53, 58], shoulder: [83, 87, 89], paint: [222, 190, 103] },
    glacial: { asphalt: [57, 74, 86], shoulder: [172, 193, 204], paint: [226, 235, 233] },
    neon: { asphalt: [28, 35, 43], shoulder: [53, 63, 73], paint: [181, 214, 216] },
};
const grain = (x: number, y: number) => {
    const seed = Math.imul(x + 17, 374761393) ^ Math.imul(y + 31, 668265263);
    return ((Math.imul(seed ^ (seed >>> 13), 1274126177) >>> 0) % 256) / 255;
};

/** Filtered road coverage with continuous paint. Fine aggregate is handled by a repeating detail map. */
export function createArenaRoadPixels(layout: ArenaRoadLayout, theme: string, resolution: number): Uint8Array {
    const pixels = new Uint8Array(resolution * resolution * 4);
    const palette = PALETTES[theme] ?? PALETTES.wasteland, halfWidth = layout.width / 2;
    const texel = layout.size / resolution;
    const coverage = (distance: number, halfSize: number) => Math.max(0, Math.min(1, (halfSize - distance) / texel + .5));
    for (let y = 0; y < resolution; y++) for (let x = 0; x < resolution; x++) {
        const wx = ((x + .5) / resolution - .5) * layout.size, wz = ((y + .5) / resolution - .5) * layout.size;
        const road = sampleArenaRoad(layout, wx, wz), at = (y * resolution + x) * 4;
        // Keep RGB under transparent texels: mip filtering otherwise introduces dark broken edges.
        pixels[at] = palette.shoulder[0];
        pixels[at + 1] = palette.shoulder[1];
        pixels[at + 2] = palette.shoulder[2];
        if (road.distance > halfWidth + 2 + texel) continue;
        const asphalt = coverage(road.distance, halfWidth);
        const junction = coverage(road.secondDistance, halfWidth + 1.5);
        const phase = road.along % 16;
        const dash = coverage(Math.abs(phase - 4.5), 4.5);
        const centerLine = coverage(road.distance, .42) * dash;
        const edgeLine = coverage(Math.abs(road.distance - (halfWidth - .85)), .32);
        const paint = Math.max(centerLine, edgeLine) * (1 - junction);
        const variation = .99 + .02 * Math.sin(wx * .07) * Math.cos(wz * .09);
        for (let channel = 0; channel < 3; channel++) {
            const pavement = (palette.shoulder[channel] * (1 - asphalt) + palette.asphalt[channel] * asphalt) * variation;
            pixels[at + channel] = pavement * (1 - paint) + palette.paint[channel] * paint;
        }
        pixels[at + 3] = Math.round(255 * coverage(road.distance, halfWidth + 1.6));
    }
    return pixels;
}

/** Reuse exact terrain triangles so roads follow every slope without altering Havok contact surfaces. */
export function buildArenaRoads(scene: Scene, theme: string, size: number): ArenaRoadLayout {
    const layout = createArenaRoadLayout(size);
    const terrain = scene.meshes.filter((mesh): mesh is Mesh => mesh instanceof Mesh && mesh.metadata?.terrain === true);
    if (!terrain.length) return layout;
    const resolution = GraphicsSettingsManager.getInstance().getQuality() === 'LOW' ? 2048 : 4096;
    const texture = RawTexture.CreateRGBATexture(createArenaRoadPixels(layout, theme, resolution), resolution, resolution, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
    texture.name = `arena-road-atlas-${theme}`; texture.hasAlpha = true; texture.wrapU = texture.wrapV = Texture.CLAMP_ADDRESSMODE; texture.anisotropicFilteringLevel = 8;
    const material = new StandardMaterial(`arena-road-material-${theme}`, scene);
    material.diffuseTexture = texture; material.diffuseColor = Color3.White();
    material.useAlphaFromDiffuseTexture = true; material.transparencyMode = Material.MATERIAL_ALPHABLEND;
    // A stable depth bias keeps the terrain-conforming overlay from fighting its source surface.
    material.zOffset = -2;
    material.zOffsetUnits = -2;
    material.specularColor.setAll(theme === 'neon' ? .25 : theme === 'glacial' ? .18 : .04);
    material.specularPower = theme === 'neon' ? 64 : 24;
    // Subtle repeating aggregate adds near-wheel detail without coarse, high-contrast noise.
    const detail = new Uint8Array(128 * 128 * 4);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) detail.set([120 + grain(x, y) * 16, 128, 128, 128], (y * 128 + x) * 4);
    const aggregate = RawTexture.CreateRGBATexture(detail, 128, 128, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
    aggregate.name = 'arena-road-aggregate'; aggregate.anisotropicFilteringLevel = 8; aggregate.uScale = aggregate.vScale = size / 8;
    material.detailMap.texture = aggregate; material.detailMap.isEnabled = true; material.detailMap.diffuseBlendLevel = .12; material.detailMap.bumpLevel = 0;
    for (const source of terrain) {
        const sourcePositions = source.getVerticesData(VertexBuffer.PositionKind), sourceIndices = source.getIndices();
        if (!sourcePositions || !sourceIndices) continue;
        const matrix = source.computeWorldMatrix(true), positions: number[] = [], uvs: number[] = [];
        for (let i = 0; i < sourcePositions.length; i += 3) {
            const point = Vector3.TransformCoordinates(Vector3.FromArray(sourcePositions, i), matrix);
            positions.push(point.x, point.y + .025, point.z);
            uvs.push(point.x / size + .5, point.z / size + .5);
        }
        const mesh = new Mesh(`arena-road-${source.name}`, scene), data = new VertexData(), normals: number[] = [];
        const indices = Array.from(sourceIndices);
        VertexData.ComputeNormals(positions, indices, normals);
        data.positions = positions; data.indices = indices; data.normals = normals; data.uvs = uvs; data.applyToMesh(mesh);
        mesh.material = material; mesh.isPickable = false; mesh.receiveShadows = true;
        mesh.metadata = { arenaRoad: true, sourceTerrain: source.uniqueId };
        mesh.freezeWorldMatrix();
    }
    return layout;
}
