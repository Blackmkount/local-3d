# Local Impresión 3D · visualizador interactivo

Página web con el modelo 3D del local de exhibición y taller de impresión 3D (6.00 × 7.00 m).
Se recorre con el ratón o con los dedos y, al elegir un mueble, muestra sus materiales,
costos, fabricación, ensamble y la razón de cada material.

## Qué se puede hacer en la página

- **Recorrer el local**: arrastrar gira, la rueda acerca, el clic derecho desplaza. Hay cinco vistas listas: Fachada, Interior, Taller, Aérea y Planta.
- **Elegir un mueble**: la cámara se acerca y se abre su ficha con cinco pestañas: Resumen, Materiales y costos, Fabricación, Ensamble y Por qué.
- **Explosionar**: separa el mueble en sus piezas, tal como salen del despiece.
- **Ver armado**: reproduce el ensamble paso a paso; cada paso cita el punto del documento del que sale.
- **Ver un material en el modelo**: al pasar el cursor por una fila de la tabla de materiales se resaltan las piezas hechas con él.
- **Montaje**: muestra cómo se arma el local completo, del fondo hacia la fachada, en seis pasos.
- **Presupuesto**: total, costo por mueble, por tipo de insumo, por tienda y plan de corte de tableros.
- **Materiales**: catálogo de precios con enlace a cada tienda y el proceso industrial de cada material.
- **Planta**: vista superior con los números del plano y las cotas generales.
- **Renders**: galería de imágenes fotorrealistas del local hechas con Blender Cycles, y el botón para descargar el modelo completo en `.glb` y abrirlo en Unreal Engine, Blender, Twinmotion o D5.

Un enlace que termina en `#m7` abre directamente la ficha del elemento 7 (sirve con cualquier número del 1 al 20).

## Renders fotorrealistas

![Sala de ventas](renders/render-sala.jpg)

| | |
|---|---|
| ![Fachada](renders/render-fachada.jpg) | ![Detalle de la isla](renders/render-isla.jpg) |
| ![Mesón de impresoras](renders/render-taller.jpg) | ![Estantería retroiluminada](renders/render-estanteria.jpg) |

![Vista aérea](renders/render-aerea.jpg)

Son el mismo modelo de la página, renderizado por trazado de rutas en **Blender Cycles 4.5** (1920 × 1080, 128 muestras
adaptativas y denoiser OpenImageDenoise). Lo que cambia frente al visor:

- **Luz física**: la luz rebota entre muros y muebles (iluminación global), las gargantas bañan el cielo, cada uno de los
  diez proyectores de riel apunta a la exhibición de su muro, los colgantes iluminan la isla y el pasillo del centro
  comercial tiene sus propios paneles de luz.
- **Materiales físicos**: vidrio templado y acrílico que refractan y dejan pasar la luz, laca con barniz, porcelanato
  pulido con su esmalte, melamina Rovere con veta y poro, LED que emiten luz real, y las piezas en PLA con el relieve de
  sus capas de impresión de 0.2 mm (se ve en el detalle de la isla).
- **Cámara de arquitectura**: verticales rectas (cámara nivelada con desplazamiento de lente), profundidad de campo en el
  detalle y revelado AgX.

### Cómo se regeneran

1. En la página, **Renders → Descargar modelo 3D (.glb)**.
2. Con Blender 4.2 o posterior: `blender -b -P tools/blender/render_local.py -- --glb local-impresion-3d.glb --out renders`
   (o, sin instalar Blender, `pip install bpy` en Python 3.11 y `python tools/blender/render_local.py -- …` con las mismas opciones).
3. `--preview` hace pruebas rápidas de encuadre; `--shots sala,isla` elige vistas; `--blend escena.blend` guarda la escena
   lista para abrir y seguir trabajando en Blender.

En un procesador de 4 núcleos cada imagen tarda unos 15 minutos; con una GPU (Cycles con CUDA, OptiX, HIP o Metal) baja a
segundos.

### Llevarlo a Unreal Engine 5 u otro programa

El `.glb` trae los muros, los 20 elementos pieza por pieza (con el nombre de cada pieza del despiece), los materiales PBR con
sus texturas de color, relieve y rugosidad, las luces del local y las vistas de la página como cámaras.

- **Unreal Engine 5**: arrastrar el `.glb` al Content Browser (importador Interchange). Con Lumen activo la iluminación
  global sale en tiempo real; para imágenes finales, el Path Tracer de la Movie Render Queue. Conviene subir la intensidad
  de las luces importadas y cambiar los vidrios por un material translúcido de Unreal.
- **Blender**: *Archivo → Importar → glTF 2.0*, o el script de arriba, que ya deja la escena montada.
- **Twinmotion, D5 Render, Enscape o SketchUp**: importan `.glb` directamente.

## Calidad de imagen del visor

El visor en tiempo real también se rehízo para acercarse a esos renders, sin archivos de textura ni dependencias nuevas:

