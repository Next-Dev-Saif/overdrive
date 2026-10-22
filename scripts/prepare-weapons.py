"""Bake downloaded CC0/CC-BY-SA weapon meshes into synchronous Babylon geometry.
Blender 5.1: --background --python-exit-code 1 --python scripts/prepare-weapons.py.
Source muzzle bones and rocket array components determine actual firing sockets.
"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets-source/weapons'
SPECS={
 'minigun':('rotary-turret.blend',['Cube.001','Cylinder.002','Cube.003'],1),
 'missile':('van.blend',['Rocket pods.001','Mini rockets.001'],-1),
 'mortar':('van.blend',['Heavy cannon.001'],-1),
 'plasma':('plasma/plasma.blend',['plasma'],1),
 'nuke':('rocket-launcher/rocket_launcher.blend',['rocket_launcher'],1),
}
prepared={};report=[]
for kind,(file,names,forward) in SPECS.items():
 bpy.ops.wm.open_mainfile(filepath=str(SOURCE/file))
 objects=[bpy.data.objects[n] for n in names]
 for obj in objects:
  for c in list(obj.users_collection):c.objects.unlink(obj)
  bpy.context.scene.collection.objects.link(obj);obj.hide_set(False)
  for mod in list(obj.modifiers):
   if mod.type in ['ARMATURE','EDGE_SPLIT']:obj.modifiers.remove(mod)
 bpy.context.view_layer.update()
 muzzle=None
 if kind in ['plasma','nuke']:
  muzzle=bpy.data.objects['Armature'].data.bones['tag_muzzle'].head_local.copy()
 parts=[]
 for obj in objects:
  evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh()
  verts=[obj.matrix_world@v.co for v in mesh.vertices];faces=[list(p.vertices) for p in mesh.polygons]
  # Vehicle mounts do not need handheld grips; retain the authored weapon mechanism.
  if kind in ['plasma','nuke']:faces=[f for f in faces if max(verts[i].z for i in f)>-.8]
  if kind=='mortar':
   front=min(v.y for v in verts)
   for f in list(faces):
    if len(f)>=6 and all(abs(verts[i].y-front)<.0001 for i in f):
     faces.remove(f);center=sum((verts[i] for i in f),Vector())/len(f)
     inner=[];back=[]
     for i in f:
      v=center+(verts[i]-center)*.68;inner.append(len(verts));verts.append(v)
      back.append(len(verts));verts.append(v+Vector((0,.22,0)))
     for j in range(len(f)):
      k=(j+1)%len(f);faces.extend([[f[j],f[k],inner[k],inner[j]],[inner[j],inner[k],back[k],back[j]]])
     faces.append(back[::-1])
  parts.append((obj.name,verts,faces));evaluated.to_mesh_clear()
 points=[v for _,verts,faces in parts for f in faces for v in [verts[i] for i in f]]
 lo=Vector(tuple(min(v[i] for v in points) for i in range(3)));hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
 scale=min(2.6/(hi.y-lo.y),1.35/(hi.x-lo.x),1.25/(hi.z-lo.z))
 center=(lo+hi)*.5
 bore_z=muzzle.z if muzzle else 1.41860235 if kind=='minigun' else (lo.z+hi.z)/2
 def convert(v):return Vector(((v.x-center.x)*scale,(v.z-bore_z)*scale,forward*(v.y-center.y)*scale+.45))
 sockets=[]
 if muzzle is not None:sockets=[convert(muzzle)]
 elif kind=='mortar':sockets=[convert(Vector((center.x,lo.y-.008,bore_z)))]
 elif kind=='minigun':
  # Six authored bores arranged around the rotary barrel axis.
  sockets=[convert(Vector((-.131477+math.cos(i*math.tau/6)*.43,hi.y+.008,1.418602+math.sin(i*math.tau/6)*.43))) for i in range(6)]
 else:
  _,verts,faces=parts[1];adj={i:set() for f in faces for i in f}
  for f in faces:
   for i in f:adj[i].update(f)
  seen=set()
  for i in adj:
   if i in seen:continue
   todo=[i];component=[]
   while todo:
    v=todo.pop()
    if v in seen:continue
    seen.add(v);component.append(v);todo.extend(adj[v]-seen)
   front=min(verts[v].y for v in component)
   if front > min(v.y for v in verts)+.001:continue
   tip=[verts[v] for v in component if verts[v].y<front+.0001]
   sockets.append(convert(sum(tip,Vector())/len(tip)+Vector((0,-.008,0))))
 bpy.ops.wm.read_factory_settings(use_empty=True)
 output=[]
 for name,verts,faces in parts:
  mesh=bpy.data.meshes.new(name);mesh.from_pydata([convert(v) for v in verts],[],faces);mesh.update()
  obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);bpy.context.view_layer.objects.active=obj;obj.select_set(True)
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.00001);bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
  bevel=obj.modifiers.new('machined-edge-bevel','BEVEL');bevel.width=.008;bevel.segments=3;bevel.limit_method='ANGLE'
  bpy.ops.object.modifier_apply(modifier=bevel.name)
  # Smooth cylindrical surfaces while preserving the machined edge splits.
  for p in obj.data.polygons:p.use_smooth=True
  split=obj.modifiers.new('hard-edge-normals','EDGE_SPLIT');split.split_angle=math.radians(35);bpy.ops.object.modifier_apply(modifier=split.name)
  mesh=obj.data;mesh.calc_loop_triangles();data={'positions':[],'normals':[],'indices':[]};indices={}
  for tri in mesh.loop_triangles:
   corners=[]
   for loop in tri.loops:
    vertex=mesh.loops[loop].vertex_index;normal=mesh.corner_normals[loop].vector
    key=(vertex,tuple(round(c,5) for c in normal))
    if key not in indices:
     indices[key]=len(data['positions'])//3;data['positions'].extend(round(c,6) for c in mesh.vertices[vertex].co);data['normals'].extend(round(c,6) for c in normal)
    corners.append(indices[key])
   # Babylon left-handed front faces use clockwise winding.
   data['indices'].extend([corners[0],corners[2],corners[1]])
  output.append({'name':name,'surface':'accent' if 'rocket' in name.lower() and kind=='missile' else 'alloy' if name=='Cylinder.002' else 'steel',**data})
 prepared[kind]={'parts':output,'muzzles':[[round(c,6) for c in v] for v in sockets]}
 report.append({'weapon':kind,'source':file,'objects':names,'triangles':sum(len(p['indices'])//3 for p in output),'muzzles':len(sockets)})
 text='/** Generated from licensed downloads by scripts/prepare-weapons.py. See public/assets/weapon-model-credits.txt. */\nexport const WEAPON_GEOMETRY = '+json.dumps(prepared,separators=(',',':'))+';\n'
 (ROOT/'src/assets/models/prepared/WeaponGeometry.ts').write_text(text)
(ROOT/'docs/assets/prepared-weapons.json').write_text(json.dumps(report,indent=2)+'\n')
print(report)
