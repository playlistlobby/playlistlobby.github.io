# Renders the streets' building walls (public/textures/streets/wall_right.jpg + wall_left.jpg) from a procedural 3D facade:
#   blender -b --factory-startup -P scripts/blender/streets_facade.py   (FACADE_RUN=wall_right,wall_left; writes to hotel-demo/blender/streets, copy the jpgs into public/textures/streets)
# Builds the street's two building walls in Blender and renders them as flat pictures (128 px per tile, 392 px tall: the same format as the basement's wall_right.jpg / wall_left.jpg).
# Run inside Blender (execute_blender_code): exec(open(path).read()). Sets OUT_DIR, writes wall_right.jpg, wall_left.jpg and streets_facade.blend.
import bpy, bmesh, math, random, os
from mathutils import Vector

OUT_DIR = r"F:\Done\6habbo\hotel-demo\blender\streets"
os.makedirs(OUT_DIR, exist_ok=True)
PPU = 128                 # pixels per tile (unit)
WALLH = 3.0625            # 392 / 128
DOOR_X = 2                # the door back to the arrival room: tile 2 (see rooms.ts streetsDef doorX)
DOOR_U0, DOOR_U1 = 1.78, 3.22   # where the game draws the door slab (measured: its art is centred on tile 2.5 and 1.45 tiles wide, 2.4 tall)

BAYS = [  # wall colour (sRGB), trim colour, brick?
    ((0.80, 0.42, 0.30), (0.93, 0.88, 0.80), True),
    ((0.91, 0.82, 0.62), (0.98, 0.95, 0.88), False),
    ((0.89, 0.72, 0.30), (0.98, 0.94, 0.80), False),
    ((0.52, 0.68, 0.82), (0.95, 0.97, 0.99), False),
    ((0.64, 0.78, 0.60), (0.96, 0.98, 0.93), False),
    ((0.85, 0.56, 0.56), (0.99, 0.94, 0.93), False),
    ((0.62, 0.44, 0.31), (0.93, 0.88, 0.80), True),
    ((0.55, 0.30, 0.25), (0.90, 0.85, 0.78), True),
]
SHOPS = [("BAKERY", (0.75, 0.22, 0.17)), ("CAFE", (0.17, 0.43, 0.29)), ("PIZZA", (0.78, 0.2, 0.15)), ("BOOKS", (0.17, 0.31, 0.54)),
         ("DELI", (0.55, 0.35, 0.12)), ("FLOWERS", (0.69, 0.23, 0.48)), ("BARBER", (0.18, 0.18, 0.23)), ("KIOSK", (0.83, 0.45, 0.10))]

_mats = {}

def lin(c):  # sRGB tuple -> linear
    return tuple((v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c)

def reset():
    _mats.clear()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    for e in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            sc.render.engine = e
            break
        except TypeError:
            pass
    try:
        sc.view_settings.view_transform = "Standard"
    except TypeError:
        pass
    sc.render.film_transparent = False
    sc.world = bpy.data.worlds.new("World")
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.62, 0.74, 0.92, 1)
    bg.inputs[1].default_value = 0.55
    return sc

def mat_pbr(name, color, rough=0.75, metal=0.0, emit=None):
    key = (name, color, rough, metal, emit)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*lin(color), 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emit:
        for nm in ("Emission Color", "Emission"):
            if nm in bsdf.inputs:
                bsdf.inputs[nm].default_value = (*lin(emit), 1)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = 0.9
    _mats[key] = m
    return m

