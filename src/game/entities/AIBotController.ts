import { Vector3, type Scene, type Mesh } from '@babylonjs/core';
import type { VehicleController } from './VehicleController';
import type { WeaponController } from '../weapons/WeaponController';
import { canAffect } from '../match/CombatRules';
import { botCanSee, botClearance } from './BotPerception';
import { chooseBotState, shouldUseBotAbility, weaponSpacing, type BotState, type TacticalContext } from './BotTactics';

interface BotTarget {
    mesh: Mesh; isDead: boolean; isCloaked?: boolean;
    health?: number; maxHealth?: number; respawnProtectedUntil?: number;
}

/** Bounded perception and deterministic tactical states; physics and weapons retain authority. */
export class AIBotController {
    public isActive = false;
    public state: BotState = 'search';
    private currentTarget: BotTarget | null = null;
    private targetSince = 0;
    private nextDecision = 0;
    private lastHealth: number;
    private threatenedUntil = 0;
    private stuckSince = 0;
    private recoveryUntil = 0;
    private recoveryTurn = 1;
    private progressPosition = Vector3.Zero();
    private targetPosition = Vector3.Zero();
    private lastSeen = 0;
    private orbitSide: number;
    private wasDisabled = true;

    public botVehicle: VehicleController;
    public weapon: WeaponController | null;
    private playerVehicle: VehicleController | null;
    private allBots: AIBotController[];
    private scene: Scene;
    private externalTargets: () => BotTarget[];

    constructor(
        botVehicle: VehicleController,
        playerVehicle: VehicleController | null,
        allBots: AIBotController[],
        scene: Scene,
        weapon: WeaponController | null = null,
        externalTargets: () => BotTarget[] = () => [],
    ) {
        this.botVehicle = botVehicle; this.weapon = weapon; this.playerVehicle = playerVehicle;
        this.allBots = allBots; this.scene = scene; this.externalTargets = externalTargets;
        this.lastHealth = botVehicle.health;
        this.orbitSide = botVehicle.mesh.uniqueId % 2 ? 1 : -1;
        // Spread expensive sensing across frames when an entire squad spawns together.
        this.nextDecision = performance.now() + botVehicle.mesh.uniqueId % 5 * 50;
        scene.onBeforeRenderObservable.add(this.update);
    }

    private valid(target: BotTarget, now: number): boolean {
        return !target.mesh.isDisposed() && !target.isDead && !target.isCloaked &&
            (target.respawnProtectedUntil ?? 0) <= now && canAffect(this.botVehicle.mesh, target.mesh);
    }

    private stop(): void {
        this.botVehicle.throttleInput = 0;
        this.botVehicle.steerInput = 0;
        this.weapon?.setPreferredTarget(null);
    }

