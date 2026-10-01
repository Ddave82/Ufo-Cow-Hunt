"""Prepare one catalogue window and a standalone native-scale camel source."""
import bpy
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[2]
path=root/'assets/models/library/library.blend'
bpy.ops.wm.open_mainfile(filepath=str(path))
bpy.context.preferences.filepaths.save_version=0
scene=bpy.context.scene
camera=scene.camera
camera.location=(12,-17,42)
camera.rotation_euler=(Vector((12,11,.5))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale=35
for obj in bpy.data.collections['STUDIO • preview only'].objects:
    if obj.type in {'LIGHT','CAMERA'}: obj.hide_set(True)
for obj in bpy.context.selected_objects: obj.select_set(False)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_distance=34
            area.spaces.active.region_3d.view_location=(12,11,.5)
            area.spaces.active.region_3d.view_rotation=camera.rotation_euler.to_quaternion()
            area.spaces.active.shading.type='MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(path))
# Extract just the camel, keeping preview lighting and a camera.
camel=bpy.data.objects['asset_camel']
keep={camel,*camel.children_recursive}
for obj in list(bpy.data.objects):
    if obj in keep: continue
    if obj.type in {'LIGHT','CAMERA'}: continue
    if obj.type=='MESH' and obj.name.startswith('Plane'): continue
    bpy.data.objects.remove(obj,do_unlink=True)
camel.location=(0,0,0); camel.scale=(1,1,1)
for obj in bpy.data.objects:
    if obj.type=='LIGHT': obj.location*=.2; obj.data.energy/=28; obj.data.size*=.2
camera.location=(6,-9,5)
camera.rotation_euler=(Vector((.35,0,1.45))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale=5.1
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_distance=6
            area.spaces.active.region_3d.view_location=(.35,0,1.45)
            area.spaces.active.region_3d.view_rotation=camera.rotation_euler.to_quaternion()
out=root/'assets/models/camel'; out.mkdir(exist_ok=True)
for obj in keep: obj.select_set(True)
bpy.context.view_layer.objects.active=camel
bpy.ops.export_scene.gltf(filepath=str(out/'dune-01.glb'),export_format='GLB',use_selection=True,export_yup=True)
for obj in keep: obj.select_set(False)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'dune-01.blend'))
print('VIEWER_READY',flush=True)
