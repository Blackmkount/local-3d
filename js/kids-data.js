/* ============================================================================
   CONTENIDO PARA NIÑOS — textos en palabras sencillas para quien tiene 10 años.
   Solo datos: no toca la página ni el 3D. Se carga justo después de data.js
   y lo leen el glosario, las fichas en modo explorador, el pasaporte, la
   historia «¿Cómo nace una pieza?», el tamaño del niño y el montaje narrado.

   Reglas de escritura (las comprueban las pruebas de datos):
     · se le habla al lector de tú, con frases cortas y comparaciones de la vida
       diaria; ningún campo pasa de 25 palabras;
     · nada de unidades ni marcas sin explicar: «metros», «kilos», «grados»
       se escriben con todas sus letras;
     · los datos salen de js/data.js; si allá cambia una cifra, se cambia aquí.
   ========================================================================== */

/**
 * @typedef {Object} Quiz
 * @property {string}   q        pregunta
 * @property {string[]} options  tres respuestas posibles (también se leen como quiz.a)
 * @property {number}   ok       posición de la respuesta correcta (0, 1 o 2)
 * @property {string}   hint     pista que se muestra después de una respuesta equivocada
 *
 * @typedef {Object} KidItem     bloque «¿Qué es? · ¿Para qué sirve? · ¿Sabías que…?» del elemento n
 * @property {string}  que
 * @property {string}  para
 * @property {string}  sabias
 * @property {Quiz}    [quiz]
 * @property {number}  [colgado] va colgado en la pared: altura de su borde de abajo sobre el piso (m)
 *
 * @typedef {Object} Termino     palabra del glosario
 * @property {string}   id     clave única (#glosario/<id>)
 * @property {string}   t      la palabra como se muestra
 * @property {string[]} alias  formas exactas que se buscan en el texto (singular, plural…)
 * @property {string}   d      definición de una línea
 * @property {number}   [ver]  número del elemento que la muestra en 3D
 * @property {boolean}  [cs]   distingue mayúsculas (siglas y nombres de color: MDF, Plomo…)
 *
 * @typedef {Object} PasoHistoria  tarjeta de la historia, atada al video de 36 s
 * @property {number} t0     segundo del video en que empieza
 * @property {number} t1     segundo en que termina
 * @property {string} ic     dibujito de la tarjeta
 * @property {string} title
 * @property {string} text
 *
 * @typedef {Object} Unidad      cosa conocida para traducir precios
 * @property {string} t      nombre en plural («balones de fútbol»)
 * @property {string} uno    nombre en singular
 * @property {string} ic     dibujito
 * @property {number} p      precio de referencia en pesos colombianos
 * @property {string} fuente de dónde sale el precio
 *
 * window.L3D.kids = { items, glosario, procesos, montajeFrases, historia,
 *                     unidades, unidadesNota, alturaNino, comparaAltura }
 */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});

  /* ---------------------------------------------------------------------
     Los 20 elementos del plano (la clave es el número n de data.js)
     ------------------------------------------------------------------- */
  const items = {
    1: {
      que: 'Un televisor gigante puesto de pie que muestra cómo se fabrica una pieza en 3D.',
      para: 'Para que, apenas entres, veas en 36 segundos cómo nace una pieza: del dibujo a la impresora.',
      sabias: 'Su video no se grabó con cámara: un programa dibujó sus 1080 cuadros, uno por uno, como un libro animado.',
      colgado: 0.40,
      quiz: {
        q: '¿Qué muestra el video de la pantalla gigante?',
        options: ['Cómo nace una pieza impresa en 3D', 'Dibujos animados', 'El clima de hoy'],
        ok: 0,
        hint: 'El video empieza con el título «Así nace una pieza».'
      }
    },
    2: {
      que: 'El mueble blanco con luces donde se exhiben las figuras, como la vitrina de un museo.',
      para: 'Para mostrar las figuras impresas bien iluminadas, y guardar cosas abajo, detrás de sus puertas grises.',
      sabias: 'Es tan ancha como alta: 2,40 metros por cada lado. Y es blanca a propósito, para que la luz rebote hacia las figuras.',
      quiz: {
        q: '¿Por qué la estantería es blanca?',
        options: ['Porque el blanco pesa menos', 'Para que la luz rebote hacia las figuras', 'Para que no se vea el polvo'],
        ok: 1,
        hint: 'Piensa en qué pasa con la luz cuando toca una pared blanca.'
      }
    },
    3: {
      que: 'La mesa grande del centro donde se muestran las figuras, con luz por debajo para que parezca flotar.',
      para: 'Para que veas las piezas de cerca, y desde todos los lados, apenas entras a la tienda.',
      sabias: 'Sus esquinas curvas son dos tablas delgadas dobladas y pegadas: una sola tabla gruesa se partiría al doblarla.',
      quiz: {
        q: '¿Cómo se hacen las esquinas redondas de la isla?',
        options: ['Con dos tablas delgadas dobladas y pegadas', 'Con una tabla gruesa calentada', 'Se imprimen en 3D'],
        ok: 0,
        hint: 'Una tabla gruesa no se deja doblar sin romperse…'
      }
    },
    4: {
      que: 'Una isla más pequeña y más bajita, pegada detrás de la grande, como un escalón.',
      para: 'Para mostrar más piezas a otra altura: juntas, las dos islas parecen una sola mesa con escalón.',
      sabias: 'Es más baja que la isla grande justo lo que mide una regla pequeña del colegio: 15 centímetros.',
      quiz: {
        q: '¿Cuánto más baja es esta isla que la grande?',
        options: ['Lo que mide una regla pequeña', 'Un metro entero', 'Nada: son igual de altas'],
        ok: 0,
        hint: 'Mira las dos islas juntas: forman un escalón pequeñito.'
      }
    },
    5: {
      que: 'Una mesa alta con patas de metal negro, donde te atienden y hablan contigo sobre tu idea.',
      para: 'Para atenderte: aquí te sientas en un taburete, cuentas lo que imaginas y pides tu pieza.',
      sabias: 'Sus patas son tubos de acero soldados: aguantan los golpes de los taburetes mejor que la madera.',
      quiz: {
        q: '¿Por qué las patas de la mesa alta son de metal?',
        options: ['Aguantan golpes y dejan espacio para las piernas', 'El metal pesa menos que la madera', 'Para que suenen al tocarlas'],
        ok: 0,
        hint: 'Piensa en los taburetes chocando contra la mesa todo el día.'
      }
    },
    6: {
      que: 'Cuatro taburetes, unas sillas altas y negras, para sentarte junto a la mesa alta.',
      para: 'Para que te sientes a la altura de la mesa mientras cuentas tu idea y miras los diseños.',
      sabias: 'Se compran hechos: no vale la pena fabricar algo que ya venden listo.',
      quiz: {
        q: '¿Por qué los taburetes se compran y no se fabrican?',
        options: ['Porque ya los venden listos y bien hechos', 'Porque son muy difíciles de pintar', 'Porque se imprimen en 3D'],
        ok: 0,
        hint: '¿Vale la pena fabricar algo que ya venden en la tienda?'
      }
    },
    7: {
      que: 'La mesa larga y fuerte donde trabajan las impresoras; abajo guarda rollos de hilo y piezas de repuesto.',
      para: 'Para sostener las cuatro impresoras firmes, sin que tiemblen, y tener a mano todo lo que necesitan.',
      sabias: 'Cada impresora pesa casi 13 kilos y se sacude al trabajar; por eso la tapa es doble, para que no tiemble.',
      quiz: {
        q: '¿Por qué la tapa del mesón es doble de gruesa?',
        options: ['Para que no tiemble con las impresoras', 'Para que se vea más bonita', 'Porque así es más barata'],
        ok: 0,
        hint: 'Las impresoras se mueven muy rápido mientras trabajan.'
      }
    },
    8: {
      que: 'Una máquina que fabrica objetos de plástico de verdad: lee un dibujo del computador y lo construye capa por capa.',
      para: 'Para fabricar figuras, juguetes y regalos. Funciona como una pistola de silicona muy precisa que dibuja con plástico caliente.',
      sabias: '¡Las cuatro están imprimiendo ahora mismo: dos jarrones, un peón de ajedrez y un florero! Acércate y mira cómo crecen.',
      quiz: {
        q: '¿Cómo construye una pieza la impresora 3D?',
        options: ['Tallando un bloque de madera', 'Capa por capa, con hilo de plástico derretido', 'Llenando un molde con agua'],
        ok: 1,
        hint: 'Mira la pieza dentro de la impresora: crece de abajo hacia arriba.'
      }
    },
    9: {
      que: 'Una repisa larga sobre las impresoras, donde descansan los rollos de hilo de colores que ellas usan.',
      para: 'Para tener todos los colores a mano, justo encima de las impresoras, y cambiarlos rápido.',
      sabias: 'Parece flotar: la sostienen ocho varillas de metal escondidas dentro de la repisa, sin soportes a la vista.',
      colgado: 1.60,
      quiz: {
        q: '¿Qué sostiene la repisa, si no se ven soportes?',
        options: ['Pegante en la pared', 'Varillas de metal escondidas adentro', 'Imanes muy fuertes'],
        ok: 1,
        hint: 'Sus soportes se llaman «invisibles» porque quedan metidos dentro de la repisa.'
      }
    },
    10: {
      que: 'Un mueble largo con 15 cajones, donde se guardan herramientas, repuestos y cosas pequeñas.',
      para: 'Para guardar todo en orden y empacar tus piezas encima, sobre su tapa blanca, antes de entregártelas.',
      sabias: 'Cada cajón sale completo gracias a sus rieles y aguanta 38 kilos: ¡más de lo que pesa un niño de 10 años!',
      quiz: {
        q: '¿Cuántos cajones tiene el mueble bajo?',
        options: ['5', '15', '50'],
        ok: 1,
        hint: 'Son cinco partes iguales y cada una tiene tres cajones.'
      }
    },
    11: {
      que: 'Una lámina de metal llena de huequitos para colgar ganchos con herramientas.',
      para: 'Para que cada herramienta y cada rollo de hilo tenga su sitio, a la vista y fácil de alcanzar.',
      sabias: 'Es de acero y no de madera: cada rollo de hilo pesa un kilo, y la madera se rasgaría en los huequitos.',
      colgado: 1.00,
      quiz: {
        q: '¿Por qué el panel está un poco separado de la pared?',
        options: ['Para que entren los ganchos por detrás', 'Para esconder dulces', 'Para que suene como un tambor'],
        ok: 0,
        hint: 'Los ganchos se meten por los huequitos y necesitan espacio detrás.'
      }
    },
    12: {
      que: 'Una caja colgada en la pared, con frente transparente, para mostrar piezas pequeñas y especiales.',
      para: 'Para proteger del polvo y de las manos las piezas más delicadas, como en un museo.',
      sabias: 'Su frente parece vidrio, pero es un plástico llamado acrílico: pesa la mitad y entra por unas ranuras, sin tornillos a la vista.',
      colgado: 1.05,
      quiz: {
        q: '¿De qué es el frente transparente de la vitrina?',
        options: ['De vidrio', 'De acrílico, un plástico transparente', 'De hielo'],
        ok: 1,
        hint: 'Pesa la mitad que el vidrio y se puede cortar en el taller.'
      }
    },
    13: {
      que: 'Un mueble alto color madera, junto a la entrada, con repisas y luces para mostrar figuras.',
      para: 'Para que la gente que pasa por el pasillo del centro comercial vea las figuras y le den ganas de entrar.',
      sabias: 'Su color se llama Rovere, que en italiano quiere decir roble. ¡Ese dibujo de madera viene impreso en un papel duro pegado encima!',
      quiz: {
        q: '¿Qué quiere decir Rovere?',
        options: ['Roble, en italiano', 'Rojo, en francés', 'Rápido, en inglés'],
        ok: 0,
        hint: 'Es el nombre de un árbol de madera clara.'
      }
    },
    14: {
      que: 'Tres materas grandes color cemento, con plantas, para darle vida a la tienda.',
      para: 'Para decorar y poner algo verde y vivo entre tantas máquinas y muebles.',
      sabias: 'Parecen de cemento, pero son de plástico y pesan mucho menos. Las plantas se compran aparte: no están en el precio.',
      quiz: {
        q: '¿De qué están hechas las materas?',
        options: ['De cemento', 'De plástico color cemento', 'De vidrio'],
        ok: 1,
        hint: 'Parecen pesadas, pero no lo son.'
      }
    },
    15: {
      que: 'Una pared de vidrio con puerta que separa la tienda del cuarto de trabajo.',
      para: 'Para separar el cuarto de trabajo sin taparlo. Lleva una franja a la altura de los ojos para que nadie se choque.',
      sabias: 'Antes de ponerla, el vidrio se calienta a unos 700 grados y se enfría de golpe con aire: así queda cuatro veces más fuerte.',
      quiz: {
        q: '¿Por qué la puerta es de vidrio templado?',
        options: ['Porque es más barato', 'Porque, si se rompe, no deja pedazos con filo', 'Porque es de colores'],
        ok: 1,
        hint: 'Piensa en qué pasaría si alguien la golpea muy fuerte.'
      }
    },
    16: {
      que: 'Dos estantes de metal en el cuarto de atrás, donde se guarda lo que la tienda tiene de reserva.',
      para: 'Para guardar cajas, rollos de hilo y materiales, ordenados en cinco pisos.',
      sabias: 'Cada uno de sus cinco pisos aguanta 100 kilos: lo que pesan juntos unos tres niños de tu edad.',
      quiz: {
        q: '¿Dónde están las estanterías de bodega?',
        options: ['Junto a la entrada', 'En el cuarto de atrás', 'Afuera, en el pasillo'],
        ok: 1,
        hint: 'Busca detrás de la pared de vidrio.'
      }
    },
    17: {
      que: 'El escritorio donde se dibujan las piezas en el computador.',
      para: 'Para diseñar con calma, en el cuarto de atrás, las piezas que después fabrican las impresoras.',
      sabias: 'Es el mueble más barato de la tienda: cuesta menos que un solo taburete, y usa la pintura que sobró de la mesa alta.',
      quiz: {
        q: '¿Qué cuesta más: el escritorio completo o un solo taburete?',
        options: ['El escritorio', 'Un taburete', 'Cuestan lo mismo'],
        ok: 1,
        hint: 'El escritorio usa el tubo más delgado y la pintura que sobró.'
      }
    },
    18: {
      que: 'La silla cómoda de la persona que dibuja las piezas en el computador, en el cuarto de atrás.',
      para: 'Para trabajar muchas horas sin que duela la espalda: es ergonómica, o sea, hecha a la medida del cuerpo.',
      sabias: 'Su espaldar es de malla, una tela con huequitos que deja pasar el aire para que no sudes.',
      quiz: {
        q: '¿Para qué sirve la malla del espaldar?',
        options: ['Para dejar pasar el aire', 'Para atrapar mariposas', 'Para que pese más'],
        ok: 0,
        hint: 'Piensa en una tarde de calor, sentado mucho rato.'
      }
    },
    19: {
      que: 'Una de las dos pantallas de la entrada que invitan a la gente a pasar; esta va en el pilar izquierdo.',
      para: 'Para que quien camina por el centro comercial vea un video llamativo y le den ganas de entrar.',
      sabias: 'Las dos pantallas muestran el mismo video al mismo tiempo: un robot de juguete que se imprime capa por capa.',
      colgado: 0.90,
      quiz: {
        q: '¿Qué muestran las pantallas de la entrada?',
        options: ['Las noticias', 'Un video que invita a entrar', 'Partidos de fútbol'],
        ok: 1,
        hint: 'Su video termina diciendo «Entra y crea».'
      }
    },
    20: {
      que: 'Una de las dos pantallas de la entrada que invitan a la gente a pasar; esta va en el pilar derecho.',
      para: 'Para que quien camina por el centro comercial vea un video llamativo y le den ganas de entrar.',
      sabias: 'Es la pantalla más grande que cabe en el pilar: solo le sobran 3 centímetros a cada lado, el ancho de dos dedos.',
      colgado: 0.90,
      quiz: {
        q: '¿Por qué hay una pantalla en cada pilar?',
        options: ['Para que la veas llegues por donde llegues', 'Por si una se daña', 'Para jugar videojuegos'],
        ok: 0,
        hint: 'La gente camina por el pasillo en las dos direcciones.'
      }
    }
  };

  /* ---------------------------------------------------------------------
     Glosario «Palabras del taller»
     alias: formas exactas que se subrayan en el texto. Solo cuentan como
     palabra completa (sin letras ni números pegados), así «canto» no se
     marca dentro de «cantos» si «cantos» no está en la lista.
     cs: true para siglas y nombres de color, que solo se marcan con su
     mayúscula («Plomo» el color sí, «plomo» el metal no).
     Algunas palabras comunes solo se marcan en frases precisas: «fondo»
     (también es «al fondo del local»), «luz» (también es luz de lámpara),
     «fuente» (también es la fuente de un dato) y «láminas».
     ------------------------------------------------------------------- */
  const glosario = [
    /* ---- impresión 3D */
    { id: 'impresion-3d', t: 'Impresión 3D', alias: ['impresión 3d', 'impresión en 3d', 'imprimir en 3d', 'imprime en 3d', 'impresa en 3d', 'impresas en 3d', 'impreso en 3d', 'impresos en 3d'], d: 'Fabricar un objeto real poniendo plástico derretido capa por capa, como una torre de hilos finitos.', ver: 8 },
    { id: 'impresora-3d', t: 'Impresora 3D', alias: ['impresoras 3d', 'impresora 3d', 'impresoras', 'impresora'], d: 'La máquina que lee un dibujo del computador y lo convierte en algo que puedes tocar.', ver: 8 },
    { id: 'bambu', t: 'Bambu Lab P1S', cs: true, alias: ['Bambu Lab P1S', 'Bambu Lab', 'P1S'], d: 'La marca (Bambu Lab) y el modelo (P1S) de las cuatro impresoras del taller: cerradas y con puerta de vidrio.', ver: 8 },
    { id: 'filamento', t: 'Filamento', alias: ['filamentos', 'filamento'], d: 'El «hilo» de plástico enrollado en un carrete; es la tinta de la impresora 3D.', ver: 9 },
    { id: 'carrete', t: 'Carrete', alias: ['carretes', 'carrete'], d: 'La rueda donde viene enrollado el filamento, como un carrete de hilo de coser, pero gigante.', ver: 9 },
    { id: 'boquilla', t: 'Boquilla', alias: ['boquillas', 'boquilla'], d: 'La punta caliente por donde sale el plástico derretido, como la de una manga pastelera.', ver: 8 },
    { id: 'cama', t: 'Cama', alias: ['cama'], d: 'La plataforma plana, dentro de la impresora, donde la pieza va creciendo.', ver: 8 },
    { id: 'capa', t: 'Capa', alias: ['capas', 'capa'], d: 'Cada piso finito que queda encima de otro, como las hojas de un libro. Muchas capas apiladas forman la pieza.' },
    { id: 'modelado-3d', t: 'Modelado 3D', alias: ['modelado 3d', 'modelado en 3d', 'modelado', 'dibujo 3d', 'dibujo en 3d'], d: 'Dibujar un objeto en el computador para girarlo y verlo por todos lados antes de fabricarlo.' },
    { id: 'laminador', t: 'Laminador', alias: ['laminador', 'slicer'], d: 'Programa que corta el dibujo en cientos de rebanadas y le dice a la impresora por dónde moverse.' },
    { id: 'pla', t: 'PLA', cs: true, alias: ['PLA'], d: 'Plástico hecho de maíz o de caña de azúcar; es el más usado para imprimir en 3D.' },
    { id: 'petg', t: 'PETG', cs: true, alias: ['PETG'], d: 'Plástico más fuerte que el PLA, primo del plástico de muchas botellas de agua.' },
    { id: 'corexy', t: 'CoreXY', alias: ['corexy', 'core xy'], d: 'Forma de mover la boquilla con dos motores y correas que trabajan en equipo, para ir rápido sin temblar.' },
    { id: 'ams', t: 'AMS', cs: true, alias: ['AMS'], d: 'La caja encima de la impresora que guarda 4 rollos de colores y cambia de color sola.', ver: 8 },

    /* ---- tableros */
    { id: 'tablero', t: 'Tablero', alias: ['tableros', 'tablero'], d: 'Aquí no es el del salón de clase: es una plancha grande y plana, casi siempre de madera prensada, para hacer muebles.' },
    { id: 'laminas', t: 'Láminas', alias: ['láminas'], d: 'Planchas grandes de tablero, más altas que un adulto (2,44 metros), de las que se cortan las piezas.' },
    { id: 'melamina', t: 'Melamina', alias: ['melaminas', 'melamina'], d: 'Tablero cubierto con un papel duro que ya trae el color o el dibujo de madera; no hay que pintarlo.', ver: 2 },
    { id: 'aglomerado', t: 'Aglomerado', alias: ['aglomerados', 'aglomerado'], d: 'Tablero hecho de astillas y aserrín de madera pegados y aplastados, como una barra de granola de madera.' },
    { id: 'mdf', t: 'MDF', cs: true, alias: ['MDF'], d: 'Tablero de fibras de madera finitas, tan liso que se puede pintar y doblar en capas delgadas.', ver: 3 },
    { id: 'rh', t: 'RH', cs: true, alias: ['RH'], d: '«Resistente a la humedad»: aguanta el aire húmedo, pero no que le echen agua.' },
    { id: 'rovere', t: 'Rovere', cs: true, alias: ['Rovere'], d: 'El nombre de un color madera clara; en italiano quiere decir roble, un árbol.', ver: 13 },
    { id: 'plomo', t: 'Plomo', cs: true, alias: ['Plomo'], d: 'El nombre de un color gris oscuro de los tableros; no tiene plomo de verdad.', ver: 7 },
    { id: 'fondo', t: 'Fondo', alias: ['fondo aglomerado', 'fondo blanco', 'fondo de 6 mm', 'fondos'], d: 'La tapa delgada de atrás de un mueble; evita que se tuerza.', ver: 2 },
    { id: 'canto', t: 'Canto', alias: ['canto pvc', 'tapacanto', 'cantos', 'canto'], d: 'El borde de un tablero, y también la cinta de plástico que se pega encima para taparlo.', ver: 2 },
    { id: 'enchape', t: 'Enchapar', alias: ['enchapadora', 'enchapados', 'enchapado', 'enchapar', 'enchapan', 'enchape'], d: 'Pegar el canto en los bordes de las piezas, con una máquina que lo calienta y lo aprieta.' },
    { id: 'engruese', t: 'Engruese tipo sánduche', alias: ['engruese tipo sánduche', 'engrueses', 'engruese', 'sánduche'], d: 'Pegar dos tableros uno sobre otro para que quede el doble de grueso, como un sándwich.', ver: 9 },
    { id: 'despiece', t: 'Despiece', alias: ['despiece'], d: 'La lista de todas las piezas de un mueble, con sus medidas, como el manual de un LEGO.' },
    { id: 'plan-de-corte', t: 'Plan de corte', alias: ['plan de corte'], d: 'Cómo acomodar las piezas en cada lámina para que sobre poco, como los moldes de galletas sobre la masa.' },
    { id: 'aprovechamiento', t: 'Aprovechamiento', alias: ['aprovechamiento'], d: 'Qué parte de la lámina se usa de verdad. El resto sobra, como los bordes de la masa de galletas.' },
    { id: 'saneo', t: 'Saneo', alias: ['saneo'], d: 'El borde que se recorta de cada lámina, porque suele llegar golpeado o torcido.' },
    { id: 'retal', t: 'Retal', alias: ['retales', 'retal'], d: 'El pedazo que sobra después de cortar algo; se guarda para usarlo en otra parte.' },

    /* ---- partes de un mueble */
    { id: 'modulo', t: 'Módulo', alias: ['módulos', 'módulo'], d: 'Cada caja igual que forma un mueble grande; se arman por separado y luego se unen.' },
    { id: 'lateral', t: 'Lateral', alias: ['laterales', 'lateral'], d: 'Cada uno de los lados de un mueble, el de la derecha y el de la izquierda.' },
    { id: 'entrepano', t: 'Entrepaño', alias: ['entrepaños', 'entrepaño'], d: 'Cada repisa o «piso» de adentro de un mueble, donde se ponen las cosas.', ver: 13 },
    { id: 'zocalo', t: 'Zócalo', alias: ['zócalos', 'zócalo'], d: 'La tira de abajo del mueble, junto al piso, que tapa las patas y aguanta las patadas.' },
    { id: 'retranqueado', t: 'Retranqueado', alias: ['retranqueados', 'retranqueado', 'retranqueada'], d: 'Metido un poquito hacia adentro, para que no se vea o no estorbe.' },
    { id: 'bastidor', t: 'Bastidor', alias: ['bastidores', 'bastidor'], d: 'El marco o esqueleto que sostiene algo, como el marco de un cuadro.' },
    { id: 'costilla', t: 'Costilla', alias: ['costillas', 'costilla'], d: 'Pieza que hace de hueso por dentro de la isla, como las costillas de un barco.', ver: 3 },
    { id: 'amarre', t: 'Amarre', alias: ['amarres', 'amarre'], d: 'Tira de tablero que une por arriba los dos lados de un mueble para que no se abran.', ver: 7 },
    { id: 'larguero', t: 'Larguero y travesaño', alias: ['largueros', 'larguero', 'travesaños', 'travesaño'], d: 'Tubos o palos que unen las patas: los largueros van a lo largo y los travesaños, a lo ancho.', ver: 5 },
    { id: 'isla', t: 'Isla', alias: ['islas', 'isla'], d: 'Aquí no es tierra en el mar: es un mueble suelto en el centro, que se puede rodear por todos lados.', ver: 3 },
    { id: 'plantilla', t: 'Plantilla', alias: ['plantilla'], d: 'Un molde plano para trazar la misma forma muchas veces, como las que usas para dibujar figuras.' },

    /* ---- herrajes y tornillos */
    { id: 'herraje', t: 'Herraje', alias: ['herrajes', 'herraje'], d: 'Las piezas pequeñas de metal de un mueble: bisagras, rieles, tornillos y soportes.' },
    { id: 'cazoleta', t: 'Bisagra de cazoleta', alias: ['bisagras de cazoleta', 'bisagra de cazoleta', 'cazoletas', 'cazoleta', 'bisagras', 'bisagra'], d: 'La articulación escondida que deja abrir la puerta; la de cierre lento no la deja golpear.', ver: 2 },
    { id: 'riel', t: 'Riel de extensión total', alias: ['rieles de extensión total', 'riel de extensión total', 'rieles', 'riel'], d: 'Los carriles a los lados del cajón que lo dejan salir completo, hasta el fondo.', ver: 10 },
    { id: 'patas-niveladoras', t: 'Patas niveladoras', alias: ['patas niveladoras', 'pata niveladora'], d: 'Patas que se enroscan más o menos para que el mueble quede derecho y no cojee.', ver: 2 },
    { id: 'pasacable', t: 'Pasacable', alias: ['pasacables', 'pasacable'], d: 'Huequito con tapa en la mesa para pasar los cables sin enredos.', ver: 7 },
    { id: 'perfil', t: 'Perfil', alias: ['perfiles', 'perfil'], d: 'Barra larga de aluminio con una forma especial: unas guardan las luces y otras sirven de manija.', ver: 10 },
    { id: 'difusor', t: 'Difusor', alias: ['difusor'], d: 'La tapa de plástico lechoso que reparte la luz para que no se vean los puntitos.' },
    { id: 'chazo', t: 'Chazo', alias: ['chazos', 'chazo'], d: 'Taquito que se mete en un hueco de la pared y se abre por dentro, para que el tornillo agarre fuerte.' },
    { id: 'autoperforante', t: 'Tornillo autoperforante', alias: ['autoperforantes', 'autoperforante'], d: 'Tornillo con punta de broca: hace su propio hueco mientras entra.' },
    { id: 'zincado', t: 'Zincado', alias: ['zincados', 'zincado'], d: 'Cubierto con una capa delgada de zinc, un metal que lo protege del óxido.' },

    /* ---- en el taller */
    { id: 'escuadra', t: 'Escuadra', alias: ['escuadrando', 'escuadrado', 'escuadrar', 'escuadra'], d: 'Una esquina perfectamente recta, como la de una hoja. Escuadrar es revisar que el mueble quede así.' },
    { id: 'pretaladrar', t: 'Pretaladrar', alias: ['pretaladrando', 'pretaladrar'], d: 'Hacer primero un hueco pequeño donde irá el tornillo, para que el tablero no se raje.' },
    { id: 'fresar', t: 'Fresar', alias: ['fresado', 'fresar'], d: 'Hacer un hueco redondo y poco profundo con una broca especial, como el de las bisagras de las puertas.' },
    { id: 'ruteadora', t: 'Ruteadora', alias: ['ruteadora', 'rutear'], d: 'Máquina con una cuchilla que gira muy rápido y recorta la madera siguiendo una plantilla.' },
    { id: 'zuncho', t: 'Zuncho', alias: ['zunchos', 'zuncho'], d: 'Cinta que se aprieta alrededor de las piezas para sostenerlas mientras se seca el pegante.' },
    { id: 'masillar', t: 'Masillar', alias: ['masillar', 'masilla'], d: 'Tapar huecos y uniones con una pasta que, al secarse, se lija hasta quedar lisa.' },
    { id: 'mano', t: 'Mano de pintura', alias: ['tres manos', 'dos manos', 'entre manos'], d: 'Cada vez que se pinta encima de lo ya pintado: tres manos son tres capas de pintura.' },
    { id: 'galon', t: 'Galón', alias: ['galones', 'galón'], d: 'Medida para líquidos: casi 4 litros, como dos botellas grandes de gaseosa.' },
    { id: 'laca', t: 'Laca', alias: ['lacado', 'lacada', 'lacar', 'laca'], d: 'Pintura dura y lisa que protege, como el esmalte de uñas.', ver: 3 },
    { id: 'carpincol', t: 'Carpincol', cs: true, alias: ['Carpincol'], d: 'Pegante blanco para madera, parecido al colbón del colegio, pero más fuerte.' },
    { id: 'anticorrosivo', t: 'Anticorrosivo', alias: ['anticorrosiva', 'anticorrosivo'], d: 'Pintura que evita que el metal se oxide y se llene de manchas cafés.', ver: 5 },
    { id: 'soldar', t: 'Soldar', alias: ['soldadura', 'soldados', 'soldadas', 'soldado', 'soldada', 'soldar'], d: 'Unir dos metales derritiéndolos justo donde se tocan, para que queden como una sola pieza.', ver: 5 },
    { id: 'rebaba', t: 'Rebaba', alias: ['rebaba'], d: 'Los bordes ásperos que quedan al cortar metal; se limpian para que nadie se corte.' },
    { id: 'calibre', t: 'Calibre', alias: ['calibre'], d: 'Número que dice qué tan grueso es un metal. ¡Ojo: entre más alto el número, más delgado!' },
    { id: 'electrostatica', t: 'Pintura electrostática', alias: ['pintura electrostática', 'electrostática'], d: 'Pintura en polvo que se pega al metal con electricidad y luego se hornea; queda muy dura.' },
    { id: 'metalmecanica', t: 'Metalmecánica', alias: ['metalmecánica'], d: 'El taller donde se cortan, doblan y sueldan las piezas de metal.' },

    /* ---- vidrio y plásticos */
    { id: 'vidrio-templado', t: 'Vidrio templado', alias: ['vidrio templado', 'templarlo', 'templado', 'templar', 'templa'], d: 'Vidrio calentado y enfriado de golpe: queda 4 veces más fuerte y, si se rompe, se hace granitos sin filo.', ver: 15 },
    { id: 'vidrio-flotado', t: 'Vidrio flotado', alias: ['vidrio flotado'], d: 'Vidrio que se aplana solo, flotando sobre metal derretido, como el aceite sobre el agua.' },
    { id: 'mampara', t: 'Mampara', alias: ['mamparas', 'mampara'], d: 'Pared de vidrio que separa dos espacios sin quitarles la luz.', ver: 15 },
    { id: 'acrilico', t: 'Acrílico', alias: ['acrílico'], d: 'Plástico transparente que parece vidrio, pero pesa la mitad y se corta en el taller.', ver: 12 },
    { id: 'pvc', t: 'PVC', cs: true, alias: ['PVC'], d: 'Plástico duro y resistente; con él se hacen tubos de agua y los cantos de los muebles.' },
    { id: 'polipropileno', t: 'Polipropileno', alias: ['polipropileno'], d: 'Plástico liviano y fuerte, el mismo de muchas tapas de botella y sillas plásticas.', ver: 6 },
    { id: 'calzo', t: 'Calzo', alias: ['calzos', 'calzo'], d: 'Taquito que se pone debajo de una pieza para levantarla un poco y dejarla derecha.', ver: 15 },
    { id: 'aplomar', t: 'Aplomar', alias: ['aplomarlo', 'aplomado', 'aplomada', 'aplomar'], d: 'Dejar algo perfectamente vertical, bien parado, sin inclinarse hacia ningún lado.' },
    { id: 'holgura', t: 'Holgura', alias: ['holguras', 'holgura'], d: 'Espacio pequeñito que se deja de más para que una pieza entre sin apretarse.' },
    { id: 'nsr-10', t: 'NSR-10', cs: true, alias: ['NSR-10'], d: 'Las reglas de construcción de Colombia: dicen cómo construir para que todo sea seguro, incluso si tiembla.' },

    /* ---- luz y electricidad */
    { id: 'led', t: 'LED', alias: ['tira led cob', 'tiras led', 'tira led', 'cinta led', 'led', 'cob'], d: 'Lucecitas que gastan muy poca energía. En la tira COB van tan juntas que no se ven los puntitos.', ver: 2 },
    { id: 'retroiluminada', t: 'Retroiluminada', alias: ['retroiluminación', 'retroiluminada', 'retroiluminado'], d: 'Con luz por detrás: las luces van escondidas atrás y hacen brillar lo que está adelante.', ver: 2 },
    { id: 'luz-rasante', t: 'Luz rasante', alias: ['luz rasante'], d: 'Luz que sale muy pegada al piso y lo ilumina de lado, como el sol cuando se está ocultando.', ver: 3 },
    { id: 'dimerizable', t: 'Dimerizable', alias: ['dimerizable'], d: 'Que deja subir o bajar la fuerza de la luz, como la perilla de algunas lámparas.' },
    { id: 'fuente', t: 'Fuente de 12 V', alias: ['fuentes de 12 v', 'fuente de 12 v', 'fuente de poder', 'fuente 12 v', 'fuente led', 'la fuente'], d: 'Cajita que convierte la electricidad del enchufe en una más suave, de 12 voltios, para las luces LED.', ver: 2 },
    { id: 'voltio', t: 'Voltio', alias: ['voltios', '110 v', '24 v', '12 v'], d: 'Mide la fuerza con que empuja la electricidad: el enchufe de tu casa tiene 110 voltios y las luces LED, solo 12.' },
    { id: 'vatio', t: 'Vatio', alias: ['vatios', '350 w'], d: 'Mide cuánta energía gasta un aparato. Cada impresora gasta hasta 350, como unos 35 bombillos LED encendidos.' },
    { id: 'circuito', t: 'Circuito propio', alias: ['circuito propio'], d: 'Un camino de cables, desde la caja de la luz, solo para unos aparatos, para que no se sobrecargue.' },
    { id: 'toma', t: 'Toma eléctrica', alias: ['tomas eléctricas', 'toma eléctrica', 'toma de piso', 'tomas'], d: 'El enchufe de la pared o del piso donde se conectan los aparatos.' },
    { id: 'qled', t: 'QLED', cs: true, alias: ['QLED'], d: 'Tipo de pantalla con partículas diminutas que dan colores muy vivos.', ver: 1 },
    { id: '4k', t: '4K', cs: true, alias: ['4K'], d: 'Pantalla con unos 8 millones de puntitos de luz: por eso se ve tan nítida.', ver: 1 },
    { id: 'hisense', t: 'Hisense', cs: true, alias: ['Hisense'], d: 'La marca de los tres televisores de la tienda: uno grande adentro y dos en la entrada.', ver: 1 },

    /* ---- la tienda y sus medidas */
    { id: 'fachada', t: 'Fachada', alias: ['fachadas', 'fachada'], d: 'La cara de la tienda que da al pasillo, con el letrero y la entrada.', ver: 19 },
    { id: 'vano', t: 'Vano', alias: ['vanos', 'vano'], d: 'El hueco de una pared, como el de la entrada; también, el espacio libre entre dos apoyos.' },
    { id: 'dintel', t: 'Dintel', alias: ['dintel'], d: 'La parte de arriba de un hueco de puerta o ventana, que lo cierra por encima.' },
    { id: 'cielo', t: 'Cielo', alias: ['cielo raso', 'cielo'], d: 'En construcción, el techo del local visto desde adentro; no el cielo de afuera.' },
    { id: 'trastienda', t: 'Trastienda', alias: ['trastienda'], d: 'El cuarto de atrás que los clientes no ven, donde se trabaja y se guardan cosas.', ver: 17 },
    { id: 'plano', t: 'Plano', alias: ['vista de planta', 'planos', 'plano'], d: 'El dibujo de la tienda vista desde arriba, como la ve un pájaro, igual que un mapa.' },
    { id: 'luz', t: 'Luz (entre piezas)', alias: ['mm de luz', 'm de luz'], d: 'Aquí no es luz de lámpara: es el espacio libre entre dos piezas, o entre dos apoyos.' },
    { id: 'eje', t: 'Eje', alias: ['ejes', 'eje'], d: 'La línea imaginaria que pasa justo por el centro de algo, como el palito que atraviesa un trompo.' },
    { id: 'huella', t: 'Huella', alias: ['huella'], d: 'El espacio que algo ocupa sobre la mesa o el piso, como la marca que deja tu pie.', ver: 8 },
    { id: 'voladizo', t: 'Voladizo', alias: ['voladizo'], d: 'Algo sostenido solo de un lado, como un trampolín de piscina.', ver: 11 },
    { id: 'flectar', t: 'Flectar', alias: ['flectar', 'flecte', 'flecta'], d: 'Doblarse en el centro por el peso, como una regla apoyada solo en sus puntas.' },
    { id: 'separar-piezas', t: 'Separar piezas', alias: ['vista explosionada', 'separar piezas', 'explosionado', 'explosionada', 'explosionar'], d: 'Ver las piezas de un mueble separadas en el aire para entender cómo encajan, como un LEGO desarmado.' },
    { id: 'pulgada', t: 'Pulgada', alias: ['pulgadas', 'pulgada', '1-1/2"', '3/8"', '75"', '55"', '32"', '1"'], d: 'Medida de 2,54 centímetros, más o menos el ancho del pulgar de un adulto. Las pantallas se miden de esquina a esquina.', ver: 1 },
    { id: 'metro-cuadrado', t: 'Metro cuadrado', alias: ['metros cuadrados', 'metro cuadrado', 'm²'], d: 'Un cuadrado de 1 metro por cada lado. Sirve para medir superficies, como un piso o un tablero.' },
    { id: 'paral', t: 'Paral', alias: ['parales', 'paral'], d: 'Cada palo vertical de una estantería de metal, donde se encajan los pisos.', ver: 16 },
    { id: 'ergonomica', t: 'Ergonómica', alias: ['ergonómica', 'ergonómico'], d: 'Hecha a la medida del cuerpo, para que estés cómodo y no te duela la espalda.', ver: 18 },

    /* ---- cómo se fabrican los materiales (ventana Materiales, «Para expertos») */
    { id: 'resina', t: 'Resina', alias: ['resinas', 'resina'], d: 'Un pegante químico que se endurece y une las astillas o las fibras de madera de los tableros.' },
    { id: 'formaldehido', t: 'Formaldehído', alias: ['formaldehído'], d: 'Un químico que, mezclado con otros, forma la resina dura que pega los tableros.' },
    { id: 'termoestable', t: 'Termoestable', alias: ['termoestable'], d: 'Que se endurece con calor y ya no se vuelve a ablandar, como un huevo cocido.' },
    { id: 'chipeadora', t: 'Chipeadora', alias: ['chipeadora'], d: 'Máquina que pica la madera en astillas pequeñas.' },
    { id: 'cribar', t: 'Cribar', alias: ['cribar', 'criba'], d: 'Pasar por un colador gigante para separar las astillas finas de las gruesas.' },
    { id: 'desfibrador', t: 'Desfibrador', alias: ['desfibrador'], d: 'Máquina que deshace las astillas hasta dejarlas como pelusa de algodón.' },
    { id: 'colchon', t: 'Colchón (de tablero)', alias: ['colchón'], d: 'La capa gruesa y esponjosa de astillas o fibras que se forma antes de aplastarla en la prensa.' },
    { id: 'mpa', t: 'MPa', cs: true, alias: ['MPa'], d: 'Medida de qué tan fuerte se aprieta algo: 2 MPa es como poner 20 kilos sobre la uña de tu dedo.' },
    { id: 'densidad', t: 'Densidad', alias: ['densidad'], d: 'Qué tan pesado es algo para su tamaño: un cubo de hierro pesa más que uno de madera igual de grande.' },
    { id: 'compresion', t: 'Compresión y tracción', alias: ['compresión', 'tracción'], d: 'Compresión es estar apretado, como un resorte aplastado; tracción es estar estirado, como una liga halada.' },
    { id: 'vicat', t: 'Vicat', cs: true, alias: ['Vicat'], d: 'Prueba que mide a qué temperatura un plástico se empieza a ablandar.' },
    { id: 'extrusion', t: 'Extrusión', alias: ['extrusión', 'extrusora', 'extruida', 'extruido'], d: 'Empujar material blando por un hueco con forma, como la crema dental que sale del tubo.' },
    { id: 'troquel', t: 'Troquel', alias: ['troquel'], d: 'Pieza de metal con un hueco de forma: el material que se empuja por ahí sale con esa forma.' },
    { id: 'anodizado', t: 'Anodizado', alias: ['anodizarlo', 'anodizado', 'anodizar', 'anódica', 'ánodo'], d: 'Darle al aluminio una capa dura y protectora usando electricidad, dentro de un baño especial.' },
    { id: 'polimerizar', t: 'Polimerizar', alias: ['polimerizados', 'polimerizar', 'polimerizan', 'polimeriza'], d: 'Cuando pedacitos diminutos de un líquido se enganchan en cadenas larguísimas y se vuelven plástico duro, como cuentas en un collar.' },

    /* ---- tiendas y dinero */
    { id: 'homecenter', t: 'Homecenter', cs: true, alias: ['Homecenter'], d: 'Tienda grande de Colombia que vende materiales, herramientas y muebles; ahí se cotizó buena parte de lo comprado.' },
    { id: 'madecentro', t: 'Madecentro', cs: true, alias: ['Madecentro'], d: 'Tienda colombiana de tableros y herrajes que además corta las láminas y les pega el canto.' },
    { id: 'iva', t: 'IVA', cs: true, alias: ['IVA'], d: 'Impuesto que se suma al precio de lo que compras; ese dinero es para el Estado.' },
    { id: 'cop', t: 'COP', cs: true, alias: ['COP'], d: 'Pesos colombianos, el dinero de Colombia. Aquí «$» quiere decir pesos, no dólares.' }
  ];

  /* ---------------------------------------------------------------------
     Procesos de data.js (misma id) en una frase y una comparación.
     Se muestran como «simple — compara» antes del texto para expertos.
     ------------------------------------------------------------------- */
  const procesos = {
    aglomerado: { simple: 'Astillas y aserrín de madera pegados y aplastados con calor', compara: 'como una barra de granola de madera' },
    melamina: { simple: 'Un papel con color o dibujo de madera, empapado en una resina que se endurece con calor sobre el tablero', compara: 'como forrar un cuaderno, pero para siempre' },
    mdf: { simple: 'Fibras de madera finitas como algodón, prensadas hasta quedar lisas', compara: 'como un cartón gruesísimo y duro: el papel también se hace con fibras de madera' },
    canto: { simple: 'Plástico derretido que se empuja por un molde y sale como una cinta larga, que luego se pega en los bordes', compara: 'como la crema dental que sale del tubo con su forma' },
    tubo: { simple: 'Una lámina de acero que se dobla hasta cerrarla, y su unión se suelda calentándola con electricidad', compara: 'como enrollar una hoja de papel y pegar el borde' },
    vidrio: { simple: 'Arena derretida que se aplana flotando sobre metal líquido; para templarlo, se calienta otra vez y se enfría de golpe', compara: 'queda 4 veces más fuerte y, si se rompe, se hace granitos sin filo' },
    aluminio: { simple: 'Aluminio caliente y blando que se empuja por un molde con forma, y luego se protege con una capa dura', compara: 'como la plastilina cuando la empujas por un molde con forma de estrella' },
    acrilico: { simple: 'Un líquido que se vuelve plástico duro y transparente dentro de un molde', compara: 'como la gelatina que cuaja en su molde, pero transparente como el vidrio' },
    led: { simple: 'Lucecitas diminutas pegadas en una cinta delgada que se dobla, con pegante por detrás', compara: 'como una calcomanía larga que se ilumina' }
  };

  /* ---------------------------------------------------------------------
     Montaje narrado: una frase cuando cada mueble cae en su sitio
     ('montaje-land' { n }), una por paso ('montaje-step' { k }) y el cierre.
     {short} se cambia por el nombre corto del elemento en data.js.
     ------------------------------------------------------------------- */
  const montajeFrases = {
    1: 'Se cuelga la pantalla gigante',
    2: 'Se arma la estantería con luces',
    3: 'Llega la isla principal',
    4: 'La isla pequeña se pega a la grande',
    5: 'Llega la mesa alta',
    6: 'Llegan los taburetes',
    7: 'Se arma el mesón de las impresoras',
    8: '¡Llegan las impresoras!',
    9: 'Se cuelga la repisa de los hilos',
    10: 'Llega el mueble de los 15 cajones',
    11: 'Se cuelga el panel de huequitos',
    12: 'Se cuelga la vitrina',
    13: 'Se arma la estantería alta',
    14: 'Llegan las plantas',
    15: 'Se pone la pared de vidrio',
    16: 'Llegan los estantes de la bodega',
    17: 'Llega el escritorio de diseño',
    18: 'Llega la silla de trabajo',
    19: 'Se encienden las pantallas de la entrada',
    20: 'Se encienden las pantallas de la entrada',
    default: 'Llega: {short}',
    /* una por cada paso de DATA.montaje.pasos, en el mismo orden */
    pasos: [
      'Primero, el fondo: el mesón, la repisa, la pared de vidrio y el cuarto de atrás.',
      'Luego, la pared derecha: el mueble de cajones, el panel de huequitos, la vitrina y la estantería alta.',
      'Ahora, la pared izquierda: la estantería con luces y la pantalla gigante.',
      'Después, el centro: la mesa alta y las dos islas, que van casi de últimas porque estorban el paso.',
      'En la entrada, una pantalla en cada pilar para invitar a pasar.',
      '¡A encender! Llegan las impresoras, las luces, los taburetes y las plantas.'
    ],
    fin: '¡Se encienden las luces! La tienda está lista.'
  };

  /* ---------------------------------------------------------------------
     «¿Cómo nace una pieza?»: seis tarjetas atadas al video de 36 s
     assets/video/pantalla-75.mp4 (tiempos en segundos). Salen del guion de
     tools/video-pantalla/video.js y se revisaron cuadro por cuadro:
       0 – 3.4    portada «Así nace una pieza»
       3.4 – 10.2 Modelado: el jarrón se dibuja en líneas y toma volumen
       10.2 – 16.8 Laminado: «600 capas de 0,2 mm»
       16.8 – 21  Impresión en tiempo real: la boquilla de cerca (TB = 21.0)
       21 – 27.8  time-lapse: la pieza crece de la capa 19 a la 600
       27.8 – 36  Acabado («9 h 10 min») y logotipo
     ------------------------------------------------------------------- */
  const historia = [
    { t0: 0, t1: 3.4, ic: '💡', title: 'La idea', text: 'Imaginas algo: un robot, un jarrón, un llavero con tu nombre…' },
    { t0: 3.4, t1: 10.2, ic: '🖥️', title: 'Dibujo 3D', text: 'Lo dibujamos en el computador y lo puedes girar como en un videojuego.' },
    { t0: 10.2, t1: 16.8, ic: '🍞', title: 'Rebanadas', text: 'Un programa lo corta en 600 rebanadas, como un pan tajado. Cada una es tan delgada como dos hojas de papel.' },
    { t0: 16.8, t1: 21, ic: '🔥', title: 'Hilo derretido', text: 'La boquilla calienta el plástico a 210 grados, más que un horno de galletas, y lo dibuja capa sobre capa.' },
    { t0: 21, t1: 27.8, ic: '📈', title: 'Crece', text: 'La cama baja un poquito en cada capa y la pieza crece de abajo hacia arriba. ¡Este jarrón tarda más de 9 horas!' },
    { t0: 27.8, t1: 36, ic: '🎉', title: '¡Lista!', text: 'Se despega de la cama, se revisa cada detalle y ¡ya la puedes tocar y llevar a casa!' }
  ];

  /* ---------------------------------------------------------------------
     Traductor de precios: «≈ 210 balones de fútbol». Se usa la primera
     unidad, en este orden, que dé entre 3 y 999.
     ------------------------------------------------------------------- */
  const unidades = [
    { t: 'helados', uno: 'helado', ic: '🍦', p: 5000, fuente: 'Cono de helado de supermercado: $4.350 a $4.500 en Farmatodo; en heladería, algo más.' },
    { t: 'balones de fútbol', uno: 'balón de fútbol', ic: '⚽', p: 80000, fuente: 'Balón número 5: $59.900 en Alkosto y $84.990 en Falabella (Golty).' },
    { t: 'bicicletas', uno: 'bicicleta', ic: '🚲', p: 800000, fuente: 'Bicicleta de montaña rin 24, de aluminio y con cambios: hasta $818.700 en Falabella (GW).' }
  ];
  const unidadesNota = 'Precios de referencia en pesos colombianos, redondeados, de tiendas en línea de Colombia consultadas en octubre de 2026. Solo sirven para comparar.';

  /* ---------------------------------------------------------------------
     Tamaño: un niño de 10 años mide unos 1.40 m (mediana de la OMS:
     138 cm). comparaAltura dice qué tan alto es algo a su lado, según la
     altura del objeto en metros (o la de su borde de arriba, si va colgado):
     rodilla ≈ 0.40 m, cintura ≈ 0.75–0.85 m, hombros ≈ 1.15 m.
     ------------------------------------------------------------------- */
  const alturaNino = 1.40;
  const comparaAltura = [
    { hasta: 0.55, t: 'te llega a la rodilla' },
    { hasta: 0.92, t: 'te llega a la cintura' },
    { hasta: 1.18, t: 'te llega al pecho' },
    { hasta: 1.55, t: 'es más o menos de tu tamaño' },
    { hasta: 2.0, t: 'es más alto que tú' },
    { hasta: Infinity, t: 'es mucho más alto que tú' }
  ];

  /* quiz.a: el mismo arreglo que quiz.options, con el nombre corto del plan */
  Object.keys(items).forEach((n) => {
    const qz = items[n].quiz;
    if (qz && !('a' in qz)) Object.defineProperty(qz, 'a', { value: qz.options, enumerable: false });
  });

  L.kids = { items, glosario, procesos, montajeFrases, historia, unidades, unidadesNota, alturaNino, comparaAltura };
})();
