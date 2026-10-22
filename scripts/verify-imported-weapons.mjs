/** Verify downloaded provenance, prepared geometry and authored firing sockets without a browser. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Vector3, VertexData } from '@babylonjs/core';
const source = await readFile('src/assets/models/prepared/WeaponGeometry.ts', 'utf8');
const geometry = JSON.parse(source.slice(source.indexOf(' = ') + 3).trim().replace(/;$/, ''));
const provenance = JSON.parse(await readFile('docs/assets/weapon-sources.json', 'utf8'));
for (const entry of provenance) {
    assert.equal(createHash('sha256').update(await readFile(entry.file)).digest('hex'), entry.sha256, `${entry.file}: original download`);
    assert.ok(['CC0-1.0', 'CC-BY-SA-3.0'].includes(entry.license));
}
assert.deepEqual(Object.keys(geometry).sort(), ['minigun', 'missile', 'mortar', 'nuke', 'plasma']);
const expectedMuzzles = { minigun: 6, missile: 18, mortar: 1, plasma: 1, nuke: 1 };
const budgets = { minigun: 5000, missile: 13000, mortar: 1000, plasma: 15000, nuke: 9000 };
for (const [kind, model] of Object.entries(geometry)) {
    assert.ok(provenance.some(entry => entry.weapons.includes(kind)));
    assert.equal(model.muzzles.length, expectedMuzzles[kind]);
    assert.equal(new Set(model.muzzles.map(v => v.join(','))).size, model.muzzles.length, `${kind}: distinct exits`);
    let triangles = 0;
    for (const part of model.parts) {
        triangles += part.indices.length / 3;
        assert.equal(part.positions.length, part.normals.length);
        assert.ok([...part.positions, ...part.normals].every(Number.isFinite));
        assert.ok(part.indices.every(i => Number.isInteger(i) && i >= 0 && i < part.positions.length / 3));
        const normals = []; VertexData.ComputeNormals(part.positions, part.indices, normals);
        let aligned = 0, opposed = 0;
        for (let i = 0; i < normals.length; i += 3) {
            const dot = Vector3.Dot(Vector3.FromArray(normals, i), Vector3.FromArray(part.normals, i));
            if (dot > .1) aligned++;
            else if (dot < -.1) opposed++;
        }
        assert.ok(aligned > opposed * 20, `${kind}/${part.name}: outward face winding`);
        for (let i = 0; i < part.positions.length; i += 3) {
            assert.ok(Math.abs(part.positions[i]) <= .676, `${kind}: fits bay width`);
            assert.ok(part.positions[i + 2] >= -.851 && part.positions[i + 2] <= 1.751, `${kind}: fits bay length`);
        }
    }
    assert.ok(triangles > 100 && triangles <= budgets[kind], `${kind}: bounded geometry`);
    assert.ok(model.muzzles.every(v => v.every(Number.isFinite) && v[2] > .7 && v[2] < 1.8), `${kind}: forward firing exits`);
    console.log(`PASS ${kind}: ${triangles.toLocaleString()} triangles, ${model.muzzles.length} exits, winding, bay envelope and licensed source`);
}
