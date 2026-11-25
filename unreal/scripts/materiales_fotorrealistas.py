# -*- coding: utf-8 -*-
"""
BlackForge 3D · Galería — materiales fotorrealistas con texturas de alta resolución.

1. Importa las texturas de galeria-unreal/texturas (las genera tools/texturas_unreal.py del repositorio):
   color, normal y rugosidad de roble de piso, enchape de roble, pintura, laca, melamina, concreto,
   metal cepillado, pintura negra electrostática y porcelanato.
2. Crea M_BF_Superficie: proyecta las texturas según la posición en el mundo (el tamaño real va en cm), así que
   no depende de las coordenadas de textura del modelo; la veta de la madera queda vertical en los muros y a lo
   largo del local en el piso. Normal y rugosidad vienen de las texturas.
3. Crea una instancia por superficie (MI_BF_*) y la pone en cada actor según el material que tenía.
Solo cambia el material de los actores del nivel; los recursos importados no se tocan. Se puede repetir.
"""
import glob, json, os, re, unreal

TEX_DIR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "texturas"))
RUTA_TEX = "/Game/Galeria/Texturas"
RUTA_MAT = "/Game/Galeria/Materiales"
REIMPORTAR_TEX = globals().get("REIMPORTAR_TEX", False)

# superficie: (textura, tinte sRGB, rugosidad ×, rugosidad +, metálico, fuerza normal, girar veta en el piso)
SUPERFICIES = {
    "Piso_Roble":       ("roble_piso",      (255, 255, 255), 1.0, 0.00, 0.0, 1.0, 0),
    "Enchape_Roble":    ("roble_enchape",   (255, 255, 255), 1.0, 0.00, 0.0, 0.8, 0),
    "Listones_Roble":   ("roble_enchape",   (238, 234, 228), 1.0, 0.05, 0.0, 1.0, 0),
    "Muro_Pintura":     ("pintura",         (236, 234, 229), 1.0, 0.00, 0.0, 0.6, 0),
    "Cielo_Pintura":    ("pintura",         (242, 241, 238), 1.0, 0.02, 0.0, 0.4, 0),
    "Pasillo_Muro":     ("pintura",         (214, 212, 207), 1.0, 0.00, 0.0, 0.5, 0),
    "Laca_Blanca":      ("laca",            (238, 236, 232), 1.0, 0.00, 0.0, 0.5, 0),
    "Melamina_Blanca":  ("melamina",        (232, 230, 226), 1.0, 0.00, 0.0, 0.5, 0),
    "Concreto":         ("concreto",        (255, 255, 255), 1.0, 0.00, 0.0, 1.0, 0),
    "Pintura_Negra":    ("pintura_negra",   (30, 30, 32),    1.0, 0.00, 0.0, 0.6, 0),
    "Aluminio":         ("metal_cepillado", (226, 227, 229), 0.9, 0.00, 1.0, 0.5, 0),
    "Acero":            ("metal_cepillado", (196, 197, 199), 1.0, 0.02, 1.0, 0.5, 0),
    "Porcelanato":      ("porcelanato",     (255, 255, 255), 1.0, 0.00, 0.0, 1.0, 0),
}
# material que trae el modelo → superficie nueva
ASIGNAR = [
    (r"^piso_de_madera$", "Piso_Roble"),
    (r"^piso_pasillo$", "Porcelanato"),
    (r"^muroPasillo\d*$", "Pasillo_Muro"),
    (r"^muro\d*$", "Muro_Pintura"),
    (r"^cielo\d*$", "Cielo_Pintura"),
    (r"^(laca|mdf15)$", "Laca_Blanca"),
    (r"^melBlanca$", "Melamina_Blanca"),
    (r"^melRovere$", "Enchape_Roble"),
    (r"^liston$", "Listones_Roble"),
    (r"^cemento$", "Concreto"),
    (r"^(carbonMate\d*|negro|carbon\d*)$", "Pintura_Negra"),
    (r"^alu$", "Aluminio"),
    (r"^(inox|acero)$", "Acero"),
]

