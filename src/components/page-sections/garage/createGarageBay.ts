import { Color3, Mesh, MeshBuilder, PBRMaterial, RawTexture, Scene, StandardMaterial, Texture, type ShadowGenerator } from '@babylonjs/core';

/**
 * Procedural atmospheric skybox dome enclosing the garage bay and proving grounds.
 * Creates an equirectangular twilight sky with a deep midnight zenith, glowing molten amber
 * sunset horizon, distant silhouette mountain ridges, industrial crane gantries, and starfield.
 */
function createGarageSky(scene: Scene): void {
    const width = 1024;
    const height = 512;
    const pixels = new Uint8Array(width * height * 4);

    const zenith = [12, 16, 28];
    const midSky = [34, 40, 68];
    const upperHorizon = [78, 52, 75];
    const horizonGlow = [235, 130, 45];
    const silhouette = [14, 18, 26];
    const ground = [10, 12, 16];

    for (let x = 0; x < width; x++) {
        const u = x / (width - 1);
        const angle = u * Math.PI * 2;

        const ridge1 = 0.512 - 0.024 * Math.sin(angle * 5) - 0.014 * Math.sin(angle * 11 + 1) - 0.008 * Math.cos(angle * 23);
        const ridge2 = 0.535 - 0.018 * Math.sin(angle * 7 + 2) - 0.010 * Math.cos(angle * 17);

        const block = Math.floor(u * 96) % 96;
        const localU = (u * 96) % 1;
        const roof = 0.490 - (0.012 + 0.05 * (0.5 + 0.5 * Math.sin(block * 7.13)));
        const isStructure = localU > 0.15 && localU < 0.85;
        const isCrane = block % 7 === 0 && localU > 0.42 && localU < 0.58;

        for (let y = 0; y < height; y++) {
            const v = y / (height - 1);
            let r: number, g: number, b: number;

            if (v < 0.28) {
                const t = v / 0.28;
                r = zenith[0] + (midSky[0] - zenith[0]) * t;
                g = zenith[1] + (midSky[1] - zenith[1]) * t;
                b = zenith[2] + (midSky[2] - zenith[2]) * t;

                const starHash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
                const frac = starHash - Math.floor(starHash);
                if (frac > 0.993 && v < 0.24) {
                    const starBrightness = Math.floor(160 + (frac - 0.993) * 13500);
                    r = Math.min(255, r + starBrightness);
                    g = Math.min(255, g + starBrightness);
                    b = Math.min(255, b + starBrightness);
                }
            } else if (v < 0.44) {
                const t = (v - 0.28) / (0.44 - 0.28);
                r = midSky[0] + (upperHorizon[0] - midSky[0]) * t;
                g = midSky[1] + (upperHorizon[1] - midSky[1]) * t;
                b = midSky[2] + (upperHorizon[2] - midSky[2]) * t;

                const cloud = Math.pow(Math.max(0, Math.sin(angle * 3.5 + v * 24) * Math.cos(v * 38 + Math.sin(angle * 4))), 4) * 28;
                r += cloud * 0.9;
                g += cloud * 0.6;
                b += cloud * 0.7;
            } else if (v <= 0.51) {
                const t = (v - 0.44) / (0.51 - 0.44);
                r = upperHorizon[0] + (horizonGlow[0] - upperHorizon[0]) * t;
                g = upperHorizon[1] + (horizonGlow[1] - upperHorizon[1]) * t;
                b = upperHorizon[2] + (horizonGlow[2] - upperHorizon[2]) * t;

                const sunsetBurst = Math.pow(Math.max(0, 1 - Math.abs(angle - Math.PI) / 1.8), 2) * 35 * t;
                r = Math.min(255, r + sunsetBurst);
                g = Math.min(255, g + sunsetBurst * 0.6);
            } else {
                r = ground[0];
                g = ground[1];
                b = ground[2];
            }

            if (v > ridge1) {
                r = silhouette[0] + 6;
                g = silhouette[1] + 6;
                b = silhouette[2] + 8;
                if (v < ridge1 + 0.006) {
                    r = Math.min(255, r + 75);
                    g = Math.min(255, g + 40);
                    b = Math.min(255, b + 15);
                }
            }

            if (v > ridge2) {
                r = silhouette[0];
                g = silhouette[1];
                b = silhouette[2];
            }

            if (isStructure && v > roof && v < 0.54) {
                r = silhouette[0];
                g = silhouette[1];
                b = silhouette[2];
                if (isCrane && v < roof + 0.008) {
                    r = 240; g = 80; b = 40;
                }
            }

            const offset = (y * width + x) * 4;
            pixels[offset] = Math.min(255, Math.floor(r));
            pixels[offset + 1] = Math.min(255, Math.floor(g));
            pixels[offset + 2] = Math.min(255, Math.floor(b));
            pixels[offset + 3] = 255;
        }
    }

    for (let y = 0; y < height; y++) {
        pixels.copyWithin((y * width + width - 1) * 4, y * width * 4, y * width * 4 + 4);
    }

    const skySphere = MeshBuilder.CreateSphere('garage-skybox', { diameter: 1200, segments: 32, sideOrientation: Mesh.BACKSIDE }, scene);
    const texture = RawTexture.CreateRGBATexture(pixels, width, height, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.CLAMP_ADDRESSMODE;

    const skyMat = new StandardMaterial('mat-garage-sky', scene);
    skyMat.emissiveTexture = texture;
    skyMat.emissiveColor = Color3.Black();
    skyMat.diffuseColor = Color3.Black();
    skyMat.specularColor = Color3.Black();
    skyMat.disableLighting = true;
    skyMat.fogEnabled = false;

    skySphere.material = skyMat;
    skySphere.infiniteDistance = true;
    skySphere.isPickable = false;
    skySphere.metadata = { skybox: true, presentationOnly: true };
}

/**
 * Creates an authentic, high-octane automotive combat workshop & showroom environment.
 * Features:
 * - Full architectural hangar skybox enclosure with industrial steel trusses & ceiling skylights
 * - Polished reflective industrial epoxy floor with rotating turntable & glowing amber LED ring
 * - Vibrant Snap-On racing red mechanics tool stations, rollaway carts & hydraulic shop jack
 * - Safety yellow hydraulic twin-post vehicle lift with hazard-striped baseplates
 * - High-octane nitro blue and fiery orange racing fuel drums on steel containment pallets
 * - Olive drab tactical weapon transit crates with hazard stencils
 * - Industrial roll-up shutter bay doors and illuminated neon workshop signage
 * - Suspended overhead studio lighting truss providing vivid specular reflections on the vehicle
 */
export function createGarageBay(scene: Scene, shadows?: ShadowGenerator): void {
    // ── 360-Degree Atmospheric Skybox Dome ────────────────────────────────────
    createGarageSky(scene);
    // ── Shared Materials ──────────────────────────────────────────────────────
    const mFloor = new PBRMaterial('mat-floor', scene);
    mFloor.albedoColor = Color3.FromHexString('#0a0c10');
    mFloor.metallic = 0.88;
    mFloor.roughness = 0.18; // Polished wet epoxy reflection

    const mPad = new PBRMaterial('mat-pad', scene);
    mPad.albedoColor = Color3.FromHexString('#12151e');
    mPad.metallic = 0.92;
    mPad.roughness = 0.22;

    const mDarkMetal = new PBRMaterial('mat-dark-metal', scene);
    mDarkMetal.albedoColor = Color3.FromHexString('#161820');
    mDarkMetal.metallic = 0.88;
    mDarkMetal.roughness = 0.35;

    const mChrome = new PBRMaterial('mat-chrome', scene);
    mChrome.albedoColor = Color3.FromHexString('#e2e8f0');
    mChrome.metallic = 0.98;
    mChrome.roughness = 0.08;

    const mRubber = new PBRMaterial('mat-rubber', scene);
    mRubber.albedoColor = Color3.FromHexString('#121316');
    mRubber.metallic = 0.05;
    mRubber.roughness = 0.85;

    // ── Vibrant Colored Materials ──
    const mToolRed = new PBRMaterial('mat-tool-red', scene);
    mToolRed.albedoColor = Color3.FromHexString('#dc2626');
    mToolRed.metallic = 0.65;
    mToolRed.roughness = 0.22; // High-gloss automotive tool chest enamel

    const mSafetyYellow = new PBRMaterial('mat-safety-yellow', scene);
    mSafetyYellow.albedoColor = Color3.FromHexString('#eab308');
    mSafetyYellow.metallic = 0.55;
    mSafetyYellow.roughness = 0.28; // Industrial machinery yellow

    const mHazardStripe = new PBRMaterial('mat-hazard-stripe', scene);
    mHazardStripe.albedoColor = Color3.FromHexString('#facc15');
    mHazardStripe.metallic = 0.4;
    mHazardStripe.roughness = 0.35;

    const mHazardDark = new PBRMaterial('mat-hazard-dark', scene);
    mHazardDark.albedoColor = Color3.FromHexString('#0f172a');
    mHazardDark.metallic = 0.5;
    mHazardDark.roughness = 0.4;

    const mNitroBlue = new PBRMaterial('mat-nitro-blue', scene);
    mNitroBlue.albedoColor = Color3.FromHexString('#1d4ed8');
    mNitroBlue.metallic = 0.75;
    mNitroBlue.roughness = 0.25; // Electric racing nitrous drum

    const mFuelOrange = new PBRMaterial('mat-fuel-orange', scene);
    mFuelOrange.albedoColor = Color3.FromHexString('#ea580c');
    mFuelOrange.metallic = 0.75;
    mFuelOrange.roughness = 0.25; // High-octane fuel drum

    const mOliveCrate = new PBRMaterial('mat-olive-crate', scene);
    mOliveCrate.albedoColor = Color3.FromHexString('#3f6212');
    mOliveCrate.metallic = 0.55;
    mOliveCrate.roughness = 0.45; // Military tactical ordnance container

    const mHangarWall = new PBRMaterial('mat-hangar-wall', scene);
    mHangarWall.albedoColor = Color3.FromHexString('#0b0e14');
    mHangarWall.metallic = 0.65;
    mHangarWall.roughness = 0.5;

    const mHangarCeiling = new PBRMaterial('mat-hangar-ceiling', scene);
    mHangarCeiling.albedoColor = Color3.FromHexString('#07090d');
    mHangarCeiling.metallic = 0.7;
    mHangarCeiling.roughness = 0.6;

    const mShutterDoor = new PBRMaterial('mat-shutter-door', scene);
    mShutterDoor.albedoColor = Color3.FromHexString('#1e293b');
    mShutterDoor.metallic = 0.8;
    mShutterDoor.roughness = 0.38;

    const mEmissiveAmber = new PBRMaterial('mat-emissive-amber', scene);
    mEmissiveAmber.albedoColor = Color3.Black();
    mEmissiveAmber.emissiveColor = Color3.FromHexString('#f59e0b');
    mEmissiveAmber.emissiveIntensity = 4.2;
    mEmissiveAmber.disableLighting = true;

    const mEmissiveCyan = new PBRMaterial('mat-emissive-cyan', scene);
    mEmissiveCyan.albedoColor = Color3.Black();
    mEmissiveCyan.emissiveColor = Color3.FromHexString('#06b6d4');
    mEmissiveCyan.emissiveIntensity = 4.0;
    mEmissiveCyan.disableLighting = true;

    const mEmissiveWhite = new PBRMaterial('mat-emissive-white', scene);
    mEmissiveWhite.albedoColor = Color3.Black();
    mEmissiveWhite.emissiveColor = Color3.White();
    mEmissiveWhite.emissiveIntensity = 4.8;
    mEmissiveWhite.disableLighting = true;

    const mSkylight = new PBRMaterial('mat-skylight', scene);
    mSkylight.albedoColor = Color3.FromHexString('#1e293b');
    mSkylight.emissiveColor = Color3.FromHexString('#38bdf8');
    mSkylight.emissiveIntensity = 1.2;
    mSkylight.alpha = 0.85;

    // ── Floor & Turntable Platform ───────────────────────────────────────────
    const floor = MeshBuilder.CreateGround('showroom-floor', { width: 120, height: 120 }, scene);
    floor.position.y = -2.2;
    floor.material = mFloor;
    floor.receiveShadows = true;

    const pad = MeshBuilder.CreateCylinder('service-pad', { diameter: 13, height: 0.16, tessellation: 48 }, scene);
    pad.position.y = -2.12;
    pad.material = mPad;
    pad.receiveShadows = true;

    // Glowing tactical amber perimeter ring
    const glowRing = MeshBuilder.CreateTorus('glow-ring', { diameter: 12.8, thickness: 0.08, tessellation: 64 }, scene);
    glowRing.parent = pad;
    glowRing.position.y = 0.082;
    glowRing.material = mEmissiveAmber;

    // Inner concentric accent ring
    const innerRing = MeshBuilder.CreateTorus('inner-ring', { diameter: 8.5, thickness: 0.025, tessellation: 64 }, scene);
    innerRing.parent = pad;
    innerRing.position.y = 0.081;
    innerRing.material = mChrome;

    // Cardinal alignment stripes
    for (const rot of [0, Math.PI / 2]) {
        const stripe = MeshBuilder.CreateBox('floor-stripe', { width: 0.08, height: 0.005, depth: 11.5 }, scene);
        stripe.parent = pad;
        stripe.position.y = 0.081;
        stripe.rotation.y = rot;
        stripe.material = mHazardStripe;
    }

    // Shadow helper
    const placeProp = (mesh: any, castShadow = true) => {
        mesh.parent = floor;
        mesh.receiveShadows = true;
        if (castShadow && shadows) {
            shadows.addShadowCaster(mesh, false);
        }
    };

    // Expansive outdoor staging tarmac apron extending to horizon
    const apron = MeshBuilder.CreateGround('hangar-apron', { width: 360, height: 360 }, scene);
    apron.position.y = -2.25;
    apron.material = mDarkMetal;
    apron.receiveShadows = true;

    // ── Full Architectural Hangar Skybox & Enclosure ──────────────────────────
    const hangarW = 54;
    const hangarD = 54;
    const hangarH = 14;

    // Architectural Clerestory Window Glass Material
    const mWindowGlass = new PBRMaterial('mat-window-glass', scene);
    mWindowGlass.albedoColor = Color3.FromHexString('#0f172a');
    mWindowGlass.metallic = 0.92;
    mWindowGlass.roughness = 0.08;
    mWindowGlass.alpha = 0.22; // High-clarity glass revealing sunset sky & mountain silhouettes

    // Industrial Sawtooth Roof with Open Skylight Bays
    const roofOuterL = MeshBuilder.CreateBox('roof-outer-l', { width: 14, height: 0.35, depth: hangarD }, scene);
    roofOuterL.position.set(-20, hangarH, 0);
    roofOuterL.material = mHangarCeiling;

    const roofOuterR = MeshBuilder.CreateBox('roof-outer-r', { width: 14, height: 0.35, depth: hangarD }, scene);
    roofOuterR.position.set(20, hangarH, 0);
    roofOuterR.material = mHangarCeiling;

    // Central skylight glass bay revealing the twilight sky dome and stars
    const skylightCenter = MeshBuilder.CreatePlane('skylight-center', { width: 26, height: hangarD }, scene);
    skylightCenter.position.set(0, hangarH, 0);
    skylightCenter.rotation.x = Math.PI / 2;
    skylightCenter.material = mWindowGlass;

    // Overhead Steel Truss Rafters across ceiling
    for (let rz = -20; rz <= 20; rz += 10) {
        const trussBeam = MeshBuilder.CreateBox(`truss-rafter-${rz}`, { width: hangarW, height: 0.6, depth: 0.35 }, scene);
        trussBeam.position.set(0, hangarH - 0.4, rz);
        trussBeam.material = mDarkMetal;
        placeProp(trussBeam, false);

        // Truss diagonal supports
        for (let tx = -20; tx <= 20; tx += 8) {
            const strut = MeshBuilder.CreateCylinder(`truss-strut-${rz}-${tx}`, { diameter: 0.12, height: 2.2 }, scene);
            strut.position.set(tx, hangarH - 1.2, rz);
            strut.rotation.z = Math.PI / 4;
            strut.material = mDarkMetal;
            placeProp(strut, false);
        }
    }

    // Back Wall: Solid lower industrial wall + upper panoramic clerestory windows
    const backWallLower = MeshBuilder.CreateBox('garage-back-wall-lower', { width: hangarW, height: 6.4, depth: 0.3 }, scene);
    backWallLower.position.set(0, 3.2, -hangarD / 2);
    backWallLower.material = mHangarWall;
    backWallLower.receiveShadows = true;

    // Upper clerestory windows looking directly out at the sunset sky & distant mountains
    const backWindow = MeshBuilder.CreatePlane('garage-back-window', { width: hangarW, height: 7.6 }, scene);
    backWindow.position.set(0, 10.2, -hangarD / 2);
    backWindow.rotation.y = Math.PI;
    backWindow.material = mWindowGlass;

    // Steel window mullions across back wall
    for (let mx = -24; mx <= 24; mx += 6) {
        const mullion = MeshBuilder.CreateBox(`back-mullion-${mx}`, { width: 0.22, height: 7.6, depth: 0.22 }, scene);
        mullion.position.set(mx, 10.2, -hangarD / 2 + 0.1);
        mullion.material = mDarkMetal;
        placeProp(mullion, false);
    }

    // Roll-up industrial security shutter door in center of back wall
    const shutter = MeshBuilder.CreateBox('shutter-door', { width: 15, height: 5.6, depth: 0.15 }, scene);
    shutter.position.set(0, 2.8, -hangarD / 2 + 0.1);
    shutter.material = mShutterDoor;
    placeProp(shutter, false);

    // Hazard warning stripe header across top of shutter door
    for (let i = 0; i < 16; i++) {
        const stripe = MeshBuilder.CreateBox(`shutter-hazard-${i}`, { width: 0.8, height: 0.5, depth: 0.18 }, scene);
        stripe.position.set(-7 + i * 0.95, 5.85, -hangarD / 2 + 0.12);
        stripe.rotation.z = Math.PI / 4;
        stripe.material = i % 2 === 0 ? mHazardStripe : mHazardDark;
        placeProp(stripe, false);
    }

    // Glowing Neon Workshop Sign: OVERDRIVE MOTOR-COMBAT
    const signBoard = MeshBuilder.CreateBox('workshop-signboard', { width: 14, height: 1.4, depth: 0.15 }, scene);
    signBoard.position.set(0, 9.2, -hangarD / 2 + 0.12);
    signBoard.material = mDarkMetal;
    placeProp(signBoard, false);

    const signNeonAmber = MeshBuilder.CreateBox('sign-neon-amber', { width: 13.4, height: 0.08, depth: 0.04 }, scene);
    signNeonAmber.position.set(0, 9.7, -hangarD / 2 + 0.22);
    signNeonAmber.material = mEmissiveAmber;
    placeProp(signNeonAmber, false);

    const signNeonCyan = MeshBuilder.CreateBox('sign-neon-cyan', { width: 13.4, height: 0.08, depth: 0.04 }, scene);
    signNeonCyan.position.set(0, 8.7, -hangarD / 2 + 0.22);
    signNeonCyan.material = mEmissiveCyan;
    placeProp(signNeonCyan, false);

    // Left Wall: Solid lower wall + upper panoramic clerestory windows
    const leftWallLower = MeshBuilder.CreateBox('garage-left-lower', { width: 0.3, height: 6.4, depth: hangarD }, scene);
    leftWallLower.position.set(-hangarW / 2, 3.2, 0);
    leftWallLower.material = mHangarWall;
    leftWallLower.receiveShadows = true;

    const leftWindow = MeshBuilder.CreatePlane('garage-left-window', { width: hangarD, height: 7.6 }, scene);
    leftWindow.position.set(-hangarW / 2, 10.2, 0);
    leftWindow.rotation.y = Math.PI / 2;
    leftWindow.material = mWindowGlass;

    // Right Wall: Solid lower wall + upper panoramic clerestory windows
    const rightWallLower = MeshBuilder.CreateBox('garage-right-lower', { width: 0.3, height: 6.4, depth: hangarD }, scene);
    rightWallLower.position.set(hangarW / 2, 3.2, 0);
    rightWallLower.material = mHangarWall;
    rightWallLower.receiveShadows = true;

    const rightWindow = MeshBuilder.CreatePlane('garage-right-window', { width: hangarD, height: 7.6 }, scene);
    rightWindow.position.set(hangarW / 2, 10.2, 0);
    rightWindow.rotation.y = -Math.PI / 2;
    rightWindow.material = mWindowGlass;

    // Steel window mullions along side walls
    for (let mz = -24; mz <= 24; mz += 8) {
        const mullionL = MeshBuilder.CreateBox(`left-mullion-${mz}`, { width: 0.22, height: 7.6, depth: 0.22 }, scene);
        mullionL.position.set(-hangarW / 2 + 0.1, 10.2, mz);
        mullionL.material = mDarkMetal;
        placeProp(mullionL, false);

        const mullionR = MeshBuilder.CreateBox(`right-mullion-${mz}`, { width: 0.22, height: 7.6, depth: 0.22 }, scene);
        mullionR.position.set(hangarW / 2 - 0.1, 10.2, mz);
        mullionR.material = mDarkMetal;
        placeProp(mullionR, false);
    }

    // Structural I-beams along perimeter walls
    for (const wx of [-18, -9, 0, 9, 18]) {
        const col = MeshBuilder.CreateBox(`wall-col-${wx}`, { width: 0.45, height: hangarH, depth: 0.45 }, scene);
        col.position.set(wx, hangarH / 2, -hangarD / 2 + 0.25);
        col.material = mDarkMetal;
        placeProp(col, false);
    }

    // Horizontal architectural neon runners along walls
    const runnerBack = MeshBuilder.CreateBox('runner-back', { width: hangarW, height: 0.06, depth: 0.04 }, scene);
    runnerBack.position.set(0, 2.8, -hangarD / 2 + 0.05);
    runnerBack.material = mEmissiveAmber;
    placeProp(runnerBack, false);

    const runnerLeft = MeshBuilder.CreateBox('runner-left', { width: 0.04, height: 0.06, depth: hangarD }, scene);
    runnerLeft.position.set(-hangarW / 2 + 0.05, 2.8, 0);
    runnerLeft.material = mEmissiveCyan;
    placeProp(runnerLeft, false);

    const runnerRight = MeshBuilder.CreateBox('runner-right', { width: 0.04, height: 0.06, depth: hangarD }, scene);
    runnerRight.position.set(hangarW / 2 - 0.05, 2.8, 0);
    runnerRight.material = mEmissiveCyan;
    placeProp(runnerRight, false);

    // ── Twin-Post Hydraulic Car Lift (Safety Yellow) ──────────────────────────
    for (const side of [-1, 1]) {
        const posX = side * 5.8;

        // Baseplate with hazard markings
        const base = MeshBuilder.CreateBox(`lift-base-${side}`, { width: 1.2, height: 0.08, depth: 0.9 }, scene);
        base.position.set(posX, 0.04, 0);
        base.material = mDarkMetal;
        placeProp(base);

        // Hazard stripes on baseplate
        for (let h = -2; h <= 2; h++) {
            const hStripe = MeshBuilder.CreateBox(`lift-hstripe-${side}-${h}`, { width: 0.16, height: 0.005, depth: 0.8 }, scene);
            hStripe.position.set(posX + h * 0.2, 0.085, 0);
            hStripe.rotation.y = Math.PI / 4;
            hStripe.material = h % 2 === 0 ? mHazardStripe : mHazardDark;
            placeProp(hStripe, false);
        }

        // Bold Industrial Safety Yellow Lift Column
        const col = MeshBuilder.CreateBox(`lift-col-${side}`, { width: 0.44, height: 5.6, depth: 0.52 }, scene);
        col.position.set(posX, 2.8, 0);
        col.material = mSafetyYellow;
        placeProp(col);

        // Internal Hydraulic Ram (Chrome)
        const ram = MeshBuilder.CreateCylinder(`lift-ram-${side}`, { diameter: 0.15, height: 5.0 }, scene);
        ram.position.set(posX - side * 0.1, 2.6, 0);
        ram.material = mChrome;
        placeProp(ram, false);

        // Swing Arms resting near floor
        for (const armZ of [-1, 1]) {
            const arm = MeshBuilder.CreateBox(`lift-arm-${side}-${armZ}`, { width: 1.8, height: 0.14, depth: 0.18 }, scene);
            arm.position.set(posX - side * 0.9, 0.16, armZ * 1.2);
            arm.rotation.y = side * armZ * 0.45;
            arm.material = mSafetyYellow;
            placeProp(arm);

            // Rubber lift pad
            const padMesh = MeshBuilder.CreateCylinder(`lift-pad-${side}-${armZ}`, { diameter: 0.24, height: 0.06 }, scene);
            padMesh.position.set(posX - side * 1.7, 0.24, armZ * 1.7);
            padMesh.material = mRubber;
            placeProp(padMesh, false);
        }

        // Hydraulic power station unit on right post
        if (side === 1) {
            const powerUnit = MeshBuilder.CreateBox('power-unit', { width: 0.32, height: 0.9, depth: 0.38 }, scene);
            powerUnit.position.set(posX + 0.38, 2.1, 0);
            powerUnit.material = mDarkMetal;
            placeProp(powerUnit);

            const tank = MeshBuilder.CreateCylinder('fluid-tank', { diameter: 0.22, height: 0.55 }, scene);
            tank.position.set(posX + 0.38, 1.4, 0);
            tank.material = mChrome;
            placeProp(tank, false);
        }
    }

    // Overhead Gantry Cross-Beam in Safety Yellow
    const crossBeam = MeshBuilder.CreateBox('lift-crossbeam', { width: 12.0, height: 0.3, depth: 0.38 }, scene);
    crossBeam.position.set(0, 5.5, 0);
    crossBeam.material = mSafetyYellow;
    placeProp(crossBeam);

    // ── Vibrant Snap-On Red Mechanics Tool Stations & Carts ───────────────────
    // Master Tool Station (Left Fore) in Vibrant Red
    const chest1 = MeshBuilder.CreateBox('tool-chest-1', { width: 2.0, height: 1.35, depth: 0.8 }, scene);
    chest1.position.set(-7.4, 0.675, 1.0);
    chest1.rotation.y = 0.35;
    chest1.material = mToolRed;
    placeProp(chest1);

    // Chrome Drawer Handles
    for (let i = 0; i < 6; i++) {
        const drawerY = 0.25 + i * 0.18;
        const handle = MeshBuilder.CreateBox(`chest1-handle-${i}`, { width: 1.4, height: 0.035, depth: 0.05 }, scene);
        handle.parent = chest1;
        handle.position.set(0, drawerY - 0.675, 0.42);
        handle.material = mChrome;
    }

    // Rubber Workmat on top
    const mat1 = MeshBuilder.CreateBox('chest1-mat', { width: 1.94, height: 0.02, depth: 0.76 }, scene);
    mat1.parent = chest1;
    mat1.position.set(0, 0.685, 0);
    mat1.material = mRubber;

    // Diagnostic Tablet with Glowing Cyan Screen
    const diagBase = MeshBuilder.CreateCylinder('diag-base', { diameter: 0.12, height: 0.3 }, scene);
    diagBase.parent = chest1;
    diagBase.position.set(0.65, 0.82, 0.15);
    diagBase.material = mChrome;

    const diagScreen = MeshBuilder.CreateBox('diag-screen', { width: 0.45, height: 0.3, depth: 0.03 }, scene);
    diagScreen.parent = diagBase;
    diagScreen.position.set(0, 0.22, 0);
    diagScreen.rotation.x = -0.4;
    diagScreen.material = mDarkMetal;

    const diagGlow = MeshBuilder.CreatePlane('diag-glow', { width: 0.41, height: 0.26 }, scene);
    diagGlow.parent = diagScreen;
    diagGlow.position.set(0, 0, 0.018);
    diagGlow.material = mEmissiveCyan;

    // Secondary Rollaway Tool Cart (Right Aft) in Vibrant Red
    const cart2 = MeshBuilder.CreateBox('tool-cart-2', { width: 1.2, height: 1.05, depth: 0.65 }, scene);
    cart2.position.set(7.2, 0.525, -2.5);
    cart2.rotation.y = -0.4;
    cart2.material = mToolRed;
    placeProp(cart2);

    for (let i = 0; i < 4; i++) {
        const handle = MeshBuilder.CreateBox(`cart2-handle-${i}`, { width: 0.85, height: 0.03, depth: 0.04 }, scene);
        handle.parent = cart2;
        handle.position.set(0, 0.3 - i * 0.2, 0.34);
        handle.material = mChrome;
    }

    // Rolling Hydraulic Shop Floor Jack (Red)
    const jackBody = MeshBuilder.CreateBox('shop-jack-body', { width: 0.4, height: 0.18, depth: 1.1 }, scene);
    jackBody.position.set(-4.8, 0.1, 3.2);
    jackBody.rotation.y = -0.6;
    jackBody.material = mToolRed;
    placeProp(jackBody);

    const jackHandle = MeshBuilder.CreateCylinder('shop-jack-handle', { diameter: 0.04, height: 1.2 }, scene);
    jackHandle.parent = jackBody;
    jackHandle.position.set(0, 0.55, -0.45);
    jackHandle.rotation.x = -0.5;
    jackHandle.material = mChrome;

    // ── High-Octane Racing Fuel & Nitrous Oxide Drums ──────────────────────────
    // 2 Electric Blue Nitro Drums on containment pallet
    const nitroPositions = [
        { x: 6.8, z: -6.5 },
        { x: 7.7, z: -6.0 },
    ];
    nitroPositions.forEach((pos, idx) => {
        const drum = MeshBuilder.CreateCylinder(`nitro-drum-${idx}`, { diameter: 0.72, height: 1.1, tessellation: 32 }, scene);
        drum.position.set(pos.x, 0.55, pos.z);
        drum.material = mNitroBlue;
        placeProp(drum);

        // White racing stripe & chrome bung cap
        const stripe = MeshBuilder.CreateCylinder(`nitro-stripe-${idx}`, { diameter: 0.724, height: 0.14, tessellation: 32 }, scene);
        stripe.parent = drum;
        stripe.position.y = 0.36;
        stripe.material = mEmissiveWhite;

        const cap = MeshBuilder.CreateCylinder(`nitro-cap-${idx}`, { diameter: 0.09, height: 0.04 }, scene);
        cap.parent = drum;
        cap.position.set(0.2, 0.56, 0);
        cap.material = mChrome;
    });

    // 2 Fiery Orange High-Octane Fuel Drums
    const fuelPositions = [
        { x: 6.2, z: -5.4 },
        { x: 7.2, z: -4.8 },
    ];
    fuelPositions.forEach((pos, idx) => {
        const drum = MeshBuilder.CreateCylinder(`fuel-drum-${idx}`, { diameter: 0.72, height: 1.1, tessellation: 32 }, scene);
        drum.position.set(pos.x, 0.55, pos.z);
        drum.material = mFuelOrange;
        placeProp(drum);

        const stripe = MeshBuilder.CreateCylinder(`fuel-stripe-${idx}`, { diameter: 0.724, height: 0.14, tessellation: 32 }, scene);
        stripe.parent = drum;
        stripe.position.y = 0.36;
        stripe.material = mDarkMetal;

        const cap = MeshBuilder.CreateCylinder(`fuel-cap-${idx}`, { diameter: 0.09, height: 0.04 }, scene);
        cap.parent = drum;
        cap.position.set(0.2, 0.56, 0);
        cap.material = mChrome;
    });

    // ── Military Olive Tactical Weapon & Ammo Crates ──────────────────────────
    // Heavy tactical ordnance crate (Right Fore)
    const crate1 = MeshBuilder.CreateBox('weapon-crate-1', { width: 1.6, height: 0.7, depth: 0.9 }, scene);
    crate1.position.set(5.5, 0.35, 2.5);
    crate1.rotation.y = -0.45;
    crate1.material = mOliveCrate;
    placeProp(crate1);

    // Hazard yellow clasps & corner reinforcements
    for (const cx of [-0.78, 0.78]) {
        for (const cz of [-0.42, 0.42]) {
            const rib = MeshBuilder.CreateBox(`crate-rib-${cx}-${cz}`, { width: 0.09, height: 0.72, depth: 0.09 }, scene);
            rib.parent = crate1;
            rib.position.set(cx, 0, cz);
            rib.material = mDarkMetal;
        }
    }
    for (const lx of [-0.45, 0.45]) {
        const latch = MeshBuilder.CreateBox(`crate-latch-${lx}`, { width: 0.09, height: 0.12, depth: 0.04 }, scene);
        latch.parent = crate1;
        latch.position.set(lx, 0.16, 0.47);
        latch.material = mHazardStripe;
    }

    // Stacked small ammo case in olive
    const ammoBox = MeshBuilder.CreateBox('ammo-box-small', { width: 0.75, height: 0.38, depth: 0.5 }, scene);
    ammoBox.position.set(5.4, 0.89, 2.4);
    ammoBox.rotation.y = -0.3;
    ammoBox.material = mOliveCrate;
    placeProp(ammoBox);

    // Long ordnance missile transit locker in olive (Back Left)
    const longCrate = MeshBuilder.CreateBox('long-ordnance-case', { width: 2.4, height: 0.48, depth: 0.65 }, scene);
    longCrate.position.set(-4.6, 0.24, -7.5);
    longCrate.rotation.y = -0.12;
    longCrate.material = mOliveCrate;
    placeProp(longCrate);

    // ── Industrial Safety Bollards (Yellow / Black Hazard) ─────────────────────
    const bollardPositions = [
        { x: -5.0, z: 5.8 },
        { x: 5.0, z: 5.8 },
        { x: -7.0, z: -4.5 },
        { x: 7.0, z: -0.5 },
    ];
    bollardPositions.forEach((pos, idx) => {
        const bollard = MeshBuilder.CreateCylinder(`bollard-${idx}`, { diameter: 0.22, height: 1.1 }, scene);
        bollard.position.set(pos.x, 0.55, pos.z);
        bollard.material = mSafetyYellow;
        placeProp(bollard);

        // Black warning ring on bollard top
        const ring = MeshBuilder.CreateCylinder(`bollard-ring-${idx}`, { diameter: 0.23, height: 0.12 }, scene);
        ring.parent = bollard;
        ring.position.y = 0.38;
        ring.material = mHazardDark;
    });

    // ── Multi-Tier Tire Storage Rack & Combat Tires ───────────────────────────
    const rackX = -7.0;
    const rackZ = -6.8;

    for (const dx of [-1.5, 1.5]) {
        for (const dz of [-0.4, 0.4]) {
            const post = MeshBuilder.CreateCylinder(`tire-post-${dx}-${dz}`, { diameter: 0.07, height: 2.3 }, scene);
            post.position.set(rackX + dx, 1.15, rackZ + dz);
            post.material = mDarkMetal;
            placeProp(post, false);
        }
    }

    for (const shelfY of [0.4, 1.45]) {
        for (const dz of [-0.32, 0.32]) {
            const rail = MeshBuilder.CreateBox(`tire-rail-${shelfY}-${dz}`, { width: 3.2, height: 0.05, depth: 0.05 }, scene);
            rail.position.set(rackX, shelfY, rackZ + dz);
            rail.material = mSafetyYellow;
            placeProp(rail, false);
        }

        for (let t = 0; t < 4; t++) {
            const tireX = rackX - 1.15 + t * 0.76;
            const tire = MeshBuilder.CreateTorus(`rack-tire-${shelfY}-${t}`, { diameter: 0.74, thickness: 0.28, tessellation: 36 }, scene);
            tire.position.set(tireX, shelfY + 0.37, rackZ);
            tire.rotation.x = Math.PI / 2;
            tire.material = mRubber;
            placeProp(tire);

            const rim = MeshBuilder.CreateCylinder(`rack-rim-${shelfY}-${t}`, { diameter: 0.45, height: 0.24, tessellation: 24 }, scene);
            rim.position.set(tireX, shelfY + 0.37, rackZ);
            rim.rotation.x = Math.PI / 2;
            rim.material = mChrome;
            placeProp(rim, false);
        }
    }

    // Floor tire stack (2 racing slicks)
    for (let s = 0; s < 2; s++) {
        const stackTire = MeshBuilder.CreateTorus(`floor-tire-${s}`, { diameter: 0.76, thickness: 0.3, tessellation: 36 }, scene);
        stackTire.position.set(-5.3, 0.15 + s * 0.3, -3.8);
        stackTire.material = mRubber;
        placeProp(stackTire);

        const stackRim = MeshBuilder.CreateCylinder(`floor-rim-${s}`, { diameter: 0.46, height: 0.26, tessellation: 24 }, scene);
        stackRim.position.set(-5.3, 0.15 + s * 0.3, -3.8);
        stackRim.material = mChrome;
        placeProp(stackRim, false);
    }

    // ── Overhead LED Lighting Truss Rig ───────────────────────────────────────
    const trussY = 7.0;

    for (const gx of [-4.5, 4.5]) {
        const tube = MeshBuilder.CreateBox(`truss-side-${gx}`, { width: 0.16, height: 0.16, depth: 10.0 }, scene);
        tube.position.set(gx, trussY, 0);
        tube.material = mDarkMetal;
        placeProp(tube, false);
    }
    for (const gz of [-5.0, 5.0]) {
        const tube = MeshBuilder.CreateBox(`truss-cross-${gz}`, { width: 9.0, height: 0.16, depth: 0.16 }, scene);
        tube.position.set(0, trussY, gz);
        tube.material = mDarkMetal;
        placeProp(tube, false);
    }

    // 4 Longitudinal Linear Studio LED Fixtures
    const ledXOffsets = [-2.8, -1.2, 1.2, 2.8];
    ledXOffsets.forEach((lx, idx) => {
        const housing = MeshBuilder.CreateBox(`led-housing-${idx}`, { width: 0.24, height: 0.1, depth: 6.4 }, scene);
        housing.position.set(lx, trussY - 0.05, 0);
        housing.material = mDarkMetal;
        placeProp(housing, false);

        const emitter = MeshBuilder.CreateBox(`led-emitter-${idx}`, { width: 0.18, height: 0.03, depth: 6.2 }, scene);
        emitter.position.set(lx, trussY - 0.1, 0);
        emitter.material = mEmissiveWhite;
        placeProp(emitter, false);
    });

    // Angled Spot Fixtures aimed down at the vehicle turntable
    for (const sx of [-2.6, 2.6]) {
        const spotHousing = MeshBuilder.CreateCylinder(`spot-housing-${sx}`, { diameter: 0.36, height: 0.42 }, scene);
        spotHousing.position.set(sx, trussY - 0.2, 4.8);
        spotHousing.rotation.x = -Math.PI / 4;
        spotHousing.material = mDarkMetal;
        placeProp(spotHousing, false);

        const spotLens = MeshBuilder.CreateCylinder(`spot-lens-${sx}`, { diameter: 0.32, height: 0.04 }, scene);
        spotLens.position.set(sx, trussY - 0.32, 4.7);
        spotLens.rotation.x = -Math.PI / 4;
        spotLens.material = mEmissiveWhite;
        placeProp(spotLens, false);
    }
}
