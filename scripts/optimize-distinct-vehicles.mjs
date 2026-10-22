/** Finish Blender exports with bounded-error simplification and report actual runtime costs. */
import { writeFile } from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { dedup, prune, weld, simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
const io = new NodeIO();
await MeshoptSimplifier.ready;
const report = [];
for (const vehicle of ['phantom', 'manticore', 'valkyrie', 'wraith', 'behemoth']) {
    const path = `src/assets/models/prepared/${vehicle}.glb`;
    const doc = await io.read(path);
    await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: .65, error: .001 }), dedup(), prune());
    const data = await io.writeBinary(doc);
    await writeFile(path, data);
    const triangles = doc.getRoot().listMeshes().reduce((sum, mesh) => sum + mesh.listPrimitives().reduce((n, p) => n + p.getIndices().getCount() / 3, 0), 0);
    report.push({ vehicle, path, triangles, bytes: data.length, meshes: doc.getRoot().listMeshes().length });
}
await writeFile('docs/assets/distinct-vehicles.json', JSON.stringify(report, null, 2) + '\n');
console.log(report);
