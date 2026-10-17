/** Headless regression checks for simultaneous driving inputs, native pixels and seamless skies. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { HardwareScalingOptimization } from '@babylonjs/core/Misc/sceneOptimizer.js';
import { NullEngine, Scene } from '@babylonjs/core';
const out = resolve('node_modules/.cache/driving-presentation');
await mkdir(out, { recursive: true });
async function load(path) {
    const source = await readFile(path, 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText.replace("@babylonjs/core/Misc/sceneOptimizer'", "@babylonjs/core/Misc/sceneOptimizer.js'");
    const target = `${out}/${path.split('/').at(-1).replace('.ts', '.mjs')}`;
    await writeFile(target, code); return import(pathToFileURL(target));
}
const { advanceSteering, vehicleHandling } = await load('src/game/entities/VehicleHandling.ts');
const factory = await readFile('src/game/entities/VehicleFactory.ts', 'utf8');
const configs = [...factory.matchAll(/config = (\{[\s\S]*?\});/g)].map(match => Function(`return (${match[1]})`)());
assert.equal(configs.length, 7);
for (const config of configs) {
    for (const speed of [5, config.maxSpeed]) {
        let angle = 0, yaw = 0;
        for (let i = 0; i < 60; i++) {
            angle = advanceSteering(config, angle, 1, speed, 1 / 60);
            const result = vehicleHandling(config, speed, 0, yaw, angle, 1, 1 / 60);
            yaw += result.yawDelta;
            assert.ok(Number.isFinite(yaw) && result.driveDelta >= 0, 'forward plus steer keeps accelerating');
        }
        const weight = Math.max(.8, Math.min(2.2, Math.sqrt(config.mass / 1200)));
        const oldLock = (.56 + Math.min(5, config.steeringSpeed) * .03) / (1 + speed * .018);
        const oldLimit = Math.min(speed * Math.tan(oldLock) / (4.5 * .64), 1.45, 10.2 / Math.sqrt(weight) / Math.max(2, speed));
        assert.ok(yaw > oldLimit * 1.2, 'all seven vehicles turn at least 20% faster with forward + side held');
        const reverse = vehicleHandling(config, -speed, 0, 0, angle, -1, 1 / 60);
        assert.ok(reverse.yawDelta < 0, 'reverse steering retains its signed direction');
        assert.equal(vehicleHandling(config, 0, 0, 0, angle, 1, 1 / 60).yawDelta, 0, 'no stationary spinning');
    }
    const brake = vehicleHandling(config, .2, 0, 0, 0, -1, 1 / 15);
    assert.ok(.2 + brake.driveDelta >= 0, 'braking cannot launch into reverse');
    const simulate = hz => {
        let angle = 0, yaw = 0;
        for (let i = 0; i < hz * 2; i++) { angle = advanceSteering(config, angle, 1, 15, 1 / hz); yaw += vehicleHandling(config, 15, 0, yaw, angle, 1, 1 / hz).yawDelta; }
        return yaw;
    };
    assert.ok(Math.abs(simulate(30) - simulate(120)) < .02, 'steering stays consistent across frame rates');
}
globalThis.window = { devicePixelRatio: 1, dispatchEvent() {} };
const { GraphicsSettingsManager } = await load('src/game/settings/GraphicsSettingsManager.ts');
const manager = GraphicsSettingsManager.getInstance();
for (const dpr of [1, 1.25, 1.5, 2, 3]) for (const quality of ['LOW', 'MEDIUM', 'HIGH']) {
    window.devicePixelRatio = dpr; manager.setQuality(quality);
    assert.equal(800 / manager.getConfig().hardwareScalingLevel, 800 * dpr);
}
const { createDynamicSceneOptimizerOptions } = await load('src/game/engine/DynamicSceneOptimizer.ts');
for (const quality of ['LOW', 'MEDIUM', 'HIGH']) assert.ok(createDynamicSceneOptimizerOptions(quality).optimizations.every(step => !(step instanceof HardwareScalingOptimization)), 'optimizer cannot reintroduce resolution blur');
const { createSkyPixels, buildOuterLandscape } = await load('src/game/levels/OuterLandscape.ts');
// Exercise the real keyboard/focus handlers without launching a browser.
const { InputManager } = await load('src/game/utils/InputManager.ts');
globalThis.window = new EventTarget();
globalThis.document = new EventTarget();
globalThis.HTMLElement = class {};
const input = new InputManager();
const key = (type, value, code) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { key: value, code }); window.dispatchEvent(event); return event;
};
assert.ok(key('keydown', ' ', 'Space').defaultPrevented, 'Space must not scroll the page');
assert.ok(input.isKeyDown(' ')); assert.equal(input.isKeyDown('shift'), false, 'fire is separate from ability');
key('keyup', ' ', 'Space'); assert.equal(input.isKeyDown(' '), false);
input.joystickFiring = true; key('keydown', ' ', 'Space'); window.dispatchEvent(new Event('blur'));
assert.equal(input.joystickFiring, false); assert.equal(input.isKeyDown(' '), false);
input.joystickFiring = true; document.hidden = true; document.dispatchEvent(new Event('visibilitychange'));
assert.equal(input.joystickFiring, false, 'backgrounding cancels mobile trigger');
input.dispose(); key('keydown', ' ', 'Space'); assert.equal(input.isKeyDown(' '), false, 'teardown removes keyboard listener');
delete globalThis.document; delete globalThis.HTMLElement;
delete globalThis.window;
const engine = new NullEngine();
const skyFingerprints = new Set();
for (const theme of ['wasteland', 'facility', 'glacial', 'neon', 'race']) {
    const pixels = createSkyPixels(theme, 256, 128);
    for (let y = 0; y < 128; y++) assert.deepEqual(pixels.slice(y * 1024, y * 1024 + 4), pixels.slice(y * 1024 + 1020, y * 1024 + 1024), 'no panorama seam');
    skyFingerprints.add(Buffer.from(pixels).toString('base64'));
    const scene = new Scene(engine); buildOuterLandscape(scene, theme, 300);
    const material = scene.meshes[0].material;
    for (let i = 0; i < pixels.length; i += 4) {
        const output = [material.emissiveColor.r, material.emissiveColor.g, material.emissiveColor.b].map((base, channel) => Math.min(1, base + pixels[i + channel] / 255));
        assert.ok(output.some(channel => channel < .99), 'emissive addition must not wash the panorama to white');
    }
    assert.equal(scene.meshes.length, 1); assert.equal(scene.textures.length, 1);
    assert.ok(scene.meshes[0].infiniteDistance && !scene.meshes[0].isPickable && !scene.meshes[0].physicsBody);
    scene.dispose(); assert.equal(scene.textures.length, 0, 'map texture is released');
}
assert.equal(skyFingerprints.size, 5, 'every map has its own sky illustration');
engine.dispose();
console.log('PASS: seven vehicle classes, simultaneous throttle/steer, reverse, braking, frame rates, native DPR at every quality, five seamless skies and disposal.');