AT = unreal.AssetToolsHelpers.get_asset_tools()
MEL = unreal.MaterialEditingLibrary
EAL = unreal.EditorAssetLibrary
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)


def log(*a):
    unreal.log("[Galería] " + " ".join(str(x) for x in a))


def lin(c):
    f = lambda v: (v / 255.0) / 12.92 if v / 255.0 <= 0.04045 else ((v / 255.0 + 0.055) / 1.055) ** 2.4
    return unreal.LinearColor(f(c[0]), f(c[1]), f(c[2]), 1.0)


# ------------------------------------------------------------------ texturas
def texturas():
    usadas = sorted({s[0] for s in SUPERFICIES.values()})
    out = {}
    for base in usadas:
        for suf in "CNR":
            nombre = "T_%s_%s" % (base, suf)
            ruta = "%s/%s" % (RUTA_TEX, nombre)
            png = os.path.join(TEX_DIR, "%s_%s.png" % (base, suf))
            if REIMPORTAR_TEX or not EAL.does_asset_exist(ruta):
                t = unreal.AssetImportTask()
                t.filename = png
                t.destination_path = RUTA_TEX
                t.destination_name = nombre
                t.automated = True
                t.replace_existing = True
                t.save = False
                AT.import_asset_tasks([t])
            tex = EAL.load_asset(ruta)
            if suf == "N":
                tex.set_editor_property("compression_settings", unreal.TextureCompressionSettings.TC_NORMALMAP)
                tex.set_editor_property("srgb", False)
                tex.set_editor_property("lod_group", unreal.TextureGroup.TEXTUREGROUP_WORLD_NORMAL_MAP)
            elif suf == "R":
                tex.set_editor_property("compression_settings", unreal.TextureCompressionSettings.TC_MASKS)
                tex.set_editor_property("srgb", False)
            else:
                tex.set_editor_property("srgb", True)
            EAL.save_loaded_asset(tex)
            out[(base, suf)] = tex
    log(len(out), "texturas listas")
    return out


# ------------------------------------------------------------------ material maestro
PESOS = """
float3 an = abs(N);
float3 w = pow(an, 8.0); w /= max(w.x + w.y + w.z, 1e-4);
float2 ux = float2(P.y, -P.z) / S;
float2 uy = float2(P.x, -P.z) / S;
float2 uz = (Girar > 0.5 ? P.yx : P.xy) / S;
"""
COD_COLOR = PESOS + """
return Texture2DSample(Tex, TexSampler, ux).rgb * w.x + Texture2DSample(Tex, TexSampler, uy).rgb * w.y
     + Texture2DSample(Tex, TexSampler, uz).rgb * w.z;
"""
COD_RUG = PESOS + """
float r = Texture2DSample(Tex, TexSampler, ux).r * w.x + Texture2DSample(Tex, TexSampler, uy).r * w.y
        + Texture2DSample(Tex, TexSampler, uz).r * w.z;
return saturate(r * Escala + Suma);
"""
COD_NORMAL = PESOS + """
float3 Uz = Girar > 0.5 ? float3(0, 1, 0) : float3(1, 0, 0);
float3 Vz = Girar > 0.5 ? float3(1, 0, 0) : float3(0, 1, 0);
float2 tx = Texture2DSample(Tex, TexSampler, ux).rg * 2 - 1;
float2 ty = Texture2DSample(Tex, TexSampler, uy).rg * 2 - 1;
float2 tz = Texture2DSample(Tex, TexSampler, uz).rg * 2 - 1;
float3 g = (tx.x * float3(0, 1, 0) + tx.y * float3(0, 0, -1)) * w.x
         + (ty.x * float3(1, 0, 0) + ty.y * float3(0, 0, -1)) * w.y
         + (tz.x * Uz + tz.y * Vz) * w.z;
return normalize(N + g * Fuerza);
"""


def nodo(m, cls, x, y, **props):
    e = MEL.create_material_expression(m, cls, x, y)
    for k, v in props.items():
        e.set_editor_property(k, v)
    return e


