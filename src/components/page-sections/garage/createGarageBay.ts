import { Color3, MeshBuilder, PBRMaterial, Scene, type ShadowGenerator } from '@babylonjs/core';

/**
 * Creates an authentic, high-performance automotive combat workshop/showroom environment.
 * Features:
 * - Reflective polished industrial floor with turntable & perimeter LED ring
 * - Twin-post hydraulic vehicle lift gantry with overhead steel cross-beam
 * - Rolling mechanics tool chests with diagnostic terminals
 * - Multi-tier tire storage racks with racing slick & combat tires
 * - Overdrive weapon transit cases & heavy ammo supply lockers
 * - Industrial fuel/nitro drums on containment pallet
 * - Overhead LED lighting truss providing studio reflections on the car
 * - Architectural ribbed back wall with ventilation ducts and light runners
 */
export function createGarageBay(scene: Scene, shadows?: ShadowGenerator): void {
    // ── Shared Materials ──────────────────────────────────────────────────────
    const mFloor = new PBRMaterial('mat-floor', scene);
    mFloor.albedoColor = Color3.FromHexString('#0e1014');
    mFloor.metallic = 0.85;
    mFloor.roughness = 0.22;

    const mPad = new PBRMaterial('mat-pad', scene);
    mPad.albedoColor = Color3.FromHexString('#141720');
    mPad.metallic = 0.9;
    mPad.roughness = 0.28;

    const mDarkMetal = new PBRMaterial('mat-dark-metal', scene);
    mDarkMetal.albedoColor = Color3.FromHexString('#161820');
    mDarkMetal.metallic = 0.88;
    mDarkMetal.roughness = 0.35;

    const mChrome = new PBRMaterial('mat-chrome', scene);
    mChrome.albedoColor = Color3.FromHexString('#d0d5dd');
    mChrome.metallic = 0.98;
    mChrome.roughness = 0.12;

    const mRubber = new PBRMaterial('mat-rubber', scene);
    mRubber.albedoColor = Color3.FromHexString('#131417');
    mRubber.metallic = 0.05;
    mRubber.roughness = 0.85;

    const mCrate = new PBRMaterial('mat-crate', scene);
    mCrate.albedoColor = Color3.FromHexString('#1b1e27');
    mCrate.metallic = 0.75;
    mCrate.roughness = 0.42;

    const mBarrel = new PBRMaterial('mat-barrel', scene);
    mBarrel.albedoColor = Color3.FromHexString('#20242f');
    mBarrel.metallic = 0.85;
    mBarrel.roughness = 0.32;

    const mEmissiveWhite = new PBRMaterial('mat-emissive-white', scene);
    mEmissiveWhite.albedoColor = Color3.Black();
    mEmissiveWhite.emissiveColor = Color3.White();
    mEmissiveWhite.emissiveIntensity = 4.8;
    mEmissiveWhite.disableLighting = true;

    const mWall = new PBRMaterial('mat-wall', scene);
    mWall.albedoColor = Color3.FromHexString('#0a0c10');
    mWall.metallic = 0.6;
    mWall.roughness = 0.55;

    const mAccentStripe = new PBRMaterial('mat-accent-stripe', scene);
    mAccentStripe.albedoColor = Color3.FromHexString('#d4d8e0');
    mAccentStripe.metallic = 0.4;
    mAccentStripe.roughness = 0.4;

    // ── Floor & Turntable Platform ───────────────────────────────────────────
    const floor = MeshBuilder.CreateGround('showroom-floor', { width: 120, height: 120 }, scene);
    floor.position.y = -2.2;
    floor.material = mFloor;
    floor.receiveShadows = true;

    const pad = MeshBuilder.CreateCylinder('service-pad', { diameter: 13, height: 0.16, tessellation: 48 }, scene);
    pad.position.y = -2.12;
    pad.material = mPad;
    pad.receiveShadows = true;

    // Recessed glowing LED perimeter ring
    const glowRing = MeshBuilder.CreateTorus('glow-ring', { diameter: 12.8, thickness: 0.08, tessellation: 64 }, scene);
    glowRing.parent = pad;
    glowRing.position.y = 0.082;
    glowRing.material = mEmissiveWhite;

    // Inner concentric ring
    const innerRing = MeshBuilder.CreateTorus('inner-ring', { diameter: 8.5, thickness: 0.025, tessellation: 64 }, scene);
    innerRing.parent = pad;
    innerRing.position.y = 0.081;
    innerRing.material = mAccentStripe;

    // Floor alignment dash lines (4 cardinal lines)
    for (const rot of [0, Math.PI / 2]) {
        const stripe = MeshBuilder.CreateBox('floor-stripe', { width: 0.08, height: 0.005, depth: 11.5 }, scene);
        stripe.parent = pad;
        stripe.position.y = 0.081;
        stripe.rotation.y = rot;
        stripe.material = mAccentStripe;
    }

    // ── Helper to create shadow-casting prop parented to floor ────────────────
    const placeProp = (mesh: any, castShadow = true) => {
        mesh.parent = floor;
        mesh.receiveShadows = true;
        if (castShadow && shadows) {
            shadows.addShadowCaster(mesh, false);
        }
    };

    // ── Twin-Post Hydraulic Car Lift ──────────────────────────────────────────
    for (const side of [-1, 1]) {
        const posX = side * 5.8;

        // Baseplate
        const base = MeshBuilder.CreateBox(`lift-base-${side}`, { width: 1.1, height: 0.08, depth: 0.8 }, scene);
        base.position.set(posX, 0.04, 0);
        base.material = mDarkMetal;
        placeProp(base);

        // Vertical Column
        const col = MeshBuilder.CreateBox(`lift-col-${side}`, { width: 0.42, height: 5.4, depth: 0.5 }, scene);
        col.position.set(posX, 2.7, 0);
        col.material = mDarkMetal;
        placeProp(col);

        // Internal Hydraulic Ram (Chrome)
        const ram = MeshBuilder.CreateCylinder(`lift-ram-${side}`, { diameter: 0.14, height: 4.8 }, scene);
        ram.position.set(posX - side * 0.1, 2.5, 0);
        ram.material = mChrome;
        placeProp(ram, false);

        // Swing Arms resting near floor
        for (const armZ of [-1, 1]) {
            const arm = MeshBuilder.CreateBox(`lift-arm-${side}-${armZ}`, { width: 1.8, height: 0.12, depth: 0.16 }, scene);
            arm.position.set(posX - side * 0.9, 0.15, armZ * 1.2);
            arm.rotation.y = side * armZ * 0.45;
            arm.material = mDarkMetal;
            placeProp(arm);

            // Rubber lift pad
            const padMesh = MeshBuilder.CreateCylinder(`lift-pad-${side}-${armZ}`, { diameter: 0.22, height: 0.05 }, scene);
            padMesh.position.set(posX - side * 1.7, 0.22, armZ * 1.7);
            padMesh.material = mRubber;
            placeProp(padMesh, false);
        }

        // Hydraulic power station unit on the right post
        if (side === 1) {
            const powerUnit = MeshBuilder.CreateBox('power-unit', { width: 0.28, height: 0.8, depth: 0.35 }, scene);
            powerUnit.position.set(posX + 0.35, 2.0, 0);
            powerUnit.material = mDarkMetal;
            placeProp(powerUnit);

            const tank = MeshBuilder.CreateCylinder('fluid-tank', { diameter: 0.2, height: 0.5 }, scene);
            tank.position.set(posX + 0.35, 1.35, 0);
            tank.material = mChrome;
            placeProp(tank, false);
        }
    }

    // Overhead Gantry Cross-Beam connecting the two posts
    const crossBeam = MeshBuilder.CreateBox('lift-crossbeam', { width: 12.0, height: 0.28, depth: 0.35 }, scene);
    crossBeam.position.set(0, 5.4, 0);
    crossBeam.material = mDarkMetal;
    placeProp(crossBeam);

    // ── Professional Mechanics Rolling Tool Chests ────────────────────────────
    // Master Tool Station (Left Fore)
    const chest1 = MeshBuilder.CreateBox('tool-chest-1', { width: 1.8, height: 1.3, depth: 0.75 }, scene);
    chest1.position.set(-7.2, 0.65, 1.0);
    chest1.rotation.y = 0.35;
    chest1.material = mDarkMetal;
    placeProp(chest1);

    // Drawers with chrome pulls
    for (let i = 0; i < 6; i++) {
        const drawerY = 0.25 + i * 0.17;
        const handle = MeshBuilder.CreateBox(`chest1-handle-${i}`, { width: 1.2, height: 0.03, depth: 0.04 }, scene);
        handle.parent = chest1;
        handle.position.set(0, drawerY - 0.65, 0.39);
        handle.material = mChrome;
    }

    // Work surface rubber mat
    const mat1 = MeshBuilder.CreateBox('chest1-mat', { width: 1.76, height: 0.02, depth: 0.72 }, scene);
    mat1.parent = chest1;
    mat1.position.set(0, 0.66, 0);
    mat1.material = mRubber;

    // Diagnostic Tablet / Terminal on swivel mount
    const diagBase = MeshBuilder.CreateCylinder('diag-base', { diameter: 0.12, height: 0.3 }, scene);
    diagBase.parent = chest1;
    diagBase.position.set(0.6, 0.8, 0.15);
    diagBase.material = mChrome;

    const diagScreen = MeshBuilder.CreateBox('diag-screen', { width: 0.42, height: 0.28, depth: 0.03 }, scene);
    diagScreen.parent = diagBase;
    diagScreen.position.set(0, 0.2, 0);
    diagScreen.rotation.x = -0.4;
    diagScreen.material = mPad;

    const diagGlow = MeshBuilder.CreatePlane('diag-glow', { width: 0.38, height: 0.24 }, scene);
    diagGlow.parent = diagScreen;
    diagGlow.position.set(0, 0, 0.016);
    diagGlow.material = mEmissiveWhite;

    // Secondary Rollaway Tool Cart (Right Aft)
    const cart2 = MeshBuilder.CreateBox('tool-cart-2', { width: 1.1, height: 1.0, depth: 0.6 }, scene);
    cart2.position.set(7.0, 0.5, -2.5);
    cart2.rotation.y = -0.4;
    cart2.material = mDarkMetal;
    placeProp(cart2);

    for (let i = 0; i < 4; i++) {
        const handle = MeshBuilder.CreateBox(`cart2-handle-${i}`, { width: 0.75, height: 0.025, depth: 0.03 }, scene);
        handle.parent = cart2;
        handle.position.set(0, 0.28 - i * 0.18, 0.31);
        handle.material = mChrome;
    }

    // ── Multi-Tier Tire Storage Rack & Racing Tires ───────────────────────────
    const rackX = -6.8;
    const rackZ = -6.5;

    // Rack frame posts
    for (const dx of [-1.5, 1.5]) {
        for (const dz of [-0.4, 0.4]) {
            const post = MeshBuilder.CreateCylinder(`tire-post-${dx}-${dz}`, { diameter: 0.06, height: 2.2 }, scene);
            post.position.set(rackX + dx, 1.1, rackZ + dz);
            post.material = mDarkMetal;
            placeProp(post, false);
        }
    }

    // Horizontal shelf rails
    for (const shelfY of [0.4, 1.4]) {
        for (const dz of [-0.32, 0.32]) {
            const rail = MeshBuilder.CreateBox(`tire-rail-${shelfY}-${dz}`, { width: 3.1, height: 0.05, depth: 0.05 }, scene);
            rail.position.set(rackX, shelfY, rackZ + dz);
            rail.material = mDarkMetal;
            placeProp(rail, false);
        }

        // 4 tires per shelf
        for (let t = 0; t < 4; t++) {
            const tireX = rackX - 1.1 + t * 0.74;
            const tire = MeshBuilder.CreateTorus(`rack-tire-${shelfY}-${t}`, { diameter: 0.72, thickness: 0.28, tessellation: 36 }, scene);
            tire.position.set(tireX, shelfY + 0.36, rackZ);
            tire.rotation.x = Math.PI / 2;
            tire.material = mRubber;
            placeProp(tire);

            const rim = MeshBuilder.CreateCylinder(`rack-rim-${shelfY}-${t}`, { diameter: 0.44, height: 0.24, tessellation: 24 }, scene);
            rim.position.set(tireX, shelfY + 0.36, rackZ);
            rim.rotation.x = Math.PI / 2;
            rim.material = mChrome;
            placeProp(rim, false);
        }
    }

    // Floor tire stack (2 tires stacked flat)
    for (let s = 0; s < 2; s++) {
        const stackTire = MeshBuilder.CreateTorus(`floor-tire-${s}`, { diameter: 0.75, thickness: 0.3, tessellation: 36 }, scene);
        stackTire.position.set(-5.2, 0.15 + s * 0.3, -3.8);
        stackTire.material = mRubber;
        placeProp(stackTire);

        const stackRim = MeshBuilder.CreateCylinder(`floor-rim-${s}`, { diameter: 0.46, height: 0.26, tessellation: 24 }, scene);
        stackRim.position.set(-5.2, 0.15 + s * 0.3, -3.8);
        stackRim.material = mChrome;
        placeProp(stackRim, false);
    }

    // ── Overdrive Weapon Crates & Supply Lockers ───────────────────────────────
    // Large heavy weapon transport case (Right Fore)
    const crate1 = MeshBuilder.CreateBox('weapon-crate-1', { width: 1.5, height: 0.65, depth: 0.85 }, scene);
    crate1.position.set(5.4, 0.33, 2.4);
    crate1.rotation.y = -0.45;
    crate1.material = mCrate;
    placeProp(crate1);

    // Corner bumper ribs on crate
    for (const cx of [-0.72, 0.72]) {
        for (const cz of [-0.4, 0.4]) {
            const rib = MeshBuilder.CreateBox(`crate-rib-${cx}-${cz}`, { width: 0.08, height: 0.66, depth: 0.08 }, scene);
            rib.parent = crate1;
            rib.position.set(cx, 0, cz);
            rib.material = mDarkMetal;
        }
    }

    // Chrome clasps/latches
    for (const lx of [-0.4, 0.4]) {
        const latch = MeshBuilder.CreateBox(`crate-latch-${lx}`, { width: 0.08, height: 0.1, depth: 0.04 }, scene);
        latch.parent = crate1;
        latch.position.set(lx, 0.15, 0.44);
        latch.material = mChrome;
    }

    // Smaller stacked ammo box on top
    const ammoBox = MeshBuilder.CreateBox('ammo-box-small', { width: 0.7, height: 0.35, depth: 0.45 }, scene);
    ammoBox.position.set(5.3, 0.82, 2.3);
    ammoBox.rotation.y = -0.3;
    ammoBox.material = mCrate;
    placeProp(ammoBox);

    // Long ordnance missile transit locker (Back Left)
    const longCrate = MeshBuilder.CreateBox('long-ordnance-case', { width: 2.2, height: 0.45, depth: 0.6 }, scene);
    longCrate.position.set(-4.5, 0.23, -7.2);
    longCrate.rotation.y = -0.12;
    longCrate.material = mCrate;
    placeProp(longCrate);

    // ── Heavy Industrial Fuel / Nitro Drums ────────────────────────────────────
    const drumPositions = [
        { x: 6.8, z: -6.2 },
        { x: 7.5, z: -5.6 },
        { x: 6.2, z: -5.4 },
    ];

    drumPositions.forEach((pos, idx) => {
        const drum = MeshBuilder.CreateCylinder(`fuel-drum-${idx}`, { diameter: 0.68, height: 1.05, tessellation: 32 }, scene);
        drum.position.set(pos.x, 0.525, pos.z);
        drum.material = mBarrel;
        placeProp(drum);

        // Circumferential reinforcement ribs
        for (const ry of [-0.25, 0.25]) {
            const rib = MeshBuilder.CreateTorus(`drum-rib-${idx}-${ry}`, { diameter: 0.7, thickness: 0.03, tessellation: 32 }, scene);
            rib.parent = drum;
            rib.position.y = ry;
            rib.material = mDarkMetal;
        }

        // White identification stripe
        const stripe = MeshBuilder.CreateCylinder(`drum-stripe-${idx}`, { diameter: 0.684, height: 0.12, tessellation: 32 }, scene);
        stripe.parent = drum;
        stripe.position.y = 0.35;
        stripe.material = mAccentStripe;

        // Top bung cap
        const cap = MeshBuilder.CreateCylinder(`drum-cap-${idx}`, { diameter: 0.08, height: 0.04 }, scene);
        cap.parent = drum;
        cap.position.set(0.18, 0.53, 0);
        cap.material = mChrome;
    });

    // ── Architectural Workshop Back Wall & Ventilation ────────────────────────
    const backWall = MeshBuilder.CreatePlane('garage-back-wall', { width: 38, height: 10 }, scene);
    backWall.position.set(0, 5.0, -10.8);
    backWall.rotation.y = Math.PI;
    backWall.material = mWall;
    backWall.receiveShadows = true;

    // Structural steel I-beam columns along back wall
    for (const colX of [-9.0, -3.0, 3.0, 9.0]) {
        const beam = MeshBuilder.CreateBox(`wall-beam-${colX}`, { width: 0.35, height: 10, depth: 0.35 }, scene);
        beam.position.set(colX, 5.0, -10.6);
        beam.material = mDarkMetal;
        placeProp(beam, false);
    }

    // Large horizontal ventilation duct running across top of back wall
    const ventDuct = MeshBuilder.CreateCylinder('vent-duct', { diameter: 0.8, height: 32, tessellation: 24 }, scene);
    ventDuct.position.set(0, 8.2, -10.2);
    ventDuct.rotation.z = Math.PI / 2;
    ventDuct.material = mDarkMetal;
    placeProp(ventDuct, false);

    // Ventilation support brackets
    for (const bx of [-8, -3, 3, 8]) {
        const bracket = MeshBuilder.CreateBox(`vent-bracket-${bx}`, { width: 0.12, height: 1.8, depth: 0.9 }, scene);
        bracket.position.set(bx, 8.2, -10.5);
        bracket.material = mChrome;
        placeProp(bracket, false);
    }

    // Horizontal architectural LED light runner across mid-wall
    const wallLight = MeshBuilder.CreateBox('wall-led-strip', { width: 34, height: 0.06, depth: 0.04 }, scene);
    wallLight.position.set(0, 2.6, -10.65);
    wallLight.material = mEmissiveWhite;
    placeProp(wallLight, false);

    // ── Overhead LED Lighting Truss Rig ───────────────────────────────────────
    // Suspended high-output linear LED fixtures casting gorgeous studio reflections
    const trussY = 6.8;

    // Square gantry frame
    for (const gx of [-4.5, 4.5]) {
        const tube = MeshBuilder.CreateBox(`truss-side-${gx}`, { width: 0.15, height: 0.15, depth: 10.0 }, scene);
        tube.position.set(gx, trussY, 0);
        tube.material = mDarkMetal;
        placeProp(tube, false);
    }
    for (const gz of [-5.0, 5.0]) {
        const tube = MeshBuilder.CreateBox(`truss-cross-${gz}`, { width: 9.0, height: 0.15, depth: 0.15 }, scene);
        tube.position.set(0, trussY, gz);
        tube.material = mDarkMetal;
        placeProp(tube, false);
    }

    // 4 Longitudinal Linear LED Fixtures (2 over left flank, 2 over right flank)
    const ledXOffsets = [-2.8, -1.2, 1.2, 2.8];
    ledXOffsets.forEach((lx, idx) => {
        // Fixture housing
        const housing = MeshBuilder.CreateBox(`led-housing-${idx}`, { width: 0.22, height: 0.1, depth: 6.2 }, scene);
        housing.position.set(lx, trussY - 0.05, 0);
        housing.material = mDarkMetal;
        placeProp(housing, false);

        // Glowing emitter face
        const emitter = MeshBuilder.CreateBox(`led-emitter-${idx}`, { width: 0.16, height: 0.03, depth: 6.0 }, scene);
        emitter.position.set(lx, trussY - 0.1, 0);
        emitter.material = mEmissiveWhite;
        placeProp(emitter, false);
    });

    // 2 Angled Spot Fixtures on front cross-beam
    for (const sx of [-2.5, 2.5]) {
        const spotHousing = MeshBuilder.CreateCylinder(`spot-housing-${sx}`, { diameter: 0.35, height: 0.4 }, scene);
        spotHousing.position.set(sx, trussY - 0.2, 4.8);
        spotHousing.rotation.x = -Math.PI / 4;
        spotHousing.material = mDarkMetal;
        placeProp(spotHousing, false);

        const spotLens = MeshBuilder.CreateCylinder(`spot-lens-${sx}`, { diameter: 0.3, height: 0.04 }, scene);
        spotLens.position.set(sx, trussY - 0.32, 4.7);
        spotLens.rotation.x = -Math.PI / 4;
        spotLens.material = mEmissiveWhite;
        placeProp(spotLens, false);
    }
}
