/* ============================================================================
   UNIONES ENTRE MATERIALES (Nota 1, elemento G) — qué une a cada material con
   el otro, con qué herraje y cómo se ve en corte. Cada detalle es un dibujo
   vectorial a escala 1:2 en milímetros (SVG), con el rayado de cada material:
     tablero   rayado a 45° espaciado         acero    relleno negro (pared delgada)
     aluminio  rayado cruzado fino            vidrio   tres líneas paralelas
     plástico  punteado                        PETG     rayado a −45° denso
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
    '.u .lb{font-size:4.6px}.u .ld{stroke:#111;stroke-width:.3;fill:none}.u .dt{fill:#111}.u .st{fill:#111}.u .gl{fill:#fff;stroke:#111;stroke-width:.35}.u .sc{fill:#7a7a80}.u .th{fill:#fff;stroke:#111;stroke-width:.4}';
  const defs = '<defs>' +
    '<pattern id="uW" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" stroke="#111" stroke-width=".35"/></pattern>' +
    '<pattern id="uA" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V1.6M0 0H1.6" stroke="#111" stroke-width=".25"/></pattern>' +
    '<pattern id="uP" width="2" height="2" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".35" fill="#111"/></pattern>' +
    '<pattern id="uG" width="1.4" height="1.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="1.4" stroke="#111" stroke-width=".45"/></pattern>' +
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
  const svg = (w, h, body) => '<svg xmlns="http://www.w3.org/2000/svg" class="u" viewBox="-48 0 ' + (w + 96) + ' ' + h + '" role="img"><style>' + css + '</style>' + defs + body + '</svg>';

  /* ------------------------------------------------ uniones */
  const UN = [
    { id: 'TA', t: 'Tablero sobre bastidor de acero', par: ['tablero', 'acero'],
      como: 'La tapa o el entrepaño se asienta sobre el tubo y se atornilla desde abajo: tornillo autoperforante de 6 × 5/8" a través de un agujero de 5 mm en la pared superior del tubo, cada 300 mm. Se retira para cambiar la tapa sin cortar nada.',
      herr: ['tornAuto'], draw: () => svg(170, 92, R(10, 22, 150, 15, 'url(#uW)') + R(10, 37, 150, 15, 'url(#uW)') + tubo(55, 52, 38, 1.2) + tornillo(74, 89, 46, 'abajo') +
        '<line class="ax" x1="74" y1="16" x2="74" y2="92"/>' + lab(130, 30, 145, 10, 'Tapa de 30 mm (2 × 15)') + lab(90, 60, 120, 70, 'Tubo 1-1/2" cal. 18') + lab(74, 80, 30, 84, 'Autoperforante 6 × 5/8"')) },
    { id: 'TT', t: 'Tablero con tablero', par: ['tablero', 'tablero'],
      como: 'Tornillo de ensamble de 6 × 2" con pretaladro de 3 mm en el canto y avellanado en la cara, a 50 mm de cada borde y cada 250 mm. El fondo de 6 mm, atornillado por detrás, mantiene la escuadra.',
      herr: ['tornEns'], draw: () => svg(170, 92, R(20, 12, 15, 75, 'url(#uW)') + R(35, 40, 115, 15, 'url(#uW)') + tornilloH(47.5, 22, 82) + R(20, 87, 130, 0.01, '#fff', 't') +
        lab(27, 20, 50, 16, 'Lateral 15 mm') + lab(120, 47, 140, 70, 'Piso o entrepaño 15 mm') + lab(60, 47, 70, 30, 'Tornillo de ensamble 6 × 2"')) },
    { id: 'SO', t: 'Acero con acero', par: ['acero', 'acero'],
      como: 'Soldadura MIG a tope en las uniones de tubo, a escuadra, pulida y con dos manos de anticorrosivo. La lámina perforada va con puntos de soldadura cada 150 mm sobre el marco.',
      herr: [], draw: () => svg(170, 92, tubo(40, 30, 38, 1.2) + '<path class="st" d="M78 42h70v14H78z" fill-rule="evenodd"/><path d="M79.2 43.2h67.6v11.6H79.2z" fill="#fff"/>' + '<path d="M76 40l4 0 0 18-4 0z" fill="#111"/>' +
        lab(78, 41, 100, 22, 'Cordón de soldadura MIG') + lab(59, 66, 40, 80, 'Tubo 1-1/2"') + lab(130, 49, 140, 75, 'Tubo 1"')) },
    { id: 'VA', t: 'Vidrio en marco de acero', par: ['vidrio', 'acero'],
      como: 'El vidrio templado entra en un perfil en U de acero con calzos de neopreno abajo y burlete a los lados; se sella con silicona neutra. La puerta cuelga de bisagras de pinza del kit batiente, sin perforar el vidrio en obra (las perforaciones las hace el templador).',
      herr: ['kitBatiente'], draw: () => svg(170, 92, '<path class="st" d="M60 60h50v25H60zM63.5 60V81.5H106.5V60z" fill-rule="evenodd"/>' + R(80, 8, 10, 68, 'none', 'gl') + '<line class="t" x1="83.3" y1="8" x2="83.3" y2="76"/><line class="t" x1="86.6" y1="8" x2="86.6" y2="76"/>' +
        R(80, 76, 10, 5.5, '#999', 't') + R(70, 55, 10, 21, 'url(#uP)', 't') + R(90, 55, 10, 21, 'url(#uP)', 't') +
        lab(85, 20, 120, 16, 'Vidrio templado 6 o 10 mm') + lab(85, 79, 125, 88, 'Calzo de neopreno') + lab(75, 62, 40, 50, 'Burlete y silicona neutra') + lab(108, 72, 135, 66, 'Perfil U de acero')) },
    { id: 'VT', t: 'Vidrio en jamba de tablero', par: ['vidrio', 'tablero'],
      como: 'Ranura de 14 mm × 15 mm de fondo fresada en la jamba de MDF; el vidrio de 10 mm entra con burlete de 2 mm por lado y calzos en la base. Se sella con silicona neutra transparente.',
      herr: [], draw: () => svg(170, 92, '<path d="M50 20h70v60H50z M78 20v15h14V20z" fill="url(#uW)" class="o" fill-rule="evenodd"/>' + R(80, 4, 10, 40, 'none', 'gl') + '<line class="t" x1="83.3" y1="4" x2="83.3" y2="44"/><line class="t" x1="86.6" y1="4" x2="86.6" y2="44"/>' +
        R(78, 20, 2, 15, '#999', 't') + R(90, 20, 2, 15, '#999', 't') + lab(85, 10, 120, 8, 'Vidrio templado 10 mm') + lab(79, 28, 30, 30, 'Burlete 2 mm') + lab(110, 60, 135, 72, 'Jamba de MDF 15 mm lacada')) },
    { id: 'AT', t: 'Tablero en perfil de aluminio', par: ['aluminio', 'tablero'],
      como: 'Tornillo bristol M6 × 16 a una tuerca martillo que corre por la ranura del perfil 30 × 30; en el tablero, el tornillo pasa por un agujero de 7 mm. Las esquinas del bastidor llevan escuadra 3030A con su tornillería.',
      herr: ['escuadra', 'tornM6'], draw: () => svg(170, 92, '<path fill="url(#uA)" class="o" d="M60 45h30v30H60z M71.5 45v4h-4v4h15v-4h-4v-4z" fill-rule="evenodd"/>' + R(40, 30, 90, 15, 'url(#uW)') + tornillo(75, 26, 56, 'arriba') + R(68, 53, 14, 3.5, '#111', 't') +
        lab(115, 37, 135, 20, 'Tablero 15 mm con laminado') + lab(88, 70, 120, 80, 'Perfil de aluminio 30 × 30') + lab(70, 54.5, 30, 70, 'Tuerca martillo M6') + lab(75, 28, 40, 14, 'Bristol M6 × 16')) },
    { id: 'AP', t: 'Panel de plástico en perfil de aluminio', par: ['aluminio', 'plastico'],
      como: 'El panel de PVC espumado de 10 mm (o el acrílico de 3 mm) se sujeta con clips impresos en PETG que entran a presión en la ranura del perfil, cada 300 mm. Se suelta sin herramientas para limpiar o cambiar el panel.',
      herr: [], draw: () => svg(170, 92, '<path fill="url(#uA)" class="o" d="M40 30h30v30H40z M70 41.5h-4v-4h-4v15h4v-4h4z" fill-rule="evenodd"/>' + '<path fill="url(#uG)" class="o" d="M66 39h18v12H66z"/>' + R(84, 35, 70, 10, 'url(#uP)') +
        lab(55, 45, 30, 75, 'Perfil 30 × 30') + lab(75, 45, 95, 70, 'Clip impreso en PETG') + lab(130, 40, 140, 20, 'PVC espumado 10 mm')) },
    { id: 'AI', t: 'Pieza impresa en perfil de aluminio', par: ['aluminio', 'petg'],
      como: 'Las esquinas, ménsulas y bisagras impresas en PETG llevan un alojamiento hexagonal para la tuerca M6 y se fijan con tornillo bristol a la tuerca martillo de la ranura. Relleno del 40 % y cuatro perímetros en las zonas de tornillo.',
      herr: ['tornM6'], draw: () => svg(170, 92, '<path fill="url(#uA)" class="o" d="M30 40h30v30H30z M60 51.5h-4v-4h-4v15h4v-4h4z" fill-rule="evenodd"/>' + '<path fill="url(#uG)" class="o" d="M60 30h55v50H60z"/>' + tornilloH(55, 112, 52) + R(50, 50, 4, 10, '#111', 't') +
        lab(45, 65, 25, 84, 'Perfil 30 × 30') + lab(90, 35, 110, 18, 'Ménsula o esquina en PETG') + lab(52, 55, 35, 20, 'Tuerca martillo M6') + lab(100, 55, 135, 66, 'Bristol M6')) },
    { id: 'PT', t: 'Acrílico en tablero', par: ['plastico', 'tablero'],
      como: 'El acrílico de 3 mm entra en una ranura de 4 mm × 8 mm fresada en el tablero, sin pegante: así se puede cambiar si se raya. El frente de opal de la caja de luz se apoya en un listón con 20 mm de separación de la tira LED.',
      herr: [], draw: () => svg(170, 92, '<path d="M30 40h110v15H30z M83 40v8h4v-8z" fill="url(#uW)" class="o" fill-rule="evenodd"/>' + R(83, 8, 4, 40, 'url(#uP)') + lab(85, 18, 115, 14, 'Acrílico 3 mm') + lab(85, 46, 50, 72, 'Ranura 4 × 8 mm') + lab(125, 48, 140, 72, 'Tablero 15 mm')) },
    { id: 'PA', t: 'Acrílico en marco de acero', par: ['plastico', 'acero'],
      como: 'El acrílico se apoya en el marco de tubo y se retiene con un perfil de aluminio en L atornillado (autoperforante cada 250 mm), con cinta de espuma entre el acrílico y el acero para que no vibre.',
      herr: ['tornAuto'], draw: () => svg(170, 92, tubo(50, 45, 25.4, 1.2) + R(40, 40, 70, 3, 'url(#uP)') + '<path class="o" d="M75 37h20v3H78v-3" fill="#bbb"/>' + R(50, 43, 25, 2, '#ddd', 't') +
        lab(100, 41.5, 125, 30, 'Acrílico 3 mm') + lab(85, 38, 110, 18, 'Perfil L de retención') + lab(62, 58, 35, 80, 'Tubo 1" cal. 18')) },
    { id: 'LED', t: 'Perfil LED o tira COB en el mueble', par: ['aluminio', 'tablero'],
      como: 'El perfil LED se fija con sus clips de montaje atornillados al tablero (o al tubo, con autoperforante); la tira COB se pega con cinta doble faz en una ranura de 10 × 3 mm para que no se vea. El cable baja por un pasacable al compartimento de la fuente.',
      herr: ['pasacable'], draw: () => svg(170, 92, R(20, 30, 130, 15, 'url(#uW)') + '<path class="o" fill="url(#uA)" d="M70 45h18v9H70z M72 45v7h14v-7z" fill-rule="evenodd"/>' + R(72, 52, 14, 2, '#fff', 't') + R(75, 47, 8, 1.6, '#f5a623', 't') +
        lab(79, 50, 110, 70, 'Perfil de aluminio con difusor') + lab(79, 47.8, 50, 72, 'Cinta LED 12 V') + lab(130, 38, 140, 18, 'Entrepaño o tapa')) },
    { id: 'NIV', t: 'Nivelador en el mueble', par: ['acero', 'tablero'],
      como: 'En el tubo, una tuerca de 5/16" soldada en la tapa inferior; en el tablero, un inserto roscado de 5/16" en el piso del mueble. El nivelador regula ±15 mm para corregir el desnivel del piso.',
      herr: ['nivelador', 'pataNiv'], draw: () => svg(170, 92, tubo(60, 15, 38, 1.2) + R(68, 52, 22, 3, '#111', 't') + R(76, 55, 6, 20, '#7a7a80', 't') + '<path class="o" d="M66 75h26l-3 6H69z" fill="#ddd"/>' + R(10, 85, 150, 0.01, '#fff', 't') +
        lab(79, 30, 110, 20, 'Tubo 1-1/2"') + lab(80, 53.5, 115, 52, 'Tuerca 5/16" soldada') + lab(79, 65, 115, 68, 'Nivelador rosca 5/16"')) },
    { id: 'MU', t: 'Mueble anclado al muro', par: ['muro', 'mueble'],
      como: 'Chazo expansivo de 3/8" × 1-7/8" en el muro (broca de 3/8"), dos por módulo o por cremallera, a través del fondo o de la platina de anclaje. Antes de perforar se verifica que no pasen tuberías ni cables (detector).',
      herr: ['chazo'], draw: () => svg(170, 92, R(10, 10, 45, 75, 'url(#uA)', 'o') + '<text class="lb" x="14" y="16">Muro</text>' + R(55, 30, 6, 40, 'url(#uW)') + R(61, 20, 80, 15, 'url(#uW)') + tornilloH(50, 75, 25) + R(25, 46.5, 30, 7, '#bbb', 't') +
        lab(40, 50, 30, 76, 'Chazo expansivo 3/8"') + lab(58, 60, 90, 70, 'Fondo o platina') + lab(110, 27, 130, 12, 'Mueble')) },
    { id: 'HPL', t: 'Laminado sobre MDF', par: ['tablero', 'tablero'],
      como: 'Pegante de contacto en las dos caras, se deja orear 15 minutos y se prensa con rodillo del centro hacia los bordes; luego se refila con fresadora y se pega el canto.',
      herr: ['contacto'], draw: () => svg(170, 92, R(20, 40, 130, 15, 'url(#uW)') + R(20, 38.4, 130, 1.6, '#111', 't') + lab(100, 39, 125, 20, 'Laminado 0.6 mm + pegante de contacto') + lab(60, 50, 40, 74, 'MDF 15 mm')) },
    { id: 'CU', t: 'Piel curva de MDF', par: ['tablero', 'tablero'],
      como: 'Dos capas de MDF de 5.5 mm encoladas entre sí sobre costillas de MDF de 15 mm cortadas con el radio de la esquina, cada 300 mm de alto; se grapan mientras seca el pegante y se lacan juntas.',
      herr: ['pegante'], draw: () => svg(170, 92, '<path class="o" fill="url(#uW)" d="M40 80V40a40 40 0 0 1 40-40h70v11H80a29 29 0 0 0-29 29v40z"/>' + '<path class="o" fill="#fff" d="M51 80V40a29 29 0 0 1 29-29h70" />' + '<path class="t" d="M45.5 80V40a34.5 34.5 0 0 1 34.5-34.5h70"/>' +
        lab(70, 6, 100, 30, 'Dos capas de MDF 5.5 mm') + lab(46, 60, 20, 86, 'Costilla de MDF 15 mm')) }
  ];
  U.list = UN;
  U.byId = {}; UN.forEach((u) => { U.byId[u.id] = u; });

  /* uniones de un mueble a partir de su despiece y herrajes */
  U.of = function (v, n) {
    const it = L.versions.items[v] && L.versions.items[v][n]; if (!it) return [];
    const mk = new Set(), fam = new Set(), her = new Set();
    it.piezas.forEach((p) => { mk.add(p[0]); if (FAM[p[0]]) fam.add(FAM[p[0]]); });
    it.herrajes.forEach((h) => her.add(h[0])); it.acabados.forEach((a) => her.add(a[0]));
    const out = [], add = (id, why) => { if (!out.find((x) => x.u.id === id)) out.push({ u: U.byId[id], why }); };
    const has = (f) => fam.has(f);
    const tubos = it.piezas.filter((p) => /^tubo/.test(p[0])).reduce((a, p) => a + p[2], 0);
    if (has('tablero') && has('acero')) add('TA', 'Tablero y acero en el mismo mueble');
    if (tubos > 1) add('SO', 'Bastidor de tubo soldado');
    if (has('vidrio') && has('acero')) add('VA', 'Vidrio con marco de acero');
    if (has('vidrio') && has('tablero')) add('VT', 'Vidrio con jambas de tablero');
    if (has('aluminio') && (has('tablero'))) add('AT', 'Perfil de aluminio con tablero');
    if (has('aluminio') && has('plastico')) add('AP', 'Perfil de aluminio con paneles de plástico');
    if (has('aluminio') && has('petg')) add('AI', 'Piezas impresas sobre el perfil');
    if (has('plastico') && has('tablero') && !has('aluminio')) add('PT', 'Acrílico en el tablero');
    if (has('plastico') && has('acero')) add('PA', 'Acrílico en el marco de acero');
    if (mk.has('perfilLed') || mk.has('cob')) add('LED', 'Iluminación integrada');
    if (mk.has('hpl') || her.has('contacto')) add('HPL', 'Tapa con laminado');
    if (mk.has('mdf55')) add('CU', 'Esquinas curvas');
    if (her.has('nivelador') || her.has('pataNiv')) add('NIV', 'Apoyo en el piso');
    if (her.has('chazo')) add('MU', 'Anclado al muro');
    if (has('tablero') && it.piezas.filter((p) => FAM[p[0]] === 'tablero').length > 2 && !has('aluminio')) add('TT', 'Cuerpo de tablero');
    return out;
  };
  /* familias de material del mueble (para la regla de la guía) */
  U.familias = function (v, n) {
    const it = L.versions.items[v] && L.versions.items[v][n]; if (!it) return [];
    const f = new Set(); it.piezas.forEach((p) => { if (FAM[p[0]]) f.add(FAM[p[0]]); });
    return Array.from(f);
  };
})();
