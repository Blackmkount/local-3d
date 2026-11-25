# -*- coding: utf-8 -*-
"""
BlackForge 3D · Galería — interfaz del recorrido: brújula arriba y minimapa con la posición del visitante.

Es un material de posproceso (M_BF_HUD) que se dibuja sobre la imagen, sin Blueprints:
  · minimapa arriba a la derecha: el plano del local (texturas/hud_plano.png, sale del mismo modelo) con un
    punto y un cono que muestran dónde está y hacia dónde mira el visitante
  · brújula arriba al centro: N es el fondo del local, E el lado de las impresoras
VISIBLE = False lo apaga (por ejemplo, para renders). Se puede ejecutar varias veces.
"""
import os, unreal

VISIBLE = globals().get("VISIBLE", True)
MAPA = (-360.0, 360.0, -400.0, 680.0)     # x0, x1, y0, y1 del plano en cm (el mismo encuadre de hud_plano.png)
TEX_DIR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "texturas"))
RUTA = "/Game/Galeria/HUD"

AT = unreal.AssetToolsHelpers.get_asset_tools()
MEL = unreal.MaterialEditingLibrary
EAL = unreal.EditorAssetLibrary
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)

CODIGO = """
float3 col = Scene;
if (Vis < 0.5) return col;
float asp = VS.x / VS.y;
float X0 = %(x0).1f, X1 = %(x1).1f, Y0 = %(y0).1f, Y1 = %(y1).1f;
// ---------- minimapa (arriba a la derecha)
float Hm = 0.34;
float Wm = Hm * ((X1 - X0) / (Y1 - Y0)) / asp;
float2 org = float2(1.0 - Wm - 0.025, 0.06);
float2 m = (UV - org) / float2(Wm, Hm);
float2 pp = (UV - (org + float2(Wm, Hm) * 0.5)) * float2(asp, 1);
float2 medio = float2(Wm * asp, Hm) * 0.5 + 0.014;
float2 q = abs(pp) - medio + 0.014;
float dpan = length(max(q, 0)) + min(max(q.x, q.y), 0) - 0.014;
float panel = saturate(-dpan * VS.y);
col = lerp(col, col * 0.30 + float3(0.015, 0.015, 0.02), panel * 0.88);
if (m.x >= 0 && m.y >= 0 && m.x <= 1 && m.y <= 1) {
    float4 pl = Texture2DSample(Plan, PlanSampler, m);
    col = lerp(col, float3(0.93, 0.93, 0.93), pl.a * 0.92);
}
float2 pm = saturate(float2((Cam.x - X0) / (X1 - X0), (Cam.y - Y0) / (Y1 - Y0)));
float2 d = (m - pm) * float2(Wm * asp, Hm);
float r = length(d);
float2 f2 = normalize(float2(Fwd.x, Fwd.y) + 1e-5);
float ang = dot(d / max(r, 1e-5), f2);
float cono = smoothstep(0.80, 0.87, ang) * (1 - smoothstep(0.015, 0.06, r)) * panel;
col = lerp(col, float3(1, 1, 1), cono * 0.5);
col = lerp(col, float3(1, 1, 1), (1 - smoothstep(0.0050, 0.0068, r)) * panel);
col = lerp(col, float3(1, 1, 1), (1 - smoothstep(0.0006, 0.0016, abs(r - 0.0095))) * panel * 0.55);
// ---------- brújula (arriba al centro)
float head = atan2(Fwd.x, -Fwd.y) / 6.2831853;
float Wc = 0.40;
float2 cu = float2((UV.x - 0.5) / Wc, (UV.y - 0.03) / 0.048);
if (abs(cu.x) <= 0.5 && cu.y >= 0 && cu.y <= 1) {
    float u = head + cu.x * 120.0 / 360.0;
    float4 c = Texture2DSample(Comp, CompSampler, float2(u, cu.y));
    float fade = 1 - smoothstep(0.28, 0.5, abs(cu.x));
    col = lerp(col * (1 - 0.18 * fade), float3(1, 1, 1), c.a * fade * 0.92);
    float centro = (1 - smoothstep(0.0010, 0.0020, abs(cu.x * Wc * asp))) * step(cu.y, 0.42);
    col = lerp(col, float3(0.92, 0.22, 0.18), centro);
}
return col;
"""


def log(*a):
    unreal.log("[Galería] " + " ".join(str(x) for x in a))


def textura(nombre, png):
    ruta = "%s/%s" % (RUTA, nombre)
    t = unreal.AssetImportTask()
    t.filename = png
    t.destination_path = RUTA
    t.destination_name = nombre
    t.automated = True
    t.replace_existing = True
    t.save = False
    AT.import_asset_tasks([t])
    tex = EAL.load_asset(ruta)
    tex.set_editor_property("compression_settings", unreal.TextureCompressionSettings.TC_EDITOR_ICON)
    tex.set_editor_property("lod_group", unreal.TextureGroup.TEXTUREGROUP_UI)
    tex.set_editor_property("mip_gen_settings", unreal.TextureMipGenSettings.TMGS_NO_MIPMAPS)
    tex.set_editor_property("srgb", True)
    EAL.save_loaded_asset(tex)
    return tex


