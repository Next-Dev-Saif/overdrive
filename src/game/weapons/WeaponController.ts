import { Scene, Mesh, Vector3, Ray, StandardMaterial, Color3, MeshBuilder, TransformNode, ParticleSystem, Texture, Color4 } from "@babylonjs/core";
import { NetworkManager } from "../../network/NetworkManager";
import { VfxManager, type WeaponVfxKind } from "../vfx/VfxManager";
import { SoundManager } from "../engine/SoundManager";
import { canAffect, getCombatantMetadata, isAuthoritativeBotSource } from "../match/CombatRules";
import { isProjectileCollisionCandidate } from './ProjectileCollision';

export interface WeaponConfig {
    fireRateMs: number;
    damage: number;
    range: number;
    tracerColor: Color3;
}

export class WeaponController {
    public controlsEnabled = true;
    private scene: Scene;
    private ownerMesh: Mesh;
    public ownerId: string;
    private networkManager: NetworkManager | null;
    private isPlayer: boolean;
    public readonly weaponId: string;

    private config: WeaponConfig;
    private lastFireTime: number = 0;
    private barrels: Mesh[] = [];
    private muzzleSockets: TransformNode[] = [];
    private barrelIndex: number = 0;
    public aimPoint: Vector3 = Vector3.Zero();
    private turretBases: Mesh[] = [];
    private turretBarrels: Mesh[] = [];

    // Ammo & Reload
    public maxAmmo: number = Infinity;
    public currentAmmo: number = Infinity;
    public isReloading: boolean = false;
    public reloadTimeMs: number = 3000;
    public lastReloadStartTime: number = 0;
    
    // Auto-aim state
    public currentTarget: Mesh | null = null;       // currently locked enemy root mesh
    public isLocked: boolean = false;               // true when turret is aligned to target
    private targetPool: Mesh[] = [];                // all possible enemy meshes
    private nextTargetScan = 0;
    private presentationTarget: Mesh | null | undefined;
    private turretYaw: number = 0;
    private turretPitch: number = 0;
    private readonly PITCH_MIN = -0.2;
    private readonly PITCH_MAX = 0.4;
    private readonly AUTO_AIM_RANGE = 120;          // metres
    private readonly AUTO_AIM_FOV = Math.PI / 3;    // 60° total forward cone
    private readonly LOCK_THRESHOLD = 0.99;         // dot product to consider "locked" (approx 8 degrees)
    private readonly TURRET_SLEW_SPEED = 0.08;      // lerp speed (snappy but smooth)

    // Projectile Object Pool
    private static projectilePools: Map<string, TransformNode[]> = new Map();

    private tracerMat: StandardMaterial;

    /** Only the host-simulated bot may report damage; remote bot weapons are presentation-only. */
    private get isAuthoritativeBot(): boolean {
        return isAuthoritativeBotSource(this.ownerMesh.metadata, this.networkManager !== null, this.isPlayer);
    }

    constructor(scene: Scene, ownerMesh: Mesh, weaponId: string, ownerId: string, isPlayer: boolean, networkManager: NetworkManager | null = null) {
        this.scene = scene;
        this.ownerMesh = ownerMesh;
        this.ownerId = ownerId;

        this.isPlayer = isPlayer;
        this.networkManager = networkManager;
        this.weaponId = weaponId;

        if (weaponId === "plasma") {
            this.config = { fireRateMs: 500, damage: 15, range: 180, tracerColor: new Color3(0.1, 0.9, 1) };
            this.maxAmmo = Infinity;
        } else if (weaponId === "missile") {
            this.config = { fireRateMs: 400, damage: 45, range: 200, tracerColor: new Color3(1, 0.2, 0.2) };
            this.maxAmmo = 4;
            this.reloadTimeMs = 3500;
        } else if (weaponId === "mortar") {
            this.config = { fireRateMs: 600, damage: 80, range: 250, tracerColor: new Color3(1, 0.5, 0.1) };
            this.maxAmmo = 4;
            this.reloadTimeMs = 5000;
        } else if (weaponId === "nuke") {
            this.config = { fireRateMs: 1200, damage: 1500, range: 300, tracerColor: new Color3(0.5, 1, 0.2) };
            this.maxAmmo = 1; // Only 1 nuke at a time
            this.reloadTimeMs = 12000; // Increased charge time
        } else {
            // minigun
            this.config = { fireRateMs: 120, damage: 5, range: 150, tracerColor: new Color3(1, 0.8, 0.2) };
            this.maxAmmo = Infinity;
        }
        this.currentAmmo = this.maxAmmo;

        // Discover turret parts
        this.ownerMesh.getChildMeshes(false).forEach(m => {
            const name = m.name.toLowerCase();
            if (name === "barrel" || name === "cannon") {
                this.barrels.push(m as Mesh);
                if (m.parent && (m.parent as Mesh).name) {
                    const pName = (m.parent as Mesh).name.toLowerCase();
                    if (pName.includes("turretbox") || pName.includes("gunbase")) {
                        this.turretBarrels.push(m.parent as Mesh);
                    }
                }
            }
            if (name.includes("turretbase") || name.includes("turret_base")) {
                this.turretBases.push(m as Mesh);
            }
        });
        this.muzzleSockets = this.ownerMesh.getChildTransformNodes(false).filter(node => node.name === 'muzzle_socket');
        if (this.barrels.length === 0) this.barrels.push(this.ownerMesh);

        // Register auto-aim update for all (bots need turret tracking too)
        this.scene.onBeforeRenderObservable.add(this.updateAutoAim);

        // Materials & FX
        this.tracerMat = new StandardMaterial("tracerMat", this.scene);
        this.tracerMat.emissiveColor = this.config.tracerColor;
        this.tracerMat.disableLighting = true;
        this.tracerMat.alpha = 0.9;
    }

