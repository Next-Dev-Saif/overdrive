import { playAbilityActivation } from '../vfx/AbilityActivation';
import { Mesh, Scene, Vector3, Quaternion, TransformNode, MeshBuilder, StandardMaterial, Color3, Animation } from "@babylonjs/core";
import { VehicleController } from "./VehicleController";
import { canAffect } from "../match/CombatRules";
import { VfxManager } from "../vfx/VfxManager";

export class RemoteVehicle {
    public mesh: Mesh;
    public serverManagedRespawn = false;
    private scene: Scene;

    public targetPosition: Vector3;
    public targetRotation: Quaternion;

    private frontPivots: TransformNode[] = [];
    private allWheels: Mesh[] = [];

    public health: number = 100;
    public maxHealth: number = 100;
    private healthBar: Mesh | null = null;
    public isDead: boolean = false;
    public isEmped: boolean = false;
    public isStunned: boolean = false;

    constructor(mesh: Mesh, scene: Scene) {
        this.mesh = mesh;
        this.scene = scene;

        this.targetPosition = this.mesh.position.clone();
        this.targetRotation = this.mesh.rotationQuaternion ? this.mesh.rotationQuaternion.clone() : Quaternion.Identity();

        if (!this.mesh.rotationQuaternion) {
            this.mesh.rotationQuaternion = Quaternion.Identity();
        }

        // Find wheels for visual updates
        this.mesh.getChildTransformNodes().forEach(node => {
            if (node.name.includes("wheelPivot")) {
                this.frontPivots.push(node);
            }
        });
        
        this.mesh.getChildMeshes().forEach(m => {
            if (m.name.includes("wheel")) {
                this.allWheels.push(m as Mesh);
            }
        });

        // Initialize Health Bar
        this.healthBar = MeshBuilder.CreatePlane("healthBar", { width: 4, height: 0.4 }, this.scene);
        this.healthBar.parent = this.mesh;
        this.healthBar.position.y = this.mesh.metadata?.labelHeight ?? 4;
        this.healthBar.billboardMode = Mesh.BILLBOARDMODE_ALL;
        
        const healthMat = new StandardMaterial("healthMat", this.scene);
        healthMat.diffuseColor = new Color3(0, 1, 0);
        healthMat.emissiveColor = new Color3(0, 1, 0);
        healthMat.disableLighting = true;
        this.healthBar.material = healthMat;

        this.scene.onBeforeRenderObservable.add(this.update);
    }

    public updateNetworkState(pos: { x: number, y: number, z: number }, rot: { x: number, y: number, z: number, w: number }) {
        if (this.isDead) return;
        this.targetPosition.set(pos.x, pos.y, pos.z);
        this.targetRotation.set(rot.x, rot.y, rot.z, rot.w);
    }

    private update = () => {
        if (this.scene.metadata?.combatEnded) return;
        if (this.isDead) return;
        // Interpolate position and rotation to smoothly follow network ticks
        this.mesh.position = Vector3.Lerp(this.mesh.position, this.targetPosition, 0.3);
        
        if (this.mesh.rotationQuaternion) {
            this.mesh.rotationQuaternion = Quaternion.Slerp(this.mesh.rotationQuaternion, this.targetRotation, 0.3);
        }

        // Fake visual wheel spin based on movement speed
        const dist = Vector3.Distance(this.mesh.position, this.targetPosition);
        const spinSpeed = dist * 0.2;
        
        this.frontPivots.forEach(pivot => {
            pivot.getChildren().forEach(child => {
                if (child.name.includes("wheel")) {
                    (child as Mesh).rotation.x += spinSpeed;
                }
            });
        });
    }

    public updateHealthBar() {
        if (!this.healthBar || this.isDead) return;
        const ratio = this.health / this.maxHealth;
        this.healthBar.scaling.x = Math.max(ratio, 0.01);
        const mat = this.healthBar.material as StandardMaterial;
        if (ratio < 0.3) {
            mat.emissiveColor = new Color3(1, 0, 0);
            mat.diffuseColor = new Color3(1, 0, 0);
        } else {
            mat.emissiveColor = new Color3(0, 1, 0);
            mat.diffuseColor = new Color3(0, 1, 0);
        }
    }

    public respawnAt(position: Vector3, yaw: number, health: number): void {
        this.cancelAbilityActivation?.();
        this.isDead = false;
        this.health = health;
        this.mesh.position.copyFrom(position);
        this.targetPosition.copyFrom(position);
        const rotation = Quaternion.RotationYawPitchRoll(yaw, 0, 0);
        this.mesh.rotationQuaternion = rotation.clone();
        this.targetRotation.copyFrom(rotation);
        this.mesh.getChildMeshes().forEach(mesh => { mesh.isVisible = true; });
        if (this.healthBar) this.healthBar.isVisible = true;
        this.updateHealthBar();
    }

