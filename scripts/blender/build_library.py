"""Build the complete coordinated low-poly asset library in Blender.

Approved UFO/cow are imported unchanged. The GLB is exported at native game scale;
the editable .blend arranges copies into a normalized catalogue for inspection.
"""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import asset_tools as A
from asset_tools import *

bpy.context.preferences.filepaths.save_version=0
assets={}
def begin(key):
    A.model=bpy.data.collections.new('MODEL • '+key)
    bpy.context.scene.collection.children.link(A.model)
    root=bpy.data.objects.new('asset_'+key,None)
    A.model.objects.link(root)
    assets[key]=root
    return root
def end(root):
    for o in list(A.model.objects):
        if o!=root and o.parent is None: o.parent=root
    root['asset_id']=root.name.removeprefix('asset_')
def joint(name,loc,objects):
    o=bpy.data.objects.new(name,None); A.model.objects.link(o); o.location=loc
    for p in objects:
        p.parent=o; p.location-=Vector(loc)
    return o
def cone(name,loc,r1,r2,h,mat,n=8):
    return rod(name,(loc[0],loc[1],loc[2]-h/2),(loc[0],loc[1],loc[2]+h/2),r1,r2,mat,n)
def ring(name,loc,r,t,mat,n=12):
    bpy.ops.mesh.primitive_torus_add(major_segments=n,minor_segments=4,location=loc,major_radius=r,minor_radius=t)
    return finish(bpy.context.object,name,mat)
def lit(name,color,strength=2):
    m=material(name,color,.35)
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Emission Color'].default_value=(*color,1)
    p.inputs['Emission Strength'].default_value=strength
    return m
sand=material('sand • caramel',(.58,.32,.13))
sandlight=material('sand • honey',(.76,.49,.25))
sanddark=material('sand • umber',(.28,.135,.056))
teal=material('textile • petrol',(.035,.23,.22))
wood=material('wood • warm oak',(.25,.12,.052))
woodlight=material('wood • end grain',(.42,.25,.11))
red=material('paint • brick red',(.46,.10,.06))
leaf=material('leaf • forest',(.036,.17,.09))
leaflight=material('leaf • sage',(.12,.31,.15))
straw=material('straw • ochre',(.62,.43,.12))
stone=material('stone • blue grey',(.23,.30,.29))
ice=material('ice • glacier',(.26,.60,.72),.42)
icebright=material('ice • snow cap',(.72,.88,.86),.55)
skin=material('skin • warm',(.68,.38,.20))
ion=lit('light • ion mint',(.10,.91,.68),2)
alarm=lit('light • warning coral',(.95,.045,.05),2)
warm=lit('light • amber',(1,.45,.10),1.3)

# Preserve the two reviewed designs, including their original mesh topology.
for key,path in [('ufo','ufo/scout-07.blend'),('cow','cow/meadow-01.blend')]:
    with bpy.data.libraries.load(str(ROOT/'assets/models'/path),link=False) as (src,dst):
        dst.collections=[n for n in src.collections if n.startswith('MODEL')]
    coll=dst.collections[0]; bpy.context.scene.collection.children.link(coll)
    root=next(o for o in coll.objects if o.parent is None)
    root.name='asset_'+key; root['asset_id']=key; assets[key]=root

# Dromedary: a continuous single-hump torso, bent neck and broad padded feet.
r=begin('camel')
body=loft('Camel • continuous body',[(-1.1,.28,1.55,.31),(-.86,.42,1.58,.43),
    (-.51,.47,1.58,.46),(-.17,.47,1.58,.45),(.22,.43,1.57,.41),(.59,.35,1.55,.35),(.78,.22,1.55,.26)],sandlight,12)
heights=[0,.08,.50,.69,.32,.02,0]
for j,h in enumerate(heights):
    for i in range(12): body.data.vertices[j*12+i].co.z+=h*max(0,math.sin(i*math.pi/6))**2
