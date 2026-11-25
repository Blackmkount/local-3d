# -*- coding: utf-8 -*-
"""
BlackForge 3D · Galería — el pasillo del centro comercial alrededor del local.

Hasta ahora, detrás de la fachada solo había piso y negro. Este script arma el entorno:
  · cielo raso del pasillo con dos líneas de luz (y sus luces)
  · el piso de porcelanato hasta los extremos
  · al frente, cuatro locales vecinos con vitrina de vidrio, perfilería negra, aviso de luz (sin marca)
    y un interior sencillo iluminado
  · a cada lado del local, otro vecino en el mismo muro (se reemplaza el muro liso por tramos con vitrina)
  · muros al final del pasillo
Todo va en la carpeta Galeria/Pasillo del nivel, con la etiqueta BF_PASILLO. Se puede ejecutar varias veces.
Medidas en cm, con el eje Y hacia el pasillo (la fachada del local está en y = 350…386).
"""
import re, unreal

Y_MURO = 364.0           # cara del muro del local hacia el pasillo
Y_FRENTE = 950.0         # cara de los locales de enfrente
X_FIN = 1715.0
Z_CIELO = 450.0
Z_VITRINA = 320.0        # alto de las vitrinas
FONDO = 450.0            # profundidad de los locales vecinos
FRENTE = [(-1300.0, 700.0), (-430.0, 760.0), (430.0, 760.0), (1300.0, 700.0)]   # (centro x, ancho) enfrente
LADO = [(-1000.0, 820.0), (1000.0, 820.0)]                                     # vecinos en el muro del local
LUZ_PASILLO_LM, LUZ_PASILLO_K = 5200.0, 4500.0
LUZ_LOCAL_LM, LUZ_LOCAL_K = 4200.0, 4000.0
AVISO = 6.0              # brillo de los avisos

TAG = unreal.Name("BF_PASILLO")
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
EAL = unreal.EditorAssetLibrary
MEL = unreal.MaterialEditingLibrary
AT = unreal.AssetToolsHelpers.get_asset_tools()
CUBO = EAL.load_asset("/Engine/BasicShapes/Cube.Cube")
V = unreal.Vector


def log(*a):
    unreal.log("[Galería] " + " ".join(str(x) for x in a))


def mat(nombre):
    for r in ("/Game/Galeria/Materiales/" + nombre, "/Game/Galeria/Modelo/galeria/Materials/" + nombre):
        if EAL.does_asset_exist(r):
            return EAL.load_asset(r)
    unreal.log_warning("[Galería] falta el material " + nombre)
    return None


