import { GroundMesh, Mesh, Ray, Scene, Material, Vector3, VertexBuffer, VertexData } from '@babylonjs/core';

/** Bake broad rises into the heightfield before physics creation; no circular platform seams. */
export function addRaisedTerrain(scene: Scene, _material: Material, mapSize: number): Mesh[] {
    const ground = scene.meshes.find((mesh): mesh is GroundMesh => mesh instanceof GroundMesh && mesh.metadata?.terrain === true);
    if (!ground) return [];
    const positions = ground.getVerticesData(VertexBuffer.PositionKind);
    const indices = ground.getIndices();
    if (!positions || !indices) return [];
    const scale = mapSize / 600;
    const hills = [
        { x: -70, z: 55, rx: 52, rz: 40, height: 3 },
        { x: 80, z: -65, rx: 64, rz: 48, height: 4 },
        { x: -85, z: -80, rx: 44, rz: 36, height: 2.5 },
    ];
    for (let i = 0; i < positions.length; i += 3) for (const hill of hills) {
        const dx = (positions[i] / scale - hill.x) / hill.rx;
        const dz = (positions[i + 2] / scale - hill.z) / hill.rz;
        const falloff = Math.max(0, 1 - dx * dx - dz * dz);
        positions[i + 1] += hill.height * falloff * falloff * falloff;
    }
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    ground.setVerticesData(VertexBuffer.PositionKind, positions, true);
    ground.setVerticesData(VertexBuffer.NormalKind, normals, true);
    ground.refreshBoundingInfo();
    ground.updateCoordinateHeights();
    // The ground remains the only road/physics surface; there are no extra raised meshes.
    return [];
}

const terrainCache = new WeakMap<Scene, { dirty: boolean; meshes: Mesh[] }>();

/** Terrain-only ray excludes scenery, other vehicles and skyboxes. Returns null outside the arena. */
export function groundHeight(scene: Scene, x: number, z: number): number | null {
    const ray = new Ray(new Vector3(x, 80, z), new Vector3(0, -1, 0), 120);
    let cached = terrainCache.get(scene);
    if (!cached) {
        cached = { dirty: true, meshes: [] };
        terrainCache.set(scene, cached);
        const entry = cached;
        scene.onNewMeshAddedObservable.add(() => { entry.dirty = true; });
        scene.onMeshRemovedObservable.add(() => { entry.dirty = true; });
    }
    // Rebuild at most once after mesh changes; never scan all vehicle detail for each driver.
    if (cached.dirty) {
        cached.meshes = scene.meshes.filter(mesh => mesh.metadata?.terrain === true) as Mesh[];
        cached.dirty = false;
    }
    const hit = ray.intersectsMeshes(cached.meshes.filter(mesh => !mesh.isDisposed() && mesh.isEnabled()))[0];
    return hit?.hit && hit.pickedPoint ? hit.pickedPoint.y : null;
}

/** Positive-depth chassis penetration only; normal tire contact and airborne motion are left to Havok. */
export function recoveryHeight(scene: Scene, mesh: Mesh, halfHeight: number): number | null {
    const surface = groundHeight(scene, mesh.position.x, mesh.position.z);
    return surface !== null && mesh.position.y < surface - 0.05 ? surface + halfHeight + 0.2 : null;
}
