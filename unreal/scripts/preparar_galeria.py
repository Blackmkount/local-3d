# -*- coding: utf-8 -*-
"""
BlackForge 3D · Galería → Unreal Engine 5.8
=========================================================================
Arma el recorrido de la Galería en el nivel /Game/Galeria/Mapas/L_Galeria:

  1. Crea (o abre) el nivel e importa galeria.glb con Interchange
     (lo mismo que Archivo > Importar al nivel).
  2. Convierte los marcadores del modelo en:
       · una luz por cada tira LED del despiece (3000 K, del largo de la tira)
       · los focos y la luz cálida del local, y la luz del pasillo del centro comercial
       · el inicio del recorrido (Player Start) y las cámaras «fachada» e «interior»
       · el nombre de cada mueble flotando sobre él (se puede apagar: ETIQUETAS = False)
  3. Colisión en todas las piezas (para caminar sin atravesar muebles ni muros),
     luz del cielo, volumen de postproceso con Lumen y modo de juego en primera persona.

Cómo se usa (ver LEEME.md):
  Herramientas > Ejecutar script de Python… (Tools > Execute Python Script…) y elegir este archivo.
  Se puede volver a ejecutar: borra lo que generó antes (etiqueta BF_GEN) y lo crea de nuevo,
  sin volver a importar el modelo. Para reimportar: REIMPORTAR = True.
"""
import json
import math
import os
import re

import unreal

# --------------------------------------------------------------------------- ajustes
CARPETA = None            # carpeta del paquete (la que tiene galeria.glb); None = la de este script, un nivel arriba
NIVEL = "/Game/Galeria/Mapas/L_Galeria"
DESTINO = "/Game/Galeria/Modelo"
REIMPORTAR = False
ETIQUETAS = True          # nombre de cada mueble sobre él durante el recorrido
COLISIONES = True         # cajas de colisión para caminar sin atravesar muebles ni muros

LED_LM_POR_METRO = 700.0  # flujo de las tiras (COB y perfil LED de 12 V) en lúmenes por metro
LED_KELVIN = 3000.0
FOCO_LM = 900.0           # focos del riel y colgantes
CALIDA_LM = 1800.0        # luz general cálida del cielo raso
PASILLO_LM = 9000.0       # luz del pasillo del centro comercial, frente a la fachada
EV_MIN, EV_MAX = 6.0, 10.0  # rango de la exposición automática (EV100)

TAG = "BF_GEN"
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
LES = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)


def log(*a):
    unreal.log("[Galería] " + " ".join(str(x) for x in a))


def carpeta():
    if CARPETA:
        return CARPETA
    try:
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    except NameError:
        raise RuntimeError("Escribe en CARPETA la ruta de la carpeta que tiene galeria.glb")


def ajustar(obj, prop, valor):
    """set_editor_property tolerante: si la propiedad cambió de nombre en esta versión, avisa y sigue."""
    try:
        obj.set_editor_property(prop, valor)
        return True
    except Exception as e:  # noqa
        unreal.log_warning("[Galería] no se pudo ajustar %s.%s: %s" % (obj.get_class().get_name(), prop, e))
        return False


# --------------------------------------------------------------------------- 1. nivel e importación
def abrir_nivel():
    mundo = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
    if mundo and mundo.get_path_name().split(".")[0] == NIVEL:
        return
    if unreal.EditorAssetLibrary.does_asset_exist(NIVEL):
        LES.load_level(NIVEL)
    else:
        LES.new_level(NIVEL)
        log("nivel nuevo", NIVEL)


def marcadores():
    out = {}
    for a in EAS.get_all_level_actors():
        m = re.search(r"(LED_\d+_\d+_(?:A_L\d+|C)|LUZ_(?:FOCO|CALIDA)_\d+_(?:A_I\d+|B_G\d+)|INICIO_[AB]|CAM_[a-z]+_[AB]|INFO_\d+)", a.get_actor_label())
        if m and isinstance(a, unreal.StaticMeshActor):
            origen, _ = a.get_actor_bounds(False)
            out[m.group(1)] = (a, origen)
    return out


