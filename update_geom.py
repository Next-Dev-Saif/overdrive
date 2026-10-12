import re

with open("src/game/entities/VehicleFactory.ts", "r") as f:
    content = f.read()

juggernaut_new = """        if (vehicleId === "juggernaut") {
            // ═══ JUGGERNAUT — Armored War Rig ═══════════════════
            box("jug_baseframe", W, H * 0.35, D, armorMat, 0, -H * 0.33, 0);
            box("jug_body", W * 0.88, H * 0.65, D * 0.72, bodyMat, 0, H * 0.15, -D * 0.04);
            box("jug_cab", W * 0.82, H * 0.55, D * 0.30, bodyMat, 0, H * 0.62, D * 0.12);
            box("jug_cab_glass", W * 0.74, H * 0.38, D * 0.22, glassMat2, 0, H * 0.70, D * 0.12);
            
            // Detailed Hood and Grill
            box("jug_hood", W * 0.84, H * 0.18, D * 0.44, armorMat, 0, H * 0.06, D * 0.36);
            box("jug_hood_bulge", W * 0.4, H * 0.08, D * 0.3, bodyMat, 0, H * 0.18, D * 0.35, Math.PI * 0.05, 0, 0);
            box("jug_grill", W * 0.7, H * 0.35, 0.05, armorMat, 0, -H * 0.05, D * 0.58);
            for(let i=-2; i<=2; i++) {
                box(`jug_grill_bar${i}`, 0.05, H * 0.35, 0.08, chromeMat, i * 0.25, -H * 0.05, D * 0.59);
            }
            
            // Heavy Side Armor Plates with Gaps
            for (let p = 0; p < 4; p++) {
                const px = D * 0.3 - (p * (D * 0.18));
                box(`jug_plate_l${p}`, 0.15, H * 0.45, D * 0.16, armorMat, -W * 0.52, -H * 0.05, px);
                box(`jug_plate_r${p}`, 0.15, H * 0.45, D * 0.16, armorMat, W * 0.52, -H * 0.05, px);
                box(`jug_rivet_lt${p}`, 0.2, 0.06, 0.06, chromeMat, -W * 0.54, H * 0.1, px);
                box(`jug_rivet_lb${p}`, 0.2, 0.06, 0.06, chromeMat, -W * 0.54, -H * 0.2, px);
                box(`jug_rivet_rt${p}`, 0.2, 0.06, 0.06, chromeMat, W * 0.54, H * 0.1, px);
                box(`jug_rivet_rb${p}`, 0.2, 0.06, 0.06, chromeMat, W * 0.54, -H * 0.2, px);
            }

            // Massive Cow-catcher Push Bar
            box("jug_bar_base", W * 0.95, 0.25, 0.3, chromeMat, 0, -H * 0.2, D * 0.65);
            box("jug_bar_mid", W * 0.85, 0.15, 0.2, chromeMat, 0, H * 0.1, D * 0.62);
            box("jug_bar_top", W * 0.75, 0.15, 0.2, chromeMat, 0, H * 0.35, D * 0.58);
            for (let b = -3; b <= 3; b++) {
                box(`jug_bar_v${b}`, 0.15, H * 0.7, 0.15, chromeMat, b * (W * 0.12), H * 0.05, D * 0.63);
                box(`jug_spike${b}`, 0.06, H * 0.4, 0.06, chromeMat, b * (W * 0.12), H * 0.45, D * 0.6, Math.PI * 0.15, 0, 0);
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
                box(`jug_spot${l}`, 0.25, 0.25, 0.3, armorMat, l * 0.45, H * 1.2, D * 0.22);
                cyl(`jug_spotl${l}`, 0.2, 0.05, 16, headMat, l * 0.45, H * 1.2, D * 0.22 + 0.15, Math.PI / 2, 0);
            }

            // Giant Exhaust Stacks with heat rings and flappers
            cyl("jug_ex_l", 0.3, H * 1.0, 16, armorMat, -W * 0.38, H * 0.9, -D * 0.35);
            cyl("jug_ex_r", 0.3, H * 1.0, 16, armorMat, W * 0.38, H * 0.9, -D * 0.35);
            for(let hr=0; hr<3; hr++) {
                cyl(`jug_exr_l${hr}`, 0.35, 0.05, 16, chromeMat, -W * 0.38, H * 0.9 + hr * 0.15, -D * 0.35);
                cyl(`jug_exr_r${hr}`, 0.35, 0.05, 16, chromeMat, W * 0.38, H * 0.9 + hr * 0.15, -D * 0.35);
            }
            box("jug_flap_l", 0.25, 0.02, 0.25, chromeMat, -W * 0.38, H * 1.45, -D * 0.35, Math.PI * 0.25, 0, 0);
            box("jug_flap_r", 0.25, 0.02, 0.25, chromeMat, W * 0.38, H * 1.45, -D * 0.35, Math.PI * 0.25, 0, 0);

            // Side fuel canisters & pipes
            cyl("jug_fuel_l", 0.3, D * 0.4, 16, armorMat, -W * 0.55, -H * 0.15, D * 0.05, 0, Math.PI / 2);
            cyl("jug_fuel_r", 0.3, D * 0.4, 16, armorMat, W * 0.55, -H * 0.15, D * 0.05, 0, Math.PI / 2);
            cyl("jug_pipe_l", 0.1, D * 0.5, 12, chromeMat, -W * 0.55, -H * 0.05, -D * 0.15, 0, Math.PI / 2);
            cyl("jug_pipe_r", 0.1, D * 0.5, 12, chromeMat, W * 0.55, -H * 0.05, -D * 0.15, 0, Math.PI / 2);"""

