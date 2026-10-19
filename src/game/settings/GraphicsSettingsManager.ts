import type { Scene } from '@babylonjs/core';

export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GraphicsConfig {
    shadowResolution: number;
    enableGlow: boolean;
    hardwareScalingLevel: number;
    particleLimitMultiplier: number;
}

export class GraphicsSettingsManager {
    private static instance: GraphicsSettingsManager;
    private readonly windowsDesktop = isWindowsDesktop();
    private currentQuality: GraphicsQuality = this.windowsDesktop ? 'LOW' : 'HIGH';

    private constructor() {
        // Try to load from localStorage if available
        try {
            // Windows gets a fresh performance default; subsequent explicit choices persist.
            const saved = localStorage.getItem(isWindowsDesktop() ? 'graphics_quality_windows_v1' : 'graphics_quality');
            if (saved && ['LOW', 'MEDIUM', 'HIGH'].includes(saved)) {
                this.currentQuality = saved as GraphicsQuality;
            }
        } catch {
            // Ignore if localStorage is unavailable
        }
    }

    public static getInstance(): GraphicsSettingsManager {
        if (!GraphicsSettingsManager.instance) {
            GraphicsSettingsManager.instance = new GraphicsSettingsManager();
        }
        return GraphicsSettingsManager.instance;
    }

    public getQuality(): GraphicsQuality {
        return this.currentQuality;
    }

    public setQuality(quality: GraphicsQuality) {
        this.currentQuality = quality;
        try {
            localStorage.setItem(isWindowsDesktop() ? 'graphics_quality_windows_v1' : 'graphics_quality', quality);
        } catch {}
        
        // Dispatch an event so the engine and UI can react
        window.dispatchEvent(new CustomEvent('graphics-settings-changed', { detail: { quality } }));
    }

    public getConfig(): GraphicsConfig {
        const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
        const scaling = renderScaling(this.currentQuality, dpr, typeof window === 'undefined' ? 1280 : window.innerWidth, typeof window === 'undefined' ? 720 : window.innerHeight, isWindowsDesktop());
        switch (this.currentQuality) {
            case 'LOW':
                return {
                    shadowResolution: 0, // Disabled
                    enableGlow: false,
                    hardwareScalingLevel: scaling, // Platform render budget
                    particleLimitMultiplier: 0.0 // Disable non-essential particles
                };
            case 'MEDIUM':
                return {
                    shadowResolution: 512,
                    enableGlow: false,
                    hardwareScalingLevel: scaling, // Bounded Windows framebuffer; native pixels elsewhere
                    particleLimitMultiplier: 0.5
                };
            case 'HIGH':
            default:
                return {
                    shadowResolution: this.windowsDesktop ? 512 : 2048,
                    enableGlow: !this.windowsDesktop,
                    hardwareScalingLevel: scaling, // Bounded Windows framebuffer; native pixels elsewhere 
                    particleLimitMultiplier: this.windowsDesktop ? 0.5 : 1.0
                };
        }
    }
}

/** Platform is a default policy, never a claim about GPU capability. */
export function isWindowsDesktop(platform = typeof navigator === 'undefined' ? '' : navigator.platform, userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent): boolean {
    return /Win/i.test(platform) || /Windows NT/i.test(userAgent);
}

/** CSS canvas pixels divided by this scale produce a bounded drawing buffer. */
export function renderScaling(quality: GraphicsQuality, dpr: number, width: number, height: number, windows: boolean): number {
    if (!windows) return 1 / (dpr || 1);
    width = width || 1280; height = height || 720;
    const pixelRatio = 1; // Windows never renders above CSS pixel density.
    const budget = quality === 'LOW' ? 1280 * 720 : 1600 * 900;
    return Math.max(1 / pixelRatio, Math.sqrt(Math.max(1, width * height) / budget));
}

/** Sustained load changes resolution only; gameplay, telegraphs and DOM HUD stay intact. */
export function installAdaptiveResolution(scene: Scene): void {
    if (!isWindowsDesktop()) return;
    const engine = scene.getEngine();
    let elapsed = 0, frames = 0, warmup = 3000;
    let base = GraphicsSettingsManager.getInstance().getConfig().hardwareScalingLevel;
    const observer = scene.onAfterRenderObservable.add(() => {
        const dt = engine.getDeltaTime();
        if (typeof document !== 'undefined' && document.hidden || dt <= 0 || dt > 250) { elapsed = 0; frames = 0; return; }
        if (warmup > 0) { warmup -= dt; return; }
        const configured = GraphicsSettingsManager.getInstance().getConfig().hardwareScalingLevel;
        if (configured !== base) { base = configured; elapsed = 0; frames = 0; engine.setHardwareScalingLevel(base); }
        elapsed += dt; frames++;
        if (elapsed < 2000) return;
        const average = elapsed / frames;
        const current = engine.getHardwareScalingLevel();
        const next = average > 22 ? Math.min(base * 1.6, current * 1.12) : average < 17 ? Math.max(base, current / 1.06) : current;
        if (Math.abs(next - current) > 0.01) engine.setHardwareScalingLevel(next);
        elapsed = 0; frames = 0;
    });
    scene.onDisposeObservable.addOnce(() => scene.onAfterRenderObservable.remove(observer));
}
