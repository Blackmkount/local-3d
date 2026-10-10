# BlackForge · local de impresión 3D · visualizador interactivo

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
- **Descargar el modelo 3D**: desde la búsqueda (<kbd>⌘K</kbd> / <kbd>Ctrl K</kbd>), *Descargar modelo 3D (.glb)*, para abrirlo en Unreal Engine, Blender, Twinmotion o D5.

Un enlace que termina en `#m7` abre directamente la ficha del elemento 7 (sirve con cualquier número del 1 al 20);
el botón de compartir de cada ficha copia ese enlace.

## Fachada

Fascia y pilares en panel de aluminio compuesto negro satinado, con juntas alineadas a los pilares. El logotipo de
BlackForge va en **letras corpóreas** de 3 cm: frente de acrílico opal iluminado, cantos negros y separación de 2 cm de la
fascia, de modo que la luz que escapa por detrás dibuja un halo sobre el panel. El vano lleva un marco de bronce
cepillado (forro de pilares, cielo del vano y nariz de la fascia) con una línea de luz LED, tres luminarias empotradas en
el alero que iluminan la entrada y un umbral de acero inoxidable en la línea de fachada.

Las letras se generan a partir del archivo `assets/blackforge-logo.svg` (sus trazos están en `js/brand.js`): si cambia
el logotipo, basta con reemplazar los trazos y la fachada, la barra superior y la pantalla de inicio se actualizan.

## Video de la pantalla de 75"

La pantalla vertical del muro izquierdo reproduce un video en bucle, sin sonido: `assets/video/pantalla-75.mp4`
(y `pantalla-75.webm` para los navegadores que no traen H.264). El que viene es una demostración: el conejo se imprime
capa por capa y cierra con el logotipo de BlackForge.

Para poner otro video basta con reemplazar el archivo, con el mismo nombre:

- **Formato**: MP4 con video H.264, vertical 9:16 (1080 × 1920 o 720 × 1280). El sonido no se usa.
- **Peso**: mientras más liviano, antes empieza; unos 5 a 15 MB para 15 a 30 segundos está bien.
- El `.webm` es opcional: si no se reemplaza, los navegadores que lo usan seguirán mostrando la demostración, así que
  conviene borrarlo o generarlo también, por ejemplo con
  `ffmpeg -i pantalla-75.mp4 -c:v libvpx-vp9 -b:v 0 -crf 33 -an pantalla-75.webm`.
- Después de cambiarlo, subir el número `?v=` de `index.html` para que los navegadores no muestren el anterior.

El video solo corre mientras la pantalla está a la vista, para no gastar batería. Se ve en la página publicada (GitHub
Pages) o servida desde un servidor local; al abrir `index.html` con doble clic el navegador no deja usar el video dentro
del 3D y la pantalla muestra la imagen fija. Tampoco se reproduce si el sistema tiene activado *reducir movimiento*.

## Interfaz

Diseñada con el lenguaje de macOS: los controles flotan sobre el modelo como vidrio esmerilado oscuro (fondo
translúcido con desenfoque y saturación, borde de media línea y sombras suaves), con texto claro para leer cómodo sobre
cualquier parte del modelo, la tipografía del sistema (SF en equipos Apple, Inter en los demás) y un solo acento, el
ámbar de la luz LED del local. El logotipo de BlackForge encabeza la barra superior y lleva de vuelta a la fachada.

- **Barra de herramientas en cápsula** y **controles segmentados** con un indicador que se desliza bajo la opción elegida
  (vistas, filtro del mobiliario y pestañas de la ficha).
- **Paneles y ventanas animados**: el mobiliario y la ficha entran y salen deslizándose con curva de resorte; las
  ventanas (Presupuesto y Materiales) crecen desde el botón que las abrió, se arrastran por la barra de título y
  tienen el semáforo de macOS: rojo cierra, amarillo minimiza hacia el botón de origen y verde amplía (también con doble
  clic en la barra).
