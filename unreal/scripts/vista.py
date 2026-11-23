# -*- coding: utf-8 -*-
"""Pone la cámara del editor frente a un mueble: edita MUEBLE y DIST, o usa vista_XX.py."""
import math, re, sys, unreal
MUEBLE = globals().get("MUEBLE", "02")
DIST, ALTO, BAJA = globals().get("DIST", 130.0), 135.0, 40.0
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
UES = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
info = [a for a in EAS.get_all_level_actors() if re.search(r"INFO_%s($|_)" % MUEBLE, a.get_actor_label())]
cs = [a.get_actor_bounds(False)[0] for a in EAS.get_all_level_actors() if re.search(r"INFO_\d\d($|_)", a.get_actor_label())]
cx = sum(c.x for c in cs) / len(cs); cy = sum(c.y for c in cs) / len(cs)
p = info[0].get_actor_bounds(False)[0]
dx, dy = cx - p.x, cy - p.y; n = math.hypot(dx, dy) or 1
cam = unreal.Vector(p.x + dx / n * DIST, p.y + dy / n * DIST, ALTO)
mira = unreal.Vector(p.x, p.y, max(60.0, p.z - BAJA - 60))
d = mira - cam
rot = unreal.MathLibrary.make_rot_from_x(d)
UES.set_level_viewport_camera_info(cam, rot)
unreal.log("[Galería] vista del mueble %s" % MUEBLE)
