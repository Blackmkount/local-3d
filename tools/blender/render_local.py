"""Render fotorrealista del local con Blender Cycles.

Toma el modelo que exporta la página (local-impresion-3d.glb), cambia cada
material por su versión física (vidrio que refracta, LED que emiten luz real,
laca con barniz, PLA con las capas de impresión, porcelanato pulido), monta las
luminarias del proyecto como luces reales (proyectores de riel, gargantas,
colgantes, lámpara lineal y la iluminación del centro comercial) y renderiza
las vistas con cámaras de fotografía de arquitectura (verticales rectas).

Uso, con Blender 4.2 o posterior instalado:

    blender -b -P tools/blender/render_local.py -- --glb local-impresion-3d.glb --out renders

o con el módulo de Python (pip install bpy, Python 3.11):

    python tools/blender/render_local.py -- --glb local-impresion-3d.glb --out renders

Opciones:
    --shots fachada,sala,taller,isla,estanteria,aerea   vistas a renderizar (por defecto todas)
    --samples 128        muestras por píxel (Cycles, con muestreo adaptativo y denoiser OIDN)
    --res 1920x1080      resolución
    --preview            ajustes rápidos para probar encuadres (1/3 de resolución, 48 muestras)
    --blend archivo.blend   guarda también la escena lista para abrir en Blender
"""
import argparse
import math
import os
import re
import sys
import time

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--glb', required=True)
ap.add_argument('--out', default='renders')
ap.add_argument('--shots', default='fachada,sala,taller,isla,estanteria,aerea')
ap.add_argument('--samples', type=int, default=128)
ap.add_argument('--res', default='1920x1080')
ap.add_argument('--preview', action='store_true')
ap.add_argument('--blend', default='')
ap.add_argument('--exposure', type=float, default=-0.35)
A = ap.parse_args(argv)


def W(x, y, z):
    """coordenadas de la página (three.js, Y arriba) → Blender (Z arriba)"""
    return Vector((x, -z, y))


def kelvin(k):
    """color de una fuente de luz blanca a k grados Kelvin (aproximación de Tanner Helland), normalizado"""
    t = k / 100.0
    r = 255.0 if t <= 66 else 329.698727446 * ((t - 60) ** -0.1332047592)
    g = 99.4708025861 * math.log(t) - 161.1195681661 if t <= 66 else 288.1221695283 * ((t - 60) ** -0.0755148492)
    b = 255.0 if t >= 66 else (0.0 if t <= 19 else 138.5177312231 * math.log(t - 10) - 305.0447927307)
    c = [max(0.0, min(255.0, v)) / 255.0 for v in (r, g, b)]
    c = [v ** 2.2 for v in c]                      # a lineal
    m = max(c)
    return tuple(v / m for v in c)


WARM, NEUTRAL, COOL = kelvin(3000), kelvin(4000), kelvin(5000)

# ----------------------------------------------------------------------------- escena
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.abspath(A.glb))
sc = bpy.context.scene
col = sc.collection

# las luces del visor son de tiempo real: aquí se monta la iluminación física
for ob in list(bpy.data.objects):
    if ob.type in ('LIGHT', 'CAMERA'):
        bpy.data.objects.remove(ob, do_unlink=True)


def base(name):
    return re.sub(r'\.\d{3}$', '', name)


def top_group(ob):
    p = ob.parent
    return p.name if p is not None else ''


# ----------------------------------------------------------------------------- materiales
def nodes_of(mat):
    mat.use_nodes = True
    return mat.node_tree, mat.node_tree.nodes, mat.node_tree.links


def principled(mat):
    for n in mat.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            return n
    return None


def first_image(mat):
    for n in mat.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image is not None:
            return n.image
    return None


def emissive_color(mat):
    p = principled(mat)
    if p is not None:
        c = p.inputs['Emission Color'].default_value
        return (c[0], c[1], c[2])
    return WARM


def fresh(mat):
    nt, N, Lk = nodes_of(mat)
    N.clear()
    out = N.new('ShaderNodeOutputMaterial')
    out.location = (400, 0)
    return nt, N, Lk, out


def make_emission(mat, color, strength):
    nt, N, Lk, out = fresh(mat)
    e = N.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = (*color, 1)
    e.inputs['Strength'].default_value = strength
    Lk.new(e.outputs[0], out.inputs['Surface'])