- **Búsqueda tipo Spotlight** con <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd> o <kbd>/</kbd>: muebles, vistas y acciones en un solo
  lugar, sin tildes ni mayúsculas, con flechas y <kbd>Enter</kbd>.
- **Buscador en el mobiliario**, filas con selección en color de acento y entrada escalonada.
- **Notificaciones** al copiar un enlace o exportar el modelo.
- **En el teléfono** la ficha es una hoja inferior: se arrastra hacia arriba para ampliarla y hacia abajo para cerrarla.
- Respeta las preferencias del sistema *reducir movimiento* y *reducir transparencia*.

## Llevar el modelo a Unreal Engine 5 u otro programa

En la búsqueda (<kbd>⌘K</kbd> / <kbd>Ctrl K</kbd>), *Descargar modelo 3D (.glb)*. El archivo trae los muros, los 20 elementos pieza por pieza (con el nombre de cada pieza del despiece), los materiales PBR con
sus texturas de color, relieve y rugosidad, las luces del local y las vistas de la página como cámaras.

- **Unreal Engine 5**: arrastrar el `.glb` al Content Browser (importador Interchange). Con Lumen activo la iluminación
  global sale en tiempo real; para imágenes finales, el Path Tracer de la Movie Render Queue. Conviene subir la intensidad
  de las luces importadas y cambiar los vidrios por un material translúcido de Unreal.
- **Blender**: *Archivo → Importar → glTF 2.0*.
- **Twinmotion, D5 Render, Enscape o SketchUp**: importan `.glb` directamente.

## Calidad de imagen del visor

Sin archivos de textura ni dependencias nuevas:

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

Al publicar cambios, conviene subir el número `?v=` que acompaña a `css/styles.css` y a cada `js/…` en `index.html`:
así los navegadores descargan la versión nueva en lugar de usar la guardada en caché.

| Archivo | Qué contiene |
|---|---|
| `index.html` | Estructura de la página |
| `css/styles.css` | Apariencia de la interfaz (vidrio oscuro, animaciones) |
| `assets/blackforge-logo.svg` | Logotipo de BlackForge (original) |
| `assets/video/` | Video en bucle de la pantalla de 75" (MP4 y WebM) |
| `js/brand.js` | Trazos del logotipo, para la barra superior, la pantalla de inicio y las letras de la fachada |
| `js/data.js` | **Datos del proyecto**: 20 elementos, catálogo de precios, presupuesto, montaje |
| `js/furniture.js` | Los muebles modelados pieza por pieza: medidas, material y paso de armado de cada una |
| `js/room.js` | Muros, fachada, cielo, luces y cotas |
| `js/engine.js` | Motor: texturas PBR procedurales, materiales, luces, postproceso HDR, refinamiento progresivo, cámara, reflejo del piso y animaciones |
| `js/geo.js` | Utilidades de geometría (tableros con canto redondeado, trazos SVG a formas 3D) |
| `js/export.js` | Exporta el local completo a `.glb` |
| `js/ui.js` | Comportamiento de la interfaz: paneles animados, segmentados, ventanas y notificaciones |
| `js/app.js` | Interacción: selección, explosionado, armado, fichas, presupuesto y búsqueda |
| `tools/build-artifact.py` | Empaqueta todo en un solo archivo HTML para compartirlo |

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
- El diseño de la fachada (panel negro, marco de bronce, letras corpóreas, luminarias del alero y umbral) es una propuesta del modelo; no viene de los documentos ni tiene costo en el presupuesto.
- Las texturas de los materiales, la potencia y orientación de cada luminaria y el pasillo del centro comercial son interpretación: sirven para juzgar el ambiente, no reemplazan un estudio de iluminación.

## Tecnología

HTML, CSS y JavaScript sin pasos de compilación. El 3D usa [three.js](https://threejs.org) r160, cargado desde jsDelivr;
el postproceso (oclusión ambiental, bloom, acumulación temporal y tone mapping) es código propio en `js/engine.js` y
necesita WebGL 2.
