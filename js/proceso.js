/* ============================================================================
   PROCESO (Nota 2, ítems 7, 8, 9 y 11) — de cada mueble de la versión B salen
   sus componentes, la secuencia de operaciones de cada uno y el ensamble.

   Todo se deduce del despiece (versions.js): cuántas piezas se cortan, cuántos
   metros se ranuran, cuántos m² se lacan, cuántos herrajes se ponen. Los tiempos
   salen de una tabla de datos tipo (Kanawaty, cap. 27): minutos por unidad de cada
   elemento, cada uno con su fuente (nota2-data.js, TIEMPOS).

   Estaciones de la planta:
     ALM almacén de materia prima   SIE sierra (corte)            FRE fresado (router)
     CUR curvado y encolado         ROV tapas de Rovere y canto   LIJ lijado
     LAC cabina de lacado           SEC secado                    ELE banco eléctrico
     ARM armado y premontaje        INS inspección                EMP empaque
     APT almacén de producto terminado
   Símbolos ASME: O operación · I inspección · T transporte · D demora · A almacenamiento
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D;
  const PR = (L.proceso = {});
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ESTACION = {
    ALM: 'Almacén de materia prima', SIE: 'Sierra de corte', FRE: 'Fresado', CUR: 'Curvado y encolado', ROV: 'Tapas de Rovere', LIJ: 'Lijado',
    LAC: 'Cabina de lacado', SEC: 'Secado', ELE: 'Banco eléctrico', ARM: 'Armado y premontaje', INS: 'Inspección', EMP: 'Empaque', APT: 'Almacén de producto terminado'
  };
  PR.estacion = ESTACION;

  /* cantidades de un mueble a partir de su despiece */
  function cantidades(v, n) {
    const it = L.versions.items[v][n], P = L.versions.precios;
    const q = { piezas15: 0, piezas55: 0, pieles: 0, pielesM2: 0, rov: 0, rovM2: 0, canto: 0, plast: 0, doblar: 0, led: 0, ledM: 0, laca: 0, sell: 0, negro: 0, ranuraM: 0, tornillos: 0, bisagras: 0, rieles: 0, patas: 0, chazos: 0, soportes: 0, fuentes: 0, pasacables: 0, golas: 0, vidrio: 0, tubo: 0, cortes: 0, tableros: 0, encolados: 0 };
    const fab = it.fab.join(' ').toLowerCase();
    const ranura = /ranur|fresar|muesca|canal|rebajar/.test(fab);
    it.piezas.forEach((p) => {
      const pr = P[p[0]], nm = p[1].toLowerCase();
      if (p[0] === 'mdf15') {
        q.piezas15 += p[2];
        if (ranura && /costad|divis|dintel|list|zócal|jamba|entrepa|repisa/.test(nm)) q.ranuraM += p[2] * p[3];
      } else if (p[0] === 'mdf55') {
        if (/piel/.test(nm)) { q.pieles += p[2]; q.pielesM2 += p[2] * p[3] * p[4]; } else q.piezas55 += p[2];
      } else if (p[0] === 'rovere15') { q.rov += p[2]; q.rovM2 += p[2] * p[3] * p[4]; }
      else if (p[0] === 'cantoRovere' || p[0] === 'canto') q.canto += p[3];
      else if (p[0] === 'acril3' || p[0] === 'opal3') { q.plast += p[2]; if (/pestaña|repisas/.test(nm) || /doblada/.test(fab)) q.doblar += /repisas/.test(nm) ? p[2] : 0; }
      else if (p[0] === 'cob' || p[0] === 'perfilLed') { q.led += p[2]; q.ledM += p[2] * p[3]; }
      else if (p[0] === 'vidrio10' || p[0] === 'vidrio6') q.vidrio += p[2];
      else if (/^tubo/.test(p[0])) q.tubo += p[2];
      else if (p[0] === 'perfilManija') q.golas += p[2];
      if (pr.tipo === 'lamina' && /dos capas/.test(nm)) q.encolados += p[2] / 2;
    });
    it.acabados.forEach((a) => { if (a[0] === 'laca') q.laca += a[2]; if (a[0] === 'anticorr') q.negro += a[2]; });
    // piezas que solo se sellan (cajas de cajón): se cuentan aparte
    if (/sellad/.test(fab)) q.sell = it.piezas.filter((p) => /cajas/.test(p[1])).reduce((s, p) => s + p[2] * p[3] * p[4] * 2, 0);
    it.herrajes.forEach((h) => {
      const id = h[0], c = h[2];
      if (id === 'bisagraCaz') q.bisagras += c * 2; else if (id === 'riel45') q.rieles += c; else if (id === 'pataNiv' || id === 'nivelador') q.patas += c;
      else if (id === 'chazo') q.chazos += c * 4; else if (id === 'soporteInv') q.soportes += c; else if (/^fuente/.test(id)) q.fuentes += c; else if (id === 'pasacable') q.pasacables += c;
    });
    // cortes de sierra: cada pieza de tablero sale con unos dos cortes, más el despiece de cada tablero en tiras
    const cortePiezas = L.corte.piezas(v, (k) => k === n);
    q.cortes = cortePiezas.length * 2;
    q.tableros = cortePiezas.length;                       // piezas de tablero (para manipulación)
    q.tornillos = Math.round((q.piezas15 + q.piezas55) * 2);
    return q;
  }
  PR.cantidades = cantidades;

  /* componentes y operaciones de un mueble. Cada operación: { s: símbolo, e: estación, t: texto, u: unidad, q: cantidad, k: clave del dato tipo } */
  PR.de = function (v, n) {
    const it = L.versions.items[v][n], q = cantidades(v, n), comps = [], main = [];
    const O = (e, t, k, qty, u) => ({ s: 'O', e, t, k, q: qty, u });
    const I = (e, t, k, qty, u) => ({ s: 'I', e, t, k, q: qty, u });
    const D = (e, t, k, qty, u) => ({ s: 'D', e, t, k, q: qty, u });
    const lac = [];
    if (q.laca) {
      lac.push(O('LIJ', 'Lijar caras y cantos (grano 180)', 'lijar', q.laca, 'm²'), O('LAC', 'Aplicar sellador catalizado', 'sellar', q.laca, 'm²'), D('SEC', 'Secar el sellador', 'secSell', 1, 'tanda'),
        O('LIJ', 'Lijar el sellador (grano 320)', 'lijarFino', q.laca, 'm²'), O('LAC', 'Primera mano de laca catalizada', 'lacar', q.laca, 'm²'), D('SEC', 'Secar entre manos', 'secLaca', 1, 'tanda'),
        O('LAC', 'Segunda mano de laca catalizada', 'lacar', q.laca, 'm²'), D('SEC', 'Curado antes de manipular', 'curado', 1, 'tanda'), I('INS', 'Inspeccionar el acabado (brillo, chorreados, polvo)', 'inspAcab', q.laca, 'm²'));
    }
    if (q.piezas15) {
      const ops = [O('SIE', 'Despiezar los tableros y cortar a medida', 'cortar', q.cortes, 'cortes'), I('SIE', 'Verificar medida y escuadra de la primera pieza de cada medida', 'inspCorte', Math.max(1, Math.round(q.piezas15 / 4)), 'medidas')];
      if (q.ranuraM) ops.push(O('FRE', 'Ranurar y fresar (ranuras, canal de luz, tiradores)', 'fresar', q.ranuraM, 'm'));
      if (q.sell) ops.push(O('LAC', 'Sellar las cajas de cajón (quedan sin laca)', 'sellar', q.sell, 'm²'));
      if (q.negro) ops.push(O('LAC', 'Pintar de negro los zócalos', 'pintar', q.negro, 'm²'));
      comps.push({ lac: true, t: 'Piezas de MDF 15 mm', m: 'MDF 15 mm, ' + q.piezas15 + ' piezas', ops });
    }
    if (q.piezas55) comps.push({ lac: true, t: 'Fondos de MDF 5.5 mm', m: 'MDF 5.5 mm, ' + q.piezas55 + ' piezas', ops: [O('SIE', 'Cortar los fondos a medida', 'cortar', q.piezas55 * 2, 'cortes')] });
    if (q.pieles) comps.push({ lac: true, t: 'Pieles curvas', m: 'MDF 5.5 mm, ' + q.pieles + ' pieles', ops: [O('SIE', 'Cortar las pieles en tramos', 'cortar', q.pieles * 6, 'cortes'), O('CUR', 'Encolar y curvar dos capas sobre las costillas', 'curvar', q.pielesM2, 'm²'), D('CUR', 'Fraguado del pegante con prensas', 'fraguado', 1, 'tanda'), O('LIJ', 'Masillar y lijar las juntas', 'masillar', q.pielesM2, 'm²')] });
    if (q.rov) comps.push({ t: 'Tapas de Rovere', m: 'Melamina Rovere RH 15 mm, ' + q.rov + ' piezas', ops: [O('SIE', 'Cortar las tapas a medida (con veta)', 'cortar', q.rov * 2, 'cortes'), O('ROV', 'Encolar las dos capas', 'encolar', q.encolados || q.rov / 2, 'tapas'), D('ROV', 'Prensado', 'prensado', 1, 'tanda'), O('ROV', 'Pegar y refilar el canto Rovere', 'canto', q.canto, 'm'), I('ROV', 'Revisar canto y caras', 'inspCanto', q.canto, 'm')] });
    if (q.plast) comps.push({ t: 'Acrílico y opal', m: 'Acrílico 3 mm, ' + q.plast + ' piezas', ops: [O('SIE', 'Cortar el acrílico con disco de dientes finos', 'cortarAcril', q.plast * 2, 'cortes')].concat(q.doblar ? [O('ARM', 'Termodoblar la pestaña de las repisas', 'doblar', q.doblar, 'piezas')] : []) });
    if (q.led) comps.push({ t: 'Iluminación', m: 'Tira COB o perfil LED, ' + q.ledM.toFixed(1) + ' m', ops: [O('ELE', 'Cortar los tramos de LED en sus marcas', 'cortarLed', q.led, 'tramos'), O('ELE', 'Soldar y aislar los cables de cada tramo', 'soldar', q.led, 'tramos'), I('ELE', 'Probar cada tramo con la fuente', 'probarLed', q.led, 'tramos')] });
    if (q.vidrio) comps.push({ t: 'Vidrio templado', m: 'Comprado a la vidriería', ops: [I('INS', 'Recibir y revisar el vidrio (medida, marca de templado, bordes)', 'inspVidrio', q.vidrio, 'piezas')] });
    if (q.tubo) comps.push({ t: 'Reposapiés de tubo', m: 'Comprado al ornamentador', ops: [I('INS', 'Recibir y revisar el reposapiés (soldadura, pintura)', 'inspVidrio', 1, 'piezas')] });
    // línea principal: el lacado reúne las piezas vistas; luego el premontaje
    main.push(...lac);
    main.push(O('ARM', 'Premontaje del mueble: encolar y atornillar el cuerpo', 'armar', q.tornillos, 'tornillos'));
    const her = q.bisagras + q.rieles * 2 + q.patas + q.soportes + q.pasacables + q.golas;
    if (her) main.push(O('ARM', 'Instalar herrajes (bisagras, rieles, patas, golas)', 'herraje', her, 'herrajes'));
    if (q.led) main.push(O('ELE', 'Pegar la luz en su canal y conectar la fuente', 'conectar', q.led + q.fuentes, 'puntos'));
    main.push(I('INS', 'Inspección final del mueble con la hoja de verificación', 'inspFinal', 1, 'mueble'));
    main.push(O('EMP', 'Desarmar por módulos, proteger y empacar', 'empacar', Math.max(1, Math.round((q.piezas15 + q.pieles + q.rov) / 6)), 'bultos'));
    return { n, name: it.name, short: it.short, comps, main, q };
  };

  /* tiempo de una operación con la tabla de datos tipo */
  PR.tiempo = function (op, T) {
    const d = T[op.k]; if (!d) return 0;
    return (d.fijo || 0) + d.min * op.q;
  };

  /* ------------------------------------------------ diagrama de operaciones (ASME) en SVG */
  PR.svgOperaciones = function (p, T) {
    const colW = 300, r = 9, gap = 34;
    const num = { O: 0, I: 0, D: 0 };
    const label = (op) => (op.s === 'O' ? 'O-' : op.s === 'I' ? 'I-' : 'D-') + (++num[op.s]);
    const izq = p.comps.filter((c) => c.lac), der = p.comps.filter((c) => !c.lac);
    const xMain = 40 + izq.length * colW + (izq.length ? 0 : 10);
    let s = '';
    const y0 = 46;
    const sym = (x, y, op, lab) => {
      const tm = T ? PR.tiempo(op, T) : 0;
      let g = '';
      if (op.s === 'O') g += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" class="op"/>';
      else if (op.s === 'I') g += '<rect x="' + (x - r) + '" y="' + (y - r) + '" width="' + 2 * r + '" height="' + 2 * r + '" class="op"/>';
      else g += '<path class="op" d="M' + (x - r) + ' ' + (y - r) + 'h' + r + 'a' + r + ' ' + r + ' 0 0 1 0 ' + 2 * r + 'h' + (-r) + 'z"/>';
      g += '<text class="lb" x="' + x + '" y="' + (y + 3.5) + '">' + lab.split('-')[1] + '</text>';
      g += '<text class="ds" x="' + (x + r + 6) + '" y="' + (y - 2) + '">' + esc(lab + ' · ' + op.t) + '</text>';
      g += '<text class="dm" x="' + (x + r + 6) + '" y="' + (y + 9) + '">' + esc(PR.estacion[op.e] + ' · ' + (op.q % 1 ? op.q.toFixed(1) : op.q) + ' ' + op.u + (tm ? ' · ' + (tm < 10 ? tm.toFixed(1) : Math.round(tm)) + ' min' : '')) + '</text>';
      return g;
    };
    const column = (c, x) => {
      let y = y0, g = '';
      g += '<line class="in" x1="' + (x - 22) + '" y1="' + (y - 18) + '" x2="' + (x + 90) + '" y2="' + (y - 18) + '"/><text class="cm" x="' + (x - 22) + '" y="' + (y - 22) + '">' + esc(c.t) + '</text><text class="dm" x="' + (x - 22) + '" y="' + (y - 8) + '">' + esc(c.m) + '</text>';
      g += '<line class="ln" x1="' + x + '" y1="' + (y - 18) + '" x2="' + x + '" y2="' + y + '"/>';
      y += 6;
      c.ops.forEach((op, i) => { y += gap; g += '<line class="ln" x1="' + x + '" y1="' + (y - gap + (i ? r : 0)) + '" x2="' + x + '" y2="' + (y - r) + '"/>' + sym(x, y, op, label(op)); });
      return { g, y };
    };
    // 1. componentes que se lacan, a la izquierda; se unen y pasan por el lacado
    const jl = izq.map((c, i) => { const x = 40 + i * colW, cc = column(c, x); s += cc.g; return { x, y: cc.y }; });
    // 2. componentes que no se lacan, a la derecha de la línea principal
    const jr = der.map((c, i) => { const x = xMain + 300 + i * colW, cc = column(c, x); s += cc.g; return { x, y: cc.y }; });
    let y = Math.max.apply(null, jl.map((j) => j.y).concat([y0])) + 30;
    jl.forEach((j) => { s += '<path class="ln" d="M' + j.x + ' ' + (j.y + r) + 'V' + y + 'H' + xMain + '"/>'; });
    const lacOps = p.main.filter((op) => ['LIJ', 'LAC', 'SEC'].indexOf(op.e) >= 0 || op.k === 'inspAcab');
    const resto = p.main.filter((op) => lacOps.indexOf(op) < 0);
    lacOps.forEach((op, i) => { y += gap; s += '<line class="ln" x1="' + xMain + '" y1="' + (y - gap + (i ? r : 0)) + '" x2="' + xMain + '" y2="' + (y - r) + '"/>' + sym(xMain, y, op, label(op)); });
    // unión de lo que no se laca, justo antes del premontaje
    y += Math.max(30, Math.max.apply(null, jr.map((j) => j.y).concat([0])) - y + 30);
    if (!izq.length) y = Math.max(y, y0 + 30);
    jr.forEach((j) => { s += '<path class="ln" d="M' + j.x + ' ' + (j.y + r) + 'V' + y + 'H' + xMain + '"/>'; });
    s += '<line class="ln" x1="' + xMain + '" y1="' + (izq.length ? y - 30 : y0) + '" x2="' + xMain + '" y2="' + y + '"/>';
    resto.forEach((op, i) => { y += gap; s += '<line class="ln" x1="' + xMain + '" y1="' + (y - gap + (i ? r : 0)) + '" x2="' + xMain + '" y2="' + (y - r) + '"/>' + sym(xMain, y, op, label(op)); });
    y += gap; s += '<line class="ln" x1="' + xMain + '" y1="' + (y - gap + r) + '" x2="' + xMain + '" y2="' + (y - r) + '"/><path class="op" d="M' + (xMain - r) + ' ' + (y - r) + 'h' + 2 * r + 'l' + (-r) + ' ' + 2 * r + 'z"/><text class="ds" x="' + (xMain + r + 6) + '" y="' + (y + 3) + '">Almacén de producto terminado</text>';
    const maxY = y + 24, W = Math.max(xMain + 330, xMain + 300 + der.length * colW + 40);
    const css = '.pd text{font-family:Inter,Arial,sans-serif;fill:#111}.pd .op{fill:#fff;stroke:#111;stroke-width:1.4}.pd .ln{fill:none;stroke:#111;stroke-width:1.2}.pd .in{stroke:#111;stroke-width:1.2}.pd .lb{font-size:9px;font-weight:700;text-anchor:middle}.pd .ds{font-size:10px}.pd .dm{font-size:8.5px;fill:#666}.pd .cm{font-size:10.5px;font-weight:600}';
    return { svg: '<svg xmlns="http://www.w3.org/2000/svg" class="pd" viewBox="0 0 ' + W + ' ' + maxY + '" width="' + W + '" role="img" aria-label="Diagrama de operaciones del mueble ' + p.n + '"><style>' + css + '</style>' + s + '</svg>', num };
  };
})();
