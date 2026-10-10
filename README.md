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

Un enlace que termina en `#m7` abre directamente la ficha del elemento 7 (sirve con cualquier número del 1 al 20).

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
| `js/engine.js` | Motor: luces, materiales, cámara, reflejo del piso y animaciones |
| `js/geo.js` | Utilidades de geometría |
| `js/app.js` | Interacción: selección, explosionado, armado, fichas y presupuesto |
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

## Tecnología

HTML, CSS y JavaScript sin pasos de compilación. El 3D usa [three.js](https://threejs.org) r160, cargado desde jsDelivr.
