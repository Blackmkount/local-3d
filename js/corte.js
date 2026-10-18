/* ============================================================================
   PLANES DE CORTE (Nota 2, ítem 7) — cómo salen las piezas de cada tablero.

   Empaquetado en guillotina (cada corte atraviesa el retazo de lado a lado, como
   lo hace una sierra de mesa o una escuadradora): las piezas se ordenan de mayor
   a menor área y cada una va al retazo libre donde sobra menos (mejor ajuste por
   área); el retazo se parte por su eje más corto. Se descuenta el refilado del
   borde del tablero y el ancho del disco (kerf).
   Los tableros con veta (Rovere) no se giran: la veta va a lo largo de 2.44 m.
   Las piezas más largas que el tablero se dividen en tramos iguales (juntas).
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D;
  const C = (L.corte = {});
  const KERF = 0.004, TRIM = 0.010;
  C.KERF = KERF; C.TRIM = TRIM;
  const GRANO = { rovere15: true, blanca15: false };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* medidas del tablero (m) desde su presentación «Lámina 1.83 × 2.44 m» */
  function board(P) { const m = /([\d.]+) × ([\d.]+)/.exec(P.pres); const a = +m[1], b = +m[2]; return { w: Math.max(a, b), h: Math.min(a, b) }; }
  C.board = board;

  /* piezas de corte de una versión: cada fila del despiece en sus unidades reales */
  C.piezas = function (v, filtro) {
    const V = L.versions, P = V.precios, out = [];
    Object.keys(V.items[v]).forEach((n) => {
      if (filtro && !filtro(+n)) return;
      V.items[v][n].piezas.forEach((p, i) => {
        const pr = P[p[0]]; if (pr.tipo !== 'lamina') return;
        const bd = board(pr);
        let a = Math.max(p[3], p[4]), b = Math.min(p[3], p[4]), cnt = p[2], nota = '';
        let k = 1;
        if (/costados de las cajas/.test(p[1]) && a > 1) { k = 4; nota = 'Perímetro de la caja en 4 lados'; }
        else if (a > bd.w - 2 * TRIM) { k = Math.ceil(a / (bd.w - 2 * TRIM - KERF)); nota = 'Pieza larga dividida en ' + k + ' tramos con junta'; }
        a = a / k;
        for (let c = 0; c < cnt * k; c++) out.push({ n: +n, mk: p[0], name: p[1], a, b, row: i, nota });
      });
    });
    return out;
  };

  /* empaquetado en guillotina de una lista de piezas en tableros iguales */
  /* se prueban varios órdenes de entrada y se queda el que usa menos tableros (y deja el último más vacío, para retazos) */
  const ORDENES = [(p, q) => q.a * q.b - p.a * p.b || q.a - p.a, (p, q) => q.a - p.a || q.b - p.b, (p, q) => q.b - p.b || q.a - p.a, (p, q) => (q.a + q.b) - (p.a + p.b)];
  function pack(pieces, bd, rot) {
    let best = null;
    ORDENES.forEach((o) => ['area', 'ajuste'].forEach((reg) => {
      const r = pack1(pieces, bd, rot, o, reg);
      const last = r[r.length - 1].area;
      if (!best || r.length < best.length || (r.length === best.length && last < best[best.length - 1].area)) best = r;
    }));
    return best;
  }
  function pack1(pieces, bd, rot, orden, regla) {
    const W = bd.w - 2 * TRIM, H = bd.h - 2 * TRIM;
    const boards = [];
    const sorted = pieces.slice().sort(orden);
    const fits = (fr, w, h) => w <= fr.w + 1e-9 && h <= fr.h + 1e-9;
    sorted.forEach((pc) => {
      const pw = pc.a + KERF, ph = pc.b + KERF;
      let best = null;
      boards.forEach((B, bi) => B.free.forEach((fr, fi) => {
        [[pw, ph, false], rot ? [ph, pw, true] : null].forEach((o) => {
          if (!o || !fits(fr, o[0], o[1])) return;
          const waste = regla === 'area' ? fr.w * fr.h - o[0] * o[1] : Math.min(fr.w - o[0], fr.h - o[1]);
          if (!best || waste < best.waste) best = { bi, fi, w: o[0], h: o[1], r: o[2], waste };
        });
      }));
      if (!best) {
        boards.push({ free: [{ x: 0, y: 0, w: W, h: H }], parts: [] });
        const B = boards[boards.length - 1], fr = B.free[0];
        const o = fits(fr, pw, ph) ? [pw, ph, false] : rot && fits(fr, ph, pw) ? [ph, pw, true] : null;
        if (!o) { B.parts.push(Object.assign({ x: 0, y: 0, w: pc.a, h: pc.b, r: false, over: true }, pc)); return; }
        best = { bi: boards.length - 1, fi: 0, w: o[0], h: o[1], r: o[2] };
      }
      const B = boards[best.bi], fr = B.free[best.fi];
      B.parts.push(Object.assign({}, pc, { x: fr.x, y: fr.y, w: best.w - KERF, h: best.h - KERF, r: best.r }));
      // partir el retazo: por el eje más corto del sobrante (regla SAS)
      const rw = fr.w - best.w, rh = fr.h - best.h;
      B.free.splice(best.fi, 1);
      let A, Bb;
      if (rw < rh) { A = { x: fr.x + best.w, y: fr.y, w: rw, h: best.h }; Bb = { x: fr.x, y: fr.y + best.h, w: fr.w, h: rh }; }
      else { A = { x: fr.x + best.w, y: fr.y, w: rw, h: fr.h }; Bb = { x: fr.x, y: fr.y + best.h, w: best.w, h: rh }; }
      [A, Bb].forEach((r) => { if (r.w > 0.02 && r.h > 0.02) B.free.push(r); });
    });
    return boards.map((B) => ({ parts: B.parts, area: B.parts.reduce((s, p) => s + p.a * p.b, 0) }));
  }

  /* plan de corte de un juego: por material, tableros con sus piezas y aprovechamiento */
  const cache = {};
  C.plan = function (v, fresh) {
    if (cache[v] && !fresh) return cache[v];
    const P = L.versions.precios, by = {};
    C.piezas(v).forEach((p) => { (by[p.mk] = by[p.mk] || []).push(p); });
    const out = Object.keys(by).map((mk) => {
      const bd = board(P[mk]), boards = pack(by[mk], bd, !GRANO[mk]);
      const piezasA = by[mk].reduce((s, p) => s + p.a * p.b, 0), tabA = boards.length * bd.w * bd.h;
      return { mk, P: P[mk], bd, boards, n: by[mk].length, piezasA, tabA, aprov: piezasA / tabA, veta: !!GRANO[mk] };
    }).sort((a, b) => b.tabA - a.tabA);
    return (cache[v] = out);
  };

  /* dibujo de un tablero con sus piezas (SVG en mm, escala libre) */
  const COL = ['#f3efe6', '#e8eef7', '#eef5ea', '#f7ebe8', '#efe9f6', '#f6f2df', '#e6f2f2', '#f2e8ef', '#eaeaea', '#f0f4e4', '#f9efe2', '#e9eef0'];
  C.svg = function (pl, bi, opt) {
    opt = opt || {};
    const B = pl.boards[bi], W = pl.bd.w * 1000, H = pl.bd.h * 1000, t = TRIM * 1000;
    const pad = 40;
    let s = '<svg xmlns="http://www.w3.org/2000/svg" class="cut" viewBox="' + (-pad) + ' ' + (-pad) + ' ' + (W + 2 * pad) + ' ' + (H + 2 * pad) + '" role="img" aria-label="Tablero ' + (bi + 1) + ' de ' + esc(pl.P.m) + '">';
    s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fff" stroke="#111" stroke-width="3"/>';
    s += '<rect x="' + t + '" y="' + t + '" width="' + (W - 2 * t) + '" height="' + (H - 2 * t) + '" fill="url(#cutWaste)" stroke="none"/>';
    s += '<defs><pattern id="cutWaste" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="24" stroke="#cfcfcf" stroke-width="3"/></pattern></defs>';
    B.parts.forEach((p) => {
      const x = t + p.x * 1000, y = t + p.y * 1000, w = p.w * 1000, h = p.h * 1000;
      s += '<g><rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + COL[p.n % COL.length] + '" stroke="#111" stroke-width="2.4"/>';
      const fs = Math.max(26, Math.min(70, Math.min(w, h) / 3.2));
      const lab = p.n + ' · ' + Math.round((p.r ? p.b : p.a) * 1000) + ' × ' + Math.round((p.r ? p.a : p.b) * 1000);
      if (w > fs * 4 && h > fs * 1.3) s += '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (y + h / 2 + fs * 0.35).toFixed(1) + '" font-size="' + fs.toFixed(0) + '" text-anchor="middle" font-family="Inter,Arial,sans-serif" fill="#111">' + lab + '</text>';
      else if (h > fs * 4 && w > fs * 1.3) s += '<text transform="translate(' + (x + w / 2 + fs * 0.35).toFixed(1) + ' ' + (y + h / 2).toFixed(1) + ') rotate(-90)" font-size="' + fs.toFixed(0) + '" text-anchor="middle" font-family="Inter,Arial,sans-serif" fill="#111">' + lab + '</text>';
      s += '<title>' + esc('Mueble ' + p.n + ' · ' + p.name + ' · ' + Math.round(p.a * 1000) + ' × ' + Math.round(p.b * 1000) + ' mm' + (p.nota ? ' · ' + p.nota : '')) + '</title></g>';
    });
    if (pl.veta) s += '<path d="M' + (W - 300) + ' ' + (-18) + 'h260" stroke="#111" stroke-width="3" marker-end="url(#cutArr)"/><defs><marker id="cutArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs><text x="' + (W - 310) + '" y="-8" font-size="30" text-anchor="end" font-family="Inter,Arial,sans-serif">veta</text>';
    return s + '</svg>';
  };
})();
