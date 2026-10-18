# BlackForge · local de impresión 3D · visualizador interactivo

Página web con el modelo 3D del local de exhibición y taller de impresión 3D (6.00 × 7.00 m).
Se recorre con el ratón o con los dedos y, al elegir un mueble, muestra sus materiales,
costos, fabricación, ensamble y la razón de cada material.

## Qué se puede hacer en la página

- **Recorrer el local**: arrastrar gira, la rueda acerca, el clic derecho desplaza. Hay cuatro vistas listas: Fachada, Interior, Aérea y Planta.
- **Tres versiones del local** (selector *A · B · C* de la barra superior, o las teclas <kbd>A</kbd>, <kbd>B</kbd>, <kbd>C</kbd>):
  el mismo local ordenado de tres maneras. Cada versión tiene su propia distribución y sus doce muebles fabricados, con
  diseño, despiece, costos con precios reales de tienda, fabricación, armado animado y explosionado propios. Los ocho
  productos que se compran son los mismos; en A y B cambian de lugar, y las lámparas de techo siguen al mobiliario.
  - **A · Taller a la vista**: las impresoras salen a la fachada en una vitrina de impresión, de frente al pasillo, con
    los carretes colgados encima; barra de diseño mirando la vitrina, taller en el muro izquierdo y exhibición en el
    derecho. Acero negro, Rovere y lámina perforada.
  - **B · Galería**: recorrido en U con un muro de nichos iluminados, pedestales en el eje de la entrada y una isla
    escultórica de tres alturas que sube hasta la barra de encuentro; las impresoras trabajan en un nicho del muro
    derecho y el servicio queda al fondo. MDF lacado blanco, Rovere y luz.
  - **C · Modular**: la distribución del plano original con perfil de aluminio 30 × 30, uniones y accesorios impresos en
    PETG, PVC espumado y acrílico opal.
  *Versiones* compara las tres: concepto, distribución, materiales, ventajas, desventajas y costo de cada mueble.
  El diseño original del documento del proyecto ya no se muestra; sus datos siguen en `js/data.js` como base de los
  productos comprados y de la versión C.
- **Plano 2D**: la planta de arquitectura a escala 1:50 en lámina A3, en líneas negras sobre blanco, con cotas, pasos
  libres, números, cuadro de mobiliario y cajetín. Cambia con la versión, se acerca y desplaza, cada mueble abre su
  ficha y se puede imprimir a escala (A3 horizontal) o descargar en SVG.
- **Requisitos de diseño**: las condiciones que se fijaron antes de dibujar los muebles (espacio, ergonomía, cargas,
  durabilidad, luz, instalaciones, seguridad, fabricación, marca y presupuesto) y cómo las cumple cada versión, mueble
  por mueble. Cada ficha de un mueble fabricado tiene además la pestaña *Requisitos*.
- **Elegir un mueble**: la cámara se acerca y se abre su ficha con sus pestañas: Resumen (con el costo del mueble en las tres versiones), Materiales y costos, Fabricación, Ensamble, Por qué y Requisitos.
- **Explosionar**: separa el mueble en sus piezas, tal como salen del despiece.
- **Ver armado**: reproduce el ensamble paso a paso; cada paso cita el punto del documento del que sale.
- **Ver un material en el modelo**: al pasar el cursor por una fila de la tabla de materiales se resaltan las piezas hechas con él.
- **Montaje**: muestra cómo se arma el local completo, del fondo hacia la fachada, en seis pasos.
- **Presupuesto**: de la versión que está en el modelo: total, costo por mueble, por tipo de insumo, por tienda y plan de corte (A) o plan de compras con enlace a cada producto (B y C).
- **Materiales**: catálogo de precios con enlace a cada tienda y el proceso industrial de cada material.
- **Planta**: vista superior con los números del plano y las cotas generales.
- **Descargar el modelo 3D**: desde la búsqueda (<kbd>⌘K</kbd> / <kbd>Ctrl K</kbd>), *Descargar modelo 3D (.glb)*, para abrirlo en Unreal Engine, Blender, Twinmotion o D5.

