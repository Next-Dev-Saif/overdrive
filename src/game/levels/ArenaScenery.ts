import { buildOuterLandscape } from './OuterLandscape';
import { buildCentralCover } from './ArenaCentralCover';
import { buildArenaRoads } from './ArenaRoads';
import { sampleRoadsidePoint } from './ArenaRoadLayout';
import { createSceneryHeightSampler } from './SceneryPlacement';
import { Color3, Color4, DirectionalLight, Matrix, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsShapeType, Quaternion, RawTexture, Scene, ShadowGenerator, StandardMaterial, Vector3 } from '@babylonjs/core';
import { GraphicsSettingsManager } from '../settings/GraphicsSettingsManager';

/** Arena-specific landmarks and atmosphere, kept outside the central spawn/driving lanes. */
export function dressArena(scene: Scene, theme: string, size: number) {
    buildOuterLandscape(scene, theme, size / 2);
    const icy = theme === 'glacial', desert = theme === 'wasteland', city = theme === 'neon';
    const heightAt = createSceneryHeightSampler(scene);
    const roads = buildArenaRoads(scene, theme, size);
    let foundationHeight = 0;
    const quality = GraphicsSettingsManager.getInstance().getConfig();
    const material = (name: string, color: string, glow = false) => {
        const m = new StandardMaterial(name, scene); m.diffuseColor = Color3.FromHexString(color); m.specularColor.setAll(icy ? 0.3 : 0.08);
        if (glow) m.emissiveColor = m.diffuseColor.scale(0.8);
        return m;
    };
    const stone = material('scenery-stone', icy ? '#a2c3d3' : desert ? '#89705a' : '#3c464d');
    const metal = material('scenery-metal', desert ? '#705347' : '#45535f');
    const trim = material('scenery-trim', '#232e37');
    const lightMat = material('scenery-lamps', city ? '#59b6c4' : '#e5b96d', true);
    const snow = material('snow-caps', '#dce7e9');
    const solids: Mesh[] = buildCentralCover(scene, theme, size, heightAt, { stone, metal, trim, snow });
    const box = (name: string, x: number, y: number, z: number, w: number, h: number, d: number, mat: StandardMaterial, collide = false) => {
        const mesh = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
        mesh.position.set(x, y + foundationHeight, z); mesh.material = mat; mesh.receiveShadows = true;
        if (collide) new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0, friction: 0.6 }, scene);
        solids.push(mesh); return mesh;
    };
    for (let i = 0; i < 12; i++) {
        const a = (i + 0.35) * Math.PI / 6, r = size * (city ? 0.55 : 0.38);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        foundationHeight = heightAt(x, z) ?? 0;
        if (desert || icy) {
            const rock = MeshBuilder.CreateIcoSphere(`outcrop-${i}`, { radius: 1, subdivisions: 1, flat: true }, scene);
            const h = icy ? 12 + i % 4 * 6 : 5 + i % 3 * 4;
            rock.scaling.set(7 + i % 3 * 2, h, 6 + i % 4); rock.position.set(x, foundationHeight + h * 0.65, z); rock.rotation.y = a; rock.material = stone;
            rock.receiveShadows = true; solids.push(rock);
            new PhysicsAggregate(rock, PhysicsShapeType.CONVEX_HULL, { mass: 0, friction: 0.7 }, scene);
            if (icy) box('snow-drift', x + 5, 0.3, z - 3, 14, 0.6, 10, snow);
        } else if (city) {
            const height = 30 + (i * 17) % 65;
            box('city-tower', x, height / 2, z, 26, height, 24, trim);
            for (let row = 0; row < 5; row++) box('window-band', x, 8 + row * (height - 10) / 5, z - 12.1, 21, 0.8, 0.15, lightMat);
            box('roof-sign', x, height + 3, z, 18, 5, 1, metal);
        } else {
            const tank = MeshBuilder.CreateCylinder('storage-tank', { diameter: 14, height: 24, tessellation: 24 }, scene);
            tank.position.set(x, foundationHeight + 12, z); tank.material = metal; solids.push(tank);
            new PhysicsAggregate(tank, PhysicsShapeType.CYLINDER, { mass: 0 }, scene);
            for (const y of [3, 20]) { const band = MeshBuilder.CreateTorus('tank-band', { diameter: 14.1, thickness: .45, tessellation: 24 }, scene); band.position.set(x, foundationHeight + y, z); band.material = trim; }
            box('service-ladder', x + 7.1, 12, z, .3, 24, 1.5, trim);
        }
    }
    // Service bunkers/containers break up the outer combat ring without blocking the spawn area.
    for (const side of [-1, 1]) {
        const x = side * size * .3, z = side * 45;
        foundationHeight = heightAt(x, z) ?? 0;
        box('service-bunker', x, 5, z, 24, 10, 14, metal, true);
        box('bunker-roof', x, 10.4, z, 26, .8, 16, icy ? snow : trim);
        box('roller-door', x, 3.5, z - 7.05, 10, 7, .15, trim);
        box('door-light', x, 8, z - 7.2, 10, .3, .3, lightMat);
        for (let i = 0; i < 6; i++) box('door-rib', x, 1 + i, z - 7.18, 9, .08, .12, metal);
        const pipe = MeshBuilder.CreateCylinder('service-pipe', { diameter: 1.8, height: 50, tessellation: 12 }, scene);
        pipe.rotation.z = Math.PI / 2; pipe.position.set(x, foundationHeight + 13, z + 4); pipe.material = trim; solids.push(pipe);
        for (const offset of [-20, 20]) box('pipe-support', x + offset, 6.5, z + 4, .8, 13, .8, metal, true);
    }
    // Map Clutter via Thin Instances (Performance optimized)
    const numStones = icy ? 3000 : desert ? 2500 : 1500;
    const numGrass = desert ? 3500 : 0;
    const numGarbage = city ? 3000 : 1000;

    const populateInstances = (mesh: Mesh, count: number, scaleMin: number, scaleMax: number, yOffset: number) => {
        const matrices = new Float32Array(count * 16);
        for (let i = 0; i < count; i++) {
            const { x, z } = sampleRoadsidePoint(roads);
            const s = scaleMin + Math.random() * (scaleMax - scaleMin);
            const scale = new Vector3(s * (0.7 + Math.random() * 0.6), s * (0.7 + Math.random() * 0.6), s * (0.7 + Math.random() * 0.6));
            const rot = Quaternion.RotationYawPitchRoll(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8);
            Matrix.Compose(scale, rot, new Vector3(x, (heightAt(x, z) ?? 0) + yOffset * s, z)).copyToArray(matrices, i * 16);
        }
        mesh.thinInstanceSetBuffer('matrix', matrices, 16, false);
        mesh.receiveShadows = true;
    };

    if (numStones > 0) {
        const stoneMesh = MeshBuilder.CreateIcoSphere('clutter-stone', { radius: 1, subdivisions: 0, flat: true }, scene);
        stoneMesh.material = material('clutter-stone-mat', icy ? '#8eaebf' : city ? '#364048' : '#7d6148');
        populateInstances(stoneMesh, numStones, 0.05, 0.35, -0.4);
    }
    if (numGrass > 0) {
        // Low-poly triangular spikes for dead scrub grass
        const grassMesh = MeshBuilder.CreateCylinder('clutter-grass', { diameterTop: 0, diameterBottom: 0.3, height: 1, tessellation: 3 }, scene);
        grassMesh.material = material('clutter-grass-mat', '#68593a');
        const matrices = new Float32Array(numGrass * 16);
        for (let i = 0; i < numGrass; i++) {
            const { x, z } = sampleRoadsidePoint(roads);
            const s = 0.2 + Math.random() * 0.4;
            const rot = Quaternion.RotationYawPitchRoll(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3);
            Matrix.Compose(new Vector3(s * 0.6, s, s * 0.6), rot, new Vector3(x, (heightAt(x, z) ?? 0) + s * 0.3, z)).copyToArray(matrices, i * 16);
        }
        grassMesh.thinInstanceSetBuffer('matrix', matrices, 16, false);
        grassMesh.receiveShadows = true;
    }
    if (numGarbage > 0) {
        const garbMesh = MeshBuilder.CreateBox('clutter-garbage', { size: 1 }, scene);
        garbMesh.material = material('clutter-garbage-mat', icy ? '#3d4750' : city ? '#232e37' : '#5a4238');
        populateInstances(garbMesh, numGarbage, 0.1, 0.4, -0.2);
        
        if (city) {
            const shardMesh = MeshBuilder.CreateIcoSphere('clutter-shard', { radius: 1, subdivisions: 0, flat: true }, scene);
            shardMesh.material = material('clutter-shard-mat', '#44e6ff', true); // Glowing cyan glass/neon
            populateInstances(shardMesh, 800, 0.05, 0.15, -0.6);
        }
    }

    const sun = new DirectionalLight('arena-key', new Vector3(-0.6, -1, .35), scene);
    sun.position.set(100, 180, -100); sun.diffuse = Color3.FromHexString(icy ? '#b9d8ff' : city ? '#a6bedc' : '#ffdbab');
    sun.intensity = city ? .8 : 1.5; sun.renderPriority = 10;
    if (quality.shadowResolution > 0) {
        const shadows = new ShadowGenerator(Math.min(1024, quality.shadowResolution), sun);
        shadows.usePoissonSampling = true; shadows.bias = .001; shadows.normalBias = .03;
        solids.forEach(mesh => shadows.addShadowCaster(mesh));
        // Completed vehicles register explicitly; VFX must not inflate the shadow render list.
    }
    if (quality.particleLimitMultiplier > 0) {
        // Local radial sprite avoids adding another remote texture dependency.
        const pixels = new Uint8Array(32 * 32 * 4);
        for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
            const at = (y * 32 + x) * 4, alpha = Math.max(0, 1 - Math.hypot(x - 15.5, y - 15.5) / 15.5);
            pixels.set([255, 255, 255, Math.round(alpha * alpha * 180)], at);
        }
        const sprite = RawTexture.CreateRGBATexture(pixels, 32, 32, scene, false, false);
        const steam = new ParticleSystem('service-vent-atmosphere', 160, scene);
        steam.particleTexture = sprite; steam.emitter = new Vector3(size * .3, (heightAt(size * .3, 45) ?? 0) + 13, 49);
        steam.minEmitBox = new Vector3(-1, 0, -1); steam.maxEmitBox = new Vector3(1, 0, 1);
        steam.direction1 = new Vector3(-1, 2, 0); steam.direction2 = new Vector3(1, 4, 1);
        steam.color1 = new Color4(.65, .72, .76, .2); steam.color2 = new Color4(.8, .83, .85, .12); steam.colorDead = new Color4(.5, .6, .7, 0);
        steam.minSize = 1; steam.maxSize = 4; steam.minLifeTime = 2; steam.maxLifeTime = 5;
        steam.emitRate = 20 * quality.particleLimitMultiplier; steam.blendMode = ParticleSystem.BLENDMODE_STANDARD; steam.start();
    }
}
