# -*- coding: utf-8 -*-
"""
BlackForge 3D · Galería — luz, color y cámara fotorrealistas (estilo «recorrido de arquitectura»).

Imagen clara, blanca y neutra, como un local recién inaugurado:
  · todas las luminarias en blanco neutro (4000 K); el pasillo del centro comercial, más frío
  · la luz perimetral oculta y la luz ambiente suben para que las sombras queden suaves y claras
  · exposición fija (no «respira» al caminar), balance de blancos neutro y color sin dominantes
  · Lumen en calidad alta, reflejos en el piso y el vidrio, sombras suaves de contacto
  · cámara: viñeta y aberración muy leves, nitidez, desenfoque de movimiento suave
Se ejecuta después de luminarias_galeria.py y se puede repetir: deja siempre los mismos valores.
"""
import os, re, unreal

# luminarias: (lúmenes, kelvin)
RIEL = (1100.0, 4000.0)            # cabezas de los rieles, sobre los productos
COLGANTE = (750.0, 3700.0)         # colgantes de la isla
LINEAL = (1100.0, 4000.0)          # lámpara lineal de la barra, por tira
PANEL = (2600.0, 4000.0)           # panel de la trastienda
PERIMETRO_LM_M, PERIMETRO_K = 480.0, 4000.0   # luz oculta del cielo raso, por metro: es el «relleno» suave
LED_K = 4000.0                     # tiras de los muebles
PASILLO = (9000.0, 5000.0)         # pasillo del centro comercial (luz de día)
AMBIENTE = 1.0                     # intensidad de la luz ambiente (captura fija del local)

BALANCE_K = 4700.0                 # blanco de la cámara: 4000 K se ve blanco con un toque cálido
EV = 6.6                           # exposición fija (EV100); más alto = más oscuro
SATURACION, CONTRASTE = 0.93, 1.04
VINETA, ABERRACION, BLOOM = 0.28, 0.12, 0.22
DESENFOQUE_MOV = 0.2

CONSOLA = {                        # quedan en Config/DefaultEngine.ini, también para el ejecutable
    "r.Tonemapper.Sharpen": "0.6",
    "r.Shadow.Virtual.SMRT.RayCountLocal": "16",
    "r.Shadow.Virtual.SMRT.SamplesPerRayLocal": "8",
    "r.Lumen.Reflections.DownsampleFactor": "1",
    "r.Lumen.ScreenProbeGather.DownsampleFactor": "16",
}

EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)


def log(*a):
    unreal.log("[Galería] " + " ".join(str(x) for x in a))


def ajustar(o, p, v):
    try:
        o.set_editor_property(p, v)
        return True
    except Exception as e:  # noqa
        unreal.log_warning("[Galería] %s.%s: %s" % (o.get_class().get_name(), p, e))
        return False


def luz(c, lm, k):
    ajustar(c, "intensity_units", unreal.LightUnits.LUMENS)
    ajustar(c, "intensity", lm)
    ajustar(c, "use_temperature", True)
    ajustar(c, "temperature", k)


def luces():
    n = {}
    for a in EAS.get_all_level_actors():
        lb = a.get_actor_label()
        c = a.get_component_by_class(unreal.LocalLightComponent)
        tipo = None
        if c and lb.startswith("Foco_riel_"):
            tipo = "riel"; luz(c, *RIEL)
            ajustar(c, "source_radius", 3.0); ajustar(c, "soft_source_radius", 2.0)
            ajustar(c, "contact_shadow_length", 0.04)
        elif c and lb.startswith("Foco_colgante_"):
            tipo = "colgante"; luz(c, *COLGANTE); ajustar(c, "source_radius", 4.0)
            ajustar(c, "contact_shadow_length", 0.04)
        elif c and lb.startswith("Luz_lineal_"):
            tipo = "lineal"; luz(c, *LINEAL)
        elif c and lb.startswith("Luz_panel_"):
            tipo = "panel"; luz(c, *PANEL)
        elif c and lb.startswith("Luz_perimetral_"):
            tipo = "perimetral"
            largo = max(c.get_editor_property("source_height"), c.get_editor_property("source_width")) / 100.0
            luz(c, PERIMETRO_LM_M * max(largo, 0.3), PERIMETRO_K)
        elif c and re.match(r"^LED_\d+_\d+$", lb):
            tipo = "led"; ajustar(c, "use_temperature", True); ajustar(c, "temperature", LED_K)
        elif c and lb == "Luz_pasillo":
            tipo = "pasillo"; luz(c, *PASILLO)
        elif lb == "Luz_ambiente":
            s = a.get_component_by_class(unreal.SkyLightComponent)
            ajustar(s, "real_time_capture", False)
            ajustar(s, "intensity", AMBIENTE)
            try:
                s.recapture_sky()
            except Exception:  # noqa
                pass
            tipo = "ambiente"
        if tipo:
            n[tipo] = n.get(tipo, 0) + 1
    log("luces:", n)