def nodo(m, cls, x, y, **props):
    e = MEL.create_material_expression(m, cls, x, y)
    for k, v in props.items():
        e.set_editor_property(k, v)
    return e


def con(a, b, entrada, salida=""):
    if not MEL.connect_material_expressions(a, salida, b, entrada):
        unreal.log_warning("[Galería] no se conectó %s.%s → %s.%s" % (a.get_name(), salida, b.get_name(), entrada))


def material(plano, brujula):
    ruta = RUTA + "/M_BF_HUD"
    if EAL.does_asset_exist(ruta):
        m = EAL.load_asset(ruta)
        MEL.delete_all_material_expressions(m)
    else:
        m = AT.create_asset("M_BF_HUD", RUTA, unreal.Material, unreal.MaterialFactoryNew())
    m.set_editor_property("material_domain", unreal.MaterialDomain.MD_POST_PROCESS)
    try:
        m.set_editor_property("blendable_location", unreal.BlendableLocation.BL_SCENE_COLOR_AFTER_TONEMAPPING)
    except Exception:  # noqa
        m.set_editor_property("blendable_location", unreal.BlendableLocation.BL_AFTER_TONEMAPPING)
    esc = nodo(m, unreal.MaterialExpressionSceneTexture, -900, -300)
    esc.set_editor_property("scene_texture_id", unreal.SceneTextureId.PPI_POST_PROCESS_INPUT0)
    pos = nodo(m, unreal.MaterialExpressionScreenPosition, -900, -150)
    vs = nodo(m, unreal.MaterialExpressionViewSize, -900, -50)
    cam = nodo(m, unreal.MaterialExpressionCameraPositionWS, -900, 50)
    z = nodo(m, unreal.MaterialExpressionConstant3Vector, -1100, 150, constant=unreal.LinearColor(0, 0, 1, 0))
    fwd = nodo(m, unreal.MaterialExpressionTransform, -900, 150)
    fwd.set_editor_property("transform_source_type", unreal.MaterialVectorCoordTransformSource.TRANSFORMSOURCE_VIEW)
    fwd.set_editor_property("transform_type", unreal.MaterialVectorCoordTransform.TRANSFORM_WORLD)
    con(z, fwd, "")
    tp = nodo(m, unreal.MaterialExpressionTextureObjectParameter, -900, 300, parameter_name="Plano", texture=plano)
    tc = nodo(m, unreal.MaterialExpressionTextureObjectParameter, -900, 450, parameter_name="Brujula", texture=brujula)
    vis = nodo(m, unreal.MaterialExpressionScalarParameter, -900, 600, parameter_name="Visible", default_value=1.0)
    c = nodo(m, unreal.MaterialExpressionCustom, -450, 0)
    c.set_editor_property("code", CODIGO % {"x0": MAPA[0], "x1": MAPA[1], "y0": MAPA[2], "y1": MAPA[3]})
    c.set_editor_property("output_type", unreal.CustomMaterialOutputType.CMOT_FLOAT3)
    c.set_editor_property("description", "Brújula y minimapa")
    entradas = []
    for n in ("Scene", "UV", "VS", "Cam", "Fwd", "Plan", "Comp", "Vis"):
        ci = unreal.CustomInput()
        ci.set_editor_property("input_name", n)
        entradas.append(ci)
    c.set_editor_property("inputs", entradas)
    con(esc, c, "Scene", "Color")
    con(pos, c, "UV", "ViewportUV")
    con(vs, c, "VS")
    con(cam, c, "Cam")
    con(fwd, c, "Fwd")
    con(tp, c, "Plan")
    con(tc, c, "Comp")
    con(vis, c, "Vis")
    MEL.connect_material_property(c, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    MEL.recompile_material(m)
    EAL.save_loaded_asset(m)
    return m


def instancia(m):
    ruta = RUTA + "/MI_BF_HUD"
    mi = EAL.load_asset(ruta) if EAL.does_asset_exist(ruta) else \
        AT.create_asset("MI_BF_HUD", RUTA, unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
    MEL.set_material_instance_parent(mi, m)
    MEL.set_material_instance_scalar_parameter_value(mi, "Visible", 1.0 if VISIBLE else 0.0)
    MEL.update_material_instance(mi)
    EAL.save_loaded_asset(mi)
    return mi


def poner(mi):
    v = next((a for a in EAS.get_all_level_actors() if a.get_actor_label() == "Postproceso_Galeria"), None)
    s = v.get_editor_property("settings")
    lista = [b for b in list(s.weighted_blendables.array) if b.object and "HUD" not in b.object.get_name()]
    wb = unreal.WeightedBlendable()
    wb.set_editor_property("weight", 1.0)
    wb.set_editor_property("object", mi)
    lista.append(wb)
    wbs = unreal.WeightedBlendables()
    wbs.set_editor_property("array", lista)
    s.set_editor_property("weighted_blendables", wbs)
    v.set_editor_property("settings", s)


plano = textura("T_HUD_Plano", os.path.join(TEX_DIR, "hud_plano.png"))
brujula = textura("T_HUD_Brujula", os.path.join(TEX_DIR, "hud_brujula.png"))
m = material(plano, brujula)
poner(instancia(m))
unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
log("interfaz del recorrido %s" % ("visible" if VISIBLE else "apagada"))
