import { Color3, Material, Mesh, MeshBuilder, PBRMaterial, Scene, TransformNode, Vector3, VertexData } from '@babylonjs/core';

/** Small geometry vocabulary shared by vehicle and weapon assemblies. All lengths are metres. */
export class ModelBuilder {
    public scene: Scene;
    public parent: TransformNode;
    constructor(scene: Scene, parent: TransformNode) { this.scene = scene; this.parent = parent; }
    material(name: string, color: string, metallic = 0.6, roughness = 0.4, emission = false) {
        const material = new PBRMaterial(name, this.scene);
        material.albedoColor = Color3.FromHexString(color);
        material.metallic = metallic;
        material.roughness = roughness;
        if (emission) material.emissiveColor = material.albedoColor.scale(0.8);
        return material;
    }
    place(mesh: Mesh, material: Material, x: number, y: number, z: number) {
        mesh.parent = this.parent;
        mesh.material = material;
        mesh.position.set(x, y, z);
        mesh.isPickable = false;
        return mesh;
    }
    box(name: string, w: number, h: number, d: number, material: Material, x = 0, y = 0, z = 0) {
        return this.place(MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, this.scene), material, x, y, z);
    }
    cylinder(name: string, diameter: number, length: number, material: Material, x = 0, y = 0, z = 0, axis: 'x' | 'y' | 'z' = 'y', top = diameter) {
        const mesh = this.place(MeshBuilder.CreateCylinder(name, { diameterTop: top, diameterBottom: diameter, height: length, tessellation: 24 }, this.scene), material, x, y, z);
        if (axis === 'z') mesh.rotation.x = Math.PI / 2;
        if (axis === 'x') mesh.rotation.z = Math.PI / 2;
        return mesh;
    }
    ring(name: string, diameter: number, thickness: number, material: Material, x: number, y: number, z: number, axis: 'x' | 'y' | 'z' = 'y') {
        const mesh = this.place(MeshBuilder.CreateTorus(name, { diameter, thickness, tessellation: 32 }, this.scene), material, x, y, z);
        if (axis === 'z') mesh.rotation.x = Math.PI / 2;
        if (axis === 'x') mesh.rotation.z = Math.PI / 2;
        return mesh;
    }
    /** Closed loft with bevelled cross sections, supplying real sloped panels instead of stacked boxes. */
    loft(name: string, sections: Array<[number, number, number, number]>, material: Material) {
        const positions: number[] = [], indices: number[] = [], normals: number[] = [];
        for (const [z, width, bottom, top] of sections) {
            const bevel = Math.min((top - bottom) * 0.22, width * 0.1);
            const half = width / 2;
            for (const [x, y] of [[-half + bevel, bottom], [half - bevel, bottom], [half, bottom + bevel], [half, top - bevel], [half - bevel, top], [-half + bevel, top], [-half, top - bevel], [-half, bottom + bevel]]) positions.push(x, y, z);
        }
        for (let s = 0; s < sections.length - 1; s++) for (let i = 0; i < 8; i++) {
            const a = s * 8 + i, b = s * 8 + (i + 1) % 8, c = a + 8, d = b + 8;
            indices.push(a, b, c, b, d, c);
        }
        const last = (sections.length - 1) * 8;
        for (let i = 1; i < 7; i++) indices.push(0, i + 1, i, last, last + i, last + i + 1);
        // Babylon's left-handed front faces require the opposite winding to this section walk.
        for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
        VertexData.ComputeNormals(positions, indices, normals);
        const data = new VertexData(); data.positions = positions; data.indices = indices; data.normals = normals; data.uvs = positions.flatMap((_, i) => i % 3 === 0 ? [positions[i], positions[i + 2]] : []);
        const mesh = new Mesh(name, this.scene); data.applyToMesh(mesh); mesh.convertToFlatShadedMesh();
        return this.place(mesh, material, 0, 0, 0);
    }
    /** A hollow machined tube with a visible inner wall and annular muzzle. */
    bore(name: string, radius: number, length: number, material: Material, x: number, y: number, z: number) {
        const inner = radius * 0.72;
        const shape = [new Vector3(inner, -length / 2), new Vector3(radius, -length / 2), new Vector3(radius, length / 2), new Vector3(inner, length / 2), new Vector3(inner, -length / 2)];
        const mesh = this.place(MeshBuilder.CreateLathe(name, { shape, tessellation: 24, sideOrientation: Mesh.DOUBLESIDE }, this.scene), material, x, y, z);
        mesh.rotation.x = Math.PI / 2;
        return mesh;
    }
    /** Merge static detail by material; retain named muzzle meshes for gameplay discovery. */
    compact() {
        const groups = new Map<Material, Mesh[]>();

        // Direct children share this articulation frame. Descendant-wide or
        // scene-wide merges would bake wheels and turret pieces into world space.
        for (const child of this.parent.getChildMeshes(true)) {
            if (!(child instanceof Mesh) || !child.material || ['barrel', 'cannon'].includes(child.name) || child.getTotalVertices() === 0) continue;
            const group = groups.get(child.material) ?? [];
            group.push(child);
            groups.set(child.material, group);
        }

        for (const [material, meshes] of groups) {
            if (meshes.length < 2) continue;
            meshes.forEach(mesh => mesh.computeWorldMatrix(true));
            const merged = Mesh.MergeMeshes(meshes, true, true, undefined, false, false);
            if (!merged) continue;
            merged.name = `detail_${material.name}`;
            merged.setParent(this.parent);
            merged.isPickable = false;
        }
    }
}
