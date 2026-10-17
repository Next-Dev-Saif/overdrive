import { Engine, Scene, Vector3, FreeCamera, ArcRotateCamera, Color4, Matrix, GlowLayer, Quaternion, Ray, type Mesh } from "@babylonjs/core";
import { SceneOptimizer } from "@babylonjs/core/Misc/sceneOptimizer";
import HavokPhysics from "@babylonjs/havok";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { MvpShowcase } from "../match/MvpShowcase";
import { InputManager } from "../utils/InputManager";
import { VehicleController } from "../entities/VehicleController";
import { MapLoader } from "../levels/MapLoader";
import { VehicleFactory } from "../entities/VehicleFactory";
import { AIBotController } from "../entities/AIBotController";
import { NetworkManager } from "../../network/NetworkManager";
import { RemoteVehicle } from "../entities/RemoteVehicle";
import { WeaponController } from "../weapons/WeaponController";
import { GraphicsSettingsManager } from "../settings/GraphicsSettingsManager";
import { VfxManager } from "../vfx/VfxManager";
import { SoundManager } from "./SoundManager";
import { createDynamicSceneOptimizerOptions } from "./DynamicSceneOptimizer";
import { attachTeamMarker } from "../match/TeamMarker";
import { getCombatantMetadata } from "../match/CombatRules";
import {
    TDM_RULES,
    getTeamSpawn,
    resolveMatchPhase,
    type MatchFoundPayload,
    type MatchSnapshot,
    type TeamId,
} from "../../../shared/match";
import type { Socket } from "socket.io-client";

type GameRoomData = MatchFoundPayload & { socket?: Socket };

export class GameEngine {
    private engine: Engine;
    public scene: Scene;
    public inputManager: InputManager;
    public playerVehicle: VehicleController | null = null;
    private enemies: AIBotController[] = [];
    public networkManager: NetworkManager | null = null;
    private remotePlayers: Map<string, RemoteVehicle> = new Map();
    private camera: FreeCamera | null = null;
    private lastNetworkTick = 0;
    private isDisposed: boolean = false;
    private menuOpen = false;
    private matchEndDispatched = false;
    private mvpShowcase: MvpShowcase | null = null;
    private eventAbort = new AbortController();
    private resize = () => {
        this.engine.setHardwareScalingLevel(GraphicsSettingsManager.getInstance().getConfig().hardwareScalingLevel);
        this.engine.resize();
    };
    private graphicsChanged = () => this.handleGraphicsSettingsChanged();

    /** A live-session menu suspends this driver's input, not the network world. */
    public setMenuOpen(open: boolean) {
        this.menuOpen = open;
        this.inputManager.keys = {};
        this.inputManager.joystickThrottle = 0;
        this.inputManager.joystickSteer = 0;
        this.inputManager.joystickAbility = false;
        this.inputManager.joystickFiring = false;
        if (this.playerWeapon) this.playerWeapon.controlsEnabled = !open;
    }
    private mapId: string;
    private vehicleId: string;
    private weaponId: string;
    private vehicleColor?: string;

    private glowLayer: GlowLayer | null = null;

    private playerWeapon!: WeaponController;
    private remoteWeapons: Map<string, WeaponController> = new Map();
    private cameraYaw: number = 0; // smoothed hull yaw for camera orbit
    private cameraBasePosition: Vector3 | null = null;
    private shakeIntensity = 0;
    private shakeDecay = 0;
    private dashFovOffset = 0;
    private readonly chaseCamera = {
        distance: 11.5,
        height: 6.5,
        lookAhead: 3.5,
        lookHeight: 1.25,
        collisionPadding: 0.65,
    };

    public isSpectator: boolean = false;
    private specCam: ArcRotateCamera | null = null;
    private spectatedIndex: number = -1;

    public matchState: 'intro' | 'countdown' | 'playing' | 'ended' | 'mvp' = 'playing';
    public matchTimer: number = 300; // 5 minutes in seconds
    public introTimer: number = 0;
    public localTeam: TeamId | null = null;
    public matchSnapshot: MatchSnapshot | null = null;
    
    private roomData?: GameRoomData;