def emisivo():
    ruta = "/Game/Galeria/Materiales/M_BF_Emisivo"
    if EAL.does_asset_exist(ruta):
        return EAL.load_asset(ruta)
    m = AT.create_asset("M_BF_Emisivo", "/Game/Galeria/Materiales", unreal.Material, unreal.MaterialFactoryNew())
    col = MEL.create_material_expression(m, unreal.MaterialExpressionVectorParameter, -500, 0)
    col.set_editor_property("parameter_name", "Color")
    col.set_editor_property("default_value", unreal.LinearColor(1.0, 0.97, 0.92, 1))
    it = MEL.create_material_expression(m, unreal.MaterialExpressionScalarParameter, -500, 200)
    it.set_editor_property("parameter_name", "Intensidad")
    it.set_editor_property("default_value", 10.0)
    mul = MEL.create_material_expression(m, unreal.MaterialExpressionMultiply, -250, 100)
    MEL.connect_material_expressions(col, "", mul, "A")
    MEL.connect_material_expressions(it, "", mul, "B")
    MEL.connect_material_property(mul, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    negro = MEL.create_material_expression(m, unreal.MaterialExpressionConstant3Vector, -250, -150)
    negro.set_editor_property("constant", unreal.LinearColor(0.02, 0.02, 0.02, 1))
    MEL.connect_material_property(negro, "", unreal.MaterialProperty.MP_BASE_COLOR)
    for uso in ("used_with_nanite", "used_with_static_lighting"):
        try:
            m.set_editor_property(uso, True)
        except Exception:  # noqa
            pass
    MEL.recompile_material(m)
    EAL.save_loaded_asset(m)
    return m


def mi_emisivo(nombre, color, intensidad):
    ruta = "/Game/Galeria/Materiales/" + nombre
    mi = EAL.load_asset(ruta) if EAL.does_asset_exist(ruta) else \
        AT.create_asset(nombre, "/Game/Galeria/Materiales", unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
    MEL.set_material_instance_parent(mi, emisivo())
    MEL.set_material_instance_vector_parameter_value(mi, "Color", unreal.LinearColor(*color, 1.0))
    MEL.set_material_instance_scalar_parameter_value(mi, "Intensidad", intensidad)
    MEL.update_material_instance(mi)
    EAL.save_loaded_asset(mi)
    return mi


def caja(nombre, x0, y0, z0, x1, y1, z1, material, carpeta="Galeria/Pasillo", colision=True):
    c = V((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    a = EAS.spawn_actor_from_class(unreal.StaticMeshActor, c)
    a.set_actor_label(nombre)
    a.set_folder_path(carpeta)
    a.tags = [TAG]
    smc = a.static_mesh_component
    smc.set_static_mesh(CUBO)
    a.set_actor_scale3d(V(abs(x1 - x0) / 100.0, abs(y1 - y0) / 100.0, abs(z1 - z0) / 100.0))
    if material:
        smc.set_material(0, material)
    if not colision:
        a.set_actor_enable_collision(False)
    return a


def rect(nombre, x, y, z, ancho_x, ancho_y, lm, k, sombras=True, carpeta="Galeria/Pasillo"):
    a = EAS.spawn_actor_from_class(unreal.RectLight, V(x, y, z), unreal.Rotator(0.0, -90.0, 0.0))
    a.set_actor_label(nombre)
    a.set_folder_path(carpeta)
    a.tags = [TAG]
    c = a.get_component_by_class(unreal.RectLightComponent)
    c.set_mobility(unreal.ComponentMobility.MOVABLE)
    for p, v in (("intensity_units", unreal.LightUnits.LUMENS), ("intensity", lm), ("use_temperature", True),
                 ("temperature", k), ("source_width", ancho_y), ("source_height", ancho_x),
                 ("attenuation_radius", 900.0), ("barn_door_angle", 80.0), ("cast_shadows", sombras)):
        try:
            c.set_editor_property(p, v)
        except Exception as e:  # noqa
            unreal.log_warning("[Galería] RectLight.%s: %s" % (p, e))
    return a


def limpiar():
    n = 0
    for a in EAS.get_all_level_actors():
        if TAG in a.tags:
            EAS.destroy_actor(a)
            n += 1
    return n


def tramos(vanos, x0, x1):
    """Tramos de muro entre las vitrinas (vanos = [(centro, ancho)])."""
    bordes = sorted((c - w / 2, c + w / 2) for c, w in vanos)
    out, x = [], x0
    for a, b in bordes:
        if a > x:
            out.append((x, a))
        x = max(x, b)
    if x < x1:
        out.append((x, x1))
    return out


def local_vecino(nombre, cx, w, y_vidrio, sentido, M):
    """Vitrina + interior iluminado. sentido = +1 si el local queda hacia +Y del vidrio, -1 hacia -Y."""
    x0, x1 = cx - w / 2, cx + w / 2
    yf = y_vidrio + sentido * FONDO
    ya, yb = sorted((y_vidrio, yf))
    car = "Galeria/Pasillo/" + nombre
    # dintel con aviso
    caja(nombre + "_dintel", x0, y_vidrio - 7 * sentido if sentido < 0 else y_vidrio, Z_VITRINA, x1, y_vidrio + 15 * sentido if sentido > 0 else y_vidrio, Z_CIELO, M["muro"], car)
    caja(nombre + "_aviso", cx - w * 0.28, y_vidrio - 6 * sentido - 3, Z_VITRINA + 28, cx + w * 0.28, y_vidrio - 6 * sentido + 3, Z_VITRINA + 78, M["aviso"], car, False)
    # vidrio y perfiles
    caja(nombre + "_vidrio", x0, y_vidrio - 0.6, 0, x1, y_vidrio + 0.6, Z_VITRINA, M["vidrio"], car)
    for xm in (x0 + 2.5, cx, x1 - 2.5):
        caja(nombre + "_perfil", xm - 2.5, y_vidrio - 3, 0, xm + 2.5, y_vidrio + 3, Z_VITRINA, M["negro"], car)
    caja(nombre + "_perfil_alto", x0, y_vidrio - 3, Z_VITRINA - 5, x1, y_vidrio + 3, Z_VITRINA, M["negro"], car)
    caja(nombre + "_zocalo", x0, y_vidrio - 3, 0, x1, y_vidrio + 3, 8, M["negro"], car)
    # interior
    caja(nombre + "_piso", x0, ya, -2, x1, yb, 0.4, M["piso"], car)
    caja(nombre + "_techo", x0, ya, Z_VITRINA, x1, yb, Z_VITRINA + 4, M["cielo"], car)
    caja(nombre + "_fondo", x0, yf - (4 if sentido > 0 else 0), 0, x1, yf + (0 if sentido > 0 else 4), Z_VITRINA, M["muro_local"], car)
    caja(nombre + "_lado_a", x0 - 4, ya, 0, x0, yb, Z_VITRINA, M["muro_local"], car)
    caja(nombre + "_lado_b", x1, ya, 0, x1 + 4, yb, Z_VITRINA, M["muro_local"], car)
    # muebles de exhibición genéricos
    yc = y_vidrio + sentido * FONDO * 0.45
    caja(nombre + "_mesa", cx - 70, yc - 45, 0, cx + 70, yc + 45, 90, M["laca"], car)
    caja(nombre + "_repisa", x0 + 30, yf - sentido * 40 - 18, 0, x1 - 30, yf - sentido * 40 + 18, 200, M["laca"], car)
    rect(nombre + "_luz", cx, yc, Z_VITRINA - 2, w * 0.6, FONDO * 0.6, LUZ_LOCAL_LM, LUZ_LOCAL_K, False, car)


def main():
    borrados = limpiar()
    M = {"muro": mat("MI_BF_Pasillo_Muro"), "cielo": mat("MI_BF_Cielo_Pintura"), "piso": mat("MI_BF_Porcelanato"),
         "laca": mat("MI_BF_Laca_Blanca"), "negro": mat("MI_BF_Pintura_Negra"), "vidrio": mat("vidrio"),
         "muro_local": mat("MI_BF_Muro_Pintura"),
         "aviso": mi_emisivo("MI_BF_Aviso", (1.0, 0.96, 0.9), AVISO),
         "linea": mi_emisivo("MI_BF_Linea_Luz", (1.0, 0.98, 0.95), 40.0)}
    with unreal.ScopedEditorTransaction("Entorno del pasillo"):
        # piso hasta los extremos
        caja("Pasillo_piso_izq", -X_FIN, Y_MURO, -2, -800, Y_FRENTE, 0, M["piso"])
        caja("Pasillo_piso_der", 800, Y_MURO, -2, X_FIN, Y_FRENTE, 0, M["piso"])
        # cielo raso con dos líneas de luz
        caja("Pasillo_cielo", -X_FIN, Y_MURO, Z_CIELO, X_FIN, Y_FRENTE + 20, Z_CIELO + 10, M["cielo"])
        n = 0
        for yl in (Y_MURO + 170, Y_FRENTE - 170):
            for i in range(6):
                x = -X_FIN + 285 + i * 570
                caja("Pasillo_linea_luz", x - 250, yl - 6, Z_CIELO - 1.5, x + 250, yl + 6, Z_CIELO, M["linea"], colision=False)
                rect("Pasillo_luz_%02d" % n, x, yl, Z_CIELO - 3, 500, 12, LUZ_PASILLO_LM, LUZ_PASILLO_K, abs(x) < 900)
                n += 1
        # locales de enfrente
        for i, (cx, w) in enumerate(FRENTE):
            local_vecino("Frente_%d" % (i + 1), cx, w, Y_FRENTE + 6, +1, M)
        for x0, x1 in tramos(FRENTE, -X_FIN, X_FIN):
            caja("Frente_muro", x0, Y_FRENTE, 0, x1, Y_FRENTE + 20, Z_CIELO, M["muro"])
        # vecinos a cada lado del local: el muro liso se cambia por tramos con vitrina
        for a in EAS.get_all_level_actors():
            if isinstance(a, unreal.StaticMeshActor) and TAG not in a.tags:
                c = a.static_mesh_component
                om = c.get_editor_property("static_mesh")
                nm = om.get_material(0).get_name() if om and om.get_material(0) else ""
                if re.match(r"^muroPasillo[01]?$", nm):
                    o, e = a.get_actor_bounds(False)
                    if e.z > 200 and abs(o.x) > 400:          # los dos muros laterales, no el de encima de la fachada
                        c.set_visibility(False)
                        a.set_actor_enable_collision(False)
                        a.tags = list(a.tags) + [unreal.Name("BF_OCULTO_PASILLO")]
        for i, (cx, w) in enumerate(LADO):
            local_vecino("Lado_%d" % (i + 1), cx, w, Y_MURO - 6, -1, M)
        for x0, x1 in tramos(LADO + [(0.0, 630.0)], -X_FIN, X_FIN):
            caja("Lado_muro", x0, 350, 0, x1, Y_MURO, Z_CIELO, M["muro"])
        for x0, x1 in ((-X_FIN, -315.0), (315.0, X_FIN)):
            caja("Lado_muro_alto", x0, 350, Z_VITRINA, x1, Y_MURO - 1, Z_CIELO, M["muro"])
        # remates al final del pasillo
        caja("Pasillo_fin_izq", -X_FIN - 20, Y_MURO, 0, -X_FIN, Y_FRENTE + 20, Z_CIELO, M["muro"])
        caja("Pasillo_fin_der", X_FIN, Y_MURO, 0, X_FIN + 20, Y_FRENTE + 20, Z_CIELO, M["muro"])
    unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
    log("pasillo armado (borrados %d de antes)" % borrados)


main()
