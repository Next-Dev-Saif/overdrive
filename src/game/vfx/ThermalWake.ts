import { Color3, Mesh, MeshBuilder, StandardMaterial, Vector3, VertexData, type Scene } from '@babylonjs/core';
import { groundHeight } from '../levels/ArenaTerrain';
import { getVehicleChassisBounds } from '../models/VehicleBounds';

export const THERMAL_WAKE = { emissionMs: 1500, lifetimeMs: 5000, tickMs: 250, damage: 5, radius: 2.8, spacing: 3, maxPatches: 32 } as const;
export interface ThermalPatch { position: Vector3; born: number }

/** One hit per target per pulse, even at overlapping bends; elevated vehicles escape the heat. */
export function touchesThermalWake(position: Vector3, patches: readonly ThermalPatch[]): boolean {
    return patches.some(patch => Math.abs(position.y - patch.position.y) < 4 &&
        Math.hypot(position.x - patch.position.x, position.z - patch.position.z) <= THERMAL_WAKE.radius);
}

/** Shared local/bot/remote presentation. Only an owning controller supplies the damage callback. */
export function createThermalWake(scene: Scene, emitter: Mesh, onPulse?: (patches: readonly ThermalPatch[]) => void, isActive = () => true): () => void {
    const started = performance.now();
    let nextPulse = started + THERMAL_WAKE.tickMs;
    let last = emitter.getAbsolutePosition().clone();
    let disposed = false;
    const patches: ThermalPatch[] = [];
    const { size, center } = getVehicleChassisBounds(emitter);
    const material = new StandardMaterial('valkyrie-thermal-material', scene);
    material.disableLighting = true;
    material.emissiveColor = Color3.White();
    material.diffuseColor = Color3.Black();
    material.backFaceCulling = false;
    const wake = new Mesh('valkyrie-thermal-wake', scene);
    wake.material = material;
    wake.isPickable = false;
    wake.metadata = { presentationOnly: true };
    const jets: Mesh[] = [];
    for (const side of [-1, 1]) {
        for (const core of [false, true]) {
            const jet = MeshBuilder.CreateCylinder('valkyrie-twin-jet', {
                height: core ? 4 : 6, diameterTop: 0, diameterBottom: core ? .5 : 1.1, tessellation: 8,
            }, scene);
            jet.parent = emitter;
            jet.position.set(center.x + side * size.x * .32, center.y, center.z - size.z / 2 - (core ? 2 : 3));
            jet.rotation.x = -Math.PI / 2;
            jet.isPickable = false;
            jet.metadata = { presentationOnly: true };
            const jetMaterial = new StandardMaterial('valkyrie-jet-material', scene);
            jetMaterial.disableLighting = true;
            jetMaterial.emissiveColor = core ? new Color3(.8, 1, 1) : new Color3(.05, .55, 1);
            jet.material = jetMaterial;
            jets.push(jet);
        }
    }
    const addPatch = (point: Vector3, now: number) => {
        const ground = groundHeight(scene, point.x, point.z);
        // Do not paint heat through bridges or beneath an airborne/teleported vehicle.
        if (ground === null || point.y - ground > size.y / 2 + 2.5 || point.y < ground - .5) return;
        patches.push({ position: new Vector3(point.x, ground + .08, point.z), born: now });
        if (patches.length > THERMAL_WAKE.maxPatches) patches.shift();
    };
    addPatch(last, started);
    const dispose = () => {
        if (disposed) return;
        disposed = true;
        scene.onBeforeRenderObservable.removeCallback(update);
        scene.onDisposeObservable.removeCallback(dispose);
        emitter.onDisposeObservable.removeCallback(dispose);
        for (const jet of jets) { jet.material?.dispose(); jet.dispose(); }
        wake.dispose(); material.dispose();
        patches.length = 0;
    };
    const update = () => {
        const now = performance.now(), elapsed = now - started;
        if (emitter.isDisposed() || !isActive() || scene.metadata?.combatEnded || elapsed >= THERMAL_WAKE.emissionMs + THERMAL_WAKE.lifetimeMs) { dispose(); return; }
        if (elapsed <= THERMAL_WAKE.emissionMs) {
            const current = emitter.getAbsolutePosition();
            const distance = Vector3.Distance(last, current);
            if (distance > 20) last.copyFrom(current); // no fire corridor across network teleports
            else if (distance >= THERMAL_WAKE.spacing) {
                const steps = Math.floor(distance / THERMAL_WAKE.spacing);
                const direction = current.subtract(last).normalize();
                for (let step = 0; step < steps; step++) {
                    last.addInPlace(direction.scale(THERMAL_WAKE.spacing));
                    addPatch(last, now);
                }
            }
        }
        while (patches.length && now - patches[0].born >= THERMAL_WAKE.lifetimeMs) patches.shift();
        for (const jet of jets) {
            jet.setEnabled(elapsed < THERMAL_WAKE.emissionMs);
            jet.scaling.y = .9 + Math.sin(elapsed * .07) * .1;
        }
        if (now >= nextPulse) {
            nextPulse = now + THERMAL_WAKE.tickMs; // no catch-up damage burst after a stalled tab
            onPulse?.(patches);
        }
        // All ground embers and upright flame tongues share one draw call, even on LOW.
        const positions: number[] = [], indices: number[] = [], colors: number[] = [];
        const triangle = (a: number[], b: number[], c: number[], color: number[], alpha: number) => {
            const offset = positions.length / 3;
            positions.push(...a, ...b, ...c); indices.push(offset, offset + 1, offset + 2);
            for (let vertex = 0; vertex < 3; vertex++) colors.push(...color, alpha);
        };
        for (const [index, patch] of patches.entries()) {
            const { x, y, z } = patch.position;
            const alpha = Math.min(1, (THERMAL_WAKE.lifetimeMs - (now - patch.born)) / 1000);
            const r = THERMAL_WAKE.radius;
            triangle([x - r, y, z], [x, y, z - r], [x + r, y, z], [1, .18, .015], alpha * .75);
            triangle([x - r, y, z], [x + r, y, z], [x, y, z + r], [1, .18, .015], alpha * .75);
            const flicker = Math.sin(now * .018 + index * 2.4);
            for (const axis of [0, Math.PI / 2]) {
                const dx = Math.cos(axis) * 1.9, dz = Math.sin(axis) * 1.9;
                triangle([x - dx, y, z - dz], [x + dx, y, z + dz], [x + flicker * .3, y + 1.4 + flicker * .35, z], [1, .48, .06], alpha * .9);
            }
        }
        if (positions.length) {
            const data = new VertexData(); data.positions = positions; data.indices = indices; data.colors = colors;
            data.applyToMesh(wake, true); wake.hasVertexAlpha = true; wake.setEnabled(true);
        } else wake.setEnabled(false);
    };
    scene.onBeforeRenderObservable.add(update);
    scene.onDisposeObservable.add(dispose);
    emitter.onDisposeObservable.add(dispose);
    update();
    return dispose;
}
