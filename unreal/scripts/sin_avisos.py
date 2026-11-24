# -*- coding: utf-8 -*-
"""Quita el aviso rojo «luz cenital con captura en tiempo real…» que sale en el recorrido.
Pone en captura fija toda luz de cielo (SkyLight) del nivel, la vuelve a capturar y guarda el nivel."""
import json, os, unreal
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
info = []
for a in EAS.get_all_level_actors():
    for c in a.get_components_by_class(unreal.SkyLightComponent):
        antes = c.get_editor_property("real_time_capture")
        c.set_editor_property("real_time_capture", False)
        c.recapture_sky()
        info.append({"actor": a.get_actor_label(), "clase": a.get_class().get_name(), "tiempo_real_antes": antes,
                     "fuente": str(c.get_editor_property("source_type"))})
for a in EAS.get_all_level_actors():
    n = a.get_class().get_name()
    if "Sky" in n or "Fog" in n or "Cloud" in n:
        info.append({"otro": a.get_actor_label(), "clase": n})
unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
json.dump(info, open(os.path.join(os.path.dirname(__file__), "..", "avisos.json"), "w"), indent=1, ensure_ascii=False)
unreal.log("[Galería] luces de cielo en captura fija: %d" % len(info))