def importar():
    glb = os.path.join(carpeta(), "galeria.glb")
    if not os.path.exists(glb):
        raise RuntimeError("No encuentro " + glb)
    log("importando", glb, "(puede tardar un par de minutos)")
    mgr = unreal.InterchangeManager.get_interchange_manager_scripted()
    src = unreal.InterchangeManager.create_source_data(glb)
    prm = unreal.ImportAssetParameters()
    prm.is_automated = True
    try:
        prm.replace_existing = True
    except Exception:  # noqa
        pass
    ok = mgr.import_scene(DESTINO, src, prm)
    log("importación", "lista" if ok else "con errores (revisa el registro de salida)")


# --------------------------------------------------------------------------- utilidades de geometría
def resta(a, b):
    return unreal.Vector(a.x - b.x, a.y - b.y, a.z - b.z)


def unit(v):
    n = math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) or 1.0
    return unreal.Vector(v.x / n, v.y / n, v.z / n)


def rot_hacia(d):
    return unreal.MathLibrary.make_rot_from_x(unit(d))


def generar(clase, pos, rot=None, carpeta_mundo="Galeria", nombre=None):
    a = EAS.spawn_actor_from_class(clase, pos, rot or unreal.Rotator(0, 0, 0))
    a.tags = [unreal.Name(TAG)]
    a.set_folder_path(carpeta_mundo)
    if nombre:
        a.set_actor_label(nombre)
    return a


def luz(a, lm, kelvin, radio, sombras):
    c = a.get_component_by_class(unreal.LocalLightComponent)
    c.set_mobility(unreal.ComponentMobility.MOVABLE)
    ajustar(c, "intensity_units", unreal.LightUnits.LUMENS)
    ajustar(c, "intensity", lm)
    ajustar(c, "use_temperature", True)
    ajustar(c, "temperature", kelvin)
    ajustar(c, "attenuation_radius", radio)
    ajustar(c, "cast_shadows", sombras)
    return c


# --------------------------------------------------------------------------- 2. lo que se genera
def borrar_generado():
    n = 0
    for a in EAS.get_all_level_actors():
        if unreal.Name(TAG) in a.tags:
            EAS.destroy_actor(a)
            n += 1
    if n:
        log("borrados", n, "actores de una ejecución anterior")


def luces_led(M):
    n = 0
    for k, (_, p) in M.items():
        m = re.match(r"LED_(\d+)_(\d+)_A_L(\d+)$", k)
        if not m:
            continue
        c = M.get("LED_%s_%s_C" % (m.group(1), m.group(2)))
        largo = float(m.group(3))                       # cm
        eje = resta(c[1], p) if c else unreal.Vector(1, 0, 0)
        a = generar(unreal.PointLight, p, rot_hacia(eje), "Galeria/Luces/LED", "LED_%s_%s" % (m.group(1), m.group(2)))
        comp = luz(a, LED_LM_POR_METRO * largo / 100.0, LED_KELVIN, max(120.0, largo * 1.2), False)
        ajustar(comp, "source_length", max(largo - 4.0, 1.0))   # luz alargada a lo largo de la tira
        ajustar(comp, "source_radius", 0.6)
        n += 1
    log(n, "luces LED")


def luces_local(M):
    n = 0
    for k, (_, p) in M.items():
        m = re.match(r"LUZ_FOCO_(\d+)_A_I\d+$", k)
        if m:
            b = next((v for kk, v in M.items() if kk.startswith("LUZ_FOCO_%s_B_G" % m.group(1))), None)
            g = float(re.search(r"_G(\d+)", b[0].get_actor_label()).group(1)) if b else 30.0
            d = resta(b[1], p) if b else unreal.Vector(0, 0, -1)
            a = generar(unreal.SpotLight, p, rot_hacia(d), "Galeria/Luces/Focos", "Foco_" + m.group(1))
            comp = luz(a, FOCO_LM, 3000.0, 900.0, True)
            ajustar(comp, "outer_cone_angle", g)
            ajustar(comp, "inner_cone_angle", g * 0.55)
            n += 1
        m = re.match(r"LUZ_CALIDA_(\d+)_A_I\d+$", k)
        if m:
            a = generar(unreal.PointLight, p, None, "Galeria/Luces/General", "Luz_calida_" + m.group(1))
            comp = luz(a, CALIDA_LM, 3200.0, 900.0, False)
            ajustar(comp, "source_radius", 30.0)
            n += 1
    log(n, "focos y luces generales")


