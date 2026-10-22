"""Blender 5.1 offline preparation of licensed Stunt Rally source vehicles.
Run with Blender --background --python scripts/prepare-distinct-vehicles.py.
Keeps original downloads untouched; exports normalized, recolorable articulated GLBs.
"""
import bpy
import configparser
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
MODELS = {'SX': 'wraith', 'XZ': 'valkyrie', 'Y7': 'phantom', 'HR': 'manticore', 'OT': 'behemoth'}
COLORS = {'paint': (.46,.48,.50,1), 'glass': (.035,.08,.11,1), 'trim': (.065,.075,.08,1), 'tire': (.018,.021,.025,1), 'alloy': (.42,.46,.5,1), 'tail': (.55,.025,.012,1), 'lamp': (.8,.85,.9,1)}

def orient(v, code):
    """Authored Blender axes to right/front/up; SX's source is upside down."""
    if code == 'SX': return Vector((-v.y, -v.x, -v.z))
    if code == 'XZ': return Vector((-v.y, -v.x, v.z))
    return Vector((v.x, -v.y, v.z))

def capture(obj, transform):
    """Bake original geometry without scene baggage, UV textures or modifiers."""
    verts = [transform(obj.matrix_world @ v.co) for v in obj.data.vertices]
    faces = [list(p.vertices) for p in obj.data.polygons]
    return verts, faces

for code, vehicle in MODELS.items():
    folder = ROOT / 'assets-source/vehicles' / code
    bpy.ops.wm.open_mainfile(filepath=str(folder / 'body.blend'))
    parts = []
    for suffix, kind in [('body', 'paint'), ('glass', 'glass'), ('interior', 'trim')]:
        obj = bpy.data.objects[f'{code}_{suffix}']
        verts, faces = capture(obj, lambda v: orient(v, code))
        parts.append((kind, verts, faces, 16000 if kind == 'paint' else 7000 if kind == 'trim' else 2500))
    if (folder / 'wheel.blend').exists():
        bpy.ops.wm.open_mainfile(filepath=str(folder / 'wheel.blend'))
    config = configparser.ConfigParser(strict=False, inline_comment_prefixes=("#",))
    config.read_string('[root]\n' + '\n'.join(line for line in (folder / 'source.car').read_text().splitlines() if line.strip() != '`'))
    for axle in ['front', 'rear']:
        for side in ['right', 'left']:
            section = next(s for s in config.sections() if s.strip() == f'wheel-{axle[0].upper()}{side[0].upper()}')
            pos = Vector(tuple(float(v) for v in config[section]['position'].split(',')))
            wheel_name = ('wheel1' if axle == 'front' else 'wheel2') if code == 'OT' else f'Y7_wheel_{axle}' if code == 'Y7' else f'{code}_wheel'
            obj = bpy.data.objects[wheel_name]
            verts, faces = capture(obj, lambda v: Vector((v.x if side == 'right' else -v.x, v.y, v.z)) + pos)
            radius = max(math.hypot(v.y-pos.y, v.z-pos.z) for v in verts)
            groups = {'tire': [], 'alloy': []}
            for f in faces:
                center = sum((verts[i]-pos for i in f), Vector()) / len(f)
                groups['tire' if math.hypot(center.y, center.z) > radius * .73 else 'alloy'].append(f)
            for kind, group in groups.items(): parts.append((f'{axle} {side} {kind}', verts, group, 100000))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mats = {}
    for kind, color in COLORS.items():
        mat = bpy.data.materials.new(kind); mat.diffuse_color = color; mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Metallic'].default_value = .65 if kind == 'alloy' else .35 if kind == 'paint' else 0
        bsdf.inputs['Roughness'].default_value = .9 if kind == 'tire' else .2 if kind == 'glass' else .4
        mats[kind] = mat
    objects=[]
    for name, verts, faces, budget in parts:
        mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts, [], faces); mesh.update()
        obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
        mesh.materials.append(mats[name.split()[-1]])
        bpy.context.view_layer.objects.active=obj; obj.select_set(True)
        # Recalculate winding after source-axis conversion, including mirrored wheels.
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT')
        for p in mesh.polygons: p.use_smooth=True
        tris=sum(len(p.vertices)-2 for p in mesh.polygons)
        if tris>budget:
            mod=obj.modifiers.new('medium-detail-budget','DECIMATE'); mod.ratio=budget/tris; bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.select_set(False); objects.append(obj)
    # Unused wheel vertices are removed before bounds are measured.
    for obj in objects:
        bpy.context.view_layer.objects.active=obj; obj.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.delete_loose(); bpy.ops.object.mode_set(mode='OBJECT'); obj.select_set(False)
    points=[v.co.copy() for obj in objects for v in obj.data.vertices]
    lo=Vector(tuple(min(v[i] for v in points) for i in range(3))); hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
    scale=5/(hi.y-lo.y); center=(lo+hi)*.5
    for obj in objects:
        for v in obj.data.vertices:
            # Blender export maps Y -> -Z. Front -Y yields game +Z.
            v.co=Vector((-(v.co.x-center.x)*scale, -(v.co.y-center.y)*scale, (v.co.z-lo.z)*scale))
        obj.data.update()
    path=ROOT/f'src/assets/models/prepared/{vehicle}.glb'
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', export_materials='EXPORT', export_animations=False, export_texcoords=False, export_cameras=False, export_lights=False)
    print('PREPARED',vehicle,str(path))
