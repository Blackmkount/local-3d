# -*- coding: utf-8 -*-
"""
BlackForge 3D · Galería — carretes de filamento de cartón.

M_BF_Carrete usa el color de vértice que trae el modelo (cada carrete con su color de filamento):
  · las tapas y el centro del carrete (oscuros en exportaciones viejas, cartón en las nuevas) pasan a cartón
    kraft, mate y con fibra
  · el resto queda del color del filamento, con brillo de plástico y las vueltas del hilo
Se aplica a lo que tiene carretes: repisa de filamentos (09), laboratorio (07), panel de accesorios (11)
y bodega (16). Las unidades AMS conservan su material. Se puede ejecutar varias veces.
"""
import re
import unreal

RUTA = "/Game/Galeria/Materiales"
CARTON = (182, 142, 98)          # kraft, sRGB
HILO_CM = 0.175                  # diámetro del filamento: 1.75 mm

AT = unreal.AssetToolsHelpers.get_asset_tools()
MEL = unreal.MaterialEditingLibrary
EAL = unreal.EditorAssetLibrary
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)


def log(*a):
    unreal.log("[Galería] " + " ".join(str(x) for x in a))


def lin(c):
    f = lambda v: (v / 255.0) ** 2.2
    return unreal.LinearColor(f(c[0]), f(c[1]), f(c[2]), 1.0)


def nodo(m, cls, x, y, **props):
    e = MEL.create_material_expression(m, cls, x, y)
    for k, v in props.items():
        e.set_editor_property(k, v)
    return e


def con(a, b, entrada, salida=""):
    MEL.connect_material_expressions(a, salida, b, entrada)


