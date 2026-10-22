import { Color3, Mesh, PBRMaterial, Scene, TransformNode, VertexData } from '@babylonjs/core';
import { WEAPON_GEOMETRY } from '../../assets/models/prepared/WeaponGeometry';

export type ImportedWeaponKind = keyof typeof WEAPON_GEOMETRY;
const templates = new WeakMap<Scene, Map<ImportedWeaponKind, Mesh[]>>();

/** Scene-owned immutable geometry survives synchronous race pickup swaps. */
export function buildImportedWeapon(pitch: Mesh, kind: ImportedWeaponKind): void {
    const scene = pitch.getScene();
    let cache = templates.get(scene);
    if (!cache) {
        cache = new Map();
        templates.set(scene, cache);
        scene.onDisposeObservable.addOnce(() => templates.delete(scene));
    }
    let parts = cache.get(kind);
    if (!parts) {
        const materials = new Map<string, PBRMaterial>();
        parts = WEAPON_GEOMETRY[kind].parts.map((part, index) => {
            const template = new Mesh(`${kind}-weapon-template-${index}`, scene);
            const data = new VertexData();
            data.positions = part.positions;
            data.normals = part.normals;
            data.indices = part.indices;
            data.applyToMesh(template);
            let material = materials.get(part.surface);
            if (!material) {
                material = new PBRMaterial(`${kind}-imported-${part.surface}`, scene);
                material.albedoColor = Color3.FromHexString(part.surface === 'alloy' ? '#77848d' : part.surface === 'accent' ? '#c39d54' : '#414e59');
                material.metallic = .55;
                material.roughness = .38;
                material.metadata = { sceneOwnedHardware: true };
                materials.set(part.surface, material);
            }
            template.material = material;
            template.isPickable = false;
            template.setEnabled(false);
            return template;
        });
        cache.set(kind, parts);
    }
    for (const template of parts) {
        const mesh = template.clone('barrel', pitch, true);
        mesh.setEnabled(true);
        mesh.isPickable = true;
        mesh.receiveShadows = true;
        mesh.metadata = { importedWeapon: kind };
    }
    for (const position of WEAPON_GEOMETRY[kind].muzzles) {
        const socket = new TransformNode('muzzle_socket', scene);
        socket.parent = pitch;
        socket.position.set(position[0], position[1], position[2]);
    }
}
