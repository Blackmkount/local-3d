/* ============================================================================
   GEOMETRÍA — utilidades para tableros, piezas curvas y objetos de exhibición.
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const T = THREE;
  const G = (L.geo = {});
  const TL = 1.3, TW = 0.65;          // metros que cubre la textura de madera (largo de veta × ancho)
  let seed = 1;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  G.rand = rand;
  G.reseed = (s) => { seed = s >>> 0; };

  /* Caja con UV a escala real y la veta a lo largo de la dimensión mayor.
     Las aristas llevan un redondeo de canto (bev, por defecto 2.2 mm, como el
     canto PVC de un tablero): atrapa un hilo de luz en cada borde, que es lo que
     hace que un mueble se vea fabricado y no dibujado. */
  G.bevel = 0.0022;
  G.box = function (sx, sy, sz, grain, bev) {
    const dims = [sx, sy, sz];
    const ga = grain != null ? grain : (sx >= sy && sx >= sz ? 0 : (sy >= sz ? 1 : 2));
    const r = bev != null ? bev : Math.min(G.bevel, Math.min(sx, sy, sz) * 0.3);
    const seg = r > 0.0003 ? 3 : 1;
    const g = new T.BoxGeometry(sx, sy, sz, seg, seg, seg);
    const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
    if (seg === 3) {
      // cada eje: los vértices del borde (±s/2) van al arco y los interiores (±s/6) al límite de la cara plana
      const h = [sx / 2 - r, sy / 2 - r, sz / 2 - r], t = [sx / 3, sy / 3, sz / 3], p = [0, 0, 0], n = [0, 0, 0];
      for (let i = 0; i < pos.count; i++) {
        p[0] = pos.getX(i); p[1] = pos.getY(i); p[2] = pos.getZ(i);
        let l = 0;
        for (let a = 0; a < 3; a++) { n[a] = Math.abs(p[a]) > t[a] ? Math.sign(p[a]) : 0; l += n[a] * n[a]; }
        l = 1 / Math.sqrt(l);
        for (let a = 0; a < 3; a++) { n[a] *= l; p[a] = Math.sign(p[a]) * h[a] + n[a] * r; }
        pos.setXYZ(i, p[0], p[1], p[2]); nor.setXYZ(i, n[0], n[1], n[2]);
      }
    }
    // UV desde la posición: la veta sigue de una cara a la siguiente, como una chapa que envuelve el canto
    const faces = [[2, 1], [2, 1], [0, 2], [0, 2], [0, 1], [0, 1]];   // ejes (u, v) de cada cara
    const per = pos.count / 6, ou = rand(), ov = rand();
    for (let f = 0; f < 6; f++) {
      const ua = faces[f][0], va = faces[f][1];
      for (let i = f * per; i < (f + 1) * per; i++) {
        const u = [pos.getX(i), pos.getY(i), pos.getZ(i)];
        const cu = u[ua] + dims[ua] / 2, cv = u[va] + dims[va] / 2;
        if (va === ga) uv.setXY(i, cv / TL + ou, cu / TW + ov); else uv.setXY(i, cu / TL + ou, cv / TW + ov);
      }
    }
    return g;
  };

  /* Contorno en planta (x, z) con radios por esquina: bl, br (z = 0) y fr, fl (z = F) */
  G.planShape = function (Lx, F, r, inset) {
    inset = inset || 0;
    const x0 = inset, z0 = inset, x1 = Lx - inset, z1 = F - inset;
    const rr = (v) => Math.max(0, (v || 0) - inset);
    const bl = rr(r.bl), br = rr(r.br), fr = rr(r.fr), fl = rr(r.fl);
    const s = new T.Shape();
    s.moveTo(x0 + bl, -z0);
    s.lineTo(x1 - br, -z0);
    if (br) s.absarc(x1 - br, -(z0 + br), br, Math.PI / 2, 0, true);
    s.lineTo(x1, -(z1 - fr));
    if (fr) s.absarc(x1 - fr, -(z1 - fr), fr, 0, -Math.PI / 2, true);
    s.lineTo(x0 + fl, -z1);
    if (fl) s.absarc(x0 + fl, -(z1 - fl), fl, -Math.PI / 2, -Math.PI, true);
    s.lineTo(x0, -(z0 + bl));
    if (bl) s.absarc(x0 + bl, -(z0 + bl), bl, Math.PI, Math.PI / 2, true);
    return s;
  };
  /* Tablero horizontal a partir de un contorno en planta; y ∈ [0, t] */
  G.slab = function (shape, t, wood) {
    // las tapas de madera llevan el mismo canto redondeado que los tableros
    const b = wood ? Math.min(G.bevel, t * 0.3) : 0;
    const g = new T.ExtrudeGeometry(shape, b ? { depth: t - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 2, curveSegments: 14 } : { depth: t, bevelEnabled: false, curveSegments: 10 });
    if (b) g.translate(0, 0, b);
    if (wood) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / TL, uv.getY(i) / TW); }
    g.rotateX(-Math.PI / 2);
    return g;
  };
  /* Piel curva: sector de corona de 90° en planta, extruido en altura h. q = 'bl' | 'br' | 'fr' | 'fl' */
  G.arcSkin = function (cx, cz, rOut, t, h, q) {
    const a = { br: [Math.PI / 2, 0], fr: [0, -Math.PI / 2], fl: [-Math.PI / 2, -Math.PI], bl: [Math.PI, Math.PI / 2] }[q];
    const s = new T.Shape();
    s.absarc(cx, -cz, rOut, a[0], a[1], true);
    s.absarc(cx, -cz, rOut - t, a[1], a[0], false);
    s.closePath();
    const g = new T.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 10 });
    g.rotateX(-Math.PI / 2);
    return g;
  };

  /* Trazos SVG (atributo d) → formas planas de three.js con sus huecos.
     Admite M L H V C S Q T Z, absolutos y relativos; invierte Y porque en SVG
     crece hacia abajo. Los huecos se reconocen por anidamiento (un contorno
     dentro de un número impar de contornos es un hueco), así no importa el
     sentido en que se dibujó cada trazo. */
  G.svgShapes = function (paths, div) {
    const subs = [];
    paths.forEach((d) => {
      const tk = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) || [];
      let i = 0, cmd = '', prev = '', x = 0, y = 0, x0 = 0, y0 = 0, cx = 0, cy = 0, cur = null;
      const n = () => parseFloat(tk[i++]);
      const begin = () => { cur = new T.Path(); cur.moveTo(x, -y); subs.push(cur); };
      while (i < tk.length) {
        if (/[a-zA-Z]/.test(tk[i])) cmd = tk[i++];
        const C = cmd.toUpperCase(), r = cmd !== C, ox = r ? x : 0, oy = r ? y : 0;
        if (C === 'Z') { if (cur) cur.closePath(); x = x0; y = y0; cur = null; prev = 'Z'; continue; }
        if (C === 'M') { x = n() + ox; y = n() + oy; x0 = x; y0 = y; begin(); cmd = r ? 'l' : 'L'; prev = 'M'; continue; }
        if (!cur) { x0 = x; y0 = y; begin(); }
        if (C === 'L') { x = n() + ox; y = n() + oy; cur.lineTo(x, -y); }
        else if (C === 'H') { x = n() + ox; cur.lineTo(x, -y); }
        else if (C === 'V') { y = n() + oy; cur.lineTo(x, -y); }
        else if (C === 'C' || C === 'S') {
          let x1, y1;
          if (C === 'C') { x1 = n() + ox; y1 = n() + oy; } else if (prev === 'C' || prev === 'S') { x1 = 2 * x - cx; y1 = 2 * y - cy; } else { x1 = x; y1 = y; }
          const x2 = n() + ox, y2 = n() + oy, ex = n() + ox, ey = n() + oy;
          cur.bezierCurveTo(x1, -y1, x2, -y2, ex, -ey); cx = x2; cy = y2; x = ex; y = ey;
        } else if (C === 'Q' || C === 'T') {
          let x1, y1;
          if (C === 'Q') { x1 = n() + ox; y1 = n() + oy; } else if (prev === 'Q' || prev === 'T') { x1 = 2 * x - cx; y1 = 2 * y - cy; } else { x1 = x; y1 = y; }
          const ex = n() + ox, ey = n() + oy;
          cur.quadraticCurveTo(x1, -y1, ex, -ey); cx = x1; cy = y1; x = ex; y = ey;
        } else { i++; continue; }            // arcos u otros comandos: no aparecen en el logotipo
        prev = C;
      }
    });
    const polys = subs.map((p) => { const pts = p.getPoints(div || 8); return { pts, area: Math.abs(T.ShapeUtils.area(pts)) }; }).filter((o) => o.pts.length > 2 && o.area > 1e-6);
    const inside = (pt, pts) => {
      let c = false;
      for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
        if ((pts[a].y > pt.y) !== (pts[b].y > pt.y) && pt.x < (pts[b].x - pts[a].x) * (pt.y - pts[a].y) / (pts[b].y - pts[a].y) + pts[a].x) c = !c;
      }
      return c;
    };
    polys.forEach((o) => {
      o.depth = 0; o.parent = null;
      polys.forEach((q) => { if (q !== o && q.area > o.area && inside(o.pts[0], q.pts)) { o.depth++; if (!o.parent || q.area < o.parent.area) o.parent = q; } });
    });
    const shapes = new Map();
    polys.forEach((o) => { if (o.depth % 2 === 0) shapes.set(o, new T.Shape(o.pts)); });
    polys.forEach((o) => { if (o.depth % 2 === 1 && shapes.has(o.parent)) shapes.get(o.parent).holes.push(new T.Path(o.pts)); });
    return Array.from(shapes.values());
  };
  /* separa una geometría no indexada en una por material (p. ej. caras y cantos de un extruido) */
  G.splitGroups = function (geo) {
    const by = [];
    geo.groups.forEach((gr) => { (by[gr.materialIndex] = by[gr.materialIndex] || []).push(gr); });
    return by.map((list) => {
      const out = new T.BufferGeometry();
      for (const k in geo.attributes) {
        const a = geo.attributes[k], sz = a.itemSize, n = list.reduce((t, gr) => t + gr.count, 0), arr = new a.array.constructor(n * sz);
        let o = 0;
        list.forEach((gr) => { arr.set(a.array.subarray(gr.start * sz, (gr.start + gr.count) * sz), o); o += gr.count * sz; });
        out.setAttribute(k, new T.BufferAttribute(arr, sz));
      }
      out.computeBoundingBox(); out.computeBoundingSphere();
      return out;
    });
  };

  /* Une geometrías en una sola malla con color por vértice. list: [{g, m (Matrix4), c (hex)}] */
  G.merge = function (list) {
    let n = 0;
    const parts = list.map((it) => { const g = it.g.index ? it.g.toNonIndexed() : it.g; n += g.attributes.position.count; return g; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const v = new T.Vector3(), nm = new T.Matrix3(), c = new T.Color();
    let o = 0;
    list.forEach((it, idx) => {
      const g = parts[idx], p = g.attributes.position, nn = g.attributes.normal;
      if (it.m) nm.getNormalMatrix(it.m);
      c.set(it.c != null ? it.c : 0xffffff);
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i); if (it.m) v.applyMatrix4(it.m);
        pos[o * 3] = v.x; pos[o * 3 + 1] = v.y; pos[o * 3 + 2] = v.z;
        v.fromBufferAttribute(nn, i); if (it.m) v.applyMatrix3(nm).normalize();
        nor[o * 3] = v.x; nor[o * 3 + 1] = v.y; nor[o * 3 + 2] = v.z;
        col[o * 3] = c.r; col[o * 3 + 1] = c.g; col[o * 3 + 2] = c.b;
        o++;
      }
    });
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.BufferAttribute(nor, 3));
    out.setAttribute('color', new T.BufferAttribute(col, 3));
    out.computeBoundingBox(); out.computeBoundingSphere();
    return out;
  };
  const _q = new T.Quaternion(), _e = new T.Euler(), _s = new T.Vector3(), _p = new T.Vector3();
  G.mat = function (x, y, z, rx, ry, rz, sx, sy, sz) {
    _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e);
    _p.set(x, y, z); _s.set(sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy, sz == null ? (sx == null ? 1 : sx) : sz);
    return new T.Matrix4().compose(_p, _q, _s);
  };
  /* añade una caja (esquina mínima + tamaño) a una lista para merge */
  G.pushBox = function (list, x, y, z, sx, sy, sz, c, ry) {
    list.push({ g: new T.BoxGeometry(sx, sy, sz), m: G.mat(x + sx / 2, y + sy / 2, z + sz / 2, 0, ry || 0, 0), c });
  };

  /* ------------------------------------------------ piezas de exhibición */
  const cache = {};
  const geo = (k, f) => cache[k] || (cache[k] = f());
  const sph = () => geo('sph', () => new T.SphereGeometry(1, 14, 10));
  const cyl = () => geo('cyl', () => new T.CylinderGeometry(1, 1, 1, 32));
  const cone4 = () => geo('cone4', () => new T.CylinderGeometry(0.02, 1, 1, 4));
  const ico = () => geo('ico', () => new T.IcosahedronGeometry(1, 0));
  const knot = () => geo('knot', () => new T.TorusKnotGeometry(1, 0.32, 56, 8, 2, 3));
  const vase = () => geo('vase', () => { const p = []; for (let i = 0; i <= 12; i++) { const t = i / 12; p.push(new T.Vector2(0.28 + 0.34 * Math.sin(t * 2.7 + 0.25) - 0.16 * t * t, t)); } return new T.LatheGeometry(p, 16); });
  const vase2 = () => geo('vase2', () => { const p = []; for (let i = 0; i <= 12; i++) { const t = i / 12; p.push(new T.Vector2(0.5 - 0.34 * Math.sin(t * 3.0) + 0.1 * t, t)); } return new T.LatheGeometry(p, 6); });
  const torus = () => geo('torus', () => new T.TorusGeometry(1, 0.3, 8, 20));

  /* cada figura mide 1 de alto en su sistema local, apoyada en y = 0 */
  const figs = {
    conejo(o, M, c) {
      o.push({ g: sph(), m: M(0, 0.26, 0, 0, 0, 0, 0.2, 0.26, 0.18), c });
      o.push({ g: sph(), m: M(0, 0.6, 0, 0, 0, 0, 0.17, 0.16, 0.16), c });
      o.push({ g: sph(), m: M(-0.07, 0.84, 0, 0, 0, 0.12, 0.04, 0.16, 0.035), c });
      o.push({ g: sph(), m: M(0.07, 0.84, 0, 0, 0, -0.12, 0.04, 0.16, 0.035), c });
      o.push({ g: sph(), m: M(-0.2, 0.3, 0.02, 0, 0, 0.5, 0.05, 0.13, 0.05), c });
      o.push({ g: sph(), m: M(0.2, 0.3, 0.02, 0, 0, -0.5, 0.05, 0.13, 0.05), c });
    },
    busto(o, M, c) {
      o.push({ g: cyl(), m: M(0, 0.09, 0, 0, 0, 0, 0.2, 0.18, 0.2), c });
      o.push({ g: sph(), m: M(0, 0.36, 0, 0, 0, 0, 0.3, 0.2, 0.17), c });
      o.push({ g: cyl(), m: M(0, 0.58, 0, 0, 0, 0, 0.07, 0.14, 0.07), c });
      o.push({ g: sph(), m: M(0, 0.8, 0, 0, 0, 0, 0.17, 0.2, 0.18), c });
    },
    torre(o, M, c) {
      o.push({ g: cone4(), m: M(0, 0.5, 0, 0, Math.PI / 4, 0, 0.3, 1, 0.3), c });
      o.push({ g: new T.BoxGeometry(1, 1, 1), m: M(0, 0.24, 0, 0, 0, 0, 0.36, 0.03, 0.36), c });
      o.push({ g: new T.BoxGeometry(1, 1, 1), m: M(0, 0.5, 0, 0, 0, 0, 0.22, 0.025, 0.22), c });
    },
    jarron(o, M, c) { o.push({ g: vase(), m: M(0, 0, 0, 0, 0, 0, 0.62, 1, 0.62), c }); },
    facetado(o, M, c) { o.push({ g: vase2(), m: M(0, 0, 0, 0, 0, 0, 0.6, 1, 0.6), c }); },
    gema(o, M, c) { o.push({ g: ico(), m: M(0, 0.5, 0, 0.3, 0.4, 0, 0.5), c }); },
    nudo(o, M, c) { o.push({ g: knot(), m: M(0, 0.5, 0, 0, 0.5, 0, 0.3), c }); },
    aro(o, M, c) { o.push({ g: torus(), m: M(0, 0.5, 0, 0, 0.4, 0, 0.38), c }); o.push({ g: cyl(), m: M(0, 0.04, 0, 0, 0, 0, 0.2, 0.08, 0.2), c }); },
    caja(o, M, c) { o.push({ g: new T.BoxGeometry(1, 1, 1), m: M(0, 0.5, 0, 0, 0, 0, 0.75, 1, 0.5), c }); }
  };
  G.figNames = Object.keys(figs).filter((k) => k !== 'caja');
  /* Coloca una figura de alto h en (x, y, z) */
  G.fig = function (list, name, x, y, z, h, color, ry) {
    const base = G.mat(x, y, z, 0, ry || 0, 0, h);
    figs[name](list, (px, py, pz, rx, ry2, rz, sx, sy, sz) => base.clone().multiply(G.mat(px, py, pz, rx, ry2, rz, sx, sy, sz)), color);
  };
  /* Carrete de filamento; eje a lo largo de `axis` ('x' | 'y' | 'z') */
  G.spool = function (list, x, y, z, r, w, color, axis) {
    const rot = axis === 'z' ? [Math.PI / 2, 0, 0] : axis === 'x' ? [0, 0, Math.PI / 2] : [0, 0, 0];
    const M = (off, rad, len) => {
      const d = axis === 'z' ? [0, 0, off] : axis === 'x' ? [off, 0, 0] : [0, off, 0];
      return G.mat(x + d[0], y + d[1], z + d[2], rot[0], rot[1], rot[2], rad, len, rad);
    };
    list.push({ g: cyl(), m: M(0, r * 0.9, w * 0.78), c: color });
    list.push({ g: cyl(), m: M(-w / 2 + w * 0.06, r, w * 0.1), c: 0x1c1c1e });
    list.push({ g: cyl(), m: M(w / 2 - w * 0.06, r, w * 0.1), c: 0x1c1c1e });
    list.push({ g: cyl(), m: M(0, r * 0.34, w * 1.02), c: 0x3a3a3d });
  };
  /* Planta de hojas en punta (como las del render) */
  G.plant = function (list, x, y, z, h, n) {
    const leaf = geo('leaf', () => { const g = new T.ConeGeometry(0.5, 1, 4, 1); g.scale(1, 1, 0.18); g.translate(0, 0.5, 0); return g; });
    const greens = [0x3f6b3a, 0x4d7d44, 0x35592f, 0x5a8a4a, 0x2f5230];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.6, tilt = 0.12 + rand() * 0.62, hh = h * (0.55 + rand() * 0.5);
      const m = G.mat(x, y, z, 0, a, 0).multiply(G.mat(0.02, 0, 0, 0, 0, -tilt, 0.085 + rand() * 0.03, hh, 0.085));
      list.push({ g: leaf, m, c: greens[i % greens.length] });
    }
  };
  G.cyl = cyl; G.sph = sph;
})();
