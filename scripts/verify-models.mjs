/** Headless geometry/articulation regression checks. No browser or graphics driver required. */
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { NullEngine, Scene, Mesh, Color3, VertexBuffer, Ray, Vector3, TransformNode } from '@babylonjs/core';
import { MergeMeshesOptimization, ParticlesOptimization, SceneOptimizerOptions } from '@babylonjs/core/Misc/sceneOptimizer.js';
const out = resolve('node_modules/.cache/overdrive-model-check');
await mkdir(out, { recursive: true });
for (const name of ['VehicleScale', 'ModelBounds', 'ModelBuilder', 'WeaponModel', 'WeaponAttachments', 'VehicleStyle', 'VehicleModel', 'ImportedVehicleModel']) {
    let source = await readFile(`src/game/models/${name}.ts`, 'utf8');
    if (name === 'ImportedVehicleModel') {
        for (const match of [...source.matchAll(/import (\w+) from '(\.\.\/\.\.\/assets\/[^']+)\?url';/g)]) {
            const data = await readFile(resolve('src/game/models', match[2]));
            source = source.replace(match[0], `const ${match[1]} = 'data:base64,${data.toString('base64')}';`);
        }
        source = source.replace("'@babylonjs/core/Loading/sceneLoader'", "'@babylonjs/core/Loading/sceneLoader.js'").replace("'@babylonjs/loaders/glTF'", "'@babylonjs/loaders/glTF/index.js'");
    }
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText.replace(/from '(\.\/[^']+)'/g, "from '$1.js'");
    await writeFile(`${out}/${name}.js`, code);
}
{
    const source = await readFile('src/game/engine/DynamicSceneOptimizer.ts', 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
        .replace("@babylonjs/core/Misc/sceneOptimizer'", "@babylonjs/core/Misc/sceneOptimizer.js'");
    await writeFile(`${out}/DynamicSceneOptimizer.js`, code);
}
const { MATCH_VEHICLE_SCALE, scaleVehicleVisuals } = await import(pathToFileURL(`${out}/VehicleScale.js`));
const { isVisibleModelMesh } = await import(pathToFileURL(`${out}/ModelBounds.js`));
const { buildImportedVehicleModel } = await import(pathToFileURL(`${out}/ImportedVehicleModel.js`));
const { buildVehicleModel } = await import(pathToFileURL(`${out}/VehicleModel.js`));
const { createDynamicSceneOptimizerOptions } = await import(pathToFileURL(`${out}/DynamicSceneOptimizer.js`));
const engine = new NullEngine();
for (const quality of ['LOW', 'MEDIUM', 'HIGH']) {
    const baseline = quality === 'LOW'
        ? SceneOptimizerOptions.HighDegradationAllowed()
        : SceneOptimizerOptions.ModerateDegradationAllowed();
    const options = createDynamicSceneOptimizerOptions(quality);
    assert.equal(options.optimizations.length, baseline.optimizations.length - 2, `${quality}: preserve optimizations except merging and global particle shutdown`);
    assert.ok(
        options.optimizations.every(optimization => !(optimization instanceof MergeMeshesOptimization) && !(optimization instanceof ParticlesOptimization)),
        `${quality}: articulated meshes must never enter the global merge optimizer`,
    );
}
const { ModelBuilder } = await import(pathToFileURL(`${out}/ModelBuilder.js`));
{
    const scene = new Scene(engine);
    const builder = new ModelBuilder(scene, new TransformNode('winding-test', scene));
    const hull = builder.loft('closed-hull', [[-1, 2, -1, 1], [1, 2, -1, 1]], builder.material('paint', '#aaaaaa'));
    const positions = hull.getVerticesData('position'), normals = hull.getVerticesData('normal');
    for (let i = 0; i < positions.length; i += 3) assert.ok(Vector3.Dot(Vector3.FromArray(positions, i), Vector3.FromArray(normals, i)) > 0, 'hull faces must point outward');
    scene.dispose();
}
const chassis = [
    ['interceptor', 2, .8, 4.2, .9], ['juggernaut', 3.5, 1.8, 5.5, 1.5], ['phantom', 1.8, .5, 4, .8],
    ['manticore', 2.8, 1.5, 5, 1.2], ['valkyrie', 2.2, .6, 4.8, .85], ['wraith', 2, .4, 3.5, .5], ['behemoth', 4, 2.5, 6, 2],
];
let maxMeshes = 0, maxVertices = 0;
for (const imported of [false, true]) for (const [id, width, height, depth, wheelScale] of chassis) for (const weapon of ['minigun', 'plasma', 'missile', 'mortar', 'nuke']) {
    const scene = new Scene(engine);
    const root = new Mesh('physics-root', scene);
    if (imported) await buildImportedVehicleModel(root, scene, id, weapon, { width, height, depth }, Color3.FromHexString('#b54c30'), wheelScale);
    else buildVehicleModel(root, id, weapon, { width, height, depth }, Color3.FromHexString('#b54c30'), wheelScale);
    if (imported) {
        const paint = root.getChildMeshes().find(mesh => mesh.name.endsWith('_paint'));
        assert.ok(paint && paint.material.albedoColor.equals(Color3.FromHexString('#b54c30')), `${id}: player-selected paint`);
        const tail = root.getChildMeshes().find(mesh => mesh.name.endsWith('_tail'));
        tail.computeWorldMatrix(true);
        assert.ok(tail.getBoundingInfo().boundingBox.maximumWorld.z < 0, `${id}: actual taillights face backward, nose faces driving +Z`);
        const bodyEnvelope = root.getChildTransformNodes().find(node => node.name === 'chassisRoot').metadata.weaponEnvelope;
        assert.ok(bodyEnvelope.depth >= depth * 1.2, `${id}: full-size model is not compressed to the former cabin height`);
        assert.ok(Math.abs(bodyEnvelope.bottom + (height + .6 * wheelScale + .2) / 2) < 1e-5, `${id}: larger body retains wheel contact height`);
        const expectedStyles = { interceptor: 'muscle', juggernaut: 'armored', phantom: 'track', manticore: 'expedition', valkyrie: 'track', wraith: 'muscle', behemoth: 'armored' };
        assert.ok(root.getChildTransformNodes().some(node => node.name === `style-${expectedStyles[id]}`), `${id}: assigned silhouette kit`);
        for (let index = 0; index < 4; index++) {
            const pivot = root.getChildTransformNodes().find(node => node.name === `wheelPivot${index}`);
            assert.ok(pivot.position.z * (index < 2 ? 1 : -1) > 0, `${id}: correct front/rear wheel axle`);
            assert.ok(pivot.position.x * (index % 2 ? -1 : 1) > 0, `${id}: correct left/right wheel corner`);
            const wheel = scene.getMeshByName(`wheel${index}`);
            const tire = wheel.getChildMeshes().find(mesh => mesh.name.startsWith('importedTire'));
            const vertex = Vector3.FromArray(tire.getVerticesData('position'), 0);
            const before = Vector3.TransformCoordinates(vertex, tire.computeWorldMatrix(true));
            wheel.rotation.x = .5;
            const after = Vector3.TransformCoordinates(vertex, tire.computeWorldMatrix(true));
            assert.ok(Vector3.Distance(before, after) > .02, `${id}: wheel spin animates actual tire geometry`);
            wheel.rotation.x = 0;
        }
    }
    const mountCount = ['juggernaut', 'phantom', 'manticore', 'behemoth'].includes(id) ? 2 : 1;
    const mounts = root.getChildTransformNodes(false).filter(node => node.name.startsWith('weapon_mount_'));
    assert.equal(mounts.length, mountCount, `${id}: vehicle-specific hardpoints`);
    if (mountCount === 2) {
        assert.equal(mounts[0].position.x, -mounts[1].position.x, `${id}: balanced side pods`);
        assert.equal(mounts[0].position.y, mounts[1].position.y);
    } else assert.equal(mounts[0].position.x, 0, `${id}: centered bonnet mount`);
    const meshes = root.getChildMeshes();
    // Use the preview's real predicate: transform-only attachment nodes must not
    // throw after the model loads, and hidden helpers must not affect framing.
    const helper = Mesh.CreateBox('hidden-preview-helper', 1, scene);
    helper.parent = root;
    helper.position.set(10000, 10000, 10000);
    helper.isVisible = false;
    const bounds = root.getHierarchyBoundingVectors(true, isVisibleModelMesh);
    assert.ok([...bounds.min.asArray(), ...bounds.max.asArray()].every(Number.isFinite), `${id}/${weapon}: preview bounds remain finite`);
    assert.ok(bounds.max.length() < 100, `${id}/${weapon}: hidden helpers excluded from framing`);
    for (const mount of mounts) assert.equal(isVisibleModelMesh(mount), false, `${id}: attachment transforms are not render meshes`);
    helper.dispose();
    assert.equal(meshes.filter(m => /^wheel\d$/.test(m.name)).length, id === 'wraith' && !imported ? 0 : 4, `${id}: wheel articulation`);
    assert.equal(meshes.filter(m => m.name === 'turret_base').length, mountCount);
    assert.equal(meshes.filter(m => m.name === 'turretbox').length, mountCount);
    const barrels = meshes.filter(m => m.name === 'barrel');
    assert.ok(barrels.length > 0, `${weapon}: muzzle discovery`);
    assert.ok(barrels.every(m => m.parent.name === 'turretbox'));
    const muzzleSockets = root.getChildTransformNodes(false).filter(node => node.name === 'muzzle_socket');
    assert.equal(muzzleSockets.length, mountCount * (weapon === 'minigun' ? 6 : weapon === 'missile' ? 4 : 1), `${weapon}: authored muzzle sockets`);
    assert.ok(muzzleSockets.every(socket => socket.parent?.name === 'turretbox'), `${weapon}: muzzle sockets follow turret pitch`);
    assert.ok(muzzleSockets.every(socket => socket.position.z > 1.1), `${weapon}: muzzle sockets sit at launch-tube exits`);
    const wheelDetail = meshes.find(m => m.parent?.name === 'wheel0' && m.getTotalVertices() > 0);
    const turretDetail = meshes.find(m => m.parent?.name === 'turretbox' && m.getTotalVertices() > 0);
    if (id !== 'wraith' || imported) assert.ok(wheelDetail, `${id}: wheel detail must retain its articulation parent`);
    assert.ok(turretDetail, `${weapon}: turret detail must retain its articulation parent`);
    for (const mesh of meshes) {
        for (const kind of [VertexBuffer.PositionKind, VertexBuffer.NormalKind]) {
            assert.ok(Array.from(mesh.getVerticesData(kind) ?? []).every(Number.isFinite), `${id}/${weapon}: finite geometry`);
        }
        mesh.computeWorldMatrix(true);
    }
    if (imported) {
        const body = meshes.filter(mesh => mesh.getTotalVertices() && mesh.isEnabled() && !mounts.some(mount => mesh.isDescendantOf(mount)));
        const maxX = Math.max(...body.map(mesh => mesh.getBoundingInfo().boundingBox.maximumWorld.x));
        const minX = Math.min(...body.map(mesh => mesh.getBoundingInfo().boundingBox.minimumWorld.x));
        const roofY = Math.max(...body.map(mesh => mesh.getBoundingInfo().boundingBox.maximumWorld.y));
        assert.ok(mounts.every(mount => mount.getAbsolutePosition().y < roofY), `${id}: mounts remain below roof/ladder`);
        // Side-pod muzzles must stay outside the cab over the full acquisition cone.
        if (mountCount === 2) for (const yaw of [-Math.PI / 6, 0, Math.PI / 6]) {
            for (const base of meshes.filter(mesh => mesh.name === 'turret_base')) base.rotation.y = yaw;
            for (const socket of muzzleSockets) {
                socket.computeWorldMatrix(true);
                const x = socket.getAbsolutePosition().x;
                assert.ok(x < minX || x > maxX, `${id}/${weapon}: side muzzle clears body at yaw ${yaw}`);
            }
        }
        for (const base of meshes.filter(mesh => mesh.name === 'turret_base')) base.rotation.y = 0;
        for (const mesh of meshes) mesh.computeWorldMatrix(true);
    }
    // Combat rays must still resolve the visible model through the same gameplay predicate.
    const hit = scene.pickWithRay(new Ray(new Vector3(0, 0, depth + 5), new Vector3(0, 0, -1), depth + 10), mesh => mesh.isVisible && mesh.isDescendantOf(root));
    assert.ok(hit?.hit, `${id}/${weapon}: weapon hit-test geometry`);
    // Rotation must move the muzzle while preserving its local pitch hierarchy.
    const before = barrels[0].getAbsolutePosition().clone();
    scene.getMeshByName('turret_base').rotation.y = Math.PI / 2;
    barrels[0].computeWorldMatrix(true);
    assert.ok(barrels[0].getAbsolutePosition().subtract(before).length() > .1);
    const movingParts = [wheelDetail, turretDetail].filter(Boolean);
    const movingPartsBefore = movingParts.map(mesh => { mesh.computeWorldMatrix(true); return mesh.getAbsolutePosition().clone(); });
    const rootDelta = new Vector3(9, 2, -4);
    root.position.addInPlace(rootDelta);
    root.computeWorldMatrix(true);
    movingParts.forEach((mesh, index) => {
        mesh.computeWorldMatrix(true);
        const actualDelta = mesh.getAbsolutePosition().subtract(movingPartsBefore[index]);
        assert.ok(actualDelta.subtract(rootDelta).length() < 1e-5, `${id}/${weapon}: articulated detail must follow the moving root`);
    });
    const renderMeshes = meshes.filter(m => m.getTotalVertices() > 0).length;
    maxMeshes = Math.max(maxMeshes, renderMeshes);
    maxVertices = Math.max(maxVertices, meshes.reduce((n, m) => n + m.getTotalVertices(), 0));
    assert.ok(renderMeshes < 50, `${id}/${weapon}: static details must stay merged`);
    const visual = root.getChildTransformNodes(true).find(node => node.name === 'visualRoot');
    const beforeScale = visual.getHierarchyBoundingVectors(true, isVisibleModelMesh);
    const beforeSize = beforeScale.max.subtract(beforeScale.min);
    const beforeMuzzles = muzzleSockets.map(socket => { socket.computeWorldMatrix(true); return socket.getAbsolutePosition().subtract(root.position); });
    scaleVehicleVisuals(root, MATCH_VEHICLE_SCALE);
    const afterScale = visual.getHierarchyBoundingVectors(true, isVisibleModelMesh);
    const expectedSize = beforeSize.scale(MATCH_VEHICLE_SCALE);
    assert.ok(afterScale.max.subtract(afterScale.min).subtract(expectedSize).length() < 1e-4, `${id}/${weapon}: complete visual geometry scales uniformly`);
    assert.deepEqual(root.scaling.asArray(), [1, 1, 1], 'physics/network root must not inherit visual scale');
    muzzleSockets.forEach((socket, index) => {
        socket.computeWorldMatrix(true);
        const expected = beforeMuzzles[index].scale(MATCH_VEHICLE_SCALE).add(root.position);
        assert.ok(socket.getAbsolutePosition().subtract(expected).length() < 1e-4, `${id}/${weapon}: scaled muzzle remains attached`);
    });
    scene.dispose();
}
// Source measurements must not incorporate the gameplay spawn transform.
for (const [id, width, height, depth, wheelScale] of chassis) {
    const positions = [];
    for (const translated of [false, true]) {
        const scene = new Scene(engine);
        const root = new Mesh('spawn-root', scene);
        if (translated) { root.position.set(100, 7, -80); root.rotation.y = 1.2; }
        await buildImportedVehicleModel(root, scene, id, 'minigun', { width, height, depth }, Color3.White(), wheelScale);
        positions.push(root.getChildTransformNodes(false).filter(node => node.name.startsWith('weapon_mount_')).map(node => node.position.asArray()));
        scene.dispose();
    }
    assert.deepEqual(positions[0], positions[1], `${id}: mount layout is independent of spawn position/heading`);
}
engine.dispose();
console.log(`PASS: 70 imported/procedural loadouts; finite geometry, wheel counts, turret articulation, muzzles and mesh budget. Max ${maxMeshes} render meshes / ${maxVertices} vertices.`);

// Race pickups must mount and unmount repeatedly without retaining old geometry/materials.
{
    const source = await readFile('src/game/race/RaceVehicleEquipment.ts', 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText.replace('../models/WeaponAttachments', './WeaponAttachments.js');
    await writeFile(`${out}/RaceVehicleEquipment.js`, code);
    const { equipRaceWeapon } = await import(pathToFileURL(`${out}/RaceVehicleEquipment.js`));
    const raceEngine = new NullEngine(), scene = new Scene(raceEngine), root = new Mesh('race-car', scene);
    await buildImportedVehicleModel(root, scene, 'interceptor', 'none', { width: 2, height: .8, depth: 4.2 }, Color3.White(), .9);
    assert.equal(root.getChildTransformNodes().filter(n => n.name.startsWith('weapon_mount_')).length, 0);
    const materialCount = scene.materials.length, meshCount = scene.meshes.length;
    for (let cycle = 0; cycle < 3; cycle++) for (const weapon of ['minigun', 'missile', 'plasma', 'mortar', 'nuke']) {
        equipRaceWeapon(root, weapon);
        assert.equal(root.getChildTransformNodes().filter(n => n.name.startsWith('weapon_mount_')).length, 1);
        assert.ok(root.getChildTransformNodes().some(n => n.name === 'muzzle_socket'));
        equipRaceWeapon(root, null);
        assert.equal(scene.meshes.length, meshCount, 'old weapon meshes are released');
        assert.equal(scene.materials.length, materialCount, 'old weapon materials are released');
    }
    scene.dispose(); raceEngine.dispose();
    console.log('PASS: Interceptor starts unarmed and all five pickup weapons mount/remove repeatedly without resource growth.');
}
