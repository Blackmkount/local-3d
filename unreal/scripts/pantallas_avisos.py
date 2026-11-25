# -*- coding: utf-8 -*-
"""
BlackForge 3D · Galería — pantallas encendidas y avisos con brillo real.

  · M_BF_Pantalla: la imagen de cada pantalla (la misma del modelo) emite luz, con vidrio brillante encima.
    Se pone en la pantalla vertical del local y en las dos de los pilares de la fachada.
  · Avisos de los locales vecinos y líneas de luz del pasillo con un brillo acorde a la exposición fija.
Se puede ejecutar varias veces.
"""
import re, unreal

BRILLO_PANTALLA = 70.0      # nits aproximados del blanco de la pantalla
BRILLO_AVISO = 120.0
BRILLO_LINEA = 320.0

AT = unreal.AssetToolsHelpers.get_asset_tools()
MEL = unreal.MaterialEditingLibrary
EAL = unreal.EditorAssetLibrary
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
RUTA = "/Game/Galeria/Materiales"


def log(*a):
    unreal.log("[Galería] " + " ".join(str(x) for x in a))


def maestro():
    ruta = RUTA + "/M_BF_Pantalla"
    if EAL.does_asset_exist(ruta):
        m = EAL.load_asset(ruta)
        MEL.delete_all_material_expressions(m)
    else:
        m = AT.create_asset("M_BF_Pantalla", RUTA, unreal.Material, unreal.MaterialFactoryNew())
    tex = MEL.create_material_expression(m, unreal.MaterialExpressionTextureSampleParameter2D, -600, 0)
    tex.set_editor_property("parameter_name", "Imagen")
    br = MEL.create_material_expression(m, unreal.MaterialExpressionScalarParameter, -600, 250)
    br.set_editor_property("parameter_name", "Brillo")
    br.set_editor_property("default_value", BRILLO_PANTALLA)
    mul = MEL.create_material_expression(m, unreal.MaterialExpressionMultiply, -300, 100)
    MEL.connect_material_expressions(tex, "RGB", mul, "A")
    MEL.connect_material_expressions(br, "", mul, "B")
    MEL.connect_material_property(mul, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    negro = MEL.create_material_expression(m, unreal.MaterialExpressionConstant3Vector, -300, -150)
    negro.set_editor_property("constant", unreal.LinearColor(0.01, 0.01, 0.01, 1))
    MEL.connect_material_property(negro, "", unreal.MaterialProperty.MP_BASE_COLOR)
    rug = MEL.create_material_expression(m, unreal.MaterialExpressionConstant, -300, 300)
    rug.set_editor_property("r", 0.08)
    MEL.connect_material_property(rug, "", unreal.MaterialProperty.MP_ROUGHNESS)
    for uso in ("used_with_nanite", "used_with_static_lighting"):
        try:
            m.set_editor_property(uso, True)
        except Exception:  # noqa
            pass
    MEL.recompile_material(m)
    EAL.save_loaded_asset(m)
    return m


def brillo(nombre, valor):
    ruta = RUTA + "/" + nombre
    if EAL.does_asset_exist(ruta):
        mi = EAL.load_asset(ruta)
        MEL.set_material_instance_scalar_parameter_value(mi, "Intensidad", valor)
        MEL.update_material_instance(mi)
        EAL.save_loaded_asset(mi)


def main():
    m = maestro()
    cache, n = {}, 0
    with unreal.ScopedEditorTransaction("Pantallas encendidas"):
        for a in EAS.get_all_level_actors():
            if not isinstance(a, unreal.StaticMeshActor):
                continue
            c = a.static_mesh_component
            orig = c.get_editor_property("static_mesh")
            for i in range(c.get_num_materials()):
                om = orig.get_material(i) if orig else None
                nom = om.get_name() if om else ""
                if not re.match(r"^pantalla\d*$", nom):
                    continue
                if nom not in cache:
                    tex = None
                    try:
                        tex = MEL.get_material_instance_texture_parameter_value(om, "BaseColorTexture")
                    except Exception:  # noqa
                        pass
                    ruta = "%s/MI_BF_Pantalla_%s" % (RUTA, nom)
                    mi = EAL.load_asset(ruta) if EAL.does_asset_exist(ruta) else \
                        AT.create_asset("MI_BF_Pantalla_" + nom, RUTA, unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
                    MEL.set_material_instance_parent(mi, m)
                    if tex:
                        MEL.set_material_instance_texture_parameter_value(mi, "Imagen", tex)
                    MEL.set_material_instance_scalar_parameter_value(mi, "Brillo", BRILLO_PANTALLA)
                    MEL.update_material_instance(mi)
                    EAL.save_loaded_asset(mi)
                    cache[nom] = mi
                c.set_material(i, cache[nom])
                n += 1
    brillo("MI_BF_Aviso", BRILLO_AVISO)
    brillo("MI_BF_Linea_Luz", BRILLO_LINEA)
    unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
    log("pantallas encendidas:", n, "· avisos y líneas de luz ajustados")


main()