    private update = () => {
        const vehicle = this.botVehicle, now = performance.now();
        if (!this.isActive || this.scene.metadata?.combatEnded || vehicle.mesh.isDisposed() || vehicle.isDead || vehicle.isEmped || vehicle.isStunned || vehicle.isFlipped) {
            this.stop(); this.currentTarget = null; this.wasDisabled = true; this.recoveryUntil = 0; return;
        }
        if (this.wasDisabled) {
            this.lastHealth = vehicle.health; this.threatenedUntil = 0; this.stuckSince = now;
            this.progressPosition.copyFrom(vehicle.mesh.getAbsolutePosition()); this.wasDisabled = false;
        }
        if (vehicle.health < this.lastHealth) this.threatenedUntil = now + 2500;
        this.lastHealth = vehicle.health;
        if (this.currentTarget && !this.valid(this.currentTarget, now)) {
            this.currentTarget = null; this.weapon?.setPreferredTarget(null); this.nextDecision = 0;
        }
        if (now < this.nextDecision) return;
        this.nextDecision = now + 250;
        const position = vehicle.mesh.getAbsolutePosition();
        const pool = [...(this.playerVehicle ? [this.playerVehicle] : []), ...this.allBots.filter(bot => bot !== this).map(bot => bot.botVehicle), ...this.externalTargets()];
        const seen = new Set<Mesh>();
        const candidates = pool.filter(target => {
            if (seen.has(target.mesh) || !this.valid(target, now)) return false;
            seen.add(target.mesh); return Vector3.DistanceSquared(position, target.mesh.getAbsolutePosition()) < 160 * 160;
        }).map(target => {
            const distance = Vector3.Distance(position, target.mesh.getAbsolutePosition());
            const health = (target.health ?? 100) / Math.max(1, target.maxHealth ?? 100);
            return { target, distance, score: distance + health * 12 - (target === this.currentTarget ? 22 : 0) };
        }).sort((a, b) => a.score - b.score);
        // At most four sight rays per decision; never lock a target through geometry.
        const visible = candidates.slice(0, 4).filter(({ target }) => botCanSee(this.scene, vehicle.mesh, target.mesh));
        const chosen = visible[0]?.target ?? null;
        if (chosen !== this.currentTarget) { this.currentTarget = chosen; this.targetSince = now; }
        if (chosen) { this.targetPosition.copyFrom(chosen.mesh.getAbsolutePosition()); this.lastSeen = now; }
        this.weapon?.setPreferredTarget(chosen?.mesh ?? null);
        const delta = this.targetPosition.subtract(position); delta.y = 0;
        const distance = chosen ? Vector3.Distance(position, chosen.mesh.getAbsolutePosition()) : Infinity;
        const forward = vehicle.mesh.forward;
        const yaw = Math.atan2(forward.x, forward.z);
        const targetYaw = Math.atan2(delta.x, delta.z);
        const angle = Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw));
        const clearance = botClearance(this.scene, vehicle.mesh, vehicle.getSpeed() / 3.6);
        const context: TacticalContext = {
            vehicleId: vehicle.vehicleId, weaponId: this.weapon?.weaponId ?? 'minigun', distance,
            facing: Math.cos(angle), health: vehicle.health / Math.max(1, vehicle.maxHealth),
            underFire: now < this.threatenedUntil, nearbyEnemies: visible.filter(item => item.distance < 45).length,
            reloading: this.weapon?.isReloading ?? false, clearRoute: Math.min(clearance.front, clearance.left, clearance.right) > .9,
            visible: chosen !== null, targetStable: now - this.targetSince >= 750,
        };
        const nextState = chooseBotState(context, this.state);
        this.state = now < this.recoveryUntil ? 'recover' : nextState;
        let steer = 0, throttle = .45;
        if (this.state === 'search') {
            // Briefly investigate the last seen point, then sweep instead of tracking hidden enemies.
            steer = now - this.lastSeen < 2000 && delta.lengthSquared() > 25 ? Math.max(-1, Math.min(1, angle * 1.4)) : this.orbitSide * .25;
        } else if (this.state === 'recover') {
            throttle = -.65; steer = this.recoveryTurn;
        } else {
            const range = weaponSpacing(context.weaponId);
            const orbit = this.state === 'engage' ? this.orbitSide * .55 * Math.max(0, 1 - Math.abs(distance - range.ideal) / range.ideal) : 0;
            steer = Math.max(-1, Math.min(1, (angle + orbit) * 1.3));
            throttle = this.state === 'withdraw' && Math.cos(angle) > .25 ? -.65 : Math.abs(angle) > 1.3 ? .4 : this.state === 'approach' ? 1 : .55;
            if (throttle < 0) steer = -steer;
        }
        if (this.state !== 'recover' && throttle > 0 && clearance.front < .8) {
            steer = clearance.left > clearance.right ? -1 : clearance.right > clearance.left ? 1 : this.orbitSide;
            throttle = clearance.front < .2 ? 0 : .3;
        }
        if (Vector3.DistanceSquared(position, this.progressPosition) > 4) {
            this.progressPosition.copyFrom(position); this.stuckSince = now;
        } else if (now - this.stuckSince > 2000 && this.state !== 'recover') {
            this.recoveryUntil = now + 1000; this.stuckSince = now + 1000;
            this.recoveryTurn = -this.recoveryTurn; this.state = 'recover'; throttle = -.65; steer = this.recoveryTurn;
        }
        vehicle.throttleInput = throttle; vehicle.steerInput = steer;
        const safeRange = context.weaponId !== 'nuke' || distance > 75;
        if (chosen && now - this.targetSince >= 400 && this.state !== 'recover' && safeRange &&
            this.weapon?.currentTarget === chosen.mesh && this.weapon.isLocked && this.weapon.isReadyToFire) this.weapon.fire();
        if (this.state !== 'recover' && !vehicle.isCloaked && now - vehicle.lastAbilityTime >= vehicle.getAbilityCooldown() && shouldUseBotAbility(context)) vehicle.triggerAbility();
    };

    public dispose(): void { this.stop(); this.scene.onBeforeRenderObservable.removeCallback(this.update); }
}
