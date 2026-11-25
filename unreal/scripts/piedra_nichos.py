# -*- coding: utf-8 -*-
"""Cambia el color de las piezas del muro de nichos (02) sin volver a correr texturas_galeria.py."""
import re, unreal
COLOR, RUG = (186, 178, 166), 0.62
EAL = unreal.EditorAssetLibrary
MEL = unreal.MaterialEditingLibrary
AT = unreal.AssetToolsHelpers.get_asset_tools()
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
RUTA = "/Game/Galeria/Materiales"
lin = lambda v: (v / 255.0) / 12.92 if v / 255.0 <= 0.04045 else ((v / 255.0 + 0.055) / 1.055) ** 2.4
ruta = RUTA + "/MI_PLA_Piedra"
mi = EAL.load_asset(ruta) if EAL.does_asset_exist(ruta) else AT.create_asset("MI_PLA_Piedra", RUTA, unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
base = EAL.load_asset(RUTA + "/MI_PLA_Terracota_mate")
MEL.set_material_instance_parent(mi, base.get_editor_property("parent"))
for k in ("ProfundidadCapa", "AlturaCapa", "Metalico"):
    try:
        MEL.set_material_instance_scalar_parameter_value(mi, k, MEL.get_material_instance_scalar_parameter_value(base, k))
    except Exception:  # noqa
        pass
MEL.set_material_instance_vector_parameter_value(mi, "Color", unreal.LinearColor(lin(COLOR[0]), lin(COLOR[1]), lin(COLOR[2]), 1))
MEL.set_material_instance_scalar_parameter_value(mi, "Rugosidad", RUG)
MEL.update_material_instance(mi)
EAL.save_loaded_asset(mi)
n = 0
for a in EAS.get_all_level_actors():
    if isinstance(a, unreal.StaticMeshActor) and a.get_actor_label().startswith("Piezas_impresas"):
        p = a
        while p and not re.match(r"^\d\d_", p.get_actor_label()):
            p = p.get_attach_parent_actor()
        if p and p.get_actor_label().startswith("02_"):
            c = a.static_mesh_component
            for i in range(c.get_num_materials()):
                if c.get_material(i) and c.get_material(i).get_name() == "MI_PLA_Terracota_mate":
                    c.set_material(i, mi); n += 1
unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
unreal.log("[Galería] piezas del muro de nichos en piedra: %d" % n)
