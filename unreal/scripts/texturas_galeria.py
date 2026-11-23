# -*- coding: utf-8 -*-
"""
BlackForge 3D · Galería — texturas de los objetos en exhibición, las plantas y la silla.

Crea en /Game/Galeria/Materiales:
  M_BF_PLA   PLA impreso: color por colección, líneas de capa (se desvanecen de lejos para no hacer moiré),
             leve variación de tono y acabado mate, seda o metálico.
  M_BF_Hoja  hojas: dos tonos de verde con variación, dos caras.
y una instancia por colección. Los asigna solo a esas piezas (sobrescribe el material en el actor, no toca los
recursos importados). Se puede ejecutar varias veces.
"""
import json, os, re
import unreal

RUTA = "/Game/Galeria/Materiales"
CAPA_CM = 0.02          # altura de capa: 0.2 mm
PROF_CAPA = 0.6         # cuánto se marcan las líneas de capa

# color sRGB 0-255, rugosidad, metálico — una colección por mueble
COLECCIONES = {
    "02": ("Terracota mate", (176, 92, 62), 0.62, 0.0),
    "03": ("Seda dorada", (214, 160, 72), 0.30, 0.65),
    "04": ("Grafito mate", (46, 46, 50), 0.55, 0.0),
    "07": ("Azul petróleo", (24, 84, 100), 0.45, 0.0),
    "05": ("Arena", (200, 176, 136), 0.6, 0.0),
    "09": ("Rojo carmín", (160, 30, 28), 0.45, 0.0),
    "10": ("Gris perla", (170, 172, 176), 0.5, 0.0),
    "11": ("Azul cobalto", (40, 80, 170), 0.45, 0.0),
    "12": ("Seda cobre", (190, 108, 70), 0.30, 0.6),
    "13": ("Verde salvia", (140, 160, 128), 0.55, 0.0),
    "16": ("Blanco natural", (226, 220, 206), 0.6, 0.0),
    "17": ("Naranja", (232, 104, 26), 0.45, 0.0),
}
POR_DEFECTO = ("Blanco perla", (236, 232, 224), 0.5, 0.0)
CAMAS = [("Naranja", (232, 104, 26)), ("Verde menta", (110, 190, 150)), ("Azul cobalto", (40, 80, 170)), ("Amarillo", (236, 190, 40))]
SILLA = ("Tela grafito", (38, 38, 42), 0.85, 0.0)

AT = unreal.AssetToolsHelpers.get_asset_tools()
MEL = unreal.MaterialEditingLibrary
EAL = unreal.EditorAssetLibrary
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
CARPETA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def log(*a):
    unreal.log("[Galería] " + " ".join(str(x) for x in a))


def lin(c):
    f = lambda v: (v / 255.0) ** 2.2
    return unreal.LinearColor(f(c[0]), f(c[1]), f(c[2]), 1.0)


def material(nombre):
    ruta = RUTA + "/" + nombre
    if EAL.does_asset_exist(ruta):
        m = EAL.load_asset(ruta)
        MEL.delete_all_material_expressions(m)
        return m
    return AT.create_asset(nombre, RUTA, unreal.Material, unreal.MaterialFactoryNew())


def nodo(m, cls, x, y, **props):
    e = MEL.create_material_expression(m, cls, x, y)
    for k, v in props.items():
        e.set_editor_property(k, v)
    return e


def con(a, b, entrada, salida=""):
    MEL.connect_material_expressions(a, salida, b, entrada)