def pasillo(M):
    if "INICIO_A" not in M:
        return
    p = M["INICIO_A"][1]
    a = generar(unreal.RectLight, unreal.Vector(p.x, p.y, p.z + 330.0), unreal.Rotator(0, -90, 0), "Galeria/Luces/General", "Luz_pasillo")
    comp = luz(a, PASILLO_LM, 4000.0, 1600.0, True)
    ajustar(comp, "source_width", 600.0)
    ajustar(comp, "source_height", 250.0)
    cielo = generar(unreal.SkyLight, unreal.Vector(p.x, p.y, p.z + 250.0), None, "Galeria/Luces/General", "Luz_ambiente")
    sc = cielo.get_component_by_class(unreal.SkyLightComponent)
    sc.set_mobility(unreal.ComponentMobility.MOVABLE)
    ajustar(sc, "real_time_capture", True)
    ajustar(sc, "intensity", 0.6)


def inicio_y_camaras(M):
    if "INICIO_A" in M and "INICIO_B" in M:
        a, b = M["INICIO_A"][1], M["INICIO_B"][1]
        d = resta(b, a)
        generar(unreal.PlayerStart, unreal.Vector(a.x, a.y, a.z + 100.0), unreal.Rotator(0, 0, math.degrees(math.atan2(d.y, d.x))), "Galeria", "Inicio_del_recorrido")
    for k, (_, p) in M.items():
        m = re.match(r"CAM_([a-z]+)_A$", k)
        if m and ("CAM_%s_B" % m.group(1)) in M:
            t = M["CAM_%s_B" % m.group(1)][1]
            a = generar(unreal.CineCameraActor, p, rot_hacia(resta(t, p)), "Galeria/Camaras", "Camara_" + m.group(1))
            cc = a.get_cine_camera_component()
            ajustar(cc, "current_focal_length", 24.0 if m.group(1) == "interior" else 35.0)


def etiquetas(M):
    if not ETIQUETAS:
        return
    ruta = os.path.join(carpeta(), "muebles.json")
    info = {}
    if os.path.exists(ruta):
        with open(ruta, encoding="utf-8") as f:
            info = {int(x["n"]): x for x in json.load(f)}
    xs = [v[1] for k, v in M.items() if k.startswith("INFO_")]
    if not xs:
        return
    cx = sum(v.x for v in xs) / len(xs)
    cy = sum(v.y for v in xs) / len(xs)
    for k, (_, p) in M.items():
        m = re.match(r"INFO_(\d+)$", k)
        if not m:
            continue
        n = int(m.group(1))
        d = info.get(n, {})
        texto = "%02d · %s" % (n, d.get("nombre") or d.get("corto") or "Elemento")
        yaw = math.degrees(math.atan2(cy - p.y, cx - p.x))    # mirando hacia el centro del local
        a = generar(unreal.TextRenderActor, unreal.Vector(p.x, p.y, p.z + 18.0), unreal.Rotator(0, 0, yaw), "Galeria/Etiquetas", "Etiqueta_%02d" % n)
        t = a.get_component_by_class(unreal.TextRenderComponent)
        try:
            t.set_text(texto)
        except Exception:  # noqa
            ajustar(t, "text", texto)
        ajustar(t, "world_size", 7.0)
        ajustar(t, "horizontal_alignment", unreal.HorizTextAligment.EHTA_CENTER)
        ajustar(t, "text_render_color", unreal.Color(r=255, g=255, b=255, a=255))
        a.set_actor_enable_collision(False)


