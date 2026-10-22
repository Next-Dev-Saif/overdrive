import { createThermalWake, type ThermalPatch } from './ThermalWake';
import { createExplosionAftermath } from './ExplosionAftermath';
import { electricSurface } from './ElectricSurface';
import { Scene, Vector3, ParticleSystem, Texture, RawTexture, Color4, Color3, PointLight, Mesh, MeshBuilder, StandardMaterial, Animation, FresnelParameters } from "@babylonjs/core";
import { GraphicsSettingsManager } from "../settings/GraphicsSettingsManager";
import { VFX_SPRITE_SHEETS, type VfxSpriteSheetId } from './VfxAssets';

export type WeaponVfxKind = 'minigun' | 'plasma' | 'missile' | 'mortar' | 'nuke';
export type ProjectileVfxKind = 'missile' | 'mortar' | 'nuke';

export class VfxManager {
    private static instance: VfxManager;
    private scene: Scene;

    // Shared Textures
    private flareTexture: Texture;
    private smokeTexture: Texture;
    private fireTexture: Texture;
    private debrisTexture: Texture;
    private flipbookTextures = new Map<VfxSpriteSheetId, Texture>();

    // Object Pools
    private psPools: Map<string, ParticleSystem[]> = new Map();
    private activeTransientLights = new Set<PointLight>();

    private constructor(scene: Scene) {
        this.scene = scene;
        this.flareTexture = this.createParticleTexture('vfx-spark', (x, y) => {
            const radius = Math.hypot(x, y);
            const core = Math.max(0, 1 - radius * 2.8);
            const streak = Math.max(0, 1 - Math.abs(x) * 16) * Math.max(0, 1 - Math.abs(y) * 1.8);
            const cross = Math.max(0, 1 - Math.abs(y) * 18) * Math.max(0, 1 - Math.abs(x) * 2.2);
            const alpha = Math.min(1, core * core + streak * 0.6 + cross * 0.35);
            return [255, 238, 190, alpha * 255];
        });
        this.smokeTexture = this.createParticleTexture('vfx-smoke', (x, y) => {
            const angle = Math.atan2(y, x);
            const turbulence = Math.sin(angle * 5 + x * 8) * 0.08 + Math.sin(x * 13 - y * 9) * 0.06 + Math.cos(x * 21 + y * 17) * 0.035;
            const radius = Math.hypot(x, y) * (1.05 + turbulence);
            const softBody = Math.max(0, 1 - radius);
            const billow = 0.72 + 0.18 * Math.sin(x * 11 + y * 7) + 0.1 * Math.cos(x * 19 - y * 15);
            const alpha = Math.max(0, Math.min(1, softBody * softBody * billow));
            const shade = Math.round(190 + softBody * 55);
            return [shade, shade, shade, alpha * 255];
        });
        this.fireTexture = this.createParticleTexture('vfx-fire', (x, y) => {
            const vertical = (y + 1) * 0.5;
            const sway = Math.sin(vertical * 15) * 0.09 + Math.sin(vertical * 29) * 0.035;
            const width = 0.72 - vertical * 0.38;
            const shape = Math.hypot((x - sway) / Math.max(width, 0.18), (y + 0.12) / 1.05);
            const lick = Math.max(0, 1 - shape);
            const alpha = Math.pow(lick, 1.45);
            return [255, Math.round(120 + lick * 120), Math.round(25 + lick * 80), alpha * 255];
        });
        this.debrisTexture = this.createParticleTexture('vfx-debris', (x, y) => {
            const rotatedX = x * 0.88 + y * 0.28;
            const rotatedY = y * 0.92 - x * 0.22;
            const chip = Math.max(Math.abs(rotatedX) / 0.72, Math.abs(rotatedY) / 0.38);
            const chippedEdge = 1 + 0.08 * Math.sin((x + y) * 19) + 0.05 * Math.cos((x - y) * 27);
            const alpha = chip < chippedEdge ? Math.min(1, (chippedEdge - chip) * 8) : 0;
            const highlight = Math.max(0, 1 - Math.hypot(x + 0.2, y - 0.16) * 1.8);
            const shade = Math.round(72 + highlight * 95);
            return [shade, Math.round(shade * 0.82), Math.round(shade * 0.68), alpha * 255];
        });

        for (const id of Object.keys(VFX_SPRITE_SHEETS) as VfxSpriteSheetId[]) {
            const texture = new Texture(VFX_SPRITE_SHEETS[id].url, this.scene, false, false);
            texture.name = `vfx-${id}`;
            texture.hasAlpha = id !== 'fireball';
            texture.wrapU = Texture.CLAMP_ADDRESSMODE;
            texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this.flipbookTextures.set(id, texture);
        }
    }