    public explode() {
        this.cancelAbilityActivation?.();
        if (this.isDead) return;
        this.isDead = true;
        
        VfxManager.getInstance().triggerVehicleDestruction(this.mesh.getAbsolutePosition(), 8);

        this.mesh.getChildMeshes().forEach(m => m.isVisible = false);
        if (this.healthBar) this.healthBar.isVisible = false;

        if (this.serverManagedRespawn) return;

        // Respawn visuals after 3s in local free-roam sessions.
        setTimeout(() => {
            if (this.mesh && !this.scene.isDisposed) {
                this.isDead = false;
                this.health = this.maxHealth;
                this.mesh.getChildMeshes().forEach(m => m.isVisible = true);
                if (this.healthBar) {
                    this.healthBar.isVisible = true;
                    this.updateHealthBar();
                }
            }
        }, 3000);
    }

    private cancelAbilityActivation: (() => void) | null = null;

    public triggerAbility(abilityName: string) {
        if (this.isDead || this.scene.metadata?.combatEnded) return;
        this.cancelAbilityActivation?.();
        this.cancelAbilityActivation = playAbilityActivation(this.mesh, abilityName, () => {
            this.cancelAbilityActivation = null;
            if (abilityName === 'shockwave') this.triggerShockwave();
            else if (abilityName === 'phantom') this.triggerOpticalCamouflage();
            else if (abilityName === 'manticore') this.triggerEMPBurst();
            else if (abilityName === 'valkyrie') this.triggerAfterburnerDash();
            else if (abilityName === 'lightning') this.triggerLightningStrike();
            else if (abilityName === 'wraith') this.triggerGravPulse();
            else if (abilityName === 'behemoth') this.triggerAegisDome();
        }, () => !this.isDead && !this.isEmped && !this.isStunned);
    }

    private triggerEMPBurst() {
        const origin = this.mesh.getAbsolutePosition();
        const radius = 50;
        VfxManager.getInstance().triggerEmpWave(origin, radius);

        // We only EMP local player/bots if they are within radius
        this.scene.meshes.forEach(m => {
            if (m === this.mesh || !m.metadata?.vehicle || !canAffect(this.mesh, m)) return;
            const dist = Vector3.Distance(origin, m.getAbsolutePosition());
            if (dist < radius) {
                const victim = m.metadata.vehicle as VehicleController;
                victim.isEmped = true;
                const pos = m.getAbsolutePosition();
                window.dispatchEvent(new CustomEvent('spawn-status-text', {
                    detail: { x: pos.x, y: pos.y + 4, z: pos.z, text: "EMP JAMMED", color: "#00e5ff" }
                }));
                setTimeout(() => { victim.isEmped = false; }, 4000);
            }
        });
    }

    private triggerAfterburnerDash() {
        const trapOrigin = this.mesh.getAbsolutePosition().clone();
        
        window.dispatchEvent(new CustomEvent('spawn-status-text', {
            detail: { x: trapOrigin.x, y: trapOrigin.y + 4, z: trapOrigin.z, text: "DASHING", color: "#4caf50" }
        }));
        
        VfxManager.getInstance().triggerAfterburner(this.mesh, trapOrigin, 5000);
    }