    /** Register all potential enemy root meshes for targeting */
    public setTargetPool(meshes: Mesh[]): void {
        this.nextTargetScan = 0;
        this.targetPool = meshes.filter(mesh => canAffect(this.ownerMesh, mesh));
    }

    /** Server-owned modes supply a visual target without allowing client-side firing or damage. */
    public setPresentationTarget(target: Mesh | null): void {
        this.presentationTarget = target;
        this.currentTarget = target;
    }

    // ─── Auto-Aim Core ────────────────────────────────────────────────────────

    private updateAutoAim = () => {
        if (!this.controlsEnabled || this.scene.metadata?.combatEnded || this.ownerMesh.metadata?.vehicle?.isDead) return;
        const myPos = this.ownerMesh.getAbsolutePosition();
        const myForward = this.ownerMesh.forward;
        const flatForward = new Vector3(myForward.x, 0, myForward.z).normalize();

        // Acquisition is bounded to 10 Hz; turret tracking still runs every frame.
        const now = performance.now();
        if (this.presentationTarget !== undefined) this.currentTarget = this.presentationTarget;
        else if (now >= this.nextTargetScan) {
            this.currentTarget = this.acquireTarget(myPos, flatForward);
            this.nextTargetScan = now + 100;
        }
        if (this.currentTarget && (this.currentTarget.isDisposed() ||
            this.currentTarget.metadata?.vehicle?.isDead || this.currentTarget.metadata?.vehicle?.isCloaked ||
            !canAffect(this.ownerMesh, this.currentTarget))) this.currentTarget = null;
        const bestTarget = this.currentTarget;

        const hullYaw = Math.atan2(myForward.x, myForward.z);
        const slew = this.presentationTarget !== undefined
            ? 1 - Math.exp(-12 * Math.min(.05, (this.scene.getEngine().getDeltaTime() || 16.67) / 1000))
            : this.TURRET_SLEW_SPEED;

        if (!bestTarget) {
            // No target — slew turret back to hull forward (local 0)
            let diffYaw = 0 - this.turretYaw;
            while (diffYaw > Math.PI) diffYaw -= 2 * Math.PI;
            while (diffYaw < -Math.PI) diffYaw += 2 * Math.PI;
            
            this.turretYaw += diffYaw * slew;
            this.turretPitch += (0 - this.turretPitch) * slew;
            this.isLocked = false;
            this.applyTurretRotation();
            return;
        }

        // 2. Compute angle to target
        const toTarget = bestTarget.getAbsolutePosition().subtract(myPos);
        const targetWorldYaw = Math.atan2(toTarget.x, toTarget.z);
        
        // Calculate target yaw in local space relative to the hull
        let targetLocalYaw = targetWorldYaw - hullYaw;
        while (targetLocalYaw > Math.PI) targetLocalYaw -= 2 * Math.PI;
        while (targetLocalYaw < -Math.PI) targetLocalYaw += 2 * Math.PI;

        const horizontalDist = Math.sqrt(toTarget.x * toTarget.x + toTarget.z * toTarget.z);
        const targetPitch = Math.max(
            this.PITCH_MIN,
            Math.min(this.PITCH_MAX, -Math.atan2(toTarget.y, Math.max(horizontalDist, 0.1)))
        );

        // 3. Smoothly slew toward target
        let diffYaw = targetLocalYaw - this.turretYaw;
        while (diffYaw > Math.PI) diffYaw -= 2 * Math.PI;
        while (diffYaw < -Math.PI) diffYaw += 2 * Math.PI;

        this.turretYaw += diffYaw * slew;
        this.turretPitch += (targetPitch - this.turretPitch) * slew;

        // 4. Check lock-on alignment
        const turretWorldYaw = hullYaw + this.turretYaw;
        const turretDir = new Vector3(
            Math.sin(turretWorldYaw),
            -Math.sin(this.turretPitch),
            Math.cos(turretWorldYaw)
        ).normalize();
        const toTargetDir = toTarget.normalize();
        const alignment = Vector3.Dot(turretDir, toTargetDir);
        this.isLocked = alignment >= this.LOCK_THRESHOLD;

        // 5. Set aim point for camera & shooting
        this.aimPoint = bestTarget.getAbsolutePosition().clone();

        // 6. Auto-fire when locked
        if (this.isLocked && this.isPlayer && this.presentationTarget === undefined) {
            this.fire();
        }

        this.applyTurretRotation();
    };

