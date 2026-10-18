import { RACE_WEAPONS } from '../../../shared/race/types';
import { Engine, FreeCamera, GlowLayer, Quaternion, Scene, Vector3, Mesh, Matrix } from '@babylonjs/core';
import { driveRacer } from '../../../shared/race/physics';
import { nearestTrack, normalizeAngle, trackPose } from '../../../shared/race/track';
import { type RaceInput, type Racer, type RaceShot, type RaceSnapshot, type RaceWeapon } from '../../../shared/race/types';
import { VehicleFactory } from '../entities/VehicleFactory';
import type { RemoteVehicle } from '../entities/RemoteVehicle';
import { WeaponController } from '../weapons/WeaponController';
import { InputManager } from '../utils/InputManager';
import { SoundManager } from '../engine/SoundManager';
import { VfxManager } from '../vfx/VfxManager';
import { GraphicsSettingsManager } from '../settings/GraphicsSettingsManager';
import { buildRaceTrack } from './RaceTrack';
import { playAbilityActivation } from '../vfx/AbilityActivation';
import { createRacePickup } from './RacePickup';
import { equipRaceWeapon } from './RaceVehicleEquipment';

/** Race renderer and local input prediction. The server always decides collision, damage and lap results. */
export class RaceEngine {
    readonly scene: Scene;
    readonly input = new InputManager();
    private engine: Engine;
    private camera: FreeCamera;
    private vehicles = new Map<string, { vehicle: RemoteVehicle; height: number; weapon: RaceWeapon | null }>();
    private weapons = new Map<string, WeaponController>();
    private pickups = new Map<number, Mesh>();
    private snapshot: RaceSnapshot;
    private predicted: Racer | null = null;
    private lastSnapshot = performance.now();
    private disposed = false;
    private lastSent = 0;
    private localId: string;
    private send: (input: RaceInput) => void;
    private abilityEffects = new Map<string, () => void>();
    private resize = () => {
        this.engine.setHardwareScalingLevel(GraphicsSettingsManager.getInstance().getConfig().hardwareScalingLevel);
        this.engine.resize();
    };
    private blur = () => { this.touch = { throttle: 0, steer: 0, brake: false, fire: false, ability: false }; };
    private isPaused = false;
    public get paused(): boolean { return this.isPaused; }
    public set paused(value: boolean) {
        this.isPaused = value;
        if (value) { this.blur(); this.input.keys = {}; this.abilityRequested = false; }
    }
    public touch = { throttle: 0, steer: 0, brake: false, fire: false, ability: false };
    private abilityRequested = false;
    public setFiring(held: boolean): void { this.touch.fire = held && !this.paused; }
    public activateAbility(): void { this.abilityRequested = true; }
    private lastAbilities = new Map<string, number>();