    constructor(canvas: HTMLCanvasElement, mapId: string, vehicleId: string, weaponId: string, vehicleColor?: string, isSpectator: boolean = false, roomData?: GameRoomData) {
        this.mapId = mapId;
        this.vehicleId = vehicleId;
        this.weaponId = weaponId;
        this.vehicleColor = vehicleColor;
        this.isSpectator = isSpectator;
        this.roomData = roomData;
        this.localTeam = roomData?.localMember.teamId ?? null;
        this.matchSnapshot = roomData?.snapshot ?? null;
        if (this.matchSnapshot) this.matchState = resolveMatchPhase(this.matchSnapshot);
        
        // Initialize Babylon Engine
        this.engine = new Engine(canvas, false, {
            preserveDrawingBuffer: false,
            stencil: true,
            powerPreference: "high-performance",
            doNotHandleContextLost: true
        });

        // Apply initial hardware scaling based on graphics settings
        const settings = GraphicsSettingsManager.getInstance().getConfig();
        this.engine.setHardwareScalingLevel(settings.hardwareScalingLevel);

        // Listen for graphics changes to update on the fly
        window.addEventListener('graphics-settings-changed', this.graphicsChanged);

        // Initialize Scene
        this.scene = new Scene(this.engine);
        // Using light neumorphic background
        this.scene.clearColor = Color4.FromHexString("#ECEDEFff");

        // --- Performance Optimizations ---
        // Disable pointer move picking to save CPU (we don't use hover states on 3D meshes)
        this.scene.skipPointerMovePicking = true;

        this.inputManager = new InputManager();

        // Handle window resize
        window.addEventListener("resize", this.resize);
    }

    public async initialize(): Promise<void> {
        // Initialize Physics (Havok)
        await this.initPhysics();

        if (this.isDisposed) return;

        // Setup basic environment
        await this.setupBasicEnvironment();

        if (this.isDisposed) return;

        // Start render loop only after camera and physics are ready
        this.engine.runRenderLoop(() => {
            if (this.scene.activeCamera && !this.isDisposed) {
                // Map manual inputs to the player vehicle (if not spectating)
                if (!this.isSpectator && this.playerVehicle) {
                    if (this.menuOpen || this.playerVehicle.isStunned || this.matchState !== 'playing') {
                        this.playerVehicle.throttleInput = 0;
                        this.playerVehicle.steerInput = 0;
                    } else {
                        let t = 0;
                        let s = 0;
                        if (this.inputManager.isKeyDown("w") || this.inputManager.isKeyDown("arrowup")) t = 1;
                        if (this.inputManager.isKeyDown("s") || this.inputManager.isKeyDown("arrowdown")) t = -1;
                        if (this.inputManager.isKeyDown("a") || this.inputManager.isKeyDown("arrowleft")) s = -1;
                        if (this.inputManager.isKeyDown("d") || this.inputManager.isKeyDown("arrowright")) s = 1;

                        if (Math.abs(this.inputManager.joystickThrottle) > 0.01) t = this.inputManager.joystickThrottle;
                        if (Math.abs(this.inputManager.joystickSteer) > 0.01) s = this.inputManager.joystickSteer;

                        this.playerVehicle.throttleInput = t;
                        this.playerVehicle.steerInput = s;

                        if (this.inputManager.isKeyDown("shift") || this.inputManager.joystickAbility) {
                            this.playerVehicle.triggerAbility();
                            this.inputManager.joystickAbility = false; // consume
                        }
                    }
                } else if (this.isSpectator && !this.menuOpen) {
                    // Spectator controls to switch targets
                    if (this.inputManager.isKeyDown(" ") || this.inputManager.isKeyDown("arrowright")) {
                        if (this.enemies.length > 0) {
                            this.spectatedIndex = (this.spectatedIndex + 1) % this.enemies.length;
                            const target = this.enemies[this.spectatedIndex].botVehicle.mesh;
                            if (this.specCam) this.specCam.setTarget(target);
                        }
                        this.inputManager.keys[" "] = false;
                        this.inputManager.keys["arrowright"] = false;
                    }
                    if (this.inputManager.isKeyDown("arrowleft")) {
                        if (this.enemies.length > 0) {
                            this.spectatedIndex = (this.spectatedIndex - 1 + this.enemies.length) % this.enemies.length;
                            const target = this.enemies[this.spectatedIndex].botVehicle.mesh;
                            if (this.specCam) this.specCam.setTarget(target);
                        }
                        this.inputManager.keys["arrowleft"] = false;
                    }
                }

                // Broadcast state at ~20hz (every 50ms)
                const now = performance.now();
                if (!this.scene.metadata?.combatEnded && this.networkManager && this.playerVehicle && now - this.lastNetworkTick > 50) {
                    const pos = this.playerVehicle.mesh.getAbsolutePosition();
                    const rot = this.playerVehicle.mesh.rotationQuaternion!;
                    this.networkManager.broadcastState(
                        { x: pos.x, y: pos.y, z: pos.z },
                        { x: rot.x, y: rot.y, z: rot.z, w: rot.w }
                    );
                    
                    // Host broadcasts bots
                    if (this.roomData?.isHost) {
                        this.enemies.forEach(enemy => {
                            const bpos = enemy.botVehicle.mesh.getAbsolutePosition();
                            const brot = enemy.botVehicle.mesh.rotationQuaternion!;
                            const wid = (enemy as any).botWeapon?.weaponId || "minigun";
                            this.networkManager!.broadcastBotState(
                                enemy.botVehicle.mesh.metadata.aiId,
                                enemy.botVehicle.vehicleId || "interceptor",
                                wid,
                                { x: bpos.x, y: bpos.y, z: bpos.z },
                                { x: brot.x, y: brot.y, z: brot.z, w: brot.w },
                                enemy.botVehicle.health
                            );
                        });
                    }

                    this.lastNetworkTick = now;
                }
                
                // Toggle bots based on match state
                this.enemies.forEach(enemy => {
                    enemy.isActive = (this.matchState === 'playing');
                });

                if (this.matchSnapshot && this.matchState !== 'mvp') {
                    const now = Date.now();
                    const nextState = resolveMatchPhase(this.matchSnapshot, now);
                    if (nextState !== this.matchState) {
                        this.matchState = nextState;
                        if (nextState === 'countdown') window.dispatchEvent(new CustomEvent('match-countdown-start'));
                        if (nextState === 'playing') window.dispatchEvent(new CustomEvent('match-start'));
                    }
                    this.matchTimer = Math.max(0, (this.matchSnapshot.endsAt - now) / 1000);
                    this.introTimer = nextState === 'intro'
                        ? Math.max(0, now - (this.matchSnapshot.startsAt - TDM_RULES.introMs - TDM_RULES.countdownMs))
                        : nextState === 'countdown'
                            ? Math.max(0, now - (this.matchSnapshot.startsAt - TDM_RULES.countdownMs))
                            : 0;
                }

                const combatEnded = this.matchState === 'ended' || this.matchState === 'mvp';
                this.scene.metadata ??= {};
                this.scene.metadata.combatEnded = combatEnded;
                this.scene.physicsEnabled = !combatEnded;
                if (this.playerWeapon) {
                    this.playerWeapon.controlsEnabled = this.matchState === 'playing' && !this.menuOpen;
                    this.playerWeapon.firingRequested = this.playerWeapon.controlsEnabled && (this.inputManager.isKeyDown(' ') || this.inputManager.joystickFiring);
                }
                this.updateCamera();
                this.scene.render();
            }
        });
    }

