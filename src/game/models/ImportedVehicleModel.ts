import {
    AssetContainer,
    Color3,
    Mesh,
    PBRMaterial,
    Ray,
    Scene,
    TransformNode,
    Vector3,
} from '@babylonjs/core';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';
import coupeModelUrl from '../../assets/models/prepared/muscle-coupe.glb?url';
import suvModelUrl from '../../assets/models/prepared/armored-suv.glb?url';
import type { ChassisDimensions } from './VehicleModel';
import { buildVehicleWeapons, WEAPON_ATTACHMENTS } from './WeaponAttachments';
import { buildVehicleStyle, type VehicleStyle } from './VehicleStyle';

interface ImportedVehicleConfig {
    url: string;
    style: VehicleStyle;
    scaleMultiplier: number;
}

const IMPORTED_VEHICLES: Record<string, ImportedVehicleConfig> = {
    interceptor: { url: coupeModelUrl, style: 'muscle', scaleMultiplier: 1.35 },
    juggernaut: { url: suvModelUrl, style: 'armored', scaleMultiplier: 1.45 },
    phantom: { url: coupeModelUrl, style: 'track', scaleMultiplier: 1.25 },
    manticore: { url: suvModelUrl, style: 'expedition', scaleMultiplier: 1.4 },
    valkyrie: { url: coupeModelUrl, style: 'track', scaleMultiplier: 1.35 },
    wraith: { url: coupeModelUrl, style: 'muscle', scaleMultiplier: 1.55 },
    behemoth: { url: suvModelUrl, style: 'armored', scaleMultiplier: 2.1 },
};

const containerCache = new WeakMap<Scene, Map<string, Promise<AssetContainer>>>();
let instanceSerial = 0;

function loadContainer(scene: Scene, url: string): Promise<AssetContainer> {
    let sceneCache = containerCache.get(scene);
    if (!sceneCache) {
        sceneCache = new Map();
        containerCache.set(scene, sceneCache);
    }

    let pending = sceneCache.get(url);
    if (!pending) {
        pending = LoadAssetContainerAsync(url, scene);
        sceneCache.set(url, pending);
        pending.catch(() => sceneCache?.delete(url));
    }
    return pending;
}

function collectMeshes(nodes: TransformNode[]): Mesh[] {
    const meshes = new Set<Mesh>();
    for (const node of nodes) {
        if (node instanceof Mesh) meshes.add(node);
        for (const child of node.getChildMeshes(false)) {
            if (child instanceof Mesh) meshes.add(child);
        }
    }
    return [...meshes];
}

function calculateBounds(meshes: Mesh[]): { minimum: Vector3; maximum: Vector3 } {
    const minimum = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    const maximum = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

    for (const mesh of meshes) {
        if (mesh.getTotalVertices() === 0) continue;
        mesh.computeWorldMatrix(true);
        const bounds = mesh.getBoundingInfo().boundingBox;
        minimum.minimizeInPlace(bounds.minimumWorld);
        maximum.maximizeInPlace(bounds.maximumWorld);
    }

    if (!Number.isFinite(minimum.x) || !Number.isFinite(maximum.x)) {
        throw new Error('Imported vehicle has no usable mesh bounds.');
    }
    return { minimum, maximum };
}

function wheelIndex(name: string): number | undefined {
    const value = name.toLowerCase();
    if (value.includes('front right')) return 0;
    if (value.includes('front left')) return 1;
    if (value.includes('rear right')) return 2;
    if (value.includes('rear left')) return 3;
    return undefined;
}

