import { MATCH_VEHICLE_SCALE, scaleVehicleVisuals } from '../models/VehicleScale';
import { groundHeight } from '../levels/ArenaTerrain';
import { registerVehicleShadows } from '../engine/VehicleShadows';
import { buildVehicleModel, type ChassisDimensions } from '../models/VehicleModel';
import { buildImportedVehicleModel, supportsImportedVehicle } from '../models/ImportedVehicleModel';
import { Scene, MeshBuilder, Color3, Vector3, Mesh } from "@babylonjs/core";
import { VehicleController, type VehicleConfig } from "./VehicleController";
import { RemoteVehicle } from "./RemoteVehicle";

export class VehicleFactory {
    public static async createVehicle(scene: Scene, vehicleId: string, weaponId: string, spawnPos: Vector3, vehicleColor?: string): Promise<VehicleController> {
        let config: VehicleConfig;
        let chassisSize = { width: 2.2, height: 1.0, depth: 4.5 };
        let wheelScale = 1.0;
        let chassisColor = new Color3(0.78, 0.3, 0.12); // Rust default

        if (vehicleId === "juggernaut") {
            config = {
                mass: 3500,
                maxSpeed: 16,
                steeringSpeed: 1.5,
                driftFactor: 0.98,
                acceleration: 15,
                reverseAcceleration: -10,
                maxHealth: 1600
            };
            chassisSize = { width: 3.5, height: 1.8, depth: 5.5 };
            wheelScale = 1.5;
            chassisColor = new Color3(0.2, 0.2, 0.22); // Dark steel/carbon
        } else if (vehicleId === "phantom") {
            config = {
                mass: 800,
                maxSpeed: 25,
                steeringSpeed: 4.5,
                driftFactor: 0.85,
                acceleration: 22,
                reverseAcceleration: -12,
                maxHealth: 450
            };
            chassisSize = { width: 1.8, height: 0.5, depth: 4.0 };
            wheelScale = 0.8;
            chassisColor = new Color3(0.05, 0.05, 0.08); // Stealth black/grey
        } else if (vehicleId === "manticore") {
            config = {
                mass: 2500,
                maxSpeed: 18,
                steeringSpeed: 2.0,
                driftFactor: 0.95,
                acceleration: 17,
                reverseAcceleration: -12,
                maxHealth: 1200
            };
            chassisSize = { width: 2.8, height: 1.5, depth: 5.0 };
            wheelScale = 1.2;
            chassisColor = new Color3(0.7, 0.5, 0.1); // Desert tan/orange
        } else if (vehicleId === "valkyrie") {
            config = {
                mass: 1200,
                maxSpeed: 23,
                steeringSpeed: 4.0,
                driftFactor: 0.80,
                acceleration: 20,
                reverseAcceleration: -10,
                maxHealth: 700
            };
            chassisSize = { width: 2.2, height: 0.6, depth: 4.8 };
            wheelScale = 0.85;
            chassisColor = new Color3(0.1, 0.6, 0.8); // Neon cyan
        } else if (vehicleId === "wraith") {
            config = {
                mass: 600,
                maxSpeed: 28,
                steeringSpeed: 5.0,
                driftFactor: 0.99,
                acceleration: 26,
                reverseAcceleration: -14,
                maxHealth: 350
            };
            chassisSize = { width: 2.0, height: 0.4, depth: 3.5 };
            wheelScale = 0.5;
            chassisColor = new Color3(0.1, 0.9, 0.3); // Neon green
        } else if (vehicleId === "behemoth") {
            config = {
                mass: 6000,
                maxSpeed: 12,
                steeringSpeed: 1.0,
                driftFactor: 0.90,
                acceleration: 11,
                reverseAcceleration: -7,
                maxHealth: 2500
            };
            chassisSize = { width: 4.0, height: 2.5, depth: 6.0 };
            wheelScale = 2.0;
            chassisColor = new Color3(0.15, 0.15, 0.15); // Black/grey
        } else {
            // Interceptor (Default)
            config = {
                mass: 1000,
                maxSpeed: 20,
                steeringSpeed: 3.2,
                driftFactor: 0.90,
                acceleration: 18,
                reverseAcceleration: -10,
                maxHealth: 600
            };
            chassisSize = { width: 2.0, height: 0.8, depth: 4.2 };
            wheelScale = 0.9;
            chassisColor = new Color3(0.85, 0.2, 0.1); // Crimson
        }
        
        if (vehicleColor) {
            chassisColor = Color3.FromHexString(vehicleColor);
        }

        // 1. Create Physics Root Box (Invisible)
        const tireRadius = 0.6 * wheelScale;
        const physicsWidth = (chassisSize.width + 0.8 * wheelScale) * MATCH_VEHICLE_SCALE;
        const physicsHeight = (chassisSize.height + tireRadius + 0.2) * MATCH_VEHICLE_SCALE;
        const physicsDepth = chassisSize.depth * MATCH_VEHICLE_SCALE;

        const root = MeshBuilder.CreateBox(`${vehicleId}_root`, { width: physicsWidth, height: physicsHeight, depth: physicsDepth }, scene);
        root.position.copyFrom(spawnPos);
        root.isVisible = false; // Hidden collision box
        root.metadata = { vehicleScale: MATCH_VEHICLE_SCALE, labelHeight: Math.max(5.8 * MATCH_VEHICLE_SCALE, physicsHeight + 2.2 * MATCH_VEHICLE_SCALE) };
        const surface = groundHeight(scene, spawnPos.x, spawnPos.z);
        if (surface !== null) root.position.y = Math.max(root.position.y, surface + physicsHeight / 2 + 0.25);

        // Assign physical dimensions to config for controller usage
        config.width = physicsWidth;
        config.height = physicsHeight;
        config.depth = physicsDepth;
        config.wheelRadius = tireRadius * MATCH_VEHICLE_SCALE;

        // 2. Return Controller using the ROOT mesh for physics (Initialize Physics FIRST!)
        const controller = new VehicleController(root, scene, config, vehicleId);

        // 3. Attach visual mesh after physics is baked
        await this.buildVisualMesh(root, scene, vehicleId, weaponId, chassisSize, chassisColor, wheelScale, tireRadius);

        scaleVehicleVisuals(root, MATCH_VEHICLE_SCALE);
        controller.attachVisuals();
        registerVehicleShadows(root);

        return controller;
    }