Un enlace que termina en `#m7` abre directamente la ficha del elemento 7 (sirve con cualquier número del 1 al 20);
el botón de compartir de cada ficha copia ese enlace. Una letra al final elige la versión (`#m7b`, `#c`) y `#plano`
abre el plano 2D (`#planob` lo abre en la versión B).

## Nota 1 · Diseño del mobiliario (Diseño VIII · Producción)

El botón **Notas** de la barra de herramientas abre la entrega del primer hito de la guía «Del mueble a la planta» (UPTC,
2026-2), con sus elementos A a I y la lista de chequeo. También se abre con un enlace que termina en `#nota1` (o
`#nota1-d`, por ejemplo, para ir al elemento D). El encargo está adaptado: en lugar de un apartamento, el local comercial,
con autorización del director del curso.

- **A · Ficha del proyecto**: local, áreas, espacios con sus muebles, fuente del plano, fecha y declaración de uso de IA.
- **B · Plano a escala**: la lámina 1:50 de cada versión y las referencias con que se escaló el plano.
- **C · Requisitos con su fuente**: medidas del cuerpo de Acopla95 (población laboral colombiana), requisitos que salen de
  las normas (NTC 4140, NSR-10 títulos K.3 y K.4, Decreto 1538, RETIE 2026) y, para cada mueble, quién lo usa, para qué,
  el espacio alrededor, las medidas que lo condicionan y la fuente de cada requisito, con cómo lo cumple cada alternativa.
- **D · Alternativas y matriz de selección**: las variantes A, B y C de cada mueble, con su isometría y una matriz de seis
  criterios ponderados (requisitos, costo, oficios y piezas, durabilidad, montaje y coherencia).
- **E · Planos técnicos**: por mueble y versión, lámina A3 de conjunto (alzado, lateral, corte A-A, planta e isometría,
  con cotas y rótulo, proyección ISO E), despiece explosionado con marcas y lista de piezas, y láminas de piezas con las
  medidas de corte. Todo se dibuja en vectores desde el modelo 3D (`js/dwg.js`): aristas vistas y ocultas con un mapa de
  profundidad calculado en el procesador, y la sección rayada donde el plano corta las piezas.
- **F · Despiece**: piezas con cantidad, material, medidas, formato comercial y origen (se fabrica, se compra o se encarga),
  herrajes, tornillería y acabados.
- **G · Materiales y uniones**: regla de dos materiales por mueble y tres en el conjunto, materiales con su formato y su
  justificación, y el detalle a escala 1:2 de cada unión entre materiales distintos (`js/uniones.js`).
- **H · Iluminación y equipo**: fichas técnicas con el estado de cada dato (verificado, no publicado, inferido o con
  discrepancia), carga de cada fuente LED, sección del cable por caída de tensión e integración de las impresoras.
- **I · Renders**: captura cada mueble en su sitio desde el modelo 3D iluminado.
- **Lista de chequeo y tabla de rastreo**: lo que la revisión le cambió al mueble y lo que queda por decidir.

Datos de la Nota 1: `js/nota1-data.js` (fuentes, antropometría, requisitos, criterios, fichas). Cada dato dice si sale de
una fuente, si es estimado o si no se pudo obtener, como pide la guía (numeral 4.2).

## Nota 2 · Sistema de producción

En el mismo visor, la pestaña **Nota 2 · Producción** (o un enlace que termina en `#nota2`, `#nota2-11`…) presenta la planta
que fabrica los muebles: **12 juegos de la versión B · Galería en 2027** (una cadena de 12 locales, uno por mes), en una
bodega de Villanueva (Casanare), Carrera 11 N.º 3-36.

- **J, K, N, O**: ficha de la empresa; volumen, plazo y ritmo (días hábiles de 2027 con festivos de la Ley 51 de 1983 y
  jornada de 42 h de la Ley 2101: 172,2 h por juego); fabricar, comprar o encargar cada pieza; tipo de producción.
- **2 · Hipótesis** escrita antes de calcular, y **17 · Coherencia**, que la contrasta con el resultado.
- **3 · Localización**: mapa de planta, proveedores y obra, y tabla de factores ponderados.
- **5 · Distribución**: matriz de relaciones (planeación sistemática de la distribución), plano A3 a 1:100 con el
  recorrido del material y del operario, y distancias (`js/planta.js`).
