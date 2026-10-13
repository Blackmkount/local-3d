# Diseño del local y del visor

Las decisiones de diseño del modelo 3D: fachada, piso, impresoras, calidad de imagen e interfaz.
Para abrir la página y usarla, empieza por el [README](../README.md).

[← Volver al README](../README.md)

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

## Tecnología

HTML, CSS y JavaScript sin pasos de compilación. El 3D usa [three.js](https://threejs.org) r160, copiado en `vendor/`
(antes se cargaba desde jsDelivr; `npm run vendor` lo vuelve a copiar desde npm);
el postproceso (oclusión ambiental, bloom, acumulación temporal y tone mapping) es código propio en `js/engine.js` y
necesita WebGL 2.
