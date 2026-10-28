/* ============================================================================
   ENTREGA EN PDF · arma, con los mismos datos y dibujos del visor, los seis
   documentos de la Nota 1 (ficha y planos, requisitos y alternativas, planos
   técnicos, despiece y materiales, iluminación y equipo, renders). Lo usa
   tools/pdf/build.js desde un navegador sin cabeza; no se carga en el visor.
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D;
  const EN = (L.entrega = {});
  const h = L.n1.h, N = L.nota1, VS = L.versions, DATA = L.data, DW = L.dwg, PN = L.planos;
  const { esc, cop, f1, vtag, tipoTag, stIcon, itemOf, vinfo, ROLE, FABN, VER, fuenteRef } = h;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const DEV = 'B';                                   // versión que se desarrolla (mayor promedio en la matriz)
  const FECHA = '28 de octubre de 2026', FECHA_C = '28 oct. 2026';
  const nn = (n) => (n < 10 ? '0' : '') + n;
  const ESP = (n) => N.ficha.espacios.find((e) => e.n.indexOf(n) >= 0);
  const otras = VER.filter((v) => v !== DEV);

  const DOCS = [
    { num: 1, id: 'ficha', file: '01-ficha-del-proyecto-y-planos-a-escala', t: 'Ficha del proyecto y planos a escala', sub: 'Elementos A y B · ficha, referencia de escalado, planta 1:50 de las tres versiones y plano de cada espacio 1:25' },
    { num: 2, id: 'requisitos', file: '02-requisitos-alternativas-y-matriz', t: 'Requisitos, alternativas y matriz de selección', sub: 'Elementos C y D · requisitos de cada mueble con su fuente, tres alternativas por mueble y la matriz de selección' },
    { num: 3, id: 'planos', file: '03-planos-tecnicos', t: 'Planos técnicos', sub: 'Elemento E · plano de ensamble (conjunto), despiece explosionado, secuencia, detalles y láminas de piezas de cada mueble', a3: true },
    { num: 4, id: 'despiece', file: '04-despiece-materiales-y-uniones', t: 'Despiece, lista de materiales y uniones', sub: 'Elementos F y G · despiece con herrajes, tornillería y cableado, tabla de materiales y detalle de cada unión' },
    { num: 5, id: 'luz', file: '05-iluminacion-y-equipo', t: 'Iluminación y equipo', sub: 'Elemento H · referencia exacta y ficha técnica de la luz y del equipo, con alojamiento, cableado, ventilación y acceso' },
    { num: 6, id: 'renders', file: '06-renders', t: 'Renders', sub: 'Elemento I · cada mueble en su espacio, con la iluminación y el equipo en su sitio', land: true }
  ];
  EN.docs = DOCS;

  /* ------------------------------------------------------------ piezas comunes */
  const pgCls = (doc) => (doc.a3 ? ' pg-wide' : doc.land ? ' pg-land' : '');
  function cover(doc, art) {
    const best = h.resumen();
    return '<section class="en-cover' + pgCls(doc) + '">' +
      '<div class="en-brand"><b>BlackForge</b> 3D <span>Local de exhibición y taller de impresión 3D</span></div>' +
      '<div class="en-kicker">Nota 1 · Diseño del mobiliario · Documento ' + doc.num + ' de ' + DOCS.length + '</div>' +
      '<h1>' + esc(doc.t) + '</h1><p class="en-sub">' + esc(doc.sub) + '</p>' +
      '<div class="en-art">' + (art || '') + '</div>' +
      '<dl class="en-meta">' +
      '<div><dt>Proyecto</dt><dd>' + esc(N.ficha.nombre) + '</dd></div>' +
      '<div><dt>Curso</dt><dd>Diseño VIII · Producción · UPTC Duitama · guía «Del mueble a la planta»</dd></div>' +
      '<div><dt>Versión que se desarrolla</dt><dd>' + vtag(DEV) + ' ' + esc(vinfo(DEV).nombre) + ' — ' + esc(vinfo(DEV).titulo) + ' <small>(mayor promedio en la matriz de selección: ' + best.avg[DEV].toFixed(2) + ' de 5; gana en ' + best.wins[DEV] + ' de ' + FABN.length + ' muebles)</small></dd></div>' +
      '<div><dt>Fecha</dt><dd>' + FECHA + '</dd></div>' +
      '<div><dt>Modelo y planos interactivos</dt><dd><a href="' + esc(N.ficha.enlace) + '">' + esc(N.ficha.enlace) + '</a></dd></div>' +
      '<div><dt>Repositorio</dt><dd><a href="' + esc(N.ficha.repositorio) + '">' + esc(N.ficha.repositorio) + '</a></dd></div>' +
      '</dl>' +
      '<p class="en-ia">' + esc(N.ficha.ia) + '</p>' +
      '</section>';
  }
  function toc(doc, items) {
    return '<section class="en-toc' + pgCls(doc) + '" id="toc"><h2>Contenido</h2><ol>' +
      items.map((it) => '<li class="' + (it.sub ? 'is-sub' : '') + '"><a href="#' + it.id + '"><span class="en-tt">' + esc(it.t) + '</span><span class="en-pg" data-pg="' + it.id + '"></span></a></li>').join('') +
      '</ol>' + (doc.toc_note ? '<p class="n1-note">' + doc.toc_note + '</p>' : '') + '</section>';
  }
  const sec = (id, t, body, cls) => '<section class="en-sec' + (cls ? ' ' + cls : '') + '" id="' + id + '" data-title="' + esc(t) + '"><h2>' + esc(t) + '</h2>' + body + '</section>';
  const lead = (t) => '<p class="n1-lead">' + t + '</p>';
  const note = (t) => '<p class="n1-note">' + t + '</p>';
  const a3 = (svg, id) => '<div class="en-a3"' + (id ? ' id="' + id + '"' : '') + '>' + svg + '</div>';
  const mueble = (v, n) => '<span class="en-mn">' + n + '</span> ' + esc(ROLE[n]) + ' <small>' + vtag(v) + ' ' + esc(itemOf(v, n).short) + '</small>';

  /* la lámina A3 se imprime al 100 %: se le añade el número de página del documento fuera del marco */
  EN.pageLabel = (svgEl, txt) => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', '410'); t.setAttribute('y', '292.5'); t.setAttribute('text-anchor', 'end');
    t.setAttribute('style', 'font-family:Inter,Arial,sans-serif;font-size:2.4px;fill:#555');
    t.textContent = txt; svgEl.appendChild(t);
  };

  /* ------------------------------------------------- plano de un espacio a 1:25 */
  function espacioSVG(v, e, idx) {
    const T = THREE, K = 40, full = L.plan.svg(v, { cotas: false, nums: true });
    const doc = new DOMParser().parseFromString(full, 'image/svg+xml');
    const draw = doc.querySelector('.draw');
    $$('.zonas, .cotas, .pasos', draw).forEach((g) => g.remove());
    const inner = new XMLSerializer().serializeToString(draw).replace(/^<g[^>]*>/, '').replace(/<\/g>$/, '');
    // ventana en coordenadas del plano (X hacia la derecha, D hacia el fondo), desde las cajas del modelo 3D
    const prevVer = L.api.state.ver;
    if (prevVer !== v) L.api.setVersion(v, { quiet: true });
    let x0 = 9, x1 = -9, d0 = 9, d1 = -9;
    const rows = [];
    e.n.forEach((n) => {
      const it = L.furn.items[n]; if (!it) return;
      it.insts.forEach((o) => { const b = o.box; x0 = Math.min(x0, b.min.x + 3); x1 = Math.max(x1, b.max.x + 3); d0 = Math.min(d0, 3.5 - b.max.z); d1 = Math.max(d1, 3.5 - b.min.z); });
      const io = itemOf(v, n); rows.push([n, io.name, io.dims]);
    });
    if (prevVer !== v) L.api.setVersion(prevVer, { quiet: true });
    const M = 0.55;
    x0 = Math.max(-0.25, x0 - M); x1 = Math.min(6.25, x1 + M); d0 = Math.max(-0.35, d0 - M); d1 = Math.min(7.25, d1 + M);
    if (x1 - x0 < 2.4) { const c = (x0 + x1) / 2; x0 = Math.max(-0.25, c - 1.2); x1 = Math.min(6.25, c + 1.2); }
    if (d1 - d0 < 2.4) { const c = (d0 + d1) / 2; d0 = Math.max(-0.35, c - 1.2); d1 = Math.min(7.25, c + 1.2); }
    const W = (x1 - x0) * K, H = (d1 - d0) * K;
    // la lámina de 1:50 usa 20 mm/m con origen (56, 222): el mismo dibujo a 2× es 1:25
    const sx = (X) => 56 + X * 20, sy = (D) => 222 - D * 20;
    const ox = 20, oy = 40, s = 2, wx = sx(x0), wy = sy(d1);
    const dimH = (X0, X1, y, lab) => '<g class="dim"><line class="d-line" x1="' + (ox + (X0 - x0) * K) + '" y1="' + y + '" x2="' + (ox + (X1 - x0) * K) + '" y2="' + y + '"/><text class="d-txt" x="' + (ox + ((X0 + X1) / 2 - x0) * K) + '" y="' + (y - 1.2) + '">' + lab + '</text></g>';
    const dimV = (D0, D1, x, lab) => '<g class="dim"><line class="d-line" x1="' + x + '" y1="' + (oy + (d1 - D1) * K) + '" x2="' + x + '" y2="' + (oy + (d1 - D0) * K) + '"/><text class="d-txt" transform="translate(' + (x - 1.4) + ' ' + (oy + (d1 - (D0 + D1) / 2) * K) + ') rotate(-90)">' + lab + '</text></g>';
    const vi = vinfo(v), lam = 'A-02.' + (idx + 1);
    let out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="420mm" height="297mm" class="sheet" role="img" aria-label="Plano del espacio ' + esc(e.t) + ', versión ' + v + ', escala 1:25">';
    out += '<style>' + L.plan.css + '.sheet .win{fill:none;stroke:#111;stroke-width:.35;stroke-dasharray:2 1.2}.sheet .cl{fill:none}.sheet .big{font-size:3.4px}</style>';
    out += '<rect class="paper" x="0" y="0" width="420" height="297"/><rect class="frame" x="10" y="10" width="400" height="277"/>';
    out += '<text class="title" x="20" y="24">Espacio: ' + esc(e.t) + '</text>';
    out += '<text class="subtitle" x="20" y="30.5">' + esc(e.d) + ' Versión ' + v + ' · ' + esc(vi.nombre) + '. Ventana de ' + (x1 - x0).toFixed(2) + ' × ' + (d1 - d0).toFixed(2) + ' m del local de 6.00 × 7.00 m, medidas en metros.</text>';
    out += '<defs><clipPath id="cw' + v + idx + '"><rect x="' + ox + '" y="' + oy + '" width="' + W.toFixed(2) + '" height="' + H.toFixed(2) + '"/></clipPath></defs>';
    out += '<g clip-path="url(#cw' + v + idx + ')"><g transform="translate(' + ox + ' ' + oy + ') scale(' + s + ') translate(' + (-wx).toFixed(2) + ' ' + (-wy).toFixed(2) + ')">' + inner + '</g></g>';
    out += '<rect class="win" x="' + ox + '" y="' + oy + '" width="' + W.toFixed(2) + '" height="' + H.toFixed(2) + '"/>';
    out += dimH(x0, x1, oy + H + 8, (x1 - x0).toFixed(2)) + dimV(d0, d1, ox + W + 8, (d1 - d0).toFixed(2));
    // posición en el local (clave a 1:200) y escala gráfica
    const kx = 262, ky = 40, kk = 5;
    out += '<g class="key"><text class="h2" x="' + kx + '" y="' + ky + '">Posición en el local</text><rect class="wall-l" x="' + kx + '" y="' + (ky + 5) + '" width="' + (6 * kk) + '" height="' + (7 * kk) + '"/>' +
      '<line class="thin" x1="' + kx + '" y1="' + (ky + 5 + 1.5 * kk) + '" x2="' + (kx + 6 * kk) + '" y2="' + (ky + 5 + 1.5 * kk) + '"/>' +
      '<rect x="' + (kx + x0 * kk).toFixed(2) + '" y="' + (ky + 5 + (7 - d1) * kk).toFixed(2) + '" width="' + ((x1 - x0) * kk).toFixed(2) + '" height="' + ((d1 - d0) * kk).toFixed(2) + '" fill="#111" fill-opacity=".12" stroke="#111" stroke-width=".3"/>' +
      '<text class="lbl" x="' + kx + '" y="' + (ky + 5 + 7 * kk + 4) + '">Acceso abajo (pasillo del centro comercial) · trastienda arriba · 1:200</text></g>';
    const bx = 262, by = 100;
    out += '<g class="scalebar"><text class="lbl" x="' + bx + '" y="' + (by - 4) + '">Escala gráfica 1:25</text>';
    for (let i = 0; i < 4; i++) out += '<rect x="' + (bx + i * K / 2) + '" y="' + by + '" width="' + K / 2 + '" height="1.6" class="' + (i % 2 ? 'sb-w' : 'sb-b') + '"/>';
    out += [0, 0.5, 1, 1.5, 2].map((m, i) => '<text class="sb-t" x="' + (bx + i * K / 2) + '" y="' + (by + 5.2) + '">' + String(m).replace('.', ',') + (i === 4 ? ' m' : '') + '</text>').join('') + '</g>';
    // cuadro de muebles del espacio
    const tx = 262, ty = 120, rh = 7;
    out += '<g class="table"><text class="h2" x="' + tx + '" y="' + ty + '">Muebles del espacio</text>' +
      '<text class="th" x="' + tx + '" y="' + (ty + 7) + '">N.º</text><text class="th" x="' + (tx + 9) + '" y="' + (ty + 7) + '">MUEBLE</text><text class="th" x="' + (tx + 100) + '" y="' + (ty + 7) + '">L × F × H (m)</text>' +
      '<line class="rule" x1="' + tx + '" y1="' + (ty + 9) + '" x2="' + (tx + 138) + '" y2="' + (ty + 9) + '"/>';
    rows.forEach((r, i) => {
      const y = ty + 9 + (i + 1) * rh - 1.9, nm = r[1];
      out += '<text class="td num-c" x="' + (tx + 2.6) + '" y="' + y + '">' + r[0] + '</text><text class="td" x="' + (tx + 9) + '" y="' + y + '">' + esc(nm.length > 44 ? nm.slice(0, 42) + '…' : nm) + '</text><text class="td mono" x="' + (tx + 100) + '" y="' + y + '">' + esc(r[2].replace(' m', '').replace(/ de frente.*$/, '').replace(/ \(.*$/, '')) + '</text>' +
        '<line class="rule-t" x1="' + tx + '" y1="' + (ty + 9 + (i + 1) * rh) + '" x2="' + (tx + 138) + '" y2="' + (ty + 9 + (i + 1) * rh) + '"/>';
    });
    out += '</g>';
    // cajetín
    const cx = 222, cy = 202, cw = 178;
    const cell = (x, y, w, hh, lab, val, cls) => '<rect class="cell" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '"/><text class="c-lab" x="' + (x + 2) + '" y="' + (y + 3.6) + '">' + esc(lab) + '</text><text class="c-val ' + (cls || '') + '" x="' + (x + 2) + '" y="' + (y + hh - 2.4) + '">' + esc(val) + '</text>';
    out += '<g class="block">' + cell(cx, cy, cw, 13, 'PROYECTO', 'BlackForge · Local de exhibición y taller de impresión 3D', 'big') +
      cell(cx, cy + 13, cw * 0.62, 11, 'PLANO', 'Espacio: ' + e.t) + cell(cx + cw * 0.62, cy + 13, cw * 0.38, 11, 'LÁMINA', lam) +
      cell(cx, cy + 24, cw * 0.62, 11, 'VERSIÓN DEL MOBILIARIO', v + ' · ' + vi.nombre + ' — ' + vi.titulo) + cell(cx + cw * 0.62, cy + 24, cw * 0.38, 11, 'ESCALA', '1:25 en A3 horizontal') +
      cell(cx, cy + 35, cw * 0.31, 11, 'UNIDADES', 'metros') + cell(cx + cw * 0.31, cy + 35, cw * 0.31, 11, 'FECHA', FECHA_C) + cell(cx + cw * 0.62, cy + 35, cw * 0.38, 11, 'MUEBLES', rows.map((r) => r[0]).join(', ')) +
      '<text class="c-note" x="' + cx + '" y="' + (cy + 52) + '">Recorte de la planta A-01 al doble de su escala; los muebles numerados se detallan en los documentos 2 a 6.</text>' +
      '<text class="c-note" x="' + cx + '" y="' + (cy + 56.5) + '">Medidas del local estimadas desde la imagen del proyecto (frente de 6.00 m); verificar en sitio antes de pedir el corte.</text></g>';
    return out + '</svg>';
  }
  EN.espacioSVG = espacioSVG;

  /* ================================================================ documento 1 */
  function doc1(doc) {
    const F = N.ficha, E = N.escalado;
    const row = (t, d, cls) => '<div class="' + (cls || '') + '"><dt>' + esc(t) + '</dt><dd>' + d + '</dd></div>';
    const items = [{ id: 'd1-ficha', t: '1 · Ficha del proyecto' }, { id: 'd1-versiones', t: '2 · Las tres versiones del local' }, { id: 'd1-escala', t: '3 · Referencia de escalado' }, { id: 'd1-planos', t: '4 · Planta de distribución y mobiliario, escala 1:50' }];
    VER.forEach((v) => items.push({ id: 'd1-plan-' + v, t: 'A-01 · versión ' + v + ' · ' + vinfo(v).nombre, sub: true }));
    items.push({ id: 'd1-espacios', t: '5 · Plano de cada espacio, escala 1:25', sub: false });
    VER.forEach((v) => items.push({ id: 'd1-esp-' + v, t: 'A-02 · versión ' + v + ' · ' + F.espacios.length + ' espacios', sub: true }));
    items.push({ id: 'd1-hitos', t: '6 · Hitos de la guía y uso de inteligencia artificial' });
    let s = cover(doc, '<div class="en-art-plan">' + L.plan.svg(DEV, { cotas: false, nums: true }) + '</div>') + toc(doc, items);
    s += sec('d1-ficha', '1 · Ficha del proyecto',
      lead(esc(F.encargo)) +
      '<dl class="n1-dl">' + row('Proyecto', esc(F.nombre)) + row('Tipo', esc(F.tipo)) + row('Ubicación', esc(F.ubicacion), /confirmar/.test(F.ubicacion) ? 'is-todo' : '') + row('Ciudad', esc(F.ciudad), /confirmar/i.test(F.ciudad) ? 'is-todo' : '') +
      row('Áreas', esc(F.area)) + row('Fachada', esc(F.fachada)) + row('Fuente del plano', esc(F.fuentePlano)) + row('Fecha de consulta', esc(F.consulta)) +
      row('Enlace del modelo', '<a href="' + esc(F.enlace) + '">' + esc(F.enlace) + '</a>') + row('Repositorio', '<a href="' + esc(F.repositorio) + '">' + esc(F.repositorio) + '</a>') + '</dl>' +
      '<h3>Espacios y muebles</h3>' + note('La guía pide tres espacios con un mueble cada uno; este proyecto diseña los doce muebles fabricados del local, repartidos en cuatro espacios, y cada uno en tres versiones. Los muebles comprados (impresoras, pantallas, sillas, butacos) se integran y se cuestan, pero no se diseñan.') +
      '<div class="n1-tbl"><table><thead><tr><th>Espacio</th><th>Qué pasa ahí</th><th>Muebles que se diseñan</th></tr></thead><tbody>' +
      F.espacios.map((e) => '<tr><td><b>' + esc(e.t) + '</b></td><td>' + esc(e.d) + '</td><td>' + e.n.map((k) => '<span class="n1-chip">' + k + ' · ' + esc(ROLE[k]) + '</span>').join(' ') + '</td></tr>').join('') + '</tbody></table></div>' +
      '<h3>Qué contiene esta entrega</h3>' +
      '<div class="n1-tbl"><table><thead><tr><th>Documento</th><th>Contenido</th><th>Elemento de la guía</th></tr></thead><tbody>' +
      DOCS.map((d) => '<tr><td><b>' + d.num + '</b></td><td><b>' + esc(d.t) + '</b><small>' + esc(d.sub.split(' · ')[1] || '') + '</small></td><td>' + esc(d.sub.split(' · ')[0]) + '</td></tr>').join('') + '</tbody></table></div>');
    // versiones
    const best = h.resumen();
    s += sec('d1-versiones', '2 · Las tres versiones del local',
      lead('El local se diseñó tres veces, con un concepto, una distribución y una familia de materiales distintos; cada mueble tiene por tanto tres alternativas, una por versión, que se comparan en el documento 2. La versión <b>' + DEV + ' · ' + esc(vinfo(DEV).nombre) + '</b> es la de mayor promedio en la matriz de selección y es la que se desarrolla en las Notas 2 y 3; las otras dos quedan completas (planos, despiece y costos) por si el cliente la cambia.') +
      '<div class="en-vers">' + VER.map((v) => { const vi = vinfo(v); return '<article class="en-ver' + (v === DEV ? ' is-win' : '') + '" style="--vc:' + vi.color + '"><div class="en-ver-l"><header>' + vtag(v) + '<div><h4>' + esc(vi.nombre) + '</h4><small>' + esc(vi.titulo) + '</small></div></header>' +
        '<div class="en-ver-iso">' + DW.isoSVG(v, 3, 300, 200) + '</div>' +
        '<p class="en-ver-sc"><b>' + best.avg[v].toFixed(2) + '</b> de 5 en promedio · gana en ' + best.wins[v] + ' de ' + FABN.length + ' muebles' + (v === DEV ? ' · <em>se desarrolla</em>' : '') + '</p></div>' +
        '<div class="en-ver-r"><p>' + esc(vi.concepto) + '</p><div class="en-ver-cols">' +
        '<div><h5>Distribución</h5><ul>' + vi.distribucion.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
        '<h5>Materiales</h5><ul>' + vi.materiales.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' +
        '<div><h5>A favor</h5><ul>' + vi.ventajas.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
        '<h5>En contra</h5><ul>' + vi.contras.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div></div></div></article>'; }).join('') + '</div>' +
      note('Isometría: el exhibidor central (mueble 3) de cada versión. Las fichas completas de cada versión, con su presupuesto, están en el visor (Versiones).'));
    // escalado
    s += sec('d1-escala', '3 · Referencia de escalado',
      lead(esc(E.texto)) +
      '<div class="n1-tbl"><table><thead><tr><th>Referencia</th><th>Cómo se usó</th><th>Dato</th></tr></thead><tbody>' +
      E.refs.map((r) => '<tr><td><b>' + esc(r.t) + '</b></td><td>' + esc(r.d) + '</td><td>' + tipoTag(r.tipo) + ' ' + esc(h.SHORT[r.f] || r.f) + '</td></tr>').join('') + '</tbody></table></div>' +
      note(esc(E.nota)) +
      '<h3>Cómo leer las láminas a escala</h3>' +
      '<div class="n1-tbl"><table><thead><tr><th>Lámina</th><th>Escala</th><th>Equivalencia</th><th>Comprobación</th></tr></thead><tbody>' +
      '<tr><td><b>A-01</b> Planta de distribución y mobiliario</td><td class="mono">1:50 en A3 horizontal</td><td>20 mm en el papel = 1.00 m en el local; el frente de 6.00 m mide 120 mm</td><td>Escala gráfica de 3 m al pie de la lámina; el local dibujado mide 120 × 140 mm</td></tr>' +
      '<tr><td><b>A-02</b> Plano de cada espacio</td><td class="mono">1:25 en A3 horizontal</td><td>40 mm en el papel = 1.00 m; recorte de A-01 al doble</td><td>Escala gráfica de 2 m; la ventana del recorte lleva sus dos cotas</td></tr>' +
      '<tr><td><b>V-nn.1</b> a <b>V-nn.5</b> Planos de los muebles (documento 3)</td><td class="mono">1:10, 1:20, 1:5 según el mueble</td><td>Escala escrita en el rótulo de cada lámina y en cada vista</td><td>Las cotas mandan sobre la medida a escala</td></tr>' +
      '</tbody></table></div>' +
      note('Las láminas A3 van en este PDF a su tamaño real: deben imprimirse al 100 % (sin «ajustar a la página») para que la escala se conserve. Si se imprimen en A4, la escala pasa a ser aproximadamente 1:71 y 1:35; la escala gráfica sigue siendo válida.'));
    // planos
    s += sec('d1-planos', '4 · Planta de distribución y mobiliario, escala 1:50', lead('La planta de cada versión, con cotas del local, pasos entre muebles, cuadro de mobiliario con medidas y presupuesto de materiales. Una lámina A3 por versión; las tres versiones usan las mismas medidas del local y cambia la distribución.') +
      '<h3 id="d1-espacios">5 · Plano de cada espacio, escala 1:25</h3>' + lead('Cada espacio del local recortado de la planta al doble de la escala, con la posición del recorte en el local, la escala gráfica y el cuadro de sus muebles. ' + F.espacios.length + ' láminas A3 por versión, después de las tres plantas.') +
      '<div class="n1-tbl"><table><thead><tr><th>Lámina</th><th>Contenido</th><th>Versión</th><th>Escala</th></tr></thead><tbody>' +
      VER.map((v) => '<tr><td><b>A-01</b></td><td>Planta de distribución y mobiliario</td><td>' + vtag(v) + ' ' + esc(vinfo(v).nombre) + '</td><td class="mono">1:50</td></tr>').join('') +
      VER.map((v) => F.espacios.map((e, i) => '<tr><td><b>A-02.' + (i + 1) + '</b></td><td>Espacio: ' + esc(e.t) + ' · muebles ' + e.n.join(', ') + '</td><td>' + vtag(v) + ' ' + esc(vinfo(v).nombre) + '</td><td class="mono">1:25</td></tr>').join('')).join('') + '</tbody></table></div>', 'en-sec-min');
    VER.forEach((v) => { s += a3(L.plan.svg(v, { cotas: true, nums: true }), 'd1-plan-' + v); });
    VER.forEach((v) => { F.espacios.forEach((e, i) => { s += a3(espacioSVG(v, e, i), i === 0 ? 'd1-esp-' + v : null); }); });
    // hitos + IA
    s += sec('d1-hitos', '6 · Hitos de la guía y uso de inteligencia artificial',
      '<div class="n1-tbl"><table><thead><tr><th>Hito</th><th>Fecha</th><th>Qué debe estar listo</th><th>Dónde está</th></tr></thead><tbody>' +
      [['H0', 'mié 21 oct.', 'Proyecto y espacios escogidos; plano empezado (A)', 'Documento 1'], ['H1', 'vie 23 oct.', 'Plano a escala, requisitos y tres alternativas por mueble (B a D)', 'Documentos 1 y 2'], ['H2', 'mié 28 oct.', 'Planos, despiece, uniones e integración, en avance (E a I)', 'Documentos 3 a 6'], ['H3', 'vie 30 oct.', 'Diseño completo del mobiliario (A a I) · Nota 1', 'Los seis documentos y el visor']].map((r) => '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>').join('') + '</tbody></table></div>' +
      '<h3>Uso de inteligencia artificial</h3><p class="n1-box">' + esc(F.ia) + '</p>' +
      '<h3>Lista de chequeo de la Nota 1</h3><ul class="n1-check">' + N.check.map((c) => { const S = L.n1.SECS.find((x) => x.id === c.s); return '<li class="c-' + S.st + '"><i></i><span>' + esc(c.t) + '</span><em>' + c.s + ' · ' + esc(S.t) + '</em></li>'; }).join('') + '</ul>' +
      '<h3>Tabla de rastreo</h3>' + note('Lo que la revisión de normas y el cálculo de la luz le cambió a cada mueble, y lo que queda por decidir con el grupo.') + h.rastreo());
    return s;
  }

  /* ================================================================ documento 2 */
  function doc2(doc) {
    const C = N.criterios, best = h.resumen();
    const items = [{ id: 'd2-metodo', t: '1 · Cómo se escribieron los requisitos' }, { id: 'd2-antro', t: '2 · Medidas del cuerpo' }, { id: 'd2-normas', t: '3 · Requisitos que salen de las normas' }, { id: 'd2-req', t: '4 · Requisitos de cada mueble, con su fuente' }];
    FABN.forEach((n) => items.push({ id: 'd2-req-' + n, t: n + ' · ' + ROLE[n], sub: true }));
    items.push({ id: 'd2-crit', t: '5 · Criterios de selección' }, { id: 'd2-res', t: '6 · Resultado de la matriz' }, { id: 'd2-alt', t: '7 · Tres alternativas y matriz de cada mueble' });
    FABN.forEach((n) => items.push({ id: 'd2-alt-' + n, t: n + ' · ' + ROLE[n], sub: true }));
    items.push({ id: 'd2-fuentes', t: '8 · Fuentes' });
    let s = cover(doc, '<div class="en-art-row">' + VER.map((v) => '<div style="--vc:' + vinfo(v).color + '">' + DW.isoSVG(v, 5, 260, 170) + vtag(v) + '</div>').join('') + '</div>') + toc(doc, items);
    s += sec('d2-metodo', '1 · Cómo se escribieron los requisitos',
      lead('Antes de dibujar se escribió qué tiene que resolver cada mueble: quién lo usa, para qué, cuánto espacio necesita alrededor y qué medidas del cuerpo lo condicionan. Cada requisito dice de dónde sale: una fuente citada, el encargo, o un valor estimado que se dice cómo se obtuvo. Las tres alternativas de cada mueble se comparan después con los mismos criterios, escritos antes de puntuar.') +
      '<div class="n1-tbl"><table><thead><tr><th>Tipo de dato</th><th>Qué significa</th></tr></thead><tbody>' +
      [['fuente', 'Norma, estudio o ficha técnica citada en la lista de fuentes.'], ['secundaria', 'Dato tomado de una fuente que cita a otra (no se pudo consultar la original).'], ['encargo', 'Lo pide el documento del proyecto o el cliente.'], ['estimado', 'Valor del grupo, con el método con el que se obtuvo.'], ['no', 'No se obtuvo: queda señalado como pendiente.']].map((r) => '<tr><td>' + tipoTag(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>').join('') + '</tbody></table></div>');
    s += sec('d2-antro', '2 · Medidas del cuerpo', h.antro());
    s += sec('d2-normas', '3 · Requisitos que salen de las normas', h.normas());
    s += sec('d2-req', '4 · Requisitos de cada mueble, con su fuente', lead('Un cuadro por mueble: quién lo usa, para qué, el espacio alrededor, las medidas del cuerpo que lo condicionan y la tabla de requisitos con su fuente y cómo los cumple cada alternativa.') +
      FABN.map((n) => '<div class="en-mueble" id="d2-req-' + n + '"><h3>' + n + ' · ' + esc(ROLE[n]) + ' <small>' + esc(ESP(n).t) + '</small></h3>' + h.reqCard(n) + '</div>').join(''));
    s += sec('d2-crit', '5 · Criterios de selección',
      lead('Seis criterios con su peso, escritos antes de puntuar. Cuatro se calculan con los datos de cada alternativa (requisitos cumplidos, costo de materiales, oficios y piezas, pasos de montaje); la durabilidad sale de una tabla del grupo por material y la marca de una valoración escrita por versión.') +
      '<div class="n1-tbl"><table><thead><tr><th>Criterio</th><th class="r">Peso</th><th>Cómo se puntúa (0 a 5)</th></tr></thead><tbody>' +
      C.map((c) => '<tr><td><b>' + esc(c.t) + '</b></td><td class="r mono">' + c.peso + ' %</td><td>' + esc(c.d) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<h3>Durabilidad por material <small>criterio del grupo</small></h3>' + h.duraTable() +
      '<h3>Marca <small>valoración por versión</small></h3><div class="n1-tbl"><table><thead><tr><th>Versión</th><th class="r">Puntaje</th><th>Por qué</th></tr></thead><tbody>' +
      VER.map((v) => '<tr><td>' + vtag(v) + ' ' + esc(vinfo(v).nombre) + '</td><td class="r mono">' + N.marca[v][0] + '</td><td>' + esc(N.marca[v][1]) + '</td></tr>').join('') + '</tbody></table></div>');
    s += sec('d2-res', '6 · Resultado de la matriz',
      '<div class="n1-kpis">' + VER.map((v) => '<div style="--vc:' + vinfo(v).color + '" class="' + (v === best.best ? 'is-win' : '') + '">' + vtag(v) + '<span><b>' + esc(vinfo(v).nombre) + '</b><small>Gana en ' + best.wins[v] + ' de ' + FABN.length + ' muebles · promedio ' + best.avg[v].toFixed(2) + '</small></span></div>').join('') + '</div>' +
      '<h3>Puntaje total de cada alternativa</h3>' + h.sumTable(0) +
      note('Se desarrolla la alternativa de mayor puntaje. Como el local se arma por versiones completas, las tres alternativas de cada mueble también tienen sus planos, despiece y costos: si el cliente elige otra versión, el diseño ya está hecho. La versión con mayor promedio es la <b>' + best.best + ' · ' + esc(vinfo(best.best).nombre) + '</b>, que es la que se desarrolla en las Notas 2 y 3.'));
    s += sec('d2-alt', '7 · Tres alternativas y matriz de cada mueble', lead('Para cada mueble: las tres alternativas con su isometría, medidas y resumen, y la matriz con el puntaje de cada criterio y el dato del que sale.') +
      FABN.map((n) => '<div class="en-mueble en-page" id="d2-alt-' + n + '"><h3>' + n + ' · ' + esc(ROLE[n]) + ' <small>' + esc(ESP(n).t) + ' · alternativa elegida: ' + L.n1.matrix(n).win + '</small></h3>' + h.altBlock(n) + '</div>').join(''));
    s += sec('d2-fuentes', '8 · Fuentes', h.fuentes());
    return s;
  }

  /* ================================================================ documento 3 */
  function doc3(doc, opt) {
    const vers = (opt && opt.vers) || [DEV].concat(otras);
    const items = [];
    vers.forEach((v) => {
      items.push({ id: 'd3-' + v, t: (v === DEV ? 'Juego de planos de la versión ' : 'Anexo · juego de planos de la versión ') + v + ' · ' + vinfo(v).nombre + ' (' + PN.sheets(v).length + ' láminas)' });
      PN.fab(v).forEach((d) => items.push({ id: 'd3-' + v + '-' + d.n, t: v + '-' + nn(d.n) + ' · ' + ROLE[d.n] + ' · ' + itemOf(v, d.n).short, sub: true }));
    });
    doc.toc_note = 'Cada mueble tiene cinco láminas o más: .1 plano de ensamble (vistas, corte A–A, planta, isometría y cotas), .2 despiece explosionado, .3 secuencia de ensamble, .4 detalles constructivos a 1:5 y .5 en adelante las láminas de piezas con sus medidas de corte. La escala está en el rótulo y en cada vista; las cotas mandan sobre la medida a escala. Las láminas van a su tamaño real: imprimir en A3 al 100 %.';
    let s = cover(doc, '<div class="en-art-row">' + [2, 7, 5].map((n) => '<div>' + DW.isoSVG(DEV, n, 260, 170) + '</div>').join('') + '</div>') + toc(doc, items);
    vers.forEach((v) => {
      const list = PN.sheets(v);
      list.forEach((sh) => {
        const id = sh.id === 'g' ? 'd3-' + v : sh.id.endsWith('.1') ? 'd3-' + v + '-' + sh.n : null;
        const svg = sh.id === 'g' ? DW.indice(v) : sh.id === 'a' ? L.plan.svg(v, { cotas: true, nums: true }) : PN.draw(v, sh);
        s += a3(svg, id);
      });
    });
    return s;
  }

  /* ================================================================ documento 4 */
  function herrajesTot(v) {
    const P = VS.precios, tot = {};
    FABN.forEach((n) => VS.items[v][n].herrajes.forEach((x) => { const r = (tot[x[0]] = tot[x[0]] || { id: x[0], q: 0, m: new Set(), usos: new Set() }); r.q += x[2]; r.m.add(n); r.usos.add(x[1]); }));
    return Object.values(tot).filter((r) => P[r.id]).sort((a, b) => P[a.id].cat.localeCompare(P[b.id].cat) || P[a.id].m.localeCompare(P[b.id].m));
  }
  function compras(v) {
    const c = VS.calc(v), P = VS.precios, rows = Object.values(c.compras).sort((a, b) => P[a.id].cat.localeCompare(P[b.id].cat) || b.costo - a.costo);
    return '<div class="n1-tbl"><table><thead><tr><th>Material o insumo</th><th>Formato comercial</th><th>Cantidad para la versión</th><th>Proveedor</th><th class="r">Costo</th></tr></thead><tbody>' +
      rows.map((r) => { const p = P[r.id]; return '<tr><td><b>' + esc(p.m) + '</b><small>' + esc(p.cat) + '</small></td><td>' + esc(p.pres) + '</td><td>' + esc(r.texto) + '</td><td>' + esc(p.prov) + '<small>' + esc(VS.precioTxt(p)) + '</small></td><td class="r mono">' + cop(r.costo) + '</td></tr>'; }).join('') +
      '<tr class="n1-tot"><td colspan="4"><b>Materiales, herrajes e insumos de los ' + FABN.length + ' muebles</b></td><td class="r mono"><b>' + cop(c.total) + '</b></td></tr></tbody></table></div>';
  }
  function cableado(v) {
    const Z = N.luz, rows = h.luzData(v);
    const fu = (r) => r.cap ? r.d.fu.map((x) => x[2] + ' × ' + Z.fuenteW[x[0]] + ' W').join(' + ') : (r.host ? 'En el mueble ' + r.host.slice(1) : '—');
    return '<div class="n1-tbl"><table><thead><tr><th>Mueble</th><th>LED instalado</th><th>Fuente 12 V</th><th>Tramo más largo</th><th>Cable</th><th>Caída de tensión</th><th>Carga de la fuente</th></tr></thead><tbody>' +
      rows.map((r) => '<tr><td><b>' + r.n + '</b> ' + esc(itemOf(v, r.n).short) + '</td><td class="mono nw">' + r.d.m.toFixed(2).replace('.', ',') + ' m · ' + Math.round(r.d.W) + ' W</td><td>' + fu(r) + (r.nota ? '<small>' + esc(r.nota) + '</small>' : '') + '</td><td class="mono">' + r.Lc.toFixed(1).replace('.', ',') + ' m</td><td class="mono nw">2 × ' + String(r.sec[0]).replace('.', ',') + ' mm² Cu flexible<small>' + r.I.toFixed(2).replace('.', ',') + ' A en el tramo</small></td><td class="mono' + (r.drop <= Z.caida ? '' : ' rq-no') + '">' + (r.drop * 100).toFixed(1).replace('.', ',') + ' %</td><td class="' + (r.cap ? 'rq-' + (r.ok ? 'si' : 'no') : '') + '">' + (r.cap ? stIcon(r.ok ? 'si' : 'no') + Math.round(r.pct * 100) + ' %' : '') + '</td></tr>').join('') +
      '</tbody></table></div>' +
      note('Cada tramo de LED va en estrella hasta la fuente con par de cobre flexible; la sección se elige para que la caída de tensión sea de ' + Math.round(Z.caida * 100) + ' % o menos en el tramo más cargado, con un recorrido igual al largo del mueble más 0.50 m (estimado). Resistencia del cobre: ' + fuenteRef('iec60228') + '. La fuente se carga como máximo al ' + Math.round(Z.margen * 100) + ' % (criterio del grupo). Las fuentes van en un compartimento seco y registrable con una toma propia de 110 V.') +
      '<h4 class="n1-h4">Alimentación de las impresoras (mueble 7)</h4>' + note('Cuatro impresoras de 350 W como máximo a 110 V: 1400 W, unos 12.7 A, en un circuito propio de 20 A cargado al 64 % (criterio de 80 % como máximo, estimado). Cable de la acometida del circuito: 2 × 12 AWG + tierra en tubería o canaleta según el RETIE; un pasacable en el eje de cada impresora y la regleta bajo la tapa, dentro del mueble, con el cable de cada equipo en su canaleta. Imprimiendo PLA consumen unos 120 W cada una (' + fuenteRef('igor') + ').');
  }
  function doc4(doc) {
    const items = [{ id: 'd4-regla', t: '1 · Regla de los materiales' }, { id: 'd4-mats', t: '2 · Tabla de materiales de la versión ' + DEV }, { id: 'd4-compras', t: '3 · Lista consolidada de materiales' }, { id: 'd4-herr', t: '4 · Herrajes y tornillería consolidados' }, { id: 'd4-cable', t: '5 · Cableado' }, { id: 'd4-desp', t: '6 · Despiece de cada mueble · versión ' + DEV }];
    FABN.forEach((n) => items.push({ id: 'd4-desp-' + n, t: n + ' · ' + ROLE[n], sub: true }));
    items.push({ id: 'd4-un', t: '7 · Detalle de cada unión · versión ' + DEV });
    FABN.forEach((n) => items.push({ id: 'd4-un-' + n, t: n + ' · ' + ROLE[n], sub: true }));
    otras.forEach((v) => items.push({ id: 'd4-anx-' + v, t: 'Anexo · despiece y uniones de la versión ' + v + ' · ' + vinfo(v).nombre }));
    let s = cover(doc, '<div class="en-art-row">' + [10, 12, 17].map((n) => '<div>' + DW.isoSVG(DEV, n, 260, 170) + '</div>').join('') + '</div>') + toc(doc, items);
    s += sec('d4-regla', '1 · Regla de los materiales', lead('La guía pide al menos dos materiales por mueble y tres en el conjunto. Con qué se hace cada mueble de la versión ' + DEV + ' y cómo se cumple la regla.') + h.regla(DEV));
    s += sec('d4-mats', '2 · Tabla de materiales de la versión ' + DEV, lead('Cada material con su formato comercial, proveedor y precio consultado, en qué muebles va y por qué se eligió.') + h.mats(DEV));
    s += sec('d4-compras', '3 · Lista consolidada de materiales', lead('Lo que hay que comprar para fabricar los ' + FABN.length + ' muebles de la versión ' + DEV + ': las piezas de cada mueble se suman por material y se pasan a láminas, barras, metros o galones completos, con aprovechamiento de corte. Es la base de la lista de compras de la Nota 3.') + compras(DEV));
    const P = VS.precios;
    s += sec('d4-herr', '4 · Herrajes y tornillería consolidados', lead('Herrajes, tornillería e iluminación de los ' + FABN.length + ' muebles, sumados por referencia.') +
      '<div class="n1-tbl"><table><thead><tr><th>Elemento</th><th class="r">Cant.</th><th>Unidad de venta</th><th>Muebles</th><th>Usos</th></tr></thead><tbody>' +
      herrajesTot(DEV).map((r) => '<tr><td><b>' + esc(P[r.id].m) + '</b><small>' + esc(P[r.id].cat) + '</small></td><td class="r mono">' + r.q + '</td><td>' + esc(P[r.id].pres) + '</td><td>' + Array.from(r.m).sort((a, b) => a - b).join(', ') + '</td><td>' + Array.from(r.usos).map(esc).join(' · ') + '</td></tr>').join('') + '</tbody></table></div>');
    s += sec('d4-cable', '5 · Cableado', lead('Lo que lleva cable en cada mueble: metros de LED, fuente, tramo, sección del conductor y caída de tensión; y el circuito de las impresoras. El alojamiento de la fuente y el acceso para mantenimiento están en el documento 5.') + cableado(DEV));
    s += sec('d4-desp', '6 · Despiece de cada mueble · versión ' + DEV, lead('Despiece del mueble con su cantidad, material, medidas de corte y si se fabrica, se compra o se encarga; después los herrajes, la tornillería y la iluminación, y los acabados e insumos. Las marcas de las piezas coinciden con las de los planos del documento 3.') +
      FABN.map((n) => '<div class="en-mueble" id="d4-desp-' + n + '">' + h.despiece(DEV, n).replace(/<p class="n1-note">Medidas de corte[\s\S]*?<\/p>$/, '') + '</div>').join('') +
      note('Medidas de corte: largo × ancho × espesor para tableros y láminas; largo para tubos y perfiles. El costo de cada material está en el presupuesto de la versión (Nota 3). Los insumos de taller (lija, discos, brocas) van en la lista de compras de la Nota 3.'));
    s += sec('d4-un', '7 · Detalle de cada unión · versión ' + DEV, lead('Cómo se une un material con otro en cada mueble: detalle a escala 1:2 con medidas en mm, por qué se eligió esa unión, cómo se hace y qué herraje lleva. Los detalles constructivos en corte, a 1:5 y en su sitio en el mueble, están en la lámina .4 de cada mueble (documento 3).') +
      FABN.map((n) => { const un = L.uniones.of(DEV, n); return '<div class="en-mueble" id="d4-un-' + n + '"><h3>' + mueble(DEV, n) + ' <small>' + un.length + ' uniones</small></h3>' + h.uniones(DEV, n) + '</div>'; }).join(''));
    otras.forEach((v) => {
      s += sec('d4-anx-' + v, 'Anexo · despiece y uniones de la versión ' + v + ' · ' + vinfo(v).nombre, lead('La misma información para la versión ' + v + ', por si el cliente la elige: regla de los materiales, tabla de materiales, lista consolidada, cableado, despiece y uniones de cada mueble.') +
        '<h3>Regla de los materiales</h3>' + h.regla(v) + '<h3>Materiales de la versión ' + v + '</h3>' + h.mats(v) + '<h3>Lista consolidada</h3>' + compras(v) + '<h3>Cableado</h3>' + cableado(v) +
        FABN.map((n) => '<div class="en-mueble">' + h.despiece(v, n).replace(/<p class="n1-note">Medidas de corte[\s\S]*?<\/p>$/, '') + '<h4 class="n1-h4">Uniones</h4>' + h.uniones(v, n) + '</div>').join(''));
    });
    return s;
  }

  /* ================================================================ documento 5 */
  function alojamiento(v) {
    const Z = N.luz, rows = h.luzData(v), P = VS.precios;
    const card = (r) => {
      const it = VS.items[v][r.n], txt = it.ens.concat(it.fab).join(' ');
      const reg = /registr|desmont|tapa|abatible|bisagra|se saca|deslizando|imán/i.test(txt);
      const fuentes = r.cap ? r.d.fu.map((x) => x[2] + ' × ' + esc(P[x[0]].m)).join(' + ') : 'Sin fuente propia: ' + esc(r.nota);
      const led = it.piezas.filter((p) => Z.wm[p[0]]).map((p) => p[2] + ' × ' + esc(p[1]) + ' de ' + Math.round(p[3] * 1000) + ' mm (' + esc(P[p[0]].m) + ')').join(' · ');
      return '<article class="n1-card en-aloj"><header><span class="n1-num">' + r.n + '</span><div><h4>' + esc(ROLE[r.n]) + '</h4><small>' + vtag(v) + ' ' + esc(itemOf(v, r.n).name) + ' · ' + esc(itemOf(v, r.n).dims) + '</small></div></header>' +
        '<dl class="n1-dl sm">' +
        '<div><dt>Luz instalada</dt><dd>' + led + '<br><span class="mono">' + r.d.m.toFixed(2).replace('.', ',') + ' m · ' + Math.round(r.d.W) + ' W</span></dd></div>' +
        '<div><dt>Fuente</dt><dd>' + fuentes + (r.cap ? '<br><span class="mono">' + Math.round(r.load) + ' W de ' + r.cap + ' W · ' + Math.round(r.pct * 100) + ' %</span>' : '') + '</dd></div>' +
        '<div><dt>Alojamiento</dt><dd>' + esc(r.where || 'Dentro del mueble, en el compartimento de la fuente') + '. Compartimento seco, sin contacto con el producto ni con el filamento; la fuente se fija con dos tornillos por sus orejas y queda a 20 mm del fondo para que circule el aire.</dd></div>' +
        '<div><dt>Cableado</dt><dd>Toma de 110 V en el muro detrás del mueble; cordón de la fuente por un pasacable de 20 mm en el fondo del compartimento. De la fuente a cada tramo de LED: 2 × ' + String(r.sec[0]).replace('.', ',') + ' mm² Cu flexible, en estrella, por el canal del perfil o por una ranura de 8 mm en el fondo; caída de ' + (r.drop * 100).toFixed(1).replace('.', ',') + ' % en el tramo de ' + r.Lc.toFixed(1).replace('.', ',') + ' m.</dd></div>' +
        '<div><dt>Ventilación</dt><dd>' + (r.cap ? 'La fuente es de carcasa plástica sin IP publicado: el compartimento lleva dos ranuras de 60 × 8 mm (abajo y arriba, en lados opuestos) para que el aire entre por abajo y salga por arriba; no se encierra en espuma ni se tapa con el producto. La fuente se carga al ' + Math.round(r.pct * 100) + ' %, por debajo del ' + Math.round(Z.margen * 100) + ' % admitido, así que no calienta más de lo que la ventilación natural disipa.' : 'No tiene fuente: solo pasa el par de 12 V desde el mueble vecino; el LED disipa su calor por el perfil de aluminio o por el acrílico opal.') + '</dd></div>' +
        '<div><dt>Acceso para mantenimiento</dt><dd>' + (reg ? 'El mueble ya lo prevé: ' + esc((it.ens.concat(it.fab).find((t) => /registr|desmont|tapa|abatible|bisagra|se saca|deslizando|imán/i.test(t)) || '').replace(/\.$/, '')) + '.' : 'Tapa del compartimento de la fuente fijada con cuatro tornillos de cabeza visible (no encolada), del lado que queda libre al armar el mueble.') + ' Con eso se cambia la fuente o una tira sin desarmar el mueble: la tira COB se corta cada 25 mm y se pega de nuevo; el perfil se suelta de sus clips.</dd></div>' +
        '</dl></article>';
    };
    return '<div class="en-alojs">' + rows.map(card).join('') + '</div>';
  }
  function pantallas() {
    const f = N.fichas.filter((x) => /Televisor/.test(x.t));
    return '<div class="n1-tbl"><table><thead><tr><th>Pantalla</th><th>Dónde va</th><th>Alojamiento y soporte</th><th>Cableado</th><th>Ventilación y acceso</th></tr></thead><tbody>' +
      f.map((x) => { const p75 = /75/.test(x.t); return '<tr><td><b>' + esc(x.t) + '</b><small>' + esc(x.ref) + '</small></td><td>' + (p75 ? 'Muro del fondo de la sala de ventas, en vertical u horizontal según la versión, con el borde inferior a 1.10 m.' : 'Una en cada pilar de la fachada, en vertical, con el borde inferior a 1.20 m: se ven desde el pasillo.') + '</td><td>Soporte VESA fijo de pared para el tamaño (' + esc((x.rows.find((r) => /VESA/.test(r[0])) || ['', ''])[1]) + '); anclaje al muro o al pilar con cuatro anclajes de expansión de 10 mm (pedir la ficha del soporte: no se encontró la página del soporte de 32"–75").</td><td>Toma de 110 V y punto de red o HDMI detrás de la pantalla, dentro del área que tapa; el cable baja por canaleta hasta la toma.</td><td>Ventila por su propia carcasa: queda a 25 mm del muro con el soporte. Para mantenimiento se descuelga del soporte (dos personas la de 75").</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function doc5(doc) {
    const items = [{ id: 'd5-fichas', t: '1 · Fichas técnicas de la iluminación y del equipo' }, { id: 'd5-luz', t: '2 · Luz de cada mueble · versión ' + DEV }, { id: 'd5-aloj', t: '3 · Alojamiento, cableado, ventilación y acceso de la luz' }, { id: 'd5-imp', t: '4 · Impresoras integradas al mueble 7' }, { id: 'd5-pant', t: '5 · Pantallas de 75" y 55"' }];
    otras.forEach((v) => items.push({ id: 'd5-anx-' + v, t: 'Anexo · luz e impresoras de la versión ' + v + ' · ' + vinfo(v).nombre }));
    items.push({ id: 'd5-fuentes', t: 'Fuentes' });
    let s = cover(doc, '<div class="en-art-row">' + [7, 2, 4].map((n) => '<div>' + DW.isoSVG(DEV, n, 260, 170) + '</div>').join('') + '</div>') + toc(doc, items);
    s += sec('d5-fichas', '1 · Fichas técnicas de la iluminación y del equipo',
      lead('La iluminación (perfil LED, tira COB y sus fuentes) y el equipo (las cuatro impresoras Bambu Lab P1S y las pantallas) se compran y se integran al mueble. Cada ficha da la referencia exacta, el proveedor y el enlace consultado; cada dato dice si se verificó en la ficha del fabricante, si no está publicado, si es un cálculo del grupo o si las fuentes no coinciden.') +
      '<p class="n1-note">' + Object.keys(h.EST).map((k) => '<span class="n1-es e-' + k + '">' + h.EST[k] + '</span>').join(' ') + '</p>' + h.fichas());
    s += sec('d5-luz', '2 · Luz de cada mueble · versión ' + DEV, lead('Metros de LED y potencia de cada mueble, la fuente que los alimenta y su carga, el cable con su caída de tensión y dónde va la fuente.') + h.luzCalc(DEV) + h.cambios(DEV));
    s += sec('d5-aloj', '3 · Alojamiento, cableado, ventilación y acceso de la luz', lead('Una ficha por mueble con luz: qué LED lleva, qué fuente, dónde se aloja, por dónde va el cable, cómo ventila la fuente y cómo se llega a ella para cambiarla.') + alojamiento(DEV));
    s += sec('d5-imp', '4 · Impresoras integradas al mueble 7', lead('Las cuatro impresoras Bambu Lab P1S van dentro del mueble de impresoras de cada versión. Orientación, espacio sobre el AMS, ventilación, alimentación, cables y acceso para mantenimiento.') + h.impresoras(DEV) +
      note('Las impresoras tienen cámara cerrada con filtro de carbón activado y toman el aire del propio local: el mueble no lleva extracción. Las holguras detrás y encima no están publicadas por el fabricante: se dejan como mínimo 100 mm detrás (cables y salida de aire) y se confirma en el equipo que la tapa del AMS abre en el espacio que queda.'));
    s += sec('d5-pant', '5 · Pantallas de 75" y 55"', lead('Las pantallas no van dentro de un mueble: la de 75" en el muro y las de 55" en los pilares de la fachada.') + pantallas());
    otras.forEach((v) => { s += sec('d5-anx-' + v, 'Anexo · luz e impresoras de la versión ' + v + ' · ' + vinfo(v).nombre, '<h3>Luz de cada mueble</h3>' + h.luzCalc(v) + h.cambios(v) + '<h3>Alojamiento, cableado, ventilación y acceso</h3>' + alojamiento(v) + '<h3>Impresoras</h3>' + h.impresoras(v)); });
    s += sec('d5-fuentes', 'Fuentes', h.fuentes());
    return s;
  }

  /* ================================================================ documento 6 */
  function doc6(doc, opt) {
    const R = L.n1.state.renders || {}, G = (opt && opt.general) || {};
    const vers = (opt && opt.vers) || [DEV].concat(otras);
    const items = [{ id: 'd6-como', t: 'Cómo se hicieron los renders' }];
    vers.forEach((v) => { items.push({ id: 'd6-' + v, t: (v === DEV ? 'Versión ' : 'Anexo · versión ') + v + ' · ' + vinfo(v).nombre }); FABN.forEach((n) => items.push({ id: 'd6-' + v + '-' + n, t: n + ' · ' + ROLE[n] + ' · ' + itemOf(v, n).short, sub: true })); });
    let s = cover(doc, G[DEV] ? '<img class="en-art-img" src="' + G[DEV] + '" alt="">' : '') + toc(doc, items);
    s += sec('d6-como', 'Cómo se hicieron los renders',
      lead('Cada mueble se captura en su sitio del modelo 3D del local, con la iluminación general (luz del centro comercial por la fachada y luminarias del cielo raso), la luz del propio mueble (perfil LED o tira COB con su fuente, encendida), el producto exhibido y el equipo integrado: las impresoras en el mueble 7, los carretes en la repisa de filamento, las herramientas en el panel y el computador en el escritorio. La cámara se queda dentro de la sala (o de la trastienda) sin atravesar muros ni la mampara, a la altura de una persona de pie, y encuadra el mueble completo.') +
      '<div class="n1-tbl"><table><thead><tr><th>Dato</th><th>Valor</th></tr></thead><tbody>' +
      [['Modelo', 'El mismo modelo 3D del visor (three.js), con los muebles a su medida y en su posición de la planta A-01'], ['Iluminación', 'Luz física: sol difuso por la fachada, luminarias del local y la luz de cada mueble con su temperatura de color (3000 K cálida); sombras suaves y oclusión ambiental'], ['Materiales', 'Melamina Rovere, laca blanca, acero negro, lámina perforada, vidrio y acrílico opal, con sus texturas y brillos'], ['Cámara', 'Perspectiva de 45°, a 1.5–1.7 m de altura, dentro del espacio del mueble'], ['Formato', '1600 × 1000 px, JPEG al 88 %, capturados del navegador sin cabeza (Chromium) con render por software'], ['Dónde verlos en vivo', 'En el visor, Nota 1 → I · Renders, se capturan en el momento con la tarjeta de video del equipo; o en el 3D, seleccionando el mueble']].map((r) => '<tr><td><b>' + r[0] + '</b></td><td>' + esc(r[1]) + '</td></tr>').join('') + '</tbody></table></div>');
    vers.forEach((v) => {
      s += sec('d6-' + v, (v === DEV ? 'Versión ' : 'Anexo · versión ') + v + ' · ' + vinfo(v).nombre + ' — ' + vinfo(v).titulo,
        (G[v] ? '<figure class="en-rend en-rend-g"><img src="' + G[v] + '" alt="Vista general del local, versión ' + v + '"><figcaption><b>Vista general</b> desde el acceso · ' + esc(vinfo(v).concepto) + '</figcaption></figure>' : lead(esc(vinfo(v).concepto))), 'en-sec-min');
      FABN.forEach((n) => {
        const io = itemOf(v, n), lz = h.luzDe(v, n), eq = { 7: 'Cuatro impresoras Bambu Lab P1S con AMS', 9: 'Carretes de filamento', 11: 'Herramientas colgadas', 17: 'Computador y monitor', 5: 'Computador portátil del asesor' }[n];
        s += '<figure class="en-rend" id="d6-' + v + '-' + n + '">' + (R[v + n] ? '<img src="' + R[v + n] + '" alt="Render del mueble ' + n + ', versión ' + v + '">' : '<div class="en-norend">Sin capturar</div>') +
          '<figcaption><b>' + n + ' · ' + esc(ROLE[n]) + '</b> ' + vtag(v) + ' ' + esc(io.name) + ' <span class="mono">' + esc(io.dims) + '</span> · ' + esc(ESP(n).t) +
          (lz.m ? ' · luz propia: ' + lz.m.toFixed(2).replace('.', ',') + ' m de LED, ' + Math.round(lz.W) + ' W' : ' · sin luz propia') + (eq ? ' · equipo: ' + eq : '') + '</figcaption></figure>';
      });
    });
    return s;
  }

  /* ================================================================ armado */
  EN.html = function (num, opt) {
    const doc = DOCS.find((d) => d.num === num);
    return { doc, html: [doc1, doc2, doc3, doc4, doc5, doc6][num - 1](doc, opt) };
  };
  /* pinta el documento en la página (el visor queda oculto) y dibuja lo diferido */
  EN.mount = function (num, opt) {
    const { doc, html } = EN.html(num, opt);
    let root = $('#entrega');
    if (!root) { root = document.createElement('div'); root.id = 'entrega'; document.body.appendChild(root); }
    root.className = 'en-doc' + (doc.a3 ? ' is-a3' : doc.land ? ' is-land' : '');
    root.innerHTML = html;
    $$('[data-thumb]', root).forEach((el) => { const p = el.dataset.thumb.split('-'); el.innerHTML = DW.isoSVG(p[0], +p[1], 320, 240); });
    $$('.en-a3 > svg', root).forEach((sv, i) => { sv.dataset.sheet = i + 1; });
    $$('.n1-tbl', root).forEach((t) => { if (t.offsetHeight < 380) t.style.breakInside = 'avoid'; });
    document.body.classList.add('en-pdf'); document.documentElement.classList.add('en-pdf');
    document.title = 'BlackForge 3D · Documento ' + doc.num + ' · ' + doc.t;
    return { doc, pages: $$('.en-a3', root).length, ids: $$('[id]', root).map((e) => e.id) };
  };
  EN.setPages = function (map) {
    $$('[data-pg]').forEach((el) => { const p = map[el.dataset.pg]; el.textContent = p ? p : ''; });
    $$('.en-a3 > svg').forEach((sv) => { const id = sv.parentNode.id; if (map['__sheet' + sv.dataset.sheet]) EN.pageLabel(sv, map['__sheet' + sv.dataset.sheet]); void id; });
  };
  EN.unmount = function () { const r = $('#entrega'); if (r) r.remove(); document.body.classList.remove('en-pdf'); document.documentElement.classList.remove('en-pdf'); };
})();
