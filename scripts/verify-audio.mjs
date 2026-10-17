/** Headless audio lifecycle checks; listening quality remains a manual playtest. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`;
const assetsUrl = moduleUrl(await readFile('src/game/engine/AudioAssets.ts', 'utf8'));
const { AUDIO_ASSETS, AUDIO_ASSET_ROOT } = await import(assetsUrl);
let payload = 0;
for (const file of Object.values(AUDIO_ASSETS)) {
    const shipped = await readFile(`public${AUDIO_ASSET_ROOT}${file}`);
    assert.deepEqual(shipped, await readFile(`new-assets/audio/${file}`));
    assert.equal(shipped.subarray(0, 4).toString(), 'OggS');
    payload += shipped.length;
}
assert.ok(payload < 300_000);
class Node {
    gain = { value: 1, setTargetAtTime(value) { this.value = value; } };
    playbackRate = { value: 1, setTargetAtTime(value) { this.value = value; } };
    connect() {} disconnect() { this.disconnected = true; }
    start() { this.started = true; } stop() { this.stopped = true; }
}
const contexts = [];
class Context {
    state = 'running'; destination = {}; currentTime = 0; sources = []; gains = [];
    constructor() { contexts.push(this); }
    createGain() { const n = new Node(); this.gains.push(n); return n; }
    createBufferSource() { const n = new Node(); this.sources.push(n); return n; }
    async decodeAudioData(buffer) { return { bytes: buffer.byteLength }; }
    async resume() { this.state = 'running'; }
}
globalThis.window = { AudioContext: Context, addEventListener() {} };
globalThis.Audio = class { paused = true; volume = 1; play() { this.paused = false; return Promise.resolve(); } pause() { this.paused = true; } };
let failEngine = false;
globalThis.fetch = async url => ({ ok: !(failEngine && url.endsWith('v8deep.ogg')), status: 404, arrayBuffer: async () => new ArrayBuffer(8) });
const source = (await readFile('src/game/engine/SoundManager.ts', 'utf8'))
    .replace('import { Scene, Vector3 } from "@babylonjs/core";', '')
    .replaceAll('"./AudioAssets"', JSON.stringify(assetsUrl));
const { SoundManager } = await import(moduleUrl(source));
const sound = SoundManager.getInstance();
await new Promise(resolve => setImmediate(resolve));
const ctx = contexts[0];
assert.equal(ctx.sources.filter(s => s.loop).length, 1, 'one engine loop after decode');
sound.init({ activeCamera: null });
sound.playWeapon('minigun', {});
assert.equal(ctx.sources.at(-1).started, true);
for (let i = 0; i < 80; i++) sound.playWeapon('plasma', {});
assert.equal(ctx.sources.length, 33, '32 transient voice cap plus engine');
ctx.sources[1].onended();
sound.playDeath({});
assert.equal(ctx.sources.length, 34, 'finished voices free a slot');
const ordinaryVoice = ctx.sources.find(voice => !voice.loop && !voice.disconnected);
const stopPriority = sound.playAbility('lightning', {}, true);
assert.equal(ctx.sources.length, 35, 'ability plays even at the combat voice limit');
assert.equal(ordinaryVoice.stopped, true, 'ability replaces an ordinary voice');
assert.equal(ctx.gains.at(-1).gain.value, 0.95, 'ability gain raised from 0.5');
stopPriority(); stopPriority();
assert.equal(ctx.sources.at(-1).stopped, true, 'ability cancellation is idempotent');
sound.cleanup();
assert.ok(ctx.sources.filter(s => !s.loop).every(s => s.stopped || s.disconnected), 'cleanup releases all transient voices');
sound.init({ activeCamera: null });
sound.setVolume(0);
const beforeMute = ctx.sources.length;
sound.playPickup();
assert.equal(ctx.sources.length, beforeMute, 'muting suppresses new voices');
sound.setVolume(Number.NaN); assert.equal(sound.getVolume(), 0);
sound.setVolume(1);
sound.init({ activeCamera: {} });
// No panner exists in this fake context: a local cue must bypass chase-camera attenuation.
for (const ability of ['lightning', 'shockwave', 'phantom', 'manticore', 'valkyrie', 'wraith', 'behemoth']) {
    const stop = sound.playAbility(ability, { x: 0, y: 0, z: 0 }, true);
    assert.equal(ctx.sources.at(-1).buffer, sound.buffers.get(ability), `${ability}: correct supplied clip`);
    assert.equal(ctx.gains.at(-1).gain.value, .95);
    stop();
}
sound.init({ activeCamera: null });
sound.playWeapon('plasma', {});
assert.equal(ctx.gains.at(-1).gain.value, .95, 'laser gain raised from .55');
sound.cleanup(); sound.init({ activeCamera: null });
sound.updateEngineSound(1000, true);
assert.equal(ctx.sources[0].playbackRate.value, 2.4, 'engine pitch bounded');
sound.stopEngineSound(); assert.equal(ctx.gains[1].gain.value, 0);
failEngine = true;
const errors = []; const originalError = console.error;
console.error = (...args) => errors.push(args);
SoundManager.instance = undefined;
SoundManager.getInstance();
await new Promise(resolve => setImmediate(resolve));
console.error = originalError;
assert.equal(contexts[1].sources.length, 0, 'failed engine load starts no loop');
assert.equal(errors.length, 1, 'failed load reported once');
console.log(`Audio checks passed: ${Object.keys(AUDIO_ASSETS).length} clips, ${payload} bytes; playback, voice cap, mute, cleanup, pitch and load failure.`);