def material():
    ruta = RUTA + "/M_BF_Carrete"
    if EAL.does_asset_exist(ruta):
        m = EAL.load_asset(ruta)
        MEL.delete_all_material_expressions(m)
    else:
        m = AT.create_asset("M_BF_Carrete", RUTA, unreal.Material, unreal.MaterialFactoryNew())
    vc = nodo(m, unreal.MaterialExpressionVertexColor, -1400, -200)
    # máscara de cartón: luminancia del color de vértice por debajo de 0.06 (tapas 0x1c1c1e y centro 0x3a3a3d)
    pesos = nodo(m, unreal.MaterialExpressionConstant3Vector, -1400, 0, constant=unreal.LinearColor(0.299, 0.587, 0.114, 1))
    lum = nodo(m, unreal.MaterialExpressionDotProduct, -1200, -100)
    con(vc, lum, "A"); con(pesos, lum, "B")
    resta = nodo(m, unreal.MaterialExpressionSubtract, -1050, -100, const_a=0.06)
    con(lum, resta, "B")
    esc = nodo(m, unreal.MaterialExpressionMultiply, -900, -100, const_b=60.0)
    con(resta, esc, "A")
    oscura = nodo(m, unreal.MaterialExpressionSaturate, -750, -100)
    con(esc, oscura, "")
    # o cartón ya pintado en el modelo (visor web desde nov. 2026: tapas 0xb08a5c y centro 0x9c7a52)
    ref = nodo(m, unreal.MaterialExpressionConstant3Vector, -1400, -350, constant=lin((166, 130, 87)))
    dist = nodo(m, unreal.MaterialExpressionDistance, -1200, -300)
    con(vc, dist, "A"); con(ref, dist, "B")
    cerca = nodo(m, unreal.MaterialExpressionSubtract, -1050, -300, const_a=0.10)
    con(dist, cerca, "B")
    esc2 = nodo(m, unreal.MaterialExpressionMultiply, -900, -300, const_b=30.0)
    con(cerca, esc2, "A")
    kr = nodo(m, unreal.MaterialExpressionSaturate, -750, -300)
    con(esc2, kr, "")
    mask = nodo(m, unreal.MaterialExpressionMax, -620, -200)
    con(oscura, mask, "A"); con(kr, mask, "B")
    # cartón: kraft con fibras (ruido fino y otro grande)
    carton = nodo(m, unreal.MaterialExpressionVectorParameter, -1100, 250, parameter_name="Carton", default_value=lin(CARTON))
    fibra = nodo(m, unreal.MaterialExpressionNoise, -1100, 400, scale=1.5, levels=3)
    fibra.set_editor_property("output_min", 0.0); fibra.set_editor_property("output_max", 1.0)
    oscuro = nodo(m, unreal.MaterialExpressionMultiply, -900, 200, const_b=0.8)
    con(carton, oscuro, "A")
    kraft = nodo(m, unreal.MaterialExpressionLinearInterpolate, -700, 250)
    con(oscuro, kraft, "A"); con(carton, kraft, "B"); con(fibra, kraft, "Alpha")
    # filamento: el color del carrete con las vueltas del hilo (bandas finas que se apagan de lejos)
    wp = nodo(m, unreal.MaterialExpressionWorldPosition, -1600, 600)
    y = nodo(m, unreal.MaterialExpressionComponentMask, -1400, 600, r=True, g=True, b=False, a=False)
    con(wp, y, "")
    ysum = nodo(m, unreal.MaterialExpressionDotProduct, -1250, 600)
    con(y, ysum, "A")
    uno = nodo(m, unreal.MaterialExpressionConstant2Vector, -1400, 700, r=0.7071, g=0.7071)
    con(uno, ysum, "B")
    div = nodo(m, unreal.MaterialExpressionDivide, -1100, 600, const_b=HILO_CM)
    con(ysum, div, "A")
    sen = nodo(m, unreal.MaterialExpressionSine, -950, 600, period=1.0)
    con(div, sen, "")
    pd = nodo(m, unreal.MaterialExpressionPixelDepth, -1100, 750)
    dd = nodo(m, unreal.MaterialExpressionDivide, -950, 750, const_b=150.0)
    con(pd, dd, "A")
    sat = nodo(m, unreal.MaterialExpressionSaturate, -800, 750)
    con(dd, sat, "")
    inv = nodo(m, unreal.MaterialExpressionOneMinus, -650, 750)
    con(sat, inv, "")
    k = nodo(m, unreal.MaterialExpressionMultiply, -650, 600, const_b=0.12)
    con(sen, k, "A")
    k2 = nodo(m, unreal.MaterialExpressionMultiply, -500, 650)
    con(k, k2, "A"); con(inv, k2, "B")
    fac = nodo(m, unreal.MaterialExpressionOneMinus, -350, 650)
    con(k2, fac, "")
    hilo = nodo(m, unreal.MaterialExpressionMultiply, -500, -250)
    con(vc, hilo, "A"); con(fac, hilo, "B")
    base = nodo(m, unreal.MaterialExpressionLinearInterpolate, -250, -100)
    con(hilo, base, "A"); con(kraft, base, "B"); con(mask, base, "Alpha")
    MEL.connect_material_property(base, "", unreal.MaterialProperty.MP_BASE_COLOR)
    rug = nodo(m, unreal.MaterialExpressionLinearInterpolate, -250, 100, const_a=0.32, const_b=0.88)
    con(mask, rug, "Alpha")
    MEL.connect_material_property(rug, "", unreal.MaterialProperty.MP_ROUGHNESS)
    MEL.recompile_material(m)
    EAL.save_loaded_asset(m)
    return m


def mueble_de(a):
    p = a
    while p:
        mm = re.match(r"^(\d\d)_", p.get_actor_label())
        if mm:
            return mm.group(1)
        p = p.get_attach_parent_actor()
    return None


def main():
    mat = material()
    n = 0
    with unreal.ScopedEditorTransaction("Carretes de cartón"):
        for a in EAS.get_all_level_actors():
            if not isinstance(a, unreal.StaticMeshActor):
                continue
            lb, num = a.get_actor_label(), mueble_de(a)
            es = (lb.startswith("Piezas_impresas") and num in ("07", "09", "16")) or lb.startswith("Ganchos_y")
            if es:
                c = a.static_mesh_component
                for i in range(c.get_num_materials()):
                    c.set_material(i, mat)
                n += 1
    unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
    log(n, "grupos de carretes con cartón")


main()
