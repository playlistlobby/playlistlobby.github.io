# Builds public/furni/djbooth_blodig.nitro: the classic7_djbooth art (habboassets.com) with its two screens replaced by the 24 frames of "F:\1A.6ix\dj deck thing.mp4" (12 fps, 2 s loop).
# Run in a folder with classic7_djbooth.json/.png (unpacked from the .nitro) and the frames in vf/v01.png.. (ffmpeg -i video -vf fps=12 vf/v%02d.png). Usage: python build-djbooth.py [chunk]
import sys, json, struct, zlib, colorsys, glob
from PIL import Image
CHUNK = int(sys.argv[1]) if len(sys.argv) > 1 else 1   # 1 = a video pixel per sprite pixel, 2 = 2x2 blocks (chunkier)
im = Image.open('classic7_djbooth.png').convert('RGBA')
j = json.load(open('classic7_djbooth.json'))
frames = {k.split('_64_')[1].split('_')[0]: v['frame'] for k, v in j['spritesheet']['frames'].items() if '_64_' in k}
sd = frames['sd']
sprites = {k: im.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])) for k, f in frames.items() if k in ('a', 'b')}
def faceinfo(sp):
    W, H = sp.size; px = sp.load(); cols = {}
    for x in range(W):
        ys = []
        for y in range(H):
            r, g, b, a = px[x, y]
            if a < 200: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > 0.35 and v > 0.3: ys.append(y)
        if ys: cols[x] = (ys[0], ys[-1])
    full = [x for x, (t, bt) in cols.items() if bt - t >= 37]
    x0, x1 = min(full), max(full)
    return x0, x1, {x: cols[x] for x in range(x0, x1 + 1)}
info = {k: faceinfo(s) for k, s in sprites.items()}
for k, (x0, x1, c) in info.items(): print(k, x0, x1, c[x0], c[x1])
vids = [Image.open(p).convert('RGB') for p in sorted(glob.glob('vf/v*.png'))]
N = len(vids)
def face_frame(vid, x0, x1, cols):
    fw = x1 - x0 + 1; fh = max(bt - t + 1 for t, bt in cols.values())
    # crop the 4:3 picture to the face's own shape (the skew along the edge makes it a little longer than it looks)
    aspect = (fw * 1.118) / fh
    cw = 660; ch = round(cw / aspect)   # zoomed in on the lettering (it sits in the middle of the picture), cut to the face's own shape
    cx = 727 - cw // 2; cy = 560 - ch // 2
    crop = vid.crop((cx, cy, cx + cw, cy + ch))
    crop = crop.point(lambda v: min(255, int(255 * ((v / 255) ** 0.72) * 1.35)))   # a screen: brighter, so the thin red lines read at this size
    gw, gh = max(1, fw // CHUNK), max(1, fh // CHUNK)
    small = crop.resize((gw, gh), Image.BOX)
    return small.resize((fw, fh), Image.NEAREST)
cell_w, cell_h = 60, 78
cols_per_row = 8
rows = (N * 2 + cols_per_row - 1) // cols_per_row
sheet = Image.new('RGBA', (cols_per_row * cell_w, rows * cell_h + sd['h']), (0, 0, 0, 0))
newframes = {}
idx = 0
name = 'classic7_djbooth'
for k in range(N):
    for key in ('a', 'b'):
        sp = sprites[key].copy(); x0, x1, cols = info[key]
        face = face_frame(vids[k], x0, x1, cols)
        px = sp.load(); fp = face.load()
        for x in range(x0, x1 + 1):
            t, bt = cols[x]
            for y in range(t, bt + 1):
                oy = y - t
                if oy < face.height:
                    r, g, b = fp[x - x0, oy]
                    # a touch of screen glow: the picture is a little brighter at the middle
                    px[x, y] = (r, g, b, 255)
        cx = (idx % cols_per_row) * cell_w; cy = (idx // cols_per_row) * cell_h
        sheet.alpha_composite(sp, (cx, cy))
        newframes[f'{name}_{name}_64_{key}_0_{k}'] = {'frame': {'x': cx, 'y': cy, 'w': sp.width, 'h': sp.height}, 'rotated': False, 'trimmed': False, 'spriteSourceSize': {'x': 0, 'y': 0, 'w': sp.width, 'h': sp.height}, 'sourceSize': {'w': sp.width, 'h': sp.height}, 'pivot': {'x': 0.5, 'y': 0.5}}
        idx += 1
sdy = rows * cell_h
sheet.alpha_composite(im.crop((sd['x'], sd['y'], sd['x'] + sd['w'], sd['y'] + sd['h'])), (0, sdy))
newframes[f'{name}_{name}_64_sd_0_0'] = {'frame': {'x': 0, 'y': sdy, 'w': sd['w'], 'h': sd['h']}, 'rotated': False, 'trimmed': False, 'spriteSourceSize': {'x': 0, 'y': 0, 'w': sd['w'], 'h': sd['h']}, 'sourceSize': {'w': sd['w'], 'h': sd['h']}, 'pivot': {'x': 0.5, 'y': 0.5}}
sheet.save('booth_new.png')
# the json: the frames of both layers, the same positions as the original sprites, and an animation that plays them for ever
J = json.loads(json.dumps(j))
off = {key: J['assets'][f'{name}_64_{key}_0_0'] for key in ('a', 'b')}
assets = {f'{name}_64_sd_0_0': J['assets'][f'{name}_64_sd_0_0'], f'{name}_64_sd_2_0': J['assets'][f'{name}_64_sd_2_0']}
for k in range(N):
    for key in ('a', 'b'):
        o = off[key]
        assets[f'{name}_64_{key}_0_{k}'] = {'x': o['x'], 'y': o['y']}
        assets[f'{name}_64_{key}_2_{k}'] = {'source': f'{name}_64_{key}_0_{k}', 'x': o['x'], 'y': o['y'], 'flipH': True}
J['assets'] = assets
J['spritesheet']['frames'] = newframes
J['spritesheet']['meta'] = {**J['spritesheet'].get('meta', {}), 'size': {'w': sheet.width, 'h': sheet.height}}
seq = lambda: {'loopCount': 0, 'frameRepeat': 1, 'frameSequences': {'0': {'frames': {str(i): {'id': i} for i in range(N)}}}}
for v in J['visualizations']:
    if v['size'] == 64:
        v['animations'] = {'0': {'layers': {'0': seq(), '1': seq()}}}
json.dump(J, open('classic7_djbooth_new.json', 'w'))
def pack(files):
    out = struct.pack('>H', len(files))
    for fname, data in files:
        z = zlib.compress(data, 9); nb = fname.encode()
        out += struct.pack('>H', len(nb)) + nb + struct.pack('>I', len(z)) + z
    return out
open('djbooth_blodig.nitro', 'wb').write(pack([('classic7_djbooth.json', open('classic7_djbooth_new.json', 'rb').read()), ('classic7_djbooth.png', open('booth_new.png', 'rb').read())]))
print('frames', N, 'sheet', sheet.size)
# a zoomed preview of 4 frames
pv = Image.new('RGBA', (4 * 60 * 5, 78 * 5), (90, 90, 100, 255))
for i, k in enumerate([0, 6, 12, 18]):
    for key, ox in (('b', 0), ('a', 0)):
        f = newframes[f'{name}_{name}_64_{key}_0_{k}']['frame']
        spr = sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])).resize((f['w'] * 5, f['h'] * 5), Image.NEAREST)
        pv.alpha_composite(spr, (i * 300, 0))
pv.save('preview.png')
