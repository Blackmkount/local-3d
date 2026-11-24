# BlackForge 3D · Galería en Unreal Engine 5.8

Recorrido interactivo en primera persona por la versión B (Galería). El modelo sale del mismo visor web
(`tools/unreal-export.js`): los mismos muebles, piezas, materiales y medidas. Unreal se usa solo para lo visual.
Los planos, las notas y la información de cada pieza siguen en la página web.

## Qué trae el paquete

| Archivo | Qué es |
|---|---|
| `galeria.glb` | El local con los 20 elementos, pieza por pieza, materiales PBR con texturas y 99 marcadores |
| `muebles.json` | Nombre y medidas de cada elemento (para los rótulos del recorrido) |
| `scripts/preparar_galeria.py` | Importa el modelo y arma el recorrido: luces, cámaras, colisiones, inicio y postproceso |

Los marcadores son cubos de 1 cm con nombre. El script los convierte en:
- 26 luces LED, una por cada tira del despiece, de 3000 K y con el largo de la tira;
- 9 focos y 3 luces generales del cielo raso;
- la luz del pasillo del centro comercial y la luz ambiente;
- el inicio del recorrido, en el pasillo y mirando la fachada;
- las cámaras `Camara_fachada` y `Camara_interior` (las mismas vistas de la página);
- el nombre de cada mueble flotando sobre él.

## Requisitos

- **Windows:** Windows 10 u 11, tarjeta NVIDIA RTX (recomendada RTX 3060 de 12 GB o superior), 32 GB de RAM y 100 GB libres en un SSD.
- **Mac:** chip Apple M1 o superior, 16 GB de RAM como mínimo, y Xcode con su licencia aceptada y el componente
  **Metal Toolchain** instalado (*Xcode → Settings → Components*). Con `xcrun -sdk macosx metal -v` se comprueba que
  responde. Si falta, Unreal no abre y muestra «missing Metal Toolchain».
- Unreal Engine 5.8, instalado desde el Epic Games Launcher. Es gratis para uso educativo.

## Pasos

1. **Crear el proyecto.** En el Epic Games Launcher, abrir Unreal Engine 5.8 y elegir
   *Juegos → Primera persona* (Games → First Person). Escoger Blueprint, calidad máxima y sin contenido inicial.
   Nombre sugerido: `BlackForgeGaleria`.
2. **Activar Python.** *Editar → Plugins*, buscar **Python Editor Script Plugin**, activarlo y reiniciar el editor.
   Los importadores glTF ya vienen activos (Interchange).
3. **(Opcional, solo Windows con tarjeta RTX) Mejores reflejos.** *Editar → Configuración del proyecto → Renderizado*:
   activar **Support Hardware Ray Tracing** y, en Lumen, **Use Hardware Ray Tracing when available**. Reiniciar.
4. **Copiar el paquete** a una carpeta sin tildes ni espacios, por ejemplo `C:\BlackForge\galeria-unreal`.
5. **Ejecutar el script.** *Herramientas → Ejecutar script de Python…* (Tools → Execute Python Script…) y elegir
   `scripts\preparar_galeria.py`. Crea el nivel `/Game/Galeria/Mapas/L_Galeria`, importa el modelo (uno o dos
   minutos) y arma el recorrido. Al terminar, el registro de salida dice «listo».
6. **Ocultar los brazos de la plantilla.** Abrir el Blueprint del personaje (`BP_FirstPersonCharacter`), seleccionar
   la malla de los brazos (`Mesh1P` o `FirstPersonMesh`, según la versión) y desactivar **Visible**. Compilar y guardar.
7. **Recorrer.** Botón **Jugar** (Alt+P). W A S D para caminar, el mouse para mirar, espacio para saltar y Esc para salir.
8. **Que el proyecto abra en la Galería.** *Configuración del proyecto → Mapas y modos*: poner `L_Galeria` como
   **Editor Startup Map** y **Game Default Map**.
9. **Ejecutable para presentar.** *Plataformas → Windows → Empaquetar proyecto* (en Mac, *Plataformas → Mac*). Sale una carpeta con un `.exe` que
   corre en cualquier PC con Windows y tarjeta gráfica, sin instalar Unreal.

## Ajustes de realismo (`scripts/mejorar_galeria.py`)

Se ejecuta después de `preparar_galeria.py`, desde la consola de Unreal
(`py "/ruta/galeria-unreal/scripts/mejorar_galeria.py"`) o desde *Herramientas → Ejecutar script de Python…*.
No reimporta nada y se puede repetir. Hace lo siguiente:
- Luz general neutra de 4000 K y menos intensa, y focos de 3500 K sobre los productos.
- Luz ambiente con captura fija; así desaparece el aviso rojo de SkyAtmosphere.
- Tiras LED y acrílico opal más brillantes.
- Balance de blancos, contraste, oclusión ambiental y exposición.
- Rótulos girados. Solo se ven en el editor, no en el recorrido (`ROTULOS_EN_JUEGO`).

## Texturas de lo que está en exhibición (`scripts/texturas_galeria.py`)

Crea dos materiales en `/Game/Galeria/Materiales`:
- `M_BF_PLA`: PLA impreso con líneas de capa de 0.2 mm, que se marcan en el tono y el brillo y se desvanecen
  de lejos, más una leve variación de tono.
- `M_BF_Hoja`: hojas en dos verdes, de dos caras.