    /** Rank cheap distance/FOV candidates before testing visibility; stop at the best visible target. */
    private acquireTarget(myPos: Vector3, flatForward: Vector3): Mesh | null {
        // 1. Pick best target: closest enemy inside FOV cone
        let bestTarget: Mesh | null = null;
        const candidates: { mesh: Mesh; score: number }[] = [];

        for (const enemy of this.targetPool) {
            if (!enemy || enemy.isDisposed()) continue;
            if (enemy === this.ownerMesh) continue;
            if (!canAffect(this.ownerMesh, enemy)) continue;
            if (enemy.metadata?.vehicle?.isDead) continue;
            if (enemy.metadata?.vehicle?.isCloaked) continue; // Phantom stealth!

            const toEnemy = enemy.getAbsolutePosition().subtract(myPos);
            const dist = toEnemy.length();
            if (dist > this.AUTO_AIM_RANGE) continue;

            const flatDir = new Vector3(toEnemy.x, 0, toEnemy.z).normalize();
            const dot = Vector3.Dot(flatForward, flatDir);
            if (dot < Math.cos(this.AUTO_AIM_FOV / 2)) continue; // outside cone

            // Score: closer + more directly ahead = better
            const score = dist * (1 - dot * 0.5);
            candidates.push({ mesh: enemy, score });
        }
        candidates.sort((a, b) => a.score - b.score);
        for (const { mesh: enemy } of candidates) {
            // Perform Line of Sight (LOS) check
            // We cast a ray from slightly above our origin towards the enemy
            const losOrigin = myPos.clone();
            losOrigin.y += 2; // Cast from turret height roughly
            
            const enemyCenter = enemy.getAbsolutePosition().clone();
            enemyCenter.y += 1;
            
            const losDir = enemyCenter.subtract(losOrigin).normalize();
            const losDist = Vector3.Distance(losOrigin, enemyCenter);
            
            const ray = new Ray(losOrigin, losDir, losDist);
            const hit = this.scene.pickWithRay(ray, (m) => {
                return m.isEnabled() && m.isVisible && (m.isPickable || Boolean(getCombatantMetadata(m))) && !m.metadata?.presentationOnly && m.name !== 'skyBox' && !m.isDescendantOf(this.ownerMesh) && m !== this.ownerMesh;
            });

            // If the ray hits something, and it's NOT the target enemy (i.e. it hit terrain/wall), block lock-on
            let hasLOS = true;
            if (hit && hit.hit && hit.pickedMesh) {
                let hitNode: import("@babylonjs/core").Node | null = hit.pickedMesh;
                let hitTarget = false;
                while (hitNode) {
                    if (hitNode === enemy || (enemy.metadata?.vehicle && hitNode.metadata?.vehicle === enemy.metadata.vehicle)) {
                        hitTarget = true;
                        break;
                    }
                    hitNode = hitNode.parent;
                }
                if (!hitTarget) {
                    hasLOS = false; // Blocked by terrain
                }
            }

            if (hasLOS) {
                bestTarget = enemy;
                break;
            }
        }

        return bestTarget;

    }

    private applyTurretRotation(): void {
        this.turretBases.forEach(base => { base.rotation.y = this.turretYaw; });
        this.turretBarrels.forEach(box => { box.rotation.x = this.turretPitch; });

        if (this.turretBases.length === 0 && this.turretBarrels.length === 0) {
            this.barrels.forEach(barrel => {
                const parent = barrel.parent as Mesh;
                if (parent?.name) parent.rotation.y = this.turretYaw;
            });
        }
    }

    // ─── FX Helpers (Delegated to VfxManager) ─────────────────────────────────

    private playFireSound(origin: Vector3) {
        if (this.weaponId === "minigun") SoundManager.getInstance().playGunshot(origin);
        else if (this.weaponId === "plasma") SoundManager.getInstance().playProceduralPlasma(origin);
        else if (this.weaponId === "missile") SoundManager.getInstance().playProceduralMissile(origin);
        else SoundManager.getInstance().playExplosion(origin);
    }