def make_glass(mat, tint, rough=0.0, ior=1.52, density=None):
    """vidrio arquitectónico: refracta para la cámara y deja pasar la luz para las sombras"""
    nt, N, Lk, out = fresh(mat)
    g = N.new('ShaderNodeBsdfPrincipled')
    g.inputs['Base Color'].default_value = (*tint, 1)
    g.inputs['Roughness'].default_value = rough
    g.inputs['IOR'].default_value = ior
    g.inputs['Transmission Weight'].default_value = 1.0
    tr = N.new('ShaderNodeBsdfTransparent')
    tr.inputs['Color'].default_value = (*(density or tint), 1)
    lp = N.new('ShaderNodeLightPath')
    mx = N.new('ShaderNodeMixShader')
    Lk.new(lp.outputs['Is Shadow Ray'], mx.inputs['Fac'])
    Lk.new(g.outputs[0], mx.inputs[1])
    Lk.new(tr.outputs[0], mx.inputs[2])
    Lk.new(mx.outputs[0], out.inputs['Surface'])


def make_screen(mat, strength, gloss=True):
    img = first_image(mat)
    nt, N, Lk, out = fresh(mat)
    p = N.new('ShaderNodeBsdfPrincipled')
    p.inputs['Base Color'].default_value = (0.004, 0.004, 0.005, 1)
    p.inputs['Roughness'].default_value = 0.06 if gloss else 0.5
    p.inputs['Emission Strength'].default_value = strength
    if img is not None:
        t = N.new('ShaderNodeTexImage')
        t.image = img
        Lk.new(t.outputs['Color'], p.inputs['Emission Color'])
    Lk.new(p.outputs[0], out.inputs['Surface'])


