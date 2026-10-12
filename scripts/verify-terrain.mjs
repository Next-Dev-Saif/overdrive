/** Actual Havok regression: drops and fast traversals over the arena's solid terrain. */
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import ts from 'typescript';
import HavokPhysics from '@babylonjs/havok';
import { NullEngine, Scene, MeshBuilder, StandardMaterial, PhysicsAggregate, PhysicsShapeType, HavokPlugin, Vector3, PhysicsPrestepType } from '@babylonjs/core';
const out = resolve('node_modules/.cache/overdrive-terrain-check');
await mkdir(out, { recursive: true });
const source = await readFile('src/game/levels/ArenaTerrain.ts', 'utf8');
await writeFile(`${out}/ArenaTerrain.js`, ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText);
const { addRaisedTerrain, groundHeight, recoveryHeight } = await import(pathToFileURL(`${out}/ArenaTerrain.js`));
const havok = await HavokPhysics({ wasmBinary: await readFile('node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm') });
const engine = new NullEngine();
let checks = 0;
for (const scale of [1, 1.5]) for (const mass of [600, 1000, 6000]) for (const [x, z, speed] of [[0, 0, 0], [-70, 55, 0], [80, -65, 0], [-130, 55, 28]]) {
    const scene = new Scene(engine);
    scene.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, havok));
    const ground = MeshBuilder.CreateCylinder('ground', { diameter: 600, height: 20, tessellation: 64 }, scene);
    ground.position.y = -10; ground.metadata = { terrain: true };
    new PhysicsAggregate(ground, PhysicsShapeType.CYLINDER, { mass: 0 }, scene);
    addRaisedTerrain(scene, new StandardMaterial('groundMat', scene), 600);
    scene.meshes.forEach(mesh => mesh.computeWorldMatrix(true));
    const car = MeshBuilder.CreateBox('vehicle', { width: 3 * scale, height: 2 * scale, depth: 5 * scale }, scene);
    car.position.set(x, 20, z);
    const body = new PhysicsAggregate(car, PhysicsShapeType.BOX, { mass, friction: .25, restitution: .05 }, scene).body;
    body.setLinearVelocity(new Vector3(speed, -15, 0));
    for (let frame = 0; frame < 240; frame++) {
        // Six 120 Hz steps per simulated 20 FPS render frame.
        for (let substep = 0; substep < 6; substep++) scene.getPhysicsEngine()._step(1 / 120);
        const surface = groundHeight(scene, car.position.x, car.position.z);
        assert.ok(surface === null || car.position.y >= surface - .1, `mass ${mass}: penetrated terrain at ${car.position}`);
        checks++;
    }
    car.position.set(0, -2, 0);
    assert.ok(Math.abs(recoveryHeight(scene, car, scale) - (scale + 0.2)) < 1e-6, 'penetration recovery height within floating-point tolerance');
    car.position.y = recoveryHeight(scene, car, scale);
    body.setPrestepType(PhysicsPrestepType.TELEPORT); body.setLinearVelocity(Vector3.Zero());
    scene.getPhysicsEngine()._step(1 / 120);
    body.setPrestepType(PhysicsPrestepType.DISABLED);
    assert.ok(car.position.y > 1, 'recovery must teleport the physics body above the surface');
    car.position.y = 12;
    assert.equal(recoveryHeight(scene, car, scale), null, 'airborne vehicles must not be snapped down');
    scene.dispose();
}
engine.dispose();
console.log(`PASS: ${checks} terrain checks; light/medium/heavy drops, high-speed traversal, 20 FPS substeps, penetration recovery and airborne preservation.`);