def postproceso():
    v = next((a for a in EAS.get_all_level_actors() if a.get_actor_label() == "Postproceso_Galeria"), None)
    if not v:
        unreal.log_warning("[Galería] no está Postproceso_Galeria: ejecutar antes preparar_galeria.py")
        return
    s = v.get_editor_property("settings")
    valores = [
        ("dynamic_global_illumination_method", unreal.DynamicGlobalIlluminationMethod.LUMEN),
        ("reflection_method", unreal.ReflectionMethod.LUMEN),
        ("lumen_final_gather_quality", 4.0),
        ("lumen_scene_lighting_quality", 2.0),
        ("lumen_scene_detail", 2.0),
        ("lumen_scene_view_distance", 4000.0),
        ("lumen_reflection_quality", 2.0),
        ("lumen_surface_cache_resolution", 1.0),
        ("lumen_front_layer_translucency_reflections", True),
        ("lumen_max_reflection_bounces", 2),
        ("lumen_skylight_leaking", 0.0),
        ("auto_exposure_method", unreal.AutoExposureMethod.AEM_HISTOGRAM),
        ("auto_exposure_min_brightness", EV),
        ("auto_exposure_max_brightness", EV),
        ("auto_exposure_bias", 0.0),
        ("local_exposure_highlight_contrast_scale", 0.8),
        ("local_exposure_shadow_contrast_scale", 0.9),
        ("white_temp", BALANCE_K),
        ("white_tint", 0.0),
        ("color_saturation", unreal.Vector4(SATURACION, SATURACION, SATURACION, 1.0)),
        ("color_contrast", unreal.Vector4(CONTRASTE, CONTRASTE, CONTRASTE, 1.0)),
        ("vignette_intensity", VINETA),
        ("scene_fringe_intensity", ABERRACION),
        ("bloom_intensity", BLOOM),
        ("lens_flare_intensity", 0.0),
        ("film_grain_intensity", 0.0),
        ("motion_blur_amount", DESENFOQUE_MOV),
        ("motion_blur_max", 2.0),
        ("ambient_occlusion_intensity", 0.5),
        ("ambient_occlusion_radius", 60.0),
    ]
    ok = 0
    for p, val in valores:
        if ajustar(s, "override_" + p, True) and ajustar(s, p, val):
            ok += 1
    ajustar(v, "settings", s)
    ajustar(v, "unbound", True)
    log("postproceso:", ok, "de", len(valores), "valores")


def consola():
    ruta = os.path.join(unreal.Paths.project_config_dir(), "DefaultEngine.ini")
    txt = open(ruta, encoding="utf-8").read() if os.path.exists(ruta) else ""
    lineas = txt.splitlines()
    if "[SystemSettings]" not in lineas:
        lineas += ["", "[SystemSettings]"]
    i = lineas.index("[SystemSettings]") + 1
    claves = {k.lower() for k in CONSOLA}
    fin = i
    while fin < len(lineas) and not lineas[fin].startswith("["):
        fin += 1
    cuerpo = [l for l in lineas[i:fin] if l.split("=")[0].strip().lower() not in claves]
    cuerpo = [l for l in cuerpo if l.strip()] + ["%s=%s" % kv for kv in CONSOLA.items()] + [""]
    lineas = lineas[:i] + cuerpo + lineas[fin:]
    open(ruta, "w", encoding="utf-8").write("\n".join(lineas) + "\n")
    for k, v in CONSOLA.items():
        unreal.SystemLibrary.execute_console_command(None, "%s %s" % (k, v))
    log("consola:", len(CONSOLA), "variables en", ruta)


def main():
    with unreal.ScopedEditorTransaction("Fotorrealismo: luz"):
        luces()
        postproceso()
    consola()
    unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
    log("luz fotorrealista lista")


main()