def make_cutout(mat, base_rgb, emit, rough=0.4):
    """letras e íconos: color plano recortado por el alfa de su imagen"""
    img = first_image(mat)
    nt, N, Lk, out = fresh(mat)
    p = N.new('ShaderNodeBsdfPrincipled')
    p.inputs['Base Color'].default_value = (*base_rgb, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Emission Color'].default_value = (*base_rgb, 1)
    p.inputs['Emission Strength'].default_value = emit
    if img is not None:
        t = N.new('ShaderNodeTexImage')
        t.image = img
        Lk.new(t.outputs['Alpha'], p.inputs['Alpha'])
    Lk.new(p.outputs[0], out.inputs['Surface'])


def make_vertex_color(mat, rough, coat=0.0, layers=False):
    """figuras impresas: color por vértice; con capas, el relieve de 0.2 mm de cada capa de PLA"""
    nt, N, Lk, out = fresh(mat)
    p = N.new('ShaderNodeBsdfPrincipled')
    a = N.new('ShaderNodeAttribute')
    a.attribute_name = 'Color'
    Lk.new(a.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    p.inputs['Coat Weight'].default_value = coat
    p.inputs['Coat Roughness'].default_value = 0.3
    if layers:
        geo = N.new('ShaderNodeNewGeometry')
        sep = N.new('ShaderNodeSeparateXYZ')
        mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 2 * math.pi / 0.0002
        sin = N.new('ShaderNodeMath'); sin.operation = 'SINE'
        ab = N.new('ShaderNodeMath'); ab.operation = 'ABSOLUTE'
        bump = N.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.35
        bump.inputs['Distance'].default_value = 0.00004
        Lk.new(geo.outputs['Position'], sep.inputs[0])
        Lk.new(sep.outputs['Z'], mul.inputs[0])
        Lk.new(mul.outputs[0], sin.inputs[0])
        Lk.new(sin.outputs[0], ab.inputs[0])
        Lk.new(ab.outputs[0], bump.inputs['Height'])
        Lk.new(bump.outputs[0], p.inputs['Normal'])
    Lk.new(p.outputs[0], out.inputs['Surface'])


def normal_strength(mat, k):
    for n in mat.node_tree.nodes:
        if n.type == 'NORMAL_MAP':
            n.inputs['Strength'].default_value = k


def backlit(mat, strength):
    p = principled(mat)
    p.inputs['Emission Color'].default_value = (*kelvin(3200), 1)
    p.inputs['Emission Strength'].default_value = strength


LED_STRENGTH = {'led': 18.0, 'ledFrio': 6.0, 'ledBlanco': 26.0}

for mat in bpy.data.materials:
    b = base(mat.name)
    if b in LED_STRENGTH:
        make_emission(mat, emissive_color(mat), LED_STRENGTH[b])
    elif b == 'vidrio':
        make_glass(mat, (0.93, 0.98, 0.96), 0.0)
    elif b == 'acrilico':
        make_glass(mat, (0.98, 0.99, 0.99), 0.0, 1.49)
    elif b == 'vidrioOscuro':
        make_glass(mat, (0.16, 0.17, 0.19), 0.02, 1.5, (0.55, 0.56, 0.58))
    elif b == 'escarcha':
        make_glass(mat, (0.96, 0.97, 0.97), 0.42)
    elif b == 'pantalla':
        make_screen(mat, 2.2)
    elif b == 'letrero':
        make_cutout(mat, (1.0, 0.97, 0.92), 9.0, 0.3)
    elif b == 'icono':
        make_cutout(mat, (0.95, 0.95, 0.94), 0.6, 0.45)
    elif b == 'decor':
        make_vertex_color(mat, 0.38, 0.25, layers=True)
    elif b == 'decorMate':
        make_vertex_color(mat, 0.82)
    elif b == 'fondoLit':
        backlit(mat, 1.1)
    elif b == 'laca':
        p = principled(mat)
        p.inputs['Coat Weight'].default_value = 0.6
        p.inputs['Coat Roughness'].default_value = 0.06
    elif b == 'piso':
        p = principled(mat)
        p.inputs['Coat Weight'].default_value = 0.35       # esmalte pulido del porcelanato
        p.inputs['Coat Roughness'].default_value = 0.02
        normal_strength(mat, 0.6)
    elif b in ('melRovere', 'liston'):
        normal_strength(mat, 0.5)
        principled(mat).inputs['Coat Weight'].default_value = 0.12
        principled(mat).inputs['Coat Roughness'].default_value = 0.25
    elif b in ('muro', 'cielo', 'muroPasillo'):
        normal_strength(mat, 0.6)
    elif b in ('alu', 'inox'):
        principled(mat).inputs['Anisotropic'].default_value = 0.6

# ----------------------------------------------------------------------------- piso extendido
# el piso del .glb es de 16 × 16 m; para que el pasillo no tenga borde se reemplaza por uno de 80 m
# cuyas coordenadas de textura salen de la posición: la trama de 0.60 sigue alineada al local
old_floor = [o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('Piso porcelanato')]
floor_mat = old_floor[0].active_material if old_floor else None
for o in old_floor:
    bpy.data.objects.remove(o, do_unlink=True)
if floor_mat is not None:
    bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0))
    fl = bpy.context.active_object
    fl.name = 'Piso porcelanato 60 × 60'
    fl.data.materials.append(floor_mat)
    nt, N, Lk = nodes_of(floor_mat)
    geo = N.new('ShaderNodeNewGeometry')
    sep = N.new('ShaderNodeSeparateXYZ')
    u = N.new('ShaderNodeMath'); u.operation = 'MULTIPLY_ADD'; u.inputs[1].default_value = 1 / 2.4; u.inputs[2].default_value = 3 / 2.4
    v = N.new('ShaderNodeMath'); v.operation = 'MULTIPLY_ADD'; v.inputs[1].default_value = 1 / 2.4; v.inputs[2].default_value = 3.5 / 2.4
    cmb = N.new('ShaderNodeCombineXYZ')
    Lk.new(geo.outputs['Position'], sep.inputs[0])
    Lk.new(sep.outputs['X'], u.inputs[0]); Lk.new(sep.outputs['Y'], v.inputs[0])
    Lk.new(u.outputs[0], cmb.inputs['X']); Lk.new(v.outputs[0], cmb.inputs['Y'])
    for n in list(N):
        if n.type == 'TEX_IMAGE':
            for l in list(n.inputs['Vector'].links):
                Lk.remove(l)
            Lk.new(cmb.outputs[0], n.inputs['Vector'])

# ----------------------------------------------------------------------------- luminarias
lights = bpy.data.collections.new('Iluminación')
col.children.link(lights)


def add_light(name, kind, loc, power, color, **kw):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = power
    ld.color = color
    for k, v in kw.items():
        setattr(ld, k, v)
    ob = bpy.data.objects.new(name, ld)
    ob.location = loc
    lights.objects.link(ob)
    return ob


def aim(ob, target):
    ob.rotation_euler = (target - ob.location).to_track_quat('-Z', 'Y').to_euler()


def area(name, loc, sx, sy, power, color, up=False, spread=180):
    ob = add_light(name, 'AREA', loc, power, color, shape='RECTANGLE', size=sx, size_y=sy, spread=math.radians(spread))
    ob.rotation_euler = (math.pi, 0, 0) if up else (0, 0, 0)
    return ob