    private createParticleTexture(name: string, sample: (x: number, y: number) => [number, number, number, number]): Texture {
        const size = 128;
        const pixels = new Uint8Array(size * size * 4);
        for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
            const x = (px / (size - 1)) * 2 - 1;
            const y = 1 - (py / (size - 1)) * 2;
            const [red, green, blue, alpha] = sample(x, y);
            const offset = (py * size + px) * 4;
            pixels[offset] = Math.max(0, Math.min(255, Math.round(red)));
            pixels[offset + 1] = Math.max(0, Math.min(255, Math.round(green)));
            pixels[offset + 2] = Math.max(0, Math.min(255, Math.round(blue)));
            pixels[offset + 3] = Math.max(0, Math.min(255, Math.round(alpha)));
        }
        const texture = RawTexture.CreateRGBATexture(pixels, size, size, this.scene, false, false, Texture.TRILINEAR_SAMPLINGMODE);
        texture.name = name;
        texture.hasAlpha = true;
        texture.wrapU = Texture.CLAMP_ADDRESSMODE;
        texture.wrapV = Texture.CLAMP_ADDRESSMODE;
        return texture;
    }

    private getPooledPS(name: string, capacity: number, setup: (ps: ParticleSystem) => void, animated = false): ParticleSystem {
        let pool = this.psPools.get(name);
        if (!pool) {
            pool = [];
            this.psPools.set(name, pool);
        }
        if (pool.length > 0) return pool.pop()!;
        
        const ps = new ParticleSystem(name, capacity, this.scene, undefined, animated);
        setup(ps);
        return ps;
    }

    /** Configures a pooled particle system to play one local sprite-sheet animation. */
    private configureFlipbook(ps: ParticleSystem, id: VfxSpriteSheetId): void {
        const definition = VFX_SPRITE_SHEETS[id];
        ps.particleTexture = this.flipbookTextures.get(id)!;
        ps.isAnimationSheetEnabled = true;
        ps.spriteCellWidth = definition.textureWidth / definition.columns;
        ps.spriteCellHeight = definition.textureHeight / definition.rows;
        ps.startSpriteCellID = 0;
        ps.endSpriteCellID = definition.frameCount - 1;
        ps.spriteCellLoop = false;
        ps.spriteRandomStartCell = false;
        ps.spriteCellChangeSpeed = 1;
    }

    public releasePS(name: string, ps: ParticleSystem, delayMs: number) {
        setTimeout(() => {
            if (this.scene.isDisposed) return;
            if (ps.isStarted()) ps.stop();
            ps.reset();
            this.psPools.get(name)!.push(ps);
        }, delayMs);
    }

    public static initialize(scene: Scene) {
        if (!VfxManager.instance || VfxManager.instance.scene !== scene || VfxManager.instance.scene.isDisposed) {
            VfxManager.instance?.dispose();
            VfxManager.instance = new VfxManager(scene);
        }
    }

    public static getInstance(): VfxManager {
        if (!VfxManager.instance) {
            throw new Error("VfxManager not initialized! Call initialize(scene) first.");
        }
        return VfxManager.instance;
    }

    public getSmokeTexture(): Texture { return this.smokeTexture; }
    public getFireTexture(): Texture { return this.fireTexture; }
    public getFlareTexture(): Texture { return this.flareTexture; }

    /** Creates a short-lived light while enforcing a scene-wide combat-light budget. */
    private createTransientLight(position: Vector3, color: Color3, intensity: number, range: number, durationMs: number): void {
        const quality = GraphicsSettingsManager.getInstance().getQuality();
        const limit = quality === 'HIGH' ? 6 : quality === 'MEDIUM' ? 2 : 0;
        if (limit === 0) return;

        if (this.activeTransientLights.size >= limit) {
            const oldest = this.activeTransientLights.values().next().value as PointLight | undefined;
            oldest?.dispose();
            if (oldest) this.activeTransientLights.delete(oldest);
        }

        const light = new PointLight('vfx-transient-light', position, this.scene);
        light.diffuse = color;
        light.intensity = intensity;
        light.range = range;
        this.activeTransientLights.add(light);

        const startedAt = performance.now();
        const fade = () => {
            const progress = Math.min(1, (performance.now() - startedAt) / durationMs);
            light.intensity = intensity * (1 - progress) * (1 - progress);
            if (progress < 1 && !light.isDisposed()) return;

            this.scene.onBeforeRenderObservable.removeCallback(fade);
            this.activeTransientLights.delete(light);
            light.dispose();
        };
        this.scene.onBeforeRenderObservable.add(fade);
    }

    private dispose(): void {
        this.psPools.forEach(pool => pool.forEach(system => system.dispose(false)));
        this.psPools.clear();
        this.activeTransientLights.forEach(light => light.dispose());
        this.activeTransientLights.clear();
        this.flareTexture.dispose();
        this.smokeTexture.dispose();
        this.fireTexture.dispose();
        this.debrisTexture.dispose();
        this.flipbookTextures.forEach(texture => texture.dispose());
        this.flipbookTextures.clear();
    }

    // ─── Weapon Impacts & Muzzle Flashes ─────────────────────────────────────

    public triggerImpact(position: Vector3, normal: Vector3, scale: number = 1.0, kind: WeaponVfxKind = 'minigun') {
        const pMult = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        if (pMult <= 0) return;
        const isPlasma = kind === 'plasma';

        // Sparks
        const sparks = this.getPooledPS("sparks", 50, (ps) => {
            ps.particleTexture = this.flareTexture;
            ps.blendMode = ParticleSystem.BLENDMODE_ADD; // Enforce additive
            ps.colorDead = new Color3(0.1, 0.1, 0.1).toColor4(0);
            ps.gravity = new Vector3(0, -20, 0);
        });
        sparks.color1 = isPlasma ? new Color4(0.75, 0.96, 1, 1) : new Color4(1, 0.8, 0.2, 1);
        sparks.color2 = isPlasma ? new Color4(0.08, 0.58, 1, 0.8) : new Color4(1, 0.4, 0.1, 0.8);
        sparks.gravity = isPlasma ? Vector3.Zero() : new Vector3(0, -20, 0);
        
        sparks.minSize = 0.05 * scale;
        sparks.maxSize = 0.2 * scale;
        sparks.minLifeTime = 0.1;
        sparks.maxLifeTime = 0.4;
        sparks.createPointEmitter(
            normal.add(new Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5))).normalize(),
            normal
        );
        sparks.minEmitPower = 10 * scale;
        sparks.maxEmitPower = 25 * scale;
        sparks.emitter = position.clone();
        sparks.manualEmitCount = Math.max(1, Math.round((isPlasma ? 28 : 20) * pMult));
        sparks.start();
        this.releasePS("sparks", sparks, 500);

        if (isPlasma) {
            const ring = MeshBuilder.CreateTorus('plasma-impact-ring', { diameter: 0.5, thickness: 0.08, tessellation: 24 }, this.scene);
            ring.position = position.add(normal.scale(0.04));
            ring.lookAt(position.add(normal));
            const ringMaterial = new StandardMaterial('plasma-impact-material', this.scene);
            ringMaterial.emissiveColor = new Color3(0.12, 0.72, 1);
            ringMaterial.disableLighting = true;
            ringMaterial.alpha = 0.9;
            ring.material = ringMaterial;

            const ringScale = new Animation('plasma-impact-scale', 'scaling', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
            ringScale.setKeys([{ frame: 0, value: Vector3.One() }, { frame: 12, value: new Vector3(7, 7, 7) }]);
            const ringFade = new Animation('plasma-impact-fade', 'material.alpha', 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            ringFade.setKeys([{ frame: 0, value: 0.9 }, { frame: 12, value: 0 }]);
            ring.animations = [ringScale, ringFade];
            this.scene.beginAnimation(ring, 0, 12, false, 1, () => {
                ring.dispose();
                ringMaterial.dispose();
            });
            this.createTransientLight(position, new Color3(0.08, 0.66, 1), 1.3, 8 * scale, 110);
            
            // Plasma Scorch Decal
            const scorch = MeshBuilder.CreatePlane('plasma-scorch', { size: 1.5 * scale }, this.scene);
            scorch.position = position.add(normal.scale(0.02));
            scorch.lookAt(position.add(normal));
            scorch.rotation.z = Math.random() * Math.PI; // random spin
            const scorchMat = new StandardMaterial('plasma-scorch-mat', this.scene);
            scorchMat.diffuseTexture = this.smokeTexture; // re-use smoke for alpha
            scorchMat.diffuseColor = new Color3(0.02, 0.1, 0.15); // dark cyan/black
            scorchMat.emissiveColor = new Color3(0.05, 0.2, 0.3);
            scorchMat.useAlphaFromDiffuseTexture = true;
            scorchMat.zOffset = -1;
            scorch.material = scorchMat;
            
            const scorchFade = new Animation('scorch-fade', 'visibility', 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
            scorchFade.setKeys([{ frame: 0, value: 0.8 }, { frame: 120, value: 0.8 }, { frame: 200, value: 0 }]);
            scorch.animations = [scorchFade];
            this.scene.beginAnimation(scorch, 0, 200, false, 1, () => { scorch.dispose(); scorchMat.dispose(); });

            return;
        }

        // Debris / Dust
        const dust = this.getPooledPS("dust", 20, (ps) => {
            ps.particleTexture = this.smokeTexture;
            ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
            ps.color1 = new Color4(0.34, 0.29, 0.24, 0.7);
            ps.color2 = new Color4(0.16, 0.14, 0.12, 0.35);
            ps.colorDead = new Color4(0, 0, 0, 0);
        });

        dust.minSize = 0.5 * scale;
        dust.maxSize = 1.0 * scale;
        dust.minLifeTime = 0.2;
        dust.maxLifeTime = 0.4;
        dust.createPointEmitter(normal, normal);
        dust.minEmitPower = 2;
        dust.maxEmitPower = 5;
        dust.emitter = position.clone();
        dust.manualEmitCount = Math.max(1, Math.round(5 * pMult));
        dust.start();
        this.releasePS("dust", dust, 700);
    }

    public triggerMuzzleFlash(position: Vector3, direction: Vector3, scale: number = 1.0, kind: WeaponVfxKind = 'minigun') {
        const pMult = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        if (pMult <= 0) return;
        const isPlasma = kind === 'plasma';

        // Star-shaped flash mesh
        const flashMesh = MeshBuilder.CreatePlane('muzzle-flash-mesh', { size: 1.5 * scale }, this.scene);
        flashMesh.position = position.add(direction.scale(0.5 * scale));
        flashMesh.lookAt(flashMesh.position.add(direction)); // face forward
        
        // Random spin
        flashMesh.rotation.z = Math.random() * Math.PI * 2;
        
        const flashMat = new StandardMaterial('muzzle-flash-mat', this.scene);
        flashMat.diffuseTexture = this.flareTexture; // Using flare for star-like center
        flashMat.emissiveColor = isPlasma ? new Color3(0.5, 0.9, 1) : new Color3(1, 0.8, 0.2);
        flashMat.disableLighting = true;
        flashMat.useAlphaFromDiffuseTexture = true;
        flashMesh.material = flashMat;

        // Flash scaling and fade animation
        const flashScaleAnim = new Animation('flash-scale', 'scaling', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        flashScaleAnim.setKeys([{ frame: 0, value: new Vector3(0.5, 0.5, 0.5) }, { frame: 2, value: new Vector3(1.5, 1.5, 1.5) }, { frame: 5, value: Vector3.Zero() }]);
        
        flashMesh.animations = [flashScaleAnim];
        this.scene.beginAnimation(flashMesh, 0, 5, false, 1, () => {
            flashMesh.dispose();
            flashMat.dispose();
        });

        // A short pressure puff gives larger guns weight without obscuring the muzzle.
        const smoke = this.getPooledPS("muzzleSmoke", 18, (ps) => {
            ps.particleTexture = this.smokeTexture;
            ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
            ps.colorDead = new Color4(0, 0, 0, 0);
        });
        smoke.color1 = isPlasma ? new Color4(0.18, 0.52, 0.68, 0.24) : new Color4(0.35, 0.32, 0.28, 0.42);
        smoke.color2 = isPlasma ? new Color4(0.04, 0.16, 0.26, 0.08) : new Color4(0.13, 0.12, 0.11, 0.18);
        smoke.minSize = 0.18 * scale;
        smoke.maxSize = 0.65 * scale;
        smoke.minLifeTime = 0.12;
        smoke.maxLifeTime = 0.32;
        smoke.createPointEmitter(direction.scale(0.75).add(new Vector3(-0.35, 0.15, -0.35)), direction.scale(1.15).add(new Vector3(0.35, 0.55, 0.35)));
        smoke.minEmitPower = 1.5 * scale;
        smoke.maxEmitPower = 4 * scale;
        smoke.emitter = position.clone();
        smoke.manualEmitCount = Math.max(2, Math.round(5 * scale * pMult));
        smoke.start();
        this.releasePS("muzzleSmoke", smoke, 500);

        if (!isPlasma) {
            // Brass casings ejecting
            const casing = this.getPooledPS("muzzleCasing", 5, (ps) => {
                ps.particleTexture = this.flareTexture; // Represent as small glowing quad
                ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
                ps.colorDead = new Color4(0.2, 0.1, 0, 0);
            });
            casing.color1 = new Color4(1, 0.7, 0.2, 1);
            casing.color2 = new Color4(0.8, 0.5, 0.1, 1);
            casing.minSize = 0.05;
            casing.maxSize = 0.08;
            casing.minLifeTime = 0.5;
            casing.maxLifeTime = 0.8;
            
            // Eject mostly sideways and slightly up/back
            const ejectDir = Vector3.Cross(direction, Vector3.Up()).normalize();
            casing.createPointEmitter(
                ejectDir.scale(0.8).add(new Vector3(0, 0.5, -0.2)),
                ejectDir.scale(1.5).add(new Vector3(0, 1.0, -0.5))
            );
            
            casing.minEmitPower = 2;
            casing.maxEmitPower = 5;
            casing.gravity = new Vector3(0, -9.8, 0);
            casing.emitter = position.clone();
            casing.manualEmitCount = 1; // 1 casing per shot
            casing.start();
            this.releasePS("muzzleCasing", casing, 800);
        }

        this.createTransientLight(
            position,
            isPlasma ? new Color3(0.08, 0.68, 1) : new Color3(1, 0.72, 0.2),
            1.5,
            10 * scale,
            70,
        );
    }

    // ─── Explosions (Replaces the primitive scaling spheres) ─────────────────

    public triggerExplosion(position: Vector3, radius: number, isNuke: boolean = false, kind?: ProjectileVfxKind) {
        if (isNuke || kind === 'mortar') createExplosionAftermath(this.scene, position, radius, isNuke, this.smokeTexture, GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier);
        const pMult = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;

        // 1. Initial Core Flash
        const flash = this.getPooledPS("expFlash", 10, (ps) => {
            ps.particleTexture = this.flareTexture;
            ps.blendMode = ParticleSystem.BLENDMODE_ADD; // Enforce additive
            ps.color1 = new Color4(1, 1, 1, 1);
            ps.color2 = new Color4(1, 0.9, 0.6, 0.8);
            ps.colorDead = new Color4(0, 0, 0, 0);
        });
        flash.minSize = radius * 0.8;
        flash.maxSize = radius * 1.5;
        flash.minLifeTime = 0.05;
        flash.maxLifeTime = 0.1;
        flash.emitter = position.clone();
        flash.createSphereEmitter(0.1);
        flash.manualEmitCount = 3;
        flash.start();
        this.releasePS("expFlash", flash, 200);

        // 2. Animated fireball and rolling smoke. One evolving flipbook particle
        // reads better and produces less overdraw than dozens of identical blobs.
        if (pMult > 0) {
            const explosionSheet: VfxSpriteSheetId = isNuke ? 'explosionLight' : 'explosion';
            const explosion = this.getPooledPS('explosionFlipbook', 2, ps => {
                this.configureFlipbook(ps, explosionSheet);
                ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
                ps.color1 = new Color4(1, 1, 1, 1);
                ps.color2 = new Color4(1, 1, 1, 1);
                ps.colorDead = new Color4(0, 0, 0, 0);
            }, true);
            this.configureFlipbook(explosion, explosionSheet);
            explosion.emitter = position.add(new Vector3(0, radius * 0.16, 0));
            explosion.minSize = radius * (isNuke ? 2.5 : 1.85);
            explosion.maxSize = explosion.minSize;
            explosion.minLifeTime = isNuke ? 2.8 : 1.15;
            explosion.maxLifeTime = explosion.minLifeTime;
            explosion.minEmitPower = 0;
            explosion.maxEmitPower = 0;
            explosion.manualEmitCount = 1;
            explosion.start();
            this.releasePS('explosionFlipbook', explosion, isNuke ? 3200 : 1450);

            if (GraphicsSettingsManager.getInstance().getQuality() === 'HIGH') {
                const core = this.getPooledPS('fireballFlipbook', 2, ps => {
                    this.configureFlipbook(ps, 'fireball');
                    ps.blendMode = ParticleSystem.BLENDMODE_ADD;
                    ps.color1 = new Color4(1, 0.8, 0.5, 0.82);
                    ps.color2 = new Color4(1, 0.45, 0.18, 0.72);
                    ps.colorDead = new Color4(0.2, 0.02, 0, 0);
                }, true);
                this.configureFlipbook(core, 'fireball');
                core.emitter = position.add(new Vector3(0, radius * 0.1, 0));
                core.minSize = radius * (isNuke ? 1.9 : 1.25);
                core.maxSize = core.minSize;
                core.minLifeTime = isNuke ? 1.2 : 0.48;
                core.maxLifeTime = core.minLifeTime;
                core.minEmitPower = 0;
                core.maxEmitPower = 0;
                core.manualEmitCount = 1;
                core.start();
                this.releasePS('fireballFlipbook', core, isNuke ? 1500 : 750);
            }
        }

        // 4. Physical Shockwave Ring (Visual mesh expanding)
        const shockwave = MeshBuilder.CreateTorus("shockRing", { diameter: radius * 0.2, thickness: radius * 0.05, tessellation: 32 }, this.scene);
        shockwave.position = position.clone();
        const mat = new StandardMaterial("shockMat", this.scene);
        mat.emissiveColor = new Color3(1, 0.8, 0.6);
        mat.alpha = 0.6;
        mat.disableLighting = true;
        shockwave.material = mat;

        const scaleAnim = new Animation("swScale", "scaling", 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        scaleAnim.setKeys([{ frame: 0, value: new Vector3(1, 1, 1) }, { frame: 30, value: new Vector3(10, 0.1, 10) }]);
        const alphaAnim = new Animation("swAlpha", "material.alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        alphaAnim.setKeys([{ frame: 0, value: 0.6 }, { frame: 20, value: 0 }]);
        
        shockwave.animations = [scaleAnim, alphaAnim];
        this.scene.beginAnimation(shockwave, 0, 30, false, 1.0, () => {
            shockwave.dispose();
            mat.dispose();
        });

        this.createTransientLight(
            position,
            new Color3(1, 0.52, 0.16),
            isNuke ? 6 : 2.5,
            radius * 3.5,
            isNuke ? 1100 : 320,
        );
    }

    /** Layered destruction used for full vehicles: flash, fireball, shrapnel, sparks and rolling smoke. */
    public triggerVehicleDestruction(position: Vector3, radius = 8): void {
        const pMult = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        this.triggerExplosion(position, radius, false);
        if (pMult <= 0) return;

        const debris = this.getPooledPS('vehicleDebris', 80, ps => {
            ps.particleTexture = this.debrisTexture;
            ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
            ps.color1 = new Color4(0.52, 0.38, 0.26, 1);
            ps.color2 = new Color4(0.16, 0.17, 0.18, 1);
            ps.colorDead = new Color4(0.05, 0.04, 0.03, 0);
            ps.gravity = new Vector3(0, -24, 0);
            ps.minAngularSpeed = -12;
            ps.maxAngularSpeed = 12;
        });
        debris.emitter = position.clone();
        debris.createSphereEmitter(0.8, 1);
        debris.minSize = 0.16;
        debris.maxSize = 0.7;
        debris.minLifeTime = 0.7;
        debris.maxLifeTime = 1.8;
        debris.minEmitPower = 10;
        debris.maxEmitPower = 30;
        debris.manualEmitCount = Math.round(34 * pMult);
        debris.start();
        this.releasePS('vehicleDebris', debris, 2100);

        const embers = this.getPooledPS('vehicleEmbers', 100, ps => {
            ps.particleTexture = this.flareTexture;
            ps.blendMode = ParticleSystem.BLENDMODE_ADD;
            ps.color1 = new Color4(1, 0.72, 0.22, 1);
            ps.color2 = new Color4(1, 0.16, 0.02, 0.85);
            ps.colorDead = new Color4(0.1, 0.02, 0, 0);
            ps.gravity = new Vector3(0, -11, 0);
        });
        embers.emitter = position.clone();
        embers.createSphereEmitter(1.2, 1);
        embers.minSize = 0.05;
        embers.maxSize = 0.18;
        embers.minLifeTime = 0.45;
        embers.maxLifeTime = 1.25;
        embers.minEmitPower = 13;
        embers.maxEmitPower = 34;
        embers.manualEmitCount = Math.round(48 * pMult);
        embers.start();
        this.releasePS('vehicleEmbers', embers, 1600);

        const wreckSmoke = this.getPooledPS('wreckSmoke', 90, ps => {
            ps.particleTexture = this.smokeTexture;
            ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
            ps.color1 = new Color4(0.2, 0.19, 0.18, 0.82);
            ps.color2 = new Color4(0.07, 0.07, 0.07, 0.55);
            ps.colorDead = new Color4(0.02, 0.02, 0.02, 0);
            ps.gravity = new Vector3(0, 5.5, 0);
        });
        wreckSmoke.emitter = position.clone();
        wreckSmoke.createSphereEmitter(1.8, 0.35);
        wreckSmoke.minSize = 1.8;
        wreckSmoke.maxSize = 5.5;
        wreckSmoke.minLifeTime = 1.2;
        wreckSmoke.maxLifeTime = 3.2;
        wreckSmoke.minEmitPower = 1;
        wreckSmoke.maxEmitPower = 5;
        wreckSmoke.manualEmitCount = Math.round(32 * pMult);
        wreckSmoke.start();
        this.releasePS('wreckSmoke', wreckSmoke, 3600);

        // A single animated smoke billow anchors the destruction silhouette while
        // the cheaper procedural particles provide lingering volume around it.
        const smokeBillow = this.getPooledPS('destructionSmokeFlipbook', 2, ps => {
            this.configureFlipbook(ps, 'discSmoke');
            ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
            ps.color1 = new Color4(0.72, 0.66, 0.6, 0.78);
            ps.color2 = new Color4(0.34, 0.31, 0.3, 0.62);
            ps.colorDead = new Color4(0.12, 0.12, 0.12, 0);
        }, true);
        this.configureFlipbook(smokeBillow, 'discSmoke');
        smokeBillow.emitter = position.add(new Vector3(0, radius * 0.35, 0));
        smokeBillow.minSize = radius * 2.2;
        smokeBillow.maxSize = smokeBillow.minSize;
        smokeBillow.minLifeTime = 2.4;
        smokeBillow.maxLifeTime = 2.4;
        smokeBillow.minEmitPower = 0;
        smokeBillow.maxEmitPower = 0;
        smokeBillow.manualEmitCount = 1;
        smokeBillow.start();
        this.releasePS('destructionSmokeFlipbook', smokeBillow, 2800);
    }

    // ─── Vehicle abilities ──────────────────────────────────────────────────

    private createExpandingRing(name: string, position: Vector3, radius: number, color: Color3, thickness: number, durationFrames: number): void {
        const ring = MeshBuilder.CreateTorus(name, { diameter: radius * 2, thickness, tessellation: 96 }, this.scene);
        ring.position.copyFrom(position);
        ring.position.y += 0.22;
        ring.scaling.setAll(0.025);
        const material = new StandardMaterial(`${name}-material`, this.scene);
        material.emissiveColor = color;
        material.diffuseColor = Color3.Black();
        material.disableLighting = true;
        material.alpha = 0.9;
        ring.material = material;

        const scale = new Animation(`${name}-scale`, 'scaling', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        scale.setKeys([{ frame: 0, value: new Vector3(0.025, 0.025, 0.025) }, { frame: durationFrames, value: Vector3.One() }]);
        const fade = new Animation(`${name}-fade`, 'material.alpha', 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        fade.setKeys([{ frame: 0, value: 0.95 }, { frame: durationFrames * 0.55, value: 0.7 }, { frame: durationFrames, value: 0 }]);
        ring.animations = [scale, fade];
        this.scene.beginAnimation(ring, 0, durationFrames, false, 1, () => {
            ring.dispose();
            material.dispose();
        });
    }

    private triggerShiningBurst(name: string, position: Vector3, color1: Color4, color2: Color4, baseCount: number, power: number): void {
        const multiplier = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        if (multiplier <= 0) return;
        const count = Math.max(16, Math.round(baseCount * multiplier));
        const burst = new ParticleSystem(name, count, this.scene);
        burst.particleTexture = this.flareTexture;
        burst.emitter = position.add(new Vector3(0, 1, 0));
        burst.createSphereEmitter(1.2, 1);
        burst.color1 = color1;
        burst.color2 = color2;
        burst.colorDead = new Color4(color2.r * 0.15, color2.g * 0.15, color2.b * 0.15, 0);
        burst.minSize = 0.08;
        burst.maxSize = 0.38;
        burst.minLifeTime = 0.22;
        burst.maxLifeTime = 0.72;
        burst.minEmitPower = power * 0.55;
        burst.maxEmitPower = power;
        burst.gravity = new Vector3(0, -4, 0);
        burst.minAngularSpeed = -7;
        burst.maxAngularSpeed = 7;
        burst.blendMode = ParticleSystem.BLENDMODE_ADD;
        burst.manualEmitCount = count;
        burst.start();
        setTimeout(() => burst.dispose(false), 1100);
    }

    /** Clean pressure wave: cool-white rims and ground dust, with no explosion/fire layer. */
    public triggerShockwave(position: Vector3, radius: number): void {
        // High-tech distortion sphere (glass-like shockwave)
        const shockSphere = MeshBuilder.CreateSphere('shockwave-distortion', { diameter: 2, segments: 32 }, this.scene);
        shockSphere.position = position.clone();
        
        const shockMat = new StandardMaterial('shockwave-mat', this.scene);
        shockMat.diffuseColor = Color3.Black();
        shockMat.emissiveColor = new Color3(0.5, 0.8, 1);
        shockMat.alpha = 0.15; // highly transparent
        shockMat.alphaMode = 1; // Engine.ALPHA_ADD
        shockMat.disableLighting = true;
        shockMat.opacityFresnelParameters = new FresnelParameters({
            leftColor: Color3.White(),
            rightColor: Color3.Black(),
            bias: 0.1,
            power: 2.0
        });
        shockSphere.material = shockMat;

        const sphereScale = new Animation('shock-scale', 'scaling', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        sphereScale.setKeys([{ frame: 0, value: Vector3.One() }, { frame: 25, value: new Vector3(radius, radius, radius) }]);
        const sphereAlpha = new Animation('shock-alpha', 'visibility', 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        sphereAlpha.setKeys([{ frame: 0, value: 1.0 }, { frame: 15, value: 0.5 }, { frame: 25, value: 0 }]);
        
        shockSphere.animations = [sphereScale, sphereAlpha];
        this.scene.beginAnimation(shockSphere, 0, 25, false, 1, () => {
            shockSphere.dispose();
            shockMat.dispose();
        });

        // Huge central light spike
        this.createTransientLight(position, new Color3(0.35, 0.62, 1), 5.0, radius * 1.5, 300);

        // Massive camera shake
        window.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 1.5, duration: 600 } }));

        const multiplier = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        if (multiplier <= 0) return;
        
        // Massive radial dirt explosion
        const count = Math.max(30, Math.round(150 * multiplier));
        const dust = new ParticleSystem('shockwave-ground-dust', count, this.scene);
        dust.particleTexture = this.smokeTexture;
        dust.emitter = position.clone();
        dust.createCylinderEmitter(radius * 0.2, 0.08, 1, 0); // Burst outward
        dust.color1 = new Color4(0.5, 0.45, 0.4, 0.5);
        dust.color2 = new Color4(0.2, 0.18, 0.15, 0.3);
        dust.colorDead = new Color4(0, 0, 0, 0);
        dust.minSize = 1.0;
        dust.maxSize = 3.5;
        dust.minLifeTime = 0.5;
        dust.maxLifeTime = 1.2;
        dust.minEmitPower = radius * 1.5;
        dust.maxEmitPower = radius * 2.5;
        dust.gravity = new Vector3(0, -3.0, 0); // Fast fall
        dust.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        dust.manualEmitCount = count;
        dust.start();
        setTimeout(() => dust.dispose(false), 1500);

        // Flying Debris Sparks
        const debrisCount = Math.max(10, Math.round(40 * multiplier));
        const debris = new ParticleSystem('shockwave-debris', debrisCount, this.scene);
        debris.particleTexture = this.flareTexture;
        debris.emitter = position.clone().add(new Vector3(0, 0.5, 0));
        debris.createSphereEmitter(1.5, 0.5);
        debris.color1 = new Color4(1, 0.8, 0.4, 1);
        debris.color2 = new Color4(1, 0.4, 0.1, 1);
        debris.colorDead = new Color4(0, 0, 0, 0);
        debris.minSize = 0.1;
        debris.maxSize = 0.4;
        debris.minLifeTime = 0.4;
        debris.maxLifeTime = 0.8;
        debris.minEmitPower = radius * 1.8;
        debris.maxEmitPower = radius * 3.5;
        debris.gravity = new Vector3(0, -9.8, 0);
        debris.blendMode = ParticleSystem.BLENDMODE_ADD;
        debris.manualEmitCount = debrisCount;
        debris.start();
        setTimeout(() => debris.dispose(false), 1000);
    }

    /** Behemoth shield ignition: a gold-white particle blast before the dome settles. */
    public triggerAegisActivation(position: Vector3, radius: number): void {
        this.createExpandingRing('aegis-activation-wave', position, radius, new Color3(1, 0.74, 0.16), 0.15, 22);
        this.createExpandingRing('aegis-activation-core', position.add(new Vector3(0, 0.16, 0)), radius * 0.62, new Color3(1, 0.96, 0.68), 0.07, 17);
        this.triggerShiningBurst(
            'aegis-shining-blast',
            position,
            new Color4(1, 1, 0.82, 1),
            new Color4(1, 0.38, 0.04, 0.92),
            190,
            radius * 3.2,
        );
        this.createTransientLight(position.add(new Vector3(0, 2, 0)), new Color3(1, 0.58, 0.08), 3.6, radius * 2.5, 320);
    }

    /** Behemoth shield presentation with an energy shell, wireframe grid and orbit rings. */
    public attachAegisDome(parent: Mesh, durationMs: number): void {
        const radius = 8 * (parent.metadata?.vehicleScale ?? 1);
        this.triggerAegisActivation(parent.getAbsolutePosition(), radius);
        
        // Inner solid shield
        const dome = MeshBuilder.CreateSphere('aegis-energy-dome', { diameter: radius * 2, segments: 32 }, this.scene);
        dome.parent = parent;
        dome.position = Vector3.Zero();
        
        const shell = electricSurface(dome, 'shield');
        const domeMaterial = shell.material;

        // Outer wireframe grid
        const gridDome = MeshBuilder.CreateSphere('aegis-grid-dome', { diameter: radius * 2 + 0.2, segments: 16 }, this.scene);
        gridDome.parent = parent;
        gridDome.position = Vector3.Zero();
        
        const gridMat = new StandardMaterial('aegis-grid-mat', this.scene);
        gridMat.emissiveColor = new Color3(1, 0.6, 0.1);
        gridMat.disableLighting = true;
        gridMat.wireframe = true;
        gridDome.isPickable = false;
        gridMat.alpha = 0.15;
        gridDome.material = gridMat;

        // Rotating Orbits
        const ringMaterial = new StandardMaterial('aegis-orbit-material', this.scene);
        ringMaterial.emissiveColor = new Color3(1, 0.8, 0.2);
        ringMaterial.diffuseColor = Color3.Black();
        ringMaterial.disableLighting = true;
        ringMaterial.alpha = 0.8;
        const orbitA = MeshBuilder.CreateTorus('aegis-orbit-a', { diameter: radius * 2.1, thickness: 0.05, tessellation: 64 }, this.scene);
        const orbitB = MeshBuilder.CreateTorus('aegis-orbit-b', { diameter: radius * 2.1, thickness: 0.03, tessellation: 64 }, this.scene);
        orbitA.parent = parent;
        orbitB.parent = parent;
        orbitA.position = Vector3.Zero();
        orbitB.position = Vector3.Zero();
        orbitA.rotation.x = Math.PI / 3;
        orbitB.rotation.z = Math.PI / 3;
        orbitA.material = ringMaterial;
        orbitB.material = ringMaterial;

        const multiplier = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        const surface = multiplier > 0 ? new ParticleSystem('aegis-surface-glints', Math.round(120 * multiplier), this.scene) : null;
        if (surface) {
            surface.particleTexture = this.flareTexture;
            surface.emitter = dome;
            surface.createSphereEmitter(radius, 0);
            surface.color1 = new Color4(1, 0.96, 0.65, 0.9);
            surface.color2 = new Color4(1, 0.36, 0.04, 0.55);
            surface.colorDead = new Color4(0.3, 0.04, 0, 0);
            surface.minSize = 0.08;
            surface.maxSize = 0.3;
            surface.minLifeTime = 0.18;
            surface.maxLifeTime = 0.45;
            surface.emitRate = 65 * multiplier;
            surface.blendMode = ParticleSystem.BLENDMODE_ADD;
            surface.start();
        }

        const startedAt = performance.now();
        const animate = () => {
            const elapsed = performance.now() - startedAt;
            shell.update(elapsed / 1000);
            orbitA.rotation.y += 0.018;
            orbitB.rotation.x -= 0.014;
        };
        this.scene.onBeforeRenderObservable.add(animate);
        let disposed = false;
        const cleanup = () => {
            if (disposed) return;
            disposed = true;
            clearTimeout(timer);
            this.scene.onBeforeRenderObservable.removeCallback(animate);
            parent.onDisposeObservable.remove(parentObserver);
            this.scene.onDisposeObservable.remove(sceneObserver);
            surface?.dispose(false);
            dome.dispose(); gridDome.dispose(); orbitA.dispose(); orbitB.dispose();
            domeMaterial.dispose(); gridMat.dispose(); ringMaterial.dispose();
        };
        const parentObserver = parent.onDisposeObservable.addOnce(cleanup);
        const sceneObserver = this.scene.onDisposeObservable.addOnce(cleanup);
        const timer = setTimeout(cleanup, durationMs);
    }

    /** Wraith anti-gravity implosion followed by a vertical particle lift. */
    public triggerGravityPulse(position: Vector3, radius: number): void {
        this.createExpandingRing('gravity-outer-wave', position, radius, new Color3(0.15, 1, 0.35), 0.3, 30);
        this.createExpandingRing('gravity-inner-wave', position.add(new Vector3(0, 0.16, 0)), radius * 0.65, new Color3(0.6, 1, 0.25), 0.15, 24);
        this.triggerShiningBurst('gravity-collapse-sparks', position, new Color4(0.65, 1, 0.45, 1), new Color4(0.08, 1, 0.25, 0.86), 150, radius * 0.7);
        this.createTransientLight(position.add(new Vector3(0, 2, 0)), new Color3(0.15, 1, 0.3), 5.0, radius, 500);

        const multiplier = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        if (multiplier <= 0) return;

        // Soft additive sparks rise through the wave without opaque sprite rectangles.
        const lift = new ParticleSystem('gravity-lift-stream', Math.round(250 * multiplier), this.scene);
        lift.particleTexture = this.flareTexture;
        lift.emitter = position;
        lift.createCylinderEmitter(radius * 0.5, 3, 0, 0.5);
        lift.color1 = new Color4(0.55, 1, 0.3, 1);
        lift.color2 = new Color4(0.05, 0.85, 0.2, 0.85);
        lift.colorDead = new Color4(0.02, 0.3, 0.06, 0);
        lift.minSize = 0.08;
        lift.maxSize = 0.3;
        lift.minLifeTime = 0.6;
        lift.maxLifeTime = 1.2;
        lift.minEmitPower = 5;
        lift.maxEmitPower = 12;
        lift.gravity = new Vector3(0, 20, 0); // fly up
        lift.blendMode = ParticleSystem.BLENDMODE_ADD;
        lift.manualEmitCount = Math.round(200 * multiplier);
        lift.start();
        setTimeout(() => lift.dispose(false), 1300);
    }

    public triggerCloakTransition(position: Vector3, entering: boolean): void {
        const primary = entering ? new Color3(0.28, 0.88, 1) : new Color3(0.82, 0.94, 1);
        
        // Double scanning rings that cross each other
        this.createExpandingRing(entering ? 'cloak-in-scan' : 'cloak-out-scan', position.add(new Vector3(0, entering ? 2 : -1, 0)), entering ? 5 : 8, primary, 0.08, 30);
        this.createExpandingRing(entering ? 'cloak-in-scan2' : 'cloak-out-scan2', position.add(new Vector3(0, entering ? -1 : 2, 0)), entering ? 8 : 5, new Color3(0.1, 0.6, 1), 0.05, 30);
        
        this.triggerShiningBurst(
            entering ? 'cloak-in-particles' : 'cloak-out-particles',
            position,
            new Color4(0.82, 0.98, 1, 0.9),
            new Color4(0.12, 0.48, 0.72, 0.65),
            entering ? 150 : 200,
            entering ? 8 : 14,
        );

        const multiplier = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        if (multiplier <= 0) return;

        // Digital Glitch/Hex Particles
        const glitch = new ParticleSystem('cloak-glitch', Math.round(200 * multiplier), this.scene);
        glitch.particleTexture = this.flareTexture; // We use flare to represent digital sparks
        glitch.emitter = position.clone().add(new Vector3(0, 1, 0));
        glitch.createCylinderEmitter(3, 2, 0, 0); // Hug the vehicle shape
        glitch.color1 = new Color4(0.2, 0.8, 1, 0.8);
        glitch.color2 = new Color4(0.8, 0.9, 1, 0.5);
        glitch.colorDead = new Color4(0, 0, 0, 0);
        glitch.minSize = 0.05;
        glitch.maxSize = 0.3;
        glitch.minLifeTime = 0.1;
        glitch.maxLifeTime = 0.3;
        glitch.minEmitPower = 0;
        glitch.maxEmitPower = 0.2;
        glitch.gravity = new Vector3(0, entering ? 5 : -5, 0); // Fly up when cloaking, down when uncloaking
        glitch.blendMode = ParticleSystem.BLENDMODE_ADD;
        glitch.manualEmitCount = Math.round(150 * multiplier);
        glitch.start();
        setTimeout(() => glitch.dispose(false), 500);
    }

    /** Burst presentation is identical for local players, bots and remote replicas. */
    public triggerAfterburner(emitter: Mesh, origin: Vector3,
        onPulse?: (patches: readonly ThermalPatch[]) => void, isActive?: () => boolean): () => void {
        this.createExpandingRing('afterburner-launch-ring', origin, 9, new Color3(.1, .65, 1), .15, 24);
        this.triggerShiningBurst('afterburner-launch-sparks', origin, new Color4(.8, 1, 1, 1), new Color4(1, .4, .05, 1), 100, 18);
        return createThermalWake(this.scene, emitter, onPulse, isActive);
    }

    private createElectricLoop(name: string, center: Vector3, radius: number, color: Color3, durationFrames: number): void {
        const points: Vector3[] = [];
        const segments = 72;
        for (let index = 0; index <= segments; index++) {
            const angle = (index / segments) * Math.PI * 2;
            const harmonic = Math.sin(angle * 11 + radius) * 0.34 + Math.sin(angle * 23) * 0.16;
            const jitteredRadius = radius + harmonic + (Math.random() - 0.5) * 0.36;
            points.push(new Vector3(
                Math.cos(angle) * jitteredRadius,
                (Math.random() - 0.5) * 0.34,
                Math.sin(angle) * jitteredRadius,
            ));
        }
        points[points.length - 1].copyFrom(points[0]);
        const loop = MeshBuilder.CreateTube(name, { path: points, radius: 0.055, tessellation: 5 }, this.scene);
        loop.position.copyFrom(center);
        loop.scaling.setAll(0.04);
        const material = new StandardMaterial(`${name}-material`, this.scene);
        material.emissiveColor = color;
        material.diffuseColor = Color3.Black();
        material.disableLighting = true;
        material.alpha = 0.95;
        loop.material = material;

        const scale = new Animation(`${name}-scale`, 'scaling', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        scale.setKeys([{ frame: 0, value: new Vector3(0.04, 0.04, 0.04) }, { frame: durationFrames, value: Vector3.One() }]);
        const flicker = new Animation(`${name}-flicker`, 'material.alpha', 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        flicker.setKeys([
            { frame: 0, value: 1 },
            { frame: durationFrames * 0.32, value: 0.28 },
            { frame: durationFrames * 0.44, value: 0.95 },
            { frame: durationFrames * 0.72, value: 0.48 },
            { frame: durationFrames, value: 0 },
        ]);
        loop.animations = [scale, flicker];
        this.scene.beginAnimation(loop, 0, durationFrames, false, 1, () => {
            loop.dispose();
            material.dispose();
        });
    }

    /** Expanding electric shell with branching surface arcs. */
    public triggerEmpWave(position: Vector3, radius: number): void {
        const center = position.add(new Vector3(0, 1, 0));
        
        // Massive expanding glowing sphere
        const empSphere = MeshBuilder.CreateSphere('emp-hemisphere', { segments: 32, diameter: 1 }, this.scene);
        empSphere.position = center;
        const electric = electricSurface(empSphere, 'emp');
        const empMat = electric.material;
        const waveStart = performance.now();
        const waveObserver = this.scene.onBeforeRenderObservable.add(() => electric.update((performance.now() - waveStart) / 1000));
        empSphere.onDisposeObservable.addOnce(() => this.scene.onBeforeRenderObservable.remove(waveObserver));

        const scaleAnim = new Animation('emp-scale', 'scaling', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        scaleAnim.setKeys([{ frame: 0, value: new Vector3(1, 1, 1) }, { frame: 30, value: new Vector3(radius * 2, radius * 2, radius * 2) }]);
        
        const alphaAnim = new Animation('emp-alpha', 'visibility', 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        alphaAnim.setKeys([{ frame: 0, value: 0.8 }, { frame: 20, value: 0.2 }, { frame: 30, value: 0 }]);
        
        empSphere.animations = [scaleAnim, alphaAnim];
        this.scene.beginAnimation(empSphere, 0, 30, false, 1, () => {
            empSphere.dispose();
            empMat.dispose();
        });

        // Shockwave rings
        this.createExpandingRing('emp-wave-primary', center, radius, new Color3(0.12, 0.9, 1), 0.3, 34);
        this.createExpandingRing('emp-wave-secondary', center.add(new Vector3(0, 0.18, 0)), radius * 0.72, new Color3(0.48, 0.36, 1), 0.2, 28);
        
        // Electric Loops
        this.createElectricLoop('emp-lightning-loop-near', center.add(new Vector3(0, 0.26, 0)), radius * 0.34, new Color3(0.72, 0.98, 1), 22);
        this.createElectricLoop('emp-lightning-loop-mid', center.add(new Vector3(0, 0.18, 0)), radius * 0.66, new Color3(0.16, 0.72, 1), 30);
        this.createElectricLoop('emp-lightning-loop-far', center.add(new Vector3(0, 0.1, 0)), radius, new Color3(0.4, 0.22, 1), 38);
        
        this.triggerShiningBurst(
            'emp-blue-charge-blast',
            center,
            new Color4(0.9, 1, 1, 1),
            new Color4(0.08, 0.5, 1, 0.95),
            230,
            radius * 1.5,
        );
        this.createTransientLight(center, new Color3(0.08, 0.72, 1), 10.0, radius * 1.5, 400);

        window.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 0.8, duration: 400 } }));

        const multiplier = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        if (multiplier <= 0) return;

        // Static Glitch Sparks
        const sparks = new ParticleSystem('emp-electric-sparks', Math.round(300 * multiplier), this.scene);
        sparks.particleTexture = this.flareTexture;
        sparks.emitter = center;
        sparks.createSphereEmitter(2, 1);
        sparks.color1 = new Color4(0.65, 0.98, 1, 1);
        sparks.color2 = new Color4(0.16, 0.42, 1, 0.82);
        sparks.colorDead = new Color4(0, 0.05, 0.2, 0);
        sparks.minSize = 0.1;
        sparks.maxSize = 0.5;
        sparks.minLifeTime = 0.2;
        sparks.maxLifeTime = 0.8;
        sparks.minEmitPower = radius * 0.5;
        sparks.maxEmitPower = radius * 1.2;
        sparks.gravity = Vector3.Zero();
        sparks.blendMode = ParticleSystem.BLENDMODE_ADD;
        sparks.manualEmitCount = Math.round(200 * multiplier);
        sparks.start();
        setTimeout(() => sparks.dispose(false), 1000);
    }

    public triggerLightningStrike(target: Vector3): void {
        const start = target.add(new Vector3((Math.random() - 0.5) * 7, 72, (Math.random() - 0.5) * 7));
        const points: Vector3[] = [];
        const segments = 18;
        for (let index = 0; index <= segments; index++) {
            const t = index / segments;
            const envelope = Math.sin(Math.PI * t);
            points.push(Vector3.Lerp(start, target, t).add(new Vector3(
                (Math.random() - 0.5) * 5.5 * envelope,
                0,
                (Math.random() - 0.5) * 5.5 * envelope,
            )));
        }

        const coreMaterial = new StandardMaterial('lightning-core-material', this.scene);
        coreMaterial.emissiveColor = new Color3(0.92, 0.98, 1);
        coreMaterial.diffuseColor = Color3.Black();
        coreMaterial.alphaMode = 1; // Engine.ALPHA_ADD
        coreMaterial.disableLighting = true;
        
        const coronaMaterial = new StandardMaterial('lightning-corona-material', this.scene);
        coronaMaterial.emissiveColor = new Color3(0.08, 0.34, 1);
        coronaMaterial.diffuseColor = Color3.Black();
        coronaMaterial.disableLighting = true;
        coronaMaterial.alpha = 0.5;
        coronaMaterial.alphaMode = 1; // Engine.ALPHA_ADD

        const corona = MeshBuilder.CreateTube('lightning-corona', { path: points, radius: 0.8, tessellation: 6 }, this.scene);
        corona.material = coronaMaterial;
        const core = MeshBuilder.CreateTube('lightning-core', { path: points, radius: 0.25, tessellation: 5 }, this.scene);
        core.material = coreMaterial;

        const branches: Mesh[] = [];
        const branchCount = GraphicsSettingsManager.getInstance().getQuality() === 'HIGH' ? 8 : 4;
        for (let branchIndex = 0; branchIndex < branchCount; branchIndex++) {
            const sourceIndex = 4 + Math.floor(Math.random() * (segments - 7));
            const source = points[sourceIndex];
            const branchPoints = [source];
            let cursor = source.clone();
            for (let step = 0; step < 4; step++) {
                cursor = cursor.add(new Vector3((Math.random() - 0.5) * 5, -2 - Math.random() * 3, (Math.random() - 0.5) * 5));
                branchPoints.push(cursor);
            }
            const branch = MeshBuilder.CreateTube(`lightning-branch-${branchIndex}`, { path: branchPoints, radius: 0.08, tessellation: 4 }, this.scene);
            branch.material = coreMaterial;
            branches.push(branch);
        }

        const flicker = new Animation('lightning-flicker', 'visibility', 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        flicker.setKeys([{ frame: 0, value: 1 }, { frame: 3, value: 0.2 }, { frame: 5, value: 1 }, { frame: 8, value: 0 }]);
        core.animations = [flicker];
        corona.animations = [flicker.clone()];
        branches.forEach(branch => { branch.animations = [flicker.clone()]; });
        this.scene.beginAnimation(core, 0, 8, false, 1, () => {
            core.dispose();
            branches.forEach(branch => branch.dispose());
            coreMaterial.dispose();
        });
        this.scene.beginAnimation(corona, 0, 8, false, 1, () => {
            corona.dispose();
            coronaMaterial.dispose();
        });

        // Impact effects
        this.createExpandingRing('lightning-impact-ring', target, 9, new Color3(0.25, 0.7, 1), 0.2, 20);
        this.createTransientLight(target.add(new Vector3(0, 2, 0)), new Color3(0.8, 0.9, 1), 12.0, 30, 200);
        
        window.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 1.0, duration: 300 } }));

        // Ground Scorch Decal
        const scorch = MeshBuilder.CreatePlane('lightning-scorch', { size: 6 + Math.random() * 3 }, this.scene);
        scorch.position = target.clone();
        scorch.position.y += 0.05;
        scorch.rotation.x = Math.PI / 2;
        scorch.rotation.y = Math.random() * Math.PI;
        
        const scorchMat = new StandardMaterial('scorch-mat', this.scene);
        scorchMat.diffuseTexture = this.smokeTexture; // Re-using smoke texture for the scorch alpha
        scorchMat.diffuseColor = new Color3(0.01, 0.01, 0.02);
        scorchMat.useAlphaFromDiffuseTexture = true;
        scorchMat.zOffset = -2;
        scorch.material = scorchMat;
        
        const fade = new Animation('scorch-fade', 'visibility', 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        fade.setKeys([{ frame: 0, value: 0.9 }, { frame: 180, value: 0.9 }, { frame: 300, value: 0 }]);
        scorch.animations = [fade];
        this.scene.beginAnimation(scorch, 0, 300, false, 1, () => { scorch.dispose(); scorchMat.dispose(); });
    }

    // ─── Projectile & Vehicle Trails ─────────────────────────────────────────

    public attachSmokeTrail(emitterMesh: any, kind: ProjectileVfxKind): ParticleSystem | null {
        const pMult = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        if (pMult <= 0) return null;

        const isNuke = kind === 'nuke';
        const isMortar = kind === 'mortar';

        const trail = this.getPooledPS(`smokeTrail-${kind}`, isNuke ? 180 : isMortar ? 120 : 250, (ps) => {
            ps.particleTexture = this.smokeTexture;
            ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
            ps.colorDead = new Color4(0, 0, 0, 0);
        });
        trail.color1 = isNuke ? new Color4(0.25, 0.22, 0.18, 0.88) : isMortar ? new Color4(0.2, 0.19, 0.18, 0.8) : new Color4(0.38, 0.34, 0.3, 0.72);
        trail.color2 = isNuke ? new Color4(0.05, 0.05, 0.05, 0.58) : new Color4(0.09, 0.09, 0.09, 0.42);
        trail.minSize = isNuke ? 1.35 : isMortar ? 0.8 : 0.8;
        trail.maxSize = isNuke ? 3.8 : isMortar ? 2.4 : 2.5; // Much thicker missile trail
        trail.minLifeTime = isNuke ? 0.9 : isMortar ? 0.7 : 0.5;
        trail.maxLifeTime = isNuke ? 1.8 : isMortar ? 1.4 : 1.0;
        trail.emitRate = (isNuke ? 155 : isMortar ? 110 : 250) * pMult; // Higher density
        trail.createPointEmitter(new Vector3(0, 0, -1), new Vector3(0, 0, -1));
        trail.minEmitPower = isNuke ? 2 : 1;
        trail.maxEmitPower = isNuke ? 6 : 3.5;
        trail.emitter = emitterMesh;
        
        // Reset manual emit count just in case it was used before
        trail.manualEmitCount = -1;
        trail.start();
        return trail;
    }

    public attachFireTrail(emitterMesh: any, kind: ProjectileVfxKind): ParticleSystem | null {
        const pMult = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        if (pMult <= 0) return null;

        const isNuke = kind === 'nuke';
        const isMortar = kind === 'mortar';

        const fire = this.getPooledPS(`fireTrail-${kind}`, isNuke ? 220 : 250, (ps) => {
            ps.particleTexture = this.fireTexture;
            ps.blendMode = ParticleSystem.BLENDMODE_ADD; // Enforce additive
            ps.colorDead = new Color4(0, 0, 0, 0);
        });
        fire.color1 = isNuke ? new Color4(1, 0.98, 0.72, 1) : new Color4(1, 0.78, 0.28, 0.95);
        fire.color2 = isMortar ? new Color4(1, 0.22, 0.02, 0.5) : new Color4(1, 0.38, 0.04, 0.62);
        fire.minSize = isNuke ? 0.9 : isMortar ? 0.48 : 0.5;
        fire.maxSize = isNuke ? 2.2 : isMortar ? 1.25 : 1.5; // Larger fire core
        fire.minLifeTime = 0.07;
        fire.maxLifeTime = isNuke ? 0.3 : isMortar ? 0.22 : 0.25;
        fire.emitRate = (isNuke ? 300 : isMortar ? 210 : 350) * pMult;
        fire.createPointEmitter(new Vector3(0, 0, -1), new Vector3(0, 0, -1));
        fire.minEmitPower = 4;
        fire.maxEmitPower = isNuke ? 15 : isMortar ? 11 : 12;
        fire.emitter = emitterMesh;
        
        fire.manualEmitCount = -1;
        fire.start();
        return fire;
    }
}