for x,tag in [(-.72,'rear'),(.54,'front')]:
    for y,s in [(-.29,'near'),(.29,'far')]:
        knee=x+(-.14 if x<0 else .12); foot=x+.04
        parts=[rod('Camel • thigh',(x,y,1.48),(knee,y,.81),.135,.092,sandlight,7),
               ico('Camel • knee',(knee,y,.81),(.12,.115,.125),sand),
               rod('Camel • shin',(knee,y,.81),(foot,y,.18),.075,.064,sandlight,7),
               box('Camel • padded foot',(foot+.06,y,.11),(.37,.30,.22),sand,.075)]
        for t in (-1,1):
            parts.append(box('Camel • toenail',(foot+.238,y+t*.079,.082),(.025,.078,.07),horn,.01))
        joint('joint_leg_'+tag+'_'+s,(x,y,1.43),parts)
neck=mesh('Camel • curved neck',
    [(x,y,z+dz) for x,z,w,h in [(.62,1.54,.24,.32),(1.02,1.67,.24,.27),(1.27,2.03,.19,.22),
                                (1.24,2.41,.16,.20),(1.40,2.79,.16,.18)]
     for y,dz in [(-w,-h),(-w,h),(w,h),(w,-h)]],
    [(0,3,2,1)]+[(j*4+i,j*4+(i+1)%4,(j+1)*4+(i+1)%4,(j+1)*4+i) for j in range(4) for i in range(4)]+[(16,17,18,19)],sandlight)
headparts=[loft('Camel • head',[(1.24,.13,2.91,.16),(1.47,.24,2.96,.26),(1.80,.22,2.91,.20),(2.02,.18,2.80,.14)],sandlight,8),
           box('Camel • muzzle',(1.99,0,2.76),(.45,.45,.24),sand,.07),
           box('Camel • lower lip',(2.01,0,2.66),(.34,.38,.07),sanddark,.028)]
for s in (-1,1):
    headparts.extend([ico('Camel • eye surround',(1.60,s*.208,3.005),(.125,.063,.12),horn,2),
                      ico('Camel • eye',(1.64,s*.255,3.009),(.075,.034,.077),eye,2),
                      ico('Camel • eye shine',(1.665,s*.279,3.037),(.021,.012,.021),cream),
                      ico('Camel • nostril',(2.20,s*.13,2.80),(.018,.044,.024),sanddark,2),
                      ico('Camel • ear',(1.31,s*.32,3.09),(.105,.21,.105),sandlight),
                      ico('Camel • inner ear',(1.34,s*.34,3.13),(.065,.13,.035),rose)])
    headparts.append(rod('Camel • halter',(1.45,s*.245,3.02),(1.85,s*.23,2.73),.023,.023,teal))
for i in range(3): headparts.append(ico('Camel • forelock',(1.38+i*.085,0,3.18),(.095,.11,.075),sanddark))
joint('joint_head',(1.35,0,2.81),headparts)
# Woven side blankets keep the tan hump exposed.
for s in (-1,1):
    mesh('Camel • orange blanket edge',[(-.84,s*.443,1.99),(.22,s*.466,1.98),(.25,s*.49,1.43),(-.79,s*.48,1.43)],[(0,1,2,3)],orange)
    mesh('Camel • petrol blanket',[(-.76,s*.455,1.94),(.14,s*.48,1.93),(.17,s*.501,1.49),(-.72,s*.493,1.49)],[(0,1,2,3)],teal)
    for x in (-.50,-.12):
        mesh('Camel • woven diamond',[(x-.105,s*.506,1.72),(x,s*.508,1.86),(x+.105,s*.506,1.72),(x,s*.508,1.58)],[(0,1,2,3)],straw)
    for x in (-.68,-.38,-.08): rod('Camel • tassel',(x,s*.49,1.44),(x,s*.50,1.32),.022,.018,orange,5)
tailparts=[rod('Camel • tail',(-1.07,0,1.73),(-1.30,-.05,1.17),.045,.027,sandlight),
           ico('Camel • tail tuft',(-1.33,-.055,1.10),(.095,.078,.17),sanddark)]
joint('joint_tail',(-1.07,0,1.73),tailparts); end(r)

r=begin('polar_bear')
loft('Bear • powerful torso',[(-1.22,.32,1.00,.38),(-.85,.47,1.06,.49),(-.25,.49,1.10,.52),(.30,.45,1.20,.55),(.67,.32,1.23,.39)],cream,10)
ico('Bear • shoulder',(.42,0,1.40),(.48,.44,.44),icebright,1)
for x,tag in [(-.77,'rear'),(.57,'front')]:
    for y,s in [(-.31,'near'),(.31,'far')]:
        parts=[box('Bear • leg',(x,y,.51),(.36,.35,.76),cream,.09),box('Bear • paw',(x+.12,y,.15),(.52,.40,.30),icebright,.09)]
        for t in (-1,0,1): parts.append(box('Bear • claw',(x+.381,y+t*.10,.105),(.06,.035,.06),patch,.01))
        joint('joint_leg_'+tag+'_'+s,(x,y,.91),parts)