interceptor_new = """        } else if (vehicleId === "interceptor") {
            // ═══ INTERCEPTOR — Aggressive Street Fighter ════════
            box("int_frame", W, H * 0.30, D, armorMat, 0, -H * 0.35, 0);
            box("int_lowbody", W * 0.9, H * 0.48, D * 0.55, bodyMat, 0, H * 0.02, D * 0.22);
            box("int_highbody", W * 0.84, H * 0.55, D * 0.48, bodyMat, 0, H * 0.12, -D * 0.25);
            box("int_hood", W * 0.84, H * 0.16, D * 0.46, bodyMat, 0, -H * 0.16, D * 0.34, Math.PI * 0.06, 0, 0);
            box("int_canopy", W * 0.7, H * 0.4, D * 0.4, glassMat2, 0, H * 0.52, -D * 0.04, -Math.PI * 0.03, 0, 0);
            
            // Exposed Supercharger / Blower on hood
            box("int_blower_base", W * 0.3, H * 0.18, D * 0.2, chromeMat, 0, -H * 0.02, D * 0.3);
            cyl("int_blower_pulley1", 0.12, 0.06, 16, armorMat, 0, -H * 0.02, D * 0.4, Math.PI / 2, 0);
            cyl("int_blower_pulley2", 0.1, 0.06, 16, armorMat, 0, H * 0.06, D * 0.4, Math.PI / 2, 0);
            box("int_blower_belt", 0.03, H * 0.12, 0.06, armorMat, 0, 0, D * 0.41);
            box("int_blower_intake", W * 0.35, H * 0.1, D * 0.15, bodyMat, 0, H * 0.1, D * 0.28, Math.PI * 0.1, 0, 0);
            box("int_bf_l", W * 0.1, 0.02, D * 0.1, chromeMat, -W * 0.1, H * 0.15, D * 0.29, Math.PI * 0.2, 0, 0);
            box("int_bf_r", W * 0.1, 0.02, D * 0.1, chromeMat, W * 0.1, H * 0.15, D * 0.29, Math.PI * 0.2, 0, 0);

            // A-pillar struts and roof scoops
            box("int_apil_l", 0.06, H * 0.44, 0.06, armorMat, -W * 0.32, H * 0.38, D * 0.10, Math.PI * 0.06, 0, 0);
            box("int_apil_r", 0.06, H * 0.44, 0.06, armorMat, W * 0.32, H * 0.38, D * 0.10, Math.PI * 0.06, 0, 0);
            box("int_roof_scoop", W * 0.25, H * 0.1, D * 0.25, bodyMat, 0, H * 0.74, -D * 0.1, -Math.PI * 0.05, 0, 0);
            box("int_roof_scoop_in", W * 0.2, H * 0.08, 0.05, armorMat, 0, H * 0.75, -D * 0.01, -Math.PI * 0.05, 0, 0);

            // Aggressive Aero Spliter & Canards
            box("int_splitter", W * 0.95, 0.06, D * 0.15, armorMat, 0, -H * 0.48, D * 0.55);
            box("int_canard_l", W * 0.18, 0.02, D * 0.1, chromeMat, -W * 0.45, -H * 0.25, D * 0.5, 0, 0, Math.PI * 0.1);
            box("int_canard_r", W * 0.18, 0.02, D * 0.1, chromeMat, W * 0.45, -H * 0.25, D * 0.5, 0, 0, -Math.PI * 0.1);
            box("int_canard_l2", W * 0.15, 0.02, D * 0.08, chromeMat, -W * 0.45, -H * 0.35, D * 0.5, 0, 0, Math.PI * 0.1);
            box("int_canard_r2", W * 0.15, 0.02, D * 0.08, chromeMat, W * 0.45, -H * 0.35, D * 0.5, 0, 0, -Math.PI * 0.1);

            // Massive GT Rear Wing
            box("int_wing_strut_l", 0.06, H * 0.45, 0.12, armorMat, -W * 0.25, H * 0.5, -D * 0.4);
            box("int_wing_strut_r", 0.06, H * 0.45, 0.12, armorMat, W * 0.25, H * 0.5, -D * 0.4);
            box("int_wing_main", W * 0.95, 0.05, D * 0.28, bodyMat, 0, H * 0.75, -D * 0.45, Math.PI * 0.1, 0, 0);
            box("int_wing_end_l", 0.05, H * 0.3, D * 0.3, bodyMat, -W * 0.48, H * 0.7, -D * 0.45, Math.PI * 0.1, 0, 0);
            box("int_wing_end_r", 0.05, H * 0.3, D * 0.3, bodyMat, W * 0.48, H * 0.7, -D * 0.45, Math.PI * 0.1, 0, 0);

            // Detailed Rear Diffuser
            box("int_diff_base", W * 0.8, 0.1, D * 0.2, armorMat, 0, -H * 0.4, -D * 0.48);
            for (let f = -4; f <= 4; f++) {
                box(`int_dif${f}`, 0.03, H * 0.25, D * 0.18, chromeMat, f * (W * 0.1), -H * 0.4, -D * 0.48, Math.PI * 0.1, 0, 0);
            }

            // Twin exhausts with mufflers
            cyl("int_muff_l", 0.25, D * 0.25, 16, armorMat, -W * 0.3, -H * 0.3, -D * 0.4, Math.PI / 2, 0);
            cyl("int_muff_r", 0.25, D * 0.25, 16, armorMat, W * 0.3, -H * 0.3, -D * 0.4, Math.PI / 2, 0);
            cyl("int_ex_l", 0.15, D * 0.15, 12, chromeMat, -W * 0.3, -H * 0.3, -D * 0.55, Math.PI / 2, 0);
            cyl("int_ex_r", 0.15, D * 0.15, 12, chromeMat, W * 0.3, -H * 0.3, -D * 0.55, Math.PI / 2, 0);
            
            // Headlights + DRL
            box("int_hl", W * 0.25, H * 0.08, 0.05, headMat, -W * 0.28, -H * 0.15, D * 0.54);
            box("int_hr", W * 0.25, H * 0.08, 0.05, headMat, W * 0.28, -H * 0.15, D * 0.54);
            box("int_drl", W * 0.65, H * 0.04, 0.04, accentMat, 0, -H * 0.08, D * 0.55);
            box("int_tl", W * 0.28, H * 0.06, 0.05, tailMat, -W * 0.25, H * 0.08, -D * 0.52);
            box("int_tr", W * 0.28, H * 0.06, 0.05, tailMat, W * 0.25, H * 0.08, -D * 0.52);"""