    public static async createRemoteVehicle(scene: Scene, vehicleId: string, weaponId: string, spawnPos: Vector3, vehicleColor?: string, scale = MATCH_VEHICLE_SCALE): Promise<RemoteVehicle> {
        // Just like createVehicle, but we don't attach Havok physics or the VehicleController.
        // We use a dummy root mesh to hold the visuals.
        let chassisSize = { width: 2.2, height: 1.0, depth: 4.5 };
        let wheelScale = 1.0;
        let chassisColor = new Color3(0.78, 0.3, 0.12);

        if (vehicleId === "juggernaut") {
            chassisSize = { width: 3.5, height: 1.8, depth: 5.5 };
            wheelScale = 1.5;
            chassisColor = new Color3(0.2, 0.2, 0.22);
        } else if (vehicleId === "phantom") {
            chassisSize = { width: 1.8, height: 0.5, depth: 4.0 };
            wheelScale = 0.8;
            chassisColor = new Color3(0.05, 0.05, 0.08);
        } else if (vehicleId === "manticore") {
            chassisSize = { width: 2.8, height: 1.5, depth: 5.0 };
            wheelScale = 1.2;
            chassisColor = new Color3(0.7, 0.5, 0.1);
        } else if (vehicleId === "valkyrie") {
            chassisSize = { width: 2.2, height: 0.6, depth: 4.8 };
            wheelScale = 0.85;
            chassisColor = new Color3(0.1, 0.6, 0.8);
        } else if (vehicleId === "wraith") {
            chassisSize = { width: 2.0, height: 0.4, depth: 3.5 };
            wheelScale = 0.5;
            chassisColor = new Color3(0.1, 0.9, 0.3);
        } else if (vehicleId === "behemoth") {
            chassisSize = { width: 4.0, height: 2.5, depth: 6.0 };
            wheelScale = 2.0;
            chassisColor = new Color3(0.15, 0.15, 0.15);
        } else {
            chassisSize = { width: 2.0, height: 0.8, depth: 4.2 };
            wheelScale = 0.9;
            chassisColor = new Color3(0.85, 0.2, 0.1);
        }
        
        if (vehicleColor) {
            chassisColor = Color3.FromHexString(vehicleColor);
        }

        const tireRadius = 0.6 * wheelScale;

        // Dummy Root
        const root = MeshBuilder.CreateBox("remoteVehicleRoot", { width: 0.1, height: 0.1, depth: 0.1 }, scene);
        root.position.copyFrom(spawnPos);
        root.isVisible = false;
        const visualHeight = chassisSize.height + tireRadius + 0.2;
        root.metadata = { vehicleScale: scale, labelHeight: Math.max(5.8, visualHeight + 2.2) * scale };

        await this.buildVisualMesh(root, scene, vehicleId, weaponId, chassisSize, chassisColor, wheelScale, tireRadius);

        scaleVehicleVisuals(root, scale);
        registerVehicleShadows(root);
        return new RemoteVehicle(root, scene);
    }

    private static async buildVisualMesh(parent: Mesh, scene: Scene, vehicleId: string, weaponId: string, chassisSize: ChassisDimensions, chassisColor: Color3, wheelScale: number, _tireRadius: number) {
        if (supportsImportedVehicle(vehicleId)) {
            try {
                await buildImportedVehicleModel(parent, scene, vehicleId, weaponId, chassisSize, chassisColor, wheelScale);
                return;
            } catch (error) {
                if (scene.isDisposed || parent.isDisposed()) throw error;
                console.warn(`[VehicleFactory] Falling back to the procedural ${vehicleId} model.`, error);
            }
        }
        buildVehicleModel(parent, vehicleId, weaponId, chassisSize, chassisColor, wheelScale);
    }
}