parts=[loft('Bear • tapered head',[(.56,.26,1.37,.32),(.95,.31,1.36,.33),(1.22,.24,1.23,.21),(1.46,.16,1.16,.14)],cream,8),
       box('Bear • nose',(1.47,0,1.20),(.15,.28,.18),patch,.05)]
for s in (-1,1):
    parts.extend([ico('Bear • ear',(.78,s*.25,1.66),(.13,.105,.145),cream,2),
                  ico('Bear • inner ear',(.835,s*.284,1.67),(.061,.039,.069),horn,1),
                  ico('Bear • eye',(1.19,s*.215,1.39),(.047,.030,.050),eye,2),
                  ico('Bear • eye glint',(1.208,s*.237,1.413),(.013,.009,.015),cream)])
joint('joint_head',(.67,0,1.37),parts)
ico('Bear • tail',(-1.21,0,1.09),(.15,.13,.16),cream,1)
end(r)

# Three human bonus targets share proportions, with distinct mission silhouettes.
for key in ['farmer','traveler','explorer']:
    r=begin(key); clothing=red if key=='farmer' else sandlight if key=='traveler' else orange
    for x in (-.15,.15):
        box('Human • trousers',(x,0,.42),(.21,.24,.63),teal,.055)
        box('Human • boot',(x,-.045,.105),(.25,.37,.21),patch,.045)
    box('Human • jacket',(0,0,.94),(.62,.35,.66),clothing,.12)
    box('Human • belt',(0,0,.72),(.62,.37,.075),wood,.025)
    box('Human • buckle',(0,-.202,.73),(.13,.035,.10),copper,.015)
    ico('Human • face',(0,-.016,1.50),(.28,.25,.31),skin,2)
    for x in (-.095,.095): ico('Human • eye',(x,-.245,1.53),(.029,.015,.032),eye,1)
    for s in (-1,1):
        rod('Human • sleeve',(s*.29,0,1.14),(s*.39,-.03,.85),.12,.10,clothing,6)
        ico('Human • hand',(s*.39,-.04,.79),(.10,.10,.12),skin,1)
    if key=='farmer':
        cone('Farmer • hat brim',(0,0,1.73),.42,.42,.06,straw,10)
        cone('Farmer • hat crown',(0,0,1.84),.25,.22,.22,straw,8)
        cone('Farmer • hat band',(0,0,1.76),.258,.248,.075,teal,8)
        for x in (-.19,.19): box('Farmer • suspenders',(x,-.187,1.04),(.065,.025,.44),teal,.008)
        cone('Farmer • bottle',(.4,-.03,.59),.07,.07,.30,mint,8)
    elif key=='traveler':
        for z,rad in [(1.69,.29),(1.79,.255),(1.86,.19)]: cone('Traveler • wrapped turban',(0,0,z),rad,rad*.92,.12,teal,8)
        box('Traveler • scarf',(0,-.25,1.33),(.45,.11,.13),teal,.025)
        box('Traveler • scarf tail',(.23,.14,1.16),(.17,.08,.48),teal,.025)
        ico('Traveler • canteen',(-.38,0,.63),(.14,.09,.18),copper,1)
    else:
        ring('Explorer • fur hood',(0,0,1.5),.31,.075,cream,10).rotation_euler.x=math.pi/2
        box('Explorer • goggles',(0,-.254,1.54),(.44,.055,.135),patch,.04)
        box('Explorer • lens',(0,-.29,1.54),(.34,.025,.08),mint,.018)
        box('Explorer • backpack',(0,.25,.99),(.45,.25,.50),teal,.08)
        rod('Explorer • antenna',(.16,.29,1.22),(.16,.29,1.72),.016,.012,patch)
        ico('Explorer • beacon',(.16,.29,1.75),(.05,.05,.07),ion,1)
    end(r)