def spot(name, loc, target, power, size_deg, blend, color, radius=0.025):
    ob = add_light(name, 'SPOT', loc, power, color, spot_size=math.radians(size_deg), spot_blend=blend, shadow_soft_size=radius)
    aim(ob, target)
    return ob


HC, HS = 3.0, 2.8
wx = lambda X: X - 3
wz = lambda D: 3.5 - D

# gargantas de luz: cuatro tiras LED que bañan el cielo central
area('Garganta izquierda', W(wx(0.515), HC - 0.035, wz(2.75)), 0.03, 4.5, 50, WARM, up=True, spread=150)
area('Garganta derecha', W(wx(5.485), HC - 0.035, wz(2.75)), 0.03, 4.5, 50, WARM, up=True, spread=150)
area('Garganta frontal', W(0, HC - 0.035, wz(0.515)), 5.0, 0.03, 50, WARM, up=True, spread=150)
area('Garganta posterior', W(0, HC - 0.035, wz(4.985)), 5.0, 0.03, 50, WARM, up=True, spread=150)

# proyectores de riel: dos rieles de cinco cabezas, orientadas a la exhibición de cada muro
for X in (1.45, 4.55):
    d = -1 if X < 3 else 1
    for i in range(5):
        D = 1.3 + i * 0.7
        p = W(wx(X) + d * 0.075, HC - 0.2, wz(D))
        tgt = W(wx(0.25 if X < 3 else 5.75), 1.05 + 0.12 * (i % 2), wz(D + 0.08))
        spot('Proyector %s%d' % ('I' if X < 3 else 'D', i + 1), p, tgt, 38, 38, 0.55, kelvin(3000))

# colgantes sobre la isla y lámpara lineal sobre la mesa alta
for k, (X, D, h) in enumerate(((2.15, 1.3, 0.7), (2.85, 1.45, 0.84))):
    spot('Colgante %d' % (k + 1), W(wx(X), HC - h - 0.21, wz(D)), W(wx(X) + 0.01, 0, wz(D)), 32, 62, 0.75, kelvin(2900), 0.02)
pc = dict(X=2.4, D=3.85, y=2.12, w=1.6, d=0.5)
for s in (-1, 1):
    area('Lámpara lineal %d' % (2 if s > 0 else 1), W(wx(pc['X']), pc['y'] - 0.008, wz(pc['D'] + s * (pc['d'] / 2 - 0.018))), 1.52, 0.02, 32, kelvin(3500))
# trastienda: luminaria de trabajo de luz neutra
area('Luz de taller', W(wx(2.6), HC - 0.03, wz(6.3)), 1.2, 0.22, 90, NEUTRAL)

# pasillo del centro comercial: cielo a 4.60 m con paneles de luz y el ambiente del mall
bpy.ops.mesh.primitive_plane_add(size=1, location=W(0, 4.6, 12.0))
mall_ceiling = bpy.context.active_object
mall_ceiling.name = 'Cielo del pasillo'
mall_ceiling.scale = (34, 16.3, 1)
mall_ceiling.rotation_euler = (math.pi, 0, 0)
mc = bpy.data.materials.new('cieloPasillo')
mc.use_nodes = True
principled(mc).inputs['Base Color'].default_value = (0.78, 0.77, 0.75, 1)
principled(mc).inputs['Roughness'].default_value = 0.9
mall_ceiling.data.materials.append(mc)
for ix, X in enumerate((-10.5, -5.25, 0, 5.25, 10.5)):
    for iz, Z in enumerate((6.4, 10.4, 14.4)):
        area('Panel pasillo %d-%d' % (ix, iz), W(X, 4.58, Z), 1.2, 1.2, 260, NEUTRAL)

world = bpy.data.worlds.new('Centro comercial')
sc.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.62, 0.6, 0.57, 1)
bg.inputs['Strength'].default_value = 0.45

