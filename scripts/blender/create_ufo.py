"""Editable UFO style prototype. Run with Blender --background --python this_file.

Model coordinates: Z up, nose toward -Y, hull radius 4.5 game units.
MODEL exports independently of STUDIO. No changes to gameplay are made.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector, Quaternion

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/models/ufo'
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'previews').mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for coll in list(bpy.data.collections):
    if coll.name != 'Collection':
        bpy.data.collections.remove(coll)
model = bpy.data.collections.get('Collection')
model.name = 'MODEL • Scout 07'
studio = bpy.data.collections.new('STUDIO • preview only')
bpy.context.scene.collection.children.link(studio)

def material(name, color, metal=0, rough=.5, emission=0, alpha=1):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, alpha)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    p.inputs['Alpha'].default_value = alpha
    if emission:
        p.inputs['Emission Color'].default_value = (*color, 1)
        p.inputs['Emission Strength'].default_value = emission
    if alpha < 1:
        m.surface_render_method = 'DITHERED'
    return m

ivory = material('01 • warm porcelain', (.73, .79, .70), .18, .38)
ivory_light = material('02 • porcelain highlight', (.86, .87, .73), .12, .42)
petrol = material('03 • midnight petrol', (.024, .075, .084), .48, .34)
rubber = material('04 • deep graphite', (.013, .028, .033), .15, .64)
orange = material('05 • tangerine enamel', (.91, .255, .065), .26, .35)
copper = material('06 • brushed champagne metal', (.56, .32, .14), .65, .35)
mint = material('07 • ion mint', (.10, .91, .68), .15, .27, 3)
amber = material('08 • signal amber', (1, .28, .055), .1, .3, 2)
skin = material('09 • pistachio pilot', (.43, .69, .22), 0, .65)
eye = material('10 • obsidian eyes', (.008, .017, .022), .15, .17)
glass = material('11 • glacier canopy', (.20, .69, .75), .08, .17, alpha=.16)

def move_to(obj, collection):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    collection.objects.link(obj)

def finish(obj, name, mat, collection=model):
    obj.name = name
    move_to(obj, collection)
    obj.data.materials.append(mat)
    return obj

def mesh(name, verts, faces, mat):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    model.objects.link(obj)
    obj.data.materials.append(mat)
    # Recalculate the deliberately flat, editable faces consistently.
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)
    return obj

def lathe(name, profile, mat, n=16):
    verts = [(r*math.cos(2*math.pi*i/n), r*math.sin(2*math.pi*i/n), z)
             for r,z in profile for i in range(n)]
    faces = []
    for j in range(len(profile)-1):
        for i in range(n):
            k = (i+1)%n
            faces.append((j*n+i, j*n+k, (j+1)*n+k, (j+1)*n+i))
    return mesh(name, verts, faces, mat)

def box(name, loc, scale, mat, bevel=0, rot=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = finish(bpy.context.object, name, mat)
    obj.dimensions = scale
    obj.rotation_euler.z = rot
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('Single plane chamfer', 'BEVEL')
        mod.width = bevel
        mod.segments = 1
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.select_set(False)
    return obj

def ico(name, loc, scale, mat, subdivisions=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=loc)
    obj = finish(bpy.context.object, name, mat)
    obj.scale = scale
    obj.select_set(False)
    return obj

def rod(name, a, b, radius, mat, vertices=8):
    a,b = Vector(a),Vector(b)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=(b-a).length,
                                      location=(a+b)/2)
    obj = finish(bpy.context.object, name, mat)
    obj.rotation_euler = (b-a).to_track_quat('Z','Y').to_euler()
    obj.select_set(False)
    return obj

def wedge(name, r1, r2, z1, z2, angle, width, mat, thickness=.045):
    a,b = angle-width/2,angle+width/2
    verts = [(r*math.cos(t), r*math.sin(t), z-d)
             for d in [0, thickness] for r,z,t in [(r1,z1,a),(r2,z2,a),(r2,z2,b),(r1,z1,b)]]
    faces = [(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
    return mesh(name, verts, faces, mat)

# A sixteen-sided silhouette and broad stepped planes read at game distance.
lathe('Hull • upper shell', [(0,.88),(1.84,.88),(2.20,.79),(3.90,.20),(4.46,.04),(4.5,-.14)], ivory)
lathe('Hull • armored belly', [(4.5,-.14),(4.30,-.42),(3.45,-.66),(1.5,-.88),(1.12,-.88),(1.12,-.62),(0,-.62)], petrol)
lathe('Hull • bumper belt', [(4.44,.025),(4.55,-.10),(4.55,-.24),(4.32,-.38)], rubber)
lathe('Hull • copper lower lip', [(4.32,-.37),(4.32,-.43),(3.98,-.53)], copper)

for i in range(16):
    angle = 2*math.pi*(i+.5)/16
    # Individual panels are actual geometry, not a texture or render-only detail.
    panel_mat = orange if i in (3,4,11,12) else (ivory_light if i%3==0 else ivory)
    wedge(f'Hull panel {i+1:02}', 2.23, 3.95, .815, .215, angle, math.pi/8-.025, panel_mat)
    wedge(f'Rim ion segment {i+1:02}', 4.555, 4.565, -.08, -.225, angle, math.pi/8-.11, mint)
    # Inset dark vents with copper vanes on every second panel.
    if i%2==0:
        wedge(f'Vent recess {i:02}', 2.75, 3.30, .653, .462, angle, .18, rubber)
        for j in range(3):
            r = 2.81+j*.16
            z = .815-(r-2.23)*(.600/1.72)+.023
            wedge(f'Vent vane {i:02}.{j}', r, r+.045, z, z-.016, angle, .147, copper)

# Glazed cockpit with a pronounced octagonal collar.
lathe('Cockpit • dark gasket', [(1.58,.85),(1.78,.85),(1.90,.96),(1.90,1.07),(1.74,1.14),(1.58,1.14)], rubber)
lathe('Cockpit • orange collar', [(1.77,.95),(1.89,.99),(1.89,1.065),(1.73,1.145),(1.68,1.145)], orange)
lathe('Cockpit • luminous seal', [(1.68,1.14),(1.72,1.14),(1.72,1.17),(1.68,1.17)], mint)
lathe('Cockpit • floor', [(0,.93),(1.63,.93),(1.63,.87),(0,.87)], petrol)

# Rear engine shoulders distinguish front/back without losing the saucer shape.
for side in (-1,1):
    x = side*2.58
    box(f'Engine {side} • casing', (x,1.33,.69), (.65,1.30,.42), petrol, .12, -side*.2)
    box(f'Engine {side} • copper cap', (x,1.39,.92), (.42,.77,.08), copper, .035, -side*.2)
    box(f'Engine {side} • ion exhaust', (x,1.95,.68), (.41,.09,.19), mint, .03, -side*.2)
    box(f'Headlight {side} • socket', (side*1.53,-3.38,.355), (.65,.28,.22), petrol, .07, side*.24)
    box(f'Headlight {side} • lens', (side*1.53,-3.525,.385), (.42,.025,.105), mint, .014, side*.24)

# Pilot: oversized faceted head, dark almond eyes, flight suit and controls.
box('Pilot • seat', (0,.44,1.27), (.74,.43,.74), rubber, .13)
box('Pilot • orange seat cushion', (0,.18,1.09), (.61,.58,.15), orange, .06)
ico('Pilot • flight suit', (0,.10,1.40), (.35,.27,.42), petrol, 2)
ico('Pilot • head', (0,-.035,1.98), (.53,.41,.58), skin, 2)
ico('Pilot • chin', (0,-.20,1.66), (.24,.24,.22), skin, 1)
for side in (-1,1):
    o = ico(f'Pilot • eye {side}', (side*.222,-.38,2.025), (.167,.073,.238), eye, 2)
    o.rotation_euler.y = -side*.29
    ico(f'Pilot • eye glint {side}', (side*.216,-.448,2.105), (.032,.017,.042), ivory_light, 1)
    rod(f'Pilot • sleeve {side}', (side*.24,.01,1.46), (side*.43,-.26,1.27), .11, orange)
    rod(f'Pilot • forearm {side}', (side*.43,-.26,1.27), (side*.35,-.48,1.36), .09, skin)
    ico(f'Pilot • hand {side}', (side*.35,-.48,1.36), (.11,.10,.095), skin)
    rod(f'Cockpit • joystick {side}', (side*.35,-.51,1.15), (side*.35,-.51,1.39), .035, rubber)
box('Cockpit • dashboard', (0,-.72,1.22), (1.08,.39,.23), petrol, .07)
box('Cockpit • instrument screen', (0,-.72,1.343), (.40,.22,.015), mint, .02)
for x in (-.37,.31,.40):
    box('Cockpit • button', (x,-.71,1.35), (.055,.07,.025), amber, .01)

# Open hemisphere; the lower rim is seated in the gasket.
profile=[]
for j in range(7):
    theta = (math.pi/2)*j/6
    profile.append((max(.0001,1.67*math.cos(theta)),1.16+1.53*math.sin(theta)))
canopy = lathe('Canopy • faceted glass', profile, glass, 16)
# The back spine leaves the pilot face unobstructed.
last=None
for j in range(7):
    theta = (math.pi/2)*j/6
    p=(0,1.69*math.cos(theta),1.16+1.55*math.sin(theta))
    if last:
        rod('Canopy • rear spine',last,p,.032,copper,6)
    last=p

# Visible underside: concentric emitter, iris and three short service ribs.
lathe('Emitter • outer shroud', [(1.26,-.80),(1.34,-.94),(1.22,-1.10),(.90,-1.10),(.82,-.95)], rubber, 12)
lathe('Emitter • copper ring', [(1.24,-1.01),(1.22,-1.105),(1.07,-1.105),(1.07,-1.01)], copper, 12)
lathe('Emitter • ion ring', [(1.025,-1.10),(1.025,-1.14),(.84,-1.14),(.84,-1.10)], mint, 12)
lathe('Emitter • iris well', [(0,-.96),(.82,-.96),(.82,-1.07),(0,-1.07)], petrol, 12)
ico('Emitter • core', (0,0,-1.085), (.42,.42,.10), mint, 2)
for i in range(8):
    a=i*math.pi/4
    wedge(f'Belly radial rib {i}',1.60,3.24,-.87,-.69,a,.07,copper,.045)

# Raised hull ID, converted to mesh so it survives GLB export.
bpy.ops.object.text_add(location=(.62,-2.62,.70))
label=bpy.context.object
label.name='Hull • raised 07 marking'
label.data.body='07'
label.data.align_x='CENTER'
label.data.size=.52
label.data.extrude=.001
label.data.materials.append(petrol)
label.rotation_euler.x=math.radians(19)
move_to(label,model)
bpy.ops.object.convert(target='MESH')
label.select_set(False)

# Root and explicit attachment points will simplify integration later.
root=bpy.data.objects.new('Scout07',None)
model.objects.link(root)
for obj in list(model.objects):
    if obj!=root:
        obj.parent=root
for name,loc in [('attach_beam',(0,0,-1.15)),('attach_boost',(0,1.95,.65))]:
    obj=bpy.data.objects.new(name,None)
    model.objects.link(obj)
    obj.location=loc
    obj.parent=root
root['design_status']='Style prototype 01 — awaiting review; not integrated'
root['forward_axis']='-Y in Blender / +Z after glTF export'

# Export only the model, with modifiers applied and no studio objects.
bpy.ops.object.select_all(action='DESELECT')
for obj in model.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=str(OUT/'scout-07.glb'), export_format='GLB',
                          use_selection=True, export_yup=True, export_cameras=False,
                          export_lights=False, export_extras=True)
bpy.ops.object.select_all(action='DESELECT')

# Studio lighting and orthographic presentation are isolated from the game asset.
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=40
scene.cycles.use_denoising=True
scene.cycles.transparent_max_bounces=16
scene.render.resolution_x=1500
scene.render.resolution_y=1200
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.085,.12,.15,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
scene.view_settings.view_transform='AgX'

floor_mat=material('STUDIO • blue slate',(.018,.036,.047),.15,.62)
bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-1.85))
floor=finish(bpy.context.object,'STUDIO • floor',floor_mat,studio)

def area(name,loc,power,color,size):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=power
    data.color=color
    data.shape='DISK'
    data.size=size
    obj=bpy.data.objects.new(name,data)
    studio.objects.link(obj)
    obj.location=loc
    obj.rotation_euler=(Vector((0,0,0))-obj.location).to_track_quat('-Z','Y').to_euler()
area('STUDIO • warm key',(-5,-6,10),1800,(1,.83,.63),7)
area('STUDIO • cool fill',(6,-2,6),1350,(.52,.85,1),6)
area('STUDIO • rim',(1,6,8),2400,(.53,1,.88),5)
area('STUDIO • face fill',(0,-7,3),350,(1,1,.89),4)

def camera(name,loc,target,scale):
    data=bpy.data.cameras.new(name)
    obj=bpy.data.objects.new(name,data)
    studio.objects.link(obj)
    obj.location=loc
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    data.type='ORTHO'
    data.ortho_scale=scale
    data.lens=45
    return obj
hero=camera('VIEW 01 • hero',(10,-15,10),(0,0,.45),12.4)
top=camera('VIEW 02 • gameplay',(7,-10,17),(0,0,.2),12.3)
bottom=camera('VIEW 03 • emitter',(9,-13,-9),(0,0,.25),12.4)
scene.camera=hero

# Open in a useful, uncluttered material viewport, with studio helpers hidden.
for obj in studio.objects:
    obj.hide_set(True)
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':
            a.spaces.active.region_3d.view_distance=14
            a.spaces.active.region_3d.view_location=Vector((0,0,.5))
            a.spaces.active.region_3d.view_rotation=hero.rotation_euler.to_quaternion()
            a.spaces.active.shading.type='MATERIAL'
            a.spaces.active.overlay.show_floor=False
            a.spaces.active.overlay.show_extras=False

depsgraph=bpy.context.evaluated_depsgraph_get()
triangles=0
for obj in model.objects:
    if obj.type=='MESH':
        evaluated=obj.evaluated_get(depsgraph)
        me=evaluated.to_mesh()
        me.calc_loop_triangles()
        triangles+=len(me.loop_triangles)
        evaluated.to_mesh_clear()
stats={'triangles':triangles,'mesh_objects':sum(o.type=='MESH' for o in model.objects),
       'materials':11,'status':'prototype; not integrated','blender':bpy.app.version_string}
(OUT/'model-info.json').write_text(json.dumps(stats,indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'scout-07.blend'))
print('MODEL_STATS',json.dumps(stats),flush=True)
for cam,filename in [(hero,'01-hero'),(top,'02-gameplay'),(bottom,'03-underside')]:
    scene.camera=cam
    floor.hide_render=cam==bottom
    scene.render.filepath=str(OUT/'previews'/f'{filename}.png')
    bpy.ops.render.render(write_still=True)
    print('PREVIEW_READY',filename,flush=True)
print('UFO_COMPLETE',flush=True)
