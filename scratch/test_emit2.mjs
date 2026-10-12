import { NullEngine, Scene, ParticleSystem, RawTexture, FreeCamera, Vector3, MeshBuilder } from '@babylonjs/core';

const engine = new NullEngine();
const scene = new Scene(engine);
const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
camera.setTarget(Vector3.Zero());

const size = 128;
const pixels = new Uint8Array(size * size * 4);
const texture = RawTexture.CreateRGBATexture(pixels, size, size, scene, false, false);
const emitter = MeshBuilder.CreateBox("emitter", {size: 1}, scene);

const ps = new ParticleSystem("test", 100, scene);
ps.particleTexture = texture;
ps.emitter = emitter;
ps.manualEmitCount = 100;
ps.emitRate = 0;
ps.minLifeTime = ps.maxLifeTime = 2;

console.log("PS isReady?", ps.isReady());

ps.start();
for(let i=0; i<10; i++) scene.render();
console.log("Run 1 active particles:", ps.getActiveCount());
console.log("Run 1 isStarted:", ps.isStarted());

ps.stop();
ps.reset();

ps.manualEmitCount = 100;
ps.start();
for(let i=0; i<10; i++) scene.render();
console.log("Run 2 active particles:", ps.getActiveCount());

engine.dispose();