- **6 · Máquinas** con su ficha, precio y carga frente al ritmo.
- **7 · Análisis del producto**: tabla de piezas, análisis del valor y planes de corte por tablero (`js/corte.js`,
  guillotina con sierra de 4 mm; el Rovere no gira por la veta).
- **8 · Proceso**, **9 · Métodos** y **10 · Movimientos**: diagramas de operaciones, cursogramas con VA/NVA, bimanual y
  la mesa de lijado con topes (`js/proceso.js`).
- **11 · Tiempos**: tabla de datos tipo con la fuente o el supuesto de cada valor, suplementos, carga por estación,
  cuello de botella y número de operarios.
- **12 a 16**: almacenamiento, 5S, matriz de peligros GTC 45, fichas de puesto (NTP-ISO 6385) y plan de inspección.

Datos de la Nota 2: `js/nota2-data.js`. Los tiempos son estimados: se validan con el ebanista y cronometrando el primer
juego.

## Fachada

Fascia y pilares en panel de aluminio compuesto negro satinado, con juntas alineadas a los pilares. El logotipo de
BlackForge va en **letras corpóreas** de 3 cm: frente de acrílico opal iluminado, cantos negros y separación de 2 cm de la
fascia, de modo que la luz que escapa por detrás dibuja un halo sobre el panel. El vano lleva un marco de bronce
cepillado (forro de pilares, cielo del vano y nariz de la fascia) con una línea de luz LED, tres luminarias empotradas en
el alero que iluminan la entrada y un umbral de acero inoxidable en la línea de fachada.

En cada pilar, hacia el pasillo del centro comercial, va una **pantalla de 55" en vertical** (Hisense QLED 55Q6QV,
centrada en el pilar de 0.75 m y con la base a 0.90 m del piso). Las dos reproducen el mismo video, sincronizado, que
invita a entrar (ver más abajo). Reemplazan al tótem de categorías y a la pantalla de 43" del plano original. Frente a
la fachada no hay matera: los tres maceteros del local quedan adentro.

Las letras se generan a partir del archivo `assets/blackforge-logo.svg` (sus trazos están en `js/brand.js`): si cambia
el logotipo, basta con reemplazar los trazos y la fachada, la barra superior y la pantalla de inicio se actualizan.

## Piso

Dentro del local, **piso de madera**: tablas de roble tostado de 20 cm de ancho y 1.20, 1.60 o 2.40 m de largo,
colocadas a lo largo del local (de la fachada hacia el fondo) con las juntas de punta trabadas, microbisel en los cuatro
cantos y laca satinada que refleja el mobiliario de forma suave. Cada tabla tiene su tono y su corte: veta en catedral
o recta, poro abierto del roble y algún nudo pequeño. Es más oscuro que la madera clara de cubiertas y listones, para
que los muebles se separen del piso. Llega hasta el umbral de acero de la fachada; afuera, el pasillo conserva su
porcelanato de 0.60. Los colores y las medidas de las tablas están en `PLANK`, dentro de `js/engine.js`.

## Video de la pantalla de 75"

La pantalla vertical del muro izquierdo reproduce un video en bucle, sin sonido: `assets/video/pantalla-75.mp4`
(y `pantalla-75.webm` para los navegadores que no traen H.264). El que viene explica en 36 segundos cómo nace una
pieza impresa en 3D, en cuatro pasos y con animación 3D:

1. **Modelado**: la pieza (un jarrón facetado y torcido) se dibuja en líneas, toma volumen y aparecen sus medidas.
2. **Laminado**: un plano la corta en capas, las capas se separan y una de ellas muestra el recorrido de la boquilla
   (perímetros y relleno), como en el software de laminado.
3. **Impresión**: primer plano de la boquilla depositando el hilo fundido sobre la cama y luego un time-lapse de la
   pieza creciendo capa sobre capa, con temperatura y avance en pantalla.
4. **Acabado**: la pieza terminada gira sola, con su material, peso y tiempo de impresión.