    private async initPhysics(): Promise<void> {
        try {
            const havokInstance = await HavokPhysics();
            if (this.isDisposed) return;
            const havokPlugin = new HavokPlugin(true, havokInstance);
            this.scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);
            this.scene.getPhysicsEngine()?.setSubTimeStep(1000 / 120);

        } catch (error) {
            throw new Error("Physics initialization failed", { cause: error });
        }
    }

    private async setupBasicEnvironment(): Promise<void> {
        // Load Map Environment — returns the safe spawn Y above terrain
        const safeSpawnY = await MapLoader.loadMap(this.scene, this.mapId);

        if (this.isDisposed) return;
        VfxManager.initialize(this.scene);
        SoundManager.getInstance().init(this.scene);

        const settings = GraphicsSettingsManager.getInstance().getConfig();
        const quality = GraphicsSettingsManager.getInstance().getQuality();

        // Add Glow Layer for VFX conditionally
        if (settings.enableGlow) {
            this.glowLayer = new GlowLayer("glow", this.scene);
            this.glowLayer.intensity = 1.0;
            for (const mesh of this.scene.meshes) if (mesh.metadata?.skybox) this.glowLayer.addExcludedMesh(mesh as Mesh);
        }

        // Run SceneOptimizer based on Quality
        const options = createDynamicSceneOptimizerOptions(quality);
        SceneOptimizer.OptimizeAsync(this.scene, options);

        const spawnPos = new Vector3(0, safeSpawnY, 0);

        if (this.isSpectator) {
            // Setup Spectator Camera
            this.specCam = new ArcRotateCamera("specCam", Math.PI / 4, Math.PI / 3, 60, Vector3.Zero(), this.scene);
            this.specCam.attachControl(this.engine.getRenderingCanvas(), true);
            this.specCam.lowerRadiusLimit = 10;
            this.specCam.upperRadiusLimit = 200;
        } else {
            // Basic camera
            this.camera = new FreeCamera("mainCamera", new Vector3(0, 10, -20), this.scene);
            this.camera.setTarget(Vector3.Zero());
            this.camera.fov = 0.82;
            this.camera.minZ = 0.2;

            if (this.roomData) {
                const teamSpawn = getTeamSpawn(this.roomData.localMember.teamId, this.roomData.localMember.slot, safeSpawnY);
                spawnPos.set(teamSpawn.x, teamSpawn.y, teamSpawn.z);
            }

            // Player Vehicle — spawned ON the terrain, never inside it
            this.playerVehicle = await VehicleFactory.createVehicle(this.scene, this.vehicleId, this.weaponId, spawnPos, this.vehicleColor);
            
            // Turn vehicle to face the center
            if (this.roomData) {
                const teamSpawn = getTeamSpawn(this.roomData.localMember.teamId, this.roomData.localMember.slot, safeSpawnY);
                this.playerVehicle.mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(teamSpawn.yaw, 0, 0);
                this.playerVehicle.serverManagedRespawn = true;
            }

            if (this.isDisposed) return;
            this.playerVehicle.isPlayer = true;

            // Setup Networking
            this.networkManager = new NetworkManager(this.mapId, this.vehicleId, this.weaponId, this.vehicleColor, this.roomData?.socket, this.roomData?.roomId, this.roomData?.matchId);

            // Player Weapon
            this.playerWeapon = new WeaponController(this.scene, this.playerVehicle.mesh, this.weaponId, this.networkManager.id, true, this.networkManager);
            const localMember = this.roomData?.localMember;
            this.playerVehicle.mesh.metadata = {
                ...this.playerVehicle.mesh.metadata,
                entityId: this.networkManager.id,
                playerId: this.networkManager.id,
                displayName: localMember?.displayName ?? 'YOU',
                kind: 'human',
                teamId: localMember?.teamId,
                vehicle: this.playerVehicle,
            };
            
            if (this.roomData) {
                this.matchState = 'intro';
            }
        }

        const allVehicles = ["interceptor", "juggernaut", "phantom", "manticore", "valkyrie", "wraith", "behemoth"];
        // const allVehicles = ["juggernaut", "juggernaut", "juggernaut", "juggernaut", "juggernaut", "juggernaut", "juggernaut"] //for testing giving all bots juggernaut
        const allWeapons = ["minigun", "plasma", "missile", "mortar", "nuke"]; //uncomment this
        // const allWeapons = ["missile", "missile", "missile", "missile", "missile", "missile", "missile"] //for testing giving all bots missles

        const botMembers = this.roomData
            ? (this.roomData.isHost ? this.roomData.snapshot.roster.filter(member => member.kind === 'bot') : [])
            : Array.from({ length: this.isSpectator ? 10 : 5 }, (_, index) => ({
                entityId: `bot_${index}`,
                displayName: `BOT ${index + 1}`,
                kind: 'bot' as const,
                teamId: undefined,
                slot: index,
                vehicleId: allVehicles[Math.floor(Math.random() * allVehicles.length)],
                weaponId: allWeapons[Math.floor(Math.random() * allWeapons.length)],
                connected: true,
            }));

        for (const member of botMembers) {
            if (this.isDisposed) return;
            let enemySpawnPos = new Vector3();
            if (member.teamId) {
                const teamSpawn = getTeamSpawn(member.teamId, member.slot, safeSpawnY);
                enemySpawnPos.set(teamSpawn.x, teamSpawn.y, teamSpawn.z);
            } else {
                do {
                    enemySpawnPos.x = Math.random() * 300 - 150;
                    enemySpawnPos.z = Math.random() * 300 - 150;
                    enemySpawnPos.y = safeSpawnY;
                } while (Vector3.Distance(enemySpawnPos, spawnPos) < 60);
            }

            const aiVehicle = await VehicleFactory.createVehicle(this.scene, member.vehicleId, member.weaponId, enemySpawnPos);
            if (this.isDisposed) return;
            if (member.teamId) {
                const teamSpawn = getTeamSpawn(member.teamId, member.slot, safeSpawnY);
                aiVehicle.mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(teamSpawn.yaw, 0, 0);
                aiVehicle.serverManagedRespawn = true;
            }
            aiVehicle.mesh.metadata = { ...aiVehicle.mesh.metadata, entityId: member.entityId, aiId: member.entityId, displayName: member.displayName, kind: 'bot', teamId: member.teamId, vehicle: aiVehicle };
            if (member.teamId) attachTeamMarker(aiVehicle.mesh, member.teamId, false);
            const aiWeapon = new WeaponController(this.scene, aiVehicle.mesh, member.weaponId, member.entityId, false, this.networkManager);
            this.remoteWeapons.set(member.entityId, aiWeapon);

            const aiController = new AIBotController(aiVehicle, this.playerVehicle, this.enemies, this.scene, aiWeapon, () => Array.from(this.remotePlayers.values()));
            this.enemies.push(aiController);
        }

        if (this.isSpectator && this.enemies.length > 0 && this.specCam) {
            this.spectatedIndex = 0;
            this.specCam.setTarget(this.enemies[0].botVehicle.mesh);
        }

        // Give weapons the target pool (AI + Players)
        this.updateTargetPools();

        if (!this.isSpectator && this.networkManager) {
            this.networkManager.onPlayerJoined = async (player) => {
                if (this.remotePlayers.has(player.id)) return;
                const spawnPos = new Vector3(player.position.x, player.position.y, player.position.z);
                if (this.isDisposed) return;
                const remoteVeh = await VehicleFactory.createRemoteVehicle(this.scene, player.vehicleId, player.weaponId || "minigun", spawnPos, player.vehicleColor);
                if (this.isDisposed) { remoteVeh.dispose(); return; }
                remoteVeh.maxHealth = player.maxHealth ?? remoteVeh.maxHealth;
                remoteVeh.health = player.health ?? remoteVeh.maxHealth;
                remoteVeh.serverManagedRespawn = Boolean(this.roomData);
                remoteVeh.mesh.metadata = { ...remoteVeh.mesh.metadata, entityId: player.id, playerId: player.id, displayName: player.displayName, kind: 'human', teamId: player.teamId, vehicle: remoteVeh };
                if (player.teamId) attachTeamMarker(remoteVeh.mesh, player.teamId);
                this.remotePlayers.set(player.id, remoteVeh);

                const remoteWeapon = new WeaponController(this.scene, remoteVeh.mesh, player.weaponId || "minigun", player.id, false, null);
                this.remoteWeapons.set(player.id, remoteWeapon);
                this.updateTargetPools();
            };

            this.networkManager.onPlayerMoved = (player) => {
                const remoteVeh = this.remotePlayers.get(player.id);
                if (remoteVeh) {
                    remoteVeh.updateNetworkState(player.position, player.rotation);
                }
            };

            this.networkManager.onPlayerDisconnected = (playerId) => {
                const remoteVeh = this.remotePlayers.get(playerId);
                if (remoteVeh) {
                    remoteVeh.dispose();
                    this.remotePlayers.delete(playerId);
                }
                this.remoteWeapons.delete(playerId);
                this.updateTargetPools();
            };

            this.networkManager.onPlayerShoot = (playerId, origin, hitPoint, targetId) => {
                const remoteWeapon = this.remoteWeapons.get(playerId);
                if (remoteWeapon) {
                    remoteWeapon.playRemoteShot(new Vector3(origin.x, origin.y, origin.z), new Vector3(hitPoint.x, hitPoint.y, hitPoint.z), targetId);
                }
            };

            this.networkManager.onBotState = async (botId, vehicleId, weaponId, pos, rot, health) => {
                if (this.roomData?.isHost) return; // Host controls bots locally
                let remoteBot = this.remotePlayers.get(botId);
                if (!remoteBot) {
                    const member = this.matchSnapshot?.roster.find(candidate => candidate.entityId === botId);
                    const spawnPos = new Vector3(pos.x, pos.y, pos.z);
                    remoteBot = await VehicleFactory.createRemoteVehicle(this.scene, vehicleId, weaponId, spawnPos, undefined);
                    if (this.isDisposed) { remoteBot.dispose(); return; }
                    remoteBot.serverManagedRespawn = Boolean(this.roomData);
                    remoteBot.mesh.metadata = { ...remoteBot.mesh.metadata, entityId: botId, aiId: botId, displayName: member?.displayName ?? 'BOT', kind: 'bot', teamId: member?.teamId, vehicle: remoteBot };
                    if (member?.teamId) attachTeamMarker(remoteBot.mesh, member.teamId);
                    this.remotePlayers.set(botId, remoteBot);
                    
                    const remoteWeapon = new WeaponController(this.scene, remoteBot.mesh, weaponId, botId, false, null);
                    this.remoteWeapons.set(botId, remoteWeapon);
                    this.updateTargetPools();
                } else {
                    remoteBot.updateNetworkState(pos, rot);
                    if (health !== undefined) {
                        if (health > remoteBot.maxHealth) remoteBot.maxHealth = health;
                        remoteBot.health = health;
                        remoteBot.updateHealthBar();
                        if (health <= 0) remoteBot.explode();
                    }
                }
            };

            this.networkManager.onBotShoot = (botId, origin, hitPoint, targetId) => {
                const remoteWeapon = this.remoteWeapons.get(botId);
                if (remoteWeapon) {
                    remoteWeapon.playRemoteShot(new Vector3(origin.x, origin.y, origin.z), new Vector3(hitPoint.x, hitPoint.y, hitPoint.z), targetId);
                }
            };

            this.networkManager.onHealthUpdated = (playerId, health) => {
                if (playerId === this.networkManager?.id && this.playerVehicle) {
                    this.playerVehicle.syncAuthoritativeHealth(health);
                } else {
                    const remoteVeh = this.remotePlayers.get(playerId);
                    if (remoteVeh) {
                        remoteVeh.health = health;
                        remoteVeh.updateHealthBar();
                        if (health <= 0) remoteVeh.explode();
                    } else {
                        const localBot = this.enemies.find(enemy => enemy.botVehicle.mesh.metadata?.entityId === playerId)?.botVehicle;
                        if (localBot) {
                            localBot.syncAuthoritativeHealth(health);
                        }
                    }
                }
            };

            this.networkManager.onPlayerDestroyed = (playerId) => {
                if (playerId === this.networkManager?.id && this.playerVehicle) {
                    // Server told us we died
                    this.playerVehicle.health = 0;
                    this.playerVehicle.applyDamage(0); // Triggers explode() locally
                } else {
                    const remoteVeh = this.remotePlayers.get(playerId);
                    if (remoteVeh) {
                        remoteVeh.health = 0;
                        remoteVeh.explode();
                    }
                }
            };

            this.networkManager.onAbilityUsed = (playerId, abilityName) => {
                const remoteVeh = this.remotePlayers.get(playerId);
                if (remoteVeh) {
                    remoteVeh.triggerAbility(abilityName);
                }
            };

            this.networkManager.onMatchSnapshot = snapshot => {
                this.matchSnapshot = snapshot;
                if (!this.mvpShowcase) this.matchState = resolveMatchPhase(snapshot);
            };

            this.networkManager.onCombatantDestroyed = ({ attackerId, targetId, weaponId }) => {
                const attacker = this.matchSnapshot?.roster.find(member => member.entityId === attackerId);
                const target = this.matchSnapshot?.roster.find(member => member.entityId === targetId);
                window.dispatchEvent(new CustomEvent('kill-feed', { detail: {
                    killer: attackerId === 'environment' ? 'SYSTEM' : attackerId === this.networkManager?.id ? 'YOU' : attacker?.displayName ?? 'UNKNOWN',
                    victim: targetId === this.networkManager?.id ? 'YOU' : target?.displayName ?? 'UNKNOWN',
                    weapon: weaponId,
                    killerTeam: attacker?.teamId,
                    victimTeam: target?.teamId,
                } }));
                if (attackerId === this.networkManager?.id) window.dispatchEvent(new CustomEvent('hit-marker', { detail: { isKill: true } }));
            };

            this.networkManager.onCombatantRespawned = ({ entityId, health, spawn, invulnerableUntil }) => {
                const position = new Vector3(spawn.x, safeSpawnY, spawn.z);
                if (entityId === this.networkManager?.id && this.playerVehicle) {
                    this.playerVehicle.maxHealth = health;
                    this.playerVehicle.respawnAt(position, spawn.yaw);
                    this.playerVehicle.grantRespawnProtection(invulnerableUntil);
                    return;
                }
                const localBot = this.enemies.find(enemy => enemy.botVehicle.mesh.metadata?.entityId === entityId)?.botVehicle;
                if (localBot) {
                    localBot.maxHealth = health;
                    localBot.respawnAt(position, spawn.yaw);
                    localBot.grantRespawnProtection(invulnerableUntil);
                    return;
                }
                this.remotePlayers.get(entityId)?.respawnAt(position, spawn.yaw, health);
            };

            this.networkManager.onMatchEnded = snapshot => {
                if (this.matchEndDispatched) return;
                this.matchEndDispatched = true;
                this.matchSnapshot = snapshot;
                this.matchState = 'ended';
                if (this.playerVehicle) {
                    this.playerVehicle.throttleInput = 0;
                    this.playerVehicle.steerInput = 0;
                }
                window.dispatchEvent(new CustomEvent('match-end', { detail: snapshot }));
            };
        }

        window.addEventListener('send-hit', ((e: CustomEvent) => {
            if (this.networkManager) {
                this.networkManager.sendHit(e.detail.targetId, e.detail.damage, e.detail.attackerId, e.detail.weaponId ?? 'ability');
            }
        }) as EventListener, { signal: this.eventAbort.signal });

        window.addEventListener('send-ability-used', ((e: CustomEvent) => {
            if (this.networkManager) {
                this.networkManager.broadcastAbilityUsed(e.detail.abilityName, e.detail.actorId);
            }
        }) as EventListener, { signal: this.eventAbort.signal });

        window.addEventListener('request-player-respawn', (() => {
            this.networkManager?.requestRespawn();
        }) as EventListener, { signal: this.eventAbort.signal });

        window.addEventListener('camera-shake', ((e: CustomEvent) => {
            this.shakeCamera(e.detail.intensity || 1.0, e.detail.duration || 200);
        }) as EventListener, { signal: this.eventAbort.signal });

        window.addEventListener('dash-warp', (() => {
            this.dashFovOffset = 0.6; // Adds FOV for warp effect
        }) as EventListener, { signal: this.eventAbort.signal });
    }

    private updateCamera(): void {
        if (this.mvpShowcase || this.isSpectator || !this.camera || !this.playerVehicle) return;

        const hullPos = this.playerVehicle.mesh.getAbsolutePosition();

        if (this.matchState === 'intro' || this.matchState === 'countdown') {
            this.cameraBasePosition = null;
            // Cinematic orbit during intro or MVP showcase
            this.cameraYaw += 0.005; 
            const CAM_HEIGHT = 15;
            const CAM_DIST = 35;
            const behindX = Math.sin(this.cameraYaw);
            const behindZ = Math.cos(this.cameraYaw);
            const idealCamPos = hullPos
                .subtract(new Vector3(behindX, 0, behindZ).scale(CAM_DIST))
                .add(new Vector3(0, CAM_HEIGHT, 0));
            this.camera.position = Vector3.Lerp(this.camera.position, idealCamPos, 0.1);
            this.camera.setTarget(Vector3.Lerp(this.camera.getTarget(), hullPos, 0.1));
            return;
        }

        // Extract vehicle's world-space yaw from its rotation quaternion
        // This gives us the angle the hull is ACTUALLY facing, no drift
        const q = this.playerVehicle.mesh.rotationQuaternion;
        let hullYaw = 0;
        if (q) {
            // Standard quaternion → yaw formula
            hullYaw = Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z));
        } else {
            const fwd = this.playerVehicle.mesh.forward;
            hullYaw = Math.atan2(fwd.x, fwd.z);
        }

        const deltaSeconds = Math.min(this.engine.getDeltaTime() / 1000, 0.05);

        // Shortest-path angular follow so the view stays stable through drifts.
        let delta = hullYaw - this.cameraYaw;
        // Wrap delta to [-π, π]
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;
        const yawFollow = 1 - Math.exp(-7 * deltaSeconds);
        this.cameraYaw += delta * yawFollow;

        // Elevated chase framing: full vehicle below center with useful road visibility.
        const behindX = Math.sin(this.cameraYaw);
        const behindZ = Math.cos(this.cameraYaw);
        const forward = new Vector3(behindX, 0, behindZ);
        const speedFactor = Math.min(this.playerVehicle.getSpeed() / 160, 1);
        const vehicleScale = this.playerVehicle.mesh.metadata?.vehicleScale ?? 1;
        const framingScale = 1 + (vehicleScale - 1) * 0.3;
        const cameraDistance = this.chaseCamera.distance * framingScale + speedFactor * 1.75;
        const cameraHeight = this.chaseCamera.height * framingScale + speedFactor * 0.5;
        const lookAhead = hullPos
            .add(forward.scale(this.chaseCamera.lookAhead + speedFactor * 1.5))
            .add(new Vector3(0, this.chaseCamera.lookHeight * vehicleScale, 0));
        let idealCamPos = hullPos
            .subtract(forward.scale(cameraDistance))
            .add(new Vector3(0, cameraHeight, 0));

        // Pull the camera in front of walls instead of letting the view clip through them.
        const focusToCamera = idealCamPos.subtract(lookAhead);
        const obstructionDistance = focusToCamera.length();
        const obstructionRay = new Ray(lookAhead, focusToCamera.scale(1 / obstructionDistance), obstructionDistance);
        const obstruction = this.scene.pickWithRay(obstructionRay, mesh => {
            if (!mesh.isVisible || mesh.name === 'skyBox' || mesh.metadata?.presentationOnly) return false;
            if (mesh === this.playerVehicle?.mesh || mesh.isDescendantOf(this.playerVehicle!.mesh)) return false;
            if (getCombatantMetadata(mesh)) return false;
            // Only terrain and physical scenery can move the chase camera. VFX and projectiles cannot.
            return mesh.metadata?.terrain === true || Boolean(mesh.physicsBody);
        });
        if (obstruction?.hit && obstruction.pickedPoint) {
            idealCamPos = obstruction.pickedPoint.subtract(obstructionRay.direction.scale(this.chaseCamera.collisionPadding));
        }

        const positionFollow = 1 - Math.exp(-11 * deltaSeconds);
        this.cameraBasePosition = Vector3.Lerp(this.cameraBasePosition ?? this.camera.position, idealCamPos, positionFollow);
        this.camera.position.copyFrom(this.cameraBasePosition);

        const currentLook = this.camera.getTarget();
        const targetFollow = 1 - Math.exp(-9 * deltaSeconds);
        this.camera.setTarget(Vector3.Lerp(currentLook, lookAhead, targetFollow));

        // Apply screen shake
        if (this.shakeIntensity > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity -= this.shakeDecay;
            if (this.shakeIntensity < 0) this.shakeIntensity = 0;
        }

        // Apply FOV Dash Warp
        if (this.dashFovOffset > 0) {
            this.dashFovOffset *= 0.9;
            if (this.dashFovOffset < 0.01) this.dashFovOffset = 0;
            this.camera.fov = 0.82 + this.dashFovOffset;
        }
    }

    public shakeCamera(intensity: number, durationMs: number = 200) {
        this.shakeIntensity = intensity;
        this.shakeDecay = intensity / (durationMs / 16.66);
    }

    public getSpeed(): number {
        return this.playerVehicle ? this.playerVehicle.getSpeed() : 0;
    }

    /** Exposes only a living hostile acquired by the weapon's existing LOS scan. */
    public getTargetedHostile(): { mesh: Mesh; locked: boolean } | null {
        const target = this.playerWeapon?.currentTarget;
        if (this.matchState !== 'playing' || !this.playerVehicle || this.playerVehicle.isDead || !target || target.isDisposed() || !target.isEnabled()) return null;
        if (target.metadata?.vehicle?.isDead || target.metadata?.vehicle?.isCloaked) return null;
        if (this.localTeam && target.metadata?.teamId === this.localTeam) return null;
        return { mesh: target, locked: this.playerWeapon.isLocked };
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

    /** Starts an isolated presentation of the exact selected combatant, including dead/remote vehicles. */
    public startMvpShowcase(mvpEntityId?: string): boolean {
        if (this.isDisposed || this.mvpShowcase) return false;
        const vehicles = [this.playerVehicle, ...this.remotePlayers.values(), ...this.enemies.map(enemy => enemy.botVehicle)];
        const vehicle = vehicles.find(candidate => candidate?.mesh.metadata?.entityId === mvpEntityId);
        if (!vehicle || vehicle.mesh.isDisposed()) return false;
        this.matchState = 'mvp';
        this.scene.metadata = { ...this.scene.metadata, combatEnded: true };
        this.scene.physicsEnabled = false;
        SoundManager.getInstance().stopEngineSound();
        this.mvpShowcase = new MvpShowcase(this.scene, vehicle.mesh, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        return true;
    }

    public dispose(): void {
        if (this.isDisposed) return;
        this.isDisposed = true;
        this.eventAbort.abort();
        this.mvpShowcase?.dispose();
        SoundManager.getInstance().cleanup();
        this.engine.stopRenderLoop();
        window.removeEventListener('resize', this.resize);
        window.removeEventListener('graphics-settings-changed', this.graphicsChanged);

        if (this.specCam) this.specCam.dispose();

        this.inputManager.dispose();
        this.playerVehicle?.dispose();
        this.enemies.forEach(e => e.dispose());
        if (this.networkManager) this.networkManager.dispose();
        this.remotePlayers.forEach(v => v.dispose());
        this.scene.dispose();
        this.engine.dispose();
    }

    private handleGraphicsSettingsChanged() {
        const settings = GraphicsSettingsManager.getInstance().getConfig();

        // Update Resolution Scaling
        this.engine.setHardwareScalingLevel(settings.hardwareScalingLevel);

        // Handle Glow Layer
        if (settings.enableGlow) {
            if (!this.glowLayer) {
                this.glowLayer = new GlowLayer("glow", this.scene);
                this.glowLayer.intensity = 1.0;
                for (const mesh of this.scene.meshes) if (mesh.metadata?.skybox) this.glowLayer.addExcludedMesh(mesh as Mesh);
            }
        } else {
            if (this.glowLayer) {
                this.glowLayer.dispose();
                this.glowLayer = null;
            }
        }
    }

    private updateTargetPools() {
        if (!this.playerWeapon) return;

        const botMeshes = this.enemies.map(e => e.botVehicle.mesh);
        const playerMeshes = Array.from(this.remotePlayers.values()).map(v => v.mesh);
        const allTargets = [...botMeshes, ...playerMeshes];

        this.playerWeapon.setTargetPool(allTargets);

        const aiTargets = [...allTargets];
        if (this.playerVehicle?.mesh) {
            aiTargets.push(this.playerVehicle.mesh);
        }

        this.remoteWeapons.forEach(weapon => {
            weapon.setTargetPool(aiTargets);
        });
    }

}
