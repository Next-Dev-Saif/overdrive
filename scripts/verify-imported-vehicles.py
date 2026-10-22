#!/usr/bin/env python3
"""Validate the prepared downloads used by all seven gameplay vehicle IDs."""
from pathlib import Path
from analyze_glb_models import analyze, parse_glb

for asset, budget in [('armored-suv', 35000), ('muscle-coupe', 22000), ('phantom', 30000), ('manticore', 38000), ('valkyrie', 23000), ('wraith', 46000), ('behemoth', 55000)]:
    path = Path(f'src/assets/models/prepared/{asset}.glb')
    result = analyze(path)
    doc, _ = parse_glb(path)
    names = result['mesh_node_names']
    assert result['triangles'] >= 15000, f'{asset}: retain medium-detail geometry'
    assert result['triangles'] <= budget, f'{asset}: triangle budget'
    assert result['bytes'] < 1_200_000, f'{asset}: download budget'
    assert result['meshes'] <= 18, f'{asset}: draw budget'
    assert not any(result[k] for k in ['animations', 'skins', 'morph_targets', 'textures', 'images']), f'{asset}: self-contained static geometry'
    assert 'paint' in names and 'glass' in names, f'{asset}: distinct paint/glass'
    assert abs(result['dimensions'][2] - 5) < .01, f'{asset}: normalized length'
    assert abs(result['bounds_min'][1]) < .001, f'{asset}: grounded origin'
    for corner in ['front right', 'front left', 'rear right', 'rear left']:
        assert any(n == f'{corner} tire' for n in names), f'{asset}: {corner} tire'
        assert any(n == f'{corner} alloy' for n in names), f'{asset}: {corner} rim'
        for node in doc['nodes']:
            if not node.get('name', '').startswith(corner):
                continue
            for primitive in doc['meshes'][node['mesh']]['primitives']:
                bounds = doc['accessors'][primitive['attributes']['POSITION']]
                # Babylon preserves Z and reflects X; wheels must not straddle the car center.
                assert bounds['min'][2] > 0 if corner.startswith('front') else bounds['max'][2] < 0
                assert bounds['max'][0] < 0 if corner.endswith('right') else bounds['min'][0] > 0
    print(f"PASS {asset}: {result['triangles']:,} triangles, {result['meshes']} meshes, {result['bytes']:,} bytes; normalized axes, paint and four wheel corners")

# Each replacement must resolve to its own actual GLB, with auditable local sources.
import hashlib
import json
import re

catalog = Path('src/game/models/ImportedVehicleModel.ts').read_text()
manifest = json.loads(Path('docs/assets/vehicle-sources.json').read_text())
assert len(manifest) == 5
hashes = set()
for source in manifest:
    vehicle = source['vehicle']
    assert re.search(rf"{vehicle}: \{{ url: {vehicle}ModelUrl", catalog), f'{vehicle}: distinct runtime mapping'
    assert f"/{vehicle}.glb?url'" in catalog
    hashes.add(hashlib.sha256(Path(f'src/assets/models/prepared/{vehicle}.glb').read_bytes()).hexdigest())
    for original in source['files']:
        assert hashlib.sha256(Path(original['path']).read_bytes()).hexdigest() == original['sha256'], f'{vehicle}: original source integrity'
assert len(hashes) == 5, 'Five genuinely different replacement files'
assert 'interceptor: { url: coupeModelUrl' in catalog
assert 'juggernaut: { url: suvModelUrl' in catalog
print('PASS five distinct runtime mappings, preserved Interceptor/Juggernaut mappings, and downloaded source checksums')
