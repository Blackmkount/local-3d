# -*- coding: utf-8 -*-
"""
BlackForge 3D · Galería — una luz por cada luminaria que existe en el modelo, y el panel de accesorios sobre los listones.

Luces (borra Luz_calida_* y Foco_*, que venían del visor web y no coincidían con las lámparas):
  · cada cabeza de los rieles: foco en el lente, apuntando del cuerpo de la cabeza hacia el lente
  · colgantes cilíndricos: foco hacia abajo desde el lente
  · lámpara lineal sobre la barra: luz rectangular del largo de cada tira, hacia abajo
  · panel del techo de la trastienda: luz rectangular del tamaño del panel
  · luz perimetral oculta del cielo raso: luz rectangular a lo largo de cada tira
Se puede ejecutar varias veces.
"""
import math, re, unreal

RIEL_LM, RIEL_K, RIEL_CONO = 750.0, 3500.0, 22.0
COLGANTE_LM, COLGANTE_K, COLGANTE_CONO = 600.0, 3000.0, 32.0
LINEAL_LM, LINEAL_K = 900.0, 3500.0          # por cada tira de la lámpara de la barra
PANEL_LM, PANEL_K = 2200.0, 4000.0           # trastienda
PERIMETRO_LM_M, PERIMETRO_K = 250.0, 3000.0  # por metro de luz oculta
TAG = unreal.Name("BF_LUM")

EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)


def log(*a):
    unreal.log("[Galería] " + " ".join(str(x) for x in a))


def ajustar(o, p, v):
    try:
        o.set_editor_property(p, v)
    except Exception as e:  # noqa
        unreal.log_warning("[Galería] %s.%s: %s" % (o.get_class().get_name(), p, e))


def bajo(a, nombre):
    p = a.get_attach_parent_actor()
    while p:
        if p.get_actor_label().startswith(nombre):
            return True
        p = p.get_attach_parent_actor()
    return False


def mat(a):
    c = a.static_mesh_component
    m = c.get_material(0) if c.get_num_materials() else None
    return m.get_name() if m else ""


def caja(a):
    o, e = a.get_actor_bounds(False)
    return o, unreal.Vector(e.x * 2, e.y * 2, e.z * 2)


def nueva(cls, pos, rot, nombre, lm, k, sombras=True):
    a = EAS.spawn_actor_from_class(cls, pos, rot)
    a.tags = [TAG, unreal.Name("BF_GEN")]
    a.set_folder_path("Galeria/Luces/Luminarias")
    a.set_actor_label(nombre)
    c = a.get_component_by_class(unreal.LocalLightComponent)
    c.set_mobility(unreal.ComponentMobility.MOVABLE)
    ajustar(c, "intensity_units", unreal.LightUnits.LUMENS)
    ajustar(c, "intensity", lm)
    ajustar(c, "use_temperature", True)
    ajustar(c, "temperature", k)
    ajustar(c, "cast_shadows", sombras)
    return a, c


def rot_de(d):
    n = math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z) or 1
    return unreal.MathLibrary.make_rot_from_x(unreal.Vector(d.x / n, d.y / n, d.z / n))


ABAJO = unreal.Rotator(0.0, -90.0, 0.0)   # luz rectangular mirando al piso: alto = eje X del mundo, ancho = eje Y


