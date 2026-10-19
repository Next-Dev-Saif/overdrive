/** Aftermath silhouette, quality budget, terrain projection and lifecycle checks. */
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { NullEngine, Scene, MeshBuilder, FreeCamera, RawTexture, Vector3 } from '@babylonjs/core';
const out = resolve('node_modules/.cache/overdrive-aftermath'); await mkdir(out, { recursive: true });
const source = await readFile('src/game/vfx/ExplosionAftermath.ts', 'utf8');
await writeFile(`${out}/ExplosionAftermath.js`, ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText);
const { createExplosionAftermath } = await import(pathToFileURL(`${out}/ExplosionAftermath.js`));
let clock = 0; mock.method(performance, 'now', () => clock);
const engine = new NullEngine();
for (const density of [0, .5, 1]) {
 const scene = new Scene(engine), ground = MeshBuilder.CreateGround('terrain', { width: 300, height: 300, subdivisions: 8 }, scene);
 ground.metadata = { terrain: true }; ground.computeWorldMatrix(true);
 const camera = new FreeCamera('camera', new Vector3(0, 20, -120), scene); camera.setTarget(new Vector3(0, 65, 0));
 const smoke = RawTexture.CreateRGBATexture(new Uint8Array([255,255,255,255]),1,1,scene);
 void scene.defaultMaterial; // Decal extraction lazily requests this scene-owned material.
 const baseline = { meshes: scene.meshes.length, textures: scene.textures.length, materials: scene.materials.length };
 const cleanup = createExplosionAftermath(scene, Vector3.Zero(),60,true,smoke,density);
 const cloud = scene.getMeshByName('nuclear-mushroom-cloud'), mark = scene.getMeshByName('ordnance-scorch');
 assert.ok(mark && mark.getTotalVertices() > 0, 'scorch projects onto actual terrain');
 assert.ok(cloud && cloud.getTotalVertices() <= 120, 'cloud exists even on LOW with bounded geometry');
 assert.equal(cloud.isPickable,false); assert.ok(mark.metadata.presentationOnly);
 clock += 5000; scene.onBeforeRenderObservable.notifyObservers(scene);
 const vertices = cloud.getVerticesData('position');
 const heights = vertices.filter((_,i)=>i%3===1), widths=vertices.filter((_,i)=>i%3===0);
 assert.ok(Math.max(...heights)>120,'nuclear cloud rises high above vehicles');
 assert.ok(Math.max(...widths)-Math.min(...widths)>90,'wide mushroom cap');
 clock += 16000; scene.onBeforeRenderObservable.notifyObservers(scene);
 assert.ok(mark.visibility>0 && mark.visibility<1,'mark fades before removal');
 clock += 4000; scene.onBeforeRenderObservable.notifyObservers(scene); cleanup();
 assert.equal(scene.meshes.length,baseline.meshes); assert.equal(scene.textures.length,baseline.textures); assert.equal(scene.materials.length,baseline.materials);
 for(let i=0;i<12;i++) createExplosionAftermath(scene,Vector3.Zero(),60,true,smoke,density);
 assert.ok(scene.meshes.length-baseline.meshes <= (density===0?3:6)*2,'concurrent detonations are capped');
 scene.dispose(); assert.equal(scene.textures.length,0);
}
{
 const scene = new Scene(engine), ground=MeshBuilder.CreateGround('terrain',{width:100,height:100},scene); ground.metadata={terrain:true};ground.computeWorldMatrix(true);
 const smoke=RawTexture.CreateRGBATexture(new Uint8Array([255,255,255,255]),1,1,scene);
 createExplosionAftermath(scene,Vector3.Zero(),30,false,smoke,0);
 assert.ok(scene.getMeshByName('ordnance-scorch'));assert.equal(scene.getMeshByName('nuclear-mushroom-cloud'),null);
 clock+=15000;scene.onBeforeRenderObservable.notifyObservers(scene);assert.equal(scene.getMeshByName('ordnance-scorch'),null);scene.dispose();
}
engine.dispose();mock.restoreAll();
console.log('PASS: terrain scorch, tall/wide nuclear cloud on every tier, fade/expiry, concurrency caps and scene disposal.');