phantom_new = """        } else if (vehicleId === "phantom") {
            // ═══ PHANTOM — Stealth Racer ════════════════════════
            box("ph_shell", W * 0.95, H * 0.22, D * 1.05, bodyMat, 0, -H * 0.20, 0);
            box("ph_body", W * 0.88, H * 0.40, D * 0.65, bodyMat, 0, H * 0.06, -D * 0.04);
            box("ph_nose", W * 0.75, H * 0.12, D * 0.4, bodyMat, 0, -H * 0.25, D * 0.35, Math.PI * 0.06, 0, 0);
            box("ph_canopy", W * 0.65, H * 0.3, D * 0.36, glassMat2, 0, H * 0.38, -D * 0.05, -Math.PI * 0.02, 0, 0);
            
            // Angular stealth winglets & Camera Pods
            box("ph_winglet_l", W * 0.2, 0.02, D * 0.2, armorMat, -W * 0.55, -H * 0.2, D * 0.35, 0, Math.PI * 0.15, Math.PI * 0.05);
            box("ph_winglet_r", W * 0.2, 0.02, D * 0.2, armorMat, W * 0.55, -H * 0.2, D * 0.35, 0, -Math.PI * 0.15, -Math.PI * 0.05);
            box("ph_cam_l", 0.1, 0.1, 0.2, bodyMat, -W * 0.45, H * 0.3, D * 0.15, 0, Math.PI * 0.1, 0);
            box("ph_cam_r", 0.1, 0.1, 0.2, bodyMat, W * 0.45, H * 0.3, D * 0.15, 0, -Math.PI * 0.1, 0);
            box("ph_cam_lens_l", 0.05, 0.05, 0.02, headMat, -W * 0.45, H * 0.3, D * 0.25);
            box("ph_cam_lens_r", 0.05, 0.05, 0.02, headMat, W * 0.45, H * 0.3, D * 0.25);

            // Segmented stealth spine armor
            for (let s = 0; s < 6; s++) {
                box(`ph_spine${s}`, W * 0.25, 0.06, D * 0.12, armorMat, 0, H * 0.5 - (s * 0.025), -D * 0.1 - (s * D * 0.07), Math.PI * 0.06, 0, 0);
            }

            // Side vent louvers
            for (let v = 0; v < 5; v++) {
                const vz = D * 0.15 - (v * 0.12);
                box(`ph_vl${v}`, 0.1, H * 0.15, 0.02, chromeMat, -W * 0.48, -H * 0.05, vz, 0, Math.PI * 0.25, 0);
                box(`ph_vr${v}`, 0.1, H * 0.15, 0.02, chromeMat, W * 0.48, -H * 0.05, vz, 0, -Math.PI * 0.25, 0);
            }

            // Center Jet Engine Thruster
            cyl("ph_jet_out", W * 0.4, D * 0.25, 24, armorMat, 0, -H * 0.1, -D * 0.5, Math.PI / 2, 0);
            cyl("ph_jet_in", W * 0.3, D * 0.27, 24, chromeMat, 0, -H * 0.1, -D * 0.5, Math.PI / 2, 0);
            const jetGlow = MeshBuilder.CreateCylinder("ph_jet_glow", { diameter: W * 0.25, height: 0.05, tessellation: 24 }, scene);
            jetGlow.rotation.x = Math.PI / 2; jetGlow.position.set(0, -H * 0.1, -D * 0.63);
            jetGlow.material = headMat; jetGlow.parent = chassisRoot;

            box("ph_diff", W * 0.85, H * 0.1, D * 0.15, armorMat, 0, -H * 0.34, -D * 0.46);
            for(let d = -2; d <= 2; d++) {
                box(`ph_diff_fin${d}`, 0.02, H * 0.15, D * 0.2, chromeMat, d * W * 0.2, -H * 0.34, -D * 0.48, Math.PI * 0.1, 0, 0);
            }
            
            box("ph_fin", 0.05, H * 0.25, D * 0.3, armorMat, 0, H * 0.48, -D * 0.4);
            
            box("ph_hl", W * 0.2, H * 0.05, 0.04, headMat, -W * 0.28, -H * 0.25, D * 0.54);
            box("ph_hr", W * 0.2, H * 0.05, 0.04, headMat, W * 0.28, -H * 0.25, D * 0.54);
            box("ph_tl", W * 0.35, H * 0.04, 0.04, tailMat, -W * 0.25, -H * 0.12, -D * 0.54);
            box("ph_tr", W * 0.35, H * 0.04, 0.04, tailMat, W * 0.25, -H * 0.12, -D * 0.54);
            box("ph_accent", W * 0.85, 0.05, D * 0.95, accentMat, 0, -H * 0.32, 0);"""

