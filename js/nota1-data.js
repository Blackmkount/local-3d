/* ============================================================================
   NOTA 1 · DISEÑO DEL MOBILIARIO — datos de la entrega según la guía
   «Del mueble a la planta» (Diseño VIII · Producción, UPTC, 2026-2, versión 2).

   Elementos A a I de la guía (numeral 4.1):
     A ficha del proyecto     B plano a escala         C requisitos con su fuente
     D alternativas y matriz  E planos técnicos        F despiece y lista de materiales
     G materiales y uniones   H iluminación y equipo   I renders en el espacio

   Regla de los datos (numeral 4.2): cada dato se toma de una fuente (y se cita),
   se marca como estimado diciendo de dónde salió, o se declara no obtenido.
   tipo de cada dato:  fuente · secundaria (citada por otra fuente) · estimado ·
                       encargo (lo pide el programa del local) · no (no obtenido)
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});

  /* ------------------------------------------------------------ fuentes */
  const FUENTES = {
    acopla: { t: 'Estrada, J., Camacho, J. A., Restrepo, M. T. y Parra, C. M. (1998). Parámetros antropométricos de la población laboral colombiana 1995 (Acopla95). Revista Facultad Nacional de Salud Pública, 15(2), 112–139. Universidad de Antioquia.', u: 'https://dialnet.unirioja.es/descarga/articulo/5079552.pdf', d: 'Tablas 3 (mujeres) y 4 (hombres), población laboral de 20 a 59 años; 785 mujeres y 1.315 hombres. Medidas sin ropa ni calzado.', tipo: 'fuente' },
    ntc4140: { t: 'ICONTEC (2005). NTC 4140, primera actualización. Accesibilidad de las personas al medio físico. Edificios, pasillos y corredores. Características generales.', u: 'https://curaduria1soacha.com/wp-content/uploads/2022/08/cu1soa-ntc-4140-pasillo-corrd.pdf', d: 'Numeral 3.1 (anchos) y 3.2.3–3.2.4 (objetos que sobresalen).', tipo: 'fuente' },
    nsr10k: { t: 'AIS y MAVDT (2010). NSR-10, Reglamento Colombiano de Construcción Sismo Resistente. Título K: Requisitos complementarios.', u: 'https://www.findeter.gov.co/system/files/convocatorias/PAF-JU-O-072-2017/PAF-JU-O-072-2017@Nsr-10_Titulo_K.pdf', d: 'K.3.3.4 (acceso a salidas), K.3.8.2.1 (puertas), tablas K.3.3-1 y K.3.3-2 (ocupación y ancho de salida).', tipo: 'fuente' },
    nsr10k4: { t: 'NSR-10, Título K, capítulo K.4: Requisitos especiales para vidrios, productos de vidrio y sistemas vidriados (numeral K.4.3.9, impacto humano).', u: 'https://1library.co/article/k-consideraciones-efectos-s%C3%ADsmicos-uso-elementos-sistemas-vidriados.zx3n64vz', d: 'Texto leído en una reproducción del capítulo; falta cotejarlo con el PDF oficial.', tipo: 'secundaria' },
    d1538: { t: 'Presidencia de la República (2005). Decreto 1538 de 2005, por el cual se reglamenta parcialmente la Ley 361 de 1997 (compilado en el Decreto 1077 de 2015, art. 2.2.3.4.2.1).', u: 'https://normas.cra.gov.co/Gestor/Docs/decreto_1538_2005.htm', d: 'Artículo 9: mobiliario de recepción fuera de la circulación (D.1) y franjas en puertas de vidrio (C.4).', tipo: 'fuente' },
    retie: { t: 'Ministerio de Minas y Energía (2026). Resolución 40284 del 23 de junio de 2026, Reglamento Técnico de Instalaciones Eléctricas, RETIE.', u: 'https://www.minenergia.gov.co/documents/15921/Libro-3-Resolucion-40284-23-06-2026.pdf', d: 'Libro 3, art. 3.1.1 (alcance) y 3.1.1.3 (exclusión de muy baja tensión, que no aplica a sitios donde se concentran personas).', tipo: 'fuente' },
    ccohs: { t: 'CCOHS, Canadian Centre for Occupational Health and Safety (2022). Working in a Standing Position – Basic Information. OSH Answers.', u: 'https://www.ccohs.ca/oshanswers/ergonomics/standing/standing_basic.html', d: 'Altura de trabajo de pie respecto al codo: precisión unos 5 cm encima; trabajo ligero 5–10 cm debajo; pesado 20–40 cm debajo.', tipo: 'fuente' },
    ntp242: { t: 'INSHT (1990). NTP 242: Ergonomía. Análisis ergonómico de los espacios de trabajo en oficinas. R. Chavarría Cosar.', u: 'https://www.insst.es/documentacion/colecciones-tecnicas/ntp-notas-tecnicas-de-prevencion/7-serie-ntp-numeros-226-a-260-ano-1990/ntp-242-ergonomia-analisis-ergonomico-de-los-espacios-de-trabajo-en-oficinas', d: 'Mesa de trabajo sentado: unos 700 mm si es fija; 680–700 mm si es regulable.', tipo: 'fuente' },
    nicolas: { t: 'Nicolás, M. Á. (2011). Merchandising del distribuidor en el punto de venta. Agricultura (Editorial Agrícola Española), 946, 754–755.', u: 'https://www.mapa.gob.es/ministerio/pags/Biblioteca/Revistas/pdf_Agri/Agri_2011_946_754_755.pdf', d: 'Niveles de exhibición: suelo < 0.50 m; manos 0.50–0.80 m; ojos 0.80–1.70 m; cabeza > 1.70 m. El artículo no dice de dónde salen.', tipo: 'fuente' },
    ntc6047: { t: 'ICONTEC (2013). NTC 6047. Accesibilidad al medio físico. Espacios de servicio al ciudadano en la administración pública. Citada en la lista de verificación del Ministerio de Vivienda.', u: 'https://minvivienda.gov.co/sites/default/files/documentos/resultados_ntc-6047.pdf', d: 'Mostrador de 0.74 a 0.80 m con 0.70 m libres para las rodillas. Es para la administración pública: aquí se usa como referencia.', tipo: 'secundaria' },
    ada: { t: 'U.S. Access Board (2010). 2010 ADA Standards for Accessible Design, §308 Reach ranges.', u: 'https://www.access-board.gov/ada/guides/chapter-3-operable-parts/', d: 'Alcance sin obstrucción entre 15 y 48 pulgadas (380 a 1220 mm). Norma de Estados Unidos: solo referencia.', tipo: 'fuente' },
    plano: { t: 'BlackForge (9 de octubre de 2026). Planta de distribución y mobiliario del local, y documento «Taller Impresión 3D — Mobiliario, materiales y fabricación».', u: '', d: 'Documento del proyecto: medidas del local, programa, equipos y lista de mobiliario.', tipo: 'encargo' },
    catalogo: { t: 'Catálogos en línea de Madecentro, Homecenter, Vistronica, Asia Colombia, Sign Colombia, El Ruso Shop y Electronilab (consultados entre el 9 y el 16 de octubre de 2026).', u: '', d: 'Formato comercial y precio de cada material; el enlace de cada uno está en la tabla de materiales.', tipo: 'fuente' },
    fichaP1S: { t: 'Bambu Lab. P1S Combo, especificaciones; makeR, distribuidor en Colombia.', u: 'https://somosmaker.com/producto/bambu-lab-p1s-combo-ams/', d: '389 × 389 × 458 mm y 12.95 kg por impresora (dato del documento del proyecto).', tipo: 'fuente' },
    criterio: { t: 'Criterio de diseño del grupo, escrito antes de dibujar (requisitos generales del visor).', u: '', d: 'Decisión de diseño: imagen de marca, uso de la luz y del material. No es una norma.', tipo: 'encargo' }
  };

  /* ------------------------------------------------------ antropometría
     Acopla95, P5 de mujeres y P95 de hombres, en cm (los dos extremos de la población a la que se diseña) */
  const ANTRO = {
    estatura: { t: 'Estatura', p5: 146.7, p50m: 155.6, p50h: 168.6, p95: 179.3, v: 2 },
    ojos: { t: 'Altura de los ojos de pie', p5: 136.2, p50m: 145.1, p50h: 157.9, p95: 168.4, v: 5 },
    codo: { t: 'Altura del codo de pie', p5: 91.4, p50m: 97.8, p50h: 106.5, p95: 114.3, v: 12 },
    alcanceV: { t: 'Alcance vertical máximo de asimiento', p5: 169.6, p50m: 181.5, p50h: 198.3, p95: 213.2, v: 4 },
    alcanceF: { t: 'Alcance frontal de asimiento', p5: 61.0, p50m: 65.6, p50h: 71.4, p95: 77.2, v: 38 },
    poplitea: { t: 'Altura poplítea (sentado)', p5: 35.1, p50m: 38.3, p50h: 42.4, p95: 46.2, v: 18 },
    codoS: { t: 'Altura del codo sentado, sobre el asiento', p5: 19.0, p50m: 23.1, p50h: 23.8, p95: 27.8, v: 15 },
    muslo: { t: 'Espesor del muslo sentado', p5: 12.1, p50m: 14.1, p50h: 15.0, p95: 17.1, v: 16 },
    hombros: { t: 'Anchura bideltoidea (máxima de hombros)', p5: 37.5, p50m: 42.1, p50h: 46.1, p95: 50.9, v: 22 },
    nalgaRod: { t: 'Largo nalga-rodilla', p5: 51.0, p50m: 55.0, p50h: 57.0, p95: 61.3, v: 42 }
  };

  /* ------------------------------------------------------ A · ficha del proyecto */
  const FICHA = {
    nombre: 'BlackForge · Local de exhibición y taller de impresión 3D',
    tipo: 'Local comercial: tienda-taller de impresión 3D (venta de impresoras, filamento y piezas impresas, con impresión a la vista)',
    encargo: 'Encargo adaptado: en lugar de un apartamento de Constructora Bolívar, el grupo diseña el mobiliario de un local comercial, con autorización del director del curso (adjuntar la constancia en la carpeta del grupo).',
    ubicacion: 'Local en un centro comercial: nombre del centro comercial por confirmar',
    ciudad: 'Por confirmar',
    area: '42.00 m² (6.00 × 7.00 m): sala de ventas de 6.00 × 5.50 m, mampara de 0.10 m y trastienda de 6.00 × 1.40 m',
    fachada: 'Vano de acceso de 4.80 m entre dos pilares de 0.60 m (en los pilares, dos pantallas de 55")',
    fuentePlano: 'Planta de distribución y mobiliario y documento del proyecto, 9 de octubre de 2026',
    consulta: '17 de octubre de 2026',
    enlace: 'https://blackmkount.github.io/local-3d/',
    repositorio: 'https://github.com/Blackmkount/local-3d',
    espacios: [
      { id: 'exhibicion', t: 'Exhibición', d: 'Muros y centro de la sala de ventas: el producto impreso a la vista.', n: [2, 3, 4, 12, 13] },
      { id: 'atencion', t: 'Atención y diseño', d: 'Donde el cliente se sienta con el asesor a diseñar su pieza.', n: [5] },
      { id: 'taller', t: 'Taller de impresión', d: 'Impresoras, filamento, repuestos y herramientas, a la vista del público.', n: [7, 9, 10, 11] },
      { id: 'trastienda', t: 'Trastienda', d: 'Separada por la mampara: puesto de trabajo y bodega.', n: [15, 17] }
    ],
    ia: 'Herramienta de inteligencia artificial: Claude (Anthropic). Se usó para modelar el local y los muebles en 3D, generar los planos desde el modelo, calcular despieces y costos, buscar normas, fichas y precios, y redactar. Cada integrante del grupo revisa cada decisión y debe poder explicarla en la mesa de revisión (guía, numeral 4.3).'
  };

  /* ------------------------------------------------------ B · referencia de escalado */
  const ESCALADO = {
    texto: 'El plano del proyecto no trae cotas completas: se escaló con dos referencias, como pide la guía.',
    refs: [
      { t: 'Frente del local: 6.00 m', d: 'Medida declarada en el documento del proyecto; es la que fija la escala de la imagen.', tipo: 'encargo', f: 'plano' },
      { t: 'Área del local: 42 m² (6.00 × 7.00 m)', d: 'Con el frente de 6.00 m, el fondo medido en la imagen da 7.00 m: coincide con el área declarada.', tipo: 'encargo', f: 'plano' },
      { t: 'Puerta de la trastienda: 0.90 m', d: 'Medida estándar de puerta; la NSR-10 pide al menos 0.80 m libres (K.3.8.2.1). Sirve para verificar la escala en el fondo del local.', tipo: 'fuente', f: 'nsr10k' }
    ],
    nota: 'Las demás medidas (pilares de 0.60 m, vano de 4.80 m, trastienda de 1.40 m) salen de medir la imagen a esa escala: son estimadas y se verifican en sitio antes de cortar.'
  };

  /* ------------------------------------------------------ C · requisitos
     Para cada mueble: quién lo usa, para qué, cuánto espacio necesita alrededor y qué medidas del cuerpo
     lo condicionan. src: una fuente por cada requisito de versions.js (REQ[n]), en el mismo orden. */
  const R = (f, d, tipo) => ({ f, d, tipo: tipo || (FUENTES[f] ? FUENTES[f].tipo : 'estimado') });
  const MUEBLES = {
    2: {
      espacio: 'exhibicion', usuario: 'Cliente de pie que mira y toma producto; vendedor que repone.', uso: 'Exhibir el producto impreso contra el muro y guardar repuestos abajo.',
      entorno: 'Frente libre de al menos 1.00 m (paso del público) más el fondo del mueble.',
      medidas: [['alcanceV', 'El entrepaño más alto que se alcanza sin escalera queda bajo 1.70 m (P5 de mujeres: 169.6 cm). Más arriba, el producto es de exhibición.'], ['ojos', 'La franja de mayor venta va entre 1.36 y 1.68 m: de los ojos del P5 de mujeres a los del P95 de hombres.'], ['alcanceF', 'Fondo de entrepaño de 0.35–0.40 m: menor que el alcance frontal del P5 de mujeres (61 cm).']],
      src: [R('nicolas', 'Niveles de exhibición 0.50–1.70 m y alcance vertical del P5 de mujeres, 169.6 cm (Acopla95). Por encima de 1.70 m el producto se ve pero no se alcanza.'), R('criterio', 'Luz cálida de 3000 K, igual a la luz general del local.'), R(null, 'Carga supuesta de unos 15 kg por entrepaño de producto impreso. Se verifica con un ensayo de carga.', 'estimado'), R('criterio', 'Mueble de 2.40 m de alto: se ancla para que no se vuelque. No se encontró una norma colombiana para estabilidad de muebles.'), R('plano', 'El programa pide guardar repuestos y filamento en la sala.')]
    },
    3: {
      espacio: 'exhibicion', usuario: 'Clientes que rodean el mueble; vendedor que muestra una pieza.', uso: 'Exhibir producto en el centro de la sala, visible por todos los lados.',
      entorno: 'Paso libre alrededor: 1.20 m en la ruta accesible (NTC 4140) y 1.00 m en los pasos secundarios.',
      medidas: [['codo', 'Superficie de 0.90–0.95 m: entre 5 y 10 cm bajo el codo del P50 de mujeres (97.8 cm), altura de trabajo ligero de pie (CCOHS).'], ['alcanceF', 'Desde cualquier lado se alcanza la mitad de la superficie: 0.55 m frente a 61 cm de alcance del P5 de mujeres.']],
      src: [R('plano', 'Isla central del plano de distribución.'), R('criterio', 'Esquinas redondeadas o canto suave en la zona de circulación.'), R('criterio', 'Superficie de roce diario: melamina, laminado o laca con canto sellado.'), R('criterio', 'Luz rasante bajo el zócalo (imagen de marca).'), R('plano', 'Vano de acceso de 4.80 m medido en la imagen del local.', 'estimado'), R('retie', 'Toma y fuente accesibles para revisión (RETIE, alcance general). El requisito puntual de iluminación LED no se pudo leer.')]
    },
    4: {
      espacio: 'exhibicion', usuario: 'Cliente que entra; vendedor que cambia la pieza destacada.', uso: 'Destacar pocas piezas, aparte del producto general.',
      entorno: 'Al costado de la ruta de entrada, sin invadir el acceso libre de 1.25 m.',
      medidas: [['ojos', 'La superficie queda entre 0.80 m (C) y 1.42 m (A), según la versión: en las franjas de las manos y de los ojos (0.50–1.70 m, Nicolás 2011) y bajo la mirada del P5 de mujeres (136 cm).']],
      src: [R('criterio', 'Pieza del día o lanzamiento: lo pide la estrategia de exhibición del grupo.'), R('criterio', 'Mismos materiales que el resto de la versión.'), R('criterio', 'Sin aristas vivas junto a la entrada.'), R('criterio', 'Cableado oculto por dentro del mueble.')]
    },
    5: {
      espacio: 'atencion', usuario: 'Asesor de pie y hasta cuatro clientes en taburete de 78 cm.', uso: 'Atender, diseñar la pieza con el cliente y cobrar.',
      entorno: 'Detrás de los taburetes, 1.00 m libre; el área del mueble va aparte de la circulación (Decreto 1538, art. 9, D.1).',
      medidas: [['codo', 'Tapa a 1.05 m: a la altura del codo de pie del P50 de hombres (106.5 cm) y 7 cm sobre el del P50 de mujeres (97.8 cm), altura para escribir de pie (CCOHS).'], ['codoS', 'Sentado en un taburete de 78 cm, el codo queda entre 0.97 y 1.06 m (19.0–27.8 cm sobre el asiento): la tapa de 1.05 m queda a la altura del codo.'], ['muslo', 'Quedan 27 cm entre el asiento y la tapa, más que el muslo del P95 de hombres (17.1 cm).'], ['poplitea', 'Con el asiento a 78 cm, el pie del P95 de hombres llega a 0.32 m (78 − 46.2): el reposapiés va a 0.30 m.']],
      src: [R('plano', 'Mesa de atención con cuatro taburetes del plano.'), R('acopla', 'Muslo sentado P95 de hombres 17.1 cm y codo sentado 19.0–27.8 cm (Acopla95): 27 cm libres bastan.'), R('acopla', 'Largo nalga-rodilla P95 de hombres 61.3 cm: sin patas ni faldón en los primeros 0.30 m bajo la tapa.'), R('acopla', 'Altura poplítea P95 de hombres 46.2 cm con asiento a 78 cm.'), R('criterio', 'Golpes de los taburetes contra el frente.')]
    },
    7: {
      espacio: 'taller', usuario: 'Operario de pie que carga filamento, retira piezas y limpia las impresoras.', uso: 'Sostener las cuatro impresoras Bambu Lab P1S con su unidad AMS y guardar filamento y repuestos.',
      entorno: 'Frente de trabajo de 0.70 m como mínimo para el operario (paso de servicio).',
      medidas: [['codo', 'Superficie a 0.90 m: 5–10 cm bajo el codo del P50 de mujeres (97.8 cm), trabajo ligero de pie (CCOHS).'], ['alcanceV', 'La tapa de la unidad AMS queda a unos 1.55 m: dentro del alcance del P5 de mujeres (169.6 cm).']],
      src: [R('fichaP1S', 'Cuatro impresoras de 389 mm de ancho: un módulo de 0.80 m por impresora.'), R('fichaP1S', '12.95 kg por impresora en movimiento: tapa de 30 mm o más.'), R('ccohs', 'Trabajo ligero de pie: 5–10 cm bajo el codo.'), R('criterio', 'Un pasacable por equipo, sin cables sobre la tapa.'), R('plano', 'Filamento y repuestos junto a las impresoras.')]
    },
    9: {
      espacio: 'taller', usuario: 'Operario que toma y cambia carretes; cliente que los ve.', uso: 'Mostrar el filamento en venta cerca de las impresoras.',
      entorno: 'Sobre las impresoras, sin tapar la unidad AMS ni la cámara.',
      medidas: [['alcanceV', 'El P5 de mujeres alcanza hasta 1.70 m. La repisa de A (1.95 y 2.30 m) y la de B (1.75 m) quedan más altas: el carrete se baja con escalera de un peldaño. La de C (1.60–1.85 m) se alcanza en su riel bajo.']],
      src: [R('plano', 'Carretes de 1 kg a la vista, junto a las impresoras.'), R('fichaP1S', 'Impresora de 458 mm de alto con AMS encima.'), R('criterio', 'El color de los carretes es la exhibición.'), R('criterio', 'Anclaje a muro o losa, según la versión.')]
    },
    10: {
      espacio: 'taller', usuario: 'Operario que empaca y busca repuestos.', uso: 'Guardar repuestos y herramientas y servir de mesa de empaque.',
      entorno: 'Paso de servicio de 0.70 m delante de los cajones, más lo que sale el cajón (0.45 m).',
      medidas: [['codo', 'Tapa a 0.90 m para empacar de pie (trabajo ligero, CCOHS).'], ['alcanceF', 'Riel de extensión total de 45 cm: el fondo del cajón queda dentro del alcance frontal del P5 de mujeres (61 cm).']],
      src: [R('plano', 'Mueble bajo de unos 3 m del plano.'), R('ccohs', 'Cajón que sale completo: se alcanza el fondo sin agacharse ni estirarse.'), R('ccohs', 'Tapa de trabajo a la altura de trabajo ligero de pie.'), R('plano', 'Muchos compartimentos para repuestos pequeños.')]
    },
    11: {
      espacio: 'taller', usuario: 'Operario que cuelga y toma herramientas, accesorios y carretes.', uso: 'Tener a la vista y a la mano las herramientas del taller.',
      entorno: 'Sobre el mueble bajo: se usa por encima de su tapa de 0.90 m.',
      medidas: [['alcanceV', 'Lo que más se usa va bajo 1.70 m (P5 de mujeres). La fila de arriba del panel (hasta 2.10 m) es para lo que se usa poco.'], ['alcanceF', 'Sobre una tapa de 0.50 m de fondo, el panel queda a 50 cm: dentro del alcance frontal del P5 de mujeres (61 cm).']],
      src: [R('plano', 'Panel de unos 2 m² sobre el guardado bajo.'), R(null, 'Carrete de 1 kg más su soporte, unos 1.3 kg por gancho.', 'estimado'), R('criterio', 'Accesorios que se cambian de lugar sin herramientas.'), R('criterio', 'Separación del muro para que entre el gancho.')]
    },
    12: {
      espacio: 'exhibicion', usuario: 'Cliente que mira piezas pequeñas.', uso: 'Proteger del polvo y de las manos piezas pequeñas o delicadas.',
      entorno: 'Colgada en el muro sobre un paso de 1.00 m: sobresale 0.15 m, como máximo lo que permite la NTC 4140 (3.2.4) para objetos bajo 2.05 m.',
      medidas: [['ojos', 'De 1.05 a 2.25 m: los entrepaños centrales quedan a la altura de los ojos (1.36–1.68 m).']],
      src: [R('plano', 'Vitrina vertical mural del plano.'), R('criterio', 'Producto delicado detrás de un frente.'), R('criterio', 'Luz interior.'), R('ntc4140', 'Sobresale 0.15 m del muro: el máximo que la norma deja sin señalizar (num. 3.2.4).')]
    },
    13: {
      espacio: 'exhibicion', usuario: 'Persona que pasa por el pasillo del centro comercial; cliente que entra.', uso: 'Lo primero que se ve desde el pasillo: producto alto e iluminado junto a la entrada.',
      entorno: 'Junto al acceso libre de 1.25 m, sin invadirlo.',
      medidas: [['ojos', 'Producto principal entre 1.36 y 1.68 m.'], ['alcanceV', 'Entrepaños de alcance bajo 1.70 m; por encima, exhibición.']],
      src: [R('plano', 'Estantería alta junto a la entrada.'), R('nicolas', 'Exhibición alta: el nivel de la cabeza (> 1.70 m) atrae la vista desde lejos.'), R('criterio', 'Luz sobre el producto sin puntos visibles.'), R('criterio', 'Mueble de 2.40 m anclado al muro.'), R(null, 'Carga supuesta de 15 kg por entrepaño.', 'estimado')]
    },
    15: {
      espacio: 'trastienda', usuario: 'Personal que entra y sale de la trastienda.', uso: 'Separar la trastienda de la sala dejando pasar la luz.',
      entorno: 'Vano de 2.10 × 2.40 m; trastienda de 1.40 m de fondo.',
      medidas: [['hombros', 'Puerta de 0.88–0.92 m: más que la anchura de hombros del P95 de hombres (50.9 cm) con carga en las manos, y más que los 0.80 m libres de la NSR-10.']],
      src: [R('plano', 'Vano de la trastienda del plano.'), R('nsr10k4', 'Puertas con vidrio de seguridad, templado o laminado (K.4.3.9.2.1).'), R('nsr10k', 'Puerta de salida con al menos 0.80 m libres (K.3.8.2.1).'), R('nsr10k4', 'Banda de visibilidad de más de 20 mm con el borde superior a 0.70 m o más y el inferior a 1.00 m o menos (K.4.3.9.1.2); franjas anaranjadas o blanco fluorescente en puertas de vidrio (Decreto 1538, art. 9, C.4).'), R('criterio', 'La trastienda no tiene ventanas.')]
    },
    17: {
      espacio: 'trastienda', usuario: 'Diseñador sentado frente al computador.', uso: 'Preparar archivos de impresión, cotizar y administrar.',
      entorno: 'Silla con 0.70 m detrás del escritorio en la trastienda de 1.40 m.',
      medidas: [['poplitea', 'Bajo la tapa hacen falta unos 63 cm (poplítea 46.2 + muslo 17.1 cm del P95 de hombres): la tapa de 0.75 m deja 0.72 m libres.'], ['codoS', 'Con una silla regulable, el codo queda a la altura de la tapa (NTP 242: unos 0.70 m).']],
      src: [R('plano', 'Escritorio de 1.20 × 0.60 m en la trastienda.'), R('ntp242', 'Mesa de oficina de unos 0.70 m; se usa 0.75 m con silla regulable: estimado del grupo.'), R('criterio', 'Pasacable para el computador.'), R('criterio', 'El cliente no lo ve: se elige el material más económico.')]
    }
  };

  /* requisitos que salieron de revisar las normas (no estaban en el documento del proyecto) y cómo los cumple cada versión */
  const NORMAS = [
    { t: 'Ruta accesible de 1.20 m desde el acceso hasta la atención', f: 'ntc4140', d: 'Pasillos y corredores de uso público: 1.20 m mínimo (NTC 4140, num. 3.1).',
      v: { A: ['parcial', 'Acceso de 1.25 m y eje derecho de 1.80 m; los pasos entre barra y mesa son de 1.00 m'], B: ['si', 'Recorrido en U con pasos de 1.50 a 2.21 m'], C: ['si', 'Paso principal de 2.00 m'] } },
    { t: 'Acceso a la salida de 0.90 m o más', f: 'nsr10k', d: 'NSR-10, K.3.3.4. Ocupación: 3 m² por persona (tabla K.3.3-1), unas 14 personas en 42 m²; el ancho de salida exigido (5 mm por persona) lo cubre de sobra el vano de 4.80 m.',
      v: { A: ['si', 'Pasos públicos de 1.00 m o más'], B: ['si', 'Pasos públicos de 1.04 m o más'], C: ['si', 'Pasos públicos de 1.00 m o más'] } },
    { t: 'Mostrador con un tramo accesible de 0.74–0.80 m', f: 'ntc6047', d: 'Referencia de la NTC 6047 (administración pública). Para una persona en silla de ruedas.',
      v: { A: ['no', 'Toda la barra está a 1.05 m'], B: ['no', 'Toda la barra está a 1.05 m'], C: ['no', 'Toda la mesa está a 1.05 m'] } },
    { t: 'Banda de visibilidad en la mampara entre 0.70 y 1.00 m', f: 'nsr10k4', d: 'K.4.3.9.1.2 y Decreto 1538, art. 9, C.4 (franjas anaranjadas o blanco fluorescente en puertas de vidrio).',
      v: { A: ['parcial', 'El travesaño de acero a 0.80 m cumple la banda; falta la franja de color en la puerta'], B: ['no', 'La franja de opal está a la altura de los ojos, no entre 0.70 y 1.00 m'], C: ['si', 'Paños de acrílico opaco: no es vidrio'] } },
    { t: 'Objetos colgados que sobresalgan 0.15 m o menos bajo 2.05 m', f: 'ntc4140', d: 'NTC 4140, num. 3.2.4: más que eso, se señalizan o bajan hasta el piso.',
      v: { A: ['si', 'Vitrina mural de 0.15 m; repisa de carretes sobre la vitrina'], B: ['si', 'Vitrina de nicho embutida'], C: ['si', 'Vitrina mural de 0.15 m'] } },
    { t: 'Instalación de LED de 12 V dentro del RETIE', f: 'retie', d: 'Un local donde se concentran personas no queda excluido por ser de muy baja tensión (Libro 3, art. 3.1.1.3, lit. c): fuentes certificadas, accesibles y protegidas.',
      v: { A: ['si', 'Fuentes dentro de gabinetes con acceso'], B: ['si', 'Fuentes dentro de gabinetes con acceso'], C: ['si', 'Fuentes dentro de gabinetes con acceso'] } }
  ];

  /* ------------------------------------------------------ D · matriz de selección
     Seis criterios con su peso. Cada puntaje (1 a 5) se calcula con los datos del propio mueble, salvo
     durabilidad, que sale de la tabla DURA (criterio del grupo, escrito). */
  const CRITERIOS = [
    { id: 'req', t: 'Cumple los requisitos', peso: 25, d: 'Requisitos del mueble que cumple: 1 por cada uno que cumple, 0.5 si cumple con salvedad. Puntaje = 5 × cumplidos ÷ total.' },
    { id: 'costo', t: 'Costo de materiales', peso: 20, d: 'Costo calculado con los precios de catálogo. Puntaje = 5 × costo de la más económica ÷ costo de esta.' },
    { id: 'fab', t: 'Facilidad de fabricación', peso: 20, d: 'Oficios que intervienen y número de piezas del despiece. Puntaje = 5 × (mitad por oficios + mitad por piezas, frente a la que menos tiene).' },
    { id: 'dura', t: 'Durabilidad y mantenimiento', peso: 15, d: 'Del material de la superficie que más se toca, según la tabla de durabilidad (criterio del grupo).' },
    { id: 'mont', t: 'Montaje en el local', peso: 10, d: 'Pasos de ensamble en sitio. Puntaje = 5 × pasos de la que menos tiene ÷ pasos de esta.' },
    { id: 'marca', t: 'Coherencia con la idea de la versión', peso: 10, d: 'Qué tanto el mueble cuenta lo que hace el taller (criterio del grupo, de 1 a 5).' }
  ];
  /* durabilidad de la superficie de uso, de 1 a 5 (criterio del grupo) */
  const DURA = {
    rovere15: [4, 'Melamina: resiste rayado y humedad; el canto PVC se puede cambiar'], blanca15: [4, 'Melamina blanca: igual que la Rovere; las huellas se notan más'], fondo6: [3, 'Fondo de 6 mm: solo cierra'],
    mdf15: [3, 'MDF lacado: se marca con los golpes y hay que retocarlo'], mdf55: [3, 'Piel de MDF lacado: se marca con los golpes'], hpl: [5, 'Laminado de alta presión: el que mejor aguanta rayado y calor'],
    perforada: [4, 'Acero perforado pintado: aguanta, se retoca con pintura'], tubo1: [4, 'Acero pintado: se retoca con anticorrosivo'], tubo15: [4, 'Acero pintado: se retoca con anticorrosivo'], tuboRect: [4, 'Acero pintado: se retoca con anticorrosivo'],
    perfil3030: [5, 'Aluminio anodizado: no se oxida; se raya pero no se rompe'], pvc10: [2, 'PVC espumado: se abolla y se marca'], pvc5: [2, 'PVC espumado: se abolla y se marca'],
    acril3: [2, 'Acrílico: se raya con la limpieza'], opal3: [3, 'Acrílico opal: se raya, pero no deja ver la marca'], vidrio10: [5, 'Vidrio templado: no se raya con la limpieza'], vidrio6: [5, 'Vidrio templado: no se raya con la limpieza'],
    petg: [3, 'PETG impreso: resiste golpes; se reimprime en el taller']
  };
  /* coherencia de cada versión con su idea (criterio del grupo) */
  const MARCA = {
    A: [5, 'Estructuras de taller: el mueble se lee como banco de trabajo, igual que la vitrina de impresión'],
    B: [4, 'Galería blanca: el mueble se retira y deja al producto como obra; dice menos del taller'],
    C: [5, 'Perfil de impresora y piezas impresas: el mueble es producto del taller']
  };

  /* lista de chequeo de la guía (numeral 10, Nota 1) */
  const CHECK = [
    { t: 'Ficha del proyecto con enlace y fecha', s: 'A' },
    { t: 'Plano de los espacios a escala, con la referencia declarada', s: 'B' },
    { t: 'Requisitos de cada mueble con su fuente', s: 'C' },
    { t: 'Tres alternativas por mueble y matriz de selección', s: 'D' },
    { t: 'Planos de conjunto y de pieza con cortes, cotas y escala', s: 'E' },
    { t: 'Despiece y lista de materiales, con herrajes y tornillería', s: 'F' },
    { t: 'Dos materiales por mueble como mínimo, tres en el conjunto', s: 'G' },
    { t: 'Detalle de cada unión entre materiales distintos', s: 'G' },
    { t: 'Fichas de la luminaria y del equipo; alojamiento y cableado', s: 'H' },
    { t: 'Renders de cada mueble en su espacio', s: 'I' }
  ];

  L.nota1 = { fuentes: FUENTES, antro: ANTRO, ficha: FICHA, escalado: ESCALADO, muebles: MUEBLES, normas: NORMAS, criterios: CRITERIOS, dura: DURA, marca: MARCA, check: CHECK, fecha: '17 de octubre de 2026', fechaCorta: '17 oct. 2026' };
})();
