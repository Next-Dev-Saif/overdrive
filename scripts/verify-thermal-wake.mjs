/** Headless ability checks: local/host-bot authority, remote replay, terrain, damage and cleanup. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mock } from 'node:test';
import ts from 'typescript';
import { FreeCamera, MeshBuilder, NullEngine, Scene, Vector3 } from '@babylonjs/core';
const out = resolve('node_modules/.cache/thermal-wake-check'), compiled = new Set();
async function compile(file) {
    file = resolve(file);
    if (compiled.has(file)) return;
    compiled.add(file);
    const source = await readFile(file, 'utf8');
    let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
    for (const match of code.matchAll(/from ["'](\.[^"']+)["']/g)) await compile(resolve(dirname(file), `${match[1]}.ts`));
    code = code.replace(/from (["'])(\.[^"']+)\1/g, 'from $1$2.js$1');
    const target = resolve(out, file.slice(process.cwd().length + 1).replace(/\.ts$/, '.js'));
    await mkdir(dirname(target), { recursive: true }); await writeFile(target, code);
}
await compile('src/game/entities/VehicleController.ts');
await compile('src/game/entities/RemoteVehicle.ts');
const load = path => import(pathToFileURL(resolve(out, path)));
const { createThermalWake, touchesThermalWake, THERMAL_WAKE } = await load('src/game/vfx/ThermalWake.js');
const { VehicleController } = await load('src/game/entities/VehicleController.js');
const { RemoteVehicle } = await load('src/game/entities/RemoteVehicle.js');
const { VfxManager } = await load('src/game/vfx/VfxManager.js');
let now = 0;
mock.method(performance, 'now', () => now);
globalThis.window = new EventTarget();
const engine = new NullEngine();
function fixture() {
    const scene = new Scene(engine);
    const ground = MeshBuilder.CreateGround('terrain', { width: 500, height: 500 }, scene);
    ground.metadata = { terrain: true }; ground.computeWorldMatrix(true);
    const root = MeshBuilder.CreateBox('valkyrie', { size: 2 }, scene);
    root.position.y = 1.5; root.metadata = { entityId: 'owner', teamId: 'red', vehicleScale: 1.5 };
    root.computeWorldMatrix(true);
    void scene.defaultMaterial;
    return { scene, root };
}
const step = (scene, time) => { now = time; scene.onBeforeRenderObservable.notifyObservers(scene); };
for (const kind of ['player', 'bot', 'remote']) {
    now = 0;
    const { scene, root } = fixture();
    const baseline = { meshes: scene.meshes.length, materials: scene.materials.length };
    const actor = Object.create(kind === 'remote' ? RemoteVehicle.prototype : VehicleController.prototype);
    Object.assign(actor, { mesh: root, scene, isDead: false, config: { mass: 1200 }, aggregate: { body: {
        getLinearVelocityToRef(value) { value.set(0, 0, 0); }, setLinearVelocity() {}, applyImpulse() {},
    } } });
    root.metadata.kind = kind === 'bot' ? 'bot' : 'human';
    VfxManager.getInstance = () => ({ triggerAfterburner(mesh, _origin, pulse, active) {
        return createThermalWake(scene, mesh, pulse, active);
    } });
    const enemy = MeshBuilder.CreateBox('enemy', {}, scene);
    enemy.position.set(0, 1, 0); enemy.metadata = { entityId: 'enemy', teamId: 'blue', playerId: 'enemy' };
    const ally = MeshBuilder.CreateBox('ally', {}, scene);
    ally.position.copyFrom(enemy.position); ally.metadata = { entityId: 'ally', teamId: 'red', playerId: 'ally' };
    const events = [];
    const receive = event => events.push(event.detail);
    window.addEventListener('send-hit', receive);
    actor.triggerAfterburnerDash();
    const camera = new FreeCamera('test-camera', new Vector3(0, 8, -15), scene);
    camera.setTarget(Vector3.Zero());
    scene.render();
    assert.equal(scene.meshes.filter(mesh => mesh.name === 'valkyrie-twin-jet').length, 4, `${kind}: twin blue jets with white cores`);
    for (let tick = 1; tick <= 4; tick++) {
        root.position.z = tick * 6; root.computeWorldMatrix(true); step(scene, tick * 250);
    }
    assert.equal(events.length, kind === 'remote' ? 0 : 4, `${kind}: one owned damage event per tick, never per overlapping patch`);
    assert.ok(events.every(event => event.targetId === 'enemy' && event.attackerId === 'owner' && event.damage === 5 && event.weaponId === 'afterburner'));
    const wake = scene.getMeshByName('valkyrie-thermal-wake');
    assert.ok(wake.getTotalVertices() > 12, `${kind}: moving vehicle leaves a path, not a stationary trap`);
    enemy.position.set(0, 1, 12); enemy.computeWorldMatrix(true); step(scene, 1250);
    assert.equal(events.length, kind === 'remote' ? 0 : 5, 'crossing an earlier trail section burns');
    enemy.position.y = 10; enemy.computeWorldMatrix(true); step(scene, 1500);
    assert.equal(events.length, kind === 'remote' ? 0 : 5, 'airborne target clears the heat');
    step(scene, 2000);
    assert.ok(scene.meshes.filter(mesh => mesh.name === 'valkyrie-twin-jet').every(mesh => !mesh.isEnabled()));
    step(scene, 6500);
    assert.equal(scene.meshes.length, baseline.meshes + 2);
    assert.equal(scene.materials.length, baseline.materials);
    window.removeEventListener('send-hit', receive); scene.dispose();
}
// Explicit lifecycle and bounded geometry tests, including no particles/glow dependency.
for (const stop of ['death', 'owner', 'scene', 'manual']) {
    now = 0; const { scene, root } = fixture(); let active = true, calls = 0;
    const cancel = createThermalWake(scene, root, () => calls++, () => active);
    for (let i = 1; i <= 15; i++) { root.position.x += 10; root.computeWorldMatrix(true); step(scene, i * 90); }
    assert.ok(scene.getMeshByName('valkyrie-thermal-wake').getTotalVertices() <= THERMAL_WAKE.maxPatches * 12);
    if (stop === 'death') { active = false; step(scene, 1400); }
    else if (stop === 'owner') root.dispose();
    else if (stop === 'scene') scene.dispose();
    else cancel();
    const previous = calls;
    if (!scene.isDisposed) step(scene, 2000);
    assert.equal(calls, previous, `${stop}: no post-cleanup damage`);
    assert.ok(!scene.meshes.some(mesh => mesh.name.startsWith('valkyrie-thermal') || mesh.name === 'valkyrie-twin-jet'));
    cancel(); scene.dispose();
}
now = 0;
{
    const { scene, root } = fixture(); let pulses = 0;
    const cancel = createThermalWake(scene, root, () => pulses++);
    root.position.x = 100; root.computeWorldMatrix(true); step(scene, 1000);
    assert.equal(scene.getMeshByName('valkyrie-thermal-wake').getTotalVertices(), 12, 'teleport never paints a connecting corridor');
    assert.equal(pulses, 1, 'stalled frames do not accumulate damage');
    cancel(); scene.dispose();
}
assert.equal(touchesThermalWake(new Vector3(3, 1, 0), [{ position: Vector3.Zero(), born: 0 }]), false);
engine.dispose(); mock.restoreAll(); delete globalThis.window;
console.log('PASS: player/host-bot damage, remote visual replay without duplicate damage, allies, trail crossings, overlap, altitude, bounded geometry, expiry, cancellation and teleports.');
