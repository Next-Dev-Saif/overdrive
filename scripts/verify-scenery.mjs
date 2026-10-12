/** Real terrain geometry and scatter checks; no browser or remote heightmap needed. */
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import HavokPhysics from '@babylonjs/havok';
import { NullEngine, Scene, MeshBuilder, StandardMaterial, Vector3, VertexBuffer, HavokPlugin, Ray } from '@babylonjs/core';
const out = resolve('node_modules/.cache/overdrive-scenery-check');
await mkdir(out, { recursive: true });
for (const [name, folder] of [['LandscapeTerrain', 'levels'], ['OuterLandscape', 'levels'], ['SceneryPlacement', 'levels'], ['ArenaCentralCover', 'levels'], ['ProjectileCollision', 'weapons'], ['ArenaRoadLayout', 'levels'], ['ArenaRoads', 'levels'], ['ArenaScenery', 'levels'], ['ArenaTerrain', 'levels'], ['GraphicsSettingsManager', 'settings']]) {
    const source = await readFile(`src/game/${folder}/${name}.ts`, 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
        .replace('../settings/GraphicsSettingsManager', './GraphicsSettingsManager').replace(/from '(\.\/[^']+)'/g, "from '$1.js'");
    await writeFile(`${out}/${name}.js`, code);
}
const load = name => import(pathToFileURL(`${out}/${name}.js`));
const { isProjectileCollisionCandidate } = await load('ProjectileCollision');
const { createSceneryHeightSampler } = await load('SceneryPlacement');
const { createArenaRoadLayout, isOnArenaRoad } = await load('ArenaRoadLayout');
const { createArenaRoadPixels } = await load('ArenaRoads');
const { dressArena } = await load('ArenaScenery');
const { addRaisedTerrain } = await load('ArenaTerrain');
const { GraphicsSettingsManager } = await load('GraphicsSettingsManager');
GraphicsSettingsManager.getInstance().getQuality = () => 'LOW';
GraphicsSettingsManager.getInstance().getConfig = () => ({ shadowResolution: 0, particleLimitMultiplier: 0 });
const havok = await HavokPhysics({ wasmBinary: await readFile('node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm') });
const engine = new NullEngine();
let instances = 0;
for (const theme of ['wasteland', 'facility', 'glacial', 'neon']) {
    const size = theme === 'facility' ? 500 : 600;
    const scene = new Scene(engine);
    scene.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, havok));
    const ground = MeshBuilder.CreateGround('heightmap-fixture', { width: size, height: size, subdivisions: 40, updatable: true }, scene);
    const vertices = ground.getVerticesData(VertexBuffer.PositionKind);
    for (let i = 0; i < vertices.length; i += 3) vertices[i + 1] = 4 + 5 * Math.sin(vertices[i] / 50) * Math.cos(vertices[i + 2] / 65);
    ground.updateVerticesData(VertexBuffer.PositionKind, vertices, true);
    ground.updateCoordinateHeights();
    ground.metadata = { terrain: true };
    const rises = addRaisedTerrain(scene, new StandardMaterial('terrain', scene), size);
    const heightAt = createSceneryHeightSampler(scene);
    assert.equal(heightAt(400, 0), null, 'outside terrain has no fabricated surface');
    for (let x = -90; x <= 90; x += 10) for (let z = -90; z <= 90; z += 10) {
        const hit = new Ray(new Vector3(x, 80, z), Vector3.Down(), 120).intersectsMeshes([ground, ...rises])[0];
        assert.ok(Math.abs(heightAt(x, z) - hit.pickedPoint.y) < 1e-4, `sampler at ${x},${z}: ${heightAt(x,z)} versus ray ${hit.pickedPoint.y}`);
    }
    dressArena(scene, theme, size);
    const horizon = scene.meshes.filter(mesh => mesh.metadata?.outerLandscape);
    assert.ok(horizon.length >= 4 && horizon.length <= 8, 'bounded horizon draw calls');
    for (const mesh of horizon) {
        assert.ok(!mesh.isPickable && !mesh.physicsBody && !mesh.metadata.terrain, 'outer scenery never becomes gameplay terrain');
        assert.equal(isProjectileCollisionCandidate(mesh, ground, rises[0]), false, 'projectiles ignore the horizon');
        assert.ok(mesh.material.fogEnabled === false, 'dense arena fog cannot erase the entire skyline');
        assert.ok(Array.from(mesh.getVerticesData('position')).every(Number.isFinite));
    }
    const ridges = horizon.filter(mesh => mesh.name === 'horizon-geography');
    for (const ridge of ridges) {
        const vertices = ridge.getVerticesData('position');
        for (let i = 0; i < vertices.length; i += 3) assert.ok(Math.hypot(vertices[i], vertices[i + 2]) > size / 2 + 10, 'ridge stays beyond the collision wall');
    }
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 32) {
        const r = size / 2 + 180;
        const ray = new Ray(new Vector3(Math.cos(angle) * r, 600, Math.sin(angle) * r), Vector3.Down(), 1000);
        assert.ok(ray.intersectsMeshes(ridges).length > 0, 'continuous outer ground in every direction');
    }
    const layout = createArenaRoadLayout(size);
    const covers = scene.meshes.filter(mesh => mesh.metadata?.centralCover);
    assert.equal(covers.length, 4, 'only four central cover obstacles per arena');
    for (const cover of covers) {
        cover.computeWorldMatrix(true);
        const bounds = cover.getBoundingInfo().boundingBox;
        assert.ok(cover.physicsBody && cover.isPickable, 'cover blocks vehicles and targeting rays');
        assert.ok(bounds.minimumWorld.y <= cover.metadata.terrainLow, 'foundation is embedded rather than floating');
        assert.ok(bounds.maximumWorld.y >= cover.metadata.terrainHigh + 6.9, 'cover conceals a vehicle above the highest nearby ground');
        for(let x=bounds.minimumWorld.x;x<=bounds.maximumWorld.x;x+=1)for(let z=bounds.minimumWorld.z;z<=bounds.maximumWorld.z;z+=1) {
            assert.equal(isOnArenaRoad(layout,x,z,5),false,'central cover leaves pavement and escape clearance open');
            for(const spawnZ of [-100,100])assert.ok(Math.abs(z-spawnZ)>40,'cover never blocks the team spawn lanes');
        }
        const midpoint = cover.position.clone(); midpoint.y = cover.metadata.terrainHigh + 3;
        const front = new Vector3(Math.sin(cover.rotation.y),0,Math.cos(cover.rotation.y));
        const ray = new Ray(midpoint.subtract(front.scale(25)),front,50);
        assert.ok(ray.intersectsMesh(cover).hit,'cover interrupts vehicle-height lines of sight');
        assert.ok(isProjectileCollisionCandidate(cover,ground,rises[0]),'projectiles collide with cover');
        const physicsHit=scene.getPhysicsEngine().raycast(midpoint.subtract(front.scale(25)),midpoint.add(front.scale(25)));
        assert.ok(physicsHit.hasHit,'Havok also sees the solid cover');
        assert.equal(physicsHit.body,cover.physicsBody,'physics ray hits this cover rather than another obstacle');
        assert.ok(covers.some(other=>Math.abs(other.position.x+cover.position.x)<.001&&Math.abs(other.position.z+cover.position.z)<.001),'opposite teams get symmetric cover');
    }
    const roads = scene.meshes.filter(mesh => mesh.metadata?.arenaRoad);
    assert.equal(roads.length, 4, 'four terrain overlays rather than hundreds of road strips');
    assert.equal(scene.meshes.filter(mesh => mesh.name === 'route-marker').length, 0, 'old disconnected markings removed');
    for (const road of roads) {
        const source = scene.getMeshByUniqueId(road.metadata.sourceTerrain);
        const original = source.getVerticesData(VertexBuffer.PositionKind), positions = road.getVerticesData(VertexBuffer.PositionKind);
        const uvs = road.getVerticesData(VertexBuffer.UVKind);
        assert.equal(positions.length, original.length, 'roads retain exact terrain topology');
        assert.deepEqual(road.getIndices(), source.getIndices());
        for (let i = 0; i < original.length; i += 3) {
            const point = Vector3.TransformCoordinates(Vector3.FromArray(original, i), source.computeWorldMatrix(true));
            assert.ok(Math.abs(positions[i + 1] - point.y - .025) < 1e-4, `${theme}: road follows existing terrain vertices`);
            assert.ok(Math.abs(uvs[i / 3 * 2] - (point.x / size + .5)) < 1e-6, 'world texture alignment across terrain meshes');
        }
        assert.equal(road.isPickable, false, 'transparent areas cannot block combat rays');
        assert.equal(isProjectileCollisionCandidate(road, ground, rises[0]), false, 'projectiles ignore visual road overlays');
        assert.equal(road.physicsBody, undefined, 'roads do not introduce collision seams');
        assert.equal(road.metadata.terrain, undefined, 'spawn/recovery continue using real terrain');
        assert.ok(road.material.diffuseTexture.hasAlpha && road.material.detailMap.isEnabled);
    }
    // All starts, the central crossing, entire flanking loop and outer links form connected roads.
    for (const z of [-100, 100]) for (const x of [-36, -18, 0, 18, 36]) assert.ok(isOnArenaRoad(layout, x, z), 'each team spawn sits on an access lane');
    for (let i = 0; i < 360; i++) {
        const angle = i * Math.PI / 180;
        assert.ok(isOnArenaRoad(layout, Math.cos(angle) * layout.radius, Math.sin(angle) * layout.radius));
    }
    for (const segment of layout.segments) for (let t = 0; t <= 1; t += .05) assert.ok(isOnArenaRoad(layout, segment.ax + (segment.bx-segment.ax)*t, segment.az+(segment.bz-segment.az)*t));
    assert.equal(isProjectileCollisionCandidate(ground, rises[0], rises[1]), true, 'real terrain still blocks projectiles');
    // Roads avoid the authored collision cover rings in MapLoader, including their oriented corners.
    for (const ring of [{ radius: size * .3, count: 6, width: 25 }, { radius: size * .425, count: 12, width: 40 }]) {
        for (let index = 0; index < ring.count; index++) {
            const angle = index / ring.count * Math.PI * 2;
            for (let tangent = -ring.width / 2; tangent <= ring.width / 2; tangent += 2) for (const radial of [-4, 0, 4]) {
                const x = Math.cos(angle) * (ring.radius + radial) - Math.sin(angle) * tangent;
                const z = Math.sin(angle) * (ring.radius + radial) + Math.cos(angle) * tangent;
                assert.equal(isOnArenaRoad(layout, x, z), false, `${theme}: roads clear existing cover footprints`);
            }
        }
    }
    // Actual atlas coverage and contrast: open terrain is transparent; pavement and paint remain visible.
    const resolution = 512, pixels = createArenaRoadPixels(layout, theme, resolution);
    const alphaAt = (x,z) => pixels[((Math.floor((z/size+.5)*resolution)*resolution)+Math.floor((x/size+.5)*resolution))*4+3];
    assert.equal(alphaAt(0,0),255);assert.equal(alphaAt(36,100),255);assert.equal(alphaAt(size*.48,size*.48),0);
    const colors = new Set();for(let i=0;i<pixels.length;i+=4)if(pixels[i+3])colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);
    assert.ok(colors.size>100, 'road atlas includes asphalt grain, wear, shoulders and paint');
    for (const mesh of scene.meshes.filter(mesh => mesh.name.startsWith('clutter-'))) {
        for (const matrix of mesh.thinInstanceGetWorldMatrices()) {
            const { x, y, z } = matrix.getTranslation();
            assert.ok(Math.hypot(x, z) <= size * .46 + .001, `${theme}: clutter stays inside arena`);
            assert.equal(isOnArenaRoad(layout, x, z, 2.5), false, `${theme}: clutter stays clear of pavement and shoulders`);
            const height = heightAt(x, z);
            assert.notEqual(height, null);
            assert.ok(Math.abs(y - height) < 0.3, `${theme}/${mesh.name}: clutter grounded rather than placed at zero`);
            instances++;
        }
    }
    scene.dispose();
    assert.equal(scene.meshes.length, 0); assert.equal(scene.textures.length, 0);
}
engine.dispose();
console.log(`PASS: four terrain themes, 16 solid central cover islands, connected textured roads at both arena sizes, ${instances} grounded clutter instances and raised-surface sampling.`);