Cierra con el logotipo de BlackForge y empieza y termina en negro, así el bucle no tiene saltos. Mientras el video
carga, o si no se puede reproducir, la pantalla muestra su portada.

El video está hecho con código, en `tools/video-pantalla/` (three.js para la escena y un lienzo 2D para textos e
indicadores), así que se puede corregir un texto, un color o un tiempo y volver a generarlo:

1. Con un servidor local en la raíz del repositorio (`python3 -m http.server 8000`), abrir
   `http://localhost:8000/tools/video-pantalla/` para verlo en vivo (`?t=12.5` congela ese instante).
2. Los textos y los tiempos de cada paso están al comienzo de `tools/video-pantalla/video.js` (`STEPS`).
3. Renderizar los 1080 cuadros con `node tools/video-pantalla/render.js` (usa Playwright) y armar los archivos con
   `ffmpeg -framerate 30 -i tools/video-pantalla/frames/f%04d.png -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 20 -movflags +faststart assets/video/pantalla-75.mp4`
   y `ffmpeg -framerate 30 -i tools/video-pantalla/frames/f%04d.png -c:v libvpx-vp9 -pix_fmt yuv420p -b:v 0 -crf 33 assets/video/pantalla-75.webm`.

Para poner otro video basta con reemplazar el archivo, con el mismo nombre:

- **Formato**: MP4 con video H.264, vertical 9:16 (1080 × 1920 o 720 × 1280). El sonido no se usa.
- **Peso**: mientras más liviano, antes empieza; unos 5 a 15 MB para 15 a 30 segundos está bien.
- El `.webm` es opcional: si no se reemplaza, los navegadores que lo usan seguirán mostrando el video anterior, así que
  conviene borrarlo o generarlo también, por ejemplo con
  `ffmpeg -i pantalla-75.mp4 -c:v libvpx-vp9 -b:v 0 -crf 33 -an pantalla-75.webm`.
- Después de cambiarlo, subir el número `?v=` de `index.html`: el video se pide con ese mismo número, así los
  navegadores no muestran el anterior.

El video solo corre mientras la pantalla está a la vista, para no gastar batería. Se ve en la página publicada (GitHub
Pages) o servida desde un servidor local; al abrir `index.html` con doble clic el navegador no deja usar el video dentro
del 3D y la pantalla muestra la imagen fija. Tampoco se reproduce si el sistema tiene activado *reducir movimiento*.

## Video de las pantallas exteriores

Las dos pantallas de los pilares reproducen en bucle, sin sonido, `assets/video/pantalla-exterior.mp4` (y
`pantalla-exterior.webm`). Es un video vertical de 24 segundos pensado para quien pasa caminando por el pasillo: pocos
textos, grandes, y una pieza en movimiento que llama la atención. Cuenta en cinco momentos por qué entrar a BlackForge:

1. **¿Lo imaginas?** Un robot de juguete aparece dibujado en líneas ámbar, como en el programa de diseño.
   «Si lo puedes imaginar, lo imprimimos.»
2. **Lo hacemos realidad.** La boquilla lo levanta capa por capa; la franja recién depositada brilla de calor y en
   pantalla corren la capa, el avance, la temperatura de la boquilla y el material.
3. **Piezas únicas.** El robot terminado se suma a una vitrina giratoria que va dejando al frente cada categoría de la
   tienda: Figuras (el robot), Decoración (un jarrón facetado), Regalos (un corazón), Personalizados (un llavero con
   «TU NOMBRE») y Prototipos (un engranaje).
4. **El mundo de la impresión 3D.** Tres razones para entrar: mirar las impresoras trabajando en vivo, traer una idea
   para diseñarla juntos y llevarse la pieza hecha en el taller.
5. **Entra y crea.** El logotipo de BlackForge, «Te esperamos aquí mismo» y una flecha que invita a pasar.

Empieza y termina en negro para que el bucle no tenga saltos. Las dos pantallas comparten un solo video en la página,
así que siempre muestran el mismo cuadro; mientras carga, o si no se puede reproducir, muestran la portada (el cierre
«Entra y crea»). En el local real basta con cargar el mismo archivo en una memoria USB en cada televisor.

