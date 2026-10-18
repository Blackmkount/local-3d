/* ============================================================================
   NOTA 2 · SISTEMA DE PRODUCCIÓN — datos de la planta que fabrica el mobiliario
   (guía «Del mueble a la planta», numerales 5 y 6, ítems 1 a 17).

   La empresa fabrica los juegos de mobiliario de la versión B · Galería para una
   cadena de doce locales. Cada dato dice de dónde sale: fuente, estimado (y cómo)
   o no obtenido, igual que en la Nota 1.
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});

  /* ------------------------------------------------------------ J · la empresa */
  const EMPRESA = {
    nombre: 'BlackForge Muebles · planta de mobiliario comercial',
    que: 'Fabrica el juego de mobiliario de cada local de la cadena BlackForge: los doce muebles de la versión B · Galería (MDF lacado blanco, tapas de Rovere, luz LED integrada).',
    para: 'Para la cadena de tiendas-taller de impresión 3D BlackForge, que abre un local por mes en centros comerciales del país.',
    modo: 'Contra pedido: cada juego se fabrica para un local con fecha de apertura, sin inventario de producto terminado. El diseño es el mismo en los doce locales; solo se verifican medidas en sitio.',
    direccion: 'Carrera 11 N.º 3-36, Villanueva, Casanare',
    alcance: 'La planta corta, mecaniza, curva, laca, arma en premontaje, integra la iluminación, inspecciona y empaca. El vidrio templado, el tubo del reposapiés y los herrajes se compran. La instalación en el local la hace la misma cuadrilla, pero queda fuera del sistema productivo de la planta.',
    noHace: 'No vende, no hace publicidad ni fija precios (guía, numeral 1).'
  };

  /* ------------------------------------------------------------ K · L · volumen, plazo y jornada */
  const VOLUMEN = {
    juegos: 12, version: 'B',
    calculo: 'La cadena abre un local por mes durante un año: 12 locales × 1 juego por local = 12 juegos.',
    tipo: 'estimado',
    fuente: 'Plan de aperturas de la cadena, supuesto por el grupo con el cliente (no hay un dato publicado). Se marca como estimado, como pide la guía (elemento K).',
    plazoInicio: '2027-01-04', plazoFin: '2027-12-31',
    plazoTxt: 'Enero a diciembre de 2027: un juego terminado y empacado al final de cada mes, antes de la apertura del local.',
    entregas: 'Un juego por mes (lote de 1 juego): 12 entregas.',
    // jornada (Ley 2101 de 2021: reducción gradual; desde el 15 de julio de 2026, 42 horas semanales)
    horasSemana: 42, diasSemana: 5,
    jornadaTxt: '42 horas semanales, de lunes a viernes, 8.4 horas por día, un turno.',
    jornadaFuente: 'Ley 2101 de 2021, artículo 3: la jornada máxima baja a 42 horas semanales desde el 15 de julio de 2026.'
  };

  /* ------------------------------------------------------------ 2 · hipótesis de producción
     Escrita el 17 de octubre de 2026 a las 19:40, ANTES de calcular los tiempos (guía, ítem 2). No se edita. */
  const HIPOTESIS = {
    fecha: '17 de octubre de 2026, 19:40',
    texto: 'La operación que va a limitar la planta es el lacado: cada pieza de MDF lleva sellador, lijado y dos manos de laca, con secado entre manos, y todo pasa por una sola cabina. El corte y el armado son rápidos frente a eso.',
    porque: 'La versión B tiene unos 87 m² de superficie lacada por juego (dos manos: 174 m² × mano), casi todas las piezas son de MDF lacado y el secado no se puede acelerar sin horno.'
  };

  /* ------------------------------------------------------------ O · matriz de procesos y productos (Chase et al., 2009, cap. 7) */
  const PROCESOS = [
    { id: 'proyecto', t: 'Por proyecto', d: 'Un producto único que se hace en su sitio.', vol: 'Una unidad', est: 'Ninguna' },
    { id: 'taller', t: 'Centro de trabajo (taller)', d: 'Máquinas agrupadas por función; cada pedido sigue su ruta.', vol: 'Bajo', est: 'Baja: muchos productos distintos' },
    { id: 'lotes', t: 'Por lotes', d: 'Lotes repetidos del mismo producto que pasan juntos por las estaciones.', vol: 'Bajo a medio', est: 'Media: pocos productos que se repiten' },
    { id: 'linea', t: 'Línea de ensamble', d: 'Estaciones en secuencia fija con un ritmo para cada una.', vol: 'Alto', est: 'Alta: un producto estándar' },
    { id: 'continuo', t: 'Flujo continuo', d: 'Material que fluye sin parar (químicos, papel).', vol: 'Muy alto', est: 'Muy alta: un commodity' }
  ];

  const FUENTES2 = {
    ley2101: { t: 'Congreso de Colombia (2021). Ley 2101 del 15 de julio de 2021, por medio de la cual se reduce la jornada laboral semanal de manera gradual.', u: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=166286' },
    chase: { t: 'Chase, R. B., Jacobs, F. R. y Aquilano, N. J. (2009). Administración de operaciones. Producción y cadena de suministros, 12.ª ed. McGraw-Hill.', u: '' },
    kanawaty: { t: 'Kanawaty, G. (dir.) (1996). Introducción al estudio del trabajo, 4.ª ed. rev. Ginebra: OIT.', u: '' },
    gtc45: { t: 'ICONTEC (2012). GTC 45, Guía para la identificación de los peligros y la valoración de los riesgos en seguridad y salud ocupacional, 2.ª actualización.', u: '' },
    nava: { t: 'Nava-Martínez, I. y otros (2017). Metodología de la aplicación 5S. Revista de Investigaciones Sociales, 3(8), 29–41.', u: '' },
    tague: { t: 'Tague, N. R. The Quality Toolbox. ASQ Quality Press (hoja de verificación, p. 140).', u: '' },
    iso6385: { t: 'NTP-ISO 6385:2023. Principios ergonómicos en el diseño de sistemas de trabajo.', u: '' },
    pintuco: { t: 'Pintuco (2020). Ficha técnica: Laca catalizada al ácido y Sellador/Base catalizado al ácido, línea Madetec, v.2.', u: 'https://www.pintuco.com.co/wp-content/uploads/2020/01/madetec-Laca-catalizada-al-acido.pdf' },
    epf: { t: 'European Panel Federation. MDF: sawing (velocidad de corte y avance en MDF).', u: 'https://mdf-info.eu/using-mdf/processing/sawing' },
    uis: { t: 'Enard González, L. A. (2010). Mejoramiento del sistema productivo de la empresa Arte y Confort. Universidad Industrial de Santander.', u: 'https://noesis.uis.edu.co/bitstreams/2a66278b-9960-4be3-a291-40eae85d5685/download' },
    osha: { t: 'OSHA 29 CFR 1910.107, Spray finishing using flammable and combustible materials (norma de EE. UU., como referencia).', u: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.107' },
    iarc: { t: 'IARC (2012). Monographs Volume 100C: Wood dust; y Volume 100F: Formaldehyde. Agentes del grupo 1 (cancerígenos para humanos).', u: 'https://monographs.iarc.who.int/agents-classified-by-the-iarc/' }
  };



  /* ------------------------------------------------------------ 11 · datos tipo (Kanawaty, cap. 27): minutos por unidad de cada elemento
     No hay tiempos publicados de muebles de MDF lacado: cada valor se estimó (por cálculo con un dato publicado o por comparación)
     y se valida cronometrando el primer juego y con la entrevista a un ebanista (guion en el ítem 11). */
  const TIEMPOS = {
    cortar: { min: 1.0, u: 'corte', f: 'Cálculo: avance manual de unos 6 m/min en un corte medio de 1.5 m (0.25 min) más 0.75 min para medir, ajustar la guía y retirar la pieza. Referencia: la seccionadora industrial avanza 18 a 30 m/min en MDF (European Panel Federation).', t: 'estimado' },
    inspCorte: { min: 1.0, u: 'medida', f: 'Medir largo, ancho y diagonales de la primera pieza de cada medida con flexómetro y escuadra.', t: 'estimado' },
    fresar: { min: 1.5, u: 'm', f: 'Cálculo: router manual a unos 2 m/min en dos pasadas (1 min/m) más alistamiento. Referencia: fresa de 1/2" en CNC a 5.08 m/min (Amana Tool).', t: 'estimado' },
    curvar: { min: 20, u: 'm²', f: 'Comparación con el encolado de tableros: untar dos capas, ponerlas sobre las costillas y cerrar las prensas.', t: 'estimado' },
    fraguado: { min: 30, fijo: 0, u: 'tanda', f: 'Prensado de 20 a 30 minutos del pegante Carpincol (Ferresoluciones, fuente secundaria).', t: 'secundaria', demora: true },
    masillar: { min: 15, u: 'm²', f: 'Comparación con el lijado: masillar juntas y lijar el sobrante.', t: 'estimado' },
    lijar: { min: 4, u: 'm²', f: 'Comparación: lijado de una puerta entamborada de unos 10 minutos (Enard, 2010, UIS, p. 93), con un MDF que llega liso de fábrica.', t: 'estimado' },
    lijarFino: { min: 2.5, u: 'm²', f: 'Lijado ligero del sellador con grano 320: un poco más de la mitad del primer lijado.', t: 'estimado' },
    sellar: { min: 1.5, u: 'm²', f: 'Aplicar a pistola, mover y girar piezas sobre los caballetes; rendimiento de 45 m²/galón (Pintuco).', t: 'estimado' },
    lacar: { min: 1.5, u: 'm²', f: 'Igual que el sellador: una mano a pistola de 20 a 25 cm (Pintuco y Tonner).', t: 'estimado' },
    pintar: { min: 3, u: 'm²', f: 'Pintura negra a brocha o pistola en zócalos pequeños.', t: 'estimado' },
    secSell: { min: 60, u: 'tanda', f: 'Tiempo entre manos de 1 hora del sellador catalizado al ácido (Pintuco Madetec, ficha técnica).', t: 'fuente', demora: true },
    secLaca: { min: 60, u: 'tanda', f: 'Tiempo entre manos de 1 hora de la laca catalizada al ácido (Pintuco Madetec, ficha técnica).', t: 'fuente', demora: true },
    curado: { min: 120, u: 'tanda', f: 'Secado para manipular de 2 horas (Pintuco Madetec); curado total de 7 días antes del uso pleno.', t: 'fuente', demora: true },
    inspAcab: { min: 0.5, u: 'm²', f: 'Mirar cada cara con luz rasante.', t: 'estimado' },
    encolar: { min: 10, u: 'tapa', f: 'Untar pegante en una capa, alinear la segunda y prensar.', t: 'estimado' },
    prensado: { min: 30, u: 'tanda', f: 'Prensado de 20 a 30 minutos del pegante Carpincol (fuente secundaria).', t: 'secundaria', demora: true },
    canto: { min: 3, u: 'm', f: 'Comparación: canteado de 5 a 8 minutos por banco (Enard, 2010, UIS, p. 96); pegar y refilar a mano.', t: 'estimado' },
    inspCanto: { min: 0.3, u: 'm', f: 'Pasar la uña a lo largo del canto.', t: 'estimado' },
    cortarAcril: { min: 1.5, u: 'corte', f: 'Corte lento con disco de dientes finos, sin quitar la película protectora.', t: 'estimado' },
    doblar: { min: 5, u: 'pieza', f: 'Calentar la línea de doblez con pistola de calor y doblar sobre una regla.', t: 'estimado' },
    cortarLed: { min: 1, u: 'tramo', f: 'Medir y cortar en la marca de la tira.', t: 'estimado' },
    soldar: { min: 4, u: 'tramo', f: 'Estañar, soldar dos cables y poner termoencogible.', t: 'estimado' },
    probarLed: { min: 1, u: 'tramo', f: 'Conectar a la fuente de prueba.', t: 'estimado' },
    conectar: { min: 3, u: 'punto', f: 'Pegar el tramo en su canal y conectar a la fuente.', t: 'estimado' },
    armar: { min: 0.8, u: 'tornillo', f: 'Pretaladrar, encolar y atornillar un tornillo de ensamble con taladro inalámbrico.', t: 'estimado' },
    herraje: { min: 4, u: 'herraje', f: 'Marcar, perforar y fijar una bisagra, un riel, una pata o un soporte.', t: 'estimado' },
    inspFinal: { min: 20, u: 'mueble', f: 'Revisar el mueble con la hoja de verificación.', t: 'estimado' },
    empacar: { min: 15, u: 'bulto', f: 'Desarmar el módulo, proteger esquinas y envolver.', t: 'estimado' },
    inspVidrio: { min: 5, u: 'pieza', f: 'Medir y revisar contra la orden de compra.', t: 'estimado' }
  };
  const SUPLEMENTO = { pct: 0.09, f: 'Suplementos constantes de Kanawaty (OIT, 1996, cap. 23 y apéndice 3): 5 % por necesidades personales y 4 % por fatiga básica. Las cifras se tomaron de fuentes secundarias; se verifican en la p. 338 del libro.' };

  /* ------------------------------------------------------------ 6 · máquinas (fichas consultadas el 17 de octubre de 2026) */
  const HC = 'https://www.homecenter.com.co/homecenter-co/product/';
  const MAQ = [
    { e: 'SIE', t: 'Sierra de mesa de 10"', m: 'Bosch GTS 254', p: 1195900, prov: 'Homecenter', u: HC + '565312/sierra-mesa-10-pulgadas-1800w-4300rpm-gts254-bosch/565312/', ficha: '1800 W, 127 V, 4300 rpm; corte de 80 mm a 90°; mesa de 555 × 555 mm; corte al hilo de 545 mm; 24.4 kg; 690 × 620 × 1000 mm', para: 'Cortar a medida las piezas de tablero y el acrílico', n: 1 },
    { e: 'SIE', t: 'Sierra circular de 7-1/4" con guía', m: 'Bosch GKS 150 + guía Ubermann de 1 m', p: 691900 + 79900, prov: 'Homecenter', u: HC + '358623/sierra-circular-7-1-4-pulgada-1500w-6000rpm-gks-150/358623/', ficha: '1500 W, 127 V, 6000 rpm; corte de 64 mm; 3.7 kg', para: 'Despiezar el tablero entero en tiras antes de la sierra de mesa (un tablero de 50 kg no se maneja sobre una mesa de 555 mm)', n: 1 },
    { e: 'SIE', t: 'Ingletadora de 10"', m: 'Bosch GCM 254', p: 1627900, prov: 'Homecenter', u: HC + '691414/ingletadora-10-pulgadas-1750w-5000rpm-gcm-254-bosch/691414/', ficha: '1750 W, 110 V, 5000 rpm; 495 × 566 × 555 mm', para: 'Cortar la gola de aluminio, listones y zócalos', n: 1 },
    { e: 'FRE', t: 'Router de 1/2" con base fija', m: 'DeWalt DW616-B (combo con guía)', p: 1369900, prov: 'Homecenter', u: HC + '597262/combo-ruteadora-base-fija-1-2-guia-universal/597262/', ficha: '1210 W, 120 V, 24.500 rpm; collet de 1/4" y 1/2"; 6.2 kg', para: 'Ranuras, canal de la luz, muescas de tirador', n: 1 },
    { e: 'FRE', t: 'Taladro de banco', m: 'Bauker BD130', p: 599900, prov: 'Homecenter', u: HC + '171449/taladro-de-banco-1-2-pulg-350w-760-3070rpm-5-velocidades-bauker/171449/', ficha: '350 W; 5 velocidades, 760 a 3070 rpm; mandril de 13 mm; 16.5 kg', para: 'Cazoletas de bisagra de 35 mm y perforaciones a escuadra', n: 1 },
    { e: 'ARM', t: 'Taladro atornillador inalámbrico', m: 'DeWalt DCD771C2 (20 V)', p: 629900, prov: 'Homecenter', u: HC + '334170/taladro-atornillador-dewalt-dcd771c2-de-20-v-con-mandril-de-media-pulgada/334170/', ficha: '20 V, 2 baterías de 1.3 Ah; 59.7 Nm; 1500 rpm; mandril de 13 mm; 1.65 kg', para: 'Pretaladrar y atornillar el premontaje y los herrajes', n: 2 },
    { e: 'LIJ', t: 'Lijadora orbital aleatoria de 5"', m: 'Makita BO5030', p: 456900, prov: 'Homecenter', u: HC + '77129/lijadora-rotoorbital-5-pulgadas-300w-12000opm/77129/', ficha: '300 W, 110 V, 12.000 opm; disco de 5"; 1.3 kg', para: 'Lijar caras y cantos antes del sellador y entre manos', n: 2 },
    { e: 'LIJ', t: 'Aspiradora de taller', m: 'Karcher NT30', p: 1189900, prov: 'Homecenter', u: HC + '545831/aspiradora-pro-30lts-1400w-karcher/545831/', ficha: '1400 W, 120 V; 30 L; 170 mbar', para: 'Aspiración de la lijadora y del router; limpieza (5S)', n: 1 },
    { e: 'SIE', t: 'Colector de polvo', m: 'Truper 2 HP', p: 2859900, prov: 'Homecenter', u: HC + '3035167/colector-polvo-2hp-220x90cm-truper-1500cfm-25-micras-154l/3035167/', ficha: '1500 W (2 HP), 120 V; 1500 CFM; filtra hasta 25 µm; bolsa de 154 L; 120 min de trabajo y 30 de descanso', para: 'Extracción de la sierra de mesa y la ingletadora', n: 1 },
    { e: 'LAC', t: 'Compresor libre de aceite', m: 'Ubermann 100 L silencioso', p: 1999900, prov: 'Homecenter', u: HC + '909652/compresor-100-litros-silencioso-ubermann/909652/', ficha: '2.2 HP, 110 V; 100 L; 150 psi; 124 L/min (unos 4.4 CFM); 72 dB', para: 'Aire para la pistola de lacado y la limpieza', n: 1 },
    { e: 'LAC', t: 'Pistola HVLP de gravedad', m: 'Discover 600 cc', p: 164900, prov: 'Homecenter', u: HC + '80412/aerografo-de-gravedad-ecologico-600-cc/80412/', ficha: 'Boquilla de 1.4 mm; vaso de 600 cm³; 43 a 53 psi; consumo de 6.3 CFM', para: 'Aplicar sellador y laca', n: 2 },
    { e: 'LAC', t: 'Extractor de la cabina', m: 'Por cotizar: centrífugo antichispa, motor fuera de la corriente de aire', p: 0, prov: 'Por cotizar', u: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.107', ficha: 'Caudal de 5700 CFM o más: cara abierta de 2.4 × 2.2 m a 100 ft/min (OSHA 1910.107, referencia); rotor antichispa; motor fuera del ducto', para: 'Sacar los vapores de la cabina hacia el exterior', n: 1 },
    { e: 'ROV', t: 'Enchapadora de cantos manual de mesa', m: 'Tailor Wood M45 (AYJ Maquinaria)', p: 0, prov: 'AYJ, por cotizar', u: 'https://www.ayj.com.co/producto/enchapadora-de-cantos-manual-m45/', ficha: '1.8 kW; avance de 1 a 15 m/min; canto de 0.4 a 3 mm; 200 kg; necesita aire comprimido', para: 'Pegar el canto Rovere de las tapas (30 m por juego)', n: 1, alt: 'Alternativa de bajo volumen: kit manual de enchape Aglocol ($150.000, hasta 1 mm de canto)' },
    { e: 'ROV', t: 'Rebordeadora', m: 'Makita 3709', p: 489900, prov: 'Homecenter', u: HC + '88866/rebordeadora-collet-1-4-530w-28000rpm-ref-3709-makita/88866/', ficha: '530 W, 110 V; collet de 1/4"; 1.5 kg', para: 'Refilar el canto al ras', n: 1 },
    { e: 'SIE', t: 'Caladora', m: 'DeWalt DWE300-B3', p: 496900, prov: 'Homecenter', u: HC + '514791/caladora-650w-3200rpm-tipo-t-dewalt/514791/', ficha: '650 W, 110 V; corte de 85 mm en madera; 2.6 kg', para: 'Costillas y discos con radio de los pedestales y la isla', n: 1 }
  ];


  /* ------------------------------------------------------------ 3 · localización
     Distancias por carretera desde Villanueva: OSRM (OpenStreetMap), cotejadas con la ANI en el corredor de la Ruta 65.
     Coordenadas: Wikipedia (secundaria); la de la planta es estimada. Consultado el 17 de octubre de 2026. */
  const LOC = {
    planta: { t: 'Planta · Cra 11 N.º 3-36', lat: 4.603, lon: -72.930 },
    ciudades: [
      { t: 'Villanueva', lat: 4.6087, lon: -72.9288 }, { t: 'Barranca de Upía', lat: 4.583, lon: -72.967, km: 8.1 }, { t: 'Monterrey', lat: 4.9167, lon: -72.8667, km: 45 },
      { t: 'Villavicencio', lat: 4.15, lon: -73.633, km: 115.1, prov: true, obra: true }, { t: 'Aguazul', lat: 5.1731, lon: -72.5547, km: 122.9 }, { t: 'Yopal', lat: 5.35, lon: -72.41, km: 147.7, prov: true, obra: true },
      { t: 'Tunja', lat: 5.533, lon: -73.367, km: 186.5, obra: true }, { t: 'Bogotá', lat: 4.7111, lon: -74.0722, km: 220, prov: true, obra: true }, { t: 'Sogamoso', lat: 5.7167, lon: -72.9208, km: 237.6 }, { t: 'Duitama', lat: 5.833, lon: -73.017, km: 258.6 }
    ],
    obra: [['Villavicencio', 115], ['Yopal', 148], ['Tunja', 187], ['Bogotá', 220], ['Ibagué', 409], ['Bucaramanga', 511], ['Manizales', 514], ['Pereira', 524], ['Medellín', 627], ['Cali', 668], ['Barranquilla', 1080], ['Cartagena', 1122]],
    proveedores: [
      { t: 'Homecenter Yopal', c: 'Yopal', d: 'Calle 24 con Carrera 35', q: 'Herrajes, LED, laca, máquinas', tag: 'fuente' },
      { t: 'Homecenter Villavicencio', c: 'Villavicencio', d: 'Cra 48 # 1-180', q: 'Herrajes, LED, laca, máquinas', tag: 'fuente' },
      { t: 'Madecentro Yopal', c: 'Yopal', d: 'Carrera 20 # 16-55', q: 'Tableros, cantos, herrajes', tag: 'secundaria' },
      { t: 'Madecentro Villavicencio', c: 'Villavicencio', d: 'Cra 38 # 26C-50', q: 'Tableros, cantos, herrajes', tag: 'secundaria' },
      { t: 'Distribuidores de tableros Duratex', c: 'Yopal (3) y Villavicencio (6)', d: 'Red oficial de distribuidores', q: 'MDF y melamina', tag: 'fuente' },
      { t: 'Tiendas Pintuco', c: 'Yopal y Villavicencio', d: 'Red de tiendas', q: 'Laca y sellador catalizados', tag: 'fuente' },
      { t: 'Vidrios y Aluminios del Meta', c: 'Villavicencio', d: 'Calle 35 N.º 10A-49, Av. Catama', q: 'Vidrio templado', tag: 'fuente' },
      { t: 'Ferreterías de Villanueva', c: 'Villanueva', d: 'Tres ferreterías en el casco urbano', q: 'Tornillería y consumibles', tag: 'secundaria' }
    ],
    // tabla de factores (1 a 5); pesos que suman 100
    factores: [
      { t: 'Cercanía a los proveedores de tablero', peso: 25, v: { Villanueva: 2, Villavicencio: 5, Yopal: 4 }, d: 'Villanueva está a 115 km de Villavicencio y a 148 km de Yopal, donde están Madecentro, Homecenter y los distribuidores Duratex (6 en Villavicencio, 3 en Yopal).' },
      { t: 'Cercanía a los locales de la cadena (obra)', peso: 25, v: { Villanueva: 4, Villavicencio: 5, Yopal: 3 }, d: 'Suma de distancias a las 12 ciudades: Villanueva 6125 km (OSRM). Villavicencio unos 4975 km y Yopal unos 7605 km (estimado: ±115 y ±148 km sobre la ruta que pasa por Villavicencio).' },
      { t: 'Inmueble disponible y costo de arriendo', peso: 20, v: { Villanueva: 5, Villavicencio: 3, Yopal: 3 }, d: 'En Villanueva el grupo tiene el inmueble de la Carrera 11 N.º 3-36. En Yopal, las bodegas se arriendan a unos 9.000–22.500 $/m² al mes (anuncios, fuente secundaria); en Villanueva no se encontraron anuncios.' },
      { t: 'Mano de obra calificada (ebanistas, lacadores)', peso: 15, v: { Villanueva: 2, Villavicencio: 5, Yopal: 4 }, d: 'El salario base es nacional (SMMLV 2026: $1.750.905). Las ciudades grandes tienen más talleres y más ebanistas; criterio del grupo.' },
      { t: 'Vías', peso: 10, v: { Villanueva: 4, Villavicencio: 5, Yopal: 4 }, d: 'Las tres están sobre la Ruta 65 (Marginal de la Selva); Villavicencio además tiene la Ruta 40 a Bogotá.' },
      { t: 'Energía', peso: 5, v: { Villanueva: 4, Villavicencio: 3, Yopal: 4 }, d: 'ENERCA (Casanare): 787 $/kWh en nivel 1 para uso industrial, primer trimestre de 2026 (Superservicios). Villavicencio: no se obtuvo la tarifa de EMSA (se califica 3, neutro).' }
    ]
  };

  /* ------------------------------------------------------------ 14 · GTC 45 (ICONTEC, 2012), matriz de peligros
     ND nivel de deficiencia (10, 6, 2) · NE exposición (4 continua, 3 frecuente, 2 ocasional, 1 esporádica)
     NP = ND × NE · NC consecuencia (100 mortal, 60 muy grave, 25 grave, 10 leve) · NR = NP × NC
     Nivel de riesgo: I 4000–600 · II 500–150 · III 120–40 · IV 20 */
  const GTC45 = [
    { area: 'Corte', act: 'Cortar tableros en la sierra', clase: 'Mecánico', peligro: 'Contacto con el disco; retroceso de la pieza', efecto: 'Amputación, heridas', nd: 6, ne: 4, nc: 60, control: { ing: 'Sierra con cuchilla divisora, guarda del disco y empujadores; freno del motor', adm: 'Procedimiento de corte; nadie más en la zona de salida', epp: 'Gafas; sin guantes ni ropa suelta cerca del disco' } },
    { area: 'Corte y fresado', act: 'Cortar y fresar MDF', clase: 'Químico', peligro: 'Polvo de madera y de MDF (resina urea-formaldehído)', efecto: 'Irritación respiratoria; el polvo de madera es cancerígeno (IARC, grupo 1)', nd: 6, ne: 4, nc: 25, control: { ing: 'Extracción localizada en sierra, router y lijadora (colector de polvo)', adm: 'Limpieza con aspiradora, nunca con aire comprimido ni escoba', epp: 'Respirador N95 o P2' } },
    { area: 'Corte y fresado', act: 'Operar sierra y router', clase: 'Físico', peligro: 'Ruido de la sierra y el router', efecto: 'Pérdida auditiva', nd: 6, ne: 3, nc: 25, control: { ing: 'Discos y fresas afilados; sierra sobre base que no vibre', adm: 'Rotar tareas ruidosas; medición de ruido', epp: 'Protector auditivo de copa o inserción' } },
    { area: 'Recepción y corte', act: 'Mover tableros de 1.83 × 2.44 m', clase: 'Biomecánico', peligro: 'Manipulación manual de cargas (tablero de MDF 15 mm, unos 50 kg)', efecto: 'Lesión lumbar', nd: 6, ne: 3, nc: 25, control: { ing: 'Carro porta-tableros y rack vertical a la altura de la mesa de la sierra', adm: 'Siempre entre dos personas', epp: 'Guantes de agarre, botas' } },
    { area: 'Lijado', act: 'Lijar caras y cantos', clase: 'Biomecánico', peligro: 'Vibración en mano y brazo; postura sostenida', efecto: 'Trastornos de mano y hombro', nd: 2, ne: 4, nc: 10, control: { ing: 'Lijadora orbital con baja vibración y aspiración; mesa de lijado a la altura del codo', adm: 'Pausas activas; alternar con otras tareas', epp: 'Guantes antivibración' } },
    { area: 'Lacado', act: 'Aplicar sellador y laca catalizada', clase: 'Químico', peligro: 'Vapores de solventes y catalizador ácido', efecto: 'Intoxicación, irritación, dermatitis', nd: 6, ne: 3, nc: 60, control: { ing: 'Cabina cerrada con extracción hacia el exterior y filtros', adm: 'Hojas de seguridad a la vista; mezclar solo lo que se usa', epp: 'Respirador de media cara con filtros para vapores orgánicos, guantes de nitrilo, overol' } },
    { area: 'Lacado y secado', act: 'Guardar y aplicar laca y thinner', clase: 'Condiciones de seguridad', peligro: 'Líquidos inflamables; atmósfera con vapores', efecto: 'Incendio, quemaduras', nd: 6, ne: 3, nc: 100, control: { ing: 'Luminarias y extractor a prueba de explosión en la cabina; gabinete para inflamables', adm: 'Prohibido fumar y hacer chispa; trapos con solvente en caneca metálica con tapa', epp: 'Extintor ABC y de CO2 junto a la cabina' } },
    { area: 'Curvado y armado', act: 'Encolar, prensar y atornillar', clase: 'Mecánico', peligro: 'Atrapamiento con prensas; herramientas manuales', efecto: 'Golpes, contusiones', nd: 2, ne: 3, nc: 10, control: { ing: 'Prensas con tope', adm: 'Orden de herramientas (5S)', epp: 'Guantes de agarre' } },
    { area: 'Banco eléctrico', act: 'Soldar cables de la tira LED', clase: 'Condiciones de seguridad', peligro: 'Cautín caliente; humo de soldadura', efecto: 'Quemaduras leves', nd: 2, ne: 2, nc: 10, control: { ing: 'Soporte de cautín y extractor de humo de mesa', adm: 'Trabajar con la fuente desconectada', epp: 'Gafas' } },
    { area: 'Toda la planta', act: 'Circular entre estaciones', clase: 'Locativo', peligro: 'Piso con polvo o retazos; cables', efecto: 'Caídas', nd: 2, ne: 4, nc: 25, control: { ing: 'Pasillos demarcados de 1.20 m; tomas aéreas', adm: 'Limpieza al final de cada jornada (5S)', epp: 'Botas antideslizantes' } }
  ];
  const nivelGTC = (nr) => (nr >= 600 ? 'I' : nr >= 150 ? 'II' : nr >= 40 ? 'III' : 'IV');

  /* ------------------------------------------------------------ 13 · 5S (Nava-Martínez et al., 2017) */
  const S5 = [
    { s: 'Seiri · clasificar', p: 'En la planta solo hay lo que pide el juego del mes', d: 'Etiqueta roja para lo que no se usa en 30 días; zona de retazos con estante por medida (los retazos de más de 300 mm se guardan, el resto se vende como leña o se desecha).' },
    { s: 'Seiton · ordenar', p: 'Cada cosa tiene un sitio marcado', d: 'Tablero perforado con la silueta de cada herramienta junto a su estación; rack vertical de tableros por material; piezas cortadas en carros numerados por mueble.' },
    { s: 'Seiso · limpiar', p: 'El polvo no sale de donde se produce', d: 'Colector de polvo en sierra, router y lijadora; aspiradora (no escoba ni aire) 15 minutos al final de la jornada; la cabina se limpia antes de cada mano de laca.' },
    { s: 'Seiketsu · estandarizar', p: 'Las reglas se ven', d: 'Piso demarcado: pasillos de 1.20 m en amarillo, zonas de producto en proceso en blanco, zona de inflamables en rojo; fichas de puesto y hojas de seguridad en cada estación.' },
    { s: 'Shitsuke · mantener', p: 'Se revisa cada semana', d: 'Auditoría 5S de 10 minutos los viernes con la lista de chequeo; el resultado se pega en el tablero de la planta.' }
  ];

  /* ------------------------------------------------------------ 16 · calidad: criterios de aceptación por pieza */
  const CALIDAD = [
    { k: 'inspCorte', en: 'Sierra, primera pieza de cada medida', que: 'Medida y escuadra', crit: 'Largo y ancho ±1 mm; diagonales del tablero cortado iguales ±1 mm; canto sin astillas de más de 1 mm', como: 'Flexómetro y escuadra; se mide la primera de cada medida y una de cada cinco' },
    { k: 'inspAcab', en: 'Salida de la cabina', que: 'Acabado lacado', crit: 'Sin chorreados ni piel de naranja; sin partículas visibles a 1 m; brillo semimate parejo; cantos cubiertos', como: 'Inspección visual con luz rasante; muestra de brillo de referencia' },
    { k: 'inspCanto', en: 'Banco de tapas', que: 'Canto de Rovere', crit: 'Canto pegado en todo el largo, sin despegues; refilado al ras sin marcar la cara; tapa doble sin luz entre capas', como: 'Visual y con la uña a lo largo del canto' },
    { k: 'probarLed', en: 'Banco eléctrico', que: 'Tramo de LED', crit: 'Enciende todo el tramo, sin puntos apagados; cable soldado con termoencogible; polaridad marcada', como: 'Se conecta a una fuente de prueba de 12 V' },
    { k: 'inspVidrio', en: 'Recepción', que: 'Vidrio templado y piezas compradas', crit: 'Medida del pedido ±2 mm; marca de templado visible (NSR-10, K.4.3.9.1.7); bordes pulidos sin conchas', como: 'Flexómetro y visual contra la orden de compra' },
    { k: 'inspFinal', en: 'Premontaje', que: 'Mueble completo', crit: 'Escuadra (diagonales ±2 mm), puertas y cajones alineados con luz de 3 mm, herrajes completos, luz encendida, cada módulo marcado', como: 'Hoja de verificación del mueble, firmada' }
  ];

  L.nota2 = { loc: LOC, tiempos: TIEMPOS, suplemento: SUPLEMENTO, maquinas: MAQ, gtc45: GTC45, nivelGTC, s5: S5, calidad: CALIDAD, empresa: EMPRESA, volumen: VOLUMEN, hipotesis: HIPOTESIS, procesos: PROCESOS, fuentes: FUENTES2 };
})();
