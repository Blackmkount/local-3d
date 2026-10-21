/* ============================================================================
   NOTA 2 · SISTEMA DE PRODUCCIÓN — la planta que fabrica los juegos de la
   versión B: empresa, volumen, ritmo, fabricar o comprar, tipo de producción,
   hipótesis, localización, distribución, máquinas, análisis del producto,
   proceso, métodos, movimientos, tiempos, almacenamiento, 5S, GTC 45,
   ergonomía, calidad y coherencia (guía, numerales 5 y 6).
   Se muestra en la misma vista de las notas (nota1.js), con su propio índice.
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const N2 = L.nota2, VS = L.versions, PR = L.proceso, CO = L.corte;
  const H = () => L.n1.h;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cop = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const nf = (v, d) => (d == null ? (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)) : v.toFixed(d)).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const V = 'B';
  const ST = { n: 2, sec: 'J' };

  const SECS = [
    { id: 'J', t: 'Empresa', d: 'La empresa (elemento J · ítem 1)', st: 'ok' },
    { id: 'K', t: 'Volumen, plazo y ritmo', d: 'Volumen, plazo, jornada y ritmo requerido (K, L y M)', st: 'ok' },
    { id: 'N', t: 'Fabricar o comprar', d: 'Fabricar, comprar o encargar, pieza por pieza (N)', st: 'ok' },
    { id: 'O', t: 'Tipo de producción', d: 'Tipo de producción y patrón de flujo (O · ítem 4)', st: 'ok' },
    { id: '2', t: 'Hipótesis', d: 'Hipótesis de producción, escrita antes de calcular (ítem 2)', st: 'ok' },
    { id: '3', t: 'Localización', d: 'Localización de la planta (ítem 3)', st: 'ok' },
    { id: '5', t: 'Distribución', d: 'Distribución en planta (ítem 5)', st: 'ok' },
    { id: '6', t: 'Máquinas', d: 'Máquinas: inventario y fichas (ítem 6)', st: 'ok' },
    { id: '7', t: 'Análisis del producto', d: 'Análisis del producto y planes de corte (ítem 7)', st: 'ok' },
    { id: '8', t: 'Proceso', d: 'Diagramas de operaciones de los muebles (ítem 8)', st: 'ok' },
    { id: '9', t: 'Métodos', d: 'Cursograma analítico y VA/NVA (ítem 9)', st: 'ok' },
    { id: '10', t: 'Movimientos', d: 'Bimanual y dispositivo de sujeción (ítem 10)', st: 'ok' },
    { id: '11', t: 'Tiempos', d: 'Tiempos, cuello de botella y ritmo (ítem 11)', st: 'ok' },
    { id: '12', t: 'Almacenamiento', d: 'Almacenamiento (ítem 12)', st: 'ok' },
    { id: '13', t: 'Orden y aseo', d: 'Estándar 5S (ítem 13)', st: 'ok' },
    { id: '14', t: 'Seguridad', d: 'Matriz de peligros GTC 45 (ítem 14)', st: 'ok' },
    { id: '15', t: 'Ergonomía', d: 'Fichas de puesto (ítem 15)', st: 'ok' },
    { id: '16', t: 'Calidad', d: 'Plan de inspección (ítem 16)', st: 'ok' },
    { id: '17', t: 'Coherencia', d: 'Hipótesis contrastada y tabla de rastreo (ítem 17)', st: 'ok' },
    { id: 'X', t: 'Lista de chequeo', d: 'Lista de chequeo de la Nota 2', st: '' }
  ];
  const ST_TXT = { ok: 'Listo', parcial: 'En avance', pendiente: 'Pendiente' };
  const FABN = () => H().FABN;
  const ROLE = (n) => H().ROLE[n];
  const short = (n) => H().itemOf(V, n).short;

  function head(id, extra) {
    const s = SECS.find((x) => x.id === id);
    return '<header class="n1-sh"><span class="n1-letter">' + (id === 'X' ? '✓' : id) + '</span><div><h2>' + esc(s.d) + '</h2>' + (s.st ? '<span class="n1-badge b-' + s.st + '">' + ST_TXT[s.st] + '</span>' : '') + '</div>' + (extra || '') + '</header>';
  }
  const tbl = (head, rows, cls) => '<div class="n1-tbl"><table' + (cls ? ' class="' + cls + '"' : '') + '><thead><tr>' + head.map((h) => '<th' + (/^\./.test(h) ? ' class="r"' : '') + '>' + esc(h.replace(/^\./, '')) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  const tipo = (t) => H().tipoTag(t);
  function pickN() {
    return '<div class="n1-pick" role="group" aria-label="Mueble">' + FABN().map((k) => '<button type="button" data-n2n="' + k + '" class="' + (k === ST.n ? 'is-on' : '') + '"><b>' + k + '</b><span>' + esc(short(k)) + '</span></button>').join('') + '</div>';
  }

  /* ------------------------------------------------ calendario: días hábiles y festivos de Colombia (Ley 51 de 1983) */
  function pascua(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(y, mes - 1, dia));
  }
  const addD = (d, n) => new Date(d.getTime() + n * 864e5);
  const lunes = (d) => { const w = d.getUTCDay(); return w === 1 ? d : addD(d, (8 - w) % 7); };
  const iso = (d) => d.toISOString().slice(0, 10);
  function festivos(y) {
    const U = (m, d) => new Date(Date.UTC(y, m - 1, d)), P = pascua(y), out = [];
    [[U(1, 1), 'Año Nuevo'], [U(5, 1), 'Día del Trabajo'], [U(7, 20), 'Independencia'], [U(8, 7), 'Batalla de Boyacá'], [U(12, 8), 'Inmaculada Concepción'], [U(12, 25), 'Navidad'], [addD(P, -3), 'Jueves Santo'], [addD(P, -2), 'Viernes Santo']].forEach((x) => out.push(x));
    [[U(1, 6), 'Reyes Magos'], [U(3, 19), 'San José'], [U(6, 29), 'San Pedro y San Pablo'], [U(8, 15), 'Asunción'], [U(10, 12), 'Día de la Raza'], [U(11, 1), 'Todos los Santos'], [U(11, 11), 'Independencia de Cartagena'], [addD(P, 39), 'Ascensión'], [addD(P, 60), 'Corpus Christi'], [addD(P, 68), 'Sagrado Corazón']].forEach((x) => out.push([lunes(x[0]), x[1]]));
    return out.sort((a, b) => a[0] - b[0]);
  }
  function ritmo() {
    const Vo = N2.volumen, y = +Vo.plazoInicio.slice(0, 4), fest = festivos(y), fs = new Set(fest.map((f) => iso(f[0])));
    let d = new Date(Vo.plazoInicio + 'T00:00:00Z'); const fin = new Date(Vo.plazoFin + 'T00:00:00Z');
    let habiles = 0, festHab = 0; const porMes = Array(12).fill(0);
    while (d <= fin) { const w = d.getUTCDay(); if (w >= 1 && w <= 5) { if (fs.has(iso(d))) festHab++; else { habiles++; porMes[d.getUTCMonth()]++; } } d = addD(d, 1); }
    const hDia = Vo.horasSemana / Vo.diasSemana, horas = habiles * hDia;
    return { fest, festHab, habiles, hDia, horas, porMes, ritmo: horas / Vo.juegos, ritmoMin: Math.min.apply(null, porMes) * hDia };
  }

  /* ------------------------------------------------ secciones */
  function secJ() {
    const E = N2.empresa;
    const row = (t, d) => '<div><dt>' + esc(t) + '</dt><dd>' + esc(d) + '</dd></div>';
    const inv = VS.calc(V);
    return head('J') +
      '<p class="n1-lead">' + esc(E.que) + '</p>' +
      '<dl class="n1-dl">' + row('Empresa', E.nombre) + row('Para quién', E.para) + row('Cómo trabaja', E.modo) + row('Dónde', E.direccion) + row('Qué hace la planta', E.alcance) + row('Qué no hace', E.noHace) + '</dl>' +
      '<h3>El producto: un juego de la versión B</h3>' +
      tbl(['Mueble', 'Medidas', '.Piezas de tablero', '.Materiales'], FABN().map((k) => { const it = VS.items[V][k]; const np = CO.piezas(V, (x) => x === k).length; return '<tr><td><b>' + k + '</b> ' + esc(it.name) + '</td><td>' + esc(it.dims) + '</td><td class="r mono">' + np + '</td><td class="r mono">' + cop(inv.items[k].total) + '</td></tr>'; })) +
      '<p class="n1-note">Doce muebles por juego. Materiales del juego a precios de catálogo: ' + cop(inv.total) + ' (con el aprovechamiento supuesto de la Nota 1; el plan de corte del ítem 7 lo afina).</p>';
  }
  function secK() {
    const Vo = N2.volumen, R = ritmo();
    const mesN = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return head('K') +
      '<div class="n2-kpi"><div><span>Volumen</span><b>' + Vo.juegos + ' juegos</b><small>' + Vo.juegos * 12 + ' muebles en el año</small></div><div><span>Plazo</span><b>12 meses</b><small>enero a diciembre de 2027</small></div><div><span>Horas disponibles</span><b>' + nf(R.horas, 0) + ' h</b><small>' + R.habiles + ' días hábiles × ' + nf(R.hDia, 1) + ' h</small></div><div class="is-key"><span>Ritmo requerido</span><b>' + nf(R.ritmo, 1) + ' h por juego</b><small>' + nf(R.horas, 0) + ' h ÷ ' + Vo.juegos + ' juegos</small></div></div>' +
      '<h3>K · Volumen</h3><p class="n1-box">' + esc(Vo.calculo) + ' ' + tipo(Vo.tipo) + ' <small>' + esc(Vo.fuente) + '</small></p>' +
      '<h3>L · Plazo y jornada</h3>' + tbl(['Dato', 'Valor', 'De dónde sale'], [
        '<tr><td><b>Plazo</b></td><td>' + esc(Vo.plazoTxt) + '</td><td>' + tipo('estimado') + ' Calendario de aperturas supuesto con el cliente.</td></tr>',
        '<tr><td><b>Entregas</b></td><td>' + esc(Vo.entregas) + '</td><td>' + tipo('estimado') + ' Una apertura por mes.</td></tr>',
        '<tr><td><b>Jornada</b></td><td>' + esc(Vo.jornadaTxt) + '</td><td>' + tipo('fuente') + ' ' + esc(Vo.jornadaFuente) + '</td></tr>',
        '<tr><td><b>Días hábiles de 2027</b></td><td>' + R.habiles + ' días de lunes a viernes, sin los ' + R.festHab + ' festivos que caen entre semana</td><td>' + tipo('fuente') + ' Ley 51 de 1983 (festivos trasladables a lunes); cálculo con la fecha de Pascua de 2027.</td></tr>'
      ]) +
      '<details class="n1-det"><summary>Festivos de 2027 (' + R.fest.length + ')</summary><div class="n1-tbl"><table><tbody>' + R.fest.map((f) => '<tr><td class="mono">' + f[0].toISOString().slice(0, 10) + '</td><td>' + esc(f[1]) + '</td></tr>').join('') + '</tbody></table></div></details>' +
      '<h3>M · Ritmo requerido</h3>' +
      '<p class="n2-formula">Ritmo = horas de trabajo disponibles en el plazo ÷ juegos a entregar = ' + nf(R.horas, 0) + ' h ÷ ' + Vo.juegos + ' = <b>' + nf(R.ritmo, 1) + ' horas por juego</b></p>' +
      '<p class="n1-note">Cada ' + nf(R.ritmo, 1) + ' horas de jornada tiene que salir un juego terminado y empacado: es el tiempo de ciclo de la planta (Chase et al., 2009, cap. 7A). No es lo que tarda un juego en fabricarse: si dos personas trabajan a la vez en estaciones distintas, el juego puede tardar más de un ciclo y aun así salir uno por ciclo.</p>' +
      '<div class="n2-bars">' + R.porMes.map((d, i) => '<div><span>' + mesN[i] + '</span><i style="--w:' + (d / 23 * 100).toFixed(1) + '%"></i><b class="mono">' + nf(d * R.hDia, 0) + ' h</b></div>').join('') + '</div>' +
      '<p class="n1-note">Horas disponibles en cada mes. El mes más corto deja ' + nf(R.ritmoMin, 0) + ' h: es el que manda si se quiere entregar un juego al final de cada mes sin adelantar trabajo.</p>';
  }
  const FAB = [
    { q: 'Tableros de MDF 15 y 5.5 mm', d: 'fabrica', r: 'Se compran enteros y se cortan en la planta: la planta está lejos del servicio de corte del proveedor, y cortar en casa permite ajustar el plan de corte (ítem 7) y reponer una pieza el mismo día.' },
    { q: 'Pieles curvas de MDF 5.5 mm', d: 'fabrica', r: 'Se curvan y encolan en la planta sobre las costillas: no hay quien las venda hechas y es parte del diseño.' },
    { q: 'Lacado (sellador y laca catalizada)', d: 'fabrica', r: 'Es el acabado que define el producto y la operación que más tiempo pide: si se encarga, la planta pierde el control de la calidad y del plazo.' },
    { q: 'Tapas de melamina Rovere', d: 'fabrica', r: 'Se cortan en la planta con disco para melamina y se les pega el canto con enchapadora manual: son 13 piezas por juego y 30 m de canto.' },
    { q: 'Canto PVC Rovere', d: 'compra', r: 'Rollo de 200 m del proveedor del tablero.' },
    { q: 'Acrílico y opal de 3 mm', d: 'fabrica', r: 'Pocas piezas rectas: se cortan en la sierra con disco de dientes finos. La pestaña de las repisas se dobla con pistola de calor.' },
    { q: 'Vidrio templado de 10 mm (mampara)', d: 'encarga', r: 'El templado necesita horno: lo corta, perfora y templa una vidriería con las medidas del vano terminado.' },
    { q: 'Reposapiés de tubo (barra)', d: 'encarga', r: 'Una pieza soldada por juego: no justifica un puesto de soldadura. Lo hace un ornamentador local.' },
    { q: 'Tira COB, perfil LED y fuentes', d: 'compra', r: 'Productos comerciales: la planta los corta a medida, les suelda los cables y los prueba.' },
    { q: 'Herrajes y tornillería', d: 'compra', r: 'Bisagras, rieles, patas, soportes, golas, chazos y tornillos de catálogo.' },
    { q: 'Empaque', d: 'compra', r: 'Cartón corrugado, esquineros y película estirable.' }
  ];
  function secN() {
    const lbl = { fabrica: 'Se fabrica', compra: 'Se compra', encarga: 'Se encarga' };
    const piezas = [];
    FABN().forEach((k) => VS.items[V][k].piezas.forEach((p) => { const P = VS.precios[p[0]]; const d = /vidrio/.test(p[0]) || /^tubo/.test(p[0]) ? 'encarga' : /cob|perfilLed|perfilManija|canto/.test(p[0]) ? 'compra' : 'fabrica'; piezas.push('<tr><td><b>' + k + '</b> ' + esc(short(k)) + '</td><td>' + esc(p[1]) + '</td><td>' + esc(P.m) + '</td><td class="r mono">' + p[2] + '</td><td><span class="n2-fc f-' + d + '">' + lbl[d] + '</span></td></tr>'); }));
    return head('N') +
      '<p class="n1-lead">Qué hace la planta, qué compra hecho y qué encarga a un tercero. Se decide por grupo de piezas y después se lista pieza por pieza.</p>' +
      tbl(['Grupo', 'Decisión', 'Por qué'], FAB.map((f) => '<tr><td><b>' + esc(f.q) + '</b></td><td><span class="n2-fc f-' + f.d + '">' + lbl[f.d] + '</span></td><td>' + esc(f.r) + '</td></tr>')) +
      '<h3>Pieza por pieza</h3>' + tbl(['Mueble', 'Pieza', 'Material', '.Cant.', 'Decisión'], piezas) +
      '<p class="n1-note">Los herrajes, la tornillería, las fuentes y el empaque se compran. Con esto, la planta conserva el corte, el curvado, el lacado, el armado, la integración de la luz y la inspección: la parte del proceso que hay que diseñar.</p>';
  }
  function secO() {
    const R = ritmo(), cur = 'lotes';
    return head('O') +
      '<p class="n1-lead">Con 12 juegos idénticos al año y un juego cada ' + nf(R.ritmo, 0) + ' horas, el volumen es bajo y el producto se repite: la matriz de procesos y productos (Chase et al., 2009, cap. 7) lo pone en <b>producción por lotes</b>, con un lote de un juego por mes.</p>' +
      '<div class="n2-matrix">' + N2.procesos.map((p) => '<div class="' + (p.id === cur ? 'is-on' : '') + '"><b>' + esc(p.t) + '</b><span>' + esc(p.d) + '</span><small>Volumen ' + esc(p.vol.toLowerCase()) + ' · estandarización ' + esc(p.est.toLowerCase()) + '</small></div>').join('') + '</div>' +
      tbl(['Opción', 'Por qué sí o por qué no'], [
        '<tr><td><b>Por proyecto</b></td><td>No: el juego no se fabrica en el local; se hace en la planta y se instala.</td></tr>',
        '<tr><td><b>Taller (centro de trabajo)</b></td><td>Cerca: las máquinas se agrupan por función, como en un taller. Pero no hay pedidos distintos: los 12 juegos son iguales.</td></tr>',
        '<tr class="is-on"><td><b>Por lotes · elegido</b></td><td>Cada mes entra un lote de un juego que recorre las estaciones en la misma secuencia; las piezas iguales de varios muebles se cortan y se lacan juntas.</td></tr>',
        '<tr><td><b>Línea</b></td><td>No: un juego cada ' + nf(R.ritmo, 0) + ' h no llena estaciones dedicadas; cada puesto quedaría parado casi todo el tiempo.</td></tr>'
      ]) +
      '<h3>Patrón de flujo</h3><p class="n1-box">Flujo en <b>U</b>: el material entra y sale por el mismo frente (un solo portón para recibir tableros y despachar juegos empacados), la cabina de lacado queda en el fondo, aislada, y el operario que corta también arma, porque los extremos de la U quedan cerca. El esquema sobre el plano de la planta va en el ítem 5.</p>';
  }
  function sec2() {
    const Hh = N2.hipotesis;
    return head('2') +
      '<blockquote class="n2-hyp"><p>' + esc(Hh.texto) + '</p><footer>Escrita el ' + esc(Hh.fecha) + ', antes de calcular los tiempos. No se edita: en el ítem 17 se contrasta con el resultado.</footer></blockquote>' +
      '<h3>Por qué lo creemos</h3><p class="n1-box">' + esc(Hh.porque) + '</p>';
  }
  function sec7() {
    const pl = CO.plan(V), calc = VS.calc(V), P = VS.precios;
    const mats = pl.map((m) => { const c = calc.compras.find((x) => x.id === m.mk); return '<tr><td><b>' + esc(m.P.m) + '</b><small>' + esc(m.P.pres) + (m.veta ? ' · veta fija' : ' · se puede girar') + '</small></td><td class="r mono">' + m.n + '</td><td class="r mono">' + nf(m.piezasA, 2) + ' m²</td><td class="r mono">' + m.boards.length + '</td><td class="r mono">' + (c ? c.unidades : '—') + '</td><td class="r mono"><b>' + nf(m.aprov * 100, 1) + ' %</b></td></tr>'; });
    const ahorro = pl.reduce((s, m) => { const c = calc.compras.find((x) => x.id === m.mk); return s + (c ? (c.unidades - m.boards.length) * P[m.mk].precio : 0); }, 0);
    // tabla de piezas: normalizadas (se repiten), compradas y fabricadas
    const piezas = CO.piezas(V), rep = {};
    piezas.forEach((p) => { const k = p.mk + '|' + Math.round(p.a * 1000) + '×' + Math.round(p.b * 1000); (rep[k] = rep[k] || { mk: p.mk, a: p.a, b: p.b, c: 0, muebles: new Set() }).c++; rep[k].muebles.add(p.n); });
    const norm = Object.values(rep).sort((a, b) => b.c - a.c).slice(0, 12);
    const tot = piezas.length, distintas = Object.keys(rep).length;
    let boards = '';
    pl.forEach((m, mi) => { boards += '<h4 class="n1-h4">' + esc(m.P.m) + ' · ' + m.boards.length + ' tableros · ' + nf(m.aprov * 100, 1) + ' %</h4><div class="n2-boards">' + m.boards.map((b, bi) => '<figure><div class="n2-board" data-cut="' + mi + ':' + bi + '"></div><figcaption>Tablero ' + (bi + 1) + ' · ' + nf(b.area / (m.bd.w * m.bd.h) * 100, 0) + ' %</figcaption></figure>').join('') + '</div>'; });
    return head('7') +
      '<p class="n1-lead">Antes de diseñar el proceso se revisa si el mueble se puede fabricar mejor: cuántas piezas se repiten, qué se compra hecho, cuánto material se pierde en el corte y qué cambio al mueble lo mejora.</p>' +
      '<h3>Planes de corte de un juego</h3>' +
      tbl(['Tablero', '.Piezas', '.Área de piezas', '.Tableros (plan)', '.Tableros (Nota 1, 72 %)', '.Aprovechamiento'], mats) +
      '<p class="n1-note">Corte en guillotina, como en una sierra de mesa: refilado de ' + (CO.TRIM * 1000) + ' mm por borde y disco de ' + (CO.KERF * 1000) + ' mm. Las piezas más largas que el tablero (pieles de 8.5 m, zócalos, dinteles) se dividen en tramos con junta. Frente al 72 % supuesto en la Nota 1, el plan ahorra ' + cop(ahorro) + ' por juego y ' + cop(ahorro * N2.volumen.juegos) + ' en el año.</p>' +
      '<div class="n1-box n1-chg"><b>Cambio que el plan de corte le hizo al mueble</b><ul><li><b>10 · Cajonera de servicio:</b> los costados de las cajas de cajón bajan de 170 a 150 mm de alto. Con 170 mm, los 60 costados del juego necesitaban un tablero 18 de MDF 15 mm usado al 8 %; con 150 mm salen de los retazos y el juego usa 17 tableros (88 % de aprovechamiento). La caja sigue teniendo 13 cm útiles para repuestos.</li></ul></div>' +
      boards +
      '<h3>Piezas normalizadas <small>las medidas que más se repiten en el juego</small></h3>' +
      tbl(['Material', 'Medida (mm)', '.Veces', 'Muebles'], norm.map((r) => '<tr><td>' + esc(P[r.mk].m.split(',')[0]) + '</td><td class="mono">' + Math.round(r.a * 1000) + ' × ' + Math.round(r.b * 1000) + '</td><td class="r mono">' + r.c + '</td><td>' + Array.from(r.muebles).join(', ') + '</td></tr>')) +
      '<p class="n1-note">' + tot + ' piezas de tablero en ' + distintas + ' medidas distintas. Las más repetidas (frentes y laterales de la cajonera, puertas del laboratorio) se cortan juntas con un tope en la guía: se mide una vez y se corta muchas.</p>' +
      '<h3>Análisis del valor</h3>' + tbl(['Elemento', 'Función', 'Qué se cambió o se propone', 'Efecto'], [
        '<tr><td><b>Costados de cajas (10)</b></td><td>Contener repuestos pequeños</td><td>De 170 a 150 mm de alto</td><td>Un tablero menos por juego</td></tr>',
        '<tr><td><b>Cajas de cajón (10)</b></td><td>Guardar; no se ven</td><td>Solo selladas, sin laca (ya en el diseño)</td><td>15 m² menos de lacado por juego</td></tr>',
        '<tr><td><b>Pisos y costillas internas (3, 4, 5)</b></td><td>Estructura oculta</td><td>MDF sin acabado</td><td>No pasan por la cabina</td></tr>',
        '<tr><td><b>Tapas de Rovere (3, 5, 7, 10, 17)</b></td><td>Superficie de trabajo y toque</td><td>Se propone ajustar los anchos a 700, 700 y 600 mm para que tres tapas salgan del ancho de un tablero</td><td>Hoy: 4 tableros al 55 %; a evaluar en la Nota 3</td></tr>'
      ]);
  }
  function sec8() {
    const p = PR.de(V, ST.n), d = PR.svgOperaciones(p, N2.tiempos);
    const all = FABN().map((k) => { const q = PR.de(V, k), o = q.comps.reduce((s, c) => s + c.ops.filter((x) => x.s === 'O').length, 0) + q.main.filter((x) => x.s === 'O').length, i = q.comps.reduce((s, c) => s + c.ops.filter((x) => x.s === 'I').length, 0) + q.main.filter((x) => x.s === 'I').length; return '<tr data-n2n="' + k + '" class="' + (k === ST.n ? 'is-on' : '') + '"><td><b>' + k + '</b> ' + esc(short(k)) + '</td><td class="r mono">' + q.comps.length + '</td><td class="r mono">' + o + '</td><td class="r mono">' + i + '</td></tr>'; });
    return head('8') +
      '<p class="n1-lead">La secuencia de operaciones de cada mueble, hasta el empaque. Cada componente baja por su columna; los que se lacan se unen antes de la cabina y los demás (tapas, luz, acrílico, vidrio) se unen en el premontaje. Las cantidades salen del despiece y los tiempos, de los datos tipo del ítem 11 (sin suplementos).</p>' +
      tbl(['Mueble', '.Componentes', '.Operaciones', '.Inspecciones'], all, 'n1-sum') +
      '<h3>Diagrama de operaciones</h3>' + pickN() +
      '<div class="n2-diag">' + d.svg + '</div>' +
      '<p class="n1-note">Símbolos ASME: círculo, operación; cuadrado, inspección; D, demora (secado y fraguado). ' + d.num.O + ' operaciones, ' + d.num.I + ' inspecciones y ' + d.num.D + ' demoras. La instalación en el local va después del almacén de producto terminado y no hace parte de la planta. El diagrama de flujo, con el recorrido del material sobre el plano de la planta, está en el ítem 5; el cursograma con distancias y tiempos, en el ítem 9.</p>';
  }





  /* ------------------------------------------------ 17 · coherencia */
  const RASTREO = [
    ['MDF de 15 mm lacado en blanco en casi todo el juego', 'Cabina de lacado con extracción al exterior, racks de secado, auxiliar de acabados; riesgo químico y de incendio en la GTC 45', '5, 6, 14'],
    ['Pieles curvas de MDF 5.5 mm en dos capas (isla y pedestales)', 'Estación de curvado con costillas, prensas y tiempo de fraguado', '5, 8, 11'],
    ['Tapas de Rovere de 30 mm (dos capas) con canto', 'Prensado de tapas y enchapadora de cantos; se compra un rollo de canto de 200 m', '6, 8'],
    ['Tira COB y perfil LED en nichos, isla y laboratorio', 'Banco eléctrico para cortar, soldar y probar; prueba de cada tramo como punto de inspección', '8, 16'],
    ['Tableros de 1.83 × 2.44 m de unos 50 kg', 'Rack vertical, carro porta-tableros, sierra circular con guía para despiezar; carga entre dos personas', '5, 6, 14, 15'],
    ['Muebles altos de 2.40 m (muro de nichos, nicho de bienvenida)', 'Premontaje acostado y despacho por módulos; zona de premontaje en piso', '5, 12'],
    ['Vidrio templado de la mampara', 'Se encarga a una vidriería de Villavicencio: no entra a la planta, solo se inspecciona', 'N, 16'],
    ['Herrajes de catálogo (bisagras, rieles, patas)', 'Perforación con plantilla en el taladro de banco; no hay máquina dedicada', '6']
  ];
  const CAMBIOS2 = [
    ['10 · Cajonera de servicio', 'Costados de las cajas de 170 a 150 mm', 'Plan de corte: un tablero de MDF menos por juego (88 % de aprovechamiento)', '7'],
    ['Todo el juego', 'Laca Renania cambiada por laca y sellador catalizados al ácido de Pintuco (Madetec)', 'Ficha técnica completa: 1 h entre manos y 45 m²/galón; la Renania no publica ficha', '6, 11'],
    ['Cabina de lacado', 'Extractor de unos 5700 CFM, antichispa, con motor fuera del ducto', 'Cara abierta de 2.4 × 2.2 m a 100 ft/min (OSHA 1910.107, referencia)', '6, 14'],
    ['Lijado', 'Mesa de lijado con topes y vacío', 'La mano izquierda dejaba de ser prensa (bimanual)', '10'],
    ['Corte', 'Sierra circular con guía antes de la sierra de mesa', 'La mesa de la sierra mide 555 mm y el tablero pesa unos 50 kg', '6, 15']
  ];
  function sec17() {
    const t = tiempos(), H2 = N2.hipotesis, cu = t.cuello, acab = t.acabado, lac = (t.est.LAC || 0) / 60;
    const acerto = cu.e === 'LAC';
    return head('17') +
      '<h3>Hipótesis contrastada</h3>' +
      '<div class="n2-hc"><div><span>Lo que creíamos (' + esc(H2.fecha) + ')</span><p>' + esc(H2.texto) + '</p></div><div><span>Lo que dio el cálculo</span><p>La estación más cargada es <b>' + esc(ESTN()[cu.e].toLowerCase()) + '</b>, con ' + nf(cu.h, 1) + ' h por juego. La cabina de lacado, sola, suma ' + nf(lac, 1) + ' h; con el lijado que la acompaña, el acabado completo llega a ' + nf(acab, 1) + ' h. Ninguna se acerca al ritmo de ' + nf(t.R.ritmo, 1) + ' h.</p></div></div>' +
      '<p class="n1-box">' + (acerto ? 'La hipótesis se confirma: el lacado es la estación más cargada.' : 'La hipótesis acertó a medias. Por estación, la más cargada no es la cabina sino ' + ESTN()[cu.e].toLowerCase() + '. Pero si el lijado y el lacado se cuentan como un solo puesto, como se diseñó (la misma persona, con la cabina al lado), el acabado es el que más horas pide (' + nf(acab, 1) + ' h). Lo que sí falló fue creer que el lacado iba a limitar la planta: con un juego por mes, nada la limita; el riesgo real está en el secado entre manos si se laca mueble por mueble, y por eso el método propuesto laca el juego en una sola tanda.') + '</p>' +
      '<h3>Tabla de rastreo: decisión del mueble → consecuencia en la planta</h3>' + tbl(['Decisión del mueble', 'Consecuencia en la planta', 'Ítems'], RASTREO.map((r) => '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td class="mono">' + r[2] + '</td></tr>')) +
      '<h3>Cambios que la planta le hizo al mueble</h3>' + tbl(['Dónde', 'Cambio', 'Causa', 'Ítem'], CAMBIOS2.map((r) => '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td class="mono">' + r[3] + '</td></tr>')) +
      '<h3>Pendientes por decidir</h3><ul class="n1-check">' + [
        'Localización: la tabla de factores favorece a Villavicencio; la planta queda en Villanueva por el inmueble. Se revisa con los costos de transporte de la Nota 3.',
        'Compresor: la pistola pide 6.3 CFM y el compresor elegido da 4.4 CFM. Se cotiza un compresor mayor o una pistola de menor consumo.',
        'Capacidad: con 1.5 personas la planta queda ocupada al ' + Math.round(operarios(t).util * 100) + ' %. Puede tomar un segundo juego por mes, o reducir el auxiliar a menos horas.',
        'Tiempos: todos son estimados. Se validan cronometrando el primer juego y con la entrevista al ebanista (guion en el ítem 11).'
      ].map((q) => '<li class="c-parcial"><i></i><span>' + esc(q) + '</span></li>').join('') + '</ul>';
  }

  /* ------------------------------------------------ 3 · localización */
  function mapa() {
    const LC = N2.loc, x0 = -74.45, x1 = -71.75, y0 = 3.95, y1 = 6.0, W = 700, Hh = 560;
    const X = (lon) => ((lon - x0) / (x1 - x0) * W).toFixed(1), Y = (lat) => ((y1 - lat) / (y1 - y0) * Hh).toFixed(1);
    let s = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" class="n2-map" role="img" aria-label="Mapa esquemático de la planta, los proveedores y los locales">';
    s += '<rect width="' + W + '" height="' + Hh + '" fill="#f6f4ef"/>';
    const by = {}; LC.ciudades.forEach((c) => { by[c.t] = c; });
    // vías principales (esquema): Ruta 65 y Ruta 40
    const ruta = (pts, cls) => '<path class="' + cls + '" d="' + pts.map((t, i) => (i ? 'L' : 'M') + X(by[t].lon) + ' ' + Y(by[t].lat)).join('') + '"/>';
    s += ruta(['Bogotá', 'Villavicencio', 'Barranca de Upía', 'Villanueva', 'Monterrey', 'Aguazul', 'Yopal'], 'rd') + ruta(['Aguazul', 'Sogamoso', 'Duitama', 'Tunja', 'Bogotá'], 'rd2');
    // líneas a los proveedores
    LC.ciudades.filter((c) => c.prov).forEach((c) => { s += '<line class="pv" x1="' + X(LC.planta.lon) + '" y1="' + Y(LC.planta.lat) + '" x2="' + X(c.lon) + '" y2="' + Y(c.lat) + '"/>'; });
    LC.ciudades.forEach((c) => {
      const cls = c.obra ? 'ob' : 'ct';
      s += '<circle class="' + cls + '" cx="' + X(c.lon) + '" cy="' + Y(c.lat) + '" r="' + (c.obra ? 7 : 4) + '"/>' + (c.prov ? '<rect class="pr" x="' + (X(c.lon) - 18) + '" y="' + (Y(c.lat) - 16) + '" width="9" height="9"/>' : '');
      const izq = c.t === 'Barranca de Upía';
      if (c.t !== 'Villanueva') s += '<text' + (izq ? ' text-anchor="end"' : '') + ' x="' + (+X(c.lon) + (izq ? -10 : 11)) + '" y="' + (+Y(c.lat) + (izq ? 14 : 4)) + '">' + esc(c.t) + (c.km ? ' · ' + nf(c.km, 0) + ' km' : '') + '</text>';
    });
    s += '<path class="pl" d="M' + X(LC.planta.lon) + ' ' + (Y(LC.planta.lat) - 16) + 'l9 -12h-18z"/><circle class="pl" cx="' + X(LC.planta.lon) + '" cy="' + Y(LC.planta.lat) + '" r="8"/><text class="b" x="' + (+X(LC.planta.lon) + 13) + '" y="' + (+Y(LC.planta.lat) + 18) + '">Planta · Villanueva</text>';
    const L0 = 12; // leyenda arriba a la izquierda, donde el mapa no tiene ciudades
    s += '<g class="lg"><rect x="12" y="' + L0 + '" width="268" height="84" rx="8" fill="#fff" stroke="#ddd"/><circle class="pl" cx="28" cy="' + (L0 + 18) + '" r="6"/><text x="42" y="' + (L0 + 22) + '">Planta</text><rect class="pr" x="23" y="' + (L0 + 32) + '" width="10" height="10"/><text x="42" y="' + (L0 + 41) + '">Proveedores (tableros, herrajes, laca)</text><circle class="ob" cx="28" cy="' + (L0 + 56) + '" r="6"/><text x="42" y="' + (L0 + 60) + '">Locales de la cadena (obra)</text><path class="rd" d="M20 ' + (L0 + 74) + 'h18"/><text x="42" y="' + (L0 + 78) + '">Ruta 65 (Marginal de la Selva) y Ruta 40</text></g>';
    return s + '</svg>';
  }
  function sec3() {
    const LC = N2.loc, opts = ['Villanueva', 'Villavicencio', 'Yopal'];
    const tot = {}; opts.forEach((o) => { tot[o] = LC.factores.reduce((a, f) => a + f.peso * f.v[o], 0) / 100; });
    const best = opts.slice().sort((a, b) => tot[b] - tot[a])[0];
    const sumKm = LC.obra.reduce((a, o) => a + o[1], 0);
    return head('3') +
      '<p class="n1-lead">La planta tiene que quedar donde convenga por los proveedores y por la obra (los doce locales de la cadena), no solo donde hay espacio. Se compararon tres sitios sobre la Ruta 65 con una tabla de factores ponderados.</p>' +
      '<div class="n2-map-w">' + mapa() + '</div>' +
      '<h3>Tabla de factores</h3>' + tbl(['Factor', '.Peso'].concat(opts.map((o) => '.' + o)).concat(['Dato']), LC.factores.map((f) => '<tr><td><b>' + esc(f.t) + '</b></td><td class="r mono">' + f.peso + ' %</td>' + opts.map((o) => '<td class="r mono">' + f.v[o] + '</td>').join('') + '<td><small>' + esc(f.d) + '</small></td></tr>').concat(['<tr class="n1-tot"><td><b>Puntaje ponderado</b> <small>de 5</small></td><td class="r mono">100 %</td>' + opts.map((o) => '<td class="r mono' + (o === best ? ' is-win' : '') + '"><b>' + nf(tot[o], 2) + '</b></td>').join('') + '<td></td></tr>'])) +
      '<div class="n1-box n1-chg"><b>Resultado</b><p>La tabla favorece a <b>' + best + '</b> (' + nf(tot[best], 2) + ' frente a ' + nf(tot.Villanueva, 2) + ' de Villanueva): queda junto a los proveedores de tablero y más cerca de la mayoría de los locales. Villanueva gana solo en el inmueble disponible. La planta se deja en la Carrera 11 N.º 3-36 de Villanueva por decisión del grupo; el costo de esa decisión son los viajes a Villavicencio por tableros (230 km ida y vuelta, una vez al mes) y unos 1150 km más de despacho al año. Queda en la tabla de rastreo (ítem 17) para revisarla con los costos de la Nota 3.</p></div>' +
      '<h3>Proveedores cercanos</h3>' + tbl(['Proveedor', 'Ciudad', 'Dirección', 'Qué se le compra', 'Dato'], LC.proveedores.map((p) => '<tr><td><b>' + esc(p.t) + '</b></td><td>' + esc(p.c) + '</td><td>' + esc(p.d) + '</td><td>' + esc(p.q) + '</td><td>' + tipo(p.tag) + '</td></tr>')) +
      '<h3>La obra: los doce locales <small>distancia por carretera desde la planta (OSRM)</small></h3>' + tbl(['Ciudad', '.Distancia'], LC.obra.map((o) => '<tr><td>' + esc(o[0]) + '</td><td class="r mono">' + nf(o[1], 0) + ' km</td></tr>').concat(['<tr class="n1-tot"><td><b>Total, un despacho a cada local</b></td><td class="r mono"><b>' + nf(sumKm, 0) + ' km</b></td></tr>'])) +
      '<p class="n1-note">Las ciudades de los locales son un supuesto del grupo (ciudades con centros comerciales grandes) y se marcan como estimadas. Distancias de OSRM sobre OpenStreetMap, cotejadas con la ANI en el corredor Villavicencio–Yopal; los tiempos de OSRM son optimistas: Bogotá queda a unas 4.5 h y no a las 2.9 h que da el cálculo.</p>';
  }

  /* ------------------------------------------------ tiempos por estación (ítem 11) */
  const ESTN = () => PR.estacion;
  function tiempos() {
    const T = N2.tiempos, sup = 1 + N2.suplemento.pct, est = {}, dem = {}, mue = {};
    let trabajo = 0;
    FABN().forEach((n) => {
      const p = PR.de(V, n), ops = p.comps.reduce((a, c) => a.concat(c.ops), []).concat(p.main);
      let m = 0;
      ops.forEach((o) => { const t = PR.tiempo(o, T); if (T[o.k] && T[o.k].demora) dem[o.e] = (dem[o.e] || 0) + t; else { const ts = t * sup; est[o.e] = (est[o.e] || 0) + ts; m += ts; } });
      mue[n] = m; trabajo += m;
    });
    const R = ritmo(), lista = Object.keys(est).map((e) => ({ e, h: est[e] / 60 })).sort((a, b) => b.h - a.h);
    const acabado = (est.LIJ || 0) / 60 + (est.LAC || 0) / 60;
    return { est, dem, mue, trabajo: trabajo / 60, lista, R, acabado, cuello: lista[0] };
  }
  /* operarios: el trabajo de un juego frente a las horas de una persona en un ciclo */
  function operarios(t) {
    const efic = 0.85, porPersona = t.R.ritmo * efic, necesarios = t.trabajo / porPersona;
    return { efic, porPersona, necesarios, n: 1.5, util: t.trabajo / (t.R.ritmo * 1.5) };
  }
  function sec11() {
    const t = tiempos(), T = N2.tiempos, op = operarios(t), R = t.R, max = t.lista[0].h;
    const rows = Object.keys(T).map((k) => '<tr><td><b>' + esc(k) + '</b></td><td class="r mono">' + nf(T[k].min, T[k].min < 10 ? 1 : 0) + ' min / ' + esc(T[k].u) + '</td><td>' + tipo(T[k].t) + (T[k].demora ? ' <span class="n1-chip">Demora</span>' : '') + '</td><td>' + esc(T[k].f) + '</td></tr>');
    return head('11') +
      '<p class="n1-lead">La planta no existe y no se puede cronometrar: cada tiempo se supone y se dice de dónde sale (guía, 6.2). Se armó una tabla de datos tipo, minutos por unidad de cada elemento, y con las cantidades del despiece se calcula el tiempo de cada operación de cada mueble.</p>' +
      '<div class="n2-kpi"><div><span>Trabajo por juego</span><b>' + nf(t.trabajo, 1) + ' h</b><small>con ' + Math.round(N2.suplemento.pct * 100) + ' % de suplementos</small></div><div><span>Estación más cargada</span><b>' + esc(ESTN()[t.cuello.e]) + '</b><small>' + nf(t.cuello.h, 1) + ' h por juego</small></div><div class="is-key"><span>Ritmo requerido</span><b>' + nf(R.ritmo, 1) + ' h</b><small>un juego por ciclo</small></div><div><span>¿Alcanza?</span><b>' + (t.cuello.h < R.ritmo ? 'Sí' : 'No') + '</b><small>' + nf(t.cuello.h, 1) + ' h frente a ' + nf(R.ritmo, 1) + ' h</small></div></div>' +
      '<h3>Carga de cada estación frente al ritmo</h3><div class="n2-load">' + t.lista.map((x) => '<div><span>' + esc(ESTN()[x.e]) + '</span><i style="--w:' + (x.h / R.ritmo * 100).toFixed(2) + '%"></i><b class="mono">' + nf(x.h, 1) + ' h</b></div>').join('') + '<div class="n2-ritmo"><span>Ritmo</span><i style="--w:100%"></i><b class="mono">' + nf(R.ritmo, 1) + ' h</b></div></div>' +
      '<p class="n1-note">La barra completa es el ritmo (' + nf(R.ritmo, 1) + ' h). Lijado y lacado los hace la misma persona en la zona de acabado: juntos suman ' + nf(t.acabado, 1) + ' h. Las demoras de secado y fraguado (' + nf(Object.values(t.dem).reduce((a, b) => a + b, 0) / 60, 1) + ' h si cada mueble se lacara aparte) no ocupan a nadie: las piezas esperan en los racks mientras el operario hace otra cosa, y lacando el juego completo en una sola tanda se reducen a unas 5 h (sellador, dos manos y secado para manipular).</p>' +
      '<h3>Número de operarios</h3><p class="n2-formula">Operarios = trabajo por juego ÷ (ritmo × eficiencia) = ' + nf(t.trabajo, 1) + ' h ÷ (' + nf(R.ritmo, 1) + ' h × ' + op.efic + ') = <b>' + nf(op.necesarios, 2) + '</b></p>' +
      '<p class="n1-box">Con los tiempos estimados, una persona alcanza. La planta se diseña con <b>un ebanista de tiempo completo y un auxiliar de acabados de medio tiempo</b>: el tablero de MDF de unos 50 kg se carga entre dos (ítem 14), y nadie laca solo en la cabina. Con 1.5 personas la planta queda ocupada al ' + Math.round(op.util * 100) + ' %: tiene capacidad para casi dos juegos por mes sin contratar a nadie más.</p>' +
      '<h3>Tiempo de cada mueble</h3>' + tbl(['Mueble', '.Horas de trabajo', '.Parte del juego'], FABN().map((n) => '<tr><td><b>' + n + '</b> ' + esc(short(n)) + '</td><td class="r mono">' + nf(t.mue[n] / 60, 1) + ' h</td><td class="r mono">' + nf(t.mue[n] / 60 / t.trabajo * 100, 0) + ' %</td></tr>')) +
      '<h3>Datos tipo <small>de dónde sale cada tiempo</small></h3>' + tbl(['Elemento', '.Tiempo', 'Dato', 'Fuente o cálculo'], rows) +
      '<p class="n1-note">' + esc(N2.suplemento.f) + '</p>' +
      '<h3>Guion de la entrevista al experto</h3><div class="n1-box n2-guion"><p>Para validar los tiempos con un ebanista o un lacador (guía, 6.2), se registra quién es, su oficio y sus años, y se le pregunta con la pieza o el plano a la vista:</p><ol><li>¿Cuánto tarda en despiezar un tablero de MDF de 1.83 × 2.44 m en 10 piezas con sierra de mesa?</li><li>¿Cuánto tarda en lijar 1 m² de MDF antes del sellador, y entre manos?</li><li>¿Cuántos m² laca por hora con pistola, contando mover las piezas?</li><li>¿Cuánto espera entre el sellador y la laca, y entre manos, con la laca que usa?</li><li>¿Cuánto tarda en pegar y refilar 1 m de canto con su máquina?</li><li>¿Cuánto tarda en poner una bisagra de cazoleta y un riel de cajón?</li><li>¿Cuánto tarda en encolar y prensar dos capas de MDF de 5.5 mm sobre costillas?</li></ol><p>Si su tiempo y el de la tabla no coinciden, se anotan los dos y se dice cuál se usó.</p></div>';
  }
  /* ------------------------------------------------ 9 · cursograma analítico */
  function cursograma(n) {
    const p = PR.de(V, n), T = N2.tiempos, PL = L.planta, sup = 1 + N2.suplemento.pct, V_CARRO = 40;
    const filas = [{ s: 'A', t: 'Tableros y materiales en el almacén', e: 'ALM', d: 0, m: 0 }];
    let prev = 'ALM';
    const push = (op) => {
      if (op.e !== prev && PL.area(op.e) && PL.area(prev)) { const d = PL.dist(prev, op.e); filas.push({ s: 'T', t: 'Llevar a ' + ESTN()[op.e].toLowerCase(), e: op.e, d, m: d / V_CARRO }); prev = op.e; }
      const tm = PR.tiempo(op, T);
      filas.push({ s: op.s, t: op.t, e: op.e, d: 0, m: T[op.k] && T[op.k].demora ? tm : tm * sup, q: op.q, u: op.u });
    };
    p.comps.forEach((c) => { prev = 'ALM'; c.ops.forEach(push); });
    p.main.forEach(push);
    if (prev !== 'APT') { const d = PL.dist(prev, 'APT'); filas.push({ s: 'T', t: 'Llevar los bultos al almacén de producto terminado', e: 'APT', d, m: d / V_CARRO }); }
    filas.push({ s: 'A', t: 'Juego empacado, listo para despachar', e: 'APT', d: 0, m: 0 });
    filas.forEach((f) => { f.va = f.s === 'O' && !/empac|Desarmar/i.test(f.t); });
    return { p, filas };
  }
  const SYM = { O: '○', I: '□', T: '⇒', D: 'D', A: '▽' };
  function sec9() {
    const c = cursograma(ST.n), F = c.filas;
    const tot = { O: [0, 0, 0], I: [0, 0, 0], T: [0, 0, 0], D: [0, 0, 0], A: [0, 0, 0] };
    F.forEach((f) => { tot[f.s][0]++; tot[f.s][1] += f.d; tot[f.s][2] += f.m; });
    const va = F.filter((f) => f.va).reduce((a, f) => a + f.m, 0), all = F.reduce((a, f) => a + f.m, 0);
    const rows = F.map((f, i) => '<tr class="' + (f.va ? '' : 'nva') + '"><td class="r mono">' + (i + 1) + '</td><td>' + esc(f.t) + (f.q ? '<small>' + (f.q % 1 ? nf(f.q, 1) : f.q) + ' ' + esc(f.u) + '</small>' : '') + '</td>' + ['O', 'T', 'I', 'D', 'A'].map((k) => '<td class="sym">' + (f.s === k ? '<b class="s-' + k + '">' + SYM[k] + '</b>' : '') + '</td>').join('') + '<td class="r mono">' + (f.d ? nf(f.d, 1) : '') + '</td><td class="r mono">' + (f.m ? nf(f.m, 1) : '') + '</td><td>' + (f.va ? '<span class="n2-va">VA</span>' : '<span class="n2-nva">NVA</span>') + '</td></tr>');
    rows.push('<tr class="n1-tot"><td></td><td><b>Totales</b></td>' + ['O', 'T', 'I', 'D', 'A'].map((k) => '<td class="sym"><b>' + tot[k][0] + '</b></td>').join('') + '<td class="r mono"><b>' + nf(Object.values(tot).reduce((a, x) => a + x[1], 0), 0) + ' m</b></td><td class="r mono"><b>' + nf(all, 0) + ' min</b></td><td></td></tr>');
    return head('9') +
      '<p class="n1-lead">Cursograma analítico del método propuesto, mueble por mueble: cada operación, transporte, inspección, demora y almacenamiento, con su distancia en la planta (ítem 5) y su tiempo (ítem 11). Al final, la fila de totales y cuánto del tiempo agrega valor.</p>' + pickN() +
      '<div class="n2-kpi"><div><span>Actividades</span><b>' + F.length + '</b><small>' + tot.O[0] + ' operaciones · ' + tot.T[0] + ' transportes · ' + tot.I[0] + ' inspecciones · ' + tot.D[0] + ' demoras</small></div><div><span>Distancia</span><b>' + nf(Object.values(tot).reduce((a, x) => a + x[1], 0), 0) + ' m</b><small>un recorrido del lote</small></div><div><span>Tiempo</span><b>' + nf(all / 60, 1) + ' h</b><small>con suplementos y demoras</small></div><div class="is-key"><span>Agrega valor</span><b>' + Math.round(va / all * 100) + ' %</b><small>' + nf(va / 60, 1) + ' h de ' + nf(all / 60, 1) + ' h</small></div></div>' +
      '<div class="n1-tbl"><table class="n2-cur"><thead><tr><th class="r">N.º</th><th>Actividad</th><th>Oper.</th><th>Transp.</th><th>Insp.</th><th>Demora</th><th>Alm.</th><th class="r">Dist. (m)</th><th class="r">Tiempo (min)</th><th>VA</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' +
      '<p class="n1-note">VA: la operación cambia la forma o el acabado del mueble. NVA: transporte, inspección, demora, almacenamiento y empaque, necesarios pero que no cambian el producto. Transporte con carro a unos 40 m/min (estimado).</p>' +
      '<h3>Examen crítico del propio diseño</h3>' + tbl(['Actividad NVA', 'Pregunta', 'Respuesta y cambio'], [
        '<tr><td><b>Secado entre manos</b></td><td>¿Se puede eliminar?</td><td>No: lo pide la química de la laca (1 h entre manos, Pintuco). Se acorta su efecto lacando el juego completo en una sola tanda y lijando otra tanda mientras tanto.</td></tr>',
        '<tr><td><b>Transportes al lijado y la cabina</b></td><td>¿Por qué tan lejos?</td><td>La cabina va al fondo, separada del polvo (relación X). Lijado y cabina quedan contiguos al otro lado de la pared, con puerta entre los dos: tres vueltas cortas en vez de tres viajes largos.</td></tr>',
        '<tr><td><b>Inspección del acabado</b></td><td>¿Se puede combinar?</td><td>Sí: la hace el mismo lacador al sacar la pieza de la cabina, con luz rasante en el rack; no es una estación aparte.</td></tr>',
        '<tr><td><b>Desarmar para empacar</b></td><td>¿Por qué se arma y se desarma?</td><td>El premontaje comprueba escuadras y herrajes antes de viajar; se desarma por módulos grandes, no pieza por pieza, para que en el local solo se unan módulos.</td></tr>',
        '<tr><td><b>Almacén de piezas cortadas</b></td><td>¿Cuándo se puede evitar?</td><td>Cortando solo lo que se laca en la tanda del día, las piezas pasan de la sierra al lijado sin esperar en carros.</td></tr>'
      ]);
  }
  /* ------------------------------------------------ 10 · bimanual */
  const BIM = {
    actual: [['Toma la pieza del carro', 'O', 'Toma la lijadora', 'O'], ['Lleva la pieza a la mesa', 'T', 'Espera', 'D'], ['Sostiene la pieza contra la mesa', 'S', 'Lija la cara (1 m²)', 'O'], ['Sostiene la pieza', 'S', 'Lija los cantos', 'O'], ['Gira la pieza', 'O', 'Espera', 'D'], ['Sostiene la pieza', 'S', 'Lija la otra cara', 'O'], ['Deja la pieza en el carro', 'T', 'Deja la lijadora', 'O']],
    propuesto: [['Toma la pieza del carro', 'O', 'Toma la lijadora', 'O'], ['Apoya la pieza contra los topes de la mesa', 'T', 'Enciende la aspiración', 'O'], ['Guía la lijadora con la segunda mano', 'O', 'Lija la cara (1 m²)', 'O'], ['Guía la lijadora', 'O', 'Lija los cantos sobre la escuadra', 'O'], ['Voltea la pieza sobre los topes', 'O', 'Sostiene la lijadora', 'S'], ['Guía la lijadora', 'O', 'Lija la otra cara', 'O'], ['Deja la pieza en el carro', 'T', 'Deja la lijadora', 'O']]
  };
  function sec10() {
    const cnt = (rows, i) => { const c = { O: 0, T: 0, D: 0, S: 0 }; rows.forEach((r) => c[r[i]]++); return c; };
    const sym = { O: '○', T: '⇒', D: 'D', S: '▽' };
    const chart = (rows, t) => '<div class="n2-bim"><h4>' + t + '</h4><table><thead><tr><th>Mano izquierda</th><th></th><th></th><th>Mano derecha</th></tr></thead><tbody>' + rows.map((r) => '<tr><td>' + esc(r[0]) + '</td><td class="sym"><b class="s-' + r[1] + '">' + sym[r[1]] + '</b></td><td class="sym"><b class="s-' + r[3] + '">' + sym[r[3]] + '</b></td><td>' + esc(r[2]) + '</td></tr>').join('') + '</tbody></table></div>';
    const a = [cnt(BIM.actual, 1), cnt(BIM.actual, 3)], b = [cnt(BIM.propuesto, 1), cnt(BIM.propuesto, 3)];
    return head('10') +
      '<p class="n1-lead">La operación más repetitiva de la planta es <b>lijar</b>: unos 87 m² de caras por juego, dos veces (antes del sellador y entre manos), con cientos de piezas. Hoy la mano izquierda hace de prensa: sostiene la pieza todo el ciclo. El dispositivo la libera.</p>' +
      '<div class="n2-bims">' + chart(BIM.actual, 'Método actual: una pieza, las dos caras') + chart(BIM.propuesto, 'Método propuesto, con la mesa de lijado con topes') + '</div>' +
      tbl(['Resumen', 'Izquierda actual', 'Izquierda propuesta', 'Derecha actual', 'Derecha propuesta'], [['Operaciones ○', 'O'], ['Transportes ⇒', 'T'], ['Esperas D', 'D'], ['Sostenimientos ▽', 'S']].map((r) => '<tr><td>' + r[0] + '</td><td class="r mono">' + a[0][r[1]] + '</td><td class="r mono">' + b[0][r[1]] + '</td><td class="r mono">' + a[1][r[1]] + '</td><td class="r mono">' + b[1][r[1]] + '</td></tr>')) +
      '<h3>Dispositivo: mesa de lijado con topes y aspiración</h3>' +
      '<div class="n2-dev"><div class="n2-devd">' + devSVG() + '</div><div><ul class="plain"><li><b>Tablero perforado</b> de MDF de 18 mm, 3.00 × 1.20 m, con agujeros de 20 mm cada 96 mm y una caja de aspiración debajo conectada a la aspiradora: la succión pega la pieza a la mesa.</li><li><b>Topes de 20 mm</b> que entran en cualquier agujero: la pieza se apoya contra dos topes y no se corre al lijar.</li><li><b>Escuadra abatible</b> en un lado, para lijar cantos con la pieza vertical.</li><li><b>Altura de 0.85 m</b>, unos 13 cm bajo el codo del P50 de mujeres (97.8 cm): lijar empuja hacia abajo (CCOHS, trabajo pesado: 20 a 40 cm bajo el codo; trabajo ligero: 5 a 10 cm). Patas regulables de ±50 mm.</li><li>Se fabrica en la misma planta con retazos de MDF y la aspiradora Karcher NT30.</li></ul><p class="n1-note">Efecto: la mano izquierda deja de sostener (de 3 sostenimientos a 0) y pasa a guiar la lijadora; la derecha deja de esperar. El tiempo de lijado de la tabla de datos tipo (4 min/m²) ya supone la mesa con topes.</p></div></div>';
  }
  function devSVG() {
    let s = '<svg viewBox="0 0 320 212" class="n2-dsvg" role="img" aria-label="Mesa de lijado con topes"><defs><pattern id="dvh" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.2" fill="#bbb"/></pattern></defs>';
    s += '<path d="M40 70 L250 50 L300 90 L90 115 Z" fill="url(#dvh)" stroke="#111" stroke-width="1.4"/>';
    s += '<path d="M90 115 L90 123 L300 98 L300 90" fill="#e8e6e1" stroke="#111" stroke-width="1.2"/><path d="M40 70 L40 78 L90 123" fill="none" stroke="#111" stroke-width="1.2"/>';
    s += '<path d="M95 122 L95 185 M285 100 L285 165 M45 77 L45 140" stroke="#111" stroke-width="3"/>';
    s += '<path d="M120 80 L200 72 L222 90 L142 99 Z" fill="#f3efe6" stroke="#111" stroke-width="1.2"/>';
    s += '<rect x="203" y="70" width="6" height="12" fill="#c25700"/><rect x="222" y="86" width="6" height="12" fill="#c25700"/>';
    s += '<path d="M240 55 L250 50 L250 30 L240 35 Z" fill="#ddd" stroke="#111"/>';
    s += '<path d="M95 150 C 60 160 40 175 20 190" fill="none" stroke="#555" stroke-width="5" stroke-linecap="round"/>';
    s += '<text x="150" y="140" font-size="11" font-family="Inter,Arial">Pieza</text><path d="M170 132 L170 92" stroke="#111"/><text x="212" y="120" font-size="11" font-family="Inter,Arial">Topes</text><path d="M222 110 L222 96" stroke="#111"/><text x="236" y="22" font-size="11" font-family="Inter,Arial">Escuadra</text><text x="30" y="207" font-size="11" font-family="Inter,Arial">A la aspiradora</text><text x="8" y="36" font-size="11" font-family="Inter,Arial">Tablero perforado con vacío</text><path d="M70 40 L82 64" stroke="#111"/>';
    return s + '</svg>';
  }
  /* ------------------------------------------------ 6 · máquinas */
  function sec6() {
    const t = tiempos(), M = N2.maquinas, R = t.R;
    const rows = M.map((m) => { const h = (t.est[m.e] || 0) / 60; return '<tr><td><b>' + esc(m.t) + '</b><small>' + esc(m.para) + '</small></td><td>' + esc(m.m) + '<small>' + esc(m.ficha) + '</small>' + (m.alt ? '<small>' + esc(m.alt) + '</small>' : '') + '</td><td class="r mono">' + m.n + '</td><td>' + esc(ESTN()[m.e]) + '<small>' + nf(h, 1) + ' h por juego · ' + nf(h / R.ritmo * 100, 0) + ' % del ritmo</small></td><td class="r mono">' + (m.p ? cop(m.p * m.n) : 'Por cotizar') + '<small><a href="' + esc(m.u) + '" target="_blank" rel="noopener">' + esc(m.prov) + '</a></small></td></tr>'; });
    const total = M.reduce((a, m) => a + m.p * m.n, 0);
    return head('6') +
      '<p class="n1-lead">Una máquina por operación del proceso, con la ficha del fabricante o de la tienda (consultada el 17 de octubre de 2026). Ninguna máquina queda sin una operación que la use, y cada una tiene su carga frente al ritmo.</p>' +
      tbl(['Máquina', 'Modelo y ficha', '.Cant.', 'Estación y carga', '.Precio'], rows) +
      '<p class="n1-note">Inversión en máquinas con precio publicado: ' + cop(total) + ' (más el extractor de la cabina y la enchapadora, por cotizar). Con el volumen de un juego por mes, ninguna máquina pasa del 10 % de uso: se eligió equipo de taller y no industrial.</p>' +
      '<div class="n1-box n1-chg"><b>Lo que las fichas obligaron a cambiar</b><ul>' +
      '<li><b>Despiece de tableros:</b> la mesa de la sierra Bosch GTS 254 mide 555 × 555 mm y un tablero de 1.83 × 2.44 m pesa unos 50 kg. Se agrega la sierra circular con guía para partir el tablero en tiras sobre una mesa de corte; la sierra de mesa hace los cortes finales.</li>' +
      '<li><b>Compresor y pistola:</b> la pistola HVLP pide 6.3 CFM y el compresor de 100 L da unos 4.4 CFM. Con este par se laca por intervalos; se cotiza un compresor de más de 6.3 CFM reales o una pistola de menor consumo (pendiente, Nota 3).</li>' +
      '<li><b>Extractor de la cabina:</b> con una cara abierta de 2.4 × 2.2 m y 100 pies por minuto (OSHA 1910.107, referencia) hacen falta unos 5700 CFM, con rotor antichispa y motor fuera de la corriente. Ningún extractor de tienda lo declara: se cotiza a un fabricante de cabinas.</li>' +
      '<li><b>Laca:</b> la ficha de la laca Renania de la Nota 1 no está publicada (solo la tienda dice 6 h entre manos). Se cambia por la laca y el sellador catalizados al ácido de Pintuco (Madetec), con ficha completa: 1 h entre manos y 45 m²/galón.</li></ul></div>';
  }
  /* ------------------------------------------------ 15 · ergonomía */
  const PUESTOS = [
    { t: 'Sierra y despiece', quien: 'Ebanista', tarea: 'Despiezar tableros, cortar a medida, mover tableros', alt: 'Mesa de la sierra a 0.84–1.00 m con mesas de apoyo a la misma altura; rack vertical con el borde de carga a 0.30 m', med: [['codo', 'Mesa unos 10 cm bajo el codo del P50 de hombres (106.5 cm): trabajo ligero de pie (CCOHS)'], ['alcanceF', 'El empujador evita estirar el brazo más allá de 61 cm (P5 de mujeres) hacia el disco']], carga: 'Tablero de unos 50 kg: siempre entre dos y con carro (ítem 14)' },
    { t: 'Lijado', quien: 'Auxiliar de acabados', tarea: 'Lijar caras y cantos', alt: 'Mesa de lijado con topes a 0.85 m, regulable ±50 mm', med: [['codo', '13 cm bajo el codo del P50 de mujeres (97.8 cm): se empuja hacia abajo'], ['alcanceF', 'Piezas de más de 0.6 m de ancho se giran en vez de estirarse']], carga: 'Lijadora de 1.3 kg; pausas cada 50 minutos' },
    { t: 'Cabina de lacado', quien: 'Auxiliar de acabados', tarea: 'Aplicar sellador y laca a pistola', alt: 'Caballetes regulables de 0.70 a 0.95 m; la pieza se gira, no el cuerpo', med: [['ojos', 'Luz rasante a la altura de los ojos (136–168 cm) para ver chorreados'], ['alcanceV', 'Rack de secado con el nivel más alto a 1.70 m (alcance del P5 de mujeres)']], carga: 'Pistola de 600 cc llena, unos 1.2 kg (estimado)' },
    { t: 'Armado y premontaje', quien: 'Ebanista', tarea: 'Encolar, atornillar, instalar herrajes', alt: 'Mesas de premontaje a 0.90 m; los muebles altos se arman acostados', med: [['codo', '0.90 m: 5 a 10 cm bajo el codo del P50 de mujeres (trabajo ligero)'], ['alcanceF', 'Mesa de 1.60 m de fondo trabajada desde los dos lados (0.80 m por lado)']], carga: 'Taladro de 1.65 kg' },
    { t: 'Banco eléctrico', quien: 'Ebanista', tarea: 'Cortar, soldar y probar los tramos de LED', alt: 'Banco a 1.00 m con taburete alto; lupa con luz', med: [['codo', 'Trabajo de precisión: unos 5 cm sobre el codo del P50 de mujeres (CCOHS)'], ['ojos', 'Lupa con luz a la altura de trabajo']], carga: 'Sin cargas' }
  ];
  function sec15() {
    const A = L.nota1.antro, t = tiempos(), op = operarios(t);
    return head('15') +
      '<p class="n1-lead">Fichas de los puestos críticos con medidas en centímetros, según los principios de la NTP-ISO 6385:2023: el puesto se ajusta a la persona y no al revés. Las medidas del cuerpo son las de Acopla95 (Nota 1, elemento C).</p>' +
      '<div class="n2-puestos">' + PUESTOS.map((p) => '<article class="n1-card"><header><div><h4>' + esc(p.t) + '</h4><small>' + esc(p.quien) + ' · ' + esc(p.tarea) + '</small></div></header><dl class="n1-dl sm"><div><dt>Diseño del puesto</dt><dd>' + esc(p.alt) + '</dd></div><div><dt>Cargas</dt><dd>' + esc(p.carga) + '</dd></div></dl><ul class="n1-meds">' + p.med.map((m) => '<li><b>' + esc(A[m[0]].t) + '</b> <span class="mono">P5 ' + nf(A[m[0]].p5, 1) + ' · P95 ' + nf(A[m[0]].p95, 1) + ' cm</span><p>' + esc(m[1]) + '</p></li>').join('') + '</ul></article>').join('') + '</div>' +
      '<h3>Número de operarios</h3><p class="n1-box">' + nf(t.trabajo, 1) + ' h de trabajo por juego ÷ (' + nf(t.R.ritmo, 1) + ' h de ritmo × 0.85) = ' + nf(op.necesarios, 2) + ' personas. Se asignan <b>1.5 personas</b>: el ebanista (corte, fresado, curvado, tapas, armado, luz y empaque) y un auxiliar de acabados de medio tiempo (lijado y lacado), porque el tablero se carga entre dos y nadie laca solo.</p>';
  }

  /* ------------------------------------------------ 5 · distribución en planta */
  function viajes() {
    const PL = L.planta, n = CO.piezas(V).length, tab = CO.plan(V).reduce((a, m) => a + m.boards.length, 0);
    const carro = 40, cargas = Math.ceil(n / carro);
    const T = [
      ['ALM', 'SIE', tab, 'tableros, uno por viaje entre dos personas'], ['SIE', 'FRE', Math.ceil(cargas * 0.5), 'carros con las piezas que se ranuran'], ['FRE', 'CUR', 1, 'carro de costillas y pieles'], ['CUR', 'LIJ', cargas, 'carros de piezas a lijar'],
      ['LIJ', 'LAC', cargas * 3, 'tres pasadas: sellador, primera y segunda mano'], ['LAC', 'SEC', cargas * 3, 'a los racks después de cada mano'], ['SEC', 'LIJ', cargas * 2, 'vuelta a lijar entre manos'], ['SEC', 'ARM', cargas, 'piezas lacadas al premontaje'],
      ['ALM', 'ROV', 4, 'tableros de Rovere'], ['ROV', 'ARM', 2, 'tapas terminadas'], ['ALM', 'ELE', 1, 'rollos de LED y fuentes'], ['ELE', 'ARM', 1, 'tramos probados'], ['ARM', 'EMP', 12, 'un mueble por viaje'], ['EMP', 'APT', 20, 'bultos empacados']
    ];
    return T.map((t) => { const d = PL.dist(t[0], t[1]); return { a: t[0], b: t[1], v: t[2], d, tot: d * t[2], q: t[3] }; });
  }
  function sec5() {
    const PL = L.planta, ids = PL.relIds, col = { A: '#d13b2a', E: '#f0a23a', I: '#2f9e44', O: '#0b63c4', U: '#c7c7cc', X: '#1d1d1f' };
    let m = '<div class="n2-rel"><table><tbody>';
    ids.forEach((a, i) => { m += '<tr><th>' + a + '</th>' + ids.map((b, j) => j <= i ? '<td class="e"></td>' : (() => { const r = PL.rel(a, b); return '<td title="' + esc(PL.area(a).t + ' · ' + PL.area(b).t + ': ' + r[0] + (r[1] ? ' (' + PL.motivos[r[1]] + ')' : '')) + '" style="--c:' + col[r[0]] + '"><b>' + r[0] + '</b>' + (r[1] ? '<i>' + r[1] + '</i>' : '') + '</td>'; })()).join('') + '<td class="nm">' + esc(PL.area(a).t) + '</td></tr>'; });
    m += '</tbody></table></div>';
    const vj = viajes(), tot = vj.reduce((a, x) => a + x.tot, 0);
    return head('5') +
      '<p class="n1-lead">Primero se escribe qué tan importante es que dos áreas estén juntas y por qué (matriz de relaciones, planeación sistemática de la distribución, Chase et al., 2009, cap. 7A); después se acomodan las áreas en la bodega para que las relaciones A y E queden pegadas y las X separadas.</p>' +
      '<h3>Matriz de relaciones</h3>' + m +
      '<p class="n1-note">A absolutamente necesaria · E especialmente importante · I importante · O ordinaria · U sin importancia · X indeseable. Motivos: ' + Object.keys(PL.motivos).map((k) => k + ' ' + PL.motivos[k].toLowerCase()).join(' · ') + '. La relación X entre lijado y lacado no significa lejos: significa separados por la pared de la cabina, porque el polvo arruina la laca.</p>' +
      '<h3>Plano propuesto, con los dos recorridos</h3><div class="n1-sheet n2-plan">' + PL.svg() + '</div>' +
      '<h3>Tabla de distancias <small>recorridos de un juego, por los pasillos, entre los centros de las áreas</small></h3>' +
      tbl(['De', 'A', 'Qué se mueve', '.Distancia', '.Viajes', '.Recorrido'], vj.map((x) => '<tr><td><b>' + x.a + '</b> ' + esc(PL.area(x.a).t) + '</td><td><b>' + x.b + '</b> ' + esc(PL.area(x.b).t) + '</td><td>' + esc(x.q) + '</td><td class="r mono">' + nf(x.d, 1) + ' m</td><td class="r mono">' + x.v + '</td><td class="r mono">' + nf(x.tot, 0) + ' m</td></tr>').concat(['<tr class="n1-tot"><td colspan="5"><b>Total por juego</b></td><td class="r mono"><b>' + nf(tot, 0) + ' m</b></td></tr>'])) +
      '<p class="n1-note">Distancia rectilínea entre los centros de las áreas (estimado). Viajes: tableros uno a uno; piezas en carros de unas 40 piezas; el lacado da tres vueltas por lijado, cabina y secado. Las medidas de la bodega son las de una bodega típica de la zona y se verifican con el local de la Carrera 11 N.º 3-36.</p>';
  }
  /* ------------------------------------------------ 12 · almacenamiento */
  function sec12() {
    const pl = CO.plan(V), tab = pl.reduce((a, m) => a + m.boards.length, 0), piezas = CO.piezas(V).length;
    const vol = H().FABN.reduce((a, k) => { const d = (VS.items[V][k].dims.match(/\d+\.\d+/g) || []).map(Number); return a + (d.length >= 3 ? d[0] * d[1] * d[2] : 0.05); }, 0);
    const PL = L.planta, ar = (id) => PL.area(id).r[2] * PL.area(id).r[3];
    return head('12') +
      '<p class="n1-lead">Dónde se guardan la materia prima, el producto en proceso y el producto terminado, dimensionado para el lote de un juego. Un mueble armado ocupa mucho más que sus piezas: por eso el juego se despacha desarmado por módulos.</p>' +
      tbl(['Zona', 'Qué guarda', 'Cuánto, por lote', 'Cómo', '.Área'], [
        '<tr><td><b>ALM</b> materia prima</td><td>Tableros de MDF, Rovere y acrílico</td><td>' + tab + ' tableros de 1.83 × 2.44 m o 2.15 × 2.44 m</td><td>Rack vertical contra el muro izquierdo: los tableros de pie no se pandean y se sacan sin mover los demás</td><td class="r mono">' + nf(ar('ALM'), 1) + ' m²</td></tr>',
        '<tr><td><b>ALM</b> insumos</td><td>Herrajes, cantos, LED, fuentes, empaque</td><td>Lo de un juego, más un 10 % de reserva</td><td>Estante con cajas rotuladas por mueble</td><td class="r mono">incl.</td></tr>',
        '<tr><td><b>LAC</b> inflamables</td><td>Laca, sellador, catalizador y thinner</td><td>9 galones de laca por juego, más sellador</td><td>Gabinete metálico para inflamables dentro de la cabina, lejos del compresor</td><td class="r mono">0.6 m²</td></tr>',
        '<tr><td><b>SIE</b> en proceso</td><td>Piezas cortadas</td><td>' + piezas + ' piezas por juego</td><td>Carros numerados por mueble, de unas 40 piezas cada uno</td><td class="r mono">' + nf(1.7, 1) + ' m²</td></tr>',
        '<tr><td><b>SEC</b> en proceso</td><td>Piezas recién lacadas</td><td>Unos 87 m² de caras lacadas por juego</td><td>Dos racks de secado de varios niveles: las piezas no se tocan entre sí mientras secan</td><td class="r mono">' + nf(ar('SEC'), 1) + ' m²</td></tr>',
        '<tr><td><b>APT</b> terminado</td><td>Juego desarmado y empacado</td><td>Unos ' + nf(vol, 1) + ' m³ armado; desarmado por módulos, cerca de ' + nf(vol * 0.45, 1) + ' m³ (estimado)</td><td>Bultos rotulados con local y mueble, sobre estiba, junto al portón</td><td class="r mono">' + nf(ar('APT'), 1) + ' m²</td></tr>',
        '<tr><td><b>FRE</b> retazos</td><td>Retazos de más de 300 mm</td><td>El sobrante del último tablero de cada material</td><td>Estante por medida, para el juego siguiente</td><td class="r mono">incl.</td></tr>'
      ]) +
      '<p class="n1-note">Volumen armado: suma de las medidas exteriores de los muebles. El factor de 0.45 para el juego desarmado es un estimado del grupo (los cuerpos de tablero viajan planos o por módulos), y se verifica empacando el primer juego.</p>';
  }
  function sec13() {
    return head('13') +
      '<p class="n1-lead">El estándar 5S de la planta: cada punto con la solución de diseño que lo hace posible, no solo con la regla (Nava-Martínez et al., 2017).</p>' +
      tbl(['S', 'Qué se busca', 'Solución en la planta'], N2.s5.map((r) => '<tr><td><b>' + esc(r.s) + '</b></td><td>' + esc(r.p) + '</td><td>' + esc(r.d) + '</td></tr>')) +
      '<h3>Lista de chequeo semanal</h3><ul class="n1-check">' + ['¿Hay en la planta algo que no se usó en el juego del mes?', '¿Cada herramienta está en su silueta?', '¿Los retazos están en el estante por medida?', '¿El colector de polvo se vació y los filtros están limpios?', '¿Los pasillos de 1.20 m están despejados?', '¿Las latas de laca y thinner están cerradas en el gabinete de inflamables?', '¿Las fichas de puesto y las hojas de seguridad están a la vista?', '¿Se hizo la limpieza de cierre de cada día?'].map((q) => '<li><i></i><span>' + esc(q) + '</span><em>Sí · No</em></li>').join('') + '</ul>';
  }
  function sec14() {
    const rows = N2.gtc45.map((r) => { const np = r.nd * r.ne, nr = np * r.nc, lv = N2.nivelGTC(nr); return '<tr><td><b>' + esc(r.area) + '</b><small>' + esc(r.act) + '</small></td><td>' + esc(r.clase) + '</td><td>' + esc(r.peligro) + '<small>' + esc(r.efecto) + '</small></td><td class="r mono">' + r.nd + '</td><td class="r mono">' + r.ne + '</td><td class="r mono">' + np + '</td><td class="r mono">' + r.nc + '</td><td class="r mono"><b>' + nr + '</b></td><td><span class="n2-nr nr-' + lv + '">' + lv + '</span></td><td><small><b>Ingeniería:</b> ' + esc(r.control.ing) + '</small><small><b>Administrativo:</b> ' + esc(r.control.adm) + '</small><small><b>EPP:</b> ' + esc(r.control.epp) + '</small></td></tr>'; });
    return head('14') +
      '<p class="n1-lead">Peligros de la planta y su control, con la metodología de la GTC 45 (ICONTEC, 2012): nivel de riesgo = nivel de deficiencia × nivel de exposición × nivel de consecuencia. El control se elige primero en el diseño (ingeniería) y solo al final en el elemento de protección personal.</p>' +
      tbl(['Área y actividad', 'Clase', 'Peligro y efecto', '.ND', '.NE', '.NP', '.NC', '.NR', 'Nivel', 'Control'], rows, 'n2-gtc') +
      '<p class="n1-note">ND: 10 muy alto, 6 alto, 2 medio. NE: 4 continua, 3 frecuente, 2 ocasional, 1 esporádica. NC: 100 mortal, 60 muy grave, 25 grave, 10 leve. Nivel de riesgo: I (600 a 4000) no aceptable; II (150 a 500) no aceptable o aceptable con control específico; III (40 a 120) mejorable; IV (20) aceptable. El polvo de madera y el formaldehído están clasificados como cancerígenos (IARC, 2012).</p>';
  }
  function sec16() {
    return head('16') +
      '<p class="n1-lead">Dónde y con qué criterio se inspecciona: no solo al final. Cada punto de inspección está en el diagrama de operaciones (ítem 8) y en el cursograma (ítem 9).</p>' +
      tbl(['Punto', 'Dónde', 'Qué se revisa', 'Criterio de aceptación', 'Cómo'], N2.calidad.map((c) => '<tr><td class="mono"><b>' + esc(c.k === 'inspFinal' ? 'Final' : c.k === 'inspCorte' ? 'Corte' : c.k === 'inspAcab' ? 'Acabado' : c.k === 'inspCanto' ? 'Canto' : c.k === 'probarLed' ? 'Luz' : 'Recepción') + '</b></td><td>' + esc(c.en) + '</td><td>' + esc(c.que) + '</td><td>' + esc(c.crit) + '</td><td>' + esc(c.como) + '</td></tr>')) +
      '<h3>Hoja de verificación prevista <small>una por mueble, en el premontaje (Tague, hoja de verificación)</small></h3>' +
      '<div class="n2-sheet"><div class="n2-sh-h"><b>BlackForge Muebles · Hoja de verificación del mueble</b><span>Juego n.º ___ · Local ________ · Mueble ___ · Fecha ___ · Inspector ___</span></div>' +
      tbl(['Defecto', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Total'], ['Medida fuera de tolerancia', 'Escuadra (diagonales)', 'Chorreado o piel de naranja', 'Partículas en la laca', 'Canto despegado o mal refilado', 'Puerta o cajón desalineado', 'Herraje faltante', 'Tramo de luz apagado', 'Golpe o rayón'].map((d) => '<tr><td>' + esc(d) + '</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>')) + '</div>' +
      '<p class="n1-note">Con las hojas de los primeros juegos se arma un diagrama de Pareto para saber qué defecto atacar primero.</p>';
  }
  function pend(id, what) { return head(id) + '<div class="n1-empty"><p>En preparación.</p><ul>' + what.map((w) => '<li>' + esc(w) + '</li>').join('') + '</ul></div>'; }
  function secX() {
    const CH = [
      ['Ficha de la empresa, volumen, plazo y ritmo requerido', 'K'], ['Tabla de fabricar o comprar y tipo de producción', 'N'], ['Hipótesis de producción, escrita antes de calcular', '2'], ['Localización con proveedores y obra', '3'],
      ['Matriz de relaciones, plano propuesto y los dos recorridos', '5'], ['Máquinas con su ficha', '6'], ['Tabla de piezas, análisis del valor y planes de corte', '7'], ['Diagramas de operaciones y de flujo de los muebles', '8'],
      ['Cursogramas con totales y tabla VA/NVA', '9'], ['Bimanual y dispositivos de sujeción', '10'], ['Tiempos con fuente y cuello de botella frente al ritmo', '11'], ['Zonas de almacenamiento', '12'], ['Estándar 5S, matriz GTC 45 y fichas de puesto', '13'], ['Plan de inspección', '16'], ['Hipótesis contrastada y tabla de rastreo', '17']
    ];
    const st = (s) => SECS.find((x) => x.id === s).st;
    return head('X') + '<ul class="n1-check">' + CH.map((c) => '<li class="c-' + st(c[1]) + '"><i></i><span>' + esc(c[0]) + '</span><button type="button" class="link" data-n1sec="' + c[1] + '">' + c[1] + ' · ' + esc(SECS.find((x) => x.id === c[1]).t) + '</button><em>' + ST_TXT[st(c[1])] + '</em></li>').join('') + '</ul>' +
      '<h3>Hitos de la guía</h3>' + tbl(['Hito', 'Fecha', 'Qué debe estar listo'], [['H4', 'mié 4 nov.', 'La empresa (J a O) y el proceso (ítems 1, 2, 7 y 8)'], ['H5', 'vie 6 nov.', 'Métodos, tiempos y capacidad (ítems 9 a 11)'], ['H6', 'mié 11 nov.', 'La planta completa (ítems 3 a 6 y 12 a 16)'], ['H7', 'vie 13 nov.', 'Coherencia (ítem 17), proveedores, costos y ensayo'], ['H8', 'mié 18 nov.', 'Entrega final y socialización · Notas 2 y 3']].map((r) => '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>'));
  }

  function render(id) {
    ST.sec = id;
    switch (id) {
      case 'J': return secJ();
      case 'K': return secK();
      case 'N': return secN();
      case 'O': return secO();
      case '2': return sec2();
      case '7': return sec7();
      case '8': return sec8();
      case 'X': return secX();
      case '13': return sec13();
      case '5': return sec5();
      case '6': return sec6();
      case '3': return sec3();
      case '17': return sec17();
      case '9': return sec9();
      case '10': return sec10();
      case '11': return sec11();
      case '15': return sec15();
      case '12': return sec12();
      case '14': return sec14();
      case '16': return sec16();
      case '3': return pend('3', ['Tabla de factores con peso y calificación: Villanueva frente a otras ciudades', 'Mapa con proveedores, planta y locales de la cadena']);
      case '5': return pend('5', ['Matriz de relaciones entre áreas', 'Plano de la planta a escala con los recorridos del material y del operario', 'Tabla de distancias']);
      case '6': return pend('6', ['Inventario de máquinas por operación, con la ficha del fabricante']);
      case '9': return pend('9', ['Cursograma analítico del método propuesto, con fila de totales', 'Tabla VA/NVA y examen crítico']);
      case '10': return pend('10', ['Diagrama bimanual de la operación más repetitiva', 'Plantilla o dispositivo de sujeción']);
      case '11': return pend('11', ['Tabla de tiempos con la fuente de cada uno', 'Cuello de botella frente al ritmo requerido']);
      default: return pend(id, ['En preparación']);
    }
  }
  function after(id) {
    if (id === '7') {
      const pl = CO.plan(V), jobs = $$('[data-cut]');
      let i = 0; const run = () => { if (i >= jobs.length || L.n1.state.nota !== 2) return; const el = jobs[i++], p = el.dataset.cut.split(':'); el.innerHTML = CO.svg(pl[+p[0]], +p[1]); requestAnimationFrame(run); };
      requestAnimationFrame(run);
    }
  }
  function click(e) {
    const nb = e.target.closest('[data-n2n]');
    if (nb) { ST.n = +nb.dataset.n2n; const b = $('#n1-body'), top = b.scrollTop; L.n1.render(); b.scrollTop = top; return true; }
    return false;
  }
  L.notaMods = L.notaMods || {};
  L.notaMods[2] = { titulo: 'Nota 2 · Sistema de producción', sub: 'Planta de Villanueva (Casanare) · 12 juegos de la versión B en 2027 · entrega del 18 de noviembre', secs: SECS, render, after, click, ritmo, festivos };
})();
