import { Color3, Mesh } from '@babylonjs/core';
import { createAbilityVortex } from './AbilityVortex';
import { getVehicleChassisBounds } from '../models/VehicleBounds';
import { deployAbilityMechanism } from './AbilityMechanism';
import { GraphicsSettingsManager } from '../settings/GraphicsSettingsManager';

export { vortexPosition } from './AbilityVortex';

export const ABILITY_ACTIVATION_MS = 1100;
const COLORS: Record<string, Color3> = {
    lightning: new Color3(0.5, 0.85, 1), shockwave: new Color3(1, 0.5, 0.12),
    phantom: new Color3(0.65, 0.78, 0.85), manticore: new Color3(0.65, 0.8, 1),
    valkyrie: new Color3(1, 0.3, 0.08), wraith: new Color3(0.6, 0.8, 0.9),
    behemoth: new Color3(1, 0.78, 0.15),
};

/** A bounded, cancellable wind-up shared by local, bot and remote ability execution. */
export function playAbilityActivation(parent: Mesh, ability: string, onComplete: () => void, canComplete: () => boolean, onCancel?: () => void): () => void {
    const scene = parent.getScene();
    const { center, size } = getVehicleChassisBounds(parent);
    const multiplier = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
    // Keep a small activation cue on LOW; this telegraphs a delayed gameplay action.
    const count = Math.max(12, Math.round(48 * multiplier));
    const vortex = createAbilityVortex(parent, center, size, count, COLORS[ability] ?? COLORS.lightning);
    const start = performance.now();
    let finished = false;
    const valid = () => !scene.isDisposed && !parent.isDisposed() && !scene.metadata?.combatEnded && canComplete();
    const cancelMechanism = deployAbilityMechanism(parent, ability, center, size, ABILITY_ACTIVATION_MS, valid);
    const cleanup = (completed = false) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        scene.onBeforeRenderObservable.remove(observer);
        scene.onDisposeObservable.remove(sceneObserver);
        parent.onDisposeObservable.remove(parentObserver);
        vortex.dispose();
        if (!completed) { cancelMechanism(); onCancel?.(); }
    };
    const observer = scene.onBeforeRenderObservable.add(() => {
        if (!valid()) { cleanup(); return; }
        vortex.update(Math.min(1, (performance.now() - start) / ABILITY_ACTIVATION_MS));
    });
    const sceneObserver = scene.onDisposeObservable.add(() => cleanup());
    const parentObserver = parent.onDisposeObservable.add(() => cleanup());
    const timer = setTimeout(() => {
        if (finished) return;
        const execute = valid();
        cleanup(execute);
        if (execute) onComplete();
    }, ABILITY_ACTIVATION_MS);
    return () => { cleanup(); cancelMechanism(); };
}
