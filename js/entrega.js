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
      '<div class="en-kicker">' + (doc.kicker || 'Nota 1 · Diseño del mobiliario · Documento ' + doc.num + ' de ' + DOCS.length) + '</div>' +
      '<h1>' + esc(doc.t) + '</h1><p class="en-sub">' + esc(doc.sub) + '</p>' +
      '<div class="en-art">' + (art || '') + '</div>' +
      '<dl class="en-meta">' +
      '<div><dt>Proyecto</dt><dd>' + esc(N.ficha.nombre) + '</dd></div>' +
      '<div><dt>Curso</dt><dd>Diseño VIII · Producción · UPTC Duitama · guía «Del mueble a la planta»</dd></div>' +
      (doc.ver ? '<div><dt>Espacio que se documenta</dt><dd>' + vtag(doc.ver) + ' ' + esc(vinfo(doc.ver).nombre) + ' — ' + esc(vinfo(doc.ver).titulo) + (doc.req ? '' : ' <small>(promedio en la matriz de selección: ' + best.avg[doc.ver].toFixed(2) + ' de 5; gana en ' + best.wins[doc.ver] + ' de ' + FABN.length + ' muebles)</small>') + '</dd></div>'
        : '<div><dt>Versión que se desarrolla</dt><dd>' + vtag(DEV) + ' ' + esc(vinfo(DEV).nombre) + ' — ' + esc(vinfo(DEV).titulo) + ' <small>(mayor promedio en la matriz de selección: ' + best.avg[DEV].toFixed(2) + ' de 5; gana en ' + best.wins[DEV] + ' de ' + FABN.length + ' muebles)</small></dd></div>') +
      '<div><dt>Fecha</dt><dd>' + (doc.fecha || FECHA) + '</dd></div>' +
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
    const vi = vinfo(v), lam = 'Z-0' + (idx + 1);
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
    VER.forEach((v) => items.push({ id: 'd1-esp-' + v, t: 'Z-01 a Z-04 · versión ' + v + ' · ' + F.espacios.length + ' espacios', sub: true }));
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
      '<tr><td><b>Z-01 a Z-04</b> Plano de cada espacio</td><td class="mono">1:25 en A3 horizontal</td><td>40 mm en el papel = 1.00 m; recorte de A-01 al doble</td><td>Escala gráfica de 2 m; la ventana del recorte lleva sus dos cotas</td></tr>' +
      '<tr><td><b>V-nn.1</b> a <b>V-nn.5</b> Planos de los muebles (documento 3)</td><td class="mono">1:10, 1:20, 1:5 según el mueble</td><td>Escala escrita en el rótulo de cada lámina y en cada vista</td><td>Las cotas mandan sobre la medida a escala</td></tr>' +
      '</tbody></table></div>' +
      note('Las láminas A3 van en este PDF a su tamaño real: deben imprimirse al 100 % (sin «ajustar a la página») para que la escala se conserve. Si se imprimen en A4, la escala pasa a ser aproximadamente 1:71 y 1:35; la escala gráfica sigue siendo válida.'));
    // planos
    s += sec('d1-planos', '4 · Planta de distribución y mobiliario, escala 1:50', lead('La planta de cada versión, con cotas del local, pasos entre muebles, cuadro de mobiliario con medidas y presupuesto de materiales. Una lámina A3 por versión; las tres versiones usan las mismas medidas del local y cambia la distribución.') +
      '<h3 id="d1-espacios">5 · Plano de cada espacio, escala 1:25</h3>' + lead('Cada espacio del local recortado de la planta al doble de la escala, con la posición del recorte en el local, la escala gráfica y el cuadro de sus muebles. ' + F.espacios.length + ' láminas A3 por versión, después de las tres plantas.') +
      '<div class="n1-tbl"><table><thead><tr><th>Lámina</th><th>Contenido</th><th>Versión</th><th>Escala</th></tr></thead><tbody>' +
      VER.map((v) => '<tr><td><b>A-01</b></td><td>Planta de distribución y mobiliario</td><td>' + vtag(v) + ' ' + esc(vinfo(v).nombre) + '</td><td class="mono">1:50</td></tr>').join('') +
      VER.map((v) => F.espacios.map((e, i) => '<tr><td><b>Z-0' + (i + 1) + '</b></td><td>Espacio: ' + esc(e.t) + ' · muebles ' + e.n.join(', ') + '</td><td>' + vtag(v) + ' ' + esc(vinfo(v).nombre) + '</td><td class="mono">1:25</td></tr>').join('')).join('') + '</tbody></table></div>', 'en-sec-min');
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

  /* ================================================================ expediente de un espacio (versión)
     Un PDF por versión del local, con los cinco requisitos de la guía y lo necesario para que otra
     persona fabrique cada mueble sin preguntar: guía de lectura, especificaciones generales, reglas de
     perforación de los herrajes, ficha de fabricación por mueble con sus láminas y control de calidad. */
  const VDOC = { A: { num: 1 }, B: { num: 2 }, C: { num: 3 } };
  const FECHA_V = '4 de noviembre de 2026';
  /* reglas de taller para perforar y montar cada herraje (práctica corriente; se confirman con la ficha del herraje) */
  const HREG = {
    bisagraCaz: ['Cazoleta Ø35 mm, 12–13 mm de profundidad, con el borde a 4 mm del canto de la puerta.', 'Primera y última bisagra a 100 mm de los extremos; 2 bisagras hasta 900 mm de alto, 3 hasta 1600 mm.', 'Base en el costado a 37 mm del canto frontal (sistema 32); tornillos 4 × 16 mm. Holgura entre puertas: 3 mm.'],
    riel45: ['Riel de extensión total de 450 mm: el cajón mide el hueco menos 12,7 mm por lado (verificar con el riel).', 'Riel del costado a 37 mm del canto frontal, nivelado y paralelo al piso del cuerpo; tornillos 4 × 16 mm.', 'El frente se monta después, con 2 mm de luz entre frentes y 3 mm a los bordes del cuerpo.'],
    manija: ['Dos perforaciones Ø5 mm a 128 mm entre ejes, centradas en el ancho del frente.', 'Eje a 40 mm del canto superior del frente (criterio del grupo); tornillo M4 × 25 mm por detrás.'],
    tornEns: ['Tornillo de ensamble en tablero de 15 mm: broca escalonada Ø5/Ø7 mm en el eje del espesor (7,5 mm del canto).', 'A 50 mm de cada extremo y cada 200 mm como máximo; cabeza avellanada a ras y tapada con tapatornillo del color.'],
    tornAuto: ['Fija lámina, tablero o herraje al tubo sin pretaladro; cada 300 mm como máximo y a 25 mm de los extremos.', 'En tablero de 15 mm, máximo 5/8" de largo para no pasar a la cara vista.'],
    tornM6: ['Rosca M6 en el tubo: broca Ø5 mm y macho M6, o tuerca remachable M6 en broca Ø9 mm (tubo calibre 18).', 'Arandela plana bajo la cabeza; apriete moderado, sin aplastar el tablero.'],
    chazo: ['Broca de concreto de 3/8" (10 mm), 55 mm de profundidad, a 100 mm o más del borde del muro.', 'Antes de perforar, verificar que no pase tubería ni cableado (detector).', 'Muro de bloque o drywall: cambiar por anclaje de expansión para el material (consultar al centro comercial).'],
    nivelador: ['Tuerca de 5/16" soldada al tubo o placa de 3 mm con rosca en la pata; recorrido útil ±15 mm.', 'Se nivela con nivel de burbuja en dos direcciones antes de cargar el mueble.'],
    pataNiv: ['Placa de la pata atornillada bajo el piso del cuerpo con 4 tornillos 4 × 16 mm, a 50 mm de las esquinas.', 'El zócalo se fija a las patas con su clip; se regula la altura antes de poner el zócalo.'],
    bisagraSold: ['Se sueldan las dos mitades con la puerta montada y calzada a 3 mm de holgura, ejes alineados.', 'Se pule la soldadura, se pinta y se engrasa el pistón.'],
    ganchos: ['Verificar que el diámetro y el paso de la perforación de la lámina coincidan con los ganchos antes de cortar la lámina.'],
    pasacable: ['Perforación del tamaño del pasacable (medir la pieza comprada) en el eje de cada equipo, a 50 mm del fondo.'],
    fuente3: ['Fuente fijada por sus orejas con 2 tornillos 4 × 16 mm, con 20 mm libres alrededor; nunca encerrada sin ventilación.', 'Clavija a una toma de 110 V propia; salida de 12 V al LED por el pasacable.'],
    pegante: ['Capa delgada en las dos caras, prensado 30 min y curado de 24 h antes de cargar.'],
    soporteInv: ['Perforación Ø10 mm × 140 mm en el canto trasero de la repisa, centrada en el espesor (repisa de 25 mm o más).', 'Tubo al muro con su chazo; la repisa entra a presión y se nivela.'],
    kitBatiente: ['Se instala según el kit (bisagra, chapeta y manija); el vidrio templado llega perforado de fábrica: enviar el plano de perforación a la vidriería.'],
    escuadra: ['Escuadra 3030 con tuercas en T de la ranura del perfil; tornillos M6 apretados en cruz.'],
    kitRiel: ['Riel de 200 cm atornillado al muro o al marco cada 400 mm; holgura de 10 mm entre la puerta y el piso.']
  };
  HREG.fuente5 = HREG.fuente3; HREG.fuente8 = HREG.fuente3; HREG.fuente12 = HREG.fuente3;
  function reglasHerrajes(v) {
    const P = VS.precios, used = {};
    FABN.forEach((n) => VS.items[v][n].herrajes.forEach((x) => { (used[x[0]] = used[x[0]] || new Set()).add(n); }));
    return '<div class="n1-tbl"><table><thead><tr><th>Herraje</th><th>Muebles</th><th>Cómo se perfora y se monta</th></tr></thead><tbody>' +
      (() => { const g = []; Object.keys(used).filter((k) => P[k]).sort((a, b) => P[a].m.localeCompare(P[b].m)).forEach((k) => { const r = HREG[k] || null, x = r && g.find((y) => y.r === r); if (x) { x.k.push(k); used[k].forEach((n) => x.n.add(n)); } else g.push({ r, k: [k], n: new Set(used[k]) }); }); return g; })()
        .map((x) => '<tr><td>' + x.k.map((k) => '<b>' + esc(P[k].m) + '</b><small>' + esc(P[k].pres) + '</small>').join('') + '</td><td class="mono">' + Array.from(x.n).sort((a, b) => a - b).join(', ') + '</td><td>' + (x.r ? '<ul class="en-ul">' + x.r.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul>' : 'Según la ficha del herraje.') + '</td></tr>').join('') +
      '</tbody></table></div>' + note('Reglas de taller (práctica corriente de carpintería y metalmecánica): antes de perforar la primera pieza se confirman con la ficha del herraje comprado. Las posiciones de cada herraje en el mueble están en el plano de ensamble (.1) y en los detalles (.4).');
  }
  function especificaciones(v) {
    const vi = vinfo(v), fams = new Set(); FABN.forEach((n) => L.uniones.familias(v, n).forEach((f) => fams.add(f)));
    const rows = [
      ['Unidades y cotas', 'Todas las medidas en milímetros salvo que se indique. Las cotas mandan sobre la medida tomada a escala; si una cota falta o no cuadra, no se corta: se anota y se pregunta al diseñador (es un error del plano).'],
      ['Tolerancias', 'Corte de tablero ±0,5 mm; corte de tubo y perfil ±1 mm; escuadra del mueble armado: diagonales iguales con ±2 mm; medida general ±2 mm; nivel ±1 mm por metro.'],
      ['Tableros', 'Se piden cortados y enchapados al proveedor con la lista de piezas (sección 3). Canto de PVC de 2 mm en los cantos vistos y de 0,45 mm en los ocultos; la veta del Rovere va a lo largo de la pieza, como marca cada lámina de piezas.'],
      ['Metal', 'Tubo de acero calibre 18 cortado a 90° (o a 45° donde el plano lo indica), soldadura MIG continua en las uniones cargadas y por puntos en las demás; se pule, se desengrasa y se pintan dos manos de anticorrosivo y el acabado.'],
      ['Tornillería', 'Zincada; los tornillos de ensamble van con tapatornillo del color del tablero. Ninguna punta puede salir a una cara vista.'],
      ['Iluminación', 'Perfil y tira LED a 12 V con su fuente propia; cada tramo en estrella hasta la fuente, con la sección de cable indicada en la sección 4. La fuente queda accesible y ventilada.'],
      ['Montaje en sitio', 'Se nivela cada mueble antes de anclarlo; los anclajes a muro se hacen después de verificar con detector que no pase tubería; los muebles altos van anclados al muro siempre.'],
      ['Entrega', 'Cada mueble se revisa con su lista de control de calidad (ficha de fabricación) antes de recibirlo; se protegen cantos y vidrios para el transporte.']
    ];
    return '<div class="n1-tbl"><table><tbody>' + rows.map((r) => '<tr><th style="width:30mm">' + r[0] + '</th><td>' + esc(r[1]) + '</td></tr>').join('') + '</tbody></table></div>' +
      note('Familias de materiales de la versión ' + v + ' · ' + esc(vi.nombre) + ': ' + Array.from(fams).map((f) => esc(L.uniones.famT[f])).join(' · ') + '. Tolerancias y cantos: criterio del grupo con base en la práctica de taller; se ajustan con el fabricante si su maquinaria trabaja con otras.');
  }
  function controlCalidad(v, n) {
    const it = VS.items[v][n], ids = new Set(it.herrajes.map((x) => x[0])), txt = it.piezas.map((p) => p[0]).join(' ');
    const c = ['Medidas generales como en el plano de ensamble (±2 mm) y diagonales iguales (±2 mm).'];
    if (/tubo|perfil3030|perforada/.test(txt)) c.push('Soldaduras o uniones de perfil completas, sin escoria ni filos; pintura pareja, sin chorreos.');
    if (/rovere|blanca|mdf|fondo/.test(txt)) c.push('Cantos pegados sin desprendimientos; ninguna punta de tornillo en caras vistas; tapatornillos puestos.');
    if (ids.has('riel45')) c.push('Cada cajón abre y cierra completo sin roce, con 2 mm de luz pareja entre frentes.');
    if (ids.has('bisagraCaz') || ids.has('bisagraSold') || ids.has('kitBatiente') || ids.has('kitRiel')) c.push('Puertas a escuadra, con holgura pareja de 3 mm, sin roce al abrir.');
    if (h.luzDe(v, n).m) c.push('La luz enciende en todos sus tramos, sin parpadeo; la fuente se alcanza sin desarmar el mueble.');
    if (ids.has('nivelador') || ids.has('pataNiv')) c.push('Mueble nivelado en las dos direcciones, sin cojear.');
    if (ids.has('chazo')) c.push('Anclado al muro con todos sus chazos; no se mueve al empujarlo.');
    if (n === 7) c.push('Las cuatro impresoras caben con su AMS, abren su puerta y se pueden deslizar hacia adelante para mantenimiento.');
    return '<ul class="en-qc">' + c.map((x) => '<li><i></i>' + esc(x) + '</li>').join('') + '</ul>';
  }
  function fichaFab(v, n, sheets) {
    const it = VS.items[v][n], io = itemOf(v, n), f = L.n1.matrix(n).F[v], lz = h.luzDe(v, n), un = L.uniones.of(v, n), P = VS.precios;
    const fams = L.uniones.familias(v, n).map((x) => '<span class="n1-chip">' + esc(L.uniones.famT[x].split(' (')[0]) + '</span>').join(' ');
    const pend = (VS.req[n] || []).map((r, i) => [r, (VS.cumple(n, v)[i] || ['si', ''])]).filter((x) => x[1][0] !== 'si');
    const cam = N.cambios.filter((c) => c.v === v && c.n === n);
    return '<section class="en-sec en-fab" id="v-fab-' + n + '" data-title="' + esc(n + ' · ' + ROLE[n]) + '">' +
      '<header class="en-fab-h"><span class="en-fab-n">' + nn(n) + '</span><div><small>' + esc(ESP(n).t) + ' · ficha de fabricación</small><h2>' + esc(ROLE[n]) + '</h2><p>' + esc(io.name) + '</p></div>' + vtag(v) + '</header>' +
      '<div class="en-fab-top"><div class="en-fab-iso">' + DW.isoSVG(v, n, 300, 220) + '</div><dl class="n1-dl sm">' +
      '<div><dt>Medidas (L × F × H)</dt><dd class="mono">' + esc(io.dims) + '</dd></div><div><dt>Cantidad</dt><dd>' + esc(it.cant || '1') + '</dd></div>' +
      '<div><dt>Ubicación</dt><dd>' + esc(it.ubic || ESP(n).d) + '</dd></div><div><dt>Materiales</dt><dd>' + fams + '</dd></div>' +
      '<div><dt>Piezas · oficios</dt><dd>' + f.piezas + ' piezas · ' + f.oficios.length + ' oficios (' + esc(f.oficios.join(', ')) + ')</dd></div>' +
      '<div><dt>Uniones · pasos de montaje</dt><dd>' + un.length + ' tipos de unión · ' + f.ens + ' pasos</dd></div>' +
      '<div><dt>Luz propia</dt><dd>' + (lz.m ? lz.m.toFixed(2).replace('.', ',') + ' m de LED · ' + Math.round(lz.W) + ' W' : 'No lleva') + '</dd></div>' +
      '<div><dt>Costo de materiales</dt><dd class="mono">' + cop(f.costo) + '</dd></div></dl></div>' +
      '<p class="en-fab-res">' + esc(io.it.resumen || base(n).resumen || '') + '</p>' +
      '<div class="en-fab-cols"><div><h4 class="n1-h4">1 · Fabricación en el taller</h4><ol class="en-steps">' + it.fab.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol></div>' +
      '<div><h4 class="n1-h4">2 · Montaje en el local</h4><ol class="en-steps">' + it.ens.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol></div></div>' +
      '<h4 class="n1-h4">3 · Herrajes y tornillería</h4><div class="n1-tbl"><table><thead><tr><th>Elemento</th><th class="r">Cant.</th><th>Dónde va</th><th>Se compra por</th></tr></thead><tbody>' +
      it.herrajes.map((x) => '<tr><td><b>' + esc(P[x[0]].m) + '</b></td><td class="r mono">' + x[2] + '</td><td>' + esc(x[1]) + '</td><td>' + esc(P[x[0]].pres) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<div class="en-fab-cols"><div><h4 class="n1-h4">4 · Láminas de este mueble</h4><div class="n1-tbl"><table><tbody>' +
      sheets.map((sh) => '<tr><td class="mono"><a href="#v-sh-' + sh.id + '"><b>' + esc(sh.code) + '</b></a></td><td>' + esc(sh.title) + '<small>' + esc(sh.sub || '') + '</small></td><td class="r mono"><span data-pg="v-sh-' + sh.id + '"></span></td></tr>').join('') + '</tbody></table></div>' +
      note('Despiece completo, uniones y luz de este mueble: secciones 3 y 4.') + '</div>' +
      '<div><h4 class="n1-h4">5 · Control de calidad antes de entregar</h4>' + controlCalidad(v, n) +
      (pend.length || cam.length ? '<h4 class="n1-h4">Observaciones</h4><ul class="en-ul">' + cam.map((c) => '<li><b>Cambio:</b> ' + esc(c.antes) + ' → ' + esc(c.despues) + '. ' + esc(c.causa) + '</li>').join('') + pend.map((x) => '<li><b>' + (x[1][0] === 'no' ? 'No cumple' : 'Con salvedad') + ':</b> ' + esc(x[0]) + ' — ' + esc(x[1][1]) + '</li>').join('') + '</ul>' : '') +
      '</div></div></section>';
  }
  const base = (n) => h.base[n] || {};
  function docV(doc) {
    const v = doc.ver, vi = vinfo(v), F = N.ficha, E = N.escalado, best = h.resumen(), list = PN.sheets(v), fab = PN.fab(v).map((d) => d.n);
    const row = (t, d, cls) => '<div class="' + (cls || '') + '"><dt>' + esc(t) + '</dt><dd>' + d + '</dd></div>';
    const items = [
      { id: 'v-1', t: '1 · Ficha del proyecto y planos a escala' }, { id: 'v-1-plan', t: 'A-01 · Planta de distribución y mobiliario, 1:50', sub: true }, { id: 'v-1-esp', t: 'Z-01 a Z-04 · Plano de cada zona, 1:25', sub: true },
      { id: 'v-3', t: '2 · Planos técnicos y fichas de fabricación' }, { id: 'v-3-esp', t: 'Especificaciones generales y reglas de herrajes', sub: true }
    ];
    fab.forEach((n) => items.push({ id: 'v-fab-' + n, t: v + '-' + nn(n) + ' · ' + ROLE[n] + ' · ' + itemOf(v, n).short, sub: true }));
    items.push({ id: 'v-4', t: '3 · Despiece, materiales, herrajes, cableado y uniones' }, { id: 'v-4-desp', t: 'Despiece de cada mueble', sub: true }, { id: 'v-4-un', t: 'Detalle de cada unión', sub: true },
      { id: 'v-5', t: '4 · Iluminación y equipo' }, { id: 'v-5-aloj', t: 'Alojamiento, cableado, ventilación y acceso', sub: true }, { id: 'v-5-imp', t: 'Impresoras y pantallas', sub: true },
      { id: 'v-6', t: '5 · Verificación final y fuentes' });
    let s = cover(doc, '<div class="en-art-plan">' + L.plan.svg(v, { cotas: false, nums: true }) + '</div>') + toc(doc, items);

    /* 1 · ficha y planos */
    s += sec('v-1', '1 · Ficha del proyecto y planos a escala',
      lead(esc(F.encargo)) +
      '<dl class="n1-dl">' + row('Proyecto', esc(F.nombre)) + row('Tipo', esc(F.tipo)) + row('Ubicación', esc(F.ubicacion), /confirmar/.test(F.ubicacion) ? 'is-todo' : '') + row('Ciudad', esc(F.ciudad), /confirmar/i.test(F.ciudad) ? 'is-todo' : '') +
      row('Áreas', esc(F.area)) + row('Fachada', esc(F.fachada)) + row('Fuente del plano', esc(F.fuentePlano)) + row('Fecha de consulta', esc(F.consulta)) + '</dl>' +
      '<h3>El espacio ' + v + ' · ' + esc(vi.nombre) + ' <small>' + esc(vi.titulo) + '</small></h3>' +
      '<div class="en-ver is-win" style="--vc:' + vi.color + '"><div class="en-ver-l"><div class="en-ver-iso">' + DW.isoSVG(v, 3, 300, 200) + '</div><p class="en-ver-sc"><b>' + best.avg[v].toFixed(2) + '</b> de 5 en promedio en la matriz · gana en ' + best.wins[v] + ' de ' + FABN.length + ' muebles · materiales ' + cop(VS.calc(v).total) + '</p></div>' +
      '<div class="en-ver-r"><p>' + esc(vi.concepto) + '</p><div class="en-ver-cols"><div><h5>Distribución</h5><ul>' + vi.distribucion.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul><h5>Materiales</h5><ul>' + vi.materiales.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' +
      '<div><h5>A favor</h5><ul>' + vi.ventajas.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul><h5>En contra</h5><ul>' + vi.contras.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div></div></div></div>' +
      '<h3>Zonas y muebles</h3><div class="n1-tbl"><table><thead><tr><th>Zona</th><th>Qué pasa ahí</th><th>Muebles</th><th>Lámina</th></tr></thead><tbody>' +
      F.espacios.map((e, i) => '<tr><td><b>' + esc(e.t) + '</b></td><td>' + esc(e.d) + '</td><td>' + e.n.map((k) => '<span class="n1-chip">' + k + ' · ' + esc(itemOf(v, k).short) + '</span>').join(' ') + '</td><td class="mono">Z-0' + (i + 1) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<h3>Referencia de escalado</h3>' + note(esc(E.texto)) +
      '<div class="n1-tbl"><table><thead><tr><th>Referencia</th><th>Cómo se usó</th><th>Dato</th></tr></thead><tbody>' +
      E.refs.map((r) => '<tr><td><b>' + esc(r.t) + '</b></td><td>' + esc(r.d) + '</td><td>' + tipoTag(r.tipo) + ' ' + esc(h.SHORT[r.f] || r.f) + '</td></tr>').join('') + '</tbody></table></div>' + note(esc(E.nota)) +
      '<div class="n1-tbl"><table><thead><tr><th>Lámina</th><th>Escala</th><th>Equivalencia</th><th>Comprobación</th></tr></thead><tbody>' +
      '<tr><td><b>A-01</b> Planta de distribución</td><td class="mono">1:50 en A3</td><td>20 mm = 1,00 m; el frente de 6,00 m mide 120 mm</td><td>Escala gráfica de 3 m</td></tr>' +
      '<tr><td><b>Z-01 a Z-04</b> Plano de cada zona</td><td class="mono">1:25 en A3</td><td>40 mm = 1,00 m</td><td>Escala gráfica de 2 m y cotas de la ventana</td></tr>' +
      '<tr><td><b>' + v + '-nn.1 a .n</b> Planos de los muebles</td><td class="mono">1:5 a 1:25</td><td>Escrita en el rótulo y en cada vista</td><td>Las cotas mandan</td></tr></tbody></table></div>' +
      note('Los planos de los otros dos espacios están en sus propios expedientes; aquí, la planta A-01 de este espacio y sus cuatro zonas a 1:25 (láminas Z-01 a Z-04).'));
    s += a3(L.plan.svg(v, { cotas: true, nums: true }), 'v-1-plan');
    F.espacios.forEach((e, i) => { s += a3(espacioSVG(v, e, i), i === 0 ? 'v-1-esp' : null); });

    /* 3 · planos y fichas de fabricación */
    s += sec('v-3', '2 · Planos técnicos y fichas de fabricación', lead('Primero las especificaciones que valen para todos los muebles; después, para cada mueble, su ficha de fabricación seguida de sus láminas A3: plano de ensamble (vistas, corte, planta, isometría, cotas, escala y rótulo), despiece explosionado, secuencia de ensamble, detalles constructivos y piezas con sus medidas de corte.') +
      '<h3 id="v-3-esp">Especificaciones generales de fabricación</h3>' + especificaciones(v) +
      '<h3>Reglas de perforación y montaje de los herrajes</h3>' + reglasHerrajes(v));
    s += a3(DW.indice(v), 'v-sh-g');
    fab.forEach((n) => {
      const sh = list.filter((x) => x.n === n);
      s += fichaFab(v, n, sh);
      sh.forEach((x) => { s += a3(PN.draw(v, x), 'v-sh-' + x.id); });
    });

    /* 4 · despiece */
    s += sec('v-4', '3 · Despiece, materiales, herrajes, cableado y uniones', lead('Para comprar y cortar. La regla de materiales de la guía, la tabla de materiales con su formato y proveedor, la lista consolidada de compras, los herrajes sumados y el cableado; después, el despiece y las uniones de cada mueble.') +
      '<h3>Regla de los materiales</h3>' + h.regla(v) + '<h3>Tabla de materiales</h3>' + h.mats(v) + '<h3>Lista consolidada de compras</h3>' + compras(v) +
      '<h3>Herrajes y tornillería consolidados</h3><div class="n1-tbl"><table><thead><tr><th>Elemento</th><th class="r">Cant.</th><th>Unidad de venta</th><th>Muebles</th><th>Usos</th></tr></thead><tbody>' +
      herrajesTot(v).map((r) => { const P = VS.precios; return '<tr><td><b>' + esc(P[r.id].m) + '</b></td><td class="r mono">' + r.q + '</td><td>' + esc(P[r.id].pres) + '</td><td>' + Array.from(r.m).sort((a, b) => a - b).join(', ') + '</td><td>' + Array.from(r.usos).map(esc).join(' · ') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<h3>Cableado</h3>' + cableado(v));
    s += '<section class="en-sec" id="v-4-desp" data-title="Despiece de cada mueble"><h2>Despiece de cada mueble</h2>' + note('Marcas de pieza como en el despiece explosionado (.2). Medidas de corte: largo × ancho × espesor para tableros; largo para tubos y perfiles.') +
      FABN.map((n) => '<div class="en-mueble">' + h.despiece(v, n).replace(/<p class="n1-note">Medidas de corte[\s\S]*?<\/p>$/, '') + '</div>').join('') + '</section>';
    s += '<section class="en-sec" id="v-4-un" data-title="Detalle de cada unión"><h2>Detalle de cada unión</h2>' + note('Detalle a escala 1:2, medidas en mm: por qué se eligió, cómo se hace y qué herraje lleva. Los detalles en corte y en su sitio están en la lámina .4 de cada mueble.') +
      FABN.map((n) => { const un = L.uniones.of(v, n); return '<div class="en-mueble"><h3>' + mueble(v, n) + ' <small>' + un.length + ' uniones</small></h3>' + h.uniones(v, n) + '</div>'; }).join('') + '</section>';

    /* 5 · iluminación y equipo */
    s += sec('v-5', '4 · Iluminación y equipo', lead('La iluminación (perfil LED, tira COB y sus fuentes) y el equipo (impresoras Bambu Lab P1S y pantallas) se compran y se integran. Cada dato de ficha dice si se verificó en la del fabricante, si no está publicado, si es un cálculo o si las fuentes no coinciden.') +
      '<p class="n1-note">' + Object.keys(h.EST).map((k) => '<span class="n1-es e-' + k + '">' + h.EST[k] + '</span>').join(' ') + '</p>' + h.fichas() +
      '<h3>Luz de cada mueble</h3>' + h.luzCalc(v) + h.cambios(v));
    s += '<section class="en-sec" id="v-5-aloj" data-title="Alojamiento, cableado y acceso"><h2>Alojamiento, cableado, ventilación y acceso</h2>' + alojamiento(v) + '</section>';
    s += '<section class="en-sec" id="v-5-imp" data-title="Impresoras y pantallas"><h2>Impresoras y pantallas</h2><h3>Impresoras integradas al mueble 7</h3>' + h.impresoras(v) +
      note('Las impresoras tienen cámara cerrada con filtro de carbón y toman el aire del local: el mueble no lleva extracción. Se dejan como mínimo 100 mm detrás para cables y salida de aire; las holguras no están publicadas por el fabricante.') +
      '<h3>Pantallas de 75" y 55"</h3>' + pantallas() + '</section>';

    /* 6 · verificación */
    const ver = FABN.map((n) => { const pend = (VS.req[n] || []).filter((r, i) => (VS.cumple(n, v)[i] || ['si'])[0] !== 'si').length; return '<tr><td><b>' + n + '</b> ' + esc(itemOf(v, n).short) + '</td>' + ['Ficha', 'Láminas', 'Despiece', 'Uniones', 'Luz'].map((k) => '<td class="rq-si">' + stIcon('si') + '</td>').join('') + '<td class="' + (pend ? 'rq-parcial' : 'rq-si') + '">' + stIcon(pend ? 'parcial' : 'si') + (pend ? pend + ' requisito' + (pend > 1 ? 's' : '') + ' con salvedad' : 'Cumple') + '</td></tr>'; }).join('');
    s += sec('v-6', '5 · Verificación final y fuentes',
      lead('Qué está completo para cada mueble y qué queda por confirmar antes de mandar a fabricar.') +
      '<div class="n1-tbl"><table><thead><tr><th>Mueble</th><th>Ficha</th><th>Láminas</th><th>Despiece</th><th>Uniones</th><th>Luz y equipo</th><th>Requisitos</th></tr></thead><tbody>' + ver + '</tbody></table></div>' +
      '<h3>Antes de fabricar, confirmar</h3><ul class="en-ul">' +
      '<li>Medir el local en sitio (las medidas salen de la imagen del proyecto, escalada con el frente de 6,00 m).</li>' +
      '<li>Nombre del centro comercial y ciudad, y su reglamento para anclar a muros y a la losa.</li>' +
      '<li>Confirmar cada herraje con su ficha antes de perforar la primera pieza (reglas de la sección 2).</li>' +
      '<li>Lo que la tabla de rastreo deja por decidir con el grupo:</li></ul>' + h.rastreo() +
      '<h3>Uso de inteligencia artificial</h3><p class="n1-box">' + esc(F.ia) + '</p><h3>Fuentes</h3>' + h.fuentes());
    return s;
  }
  EN.verDoc = function (v) {
    const vi = vinfo(v);
    return { num: VDOC[v].num, ver: v, id: 'esp-' + v, file: 'espacio-' + VDOC[v].num + '-' + vi.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'), t: 'Espacio ' + VDOC[v].num + ' · ' + vi.nombre, label: 'Espacio ' + VDOC[v].num + ' · ' + vi.nombre,
      sub: 'Expediente de diseño y fabricación del mobiliario: ficha y planos a escala, planos técnicos, despiece y uniones, iluminación y equipo', kicker: 'Nota 1 · Diseño del mobiliario · Expediente del espacio ' + VDOC[v].num + ' de 3', fecha: FECHA_V };
  };
  /* ================================================================ requisitos de un espacio
     Un PDF por versión del local: los requisitos que pide un taller de impresión 3D en la vida real y,
     para cada mueble de ese espacio, sus requisitos con su fuente y cómo los resuelve la propuesta.
     No compara con los otros espacios. */
  const RF = {
    niosh: { t: 'NIOSH (2023). Approaches to Safe 3D Printing: A guide for makerspace users, schools, libraries, and small businesses. DHHS (NIOSH) Publicación 2024-103.', u: 'https://www.cdc.gov/niosh/docs/2024-103/pdfs/2024-103.pdf', tipo: 'fuente', s: 'NIOSH 2024-103' },
    wki: { t: 'Fraunhofer WKI. 3D printer: emisiones de partículas ultrafinas y COV de impresoras FDM.', u: 'https://www.iaqip.wki.fraunhofer.de/en/all_topics/3d_printer.html', tipo: 'fuente', s: 'Fraunhofer WKI' },
    box: { t: 'Bambu Lab Wiki. Sealed box: almacenamiento de filamento, humedad recomendada.', u: 'https://wiki.bambulab.com/en/filament-acc/acc/sealed-box', tipo: 'fuente', s: 'Bambu Lab Wiki' },
    retilap: { t: 'RETILAP 2026, Libro 3, tabla 3.2.2.6 a: iluminancia media mantenida por espacio (tomado de la guía de Hegocom; confirmar en el PDF oficial del Ministerio de Minas y Energía).', u: 'https://hegocomca.com/guias/tabla-lux-retilap-2026', tipo: 'secundaria', s: 'RETILAP 2026' },
    nfpa10: { t: 'NFPA 10 (2022), extintores portátiles: distancia de recorrido y altura de instalación (tomado de la cartilla de extintores de Seguros Sura).', u: 'https://www.segurossura.com.co/empresasura/Documentacion%20Formacion/cartilla-extintores.pdf', tipo: 'secundaria', s: 'NFPA 10' }
  };
  const rref = (k) => { if (RF[k]) return tipoTag(RF[k].tipo) + ' <span class="n1-fref">' + esc(RF[k].s) + '</span>'; if (k && N.fuentes[k]) return tipoTag(N.fuentes[k].tipo) + ' <span class="n1-fref">' + esc(h.SHORT[k] || k) + '</span>'; return tipoTag('estimado') + ' <span class="n1-fref">Criterio del grupo</span>'; };
  /* requisitos generales de un taller de impresión 3D abierto al público */
  function realGeneral(v) {
    const it = (n) => itemOf(v, n).short;
    const G = [
      ['Aire y emisiones', [
        ['Las impresoras FDM emiten partículas ultrafinas y compuestos orgánicos volátiles; más con ABS que con PLA o PETG.', 'Imprimir de preferencia PLA y PETG a la menor temperatura que funcione; ABS solo con el equipo cerrado.', 'wki'],
        ['Ventilación general del área de impresión: mínimo 6 renovaciones de aire por hora, o un purificador portátil con filtro HEPA.', 'Se pide al centro comercial el caudal del local; si no llega, se suma un purificador HEPA junto al mueble ' + 7 + ' (' + it(7) + ').', 'niosh'],
        ['Mantener la mayor distancia posible entre las impresoras y las personas; vigilar por cámara en vez de estar al lado.', 'El público ve las impresoras sin pararse sobre ellas; las P1S son cerradas, con filtro de carbón activado.', 'niosh'],
        ['Esperar unos 20 minutos después de imprimir antes de abrir el equipo cerrado.', 'Se anota en el procedimiento de la dependienta: retirar piezas al terminar la ventilación.', 'niosh']]],
      ['Filamento', [
        ['Filamento abierto guardado en caja sellada con desecante, por debajo de 20 % de humedad relativa, con higrómetro.', 'Lo que se exhibe en la repisa (mueble 9) son carretes sellados; los abiertos van en cajas secas en la trastienda.', 'box'],
        ['En el aire del local (45 a 65 % HR) un filamento recién secado pierde calidad en 2 a 12 horas.', 'Los carretes en uso quedan dentro del AMS de cada impresora, que es cerrado.', 'box']]],
      ['Electricidad', [
        ['Equipos puestos a tierra; no usar regletas para alimentar las impresoras.', 'Circuito propio para las cuatro impresoras con tomas fijas dentro del mueble ' + 7 + '.', 'niosh'],
        ['La iluminación LED de 12 V de un local con público sigue el RETIE: fuentes certificadas, accesibles y protegidas.', 'Cada fuente va en un compartimento seco y registrable (expediente del espacio, sección 4).', 'retie'],
        ['Cuatro impresoras de 350 W máximo a 110 V suman unos 12,7 A: circuito de 20 A cargado como máximo al 80 %.', 'Circuito dedicado de 20 A para el mueble de impresoras, con su propio interruptor en el tablero.', null]]],
      ['Incendio', [
        ['Impresoras en un área con detección de humo y alejadas de material combustible.', 'Detector de humo sobre el mueble de impresoras; nada de cartón ni filamento suelto encima de los equipos.', 'niosh'],
        ['Extintor portátil a no más de 22,9 m de recorrido, con la parte superior a 1,53 m del piso como máximo y señalizado.', 'Extintor de CO₂ o agente limpio (fuego eléctrico, clase C) junto a la entrada de la trastienda, visible desde la sala.', 'nfpa10']]],
      ['Iluminación', [
        ['Área general de ventas: 300 lx con reproducción de color de 80 o más y luz vertical suficiente en los estantes.', 'Luz general del local más el LED propio de cada mueble de exhibición (2, 3, 4, 12, 13).', 'retilap'],
        ['Caja y mesa de empaque: 500 lx; puesto de computador: 500 lx; montaje fino: 750 lx.', 'Barra de atención (5) y escritorio (17) con luz de tarea; panel de herramientas (11) junto al trabajo de mantenimiento.', 'retilap']]],
      ['Personas y recorrido', [
        ['Pasos para el público de 1,20 m de ancho.', 'Ver la tabla de normas de este espacio y los pasos acotados en la planta A-01.', 'ntc4140'],
        ['Puerta de la trastienda con 0,80 m libres como mínimo.', 'Puerta de 0,90 m en la mampara.', 'nsr10k'],
        ['Lo que el cliente toca entre la altura de alcance de la persona más baja y la de la más alta (Acopla95).', 'Producto principal entre 0,60 y 1,60 m en todos los muebles de exhibición.', 'acopla']]],
      ['Mantenimiento y limpieza', [
        ['Limpiar con paño húmedo o aspiradora con filtro HEPA; no barrer en seco ni usar aire comprimido.', 'Superficies lisas y lavables (melamina, laca, acero pintado); sin rincones que acumulen polvo bajo las impresoras.', 'niosh'],
        ['Acceso para cambiar placa, boquilla y filamento sin mover el mueble.', 'Impresoras con el frente libre y espacio detrás para deslizarlas (mueble 7).', 'fichaP1S']]]
    ];
    return G.map((g) => '<h3>' + esc(g[0]) + '</h3><div class="n1-tbl"><table><thead><tr><th style="width:38%">Requisito</th><th style="width:16%">Fuente</th><th>Cómo lo resuelve este espacio</th></tr></thead><tbody>' +
      g[1].map((r) => '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + rref(r[2]) + '</td><td>' + esc(r[1]) + '</td></tr>').join('') + '</tbody></table></div>').join('');
  }
  /* requisitos de operación de cada mueble en un taller real (complemento de los del diseño) */
  const ROLEREQ = {
    2: [['Entrepaños con carga de producto sin flecharse; más de 1,20 m de alto: anclado al muro contra volcamiento.', null], ['Producto principal entre 0,60 y 1,60 m, a la altura de los ojos de la mayoría.', 'acopla'], ['Luz vertical en cada nivel con color fiel (80 o más de reproducción de color).', 'retilap'], ['Superficies lavables con paño húmedo.', 'niosh']],
    3: [['Estable sin anclaje: no se voltea cuando alguien se apoya en un borde.', null], ['Paso libre alrededor para que dos personas se crucen.', 'ntc4140'], ['Esquinas redondeadas o romas: queda a la altura de la cadera de un adulto y la cabeza de un niño.', null], ['Tapa resistente al roce diario de piezas y manos.', null]],
    4: [['Visible desde el pasillo del centro comercial: es la pieza que hace entrar al cliente.', null], ['Luz de acento sobre la pieza, más fuerte que la general del local.', null], ['Estable y sin bordes cortantes a la altura de las manos.', null]],
    5: [['Altura de atención de pie entre 0,90 y 1,10 m y un tramo accesible más bajo con espacio para las rodillas.', null], ['Espacio para computador, pantalla y terminal de pago, con tomas de corriente y cables ocultos.', null], ['Luz de 500 lx en la caja y en la mesa donde se empaca.', 'retilap'], ['Asientos con los pies apoyados: altura del asiento según la poplítea de la persona más baja.', 'acopla']],
    7: [['Superficie rígida que no vibre: las impresoras aceleran fuerte y una tapa que se mueve arruina la pieza.', null], ['Carga de cuatro impresoras con su AMS y su filamento, con margen.', 'fichaP1S'], ['Espacio detrás para cables y salida de aire, y encima para abrir el AMS.', 'fichaP1S'], ['Ventilación del área y distancia al público.', 'niosh'], ['Circuito propio, tomas fijas puestas a tierra, sin regletas.', 'niosh'], ['Detector de humo encima y nada combustible sobre los equipos.', 'niosh']],
    9: [['Carretes sellados o en caja seca: el filamento absorbe humedad del aire.', 'box'], ['Sin sol directo ni fuentes de calor sobre los carretes.', null], ['El carrete más alto al alcance de la persona más baja, o con apoyo seguro para alcanzarlo.', 'acopla'], ['Rotación por fecha y etiqueta visible de material y color.', null]],
    10: [['Cajones con rieles que aguanten repuestos metálicos (boquillas, placas, correas, herramientas).', null], ['Divisiones para piezas pequeñas y un cajón para el alcohol isopropílico de limpiar placas, lejos de las fuentes de calor.', null], ['Superficie de trabajo a la altura del codo para mantenimiento de pie.', 'acopla']],
    11: [['Herramientas a la vista entre 0,90 y 1,70 m, junto a las impresoras.', 'acopla'], ['Puntas y cuchillas protegidas o colgadas hacia abajo.', null], ['Luz de tarea para trabajo fino (750 lx) donde se cambian boquillas y se ajustan piezas.', 'retilap']],
    12: [['Vidrio templado si lleva vidrio; cerradura si exhibe piezas de valor.', 'nsr10k4'], ['Luz interna LED que no caliente el producto.', null], ['Centro de la vitrina a la altura de los ojos.', 'acopla']],
    13: [['No reducir el ancho libre del acceso ni de la ruta de evacuación.', 'ntc4140'], ['Anclada si es alta; estable al roce de quien entra.', null], ['Producto de entrada visible desde el pasillo.', null]],
    15: [['Separa la trastienda sin bloquear la circulación del aire del local.', null], ['Puerta con 0,80 m libres; franja de contraste si es de vidrio.', 'nsr10k'], ['Resistente a golpes de carros y cajas.', null]],
    17: [['Puesto de computador con 500 lx sobre la mesa.', 'retilap'], ['Altura de mesa y espacio para las piernas según las medidas del cuerpo.', 'acopla'], ['Tomas y canaleta para computador, monitor e impresora de papel.', null]]
  };
  function hechos(v, n) {
    const it = VS.items[v][n], io = itemOf(v, n), lz = h.luzDe(v, n), P = VS.precios, ids = it.herrajes.map((x) => x[0]), F = [];
    F.push('Medidas: ' + io.dims + '.');
    F.push('Materiales: ' + L.uniones.familias(v, n).map((x) => L.uniones.famT[x]).join(', ') + '.');
    const ch = it.herrajes.find((x) => x[0] === 'chazo'); if (ch) F.push('Anclado al muro: ' + ch[1].toLowerCase() + ' (' + P.chazo.m + ').');
    if (ids.indexOf('nivelador') >= 0 || ids.indexOf('pataNiv') >= 0) F.push('Niveladores para asentarlo en un piso irregular.');
    if (ids.indexOf('riel45') >= 0) F.push('Cajones con ' + P.riel45.m.toLowerCase() + '.');
    if (lz.m) F.push('Luz propia: ' + lz.m.toFixed(2).replace('.', ',') + ' m de LED, ' + Math.round(lz.W) + ' W a 12 V.');
    return F;
  }
  function reqMueble(v, n, pre) {
    const A = N.antro, M = N.muebles[n], reqs = VS.req[n] || [], io = itemOf(v, n), it = VS.items[v][n];
    const rows = reqs.map((r, i) => { const s = M.src[i] || { tipo: 'no', d: '' }, c = VS.cumple(n, v)[i] || ['si', '']; return '<tr><td><b>' + esc(r) + '</b></td><td>' + tipoTag(s.tipo) + ' ' + fuenteRef(s.f) + (s.d ? '<small>' + esc(s.d) + '</small>' : '') + '</td><td class="rq-' + c[0] + '">' + stIcon(c[0]) + esc(c[1]) + '</td></tr>'; }).join('');
    return '<section class="en-sec en-fab" id="r-m-' + n + '" data-title="' + esc(n + ' · ' + ROLE[n]) + '">' + (pre || '') +
      '<header class="en-fab-h"><span class="en-fab-n">' + nn(n) + '</span><div><small>' + esc(ESP(n).t) + ' · requisitos</small><h2>' + esc(ROLE[n]) + '</h2><p>' + esc(io.name) + '</p></div>' + vtag(v) + '</header>' +
      '<div class="en-fab-top"><div class="en-fab-iso">' + DW.isoSVG(v, n, 300, 220) + '</div><div><dl class="n1-dl sm">' +
      '<div><dt>Quién lo usa</dt><dd>' + esc(M.usuario) + '</dd></div><div><dt>Para qué</dt><dd>' + esc(M.uso) + '</dd></div><div><dt>Espacio alrededor</dt><dd>' + esc(M.entorno) + '</dd></div><div><dt>Medidas</dt><dd class="mono">' + esc(io.dims) + '</dd></div></dl>' +
      '<p class="en-fab-res">' + esc(io.it.resumen || base(n).resumen || '') + '</p></div></div>' +
      '<h4 class="n1-h4">Medidas del cuerpo que lo condicionan</h4><ul class="n1-meds">' + M.medidas.map((m) => { const a = A[m[0]]; return '<li><b>' + esc(a.t) + '</b> <span class="mono">P5 ' + f1(a.p5) + ' · P95 ' + f1(a.p95) + ' cm</span><p>' + esc(m[1]) + '</p></li>'; }).join('') + '</ul>' +
      '<h4 class="n1-h4">Requisitos de diseño y cómo los cumple la propuesta</h4><div class="n1-tbl"><table><thead><tr><th style="width:30%">Requisito</th><th style="width:28%">Fuente o dato</th><th>En esta propuesta</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="en-fab-cols"><div><h4 class="n1-h4">Requisitos de uso en un taller real</h4><div class="n1-tbl"><table><tbody>' + (ROLEREQ[n] || []).map((r) => '<tr><td>' + esc(r[0]) + '</td><td style="width:34%">' + rref(r[1]) + '</td></tr>').join('') + '</tbody></table></div></div>' +
      '<div><h4 class="n1-h4">Cómo responde la propuesta</h4><ul class="en-ul">' + hechos(v, n).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      (it.why && it.why.length ? '<h4 class="n1-h4">Decisiones de diseño</h4><ul class="en-ul">' + it.why.map((w) => '<li><b>' + esc(w.t) + ':</b> ' + esc(w.d) + '</li>').join('') + '</ul>' : '') + '</div></div></section>';
  }
  function normasV(v) {
    return '<div class="n1-tbl"><table><thead><tr><th style="width:34%">Requisito</th><th style="width:18%">Fuente</th><th>En este espacio</th></tr></thead><tbody>' +
      N.normas.map((r) => '<tr><td><b>' + esc(r.t) + '</b><small>' + esc(r.d) + '</small></td><td>' + tipoTag(N.fuentes[r.f].tipo) + ' ' + fuenteRef(r.f) + '</td><td class="rq-' + r.v[v][0] + '">' + stIcon(r.v[v][0]) + esc(r.v[v][1]) + '</td></tr>').join('') + '</tbody></table></div>';
  }
  function docR(doc) {
    const v = doc.ver, vi = vinfo(v);
    const items = [{ id: 'r-1', t: '1 · El espacio y su mobiliario' }, { id: 'r-2', t: '2 · Lo que exige un taller de impresión 3D real' }, { id: 'r-3', t: '3 · Medidas del cuerpo y normas' }, { id: 'r-4', t: '4 · Requisitos de cada mueble' }];
    FABN.forEach((n) => items.push({ id: 'r-m-' + n, t: v + '-' + nn(n) + ' · ' + ROLE[n] + ' · ' + itemOf(v, n).short, sub: true }));
    items.push({ id: 'r-5', t: '5 · Fuentes' });
    let s = cover(doc, '<div class="en-art-plan">' + L.plan.svg(v, { cotas: false, nums: true }) + '</div>') + toc(doc, items);
    const sum = h.resumen();
    s += sec('r-1', '1 · El espacio y su mobiliario',
      lead('El espacio <b>' + v + ' · ' + esc(vi.nombre) + '</b> (' + esc(vi.titulo) + ') resuelve un local de 42 m² que vende impresoras, filamento y piezas impresas y que imprime a la vista del público. Este documento reúne lo que cada uno de sus ' + FABN.length + ' muebles tiene que cumplir y de dónde sale cada requisito.') +
      '<p class="n1-box">' + esc(vi.concepto) + '</p>' +
      '<div class="n1-tbl"><table><thead><tr><th>Mueble</th><th>Propuesta</th><th>Zona</th><th>Medidas (m)</th></tr></thead><tbody>' +
      FABN.map((n) => '<tr><td><b>' + n + '</b> ' + esc(ROLE[n]) + '</td><td>' + esc(itemOf(v, n).name) + '</td><td>' + esc(ESP(n).t) + '</td><td class="mono nw">' + esc(itemOf(v, n).dims.replace(' m', '')) + '</td></tr>').join('') + '</tbody></table></div>' +
      note('Cada requisito dice de dónde sale: ' + tipoTag('fuente') + ' norma, estudio o ficha citada · ' + tipoTag('secundaria') + ' fuente que cita a otra · ' + tipoTag('encargo') + ' lo pide el proyecto · ' + tipoTag('estimado') + ' criterio del grupo.'));
    s += sec('r-2', '2 · Lo que exige un taller de impresión 3D real', lead('Antes de los muebles, el local: un taller de impresión abierto al público tiene que resolver el aire, el filamento, la electricidad, el fuego, la luz, el recorrido y la limpieza. Cada requisito lleva su fuente y cómo lo resuelve este espacio.') + realGeneral(v));
    s += sec('r-3', '3 · Medidas del cuerpo y normas', '<h3>Medidas del cuerpo</h3>' + h.antro() + '<h3>Normas de accesibilidad, estructura y electricidad en este espacio</h3>' + normasV(v) +
      note('Donde el espacio cumple con salvedad o no cumple, el ajuste queda anotado para decidirlo con el grupo antes de fabricar.'));
    const pre = '<div id="r-4"><h2>4 · Requisitos de cada mueble</h2>' + lead('Para cada mueble: quién lo usa, para qué y en qué espacio; las medidas del cuerpo que lo condicionan; sus requisitos de diseño con la fuente y cómo los cumple la propuesta; y lo que pide su uso diario en un taller de impresión real.') + '</div>';
    FABN.forEach((n, i) => { s += reqMueble(v, n, i ? '' : pre); });
    const refs = Object.keys(RF).map((k) => '<li><b>' + esc(RF[k].s) + '.</b> ' + esc(RF[k].t) + ' <a href="' + esc(RF[k].u) + '">Enlace</a> <small>' + tipoTag(RF[k].tipo) + ' Consultado el 4 de noviembre de 2026.</small></li>').join('');
    s += sec('r-5', '5 · Fuentes', '<h3>Fuentes del taller de impresión</h3><ol class="n1-refs">' + refs + '</ol><h3>Fuentes del diseño</h3>' + h.fuentes());
    void sum;
    return s;
  }
  EN.reqDoc = function (v) {
    const vi = vinfo(v), num = VDOC[v].num;
    return { num, ver: v, id: 'req-' + v, file: 'requisitos-espacio-' + num + '-' + vi.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'), t: 'Requisitos del mobiliario · Espacio ' + num + ' · ' + vi.nombre, label: 'Espacio ' + num + ' · ' + vi.nombre,
      sub: 'Lo que exige un taller de impresión 3D real y los requisitos de cada mueble de este espacio, con su fuente y cómo los resuelve la propuesta', kicker: 'Nota 1 · Requisitos del mobiliario · Espacio ' + num + ' de 3', fecha: FECHA_V, req: true };
  };
  /* ================================================================ compras de un espacio
     Un PDF por versión del local con los proveedores del visor: cada material y herraje de cada mueble
     enlaza a la página de compra de la tienda. Resumen por tienda, lista consolidada y lista por mueble. */
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
  const buy = (u, txt) => u ? '<a class="en-buy" href="' + esc(u) + '">' + esc(txt || 'Comprar') + ' ↗</a>' : '<span class="en-buy is-off">Cotizar</span>';
  const mlink = (m, u) => u ? '<a class="en-mlink" href="' + esc(u) + '">' + esc(m) + '</a>' : esc(m);
  function provData(v) {
    const c = VS.calc(v), P = VS.precios, by = {};
    c.compras.forEach((r) => {
      const p = P[r.id], k = p.prov;
      const g = (by[k] = by[k] || { prov: k, rows: [], total: 0, hosts: new Set(), muebles: new Set() });
      const mu = FABN.filter((n) => VS.items[v][n].piezas.concat(VS.items[v][n].acabados, VS.items[v][n].herrajes).some((x) => x[0] === r.id));
      g.rows.push({ id: r.id, p, r, mu }); g.total += r.costo; if (p.u) g.hosts.add(host(p.u)); mu.forEach((n) => g.muebles.add(n));
    });
    const list = Object.values(by).sort((a, b) => b.total - a.total);
    list.forEach((g) => g.rows.sort((a, b) => a.p.cat.localeCompare(b.p.cat) || b.r.costo - a.r.costo));
    return { list, total: c.total, refs: c.compras.length };
  }
  function docP(doc) {
    const v = doc.ver, vi = vinfo(v), D = provData(v), P = VS.precios, C = VS.calc(v);
    const items = [{ id: 'p-1', t: '1 · Resumen de compras' }, { id: 'p-2', t: '2 · Compras por tienda' }];
    D.list.forEach((g, i) => items.push({ id: 'p-t-' + i, t: g.prov + ' · ' + cop(g.total), sub: true }));
    items.push({ id: 'p-3', t: '3 · Materiales de cada mueble' });
    FABN.forEach((n) => items.push({ id: 'p-m-' + n, t: v + '-' + nn(n) + ' · ' + ROLE[n] + ' · ' + cop(C.items[n].total), sub: true }));
    items.push({ id: 'p-4', t: '4 · Equipos que se compran' }, { id: 'p-5', t: '5 · Cómo usar esta lista' });
    let s = cover(doc, '<div class="en-kpis">' +
      '<div><b>' + cop(D.total) + '</b><span>materiales, herrajes e insumos</span></div><div><b>' + D.refs + '</b><span>referencias</span></div><div><b>' + D.list.length + '</b><span>tiendas</span></div><div><b>' + FABN.length + '</b><span>muebles</span></div></div>');
    s += toc(doc, items);
    const max = Math.max.apply(null, D.list.map((g) => g.total));
    s += sec('p-1', '1 · Resumen de compras',
      lead('Para fabricar los ' + FABN.length + ' muebles del espacio <b>' + v + ' · ' + esc(vi.nombre) + '</b> se compran ' + D.refs + ' referencias en ' + D.list.length + ' tiendas, por ' + cop(D.total) + '. Cada material de este documento es un enlace: tocarlo abre su página de compra en la tienda.') +
      '<div class="en-bars">' + D.list.map((g, i) => '<a class="en-bar" href="#p-t-' + i + '"><span class="en-bar-n">' + esc(g.prov) + '<small>' + g.rows.length + ' referencia' + (g.rows.length > 1 ? 's' : '') + ' · ' + Array.from(g.hosts).join(', ') + '</small></span><span class="en-bar-t"><i style="width:' + (100 * g.total / max).toFixed(1) + '%"></i></span><b class="mono">' + cop(g.total) + '</b></a>').join('') + '</div>' +
      '<h3>Por tipo de material</h3><div class="n1-tbl"><table><thead><tr><th>Tipo</th><th class="r">Referencias</th><th class="r">Costo</th><th class="r">Parte del total</th></tr></thead><tbody>' +
      (() => { const t = {}; C.compras.forEach((r) => { const k = P[r.id].cat; t[k] = t[k] || [0, 0]; t[k][0]++; t[k][1] += r.costo; }); return Object.keys(t).sort((a, b) => t[b][1] - t[a][1]).map((k) => '<tr><td><b>' + esc(k) + '</b></td><td class="r mono">' + t[k][0] + '</td><td class="r mono">' + cop(t[k][1]) + '</td><td class="r mono">' + Math.round(100 * t[k][1] / D.total) + ' %</td></tr>').join(''); })() +
      '</tbody></table></div>' +
      '<h3>Por mueble</h3><div class="n1-tbl"><table><thead><tr><th>Mueble</th><th>Propuesta</th><th class="r">Referencias</th><th class="r">Materiales</th></tr></thead><tbody>' +
      FABN.map((n) => '<tr><td><a href="#p-m-' + n + '"><b>' + n + '</b> ' + esc(ROLE[n]) + '</a></td><td>' + esc(itemOf(v, n).name) + '</td><td class="r mono">' + C.items[n].mats.length + '</td><td class="r mono">' + cop(C.items[n].total) + '</td></tr>').join('') +
      '<tr class="n1-tot"><td colspan="3"><b>Total del espacio</b></td><td class="r mono"><b>' + cop(D.total) + '</b></td></tr></tbody></table></div>' +
      note('Precios publicados en línea por cada tienda (consultados en octubre de 2026; la fecha y las ofertas van en la nota de cada material). Las láminas, barras y galones se compran completos: la cantidad ya incluye el aprovechamiento de corte.'));
    s += '<section class="en-sec" id="p-2" data-title="Compras por tienda"><h2>2 · Compras por tienda</h2>' + lead('La lista para ir a comprar: agrupada por tienda, con la cantidad que se pide, el precio unitario, el costo y los muebles que la usan.');
    D.list.forEach((g, i) => {
      s += '<div class="en-shop" id="p-t-' + i + '"><header><div><h3>' + esc(g.prov) + '</h3><small>' + Array.from(g.hosts).map((x) => '<a href="https://' + x + '">' + x + '</a>').join(' · ') + '</small></div><b class="mono">' + cop(g.total) + '</b></header>' +
        '<div class="n1-tbl"><table><thead><tr><th style="width:34%">Material</th><th>Se pide</th><th class="r">Precio</th><th class="r">Costo</th><th>Muebles</th><th></th></tr></thead><tbody>' +
        g.rows.map((x) => '<tr><td><b>' + mlink(x.p.m, x.p.u) + '</b><small>' + esc(x.p.pres) + (x.p.nota ? ' · ' + esc(x.p.nota) : '') + '</small></td><td>' + esc(x.r.texto) + '</td><td class="r mono nw">' + esc(VS.precioTxt(x.p)) + '</td><td class="r mono nw">' + cop(x.r.costo) + '</td><td class="mono">' + x.mu.join(', ') + '</td><td class="r">' + buy(x.p.u) + '</td></tr>').join('') +
        '</tbody></table></div></div>';
    });
    s += '</section>';
    s += '<section class="en-sec" id="p-3" data-title="Materiales de cada mueble"><h2>3 · Materiales de cada mueble</h2>' + lead('Cada mueble con sus materiales, herrajes e insumos: para qué se usa cada uno, cuánto lleva el mueble, la tienda y su enlace de compra. El costo de las láminas y galones compartidos se reparte según lo que usa cada mueble.');
    FABN.forEach((n, i) => {
      const it = C.items[n], io = itemOf(v, n);
      s += '<div class="en-pm' + (i ? ' en-page' : '') + '" id="p-m-' + n + '"><header class="en-fab-h"><span class="en-fab-n">' + nn(n) + '</span><div><small>' + esc(ESP(n).t) + ' · materiales y compras</small><h2>' + esc(ROLE[n]) + '</h2><p>' + esc(io.name) + ' · <span class="mono">' + esc(io.dims) + '</span></p></div><div class="en-pm-tot"><small>Materiales</small><b class="mono">' + cop(it.total) + '</b></div></header>' +
        '<div class="en-pm-top"><div class="en-fab-iso">' + DW.isoSVG(v, n, 260, 180) + '</div><p class="en-fab-res">' + esc(io.it.resumen || base(n).resumen || '') + '</p></div>' +
        '<div class="n1-tbl"><table><thead><tr><th style="width:30%">Material</th><th style="width:30%">Para qué</th><th>Lleva</th><th>Tienda</th><th class="r">Costo</th><th></th></tr></thead><tbody>' +
        it.mats.slice().sort((a, b) => b.costo - a.costo).map((r) => { const p = P[r.key]; return '<tr><td><b>' + mlink(r.m, r.u) + '</b><small>' + esc(r.pu) + '</small></td><td><small class="en-uso">' + esc(r.uso) + '</small></td><td class="nw">' + esc(r.cant || '') + '</td><td>' + esc(r.prov) + '</td><td class="r mono nw">' + cop(r.costo) + '</td><td class="r">' + buy(r.u || (p && p.u)) + '</td></tr>'; }).join('') +
        '<tr class="n1-tot"><td colspan="4"><b>Total del mueble</b></td><td class="r mono nw"><b>' + cop(it.total) + '</b></td><td></td></tr></tbody></table></div></div>';
    });
    s += '</section>';
    const eq = DATA.items.filter((d) => d.origen !== 'fabrica');
    const eqLink = (m) => (/P1S/.test(m.m) ? [N.fuentes.fichaP1S.u, 'Comprar'] : /75Q6QV/.test(m.m) ? [N.fichas.find((f) => f.id === 'tv75').u, 'Ficha'] : /55Q6QV/.test(m.m) ? [N.fichas.find((f) => f.id === 'tv55').u, 'Ficha'] : [null]);
    s += sec('p-4', '4 · Equipos que se compran', lead('Lo que no se fabrica: impresoras, pantallas, sillas, estanterías de bodega y materas. Es igual en los tres espacios.') +
      '<div class="n1-tbl"><table><thead><tr><th>Elemento</th><th>Producto</th><th class="r">Cant.</th><th>Precio</th><th>Tienda</th><th class="r">Costo</th><th></th></tr></thead><tbody>' +
      eq.map((d) => d.mats.map((m, j) => { const l = eqLink(m); return '<tr><td>' + (j ? '' : '<b>' + d.n + '</b> ' + esc(d.short || d.name)) + '</td><td><b>' + mlink(m.m, l[0]) + '</b><small>' + esc(m.uso) + (m.nota ? ' · ' + esc(m.nota) : '') + '</small></td><td class="r mono">' + esc(m.cant) + '</td><td class="mono nw">' + esc(m.pu) + '</td><td>' + esc(m.prov) + '</td><td class="r mono nw">' + cop(m.costo) + '</td><td class="r">' + (l[0] ? buy(l[0], l[1]) : '<span class="en-buy is-off">Buscar en tienda</span>') + '</td></tr>'; }).join('')).join('') +
      '<tr class="n1-tot"><td colspan="5"><b>Total de equipos</b></td><td class="r mono nw"><b>' + cop(eq.reduce((a, d) => a + d.mats.reduce((b, m) => b + m.costo, 0), 0)) + '</b></td><td></td></tr></tbody></table></div>' +
      note('Las impresoras tienen enlace a la tienda del distribuidor; las pantallas, a la ficha del fabricante (el precio es de Homecenter). Los demás equipos no tienen enlace guardado en el visor: se buscan por su nombre en la tienda indicada.'));
    s += sec('p-5', '5 · Cómo usar esta lista', '<ol class="en-steps">' +
      '<li>Empezar por la <b>sección 2</b>: una tienda por vez, con la cantidad que se pide de cada referencia.</li>' +
      '<li>Tocar el nombre del material o el botón <b>Comprar ↗</b>: abre la página del producto en la tienda (en el PDF, en el navegador).</li>' +
      '<li>Confirmar precio y existencias antes de pagar: los precios son de octubre de 2026 y algunas ofertas tienen fecha de vencimiento.</li>' +
      '<li>Los tableros se piden cortados y enchapados con la lista de piezas del expediente del espacio; los tubos y perfiles, por barra completa.</li>' +
      '<li>Para pedir cotización por volumen, la sección 3 da lo que lleva cada mueble.</li></ol>' +
      '<p class="n1-box">Precios al público como los publica cada tienda (en Colombia, normalmente con IVA incluido). Total de materiales del espacio: <b>' + cop(D.total) + '</b>; equipos: sección 4. Modelo 3D con todos los proveedores: <a href="' + esc(N.ficha.enlace) + '">' + esc(N.ficha.enlace) + '</a>.</p>');
    return s;
  }
  EN.provDoc = function (v) {
    const vi = vinfo(v), num = VDOC[v].num;
    return { num, ver: v, id: 'prov-' + v, file: 'compras-espacio-' + num + '-' + vi.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'), t: 'Lista de compras · Espacio ' + num + ' · ' + vi.nombre, label: 'Espacio ' + num + ' · ' + vi.nombre,
      sub: 'Materiales, herrajes e insumos de cada mueble con su tienda, su precio y el enlace a la página de compra', kicker: 'Proveedores y compras · Espacio ' + num + ' de 3', fecha: FECHA_V, req: true, sec2: 'Lista de compras' };
  };
  /* ================================================================ ficha del proyecto (una hoja) */
  function archSVG() {
    const d = new DOMParser().parseFromString(L.plan.svg('B', { cotas: true, nums: false }), 'image/svg+xml');
    $$('.mob, .table, .block, .legend, .pasos', d).forEach((g) => g.remove());
    const sv = d.documentElement; sv.setAttribute('viewBox', '8 30 214 238'); sv.removeAttribute('width'); sv.removeAttribute('height');
    $$('text.title, text.subtitle', d).forEach((t) => t.remove());
    return new XMLSerializer().serializeToString(sv);
  }
  function docF(doc) {
    const F = N.ficha, todo = (x) => /confirmar/i.test(x);
    const row = (t, d, cls) => '<tr class="' + (cls || '') + '"><th>' + esc(t) + '</th><td>' + d + '</td></tr>';
    const areas = [['Sala de ventas', '6,00 × 5,50 m', 33.0], ['Mampara', '6,00 × 0,10 m', 0.6], ['Trastienda y taller', '6,00 × 1,40 m', 8.4]];
    return '<section class="en-ficha1">' +
      '<header class="en-f1-h"><div><div class="en-brand"><b>BlackForge</b> 3D <span>Local de exhibición y taller de impresión 3D</span></div><h1>Ficha del proyecto</h1><p>Nota 1 · Diseño del mobiliario · Diseño VIII · Producción · UPTC Duitama</p></div></header>' +
      '<div class="en-f1-grid"><div class="n1-tbl en-f1-t"><table><tbody>' +
      row('Nombre', '<b>' + esc(F.nombre) + '</b>') +
      row('Ciudad', esc(F.ciudad), todo(F.ciudad) ? 'is-todo' : '') +
      row('Ubicación', esc(F.ubicacion), todo(F.ubicacion) ? 'is-todo' : '') +
      row('Tipo de inmueble', esc(F.tipo) + '<small>' + esc(F.encargo) + '</small>') +
      row('Área total', '<b>42,00 m²</b> · 6,00 m de frente × 7,00 m de fondo') +
      row('Fachada', esc(F.fachada)) +
      row('Fuente del plano', esc(F.fuentePlano)) +
      row('Fecha de consulta', esc(F.consulta)) +
      row('Enlace', '<a href="' + esc(F.enlace) + '">' + esc(F.enlace) + '</a><small>Modelo 3D interactivo con la planta, los muebles, sus planos y sus costos.</small>') +
      row('Repositorio', '<a href="' + esc(F.repositorio) + '">' + esc(F.repositorio) + '</a>') +
      '</tbody></table></div>' +
      '<figure class="en-f1-plan">' + archSVG() + '<figcaption>Planta del local con sus cotas, en metros (sin mobiliario).</figcaption></figure></div>' +
      '<div class="en-f1-cols"><div><h3>Áreas</h3><div class="n1-tbl"><table><thead><tr><th>Zona</th><th>Medidas</th><th class="r">Área</th></tr></thead><tbody>' +
      areas.map((a) => '<tr><td><b>' + a[0] + '</b></td><td class="mono">' + a[1] + '</td><td class="r mono">' + a[2].toFixed(2).replace('.', ',') + ' m²</td></tr>').join('') +
      '<tr class="n1-tot"><td colspan="2"><b>Total del local</b></td><td class="r mono"><b>42,00 m²</b></td></tr></tbody></table></div></div>' +
      '<div><h3>Espacios del local</h3><div class="n1-tbl"><table><thead><tr><th>Espacio</th><th>Muebles que se diseñan</th></tr></thead><tbody>' +
      F.espacios.map((e) => '<tr><td><b>' + esc(e.t) + '</b><small>' + esc(e.d) + '</small></td><td class="mono">' + e.n.join(', ') + '</td></tr>').join('') + '</tbody></table></div></div></div>' +
      '<p class="n1-note">Medidas tomadas de la imagen del proyecto, escalada con el frente de 6,00 m declarado en el documento; se verifican en sitio. Los datos marcados en ámbar están por confirmar.</p>' +
      '</section>';
  }
  EN.fichaDoc = function () {
    return { num: 0, id: 'ficha', file: 'ficha-del-proyecto', t: 'Ficha del proyecto', label: 'Ficha del proyecto', sub: '', fecha: FECHA_V, sec2: 'BlackForge 3D', single: true };
  };
  /* ================================================================ armado */
  EN.html = function (num, opt) {
    if (num === 'F') { const doc = EN.fichaDoc(); return { doc, html: docF(doc) }; }
    if (typeof num === 'string' && num[0] === 'P') { const doc = EN.provDoc(num.slice(1)); return { doc, html: docP(doc) }; }
    if (typeof num === 'string' && num[0] === 'R') { const doc = EN.reqDoc(num.slice(1)); return { doc, html: docR(doc) }; }
    if (typeof num === 'string') { const doc = EN.verDoc(num); return { doc, html: docV(doc) }; }
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
    document.title = 'BlackForge 3D · ' + (doc.label || 'Documento ' + doc.num) + ' · ' + doc.t;
    return { doc, pages: $$('.en-a3', root).length, ids: $$('[id]', root).map((e) => e.id) };
  };
  EN.setPages = function (map) {
    $$('[data-pg]').forEach((el) => { const p = map[el.dataset.pg]; el.textContent = p ? p : ''; });
    $$('.en-a3 > svg').forEach((sv) => { const id = sv.parentNode.id; if (map['__sheet' + sv.dataset.sheet]) EN.pageLabel(sv, map['__sheet' + sv.dataset.sheet]); void id; });
  };
  EN.unmount = function () { const r = $('#entrega'); if (r) r.remove(); document.body.classList.remove('en-pdf'); document.documentElement.classList.remove('en-pdf'); };
})();
