/** Headless regression checks for the locally hosted combat VFX atlas set. */
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { ParticlesOptimization, SceneOptimizerOptions } from '@babylonjs/core/Misc/sceneOptimizer.js';
import { Mesh, MeshBuilder, NullEngine, FreeCamera, ParticleSystem, Scene, TransformNode, Vector3 } from '@babylonjs/core';

const atlases = [
    ['explosion', 'explosion-02hd-5x5.png', 1024, 1024, 25],
    ['explosionLight', 'explosion-light-5x5.png', 1024, 1024, 25],
    ['fireball', 'fireball-03-8x8.png', 1024, 1024, 64],
    ['discSmoke', 'disc-smoke-16x4.png', 1024, 512, 64],
];

const manifest = await readFile('src/game/vfx/VfxAssets.ts', 'utf8');
const manager = await readFile('src/game/vfx/VfxManager.ts', 'utf8');
const weapons = await readFile('src/game/weapons/WeaponController.ts', 'utf8');
const localVehicle = await readFile('src/game/entities/VehicleController.ts', 'utf8');
const remoteVehicle = await readFile('src/game/entities/RemoteVehicle.ts', 'utf8');
for (const effect of ['tireSmoke', 'exhaustFlames', 'windTrails']) assert.ok(localVehicle.includes(`this.${effect}.dispose(false)`), `${effect}: vehicle disposal preserves manager-owned textures`);
const licenses = await readFile('public/assets/vfx/LICENSES.md', 'utf8');
let totalBytes = 0;

for (const [id, name, expectedWidth, expectedHeight, expectedFrames] of atlases) {
    const path = `public/assets/vfx/pyro/${name}`;
    const [png, metadata] = await Promise.all([readFile(path), stat(path)]);
    assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG', `${name}: valid PNG signature`);
    assert.equal(png.readUInt32BE(16), expectedWidth, `${name}: atlas width`);
    assert.equal(png.readUInt32BE(20), expectedHeight, `${name}: atlas height`);
    const entryStart = manifest.indexOf(`    ${id}: {`);
    const entryEnd = manifest.indexOf('    },', entryStart);
    assert.ok(entryStart >= 0 && entryEnd > entryStart, `${name}: registered in manifest`);
    const entry = manifest.slice(entryStart, entryEnd);
    assert.match(entry, new RegExp(`${name.replaceAll('.', '\\.')}`), `${name}: manifest URL`);
    assert.match(entry, new RegExp(`frameCount:\\s*${expectedFrames}`), `${name}: animation frame count`);
    totalBytes += metadata.size;
}