Se genera igual que el de la pantalla de 75", con el código de `tools/video-exterior/` (textos y tiempos al comienzo de
`video.js`):

1. Con el servidor local, abrir `http://localhost:8000/tools/video-exterior/` para verlo en vivo (`?t=12.5` congela ese instante).
2. Renderizar los 720 cuadros con `node tools/video-exterior/render.js`.
3. Armar los archivos con
   `ffmpeg -framerate 30 -i tools/video-exterior/frames/f%04d.png -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 20 -movflags +faststart assets/video/pantalla-exterior.mp4`
   y `ffmpeg -framerate 30 -i tools/video-exterior/frames/f%04d.png -c:v libvpx-vp9 -pix_fmt yuv420p -b:v 0 -crf 33 assets/video/pantalla-exterior.webm`.

## Impresoras trabajando

Las cuatro P1S del mesón están modeladas por dentro y se ven a través de la puerta y la tapa de vidrio: cama de PEI
texturizado sobre dos husillos, guías y barra de carbono del CoreXY, cabezal con su boquilla y la luz de la cámara.
Cada una imprime en bucle una pieza distinta (un jarrón torcido blanco, un jarrón facetado naranja, un peón azul y un
florero estrella verde): la pieza crece capa por capa, la cama baja una capa cada vez, como en la impresora real, y el
cabezal recorre el contorno de la capa que está imprimiendo. La pantalla de cada impresora muestra el estado y el
avance. Al terminar, el cabezal se aparta, la pieza se retira y la cama vacía sube para empezar otra vez. Cada
impresora va a su propio ritmo (de 70 a 102 segundos por pieza) y con un desfase, así nunca están sincronizadas.

La animación corre unas 30 veces por segundo y solo mientras alguna impresora está a la vista; no se reproduce si el
sistema tiene activado *reducir movimiento*. Las piezas, sus medidas y sus tiempos están en `PIEZAS`, dentro de
`js/furniture.js`.

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
  rugosidad: veta y poro de la melamina Rovere y de los listones, tablas de roble del piso (veta en catedral, poro
  abierto, nudos y microbisel que quiebra los reflejos), porcelanato de 0.60 del pasillo con junta, borde redondeado y
  una mínima diferencia de plano entre baldosas, estuco de muros y cielo, concreto con poros en las materas, metal
  cepillado y pintura electrostática. La melamina blanca y los fondos llevan la piel «soft» del papel decorativo y una
  nube de tono casi imperceptible; el Plomo, además, su trama textil. La laca de las islas tiene la «piel de naranja»
  de la laca catalizada (en el color y en el barniz), los taburetes y televisores el grano del polipropileno, y las
  piezas impresas sus líneas de capa de 0.4 mm, que aparecen al acercarse y se apagan a distancia para no hacer muaré.
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
| `assets/video/` | Videos en bucle de la pantalla de 75" y de las dos pantallas exteriores (MP4 y WebM) |
| `js/brand.js` | Trazos del logotipo, para la barra superior, la pantalla de inicio y las letras de la fachada |
| `js/data.js` | **Datos del proyecto**: 20 elementos, catálogo de precios, presupuesto, montaje |
| `js/furniture.js` | Los productos comprados (pantallas, impresoras, taburetes…) y el diseño original del documento, que ya no se muestra |
| `js/versions.js` | **Versiones y requisitos**: precios de tienda con enlace, despiece, fabricación, armado y razones de cada mueble; distribución de cada versión (`LAYOUT`), lámparas (`FIXTURES`), montaje, requisitos y el cálculo de costos |
| `js/furniture-ab.js` | Los muebles de las versiones A (Taller a la vista) y B (Galería) modelados pieza por pieza |
| `js/furniture-alt.js` | Los muebles de la versión C (Modular) y las utilidades de modelado que comparten las versiones |
| `js/plan.js` | El plano 2D a escala 1:50 (SVG), con los muebles de cada versión |
| `js/room.js` | Muros, fachada, cielo, luces y cotas |
| `js/engine.js` | Motor: texturas PBR procedurales, materiales, luces, postproceso HDR, refinamiento progresivo, cámara, reflejo del piso y animaciones |
| `js/geo.js` | Utilidades de geometría (tableros con canto redondeado, trazos SVG a formas 3D) |
| `js/export.js` | Exporta el local completo a `.glb` |
| `js/ui.js` | Comportamiento de la interfaz: paneles animados, segmentados, ventanas y notificaciones |
| `js/app.js` | Interacción: selección, explosionado, armado, fichas, versiones, plano 2D, requisitos, presupuesto y búsqueda |
| `tools/build-artifact.py` | Empaqueta todo en un solo archivo HTML para compartirlo |
| `tools/video-pantalla/` | Generador del video de la pantalla de 75" (escena, textos y render cuadro a cuadro) |
| `tools/video-exterior/` | Generador del video de las pantallas exteriores |

