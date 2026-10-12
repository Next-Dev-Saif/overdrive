/** Headless behavior/workload checks; deliberately does not launch a browser. */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { NullEngine, Scene, Mesh, MeshBuilder, FreeCamera, Vector3, Quaternion, DirectionalLight, ShadowGenerator } from '@babylonjs/core';

const out = resolve('node_modules/.cache/overdrive-battle-check');
const compiled = new Set();
async function compile(file) {
    if (compiled.has(file)) return;
    compiled.add(file);
    const source = await readFile(file, 'utf8');
    let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
    const dependencies = [...code.matchAll(/from ["'](\.[^"']+)["']/g)].map(match => match[1]);
    for (const dependency of dependencies) await compile(resolve(dirname(file), `${dependency}.ts`));
    code = code.replace(/from (["'])(\.[^"']+)\1/g, 'from $1$2.js$1');
    const target = resolve(out, file.replace(`${process.cwd()}/`, '').replace(/\.ts$/, '.js'));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, code);
}
for (const file of ['src/game/match/PostMatchTimeline.ts', 'src/game/engine/VehicleShadows.ts', 'src/game/match/MvpShowcase.ts', 'src/game/weapons/WeaponController.ts', 'src/game/levels/ArenaTerrain.ts']) await compile(resolve(file));
const load = file => import(pathToFileURL(resolve(out, file)));
const { MvpShowcase } = await load('src/game/match/MvpShowcase.js');
const { WeaponController } = await load('src/game/weapons/WeaponController.js');
const { groundHeight } = await load('src/game/levels/ArenaTerrain.js');
{
    const { getPostMatchFrame } = await load('src/game/match/PostMatchTimeline.js');
    assert.equal(getPostMatchFrame(3999, true).phase, 'outcome');
    assert.equal(getPostMatchFrame(4000, true).phase, 'mvp');
    assert.equal(getPostMatchFrame(10999, true).phase, 'mvp');
    assert.deepEqual(getPostMatchFrame(11000, true), { phase: 'leaderboard', countdown: 10, complete: false });
    assert.equal(getPostMatchFrame(20000, true).countdown, 1);
    assert.equal(getPostMatchFrame(21000, true).complete, true);
    assert.equal(getPostMatchFrame(4000, false).phase, 'leaderboard');
    assert.equal(getPostMatchFrame(14000, false).complete, true);
    assert.equal(getPostMatchFrame(60000, true).countdown, 0, 'backgrounded tab cannot extend the countdown');
}
const engine = new NullEngine({ renderWidth: 1280, renderHeight: 720 });
{
    const scene = new Scene(engine);
    const oldCamera = new FreeCamera('battle', new Vector3(500, 30, 500), scene);
    scene.activeCamera = oldCamera;
    const root = new Mesh('remote-dead-mvp', scene);
    root.position.set(250, 3, -200);
    root.rotationQuaternion = Quaternion.RotationYawPitchRoll(2, 0, 0);
    const body = MeshBuilder.CreateBox('body', { width: 4, height: 2, depth: 7 }, scene);
    body.parent = root;
    body.isVisible = false; // MVP died on the final shot.
    const health = MeshBuilder.CreatePlane('healthBar', { size: 3 }, scene);
    health.parent = root;
    const position = root.position.clone();
    const count = scene.meshes.length;
    const observers = scene.onBeforeRenderObservable.observers.length;
    const showcase = new MvpShowcase(scene, root);
    const camera = scene.activeCamera;
    const copy = scene.getMeshByName('mvp-presentation');
    assert.notEqual(camera, oldCamera);
    assert.ok(copy.getChildMeshes().find(mesh => mesh.name.endsWith('body')).isVisible);
    assert.ok(!copy.getChildMeshes().find(mesh => mesh.name.endsWith('healthBar')).isVisible);
    assert.ok(Vector3.Distance(camera.target, copy.position) < 5, 'camera targets the presented vehicle, not the original battle coordinates');
    assert.ok((camera.layerMask & root.layerMask) === 0, 'battle meshes excluded from showcase');
    const alpha = camera.alpha;
    engine.getDeltaTime = () => 16.667;
    for (let frame = 0; frame < 120; frame++) scene.onBeforeRenderObservable.notifyObservers(scene);
    assert.ok(camera.alpha < alpha, 'camera orbits during showcase');
    assert.ok(root.position.equals(position), 'presentation must not move the network/physics vehicle');
    assert.ok(!body.isVisible, 'original dead vehicle stays hidden');
    showcase.dispose();
    showcase.dispose();
    assert.equal(scene.activeCamera, oldCamera);
    assert.equal(scene.meshes.length, count, 'all cloned meshes and podium cleaned up');
    assert.equal(scene.onBeforeRenderObservable.observers.filter(o => !o._willBeUnregistered).length, observers);
    const reduced = new MvpShowcase(scene, root, true);
    const reducedAlpha = scene.activeCamera.alpha;
    scene.onBeforeRenderObservable.notifyObservers(scene);
    assert.equal(scene.activeCamera.alpha, reducedAlpha, 'reduced-motion camera stays still');
    reduced.dispose();
    scene.dispose();
}
{
    const scene = new Scene(engine);
    const ground = MeshBuilder.CreateGround('terrain', { width: 100, height: 100 }, scene);
    ground.metadata = { terrain: true };
    for (let i = 0; i < 1000; i++) new Mesh(`vehicle-detail-${i}`, scene);
    scene.meshes.forEach(mesh => mesh.computeWorldMatrix(true));
    assert.equal(groundHeight(scene, 0, 0), 0);
    ground.dispose();
    assert.equal(groundHeight(scene, 0, 0), null, 'removed terrain is not cached forever');
    scene.dispose();
}
{
    const scene = new Scene(engine);
    const owner = new Mesh('owner', scene);
    owner.metadata = { teamId: 'alpha', vehicle: { isDead: false } };
    const enemies = [60, 40, 20].map(z => {
        const mesh = MeshBuilder.CreateBox(`enemy-${z}`, { size: 3 }, scene);
        mesh.position.z = z;
        mesh.metadata = { teamId: 'bravo', vehicle: { isDead: false } };
        return mesh;
    });
    scene.meshes.forEach(mesh => mesh.computeWorldMatrix(true));
    const weapon = new WeaponController(scene, owner, 'minigun', 'test', false);
    weapon.setTargetPool(enemies);
    const originalPick = scene.pickWithRay.bind(scene);
    let rays = 0;
    scene.pickWithRay = (...args) => { rays++; return originalPick(...args); };
    const originalPerformance = globalThis.performance;
    let now = 0;
    globalThis.performance = { now: () => now };
    for (let frame = 0; frame < 60; frame++) {
        now = frame * 1000 / 60;
        scene.onBeforeRenderObservable.notifyObservers(scene);
    }
    assert.equal(weapon.currentTarget, enemies[2], 'closest visible target chosen regardless of roster order');
    assert.ok(rays <= 10, `at most 10 LOS rays per second with a visible best target; got ${rays}`);
    const battleRays = rays;
    enemies[2].metadata.vehicle.isCloaked = true;
    scene.onBeforeRenderObservable.notifyObservers(scene);
    assert.equal(weapon.currentTarget, null, 'cloak invalidates a cached target immediately');
    const wall = MeshBuilder.CreateBox('wall', { width: 30, height: 10, depth: 2 }, scene);
    wall.position.z = 10;
    wall.computeWorldMatrix(true);
    now += 110;
    scene.onBeforeRenderObservable.notifyObservers(scene);
    assert.equal(weapon.currentTarget, null, 'walls still block targeting');
    weapon.setPresentationTarget(enemies[0]);
    let localShots = 0;
    weapon.fire = () => { localShots++; };
    for (let frame = 0; frame < 30; frame++) scene.onBeforeRenderObservable.notifyObservers(scene);
    assert.equal(weapon.currentTarget, enemies[0], 'race turret follows the server target');
    assert.equal(localShots, 0, 'presentation target cannot cause client damage or firing');
    weapon.setPresentationTarget(null);
    scene.onBeforeRenderObservable.notifyObservers(scene);
    assert.equal(weapon.currentTarget, null, 'server can explicitly release a race lock');
    const beforeEnd = rays;
    scene.metadata = { combatEnded: true };
    now += 1000;
    scene.onBeforeRenderObservable.notifyObservers(scene);
    assert.equal(rays, beforeEnd, 'no targeting work after match ends');
    globalThis.performance = originalPerformance;
    scene.dispose();
    console.log(`PASS: targeting used ${battleRays} LOS rays across 60 frames (previous path: 180 for this target order).`);
}
{
    const { registerVehicleShadows } = await load('src/game/engine/VehicleShadows.js');
    const scene = new Scene(engine);
    const light = new DirectionalLight('sun', new Vector3(0, -1, 0), scene);
    const shadows = new ShadowGenerator(512, light);
    const root = new Mesh('vehicle', scene);
    const body = MeshBuilder.CreateBox('chassis', {}, scene);
    body.parent = root;
    registerVehicleShadows(root);
    for (let i = 0; i < 100; i++) MeshBuilder.CreateSphere(`explosion-${i}`, {}, scene);
    const casters = shadows.getShadowMap().renderList;
    assert.equal(casters.length, 1, 'combat effects never enter the vehicle shadow list');
    assert.equal(casters[0] === body, true, 'vehicle geometry casts shadows');
    scene.dispose();
}
engine.dispose();
console.log('PASS: post-match timing/fallback, dead/remote MVP framing, orbit, source isolation, reduced motion, cleanup, terrain cache, cloak and occlusion.');
