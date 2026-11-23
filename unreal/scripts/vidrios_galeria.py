# -*- coding: utf-8 -*-
"""Quita Nanite a las mallas con material transparente (vidrio, acrílico, vidrios de las impresoras):
Nanite solo admite materiales opacos o enmascarados, y con él el vidrio no se ve como vidrio."""
import json, os, unreal
CARPETA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
SMS = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)
mallas, rep = {}, []
for a in EAS.get_all_level_actors():
    if not isinstance(a, unreal.StaticMeshActor):
        continue
    c = a.static_mesh_component
    for i in range(c.get_num_materials()):
        m = c.get_material(i)
        if not m:
            continue
        try:
            bm = m.get_blend_mode()
        except Exception:
            bm = m.get_editor_property("blend_mode") if isinstance(m, unreal.Material) else None
        if bm in (unreal.BlendMode.BLEND_TRANSLUCENT, unreal.BlendMode.BLEND_ADDITIVE, unreal.BlendMode.BLEND_MODULATE) or str(bm).find("TRANSLUCENT") >= 0:
            sm = c.get_editor_property("static_mesh")
            mallas[sm.get_path_name()] = sm
n = 0
for sm in mallas.values():
    s = sm.get_editor_property("nanite_settings")
    if not s.get_editor_property("enabled"):
        continue
    s.set_editor_property("enabled", False)
    ok = False
    try:
        SMS.set_nanite_settings(sm, s, True)
        ok = True
    except Exception as e:
        rep.append("set_nanite_settings: %s" % e)
        try:
            sm.set_editor_property("nanite_settings", s)
            ok = True
        except Exception as e2:
            rep.append("propiedad: %s" % e2)
    if ok:
        unreal.EditorAssetLibrary.save_loaded_asset(sm)
        n += 1
rep.append("%d mallas transparentes sin Nanite (de %d)" % (n, len(mallas)))
json.dump(rep, open(os.path.join(CARPETA, "vidrios.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
unreal.log("[Galería] " + rep[-1])
