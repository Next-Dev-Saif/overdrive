import { Scene, Vector3 } from "@babylonjs/core";
import { AUDIO_ASSETS, AUDIO_ASSET_ROOT } from "./AudioAssets";
import type { AudioCue } from "./AudioAssets";

export class SoundManager {
    private static instance: SoundManager;
    private scene: Scene | null = null;
    
    private audioCtx: AudioContext;
    private masterGain: GainNode;
    private volume = 1;
    private priorityVoices = new Set<AudioBufferSourceNode>();
    private voices = new Map<AudioBufferSourceNode, () => void>();

    /** Session master gain controls all WebAudio sources and the streaming music element. */
    public getVolume() { return this.volume; }
    public setVolume(value: number) {
        this.volume = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : this.volume;
        this.masterGain.gain.value = this.volume;
        if (this.bgmAudio) this.bgmAudio.volume = 0.15 * this.volume;
    }

    // Buffers for zero-latency playback
    private buffers: Map<string, AudioBuffer> = new Map();

    // BGM
    private bgmAudio: HTMLAudioElement | null = null;

    // Sample-based engine loop
    private engineNoiseNode: AudioBufferSourceNode | null = null;
    private engineGainNode: GainNode | null = null;

    private constructor() {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.audioCtx.destination);

        // Keep gesture retries available after an autoplay rejection or tab suspension.
        const resumeAudio = () => {
            if (this.audioCtx.state === 'suspended') {
                void this.audioCtx.resume().catch(error => console.warn('Audio resume failed:', error));
            }
            if (this.scene && this.bgmAudio?.paused) {
                void this.bgmAudio.play().catch(() => { /* Retry at the next gesture. */ });
            }
        };
        window.addEventListener('pointerdown', resumeAudio);
        window.addEventListener('keydown', resumeAudio);

        this.loadUiSounds();
        void this.loadBattleSounds();
        this.setupAudioEventHooks();

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
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
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

    private async loadBattleSounds() {
        await Promise.all(Object.entries(AUDIO_ASSETS).map(async ([name, file]) => {
            await this.loadAudioBuffer(name, AUDIO_ASSET_ROOT + file);
            if (name === 'engine') this.buildEngineLoop();
        }));
    }

    public init(scene: Scene) {
        this.scene = scene;
        
        if (this.audioCtx.state === 'suspended') {
            void this.audioCtx.resume().catch(error => console.warn('Audio resume failed:', error));
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

    private playBuffer(name: string, volume: number = 1.0, position?: Vector3, pitchShift?: number, priority = false): () => void {
        const buffer = this.buffers.get(name);
        const noSound = () => {};
        if (!buffer || this.audioCtx.state !== 'running' || this.volume === 0) return noSound;
        if (this.voices.size >= 32) {
            const expendable = [...this.voices.keys()].find(voice => !this.priorityVoices.has(voice));
            if (!priority || !expendable) return noSound;
            expendable.stop();
            this.voices.get(expendable)?.();
        }

        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        
        if (pitchShift) {
            source.playbackRate.value = pitchShift;
        }

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = volume;

        let panner: PannerNode | undefined;
        if (position && this.scene && this.scene.activeCamera) {
            // Very simple spatial audio
            panner = this.audioCtx.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = priority ? 20 : 5;
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

        const release = () => {
            source.disconnect(); gainNode.disconnect(); panner?.disconnect();
            this.voices.delete(source);
            this.priorityVoices.delete(source);
        };
        this.voices.set(source, release);
        source.onended = release;
        if (priority) this.priorityVoices.add(source);
        source.start(0);
        return () => {
            if (!this.voices.has(source)) return;
            source.stop(); release();
        };
    }

    // --- UI Audio ---
    private setupAudioEventHooks() {
        window.addEventListener('play-ui-hover', () => this.playBuffer("ui_hover", 0.3));
        window.addEventListener('play-ui-select', () => this.playBuffer("ui_select", 0.6));
        window.addEventListener('play-ui-deselect', () => this.playBuffer("ui_deselect", 0.6));
    }

    /** Shared weapon events cover local, bot and network presentation. */
    public playWeapon(weapon: string, position: Vector3) {
        const cue = weapon === 'minigun' ? 'gunshot' : weapon;
        if (cue in AUDIO_ASSETS) this.playBuffer(cue, cue === 'gunshot' ? 0.35 : cue === 'plasma' ? 0.95 : 0.55, position, 0.96 + Math.random() * 0.08);
    }

    public playGunshot(position: Vector3) { this.playWeapon('minigun', position); }
    public playProceduralPlasma(position: Vector3) { this.playWeapon('plasma', position); }
    public playProceduralMissile(position: Vector3) { this.playWeapon('missile', position); }
    public playExplosion(position: Vector3, weapon?: string) {
        this.playBuffer(weapon === 'nuke' ? 'nukeExplosion' : 'explosion', 0.7, position, 0.9 + Math.random() * 0.2);
    }
    public playDeath(position: Vector3) { this.playBuffer('death', 0.75, position); }
    public playPickup() { this.playBuffer('pickup', 0.45); }
    /** Local activation is listener-relative; distant opponents retain spatial cues. Returns cancellation. */
    public playAbility(ability: string, position: Vector3, localPlayer = false): () => void {
        if (ability in AUDIO_ASSETS) return this.playBuffer(ability as AudioCue, 0.95, localPlayer ? undefined : position, undefined, true);
        return () => {};
    }

    /** Start once after decoding; failed loads do not leave a polling timer alive. */
    private buildEngineLoop() {
        const buffer = this.buffers.get('engine');
        if (!buffer || this.engineNoiseNode) return;
        this.engineGainNode = this.audioCtx.createGain();
        this.engineGainNode.gain.value = 0;
        this.engineGainNode.connect(this.masterGain);
        this.engineNoiseNode = this.audioCtx.createBufferSource();
        this.engineNoiseNode.buffer = buffer;
        this.engineNoiseNode.loop = true;
        this.engineNoiseNode.connect(this.engineGainNode);
        this.engineNoiseNode.start();
    }

    public updateEngineSound(speedKmH: number, isAccelerating: boolean) {
        if (!this.scene || !this.engineGainNode || !this.engineNoiseNode) return;
        
        const targetVol = isAccelerating || Math.abs(speedKmH) > 5 ? 0.3 : 0.05;
        this.engineGainNode.gain.setTargetAtTime(targetVol, this.audioCtx.currentTime, 0.2);

        // Pitch shift the engine loop based on speed
        // Bound pitch to keep the V8 sample recognizable at racing speeds.
        const targetPitch = Math.min(2.4, Math.max(0.8, 0.8 + (Math.abs(speedKmH) / 100)));
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
        for (const [source, release] of this.voices) { source.stop(); release(); }
        this.scene = null;
    }
}