def mat_brick(name, c1, c2, mortar, scale_h=0.16):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    br = nt.nodes.new("ShaderNodeTexBrick")
    br.inputs["Color1"].default_value = (*lin(c1), 1)
    br.inputs["Color2"].default_value = (*lin(c2), 1)
    br.inputs["Mortar"].default_value = (*lin(mortar), 1)
    br.inputs["Scale"].default_value = 1.0
    br.inputs["Mortar Size"].default_value = 0.025
    br.inputs["Mortar Smooth"].default_value = 0.08
    br.inputs["Bias"].default_value = 0.0
    br.inputs["Brick Width"].default_value = 0.5
    br.inputs["Row Height"].default_value = scale_h
    br.offset = 0.5
    uv = nt.nodes.new("ShaderNodeUVMap")
    nt.links.new(uv.outputs["UV"], br.inputs["Vector"])
    nt.links.new(br.outputs["Color"], bsdf.inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.6
    bump.inputs["Distance"].default_value = 0.02
    nt.links.new(br.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.9
    return m

def mat_stucco(name, color):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    uv = nt.nodes.new("ShaderNodeUVMap")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 60
    noise.inputs["Detail"].default_value = 6
    nt.links.new(uv.outputs["UV"], noise.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    c = lin(color)
    ramp.color_ramp.elements[0].color = (c[0] * 0.88, c[1] * 0.88, c[2] * 0.88, 1)
    ramp.color_ramp.elements[1].color = (min(1, c[0] * 1.06), min(1, c[1] * 1.06), min(1, c[2] * 1.06), 1)
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    bump.inputs["Distance"].default_value = 0.01
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.95
    return m

def mat_glass(name, top, bottom):
    """window glass: a sky reflection fading to a warm room, drawn as emission so it stays bright"""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*lin(bottom), 1)
    ramp.color_ramp.elements[1].color = (*lin(top), 1)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
    em.inputs["Strength"].default_value = 0.95
    nt.links.new(em.outputs[0], out.inputs[0])
    return m

def box(name, x0, x1, y0, y1, z0, z1, mat, coll, uvwall=False):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = x0 if v.co.x < 0 else x1
        v.co.y = y0 if v.co.y < 0 else y1
        v.co.z = z0 if v.co.z < 0 else z1
    uv = bm.loops.layers.uv.new("UV")
    for f in bm.faces:  # a flat projection on every face: u = x, v = z (for the front), else a simple box map
        for l in f.loops:
            co = l.vert.co
            l[uv].uv = (co.x, co.z) if abs(f.normal.y) > 0.5 else ((co.y, co.z) if abs(f.normal.x) > 0.5 else (co.x, co.y))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    me.materials.append(mat)
    coll.objects.link(ob)
    return ob

def cyl(name, x, y, z0, z1, r, mat, coll, rot=None, verts=16):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r, depth=(z1 - z0))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    me.materials.append(mat)
    ob.location = (x, y, (z0 + z1) / 2)
    if rot:
        ob.rotation_euler = rot
    coll.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    return ob

def sphere(name, x, y, z, r, mat, coll):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    me.materials.append(mat)
    ob.location = (x, y, z)
    coll.objects.link(ob)
    return ob

def text(name, body, x, y, z, size, mat, coll):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.size = size
    cu.extrude = 0.012
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    ob = bpy.data.objects.new(name, cu)
    ob.rotation_euler = (math.radians(90), 0, 0)  # stands upright, facing the camera (which looks along +Y)
    ob.location = (x, y, z)
    cu.materials.append(mat)
    coll.objects.link(ob)
    return ob

def build(tiles, seed, with_door, coll):
    rnd = random.Random(seed)
    # the common stuff
    stone = mat_pbr("Stone", (0.55, 0.53, 0.50), 0.9)
    darkwood = mat_pbr("DarkWood", (0.22, 0.15, 0.10), 0.7)
    white = mat_pbr("White", (0.95, 0.94, 0.90), 0.6)
    iron = mat_pbr("Iron", (0.18, 0.19, 0.21), 0.5, 0.6)
    soil = mat_pbr("Soil", (0.30, 0.19, 0.11), 0.95)
    leaf = mat_pbr("Leaf", (0.24, 0.55, 0.22), 0.8)
    glassA = mat_glass("GlassA", (0.62, 0.80, 0.96), (0.98, 0.92, 0.74))
    glassB = mat_glass("GlassB", (0.50, 0.72, 0.92), (0.78, 0.88, 0.97))
    cream = mat_pbr("Cream", (0.98, 0.96, 0.90), 0.7)
    x = 0.0
    bi = rnd.randrange(len(BAYS))
    si = rnd.randrange(len(SHOPS))
    while x < tiles - 0.01:
        w = min(tiles - x, rnd.choice([4, 5, 5, 6]))
        if tiles - x - w < 3 and tiles - x - w > 0:
            w = tiles - x
        wall_c, trim_c, is_brick = BAYS[bi % len(BAYS)]
        bi += 1
        shop_name, shop_col = SHOPS[si % len(SHOPS)]
        si += 1
        door_bay = with_door and x < DOOR_X + 1 and x + w > DOOR_X
        wallmat = (mat_brick("Brick%d" % bi, wall_c, tuple(min(1, c * 1.18) for c in wall_c), tuple(c * 0.55 + 0.3 for c in trim_c)) if is_brick else mat_stucco("Stucco%d" % bi, wall_c))
        trim = mat_pbr("Trim%d" % bi, trim_c, 0.7)
        x1 = x + w
        # the wall itself
        box("wall", x, x1, 0.0, 0.5, 0.0, WALLH, wallmat, coll)
        # corner strips and the cornice
        box("corner", x, x + 0.12, -0.05, 0.5, 0.0, WALLH, trim, coll)
        box("corner", x1 - 0.12, x1, -0.05, 0.5, 0.0, WALLH, trim, coll)
        box("cornice1", x - 0.02, x1 + 0.02, -0.12, 0.5, WALLH - 0.20, WALLH - 0.13, trim, coll)
        box("cornice2", x - 0.02, x1 + 0.02, -0.07, 0.5, WALLH - 0.13, WALLH, trim, coll)
        # the stone plinth
        box("plinth", x, x1, -0.04, 0.5, 0.0, 0.20, stone, coll)
        # a drainpipe at the right edge of the bay
        cyl("pipe", x1 - 0.22, -0.09, 0.0, WALLH - 0.2, 0.035, iron, coll)
        # ---- upper windows
        wz0, wz1 = 2.30, 2.80
        wx = x + 0.55
        while wx + 0.62 <= x1 - 0.5:
            ww = 0.62
            if door_bay and wx + ww > DOOR_U0 - 0.5 and wx < DOOR_U1 + 0.5:
                wx += 1.35
                continue
            box("wframe", wx - 0.07, wx + ww + 0.07, -0.05, 0.12, wz0 - 0.07, wz1 + 0.07, trim, coll)
            box("wglass", wx, wx + ww, -0.06, -0.055, wz0, wz1, glassB, coll)
            box("wmull", wx + ww / 2 - 0.025, wx + ww / 2 + 0.025, -0.075, -0.04, wz0, wz1, trim, coll)
            box("wmull", wx, wx + ww, -0.075, -0.04, (wz0 + wz1) / 2 - 0.025, (wz0 + wz1) / 2 + 0.025, trim, coll)
            box("wsill", wx - 0.12, wx + ww + 0.12, -0.16, 0.0, wz0 - 0.12, wz0 - 0.05, trim, coll)
            box("wlintel", wx - 0.12, wx + ww + 0.12, -0.10, 0.0, wz1 + 0.07, wz1 + 0.14, trim, coll)
            if rnd.random() < 0.55:  # curtains
                cm = mat_pbr("Curtain", rnd.choice([(0.9, 0.45, 0.45), (0.96, 0.92, 0.75), (0.45, 0.65, 0.92)]), 0.9)
                box("curt", wx, wx + 0.16, -0.075, -0.06, wz0 + 0.12, wz1, cm, coll)
                box("curt", wx + ww - 0.16, wx + ww, -0.075, -0.06, wz0 + 0.12, wz1, cm, coll)
            wx += 1.35
        # ---- the ground floor
        if door_bay:
            # the entrance: a stone frame round the door tile (the game draws the door itself between the pilasters), with a lintel and a step
            d0, d1 = DOOR_U0, DOOR_U1
            box("recess", d0 - 0.02, d1 + 0.02, -0.01, 0.2, 0.0, 2.45, mat_pbr("DoorDark", (0.10, 0.08, 0.08), 0.9), coll)
            box("pilL", d0 - 0.26, d0 - 0.02, -0.10, 0.2, 0.0, 2.62, stone, coll)
            box("pilR", d1 + 0.02, d1 + 0.26, -0.10, 0.2, 0.0, 2.62, stone, coll)
            box("lintel", d0 - 0.34, d1 + 0.34, -0.16, 0.2, 2.45, 2.66, stone, coll)
            box("lintel2", d0 - 0.40, d1 + 0.40, -0.20, 0.2, 2.66, 2.80, trim, coll)
            box("step", d0 - 0.18, d1 + 0.18, -0.32, 0.0, 0.0, 0.07, stone, coll)
            box("lamp", d1 + 0.44, d1 + 0.56, -0.28, -0.06, 1.55, 1.72, iron, coll)
            box("lampglow", d1 + 0.46, d1 + 0.54, -0.27, -0.22, 1.56, 1.71, mat_pbr("LampGlow", (1, 0.95, 0.7), 0.4, 0, (1, 0.9, 0.55)), coll)
        else:
            a, b = x + 0.5, x1 - 0.5
            winw = (b - a - 1.1) / 2
            for gx in (a, b - winw):  # the two shop windows
                box("sframe", gx - 0.08, gx + winw + 0.08, -0.07, 0.15, 0.30, 1.62, darkwood, coll)
                box("sglass", gx, gx + winw, -0.075, -0.07, 0.38, 1.54, glassA, coll)
                box("smull", gx + winw / 2 - 0.02, gx + winw / 2 + 0.02, -0.09, -0.06, 0.38, 1.54, darkwood, coll)
                box("sshelf", gx, gx + winw, -0.04, 0.10, 0.78, 0.82, darkwood, coll)
                for k in range(rnd.randrange(3, 6)):  # things on display
                    dc = rnd.choice([(0.91, 0.64, 0.24), (0.85, 0.32, 0.31), (0.97, 0.97, 0.95), (0.49, 0.75, 0.93), (0.45, 0.7, 0.35)])
                    dxp = gx + 0.12 + rnd.random() * (winw - 0.3)
                    dm = mat_pbr("Disp", dc, 0.6)
                    box("item", dxp, dxp + 0.14, 0.0, 0.10, 0.82, 0.82 + 0.10 + rnd.random() * 0.12, dm, coll)
                box("sill", gx - 0.1, gx + winw + 0.1, -0.12, 0.05, 0.26, 0.32, stone, coll)
                if rnd.random() < 0.6:  # a planter on the sill
                    box("pbox", gx + 0.05, gx + winw - 0.05, -0.26, -0.08, 0.32, 0.46, soil, coll)
                    for k in range(int((winw - 0.2) / 0.11)):
                        fc = rnd.choice([(0.9, 0.2, 0.3), (0.98, 0.82, 0.25), (1, 1, 1), (1, 0.55, 0.7), (0.7, 0.4, 0.9)])
                        sphere("flower", gx + 0.12 + k * 0.11, -0.19, 0.52 + rnd.random() * 0.05, 0.05, mat_pbr("Flower", fc, 0.6), coll)
                        sphere("leaf", gx + 0.10 + k * 0.11, -0.17, 0.47, 0.06, leaf, coll)
            dx0 = a + winw + 0.28
            box("dframe", dx0 - 0.07, dx0 + 0.58, -0.07, 0.15, 0.0, 1.62, darkwood, coll)
            box("door", dx0, dx0 + 0.51, -0.08, -0.04, 0.0, 1.56, mat_pbr("Door", shop_col, 0.55), coll)
            box("doorglass", dx0 + 0.07, dx0 + 0.44, -0.09, -0.08, 0.55, 1.42, glassA, coll)
            box("doorbar", dx0 + 0.06, dx0 + 0.45, -0.10, -0.085, 0.95, 0.99, trim, coll)
            sphere("handle", dx0 + 0.45, -0.12, 0.85, 0.03, mat_pbr("Brass", (0.85, 0.7, 0.2), 0.3, 0.9), coll)
            box("dstep", dx0 - 0.1, dx0 + 0.62, -0.26, -0.04, 0.0, 0.06, stone, coll)
            # the awning: a sloped striped sheet with a scalloped valance, projecting out over the pavement
            ax0, ax1 = a - 0.18, b + 0.18
            stripe = mat_pbr("Stripe1", shop_col, 0.85)
            stripe2 = mat_pbr("Stripe2", (0.97, 0.95, 0.89), 0.85)
            n = int((ax1 - ax0) / 0.16)
            sw = (ax1 - ax0) / n
            for k in range(n):
                m = stripe if k % 2 == 0 else stripe2
                # the slope: from the wall (y 0.0, z 1.98) out and down to (y -0.55, z 1.74)
                bm = bmesh.new()
                vs = [bm.verts.new(v) for v in [(ax0 + k * sw, -0.03, 1.98), (ax0 + (k + 1) * sw, -0.03, 1.98), (ax0 + (k + 1) * sw, -0.55, 1.74), (ax0 + k * sw, -0.55, 1.74)]]
                bm.faces.new(vs)
                me = bpy.data.meshes.new("awn")
                bm.to_mesh(me)
                bm.free()
                ob = bpy.data.objects.new("awn", me)
                me.materials.append(m)
                coll.objects.link(ob)
                # the front flap (valance) hanging from the edge, with a round bottom
                box("flap", ax0 + k * sw, ax0 + (k + 1) * sw, -0.56, -0.53, 1.58, 1.74, m, coll)
                cyl("scallop", ax0 + (k + 0.5) * sw, -0.545, 1.5, 1.6, sw / 2, m, coll, rot=(math.radians(90), 0, 0), verts=14)
            # the awning's frame and its shadow on the window
            box("arail", ax0, ax1, -0.58, -0.52, 1.72, 1.76, iron, coll)
            # the sign above it
            box("signbd", ax0 + 0.08, ax1 - 0.08, -0.10, 0.02, 2.02, 2.20, mat_pbr("SignBd", (0.10, 0.09, 0.08), 0.5), coll)
            text("sign", shop_name, (ax0 + ax1) / 2, -0.115, 2.11, 0.13, mat_pbr("SignTx", (0.98, 0.95, 0.85), 0.4, 0, (0.98, 0.93, 0.8)), coll)
        x = x1

def add_light_and_camera(sc, tiles):
    sun_d = bpy.data.lights.new("Sun", "SUN")
    sun_d.energy = 2.3
    sun_d.angle = math.radians(4)
    sun_d.color = (1.0, 0.95, 0.85)
    sun = bpy.data.objects.new("Sun", sun_d)
    sc.collection.objects.link(sun)
    d = Vector((0.55, 0.65, -0.55)).normalized()  # light travels into the wall, down, and to the right: it comes from upper left, in front
    sun.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    cam_d = bpy.data.cameras.new("Cam")
    cam_d.type = "ORTHO"
    cam_d.ortho_scale = tiles
    cam_d.clip_start = 0.1
    cam_d.clip_end = 100
    cam = bpy.data.objects.new("Cam", cam_d)
    sc.collection.objects.link(cam)
    cam.location = (tiles / 2, -30.0, WALLH / 2)
    cam.rotation_euler = (math.radians(90), 0, 0)
    sc.camera = cam
    sc.render.resolution_x = int(tiles * PPU)
    sc.render.resolution_y = int(WALLH * PPU)
    sc.render.resolution_percentage = 100

def render(name, tiles, seed, with_door):
    sc = reset()
    coll = bpy.data.collections.new("Facade")
    sc.collection.children.link(coll)
    build(tiles, seed, with_door, coll)
    add_light_and_camera(sc, tiles)
    try:
        sc.eevee.taa_render_samples = 24
    except Exception:
        pass
    try:
        sc.eevee.use_shadows = True
    except Exception:
        pass
    sc.render.image_settings.file_format = "JPEG"
    sc.render.image_settings.quality = 93
    sc.render.filepath = os.path.join(OUT_DIR, name + ".jpg")
    bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, "streets_%s.blend" % name))
    return sc.render.filepath

RUN = globals().get("RUN") or os.environ.get("FACADE_RUN", "wall_right,wall_left").split(",")
if "wall_right" in RUN:
    print(render("wall_right", 25, 11, True))
if "wall_left" in RUN:
    print(render("wall_left", 12, 23, False))