r=begin('drone')
box('Drone • armored body',(0,0,0),(1.42,1.08,.45),patch,.16)
box('Drone • orange spine',(0,.05,.245),(.32,.79,.08),orange,.03)
box('Drone • camera pod',(0,-.53,-.08),(.55,.25,.30),copper,.055)
ico('Drone • alert eye',(0,-.67,-.07),(.19,.07,.13),alarm,2)
for s in (-1,1):
    rod('Drone • arm',(s*.55,0,.05),(s*1.05,0,.09),.09,.075,petrol if 'petrol' in globals() else patch)
    ring('Drone • duct',(s*1.02,0,.10),.58,.065,teal)
    parts=[]
    for ang in (0,math.pi/2):
        o=box('Drone • propeller',(s*1.02,0,.10),(1.02,.105,.045),cream,.015); o.rotation_euler.z=ang; parts.append(o)
    parts.append(cone('Drone • hub',(s*1.02,0,.15),.10,.07,.13,orange,8))
    joint('joint_rotor_'+str(s),(s*1.02,0,.10),parts)
end(r)

def crystal(loc=(0,0,0),scale=(1,1,1),mat=ice):
    x,y,z=loc; sx,sy,sz=scale
    return mesh('Crystal • cut facets',[(x+sx*.45*math.cos(i*math.pi/3),y+sy*.45*math.sin(i*math.pi/3),z+h*sz)
             for h in (.0,.65) for i in range(6)]+[(x+.06*sx,y, z+sz)],
             [tuple(range(5,-1,-1))]+[(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]+[(i+6,(i+1)%6+6,12) for i in range(6)],mat)
r=begin('energy_core')
crystal((0,0,-.65),(1,1,1.3),ion)
ring('Core • cage',(0,0,0),.83,.065,copper)
for s in (-1,1): ico('Core • side clasp',(s*.83,0,0),(.12,.13,.14),teal,1)
end(r)

# Farm architecture, built at existing landmark dimensions.
r=begin('barn')
box('Barn • foundation',(0,0,.14),(10.6,8.2,.28),stone,.08)
box('Barn • red timber',(0,0,2.5),(8.5,6.8,4.8),red,.10)
mesh('Barn • pitched roof',[(-4.65,-3.8,4.7),(4.65,-3.8,4.7),(0,-3.8,7.0),(-4.65,3.8,4.7),(4.65,3.8,4.7),(0,3.8,7.0)],[(0,1,2),(5,4,3),(0,2,5,3),(2,1,4,5),(1,0,3,4)],teal)
for x in (-3.9,3.9): box('Barn • corner trim',(x,-3.46,2.45),(.19,.12,4.8),cream,.018)
box('Barn • double door',(0,-3.46,1.50),(2.75,.14,2.9),wood,.025)
for x in (-1.35,1.35): box('Barn • door surround',(x,-3.57,1.52),(.13,.12,3),cream,.01)
box('Barn • door lintel',(0,-3.57,3.02),(2.86,.12,.14),cream,.01)
for s in (-1,1): rod('Barn • door brace',(-1.19,-3.59,.19 if s==1 else 2.85),(1.19,-3.59,2.85 if s==1 else .19),.055,.055,cream,4)
for x in (-2.9,2.9):
    box('Barn • window surround',(x,-3.46,2.8),(1.06,.14,1.1),cream,.025)
    box('Barn • warm window',(x,-3.55,2.8),(.84,.03,.86),warm,.015)
for x in [-3.3,-2.2,-1.1,0,1.1,2.2,3.3]: box('Barn • vertical board',(x,-3.425,4.0),(.025,.03,1),wood,.005)
end(r)
r=begin('silo')
cone('Silo • foundation',(0,0,.24),3.55,3.55,.48,stone,12)
cone('Silo • ribbed tank',(0,0,6.4),3.35,3.15,12.6,teal,14)
cone('Silo • copper roof',(0,0,13.55),3.95,.15,2.25,copper,14)
cone('Silo • vent',(0,0,14.93),.42,.38,.55,patch,8)
for z in (1.4,4.2,7.0,9.8,12.4): ring('Silo • reinforcing band',(0,0,z),3.30-(z/12.6)*.18,.075,cream,14)
for x in (-.50,.50): rod('Silo • ladder rail',(x,-3.39,.5),(x,-3.20,12.5),.045,.045,copper)
for z in range(1,13): rod('Silo • rung',(-.50,-3.4+z*.015,z),(.50,-3.4+z*.015,z),.035,.035,copper)
box('Silo • hatch',(0,-3.42,1.4),(1.45,.15,1.8),orange,.16)
end(r)
r=begin('windmill')
cone('Mill • foundation',(0,0,.55),5.4,4.9,1.05,stone,8)
cone('Mill • tapered tower',(0,0,6.7),3.85,2.25,12.4,cream,9)
cone('Mill • roof',(0,0,14.1),3.25,0,2.45,teal,8)
for z,rad in [(1.42,4),(10.7,2.5)]: cone('Mill • timber band',(0,0,z),rad,rad,.32,wood,9)
box('Mill • doorway',(0,-3.83,1.95),(1.35,.18,2.25),wood,.10)
for z in (4.7,7.8,10.0): box('Mill • lit window',(.50,-(3.85-z*.12),z),(.65,.16,.85),warm,.025)
parts=[rod('Mill • hub',(0,-3.2,11.65),(0,-2.5,11.65),.42,.42,copper,10)]
for i in range(4):
    a=i*math.pi/2; s,c=math.sin(a),math.cos(a)
    parts.append(rod('Mill • sail spar',(0,-3.05,11.65),(s*6.6,-3.05,11.65+c*6.6),.11,.08,wood,4))
    o=box('Mill • canvas sail',(s*4.65+c*.35,-3.09,11.65+c*4.65-s*.35),(1.1,.12,2.85),cream,.025)
    o.rotation_euler.y=a; parts.append(o)
joint('joint_rotor',(0,-3.05,11.65),parts); end(r)
for key in ['fence_post','fence_rail']:
    r=begin(key)
    if key=='fence_post':
        box('Fence • hewn oak post',(0,0,-.06),(.38,.34,1.68),wood,.045)
        box('Fence • weathered foot',(0,0,-.72),(.40,.36,.30),woodlight,.035)
        cone('Fence • pyramidal cap',(0,0,.80),.28,0,.20,woodlight,4).rotation_euler.z=math.pi/4
        # Fasteners line up with the two runtime rails; broad planes read in flight.
        for z in (-.28,.32):
            for side in (-1,1):
                ico('Fence • iron peg',(0,side*.179,z),(.047,.022,.047),hoof,1)
    else:
        box('Fence • solid timber rail',(0,0,0),(1,.20,.22),woodlight,.024)
    end(r)
r=begin('hay_bale')
o=cone('Hay • rolled straw',(0,0,0),.72,.72,1.2,straw,10); o.rotation_euler.x=math.pi/2
for y in (-.4,.4): ring('Hay • binding',(0,y,0),.73,.026,wood,10).rotation_euler.x=math.pi/2
for rad in (.23,.43,.61): ring('Hay • spiral end',(0,-.612,0),rad,.014,woodlight,10).rotation_euler.x=math.pi/2
end(r)
r=begin('lantern')
rod('Lamp • timber post',(0,0,0),(0,0,2.45),.09,.07,wood)
box('Lamp • glowing glass',(0,0,2.55),(.31,.31,.37),warm,.025)
cone('Lamp • cap',(0,0,2.82),.31,.04,.22,teal,6)
for x in (-.19,.19):
    for y in (-.19,.19): rod('Lamp • frame',(x,y,2.33),(x,y,2.77),.025,.025,copper,4)
end(r)

# Vegetation and reusable ground props.
for key in ['pine','pine_snow']:
    r=begin(key); rod('Tree • trunk',(0,0,0),(0,0,3.6),.28,.13,wood,7)
    for z,rad,h in [(2.0,1.35,2.5),(3.0,1.07,2.3),(4.0,.78,1.85)]:
        cone('Tree • faceted crown',(0,0,z),rad,.02,h,leaf if z!=3 else leaflight,7)
        if key=='pine_snow': cone('Tree • snow mantle',(0,0,z+.37),rad*.82,.01,h*.72,icebright,7)
    end(r)
r=begin('palm')
for j in range(5):
    rod('Palm • bent trunk',(j*.055,0,j*.84),((j+1)*.055,0,(j+1)*.84),.27-j*.02,.25-j*.02,woodlight,7)
for i in range(7):
    a=i*math.pi*2/7; c,s=math.cos(a),math.sin(a)
    verts=[(.275,0,4.2),(.275+c*.9-s*.38,s*.9+c*.38,4.5),(.275+c*2.2,s*2.2,3.65),
           (.275+c*.9+s*.38,s*.9-c*.38,4.5),(.275+c*1.0,s*1.,4.62)]
    mesh('Palm • folded frond',verts,[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],leaflight if i%2 else leaf)
for i in range(3): ico('Palm • coconut',(.2+math.cos(i*2.1)*.23,math.sin(i*2.1)*.23,3.97),(.16,.16,.19),sanddark,1)
end(r)
r=begin('cactus')
rod('Cactus • column',(0,0,.20),(0,0,2.35),.32,.27,leaflight,8); ico('Cactus • top',(0,0,2.33),(.27,.27,.28),leaflight,1)
for s,h in [(-1,1.9),(1,1.55)]:
    rod('Cactus • branch',(0,0,1.12),(s*.66,0,1.12),.17,.15,leaflight,7)
    rod('Cactus • raised arm',(s*.66,0,1.12),(s*.66,0,h),.16,.13,leaflight,7)
    ico('Cactus • arm cap',(s*.66,0,h),(.13,.13,.15),leaflight,1)
for z in (.6,1,1.4,1.8,2.2):
    for s in (-1,1): rod('Cactus • spine',(s*.12,-.27,z),(s*.15,-.31,z+.035),.012,0,cream,3)
ico('Cactus • flower',(0,0,2.61),(.14,.14,.095),rose,1); end(r)
r=begin('shrub')
for i in range(6):
    a=i*1.1
    rod('Shrub • branch',(0,0,0),(.36*math.cos(a),.36*math.sin(a),.43+(i%3)*.12),.035,.006,woodlight,5)
end(r)
for key in ['grass','reed']:
    r=begin(key)
    for i in range(5):
        a=i*2.4; x=.11*math.cos(a); y=.11*math.sin(a); h=.40+(i%3)*.20
        if key=='reed':
            rod('Reed • stalk',(x,y,0),(x*1.5,y*1.5,h),.015,.012,leaflight,5)
            rod('Reed • seed head',(x*1.5,y*1.5,h*.70),(x*1.5,y*1.5,h*1.05),.040,.028,woodlight,6)
        mesh('Grass • blade',[(x-.035,y,0),(x+.035,y,0),(x*2+.02,y*2,h),(x*1.4,y*1.5,h*.45)],[(0,1,3),(1,2,3),(2,0,3)],leaflight if i%2 else leaf)
    end(r)
for key in ['rock','pebble','path_stone']:
    r=begin(key)
    o=ico('Stone • asymmetric facets',(0,0,0),(1,.80,.72),stone,1)
    for v in o.data.vertices:
        v.co.x*=1+.16*math.sin(v.index*2.3); v.co.y*=1+.12*math.cos(v.index*1.7)
    end(r)

# Desert landmarks and camping equipment.
r=begin('pyramid')
for j in range(10):
    width=22*(1-j/10); top=22*(1-(j+1)/10)
    # Four-sided truncated courses preserve the original collidable slope.
    verts=[(s*width/2,t*width/2,j*2.1) for s,t in [(-1,-1),(1,-1),(1,1),(-1,1)]]+[(s*top/2,t*top/2,(j+1)*2.1-.035) for s,t in [(-1,-1),(1,-1),(1,1),(-1,1)]]
    mesh('Pyramid • stone course',verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],sandlight if j%3 else sand)
