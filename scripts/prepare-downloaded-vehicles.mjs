/** Offline asset preparation. Originals stay intact; outputs need no runtime decoders/textures. */
import { mkdir, writeFile } from 'node:fs/promises';
import { Document, NodeIO } from '@gltf-transform/core';
import { compactPrimitive, dedup, joinPrimitives, prune, simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { Matrix, Vector3 } from '@babylonjs/core';

const io = new NodeIO();
await MeshoptSimplifier.ready;
await mkdir('src/assets/models/prepared', { recursive: true });
const report = [];
for (const sourceId of [1, 2]) {
    const source = await io.read(`public/assets/vehicle-model-downloaded-${sourceId}.glb`);
    const doc = new Document(), scene = doc.createScene('game-ready-vehicle'), buffer = doc.createBuffer();
    const parts = new Map();
    const colors = { paint: [.55, .55, .55, 1], trim: [.025, .032, .038, 1], glass: [.055, .11, .145, 1], alloy: [.38, .42, .45, 1], tire: [.018, .021, .025, 1], lamp: [.8, .82, .7, 1], tail: [.5, .035, .02, 1] };
    const materials = Object.fromEntries(Object.entries(colors).map(([name, color]) => [name, doc.createMaterial(name).setBaseColorFactor(color).setMetallicFactor(name === 'alloy' ? .7 : name === 'paint' ? .4 : 0).setRoughnessFactor(name === 'tire' ? .92 : name === 'glass' ? .22 : .48).setDoubleSided(true)]));
    let inputTriangles = 0;
    const min = new Vector3(Infinity, Infinity, Infinity), max = new Vector3(-Infinity, -Infinity, -Infinity);
    const extracted = [];
    for (const node of source.getRoot().listNodes()) {
        if (!node.getMesh()) continue;
        const world = Matrix.FromArray(node.getWorldMatrix());
        for (const primitive of node.getMesh().listPrimitives()) {
            inputTriangles += primitive.getIndices().getCount() / 3;
            const name = primitive.getMaterial().getName(), nodeName = node.getName();
            // Remove invisible duplicate paint shells and expensive cabin internals behind opaque glass.
            if (sourceId === 1 && ['Meshpart124Mtl', 'Meshpart80Mtl', 'Sombra1Mtl'].includes(name)) continue;
            if (sourceId === 2 && ['Interior', 'Tiked', 'Engine', 'Badge', 'Badge_SetA', 'plate'].includes(name)) continue;
            const positions = primitive.getAttribute('POSITION'), normals = primitive.getAttribute('NORMAL');
            const p = new Float32Array(positions.getCount() * 3), n = new Float32Array(p.length);
            for (let i = 0; i < positions.getCount(); i++) {
                const point = Vector3.TransformCoordinates(Vector3.FromArray(positions.getElement(i, [])), world);
                const normal = Vector3.TransformNormal(Vector3.FromArray(normals.getElement(i, [])), world).normalize();
                // Babylon left-handed GLB conversion reflects X, preserving Z. Export front +Z.
                const oriented = sourceId === 1 ? new Vector3(point.z, point.y, -point.x) : new Vector3(point.x, point.y, point.z);
                const orientedNormal = sourceId === 1 ? new Vector3(normal.z, normal.y, -normal.x) : new Vector3(normal.x, normal.y, normal.z);
                oriented.toArray(p, i * 3); orientedNormal.toArray(n, i * 3); min.minimizeInPlace(oriented); max.maximizeInPlace(oriented);
            }
            let kind = 'trim', wheel = false;
            if (sourceId === 1) {
                if (name === 'Meshpart123Mtl' || name === '1Mtl') kind = 'paint';
                if (name === 'Meshpart6Mtl' || name === 'Meshpart2Mtl') kind = 'glass';
                if (name === 'Meshpart4Mtl' || name === 'Rin1Mtl') kind = 'alloy';
                if (name === 'Neumatico1Mtl') kind = 'tire';
                if (name === 'Meshpart106Mtl') kind = 'lamp';
                if (name === 'Meshpart116Mtl') kind = 'tail';
                wheel = name === 'Neumatico1Mtl' || name === 'Rin1Mtl';
            } else {
                if (name === 'CarPaint') kind = 'paint';
                if (name === 'Window' || name === 'Light_glass') kind = 'glass';
                if (/Chrome|Nickel|phong2[01]|mirror/.test(name)) kind = 'alloy';
                if (name.includes('Wheel2A')) kind = 'tire';
                if (name === 'Lights') kind = 'lamp';
                if (name === 'Red_Glass') kind = 'tail';
                wheel = /polySurface|Rim_Main|RimBadge/.test(nodeName);
            }
            extracted.push({ p, n, indices: primitive.getIndices().getArray(), kind, wheel });
        }
    }
    const center = min.add(max).scale(.5), scale = 5 / (max.z - min.z);
    for (const { p, n, indices, kind, wheel } of extracted) {
        for (let i = 0; i < p.length; i += 3) { p[i] = (p[i] - center.x) * scale; p[i + 1] = (p[i + 1] - min.y) * scale; p[i + 2] = (p[i + 2] - center.z) * scale; }
        const groups = new Map();
        for (let i = 0; i < indices.length; i += 3) {
            const a = indices[i] * 3, b = indices[i + 1] * 3, c = indices[i + 2] * 3;
            const corner = wheel ? `${p[a + 2] + p[b + 2] + p[c + 2] > 0 ? 'front' : 'rear'} ${p[a] + p[b] + p[c] < 0 ? 'right' : 'left'} ` : '';
            const key = `${corner}${kind}`, group = groups.get(key) ?? [];
            group.push(indices[i], indices[i + 1], indices[i + 2]); groups.set(key, group);
        }
        for (const [name, group] of groups) {
            const prim = doc.createPrimitive().setMaterial(materials[kind]);
            prim.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(p.slice()).setBuffer(buffer));
            prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(n.slice()).setBuffer(buffer));
            prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(group)).setBuffer(buffer));
            compactPrimitive(prim);
            const list = parts.get(name) ?? []; list.push(prim); parts.set(name, list);
        }
    }
    for (const [name, primitives] of parts) scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(joinPrimitives(primitives))));
    await doc.transform(prune(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: sourceId === 1 ? .10 : .24, error: .008 }), dedup(), prune());
    const path = `src/assets/models/prepared/${sourceId === 1 ? 'armored-suv' : 'muscle-coupe'}.glb`;
    const data = await io.writeBinary(doc); await writeFile(path, data);
    const triangles = doc.getRoot().listMeshes().reduce((sum, mesh) => sum + mesh.listPrimitives().reduce((n, prim) => n + prim.getIndices().getCount() / 3, 0), 0);
    report.push({ source: sourceId, path, inputTriangles, triangles, bytes: data.length, meshes: doc.getRoot().listMeshes().length, dimensions: max.subtract(min).scale(scale).asArray() });
}
await mkdir('docs/assets', { recursive: true });
await writeFile('docs/assets/prepared-vehicles.json', JSON.stringify(report, null, 2) + '\n');
console.log(report);
