/* ============================================================================
   NOTA 3 · DATOS — proveedores, cotizaciones, mano de obra y costos indirectos
   de la planta de Villanueva (Casanare) para los 12 juegos de la versión B.

   Cotizaciones: precios de catálogo publicados en línea, con enlace y fecha de
   consulta (la guía, 7.1, acepta «el precio de su catálogo, con fecha»).
   Cada dato lleva su etiqueta: fuente · secundaria · estimado · no.
   iva: 'inc' el precio publicado incluye IVA · 'mas' se publica sin IVA ·
        'na' la página no lo dice (se supone incluido, como en las tiendas al público).
   x:   unidades de compra que hay en la presentación cotizada, cuando no coincide
        con la unidad de compra del material (por ejemplo, un paquete de 2 pares).
   s:   calificación del grupo, de 1 a 5, en capacidad, plazo, ubicación y especificación.
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const HC = 'https://www.homecenter.com.co/homecenter-co/product/';
  const MC = 'https://madecentro.com/products/';
  const FECHA = '20 de octubre de 2026';
  const SMMLV = 1750905, AUX = 249095;

  /* ---------------------------------------------------------------- cotizaciones */
  const HCt = { contacto: 'Línea nacional 01 8000 127 373', plazo: 'Domicilio en unos 2 días; retiro en tienda', envio: 'Se calcula al hacer la orden; los tableros no tienen envío gratis', ciudad: 'Villavicencio', sede: 'Villavicencio (115 km) y Yopal (148 km)', min: 'No publicado' };
  const MCt = { contacto: 'Línea nacional 01 8000 423 860', plazo: '3 a 8 días hábiles', envio: 'Despacho a ciudades principales en compras de más de $500.001; si no, retiro en almacén', ciudad: 'Villavicencio', sede: 'Villavicencio (115 km) y Yopal (148 km)', min: '1 lámina o 1 rollo' };
  const EAt = { contacto: 'No publicado en la ficha', plazo: 'No publicado', envio: 'No publicado; el precio cambia según la región', ciudad: 'Bogotá', sede: 'Bogotá (220 km)', min: 'No publicado' };
  const ARt = { contacto: 'WhatsApp 316 745 9958', plazo: 'No publicado', envio: 'Entrega a domicilio o retiro; sin tarifa publicada', ciudad: 'Bogotá', sede: 'Bogotá (220 km) y Bucaramanga (sede)', min: 'No publicado' };
  const q = (base, o) => Object.assign({ iva: 'na', tag: 'fuente', fecha: FECHA }, base, o);
  const sc = (esp, cap, plazo, ubic) => ({ esp, cap, plazo, ubic });
  const COT = {
    /* ---------------- tableros */
    mdf15: { cat: 'mp', g: 'Tableros', m: 'MDF de 15 mm crudo, 1.83 × 2.44 m', uc: 'lámina', modo: 'lamina', sel: 0,
      por: 'Homecenter es el más barato y despacha desde Villavicencio o Yopal en unos dos días. Además publica 3 % de descuento desde 15 láminas: el juego lleva 17. Easy cuesta casi lo mismo, pero despacha desde Bogotá.',
      q: [q(HCt, { prov: 'Homecenter', ref: 'Tablero MDF 15 mm Trupan, cód. 884232', pres: 'Lámina de 1.83 × 2.44 m, 46.8 kg', p: 134900, u: HC + '884212/tablero-mdf-15mm-183x244m-trupan/884232/', nota: 'Descuento del 3 % desde 15 unidades y del 5 % desde 50 (no se aplica en el costo: se confirma en la cotización formal).', s: sc([5, 'Misma referencia del despiece (Trupan 15 mm)'], [5, 'Cadena con dos tiendas cerca y descuento por volumen'], [5, 'Unos 2 días'], [5, 'Villavicencio o Yopal']) }),
        q(EAt, { prov: 'Easy', ref: 'MDF 15 mm Trupan, ref. 1406311', pres: 'Lámina de 1.83 × 2.44 m', p: 135900, u: 'https://www.easy.com.co/mdf-15mm-183x244cm-1406311/p', nota: 'La categoría mostraba $80.900 para el mismo producto; se toma el precio de la ficha.', s: sc([5, 'Misma referencia'], [4, 'Cadena; stock en Bogotá'], [3, 'No publica plazo'], [3, 'Bogotá']) }),
        q(ARt, { prov: 'Ardisa (Carpincentro)', ref: 'MDF Duratex estándar 183 × 244 × 15, SKU 10008526', pres: 'Lámina; densidad de 550 a 650 kg/m³', p: 172155, u: 'https://www.ardisa.com/mdf-tablemac-light-183x244x15-qekr5.html', nota: 'Ardisa y Carpincentro publican los mismos productos, precios y dirección: se cuentan como un solo proveedor.', s: sc([4, 'Equivalente de otra marca (Duratex)'], [4, 'Distribuidor de tableros'], [3, 'No publica plazo'], [3, 'Bogotá']) })] },
    mdf55: { cat: 'mp', g: 'Tableros', m: 'MDF de 5.5 mm, 1.83 × 2.44 m', uc: 'lámina', modo: 'lamina', sel: 0,
      por: 'Homecenter es el más barato y está más cerca. El de Ardisa podría ser HDF, según su ficha, y el HDF no se curva igual en las pieles.',
      q: [q(HCt, { prov: 'Homecenter', ref: 'Tablero MDF 5.5 mm Trupan, cód. 884236', pres: 'Lámina de 1.83 × 2.44 m, 21.1 kg', p: 63900, u: HC + '884212/tablero-mdf-55mm-183x244m-trupan/884236/', s: sc([5, 'Misma referencia'], [5, 'Cadena con dos tiendas cerca'], [5, 'Unos 2 días'], [5, 'Villavicencio o Yopal']) }),
        q(EAt, { prov: 'Easy', ref: 'MDF 5.5 mm Trupan, ref. 1406303', pres: 'Lámina de 1.83 × 2.44 m', p: 76900, u: 'https://www.easy.com.co/mdf-5-5mm-x-1830-x-2440/p', s: sc([5, 'Misma referencia'], [4, 'Cadena'], [3, 'No publica plazo'], [3, 'Bogotá']) }),
        q(ARt, { prov: 'Ardisa (Carpincentro)', ref: 'MDF Arauco 183 × 244 × 5.5', pres: 'Lámina', p: 91789, u: 'https://www.carpincentro.com/mdf-arauco-183x244x5-5.html', nota: 'También tiene Duratex 5.5 mm a $100.731, cuya ficha dice «HDF»: hay que confirmar que es MDF.', s: sc([4, 'Equivalente de otra marca'], [4, 'Distribuidor de tableros'], [3, 'No publica plazo'], [3, 'Bogotá']) })] },
    rovere15: { cat: 'mp', g: 'Tableros', m: 'Melamina Rovere RH de 15 mm, 2.15 × 2.44 m', uc: 'lámina', modo: 'lamina', sel: 0,
      por: 'Se elige el Rovere de Pelíkano de Madecentro aunque el Roble Provenzal de Vesto es 26 % más barato. El canto de 33 mm que cubre la tapa de 30 mm solo existe en el tono Rovere de Madecentro: con otro tablero, el canto no combinaría. Es el único material en que el elegido no es el más barato.',
      q: [q(MCt, { prov: 'Madecentro', ref: 'Aglomerado melamina Rovere RH Pelíkano 15 mm', pres: 'Lámina de 2.15 × 2.44 m', p: 444625, u: MC + 'tablero-aglomerado-melamina-rovere-rh-pelikano', nota: 'En oferta, 25 % menos que el precio normal de $592.833, sin fecha de vencimiento: si la oferta termina, el juego sube $296.416.', s: sc([5, 'Es el tono del diseño y el único con canto de 33 mm igual'], [4, 'Dos tiendas cerca; compra mínima de una lámina'], [3, 'De 3 a 8 días hábiles'], [5, 'Villavicencio o Yopal']) }),
        q(HCt, { prov: 'Homecenter', ref: 'Equivalente: MDP Roble Provenzal RH 15 mm Vesto (Arauco), cód. 884270', pres: 'Lámina de 2.15 × 2.44 m, 50.7 kg', p: 329900, u: HC + '884270/tablero-mdp-roble-provenzal-rh-15mm-215x244-metros-vesto/884270/', nota: 'Precio especial hasta el 25 de octubre de 2026. También tiene Roble Cava RH al mismo precio.', s: sc([2, 'Otro tono, y no hay canto de 33 mm de ese tono: la tapa quedaría con el canto de otro color'], [5, 'Cadena'], [4, 'Unos 2 días'], [5, 'Villavicencio o Yopal']) }),
        q(ARt, { prov: 'Ardisa (Carpincentro)', ref: 'Equivalente: Vesto MDP RH Roble Cava, solo en 18 mm', pres: 'Lámina de 2.15 × 2.44 × 18 mm', p: 440657, u: 'https://www.carpincentro.com/melaminico-vesto-mdp-rh-roble-cava-softwood-215x244x18.html', nota: 'Solo hay 18 mm: la tapa quedaría de 33 mm.', s: sc([1, 'Otro tono y otro espesor'], [4, 'Distribuidor'], [3, 'No publica plazo'], [3, 'Bogotá']) })] },
    blanca15v: { cat: 'mp', g: 'Tableros', m: 'Melamina blanca RH de 15 mm (capa de abajo de las tapas)', uc: 'lámina', modo: 'lamina', sel: 0,
      por: 'Homecenter es el más barato por lámina y por m² (su lámina mide 2.15 × 2.44 m), y publica 5 % de descuento desde 5 unidades. La capa de abajo no se ve: no hace falta que sea de la misma marca del Rovere.',
      q: [q(HCt, { prov: 'Homecenter', ref: 'MDP Blanco RH 15 mm Vesto (Arauco), cód. 884238', pres: 'Lámina de 2.15 × 2.44 m, 47.2 kg', p: 215900, u: HC + '884254/tablero-mdp-blanco-15mm-215x244-metros-vesto/884238/', nota: 'Descuento del 5 % desde 5 unidades y del 12 % desde 46.', s: sc([5, 'Blanco RH de 15 mm, la medida del plan de corte'], [5, 'Cadena con descuento por volumen'], [5, 'Unos 2 días'], [5, 'Villavicencio o Yopal']) }),
        q(MCt, { prov: 'Madecentro', ref: 'Aglomerado melamina blanco RH Primadera 15 mm', pres: 'Lámina de 1.83 × 2.44 m', p: 226756, x: 5.246 / 4.4652, xTxt: 'precio llevado a una lámina de 2.15 × 2.44 m por m²', u: MC + 'tablero-aglomerado-melamina-blanco-rh-primavera-1-83-2-44-cm', nota: 'Su lámina es más pequeña (4.47 m²): para comparar, el precio se lleva a la misma área.', s: sc([4, 'Lámina más pequeña: cambia el plan de corte'], [4, 'Dos tiendas cerca'], [3, 'De 3 a 8 días hábiles'], [5, 'Villavicencio o Yopal']) }),
        q(EAt, { prov: 'Easy', ref: 'MDP Blanco RH 15 mm Vesto, ref. 1403479', pres: 'Lámina de 2.15 × 2.44 m, 54.4 kg', p: 236900, u: 'https://www.easy.com.co/tablero-mdp-blanco-rh-15mm-215x244cm-vesto-1403479/p', s: sc([5, 'Misma referencia que Homecenter'], [4, 'Cadena'], [3, 'No publica plazo'], [3, 'Bogotá']) })] },
    cantoRovere33: { cat: 'mp', g: 'Tableros', m: 'Canto PVC Rovere de 33 mm', uc: 'rollo de 200 m', modo: 'rollo', L: 200, merma: 1.05, sel: 0,
      por: 'Es el único canto de 33 mm en el tono del tablero: cubre las dos capas de la tapa en una pasada. Los otros son más anchos o de otro color, y habría que refilar más.',
      q: [q(MCt, { prov: 'Madecentro', ref: 'Canto flexible Rovere 33 mm, marca Orange', pres: 'Rollo de 200 m', p: 438000, u: MC + 'canto-flexible-rovere-por-rollo-200', nota: 'La misma página vende el de 19 mm ($285.600) y el de 41 mm ($650.200) por rollo de 200 m.', s: sc([5, 'Mismo tono y ancho justo'], [4, 'Dos tiendas cerca'], [3, 'De 3 a 7 días hábiles'], [5, 'Villavicencio o Yopal']) }),
        q(HCt, { prov: 'Homecenter', ref: 'Equivalente: canto puerta Rovere 47 mm', pres: 'Por metro', p: 2050, x: 200, xTxt: 'precio por metro × 200 m', tag: 'secundaria', u: 'https://www.falabella.com.co/falabella-co/category/CATG32181/Tapacantos', nota: 'Precio leído en el listado de Falabella, que vende el producto de Homecenter; no se obtuvo la ficha.', s: sc([3, 'Rovere de otro fabricante, 14 mm más ancho'], [4, 'Cadena'], [4, 'Unos 2 días'], [5, 'Villavicencio o Yopal']) }),
        q(ARt, { prov: 'Ardisa (Carpincentro)', ref: 'Equivalente en ancho: canto PVC Rehau Titanio 35 × 1.5 mm', pres: 'Por metro (rollo de 150 m)', p: 4102, x: 200, xTxt: 'precio por metro × 200 m', u: 'https://www.carpincentro.com/canto-pvc-rehau-titanio-ar-35x1-5mm-ue-150m-150mxrollo.html', nota: 'Otro color: sirve solo para comparar el precio de un canto de 35 mm.', s: sc([1, 'Otro color'], [4, 'Distribuidor'], [3, 'No publica plazo'], [3, 'Bogotá']) })] },
    /* ---------------- flete */
    flete: { cat: 'srv', g: 'Fletes', m: 'Flete de las compras a la planta', uc: 'viaje', modo: 'viaje', porJuego: 1, sel: 0, reparto: ['mdf15', 'mdf55', 'rovere15', 'blanca15v'], det: 'Un viaje por juego desde Villavicencio, con los tableros y lo demás', ucons: 'm² de tablero',
      por: 'Ningún proveedor publica la tarifa a Villanueva. Se toma un viaje en camión sencillo desde Villavicencio por juego (unas 31 láminas, cerca de 1.3 t). El costo se reparte entre los muebles por su área de tablero, que es la mayor parte del peso.',
      q: [q({}, { prov: 'Camión sencillo contratado (por cotizar con una transportadora de Villanueva o con LAM Logística)', sede: 'Villavicencio → Villanueva, 115 km', ciudad: 'Villavicencio', ref: 'Viaje completo de ida, camión de dos ejes', pres: 'Viaje', p: 520000, iva: 'exc', tag: 'estimado', u: 'https://logitools.co/guias/tarifa-minima-flete-colombia-2026', contacto: 'LAM Logística: WhatsApp 321 763 5691', envio: '—', plazo: 'El mismo día', min: '—', nota: 'Estimado: 115 km × $3.800 a $4.200 por km (costo de referencia SICE-TAC para camión de dos ejes, fuente secundaria) ≈ $460.000, más unos $60.000 de peajes y cargue. El transporte de carga está excluido de IVA (E.T., art. 476).' })] }
  };

  /* ---------------------------------------------------- criterios de selección (PMBOK, X4.7) */
  const CRITERIOS = [
    { k: 'costo', t: 'Costo', peso: 35, d: 'Precio sin IVA por la misma unidad de compra, con el envío si se cobra aparte', e: 'Automático: 5 × precio más bajo ÷ precio del proveedor' },
    { k: 'esp', t: 'Especificación', peso: 25, d: 'Que sea la referencia del despiece: espesor, medida, tono, potencia, ficha publicada', e: '5 la misma referencia con ficha · 3 equivalente · 1 dudosa' },
    { k: 'cap', t: 'Capacidad', peso: 15, d: 'Que pueda surtir la cantidad del volumen (por juego y en el año): stock, sedes, venta a empresas', e: '5 cadena o distribuidor con stock · 3 tienda pequeña · 1 sin stock' },
    { k: 'plazo', t: 'Plazo', peso: 10, d: 'Cuánto tarda en llegar a la planta', e: '5 entrega en el día o recoge en sede cercana · 3 de 2 a 5 días · 1 más de una semana o sobre pedido' },
    { k: 'ubic', t: 'Ubicación', peso: 15, d: 'Distancia de la sede que despacha a Villanueva (ítem 3 de la Nota 2)', e: '5 Villanueva o a menos de 150 km (Villavicencio, Yopal) · 3 Bogotá · 1 más lejos o solo en línea' }
  ];

  /* ---------------------------------------------------- acabados: rendimiento y sistema de laca */
  const LACA = {
    rend: 45,       // m² por galón por mano (Pintuco Madetec, ficha técnica)
    te: 0.65,       // eficiencia de transferencia de la pistola HVLP
    sistema: [{ k: 'sellador', manos: 1 }, { k: 'laca', manos: 2 }],
    nota: ''
  };
  const NEGRO = { k: 'negro', rend: 20 };

  /* ---------------------------------------------------- equipo que va dentro del mueble */
  const EQUIPO = [{ k: 'p1s', n: 7, q: 4 }];

  /* ---------------------------------------------------- mano de obra */
  const MO = {
    smmlv: SMMLV, auxTransp: AUX, vacDias: 15,
    personas: [
      { k: 'eb', t: 'Ebanista y jefe de taller', corto: 'Ebanista', d: 'Tiempo completo: corte, fresado, curvado, tapas y canto, banco eléctrico, armado e inspección', jornada: 1, salario: 1776103, tag: 'secundaria', estaciones: ['SIE', 'FRE', 'CUR', 'ROV', 'ELE', 'ARM', 'INS'] },
      { k: 'aux', t: 'Auxiliar de acabados', corto: 'Auxiliar', d: 'Medio tiempo: lijado, sellador y laca, empaque', jornada: 0.5, salario: SMMLV, auxPct: 1, tag: 'fuente', estaciones: ['LIJ', 'LAC', 'EMP'] }
    ],
    factor: [
      { t: 'Cesantías', pct: 8.33, base: 'sal+aux', f: 'CST, art. 249: un mes de salario por año' },
      { t: 'Intereses sobre las cesantías', pct: 1.0, base: 'sal+aux', f: 'Ley 52 de 1975: 12 % anual sobre las cesantías' },
      { t: 'Prima de servicios', pct: 8.33, base: 'sal+aux', f: 'CST, art. 306: un mes de salario por año' },
      { t: 'Pensión (empleador)', pct: 12, base: 'sal', f: 'Ley 100 de 1993, art. 20' },
      { t: 'Riesgos laborales, clase III', pct: 2.436, base: 'sal', f: 'Decreto 1772 de 1994, art. 13; clase supuesta para CIIU 3110, se confirma con la ARL' },
      { t: 'Caja de compensación', pct: 4, base: 'sal', f: 'Ley 21 de 1982' },
      { t: 'Salud, SENA e ICBF', pct: 0, base: 'sal', f: 'Exonerados: E.T., art. 114-1, para trabajadores de menos de 10 SMMLV en una S.A.S.' }
    ],
    salariosTxt: 'Ebanista: $1.776.103, promedio de 232 avisos de Indeed en Colombia (actualizado el 9 de octubre de 2026); en Casanare no hay promedio publicado. Auxiliar: medio salario mínimo de 2026 ($1.750.905, Decreto 0159 de 2026) por media jornada, con el auxilio de transporte completo ($249.095, Decreto 1470 de 2025) porque viaja todos los días; los aportes se calculan sobre lo que gana (cotización por semanas, Decreto 2616 de 2013). Los salarios de 2027 se ajustan cuando salga el mínimo de 2027.',
    vacTxt: '15 días hábiles por año (CST, art. 186). El salario se paga los 12 meses, pero en las vacaciones no se trabaja: por eso la hora sale de dividir el costo del año por las horas que de verdad se trabajan, y no se suma una provisión de vacaciones. La Nota 2 calculó el ritmo con las 2066 horas de jornada; con las vacaciones escalonadas, la planta sigue cubriendo el ritmo porque está ocupada al 32 %.',
    notaOciosa: 'La nómina del año es mayor que la mano de obra directa de los doce juegos, porque la planta trabaja al 32 % de su capacidad (Nota 2, ítem 11): el tiempo pagado que no transforma muebles se lleva a los costos indirectos.'
  };

  /* ---------------------------------------------------- costos indirectos */
  const CIF = {
    arriendo: { m2: 308, pm2: 9000, tag: 'estimado', f: 'Bodega de 14 × 22 m (Nota 2, ítem 5). No hay ofertas publicadas en Villanueva; se toma el rango bajo de Yopal (9.000 a 12.000 $/m² al mes en Fincaraiz y PuntoPropiedad, consultados el 17 de octubre de 2026)' },
    energia: {
      tarifa: 787, tag: 'fuente', f: 'Costo unitario de ENERCA, nivel de tensión 1, primer trimestre de 2026 (Superservicios, boletín tarifario, tabla 13). La industria manufacturera no paga contribución (E.T., art. 211)',
      cargas: [
        { t: 'Sierra de mesa', kw: 1.8, est: ['SIE'], uso: 0.35, d: '35 % del tiempo de corte' },
        { t: 'Sierra circular con guía', kw: 1.5, est: ['SIE'], uso: 0.15, d: '15 % del tiempo de corte' },
        { t: 'Ingletadora y caladora', kw: 1.2, est: ['SIE', 'CUR'], uso: 0.1, d: '10 % del corte y del curvado' },
        { t: 'Colector de polvo', kw: 1.5, est: ['SIE'], uso: 0.5, d: 'Prendido con la sierra de mesa y la ingletadora' },
        { t: 'Router y taladro de banco', kw: 1.2, est: ['FRE'], uso: 0.6, d: '60 % del tiempo de fresado' },
        { t: 'Lijadoras orbitales', kw: 0.3, est: ['LIJ'], uso: 0.8, d: '80 % del tiempo de lijado' },
        { t: 'Aspiradora de taller', kw: 1.4, est: ['LIJ', 'FRE'], uso: 0.7, d: 'Prendida con la lijadora y el router' },
        { t: 'Compresor', kw: 1.64, est: ['LAC'], uso: 0.7, d: 'Ciclo de trabajo del 70 % mientras se laca' },
        { t: 'Extractor de la cabina', kw: 2.2, est: ['LAC'], uso: 1, d: 'Todo el tiempo de lacado' },
        { t: 'Enchapadora y rebordeadora', kw: 2.3, est: ['ROV'], uso: 0.4, d: '40 % del tiempo de tapas y canto' },
        { t: 'Banco eléctrico (cautín y fuentes de prueba)', kw: 0.1, est: ['ELE'], uso: 1, d: 'Todo el tiempo del banco' },
        { t: 'Iluminación de la planta', kw: 2.46, hFijas: 'jornada', d: '308 m² × 8 W/m² de luminaria LED, toda la jornada' },
        { t: 'Computador, red y cargadores', kw: 0.15, hFijas: 'jornada', d: 'Toda la jornada' }
      ],
      nota: 'Potencias de las fichas de la Nota 2 (ítem 6). Las horas salen de los tiempos de cada estación (ítem 11) × la parte del tiempo en que la máquina está prendida, que es estimada. La iluminación supone luminarias LED de 8 W/m² para unos 300 lux de taller.'
    },
    depreciacion: {
      f: 'Estatuto Tributario, art. 137 (modificado por la Ley 1819 de 2016): tasa máxima anual del 10 % para maquinaria y equipo y muebles, y del 20 % para herramientas y equipo de cómputo',
      vidas: { maq: 10, herr: 5, mueb: 10, comp: 5 },
      nombres: { maq: 'máquinas', herr: 'herramientas', mueb: 'muebles y enseres', comp: 'cómputo' },
      clase: { 'Sierra de mesa de 10"': 'maq', 'Ingletadora de 10"': 'maq', 'Taladro de banco': 'maq', 'Colector de polvo': 'maq', 'Compresor libre de aceite': 'maq', 'Extractor de la cabina': 'maq', 'Enchapadora de cantos manual de mesa': 'maq',
        'Sierra circular de 7-1/4" con guía': 'herr', 'Router de 1/2" con base fija': 'herr', 'Taladro atornillador inalámbrico': 'herr', 'Lijadora orbital aleatoria de 5"': 'herr', 'Aspiradora de taller': 'herr', 'Pistola HVLP de gravedad': 'herr', 'Rebordeadora': 'herr', 'Caladora': 'herr' },
      precios: {},
      extra: [],
      nota: ''
    },
    mantenimiento: { pct: 0.05, tag: 'estimado', f: '' },
    insumos: [],
    personal: [],
    fijos: [],
    notaFinal: ''
  };

  /* ---------------------------------------------------- socialización (guía, 9.3, criterio 6) */
  const M = (n) => '$' + (n / 1e6).toFixed(1).replace('.', ',') + ' millones';
  const GUION = [
    { t: 'El encargo y el local', min: 2, quien: 'Integrante 1', muestra: 'Vista 3D del local, versión B; Nota 1, A y B', dice: 'BlackForge es una cadena de talleres de impresión 3D. Con permiso del director, en lugar de un apartamento diseñamos el local comercial de 6 × 7 m y los doce muebles que se fabrican para cada local. La versión que se produce es la B · Galería: MDF lacado blanco, tapas de Rovere y luz LED.' },
    { t: 'Los muebles', min: 4, quien: 'Integrante 2', muestra: 'Nota 1: requisitos (C), matriz de selección (D), un plano de conjunto (E), despiece (F), una unión (G), luz y equipo (H), render (I)', dice: 'Cada mueble parte de requisitos con fuente (Acopla95, NTC 4140, NSR-10). Se compararon tres alternativas con una matriz ponderada; B ganó en siete de doce. Mostramos un plano de conjunto con su corte, el despiece y la unión entre materiales, y cómo se alojan la luz y las impresoras.' },
    { t: 'La empresa y el volumen', min: 2, quien: 'Integrante 3', muestra: 'Nota 2: K (ritmo) y O (tipo de producción)', dice: (t) => 'Doce juegos en 2027, uno por local y por mes. Con los festivos y la jornada de 42 horas quedan 2066 horas: el ritmo es de 172 horas por juego. Es producción por lotes en un taller de flujo en U.' },
    { t: 'El proceso y los tiempos', min: 3, quien: 'Integrante 3', muestra: 'Nota 2: diagrama de operaciones (8), cursograma (9), bimanual y mesa de lijado (10), carga de estaciones (11)', dice: (t) => 'Un juego pide ' + t.mo.hJ.toFixed(1).replace('.', ',') + ' horas de trabajo. La estación más cargada es el armado, con unas 16 horas, muy por debajo del ritmo: la hipótesis de que el lacado iba a limitar la planta acertó a medias. Los tiempos son estimados con datos tipo y se validan con el primer juego.' },
    { t: 'La planta', min: 3, quien: 'Integrante 4', muestra: 'Nota 2: localización (3), plano de la planta (5), GTC 45 (14), fichas de puesto (15)', dice: 'Bodega de 14 × 22 m en Villanueva, con flujo en U del almacén al despacho. La cabina de laca queda separada del lijado por el polvo y lejos de las chispas. La matriz GTC 45 pone el lacado y la sierra como riesgos más altos y dice cómo se controlan.' },
    { t: 'Proveedores y costos', min: 3, quien: 'Integrante 1', muestra: 'Nota 3: cotizaciones (Q), cuadro comparativo (R), hoja de costos (HC), juego y volumen (CV)', dice: (t) => 'Cotizamos cada material con tres proveedores de catálogo y elegimos con cinco criterios, no solo por precio; casi todo se compra en Villavicencio y Yopal. Un juego cuesta ' + M(t.juego.total) + ' sin IVA y los doce, ' + M(t.volumen.total) + '. Las cuatro impresoras son ' + Math.round(t.equipo / t.juego.total * 100) + ' % del costo; sin ellas, el juego cuesta ' + M(t.juego.total - t.equipo) + '.' },
    { t: 'Lo que la planta le cambió al mueble', min: 2, quien: 'Todos', muestra: 'Nota 2, ítem 17 y Nota 3, «Lo que el diseño puede ahorrar»', dice: 'El plan de corte bajó los costados de los cajones de 170 a 150 mm y ahorró un tablero por juego. La laca se cambió por una con ficha técnica completa. Y la cotización mostró que el canto de 19 mm no cubría las tapas de 30 mm y que la capa de abajo de las tapas no tenía por qué ser de Rovere: ahora es melamina blanca, con un canto Rovere de 33 mm que cubre las dos capas.' }
  ];
  const PREGUNTAS = [
    ['¿Las cotizaciones son reales?', 'Son precios de catálogo publicados por cada proveedor, con enlace y fecha de consulta, que la guía acepta como cotización real (7.1). Antes de comprar se pide la cotización formal por volumen al proveedor elegido.', 'Nota 3 · Q'],
    ['¿Por qué no eligieron siempre el más barato?', 'El costo pesa 35 %; también cuentan la especificación, la capacidad para el volumen, el plazo y la distancia a la planta. Un tablero barato en Bogotá llega más tarde y con flete.', 'Nota 3 · R'],
    ['¿Por qué los costos indirectos pesan tanto?', (t) => 'Porque la planta trabaja al 32 % de su capacidad: la nómina y el arriendo se pagan todo el año aunque solo se fabriquen doce juegos. Con 24 juegos al año, el costo de un juego baja a unos ' + M(L.costos.conVolumen(24).total) + '.', 'Nota 3 · CV'],
    ['¿Por qué los costos van sin IVA?', 'La planta es una S.A.S. responsable de IVA: descuenta el IVA que paga en las compras del que cobra al facturar (E.T., art. 485). Por eso no es costo. El IVA de las compras se muestra aparte.', 'Nota 3 · P y CV'],
    ['¿Las impresoras son parte del mueble?', 'Sí: el laboratorio de impresión (mueble 7) se diseñó alrededor de cuatro impresoras, que se compran y se instalan en él. La guía pide costear la iluminación y el equipo dentro de las materias primas.', 'Nota 1 · H; Nota 3 · HC'],
    ['¿Qué pasa si los tiempos están mal?', 'La mano de obra y los indirectos se reparten por horas. Si los tiempos suben 30 %, la planta sigue por debajo del ritmo; lo que cambia es la tasa de reparto, no el total del año, porque la nómina es fija.', 'Nota 2 · 11; Nota 3 · CI'],
    ['¿Por qué la planta sigue en Villanueva si la tabla favorece a Villavicencio?', 'Por decisión del grupo (el inmueble). La Nota 3 lo cuantifica: el arriendo en Villanueva es más bajo, pero cada compra viaja 115 km desde Villavicencio.', 'Nota 2 · 3 y 17'],
    ['¿Por qué una persona y media si el cálculo da 0,56?', 'El tablero de 50 kg se carga entre dos (GTC 45) y nadie laca solo en la cabina. El tiempo pagado de más está en los indirectos y es el primer ahorro si crece el volumen.', 'Nota 2 · 11 y 14']
  ];

  L.nota3 = {
    fecha: FECHA, cot: COT, criterios: CRITERIOS, laca: LACA, negro: NEGRO, equipo: EQUIPO, mo: MO, cif: CIF,
    sensibilidad: [6, 12, 18, 24], ahorros: [], supuestos: [], fuentes: [], guion: GUION, preguntas: PREGUNTAS, pendientes: [],
    cambiosN: () => 0, notaCot: '', notaUbic: '', notaCapacidad: ''
  };
})();
