# -*- coding: utf-8 -*-
"""Escribe mallas.json: por material, cuántas piezas lo usan, su tamaño y la carpeta del Outliner."""
import json, os, unreal
CARPETA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
out = {}
for a in EAS.get_all_level_actors():
    if not isinstance(a, unreal.StaticMeshActor):
        continue
    c = a.static_mesh_component
    o, e = a.get_actor_bounds(False)
    padre = a.get_attach_parent_actor()
    cadena = []
    p = padre
    while p and len(cadena) < 4:
        cadena.append(p.get_actor_label()); p = p.get_attach_parent_actor()
    for i in range(c.get_num_materials()):
        m = c.get_material(i)
        n = m.get_name() if m else "None"
        d = out.setdefault(n, {"n": 0, "ej": []})
        d["n"] += 1
        if len(d["ej"]) < 6:
            d["ej"].append({"label": a.get_actor_label(), "padres": cadena, "tam_cm": [round(2 * e.x), round(2 * e.y), round(2 * e.z)], "pos": [round(o.x), round(o.y), round(o.z)], "malla": c.get_editor_property("static_mesh").get_name()})
with open(os.path.join(CARPETA, "mallas.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
unreal.log("[Galería] mallas.json listo")
