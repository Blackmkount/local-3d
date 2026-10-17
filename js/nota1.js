/* ============================================================================
   NOTA 1 · DISEÑO DEL MOBILIARIO — la entrega del primer hito de la guía, en
   una vista a pantalla completa con los elementos A a I y la lista de chequeo.
   Los datos están en nota1-data.js; los costos y requisitos, en versions.js;
   los planos se dibujan desde el modelo 3D (dwg.js).
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cop = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const f1 = (v) => v.toFixed(1).replace('.', ',');
  const N = L.nota1, VS = L.versions, DATA = L.data;
  const FABN = DATA.items.filter((i) => i.origen === 'fabrica').map((i) => i.n);
  const base = {}; DATA.items.forEach((i) => { base[i.n] = i; });
  const VER = ['A', 'B', 'C'];
  const ST = { open: false, sec: 'A', ver: 'A', n: 2, from: null };

  const SECS = [
    { id: 'A', t: 'Proyecto', d: 'Ficha del proyecto', st: 'ok' },
    { id: 'B', t: 'Plano a escala', d: 'Plano del local acotado y referencia de escalado', st: 'ok' },
    { id: 'C', t: 'Requisitos', d: 'Requisitos de cada mueble con su fuente', st: 'ok' },
    { id: 'D', t: 'Alternativas', d: 'Tres alternativas por mueble y matriz de selección', st: 'ok' },
    { id: 'E', t: 'Planos técnicos', d: 'Planos de conjunto y despiece explosionado', st: 'parcial' },
    { id: 'F', t: 'Despiece', d: 'Despiece y lista de materiales', st: 'parcial' },
    { id: 'G', t: 'Materiales y uniones', d: 'Materiales con su formato comercial y detalle de las uniones', st: 'pendiente' },
    { id: 'H', t: 'Iluminación y equipo', d: 'Fichas, alojamiento, cableado y mantenimiento', st: 'pendiente' },
    { id: 'I', t: 'Renders', d: 'Cada mueble en su espacio, con la luz y el equipo', st: 'pendiente' },
    { id: 'K', t: 'Lista de chequeo', d: 'Lista de chequeo de la guía (numeral 10)', st: '' }
  ];
  const ST_TXT = { ok: 'Listo', parcial: 'En avance', pendiente: 'Pendiente' };
  const SHORT = { acopla: 'Acopla95', ntc4140: 'NTC 4140', nsr10k: 'NSR-10, K.3', nsr10k4: 'NSR-10, K.4', d1538: 'Decreto 1538', retie: 'RETIE 2026', ccohs: 'CCOHS', ntp242: 'NTP 242', nicolas: 'Nicolás (2011)', ntc6047: 'NTC 6047', ada: 'ADA 2010', plano: 'Documento del proyecto', catalogo: 'Catálogos', fichaP1S: 'Ficha Bambu Lab P1S', criterio: 'Criterio del grupo' };
  const TIPO = { fuente: 'Fuente', secundaria: 'Fuente secundaria', estimado: 'Estimado', encargo: 'Encargo', no: 'No obtenido' };

  /* nombre de cada mueble por su función: es el mismo en las tres alternativas */
  const ROLE = { 2: 'Estantería de muro', 3: 'Exhibidor central', 4: 'Pieza destacada', 5: 'Atención y diseño', 7: 'Mueble de impresoras', 9: 'Repisa de filamento', 10: 'Cajonera de taller', 11: 'Panel de herramientas', 12: 'Vitrina mural', 13: 'Estantería de entrada', 15: 'Mampara', 17: 'Escritorio' };
  const vinfo = (v) => VS.list.find((x) => x.id === v);
  const itemOf = (v, n) => { const it = VS.items[v] && VS.items[v][n], b = base[n]; return { name: (it && it.name) || b.name, short: (it && it.short) || b.short, dims: (it && it.dims) || b.dims, it: it || {} }; };
  const vtag = (v, cls) => '<span class="n1-vt' + (cls ? ' ' + cls : '') + '" style="--vc:' + vinfo(v).color + '">' + v + '</span>';
  const tipoTag = (t) => '<span class="n1-tipo t-' + t + '">' + esc(TIPO[t] || t) + '</span>';
  const stIcon = (s) => '<i class="n1-st s-' + s + '" aria-label="' + ({ si: 'Cumple', parcial: 'Cumple con salvedad', no: 'No cumple' }[s] || s) + '"></i>';

  /* ------------------------------------------------ D · matriz de selección */
  const OFICIO = {
    rovere15: 'Carpintería de tablero', blanca15: 'Carpintería de tablero', fondo6: 'Carpintería de tablero', mdf15: 'Carpintería de tablero', mdf55: 'Carpintería de tablero', hpl: 'Carpintería de tablero', canto: 'Carpintería de tablero', cantoRovere: 'Carpintería de tablero', contacto: 'Carpintería de tablero', pegante: 'Carpintería de tablero',
    perforada: 'Metalmecánica', tubo1: 'Metalmecánica', tubo15: 'Metalmecánica', tuboRect: 'Metalmecánica', anticorr: 'Pintura', laca: 'Lacado',
    perfil3030: 'Ensamble de perfilería', pvc10: 'Corte de plásticos', pvc5: 'Corte de plásticos', acril3: 'Corte de plásticos', opal3: 'Corte de plásticos',
    vidrio10: 'Vidriería', vidrio6: 'Vidriería', petg: 'Impresión 3D', perfilLed: 'Instalación eléctrica', cob: 'Instalación eléctrica'
  };
  function features(v, n) {
    const it = VS.items[v][n], P = VS.precios;
    const of = new Set(); let piezas = 0, best = null, bestA = -1, bestB = null, bestL = -1;
    it.piezas.forEach((p) => {
      const pr = P[p[0]]; if (OFICIO[p[0]]) of.add(OFICIO[p[0]]);
      if (pr.tipo === 'kg') { piezas += 1; return; }
      piezas += p[2];
      if (pr.tipo === 'lamina' || pr.tipo === 'm2') { const a = p[2] * p[3] * (p[4] || 1); if (a > bestA && !/fondo/i.test(p[1]) && p[0] !== 'fondo6') { bestA = a; best = p[0]; } }
      else if (pr.tipo === 'barra') { const l = p[2] * p[3]; if (l > bestL) { bestL = l; bestB = p[0]; } }
    });
    it.acabados.forEach((a) => { if (OFICIO[a[0]]) of.add(OFICIO[a[0]]); });
    const surf = best || bestB;
    const c = VS.cumple(n, v), req = c.reduce((a, x) => a + (x[0] === 'si' ? 1 : x[0] === 'parcial' ? 0.5 : 0), 0);
    return { oficios: Array.from(of), piezas, surf, dura: N.dura[surf] || [3, 'Sin dato'], req, reqN: c.length, costo: VS.calc(v).items[n].total, ens: (it.ens || []).length };
  }
  const matCache = {};
  function matrix(n) {
    if (matCache[n]) return matCache[n];
    const F = {}; VER.forEach((v) => { F[v] = features(v, n); });
    const min = (k) => Math.min.apply(null, VER.map((v) => F[v][k]));
    const sc = {};
    VER.forEach((v) => {
      const f = F[v];
      sc[v] = {
        req: 5 * f.req / f.reqN,
        costo: 5 * min('costo') / f.costo,
        fab: 5 * (0.5 * Math.min.apply(null, VER.map((x) => F[x].oficios.length)) / f.oficios.length + 0.5 * min('piezas') / f.piezas),
        dura: f.dura[0],
        mont: 5 * min('ens') / f.ens,
        marca: N.marca[v][0]
      };
      sc[v].total = N.criterios.reduce((a, c) => a + c.peso * sc[v][c.id], 0) / 100;
    });
    const win = VER.slice().sort((a, b) => sc[b].total - sc[a].total)[0];
    return (matCache[n] = { F, sc, win });
  }

  /* ------------------------------------------------ secciones */
  function secHead(id, extra) {
    const s = SECS.find((x) => x.id === id);
    return '<header class="n1-sh"><span class="n1-letter">' + id + '</span><div><h2>' + esc(s.d) + '</h2>' + (s.st ? '<span class="n1-badge b-' + s.st + '">' + ST_TXT[s.st] + '</span>' : '') + '</div>' + (extra || '') + '</header>';
  }
  function pickN(sel) {
    return '<div class="n1-pick" role="group" aria-label="Mueble">' + FABN.map((k) => '<button type="button" data-n1n="' + k + '" class="' + (k === sel ? 'is-on' : '') + '" title="' + esc(k + ' · ' + ROLE[k]) + '"><b>' + k + '</b><span>' + esc(ROLE[k]) + '</span></button>').join('') + '</div>';
  }
  function pickV() {
    return '<div class="seg seg-sm n1-pv" role="radiogroup" aria-label="Versión">' + VER.map((v) => '<button type="button" role="radio" data-n1v="' + v + '" class="' + (v === ST.ver ? 'is-on' : '') + '" aria-checked="' + (v === ST.ver) + '">' + v + ' · ' + esc(vinfo(v).corto) + '</button>').join('') + '</div>';
  }
  const fuenteRef = (id) => (id && N.fuentes[id] ? '<a href="#n1-f-' + id + '" class="n1-fref">' + esc(SHORT[id] || id) + '</a>' : '<span class="n1-fref">Estimado</span>');

  function secA() {
    const F = N.ficha;
    const row = (t, d, cls) => '<div class="' + (cls || '') + '"><dt>' + esc(t) + '</dt><dd>' + d + '</dd></div>';
    return secHead('A') +
      '<p class="n1-lead">' + esc(F.encargo) + '</p>' +
      '<dl class="n1-dl">' +
      row('Proyecto', esc(F.nombre)) + row('Tipo', esc(F.tipo)) + row('Ubicación', esc(F.ubicacion), /confirmar/.test(F.ubicacion) ? 'is-todo' : '') + row('Ciudad', esc(F.ciudad), /confirmar/i.test(F.ciudad) ? 'is-todo' : '') +
      row('Áreas', esc(F.area)) + row('Fachada', esc(F.fachada)) + row('Fuente del plano', esc(F.fuentePlano)) + row('Fecha de consulta', esc(F.consulta)) +
      row('Enlace del modelo', '<a href="' + esc(F.enlace) + '" target="_blank" rel="noopener">' + esc(F.enlace) + '</a>') + row('Repositorio', '<a href="' + esc(F.repositorio) + '" target="_blank" rel="noopener">' + esc(F.repositorio) + '</a>') +
      '</dl>' +
      '<h3>Espacios y muebles</h3><p class="n1-note">La guía pide tres espacios con un mueble cada uno; este proyecto diseña los doce muebles fabricados del local, repartidos en cuatro espacios, y cada uno en tres versiones.</p>' +
      '<div class="n1-tbl"><table><thead><tr><th>Espacio</th><th>Qué pasa ahí</th><th>Muebles</th></tr></thead><tbody>' +
      F.espacios.map((e) => '<tr><td><b>' + esc(e.t) + '</b></td><td>' + esc(e.d) + '</td><td>' + e.n.map((k) => '<span class="n1-chip">' + k + ' · ' + esc(ROLE[k]) + '</span>').join(' ') + '</td></tr>').join('') +
      '</tbody></table></div>' +
      '<h3>Uso de inteligencia artificial</h3><p class="n1-box">' + esc(F.ia) + '</p>';
  }
  function secB() {
    const E = N.escalado;
    return secHead('B', pickV()) +
      '<p class="n1-lead">' + esc(E.texto) + '</p>' +
      '<div class="n1-tbl"><table><thead><tr><th>Referencia</th><th>Cómo se usó</th><th>Dato</th></tr></thead><tbody>' +
      E.refs.map((r) => '<tr><td><b>' + esc(r.t) + '</b></td><td>' + esc(r.d) + '</td><td>' + tipoTag(r.tipo) + ' ' + fuenteRef(r.f) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p class="n1-note">' + esc(E.nota) + '</p>' +
      '<div class="n1-sheet" data-sheet="plan">' + L.plan.svg(ST.ver, { cotas: true, nums: true }) + '</div>' +
      '<p class="n1-note">Lámina A3 a escala 1:50 de la versión ' + ST.ver + '. Las tres versiones usan las mismas medidas del local; cambia la distribución. <button type="button" class="link" data-n1plan="1">Abrir el plano interactivo</button></p>';
  }
  function secC() {
    const A = N.antro, M = N.muebles[ST.n], it = itemOf(ST.ver, ST.n);
    const antro = '<div class="n1-tbl"><table><thead><tr><th>Medida (variable de Acopla95)</th><th class="r">P5 mujeres</th><th class="r">P50 mujeres</th><th class="r">P50 hombres</th><th class="r">P95 hombres</th></tr></thead><tbody>' +
      Object.keys(A).map((k) => { const a = A[k]; return '<tr><td>' + esc(a.t) + ' <span class="n1-mut">(variable ' + a.v + ')</span></td><td class="r mono">' + f1(a.p5) + '</td><td class="r mono">' + f1(a.p50m) + '</td><td class="r mono">' + f1(a.p50h) + '</td><td class="r mono">' + f1(a.p95) + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="n1-note">Centímetros, sin ropa ni calzado. ' + tipoTag('fuente') + ' ' + fuenteRef('acopla') + '. Se diseña para los dos extremos: lo que debe alcanzar la persona más baja (P5 de mujeres) y lo que debe dejar pasar a la más grande (P95 de hombres).</p>';
    const normas = '<div class="n1-tbl"><table><thead><tr><th>Requisito</th><th>Fuente</th>' + VER.map((v) => '<th>' + vtag(v) + ' ' + esc(vinfo(v).corto) + '</th>').join('') + '</tr></thead><tbody>' +
      N.normas.map((r) => '<tr><td><b>' + esc(r.t) + '</b><small>' + esc(r.d) + '</small></td><td>' + tipoTag(N.fuentes[r.f].tipo) + ' ' + fuenteRef(r.f) + '</td>' + VER.map((v) => '<td class="rq-' + r.v[v][0] + '">' + stIcon(r.v[v][0]) + esc(r.v[v][1]) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div><p class="n1-note">Estos requisitos no estaban en el documento del proyecto: salieron de revisar las normas. Donde una versión no cumple, el mueble se corrige y el cambio se anota en la tabla de rastreo.</p>';
    const reqs = VS.req[ST.n];
    const card = '<article class="n1-card"><header><span class="n1-num">' + ST.n + '</span><div><h4>' + esc(ROLE[ST.n]) + '</h4><small>' + esc(N.ficha.espacios.find((e) => e.id === M.espacio).t) + '</small></div></header>' +
      '<dl class="n1-dl sm"><div><dt>Quién lo usa</dt><dd>' + esc(M.usuario) + '</dd></div><div><dt>Para qué</dt><dd>' + esc(M.uso) + '</dd></div><div><dt>Espacio alrededor</dt><dd>' + esc(M.entorno) + '</dd></div></dl>' +
      '<h5>Medidas del cuerpo que lo condicionan</h5><ul class="n1-meds">' + M.medidas.map((m) => { const a = A[m[0]]; return '<li><b>' + esc(a.t) + '</b> <span class="mono">P5 ' + f1(a.p5) + ' · P95 ' + f1(a.p95) + ' cm</span><p>' + esc(m[1]) + '</p></li>'; }).join('') + '</ul>' +
      '<h5>Requisitos y cómo los cumple cada alternativa</h5><div class="n1-tbl"><table class="n1-rq"><thead><tr><th>Requisito</th><th>Fuente o dato</th>' + VER.map((v) => '<th>' + vtag(v) + ' ' + esc(itemOf(v, ST.n).short) + '</th>').join('') + '</tr></thead><tbody>' +
      reqs.map((r, i) => { const s = M.src[i] || { tipo: 'no', d: '' }; return '<tr><td><b>' + esc(r) + '</b></td><td>' + tipoTag(s.tipo) + ' ' + fuenteRef(s.f) + '<small>' + esc(s.d) + '</small></td>' + VER.map((v) => { const c = VS.cumple(ST.n, v)[i] || ['si', '']; return '<td class="rq-' + c[0] + '">' + stIcon(c[0]) + esc(c[1]) + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div></article>';
    const fuentes = '<ol class="n1-refs">' + Object.keys(N.fuentes).map((k) => { const f = N.fuentes[k]; return '<li id="n1-f-' + k + '"><b>' + esc(SHORT[k] || k) + '.</b> ' + esc(f.t) + (f.u ? ' <a href="' + esc(f.u) + '" target="_blank" rel="noopener">Enlace</a>' : '') + ' <small>' + tipoTag(f.tipo) + ' ' + esc(f.d) + ' Consultado el ' + esc(N.fecha) + '.</small></li>'; }).join('') + '</ol>';
    return secHead('C') +
      '<p class="n1-lead">Antes de dibujar se escribió qué tiene que resolver cada mueble: quién lo usa, para qué, cuánto espacio necesita alrededor y qué medidas del cuerpo lo condicionan. Cada requisito dice de dónde sale: una fuente citada, el encargo, o un valor estimado que se dice cómo se obtuvo.</p>' +
      '<h3>Medidas del cuerpo</h3>' + antro +
      '<h3>Requisitos que salen de las normas</h3>' + normas +
      '<h3>Requisitos de cada mueble</h3>' + pickN(ST.n) + card +
      '<h3>Fuentes</h3>' + fuentes;
  }
  function secD() {
    const C = N.criterios;
    const sum = '<div class="n1-tbl"><table class="n1-sum"><thead><tr><th>Mueble</th>' + VER.map((v) => '<th class="r">' + vtag(v) + ' ' + esc(vinfo(v).corto) + '</th>').join('') + '<th>Se desarrolla</th></tr></thead><tbody>' +
      FABN.map((k) => { const m = matrix(k); return '<tr data-n1n="' + k + '" class="' + (k === ST.n ? 'is-on' : '') + '"><td><b>' + k + '</b> ' + esc(ROLE[k]) + '</td>' + VER.map((v) => '<td class="r mono' + (v === m.win ? ' is-win' : '') + '">' + m.sc[v].total.toFixed(2) + '</td>').join('') + '<td>' + vtag(m.win) + ' ' + esc(itemOf(m.win, k).short) + '</td></tr>'; }).join('') +
      '</tbody></table></div>';
    const wins = {}; VER.forEach((v) => { wins[v] = 0; }); let avg = {}; VER.forEach((v) => { avg[v] = 0; });
    FABN.forEach((k) => { const m = matrix(k); wins[m.win]++; VER.forEach((v) => { avg[v] += m.sc[v].total / FABN.length; }); });
    const best = VER.slice().sort((a, b) => avg[b] - avg[a])[0];
    const m = matrix(ST.n);
    const val = (v, id) => {
      const f = m.F[v];
      return { req: f.req + ' de ' + f.reqN, costo: cop(f.costo), fab: f.oficios.length + ' oficios · ' + f.piezas + ' piezas', dura: (VS.precios[f.surf] ? VS.precios[f.surf].m.split(',')[0] : '—'), mont: f.ens + ' pasos', marca: N.marca[v][1] }[id];
    };
    const cards = '<div class="n1-alts">' + VER.map((v) => { const it = itemOf(v, ST.n); return '<article class="n1-alt' + (v === m.win ? ' is-win' : '') + '" style="--vc:' + vinfo(v).color + '"><div class="n1-thumb" data-thumb="' + v + '-' + ST.n + '"><span class="n1-load">Dibujando…</span></div><header>' + vtag(v) + '<div><h4>' + esc(it.short) + '</h4><small>' + esc(it.dims) + '</small></div><b class="mono">' + m.sc[v].total.toFixed(2) + '</b></header><p>' + esc(it.it.resumen || base[ST.n].resumen) + '</p>' + (v === m.win ? '<span class="n1-winb">Alternativa elegida</span>' : '') + '</article>'; }).join('') + '</div>';
    const tbl = '<div class="n1-tbl"><table class="n1-mx"><thead><tr><th>Criterio</th><th class="r">Peso</th>' + VER.map((v) => '<th>' + vtag(v) + ' ' + esc(itemOf(v, ST.n).short) + '</th>').join('') + '</tr></thead><tbody>' +
      C.map((c) => '<tr><td><b>' + esc(c.t) + '</b><small>' + esc(c.d) + '</small></td><td class="r mono">' + c.peso + ' %</td>' + VER.map((v) => '<td><span class="n1-sc">' + m.sc[v][c.id].toFixed(1) + '</span><small>' + esc(val(v, c.id)) + '</small></td>').join('') + '</tr>').join('') +
      '<tr class="n1-tot"><td><b>Total ponderado</b></td><td class="r mono">100 %</td>' + VER.map((v) => '<td class="' + (v === m.win ? 'is-win' : '') + '"><span class="n1-sc">' + m.sc[v].total.toFixed(2) + '</span><small>de 5.00</small></td>').join('') + '</tr></tbody></table></div>';
    const dura = '<details class="n1-det"><summary>Tabla de durabilidad (criterio del grupo)</summary><div class="n1-tbl"><table><thead><tr><th>Material</th><th class="r">Puntaje</th><th>Por qué</th></tr></thead><tbody>' +
      Object.keys(N.dura).map((k) => '<tr><td>' + esc(VS.precios[k] ? VS.precios[k].m : k) + '</td><td class="r mono">' + N.dura[k][0] + '</td><td>' + esc(N.dura[k][1]) + '</td></tr>').join('') + '</tbody></table></div></details>';
    return secHead('D') +
      '<p class="n1-lead">Cada mueble tiene tres alternativas: una por versión del local. Se comparan con seis criterios escritos antes de puntuar; cinco se calculan con los datos de cada alternativa (requisitos, costo, oficios y piezas, pasos de montaje) y dos son criterio del grupo, también escrito.</p>' +
      '<div class="n1-kpis">' + VER.map((v) => '<div style="--vc:' + vinfo(v).color + '" class="' + (v === best ? 'is-win' : '') + '">' + vtag(v) + '<span><b>' + esc(vinfo(v).nombre) + '</b><small>Gana en ' + wins[v] + ' de ' + FABN.length + ' muebles · promedio ' + avg[v].toFixed(2) + '</small></span></div>').join('') + '</div>' +
      '<h3>Resultado por mueble <small>toca una fila para ver su matriz</small></h3>' + sum +
      '<h3>Matriz de selección del mueble ' + ST.n + '</h3>' + pickN(ST.n) + cards + tbl +
      '<p class="n1-note">Se desarrolla la alternativa de mayor puntaje. Como el local se arma por versiones completas, las tres alternativas de cada mueble también tienen sus planos, despiece y costos: si el cliente elige otra versión, el diseño ya está hecho. La versión con mayor promedio es la <b>' + best + ' · ' + esc(vinfo(best).nombre) + '</b>.</p>' + dura;
  }
  function secE() {
    const it = itemOf(ST.ver, ST.n);
    return secHead('E', pickV()) +
      '<p class="n1-lead">Cada mueble tiene un plano de conjunto (alzado, vista lateral, corte A–A, planta e isometría, con cotas generales y de niveles en escala normalizada) y un despiece explosionado con la marca y la medida de cada pieza. Se dibujan desde el modelo 3D: lo que se ve en el visor es lo que dice el plano.</p>' +
      pickN(ST.n) +
      '<div class="n1-sheets">' +
      ['conjunto', 'explosion'].map((k, i) => '<figure class="n1-fig"><div class="n1-sheet" data-dwg="' + k + '"><span class="n1-load">Dibujando la lámina…</span></div><figcaption><b>' + ST.ver + '-' + (ST.n < 10 ? '0' : '') + ST.n + '.' + (i + 1) + '</b> ' + (i ? 'Despiece explosionado' : 'Plano de conjunto') + ' · ' + esc(it.short) +
        '<span><button type="button" class="btn btn-sm" data-n1zoom="' + k + '">Ampliar</button><button type="button" class="btn btn-sm" data-n1svg="' + k + '">Descargar SVG</button></span></figcaption></figure>').join('') +
      '</div><p class="n1-note">Pendiente para el H2 (28 de octubre): planos de cada pieza fabricada con sus perforaciones y cantos, y los detalles de las uniones (elemento G).</p>';
  }
  function secF() {
    const it = VS.items[ST.ver][ST.n], P = VS.precios, I = itemOf(ST.ver, ST.n);
    const esp = (p) => { const m = /(\d+(?:\.\d+)?) mm/.exec(p.m); return m ? m[1] : (p.m.match(/calibre \d+/) || [''])[0]; };
    const ORIG = { rovere15: 'Se fabrica · corte y enchape encargados al proveedor', blanca15: 'Se fabrica · corte y enchape encargados al proveedor', fondo6: 'Se fabrica · corte encargado al proveedor', mdf15: 'Se fabrica · corte encargado; se laca o enchapa en el taller', mdf55: 'Se fabrica · corte encargado; se curva y laca en el taller',
      hpl: 'Se compra · se corta y se pega en el taller', pvc10: 'Se fabrica · corte CNC encargado', pvc5: 'Se fabrica · corte CNC encargado', acril3: 'Se fabrica · corte láser encargado', opal3: 'Se fabrica · corte láser encargado', perforada: 'Se fabrica · corte y doblez en el taller',
      tubo1: 'Se fabrica · corte, soldadura y pintura en el taller', tubo15: 'Se fabrica · corte, soldadura y pintura en el taller', tuboRect: 'Se fabrica · corte, soldadura y pintura en el taller', perfil3030: 'Se compra cortado a medida', perfilLed: 'Se compra · se corta en el taller', cob: 'Se compra · se corta en el taller', vidrio10: 'Se encarga a la vidriería (templado a medida)', vidrio6: 'Se encarga a la vidriería (templado a medida)', petg: 'Se fabrica · impresión 3D en el taller' };
    const origen = (k) => ORIG[k] || ({ lamina: 'Se fabrica', barra: 'Se fabrica · corte en el taller', m: 'Se compra y se corta', m2: 'Se encarga', kg: 'Se fabrica' }[P[k].tipo]);
    const rows = it.piezas.map((p) => {
      const pr = P[p[0]];
      let med = '', cant = p[2];
      if (pr.tipo === 'lamina' || pr.tipo === 'm2') med = Math.round(p[3] * 1000) + ' × ' + Math.round(p[4] * 1000) + (esp(pr) ? ' × ' + esp(pr) : '');
      else if (pr.tipo === 'kg') { med = f1(p[2]) + ' kg de filamento'; cant = '—'; }
      else med = 'L = ' + Math.round(p[3] * 1000);
      if (pr.tipo === 'm' && p[0].startsWith('canto')) { med = Math.round(p[3] * 1000) / 1000 + ' m de canto'; cant = '—'; }
      return '<tr><td><b>' + esc(p[1]) + '</b></td><td class="r mono">' + cant + '</td><td>' + esc(pr.m) + '</td><td class="mono">' + esc(med) + '</td><td>' + esc(pr.pres) + '</td><td>' + esc(pr.tipo === 'm' && p[0].startsWith('canto') ? 'Se compra; lo pega el servicio de enchape' : origen(p[0])) + '</td></tr>';
    }).join('');
    const herr = it.herrajes.map((h) => { const pr = P[h[0]]; return '<tr><td><b>' + esc(pr.m) + '</b></td><td class="r mono">' + h[2] + '</td><td>' + esc(h[1]) + '</td><td>' + esc(pr.pres) + '</td><td>Se compra</td></tr>'; }).join('');
    const acab = it.acabados.map((a) => { const pr = P[a[0]]; return '<tr><td><b>' + esc(pr.m) + '</b></td><td class="r mono">' + f1(a[2]) + ' m² × ' + a[3] + '</td><td>' + esc(a[1]) + '</td><td>' + esc(pr.pres) + '</td><td>Se compra</td></tr>'; }).join('');
    const c = VS.calc(ST.ver).items[ST.n];
    return secHead('F', pickV()) +
      '<p class="n1-lead">Despiece del mueble con su cantidad, material, medidas de corte y si se fabrica, se compra o se encarga. Los herrajes, la tornillería y los insumos también se compran y se cuestan.</p>' + pickN(ST.n) +
      '<h3>' + ST.n + ' · ' + esc(I.name) + ' <small>' + esc(I.dims) + ' · materiales ' + cop(c.total) + '</small></h3>' +
      '<h4 class="n1-h4">Piezas</h4><div class="n1-tbl"><table><thead><tr><th>Pieza</th><th class="r">Cant.</th><th>Material</th><th>Medidas (mm)</th><th>Formato comercial</th><th>Origen</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<h4 class="n1-h4">Herrajes, tornillería e iluminación</h4><div class="n1-tbl"><table><thead><tr><th>Elemento</th><th class="r">Cant.</th><th>Uso</th><th>Unidad de venta</th><th>Origen</th></tr></thead><tbody>' + herr + '</tbody></table></div>' +
      (acab ? '<h4 class="n1-h4">Acabados e insumos</h4><div class="n1-tbl"><table><thead><tr><th>Insumo</th><th class="r">Área × manos</th><th>Uso</th><th>Unidad de venta</th><th>Origen</th></tr></thead><tbody>' + acab + '</tbody></table></div>' : '') +
      '<p class="n1-note">Medidas de corte: largo × ancho × espesor para tableros y láminas; largo para tubos y perfiles. El costo de cada material está en el presupuesto de la versión. Pendiente: cableado (calibre y metros) en el elemento H, y los insumos de taller (lija, discos, brocas) en la lista de compras de la Nota 3.</p>';
  }
  function secPend(id, what) {
    return secHead(id) + '<div class="n1-empty"><p>Se entrega para el hito H2, el 28 de octubre.</p><ul>' + what.map((w) => '<li>' + esc(w) + '</li>').join('') + '</ul></div>';
  }
  function secK() {
    const st = (s) => SECS.find((x) => x.id === s).st;
    return secHead('K') +
      '<p class="n1-lead">Lista de chequeo de la Nota 1 (guía, numeral 10). Cada punto se marca cuando la evidencia está en la carpeta del grupo; aquí se marca cuando está en el visor.</p>' +
      '<ul class="n1-check">' + N.check.map((c) => '<li class="c-' + st(c.s) + '"><i></i><span>' + esc(c.t) + '</span><button type="button" class="link" data-n1sec="' + c.s + '">' + c.s + ' · ' + esc(SECS.find((x) => x.id === c.s).t) + '</button><em>' + ST_TXT[st(c.s)] + '</em></li>').join('') + '</ul>' +
      '<h3>Hitos de la guía</h3><div class="n1-tbl"><table><thead><tr><th>Hito</th><th>Fecha</th><th>Qué debe estar listo</th></tr></thead><tbody>' +
      [['H0', 'mié 21 oct.', 'Proyecto y espacios escogidos; plano empezado (A)'], ['H1', 'vie 23 oct.', 'Plano a escala, requisitos y tres alternativas por mueble (B a D)'], ['H2', 'mié 28 oct.', 'Planos, despiece, uniones e integración, en avance (E a I)'], ['H3', 'vie 30 oct.', 'Diseño completo del mobiliario (A a I) · Nota 1']].map((r) => '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>').join('') + '</tbody></table></div>';
  }
  function render() {
    const id = ST.sec;
    const html = id === 'A' ? secA() : id === 'B' ? secB() : id === 'C' ? secC() : id === 'D' ? secD() : id === 'E' ? secE() : id === 'F' ? secF() : id === 'K' ? secK()
      : id === 'G' ? secPend('G', ['Tabla de materiales con su justificación y su formato comercial (tablero, perfil, placa)', 'Detalle de cada unión entre materiales distintos: acero con tablero, vidrio con perfil, aluminio con PVC, piezas impresas', 'Comprobación de la regla: dos materiales por mueble, tres en el conjunto'])
        : id === 'H' ? secPend('H', ['Referencia exacta y ficha técnica de cada luminaria (perfil LED, tira COB, fuentes) y de cada equipo (impresoras Bambu Lab P1S, pantallas Hisense)', 'Detalle del alojamiento, recorrido del cable, ventilación y acceso para mantenimiento'])
          : secPend('I', ['Render de cada mueble en su espacio del local, con la iluminación y el equipo en su sitio']);
    const body = $('#n1-body');
    body.innerHTML = '<div class="n1-sec" data-sec="' + id + '">' + html + '</div>';
    body.scrollTop = 0;
    $$('#n1-nav [data-n1sec]').forEach((b) => b.classList.toggle('is-on', b.dataset.n1sec === id));
    $$('.n1-pv', body).forEach((s) => L.ui.seg(s));
    const on = $('.n1-pick .is-on', body); if (on) { const pk = on.parentNode; pk.scrollLeft = on.offsetLeft - pk.clientWidth / 2 + on.offsetWidth / 2; }
    lazy();
  }
  /* dibujos que tardan: después de pintar la sección, uno por cuadro */
  function lazy() {
    const jobs = [];
    $$('[data-thumb]').forEach((el) => jobs.push(() => { const p = el.dataset.thumb.split('-'); el.innerHTML = L.dwg.isoSVG(p[0], +p[1], 160, 120); }));
    $$('[data-dwg]').forEach((el) => jobs.push(() => { el.innerHTML = L.dwg[el.dataset.dwg](ST.ver, ST.n); }));
    const gen = (ST.gen = (ST.gen || 0) + 1);
    const run = () => { if (gen !== ST.gen || !jobs.length) return; const j = jobs.shift(); try { j(); } catch (e) { console.error(e); } requestAnimationFrame(() => setTimeout(run, 0)); };
    requestAnimationFrame(() => setTimeout(run, 30));
  }

  /* ------------------------------------------------ vista completa */
  function build() {
    if ($('#nota')) return;
    const el = document.createElement('section');
    el.id = 'nota'; el.hidden = true; el.setAttribute('aria-label', 'Nota 1 · Diseño del mobiliario');
    el.innerHTML = '<header class="pl-bar n1-bar"><button type="button" class="btn" id="n1-back"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Volver al 3D</button>' +
      '<div class="pl-title"><b>Nota 1 · Diseño del mobiliario</b><span>Diseño VIII · Producción · guía «Del mueble a la planta» · entrega del 30 de octubre</span></div>' +
      '<div class="pl-tools"><button type="button" class="btn" id="n1-print"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 7.5V3.5h8v4M6 13.5H4a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 4 7.5h12A1.5 1.5 0 0 1 17.5 9v3a1.5 1.5 0 0 1-1.5 1.5h-2M6 11h8v5.5H6z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>Imprimir sección</button></div></header>' +
      '<div class="n1-wrap"><nav id="n1-nav" aria-label="Elementos de la Nota 1">' + SECS.map((s) => '<button type="button" data-n1sec="' + s.id + '"><span class="n1-letter">' + (s.id === 'K' ? '✓' : s.id) + '</span><span class="n1-nt">' + esc(s.t) + '</span>' + (s.st ? '<i class="n1-dot d-' + s.st + '" title="' + ST_TXT[s.st] + '"></i>' : '') + '</button>').join('') + '</nav>' +
      '<div id="n1-body" tabindex="-1"></div></div>' +
      '<div id="n1-view" hidden><div class="n1-vbar"><b id="n1-vt"></b><button type="button" class="btn" id="n1-vx">Cerrar</button></div><div class="n1-vs" id="n1-vs"></div></div>';
    $('#app').appendChild(el);
    el.addEventListener('click', onClick);
  }
  function onClick(e) {
    const t = e.target;
    if (t.closest('#n1-back')) return close();
    if (t.closest('#n1-print')) return print();
    if (t.closest('#n1-vx') || t.id === 'n1-view') { $('#n1-view').hidden = true; return; }
    const s = t.closest('[data-n1sec]'); if (s) { ST.sec = s.dataset.n1sec; render(); setHash(); return; }
    const nb = t.closest('[data-n1n]'); if (nb) { ST.n = +nb.dataset.n1n; const top = $('#n1-body').scrollTop; render(); $('#n1-body').scrollTop = top; return; }
    const vb = t.closest('[data-n1v]'); if (vb) { ST.ver = vb.dataset.n1v; const top = $('#n1-body').scrollTop; render(); $('#n1-body').scrollTop = top; return; }
    if (t.closest('[data-n1plan]')) { close(true); L.api.setVersion(ST.ver); L.api.openPlan(); return; }
    const z = t.closest('[data-n1zoom]'); if (z) { const k = z.dataset.n1zoom; $('#n1-vs').innerHTML = L.dwg[k](ST.ver, ST.n); $('#n1-vt').textContent = (k === 'conjunto' ? 'Plano de conjunto' : 'Despiece explosionado') + ' · ' + ST.n + ' · ' + itemOf(ST.ver, ST.n).short + ' · versión ' + ST.ver; $('#n1-view').hidden = false; return; }
    const d = t.closest('[data-n1svg]'); if (d) return download(d.dataset.n1svg);
    const a = t.closest('a[href^="#n1-f-"]'); if (a) { e.preventDefault(); const el = $(a.getAttribute('href')); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('is-flash'); setTimeout(() => el.classList.remove('is-flash'), 1600); } }
  }
  function download(k) {
    const svg = '<?xml version="1.0" encoding="UTF-8"?>\n' + L.dwg[k](ST.ver, ST.n);
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const a = document.createElement('a'); a.href = url; a.download = 'blackforge-' + ST.ver.toLowerCase() + '-' + (ST.n < 10 ? '0' : '') + ST.n + (k === 'conjunto' ? '-1-conjunto' : '-2-despiece') + '.svg';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    L.ui.toast('Lámina descargada', a.download + ' · A3 horizontal, vectorial.', 'ok', 4500);
  }
  function print() {
    document.body.classList.add('n1-printing');
    const done = () => { document.body.classList.remove('n1-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => { try { window.print(); } catch (err) { done(); } }, 80);
  }
  function setHash() { try { history.replaceState(null, '', '#nota1' + (ST.sec !== 'A' ? '-' + ST.sec.toLowerCase() : '')); } catch (e) { /* vista previa */ } }
  function open(sec) {
    build();
    if (L.api.state.planOpen) L.api.closePlan(true);
    ST.ver = L.api.state.ver || 'A';
    if (sec) ST.sec = sec;
    if (L.api.state.sel && FABN.indexOf(L.api.state.sel.n) >= 0) ST.n = L.api.state.sel.n;
    ST.open = true; $('#nota').hidden = false; document.body.classList.add('n1-open');
    render(); setHash();
    requestAnimationFrame(() => $('#n1-body').focus({ preventScroll: true }));
  }
  function close(silent) {
    if (!ST.open) return;
    ST.open = false; ST.gen++; $('#nota').hidden = true; $('#n1-view').hidden = true; document.body.classList.remove('n1-open');
    if (!silent) try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* */ }
  }
  window.addEventListener('keydown', (e) => {
    if (!ST.open) return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); if (!$('#n1-view').hidden) $('#n1-view').hidden = true; else close(); }
  }, true);
  function init() {
    const b = $('#btn-nota'); if (b) b.addEventListener('click', () => open());
    const m = /^#nota1(?:-([a-ik]))?$/i.exec(location.hash || '');
    if (m) { const go = () => (document.querySelector('#app.is-ready') ? open(m[1] ? m[1].toUpperCase() : 'A') : setTimeout(go, 200)); go(); }
  }
  L.n1 = { open, close, matrix, state: ST };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
