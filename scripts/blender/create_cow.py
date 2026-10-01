"""Cow style prototype, matching Scout 07. Blender Z up; animal faces +X.

Writes an editable blend, a GLB and three studio previews. No gameplay changes.
Run with Blender --background --factory-startup --python scripts/blender/create_cow.py.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/models/cow'
(OUT / 'previews').mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
model = bpy.data.collections.get('Collection')
model.name = 'MODEL • Meadow 01'
studio = bpy.data.collections.new('STUDIO • preview only')
bpy.context.scene.collection.children.link(studio)

def material(name, color, rough=.65, metal=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    return m

cream = material('01 • warm ivory coat', (.80,.81,.68))
patch = material('02 • midnight petrol patches', (.023,.051,.055), .73)
rose = material('03 • dusty rose muzzle', (.67,.29,.28), .68)
rose_light = material('04 • ear and udder rose', (.80,.42,.36), .72)
hoof = material('05 • charcoal hooves', (.026,.034,.034), .56)
horn = material('06 • warm horn ivory', (.70,.56,.32), .5)
eye = material('07 • obsidian eyes', (.006,.013,.016), .16)
orange = material('08 • tangerine collar', (.91,.255,.065), .48)
copper = material('09 • champagne bell', (.56,.32,.14), .32,.6)
mint = material('10 • mint ear tag', (.18,.68,.52), .52)

def move(obj, collection):
    for c in list(obj.users_collection): c.objects.unlink(obj)
    collection.objects.link(obj)

def finish(obj,name,mat):
    obj.name=name
    move(obj,model)
    obj.data.materials.append(mat)
    obj.select_set(False)
    return obj

def mesh(name,verts,faces,mat):
    me=bpy.data.meshes.new(name)
    me.from_pydata(verts,[],faces)
    me.update()
    obj=bpy.data.objects.new(name,me)
    model.objects.link(obj)
    me.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)
    return obj

def box(name,loc,dims,mat,bevel=.03):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    obj=finish(bpy.context.object,name,mat)
    obj.dimensions=dims
    obj.select_set(True)
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=obj.modifiers.new('Single plane chamfer','BEVEL')
        mod.width=bevel
        mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.select_set(False)
    return obj

def ico(name,loc,scale,mat,sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc)
    obj=finish(bpy.context.object,name,mat)
    obj.scale=scale
    return obj

def rod(name,a,b,r1,r2,mat,n=6):
    a,b=Vector(a),Vector(b)
    bpy.ops.mesh.primitive_cone_add(vertices=n,radius1=r1,radius2=r2,depth=(b-a).length,location=(a+b)/2)
    obj=finish(bpy.context.object,name,mat)
    obj.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return obj

def loft(name,rings,mat,n=10):
    # Each ring is X, width, center Z, half-height. Broad flat polygons stay editable.
    verts=[(x,math.cos(2*math.pi*i/n)*w,z+math.sin(2*math.pi*i/n)*h)
           for x,w,z,h in rings for i in range(n)]
    faces=[tuple(range(n-1,-1,-1))]
    for j in range(len(rings)-1):
        for i in range(n):
            k=(i+1)%n
            faces.append((j*n+i,(j+1)*n+i,(j+1)*n+k,j*n+k))
    faces.append(tuple((len(rings)-1)*n+i for i in range(n)))
    return mesh(name,verts,faces,mat)

# Barrel torso with integrated, irregular coat patches: no floating spot geometry.
body=loft('Body • faceted patchwork',[
    (-1.03,.29,1.13,.28),(-.87,.44,1.14,.42),(-.54,.48,1.15,.45),
    (-.12,.49,1.15,.45),(.26,.47,1.16,.43),(.61,.40,1.17,.37),(.78,.28,1.20,.29)
],cream,12)
body.data.materials.append(patch)
pattern={0:{0,1,5,6},1:{0,1,2,5,6,7},2:{1,2,3,6,7},3:{3,4,8,9},4:{3,4,5,8,9,10},5:{4,5,9}}
for j,angles in pattern.items():
    for i in angles:
        body.data.polygons[1+j*12+i].material_index=1

# Four separately parented legs allow later inexpensive joint animation.
leg_roots=[]
for x,label in [(-.69,'rear'),(.49,'front')]:
    for y,side in [(-.30,'near'),(.30,'far')]:
        pivot=bpy.data.objects.new(f'joint_leg_{label}_{side}',None)
        model.objects.link(pivot)
        pivot.location=(x,y,.91)
        leg_roots.append(pivot)
        parts=[
            box(f'Leg {label} {side} • upper',(x,y,.69),(.25,.24,.51),cream,.055),
            box(f'Leg {label} {side} • sock',(x+.015,y,.32),(.205,.22,.34),patch,.04),
            box(f'Hoof {label} {side}',(x+.045,y,.105),(.31,.285,.21),hoof,.045),
            box(f'Hoof {label} {side} • cleft',(x+.202,y,.095),(.007,.018,.105),horn,.001)
        ]
        for obj in parts:
            obj.parent=pivot
            obj.location-=pivot.location

head_root=bpy.data.objects.new('joint_head',None)
model.objects.link(head_root)
head_root.location=(.66,0,1.31)
head_parts=[]
def headpart(obj):
    head_parts.append(obj)
    return obj

head=headpart(loft('Head • broad cheeks',[(.61,.23,1.39,.30),(.85,.39,1.48,.43),
                                  (1.16,.36,1.43,.40),(1.40,.29,1.28,.28)],cream,8))
# The asymmetrical eye patch belongs to the skin surface itself.
head.data.materials.append(patch)
for j,i in [(1,3),(2,3)]:
    head.data.polygons[1+j*8+i].material_index=1
headpart(box('Muzzle • rose nose',(1.47,0,1.20),(.53,.79,.40),rose_light,.12))
headpart(box('Muzzle • lower lip',(1.48,0,1.025),(.40,.59,.07),rose,.03))
for s in (-1,1):
    nostril=headpart(ico(f'Nostril {s}',(1.735,s*.22,1.255),(.018,.075,.044),patch,2))
    nostril.rotation_euler.x=s*.18
    # Eyes sit just above the muzzle on both sides, looking slightly forwards.
    headpart(ico(f'Eye {s} • ivory surround',(1.22,s*.325,1.53),(.118,.069,.142),cream,2))
    headpart(ico(f'Eye {s} • dark pupil',(1.255,s*.376,1.538),(.080,.041,.104),eye,2))
    headpart(ico(f'Eye {s} • glint',(1.276,s*.409,1.575),(.022,.012,.026),cream,1))
    # Broad diamond ears with a single raised inner plane.
    verts=[(.79,s*.30,1.68),(.61,s*.58,1.78),(.85,s*.86,1.70),(1.05,s*.58,1.58),
           (.82,s*.55,1.72),(.82,s*.55,1.61)]
    faces=[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(1,0,5),(2,1,5),(3,2,5),(0,3,5)]
    headpart(mesh(f'Ear {s} • faceted outer',verts,faces,patch if s==-1 else cream))
    headpart(mesh(f'Ear {s} • rose inner',[(.79,s*.40,1.716),(.70,s*.57,1.786),(.85,s*.74,1.737),(.95,s*.57,1.657),(.82,s*.55,1.74)],
                  [(0,1,4),(1,2,4),(2,3,4),(3,0,4)],rose_light))
    # Two tapered segments per horn, with a forward curl at the tips.
    a=(.80,s*.25,1.80); b=(.73,s*.37,2.01); c=(.83,s*.44,2.11)
    headpart(rod(f'Horn {s} • base',a,b,.103,.063,horn,6))
    headpart(rod(f'Horn {s} • tip',b,c,.063,.008,cream,6))

# Small geometric forelock bridges the brow, away from the eyes.
headpart(mesh('Forehead • ivory tuft',[(1.18,-.18,1.81),(1.22,.16,1.81),(1.27,.08,1.71),
                                     (1.30,-.025,1.76),(1.29,-.10,1.68)],[(0,1,2,3,4)],cream))
tag=headpart(box('Ear • mint identity tag',(.88,-.73,1.55),(.17,.045,.22),mint,.025))
headpart(rod('Ear • tag pin',(.88,-.76,1.63),(.88,-.69,1.63),.023,.023,copper,8))

for obj in head_parts:
    obj.parent=head_root
    obj.location-=head_root.location

# Tangerine strap and warm metal bell tie the animal to the UFO palette.
loft('Collar • orange woven band',[(.58,.43,1.27,.44),(.74,.43,1.27,.44)],orange,10)
rod('Bell • loop',(.76,-.43,1.10),(.76,-.44,.99),.035,.035,copper,8)
bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=.145,radius2=.078,depth=.20,location=(.76,-.44,.89))
finish(bpy.context.object,'Bell • flared brass',copper)
ico('Bell • clapper',(.76,-.44,.775),(.045,.045,.05),hoof,1)

ico('Udder • faceted rose',(-.42,0,.68),(.29,.24,.20),rose_light,2)
for x in (-.53,-.33):
    for y in (-.10,.10):
        rod('Udder • teat',(x,y,.57),(x,y,.46),.043,.027,rose,6)

tail_root=bpy.data.objects.new('joint_tail',None)
model.objects.link(tail_root)
tail_root.location=(-1.0,0,1.30)
points=[(-1.0,0,1.30),(-1.19,-.02,1.11),(-1.25,-.06,.81),(-1.38,-.12,.67)]
tail_parts=[]
for i in range(3):
    tail_parts.append(rod(f'Tail • segment {i}',points[i],points[i+1],.044,.037,cream,6))
tail_parts.append(ico('Tail • dark tuft',(-1.40,-.13,.62),(.115,.10,.19),patch,1))
for obj in tail_parts:
    obj.parent=tail_root
    obj.location-=tail_root.location

root=bpy.data.objects.new('Meadow01',None)
model.objects.link(root)
for obj in list(model.objects):
    if obj!=root and obj.parent is None: obj.parent=root
root['design_status']='Style prototype 02 — awaiting review; not integrated'
root['forward_axis']='+X in Blender and glTF; Z up in Blender, Y up in glTF'
root['animation_ready']='Separate head, four leg pivots and tail; no animation clips yet'

# Export the model only; preserve editable components and animation pivots.
bpy.ops.object.select_all(action='DESELECT')
for obj in model.objects: obj.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=str(OUT/'meadow-01.glb'),export_format='GLB',use_selection=True,
                          export_yup=True,export_cameras=False,export_lights=False,export_extras=True)
bpy.ops.object.select_all(action='DESELECT')

# Same slate studio and soft warm/cool light as the approved UFO.
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=48
scene.cycles.use_denoising=True
scene.render.resolution_x=1500
scene.render.resolution_y=1200
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.085,.12,.15,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
scene.view_settings.view_transform='AgX'
floor_mat=material('STUDIO • blue slate',(.018,.036,.047),.62,.15)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.006))
floor=bpy.context.object
floor.name='STUDIO • ground'
floor.data.materials.append(floor_mat)
move(floor,studio)

def area(name,loc,power,color,size):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=power; data.color=color; data.shape='DISK'; data.size=size
    obj=bpy.data.objects.new(name,data)
    studio.objects.link(obj)
    obj.location=loc
    obj.rotation_euler=(Vector((0,0,.8))-obj.location).to_track_quat('-Z','Y').to_euler()
area('STUDIO • warm key',(1,-4,6),550,(1,.83,.65),4)
area('STUDIO • cool fill',(4,2,4),350,(.62,.84,1),3)
area('STUDIO • mint rim',(-3,3,5),650,(.65,1,.86),3)

def camera(name,loc,target,scale):
    data=bpy.data.cameras.new(name)
    obj=bpy.data.objects.new(name,data)
    studio.objects.link(obj)
    obj.location=loc
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    data.type='ORTHO'; data.ortho_scale=scale
    return obj
hero=camera('VIEW 01 • portrait',(5,-8,4.1),(.10,0,1.03),4.25)
top=camera('VIEW 02 • gameplay',(4,-6,9),(.10,0,.9),4.35)
side=camera('VIEW 03 • silhouette',(.1,-8,2.9),(.1,0,1.03),4.20)
scene.camera=hero
for obj in studio.objects: obj.hide_set(True)
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':
            a.spaces.active.region_3d.view_distance=4.8
            a.spaces.active.region_3d.view_location=Vector((.1,0,1))
            a.spaces.active.region_3d.view_rotation=hero.rotation_euler.to_quaternion()
            a.spaces.active.shading.type='MATERIAL'
            a.spaces.active.overlay.show_floor=False
            a.spaces.active.overlay.show_extras=False

triangles=0
for obj in model.objects:
    if obj.type=='MESH':
        obj.data.calc_loop_triangles()
        triangles+=len(obj.data.loop_triangles)
stats={'triangles':triangles,'mesh_objects':sum(o.type=='MESH' for o in model.objects),
       'materials':10,'animation_pivots':6,'status':'prototype; not integrated','blender':bpy.app.version_string}
(OUT/'model-info.json').write_text(json.dumps(stats,indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'meadow-01.blend'))
print('MODEL_STATS',json.dumps(stats),flush=True)
for cam,name in [(hero,'01-hero'),(top,'02-gameplay'),(side,'03-side')]:
    scene.camera=cam
    scene.render.filepath=str(OUT/'previews'/f'{name}.png')
    bpy.ops.render.render(write_still=True)
    print('PREVIEW_READY',name,flush=True)
print('COW_COMPLETE',flush=True)
