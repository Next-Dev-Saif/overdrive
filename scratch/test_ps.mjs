import { NullEngine, Scene, ParticleSystem, RawTexture, FreeCamera, Vector3, MeshBuilder } from '@babylonjs/core';

const engine = new NullEngine();
const scene = new Scene(engine);
const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
camera.setTarget(Vector3.Zero());

const size = 128;
const pixels = new Uint8Array(size * size * 4);
const texture = RawTexture.CreateRGBATexture(pixels, size, size, scene, false, false);

const emitter = MeshBuilder.CreateBox("emitter", {size: 1}, scene);

function createPS() {
    const ps = new ParticleSystem("test", 100, scene);
    ps.particleTexture = texture;
    ps.emitter = emitter;
    ps.manualEmitCount = 100;
    ps.emitRate = 0;
    ps.minLifeTime = ps.maxLifeTime = 2;
    ps.updateFunction = (active) => {
        // ... custom logic ...
    };
    ps.start();
    return ps;
}

const ps1 = createPS();
scene.render();
scene.render(); // sometimes it takes 2 frames
console.log("PS1 active particles:", ps1.getActiveCount());
ps1.dispose(false);

const ps2 = createPS();
scene.render();
scene.render();
console.log("PS2 active particles:", ps2.getActiveCount());

engine.dispose();