box('Pyramid • dark entrance',(0,-8.3,2.0),(3.1,.20,3.0),sanddark,.08)
end(r)
r=begin('tent')
mesh('Tent • woven canopy',[(-3.4,-2.1,.1),(3.4,-2.1,.1),(0,-2.1,3.3),(-3.4,2.1,.1),(3.4,2.1,.1),(0,2.1,3.3)],[(0,2,5,3),(2,1,4,5),(3,5,4)],teal)
for y in (-2.1,2.1): rod('Tent • ridge post',(0,y,0),(0,y,3.4),.075,.05,wood)
for s in (-1,1):
    mesh('Tent • front flap',[(s*3.4,-2.12,.1),(s*.7,-2.12,.1),(0,-2.12,3.3)],[(0,1,2)],red)
    rod('Tent • guy rope',(s*2,-2,1.3),(s*3.8,-2.6,.10),.025,.025,cream,4)
box('Tent • rug',(0,-1,.04),(4.5,3.6,.07),red,.025)
for x in (-1.6,1.6): box('Tent • rug border',(x,-1,.083),(.16,3.2,.015),straw,.003)
ico('Tent • lamp',(0,-2.3,1.6),(.17,.17,.25),warm,1)
end(r)
r=begin('desert_marker')
cone('Marker • carved shaft',(0,0,1.0),.53,.37,2,sand,4)
cone('Marker • pointed cap',(0,0,2.15),.52,0,.55,sandlight,4)
box('Marker • inset',(0,-.385,1.2),(.12,.02,.47),teal,.015); end(r)
for key,mat in [('sandstone_block',sandlight),('ice_block',ice)]:
    r=begin(key); box('Boundary • beveled block',(0,0,0),(4.6,1.5,1.2),mat,.15)
    for x in (-1.3,.4): box('Boundary • seam',(x,-.757,.1),(.035,.015,.63),sand if key=='sandstone_block' else icebright,.005)
    end(r)