# ----------------------------------------------------------------------------- render
r = sc.render
sc.render.engine = 'CYCLES'
cy = sc.cycles
cy.device = 'CPU'
cy.samples = 48 if A.preview else A.samples
cy.use_adaptive_sampling = True
cy.adaptive_threshold = 0.03 if A.preview else 0.012
cy.use_denoising = True
cy.denoiser = 'OPENIMAGEDENOISE'
cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
cy.denoising_prefilter = 'ACCURATE'
cy.max_bounces = 10
cy.diffuse_bounces = 5
cy.glossy_bounces = 5
cy.transmission_bounces = 10
cy.transparent_max_bounces = 16
cy.caustics_reflective = False
cy.caustics_refractive = False
cy.sample_clamp_indirect = 8.0
cy.blur_glossy = 0.6
r.use_persistent_data = True
w, h = (int(v) for v in A.res.lower().split('x'))
r.resolution_x, r.resolution_y = w, h
r.resolution_percentage = 34 if A.preview else 100
r.film_transparent = False
r.image_settings.file_format = 'JPEG'
r.image_settings.quality = 92
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Medium High Contrast'
sc.view_settings.exposure = A.exposure

# ----------------------------------------------------------------------------- cámaras
cam_data = bpy.data.cameras.new('Cámara')
cam = bpy.data.objects.new('Cámara', cam_data)
col.objects.link(cam)
sc.camera = cam
cam_data.sensor_width = 36
cam_data.sensor_fit = 'HORIZONTAL'
cam_data.clip_start = 0.05
cam_data.clip_end = 200

# grupos que se ocultan a la cámara (siguen dando sombra y rebote de luz) para mirar dentro desde arriba
CUT_AEREA = ('Cielo y luminarias', 'Muro derecho', 'Fachada y pasillo')

SHOTS = {
    # posición (página), objetivo (página), lente mm, verticales rectas, desplazamiento vertical, foco/diafragma
    'fachada': dict(pos=(1.35, 1.6, 9.4), tgt=(0.1, 1.6, 2.0), lens=24, level=True, shift=0.09),
    'sala': dict(pos=(2.55, 1.5, 3.25), tgt=(-1.6, 1.35, -1.3), lens=17, level=True, shift=0.02),
    'taller': dict(pos=(1.9, 1.55, -0.55), tgt=(-1.15, 1.18, -1.95), lens=24, level=True, shift=-0.05),
    'isla': dict(pos=(-1.55, 1.3, 3.42), tgt=(-0.72, 1.07, 2.2), lens=58, level=False, shift=0.0, fstop=2.4),
    'estanteria': dict(pos=(-0.55, 1.45, 2.45), tgt=(-2.65, 1.4, 0.65), lens=28, level=True, shift=0.0),
    'aerea': dict(pos=None, tgt=(0, 0.7, 0.1), lens=31, level=False, shift=0.0, orbit=(0.62, 0.86, 13.4)),
}


def place(s):
    t = W(*s['tgt'])
    if s.get('orbit'):
        th, ph, rad = s['orbit']
        x, y, z = s['tgt']
        p = W(x + rad * math.sin(ph) * math.sin(th), y + rad * math.cos(ph), z + rad * math.sin(ph) * math.cos(th))
    else:
        p = W(*s['pos'])
    cam.location = p
    if s['level']:
        t = Vector((t.x, t.y, p.z))                     # cámara a nivel: líneas verticales paralelas
    aim(cam, t)
    cam_data.lens = s['lens']
    cam_data.shift_x = 0
    cam_data.shift_y = s['shift']
    cam_data.dof.use_dof = 'fstop' in s
    if cam_data.dof.use_dof:
        cam_data.dof.focus_distance = (W(*s['tgt']) - p).length
        cam_data.dof.aperture_fstop = s['fstop']
        cam_data.dof.aperture_blades = 7


def set_cut(on):
    for ob in bpy.data.objects:
        if ob.type != 'MESH':
            continue
        g = top_group(ob)
        ob.visible_camera = not (on and (g in CUT_AEREA or ob is mall_ceiling))
        # los muros del pasillo no dan sombra sobre la maqueta
        if ob.active_material is not None and base(ob.active_material.name) == 'muroPasillo':
            ob.hide_render = on


os.makedirs(A.out, exist_ok=True)
if A.blend:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(A.blend))
for name in [s.strip() for s in A.shots.split(',') if s.strip()]:
    s = SHOTS[name]
    place(s)
    set_cut(name == 'aerea')
    # vista aérea: maqueta cortada; sin el cielo del pasillo, el ambiente ilumina el piso alrededor
    mall_ceiling.hide_render = name == 'aerea'
    bg.inputs['Strength'].default_value = 1.1 if name == 'aerea' else 0.45
    r.filepath = os.path.join(os.path.abspath(A.out), 'render-' + name + ('-preview' if A.preview else '') + '.jpg')
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print('RENDER %s %.1fs -> %s' % (name, time.time() - t0, r.filepath), flush=True)