manticore_new = """        } else if (vehicleId === "manticore") {
            // ═══ MANTICORE — Heavy Armored Truck ════════════════
            box("mt_frame", W, H * 0.45, D, armorMat, 0, -H * 0.30, 0);
            box("mt_cab", W * 0.85, H * 0.75, D * 0.45, bodyMat, 0, H * 0.25, D * 0.2);
            box("mt_cab_glass", W * 0.75, H * 0.45, D * 0.10, glassMat2, 0, H * 0.55, D * 0.42);
            box("mt_bed", W * 0.85, H * 0.25, D * 0.50, armorMat, 0, H * 0.05, -D * 0.28);
            box("mt_bedwall", W * 0.85, H * 0.38, 0.10, armorMat, 0, H * 0.22, -D * 0.53);
            
            // Layered Tank Armor on front
            for (let a = 0; a < 4; a++) {
                box(`mt_armor_f${a}`, W * 0.9, H * 0.15, 0.05, armorMat, 0, H * 0.15 - (a * 0.18), D * 0.42 + (a * 0.03), Math.PI * 0.12, 0, 0);
            }
            
            // Window Shutters
            box("mt_shut_l", W * 0.2, H * 0.42, 0.02, armorMat, -W * 0.22, H * 0.55, D * 0.48);
            box("mt_shut_r", W * 0.2, H * 0.42, 0.02, armorMat, W * 0.22, H * 0.55, D * 0.48);
            box("mt_shut_c", W * 0.08, H * 0.42, 0.02, armorMat, 0, H * 0.55, D * 0.48);

            // Radar Dish in bed
            cyl("mt_radar_base", 0.25, 0.5, 16, armorMat, -W * 0.28, H * 0.2, -D * 0.4);
            const dish = MeshBuilder.CreateCylinder("mt_radar_dish", { diameter: 1.4, height: 0.15, tessellation: 24 }, scene);
            dish.rotation.x = Math.PI * 0.25; dish.position.set(-W * 0.28, H * 0.55, -D * 0.4);
            dish.material = chromeMat; dish.parent = chassisRoot;
            cyl("mt_radar_pin", 0.08, 0.5, 12, headMat, -W * 0.28, H * 0.55, -D * 0.4 - 0.2, Math.PI * 0.25, 0);

            // Spiky Hubcap Guards (Side bumpers)
            box("mt_guard_l", 0.18, H * 0.25, D * 0.85, armorMat, -W * 0.55, -H * 0.2, 0);
            box("mt_guard_r", 0.18, H * 0.25, D * 0.85, armorMat, W * 0.55, -H * 0.2, 0);
            for(let s = -3; s <= 3; s++) {
                box(`mt_spike_l${s}`, 0.25, 0.15, 0.15, chromeMat, -W * 0.62, -H * 0.2, s * (D * 0.12));
                box(`mt_spike_r${s}`, 0.25, 0.15, 0.15, chromeMat, W * 0.62, -H * 0.2, s * (D * 0.12));
            }

            box("mt_bbar_h", W * 0.95, 0.25, 0.25, chromeMat, 0, -H * 0.08, D * 0.55);
            box("mt_bbar_vl", 0.2, H * 0.6, 0.2, chromeMat, -W * 0.38, H * 0.20, D * 0.55);
            box("mt_bbar_vr", 0.2, H * 0.6, 0.2, chromeMat, W * 0.38, H * 0.20, D * 0.55);
            box("mt_bbar_xl", 0.18, 0.18, D * 0.18, chromeMat, -W * 0.38, H * 0.45, D * 0.48, 0, 0, -Math.PI * 0.2);
            box("mt_bbar_xr", 0.18, 0.18, D * 0.18, chromeMat, W * 0.38, H * 0.45, D * 0.48, 0, 0, Math.PI * 0.2);
            cyl("mt_drum_l", 0.35, D * 0.3, 16, armorMat, -W * 0.56, -H * 0.05, D * 0.06, 0, Math.PI / 2);
            cyl("mt_drum_r", 0.35, D * 0.3, 16, armorMat, W * 0.56, -H * 0.05, D * 0.06, 0, Math.PI / 2);
            cyl("mt_ex", 0.25, H * 0.8, 12, chromeMat, -W * 0.35, H * 0.75, D * 0.22, 0, 0);
            box("mt_hl", W * 0.22, H * 0.12, 0.08, headMat, -W * 0.3, H * 0.16, D * 0.54);
            box("mt_hr", W * 0.22, H * 0.12, 0.08, headMat, W * 0.3, H * 0.16, D * 0.54);
            box("mt_tl", W * 0.22, H * 0.1, 0.08, tailMat, -W * 0.3, H * 0.14, -D * 0.54);
            box("mt_tr", W * 0.22, H * 0.1, 0.08, tailMat, W * 0.3, H * 0.14, -D * 0.54);"""

valkyrie_new = """        } else if (vehicleId === "valkyrie") {
            // ═══ VALKYRIE — Mid-Engine Supercar ═════════════════
            box("vk_frame", W, H * 0.25, D, armorMat, 0, -H * 0.38, 0);
            box("vk_front", W * 0.86, H * 0.3, D * 0.48, bodyMat, 0, -H * 0.08, D * 0.28);
            box("vk_rear", W * 0.82, H * 0.46, D * 0.55, bodyMat, 0, H * 0.05, -D * 0.22);
            box("vk_roof1", W * 0.74, H * 0.42, D * 0.2, glassMat2, 0, H * 0.44, D * 0.08);
            box("vk_roof2", W * 0.7, H * 0.32, D * 0.2, glassMat2, 0, H * 0.38, -D * 0.12, -Math.PI * 0.05, 0, 0);
            box("vk_roof3", W * 0.66, H * 0.2, D * 0.22, bodyMat, 0, H * 0.26, -D * 0.33, -Math.PI * 0.10, 0, 0);
            
            // Engine Bay Louvers (Rear window slats)
            for (let l = 0; l < 8; l++) {
                box(`vk_louver${l}`, W * 0.62, 0.02, 0.12, armorMat, 0, H * 0.34 - (l * 0.035), -D * 0.1 - (l * 0.05), -Math.PI * 0.25, 0, 0);
            }
            
            // Hover-fins / Side Intake aero
            box("vk_aero_l", 0.06, H * 0.12, D * 0.45, chromeMat, -W * 0.48, H * 0.1, -D * 0.1, 0, Math.PI * 0.06, 0);
            box("vk_aero_r", 0.06, H * 0.12, D * 0.45, chromeMat, W * 0.48, H * 0.1, -D * 0.1, 0, -Math.PI * 0.06, 0);
            cyl("vk_fan_l", 0.25, 0.06, 16, armorMat, -W * 0.43, H * 0.05, -D * 0.1, 0, 0);
            cyl("vk_fan_r", 0.25, 0.06, 16, armorMat, W * 0.43, H * 0.05, -D * 0.1, 0, 0);

            // Hyper-detailed rear diffuser
            box("vk_diff_plate", W * 0.88, 0.06, D * 0.25, armorMat, 0, -H * 0.42, -D * 0.45);
            for (let d = -5; d <= 5; d++) {
                box(`vk_dif_f${d}`, 0.02, H * 0.18, D * 0.2, chromeMat, d * (W * 0.08), -H * 0.36, -D * 0.48, Math.PI * 0.12, 0, 0);
            }

            box("vk_scoop_l", 0.12, H * 0.2, D * 0.26, armorMat, -W * 0.46, H * 0.04, -D * 0.08);
            box("vk_scoop_r", 0.12, H * 0.2, D * 0.26, armorMat, W * 0.46, H * 0.04, -D * 0.08);
            box("vk_wing", W * 0.92, 0.06, D * 0.24, armorMat, 0, H * 0.4, -D * 0.46, Math.PI * 0.1, 0, 0);
            box("vk_wnd_l", 0.06, H * 0.26, 0.18, armorMat, -W * 0.42, H * 0.24, -D * 0.46);
            box("vk_wnd_r", 0.06, H * 0.26, 0.18, armorMat, W * 0.42, H * 0.24, -D * 0.46);
            box("vk_hl", W * 0.26, H * 0.06, 0.05, headMat, -W * 0.26, -H * 0.12, D * 0.54);
            box("vk_hr", W * 0.26, H * 0.06, 0.05, headMat, W * 0.26, -H * 0.12, D * 0.54);
            box("vk_tl", W * 0.22, H * 0.05, 0.05, tailMat, -W * 0.24, H * 0.06, -D * 0.54);
            box("vk_tr", W * 0.22, H * 0.05, 0.05, tailMat, W * 0.24, H * 0.06, -D * 0.54);
            box("vk_stripe_l", 0.05, H * 0.05, D * 0.85, accentMat, -W * 0.44, H * 0.02, 0);
            box("vk_stripe_r", 0.05, H * 0.05, D * 0.85, accentMat, W * 0.44, H * 0.02, 0);"""

