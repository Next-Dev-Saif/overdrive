import { advanceSteering, vehicleHandling } from './VehicleHandling';
import { playAbilityActivation } from '../vfx/AbilityActivation';
import { groundHeight, recoveryHeight } from '../levels/ArenaTerrain';
import { Mesh, Scene, Vector3, PhysicsAggregate, PhysicsShapeType, PhysicsMotionType, PhysicsPrestepType, Quaternion, TransformNode, ParticleSystem, Color3, Color4, Matrix, Animation, StandardMaterial, Ray } from "@babylonjs/core";
import { GraphicsSettingsManager } from "../settings/GraphicsSettingsManager";
import { VfxManager } from "../vfx/VfxManager";
import { SoundManager } from "../engine/SoundManager";
import { canAffect } from "../match/CombatRules";

export interface VehicleConfig {
    mass: number;
    maxSpeed: number;
    steeringSpeed: number;
    driftFactor: number;
    acceleration: number;
    reverseAcceleration: number;
    maxHealth: number;
    width?: number;
    height?: number;
    depth?: number;
    wheelRadius?: number;
}

export class VehicleController {
    public isPlayer = false;
    public serverManagedRespawn = false;
    public readonly vehicleId: string;
    public mesh: Mesh;
    private aggregate: PhysicsAggregate;
    private scene: Scene;
    private config: VehicleConfig;

    // Public inputs that can be driven by Player, AI, or Network
    public throttleInput: number = 0; // 1 (forward) to -1 (reverse)
    public steerInput: number = 0;    // 1 (right) to -1 (left)

    private frontPivots: TransformNode[] = [];
    private allWheels: Mesh[] = [];
    private wheelSpin = 0;
    private steeringAngle = 0;
    
    // Procedural suspension
    private chassisNode: TransformNode | null = null;
    private targetPitch = 0;
    private targetRoll = 0;
    private lastSpeed = 0;
    private tireSmoke: ParticleSystem;
    private exhaustFlames: ParticleSystem;
    private windTrails: ParticleSystem;

    // Health System
    public health: number = 100;
    public maxHealth: number = 100;
    public isDead: boolean = false;
    public respawnProtectedUntil = 0;
    public isFlipped: boolean = false;
    public isStunned: boolean = false; // Added strict type
    private healthBar: Mesh | null = null;

    constructor(mesh: Mesh, scene: Scene, config: VehicleConfig, vehicleId = 'interceptor') {
        this.mesh = mesh;
        this.scene = scene;
        this.config = config;
        this.vehicleId = vehicleId;

        // Ensure the mesh has a rotation quaternion, not just Euler angles
        if (!this.mesh.rotationQuaternion) {
            this.mesh.rotationQuaternion = Quaternion.FromEulerVector(this.mesh.rotation);
        }

        if (this.config.maxHealth) {
            this.maxHealth = this.config.maxHealth;
            this.health = this.maxHealth;
        }

        // Initialize Havok Physics for this mesh
        this.aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.BOX, { 
            mass: this.config.mass, 
            friction: 0.25, 
            restitution: 0.05,
            extents: new Vector3(this.config.width, this.config.height, this.config.depth)
        }, this.scene);
        
        this.configureHandlingBody();

        // Initialize Health Bar Mesh
        import("@babylonjs/core").then(({ MeshBuilder, StandardMaterial, Color3 }) => {
            this.healthBar = MeshBuilder.CreatePlane("healthBar", { width: 4, height: 0.4 }, this.scene);
            this.healthBar.parent = this.mesh;
            this.healthBar.position.y = this.mesh.metadata?.labelHeight ?? 4;
            this.healthBar.billboardMode = Mesh.BILLBOARDMODE_ALL;
            
            const healthMat = new StandardMaterial("healthMat", this.scene);
            healthMat.diffuseColor = new Color3(0, 1, 0);
            healthMat.emissiveColor = new Color3(0, 1, 0);
            healthMat.disableLighting = true;
            this.healthBar.material = healthMat;
        });

        // Initialize tire smoke VFX (Exhaust)
        const exhaustNode = new TransformNode("exhaust", this.scene);
        exhaustNode.parent = this.mesh;
        // Position at the bottom rear of the chassis
        const chassisHeight = this.config.height || 1.0;
        const chassisDepth = this.config.depth || 4.5;
        exhaustNode.position = new Vector3(0, -chassisHeight / 2 + 0.2, -chassisDepth / 2 - 0.2);

