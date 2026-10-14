# Cambios

Todas las versiones de la página, de la más nueva a la más vieja. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Cada versión se llama por su fecha (`AAAA.MM.DD-n`),
el mismo número que se usaba en el `?v=` de `index.html`; `npm run version` sugiere el siguiente.

## [Sin publicar]

### Añadido

- Bienvenida de tres pasos, modo explorador (palabras sencillas, «¿Qué es? ¿Para qué sirve? ¿Sabías que…?» y
  preguntas) y modo experto; recorrido guiado de 2 minutos con Forge; ayuda y menú «Más».
- Palabras del taller con su definición al tocarlas, «¿Cómo nace una pieza?» con el video y una impresora en vivo,
  Pasaporte BlackForge con 20 sellos, silueta de un niño de 1,40 m para comparar tamaños y «de cada 100 pesos» en
  el presupuesto.
- Modo lista sin 3D (`?texto`), que también aparece si el navegador no puede dibujar el modelo, y una tarjeta clara
  cuando algo falla al cargar.
- Enlaces directos a cada ficha, pestaña y ventana (`#m7/materiales`, `#presupuesto`…) y el botón Atrás del
  navegador cierra lo último que se abrió.
- Pruebas: `npm test` revisa sin navegador que las cuentas del presupuesto cuadren (totales, rubros, tiendas, plan de
  corte, montaje), el contenido para niños y los archivos publicados; `npm run test:e2e` recorre la página en Chromium,
  en escritorio y teléfono, con revisión de accesibilidad (axe).
- ESLint (`npm run lint`), `.editorconfig`, `package.json` con todos los comandos y Node 22 (`.nvmrc`).
- Pruebas automáticas en GitHub (CI) y publicación en GitHub Pages solo con los archivos del sitio.
- Favicon, íconos para el teléfono, `manifest.webmanifest` e imagen para compartir en redes (1200 × 630).
- Página 404 propia con enlaces cortos: `…/local-3d/7` abre la ficha 7.
- Etiquetas QR para imprimir y pegar en los muebles (`tools/qr/`).
- Texto para quien abre la página sin JavaScript, con el logotipo en la pantalla de inicio.
- `npm run version`: el `?v=` de cada archivo es la huella de su contenido.
- `npm run og` toma la imagen para redes y las capturas del README.
- README para quien llega por primera vez; los detalles técnicos pasan a `docs/`. `CONTRIBUTING.md`, formularios para
  corregir un precio o reportar un error y plantilla de pull request.

### Cambiado

- three.js r160 y la letra Inter viajan con el sitio (`vendor/`, `assets/fonts/`): funciona sin internet y con doble
  clic. La carga muestra su avance real y el modelo descansa cuando nada se mueve.
- Nombres más claros en la interfaz: Entrada, Adentro, Taller, Arriba y Plano; Separar piezas y Ver cómo se arma.
- Accesibilidad (WCAG 2.2 AA): foco atrapado en las ventanas, botón «Cerrar» grande en el teléfono, avisos para
  lectores de pantalla y controles de giro.
- Los contadores y frases con cifras salen de `js/data.js`.
- Los videos ya no se vuelven a descargar en cada versión: solo cuando la pantalla aparece a la vista.
- `npm run build:single` incluye todas las hojas de estilo y scripts nuevos.

### Corregido

- Dos totales que no cuadraban por un peso con sus materiales (elementos 2 y 13).
- La página ya no se queda en «Preparando el local…» si el motor 3D no carga.
- Errores de estado al separar o armar muebles sin secuencia, al resaltar un material y en el montaje.

## [2026.10.13-1] — Impresoras imprimiendo en vivo y texturas más realistas

### Añadido

- Las cuatro impresoras P1S están modeladas por dentro (cama, husillos, CoreXY, cabezal y luz de cámara) y cada una
  imprime en bucle una pieza distinta, capa por capa, con su pantalla de estado y avance.

### Cambiado

- Melamina blanca y fondos con piel «soft», Plomo con trama textil, laca con piel de naranja, polipropileno con grano
  y piezas impresas con líneas de capa.
- Cilindros más redondos (taburetes, carretes y figuras).

## [2026.10.10-8] — Precio del televisor de 55" confirmado

### Cambiado

- El televisor de 55" de los pilares cuesta $1.699.900 (confirmado el 10 de octubre de 2026).

## [2026.10.10-7] — Pantallas de 55" con video en los pilares y sin matera exterior

### Añadido

- Una pantalla de 55" en vertical en cada pilar de la fachada, con el video «Entra y crea» (24 s) sincronizado en las
  dos. Generador en `tools/video-exterior/`.

### Cambiado

- Las pantallas reemplazan al tótem de categorías y a la pantalla de 43". Presupuesto total: $38.788.078.

### Quitado

- La matera de afuera: quedan tres maceteros, todos adentro.

## [2026.10.10-6] — Piso de madera en el local

### Cambiado

- El local pasa de porcelanato a tablas de roble tostado con juntas trabadas, microbisel y laca satinada; el pasillo
  conserva el porcelanato.

## [2026.10.10-4] — Video de la pantalla de 75": cómo nace una pieza

### Cambiado

- El video de demostración se reemplaza por uno de 36 s que explica en cuatro pasos cómo se imprime una pieza en 3D:
  modelado, laminado, impresión y acabado. Generador en `tools/video-pantalla/`.

## [2026.10.10-3] — Video en bucle en la pantalla de 75"

### Añadido

- La pantalla vertical del muro izquierdo reproduce un video en bucle, sin sonido, solo mientras está a la vista.

## [2026.10.10-2] — Fachada BlackForge con letras corpóreas e interfaz oscura

### Añadido

- Fachada en panel negro con las letras de BlackForge iluminadas, marco de bronce, luminarias en el alero y umbral de
  acero; el logotipo en la barra superior y en la pantalla de inicio.
- Número de versión (`?v=`) en los archivos CSS y JS.

### Cambiado

- Interfaz en vidrio oscuro con texto claro.

### Quitado

- El apartado de renders; la descarga del modelo `.glb` queda en la búsqueda.

## [2026.10.10-1] — Render realista e interfaz estilo macOS

### Añadido

- Texturas PBR generadas en la página, cantos redondeados, postproceso HDR propio (oclusión ambiental, bloom, tone
  mapping) y refinamiento progresivo con la cámara quieta.
- Exportación del local a `.glb` para Blender, Unreal Engine, Twinmotion o D5.
- Interfaz de vidrio translúcido, ventanas animadas con semáforo, controles segmentados y búsqueda tipo Spotlight.

## [2026.10.09] — Primera versión

### Añadido

- El modelo 3D del local (6 × 7 m) con sus 20 elementos pieza por pieza, cinco vistas, ficha por mueble (materiales y
  costos, fabricación, ensamble y razones), explosionado y armado paso a paso, montaje del local, presupuesto y
  catálogo de materiales. Los datos viven en `js/data.js`.

[Sin publicar]: https://github.com/Blackmkount/local-3d/compare/main...HEAD
