# -*- coding: utf-8 -*-
"""Quita del nivel los nombres flotantes de los muebles (textos 3D) y guarda el nivel.
Para volver a tenerlos: ETIQUETAS = True en preparar_galeria.py y ejecutarlo de nuevo."""
import unreal
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
txt = [a for a in EAS.get_all_level_actors() if isinstance(a, unreal.TextRenderActor)]
nombres = [a.get_actor_label() for a in txt]
with unreal.ScopedEditorTransaction("Quitar rótulos"):
    for a in txt:
        EAS.destroy_actor(a)
unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level()
unreal.log("[Galería] rótulos quitados: %d (%s)" % (len(nombres), ", ".join(nombres)))