wraith_new = """        } else if (vehicleId === "wraith") {
            // ═══ WRAITH — Ghostly Speed Demon ═══════════════════
            box("wr_slab", W, H * 0.18, D, bodyMat, 0, -H * 0.10, 0);
            box("wr_hull", W * 0.84, H * 0.4, D * 0.72, bodyMat, 0, H * 0.12, -D * 0.02);
            box("wr_nose", W * 0.62, H * 0.1, D * 0.32, bodyMat, 0, -H * 0.20, D * 0.38, Math.PI * 0.08, 0, 0);
            
            // Razor Nose Cone
            box("wr_razor1", W * 0.25, 0.02, D * 0.2, chromeMat, 0, -H * 0.22, D * 0.52, Math.PI * 0.1, 0, 0);
            box("wr_razor2", W * 0.15, 0.02, D * 0.2, chromeMat, 0, -H * 0.18, D * 0.58, Math.PI * 0.15, 0, 0);

            box("wr_canopy", W * 0.56, H * 0.28, D * 0.28, glassMat2, 0, H * 0.36, -D * 0.04, -Math.PI * 0.02, 0, 0);
            box("wr_fin_vert", 0.06, H * 0.45, D * 0.35, bodyMat, 0, H * 0.42, -D * 0.44);
            box("wr_fin_horiz", W * 0.35, 0.06, D * 0.2, bodyMat, 0, H * 0.6, -D * 0.44, 0, 0, Math.PI * 0.05);
            
            // Floating Magnetic Stabilizer Wings (slightly detached)
            box("wr_mag_l", W * 0.15, 0.05, D * 0.55, bodyMat, -W * 0.68, H * 0.1, -D * 0.2);
            box("wr_mag_r", W * 0.15, 0.05, D * 0.55, bodyMat, W * 0.68, H * 0.1, -D * 0.2);
            box("wr_mag_coil_l", W * 0.06, 0.08, D * 0.45, accentMat, -W * 0.58, H * 0.1, -D * 0.2);
            box("wr_mag_coil_r", W * 0.06, 0.08, D * 0.45, accentMat, W * 0.58, H * 0.1, -D * 0.2);

            // Exposed Energy Coils
            for (let c = 0; c < 5; c++) {
                cyl(`wr_coil${c}`, 0.18, W * 0.75, 16, headMat, 0, H * 0.12, D * 0.25 - (c * 0.16), 0, 0);
            }

            box("wr_skirt_l", 0.12, H * 0.14, D * 0.85, armorMat, -W * 0.48, -H * 0.18, 0);
            box("wr_skirt_r", 0.12, H * 0.14, D * 0.85, armorMat, W * 0.48, -H * 0.18, 0);
            box("wr_glow", W * 0.72, 0.05, D * 0.9, accentMat, 0, -H * 0.28, 0);
            box("wr_hl", W * 0.35, H * 0.04, 0.05, headMat, 0, -H * 0.18, D * 0.54);
            box("wr_tl", W * 0.3, H * 0.03, 0.05, tailMat, 0, -H * 0.05, -D * 0.54);"""

