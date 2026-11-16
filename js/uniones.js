/* ============================================================================
   UNIONES ENTRE MATERIALES (Nota 1, elemento G) — qué une a cada material con
   el otro, con qué herraje y cómo se ve en corte. Cada detalle es un dibujo
   vectorial a escala 1:2 en milímetros (SVG), con el rayado de cada material:
     tablero   rayado a 45° espaciado         acero    relleno negro (pared delgada)
     aluminio  rayado cruzado fino            vidrio   tres líneas paralelas
     plástico  punteado                        PETG     rayado a −45° denso
   Cada detalle va acotado: los espesores salen del material y las distancias de
   perforación son las mismas de las reglas de herrajes del expediente (entrega.js).
   Las uniones de cada mueble se deducen de su despiece (versions.js).
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D;
  const U = (L.uniones = {});

  /* familia de material de cada clave del despiece */
  const FAM = {
    rovere15: 'tablero', blanca15: 'tablero', fondo6: 'tablero', mdf15: 'tablero', mdf55: 'tablero', hpl: 'tablero',
    tubo1: 'acero', tubo15: 'acero', tuboRect: 'acero', perforada: 'acero',
    perfil3030: 'aluminio', vidrio10: 'vidrio', vidrio6: 'vidrio',
    pvc10: 'plastico', pvc5: 'plastico', acril3: 'plastico', opal3: 'plastico', petg: 'petg'
  };
  const FAM_T = { tablero: 'Tablero de madera (aglomerado, MDF, laminado)', acero: 'Acero (tubo y lámina)', aluminio: 'Aluminio (perfil estructural)', vidrio: 'Vidrio templado', plastico: 'Plástico (PVC espumado y acrílico)', petg: 'PETG impreso' };
  U.fam = FAM; U.famT = FAM_T;

  /* ------------------------------------------------ dibujo */

  const css = '.u text{font-family:Inter,Arial,sans-serif;fill:#111}.u .o{stroke:#111;stroke-width:.7}.u .t{fill:none;stroke:#111;stroke-width:.35}.u .ax{stroke:#111;stroke-width:.25;stroke-dasharray:6 1.5 1 1.5;fill:none}' +
    '.u .lb{font-size:4.6px}.u .ld{stroke:#111;stroke-width:.3;fill:none}.u .dt{fill:#111}.u .st{fill:#111}.u .gl{fill:#fff;stroke:#111;stroke-width:.35}.u .sc{fill:#7a7a80}.u .th{fill:#fff;stroke:#111;stroke-width:.4}' +
    '.u .cl{stroke:#111;stroke-width:.28;fill:none}.u .ce{stroke:#111;stroke-width:.16;fill:none}.u .ck{stroke:#111;stroke-width:.45}.u .ct{font-size:4.4px;font-weight:700;text-anchor:middle;paint-order:stroke;stroke:#fff;stroke-width:1.1px;stroke-linejoin:round}.u .ct.l{text-anchor:start}' +
    '.u .br{fill:none;stroke:#111;stroke-width:.35}';
  const defs = '<defs>' +
    '<pattern id="uW" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" stroke="#111" stroke-width=".35"/></pattern>' +
    '<pattern id="uA" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V1.6M0 0H1.6" stroke="#111" stroke-width=".25"/></pattern>' +
    '<pattern id="uP" width="2" height="2" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".35" fill="#111"/></pattern>' +
    '<pattern id="uG" width="1.4" height="1.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="1.4" stroke="#111" stroke-width=".45"/></pattern>' +
    '<pattern id="uM" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#111" stroke-width=".25"/><line x1="2" y1="0" x2="2" y2="4" stroke="#111" stroke-width=".12"/></pattern>' +
    '</defs>';
  const R = (x, y, w, h, fill, cls) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '" class="' + (cls || 'o') + '"/>';
  const tubo = (x, y, s, t) => '<path class="st" fill-rule="evenodd" d="M' + x + ' ' + y + 'h' + s + 'v' + s + 'h' + (-s) + 'zM' + (x + t) + ' ' + (y + t) + 'v' + (s - 2 * t) + 'h' + (s - 2 * t) + 'v' + (-(s - 2 * t)) + 'z"/>';
  const tornillo = (x, y0, y1, head) => {             // vertical, cabeza en y0 (head: 'abajo' o 'arriba')
    const up = y1 < y0, d = up ? -1 : 1, L2 = Math.abs(y1 - y0);
    let s = '<rect class="sc" x="' + (x - 1.75) + '" y="' + Math.min(y0, y1) + '" width="3.5" height="' + L2 + '"/>';
    for (let i = 2; i < L2 - 1; i += 1.8) s += '<line x1="' + (x - 1.9) + '" y1="' + (y0 + d * i) + '" x2="' + (x + 1.9) + '" y2="' + (y0 + d * (i + 0.9)) + '" stroke="#fff" stroke-width=".3"/>';
    s += '<rect class="st" x="' + (x - 4) + '" y="' + (up ? y0 : y0 - 2.4) + '" width="8" height="2.4"/>';
    return s;
  };
  const tornilloH = (y, x0, x1) => {                   // horizontal, cabeza en x0
    const d = x1 > x0 ? 1 : -1;
    return '<rect class="sc" x="' + Math.min(x0, x1) + '" y="' + (y - 1.75) + '" width="' + Math.abs(x1 - x0) + '" height="3.5"/><rect class="st" x="' + (d > 0 ? x0 - 2.4 : x0) + '" y="' + (y - 4) + '" width="2.4" height="8"/>';
  };
  /* rótulo con línea de referencia: [x, y] punto, [tx, ty] texto */
  const lab = (x, y, tx, ty, t) => '<path class="ld" d="M' + x + ' ' + y + 'L' + tx + ' ' + ty + 'H' + (tx + (tx > x ? 3 : -3)) + '"/><circle class="dt" cx="' + x + '" cy="' + y + '" r=".8"/><text class="lb" x="' + (tx + (tx > x ? 4.5 : -4.5)) + '" y="' + (ty + 1.6) + '" text-anchor="' + (tx > x ? 'start' : 'end') + '">' + t + '</text>';
  /* cotas en mm: horizontal a la altura y (e = de dónde salen las líneas de referencia) y vertical en la abscisa x */
  const tk = (x, y) => '<line class="ck" x1="' + (x - 1.3) + '" y1="' + (y + 1.3) + '" x2="' + (x + 1.3) + '" y2="' + (y - 1.3) + '"/>';
  const cH = (x0, x1, y, t, e) => {
    const sm = Math.abs(x1 - x0) < 13, d = e == null ? 0 : Math.sign(y - e) || 1;
    return (e == null ? '' : '<path class="ce" d="M' + x0 + ' ' + (e + d) + 'V' + (y + 1.5 * d) + 'M' + x1 + ' ' + (e + d) + 'V' + (y + 1.5 * d) + '"/>') +
      '<line class="cl" x1="' + (sm ? x0 - 3 : x0) + '" y1="' + y + '" x2="' + (sm ? x1 + 3 : x1) + '" y2="' + y + '"/>' + tk(x0, y) + tk(x1, y) +
      '<text class="ct' + (sm ? ' l' : '') + '" x="' + (sm ? Math.max(x0, x1) + 4.5 : (x0 + x1) / 2) + '" y="' + (sm ? y + 1.6 : y - 1.6) + '">' + t + '</text>';
  };
  const cV = (y0, y1, x, t, e) => {
    const sm = Math.abs(y1 - y0) < 13, d = e == null ? 0 : Math.sign(x - e) || 1;
    return (e == null ? '' : '<path class="ce" d="M' + (e + d) + ' ' + y0 + 'H' + (x + 1.5 * d) + 'M' + (e + d) + ' ' + y1 + 'H' + (x + 1.5 * d) + '"/>') +
      '<line class="cl" x1="' + x + '" y1="' + (sm ? Math.min(y0, y1) - 3 : y0) + '" x2="' + x + '" y2="' + (sm ? Math.max(y0, y1) + 3 : y1) + '"/>' + tk(x, y0) + tk(x, y1) +
      (sm ? '<text class="ct l" x="' + (x + 2.6) + '" y="' + ((y0 + y1) / 2 + 1.6) + '">' + t + '</text>'
        : '<text class="ct" transform="translate(' + (x - 1.8) + ' ' + ((y0 + y1) / 2) + ') rotate(-90)">' + t + '</text>');
  };
  /* línea de rotura (la pieza sigue) */
  const brk = (x, y0, y1) => '<path class="br" d="M' + x + ' ' + y0 + 'l-2 ' + ((y1 - y0) / 4) + 'l4 ' + ((y1 - y0) / 4) + 'l-4 ' + ((y1 - y0) / 4) + 'l2 ' + ((y1 - y0) / 4) + '"/>';
  const brkH = (x0, x1, y) => { let d = 'M' + x0 + ' ' + y; const n = Math.round((x1 - x0) / 4); for (let i = 0; i < n; i++) d += 'l2 ' + (i % 2 ? 2 : -2) + 'l2 ' + (i % 2 ? -2 : 2); return '<path class="br" d="' + d + '"/>'; };
  const svg = (w, h, body) => '<svg xmlns="http://www.w3.org/2000/svg" class="u" viewBox="-48 -8 ' + (w + 96) + ' ' + (h + 12) + '" role="img"><style>' + css + '</style>' + defs + body + '</svg>';

  /* ------------------------------------------------ uniones
     Las distancias de perforación son las de las reglas de herrajes del expediente (entrega.js, HREG):
     si cambia una, se cambia en los dos sitios. */
  const UN = [
    { id: 'TA', t: 'Tablero sobre bastidor de acero', par: ['tablero', 'acero'],
      como: 'La tapa o el entrepaño se asienta sobre el tubo y se atornilla desde abajo: tornillo autoperforante de 6 × 5/8" a través de un agujero de 5 mm en la pared superior del tubo, cada 300 mm y a 25 mm de los extremos. Se retira para cambiar la tapa sin cortar nada.',
      herr: ['tornAuto'], draw: () => svg(170, 92, R(10, 22, 150, 15, 'url(#uW)') + R(10, 37, 150, 15, 'url(#uW)') + tubo(55, 52, 38, 1.2) + tornillo(74, 89, 46, 'abajo') +
        '<line class="ax" x1="74" y1="16" x2="74" y2="92"/>' + cV(22, 52, 2, '30', 10) + cH(55, 93, 12, '38', 52) + cV(52, 90, 104, '38', 93) +
        lab(130, 30, 145, 10, 'Tapa de 30 mm (2 × 15)') + lab(90, 60, 122, 70, 'Tubo 1-1/2" cal. 18') + lab(74, 80, 30, 84, 'Autoperforante 6 × 5/8"')) },
    { id: 'TR', t: 'Reposapiés de tubo en el frente', par: ['tablero', 'acero'],
      como: 'El reposapiés de tubo de 1" lleva soldados tres soportes de 55 mm; cada soporte se atornilla al frente desde dentro del cuerpo, a 300 mm del piso. La rosca del soporte (tuerca soldada o remachable M6, como en las reglas de herrajes) se confirma con el ebanista antes de soldar.',
      herr: [], draw: () => svg(170, 92, R(30, 8, 15, 76, 'url(#uW)') + R(45, 40, 55, 12, '#fff', 'th') + R(45, 40, 55, 1.2, '#111', 't') + R(45, 50.8, 55, 1.2, '#111', 't') + tubo(100, 33.3, 25.4, 1.2) + tornilloH(46, 30, 62) +
        '<path d="M98 38l4 0 0 16-4 0z" fill="#111"/>' + cH(30, 45, 2, '15', 8) + cH(45, 100, 66, '55', 52) + cH(100, 125.4, 66, '25', 58.7) +
        lab(37, 70, 14, 84, 'Frente de MDF 15 mm') + lab(112, 46, 135, 24, 'Reposapiés: tubo de 1"') + lab(72, 41, 80, 20, 'Soporte soldado') + lab(34, 46, 8, 30, 'Tornillo desde adentro')) },
    { id: 'TT', t: 'Tablero con tablero', par: ['tablero', 'tablero'],
      como: 'Tornillo de ensamble de 6 × 2" (50 mm): broca escalonada de 5 y 7 mm en la cara del lateral, en el eje del espesor del entrepaño (a 7,5 mm de su cara); a 50 mm de cada extremo y cada 200 mm como máximo; cabeza a ras, con tapatornillo. El fondo, atornillado por detrás, mantiene la escuadra.',
      herr: ['tornEns'], draw: () => svg(170, 92, R(20, 10, 15, 76, 'url(#uW)') + R(35, 40, 115, 15, 'url(#uW)') + tornilloH(47.5, 20, 70) + brk(150, 40, 55) +
        '<line class="ax" x1="12" y1="47.5" x2="100" y2="47.5"/>' + cH(20, 35, 3, '15', 10) + cV(40, 55, 158, '15', 150) + cH(20, 70, 68, '50', 55) + cV(40, 47.5, 108, '7,5', 100) +
        lab(27, 78, 4, 88, 'Lateral 15 mm') + lab(130, 44, 140, 24, 'Piso o entrepaño 15 mm') + lab(55, 46, 62, 24, 'Tornillo de ensamble 6 × 2"')) },
    { id: 'TD', t: 'Tapa o repisa de 30 mm en dos capas', par: ['tablero', 'tablero'],
      como: 'Dos capas de 15 mm pegadas con pegante para madera en toda la cara: capa delgada en las dos caras, prensado de 30 minutos y curado de 24 horas antes de cargar. El canto de 33 mm cubre las dos capas en una pasada y se refila a ras. En las tapas, la capa de arriba es Rovere y la de abajo melamina blanca.',
      herr: ['pegante'], draw: () => svg(170, 92, R(20, 28, 120, 15, 'url(#uW)') + R(20, 43, 120, 15, 'url(#uW)') + R(140, 27, 1.6, 32, '#111', 't') + brk(20, 28, 58) + '<line class="t" x1="20" y1="43" x2="140" y2="43" stroke-dasharray="2 1.2"/>' +
        cV(28, 43, 8, '15', 20) + cV(43, 58, 8, '15', 20) + cV(28, 58, 156, '30', 142) +
        lab(80, 35, 60, 12, 'Capa de arriba') + lab(80, 51, 60, 78, 'Capa de abajo') + lab(141, 58, 150, 76, 'Canto de 33 mm') + lab(110, 43, 118, 14, 'Línea de pegante')) },
    { id: 'BI', t: 'Puerta con bisagra de cazoleta', par: ['tablero', 'tablero'],
      como: 'Cazoleta de 35 mm de diámetro y 12 a 13 mm de profundidad en la puerta, con el borde a 4 mm del canto. Base en el costado, a 37 mm del canto frontal, con tornillos de 4 × 16. Primera y última bisagra a 100 mm de los extremos de la puerta; dos bisagras hasta 900 mm de alto. Holgura entre puertas: 3 mm.',
      herr: ['bisagraCaz'], draw: () => svg(170, 92, R(30, 10, 120, 15, 'url(#uW)') + R(32, 28, 15, 58, 'url(#uW)') + '<path class="th" d="M34 12.5h35v12.5h-35z"/>' + '<path class="t" d="M60 25v10q0 6-6 8l-7 3"/>' + R(47, 38, 3, 26, '#111', 't') + brk(150, 10, 25) +
        cH(30, 34, 4, '4', 10) + cH(34, 69, 4, '35', 10) + cV(28, 65, 60, '37', 47) + cV(12.5, 25, 76, '12,5', 69) + cH(32, 47, 90, '15', 86) +
        lab(120, 17, 135, 36, 'Puerta de 15 mm') + lab(40, 80, 14, 76, 'Costado de 15 mm') + lab(48.5, 55, 88, 60, 'Base de la bisagra') + lab(50, 18, 100, 44, 'Cazoleta Ø35')) },
    { id: 'RI', t: 'Cajón sobre riel de extensión total', par: ['tablero', 'tablero'],
      como: 'Riel de extensión total de 450 mm: la caja del cajón mide el hueco menos 12,7 mm por lado (se verifica con el riel en la mano). El riel va a 37 mm del canto frontal del costado, nivelado, con tornillos de 4 × 16. El frente se monta al final, con 2 mm de luz entre frentes y 3 mm a los bordes del cuerpo.',
      herr: ['riel45'], draw: () => svg(170, 92, R(30, 6, 15, 80, 'url(#uW)') + R(57.7, 22, 15, 50, 'url(#uW)') + R(45, 38, 12.7, 16, '#c8c8cc', 't') + R(72.7, 66.5, 77.3, 5.5, 'url(#uW)') + brk(150, 66.5, 72) +
        cH(30, 45, 0, '15', 6) + cH(45, 57.7, 90, '12,7', 54) + cH(57.7, 72.7, 14, '15', 22) + cV(22, 72, 84, '150', 72.7) +
        lab(37, 76, 12, 84, 'Costado del cuerpo') + lab(65, 60, 100, 50, 'Costado de la caja') + lab(51, 46, 100, 34, 'Riel de 450 mm') + lab(120, 69, 130, 84, 'Fondo de 5.5 mm')) },
    { id: 'GO', t: 'Gola de aluminio en el frente del cajón', par: ['aluminio', 'tablero'],
      como: 'El perfil manija de aluminio para tablero de 15 mm se monta en el canto superior de cada frente, cortado al ancho del frente (596 mm), y hace de tirador corrido: no hay manijas a la vista. Se fija como indica la ficha del perfil y se confirma con una muestra antes de cortar los 15 tramos.',
      herr: [], draw: () => svg(170, 92, R(70, 26, 15, 52, 'url(#uW)') + '<path class="o" fill="url(#uA)" d="M71.5 6h12v20h-12z"/>' + brkH(68, 88, 78) +
        cH(70, 85, 87, '15', 78) + cV(6, 26, 96, '20', 83.5) + cH(71.5, 83.5, 0, '12', 6) +
        lab(77.5, 60, 110, 66, 'Frente de MDF 15 mm') + lab(77.5, 14, 40, 14, 'Perfil manija (gola)')) },
    { id: 'SO', t: 'Acero con acero', par: ['acero', 'acero'],
      como: 'Soldadura MIG a tope en las uniones de tubo, a escuadra, pulida y con dos manos de anticorrosivo. La lámina perforada va con puntos de soldadura cada 150 mm sobre el marco.',
      herr: [], draw: () => svg(170, 92, tubo(40, 30, 38, 1.2) + '<path class="st" d="M78 42h70v14H78z" fill-rule="evenodd"/><path d="M79.2 43.2h67.6v11.6H79.2z" fill="#fff"/>' + '<path d="M76 40l4 0 0 18-4 0z" fill="#111"/>' +
        cH(40, 78, 22, '38', 30) + cV(42, 56, 156, '25', 148) +
        lab(78, 41, 100, 14, 'Cordón de soldadura MIG') + lab(59, 66, 40, 82, 'Tubo 1-1/2"') + lab(130, 49, 140, 76, 'Tubo 1"')) },
    { id: 'VA', t: 'Vidrio en marco de acero', par: ['vidrio', 'acero'],
      como: 'El vidrio templado entra en un perfil en U de acero con calzos de neopreno abajo y burlete a los lados; se sella con silicona neutra. La puerta cuelga de bisagras de pinza del kit batiente, sin perforar el vidrio en obra (las perforaciones las hace el templador).',
      herr: ['kitBatiente'], draw: () => svg(170, 92, '<path class="st" d="M60 60h50v25H60zM63.5 60V81.5H106.5V60z" fill-rule="evenodd"/>' + R(80, 8, 10, 68, 'none', 'gl') + '<line class="t" x1="83.3" y1="8" x2="83.3" y2="76"/><line class="t" x1="86.6" y1="8" x2="86.6" y2="76"/>' +
        R(80, 76, 10, 5.5, '#999', 't') + R(70, 55, 10, 21, 'url(#uP)', 't') + R(90, 55, 10, 21, 'url(#uP)', 't') + cH(80, 90, 2, '6', 8) + cH(60, 110, 91, '50', 85) + cV(60, 85, 118, '25', 110) +
        lab(85, 20, 120, 16, 'Vidrio templado 6 mm') + lab(85, 79, 132, 84, 'Calzo de neopreno') + lab(75, 62, 40, 50, 'Burlete y silicona neutra') + lab(108, 66, 135, 50, 'Perfil U de acero')) },
    { id: 'VT', t: 'Vidrio en jamba de tablero', par: ['vidrio', 'tablero'],
      como: 'Ranura de 14 mm de ancho y 15 mm de fondo en la jamba de MDF; el vidrio templado de 10 mm entra con burlete de 2 mm por lado y calzos en la base. Se sella con silicona neutra transparente. La puerta cuelga del kit batiente, que llega con su plantilla: las perforaciones del vidrio las hace el templador.',
      herr: ['kitBatiente'], draw: () => svg(170, 92, '<path d="M50 24h70v60H50z M78 24v15h14V24z" fill="url(#uW)" class="o" fill-rule="evenodd"/>' + R(80, 4, 10, 35, 'none', 'gl') + '<line class="t" x1="83.3" y1="4" x2="83.3" y2="39"/><line class="t" x1="86.6" y1="4" x2="86.6" y2="39"/>' +
        R(78, 24, 2, 15, '#999', 't') + R(90, 24, 2, 15, '#999', 't') + cH(78, 92, 48, '14', 39) + cV(24, 39, 128, '15', 120) + cH(80, 90, -2, '10', 4) +
        lab(85, 12, 120, 10, 'Vidrio templado 10 mm') + lab(79, 30, 30, 34, 'Burlete 2 mm') + lab(105, 70, 135, 78, 'Jamba de MDF lacada')) },
    { id: 'AT', t: 'Tablero en perfil de aluminio', par: ['aluminio', 'tablero'],
      como: 'Tornillo bristol M6 × 16 a una tuerca martillo que corre por la ranura del perfil 30 × 30; en el tablero, el tornillo pasa por un agujero de 7 mm. Las esquinas del bastidor llevan escuadra 3030A con su tornillería.',
      herr: ['escuadra', 'tornM6'], draw: () => svg(170, 92, '<path fill="url(#uA)" class="o" d="M60 45h30v30H60z M71.5 45v4h-4v4h15v-4h-4v-4z" fill-rule="evenodd"/>' + R(40, 30, 90, 15, 'url(#uW)') + tornillo(75, 26, 56, 'arriba') + R(68, 53, 14, 3.5, '#111', 't') +
        cV(30, 45, 138, '15', 130) + cH(60, 90, 84, '30', 75) + cV(45, 75, 98, '30', 90) +
        lab(115, 37, 135, 16, 'Tablero 15 mm con laminado') + lab(64, 70, 30, 84, 'Perfil de aluminio 30 × 30') + lab(70, 54.5, 30, 62, 'Tuerca martillo M6') + lab(75, 28, 40, 14, 'Bristol M6 × 16')) },
    { id: 'AP', t: 'Panel de plástico en perfil de aluminio', par: ['aluminio', 'plastico'],
      como: 'El panel de PVC espumado de 10 mm (o el acrílico de 3 mm) se sujeta con clips impresos en PETG que entran a presión en la ranura del perfil, cada 300 mm. Se suelta sin herramientas para limpiar o cambiar el panel.',
      herr: [], draw: () => svg(170, 92, '<path fill="url(#uA)" class="o" d="M40 30h30v30H40z M70 41.5h-4v-4h-4v15h4v-4h4z" fill-rule="evenodd"/>' + '<path fill="url(#uG)" class="o" d="M66 39h18v12H66z"/>' + R(84, 35, 70, 10, 'url(#uP)') +
        cH(40, 70, 22, '30', 30) + cV(35, 45, 162, '10', 154) +
        lab(55, 55, 30, 75, 'Perfil 30 × 30') + lab(75, 45, 95, 70, 'Clip impreso en PETG') + lab(130, 40, 140, 20, 'PVC espumado 10 mm')) },
    { id: 'AI', t: 'Pieza impresa en perfil de aluminio', par: ['aluminio', 'petg'],
      como: 'Las esquinas, ménsulas y bisagras impresas en PETG llevan un alojamiento hexagonal para la tuerca M6 y se fijan con tornillo bristol a la tuerca martillo de la ranura. Relleno del 40 % y cuatro perímetros en las zonas de tornillo.',
      herr: ['tornM6'], draw: () => svg(170, 92, '<path fill="url(#uA)" class="o" d="M30 40h30v30H30z M60 51.5h-4v-4h-4v15h4v-4h4z" fill-rule="evenodd"/>' + '<path fill="url(#uG)" class="o" d="M60 30h55v50H60z"/>' + tornilloH(55, 112, 52) + R(50, 50, 4, 10, '#111', 't') +
        cH(30, 60, 78, '30', 70) +
        lab(45, 65, 25, 88, 'Perfil 30 × 30') + lab(90, 35, 110, 18, 'Ménsula o esquina en PETG') + lab(52, 55, 35, 20, 'Tuerca martillo M6') + lab(100, 55, 135, 66, 'Bristol M6')) },
    { id: 'PT', t: 'Acrílico en ranura del tablero', par: ['plastico', 'tablero'],
      como: 'El acrílico de 3 mm entra en una ranura de 4 mm de ancho y 8 mm de fondo fresada en el tablero, sin pegante: así se puede cambiar si se raya.',
      herr: [], draw: () => svg(170, 92, '<path d="M30 40h110v15H30z M83 40v8h4v-8z" fill="url(#uW)" class="o" fill-rule="evenodd"/>' + R(83.5, 8, 3, 39.5, 'url(#uP)') +
        cH(83.5, 86.5, 2, '3', 8) + cH(83, 87, 64, '4', 55) + cV(40, 48, 100, '8', 87) + cV(40, 55, 148, '15', 140) +
        lab(85, 22, 115, 22, 'Acrílico de 3 mm') + lab(60, 48, 40, 76, 'Tablero de MDF 15 mm')) },
    { id: 'LI', t: 'Panel de listones con repisas de acrílico', par: ['plastico', 'tablero'],
      como: 'Los listones de 100 × 15 mm llevan un rebaje de 4 mm de ancho y 8 mm de fondo en el canto de arriba, por detrás, y se atornillan al tablero de abajo hacia arriba dejando una ranura entre uno y otro. La pestaña doblada de cada repisa de acrílico de 3 mm, y los ganchos, entran en ese rebaje: se cambian de sitio sin herramientas.',
      herr: ['tornAuto'], draw: () => svg(170, 92, R(30, 4, 15, 82, 'url(#uW)') + R(45, 4, 15, 34, 'url(#uW)') + '<path d="M45 58h4v-8h11v36h-15z" fill="url(#uW)" class="o"/>' + '<path d="M45.5 57.5v-15.5h100v3h-97v12.5z" fill="url(#uP)" class="t"/>' + brk(145.5, 42, 45) +
        cH(30, 45, -3, '15', 4) + cH(45, 60, -3, '15', 4) + cH(45, 49, 92, '4', 86) + cV(50, 58, 72, '8', 60) + cV(42, 45, 152, '3', 145.5) +
        lab(37, 70, 12, 80, 'Tablero de MDF 15 mm') + lab(55, 20, 90, 14, 'Listón de 100 × 15') + lab(100, 43.5, 110, 64, 'Repisa de acrílico de 3 mm') + lab(47, 54, 90, 78, 'Pestaña en el rebaje')) },
    { id: 'OPAL', t: 'Caja de luz: acrílico opal con tira COB detrás', par: ['plastico', 'tablero'],
      como: 'El acrílico opal de 3 mm entra en una ranura de 4 mm de ancho y 8 mm de fondo en los costados, a 30 mm del canto trasero; la tira COB va detrás, a unos 20 mm del opal, para que la luz llegue pareja y no se vean los puntos. Falta definir sobre qué se pega la tira (el mueble no tiene fondo): un listón o una tira de MDF entre costados.',
      herr: [], draw: () => svg(170, 92, '<path d="M30 6h15v80H30z M45 53v4h-8v-4z" fill="url(#uW)" class="o" fill-rule="evenodd"/>' + R(37, 53.5, 113, 3, 'url(#uP)') + brk(150, 53.5, 56.5) + R(80, 74.4, 8, 1.6, '#f5a623', 't') + '<line class="t" x1="45" y1="86" x2="150" y2="86" stroke-dasharray="3 1.5"/>' +
        cV(56.5, 86, 20, '30', 30) + cV(56.5, 74.4, 104, '18', 88) + cH(30, 45, 0, '15', 6) + cV(53.5, 56.5, 160, '3', 150) +
        lab(120, 55, 130, 36, 'Acrílico opal de 3 mm') + lab(88, 75.2, 118, 70, 'Tira COB') + lab(37.5, 20, 60, 16, 'Costado de MDF 15 mm') + lab(130, 86, 138, 76, 'Respaldo')) },
    { id: 'PA', t: 'Acrílico en marco de acero', par: ['plastico', 'acero'],
      como: 'El acrílico se apoya en el marco de tubo y se retiene con un perfil de aluminio en L atornillado (autoperforante cada 300 mm), con cinta de espuma entre el acrílico y el acero para que no vibre.',
      herr: ['tornAuto'], draw: () => svg(170, 92, tubo(50, 45, 25.4, 1.2) + R(40, 40, 70, 3, 'url(#uP)') + '<path class="o" d="M75 37h20v3H78v-3" fill="#bbb"/>' + R(50, 43, 25, 2, '#ddd', 't') +
        cH(50, 75.4, 80, '25', 70.4) + cV(40, 43, 118, '3', 110) +
        lab(100, 41.5, 125, 26, 'Acrílico 3 mm') + lab(85, 38, 100, 14, 'Perfil L de retención') + lab(52, 58, 30, 86, 'Tubo 1" cal. 18')) },
    { id: 'LED', t: 'Perfil LED en el mueble', par: ['aluminio', 'tablero'],
      como: 'El perfil de aluminio con cinta LED (16 × 12 mm) se fija con sus clips de montaje atornillados al tablero, o entra a presión en una ranura del mismo ancho; se corta al largo indicado en el despiece. El cable baja por un pasacable al compartimento de la fuente.',
      herr: ['perfilLed', 'cableDuplex16'], draw: () => svg(170, 92, R(20, 28, 130, 15, 'url(#uW)') + '<path class="o" fill="url(#uA)" d="M70 43h16v12H70z M72 43v10h12v-10z" fill-rule="evenodd"/>' + R(72, 53, 12, 2, '#fff', 't') + R(74, 45, 8, 1.6, '#f5a623', 't') + brk(20, 28, 43) + brk(150, 28, 43) +
        cH(70, 86, 66, '16', 55) + cV(43, 55, 96, '12', 86) + cV(28, 43, 158, '15', 150) +
        lab(71, 49, 40, 70, 'Perfil de aluminio con difusor') + lab(78, 45.8, 50, 14, 'Cinta LED de 12 V') + lab(120, 35, 130, 14, 'Dintel, repisa o entrepaño')) },
    { id: 'COB', t: 'Tira COB escondida en una ranura', par: ['aluminio', 'tablero'],
      como: 'La tira COB se pega con su cinta doble faz en una ranura de 10 mm de ancho y 3 mm de fondo, a 20 mm del canto frontal: ese labio de 20 mm la esconde de la vista. Se corta cada 25 mm, en las marcas. El cable sale por detrás y baja al compartimento de la fuente.',
      herr: ['cob', 'cableDuplex16'], draw: () => svg(170, 92, '<path d="M20 30h130v15H50v-3H40v3H20z" fill="url(#uW)" class="o"/>' + R(41, 42.4, 8, 1.6, '#f5a623', 't') + brk(150, 30, 45) +
        cH(20, 40, 58, '20', 45) + cH(40, 50, 70, '10', 45) + cV(42, 45, 62, '3', 50) + cV(30, 45, 158, '15', 150) +
        lab(45, 43.2, 80, 82, 'Tira COB de 12 V') + lab(100, 37, 110, 14, 'Entrepaño, tapa o zócalo') + lab(20, 37, 2, 20, 'Canto frontal')) },
    { id: 'NIV', t: 'Nivelador en el mueble', par: ['acero', 'tablero'],
      como: 'En el tubo, una tuerca de 5/16" soldada en la tapa inferior; en el tablero, un inserto roscado de 5/16" en el piso del mueble. El nivelador regula ±15 mm para corregir el desnivel del piso; se nivela en dos direcciones antes de cargar el mueble.',
      herr: ['nivelador'], draw: () => svg(170, 92, tubo(60, 15, 38, 1.2) + R(68, 52, 22, 3, '#111', 't') + R(76, 55, 6, 20, '#7a7a80', 't') + '<path class="o" d="M66 75h26l-3 6H69z" fill="#ddd"/>' + R(10, 85, 150, 0.01, '#fff', 't') +
        cH(60, 98, 7, '38', 15) + cV(53, 81, 40, '±15', 60) +
        lab(79, 30, 112, 20, 'Tubo 1-1/2"') + lab(80, 53.5, 115, 48, 'Tuerca 5/16" soldada') + lab(79, 65, 115, 66, 'Nivelador de rosca 5/16"')) },
    { id: 'PAT', t: 'Pata niveladora y zócalo', par: ['plastico', 'tablero'],
      como: 'La placa de cada pata se atornilla bajo el piso del cuerpo con cuatro tornillos de 4 × 16, a 50 mm de las esquinas. La pata de 100 mm se regula con la mano antes de poner el zócalo, que se sujeta a las patas con su clip y queda retranqueado.',
      herr: ['pataNiv'], draw: () => svg(170, 92, R(10, 14, 150, 15, 'url(#uW)') + R(52, 29, 30, 3, '#111', 't') + R(60, 32, 14, 17, '#666', 't') + brkH(55, 79, 50) + brkH(55, 79, 54) + R(60, 55, 14, 17, '#666', 't') + '<path class="o" d="M56 72h22l3 8H53z" fill="#ddd"/>' +
        R(112, 29, 15, 51, 'url(#uW)') + '<path class="t" d="M74 60h38"/>' + R(2, 80, 166, 0.01, '#fff', 't') + brk(10, 14, 29) +
        cV(29, 80, 144, '100', 127) + cV(14, 29, 0, '15', 10) + cH(10, 67, 6, '50', 14) + cH(112, 127, 88, '15', 80) +
        lab(67, 30.5, 30, 46, 'Placa: 4 tornillos 4 × 16') + lab(92, 60, 96, 88, 'Clip del zócalo') + lab(119.5, 50, 135, 40, 'Zócalo de MDF') + lab(67, 76, 30, 70, 'Pata de 100 mm')) },
    { id: 'MU', t: 'Mueble anclado al muro', par: ['muro', 'mueble'],
      como: 'Chazo expansivo de 3/8" × 1-7/8" en el muro: broca de concreto de 3/8" (10 mm), 55 mm de profundidad, a 100 mm o más del borde del muro. Dos por módulo o por cremallera, a través del fondo o de la platina de anclaje. Antes de perforar se verifica con detector que no pasen tuberías ni cables.',
      herr: ['chazo'], draw: () => svg(170, 92, R(-10, 10, 65, 75, 'url(#uM)', 'o') + '<text class="lb" x="-6" y="17">Muro</text>' + R(55, 30, 6, 40, 'url(#uW)') + R(61, 20, 90, 15, 'url(#uW)') + brk(151, 20, 35) + R(0, 46.5, 55, 7, '#fff', 't') + R(7, 46.5, 48, 7, '#bbb', 't') + tornilloH(50, 63.4, 12) +
        cH(0, 55, 66, '55', 53.5) + cH(7, 55, 40, '48', 46.5) + cH(55, 61, 80, '6', 70) +
        lab(30, 50, 20, 88, 'Chazo de 3/8" × 1-7/8"') + lab(58, 62, 90, 62, 'Fondo o platina') + lab(110, 27, 125, 46, 'Mueble')) },
    { id: 'SI', t: 'Repisa sobre soportes invisibles', par: ['acero', 'tablero'],
      como: 'Cada soporte tubular de 3/8" × 180 mm se fija al muro con su chazo y entra 140 mm en una perforación de 10 mm hecha en el canto trasero de la repisa, centrada en sus 30 mm de espesor. La repisa entra a presión y se nivela; se saca tirando de ella hacia el frente.',
      herr: ['soporteInv', 'chazo'], draw: () => svg(170, 92, R(-20, 8, 40, 78, 'url(#uM)', 'o') + '<text class="lb" x="-16" y="15">Muro</text>' + R(20, 31, 135, 15, 'url(#uW)') + R(20, 46, 135, 15, 'url(#uW)') + brk(155, 31, 61) + R(-20, 41.2, 180, 9.6, '#c8c8cc', 't') +
        cH(20, 160, 74, '140', 61) + cH(-20, 20, 2, '40', 8) + cV(31, 61, 166, '30', 155) + cV(31, 46, 8, '15', 20) +
        lab(90, 46, 100, 16, 'Soporte tubular de 3/8"') + lab(130, 55, 120, 86, 'Repisa de dos capas')) },
    { id: 'RG', t: 'Tapa de registro de la fuente', par: ['tablero', 'tablero'],
      como: 'La fuente de 12 V queda dentro del mueble, detrás de una tapa de MDF de 5.5 mm de 300 × 200 que cubre una abertura de 260 × 160: traslapa 20 mm por lado y se fija con cuatro tornillos autoperforantes de 6 × 5/8" (16 mm) de cabeza visible, a 10 mm del borde. No se encola: se quita para cambiar la fuente o una tira sin desarmar el mueble.',
      herr: [], draw: () => svg(170, 92, R(10, 40, 60, 15, 'url(#uW)') + brk(10, 40, 55) + R(50, 34.5, 100, 5.5, 'url(#uW)') + brk(150, 34.5, 40) + tornillo(60, 34.5, 52, 'abajo') +
        '<text class="lb" x="96" y="52" text-anchor="middle">Abertura de 260 × 160</text>' +
        cH(50, 70, 66, '20', 55) + cH(50, 60, 24, '10', 34.5) + cV(34.5, 40, 160, '5,5', 150) + cV(40, 55, 2, '15', 10) +
        lab(120, 37, 128, 16, 'Tapa de 300 × 200') + lab(30, 48, 14, 78, 'Pared del mueble') + lab(60, 33, 30, 14, 'Tornillo 6 × 5/8"')) },
    { id: 'HPL', t: 'Laminado sobre MDF', par: ['tablero', 'tablero'],
      como: 'Pegante de contacto en las dos caras, se deja orear 15 minutos y se prensa con rodillo del centro hacia los bordes; luego se refila con fresadora y se pega el canto.',
      herr: ['contacto'], draw: () => svg(170, 92, R(20, 40, 130, 15, 'url(#uW)') + R(20, 38.4, 130, 1.6, '#111', 't') + cV(40, 55, 158, '15', 150) + lab(100, 39, 110, 16, 'Laminado 0.6 mm + pegante de contacto') + lab(60, 50, 40, 76, 'MDF 15 mm')) },
    { id: 'CU', t: 'Piel curva de MDF', par: ['tablero', 'tablero'],
      como: 'Dos capas de MDF de 5.5 mm encoladas entre sí y curvadas sobre el canto del piso y de la tapa, que llevan el radio de la punta; las costillas verticales les dan apoyo. Las juntas de una capa no coinciden con las de la otra. Se grapan mientras seca el pegante (prensado de 30 minutos, curado de 24 horas) y se lacan juntas. El radio y el desarrollo de cada piel están en el plano de conjunto.',
      herr: ['pegante'], draw: () => svg(170, 92, '<path class="o" fill="url(#uW)" d="M40 76V44a40 40 0 0 1 40-40h70v11H80a29 29 0 0 0-29 29v32z"/>' + '<path class="t" d="M45.5 76V44a34.5 34.5 0 0 1 34.5-34.5h70"/>' + '<path class="o" fill="url(#uP)" d="M52 76V44a28 28 0 0 1 28-28h70v60z" fill-opacity=".5"/>' +
        '<path class="ld" d="M80 44L51.7 15.7"/><circle class="dt" cx="80" cy="44" r=".8"/><text class="lb" x="60" y="34">R</text>' + cH(40, 51, 85, '11', 76) +
        lab(120, 9, 128, 30, 'Dos capas de MDF 5.5 mm') + lab(110, 60, 118, 48, 'Piso y tapa de MDF 15 mm') + lab(80, 44, 96, 72, 'Radio de la punta')) }
  ];
  U.list = UN;
  U.byId = {}; UN.forEach((u) => { U.byId[u.id] = u; });

  /* uniones de un mueble a partir de su despiece y herrajes */
  U.of = function (v, n) {
    const it = L.versions.items[v] && L.versions.items[v][n]; if (!it) return [];
    const P = L.versions.precios, mk = new Set(), fam = new Set(), her = new Set();
    it.piezas.forEach((p) => { mk.add(p[0]); if (FAM[p[0]]) fam.add(FAM[p[0]]); });
    it.herrajes.forEach((h) => her.add(h[0])); it.acabados.forEach((a) => her.add(a[0]));
    const out = [], add = (id, why) => { if (!out.find((x) => x.u.id === id)) out.push({ u: U.byId[id], why }); };
    const has = (f) => fam.has(f), nm = (re) => it.piezas.some((p) => re.test(p[1]));
    const tb = it.piezas.filter((p) => /^tubo/.test(p[0])), tubos = tb.reduce((a, p) => a + p[2], 0);
    const soloReposa = tb.length && tb.every((p) => /reposapi|soporte/i.test(p[1]));
    if (has('tablero') && has('acero')) { if (soloReposa) add('TR', 'Reposapiés atornillado al frente'); else add('TA', 'Tablero y acero en el mismo mueble'); }
    if (tubos > 1) add('SO', soloReposa ? 'Soportes soldados al reposapiés' : 'Bastidor de tubo soldado');
    if (has('vidrio') && has('acero')) add('VA', 'Vidrio con marco de acero');
    if (has('vidrio') && has('tablero')) add('VT', 'Vidrio con jambas de tablero');
    if (has('aluminio') && (has('tablero'))) add('AT', 'Perfil de aluminio con tablero');
    if (has('aluminio') && has('plastico')) add('AP', 'Perfil de aluminio con paneles de plástico');
    if (has('aluminio') && has('petg')) add('AI', 'Piezas impresas sobre el perfil');
    if (has('tablero') && it.piezas.filter((p) => FAM[p[0]] === 'tablero').length > 2 && !has('aluminio')) add('TT', 'Cuerpo de tablero');
    if (it.piezas.some((p) => P[p[0]] && P[p[0]].tipo === 'lamina' && p[0] !== 'mdf55' && /capa superior|dos capas/i.test(p[1]))) add('TD', 'Tapa o repisa de 30 mm');
    if (her.has('bisagraCaz')) add('BI', 'Puertas con bisagra');
    if (her.has('riel45')) add('RI', 'Cajones sobre rieles');
    if (mk.has('perfilManija')) add('GO', 'Tirador corrido de aluminio');
    const cobOpal = it.piezas.some((p) => p[0] === 'cob' && /tras el opal/i.test(p[1])), cobVisto = it.piezas.some((p) => p[0] === 'cob' && !/tras el opal/i.test(p[1]));
    if (mk.has('acril3') && has('tablero') && !has('aluminio')) { if (nm(/list[oó]n/i) && nm(/repisa de acr/i)) add('LI', 'Repisas y ganchos reubicables'); else add('PT', 'Acrílico en el tablero'); }
    if (mk.has('opal3') && cobOpal && has('tablero') && !has('aluminio')) add('OPAL', 'Fondo de luz');
    else if (has('plastico') && has('tablero') && !has('aluminio') && !mk.has('acril3') && !has('vidrio')) add('PT', 'Acrílico en el tablero');
    if (has('plastico') && has('acero')) add('PA', 'Acrílico en el marco de acero');
    if (mk.has('perfilLed')) add('LED', 'Iluminación con perfil LED');
    if (cobVisto) add('COB', 'Iluminación con tira COB');
    if (mk.has('hpl') || her.has('contacto')) add('HPL', 'Tapa con laminado');
    if (mk.has('mdf55') && nm(/piel/i)) add('CU', 'Puntas curvas');
    if (nm(/registro/i)) add('RG', 'Acceso a la fuente');
    if (her.has('soporteInv')) add('SI', 'Repisa volada del muro');
    if (her.has('nivelador')) add('NIV', 'Apoyo en el piso');
    if (her.has('pataNiv')) add('PAT', 'Apoyo en el piso');
    if (her.has('chazo')) add('MU', 'Anclado al muro');
    return out;
  };
  /* familias de material del mueble (para la regla de la guía) */
  U.familias = function (v, n) {
    const it = L.versions.items[v] && L.versions.items[v][n]; if (!it) return [];
    const f = new Set(); it.piezas.forEach((p) => { if (FAM[p[0]]) f.add(FAM[p[0]]); });
    return Array.from(f);
  };
})();