def maestro_pla():
    """Color por colección con variación de tono; las líneas de capa (0.2 mm) se marcan en el tono y el brillo,
    no en la normal (una normal en espacio del mundo apaga el color con Substrate en Unreal 5.8)."""
    m = material("M_BF_PLA")
    m.set_editor_property("tangent_space_normal", True)
    color = nodo(m, unreal.MaterialExpressionVectorParameter, -1100, -400, parameter_name="Color", default_value=lin(POR_DEFECTO[1]))
    rug = nodo(m, unreal.MaterialExpressionScalarParameter, -700, 100, parameter_name="Rugosidad", default_value=0.5)
    met = nodo(m, unreal.MaterialExpressionScalarParameter, -400, -100, parameter_name="Metalico", default_value=0.0)
    capa = nodo(m, unreal.MaterialExpressionScalarParameter, -1600, 300, parameter_name="AlturaCapa", default_value=CAPA_CM)
    prof = nodo(m, unreal.MaterialExpressionScalarParameter, -1100, 600, parameter_name="ProfundidadCapa", default_value=PROF_CAPA)
    # líneas: s = sin(2π z / capa) · fuerza, que se apaga entre 0 y 1.8 m de distancia para no hacer moiré
    wp = nodo(m, unreal.MaterialExpressionWorldPosition, -1800, 200)
    z = nodo(m, unreal.MaterialExpressionComponentMask, -1600, 200, r=False, g=False, b=True, a=False)
    con(wp, z, "")
    div = nodo(m, unreal.MaterialExpressionDivide, -1400, 250)
    con(z, div, "A"); con(capa, div, "B")
    sen = nodo(m, unreal.MaterialExpressionSine, -1200, 250, period=1.0)
    con(div, sen, "")
    pd = nodo(m, unreal.MaterialExpressionPixelDepth, -1600, 450)
    dd = nodo(m, unreal.MaterialExpressionDivide, -1400, 450)
    con(pd, dd, "A"); dd.set_editor_property("const_b", 250.0)
    sat = nodo(m, unreal.MaterialExpressionSaturate, -1250, 450)
    con(dd, sat, "")
    inv = nodo(m, unreal.MaterialExpressionOneMinus, -1100, 450)
    con(sat, inv, "")
    k = nodo(m, unreal.MaterialExpressionMultiply, -950, 450)
    con(inv, k, "A"); con(prof, k, "B")
    s_ = nodo(m, unreal.MaterialExpressionMultiply, -800, 300)
    con(sen, s_, "A"); con(k, s_, "B")
    # tono: ruido 0-1 entre el color y un 12 % más oscuro, y bandas de capa ±8 %
    ruido = nodo(m, unreal.MaterialExpressionNoise, -1100, -250, scale=0.08, levels=2)
    ruido.set_editor_property("output_min", 0.0)
    ruido.set_editor_property("output_max", 1.0)
    oscuro = nodo(m, unreal.MaterialExpressionMultiply, -900, -480)
    con(color, oscuro, "A"); oscuro.set_editor_property("const_b", 0.88)
    mezcla = nodo(m, unreal.MaterialExpressionLinearInterpolate, -700, -350)
    con(oscuro, mezcla, "A"); con(color, mezcla, "B"); con(ruido, mezcla, "Alpha")
    banda = nodo(m, unreal.MaterialExpressionMultiply, -600, 200)
    con(s_, banda, "A"); banda.set_editor_property("const_b", 0.08)
    fac = nodo(m, unreal.MaterialExpressionOneMinus, -450, 200)
    con(banda, fac, "")
    base = nodo(m, unreal.MaterialExpressionMultiply, -300, -250)
    con(mezcla, base, "A"); con(fac, base, "B")
    MEL.connect_material_property(base, "", unreal.MaterialProperty.MP_BASE_COLOR)
    # brillo: la cresta de cada capa brilla un poco más que el valle
    br = nodo(m, unreal.MaterialExpressionMultiply, -600, 350)
    con(s_, br, "A"); br.set_editor_property("const_b", 0.12)
    r2 = nodo(m, unreal.MaterialExpressionAdd, -400, 150)
    con(rug, r2, "A"); con(br, r2, "B")
    MEL.connect_material_property(r2, "", unreal.MaterialProperty.MP_ROUGHNESS)
    MEL.connect_material_property(met, "", unreal.MaterialProperty.MP_METALLIC)
    MEL.recompile_material(m)
    EAL.save_loaded_asset(m)
    return m


