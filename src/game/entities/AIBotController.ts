import { Vector3, Scene } from "@babylonjs/core";
import { VehicleController } from "./VehicleController";
import { WeaponController } from "../weapons/WeaponController";
import { canAffect } from "../match/CombatRules";

interface BotTarget {
    mesh: import('@babylonjs/core').Mesh;
    isDead: boolean;
    isCloaked?: boolean;
}

export class AIBotController {
    public botVehicle: VehicleController;
    public weapon: WeaponController | null;
    public isActive: boolean = false; // Disabled by default until match starts
    private scene: Scene;
    
    // References to dynamically find targets
    private playerVehicle: VehicleController | null;
    private allBots: AIBotController[];
    
    private currentTarget: BotTarget | null = null;
    private externalTargets: () => BotTarget[];
    private lastTargetCheck = 0;

    constructor(
        botVehicle: VehicleController,
        playerVehicle: VehicleController | null,
        allBots: AIBotController[],
        scene: Scene,
        weapon: WeaponController | null = null,
        externalTargets: () => BotTarget[] = () => [],
    ) {
        this.botVehicle = botVehicle;
        this.playerVehicle = playerVehicle;
        this.allBots = allBots;
        this.weapon = weapon;
        this.externalTargets = externalTargets;
        this.scene = scene;
        this.scene.onBeforeRenderObservable.add(this.update);
    }

    private acquireTarget() {
        const now = performance.now();
        if (now - this.lastTargetCheck < 2000 && this.currentTarget && !this.currentTarget.isDead && canAffect(this.botVehicle.mesh, this.currentTarget.mesh)) {
            return; // Target still valid and we checked recently
        }
        this.lastTargetCheck = now;

        const myPos = this.botVehicle.mesh.getAbsolutePosition();
        let closestDist = Infinity;
        let bestTarget: BotTarget | null = null;

        // Check player
        if (this.playerVehicle && !this.playerVehicle.isDead && !this.playerVehicle.isCloaked && canAffect(this.botVehicle.mesh, this.playerVehicle.mesh)) {
            const dist = Vector3.Distance(myPos, this.playerVehicle.mesh.getAbsolutePosition());
            if (dist < closestDist) {
                closestDist = dist;
                bestTarget = this.playerVehicle;
            }
        }

        // Check other bots
        for (const bot of this.allBots) {
            if (bot !== this && !bot.botVehicle.isDead && !bot.botVehicle.isCloaked && canAffect(this.botVehicle.mesh, bot.botVehicle.mesh)) {
                const dist = Vector3.Distance(myPos, bot.botVehicle.mesh.getAbsolutePosition());
                if (dist < closestDist) {
                    closestDist = dist;
                    bestTarget = bot.botVehicle;
                }
            }
        }

        for (const target of this.externalTargets()) {
            if (target.isDead || target.isCloaked || !canAffect(this.botVehicle.mesh, target.mesh)) continue;
            const dist = Vector3.Distance(myPos, target.mesh.getAbsolutePosition());
            if (dist < closestDist) {
                closestDist = dist;
                bestTarget = target;
            }
        }

        this.currentTarget = bestTarget;
    }

    private update = () => {
        if (this.scene.metadata?.combatEnded || !this.isActive || !this.botVehicle.mesh || this.botVehicle.isDead) return;

        this.acquireTarget();

        if (!this.currentTarget || !this.currentTarget.mesh) {
            // No targets alive, just stop
            this.botVehicle.throttleInput = 0;
            this.botVehicle.steerInput = 0;
            return;
        }

        const myPos = this.botVehicle.mesh.getAbsolutePosition();
        const targetPos = this.currentTarget.mesh.getAbsolutePosition();

        const toTarget = targetPos.subtract(myPos);
        const flatToTarget = new Vector3(toTarget.x, 0, toTarget.z).normalize();
        
        const forward = this.botVehicle.mesh.forward;
        const flatForward = new Vector3(forward.x, 0, forward.z).normalize();
        
        const cross = Vector3.Cross(flatForward, flatToTarget);
        const dot = Vector3.Dot(flatForward, flatToTarget);
        
        let steer = 0;
        if (dot < 0.98) {
            steer = cross.y > 0 ? 1 : -1;
        }

        let throttle = 1; 
        
        if (dot < -0.3) {
            // Target is behind, reverse
            throttle = -1;
            steer = -steer; 
        } else if (toTarget.length() < 20) {
            // Too close, avoid getting completely stuck
            throttle = -1;
            steer = -steer;
        } else if (dot > 0.8 && toTarget.length() < 40) {
            // Circle strafe instead of stopping
            throttle = 0.8;
            steer = 1; 
        }

        this.botVehicle.throttleInput = throttle;
        this.botVehicle.steerInput = steer;
        
        if (dot > 0.90 && toTarget.length() < 120 && this.weapon) {
            this.weapon.fire();
        }

        // More dynamic overdrive usage
        if (toTarget.length() < 80 && dot > 0.5 && Math.random() < 0.01) {
            this.botVehicle.triggerAbility();
        }
    }

    public dispose() {
        this.scene.onBeforeRenderObservable.removeCallback(this.update);
    }
}