behemoth_new = """        } else if (vehicleId === "behemoth") {
            // ═══ BEHEMOTH — Rolling Fortress ════════════════════
            box("bh_frame", W, H * 0.4, D, armorMat, 0, -H * 0.32, 0);
            box("bh_cab", W * 0.8, H * 0.78, D * 0.46, bodyMat, 0, H * 0.28, D * 0.22);
            box("bh_cab_glass", W * 0.65, H * 0.42, D * 0.1, glassMat2, 0, H * 0.58, D * 0.44);
            
            // Dual Bulldozer Blades
            box("bh_blade_l", W * 0.48, H * 0.55, 0.2, chromeMat, -W * 0.26, -H * 0.1, D * 0.56, Math.PI * 0.18, -Math.PI * 0.12, 0);
            box("bh_blade_r", W * 0.48, H * 0.55, 0.2, chromeMat, W * 0.26, -H * 0.1, D * 0.56, Math.PI * 0.18, Math.PI * 0.12, 0);
            box("bh_blade_spike_l", 0.1, H * 0.2, 0.1, chromeMat, -W * 0.3, -H * 0.2, D * 0.65, Math.PI * 0.3, -Math.PI * 0.1, 0);
            box("bh_blade_spike_r", 0.1, H * 0.2, 0.1, chromeMat, W * 0.3, -H * 0.2, D * 0.65, Math.PI * 0.3, Math.PI * 0.1, 0);

            // Blade pistons
            cyl("bh_piston_l", 0.15, 0.5, 12, armorMat, -W * 0.28, 0, D * 0.45, Math.PI / 2, 0);
            cyl("bh_piston_r", 0.15, 0.5, 12, armorMat, W * 0.28, 0, D * 0.45, Math.PI / 2, 0);

            // Layered Side Armor Panels with gaps
            for (let a = 0; a < 4; a++) {
                box(`bh_side_l${a}`, 0.18, H * 0.35, D * 0.22, armorMat, -W * 0.44, 0, D * 0.22 - (a * D * 0.24));
                box(`bh_side_r${a}`, 0.18, H * 0.35, D * 0.22, armorMat, W * 0.44, 0, D * 0.22 - (a * D * 0.24));
                // Massive rivets
                box(`bh_rivet_l${a}`, 0.22, 0.06, 0.06, chromeMat, -W * 0.48, 0, D * 0.22 - (a * D * 0.24));
                box(`bh_rivet_r${a}`, 0.22, 0.06, 0.06, chromeMat, W * 0.48, 0, D * 0.22 - (a * D * 0.24));
            }

            // Chain Links around the frame
            for (let c = 0; c < 6; c++) {
                box(`bh_chain_l${c}`, 0.1, 0.25, 0.1, chromeMat, -W * 0.5, H * 0.2, D * 0.32 - (c * 0.16), 0, c % 2 === 0 ? 0 : Math.PI / 2, 0);
                box(`bh_chain_r${c}`, 0.1, 0.25, 0.1, chromeMat, W * 0.5, H * 0.2, D * 0.32 - (c * 0.16), 0, c % 2 === 0 ? 0 : Math.PI / 2, 0);
            }

            box("bh_engine", W * 0.65, H * 0.5, D * 0.32, armorMat, 0, H * 0.25, D * 0.46);
            cyl("bh_supercharger", 0.35, H * 0.35, 12, chromeMat, 0, H * 0.62, D * 0.48, 0, 0);
            box("bh_platform", W * 0.85, H * 0.15, D * 0.46, armorMat, 0, H * 0.04, -D * 0.28);
            box("bh_wall_l", 0.16, H * 0.3, D * 0.46, armorMat, -W * 0.4, H * 0.24, -D * 0.28);
            box("bh_wall_r", 0.16, H * 0.3, D * 0.46, armorMat, W * 0.4, H * 0.24, -D * 0.28);
            box("bh_wall_b", W * 0.85, H * 0.3, 0.16, armorMat, 0, H * 0.24, -D * 0.51);
            box("bh_cage_h", W * 0.98, 0.26, 0.26, chromeMat, 0, -H * 0.08, D * 0.55);
            box("bh_cage_vl", 0.2, H * 0.68, 0.2, chromeMat, -W * 0.42, H * 0.26, D * 0.55);
            box("bh_cage_vr", 0.2, H * 0.68, 0.2, chromeMat, W * 0.42, H * 0.26, D * 0.55);
            box("bh_cage_top", W * 0.86, 0.18, 0.18, chromeMat, 0, H * 0.6, D * 0.55);
            cyl("bh_ex_l", 0.26, H * 0.85, 12, chromeMat, -W * 0.28, H * 0.86, D * 0.18, 0, 0);
            cyl("bh_ex_r", 0.26, H * 0.85, 12, chromeMat, W * 0.28, H * 0.86, D * 0.18, 0, 0);
            box("bh_hl", W * 0.22, H * 0.14, 0.08, headMat, -W * 0.28, H * 0.22, D * 0.54);
            box("bh_hr", W * 0.22, H * 0.14, 0.08, headMat, W * 0.28, H * 0.22, D * 0.54);
            box("bh_tl", W * 0.22, H * 0.1, 0.08, tailMat, -W * 0.28, H * 0.12, -D * 0.54);
            box("bh_tr", W * 0.22, H * 0.1, 0.08, tailMat, W * 0.28, H * 0.12, -D * 0.54);
        }"""

