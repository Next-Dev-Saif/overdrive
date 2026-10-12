import { Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Scene, StandardMaterial, VertexBuffer, VertexData } from '@babylonjs/core';

interface CoverMaterials { stone: StandardMaterial; metal: StandardMaterial; trim: StandardMaterial; snow: StandardMaterial }

/** Four isolated, team-symmetric cover islands with open exits on every side of the central roads. */
export function buildCentralCover(scene: Scene, theme: string, size: number, heightAt: (x: number, z: number) => number | null, materials: CoverMaterials): Mesh[] {
    const natural = theme === 'wasteland' || theme === 'glacial';
    const scale = size / 600, width = 20, depth = 11;
    const meshes: Mesh[] = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const x = sx * 40 * scale, z = sz * 44 * scale, yaw = sx * sz * .22;
        // Sample the whole rotated footprint; embed the base and keep seven metres of cover above its highest point.
        let low = Infinity, high = -Infinity;
        for (let dx = -width / 2; dx <= width / 2; dx += 1) for (let dz = -depth / 2; dz <= depth / 2; dz += 1) {
            const height = heightAt(x + Math.cos(yaw) * dx + Math.sin(yaw) * dz, z - Math.sin(yaw) * dx + Math.cos(yaw) * dz);
            if (height !== null) { low = Math.min(low, height); high = Math.max(high, height); }
        }
        if (!Number.isFinite(low)) continue;
        const bottom = low - .4, height = high + 7 - bottom;
        const cover = MeshBuilder.CreateBox(`central-cover-${theme}-${sx}-${sz}`, { width, depth, height, updatable: natural }, scene);
        if (natural) {
            const positions = cover.getVerticesData(VertexBuffer.PositionKind)!;
            for (let i = 0; i < positions.length; i += 3) if (positions[i + 1] > 0) { positions[i] *= .82; positions[i + 2] *= .82; }
            const normals: number[] = [];
            VertexData.ComputeNormals(positions, cover.getIndices()!, normals);
            cover.updateVerticesData(VertexBuffer.PositionKind, positions, true);
            cover.updateVerticesData(VertexBuffer.NormalKind, normals);
        }
        cover.position.set(x, bottom + height / 2, z); cover.rotation.y = yaw;
        cover.material = natural ? materials.stone : theme === 'neon' ? materials.trim : materials.metal;
        cover.receiveShadows = true; cover.isPickable = true;
        cover.metadata = { centralCover: true, terrainLow: low, terrainHigh: high };
        new PhysicsAggregate(cover, natural ? PhysicsShapeType.CONVEX_HULL : PhysicsShapeType.BOX, { mass: 0, friction: .6, restitution: .05 }, scene);
        const cap = MeshBuilder.CreateBox('central-cover-cap', { width: natural ? width * .82 : width, depth: natural ? depth * .82 : depth, height: .35 }, scene);
        cap.parent = cover; cap.position.y = height / 2;
        cap.material = theme === 'glacial' ? materials.snow : natural ? materials.stone : materials.metal;
        cap.receiveShadows = true;
        if (!natural) {
            // Recess-like panels identify industrial service blocks without adding separate obstacles.
            for (const side of [-1, 1]) {
                const panel = MeshBuilder.CreateBox('central-cover-panel', { width: 14, height: 3, depth: .12 }, scene);
                panel.parent = cover; panel.position.set(0, height / 2 - 2.5, side * (depth / 2 + .02));
                panel.material = theme === 'neon' ? materials.metal : materials.trim;
                panel.receiveShadows = true;
            }
        }
        meshes.push(cover);
    }
    return meshes;
}
