/* ============================================================================
   PLANOS TÉCNICOS — láminas A3 de cada mueble, dibujadas desde su geometría 3D.

   El dibujo es vectorial: se sacan las aristas de cada pieza (pliegues, bordes y
   siluetas según la dirección de la vista) y se decide qué tramo se ve y cuál
   queda oculto comparándolo con un mapa de profundidad de la vista, que dibuja la
   tarjeta de video. Las aristas vistas van en línea continua; las ocultas, en
   trazos. El corte recorta las piezas con un plano y raya la sección.

   Láminas:
     conjunto     alzado frontal, vista lateral izquierda, corte A-A, planta e
                  isometría, con cotas generales y de niveles, en escala normalizada
     explosión    isometría explosionada con la marca de cada pieza y su lista
   Proyección ISO E (primer diedro), cotas en milímetros, rótulo en la esquina.
   Sistema local del mueble: x = largo, y = alto, z = fondo (0 contra el muro).
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D, T = THREE;
  const DW = (L.dwg = {});
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  const mmTxt = (m) => String(Math.round(m * 1000));
  const SCALES = [5, 10, 20, 25, 50];

  /* ------------------------------------------------ sólidos del mueble */
  const boxCache = {};
  function sharpBox(p) {
    const k = p.width.toFixed(5) + ',' + p.height.toFixed(5) + ',' + p.depth.toFixed(5);
    return boxCache[k] || (boxCache[k] = new T.BoxGeometry(p.width, p.height, p.depth));
  }
  /* una BoxGeometry que no se giró ni se movió después de crearla (sus aristas redondeadas se dibujan vivas) */
  function isPlainBox(g) {
    if (g.type !== 'BoxGeometry' || !g.parameters) return false;
    if (!g.boundingBox) g.computeBoundingBox();
    const b = g.boundingBox, P = g.parameters, t = 1e-5;
    return Math.abs(b.max.x - b.min.x - P.width) < t && Math.abs(b.max.y - b.min.y - P.height) < t && Math.abs(b.max.z - b.min.z - P.depth) < t &&
      Math.abs(b.max.x + b.min.x) < t && Math.abs(b.max.y + b.min.y) < t && Math.abs(b.max.z + b.min.z) < t;
  }
  const solidCache = {};
  /* lista de piezas del mueble n en la versión v, en el sistema local del mueble */
  function solids(v, n, exploded) {
    const key = v + n + (exploded ? 'x' : '');
    if (solidCache[key]) return solidCache[key];
    const set = L.alt.build(v), it = set && set[n];
    if (!it) return null;
    const o = it.insts[0];
    o.group.updateMatrixWorld(true);
    const inv = new T.Matrix4().copy(o.group.matrixWorld).invert();
    const list = [];
    o.parts.forEach((p, idx) => {
      const u = p.userData;
      let M;
      if (p.parent === o.group) {
        const pos = u.home.clone(); if (exploded) pos.add(u.ex);
        M = new T.Matrix4().compose(pos, p.quaternion, p.scale);
      } else { p.updateMatrixWorld(true); M = inv.clone().multiply(p.matrixWorld); }
      const g = isPlainBox(p.geometry) ? sharpBox(p.geometry.parameters) : p.geometry;
      list.push(Object.assign({ g, rg: p.geometry, M, name: u.name, mk: u.mk, step: u.step, idx }, mesh(g, M)));
    });
    const bb = new T.Box3();
    list.forEach((s) => bb.union(s.bb));
    return (solidCache[key] = { it, o, list, bb });
  }
  /* triángulos en el sistema del mueble, aristas soldadas con las normales de sus caras y componentes conexas */
  function mesh(g, M) {
    const pos = g.attributes.position, idx = g.index;
    const nt = idx ? idx.count / 3 : pos.count / 3;
    const P = new Float32Array(pos.count * 3), v = new T.Vector3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(M); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; }
    // soldar vértices por posición (0.01 mm)
    const weld = new Int32Array(pos.count), map = new Map(), W = [];
    for (let i = 0; i < pos.count; i++) {
      const k = Math.round(P[i * 3] * 1e5) + ',' + Math.round(P[i * 3 + 1] * 1e5) + ',' + Math.round(P[i * 3 + 2] * 1e5);
      let w = map.get(k); if (w === undefined) { w = W.length / 3; map.set(k, w); W.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); }
      weld[i] = w;
    }
    const tri = new Int32Array(nt * 3), FN = new Float32Array(nt * 3);
    const edges = new Map();
    const par = new Int32Array(W.length / 3).map((_, i) => i);
    const find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
    let good = 0;
    for (let t = 0; t < nt; t++) {
      const a = weld[idx ? idx.getX(t * 3) : t * 3], b = weld[idx ? idx.getX(t * 3 + 1) : t * 3 + 1], c = weld[idx ? idx.getX(t * 3 + 2) : t * 3 + 2];
      if (a === b || b === c || a === c) continue;
      const ax = W[a * 3], ay = W[a * 3 + 1], az = W[a * 3 + 2];
      const ux = W[b * 3] - ax, uy = W[b * 3 + 1] - ay, uz = W[b * 3 + 2] - az, wx = W[c * 3] - ax, wy = W[c * 3 + 1] - ay, wz = W[c * 3 + 2] - az;
      let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = Math.hypot(nx, ny, nz);
      if (l < 1e-12) continue;
      nx /= l; ny /= l; nz /= l;
      const ti = good++;
      tri[ti * 3] = a; tri[ti * 3 + 1] = b; tri[ti * 3 + 2] = c; FN[ti * 3] = nx; FN[ti * 3 + 1] = ny; FN[ti * 3 + 2] = nz;
      [[a, b], [b, c], [c, a]].forEach((e) => {
        const lo = Math.min(e[0], e[1]), hi = Math.max(e[0], e[1]), k = lo * 4194304 + hi;
        let r = edges.get(k); if (!r) { r = { a: lo, b: hi, f: [] }; edges.set(k, r); }
        r.f.push(ti);
      });
      const ra = find(a), rb = find(b), rc = find(c); par[rb] = ra; par[find(rc)] = ra;
    }
    // aristas útiles: bordes, no manifold y pliegues de más de 32°; el resto se guarda para las siluetas
    const E = [];
    const COS = Math.cos(32 * Math.PI / 180);
    edges.forEach((r) => {
      let kind = 0, n1 = -1, n2 = -1;
      if (r.f.length !== 2) kind = 1;
      else {
        n1 = r.f[0]; n2 = r.f[1];
        const d = FN[n1 * 3] * FN[n2 * 3] + FN[n1 * 3 + 1] * FN[n2 * 3 + 1] + FN[n1 * 3 + 2] * FN[n2 * 3 + 2];
        if (d < COS) kind = 1; else if (d > 0.99999) kind = -1;       // coplanares: nunca se dibujan
      }
      if (kind >= 0) E.push(r.a, r.b, kind, n1, n2);
    });
    // componentes conexas: cuántas piezas sueltas hay dentro de una malla unida
    const roots = new Map();
    for (let t = 0; t < good; t++) { const r = find(tri[t * 3]); if (!roots.has(r)) roots.set(r, new T.Box3()); }
    for (let t = 0; t < good; t++) { const r = find(tri[t * 3]), bx = roots.get(r); for (let j = 0; j < 3; j++) { const w = tri[t * 3 + j]; bx.expandByPoint(v.set(W[w * 3], W[w * 3 + 1], W[w * 3 + 2])); } }
    const bb = new T.Box3(); roots.forEach((b) => bb.union(b));
    return { W: new Float32Array(W), tri: tri.subarray(0, good * 3), FN: FN.subarray(0, good * 3), E: new Float32Array(E), comps: Array.from(roots.values()), bb };
  }

  /* ------------------------------------------------ vistas */
  const V3 = (x, y, z) => new T.Vector3(x, y, z);
  function basis(f, up) {
    f = f.clone().normalize();
    const u = up.clone().addScaledVector(f, -up.dot(f)).normalize();
    const r = new T.Vector3().crossVectors(f, u).normalize();
    return { f, u, r };
  }
  const VIEW = {
    frontal: () => basis(V3(0, 0, -1), V3(0, 1, 0)),
    planta: () => basis(V3(0, -1, 0), V3(0, 0, -1)),
    lateral: () => basis(V3(1, 0, 0), V3(0, 1, 0)),           // vista desde la izquierda: se dibuja a la derecha del alzado (ISO E)
    iso: () => basis(V3(-1, -0.82, -1), V3(0, 1, 0))
  };

  /* mapa de profundidad de la vista: rasterizado en el procesador (no depende de la tarjeta de video).
     Con corte, se descarta lo que queda del lado del observador y las caras traseras toman la profundidad
     del plano: así la sección tapa lo que hay detrás, como un sólido. */
  function depthMap(S, B, ext, W, H, k, ppm, cut) {
    const D = new Float32Array(W * H).fill(2);
    const sc = k * ppm, dr = ext.d1 - ext.d0;
    const fx = B.f.x, fy = B.f.y, fz = B.f.z, rx = B.r.x, ry = B.r.y, rz = B.r.z, ux = B.u.x, uy = B.u.y, uz = B.u.z;
    const cz = cut ? (cut.c - ext.d0) / dr : 0;
    const raster = (x0, y0, z0, x1, y1, z1, x2, y2, z2, flat) => {
      const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
      if (Math.abs(area) < 1e-9) return;
      const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
      const ia = 1 / area;
      for (let y = minY; y <= maxY; y++) {
        const py = y + 0.5;
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5;
          let w0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) * ia;
          let w1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) * ia;
          const w2 = 1 - w0 - w1;
          if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
          const z = flat != null ? flat : w0 * z0 + w1 * z1 + w2 * z2, i = y * W + x;
          if (z < D[i]) D[i] = z;
        }
      }
    };
    const P = (wx, wy, wz) => [(wx * rx + wy * ry + wz * rz - ext.r0) * sc, (ext.u1 - (wx * ux + wy * uy + wz * uz)) * sc, (wx * fx + wy * fy + wz * fz - ext.d0) / dr];
    S.list.forEach((s) => {
      const Wv = s.W, tri = s.tri, FN = s.FN;
      for (let t = 0; t < tri.length; t += 3) {
        const ti = t / 3, back = FN[ti * 3] * fx + FN[ti * 3 + 1] * fy + FN[ti * 3 + 2] * fz > 0;
        let poly = [0, 1, 2].map((j) => { const w = tri[t + j] * 3; return [Wv[w], Wv[w + 1], Wv[w + 2]]; });
        if (cut) {
          const d = poly.map((p) => p[0] * fx + p[1] * fy + p[2] * fz - cut.c);
          if (d[0] < 0 && d[1] < 0 && d[2] < 0) continue;
          if (d[0] < 0 || d[1] < 0 || d[2] < 0) {
            const out = [];
            for (let j = 0; j < 3; j++) {
              const a = poly[j], b = poly[(j + 1) % 3], da = d[j], db = d[(j + 1) % 3];
              if (da >= 0) out.push(a);
              if ((da >= 0) !== (db >= 0)) { const q = da / (da - db); out.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, a[2] + (b[2] - a[2]) * q]); }
            }
            poly = out;
          }
        }
        const pp = poly.map((p) => P(p[0], p[1], p[2]));
        const flat = cut && back ? cz : null;
        for (let j = 1; j + 1 < pp.length; j++) raster(pp[0][0], pp[0][1], pp[0][2], pp[j][0], pp[j][1], pp[j][2], pp[j + 1][0], pp[j + 1][1], pp[j + 1][2], flat);
      }
    });
    return D;
  }

  /* proyecta las piezas en una vista: aristas vistas y ocultas, y sección si hay corte.
     k = mm de lámina por metro (1000 / escala). Devuelve coordenadas en mm, con origen arriba a la izquierda. */
  function project(S, vname, k, opt) {
    opt = opt || {};
    const B = VIEW[vname]();
    const cut = opt.cut || null;                 // { c } plano dot(p, f) = c; se quita lo que queda del lado del observador
    // extensión de la vista
    const ext = { r0: Infinity, r1: -Infinity, u0: Infinity, u1: -Infinity, d0: Infinity, d1: -Infinity };
    const pv = V3();
    S.list.forEach((s) => {
      const W = s.W;
      for (let i = 0; i < W.length; i += 3) {
        pv.set(W[i], W[i + 1], W[i + 2]);
        if (cut && pv.dot(B.f) < cut.c - 1e-6) continue;
        const r = pv.dot(B.r), u = pv.dot(B.u), d = pv.dot(B.f);
        if (r < ext.r0) ext.r0 = r; if (r > ext.r1) ext.r1 = r; if (u < ext.u0) ext.u0 = u; if (u > ext.u1) ext.u1 = u; if (d < ext.d0) ext.d0 = d; if (d > ext.d1) ext.d1 = d;
      }
    });
    if (cut) ext.d0 = Math.min(ext.d0, cut.c);
    const pad = 0.004;
    ext.r0 -= pad; ext.r1 += pad; ext.u0 -= pad; ext.u1 += pad; ext.d0 -= 0.01; ext.d1 += 0.01;
    const wmm = (ext.r1 - ext.r0) * k, hmm = (ext.u1 - ext.u0) * k;
    let ppm = opt.ppm || 6;                                         // píxeles del mapa por mm de lámina
    const maxPx = 2600;
    if (wmm * ppm > maxPx) ppm = maxPx / wmm; if (hmm * ppm > maxPx) ppm = maxPx / hmm;
    const Wp = Math.max(8, Math.ceil(wmm * ppm)), Hp = Math.max(8, Math.ceil(hmm * ppm));
    const _t0 = performance.now();
    const D = depthMap(S, B, ext, Wp, Hp, k, ppm, cut);
    DW._t = { depth: performance.now() - _t0, Wp, Hp };
    const dr = ext.d1 - ext.d0, eps = (opt.eps || 0.0025) / dr;
    // coordenadas de lámina (mm) y de píxel
    const toX = (r) => (r - ext.r0) * k, toY = (u) => (ext.u1 - u) * k;
    const depthAt = (px, py) => {               // la más lejana del vecindario 3 × 3
      let m = 0;
      const cx = Math.floor(px), cy = Math.floor(py);
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const x = cx + i, y = cy + j;
        if (x < 0 || y < 0 || x >= Wp || y >= Hp) { m = Math.max(m, 2); continue; }
        const z = D[y * Wp + x]; if (z > m) m = z;
      }
      return m;
    };
    const vis = [], hid = [];
    const mask = new Uint8Array(Wp * Hp);
    const runs = [];                                                // [x0,y0,x1,y1,visible]
    const a3 = V3(), b3 = V3();
    S.list.forEach((s) => {
      const W = s.W, E = s.E, FN = s.FN;
      for (let e = 0; e < E.length; e += 5) {
        let draw = E[e + 2] === 1;
        if (!draw) {                                               // silueta: una cara mira al observador y la otra no
          const n1 = E[e + 3], n2 = E[e + 4];
          const d1 = FN[n1 * 3] * B.f.x + FN[n1 * 3 + 1] * B.f.y + FN[n1 * 3 + 2] * B.f.z;
          const d2 = FN[n2 * 3] * B.f.x + FN[n2 * 3 + 1] * B.f.y + FN[n2 * 3 + 2] * B.f.z;
          draw = (d1 < -1e-5) !== (d2 < -1e-5);
        }
        if (!draw) continue;
        const ia = E[e] * 3, ib = E[e + 1] * 3;
        a3.set(W[ia], W[ia + 1], W[ia + 2]); b3.set(W[ib], W[ib + 1], W[ib + 2]);
        // recorte por el plano de corte
        let ta = 0, tb = 1;
        if (cut) {
          const da = a3.dot(B.f) - cut.c, db = b3.dot(B.f) - cut.c;
          if (da < -1e-6 && db < -1e-6) continue;
          if (da < 0 && db >= 0) ta = da / (da - db); else if (db < 0 && da >= 0) tb = da / (da - db);
        }
        const ar = a3.dot(B.r), au = a3.dot(B.u), ad = a3.dot(B.f), br = b3.dot(B.r), bu = b3.dot(B.u), bd = b3.dot(B.f);
        const x0 = toX(ar + (br - ar) * ta), y0 = toY(au + (bu - au) * ta), x1 = toX(ar + (br - ar) * tb), y1 = toY(au + (bu - au) * tb);
        const z0 = (ad + (bd - ad) * ta - ext.d0) / dr, z1 = (ad + (bd - ad) * tb - ext.d0) / dr;
        const len = Math.hypot(x1 - x0, y1 - y0) * ppm;
        if (len < 0.3) continue;
        const nS = Math.max(2, Math.ceil(len / 0.7));
        let cur = -1, sx = 0, sy = 0;
        for (let i = 0; i <= nS; i++) {
          const t = i / nS, X = x0 + (x1 - x0) * t, Y = y0 + (y1 - y0) * t, Z = z0 + (z1 - z0) * t;
          const px = X * ppm, py = Y * ppm;
          const v = Z <= depthAt(px, py) + eps ? 1 : 0;
          if (v) { const cx = Math.round(px), cy = Math.round(py); for (let j = -1; j <= 1; j++) for (let q = -1; q <= 1; q++) { const xx = cx + q, yy = cy + j; if (xx >= 0 && yy >= 0 && xx < Wp && yy < Hp) mask[yy * Wp + xx] = 1; } }
          if (v !== cur) { if (cur >= 0) runs.push([sx, sy, X, Y, cur]); cur = v; sx = X; sy = Y; }
        }
        runs.push([sx, sy, x1, y1, cur]);
      }
    });
    DW._t.edges = performance.now() - _t0;
    // las ocultas que caen sobre una arista vista no se dibujan
    runs.forEach((r) => {
      if (Math.hypot(r[2] - r[0], r[3] - r[1]) < 0.05) return;
      if (r[4]) { vis.push(r); return; }
      if (opt.hidden === false) return;
      const len = Math.hypot(r[2] - r[0], r[3] - r[1]) * ppm, n = Math.max(1, Math.ceil(len / 0.8));
      let cur = -1, sx = 0, sy = 0;
      for (let i = 0; i <= n; i++) {
        const t = i / n, X = r[0] + (r[2] - r[0]) * t, Y = r[1] + (r[3] - r[1]) * t;
        const px = Math.round(X * ppm), py = Math.round(Y * ppm);
        const free = px < 0 || py < 0 || px >= Wp || py >= Hp || !mask[py * Wp + px] ? 1 : 0;
        if (free !== cur) { if (cur === 1) hid.push([sx, sy, X, Y]); cur = free; sx = X; sy = Y; }
      }
      if (cur === 1) hid.push([sx, sy, r[2], r[3]]);
    });
    // sección
    const sec = [];
    if (cut) {
      S.list.forEach((s, si) => {
        const W = s.W, tri = s.tri, segs = [];
        const c = cut.c + 1e-6;
        for (let t = 0; t < tri.length; t += 3) {
          const P = [0, 1, 2].map((j) => { const w = tri[t + j] * 3; return [W[w], W[w + 1], W[w + 2]]; });
          const d = P.map((p) => p[0] * B.f.x + p[1] * B.f.y + p[2] * B.f.z - c);
          const pts = [];
          for (let j = 0; j < 3; j++) {
            const a = j, b = (j + 1) % 3;
            if ((d[a] < 0) !== (d[b] < 0)) {
              const tt = d[a] / (d[a] - d[b]);
              const x = P[a][0] + (P[b][0] - P[a][0]) * tt, y = P[a][1] + (P[b][1] - P[a][1]) * tt, z = P[a][2] + (P[b][2] - P[a][2]) * tt;
              pts.push([toX(x * B.r.x + y * B.r.y + z * B.r.z), toY(x * B.u.x + y * B.u.y + z * B.u.z)]);
            }
          }
          if (pts.length === 2) segs.push(pts);
        }
        if (!segs.length) return;
        // encadenar los segmentos en contornos cerrados
        const key = (p) => Math.round(p[0] * 200) + ',' + Math.round(p[1] * 200);
        const adj = new Map();
        segs.forEach((sg, i) => { [0, 1].forEach((e) => { const k2 = key(sg[e]); if (!adj.has(k2)) adj.set(k2, []); adj.get(k2).push(i * 2 + e); }); });
        const used = new Uint8Array(segs.length), loops = [];
        for (let i = 0; i < segs.length; i++) {
          if (used[i]) continue;
          used[i] = 1;
          const loop = [segs[i][0], segs[i][1]];
          let end = segs[i][1], guard = 0;
          while (guard++ < 20000) {
            const cand = adj.get(key(end)) || [];
            let nxt = -1;
            for (const c2 of cand) { const si2 = c2 >> 1; if (!used[si2]) { nxt = c2; break; } }
            if (nxt < 0) break;
            const si2 = nxt >> 1, e2 = nxt & 1; used[si2] = 1;
            end = segs[si2][1 - e2]; loop.push(end);
          }
          if (loop.length > 3) loops.push(loop);
        }
        if (loops.length) sec.push({ si, mk: s.mk, d: loops.map((lp) => 'M' + lp.map((p) => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L') + 'Z').join('') });
      });
    }
    return { vis, hid, sec, w: (ext.r1 - ext.r0) * k, h: (ext.u1 - ext.u0) * k, ext, B, k, toX, toY };
  }

  /* une segmentos colineales contiguos y quita repetidos; devuelve el atributo d de un path */
  function pathOf(segs, ox, oy) {
    const seen = new Set(), out = [];
    segs.forEach((s) => {
      let a = [s[0] + ox, s[1] + oy], b = [s[2] + ox, s[3] + oy];
      if (a[0] > b[0] || (a[0] === b[0] && a[1] > b[1])) { const t = a; a = b; b = t; }
      const k = a[0].toFixed(1) + ',' + a[1].toFixed(1) + ',' + b[0].toFixed(1) + ',' + b[1].toFixed(1);
      if (seen.has(k)) return; seen.add(k); out.push([a, b]);
    });
    // encadenar colineales: ordenar por recta
    const groups = new Map();
    out.forEach((sg) => {
      const dx = sg[1][0] - sg[0][0], dy = sg[1][1] - sg[0][1], l = Math.hypot(dx, dy); if (l < 1e-6) return;
      const ux = dx / l, uy = dy / l, ang = Math.round(Math.atan2(uy, ux) * 2000), off = Math.round((sg[0][0] * -uy + sg[0][1] * ux) * 40);
      const k = ang + '|' + off; if (!groups.has(k)) groups.set(k, { ux, uy, s: [] });
      const g = groups.get(k); g.s.push([sg[0][0] * g.ux + sg[0][1] * g.uy, sg[1][0] * g.ux + sg[1][1] * g.uy, sg]);
    });
    let d = '';
    groups.forEach((g) => {
      g.s.sort((p, q) => p[0] - q[0]);
      let cur = null;
      const flush = () => { if (cur) d += 'M' + cur.a[0].toFixed(2) + ' ' + cur.a[1].toFixed(2) + 'L' + cur.b[0].toFixed(2) + ' ' + cur.b[1].toFixed(2); };
      g.s.forEach((p) => {
        if (cur && p[0] <= cur.t1 + 0.12) { if (p[1] > cur.t1) { cur.t1 = p[1]; cur.b = p[2][1]; } }
        else { flush(); cur = { t1: p[1], a: p[2][0], b: p[2][1] }; }
      });
      flush();
    });
    return d;
  }

  /* ------------------------------------------------ cotas */
  const ARW = 2.2;
  function arrow(x, y, ux, uy) { return '<path class="d-arw" d="M' + x.toFixed(2) + ' ' + y.toFixed(2) + 'L' + (x - ux * ARW - uy * 0.7).toFixed(2) + ' ' + (y - uy * ARW + ux * 0.7).toFixed(2) + 'L' + (x - ux * ARW + uy * 0.7).toFixed(2) + ' ' + (y - uy * ARW - ux * 0.7).toFixed(2) + 'Z"/>'; }
  /* cota horizontal entre x0 y x1 a la altura y (las líneas de referencia bajan o suben hasta yr) */
  function dimH(x0, x1, y, yr, label) {
    if (Math.abs(x1 - x0) < 0.5) return '';
    const s = Math.sign(y - yr) || 1, small = Math.abs(x1 - x0) < 9;
    let o = '<g class="dim">';
    o += '<line class="d-ext" x1="' + x0.toFixed(2) + '" y1="' + (yr + s * 1).toFixed(2) + '" x2="' + x0.toFixed(2) + '" y2="' + (y + s * 1.5).toFixed(2) + '"/>';
    o += '<line class="d-ext" x1="' + x1.toFixed(2) + '" y1="' + (yr + s * 1).toFixed(2) + '" x2="' + x1.toFixed(2) + '" y2="' + (y + s * 1.5).toFixed(2) + '"/>';
    o += '<line class="d-line" x1="' + (small ? x0 - 4 : x0).toFixed(2) + '" y1="' + y.toFixed(2) + '" x2="' + (small ? x1 + 4 : x1).toFixed(2) + '" y2="' + y.toFixed(2) + '"/>';
    o += small ? arrow(x0, y, 1, 0) + arrow(x1, y, -1, 0) : arrow(x0, y, -1, 0) + arrow(x1, y, 1, 0);
    const tx = small && Math.abs(x1 - x0) < 6 ? x1 + 6 : (x0 + x1) / 2;
    o += '<text class="d-txt' + (small && Math.abs(x1 - x0) < 6 ? ' l' : '') + '" x="' + tx.toFixed(2) + '" y="' + (y - 0.9).toFixed(2) + '">' + esc(label) + '</text></g>';
    return o;
  }
  function dimV(y0, y1, x, xr, label) {
    if (Math.abs(y1 - y0) < 0.5) return '';
    const s = Math.sign(x - xr) || 1, small = Math.abs(y1 - y0) < 9;
    let o = '<g class="dim">';
    o += '<line class="d-ext" x1="' + (xr + s * 1).toFixed(2) + '" y1="' + y0.toFixed(2) + '" x2="' + (x + s * 1.5).toFixed(2) + '" y2="' + y0.toFixed(2) + '"/>';
    o += '<line class="d-ext" x1="' + (xr + s * 1).toFixed(2) + '" y1="' + y1.toFixed(2) + '" x2="' + (x + s * 1.5).toFixed(2) + '" y2="' + y1.toFixed(2) + '"/>';
    o += '<line class="d-line" x1="' + x.toFixed(2) + '" y1="' + (small ? y0 - 4 : y0).toFixed(2) + '" x2="' + x.toFixed(2) + '" y2="' + (small ? y1 + 4 : y1).toFixed(2) + '"/>';
    o += small ? arrow(x, y0, 0, 1) + arrow(x, y1, 0, -1) : arrow(x, y0, 0, -1) + arrow(x, y1, 0, 1);
    const tiny = Math.abs(y1 - y0) < 6, ty = tiny ? Math.max(y0, y1) + 5.5 + label.length * 0.7 : (y0 + y1) / 2;
    o += '<text class="d-txt" transform="translate(' + (x - 0.9).toFixed(2) + ' ' + ty.toFixed(2) + ') rotate(-90)">' + esc(label) + '</text></g>';
    return o;
  }
  /* niveles: valores en metros que se acercan menos de gap se funden */
  function levels(vals, lo, hi, gap) {
    const v = vals.filter((x) => x > lo + gap && x < hi - gap).sort((a, b) => a - b);
    const out = [lo];
    v.forEach((x) => { if (x - out[out.length - 1] >= gap) out.push(x); });
    if (hi - out[out.length - 1] < gap) out.pop();
    out.push(hi);
    return out;
  }

  /* ------------------------------------------------ dibujo de una vista */
  function viewSVG(P, ox, oy, opt) {
    opt = opt || {};
    let s = '<g class="view">';
    if (P.sec.length) s += P.sec.map((q, i) => '<path class="sec ' + (i % 2 ? 'h2' : 'h1') + '" fill-rule="evenodd" d="' + q.d.replace(/([ML])([\d.-]+) ([\d.-]+)/g, (m, c, x, y) => c + (+x + ox).toFixed(2) + ' ' + (+y + oy).toFixed(2)) + '"/>').join('');
    if (P.hid.length) s += '<path class="hid" d="' + pathOf(P.hid, ox, oy) + '"/>';
    s += '<path class="vis' + (opt.thin ? ' thin' : '') + '" d="' + pathOf(P.vis, ox, oy) + '"/>';
    if (P.sec.length) s += '<path class="sec-o" d="' + P.sec.map((q) => q.d.replace(/([ML])([\d.-]+) ([\d.-]+)/g, (m, c, x, y) => c + (+x + ox).toFixed(2) + ' ' + (+y + oy).toFixed(2))).join('') + '"/>';
    return s + '</g>';
  }
  function label(x, y, t, sub) {
    return '<text class="v-lab" x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '">' + esc(t) + '</text>' + (sub ? '<text class="v-sub" x="' + x.toFixed(2) + '" y="' + (y + 3.6).toFixed(2) + '">' + esc(sub) + '</text>' : '');
  }

  /* ------------------------------------------------ rótulo */
  function rotulo(info) {
    const x = 250, y = 239, w = 150, hh = 38;
    const cell = (cx, cy, cw, ch, lab, val, cls) => '<rect class="cell" x="' + cx + '" y="' + cy + '" width="' + cw + '" height="' + ch + '"/><text class="c-lab" x="' + (cx + 1.6) + '" y="' + (cy + 3) + '">' + esc(lab) + '</text><text class="c-val ' + (cls || '') + '" x="' + (cx + 1.6) + '" y="' + (cy + ch - 1.9) + '">' + esc(val) + '</text>';
    let s = '<g class="block">';
    s += cell(x, y, w, 9, 'PROYECTO', 'BlackForge · Local de exhibición y taller de impresión 3D');
    s += cell(x, y + 9, w * 0.7, 10, 'MUEBLE', info.mueble, 'big') + cell(x + w * 0.7, y + 9, w * 0.3, 10, 'LÁMINA', info.lamina, 'big');
    s += cell(x, y + 19, w * 0.7, 9.5, 'CONTENIDO', info.contenido) + cell(x + w * 0.7, y + 19, w * 0.3, 9.5, 'ESCALA', info.escala);
    s += cell(x, y + 28.5, w * 0.34, 9.5, 'VERSIÓN', info.version) + cell(x + w * 0.34, y + 28.5, w * 0.18, 9.5, 'UNIDADES', 'mm') + cell(x + w * 0.52, y + 28.5, w * 0.18, 9.5, 'FECHA', info.fecha) + cell(x + w * 0.7, y + 28.5, w * 0.3, 9.5, 'PROYECCIÓN', 'ISO E');
    // símbolo del primer diedro
    const px = x + w * 0.7 + 30, py = y + 33.2;
    s += '<g class="proj"><path d="M' + (px - 7) + ' ' + (py - 2) + 'L' + (px - 2) + ' ' + (py - 3.2) + 'L' + (px - 2) + ' ' + (py + 3.2) + 'L' + (px - 7) + ' ' + (py + 2) + 'Z"/><circle cx="' + (px + 3) + '" cy="' + py + '" r="3.2"/><circle cx="' + (px + 3) + '" cy="' + py + '" r="1.4"/></g>';
    s += '<text class="c-note" x="' + x + '" y="' + (y + hh + 4.4) + '">Diseño VIII · Producción · UPTC Duitama · ' + esc(info.nota || 'Dibujo generado desde el modelo 3D; las cotas mandan sobre la medida a escala.') + '</text>';
    return s + '</g>';
  }
  function sheetOpen(aria) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="420mm" height="297mm" class="dwg" role="img" aria-label="' + esc(aria) + '"><style>' + DW.css + '</style>' +
      '<defs><pattern id="hA" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="1.6" class="hl"/></pattern><pattern id="hB" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="1.6" class="hl"/></pattern></defs>' +
      '<rect class="paper" x="0" y="0" width="420" height="297"/><rect class="frame" x="10" y="10" width="400" height="277"/>';
  }

  /* ------------------------------------------------ datos del mueble */
  function info(v, n) {
    const V = L.versions, it = V.items[v] && V.items[v][n], base = L.data.items.find((d) => d.n === n), vi = V.list.find((x) => x.id === v);
    return { name: (it && it.name) || base.name, short: (it && it.short) || base.short, vi, dims: (it && it.dims) || base.dims };
  }
  const nn = (n) => (n < 10 ? '0' : '') + n;

  /* ------------------------------------------------ lámina de conjunto */
  DW.conjunto = function (v, n, opt) {
    opt = opt || {};
    const S = solids(v, n);
    if (!S) return '';
    const I = info(v, n), bb = S.bb;
    const Lx = bb.max.x - bb.min.x, Hy = bb.max.y - bb.min.y, Dz = bb.max.z - bb.min.z;
    // escala: la mayor que cabe
    let den = 50;
    for (const d of SCALES) {
      const k = 1000 / d;
      const wNeed = 34 + Lx * k + 26 + Dz * k + 26 + Dz * k + 18, hNeed = 48 + Hy * k + 26 + Dz * k + 30;
      if (wNeed <= 384 && hNeed <= 272) { den = d; break; }
    }
    const k = 1000 / den;
    // corte A-A: plano vertical a lo largo de x, donde atraviesa menos caras
    const xs = [];
    S.list.forEach((s) => { xs.push(s.bb.min.x, s.bb.max.x); });
    let xc = bb.min.x + Lx * 0.3, best = Infinity;
    for (let i = 1; i < 40; i++) {
      const x = bb.min.x + Lx * (0.18 + 0.64 * i / 40);
      const near = xs.reduce((a, q) => a + (Math.abs(q - x) < 0.012 ? 1 : 0), 0) * 10 + Math.abs(x - (bb.min.x + Lx * 0.42)) * 3;
      if (near < best) { best = near; xc = x; }
    }
    const H = opt.hidden !== false;
    const PF = project(S, 'frontal', k, { hidden: H }), PL = project(S, 'lateral', k, { hidden: H }), PS = project(S, 'lateral', k, { cut: { c: xc }, hidden: false }), PP = project(S, 'planta', k, { hidden: H });
    // ubicación: alzado arriba a la izquierda; lateral y corte a su derecha; planta debajo (ISO E)
    const x0 = 36, y0 = 48, g = 26;
    const fx = x0, fy = y0, lx = fx + PF.w + g, sx = lx + PL.w + g, py = fy + PF.h + g;
    let s = sheetOpen('Plano de conjunto, mueble ' + n + ', versión ' + v);
    s += '<text class="title" x="20" y="22">' + esc(n + ' · ' + I.name) + '</text>';
    s += '<text class="subtitle" x="20" y="28">Plano de conjunto · versión ' + v + ' · ' + esc(I.vi.nombre) + ' · ' + esc(I.dims) + '</text>';
    s += viewSVG(PF, fx, fy) + viewSVG(PL, lx, fy) + viewSVG(PS, sx, fy) + viewSVG(PP, fx, py);
    // línea de corte A-A en el alzado
    const cX = fx + PF.toX(xc);
    s += '<g class="cutl"><line x1="' + cX.toFixed(2) + '" y1="' + (fy - 5) + '" x2="' + cX.toFixed(2) + '" y2="' + (fy + PF.h + 5) + '"/>' +
      '<path class="cut-arw" d="M' + cX.toFixed(2) + ' ' + (fy - 5) + 'h4.5M' + cX.toFixed(2) + ' ' + (fy + PF.h + 5) + 'h4.5"/>' + arrow(cX + 5.8, fy - 5, 1, 0) + arrow(cX + 5.8, fy + PF.h + 5, 1, 0) +
      '<text class="cut-t" x="' + (cX - 1.8).toFixed(2) + '" y="' + (fy - 6.5) + '">A</text><text class="cut-t" x="' + (cX - 1.8).toFixed(2) + '" y="' + (fy + PF.h + 9.6) + '">A</text></g>';
    // cotas del alzado: largo arriba, alto a la izquierda, niveles de las piezas horizontales y ejes de las verticales
    const X = (m) => fx + PF.toX(m), Yf = (m) => fy + PF.toY(m);
    const hor = [], ver = [];
    S.list.forEach((q) => {
      const b = q.bb, sxq = b.max.x - b.min.x, syq = b.max.y - b.min.y;
      if (syq < 0.045 && sxq > Lx * 0.25) hor.push(b.max.y);
      if (sxq < 0.045 && syq > Hy * 0.25) ver.push(b.min.x, b.max.x);
    });
    const lvY = levels(hor, bb.min.y, bb.max.y, 0.03), lvX = levels(ver, bb.min.x, bb.max.x, 0.06);
    s += dimH(X(bb.min.x), X(bb.max.x), fy - 13, fy, mmTxt(Lx));
    if (lvX.length > 2 && lvX.length < 11) for (let i = 0; i < lvX.length - 1; i++) s += dimH(X(lvX[i]), X(lvX[i + 1]), fy - 6.5, fy, mmTxt(lvX[i + 1] - lvX[i]));
    s += dimV(Yf(bb.max.y), Yf(bb.min.y), fx - 14, fx, mmTxt(Hy));
    if (lvY.length > 2 && lvY.length < 14) for (let i = 0; i < lvY.length - 1; i++) s += dimV(Yf(lvY[i + 1]), Yf(lvY[i]), fx - 7, fx, mmTxt(lvY[i + 1] - lvY[i]));
    // lateral: fondo arriba; corte: fondo arriba y alto a la derecha
    const XL = (m) => lx + PL.toX(m * PL.B.r.x + 0), dz0 = PL.toX(bb.min.z), dz1 = PL.toX(bb.max.z);
    void XL;
    s += dimH(lx + Math.min(dz0, dz1), lx + Math.max(dz0, dz1), fy - 6.5, fy, mmTxt(Dz));
    const sz0 = PS.toX(bb.min.z), sz1 = PS.toX(bb.max.z);
    s += dimH(sx + Math.min(sz0, sz1), sx + Math.max(sz0, sz1), fy - 6.5, fy, mmTxt(Dz));
    s += dimV(fy + PS.toY(bb.max.y), fy + PS.toY(bb.min.y), sx + PS.w + 7, sx + PS.w, mmTxt(Hy));
    // planta: largo abajo, fondo a la izquierda
    s += dimH(fx + PP.toX(bb.min.x), fx + PP.toX(bb.max.x), py + PP.h + 7, py + PP.h, mmTxt(Lx));
    s += dimV(py + PP.toY(-bb.min.z), py + PP.toY(-bb.max.z), fx - 7, fx, mmTxt(Dz));
    // rótulos de vista
    s += label(fx, fy + PF.h + 8.5, 'ALZADO FRONTAL', 'Escala 1:' + den);
    s += label(lx, fy + PL.h + 8.5, 'VISTA LATERAL', 'Desde la izquierda');
    s += label(sx, fy + PS.h + 8.5, 'CORTE A–A', 'Sección rayada');
    s += label(fx, py + PP.h + 15, 'PLANTA', 'Vista superior');
    // isometría en el mayor de los dos huecos: a la derecha del corte o a la derecha de la planta
    const pre = project(S, 'iso', 1, { hidden: false, ppm: 2 });
    const zones = [[sx + PS.w + 16, 36, 404 - (sx + PS.w + 16), 228 - 36], [fx + PP.w + g, py - 4, 404 - (fx + PP.w + g), 230 - (py - 4)]]
      .filter((z) => z[2] > 40 && z[3] > 40).map((z) => ({ z, k: Math.min(z[2] / pre.w, z[3] / pre.h) }));
    zones.sort((a, b) => b.k - a.k);
    if (zones.length) {
      const z = zones[0].z, ki = zones[0].k * 0.86;
      const PI = project(S, 'iso', ki, { hidden: false });
      const ix = z[0] + (z[2] - PI.w) / 2, iy = z[1] + (z[3] - PI.h) / 2 - 3;
      s += viewSVG(PI, ix, iy, { thin: true });
      s += label(ix, iy + PI.h + 7, 'ISOMETRÍA', 'Sin escala');
    }
    s += '<text class="c-note" x="20" y="283">Cotas en milímetros. Aristas ocultas en trazos. Tolerancia general de corte ±1 mm; verificar en sitio las medidas del muro antes de fabricar.</text>';
    s += rotulo({ mueble: n + ' · ' + I.short, lamina: v + '-' + nn(n) + '.1', contenido: 'Plano de conjunto', escala: '1:' + den + ' en A3', version: v + ' · ' + I.vi.nombre, fecha: L.nota1 ? L.nota1.fechaCorta : '17 oct. 2026' });
    return s + '</svg>';
  };

  /* ------------------------------------------------ lámina de explosión con la lista de piezas */
  function partsTable(S) {
    const P = L.versions.precios, groups = [], by = {};
    S.list.forEach((q) => {
      const nm = q.name || 'Pieza';
      const d = q.comps.length ? q.comps[0] : q.bb, sz = d.getSize(V3());
      const dims = [sz.x, sz.y, sz.z].map((x) => Math.round(x * 1000)).sort((a, b) => b - a);
      const key = nm + '|' + dims.join('x') + '|' + q.mk;
      let gr = by[key];
      if (!gr) { gr = by[key] = { name: nm, mk: q.mk, dims, cant: 0, sol: [] }; groups.push(gr); }
      gr.cant += Math.max(1, q.comps.length); gr.sol.push(q);
    });
    groups.forEach((gr) => {
      const p = P[gr.mk];
      gr.mat = p ? p.m : gr.mk;
      gr.origen = p ? (p.tipo === 'unidad' || /Herrajes|iluminación/i.test(p.cat) && p.tipo !== 'barra' ? 'Compra' : 'Fabrica') : 'Fabrica';
      if (p && (gr.mk === 'perfilLed' || gr.mk === 'cob')) gr.origen = 'Compra, se corta';
    });
    groups.sort((a, b) => (a.sol[0].step - b.sol[0].step) || (a.sol[0].idx - b.sol[0].idx));
    groups.forEach((g, i) => { g.mark = i + 1; });
    return groups;
  }
  DW.parts = function (v, n) { const S = solids(v, n); return S ? partsTable(S) : []; };
  DW.explosion = function (v, n) {
    const S = solids(v, n, true), S0 = solids(v, n);
    if (!S) return '';
    const I = info(v, n), G = partsTable(S0);
    // isometría explosionada en la mitad izquierda
    const ax = 22, ay = 38, aw = 222, ah = 230;
    const pre = project(S, 'iso', 1, { hidden: false, ppm: 2 });
    const ki = Math.min(aw / pre.w, ah / pre.h) * 0.8;
    const P = project(S, 'iso', ki, { hidden: false });
    const ox = ax + (aw - P.w) / 2, oy = ay + (ah - P.h) / 2;
    let s = sheetOpen('Despiece explosionado, mueble ' + n + ', versión ' + v);
    s += '<text class="title" x="20" y="22">' + esc(n + ' · ' + I.name) + '</text>';
    s += '<text class="subtitle" x="20" y="28">Despiece explosionado y lista de piezas · versión ' + v + ' · ' + esc(I.vi.nombre) + '</text>';
    s += viewSVG(P, ox, oy, { thin: true });
    // globos: un punto de cada grupo, repartidos alrededor del dibujo
    const ctr = [ox + P.w / 2, oy + P.h / 2];
    const idxOf = {}; S.list.forEach((q, i) => { idxOf[q.idx] = i; });
    const anchors = G.map((g) => {
      const q = S.list[idxOf[g.sol[0].idx]], c = q.bb.getCenter(V3());
      return { g, x: ox + P.toX(c.dot(P.B.r)), y: oy + P.toY(c.dot(P.B.u)) };
    });
    const R = Math.max(P.w, P.h) / 2 + 14;
    anchors.forEach((a) => { a.ang = Math.atan2(a.y - ctr[1], a.x - ctr[0]); });
    anchors.sort((p, q) => p.ang - q.ang);
    const minA = Math.min(0.5, (2 * Math.PI) / Math.max(anchors.length, 1) * 0.92);
    for (let it = 0; it < 60; it++) for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i], b = anchors[(i + 1) % anchors.length];
      let d = b.ang - a.ang; if (i === anchors.length - 1) d += 2 * Math.PI;
      if (d < minA) { const m = (minA - d) / 2; a.ang -= m; b.ang += m; }
    }
    anchors.forEach((a) => {
      let bx = ctr[0] + Math.cos(a.ang) * Math.min(R, aw / 2 + 4), by = ctr[1] + Math.sin(a.ang) * Math.min(R, ah / 2 + 2);
      bx = Math.max(ax + 4, Math.min(ax + aw + 12, bx)); by = Math.max(ay + 2, Math.min(ay + ah + 2, by));
      s += '<g class="balloon"><line x1="' + a.x.toFixed(2) + '" y1="' + a.y.toFixed(2) + '" x2="' + bx.toFixed(2) + '" y2="' + by.toFixed(2) + '"/><circle class="dot" cx="' + a.x.toFixed(2) + '" cy="' + a.y.toFixed(2) + '" r="0.55"/><circle cx="' + bx.toFixed(2) + '" cy="' + by.toFixed(2) + '" r="3"/><text x="' + bx.toFixed(2) + '" y="' + (by + 1.05).toFixed(2) + '">' + a.g.mark + '</text></g>';
    });
    // lista de piezas
    const tx = 262, ty = 40, rows = Math.min(G.length, 30), rh = Math.min(6.4, 196 / Math.max(rows, 1));
    s += '<g class="table"><text class="h2" x="' + tx + '" y="' + ty + '">Lista de piezas</text>';
    const cols = [[0, 'MARCA'], [11, 'PIEZA'], [74, 'CANT.'], [86, 'MEDIDAS (mm)'], [118, 'ORIGEN']];
    cols.forEach((c) => { s += '<text class="th" x="' + (tx + c[0]) + '" y="' + (ty + 6.5) + '">' + c[1] + '</text>'; });
    s += '<line class="rule" x1="' + tx + '" y1="' + (ty + 8) + '" x2="' + (tx + 138) + '" y2="' + (ty + 8) + '"/>';
    G.slice(0, rows).forEach((g, i) => {
      const y = ty + 8 + (i + 1) * rh - rh * 0.3;
      const nm = g.name.length > 34 ? g.name.slice(0, 33) + '…' : g.name, mt = g.mat.length > 40 ? g.mat.slice(0, 39) + '…' : g.mat;
      s += '<text class="td num-c" x="' + (tx + 3) + '" y="' + (y - 1.2) + '">' + g.mark + '</text>';
      s += '<text class="td" x="' + (tx + 11) + '" y="' + (y - 1.2) + '">' + esc(nm) + '</text><text class="td sm" x="' + (tx + 11) + '" y="' + (y + 1.5) + '">' + esc(mt) + '</text>';
      s += '<text class="td" x="' + (tx + 77) + '" y="' + (y - 1.2) + '">' + g.cant + '</text>';
      s += '<text class="td mono" x="' + (tx + 86) + '" y="' + (y - 1.2) + '">' + g.dims.join(' × ') + '</text>';
      s += '<text class="td sm" x="' + (tx + 118) + '" y="' + (y - 1.2) + '">' + esc(g.origen) + '</text>';
      s += '<line class="rule-t" x1="' + tx + '" y1="' + (ty + 8 + (i + 1) * rh) + '" x2="' + (tx + 138) + '" y2="' + (ty + 8 + (i + 1) * rh) + '"/>';
    });
    if (G.length > rows) s += '<text class="c-note" x="' + tx + '" y="' + (ty + 12 + rows * rh) + '">… y ' + (G.length - rows) + ' grupos más: ver la tabla de despiece.</text>';
    s += '</g>';
    s += '<text class="c-note" x="20" y="283">Medidas de cada pieza: largo × ancho × espesor de su caja envolvente, en milímetros. Las piezas de forma se cortan según el plano de conjunto.</text>';
    s += rotulo({ mueble: n + ' · ' + I.short, lamina: v + '-' + nn(n) + '.2', contenido: 'Despiece explosionado', escala: 'Sin escala', version: v + ' · ' + I.vi.nombre, fecha: L.nota1 ? L.nota1.fechaCorta : '17 oct. 2026' });
    return s + '</svg>';
  };

  /* ------------------------------------------------ láminas de piezas: cada pieza fabricada con sus medidas de corte */
  const SEC = { tubo1: [25.4, 25.4, 1.2], tubo15: [38.1, 38.1, 1.1], tuboRect: [50, 25, 1.1], perfil3030: [30, 30, 0], cob: [8, 2, 0] };
  function espesor(P) {
    const m = /(\d+(?:\.\d+)?) mm/.exec(P.m); if (m) return +m[1];
    if (/calibre 20/.test(P.m)) return 0.9;
    return null;
  }
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  function piezasDe(v, n) {
    const it = L.versions.items[v] && L.versions.items[v][n]; if (!it) return [];
    const P = L.versions.precios;
    return it.piezas.filter((p) => { const t = P[p[0]].tipo; return t === 'lamina' || t === 'm2' || t === 'barra' || (t === 'm' && !/^canto/.test(p[0])); })
      .map((p, i) => ({ i: i + 1, mk: p[0], P: P[p[0]], name: cap(p[1]), cant: p[2], a: p[3], b: p[4] || null }));
  }
  DW.nPiezas = function (v, n) { return Math.max(1, Math.ceil(piezasDe(v, n).length / 6)); };
  function celda(pz, x, y, w, h) {
    const P = pz.P, e = espesor(P), lam = P.tipo === 'lamina' || P.tipo === 'm2';
    let s = '<rect class="cell-b" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>';
    s += '<text class="pz-m" x="' + (x + 3) + '" y="' + (y + 6) + '">P' + pz.i + '</text><text class="pz-n" x="' + (x + 13) + '" y="' + (y + 6) + '">' + esc(pz.name.length > 46 ? pz.name.slice(0, 45) + '…' : pz.name) + '</text>';
    s += '<text class="pz-s" x="' + (x + 13) + '" y="' + (y + 10.2) + '">' + esc((P.m.length > 62 ? P.m.slice(0, 61) + '…' : P.m)) + ' · cantidad ' + pz.cant + '</text>';
    const ax = x + 14, ay = y + 17, aw = w - 40, ah = h - 30;            // zona del dibujo (deja sitio a las cotas)
    if (lam) {
      const A = Math.max(pz.a, pz.b) * 1000, Bm = Math.min(pz.a, pz.b) * 1000, T = e || 10;
      let den = SCALES.concat([100]).find((d) => A / d <= aw && Bm / d <= ah) || 100;
      const k = 1 / den, W = A * k, H = Bm * k, ox = ax + (aw - W) / 2, oy = ay + (ah - H) / 2;
      s += '<rect class="pz-f" x="' + ox.toFixed(2) + '" y="' + oy.toFixed(2) + '" width="' + W.toFixed(2) + '" height="' + H.toFixed(2) + '"/>';
      // canto (vista de espesor) a la derecha
      const tw = Math.max(0.6, T * k * 4), tx = ox + W + 9;
      s += '<rect class="pz-f" x="' + tx.toFixed(2) + '" y="' + oy.toFixed(2) + '" width="' + tw.toFixed(2) + '" height="' + H.toFixed(2) + '"/>';
      s += '<text class="pz-s" x="' + (tx + tw + 1.5).toFixed(2) + '" y="' + (oy + 3).toFixed(2) + '">e = ' + String(T).replace('.', ',') + '</text>';
      s += dimH(ox, ox + W, oy + H + 5.5, oy + H, String(Math.round(A)));
      s += dimV(oy, oy + H, ox - 5.5, ox, String(Math.round(Bm)));
      s += '<text class="pz-e" x="' + (x + w - 3) + '" y="' + (y + h - 3) + '">Esc. 1:' + den + (/Rovere|blanc|Plomo/i.test(P.m) ? ' · veta a lo largo' : '') + '</text>';
    } else {
      const Lm = pz.a * 1000, sec = SEC[pz.mk];
      const den = SCALES.concat([100]).find((d) => Lm / d <= aw - 30) || 100, k = 1 / den;
      const W = Lm * k, Hh = Math.max(2.2, (sec ? sec[1] : 10) * k * 3), ox = ax, oy = ay + ah / 2 - Hh / 2;
      s += '<rect class="pz-f" x="' + ox.toFixed(2) + '" y="' + oy.toFixed(2) + '" width="' + W.toFixed(2) + '" height="' + Hh.toFixed(2) + '"/>';
      s += dimH(ox, ox + W, oy + Hh + 6, oy + Hh, String(Math.round(Lm)));
      if (sec) {                                                    // sección a escala 1:2
        const sx = x + w - 31, sy = ay + ah / 2 - 8, sw = sec[0] / 2, sh = sec[1] / 2;
        s += sec[2] ? '<path class="pz-st" fill-rule="evenodd" d="M' + sx + ' ' + sy + 'h' + sw + 'v' + sh + 'h' + (-sw) + 'zM' + (sx + sec[2] / 2 + 0.25) + ' ' + (sy + sec[2] / 2 + 0.25) + 'v' + (sh - sec[2] - 0.5) + 'h' + (sw - sec[2] - 0.5) + 'v' + (-(sh - sec[2] - 0.5)) + 'z"/>'
          : '<rect class="pz-al" x="' + sx + '" y="' + sy + '" width="' + sw + '" height="' + sh + '"/>';
        s += '<text class="pz-s" x="' + sx + '" y="' + (sy + sh + 4) + '">' + String(sec[0]).replace('.', ',') + ' × ' + String(sec[1]).replace('.', ',') + (sec[2] ? ' × ' + String(sec[2]).replace('.', ',') : '') + '</text><text class="pz-s" x="' + sx + '" y="' + (sy + sh + 7.4) + '">Sección 1:2</text>';
      }
      s += '<text class="pz-e" x="' + (x + w - 3) + '" y="' + (y + h - 3) + '">Esc. 1:' + den + ' · corte a 90°</text>';
    }
    return s;
  }
  DW.piezas = function (v, n, page) {
    page = page || 1;
    const all = piezasDe(v, n), I = info(v, n), tot = Math.max(1, Math.ceil(all.length / 6));
    const list = all.slice((page - 1) * 6, page * 6);
    let s = sheetOpen('Planos de piezas, mueble ' + n + ', versión ' + v + ', hoja ' + page);
    s += '<text class="title" x="20" y="22">' + esc(n + ' · ' + I.name) + '</text>';
    s += '<text class="subtitle" x="20" y="28">Piezas fabricadas: medidas de corte · versión ' + v + ' · ' + esc(I.vi.nombre) + ' · hoja ' + page + ' de ' + tot + '</text>';
    const cw = 128, ch = 99, x0 = 20, y0 = 34;
    list.forEach((pz, i) => {
      const r = Math.floor(i / 3), c = i % 3;
      s += celda(pz, x0 + c * (cw + 2), y0 + r * (ch + 2), cw, ch);
    });
    s += '<text class="c-note" x="20" y="283">Medidas de corte en milímetros. Los tableros se piden cortados y enchapados al proveedor; los tubos se cortan a 90° en el taller. Perforaciones de herrajes según el plano de conjunto.</text>';
    s += rotulo({ mueble: n + ' · ' + I.short, lamina: v + '-' + nn(n) + '.' + (2 + page), contenido: 'Piezas · hoja ' + page + ' de ' + tot, escala: 'Indicada en cada pieza', version: v + ' · ' + I.vi.nombre, fecha: L.nota1 ? L.nota1.fechaCorta : '17 oct. 2026' });
    return s + '</svg>';
  };

  /* isometría suelta (para bocetos y miniaturas), en un SVG de w × h */
  DW.isoSVG = function (v, n, w, h, opt) {
    opt = opt || {};
    const S = solids(v, n, !!opt.exploded);
    if (!S) return '';
    const pre = project(S, 'iso', 1, { hidden: false, ppm: 2 });
    const k = Math.min(w / pre.w, h / pre.h) * 0.92;
    const P = project(S, 'iso', k, { hidden: false, ppm: opt.ppm || 4 });
    return '<svg xmlns="http://www.w3.org/2000/svg" class="dwg dwg-iso" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Isometría del mueble ' + n + ', versión ' + v + '"><style>' + DW.css + '</style>' + viewSVG(P, (w - P.w) / 2, (h - P.h) / 2, { thin: true }) + '</svg>';
  };
  DW._solids = solids; DW._project = project;
  DW.clear = function () { Object.keys(solidCache).forEach((k) => delete solidCache[k]); };

  DW.css = [
    'text{font-family:Inter,"Helvetica Neue",Arial,sans-serif;fill:#111}',
    '.paper{fill:#fff}.frame{fill:none;stroke:#111;stroke-width:.5}',
    '.title{font-size:5.6px;font-weight:600}.subtitle{font-size:3px;fill:#555}',
    '.vis{fill:none;stroke:#111;stroke-width:.3;stroke-linecap:round;stroke-linejoin:round}.vis.thin{stroke-width:.2}',
    '.hid{fill:none;stroke:#555;stroke-width:.13;stroke-dasharray:1 .6}',
    '.sec.h1{fill:url(#hA)}.sec.h2{fill:url(#hB)}.hl{stroke:#111;stroke-width:.14}.sec-o{fill:none;stroke:#111;stroke-width:.42}',
    '.cutl line{stroke:#111;stroke-width:.25;stroke-dasharray:6 1 1 1}.cut-arw{fill:none;stroke:#111;stroke-width:.45}.cut-t{font-size:3.6px;font-weight:700}',
    '.d-line,.d-ext{stroke:#111;stroke-width:.13}.d-arw{fill:#111}.d-txt{font-size:2.5px;text-anchor:middle}.d-txt.l{text-anchor:start}',
    '.v-lab{font-size:3.1px;font-weight:700;letter-spacing:.04em}.v-sub{font-size:2.4px;fill:#555}',
    '.cell{fill:none;stroke:#111;stroke-width:.25}.c-lab{font-size:1.9px;fill:#666;letter-spacing:.06em}.c-val{font-size:3px}.c-val.big{font-size:3.5px;font-weight:600}.c-note{font-size:2.3px;fill:#555}',
    '.proj path,.proj circle{fill:none;stroke:#111;stroke-width:.22}',
    '.balloon line{stroke:#111;stroke-width:.13}.balloon circle{fill:#fff;stroke:#111;stroke-width:.22}.balloon .dot{fill:#111;stroke:none}.balloon text{font-size:2.8px;font-weight:600;text-anchor:middle}',
    '.h2{font-size:3.6px;font-weight:600}.th{font-size:1.9px;fill:#666;letter-spacing:.06em}.td{font-size:2.45px}.td.sm{font-size:1.9px;fill:#666}.td.mono{font-variant-numeric:tabular-nums}.num-c{text-anchor:middle;font-weight:600}',
    '.rule{stroke:#111;stroke-width:.25}.rule-t{stroke:#ccc;stroke-width:.12}',
    '.cell-b{fill:none;stroke:#bbb;stroke-width:.2}.pz-m{font-size:3.6px;font-weight:700}.pz-n{font-size:3.1px;font-weight:600}.pz-s{font-size:2.2px;fill:#555}.pz-e{font-size:2.2px;fill:#555;text-anchor:end}.pz-f{fill:#fff;stroke:#111;stroke-width:.3}.pz-st{fill:#111}.pz-al{fill:url(#hA);stroke:#111;stroke-width:.25}'
  ].join('')
    .replace(/(^|\})([^{}]+)\{/g, (m, b, sel) => b + sel.split(',').map((x) => '.dwg ' + x.trim()).join(',') + '{');
})();