weapons_new = """        // --- Build Dynamic Turret ---
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
            const base = MeshBuilder.CreateCylinder("baseShape", { diameter: 1.2, height: 0.3, tessellation: 24 }, scene);
            base.material = weaponMat; base.parent = turretBase;
            
            turretBox.position.y = 0.45; // Pivot Point for pitch! Prevents swinging underground

            const yoke = MeshBuilder.CreateBox("yoke", { width: 0.9, height: 0.6, depth: 0.6 }, scene);
            yoke.position.set(0, 0, 0); yoke.parent = turretBox; yoke.material = weaponMat;

            // Side Ammo Box
            const ammoBox = MeshBuilder.CreateBox("ammoBox", { width: 0.5, height: 0.6, depth: 0.8 }, scene);
            ammoBox.position.set(0.7, 0, 0); ammoBox.parent = turretBox; ammoBox.material = cautionMat;
            
            // Second Ammo Box
            const ammoBox2 = MeshBuilder.CreateBox("ammoBox2", { width: 0.5, height: 0.6, depth: 0.8 }, scene);
            ammoBox2.position.set(-0.7, 0, 0); ammoBox2.parent = turretBox; ammoBox2.material = weaponMat;

            const motor = MeshBuilder.CreateCylinder("motor", { diameter: 0.6, height: 1.2, tessellation: 24 }, scene);
            motor.rotation.x = Math.PI / 2; motor.position.set(0, 0, 0.4); motor.parent = turretBox; motor.material = weaponMat;

            // 6-Barrel Cluster
            const barrel = MeshBuilder.CreateBox("barrel", { size: 0.1 }, scene);
            barrel.isVisible = false;
            barrel.parent = turretBox;
            barrel.position.set(0, 0, 1.2);

            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const b = MeshBuilder.CreateCylinder("b" + i, { diameter: 0.12, height: 1.8, tessellation: 12 }, scene);
                b.rotation.x = Math.PI / 2;
                b.position.set(Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0.9);
                b.parent = turretBox;
                b.material = gunMetal;
            }
            // Barrel brackets
            const bracket = MeshBuilder.CreateCylinder("bracket", { diameter: 0.55, height: 0.1, tessellation: 16 }, scene);
            bracket.rotation.x = Math.PI / 2; bracket.position.set(0, 0, 0.2); bracket.parent = barrel; bracket.material = weaponMat;
            const bracket2 = MeshBuilder.CreateCylinder("bracket2", { diameter: 0.55, height: 0.1, tessellation: 16 }, scene);
            bracket2.rotation.x = Math.PI / 2; bracket2.position.set(0, 0, 1.4); bracket2.parent = barrel; bracket2.material = weaponMat;

        } else if (weaponId === "plasma") {
            // Advanced Rail/Plasma Cannon
            const base = MeshBuilder.CreateCylinder("baseShape", { diameter: 1.4, height: 0.2, tessellation: 24 }, scene);
            base.material = weaponMat; base.parent = turretBase;

            turretBox.position.y = 0.45; // Pivot

            const frame = MeshBuilder.CreateBox("frame", { width: 0.8, height: 0.8, depth: 1.6 }, scene);
            frame.position.set(0, 0, 0.2); frame.parent = turretBox; frame.material = weaponMat;

            // Heat sinks
            for (let i = 0; i < 6; i++) {
                const fin = MeshBuilder.CreateBox("fin" + i, { width: 0.9, height: 0.08, depth: 0.4 }, scene);
                fin.position.set(0, -0.3 + i * 0.12, -0.4); fin.parent = turretBox; fin.material = gunMetal;
            }

            // Pulsating coils
            const coil = MeshBuilder.CreateCylinder("coil", { diameter: 0.5, height: 1.8, tessellation: 24 }, scene);
            coil.rotation.x = Math.PI / 2; coil.position.set(0, 0, 0.8); coil.parent = turretBox;
            const gMat = glowMat.clone("gMat");
            gMat.emissiveColor = new Color3(0.1, 0.8, 1); coil.material = gMat;

            // Magnetic rails
            const railL = MeshBuilder.CreateBox("railL", { width: 0.15, height: 0.4, depth: 2.2 }, scene);
            railL.position.set(-0.35, 0, 1.0); railL.parent = turretBox; railL.material = gunMetal;
            const railR = MeshBuilder.CreateBox("railR", { width: 0.15, height: 0.4, depth: 2.2 }, scene);
            railR.position.set(0.35, 0, 1.0); railR.parent = turretBox; railR.material = gunMetal;

            // Emission point
            const barrel = MeshBuilder.CreateBox("barrel", { width: 0.4, height: 0.4, depth: 0.2 }, scene);
            barrel.position.set(0, 0, 2.0); barrel.parent = turretBox; barrel.isVisible = false;

        } else if (weaponId === "missile") {
            // MLRS Pod with target optics
            const base = MeshBuilder.CreateCylinder("baseShape", { diameter: 1.4, height: 0.3, tessellation: 24 }, scene);
            base.material = weaponMat; base.parent = turretBase;
            
            turretBox.position.y = 0.9;

            const armL = MeshBuilder.CreateBox("armL", { width: 0.2, height: 0.8, depth: 0.8 }, scene);
            armL.position.set(-0.6, -0.4, -0.2); armL.parent = turretBox; armL.material = weaponMat;
            const armR = MeshBuilder.CreateBox("armR", { width: 0.2, height: 0.8, depth: 0.8 }, scene);
            armR.position.set(0.6, -0.4, -0.2); armR.parent = turretBox; armR.material = weaponMat;

            const pod = MeshBuilder.CreateBox("pod", { width: 1.8, height: 1.0, depth: 1.6 }, scene);
            pod.position.set(0, 0, 0.2); pod.parent = turretBox; pod.material = gunMetal;

            // Targeting optic
            const optic = MeshBuilder.CreateCylinder("optic", { diameter: 0.25, height: 0.5, tessellation: 16 }, scene);
            optic.rotation.x = Math.PI / 2; optic.position.set(0.7, 0.6, 0.2); optic.parent = turretBox; optic.material = weaponMat;
            const lens = MeshBuilder.CreateCylinder("lens", { diameter: 0.2, height: 0.05, tessellation: 16 }, scene);
            lens.rotation.x = Math.PI / 2; lens.position.set(0.7, 0.6, 0.46); lens.parent = turretBox;
            const lensMat = glowMat.clone("lensMat"); lensMat.emissiveColor = new Color3(1, 0, 0); lens.material = lensMat;

            const barrel = MeshBuilder.CreateBox("barrel", { size: 0.1 }, scene);
            barrel.isVisible = false;
            barrel.parent = turretBox; barrel.position.set(0, 0, 1.0);

            // Detailed missile tubes
            const face = MeshBuilder.CreateBox("face", { width: 1.85, height: 1.05, depth: 0.05 }, scene);
            face.position.set(0, 0, 0.8); face.parent = pod; face.material = weaponMat;

            for (let x of [-0.6, -0.2, 0.2, 0.6]) {
                for (let y of [-0.3, 0.3]) {
                    const hole = MeshBuilder.CreateCylinder("hole", { diameter: 0.3, height: 0.1, tessellation: 12 }, scene);
                    hole.rotation.x = Math.PI / 2; hole.position.set(x, y, 0.05); hole.parent = face;
                    const hMat = new StandardMaterial("hMat", scene);
                    hMat.diffuseColor = new Color3(0, 0, 0); hole.material = hMat;
                }
            }
        } else if (weaponId === "mortar") {
            // Heavy Siege Mortar
            const base = MeshBuilder.CreateCylinder("baseShape", { diameter: 1.8, height: 0.4, tessellation: 24 }, scene);
            base.material = weaponMat; base.parent = turretBase;

            turretBox.position.y = 1.0;

            const standL = MeshBuilder.CreateBox("standL", { width: 0.3, height: 1.4, depth: 1.0 }, scene);
            standL.position.set(-0.7, -0.4, -0.2); standL.parent = turretBox; standL.material = weaponMat;
            const standR = MeshBuilder.CreateBox("standR", { width: 0.3, height: 1.4, depth: 1.0 }, scene);
            standR.position.set(0.7, -0.4, -0.2); standR.parent = turretBox; standR.material = weaponMat;

            // Recoil cylinders
            for (let sign of [-1, 1]) {
                const recoil = MeshBuilder.CreateCylinder("recoil" + sign, { diameter: 0.3, height: 1.0, tessellation: 16 }, scene);
                recoil.position.set(0.5 * sign, 0, -0.2); recoil.parent = turretBox; recoil.material = gunMetal;
            }

            // Massive Barrel
            const barrel = MeshBuilder.CreateCylinder("barrel", { diameter: 0.9, height: 2.6, tessellation: 24 }, scene);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(0, 0, 0.6); barrel.parent = turretBox; barrel.material = gunMetal;

            const ring1 = MeshBuilder.CreateCylinder("ring1", { diameter: 1.0, height: 0.3, tessellation: 24 }, scene);
            ring1.rotation.x = Math.PI / 2; ring1.position.set(0, 0, 1.2); ring1.parent = turretBox; ring1.material = weaponMat;
            const ring2 = MeshBuilder.CreateCylinder("ring2", { diameter: 1.1, height: 0.5, tessellation: 24 }, scene);
            ring2.rotation.x = Math.PI / 2; ring2.position.set(0, 0, 1.7); ring2.parent = turretBox; ring2.material = weaponMat;

        } else if (weaponId === "nuke") {
            // Thermonuclear Silo
            const base = MeshBuilder.CreateCylinder("baseShape", { diameter: 2.6, height: 0.6, tessellation: 32 }, scene);
            base.material = weaponMat; base.parent = turretBase;

            turretBox.position.y = 1.4;

            // Armored blast shields
            const shieldL = MeshBuilder.CreateBox("shieldL", { width: 0.5, height: 1.8, depth: 2.2 }, scene);
            shieldL.position.set(-1.2, -0.4, 0); shieldL.parent = turretBox; shieldL.material = weaponMat;
            const shieldR = MeshBuilder.CreateBox("shieldR", { width: 0.5, height: 1.8, depth: 2.2 }, scene);
            shieldR.position.set(1.2, -0.4, 0); shieldR.parent = turretBox; shieldR.material = weaponMat;

            // Hydraulic lifts
            const lift = MeshBuilder.CreateCylinder("lift", { diameter: 0.4, height: 2.0, tessellation: 16 }, scene);
            lift.rotation.x = Math.PI / 4; lift.position.set(0, -0.5, -0.8); lift.parent = turretBox; lift.material = gunMetal;

            // Massive Nuke Silo Tube
            const nukeBody = MeshBuilder.CreateCylinder("barrel", { diameter: 1.6, height: 4.0, tessellation: 32 }, scene);
            nukeBody.rotation.x = Math.PI / 2;
            nukeBody.position.set(0, 0, 0.8); nukeBody.parent = turretBox;
            nukeBody.material = gunMetal;

            // Caution stripes and warning lights
            const stripe = MeshBuilder.CreateCylinder("stripe", { diameter: 1.62, height: 0.8, tessellation: 32 }, scene);
            stripe.rotation.x = Math.PI / 2; stripe.position.set(0, 0, 2.0); stripe.parent = turretBox; stripe.material = cautionMat;

            for (let i of [-1.5, 0, 1.5]) {
                const warnRing = MeshBuilder.CreateCylinder("warn", { diameter: 1.65, height: 0.15, tessellation: 32 }, scene);
                warnRing.rotation.x = Math.PI / 2; warnRing.position.set(0, 0, i + 0.8); warnRing.parent = turretBox;
                const gMat = glowMat.clone("gMat"); gMat.emissiveColor = new Color3(1, 0, 0); warnRing.material = gMat;
            }
        }
"""

