# -*- coding: utf-8 -*-
"""Medidas del pasillo del centro comercial, la fachada y el local (para armar el entorno). Escribe pasillo.json."""
import json, os, re, unreal
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
out = {"grupos": {}, "actores": []}


def caja(a):
    o, e = a.get_actor_bounds(False)
    return [round(o.x - e.x, 1), round(o.y - e.y, 1), round(o.z - e.z, 1), round(o.x + e.x, 1), round(o.y + e.y, 1), round(o.z + e.z, 1)]


for a in EAS.get_all_level_actors():
    if not isinstance(a, unreal.StaticMeshActor):
        continue
    c = a.static_mesh_component
    mats = set()
    orig = c.get_editor_property("static_mesh")
    for i in range(c.get_num_materials()):
        m = orig.get_material(i) if orig else c.get_material(i)
        mats.add(m.get_name() if m else "")
    for m in mats:
        g = None
        if re.match(r"^(piso_pasillo|muroPasillo\d*|fachada\d*|piso_de_madera|muro\d*|cielo\d*|vidrioPuerta|letrero\w*|pantalla\d*)$", m):
            g = re.sub(r"\d+$", "", m)
        if g:
            b = caja(a)
            G = out["grupos"].setdefault(g, [1e9, 1e9, 1e9, -1e9, -1e9, -1e9])
            for k in range(3):
                G[k] = min(G[k], b[k]); G[k + 3] = max(G[k + 3], b[k + 3])
            out["actores"].append({"actor": a.get_actor_label(), "mat": m, "caja": b})
for a in EAS.get_all_level_actors():
    lb = a.get_actor_label()
    if lb in ("Luz_pasillo", "PlayerStart") or isinstance(a, unreal.PlayerStart):
        l = a.get_actor_location()
        out[lb] = [l.x, l.y, l.z]
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "pasillo.json"), "w"), indent=1, ensure_ascii=False)
unreal.log("[Galería] pasillo.json escrito")
