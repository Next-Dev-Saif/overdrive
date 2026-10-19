import { ModelBuilder } from '../models/ModelBuilder';
import { Mesh, MeshBuilder, TransformNode, Vector3 } from '@babylonjs/core';

const HOLD_MS: Record<string, number> = { lightning: 800, shockwave: 800, phantom: 8000, manticore: 1200, valkyrie: 5000, wraith: 1200, behemoth: 6000 };

/** Temporary chassis hardware: telescopes during charge, holds through discharge, then retracts. */
export function deployAbilityMechanism(parent: Mesh, ability: string, center: Vector3, size: Vector3, windupMs: number, valid: () => boolean): () => void {
    const scene = parent.getScene();
    const root = new TransformNode(`ability-mechanism-${ability}`, scene);
    root.parent = parent;
    root.position.copyFrom(center);
    const metal = ModelBuilder.steelSurface(scene);
    const trim = ModelBuilder.steelSurface(scene, true);
    const unit = Math.min(size.x / 3, size.z / 5);
    const moving: { node: TransformNode; direction: Vector3; travel: number; hinge: boolean }[] = [];
    const part = (name: string, node: TransformNode, dimensions: Vector3, position: Vector3, bright = false) => {
        const mesh = MeshBuilder.CreateBox(`ability-${name}`, { width: dimensions.x * unit, height: dimensions.y * unit, depth: dimensions.z * unit }, scene);
        mesh.parent = node;
        mesh.position.copyFrom(position.scale(unit));
        mesh.material = bright ? trim : metal;
        mesh.isPickable = false;
        mesh.checkCollisions = false;
        return mesh;
    };
    // Paired lower flank hardpoints stay below roof weapons and the Behemoth ladder.
    for (const side of [-1, 1]) {
        const anchor = new TransformNode('ability-hardpoint', scene);
        anchor.parent = root;
        anchor.position.set(side * size.x * 0.43, -size.y * 0.16, (ability === 'valkyrie' ? -0.43 : ability === 'lightning' ? 0.28 : -0.12) * size.z);
        part('socket', anchor, new Vector3(0.3, 0.3, 0.65), Vector3.Zero());
        const actuator = new TransformNode('ability-actuator', scene);
        actuator.parent = anchor;
        const rear = ability === 'valkyrie';
        moving.push({ node: actuator, direction: rear ? new Vector3(0, 0, -1) : new Vector3(side, 0, 0), travel: unit * 0.55, hinge: ability === 'phantom' || ability === 'behemoth' });
        part('piston', actuator, rear ? new Vector3(0.15, 0.15, 0.9) : new Vector3(0.9, 0.15, 0.15), Vector3.Zero(), true);
        if (rear) {
            const nozzle = MeshBuilder.CreateCylinder('ability-exhaust-nozzle', { diameter: unit * 0.5, height: unit * 0.7, tessellation: 12 }, scene);
            nozzle.parent = actuator; nozzle.rotation.x = Math.PI / 2; nozzle.material = metal; nozzle.isPickable = false;
            part('exhaust-fin', actuator, new Vector3(0.7, 0.08, 0.5), new Vector3(0, 0.22, 0));
        } else if (ability === 'phantom' || ability === 'behemoth') {
            part(ability === 'phantom' ? 'cloak-vane' : 'shield-projector', actuator, new Vector3(0.18, 0.85, 0.8), new Vector3(side * 0.25, 0.25, 0));
            part('projector-inlay', actuator, new Vector3(0.2, 0.55, 0.12), new Vector3(side * 0.26, 0.25, 0), true);
        } else if (ability === 'shockwave') {
            part('ram-housing', actuator, new Vector3(0.7, 0.45, 0.8), new Vector3(side * 0.3, 0, 0));
            part('impact-head', actuator, new Vector3(0.12, 0.55, 0.9), new Vector3(side * 0.7, 0, 0), true);
        } else {
            part('emitter-mast', actuator, new Vector3(0.16, 0.95, 0.16), new Vector3(side * 0.3, 0.35, 0), true);
            const coil = MeshBuilder.CreateTorus(`ability-${ability}-coil`, { diameter: unit * 0.55, thickness: unit * 0.1, tessellation: 12 }, scene);
            coil.parent = actuator; coil.position.set(side * unit * 0.3, unit * 0.55, 0); coil.material = trim; coil.isPickable = false;
            if (ability === 'wraith') coil.rotation.z = Math.PI / 2;
            if (ability === 'lightning') part('conductor-prong', actuator, new Vector3(0.12, 0.65, 0.12), new Vector3(side * 0.6, 0.55, 0), true);
        }
    }
    const start = performance.now();
    const retractAt = windupMs + (HOLD_MS[ability] ?? 800);
    let disposed = false;
    const cleanup = () => {
        if (disposed) return;
        disposed = true;
        clearTimeout(timer);
        scene.onBeforeRenderObservable.remove(observer);
        scene.onDisposeObservable.remove(sceneObserver);
        parent.onDisposeObservable.remove(parentObserver);
        root.dispose(); // Materials and maps are shared for the scene lifetime.
    };
    const observer = scene.onBeforeRenderObservable.add(() => {
        if (!valid()) { cleanup(); return; }
        const elapsed = performance.now() - start;
        const extension = Math.max(0, Math.min(1, elapsed / 450, (retractAt + 350 - elapsed) / 350));
        const eased = extension * extension * (3 - 2 * extension);
        for (const { node, direction, travel, hinge } of moving) {
            node.position.copyFrom(direction).scaleInPlace(travel * eased);
            if (hinge) node.rotation.z = -direction.x * eased * Math.PI / 6;
        }
    });
    const parentObserver = parent.onDisposeObservable.add(cleanup);
    const sceneObserver = scene.onDisposeObservable.add(cleanup);
    const timer = setTimeout(cleanup, retractAt + 350);
    return cleanup;
}