        this.tireSmoke = new ParticleSystem("tireSmoke", 500, this.scene);
        this.tireSmoke.particleTexture = VfxManager.getInstance().getSmokeTexture();
        this.tireSmoke.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        this.tireSmoke.emitter = exhaustNode as any;
        this.tireSmoke.createSphereEmitter(0.5, 0.1);
        this.tireSmoke.color1 = new Color4(0.4, 0.35, 0.3, 0.4); // Less opaque
        this.tireSmoke.color2 = new Color4(0.2, 0.15, 0.1, 0.1);
        this.tireSmoke.colorDead = new Color4(0, 0, 0, 0);
        this.tireSmoke.minSize = 0.5;
        this.tireSmoke.maxSize = 2.0;
        this.tireSmoke.minLifeTime = 0.5;
        this.tireSmoke.maxLifeTime = 1.0;
        this.tireSmoke.emitRate = 0; // Dynamic based on speed/drift
        this.tireSmoke.gravity = new Vector3(0, 0.5, 0); // Smoke rises slowly
        this.tireSmoke.start();

        // Exhaust Flames
        this.exhaustFlames = new ParticleSystem("exhaustFlames", 200, this.scene);
        this.exhaustFlames.particleTexture = VfxManager.getInstance().getFireTexture();
        this.exhaustFlames.blendMode = ParticleSystem.BLENDMODE_ADD; // Fix rectangles
        this.exhaustFlames.emitter = exhaustNode as any;
        this.exhaustFlames.createPointEmitter(new Vector3(0, 0, -1), new Vector3(0, 0, -1)); // Shoot backwards
        this.exhaustFlames.color1 = new Color4(1.0, 0.6, 0.1, 0.8); // Realistic orange fire
        this.exhaustFlames.color2 = new Color4(1.0, 0.2, 0.0, 0.3); // Fading to red
        this.exhaustFlames.colorDead = new Color4(0.1, 0.0, 0.0, 0);
        this.exhaustFlames.minSize = 0.3;
        this.exhaustFlames.maxSize = 0.8;
        this.exhaustFlames.minLifeTime = 0.05;
        this.exhaustFlames.maxLifeTime = 0.15;
        this.exhaustFlames.minEmitPower = 5;
        this.exhaustFlames.maxEmitPower = 15;
        this.exhaustFlames.emitRate = 0; 
        this.exhaustFlames.start();

        // High-Speed Wind Trails
        this.windTrails = new ParticleSystem("windTrails", 300, this.scene);
        this.windTrails.particleTexture = VfxManager.getInstance().getSmokeTexture();
        this.windTrails.blendMode = ParticleSystem.BLENDMODE_ADD; // Fix rectangles
        this.windTrails.emitter = this.mesh;
        this.windTrails.createBoxEmitter(new Vector3(0, 0, -1), new Vector3(0, 0, -1), new Vector3(-2, 0, 0), new Vector3(2, 2, 2));
        this.windTrails.color1 = new Color4(0.8, 0.8, 0.8, 0.3);
        this.windTrails.color2 = new Color4(0.6, 0.6, 0.6, 0.1);
        this.windTrails.colorDead = new Color4(0, 0, 0, 0);
        this.windTrails.minSize = 0.2;
        this.windTrails.maxSize = 0.8;
        this.windTrails.minLifeTime = 0.2;
        this.windTrails.maxLifeTime = 0.5;
        this.windTrails.minEmitPower = 20;
        this.windTrails.maxEmitPower = 40;
        this.windTrails.emitRate = 0;
        this.windTrails.start();

