# Builds the Blender room scene from an exported room folder (export.html?only=lobby or only=room):
#   blender -b --factory-startup -P scripts/blender/make_room_scene.py -- <folder with room.json>   (writes public-room.blend + game_view_preview.png there)
import bpy, json, math, os
from mathutils import Vector
import sys
D = sys.argv[sys.argv.index("--") + 1]
R = json.load(open(os.path.join(D, "room.json")))
W, H = R["w"], R["h"]          # game w (x), h (y)
S = R["tilePx"] / math.sqrt(2) # picture pixels per Blender unit
WALLH = R["wallHeightPx"] / (S * math.cos(math.radians(30)))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.name = "Public room (basement)"
for e in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try: sc.render.engine = e; break
    except TypeError: pass
sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
sc.render.film_transparent = False
try: sc.view_settings.view_transform = "Standard"
except TypeError: pass
sc.world = bpy.data.worlds.new("World"); sc.world.use_nodes = True
sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.02, 0.03, 1)

def mat_image(name, path, alpha=False):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(path); tex.interpolation = "Closest"
    em = nt.nodes.new("ShaderNodeEmission"); out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(tex.outputs["Color"], em.inputs["Color"])
    if alpha:
        tr = nt.nodes.new("ShaderNodeBsdfTransparent"); mix = nt.nodes.new("ShaderNodeMixShader")
        nt.links.new(tex.outputs["Alpha"], mix.inputs[0]); nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(em.outputs[0], mix.inputs[2])
        nt.links.new(mix.outputs[0], out.inputs[0])
        try: m.surface_render_method = "BLENDED"
        except Exception: pass
        try: m.blend_method = "BLEND"
        except Exception: pass
    else:
        nt.links.new(em.outputs[0], out.inputs[0])
    m.use_backface_culling = False
    return m

def mat_flat(name, rgb):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new("ShaderNodeEmission"); em.inputs[0].default_value = (*rgb, 1)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(em.outputs[0], out.inputs[0]); return m

def quad(name, verts, uvs, mat, coll):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], [(0, 1, 2, 3)]); me.update()
    me.uv_layers.new(name="UV")
    for i, l in enumerate(me.polygons[0].loop_indices): me.uv_layers[0].data[l].uv = uvs[i]
    ob = bpy.data.objects.new(name, me); me.materials.append(mat); coll.objects.link(ob); return ob

room = bpy.data.collections.new("Room"); sc.collection.children.link(room)
furn = bpy.data.collections.new("Furniture"); sc.collection.children.link(furn)
# Blender X = game y, Blender Y = game x
quad("Floor", [(0, 0, 0), (0, W, 0), (H, W, 0), (H, 0, 0)], [(0, 1), (1, 1), (1, 0), (0, 0)], mat_image("Floor", os.path.join(D, R["floor"])), room)
quad("WallBack", [(0, 0, 0), (0, W, 0), (0, W, WALLH), (0, 0, WALLH)], [(0, 0), (1, 0), (1, 1), (0, 1)], mat_image("WallBack", os.path.join(D, R["wallBack"])), room)
quad("WallLeft", [(0, 0, 0), (H, 0, 0), (H, 0, WALLH), (0, 0, WALLH)], [(1, 0), (0, 0), (0, 1), (1, 1)], mat_image("WallLeft", os.path.join(D, R["wallLeft"])), room)

# doors on the back wall (game y = 0), one tile wide
for d in R.get("doors", []):
    c = tuple(int(d["color"][i:i + 2], 16) / 255 for i in (1, 3, 5)); c = tuple(v ** 2.2 for v in c)
    x0 = d["x"]; z = 2.3
    quad("Door " + d["label"], [(0.02, x0 + 0.08, 0), (0.02, x0 + 0.92, 0), (0.02, x0 + 0.92, z), (0.02, x0 + 0.08, z)], [(0, 0), (1, 0), (1, 1), (0, 1)], mat_flat("Door " + d["label"], c), room)

# camera: orthographic, 30 degrees up, from the front corner (the game's view)
cam_d = bpy.data.cameras.new("Camera"); cam_d.type = "ORTHO"; cam_d.ortho_scale = (W + H) * 0.75 + 2
cam = bpy.data.objects.new("Camera", cam_d); sc.collection.objects.link(cam); sc.camera = cam
ctr = Vector((H / 2, W / 2, WALLH * 0.3)); dist = 60
cam.rotation_euler = (math.radians(60), 0, math.radians(135))
fwd = cam.rotation_euler.to_matrix() @ Vector((0, 0, -1))
cam.location = ctr - fwd * dist
cam.data.clip_start, cam.data.clip_end = 0.1, 400

# every piece of furniture is a sprite plane that always faces the camera (Copy Rotation), pivot on its floor tile
rot = cam.rotation_euler.to_matrix()
right, upv = rot @ Vector((1, 0, 0)), rot @ Vector((0, 1, 0))
for p in R["pieces"]:
    anchor = Vector((p["anchorTileY"] + 0.5, p["anchorTileX"] + 0.5, 0))
    cx = (p["ox"] + p["pw"] / 2) / S
    y0 = -(p["oy"] + p["ph"]) / S
    # the floor point under the sprite's bottom middle (same spot on screen): the pivot goes there, so it stands on the floor and turns round it
    t = y0 * math.cos(math.radians(30)) / math.sin(math.radians(30))
    pivot = anchor + right * cx + upv * y0 + fwd * t
    hw, hh = p["pw"] / S / 2, p["ph"] / S / math.cos(math.radians(30))  # stands upright, so it is stretched by 1/cos30 to fill the same picture height from the game camera
    m = mat_image(p["id"], os.path.join(D, p["png"]), alpha=True)
    ob = quad(p["id"] + " " + p["kind"], [(-hw, 0, 0), (hw, 0, 0), (hw, 0, hh), (-hw, 0, hh)], [(0, 0), (1, 0), (1, 1), (0, 1)], m, furn)
    ob.location = pivot
    cr = ob.constraints.new("COPY_ROTATION"); cr.target = cam; cr.name = "Face camera"; cr.use_x = False; cr.use_y = False  # only turns round the vertical, so it never leans into the floor
    ob["kind"] = p["kind"]

sc.render.filepath = os.path.join(D, "game_view_preview.png")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D, "public-room.blend"))
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D, "public-room.blend"))
print("saved", len(R["pieces"]), "pieces; wall height", WALLH)
