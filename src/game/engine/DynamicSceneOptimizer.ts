import {
    HardwareScalingOptimization,
    MergeMeshesOptimization,
    ParticlesOptimization,
    SceneOptimizerOptions,
} from '@babylonjs/core/Misc/sceneOptimizer';
import type { GraphicsQuality } from '../settings/GraphicsSettingsManager';

/**
 * Keeps articulated vehicles and gameplay particle telegraphs intact during adaptation.
 *
 * Vehicle wheels and weapon mounts are articulated children of a moving physics
 * root. The global merge bakes those children into world space and disposes the
 * source meshes, so the vehicle appears to shed parts as soon as it moves.
 */
export function createDynamicSceneOptimizerOptions(quality: GraphicsQuality): SceneOptimizerOptions {
    const options = quality === 'LOW'
        ? SceneOptimizerOptions.HighDegradationAllowed()
        : SceneOptimizerOptions.ModerateDegradationAllowed();

    options.optimizations = options.optimizations.filter(
        // Resolution is managed separately by the bounded frame-time controller.
        // Particle density is already tiered by GraphicsSettingsManager. A global
        // shutdown permanently hides ability telegraphs after the first FPS dip.
        optimization => !(optimization instanceof HardwareScalingOptimization) && !(optimization instanceof MergeMeshesOptimization) && !(optimization instanceof ParticlesOptimization),
    );

    return options;
}