function buildWheelPivots(visualRoot: TransformNode, meshes: Mesh[]): void {
    const wheelGroups = new Map<number, Mesh[]>();
    for (const mesh of meshes) {
        const index = wheelIndex(mesh.name);
        if (index === undefined) continue;
        const group = wheelGroups.get(index) ?? [];
        group.push(mesh);
        wheelGroups.set(index, group);
    }

    if (wheelGroups.size !== 4) {
        throw new Error(`Imported vehicle exposes ${wheelGroups.size} wheel corners instead of four.`);
    }

    for (let index = 0; index < 4; index++) {
        const group = wheelGroups.get(index);
        if (!group?.length) throw new Error(`Imported vehicle is missing wheel corner ${index}.`);
        const bounds = calculateBounds(group);
        const center = bounds.minimum.add(bounds.maximum).scale(0.5);
        const pivot = new TransformNode(`wheelPivot${index}`, visualRoot.getScene());
        pivot.parent = visualRoot;
        pivot.setAbsolutePosition(center);
        // Controllers animate the node named "wheel" and deliberately clear its
        // quaternion. Keep the GLB conversion transforms on unnamed child parts
        // so steering/spin cannot erase their imported orientation.
        const wheel = new Mesh(`wheel${index}`, visualRoot.getScene());
        wheel.parent = pivot;
        for (const wheelMesh of group) {
            const isTire = wheelMesh.name.toLowerCase().includes('tire');
            wheelMesh.name = `${isTire ? 'importedTire' : 'importedRim'}${index}`;
            wheelMesh.setParent(wheel, true, true);
        }
    }
}

export function supportsImportedVehicle(vehicleId: string): boolean {
    return vehicleId in IMPORTED_VEHICLES;
}

/**
 * Instantiates a vetted vehicle GLB under the existing gameplay hierarchy.
 * Physics, controller discovery names, wheel steering and procedural weapons stay unchanged.
 */