assert.ok(totalBytes < 5 * 1024 * 1024, `runtime atlas payload stays under 5 MiB (found ${(totalBytes / 1024 / 1024).toFixed(2)} MiB)`);
assert.doesNotMatch(manifest, /https?:\/\//, 'runtime manifest must not hotlink third-party assets');
assert.match(manager, /isAnimationSheetEnabled\s*=\s*true/, 'sprite-sheet animation is enabled');
assert.match(manager, /activeTransientLights/, 'transient lights use a scene-wide budget');
assert.match(manager, /particleLimitMultiplier/, 'effects respect the graphics particle tier');
for (const recipe of ['triggerShockwave', 'triggerEmpWave', 'triggerLightningStrike', 'triggerGravityPulse', 'triggerCloakTransition', 'triggerAfterburner', 'attachAegisDome']) {
    assert.match(localVehicle, new RegExp(`VfxManager\\.getInstance\\(\\)\\.${recipe}`), `local vehicle uses shared ${recipe} recipe`);
    assert.match(remoteVehicle, new RegExp(`VfxManager\\.getInstance\\(\\)\\.${recipe}`), `remote vehicle uses shared ${recipe} recipe`);
}
for (const projectile of ['missile', 'mortar', 'nuke']) {
    assert.match(weapons, new RegExp(`'${projectile}'`), `${projectile}: projectile profile is present`);
}
assert.match(weapons, /flightGlowHalo/, 'airborne ordnance has a persistent emissive halo');
assert.match(manager, /smokeTrail-\$\{kind\}/, 'projectile smoke trails are separated by weapon profile');
assert.match(manager, /fireTrail-\$\{kind\}/, 'projectile flame trails are separated by weapon profile');
assert.match(manager, /triggerAegisActivation/, 'Behemoth activation uses a shining particle blast');
assert.match(manager, /emp-lightning-loop-near/, 'Manticore EMP has a near circular lightning circuit');
assert.match(manager, /emp-lightning-loop-mid/, 'Manticore EMP has a middle circular lightning circuit');
assert.match(manager, /emp-lightning-loop-far/, 'Manticore EMP has a far circular lightning circuit');
assert.doesNotMatch(localVehicle, /CreateBox\("fireTrap"/, 'Valkyrie hazard does not use placeholder box geometry');
assert.doesNotMatch(remoteVehicle, /CreateBox\("fireTrap"/, 'remote Valkyrie hazard does not use placeholder box geometry');
assert.doesNotMatch(localVehicle, /CreateTorus\("gravPulse"/, 'Wraith pulse does not use the old solid torus');
assert.doesNotMatch(remoteVehicle, /CreateTorus\("gravPulse"/, 'remote Wraith pulse does not use the old solid torus');
assert.doesNotMatch(localVehicle, /wireframe\s*=\s*true/, 'Behemoth dome does not use a wireframe placeholder');
assert.doesNotMatch(remoteVehicle, /wireframe\s*=\s*true/, 'remote Behemoth dome does not use a wireframe placeholder');
assert.match(licenses, /CC0/i, 'asset provenance records the source license');
assert.match(licenses, /unity\.com/i, 'asset provenance records the official source');

// Regression for the muzzle-detonation bug: projectile glow/body children must
// never be returned to the projectile's own swept collision ray.
const out = resolve('node_modules/.cache/overdrive-vfx-check');
await mkdir(out, { recursive: true });
const collisionSource = await readFile('src/game/weapons/ProjectileCollision.ts', 'utf8');
await writeFile(`${out}/ProjectileCollision.js`, ts.transpileModule(collisionSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
}).outputText);
const { isProjectileCollisionCandidate } = await import(pathToFileURL(`${out}/ProjectileCollision.js`));
// Exercise the actual shared shield recipe with a controlled clock, without
// initializing its unrelated texture loading / activation burst effects.
for (const [name, source] of [
    ['VfxManager', manager],
    ['ThermalWake', await readFile('src/game/vfx/ThermalWake.ts', 'utf8')],
    ['ArenaTerrain', await readFile('src/game/levels/ArenaTerrain.ts', 'utf8')],
    ['ExplosionAftermath', await readFile('src/game/vfx/ExplosionAftermath.ts', 'utf8')],
    ['AbilityVortex', await readFile('src/game/vfx/AbilityVortex.ts', 'utf8')],
    ['ModelBuilder', await readFile('src/game/models/ModelBuilder.ts', 'utf8')],
    ['AbilityMechanism', await readFile('src/game/vfx/AbilityMechanism.ts', 'utf8')],
    ['VehicleBounds', await readFile('src/game/models/VehicleBounds.ts', 'utf8')],
    ['TargetFrame', await readFile('src/game/match/TargetFrame.ts', 'utf8')],
    ['DynamicSceneOptimizer', await readFile('src/game/engine/DynamicSceneOptimizer.ts', 'utf8')],
    ['AbilityActivation', await readFile('src/game/vfx/AbilityActivation.ts', 'utf8')],
    ['VfxAssets', manifest],
    ['ElectricSurface', await readFile('src/game/vfx/ElectricSurface.ts', 'utf8')],
    ['GraphicsSettingsManager', await readFile('src/game/settings/GraphicsSettingsManager.ts', 'utf8')],
]) {
    const code = ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
    }).outputText.replace("'./ThermalWake'", "'./ThermalWake.js'").replace("'../levels/ArenaTerrain'", "'./ArenaTerrain.js'").replace("'./ExplosionAftermath'", "'./ExplosionAftermath.js'").replace("'../models/ModelBuilder'", "'./ModelBuilder.js'").replace("'./ElectricSurface'", "'./ElectricSurface.js'").replace('../settings/GraphicsSettingsManager', './GraphicsSettingsManager.js').replace("'./VfxAssets'", "'./VfxAssets.js'").replace("'./AbilityMechanism'", "'./AbilityMechanism.js'").replaceAll("'./AbilityVortex'", "'./AbilityVortex.js'").replace("'../models/VehicleBounds'", "'./VehicleBounds.js'").replace("@babylonjs/core/Misc/sceneOptimizer'", "@babylonjs/core/Misc/sceneOptimizer.js'");
    await writeFile(`${out}/${name}.js`, code);
}
const { playAbilityActivation, vortexPosition, ABILITY_ACTIVATION_MS } = await import(pathToFileURL(`${out}/AbilityActivation.js`));
const { projectTargetFrame } = await import(pathToFileURL(`${out}/TargetFrame.js`));
const { createDynamicSceneOptimizerOptions } = await import(pathToFileURL(`${out}/DynamicSceneOptimizer.js`));
const { VfxManager } = await import(pathToFileURL(`${out}/VfxManager.js`));
const { GraphicsSettingsManager } = await import(pathToFileURL(`${out}/GraphicsSettingsManager.js`));
const engine = new NullEngine();
const scene = new Scene(engine);
scene.activeCamera = new FreeCamera('vfx-camera', new Vector3(0, 4, -15), scene);
scene.activeCamera.setTarget(Vector3.Zero());
const owner = new Mesh('owner', scene);
const ownerBody = new Mesh('owner-body', scene);
ownerBody.parent = owner;
const projectile = new TransformNode('missile', scene);
const projectileBody = new Mesh('body', scene);
projectileBody.parent = projectile;
const projectileGlow = new Mesh('missile-flight-halo', scene);
projectileGlow.parent = projectile;
const obstacle = new Mesh('arena-wall', scene);
assert.equal(isProjectileCollisionCandidate(projectileBody, projectile, owner), false, 'missile body cannot self-detonate');
assert.equal(isProjectileCollisionCandidate(projectileGlow, projectile, owner), false, 'missile glow cannot self-detonate');
assert.equal(isProjectileCollisionCandidate(ownerBody, projectile, owner), false, 'owner body is excluded');
assert.equal(isProjectileCollisionCandidate(obstacle, projectile, owner), true, 'world obstacle remains collidable');
// Babylon lazily creates its scene-owned default material on the first effect.
assert.ok(scene.defaultMaterial);
const graphics = GraphicsSettingsManager.getInstance();
const originalGetConfig = graphics.getConfig;
mock.timers.enable({ apis: ['setTimeout'] });
try {
    let clock = 0;
    const clockMock = mock.method(performance, 'now', () => clock);
    const advance = ms => { clock += ms; mock.timers.tick(ms); };
    graphics.getConfig = () => ({ particleLimitMultiplier: 1 });
    const chassis = new TransformNode('chassisRoot', scene);
    chassis.parent = owner;
    const body = MeshBuilder.CreateBox('vortex-chassis', { width: 4, height: 3, depth: 8 }, scene);
    body.parent = chassis;
    const sample = Vector3.Zero(), center = new Vector3(0, 1, 0), size = new Vector3(4, 3, 8);
    vortexPosition(0, 0, center, size, sample);
    assert.ok(Math.abs(sample.x - center.x) <= size.x * 0.5, 'activation sparks start at flank hardpoints');
    vortexPosition(0.5, 0, center, size, sample);
    assert.ok(Math.abs(sample.x - center.x) > size.x * 0.43, 'sparks discharge outward from hardpoints');
    vortexPosition(1, 0, center, size, sample);
    assert.ok(Math.abs(sample.x - center.x) <= size.x * 0.5, 'discharges end at hardpoints');
    const { ModelBuilder } = await import(pathToFileURL(`${out}/ModelBuilder.js`));
    ModelBuilder.steelSurface(scene); ModelBuilder.steelSurface(scene, true);
    const baselineMeshes = scene.meshes.length, baselineMaterials = scene.materials.length;
    for (const ability of ['lightning', 'shockwave', 'phantom', 'manticore', 'valkyrie', 'wraith', 'behemoth']) {
        let executed = 0;
        const cancel = playAbilityActivation(owner, ability, () => executed++, () => true);
        const vortex = scene.getMeshByName('ability-activation-vortex');
        assert.ok(vortex);
        assert.ok(vortex.getTotalVertices() >= 24 * 4, `${ability}: bounded spark batch on every activation`);
        assert.ok(owner.getChildTransformNodes().some(node => node.name === `ability-mechanism-${ability}`), 'mechanism deploys');
        advance(1);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        assert.ok(owner.getChildTransformNodes().filter(node => node.name === 'ability-actuator').every(node => node.position.length() > 0), 'actuators extend from hardpoints');
        advance(500);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        const before = Vector3.FromArray(vortex.getVerticesData('position'));
        const movement = new Vector3(12, 3, -7);
        owner.position.addInPlace(movement);
        scene.onBeforeRenderObservable.notifyObservers(scene);
        const after = Vector3.FromArray(vortex.getVerticesData('position'));
        assert.ok(after.subtract(before).subtract(movement).length() < 1e-4, 'spark geometry follows moving chassis');
        assert.ok(vortex.material.alpha > 0.9, 'vortex visible during charge');
        advance(ABILITY_ACTIVATION_MS - 502);
        assert.equal(executed, 0, `${ability}: normal ability waits for charge`);
        advance(1);
        assert.equal(executed, 1, `${ability}: executes once after vortex`);
        assert.equal(scene.getMeshByName('ability-activation-vortex'), null, 'completed vortex leaves no spark geometry');
        advance(8500);
        assert.equal(scene.meshes.length, baselineMeshes, 'deployed hardware retracts and disposes');
        assert.equal(scene.materials.length, baselineMaterials, 'hardware materials do not accumulate');
        cancel(); advance(2000);
        assert.equal(executed, 1, 'late cancellation cannot execute again');
    }
    for (const reason of ['cancel', 'disabled', 'match-end', 'parent-dispose', 'scene-dispose']) {
        const effectScene = reason === 'scene-dispose' ? new Scene(engine) : scene;
        const actor = new Mesh('cancelled-vortex', effectScene);
        let eligible = true, executed = false, soundStops = 0;
        const cancel = playAbilityActivation(actor, 'wraith', () => { executed = true; }, () => eligible, () => { soundStops++; });
        if (reason === 'cancel') cancel();
        if (reason === 'disabled') eligible = false;
        if (reason === 'match-end') scene.metadata = { combatEnded: true };
        if (reason === 'parent-dispose') actor.dispose();
        if (reason === 'scene-dispose') effectScene.dispose();
        advance(ABILITY_ACTIVATION_MS);
        assert.equal(executed, false, `${reason}: pending ability cannot execute`);
        assert.equal(soundStops, 1, `${reason}: interrupted wind-up stops its sound exactly once`);
        assert.equal(effectScene.getMeshByName('ability-activation-vortex'), null, `${reason}: vortex cleaned up`);
        scene.metadata = null;
        if (!actor.isDisposed() && !effectScene.isDisposed) {
            eligible = true;
            const replay = playAbilityActivation(actor, 'wraith', () => {}, () => eligible);
            const restarted = effectScene.getMeshByName('ability-activation-vortex');
            assert.ok(restarted.getTotalVertices() >= 24 * 4, `${reason}: sprites return after revival/retry`);
            replay();
            assert.equal(actor.getChildMeshes().length, 0, 'retry leaves no mechanical geometry');
        }
        actor.dispose();
    }
    // Reproduce the scene-wide failure: the shipped preset suppresses every later emitter.
    const shutdown = SceneOptimizerOptions.ModerateDegradationAllowed().optimizations.find(item => item instanceof ParticlesOptimization);
    shutdown.apply(scene, { isInImprovementMode: false });
    assert.equal(scene.particlesEnabled, false, 'old optimizer reproduces persistent particle shutdown');
    for (const quality of ['LOW', 'MEDIUM', 'HIGH']) {
        scene.particlesEnabled = true;
        for (const optimization of createDynamicSceneOptimizerOptions(quality).optimizations) {
            if (optimization instanceof ParticlesOptimization) optimization.apply(scene, { isInImprovementMode: false });
        }
        assert.equal(scene.particlesEnabled, true, 'adaptive degradation must preserve gameplay telegraphs');
    }
    owner.position.set(0, 0, 0);
    const project = (x, y, z) => ({ x: 400 + x * 10, y: 300 - y * 10, z: 0.5 + z * 0.001 });
    const frame = projectTargetFrame(owner, project, 800, 600, true);
    assert.ok(frame.width > 40 && frame.height > 30, 'frame encloses chassis with padding');
    owner.position.x += 10;
    assert.equal(projectTargetFrame(owner, project, 800, 600, true).x, frame.x + 100, 'frame tracks moving target');
    assert.equal(projectTargetFrame(owner, () => ({ x: 100, y: 100, z: -1 }), 800, 600, true), null, 'behind-camera target hidden');
    owner.metadata = { vehicle: { isCloaked: true } };
    assert.equal(projectTargetFrame(owner, project, 800, 600, true), null, 'cloaked target hidden');
    owner.metadata.vehicle = { isDead: true };
    assert.equal(projectTargetFrame(owner, project, 800, 600, true), null, 'dead target hidden');
    owner.metadata = null;
    chassis.dispose();
    clockMock.mock.restore();
    for (const particleLimitMultiplier of [0, 1]) {
        graphics.getConfig = () => ({ particleLimitMultiplier });
        const effects = Object.create(VfxManager.prototype);
        effects.scene = scene;
        effects.flareTexture = null;
        effects.triggerAegisActivation = () => {};
        effects.createExpandingRing = () => {};
        effects.triggerShiningBurst = () => {};
        effects.createTransientLight = () => {};
        effects.triggerGravityPulse(Vector3.Zero(), 12);
        assert.equal(scene.getMeshByName('grav-debris'), null, 'gravity pulse must not spawn dark debris meshes');
        const lift = scene.particleSystems.find(system => system.name === 'gravity-lift-stream');
        if (particleLimitMultiplier > 0) {
            assert.ok(lift, 'Wraith has rising particles');
            assert.equal(lift.blendMode, ParticleSystem.BLENDMODE_ADD, 'Wraith particles cannot obscure the wave with black rectangles');
            assert.equal(lift.particleTexture, effects.flareTexture, 'Wraith uses the soft spark sprite');
            assert.ok(lift.color1.g > lift.color1.r && lift.color1.g > lift.color1.b && lift.color2.g > lift.color2.r && lift.color2.g > lift.color2.b, 'Wraith particles glow green');
        } else assert.equal(lift, undefined, 'disabled particle quality remains respected');
        mock.timers.tick(1300);
        assert.equal(scene.particleSystems.length, 0, 'gravity pulse particles are disposed');
        const meshCount = scene.meshes.length;
        const materialCount = scene.materials.length;
        const particleCount = scene.particleSystems.length;
        const observerCount = scene.onBeforeRenderObservable.observers.length;
        for (let activation = 0; activation < 3; activation++) {
            effects.attachAegisDome(owner, 6000);
            assert.ok(scene.getMeshByName('aegis-grid-dome'), 'shield grid is visible during overdrive');
            mock.timers.tick(5999);
            assert.ok(scene.getMeshByName('aegis-grid-dome'), 'shield survives until ability expiry');
            mock.timers.tick(1);
            assert.equal(scene.meshes.length, meshCount, 'all shield meshes disappear at six seconds');
            assert.equal(scene.materials.length, materialCount, 'shield materials do not accumulate');
            mock.timers.tick(700);
            assert.equal(scene.particleSystems.length, particleCount, 'shield particles finish cleanup');
            assert.equal(scene.onBeforeRenderObservable.observers.length, observerCount, 'shield animation callbacks do not accumulate');
        }
    }
} finally {
    graphics.getConfig = originalGetConfig;
    mock.timers.reset();
}
// Unlike animate(true), scene.render exercises readiness and draw dispatch.
const renderScene = new Scene(engine);
renderScene.activeCamera = new FreeCamera('render-camera', new Vector3(0, 4, -15), renderScene);
renderScene.activeCamera.setTarget(Vector3.Zero());
const renderActor = MeshBuilder.CreateBox('invisible-physics-root', {}, renderScene);
renderActor.isVisible = false;
renderScene.particlesEnabled = false; // A wind-up remains visible even if incidental particles are suppressed.
let renderClock = 0;
const renderClockMock = mock.method(performance, 'now', () => renderClock);
graphics.getConfig = () => ({ particleLimitMultiplier: 1 });
mock.timers.enable({ apis: ['setTimeout'] });
try {
    for (let activation = 0; activation < 3; activation++) {
        let completed = 0;
        const cancel = playAbilityActivation(renderActor, 'wraith', () => completed++, () => true);
        const vortex = renderScene.getMeshByName('ability-activation-vortex');
        // NullEngine does not upload textures; mark this owned raw texture ready, retaining material/shader checks.
        vortex.material.diffuseTexture.getInternalTexture().isReady = true;
        let draws = 0;
        vortex.onBeforeDrawObservable.add(() => draws++);
        for (let frame = 0; frame < 12; frame++) {
            renderClock += 40; mock.timers.tick(40);
            renderScene.render();
            await new Promise(resolve => setImmediate(resolve));
        }
        assert.ok(draws > 0, `activation ${activation}: vortex reaches scene draw path`);
        assert.ok(vortex.material.alpha > 0.9, 'drawn sprites have visible opacity');
        assert.equal(completed, 0, 'ability does not precede visible wind-up');
        renderClock += 620; mock.timers.tick(620);
        assert.equal(completed, 1, 'ability executes after rendered wind-up');
        assert.ok(vortex.isDisposed());
        cancel();
        // Death/respawn visibility must not gate the next effect.
        renderActor.setEnabled(false); renderScene.render(); renderActor.setEnabled(true);
        renderActor.position.x += 2;
    }
} finally {
    renderClockMock.mock.restore(); mock.timers.reset(); graphics.getConfig = originalGetConfig;
    renderScene.dispose();
}
console.log('PASS: Three complete scene-render cycles draw the vortex with global particles disabled and an invisible, respawned root.');
scene.dispose();
engine.dispose();
console.log('PASS: Repeated vortex sprite geometry, cancelled/revived activations, mechanical cleanup and target projection.');
console.log('PASS: Aegis expires at six seconds; repeated activation leaves no shield meshes, materials or particles.');

console.log(`PASS: ${atlases.length} local CC0 VFX atlases validated; ${(totalBytes / 1024 / 1024).toFixed(2)} MiB total.`);
