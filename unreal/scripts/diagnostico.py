# -*- coding: utf-8 -*-
"""Escribe diag.json junto al paquete: materiales importados, sus parámetros y los actores de la Galería."""
import json, os, unreal
CARPETA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = {"materiales": [], "actores": {}, "luces": []}
reg = unreal.AssetRegistryHelpers.get_asset_registry()
for a in reg.get_assets_by_path("/Game/Galeria/Modelo", recursive=True):
    cls = str(a.asset_class_path.asset_name) if hasattr(a, "asset_class_path") else str(a.asset_class)
    if "Material" not in cls:
        continue
    m = unreal.EditorAssetLibrary.load_asset(str(a.package_name))
    d = {"n": str(a.asset_name), "cls": cls, "path": str(a.package_name)}
    try:
        if isinstance(m, unreal.MaterialInstance):
            d["padre"] = m.get_editor_property("parent").get_path_name() if m.get_editor_property("parent") else None
            d["escalares"] = {str(p.parameter_info.name): p.parameter_value for p in m.get_editor_property("scalar_parameter_values")}
            d["vectores"] = {str(p.parameter_info.name): [round(p.parameter_value.r, 3), round(p.parameter_value.g, 3), round(p.parameter_value.b, 3), round(p.parameter_value.a, 3)] for p in m.get_editor_property("vector_parameter_values")}
            d["texturas"] = {str(p.parameter_info.name): (p.parameter_value.get_name() if p.parameter_value else None) for p in m.get_editor_property("texture_parameter_values")}
            d["switch"] = [str(x) for x in unreal.MaterialEditingLibrary.get_static_switch_parameter_names(m)] if hasattr(unreal.MaterialEditingLibrary, "get_static_switch_parameter_names") else []
            d["todos_escalares"] = [str(x) for x in unreal.MaterialEditingLibrary.get_scalar_parameter_names(m)]
            d["todos_vectores"] = [str(x) for x in unreal.MaterialEditingLibrary.get_vector_parameter_names(m)]
    except Exception as e:
        d["error"] = str(e)
    out["materiales"].append(d)
eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
for a in eas.get_all_level_actors():
    c = a.get_class().get_name()
    out["actores"][c] = out["actores"].get(c, 0) + 1
    if isinstance(a, unreal.Light) or isinstance(a, unreal.SkyLight):
        l = a.get_component_by_class(unreal.LightComponentBase)
        out["luces"].append({"label": a.get_actor_label(), "cls": c, "loc": [round(v, 1) for v in (a.get_actor_location().x, a.get_actor_location().y, a.get_actor_location().z)], "i": l.get_editor_property("intensity") if l else None})
mundo = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
out["nivel"] = mundo.get_path_name()
with open(os.path.join(CARPETA, "diag.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1, default=str)
unreal.log("[Galería] diagnóstico escrito en " + os.path.join(CARPETA, "diag.json"))
