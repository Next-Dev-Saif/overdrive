import { Color3, Mesh, Scene, StandardMaterial, TransformNode, VertexData } from '@babylonjs/core';
import { PROJECTILE_GEOMETRY } from '../../assets/models/prepared/ProjectileGeometry';

export type ProjectileKind = keyof typeof PROJECTILE_GEOMETRY;
/** Dimensions match the baked OBJ geometry; all noses point along local +Z. */
export const PROJECTILE_PROFILES = {
    missile: { length: 1.8, glow: 0.25, halo: 0.65, color: new Color3(0.66, 0.72, 0.76) },
    mortar: { length: 1.25, glow: 0.22, halo: 0.55, color: new Color3(0.48, 0.54, 0.29) },
    nuke: { length: 3, glow: 0.55, halo: 1.2, color: new Color3(0.74, 0.62, 0.3) },
} as const;
const templates = new WeakMap<Scene, Map<ProjectileKind, Mesh>>();

/** Each scene owns one geometry/material per kind; pooled shots share those GPU resources. */
export function createProjectileModel(scene: Scene, kind: ProjectileKind): TransformNode {
    let cache = templates.get(scene);
    if (!cache) {
        cache = new Map();
        templates.set(scene, cache);
        scene.onDisposeObservable.addOnce(() => templates.delete(scene));
    }
    let template = cache.get(kind);
    if (!template) {
        template = new Mesh(`${kind}-projectile-template`, scene);
        const data = new VertexData();
        Object.assign(data, PROJECTILE_GEOMETRY[kind]);
        data.applyToMesh(template);
        const material = new StandardMaterial(`${kind}-projectile-shell`, scene);
        material.diffuseColor = PROJECTILE_PROFILES[kind].color;
        material.specularColor = new Color3(0.4, 0.4, 0.4);
        material.specularPower = 48;
        material.emissiveColor = material.diffuseColor.scale(0.16);
        template.material = material;
        template.isPickable = false;
        template.metadata = { presentationOnly: true };
        template.setEnabled(false);
        cache.set(kind, template);
    }
    const root = new TransformNode(`${kind}-projectile`, scene);
    const shell = template.clone(`${kind}-projectile-shell`, root, true);
    shell.setEnabled(true);
    shell.isPickable = false;
    shell.metadata = { presentationOnly: true };
    return root;
}