Cada mueble muestra una colección de un color: terracota en los nichos, seda dorada en la isla, grafito en los
pedestales, azul petróleo en el laboratorio, rojo en la repisa de filamentos, cobre en la vitrina, salvia en el nicho
de bienvenida, cobalto en el panel de accesorios, y otros. Las piezas sobre las camas de las impresoras llevan un
color por impresora, y la silla lleva tela grafito. Los colores se cambian en `COLECCIONES`, al comienzo del script.
Solo cambia el material de esos actores; los recursos importados no se tocan.

En Unreal 5.8 con Substrate, una normal en espacio del mundo apaga el color; por eso las líneas van en el tono. Además,
los nodos de una sola entrada (seno, 1 − x, máscara) se conectan con nombre de entrada vacío. Si se usa otro nombre,
el material no compila y las piezas salen grises.

## Luminarias y vidrios

- `scripts/luminarias_galeria.py` pone una luz en cada luminaria del modelo y borra las del visor web, que no
  coincidían con ninguna lámpara:
  - un foco en cada una de las 10 cabezas de los rieles, apuntando hacia donde mira la cabeza;
  - un foco hacia abajo en los 2 colgantes;
  - luz rectangular en la lámpara lineal de la barra, en el panel de la trastienda y en la luz perimetral oculta del cielo raso.

  También adelanta el panel de accesorios para que quede apoyado sobre los listones del muro, no dentro de ellos
  (en el visor web también se corrigió).
- `scripts/vidrios_galeria.py` quita Nanite a las mallas con material transparente (vidrio, acrílico). Nanite
  solo admite materiales opacos y, con él, el vidrio no se ve como vidrio.

## Carretes de filamento (`scripts/carretes_galeria.py`)

Crea `M_BF_Carrete` y lo pone en los carretes de la repisa de filamentos, el laboratorio, la bodega, el panel de
accesorios y las unidades AMS. Cada carrete queda en dos colores, como los reales:
- las tapas y el centro son de cartón kraft, mate y con fibra (color en `CARTON`);
- el filamento conserva el color de cada carrete, con brillo de plástico y las vueltas del hilo de 1.75 mm.

El material reconoce el cartón tanto en exportaciones viejas (tapas oscuras) como en las nuevas, donde el visor web
ya pinta las tapas de cartón. `scripts/vista_carretes.py` pone la cámara frente a los carretes de un mueble
(`MUEBLE`, `DIST`).

`scripts/vista.py` pone la cámara del editor frente a un mueble (`MUEBLE`, `DIST`), para revisar de cerca.

`scripts/diagnostico.py` escribe `diag.json` con los materiales importados, sus parámetros y las luces del nivel.

## Ajustes

Al comienzo de `preparar_galeria.py`:

| Ajuste | Para qué |
|---|---|
| `LED_LM_POR_METRO` (700) | Brillo de las tiras LED |
| `FOCO_LM`, `CALIDA_LM`, `PASILLO_LM` | Brillo de los focos, de la luz general y del pasillo |
| `EV_MIN`, `EV_MAX` | Rango de la exposición automática; subir los dos si la escena se ve oscura |
| `ETIQUETAS` | `False` quita los nombres de los muebles (para renders) |
| `COLISIONES` | `False` no agrega cajas de colisión a las piezas |
| `REIMPORTAR` | `True` vuelve a importar el modelo, después de exportarlo de nuevo |

El script se puede ejecutar varias veces: borra lo que generó antes y lo crea otra vez.

## Si algo falla

- **El editor se cierra al ejecutar el script.** Volver a abrir el proyecto y ejecutar el script otra vez: retoma
  desde donde quedó. Si se vuelve a cerrar, poner `COLISIONES = False` y ejecutarlo de nuevo (se camina, pero
  atravesando los muebles), y avisar con el registro del cierre.
- **No importa el modelo.** Hacerlo a mano con *Archivo → Importar al nivel…*, elegir `galeria.glb` y como destino
  `/Game/Galeria/Modelo`. Luego ejecutar el script de nuevo.
- **No encuentra el modo de juego.** El proyecto no se creó con la plantilla de primera persona. En *Ajustes del mundo*
  (World Settings) poner en **GameMode Override** el modo de primera persona del proyecto.
- **Los nombres de los muebles se leen al revés.** Girar 180° las etiquetas: carpeta `Galeria/Etiquetas` del
  Outliner, seleccionarlas todas y rotar en Z.
- **El vidrio o el acrílico opal no se ven bien.** Abrir su material en `/Game/Galeria/Modelo` (`vidrio`,
  `vidrioPuerta`, `opal`) y bajar la opacidad o la rugosidad.
- **Sale un aviso rojo en pantalla** («luz cenital con captura en tiempo real… SkyAtmosphere»), también en el
  recorrido. Ejecutar `scripts/sin_avisos.py`: deja la luz ambiente con captura fija y guarda el nivel.
  `preparar_galeria.py` ya la crea así.
- **Se ve oscuro o quemado.** Ajustar `EV_MIN` y `EV_MAX`, o mover la exposición en `Postproceso_Galeria`.

## Siguientes pasos posibles

- Renders y video en 4K desde `Camara_fachada` y `Camara_interior` con Movie Render Queue.
- Una ficha que aparezca al mirar un mueble y pulsar E (Blueprint), con los datos de `muebles.json`.
- Cambio día/noche y encender o apagar la luz de los muebles.

## Volver a exportar el modelo

Si cambia el diseño en el visor, se exporta de nuevo desde el repositorio, con el sitio servido en el puerto 8765:

```
node tools/unreal-export.js unreal
```

Luego se copia el nuevo `galeria.glb` al paquete y se ejecuta el script con `REIMPORTAR = True`.