# Ice kit: opaque faceted surfaces avoid expensive transparent stacks in-game.
r=begin('ice_outpost')
for j,(rad,h) in enumerate([(3.2,.6),(2.8,1.1),(2.3,1.6),(1.75,2.05),(1.12,2.39)]):
    for i in range(12):
        a=i*math.pi/6+j*.12
        if j<3 and math.sin(a)<-.91: continue
        o=box('Outpost • ice brick',(rad*math.cos(a),rad*math.sin(a),h),(.52,rad*.46,.55),icebright if j%2 else ice,.06); o.rotation_euler.z=a
cone('Outpost • cap',(0,0,2.65),1.2,0,.5,icebright,12)
box('Outpost • portal',(0,-3.04,.87),(1.15,.08,1.6),patch,.24)
for x in (-.78,.78): box('Outpost • entrance pillar',(x,-3.2,.75),(.35,.60,1.5),icebright,.07)
box('Outpost • entrance lintel',(0,-3.2,1.57),(1.8,.65,.36),icebright,.06)
box('Outpost • beacon',(0,-3.55,1.55),(.26,.05,.14),ion,.03)
end(r)
for key in ['iceberg','ice_shard']:
    r=begin(key)
    for i in range(5 if key=='iceberg' else 3):
        x,y,h,w=[(0,0,17.8,5.6),(-4,1.5,10.8,3.8),(4.7,-1.8,12.4,3.3),(-1.8,-4.5,8.4,2.6),(5.5,3.9,6,2.1)][i]
        if key=='ice_shard': x*=.23; y*=.23; h*=.20; w*=.22
        o=cone('Ice • angular peak',(x,y,h/2),w,.12,h,icebright if i==0 else ice,5); o.rotation_euler.z=i*.7
    end(r)
