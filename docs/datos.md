# Los datos del proyecto

Todo lo que la página cuenta (nombres, medidas, materiales, precios, pasos y textos) sale de un solo archivo,
**`js/data.js`**. Los textos para niños están aparte, en `js/kids-data.js`. Las pruebas (`npm test`) revisan que
las cuentas cuadren cada vez que algo cambia.

[← Volver al README](../README.md)

## De dónde salen los datos

- **Planta de distribución y mobiliario**: posición y medidas de los 20 elementos.
- **Taller Impresión 3D — Mobiliario, materiales y fabricación** (9 de octubre de 2026): despiece, costos, fabricación, ensamble y razones de cada material.

Los precios son los publicados en línea el 9 de octubre de 2026 (el del televisor de 55", el 10 de octubre), en pesos
colombianos. El total ($38.788.078) no incluye mano de obra, transporte, instalación eléctrica, plantas ni el canal
perimetral de la mampara. Las medidas del plano se estimaron desde la imagen del local y deben
verificarse en sitio antes de pedir el corte.

## Qué es fiel al documento y qué es interpretación del modelo

- Medidas, ubicación, despiece, materiales, costos y textos vienen de los dos documentos.
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

## Cómo está organizado `js/data.js`

| Parte | Qué contiene |
|---|---|
| `meta` | Marca, lema y fechas de los precios |
| `items` | Los 20 elementos del plano: número `n`, nombre, `origen` (`fabrica` o `compra`), medidas, `total`, filas de materiales (`mats`), pasos de fabricación (`fab`) y de ensamble (`ens`), la secuencia de la animación de armado (`seq`) y la razón de cada material (`why`) |
| `procesos` | Cómo se fabrica cada material industrial (aglomerado, MDF, vidrio templado…) y sus fuentes |
| `catalogo` | Precios de cada material con el enlace a la tienda |
| `presupuesto` | Total, fabricado y comprado, rubros, tiendas, plan de corte de tableros, supuestos y pendientes |
| `montaje` | Equipos de trabajo (frentes) y los pasos para armar la tienda completa |

## Qué revisan las pruebas

`npm test` (`tests/data.test.mjs`) falla con un mensaje en español que dice qué elemento no cuadra y por cuánto:

- el total de cada elemento es la suma de sus materiales;
- `presupuesto.total`, `fabricado` y `comprado` son las sumas de los elementos;
- los rubros y las tiendas suman el total;
- el plan de corte: láminas × precio de la lámina, las 270 piezas y las 27 láminas de la nota, y que coincida con las
  filas de cada tablero;
- el montaje usa cada elemento una sola vez y los enlaces del catálogo usan https;
- las frases del presupuesto que comparan cifras siguen siendo ciertas;
- los números escritos a mano en `index.html` y el total del README coinciden con los datos.

`tests/kids.test.mjs` revisa `js/kids-data.js` (los 20 textos, las preguntas, el glosario y la historia) y
`tests/html.test.mjs` lo que se publica (archivos, versiones, íconos, imagen para redes).
