/* ============================================================================
   VERSIONES DEL LOCAL — tres alternativas de diseño para los 12 muebles que se
   fabrican, con su despiece, costos, fabricación, ensamble y requisitos.

     A · Original     melamina y MDF lacado (la del documento del proyecto; sus datos
                      viven en data.js y aquí solo se describe la versión)
     B · Industrial   acero negro y triplex barnizado
     C · Modular      perfil de aluminio 30 × 30, piezas impresas en PETG,
                      PVC espumado y fondos de luz en acrílico opal

   Los muebles comprados (pantallas, impresoras, taburetes, maceteros, bodega y
   silla) son los mismos en las tres versiones. Todas respetan la huella del plano.

   COSTOS DE B Y C: se calculan aquí mismo a partir del despiece, con los precios
   de PRECIOS (publicados en línea el 15 de octubre de 2026). Para cambiar un
   precio basta con editarlo en PRECIOS y la página recalcula todo.
     lamina   se compran las láminas que pide el total de la versión, con un
              aprovechamiento del 72 % (el promedio del plan de corte de la versión A),
              y su costo se reparte entre los muebles por área
     barra    igual, por metros, con 8 % de desperdicio de corte
     m        se paga por metro, con 5 % de corte
     m2       vidrio a medida, por metro cuadrado
     galon    pintura, barniz o pegante: galones para el área × manos de la versión,
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
    triplex15: { m: 'Triplex 15 mm, pino radiata BC, Araucoply', pres: 'Lámina 1.22 × 2.44 m', precio: 145900, tipo: 'lamina', area: 2.9768, prov: 'Homecenter', cat: 'Tableros y láminas', u: HC + '884277/triplex-15mm-122x244-metros/884275/', nota: 'Fenólico, cara B lijada; descuento por volumen desde 6 láminas (no aplicado)' },
    triplex18: { m: 'Triplex 18 mm, pino radiata BC, Araucoply', pres: 'Lámina 1.22 × 2.44 m', precio: 165900, tipo: 'lamina', area: 2.9768, prov: 'Homecenter', cat: 'Tableros y láminas', u: HC + '884277/triplex-18mm-122x244-metros-araucoply/884276/', nota: 'Misma línea que el de 15 mm' },
    triplex65: { m: 'Triplex 6.5 mm, Timbermac', pres: 'Lámina 1.22 × 2.44 m', precio: 78900, tipo: 'lamina', area: 2.9768, prov: 'Homecenter', cat: 'Tableros y láminas', u: HC + '903621/tablero-triplex-65mm-122x244m-1mm-timbermac/903621/', nota: 'Chapa de pino; espesor de 1/4", el del tablero perforado comercial' },
    triplex3: { m: 'Triplex 3.2 mm, Kingply', pres: 'Lámina 1.22 × 2.44 m', precio: 39500, tipo: 'lamina', area: 2.9768, prov: 'Homecenter', cat: 'Tableros y láminas', u: HC + '241021/tablero-triplex-32mm-122x244m-kingply/241021/', nota: 'No hay triplex de 4 mm en línea; se usa el de 3.2 mm para fondos' },
    mdf15: { m: 'MDF 15 mm, Trupan', pres: 'Lámina 1.83 × 2.44 m', precio: 134900, tipo: 'lamina', area: 4.4652, prov: 'Homecenter', cat: 'Tableros y láminas', u: HC + '884212/tablero-mdf-15mm-183x244m-trupan/884232/', nota: 'Precio del 9 de octubre de 2026 (versión A)' },
    pvc10: { m: 'Lámina de PVC espumado blanca 10 mm', pres: 'Lámina 1.22 × 2.44 m', precio: 155000, tipo: 'lamina', area: 2.9768, prov: 'Sign Colombia, Bogotá', cat: 'Tableros y láminas', u: 'https://signcolombia.com/products/laminas-de-pvc-1-22x2-44m', nota: 'Sobre pedido' },
    pvc5: { m: 'Lámina de PVC espumado blanca 5 mm', pres: 'Lámina 1.22 × 2.44 m', precio: 84800, tipo: 'lamina', area: 2.9768, prov: 'Sign Colombia, Bogotá', cat: 'Tableros y láminas', u: 'https://signcolombia.com/products/laminas-de-pvc-1-22x2-44m', nota: 'Sobre pedido' },
    hpl: { m: 'Laminado de alta presión blanco mate 0.6 mm', pres: 'Lámina 2.44 × 1.22 m', precio: 50355, tipo: 'lamina', area: 2.9768, prov: 'Madecentro', cat: 'Tableros y láminas', u: MC + 'laminado-de-alta-presion-blanco-mate-calibre-6-no-postformable', nota: 'No postformable: se pega en caras planas' },
    // vidrio y acrílico
    opal3: { m: 'Lámina de acrílico opal 3 mm', pres: 'Lámina 1.80 × 1.22 m', precio: 235620, tipo: 'lamina', area: 2.196, prov: 'Asia Colombia', cat: 'Vidrio y acrílico', u: 'https://www.asiacolombia.com.co/producto/lamina-de-acrilico-opal-3mm/', nota: 'La ficha dice «policarbonato celular» en un campo: confirmar el material al comprar' },
    acril3: { m: 'Lámina de acrílico transparente 3 mm', pres: 'Lámina 1.80 × 1.22 m', precio: 215000, tipo: 'lamina', area: 2.196, prov: 'Asia Colombia', cat: 'Vidrio y acrílico', u: 'https://www.asiacolombia.com.co/producto/lamina-de-acrilico-transparente-3mm/', nota: 'Precio del 9 de octubre de 2026 (versión A)' },
    vidrio6: { m: 'Vidrio templado incoloro 6 mm', pres: 'Por m², a medida', precio: 160000, tipo: 'm2', prov: 'El Ruso Shop, Bogotá', cat: 'Vidrio y acrílico', u: 'https://www.elrusoshop.com/producto/vidrio-templado-6mm/', nota: 'Antes $180.000; pedido mínimo de 3 m²; envío aparte' },
    // metal y perfilería
    tubo1: { m: 'Tubo cuadrado de acero 1" calibre 18', pres: 'Barra de 6 m', precio: 34900, tipo: 'barra', largo: 6, perim: 0.1016, prov: 'Homecenter', cat: 'Metal y perfilería', u: HC + '24436/tubo-cuadrado-1-x-1pg-x-12mm-c18-x-6m/24436/', nota: 'Pared de 1.2 mm (versión A)' },
    tubo15: { m: 'Tubo cuadrado de acero 1-1/2" calibre 18', pres: 'Barra de 6 m', precio: 39900, tipo: 'barra', largo: 6, perim: 0.1524, prov: 'Homecenter', cat: 'Metal y perfilería', u: HC + '183862/tubo-cuadrado-1-1-2-x-1-1-2pg-x-11mm-c18-x-6m/183862/', nota: 'Pared de 1.1 mm (versión A)' },
    tuboRect: { m: 'Tubo rectangular de acero 50 × 25 mm calibre 18', pres: 'Barra de 6 m', precio: 32900, tipo: 'barra', largo: 6, perim: 0.15, prov: 'Homecenter', cat: 'Metal y perfilería', u: HC + '183864/tubo-rectangular-50-x-25-x-11mm-c18-x-6m/183864/', nota: 'Pared de 1.1 mm; equivale a 2" × 1"' },
    perfil3030: { m: 'Perfil de aluminio estructural 30 × 30 T-slot', pres: 'Por metro (barra de 1 m)', precio: 45582, tipo: 'm', prov: 'Vistronica', cat: 'Metal y perfilería', u: 'https://www.vistronica.com/impresora-3d-y-cnc/perfil-de-aluminio-30x30-mm-t-slot-1-metro-para-cncimpresora-3d-detail.html', nota: 'Lista $59.976 por barra de 1 m; se aplica el 24 % de descuento que la tienda publica desde 50 unidades. Los tramos de más de 1 m se piden cortados de barra de 6 m a un distribuidor de perfilería: cotizar' },
    escuadra: { m: 'Escuadra de aluminio 3030A con tornillos M6 y 2 tuercas', pres: 'Unidad', precio: 3689, tipo: 'unidad', prov: 'Vistronica', cat: 'Metal y perfilería', u: 'https://www.vistronica.com/angulo-esquinero-de-aluminio-3030a-para-perfiles-industriales-30x30-detail.html', nota: 'Incluye su tornillería' },
    // acabados y pegantes
    anticorr: { m: 'Pintura anticorrosiva negro mate, Algreco', pres: 'Galón (3.78 L)', precio: 117900, tipo: 'galon', rend: 20, prov: 'Homecenter', cat: 'Acabados y pegantes', u: HC + '210351/pintura-anticorrosivo-mate-de-alta-proteccion-1-galon-negro/210351/', nota: 'Rinde 20 m² por mano (versión A)' },
    barniz: { m: 'Kit barniz mate Brillo Protect + catalizador, Algreco', pres: 'Galón', precio: 327900, tipo: 'galon', rend: 13, prov: 'Homecenter', cat: 'Acabados y pegantes', u: HC + '319300/kit-barniz-brillo-protect-mate-catalizador-algreco-1-galon/319300/', nota: 'Incluye catalizador; rinde 13 m² por mano según la ficha' },
    contacto: { m: 'Pegante de contacto PL285, Afix', pres: 'Galón', precio: 112900, tipo: 'galon', rend: 6, prov: 'Homecenter', cat: 'Acabados y pegantes', u: HC + '60576/pegante-pl285-uso-profesional-1-galon/60576/', nota: 'La ficha no da rendimiento: se suponen 6 m² de laminado pegado por galón (dos caras untadas)' },
    canto: { m: 'Canto PVC flexible blanco 19 mm', pres: 'Por metro (rollo de 200 m)', precio: 836, tipo: 'm', prov: 'Madecentro', cat: 'Acabados y pegantes', u: MC + 'canto-flexible-blanco-por-rollo-200', nota: '$167.200 el rollo (versión A)' },
    // herrajes e iluminación
    perfilLed: { m: 'Perfil de aluminio con cinta LED integrada, Bonuit', pres: 'Tramo de 3 m, 12 V', precio: 44910, tipo: 'barra', largo: 3, prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'perfil-en-aluminio-con-iluminacion-led-multicorte-empotrable-o-de-sobre-poner-negro-anodizado', nota: 'Luz cálida 3000 K con difusor (versión A)' },
    cob: { m: 'Tira LED COB 12 V luz cálida, Dairu', pres: 'Rollo de 5 m', precio: 69900, tipo: 'barra', largo: 5, prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '902920/tira-led-cob-12v-5m-luz-calida-dairu/902920/', nota: 'Precio del 9 de octubre de 2026 (versión A)' },
    fuente3: { m: 'Fuente de poder 12 V dimerizable, Bonuit (3 m)', pres: 'Unidad', precio: 42845, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'fuente-de-poder-cinco-metros-dimerizable', nota: '' },
    fuente8: { m: 'Fuente de poder 12 V dimerizable, Bonuit (8 m)', pres: 'Unidad', precio: 67250, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'fuente-de-poder-cinco-metros-dimerizable', nota: '' },
    fuente12: { m: 'Fuente de poder 12 V dimerizable, Bonuit (12 m)', pres: 'Unidad', precio: 99077, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'fuente-de-poder-cinco-metros-dimerizable', nota: '' },
    bisagraCaz: { m: 'Bisagra de cazoleta cierre lento, Bonuit', pres: 'Par con tornillos', precio: 3137, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'bisagra-de-cazoleta-para-mueble-cierre-lento', nota: '' },
    bisagraSold: { m: 'Bisagra de pistón 1/2" para soldar, Fixser', pres: 'Par', precio: 16900, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '16093/bisagra-piston-1-2pg-2und/16093/', nota: '$8.450 cada una' },
    riel45: { m: 'Riel de extensión total 45 cm, 38 kg', pres: 'Par con tornillos', precio: 9086, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'riel-extension-total-carga-media-250-mm-38-kg-acero', nota: '' },
    manija: { m: 'Manija 416 acero negro 128 mm, Fixser', pres: 'Unidad', precio: 9900, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '3073521/manija-416-acero-128mm-negro/3073521/', nota: 'Confirmar si 128 mm es la distancia entre centros' },
    rodachina: { m: 'Rodachina giratoria con freno 65 mm, 60 kg, Discover', pres: 'Unidad', precio: 37900, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '654842/rodachina-giratoria-tipo-americano-con-freno-negra-65-mm-21-2-discover/654842/', nota: '' },
    nivelador: { m: 'Nivelador de acero inoxidable rosca 5/16"', pres: 'Unidad', precio: 5246, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: 'https://madecentro.com/nivelador-con-rosca.html', nota: 'Antes $6.994. No hay rosca M8 en las tiendas consultadas: el inserto va a 5/16"' },
    kitRiel: { m: 'Kit riel para puerta deslizable negro 200 cm, Holztek', pres: 'Kit', precio: 299900, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '303177/kit-riel-puerta-deslizable/303177/', nota: 'Antes $339.900; no incluye la puerta' },
    ganchos: { m: 'Ganchos para tablero perforado, Crawford', pres: 'Juego de 43 piezas', precio: 89900, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '590124/ganchos-para-tablero-perforado-de-43-piezas-crawford/590124/', nota: 'Para tablero de 1/4"' },
    pasacable: { m: 'Pasacable rectangular PVC negro', pres: 'Unidad', precio: 1866, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: 'https://madecentro.com/collections/accesorios-para-herrajes/products/varios-pasa-cable-733', nota: '' },
    chazo: { m: 'Chazo expansivo 3/8" × 1-7/8", Fixser', pres: 'Paquete de 4', precio: 5400, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '76332/chazo-expansivo-3-8x1-7-8pg-4und-fixser/76332/', nota: '' },
    tornEns: { m: 'Tornillo de ensamble 6 × 2" zincado', pres: 'Caja de 100', precio: 6419, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: MC + 'tornillo-de-ensamble-6-x-2-zincado-caja-x-100', nota: '' },
    tornAuto: { m: 'Tornillo autoperforante 6 × 5/8" zincado', pres: 'Caja de 100', precio: 2687, tipo: 'unidad', prov: 'Madecentro', cat: 'Herrajes e iluminación', u: 'https://madecentro.com/collections/herrajes-y-ferreteria/products/tornillo-autoperforante-para-aglomerado-6-x-5-8-zincado-caja-x-100', nota: '' },
    tornM6: { m: 'Tornillo bristol M6 × 16 mm, Fixser', pres: 'Paquete de 2', precio: 4450, tipo: 'unidad', prov: 'Homecenter', cat: 'Herrajes e iluminación', u: HC + '593138/tornillo-bristol-m6-10-x16-2-undidades-fixser/593138/', nota: '' },
    // impresión 3D
    petg: { m: 'Filamento PETG 1.75 mm, Overture', pres: 'Carrete de 1 kg', precio: 93900, tipo: 'kg', prov: 'Electronilab, Bogotá', cat: 'Impresión 3D', u: 'https://electronilab.co/tienda/filamento-3d-petg-1-75-mm-1kg-color-amarillo/', nota: 'Precio de referencia (versión A); se imprime en las impresoras del taller' }
  };

  /* ------------------------------------------------------------- versiones */
  const VERSIONES = [
    {
      id: 'A', nombre: 'Original', titulo: 'Melamina y MDF lacado',
      color: '#e6dccb',
      concepto: 'Carpintería de tablero: melamina blanca, Rovere y Plomo en los módulos, islas curvas de MDF lacado y acero solo en las mesas. Es la versión del documento del proyecto.',
      materiales: ['Melamina RH blanca, Rovere y Plomo', 'MDF lacado en las islas', 'Tubo de acero negro en mesa y escritorio', 'Vidrio templado de 10 mm'],
      ventajas: ['Llega terminada de fábrica: casi no pide pintura ni barniz.', 'Corte y enchape en la misma tienda que vende el tablero.', 'Islas curvas lacadas, como en la imagen de referencia.'],
      contras: ['Muebles fijos: cambiar la exhibición obliga a rehacer piezas.', 'La melamina no se repara: un golpe en el canto queda a la vista.']
    },
    {
      id: 'B', nombre: 'Industrial', titulo: 'Acero negro y triplex',
      color: '#6fa8dc',
      concepto: 'Carpintería metálica a la vista y madera contrachapada barnizada: estructuras de tubo negro, cantos de triplex expuestos, islas sobre ruedas y una mampara en cuadrícula, como un taller.',
      materiales: ['Tubo cuadrado y rectangular de acero, pintura negra mate', 'Triplex de pino de 18, 15, 6.5 y 3.2 mm, barniz catalizado mate', 'Vidrio templado de 6 mm en paños', 'Ruedas con freno en las islas'],
      ventajas: ['Estructura de acero: aguanta golpes y la vibración de las impresoras.', 'Islas sobre ruedas: la sala se reorganiza para un evento sin desarmar nada.', 'La madera se lija y se vuelve a barnizar cuando se gasta.'],
      contras: ['El triplex llega crudo: lijarlo y barnizarlo es trabajo y una parte grande del costo.', 'Necesita soldador además de carpintero.', 'Es la más pesada de mover e instalar.']
    },
    {
      id: 'C', nombre: 'Modular', titulo: 'Aluminio y piezas impresas',
      color: '#ff9f0a',
      concepto: 'Un sistema desarmable de perfil de aluminio 30 × 30, el mismo de las impresoras y las máquinas CNC, con uniones, esquinas, bisagras y accesorios impresos en PETG en el propio taller, paneles livianos de PVC espumado y fondos de luz en acrílico opal.',
      materiales: ['Perfil de aluminio estructural 30 × 30 con escuadras', 'Piezas impresas en PETG naranja: esquinas, ménsulas, bisagras, tiradores', 'PVC espumado blanco de 10 y 5 mm', 'MDF con laminado de alta presión en las tapas', 'Acrílico opal iluminado'],
      ventajas: ['Todo se desarma y se reconfigura con una llave allen.', 'El mobiliario es vitrina del taller: cientos de piezas impresas a la vista.', 'Los repuestos los imprime el mismo taller.'],
      contras: ['La más cara en estructura: el perfil se paga por metro y cada unión lleva una escuadra.', 'Horas de impresora que no se dedican a ventas.', 'El PVC espumado y el acrílico se marcan con los golpes.']
    }
  ];

  /* ------------------------------------------------------------ requisitos */
  const REQ_GENERALES = [
    {
      id: 'espacio', t: 'Espacio y circulación', src: 'Plano de distribución',
      d: ['Local de 6.00 × 7.00 m: sala de ventas de 6.00 × 5.50 y trastienda de 6.00 × 1.40.',
        'Pasos libres: principal 2.00 m, lateral 1.10, entre isla y mesa 1.00 y servicio tras la mesa 0.70.',
        'Cada mueble conserva su huella del plano en las tres versiones, así que la distribución y los pasos libres son los mismos.',
        'Los muebles que viajan armados deben pasar por el vano de acceso de 4.80 m.']
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

  /* requisitos de cada mueble (los mismos para las tres versiones) y cómo los cumple la versión A */
  const REQ = {
    2: ['Huella de 2.40 × 0.40 m contra el muro izquierdo, sin invadir el paso lateral de 1.10 m', 'Luz cálida sobre el producto, sin puntos visibles', 'Entrepaños de 1.17 m de luz que no se curven', 'Anclada al muro: mide 2.40 m de alto', 'Guardado cerrado abajo para repuestos'],
    3: ['Huella de 2.00 × 1.10 m a 0.80 m de la fachada', 'Sin aristas vivas en la zona de circulación', 'Superficie superior que aguante el roce diario', 'Línea de luz continua reflejada en el piso', 'Debe llegar armada por el vano de 4.80 m', 'Toma de piso y fuente alcanzables'],
    4: ['Huella de 1.20 × 0.60 m, adosada a la isla principal y 15 cm más baja', 'Que las dos islas se lean como una sola pieza', 'Esquinas libres sin arista', 'Luz rasante con la fuente de la isla principal'],
    5: ['Huella de 1.80 × 0.70 m, con 1.00 m hacia la isla y 0.70 de servicio', 'Tapa a 1.05 m: 27 cm libres sobre el asiento de 78 cm', 'Piernas libres al frente y en la cabecera derecha', 'Reposapiés a unos 0.30 m', 'Aguantar los golpes de los taburetes'],
    7: ['Huella de 3.20 × 0.60 m, con una impresora cada 0.80 m', 'Tapa rígida para cuatro impresoras de 12.95 kg que vibran', 'Altura de trabajo de 0.90 m', 'Un pasacable por impresora', 'Guardado de filamento y repuestos abajo'],
    9: ['3.20 × 0.25 m sobre el mesón, a 1.60 m del piso', 'Carretes de 1 kg a la vista y sin estorbos', 'Sin elementos que compitan con los carretes', 'Anclaje firme al muro'],
    10: ['Huella de 3.00 × 0.50 m que no se meta en el paso principal de 2.00 m', 'Cajones que salgan completos, con carga de repuestos', 'Tapa clara para empacar y ver piezas pequeñas', 'Muchos compartimentos para repuestos'],
    11: ['2.20 × 1.22 m sobre el mueble bajo, con el borde inferior a 1.00 m', 'Carretes de 1 kg colgados sin que el soporte se dañe', 'Accesorios que se reubiquen sin herramientas', 'Separación del muro para los ganchos'],
    12: ['Caja de 0.40 × 0.15 × 1.20 m colgada a 1.05 m', 'Producto protegido del polvo y de las manos', 'Iluminación interior', 'Liviana para colgar de dos chazos'],
    13: ['Huella de 1.20 × 0.35 m, a 0.30 m de la fachada', 'Es lo primero que se ve desde el pasillo del centro comercial', 'Luz sobre el producto, sin puntos visibles', 'Anclada al muro: mide 2.40 m de alto', 'Entrepaños que no se curven'],
    15: ['Fijo de 1.05 m, puerta de 0.90 m y columna de 0.15 m en 2.40 m de alto', 'Que no corte si se rompe', 'Una puerta que no estorbe en la trastienda de 1.40 m', 'Visible para que nadie choque', 'Dejar pasar la luz'],
    17: ['Huella de 1.20 × 0.60 m en la trastienda', 'Altura de 0.75 m para trabajar sentado', 'Pasacable para el computador', 'Bajo costo: el cliente no lo ve']
  };
  /* estado: 'si' cumple, 'parcial' cumple con una salvedad */
  const CUMPLE_A = {
    2: [['si', 'Dos módulos de 1.20 × 0.40 m'], ['si', 'Perfil LED con difusor tras cada lateral y fondo blanco'], ['si', 'Entrepaños de 15 mm atornillados al fondo desde atrás'], ['si', 'Dos chazos por módulo'], ['si', 'Gabinete con cuatro puertas Plomo']],
    3: [['si', '2.00 × 1.10 m'], ['si', 'Tres esquinas de 0.25 m de radio'], ['si', 'Tapa de melamina Rovere, resistente a rayado'], ['si', 'Tira COB en el zócalo retranqueado'], ['si', 'Viaja armada'], ['si', 'Fuente en el hueco del zócalo posterior']],
    4: [['si', '1.20 × 0.60 m, 15 cm más baja'], ['si', 'Mismos materiales, laca y tapa'], ['si', 'Dos esquinas de 0.18 m de radio'], ['si', 'Conectada a la fuente de la isla principal']],
    5: [['si', '1.80 × 0.70 m'], ['si', 'Tapa doble a 1.05 m'], ['si', 'Estructura abierta de tubo, sin costados'], ['si', 'Reposapiés a 0.30 m'], ['si', 'Tubo de 1-1/2" pintado']],
    7: [['si', 'Cuatro módulos de 0.80 m'], ['si', 'Tapa doble de 30 mm'], ['si', '0.90 m'], ['si', 'Cuatro pasacables'], ['si', 'Puertas Plomo y entrepaño']],
    9: [['si', 'Dos tramos de 1.60 × 0.25 m de 30 mm'], ['si', 'Repisa libre de escuadras'], ['si', 'Se ve flotando'], ['si', 'Ocho soportes invisibles con chazos']],
    10: [['si', 'Cinco módulos de 0.60 m con perfil manija al ras'], ['si', 'Riel de extensión total de 38 kg'], ['si', 'Tapa blanca de 30 mm'], ['si', '15 cajones']],
    11: [['si', '2.20 × 1.22 m'], ['si', 'Lámina de acero calibre 20'], ['si', 'Ganchos de tablero perforado'], ['si', 'Bastidor de 15 mm']],
    12: [['si', '0.40 × 0.15 × 1.20 m'], ['si', 'Frente y entrepaños de acrílico'], ['si', 'Retal de perfil LED'], ['si', 'Acrílico: la mitad del peso del vidrio']],
    13: [['si', '1.20 × 0.35 m'], ['si', 'Toda en Rovere, distinta de la estantería blanca'], ['si', 'Perfil LED vertical tras cada lateral'], ['si', 'Dos chazos'], ['si', 'Entrepaños atornillados al fondo']],
    15: [['si', 'Vidrio fijo y puerta batiente'], ['si', 'Templado de 10 mm'], ['parcial', 'Batiente: barre 0.90 m de la trastienda al abrir'], ['si', 'Franja visible a la altura de los ojos'], ['si', 'Vidrio incoloro']],
    17: [['si', '1.20 × 0.60 m'], ['si', 'Tapa a 0.75 m'], ['si', 'Pasacable en la esquina trasera'], ['si', 'El mueble más barato del local']]
  };

  /* ------------------------------------------------------- muebles B y C
     piezas: [precio, nombre, cantidad, a, b]   lamina: a × b (m)  ·  barra/m: largo a (m)  ·  m2: a × b
             [precio, uso, kg]                   kg (filamento)
     herrajes: [precio, uso, cantidad de unidades de venta]
     acabados: [precio, uso, área en m², manos]
     El orden de seq es el de la animación de armado (el campo step de cada pieza en furniture-alt.js). */
  const ITEMS = {
    B: {
      2: {
        name: 'Estantería de acero y triplex', resumen: 'Tres marcos escalera de tubo negro de 1" con doce entrepaños de triplex de 18 mm, gabinete inferior de triplex y una línea de luz bajo cada entrepaño.',
        piezas: [['tubo1', 'parales', 6, 2.40], ['tubo1', 'travesaños', 18, 0.34], ['tubo1', 'largueros traseros', 4, 1.17], ['triplex18', 'entrepaños', 12, 1.17, 0.37], ['triplex15', 'puertas', 4, 0.585, 0.50], ['triplex15', 'costados del gabinete', 3, 0.34, 0.50], ['triplex3', 'fondos del gabinete', 2, 1.17, 0.52], ['perfilLed', 'perfiles bajo entrepaño', 8, 1.15]],
        herrajes: [['fuente12', 'Una para los 9.2 m de LED', 1], ['bisagraCaz', 'Dos por puerta', 4], ['manija', 'Una por puerta', 4], ['nivelador', 'Uno por paral', 6], ['chazo', 'Dos por marco', 2], ['tornEns', 'Entrepaños a los travesaños', 1]],
        acabados: [['anticorr', 'Marcos y largueros', 2.56, 2], ['barniz', 'Entrepaños por las dos caras, puertas y costados', 14.0, 2]],
        fab: ['Cortar el tubo de 1": 6 parales de 2.40 m, 18 travesaños de 0.34 m y 4 largueros de 1.17 m, y limpiar la rebaba.', 'Soldar tres marcos escalera de dos parales y seis travesaños, comprobando la escuadra por diagonales.', 'Perforar cada travesaño con dos agujeros de 5 mm para atornillar el entrepaño desde abajo.', 'Pulir los cordones, desengrasar y aplicar dos manos de anticorrosivo negro mate.', 'Cortar el triplex: 12 entrepaños de 1170 × 370 en 18 mm, 4 puertas de 585 × 500 y 3 costados de 340 × 500 en 15 mm, y 2 fondos de 1170 × 520 en 3.2 mm.', 'Lijar a grano 180, redondear 1 mm los cantos y dar dos manos de barniz mate catalizado.', 'Fresar la cazoleta de 35 mm de las bisagras en las cuatro puertas.'],
        ens: ['En el local: parar los tres marcos a 1.60 m de la fachada y unirlos con los cuatro largueros traseros.', 'Aplomar y anclar cada marco al muro con dos chazos.', 'Roscar un nivelador en la base de cada paral y nivelar.', 'Atornillar costados y fondos del gabinete, y colgar las puertas con su manija.', 'Asentar los entrepaños sobre los travesaños y atornillarlos desde abajo.', 'Fijar un perfil LED bajo el canto frontal de cada entrepaño y llevar los cables a la fuente, dentro del gabinete.'],
        seq: [{ t: 'Tres marcos escalera de tubo de 1"', src: 'Fabricación 2' }, { t: 'Largueros traseros y anclaje al muro', src: 'Ensamble 1 · 2' }, { t: 'Un nivelador bajo cada paral', src: 'Ensamble 3' }, { t: 'Gabinete: costados, fondos y puertas', src: 'Ensamble 4' }, { t: 'Entrepaños de triplex de 18 mm', src: 'Ensamble 5' }, { t: 'Perfil LED bajo cada entrepaño y fuente', src: 'Ensamble 6' }],
        why: [{ t: 'Marcos de tubo en vez de laterales de tablero', d: 'Tres marcos de 25 mm reemplazan cuatro laterales de 40 cm de fondo: el producto se ve también de lado y la estructura casi desaparece contra el muro.' }, { t: 'Triplex de 18 mm en los entrepaños', d: 'Sus chapas cruzadas trabajan a flexión: en 1.17 m de luz se curva menos que un aglomerado de 15 mm y no necesita un fondo que lo sostenga.' }, { t: 'Luz bajo cada entrepaño', d: 'Sin fondo no hay qué retroiluminar: la luz cae de cada entrepaño sobre el producto del nivel de abajo.' }, { t: 'Lo que se pierde', d: 'El triplex llega crudo: hay que lijarlo y barnizarlo, y el barniz es una parte grande del costo de este mueble.' }],
        cumple: [['si', 'Tres marcos en 2.40 × 0.40 m'], ['si', 'Perfil LED con difusor bajo cada entrepaño'], ['si', 'Triplex de 18 mm sobre travesaños de acero'], ['si', 'Dos chazos por marco'], ['si', 'Gabinete de triplex con cuatro puertas']]
      },
      3: {
        name: 'Isla móvil de acero y triplex', resumen: 'Un bastidor de tubo de 1-1/2" sobre seis ruedas con freno, forrado en triplex barnizado, con chaflanes de 45° en las tres esquinas libres y una tapa de 36 mm.',
        piezas: [['tubo15', 'aros inferior y superior (perímetro)', 2, 5.80], ['tubo15', 'parales', 6, 0.80], ['tubo15', 'travesaños', 2, 1.00], ['triplex15', 'paños rectos', 4, 1.24, 0.80], ['triplex15', 'chaflanes', 3, 0.17, 0.80], ['triplex18', 'tapas (dos capas)', 2, 2.00, 1.10], ['cob', 'tira bajo el aro inferior', 1, 5.80]],
        herrajes: [['rodachina', 'Seis ruedas con freno', 6], ['fuente12', 'Alimenta las dos islas', 1], ['tornEns', 'Paños y tapa al bastidor', 1]],
        acabados: [['anticorr', 'Bastidor', 2.80, 2], ['barniz', 'Paños, chaflanes y tapa', 7.8, 2]],
        fab: ['Cortar el tubo de 1-1/2" y soldar dos aros de 2.00 × 1.10 m con las tres esquinas en chaflán de 12 cm.', 'Unir los aros con seis parales de 0.80 m y dos travesaños, y soldar seis platinas para las ruedas.', 'Pulir, desengrasar y dar dos manos de anticorrosivo negro mate.', 'Cortar en triplex de 15 mm los cuatro paños rectos y los tres chaflanes; en 18 mm, las dos tapas con las esquinas en chaflán.', 'Pegar y atornillar las dos tapas entre sí: 36 mm de canto a la vista.', 'Lijar, redondear 1 mm los cantos y dar dos manos de barniz mate catalizado.'],
        ens: ['La isla viaja armada y sobre ruedas: pasa por el vano de 4.80 m.', 'Pegar la tira COB bajo el aro inferior, mirando al piso.', 'Atornillar paños y chaflanes al bastidor desde adentro.', 'Atornillar la tapa doble desde abajo, a través del aro superior.', 'Ubicarla a 0.80 m de la fachada y 1.50 m del muro izquierdo, conectar la fuente a la toma de piso y frenar las seis ruedas.'],
        seq: [{ t: 'Bastidor soldado: dos aros, seis parales', src: 'Fabricación 1 · 2' }, { t: 'Seis ruedas con freno', src: 'Fabricación 2' }, { t: 'Tira COB bajo el aro inferior', src: 'Ensamble 2' }, { t: 'Paños rectos y chaflanes de triplex', src: 'Ensamble 3' }, { t: 'Tapa doble de triplex de 36 mm', src: 'Ensamble 4' }, { t: 'Fuente de 12 V junto a la toma de piso', src: 'Ensamble 5' }],
        why: [{ t: 'Ruedas con freno', d: 'La isla se aparta para un evento, para limpiar o para reorganizar la sala, sin desarmarla. Con el freno puesto no se mueve.' }, { t: 'Chaflanes en vez de curvas', d: 'El triplex no se curva sin molde. Un corte a 45° quita la arista viva de las tres esquinas libres sin capas ni prensas.' }, { t: 'Tapa de 36 mm', d: 'El canto grueso del triplex barnizado muestra sus capas: es la cara del mueble y aguanta el apoyo de codos y cajas.' }, { t: 'Lo que se pierde', d: 'La tapa de triplex se raya más que la melamina y hay que renovarle el barniz cada uno o dos años.' }],
        cumple: [['si', '2.00 × 1.10 m'], ['si', 'Chaflanes de 12 cm a 45° en las tres esquinas libres'], ['parcial', 'Barniz catalizado: se renueva cada uno o dos años'], ['si', 'Tira COB bajo el aro inferior'], ['si', 'Viaja armada y sobre ruedas'], ['si', 'Fuente adentro; la isla se rueda para llegar a la toma']]
      },
      4: {
        name: 'Isla secundaria móvil de acero y triplex', resumen: 'El mismo bastidor de tubo sobre cuatro ruedas, forrado en triplex, con chaflanes en las dos esquinas del fondo; se acopla con dos pernos a la isla principal.',
        piezas: [['tubo15', 'aros inferior y superior (perímetro)', 2, 3.60], ['tubo15', 'parales', 4, 0.65], ['triplex15', 'paños', 3, 0.80, 0.65], ['triplex15', 'chaflanes', 2, 0.14, 0.65], ['triplex18', 'tapas (dos capas)', 2, 1.20, 0.60], ['cob', 'tira bajo el aro inferior', 1, 3.00]],
        herrajes: [['rodachina', 'Cuatro ruedas con freno', 4], ['tornEns', 'Paños y tapa al bastidor', 1]],
        acabados: [['anticorr', 'Bastidor', 1.5, 2], ['barniz', 'Paños, chaflanes y tapa', 3.4, 2]],
        fab: ['Repetir el método de la isla principal, con chaflanes de 10 cm en las dos esquinas del fondo.', 'Dejar sin forro la cara que se acopla a la isla principal y soldar en ella dos platinas perforadas para los pernos.'],
        ens: ['Ruedarla hasta la isla principal, a 2.30 m del muro izquierdo, 15 cm más baja.', 'Acoplar las dos islas con dos pernos por las platinas y frenar las ruedas.', 'Conectar su tira COB a la fuente de la isla principal.'],
        seq: [{ t: 'Bastidor soldado', src: 'Fabricación 1' }, { t: 'Cuatro ruedas con freno', src: 'Fabricación 1' }, { t: 'Tira COB bajo el aro inferior', src: 'Ensamble 3' }, { t: 'Paños y chaflanes de triplex', src: 'Fabricación 1' }, { t: 'Tapa doble de 36 mm', src: 'Fabricación 1' }],
        why: [{ t: 'El mismo sistema de la isla principal', d: 'Bastidor, ruedas, triplex y chaflanes iguales: las dos se leen como una pieza escalonada y se separan con dos pernos.' }],
        cumple: [['si', '1.20 × 0.60 m, 15 cm más baja'], ['si', 'Mismo bastidor, triplex y chaflanes'], ['si', 'Chaflanes de 10 cm en las dos esquinas libres'], ['si', 'Tira COB a la fuente de la isla principal']]
      },
      5: {
        name: 'Mesa de caballetes', resumen: 'Dos caballetes en A de tubo rectangular negro, unidos por dos reposapiés de 1", con una tapa doble de triplex de 36 mm.',
        piezas: [['tuboRect', 'patas inclinadas', 4, 1.01], ['tuboRect', 'travesaños de caballete', 4, 0.62], ['tubo1', 'reposapiés', 2, 1.50], ['triplex18', 'tapas (dos capas)', 2, 1.80, 0.70]],
        herrajes: [['nivelador', 'Uno por pata', 4], ['tornEns', 'Tapa a los caballetes', 1]],
        acabados: [['anticorr', 'Caballetes y reposapiés', 1.3, 2], ['barniz', 'Tapa y cantos', 1.7, 2]],
        fab: ['Cortar el tubo rectangular a ángulo y soldar dos caballetes en A de 1.02 m de alto con una plantilla, para que queden iguales.', 'Soldar en cada caballete un travesaño arriba, donde apoya la tapa, y otro a 0.30 m del piso.', 'Cortar dos reposapiés de 1.50 m en tubo de 1".', 'Pulir, desengrasar y dar dos manos de anticorrosivo negro mate.', 'Pegar y atornillar las dos tapas de triplex de 18 mm y barnizarlas.'],
        ens: ['Parar los dos caballetes a 15 cm de cada extremo y unirlos con los dos reposapiés, atornillados.', 'Roscar los niveladores y nivelar.', 'Asentar la tapa doble y atornillarla desde abajo a los travesaños.', 'Acomodar tres taburetes al frente y uno en la cabecera derecha.'],
        seq: [{ t: 'Dos caballetes en A de tubo rectangular', src: 'Fabricación 1 · 2' }, { t: 'Reposapiés entre los caballetes', src: 'Ensamble 1' }, { t: 'Niveladores', src: 'Ensamble 2' }, { t: 'Tapa inferior de triplex', src: 'Fabricación 5' }, { t: 'Tapa superior, atornillada desde abajo', src: 'Ensamble 3' }],
        why: [{ t: 'Caballetes en vez de cuatro patas', d: 'Los dos marcos en A cargan la tapa lejos de las esquinas: los taburetes entran por el frente y por la cabecera sin chocar con un tubo.' }, { t: 'Tubo rectangular de 50 × 25', d: 'Su cara ancha se lee como carpintería metálica y cuesta $5.483 por metro, menos que el cuadrado de 1-1/2" ($6.650).' }, { t: 'Lo que se pierde', d: 'Las patas inclinadas obligan a cortar a ángulo y a soldar con plantilla.' }],
        cumple: [['si', '1.80 × 0.70 m'], ['si', 'Tapa de 36 mm a 1.05 m'], ['si', 'Caballetes a 15 cm de cada extremo'], ['si', 'Dos tubos de 1" a 0.30 m'], ['si', 'Caballetes de tubo rectangular']]
      },
      7: {
        name: 'Banco de taller de acero y triplex', resumen: 'Cinco marcos de tubo de 1-1/2" bajo una tapa doble de triplex de 36 mm, abierto abajo con un entrepaño y ocho gavetas de triplex para el filamento.',
        piezas: [['tubo15', 'parales', 10, 0.86], ['tubo15', 'travesaños', 10, 0.52], ['tubo15', 'largueros', 4, 3.20], ['triplex18', 'tapas (dos capas)', 4, 1.60, 0.60], ['triplex18', 'entrepaños', 4, 0.77, 0.56], ['triplex15', 'gavetas (piezas)', 40, 0.40, 0.26], ['triplex3', 'fondos de gaveta', 8, 0.37, 0.48]],
        herrajes: [['nivelador', 'Uno por paral', 10], ['pasacable', 'Uno por impresora', 4], ['tornEns', 'Tapa, entrepaños y gavetas', 2]],
        acabados: [['anticorr', 'Marcos y largueros', 4.1, 2], ['barniz', 'Tapa, entrepaños y gavetas', 9.5, 2]],
        fab: ['Cortar el tubo de 1-1/2" y soldar cinco marcos de 0.86 × 0.60 m, con un travesaño arriba y otro a 0.10 m del piso.', 'Pulir, desengrasar y dar dos manos de anticorrosivo negro mate.', 'Pegar en sánduche las tapas de triplex de 18 mm: dos tramos de 1.60 m y 36 mm, con la junta en el eje del marco central.', 'Perforar las tapas para los cuatro pasacables, a 10 cm del borde trasero y en el eje de cada impresora.', 'Armar ocho gavetas de 0.37 × 0.48 × 0.26 m en triplex de 15 mm con fondo de 3.2 mm.', 'Lijar y dar dos manos de barniz mate catalizado a tapas, entrepaños y gavetas.'],
        ens: ['Parar los cinco marcos contra el muro de listones, cada 0.80 m desde 0.60 m del muro izquierdo.', 'Unirlos con los cuatro largueros, atornillados, y nivelar con los niveladores.', 'Asentar los entrepaños sobre los travesaños inferiores.', 'Atornillar los dos tramos de tapa desde abajo y colocar los pasacables.', 'Meter las gavetas sobre los entrepaños y pasar los cables de cada impresora por su pasacable.'],
        seq: [{ t: 'Cinco marcos de tubo de 1-1/2"', src: 'Fabricación 1' }, { t: 'Largueros que unen los marcos', src: 'Ensamble 2' }, { t: 'Niveladores', src: 'Ensamble 2' }, { t: 'Entrepaños de triplex', src: 'Ensamble 3' }, { t: 'Tapa doble de 36 mm y pasacables', src: 'Ensamble 4' }, { t: 'Gavetas para el filamento', src: 'Ensamble 5' }],
        why: [{ t: 'Acero bajo la tapa', d: 'Cinco marcos soldados no se descuadran con la vibración de cuatro impresoras; cada una queda entre dos marcos, a 40 cm de cada apoyo.' }, { t: 'Abierto abajo', d: 'Las cajas de filamento se ven y se alcanzan sin abrir puertas, como en un banco de taller.' }, { t: 'Lo que se pierde', d: 'Lo abierto acumula polvo, y el polvo daña el filamento: las gavetas lo protegen solo en parte.' }],
        cumple: [['si', 'Un marco cada 0.80 m'], ['si', 'Tapa de 36 mm sobre cinco marcos de acero'], ['si', '0.90 m'], ['si', 'Cuatro pasacables'], ['parcial', 'Ocho gavetas abiertas: menos protección del polvo']]
      },
      9: {
        name: 'Repisa de triplex con escuadras de acero', resumen: 'Dos tramos de triplex de 18 mm sobre cinco escuadras de tubo negro de 1" a la vista, ancladas al muro de listones a 1.60 m.',
        piezas: [['tubo1', 'escuadras (brazo, apoyo y diagonal)', 5, 0.69], ['triplex18', 'tramos', 2, 1.60, 0.25]],
        herrajes: [['chazo', 'Dos por escuadra', 3], ['tornAuto', 'Tramos a las escuadras', 1]],
        acabados: [['anticorr', 'Escuadras', 0.35, 2], ['barniz', 'Tramos por las dos caras', 1.8, 2]],
        fab: ['Soldar cinco escuadras de tubo de 1" con brazo de 0.22 m, apoyo de 0.20 m y diagonal, y perforar dos agujeros en cada apoyo.', 'Pintar con dos manos de anticorrosivo negro mate.', 'Cortar dos tramos de 1600 × 250 en triplex de 18 mm, lijar y barnizar.'],
        ens: ['Trazar una línea a nivel a 1.60 m del piso y anclar las cinco escuadras cada 0.78 m con dos chazos cada una.', 'Asentar los dos tramos y atornillarlos a las escuadras desde abajo.'],
        seq: [{ t: 'Cinco escuadras de acero ancladas a nivel', src: 'Ensamble 1' }, { t: 'Dos tramos de triplex de 18 mm', src: 'Ensamble 2' }],
        why: [{ t: 'Escuadras a la vista', d: 'En esta versión la repisa no finge flotar: el acero negro sostiene la madera como en un taller, a juego con las mesas y los marcos.' }, { t: 'Una capa de 18 mm', d: 'Con apoyos cada 0.78 m no hace falta el sánduche de 30 mm que pedía el soporte invisible.' }],
        cumple: [['si', 'Dos tramos de 1.60 × 0.25 m'], ['si', 'Escuadras bajo la repisa, no entre los carretes'], ['parcial', 'Las escuadras se ven: no flota'], ['si', 'Diez chazos']]
      },
      10: {
        name: 'Cajonera de acero y triplex', resumen: 'Seis marcos de tubo de 1" con 15 cajones de triplex sobre rieles de extensión total, frentes de triplex con manija de barra negra y tapa de 36 mm.',
        piezas: [['tubo1', 'parales', 12, 0.86], ['tubo1', 'travesaños', 12, 0.44], ['tubo1', 'largueros', 4, 3.00], ['triplex15', 'costados de cajón', 30, 0.45, 0.18], ['triplex15', 'frentes y traseros interiores', 30, 0.51, 0.18], ['triplex15', 'frentes de cajón', 15, 0.596, 0.252], ['triplex15', 'tapas laterales', 2, 0.87, 0.50], ['triplex18', 'tapas (dos capas)', 4, 1.50, 0.50], ['triplex3', 'fondos de cajón', 15, 0.538, 0.45]],
        herrajes: [['riel45', 'Un par por cajón', 15], ['manija', 'Una por cajón', 15], ['nivelador', 'Uno por paral', 12], ['tornEns', 'Cajones y tapa', 2], ['tornAuto', 'Rieles', 1]],
        acabados: [['anticorr', 'Marcos y largueros', 2.8, 2], ['barniz', 'Frentes, tapa y tapas laterales', 5.6, 2]],
        fab: ['Soldar seis marcos de tubo de 1" de 0.86 × 0.48 m y perforar en sus parales la posición de los tres rieles de cada módulo.', 'Pintar con dos manos de anticorrosivo negro mate.', 'Armar las 15 cajas de cajón en triplex de 15 mm con fondo de 3.2 mm atornillado por debajo.', 'Cortar los 15 frentes y las tapas, lijar y dar dos manos de barniz mate catalizado.', 'Pegar en sánduche las tapas de 18 mm: dos tramos de 1500 × 500 × 36 mm.'],
        ens: ['Parar los seis marcos a 2.00 m de la fachada, cada 0.60 m, y unirlos con los cuatro largueros.', 'Nivelar y atornillar las tapas laterales de triplex.', 'Atornillar los rieles a los parales y deslizar los cajones.', 'Fijar los frentes desde adentro dejando 3 mm de luz, y atornillar las manijas.', 'Asentar los dos tramos de tapa y atornillarlos desde abajo.'],
        seq: [{ t: 'Seis marcos de tubo de 1"', src: 'Fabricación 1' }, { t: 'Largueros, niveladores y tapas laterales', src: 'Ensamble 1 · 2' }, { t: 'Rieles de extensión total', src: 'Ensamble 3' }, { t: 'Quince cajas de cajón', src: 'Ensamble 3' }, { t: 'Frentes de triplex con manija negra', src: 'Ensamble 4' }, { t: 'Tapa doble de 36 mm', src: 'Ensamble 5' }],
        why: [{ t: 'Marcos de acero', d: 'Los rieles se atornillan al paral de acero, que no se afloja con el uso diario de quince cajones.' }, { t: 'Manija de barra negra', d: 'Repite el acero de la estructura en cada frente; cuesta $9.900 por cajón.' }, { t: 'Lo que se pierde', d: 'La manija sobresale unos 3 cm hacia el paso principal, y la tapa de pino barnizado es menos clara que la blanca para ver piezas pequeñas.' }],
        cumple: [['parcial', 'Cinco módulos de 0.60 m; las manijas sobresalen unos 3 cm'], ['si', 'Riel de extensión total de 38 kg'], ['parcial', 'Tapa de pino barnizado: clara, pero menos que la blanca'], ['si', '15 cajones']]
      },
      11: {
        name: 'Panel de triplex perforado', resumen: 'Un tablero de triplex de 6.5 mm perforado en el taller cada pulgada, sobre un bastidor de listones de triplex que lo separa 15 mm del muro.',
        piezas: [['triplex65', 'tablero perforado', 1, 2.20, 1.22], ['triplex15', 'listones del bastidor', 7, 2.20, 0.05]],
        herrajes: [['ganchos', 'Para carretes y herramientas', 2], ['chazo', 'Bastidor al muro', 2], ['tornAuto', 'Tablero al bastidor', 1]],
        acabados: [['barniz', 'Cara vista del tablero y listones', 3.4, 2]],
        fab: ['Cortar el triplex de 6.5 mm a 2.20 × 1.22 m.', 'Perforar con broca de 6 mm cada 25.4 mm usando una plantilla perforada y taladro de banco: más de 4.000 agujeros.', 'Lijar los bordes de los agujeros por la cara vista y dar dos manos de barniz mate.', 'Cortar siete listones de 50 mm en triplex de 15 mm.'],
        ens: ['Fijar al muro los tres listones horizontales con ocho chazos, con el borde inferior a 1.00 m del piso.', 'Atornillar los cuatro listones verticales entre ellos.', 'Atornillar el tablero perforado al bastidor.', 'Colgar los ganchos y cargar los carretes.'],
        seq: [{ t: 'Listones horizontales al muro', src: 'Ensamble 1' }, { t: 'Listones verticales', src: 'Ensamble 2' }, { t: 'Tablero de triplex perforado', src: 'Ensamble 3' }, { t: 'Ganchos y carretes', src: 'Ensamble 4' }],
        why: [{ t: 'Triplex en vez de MDF perforado', d: 'Los ganchos comerciales son para tablero de 1/4". En triplex de 6.5 mm las chapas cruzadas resisten el agujero mejor que el MDF, que se desgarra con el peso.' }, { t: 'Madera en vez de acero', d: 'El panel queda del mismo tono que las demás piezas de triplex de esta versión.' }, { t: 'Lo que se pierde', d: 'Perforar más de 4.000 agujeros con plantilla es una jornada de taller que no está en el costo.' }],
        cumple: [['si', '2.20 × 1.22 m'], ['parcial', 'Triplex de 6.5 mm: aguanta, pero menos que el acero'], ['si', 'Ganchos de tablero de 1/4"'], ['si', 'Bastidor de 15 mm']]
      },
      12: {
        name: 'Vitrina de triplex', resumen: 'Una caja de triplex de 15 mm con entrepaños de triplex, frente de acrílico en ranura y una línea de luz bajo el techo.',
        piezas: [['triplex15', 'laterales', 2, 1.20, 0.15], ['triplex15', 'techo y piso', 2, 0.37, 0.15], ['triplex15', 'entrepaños', 3, 0.37, 0.13], ['triplex3', 'fondo', 1, 0.39, 1.19], ['acril3', 'frente', 1, 0.396, 1.196], ['perfilLed', 'perfil bajo el techo', 1, 0.37]],
        herrajes: [['fuente3', 'Sobre el techo', 1], ['chazo', 'Al muro', 1]],
        acabados: [['barniz', 'Caja y entrepaños', 1.2, 2]],
        fab: ['Cortar las piezas de triplex y ranurar laterales, techo y piso a 8 mm del frente para el acrílico.', 'Lijar y barnizar.', 'Cortar el frente de acrílico con disco de diente fino y pulir los cantos.'],
        ens: ['Armar laterales, piso y fondo.', 'Atornillar los entrepaños, deslizar el frente por su ranura y cerrar con el techo.', 'Fijar el perfil LED bajo el techo.', 'Colgar con dos chazos, con la base a 1.05 m del piso.'],
        seq: [{ t: 'Laterales, piso y fondo', src: 'Ensamble 1' }, { t: 'Entrepaños de triplex', src: 'Ensamble 2' }, { t: 'Frente de acrílico y techo', src: 'Ensamble 2' }, { t: 'Perfil LED y fuente', src: 'Ensamble 3' }, { t: 'Colgar a 1.05 m', src: 'Ensamble 4' }],
        why: [{ t: 'La misma caja en triplex', d: 'Repite la madera del resto de la versión; el acrílico se mantiene porque pesa la mitad que el vidrio.' }, { t: 'Luz de arriba', d: 'Con entrepaños opacos, la luz entra desde el techo hacia el producto.' }],
        cumple: [['si', '0.40 × 0.15 × 1.20 m'], ['si', 'Frente de acrílico en ranura'], ['parcial', 'Luz desde el techo: los entrepaños opacos dan sombra'], ['si', 'Caja de triplex y acrílico']]
      },
      13: {
        name: 'Estantería escalera de acero y triplex', resumen: 'Dos marcos de tubo negro de 1" con seis entrepaños de triplex de 18 mm y una línea de luz bajo cada uno: madera y acero hacia el pasillo.',
        piezas: [['tubo1', 'parales', 4, 2.40], ['tubo1', 'travesaños', 12, 0.29], ['tubo1', 'largueros traseros', 2, 1.15], ['triplex18', 'entrepaños', 6, 1.15, 0.32], ['perfilLed', 'perfiles bajo entrepaño', 5, 1.13]],
        herrajes: [['fuente8', 'Para 5.7 m de LED', 1], ['nivelador', 'Uno por paral', 4], ['chazo', 'Dos por marco', 1], ['tornEns', 'Entrepaños', 1]],
        acabados: [['anticorr', 'Marcos y largueros', 1.6, 2], ['barniz', 'Entrepaños por las dos caras', 4.4, 2]],
        fab: ['Soldar dos marcos escalera de tubo de 1" con seis travesaños cada uno.', 'Pintar con dos manos de anticorrosivo negro mate.', 'Cortar seis entrepaños de 1150 × 320 en triplex de 18 mm, lijar y barnizar.'],
        ens: ['Parar los marcos a 0.30 m de la fachada y unirlos con los dos largueros traseros.', 'Anclar al muro con dos chazos por marco y nivelar.', 'Asentar los entrepaños y atornillarlos desde abajo.', 'Fijar un perfil LED bajo el frente de cinco entrepaños y subir los cables a la fuente.'],
        seq: [{ t: 'Dos marcos escalera de tubo', src: 'Fabricación 1' }, { t: 'Largueros y anclaje al muro', src: 'Ensamble 1 · 2' }, { t: 'Niveladores', src: 'Ensamble 2' }, { t: 'Seis entrepaños de triplex', src: 'Ensamble 3' }, { t: 'Perfiles LED y fuente', src: 'Ensamble 4' }],
        why: [{ t: 'Acero negro hacia el pasillo', d: 'Es el mueble que se ve desde el centro comercial: la madera natural y el tubo negro repiten la fachada negra.' }, { t: 'Sin fondo', d: 'El muro queda a la vista entre los entrepaños; la luz baja de cada entrepaño sobre las figuras.' }],
        cumple: [['si', 'Dos marcos en 1.20 × 0.35 m'], ['si', 'Pino natural y acero negro, a juego con la fachada'], ['si', 'Perfil LED con difusor bajo cada entrepaño'], ['si', 'Cuatro chazos'], ['si', 'Triplex de 18 mm']]
      },
      15: {
        name: 'Mampara de acero en cuadrícula', resumen: 'Un fijo y una puerta batiente de marco de tubo rectangular negro, divididos en paños de vidrio templado de 6 mm, como la mampara de la imagen de referencia.',
        piezas: [['tuboRect', 'marco del fijo (perímetro)', 1, 6.90], ['tuboRect', 'travesaños del fijo', 2, 1.00], ['tuboRect', 'marco de la puerta (perímetro)', 1, 6.48], ['tuboRect', 'travesaños de la puerta', 2, 0.83], ['vidrio6', 'paños del fijo', 3, 0.97, 0.76], ['vidrio6', 'paños de la puerta', 3, 0.80, 0.76]],
        herrajes: [['bisagraSold', 'Tres bisagras de pistón', 2], ['manija', 'Manija por las dos caras', 2], ['chazo', 'Marco del fijo al piso y al cielo', 2]],
        acabados: [['anticorr', 'Marcos', 2.6, 2]],
        fab: ['Medir el vano terminado, con piso y cielo instalados.', 'Soldar el marco del fijo (1.05 × 2.40 m) y el de la puerta (0.88 × 2.36 m) en tubo de 50 × 25, con travesaños a 0.80 y 1.60 m.', 'Soldar tres bisagras de pistón entre la puerta y su columna.', 'Pintar con dos manos de anticorrosivo negro mate.', 'Con los marcos terminados, la vidriería mide, corta y templa los seis paños de 6 mm.'],
        ens: ['Anclar el marco del fijo al piso y al cielo.', 'Colgar la puerta de sus bisagras y regular hasta que cierre sin rozar.', 'Asentar los paños de vidrio con su pisavidrio y sellarlos.', 'Atornillar la manija por las dos caras.'],
        seq: [{ t: 'Marco del fijo, anclado', src: 'Ensamble 1' }, { t: 'Puerta en su marco, con bisagras', src: 'Ensamble 2' }, { t: 'Paños de vidrio templado de 6 mm', src: 'Ensamble 3' }, { t: 'Manija', src: 'Ensamble 4' }],
        why: [{ t: 'Cuadrícula de acero', d: 'Es la mampara de la imagen de referencia: marco negro en paños, a juego con la fachada.' }, { t: 'Vidrio de 6 mm', d: 'El marco sostiene cada paño por los cuatro lados, así que basta un templado de 6 mm, que cuesta $160.000 el m² frente a $200.000 el de 10 mm.' }, { t: 'Travesaños a la altura de los ojos', d: 'La cuadrícula ya marca el plano del vidrio: no hace falta franja adhesiva.' }, { t: 'Lo que se pierde', d: 'El pisavidrio y el sellado se cotizan con la vidriería, que además cobra un mínimo de 3 m².' }],
        cumple: [['si', 'Fijo de 1.05 m y puerta de 0.90 m'], ['si', 'Templado de 6 mm en paños pequeños'], ['parcial', 'Batiente: barre 0.90 m de la trastienda'], ['si', 'Travesaños a 0.80 y 1.60 m'], ['si', 'Paños de vidrio incoloro']]
      },
      17: {
        name: 'Escritorio de triplex en U', resumen: 'Tapa y costados de triplex de 18 mm con un faldón trasero que lo rigidiza, sin piezas de metal.',
        piezas: [['triplex18', 'tapa', 1, 1.20, 0.60], ['triplex18', 'costados', 2, 0.60, 0.732], ['triplex15', 'faldón trasero', 1, 1.164, 0.30]],
        herrajes: [['pasacable', 'Esquina trasera', 1], ['tornEns', 'Unión de tapa, costados y faldón', 1]],
        acabados: [['barniz', 'Todas las caras vistas', 2.6, 2]],
        fab: ['Cortar la tapa, los dos costados y el faldón.', 'Perforar el pasacable en la esquina trasera.', 'Lijar y dar dos manos de barniz mate catalizado.'],
        ens: ['Atornillar el faldón entre los costados.', 'Asentar la tapa y atornillarla desde abajo, a 0.20 m del muro izquierdo.'],
        seq: [{ t: 'Costados y faldón', src: 'Ensamble 1' }, { t: 'Tapa con pasacable', src: 'Ensamble 2' }],
        why: [{ t: 'Sin soldadura', d: 'Es un mueble que el cliente no ve: tres tableros y tornillos, armado por el carpintero en una hora.' }, { t: 'Lo que se pierde', d: 'El barniz lo hace más caro que el escritorio de la versión A, que usa la pintura sobrante de la mesa.' }],
        cumple: [['si', '1.20 × 0.60 m'], ['si', 'Tapa a 0.75 m'], ['si', 'Pasacable'], ['parcial', 'Barato, pero más que el de la versión A']]
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
        cumple: [['si', 'Bastidor de 2.40 × 0.40 m'], ['si', 'Fondo de acrílico opal iluminado'], ['si', 'MDF de 15 mm con larguero de aluminio bajo el frente'], ['si', 'Dos chazos por marco'], ['si', 'Gabinete de PVC espumado con cuatro puertas']]
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
        cumple: [['si', '2.00 × 1.10 m'], ['si', 'Tres esquinas de 0.25 m de radio impresas'], ['si', 'Laminado de alta presión blanco'], ['si', 'Tira COB en el aro inferior'], ['si', 'Se arma en sitio con escuadras'], ['si', 'Paños clipados que se abren sin herramientas']]
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
        cumple: [['si', '1.20 × 0.60 m, 15 cm más baja'], ['si', 'Mismo sistema de perfil, PVC y esquinas impresas'], ['si', 'Dos esquinas de 0.18 m impresas'], ['si', 'Tira COB a la fuente de la isla principal']]
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
        cumple: [['si', 'Cinco módulos de 0.60 m, tiradores al ras'], ['parcial', 'Las bandejas salen dos tercios y cargan menos'], ['si', 'Laminado blanco mate'], ['si', '15 bandejas']]
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
        cumple: [['si', 'Cinco rieles en 2.20 × 1.22 m'], ['parcial', 'Traba impresa: carretes solo en los rieles bajos'], ['si', 'Los accesorios corren por la ranura'], ['si', 'El perfil separa 30 mm del muro']]
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
        cumple: [['si', '1.20 × 0.35 m'], ['parcial', 'Llama la atención con luz, pero pierde el contraste de madera'], ['si', 'Fondo opal a toda la altura'], ['si', 'Cuatro chazos'], ['si', 'MDF con larguero de aluminio']]
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
        cumple: [['si', 'Fijo de 1.05 m y puerta de 0.90 m'], ['si', 'Acrílico: no se rompe en esquirlas'], ['si', 'Corrediza: no barre la trastienda'], ['si', 'Paños opacos, imposibles de no ver'], ['parcial', 'Deja pasar la luz, pero no deja ver el taller']]
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

  L.versions = { list: VERSIONES, precios: PRECIOS, items: ITEMS, req: REQ, cumpleA: CUMPLE_A, generales: REQ_GENERALES, calc, fecha: '15 de octubre de 2026' };
})();