r=begin('ice_floe')
cone('Floe • submerged rim',(0,0,-.05),1,.97,.22,ice,7)
cone('Floe • snow surface',(0,0,.075),.97,.91,.06,icebright,7); end(r)
r=begin('ice_arch')
for x,h in [(-2.55,2.8),(2.55,3.0)]: box('Arch • pillar',(x,0,h/2),(1.15,1.35,h),ice,.15)
box('Arch • bridge',(0,0,3.1),(5.6,1.4,.94),icebright,.18)
for x in (-1.7,1.5): cone('Arch • icicle',(x,0,2.34),.03,.19,.68,ice,5)
end(r)
r=begin('ice_wall')
for i in range(11):
    if i==5: continue
    h=.8+(i%4)*.42
    o=box('Wall • broken slab',((i-5)*1.45,math.sin(i*1.7)*.55,h/2),(1.12,.9,h),ice if i%3 else icebright,.10); o.rotation_euler.z=i*.18
end(r)
r=begin('ice_crystal')
crystal((0,0,0),(.9,.9,1.55),ice)
crystal((.30,.06,0),(.45,.45,.86),icebright); end(r)
r=begin('cloud')
for i in range(5): ico('Cloud • faceted puff',((i-2)*1.45,math.cos(i)*.6,math.sin(i)*.42),(2.4+i*.15,1.5,1.1),icebright,1)
end(r)