def luces():
    for a in EAS.get_all_level_actors():
        lb = a.get_actor_label()
        if TAG in a.tags or re.match(r"^(Luz_calida_|Foco_)\d+", lb):
            EAS.destroy_actor(a)
    techo = [a for a in EAS.get_all_level_actors() if isinstance(a, unreal.StaticMeshActor) and bajo(a, "Cielo_y_luminarias")]
    lentes, cuerpos, tiras, perim = [], [], [], []
    for a in techo:
        m, (o, t) = mat(a), caja(a)
        if m.startswith("ledBlanco"):
            (lentes if max(t.x, t.y, t.z) < 10 else tiras).append((a, o, t))
        elif m.startswith("carbonMate") and 4 <= min(t.x, t.y) and max(t.x, t.y, t.z) <= 21:
            cuerpos.append((a, o, t))
        elif re.match(r"^led\d+$", m):
            perim.append((a, o, t))
    n = {"riel": 0, "colgante": 0, "lineal": 0, "panel": 0, "perimetro": 0}
    for a, o, t in lentes:
        cuerpo = min(cuerpos, key=lambda c: (c[1].x - o.x) ** 2 + (c[1].y - o.y) ** 2 + (c[1].z - o.z) ** 2)
        d = unreal.Vector(o.x - cuerpo[1].x, o.y - cuerpo[1].y, o.z - cuerpo[1].z)
        colgante = abs(d.x) < 0.5 and abs(d.y) < 0.5
        if colgante:
            d = unreal.Vector(0, 0, -1)
        nn = math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z) or 1
        pos = unreal.Vector(o.x + d.x / nn * 1.5, o.y + d.y / nn * 1.5, o.z + d.z / nn * 1.5)
        tipo = "colgante" if colgante else "riel"
        n[tipo] += 1
        _, c = nueva(unreal.SpotLight, pos, rot_de(d), "Foco_%s_%02d" % (tipo, n[tipo]),
                     COLGANTE_LM if colgante else RIEL_LM, COLGANTE_K if colgante else RIEL_K)
        cono = COLGANTE_CONO if colgante else RIEL_CONO
        ajustar(c, "outer_cone_angle", cono)
        ajustar(c, "inner_cone_angle", cono * 0.5)
        ajustar(c, "source_radius", 2.0)
        ajustar(c, "attenuation_radius", 800.0)
    for a, o, t in tiras:
        largo_x = t.x >= t.y
        lineal = o.z < 260
        tipo = "lineal" if lineal else "panel"
        n[tipo] += 1
        _, c = nueva(unreal.RectLight, unreal.Vector(o.x, o.y, o.z - 1.0), ABAJO, "Luz_%s_%02d" % (tipo, n[tipo]),
                     LINEAL_LM if lineal else PANEL_LM, LINEAL_K if lineal else PANEL_K)
        ajustar(c, "source_height", max(t.x, 2.0))
        ajustar(c, "source_width", max(t.y, 2.0))
        ajustar(c, "attenuation_radius", 700.0)
        ajustar(c, "barn_door_angle", 60.0 if lineal else 88.0)
    for a, o, t in perim:
        n["perimetro"] += 1
        largo = max(t.x, t.y) / 100.0
        _, c = nueva(unreal.RectLight, unreal.Vector(o.x, o.y, o.z - 1.0), ABAJO, "Luz_perimetral_%02d" % n["perimetro"],
                     PERIMETRO_LM_M * largo, PERIMETRO_K, False)
        ajustar(c, "source_height", max(t.x, 3.0))
        ajustar(c, "source_width", max(t.y, 3.0))
        ajustar(c, "attenuation_radius", 500.0)
        ajustar(c, "barn_door_angle", 80.0)
    log("luces nuevas:", n)


def panel_accesorios():
    """Adelanta el panel de accesorios hasta que el tablero quede apoyado sobre la cara de los listones."""
    acts = EAS.get_all_level_actors()
    liston = [a for a in acts if isinstance(a, unreal.StaticMeshActor) and mat(a) == "liston"]
    tablero = [a for a in acts if a.get_actor_label().startswith("Tablero_lacado") and bajo(a, "11_")]
    grupo = [a for a in acts if a.get_actor_label().startswith("11_Panel")]
    if not (liston and tablero and grupo):
        log("panel de accesorios: no encontré las piezas"); return
    lo, lt = caja(liston[0]); to, tt = caja(tablero[0])
    inicio = [a for a in acts if isinstance(a, unreal.PlayerStart)]
    hacia = 1.0 if (inicio and inicio[0].get_actor_location().y > lo.y) else -1.0     # la sala queda del lado del inicio
    cara = lo.y + hacia * lt.y / 2.0
    atras = to.y - hacia * tt.y / 2.0
    dy = (cara - atras) * hacia + 0.2
    if dy > 0.05:
        g = grupo[0]
        g.set_actor_location(g.get_actor_location() + unreal.Vector(0, hacia * dy, 0), False, False)
        log("panel de accesorios adelantado %.1f cm" % dy)
    else:
        log("panel de accesorios ya está sobre los listones")


def main():
    with unreal.ScopedEditorTransaction("Luminarias de la Galería"):
        panel_accesorios()
        luces()
    unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
    log("luminarias listas")


main()
