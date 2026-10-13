/* ============================================================================
   Impresión 3D · Local de exhibición y taller
   DATOS DEL PROYECTO — todo el contenido editable vive en este archivo.

   Fuente: «Taller Impresión 3D — Mobiliario, materiales y fabricación»
   y «Planta de distribución y mobiliario» (9 de octubre de 2026).
   Precios en pesos colombianos (COP). Para actualizar un precio, un paso o un
   texto, se cambia aquí y la página lo refleja sin tocar el código 3D.

   Campos de cada elemento:
     n       número en el plano          origen  'fabrica' | 'compra'
     mats    filas de materiales (key = material que se resalta en el 3D)
     fab     pasos de fabricación        ens     pasos de ensamble
     seq     secuencia de la animación de armado (src = paso del que sale)
     why     razón de cada material
   ========================================================================== */
(function () {
  const L = (window.L3D = window.L3D || {});

  const items = [
    /* ------------------------------------------------------------------ 1 */
    {
      n: 1, id: 'pantalla75', name: 'Pantalla vertical «Tus ideas en 3D»', short: 'Pantalla 75"',
      origen: 'compra', grupo: 'Fachada y pantallas',
      dims: '0.95 × 0.08 × 1.67 m', cant: '1',
      ubic: 'Muro izquierdo, a 0.50 m de la fachada; base a 0.40 m del piso',
      total: 2990800,
      resumen: 'Televisor de 75" colgado en vertical: es lo primero que se ve al entrar por la izquierda. Muestra en bucle un video de cómo se imprime una pieza en 3D.',
      mats: [
        { key: 'producto', m: 'Televisor Hisense 75" QLED 4K 75Q6QV', uso: '166.9 × 95.2 × 7.9 cm', cant: '1', pu: '$2.899.900 por unidad', costo: 2899900, prov: 'Homecenter', nota: 'En oferta (normal $4.579.900); sin stock en línea el día de la consulta' },
        { key: 'soporte', m: 'Soporte fijo de TV de 32" a 75", Power', uso: 'Carga máxima 70 kg; se fija girado 90°', cant: '1', pu: '$90.900 por unidad', costo: 90900, prov: 'Homecenter', nota: 'Sin stock en línea' }
      ],
      fab: [],
      ens: [
        'Fijar el soporte girado 90°, para colgar el televisor en vertical.',
        'Dejar una toma eléctrica detrás de la pantalla antes de colgarla.',
        'Colgar el televisor en el muro izquierdo, a 0.50 m de la fachada y con la base a 0.40 m del piso.',
        'Cargar el contenido en formato vertical y dejarlo en reproducción continua.'
      ],
      seq: [
        { t: 'Fijar el soporte girado 90°', src: 'Instalación 1' },
        { t: 'Colgar el televisor en vertical', src: 'Instalación 3' }
      ],
      why: [
        { t: 'Medida comercial más cercana', d: 'El televisor de 75" mide 166.9 × 95.2 cm: en vertical ocupa 0.95 × 1.67 m, la medida comercial más cercana a los 0.90 × 1.80 m del plano.' },
        { t: 'Antes de comprar', d: 'Conviene confirmar con el fabricante que el modelo admite montaje vertical.' }
      ]
    },
    /* ------------------------------------------------------------------ 2 */
    {
      n: 2, id: 'estanteria-retro', name: 'Estantería exhibidora retroiluminada', short: 'Estantería retroiluminada',
      origen: 'fabrica', grupo: 'Mobiliario de exhibición',
      dims: '2.40 × 0.40 × 2.40 m', cant: '1 (2 módulos de 1.20)',
      ubic: 'Muro izquierdo, a 1.60 m de la fachada',
      total: 1741487,
      resumen: 'Dos módulos de 1.20 × 0.40 × 2.40 m con gabinete inferior, ocho entrepaños y luz LED vertical tras cada lateral.',
      mats: [
        { key: 'melBlanca', proc: ['aglomerado', 'melamina'], m: 'Melamina blanca RH 15 mm', uso: '4 laterales 2400 × 400; 6 techos, pisos y divisores 1170 × 400; 8 entrepaños 1170 × 380', cant: '10.20 m²', pu: '$226.756 por lámina', costo: 597867 },
        { key: 'melPlomo', proc: ['aglomerado', 'melamina'], m: 'Melamina Plomo RH 15 mm', uso: '4 puertas 596 × 520; 2 zócalos 1170 × 80', cant: '1.43 m²', pu: '$592.833 por lámina', costo: 327318 },
        { key: 'fondo', proc: ['aglomerado', 'melamina'], m: 'Fondo blanco 6 mm', uso: '2 fondos 2390 × 1190', cant: '5.69 m²', pu: '$212.534 por lámina', costo: 349980 },
        { key: 'canto', proc: ['canto'], m: 'Canto PVC 19 mm', uso: '27.6 m blanco y 8.9 m Plomo', cant: '36.5 m', pu: '$167.200 y $96.400 por rollo', costo: 77338 },
        { key: 'servicio', m: 'Corte y enchape en Madecentro', uso: 'Corte de láminas y pegado de canto', cant: '36.5 m de canto', pu: '$5.354 por lámina; $1.847 por metro', costo: 93807 },
        { key: 'led', proc: ['aluminio', 'led'], m: 'Perfil LED con cinta integrada', uso: 'Vertical, cortado a 1.80 m, uno por lateral', cant: '4 tramos de 3 m', pu: '$44.910 por tramo', costo: 179640 },
        { key: 'fuente', m: 'Fuente 12 V (variante 8 m)', uso: 'Una para los dos módulos, que suman 7.2 m de LED', cant: '1', pu: '$67.250 por unidad', costo: 67250 },
        { key: 'herraje', m: 'Bisagras cierre lento', uso: 'Dos por puerta', cant: '4 pares', pu: '$3.137 por par', costo: 12548 },
        { key: 'herraje', m: 'Soportes de entrepaño', uso: 'Cuatro por entrepaño', cant: '32', pu: '$153 por unidad', costo: 4896 },
        { key: 'patas', m: 'Patas niveladoras', uso: 'Cuatro por módulo', cant: '8', pu: '$2.042 por unidad', costo: 16336 },
        { key: 'anclaje', m: 'Tornillería y anclaje', uso: 'Tornillo de ensamble, autoperforante y chazos', cant: '1 caja, 1 caja y 1 paquete', pu: '$6.419, $2.687 y $5.400', costo: 14506 }
      ],
      fab: [
        'Pedir el corte de las 18 piezas blancas, 6 Plomo y 2 fondos según el despiece.',
        'Enchapar con canto de 19 mm el frente de laterales, techos y entrepaños, y los cuatro lados de cada puerta.',
        'Perforar en los laterales dos filas de agujeros de 5 mm para los soportes de entrepaño, del divisor hacia arriba.',
        'Fresar la cazoleta de 35 mm de las bisagras en las cuatro puertas.',
        'Cortar los cuatro perfiles LED a 1.80 m. Los cuatro retales de 1.20 m se guardan para la vitrina mural.'
      ],
      ens: [
        'Unir piso, divisor (a 0.60 m) y techo a los dos laterales con tornillos de ensamble, pretaladrando para no abrir el aglomerado.',
        'Escuadrar el módulo midiendo las dos diagonales y atornillar el fondo de 6 mm por detrás; el fondo es lo que mantiene la escuadra.',
        'Atornillar las patas niveladoras bajo el piso, como apoyo intermedio, y encajar el zócalo Plomo entre los laterales, que llegan hasta el suelo.',
        'Colgar las puertas y regular las bisagras hasta dejar 3 mm de luz entre ellas.',
        'Atornillar un perfil LED tras el frente de cada lateral y llevar los cables a la fuente, que queda dentro del gabinete inferior.',
        'En el local: nivelar, unir los dos módulos entre sí por los laterales y anclar cada uno al muro con dos chazos.',
        'Colocar soportes y entrepaños, y fijar cada entrepaño al fondo con dos tornillos desde atrás para que no flecte en 1.17 m de luz.'
      ],
      seq: [
        { t: 'Piso, divisor y techo entre los dos laterales', src: 'Ensamble 1' },
        { t: 'Fondo de 6 mm atornillado por detrás: mantiene la escuadra', src: 'Ensamble 2' },
        { t: 'Patas niveladoras y zócalo Plomo', src: 'Ensamble 3' },
        { t: 'Puertas con bisagras de cierre lento', src: 'Ensamble 4' },
        { t: 'Perfil LED tras cada lateral y fuente en el gabinete', src: 'Ensamble 5' },
        { t: 'Unir los dos módulos y anclar al muro', src: 'Ensamble 6' },
        { t: 'Soportes y entrepaños', src: 'Ensamble 7' }
      ],
      why: [
        { t: 'Melamina blanca', d: 'Llega terminada, no necesita pintura y el blanco devuelve la luz del LED hacia las piezas. Es el tablero más barato del proyecto.' },
        { t: 'Plomo solo en puertas y zócalo', d: 'Es el tablero más caro ($592.833 por lámina), así que se usa donde se ve y donde el pie golpea.' },
        { t: 'Fondo de 6 mm', d: 'Rigidiza el mueble con menos de la mitad del peso de un fondo de 15 mm.' },
        { t: 'Perfil con difusor en vez de cinta desnuda', d: 'Oculta los puntos de luz y protege la cinta del polvo y de las manos.' }
      ]
    },
    /* ------------------------------------------------------------------ 3 */
    {
      n: 3, id: 'isla-principal', name: 'Isla exhibidora principal', short: 'Isla principal',
      origen: 'fabrica', grupo: 'Mobiliario de exhibición',
      dims: '2.00 × 1.10 × 0.95 m', cant: '1',
      ubic: 'Centro, a 0.80 m de la fachada y 1.50 m del muro izquierdo',
      total: 1262063,
      resumen: 'Un cuerpo lacado en blanco con tres esquinas curvas de 0.25 m de radio, tapa Rovere y una línea de luz rasante bajo el zócalo.',
      mats: [
        { key: 'mdf15', proc: ['mdf'], m: 'MDF 15 mm', uso: 'Piso y bastidor superior 1960 × 1060; paños rectos 1500, 1750, 600 y 850 × 820; 8 costillas 820 × 300; zócalos 2 de 1800 × 100 y 2 de 900 × 100', cant: '10.52 m²', pu: '$134.900 por lámina', costo: 489704 },
        { key: 'mdf55', proc: ['mdf'], m: 'MDF 5.5 mm', uso: '6 pieles de esquina 820 × 420 (dos capas por esquina)', cant: '2.07 m²', pu: '$63.900 por lámina', costo: 42073 },
        { key: 'melRovere', proc: ['aglomerado', 'melamina'], m: 'Melamina Rovere RH 15 mm', uso: 'Tapa 2000 × 1100 con esquinas redondeadas', cant: '2.20 m²', pu: '$444.625 por lámina', costo: 291513 },
        { key: 'canto', proc: ['canto'], m: 'Canto PVC Rovere 19 mm', uso: 'Perímetro de la tapa', cant: '5.8 m', pu: '$285.600 por rollo', costo: 22940 },
        { key: 'servicio', m: 'Corte y enchape en Madecentro', uso: 'Tapa', cant: '5.8 m de canto', pu: '$5.354 por lámina; $1.847 por metro', costo: 13994 },
        { key: 'laca', m: 'Laca catalizada blanca semimate', uso: 'Tres manos sobre 5 m² de cuerpo', cant: '1.48 de los 2 galones que se compran para las dos islas', pu: '$80.900 por galón', costo: 119732 },
        { key: 'led', proc: ['led'], m: 'Tira LED COB 12 V', uso: 'Luz rasante bajo el cuerpo, 7 m de perímetro', cant: '1.41 rollos de 5 m', pu: '$69.900 por rollo', costo: 98559 },
        { key: 'fuente', m: 'Fuente 12 V (variante 12 m)', uso: 'Alimenta las dos islas', cant: '1', pu: '$99.077 por unidad', costo: 99077 },
        { key: 'pegante', m: 'Pegante Carpincol', uso: 'Esqueleto y pieles', cant: '2 kg', pu: '$32.900 por kg', costo: 65800 },
        { key: 'patas', m: 'Patas niveladoras', uso: 'Bajo el piso estructural', cant: '6', pu: '$2.042 por unidad', costo: 12252 },
        { key: 'anclaje', m: 'Tornillo de ensamble', uso: 'Esqueleto', cant: '1 caja', pu: '$6.419 por caja', costo: 6419 }
      ],
      fab: [
        'Hacer una plantilla de la planta (2.00 × 1.10 m con tres esquinas de 0.25 m de radio) y copiarla con ruteadora en el piso, el bastidor superior y la tapa.',
        'Cortar los cuatro paños rectos y las ocho costillas en MDF de 15 mm.',
        'Armar el esqueleto: piso, costillas verticales y bastidor superior, encolados con Carpincol y atornillados.',
        'Atornillar los paños rectos a las costillas.',
        'Cerrar cada esquina con dos capas de MDF de 5.5 mm encoladas entre sí sobre las costillas, sujetas con zunchos hasta que seque el pegante.',
        'Masillar las juntas, lijar y aplicar tres manos de laca con pistola, lijando suave entre manos.',
        'Enchapar el perímetro de la tapa Rovere, incluidas las curvas.',
        'Armar el zócalo retranqueado de 100 mm, pintarlo de negro y pegar la tira LED en su cara exterior, mirando al piso.'
      ],
      ens: [
        'La isla viaja armada; pasa por el vano de acceso de 4.80 m.',
        'Ubicarla a 0.80 m de la fachada y 1.50 m del muro izquierdo, y nivelarla con las seis patas.',
        'Atornillar la tapa Rovere desde adentro, a través del bastidor superior.',
        'Dejar la fuente de 12 V en el hueco del zócalo de la cara posterior, donde se alcanza con la mano, y conectarla a la toma de piso.'
      ],
      seq: [
        { t: 'Esqueleto: piso, costillas y bastidor superior encolados', src: 'Fabricación 3' },
        { t: 'Paños rectos atornillados a las costillas', src: 'Fabricación 4' },
        { t: 'Esquinas: dos capas de MDF de 5.5 mm por curva', src: 'Fabricación 5' },
        { t: 'Zócalo retranqueado negro con la tira LED', src: 'Fabricación 8' },
        { t: 'Ubicar en el local y nivelar con las seis patas', src: 'Ensamble 2' },
        { t: 'Tapa Rovere atornillada desde adentro', src: 'Ensamble 3' },
        { t: 'Fuente de 12 V en el hueco del zócalo', src: 'Ensamble 4' }
      ],
      why: [
        { t: 'MDF y no melamina en el cuerpo', d: 'La melamina no se puede curvar ni pintar; el MDF se deja rutear, doblar en capas delgadas y lacar sin que se marque la veta.' },
        { t: 'Dos capas de 5.5 mm en las curvas', d: 'Una sola lámina de 15 mm no toma un radio de 0.25 m; dos delgadas sí, y juntas recuperan rigidez.' },
        { t: 'Tapa en Rovere', d: 'La superficie de trabajo recibe roce todo el día, y la ficha de la melamina declara resistencia a rayado y abrasión, sin necesidad de repintar.' },
        { t: 'Tira COB en el zócalo', d: 'Da una línea de luz continua, sin puntos, que es lo que se ve reflejado en el piso pulido.' }
      ]
    },
    /* ------------------------------------------------------------------ 4 */
    {
      n: 4, id: 'isla-secundaria', name: 'Isla exhibidora secundaria', short: 'Isla secundaria',
      origen: 'fabrica', grupo: 'Mobiliario de exhibición',
      dims: '1.20 × 0.60 × 0.80 m', cant: '1',
      ubic: 'Adosada detrás de la isla principal, a 2.30 m del muro izquierdo',
      total: 425114,
      resumen: 'Un cuerpo con dos esquinas curvas, 15 cm más bajo que la isla principal, para que las dos se lean como una pieza escalonada.',
      mats: [
        { key: 'mdf15', proc: ['mdf'], m: 'MDF 15 mm', uso: 'Piso y bastidor 1160 × 560; paño posterior 840 × 670; 2 costados 420 × 670; 4 costillas 670 × 300; zócalos', cant: '3.42 m²', pu: '$134.900 por lámina', costo: 159187 },
        { key: 'mdf55', proc: ['mdf'], m: 'MDF 5.5 mm', uso: '4 pieles de esquina 670 × 400', cant: '1.07 m²', pu: '$63.900 por lámina', costo: 21827 },
        { key: 'melRovere', proc: ['aglomerado', 'melamina'], m: 'Melamina Rovere RH 15 mm', uso: 'Tapa 1200 × 600', cant: '0.72 m²', pu: '$444.625 por lámina', costo: 95404 },
        { key: 'canto', proc: ['canto'], m: 'Canto PVC Rovere 19 mm', uso: 'Tres lados de la tapa', cant: '2.9 m', pu: '$285.600 por rollo', costo: 11470 },
        { key: 'servicio', m: 'Corte y enchape en Madecentro', uso: 'Tapa', cant: '2.9 m de canto', pu: '$5.354 por lámina; $1.847 por metro', costo: 6430 },
        { key: 'laca', m: 'Laca catalizada blanca semimate', uso: 'Tres manos sobre 1.8 m²', cant: '0.52 de los 2 galones', pu: '$80.900 por galón', costo: 42068 },
        { key: 'led', proc: ['led'], m: 'Tira LED COB 12 V', uso: '3 m bajo el cuerpo', cant: '0.59 rollos de 5 m', pu: '$69.900 por rollo', costo: 41241 },
        { key: 'pegante', m: 'Pegante Carpincol', uso: 'Esqueleto y pieles', cant: '1 kg', pu: '$32.900 por kg', costo: 32900 },
        { key: 'patas', m: 'Patas niveladoras', uso: 'Bajo el piso', cant: '4', pu: '$2.042 por unidad', costo: 8168 },
        { key: 'anclaje', m: 'Tornillo de ensamble', uso: 'Esqueleto', cant: '1 caja', pu: '$6.419 por caja', costo: 6419 }
      ],
      fab: [
        'Repetir el método de la isla principal, con 0.18 m de radio en las dos esquinas del fondo.',
        'Dejar recta y sin lacar la cara que queda contra la isla principal.'
      ],
      ens: [
        'En el local: adosarla a 2.30 m del muro izquierdo, nivelarla 15 cm por debajo de la isla principal y unir los dos cuerpos con cuatro tornillos desde adentro.',
        'Conectar su tira LED a la fuente de la isla principal.'
      ],
      seq: [
        { t: 'Esqueleto: piso, costillas y bastidor', src: 'Fabricación 1' },
        { t: 'Paño posterior y costados', src: 'Fabricación 1' },
        { t: 'Esquinas curvas de 0.18 m en doble capa', src: 'Fabricación 1' },
        { t: 'Zócalo negro con la tira LED', src: 'Fabricación 1' },
        { t: 'Adosar a la isla principal, 15 cm más baja, y nivelar', src: 'Ensamble 1' },
        { t: 'Tapa Rovere y conexión de la tira LED a la fuente', src: 'Ensamble 2' }
      ],
      why: [
        { t: 'Los mismos de la isla principal', d: 'Para que las dos se lean como una sola pieza escalonada y compartan pegante, laca y fuente.' }
      ]
    },
    /* ------------------------------------------------------------------ 5 */
    {
      n: 5, id: 'mesa-alta', name: 'Mesa alta de atención', short: 'Mesa alta',
      origen: 'fabrica', grupo: 'Mobiliario de trabajo',
      dims: '1.80 × 0.70 × 1.05 m', cant: '1',
      ubic: 'A 3.50 m de la fachada y 1.50 m del muro izquierdo',
      total: 641799,
      resumen: 'Estructura soldada en tubo de acero de 1-1/2" pintada de negro mate, con tapa doble en Rovere de 30 mm.',
      mats: [
        { key: 'acero', proc: ['tubo'], m: 'Tubo cuadrado de acero 1-1/2" calibre 18', uso: '4 patas de 1.02 m; 4 largueros de 1.72 m; 4 travesaños de 0.62 m (13.44 m)', cant: '3 barras de 6 m', pu: '$39.900 por barra', costo: 119700 },
        { key: 'pintura', m: 'Pintura anticorrosiva negro mate', uso: 'Dos manos; alcanza también para el escritorio y los retoques', cant: '1 galón', pu: '$117.900 por galón', costo: 117900 },
        { key: 'melRovere', proc: ['aglomerado', 'melamina'], m: 'Melamina Rovere RH 15 mm', uso: 'Tapa superior 1800 × 700 y tapa inferior 1760 × 660', cant: '2.42 m²', pu: '$444.625 por lámina', costo: 320876 },
        { key: 'canto', proc: ['canto'], m: 'Canto PVC Rovere 19 mm', uso: 'Perímetro de las dos tapas', cant: '9.8 m', pu: '$285.600 por rollo', costo: 38918 },
        { key: 'servicio', m: 'Corte y enchape en Madecentro', uso: 'Corte y pegado de canto', cant: '9.8 m de canto', pu: '$5.354 por lámina; $1.847 por metro', costo: 21787 },
        { key: 'servicio', m: 'Servicio de engruese tipo sánduche', uso: 'Une las dos tapas', cant: '1', pu: '$19.931', costo: 19931 },
        { key: 'anclaje', m: 'Tornillo autoperforante', uso: 'Fija la tapa a la estructura', cant: '1 caja de 100', pu: '$2.687 por caja', costo: 2687 }
      ],
      fab: [
        'Cortar los tubos a escuadra según el despiece y limpiar la rebaba.',
        'Soldar dos marcos laterales: dos patas, un travesaño arriba y otro a 0.30 m del piso, que será el reposapiés.',
        'Unir los marcos con los cuatro largueros, dos arriba y dos a la altura del reposapiés, comprobando la escuadra por diagonales.',
        'Cerrar la boca inferior de las patas con tapas del mismo tubo, pulir los cordones y desengrasar.',
        'Perforar los largueros y travesaños superiores: 10 mm en la pared de abajo, para que entre la cabeza del tornillo, y 4 mm en la de arriba.',
        'Aplicar dos manos de anticorrosivo negro mate.',
        'Enchapar las dos tapas y unirlas en sánduche, con la inferior retranqueada 20 mm por lado.'
      ],
      ens: [
        'La estructura llega soldada en una pieza de 1.80 × 0.70 × 1.02 m.',
        'Ubicarla a 3.50 m de la fachada y 1.50 m del muro izquierdo.',
        'Centrar la tapa y atornillarla desde abajo con 12 tornillos autoperforantes.',
        'Acomodar tres taburetes al frente y uno en la cabecera derecha.'
      ],
      seq: [
        { t: 'Soldar dos marcos laterales: patas, travesaño superior y reposapiés', src: 'Fabricación 2' },
        { t: 'Unir los marcos con los cuatro largueros', src: 'Fabricación 3' },
        { t: 'Tapa inferior, retranqueada 20 mm por lado', src: 'Fabricación 7' },
        { t: 'Tapa superior Rovere, atornillada desde abajo', src: 'Ensamble 3' }
      ],
      why: [
        { t: 'Acero y no tablero en las patas', d: 'A 1.05 m de altura, una mesa de melamina necesita costados cerrados; el tubo deja pasar las piernas y aguanta los golpes de los taburetes.' },
        { t: 'Tubo de 1-1/2"', d: 'Cuesta solo $5.000 más por barra que el de 1" y se ve proporcionado en 1.80 m de largo.' },
        { t: 'Tapa doble retranqueada', d: 'Suma 30 mm de espesor y se enchapa con el mismo canto de 19 mm del resto del proyecto.' }
      ]
    },
    /* ------------------------------------------------------------------ 6 */
    {
      n: 6, id: 'taburetes', name: 'Taburete alto', short: 'Taburetes',
      origen: 'compra', grupo: 'Mobiliario comprado',
      dims: 'Ø 0.35 × 0.75 m', cant: '4',
      ubic: 'Tres al frente de la mesa alta y uno en la cabecera derecha',
      total: 999600,
      resumen: 'Cuatro sillas para bar negras alrededor de la mesa alta de atención.',
      mats: [
        { key: 'producto', m: 'Silla para bar Palermo negra', uso: 'Polipropileno; asiento a 78 cm; 48 × 52 × 108 cm', cant: '4', pu: '$249.900 por unidad', costo: 999600, prov: 'Madecentro', nota: 'Antes $299.900' }
      ],
      fab: [],
      ens: [
        'Se arman según su instructivo.',
        'Van tres al frente de la mesa alta y uno en la cabecera. Con el asiento a 78 cm quedan 27 cm libres bajo la tapa de 1.05 m.'
      ],
      seq: [],
      why: [
        { t: 'Producto de serie', d: 'Se compran hechos porque son productos de serie: no hay nada que diseñar ni fabricar.' }
      ]
    },
    /* ------------------------------------------------------------------ 7 */
    {
      n: 7, id: 'meson', name: 'Mesón de impresoras', short: 'Mesón de impresoras',
      origen: 'fabrica', grupo: 'Mobiliario de trabajo',
      dims: '3.20 × 0.60 × 0.90 m', cant: '1',
      ubic: 'Contra el muro de listones del fondo, a 0.60 m del muro izquierdo',
      total: 2153047,
      resumen: 'Cuatro módulos de 0.80 m, uno por impresora, con puertas Plomo y una tapa Rovere de 30 mm que reparte la carga y vibra menos.',
      mats: [
        { key: 'melBlanca', proc: ['aglomerado', 'melamina'], m: 'Melamina blanca RH 15 mm', uso: '8 laterales 770 × 580; 4 pisos 770 × 580; 8 amarres 770 × 100; 4 entrepaños 770 × 560; 2 subtapas 1600 × 600', cant: '9.62 m²', pu: '$226.756 por lámina', costo: 563606 },
        { key: 'melPlomo', proc: ['aglomerado', 'melamina'], m: 'Melamina Plomo RH 15 mm', uso: '8 puertas 764 × 396; 2 zócalos 1600 × 90; 2 tapas laterales 870 × 600', cant: '3.75 m²', pu: '$592.833 por lámina', costo: 858348 },
        { key: 'melRovere', proc: ['aglomerado', 'melamina'], m: 'Melamina Rovere RH 15 mm', uso: '2 tapas 1600 × 600', cant: '1.92 m²', pu: '$444.625 por lámina', costo: 254411 },
        { key: 'fondo', proc: ['aglomerado', 'melamina'], m: 'Fondo blanco 6 mm', uso: '4 fondos 760 × 790', cant: '2.40 m²', pu: '$212.534 por lámina', costo: 147764 },
        { key: 'canto', proc: ['canto'], m: 'Canto PVC 19 mm', uso: '12.3 m blanco, 21.5 m Plomo y 4.4 m Rovere', cant: '38.2 m', pu: '$167.200, $96.400 y $285.600 por rollo', costo: 107443 },
        { key: 'servicio', m: 'Corte y enchape en Madecentro', uso: 'Corte y pegado de canto', cant: '38.2 m de canto', pu: '$5.354 por lámina; $1.847 por metro', costo: 98408 },
        { key: 'servicio', m: 'Servicio de engruese tipo sánduche', uso: 'Une cada tapa Rovere con su subtapa blanca', cant: '2', pu: '$19.931', costo: 39862 },
        { key: 'herraje', m: 'Bisagras cierre lento', uso: 'Dos por puerta', cant: '8 pares', pu: '$3.137 por par', costo: 25096 },
        { key: 'patas', m: 'Patas niveladoras', uso: 'Cuatro por módulo', cant: '16', pu: '$2.042 por unidad', costo: 32672 },
        { key: 'herraje', m: 'Soportes de entrepaño', uso: 'Cuatro por entrepaño', cant: '16', pu: '$153 por unidad', costo: 2448 },
        { key: 'pasacable', m: 'Pasacables', uso: 'Uno detrás de cada impresora', cant: '4', pu: '$1.866 por unidad', costo: 7464 },
        { key: 'anclaje', m: 'Tornillería', uso: 'Tornillo de ensamble y autoperforante', cant: '2 cajas y 1 caja', pu: '$6.419 y $2.687 por caja', costo: 15525 }
      ],
      fab: [
        'Pedir el corte y el enchape de las piezas; las puertas llevan canto Plomo en los cuatro lados.',
        'Unir en sánduche cada tapa Rovere con su subtapa blanca: dos tramos de 1.60 m y 30 mm de espesor.',
        'Perforar las tapas para los cuatro pasacables, a 10 cm del borde trasero y en el eje de cada impresora.',
        'Fresar las cazoletas de 35 mm en las ocho puertas y perforar los laterales para los soportes.'
      ],
      ens: [
        'Armar cada módulo: dos laterales, piso y dos amarres superiores, con tornillos de ensamble.',
        'Escuadrar y atornillar el fondo de 6 mm.',
        'Montar cuatro patas por módulo.',
        'En el local: alinear los cuatro módulos a 0.60 m del muro izquierdo, nivelarlos y unirlos entre sí por los laterales.',
        'Atornillar las tapas laterales Plomo en los dos extremos y encajar los zócalos.',
        'Asentar los dos tramos de tapa, con la junta en el centro, entre la segunda y la tercera impresora, y atornillarlos desde abajo por los amarres.',
        'Colgar las puertas, colocar entrepaños y pasar los cables de cada impresora por su pasacable.'
      ],
      seq: [
        { t: 'Cada módulo: dos laterales, piso y dos amarres', src: 'Ensamble 1' },
        { t: 'Escuadrar y atornillar el fondo de 6 mm', src: 'Ensamble 2' },
        { t: 'Cuatro patas niveladoras por módulo', src: 'Ensamble 3' },
        { t: 'Alinear los cuatro módulos contra el muro y unirlos', src: 'Ensamble 4' },
        { t: 'Tapas laterales Plomo en los extremos y zócalos', src: 'Ensamble 5' },
        { t: 'Dos tramos de tapa de 30 mm, con la junta en el centro', src: 'Ensamble 6' },
        { t: 'Puertas Plomo, entrepaños y pasacables', src: 'Ensamble 7' }
      ],
      why: [
        { t: 'Módulos de 0.80 m', d: 'Coinciden con el eje de cada impresora, así cada equipo queda sobre un lateral doble y no en mitad de un vano.' },
        { t: 'Tapa de 30 mm', d: 'Cuatro impresoras de 12.95 kg mueven masas a alta velocidad; la tapa doble reparte la carga y vibra menos que una de 15 mm.' },
        { t: 'Blanco por dentro y Plomo solo en lo visible', d: 'El interior guarda filamento y repuestos, y no justifica el tablero más caro.' },
        { t: 'Rovere arriba', d: 'La tapa de trabajo es la superficie más visible del fondo del local.' }
      ]
    },
    /* ------------------------------------------------------------------ 8 */
    {
      n: 8, id: 'impresoras', name: 'Impresora 3D de escritorio', short: 'Impresoras 3D',
      origen: 'compra', grupo: 'Equipos',
      dims: '0.39 × 0.39 × 0.46 m', cant: '4',
      ubic: 'Sobre el mesón, con ejes cada 0.80 m',
      total: 16796000,
      resumen: 'Cuatro Bambu Lab P1S Combo AMS. Son más del 40 % del costo total del local.',
      mats: [
        { key: 'producto', m: 'Impresora 3D Bambu Lab P1S Combo AMS', uso: '389 × 389 × 458 mm; 12.95 kg', cant: '4', pu: '$4.199.000 por unidad', costo: 16796000, prov: 'makeR, distribuidor autorizado en Colombia', nota: 'IVA incluido; antes $5.199.000' }
      ],
      fab: [],
      ens: [
        'Colocar cada impresora sobre el mesón, con ejes cada 0.80 m. Mide 389 × 389 × 458 mm y pesa 12.95 kg, así que cabe en los 0.60 m de fondo.',
        'Pasar el cable por el pasacable y conectarla. La ficha declara 350 W a 110 V por equipo: las cuatro juntas piden un circuito propio.',
        'Ubicar la unidad AMS de cada equipo y cargar los carretes desde el panel perforado.'
      ],
      seq: [
        { t: 'Impresora sobre el mesón, en el eje de su módulo', src: 'Instalación 1' },
        { t: 'Unidad AMS con sus cuatro carretes', src: 'Instalación 3' }
      ],
      why: [
        { t: 'Por qué este modelo', d: 'Es cerrada, su huella cabe en el módulo de 0.45 m del plano y la vende un distribuidor autorizado en Colombia con IVA incluido.' }
      ]
    },
    /* ------------------------------------------------------------------ 9 */
    {
      n: 9, id: 'repisa', name: 'Repisa de filamentos', short: 'Repisa de filamentos',
      origen: 'fabrica', grupo: 'Mobiliario de trabajo',
      dims: '3.20 × 0.25 × 0.03 m', cant: '1',
      ubic: 'En el muro sobre el mesón, a 1.60 m del piso',
      total: 332825,
      resumen: 'Una repisa flotante de 30 mm, en dos tramos de doble capa, sobre ocho soportes invisibles.',
      mats: [
        { key: 'melRovere', proc: ['aglomerado', 'melamina'], m: 'Melamina Rovere RH 15 mm', uso: '4 piezas 1600 × 250 (dos tramos de dos capas)', cant: '1.60 m²', pu: '$444.625 por lámina', costo: 212009 },
        { key: 'canto', proc: ['canto'], m: 'Canto PVC Rovere 19 mm', uso: 'Frente y cabeceras', cant: '7.4 m', pu: '$285.600 por rollo', costo: 29268 },
        { key: 'servicio', m: 'Corte y enchape en Madecentro', uso: 'Corte y pegado de canto', cant: '7.4 m de canto', pu: '$5.354 por lámina; $1.847 por metro', costo: 16054 },
        { key: 'servicio', m: 'Servicio de engruese tipo sánduche', uso: 'Une las dos capas de cada tramo', cant: '2', pu: '$19.931', costo: 39862 },
        { key: 'soporte', m: 'Soporte invisible tubular 3/8" × 18 cm', uso: 'Uno cada 0.40 m', cant: '8', pu: '$3.104 por unidad', costo: 24832 },
        { key: 'anclaje', m: 'Chazos', uso: 'Anclaje de los soportes', cant: '2 paquetes de 4', pu: '$5.400 por paquete', costo: 10800 }
      ],
      fab: [
        'Unir las piezas en sánduche para obtener dos tramos de 1600 × 250 × 30 mm.',
        'Enchapar el frente y las cabeceras.',
        'Perforar el canto trasero con broca de 10 mm y 18 cm de profundidad, cuatro perforaciones por tramo, sobre la línea de pegue.'
      ],
      ens: [
        'Trazar en el muro una línea a nivel a 1.60 m del piso y marcar ocho puntos cada 0.40 m.',
        'Anclar los ocho soportes tubulares y comprobar que quedan perpendiculares al muro.',
        'Enfundar los dos tramos en los soportes hasta que toquen el muro.'
      ],
      seq: [
        { t: 'Ocho soportes tubulares anclados cada 0.40 m', src: 'Ensamble 2' },
        { t: 'Dos tramos en sánduche de 30 mm, enfundados en los soportes', src: 'Fabricación 1 · Ensamble 3' }
      ],
      why: [
        { t: 'Soporte invisible', d: 'La repisa se ve flotando, como en la imagen, sin escuadras que estorben los carretes.' },
        { t: 'Doble capa', d: 'El soporte de 3/8" necesita material alrededor de la perforación; en 15 mm no cabe.' }
      ]
    },
    /* ----------------------------------------------------------------- 10 */
    {
      n: 10, id: 'mueble-bajo', name: 'Mueble bajo con cajones', short: 'Mueble bajo con cajones',
      origen: 'fabrica', grupo: 'Mobiliario de trabajo',
      dims: '3.00 × 0.50 × 0.90 m', cant: '1',
      ubic: 'Muro derecho, a 2.00 m de la fachada',
      total: 2289912,
      resumen: 'Cinco módulos de 0.60 m con tres cajones cada uno. Es el mueble más caro del proyecto, por sus 15 cajones.',
      mats: [
        { key: 'melBlanca', proc: ['aglomerado', 'melamina'], m: 'Melamina blanca RH 15 mm', uso: '10 laterales 770 × 480; 5 pisos 570 × 480; 10 amarres 570 × 100; 30 costados de cajón 450 × 180; 30 frentes y traseros interiores 510 × 180; 4 tapas 1500 × 500', cant: '13.82 m²', pu: '$226.756 por lámina', costo: 809554 },
        { key: 'melRovere', proc: ['aglomerado', 'melamina'], m: 'Melamina Rovere RH 15 mm', uso: '15 frentes de cajón 596 × 252; 2 zócalos 1500 × 90; 2 tapas laterales 870 × 500', cant: '3.39 m²', pu: '$444.625 por lámina', costo: 449576 },
        { key: 'fondo', proc: ['aglomerado', 'melamina'], m: 'Fondo blanco 6 mm', uso: '5 fondos 760 × 590; 15 fondos de cajón 538 × 450', cant: '5.87 m²', pu: '$212.534 por lámina', costo: 361381 },
        { key: 'canto', proc: ['canto'], m: 'Canto PVC 19 mm', uso: '47.4 m blanco y 28.2 m Rovere', cant: '75.5 m', pu: '$167.200 y $285.600 por rollo', costo: 195687 },
        { key: 'servicio', m: 'Corte y enchape en Madecentro', uso: 'Corte y pegado de canto', cant: '75.5 m de canto', pu: '$5.354 por lámina; $1.847 por metro', costo: 173934 },
        { key: 'riel', m: 'Riel de extensión total 45 cm', uso: 'Un par por cajón', cant: '15 pares', pu: '$9.086 por par', costo: 136290 },
        { key: 'manija', proc: ['aluminio'], m: 'Perfil manija de aluminio', uso: 'Borde superior de cada frente', cant: '3 tramos de 3 m', pu: '$22.421 por tramo', costo: 67263 },
        { key: 'patas', m: 'Patas niveladoras', uso: 'Cuatro por módulo', cant: '20', pu: '$2.042 por unidad', costo: 40840 },
        { key: 'servicio', m: 'Servicio de engruese tipo sánduche', uso: 'Dos tramos de tapa de 30 mm', cant: '2', pu: '$19.931', costo: 39862 },
        { key: 'anclaje', m: 'Tornillería', uso: 'Tornillo de ensamble y autoperforante', cant: '2 cajas y 1 caja', pu: '$6.419 y $2.687 por caja', costo: 15525 }
      ],
      fab: [
        'Pedir el corte de las 89 piezas blancas, 19 Rovere y 20 de fondo, y el enchape de sus bordes vistos.',
        'Unir en sánduche las cuatro tapas blancas para formar dos tramos de 1500 × 500 × 30 mm.',
        'Armar las 15 cajas de cajón: dos costados, frente y trasero interiores, y el fondo de 6 mm atornillado por debajo.',
        'Cortar el perfil manija en 15 tramos de 596 mm y encajarlo en el borde superior de cada frente Rovere.',
        'Trazar en los laterales la posición de los tres rieles de cada módulo y atornillar la parte fija.'
      ],
      ens: [
        'Armar cada módulo: laterales, piso, amarres y fondo, escuadrando por diagonales.',
        'Montar las patas y, en el local, alinear los cinco módulos a 2.00 m de la fachada, nivelarlos y unirlos.',
        'Atornillar las tapas laterales Rovere en los dos extremos y encajar los zócalos.',
        'Asentar los dos tramos de tapa y atornillarlos desde abajo.',
        'Atornillar la parte móvil del riel a cada caja y deslizar los cajones.',
        'Fijar cada frente a su caja desde adentro, con cuatro tornillos, dejando 3 mm de luz entre frentes.'
      ],
      seq: [
        { t: 'Cada módulo: laterales, piso, amarres y fondo', src: 'Ensamble 1' },
        { t: 'Patas niveladoras; alinear y unir los cinco módulos', src: 'Ensamble 2' },
        { t: 'Tapas laterales Rovere y zócalos', src: 'Ensamble 3' },
        { t: 'Dos tramos de tapa blanca de 30 mm', src: 'Ensamble 4' },
        { t: 'Rieles de extensión total y las 15 cajas de cajón', src: 'Ensamble 5' },
        { t: 'Frentes Rovere con perfil manija, a 3 mm de luz', src: 'Ensamble 6' }
      ],
      why: [
        { t: 'Riel de extensión total', d: 'El cajón sale completo y se alcanza el fondo; soporta 38 kg, de sobra para repuestos y herramienta.' },
        { t: 'Perfil manija en vez de tiradores', d: 'No sobresale hacia el pasillo principal de 2.00 m y deja el frente limpio.' },
        { t: 'Cajas blancas y frentes Rovere', d: 'El tablero más barato va donde no se ve, y el tono madera solo en la cara.' },
        { t: 'Tapa blanca', d: 'Es la superficie de empaque y entrega; el blanco deja ver piezas pequeñas y tornillos.' }
      ]
    },
    /* ----------------------------------------------------------------- 11 */
    {
      n: 11, id: 'panel-perforado', name: 'Panel perforado de filamentos y accesorios', short: 'Panel perforado',
      origen: 'fabrica', grupo: 'Mobiliario de exhibición',
      dims: '2.20 × 0.04 × 1.22 m', cant: '1',
      ubic: 'En el muro derecho sobre el mueble bajo, a 2.75 m de la fachada',
      total: 577109,
      resumen: 'Lámina de acero perforada sobre un bastidor que la separa 15 mm del muro para que entren los ganchos.',
      mats: [
        { key: 'perforada', m: 'Lámina perforada de acero calibre 20', uso: 'Se recorta de 2.44 a 2.20 m de largo', cant: '1 lámina', pu: '$360.900 por lámina', costo: 360900 },
        { key: 'mdf15', proc: ['mdf'], m: 'MDF 15 mm', uso: 'Bastidor separador: 3 listones 2200 × 50 y 4 de 1100 × 50', cant: '0.55 m²', pu: '$134.900 por lámina', costo: 25609 },
        { key: 'ganchos', m: 'Ganchos para tablero perforado', uso: 'Para carretes y herramientas', cant: '2 juegos de 43 piezas', pu: '$89.900 por juego', costo: 179800 },
        { key: 'anclaje', m: 'Chazos', uso: 'Fijación del bastidor al muro', cant: '2 paquetes de 4', pu: '$5.400 por paquete', costo: 10800 }
      ],
      fab: [
        'Cortar la lámina a 2.20 m con disco de corte y retocar el borde con anticorrosivo negro.',
        'Cortar los siete listones de MDF y pintarlos de negro.'
      ],
      ens: [
        'Fijar al muro los tres listones horizontales con ocho chazos, a nivel, con el borde inferior a 1.00 m del piso.',
        'Atornillar los cuatro listones verticales entre ellos.',
        'Atornillar la lámina perforada al bastidor; los 15 mm de separación dejan entrar los ganchos.',
        'Colgar los ganchos y cargar los carretes.'
      ],
      seq: [
        { t: 'Tres listones horizontales al muro, con ocho chazos', src: 'Ensamble 1' },
        { t: 'Cuatro listones verticales entre ellos', src: 'Ensamble 2' },
        { t: 'Lámina perforada atornillada al bastidor', src: 'Ensamble 3' },
        { t: 'Ganchos y carretes', src: 'Ensamble 4' }
      ],
      why: [
        { t: 'Acero y no MDF perforado', d: 'Cada carrete pesa 1 kg y cuelga en voladizo de un gancho; la lámina de acero no se desgarra en los agujeros.' },
        { t: 'Color del panel', d: 'La lámina de Homecenter viene en negro gofrado con pintura electrostática. La imagen muestra un panel blanco: si se quiere igual, se pide en blanco a un taller de pintura electrostática. El modelo 3D lo muestra blanco, como la imagen.' }
      ]
    },
    /* ----------------------------------------------------------------- 12 */
    {
      n: 12, id: 'vitrina', name: 'Vitrina vertical mural', short: 'Vitrina mural',
      origen: 'fabrica', grupo: 'Mobiliario de exhibición',
      dims: '0.40 × 0.15 × 1.20 m', cant: '1',
      ubic: 'En el muro derecho, a 2.10 m de la fachada; base a 1.05 m del piso',
      total: 332174,
      resumen: 'Una caja colgada con frente y entrepaños de acrílico que entran por ranuras, sin un solo herraje a la vista.',
      mats: [
        { key: 'melBlanca', proc: ['aglomerado', 'melamina'], m: 'Melamina blanca RH 15 mm', uso: '2 laterales 1200 × 150; techo y piso 370 × 150', cant: '0.47 m²', pu: '$226.756 por lámina', costo: 27594 },
        { key: 'fondo', proc: ['aglomerado', 'melamina'], m: 'Fondo blanco 6 mm', uso: '1 fondo 1190 × 390', cant: '0.46 m²', pu: '$212.534 por lámina', costo: 28555 },
        { key: 'canto', proc: ['canto'], m: 'Canto PVC blanco 19 mm', uso: 'Frentes', cant: '3.1 m', pu: '$167.200 por rollo', costo: 5586 },
        { key: 'servicio', m: 'Corte y enchape en Madecentro', uso: 'Corte y pegado de canto', cant: '3.1 m de canto', pu: '$5.354 por lámina; $1.847 por metro', costo: 7194 },
        { key: 'acrilico', proc: ['acrilico'], m: 'Acrílico transparente 3 mm', uso: 'Frente 396 × 1196 y 3 entrepaños 368 × 140; usa 0.63 m² de los 2.2 m² de la lámina', cant: '1 lámina', pu: '$215.000 por lámina', costo: 215000 },
        { key: 'fuente', m: 'Fuente 12 V (variante 3 m)', uso: 'Sobre el techo de la vitrina', cant: '1', pu: '$42.845 por unidad', costo: 42845 },
        { key: 'led', proc: ['aluminio', 'led'], m: 'Perfil LED', uso: 'Retal de 1.20 m de la estantería 2', cant: '1 retal', pu: 'Ya pagado en la ficha 2', costo: 0 },
        { key: 'anclaje', m: 'Chazos', uso: 'Fijación al muro', cant: '1 paquete de 4', pu: '$5.400 por paquete', costo: 5400 }
      ],
      fab: [
        'Cortar y enchapar las cuatro piezas blancas.',
        'Ranurar laterales, techo y piso a 8 mm del frente con un canal de 4 mm para el frente de acrílico.',
        'Ranurar los laterales a tres alturas para los entrepaños de acrílico.',
        'Cortar el acrílico con disco de diente fino y pulir los cantos.'
      ],
      ens: [
        'Armar laterales, piso y fondo.',
        'Deslizar los tres entrepaños y el frente por sus ranuras y cerrar con el techo.',
        'Fijar el retal de perfil LED en vertical, dentro de un lateral.',
        'Colgar la vitrina con dos chazos, con la base a 1.05 m del piso, sobre el mueble bajo.'
      ],
      seq: [
        { t: 'Laterales, piso y fondo', src: 'Ensamble 1' },
        { t: 'Tres entrepaños de acrílico por sus ranuras', src: 'Ensamble 2' },
        { t: 'Frente de acrílico y cierre con el techo', src: 'Ensamble 2' },
        { t: 'Retal de perfil LED y fuente', src: 'Ensamble 3' },
        { t: 'Colgar con dos chazos, con la base a 1.05 m del piso', src: 'Ensamble 4' }
      ],
      why: [
        { t: 'Acrílico y no vidrio', d: 'Pesa cerca de la mitad, se corta en el taller y deja pasar hasta el 92 % de la luz.' },
        { t: 'Ranuras en vez de herrajes', d: 'La vitrina no lleva una sola bisagra ni soporte a la vista.' }
      ]
    },
    /* ----------------------------------------------------------------- 13 */
    {
      n: 13, id: 'estanteria-alta', name: 'Estantería exhibidora alta', short: 'Estantería alta',
      origen: 'fabrica', grupo: 'Mobiliario de exhibición',
      dims: '1.20 × 0.35 × 2.40 m', cant: '1',
      ubic: 'Muro derecho, a 0.30 m de la fachada',
      total: 1026272,
      resumen: 'Un módulo en Rovere con fondo blanco y luz vertical. Es el mueble que se ve desde el pasillo del centro comercial.',
      mats: [
        { key: 'melRovere', proc: ['aglomerado', 'melamina'], m: 'Melamina Rovere RH 15 mm', uso: '2 laterales 2400 × 350; techo y piso 1170 × 350; 5 entrepaños 1170 × 330; zócalo 1170 × 80', cant: '4.52 m²', pu: '$444.625 por lámina', costo: 599337 },
        { key: 'fondo', proc: ['aglomerado', 'melamina'], m: 'Fondo blanco 6 mm', uso: '1 fondo 2390 × 1190', cant: '2.84 m²', pu: '$212.534 por lámina', costo: 174990 },
        { key: 'canto', proc: ['canto'], m: 'Canto PVC Rovere 19 mm', uso: 'Frentes de laterales, techo, piso y entrepaños', cant: '13.7 m', pu: '$285.600 por rollo', costo: 54146 },
        { key: 'servicio', m: 'Corte y enchape en Madecentro', uso: 'Corte de láminas y pegado de canto', cant: '13.7 m de canto', pu: '$5.354 por lámina; $1.847 por metro', costo: 36274 },
        { key: 'led', proc: ['aluminio', 'led'], m: 'Perfil LED con cinta integrada', uso: 'Vertical, uno por lateral', cant: '2 tramos de 3 m', pu: '$44.910 por tramo', costo: 89820 },
        { key: 'fuente', m: 'Fuente 12 V (variante 5 m)', uso: 'Oculta sobre el techo del mueble', cant: '1', pu: '$48.659 por unidad', costo: 48659 },
        { key: 'herraje', m: 'Soportes de entrepaño', uso: 'Cuatro por entrepaño', cant: '20', pu: '$153 por unidad', costo: 3060 },
        { key: 'patas', m: 'Patas niveladoras', uso: 'Bajo el piso', cant: '4', pu: '$2.042 por unidad', costo: 8168 },
        { key: 'anclaje', m: 'Tornillería y anclaje', uso: 'Tornillo de ensamble y chazos', cant: '1 caja y 1 paquete', pu: '$6.419 y $5.400', costo: 11819 }
      ],
      fab: [
        'Pedir el corte con la veta del Rovere a lo largo de laterales y entrepaños.',
        'Enchapar los frentes con canto Rovere de 19 mm.',
        'Perforar las filas de soportes en toda la altura de los laterales.',
        'Cortar los dos perfiles LED a 2.30 m.'
      ],
      ens: [
        'Unir techo y piso a los laterales con tornillos de ensamble.',
        'Escuadrar por diagonales y atornillar el fondo.',
        'Montar patas y zócalo.',
        'Fijar los perfiles LED tras el frente de cada lateral y subir los cables a la fuente.',
        'En el local: nivelar, anclar al muro con dos chazos y colocar los entrepaños, atornillados al fondo por detrás.'
      ],
      seq: [
        { t: 'Techo y piso entre los dos laterales Rovere', src: 'Ensamble 1' },
        { t: 'Escuadrar por diagonales y atornillar el fondo blanco', src: 'Ensamble 2' },
        { t: 'Patas y zócalo', src: 'Ensamble 3' },
        { t: 'Perfiles LED y fuente sobre el techo', src: 'Ensamble 4' },
        { t: 'Anclar al muro y colocar los cinco entrepaños', src: 'Ensamble 5' }
      ],
      why: [
        { t: 'Rovere en todo el cuerpo', d: 'Es el mueble que se ve desde el pasillo del centro comercial, y el tono madera lo separa de la estantería blanca del muro opuesto.' },
        { t: 'Fondo blanco', d: 'Contrasta con las figuras oscuras y aprovecha los sobrantes de las láminas de fondo ya compradas.' }
      ]
    },
    /* ----------------------------------------------------------------- 14 */
    {
      n: 14, id: 'maceteros', name: 'Macetero con planta', short: 'Maceteros',
      origen: 'compra', grupo: 'Mobiliario comprado',
      dims: '0.40 × 0.40 × 0.75 m', cant: '3',
      ubic: 'Acceso izquierdo, muro derecho y esquina del fondo, todos dentro del local',
      total: 1019700,
      resumen: 'Tres materas color cemento, todas dentro del local: la fachada queda despejada para las pantallas de los pilares. Las plantas se compran aparte y no están en el presupuesto.',
      mats: [
        { key: 'producto', m: 'Matera plástica Urbi Beton color cemento, Tumatera', uso: '40 × 40 × 75 cm', cant: '3', pu: '$339.900 por unidad', costo: 1019700, prov: 'Homecenter', nota: 'No incluye la planta' }
      ],
      fab: [],
      ens: [
        'Uno en el acceso izquierdo, uno junto al mueble bajo y uno en la esquina del fondo.',
        'Las plantas se compran aparte.'
      ],
      seq: [],
      why: [
        { t: 'Producto de serie', d: 'Se compran hechos porque son productos de serie: no hay nada que diseñar ni fabricar.' }
      ]
    },
    /* ----------------------------------------------------------------- 15 */
    {
      n: 15, id: 'mampara', name: 'Mampara de vidrio con puerta', short: 'Mampara de vidrio',
      origen: 'fabrica', grupo: 'Mampara y fachada', origenNota: 'vidriería',
      dims: '2.10 × 0.10 × 2.40 m', cant: '1',
      ubic: 'Fondo derecho: vidrio fijo 1.05 + puerta 0.90 + columna 0.15',
      total: 1290900,
      resumen: 'Un vidrio fijo y una puerta batiente de vidrio templado de 10 mm separan la sala de ventas de la trastienda.',
      mats: [
        { key: 'vidrio', proc: ['vidrio'], m: 'Vidrio templado incoloro 10 mm', uso: 'Fijo 1050 × 2400 y puerta 900 × 2400', cant: '4.68 m²', pu: '$200.000 por m²', costo: 936000 },
        { key: 'kit', m: 'Kit sistema batiente para vidrio', uso: 'Bisagra, chapeta fija y manija en acero inoxidable', cant: '1 kit', pu: '$354.900 por kit', costo: 354900 }
      ],
      fab: [
        'Medir el vano ya terminado, con piso y cielo instalados, y restar las holguras que pida la vidriería.',
        'La vidriería corta el vidrio flotado, pule los cantos y hace las perforaciones de bisagras y manija.',
        'Después templa cada pieza: la recalienta a unos 700 °C y la enfría de golpe con aire.'
      ],
      ens: [
        'Fijar el canal perimetral en piso, columna y cielo para el vidrio fijo.',
        'Asentar el vidrio fijo sobre calzos, aplomarlo y sellarlo.',
        'Atornillar la bisagra del kit a la columna de 0.15 m y colgar la puerta, que abre hacia la trastienda.',
        'Montar la manija y regular hasta que la puerta cierre sin rozar el vidrio fijo.',
        'Pegar una franja visible a la altura de los ojos para que nadie choque con el vidrio.'
      ],
      seq: [
        { t: 'Canal perimetral en piso, columna y cielo', src: 'Ensamble 1' },
        { t: 'Vidrio fijo sobre calzos, aplomado y sellado', src: 'Ensamble 2' },
        { t: 'Bisagras en la columna y puerta colgada', src: 'Ensamble 3' },
        { t: 'Manija de acero inoxidable', src: 'Ensamble 4' },
        { t: 'Franja visible a la altura de los ojos', src: 'Ensamble 5' }
      ],
      why: [
        { t: 'Templado y no vidrio corriente', d: 'Si se rompe, lo hace en fragmentos pequeños de bordes romos. Vitrolit, en Bogotá, lo ofrece en 6, 8 y 10 mm y cita la definición de vidrio templado de la norma NSR-10.' },
        { t: '10 mm', d: 'Es el mayor de esos tres espesores, apropiado para una hoja de 2.40 m sin marco.' },
        { t: 'Marco negro', d: 'La imagen muestra un marco negro. El canal perimetral y su pintura no tienen precio publicado: se piden en la misma cotización de la vidriería.' }
      ]
    },
    /* ----------------------------------------------------------------- 16 */
    {
      n: 16, id: 'estanteria-bodega', name: 'Estantería de bodega', short: 'Estantería de bodega',
      origen: 'compra', grupo: 'Mobiliario comprado',
      dims: '1.80 × 0.40 × 1.80 m (dos de 0.90)', cant: '2',
      ubic: 'Trastienda, muro de fondo, a 3.20 m del muro izquierdo',
      total: 1039800,
      resumen: 'Dos estanterías metálicas de cinco niveles, juntas, para completar 1.80 m de bodega.',
      mats: [
        { key: 'producto', m: 'Estantería metálica de 5 niveles, CRUZ', uso: '180 × 90 × 40 cm; 100 kg por nivel', cant: '2', pu: '$519.900 por unidad', costo: 1039800, prov: 'Homecenter', nota: 'En oferta hasta el 28 de octubre de 2026 (normal $699.900)' }
      ],
      fab: [],
      ens: [
        'Se arman según su instructivo, nivel por nivel.',
        'Se ponen dos juntas contra el muro de fondo de la trastienda para completar 1.80 m. Su ficha declara 100 kg por nivel.'
      ],
      seq: [
        { t: 'Parales de las dos estanterías', src: 'Instalación 1' },
        { t: 'Cinco niveles, uno por uno', src: 'Instalación 1' }
      ],
      why: [
        { t: 'Producto de serie', d: 'Se compran hechas porque son productos de serie: no hay nada que diseñar ni fabricar.' },
        { t: 'Altura', d: 'La estantería mide 1.80 m de alto, 20 cm menos que la dibujada en el plano.' }
      ]
    },
    /* ----------------------------------------------------------------- 17 */
    {
      n: 17, id: 'escritorio', name: 'Escritorio de diseño', short: 'Escritorio de diseño',
      origen: 'fabrica', grupo: 'Mobiliario de trabajo',
      dims: '1.20 × 0.60 × 0.75 m', cant: '1',
      ubic: 'Trastienda, muro de fondo, a 0.20 m del muro izquierdo',
      total: 127976,
      resumen: 'El mueble menos visible del local: tubo de 1", tapa blanca y la pintura que sobra de la mesa alta. Cuesta menos que un solo taburete.',
      mats: [
        { key: 'acero', proc: ['tubo'], m: 'Tubo cuadrado de acero 1" calibre 18', uso: '4 patas de 0.735 m; 2 largueros de 1.10 m; 2 travesaños de 0.46 m (6.06 m)', cant: '2 barras de 6 m', pu: '$34.900 por barra', costo: 69800 },
        { key: 'melBlanca', proc: ['aglomerado', 'melamina'], m: 'Melamina blanca RH 15 mm', uso: 'Tapa 1200 × 600', cant: '0.72 m²', pu: '$226.756 por lámina', costo: 42183 },
        { key: 'canto', proc: ['canto'], m: 'Canto PVC blanco 19 mm', uso: 'Perímetro de la tapa', cant: '3.6 m', pu: '$167.200 por rollo', costo: 6404 },
        { key: 'servicio', m: 'Corte y enchape en Madecentro', uso: 'Corte y pegado de canto', cant: '3.6 m de canto', pu: '$5.354 por lámina; $1.847 por metro', costo: 7723 },
        { key: 'pasacable', m: 'Pasacable', uso: 'Esquina trasera de la tapa', cant: '1', pu: '$1.866 por unidad', costo: 1866 }
      ],
      fab: [
        'Soldar un marco superior de 1.10 × 0.46 m y las cuatro patas en sus esquinas.',
        'Pulir, desengrasar y pintar con el anticorrosivo negro que sobra de la mesa alta.',
        'Enchapar la tapa y perforar el pasacable.'
      ],
      ens: [
        'En la trastienda: ubicar la estructura a 0.20 m del muro izquierdo y atornillar la tapa desde abajo.'
      ],
      seq: [
        { t: 'Marco superior de 1.10 × 0.46 m en tubo de 1"', src: 'Fabricación 1' },
        { t: 'Cuatro patas soldadas en sus esquinas', src: 'Fabricación 1' },
        { t: 'Tapa blanca atornillada desde abajo, con su pasacable', src: 'Ensamble 1' }
      ],
      why: [
        { t: 'El mueble menos visible', d: 'Usa el tablero más barato, el tubo más delgado y la pintura sobrante.' }
      ]
    },
    /* ----------------------------------------------------------------- 18 */
    {
      n: 18, id: 'silla', name: 'Silla de trabajo', short: 'Silla de trabajo',
      origen: 'compra', grupo: 'Mobiliario comprado',
      dims: 'Ø 0.45 × 0.85 m', cant: '1',
      ubic: 'Trastienda, frente al escritorio',
      total: 159900,
      resumen: 'Silla ergonómica en malla y polipropileno para el puesto de diseño.',
      mats: [
        { key: 'producto', m: 'Silla ergonómica negra 3310, Or Design', uso: 'Malla y polipropileno; 60 × 45 × 95 cm', cant: '1', pu: '$159.900 por unidad', costo: 159900, prov: 'Homecenter', nota: 'En oferta hasta el 3 de diciembre de 2026 (normal $289.900)' }
      ],
      fab: [],
      ens: ['Se arma según su instructivo y va frente al escritorio.'],
      seq: [],
      why: [
        { t: 'Producto de serie', d: 'Se compra hecha porque es un producto de serie: no hay nada que diseñar ni fabricar.' }
      ]
    },
    /* ----------------------------------------------------------------- 19 */
    {
      n: 19, id: 'pantalla-pilar-izq', name: 'Pantalla exterior «Entra y crea» (pilar izquierdo)', short: 'Pantalla 55" pilar izquierdo',
      origen: 'compra', grupo: 'Fachada y pantallas',
      dims: '0.69 × 1.21 m de frente (55" en vertical)', cant: '1',
      ubic: 'Cara exterior del pilar izquierdo de la fachada; base a 0.90 m del piso',
      total: 1790800,
      resumen: 'Televisor de 55" en vertical sobre el pilar izquierdo, hacia el pasillo del centro comercial. Reproduce en bucle el mismo video que la pantalla del pilar derecho: invita a entrar a BlackForge y a conocer la impresión 3D.',
      mats: [
        { key: 'producto', m: 'Televisor Hisense 55" QLED 4K 55Q6QV', uso: '121.1 × 69.3 × 7.2 cm', cant: '1', pu: '$1.699.900 por unidad', costo: 1699900, prov: 'Homecenter', nota: 'En oferta (normal $2.469.900); precio confirmado el 10 de octubre de 2026' },
        { key: 'soporte', m: 'Soporte fijo de TV de 32" a 75", Power', uso: 'Carga máxima 70 kg; se fija girado 90°', cant: '1', pu: '$90.900 por unidad', costo: 90900, prov: 'Homecenter', nota: 'Sin stock en línea' }
      ],
      fab: [],
      ens: [
        'Fijar el soporte girado 90°, para colgar el televisor en vertical, con la base de la pantalla a 0.90 m del piso.',
        'Dejar una toma eléctrica detrás de la pantalla antes de colgarla.',
        'Colgar el televisor en la cara exterior del pilar izquierdo, centrado en el ancho del pilar.',
        'Cargar el video vertical «Entra y crea» en una memoria USB y dejarlo en reproducción continua; las dos pantallas llevan el mismo archivo.'
      ],
      seq: [
        { t: 'Fijar el soporte girado 90°', src: 'Instalación 1' },
        { t: 'Colgar el televisor en vertical', src: 'Instalación 3' }
      ],
      why: [
        { t: 'Una pantalla en cada pilar', d: 'Quien camina por el pasillo ve el video llegue por donde llegue, y las dos pantallas iguales enmarcan la entrada como un portal.' },
        { t: 'Medida comercial', d: 'El de 55" ocupa 0.69 × 1.21 m en vertical: es el más grande que cabe en el pilar de 0.75 m, con 3 cm libres a cada lado.' },
        { t: 'Mismo modelo que la de 75"', d: 'Es la misma línea Hisense QLED de la pantalla interior: los colores del video se ven iguales afuera y adentro.' },
        { t: 'Antes de comprar', d: 'Conviene confirmar con el fabricante que el modelo admite montaje vertical y encendido continuo durante el horario del centro comercial.' }
      ]
    },
    /* ----------------------------------------------------------------- 20 */
    {
      n: 20, id: 'pantalla-pilar-der', name: 'Pantalla exterior «Entra y crea» (pilar derecho)', short: 'Pantalla 55" pilar derecho',
      origen: 'compra', grupo: 'Fachada y pantallas',
      dims: '0.69 × 1.21 m de frente (55" en vertical)', cant: '1',
      ubic: 'Cara exterior del pilar derecho de la fachada; base a 0.90 m del piso',
      total: 1790800,
      resumen: 'Televisor de 55" en vertical sobre el pilar derecho, hacia el pasillo del centro comercial. Reproduce en bucle el mismo video que la pantalla del pilar izquierdo: invita a entrar a BlackForge y a conocer la impresión 3D.',
      mats: [
        { key: 'producto', m: 'Televisor Hisense 55" QLED 4K 55Q6QV', uso: '121.1 × 69.3 × 7.2 cm', cant: '1', pu: '$1.699.900 por unidad', costo: 1699900, prov: 'Homecenter', nota: 'En oferta (normal $2.469.900); precio confirmado el 10 de octubre de 2026' },
        { key: 'soporte', m: 'Soporte fijo de TV de 32" a 75", Power', uso: 'Carga máxima 70 kg; se fija girado 90°', cant: '1', pu: '$90.900 por unidad', costo: 90900, prov: 'Homecenter', nota: 'Sin stock en línea' }
      ],
      fab: [],
      ens: [
        'Fijar el soporte girado 90°, para colgar el televisor en vertical, con la base de la pantalla a 0.90 m del piso.',
        'Dejar una toma eléctrica detrás de la pantalla antes de colgarla.',
        'Colgar el televisor en la cara exterior del pilar derecho, centrado en el ancho del pilar.',
        'Cargar el video vertical «Entra y crea» en una memoria USB y dejarlo en reproducción continua; las dos pantallas llevan el mismo archivo.'
      ],
      seq: [
        { t: 'Fijar el soporte girado 90°', src: 'Instalación 1' },
        { t: 'Colgar el televisor en vertical', src: 'Instalación 3' }
      ],
      why: [
        { t: 'Una pantalla en cada pilar', d: 'Quien camina por el pasillo ve el video llegue por donde llegue, y las dos pantallas iguales enmarcan la entrada como un portal.' },
        { t: 'Medida comercial', d: 'El de 55" ocupa 0.69 × 1.21 m en vertical: es el más grande que cabe en el pilar de 0.75 m, con 3 cm libres a cada lado.' },
        { t: 'Mismo modelo que la de 75"', d: 'Es la misma línea Hisense QLED de la pantalla interior: los colores del video se ven iguales afuera y adentro.' },
        { t: 'Antes de comprar', d: 'Conviene confirmar con el fabricante que el modelo admite montaje vertical y encendido continuo durante el horario del centro comercial.' }
      ]
    }
  ];

  /* ---------------------------------------------------------------------
     Cómo se fabrica cada material (procesos industriales, con su fuente)
     ------------------------------------------------------------------- */
  const procesos = [
    {
      id: 'aglomerado', mat: 'Tablero aglomerado (de partículas)', uso: 'Cuerpos, entrepaños, cajones, tapas',
      proceso: 'La madera se astilla en una chipeadora de disco, se seca y se criba. Las partículas se rocían con resina y cera, y se forma un colchón de tres capas: partículas finas en las caras y gruesas en el centro. Se preprensa en frío y luego se prensa en caliente para curar la resina. Al final se enfría, se escuadra y se lija.',
      dato: 'Prensado en caliente entre 2 y 3 MPa y entre 140 y 220 °C',
      fuentes: [{ t: 'Wikipedia: Particle board', u: 'https://en.wikipedia.org/wiki/Particle_board' }]
    },
    {
      id: 'melamina', mat: 'Recubrimiento de melamina', uso: 'Caras de los tableros blanco, Rovere y Plomo',
      proceso: 'Un papel decorativo se satura con resina de melamina-formaldehído y se lamina con calor y presión sobre el aglomerado. La resina es termoestable: endurece en la prensa y no vuelve a ablandarse.',
      dato: 'Madecentro describe sus tableros como termofundidos con la lámina decorativa, resistentes a la humedad ambiental pero no al agua',
      fuentes: [{ t: 'Wikipedia: Melamine resin', u: 'https://en.wikipedia.org/wiki/Melamine_resin' }, { t: 'Ficha de Madecentro', u: 'https://madecentro.com/products/tablero-aglomerado-melamina-blanco-rh-primavera-1-83-2-44-cm' }]
    },
    {
      id: 'mdf', mat: 'MDF (tablero de fibra de densidad media)', uso: 'Estructura y curvas de las islas',
      proceso: 'Troncos de pino descortezados se reducen a astillas, se lavan y se ablandan con calor de 30 a 120 segundos. Un desfibrador las convierte en fibra, a la que se inyectan cera y resina de urea-formaldehído. La fibra se seca, se extiende en un colchón de 230 a 610 mm y se prensa por etapas, lo que deja caras más densas que el núcleo.',
      dato: 'Composición típica: 82 % fibra, 9 % resina, 8 % agua, 1 % parafina. Densidad de 600 a 800 kg/m³',
      fuentes: [{ t: 'Wikipedia: Medium-density fibreboard', u: 'https://en.wikipedia.org/wiki/Medium-density_fibreboard' }, { t: 'Wikipedia: Tablero de fibra de densidad media', u: 'https://es.wikipedia.org/wiki/Tablero_de_fibra_de_densidad_media' }]
    },
    {
      id: 'canto', mat: 'Canto de PVC', uso: 'Bordes de todas las piezas de melamina',
      proceso: 'Una extrusora funde el PVC con pigmentos y lo empuja por un dado que le da el ancho y el espesor. La cinta se texturiza, se imprime y se laca; por el reverso recibe una imprimación que mejora el agarre del adhesivo. En el taller se pega con adhesivo termofusible en una enchapadora, que también refila y pule.',
      dato: 'Espesores de 0.46 a 5 mm. El PVC de canto reblandece cerca de 67 °C (Vicat)',
      fuentes: [{ t: 'Wikipedia: Edge banding', u: 'https://en.wikipedia.org/wiki/Edge_banding' }, { t: 'Rehau: ficha técnica Raukantex PVC', u: 'https://www.rehau.com/downloads/327058/raukantex-pvc.pdf' }]
    },
    {
      id: 'tubo', mat: 'Tubo cuadrado de acero', uso: 'Estructura de la mesa alta y del escritorio',
      proceso: 'Una lámina de acero se forma en frío hasta cerrarla en tubo. Una corriente eléctrica calienta los dos bordes y unos rodillos los presionan hasta soldarlos, sin material de aporte. El mismo proceso produce tubo redondo o rectangular.',
      dato: 'La soldadura por resistencia de alta frecuencia reemplazó a la de baja frecuencia desde 1970 por dar mejor costura',
      fuentes: [{ t: 'Wikipedia: Electric resistance welding', u: 'https://en.wikipedia.org/wiki/Electric_resistance_welding' }]
    },
    {
      id: 'vidrio', mat: 'Vidrio flotado y templado', uso: 'Mampara y puerta del fondo',
      proceso: 'Sílice, álcalis y cal se funden en un horno continuo. El vidrio fundido flota sobre un baño de estaño, donde se aplana solo, y después se recuece. Para templarlo, la pieza ya cortada y con los cantos pulidos se recalienta y se enfría de golpe con aire: las caras quedan a compresión y el núcleo a tracción.',
      dato: 'Fusión a unos 1.500 °C; templado a unos 700 °C. El templado cuadruplica la resistencia y hace que rompa en fragmentos pequeños de bordes romos',
      fuentes: [{ t: 'Wikipedia: Vidrio flotado', u: 'https://es.wikipedia.org/wiki/Vidrio_flotado' }, { t: 'Interempresas: El vidrio templado', u: 'https://www.interempresas.net/Vidrio-plano/230541-El-vidrio-templado.html' }]
    },
    {
      id: 'aluminio', mat: 'Aluminio extruido y anodizado', uso: 'Perfiles LED y perfil manija',
      proceso: 'Un tocho de aluminio caliente se empuja con una prensa hidráulica a través de un troquel con la forma del perfil. Para anodizarlo, el perfil hace de ánodo en un baño de ácido sulfúrico; la corriente hace crecer una capa porosa de óxido que luego se sella.',
      dato: 'Extrusión en caliente entre 350 y 500 °C. Capa anódica de 5 a 7 µm para interiores',
      fuentes: [{ t: 'Wikipedia: Extrusión', u: 'https://es.wikipedia.org/wiki/Extrusi%C3%B3n' }, { t: 'Wikipedia: Anodizado', u: 'https://es.wikipedia.org/wiki/Anodizado' }]
    },
    {
      id: 'acrilico', mat: 'Acrílico (PMMA)', uso: 'Frente y entrepaños de la vitrina',
      proceso: 'El metacrilato de metilo se polimeriza. En la lámina colada, el monómero con iniciadores se vierte en un molde y allí polimeriza y toma forma a la vez. En la extruida, gránulos ya polimerizados se funden y pasan por un dado y rodillos pulidos.',
      dato: 'Transmite hasta el 92 % de la luz visible con 3 mm de espesor. Densidad de 1.17 a 1.20 g/cm³, cerca de la mitad del vidrio',
      fuentes: [{ t: 'Wikipedia: Poly(methyl methacrylate)', u: 'https://en.wikipedia.org/wiki/Poly%28methyl_methacrylate%29' }]
    },
    {
      id: 'led', mat: 'Cinta LED', uso: 'Retroiluminación de estanterías e islas',
      proceso: 'Sobre un circuito impreso flexible se montan LED de montaje superficial y resistencias en serie, en grupos conectados en paralelo. El reverso lleva adhesivo de doble cara.',
      dato: 'Trabaja a 12 o 24 V de corriente continua, con una fuente aparte',
      fuentes: [{ t: 'Wikipedia: LED strip light', u: 'https://en.wikipedia.org/wiki/LED_strip_light' }]
    }
  ];

  /* ---------------------------------------------------------------------
     Catálogo de materiales y precios (publicados el 9 de octubre de 2026)
     ------------------------------------------------------------------- */
  const MC = 'https://madecentro.com/products/';
  const HC = 'https://www.homecenter.com.co/homecenter-co/product/';
  const catalogo = [
    {
      grupo: 'Tableros', filas: [
        { m: 'Aglomerado melamina blanco RH 15 mm, Primadera', pres: 'Lámina 1.83 × 2.44 m', precio: '$226.756 por lámina', prov: 'Madecentro', nota: 'Antes $236.204', u: MC + 'tablero-aglomerado-melamina-blanco-rh-primavera-1-83-2-44-cm' },
        { m: 'Aglomerado melamina Rovere RH 15 mm, Pelikano', pres: 'Lámina 2.15 × 2.44 m', precio: '$444.625 por lámina', prov: 'Madecentro', nota: 'En oferta (antes $592.833); 18 mm a $515.065', u: MC + 'tablero-aglomerado-melamina-rovere-rh-pelikano' },
        { m: 'Aglomerado melamina Plomo RH 15 mm, Pelikano', pres: 'Lámina 2.15 × 2.44 m', precio: '$592.833 por lámina', prov: 'Madecentro', nota: 'Antes $617.534', u: MC + 'tablero-aglomerado-melamina-plomo-rh-pelikano' },
        { m: 'Fondo aglomerado melamina blanco nevado RH 6 mm, Pelikano', pres: 'Lámina 2.15 × 2.44 m', precio: '$212.534 por lámina', prov: 'Madecentro', nota: 'Melamina en una cara; antes $340.599', u: MC + 'fondo-aglomerado-melamina-blanco-nevado-rh-pelikano' },
        { m: 'MDF 15 mm, Trupan', pres: 'Lámina 1.83 × 2.44 m', precio: '$134.900 por lámina ($30.213 por m²)', prov: 'Homecenter', nota: '46.8 kg por lámina', u: HC + '884212/tablero-mdf-15mm-183x244m-trupan/884232/' },
        { m: 'MDF 5.5 mm, Trupan', pres: 'Lámina 1.83 × 2.44 m', precio: '$63.900 por lámina ($14.549 por m²)', prov: 'Homecenter', nota: '21.1 kg por lámina', u: HC + '884212/tablero-mdf-55mm-183x244m-trupan/884236/' }
      ]
    },
    {
      grupo: 'Cantos y servicios de taller', filas: [
        { m: 'Canto PVC flexible blanco 19 mm', pres: 'Rollo de 200 m', precio: '$167.200 por rollo', prov: 'Madecentro', nota: '$836 por metro', u: MC + 'canto-flexible-blanco-por-rollo-200' },
        { m: 'Canto PVC flexible Rovere 19 mm', pres: 'Rollo de 200 m', precio: '$285.600 por rollo', prov: 'Madecentro', nota: '$1.428 por metro', u: MC + 'canto-flexible-rovere-por-rollo-200' },
        { m: 'Canto PVC flexible Plomo 19 mm', pres: 'Rollo de 100 m', precio: '$96.400 por rollo', prov: 'Madecentro', nota: '$964 por metro', u: MC + 'canto-flexible-plomo-por-rollo-100' },
        { m: 'Servicio de corte de melamina, 16 a 25 piezas por lámina', pres: 'Por lámina', precio: '$5.354', prov: 'Madecentro', nota: 'De 36 a 50 piezas: $13.443', u: MC + 'servicio-corte-melamina-16-25-piezas-por-lamina' },
        { m: 'Servicio de enchape de canto flexible 0.5 mm', pres: 'Tarifa publicada', precio: '$1.847', prov: 'Madecentro', nota: 'La página no dice la unidad; aquí se toma por metro lineal', u: MC + 'servicio-de-enchape-de-cantos-flexible-0-5-mm' },
        { m: 'Servicio de engruese tipo sánduche', pres: 'Tarifa publicada', precio: '$19.931', prov: 'Madecentro', nota: 'Une dos piezas iguales con pegante; aquí se toma por pieza', u: MC + 'servicio-de-engruese-completo-tipo-sanduche' }
      ]
    },
    {
      grupo: 'Herrajes e iluminación', filas: [
        { m: 'Bisagra de cazoleta cierre lento, Bonuit', pres: 'Par con 12 tornillos', precio: '$3.137 por par', prov: 'Madecentro', nota: 'Tipo parche', u: MC + 'bisagra-de-cazoleta-para-mueble-cierre-lento' },
        { m: 'Riel de extensión total 45 cm, carga media 38 kg', pres: 'Par con 12 tornillos', precio: '$9.086 por par', prov: 'Madecentro', nota: 'De 25 a 55 cm: $5.917 a $12.560', u: MC + 'riel-extension-total-carga-media-250-mm-38-kg-acero' },
        { m: 'Perfil manija de aluminio para tablero de 15 mm', pres: 'Tramo de 3 m', precio: '$22.421 por tramo', prov: 'Madecentro', nota: 'Acabado natural mate', u: MC + 'peralm09l-perfil-manija-alu-x-3m-tab-15mm-liviano' },
        { m: 'Soporte de entrepaño plástico con eje metálico', pres: 'Unidad', precio: '$153', prov: 'Madecentro', nota: '4 por entrepaño', u: 'https://madecentro.com/collections/accesorios-para-herrajes/products/soportes-vidrio-019' },
        { m: 'Soporte invisible tubular 3/8" × 18 cm', pres: 'Unidad', precio: '$3.104', prov: 'Madecentro', nota: 'Acero zincado', u: MC + 'soporte-invisible-tubular-de-3-8-x-18-cm' },
        { m: 'Pata niveladora para zócalo 100 mm', pres: 'Unidad', precio: '$2.042', prov: 'Madecentro', nota: '', u: MC + 'pata-plastica-para-zocalo-peralm46-y-2249' },
        { m: 'Pasacable rectangular PVC negro', pres: 'Unidad', precio: '$1.866', prov: 'Madecentro', nota: '', u: 'https://madecentro.com/collections/accesorios-para-herrajes/products/varios-pasa-cable-733' },
        { m: 'Tornillo de ensamble 6 × 2" zincado', pres: 'Caja de 100', precio: '$6.419 por caja', prov: 'Madecentro', nota: '', u: MC + 'tornillo-de-ensamble-6-x-2-zincado-caja-x-100' },
        { m: 'Tornillo autoperforante para aglomerado 6 × 5/8"', pres: 'Caja de 100', precio: '$2.687 por caja', prov: 'Madecentro', nota: 'Para herrajes', u: 'https://madecentro.com/collections/herrajes-y-ferreteria/products/tornillo-autoperforante-para-aglomerado-6-x-5-8-zincado-caja-x-100' },
        { m: 'Chazo expansivo 3/8" × 1-7/8", Fixser', pres: 'Paquete de 4', precio: '$5.400 por paquete', prov: 'Homecenter', nota: '$1.350 por unidad', u: HC + '76332/chazo-expansivo-3-8x1-7-8pg-4und-fixser/76332/' },
        { m: 'Perfil de aluminio con cinta LED integrada, Bonuit', pres: 'Tramo de 3 m, 12 V', precio: '$44.910 por tramo', prov: 'Madecentro', nota: '132 LED por metro, luz cálida 3000 K, con difusor; se puede cortar', u: MC + 'perfil-en-aluminio-con-iluminacion-led-multicorte-empotrable-o-de-sobre-poner-negro-anodizado' },
        { m: 'Fuente de poder 12 V dimerizable, Bonuit', pres: 'Unidad', precio: '$42.845 (3 m), $48.659 (5 m), $67.250 (8 m), $99.077 (12 m)', prov: 'Madecentro', nota: 'La variante se elige por metros de LED', u: MC + 'fuente-de-poder-cinco-metros-dimerizable' },
        { m: 'Tira LED COB 12 V luz cálida, Dairu', pres: 'Rollo de 5 m', precio: '$69.900 por rollo', prov: 'Homecenter', nota: 'En oferta (normal $89.900)', u: HC + '902920/tira-led-cob-12v-5m-luz-calida-dairu/902920/' }
      ]
    },
    {
      grupo: 'Metal, vidrio, plásticos y acabados', filas: [
        { m: 'Tubo cuadrado de acero 1-1/2" calibre 18', pres: 'Barra de 6 m', precio: '$39.900 por barra ($6.650 por metro)', prov: 'Homecenter', nota: 'Pared de 1.1 mm', u: HC + '183862/tubo-cuadrado-1-1-2-x-1-1-2pg-x-11mm-c18-x-6m/183862/' },
        { m: 'Tubo cuadrado de acero 1" calibre 18', pres: 'Barra de 6 m', precio: '$34.900 por barra ($5.817 por metro)', prov: 'Homecenter', nota: 'Pared de 1.2 mm', u: HC + '24436/tubo-cuadrado-1-x-1pg-x-12mm-c18-x-6m/24436/' },
        { m: 'Pintura anticorrosiva negro mate, Algreco', pres: 'Galón (3.78 L)', precio: '$117.900 por galón', prov: 'Homecenter', nota: 'Rinde 20 m² por capa', u: HC + '210351/pintura-anticorrosivo-mate-de-alta-proteccion-1-galon-negro/210351/' },
        { m: 'Laca catalizada blanca semimate, Renania', pres: 'Galón', precio: '$80.900 por galón', prov: 'Homecenter', nota: 'Rinde 20 m² por capa; sin stock en línea el día de la consulta', u: HC + '293241/laca-catalizada-blanca-semi-mate-1-galon/293241/' },
        { m: 'Pegante Carpincol para madera', pres: 'Envase de 1 kg', precio: '$32.900 por kg', prov: 'Homecenter', nota: '', u: HC + '203374/pegante-carpincol-para-madera-1-kilo/203374/' },
        { m: 'Vidrio templado incoloro 10 mm', pres: 'Por metro cuadrado', precio: '$200.000 por m²', prov: 'El Ruso Shop, Bogotá', nota: 'Antes $240.000; a medida', u: 'https://www.elrusoshop.com/producto/vidrio-templado-10mm-incoloro/' },
        { m: 'Kit sistema batiente para puerta de vidrio', pres: 'Kit: bisagra, chapeta y manija', precio: '$354.900 por kit', prov: 'Homecenter', nota: 'Acero inoxidable', u: HC + '558773/kit-sistema-batiente-bisagra-plana-sencilla-vidrio-pared/558773/' },
        { m: 'Lámina de acrílico transparente 3 mm', pres: 'Lámina 1.80 × 1.22 m', precio: '$215.000 por lámina', prov: 'Asia Colombia', nota: 'La ficha técnica de la página dice 5 mm: confirmar el espesor al comprar', u: 'https://www.asiacolombia.com.co/producto/lamina-de-acrilico-transparente-3mm/' },
        { m: 'Lámina perforada de acero calibre 20, Induya', pres: 'Lámina 4 × 8 pies (1.22 × 2.44 m)', precio: '$360.900 por lámina', prov: 'Homecenter', nota: 'Negro gofrado, perforación de 6 mm cada pulgada; sin stock en línea', u: HC + '3022072/lamina-perforada-4x8-cal-20-tablero-herramientero/3022072/' },
        { m: 'Ganchos para tablero perforado, Crawford', pres: 'Juego de 43 piezas', precio: '$89.900 por juego', prov: 'Homecenter', nota: 'Sin stock en línea', u: HC + '590124/ganchos-para-tablero-perforado-de-43-piezas-crawford/590124/' },
      ]
    },
    {
      grupo: 'Muebles y equipos que se compran hechos', filas: [
        { m: 'Impresora 3D Bambu Lab P1S Combo AMS', pres: '389 × 389 × 458 mm, 12.95 kg', precio: '$4.199.000 por unidad', prov: 'makeR, distribuidor autorizado en Colombia', nota: 'IVA incluido; antes $5.199.000', u: 'https://somosmaker.com/producto/bambu-lab-p1s-combo-ams/' },
        { m: 'Televisor Hisense 75" QLED 4K 75Q6QV', pres: '166.9 × 95.2 × 7.9 cm', precio: '$2.899.900 por unidad', prov: 'Homecenter', nota: 'En oferta (normal $4.579.900); sin stock en línea', u: HC + '3029093/televisor-hisense-75-pulgadas-qled-uhd-4k-smart-tv-75q6qv/3029093/' },
        { m: 'Televisor Hisense 55" QLED 4K 55Q6QV', pres: '121.1 × 69.3 × 7.2 cm', precio: '$1.699.900 por unidad', prov: 'Homecenter', nota: 'En oferta (normal $2.469.900); precio confirmado el 10 de octubre de 2026', u: HC + '3029106/televisor-hisense-55-pulgadas-qled-uhd-4k-smart-tv-55q6qv/3029106/' },
        { m: 'Soporte fijo de TV de 32" a 75", Power', pres: 'Carga máxima 70 kg', precio: '$90.900 por unidad', prov: 'Homecenter', nota: 'Sin stock en línea', u: HC + '573029/soporte-fijo-de-tv-soporte-pantallas-32-a-75/573029/' },
        { m: 'Silla para bar Palermo negra', pres: 'Asiento a 78 cm; 48 × 52 × 108 cm', precio: '$249.900 por unidad', prov: 'Madecentro', nota: 'Polipropileno; antes $299.900', u: MC + 'silla-para-bar-palermo-negro-con-reposa-pies-doble-proposito' },
        { m: 'Matera plástica Urbi Beton color cemento, Tumatera', pres: '40 × 40 × 75 cm', precio: '$339.900 por unidad', prov: 'Homecenter', nota: 'No incluye la planta', u: HC + '500578/matera-plastica-rectangular-urbi-beton-40x75x40cm-cemento/500578/' },
        { m: 'Estantería metálica de 5 niveles, CRUZ', pres: '180 × 90 × 40 cm', precio: '$519.900 por unidad', prov: 'Homecenter', nota: 'En oferta hasta el 28 de octubre de 2026 (normal $699.900)', u: HC + '500845/estanteria-metalica-5-niveles-180x90x40-cm-gris-400-kg/500845/' },
        { m: 'Silla ergonómica negra 3310, Or Design', pres: '60 × 45 × 95 cm', precio: '$159.900 por unidad', prov: 'Homecenter', nota: 'En oferta hasta el 3 de diciembre de 2026 (normal $289.900)', u: HC + '510301/silla-tipo-ergonomica-negra-3310-para-oficina-y-escritorio-956045cm/510301/' }
      ]
    }
  ];

  /* ---------------------------------------------------------------------
     Presupuesto consolidado
     ------------------------------------------------------------------- */
  const presupuesto = {
    total: 38788078,
    fabricado: 12200678,
    comprado: 26587400,
    impresoras: 16796000,
    rubros: [
      { r: 'Impresoras 3D', q: '4 Bambu Lab P1S Combo AMS', c: 16796000 },
      { r: 'Tableros', q: '27 láminas de melamina, fondo y MDF', c: 7250665 },
      { r: 'Pantallas', q: 'Un televisor de 75" adentro y dos de 55" en los pilares, con sus soportes', c: 6572400 },
      { r: 'Mobiliario comprado', q: 'Taburetes, maceteros, estanterías de bodega y silla', c: 3219000 },
      { r: 'Metal, vidrio, plásticos y acabados', q: 'Tubo, vidrio templado y kit, acrílico, lámina perforada, ganchos, laca, anticorrosivo, pegante', c: 2614500 },
      { r: 'Herrajes e iluminación', q: 'Bisagras, rieles, patas, soportes, tornillería, chazos, perfiles y tiras LED, fuentes', c: 1171190 },
      { r: 'Servicios de Madecentro', q: 'Corte de 21 láminas, 196 m de enchape y 7 engrueses', c: 615123 },
      { r: 'Cantos', q: 'Tres rollos de PVC de 19 mm', c: 549200 }
    ],
    tiendas: [
      { r: 'makeR', q: 'Las cuatro impresoras', c: 16796000 },
      { r: 'Homecenter', q: 'Pantallas, MDF, tubo, pinturas, pegante, tira LED, chazos, kit de vidrio, panel perforado, maceteros, estanterías y silla', c: 11171300 },
      { r: 'Madecentro', q: 'Melaminas, fondos, cantos, servicios, herrajes, perfiles LED y taburetes', c: 9669778 },
      { r: 'El Ruso Shop', q: 'Vidrio templado', c: 936000 },
      { r: 'Asia Colombia', q: 'Acrílico', c: 215000 }
    ],
    corte: [
      { t: 'Melamina blanca RH 15 mm', f: '1.83 × 2.44', piezas: 138, area: '34.83', laminas: 9, ap: 87, c: 2040804 },
      { t: 'Melamina Rovere RH 15 mm', f: '2.15 × 2.44', piezas: 39, area: '16.78', laminas: 5, ap: 64, c: 2223125 },
      { t: 'Melamina Plomo RH 15 mm', f: '2.15 × 2.44', piezas: 18, area: '5.18', laminas: 2, ap: 49, c: 1185666 },
      { t: 'Fondo blanco 6 mm', f: '2.15 × 2.44', piezas: 28, area: '17.27', laminas: 5, ap: 66, c: 1062670 },
      { t: 'MDF 15 mm', f: '1.83 × 2.44', piezas: 37, area: '14.49', laminas: 5, ap: 65, c: 674500 },
      { t: 'MDF 5.5 mm', f: '1.83 × 2.44', piezas: 10, area: '3.14', laminas: 1, ap: 70, c: 63900 }
    ],
    corteNota: 'Se compran 27 láminas. El conteo sale de acomodar las 270 piezas del despiece en cada formato, con 4 mm de sierra y 10 mm de saneo por borde. El Rovere y el fondo rinden poco porque las piezas de 2.40 m de las estanterías ocupan casi todo el largo de la lámina. El Plomo rinde menos: sus piezas no caben en una sola lámina, así que se compran dos y el sobrante queda para reposiciones.',
    supuestos: [
      'Los precios son los publicados en línea el 9 de octubre de 2026; varios están en oferta y cinco productos figuraban sin stock ese día. El precio del televisor de 55" ($1.699.900) se confirmó el 10 de octubre de 2026.',
      'Las medidas vienen del plano, que se estimó desde la imagen: hay que verificarlas en sitio antes de pedir el corte.',
      'El total no incluye mano de obra, transporte, instalación eléctrica, plantas ni el canal perimetral de la mampara.',
      'Los precios y los procesos industriales tienen su fuente enlazada. El despiece, las cantidades y los métodos de fabricación y ensamble son diseño propio del documento del proyecto.'
    ],
    pendientes: [
      'Verificar en sitio las medidas del local y de cada muro; las del plano son estimadas desde la imagen.',
      'Definir las tomas eléctricas: una de piso bajo la isla principal, una detrás de cada pantalla, cuatro en el mesón con circuito propio y una por cada fuente LED.',
      'Confirmar existencias de los cinco productos que figuraban sin stock en línea: laca, lámina perforada, ganchos, el televisor de 75" y el soporte (se necesitan tres).',
      'Pedir a Madecentro la unidad exacta de cobro del enchape y del engruese, que la página no indica.',
      'Cotizar con la vidriería el canal perimetral negro y la instalación de la mampara.'
    ]
  };

  /* ---------------------------------------------------------------------
     Orden de fabricación y montaje del local
     ------------------------------------------------------------------- */
  const montaje = {
    intro: 'El montaje va del fondo hacia la fachada y deja las islas para el final, porque una vez puestas ocupan el centro y estorban el paso de los módulos largos.',
    nota: 'La vidriería es el frente que más condiciona: no puede medir hasta que piso y cielo estén terminados, y el vidrio templado no admite ajustes en obra.',
    frentes: [
      { t: 'Carpintería', d: ['Corte y enchape', 'Módulos de melamina', 'Islas en MDF y laca'] },
      { t: 'Metalmecánica', d: ['Mesa alta soldada', 'Escritorio soldado', 'Pintura negra mate'] },
      { t: 'Vidriería', d: ['Medir vano terminado', 'Corte y perforaciones', 'Templado'] },
      { t: 'Compras', d: ['Impresoras y tres pantallas', 'Taburetes y maceteros', 'Estanterías y silla'] }
    ],
    /* items: números del plano que entran en cada paso */
    pasos: [
      { t: 'Fondo y trastienda', d: 'Mesón, repisa, mampara, estanterías y escritorio', items: [7, 9, 15, 16, 17, 18] },
      { t: 'Muro derecho', d: 'Mueble bajo, panel perforado, vitrina y estantería alta', items: [10, 11, 12, 13] },
      { t: 'Muro izquierdo', d: 'Estantería retroiluminada y pantalla de 75 pulgadas', items: [2, 1] },
      { t: 'Centro', d: 'Mesa alta, isla principal e isla secundaria', items: [5, 3, 4] },
      { t: 'Fachada', d: 'Pantallas de 55 pulgadas en los dos pilares, con el video de bienvenida', items: [19, 20] },
      { t: 'Puesta en marcha', d: 'Impresoras, LED, taburetes y maceteros', items: [8, 6, 14], led: true }
    ]
  };

  L.data = {
    meta: {
      marca: 'IMPRESIÓN 3D',
      lema: ['Diseña', 'Imprime', 'Crea'],
      local: 'Local de exhibición y taller',
      medidas: '6.00 × 7.00 m',
      fecha: '9 de octubre de 2026',
      autor: '@BlackForge'
    },
    items, procesos, catalogo, presupuesto, montaje
  };
})();
