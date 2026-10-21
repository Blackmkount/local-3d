/* ============================================================================
   LA PLANTA (Nota 2, ítems 4, 5 y 12) — bodega de 14.00 × 22.00 m en Villanueva
   (Casanare), con flujo en U: el material entra por el portón, sube por el lado
   izquierdo (corte y fresado), cruza el fondo (curvado, lijado, cabina de lacado
   y secado) y baja por el lado derecho (tapas, luz, armado, empaque) hasta el
   mismo portón. Coordenadas en metros: x desde el muro izquierdo, y desde la
   fachada (portón abajo).
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D;
  const P = (L.planta = {});
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const W = 14, D = 22;
  P.W = W; P.D = D;
  P.portón = [2.0, 6.5];

  /* áreas: id, nombre, rectángulo [x, y, ancho, fondo], estación del proceso */
  const AREAS = [
    { id: 'ALM', t: 'Recepción y almacén de materia prima', r: [0, 0, 2.0, 9.0] },
    { id: 'SIE', t: 'Corte', r: [2.0, 3.0, 4.2, 8.5] },
    { id: 'FRE', t: 'Fresado y perforado', r: [0, 11.5, 6.2, 3.0] },
    { id: 'CUR', t: 'Curvado y encolado', r: [0, 14.5, 4.4, 3.7] },
    { id: 'LIJ', t: 'Lijado', r: [0, 18.2, 4.4, 3.8] },
    { id: 'LAC', t: 'Cabina de lacado', r: [4.4, 17.0, 5.2, 5.0] },
    { id: 'SEC', t: 'Secado', r: [9.6, 17.0, 4.4, 5.0] },
    { id: 'ROV', t: 'Tapas de Rovere y canto', r: [8.6, 12.8, 5.4, 4.2] },
    { id: 'ELE', t: 'Banco eléctrico', r: [10.6, 9.6, 3.4, 3.2] },
    { id: 'ARM', t: 'Armado y premontaje', r: [7.4, 3.4, 6.6, 6.2] },
    { id: 'EMP', t: 'Inspección y empaque', r: [7.4, 0, 3.6, 3.4] },
    { id: 'APT', t: 'Producto terminado y despacho', r: [2.0, 0, 4.5, 3.0] },
    { id: 'HER', t: 'Herramientas y mantenimiento', r: [6.2, 12.8, 2.4, 3.0] },
    { id: 'SER', t: 'Oficina, baño y vestier', r: [11.0, 0, 3.0, 3.4] }
  ];
  /* equipos: nombre, rectángulo, clave de ficha (ítem 6) */
  const EQ = [
    { t: 'Rack vertical de tableros', r: [0.15, 1.0, 0.9, 7.5], k: 'rack' },
    { t: 'Estante de herrajes y cantos', r: [1.15, 0.3, 0.7, 2.4], k: 'estante' },
    { t: 'Mesa de alimentación', r: [3.2, 3.3, 1.8, 2.2], k: 'mesa' },
    { t: 'Sierra de mesa', r: [3.4, 5.6, 1.4, 1.0], k: 'sierra' },
    { t: 'Mesa de salida', r: [3.2, 6.7, 1.8, 2.4], k: 'mesa' },
    { t: 'Ingletadora', r: [2.2, 9.5, 1.2, 0.7], k: 'ingletadora' },
    { t: 'Carros de piezas', r: [5.2, 9.3, 0.9, 1.9], k: 'carro' },
    { t: 'Colector de polvo', r: [0.2, 9.4, 0.8, 0.8], k: 'colector' },
    { t: 'Mesa de router', r: [0.6, 12.2, 1.4, 0.8], k: 'router' },
    { t: 'Taladro de banco', r: [2.6, 12.2, 0.6, 0.5], k: 'taladro' },
    { t: 'Banco de mecanizado', r: [3.6, 12.0, 2.3, 0.9], k: 'banco' },
    { t: 'Banco de curvado y prensas', r: [0.4, 15.2, 3.2, 1.3], k: 'banco' },
    { t: 'Estante de costillas', r: [0.2, 17.2, 2.0, 0.6], k: 'estante' },
    { t: 'Mesa de lijado con aspiración', r: [0.6, 19.0, 3.0, 1.2], k: 'mesaLij' },
    { t: 'Aspiradora de taller', r: [3.6, 20.8, 0.6, 0.6], k: 'aspiradora' },
    { t: 'Caballetes de lacado', r: [5.4, 18.6, 3.2, 1.4], k: 'caballete' },
    { t: 'Extractor de la cabina', r: [6.6, 21.6, 1.0, 0.4], k: 'extractor' },
    { t: 'Gabinete de inflamables', r: [4.6, 21.2, 1.0, 0.6], k: 'gabinete' },
    { t: 'Compresor', r: [9.8, 21.3, 1.0, 0.5], k: 'compresor' },
    { t: 'Racks de secado', r: [10.2, 17.6, 1.2, 3.4], k: 'rackSec' },
    { t: 'Racks de secado', r: [12.2, 17.6, 1.2, 3.4], k: 'rackSec' },
    { t: 'Banco de tapas', r: [9.4, 13.6, 2.6, 1.2], k: 'banco' },
    { t: 'Enchapadora manual', r: [12.4, 13.6, 1.0, 0.6], k: 'enchapadora' },
    { t: 'Prensa de tapas', r: [9.4, 15.4, 2.6, 1.0], k: 'banco' },
    { t: 'Banco eléctrico', r: [11.0, 10.2, 2.6, 0.8], k: 'bancoEle' },
    { t: 'Mesa de premontaje', r: [8.2, 6.2, 3.2, 1.6], k: 'mesa' },
    { t: 'Mesa de premontaje', r: [8.2, 4.0, 3.2, 1.6], k: 'mesa' },
    { t: 'Zona de premontaje en piso', r: [11.8, 4.0, 1.9, 5.2], k: 'piso' },
    { t: 'Mesa de empaque', r: [7.8, 0.6, 2.4, 1.2], k: 'mesa' },
    { t: 'Estantería de producto terminado', r: [2.2, 0.2, 4.0, 0.7], k: 'estante' },
    { t: 'Tablero de herramientas', r: [6.3, 15.5, 2.2, 0.2], k: 'tablero' }
  ];
  P.areas = AREAS; P.eq = EQ;
  const area = (id) => AREAS.find((a) => a.id === id);
  P.area = area;
  const centro = (id) => { const r = area(id).r; return [r[0] + r[2] / 2, r[1] + r[3] / 2]; };
  P.centro = centro;

  /* recorrido del material de un juego y del operario (secuencia de estaciones) */
  P.flujo = ['ALM', 'SIE', 'FRE', 'CUR', 'LIJ', 'LAC', 'SEC', 'ARM', 'EMP', 'APT'];
  P.ciclo = ['LIJ', 'LAC', 'SEC'];                         // sellador y dos manos: el lote da tres vueltas por aquí
  P.flujoAux = [['ALM', 'ROV'], ['ROV', 'ARM'], ['ALM', 'ELE'], ['ELE', 'ARM']];
  /* distancia por los pasillos: recorrido en L entre centros (rectilínea) */
  P.dist = (a, b) => { const p = centro(a), q = centro(b); return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]); };

  /* ------------------------------------------------ matriz de relaciones (planeación sistemática de la distribución) */
  const MOT = { 1: 'Flujo de material', 2: 'Mismo operario', 3: 'Polvo que contamina la laca', 4: 'Solventes inflamables', 5: 'Ruido', 6: 'Supervisión', 7: 'Herramientas compartidas', 8: 'Mismo portón de carga' };
  const REL = {
    'ALM-SIE': ['A', 1], 'ALM-APT': ['I', 8], 'ALM-ROV': ['I', 1], 'ALM-ELE': ['O', 1], 'SIE-FRE': ['E', 1], 'SIE-CUR': ['I', 1], 'SIE-ROV': ['I', 2], 'FRE-CUR': ['E', 1], 'FRE-LIJ': ['I', 1],
    'CUR-LIJ': ['E', 1], 'LIJ-LAC': ['X', 3], 'LAC-SEC': ['A', 1], 'SEC-LIJ': ['E', 1], 'SEC-ARM': ['I', 1], 'ROV-ARM': ['E', 1], 'ELE-ARM': ['E', 1], 'ARM-EMP': ['A', 1], 'EMP-APT': ['A', 1],
    'LAC-SER': ['X', 4], 'SIE-SER': ['X', 5], 'FRE-SER': ['X', 5], 'LAC-ELE': ['X', 4], 'HER-SIE': ['I', 7], 'HER-FRE': ['I', 7], 'HER-ARM': ['O', 7], 'SER-EMP': ['O', 6], 'SER-APT': ['I', 6], 'LIJ-SIE': ['O', 2], 'CUR-LAC': ['U', 0]
  };
  P.motivos = MOT;
  P.rel = (a, b) => REL[a + '-' + b] || REL[b + '-' + a] || ['U', 0];
  P.relIds = ['ALM', 'SIE', 'FRE', 'CUR', 'LIJ', 'LAC', 'SEC', 'ROV', 'ELE', 'ARM', 'EMP', 'APT', 'HER', 'SER'];

  /* ------------------------------------------------ plano a escala 1:100 en A3 (SVG en mm) */
  P.svg = function (opt) {
    opt = opt || {};
    const K = 10, OX = 40, OY = 270;                 // 1 m = 10 mm (1:100); origen abajo a la izquierda
    const X = (x) => +(OX + x * K).toFixed(2), Y = (y) => +(OY - y * K).toFixed(2);
    const R = (r, cls) => '<rect class="' + cls + '" x="' + X(r[0]) + '" y="' + Y(r[1] + r[3]) + '" width="' + (r[2] * K).toFixed(2) + '" height="' + (r[3] * K).toFixed(2) + '"/>';
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="420mm" height="297mm" class="pp" role="img" aria-label="Plano de la planta a escala 1:100"><style>' + P.css + '</style>';
    s += '<defs><marker id="ppA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#c25700"/></marker><marker id="ppB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#0b63c4"/></marker>' +
      '<pattern id="ppX" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2" stroke="#d13b2a" stroke-width=".35"/></pattern></defs>';
    s += '<rect class="paper" width="420" height="297"/><rect class="frame" x="10" y="10" width="400" height="277"/>';
    s += '<text class="title" x="20" y="24">Planta de producción · distribución propuesta</text><text class="subtitle" x="20" y="30.5">Bodega de 14.00 × 22.00 m (308 m²) · Carrera 11 N.º 3-36, Villanueva (Casanare) · flujo en U · escala 1:100</text>';
    // muros
    s += '<path class="wall" fill-rule="evenodd" d="M' + X(-0.2) + ' ' + Y(D + 0.2) + 'H' + X(W + 0.2) + 'V' + Y(-0.2) + 'H' + X(-0.2) + 'Z M' + X(0) + ' ' + Y(D) + 'H' + X(W) + 'V' + Y(0) + 'H' + X(0) + 'Z"/>';
    s += '<rect class="gap" x="' + X(P.portón[0]) + '" y="' + (Y(0) - 0.5) + '" width="' + ((P.portón[1] - P.portón[0]) * K) + '" height="3"/><text class="lbl" x="' + X((P.portón[0] + P.portón[1]) / 2) + '" y="' + (Y(0) + 6.5) + '" text-anchor="middle">Portón de 4.50 m · Carrera 11</text>';
    // cabina cerrada
    const c = area('LAC').r;
    s += '<rect class="cab" x="' + X(c[0]) + '" y="' + Y(c[1] + c[3]) + '" width="' + c[2] * K + '" height="' + c[3] * K + '"/>';
    // áreas
    AREAS.forEach((a) => { s += '<g class="ar" data-ar="' + a.id + '">' + R(a.r, 'area' + (a.id === 'LAC' ? ' haz' : '')) + '<text class="an" x="' + (X(a.r[0]) + 1.6) + '" y="' + (Y(a.r[1] + a.r[3]) + 4.2) + '">' + esc(a.id) + '</text><text class="at" x="' + (X(a.r[0]) + 1.6) + '" y="' + (Y(a.r[1] + a.r[3]) + 7.8) + '">' + esc(a.t) + '</text></g>'; });
    // equipos
    EQ.forEach((e) => { s += R(e.r, 'eq' + (e.k === 'piso' ? ' floor' : '')); });
    // pasillos
    s += '<path class="aisle" d="M' + X(6.8) + ' ' + Y(3.1) + 'V' + Y(12.6) + 'M' + X(6.3) + ' ' + Y(16.8) + 'H' + X(9.6) + '"/>';
    // recorridos
    const ruta = (ids, dx) => { let d = ''; ids.forEach((id, i) => { const p = centro(id), x = p[0] + (dx || 0), y = p[1] + (dx || 0); if (!i) { d += 'M' + X(x) + ' ' + Y(y); return; } const q = centro(ids[i - 1]), px = q[0] + (dx || 0); d += 'L' + X(px) + ' ' + Y(y) + 'L' + X(x) + ' ' + Y(y); }); return d; };
    if (opt.flujo !== false) {
      s += '<path class="flow" d="' + ruta(P.flujo) + '" marker-end="url(#ppA)"/>';
      const a = centro('LIJ'), b = centro('SEC');
      s += '<path class="flow2" d="M' + X(b[0]) + ' ' + Y(b[1] + 1.6) + 'H' + X(a[0]) + '" marker-end="url(#ppA)"/><text class="lbl" x="' + X((a[0] + b[0]) / 2) + '" y="' + (Y(b[1] + 1.6) - 1.2) + '" text-anchor="middle">× 3: sellador, primera y segunda mano</text>';
      P.flujoAux.forEach((f) => { s += '<path class="flow2" d="' + ruta(f, 0.3) + '" marker-end="url(#ppA)"/>'; });
    }
    if (opt.operario !== false) s += '<path class="oper" d="' + ruta(['SER', 'ALM', 'SIE', 'FRE', 'HER', 'ROV', 'ELE', 'ARM', 'EMP', 'SER'], -0.5) + '" marker-end="url(#ppB)"/>';
    // cotas generales
    s += '<g class="dim"><line x1="' + X(0) + '" y1="' + (Y(D) - 8) + '" x2="' + X(W) + '" y2="' + (Y(D) - 8) + '"/><text x="' + X(W / 2) + '" y="' + (Y(D) - 9.5) + '">14.00</text><line x1="' + (X(0) - 10) + '" y1="' + Y(0) + '" x2="' + (X(0) - 10) + '" y2="' + Y(D) + '"/><text transform="translate(' + (X(0) - 11.5) + ' ' + Y(D / 2) + ') rotate(-90)">22.00</text></g>';
    // leyenda y rótulo
    const lx = 205, ly = 50;
    s += '<g class="leg"><text class="h2" x="' + lx + '" y="' + ly + '">Convenciones</text>' +
      '<line class="flow" x1="' + lx + '" y1="' + (ly + 7) + '" x2="' + (lx + 14) + '" y2="' + (ly + 7) + '"/><text class="lbl" x="' + (lx + 17) + '" y="' + (ly + 8) + '">Recorrido del material (juego del mes)</text>' +
      '<line class="flow2" x1="' + lx + '" y1="' + (ly + 13) + '" x2="' + (lx + 14) + '" y2="' + (ly + 13) + '"/><text class="lbl" x="' + (lx + 17) + '" y="' + (ly + 14) + '">Tapas y luz, que se unen en el armado</text>' +
      '<line class="oper" x1="' + lx + '" y1="' + (ly + 19) + '" x2="' + (lx + 14) + '" y2="' + (ly + 19) + '"/><text class="lbl" x="' + (lx + 17) + '" y="' + (ly + 20) + '">Recorrido del operario 1 (corte, tapas, armado)</text>' +
      '<rect class="eq" x="' + lx + '" y="' + (ly + 23) + '" width="14" height="4"/><text class="lbl" x="' + (lx + 17) + '" y="' + (ly + 26) + '">Máquina o mueble de trabajo</text>' +
      '<rect class="cab" x="' + lx + '" y="' + (ly + 29) + '" width="14" height="4"/><text class="lbl" x="' + (lx + 17) + '" y="' + (ly + 32) + '">Cabina cerrada con extracción al exterior</text>' +
      '<line class="aisle" x1="' + lx + '" y1="' + (ly + 37) + '" x2="' + (lx + 14) + '" y2="' + (ly + 37) + '"/><text class="lbl" x="' + (lx + 17) + '" y="' + (ly + 38) + '">Pasillo demarcado de 1.20 m</text></g>';
    s += '<g class="tbl"><text class="h2" x="' + lx + '" y="' + (ly + 52) + '">Áreas</text>' + AREAS.map((a, i) => '<text class="lbl" x="' + lx + '" y="' + (ly + 59 + i * 5.2) + '"><tspan font-weight="700">' + a.id + '</tspan>  ' + esc(a.t) + '</text><text class="lbl" x="' + (lx + 98) + '" y="' + (ly + 59 + i * 5.2) + '" text-anchor="end">' + (a.r[2] * a.r[3]).toFixed(1) + ' m²</text>').join('') + '</g>';
    // escala gráfica
    s += '<g class="scalebar">' + [0, 1, 2, 3, 4].map((i) => '<rect x="' + (lx + i * 10) + '" y="268" width="10" height="1.6" class="' + (i % 2 ? 'sb-w' : 'sb-b') + '"/>').join('') + [0, 1, 2, 3, 4, 5].map((i) => '<text class="lbl" x="' + (lx + i * 10) + '" y="274" text-anchor="middle">' + i + (i === 5 ? ' m' : '') + '</text>').join('') + '</g>';
    const bx = 312, by = 238;
    const cell = (x, y, w, h, l, v) => '<rect class="cell" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/><text class="c-lab" x="' + (x + 1.5) + '" y="' + (y + 3) + '">' + l + '</text><text class="c-val" x="' + (x + 1.5) + '" y="' + (y + h - 2) + '">' + esc(v) + '</text>';
    s += cell(bx, by, 88, 9, 'PROYECTO', 'BlackForge Muebles · planta') + cell(bx, by + 9, 58, 9, 'PLANO', 'Distribución en planta') + cell(bx + 58, by + 9, 30, 9, 'ESCALA', '1:100 en A3') + cell(bx, by + 18, 58, 9, 'UBICACIÓN', 'Villanueva, Casanare') + cell(bx + 58, by + 18, 30, 9, 'FECHA', '17 oct. 2026') + cell(bx, by + 27, 88, 9, 'NOTA', 'Medidas de la bodega estimadas: verificar');
    return s + '</svg>';
  };
  P.css = [
    'text{font-family:Inter,Arial,sans-serif;fill:#111}', '.paper{fill:#fff}.frame{fill:none;stroke:#111;stroke-width:.5}', '.title{font-size:5.6px;font-weight:600}.subtitle{font-size:3px;fill:#555}',
    '.wall{fill:#111}.gap{fill:#fff}', '.area{fill:#fff;stroke:#111;stroke-width:.25;stroke-dasharray:1.2 .8}.area.haz{fill:url(#ppX)}', '.cab{fill:#fff3f1;stroke:#d13b2a;stroke-width:.6}',
    '.an{font-size:3.2px;font-weight:700}.at{font-size:2.1px;fill:#555}', '.eq{fill:#f1f1f1;stroke:#111;stroke-width:.3}.eq.floor{fill:none;stroke-dasharray:.8 .6}',
    '.aisle{fill:none;stroke:#e6b400;stroke-width:1.2;stroke-dasharray:3 1.5;opacity:.8}', '.flow{fill:none;stroke:#c25700;stroke-width:.7;stroke-linejoin:round}.flow2{fill:none;stroke:#c25700;stroke-width:.45;stroke-dasharray:2 1}.oper{fill:none;stroke:#0b63c4;stroke-width:.5;stroke-dasharray:1.2 .9}',
    '.dim line{stroke:#111;stroke-width:.2}.dim text{font-size:2.8px;text-anchor:middle}', '.h2{font-size:3.6px;font-weight:600}.lbl{font-size:2.5px}', '.sb-b{fill:#111}.sb-w{fill:#fff;stroke:#111;stroke-width:.2}',
    '.cell{fill:none;stroke:#111;stroke-width:.25}.c-lab{font-size:1.9px;fill:#666}.c-val{font-size:3px}'
  ].join('').replace(/(^|\})([^{}]+)\{/g, (m, b, sel) => b + sel.split(',').map((x) => '.pp ' + x.trim()).join(',') + '{');
})();
