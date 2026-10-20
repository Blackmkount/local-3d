/* ============================================================================
   VERSIONES DEL LOCAL — tres maneras de ordenar el mismo local de 6.00 × 7.00 m,
   cada una con su distribución y sus 12 muebles fabricados: diseño, despiece,
   costos, fabricación, ensamble y requisitos.

     A · Taller a la vista   las impresoras salen a la fachada, de frente al pasillo;
                             acero negro, Rovere y lámina perforada
     B · Galería             recorrido en U con nichos iluminados y una isla escultórica;
                             MDF lacado blanco, Rovere y luz
     C · Modular             la distribución del plano original con muebles desarmables
                             de perfil de aluminio 30 × 30 y piezas impresas en PETG

   Los ocho productos que se compran (pantallas, impresoras, taburetes, maceteros,
   bodega y silla) son los mismos en las tres; en A y B cambian de lugar (LAYOUT).

   COSTOS: se calculan aquí mismo a partir del despiece, con los precios de PRECIOS
   (publicados en línea por cada tienda; la fecha va en la nota de cada precio).
   Para cambiar un precio basta con editarlo en PRECIOS y la página recalcula todo.
     lamina   se compran las láminas que pide el total de la versión, con un
              aprovechamiento del 72 %, y su costo se reparte entre los muebles por área
     barra    igual, por metros, con 8 % de desperdicio de corte
     m        se paga por metro, con 5 % de corte
     m2       vidrio a medida, por metro cuadrado (pedido mínimo de 3 m²)
     galon    pintura, laca o pegante: galones para el área × manos de la versión,
              repartidos por área
     kg       filamento: carretes de 1 kg para la versión, repartidos por peso
     unidad   cada mueble paga lo que usa
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const HC = 'https://www.homecenter.com.co/homecenter-co/product/';
  const MC = 'https://madecentro.com/products/';

  /* ------------------------------------------------------------------ precios
     tipo y presentación: area (m² por lámina), largo (m por barra o rollo),
     rend (m² por mano y por galón). cat agrupa el presupuesto por tipo de insumo. */
  const PRECIOS = {
    // tableros y láminas
    mdf15: { m: 'MDF 15 mm, Trupan', pres: 'Lámina 1.83 × 2.44 m', precio: 134900, tipo: 'lamina', area: 4.4652, prov: 'Homecenter', cat: 'Tableros y láminas', u: HC + '884212/tablero-mdf-15mm-183x244m-trupan/884232/', nota: 'Precio del 9 de octubre de 2026' },
    blanca15: { m: 'Aglomerado melamina blanco RH 15 mm, Primadera', pres: 'Lámina 1.83 × 2.44 m', precio: 226756, tipo: 'lamina', area: 4.4652, prov: 'Madecentro', cat: 'Tableros y láminas', u: MC + 'tablero-aglomerado-melamina-blanco-rh-primavera-1-83-2-44-cm', nota: 'Precio del 9 de octubre de 2026 (antes $236.204)' },
    rovere15: { m: 'Aglomerado melamina Rovere RH 15 mm, Pelikano', pres: 'Lámina 2.15 × 2.44 m', precio: 444625, tipo: 'lamina', area: 5.246, prov: 'Madecentro', cat: 'Tableros y láminas', u: MC + 'tablero-aglomerado-melamina-rovere-rh-pelikano', nota: 'En oferta el 9 de octubre de 2026 (antes $592.833)' },
    fondo6: { m: 'Fondo aglomerado melamina blanco nevado RH 6 mm, Pelikano', pres: 'Lámina 2.15 × 2.44 m', precio: 212534, tipo: 'lamina', area: 5.246, prov: 'Madecentro', cat: 'Tableros y láminas', u: MC + 'fondo-aglomerado-melamina-blanco-nevado-rh-pelikano', nota: 'Melamina en una cara; precio del 9 de octubre de 2026' },
    mdf55: { m: 'MDF 5.5 mm, Trupan', pres: 'Lámina 1.83 × 2.44 m', precio: 63900, tipo: 'lamina', area: 4.4652, prov: 'Homecenter', cat: 'Tableros y láminas', u: HC + '884212/tablero-mdf-55mm-183x244m-trupan/884236/', nota: 'Se curva en dos capas encoladas; precio del 9 de octubre de 2026' },
    perforada: { m: 'Lámina perforada de acero calibre 20, Induya', pres: 'Lámina 1.22 × 2.44 m', precio: 360900, tipo: 'lamina', area: 2.9768, prov: 'Homecenter', cat: 'Metal y perfilería', u: HC + '3022072/lamina-perforada-4x8-cal-20-tablero-herramientero/3022072/', nota: 'Negro gofrado, perforación de 6 mm cada pulgada; sin stock en línea el 9 de octubre de 2026' },
    pvc10: { m: 'Lámina de PVC espumado blanca 10 mm', pres: 'Lámina 1.22 × 2.44 m', precio: 155000, tipo: 'lamina', area: 2.9768, prov: 'Sign Colombia, Bogotá', cat: 'Tableros y láminas', u: 'https://signcolombia.com/products/laminas-de-pvc-1-22x2-44m', nota: 'Sobre pedido' },
    pvc5: { m: 'Lámina de PVC espumado blanca 5 mm', pres: 'Lámina 1.22 × 2.44 m', precio: 84800, tipo: 'lamina', area: 2.9768, prov: 'Sign Colombia, Bogotá', cat: 'Tableros y láminas', u: 'https://signcolombia.com/products/laminas-de-pvc-1-22x2-44m', nota: 'Sobre pedido' },
    hpl: { m: 'Laminado de alta presión blanco mate 0.6 mm', pres: 'Lámina 2.44 × 1.22 m', precio: 50355, tipo: 'lamina', area: 2.9768, prov: 'Madecentro', cat: 'Tableros y láminas', u: MC + 'laminado-de-alta-presion-blanco-mate-calibre-6-no-postformable', nota: 'No postformable: se pega en caras planas' },
    // vidrio y acrílico
    opal3: { m: 'Lámina de acrílico opal 3 mm', pres: 'Lámina 1.80 × 1.22 m', precio: 235620, tipo: 'lamina', area: 2.196, prov: 'Asia Colombia', cat: 'Vidrio y acrílico', u: 'https://www.asiacolombia.com.co/producto/lamina-de-acrilico-opal-3mm/', nota: 'La ficha dice «policarbonato celular» en un campo: confirmar el material al comprar' },
    acril3: { m: 'Lámina de acrílico transparente 3 mm', pres: 'Lámina 1.80 × 1.22 m', precio: 215000, tipo: 'lamina', area: 2.196, prov: 'Asia Colombia', cat: 'Vidrio y acrílico', u: 'https://www.asiacolombia.com.co/producto/lamina-de-acrilico-transparente-3mm/', nota: 'Precio del 9 de octubre de 2026' },
    vidrio10: { m: 'Vidrio templado incoloro 10 mm', pres: 'Por m², a medida', precio: 200000, tipo: 'm2', prov: 'El Ruso Shop, Bogotá', cat: 'Vidrio y acrílico', u: 'https://www.elrusoshop.com/producto/vidrio-templado-10mm-incoloro/', nota: 'Antes $240.000; precio del 9 de octubre de 2026' },
    vidrio6: { m: 'Vidrio templado incoloro 6 mm', pres: 'Por m², a medida', precio: 160000, tipo: 'm2', prov: 'El Ruso Shop, Bogotá', cat: 'Vidrio y acrílico', u: 'https://www.elrusoshop.com/producto/vidrio-templado-6mm/', nota: 'Antes $180.000; pedido mínimo de 3 m²; envío aparte' },
    // metal y perfilería
    tubo1: { m: 'Tubo cuadrado de acero 1" calibre 18', pres: 'Barra de 6 m', precio: 34900, tipo: 'barra', largo: 6, perim: 0.1016, prov: 'Homecenter', cat: 'Metal y perfilería', u: HC + '24436/tubo-cuadrado-1-x-1pg-x-12mm-c18-x-6m/24436/', nota: 'Pared de 1.2 mm' },
    tubo15: { m: 'Tubo cuadrado de acero 1-1/2" calibre 18', pres: 'Barra de 6 m', precio: 39900, tipo: 'barra', largo: 6, perim: 0.1524, prov: 'Homecenter', cat: 'Metal y perfilería', u: HC + '183862/tubo-cuadrado-1-1-2-x-1-1-2pg-x-11mm-c18-x-6m/183862/', nota: 'Pared de 1.1 mm' },
    tuboRect: { m: 'Tubo rectangular de acero 50 × 25 mm calibre 18', pres: 'Barra de 6 m', precio: 32900, tipo: 'barra', largo: 6, perim: 0.15, prov: 'Homecenter', cat: 'Metal y perfilería', u: HC + '183864/tubo-rectangular-50-x-25-x-11mm-c18-x-6m/183864/', nota: 'Pared de 1.1 mm; equivale a 2" × 1"' },
    perfil3030: { m: 'Perfil de aluminio estructural 30 × 30 T-slot', pres: 'Por metro (barra de 1 m)', precio: 45582, tipo: 'm', prov: 'Vistronica', cat: 'Metal y perfilería', u: 'https://www.vistronica.com/impresora-3d-y-cnc/perfil-de-aluminio-30x30-mm-t-slot-1-metro-para-cncimpresora-3d-detail.html', nota: 'Lista $59.976 por barra de 1 m; se aplica el 24 % de descuento que la tienda publica desde 50 unidades. Los tramos de más de 1 m se piden cortados de barra de 6 m a un distribuidor de perfilería: cotizar' },
    escuadra: { m: 'Escuadra de aluminio 3030A con tornillos M6 y 2 tuercas', pres: 'Unidad', precio: 3689, tipo: 'unidad', prov: 'Vistronica', cat: 'Metal y perfilería', u: 'https://www.vistronica.com/angulo-esquinero-de-aluminio-3030a-para-perfiles-industriales-30x30-detail.html', nota: 'Incluye su tornillería' },
    // acabados y pegantes
    anticorr: { m: 'Pintura anticorrosiva negro mate, Algreco', pres: 'Galón (3.78 L)', precio: 117900, tipo: 'galon', rend: 20, prov: 'Homecenter', cat: 'Acabados y pegantes', u: HC + '210351/pintura-anticorrosivo-mate-de-alta-proteccion-1-galon-negro/210351/', nota: 'Rinde 20 m² por mano' },
    contacto: { m: 'Pegante de contacto PL285, Afix', pres: 'Galón', precio: 112900, tipo: 'galon', rend: 6, prov: 'Homecenter', cat: 'Acabados y pegantes', u: HC + '60576/pegante-pl285-uso-profesional-1-galon/60576/', nota: 'La ficha no da rendimiento: se suponen 6 m² de laminado pegado por galón (dos caras untadas)' },
    laca: { m: 'Laca catalizada blanca semimate, Renania', pres: 'Galón', precio: 80900, tipo: 'galon', rend: 20, prov: 'Homecenter', cat: 'Acabados y pegantes', u: HC + '293241/laca-catalizada-blanca-semi-mate-1-galon/293241/', nota: 'Rinde 20 m² por mano; sin stock en línea el 9 de octubre de 2026' },
    pegante: { m: 'Pegante Carpincol para madera', pres: 'Envase de 1 kg', precio: 32900, tipo: 'unidad', prov: 'Homecenter', cat: 'Acabados y pegantes', u: HC + '203374/pegante-carpincol-para-madera-1-kilo/203374/', nota: 'Precio del 9 de octubre de 2026' },
    cantoRovere: { m: 'Canto PVC flexible Rovere 19 mm', pres: 'Por metro (rollo de 200 m)', precio: 1428, tipo: 'm', prov: 'Madecentro', cat: 'Acabados y pegantes', u: MC + 'canto-flexible-rovere-por-rollo-200', nota: '$285.600 el rollo; precio del 9 de octubre de 2026' },
    blanca15v: { m: 'Aglomerado melamina blanco RH 15 mm, Vesto (Arauco)', pres: 'Lámina 2.15 × 2.44 m', precio: 215900, tipo: 'lamina', area: 5.246, prov: 'Homecenter', cat: 'Tableros y láminas', u: HC + '884254/tablero-mdp-blanco-15mm-215x244-metros-vesto/884238/', nota: 'Capa de abajo de las tapas de 30 mm de la versión B (Nota 3); precio del 20 de octubre de 2026' },
    cantoRovere33: { m: 'Canto PVC flexible Rovere 33 mm, Orange', pres: 'Por metro (rollo de 200 m)', precio: 2190, tipo: 'm', prov: 'Madecentro', cat: 'Acabados y pegantes', u: MC + 'canto-flexible-rovere-por-rollo-200', nota: '$438.000 el rollo de 200 m; cubre en una pasada la tapa de 30 mm (Nota 3); precio del 20 de octubre de 2026' },
    canto: { m: 'Canto PVC flexible blanco 19 mm', pres: 'Por metro (rollo de 200 m)', precio: 836, tipo: 'm', prov: 'Madecentro', cat: 'Acabados y pegantes', u: MC + 'canto-flexible-blanco-por-rollo-200', nota: '$167.200 el rollo' },
    // herrajes e iluminación
    perfilLed: { m: 'Perfil de aluminio con cinta LED integrada, Bonuit', pres: 'Tramo de 3 m, 12 V', precio: 44910, tipo: 'barra', largo: 3, prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'perfil-en-aluminio-con-iluminacion-led-multicorte-empotrable-o-de-sobre-poner-negro-anodizado', nota: 'Luz cálida 3000 K con difusor' },
    cob: { m: 'Tira LED COB 12 V luz cálida, Dairu', pres: 'Rollo de 5 m', precio: 69900, tipo: 'barra', largo: 5, prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '902920/tira-led-cob-12v-5m-luz-calida-dairu/902920/', nota: 'Precio del 9 de octubre de 2026' },
    fuente3: { m: 'Fuente de poder 12 V dimerizable, Bonuit (3 m)', pres: 'Unidad', precio: 42845, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'fuente-de-poder-cinco-metros-dimerizable', nota: '' },
    fuente5: { m: 'Fuente de poder 12 V dimerizable, Bonuit (5 m)', pres: 'Unidad', precio: 48659, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'fuente-de-poder-cinco-metros-dimerizable', nota: 'Precio del 9 de octubre de 2026' },
    fuente8: { m: 'Fuente de poder 12 V dimerizable, Bonuit (8 m)', pres: 'Unidad', precio: 67250, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'fuente-de-poder-cinco-metros-dimerizable', nota: '' },
    fuente12: { m: 'Fuente de poder 12 V dimerizable, Bonuit (12 m)', pres: 'Unidad', precio: 99077, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'fuente-de-poder-cinco-metros-dimerizable', nota: '' },
    bisagraCaz: { m: 'Bisagra de cazoleta cierre lento, Bonuit', pres: 'Par con tornillos', precio: 3137, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'bisagra-de-cazoleta-para-mueble-cierre-lento', nota: '' },
    bisagraSold: { m: 'Bisagra de pistón 1/2" para soldar, Fixser', pres: 'Par', precio: 16900, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '16093/bisagra-piston-1-2pg-2und/16093/', nota: '$8.450 cada una' },
    perfilManija: { m: 'Perfil manija de aluminio para tablero de 15 mm', pres: 'Tramo de 3 m', precio: 22421, tipo: 'barra', largo: 3, prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'peralm09l-perfil-manija-alu-x-3m-tab-15mm-liviano', nota: 'Acabado natural mate; hace de gola' },
    soporteInv: { m: 'Soporte invisible tubular 3/8" × 18 cm', pres: 'Unidad', precio: 3104, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'soporte-invisible-tubular-de-3-8-x-18-cm', nota: 'Acero zincado' },
    pataNiv: { m: 'Pata niveladora para zócalo 100 mm', pres: 'Unidad', precio: 2042, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'pata-plastica-para-zocalo-peralm46-y-2249', nota: '' },
    kitBatiente: { m: 'Kit sistema batiente para puerta de vidrio', pres: 'Kit: bisagra, chapeta y manija', precio: 354900, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '558773/kit-sistema-batiente-bisagra-plana-sencilla-vidrio-pared/558773/', nota: 'Acero inoxidable; precio del 9 de octubre de 2026' },
    riel45: { m: 'Riel de extensión total 45 cm, 38 kg', pres: 'Par con tornillos', precio: 9086, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'riel-extension-total-carga-media-250-mm-38-kg-acero', nota: '' },
    manija: { m: 'Manija 416 acero negro 128 mm, Fixser', pres: 'Unidad', precio: 9900, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '3073521/manija-416-acero-128mm-negro/3073521/', nota: 'Confirmar si 128 mm es la distancia entre centros' },
    nivelador: { m: 'Nivelador de acero inoxidable rosca 5/16"', pres: 'Unidad', precio: 5246, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: 'https://madecentro.com/nivelador-con-rosca.html', nota: 'Antes $6.994. No hay rosca M8 en las tiendas consultadas: el inserto va a 5/16"' },
    kitRiel: { m: 'Kit riel para puerta deslizable negro 200 cm, Holztek', pres: 'Kit', precio: 299900, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '303177/kit-riel-puerta-deslizable/303177/', nota: 'Antes $339.900; no incluye la puerta' },
    ganchos: { m: 'Ganchos para tablero perforado, Crawford', pres: 'Juego de 43 piezas', precio: 89900, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '590124/ganchos-para-tablero-perforado-de-43-piezas-crawford/590124/', nota: 'Para tablero de 1/4"' },
    pasacable: { m: 'Pasacable rectangular PVC negro', pres: 'Unidad', precio: 1866, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: 'https://madecentro.com/collections/accesorios-para-herrajes/products/varios-pasa-cable-733', nota: '' },
    chazo: { m: 'Chazo expansivo 3/8" × 1-7/8", Fixser', pres: 'Paquete de 4', precio: 5400, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '76332/chazo-expansivo-3-8x1-7-8pg-4und-fixser/76332/', nota: '' },
    tornEns: { m: 'Tornillo de ensamble 6 × 2" zincado', pres: 'Caja de 100', precio: 6419, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'tornillo-de-ensamble-6-x-2-zincado-caja-x-100', nota: '' },
    tornAuto: { m: 'Tornillo autoperforante 6 × 5/8" zincado', pres: 'Caja de 100', precio: 2687, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: 'https://madecentro.com/collections/herrajes-y-ferreteria/products/tornillo-autoperforante-para-aglomerado-6-x-5-8-zincado-caja-x-100', nota: '' },
    tornM6: { m: 'Tornillo bristol M6 × 16 mm, Fixser', pres: 'Paquete de 2', precio: 4450, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '593138/tornillo-bristol-m6-10-x16-2-undidades-fixser/593138/', nota: '' },
    // impresión 3D
    petg: { m: 'Filamento PETG 1.75 mm, Overture', pres: 'Carrete de 1 kg', precio: 93900, tipo: 'kg', prov: 'Electronilab, Bogotá', cat: 'Impresión 3D', u: 'https://electronilab.co/tienda/filamento-3d-petg-1-75-mm-1kg-color-amarillo/', nota: 'Precio de referencia; se imprime en las impresoras del taller' }
  };

  /* ------------------------------------------------------------- versiones */
  const VERSIONES = [
    {
      id: 'A', nombre: 'Taller a la vista', corto: 'Taller', titulo: 'Acero negro, Rovere y lámina perforada',
      color: '#c9a47a',
      concepto: 'Las cuatro impresoras salen a la fachada: una vitrina de impresión trabaja de frente al pasillo del centro comercial, con los carretes colgados encima. Adentro, el cliente diseña su pieza en una barra mirando la vitrina; el muro izquierdo es el taller, con repuestos y herramientas, y el derecho la exhibición. Estructuras de tubo negro, Rovere y lámina perforada, como un banco de trabajo.',
      distribucion: ['Impresoras en la fachada, de frente al pasillo', 'Barra de diseño mirando la vitrina', 'Taller en el muro izquierdo y exhibición en el derecho', 'Pantalla de 75" en el muro del fondo'],
      materiales: ['Tubo de acero negro de 1", 1-1/2" y 50 × 25 mm, pintura negra mate', 'Melamina Rovere RH de 15 mm, en tapas dobles de 30 mm', 'Melamina blanca en los cuerpos de los cajones', 'Lámina perforada de acero calibre 20', 'Vidrio templado de 6 mm en paños'],
      ventajas: ['Lo primero que ve el pasillo son piezas imprimiéndose: el local se anuncia solo.', 'El cliente diseña viendo las impresoras: la venta y el taller ocurren en el mismo lugar.', 'Estructuras soldadas que aguantan golpes y vibración; el Rovere llega terminado de fábrica.'],
      contras: ['El operario trabaja de cara al público: el orden diario se vuelve exhibición.', 'La repisa de carretes cuelga de la losa: hay que pedir permiso al centro comercial.', 'Necesita soldador además de carpintero.']
    },
    {
      id: 'B', nombre: 'Galería', corto: 'Galería', titulo: 'MDF lacado blanco, Rovere y luz',
      color: '#9cc3e8',
      concepto: 'El local se recorre como una sala de exposición: un muro de nichos iluminados a la izquierda, tres pedestales en el eje de la entrada y una isla escultórica de tres alturas que sube hasta la barra de encuentro. El recorrido da la vuelta en U; las impresoras trabajan dentro de un nicho blanco en el muro derecho y el servicio queda al fondo, detrás de la barra.',
      distribucion: ['Recorrido en U alrededor de una isla escultórica', 'Muro de nichos a la izquierda', 'Laboratorio de impresión en un nicho a la derecha', 'Barra de encuentro y servicio al fondo'],
      materiales: ['MDF de 15 y 5.5 mm con laca catalizada blanca semimate', 'Pieles curvas de MDF de 5.5 mm en dos capas', 'Melamina Rovere en las tapas que se tocan', 'Tira COB y acrílico opal: luz escondida en cada nicho', 'Vidrio templado de 10 mm sin marco'],
      ventajas: ['El producto se muestra como obra: cada pieza tiene su nicho y su luz.', 'El centro queda libre para recorrer la isla: cabe más gente.', 'El blanco continuo agranda el local y no compite con el color de las piezas.'],
      contras: ['La laca se marca con los golpes y hay que retocarla.', 'Pieles curvas y nichos son carpintería fina: más horas de taller.', 'Las impresoras se ven desde el recorrido, pero no desde el pasillo.']
    },
    {
      id: 'C', nombre: 'Modular', corto: 'Modular', titulo: 'Aluminio y piezas impresas',
      color: '#ff9f0a',
      concepto: 'La distribución del plano original con un sistema desarmable de perfil de aluminio 30 × 30, el mismo de las impresoras y las máquinas CNC, con uniones, esquinas, bisagras y accesorios impresos en PETG en el propio taller, paneles livianos de PVC espumado y fondos de luz en acrílico opal.',
      distribucion: ['La distribución del plano original', 'Dos islas en el centro y mesa alta de atención', 'Mesón de impresoras en el muro del fondo', 'Estantería a la izquierda y guardado a la derecha'],
      materiales: ['Perfil de aluminio estructural 30 × 30 con escuadras', 'Piezas impresas en PETG naranja: esquinas, ménsulas, bisagras, tiradores', 'PVC espumado blanco de 10 y 5 mm', 'MDF con laminado de alta presión en las tapas', 'Acrílico opal iluminado'],
      ventajas: ['Todo se desarma y se reconfigura con una llave allen.', 'El mobiliario es vitrina del taller: cientos de piezas impresas a la vista.', 'Los repuestos los imprime el mismo taller.'],
      contras: ['La más cara: el perfil se paga por metro y cada unión lleva una escuadra.', 'Horas de impresora que no se dedican a ventas.', 'El PVC espumado y el acrílico se marcan con los golpes.']
    }
  ];

  /* ------------------------------------------------------------ requisitos */
  const REQ_GENERALES = [
    {
      id: 'espacio', t: 'Espacio y circulación', src: 'Plano de distribución',
      d: ['Local de 6.00 × 7.00 m: sala de ventas de 6.00 × 5.50 y trastienda de 6.00 × 1.40.',
        'Pasos libres: principal 2.00 m, lateral 1.10, entre isla y mesa 1.00 y servicio tras la mesa 0.70.',
        'Cada versión ordena el local a su manera, pero las tres dejan pasos de al menos 1.00 m para el público, 0.70 m de servicio y un acceso libre de 1.25 m o más.',
        'Los muebles que viajan armados deben pasar por el vano de acceso de 4.80 m.', 'La fachada, los muros, la mampara de la trastienda y las pantallas de los pilares no se mueven.']
    },
    {
      id: 'ergonomia', t: 'Ergonomía', src: 'Documento del proyecto y criterio de exhibición',
      d: ['Mesa de atención a 1.05 m con taburetes de asiento a 78 cm: quedan 27 cm libres para las piernas.',
        'Mesón de impresoras a 0.90 m, altura de trabajo de pie; escritorio a 0.75 m, para trabajar sentado.',
        'Producto exhibido entre 0.60 y 2.20 m; lo que más se quiere vender, entre 1.00 y 1.60 m, a la altura de los ojos (criterio de exhibición).',
        'Cajones que salgan lo suficiente para alcanzar el fondo sin agacharse.']
    },
    {
      id: 'cargas', t: 'Cargas y rigidez', src: 'Documento del proyecto',
      d: ['Cuatro impresoras de 12.95 kg que mueven masas a alta velocidad: la tapa del mesón debe ser rígida (30 mm o más) y no vibrar.',
        'Carretes de 1 kg colgados en voladizo de un gancho o un soporte.',
        'Entrepaños de hasta 1.17 m de luz que no se curven con el producto.',
        'Muebles de 2.40 m de alto anclados al muro para que no se vuelquen.']
    },
    {
      id: 'durabilidad', t: 'Durabilidad y limpieza', src: 'Documento del proyecto',
      d: ['Tableros que aguanten la humedad ambiental, con todos los cantos sellados.',
        'Superficies de roce diario (tapas y mesones) resistentes a rayado y abrasión.',
        'Repuestos fáciles de conseguir o de fabricar en el propio taller.']
    },
    {
      id: 'luz', t: 'Iluminación', src: 'Documento del proyecto',
      d: ['LED cálido de 3000 K en todo el mobiliario, igual que la luz general del local.',
        'Sin puntos de luz a la vista: perfil con difusor, tira COB o acrílico opal.',
        'Fuentes de 12 V ocultas pero alcanzables para cambiarlas.']
    },
    {
      id: 'instalaciones', t: 'Instalaciones eléctricas', src: 'Documento del proyecto',
      d: ['Cada impresora consume 350 W a 110 V: las cuatro van en un circuito propio.',
        'Toma de piso bajo la isla principal, una detrás de cada pantalla y una por cada fuente LED.',
        'Un pasacable por equipo, para que no haya cables sobre las tapas.']
    },
    {
      id: 'seguridad', t: 'Seguridad', src: 'Documento del proyecto y criterio de diseño',
      d: ['Material de seguridad en la mampara: vidrio templado o un material que no se rompa en esquirlas.',
        'El vidrio se marca a la altura de los ojos para que nadie choque.',
        'Sin aristas vivas en los muebles del centro, por donde circula la gente.',
        'Muebles altos anclados al muro y nivelados.']
    },
    {
      id: 'fabricacion', t: 'Fabricación y montaje', src: 'Documento del proyecto',
      d: ['Piezas que se sacan de láminas comerciales de 1.22 × 2.44, 1.83 × 2.44 o 2.15 × 2.44 m.',
        'Módulos de 0.60, 0.80 y 1.20 m que coinciden con los ejes de los equipos y de la exhibición.',
        'Montaje del fondo hacia la fachada, con las islas al final; el vidrio se mide con piso y cielo terminados.']
    },
    {
      id: 'marca', t: 'Imagen de marca', src: 'Imágenes de referencia',
      d: ['Paleta de la fachada: negro, blanco y madera, con la luz cálida como acento.',
        'El producto impreso es el protagonista: el mueble no debe competir con él.',
        'El local muestra lo que el taller sabe hacer.']
    },
    {
      id: 'presupuesto', t: 'Presupuesto', src: 'Documento del proyecto',
      d: ['Materiales con precio publicado en tiendas de Colombia, con su enlace.',
        'El material más caro solo donde se ve.',
        'Las cifras no incluyen mano de obra, transporte ni instalación eléctrica, en ninguna de las tres versiones.']
    }
  ];

  /* requisitos de cada mueble: lo que debe resolver, igual en las tres versiones;
     cada versión dice cómo lo cumple en su campo cumple */
  const REQ = {
    2: ['Exhibir producto en muro entre 0.60 y 2.20 m de altura', 'Luz cálida sobre el producto, sin puntos visibles', 'Entrepaños que no se curven con el producto', 'Anclada al muro: mide 2.40 m de alto', 'Guardado cerrado abajo para repuestos'],
    3: ['Exhibir producto en el centro, visible desde todos los lados', 'Sin aristas vivas en la zona de circulación', 'Superficie superior que aguante el roce diario', 'Luz que la separe del piso', 'Que entre armada por el vano de 4.80 m', 'Toma y fuente alcanzables'],
    4: ['Destacar pocas piezas, aparte del producto general', 'Que se lea como parte del conjunto', 'Esquinas sin arista', 'Luz sin cables a la vista'],
    5: ['Atender al cliente con cuatro taburetes', 'Tapa a 1.05 m: 27 cm libres sobre el asiento de 78 cm', 'Piernas libres del lado de los taburetes', 'Reposapiés a unos 0.30 m', 'Aguantar los golpes de los taburetes'],
    7: ['Cuatro impresoras, una cada 0.80 m', 'Tapa rígida para cuatro impresoras de 12.95 kg que vibran', 'Altura de trabajo de 0.90 m', 'Un pasacable por impresora', 'Guardado de filamento y repuestos abajo'],
    9: ['Carretes de 1 kg a la vista, cerca de las impresoras', 'Que no estorbe el trabajo en las impresoras', 'Sin elementos que compitan con los carretes', 'Anclaje firme'],
    10: ['Unos 3 m de guardado bajo, sin invadir los pasos libres', 'Cajones que salgan completos, con carga de repuestos', 'Tapa clara para empacar y ver piezas pequeñas', 'Muchos compartimentos para repuestos'],
    11: ['Panel de unos 2 m² sobre el guardado bajo', 'Carretes de 1 kg colgados sin que el soporte se dañe', 'Accesorios que se reubiquen sin herramientas', 'Separación del muro para los ganchos'],
    12: ['Caja de unos 0.40 × 0.15 × 1.20 m colgada a 1.05 m', 'Producto protegido del polvo y de las manos', 'Iluminación interior', 'Liviana para colgar de dos chazos'],
    13: ['Junto a la entrada: lo primero que se ve desde el pasillo', 'Exhibición alta, de 2.40 m', 'Luz sobre el producto, sin puntos visibles', 'Anclada al muro', 'Entrepaños que no se curven'],
    15: ['Cerrar el vano de 2.10 × 2.40 m con una puerta de 0.90 m', 'Que no corte si se rompe', 'Una puerta que no estorbe en la trastienda de 1.40 m', 'Visible para que nadie choque', 'Dejar pasar la luz'],
    17: ['Puesto de trabajo de 1.20 × 0.60 m en la trastienda', 'Altura de 0.75 m para trabajar sentado', 'Pasacable para el computador', 'Bajo costo: el cliente no lo ve']
  };

  /* ------------------------------------------------------- muebles B y C
     piezas: [precio, nombre, cantidad, a, b]   lamina: a × b (m)  ·  barra/m: largo a (m)  ·  m2: a × b
             [precio, uso, kg]                   kg (filamento)
     herrajes: [precio, uso, cantidad de unidades de venta]
     acabados: [precio, uso, área en m², manos]
     El orden de seq es el de la animación de armado (el campo step de cada pieza en furniture-alt.js). */
  const ITEMS = {
    A: {
      2: {
        short: 'Estantería de producto', name: 'Estantería de producto con cremalleras', dims: '2.40 × 0.40 × 2.40 m', cant: '1 (dos módulos)', ubic: 'Muro derecho, de 1.95 a 4.35 m de la fachada',
        resumen: 'Tres cremalleras de tubo negro ancladas al muro sobre un fondo de lámina perforada, con ménsulas soldadas que sostienen entrepaños de Rovere de 30 mm; abajo, dos gabinetes de Rovere y una línea de luz bajo cada entrepaño.',
        piezas: [['tuboRect', 'cremalleras de muro', 3, 1.78], ['tubo1', 'ménsulas', 12, 0.34], ['perforada', 'fondos perforados', 2, 1.14, 1.74], ['rovere15', 'laterales del gabinete', 4, 0.52, 0.38], ['rovere15', 'pisos y tapas del gabinete', 4, 1.2, 0.4], ['rovere15', 'puertas', 4, 0.596, 0.515], ['rovere15', 'entrepaños (dos capas)', 16, 1.16, 0.35], ['fondo6', 'fondos del gabinete', 2, 1.17, 0.505], ['perfilLed', 'perfiles bajo entrepaño', 8, 1.14], ['cantoRovere', 'cantos de entrepaños, puertas y gabinete', 1, 32]],
        herrajes: [['fuente12', 'Una para los 9.1 m de LED', 1], ['bisagraCaz', 'Dos por puerta', 4], ['manija', 'Una por puerta', 4], ['pataNiv', 'Cuatro por gabinete', 8], ['chazo', 'Dos por cremallera', 2], ['tornAuto', 'Herrajes y entrepaños', 1]],
        acabados: [['anticorr', 'Cremalleras y ménsulas', 1.25, 2]],
        fab: ['Cortar el tubo de 50 × 25 en tres cremalleras de 1.78 m y el de 1" en 12 ménsulas de 0.34 m.', 'Soldar las ménsulas a cada cremallera en las cuatro alturas (0.98, 1.34, 1.70 y 2.06 m), a escuadra; pulir y pintar con dos manos de anticorrosivo negro mate.', 'Cortar la lámina perforada en dos fondos de 1140 × 1740 mm y limar los bordes.', 'Pedir en Madecentro el corte y enchape del Rovere: 16 entrepaños de 1160 × 350, cuatro puertas y las piezas de los dos gabinetes.', 'Pegar los entrepaños de dos en dos para dejarlos de 30 mm y fresar la cazoleta de las bisagras.'],
        ens: ['Atornillar al muro las dos láminas perforadas y, encima, las tres cremalleras con sus ménsulas, cada una con dos chazos y a plomo.', 'Armar los dos gabinetes de Rovere con su fondo de 6 mm y sus patas niveladoras.', 'Colgar las cuatro puertas con bisagras de cierre lento y poner las manijas negras.', 'Asentar los entrepaños de 30 mm sobre las ménsulas y atornillarlos desde abajo.', 'Pegar el perfil LED bajo el canto frontal de cada entrepaño y llevar los cables a la fuente, dentro del gabinete.'],
        seq: [{ t: 'Fondo perforado y cremalleras con sus ménsulas', src: 'Ensamble 1' }, { t: 'Gabinetes bajos de Rovere', src: 'Ensamble 2' }, { t: 'Puertas y manijas negras', src: 'Ensamble 3' }, { t: 'Entrepaños de Rovere de 30 mm', src: 'Ensamble 4' }, { t: 'Perfil LED bajo cada entrepaño y fuente', src: 'Ensamble 5' }],
        why: [{ t: 'Cremallera y ménsula de acero', d: 'Las ménsulas llegan soldadas: el producto queda sobre una estructura de taller, negra y delgada, que no tapa nada.' }, { t: 'Fondo de lámina perforada', d: 'Es el tablero de herramientas de cualquier taller; aquí se vuelve fondo de exhibición y además deja colgar ganchos con producto.' }, { t: 'Rovere de 30 mm', d: 'Dos capas pegadas: en 1.16 m de luz no se curvan y el canto grueso se ve de mueble hecho a medida.' }, { t: 'Luz bajo cada entrepaño', d: 'El perfil con difusor ilumina el nivel de abajo sin que se vea un solo punto de luz.' }],
        cumple: [['si', 'Cuatro niveles entre 0.98 y 2.06 m, sobre el gabinete'], ['si', 'Perfil LED con difusor bajo cada entrepaño'], ['si', 'Rovere de 30 mm sobre ménsulas cada 1.20 m'], ['si', 'Seis chazos en tres cremalleras'], ['si', 'Dos gabinetes de Rovere con cuatro puertas']]
      },
      3: {
        short: 'Mesa de producto', name: 'Mesa de producto de acero y Rovere', dims: '1.60 × 0.70 × 0.90 m', cant: '1', ubic: 'Centro de la sala, de 3.80 a 4.50 m de la fachada, frente a la pantalla',
        resumen: 'Una mesa de taller convertida en exhibidor: bastidor y patas de tubo de 1-1/2", entrepaño de lámina perforada con luz por debajo y tapa doble de Rovere de 30 mm.',
        piezas: [['tubo15', 'patas', 4, 0.80], ['tubo15', 'largueros del bastidor', 2, 1.46], ['tubo15', 'travesaños del bastidor', 2, 0.48], ['tubo1', 'marco del entrepaño', 2, 1.38], ['tubo1', 'marco del entrepaño', 2, 0.40], ['perforada', 'entrepaño', 1, 1.38, 0.48], ['rovere15', 'tapa (dos capas)', 2, 1.6, 0.7], ['cantoRovere', 'canto de la tapa', 1, 4.8], ['cob', 'tira bajo el entrepaño', 1, 1.36]],
        herrajes: [['nivelador', 'Uno por pata', 4], ['fuente3', 'Para la tira COB', 1], ['tornAuto', 'Tapa', 1]],
        acabados: [['anticorr', 'Bastidor y patas', 1.45, 2]],
        fab: ['Cortar el tubo de 1-1/2": cuatro patas de 0.80 m, dos largueros de 1.46 m y dos travesaños de 0.48 m; el de 1" para el marco del entrepaño.', 'Soldar el bastidor y las patas a escuadra y el marco del entrepaño a 0.17 m del piso.', 'Cortar la lámina perforada en un entrepaño de 1380 × 480 y fijarla con puntos de soldadura.', 'Pulir, desengrasar y pintar con dos manos de anticorrosivo negro mate.', 'Cortar y enchapar dos tapas de Rovere de 1600 × 700 y pegarlas para dejar 30 mm.'],
        ens: ['Parar la mesa en el centro de la sala, roscar los niveladores y nivelar.', 'Pegar la tira COB bajo el entrepaño, mirando al piso, y conectarla a su fuente.', 'Asentar la tapa de 30 mm y atornillarla desde abajo al bastidor.', 'Montar el producto: las piezas grandes arriba y las cajas en el entrepaño perforado.'],
        seq: [{ t: 'Bastidor de tubo de 1-1/2" con sus patas', src: 'Fabricación 2' }, { t: 'Entrepaño perforado y niveladores', src: 'Ensamble 1' }, { t: 'Tira COB bajo el entrepaño', src: 'Ensamble 2' }, { t: 'Tapa de Rovere de 30 mm', src: 'Ensamble 3' }],
        why: [{ t: 'Mesa de taller', d: 'Patas y bastidor de tubo como un banco de trabajo: el producto se exhibe en el mismo lenguaje del taller que se ve en la vitrina.' }, { t: 'Tapa de 30 mm', d: 'Dos capas de Rovere: resiste el roce diario y no se comba en 1.60 m.' }, { t: 'Abierta por debajo', d: 'El entrepaño perforado deja ver las cajas de producto y la luz de la tira COB llega al piso.' }],
        cumple: [['si', '1.60 × 0.70 m, con 1.00 m libre alrededor'], ['parcial', 'Esquinas rectas: el canto se redondea a 3 mm'], ['si', 'Melamina Rovere de 30 mm'], ['si', 'Tira COB bajo el entrepaño'], ['si', 'Viaja armada'], ['si', 'Fuente sobre el entrepaño, a la mano']]
      },
      4: {
        short: 'Pieza del día', name: 'Pedestal de la pieza del día', dims: '0.50 × 0.50 × 1.42 m', cant: '1', ubic: 'Fachada, junto a la vitrina de impresión, a la izquierda de la entrada',
        resumen: 'Una columna de marco negro y costados de Rovere con una caja de acrílico iluminada encima: muestra al pasillo la última pieza que salió de las impresoras.',
        piezas: [['tubo1', 'parales', 4, 0.98], ['tubo1', 'marco inferior', 4, 0.5], ['rovere15', 'costados', 4, 0.45, 0.85], ['rovere15', 'tapa (dos capas)', 2, 0.5, 0.5], ['rovere15', 'sombrerete', 1, 0.42, 0.42], ['acril3', 'caja de acrílico', 4, 0.4, 0.4], ['cob', 'tira en el sombrerete', 1, 0.3], ['cantoRovere', 'cantos', 1, 4]],
        herrajes: [['nivelador', 'Uno por paral', 4], ['fuente3', 'Para la tira COB', 1]],
        acabados: [['anticorr', 'Marco', 0.55, 2]],
        fab: ['Cortar el tubo de 1": cuatro parales de 0.98 m y cuatro tramos de 0.50 m; soldar el marco a escuadra y pintarlo negro mate.', 'Cortar en Madecentro los cuatro costados y las dos tapas de Rovere, y el sombrerete de 420 × 420.', 'Cortar el acrílico en cuatro caras de 400 × 400 y pegarlas en caja.', 'Pegar la tira COB bajo el sombrerete.'],
        ens: ['Parar el marco junto a la vitrina y nivelar.', 'Atornillar los cuatro costados de Rovere por dentro del marco.', 'Asentar la tapa de 30 mm.', 'Posar la caja de acrílico con la pieza del día.', 'Taparla con el sombrerete iluminado y pasar el cable por un paral.'],
        seq: [{ t: 'Marco de tubo de 1"', src: 'Ensamble 1' }, { t: 'Costados de Rovere', src: 'Ensamble 2' }, { t: 'Tapa de 30 mm', src: 'Ensamble 3' }, { t: 'Caja de acrílico', src: 'Ensamble 4' }, { t: 'Sombrerete con luz', src: 'Ensamble 5' }],
        why: [{ t: 'La pieza del día', d: 'A la entrada y a la altura de los ojos de quien pasa: muestra la última pieza que salió de la vitrina de impresión.' }, { t: 'Caja de acrílico', d: 'Protege la pieza de las manos y deja verla por los cuatro lados.' }, { t: 'Mismo lenguaje', d: 'Marco negro y Rovere, como la vitrina que tiene al lado.' }],
        cumple: [['si', 'La pieza del día, frente al pasillo'], ['si', 'Acero negro y Rovere, como la vitrina'], ['parcial', 'Esquinas rectas con el canto redondeado'], ['si', 'Tira COB en el sombrerete; el cable baja por un paral']]
      },
      5: {
        short: 'Barra de diseño', name: 'Barra de diseño con marcos en U', dims: '2.20 × 0.70 × 1.05 m', cant: '1', ubic: 'Centro izquierdo, de 1.65 a 2.35 m de la fachada, mirando a la vitrina de impresión',
        resumen: 'La barra donde el cliente diseña su pieza con el asesor, sentado de frente a las impresoras: dos marcos en U de tubo negro, viga y reposapiés, entrepaño para el asesor y tapa doble de Rovere.',
        piezas: [['tuboRect', 'patas de los marcos en U', 4, 0.95], ['tuboRect', 'travesaños de los marcos', 2, 0.62], ['tuboRect', 'viga central', 1, 1.91], ['tubo1', 'reposapiés', 1, 2.08], ['rovere15', 'tapa (dos capas)', 2, 2.2, 0.7], ['rovere15', 'entrepaño del asesor', 1, 1.91, 0.26], ['cantoRovere', 'cantos', 1, 10]],
        herrajes: [['nivelador', 'Uno por pata', 4], ['pasacable', 'Uno por puesto de trabajo', 2], ['tornAuto', 'Tapa y entrepaño', 1]],
        acabados: [['anticorr', 'Marcos, viga y reposapiés', 1.3, 2]],
        fab: ['Cortar el tubo de 50 × 25: cuatro patas de 0.95 m, dos travesaños de 0.62 m y la viga de 1.91 m; el de 1" para el reposapiés.', 'Soldar los dos marcos en U y comprobar que queden iguales.', 'Pintar con dos manos de anticorrosivo negro mate.', 'Cortar y enchapar dos tapas de 2200 × 700 y el entrepaño; pegar las tapas para dejar 30 mm y perforar los dos pasacables.'],
        ens: ['Parar los marcos en U, roscar los niveladores y nivelar.', 'Atornillar la viga central y el reposapiés entre los marcos, a 0.30 m del lado de los taburetes.', 'Atornillar el entrepaño del asesor bajo la tapa, del lado de la vitrina.', 'Asentar la tapa de 30 mm y atornillarla a los travesaños.', 'Poner los pasacables y llevar los cables a la toma de piso.'],
        seq: [{ t: 'Marcos en U de tubo 50 × 25', src: 'Ensamble 1' }, { t: 'Viga central y reposapiés', src: 'Ensamble 2' }, { t: 'Entrepaño del asesor', src: 'Ensamble 3' }, { t: 'Tapa de Rovere de 30 mm', src: 'Ensamble 4' }, { t: 'Pasacables', src: 'Ensamble 5' }],
        why: [{ t: 'Diseñar mirando la impresora', d: 'El cliente se sienta de frente a la vitrina: ve cómo se imprime una pieza mientras diseña la suya con el asesor, que trabaja del otro lado.' }, { t: 'Marcos en U', d: 'Dejan libre todo el lado de los taburetes: caben cuatro personas sin chocar con una pata.' }, { t: 'Tapa de 30 mm a 1.05 m', d: 'Altura de barra para taburetes de 78 cm y canto grueso que aguanta codos y golpes.' }],
        cumple: [['si', '2.20 m: cuatro puestos de 0.55 m'], ['si', 'Tapa doble a 1.05 m'], ['si', 'Marcos en U: el lado de los taburetes queda libre'], ['si', 'Reposapiés de tubo a 0.30 m'], ['si', 'Acero pintado y canto de 30 mm']]
      },
      7: {
        short: 'Vitrina de impresión', name: 'Vitrina de impresión hacia el pasillo', dims: '3.20 × 0.60 × 0.90 m', cant: '1 (cuatro módulos)', ubic: 'Fachada izquierda, a 0.25 m de la línea de fachada, de 0.65 a 3.85 m del muro izquierdo',
        resumen: 'El mesón de las impresoras sale a la fachada: cinco marcos de tubo negro, frentes de lámina perforada hacia el pasillo, puertas de Rovere del lado del taller y tapa doble de 30 mm.',
        piezas: [['tuboRect', 'parales', 10, 0.85], ['tubo1', 'travesaños', 10, 0.46], ['tubo1', 'largueros', 4, 3.15], ['rovere15', 'tapa (dos capas)', 4, 1.6, 0.6], ['rovere15', 'entrepaños bajos', 4, 0.775, 0.51], ['rovere15', 'puertas del lado del taller', 8, 0.384, 0.74], ['perforada', 'frentes hacia el pasillo', 4, 0.775, 0.74], ['cob', 'tira bajo la tapa, hacia el pasillo', 1, 3.1], ['cantoRovere', 'cantos', 1, 26]],
        herrajes: [['nivelador', 'Uno por paral', 10], ['bisagraCaz', 'Dos por puerta', 8], ['manija', 'Una por puerta', 8], ['pasacable', 'Uno por impresora', 4], ['fuente5', 'Para la tira COB', 1], ['tornAuto', 'Tapa, entrepaños y frentes', 1]],
        acabados: [['anticorr', 'Estructura', 3.0, 2]],
        fab: ['Cortar el tubo de 50 × 25 en diez parales de 0.85 m y el de 1" en diez travesaños de 0.46 m y cuatro largueros de 3.15 m.', 'Soldar cinco marcos y unirlos con los largueros: un módulo de 0.80 m por impresora.', 'Pintar la estructura con dos manos de anticorrosivo negro mate.', 'Cortar la lámina perforada en cuatro frentes de 775 × 740 mm.', 'Cortar y enchapar el Rovere: cuatro tapas de 1600 × 600, cuatro entrepaños y ocho puertas; pegar las tapas de dos en dos y fresar las bisagras.'],
        ens: ['Parar la estructura a 0.25 m de la fachada, roscar los niveladores y nivelarla: las impresoras piden una tapa a nivel.', 'Atornillar los largueros y los entrepaños bajos.', 'Atornillar los frentes perforados del lado del pasillo.', 'Colgar las ocho puertas del lado del taller, con sus manijas.', 'Asentar las tapas de 30 mm y atornillarlas desde abajo.', 'Perforar un pasacable en el eje de cada impresora, pegar la tira COB bajo el canto que mira al pasillo y llevar los cables al circuito propio de las impresoras.'],
        seq: [{ t: 'Cinco marcos de tubo, uno cada 0.80 m', src: 'Fabricación 2' }, { t: 'Largueros y niveladores', src: 'Ensamble 1 · 2' }, { t: 'Entrepaños bajos de Rovere', src: 'Ensamble 2' }, { t: 'Frentes perforados hacia el pasillo', src: 'Ensamble 3' }, { t: 'Puertas del lado del taller', src: 'Ensamble 4' }, { t: 'Tapa de Rovere de 30 mm', src: 'Ensamble 5' }, { t: 'Pasacables y tira COB', src: 'Ensamble 6' }],
        why: [{ t: 'El taller es la vitrina', d: 'Las cuatro impresoras trabajan de frente al pasillo del centro comercial: quien pasa ve una pieza crecer capa por capa. Es el mejor anuncio del local.' }, { t: 'Acero y tapa de 30 mm', d: 'Cuatro equipos de 12.95 kg que mueven el cabezal a alta velocidad necesitan una base que no se mueva y una tapa rígida.' }, { t: 'Dos caras', d: 'Hacia el pasillo, lámina perforada que deja respirar los equipos; hacia adentro, puertas de Rovere para el filamento y los repuestos.' }, { t: 'Lo que se pierde', d: 'El operario trabaja de cara al público: el orden diario se vuelve parte de la exhibición.' }],
        cumple: [['si', 'Un marco cada 0.80 m'], ['si', 'Tapa de 30 mm sobre estructura soldada'], ['si', '0.90 m'], ['si', 'Cuatro pasacables'], ['si', 'Ocho puertas del lado del taller']]
      },
      9: {
        short: 'Repisa de carretes', name: 'Repisa colgante de carretes', dims: '3.20 × 0.25 m, a 1.95 y 2.30 m', cant: '1 (dos niveles)', ubic: 'Colgada de la losa sobre la vitrina de impresión',
        resumen: 'Dos repisas de Rovere colgadas de la losa con tubo negro sobre las impresoras: los carretes de colores se ven desde el pasillo como un letrero.',
        piezas: [['tubo1', 'colgantes', 4, 1.08], ['tubo1', 'brazos', 8, 0.25], ['rovere15', 'repisas', 4, 1.6, 0.25], ['cantoRovere', 'cantos', 1, 15]],
        herrajes: [['chazo', 'Uno por colgante, en la losa', 1], ['tornAuto', 'Repisas a los brazos', 1]],
        acabados: [['anticorr', 'Colgantes y brazos', 0.65, 2]],
        fab: ['Cortar el tubo de 1": cuatro colgantes de 1.08 m y ocho brazos de 0.25 m; soldar dos brazos a cada colgante, a 1.95 y 2.30 m del piso, y una platina en la punta.', 'Pintar con dos manos de anticorrosivo negro mate.', 'Cortar y enchapar cuatro repisas de Rovere de 1600 × 250.'],
        ens: ['Marcar en el cielo los cuatro ejes sobre la vitrina y anclar las platinas a la losa con chazos.', 'Atornillar las repisas a los brazos.', 'Ordenar los carretes de frente al pasillo, por color.'],
        seq: [{ t: 'Colgantes de tubo anclados a la losa', src: 'Ensamble 1' }, { t: 'Repisas de Rovere', src: 'Ensamble 2' }],
        why: [{ t: 'Los carretes también se ven desde afuera', d: 'Sobre las impresoras y a la vista del pasillo: los colores del filamento hacen de letrero.' }, { t: 'Colgada de la losa', d: 'Sin muro detrás, la repisa cuelga del techo y deja la vitrina libre para trabajar.' }, { t: 'Lo que hay que revisar', d: 'Antes de perforar hay que confirmar con la administración del centro comercial que la losa admite anclajes.' }],
        cumple: [['si', '26 carretes sobre las impresoras'], ['si', 'A 1.95 m: 36 cm sobre la unidad AMS'], ['si', 'Repisa delgada y colgantes negros'], ['parcial', 'Anclada a la losa: hay que pedir permiso al centro comercial']]
      },
      10: {
        short: 'Cajonera de repuestos', name: 'Cajonera de repuestos sobre base de tubo', dims: '3.00 × 0.50 × 0.90 m', cant: '1 (cinco módulos)', ubic: 'Muro izquierdo, de 1.20 a 4.20 m de la fachada',
        resumen: 'Cinco cuerpos de melamina blanca con 15 cajones de frente Rovere y manija negra, sobre una base de tubo con niveladores y bajo una tapa doble de Rovere: el guardado del taller.',
        piezas: [['tubo1', 'base: largueros', 2, 3.0], ['tubo1', 'base: travesaños', 6, 0.39], ['blanca15', 'laterales', 10, 0.74, 0.48], ['blanca15', 'pisos y amarres', 10, 0.57, 0.47], ['fondo6', 'fondos', 5, 0.59, 0.74], ['blanca15', 'costados de las cajas', 15, 1.9, 0.17], ['fondo6', 'fondos de las cajas', 15, 0.54, 0.44], ['rovere15', 'frentes', 15, 0.596, 0.242], ['rovere15', 'tapa (dos capas)', 4, 1.5, 0.5], ['canto', 'cantos blancos', 1, 40], ['cantoRovere', 'cantos de frentes y tapa', 1, 28]],
        herrajes: [['riel45', 'Un par por cajón', 15], ['manija', 'Una por cajón', 15], ['nivelador', 'Seis bajo la base', 6], ['tornEns', 'Cuerpos', 1], ['tornAuto', 'Rieles y frentes', 2]],
        acabados: [['anticorr', 'Base', 0.95, 2]],
        fab: ['Cortar el tubo de 1", soldar la base de 3.00 × 0.50 m con seis travesaños y pintarla negro mate.', 'Pedir en Madecentro el corte y enchape de los cinco cuerpos en melamina blanca y de los 15 frentes y la tapa en Rovere.', 'Armar las 15 cajas de cajón con costados blancos y fondo de 6 mm.', 'Pegar las dos capas de la tapa para dejarla de 30 mm.'],
        ens: ['Poner la base contra el muro izquierdo, desde 1.20 m de la fachada, roscar los niveladores y nivelar.', 'Armar los cinco cuerpos sobre la base y unirlos entre sí.', 'Atornillar los rieles y meter las cajas de cajón.', 'Atornillar los frentes de Rovere y las manijas, y alinearlos.', 'Asentar la tapa de 30 mm.'],
        seq: [{ t: 'Base de tubo con niveladores', src: 'Ensamble 1' }, { t: 'Cinco cuerpos de melamina blanca', src: 'Ensamble 2' }, { t: 'Rieles y cajas de cajón', src: 'Ensamble 3' }, { t: 'Frentes de Rovere y manijas', src: 'Ensamble 4' }, { t: 'Tapa de 30 mm', src: 'Ensamble 5' }],
        why: [{ t: 'Repuestos al lado del taller', d: 'Contra el muro izquierdo, entre la vitrina y el fondo: el operario saca boquillas, camas y filamento sin cruzar el local.' }, { t: 'Base de tubo', d: 'Levanta el mueble del piso como un mueble de taller y deja barrer debajo.' }, { t: 'Rieles de extensión total', d: 'El cajón sale completo y aguanta 38 kg: se ve todo lo que hay al fondo.' }],
        cumple: [['si', '3.00 × 0.50 m contra el muro izquierdo'], ['si', 'Rieles de extensión total de 38 kg'], ['parcial', 'Tapa de Rovere: más oscura que una blanca para piezas pequeñas'], ['si', '15 cajones']]
      },
      11: {
        short: 'Panel de herramientas', name: 'Panel de herramientas de lámina perforada', dims: '3.00 × 0.03 × 1.20 m', cant: '1', ubic: 'Muro izquierdo, sobre la cajonera, con el borde inferior a 1.05 m',
        resumen: 'Un marco de tubo de 1" anclado al muro con dos láminas perforadas negras: herramientas, carretes y accesorios colgados a la vista, como en el tablero de un taller.',
        piezas: [['tubo1', 'marco: travesaños', 2, 3.0], ['tubo1', 'marco: parales', 3, 1.15], ['perforada', 'láminas', 2, 1.48, 1.19]],
        herrajes: [['ganchos', 'Ganchos y soportes', 1], ['chazo', 'Seis anclajes', 2], ['tornAuto', 'Láminas al marco', 1]],
        acabados: [['anticorr', 'Marco', 0.95, 2]],
        fab: ['Cortar el tubo de 1": dos travesaños de 3.00 m y tres parales de 1.15 m; soldar el marco y pintarlo negro mate.', 'Cortar dos láminas perforadas de 1480 × 1190 mm y limar los bordes.'],
        ens: ['Anclar el marco al muro con seis chazos, con el borde inferior a 1.05 m, sobre la cajonera.', 'Atornillar las dos láminas al marco: el tubo las separa 25 mm del muro, lo que necesitan los ganchos.', 'Colgar ganchos, carretes, herramientas y accesorios.'],
        seq: [{ t: 'Marco de tubo anclado al muro', src: 'Ensamble 1' }, { t: 'Láminas perforadas', src: 'Ensamble 2' }, { t: 'Ganchos, carretes y herramientas', src: 'Ensamble 3' }],
        why: [{ t: 'El tablero del taller', d: 'Herramientas y accesorios a la vista, en el mismo muro del taller: el cliente ve con qué se termina una pieza.' }, { t: 'Marco de tubo', d: 'Separa la lámina del muro para los ganchos y le da rigidez en 3.00 m.' }],
        cumple: [['si', '3.00 × 1.20 m sobre la cajonera'], ['si', 'Lámina de acero calibre 20'], ['si', 'Ganchos de tablero perforado'], ['si', 'El marco separa 25 mm']]
      },
      12: {
        short: 'Vitrina mural', name: 'Vitrina mural de Rovere y acero', dims: '0.40 × 0.15 × 1.20 m', cant: '1', ubic: 'Muro derecho, a 4.60 m de la fachada, con la base a 1.05 m',
        resumen: 'Una caja de Rovere con esquineros de acero negro, entrepaños y frente de acrílico y un perfil LED vertical: las piezas pequeñas, a la altura de la mano.',
        piezas: [['tubo1', 'esquineros', 4, 1.2], ['rovere15', 'fondo', 1, 0.36, 1.2], ['rovere15', 'piso y techo', 2, 0.36, 0.135], ['acril3', 'frente', 1, 0.4, 1.2], ['acril3', 'entrepaños', 3, 0.36, 0.13], ['perfilLed', 'perfil vertical', 1, 1.14]],
        herrajes: [['fuente3', 'Para el perfil', 1], ['chazo', 'Dos anclajes', 1]],
        acabados: [['anticorr', 'Esquineros', 0.5, 2]],
        fab: ['Cortar cuatro esquineros de tubo de 1" de 1.20 m y pintarlos negro mate.', 'Cortar el fondo, el piso y el techo de Rovere.', 'Cortar el acrílico: el frente de 400 × 1200 y tres entrepaños.'],
        ens: ['Atornillar los esquineros y colgar el conjunto del muro derecho con dos chazos, a 1.05 m.', 'Armar la caja de Rovere dentro de los esquineros.', 'Apoyar los entrepaños de acrílico y poner el frente.', 'Pegar el perfil LED en la esquina interior y conectar la fuente, escondida sobre el techo.'],
        seq: [{ t: 'Esquineros de acero y anclaje', src: 'Ensamble 1' }, { t: 'Caja de Rovere', src: 'Ensamble 2' }, { t: 'Entrepaños y frente de acrílico', src: 'Ensamble 3' }, { t: 'Perfil LED y fuente', src: 'Ensamble 4' }],
        why: [{ t: 'Las piezas pequeñas', d: 'Joyería, miniaturas y repuestos finos detrás de acrílico, a la altura de la mano.' }, { t: 'Mismo lenguaje', d: 'Esquineros negros y Rovere, como la torre y la estantería.' }],
        cumple: [['si', '0.40 × 0.15 × 1.20 m a 1.05 m'], ['si', 'Frente de acrílico'], ['si', 'Perfil LED vertical'], ['parcial', 'Los esquineros de acero la hacen la más pesada de las tres']]
      },
      13: {
        short: 'Torre de producto', name: 'Torre de producto junto a la entrada', dims: '1.20 × 0.40 × 2.40 m', cant: '1', ubic: 'Muro derecho, de 0.25 a 1.45 m de la fachada',
        resumen: 'Dos marcos escalera de tubo negro con seis entrepaños de Rovere, fondo de lámina perforada y un perfil LED vertical en cada marco: lo primero que se ve al entrar por la derecha.',
        piezas: [['tubo1', 'parales', 4, 2.38], ['tubo1', 'peldaños', 12, 0.35], ['tubo1', 'largueros traseros', 2, 1.15], ['perforada', 'fondo', 1, 1.15, 2.25], ['rovere15', 'entrepaños', 6, 1.15, 0.39], ['perfilLed', 'perfiles verticales', 2, 2.15], ['cantoRovere', 'cantos', 1, 8]],
        herrajes: [['nivelador', 'Uno por paral', 4], ['fuente8', 'Para los perfiles', 1], ['chazo', 'Anclaje', 1], ['tornAuto', 'Entrepaños y fondo', 1]],
        acabados: [['anticorr', 'Marcos', 1.6, 2]],
        fab: ['Cortar el tubo de 1": cuatro parales de 2.38 m, doce peldaños de 0.35 m y dos largueros de 1.15 m.', 'Soldar dos marcos escalera, comprobar la escuadra por diagonales y pintarlos negro mate.', 'Cortar la lámina perforada de fondo de 1150 × 2250 mm.', 'Cortar y enchapar seis entrepaños de Rovere de 1150 × 390.'],
        ens: ['Parar los dos marcos contra el muro derecho, junto a la entrada, y unirlos con los largueros traseros.', 'Roscar los niveladores, nivelar, anclar con dos chazos y atornillar el fondo perforado.', 'Asentar los seis entrepaños sobre los peldaños.', 'Pegar un perfil LED vertical en cada marco y conectar la fuente sobre la torre.'],
        seq: [{ t: 'Dos marcos escalera de tubo', src: 'Ensamble 1' }, { t: 'Niveladores, anclaje y fondo perforado', src: 'Ensamble 2' }, { t: 'Entrepaños de Rovere', src: 'Ensamble 3' }, { t: 'Perfiles LED verticales', src: 'Ensamble 4' }],
        why: [{ t: 'Lo primero que se ve', d: 'Junto a la entrada y frente al pasillo: una torre negra con producto iluminado, del mismo lenguaje que la vitrina de impresión.' }, { t: 'Marcos escalera', d: 'Los peldaños soldados sostienen los entrepaños sin herrajes a la vista.' }, { t: 'Luz vertical', d: 'Dos perfiles en los marcos iluminan todos los niveles de lado, sin sombras de entrepaño.' }],
        cumple: [['si', 'Muro derecho, junto a la entrada'], ['si', 'Seis niveles hasta 2.40 m'], ['si', 'Dos perfiles LED verticales'], ['si', 'Dos chazos'], ['si', 'Luz de 1.15 m en Rovere sobre peldaños de acero']]
      },
      15: {
        short: 'Mampara de acero', name: 'Mampara de acero y vidrio en cuadrícula', dims: '2.10 × 0.10 × 2.40 m', cant: '1', ubic: 'Fondo derecho: fijo de 1.00 m, puerta de 0.90 m y columna de 0.15 m',
        resumen: 'Un marco de tubo negro en cuadrícula con paños de vidrio templado de 6 mm y una puerta batiente del mismo sistema, con bisagras de pistón soldadas.',
        piezas: [['tuboRect', 'jamba y montantes', 3, 2.4], ['tuboRect', 'cabezal', 1, 2.0], ['tuboRect', 'travesaños del fijo', 3, 0.95], ['tuboRect', 'puerta: largueros', 2, 2.3], ['tuboRect', 'puerta: travesaños', 3, 0.78], ['vidrio6', 'paños del fijo', 3, 0.94, 0.75], ['vidrio6', 'paños de la puerta', 2, 0.77, 1.03]],
        herrajes: [['bisagraSold', 'Tres bisagras de pistón (dos pares)', 2], ['manija', 'Tirador de la puerta', 1], ['chazo', 'Anclajes', 1], ['tornM6', 'Junquillos del vidrio', 2]],
        acabados: [['anticorr', 'Marco y puerta', 2.9, 2]],
        fab: ['Medir el vano terminado. Cortar el tubo de 50 × 25 para la jamba, los montantes, el cabezal, los travesaños y el marco de la puerta.', 'Soldar el fijo en cuadrícula y la puerta, comprobando las diagonales; soldar las bisagras de pistón.', 'Pintar con dos manos de anticorrosivo negro mate.', 'Pedir a la vidriería cinco paños de templado de 6 mm a la medida de la cuadrícula ya soldada.'],
        ens: ['Anclar el marco fijo a piso, muro y cielo con chazos.', 'Asentar los tres paños del fijo con silicona y junquillo atornillado.', 'Colgar la puerta en sus bisagras y poner sus dos paños.', 'Poner el tirador y regular la puerta.'],
        seq: [{ t: 'Marco fijo en cuadrícula, anclado', src: 'Ensamble 1' }, { t: 'Paños de vidrio del fijo', src: 'Ensamble 2' }, { t: 'Puerta de acero y vidrio', src: 'Ensamble 3' }, { t: 'Bisagras de pistón y tirador', src: 'Ensamble 4' }],
        why: [{ t: 'Cuadrícula de acero', d: 'Los travesaños a 0.80 y 1.60 m hacen visible el vidrio sin franjas pegadas y repiten el negro de la vitrina.' }, { t: 'Templado de 6 mm', d: 'En paños de menos de 1 m² basta el espesor menor: si se rompe, lo hace en fragmentos pequeños.' }, { t: 'Lo que se pierde', d: 'La puerta batiente barre 0.90 m de la trastienda al abrir.' }],
        cumple: [['si', 'Fijo de 1.00 m y puerta de 0.88 m'], ['si', 'Vidrio templado en paños'], ['parcial', 'Batiente: barre 0.90 m de la trastienda'], ['si', 'Travesaños de acero a 0.80 y 1.60 m'], ['si', 'Vidrio incoloro']]
      },
      17: {
        short: 'Escritorio de taller', name: 'Escritorio de taller con faldón perforado', dims: '1.20 × 0.60 × 0.75 m', cant: '1', ubic: 'Trastienda, contra el muro del fondo, al centro',
        resumen: 'Con las impresoras en la fachada, la trastienda queda para diseñar y para lijar y pintar piezas: marco de tubo negro, faldón de lámina perforada para las herramientas y tapa doble de Rovere.',
        piezas: [['tubo1', 'patas', 4, 0.7], ['tubo1', 'bastidor', 2, 1.12], ['tubo1', 'bastidor', 2, 0.47], ['tubo1', 'reposapiés', 1, 1.07], ['perforada', 'faldón', 1, 1.07, 0.39], ['rovere15', 'tapa (dos capas)', 2, 1.2, 0.6], ['cantoRovere', 'canto', 1, 4]],
        herrajes: [['nivelador', 'Uno por pata', 4], ['pasacable', 'Para el computador', 1]],
        acabados: [['anticorr', 'Estructura', 0.75, 2]],
        fab: ['Cortar el tubo de 1" y soldar patas, bastidor y reposapiés; pintar negro mate.', 'Cortar el faldón de lámina perforada y soldarlo por puntos.', 'Cortar dos tapas de Rovere de 1200 × 600 y pegarlas para dejar 30 mm.'],
        ens: ['Parar la estructura en la trastienda y nivelar.', 'Colgar del faldón perforado las herramientas de lijado y acabado.', 'Asentar la tapa, atornillarla y poner el pasacable.'],
        seq: [{ t: 'Estructura de tubo de 1"', src: 'Ensamble 1' }, { t: 'Faldón de lámina perforada', src: 'Ensamble 2' }, { t: 'Tapa de Rovere y pasacable', src: 'Ensamble 3' }],
        why: [{ t: 'Puesto de acabado', d: 'El faldón perforado tiene a mano las herramientas de lijado y pintura.' }, { t: 'Mismo sistema', d: 'Tubo de 1" y Rovere, como el resto del mobiliario de esta versión.' }],
        cumple: [['si', '1.20 × 0.60 m'], ['si', 'Tapa a 0.75 m'], ['si', 'Pasacable en la esquina'], ['parcial', 'Tapa de 30 mm y faldón perforado: más caro que un escritorio simple']]
      }
    },
    B: {
      2: {
        short: 'Muro de nichos', name: 'Muro de nichos iluminados', dims: '4.20 × 0.35 × 2.40 m', cant: '1 (tres módulos)', ubic: 'Muro izquierdo, de 0.60 a 4.80 m de la fachada',
        resumen: 'Una retícula de MDF lacado blanco con nichos de distinto tamaño, cada fila iluminada por una tira COB escondida bajo el entrepaño, sobre un zócalo con puertas: el muro de una galería.',
        piezas: [['mdf15', 'costados', 4, 2.3, 0.35], ['mdf15', 'entrepaños y techos', 12, 1.38, 0.34], ['mdf15', 'divisiones', 4, 0.63, 0.34], ['mdf15', 'pisos del zócalo', 3, 1.38, 0.27], ['mdf15', 'zócalos', 3, 1.38, 0.1], ['mdf15', 'puertas', 6, 0.69, 0.5], ['mdf55', 'fondos', 3, 1.38, 2.3], ['cob', 'una tira por fila de nichos', 9, 1.34]],
        herrajes: [['fuente12', 'Para las nueve tiras', 2], ['pataNiv', 'Cuatro por módulo', 12], ['chazo', 'Seis anclajes', 2], ['bisagraCaz', 'Dos por puerta', 6], ['tornEns', 'Cuerpo', 2], ['pegante', 'Entrepaños y divisiones encolados', 1]],
        acabados: [['laca', 'Costados, entrepaños, divisiones, puertas y fondos', 33.5, 2]],
        fab: ['Cortar el MDF de 15 mm: cuatro costados de 2.30 m, doce entrepaños y techos, cuatro divisiones, pisos, zócalos y seis puertas; el de 5.5 mm en tres fondos.', 'Ranurar costados y fondos para encajar entrepaños y divisiones, y fresar una muesca en el canto de cada puerta como tirador.', 'Ranurar bajo cada entrepaño el canal de la tira COB, con un labio de 2 cm que la esconda.', 'Lijar, sellar y aplicar dos manos de laca catalizada blanca semimate a todas las caras vistas.'],
        ens: ['Parar los zócalos con sus patas niveladoras contra el muro izquierdo y nivelar.', 'Armar los costados con los fondos lacados y anclar el conjunto con seis chazos.', 'Encajar y encolar entrepaños, techos y divisiones: cada módulo tiene una retícula distinta.', 'Colgar las puertas del zócalo.', 'Pegar la tira COB en el canal de cada entrepaño y llevar los cables a las dos fuentes, dentro del zócalo.'],
        seq: [{ t: 'Zócalos y patas niveladoras', src: 'Ensamble 1' }, { t: 'Costados, fondos lacados y anclaje', src: 'Ensamble 2' }, { t: 'Entrepaños y divisiones: una retícula por módulo', src: 'Ensamble 3' }, { t: 'Puertas del zócalo', src: 'Ensamble 4' }, { t: 'Una tira de luz por fila de nichos', src: 'Ensamble 5' }],
        why: [{ t: 'Un muro de galería', d: 'Nichos de distinto tamaño, como una sala de museo: cada pieza tiene su marco y su luz, y el recorrido empieza aquí.' }, { t: 'MDF lacado', d: 'Da un blanco continuo y sin vetas que no compite con el producto, y se repara con lija y laca.' }, { t: 'Luz escondida', d: 'La tira COB va en un canal bajo cada entrepaño: el nicho se ilumina sin que se vea la fuente.' }, { t: 'Lo que se pierde', d: 'Es el mueble más grande del local: 4.20 m de muro y cuatro galones de laca.' }],
        cumple: [['si', 'Nichos entre 0.62 y 2.38 m'], ['si', 'Tira COB escondida en cada fila'], ['si', 'Entrepaños de 1.38 m encajados en ranura'], ['si', 'Seis chazos'], ['si', 'Zócalo con seis puertas']]
      },
      3: {
        short: 'Isla escultórica', name: 'Isla escultórica de tres alturas', dims: '1.20 × 1.60 × 0.92 m', cant: '1 (tres volúmenes)', ubic: 'En el eje de la entrada, de 1.20 a 2.80 m de la fachada',
        resumen: 'Tres volúmenes lacados de puntas redondeadas que suben de 0.46 a 0.92 m hacia la barra: una escultura en el centro del local que obliga a recorrerlo alrededor.',
        piezas: [['mdf15', 'pisos', 3, 0.95, 0.55], ['mdf15', 'costillas', 6, 0.5, 0.6], ['mdf15', 'tapas lacadas', 2, 0.9, 0.5], ['rovere15', 'tapa del volumen alto', 1, 1.2, 0.6], ['mdf55', 'pieles curvas (dos capas)', 2, 8.5, 0.6], ['mdf15', 'zócalos', 1, 8.5, 0.08], ['cob', 'tira en los zócalos', 1, 8.0], ['cantoRovere33', 'canto de la tapa de Rovere', 1, 3.2]],
        herrajes: [['fuente8', 'Para los 8 m de tira COB (35 W)', 1], ['pegante', 'Pieles curvas encoladas', 2], ['tornAuto', 'Tapas', 1]],
        acabados: [['laca', 'Pieles y tapas', 6.5, 2], ['anticorr', 'Zócalos negros', 0.7, 1]],
        fab: ['Cortar en MDF de 15 mm los pisos, las costillas y las tapas con las puntas redondeadas, y la tapa del volumen alto en Rovere.', 'Curvar las pieles de MDF de 5.5 mm en dos capas encoladas sobre las costillas, con las juntas cruzadas.', 'Masillar, lijar y aplicar dos manos de laca catalizada blanca.', 'Pintar los zócalos de negro y ranurarlos para la tira COB.'],
        ens: ['Poner los tres zócalos en el centro del local, alineados con la entrada.', 'Encajar y atornillar los volúmenes sobre sus zócalos, del más alto al más bajo.', 'Asentar las tapas.', 'Pegar la tira COB en los zócalos y conectar la fuente; la toma de piso queda bajo el volumen alto.'],
        seq: [{ t: 'Pisos, costillas y zócalos', src: 'Ensamble 1' }, { t: 'Pieles curvas de MDF lacado', src: 'Ensamble 2' }, { t: 'Tapas: la del volumen alto en Rovere', src: 'Ensamble 3' }, { t: 'Tira COB y fuente', src: 'Ensamble 4' }],
        why: [{ t: 'Una escultura en el eje', d: 'Tres volúmenes que suben hacia la barra: desde la entrada se leen como una sola pieza y llevan al visitante a recorrer el local alrededor.' }, { t: 'Tres alturas', d: '0.46, 0.70 y 0.92 m: las piezas grandes abajo y las finas arriba, como en una sala de exposición.' }, { t: 'Lo que se pierde', d: 'Las pieles curvas se hacen a mano sobre molde: es el mueble de más horas de taller de la versión.' }],
        cumple: [['si', 'En el eje de la entrada, con 1.80 m libres a cada lado'], ['si', 'Puntas redondeadas de 0.20 a 0.30 m'], ['parcial', 'Laca: hay que retocarla con los años'], ['si', 'Tira COB en el zócalo de los tres volúmenes'], ['si', 'Llega en tres volúmenes'], ['si', 'Toma de piso bajo el volumen alto']]
      },
      4: {
        short: 'Pedestales', name: 'Pedestales de entrada', dims: '0.90 × 0.60 × 1.06 m', cant: '3 cilindros', ubic: 'En el eje de la entrada, de 0.45 a 1.05 m de la fachada',
        resumen: 'Tres cilindros lacados de 0.62, 0.86 y 1.06 m con un aro de luz en el zócalo: reciben al visitante con una pieza cada uno y abren el recorrido a los dos lados.',
        piezas: [['mdf15', 'pisos y tapas', 6, 0.34, 0.34], ['mdf55', 'pieles curvas (dos capas)', 2, 3.1, 0.75], ['mdf15', 'zócalos', 1, 2.8, 0.07], ['cob', 'aro de luz en cada zócalo', 1, 2.8]],
        herrajes: [['fuente3', 'Para los tres aros', 1], ['pegante', 'Pieles encoladas', 1]],
        acabados: [['laca', 'Pieles y tapas', 2.8, 2], ['anticorr', 'Zócalos negros', 0.2, 1]],
        fab: ['Cortar en MDF de 15 mm seis discos (pisos y tapas) y tres aros de zócalo.', 'Curvar las pieles de MDF de 5.5 mm en dos capas sobre los discos.', 'Masillar, lijar y lacar en blanco; pintar los zócalos de negro.'],
        ens: ['Ubicar los zócalos en el eje de la entrada, a 0.45 m de la fachada.', 'Encajar los cilindros lacados.', 'Asentar las tapas.', 'Pegar el aro de luz en cada zócalo, conectar la fuente y poner una pieza sobre cada pedestal.'],
        seq: [{ t: 'Discos y zócalos', src: 'Ensamble 1' }, { t: 'Pieles curvas lacadas', src: 'Ensamble 2' }, { t: 'Tapas', src: 'Ensamble 3' }, { t: 'Aros de luz', src: 'Ensamble 4' }],
        why: [{ t: 'La entrada de la galería', d: 'Tres piezas a distinta altura reciben al visitante en el eje del local y lo abren a los dos lados del recorrido.' }, { t: 'Cilindros', d: 'Sin esquinas: se pasa a su lado sin golpearse.' }],
        cumple: [['si', 'Tres piezas en el eje de la entrada'], ['si', 'Mismo MDF lacado y zócalo negro que la isla'], ['si', 'Cilindros, sin esquinas'], ['si', 'Aro de luz en cada zócalo']]
      },
      5: {
        short: 'Barra de encuentro', name: 'Barra de encuentro', dims: '1.80 × 0.70 × 1.05 m', cant: '1', ubic: 'Detrás de la isla escultórica, de 2.80 a 3.50 m de la fachada',
        resumen: 'Donde termina la isla: un volumen lacado cerrado con tapa doble de Rovere que vuela 0.30 m sobre el lado de los taburetes, reposapiés de tubo y luz bajo el voladizo.',
        piezas: [['mdf15', 'frente y fondo', 2, 1.8, 0.94], ['mdf15', 'costados', 2, 0.4, 0.94], ['mdf15', 'piso y costillas', 4, 0.38, 0.9], ['mdf15', 'zócalo', 1, 1.7, 0.08], ['rovere15', 'tapa de 30 mm (dos capas), capa de arriba', 1, 1.8, 0.7], ['blanca15v', 'tapa de 30 mm (dos capas), capa de abajo', 1, 1.8, 0.7], ['tubo1', 'reposapiés', 1, 1.6], ['tubo1', 'soportes del reposapiés', 3, 0.06], ['cob', 'tira bajo el voladizo', 1, 1.7], ['cantoRovere33', 'canto de la tapa', 1, 5]],
        herrajes: [['fuente3', 'Para la tira COB', 1], ['pasacable', 'Para la tableta', 1], ['tornEns', 'Cuerpo', 1], ['pegante', 'Uniones', 1]],
        acabados: [['laca', 'Cuerpo por fuera', 4.4, 2], ['anticorr', 'Reposapiés y zócalo', 0.4, 2]],
        fab: ['Cortar en MDF de 15 mm el frente, el fondo, los costados, el piso y las costillas.', 'Armar el cuerpo encolado y atornillado; masillar, lijar y lacar en blanco.', 'Cortar la tapa de Rovere de 1800 × 700 y su capa de abajo en melamina blanca, pegarlas y enchapar el canto Rovere de 33 mm.', 'Cortar el tubo de 1" para el reposapiés y sus soportes, soldar y pintar negro mate.'],
        ens: ['Armar el piso, las costillas y el zócalo detrás del volumen alto de la isla, tocándolo, y nivelar.', 'Cerrar el cuerpo con el frente, los costados y el fondo lacados.', 'Atornillar el reposapiés al frente, a 0.30 m del piso.', 'Asentar la tapa: vuela 0.30 m sobre el lado de los taburetes.', 'Pegar la tira COB bajo el voladizo y poner el pasacable.'],
        seq: [{ t: 'Piso, costillas y zócalo', src: 'Ensamble 1' }, { t: 'Frente, costados y fondo lacados', src: 'Ensamble 2' }, { t: 'Reposapiés de tubo', src: 'Ensamble 3' }, { t: 'Tapa de Rovere de 30 mm en voladizo', src: 'Ensamble 4' }, { t: 'Tira COB y pasacable', src: 'Ensamble 5' }],
        why: [{ t: 'Donde termina la isla', d: 'La escultura sube hasta la barra: el cliente se sienta con el asesor al final del recorrido, mirando el local hacia la entrada.' }, { t: 'Voladizo de 0.30 m', d: 'Deja espacio para las rodillas sin patas a la vista: desde la entrada la barra se ve como un volumen cerrado.' }, { t: 'Rovere en la tapa', d: 'La única madera de la isla está donde se apoyan los codos: más cálida y más resistente que la laca.' }],
        cumple: [['si', '1.80 m: cuatro taburetes de frente al local'], ['si', 'Tapa doble a 1.05 m'], ['si', 'Voladizo de 0.30 m sin patas'], ['si', 'Reposapiés de tubo a 0.30 m'], ['parcial', 'La laca del frente se marca; el reposapiés la protege']]
      },
      7: {
        short: 'Laboratorio de impresión', name: 'Laboratorio de impresión en nicho', dims: '3.20 × 0.64 × 2.37 m', cant: '1 (cuatro módulos)', ubic: 'Muro derecho, de 2.30 a 5.50 m de la fachada',
        resumen: 'Las impresoras trabajan dentro de un nicho blanco iluminado, como una obra de la galería: base lacada de cuatro módulos con tapa de Rovere de 30 mm, costados altos y un dintel con luz.',
        piezas: [['mdf15', 'laterales', 5, 0.77, 0.58], ['mdf15', 'pisos y entrepaños', 8, 0.78, 0.57], ['mdf15', 'puertas', 8, 0.4, 0.76], ['mdf55', 'fondos', 4, 0.78, 0.77], ['mdf15', 'zócalo', 1, 3.2, 0.1], ['rovere15', 'tapa de 30 mm (dos capas), capa de arriba', 2, 1.6, 0.6], ['blanca15v', 'tapa de 30 mm (dos capas), capa de abajo', 2, 1.6, 0.6], ['mdf15', 'costados del nicho', 2, 2.25, 0.64], ['mdf15', 'dintel', 2, 3.24, 0.64], ['perfilLed', 'bajo el dintel', 2, 1.5], ['cantoRovere33', 'canto de la tapa', 1, 8]],
        herrajes: [['bisagraCaz', 'Dos por puerta', 8], ['pataNiv', 'Dos por lateral', 10], ['pasacable', 'Uno por impresora', 4], ['fuente8', 'Para el perfil del dintel y el de la repisa de filamentos (42 W)', 1], ['chazo', 'Anclaje del nicho', 2], ['tornEns', 'Cuerpos', 2]],
        acabados: [['laca', 'Cuerpos, puertas y nicho', 19, 2]],
        fab: ['Cortar en MDF de 15 mm los cinco laterales, pisos, entrepaños y ocho puertas, y en 5.5 mm los fondos.', 'Cortar los dos costados del nicho de 2.25 m y el dintel; ranurar el dintel para el perfil LED.', 'Lijar, sellar y lacar en blanco todas las caras vistas.', 'Cortar la tapa en dos tramos por capa (arriba Rovere, abajo melamina blanca); pegarlas para dejar 30 mm, enchapar el canto Rovere de 33 mm y perforar cuatro pasacables.'],
        ens: ['Armar la base de cuatro módulos contra el muro derecho, sobre sus patas, y nivelarla.', 'Colgar las ocho puertas.', 'Asentar la tapa de 30 mm y poner los pasacables, uno en el eje de cada impresora.', 'Parar los costados del nicho a los dos extremos y anclarlos al muro.', 'Poner el dintel, pegar el perfil LED debajo y conectar la fuente.'],
        seq: [{ t: 'Base de cuatro módulos lacados', src: 'Ensamble 1' }, { t: 'Puertas', src: 'Ensamble 2' }, { t: 'Tapa de Rovere de 30 mm y pasacables', src: 'Ensamble 3' }, { t: 'Costados del nicho', src: 'Ensamble 4' }, { t: 'Dintel con luz', src: 'Ensamble 5' }],
        why: [{ t: 'El taller como pieza de galería', d: 'Las impresoras trabajan dentro de un nicho blanco iluminado: se ven desde todo el recorrido sin ocupar el centro.' }, { t: 'Junto a la trastienda', d: 'El filamento y los repuestos quedan a pocos pasos, al otro lado de la mampara; por eso la puerta pasa a la izquierda.' }, { t: 'Tapa de 30 mm', d: 'Rígida para cuatro equipos de 12.95 kg que vibran, sobre cuatro módulos bien amarrados.' }],
        cumple: [['si', 'Un módulo de 0.80 m por impresora'], ['si', 'Tapa de 30 mm sobre cuatro módulos'], ['si', '0.90 m'], ['si', 'Cuatro pasacables'], ['si', 'Ocho puertas y entrepaños']]
      },
      9: {
        short: 'Repisa de filamentos', name: 'Repisa de filamentos en el nicho', dims: '3.20 × 0.25 m, a 1.75 m', cant: '1', ubic: 'Dentro del nicho del laboratorio, sobre las impresoras',
        resumen: 'Una repisa lacada de 36 mm sobre soportes ocultos que guarda los carretes en uso y, por debajo, ilumina las impresoras con un perfil LED.',
        piezas: [['mdf15', 'repisa (dos capas)', 4, 1.6, 0.25], ['perfilLed', 'bajo la repisa', 2, 1.5]],
        herrajes: [['soporteInv', 'Soportes ocultos', 8], ['chazo', 'Anclajes', 2]],
        acabados: [['laca', 'Repisa', 1.8, 2]],
        fab: ['Cortar cuatro piezas de MDF de 1600 × 250, perforarlas para los soportes y pegarlas de dos en dos.', 'Lacar en blanco y ranurar la cara de abajo para el perfil LED.'],
        ens: ['Fijar ocho soportes ocultos al muro, dentro del nicho, a 1.75 m del piso.', 'Enhebrar la repisa en los soportes.', 'Pegar el perfil LED debajo, mirando a las impresoras, y conectarlo a la fuente del nicho.'],
        seq: [{ t: 'Soportes ocultos', src: 'Ensamble 1' }, { t: 'Repisa lacada de 36 mm', src: 'Ensamble 2' }, { t: 'Perfil LED hacia las impresoras', src: 'Ensamble 3' }],
        why: [{ t: 'Carretes y luz en una pieza', d: 'La repisa guarda los carretes en uso y, por debajo, ilumina el trabajo de las impresoras.' }, { t: 'Soportes ocultos', d: 'La repisa parece flotar dentro del nicho.' }],
        cumple: [['si', '24 carretes sobre las impresoras'], ['si', 'A 1.75 m: 17 cm sobre la unidad AMS'], ['si', 'Repisa blanca, igual al nicho'], ['si', 'Ocho soportes ocultos']]
      },
      10: {
        short: 'Cajonera de servicio', name: 'Cajonera de servicio', dims: '3.00 × 0.50 × 0.90 m', cant: '1 (cinco módulos)', ubic: 'Muro del fondo, de 0.60 a 3.60 m del muro izquierdo',
        resumen: 'Detrás de la barra: cinco cuerpos lacados con 15 cajones de frente liso y gola de aluminio, sobre zócalo negro y bajo una tapa doble de Rovere.',
        piezas: [['mdf15', 'laterales', 10, 0.77, 0.48], ['mdf15', 'pisos', 5, 0.56, 0.47], ['mdf55', 'fondos', 5, 0.56, 0.77], ['mdf15', 'frentes', 15, 0.596, 0.232], ['mdf15', 'costados de las cajas', 15, 1.9, 0.15], ['mdf55', 'fondos de las cajas', 15, 0.54, 0.43], ['mdf15', 'zócalo', 1, 3.0, 0.1], ['rovere15', 'tapa de 30 mm (dos capas), capa de arriba', 2, 1.5, 0.5], ['blanca15v', 'tapa de 30 mm (dos capas), capa de abajo', 2, 1.5, 0.5], ['perfilManija', 'gola de aluminio', 15, 0.6], ['cantoRovere33', 'canto de la tapa', 1, 8]],
        herrajes: [['riel45', 'Un par por cajón', 15], ['pataNiv', 'Ocho patas', 8], ['tornEns', 'Cuerpos', 1], ['tornAuto', 'Rieles', 2]],
        acabados: [['laca', 'Frentes, costados de los extremos y zócalo', 3.2, 2]],
        fab: ['Cortar en MDF de 15 mm los laterales, pisos, frentes y cajas, y en 5.5 mm los fondos.', 'Lacar en blanco los frentes, los laterales de los extremos y el zócalo; las cajas quedan en MDF sellado.', 'Cortar el perfil de gola de aluminio en 15 tramos de 0.60 m.', 'Cortar la tapa de Rovere y su capa de abajo en melamina blanca, pegarlas para dejar 30 mm y enchapar el canto Rovere de 33 mm.'],
        ens: ['Armar los cinco cuerpos contra el muro del fondo, sobre sus patas, y unirlos.', 'Atornillar los rieles y meter las cajas.', 'Atornillar los frentes con su gola y alinearlos.', 'Asentar la tapa de 30 mm.'],
        seq: [{ t: 'Cinco cuerpos lacados sobre zócalo', src: 'Ensamble 1' }, { t: 'Rieles y cajas de cajón', src: 'Ensamble 2' }, { t: 'Frentes lisos con gola de aluminio', src: 'Ensamble 3' }, { t: 'Tapa de Rovere de 30 mm', src: 'Ensamble 4' }],
        why: [{ t: 'Guardado detrás de la barra', d: 'El asesor se levanta de la barra y tiene a mano repuestos, empaques y filamento sin salir del recorrido.' }, { t: 'Gola de aluminio', d: 'El tirador es una ranura en el canto: el frente queda liso, como los muros de la galería.' }, { t: 'Lo que se pierde', d: 'Con el panel de accesorios encima, este muro deja de ser exhibición y se vuelve servicio.' }],
        cumple: [['si', '3.00 × 0.50 m contra el muro del fondo'], ['si', 'Rieles de extensión total de 38 kg'], ['parcial', 'Tapa de Rovere en vez de blanca'], ['si', '15 cajones']]
      },
      11: {
        short: 'Panel de accesorios', name: 'Panel ranurado de accesorios', dims: '1.60 × 0.03 × 1.20 m', cant: '1', ubic: 'Muro del fondo, sobre la cajonera, a la izquierda de la pantalla; borde inferior a 1.05 m',
        resumen: 'Un tablero lacado con ocho listones que forman ranuras horizontales: repisas de acrílico y ganchos se encajan a cualquier altura.',
        piezas: [['mdf15', 'tablero', 1, 1.6, 1.2], ['mdf15', 'listones ranurados', 8, 1.6, 0.1], ['acril3', 'repisas', 5, 0.5, 0.13]],
        herrajes: [['ganchos', 'Ganchos y soportes', 1], ['chazo', 'Seis anclajes', 2], ['tornAuto', 'Listones', 1]],
        acabados: [['laca', 'Tablero y listones', 3.2, 2]],
        fab: ['Cortar el tablero de 1600 × 1200 y ocho listones de 1600 × 100 en MDF de 15 mm; rebajar el canto de cada listón para formar la ranura.', 'Lacar en blanco.', 'Cortar cinco repisas de acrílico de 500 × 130 con su pestaña doblada.'],
        ens: ['Anclar el tablero al muro del fondo con seis chazos, con el borde inferior a 1.05 m.', 'Atornillar los listones de abajo hacia arriba, dejando la ranura entre uno y otro.', 'Encajar repisas y ganchos y montar los accesorios.'],
        seq: [{ t: 'Tablero lacado anclado al muro', src: 'Ensamble 1' }, { t: 'Listones ranurados', src: 'Ensamble 2' }, { t: 'Repisas de acrílico y ganchos', src: 'Ensamble 3' }],
        why: [{ t: 'Panel ranurado', d: 'Las repisas y los ganchos se encajan en cualquier ranura: el surtido cambia sin perforar.' }, { t: 'Blanco de galería', d: 'Es del mismo blanco de los muros: el color lo ponen los accesorios.' }],
        cumple: [['si', '1.60 × 1.20 m sobre la cajonera'], ['parcial', 'Carretes de 1 kg solo en los ganchos de abajo'], ['si', 'Repisas y ganchos de encaje'], ['si', 'La ranura deja 15 mm detrás del gancho']]
      },
      12: {
        short: 'Vitrina de nicho', name: 'Vitrina de nicho con fondo de luz', dims: '0.40 × 0.15 × 1.20 m', cant: '1', ubic: 'Muro derecho, a 1.70 m de la fachada, con la base a 1.05 m',
        resumen: 'Una caja lacada con fondo de acrílico opal iluminado, entrepaños y frente de acrílico: repite en el muro derecho la luz de los nichos de enfrente.',
        piezas: [['mdf15', 'costados', 2, 1.2, 0.15], ['mdf15', 'piso y techo', 2, 0.36, 0.15], ['opal3', 'fondo de luz', 1, 0.36, 1.16], ['acril3', 'frente', 1, 0.4, 1.2], ['acril3', 'entrepaños', 3, 0.36, 0.11], ['cob', 'dos tiras tras el opal', 2, 1.1]],
        herrajes: [['fuente3', 'Para las tiras', 1], ['chazo', 'Dos anclajes', 1]],
        acabados: [['laca', 'Caja', 0.6, 2]],
        fab: ['Cortar la caja en MDF de 15 mm y lacarla en blanco.', 'Cortar el opal del fondo y el acrílico del frente y de los entrepaños.', 'Pegar dos tiras COB verticales detrás del opal.'],
        ens: ['Colgar la caja del muro derecho con dos chazos, con la base a 1.05 m.', 'Poner el fondo de opal con su luz detrás y conectar la fuente, sobre el techo.', 'Apoyar los entrepaños y poner el frente de acrílico.'],
        seq: [{ t: 'Caja lacada y anclaje', src: 'Ensamble 1' }, { t: 'Fondo de opal con luz', src: 'Ensamble 2' }, { t: 'Entrepaños y frente de acrílico', src: 'Ensamble 3' }],
        why: [{ t: 'Un nicho más', d: 'Lleva al muro derecho la luz de los nichos de enfrente: el recorrido en U queda iluminado de los dos lados.' }, { t: 'Fondo de luz', d: 'Las piezas pequeñas se ven en silueta contra el opal.' }],
        cumple: [['si', '0.40 × 0.15 × 1.20 m a 1.05 m'], ['si', 'Frente de acrílico'], ['si', 'Fondo opal iluminado'], ['si', 'MDF lacado y acrílico']]
      },
      13: {
        short: 'Nicho de bienvenida', name: 'Nicho de bienvenida', dims: '1.20 × 0.40 × 2.40 m', cant: '1', ubic: 'Muro derecho, de 0.25 a 1.45 m de la fachada',
        resumen: 'Un mueble alto lacado con un nicho de 1.74 m y dos medianos, cada uno con fondo de opal iluminado: se ven desde el pasillo como tres cuadros de luz.',
        piezas: [['mdf15', 'costados', 2, 2.3, 0.4], ['mdf15', 'piso, techo y entrepaños', 4, 1.16, 0.39], ['mdf15', 'división', 1, 1.74, 0.39], ['mdf15', 'zócalo', 1, 1.16, 0.1], ['mdf15', 'puertas', 2, 0.58, 0.48], ['opal3', 'fondos de luz', 1, 1.16, 1.74], ['cob', 'dos tiras por nicho', 6, 1.1]],
        herrajes: [['fuente8', 'Para los tres nichos', 1], ['pataNiv', 'Cuatro patas', 4], ['bisagraCaz', 'Dos por puerta', 2], ['chazo', 'Anclaje', 1], ['tornEns', 'Cuerpo', 1]],
        acabados: [['laca', 'Cuerpo y puertas', 6.5, 2]],
        fab: ['Cortar en MDF de 15 mm los costados, el techo, el piso, los entrepaños, la división, el zócalo y las dos puertas.', 'Ranurar costados y división para los entrepaños; lacar en blanco.', 'Cortar los tres fondos de acrílico opal y pegar dos tiras COB detrás de cada uno.'],
        ens: ['Parar el cuerpo contra el muro derecho, junto a la entrada, nivelar y anclar con dos chazos.', 'Encajar el entrepaño bajo, la división y el entrepaño del nicho derecho.', 'Poner los fondos de opal con su luz y conectar la fuente sobre el mueble.', 'Colgar las dos puertas del zócalo.'],
        seq: [{ t: 'Cuerpo lacado sobre zócalo', src: 'Ensamble 1' }, { t: 'Entrepaños y división', src: 'Ensamble 2' }, { t: 'Fondos de opal con luz', src: 'Ensamble 3' }, { t: 'Puertas del zócalo', src: 'Ensamble 4' }],
        why: [{ t: 'Tres piezas, tres luces', d: 'Junto a la entrada, un nicho alto y dos medianos muestran tres piezas grandes: desde el pasillo se ven como cuadros iluminados.' }, { t: 'Fondo de luz', d: 'El opal convierte cada nicho en una caja de luz uniforme.' }],
        cumple: [['si', 'Muro derecho, junto a la entrada'], ['si', 'Nicho alto de 1.74 m, hasta 2.40 m'], ['si', 'Fondos opal iluminados'], ['si', 'Dos chazos'], ['si', 'Entrepaños de 1.16 m encajados']]
      },
      15: {
        short: 'Mampara sin marco', name: 'Mampara de vidrio sin marco', dims: '2.10 × 0.12 × 2.40 m', cant: '1', ubic: 'Fondo derecho: puerta de 0.92 m a la izquierda y fijo de 0.96 m',
        resumen: 'Vidrio templado de 10 mm metido en jambas y dintel lacados del mismo blanco de los muros, con la puerta a la izquierda para no chocar con el laboratorio de impresión.',
        piezas: [['mdf15', 'jambas (cajón de cuatro caras)', 8, 2.28, 0.12], ['mdf15', 'dintel', 4, 2.1, 0.12], ['vidrio10', 'vidrio fijo', 1, 0.96, 2.28], ['vidrio10', 'puerta', 1, 0.915, 2.26], ['opal3', 'franja visible', 1, 1.86, 0.09]],
        herrajes: [['kitBatiente', 'Bisagra, chapeta y manija', 1], ['chazo', 'Anclajes', 1], ['pegante', 'Jambas y dintel', 1]],
        acabados: [['laca', 'Jambas y dintel', 3.2, 2]],
        fab: ['Medir el vano terminado.', 'Armar las dos jambas y el dintel como cajones de MDF de 15 mm, ranurados para el vidrio, y lacarlos en blanco.', 'La vidriería corta, pule, perfora y templa el fijo y la puerta de 10 mm.'],
        ens: ['Anclar jambas y dintel a piso, muro y cielo.', 'Asentar el vidrio fijo en la ranura, sobre calzos, y sellarlo.', 'Colgar la puerta en la jamba izquierda con la bisagra del kit: abre hacia la trastienda.', 'Poner la manija y regular.', 'Pegar la franja de opal a la altura de los ojos.'],
        seq: [{ t: 'Jambas y dintel lacados', src: 'Ensamble 1' }, { t: 'Vidrio fijo de 10 mm', src: 'Ensamble 2' }, { t: 'Puerta de vidrio', src: 'Ensamble 3' }, { t: 'Bisagras y manija del kit', src: 'Ensamble 4' }, { t: 'Franja de opal', src: 'Ensamble 5' }],
        why: [{ t: 'Sin marco', d: 'El vidrio va metido en jambas del mismo blanco de los muros: la mampara casi desaparece y la trastienda se ve como otra sala.' }, { t: 'Puerta a la izquierda', d: 'El laboratorio de impresión llega hasta la mampara por el muro derecho: la puerta pasa al otro lado para no chocar con él.' }, { t: 'Templado de 10 mm', d: 'Una hoja de 2.28 m sin marco necesita el espesor mayor.' }],
        cumple: [['si', 'Puerta de 0.92 m y fijo de 0.96 m'], ['si', 'Templado de 10 mm'], ['parcial', 'Batiente: barre 0.90 m de la trastienda'], ['si', 'Franja de opal a la altura de los ojos'], ['si', 'Vidrio incoloro sin marco']]
      },
      17: {
        short: 'Escritorio lacado', name: 'Escritorio lacado', dims: '1.20 × 0.60 × 0.75 m', cant: '1', ubic: 'Trastienda, contra el muro del fondo, a la derecha',
        resumen: 'Dos costados y un faldón de MDF lacado con tapa doble de Rovere: el escritorio repite el blanco de la sala y se ve a través de la mampara sin marco.',
        piezas: [['mdf15', 'costados', 2, 0.72, 0.6], ['mdf15', 'faldón', 1, 1.16, 0.42], ['rovere15', 'tapa de 30 mm (dos capas), capa de arriba', 1, 1.2, 0.6], ['blanca15v', 'tapa de 30 mm (dos capas), capa de abajo', 1, 1.2, 0.6], ['cantoRovere33', 'canto', 1, 4]],
        herrajes: [['pataNiv', 'Cuatro patas', 4], ['pasacable', 'Para el computador', 1], ['tornEns', 'Cuerpo', 1]],
        acabados: [['laca', 'Costados y faldón', 2.2, 2]],
        fab: ['Cortar los costados y el faldón en MDF de 15 mm y lacarlos en blanco.', 'Cortar la tapa de Rovere de 1200 × 600 y su capa de abajo en melamina blanca, pegarlas para dejar 30 mm y enchapar el canto Rovere de 33 mm.'],
        ens: ['Armar los costados con el faldón contra el muro del fondo de la trastienda, a la derecha.', 'Asentar la tapa, atornillarla y poner el pasacable.'],
        seq: [{ t: 'Costados y faldón lacados', src: 'Ensamble 1' }, { t: 'Tapa de Rovere y pasacable', src: 'Ensamble 2' }],
        why: [{ t: 'Mismo blanco', d: 'El escritorio repite el lenguaje de la sala: se ve a través de la mampara sin marco.' }, { t: 'Costados cerrados', d: 'Esconden los cables y los equipos del computador.' }],
        cumple: [['si', '1.20 × 0.60 m'], ['si', 'Tapa a 0.75 m'], ['si', 'Pasacable en la esquina'], ['si', 'MDF lacado y una tapa de Rovere']]
      }
    },
    C: {
      2: {
        name: 'Estantería de aluminio con fondo de luz', resumen: 'Bastidor de perfil 30 × 30 con entrepaños sobre ménsulas impresas que se mueven a cualquier altura, y un fondo de acrílico opal iluminado por tira COB: una caja de luz detrás del producto.',
        piezas: [['perfil3030', 'parales', 6, 2.40], ['perfil3030', 'travesaños', 6, 0.34], ['perfil3030', 'largueros', 14, 1.14], ['mdf15', 'entrepaños', 10, 1.14, 0.34], ['hpl', 'cara superior de entrepaños', 10, 1.14, 0.34], ['opal3', 'paños del fondo de luz', 4, 1.14, 0.865], ['pvc5', 'fondos detrás de la luz', 2, 1.14, 1.73], ['pvc10', 'puertas', 4, 0.57, 0.52], ['pvc10', 'costados del gabinete', 3, 0.34, 0.52], ['pvc5', 'fondos del gabinete', 2, 1.14, 0.54], ['cob', 'líneas verticales de luz', 8, 1.70], ['petg', 'ménsulas, bisagras, tiradores, clips y tapas', 0.9]],
        herrajes: [['escuadra', 'Una por unión', 40], ['fuente8', 'Una por módulo', 2], ['nivelador', 'Uno por paral', 6], ['chazo', 'Dos por marco', 2], ['tornAuto', 'Clips de panel', 1]],
        acabados: [['contacto', 'Laminado sobre los entrepaños', 3.88, 1]],
        fab: ['Cortar el perfil 3030 a escuadra: 6 parales de 2.40 m, 6 travesaños de 0.34 m y 14 largueros de 1.14 m; limpiar la rebaba.', 'Imprimir en PETG 40 ménsulas de entrepaño, 8 bisagras, 4 tiradores, 12 tapas de perfil y los clips de panel.', 'Cortar 10 entrepaños de 1140 × 340 en MDF de 15 mm y pegar el laminado blanco en la cara de arriba; refilar.', 'Cortar el PVC espumado: 4 puertas y 3 costados en 10 mm, y los fondos en 5 mm.', 'Cortar el acrílico opal en 4 paños de 1140 × 865 y pegar la tira COB en cuatro líneas verticales sobre cada fondo de PVC.'],
        ens: ['Armar tres marcos laterales de dos parales y dos travesaños con escuadras.', 'Unirlos con los largueros, parar el bastidor a 1.60 m de la fachada y anclarlo al muro con dos chazos por marco.', 'Roscar los niveladores en la base de los parales y nivelar.', 'Encajar los fondos de PVC con la tira COB y, delante, el acrílico opal: forman la caja de luz.', 'Clipar costados y fondos del gabinete y colgar las puertas con sus bisagras impresas.', 'Clipar las ménsulas en la ranura de los parales a la altura deseada y asentar los entrepaños; los largueros frontales se deslizan a la misma altura.'],
        seq: [{ t: 'Marcos laterales de perfil 3030', src: 'Ensamble 1' }, { t: 'Largueros y anclaje al muro', src: 'Ensamble 2' }, { t: 'Niveladores', src: 'Ensamble 3' }, { t: 'Fondo de luz: PVC, tira COB y acrílico opal', src: 'Ensamble 4' }, { t: 'Gabinete de PVC con bisagras impresas', src: 'Ensamble 5' }, { t: 'Ménsulas impresas y entrepaños', src: 'Ensamble 6' }],
        why: [{ t: 'Entrepaños a cualquier altura', d: 'Las ménsulas impresas se clipan en la ranura del perfil: los niveles se cambian en minutos según el producto, sin perforar.' }, { t: 'Fondo de luz', d: 'El acrílico opal reparte la luz de la tira COB en toda la pared del mueble: las figuras se recortan contra un fondo luminoso.' }, { t: 'Perfil 30 × 30', d: 'Es la misma estructura de las impresoras y las CNC: el mueble cuenta lo que hace el taller.' }, { t: 'Lo que se pierde', d: 'Es el mueble más caro de las tres versiones: el perfil se paga por metro y cada unión lleva una escuadra.' }],
        cumple: [['si', 'Entrepaños entre 0.60 y 1.88 m, a cualquier altura'], ['si', 'Fondo de acrílico opal iluminado'], ['si', 'MDF de 15 mm con larguero de aluminio bajo el frente'], ['si', 'Dos chazos por marco'], ['si', 'Gabinete de PVC espumado con cuatro puertas']]
      },
      3: {
        name: 'Isla de aluminio con esquinas impresas', resumen: 'Bastidor de perfil 30 × 30 forrado en PVC espumado blanco, con las tres esquinas curvas impresas en PETG en anillos de 20 cm y tapa de MDF con laminado blanco.',
        piezas: [['perfil3030', 'aros inferior y superior (tramos rectos)', 2, 4.70], ['perfil3030', 'parales', 6, 0.82], ['pvc10', 'paño frontal', 1, 1.50, 0.82], ['pvc10', 'paño posterior', 1, 1.75, 0.82], ['pvc10', 'paños laterales', 1, 0.60, 0.82], ['pvc10', 'paño lateral', 1, 0.85, 0.82], ['mdf15', 'tapa', 1, 2.00, 1.10], ['hpl', 'cara superior de la tapa', 1, 2.00, 1.10], ['canto', 'canto de la tapa', 1, 5.80], ['cob', 'tira en la ranura del aro inferior', 1, 5.80], ['petg', 'tres esquinas de 0.25 m de radio (12 anillos) y clips', 4.3]],
        herrajes: [['escuadra', 'Una por unión', 24], ['nivelador', 'Seis bajo el aro inferior', 6], ['fuente12', 'Alimenta las dos islas', 1], ['tornAuto', 'Tapa y esquinas', 1]],
        acabados: [['contacto', 'Laminado sobre la tapa', 2.2, 1]],
        fab: ['Cortar el perfil: dos aros de tramos rectos (1.50, 1.75, 0.60 y 0.85 m) y seis parales de 0.82 m.', 'Imprimir en PETG las tres esquinas de 0.25 m de radio en cuatro anillos de 20.5 cm cada una, con pestañas para atornillarlas al perfil.', 'Cortar los paños rectos en PVC espumado de 10 mm.', 'Cortar la tapa de MDF con las tres esquinas redondeadas, pegar el laminado blanco y enchapar el canto.'],
        ens: ['Armar los aros y unirlos con los seis parales usando escuadras.', 'Roscar los niveladores y pegar la tira COB en la ranura del aro inferior, mirando al piso.', 'Clipar los paños rectos de PVC al bastidor.', 'Apilar y atornillar los anillos impresos de cada esquina.', 'Asentar la tapa y atornillarla desde abajo; conectar la fuente a la toma de piso.'],
        seq: [{ t: 'Bastidor de perfil 3030', src: 'Ensamble 1' }, { t: 'Niveladores y tira COB', src: 'Ensamble 2' }, { t: 'Paños rectos de PVC espumado', src: 'Ensamble 3' }, { t: 'Esquinas impresas, cuatro anillos por curva', src: 'Ensamble 4' }, { t: 'Tapa con laminado blanco', src: 'Ensamble 5' }, { t: 'Fuente de 12 V', src: 'Ensamble 5' }],
        why: [{ t: 'Las esquinas son producto', d: 'Cada curva sale de las impresoras del taller en cuatro anillos: es la pieza impresa más grande que el cliente ve en la tienda.' }, { t: 'Laminado de alta presión', d: 'Aguanta el rayado y el calor mejor que la melamina; en blanco mate no muestra las huellas.' }, { t: 'Desarmable', d: 'El bastidor se arma con escuadras: se lleva por partes y se puede reconfigurar.' }, { t: 'Lo que se pierde', d: 'Las tres esquinas gastan unos 4 kg de filamento y varios días de impresora.' }],
        cumple: [['si', '2.00 × 1.10 m en el centro de la sala'], ['si', 'Tres esquinas de 0.25 m de radio impresas'], ['si', 'Laminado de alta presión blanco'], ['si', 'Tira COB en el aro inferior'], ['si', 'Se arma en sitio con escuadras'], ['si', 'Paños clipados que se abren sin herramientas']]
      },
      4: {
        name: 'Isla secundaria de aluminio', resumen: 'El mismo sistema de la isla principal: perfil 30 × 30, PVC espumado, dos esquinas impresas de 0.18 m y tapa con laminado.',
        piezas: [['perfil3030', 'aros (tramos rectos)', 2, 2.88], ['perfil3030', 'parales', 4, 0.67], ['pvc10', 'paño posterior', 1, 0.84, 0.67], ['pvc10', 'costados', 2, 0.42, 0.67], ['mdf15', 'tapa', 1, 1.20, 0.60], ['hpl', 'cara superior de la tapa', 1, 1.20, 0.60], ['canto', 'canto de la tapa', 1, 2.90], ['cob', 'tira bajo el aro', 1, 3.00], ['petg', 'dos esquinas de 0.18 m (8 anillos) y clips', 1.6]],
        herrajes: [['escuadra', 'Una por unión', 16], ['nivelador', 'Cuatro', 4]],
        acabados: [['contacto', 'Laminado sobre la tapa', 0.72, 1]],
        fab: ['Repetir el método de la isla principal, con esquinas de 0.18 m en cuatro anillos de 16.7 cm.'],
        ens: ['Armar el bastidor, adosarlo a la isla principal a 2.30 m del muro izquierdo y unir los dos aros con cuatro escuadras.', 'Clipar los paños, atornillar las esquinas y asentar la tapa, 15 cm más baja.', 'Conectar la tira COB a la fuente de la isla principal.'],
        seq: [{ t: 'Bastidor de perfil 3030', src: 'Ensamble 1' }, { t: 'Niveladores y tira COB', src: 'Ensamble 3' }, { t: 'Paños de PVC espumado', src: 'Ensamble 2' }, { t: 'Esquinas impresas', src: 'Ensamble 2' }, { t: 'Tapa con laminado', src: 'Ensamble 2' }],
        why: [{ t: 'Una sola pieza escalonada', d: 'Los dos bastidores se unen con escuadras: las islas quedan rígidas entre sí y se separan con una llave.' }],
        cumple: [['si', '1.20 × 0.60 m, adosada a la isla principal y 15 cm más baja'], ['si', 'Mismo sistema de perfil, PVC y esquinas impresas'], ['si', 'Dos esquinas de 0.18 m impresas'], ['si', 'Tira COB a la fuente de la isla principal']]
      },
      5: {
        name: 'Mesa de aluminio con canal de cables', resumen: 'Cuatro patas de perfil 30 × 30 unidas por un marco y dos reposapiés del mismo perfil, tapa de MDF con laminado blanco y una canaleta impresa que baja los cables por una pata.',
        piezas: [['perfil3030', 'patas', 4, 1.02], ['perfil3030', 'marco bajo la tapa (perímetro)', 1, 4.76], ['perfil3030', 'reposapiés', 2, 1.74], ['mdf15', 'tapas (dos capas)', 2, 1.80, 0.70], ['hpl', 'cara superior', 1, 1.80, 0.70], ['canto', 'canto de la tapa', 1, 5.00], ['petg', 'canaleta, tapas de pata y protectores', 0.4]],
        herrajes: [['escuadra', 'Una por unión', 16], ['nivelador', 'Uno por pata', 4], ['tornAuto', 'Tapa al marco', 1]],
        acabados: [['contacto', 'Laminado sobre la tapa', 1.26, 1]],
        fab: ['Cortar 4 patas de 1.02 m, el marco (2 de 1.74 y 2 de 0.64 m) y 2 reposapiés de 1.74 m.', 'Pegar en sánduche las dos capas de MDF, pegar el laminado y enchapar el canto: tapa de 30 mm.', 'Imprimir la canaleta de cables, las tapas de pata y los protectores de esquina.'],
        ens: ['Armar el marco y las cuatro patas con escuadras.', 'Deslizar los reposapiés a 0.30 m por la ranura y apretarlos.', 'Roscar los niveladores y nivelar.', 'Atornillar la tapa desde abajo y clipar la canaleta en la ranura de la pata trasera derecha.'],
        seq: [{ t: 'Marco y cuatro patas de perfil', src: 'Ensamble 1' }, { t: 'Reposapiés a 0.30 m', src: 'Ensamble 2' }, { t: 'Niveladores', src: 'Ensamble 3' }, { t: 'Tapa con laminado y canaleta', src: 'Ensamble 4' }],
        why: [{ t: 'Canal de cables impreso', d: 'El datáfono, el computador y los cargadores bajan por una canaleta clipada en la ranura de la pata: la mesa queda sin cables colgando.' }, { t: 'Reposapiés ajustable', d: 'Corre por la ranura: se fija a la altura cómoda para los taburetes.' }, { t: 'Lo que se pierde', d: 'El aluminio se raya con las patas de los taburetes; las tapas impresas protegen solo las esquinas.' }],
        cumple: [['si', '1.80 × 0.70 m'], ['si', 'Tapa de 30 mm a 1.05 m'], ['si', 'Cuatro patas en las esquinas'], ['si', 'Reposapiés que corre por la ranura'], ['parcial', 'El aluminio se raya con los golpes']]
      },
      7: {
        name: 'Mesón de aluminio y PVC', resumen: 'Cinco marcos de perfil 30 × 30 bajo una tapa de MDF de 30 mm con laminado blanco, con puertas de PVC espumado, bisagras y pasacables impresos.',
        piezas: [['perfil3030', 'parales', 10, 0.86], ['perfil3030', 'travesaños', 10, 0.54], ['perfil3030', 'largueros', 4, 3.20], ['mdf15', 'tapas (dos capas)', 4, 1.60, 0.60], ['hpl', 'cara superior', 2, 1.60, 0.60], ['mdf15', 'entrepaños', 4, 0.77, 0.54], ['canto', 'canto de la tapa', 1, 7.60], ['pvc10', 'puertas', 8, 0.39, 0.75], ['pvc5', 'fondos', 4, 0.77, 0.78], ['petg', 'bisagras, tiradores, pasacables y clips', 0.8]],
        herrajes: [['escuadra', 'Una por unión', 40], ['nivelador', 'Uno por paral', 10], ['tornAuto', 'Tapa y bisagras', 2]],
        acabados: [['contacto', 'Laminado sobre la tapa', 1.92, 1]],
        fab: ['Cortar el perfil: 10 parales de 0.86 m, 10 travesaños de 0.54 m y 4 largueros de 3.20 m.', 'Pegar en sánduche las tapas de MDF, pegar el laminado y enchapar el canto: dos tramos de 1.60 m y 30 mm.', 'Cortar 8 puertas en PVC de 10 mm y los fondos en 5 mm.', 'Imprimir 16 bisagras, 8 tiradores, 4 pasacables y los clips de panel.'],
        ens: ['Armar cinco marcos con escuadras y pararlos contra el muro de listones cada 0.80 m.', 'Unirlos con los cuatro largueros y nivelar.', 'Clipar los fondos y asentar los entrepaños.', 'Atornillar los dos tramos de tapa desde abajo y encajar los pasacables impresos.', 'Colgar las puertas de sus bisagras impresas.'],
        seq: [{ t: 'Cinco marcos de perfil 3030', src: 'Ensamble 1' }, { t: 'Largueros y niveladores', src: 'Ensamble 2' }, { t: 'Fondos y entrepaños', src: 'Ensamble 3' }, { t: 'Tapa de 30 mm y pasacables impresos', src: 'Ensamble 4' }, { t: 'Puertas de PVC con bisagras impresas', src: 'Ensamble 5' }],
        why: [{ t: 'Puertas de PVC espumado', d: 'Livianas, blancas de fábrica y no se hinchan con la humedad.' }, { t: 'Bisagras y pasacables impresos', d: 'Son repuestos que el taller fabrica el mismo día si uno se rompe.' }, { t: 'Lo que se pierde', d: 'El PVC espumado se marca con los golpes y no acepta bisagra de cazoleta.' }],
        cumple: [['si', 'Un marco cada 0.80 m'], ['si', 'Tapa de 30 mm sobre cinco marcos'], ['si', '0.90 m'], ['si', 'Pasacables impresos en el eje de cada impresora'], ['si', 'Puertas de PVC y entrepaños']]
      },
      9: {
        name: 'Riel de carretes', resumen: 'Dos perfiles 30 × 30 anclados al muro con portacarretes impresos que se deslizan por la ranura: los carretes giran y se pueden desenrollar para mostrar el color.',
        piezas: [['perfil3030', 'rieles', 2, 3.20], ['petg', '22 portacarretes y etiquetas de precio', 0.5]],
        herrajes: [['chazo', 'A través de la ranura', 2], ['tornM6', 'Topes de los extremos', 2]],
        acabados: [],
        fab: ['Cortar dos perfiles de 3.20 m y perforar cada 0.80 m para los chazos.', 'Imprimir 22 portacarretes con giro sobre eje y las etiquetas de precio.'],
        ens: ['Anclar los dos rieles a 1.60 y 1.85 m del piso con cuatro chazos cada uno.', 'Deslizar los portacarretes por la ranura, cargar los carretes y cerrar con los topes.'],
        seq: [{ t: 'Dos rieles de perfil anclados al muro', src: 'Ensamble 1' }, { t: 'Portacarretes impresos y carretes', src: 'Ensamble 2' }],
        why: [{ t: 'Carretes que giran', d: 'Cada carrete se puede desenrollar unos centímetros para que el cliente vea y toque el filamento.' }, { t: 'Sin tabla', d: 'No hay repisa: los carretes parecen flotar sobre el muro de listones.' }],
        cumple: [['si', 'Dos rieles de 3.20 m entre 1.60 y 1.85 m'], ['si', 'Un portacarretes cada 27 cm'], ['si', 'No hay tabla: solo los carretes'], ['si', 'Ocho chazos']]
      },
      10: {
        name: 'Cajonera de aluminio con bandejas', resumen: 'Seis marcos de perfil 30 × 30 con 15 bandejas de PVC espumado que corren sobre deslizadores impresos, tiradores impresos al ras y tapa de MDF con laminado blanco.',
        piezas: [['perfil3030', 'parales', 12, 0.86], ['perfil3030', 'travesaños de deslizador', 18, 0.44], ['perfil3030', 'largueros', 4, 3.00], ['pvc10', 'costados, frentes interiores y traseros', 60, 0.48, 0.18], ['pvc10', 'frentes', 15, 0.596, 0.252], ['pvc10', 'tapas laterales', 2, 0.87, 0.50], ['pvc5', 'fondos de bandeja', 15, 0.53, 0.45], ['mdf15', 'tapas (dos capas)', 4, 1.50, 0.50], ['hpl', 'cara superior', 2, 1.50, 0.50], ['canto', 'canto de la tapa', 1, 7.00], ['petg', 'deslizadores, tiradores y esquineros de bandeja', 1.2]],
        herrajes: [['escuadra', 'Una por unión', 48], ['nivelador', 'Uno por paral', 12], ['tornAuto', 'Bandejas y tapa', 2]],
        acabados: [['contacto', 'Laminado sobre la tapa', 1.5, 1]],
        fab: ['Cortar el perfil: 12 parales, 18 travesaños de deslizador y 4 largueros.', 'Imprimir 30 deslizadores, 15 tiradores al ras y 60 esquineros de bandeja.', 'Cortar el PVC espumado y armar 15 bandejas con esquineros impresos y fondo de 5 mm.', 'Pegar en sánduche las tapas de MDF, pegar el laminado y enchapar.'],
        ens: ['Armar seis marcos con sus tres travesaños de deslizador y pararlos a 2.00 m de la fachada, cada 0.60 m.', 'Unirlos con los largueros, nivelar y clipar las tapas laterales.', 'Clipar los deslizadores en los travesaños y meter las bandejas.', 'Atornillar los dos tramos de tapa desde abajo.'],
        seq: [{ t: 'Seis marcos de perfil 3030', src: 'Ensamble 1' }, { t: 'Largueros, niveladores y tapas laterales', src: 'Ensamble 2' }, { t: 'Deslizadores impresos', src: 'Ensamble 3' }, { t: 'Quince bandejas de PVC', src: 'Ensamble 3' }, { t: 'Tapa con laminado blanco', src: 'Ensamble 4' }],
        why: [{ t: 'Sin rieles metálicos', d: 'Las bandejas corren sobre deslizadores de PETG clipados al perfil; si uno se gasta, se imprime otro.' }, { t: 'Tiradores al ras', d: 'El tirador impreso no sobresale hacia el paso principal de 2.00 m.' }, { t: 'Lo que se pierde', d: 'El deslizador de plástico no da extensión total ni la carga de un riel de 38 kg: cada bandeja sale dos tercios.' }],
        cumple: [['si', '3.00 × 0.50 m contra el muro derecho'], ['parcial', 'Las bandejas salen dos tercios y cargan menos'], ['si', 'Laminado blanco mate'], ['si', '15 bandejas']]
      },
      11: {
        name: 'Rieles de accesorios', resumen: 'Cinco perfiles 30 × 30 sobre un fondo de PVC espumado blanco, con portacarretes, soportes y bandejas impresos que se clipan y corren por la ranura.',
        piezas: [['perfil3030', 'rieles', 5, 2.20], ['pvc5', 'fondo', 1, 2.20, 1.22], ['petg', 'portacarretes, soportes y bandejas', 0.8]],
        herrajes: [['chazo', 'Dos por riel', 3]],
        acabados: [],
        fab: ['Cortar cinco perfiles de 2.20 m y perforar sus extremos para los chazos.', 'Cortar el fondo de PVC de 5 mm.', 'Imprimir 12 portacarretes, 20 soportes de herramienta y 6 bandejas con traba de giro para la ranura.'],
        ens: ['Fijar el fondo de PVC al muro con el borde inferior a 1.00 m.', 'Anclar los cinco rieles sobre el fondo, cada 0.27 m, con dos chazos cada uno.', 'Clipar los accesorios y cargar los carretes.'],
        seq: [{ t: 'Fondo de PVC espumado', src: 'Ensamble 1' }, { t: 'Cinco rieles de perfil', src: 'Ensamble 2' }, { t: 'Accesorios impresos y carretes', src: 'Ensamble 3' }],
        why: [{ t: 'Todo se mueve', d: 'Cada accesorio corre por la ranura y se traba con un giro: el panel se reorganiza sin herramientas.' }, { t: 'Accesorios propios', d: 'El taller diseña e imprime soportes a la medida de lo que vende.' }, { t: 'Lo que se pierde', d: 'Una traba impresa aguanta menos que un gancho de acero: los carretes van en los rieles de abajo.' }],
        cumple: [['si', 'Cinco rieles en 2.20 × 1.22 m sobre el mueble bajo'], ['parcial', 'Traba impresa: carretes solo en los rieles bajos'], ['si', 'Los accesorios corren por la ranura'], ['si', 'El perfil separa 30 mm del muro']]
      },
      12: {
        name: 'Vitrina de acrílico', resumen: 'Una caja de acrílico transparente con fondo opal, unida por esquineros impresos, con techo y piso de PVC espumado y luz en el techo.',
        piezas: [['acril3', 'frente', 1, 0.40, 1.20], ['acril3', 'costados', 2, 0.15, 1.20], ['acril3', 'entrepaños', 3, 0.37, 0.13], ['opal3', 'fondo', 1, 0.40, 1.20], ['pvc10', 'techo y piso', 2, 0.40, 0.15], ['cob', 'tira en el techo', 1, 0.40], ['petg', 'cuatro esquineros de 1.20 m y soportes', 0.3]],
        herrajes: [['fuente3', 'Sobre el techo', 1], ['chazo', 'Al muro', 1]],
        acabados: [],
        fab: ['Cortar el acrílico: frente de 400 × 1200, dos costados de 150 × 1200 y tres entrepaños; el fondo en opal.', 'Imprimir cuatro esquineros de 1.20 m en tres tramos y los soportes de entrepaño.', 'Cortar techo y piso en PVC de 10 mm y pegar la tira COB en el techo.'],
        ens: ['Armar piso, fondo opal y costados con los esquineros.', 'Clipar los entrepaños.', 'Cerrar con el frente y el techo.', 'Colgar con dos chazos, con la base a 1.05 m.'],
        seq: [{ t: 'Piso, fondo opal y costados', src: 'Ensamble 1' }, { t: 'Entrepaños de acrílico', src: 'Ensamble 2' }, { t: 'Frente, techo y luz', src: 'Ensamble 3' }, { t: 'Colgar a 1.05 m', src: 'Ensamble 4' }],
        why: [{ t: 'Cinco caras transparentes', d: 'El producto se ve también de lado, desde el pasillo principal.' }, { t: 'La más liviana', d: 'Sin tablero: acrílico, PVC espumado y piezas impresas.' }],
        cumple: [['si', '0.40 × 0.15 × 1.20 m'], ['si', 'Caja cerrada de acrílico'], ['si', 'Tira COB en el techo y fondo opal'], ['si', 'La más liviana de las tres']]
      },
      13: {
        name: 'Estantería de aluminio con fondo de luz', resumen: 'Un módulo de perfil 30 × 30 con seis entrepaños de MDF y laminado sobre ménsulas impresas, y un fondo de luz de acrílico opal a toda la altura.',
        piezas: [['perfil3030', 'parales', 4, 2.40], ['perfil3030', 'travesaños', 4, 0.29], ['perfil3030', 'largueros', 8, 1.14], ['mdf15', 'entrepaños', 6, 1.14, 0.29], ['hpl', 'cara superior de entrepaños', 6, 1.14, 0.29], ['opal3', 'paños del fondo de luz', 2, 1.14, 1.135], ['pvc5', 'fondo detrás de la luz', 1, 1.14, 2.27], ['cob', 'líneas verticales de luz', 4, 2.20], ['petg', 'ménsulas, tapas y clips', 0.5]],
        herrajes: [['escuadra', 'Una por unión', 24], ['fuente12', 'Para 8.8 m de COB', 1], ['nivelador', 'Uno por paral', 4], ['chazo', 'Dos por marco', 1]],
        acabados: [['contacto', 'Laminado sobre los entrepaños', 1.98, 1]],
        fab: ['Cortar el perfil: 4 parales de 2.40 m, 4 travesaños y 8 largueros.', 'Cortar 6 entrepaños de MDF y pegar el laminado.', 'Cortar el fondo de PVC, pegar la tira COB y cortar dos paños de acrílico opal.', 'Imprimir 24 ménsulas, tapas y clips.'],
        ens: ['Armar dos marcos y unirlos con los largueros.', 'Anclar al muro a 0.30 m de la fachada y nivelar.', 'Encajar el fondo de PVC con la tira COB y el acrílico opal.', 'Clipar las ménsulas y asentar los entrepaños.'],
        seq: [{ t: 'Marcos de perfil 3030', src: 'Ensamble 1' }, { t: 'Largueros y anclaje', src: 'Ensamble 1 · 2' }, { t: 'Niveladores', src: 'Ensamble 2' }, { t: 'Fondo de luz', src: 'Ensamble 3' }, { t: 'Ménsulas y entrepaños', src: 'Ensamble 4' }],
        why: [{ t: 'Una caja de luz hacia el pasillo', d: 'Desde el centro comercial se ve una pared luminosa con las figuras recortadas: llama más que la madera.' }, { t: 'Lo que se pierde', d: 'Pierde el tono madera que la separaba de la estantería blanca del otro muro.' }],
        cumple: [['si', 'Muro derecho, a 0.30 m de la fachada'], ['si', 'Seis niveles hasta 2.40 m'], ['si', 'Fondo opal a toda la altura'], ['si', 'Cuatro chazos'], ['si', 'MDF con larguero de aluminio']]
      },
      15: {
        name: 'Mampara de aluminio y acrílico opal con puerta corrediza', resumen: 'Un fijo y una puerta corrediza de marco de perfil 30 × 30 con paños de acrílico opal, colgada de un riel de granero: deja pasar la luz y esconde la trastienda.',
        piezas: [['perfil3030', 'marco del fijo (perímetro)', 1, 6.78], ['perfil3030', 'travesaños del fijo', 2, 0.96], ['perfil3030', 'marco de la puerta (perímetro)', 1, 6.20], ['perfil3030', 'travesaño de la puerta', 1, 0.84], ['opal3', 'paños del fijo', 3, 0.96, 0.76], ['opal3', 'paños de la puerta', 2, 0.84, 1.05], ['petg', 'tirador, guía de piso y tapas', 0.3]],
        herrajes: [['kitRiel', 'Riel de granero de 2.00 m', 1], ['escuadra', 'Una por unión', 16], ['chazo', 'Marco del fijo', 2]],
        acabados: [],
        fab: ['Cortar el perfil del fijo (1.05 × 2.37 m) y de la puerta (0.90 × 2.20 m) con sus travesaños.', 'Cortar los paños de acrílico opal para que entren en la ranura del perfil.', 'Imprimir el tirador, la guía de piso y las tapas.'],
        ens: ['Armar el marco del fijo con los paños de opal en la ranura y anclarlo al piso y al cielo.', 'Atornillar el riel de granero sobre el vano, del lado de la sala.', 'Armar la puerta con sus paños y colgarla del riel.', 'Atornillar la guía de piso y el tirador.'],
        seq: [{ t: 'Marco del fijo con paños de opal', src: 'Ensamble 1' }, { t: 'Riel de granero sobre el vano', src: 'Ensamble 2' }, { t: 'Puerta corrediza colgada del riel', src: 'Ensamble 3' }, { t: 'Guía de piso y tirador impreso', src: 'Ensamble 4' }],
        why: [{ t: 'Puerta corrediza', d: 'En una trastienda de 1.40 m de fondo, una batiente de 0.90 m barre casi todo el paso; la corrediza no ocupa piso.' }, { t: 'Acrílico opal', d: 'Esconde el desorden del taller y deja pasar la luz; pesa menos de la mitad que el vidrio, así que el riel lo carga sin problema y no se rompe en esquirlas.' }, { t: 'Lo que se pierde', d: 'El acrílico se raya con la limpieza y no es incombustible; desde la sala ya no se ve el taller.' }],
        cumple: [['si', 'Fijo de 1.05 m y puerta corrediza de 0.90 m'], ['si', 'Acrílico: no se rompe en esquirlas'], ['si', 'Corrediza: no barre la trastienda'], ['si', 'Paños opacos, imposibles de no ver'], ['parcial', 'Deja pasar la luz, pero no deja ver el taller']]
      },
      17: {
        name: 'Escritorio de aluminio', resumen: 'Cuatro patas y marco de perfil 30 × 30 con tapa de MDF y laminado blanco, y una bandeja de cables impresa bajo la tapa.',
        piezas: [['perfil3030', 'patas', 4, 0.72], ['perfil3030', 'marco (perímetro)', 1, 3.36], ['mdf15', 'tapa', 1, 1.20, 0.60], ['hpl', 'cara superior', 1, 1.20, 0.60], ['canto', 'canto de la tapa', 1, 3.60], ['petg', 'bandeja de cables', 0.2]],
        herrajes: [['escuadra', 'Una por unión', 8], ['nivelador', 'Uno por pata', 4]],
        acabados: [['contacto', 'Laminado sobre la tapa', 0.72, 1]],
        fab: ['Cortar 4 patas de 0.72 m y el marco de 1.14 × 0.54 m.', 'Pegar el laminado en la tapa y enchapar el canto.', 'Imprimir la bandeja de cables.'],
        ens: ['Armar el marco y las patas con escuadras.', 'Atornillar la tapa y clipar la bandeja de cables en la ranura trasera.'],
        seq: [{ t: 'Marco y patas de perfil', src: 'Ensamble 1' }, { t: 'Tapa con laminado y bandeja de cables', src: 'Ensamble 2' }],
        why: [{ t: 'Mismo sistema que el resto', d: 'Usa las escuadras y el perfil sobrantes del resto de la versión.' }, { t: 'Lo que se pierde', d: 'El perfil lo hace el escritorio más caro de las tres versiones para un mueble que el cliente no ve.' }],
        cumple: [['si', '1.20 × 0.60 m'], ['si', 'Tapa a 0.75 m'], ['si', 'Bandeja de cables impresa'], ['parcial', 'El más caro de las tres versiones']]
      }
    }
  };

  /* ----------------------------------------------------------- cálculo */
  /* --------------------------------------------- distribución de cada versión
     pos de los productos comprados que cambian de lugar: [X, y, D, giro] por unidad,
     con X desde el muro izquierdo y D desde la fachada (el mismo sistema del plano).
     La versión C usa la distribución del plano original (furniture.js). */
  const PI = Math.PI;
  const LAYOUT = {
    A: {
      1: { ubic: 'Muro del fondo, centrada en la sala; base a 0.40 m del piso', pos: [[2.175, 0.40, 5.5, 0]], resumen: 'Televisor de 75" colgado en vertical en el muro del fondo: cierra la vista desde la entrada. Muestra en bucle un video de cómo se imprime una pieza en 3D.', ens: { 2: 'Colgar el televisor en el muro del fondo, centrado en la sala y con la base a 0.40 m del piso.' } },
      6: { resumen: 'Cuatro sillas para bar negras en la barra de diseño, de frente a la vitrina de impresión.', ens: { 1: 'Van en fila del lado de la sala, mirando a la vitrina. Con el asiento a 78 cm quedan 27 cm libres bajo la tapa de 1.05 m.' }, ubic: 'Detrás de la barra de diseño, de frente a la vitrina de impresión', pos: [[1.5, 0, 2.62, 0], [2.05, 0, 2.62, 0], [2.6, 0, 2.62, 0], [3.15, 0, 2.62, 0]] },
      8: { resumen: 'Cuatro Bambu Lab P1S Combo AMS trabajando de frente al pasillo del centro comercial. Son más del 40 % del costo total del local.', ens: { 0: 'Colocar cada impresora sobre la vitrina de impresión, con ejes cada 0.80 m y la puerta hacia el pasillo. Mide 389 × 389 × 458 mm y pesa 12.95 kg, así que cabe en los 0.60 m de fondo.', 2: 'Ubicar la unidad AMS de cada equipo y cargar los carretes desde la repisa colgante.' }, ubic: 'Sobre la vitrina de impresión, de frente al pasillo del centro comercial', pos: [[1.05, 0.9, 0.55, 0], [1.85, 0.9, 0.55, 0], [2.65, 0.9, 0.55, 0], [3.45, 0.9, 0.55, 0]] },
      14: { ens: { 0: 'Uno en la esquina izquierda de la fachada, uno entre la torre y la estantería y uno al fondo del muro izquierdo.' }, ubic: 'Esquina izquierda de la fachada, entre la torre y la estantería, y al fondo del muro izquierdo', pos: [[0.32, 0, 0.45, 0], [5.78, 0, 1.7, 0], [0.32, 0, 4.75, 0]] },
      16: { ubic: 'Trastienda, contra el muro del fondo, a la izquierda', pos: [[0.15, 0, 7.0, 0]] },
      18: { ubic: 'Trastienda, frente al escritorio de taller', pos: [[2.9, 0, 6.02, PI]] }
    },
    B: {
      1: { ubic: 'Muro del fondo, en el eje de la entrada, sobre la cajonera; base a 0.95 m del piso', pos: [[2.525, 0.95, 5.5, 0]], resumen: 'Televisor de 75" colgado en vertical en el muro del fondo, en el eje de la entrada: es el remate del recorrido. Muestra en bucle un video de cómo se imprime una pieza en 3D.', ens: { 2: 'Colgar el televisor en el muro del fondo, en el eje de la entrada y con la base a 0.95 m del piso, sobre la cajonera.' } },
      6: { resumen: 'Cuatro sillas para bar negras en la barra de encuentro, de frente a la entrada.', ens: { 1: 'Van en fila del lado del fondo, mirando hacia la entrada. Con el asiento a 78 cm quedan 27 cm libres bajo la tapa de 1.05 m.' }, ubic: 'En la barra de encuentro, de frente a la entrada', pos: [[2.33, 0, 3.78, 0], [2.78, 0, 3.78, 0], [3.23, 0, 3.78, 0], [3.68, 0, 3.78, 0]] },
      8: { resumen: 'Cuatro Bambu Lab P1S Combo AMS dentro del nicho iluminado del laboratorio, en el muro derecho. Son más del 40 % del costo total del local.', ens: { 0: 'Colocar cada impresora sobre el mesón del laboratorio, con ejes cada 0.80 m y la puerta hacia la sala. Mide 389 × 389 × 458 mm y pesa 12.95 kg, así que cabe en los 0.60 m de fondo.', 2: 'Ubicar la unidad AMS de cada equipo y cargar los carretes desde la repisa del nicho.' }, ubic: 'En el laboratorio del muro derecho, mirando a la sala', pos: [[5.7, 0.9, 5.1, -PI / 2], [5.7, 0.9, 4.3, -PI / 2], [5.7, 0.9, 3.5, -PI / 2], [5.7, 0.9, 2.7, -PI / 2]] },
      14: { ens: { 0: 'Uno en la esquina izquierda de la fachada y uno a cada lado de la cajonera del fondo.' }, ubic: 'Esquina izquierda de la fachada y a los dos lados de la cajonera del fondo', pos: [[0.32, 0, 0.32, 0], [3.75, 0, 5.25, 0], [0.32, 0, 5.2, 0]] },
      16: { ubic: 'Trastienda, contra el muro del fondo, a la izquierda', pos: [[0.2, 0, 7.0, 0]] },
      18: { ubic: 'Trastienda, frente al escritorio lacado', pos: [[5.3, 0, 6.02, PI]] }
    },
    C: null
  };
  /* luminarias que siguen al mobiliario: la lámpara lineal sobre la barra o la mesa alta
     (centro X, D) y los dos colgantes sobre la isla (X, D, largo del cable) */
  const FIXTURES = {
    A: { lineal: [2.3, 2.0], pend: [[2.65, 4.15, 0.75], [3.35, 4.15, 0.89]] },
    B: { lineal: [3.0, 3.15], pend: [[3.0, 1.62, 0.95], [3.0, 2.3, 0.78]] },
    C: { lineal: [2.4, 3.85], pend: [[2.15, 1.3, 0.7], [2.85, 1.45, 0.84]] }
  };
  /* montaje del local en cada versión (C usa el del documento, en data.js) */
  const COMPRAS_FRENTE = { t: 'Compras', d: ['Impresoras y tres pantallas', 'Taburetes y maceteros', 'Estanterías y silla'] };
  const MONTAJE = {
    A: {
      intro: 'El montaje va del fondo hacia la fachada: primero la trastienda y los dos muros, después el centro, y la vitrina de impresión al final, porque una vez puesta cierra media fachada.',
      nota: 'La vitrina y la repisa colgante van contra la fachada: hay que coordinar con el centro comercial el horario de obra y el permiso para anclar a la losa.',
      frentes: [{ t: 'Metalmecánica', d: ['Estructuras soldadas', 'Marcos, ménsulas y colgantes', 'Pintura negra mate'] }, { t: 'Carpintería', d: ['Corte y enchape de Rovere', 'Cuerpos de melamina blanca', 'Tapas de 30 mm'] }, { t: 'Vidriería', d: ['Medir la cuadrícula soldada', 'Paños de templado de 6 mm'] }, COMPRAS_FRENTE],
      pasos: [
        { t: 'Trastienda', d: 'Mampara en cuadrícula, estanterías de bodega, escritorio de taller y silla', items: [15, 16, 17, 18] },
        { t: 'Muro izquierdo: el taller', d: 'Cajonera de repuestos y panel de herramientas', items: [10, 11] },
        { t: 'Muro derecho: la exhibición', d: 'Torre de producto, estantería y vitrina mural', items: [13, 2, 12] },
        { t: 'Fondo y centro', d: 'Pantalla de 75", mesa de producto y barra de diseño', items: [1, 3, 5] },
        { t: 'Fachada', d: 'Vitrina de impresión, repisa colgante, pedestal y pantallas de los pilares', items: [7, 9, 4, 19, 20] },
        { t: 'Puesta en marcha', d: 'Impresoras, LED, taburetes y maceteros', items: [8, 6, 14], led: true }
      ]
    },
    B: {
      intro: 'El montaje va del fondo hacia la fachada y deja la isla y los pedestales para el final: ocupan el eje del local y estorbarían el paso de los muebles largos.',
      nota: 'La laca es lo que más condiciona: los muebles llegan lacados y se protegen durante la obra; los retoques se hacen al final, con el local limpio.',
      frentes: [{ t: 'Carpintería', d: ['Cuerpos y nichos en MDF', 'Pieles curvas sobre molde', 'Tapas de Rovere'] }, { t: 'Pintura', d: ['Masillado y lijado', 'Laca catalizada blanca', 'Zócalos negros'] }, { t: 'Vidriería', d: ['Medir el vano terminado', 'Fijo y puerta de 10 mm'] }, COMPRAS_FRENTE],
      pasos: [
        { t: 'Trastienda', d: 'Mampara sin marco, estanterías de bodega, escritorio lacado y silla', items: [15, 16, 17, 18] },
        { t: 'Muro del fondo: el servicio', d: 'Cajonera, panel de accesorios y pantalla de 75"', items: [10, 11, 1] },
        { t: 'Muro derecho', d: 'Laboratorio de impresión con su repisa, vitrina de nicho y nicho de bienvenida', items: [7, 9, 12, 13] },
        { t: 'Muro izquierdo', d: 'Muro de nichos iluminados', items: [2] },
        { t: 'Centro', d: 'Barra de encuentro, isla escultórica, pedestales y pantallas de los pilares', items: [5, 3, 4, 19, 20] },
        { t: 'Puesta en marcha', d: 'Impresoras, LED, taburetes y maceteros', items: [8, 6, 14], led: true }
      ]
    },
    C: null
  };
  const cumple = (n, v) => (ITEMS[v] && ITEMS[v][n] && ITEMS[v][n].cumple) || [];

  const APROV = 0.72, CORTE_BARRA = 0.92, CORTE_M = 1.05;
  const mm = (v) => Math.round(v * 1000);
  const fmt = (v, d) => v.toFixed(d == null ? 2 : d);
  const cop = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const cache = {};

  function calc(vid) {
    if (cache[vid]) return cache[vid];
    const V = ITEMS[vid];
    if (!V) return null;
    // 1. cantidad de cada insumo por mueble
    const need = {};         // id -> { n: cantidad por mueble, tot }
    const touch = (id, n, q) => { const r = (need[id] = need[id] || { per: {}, tot: 0 }); r.per[n] = (r.per[n] || 0) + q; r.tot += q; };
    for (const n in V) {
      const it = V[n];
      it.piezas.forEach((p) => {
        const P = PRECIOS[p[0]];
        if (P.tipo === 'lamina' || P.tipo === 'm2') touch(p[0], n, p[2] * p[3] * (p[4] || 1));
        else if (P.tipo === 'kg') touch(p[0], n, p[2]);
        else touch(p[0], n, p[2] * p[3]);              // barra, m
      });
      it.acabados.forEach((a) => touch(a[0], n, a[2] * a[3]));
    }
    // 2. compras de la versión y su costo
    const compras = {};
    for (const id in need) {
      const P = PRECIOS[id], q = need[id].tot;
      let unidades, costo, texto;
      if (P.tipo === 'lamina') { unidades = Math.ceil(q / (P.area * APROV) - 1e-9); costo = unidades * P.precio; texto = unidades + (unidades === 1 ? ' lámina' : ' láminas') + ' · ' + fmt(q) + ' m² de piezas'; }
      else if (P.tipo === 'barra') { unidades = Math.ceil(q / (P.largo * CORTE_BARRA) - 1e-9); costo = unidades * P.precio; texto = unidades + ' × ' + P.pres.toLowerCase() + ' · ' + fmt(q, 1) + ' m'; }
      else if (P.tipo === 'm') { unidades = q * CORTE_M; costo = unidades * P.precio; texto = fmt(unidades, 1) + ' m'; }
      else if (P.tipo === 'm2') { unidades = Math.max(q, 3); costo = unidades * P.precio; texto = fmt(q) + ' m²' + (q < 3 ? ' (se paga el mínimo de 3 m²)' : ''); }
      else if (P.tipo === 'galon') { unidades = Math.ceil(q / P.rend - 1e-9); costo = unidades * P.precio; texto = unidades + (unidades === 1 ? ' galón' : ' galones') + ' · ' + fmt(q, 1) + ' m² × manos'; }
      else if (P.tipo === 'kg') { unidades = Math.ceil(q - 1e-9); costo = unidades * P.precio; texto = unidades + ' kg · ' + fmt(q, 1) + ' kg de piezas'; }
      compras[id] = { id, unidades, costo, texto, q };
    }
    // 3. filas de materiales de cada mueble
    const items = {};
    let total = 0;
    for (const n in V) {
      const it = V[n], rows = [], byId = {};
      const row = (id) => { if (!byId[id]) { const P = PRECIOS[id]; byId[id] = { key: id, m: P.m, usoP: [], q: 0, costo: 0, pu: precioTxt(P), prov: P.prov, nota: P.nota, u: P.u }; rows.push(byId[id]); } return byId[id]; };
      it.piezas.forEach((p) => {
        const P = PRECIOS[p[0]], r = row(p[0]);
        if (P.tipo === 'kg') r.usoP.push(p[1]);
        else if (P.tipo === 'lamina' || P.tipo === 'm2') r.usoP.push(p[2] + ' ' + p[1] + ' ' + mm(p[3]) + ' × ' + mm(p[4]));
        else r.usoP.push(p[2] + ' ' + p[1] + ' de ' + fmt(p[3]) + ' m');
      });
      it.acabados.forEach((a) => { const r = row(a[0]); r.usoP.push(a[1] + ' (' + fmt(a[2], 1) + ' m², ' + a[3] + (a[3] === 1 ? ' mano' : ' manos') + ')'); });
      // costo repartido de insumos agrupados
      rows.forEach((r) => {
        const P = PRECIOS[r.key], N = need[r.key], C = compras[r.key];
        const share = N.per[n] / N.tot;
        r.costo = C.costo * share;
        const q = N.per[n];
        r.cant = P.tipo === 'lamina' || P.tipo === 'm2' ? fmt(q) + ' m²' : P.tipo === 'kg' ? fmt(q, 1) + ' kg' : P.tipo === 'galon' ? fmt(q / P.rend) + ' de ' + C.unidades + (C.unidades === 1 ? ' galón' : ' galones') + ' de la versión' : P.tipo === 'm' ? fmt(q * CORTE_M, 1) + ' m' : fmt(q, 2) + ' m';
      });
      it.herrajes.forEach((h) => {
        const P = PRECIOS[h[0]], r = row(h[0]);
        r.usoP.push(h[1]); r.q += h[2]; r.costo += h[2] * P.precio;
        r.cant = r.q + (P.pres === 'Unidad' ? (r.q === 1 ? ' unidad' : ' unidades') : ' × ' + P.pres.toLowerCase());
        const C = compras[h[0]] || (compras[h[0]] = { id: h[0], unidades: 0, costo: 0, texto: '' });
        C.unidades += h[2]; C.costo += h[2] * P.precio; C.texto = C.unidades + ' × ' + P.pres.toLowerCase();
      });
      rows.forEach((r) => { r.uso = r.usoP.join('; '); r.costo = Math.round(r.costo); delete r.usoP; });
      const t = rows.reduce((a, r) => a + r.costo, 0);
      items[n] = { mats: rows, total: t };
      total += t;
    }
    // redondeo: la suma de los muebles debe dar lo mismo que la caja
    const caja = Object.values(compras).reduce((a, c) => a + c.costo, 0);
    const out = { items, compras: Object.values(compras).map((c) => Object.assign({ m: PRECIOS[c.id].m, prov: PRECIOS[c.id].prov, cat: PRECIOS[c.id].cat, u: PRECIOS[c.id].u, precio: PRECIOS[c.id] }, c, { costo: Math.round(c.costo) })), total, caja: Math.round(caja) };
    cache[vid] = out;
    return out;
  }
  function precioTxt(P) {
    const u = { lamina: ' por lámina', barra: ' por ' + (P.largo === 6 ? 'barra' : P.largo === 5 ? 'rollo' : 'tramo'), m: ' por metro', m2: ' por m²', galon: ' por galón', kg: ' por kg', unidad: P.pres === 'Unidad' ? ' por unidad' : ' por ' + P.pres.split(' ')[0].toLowerCase() }[P.tipo];
    return cop(P.precio) + u;
  }

  L.versions = { list: VERSIONES, precios: PRECIOS, items: ITEMS, req: REQ, cumple, generales: REQ_GENERALES, layout: LAYOUT, fixtures: FIXTURES, montaje: MONTAJE, calc, precioTxt, fecha: '16 de octubre de 2026' };
})();
