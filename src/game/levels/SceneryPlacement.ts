import { GroundMesh, Mesh, MeshBuilder, Ray, Scene, Vector3, VertexBuffer, VertexData } from '@babylonjs/core';

/** Snapshot completed static terrain once; heightmap quad lookup avoids per-instance triangle scans. */
export function createSceneryHeightSampler(scene: Scene): (x: number, z: number) => number | null {
    const terrain = scene.meshes.filter((mesh): mesh is Mesh => mesh instanceof Mesh && mesh.metadata?.terrain === true && mesh.isEnabled());
    terrain.forEach(mesh => mesh.computeWorldMatrix(true));
    return (x, z) => {
        let height: number | null = null;
        for (const mesh of terrain) {
            const bounds = mesh.getBoundingInfo().boundingBox;
            if (x < bounds.minimumWorld.x || x > bounds.maximumWorld.x || z < bounds.minimumWorld.z || z > bounds.maximumWorld.z) continue;
            let surface: number | undefined;
            if (mesh instanceof GroundMesh && mesh.rotation.lengthSquared() === 0 && !mesh.rotationQuaternion && !mesh.parent) {
                surface = mesh.getHeightAtCoordinates(
                    Math.max(bounds.minimumWorld.x + 1e-6, Math.min(bounds.maximumWorld.x - 1e-6, x)),
                    Math.max(bounds.minimumWorld.z + 1e-6, Math.min(bounds.maximumWorld.z - 1e-6, z)),
                );
            } else {
                const ray = new Ray(new Vector3(x, bounds.maximumWorld.y + 1, z), Vector3.Down(), bounds.maximumWorld.y - bounds.minimumWorld.y + 2);
                const hit = ray.intersectsMesh(mesh, false);
                if (hit.hit && hit.pickedPoint) surface = hit.pickedPoint.y;
            }
            if (surface !== undefined && Number.isFinite(surface)) height = height === null ? surface : Math.max(height, surface);
        }
        return height;
    };
}

/** Subdivided painted strip follows hills rather than bridging them as a rigid box. */
export function createTerrainMarking(scene: Scene, heightAt: (x: number, z: number) => number | null, x: number, z: number): Mesh {
    const strip = MeshBuilder.CreateGround('route-marker', { width: 0.35, height: 9, subdivisionsX: 1, subdivisionsY: 36, updatable: true }, scene);
    const positions = strip.getVerticesData(VertexBuffer.PositionKind)!;
    const normals = strip.getVerticesData(VertexBuffer.NormalKind)!;
    for (let i = 0; i < positions.length; i += 3) {
        const height = heightAt(x + positions[i], z + positions[i + 2]);
        if (height === null) { strip.setEnabled(false); return strip; }
        positions[i + 1] = height + 0.035;
    }
    VertexData.ComputeNormals(positions, strip.getIndices()!, normals);
    strip.updateVerticesData(VertexBuffer.PositionKind, positions, true);
    strip.updateVerticesData(VertexBuffer.NormalKind, normals);
    strip.position.set(x, 0, z);
    strip.isPickable = false;
    strip.receiveShadows = true;
    return strip;
}
