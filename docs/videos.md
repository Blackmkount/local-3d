# Videos de las pantallas

Los dos videos que se ven en el local (la pantalla de 75" de adentro y las dos de 55" de los pilares) están hechos
con código: se puede corregir un texto, un color o un tiempo y volver a generarlos.

[← Volver al README](../README.md)

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
- Los videos no llevan número de versión (`?v=`) y solo se descargan cuando la pantalla aparece a la vista.
  GitHub Pages los guarda unos 10 minutos en la caché del navegador: después de publicar, el video nuevo se ve a más
  tardar en ese tiempo.

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

## Atajos con npm

Con las dependencias instaladas (`npm ci`) y el sitio servido (`npm start`, puerto 8000):

| Comando | Qué hace |
|---|---|
| `npm run video:75` | Renderiza los 1080 cuadros del video de 75" en `tools/video-pantalla/frames/` |
| `npm run video:exterior` | Renderiza los 720 cuadros del video exterior en `tools/video-exterior/frames/` |

Los cuadros no se suben al repositorio (cada carpeta tiene su `.gitignore`); los comandos de `ffmpeg` de arriba
arman el MP4 y el WebM.