def maestro_hoja():
    m = material("M_BF_Hoja")
    m.set_editor_property("two_sided", True)
    a = nodo(m, unreal.MaterialExpressionVectorParameter, -700, -300, parameter_name="VerdeOscuro", default_value=lin((38, 72, 34)))
    b = nodo(m, unreal.MaterialExpressionVectorParameter, -700, -150, parameter_name="VerdeClaro", default_value=lin((104, 142, 64)))
    r = nodo(m, unreal.MaterialExpressionNoise, -700, 0, scale=0.12, output_min=0.0, output_max=1.0, levels=3)
    l = nodo(m, unreal.MaterialExpressionLinearInterpolate, -400, -150)
    con(a, l, "A"); con(b, l, "B"); con(r, l, "Alpha")
    MEL.connect_material_property(l, "", unreal.MaterialProperty.MP_BASE_COLOR)
    rug = nodo(m, unreal.MaterialExpressionConstant, -400, 50, r=0.55)
    MEL.connect_material_property(rug, "", unreal.MaterialProperty.MP_ROUGHNESS)
    spec = nodo(m, unreal.MaterialExpressionConstant, -400, 150, r=0.35)
    MEL.connect_material_property(spec, "", unreal.MaterialProperty.MP_SPECULAR)
    MEL.recompile_material(m)
    EAL.save_loaded_asset(m)
    return m


def instancia(padre, nombre, vec=None, esc=None):
    nombre = "MI_" + re.sub(r"[^A-Za-z0-9]+", "_", nombre)
    ruta = RUTA + "/" + nombre
    mi = EAL.load_asset(ruta) if EAL.does_asset_exist(ruta) else AT.create_asset(nombre, RUTA, unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
    MEL.set_material_instance_parent(mi, padre)
    for k, v in (vec or {}).items():
        MEL.set_material_instance_vector_parameter_value(mi, k, v)
    for k, v in (esc or {}).items():
        MEL.set_material_instance_scalar_parameter_value(mi, k, v)
    MEL.update_material_instance(mi)
    EAL.save_loaded_asset(mi)
    return mi


def pla(padre, c, sin_capas=False):
    nombre, rgb, rug, met = c
    return instancia(padre, "PLA " + nombre, {"Color": lin(rgb)}, {"Rugosidad": rug, "Metalico": met, "ProfundidadCapa": 0.0 if sin_capas else PROF_CAPA})


def mueble_de(a):
    p = a
    while p:
        m = re.match(r"^(\d\d)_", p.get_actor_label())
        if m:
            return m.group(1), p.get_actor_label()
        p = p.get_attach_parent_actor()
    return None, ""


def poner(a, mi, solo=None):
    c = a.static_mesh_component
    n = 0
    for i in range(c.get_num_materials()):
        m = c.get_material(i)
        if solo is None or (m and m.get_name() in solo):
            c.set_material(i, mi)
            n += 1
    return n


def main():
    pla_m, hoja_m = maestro_pla(), maestro_hoja()
    hoja = instancia(hoja_m, "Hoja")
    silla = pla(pla_m, SILLA, True)
    cache, reporte = {}, []
    camas = [pla(pla_m, (n, c, 0.45, 0.0)) for n, c in CAMAS]
    nc = 0
    with unreal.ScopedEditorTransaction("Texturas de la Galería"):
        for a in EAS.get_all_level_actors():
            if not isinstance(a, unreal.StaticMeshActor):
                continue
            lb = a.get_actor_label()
            num, padre = mueble_de(a)
            if lb.startswith("Piezas_impresas") or lb.startswith("Ganchos_y"):
                c = COLECCIONES.get(num, POR_DEFECTO)
                if c[0] not in cache:
                    cache[c[0]] = pla(pla_m, c)
                k = poner(a, cache[c[0]], {"decor", "decorMate", "impreso"})
                reporte.append([padre, lb[:40], c[0], k])
            elif lb.startswith("Pieza_") and "detalle" in lb:
                m = re.search(r"Impresoras_3D_(\d)", padre)
                i = (int(m.group(1)) - 1) % len(camas) if m else nc % len(camas)
                nc += 1
                k = poner(a, camas[i], {"impreso"})
                reporte.append([padre, lb[:40], CAMAS[i][0], k])
            elif lb.startswith("Planta"):
                reporte.append([padre, lb[:40], "Hoja", poner(a, hoja, {"decorMate"})])
            elif lb.startswith("Silla"):
                reporte.append([padre, lb[:40], SILLA[0], poner(a, silla, {"decorMate"})])
    with open(os.path.join(CARPETA, "texturas.json"), "w", encoding="utf-8") as f:
        json.dump(reporte, f, ensure_ascii=False, indent=1)
    unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
    log(len(reporte), "piezas con textura nueva")


main()
