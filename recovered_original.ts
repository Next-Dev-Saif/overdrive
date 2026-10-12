import { Scene, MeshBuilder, StandardMaterial, Color3, Vector3, TransformNode, Mesh, PBRMaterial } from "@babylonjs/core";
import { VehicleController, type VehicleConfig } from "./VehicleController";
import { RemoteVehicle } from "./RemoteVehicle";

export class VehicleFactory {
    public static async createVehicle(scene: Scene, vehicleId: string, weaponId: string, spawnPos: Vector3): Promise<VehicleController> {
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
                reverseAcceleration: -10
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
                reverseAcceleration: -12
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
                reverseAcceleration: -12
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
                reverseAcceleration: -10
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
                reverseAcceleration: -14
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
                reverseAcceleration: -7
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
                reverseAcceleration: -10
            };
            chassisSize = { width: 2.0, height: 0.8, depth: 4.2 };
            wheelScale = 0.9;
            chassisColor = new Color3(0.85, 0.2, 0.1); // Crimson
        }

        // 1. Create Physics Root Box (Invisible)
        const tireRadius = 0.6 * wheelScale;
        const physicsWidth = chassisSize.width + (0.8 * wheelScale);
        const physicsHeight = chassisSize.height + tireRadius + 0.2;
        const physicsDepth = chassisSize.depth;

        const root = MeshBuilder.CreateBox(`${vehicleId}_root`, { width: physicsWidth, height: physicsHeight, depth: physicsDepth }, scene);
        root.position.copyFrom(spawnPos);
        root.isVisible = false; // Hidden collision box

        // Assign physical dimensions to config for controller usage
        config.width = physicsWidth;
        config.height = physicsHeight;
        config.depth = physicsDepth;

        // 2. Return Controller using the ROOT mesh for physics (Initialize Physics FIRST!)
        const controller = new VehicleController(root, scene, config);

        // 3. Attach visual mesh after physics is baked
        await this.buildVisualMesh(root, scene, vehicleId, weaponId, chassisSize, chassisColor, wheelScale, tireRadius);

        controller.attachVisuals();

        return controller;
    }

    public static async createRemoteVehicle(scene: Scene, vehicleId: string, weaponId: string, spawnPos: Vector3): Promise<RemoteVehicle> {
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

        const tireRadius = 0.6 * wheelScale;

        // Dummy Root
        const root = MeshBuilder.CreateBox("remoteVehicleRoot", { width: 0.1, height: 0.1, depth: 0.1 }, scene);
        root.position.copyFrom(spawnPos);
        root.isVisible = false;

        await this.buildVisualMesh(root, scene, vehicleId, weaponId, chassisSize, chassisColor, wheelScale, tireRadius);

        return new RemoteVehicle(root, scene);
    }

    private static async buildVisualMesh(parent: Mesh, scene: Scene, vehicleId: string, weaponId: string, chassisSize: any, chassisColor: Color3, wheelScale: number, tireRadius: number) {
        // We will build everything relative to a visualRoot which is offset by yOffset
        const visualRoot = new TransformNode("visualRoot", scene);
        visualRoot.parent = parent;

        const tireCenterYOffset = -chassisSize.height / 2 + 0.2;
        const physicsHeight = chassisSize.height + tireRadius + 0.2;
        const tireBottomY = tireCenterYOffset - tireRadius;
        const yOffset = -(physicsHeight / 2) - tireBottomY;

        visualRoot.position.y = yOffset;

        // ════════════════════════════════════════════════════════
        //  COMBAT VEHICLE BUILDER — Per-Archetype Geometry
        // ════════════════════════════════════════════════════════
        const W = chassisSize.width;
        const H = chassisSize.height;
        const D = chassisSize.depth;

        // ── Shared PBR material factory ──────────────────────
        const makePBR = (name: string, color: Color3, metallic = 0.6, rough = 0.4) => {
            const m = new PBRMaterial(name, scene);
            m.albedoColor = color;
            m.metallic = metallic;
            m.roughness = rough;
            return m;
        };
        const makeEmissive = (name: string, color: Color3) => {
            const m = new StandardMaterial(name, scene);
            m.emissiveColor = color;
            m.disableLighting = true;
            return m;
        };

        const bodyMat = makePBR("bodyMat", chassisColor, 0.7, 0.25);
        const armorMat = makePBR("armorMat", new Color3(0.15, 0.15, 0.18), 0.85, 0.7);
        const glassMat2 = makePBR("glassMat2", new Color3(0.04, 0.07, 0.12), 0.95, 0.05);
        glassMat2.alpha = 0.72;
        const chromeMat = makePBR("chromeMat", new Color3(0.80, 0.82, 0.85), 1.0, 0.1);
        const headMat = makeEmissive("headMat", new Color3(0.85, 0.92, 1.0));
        const tailMat = makeEmissive("tailMat", new Color3(1.0, 0.08, 0.05));
        const accentMat = makeEmissive("accentMat", chassisColor.scale(1.8));

        // We will build everything relative to a chassisRoot for suspension roll
        const chassisRoot = new TransformNode("chassisRoot", scene);
        chassisRoot.parent = visualRoot;

        // helper: quick-create a box parented to chassisRoot
        const box = (name: string, w: number, h: number, d: number, mat: any, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0) => {
            const b = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
            b.position.set(px, py, pz);
            b.rotation.set(rx, ry, rz);
            b.material = mat;
            b.parent = chassisRoot;
            return b;
        };
        const cyl = (name: string, diam: number, h: number, tess: number, mat: any, px = 0, py = 0, pz = 0, rx = 0, rz = 0) => {
            const c = MeshBuilder.CreateCylinder(name, { diameter: diam, height: h, tessellation: tess }, scene);
            c.position.set(px, py, pz);
            c.rotation.set(rx, 0, rz);
            c.material = mat;
            c.parent = chassisRoot;
            return c;
        };

        if (vehicleId === "juggernaut") {
            // ═══ JUGGERNAUT — Armored War Rig ═══════════════════
            box("jug_baseframe", W, H * 0.35, D, armorMat, 0, -H * 0.33, 0);
            box("jug_body", W * 0.88, H * 0.65, D * 0.72, bodyMat, 0, H * 0.15, -D * 0.04);
            box("jug_cab", W * 0.82, H * 0.55, D * 0.30, bodyMat, 0, H * 0.62, D * 0.12);
            box("jug_cab_glass", W * 0.74, H * 0.38, D * 0.22, glassMat2, 0, H * 0.70, D * 0.12);
            box("jug_hood", W * 0.84, H * 0.18, D * 0.44, armorMat, 0, H * 0.06, D * 0.36);
            
            // Heavy Side Armor Plates with Gaps
            for (let p = 0; p < 4; p++) {
                const px = D * 0.3 - (p * (D * 0.18));
                box(`jug_plate_l${p}`, 0.12, H * 0.4, D * 0.16, armorMat, -W * 0.52, -H * 0.05, px);
                box(`jug_plate_r${p}`, 0.12, H * 0.4, D * 0.16, armorMat, W * 0.52, -H * 0.05, px);
                // Rivets on plates
                box(`jug_rivet_lt${p}`, 0.16, 0.05, 0.05, chromeMat, -W * 0.53, H * 0.1, px);
                box(`jug_rivet_lb${p}`, 0.16, 0.05, 0.05, chromeMat, -W * 0.53, -H * 0.2, px);
                box(`jug_rivet_rt${p}`, 0.16, 0.05, 0.05, chromeMat, W * 0.53, H * 0.1, px);
                box(`jug_rivet_rb${p}`, 0.16, 0.05, 0.05, chromeMat, W * 0.53, -H * 0.2, px);
            }

            // Massive Cow-catcher Push Bar
            box("jug_bar_base", W * 0.95, 0.25, 0.3, chromeMat, 0, -H * 0.2, D * 0.55);
            box("jug_bar_mid", W * 0.85, 0.15, 0.2, chromeMat, 0, H * 0.1, D * 0.52);
            box("jug_bar_top", W * 0.75, 0.15, 0.2, chromeMat, 0, H * 0.35, D * 0.48);
            for (let b = -3; b <= 3; b++) {
                box(`jug_bar_v${b}`, 0.15, H * 0.7, 0.15, chromeMat, b * (W * 0.12), H * 0.05, D * 0.53);
                box(`jug_spike${b}`, 0.05, H * 0.3, 0.05, chromeMat, b * (W * 0.12), H * 0.45, D * 0.5, Math.PI * 0.1, 0, 0);
            }

            // Exo-skeleton Rollcage
            box("jug_cage_fl", 0.15, H * 0.65, 0.15, chromeMat, -W * 0.42, H * 0.75, D * 0.22);
            box("jug_cage_fr", 0.15, H * 0.65, 0.15, chromeMat, W * 0.42, H * 0.75, D * 0.22);
            box("jug_cage_top", W * 0.86, 0.15, 0.15, chromeMat, 0, H * 1.08, D * 0.22);
            box("jug_cage_rl", 0.15, H * 0.55, 0.15, chromeMat, -W * 0.42, H * 0.68, -D * 0.08);
            box("jug_cage_rr", 0.15, H * 0.55, 0.15, chromeMat, W * 0.42, H * 0.68, -D * 0.08);
            box("jug_cage_diag_l", 0.15, H * 0.6, 0.15, chromeMat, -W * 0.42, H * 0.72, D * 0.07, Math.PI * 0.25, 0, 0);
            box("jug_cage_diag_r", 0.15, H * 0.6, 0.15, chromeMat, W * 0.42, H * 0.72, D * 0.07, Math.PI * 0.25, 0, 0);

            // Roof Mounted Spotlights
            for (let l = -2; l <= 2; l++) {
                box(`jug_spot${l}`, 0.2, 0.2, 0.25, armorMat, l * 0.4, H * 1.15, D * 0.22);
                cyl(`jug_spotl${l}`, 0.18, 0.05, 8, headMat, l * 0.4, H * 1.15, D * 0.22 + 0.13, Math.PI / 2, 0);
            }

            // Giant Exhaust Stacks with heat rings and flappers
            cyl("jug_ex_l", 0.25, H * 0.8, 12, armorMat, -W * 0.35, H * 0.8, -D * 0.35);
            cyl("jug_ex_r", 0.25, H * 0.8, 12, armorMat, W * 0.35, H * 0.8, -D * 0.35);
            cyl("jug_exr_l", 0.3, 0.1, 12, chromeMat, -W * 0.35, H * 1.15, -D * 0.35);
            cyl("jug_exr_r", 0.3, 0.1, 12, chromeMat, W * 0.35, H * 1.15, -D * 0.35);
            box("jug_flap_l", 0.2, 0.02, 0.2, chromeMat, -W * 0.35, H * 1.25, -D * 0.35, Math.PI * 0.25, 0, 0);
            box("jug_flap_r", 0.2, 0.02, 0.2, chromeMat, W * 0.35, H * 1.25, -D * 0.35, Math.PI * 0.25, 0, 0);

            // Side fuel canisters & pipes
            cyl("jug_fuel_l", 0.25, D * 0.3, 12, armorMat, -W * 0.55, -H * 0.15, D * 0.05, 0, Math.PI / 2);
            cyl("jug_fuel_r", 0.25, D * 0.3, 12, armorMat, W * 0.55, -H * 0.15, D * 0.05, 0, Math.PI / 2);
            cyl("jug_pipe_l", 0.08, D * 0.4, 8, chromeMat, -W * 0.55, -H * 0.05, -D * 0.15, 0, Math.PI / 2);
            cyl("jug_pipe_r", 0.08, D * 0.4, 8, chromeMat, W * 0.55, -H * 0.05, -D * 0.15, 0, Math.PI / 2);

        } else if (vehicleId === "interceptor") {
            // ═══ INTERCEPTOR — Aggressive Street Fighter ════════
            box("int_frame", W, H * 0.30, D, armorMat, 0, -H * 0.35, 0);
            box("int_lowbody", W * 0.88, H * 0.48, D * 0.55, bodyMat, 0, H * 0.02, D * 0.22);
            box("int_highbody", W * 0.82, H * 0.55, D * 0.48, bodyMat, 0, H * 0.12, -D * 0.25);
            box("int_hood", W * 0.82, H * 0.14, D * 0.44, bodyMat, 0, -H * 0.17, D * 0.34, Math.PI * 0.06, 0, 0);
            box("int_canopy", W * 0.66, H * 0.38, D * 0.38, glassMat2, 0, H * 0.52, -D * 0.04, -Math.PI * 0.03, 0, 0);
            
            // Exposed Supercharger / Blower on hood
            box("int_blower_base", W * 0.25, H * 0.15, D * 0.15, chromeMat, 0, -H * 0.05, D * 0.3);
            cyl("int_blower_pulley1", 0.1, 0.05, 12, armorMat, 0, -H * 0.05, D * 0.38, Math.PI / 2, 0);
            cyl("int_blower_pulley2", 0.08, 0.05, 12, armorMat, 0, H * 0.02, D * 0.38, Math.PI / 2, 0);
            box("int_blower_belt", 0.02, H * 0.1, 0.05, armorMat, 0, -H * 0.02, D * 0.39);
            box("int_blower_intake", W * 0.3, H * 0.08, D * 0.12, bodyMat, 0, H * 0.05, D * 0.28, Math.PI * 0.1, 0, 0);
            // Intake butterflies
            box("int_bf_l", W * 0.08, 0.02, D * 0.08, chromeMat, -W * 0.08, H * 0.09, D * 0.29, Math.PI * 0.2, 0, 0);
            box("int_bf_r", W * 0.08, 0.02, D * 0.08, chromeMat, W * 0.08, H * 0.09, D * 0.29, Math.PI * 0.2, 0, 0);

            // A-pillar struts and roof scoops
            box("int_apil_l", 0.06, H * 0.42, 0.06, armorMat, -W * 0.30, H * 0.38, D * 0.10, Math.PI * 0.06, 0, 0);
            box("int_apil_r", 0.06, H * 0.42, 0.06, armorMat, W * 0.30, H * 0.38, D * 0.10, Math.PI * 0.06, 0, 0);
            box("int_roof_scoop", W * 0.2, H * 0.08, D * 0.2, bodyMat, 0, H * 0.72, -D * 0.1, -Math.PI * 0.05, 0, 0);
            box("int_roof_scoop_in", W * 0.16, H * 0.06, 0.05, armorMat, 0, H * 0.73, -D * 0.01, -Math.PI * 0.05, 0, 0);

            // Aggressive Aero Spliter & Canards
            box("int_splitter", W * 0.9, 0.06, D * 0.12, armorMat, 0, -H * 0.48, D * 0.54);
            box("int_canard_l", W * 0.15, 0.02, D * 0.08, chromeMat, -W * 0.45, -H * 0.3, D * 0.5, 0, 0, Math.PI * 0.1);
            box("int_canard_r", W * 0.15, 0.02, D * 0.08, chromeMat, W * 0.45, -H * 0.3, D * 0.5, 0, 0, -Math.PI * 0.1);

            // Massive GT Rear Wing
            box("int_wing_strut_l", 0.05, H * 0.4, 0.1, armorMat, -W * 0.2, H * 0.5, -D * 0.4);
            box("int_wing_strut_r", 0.05, H * 0.4, 0.1, armorMat, W * 0.2, H * 0.5, -D * 0.4);
            box("int_wing_main", W * 0.9, 0.05, D * 0.25, bodyMat, 0, H * 0.7, -D * 0.45, Math.PI * 0.1, 0, 0);
            box("int_wing_end_l", 0.05, H * 0.25, D * 0.25, bodyMat, -W * 0.45, H * 0.65, -D * 0.45, Math.PI * 0.1, 0, 0);
            box("int_wing_end_r", 0.05, H * 0.25, D * 0.25, bodyMat, W * 0.45, H * 0.65, -D * 0.45, Math.PI * 0.1, 0, 0);

            // Detailed Rear Diffuser
            box("int_diff_base", W * 0.76, 0.08, D * 0.15, armorMat, 0, -H * 0.4, -D * 0.48);
            for (let f = -3; f <= 3; f++) {
                box(`int_dif${f}`, 0.03, H * 0.2, D * 0.15, chromeMat, f * (W * 0.11), -H * 0.4, -D * 0.48, Math.PI * 0.1, 0, 0);
            }

            // Twin exhausts with mufflers
            cyl("int_muff_l", 0.2, D * 0.2, 12, armorMat, -W * 0.25, -H * 0.35, -D * 0.4, Math.PI / 2, 0);
            cyl("int_muff_r", 0.2, D * 0.2, 12, armorMat, W * 0.25, -H * 0.35, -D * 0.4, Math.PI / 2, 0);
            cyl("int_ex_l", 0.12, D * 0.15, 8, chromeMat, -W * 0.25, -H * 0.35, -D * 0.52, Math.PI / 2, 0);
            cyl("int_ex_r", 0.12, D * 0.15, 8, chromeMat, W * 0.25, -H * 0.35, -D * 0.52, Math.PI / 2, 0);
            
            // Headlights + DRL
            box("int_hl", W * 0.20, H * 0.06, 0.05, headMat, -W * 0.27, -H * 0.15, D * 0.54);
            box("int_hr", W * 0.20, H * 0.06, 0.05, headMat, W * 0.27, -H * 0.15, D * 0.54);
            box("int_drl", W * 0.60, H * 0.03, 0.04, accentMat, 0, -H * 0.08, D * 0.55);
            box("int_tl", W * 0.24, H * 0.05, 0.05, tailMat, -W * 0.24, H * 0.08, -D * 0.52);
            box("int_tr", W * 0.24, H * 0.05, 0.05, tailMat, W * 0.24, H * 0.08, -D * 0.52);

        } else if (vehicleId === "phantom") {
            // ═══ PHANTOM — Stealth Racer ════════════════════════
            box("ph_shell", W, H * 0.22, D, bodyMat, 0, -H * 0.20, 0);
            box("ph_body", W * 0.86, H * 0.40, D * 0.65, bodyMat, 0, H * 0.06, -D * 0.04);
            box("ph_nose", W * 0.70, H * 0.10, D * 0.38, bodyMat, 0, -H * 0.28, D * 0.33, Math.PI * 0.05, 0, 0);
            box("ph_canopy", W * 0.60, H * 0.28, D * 0.34, glassMat2, 0, H * 0.36, -D * 0.05, -Math.PI * 0.02, 0, 0);
            
            // Angular stealth winglets & Camera Pods
            box("ph_winglet_l", W * 0.15, 0.02, D * 0.15, armorMat, -W * 0.55, -H * 0.2, D * 0.3, 0, Math.PI * 0.1, Math.PI * 0.05);
            box("ph_winglet_r", W * 0.15, 0.02, D * 0.15, armorMat, W * 0.55, -H * 0.2, D * 0.3, 0, -Math.PI * 0.1, -Math.PI * 0.05);
            box("ph_cam_l", 0.08, 0.08, 0.15, bodyMat, -W * 0.4, H * 0.3, D * 0.1, 0, Math.PI * 0.1, 0);
            box("ph_cam_r", 0.08, 0.08, 0.15, bodyMat, W * 0.4, H * 0.3, D * 0.1, 0, -Math.PI * 0.1, 0);
            box("ph_cam_lens_l", 0.04, 0.04, 0.02, headMat, -W * 0.4, H * 0.3, D * 0.18);
            box("ph_cam_lens_r", 0.04, 0.04, 0.02, headMat, W * 0.4, H * 0.3, D * 0.18);

            // Segmented stealth spine armor
            for (let s = 0; s < 5; s++) {
                box(`ph_spine${s}`, W * 0.2, 0.05, D * 0.1, armorMat, 0, H * 0.48 - (s * 0.02), -D * 0.15 - (s * D * 0.08), Math.PI * 0.05, 0, 0);
            }

            // Side vent louvers
            for (let v = 0; v < 4; v++) {
                const vz = D * 0.1 - (v * 0.12);
                box(`ph_vl${v}`, 0.08, H * 0.12, 0.02, chromeMat, -W * 0.45, -H * 0.05, vz, 0, Math.PI * 0.2, 0);
                box(`ph_vr${v}`, 0.08, H * 0.12, 0.02, chromeMat, W * 0.45, -H * 0.05, vz, 0, -Math.PI * 0.2, 0);
            }

            // Center Jet Engine Thruster
            cyl("ph_jet_out", W * 0.35, D * 0.2, 16, armorMat, 0, -H * 0.1, -D * 0.5, Math.PI / 2, 0);
            cyl("ph_jet_in", W * 0.25, D * 0.22, 16, chromeMat, 0, -H * 0.1, -D * 0.5, Math.PI / 2, 0);
            const jetGlow = MeshBuilder.CreateCylinder("ph_jet_glow", { diameter: W * 0.2, height: 0.05 }, scene);
            jetGlow.rotation.x = Math.PI / 2; jetGlow.position.set(0, -H * 0.1, -D * 0.6);
            jetGlow.material = headMat; jetGlow.parent = chassisRoot;

            box("ph_diff", W * 0.80, H * 0.08, D * 0.12, armorMat, 0, -H * 0.34, -D * 0.46);
            box("ph_fin", 0.05, H * 0.22, D * 0.28, armorMat, 0, H * 0.44, -D * 0.38);
            
            box("ph_hl", W * 0.18, H * 0.04, 0.04, headMat, -W * 0.25, -H * 0.25, D * 0.52);
            box("ph_hr", W * 0.18, H * 0.04, 0.04, headMat, W * 0.25, -H * 0.25, D * 0.52);
            box("ph_tl", W * 0.30, H * 0.03, 0.04, tailMat, -W * 0.22, -H * 0.12, -D * 0.52);
            box("ph_tr", W * 0.30, H * 0.03, 0.04, tailMat, W * 0.22, -H * 0.12, -D * 0.52);
            box("ph_accent", W * 0.78, 0.04, D * 0.90, accentMat, 0, -H * 0.32, 0);

        } else if (vehicleId === "manticore") {
            // ═══ MANTICORE — Heavy Armored Truck ════════════════
            box("mt_frame", W, H * 0.40, D, armorMat, 0, -H * 0.30, 0);
            box("mt_cab", W * 0.80, H * 0.70, D * 0.42, bodyMat, 0, H * 0.25, D * 0.18);
            box("mt_cab_glass", W * 0.68, H * 0.42, D * 0.10, glassMat2, 0, H * 0.52, D * 0.38);
            box("mt_bed", W * 0.82, H * 0.20, D * 0.50, armorMat, 0, H * 0.05, -D * 0.28);
            box("mt_bedwall", W * 0.82, H * 0.34, 0.10, armorMat, 0, H * 0.20, -D * 0.53);
            
            // Layered Tank Armor on front
            for (let a = 0; a < 3; a++) {
                box(`mt_armor_f${a}`, W * 0.85, H * 0.15, 0.05, armorMat, 0, H * 0.1 - (a * 0.2), D * 0.4 + (a * 0.02), Math.PI * 0.1, 0, 0);
            }
            
            // Window Shutters
            box("mt_shut_l", W * 0.15, H * 0.4, 0.02, armorMat, -W * 0.2, H * 0.52, D * 0.44);
            box("mt_shut_r", W * 0.15, H * 0.4, 0.02, armorMat, W * 0.2, H * 0.52, D * 0.44);
            box("mt_shut_c", W * 0.05, H * 0.4, 0.02, armorMat, 0, H * 0.52, D * 0.44);

            // Radar Dish in bed
            cyl("mt_radar_base", 0.2, 0.4, 12, armorMat, -W * 0.25, H * 0.2, -D * 0.4);
            const dish = MeshBuilder.CreateCylinder("mt_radar_dish", { diameter: 1.2, height: 0.1, tessellation: 16 }, scene);
            dish.rotation.x = Math.PI * 0.3; dish.position.set(-W * 0.25, H * 0.5, -D * 0.4);
            dish.material = chromeMat; dish.parent = chassisRoot;
            cyl("mt_radar_pin", 0.05, 0.4, 8, headMat, -W * 0.25, H * 0.5, -D * 0.4 - 0.2, Math.PI * 0.3, 0);

            // Spiky Hubcap Guards (Side bumpers)
            box("mt_guard_l", 0.15, H * 0.2, D * 0.8, armorMat, -W * 0.55, -H * 0.2, 0);
            box("mt_guard_r", 0.15, H * 0.2, D * 0.8, armorMat, W * 0.55, -H * 0.2, 0);
            for(let s = -2; s <= 2; s++) {
                box(`mt_spike_l${s}`, 0.2, 0.1, 0.1, chromeMat, -W * 0.6, -H * 0.2, s * (D * 0.15));
                box(`mt_spike_r${s}`, 0.2, 0.1, 0.1, chromeMat, W * 0.6, -H * 0.2, s * (D * 0.15));
            }

            box("mt_bbar_h", W * 0.90, 0.20, 0.20, chromeMat, 0, -H * 0.08, D * 0.53);
            box("mt_bbar_vl", 0.18, H * 0.55, 0.18, chromeMat, -W * 0.35, H * 0.20, D * 0.53);
            box("mt_bbar_vr", 0.18, H * 0.55, 0.18, chromeMat, W * 0.35, H * 0.20, D * 0.53);
            box("mt_bbar_xl", 0.16, 0.16, D * 0.15, chromeMat, -W * 0.35, H * 0.42, D * 0.46, 0, 0, -Math.PI * 0.2);
            box("mt_bbar_xr", 0.16, 0.16, D * 0.15, chromeMat, W * 0.35, H * 0.42, D * 0.46, 0, 0, Math.PI * 0.2);
            cyl("mt_drum_l", 0.32, D * 0.28, 12, armorMat, -W * 0.54, -H * 0.05, D * 0.06, 0, Math.PI / 2);
            cyl("mt_drum_r", 0.32, D * 0.28, 12, armorMat, W * 0.54, -H * 0.05, D * 0.06, 0, Math.PI / 2);
            cyl("mt_ex", 0.20, H * 0.70, 8, chromeMat, -W * 0.32, H * 0.72, D * 0.22, 0, 0);
            box("mt_hl", W * 0.18, H * 0.10, 0.06, headMat, -W * 0.28, H * 0.14, D * 0.52);
            box("mt_hr", W * 0.18, H * 0.10, 0.06, headMat, W * 0.28, H * 0.14, D * 0.52);
            box("mt_tl", W * 0.18, H * 0.08, 0.06, tailMat, -W * 0.28, H * 0.12, -D * 0.52);
            box("mt_tr", W * 0.18, H * 0.08, 0.06, tailMat, W * 0.28, H * 0.12, -D * 0.52);

        } else if (vehicleId === "valkyrie") {
            // ═══ VALKYRIE — Mid-Engine Supercar ═════════════════
            box("vk_frame", W, H * 0.25, D, armorMat, 0, -H * 0.38, 0);
            box("vk_front", W * 0.84, H * 0.28, D * 0.48, bodyMat, 0, -H * 0.08, D * 0.28);
            box("vk_rear", W * 0.80, H * 0.44, D * 0.55, bodyMat, 0, H * 0.05, -D * 0.22);
            box("vk_roof1", W * 0.72, H * 0.40, D * 0.18, glassMat2, 0, H * 0.44, D * 0.08);
            box("vk_roof2", W * 0.68, H * 0.30, D * 0.18, glassMat2, 0, H * 0.38, -D * 0.12, -Math.PI * 0.05, 0, 0);
            box("vk_roof3", W * 0.64, H * 0.18, D * 0.20, bodyMat, 0, H * 0.26, -D * 0.33, -Math.PI * 0.10, 0, 0);
            
            // Engine Bay Louvers (Rear window slats)
            for (let l = 0; l < 6; l++) {
                box(`vk_louver${l}`, W * 0.6, 0.02, 0.1, armorMat, 0, H * 0.32 - (l * 0.03), -D * 0.1 - (l * 0.06), -Math.PI * 0.2, 0, 0);
            }
            
            // Hover-fins / Side Intake aero
            box("vk_aero_l", 0.05, H * 0.1, D * 0.4, chromeMat, -W * 0.48, H * 0.1, -D * 0.1, 0, Math.PI * 0.05, 0);
            box("vk_aero_r", 0.05, H * 0.1, D * 0.4, chromeMat, W * 0.48, H * 0.1, -D * 0.1, 0, -Math.PI * 0.05, 0);
            cyl("vk_fan_l", 0.2, 0.05, 12, armorMat, -W * 0.43, H * 0.05, -D * 0.1, 0, 0);
            cyl("vk_fan_r", 0.2, 0.05, 12, armorMat, W * 0.43, H * 0.05, -D * 0.1, 0, 0);

            // Hyper-detailed rear diffuser
            box("vk_diff_plate", W * 0.85, 0.05, D * 0.2, armorMat, 0, -H * 0.4, -D * 0.45);
            for (let d = -4; d <= 4; d++) {
                box(`vk_dif_f${d}`, 0.02, H * 0.15, D * 0.18, chromeMat, d * (W * 0.09), -H * 0.35, -D * 0.48, Math.PI * 0.1, 0, 0);
            }

            box("vk_scoop_l", 0.10, H * 0.18, D * 0.24, armorMat, -W * 0.46, H * 0.04, -D * 0.08);
            box("vk_scoop_r", 0.10, H * 0.18, D * 0.24, armorMat, W * 0.46, H * 0.04, -D * 0.08);
            box("vk_wing", W * 0.88, 0.06, D * 0.20, armorMat, 0, H * 0.35, -D * 0.44, Math.PI * 0.08, 0, 0);
            box("vk_wnd_l", 0.05, H * 0.22, 0.16, armorMat, -W * 0.38, H * 0.22, -D * 0.44);
            box("vk_wnd_r", 0.05, H * 0.22, 0.16, armorMat, W * 0.38, H * 0.22, -D * 0.44);
            box("vk_hl", W * 0.24, H * 0.05, 0.04, headMat, -W * 0.26, -H * 0.12, D * 0.53);
            box("vk_hr", W * 0.24, H * 0.05, 0.04, headMat, W * 0.26, -H * 0.12, D * 0.53);
            box("vk_tl", W * 0.20, H * 0.04, 0.04, tailMat, -W * 0.24, H * 0.06, -D * 0.53);
            box("vk_tr", W * 0.20, H * 0.04, 0.04, tailMat, W * 0.24, H * 0.06, -D * 0.53);
            box("vk_stripe_l", 0.04, H * 0.04, D * 0.80, accentMat, -W * 0.44, H * 0.02, 0);
            box("vk_stripe_r", 0.04, H * 0.04, D * 0.80, accentMat, W * 0.44, H * 0.02, 0);

        } else if (vehicleId === "wraith") {
            // ═══ WRAITH — Ghostly Speed Demon ═══════════════════
            box("wr_slab", W, H * 0.18, D, bodyMat, 0, -H * 0.10, 0);
            box("wr_hull", W * 0.82, H * 0.38, D * 0.70, bodyMat, 0, H * 0.12, -D * 0.02);
            box("wr_nose", W * 0.60, H * 0.08, D * 0.30, bodyMat, 0, -H * 0.20, D * 0.38, Math.PI * 0.06, 0, 0);
            
            // Razor Nose Cone
            box("wr_razor1", W * 0.2, 0.02, D * 0.15, chromeMat, 0, -H * 0.2, D * 0.5, Math.PI * 0.1, 0, 0);
            box("wr_razor2", W * 0.1, 0.02, D * 0.15, chromeMat, 0, -H * 0.18, D * 0.55, Math.PI * 0.15, 0, 0);

            box("wr_canopy", W * 0.54, H * 0.26, D * 0.26, glassMat2, 0, H * 0.34, -D * 0.04, -Math.PI * 0.02, 0, 0);
            box("wr_fin_vert", 0.05, H * 0.40, D * 0.32, bodyMat, 0, H * 0.38, -D * 0.42);
            box("wr_fin_horiz", W * 0.30, 0.05, D * 0.18, bodyMat, 0, H * 0.56, -D * 0.42, 0, 0, Math.PI * 0.05);
            
            // Floating Magnetic Stabilizer Wings (slightly detached)
            box("wr_mag_l", W * 0.12, 0.04, D * 0.5, bodyMat, -W * 0.65, H * 0.1, -D * 0.2);
            box("wr_mag_r", W * 0.12, 0.04, D * 0.5, bodyMat, W * 0.65, H * 0.1, -D * 0.2);
            box("wr_mag_coil_l", W * 0.05, 0.06, D * 0.4, accentMat, -W * 0.55, H * 0.1, -D * 0.2);
            box("wr_mag_coil_r", W * 0.05, 0.06, D * 0.4, accentMat, W * 0.55, H * 0.1, -D * 0.2);

            // Exposed Energy Coils
            for (let c = 0; c < 4; c++) {
                cyl(`wr_coil${c}`, 0.15, W * 0.7, 12, headMat, 0, H * 0.1, D * 0.2 - (c * 0.15), 0, 0);
            }

            box("wr_skirt_l", 0.10, H * 0.12, D * 0.82, armorMat, -W * 0.48, -H * 0.18, 0);
            box("wr_skirt_r", 0.10, H * 0.12, D * 0.82, armorMat, W * 0.48, -H * 0.18, 0);
            box("wr_glow", W * 0.70, 0.04, D * 0.88, accentMat, 0, -H * 0.28, 0);
            box("wr_hl", W * 0.32, H * 0.03, 0.04, headMat, 0, -H * 0.18, D * 0.52);
            box("wr_tl", W * 0.26, H * 0.02, 0.04, tailMat, 0, -H * 0.05, -D * 0.52);

        } else if (vehicleId === "behemoth") {
            // ═══ BEHEMOTH — Rolling Fortress ════════════════════
            box("bh_frame", W, H * 0.38, D, armorMat, 0, -H * 0.32, 0);
            box("bh_cab", W * 0.76, H * 0.75, D * 0.44, bodyMat, 0, H * 0.28, D * 0.22);
            box("bh_cab_glass", W * 0.62, H * 0.40, D * 0.08, glassMat2, 0, H * 0.58, D * 0.44);
            
            // Dual Bulldozer Blades
            box("bh_blade_l", W * 0.45, H * 0.5, 0.15, chromeMat, -W * 0.25, -H * 0.1, D * 0.55, Math.PI * 0.15, -Math.PI * 0.1, 0);
            box("bh_blade_r", W * 0.45, H * 0.5, 0.15, chromeMat, W * 0.25, -H * 0.1, D * 0.55, Math.PI * 0.15, Math.PI * 0.1, 0);
            // Blade pistons
            cyl("bh_piston_l", 0.12, 0.4, 8, armorMat, -W * 0.25, 0, D * 0.45, Math.PI / 2, 0);
            cyl("bh_piston_r", 0.12, 0.4, 8, armorMat, W * 0.25, 0, D * 0.45, Math.PI / 2, 0);

            // Layered Side Armor Panels with gaps
            for (let a = 0; a < 3; a++) {
                box(`bh_side_l${a}`, 0.15, H * 0.3, D * 0.2, armorMat, -W * 0.42, 0, D * 0.2 - (a * D * 0.22));
                box(`bh_side_r${a}`, 0.15, H * 0.3, D * 0.2, armorMat, W * 0.42, 0, D * 0.2 - (a * D * 0.22));
                // Massive rivets
                box(`bh_rivet_l${a}`, 0.2, 0.05, 0.05, chromeMat, -W * 0.45, 0, D * 0.2 - (a * D * 0.22));
                box(`bh_rivet_r${a}`, 0.2, 0.05, 0.05, chromeMat, W * 0.45, 0, D * 0.2 - (a * D * 0.22));
            }

            // Chain Links around the frame
            for (let c = 0; c < 5; c++) {
                box(`bh_chain_l${c}`, 0.08, 0.2, 0.08, chromeMat, -W * 0.48, H * 0.2, D * 0.3 - (c * 0.15), 0, c % 2 === 0 ? 0 : Math.PI / 2, 0);
                box(`bh_chain_r${c}`, 0.08, 0.2, 0.08, chromeMat, W * 0.48, H * 0.2, D * 0.3 - (c * 0.15), 0, c % 2 === 0 ? 0 : Math.PI / 2, 0);
            }

            box("bh_engine", W * 0.60, H * 0.48, D * 0.30, armorMat, 0, H * 0.24, D * 0.44);
            cyl("bh_supercharger", 0.30, H * 0.32, 8, chromeMat, 0, H * 0.60, D * 0.46, 0, 0);
            box("bh_platform", W * 0.80, H * 0.12, D * 0.44, armorMat, 0, H * 0.04, -D * 0.28);
            box("bh_wall_l", 0.14, H * 0.26, D * 0.44, armorMat, -W * 0.38, H * 0.22, -D * 0.28);
            box("bh_wall_r", 0.14, H * 0.26, D * 0.44, armorMat, W * 0.38, H * 0.22, -D * 0.28);
            box("bh_wall_b", W * 0.80, H * 0.26, 0.14, armorMat, 0, H * 0.22, -D * 0.51);
            box("bh_cage_h", W * 0.96, 0.24, 0.24, chromeMat, 0, -H * 0.08, D * 0.54);
            box("bh_cage_vl", 0.18, H * 0.65, 0.18, chromeMat, -W * 0.40, H * 0.24, D * 0.54);
            box("bh_cage_vr", 0.18, H * 0.65, 0.18, chromeMat, W * 0.40, H * 0.24, D * 0.54);
            box("bh_cage_top", W * 0.84, 0.16, 0.16, chromeMat, 0, H * 0.58, D * 0.54);
            cyl("bh_ex_l", 0.22, H * 0.80, 8, chromeMat, -W * 0.26, H * 0.84, D * 0.18, 0, 0);
            cyl("bh_ex_r", 0.22, H * 0.80, 8, chromeMat, W * 0.26, H * 0.84, D * 0.18, 0, 0);
            box("bh_hl", W * 0.20, H * 0.12, 0.06, headMat, -W * 0.26, H * 0.22, D * 0.53);
            box("bh_hr", W * 0.20, H * 0.12, 0.06, headMat, W * 0.26, H * 0.22, D * 0.53);
            box("bh_tl", W * 0.20, H * 0.08, 0.06, tailMat, -W * 0.26, H * 0.12, -D * 0.53);
            box("bh_tr", W * 0.20, H * 0.08, 0.06, tailMat, W * 0.26, H * 0.12, -D * 0.53);

        }
        
        // --- Build Dynamic Turret ---
        let weaponMountPos = new Vector3(0, chassisSize.height * 0.8, 0); // Default mount

        if (vehicleId === "phantom") {
            weaponMountPos = new Vector3(0, chassisSize.height * 0.4, chassisSize.depth * 0.1);
        } else if (vehicleId === "manticore") {
            weaponMountPos = new Vector3(0, chassisSize.height * 0.4, 0);
        } else if (vehicleId === "valkyrie") {
            weaponMountPos = new Vector3(0, chassisSize.height * 0.4, 0);
        } else if (vehicleId === "interceptor") {
            weaponMountPos = new Vector3(0, chassisSize.height * 0.25, chassisSize.depth * 0.1);
        } else if (vehicleId === "juggernaut") {
            weaponMountPos = new Vector3(0, chassisSize.height * 0.85, chassisSize.depth * 0.2);
        } else if (vehicleId === "wraith") {
            weaponMountPos = new Vector3(0, chassisSize.height * 0.8, -chassisSize.depth * 0.2);
        } else if (vehicleId === "behemoth") {
            weaponMountPos = new Vector3(0, chassisSize.height * 0.6, 0);
        }

        const turretBase = MeshBuilder.CreateBox("turret_base", { size: 0.1 }, scene);
        turretBase.isVisible = false;
        turretBase.position = weaponMountPos;
        turretBase.parent = chassisRoot;

        const turretBox = MeshBuilder.CreateBox("turretbox", { size: 0.1 }, scene);
        turretBox.isVisible = false;
        turretBox.parent = turretBase;

        const weaponMat = new PBRMaterial("wepMat", scene);
        weaponMat.albedoColor = new Color3(0.15, 0.15, 0.16);
        weaponMat.metallic = 0.8;
        weaponMat.roughness = 0.5;

        const gunMetal = new PBRMaterial("gunMetal", scene);
        gunMetal.albedoColor = new Color3(0.05, 0.05, 0.06);
        gunMetal.metallic = 0.95;
        gunMetal.roughness = 0.2;

        const cautionMat = new PBRMaterial("caution", scene);
        cautionMat.albedoColor = new Color3(0.8, 0.6, 0.1);
        cautionMat.metallic = 0.4;
        cautionMat.roughness = 0.8;

        const glowMat = new StandardMaterial("glowMat", scene);
        glowMat.emissiveColor = new Color3(1, 1, 1);
        glowMat.disableLighting = true;

        if (weaponId === "minigun") {
            // Heavy Vulcan Cannon
            const base = MeshBuilder.CreateCylinder("baseShape", { diameter: 1.2, height: 0.3, tessellation: 12 }, scene);
            base.material = weaponMat; base.parent = turretBase;

            const yoke = MeshBuilder.CreateBox("yoke", { width: 0.8, height: 0.6, depth: 0.5 }, scene);
            yoke.position.set(0, 0.45, 0); yoke.parent = turretBox; yoke.material = weaponMat;

            // Side Ammo Box
            const ammoBox = MeshBuilder.CreateBox("ammoBox", { width: 0.5, height: 0.6, depth: 0.8 }, scene);
            ammoBox.position.set(0.65, 0.45, 0); ammoBox.parent = turretBox; ammoBox.material = cautionMat;

            const motor = MeshBuilder.CreateCylinder("motor", { diameter: 0.5, height: 1.0 }, scene);
            motor.rotation.x = Math.PI / 2; motor.position.set(0, 0.45, 0.4); motor.parent = turretBox; motor.material = weaponMat;

            // 6-Barrel Cluster
            const barrel = new TransformNode("barrel", scene); // Logical emission point
            barrel.parent = turretBox;
            barrel.position.set(0, 0.45, 1.2);

            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const b = MeshBuilder.CreateCylinder("b" + i, { diameter: 0.1, height: 1.6 }, scene);
                b.rotation.x = Math.PI / 2;
                b.position.set(Math.cos(angle) * 0.18, Math.sin(angle) * 0.18, 0.8);
                b.parent = turretBox;
                b.material = gunMetal;
            }
            // Barrel bracket
            const bracket = MeshBuilder.CreateCylinder("bracket", { diameter: 0.45, height: 0.1 }, scene);
            bracket.rotation.x = Math.PI / 2; bracket.position.set(0, 0.45, 1.3); bracket.parent = turretBox; bracket.material = weaponMat;

        } else if (weaponId === "plasma") {
            // Advanced Rail/Plasma Cannon
            const base = MeshBuilder.CreateBox("baseShape", { width: 1.0, height: 0.2, depth: 1.2 }, scene);
            base.material = weaponMat; base.parent = turretBase;

            const frame = MeshBuilder.CreateBox("frame", { width: 0.6, height: 0.7, depth: 1.5 }, scene);
            frame.position.set(0, 0.45, 0.2); frame.parent = turretBox; frame.material = weaponMat;

            // Heat sinks
            for (let i = 0; i < 4; i++) {
                const fin = MeshBuilder.CreateBox("fin" + i, { width: 0.7, height: 0.1, depth: 0.4 }, scene);
                fin.position.set(0, 0.3 + i * 0.15, -0.3); fin.parent = turretBox; fin.material = gunMetal;
            }

            // Pulsating coils
            const coil = MeshBuilder.CreateCylinder("coil", { diameter: 0.4, height: 1.6, tessellation: 12 }, scene);
            coil.rotation.x = Math.PI / 2; coil.position.set(0, 0.45, 0.6); coil.parent = turretBox;
            const gMat = glowMat.clone("gMat");
            gMat.emissiveColor = new Color3(0.1, 0.8, 1); coil.material = gMat;

            // Magnetic rails
            const railL = MeshBuilder.CreateBox("railL", { width: 0.1, height: 0.3, depth: 1.8 }, scene);
            railL.position.set(-0.25, 0.45, 0.8); railL.parent = turretBox; railL.material = gunMetal;
            const railR = MeshBuilder.CreateBox("railR", { width: 0.1, height: 0.3, depth: 1.8 }, scene);
            railR.position.set(0.25, 0.45, 0.8); railR.parent = turretBox; railR.material = gunMetal;

            // Emission point
            const barrel = MeshBuilder.CreateBox("barrel", { width: 0.4, height: 0.4, depth: 0.2 }, scene);
            barrel.position.set(0, 0.45, 1.6); barrel.parent = turretBox; barrel.isVisible = false;

        } else if (weaponId === "missile") {
            // MLRS Pod with target optics
            const base = MeshBuilder.CreateCylinder("baseShape", { diameter: 1.2, height: 0.25 }, scene);
            base.material = weaponMat; base.parent = turretBase;

            const arm = MeshBuilder.CreateBox("arm", { width: 0.4, height: 0.7, depth: 0.6 }, scene);
            arm.position.set(0, 0.4, -0.2); arm.parent = turretBox; arm.material = weaponMat;

            const pod = MeshBuilder.CreateBox("pod", { width: 1.6, height: 0.9, depth: 1.4 }, scene);
            pod.position.set(0, 0.9, 0.2); pod.parent = turretBox; pod.material = gunMetal;

            // Targeting optic
            const optic = MeshBuilder.CreateCylinder("optic", { diameter: 0.2, height: 0.4 }, scene);
            optic.rotation.x = Math.PI / 2; optic.position.set(0.6, 1.4, 0.2); optic.parent = turretBox; optic.material = weaponMat;
            const lens = MeshBuilder.CreateCylinder("lens", { diameter: 0.15, height: 0.05 }, scene);
            lens.rotation.x = Math.PI / 2; lens.position.set(0.6, 1.4, 0.4); lens.parent = turretBox;
            const lensMat = glowMat.clone("lensMat"); lensMat.emissiveColor = new Color3(1, 0, 0); lens.material = lensMat;

            const barrel = MeshBuilder.CreateBox("barrel", { size: 0.1 }, scene);
            barrel.isVisible = false;
            barrel.parent = turretBox; barrel.position.set(0, 0.9, 0.8);

            // Detailed missile tubes
            const face = MeshBuilder.CreateBox("face", { width: 1.65, height: 0.95, depth: 0.05 }, scene);
            face.position.set(0, 0, 0.7); face.parent = pod; face.material = weaponMat;

            for (let x of [-0.5, 0, 0.5]) {
                for (let y of [-0.25, 0.25]) {
                    const hole = MeshBuilder.CreateCylinder("hole", { diameter: 0.35, height: 0.1 }, scene);
                    hole.rotation.x = Math.PI / 2; hole.position.set(x, y, 0.05); hole.parent = face;
                    const hMat = new StandardMaterial("hMat", scene);
                    hMat.diffuseColor = new Color3(0, 0, 0); hole.material = hMat;
                }
            }
        } else if (weaponId === "mortar") {
            // Heavy Siege Mortar
            const base = MeshBuilder.CreateCylinder("baseShape", { diameter: 1.6, height: 0.4, tessellation: 16 }, scene);
            base.material = weaponMat; base.parent = turretBase;

            const standL = MeshBuilder.CreateBox("standL", { width: 0.3, height: 1.2, depth: 0.8 }, scene);
            standL.position.set(-0.6, 0.6, -0.2); standL.parent = turretBox; standL.material = weaponMat;
            const standR = MeshBuilder.CreateBox("standR", { width: 0.3, height: 1.2, depth: 0.8 }, scene);
            standR.position.set(0.6, 0.6, -0.2); standR.parent = turretBox; standR.material = weaponMat;

            // Recoil cylinders
            for (let sign of [-1, 1]) {
                const recoil = MeshBuilder.CreateCylinder("recoil" + sign, { diameter: 0.25, height: 0.8 }, scene);
                recoil.position.set(0.45 * sign, 1.0, 0); recoil.parent = turretBox; recoil.material = gunMetal;
            }

            // Massive Barrel
            const barrel = MeshBuilder.CreateCylinder("barrel", { diameter: 0.8, height: 2.2, tessellation: 16 }, scene);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(0, 1.0, 0.6); barrel.parent = turretBox; barrel.material = gunMetal;

            const ring1 = MeshBuilder.CreateCylinder("ring1", { diameter: 0.9, height: 0.2 }, scene);
            ring1.rotation.x = Math.PI / 2; ring1.position.set(0, 1.0, 1.2); ring1.parent = turretBox; ring1.material = weaponMat;
            const ring2 = MeshBuilder.CreateCylinder("ring2", { diameter: 0.95, height: 0.4 }, scene);
            ring2.rotation.x = Math.PI / 2; ring2.position.set(0, 1.0, 1.6); ring2.parent = turretBox; ring2.material = weaponMat;

        } else if (weaponId === "nuke") {
            // Thermonuclear Silo
            const base = MeshBuilder.CreateCylinder("baseShape", { diameter: 2.2, height: 0.5, tessellation: 20 }, scene);
            base.material = weaponMat; base.parent = turretBase;

            // Armored blast shields
            const shieldL = MeshBuilder.CreateBox("shieldL", { width: 0.4, height: 1.5, depth: 1.8 }, scene);
            shieldL.position.set(-1.0, 0.75, 0); shieldL.parent = turretBox; shieldL.material = weaponMat;
            const shieldR = MeshBuilder.CreateBox("shieldR", { width: 0.4, height: 1.5, depth: 1.8 }, scene);
            shieldR.position.set(1.0, 0.75, 0); shieldR.parent = turretBox; shieldR.material = weaponMat;

            // Hydraulic lifts
            const lift = MeshBuilder.CreateCylinder("lift", { diameter: 0.3, height: 1.8 }, scene);
            lift.rotation.x = Math.PI / 4; lift.position.set(0, 0.8, -0.6); lift.parent = turretBox; lift.material = gunMetal;

            // Massive Nuke Silo Tube
            const nukeBody = MeshBuilder.CreateCylinder("barrel", { diameter: 1.4, height: 3.5, tessellation: 16 }, scene);
            nukeBody.rotation.x = Math.PI 