export async function buildImportedVehicleModel(
    root: Mesh,
    scene: Scene,
    vehicleId: string,
    weaponId: string,
    chassisSize: ChassisDimensions,
    chassisColor: Color3,
    wheelScale: number,
): Promise<TransformNode> {
    const config = IMPORTED_VEHICLES[vehicleId];
    if (!config) throw new Error(`No imported vehicle is configured for ${vehicleId}.`);

    const container = await loadContainer(scene, config.url);
    if (scene.isDisposed || root.isDisposed()) throw new Error('Vehicle owner was disposed while loading.');
    const serial = instanceSerial++;
    const instance = container.instantiateModelsToScene(
        (sourceName) => `${vehicleId}_${serial}_${sourceName}`,
        true,
        { doNotInstantiate: true },
    );

    let visualRoot: TransformNode | undefined;
    try {
        const importedRoots = instance.rootNodes.filter((node): node is TransformNode => node instanceof TransformNode);
        const meshes = collectMeshes(importedRoots);

        for (const mesh of meshes) {
            const sourceName = mesh.name.toLowerCase();
            mesh.isPickable = true;
            mesh.receiveShadows = true;
            if (sourceName.endsWith('_paint') && mesh.material instanceof PBRMaterial) {
                mesh.material.albedoColor = chassisColor.clone();
                mesh.material.metallic = 0.42;
                mesh.material.roughness = 0.34;
                mesh.material.clearCoat.isEnabled = true;
                mesh.material.clearCoat.intensity = 0.55;
                mesh.material.clearCoat.roughness = 0.28;
            }
        }

        const visibleMeshes = meshes.filter((mesh) => mesh.isEnabled());
        // Measure while the clone is still at scene origin. Measuring after it is
        // parented to a spawned physics body would bake the spawn position into
        // the centering offset.
        const sourceBounds = calculateBounds(visibleMeshes);
        const sourceSize = sourceBounds.maximum.subtract(sourceBounds.minimum);
        const targetSize = new Vector3(
            chassisSize.width + 0.8 * wheelScale,
            chassisSize.height + 0.6 * wheelScale + 0.2,
            chassisSize.depth,
        );
        // Fit the footprint, not the old procedural cabin height: that height
        // crushed the coupe on Phantom/Wraith. Retain the established class sizes.
        const scale = Math.min(
            targetSize.x / sourceSize.x,
            targetSize.z / sourceSize.z,
        ) * config.scaleMultiplier;
        const sourceCenter = sourceBounds.minimum.add(sourceBounds.maximum).scale(0.5);

        // Sample the actual bonnet before parenting to a translated/rotated physics body.
        // Multiple points cover the mounting rails, rather than guessing from roof height.
        const profile = WEAPON_ATTACHMENTS[vehicleId];
        let bonnetY = sourceBounds.minimum.y;
        let sideAnchorWidth = sourceSize.x;
        if (profile.placement === 'bonnet') {
            for (const x of [-0.1, 0, 0.1]) for (const z of [-0.07, 0, 0.07]) {
                const ray = new Ray(new Vector3(
                    sourceCenter.x + sourceSize.x * x,
                    sourceBounds.maximum.y + 1,
                    sourceCenter.z + sourceSize.z * (profile.forward + z),
                ), Vector3.Down(), sourceSize.y + 2);
                for (const mesh of visibleMeshes) {
                    const hit = ray.intersectsMesh(mesh, false);
                    if (hit.hit && hit.pickedPoint) bonnetY = Math.max(bonnetY, hit.pickedPoint.y);
                }
            }
            if (bonnetY === sourceBounds.minimum.y) throw new Error(`No bonnet mounting surface found for ${vehicleId}.`);
        }

        if (profile.placement === 'sides') {
            // Mirrors and wheel arches widen the overall bounds. Reach the actual side
            // panel at the bracket's height so the outrigger does not float beside it.
            const contacts: number[] = [];
            for (const side of [-1, 1]) {
                const ray = new Ray(new Vector3(
                    sourceCenter.x + side * (sourceSize.x / 2 + 1),
                    sourceBounds.minimum.y + sourceSize.y * profile.elevation,
                    sourceCenter.z + sourceSize.z * profile.forward,
                ), new Vector3(-side, 0, 0), sourceSize.x + 2);
                let nearest = Number.POSITIVE_INFINITY;
                let contact: number | undefined;
                for (const mesh of visibleMeshes) {
                    const hit = ray.intersectsMesh(mesh, false);
                    if (hit.hit && hit.pickedPoint && hit.distance < nearest) {
                        nearest = hit.distance;
                        contact = Math.abs(hit.pickedPoint.x - sourceCenter.x);
                    }
                }
                if (contact !== undefined) contacts.push(contact);
            }
            if (contacts.length !== 2) throw new Error(`No side mounting panels found for ${vehicleId}.`);
            sideAnchorWidth = Math.min(...contacts) * 2;
        }

        visualRoot = new TransformNode('visualRoot', scene);
        visualRoot.parent = root;
        const chassisRoot = new TransformNode('chassisRoot', scene);
        chassisRoot.parent = visualRoot;
        const modelRoot = new TransformNode(`${vehicleId}_importedModel`, scene);
        modelRoot.parent = chassisRoot;
        for (const importedRoot of importedRoots) importedRoot.parent = modelRoot;

        modelRoot.scaling.setAll(scale);
        modelRoot.position.set(
            -sourceCenter.x * scale,
            -targetSize.y / 2 - sourceBounds.minimum.y * scale,
            -sourceCenter.z * scale,
        );

        for (const mesh of visibleMeshes) mesh.computeWorldMatrix(true);
        buildWheelPivots(visualRoot, visibleMeshes);

        const envelope = {
            width: sourceSize.x * scale,
            height: sourceSize.y * scale,
            depth: sourceSize.z * scale,
            bottom: -targetSize.y / 2,
            sideAnchorWidth: sideAnchorWidth * scale,
            bonnetHeight: -targetSize.y / 2 + (bonnetY - sourceBounds.minimum.y) * scale,
        };
        buildVehicleStyle(chassisRoot, config.style, envelope);
        buildVehicleWeapons(chassisRoot, vehicleId, weaponId, envelope);

        return visualRoot;
    } catch (error) {
        // A failed fit must not leave a second half-built car beside the fallback.
        for (const node of instance.rootNodes) {
            if (node instanceof TransformNode) node.dispose(false, true);
        }
        visualRoot?.dispose(false, true);
        instance.dispose();
        throw error;
    }
}