- **Texturas PBR procedurales**: cada material se genera al cargar la página con su color, su relieve (normal map) y su
  rugosidad: veta y poro de la melamina Rovere y de los listones, porcelanato de 0.60 con junta, borde redondeado y una
  mínima diferencia de plano entre baldosas que quiebra los reflejos, estuco de muros y cielo, concreto con poros en las
  materas, metal cepillado y pintura electrostática.
- **Cantos redondeados**: todos los tableros llevan el redondeo de 2 mm del canto PVC, que atrapa un hilo de luz en cada borde.
- **Materiales físicos**: laca y piezas impresas con barniz (clearcoat), vidrio y acrílico con índice de refracción.
- **Luz**: el ambiente y los reflejos salen de una captura del propio local con dos rebotes de luz; focos reales en los
  proyectores de riel, en los colgantes (con sombras) y en la lámpara lineal.
- **Postproceso HDR propio**: antialias MSAA, oclusión ambiental (SAO) con desenfoque bilateral, bloom en los LED, tone
  mapping ACES con balance de blancos y dither.
- **Refinamiento progresivo**: con la cámara quieta se suman hasta 32 cuadros con desplazamiento subpíxel y la luz
  principal tratada como luz de área. Resultado: bordes limpios y sombras de penumbra suave, como en un render.
- La resolución se adapta sola si el equipo no alcanza la fluidez. Si un equipo antiguo no muestra bien el modelo, añadir
  `?lite` a la dirección desactiva el postproceso.

## Cómo verla

- **En el computador**: abrir `index.html` con doble clic. Necesita conexión a internet la primera vez, para cargar el motor 3D y las fuentes.
- **En línea con GitHub Pages**: en el repositorio, *Settings → Pages → Deploy from a branch*, elegir la rama `main` y la carpeta `/ (root)`. En el plan gratuito de GitHub el repositorio debe ser público para usar Pages.

## Cómo actualizar el contenido

Todo el contenido vive en **`js/data.js`**: nombres, medidas, materiales, precios, pasos y textos.
Para cambiar un precio o un paso se edita ese archivo y se recarga la página; el modelo 3D no se toca.

| Archivo | Qué contiene |
|---|---|
| `index.html` | Estructura de la página |
| `css/styles.css` | Apariencia de la interfaz |
| `js/data.js` | **Datos del proyecto**: 20 elementos, catálogo de precios, presupuesto, montaje |
| `js/furniture.js` | Los muebles modelados pieza por pieza: medidas, material y paso de armado de cada una |
| `js/room.js` | Muros, fachada, cielo, luces y cotas |
| `js/engine.js` | Motor: texturas PBR procedurales, materiales, luces, postproceso HDR, refinamiento progresivo, cámara, reflejo del piso y animaciones |
| `js/geo.js` | Utilidades de geometría (tableros con canto redondeado) |
| `js/export.js` | Exporta el local completo a `.glb` |
| `js/app.js` | Interacción: selección, explosionado, armado, fichas, presupuesto y galería de renders |
| `renders/` | Renders fotorrealistas de Blender Cycles |
| `tools/blender/render_local.py` | Monta la escena en Blender (materiales físicos, luminarias, cámaras) y renderiza |
| `tools/build-artifact.py` | Empaqueta todo en un solo archivo HTML para compartirlo (renders incluidos) |

## De dónde salen los datos

- **Planta de distribución y mobiliario**: posición y medidas de los 20 elementos.
- **Taller Impresión 3D — Mobiliario, materiales y fabricación** (9 de octubre de 2026): despiece, costos, fabricación, ensamble y razones de cada material.

Los precios son los publicados en línea el 9 de octubre de 2026, en pesos colombianos. El total
($36.092.821) no incluye mano de obra, transporte, instalación eléctrica, plantas ni el canal
perimetral de la mampara. Las medidas del plano se estimaron desde la imagen del local y deben
verificarse en sitio antes de pedir el corte.

## Qué es fiel al documento y qué es interpretación del modelo

- Medidas, ubicación, despiece, materiales, costos y textos vienen de los dos documentos.
- El orden de la animación de armado sigue los pasos de fabricación y ensamble de cada ficha.
- Son interpretación del modelo: la altura del cielo (3.00 m), el diseño de la fachada y de las luces de techo, las figuras de exhibición y la forma exacta de los productos comprados. Se dibujaron para parecerse a las imágenes de referencia.
- El panel perforado se muestra blanco, como en la imagen; la lámina cotizada viene en negro.
- Los taburetes se muestran sin espaldar, como en la imagen; el producto cotizado (silla para bar Palermo) lo tiene.
- En el visor y en los renders, las texturas de los materiales, la potencia y orientación de cada luminaria y el pasillo del centro comercial son interpretación: sirven para juzgar el ambiente, no reemplazan un estudio de iluminación.

## Tecnología

HTML, CSS y JavaScript sin pasos de compilación. El 3D usa [three.js](https://threejs.org) r160, cargado desde jsDelivr;
el postproceso (oclusión ambiental, bloom, acumulación temporal y tone mapping) es código propio en `js/engine.js` y
necesita WebGL 2. Los renders se hacen con [Blender](https://www.blender.org) 4.5 y su motor Cycles.