## De dónde salen los datos

- **Planta de distribución y mobiliario**: posición y medidas de los 20 elementos.
- **Taller Impresión 3D — Mobiliario, materiales y fabricación** (9 de octubre de 2026): despiece, costos, fabricación, ensamble y razones de cada material.

Los precios son los publicados en línea el 9 de octubre de 2026 (el del televisor de 55", el 10 de octubre), en pesos
colombianos. El total ($38.788.078) no incluye mano de obra, transporte, instalación eléctrica, plantas ni el canal
perimetral de la mampara. Las medidas del plano se estimaron desde la imagen del local y deben
verificarse en sitio antes de pedir el corte.

Las tres versiones usan precios publicados entre el 9 y el 15 de octubre de 2026 en Homecenter, Madecentro, Vistronica,
Sign Colombia, Asia Colombia y El Ruso Shop, con el enlace de cada producto en la ficha y en el plan de compras. Láminas,
barras, galones y carretes se compran completos para toda la versión (72 % de aprovechamiento en tableros, 8 % de
desperdicio en barras) y su costo se reparte entre los muebles. Mobiliario fabricado: A $12.110.338, B $10.107.926 y
C $17.893.900; los ocho productos que se compran son los mismos en las tres ($26.587.400). El perfil de aluminio
30 × 30 se cotizó en tramos de 1 m; los tramos largos se cotizan con un distribuidor industrial.

## Qué es fiel al documento y qué es interpretación del modelo

- El programa del local (los 20 elementos, sus medidas generales, la trastienda y los productos comprados) viene de los dos documentos. Las tres versiones son propuestas de diseño hechas a partir de ese programa: sus distribuciones, muebles, despieces y costos no vienen del documento.
- El orden de la animación de armado sigue los pasos de fabricación y ensamble de cada ficha.
- Son interpretación del modelo: la altura del cielo (3.00 m), el diseño de la fachada y de las luces de techo, las figuras de exhibición y la forma exacta de los productos comprados. Se dibujaron para parecerse a las imágenes de referencia.
- El panel perforado se muestra blanco, como en la imagen; la lámina cotizada viene en negro.
- Los taburetes se muestran sin espaldar, como en la imagen; el producto cotizado (silla para bar Palermo) lo tiene.
- Las dos pantallas de 55" de los pilares reemplazan al tótem de categorías y a la pantalla de 43" del plano, y el
  macetero que estaba fuera del pilar derecho se quitó: el local tiene tres maceteros, todos adentro. Sin el tótem, las
  dos láminas Plomo siguen siendo necesarias (las puertas no caben en una), así que su costo se reparte entre el mesón y
  la estantería retroiluminada.
- El diseño de la fachada (panel negro, marco de bronce, letras corpóreas, luminarias del alero y umbral) es una propuesta del modelo; no viene de los documentos ni tiene costo en el presupuesto.
- Las texturas de los materiales, la potencia y orientación de cada luminaria y el pasillo del centro comercial son interpretación: sirven para juzgar el ambiente, no reemplazan un estudio de iluminación.

## Tecnología

HTML, CSS y JavaScript sin pasos de compilación. El 3D usa [three.js](https://threejs.org) r160, cargado desde jsDelivr;
el postproceso (oclusión ambiental, bloom, acumulación temporal y tone mapping) es código propio en `js/engine.js` y
necesita WebGL 2.
