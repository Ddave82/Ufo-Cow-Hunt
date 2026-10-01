"""Shared Blender mesh constructors and palette for build_library.py.

Importing initializes an empty build scene; use only in the asset build process.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/models/library'
(OUT / 'previews').mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
model = bpy.data.collections.get('Collection')
model.name = 'LIBRARY'
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