        // We register to Babylon's before render loop to process physics
        this.scene.onBeforeRenderObservable.add(this.update);
    }

    /** Keep centre of mass and damping consistent after both initial spawn and respawn. */
    private configureHandlingBody(): void {
        const body = this.aggregate.body;
        body.setMotionType(PhysicsMotionType.DYNAMIC);
        if (body.shape) body.shape.isTrigger = false;
        body.setMassProperties({ mass: this.config.mass, centerOfMass: new Vector3(0, -(this.config.height ?? 1) * .22, 0) });
        body.setLinearDamping(.025);
        body.setAngularDamping(.65);
        this.steeringAngle = 0;
        this.lastSpeed = 0;
    }

    public attachVisuals() {
        // Find wheels and chassis for visual rotation (must be called after Factory builds the visual mesh)
        this.mesh.getChildTransformNodes(false).forEach(node => {
            const name = node.name.toLowerCase();
            
            if (name === "chassisroot") {
                this.chassisNode = node;
                this.chassisNode.rotationQuaternion = null; // Free Euler rotation
            }
            
            if (name.includes("wheelpivot0") || name.includes("wheelpivot1")) {
                node.rotationQuaternion = null;
                this.frontPivots.push(node);
            }
        });
        
        this.mesh.getChildMeshes(false).forEach(m => {
            const name = m.name.toLowerCase();
            if (name.includes("wheel") || name.includes("w_rubber") || name.includes("w_disk")) {
                m.rotationQuaternion = null;
                this.allWheels.push(m as Mesh);
                
                if (name.includes("front_w")) {
                    this.frontPivots.push(m);
                }
            }
        });
    }

    private update = () => {
        if (this.scene.metadata?.combatEnded) return;
        if (this.isDead || !this.aggregate || !this.aggregate.body) {
            if (this.isPlayer) SoundManager.getInstance().stopEngineSound();
            return;
        }

        const correctedY = recoveryHeight(this.scene, this.mesh, (this.config.height || 1) / 2);
        if (correctedY !== null) {
            this.mesh.position.y = correctedY;
            this.mesh.computeWorldMatrix(true);
            const body = this.aggregate.body;
            body.setPrestepType(PhysicsPrestepType.TELEPORT);
            const velocity = body.getLinearVelocity();
            velocity.y = Math.max(0, velocity.y);
            body.setLinearVelocity(velocity);
            this.scene.onAfterPhysicsObservable.addOnce(() => {
                if (!body.isDisposed) body.setPrestepType(PhysicsPrestepType.DISABLED);
            });
        }

        // 0. Kill Z Boundary (Failsafe outside the arena)
        if (this.mesh.position.y < -20) {
            this.health = 0;
            this.explode();
            return;
        }

        const dt = Math.min(this.scene.getEngine().getDeltaTime() / 1000, 1 / 30);
        
        // 1. Get current physical states
        let currentLinVel = new Vector3();
        this.aggregate.body.getLinearVelocityToRef(currentLinVel);

        // --- ANTI-TUNNELING VELOCITY CAP ---
        // Clamp terminal fall velocity so the physics box never moves more than
        // what discrete collision detection can handle on a 0-thickness mesh.
        // -15 m/s ensures the vehicle moves max ~0.25m per frame at 60fps.
        const terminalVelocity = -15;
        if (currentLinVel.y < terminalVelocity) {
            currentLinVel.y = terminalVelocity;
            this.aggregate.body.setLinearVelocity(currentLinVel);
        }

        const currentAngVel = new Vector3();
        this.aggregate.body.getAngularVelocityToRef(currentAngVel);

        // 2. Calculate Directional Vectors
        const rotationMatrix = new Matrix();
        this.mesh.rotationQuaternion!.toRotationMatrix(rotationMatrix);
        
        const forward = Vector3.TransformNormal(Vector3.Forward(), rotationMatrix);
        const up = Vector3.TransformNormal(Vector3.Up(), rotationMatrix);
        
        const flatForward = new Vector3(forward.x, 0, forward.z).normalize();
        const flatRight = Vector3.Cross(Vector3.Up(), flatForward).normalize();
        const forwardSpeed = Vector3.Dot(currentLinVel, flatForward);
        const rightSpeed = Vector3.Dot(currentLinVel, flatRight);
        this.isFlipped = up.y < .5;
        const disabled = this.isStunned || this.isEmped || this.isFlipped;
        const steer = disabled ? 0 : Math.max(-1, Math.min(1, this.steerInput));
        const activeThrottle = disabled ? 0 : Math.max(-1, Math.min(1, this.throttleInput));
        this.steeringAngle = advanceSteering(this.config, this.steeringAngle, steer, forwardSpeed, dt);

        // Contact probes cover the axles on crests. Distant ground no longer enables mid-air steering.
        const halfHeight = (this.config.height ?? 1) / 2;
        const position = this.mesh.getAbsolutePosition();
        let contactNormal: Vector3 | null = null;
        for (const axle of [0, -.3, .3]) {
            const origin = position.add(forward.scale((this.config.depth ?? 4.5) * axle));
            const hit = this.scene.pickWithRay(new Ray(origin, Vector3.Down(), halfHeight + .4),
                m => m.isEnabled() && m.isVisible && !m.metadata?.presentationOnly &&
                    (m.metadata?.terrain === true || Boolean(m.physicsBody)) && m !== this.mesh && !m.isDescendantOf(this.mesh), false);
            const normal = hit?.hit ? hit.getNormal(true) : null;
            if (normal && normal.y > .45) { contactNormal = normal.normalize(); break; }
        }
        const isGrounded = contactNormal !== null;
        if (contactNormal && !disabled) {
            const surfaceForward = forward.subtract(contactNormal.scale(Vector3.Dot(forward, contactNormal))).normalize();
            const surfaceRight = Vector3.Cross(contactNormal, surfaceForward).normalize();
            const speed = Vector3.Dot(currentLinVel, surfaceForward);
            const lateralSpeed = Vector3.Dot(currentLinVel, surfaceRight);
            const yawSpeed = Vector3.Dot(currentAngVel, contactNormal);
            const response = vehicleHandling(this.config, speed, lateralSpeed, yawSpeed, this.steeringAngle, activeThrottle, dt);
            const mass = this.config.mass;
            // Apply tire forces through the lowered centre of mass, avoiding artificial pitching torque.
            const center = position.subtract(up.scale((this.config.height ?? 1) * .22));
            const impulse = surfaceForward.scale(response.driveDelta).add(surfaceRight.scale(response.lateralDelta)).scale(mass);
            this.aggregate.body.applyImpulse(impulse, center);
            const inertia = mass * ((this.config.width ?? 2) ** 2 + (this.config.depth ?? 4.5) ** 2) / 12;
            this.aggregate.body.applyAngularImpulse(contactNormal.scale(response.yawDelta * inertia));
        }
        // Havok owns collision rotation and airborne momentum. No per-frame yaw overwrite.

        // 6. Visual Tire Updates & Chassis Roll
        this.wheelSpin += (forwardSpeed * dt) / (this.config.wheelRadius ?? 0.6);
        
        // Smoothly lerp visual steering
        this.frontPivots.forEach(pivot => {
            pivot.rotation.y += (this.steeringAngle - pivot.rotation.y) * (1 - Math.exp(-dt * 14));
        });

        this.allWheels.forEach(wheel => {
            wheel.rotation.x = this.wheelSpin;
        });

        // Chassis Pitch and Roll (Procedural Suspension)
        if (this.chassisNode) {
            // Acceleration/Braking Pitch
            const accel = dt > 0 ? (forwardSpeed - this.lastSpeed) / dt : 0;
            this.lastSpeed = forwardSpeed;
            
            // Accelerating -> nose up (negative pitch). Braking -> nose dive (positive pitch)
            let desiredPitch = -accel * 0.003; 
            desiredPitch = Math.max(-0.06, Math.min(0.08, desiredPitch)); // Cap angles
            
            // Steering Roll
            // Turning right (steer > 0) -> body rolls left (negative Z)
            let desiredRoll = currentAngVel.y * forwardSpeed * .008;
            desiredRoll = Math.max(-0.12, Math.min(0.12, desiredRoll));
            
            // Lerp current pitch/roll to desired
            this.targetPitch += (desiredPitch - this.targetPitch) * dt * 5;
            this.targetRoll += (-desiredRoll - this.targetRoll) * dt * 5;
            
            this.chassisNode.rotation.x = this.targetPitch;
            this.chassisNode.rotation.z = this.targetRoll;
        }

        // 7. Update VFX
        const speedKmh = currentLinVel.length() * 3.6;
        const driftAmount = Math.abs(rightSpeed);
        const pMult = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        
        // Emit smoke if going fast or drifting heavily
        if (speedKmh > 20 || driftAmount > 5) {
            this.tireSmoke.emitRate = (speedKmh * 2 + driftAmount * 10) * pMult;
        } else {
            this.tireSmoke.emitRate = 0;
        }

        // Emit exhaust flames if accelerating
        if (isGrounded && this.throttleInput > 0 && !this.isStunned && !this.isEmped) {
            this.exhaustFlames.emitRate = 200 * this.throttleInput * pMult;
        } else {
            this.exhaustFlames.emitRate = 0;
        }

        // Wind trails at high speed
        if (speedKmh > this.config.maxSpeed * 0.7) {
            this.windTrails.emitRate = ((speedKmh - this.config.maxSpeed * 0.7) * 10) * pMult;
        } else {
            this.windTrails.emitRate = 0;
        }
        
        // 8. Update Audio
        if (this.isPlayer) {
            SoundManager.getInstance().updateEngineSound(speedKmh, Math.abs(this.throttleInput) > 0);
        }
    }

    public getSpeed(): number {
        if (this.isDead || !this.aggregate || !this.aggregate.body) return 0;
        let currentLinVel = new Vector3();
        this.aggregate.body.getLinearVelocityToRef(currentLinVel);
        // Convert m/s to km/h
        return currentLinVel.length() * 3.6;
    }

    private dealDamage(target: Mesh, amount: number, effectId: string): void {
        if (!canAffect(this.mesh, target)) return;
        const targetId = target.metadata?.entityId ?? target.metadata?.playerId ?? target.metadata?.aiId;
        if (this.mesh.metadata?.teamId && targetId) {
            window.dispatchEvent(new CustomEvent('send-hit', { detail: {
                targetId,
                damage: amount,
                attackerId: this.mesh.metadata.entityId ?? this.mesh.metadata.playerId ?? this.mesh.metadata.aiId,
                weaponId: effectId,
            } }));
            return;
        }
        if (target.metadata?.vehicle?.applyDamage) target.metadata.vehicle.applyDamage(amount, target.getAbsolutePosition());
    }

    public applyDamage(amount: number, point?: Vector3) {
        if (this.isDead || Date.now() < this.respawnProtectedUntil) return;
        
        if ((this as any).hasAegis) {
            // Absorb damage
            if (point) {
                window.dispatchEvent(new CustomEvent('spawn-status-text', { 
                    detail: { x: point.x, y: point.y + 2, z: point.z, text: "ABSORBED", color: "#ffc107" } 
                }));
            }
            return;
        }

        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        if (this.mesh.metadata?.playerId) {
            window.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: amount > 15 ? 1.5 : 0.5, duration: 250 } }));
        }
        
        if (point) {
            window.dispatchEvent(new CustomEvent('spawn-damage', { 
                detail: { x: point.x, y: point.y, z: point.z, damage: amount, isCrit: amount > 30 } 
            }));
        }

        if (this.healthBar) {
            const ratio = this.health / this.maxHealth;
            this.healthBar.scaling.x = Math.max(ratio, 0.01);
            if (ratio < 0.3) {
                (this.healthBar.material as any).emissiveColor = new Color3(1, 0, 0);
                (this.healthBar.material as any).diffuseColor = new Color3(1, 0, 0);
            }
        }

        if (this.health <= 0) {
            this.explode();
        }
    }

    /** Applies server health without manufacturing a zero-damage hit. */
    public syncAuthoritativeHealth(health: number): void {
        this.health = Math.max(0, Math.min(this.maxHealth, health));
        if (this.healthBar) {
            const ratio = this.health / this.maxHealth;
            this.healthBar.scaling.x = Math.max(ratio, 0.01);
            const color = ratio < 0.3 ? new Color3(1, 0, 0) : new Color3(0, 1, 0);
            (this.healthBar.material as StandardMaterial).emissiveColor = color;
            (this.healthBar.material as StandardMaterial).diffuseColor = color;
        }
        if (this.health <= 0 && !this.isDead) this.explode();
    }

    private explode() {
        this.cancelAbilityActivation?.();
        this.isDead = true;
        this.aggregate.dispose();
        
        if (this.isPlayer) SoundManager.getInstance().stopEngineSound();
        
        // Use VfxManager for realistic explosion
        VfxManager.getInstance().triggerVehicleDestruction(this.mesh.getAbsolutePosition(), 8.0);
        SoundManager.getInstance().playExplosion(this.mesh.getAbsolutePosition());

        // Hide mesh components
        this.mesh.getChildMeshes().forEach(m => m.isVisible = false);
        if (this.healthBar) this.healthBar.isVisible = false;
        
        if (this.serverManagedRespawn) {
            if (this.isPlayer) window.dispatchEvent(new CustomEvent('request-player-respawn'));
            return;
        }

        setTimeout(() => {
            if (this.mesh && !this.scene.isDisposed) {
                const x = Math.random() * 200 - 100, z = Math.random() * 200 - 100;
                this.respawnAt(new Vector3(x, (groundHeight(this.scene, x, z) ?? 0) + (this.config.height || 1) / 2 + 1, z), 0);
            }
        }, 3000);
    }

    /** Restores a destroyed vehicle at an authoritative team spawn. */
    public respawnAt(position: Vector3, yaw: number): void {
        this.cancelAbilityActivation?.();
        if (!this.aggregate.body?.isDisposed) this.aggregate.dispose();
        this.mesh.position.copyFrom(position);
        const surface = groundHeight(this.scene, position.x, position.z);
        if (surface !== null) this.mesh.position.y = Math.max(position.y, surface + (this.config.height ?? 1) / 2 + 0.25);
        this.mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(yaw, 0, 0);
        this.health = this.maxHealth;
        this.isDead = false;
        this.isEmped = false;
        this.isStunned = false;
        this.mesh.getChildMeshes().forEach(mesh => { mesh.isVisible = true; });
        if (this.healthBar) {
            this.healthBar.isVisible = true;
            this.healthBar.scaling.x = 1;
            (this.healthBar.material as StandardMaterial).emissiveColor = new Color3(0, 1, 0);
            (this.healthBar.material as StandardMaterial).diffuseColor = new Color3(0, 1, 0);
        }
        this.aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.BOX, {
            mass: this.config.mass,
            friction: 0.25,
            restitution: 0.05,
            extents: new Vector3(this.config.width, this.config.height, this.config.depth),
        }, this.scene);
        this.configureHandlingBody();
        this.aggregate.body.setLinearVelocity(Vector3.Zero());
        this.aggregate.body.setAngularVelocity(Vector3.Zero());
    }

    public grantRespawnProtection(until: number): void {
        this.respawnProtectedUntil = until;
        window.dispatchEvent(new CustomEvent('spawn-status-text', {
            detail: {
                x: this.mesh.position.x,
                y: this.mesh.position.y + 3,
                z: this.mesh.position.z,
                text: 'RESPAWN SHIELD',
                color: '#67d5df',
            },
        }));
    }

    public dispose() {
        this.cancelAbilityActivation?.();
        this.scene.onBeforeRenderObservable.removeCallback(this.update);
        this.tireSmoke.dispose(false);
        this.exhaustFlames.dispose(false);
        this.windTrails.dispose(false);
        if (this.healthBar) this.healthBar.dispose();
    }

    // --- Special Abilities ---
    private cancelAbilityActivation: (() => void) | null = null;
    public lastAbilityTime = 0;
    public isCloaked = false;
    public isEmped = false; // New status for Manticore EMP
    
    public getAbilityCooldown(): number {
        if (this.mesh.name.includes("juggernaut")) return 10000;
        if (this.mesh.name.includes("phantom")) return 12000;
        if (this.mesh.name.includes("manticore")) return 15000;
        if (this.mesh.name.includes("valkyrie")) return 10000;
        if (this.mesh.name.includes("wraith")) return 10000;
        if (this.mesh.name.includes("behemoth")) return 18000;
        return 8000; // Interceptor
    }

    public triggerAbility() {
        if (this.isDead || this.isEmped || this.isStunned || this.scene.metadata?.combatEnded) return;
        const now = performance.now();
        if (now - this.lastAbilityTime < this.getAbilityCooldown()) return;
        this.lastAbilityTime = now;
        const abilityName = this.vehicleId === 'interceptor' ? 'lightning' : this.vehicleId === 'juggernaut' ? 'shockwave' : this.vehicleId;
        this.cancelAbilityActivation?.();
        this.cancelAbilityActivation = playAbilityActivation(this.mesh, abilityName, () => {
            this.cancelAbilityActivation = null;
            if (abilityName === 'shockwave') this.triggerShockwave();
            else if (abilityName === 'phantom') this.triggerOpticalCamouflage();
            else if (abilityName === 'manticore') this.triggerEMPBurst();
            else if (abilityName === 'valkyrie') this.triggerAfterburnerDash();
            else if (abilityName === 'wraith') this.triggerGravPulse();
            else if (abilityName === 'behemoth') this.triggerAegisDome();
            else this.triggerLightningStrike();
        }, () => !this.isDead && !this.isEmped && !this.isStunned);
        // Broadcast the wind-up start so remote vehicles do not add a second delay.
        this.broadcastAbility(abilityName);
    }

    private broadcastAbility(abilityName: string): void {
        window.dispatchEvent(new CustomEvent('send-ability-used', { detail: {
            abilityName,
            actorId: this.mesh.metadata?.entityId ?? this.mesh.metadata?.playerId ?? this.mesh.metadata?.aiId,
        } }));
    }

    private triggerEMPBurst() {
        const origin = this.mesh.getAbsolutePosition();
        const radius = 50;

        VfxManager.getInstance().triggerEmpWave(origin, radius);

        // Effect
        this.scene.meshes.forEach(m => {
            if (m === this.mesh || !m.metadata || (!m.metadata.vehicle && !m.metadata.playerId && !m.metadata.aiId) || !canAffect(this.mesh, m)) return;
            
            const dist = Vector3.Distance(origin, m.getAbsolutePosition());
            if (dist < radius) {
                if (m.metadata.vehicle) {
                    const victim = m.metadata.vehicle as VehicleController;
                    victim.isEmped = true;
                    
                    const pos = m.getAbsolutePosition();
                    window.dispatchEvent(new CustomEvent('spawn-status-text', {
                        detail: { x: pos.x, y: pos.y + 4, z: pos.z, text: "EMP JAMMED", color: "#00e5ff" }
                    }));

                    setTimeout(() => {
                        victim.isEmped = false;
                    }, 4000);
                }
            }
        });
    }

    private triggerAfterburnerDash() {
        if (this.mesh.metadata?.playerId) {
            window.dispatchEvent(new CustomEvent('dash-warp'));
            window.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 1.5, duration: 300 } }));
        }

        // Valkyrie Dash (Fast forward impulse + leave fire trail)
        const flatForward = new Vector3(this.mesh.forward.x, 0, this.mesh.forward.z).normalize();
        if (this.aggregate.body) {
            // Zero out any upward momentum to prevent flying
            const currentVel = new Vector3();
            this.aggregate.body.getLinearVelocityToRef(currentVel);
            if (currentVel.y > 0) currentVel.y = 0; 
            
            // Limit current horizontal speed before applying impulse so it doesn't exponentially stack
            currentVel.x *= 0.5;
            currentVel.z *= 0.5;
            this.aggregate.body.setLinearVelocity(currentVel);

            // Apply a strong but controlled horizontal impulse (60 m/s burst instead of 80)
            const mass = this.config.mass;
            const dashImpulse = flatForward.scale(60 * mass); 
            this.aggregate.body.applyImpulse(dashImpulse, this.mesh.getAbsolutePosition());
            
        }

        // Leave plasma fire trap where we started
        const trapOrigin = this.mesh.getAbsolutePosition().clone();
        
        window.dispatchEvent(new CustomEvent('spawn-status-text', {
            detail: { x: trapOrigin.x, y: trapOrigin.y + 4, z: trapOrigin.z, text: "DASHING", color: "#4caf50" }
        }));
        
        VfxManager.getInstance().triggerAfterburner(this.mesh, trapOrigin, 5000);
        const trapAnchor = new TransformNode('afterburner-hazard-anchor', this.scene);
        trapAnchor.position.copyFrom(trapOrigin);

        // Animate out after 5s
        setTimeout(() => {
            if (!trapAnchor.isDisposed()) {
                trapAnchor.dispose();
            }
        }, 5000);
        
        // Damage tick
        const tickInterval = setInterval(() => {
            if (trapAnchor.isDisposed() || this.isDead) {
                clearInterval(tickInterval);
                return;
            }
            this.scene.meshes.forEach(m => {
                if (m === this.mesh || !canAffect(this.mesh, m)) return;
                
                const dist = Vector3.Distance(trapAnchor.position, m.getAbsolutePosition());
                if (dist < 4) {
                    this.dealDamage(m as Mesh, 5, 'afterburner');
                }
            });
        }, 500);
    }

    private triggerOpticalCamouflage() {
        // Optical Camouflage (Phantom) - Become transparent and untargetable for 8 seconds
        this.isCloaked = true;

        const pos = this.mesh.getAbsolutePosition();
        VfxManager.getInstance().triggerCloakTransition(pos, true);
        window.dispatchEvent(new CustomEvent('spawn-status-text', {
            detail: { x: pos.x, y: pos.y + 4, z: pos.z, text: "CLOAKED", color: "#a0b4cf" }
        }));

        // Visuals: Make chassis transparent
        this.mesh.getChildMeshes().forEach(child => {
            if (child.material) {
                // Save original alpha in metadata if not already saved
                if (child.metadata === null) child.metadata = {};
                if (child.metadata.originalAlpha === undefined) {
                    child.metadata.originalAlpha = child.material.alpha;
                }
                
                const alphaAnim = new Animation("cloakAlpha", "material.alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
                alphaAnim.setKeys([
                    { frame: 0, value: child.metadata.originalAlpha },
                    { frame: 30, value: 0.15 } // 15% opacity
                ]);
                child.animations = [alphaAnim];
                this.scene.beginAnimation(child, 0, 30, false, 1);
            }
        });

        // End cloak after 8 seconds
        setTimeout(() => {
            if (this.isDead) return;
            this.isCloaked = false;
            VfxManager.getInstance().triggerCloakTransition(this.mesh.getAbsolutePosition(), false);

            this.mesh.getChildMeshes().forEach(child => {
                if (child.material && child.metadata && child.metadata.originalAlpha !== undefined) {
                    const alphaAnim = new Animation("decloakAlpha", "material.alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
                    alphaAnim.setKeys([
                        { frame: 0, value: child.material.alpha },
                        { frame: 30, value: child.metadata.originalAlpha }
                    ]);
                    child.animations = [alphaAnim];
                    this.scene.beginAnimation(child, 0, 30, false, 1);
                }
            });
        }, 8000);
    }

    private triggerShockwave() {
        // Shockwave (Juggernaut) - Throw everything nearby away
        const origin = this.mesh.getAbsolutePosition();
        
        if (this.mesh.metadata?.playerId) {
            window.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 3.0, duration: 600 } }));
        }

        const radius = 30;
        VfxManager.getInstance().triggerShockwave(origin, radius);

        // Physics/Damage Effect
        this.scene.meshes.forEach(m => {
            if (m === this.mesh || !m.metadata || (!m.metadata.vehicle && !m.metadata.playerId && !m.metadata.aiId) || !canAffect(this.mesh, m)) return;
            
            const dist = Vector3.Distance(origin, m.getAbsolutePosition());
            if (dist < radius) {
                // Calculate delay based on distance so they get hit exactly when the visual ring touches them
                const delayMs = (dist / radius) * 500; // 30 frames at 60fps = 500ms
                
                setTimeout(() => {
                    if (this.isDead || !m || m.isDisposed()) return;
                    
                    // Apply Medium Damage
                    this.dealDamage(m as Mesh, 20, 'shockwave');
                    
                    if (m.metadata?.vehicle) {
                        (m.metadata.vehicle as any).isBlasted = true;
                        setTimeout(() => { if (m.metadata?.vehicle) (m.metadata.vehicle as any).isBlasted = false; }, 3000);
                    }

                    // Apply Force (Send them flying and flipping)
                    if (m.physicsBody) {
                        const targetMass = m.metadata?.vehicle?.config?.mass || 1000;
                        const dir = m.getAbsolutePosition().subtract(origin).normalize();
                        
                        // Scale impulse by target mass so all vehicles are launched similarly
                        // Approx 25 m/s horizontal, 15 m/s vertical
                        const impulse = dir.scale(25 * targetMass).add(new Vector3(0, 15 * targetMass, 0));
                        m.physicsBody.applyImpulse(impulse, m.getAbsolutePosition());
                        m.physicsBody.setAngularVelocity(new Vector3(
                            (Math.random() - 0.5) * 15,
                            (Math.random() - 0.5) * 15,
                            (Math.random() - 0.5) * 15
                        ));

                        const pos = m.getAbsolutePosition();
                        window.dispatchEvent(new CustomEvent('spawn-status-text', {
                            detail: { x: pos.x, y: pos.y + 4, z: pos.z, text: "AIRBORNE", color: "#ff9800" }
                        }));
                    }
                }, delayMs);
            }
        });
    }

    private triggerLightningStrike() {
        // Lightning Strike (Interceptor) - Stun nearest enemy in front
        const origin = this.mesh.getAbsolutePosition();
        let closestMesh: Mesh | null = null;
        let closestDist = 80;

        this.scene.meshes.forEach(m => {
            if (m === this.mesh || !m.metadata || (!m.metadata.vehicle && !m.metadata.playerId && !m.metadata.aiId) || !canAffect(this.mesh, m)) return;
            
            const dist = Vector3.Distance(origin, m.getAbsolutePosition());
            if (dist < closestDist) {
                // Check if roughly in front
                const dirToTarget = m.getAbsolutePosition().subtract(origin).normalize();
                const forward = this.mesh.forward;
                if (Vector3.Dot(dirToTarget, forward) > 0.5) {
                    closestDist = dist;
                    closestMesh = m as Mesh;
                }
            }
        });

        if (closestMesh) {
            const targetPos = (closestMesh as Mesh).getAbsolutePosition();
            VfxManager.getInstance().triggerLightningStrike(targetPos);

            // Damage and Stun
            this.dealDamage(closestMesh as Mesh, 25, 'lightning');
            const vehicle = (closestMesh as Mesh).metadata?.vehicle as VehicleController | undefined;
            vehicle?.stun(3000);
        }
    }

    private triggerGravPulse() {
        const origin = this.mesh.getAbsolutePosition();
        const radius = 40;

        VfxManager.getInstance().triggerGravityPulse(origin, radius);

        // Effect
        this.scene.meshes.forEach(m => {
            if (m === this.mesh || !m.metadata || (!m.metadata.vehicle && !m.metadata.playerId && !m.metadata.aiId) || !canAffect(this.mesh, m)) return;
            
            const dist = Vector3.Distance(origin, m.getAbsolutePosition());
            if (dist < radius) {
                // Launch them up!
                if (m.physicsBody) {
                    if (m.metadata?.vehicle) {
                        (m.metadata.vehicle as any).isBlasted = true;
                        setTimeout(() => { if (m.metadata?.vehicle) (m.metadata.vehicle as any).isBlasted = false; }, 3000);
                    }

                    const targetMass = m.metadata?.vehicle?.config?.mass || 1000;
                    const impulse = new Vector3(0, 30 * targetMass, 0); // Straight up!
                    m.physicsBody.applyImpulse(impulse, m.getAbsolutePosition());
                    m.physicsBody.setAngularVelocity(new Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5));
                    
                    const pos = m.getAbsolutePosition();
                    window.dispatchEvent(new CustomEvent('spawn-status-text', {
                        detail: { x: pos.x, y: pos.y + 4, z: pos.z, text: "ANTI-GRAV LAUNCH", color: "#4caf50" }
                    }));
                }
            }
        });
    }

    private triggerAegisDome() {
        const origin = this.mesh.getAbsolutePosition();
        VfxManager.getInstance().attachAegisDome(this.mesh, 6000);

        (this as any).hasAegis = true;
        
        window.dispatchEvent(new CustomEvent('spawn-status-text', {
            detail: { x: origin.x, y: origin.y + 6, z: origin.z, text: "AEGIS SHIELD ONLINE", color: "#ffc107" }
        }));

        setTimeout(() => {
            (this as any).hasAegis = false;

            window.dispatchEvent(new CustomEvent('spawn-status-text', {
                detail: { x: this.mesh.position.x, y: this.mesh.position.y + 6, z: this.mesh.position.z, text: "SHIELD EXPIRED", color: "#ff0000" }
            }));
        }, 6000);
    }

    public stun(durationMs: number) {
        if (this.isDead) return;
        
        // Add a visual indicator (sparks)
        const particleMultiplier = GraphicsSettingsManager.getInstance().getConfig().particleLimitMultiplier;
        const sparks = particleMultiplier > 0 ? new ParticleSystem("sparks", Math.round(50 * particleMultiplier), this.scene) : null;
        if (sparks) {
            sparks.particleTexture = VfxManager.getInstance().getFlareTexture();
            sparks.emitter = this.mesh;
            sparks.color1 = new Color4(0.2, 0.6, 1, 1);
            sparks.color2 = new Color4(0.1, 0.3, 1, 0.8);
            sparks.emitRate = 100 * particleMultiplier;
            sparks.minLifeTime = 0.1;
            sparks.maxLifeTime = 0.3;
            sparks.gravity = new Vector3(0, -5, 0);
            sparks.start();
        }

        // Kill throttle and steering temporarily
        this.throttleInput = 0;
        this.steerInput = 0;
        
        // Actually we need a boolean to lock inputs so GameEngine doesn't override it immediately
        this.isStunned = true;

        setTimeout(() => {
            this.isStunned = false;
            sparks?.dispose(false);
        }, durationMs);
    }
}
