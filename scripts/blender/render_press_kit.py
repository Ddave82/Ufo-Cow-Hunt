"""Render itch.io artwork using the real game models; does not modify the library."""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/itch-io/media'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/models/library/library.blend'))
bpy.context.preferences.filepaths.save_version=0
keepkeys=['ufo','cow','camel','polar_bear','pine','cactus','iceberg']
roots={key:bpy.data.objects['asset_'+key] for key in keepkeys}
keep=set(roots.values())
for root in roots.values(): keep.update(root.children_recursive)
for obj in list(bpy.data.objects):
    if obj not in keep: bpy.data.objects.remove(obj,do_unlink=True)
for root in roots.values():
    root.location=(0,0,0); root.rotation_euler=(0,0,0); root.scale=(1,1,1)
    for obj in [root]+list(root.children_recursive): obj.hide_render=False; obj.hide_set(False)
def place(key,loc,scale,angle=0):
    root=roots[key]; root.location=loc; root.scale=(scale,)*3; root.rotation_euler.z=angle
place('cow',(-5,-1,.6),1.55,-.2)
place('camel',(0,-.5,.6),1.28,-.2)
place('polar_bear',(5,-.5,.6),1.45,-.25)
place('ufo',(0,3.5,4.1),.86,.2)
place('pine',(-6.1,1.8,.55),.66)
place('cactus',(-1.6,1.6,.55),.85)
place('iceberg',(5.5,2,.55),.19)
def mat(name,color,rough=.8,emission=False):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Roughness'].default_value=rough
    if emission: bs.inputs['Emission Color'].default_value=(*color,1); bs.inputs['Emission Strength'].default_value=1.3
    return m
for x,color in [(-5,(.12,.29,.2)),(0,(.52,.31,.13)),(5,(.4,.65,.74))]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=2.45,depth=.65,location=(x,.3,.2))
    o=bpy.context.object; o.name='Biome display island'; o.data.materials.append(mat('Island',color))
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.14))
bpy.context.object.data.materials.append(mat('Midnight backdrop',(.008,.026,.034)))
scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=48; scene.cycles.use_denoising=True
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.035,.085,.11,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG'
scene.render.resolution_percentage=100
for loc,energy,color,size in [((2,-8,14),2200,(1,.84,.67),9),((-9,-2,8),1500,(.5,1,.85),7),((5,8,12),2800,(.55,.75,1),8)]:
    data=bpy.data.lights.new('Softbox','AREA'); data.energy=energy; data.color=color; data.shape='DISK'; data.size=size
    o=bpy.data.objects.new('Softbox',data); scene.collection.objects.link(o); o.location=loc; o.rotation_euler=(Vector((0,1,2))-o.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Press camera'); camera=bpy.data.objects.new('Press camera',data); scene.collection.objects.link(camera); scene.camera=camera
camera.location=(9,-25,19); camera.rotation_euler=(Vector((0,1,3))-camera.location).to_track_quat('-Z','Y').to_euler(); data.type='ORTHO'; data.ortho_scale=23
ink=mat('Title ivory',(.83,.97,.93),emission=True); teal=mat('Caption mint',(.3,.9,.75),emission=True)
def text(name,body,y,size,material):
    curve=bpy.data.curves.new(name,'FONT'); curve.body=body; curve.align_x='CENTER'; curve.size=size; curve.space_character=1.12
    o=bpy.data.objects.new(name,curve); scene.collection.objects.link(o); o.data.materials.append(material); o.parent=camera; o.location=(0,y,-18)
    return o
title=text('Title','UFO COW HUNT',6.0,1.25,ink)
subtitle=text('Tagline','QUIET SKIES. QUESTIONABLE INTENTIONS.',5.13,.27,teal)
footer=text('Footer','FARM NIGHT  /  DESERT HUNT  /  ICE DRIFT',-6.25,.29,teal)
scene.render.resolution_x=1260; scene.render.resolution_y=1000
scene.render.filepath=str(OUT/'cover-1260x1000.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/models/library/press-kit.blend'))
bpy.ops.render.render(write_still=True)
# Reframe, rather than stretch/crop the cover, for the wide page banner.
data.ortho_scale=25; title.location.y=5.45; subtitle.location.y=4.65; footer.location.y=-5.6
scene.render.resolution_x=1920; scene.render.resolution_y=1080
scene.render.filepath=str(OUT/'banner-1920x1080.png'); bpy.ops.render.render(write_still=True)
print('PRESS_KIT_READY',flush=True)
