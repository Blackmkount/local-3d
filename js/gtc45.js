/* ==========================================================================
   MAPA DE RIESGOS · GTC 45 — lámina R-01 del juego de planos de la versión B (Galería)
   Identificación de peligros y valoración de riesgos según la Guía Técnica Colombiana
   GTC 45:2012 (ICONTEC): clasificación de peligros (anexo A), nivel de deficiencia (ND),
   de exposición (NE), de probabilidad NP = ND × NE, de consecuencias (NC) y de riesgo
   NR = NP × NC, con su aceptabilidad y la jerarquía de controles (numeral 3.2.8).
   La planta sale de plan.js (mismas coordenadas: X a lo ancho, D desde la fachada).
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const PL = L.plan; if (!PL || !PL._h) return;
  const G = (L.gtc45 = {});
  const H = PL._h, sx = H.sx, sy = H.sy, esc = H.esc, K = H.K;

  /* niveles de riesgo (tablas 7 a 9) */
  const NIVEL = {
    I: { c: '#d62828', rango: '600 a 4000', acep: 'No aceptable', qu: 'Situación crítica: suspender actividades hasta controlar el riesgo; intervención urgente' },
    II: { c: '#f08a24', rango: '150 a 500', acep: 'No aceptable o aceptable con control específico', qu: 'Corregir y adoptar medidas de control de inmediato' },
    III: { c: '#f2c94c', rango: '40 a 120', acep: 'Mejorable', qu: 'Mejorar si es posible; justificar la intervención y su rentabilidad' },
    IV: { c: '#3a9d6e', rango: '20', acep: 'Aceptable', qu: 'Mantener los controles existentes y comprobarlos periódicamente' }
  };
  const nivelDe = (nr) => (nr >= 600 ? 'I' : nr >= 150 ? 'II' : nr >= 40 ? 'III' : 'IV');
  const npTxt = (np) => (np >= 24 ? 'MA' : np >= 10 ? 'A' : np >= 6 ? 'M' : 'B');

  /* clases de peligro del anexo A (letra del símbolo en la planta) */
  const CLASE = {
    Q: 'Químico', F: 'Físico', M: 'Condiciones de seguridad · mecánico', E: 'Condiciones de seguridad · eléctrico', T: 'Condiciones de seguridad · tecnológico (incendio)',
    L: 'Condiciones de seguridad · locativo', S: 'Condiciones de seguridad · públicos', B: 'Biomecánico', P: 'Psicosocial', N: 'Fenómenos naturales'
  };

  /* matriz de peligros de la Galería: valoración propuesta desde el diseño (el grupo la revisa con quien opera el local)
     at: posiciones en la planta [X, D]; r: radio de la zona de influencia en m */
  const MATRIZ = {
    B: [
      { id: 'L1', k: 'L', p: 'Choque contra el vidrio sin marco de la mampara', f: 'Mampara (15), paso a la trastienda', e: 'Contusiones, cortes', nd: 6, ne: 3, nc: 25,
        ctl: 'Señalización: franja visible sobre el vidrio a la altura de los ojos. Ingeniería: vidrio templado (ya especificado)', at: [[5.35, 5.55]], r: 0.55 },
      { id: 'T1', k: 'T', p: 'Incendio: impresoras encendidas muchas horas, filamento y cartón almacenados', f: 'Laboratorio (7), repisa de filamentos (9) y bodega (16)', e: 'Quemaduras, intoxicación por humo', nd: 2, ne: 3, nc: 60,
        ctl: 'Ingeniería: detector de humo sobre el laboratorio. Administrativo: no imprimir sin supervisión fuera del horario; bodega ordenada. Extintores ABC y CO₂', at: [[5.0, 4.35], [1.1, 6.78]], r: 0.8 },
      { id: 'E1', k: 'E', p: 'Contacto eléctrico: circuito de las cuatro impresoras (hasta 1400 W), regletas y fuentes de 12 V del LED', f: 'Laboratorio (7) y compartimentos de las fuentes (4 y 5)', e: 'Choque eléctrico, quemaduras, cortocircuito', nd: 2, ne: 2, nc: 60,
        ctl: 'Ingeniería: circuito propio de 20 A con protección diferencial, regletas con supresor, tapas de registro atornilladas. Administrativo: inspección mensual de cables', at: [[5.55, 4.95], [3.62, 3.15], [3.28, 0.63]], r: 0.5 },
      { id: 'M2', k: 'M', p: 'Herramientas manuales de acabado: cúter, espátula, lija y pinzas', f: 'Escritorio del taller (17)', e: 'Cortes y punciones en las manos', nd: 2, ne: 3, nc: 25,
        ctl: 'Sustitución: cúter de hoja retráctil y espátula de borde romo. EPP: guantes anticorte al retirar soportes', at: [[5.62, 6.62]], r: 0.5 },
      { id: 'N1', k: 'N', p: 'Sismo: vuelco de muebles altos (muro de nichos de 2.40 m, laboratorio, vitrinas) y rotura de vidrio', f: 'Todo el local', e: 'Golpes, atrapamiento, cortes', nd: 2, ne: 1, nc: 60,
        ctl: 'Ingeniería: muebles altos anclados al muro con chazo (ya en el despiece), vidrio templado. Administrativo: plan de emergencia y simulacro con el centro comercial', at: [[0.18, 1.55]], r: 0.6 },
      { id: 'S1', k: 'S', p: 'Hurto o atraco: equipos de alto valor a la vista (impresoras, pantallas)', f: 'Acceso y sala de ventas', e: 'Lesiones, afectación emocional', nd: 2, ne: 2, nc: 25,
        ctl: 'Administrativo: poco efectivo en caja, cámaras y protocolo con la seguridad del centro comercial', at: [[4.45, 0.35]], r: 0.6 },
      { id: 'Q1', k: 'Q', p: 'Partículas ultrafinas y compuestos orgánicos volátiles de la impresión FDM (PLA, PETG)', f: 'Laboratorio de impresión (7): 4 impresoras P1S cerradas', e: 'Irritación de vías respiratorias y ojos, dolor de cabeza', nd: 2, ne: 4, nc: 10,
        ctl: 'Ingeniería: extracción localizada sobre el nicho y filtro de carbón activado. Administrativo: puertas de las impresoras cerradas durante la impresión', at: [[5.62, 3.9]], r: 0.9 },
      { id: 'B1', k: 'B', p: 'Postura de pie prolongada del asesor', f: 'Barra de encuentro (5) e isla (3)', e: 'Fatiga, dolor lumbar y de piernas', nd: 2, ne: 4, nc: 10,
        ctl: 'Ingeniería: tapete antifatiga y reposapiés. Administrativo: pausas activas; alternar de pie y sentado en los taburetes', at: [[2.35, 3.15]], r: 0.5 },
      { id: 'M1', k: 'M', p: 'Superficies calientes (boquilla hasta 300 °C, cama hasta 100 °C) y partes móviles al retirar las piezas', f: 'Laboratorio de impresión (7)', e: 'Quemaduras leves, atrapamiento de dedos', nd: 2, ne: 3, nc: 10,
        ctl: 'Ingeniería: retirar la pieza con la impresora detenida y la cama fría. Señalización: rótulo «superficie caliente» en cada puerta', at: [[5.62, 2.85]], r: 0.5 },
      { id: 'L3', k: 'L', p: 'Caída al mismo nivel: cables, cajas en el paso, piso mojado al limpiar', f: 'Pasillos de la sala y trastienda', e: 'Esguinces, contusiones', nd: 2, ne: 3, nc: 10,
        ctl: 'Eliminación: ningún cable por el piso (canaletas del despiece). Administrativo: orden y aseo, aviso de piso mojado', at: [[1.25, 2.05]], r: 0.6 },
      { id: 'B2', k: 'B', p: 'Trabajo sentado con computador y manipulación de cajas e impresoras (12.95 kg)', f: 'Escritorio (17) y bodega (16)', e: 'Lesiones osteomusculares', nd: 2, ne: 3, nc: 10,
        ctl: 'Ingeniería: silla ajustable y pantalla a la altura de los ojos. Administrativo: cargas de más de 12 kg entre dos personas; pausas activas', at: [[4.35, 6.62]], r: 0.5 },
      { id: 'P1', k: 'P', p: 'Atención al público y jornada extendida en temporada alta', f: 'Sala de ventas', e: 'Estrés, fatiga', nd: 2, ne: 3, nc: 10,
        ctl: 'Administrativo: turnos con descansos, protocolo de atención y manejo de quejas', at: [[1.25, 0.9]], r: 0.6 },
      { id: 'Q2', k: 'Q', p: 'Alcohol isopropílico y adhesivos para limpiar las camas; vapores al retocar con laca', f: 'Trastienda, escritorio del taller (17)', e: 'Irritación, mareo; líquido inflamable', nd: 2, ne: 2, nc: 10,
        ctl: 'Sustitución: envases pequeños. Administrativo: hoja de seguridad a la vista, uso con ventilación. EPP: guantes de nitrilo', at: [[4.95, 6.2]], r: 0.45 },
      { id: 'L2', k: 'L', p: 'Caída de objetos desde la repisa alta de filamentos y los nichos superiores', f: 'Repisa de filamentos (9) y muro de nichos (2)', e: 'Golpes, contusiones', nd: 2, ne: 2, nc: 10,
        ctl: 'Administrativo: lo pesado abajo, banquillo de dos pasos para alcanzar lo alto. Ingeniería: tope frontal en las repisas', at: [[5.9, 5.15], [0.18, 3.9]], r: 0.45 }
    ]
  };
  MATRIZ.B.forEach((r) => { r.np = r.nd * r.ne; r.nr = r.np * r.nc; r.niv = nivelDe(r.nr); });
  G.matriz = (v) => MATRIZ[v] || null;
  G.has = (v) => !!MATRIZ[v];

  /* elementos de seguridad propuestos (símbolos de la planta) */
  const SEG = {
    B: [
      { k: 'ex', at: [3.72, 5.75], t: 'ABC 10 lb', d: 'Extintor multipropósito ABC de 10 lb junto a la puerta de la trastienda' },
      { k: 'co2', at: [5.22, 2.12], t: 'CO₂ 10 lb', d: 'Extintor de CO₂ de 10 lb en el costado del laboratorio (equipos eléctricos)' },
      { k: 'bq', at: [2.55, 6.9], t: 'Botiquín', d: 'Botiquín de primeros auxilios en la trastienda' },
      { k: 'te', at: [3.35, 6.9], t: 'Tablero', d: 'Tablero eléctrico del local (ubicación por verificar en sitio)' },
      { k: 'dh', at: [4.95, 3.55], t: '', d: 'Detector de humo en el cielo raso, sobre el laboratorio' },
      { k: 'dh', at: [1.5, 6.25], t: '', d: 'Detector de humo en el cielo raso de la trastienda' },
      { k: 'sal', at: [3.0, -0.13], t: '', d: 'Señal de salida sobre el acceso' }
    ]
  };
  const RUTAS = { B: [[[1.2, 6.25], [4.42, 6.25], [4.42, 5.2], [4.66, 4.7], [4.66, -0.62]], [[1.25, 4.3], [1.25, -0.62]]] };

  /* ------------------------------------------------------------ utilidades */
  const f2 = (v) => (+v).toFixed(2);
  function wrap(t, w, fs) {
    const max = Math.max(6, Math.floor(w / (fs * 0.53))), out = [];
    String(t).split(' ').forEach((wd) => { const l = out.length ? out[out.length - 1] : null; if (l != null && (l + ' ' + wd).length <= max) out[out.length - 1] = l + ' ' + wd; else out.push(wd); });
    return out;
  }
  const tx = (x, y, t, cls, extra) => '<text class="' + cls + '" x="' + f2(x) + '" y="' + f2(y) + '"' + (extra || '') + '>' + esc(t) + '</text>';
  const lines = (x, y, ls, cls, lh) => ls.map((l, i) => tx(x, y + i * lh, l, cls)).join('');
  function marker(cx, cy, r) {
    const n = NIVEL[r.niv];
    return '<g class="hz" data-hz="' + r.id + '"><title>' + esc(r.id + ' · ' + CLASE[r.k] + ': ' + r.p + ' — NR ' + r.nr + ', nivel ' + r.niv + ' (' + n.acep + ')') + '</title>' +
      '<circle class="hz-c" cx="' + f2(cx) + '" cy="' + f2(cy) + '" r="2.5" fill="' + n.c + '"/>' + tx(cx, cy + 0.75, r.id, 'hz-t') + '</g>';
  }
  function simbolo(q) {
    const x = sx(q.at[0]), y = sy(q.at[1]);
    let s = '<g class="sg"><title>' + esc(q.d) + '</title>';
    if (q.k === 'ex' || q.k === 'co2') s += '<rect x="' + f2(x - 2.2) + '" y="' + f2(y - 2.2) + '" width="4.4" height="4.4" rx=".7" fill="#c8102e"/>' + '<path d="M' + f2(x - 0.7) + ' ' + f2(y + 1.5) + 'h1.4v-2.4a.7 .7 0 0 0-1.4 0z" fill="#fff"/><path d="M' + f2(x) + ' ' + f2(y - 1.6) + 'v.7M' + f2(x) + ' ' + f2(y - 1.3) + 'h1.1" stroke="#fff" stroke-width=".35" fill="none"/>';
    else if (q.k === 'bq') s += '<rect x="' + f2(x - 2.2) + '" y="' + f2(y - 2.2) + '" width="4.4" height="4.4" rx=".7" fill="#1a7f37"/><path d="M' + f2(x - 0.45) + ' ' + f2(y - 1.5) + 'h.9v1.05h1.05v.9h-1.05v1.05h-.9v-1.05h-1.05v-.9h1.05z" fill="#fff"/>';
    else if (q.k === 'te') s += '<rect x="' + f2(x - 2.2) + '" y="' + f2(y - 2.2) + '" width="4.4" height="4.4" rx=".4" fill="#111"/><path d="M' + f2(x + 0.3) + ' ' + f2(y - 1.6) + 'l-1.3 1.8h1l-.4 1.5 1.4-2h-1z" fill="#ffd400"/>';
    else if (q.k === 'dh') s += '<circle cx="' + f2(x) + '" cy="' + f2(y) + '" r="2" fill="#fff" stroke="#c8102e" stroke-width=".35"/>' + tx(x, y + 0.65, 'DH', 'sg-dh');
    else if (q.k === 'sal') s += '<rect x="' + f2(x - 7) + '" y="' + f2(y - 2) + '" width="14" height="4" rx=".5" fill="#1a7f37"/>' + tx(x, y + 0.75, 'SALIDA', 'sg-sal');
    if (q.t) s += tx(x + 3, y + 0.8, q.t, 'sg-l');
    return s + '</g>';
  }
  function ruta(pts) {
    return '<polyline class="evac" points="' + pts.map((p) => f2(sx(p[0])) + ',' + f2(sy(p[1]))).join(' ') + '" marker-end="url(#gtcArr)"/>';
  }

  /* ------------------------------------------------------------ lámina */
  G.svg = function (ver) {
    const rows = MATRIZ[ver]; if (!rows) return '';
    const V = L.versions, vi = V.list.find((x) => x.id === ver);
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="420mm" height="297mm" class="sheet sheet-gtc" role="img" aria-label="Mapa de riesgos según la GTC 45, versión ' + ver + '">';
    s += '<style>' + PL.css + G.css + '</style>';
    s += '<defs><marker id="gtcArr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L6 3L0 6z" fill="#1a7f37"/></marker></defs>';
    s += '<rect class="paper" x="0" y="0" width="420" height="297"/><rect class="frame" x="10" y="10" width="400" height="277"/>';
    s += tx(20, 24, 'Mapa de riesgos · GTC 45', 'title');
    s += tx(20, 30.5, 'Versión ' + ver + ' · ' + vi.nombre + ' — identificación de peligros y valoración de riesgos según la Guía Técnica Colombiana GTC 45:2012 (ICONTEC). Planta a escala 1:50, medidas en metros.', 'subtitle');

    // leyenda de símbolos (arriba de la planta)
    let ly = 39;
    s += tx(20, ly, 'CLASES DE PELIGRO (ANEXO A DE LA GTC 45)', 'g-h');
    const ks = Object.keys(CLASE);
    ks.forEach((k, i) => { const x = 20 + (i % 2) * 88, y = ly + 4.4 + Math.floor(i / 2) * 3.6; s += '<rect x="' + x + '" y="' + f2(y - 2.4) + '" width="5" height="3" rx="1.5" class="g-k"/>' + tx(x + 2.5, y - 0.2, k, 'g-kt') + tx(x + 6.5, y, CLASE[k], 'g-l'); });
    // planta
    s += '<g class="gr">' + H.arquitectura(ver) + H.mampara(ver);
    const FU = H.furn(ver);
    L.data.items.forEach((d) => { const f = FU[d.n]; if (f && d.n !== 15) s += f(ver); });
    s += '</g>';
    // zonas de influencia y rutas
    s += '<g class="zn">';
    rows.forEach((r) => r.at.forEach((a) => { s += '<circle cx="' + f2(sx(a[0])) + '" cy="' + f2(sy(a[1])) + '" r="' + f2(r.r * K) + '" fill="' + NIVEL[r.niv].c + '" class="zn-c"/>'; }));
    s += '</g>';
    (RUTAS[ver] || []).forEach((p) => { s += ruta(p); });
    // números de los muebles, en gris
    const NU = H.nums(ver);
    s += '<g class="gnum">';
    Object.keys(NU).forEach((n) => { const p = NU[n]; s += '<circle cx="' + f2(sx(p[0])) + '" cy="' + f2(sy(p[1])) + '" r="1.7"/>' + tx(sx(p[0]), sy(p[1]) + 0.6, n, 'gnum-t'); });
    s += '</g>';
    (SEG[ver] || []).forEach((q) => { s += simbolo(q); });
    rows.forEach((r) => r.at.forEach((a) => { s += marker(sx(a[0]), sy(a[1]), r); }));
    s += tx(sx(3.0), sy(-0.62) + 4.6, 'ACCESO · pasillo del centro comercial', 'zone') + tx(sx(3.0), sy(-0.62) + 7.4, 'Punto de encuentro: el que fije el plan de emergencia del centro comercial', 'zone-sub');
    s += tx(sx(1.3), sy(5.95), 'TRASTIENDA · TALLER', 'zone');

    // leyenda de la planta (debajo)
    let by = 246;
    s += tx(20, by, 'CONVENCIONES', 'g-h');
    by += 5;
    const conv = [
      ['<circle cx="22.5" cy="' + (by - 1) + '" r="2.2" fill="' + NIVEL.II.c + '" stroke="#111" stroke-width=".25"/>', 'Peligro: letra de la clase y número; color del nivel de riesgo'],
      ['<circle cx="22.5" cy="' + (by - 1) + '" r="2.4" fill="' + NIVEL.III.c + '" opacity=".28"/>', 'Zona de influencia del peligro'],
      ['<line x1="19" y1="' + (by - 1) + '" x2="26" y2="' + (by - 1) + '" class="evac" marker-end="url(#gtcArr)"/>', 'Ruta de evacuación hacia el acceso']
    ];
    conv.forEach((c, i) => { const y = by + i * 5; s += c[0].replace(/cy="[\d.]+"/g, 'cy="' + (y - 1) + '"').replace(/y1="[\d.]+" x2="26" y2="[\d.]+"/, 'y1="' + (y - 1) + '" x2="26" y2="' + (y - 1) + '"') + tx(29, y, c[1], 'g-l'); });
    const sy0 = by;
    [['ex', 'Extintor (ABC o CO₂, propuesto)'], ['bq', 'Botiquín'], ['te', 'Tablero eléctrico (verificar)'], ['dh', 'Detector de humo (propuesto)']].forEach((c, i) => {
      const x = 104 + (i % 2) * 48, y = sy0 + Math.floor(i / 2) * 6.2, q = { k: c[0], at: [(x + 2.5 - 56) / K, (222 - y + 1) / K], t: '', d: c[1] };
      s += simbolo(q) + tx(x + 6, y, c[1], 'g-l');
    });
    s += tx(104, sy0 + 13, 'Escala gráfica', 'g-l');
    for (let i = 0; i < 3; i++) s += '<rect x="' + (128 + i * K) + '" y="' + (sy0 + 11) + '" width="' + K + '" height="1.4" class="' + (i % 2 ? 'sb-w' : 'sb-b') + '"/>';
    s += [0, 1, 2, 3].map((i) => tx(128 + i * K, sy0 + 15.6, i + (i === 3 ? ' m' : ''), 'sb-t')).join('');

    // metodología
    let my = 270;
    s += tx(20, my, 'METODOLOGÍA GTC 45', 'g-h');
    s += tx(20, my + 4.4, 'NP = ND × NE   ·   NR = NP × NC', 'g-f');
    s += lines(20, my + 8.2, wrap('ND: 10 muy alto, 6 alto, 2 medio (bajo: sin valor). NE: 4 continua, 3 frecuente, 2 ocasional, 1 esporádica. NC: 100 mortal, 60 muy grave, 25 grave, 10 leve.', 172, 1.95), 'g-s', 2.5);
    s += lines(20, my + 13.4, wrap('Jerarquía de controles: eliminación → sustitución → controles de ingeniería → controles administrativos y señalización → elementos de protección personal.', 172, 1.95), 'g-s', 2.5);

    // matriz
    const X0 = 200, W = 205, top = 36;
    const C = [['CÓD.', 8], ['PELIGRO (CLASE Y DESCRIPCIÓN)', 44], ['FUENTE Y UBICACIÓN', 27], ['EFECTOS POSIBLES', 23], ['ND', 6], ['NE', 6], ['NP', 8], ['NC', 7], ['NR', 8], ['NIVEL', 11], ['CONTROL PROPUESTO', 57]];
    const cx = []; C.reduce((a, c) => { cx.push(a); return a + c[1]; }, X0);
    s += tx(X0, top + 2, 'Matriz de peligros y valoración de riesgos', 'h2');
    let y = top + 8.5;
    C.forEach((c, i) => { s += tx(cx[i] + (i >= 4 && i <= 9 ? c[1] / 2 : 0), y, c[0], 'g-th' + (i >= 4 && i <= 9 ? ' g-c' : '')); });
    s += '<line class="rule" x1="' + X0 + '" y1="' + (y + 1.4) + '" x2="' + (X0 + W) + '" y2="' + (y + 1.4) + '"/>';
    y += 4.6;
    const FS = 1.86, LH = 2.3;
    rows.forEach((r) => {
      const cols = [wrap(CLASE[r.k].replace('Condiciones de seguridad · ', 'Seguridad · ') + ': ' + r.p, C[1][1] - 1.5, FS), wrap(r.f, C[2][1] - 1.5, FS), wrap(r.e, C[3][1] - 1.5, FS), wrap(r.ctl, C[10][1] - 1, FS)];
      const n = Math.max.apply(null, cols.map((c) => c.length)), h = n * LH + 1.6, niv = NIVEL[r.niv];
      s += '<g class="mrow" data-hz="' + r.id + '">';
      s += '<rect x="' + cx[9] + '" y="' + f2(y - 2.2) + '" width="' + C[9][1] + '" height="' + f2(h) + '" fill="' + niv.c + '" opacity=".9"/>';
      s += '<circle cx="' + f2(cx[0] + 3.2) + '" cy="' + f2(y - 0.7) + '" r="2.1" fill="' + niv.c + '" stroke="#111" stroke-width=".22"/>' + tx(cx[0] + 3.2, y, r.id, 'hz-t hz-t2');
      s += lines(cx[1], y, cols[0], 'g-td', LH);
      if (cols[0].length) s += '<text class="g-td g-b" x="' + cx[1] + '" y="' + f2(y) + '"></text>';
      s += lines(cx[2], y, cols[1], 'g-td', LH) + lines(cx[3], y, cols[2], 'g-td', LH);
      [r.nd, r.ne, r.np + ' ' + npTxt(r.np), r.nc, r.nr].forEach((v, i) => { s += tx(cx[4 + i] + C[4 + i][1] / 2, y, String(v), 'g-td g-c mono'); });
      s += tx(cx[9] + C[9][1] / 2, y, r.niv, 'g-td g-c g-nv');
      s += tx(cx[9] + C[9][1] / 2, y + LH, niv.acep.replace('No aceptable o aceptable con control específico', 'Con control'), 'g-td g-c g-ac');
      s += lines(cx[10] + 1, y, cols[3], 'g-td', LH);
      s += '</g>';
      y += h;
      s += '<line class="rule-t" x1="' + X0 + '" y1="' + f2(y - 2.2) + '" x2="' + (X0 + W) + '" y2="' + f2(y - 2.2) + '"/>';
    });
    // resumen e interpretación de los niveles
    y += 1.5;
    const cnt = {}; rows.forEach((r) => { cnt[r.niv] = (cnt[r.niv] || 0) + 1; });
    s += tx(X0, y, 'Resultado: ' + rows.length + ' peligros valorados · ' + ['I', 'II', 'III', 'IV'].map((k) => (cnt[k] || 0) + ' de nivel ' + k).join(' · ') + '. Físico (ruido de las impresoras, iluminación) y biológico: deficiencia baja, la GTC 45 no les asigna valor.', 'g-s');
    y += 4;
    ['I', 'II', 'III', 'IV'].forEach((k, i) => {
      const n = NIVEL[k], x = X0 + (i % 2) * 103, yy = y + Math.floor(i / 2) * 6.6;
      s += '<rect x="' + x + '" y="' + f2(yy - 2.6) + '" width="9" height="5.4" fill="' + n.c + '"/>' + tx(x + 4.5, yy + 0.9, k, 'g-nv g-c') +
        tx(x + 11, yy - 0.4, 'NR ' + n.rango + ' · ' + n.acep, 'g-td g-b') + lines(x + 11, yy + 1.9, wrap(n.qu, 88, 1.7).slice(0, 1), 'g-s', 2.2);
    });

    // cajetín
    const bx = 222, byy = 248, bw = 183;
    const cell = (x, yy, w, hh, lab, val, cls) => '<rect class="cell" x="' + f2(x) + '" y="' + f2(yy) + '" width="' + f2(w) + '" height="' + hh + '"/>' + tx(x + 2, yy + 3.4, lab, 'c-lab') + tx(x + 2, yy + hh - 2, val, 'c-val ' + (cls || ''));
    s += '<g class="block">' +
      cell(bx, byy, bw * 0.62, 10, 'PROYECTO', 'BlackForge · Local de exhibición y taller de impresión 3D', 'big') + cell(bx + bw * 0.62, byy, bw * 0.38, 10, 'LÁMINA', 'R-01 · Mapa de riesgos') +
      cell(bx, byy + 10, bw * 0.62, 10, 'VERSIÓN DEL MOBILIARIO', ver + ' · ' + vi.nombre + ' — ' + vi.titulo) + cell(bx + bw * 0.62, byy + 10, bw * 0.38, 10, 'NORMA', 'GTC 45:2012 (ICONTEC)') +
      cell(bx, byy + 20, bw * 0.31, 10, 'ESCALA', '1:50 en A3') + cell(bx + bw * 0.31, byy + 20, bw * 0.31, 10, 'FECHA', '18 nov. 2026') + cell(bx + bw * 0.62, byy + 20, bw * 0.38, 10, 'LUGAR', 'Villanueva, Casanare') +
      '</g>';
    s += lines(bx, byy + 33.5, wrap('Valoración propuesta desde el diseño del local: el grupo la revisa con quien opera el taller y con el responsable de SST, y la ajusta con la operación real. Los extintores, el botiquín y los detectores son propuestos; el tablero se verifica en sitio.', bw, 1.9), 'c-note', 2.4);
    return s + '</svg>';
  };

  G.css = [
    '.gr .furn{fill:#fff;stroke:#9a9a9a;stroke-width:.25}.gr .wall-el{stroke:#9a9a9a}.gr .equip{fill:#f4f4f4;stroke:#9a9a9a}.gr .thin,.gr .hidden{stroke:#b5b5b5}.gr .glass{stroke:#555}',
    '.zn-c{opacity:.22}.evac{fill:none;stroke:#1a7f37;stroke-width:.7;stroke-dasharray:2.2 1.1;stroke-linecap:round;stroke-linejoin:round}',
    '.hz-c{stroke:#111;stroke-width:.28}.hz-t{font-size:1.95px;font-weight:700;text-anchor:middle}.hz-t2{font-size:1.75px}.hz{cursor:help}',
    '.gnum circle{fill:#fff;stroke:#aaa;stroke-width:.2}.gnum-t{font-size:1.7px;fill:#888;text-anchor:middle}',
    '.sg-dh{font-size:1.45px;font-weight:700;fill:#c8102e;text-anchor:middle}.sg-sal{font-size:2.1px;font-weight:700;fill:#fff;text-anchor:middle;letter-spacing:.12em}.sg-l{font-size:1.8px;fill:#333}',
    '.g-h{font-size:2.3px;font-weight:600;letter-spacing:.1em;fill:#555}.g-l{font-size:2.15px;fill:#222}.g-k{fill:#fff;stroke:#111;stroke-width:.25}.g-kt{font-size:1.9px;font-weight:700;text-anchor:middle}',
    '.g-f{font-size:2.6px;font-weight:600;font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace}.g-s{font-size:1.95px;fill:#444}',
    '.g-th{font-size:1.75px;letter-spacing:.06em;fill:#555}.g-c{text-anchor:middle}.g-td{font-size:1.86px;fill:#111}.g-b{font-weight:600}.g-nv{font-size:2.5px;font-weight:700}.g-ac{font-size:1.5px}'
  ].join('').replace(/(^|\})([^{}]+)\{/g, (m, b, sel) => b + sel.split(',').map((x) => '.sheet ' + x.trim()).join(',') + '{');
})();