def postproceso():
    v = generar(unreal.PostProcessVolume, unreal.Vector(0, 0, 0), None, "Galeria", "Postproceso_Galeria")
    ajustar(v, "unbound", True)
    s = v.get_editor_property("settings")
    for prop, val in [
        ("dynamic_global_illumination_method", unreal.DynamicGlobalIlluminationMethod.LUMEN),
        ("reflection_method", unreal.ReflectionMethod.LUMEN),
        ("lumen_final_gather_quality", 2.0),
        ("lumen_reflection_quality", 2.0),
        ("auto_exposure_method", unreal.AutoExposureMethod.AEM_HISTOGRAM),
        ("auto_exposure_min_brightness", EV_MIN),
        ("auto_exposure_max_brightness", EV_MAX),
        ("bloom_intensity", 0.35),
        ("vignette_intensity", 0.25),
    ]:
        if ajustar(s, "override_" + prop, True):
            ajustar(s, prop, val)
    ajustar(v, "settings", s)


def colisiones(M):
    """Colisión de caja en cada malla con la herramienta del editor de mallas, que reconstruye la física.
    (Cambiar body_setup directamente deja desactualizada la física de Chaos y el editor se cae.)"""
    sms = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)
    marcas = set(a.get_actor_label() for a, _ in M.values())
    mallas = {}
    for a in EAS.get_all_level_actors():
        if isinstance(a, unreal.StaticMeshActor) and a.get_actor_label() not in marcas:
            sm = a.static_mesh_component.get_editor_property("static_mesh")
            if sm:
                mallas[sm.get_path_name()] = sm
    n = 0
    with unreal.ScopedSlowTask(len(mallas), "Colisiones de la Galería") as tarea:
        tarea.make_dialog(True)
        for sm in mallas.values():
            if tarea.should_cancel():
                break
            tarea.enter_progress_frame(1)
            try:
                if sms.get_simple_collision_count(sm) == 0:
                    sms.add_simple_collisions(sm, unreal.ScriptCollisionShapeType.BOX)
                    n += 1
            except Exception as e:  # noqa
                unreal.log_warning("[Galería] sin colisión para %s: %s" % (sm.get_name(), e))
    log(n, "mallas con colisión de caja (de", len(mallas), ")")


def ocultar_marcadores(M):
    for a, _ in M.values():
        a.set_actor_hidden_in_game(True)
        a.set_actor_enable_collision(False)
        a.set_folder_path("Galeria/Marcadores")
        try:
            a.set_is_temporarily_hidden_in_editor(True)
        except Exception:  # noqa
            pass


def modo_primera_persona():
    reg = unreal.AssetRegistryHelpers.get_asset_registry()
    cand = [x for x in reg.get_assets_by_path("/Game", recursive=True)
            if "GameMode" in str(x.asset_name) and "FirstPerson" in str(x.asset_name)]
    if not cand:
        unreal.log_warning("[Galería] No encontré el modo de juego de primera persona: crea el proyecto con la plantilla First Person (ver LEEME.md).")
        return
    cls = unreal.EditorAssetLibrary.load_blueprint_class(str(cand[0].package_name))
    mundo = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
    ajustar(mundo.get_world_settings(), "default_game_mode", cls)
    log("modo de juego:", cand[0].asset_name)


# --------------------------------------------------------------------------- principal
def main():
    abrir_nivel()
    M = marcadores()
    if REIMPORTAR or not M:
        importar()
        M = marcadores()
    if not M:
        raise RuntimeError("No aparecieron los marcadores del modelo. Importa galeria.glb con Archivo > Importar al nivel y vuelve a ejecutar.")
    log(len(M), "marcadores")
    if COLISIONES:
        colisiones(M)                    # antes de generar luces y fuera de la transacción: toca los recursos, no el nivel
    with unreal.ScopedEditorTransaction("Preparar recorrido de la Galería"):
        borrar_generado()
        luces_led(M)
        luces_local(M)
        pasillo(M)
        inicio_y_camaras(M)
        etiquetas(M)
        postproceso()
        ocultar_marcadores(M)
        modo_primera_persona()
    LES.save_current_level()
    unreal.EditorAssetLibrary.save_directory("/Game/Galeria", only_if_is_dirty=True, recursive=True)
    log("listo. Pulsa Jugar (Alt+P) para recorrer el local.")


main()