    private triggerOpticalCamouflage() {
        const pos = this.mesh.getAbsolutePosition();
        VfxManager.getInstance().triggerCloakTransition(pos, true);
        window.dispatchEvent(new CustomEvent('spawn-status-text', {
            detail: { x: pos.x, y: pos.y + 4, z: pos.z, text: "CLOAKED", color: "#a0b4cf" }
        }));

        this.mesh.getChildMeshes().forEach(child => {
            if (child.material) {
                if (child.metadata === null) child.metadata = {};
                if (child.metadata.originalAlpha === undefined) child.metadata.originalAlpha = child.material.alpha;
                const alphaAnim = new Animation("cloakAlpha", "material.alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
                alphaAnim.setKeys([{ frame: 0, value: child.metadata.originalAlpha }, { frame: 30, value: 0.15 }]);
                child.animations = [alphaAnim];
                this.scene.beginAnimation(child, 0, 30, false, 1);
            }
        });

        setTimeout(() => {
            if (this.isDead) return;
            VfxManager.getInstance().triggerCloakTransition(this.mesh.getAbsolutePosition(), false);
            this.mesh.getChildMeshes().forEach(child => {
                if (child.material && child.metadata && child.metadata.originalAlpha !== undefined) {
                    const alphaAnim = new Animation("decloakAlpha", "material.alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
                    alphaAnim.setKeys([{ frame: 0, value: child.material.alpha }, { frame: 30, value: child.metadata.originalAlpha }]);
                    child.animations = [alphaAnim];
                    this.scene.beginAnimation(child, 0, 30, false, 1);
                }
            });
        }, 8000);
    }

    private triggerShockwave() {
        const origin = this.mesh.getAbsolutePosition();
        const radius = 30;
        VfxManager.getInstance().triggerShockwave(origin, radius);

        // Apply Force to local physics objects (local player + bots)
        this.scene.meshes.forEach(m => {
            if (m === this.mesh || !m.metadata?.vehicle || !canAffect(this.mesh, m)) return;
            
            const dist = Vector3.Distance(origin, m.getAbsolutePosition());
            if (dist < radius) {
                const delayMs = (dist / radius) * 500;
                
                setTimeout(() => {
                    if (this.isDead || !m || m.isDisposed()) return;
                    
                    if (m.physicsBody) {
                        const targetMass = m.metadata.vehicle.config?.mass || 1000;
                        const dir = m.getAbsolutePosition().subtract(origin).normalize();
                        
                        const impulse = dir.scale(25 * targetMass).add(new Vector3(0, 15 * targetMass, 0));
                        m.physicsBody.applyImpulse(impulse, m.getAbsolutePosition());
                        m.physicsBody.setAngularVelocity(new Vector3(
                            (Math.random() - 0.5) * 15,
                            (Math.random() - 0.5) * 15,
                            (Math.random() - 0.5) * 15
                        ));

                        if (m.metadata.playerId) { // It's our local player
                            const pos = m.getAbsolutePosition();
                            window.dispatchEvent(new CustomEvent('spawn-status-text', {
                                detail: { x: pos.x, y: pos.y + 4, z: pos.z, text: "AIRBORNE", color: "#ff9800" }
                            }));
                        }
                    }
                }, delayMs);
            }
        });
    }

    private triggerLightningStrike() {
        const origin = this.mesh.getAbsolutePosition();
        let closestMesh: Mesh | null = null;
        let closestDist = 80;

        this.scene.meshes.forEach(m => {
            if (m === this.mesh || !m.metadata || (!m.metadata.vehicle && !m.metadata.playerId && !m.metadata.aiId) || !canAffect(this.mesh, m)) return;
            const dist = Vector3.Distance(origin, m.getAbsolutePosition());
            if (dist < closestDist) {
                const dirToTarget = m.getAbsolutePosition().subtract(origin).normalize();
                if (Vector3.Dot(dirToTarget, this.mesh.forward) > 0.5) {
                    closestDist = dist;
                    closestMesh = m as Mesh;
                }
            }
        });

        if (closestMesh) {
            const targetPos = (closestMesh as Mesh).getAbsolutePosition();
            VfxManager.getInstance().triggerLightningStrike(targetPos);
        }
    }

    private triggerGravPulse() {
        const origin = this.mesh.getAbsolutePosition();
        const radius = 25;

        VfxManager.getInstance().triggerGravityPulse(origin, radius);

        // Effect
        this.scene.meshes.forEach(m => {
            if (m === this.mesh || !m.metadata?.vehicle || !canAffect(this.mesh, m)) return;
            
            const dist = Vector3.Distance(origin, m.getAbsolutePosition());
            if (dist < radius) {
                if (m.physicsBody) {
                    const targetMass = m.metadata.vehicle.config?.mass || 1000;
                    const impulse = new Vector3(0, 30 * targetMass, 0); // Straight up!
                    m.physicsBody.applyImpulse(impulse, m.getAbsolutePosition());
                    m.physicsBody.setAngularVelocity(new Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5));
                    
                    if (m.metadata.playerId) {
                        const pos = m.getAbsolutePosition();
                        window.dispatchEvent(new CustomEvent('spawn-status-text', {
                            detail: { x: pos.x, y: pos.y + 4, z: pos.z, text: "ANTI-GRAV LAUNCH", color: "#4caf50" }
                        }));
                    }
                }
            }
        });
    }

    private triggerAegisDome() {
        VfxManager.getInstance().attachAegisDome(this.mesh, 6000);

        (this as any).hasAegis = true;
        
        setTimeout(() => {
            (this as any).hasAegis = false;
        }, 6000);
    }

    public dispose() {
        this.cancelAbilityActivation?.();
        this.scene.onBeforeRenderObservable.removeCallback(this.update);
        if (this.healthBar) this.healthBar.dispose();
        this.mesh.dispose();
    }
}
