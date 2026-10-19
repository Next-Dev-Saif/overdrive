/** Deterministic bot decisions and controller lifecycle, without browser/physics setup. */
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { NullEngine, Scene, MeshBuilder } from '@babylonjs/core';
const out = resolve('node_modules/.cache/overdrive-bot-check');
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
await compile(resolve('src/game/entities/AIBotController.ts'));
const load = file => import(pathToFileURL(resolve(out, file)));
const { AIBotController } = await load('src/game/entities/AIBotController.js');
const { chooseBotState, shouldUseBotAbility, weaponSpacing } = await load('src/game/entities/BotTactics.js');
const baseline = { vehicleId: 'interceptor', weaponId: 'minigun', distance: 40, facing: 1, health: 1, underFire: false, nearbyEnemies: 1, reloading: false, clearRoute: true, visible: true, targetStable: true };
assert.equal(chooseBotState({ ...baseline, visible: false }, 'engage'), 'search');
assert.equal(chooseBotState({ ...baseline, distance: 100 }, 'engage'), 'approach');
assert.equal(chooseBotState({ ...baseline, distance: 10 }, 'engage'), 'withdraw');
assert.equal(chooseBotState({ ...baseline, health: .2, underFire: true }, 'engage'), 'withdraw');
assert.equal(chooseBotState({ ...baseline, distance: 25, reloading: true }, 'engage'), 'withdraw');
assert.equal(chooseBotState(baseline, 'engage'), 'engage');
assert.ok(weaponSpacing('nuke').min > weaponSpacing('minigun').ideal);
const useful = {
    interceptor: {}, juggernaut: { distance: 20 }, manticore: { distance: 30 },
    wraith: { distance: 25, nearbyEnemies: 2 }, phantom: { health: .4, underFire: true },
    behemoth: { health: .5, underFire: true }, valkyrie: { distance: 65 },
};
for (const [vehicleId, fields] of Object.entries(useful)) {
    const context = { ...baseline, vehicleId, ...fields };
    assert.ok(shouldUseBotAbility(context), `${vehicleId} recognizes its opportunity`);
    assert.equal(shouldUseBotAbility({ ...context, visible: false }), false);
    assert.equal(shouldUseBotAbility({ ...context, targetStable: false }), false);
}
assert.equal(shouldUseBotAbility({ ...baseline, vehicleId: 'juggernaut' }), false);
assert.equal(shouldUseBotAbility({ ...baseline, vehicleId: 'phantom' }), false);
assert.equal(shouldUseBotAbility({ ...baseline, vehicleId: 'valkyrie', distance: 65, clearRoute: false }), false);
const engine = new NullEngine(), scene = new Scene(engine);
let now = 20000, rays = 0, blocked = false;
mock.method(performance, 'now', () => now);
const wall = MeshBuilder.CreateBox('wall', {}, scene);
scene.pickWithRay = () => { rays++; return blocked ? { hit: true, pickedMesh: wall, distance: 1 } : { hit: false }; };
function actor(id, z, teamId) {
    const mesh = MeshBuilder.CreateBox(id, {}, scene); mesh.position.z = z; mesh.computeWorldMatrix(true);
    const vehicle = { mesh, vehicleId: 'interceptor', health: 100, maxHealth: 100, isDead: false, isCloaked: false, lastAbilityTime: 0,
        throttleInput: 0, steerInput: 0, getSpeed: () => 0, getAbilityCooldown: () => 8000, triggerAbility() { this.lastAbilityTime = now; abilities++; } };
    mesh.metadata = { entityId: id, teamId, vehicle };
    return vehicle;
}
let shots = 0, abilities = 0;
const own = actor('bot', 0, 'alpha'), enemy = actor('enemy', 45, 'bravo'), ally = actor('ally', 10, 'alpha');
const weapon = { weaponId: 'minigun', currentTarget: null, isLocked: true, isReadyToFire: true, isReloading: false,
    setPreferredTarget(target) { this.currentTarget = target; }, fire() { shots++; } };
const bot = new AIBotController(own, enemy, [], scene, weapon, () => [ally]); bot.isActive = true;
const tick = (ms = 250) => { now += ms; rays = 0; scene.onBeforeRenderObservable.notifyObservers(scene); assert.ok(rays <= 7, 'bounded per-decision ray count'); };
tick(); assert.equal(weapon.currentTarget, enemy.mesh); assert.equal(shots, 0, 'acquisition has reaction delay');
tick(); tick(); assert.ok(shots > 0); tick(); assert.equal(abilities, 1);
const fired = shots;
enemy.isCloaked = true; tick(); assert.equal(shots, fired); assert.equal(weapon.currentTarget, null); assert.equal(bot.state, 'search');
enemy.isCloaked = false; blocked = true; tick(); assert.equal(weapon.currentTarget, null, 'walls block acquisition');
assert.equal(own.throttleInput, 0, 'close obstacle stops forward drive');
blocked = false; tick(); own.isEmped = true; tick(); assert.equal(own.throttleInput, 0); assert.equal(own.steerInput, 0);
own.isEmped = false; tick();
for (let i = 0; i < 10; i++) tick();
assert.equal(bot.state, 'recover'); assert.ok(own.throttleInput < 0, 'no movement triggers bounded reverse recovery');
own.mesh.position.z += 5; own.mesh.computeWorldMatrix(true); tick(1250); assert.notEqual(bot.state, 'recover');
scene.metadata = { combatEnded: true }; tick(); assert.equal(own.throttleInput, 0);
bot.dispose(); scene.dispose(); engine.dispose(); mock.restoreAll();
console.log('PASS: tactical spacing, seven ability policies, reaction delay, team/LOS/cloak filtering, EMP stop, recovery, bounded rays and cleanup.');
