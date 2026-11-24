# -*- coding: utf-8 -*-
"""Pone la cámara del editor frente a los carretes de un mueble (MUEBLE, DIST)."""
import math, re, unreal
MUEBLE = globals().get("MUEBLE", "09")
DIST = globals().get("DIST", 90.0)
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
UES = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
def num(a):
    p = a
    while p:
        m = re.match(r"^(\d\d)_", p.get_actor_label())
        if m: return m.group(1)
        p = p.get_attach_parent_actor()
acts = [a for a in EAS.get_all_level_actors() if isinstance(a, unreal.StaticMeshActor) and a.get_actor_label().startswith("Piezas_impresas") and num(a) == MUEBLE]
o, e = acts[0].get_actor_bounds(False)
cs = [a.get_actor_bounds(False)[0] for a in EAS.get_all_level_actors() if re.search(r"INFO_\d\d($|_)", a.get_actor_label())]
cx = sum(c.x for c in cs) / len(cs); cy = sum(c.y for c in cs) / len(cs)
dx, dy = cx - o.x, cy - o.y; n = math.hypot(dx, dy) or 1
cam = unreal.Vector(o.x + dx / n * DIST, o.y + dy / n * DIST, o.z + 15)
UES.set_level_viewport_camera_info(cam, unreal.MathLibrary.make_rot_from_x(o - cam))
unreal.log("[Galería] carretes de %s: %d actores, centro %s tamaño %s" % (MUEBLE, len(acts), o, e))
