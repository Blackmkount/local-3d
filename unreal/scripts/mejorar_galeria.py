# -*- coding: utf-8 -*-
"""
BlackForge 3D · Galería — ajustes de realismo sobre el nivel ya armado (no reimporta).
Se puede ejecutar varias veces: deja siempre los mismos valores.
"""
import unreal

GENERAL_K, GENERAL_LM = 4000.0, 650.0      # luz general del cielo raso: blanco neutro
FOCO_K, FOCO_LM = 3500.0, 900.0            # focos del riel sobre los productos
PASILLO_K, PASILLO_LM = 4500.0, 6000.0
LED_EMISIVO = 22.0                         # brillo propio de las tiras (lo que se ve de la tira)
OPAL_EMISIVO = 6.0
BALANCE_K = 5200.0                         # balance de blancos de la cámara (más bajo = imagen más fría)
EV_MIN, EV_MAX = 7.0, 9.0
ROTULOS_EN_JUEGO = False                   # los rótulos flotantes solo en el editor (en el recorrido se ve el local limpio)

EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
MEL = unreal.MaterialEditingLibrary


def log(*a):
    unreal.log("[Galería] " + " ".join(str(x) for x in a))


def ajustar(o, p, v):
    try:
        o.set_editor_property(p, v)
        return True
    except Exception as e:  # noqa
        unreal.log_warning("[Galería] %s.%s: %s" % (o.get_class().get_name(), p, e))
        return False


def luces():
    n = 0
    for a in EAS.get_all_level_actors():
        lb = a.get_actor_label()
        c = a.get_component_by_class(unreal.LocalLightComponent)
        if lb.startswith("Luz_calida_") and c:
            ajustar(c, "temperature", GENERAL_K); ajustar(c, "intensity", GENERAL_LM); n += 1
        elif lb.startswith("Foco_") and c:
            ajustar(c, "temperature", FOCO_K); ajustar(c, "intensity", FOCO_LM); n += 1
        elif lb == "Luz_pasillo" and c:
            ajustar(c, "temperature", PASILLO_K); ajustar(c, "intensity", PASILLO_LM); n += 1
        elif lb == "Luz_ambiente":
            s = a.get_component_by_class(unreal.SkyLightComponent)
            # sin cielo en la escena: captura fija del local en lugar de captura en tiempo real (quita el aviso rojo)
            ajustar(s, "real_time_capture", False)
            ajustar(s, "source_type", unreal.SkyLightSourceType.SLS_CAPTURED_SCENE)
            ajustar(s, "intensity", 0.5)
            try:
                s.recapture_sky()
            except Exception:  # noqa
                pass
            n += 1
    log(n, "luces ajustadas")


def etiquetas():
    n = 0
    for a in EAS.get_all_level_actors():
        if a.get_actor_label().startswith("Etiqueta_") and isinstance(a, unreal.TextRenderActor):
            a.set_actor_hidden_in_game(not ROTULOS_EN_JUEGO)
            if unreal.Name("BF_GIRADA") in a.tags:
                continue
            r = a.get_actor_rotation()
            a.set_actor_rotation(unreal.Rotator(r.roll, r.pitch, r.yaw + 180.0), False)
            a.tags = list(a.tags) + [unreal.Name("BF_GIRADA")]
            n += 1
    log(n, "rótulos girados")


def materiales():
    reg = unreal.AssetRegistryHelpers.get_asset_registry()
    n = 0
    for x in reg.get_assets_by_path("/Game/Galeria/Modelo", recursive=True):
        nombre = str(x.asset_name)
        valor = None
        if nombre.startswith("led") or nombre.startswith("ledBlanco"):
            valor = LED_EMISIVO
        elif nombre == "opal":
            valor = OPAL_EMISIVO
        if valor is None:
            continue
        mi = unreal.EditorAssetLibrary.load_asset(str(x.package_name))
        if isinstance(mi, unreal.MaterialInstanceConstant):
            MEL.set_material_instance_scalar_parameter_value(mi, "EmissiveStrength", valor)
            MEL.update_material_instance(mi)
            unreal.EditorAssetLibrary.save_loaded_asset(mi)
            n += 1
    log(n, "materiales emisivos ajustados")


def postproceso():
    for a in EAS.get_all_level_actors():
        if a.get_actor_label() == "Postproceso_Galeria":
            s = a.get_editor_property("settings")
            for p, v in [("white_temp", BALANCE_K), ("auto_exposure_min_brightness", EV_MIN),
                         ("auto_exposure_max_brightness", EV_MAX), ("bloom_intensity", 0.3),
                         ("vignette_intensity", 0.3), ("ambient_occlusion_intensity", 0.6),
                         ("ambient_occlusion_radius", 120.0), ("color_contrast", unreal.Vector4(1.08, 1.08, 1.08, 1.08)),
                         ("color_saturation", unreal.Vector4(0.96, 0.96, 0.96, 1.0))]:
                if ajustar(s, "override_" + p, True):
                    ajustar(s, p, v)
            ajustar(a, "settings", s)
            log("postproceso ajustado")


def main():
    with unreal.ScopedEditorTransaction("Mejorar Galería"):
        luces()
        etiquetas()
        postproceso()
    materiales()
    unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
    log("mejoras listas")


main()
