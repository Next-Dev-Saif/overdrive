import { Scene, Vector3 } from "@babylonjs/core";

export class SoundManager {
    private static instance: SoundManager;
    private scene: Scene | null = null;
    
    private audioCtx: AudioContext;
    private masterGain: GainNode;
    private volume = 1;

    /** Session master gain controls all WebAudio sources and the streaming music element. */
    public getVolume() { return this.volume; }
    public setVolume(value: number) {
        this.volume = Math.max(0, Math.min(1, value));
        this.masterGain.gain.value = this.volume;
        if (this.bgmAudio) this.bgmAudio.volume = 0.15 * this.volume;
    }

    // Buffers for zero-latency playback
    private buffers: Map<string, AudioBuffer> = new Map();

    // BGM
    private bgmAudio: HTMLAudioElement | null = null;

    // Procedural Engine Noise
    private engineNoiseNode: AudioBufferSourceNode | null = null;
    private engineGainNode: GainNode | null = null;

    private constructor() {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.audioCtx.destination);

        // Auto-resume audio context on user interaction (fixes browser autoplay policies)
        const resumeAudio = () => {
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('keydown', resumeAudio);
        };
        window.addEventListener('click', resumeAudio);
        window.addEventListener('keydown', resumeAudio);

        this.loadUiSounds();
        this.loadBattleSounds();
        this.setupAudioEventHooks();
        this.buildProceduralEngine();
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private async loadAudioBuffer(name: string, url: string) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
            this.buffers.set(name, audioBuffer);
        } catch (error) {
            console.error(`Failed to load audio: ${name} from ${url}`, error);
        }
    }

    private loadUiSounds() {
        this.loadAudioBuffer("ui_hover", "/assets/audio/sfx/hover.mp3");
        this.loadAudioBuffer("ui_select", "/assets/audio/sfx/select.mp3");
        this.loadAudioBuffer("ui_deselect", "/assets/audio/sfx/deselect.mp3");
    }

    private loadBattleSounds() {
        // Minigun (heavy metal impacts for ballistic punch)
        this.loadAudioBuffer("gunshot_1", "/assets/audio/sfx/scifi/Audio/impactMetal_000.ogg");
        this.loadAudioBuffer("gunshot_2", "/assets/audio/sfx/scifi/Audio/impactMetal_001.ogg");
        this.loadAudioBuffer("gunshot_3", "/assets/audio/sfx/scifi/Audio/impactMetal_002.ogg");
        this.loadAudioBuffer("gunshot_4", "/assets/audio/sfx/scifi/Audio/impactMetal_003.ogg");

        // Explosions (real explosion crunches)
        this.loadAudioBuffer("explosion_1", "/assets/audio/sfx/scifi/Audio/explosionCrunch_000.ogg");
        this.loadAudioBuffer("explosion_2", "/assets/audio/sfx/scifi/Audio/explosionCrunch_001.ogg");
        this.loadAudioBuffer("explosion_3", "/assets/audio/sfx/scifi/Audio/explosionCrunch_002.ogg");
        this.loadAudioBuffer("explosion_4", "/assets/audio/sfx/scifi/Audio/lowFrequency_explosion_000.ogg");

        // Plasma (heavy lasers)
        this.loadAudioBuffer("plasma_1", "/assets/audio/sfx/scifi/Audio/laserLarge_000.ogg");
        this.loadAudioBuffer("plasma_2", "/assets/audio/sfx/scifi/Audio/laserLarge_001.ogg");
        this.loadAudioBuffer("plasma_3", "/assets/audio/sfx/scifi/Audio/laserLarge_002.ogg");
        this.loadAudioBuffer("plasma_4", "/assets/audio/sfx/scifi/Audio/laserLarge_003.ogg");

        // Missiles (rocket engines launching)
        this.loadAudioBuffer("missile_1", "/assets/audio/sfx/scifi/Audio/spaceEngineSmall_000.ogg");
        this.loadAudioBuffer("missile_2", "/assets/audio/sfx/scifi/Audio/spaceEngineSmall_001.ogg");
        this.loadAudioBuffer("missile_3", "/assets/audio/sfx/scifi/Audio/spaceEngineSmall_002.ogg");

        // Abilities (forcefield hums)
        this.loadAudioBuffer("ability_wave", "/assets/audio/sfx/scifi/Audio/forceField_000.ogg");

        // Engine (steady large engine)
        this.loadAudioBuffer("engine", "/assets/audio/sfx/scifi/Audio/spaceEngineLarge_000.ogg");
    }

    public init(scene: Scene) {
        this.scene = scene;
        
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // Initialize Background Music (Streaming via HTML5 Audio)
        if (!this.bgmAudio) {
            this.bgmAudio = new Audio("/assets/audio/bgm/8.12.mp3");
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = 0.15 * this.volume;
            this.bgmAudio.play().catch(e => console.warn("BGM autoplay prevented:", e));
        } else {
            this.bgmAudio.play().catch(() => {});
        }
    }

    private playBuffer(name: string, volume: number = 1.0, position?: Vector3, pitchShift?: number) {
        const buffer = this.buffers.get(name);
        if (!buffer || this.audioCtx.state === 'suspended') return;

        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        
        if (pitchShift) {
            source.playbackRate.value = pitchShift;
        }

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = volume;

        if (position && this.scene && this.scene.activeCamera) {
            // Very simple spatial audio
            const panner = this.audioCtx.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 5;
            panner.maxDistance = 300;
            panner.rolloffFactor = 1;
            
            panner.positionX.value = position.x;
            panner.positionY.value = position.y;
            panner.positionZ.value = position.z;

            // Sync listener with camera
            const listener = this.audioCtx.listener;
            const cam = this.scene.activeCamera;
            if (listener.positionX) {
                listener.positionX.value = cam.position.x;
                listener.positionY.value = cam.position.y;
                listener.positionZ.value = cam.position.z;
                
                const forward = cam.getDirection(Vector3.Forward());
                listener.forwardX.value = forward.x;
                listener.forwardY.value = forward.y;
                listener.forwardZ.value = forward.z;
            }

            source.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(this.masterGain);
        } else {
            source.connect(gainNode);
            gainNode.connect(this.masterGain);
        }

        source.start(0);
    }

    // --- UI Audio ---
    private setupAudioEventHooks() {
        window.addEventListener('play-ui-hover', () => this.playBuffer("ui_hover", 0.3));
        window.addEventListener('play-ui-select', () => this.playBuffer("ui_select", 0.6));
        window.addEventListener('play-ui-deselect', () => this.playBuffer("ui_deselect", 0.6));
    }

    // --- Battle Audio ---
    public playGunshot(position: Vector3) {
        const variant = Math.floor(Math.random() * 4) + 1; // 1 to 4
        this.playBuffer(`gunshot_${variant}`, 0.5, position);
    }

    public playExplosion(position: Vector3) {
        // Random pitch for variety
        const pitch = 0.8 + Math.random() * 0.4;
        const variant = Math.floor(Math.random() * 4) + 1; // 1 to 4
        this.playBuffer(`explosion_${variant}`, 0.8, position, pitch);
    }

    public playProceduralPlasma(position: Vector3) {
        const variant = Math.floor(Math.random() * 4) + 1; // 1 to 4
        this.playBuffer(`plasma_${variant}`, 0.6, position);
    }
    
    public playProceduralMissile(position: Vector3) {
        const variant = Math.floor(Math.random() * 3) + 1; // 1 to 3
        this.playBuffer(`missile_${variant}`, 0.7, position);
    }

    // --- Procedural Engine Noise ---
    private buildProceduralEngine() {
        const ctx = this.audioCtx;
        
        this.engineGainNode = ctx.createGain();
        this.engineGainNode.gain.value = 0;
        this.engineGainNode.connect(this.masterGain);

        // We will start the buffer source once it's loaded, 
        // polling until the buffer exists
        const checkBuffer = setInterval(() => {
            const buffer = this.buffers.get("engine");
            if (buffer) {
                clearInterval(checkBuffer);
                this.engineNoiseNode = ctx.createBufferSource();
                this.engineNoiseNode.buffer = buffer;
                this.engineNoiseNode.loop = true;
                this.engineNoiseNode.connect(this.engineGainNode!);
                this.engineNoiseNode.start();
            }
        }, 200);
    }

    public updateEngineSound(speedKmH: number, isAccelerating: boolean) {
        if (!this.engineGainNode || !this.engineNoiseNode) return;
        
        const targetVol = isAccelerating || Math.abs(speedKmH) > 5 ? 0.3 : 0.05;
        this.engineGainNode.gain.setTargetAtTime(targetVol, this.audioCtx.currentTime, 0.2);

        // Pitch shift the engine loop based on speed
        // Assuming base sample sounds like it's idling. 
        // 1.0 = idle, up to 3.0 at max speed
        const targetPitch = Math.max(0.8, 1.0 + (Math.abs(speedKmH) / 60));
        this.engineNoiseNode.playbackRate.setTargetAtTime(targetPitch, this.audioCtx.currentTime, 0.1);
    }

    public stopEngineSound() {
        if (!this.engineGainNode) return;
        this.engineGainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.1);
    }

    public cleanup() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
        this.stopEngineSound();
    }
}
