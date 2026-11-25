# -*- coding: utf-8 -*-
"""
BlackForge 3D · Galería — cámara del visitante en el recorrido: lente gran angular (90°) como los recorridos de
arquitectura. Cambia el Blueprint del personaje de la plantilla de primera persona.
Escribe camara.json con lo que encontró. Se puede ejecutar varias veces.
"""
import json, os, unreal

FOV = 90.0

reg = unreal.AssetRegistryHelpers.get_asset_registry()
sds = unreal.get_engine_subsystem(unreal.SubobjectDataSubsystem)
info = {"blueprints": [], "camaras": []}
for d in reg.get_assets_by_path("/Game", recursive=True):
    nombre = str(d.asset_name)
    if not (nombre.startswith("BP_") and "Character" in nombre and "FirstPerson" in nombre):
        continue
    bp = unreal.load_asset(str(d.package_name))
    if not isinstance(bp, unreal.Blueprint):
        continue
    info["blueprints"].append(str(d.package_name))
    for h in sds.k2_gather_subobject_data_for_blueprint(bp):
        data = sds.k2_find_subobject_data_from_handle(h)
        obj = unreal.SubobjectDataBlueprintFunctionLibrary.get_object(data)
        if isinstance(obj, unreal.CameraComponent):
            antes = obj.get_editor_property("field_of_view")
            obj.set_editor_property("field_of_view", FOV)
            l = obj.get_editor_property("relative_location")
            info["camaras"].append({"componente": obj.get_name(), "fov_antes": antes, "fov": FOV, "posicion_antes": [l.x, l.y, l.z]})
    unreal.BlueprintEditorLibrary.compile_blueprint(bp)
    unreal.EditorAssetLibrary.save_loaded_asset(bp)
json.dump(info, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "camara.json"), "w"), indent=1)
unreal.log("[Galería] cámara del visitante: %s" % info)
