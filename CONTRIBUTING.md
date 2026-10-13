# Cómo contribuir

Gracias por ayudar con BlackForge. Esta guía explica cómo trabajar en el proyecto sin romper nada. Todo está en
español: el código, los comentarios, los mensajes de las pruebas y los commits.

## Antes de empezar

- [Node.js](https://nodejs.org) 22 (el número está en `.nvmrc`; con nvm: `nvm use`).
- Una vez: `npm ci` instala las herramientas (ESLint, Playwright, http-server). La página no las necesita: es HTML,
  CSS y JavaScript sin compilación.
- Para las pruebas en el navegador, una vez: `npx playwright install chromium`.

## Ver la página en tu computador

```sh
npm start            # http://localhost:8000 (también sirve python3 -m http.server 8000)
```

Abre <http://localhost:8000>. Cada vez que guardas un archivo, recarga la página. Añade `?lite` si el equipo va lento
y `?stats` para ver los cuadros por segundo.

## Cambiar un precio

1. En `js/data.js`, busca el material y cambia su `costo` (número entero en pesos, sin puntos).
2. `npm test` dice qué totales ya no cuadran y por cuánto: el `total` del mueble, `presupuesto.total`, `fabricado` o
   `comprado`, el rubro y la tienda (y el plan de corte si es un tablero). Corrígelos hasta que pase.
3. Si cambió el total general, cámbialo también en el README (la prueba lo revisa) y en el texto `<noscript>` de
   `index.html`.
4. `npm run version` y anota el cambio en `CHANGELOG.md`, en «Sin publicar».

¿Viste un precio distinto en una tienda pero no vas a editar el código? Abre un aviso con el formulario
[«Corregir un precio»](https://github.com/Blackmkount/local-3d/issues/new?template=precio.yml).

## Agregar una palabra al glosario o un texto para niños

Los textos para niños viven en `js/kids-data.js`:

- **Palabra del glosario**: agrega una entrada a `glosario` con `id` (único, sin espacios), `t` (la palabra como se
  muestra), `alias` (las formas exactas que se buscan en el texto: singular, plural…), `d` (una línea que entienda
  alguien de 10 años) y, si se ve en el modelo, `ver` (el número del mueble). Usa `cs: true` para siglas y nombres de
  color que solo cuentan con mayúscula (MDF, Plomo).
- **Texto de un mueble**: en `items[n]`, `que`, `para` y `sabias` (máximo 25 palabras cada uno, hablándole al lector
  de tú) y, si quieres, una pregunta `quiz` con tres respuestas y la correcta en `ok`.
- `npm test` revisa que los id no se repitan, que cada `ver` exista y que las preguntas tengan respuesta.

## Volver a generar un video

Los videos de las pantallas están hechos con código. Los pasos completos, con los comandos de `ffmpeg`, están en
[docs/videos.md](docs/videos.md). En resumen: `npm start`, edita los textos y tiempos al comienzo de
`tools/video-pantalla/video.js` (o `tools/video-exterior/video.js`), corre `npm run video:75`
(o `npm run video:exterior`) y arma el MP4 y el WebM con `ffmpeg`.

## Revisar antes de enviar

```sh
npm run check        # ESLint + pruebas de datos (segundos)
npm run test:e2e     # la página en Chromium, escritorio y teléfono (unos minutos)
npm run version      # si cambió algo en css/ o js/
```

Si cambiaste algo que se ve, adjunta una captura al pull request. Para rehacer las del README y la imagen para
redes: `npm run og` (con `npm start` corriendo). Si cambiaste el logotipo: `npm run icons`.

## Commits y pull requests

- Títulos descriptivos en español, en presente y sin punto final, como los que ya hay:
  «Precio del televisor de 55" confirmado ($1.699.900)», «Piso de madera en el local».
- En el cuerpo, una lista corta de lo que cambia y por qué.
- Un pull request por tema. La plantilla trae la lista de revisión.

## Publicar

Cada cambio que llega a `main` se publica solo en GitHub Pages (`.github/workflows/pages.yml`), después de pasar
`npm run check`. Solo se suben los archivos del sitio (`index.html`, `404.html`, `manifest.webmanifest`, `css/`,
`js/`, `assets/` y `vendor/`).

## Pendientes del dueño del repositorio

Cosas que solo puede hacer quien administra el repositorio en GitHub:

- [ ] **Activar la publicación con Actions**: *Settings → Pages → Build and deployment → Source* y elegir
      **GitHub Actions** (hoy publica desde la rama). Sin este cambio, `pages.yml` no puede publicar.
- [ ] **Elegir una licencia.** Mientras no haya una, todos los derechos quedan reservados. Conviene pensar por
      separado en el código, en el contenido (textos, datos, videos) y en la marca y el logotipo de BlackForge.
- [ ] **Completar la ficha del repositorio**:
      ```sh
      gh repo edit Blackmkount/local-3d \
        --description "Recorrido 3D interactivo del local BlackForge: muebles, materiales, costos y armado paso a paso" \
        --homepage "https://blackmkount.github.io/local-3d/" \
        --add-topic threejs --add-topic webgl --add-topic 3d --add-topic interior-design \
        --add-topic 3d-printing --add-topic retail --add-topic github-pages --add-topic spanish
      ```
- [ ] **Subir la imagen para redes** del repositorio: *Settings → General → Social preview*, con
      `assets/og/blackforge-og.jpg`.