    constructor(canvas: HTMLCanvasElement, state: RaceSnapshot, localId: string, send: (input: RaceInput) => void) {
        this.snapshot = state; this.localId = localId; this.send = send;
        this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true });
        this.engine.setHardwareScalingLevel(GraphicsSettingsManager.getInstance().getConfig().hardwareScalingLevel);
        this.scene = new Scene(this.engine);
        buildRaceTrack(this.scene);
        VfxManager.initialize(this.scene); SoundManager.getInstance().init(this.scene);
        this.camera = new FreeCamera('race-chase-camera', new Vector3(0, 7, -15), this.scene);
        this.camera.fov = .9; this.camera.minZ = .2; this.camera.maxZ = 1500;

        window.addEventListener('resize', this.resize); window.addEventListener('blur', this.blur);
    }

    async initialize(): Promise<void> {
        for (const car of this.snapshot.racers) {
            const vehicle = await VehicleFactory.createRemoteVehicle(this.scene, 'interceptor', 'none', new Vector3(car.x, 0, car.z), car.color);
            if (this.disposed) { if (!vehicle.mesh.isDisposed()) vehicle.dispose(); return; }
            vehicle.serverManagedRespawn = true; vehicle.maxHealth = 600; vehicle.health = car.health;
            let bottom = Infinity;
            for (const mesh of vehicle.mesh.getChildMeshes()) if (mesh.isEnabled() && mesh.isVisible && mesh.name !== 'healthBar') { mesh.computeWorldMatrix(true); bottom = Math.min(bottom, mesh.getBoundingInfo().boundingBox.minimumWorld.y); }
            const height = Number.isFinite(bottom) ? -bottom + .06 : 1.2;
            vehicle.respawnAt(new Vector3(car.x, trackPose(nearestTrack(car).along).y + height, car.z), car.yaw, car.health);
            vehicle.mesh.metadata = { ...vehicle.mesh.metadata, entityId: car.id, playerId: car.id, vehicle, displayName: car.name };
            this.vehicles.set(car.id, { vehicle, height, weapon: null });
        }
        const glow = new GlowLayer('race-pickup-glow', this.scene, { mainTextureRatio: .25, blurKernelSize: 24 });
        glow.intensity = .55;
        for (const pickup of this.snapshot.pickups) {
            const mesh = createRacePickup(this.scene, pickup);
            glow.addIncludedOnlyMesh(mesh);
            for (const child of mesh.getChildMeshes()) if (!child.name.startsWith('pickup-label')) glow.addIncludedOnlyMesh(child as Mesh);
            this.pickups.set(pickup.id, mesh);
        }
        this.setSnapshot(this.snapshot);
        const local = this.snapshot.racers.find(car => car.id === this.localId)!;
        this.camera.position.set(local.x - Math.sin(local.yaw) * 13, trackPose(nearestTrack(local).along).y + 7, local.z - Math.cos(local.yaw) * 13);
        this.engine.runRenderLoop(this.render);
    }

    setSnapshot(state: RaceSnapshot): void {
        if (this.disposed) return;
        const previousLocal = this.snapshot.racers.find(car => car.id === this.localId);
        const nextLocal = state.racers.find(car => car.id === this.localId);
        if (previousLocal && nextLocal && previousLocal.health > 0 && nextLocal.health > 0 && nextLocal.weapon &&
            (nextLocal.weapon !== previousLocal.weapon || nextLocal.ammo > previousLocal.ammo)) {
            SoundManager.getInstance().playPickup();
        }
        this.snapshot = state; this.scene.metadata = { ...this.scene.metadata, combatEnded: state.phase === 'finished' }; this.lastSnapshot = performance.now();
        const local = state.racers.find(car => car.id === this.localId);
        if (local) {
            if (!this.predicted || local.health <= 0 || this.predicted.health <= 0 || Math.hypot(local.x - this.predicted.x, local.z - this.predicted.z) > 8) this.predicted = { ...local };
            else {
                const previous = this.predicted;
                this.predicted = { ...local, x: previous.x + (local.x - previous.x) * .3, z: previous.z + (local.z - previous.z) * .3, yaw: previous.yaw + normalizeAngle(local.yaw - previous.yaw) * .3 };
            }
        }
        for (const car of state.racers) {
            const model = this.vehicles.get(car.id); if (!model) continue;
            model.vehicle.mesh.setEnabled(car.connected);
            if (car.health <= 0) model.vehicle.explode();
            else if (model.vehicle.isDead) model.vehicle.respawnAt(new Vector3(car.x, trackPose(nearestTrack(car).along).y + model.height, car.z), car.yaw, car.health);
            model.vehicle.health = car.health; model.vehicle.updateHealthBar();
            this.ensureWeapon(car.id, car.weapon);
            const pose = trackPose(nearestTrack(car).along);
            if (car.id !== this.localId) model.vehicle.updateNetworkState({ x: car.x, y: pose.y + model.height, z: car.z }, this.roadRotation(car.yaw, pose));
            const target = car.targetId ? this.vehicles.get(car.targetId)?.vehicle.mesh ?? null : null;
            this.weapons.get(car.id)?.setPresentationTarget(target);
            const previousAbility = this.lastAbilities.get(car.id) ?? 0;
            if (car.lastAbility > previousAbility && car.abilityImpactAt > state.serverTime && car.health > 0) {
                this.abilityEffects.get(car.id)?.();
                const stopAbilitySound = SoundManager.getInstance().playAbility('lightning', model.vehicle.mesh.getAbsolutePosition(), car.id === this.localId);
                this.abilityEffects.set(car.id, playAbilityActivation(model.vehicle.mesh, 'lightning', () => {}, () => {
                    const current = this.snapshot.racers.find(racer => racer.id === car.id);
                    return Boolean(current?.connected && current.health > 0 && current.abilityTarget && current.finishedAt === null);
                }, stopAbilitySound));
            }
            if (!car.abilityTarget || car.health <= 0 || !car.connected || state.phase === 'finished') {
                this.abilityEffects.get(car.id)?.(); this.abilityEffects.delete(car.id);
            }
            this.lastAbilities.set(car.id, car.lastAbility);
        }
        for (const pickup of state.pickups) this.pickups.get(pickup.id)?.setEnabled(pickup.availableAt <= state.serverTime);
    }

    private render = () => {
        if (this.disposed) return;
        const dt = Math.min(.05, this.engine.getDeltaTime() / 1000), now = performance.now();
        const controls: RaceInput = this.paused ? { throttle: 0, steer: 0, brake: true, fire: false, ability: false } : {
            throttle: this.touch.throttle || (Number(this.input.isKeyDown('w') || this.input.isKeyDown('arrowup')) - Number(this.input.isKeyDown('s') || this.input.isKeyDown('arrowdown'))),
            steer: this.touch.steer || (Number(this.input.isKeyDown('d') || this.input.isKeyDown('arrowright')) - Number(this.input.isKeyDown('a') || this.input.isKeyDown('arrowleft'))),
            brake: this.touch.brake || this.input.isKeyDown('b'), fire: this.touch.fire || this.input.isKeyDown(' '),
            ability: this.abilityRequested || this.touch.ability || this.input.isKeyDown('shift')
        };
        if (now - this.lastSent >= 50) { this.send(controls); this.abilityRequested = false; this.lastSent = now; }
        const local = this.predicted;
        if (local) {
            if (this.snapshot.phase === 'racing' && local.health > 0 && local.finishedAt === null && now - this.lastSnapshot < 250) driveRacer(local, controls, dt);
            const model = this.vehicles.get(this.localId);
            const pose = trackPose(nearestTrack(local).along);
            if (model && !model.vehicle.isDead) model.vehicle.updateNetworkState({ x: local.x, y: pose.y + model.height, z: local.z }, this.roadRotation(local.yaw, pose));
            const position = model?.vehicle.mesh.position ?? new Vector3(local.x, 1, local.z);
            const desired = new Vector3(position.x - Math.sin(local.yaw) * 13, Math.max(position.y + 6, trackPose(nearestTrack({ x: position.x - Math.sin(local.yaw) * 13, z: position.z - Math.cos(local.yaw) * 13 }).along).y + 4), position.z - Math.cos(local.yaw) * 13);
            this.camera.position = Vector3.Lerp(this.camera.position, desired, 1 - Math.exp(-7 * dt));
            this.camera.setTarget(new Vector3(position.x + Math.sin(local.yaw) * 8, position.y + 1, position.z + Math.cos(local.yaw) * 8));
            if (!this.paused && local.health > 0 && local.finishedAt === null && this.snapshot.phase === 'racing') {
                SoundManager.getInstance().updateEngineSound(Math.hypot(local.vx, local.vz) * 3.6, controls.throttle !== 0);
            } else SoundManager.getInstance().stopEngineSound();
        }
        for (const mesh of this.pickups.values()) {
            if (mesh.isEnabled()) {
                mesh.position.y = mesh.metadata.roadHeight + 2.5 + Math.sin(now * 0.003 + mesh.position.x) * 0.5;
            }
        }

        this.scene.render();
    };

    /** Resolve road grade into the car's own forward/right axes, including reversing and cornering. */
    private roadRotation(yaw: number, pose: ReturnType<typeof trackPose>): Quaternion {
        const forwardGrade = pose.grade * (Math.sin(yaw) * pose.tx + Math.cos(yaw) * pose.tz);
        const rightGrade = pose.grade * (Math.cos(yaw) * pose.tx - Math.sin(yaw) * pose.tz);
        return Quaternion.RotationYawPitchRoll(yaw, -Math.atan(forwardGrade), Math.atan(rightGrade));
    }

    /** Equip from events as well as snapshots so the first shot after a pickup is never lost. */
    private ensureWeapon(id: string, weapon: RaceWeapon | null): WeaponController | undefined {
        const model = this.vehicles.get(id);
        if (!model) return;
        if (model.weapon !== weapon) {
            this.weapons.get(id)?.dispose(); this.weapons.delete(id);
            equipRaceWeapon(model.vehicle.mesh, weapon); model.weapon = weapon;
            if (weapon) {
                const controller = new WeaponController(this.scene, model.vehicle.mesh, weapon, id, false, null);
                controller.setPresentationTarget(null);
                controller.setTargetPool([...this.vehicles.values()].map(entry => entry.vehicle.mesh));
                this.weapons.set(id, controller);
            }
        }
        return this.weapons.get(id);
    }

    playShots(shots: RaceShot[]): void {
        if (this.disposed) return;
        for (const shot of shots) {
            const hitY = trackPose(nearestTrack({ x: shot.hitX, z: shot.hitZ }).along).y + 2;
            const end = new Vector3(shot.hitX, hitY, shot.hitZ);
            if (shot.weapon === 'lightning') { VfxManager.getInstance().triggerLightningStrike(end); continue; }
            const controller = this.ensureWeapon(shot.actor, shot.weapon);
            const actor = this.vehicles.get(shot.actor);
            const socket = actor?.vehicle.mesh.getChildTransformNodes().find(node => node.name === 'muzzle_socket');
            const origin = socket?.getAbsolutePosition().clone() ?? new Vector3(shot.x, trackPose(nearestTrack({ x: shot.x, z: shot.z }).along).y + 2, shot.z);
            controller?.playRemoteShot(origin, end, shot.target);
        }
    }

    public getTargetedHostile(): { mesh: Mesh; locked: boolean; ready: boolean } | null {
        const car = this.snapshot.racers.find(racer => racer.id === this.localId);
        if (!car || this.snapshot.phase !== 'racing' || car.health <= 0 || car.finishedAt !== null || !car.weapon || car.ammo <= 0 || !car.targetId) return null;
        const target = this.snapshot.racers.find(racer => racer.id === car.targetId);
        const model = this.vehicles.get(car.targetId);
        if (!target || target.health <= 0 || !target.connected || !model || model.vehicle.mesh.isDisposed()) return null;
        return { mesh: model.vehicle.mesh, locked: this.snapshot.serverTime - car.targetSince >= 220, ready: this.snapshot.serverTime - car.lastShot >= RACE_WEAPONS[car.weapon].interval };
    }

    public projectToScreen(x: number, y: number, z: number): { x: number, y: number, z: number } | null {
        if (!this.camera || !this.scene) return null;
        const canvas = this.engine.getRenderingCanvas();
        const viewportWidth = canvas?.clientWidth || this.engine.getRenderWidth();
        const viewportHeight = canvas?.clientHeight || this.engine.getRenderHeight();
        const pos = Vector3.Project(
            new Vector3(x, y, z),
            Matrix.Identity(),
            this.scene.getTransformMatrix(),
            this.camera.viewport.toGlobal(viewportWidth, viewportHeight)
        );
        return { x: pos.x, y: pos.y, z: pos.z };
    }

    dispose(): void {
        if (this.disposed) return; this.disposed = true;
        this.engine.stopRenderLoop(); window.removeEventListener('resize', this.resize); window.removeEventListener('blur', this.blur); this.input.dispose();
        this.abilityEffects.forEach(cancel => cancel()); this.abilityEffects.clear();
        this.weapons.forEach(controller => controller.dispose()); this.weapons.clear();
        this.vehicles.forEach(({ vehicle }) => vehicle.dispose()); SoundManager.getInstance().cleanup();
        this.scene.dispose(); this.engine.dispose();
    }
}