# Native-size GLB first, then a catalogue scene in the editable blend.
bpy.ops.object.select_all(action='DESELECT')
for root in assets.values():
    root.select_set(True)
    for obj in root.children_recursive: obj.select_set(True)
bpy.context.view_layer.objects.active=assets['camel']
bpy.ops.export_scene.gltf(filepath=str(OUT/'models.glb'),export_format='GLB',use_selection=True,
                         export_yup=True,export_cameras=False,export_lights=False,export_extras=True)
stats={}
for key,root in assets.items():
    count=0
    for o in root.children_recursive:
        if o.type=='MESH': o.data.calc_loop_triangles(); count+=len(o.data.loop_triangles)
    stats[key]={'triangles':count,'meshes':sum(o.type=='MESH' for o in root.children_recursive)}
(OUT/'manifest.json').write_text(json.dumps({'assets':stats,'count':len(stats),'source':'library.blend','game_export':'models.glb'},indent=2)+'\n')
print('LIBRARY_EXPORTED',len(stats),sum(v['triangles'] for v in stats.values()),flush=True)

scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=32; scene.cycles.use_denoising=True
scene.render.image_settings.file_format='PNG'; scene.view_settings.view_transform='AgX'
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.085,.12,.15,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
def area(name,loc,power,color,size):
    data=bpy.data.lights.new(name,'AREA'); data.energy=power; data.color=color; data.shape='DISK'; data.size=size
    o=bpy.data.objects.new(name,data); studio.objects.link(o); o.location=loc
    o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
area('STUDIO • warm key',(2,-5,7),700,(1,.83,.65),5)
area('STUDIO • fill',(5,3,5),500,(.62,.84,1),4)
area('STUDIO • rim',(-4,3,6),800,(.65,1,.86),4)
fm=material('STUDIO • slate',(.018,.036,.047),.62,.15)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.01)); floor=bpy.context.object; floor.data.materials.append(fm); move(floor,studio)
data=bpy.data.cameras.new('VIEW • catalogue'); camera=bpy.data.objects.new('VIEW • catalogue',data); studio.objects.link(camera); scene.camera=camera; data.type='ORTHO'

def show(keys):
    for key,r in assets.items():
        for o in [r]+list(r.children_recursive): o.hide_render=key not in keys; o.hide_set(key not in keys)
def render(name,loc,target,scale,width=1500,height=1200):
    camera.location=loc; camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler(); data.ortho_scale=scale
    scene.render.resolution_x=width; scene.render.resolution_y=height; scene.render.resolution_percentage=100
    scene.render.filepath=str(OUT/'previews'/f'{name}.png'); bpy.ops.render.render(write_still=True)
    print('PREVIEW_READY',name,flush=True)

show(['camel'])
render('01-camel',(6,-9,5),(.35,0,1.45),5.1)

# One reusable normalized catalogue layout; labels are studio objects only.
keys=list(assets)
for index,key in enumerate(keys):
    root=assets[key]; bpy.context.view_layer.update()
    points=[o.matrix_world@Vector(c) for o in root.children_recursive if o.type=='MESH' for c in o.bound_box]
    lo=Vector(tuple(min(p[i] for p in points) for i in range(3))); hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
    factor=2.8/max(hi-lo); root.scale*=factor
    root.location=(index%7*4.1, index//7*4.5, -lo.z*factor)
    bpy.ops.object.text_add(location=(root.location.x-1.5,root.location.y-1.70,.01))
    label=bpy.context.object; label.data.body=key.replace('_',' ').upper(); label.data.size=.22; label.data.materials.append(cream); move(label,studio)
show(keys)
# Large softboxes cover the full contact sheet.
for o in studio.objects:
    if o.type=='LIGHT': o.location*=5; o.data.energy*=28; o.data.size*=5
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':
            a.spaces.active.region_3d.view_distance=33
            a.spaces.active.region_3d.view_location=Vector((12,11,1))
            a.spaces.active.shading.type='MATERIAL'
            a.spaces.active.overlay.show_extras=False
            a.spaces.active.overlay.show_floor=False
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'library.blend'))
render('02-complete-library',(12,-17,42),(12,11,.5),35,2100,2100)
print('LIBRARY_COMPLETE',flush=True)
