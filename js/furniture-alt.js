/* ============================================================================
   MOBILIARIO DE LA VERSIÓN C (modular) — los 12 muebles que se fabrican, modelados
   pieza por pieza según el despiece de versions.js, y las utilidades que usan
   también las versiones A y B (furniture-ab.js). Cada pieza guarda su
   material (mk = clave del precio en versions.js), su paso de armado (step,
   en el orden de seq) y hacia dónde se separa al explosionar (ex).

   Se construyen la primera vez que se elige la versión. Mismo sistema local
   que la versión A: x = largo, y = alto, z = fondo (0 contra el muro).
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D, T = THREE, E = L.engine, G = L.geo, F = L.furn, R = L.room;
  const PI = Math.PI;
  const A = (L.alt = {});
  const NARANJA = 0xf28a0f, ACERO = 0x1b1b1d, ALU = 0xc6c8cb;
  let M = null, h = null;

  /* --------------------------------------------------------- materiales */
  function materials() {
    if (M) return M;
    const base = L.mats;
    const clone = (src, name, f) => { const m = src.clone(); m.name = name; f(m); return m; };
    M = {
      // pino radiata: la misma veta de la melamina Rovere, aclarada y amarillenta
      triplex: clone(base.melRovere, 'triplex', (m) => { m.color.setRGB(1.18, 1.08, 0.86); }),
      pvc: clone(base.melBlanca, 'pvc', (m) => { m.color.set(0xf8f7f4); m.roughness = (m.roughness || 1) * 1.25; }),
      hpl: clone(base.melBlanca, 'hpl', (m) => { m.color.set(0xf3f2ee); }),
      opal: new T.MeshStandardMaterial({ color: 0xfff6ea, roughness: 0.35, emissive: 0xffcf96, emissiveIntensity: 0.95 }),
      perforado: null
    };
    M.opal.name = 'opal'; M.opal.userData.ei = 0.95; E.emissiveMats.push(M.opal);
    // triplex perforado cada pulgada
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#e9d2a6'; g.fillRect(0, 0, 128, 128);
    g.globalAlpha = 0.18; g.fillStyle = '#b48d5a'; for (let i = 0; i < 9; i++) g.fillRect(0, i * 15 + 3, 128, 3); g.globalAlpha = 1;
    g.fillStyle = '#2b2118'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(16 + i * 32, 16 + j * 32, 4.6, 0, 7); g.fill(); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    M.perforado = new T.MeshStandardMaterial({ map: t, roughness: 0.75 }); M.perforado.name = 'triplexPerforado';
    return M;
  }

  /* ------------------------------------------------- perfil de aluminio 30 × 30 */
  const profCache = {};
  function profileShape() {
    const s = 0.015, o = 0.004, d = 0.0065, sh = new T.Shape();
    // contorno con una ranura de 8 mm en el centro de cada cara
    const pts = [];
    const side = (ax, ay, bx, by, nx, ny) => {           // de A a B, con normal hacia afuera n
      const mx = (ax + bx) / 2, my = (ay + by) / 2, ux = (bx - ax) / (2 * s), uy = (by - ay) / (2 * s);
      pts.push([ax, ay], [mx - ux * o, my - uy * o], [mx - ux * o - nx * d, my - uy * o - ny * d], [mx + ux * o - nx * d, my + uy * o - ny * d], [mx + ux * o, my + uy * o]);
    };
    side(-s, -s, s, -s, 0, -1); side(s, -s, s, s, 1, 0); side(s, s, -s, s, 0, 1); side(-s, s, -s, -s, -1, 0);
    pts.forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
    sh.closePath();
    sh.holes.push(new T.Path().absarc(0, 0, 0.0035, 0, PI * 2, false));
    return sh;
  }
  let SHAPE = null;
  function profGeo(len, axis) {
    const k = axis + Math.round(len * 1000);
    if (profCache[k]) return profCache[k];
    SHAPE = SHAPE || profileShape();
    const g = new T.ExtrudeGeometry(SHAPE, { depth: len, bevelEnabled: false, curveSegments: 6 });
    g.translate(0, 0, -len / 2);
    if (axis === 'x') g.rotateY(PI / 2); else if (axis === 'y') g.rotateX(PI / 2);
    g.computeVertexNormals();
    return (profCache[k] = g);
  }
  /* perfil desde la esquina mínima (x, y, z), de largo len en el eje dado */
  function prof(o, name, x, y, z, len, axis, step, ex, opt) {
    const c = [x + 0.015, y + 0.015, z + 0.015];
    c[{ x: 0, y: 1, z: 2 }[axis]] += len / 2 - 0.015;
    return h.P(o, name, L.mats.alu, c[0], c[1], c[2], 0, 0, 0, step, ex, Object.assign({ geo: profGeo(len, axis), mk: 'perfil3030' }, opt));
  }
  /* tubo de acero como caja; mk es la clave del precio */
  const tubo = (o, name, mk, x, y, z, sx, sy, sz, step, ex, opt) => h.P(o, name, 'acero', x, y, z, sx, sy, sz, step, ex, Object.assign({ mk }, opt));
  const tri = (o, name, mk, x, y, z, sx, sy, sz, step, ex, opt) => h.P(o, name, M.triplex, x, y, z, sx, sy, sz, step, ex, Object.assign({ mk }, opt));
  const pvc = (o, name, mk, x, y, z, sx, sy, sz, step, ex, opt) => h.P(o, name, M.pvc, x, y, z, sx, sy, sz, step, ex, Object.assign({ mk }, opt));
  /* tablero de MDF con su laminado blanco encima: dos piezas, para que cada material se resalte solo */
  function mdfHpl(o, name, x, y, z, sx, sz, step, ex, layers) {
    const n = layers || 1;
    for (let i = 0; i < n; i++) h.P(o, name + (n > 1 ? ' (capa ' + (i + 1) + ')' : ''), 'mdf15', x, y + i * 0.015, z, sx, 0.015, sz, step, ex, { mk: 'mdf15' });
    h.P(o, 'Laminado blanco', M.hpl, x, y + n * 0.015, z, sx, 0.0012, sz, step, [ex[0], ex[1] + 0.06, ex[2]], { mk: 'hpl', noShadow: true });
  }
  /* piezas impresas (PETG naranja) unidas en una sola malla */
  const impreso = (o, name, list, step, ex, opt) => list.length ? h.PM(o, name, 'impreso', list, step, ex, Object.assign({ mk: 'petg', noShadow: true }, opt)) : null;
  const boxL = (l, x, y, z, sx, sy, sz, c, ry) => G.pushBox(l, x, y, z, sx, sy, sz, c == null ? NARANJA : c, ry);
  function niveladores(o, pts, y0, step, ex) {
    const l = [];
    pts.forEach((p) => { l.push({ g: G.cyl(), m: h.cylM(p[0], y0 / 2 + 0.004, p[1], 0.005, y0 - 0.006), c: 0xc9cbce }); l.push({ g: G.cyl(), m: h.cylM(p[0], 0.004, p[1], 0.02, 0.008), c: 0x2a2a2c }); });
    return h.PM(o, 'Niveladores', 'inox', l, step, ex, { mk: 'nivelador', noShadow: true, exA: [0, -0.3, 0] });
  }
  function ruedas(o, pts, step, ex) {
    const l = [];
    pts.forEach((p) => {
      l.push({ g: G.cyl(), m: h.cylM(p[0], 0.0325, p[1], 0.0325, 0.026, 'x'), c: 0x141416 });
      G.pushBox(l, p[0] - 0.022, 0.03, p[1] - 0.012, 0.044, 0.05, 0.024, 0x2a2a2c);
      G.pushBox(l, p[0] - 0.035, 0.078, p[1] - 0.035, 0.07, 0.006, 0.07, 0x3a3a3c);
    });
    return h.PM(o, 'Rodachinas con freno', 'plastico', l, step, ex, { mk: 'rodachina', exA: [0, -0.35, 0] });
  }
  function escuadras(o, pts, step, ex) {
    const l = []; pts.forEach((p) => G.pushBox(l, p[0] - 0.012, p[1] - 0.012, p[2] - 0.012, 0.024, 0.024, 0.024, ALU));
    return h.PM(o, 'Escuadras 3030A', 'alu', l, step, ex, { mk: 'escuadra', noShadow: true });
  }
  /* línea de luz (LED) con su material, como pieza */
  const led = (o, name, mk, x, y, z, sx, sy, sz, step, ex) => h.P(o, name, 'led', x, y, z, sx, sy, sz, step, ex, { mk, noShadow: true });
  /* resplandor en el piso bajo una isla */
  function glow(o, w, d, r, x, z) {
    const gl = new T.Mesh(new T.PlaneGeometry(w + 0.9, d + 0.9), E.glowMaterial(E.glowTexture(w, d, 0.45, r), 0xffbe7a, 0.9));
    gl.rotation.x = -PI / 2; gl.position.set(x, 0.006, z); gl.renderOrder = 2; gl.raycast = function () {};
    o.group.add(gl); o.glows.push(gl); E.noReflect.push(gl);
  }
  /* panel vertical entre dos puntos de la planta (local), de alto hgt desde y0 */
  function panelSeg(o, name, mat, mk, a, b, y0, hgt, t, step, ex) {
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ang = Math.atan2(dz, dx);
    const g = G.box(len, hgt, t); g.rotateY(-ang);
    const nx = dz / len, nz = -dx / len;                  // normal hacia afuera (sentido horario en planta)
    return h.P(o, name, mat, (a[0] + b[0]) / 2 + nx * t / 2, y0 + hgt / 2, (a[1] + b[1]) / 2 + nz * t / 2, 0, 0, 0, step, ex, { geo: g, mk });
  }
  /* aro de tubo o perfil siguiendo un contorno */
  function ring(list, pts, y, s, c, close) {
    for (let i = 0; i < pts.length - (close === false ? 1 : 0); i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
      list.push({ g: new T.BoxGeometry(len, s, s), m: G.mat((a[0] + b[0]) / 2, y + s / 2, (a[1] + b[1]) / 2, 0, -Math.atan2(dz, dx), 0), c });
    }
  }
  /* contorno con chaflanes: c = { bl, br, fr, fl } en metros (convención de G.planShape) */
  function chamferPts(Lx, Fz, c, inset) {
    const i = inset || 0, x0 = i, z0 = i, x1 = Lx - i, z1 = Fz - i, k = (v) => Math.max(0, (v || 0) - i * 0.4);
    const p = [];
    const bl = k(c.bl), br = k(c.br), fr = k(c.fr), fl = k(c.fl);
    p.push([x0 + bl, z0]); p.push([x1 - br, z0]); if (br) p.push([x1, z0 + br]);
    p.push([x1, z1 - fr]); if (fr) p.push([x1 - fr, z1]);
    p.push([x0 + fl, z1]); if (fl) p.push([x0, z1 - fl]);
    p.push([x0, z0 + bl]);
    // quita puntos repetidos de esquinas sin chaflán
    return p.filter((q, j) => { const r = p[(j + p.length - 1) % p.length]; return Math.hypot(q[0] - r[0], q[1] - r[1]) > 1e-6; });
  }
  function chamferShape(Lx, Fz, c) {
    const pts = chamferPts(Lx, Fz, c), s = new T.Shape();
    pts.forEach((p, i) => (i ? s.lineTo(p[0], -p[1]) : s.moveTo(p[0], -p[1]))); s.closePath();
    return s;
  }
  /* figuras de exhibición sobre una superficie */
  function figs(dec, defs, y) { defs.forEach((f) => G.fig(dec, f[2], f[0], y, f[1], f[3], f[4], f[5] || 0.2)); }

  /* ============================================================= VERSIÓN C */
  const C = {};
  const s3 = 0.03;

  /* estantería de perfil con fondo de luz (C2 y C13) */
  function estanteriaC(n, X, D, rot, mods, W, Fz, Ls, rails, cabinet, seed, tgt, cfg) {
    G.reseed(seed);
    const o = h.inst(n, X, 0, D, rot), dec = [];
    const mw = W / mods, xm = []; for (let i = 0; i <= mods; i++) xm.push(Math.min(i * mw, W - s3));
    const yTop = 2.40, yBot = 0.05;
    xm.forEach((x, i) => {
      const ex = [(i - mods / 2) * 0.34, 0, 0.5];
      prof(o, 'Paral', x, 0.02, 0, 2.38, 'y', 0, ex); prof(o, 'Paral', x, 0.02, Fz - s3, 2.38, 'y', 0, ex);
      prof(o, 'Travesaño', x, yBot, s3, Fz - 2 * s3, 'z', 0, ex); prof(o, 'Travesaño', x, yTop - s3, s3, Fz - 2 * s3, 'z', 0, ex);
    });
    const esc = [];
    for (let m = 0; m < mods; m++) {
      const x0 = xm[m] + s3, w = xm[m + 1] - x0, dx = (m - (mods - 1) / 2) * 0.3;
      [[yBot, 0], [yBot, Fz - s3], [yTop - s3, 0], [yTop - s3, Fz - s3]].forEach((p, k) => prof(o, 'Larguero', x0, p[0], p[1], w, 'x', 1, [dx, k > 1 ? 0.2 : -0.1, p[1] ? 0.35 : -0.35]));
      rails.forEach((y) => prof(o, 'Larguero bajo entrepaño', x0, y - s3, Fz - s3, w, 'x', 1, [dx, 0, 0.45]));
      [yBot, yTop - s3].concat(rails.map((y) => y - s3)).forEach((y) => { esc.push([x0, y + s3 / 2, s3 / 2 + 0.01], [x0 + w, y + s3 / 2, Fz - 0.025]); });
      // caja de luz: fondo de PVC, tira COB y acrílico opal
      const yL = cabinet ? 0.64 : 0.10, hL = yTop - s3 - yL;
      pvc(o, 'Fondo de PVC 5 mm', 'pvc5', x0, yL, s3, w, hL, 0.005, 3, [dx, 0, -0.35], { exA: [0, 0, -0.45] });
      for (let k = 0; k < 4; k++) led(o, 'Tira COB', 'cob', x0 + (k + 0.5) * w / 4 - 0.004, yL + 0.03, s3 + 0.006, 0.008, hL - 0.06, 0.003, 3, [dx, 0, -0.2]);
      const nP = cabinet ? 2 : 2, ph = hL / nP;
      for (let k = 0; k < nP; k++) h.P(o, 'Acrílico opal', M.opal, x0, yL + k * ph, s3 + 0.03, w, ph - 0.002, 0.003, 3, [dx, 0, 0.2 + k * 0.1], { noShadow: true, mk: 'opal3' });
      if (cabinet) {
        pvc(o, 'Fondo del gabinete', 'pvc5', x0, 0.08, s3, w, 0.54, 0.005, 4, [dx, 0, -0.35]);
        for (let i = 0; i < 2; i++) {
          const dxx = dx + (i ? 0.08 : -0.08), px = x0 + 0.002 + i * w / 2, pw = w / 2 - 0.004;
          pvc(o, 'Puerta de PVC 10 mm', 'pvc10', px, 0.082, Fz, pw, 0.516, 0.01, 4, [dxx, 0, 0.9], { grain: 1 });
          const l = []; boxL(l, px + (i ? 0.02 : pw - 0.05), 0.5, Fz + 0.01, 0.03, 0.06, 0.012); boxL(l, px + (i ? -0.004 : pw - 0.006), 0.15, Fz - 0.006, 0.01, 0.05, 0.016); boxL(l, px + (i ? -0.004 : pw - 0.006), 0.45, Fz - 0.006, 0.01, 0.05, 0.016);
          impreso(o, 'Bisagras y tirador impresos', l, 4, [dxx, 0, 1.0]);
        }
      }
      // ménsulas impresas y entrepaños de MDF con laminado
      const lm = [];
      Ls.forEach((y) => { [x0 + 0.002, x0 + w - 0.032].forEach((x) => { boxL(lm, x, y - 0.03, s3 + 0.035, 0.03, 0.03, 0.03); boxL(lm, x, y - 0.03, Fz - s3 - 0.035 - 0.03, 0.03, 0.03, 0.03); }); });
      impreso(o, 'Ménsulas impresas', lm, cabinet ? 5 : 4, [dx, 0, 0.6]);
      Ls.forEach((y) => mdfHpl(o, 'Entrepaño de MDF', x0, y, s3 + 0.035, w, Fz - 2 * s3 - 0.035, cabinet ? 5 : 4, [dx, 0.04, 0.85]));
      Ls.slice(1).forEach((y, k) => h.fila(dec, x0 + 0.06, x0 + w - 0.06, y + 0.016, Fz / 2 + 0.02, 3 + ((k + m) % 2) - (mods === 1 ? 1 : 0), 0.15, 0.27));
    }
    if (cabinet) xm.forEach((x, i) => pvc(o, 'Costado del gabinete', 'pvc10', x + (i === xm.length - 1 ? -0.01 : s3), 0.08, s3, 0.01, 0.52, Fz - 2 * s3, 4, [(i - mods / 2) * 0.4, 0, 0.3]));
    escuadras(o, esc, 1, [0, 0, 0.3]);
    h.chazos(o, xm.flatMap((x) => [[x + s3 / 2, 0.7, 0.03], [x + s3 / 2, 2.2, 0.03]]), 1, [0, 0, 0.3], { exA: [0, 0, 0.4] });
    niveladores(o, xm.flatMap((x) => [[x + s3 / 2, s3 / 2], [x + s3 / 2, Fz - s3 / 2]]), 0.02, 2, [0, 0, 0.5]);
    const lt = []; xm.forEach((x) => [0, Fz - s3].forEach((z) => boxL(lt, x - 0.001, 2.40, z - 0.001, s3 + 0.002, 0.006, s3 + 0.002)));
    impreso(o, 'Tapas impresas', lt, 1, [0, 0.4, 0]);
    h.P(o, 'Fuente 12 V', 'equipo', 0.5, yTop, 0.08, 0.187, 0.019, 0.055, 3, [0, 0.4, 0.5], { mk: cfg.fuente });
    h.D(o, dec); h.sombra(o, 0, 0, W, Fz);
    return h.add(n, [o], cfg.cfg, tgt);
  }
  C[2] = (tgt) => estanteriaC(2, 0, 1.60, PI / 2, 2, 2.4, 0.40, [0.08, 0.60, 1.04, 1.46, 1.88], [1.04, 1.46, 1.88], true, 2303, tgt, { fuente: 'fuente8', cfg: { th: 0.85 } });
  C[13] = (tgt) => estanteriaC(13, 6, 1.5, -PI / 2, 1, 1.2, 0.35, [0.08, 0.50, 0.92, 1.34, 1.76, 2.18], [0.50, 0.92, 1.34, 1.76], false, 13303, tgt, { fuente: 'fuente12', cfg: { th: -0.85 } });

  /* isla de perfil con esquinas impresas (C3 y C4) */
  function islaC(n, X, D, Lx, Fz, rr, hTop, posts, segs, seed, decDefs, tgt, extra) {
    G.reseed(seed);
    const o = h.inst(n, X, 0, D, 0), yb = 0.10, yTop = hTop - 0.0162;
    const lr = [];
    segs.forEach((sg) => { [yb, yTop - s3].forEach((y) => { const a = sg[0], b = sg[1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ax = Math.abs(dx) > Math.abs(dz) ? 'x' : 'z'; prof(o, 'Aro de perfil', Math.min(a[0], b[0]) - (ax === 'z' ? s3 / 2 : 0), y, Math.min(a[1], b[1]) - (ax === 'x' ? s3 / 2 : 0), len, ax, 0, [0, y > 0.5 ? 0.35 : -0.05, 0]); }); });
    posts.forEach((p) => prof(o, 'Paral', p[0] - s3 / 2, yb + s3, p[1] - s3 / 2, yTop - s3 - yb - s3, 'y', 0, [0, 0.15, 0]));
    void lr;
    escuadras(o, posts.flatMap((p) => [[p[0], yb + s3 + 0.01, p[1]], [p[0], yTop - s3 - 0.01, p[1]]]), 0, [0, 0.15, 0]);
    niveladores(o, posts.map((p) => [p[0], p[1]]), yb, 1, [0, 0, 0]);
    const ll = []; segs.forEach((sg) => { const a = sg[0], b = sg[1]; ll.push({ g: new T.BoxGeometry(Math.max(0.008, Math.abs(b[0] - a[0])), 0.006, Math.max(0.008, Math.abs(b[1] - a[1]))), m: G.mat((a[0] + b[0]) / 2, yb - 0.004, (a[1] + b[1]) / 2), c: 0xffffff }); });
    h.PM(o, 'Tira LED COB', 'led', ll, 1, [0, 0, 0], { mk: 'cob', noShadow: true, exA: [0, -0.3, 0] });
    glow(o, Lx, Fz, Math.max(rr.bl || 0, rr.fl || 0, 0.1), Lx / 2, Fz / 2);
    extra.panels.forEach((pn) => panelSeg(o, 'Paño de PVC espumado', M.pvc, 'pvc10', pn[0], pn[1], yb + 0.02, yTop - yb - 0.02, 0.01, 2, pn[2]));
    // esquinas impresas: cuatro anillos por curva
    const H = yTop - yb - 0.02, ring4 = H / 4;
    extra.corners.forEach((c) => {
      const l = [];
      for (let k = 0; k < 4; k++) l.push({ g: G.arcSkin(c[1], c[2], c[3], 0.006, ring4 - 0.003, c[0]), m: G.mat(0, yb + 0.02 + k * ring4, 0), c: NARANJA });
      impreso(o, 'Esquina impresa', l, 3, [c[4] * 0.6, 0.3, c[5] * 0.6], { noShadow: false });
    });
    const shp = G.planShape(Lx, Fz, rr);
    h.P(o, 'Tapa de MDF', 'mdf15', 0, yTop, 0, 0, 0, 0, 4, [0, 1.2, 0], { geo: G.slab(shp, 0.015), mk: 'mdf15' });
    h.P(o, 'Laminado blanco', M.hpl, 0, yTop + 0.015, 0, 0, 0, 0, 4, [0, 1.3, 0], { geo: G.slab(shp, 0.0012), mk: 'hpl', noShadow: true });
    if (extra.fuente) h.P(o, 'Fuente 12 V', 'equipo', Lx * 0.6, yb + s3, 0.06, 0.187, 0.019, 0.055, 5, [0, 0, -0.4], { mk: 'fuente12' });
    const dec = []; figs(dec, decDefs, hTop); if (extra.tablet) G.pushBox(dec, 1.42, hTop, 0.72, 0.03, 0.2, 0.26, 0x16171a, 0.5);
    h.D(o, dec);
    return h.add(n, [o], extra.cfg, tgt);
  }
  C[3] = (tgt) => islaC(3, 1.5, 1.9, 2.0, 1.1, { bl: 0.25, fl: 0.25, fr: 0.25, br: 0 }, 0.95,
    [[1.985, 0.015], [1.985, 0.85], [1.75, 1.085], [0.25, 1.085], [0.015, 0.85], [0.25, 0.015]],
    [[[0.25, 0.015], [1.985, 0.015]], [[1.985, 0.015], [1.985, 0.85]], [[1.75, 1.085], [0.25, 1.085]], [[0.015, 0.85], [0.015, 0.25]]], 3313,
    [[0.3, 0.75, 'jarron', 0.2, 0xf4f2ee], [0.62, 0.42, 'conejo', 0.34, 0xf7d9c8], [0.95, 0.72, 'conejo', 0.4, 0xf4f2ee], [1.28, 0.36, 'torre', 0.42, 0xf4f2ee], [1.6, 0.74, 'facetado', 0.2, 0xf08a24], [1.78, 0.4, 'gema', 0.16, 0xf4f2ee], [0.3, 0.3, 'nudo', 0.17, 0xf4f2ee]], tgt,
    {
      fuente: true, tablet: true, cfg: { th: 0.55, ph: 1.0 },
      panels: [[[1.75, 1.1], [0.25, 1.1], [0, 0.4, 0.6]], [[0.25, 0], [2.0, 0], [0, 0.4, -0.6]], [[0, 0.85], [0, 0.25], [-0.6, 0.4, 0]], [[2.0, 0], [2.0, 0.85], [0.6, 0.4, 0]]].map((p) => [p[0], p[1], p[2]]),
      corners: [['fl', 0.25, 0.85, 0.25, -1, 1], ['fr', 1.75, 0.85, 0.25, 1, 1], ['bl', 0.25, 0.25, 0.25, -1, -1]]
    });
  C[4] = (tgt) => islaC(4, 2.3, 2.5, 1.2, 0.6, { bl: 0.18, br: 0.18, fl: 0, fr: 0 }, 0.80,
    [[0.015, 0.585], [1.185, 0.585], [0.015, 0.18], [1.185, 0.18]],
    [[[0.18, 0.015], [1.02, 0.015]], [[0.015, 0.18], [0.015, 0.585]], [[1.185, 0.18], [1.185, 0.585]], [[0.015, 0.585], [1.185, 0.585]]], 4414,
    [[0.25, 0.3, 'busto', 0.24, 0xf4f2ee], [0.6, 0.26, 'torre', 0.3, 0x232326], [0.93, 0.32, 'aro', 0.2, 0xf08a24]], tgt,
    {
      cfg: { th: -0.55, ph: 1.0 },
      panels: [[[0.18, 0], [1.02, 0], [0, 0.4, -0.5]], [[0, 0.6], [0, 0.18], [-0.5, 0.4, 0]], [[1.2, 0.18], [1.2, 0.6], [0.5, 0.4, 0]]],
      corners: [['bl', 0.18, 0.18, 0.18, -1, -1], ['br', 1.02, 0.18, 0.18, 1, -1]]
    });

  C[5] = function (tgt) {
    const o = h.inst(5, 1.5, 0, 4.2, 0), yT = 0.99;
    const legs = [[0, 0], [1.8 - s3, 0], [0, 0.7 - s3], [1.8 - s3, 0.7 - s3]];
    legs.forEach((p, i) => prof(o, 'Pata', p[0], 0.02, p[1], yT - 0.02, 'y', 0, [(i % 2 ? 1 : -1) * 0.3, 0, (i > 1 ? 1 : -1) * 0.25]));
    prof(o, 'Marco', s3, yT, 0, 1.8 - 2 * s3, 'x', 0, [0, 0.2, -0.2]); prof(o, 'Marco', s3, yT, 0.7 - s3, 1.8 - 2 * s3, 'x', 0, [0, 0.2, 0.2]);
    prof(o, 'Marco', 0, yT, s3, 0.7 - 2 * s3, 'z', 0, [-0.3, 0.2, 0]); prof(o, 'Marco', 1.8 - s3, yT, s3, 0.7 - 2 * s3, 'z', 0, [0.3, 0.2, 0]);
    escuadras(o, legs.map((p) => [p[0] + s3 / 2, yT - 0.012, p[1] + s3 / 2]), 0, [0, 0.1, 0]);
    prof(o, 'Reposapiés', s3, 0.29, 0, 1.8 - 2 * s3, 'x', 1, [0, 0, -0.35]); prof(o, 'Reposapiés', s3, 0.29, 0.7 - s3, 1.8 - 2 * s3, 'x', 1, [0, 0, 0.35]);
    niveladores(o, legs.map((p) => [p[0] + s3 / 2, p[1] + s3 / 2]), 0.02, 2, [0, 0, 0]);
    mdfHpl(o, 'Tapa de MDF', 0, yT + s3, 0, 1.8, 0.7, 3, [0, 0.55, 0], 2);
    const l = []; boxL(l, 1.8 - s3 - 0.004, 0.3, 0.7 - s3 / 2 - 0.012, 0.004, 0.66, 0.024);
    legs.forEach((p) => boxL(l, p[0] - 0.003, 0.02, p[1] - 0.003, s3 + 0.006, 0.05, s3 + 0.006));
    impreso(o, 'Canaleta y protectores impresos', l, 3, [0, 0.3, 0.3]);
    const dec = []; G.pushBox(dec, 0.5, 1.05, 0.22, 0.3, 0.012, 0.21, 0x1a1b1e, 0.15); G.pushBox(dec, 0.9, 1.05, 0.3, 0.2, 0.008, 0.14, 0xe9e7e2, -0.2);
    h.D(o, dec); h.sombra(o, 0, 0, 1.8, 0.7, 0.16);
    return h.add(5, [o], { th: 0.6, ph: 1.05 }, tgt);
  };

  C[7] = function (tgt) {
    const o = h.inst(7, 0.6, 0, 5.5, 0), xs = [0, 0.8, 1.6, 2.4, 3.2 - s3], yT = 0.84;
    xs.forEach((x, i) => {
      const ex = [(i - 2) * 0.22, 0, 0.5];
      prof(o, 'Paral', x, 0.02, 0, yT - 0.02, 'y', 0, ex); prof(o, 'Paral', x, 0.02, 0.6 - s3, yT - 0.02, 'y', 0, ex);
      prof(o, 'Travesaño', x, 0.08, s3, 0.6 - 2 * s3, 'z', 0, ex); prof(o, 'Travesaño', x, yT - s3, s3, 0.6 - 2 * s3, 'z', 0, ex);
    });
    [[0.08, 0], [0.08, 0.6 - s3], [yT - s3, 0], [yT - s3, 0.6 - s3]].forEach((p, i) => prof(o, 'Larguero', s3, p[0], p[1], 3.2 - 2 * s3, 'x', 1, [0, i > 1 ? 0.2 : -0.1, p[1] ? 0.4 : -0.4]));
    niveladores(o, xs.flatMap((x) => [[x + s3 / 2, s3 / 2], [x + s3 / 2, 0.6 - s3 / 2]]), 0.02, 1, [0, 0, 0.4]);
    escuadras(o, xs.flatMap((x) => [[x + s3 / 2, yT - s3 - 0.012, 0.045], [x + s3 / 2, yT - s3 - 0.012, 0.555], [x + s3 / 2, 0.122, 0.045], [x + s3 / 2, 0.122, 0.555]]), 1, [0, 0, 0.3]);
    const pc = [], hinge = [], dec = [];
    for (let m = 0; m < 4; m++) {
      const x0 = xs[m] + s3, w = xs[m + 1] - x0, dx = (m - 1.5) * 0.2;
      pvc(o, 'Fondo de PVC 5 mm', 'pvc5', x0, 0.11, s3, w, yT - s3 - 0.11, 0.005, 2, [dx, 0, -0.35]);
      mdfHpl(o, 'Entrepaño de MDF', x0, 0.11, s3 + 0.006, w, 0.6 - 2 * s3 - 0.006, 2, [dx, 0.1, 0.8]);
      for (let i = 0; i < 2; i++) {
        const px = x0 + 0.002 + i * w / 2, pw = w / 2 - 0.004, dd = dx + (i ? 0.05 : -0.05);
        pvc(o, 'Puerta de PVC 10 mm', 'pvc10', px, 0.082, 0.6, pw, yT - 0.09, 0.01, 4, [dd, 0, 1.25], { grain: 1 });
        const l = []; boxL(l, px + (i ? 0.02 : pw - 0.05), yT - 0.12, 0.61, 0.03, 0.05, 0.012);
        boxL(l, px + (i ? -0.004 : pw - 0.006), 0.15, 0.594, 0.01, 0.05, 0.016); boxL(l, px + (i ? -0.004 : pw - 0.006), yT - 0.17, 0.594, 0.01, 0.05, 0.016);
        impreso(o, 'Bisagras y tirador impresos', l, 4, [dd, 0, 1.35]);
      }
      boxL(pc, x0 + w / 2 - 0.035, yT + 0.03 - 0.002, 0.065, 0.07, 0.004, 0.07);
      [0.3, 0.6].forEach((z) => G.spool(dec, x0 + w / 2, 0.11 + 0.016 + 0.09, z * 0.9, 0.09, 0.06, [0x2f6fd0, 0xd9412e, 0x3f9b57, 0xf2c230][m], 'x'));
    }
    void hinge;
    [0, 1].forEach((i) => mdfHpl(o, 'Tapa de MDF', i * 1.6, yT, 0, 1.6, 0.6, 3, [i ? 0.3 : -0.3, 0.5, 0.5], 2));
    impreso(o, 'Pasacables impresos', pc, 3, [0, 0.8, 0.5]);
    h.D(o, dec, 'decor'); h.sombra(o, 0, 0, 3.2, 0.6);
    return h.add(7, [o], { th: 0.45, ph: 1.05 }, tgt);
  };

  C[9] = function (tgt) {
    G.reseed(9919);
    const o = h.inst(9, 0.6, 1.6, 5.5, 0);
    [0, 0.25].forEach((y) => prof(o, 'Riel de perfil', 0, y - 0.1, 0, 3.2, 'x', 0, [0, 0, 0.3]));
    h.chazos(o, [0.2, 1.0, 1.8, 2.6].flatMap((x) => [[x, -0.085, 0.02], [x, 0.165, 0.02]]), 0, [0, 0, 0.45], { exA: [0, 0, 0.5] });
    const l = [], dec = [], cs = [0x232326, 0x2f6fd0, 0xf4f2ee, 0xd9412e, 0x232326, 0xf08a24, 0x3f9b57, 0x8a4fd0, 0xf2c230, 0x232326, 0x2aa3a0];
    [0, 0.25].forEach((y, r) => {
      for (let i = 0; i < 11; i++) {
        const x = 0.16 + i * 0.29;
        boxL(l, x - 0.015, y - 0.1 + 0.005, s3, 0.03, 0.02, 0.012);
        l.push({ g: G.cyl(), m: h.cylM(x, y - 0.085, s3 + 0.045, 0.012, 0.075, 'z'), c: NARANJA });
        G.spool(dec, x, y - 0.085, s3 + 0.045, 0.1, 0.066, cs[(i + r * 5) % cs.length], 'z');
        if (r === 0) boxL(l, x - 0.03, y - 0.2, s3 + 0.08, 0.06, 0.02, 0.003, 0xfafafa);
      }
    });
    impreso(o, 'Portacarretes impresos', l, 1, [0, 0, 0.5]);
    h.D(o, dec, 'decor');
    return h.add(9, [o], { th: 0.4, ph: 1.1, lp: [-1.35, 0] }, tgt);
  };

  C[10] = function (tgt) {
    G.reseed(10110);
    const o = h.inst(10, 6, 0, 5.0, -PI / 2), xs = [0, 0.6, 1.2, 1.8, 2.4, 3.0 - s3], yT = 0.86, dec = [];
    const lv = [0.13, 0.376, 0.622];
    xs.forEach((x, i) => {
      const ex = [(i - 2.5) * 0.18, 0, 0.45];
      prof(o, 'Paral', x, 0.02, 0, yT - 0.02, 'y', 0, ex); prof(o, 'Paral', x, 0.02, 0.48 - s3, yT - 0.02, 'y', 0, ex);
      lv.forEach((y) => prof(o, 'Travesaño de deslizador', x, y - s3, s3, 0.48 - 2 * s3, 'z', 0, ex));
    });
    [[0.05, 0], [0.05, 0.48 - s3], [yT - s3, 0], [yT - s3, 0.48 - s3]].forEach((p, i) => prof(o, 'Larguero', s3, p[0], p[1], 3.0 - 2 * s3, 'x', 1, [0, i > 1 ? 0.15 : -0.1, p[1] ? 0.35 : -0.35]));
    niveladores(o, xs.flatMap((x) => [[x + s3 / 2, s3 / 2], [x + s3 / 2, 0.48 - s3 / 2]]), 0.02, 1, [0, 0, 0.3]);
    escuadras(o, xs.flatMap((x) => [[x + s3 / 2, yT - s3 - 0.012, 0.045], [x + s3 / 2, yT - s3 - 0.012, 0.435]]), 1, [0, 0, 0.3]);
    pvc(o, 'Tapa lateral', 'pvc10', -0.01, 0.02, 0, 0.01, yT - 0.02, 0.5, 1, [-0.6, 0, 0.45], { grain: 1 });
    pvc(o, 'Tapa lateral', 'pvc10', 3.0, 0.02, 0, 0.01, yT - 0.02, 0.5, 1, [0.6, 0, 0.45], { grain: 1 });
    for (let m = 0; m < 5; m++) {
      const x0 = xs[m] + s3, w = xs[m + 1] - x0, dx = (m - 2) * 0.17, sl = [];
      lv.forEach((y, j) => {
        boxL(sl, x0 + 0.001, y, s3 + 0.02, 0.012, 0.01, 0.4); boxL(sl, x0 + w - 0.013, y, s3 + 0.02, 0.012, 0.01, 0.4);
        const bx = [], bw = w - 0.03, by = y + 0.012;
        G.pushBox(bx, x0 + 0.015, by, s3 + 0.02, 0.01, 0.18, 0.42, 0xf8f7f4); G.pushBox(bx, x0 + 0.015 + bw - 0.01, by, s3 + 0.02, 0.01, 0.18, 0.42, 0xf8f7f4);
        G.pushBox(bx, x0 + 0.025, by, s3 + 0.02, bw - 0.02, 0.18, 0.01, 0xf8f7f4); G.pushBox(bx, x0 + 0.015, by - 0.005, s3 + 0.02, bw, 0.005, 0.42, 0xf8f7f4);
        h.P(o, 'Bandeja de PVC', M.pvc, 0, 0, 0, 0, 0, 0, 3, [dx, 0, 0.95], { geo: G.merge(bx), mk: 'pvc10' });
        pvc(o, 'Frente de bandeja', 'pvc10', xs[m] + 0.002 + (m ? 0 : s3), by - 0.02, 0.48, w + (m ? s3 : 0) - 0.004 - (m === 4 ? 0 : 0), 0.236, 0.01, 3, [dx, 0, 1.35]);
        const tl = []; boxL(tl, xs[m] + 0.25, by + 0.19, 0.488, 0.1, 0.022, 0.012); impreso(o, 'Tirador impreso', tl, 3, [dx, 0, 1.4]);
        void j;
      });
      impreso(o, 'Deslizadores impresos', sl, 2, [dx, 0, 0.45]);
    }
    [0, 1].forEach((i) => mdfHpl(o, 'Tapa de MDF', i * 1.5, yT, 0, 1.5, 0.5, 4, [i ? 0.3 : -0.3, 0.45, 0.45], 2));
    G.fig(dec, 'jarron', 0.35, 0.9, 0.25, 0.22, 0xf4f2ee, 0); G.fig(dec, 'gema', 0.62, 0.9, 0.3, 0.12, 0xf08a24, 0.4);
    G.pushBox(dec, 1.9, 0.9, 0.12, 0.3, 0.1, 0.24, 0xc9a579, 0.1); G.fig(dec, 'conejo', 1.35, 0.9, 0.26, 0.24, 0xf4f2ee, 0.3);
    h.D(o, dec); h.sombra(o, 0, 0, 3.0, 0.5);
    return h.add(10, [o], { th: -0.95, ph: 1.05 }, tgt);
  };

  C[11] = function (tgt) {
    G.reseed(11111);
    const o = h.inst(11, 6, 1.0, 4.95, -PI / 2);
    pvc(o, 'Fondo de PVC 5 mm', 'pvc5', 0, 0, 0, 2.2, 1.22, 0.005, 0, [0, 0, 0.2]);
    [0.06, 0.33, 0.6, 0.87, 1.14].forEach((y, i) => prof(o, 'Riel de perfil', 0, y, 0.005, 2.2, 'x', 1, [0, (i - 2) * 0.12, 0.45]));
    h.chazos(o, [0.08, 0.33, 0.6, 0.87, 1.14].flatMap((y, i) => [[0.1, [0.075, 0.345, 0.615, 0.885, 1.155][i], 0.02], [2.1, [0.075, 0.345, 0.615, 0.885, 1.155][i], 0.02]]), 1, [0, 0, 0.6]);
    const l = [], dec = [];
    const cs = [0x2f6fd0, 0xf2c230, 0xd9412e, 0x3f9b57, 0xf08a24, 0x232326, 0xf4f2ee, 0x8a4fd0];
    [0.06, 0.33].forEach((y, r) => { for (let c = 0; c < 5; c++) { const x = 0.2 + c * 0.2; boxL(l, x - 0.02, y + 0.03, 0.035, 0.04, 0.03, 0.02); l.push({ g: G.cyl(), m: h.cylM(x, y + 0.14, 0.09, 0.012, 0.07, 'z'), c: NARANJA }); G.spool(dec, x, y + 0.14, 0.09, 0.098, 0.062, cs[(r * 5 + c) % cs.length], 'z'); } });
    [0.6, 0.87, 1.14].forEach((y) => { for (let c = 0; c < 6; c++) { const x = 0.25 + c * 0.32; boxL(l, x - 0.05, y - 0.02, 0.035, 0.1, 0.03, 0.06); boxL(l, x - 0.05, y + 0.01, 0.075, 0.1, 0.05, 0.004); if (c % 2) G.pushBox(dec, x - 0.03, y + 0.01, 0.045, 0.06, 0.06, 0.025, 0x26272a); } });
    impreso(o, 'Portacarretes, soportes y bandejas impresos', l, 2, [0, 0, 1.0]);
    h.D(o, dec, 'decor');
    return h.add(11, [o], { th: -1.0, ph: 1.2 }, tgt);
  };

  C[12] = function (tgt) {
    G.reseed(12112);
    const o = h.inst(12, 6, 1.05, 2.5, -PI / 2), e = 0.012;
    pvc(o, 'Piso de PVC 10 mm', 'pvc10', 0, 0, 0, 0.4, 0.01, 0.15, 0, [0, -0.2, 0.26]);
    h.P(o, 'Fondo de acrílico opal', M.opal, e, 0.01, 0, 0.4 - 2 * e, 1.18, 0.003, 0, [0, 0, 0], { noShadow: true, mk: 'opal3', exA: [0, 0, -0.2] });
    h.P(o, 'Costado de acrílico', 'acrilico', 0, 0.01, e, 0.003, 1.18, 0.15 - 2 * e, 0, [-0.2, 0, 0.26], { noShadow: true, order: 3, mk: 'acril3' });
    h.P(o, 'Costado de acrílico', 'acrilico', 0.397, 0.01, e, 0.003, 1.18, 0.15 - 2 * e, 0, [0.2, 0, 0.26], { noShadow: true, order: 3, mk: 'acril3' });
    const l = []; [[0, 0], [0.4 - e, 0], [0, 0.15 - e], [0.4 - e, 0.15 - e]].forEach((p) => boxL(l, p[0], 0.01, p[1], e, 1.18, e));
    impreso(o, 'Esquineros impresos', l, 0, [0, 0, 0.4]);
    [0.3, 0.6, 0.9].forEach((y) => h.P(o, 'Entrepaño de acrílico', 'acrilico', e, y, 0.006, 0.4 - 2 * e, 0.003, 0.15 - 2 * e, 1, [0, 0, 0.55], { noShadow: true, order: 3, mk: 'acril3' }));
    h.P(o, 'Frente de acrílico', 'acrilico', 0, 0.01, 0.15, 0.4, 1.18, 0.003, 2, [0, 0, 0.85], { noShadow: true, order: 4, mk: 'acril3' });
    pvc(o, 'Techo de PVC 10 mm', 'pvc10', 0, 1.19, 0, 0.4, 0.01, 0.153, 2, [0, 0.24, 0.26]);
    led(o, 'Tira COB en el techo', 'cob', 0.02, 1.186, 0.07, 0.36, 0.004, 0.008, 2, [0, 0.2, 0.26]);
    h.P(o, 'Fuente 12 V', 'equipo', 0.14, 1.2, 0.04, 0.187, 0.019, 0.055, 2, [0, 0.4, 0.26], { mk: 'fuente3' });
    h.chazos(o, [[0.1, 1.1, 0.03], [0.3, 1.1, 0.03]], 3, [0, 0, 0.2], { exA: [0, 0, 0.3] });
    const dec = [];
    [0.01, 0.303, 0.603, 0.903].forEach((y, i) => { G.fig(dec, ['torre', 'conejo', 'busto', 'jarron'][i], 0.13, y, 0.075, 0.2, [0x232326, 0xf4f2ee, 0x232326, 0xf08a24][i], 0.3); G.fig(dec, ['gema', 'nudo', 'aro', 'facetado'][i], 0.28, y, 0.075, 0.13, [0xf4f2ee, 0x232326, 0xf4f2ee, 0x232326][i], 0); });
    h.D(o, dec);
    return h.add(12, [o], { th: -0.9, ph: 1.25 }, tgt);
  };

  C[15] = function (tgt) {
    const o = h.inst(15, 3.9, 0, 5.6, 0), z = 0.035, zd = 0.1;
    const frame = (o2, name, x0, y0, W, H, hs, zz, step, ex) => {
      prof(o2, name, x0, y0, zz, W, 'x', step, ex); prof(o2, name, x0, y0 + H - s3, zz, W, 'x', step, ex);
      prof(o2, name, x0, y0 + s3, zz, H - 2 * s3, 'y', step, ex); prof(o2, name, x0 + W - s3, y0 + s3, zz, H - 2 * s3, 'y', step, ex);
      hs.forEach((y) => prof(o2, name, x0 + s3, y - s3 / 2, zz, W - 2 * s3, 'x', step, ex));
    };
    frame(o, 'Marco del fijo', 0, 0, 1.05, 2.37, [0.8, 1.6], z, 0, [-0.3, 0, 0.4]);
    [[s3, 0.8 - s3 / 2], [0.8 + s3 / 2, 1.6 - s3 / 2], [1.6 + s3 / 2, 2.37 - s3]].forEach((r, i) => h.P(o, 'Paño de acrílico opal', M.opal, s3, r[0], z + 0.0135, 1.05 - 2 * s3, r[1] - r[0], 0.003, 0, [-0.3, 0, 0.8 + i * 0.1], { noShadow: true, mk: 'opal3' }));
    h.chazos(o, [[0.5, 0.01, z + 0.015], [0.5, 2.36, z + 0.015]], 0, [-0.3, 0, 0.4]);
    // riel de granero, del lado de la sala
    const rl = []; G.pushBox(rl, 0.05, 2.40, zd + 0.03, 2.0, 0.04, 0.006, 0x141416); [0.15, 1.0, 1.95].forEach((x) => G.pushBox(rl, x, 2.405, zd - 0.01, 0.03, 0.03, 0.045, 0x141416));
    h.PM(o, 'Riel de granero', 'acero', rl, 1, [0, 0.4, 0.4], { mk: 'kitRiel' });
    const door = 1.06;
    frame(o, 'Marco de la puerta', door, 0.03, 0.9, 2.2, [1.08], zd, 2, [0.2, 0, 1.0]);
    [[0.03 + s3, 1.08 - s3 / 2], [1.08 + s3 / 2, 2.23 - s3]].forEach((r) => h.P(o, 'Paño de acrílico opal', M.opal, door + s3, r[0], zd + 0.0135, 0.9 - 2 * s3, r[1] - r[0], 0.003, 2, [0.2, 0, 1.25], { noShadow: true, mk: 'opal3' }));
    const hg = []; [door + 0.15, door + 0.75].forEach((x) => { G.pushBox(hg, x, 2.2, zd + 0.03, 0.03, 0.24, 0.006, 0x141416); hg.push({ g: G.cyl(), m: h.cylM(x + 0.015, 2.43, zd + 0.045, 0.03, 0.02, 'z'), c: 0x141416 }); });
    h.PM(o, 'Colgadores del riel', 'acero', hg, 2, [0.2, 0.3, 1.0], { mk: 'kitRiel' });
    const l = []; boxL(l, door + 0.04, 0.95, zd + s3, 0.03, 0.3, 0.03); boxL(l, door + 0.4, 0, z + s3, 0.08, 0.02, zd - z);
    impreso(o, 'Tirador y guía de piso impresos', l, 3, [0.2, 0, 1.4]);
    return h.add(15, [o], { th: 0.1, ph: 1.25 }, tgt);
  };

  C[17] = function (tgt) {
    const o = h.inst(17, 0.2, 0, 7.0, 0), yT = 0.705;
    const legs = [[0.03, 0.03], [1.14, 0.03], [0.03, 0.54], [1.14, 0.54]];
    legs.forEach((p, i) => prof(o, 'Pata', p[0], 0.02, p[1], yT - 0.02, 'y', 0, [(i % 2 ? 1 : -1) * 0.25, 0, (i > 1 ? 1 : -1) * 0.2]));
    prof(o, 'Marco', 0.06, yT, 0.03, 1.08, 'x', 0, [0, 0.2, -0.15]); prof(o, 'Marco', 0.06, yT, 0.54, 1.08, 'x', 0, [0, 0.2, 0.15]);
    prof(o, 'Marco', 0.03, yT, 0.06, 0.48, 'z', 0, [-0.25, 0.2, 0]); prof(o, 'Marco', 1.14, yT, 0.06, 0.48, 'z', 0, [0.25, 0.2, 0]);
    niveladores(o, legs.map((p) => [p[0] + s3 / 2, p[1] + s3 / 2]), 0.02, 0, [0, 0, 0]);
    mdfHpl(o, 'Tapa de MDF', 0, yT + s3, 0, 1.2, 0.6, 1, [0, 0.55, 0]);
    const l = []; boxL(l, 0.2, yT - 0.06, 0.06, 0.8, 0.06, 0.08); impreso(o, 'Bandeja de cables impresa', l, 1, [0, -0.2, -0.2]);
    const dec = [];
    G.pushBox(dec, 0.33, 0.75, 0.1, 0.24, 0.012, 0.14, 0x1a1b1e); G.pushBox(dec, 0.44, 0.76, 0.14, 0.03, 0.12, 0.03, 0x1a1b1e);
    G.pushBox(dec, 0.15, 0.86, 0.13, 0.6, 0.34, 0.018, 0x1a1b1e); G.pushBox(dec, 0.165, 0.875, 0.149, 0.57, 0.31, 0.002, 0x4f79b8);
    G.pushBox(dec, 0.26, 0.75, 0.36, 0.38, 0.012, 0.13, 0xdedcd7);
    h.D(o, dec, 'decorMate'); h.sombra(o, 0, 0, 1.2, 0.6, 0.16);
    return h.add(17, [o], { th: 0.35, ph: 0.6, zone: 'trastienda' }, tgt);
  };

  const BUILD = { C };
  /* las versiones A y B (furniture-ab.js) se registran aquí con sus constructores */
  A.register = function (vid, builders) { BUILD[vid] = builders; };
  A.kit = { prof, tubo, tri, pvc, mdfHpl, impreso, boxL, niveladores, ruedas, escuadras, led, glow, panelSeg, ring, chamferPts, chamferShape, figs, mats: () => materials(), h: () => F.h };
  A.built = {};
  /* construye (una vez) los muebles de una versión; devuelve { n: item } */
  A.build = function (vid) {
    if (A.built[vid]) return A.built[vid];
    materials(); h = F.h;
    if (A.prepare) A.prepare();
    const tgt = { _ver: vid };
    Object.keys(BUILD[vid]).forEach((n) => BUILD[vid][n](tgt));
    delete tgt._ver;
    F.finish(tgt);
    Object.values(tgt).forEach((it) => it.insts.forEach((o) => o.group.traverse((m) => {
      if (m.isMesh && m.material && m.material.envMapIntensity !== undefined && m.material.userData.env0 === undefined) m.material.userData.env0 = m.material.envMapIntensity;
    })));
    if (E.setEnvK) E.setEnvK(E.envK);
    if (E.setLed) E.setLed(E.ledLevel);
    E.shadowDirty = true; E.invalidate(3);
    return (A.built[vid] = tgt);
  };
  A.NARANJA = NARANJA;
})();
