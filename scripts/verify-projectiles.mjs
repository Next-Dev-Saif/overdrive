/** Verify the imported projectile geometry and scene-owned presentation pools without a browser. */
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { Mesh, NullEngine, Scene, Vector3, VertexData } from '@babylonjs/core';
const out = resolve('node_modules/.cache/overdrive-projectile-check');
const compiled = new Set();
async function compile(file) {
    if (compiled.has(file)) return;
    compiled.add(file);
    const source = await readFile(file, 'utf8');
    let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
    for (const match of code.matchAll(/from ["'](\.[^"']+)["']/g)) await compile(resolve(dirname(file), `${match[1]}.ts`));
    code = code.replace(/from (["'])(\.[^"']+)\1/g, 'from $1$2.js$1');
    const target = resolve(out, file.replace(`${process.cwd()}/`, '').replace(/\.ts$/, '.js'));
    await mkdir(dirname(target), { recursive: true }); await writeFile(target, code);
}
await compile(resolve('src/game/weapons/WeaponController.ts'));
const load = file => import(pathToFileURL(resolve(out, file)));
const { createProjectileModel, PROJECTILE_PROFILES } = await load('src/game/models/ProjectileModel.js');
const { PROJECTILE_GEOMETRY } = await load('src/assets/models/prepared/ProjectileGeometry.js');
const { WeaponController } = await load('src/game/weapons/WeaponController.js');
const { VfxManager } = await load('src/game/vfx/VfxManager.js');
const { isProjectileCollisionCandidate } = await load('src/game/weapons/ProjectileCollision.js');
VfxManager.getInstance = () => ({ attachSmokeTrail: () => ({ start() {}, stop() {} }), attachFireTrail: () => ({ start() {}, stop() {} }) });
const engine = new NullEngine(), scene = new Scene(engine);
const report = JSON.parse(await readFile('docs/assets/prepared-projectiles.json', 'utf8'));
for (const entry of report) {
    assert.equal(createHash('sha256').update(await readFile(entry.source, 'utf8')).digest('hex'), entry.sha256);
    const kind = entry.kind, data = PROJECTILE_GEOMETRY[kind];
    assert.equal(data.indices.length / 3, entry.triangles);
    assert.ok(data.indices.every(i => i >= 0 && i < data.positions.length / 3));
    assert.ok([...data.positions, ...data.normals, ...data.uvs].every(Number.isFinite));
    // Check Babylon winding against the supplied outward normals on every nondegenerate face.
    let aligned = 0, opposed = 0;
    const computed = []; VertexData.ComputeNormals(data.positions, data.indices, computed);
    for (let i = 0; i < computed.length; i += 3) {
        const dot = Vector3.Dot(Vector3.FromArray(computed, i), Vector3.FromArray(data.normals, i));
        if (dot > 0.1) aligned++; else if (dot < -0.1) opposed++;
    }
    assert.ok(aligned > opposed * 10, `${kind}: winding agrees with outward normals (${aligned}/${opposed})`);
    const first = createProjectileModel(scene, kind), second = createProjectileModel(scene, kind);
    const a = first.getChildMeshes()[0], b = second.getChildMeshes()[0];
    assert.equal(a.geometry, b.geometry); assert.equal(a.material, b.material);
    assert.equal(a.isEnabled(), true);
    a.computeWorldMatrix(true);
    const bounds = a.getBoundingInfo().boundingBox;
    assert.ok(Math.abs(bounds.maximum.z - bounds.minimum.z - PROJECTILE_PROFILES[kind].length) < .00001);
    assert.ok(bounds.center.length() < .00001, 'geometry centered at simulation origin');
    assert.equal(a.isPickable, false);
    assert.equal(isProjectileCollisionCandidate(a, second, new Mesh('owner', scene)), false);
    const weapon = new WeaponController(scene, new Mesh('shooter', scene), kind, 'test', false);
    const shot = weapon.getPooledProjectile(kind);
    assert.equal(shot.getChildMeshes().filter(mesh => mesh.name.endsWith('-projectile-shell')).length, 1);
    const emitter = shot.getChildTransformNodes().find(node => node.name.endsWith('-trail-emitter'));
    assert.ok(emitter.position.z < -entry.length / 2, 'trail behind shell');
    weapon.releaseProjectile(shot);
    assert.equal(shot.isEnabled(), false);
    assert.equal(weapon.getPooledProjectile(kind), shot, 'pool reuses hierarchy');
    weapon.releaseProjectile(shot);
    const otherScene = new Scene(engine);
    const otherWeapon = new WeaponController(otherScene, new Mesh('other', otherScene), kind, 'other', false);
    const otherShot = otherWeapon.getPooledProjectile(kind);
    assert.equal(otherShot.getScene(), otherScene, 'pool never crosses scenes');
    otherScene.dispose();
    weapon.dispose();
}
scene.dispose(); engine.dispose();
console.log('PASS: OBJ provenance, triangle counts, normals/winding, bounds, shared geometry/materials, collision exclusion, tail anchors, pooling and scene isolation.');
