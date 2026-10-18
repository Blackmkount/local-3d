/* ============================================================================
   MOBILIARIO DE LAS VERSIONES A Y B — cada una con su propia distribución del
   local (versions.js, LAYOUT) y sus doce muebles fabricados, modelados pieza
   por pieza. Cada pieza guarda su material (mk = clave del precio en
   versions.js), su paso de armado (step, en el orden de seq) y hacia dónde se
   separa al explosionar (ex).

   A · Taller a la vista: acero negro, Rovere y lámina perforada. Las
       impresoras van en vitrina contra la fachada, imprimiendo hacia el pasillo.
   B · Galería: MDF lacado blanco, roble y luz. Recorrido en U con nichos en los
       muros y una isla escultórica en el centro; el taller queda en un nicho.

   Mismo sistema local que el resto: x = largo, y = alto, z = fondo (0 contra
   el muro, crece hacia el frente del mueble).
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D, T = THREE, G = L.geo, F = L.furn, AL = L.alt, K = AL.kit;
  const PI = Math.PI, t1 = 0.0254, t15 = 0.0381, NEGRO = 0x1b1b1d;
  let h = null, X = null;

  /* ------------------------------------------------------- materiales */
  function prepare() {
    h = K.h();
    if (X) return;
    const b = L.mats;
    X = { perf: b.perforada.clone(), opal: K.mats().opal };
    X.perf.name = 'perforadaNegra'; X.perf.color.set(0x5a5a5f);
  }
  AL.prepare = prepare;

  /* --------------------------------------------------------- piezas */
  const st = (o, name, mk, x, y, z, sx, sy, sz, step, ex, opt) => h.P(o, name, 'acero', x, y, z, sx, sy, sz, step, ex, Object.assign({ mk }, opt));
  const rv = (o, name, x, y, z, sx, sy, sz, step, ex, opt) => h.P(o, name, 'melRovere', x, y, z, sx, sy, sz, step, ex, Object.assign({ mk: 'rovere15' }, opt));
  const bl = (o, name, x, y, z, sx, sy, sz, step, ex, opt) => h.P(o, name, 'melBlanca', x, y, z, sx, sy, sz, step, ex, Object.assign({ mk: 'blanca15' }, opt));
  const fo = (o, name, x, y, z, sx, sy, sz, step, ex, opt) => h.P(o, name, 'fondo', x, y, z, sx, sy, sz, step, ex, Object.assign({ mk: 'fondo6' }, opt));
  const lq = (o, name, x, y, z, sx, sy, sz, step, ex, opt) => h.P(o, name, 'laca', x, y, z, sx, sy, sz, step, ex, Object.assign({ mk: 'mdf15' }, opt));
  const led = (o, name, mk, x, y, z, sx, sy, sz, step, ex) => h.P(o, name, 'led', x, y, z, sx, sy, sz, step, ex, { mk, noShadow: true });
  /* uv en metros proyectados sobre cada cara: la perforación queda cada pulgada en cualquier tamaño de lámina */
  function boxUV(g, k) {
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      let u, v;
      if (az >= ax && az >= ay) { u = p.getX(i); v = p.getY(i); } else if (ax >= ay) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getZ(i); }
      uv.setXY(i, u * k, v * k);
    }
    uv.needsUpdate = true;
  }
  function pf(o, name, x, y, z, sx, sy, sz, step, ex, opt) {
    const m = h.P(o, name, X.perf, x, y, z, sx, sy, sz, step, ex, Object.assign({ mk: 'perforada', bev: 0 }, opt));
    m.geometry = m.geometry.clone(); boxUV(m.geometry, 9.82);
    return m;
  }
  /* tapa doble (dos capas de 15 mm pegadas): una pieza por capa para que se vea el engruese al explosionar */
  function tapaDoble(fn, o, name, x, y, z, sx, sz, step, ex, opt) {
    fn(o, name + ' (capa inferior)', x, y, z, sx, 0.015, sz, step, [ex[0], ex[1], ex[2]], opt);
    fn(o, name + ' (capa superior)', x, y + 0.015, z, sx, 0.015, sz, step, [ex[0], ex[1] + 0.16, ex[2]], opt);
  }
  /* bastidor rectangular de tubo: cuatro lados en el plano horizontal a la altura y */
  function aro(o, name, mk, s, x0, z0, w, d, y, step, ex) {
    st(o, name, mk, x0, y, z0, w, s, s, step, [ex[0], ex[1], ex[2] - 0.12]);
    st(o, name, mk, x0, y, z0 + d - s, w, s, s, step, [ex[0], ex[1], ex[2] + 0.12]);
    st(o, name, mk, x0, y, z0 + s, s, s, d - 2 * s, step, [ex[0] - 0.12, ex[1], ex[2]]);
    st(o, name, mk, x0 + w - s, y, z0 + s, s, s, d - 2 * s, step, [ex[0] + 0.12, ex[1], ex[2]]);
  }
  const fig = (dec, defs, y) => K.figs(dec, defs, y);
  /* carretes en fila sobre una repisa, con el eje hacia el frente */
  function carretes(dec, x0, x1, y, z, n, seed) {
    const cs = [0x232326, 0x2f6fd0, 0xf4f2ee, 0xd9412e, 0x232326, 0xf08a24, 0x3f9b57, 0x8a4fd0, 0xf2c230, 0x232326, 0x2aa3a0, 0xe96aa6];
    for (let i = 0; i < n; i++) G.spool(dec, x0 + (i + 0.5) * (x1 - x0) / n, y + 0.1, z, 0.1, 0.07, cs[(i * 5 + seed) % cs.length], 'z');
  }
  /* volumen lacado de planta redondeada: piso, piel curva de MDF 5.5 en dos capas, tapa y zócalo con luz */
  function volumen(o, name, x0, z0, Lx, Fz, r, hgt, step0, ex, opt) {
    opt = opt || {};
    const yb = 0.08;
    const shp = G.planShape(Lx, Fz, r);
    h.P(o, name + ': piso', 'mdf15', x0, yb, z0, 0, 0, 0, step0, [ex[0], ex[1] + 0.1, ex[2]], { geo: G.slab(G.planShape(Lx, Fz, r, 0.012), 0.015), mk: 'mdf15' });
    const ring = G.planShape(Lx, Fz, r); ring.holes.push(holeOf(Lx, Fz, r, 0.011));
    h.P(o, name + ': piel de MDF 5.5 mm', 'laca', x0, yb, z0, 0, 0, 0, step0 + 1, [ex[0] * 1.4, ex[1] + 0.25, ex[2] * 1.4], { geo: G.slab(ring, hgt - yb - 0.018), mk: 'mdf55' });
    h.P(o, name + ': tapa', opt.topMat || 'laca', x0, hgt - 0.018, z0, 0, 0, 0, step0 + 2, [ex[0], ex[1] + 0.55, ex[2]], { geo: G.slab(shp, 0.018, !!opt.topMat), mk: opt.topMk || 'mdf15' });
    // zócalo retranqueado negro con la tira de luz
    const zr = G.planShape(Lx, Fz, r, 0.05); zr.holes.push(holeOf(Lx, Fz, r, 0.065));
    h.P(o, name + ': zócalo', 'negro', x0, 0, z0, 0, 0, 0, step0, [ex[0], ex[1] - 0.15, ex[2]], { geo: G.slab(zr, yb), mk: 'mdf15' });
    return shp;
  }
  /* agujero (Path) con la misma planta, metida hacia adentro */
  function holeOf(Lx, Fz, r, inset) {
    const s = G.planShape(Lx, Fz, r, inset), pts = s.getPoints(10);
    return new T.Path(pts.slice().reverse());
  }
  /* cilindro lacado: piso, piel curva, tapa y zócalo */
  function cilindro(o, name, cx, cz, rad, hgt, ex) {
    const yb = 0.07;
    const disc = (r) => { const s = new T.Shape(); s.absarc(cx, -cz, r, 0, PI * 2, false); return s; };
    const ringS = (r, t) => { const s = disc(r); const p = new T.Path(); p.absarc(cx, -cz, r - t, 0, PI * 2, true); s.holes.push(p); return s; };
    h.P(o, name + ': piso', 'mdf15', 0, yb, 0, 0, 0, 0, 0, [ex[0], ex[1] + 0.08, ex[2]], { geo: G.slab(disc(rad - 0.012), 0.015), mk: 'mdf15' });
    h.P(o, name + ': piel de MDF 5.5 mm', 'laca', 0, yb, 0, 0, 0, 0, 1, [ex[0] * 1.5, ex[1] + 0.2, ex[2] * 1.5], { geo: G.slab(ringS(rad, 0.011), hgt - yb - 0.018), mk: 'mdf55' });
    h.P(o, name + ': tapa', 'laca', 0, hgt - 0.018, 0, 0, 0, 0, 2, [ex[0], ex[1] + 0.5, ex[2]], { geo: G.slab(disc(rad), 0.018), mk: 'mdf15' });
    h.P(o, name + ': zócalo', 'negro', 0, 0, 0, 0, 0, 0, 0, [ex[0], ex[1] - 0.12, ex[2]], { geo: G.slab(ringS(rad - 0.04, 0.015), yb), mk: 'mdf15' });
    const l = []; l.push({ g: new T.TorusGeometry(rad - 0.035, 0.004, 4, 40), m: G.mat(cx, yb - 0.006, cz, PI / 2, 0, 0), c: 0xffffff });
    h.PM(o, name + ': tira COB', 'led', l, 3, [ex[0], ex[1] - 0.2, ex[2]], { mk: 'cob', noShadow: true });
  }

  /* ================================================== VERSIÓN A · TALLER A LA VISTA */
  const A = {};

  // 2 · Estantería de producto: cremalleras de acero, fondo de lámina perforada y entrepaños de Rovere sobre ménsulas
  A[2] = function (tgt) {
    G.reseed(2402);
    const o = h.inst(2, 6, 0, 4.35, -PI / 2), dec = [], Ls = [0.98, 1.34, 1.70, 2.06];
    const posts = [0, 1.2 - 0.025, 2.4 - 0.05];
    for (let m = 0; m < 2; m++) {
      const x0 = m * 1.2, dx = (m ? 1 : -1) * 0.18;
      pf(o, 'Lámina perforada negra', x0 + 0.03, 0.64, 0, 1.14, 1.74, 0.0015, 0, [dx, 0, -0.25]);
      // gabinete bajo de Rovere
      rv(o, 'Lateral del gabinete', x0, 0.08, 0, 0.015, 0.52, 0.38, 1, [dx - 0.22, 0, 0.45]);
      rv(o, 'Lateral del gabinete', x0 + 1.185, 0.08, 0, 0.015, 0.52, 0.38, 1, [dx + 0.22, 0, 0.45]);
      rv(o, 'Piso del gabinete', x0 + 0.015, 0.08, 0.006, 1.17, 0.015, 0.374, 1, [dx, -0.05, 0.45]);
      rv(o, 'Tapa del gabinete', x0, 0.6, 0, 1.2, 0.015, 0.4, 1, [dx, 0.2, 0.45]);
      fo(o, 'Fondo 6 mm', x0 + 0.015, 0.095, 0, 1.17, 0.505, 0.006, 1, [dx, 0, -0.1]);
      h.patas(o, [[x0 + 0.08, 0.06], [x0 + 1.12, 0.06], [x0 + 0.08, 0.33], [x0 + 1.12, 0.33]], 0.08, 1, [dx, -0.1, 0.45], { mk: 'pataNiv' });
      for (let i = 0; i < 2; i++) {
        const px = x0 + 0.002 + i * 0.6;
        rv(o, 'Puerta de Rovere', px, 0.083, 0.385, 0.596, 0.515, 0.015, 2, [dx + (i ? 0.1 : -0.1), 0, 1.0], { grain: 1 });
        st(o, 'Manija negra', 'manija', px + (i ? 0.03 : 0.556), 0.4, 0.4, 0.01, 0.14, 0.03, 2, [dx + (i ? 0.1 : -0.1), 0, 1.1], { noShadow: true });
      }
      Ls.forEach((y) => tapaDoble(rv, o, 'Entrepaño de Rovere', x0 + 0.02, y, 0.03, 1.16, 0.35, 3, [dx, 0.05, 0.85]));
      Ls.forEach((y) => led(o, 'Perfil LED bajo entrepaño', 'perfilLed', x0 + 0.03, y - 0.012, 0.35, 1.14, 0.012, 0.016, 4, [dx, -0.08, 0.6]));
      [0.615].concat(Ls.map((y) => y + 0.03)).forEach((y, k) => h.fila(dec, x0 + 0.1, x0 + 1.1, y, 0.2, 3 + ((k + m) % 2), 0.15, 0.27));
    }
    posts.forEach((x, i) => st(o, 'Cremallera de tubo 50 × 25', 'tuboRect', x, 0.62, 0.0015, 0.05, 1.78, 0.025, 0, [(i - 1) * 0.3, 0, 0.25]));
    posts.forEach((x, i) => Ls.forEach((y) => st(o, 'Ménsula de tubo 1"', 'tubo1', x + 0.025 - t1 / 2, y - t1, 0.0265, t1, t1, 0.34, 0, [(i - 1) * 0.3, 0, 0.45])));
    h.chazos(o, posts.flatMap((x) => [[x + 0.025, 0.8, 0.03], [x + 0.025, 2.3, 0.03]]), 0, [0, 0, 0.3], { exA: [0, 0, 0.4] });
    h.P(o, 'Fuente 12 V', 'equipo', 0.5, 0.11, 0.06, 0.187, 0.019, 0.055, 4, [-0.16, 0, 1.05], { mk: 'fuente12' });
    h.D(o, dec); h.sombra(o, 0, 0, 2.4, 0.4);
    return h.add(2, [o], { th: -0.85 }, tgt);
  };

  // 3 · Mesa de producto: bastidor de tubo, entrepaño de lámina perforada y tapa doble de Rovere
  A[3] = function (tgt) {
    G.reseed(3403);
    const o = h.inst(3, 2.2, 0, 4.5, 0), Lx = 1.6, Fz = 0.7, yT = 0.86, s = t15;
    const legs = [[0.07, 0.07], [Lx - 0.07 - s, 0.07], [0.07, Fz - 0.07 - s], [Lx - 0.07 - s, Fz - 0.07 - s]];
    legs.forEach((p, i) => st(o, 'Pata de tubo 1-1/2"', 'tubo15', p[0], 0.02, p[1], s, yT - 0.02 - s, s, 0, [(i % 2 ? 1 : -1) * 0.35, 0, (i > 1 ? 1 : -1) * 0.25]));
    aro(o, 'Bastidor superior', 'tubo15', s, 0.07, 0.07, Lx - 0.14, Fz - 0.14, yT - s, 0, [0, 0.25, 0]);
    aro(o, 'Bastidor del entrepaño', 'tubo1', t1, 0.07 + s, 0.07 + s, Lx - 0.14 - 2 * s, Fz - 0.14 - 2 * s, 0.17, 1, [0, -0.05, 0]);
    pf(o, 'Entrepaño de lámina perforada', 0.07 + s, 0.17 + t1, 0.07 + s, Lx - 0.14 - 2 * s, 0.0015, Fz - 0.14 - 2 * s, 1, [0, 0.12, 0]);
    K.niveladores(o, legs.map((p) => [p[0] + s / 2, p[1] + s / 2]), 0.02, 1, [0, 0, 0]);
    led(o, 'Tira COB bajo el entrepaño', 'cob', 0.12, 0.165, Fz / 2 - 0.004, Lx - 0.24, 0.004, 0.008, 2, [0, -0.25, 0]);
    K.glow(o, Lx, Fz, 0.08, Lx / 2, Fz / 2);
    tapaDoble(rv, o, 'Tapa de Rovere', 0, yT, 0, Lx, Fz, 3, [0, 0.7, 0]);
    const dec = [];
    fig(dec, [[0.22, 0.32, 'jarron', 0.22, 0xf4f2ee], [0.55, 0.42, 'conejo', 0.3, 0xf4f2ee], [0.85, 0.3, 'torre', 0.36, 0x232326], [1.15, 0.42, 'facetado', 0.2, 0xf08a24], [1.4, 0.3, 'nudo', 0.16, 0xf4f2ee]], yT + 0.03);
    [0.2, 0.55, 0.95, 1.3].forEach((x, i) => G.pushBox(dec, x, 0.2, 0.22 + (i % 2) * 0.06, 0.2, 0.12 + (i % 2) * 0.04, 0.2, [0xc9a579, 0x2b2c2f, 0xe9e7e2, 0xd8b88c][i], 0.1 * i));
    h.D(o, dec);
    return h.add(3, [o], { th: 0.5, ph: 1.05 }, tgt);
  };

  // 4 · Pedestal de la pieza del día, junto a la vitrina, mirando al pasillo
  A[4] = function (tgt) {
    const o = h.inst(4, 3.85, 0, 0.8, 0), W = 0.5, Hb = 1.0, s = t1;
    [[0, 0], [W - s, 0], [0, W - s], [W - s, W - s]].forEach((p, i) => st(o, 'Paral de tubo 1"', 'tubo1', p[0], 0.02, p[1], s, Hb - 0.02, s, 0, [(i % 2 ? 1 : -1) * 0.2, 0, (i > 1 ? 1 : -1) * 0.2]));
    aro(o, 'Marco inferior', 'tubo1', s, 0, 0, W, W, 0.1, 0, [0, -0.1, 0]);
    K.niveladores(o, [[s / 2, s / 2], [W - s / 2, s / 2], [s / 2, W - s / 2], [W - s / 2, W - s / 2]], 0.02, 0, [0, 0, 0]);
    rv(o, 'Costado de Rovere', s, 0.1 + s, 0.003, W - 2 * s, Hb - 0.13 - s, 0.015, 1, [0, 0, -0.35], { grain: 1 });
    rv(o, 'Costado de Rovere', s, 0.1 + s, W - 0.018, W - 2 * s, Hb - 0.13 - s, 0.015, 1, [0, 0, 0.35], { grain: 1 });
    rv(o, 'Costado de Rovere', 0.003, 0.1 + s, s, 0.015, Hb - 0.13 - s, W - 2 * s, 1, [-0.35, 0, 0], { grain: 1 });
    rv(o, 'Costado de Rovere', W - 0.018, 0.1 + s, s, 0.015, Hb - 0.13 - s, W - 2 * s, 1, [0.35, 0, 0], { grain: 1 });
    tapaDoble(rv, o, 'Tapa de Rovere', 0, Hb - 0.03, 0, W, W, 2, [0, 0.3, 0]);
    const c = 0.06, A0 = 0.4, y0 = Hb;
    h.P(o, 'Frente de acrílico', 'acrilico', c, y0, c + A0 - 0.003, A0, A0, 0.003, 3, [0, 0.1, 0.35], { noShadow: true, order: 4, mk: 'acril3' });
    h.P(o, 'Fondo de acrílico', 'acrilico', c, y0, c, A0, A0, 0.003, 3, [0, 0.1, -0.35], { noShadow: true, order: 4, mk: 'acril3' });
    h.P(o, 'Costado de acrílico', 'acrilico', c, y0, c + 0.003, 0.003, A0, A0 - 0.006, 3, [-0.35, 0.1, 0], { noShadow: true, order: 4, mk: 'acril3' });
    h.P(o, 'Costado de acrílico', 'acrilico', c + A0 - 0.003, y0, c + 0.003, 0.003, A0, A0 - 0.006, 3, [0.35, 0.1, 0], { noShadow: true, order: 4, mk: 'acril3' });
    rv(o, 'Sombrerete de Rovere', c - 0.01, y0 + A0, c - 0.01, A0 + 0.02, 0.015, A0 + 0.02, 4, [0, 0.4, 0]);
    led(o, 'Tira COB en el sombrerete', 'cob', c + 0.05, y0 + A0 - 0.006, c + A0 / 2, A0 - 0.1, 0.004, 0.008, 4, [0, 0.3, 0]);
    const dec = []; fig(dec, [[0.25, 0.26, 'busto', 0.3, 0xf08a24, 0.6]], y0); h.D(o, dec);
    h.sombra(o, 0, 0, W, W, 0.22);
    return h.add(4, [o], { th: 0.3, ph: 1.2 }, tgt);
  };

  // 5 · Barra de diseño: marcos en U de tubo 50 × 25, reposapiés y tapa doble de Rovere
  A[5] = function (tgt) {
    const o = h.inst(5, 1.2, 0, 2.35, 0), Lx = 2.2, Fz = 0.7, yT = 1.02, w = 0.05, d = 0.025;
    [0.12, Lx - 0.12 - d].forEach((x, i) => {
      const ex = [(i ? 1 : -1) * 0.5, 0, 0];
      st(o, 'Pata del marco en U', 'tuboRect', x, 0.02, 0.18, d, yT - 0.02 - w, w, 0, ex);
      st(o, 'Pata del marco en U', 'tuboRect', x, 0.02, 0.56, d, yT - 0.02 - w, w, 0, ex);
      st(o, 'Travesaño del marco en U', 'tuboRect', x, yT - w, 0.06, d, w, 0.62, 0, [ex[0], 0.12, 0]);
    });
    K.niveladores(o, [[0.12 + d / 2, 0.205], [0.12 + d / 2, 0.585], [Lx - 0.12 - d / 2, 0.205], [Lx - 0.12 - d / 2, 0.585]], 0.02, 0, [0, 0, 0]);
    st(o, 'Viga central', 'tuboRect', 0.12 + d, yT - w, 0.35, Lx - 0.24 - 2 * d, w, d, 1, [0, 0.15, 0]);
    st(o, 'Reposapiés de tubo 1"', 'tubo1', 0.06, 0.3, 0.2, Lx - 0.12, t1, t1, 1, [0, 0, -0.4]);
    rv(o, 'Entrepaño del diseñador', 0.12 + d, 0.74, 0.4, Lx - 0.24 - 2 * d, 0.015, 0.26, 2, [0, -0.1, 0.45]);
    tapaDoble(rv, o, 'Tapa de Rovere', 0, yT, 0, Lx, Fz, 3, [0, 0.6, 0]);
    const pc = []; [0.55, 1.65].forEach((x) => pc.push({ g: G.cyl(), m: h.cylM(x, yT + 0.031, 0.6, 0.03, 0.004), c: 0x111113 }));
    h.PM(o, 'Pasacables', 'plastico', pc, 4, [0, 0.8, 0.3], { mk: 'pasacable', noShadow: true });
    const dec = [];
    G.pushBox(dec, 0.75, yT + 0.03, 0.52, 0.55, 0.012, 0.16, 0x1a1b1e); G.pushBox(dec, 0.98, yT + 0.042, 0.62, 0.08, 0.14, 0.03, 0x1a1b1e);
    G.pushBox(dec, 0.72, yT + 0.18, 0.6, 0.62, 0.36, 0.02, 0x1a1b1e); G.pushBox(dec, 0.735, yT + 0.195, 0.598, 0.59, 0.33, 0.002, 0x4f79b8);
    G.pushBox(dec, 1.5, yT + 0.03, 0.2, 0.26, 0.012, 0.19, 0x16171a, 0.2); G.fig(dec, 'gema', 0.35, yT + 0.03, 0.25, 0.12, 0xf08a24, 0.3);
    h.D(o, dec, 'decorMate'); h.sombra(o, 0, 0, Lx, Fz, 0.16);
    return h.add(5, [o], { th: Math.PI - 0.45, ph: 1.05 }, tgt);
  };

  // 7 · Vitrina de impresión: el mesón mira al pasillo; frente de lámina perforada y tapa doble
  A[7] = function (tgt) {
    G.reseed(7407);
    const o = h.inst(7, 0.65, 0, 0.85, 0), xs = [0, 0.8, 1.6, 2.4, 3.2 - 0.025], yT = 0.87, dec = [];
    xs.forEach((x, i) => {
      const ex = [(i - 2) * 0.22, 0, 0];
      st(o, 'Paral de tubo 50 × 25', 'tuboRect', x, 0.02, 0.02, 0.025, yT - 0.02, 0.05, 0, ex);
      st(o, 'Paral de tubo 50 × 25', 'tuboRect', x, 0.02, 0.53, 0.025, yT - 0.02, 0.05, 0, ex);
      st(o, 'Travesaño', 'tubo1', x, 0.1, 0.07, 0.025, t1, 0.46, 0, ex);
      st(o, 'Travesaño', 'tubo1', x, yT - t1, 0.07, 0.025, t1, 0.46, 0, ex);
    });
    [[0.1, 0.02], [0.1, 0.58 - t1 + 0.02], [yT - t1, 0.02], [yT - t1, 0.58 - t1 + 0.02]].forEach((p, i) => st(o, 'Larguero de tubo 1"', 'tubo1', 0.025, p[0], p[1], 3.2 - 0.05, t1, t1, 1, [0, i > 1 ? 0.2 : -0.1, p[1] > 0.3 ? 0.4 : -0.4]));
    K.niveladores(o, xs.flatMap((x) => [[x + 0.0125, 0.045], [x + 0.0125, 0.555]]), 0.02, 1, [0, 0, 0]);
    for (let m = 0; m < 4; m++) {
      const x0 = xs[m] + 0.025, w = xs[m + 1] - x0, dx = (m - 1.5) * 0.2;
      rv(o, 'Entrepaño bajo', x0, 0.1 + t1, 0.045, w, 0.015, 0.51, 2, [dx, 0.06, 0]);
      pf(o, 'Frente de lámina perforada', x0, 0.1, 0.58, w, yT - 0.1 - t1, 0.0015, 3, [dx, 0, 0.6]);
      for (let i = 0; i < 2; i++) {
        const px = x0 + 0.002 + i * w / 2, pw = w / 2 - 0.004, dd = dx + (i ? 0.05 : -0.05);
        rv(o, 'Puerta de Rovere (lado del taller)', px, 0.1, 0.002, pw, yT - 0.105 - t1, 0.015, 4, [dd, 0, -0.9], { grain: 1 });
        st(o, 'Manija negra', 'manija', px + (i ? 0.03 : pw - 0.04), 0.55, -0.012, 0.01, 0.14, 0.014, 4, [dd, 0, -1.0], { noShadow: true });
      }
      [0.2, 0.36].forEach((z, k) => G.pushBox(dec, x0 + 0.08 + k * 0.32, 0.1 + t1 + 0.015, z, 0.26, 0.22, 0.2, [0xc9a579, 0x2b2c2f, 0xd8b88c, 0xe9e7e2][(m + k) % 4], 0.05));
    }
    [0, 1].forEach((i) => tapaDoble(rv, o, 'Tapa de Rovere', i * 1.6, yT, 0, 1.6, 0.6, 5, [i ? 0.3 : -0.3, 0.5, 0]));
    const pc = []; [0.4, 1.2, 2.0, 2.8].forEach((x) => pc.push({ g: G.cyl(), m: h.cylM(x, yT + 0.031, 0.1, 0.03, 0.004), c: 0x111113 }));
    h.PM(o, 'Pasacables', 'plastico', pc, 6, [0, 0.8, 0], { mk: 'pasacable', noShadow: true });
    led(o, 'Tira COB bajo la tapa, hacia el pasillo', 'cob', 0.05, yT - 0.006, 0.575, 3.1, 0.004, 0.008, 6, [0, -0.1, 0.5]);
    h.D(o, dec, 'decorMate'); h.sombra(o, 0, 0, 3.2, 0.6);
    return h.add(7, [o], { th: 0.35, ph: 1.15 }, tgt);
  };

  // 9 · Repisa colgante de carretes, sobre las impresoras y a la vista desde el pasillo
  A[9] = function (tgt) {
    G.reseed(9409);
    const o = h.inst(9, 0.65, 0, 0.85, 0), xs = [0.2, 1.1, 2.1, 3.0], Ls = [1.95, 2.3], z0 = 0.18, dz = 0.25, top = 3.0, dec = [];
    xs.forEach((x, i) => st(o, 'Colgante de tubo 1"', 'tubo1', x - t1 / 2, Ls[0] - t1, z0 + dz / 2 - t1 / 2, t1, top - Ls[0] + t1 - 0.004, t1, 0, [(i - 1.5) * 0.25, 0.3, 0]));
    xs.forEach((x) => Ls.forEach((y) => st(o, 'Brazo de tubo 1"', 'tubo1', x - t1 / 2, y - t1, z0, t1, t1, dz, 0, [0, 0.3, 0])));
    const pl = []; xs.forEach((x) => G.pushBox(pl, x - 0.05, top - 0.006, z0 + dz / 2 - 0.05, 0.1, 0.006, 0.1, NEGRO));
    h.PM(o, 'Platinas de cielo', 'acero', pl, 0, [0, 0.3, 0], { mk: 'tubo1', noShadow: true });
    h.chazos(o, xs.map((x) => [x, top - 0.02, z0 + dz / 2 - 0.03]), 0, [0, 0.4, 0]);
    Ls.forEach((y, r) => [0, 1].forEach((i) => rv(o, 'Repisa de Rovere', i * 1.6, y, z0, 1.6, 0.015, dz, 1, [i ? 0.25 : -0.25, r ? 0.25 : -0.15, 0.3])));
    Ls.forEach((y, r) => carretes(dec, 0.08, 3.12, y + 0.015, z0 + dz / 2, 13, r * 4));
    h.D(o, dec, 'decor');
    return h.add(9, [o], { th: 0.3, ph: 1.3, lp: [-1.35, 0] }, tgt);
  };

  // 10 · Cajonera de repuestos: base de tubo, cuerpo blanco y frentes de Rovere
  A[10] = function (tgt) {
    G.reseed(10410);
    const o = h.inst(10, 0, 0, 1.2, PI / 2), Lx = 3.0, Fz = 0.5, y0 = 0.12, yT = 0.86, dec = [];
    st(o, 'Base: larguero de tubo 1"', 'tubo1', 0, y0 - t1, 0.03, Lx, t1, t1, 0, [0, -0.1, -0.3]);
    st(o, 'Base: larguero de tubo 1"', 'tubo1', 0, y0 - t1, Fz - 0.06, Lx, t1, t1, 0, [0, -0.1, 0.3]);
    [0, 0.6, 1.2, 1.8, 2.4, 3.0 - t1].forEach((x) => st(o, 'Base: travesaño', 'tubo1', x, y0 - t1, 0.03 + t1, t1, t1, Fz - 0.09 - t1, 0, [0, -0.1, 0]));
    K.niveladores(o, [0.02, 1.5, 2.98].flatMap((x) => [[x, 0.042], [x, Fz - 0.048]]), y0 - t1, 0, [0, 0, 0]);
    for (let m = 0; m < 5; m++) {
      const x0 = m * 0.6, dx = (m - 2) * 0.17, rl = [];
      bl(o, 'Lateral', x0, y0, 0, 0.015, yT - y0, 0.48, 1, [dx - 0.065, 0, 0.4]);
      bl(o, 'Lateral', x0 + 0.585, y0, 0, 0.015, yT - y0, 0.48, 1, [dx + 0.065, 0, 0.4]);
      bl(o, 'Piso', x0 + 0.015, y0, 0.006, 0.57, 0.015, 0.474, 1, [dx, -0.05, 0.4]);
      bl(o, 'Amarre', x0 + 0.015, yT - 0.015, 0.006, 0.57, 0.015, 0.1, 1, [dx, 0.12, 0.4]);
      fo(o, 'Fondo 6 mm', x0 + 0.005, y0, 0, 0.59, yT - y0, 0.006, 1, [dx, 0, -0.3]);
      for (let j = 0; j < 3; j++) {
        const y = y0 + 0.003 + j * 0.246, bx = [];
        G.pushBox(bx, x0 + 0.03, y + 0.04, 0.03, 0.015, 0.17, 0.44, 0xf2f0eb); G.pushBox(bx, x0 + 0.555, y + 0.04, 0.03, 0.015, 0.17, 0.44, 0xf2f0eb);
        G.pushBox(bx, x0 + 0.045, y + 0.04, 0.03, 0.51, 0.17, 0.015, 0xf2f0eb); G.pushBox(bx, x0 + 0.045, y + 0.04, 0.455, 0.51, 0.17, 0.015, 0xf2f0eb);
        G.pushBox(bx, x0 + 0.031, y + 0.034, 0.03, 0.538, 0.006, 0.44, 0xf6f4ef);
        h.PM(o, 'Caja de cajón', 'decor', bx, 2, [dx, 0, 0.95], { mk: 'blanca15' });
        G.pushBox(rl, x0 + 0.016, y + 0.09, 0.03, 0.012, 0.036, 0.44, 0xc6c8cb); G.pushBox(rl, x0 + 0.572, y + 0.09, 0.03, 0.012, 0.036, 0.44, 0xc6c8cb);
        rv(o, 'Frente de Rovere', x0 + 0.002, y, 0.48, 0.596, 0.242, 0.015, 3, [dx, 0, 1.4]);
        st(o, 'Manija negra', 'manija', x0 + 0.23, y + 0.17, 0.495, 0.14, 0.01, 0.014, 3, [dx, 0.04, 1.5], { noShadow: true });
      }
      h.PM(o, 'Rieles de extensión total', 'alu', rl, 2, [dx, 0, 0.4], { mk: 'riel45', noShadow: true, exA: [0, 0, 0.5] });
    }
    [0, 1].forEach((i) => tapaDoble(rv, o, 'Tapa de Rovere', i * 1.5, yT, 0, 1.5, Fz, 4, [i ? 0.3 : -0.3, 0.4, 0.3]));
    G.pushBox(dec, 0.4, yT + 0.03, 0.12, 0.3, 0.1, 0.24, 0xc9a579, 0.1); G.fig(dec, 'gema', 1.1, yT + 0.03, 0.28, 0.12, 0xf08a24, 0.4);
    G.pushBox(dec, 2.2, yT + 0.03, 0.15, 0.36, 0.012, 0.26, 0xdedcd7, -0.1);
    h.D(o, dec); h.sombra(o, 0, 0, Lx, Fz);
    return h.add(10, [o], { th: 0.95, ph: 1.05 }, tgt);
  };

  // 11 · Panel de herramientas: marco de tubo con lámina perforada negra, sobre la cajonera
  A[11] = function (tgt) {
    G.reseed(11411);
    const o = h.inst(11, 0, 1.05, 1.2, PI / 2), W = 3.0, H = 1.2;
    st(o, 'Marco: travesaño de tubo 1"', 'tubo1', 0, 0, 0, W, t1, t1, 0, [0, -0.15, 0.25]);
    st(o, 'Marco: travesaño de tubo 1"', 'tubo1', 0, H - t1, 0, W, t1, t1, 0, [0, 0.15, 0.25]);
    [0, 1.5 - t1 / 2, W - t1].forEach((x, i) => st(o, 'Marco: paral de tubo 1"', 'tubo1', x, t1, 0, t1, H - 2 * t1, t1, 0, [(i - 1) * 0.3, 0, 0.25]));
    h.chazos(o, [0.1, 1.5, 2.9].flatMap((x) => [[x, 0.012, 0.03], [x, H - 0.012, 0.03]]), 0, [0, 0, 0.4]);
    [0, 1].forEach((i) => pf(o, 'Lámina perforada negra', i * 1.5 + (i ? t1 / 2 : 0.005), 0.005, t1, 1.5 - t1 / 2 - 0.005, H - 0.01, 0.0015, 1, [i ? 0.2 : -0.2, 0, 0.6]));
    const l = [], cs = [0x2f6fd0, 0xf2c230, 0xd9412e, 0x3f9b57, 0xf08a24, 0x232326, 0xf4f2ee, 0x8a4fd0, 0x2aa3a0, 0xe96aa6];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      const x = 0.2 + c * 0.25, y = 1.03 - r * 0.33;
      G.spool(l, x, y, t1 + 0.07, 0.098, 0.062, cs[(r * 5 + c * 3) % cs.length], 'z');
      l.push({ g: G.cyl(), m: h.cylM(x, y, t1 + 0.04, 0.006, 0.09, 'z'), c: 0x9a9da1 });
    }
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
      const x = 1.65 + c * 0.19, y = 1.06 - r * 0.27, w = 0.06 + G.rand() * 0.06, hh = 0.1 + G.rand() * 0.08;
      l.push({ g: G.cyl(), m: h.cylM(x, y + hh / 2 + 0.01, t1 + 0.02, 0.004, 0.05, 'z'), c: 0x9a9da1 });
      G.pushBox(l, x - w / 2, y - hh / 2, t1 + 0.012, w, hh, 0.028, G.rand() > 0.4 ? 0x26272a : (G.rand() > 0.5 ? 0xd9412e : 0xe9e7e2));
    }
    h.PM(o, 'Ganchos, carretes y herramientas', 'decor', l, 2, [0, 0, 1.1], { mk: 'ganchos' });
    return h.add(11, [o], { th: 1.0, ph: 1.2 }, tgt);
  };

  // 12 · Vitrina mural con marco de tubo, caja de Rovere y frente de acrílico
  A[12] = function (tgt) {
    G.reseed(12412);
    const o = h.inst(12, 6, 1.05, 5.0, -PI / 2), W = 0.4, Fz = 0.15, H = 1.2, s = 0.02;
    [[0, 0], [W - s, 0], [0, Fz - s], [W - s, Fz - s]].forEach((p, i) => st(o, 'Esquinero de acero', 'tubo1', p[0], 0, p[1], s, H, s, 0, [(i % 2 ? 1 : -1) * 0.15, 0, (i > 1 ? 0.3 : 0.1)]));
    h.chazos(o, [[0.1, 1.1, 0.03], [0.3, 1.1, 0.03]], 0, [0, 0, 0.2], { exA: [0, 0, 0.3] });
    rv(o, 'Fondo de Rovere', s, 0, 0, W - 2 * s, H, 0.015, 1, [0, 0, -0.2], { grain: 1 });
    rv(o, 'Piso de Rovere', s, 0, 0.015, W - 2 * s, 0.015, Fz - 0.015, 1, [0, -0.2, 0.2]);
    rv(o, 'Techo de Rovere', s, H - 0.015, 0.015, W - 2 * s, 0.015, Fz - 0.015, 1, [0, 0.2, 0.2]);
    [0.3, 0.6, 0.9].forEach((y) => h.P(o, 'Entrepaño de acrílico', 'acrilico', s, y, 0.016, W - 2 * s, 0.003, Fz - 0.02, 2, [0, 0, 0.55], { noShadow: true, order: 3, mk: 'acril3' }));
    h.P(o, 'Frente de acrílico', 'acrilico', 0, 0.002, Fz, W, H - 0.004, 0.003, 2, [0, 0, 0.85], { noShadow: true, order: 4, mk: 'acril3' });
    led(o, 'Perfil LED (retal)', 'perfilLed', s + 0.002, 0.03, Fz - 0.025, 0.012, H - 0.06, 0.012, 3, [-0.12, 0, 0.6]);
    h.P(o, 'Fuente 12 V', 'equipo', 0.14, H, 0.04, 0.187, 0.019, 0.055, 3, [0, 0.4, 0.26], { mk: 'fuente3' });
    const dec = [];
    [0.015, 0.303, 0.603, 0.903].forEach((y, i) => { G.fig(dec, ['torre', 'conejo', 'busto', 'jarron'][i], 0.14, y, 0.075, 0.2, [0x232326, 0xf4f2ee, 0xf08a24, 0x2f6fd0][i], 0.3); G.fig(dec, ['gema', 'nudo', 'aro', 'facetado'][i], 0.28, y, 0.075, 0.13, [0xf4f2ee, 0x232326, 0xf4f2ee, 0x232326][i], 0); });
    h.D(o, dec);
    return h.add(12, [o], { th: -0.9, ph: 1.25 }, tgt);
  };

  // 13 · Torre de producto junto a la entrada: marcos escalera de tubo, fondo perforado y entrepaños de Rovere
  A[13] = function (tgt) {
    G.reseed(13413);
    const o = h.inst(13, 6, 0, 1.45, -PI / 2), W = 1.2, Fz = 0.4, H = 2.4, dec = [];
    const Ls = [0.1, 0.52, 0.94, 1.36, 1.78, 2.2];
    [0, W - t1].forEach((x, i) => {
      const ex = [(i ? 1 : -1) * 0.45, 0, 0.3];
      st(o, 'Paral de tubo 1"', 'tubo1', x, 0.02, 0, t1, H - 0.02, t1, 0, ex); st(o, 'Paral de tubo 1"', 'tubo1', x, 0.02, Fz - t1, t1, H - 0.02, t1, 0, ex);
      Ls.forEach((y) => st(o, 'Peldaño de tubo 1"', 'tubo1', x, y - t1, t1, t1, t1, Fz - 2 * t1, 0, ex));
    });
    [0.3, H - t1].forEach((y) => st(o, 'Larguero trasero', 'tubo1', t1, y, 0, W - 2 * t1, t1, t1, 0, [0, 0, -0.3]));
    K.niveladores(o, [[t1 / 2, t1 / 2], [t1 / 2, Fz - t1 / 2], [W - t1 / 2, t1 / 2], [W - t1 / 2, Fz - t1 / 2]], 0.02, 1, [0, 0, 0]);
    h.chazos(o, [[0.3, 2.2, 0.03], [0.9, 2.2, 0.03]], 1, [0, 0, 0.28], { exA: [0, 0, 0.4] });
    pf(o, 'Fondo de lámina perforada', t1, 0.1, 0.002, W - 2 * t1, H - 0.15, 0.0015, 1, [0, 0, -0.45]);
    Ls.forEach((y) => rv(o, 'Entrepaño de Rovere', t1 + 0.002, y, 0.006, W - 2 * t1 - 0.004, 0.015, Fz - 0.012, 2, [0, 0.05, 0.85]));
    led(o, 'Perfil LED vertical', 'perfilLed', t1 + 0.003, 0.12, Fz - 0.03, 0.012, H - 0.25, 0.014, 3, [-0.15, 0, 0.7]);
    led(o, 'Perfil LED vertical', 'perfilLed', W - t1 - 0.015, 0.12, Fz - 0.03, 0.012, H - 0.25, 0.014, 3, [0.15, 0, 0.7]);
    h.P(o, 'Fuente 12 V', 'equipo', 0.5, H, 0.1, 0.187, 0.019, 0.055, 3, [0, 0.5, 0.5], { mk: 'fuente8' });
    Ls.forEach((y, k) => h.fila(dec, 0.12, 1.08, y + 0.015, 0.2, 2 + (k % 2), 0.17, 0.3, [0x232326, 0xf4f2ee, 0xf4f2ee, 0x2f6fd0, 0xf08a24, 0xf4f2ee]));
    h.D(o, dec); h.sombra(o, 0, 0, W, Fz);
    return h.add(13, [o], { th: -0.85 }, tgt);
  };

  // 15 · Mampara de acero negro y vidrio templado en paños, con puerta batiente
  A[15] = function (tgt) {
    const o = h.inst(15, 3.9, 0, 5.6, 0), w = 0.05, d = 0.025, z = 0.04, H = 2.4;
    st(o, 'Jamba de tubo 50 × 25', 'tuboRect', 0, 0, z, w, H, d, 0, [-0.4, 0, 0.4]);
    st(o, 'Montante de tubo 50 × 25', 'tuboRect', 1.0, 0, z, w, H, d, 0, [-0.1, 0, 0.4]);
    st(o, 'Montante de tubo 50 × 25', 'tuboRect', 1.95, 0, z, w, H, d, 0, [0.3, 0, 0.4]);
    st(o, 'Cabezal de tubo 50 × 25', 'tuboRect', 0, H - w, z, 2.0, w, d, 0, [0, 0.3, 0.4]);
    [0, 0.8, 1.6].forEach((y) => st(o, 'Travesaño del fijo', 'tuboRect', w, y, z, 1.0 - w, w, d, 0, [-0.25, (y - 0.8) * 0.2, 0.4]));
    h.chazos(o, [[0.025, 0.4, z + 0.012], [0.025, 2.0, z + 0.012], [1.5, H - 0.02, z + 0.012]], 0, [-0.3, 0, 0.4]);
    [[w, 0.8], [0.8 + w, 1.6], [1.6 + w, H - w]].forEach((r, i) => h.P(o, 'Vidrio templado 6 mm', 'vidrio', w + 0.004, r[0] + 0.004, z + 0.009, 1.0 - w - 0.008, r[1] - r[0] - 0.008, 0.006, 1, [-0.25, 0, 0.8 + i * 0.1], { noShadow: true, order: 3, mk: 'vidrio6' }));
    const dx0 = 1.06, dw = 0.88, dh = 2.3;
    st(o, 'Puerta: larguero', 'tuboRect', dx0, 0.02, z, w, dh, d, 2, [0.25, 0, 1.0]); st(o, 'Puerta: larguero', 'tuboRect', dx0 + dw - w, 0.02, z, w, dh, d, 2, [0.25, 0, 1.0]);
    [0.02, 1.1, 0.02 + dh - w].forEach((y) => st(o, 'Puerta: travesaño', 'tuboRect', dx0 + w, y, z, dw - 2 * w, w, d, 2, [0.25, 0, 1.0]));
    [[0.02 + w, 1.1], [1.1 + w, 0.02 + dh - w]].forEach((r) => h.P(o, 'Vidrio templado 6 mm', 'vidrio', dx0 + w + 0.004, r[0] + 0.004, z + 0.009, dw - 2 * w - 0.008, r[1] - r[0] - 0.008, 0.006, 2, [0.25, 0, 1.2], { noShadow: true, order: 3, mk: 'vidrio6' }));
    const bs = []; [0.3, 1.2, 2.05].forEach((y) => bs.push({ g: G.cyl(), m: h.cylM(dx0 + dw + 0.004, y, z + d / 2, 0.009, 0.1), c: NEGRO }));
    h.PM(o, 'Bisagras para soldar', 'acero', bs, 3, [0.4, 0, 1.3], { mk: 'bisagraSold', noShadow: true });
    st(o, 'Manija negra', 'manija', dx0 + 0.07, 0.95, z + d, 0.012, 0.3, 0.03, 3, [0.25, 0, 1.5], { noShadow: true });
    return h.add(15, [o], { th: 0.1, ph: 1.25 }, tgt);
  };

  // 17 · Escritorio de taller: marco de tubo, faldón de lámina perforada para herramientas y tapa doble de Rovere
  A[17] = function (tgt) {
    const o = h.inst(17, 2.3, 0, 7.0, 0), Lx = 1.2, Fz = 0.6, yT = 0.72;
    [[0.04, 0.04], [Lx - 0.04 - t1, 0.04], [0.04, Fz - 0.04 - t1], [Lx - 0.04 - t1, Fz - 0.04 - t1]].forEach((p, i) => st(o, 'Pata de tubo 1"', 'tubo1', p[0], 0.02, p[1], t1, yT - 0.02, t1, 0, [(i % 2 ? 1 : -1) * 0.25, 0, (i > 1 ? 1 : -1) * 0.2]));
    aro(o, 'Bastidor de tubo 1"', 'tubo1', t1, 0.04, 0.04, Lx - 0.08, Fz - 0.08, yT - t1, 0, [0, 0.2, 0]);
    st(o, 'Reposapiés', 'tubo1', 0.04 + t1, 0.15, Fz - 0.04 - t1, Lx - 0.08 - 2 * t1, t1, t1, 0, [0, 0, 0.25]);
    K.niveladores(o, [[0.04 + t1 / 2, 0.04 + t1 / 2], [Lx - 0.04 - t1 / 2, 0.04 + t1 / 2], [0.04 + t1 / 2, Fz - 0.04 - t1 / 2], [Lx - 0.04 - t1 / 2, Fz - 0.04 - t1 / 2]], 0.02, 0, [0, 0, 0]);
    pf(o, 'Faldón de lámina perforada', 0.04 + t1, 0.3, 0.04 + t1 / 2, Lx - 0.08 - 2 * t1, yT - 0.3 - t1, 0.0015, 1, [0, 0, -0.35]);
    tapaDoble(rv, o, 'Tapa de Rovere', 0, yT, 0, Lx, Fz, 2, [0, 0.55, 0]);
    h.PM(o, 'Pasacable', 'plastico', [{ g: G.cyl(), m: h.cylM(1.08, yT + 0.031, 0.08, 0.03, 0.004), c: 0x111113 }], 2, [0, 0.72, 0], { mk: 'pasacable', noShadow: true });
    const dec = [];
    G.pushBox(dec, 0.33, yT + 0.03, 0.1, 0.24, 0.012, 0.14, 0x1a1b1e); G.pushBox(dec, 0.44, yT + 0.04, 0.14, 0.03, 0.12, 0.03, 0x1a1b1e);
    G.pushBox(dec, 0.15, yT + 0.14, 0.13, 0.6, 0.34, 0.018, 0x1a1b1e); G.pushBox(dec, 0.165, yT + 0.155, 0.149, 0.57, 0.31, 0.002, 0x4f79b8);
    G.pushBox(dec, 0.26, yT + 0.03, 0.36, 0.38, 0.012, 0.13, 0xdedcd7);
    h.D(o, dec, 'decorMate'); h.sombra(o, 0, 0, Lx, Fz, 0.16);
    return h.add(17, [o], { th: 0.35, ph: 0.6, zone: 'trastienda' }, tgt);
  };

  /* ======================================================== VERSIÓN B · GALERÍA */
  const B = {};

  // 2 · Muro de nichos: retícula lacada de nichos de distinto tamaño, cada uno con su luz
  B[2] = function (tgt) {
    G.reseed(2502);
    const o = h.inst(2, 0, 0, 0.6, PI / 2), W = 4.2, Fz = 0.35, H = 2.4, yZ = 0.1, yC = 0.62, t = 0.018, dec = [];
    const mods = [
      { x0: 0, rows: [yC, 1.18, 1.78, H - t], mids: [[1, 0.62]] },
      { x0: 1.4, rows: [yC, 1.42, 1.94, H - t], mids: [[0, 0.82], [2, 0.5]] },
      { x0: 2.8, rows: [yC, 1.02, 1.62, H - t], mids: [[2, 0.9]] }
    ];
    // zócalo, patas y fondo
    for (let m = 0; m < 3; m++) {
      const x0 = mods[m].x0, dx = (m - 1) * 0.35;
      lq(o, 'Zócalo retranqueado', x0 + t, 0, Fz - 0.07, 1.4 - t, yZ, t, 0, [dx, -0.1, 0.4]);
      h.patas(o, [[x0 + 0.15, 0.08], [x0 + 1.25, 0.08], [x0 + 0.15, Fz - 0.12], [x0 + 1.25, Fz - 0.12]], yZ, 0, [dx, -0.1, 0.4], { mk: 'pataNiv' });
      h.P(o, 'Fondo de MDF 5.5 mm lacado', 'laca', x0 + t / 2, yZ, 0, 1.4 - t, H - yZ, 0.0055, 1, [dx, 0, -0.35], { mk: 'mdf55' });
    }
    [0, 1.4, 2.8, W - t].forEach((x, i) => lq(o, 'Costado lacado', x, yZ, 0, t, H - yZ, Fz, 1, [(i - 1.5) * 0.3, 0, 0.5]));
    h.chazos(o, [0.7, 2.1, 3.5].flatMap((x) => [[x, 0.9, 0.03], [x, 2.2, 0.03]]), 1, [0, 0, 0.3], { exA: [0, 0, 0.4] });
    mods.forEach((md, m) => {
      const x0 = md.x0 + t, w = 1.4 - t, dx = (m - 1) * 0.35;
      lq(o, 'Piso del zócalo', x0, yZ, 0.006, w, t, Fz - 0.08, 2, [dx, -0.05, 0.55]);
      md.rows.forEach((y, k) => lq(o, k === md.rows.length - 1 ? 'Techo' : 'Entrepaño lacado', x0, y, 0.006, w, t, Fz - 0.006, 2, [dx, 0.04 * k, 0.75]));
      md.mids.forEach((mi) => { const yA = md.rows[mi[0]] + t, yB = md.rows[mi[0] + 1]; lq(o, 'División lacada', md.x0 + mi[1], yA, 0.006, t, yB - yA, Fz - 0.006, 2, [dx, 0, 0.95]); });
      // puertas del zócalo, de empuje
      for (let i = 0; i < 2; i++) lq(o, 'Puerta lacada', x0 + 0.002 + i * w / 2, yZ + t + 0.003, Fz, w / 2 - 0.004, yC - yZ - t - 0.006, t, 3, [dx + (i ? 0.08 : -0.08), 0, 0.9]);
      // luz: una tira COB bajo cada entrepaño, escondida tras el canto
      for (let k = 0; k < md.rows.length - 1; k++) {
        const yTop = md.rows[k + 1];
        led(o, 'Tira COB del nicho', 'cob', x0 + 0.02, yTop - 0.006, Fz - 0.05, w - 0.04, 0.004, 0.008, 4, [dx, -0.06, 0.55]);
        const yb = md.rows[k] + t, mid = md.mids.find((mi) => mi[0] === k);
        const segs = mid ? [[x0 + 0.05, md.x0 + mid[1] - 0.05], [md.x0 + mid[1] + t + 0.05, x0 + w - 0.05]] : [[x0 + 0.08, x0 + w - 0.08]];
        segs.forEach((sg) => h.fila(dec, sg[0], sg[1], yb, Fz / 2, Math.max(1, Math.round((sg[1] - sg[0]) / 0.38)), Math.min(0.32, (yTop - yb) * 0.55), Math.min(0.42, (yTop - yb) * 0.75), [0xf4f2ee, 0xf4f2ee, 0x232326, 0xc9a579, 0xf08a24, 0xf4f2ee]));
      }
    });
    h.P(o, 'Fuente 12 V', 'equipo', 0.6, yZ + t + 0.01, 0.08, 0.187, 0.019, 0.055, 4, [0, 0, 1.0], { mk: 'fuente12' });
    h.P(o, 'Fuente 12 V', 'equipo', 3.2, yZ + t + 0.01, 0.08, 0.187, 0.019, 0.055, 4, [0, 0, 1.0], { mk: 'fuente12' });
    h.D(o, dec); h.sombra(o, 0, 0, W, Fz);
    return h.add(2, [o], { th: 0.95, ph: 1.12 }, tgt);
  };

  // 3 · Isla escultórica: tres volúmenes lacados escalonados que suben hacia la barra
  B[3] = function (tgt) {
    G.reseed(3503);
    const o = h.inst(3, 2.4, 0, 2.8, 0);
    const tiers = [
      { x0: 0, z0: 0, Lx: 1.2, Fz: 0.6, r: { fl: 0.2, fr: 0.2 }, hh: 0.92, ex: [0, 0.2, -0.5], name: 'Volumen alto', top: true },
      { x0: 0.1, z0: 0.6, Lx: 1.0, Fz: 0.5, r: { fl: 0.22, fr: 0.22 }, hh: 0.70, ex: [0, 0.1, 0.1], name: 'Volumen medio' },
      { x0: 0.2, z0: 1.1, Lx: 0.8, Fz: 0.5, r: { fl: 0.3, fr: 0.3 }, hh: 0.46, ex: [0, 0, 0.7], name: 'Volumen bajo' }
    ];
    tiers.forEach((tr) => volumen(o, tr.name, tr.x0, tr.z0, tr.Lx, tr.Fz, tr.r, tr.hh, 0, tr.ex, tr.top ? { topMat: 'melRovere', topMk: 'rovere15' } : null));
    const ll = []; tiers.forEach((tr) => { const pts = G.planShape(tr.Lx, tr.Fz, tr.r, 0.057).getPoints(8); for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y); if (len < 1e-4) continue; ll.push({ g: new T.BoxGeometry(len, 0.004, 0.008), m: G.mat(tr.x0 + (a.x + b.x) / 2, 0.075, tr.z0 - (a.y + b.y) / 2, 0, -Math.atan2(-(b.y - a.y), b.x - a.x), 0), c: 0xffffff }); } });
    h.PM(o, 'Tira COB en el zócalo', 'led', ll, 3, [0, -0.3, 0], { mk: 'cob', noShadow: true });
    K.glow(o, 1.2, 1.6, 0.25, 0.6, 0.8);
    h.P(o, 'Fuente 12 V', 'equipo', 0.5, 0.1, 0.1, 0.187, 0.019, 0.055, 3, [0, 0, -0.5], { mk: 'fuente8' });
    const dec = [];
    fig(dec, [[0.3, 0.3, 'conejo', 0.36, 0xf4f2ee], [0.62, 0.22, 'torre', 0.46, 0x232326], [0.92, 0.36, 'jarron', 0.24, 0xc9a579]], 0.92);
    fig(dec, [[0.35, 0.86, 'busto', 0.34, 0xf4f2ee], [0.75, 0.84, 'nudo', 0.2, 0xf08a24]], 0.70);
    fig(dec, [[0.45, 1.36, 'facetado', 0.26, 0xf4f2ee], [0.68, 1.3, 'gema', 0.15, 0x232326]], 0.46);
    h.D(o, dec);
    return h.add(3, [o], { th: -0.75, ph: 1.0 }, tgt);
  };

  // 4 · Pedestales: tres cilindros lacados de distinta altura en el eje de la entrada
  B[4] = function (tgt) {
    G.reseed(4504);
    const o = h.inst(4, 2.55, 0, 1.05, 0);
    const cs = [[0.18, 0.38, 0.17, 0.62, [-0.35, 0, 0.1]], [0.47, 0.2, 0.17, 0.86, [0, 0.1, -0.35]], [0.73, 0.42, 0.15, 1.06, [0.35, 0.2, 0.15]]];
    cs.forEach((c, i) => cilindro(o, 'Pedestal ' + (i + 1), c[0], c[1], c[2], c[3], c[4]));
    K.glow(o, 0.9, 0.6, 0.25, 0.45, 0.3);
    const dec = [];
    // cada figura sobre su pedestal
    cs.forEach((c, i) => G.fig(dec, ['jarron', 'conejo', 'busto'][i], c[0], c[3], c[1], [0.26, 0.3, 0.32][i], [0xf4f2ee, 0xf08a24, 0x232326][i], 0.3 * i));
    h.D(o, dec);
    return h.add(4, [o], { th: 0.2, ph: 1.12 }, tgt);
  };

  // 5 · Barra de encuentro, adosada a la isla: volumen lacado con tapa doble de Rovere en voladizo
  B[5] = function (tgt) {
    const o = h.inst(5, 2.1, 0, 3.5, 0), Lx = 1.8, Fz = 0.7, yT = 1.02, zB = 0.3, t = 0.018;
    lq(o, 'Piso', t, 0.08, zB + 0.01, Lx - 2 * t, t, Fz - zB - 0.02, 0, [0, 0.05, 0]);
    [0.45, 0.9, 1.35].forEach((x) => lq(o, 'Costilla', x, 0.08 + t, zB + t, t, yT - 0.08 - 2 * t, Fz - zB - 2 * t, 0, [0, 0.2, 0]));
    lq(o, 'Zócalo negro retranqueado', 0.05, 0, zB + 0.05, Lx - 0.1, 0.08, t, 0, [0, -0.15, -0.2], { mk: 'mdf15' });
    lq(o, 'Frente lacado', 0, 0.08, zB, Lx, yT - 0.08, t, 1, [0, 0, -0.55]);
    lq(o, 'Costado lacado', 0, 0.08, zB + t, t, yT - 0.08, Fz - zB - t, 1, [-0.5, 0, 0]);
    lq(o, 'Costado lacado', Lx - t, 0.08, zB + t, t, yT - 0.08, Fz - zB - t, 1, [0.5, 0, 0]);
    lq(o, 'Fondo lacado', t, 0.08, Fz - t, Lx - 2 * t, yT - 0.08, t, 1, [0, 0, 0.5]);
    st(o, 'Reposapiés de tubo 1"', 'tubo1', 0.1, 0.3, zB - 0.08, Lx - 0.2, t1, t1, 2, [0, 0, -0.75]);
    const so = []; [0.25, 0.9, 1.55].forEach((x) => G.pushBox(so, x, 0.3 + t1 / 2 - 0.006, zB - 0.08 + t1, 0.012, 0.012, 0.08 - t1, NEGRO));
    h.PM(o, 'Soportes del reposapiés', 'acero', so, 2, [0, 0, -0.65], { mk: 'tubo1', noShadow: true });
    tapaDoble(rv, o, 'Tapa de Rovere', 0, yT, 0, Lx, Fz, 3, [0, 0.6, 0]);
    led(o, 'Tira COB bajo el voladizo', 'cob', 0.05, yT - 0.006, zB - 0.02, Lx - 0.1, 0.004, 0.008, 4, [0, -0.2, -0.35]);
    h.PM(o, 'Pasacable', 'plastico', [{ g: G.cyl(), m: h.cylM(1.5, yT + 0.031, 0.55, 0.03, 0.004), c: 0x111113 }], 4, [0, 0.8, 0], { mk: 'pasacable', noShadow: true });
    const dec = []; G.pushBox(dec, 0.5, yT + 0.03, 0.18, 0.3, 0.012, 0.21, 0x1a1b1e, 0.15); G.pushBox(dec, 0.95, yT + 0.03, 0.25, 0.22, 0.008, 0.15, 0xe9e7e2, -0.2);
    h.D(o, dec); h.sombra(o, 0, zB, Lx, Fz - zB, 0.18);
    return h.add(5, [o], { th: -0.2, ph: 1.05 }, tgt);
  };

  // 7 · Laboratorio de impresión: mesón lacado dentro de un nicho con luz, en el muro derecho
  B[7] = function (tgt) {
    G.reseed(7507);
    const o = h.inst(7, 6, 0, 5.5, -PI / 2), xs = [0, 0.8, 1.6, 2.4, 3.2 - 0.018], yT = 0.87, t = 0.018, Fz = 0.6, dec = [];
    xs.forEach((x, i) => lq(o, 'Lateral lacado', x, 0.1, 0, t, yT - 0.1, Fz - 0.02, 0, [(i - 2) * 0.22, 0, 0.4]));
    for (let m = 0; m < 4; m++) {
      const x0 = xs[m] + t, w = xs[m + 1] - x0, dx = (m - 1.5) * 0.2;
      lq(o, 'Piso', x0, 0.1, 0.006, w, t, Fz - 0.03, 0, [dx, -0.05, 0.4]);
      h.P(o, 'Fondo de MDF 5.5 mm', 'laca', x0, 0.1 + t, 0, w, yT - 0.1 - t, 0.0055, 0, [dx, 0, -0.3], { mk: 'mdf55' });
      lq(o, 'Entrepaño', x0, 0.47, 0.01, w, t, Fz - 0.04, 0, [dx, 0, 0.6]);
      for (let i = 0; i < 2; i++) lq(o, 'Puerta lacada', x0 - t / 2 + 0.002 + i * (w + t) / 2, 0.1, Fz - 0.02, (w + t) / 2 - 0.004, yT - 0.1 - 0.004, t, 1, [dx + (i ? 0.05 : -0.05), 0, 1.1]);
      [0.2, 0.42].forEach((z, k) => G.spool(dec, x0 + w / 2 + (k ? 0.12 : -0.12), 0.1 + t + 0.1, z, 0.1, 0.07, [0x2f6fd0, 0xd9412e, 0x3f9b57, 0xf2c230][(m + k) % 4], 'z'));
    }
    lq(o, 'Zócalo negro retranqueado', 0, 0, Fz - 0.08, 3.2, 0.1, t, 0, [0, -0.1, 0.5], { mk: 'mdf15' });
    h.patas(o, xs.flatMap((x) => [[x + 0.05, 0.08], [x + 0.05, Fz - 0.15]]), 0.1, 0, [0, -0.1, 0.4], { mk: 'pataNiv' });
    [0, 1].forEach((i) => tapaDoble(rv, o, 'Tapa de Rovere', i * 1.6, yT, 0, 1.6, Fz, 2, [i ? 0.3 : -0.3, 0.45, 0.4]));
    const pc = []; [0.4, 1.2, 2.0, 2.8].forEach((x) => pc.push({ g: G.cyl(), m: h.cylM(x, yT + 0.031, 0.1, 0.03, 0.004), c: 0x111113 }));
    h.PM(o, 'Pasacables', 'plastico', pc, 2, [0, 0.8, 0.4], { mk: 'pasacable', noShadow: true });
    // marco del nicho: dos costados altos y un dintel con luz
    lq(o, 'Costado del nicho', -t, 0, 0, t, 2.25, Fz + 0.04, 3, [-0.55, 0, 0.3]);
    lq(o, 'Costado del nicho', 3.2, 0, 0, t, 2.25, Fz + 0.04, 3, [0.55, 0, 0.3]);
    lq(o, 'Dintel del nicho', -t, 2.25, 0, 3.2 + 2 * t, 0.12, Fz + 0.04, 4, [0, 0.45, 0.3]);
    [0, 1].forEach((i) => led(o, 'Perfil LED bajo el dintel', 'perfilLed', 0.05 + i * 1.6, 2.24, Fz - 0.12, 1.5, 0.012, 0.016, 4, [0, 0.3, 0.3]));
    h.D(o, dec, 'decor'); h.sombra(o, -t, 0, 3.2 + 2 * t, Fz + 0.04);
    return h.add(7, [o], { th: -1.2, ph: 1.05 }, tgt);
  };

  // 9 · Repisa de filamentos dentro del nicho, con luz hacia las impresoras
  B[9] = function (tgt) {
    G.reseed(9509);
    const o = h.inst(9, 6, 1.75, 5.5, -PI / 2), Fz = 0.25, dec = [];
    const l = []; for (let i = 0; i < 8; i++) l.push({ g: G.cyl(), m: h.cylM(0.2 + i * 0.4, 0.018, 0.09, 0.0055, 0.18, 'z'), c: 0xd0d2d5 });
    h.PM(o, 'Soportes invisibles', 'inox', l, 0, [0, 0, 0.3], { mk: 'soporteInv', noShadow: true });
    [0, 1].forEach((i) => { const dx = i ? 0.22 : -0.22; lq(o, 'Repisa lacada (capa inferior)', i * 1.6, 0, 0, 1.6, 0.018, Fz, 1, [dx, -0.13, 0.62]); lq(o, 'Repisa lacada (capa superior)', i * 1.6, 0.018, 0, 1.6, 0.018, Fz, 1, [dx, 0.13, 0.62]); });
    [0, 1].forEach((i) => led(o, 'Perfil LED bajo la repisa', 'perfilLed', 0.05 + i * 1.6, -0.012, Fz - 0.04, 1.5, 0.012, 0.016, 2, [0, -0.2, 0.4]));
    carretes(dec, 0.08, 3.12, 0.036, 0.13, 12, 3);
    h.D(o, dec, 'decor');
    return h.add(9, [o], { th: -1.1, ph: 1.15, lp: [-1.35, 0] }, tgt);
  };

  // 10 · Cajonera de servicio tras la barra: lacada, frentes con gola de aluminio y tapa de Rovere
  B[10] = function (tgt) {
    G.reseed(10510);
    const o = h.inst(10, 0.6, 0, 5.5, 0), Lx = 3.0, Fz = 0.5, yT = 0.87, t = 0.018, dec = [];
    for (let m = 0; m < 5; m++) {
      const x0 = m * 0.6, dx = (m - 2) * 0.17, rl = [];
      lq(o, 'Lateral lacado', x0, 0.1, 0, t, yT - 0.1, 0.48, 0, [dx - 0.065, 0, 0.4]);
      lq(o, 'Lateral lacado', x0 + 0.6 - t, 0.1, 0, t, yT - 0.1, 0.48, 0, [dx + 0.065, 0, 0.4]);
      lq(o, 'Piso', x0 + t, 0.1, 0.006, 0.6 - 2 * t, t, 0.474, 0, [dx, -0.05, 0.4]);
      h.P(o, 'Fondo de MDF 5.5 mm', 'laca', x0 + t, 0.1, 0, 0.6 - 2 * t, yT - 0.1, 0.0055, 0, [dx, 0, -0.3], { mk: 'mdf55' });
      for (let j = 0; j < 3; j++) {
        const y = 0.103 + j * 0.2555, bx = [];
        G.pushBox(bx, x0 + 0.03, y + 0.04, 0.03, 0.015, 0.17, 0.43, 0xece9e3); G.pushBox(bx, x0 + 0.555, y + 0.04, 0.03, 0.015, 0.17, 0.43, 0xece9e3);
        G.pushBox(bx, x0 + 0.045, y + 0.04, 0.03, 0.51, 0.17, 0.015, 0xece9e3); G.pushBox(bx, x0 + 0.045, y + 0.04, 0.445, 0.51, 0.17, 0.015, 0xece9e3);
        G.pushBox(bx, x0 + 0.031, y + 0.034, 0.03, 0.538, 0.006, 0.43, 0xf2f0eb);
        h.PM(o, 'Caja de cajón', 'decor', bx, 1, [dx, 0, 0.95], { mk: 'mdf15' });
        G.pushBox(rl, x0 + 0.019, y + 0.09, 0.03, 0.012, 0.036, 0.43, 0xc6c8cb); G.pushBox(rl, x0 + 0.569, y + 0.09, 0.03, 0.012, 0.036, 0.43, 0xc6c8cb);
        lq(o, 'Frente lacado', x0 + 0.002, y, 0.48, 0.596, 0.232, t, 2, [dx, 0, 1.4]);
        h.P(o, 'Gola de aluminio', 'alu', x0 + 0.002, y + 0.232, 0.486, 0.596, 0.02, 0.012, 2, [dx, 0.04, 1.5], { mk: 'perfilManija', noShadow: true });
      }
      h.PM(o, 'Rieles de extensión total', 'alu', rl, 1, [dx, 0, 0.4], { mk: 'riel45', noShadow: true, exA: [0, 0, 0.5] });
    }
    lq(o, 'Zócalo negro retranqueado', 0, 0, 0.42, Lx, 0.1, t, 0, [0, -0.1, 0.5], { mk: 'mdf15' });
    h.patas(o, [0.08, 1.2, 1.8, 2.92].flatMap((x) => [[x, 0.08], [x, 0.38]]), 0.1, 0, [0, -0.1, 0.4], { mk: 'pataNiv' });
    [0, 1].forEach((i) => tapaDoble(rv, o, 'Tapa de Rovere', i * 1.5, yT, 0, 1.5, Fz, 3, [i ? 0.3 : -0.3, 0.4, 0.3]));
    G.pushBox(dec, 0.3, yT + 0.03, 0.12, 0.3, 0.1, 0.24, 0xc9a579, 0.1); G.pushBox(dec, 0.35, yT + 0.13, 0.14, 0.22, 0.08, 0.2, 0xd8b88c, -0.15);
    G.pushBox(dec, 2.4, yT + 0.03, 0.15, 0.36, 0.012, 0.26, 0xdedcd7, -0.1);
    h.D(o, dec); h.sombra(o, 0, 0, Lx, Fz);
    return h.add(10, [o], { th: 0.05, ph: 1.05 }, tgt);
  };

  // 11 · Panel ranurado de accesorios, lacado, con repisas de acrílico y ganchos
  B[11] = function (tgt) {
    G.reseed(11511);
    const o = h.inst(11, 0.6, 1.05, 5.5, 0), W = 1.6, H = 1.2, t = 0.018;
    lq(o, 'Tablero lacado', 0, 0, 0, W, H, t, 0, [0, 0, 0.25]);
    h.chazos(o, [0.15, 0.8, 1.45].flatMap((x) => [[x, 0.1, 0.03], [x, H - 0.1, 0.03]]), 0, [0, 0, 0.35]);
    const ys = []; for (let i = 0; i < 8; i++) ys.push(0.06 + i * 0.15);
    ys.forEach((y, i) => lq(o, 'Listón ranurado', 0, y, t, W, 0.1, 0.015, 1, [0, (i - 3.5) * 0.06, 0.5]));
    const sh = [[0.2, 0.36], [0.85, 0.36], [0.2, 0.81], [0.85, 0.81], [0.5, 1.11]];
    sh.forEach((p) => h.P(o, 'Repisa de acrílico', 'acrilico', p[0], p[1], t + 0.015, 0.5, 0.004, 0.13, 2, [0, 0, 0.75], { noShadow: true, order: 3, mk: 'acril3' }));
    const l = [], cs = [0x2f6fd0, 0xf2c230, 0xd9412e, 0x3f9b57, 0xf08a24, 0x232326, 0xf4f2ee, 0x8a4fd0];
    sh.forEach((p, k) => { for (let c = 0; c < 3; c++) G.pushBox(l, p[0] + 0.05 + c * 0.15, p[1] + 0.004, t + 0.04, 0.09, 0.08 + (c % 2) * 0.05, 0.07, cs[(k * 3 + c) % cs.length]); });
    [0.21, 0.66].forEach((y) => { for (let c = 0; c < 6; c++) { const x = 0.15 + c * 0.25; l.push({ g: G.cyl(), m: h.cylM(x, y + 0.05, t + 0.06, 0.004, 0.08, 'z'), c: 0x9a9da1 }); G.spool(l, x, y, t + 0.07, 0.07, 0.05, cs[(c + (y > 0.5 ? 3 : 0)) % cs.length], 'z'); } });
    h.PM(o, 'Ganchos y accesorios', 'decor', l, 2, [0, 0, 1.0], { mk: 'ganchos' });
    return h.add(11, [o], { th: 0.05, ph: 1.2 }, tgt);
  };

  // 12 · Vitrina de nicho: caja lacada con fondo de opal iluminado y frente de acrílico
  B[12] = function (tgt) {
    G.reseed(12512);
    const o = h.inst(12, 6, 1.05, 2.1, -PI / 2), W = 0.4, Fz = 0.15, H = 1.2, t = 0.018;
    lq(o, 'Costado lacado', 0, 0, 0, t, H, Fz, 0, [-0.2, 0, 0.26]); lq(o, 'Costado lacado', W - t, 0, 0, t, H, Fz, 0, [0.2, 0, 0.26]);
    lq(o, 'Piso lacado', t, 0, 0, W - 2 * t, t, Fz, 0, [0, -0.2, 0.26]); lq(o, 'Techo lacado', t, H - t, 0, W - 2 * t, t, Fz, 0, [0, 0.24, 0.26]);
    h.chazos(o, [[0.1, 1.1, 0.03], [0.3, 1.1, 0.03]], 0, [0, 0, 0.2], { exA: [0, 0, 0.3] });
    h.P(o, 'Fondo de acrílico opal', X.opal, t, t, 0.03, W - 2 * t, H - 2 * t, 0.003, 1, [0, 0, -0.25], { noShadow: true, mk: 'opal3' });
    for (let k = 0; k < 2; k++) led(o, 'Tira COB tras el opal', 'cob', t + 0.08 + k * 0.2, t + 0.03, 0.012, 0.008, H - 2 * t - 0.06, 0.003, 1, [0, 0, -0.35]);
    h.P(o, 'Fuente 12 V', 'equipo', 0.14, H, 0.04, 0.187, 0.019, 0.055, 1, [0, 0.4, 0.26], { mk: 'fuente3' });
    [0.3, 0.6, 0.9].forEach((y) => h.P(o, 'Entrepaño de acrílico', 'acrilico', t, y, 0.035, W - 2 * t, 0.004, Fz - 0.04, 2, [0, 0, 0.55], { noShadow: true, order: 3, mk: 'acril3' }));
    h.P(o, 'Frente de acrílico', 'acrilico', 0, 0.002, Fz, W, H - 0.004, 0.003, 2, [0, 0, 0.85], { noShadow: true, order: 4, mk: 'acril3' });
    const dec = [];
    [t, 0.304, 0.604, 0.904].forEach((y, i) => { G.fig(dec, ['torre', 'conejo', 'busto', 'jarron'][i], 0.13, y, 0.09, 0.2, [0x232326, 0xf4f2ee, 0x232326, 0xc9a579][i], 0.3); G.fig(dec, ['gema', 'nudo', 'aro', 'facetado'][i], 0.28, y, 0.09, 0.13, [0xf08a24, 0x232326, 0xf4f2ee, 0x232326][i], 0); });
    h.D(o, dec);
    return h.add(12, [o], { th: -0.9, ph: 1.25 }, tgt);
  };

  // 13 · Nicho de bienvenida: mueble alto lacado con tres nichos de luz junto a la entrada
  B[13] = function (tgt) {
    G.reseed(13513);
    const o = h.inst(13, 6, 0, 1.45, -PI / 2), W = 1.2, Fz = 0.4, H = 2.4, t = 0.018, yZ = 0.1, yC = 0.62, dec = [];
    lq(o, 'Zócalo retranqueado', t, 0, Fz - 0.07, W - 2 * t, yZ, t, 0, [0, -0.1, 0.4]);
    h.patas(o, [[0.12, 0.08], [W - 0.12, 0.08], [0.12, Fz - 0.12], [W - 0.12, Fz - 0.12]], yZ, 0, [0, -0.1, 0.4], { mk: 'pataNiv' });
    lq(o, 'Costado lacado', 0, yZ, 0, t, H - yZ, Fz, 0, [-0.45, 0, 0.4]); lq(o, 'Costado lacado', W - t, yZ, 0, t, H - yZ, Fz, 0, [0.45, 0, 0.4]);
    lq(o, 'Piso', t, yZ, 0.006, W - 2 * t, t, Fz - 0.08, 0, [0, -0.05, 0.5]);
    lq(o, 'Techo', t, H - t, 0, W - 2 * t, t, Fz, 0, [0, 0.3, 0.5]);
    h.chazos(o, [[0.3, 2.2, 0.03], [0.9, 2.2, 0.03]], 0, [0, 0, 0.28], { exA: [0, 0, 0.4] });
    const xm = 0.55;
    lq(o, 'Entrepaño sobre el zócalo', t, yC, 0.006, W - 2 * t, t, Fz - 0.006, 1, [0, 0, 0.7]);
    lq(o, 'División vertical', xm, yC + t, 0.006, t, H - yC - 2 * t, Fz - 0.006, 1, [0, 0, 0.95]);
    lq(o, 'Entrepaño del nicho derecho', xm + t, 1.44, 0.006, W - xm - 2 * t, t, Fz - 0.006, 1, [0.1, 0, 0.8]);
    const niches = [[t, xm, yC + t, H - t], [xm + t, W - t, yC + t, 1.44], [xm + t, W - t, 1.44 + t, H - t]];
    niches.forEach((nc, i) => {
      h.P(o, 'Fondo de acrílico opal', X.opal, nc[0], nc[2], 0.03, nc[1] - nc[0], nc[3] - nc[2], 0.003, 2, [0, 0, -0.35], { noShadow: true, mk: 'opal3' });
      for (let k = 0; k < 2; k++) led(o, 'Tira COB tras el opal', 'cob', nc[0] + (k + 0.5) * (nc[1] - nc[0]) / 2, nc[2] + 0.03, 0.012, 0.008, nc[3] - nc[2] - 0.06, 0.003, 2, [0, 0, -0.45]);
      G.fig(dec, ['torre', 'conejo', 'busto'][i], (nc[0] + nc[1]) / 2, nc[2], Fz / 2 + 0.03, [0.62, 0.36, 0.38][i], [0x232326, 0xf4f2ee, 0xf08a24][i], 0.4);
    });
    h.P(o, 'Fuente 12 V', 'equipo', 0.5, H, 0.1, 0.187, 0.019, 0.055, 2, [0, 0.5, 0.5], { mk: 'fuente8' });
    for (let i = 0; i < 2; i++) lq(o, 'Puerta lacada', t + 0.002 + i * (W - 2 * t) / 2, yZ + t + 0.003, Fz, (W - 2 * t) / 2 - 0.004, yC - yZ - t - 0.006, t, 3, [i ? 0.12 : -0.12, 0, 0.9]);
    h.D(o, dec); h.sombra(o, 0, 0, W, Fz);
    return h.add(13, [o], { th: -0.85 }, tgt);
  };

  // 15 · Mampara de vidrio templado sin marco, con jambas y dintel lacados y puerta a la izquierda
  B[15] = function (tgt) {
    const o = h.inst(15, 3.9, 0, 5.6, 0), z = 0.02, J = 0.12, H = 2.4, t = 0.018;
    const jamb = (x, w, ex) => { lq(o, 'Jamba lacada', x, 0, z, w, H - J, t, 0, ex); lq(o, 'Jamba lacada', x, 0, z + J - t, w, H - J, t, 0, ex); lq(o, 'Jamba lacada', x, 0, z + t, t, H - J, J - 2 * t, 0, ex); lq(o, 'Jamba lacada', x + w - t, 0, z + t, t, H - J, J - 2 * t, 0, ex); };
    jamb(0, 0.06, [-0.35, 0, 0.4]); jamb(1.95, 0.15, [0.35, 0, 0.4]);
    lq(o, 'Dintel lacado', 0, H - J, z, 2.1, J, J, 0, [0, 0.35, 0.4]);
    h.chazos(o, [[0.03, 0.5, z + 0.06], [0.03, 1.9, z + 0.06], [2.02, 0.5, z + 0.06], [2.02, 1.9, z + 0.06]], 0, [0, 0, 0.4]);
    h.P(o, 'Vidrio fijo templado 10 mm', 'vidrio', 0.99, 0, z + J / 2 - 0.005, 0.96, H - J, 0.01, 1, [0.2, 0, 0.9], { noShadow: true, order: 3, mk: 'vidrio10' });
    h.P(o, 'Puerta de vidrio templado 10 mm', 'vidrio', 0.065, 0.01, z + J / 2 - 0.005, 0.915, H - J - 0.02, 0.01, 2, [-0.2, 0, 1.3], { noShadow: true, order: 3, mk: 'vidrio10' });
    const k = []; [0.25, H - J - 0.25].forEach((y) => k.push({ g: new T.BoxGeometry(0.08, 0.1, 0.03), m: G.mat(0.1, y, z + J / 2), c: 0xd9dbde }));
    k.push({ g: G.cyl(), m: h.cylM(0.88, 1.1, z + J / 2 + 0.035, 0.011, 0.42), c: 0xd9dbde }, { g: G.cyl(), m: h.cylM(0.88, 1.1, z + J / 2 - 0.035, 0.011, 0.42), c: 0xd9dbde });
    h.PM(o, 'Bisagras y manija del kit', 'inox', k, 3, [-0.2, 0, 1.6], { mk: 'kitBatiente' });
    h.P(o, 'Franja de acrílico opal', X.opal, 0.07, 1.45, z + J / 2 + 0.006, 1.86, 0.09, 0.002, 4, [0, 0, 1.8], { noShadow: true, order: 4, mk: 'opal3' });
    return h.add(15, [o], { th: 0.1, ph: 1.25 }, tgt);
  };

  // 17 · Escritorio lacado con costados cerrados y tapa de Rovere
  B[17] = function (tgt) {
    const o = h.inst(17, 4.7, 0, 7.0, 0), Lx = 1.2, Fz = 0.6, yT = 0.72, t = 0.018;
    lq(o, 'Costado lacado', 0, 0, 0, t, yT, Fz, 0, [-0.35, 0, 0]); lq(o, 'Costado lacado', Lx - t, 0, 0, t, yT, Fz, 0, [0.35, 0, 0]);
    lq(o, 'Faldón lacado', t, 0.3, 0.02, Lx - 2 * t, yT - 0.3, t, 0, [0, 0, -0.3]);
    h.patas(o, [[0.03, 0.05], [0.03, Fz - 0.05], [Lx - 0.03, 0.05], [Lx - 0.03, Fz - 0.05]], 0.012, 0, [0, -0.1, 0], { mk: 'pataNiv' });
    tapaDoble(rv, o, 'Tapa de Rovere', 0, yT, 0, Lx, Fz, 1, [0, 0.55, 0]);
    h.PM(o, 'Pasacable', 'plastico', [{ g: G.cyl(), m: h.cylM(1.08, yT + 0.031, 0.08, 0.03, 0.004), c: 0x111113 }], 1, [0, 0.72, 0], { mk: 'pasacable', noShadow: true });
    const dec = [];
    G.pushBox(dec, 0.33, yT + 0.03, 0.1, 0.24, 0.012, 0.14, 0x1a1b1e); G.pushBox(dec, 0.44, yT + 0.04, 0.14, 0.03, 0.12, 0.03, 0x1a1b1e);
    G.pushBox(dec, 0.15, yT + 0.14, 0.13, 0.6, 0.34, 0.018, 0x1a1b1e); G.pushBox(dec, 0.165, yT + 0.155, 0.149, 0.57, 0.31, 0.002, 0x4f79b8);
    h.D(o, dec, 'decorMate'); h.sombra(o, 0, 0, Lx, Fz, 0.16);
    return h.add(17, [o], { th: 0.35, ph: 0.6, zone: 'trastienda' }, tgt);
  };

  AL.register('A', A);
  AL.register('B', B);
})();
