# -*- coding: utf-8 -*-
"""
BlackForge 3D · Galería — capturas de revisión en alta resolución.

Pone cámaras «Revision_*» a la altura de los ojos (1.65 m, lente de 90°, como el recorrido) en vistas fijas:
la entrada, el fondo y de cerca varios muebles. Recorre una por una, espera a que Lumen se asiente y guarda
cada imagen en galeria-unreal/capturas/. Sirve para comparar antes y después de cada ajuste.
  VISTAS  = None para todas, o una lista de nombres, p. ej. ["01_entrada"]
"""
import glob, math, os, re, shutil, time, unreal

VISTAS = globals().get("VISTAS", None)
ANCHO, ALTO = globals().get("RES", (1920, 1080))
ESPERA = 150            # cuadros antes de cada captura (Lumen se asienta)
OJOS = 165.0
FOV = 90.0
SALIDA = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "capturas"))

EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
UES = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
LES = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
V = unreal.Vector


def log(*a):
    unreal.log("[Galería] " + " ".join(str(x) for x in a))


def vistas():
    info = {}
    for a in EAS.get_all_level_actors():
        m = re.search(r"INFO_(\d\d)($|_)", a.get_actor_label())
        if m:
            info[m.group(1)] = a.get_actor_bounds(False)[0]
    sala = [info[k] for k in info if 2 <= int(k) <= 14]
    cx = sum(p.x for p in sala) / len(sala)
    cy = sum(p.y for p in sala) / len(sala)
    y_frente = max(p.y for p in sala)
    y_fondo = min(p.y for p in sala)
    out = [("00_pasillo", V(-120.0, 880.0, OJOS), V(40.0, 300.0, 170)),
           ("01_entrada", V(cx, y_frente + 20, OJOS), V(cx, y_fondo - 200, 120)),
           ("02_fondo", V(cx + 40, y_fondo + 40, OJOS), V(cx, y_frente + 300, 120))]
    for n, d in [("02", 190), ("03", 190), ("05", 200), ("07", 170), ("11", 190), ("13", 170)]:
        if n not in info:
            continue
        p = info[n]
        dx, dy = cx - p.x, cy - p.y
        l = math.hypot(dx, dy) or 1
        out.append(("m%s" % n, V(p.x + dx / l * d, p.y + dy / l * d, OJOS), V(p.x, p.y, 110)))
    return out


def camara(nombre, pos, mira):
    lb = "Revision_" + nombre
    a = next((x for x in EAS.get_all_level_actors() if x.get_actor_label() == lb), None)
    if not a:
        a = EAS.spawn_actor_from_class(unreal.CameraActor, pos)
        a.set_actor_label(lb)
        a.set_folder_path("Galeria/Revision")
    rot = unreal.MathLibrary.make_rot_from_x(mira - pos)
    a.set_actor_location_and_rotation(pos, rot, False, False)
    c = a.get_component_by_class(unreal.CameraComponent)
    c.set_editor_property("field_of_view", FOV)
    c.set_editor_property("constrain_aspect_ratio", False)
    return a, pos, rot


os.makedirs(SALIDA, exist_ok=True)
lista = [camara(*v) + (v[0],) for v in vistas() if VISTAS is None or v[0] in VISTAS]
estado = {"i": 0, "f": 0, "t0": time.time(), "h": None}
try:
    LES.editor_set_game_view(True)
except Exception:  # noqa
    pass


def terminar():
    unreal.unregister_slate_post_tick_callback(estado["h"])
    # si el motor guardó las imágenes en Saved/Screenshots, se copian a capturas/
    for f in glob.glob(os.path.join(unreal.Paths.screen_shot_dir(), "**", "*.png"), recursive=True):
        if os.path.getmtime(f) >= estado["t0"] and os.path.basename(f).startswith("Revision_"):
            shutil.copy2(f, os.path.join(SALIDA, os.path.basename(f)))
    try:
        LES.editor_set_game_view(False)
    except Exception:  # noqa
        pass
    open(os.path.join(SALIDA, "listo.txt"), "w").write("%d capturas en %.0f s\n" % (len(lista), time.time() - estado["t0"]))
    log("capturas listas en", SALIDA)


def tick(dt):
    i = estado["i"]
    if i >= len(lista):
        terminar()
        return
    cam, pos, rot, nombre = lista[i]
    if estado["f"] == 0:
        UES.set_level_viewport_camera_info(pos, rot)
    estado["f"] += 1
    if estado["f"] == ESPERA:
        unreal.AutomationLibrary.take_high_res_screenshot(ANCHO, ALTO, os.path.join(SALIDA, "Revision_%s.png" % nombre), camera=cam)
    if estado["f"] >= ESPERA + 45:
        estado["i"] += 1
        estado["f"] = 0


if os.path.exists(os.path.join(SALIDA, "listo.txt")):
    os.remove(os.path.join(SALIDA, "listo.txt"))
estado["h"] = unreal.register_slate_post_tick_callback(tick)
log("capturando", len(lista), "vistas…")