# Regex replacement
content = re.sub(r'        if \(vehicleId === "juggernaut"\) \{.*?        \} else if \(vehicleId === "interceptor"\) \{', juggernaut_new + "\\n" + interceptor_new.split('} else if (vehicleId === "interceptor") {')[0], content, flags=re.DOTALL)
content = re.sub(r'        \} else if \(vehicleId === "interceptor"\) \{.*?        \} else if \(vehicleId === "phantom"\) \{', interceptor_new + "\\n" + phantom_new.split('} else if (vehicleId === "phantom") {')[0], content, flags=re.DOTALL)
content = re.sub(r'        \} else if \(vehicleId === "phantom"\) \{.*?        \} else if \(vehicleId === "manticore"\) \{', phantom_new + "\\n" + manticore_new.split('} else if (vehicleId === "manticore") {')[0], content, flags=re.DOTALL)
content = re.sub(r'        \} else if \(vehicleId === "manticore"\) \{.*?        \} else if \(vehicleId === "valkyrie"\) \{', manticore_new + "\\n" + valkyrie_new.split('} else if (vehicleId === "valkyrie") {')[0], content, flags=re.DOTALL)
content = re.sub(r'        \} else if \(vehicleId === "valkyrie"\) \{.*?        \} else if \(vehicleId === "wraith"\) \{', valkyrie_new + "\\n" + wraith_new.split('} else if (vehicleId === "wraith") {')[0], content, flags=re.DOTALL)
content = re.sub(r'        \} else if \(vehicleId === "wraith"\) \{.*?        \} else if \(vehicleId === "behemoth"\) \{', wraith_new + "\\n" + behemoth_new.split('} else if (vehicleId === "behemoth") {')[0], content, flags=re.DOTALL)
content = re.sub(r'        \} else if \(vehicleId === "behemoth"\) \{.*?        \}\s*// --- Build Dynamic Turret ---', behemoth_new + "\\n        }\\n        // --- Build Dynamic Turret ---", content, flags=re.DOTALL)

# Replace weapons
content = re.sub(r'        // --- Build Dynamic Turret ---.*?// 4\. Create Wheels dynamically', weapons_new + "\n        // 4. Create Wheels dynamically", content, flags=re.DOTALL)

with open("src/game/entities/VehicleFactory.ts", "w") as f:
    f.write(content)

print("Done updating VehicleFactory.ts!")