    public fire(): void {
        if (!this.controlsEnabled || this.scene.metadata?.combatEnded || this.ownerMesh.metadata?.vehicle?.isDead) return;
        const vehicle = this.ownerMesh.metadata?.vehicle;
        if (vehicle && (vehicle.isEmped || vehicle.isStunned)) return;

        const now = performance.now();
        if (this.isReloading) {
            if (now - this.lastReloadStartTime >= this.reloadTimeMs) {
                this.isReloading = false;
                this.currentAmmo = this.maxAmmo;
            } else {
                return; // still reloading
            }
        }

        if (now - this.lastFireTime < this.config.fireRateMs) return;

        if (this.currentAmmo <= 0) {
            this.isReloading = true;
            this.lastReloadStartTime = now;
            return;
        }

        this.lastFireTime = now;
        
        if (this.maxAmmo !== Infinity) {
            this.currentAmmo--;
            if (this.currentAmmo <= 0) {
                this.isReloading = true;
                this.lastReloadStartTime = now;
            }
        }

        if (this.isPlayer) {
            window.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 0.15, duration: 80 } }));
        }

        const muzzleCount = this.muzzleSockets.length || this.barrels.length;
        const muzzleIndex = this.barrelIndex % muzzleCount;
        const barrel = this.barrels[muzzleIndex % this.barrels.length];
        const socket = this.muzzleSockets[muzzleIndex];
        this.barrelIndex = (this.barrelIndex + 1) % muzzleCount;

        const origin = (socket?.getAbsolutePosition() ?? barrel.getAbsolutePosition()).clone();
        const muzzleForward = socket ? socket.getDirection(Vector3.Forward()).normalize() : this.ownerMesh.forward;
        const aimTarget = this.currentTarget?.getAbsolutePosition()?.clone() ?? origin.add(muzzleForward.scale(this.config.range));
        const direction = aimTarget.subtract(origin).normalize();

        if (this.weaponId === "minigun" || this.weaponId === "plasma") {
            const ray = new Ray(origin, direction, this.config.range);
            const hit = this.scene.pickWithRay(ray, (mesh) => {
                return !mesh.isDescendantOf(this.ownerMesh) && mesh !== this.ownerMesh && mesh.isVisible;
            });

            let hitPoint = origin.add(direction.scale(this.config.range));
            let hitMesh: Mesh | null = null;

            if (hit && hit.hit && hit.pickedPoint && hit.pickedMesh) {
                hitPoint = hit.pickedPoint;
                hitMesh = hit.pickedMesh as Mesh;
            }

            this.triggerMuzzleFlash(origin, direction);
            this.playFireSound(origin);
            this.drawTracer(origin, hitPoint);

            if (this.networkManager) {
                let targetId = undefined;
                if (hitMesh) {
                    let targetNode = hitMesh.parent || hitMesh;
                    while (targetNode) {
                        if (targetNode.metadata?.playerId) { targetId = targetNode.metadata.playerId; break; }
                        if (targetNode.metadata?.aiId) { targetId = targetNode.metadata.aiId; break; }
                        targetNode = targetNode.parent as any;
                    }
                }
                
                if (this.isPlayer) {
                    this.networkManager.broadcastShoot(
                        { x: origin.x, y: origin.y, z: origin.z },
                        { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z },
                        targetId
                    );
                } else if (this.isAuthoritativeBot) {
                    this.networkManager.broadcastBotShoot(
                        this.ownerId,
                        { x: origin.x, y: origin.y, z: origin.z },
                        { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z },
                        targetId
                    );
                }
            }

            if (hitMesh) {
                const distance = Vector3.Distance(origin, hitPoint);
                const delayMs = (distance / 120) * 1000;
                
                setTimeout(() => {
                    if (!this.scene || this.scene.isDisposed) return;
                    
                    this.triggerImpact(hitPoint, direction.scale(-1));
                    
                    let targetNode = hitMesh.parent || hitMesh;
                    let targetId = "";
                    let hitVehicle = null;

                    while (targetNode) {
                        if (targetNode.metadata?.playerId) { targetId = targetNode.metadata.playerId; hitVehicle = targetNode.metadata.vehicle; break; }
                        if (targetNode.metadata?.aiId) { targetId = targetNode.metadata.aiId; hitVehicle = targetNode.metadata.vehicle; break; }
                        targetNode = targetNode.parent as any;
                    }
                    
                    if (targetId && !canAffect(this.ownerMesh, targetNode as Mesh)) {
                        if (this.isPlayer) window.dispatchEvent(new CustomEvent('spawn-status-text', { detail: { x: hitPoint.x, y: hitPoint.y + 2, z: hitPoint.z, text: 'ALLY — FIRE BLOCKED', color: '#67d5df' } }));
                        return;
                    }

                    if (targetId) {
                        const isKill = !this.ownerMesh.metadata?.teamId && hitVehicle && (hitVehicle.health - this.config.damage <= 0) && hitVehicle.health > 0;
                        if (this.isPlayer) {
                            window.dispatchEvent(new CustomEvent('hit-marker', { detail: { isKill: !!isKill } }));
                        }
                        if (isKill) {
                            let shooterName = "UNKNOWN";
                            if (this.isPlayer) shooterName = "YOU";
                            else if (this.ownerMesh.metadata?.kind === 'bot') shooterName = this.ownerMesh.metadata?.displayName ?? 'BOT';
                            else if (this.ownerMesh.metadata?.playerId) shooterName = this.ownerMesh.metadata.playerId.substring(0,6).toUpperCase();

                            const enemyName = targetId.startsWith("bot_") ? `BOT ${targetId.replace("bot_", "").substring(0,4).toUpperCase()}` : targetId.substring(0,6).toUpperCase();
                            window.dispatchEvent(new CustomEvent('kill-feed', { detail: { killer: shooterName, victim: enemyName, weapon: this.weaponId } }));
                        }

                        if (this.networkManager && this.ownerMesh.metadata?.teamId) {
                            this.networkManager.sendHit(targetId, this.config.damage, this.ownerId, this.weaponId);
                        } else if (hitVehicle && typeof hitVehicle.applyDamage === "function") {
                            hitVehicle.applyDamage(this.config.damage, hitPoint);
                        } else if (this.networkManager) {
                            this.networkManager.sendHit(targetId, this.config.damage, this.ownerId, this.weaponId);
                        }
                    }
                }, delayMs);
            }
        } else {
            // Projectiles
            this.triggerMuzzleFlash(origin, direction);
            this.playFireSound(origin);
            this.launchProjectile(origin, aimTarget, this.currentTarget);

            if (this.networkManager) {
                let targetId = undefined;
                if (this.currentTarget) {
                    let targetNode = this.currentTarget.parent || this.currentTarget;
                    while (targetNode) {
                        if (targetNode.metadata?.playerId) { targetId = targetNode.metadata.playerId; break; }
                        if (targetNode.metadata?.aiId) { targetId = targetNode.metadata.aiId; break; }
                        targetNode = targetNode.parent as any;
                    }
                }
                
                if (this.isPlayer) {
                    this.networkManager.broadcastShoot(
                        { x: origin.x, y: origin.y, z: origin.z },
                        { x: aimTarget.x, y: aimTarget.y, z: aimTarget.z },
                        targetId
                    );
                } else if (this.isAuthoritativeBot) {
                    this.networkManager.broadcastBotShoot(
                        this.ownerId,
                        { x: origin.x, y: origin.y, z: origin.z },
                        { x: aimTarget.x, y: aimTarget.y, z: aimTarget.z },
                        targetId
                    );
                }
            }
        }
    }

    public playRemoteShot(origin: Vector3, hitPoint: Vector3, targetId?: string) {
        if (this.weaponId === "minigun" || this.weaponId === "plasma") {
            const direction = hitPoint.subtract(origin).normalize();
            this.triggerMuzzleFlash(origin, direction);
            this.playFireSound(origin);
            this.drawTracer(origin, hitPoint);
            this.triggerImpact(hitPoint, direction.scale(-1));
        } else {
            const direction = hitPoint.subtract(origin).normalize();
            this.triggerMuzzleFlash(origin, direction);
            this.playFireSound(origin);
            
            let lockedMesh: Mesh | null = null;
            if (targetId) {
                for (const enemy of this.targetPool) {
                    if (enemy && !enemy.isDisposed()) {
                        let enemyId = "";
                        let targetNode = enemy.parent || enemy;
                        while (targetNode) {
                            if (targetNode.metadata?.playerId) { enemyId = targetNode.metadata.playerId; break; }
                            if (targetNode.metadata?.aiId) { enemyId = targetNode.metadata.aiId; break; }
                            targetNode = targetNode.parent as any;
                        }
                        if (enemyId === targetId) {
                            lockedMesh = enemy;
                            break;
                        }
                    }
                }
            }
            this.launchProjectile(origin, hitPoint, lockedMesh); // Remote projectile
        }
    }

    private getPooledProjectile(weaponId: string): TransformNode {
        let pool = WeaponController.projectilePools.get(weaponId);
        if (!pool) {
            pool = [];
            WeaponController.projectilePools.set(weaponId, pool);
        }
        
        if (pool.length > 0) {
            const p = pool.pop()!;
            p.setEnabled(true);
            // Reset particle systems if they exist
            if ((p as any).trail) (p as any).trail.start();
            if ((p as any).fireTrail) (p as any).fireTrail.start();
            return p;
        }

        const isMortar = weaponId === "mortar";
        const isNuke = weaponId === "nuke";
        
        let mesh: TransformNode;
        if (isNuke) {
            mesh = MeshBuilder.CreateSphere("projectile", { diameter: 3 }, this.scene);
            const mat = new StandardMaterial("projMat", this.scene);
            mat.emissiveColor = new Color3(1, 0.42, 0.06);
            mat.diffuseColor = Color3.Black();
            mat.disableLighting = true;
            (mesh as Mesh).material = mat;
        } else if (isMortar) {
            mesh = MeshBuilder.CreateSphere("projectile", { diameter: 1 }, this.scene);
            const mat = new StandardMaterial("projMat", this.scene);
            mat.emissiveColor = new Color3(1, 0.5, 0.08);
            mat.diffuseColor = Color3.Black();
            mat.disableLighting = true;
            (mesh as Mesh).material = mat;
        } else {
            // Missile
            mesh = new TransformNode("missileNode", this.scene);
            const body = MeshBuilder.CreateCylinder("body", { diameter: 0.4, height: 1.2 }, this.scene);
            const tip = MeshBuilder.CreateCylinder("tip", { diameterTop: 0, diameterBottom: 0.4, height: 0.6 }, this.scene);
            body.rotation.x = Math.PI / 2;
            tip.rotation.x = Math.PI / 2;
            tip.position.z = 0.9;
            body.parent = mesh;
            tip.parent = mesh;

            const mat = new StandardMaterial("projMat", this.scene);
            mat.emissiveColor = new Color3(0.72, 0.16, 0.04);
            mat.diffuseColor = new Color3(0.08, 0.04, 0.02);
            body.material = mat;
            tip.material = mat;
        }

        // Persistent emissive layers make the ordnance readable between particle
        // emissions and let the scene glow layer produce a compact airborne bloom.
        const glowCore = MeshBuilder.CreateSphere(`${weaponId}-flight-core`, { diameter: isNuke ? 2.2 : isMortar ? 0.8 : 0.72, segments: 10 }, this.scene);
        glowCore.parent = mesh;
        glowCore.position.z = weaponId === 'missile' ? -0.72 : 0;
        const glowCoreMaterial = new StandardMaterial(`${weaponId}-flight-core-material`, this.scene);
        glowCoreMaterial.emissiveColor = isNuke ? new Color3(1, 0.92, 0.48) : new Color3(1, 0.52, 0.08);
        glowCoreMaterial.diffuseColor = Color3.Black();
        glowCoreMaterial.disableLighting = true;
        glowCore.material = glowCoreMaterial;

        const glowHalo = MeshBuilder.CreateSphere(`${weaponId}-flight-halo`, { diameter: isNuke ? 4.5 : isMortar ? 1.7 : 1.45, segments: 10 }, this.scene);
        glowHalo.parent = mesh;
        glowHalo.position.copyFrom(glowCore.position);
        const glowHaloMaterial = new StandardMaterial(`${weaponId}-flight-halo-material`, this.scene);
        glowHaloMaterial.emissiveColor = isNuke ? new Color3(1, 0.28, 0.02) : new Color3(1, 0.22, 0.01);
        glowHaloMaterial.diffuseColor = Color3.Black();
        glowHaloMaterial.disableLighting = true;
        glowHaloMaterial.alpha = isNuke ? 0.24 : 0.18;
        glowHalo.material = glowHaloMaterial;
        (mesh as any).flightGlowCore = glowCore;
        (mesh as any).flightGlowHalo = glowHalo;
        (mesh as any).flightGlowHaloMaterial = glowHaloMaterial;

        // Setup engine trails using VfxManager
        const vfx = VfxManager.getInstance();
        const projectileKind = weaponId as 'missile' | 'mortar' | 'nuke';
        const trailEmitter = new TransformNode(`${weaponId}-trail-emitter`, this.scene);
        trailEmitter.parent = mesh;
        trailEmitter.position.z = weaponId === 'missile' ? -0.92 : isNuke ? -1.35 : -0.48;
        (mesh as any).trail = vfx.attachSmokeTrail(trailEmitter, projectileKind);
        (mesh as any).fireTrail = vfx.attachFireTrail(trailEmitter, projectileKind);

        return mesh;
    }

    private releaseProjectile(mesh: TransformNode) {
        if ((mesh as any).trail) (mesh as any).trail.stop();
        if ((mesh as any).fireTrail) (mesh as any).fireTrail.stop();
        mesh.setEnabled(false);
        
        const pool = WeaponController.projectilePools.get(this.weaponId);
        if (pool) pool.push(mesh);
    }

    private launchProjectile(origin: Vector3, targetPosition: Vector3, lockedMesh: Mesh | null = null) {
        const isMortar = this.weaponId === "mortar";
        const isNuke = this.weaponId === "nuke";

        const mesh = this.getPooledProjectile(this.weaponId);

        // Spawn exactly at the authored turret muzzle; owner geometry is excluded from collision rays.
        mesh.position = origin.clone();
        const startPos = mesh.position.clone();

        let velocity = new Vector3(0,0,0);
        
        if (this.weaponId === "missile") {
            // initial launch speed is slower, arcs slightly upwards to clear turret, then accelerates
            const elevatedTarget = targetPosition.clone();
            elevatedTarget.y += 1.5; // elevate target aim point
            velocity = elevatedTarget.subtract(origin).normalize().scale(80);
            velocity.y += 20; // stronger arc up to counteract any initial downward angle
        } else if (isMortar || isNuke) {
            // Calculate true ballistic trajectory to hit exact targetPosition
            const toTarget = targetPosition.subtract(mesh.position);
            const deltaY = toTarget.y; // Account for height differences
            toTarget.y = 0;
            const dist = toTarget.length();
            
            let dir = toTarget.normalize();
            // Fallback if target is exactly at origin
            if (dir.lengthSquared() === 0 || isNaN(dir.x)) {
                dir = this.ownerMesh.forward.clone();
                dir.y = 0;
                dir.normalize();
            }
            
            // Fixed flight time ensures it hits exactly at the target's location
            const timeToTarget = isNuke ? 2.5 : 2.0;
            const horizontalVel = dist / timeToTarget;
            
            // High gravity forces a steep, high-arching trajectory
            const gravity = isNuke ? 120 : 150;
            
            // Exact vertical velocity needed to hit the target elevation at exactly timeToTarget
            const verticalVel = (deltaY / timeToTarget) + (0.5 * gravity * timeToTarget);
            
            velocity = dir.scale(horizontalVel);
            velocity.y = verticalVel;
            (mesh as any).projectileGravity = gravity;
        } else {
            // Default straight projectile (lasers, plasma cannon, etc)
            const dir = targetPosition.subtract(origin).normalize();
            velocity = dir.scale(150); // standard fast projectile speed
        }

        // Unique parameters to desync missile tracking wobbles
        const wobblePhase = (Math.abs(origin.x) + Math.abs(origin.z)) % (Math.PI * 2);
        const wobbleFreq = 0.012;

            const updateFn = () => {
                const dt = this.scene.getEngine().getDeltaTime() / 1000;
                const flightPulse = 1 + Math.sin(performance.now() * 0.024) * 0.13;
                const flightGlowCore = (mesh as any).flightGlowCore as Mesh | undefined;
                const flightGlowHalo = (mesh as any).flightGlowHalo as Mesh | undefined;
                const flightGlowHaloMaterial = (mesh as any).flightGlowHaloMaterial as StandardMaterial | undefined;
                flightGlowCore?.scaling.setAll(0.94 + flightPulse * 0.06);
                flightGlowHalo?.scaling.setAll(flightPulse);
                if (flightGlowHaloMaterial) flightGlowHaloMaterial.alpha = (isNuke ? 0.24 : 0.18) * (0.82 + (flightPulse - 1));
                
                let finalVelocity = velocity.clone();
                
                if (this.weaponId === "missile") {
                    if (lockedMesh && !lockedMesh.isDisposed()) {
                        const targetCenter = lockedMesh.getAbsolutePosition().clone();
                        targetCenter.y += 1.5; // Aim at the vehicle body, not its feet, to prevent ground clipping
                        const dirToTarget = targetCenter.subtract(mesh.position).normalize();
                        if (!isNaN(dirToTarget.x)) {
                            velocity = Vector3.Lerp(velocity, dirToTarget.scale(220), dt * 4.5);
                        }
                    } else {
                        // For unguided missiles, slowly pull them level to avoid ground impacts
                        const flatVel = velocity.clone();
                        flatVel.y = Math.max(flatVel.y, 0); 
                        if (!isNaN(flatVel.x) && flatVel.lengthSquared() > 0) {
                            velocity = Vector3.Lerp(velocity, flatVel.normalize().scale(220), dt * 4.5);
                        }
                    }
                    
                    // Wobble for missiles
                    const time = performance.now() * wobbleFreq + wobblePhase;
                    const upVector = Vector3.Up();
                    
                    // Prevent cross product with parallel vectors
                    const velNorm = velocity.clone().normalize();
                    let right = Vector3.Cross(velNorm, upVector);
                    if (right.lengthSquared() < 0.001) right = new Vector3(1, 0, 0); // fallback
                    right.normalize();
                    
                    const up = Vector3.Cross(right, velNorm).normalize();
                    const wobbleX = right.scale(Math.sin(time) * 2);
                    const wobbleY = up.scale(Math.cos(time * 1.2) * 1.5);
                    
                    // Do NOT add wobble to velocity permanently. Just use it for this frame's movement
                    finalVelocity = velocity.add(wobbleX).add(wobbleY);

                    if (finalVelocity.lengthSquared() > 0.01 && !isNaN(finalVelocity.x)) {
                        mesh.lookAt(mesh.position.add(finalVelocity));
                    }
                } else if (isMortar || isNuke) {
                    // Ballistic arc applies gravity
                    const gravity = (mesh as any).projectileGravity || (isNuke ? 120 : 150);
                    velocity.y -= gravity * dt;
                    finalVelocity = velocity;

                    // Point nose along velocity vector
                    if (finalVelocity.lengthSquared() > 0.1 && !isNaN(finalVelocity.x)) {
                        mesh.lookAt(mesh.position.add(finalVelocity));
                    }
                }

            const step = finalVelocity.scale(dt);
            const nextPos = mesh.position.add(step);

            // Raycast collision detection against terrain/obstacles
            let hitObstacle = false;
            let hitPoint = nextPos;
            const ray = new Ray(mesh.position, finalVelocity.clone().normalize(), step.length());
            const hit = this.scene.pickWithRay(ray, m => isProjectileCollisionCandidate(m, mesh, this.ownerMesh));
            
            if (hit && hit.hit && hit.pickedPoint && hit.pickedMesh) {
                if (hit.pickedMesh.name !== "projectile" && hit.pickedMesh.name !== "missileNode" && hit.pickedMesh.name !== "body" && hit.pickedMesh.name !== "tip") {
                    hitObstacle = true;
                    hitPoint = hit.pickedPoint;
                }
            }

            mesh.position = nextPos;

            const distHorizontal = new Vector3(mesh.position.x, 0, mesh.position.z).subtract(new Vector3(startPos.x, 0, startPos.z)).length();
            const maxRange = (isNuke || isMortar) ? (this.config.range * 3.0) : (this.config.range * 1.5);
            const isRangeExceeded = mesh.position.y <= 0 || distHorizontal > maxRange;
            let hitEnemy = false;
            
            if (!hitObstacle && !isRangeExceeded) {
                for (const enemy of this.targetPool) {
                    if (enemy && !enemy.isDisposed() && enemy !== this.ownerMesh && Vector3.Distance(mesh.position, enemy.getAbsolutePosition()) < (isNuke ? 5 : 3)) {
                        hitEnemy = true;
                        hitPoint = mesh.position;
                        break;
                    }
                }
            }

            if (isRangeExceeded || hitEnemy || hitObstacle) {
                this.detonateProjectile(hitPoint, isNuke ? 60 : (isMortar ? 30 : 15), this.config.damage);
                this.scene.onBeforeRenderObservable.removeCallback(updateFn);
                this.releaseProjectile(mesh);
            }
        };

        this.scene.onBeforeRenderObservable.add(updateFn);
    }

    private detonateProjectile(position: Vector3, radius: number, damage: number) {
        const isNuke = this.weaponId === "nuke";
        
        VfxManager.getInstance().triggerExplosion(position, radius, isNuke);
        SoundManager.getInstance().playExplosion(position);

        if (isNuke && this.isPlayer) {
            window.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 1.5, duration: 1500 } }));
            window.dispatchEvent(new CustomEvent('spawn-status-text', {
                detail: { x: position.x, y: position.y + 10, z: position.z, text: "RADIATION WARNING", color: "#00ff00" }
            }));
        } else if (this.isPlayer) {
            window.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 0.5, duration: 300 } }));
        }

        const isLocalShooter = this.isPlayer || this.isAuthoritativeBot;

        if (isLocalShooter) {
            for (const enemy of this.targetPool) {
                if (!enemy || enemy.isDisposed()) continue;
                // Don't apply area damage to yourself unless it's a nuke
                if (enemy === this.ownerMesh && !isNuke) continue;
                
                const dist = Vector3.Distance(position, enemy.getAbsolutePosition());
                if (dist <= radius) {
                    let actualDamage = damage * (1 - (dist / radius) * 0.5); 
                    if (isNuke) {
                        // Nuke is devastating, edge of splash still deals 70% damage
                        actualDamage = damage * (1 - (dist / radius) * 0.3);
                    }
                    
                    let targetId = "";
                    let hitVehicle = null;
                    let targetNode = enemy.parent || enemy;
                    while (targetNode) {
                        if (targetNode.metadata?.playerId) { targetId = targetNode.metadata.playerId; hitVehicle = targetNode.metadata.vehicle; break; }
                        if (targetNode.metadata?.aiId) { targetId = targetNode.metadata.aiId; hitVehicle = targetNode.metadata.vehicle; break; }
                        targetNode = targetNode.parent as any;
                    }
                    
                    if (targetId && canAffect(this.ownerMesh, targetNode as Mesh)) {
                        const isKill = !this.ownerMesh.metadata?.teamId && hitVehicle && (hitVehicle.health - actualDamage <= 0) && hitVehicle.health > 0;
                        if (this.isPlayer) {
                            window.dispatchEvent(new CustomEvent('hit-marker', { detail: { isKill: !!isKill } }));
                        }
                        if (isKill) {
                            let shooterName = "UNKNOWN";
                            if (this.isPlayer) shooterName = "YOU";
                            else if (this.ownerMesh.metadata?.kind === 'bot') shooterName = this.ownerMesh.metadata?.displayName ?? 'BOT';
                            else if (this.ownerId) shooterName = this.ownerId.substring(0,6).toUpperCase();

                            const enemyName = targetId.startsWith("bot_") ? `BOT ${targetId.replace("bot_", "").substring(0,4).toUpperCase()}` : targetId.substring(0,6).toUpperCase();
                            window.dispatchEvent(new CustomEvent('kill-feed', { detail: { killer: shooterName, victim: enemyName, weapon: this.weaponId } }));
                        }

                        if (this.networkManager && this.ownerMesh.metadata?.teamId) {
                            this.networkManager.sendHit(targetId, actualDamage, this.ownerId, this.weaponId);
                        } else if (hitVehicle && typeof hitVehicle.applyDamage === "function") {
                            hitVehicle.applyDamage(actualDamage, position);
                        } else if (this.networkManager && this.isPlayer) {
                            this.networkManager.sendHit(targetId, actualDamage, this.ownerId, this.weaponId);
                        }

                        // Apply Physics Knockback Impulse
                        const physicsRoot = enemy.parent || enemy;
                        if ((physicsRoot as Mesh).physicsBody) {
                            const mass = hitVehicle?.config?.mass || 1500;
                            // The closer the explosion, the stronger the knockback
                            const forceMult = (1 - (dist / radius)) * (isNuke ? 30 : (this.weaponId === "mortar" ? 15 : 8));
                            
                            const dir = enemy.getAbsolutePosition().subtract(position).normalize();
                            // Push away and upwards
                            const impulse = dir.scale(forceMult * mass).add(new Vector3(0, forceMult * mass * 0.5, 0));
                            
                            (physicsRoot as Mesh).physicsBody!.applyImpulse(impulse, enemy.getAbsolutePosition());
                            
                            // Apply some random tumble angular velocity
                            (physicsRoot as Mesh).physicsBody!.setAngularVelocity(new Vector3(
                                (Math.random() - 0.5) * forceMult * 0.5,
                                (Math.random() - 0.5) * forceMult * 0.5,
                                (Math.random() - 0.5) * forceMult * 0.5
                            ));
                        }
                    }
                }
            }
        }
    }

    private drawTracer(start: Vector3, end: Vector3) {
        const distance = Vector3.Distance(start, end);
        if (distance < 0.5) return;

        const isPlasma = this.weaponId === 'plasma';
        
        // Vulcan gets long fast lines, Plasma gets compact energy packet
        const length = Math.min(distance, isPlasma ? 4.5 : 25);
        const diameter = isPlasma ? 0.4 : 0.08;
        const tracer = MeshBuilder.CreateCylinder("tracer", { height: length, diameterTop: diameter * 0.4, diameterBottom: diameter, tessellation: 8 }, this.scene);

        // Clone the material so we can fade this specific tracer's alpha
        const mat = this.tracerMat.clone("tracerInstanceMat");
        tracer.material = mat;

        const dir = end.subtract(start).normalize();
        tracer.position = start.add(dir.scale(length * 0.5));
        tracer.rotation = new Vector3(
            Math.acos(Vector3.Dot(dir, Vector3.Up())),
            Math.atan2(dir.x, dir.z),
            0
        );

        const plasmaCore = isPlasma ? MeshBuilder.CreateSphere('plasma-core', { diameter: 1.2, segments: 12 }, this.scene) : null;
        const plasmaHalo = isPlasma ? MeshBuilder.CreateSphere('plasma-halo', { diameter: 2.0, segments: 12 }, this.scene) : null;
        const haloMaterial = isPlasma ? new StandardMaterial('plasma-halo-material', this.scene) : null;
        let plasmaSpirals: ParticleSystem | null = null;

        if (plasmaCore && plasmaHalo && haloMaterial) {
            plasmaCore.position = start.add(dir.scale(length));
            plasmaCore.material = mat;
            haloMaterial.emissiveColor = this.config.tracerColor;
            haloMaterial.diffuseColor = Color3.Black();
            haloMaterial.disableLighting = true;
            haloMaterial.alpha = 0.3;
            plasmaHalo.position.copyFrom(plasmaCore.position);
            plasmaHalo.material = haloMaterial;

            // Plasma spiraling energy tendrils
            plasmaSpirals = new ParticleSystem('plasma-spirals', 50, this.scene);
            plasmaSpirals.particleTexture = new Texture('/assets/textures/flare.png', this.scene); // Re-use common texture or VfxManager's
            plasmaSpirals.emitter = plasmaCore;
            plasmaSpirals.minEmitBox = new Vector3(-0.2, -0.2, -0.2);
            plasmaSpirals.maxEmitBox = new Vector3(0.2, 0.2, 0.2);
            plasmaSpirals.color1 = new Color4(0.4, 0.8, 1, 0.8);
            plasmaSpirals.color2 = new Color4(0.1, 0.4, 1, 0.4);
            plasmaSpirals.colorDead = new Color4(0, 0, 0, 0);
            plasmaSpirals.minSize = 0.1;
            plasmaSpirals.maxSize = 0.3;
            plasmaSpirals.minLifeTime = 0.1;
            plasmaSpirals.maxLifeTime = 0.2;
            plasmaSpirals.emitRate = 100;
            plasmaSpirals.blendMode = ParticleSystem.BLENDMODE_ADD;
            plasmaSpirals.start();
        }

        let alpha = 1.0;
        let distTraveled = 0;
        const speed = isPlasma ? 200 : 400; // Extreme speed for Minigun
        
        const updateTracer = () => {
            const dt = this.scene.getEngine().getDeltaTime() / 1000;
            const step = speed * dt;
            distTraveled += step;

            const movement = dir.scale(step);
            tracer.position.addInPlace(movement);
            plasmaCore?.position.addInPlace(movement);
            plasmaHalo?.position.addInPlace(movement);

            if (distTraveled > distance * 0.7) {
                alpha -= 5.0 * dt;
            }

            if (alpha <= 0 || distTraveled >= distance) {
                tracer.dispose();
                plasmaCore?.dispose();
                plasmaHalo?.dispose();
                plasmaSpirals?.dispose();
                mat.dispose();
                haloMaterial?.dispose();
                this.scene.onBeforeRenderObservable.removeCallback(updateTracer);
            } else {
                mat.alpha = alpha;
                if (haloMaterial) haloMaterial.alpha = 0.3 * alpha;
            }
        };
        this.scene.onBeforeRenderObservable.add(updateTracer);
    }

    private triggerImpact(position: Vector3, normal: Vector3) {
        VfxManager.getInstance().triggerImpact(position, normal, 1.0, this.weaponId as WeaponVfxKind);
    }

    private triggerMuzzleFlash(position: Vector3, direction: Vector3) {
        const scale = this.weaponId === 'minigun' ? 0.65 : this.weaponId === 'plasma' ? 0.9 : this.weaponId === 'missile' ? 1.35 : this.weaponId === 'mortar' ? 1.65 : 2.1;
        VfxManager.getInstance().triggerMuzzleFlash(position, direction, scale, this.weaponId as WeaponVfxKind);
    }

    public dispose() {
        this.scene.onBeforeRenderObservable.removeCallback(this.updateAutoAim);
        this.tracerMat.dispose();
    }
}