def con(a, b, entrada, salida=""):
    if not MEL.connect_material_expressions(a, salida, b, entrada):
        unreal.log_warning("[Galería] no se conectó %s → %s.%s" % (a.get_name(), b.get_name(), entrada))


def custom(m, codigo, tipo, entradas, x, y, desc):
    c = nodo(m, unreal.MaterialExpressionCustom, x, y)
    c.set_editor_property("code", codigo)
    c.set_editor_property("output_type", tipo)
    c.set_editor_property("description", desc)
    lista = []
    for nombre in entradas:
        ci = unreal.CustomInput()
        ci.set_editor_property("input_name", nombre)
        lista.append(ci)
    c.set_editor_property("inputs", lista)
    return c


def maestro(tex):
    ruta = RUTA_MAT + "/M_BF_Superficie"
    if EAL.does_asset_exist(ruta):
        m = EAL.load_asset(ruta)
        MEL.delete_all_material_expressions(m)
    else:
        m = AT.create_asset("M_BF_Superficie", RUTA_MAT, unreal.Material, unreal.MaterialFactoryNew())
    pos = nodo(m, unreal.MaterialExpressionWorldPosition, -1600, 0)
    nor = nodo(m, unreal.MaterialExpressionVertexNormalWS, -1600, 120)
    tam = nodo(m, unreal.MaterialExpressionScalarParameter, -1600, 240, parameter_name="Tamano", default_value=100.0)
    gir = nodo(m, unreal.MaterialExpressionScalarParameter, -1600, 360, parameter_name="Girar", default_value=0.0)
    any_c = tex[("roble_piso", "C")]; any_n = tex[("roble_piso", "N")]; any_r = tex[("roble_piso", "R")]
    tc = nodo(m, unreal.MaterialExpressionTextureObjectParameter, -1300, -400, parameter_name="TexColor", texture=any_c)
    tn = nodo(m, unreal.MaterialExpressionTextureObjectParameter, -1300, 500, parameter_name="TexNormal", texture=any_n)
    tr = nodo(m, unreal.MaterialExpressionTextureObjectParameter, -1300, 150, parameter_name="TexRugosidad", texture=any_r)
    tn.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    tr.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_MASKS)
    F3, F1 = unreal.CustomMaterialOutputType.CMOT_FLOAT3, unreal.CustomMaterialOutputType.CMOT_FLOAT1
    cc = custom(m, COD_COLOR, F3, ["Tex", "P", "N", "S", "Girar"], -1000, -400, "Color triplanar")
    cr = custom(m, COD_RUG, F1, ["Tex", "P", "N", "S", "Girar", "Escala", "Suma"], -1000, 150, "Rugosidad triplanar")
    cn = custom(m, COD_NORMAL, F3, ["Tex", "P", "N", "S", "Girar", "Fuerza"], -1000, 500, "Normal triplanar (mundo)")
    for c, t in ((cc, tc), (cr, tr), (cn, tn)):
        con(t, c, "Tex"); con(pos, c, "P"); con(nor, c, "N"); con(tam, c, "S"); con(gir, c, "Girar")
    esc = nodo(m, unreal.MaterialExpressionScalarParameter, -1300, 300, parameter_name="RugosidadEscala", default_value=1.0)
    suma = nodo(m, unreal.MaterialExpressionScalarParameter, -1300, 380, parameter_name="RugosidadSuma", default_value=0.0)
    con(esc, cr, "Escala"); con(suma, cr, "Suma")
    fza = nodo(m, unreal.MaterialExpressionScalarParameter, -1300, 650, parameter_name="NormalFuerza", default_value=1.0)
    con(fza, cn, "Fuerza")
    tinte = nodo(m, unreal.MaterialExpressionVectorParameter, -1000, -200, parameter_name="Tinte", default_value=unreal.LinearColor(1, 1, 1, 1))
    mul = nodo(m, unreal.MaterialExpressionMultiply, -650, -350)
    con(cc, mul, "A"); con(tinte, mul, "B")
    MEL.connect_material_property(mul, "", unreal.MaterialProperty.MP_BASE_COLOR)
    MEL.connect_material_property(cr, "", unreal.MaterialProperty.MP_ROUGHNESS)
    met = nodo(m, unreal.MaterialExpressionScalarParameter, -650, 0, parameter_name="Metalico", default_value=0.0)
    MEL.connect_material_property(met, "", unreal.MaterialProperty.MP_METALLIC)
    tr_n = nodo(m, unreal.MaterialExpressionTransform, -650, 500)
    tr_n.set_editor_property("transform_source_type", unreal.MaterialVectorCoordTransformSource.TRANSFORMSOURCE_WORLD)
    tr_n.set_editor_property("transform_type", unreal.MaterialVectorCoordTransform.TRANSFORM_TANGENT)
    con(cn, tr_n, "")
    MEL.connect_material_property(tr_n, "", unreal.MaterialProperty.MP_NORMAL)
    for uso in ("used_with_nanite", "used_with_static_lighting", "used_with_instanced_static_meshes"):
        try:
            m.set_editor_property(uso, True)
        except Exception:  # noqa
            pass
    MEL.recompile_material(m)
    EAL.save_loaded_asset(m)
    log("M_BF_Superficie compilado")
    return m


