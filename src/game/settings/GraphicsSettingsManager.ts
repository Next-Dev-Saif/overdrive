export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GraphicsConfig {
    shadowResolution: number;
    enableGlow: boolean;
    hardwareScalingLevel: number;
    particleLimitMultiplier: number;
}

export class GraphicsSettingsManager {
    private static instance: GraphicsSettingsManager;
    private currentQuality: GraphicsQuality = 'HIGH'; // default

    private constructor() {
        // Try to load from localStorage if available
        try {
            const saved = localStorage.getItem('graphics_quality');
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
            localStorage.setItem('graphics_quality', quality);
        } catch {}
        
        // Dispatch an event so the engine and UI can react
        window.dispatchEvent(new CustomEvent('graphics-settings-changed', { detail: { quality } }));
    }

    public getConfig(): GraphicsConfig {
        const dpr = window.devicePixelRatio || 1;
        switch (this.currentQuality) {
            case 'LOW':
                return {
                    shadowResolution: 0, // Disabled
                    enableGlow: false,
                    hardwareScalingLevel: 1 / dpr, // Keep native sharpness; reduce effects instead
                    particleLimitMultiplier: 0.0 // Disable non-essential particles
                };
            case 'MEDIUM':
                return {
                    shadowResolution: 512,
                    enableGlow: false,
                    hardwareScalingLevel: 1 / dpr, // Native device pixels
                    particleLimitMultiplier: 0.5
                };
            case 'HIGH':
            default:
                return {
                    shadowResolution: 2048,
                    enableGlow: true,
                    hardwareScalingLevel: 1 / dpr, // Native device pixels 
                    particleLimitMultiplier: 1.0
                };
        }
    }
}
