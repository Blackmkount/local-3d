/* ============================================================================
   PLANO 2D — planta de distribución y mobiliario, en líneas negras sobre blanco,
   como una lámina de arquitectura. La lámina mide 420 × 297 mm (A3 horizontal)
   y el dibujo va a escala 1:50: 1 m = 20 mm. Impresa en A3 al 100 %, se mide
   con escalímetro.

   Coordenadas del plano: X = distancia al muro izquierdo (0–6.00 m),
   D = distancia a la fachada (0–7.00 m). En la lámina, la fachada queda abajo.
   El mobiliario fabricado cambia con la versión (A, B o C).
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const PL = (L.plan = {});
  const K = 20, OX = 56, OY = 222;                     // mm por metro y origen (X = 0, D = 0) en la lámina
  const sx = (X) => +(OX + X * K).toFixed(2), sy = (D) => +(OY - D * K).toFixed(2);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f2 = (v) => v.toFixed(2);
  const cop = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  /* -------------------------------------------------------- primitivas */
  const rect = (X0, D0, X1, D1, cls) => '<rect class="' + cls + '" x="' + sx(Math.min(X0, X1)) + '" y="' + sy(Math.max(D0, D1)) + '" width="' + f2(Math.abs(X1 - X0) * K) + '" height="' + f2(Math.abs(D1 - D0) * K) + '"/>';
  const line = (X0, D0, X1, D1, cls) => '<line class="' + cls + '" x1="' + sx(X0) + '" y1="' + sy(D0) + '" x2="' + sx(X1) + '" y2="' + sy(D1) + '"/>';
  const poly = (pts, cls, close) => '<' + (close === false ? 'polyline' : 'polygon') + ' class="' + cls + '" points="' + pts.map((p) => sx(p[0]) + ',' + sy(p[1])).join(' ') + '"/>';
  const circle = (X, D, r, cls) => '<circle class="' + cls + '" cx="' + sx(X) + '" cy="' + sy(D) + '" r="' + f2(r * K) + '"/>';
  const text = (X, D, t, cls, extra) => '<text class="' + cls + '" x="' + sx(X) + '" y="' + sy(D) + '"' + (extra || '') + '>' + esc(t) + '</text>';
  /* contorno con esquinas redondeadas o en chaflán, en coordenadas del plano.
     c: { [esquina]: [radio, 'r' | 'c'] }, esquinas: xd = X menor y D mayor, etc. */
  function shape(X0, D0, X1, D1, c) {
    const P = [];
    // recorrido: (X0,D1) → (X1,D1) → (X1,D0) → (X0,D0); cada esquina va del ángulo a0 al a1 alrededor de su centro
    [['xD', X0, D1, 1, -1, 180, 90], ['XD', X1, D1, -1, -1, 90, 0], ['Xd', X1, D0, -1, 1, 0, -90], ['xd', X0, D0, 1, 1, -90, -180]].forEach((q) => {
      const k = (c && c[q[0]]) || [0, 'r'], r = k[0];
      if (!r) { P.push([q[1], q[2]]); return; }
      const cx = q[1] + q[3] * r, cy = q[2] + q[4] * r, n = k[1] === 'c' ? 1 : 8;
      for (let i = 0; i <= n; i++) { const a = (q[5] + (q[6] - q[5]) * i / n) * Math.PI / 180; P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    });
    return P;
  }

  /* ------------------------------------------------------------ cotas */
  function dim(X0, D0, X1, D1, label, off, cls) {
    // cota entre dos puntos con su texto; off desplaza la línea en mm perpendicular
    const x0 = sx(X0), y0 = sy(D0), x1 = sx(X1), y1 = sy(D1), dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len, o = off || 0;
    const a = [x0 + nx * o, y0 + ny * o], b = [x1 + nx * o, y1 + ny * o];
    const tick = (p) => '<line class="d-tick" x1="' + (p[0] - 1.1).toFixed(2) + '" y1="' + (p[1] + 1.1).toFixed(2) + '" x2="' + (p[0] + 1.1).toFixed(2) + '" y2="' + (p[1] - 1.1).toFixed(2) + '"/>';
    const ext = (p, q) => o ? '<line class="d-ext" x1="' + p[0].toFixed(2) + '" y1="' + p[1].toFixed(2) + '" x2="' + (q[0] + nx * Math.sign(o) * 1.2).toFixed(2) + '" y2="' + (q[1] + ny * Math.sign(o) * 1.2).toFixed(2) + '"/>' : '';
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const rot = Math.abs(ang) > 90 ? ang + 180 : ang;
    return '<g class="' + (cls || 'dim') + '">' + ext([x0, y0], a) + ext([x1, y1], b) + '<line class="d-line" x1="' + a[0].toFixed(2) + '" y1="' + a[1].toFixed(2) + '" x2="' + b[0].toFixed(2) + '" y2="' + b[1].toFixed(2) + '"/>' + tick(a) + tick(b) +
      '<text class="d-txt" transform="translate(' + mx.toFixed(2) + ' ' + my.toFixed(2) + ') rotate(' + rot.toFixed(1) + ')" y="-1">' + esc(label) + '</text></g>';
  }

  /* -------------------------------------------------- arquitectura del local */
  function arquitectura(ver) {
    let s = '<g class="arq">';
    // muros (cortados): relleno negro
    s += rect(-0.15, 0, 0, 7.15, 'wall') + rect(6, 0, 6.15, 7.15, 'wall') + rect(-0.15, 7, 6.15, 7.15, 'wall');
    s += rect(-0.15, -0.30, 0.6, 0, 'wall') + rect(5.4, -0.30, 6.15, 0, 'wall');                  // pilares de fachada
    // división sala / trastienda: muro de listones, vidrio fijo, puerta y columna
    s += rect(0, 5.5, 3.9, 5.6, 'wall-l');
    for (let x = 0.06; x < 3.9; x += 0.12) s += line(x, 5.5, x, 5.6, 'slat');
    s += rect(5.85, 5.5, 6.0, 5.6, 'wall');
    // umbral de la fachada y vano de acceso
    s += line(0.6, -0.02, 5.4, -0.02, 'thin') + line(0.6, -0.30, 5.4, -0.30, 'hidden');
    s += '</g>';
    return s;
  }
  /* mampara (15) según la versión */
  const arco = (hx, hy, r, x1, y1, sweep) => '<path class="swing" d="M' + sx(hx) + ' ' + sy(hy + r) + ' A ' + (r * K) + ' ' + (r * K) + ' 0 0 ' + sweep + ' ' + sx(x1) + ' ' + sy(y1) + '"/>';
  function mampara(ver) {
    let s = '';
    if (ver === 'C') {
      s += rect(3.9, 5.535, 4.95, 5.565, 'furn') + line(3.92, 5.55, 4.93, 5.55, 'thin');
      s += rect(4.96, 5.43, 5.86, 5.465, 'furn');                                      // puerta corrediza, del lado de la sala
      s += line(3.95, 5.395, 5.95, 5.395, 'hidden');                                   // riel de granero (sobre la cabeza)
      s += '<path class="thin" d="M' + sx(5.35) + ' ' + sy(5.33) + ' L' + sx(4.45) + ' ' + sy(5.33) + ' m2 -1.2 l-2 1.2 l2 1.2"/>';
      s += text(4.9, 5.2, 'corrediza', 'note');
    } else if (ver === 'A') {
      // fijo en cuadrícula de tubo y puerta batiente a la derecha, hacia la trastienda
      s += rect(3.9, 5.53, 4.95, 5.57, 'furn') + line(3.95, 5.55, 4.9, 5.55, 'thin');
      s += rect(5.83, 5.6, 5.86, 6.48, 'furn') + arco(5.845, 5.6, 0.88, 4.965, 5.6, 0);
    } else {
      // vidrio sin marco entre jambas lacadas; puerta a la izquierda, lejos del laboratorio
      s += rect(3.9, 5.5, 3.96, 5.62, 'furn') + rect(4.88, 5.545, 5.85, 5.555, 'glass') + line(4.88, 5.55, 5.85, 5.55, 'thin');
      s += rect(3.96, 5.6, 3.975, 6.515, 'furn') + arco(3.968, 5.6, 0.915, 4.88, 5.6, 1);
    }
    return s;
  }

  /* --------------------------------------------- mobiliario por elemento
     cada función devuelve el SVG del elemento; wall = elemento colgado (línea discontinua) */
  const postes = (pts, s) => pts.map((p) => rect(p[0] - s / 2, p[1] - s / 2, p[0] + s / 2, p[1] + s / 2, 'post')).join('');
  const sq = (X, D, a) => rect(X - a / 2, D - a / 2, X + a / 2, D + a / 2, 'equip') + line(X - a / 2, D - a / 2, X + a / 2, D + a / 2, 'thin') + line(X - a / 2, D + a / 2, X + a / 2, D - a / 2, 'thin');
  const maceta = (p) => rect(p[0] - 0.2, p[1] - 0.2, p[0] + 0.2, p[1] + 0.2, 'furn') + circle(p[0], p[1], 0.13, 'thin') + line(p[0] - 0.09, p[1], p[0] + 0.09, p[1], 'thin') + line(p[0], p[1] - 0.09, p[0], p[1] + 0.09, 'thin');
  const bodega = (X) => rect(X, 6.6, X + 0.9, 7.0, 'furn') + rect(X + 0.9, 6.6, X + 1.8, 7.0, 'furn') + line(X, 6.6, X + 0.9, 7.0, 'thin') + line(X + 0.9, 6.6, X + 1.8, 7.0, 'thin');
  const silla = (X, D) => circle(X, D, 0.25, 'furn') + line(X - 0.2, D - 0.22, X + 0.2, D - 0.22, 'thin');
  const modulos = (X0, D0, X1, D1, n, alongD) => { let s = ''; for (let i = 1; i < n; i++) s += alongD ? line(X0, D0 + (D1 - D0) * i / n, X1, D0 + (D1 - D0) * i / n, 'thin') : line(X0 + (X1 - X0) * i / n, D0, X0 + (X1 - X0) * i / n, D1, 'thin'); return s; };
  const pantallas = { 19: () => rect(-0.12, -0.39, 0.57, -0.345, 'wall-el'), 20: () => rect(5.43, -0.39, 6.12, -0.345, 'wall-el') };
  /* C · la distribución del plano original */
  const FURN_C = Object.assign({
    1: () => rect(0, 0.5, 0.08, 1.45, 'wall-el'),
    2: () => rect(0, 1.6, 0.4, 2.8, 'furn') + rect(0, 2.8, 0.4, 4.0, 'furn') + postes([[0.015, 1.615], [0.385, 1.615], [0.015, 2.8], [0.385, 2.8], [0.015, 3.985], [0.385, 3.985]], 0.03) + line(0.06, 1.63, 0.06, 3.97, 'hidden'),
    3: () => poly(shape(1.5, 0.8, 3.5, 1.9, { xD: [0.25, 'r'], XD: [0, 'r'], Xd: [0.25, 'r'], xd: [0.25, 'r'] }), 'furn') + poly(shape(1.6, 0.9, 3.4, 1.8, { xD: [0.16, 'r'], Xd: [0.16, 'r'], xd: [0.16, 'r'] }), 'hidden') + poly(shape(1.506, 0.806, 3.494, 1.894, { xD: [0.244, 'r'], Xd: [0.244, 'r'], xd: [0.244, 'r'] }), 'thin'),
    4: () => poly(shape(2.3, 1.9, 3.5, 2.5, { xD: [0.18, 'r'], XD: [0.18, 'r'] }), 'furn'),
    5: () => rect(1.5, 3.5, 3.3, 4.2, 'furn'),
    6: () => [[1.95, 3.24], [2.4, 3.24], [2.85, 3.24], [3.58, 3.85]].map((p) => circle(p[0], p[1], 0.175, 'furn')).join(''),
    7: () => rect(0.6, 4.9, 3.8, 5.5, 'furn') + modulos(0.6, 4.9, 3.8, 5.5, 4) + postes([0, 0.8, 1.6, 2.4, 3.2].flatMap((x) => [[0.6 + x + (x === 3.2 ? -0.02 : 0.02), 4.92], [0.6 + x + (x === 3.2 ? -0.02 : 0.02), 5.48]]), 0.03),
    8: () => [1.0, 1.8, 2.6, 3.4].map((x) => sq(x, 5.195, 0.39)).join(''),
    9: () => line(0.6, 5.47, 3.8, 5.47, 'wall-el') + line(0.6, 5.44, 3.8, 5.44, 'wall-el'),
    10: () => rect(5.5, 2.0, 6.0, 5.0, 'furn') + modulos(5.5, 2.0, 6.0, 5.0, 5, true) + line(5.52, 2.0, 5.52, 5.0, 'thin'),
    11: () => rect(5.96, 2.75, 6.0, 4.95, 'wall-el'),
    12: () => rect(5.85, 2.1, 6.0, 2.5, 'wall-el'),
    13: () => rect(5.65, 0.3, 6.0, 1.5, 'furn') + postes([[5.665, 0.315], [5.985, 0.315], [5.665, 1.485], [5.985, 1.485]], 0.03),
    14: () => [[0.45, 0.30], [5.75, 1.76], [0.3, 5.2]].map(maceta).join(''),
    15: () => mampara('C'),
    16: () => bodega(3.2),
    17: () => rect(0.2, 6.4, 1.4, 7.0, 'furn'),
    18: () => silla(0.82, 6.02)
  }, pantallas);
  /* A · taller a la vista: impresoras en la fachada */
  const FURN_A = Object.assign({
    1: () => rect(2.175, 5.42, 3.125, 5.5, 'wall-el'),
    2: () => rect(5.6, 1.95, 6.0, 3.15, 'furn') + rect(5.6, 3.15, 6.0, 4.35, 'furn') + line(5.62, 1.95, 5.62, 4.35, 'thin') + postes([[5.9875, 1.975], [5.9875, 3.15], [5.9875, 4.325]], 0.025),
    3: () => rect(2.2, 3.8, 3.8, 4.5, 'furn') + rect(2.31, 3.91, 3.69, 4.39, 'hidden') + postes([[2.29, 3.89], [3.71, 3.89], [2.29, 4.41], [3.71, 4.41]], 0.038),
    4: () => rect(3.85, 0.3, 4.35, 0.8, 'furn') + rect(3.91, 0.36, 4.29, 0.74, 'thin'),
    5: () => rect(1.2, 1.65, 3.4, 2.35, 'furn') + line(1.33, 1.71, 1.33, 2.29, 'hidden') + line(3.27, 1.71, 3.27, 2.29, 'hidden'),
    6: () => [1.5, 2.05, 2.6, 3.15].map((x) => circle(x, 2.62, 0.175, 'furn')).join(''),
    7: () => rect(0.65, 0.25, 3.85, 0.85, 'furn') + modulos(0.65, 0.25, 3.85, 0.85, 4) + line(0.67, 0.27, 3.83, 0.27, 'thin') + postes([0, 0.8, 1.6, 2.4, 3.175].flatMap((x) => [[0.6625 + x, 0.29], [0.6625 + x, 0.81]]), 0.03),
    8: () => [1.05, 1.85, 2.65, 3.45].map((x) => sq(x, 0.55, 0.39)).join(''),
    9: () => rect(0.65, 0.42, 3.85, 0.67, 'wall-el'),
    10: () => rect(0, 1.2, 0.5, 4.2, 'furn') + modulos(0, 1.2, 0.5, 4.2, 5, true) + line(0.48, 1.2, 0.48, 4.2, 'thin'),
    11: () => rect(0, 1.2, 0.05, 4.2, 'wall-el'),
    12: () => rect(5.85, 4.6, 6.0, 5.0, 'wall-el'),
    13: () => rect(5.6, 0.25, 6.0, 1.45, 'furn') + postes([[5.613, 0.263], [5.987, 0.263], [5.613, 1.437], [5.987, 1.437]], 0.025),
    14: () => [[0.32, 0.45], [5.78, 1.7], [0.32, 4.75]].map(maceta).join(''),
    15: () => mampara('A'),
    16: () => bodega(0.15),
    17: () => rect(2.3, 6.4, 3.5, 7.0, 'furn'),
    18: () => silla(2.9, 6.02)
  }, pantallas);
  /* B · galería: recorrido en U */
  const FURN_B = Object.assign({
    1: () => rect(2.525, 5.42, 3.475, 5.5, 'wall-el'),
    2: () => rect(0, 0.6, 0.35, 4.8, 'furn') + modulos(0, 0.6, 0.35, 4.8, 3, true) + line(0.33, 0.6, 0.33, 4.8, 'hidden'),
    3: () => poly(shape(2.4, 2.2, 3.6, 2.8, { Xd: [0.2, 'r'], xd: [0.2, 'r'] }), 'furn') + poly(shape(2.5, 1.7, 3.5, 2.2, { Xd: [0.22, 'r'], xd: [0.22, 'r'] }), 'furn') + poly(shape(2.6, 1.2, 3.4, 1.7, { Xd: [0.3, 'r'], xd: [0.3, 'r'] }), 'furn'),
    4: () => [[2.73, 0.67, 0.17], [3.02, 0.85, 0.17], [3.28, 0.63, 0.15]].map((c) => circle(c[0], c[1], c[2], 'furn') + circle(c[0], c[1], c[2] - 0.04, 'hidden')).join(''),
    5: () => rect(2.1, 2.8, 3.9, 3.5, 'furn') + line(2.12, 3.2, 3.88, 3.2, 'hidden'),
    6: () => [2.33, 2.78, 3.23, 3.68].map((x) => circle(x, 3.78, 0.175, 'furn')).join(''),
    7: () => rect(5.4, 2.3, 6.0, 5.5, 'furn') + modulos(5.4, 2.3, 6.0, 5.5, 4, true) + rect(5.36, 2.282, 6.0, 2.3, 'furn') + rect(5.36, 5.5, 6.0, 5.518, 'furn') + rect(5.36, 2.282, 6.0, 5.518, 'wall-el'),
    8: () => [5.1, 4.3, 3.5, 2.7].map((d) => sq(5.7, d, 0.39)).join(''),
    9: () => rect(5.75, 2.3, 6.0, 5.5, 'wall-el'),
    10: () => rect(0.6, 5.0, 3.6, 5.5, 'furn') + modulos(0.6, 5.0, 3.6, 5.5, 5) + line(0.6, 5.02, 3.6, 5.02, 'thin'),
    11: () => rect(0.6, 5.46, 2.2, 5.5, 'wall-el'),
    12: () => rect(5.85, 1.7, 6.0, 2.1, 'wall-el'),
    13: () => rect(5.6, 0.25, 6.0, 1.45, 'furn') + line(5.6, 0.8, 6.0, 0.8, 'hidden'),
    14: () => [[0.32, 0.32], [3.75, 5.25], [0.32, 5.2]].map(maceta).join(''),
    15: () => mampara('B'),
    16: () => bodega(0.2),
    17: () => rect(4.7, 6.4, 5.9, 7.0, 'furn'),
    18: () => silla(5.3, 6.02)
  }, pantallas);
  const FURN = { A: FURN_A, B: FURN_B, C: FURN_C };
  /* posición del número de cada elemento (X, D) */
  const NUMS = {
    C: { 1: [0.32, 0.98], 2: [0.62, 2.8], 3: [2.35, 1.3], 4: [2.95, 2.22], 5: [2.4, 3.85], 6: [1.55, 3.0], 7: [2.2, 4.68], 8: [1.8, 5.2], 9: [0.38, 5.72], 10: [5.22, 3.5], 11: [5.72, 4.5], 12: [5.62, 2.3], 13: [5.38, 0.9], 14: [0.45, 0.30], 15: [4.45, 5.95], 16: [4.1, 6.4], 17: [0.8, 6.7], 18: [1.25, 6.02] },
    A: { 1: [2.65, 5.22], 2: [5.33, 3.65], 3: [3.0, 4.15], 4: [4.1, 1.05], 5: [2.3, 2.0], 6: [3.55, 2.62], 7: [2.25, 1.08], 8: [2.25, 0.55], 9: [0.62, 0.95], 10: [0.78, 1.55], 11: [0.78, 3.9], 12: [5.6, 4.8], 13: [5.33, 0.85], 14: [0.32, 0.45], 15: [4.45, 5.95], 16: [1.05, 6.4], 17: [2.9, 6.72], 18: [3.35, 6.02] },
    B: { 1: [3.0, 5.25], 2: [0.62, 2.7], 3: [3.0, 1.95], 4: [2.35, 0.8], 5: [3.0, 3.02], 6: [1.95, 3.78], 7: [5.12, 3.9], 8: [5.7, 3.1], 9: [5.12, 4.7], 10: [3.3, 4.75], 11: [1.4, 4.75], 12: [5.6, 1.9], 13: [5.33, 0.85], 14: [0.32, 0.32], 15: [4.6, 5.35], 16: [1.1, 6.4], 17: [5.3, 6.72], 18: [5.3, 6.02] }
  };
  const PANT = { 19: [-0.55, -0.32], 20: [6.55, -0.32] };

  function cotas(ver) {
    let s = '<g class="cotas">';
    s += dim(0, -0.30, 6, -0.30, '6.00', 26) + dim(-0.15, -0.30, 0.6, -0.30, '0.60', 17) + dim(0.6, -0.30, 5.4, -0.30, '4.80', 17) + dim(5.4, -0.30, 6.15, -0.30, '0.60', 17);
    s += ver === 'B' ? dim(0, 7.15, 3.9, 7.15, '3.90', -9) + dim(3.9, 7.15, 4.88, 7.15, '0.98', -9) + dim(4.88, 7.15, 5.85, 7.15, '0.97', -9) + dim(5.85, 7.15, 6.0, 7.15, '0.15', -9)
      : dim(0, 7.15, 3.9, 7.15, '3.90', -9) + dim(3.9, 7.15, 4.95, 7.15, '1.05', -9) + dim(4.95, 7.15, 5.85, 7.15, '0.90', -9) + dim(5.85, 7.15, 6.0, 7.15, '0.15', -9);
    s += dim(-0.15, 0, -0.15, 7, '7.00', -20) + dim(-0.15, 0, -0.15, 5.5, '5.50', -10) + dim(-0.15, 5.5, -0.15, 5.6, '0.10', -10) + dim(-0.15, 5.6, -0.15, 7, '1.40', -10);
    const der = { C: [[0, 0.3], [0.3, 1.5], [1.5, 2.0], [2.0, 5.0], [5.0, 5.5]], A: [[0, 0.25], [0.25, 1.45], [1.45, 1.95], [1.95, 4.35], [4.35, 5.5]], B: [[0, 0.25], [0.25, 1.45], [1.45, 2.3], [2.3, 5.5]] }[ver];
    der.forEach((r) => { s += dim(6.15, r[0], 6.15, r[1], (r[1] - r[0]).toFixed(2), 10); });
    s += '</g><g class="pasos">';
    const pasos = {
      C: [[3.5, 2.2, 5.5, 2.2, '2.00'], [0.4, 1.35, 1.5, 1.35, '1.10'], [3.05, 2.5, 3.05, 3.5, '1.00'], [2.6, 4.2, 2.6, 4.9, '0.70'], [2.5, 0, 2.5, 0.8, '0.80'], [0, 3.7, 1.5, 3.7, '1.50']],
      A: [[2.0, 0.85, 2.0, 1.65, '0.80'], [2.0, 2.8, 2.0, 3.8, '1.00'], [3.0, 4.5, 3.0, 5.5, '1.00'], [0.5, 1.9, 1.2, 1.9, '0.70'], [3.8, 4.1, 5.6, 4.1, '1.80'], [4.35, 0.55, 5.6, 0.55, '1.25']],
      B: [[0.35, 2.5, 2.4, 2.5, '2.05'], [3.6, 2.5, 5.4, 2.5, '1.80'], [3.0, 3.96, 3.0, 5.0, '1.04'], [0.35, 3.15, 2.1, 3.15, '1.75'], [3.9, 3.15, 5.4, 3.15, '1.50'], [0.35, 0.95, 2.56, 0.95, '2.21']]
    }[ver];
    pasos.forEach((p) => { s += dim(p[0], p[1], p[2], p[3], p[4], 0, 'dim dim-in'); });
    s += '</g>';
    return s;
  }
  function zonas(ver) {
    const z = { C: [4.35, 0.62, 2.4], A: [4.45, 2.85, 4.4], B: [1.3, 1.45, 2.6] }[ver];
    return '<g class="zonas">' + text(z[0], z[1], 'SALA DE VENTAS', 'zone') + text(z[0], z[1] - 0.12, '6.00 × 5.50', 'zone-sub') +
      text(z[2], 6.25, 'TRASTIENDA · TALLER', 'zone') + text(z[2], 6.13, '6.00 × 1.40', 'zone-sub') +
      text(3.25, -0.6, 'ACCESO', 'zone') + text(3.25, -0.72, 'desde el pasillo del centro comercial', 'zone-sub') +
      '<path class="arrow" d="M' + sx(1.9) + ' ' + sy(-0.82) + ' V' + sy(-0.4) + ' m-1.3 2.4 l1.3 -2.4 l1.3 2.4"/></g>';
  }

  /* --------------------------------------------------------- lámina completa */
  PL.svg = function (ver, opt) {
    opt = opt || {};
    const D = L.data, V = L.versions, vinfo = V.list.find((x) => x.id === ver);
    const calc = V.calc(ver);
    const vit = (d) => (d.origen === 'fabrica' && V.items[ver][d.n]) || null;
    const item = (d) => (vit(d) ? vit(d).name : d.name);
    const total = D.presupuesto.comprado + calc.total;
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="420mm" height="297mm" class="sheet" role="img" aria-label="Planta de distribución y mobiliario, versión ' + ver + ', escala 1:50">';
    s += '<style>' + PL.css + '</style>';
    s += '<rect class="paper" x="0" y="0" width="420" height="297"/>';
    s += '<rect class="frame" x="10" y="10" width="400" height="277"/>';
    s += '<text class="title" x="20" y="24">Planta de distribución y mobiliario</text>';
    s += '<text class="subtitle" x="20" y="30.5">Versión ' + ver + ' · ' + esc(vinfo.nombre) + ' — ' + esc(vinfo.titulo) + '. Local de 6.00 × 7.00 m, medidas en metros.</text>';
    // dibujo
    s += '<g class="draw">';
    s += arquitectura(ver);
    s += '<g class="mob">';
    D.items.forEach((d) => {
      const f = FURN[ver][d.n]; if (!f) return;
      s += '<g class="el" data-n="' + d.n + '" tabindex="0" role="button" aria-label="' + esc(d.n + '. ' + item(d)) + '"><title>' + esc(d.n + ' · ' + item(d)) + '</title>' + f(ver) + '</g>';
    });
    s += '</g>';
    if (opt.cotas !== false) s += cotas(ver);
    s += zonas(ver);
    if (opt.nums !== false) {
      s += '<g class="nums">';
      const NUM = Object.assign({}, NUMS[ver], PANT);
      Object.keys(NUM).forEach((n) => { const p = NUM[n]; s += '<g class="num" data-n="' + n + '"><circle cx="' + sx(p[0]) + '" cy="' + sy(p[1]) + '" r="2.6"/><text x="' + sx(p[0]) + '" y="' + (sy(p[1]) + 0.95) + '">' + n + '</text></g>'; });
      s += '</g>';
    }
    s += '</g>';
    // escala gráfica
    const bx = 30, by = 272;
    s += '<g class="scalebar"><text class="lbl" x="' + bx + '" y="' + (by - 4) + '">Escala gráfica</text>';
    for (let i = 0; i < 3; i++) s += '<rect x="' + (bx + i * K) + '" y="' + by + '" width="' + K + '" height="1.6" class="' + (i % 2 ? 'sb-w' : 'sb-b') + '"/>';
    s += [0, 1, 2, 3].map((i) => '<text class="sb-t" x="' + (bx + i * K) + '" y="' + (by + 5.2) + '">' + i + (i === 3 ? ' m' : '') + '</text>').join('') + '</g>';
    // leyenda
    const lx = 112, ly = 268;
    s += '<g class="legend">' +
      '<rect class="furn" x="' + lx + '" y="' + ly + '" width="8" height="4"/><text class="lbl" x="' + (lx + 10) + '" y="' + (ly + 3.4) + '">Mueble de piso</text>' +
      '<rect class="wall-el" x="' + (lx + 38) + '" y="' + ly + '" width="8" height="4"/><text class="lbl" x="' + (lx + 48) + '" y="' + (ly + 3.4) + '">Elemento en muro o en altura</text>' +
      '<rect class="wall" x="' + (lx + 98) + '" y="' + ly + '" width="8" height="4"/><text class="lbl" x="' + (lx + 108) + '" y="' + (ly + 3.4) + '">Muro cortado</text>' +
      '</g>';
    // cuadro de mobiliario
    const tx = 222, ty = 40, rh = 7.15;
    s += '<g class="table"><text class="h2" x="' + tx + '" y="' + ty + '">Cuadro de mobiliario</text>';
    s += '<text class="th" x="' + tx + '" y="' + (ty + 7) + '">N.º</text><text class="th" x="' + (tx + 9) + '" y="' + (ty + 7) + '">ELEMENTO</text><text class="th" x="' + (tx + 112) + '" y="' + (ty + 7) + '">L × F × H (m)</text><text class="th r" x="' + (tx + 178) + '" y="' + (ty + 7) + '">CANT.</text>';
    s += '<line class="rule" x1="' + tx + '" y1="' + (ty + 9) + '" x2="' + (tx + 178) + '" y2="' + (ty + 9) + '"/>';
    D.items.forEach((d, i) => {
      const y = ty + 9 + (i + 1) * rh - 1.9, nm = item(d);
      s += '<g class="row" data-n="' + d.n + '"><text class="td num-c" x="' + (tx + 2.6) + '" y="' + y + '">' + d.n + '</text><text class="td" x="' + (tx + 9) + '" y="' + y + '">' + esc(nm.length > 58 ? nm.slice(0, 56) + '…' : nm) + '</text>' +
        '<text class="td mono" x="' + (tx + 112) + '" y="' + y + '">' + esc(((vit(d) && vit(d).dims) || d.dims).replace(' m', '').replace(/ de frente.*$/, '').replace(/ \(.*$/, '')) + '</text><text class="td r" x="' + (tx + 178) + '" y="' + y + '">' + esc(((vit(d) && vit(d).cant) || d.cant).split(' ')[0]) + '</text>' +
        (vit(d) ? '<text class="td tag" x="' + (tx + 105) + '" y="' + y + '">' + ver + '</text>' : '') + '</g>';
      s += '<line class="rule-t" x1="' + tx + '" y1="' + (ty + 9 + (i + 1) * rh) + '" x2="' + (tx + 178) + '" y2="' + (ty + 9 + (i + 1) * rh) + '"/>';
    });
    s += '</g>';
    // cajetín
    const cx = 222, cy = 202, cw = 178;
    const cell = (x, y, w, hh, lab, val, cls) => '<rect class="cell" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '"/><text class="c-lab" x="' + (x + 2) + '" y="' + (y + 3.6) + '">' + esc(lab) + '</text><text class="c-val ' + (cls || '') + '" x="' + (x + 2) + '" y="' + (y + hh - 2.4) + '">' + esc(val) + '</text>';
    s += '<g class="block">' +
      cell(cx, cy, cw, 13, 'PROYECTO', 'BlackForge · Local de exhibición y taller de impresión 3D', 'big') +
      cell(cx, cy + 13, cw * 0.62, 11, 'PLANO', 'Planta de distribución y mobiliario') + cell(cx + cw * 0.62, cy + 13, cw * 0.38, 11, 'LÁMINA', 'A-01 · 1 de 1') +
      cell(cx, cy + 24, cw * 0.62, 11, 'VERSIÓN DEL MOBILIARIO', ver + ' · ' + vinfo.nombre + ' — ' + vinfo.titulo) + cell(cx + cw * 0.62, cy + 24, cw * 0.38, 11, 'ESCALA', '1:50 en A3 horizontal') +
      cell(cx, cy + 35, cw * 0.31, 11, 'UNIDADES', 'metros') + cell(cx + cw * 0.31, cy + 35, cw * 0.31, 11, 'FECHA', '16 oct. 2026') + cell(cx + cw * 0.62, cy + 35, cw * 0.38, 11, 'MATERIALES Y EQUIPOS', cop(total) + ' COP') +
      '<text class="c-note" x="' + cx + '" y="' + (cy + 52) + '">Medidas estimadas desde la imagen del local (frente de 6.00 m); verificar en sitio antes de pedir el corte.</text>' +
      '<text class="c-note" x="' + cx + '" y="' + (cy + 56.5) + '">Cada versión ordena el local a su manera, con pasos de al menos 1.00 m para el público y 0.70 m de servicio.</text>' +
      '</g>';
    s += '</svg>';
    return s;
  };

  /* estilo de la lámina: va dentro del SVG para que la descarga y la impresión se vean igual */
  PL.css = [
    'text{font-family:Inter,"Helvetica Neue",Arial,sans-serif;fill:#111}',
    '.paper{fill:#fff}.frame{fill:none;stroke:#111;stroke-width:.5}',
    '.title{font-size:6.2px;font-weight:600;letter-spacing:.01em}.subtitle{font-size:2.9px;fill:#444}',
    '.wall{fill:#111;stroke:#111;stroke-width:.2}.wall-l{fill:#fff;stroke:#111;stroke-width:.35}.slat{stroke:#111;stroke-width:.12}',
    '.thin{fill:none;stroke:#111;stroke-width:.13}.hidden{fill:none;stroke:#111;stroke-width:.15;stroke-dasharray:1.1 .7}',
    '.glass{fill:#fff;stroke:#111;stroke-width:.18}.swing{fill:none;stroke:#111;stroke-width:.13;stroke-dasharray:.8 .5}',
    '.furn{fill:#fff;stroke:#111;stroke-width:.32;stroke-linejoin:round}.equip{fill:#f1f1f1;stroke:#111;stroke-width:.25}',
    '.wall-el{fill:none;stroke:#111;stroke-width:.25;stroke-dasharray:1.3 .8}.post{fill:#111;stroke:none}',
    '.el{cursor:pointer}.el:hover .furn,.el.is-hl .furn{fill:#f3f3f3;stroke-width:.55}.el:hover .wall-el,.el.is-hl .wall-el{stroke-width:.45}',
    '.el:focus{outline:none}.el:focus-visible .furn{stroke-width:.6}',
    '.d-line,.d-ext{stroke:#111;stroke-width:.13}.d-tick{stroke:#111;stroke-width:.32}.d-txt{font-size:2.6px;text-anchor:middle;font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace}',
    '.dim-in .d-line{stroke-dasharray:.6 .4}.dim-in .d-txt{font-size:2.3px}',
    '.zone{font-size:2.7px;font-weight:600;letter-spacing:.12em;text-anchor:middle}.zone-sub{font-size:2.2px;fill:#444;text-anchor:middle}',
    '.arrow{fill:none;stroke:#111;stroke-width:.3}.note{font-size:2.1px;fill:#444;text-anchor:middle}',
    '.num circle{fill:#fff;stroke:#111;stroke-width:.3}.num text{font-size:2.6px;font-weight:600;text-anchor:middle}',
    '.lbl{font-size:2.5px;fill:#333}.sb-b{fill:#111}.sb-w{fill:#fff;stroke:#111;stroke-width:.25}.sb-t{font-size:2.3px;text-anchor:middle}',
    '.h2{font-size:4.2px;font-weight:600}.th{font-size:2.1px;letter-spacing:.08em;fill:#555}.td{font-size:2.6px}.mono{font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace;font-size:2.4px}',
    '.r{text-anchor:end}.num-c{text-anchor:middle;font-weight:600}.tag{font-size:2px;font-weight:600;fill:#fff;paint-order:stroke;stroke:#111;stroke-width:1.6px;text-anchor:end}',
    '.rule{stroke:#111;stroke-width:.3}.rule-t{stroke:#bbb;stroke-width:.12}.row{cursor:pointer}.row:hover .td,.row.is-hl .td{font-weight:600}',
    '.cell{fill:#fff;stroke:#111;stroke-width:.3}.c-lab{font-size:1.9px;letter-spacing:.1em;fill:#555}.c-val{font-size:3px}.c-val.big{font-size:3.6px;font-weight:600}',
    '.c-note{font-size:2.15px;fill:#444}'
  ].join('')
    // todo bajo .sheet: el SVG va incrustado en la página y sus clases (.note, .mono, .lbl…) no deben tocar la interfaz
    .replace(/(^|\})([^{}]+)\{/g, (m, b, sel) => b + sel.split(',').map((x) => '.sheet ' + x.trim()).join(',') + '{');
})();