def instancias(m, tex):
    out = {}
    for nombre, (base, tinte, resc, rsum, metal, fuerza, girar) in SUPERFICIES.items():
        ruta = "%s/MI_BF_%s" % (RUTA_MAT, nombre)
        mi = EAL.load_asset(ruta) if EAL.does_asset_exist(ruta) else \
            AT.create_asset("MI_BF_" + nombre, RUTA_MAT, unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
        MEL.set_material_instance_parent(mi, m)
        MEL.set_material_instance_texture_parameter_value(mi, "TexColor", tex[(base, "C")])
        MEL.set_material_instance_texture_parameter_value(mi, "TexNormal", tex[(base, "N")])
        MEL.set_material_instance_texture_parameter_value(mi, "TexRugosidad", tex[(base, "R")])
        MEL.set_material_instance_vector_parameter_value(mi, "Tinte", lin(tinte))
        for p, v in (("Tamano", TAM[base]), ("RugosidadEscala", resc), ("RugosidadSuma", rsum),
                     ("Metalico", metal), ("NormalFuerza", fuerza), ("Girar", float(girar))):
            MEL.set_material_instance_scalar_parameter_value(mi, p, v)
        MEL.update_material_instance(mi)
        EAL.save_loaded_asset(mi)
        out[nombre] = mi
    log(len(out), "instancias MI_BF_*")
    return out


def asignar(mis):
    reglas = [(re.compile(p), mis[s]) for p, s in ASIGNAR]
    cuenta = {}
    with unreal.ScopedEditorTransaction("Materiales fotorrealistas"):
        for a in EAS.get_all_level_actors():
            if not isinstance(a, unreal.StaticMeshActor):
                continue
            c = a.static_mesh_component
            orig = c.get_editor_property("static_mesh")
            for i in range(c.get_num_materials()):
                mat = c.get_material(i)
                nombre = mat.get_name() if mat else ""
                # si ya tiene un MI_BF_, se vuelve a decidir con el material original de la malla
                if nombre.startswith("MI_BF_") and orig:
                    om = orig.get_material(i)
                    nombre = om.get_name() if om else nombre
                # las unidades AMS no son carretes sueltos: vuelven a su material y siguen las reglas
                if nombre == "M_BF_Carrete" and a.get_actor_label().startswith("Unidad_AMS") and orig:
                    om = orig.get_material(i)
                    c.set_material(i, om)
                    nombre = om.get_name() if om else ""
                for rx, mi in reglas:
                    if rx.match(nombre):
                        c.set_material(i, mi)
                        cuenta[mi.get_name()] = cuenta.get(mi.get_name(), 0) + 1
                        break
    log("asignados:", cuenta)


TAM = json.load(open(os.path.join(TEX_DIR, "tamanos.json")))
tex = texturas()
m = maestro(tex)
mis = instancias(m, tex)
asignar(mis)
unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
log("materiales fotorrealistas listos")
