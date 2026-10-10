/* ============================================================================
   MOTOR 3D — render, luces, materiales, cámara, reflejo del piso y animación.
   Depende de THREE (global). No contiene datos del proyecto.
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const T = THREE;
  const E = (L.engine = {});

  const BG = 0xdcd7cf;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  E.clamp = clamp; E.lerp = lerp;

  E.ease = {
    lin: (k) => k,
    inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    out: (k) => 1 - Math.pow(1 - k, 3),
    in: (k) => k * k * k,
    outBack: (k) => { const c = 1.4; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    outQuint: (k) => 1 - Math.pow(1 - k, 5)
  };

  /* ---------------------------------------------------------------- tweens */
  const tweens = [];
  E.tween = function (dur, fn, opt) {
    opt = opt || {};
    const tw = { t0: performance.now() + (opt.delay || 0) * 1000, dur: Math.max(1, dur * 1000), fn, ease: opt.ease || E.ease.inOut, done: opt.done, dead: false };
    tweens.push(tw);
    E.invalidate();
    return tw;
  };
  E.cancel = function (tw) { if (tw) tw.dead = true; };
  E.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let dirty = 2;
  E.invalidate = function (n) { dirty = Math.max(dirty, n || 2); };

  /* ------------------------------------------------- texturas PBR procedurales
     Ningún material usa archivos: color, relieve (normal map) y rugosidad salen
     del mismo campo de alturas, así la luz y los reflejos responden a la veta,
     al poro y a la junta igual que en el material real. Todas se repiten sin
     costura (ruido periódico). */
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  E.rnd = rnd;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hash2 = (a, b) => { let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  /* ruido de valor periódico: n(x, y, px, py) se repite cada px × py celdas */
  function valueNoise(seed) {
    const r = rnd(seed), perm = new Uint16Array(512), val = new Float32Array(256);
    for (let i = 0; i < 256; i++) { perm[i] = i; val[i] = r(); }
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)), t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
    return function (x, y, px, py) {
      const xi = Math.floor(x), yi = Math.floor(y);
      let fx = x - xi, fy = y - yi;
      const x0 = ((xi % px) + px) % px, y0 = ((yi % py) + py) % py, x1 = (x0 + 1) % px, y1 = (y0 + 1) % py;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      const a = val[perm[perm[x0 & 255] + (y0 & 255)]], b = val[perm[perm[x1 & 255] + (y0 & 255)]];
      const c = val[perm[perm[x0 & 255] + (y1 & 255)]], d = val[perm[perm[x1 & 255] + (y1 & 255)]];
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
  }
  function fbm(n, x, y, px, py, oct) {
    let s = 0, a = 1, t = 0;
    for (let o = 0; o < oct; o++) { s += a * n(x, y, px, py); t += a; x *= 2; y *= 2; px *= 2; py *= 2; a *= 0.5; }
    return s / t;
  }
  let maxAniso = 8;
  function texFrom(c, srgb) {
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace; t.anisotropy = maxAniso;
    return t;
  }
  /* sample(u, v, o) con u, v ∈ [0, 1) escribe o.r, o.g, o.b (color sRGB 0–1),
     o.h (altura, en píxeles de la textura), o.ro (rugosidad) y o.m (máscara de brillo) */
  function bakePBR(w, h, bump, sample, withColor) {
    const H = new Float32Array(w * h), col = withColor ? new ImageData(w, h) : null, rgh = new ImageData(w, h), nrm = new ImageData(w, h);
    const o = { r: 1, g: 1, b: 1, h: 0, ro: 0.5, m: 1 };
    for (let y = 0; y < h; y++) {
      const v = (h - y - 0.5) / h;
      for (let x = 0; x < w; x++) {
        const i = y * w + x, k = i * 4;
        o.h = 0; o.m = 1;
        sample((x + 0.5) / w, v, o);
        H[i] = o.h;
        if (col) { col.data[k] = o.r * 255; col.data[k + 1] = o.g * 255; col.data[k + 2] = o.b * 255; col.data[k + 3] = 255; }
        rgh.data[k] = 255; rgh.data[k + 1] = o.ro * 255; rgh.data[k + 2] = o.m * 255; rgh.data[k + 3] = 255;
      }
    }
    for (let y = 0; y < h; y++) {
      const yu = (y + h - 1) % h, yd = (y + 1) % h;
      for (let x = 0; x < w; x++) {
        const xl = (x + w - 1) % w, xr = (x + 1) % w;
        const du = (H[y * w + xr] - H[y * w + xl]) * 0.5 * bump, dv = (H[yu * w + x] - H[yd * w + x]) * 0.5 * bump;
        const il = 1 / Math.sqrt(du * du + dv * dv + 1), k = (y * w + x) * 4;
        nrm.data[k] = (-du * il * 0.5 + 0.5) * 255; nrm.data[k + 1] = (-dv * il * 0.5 + 0.5) * 255; nrm.data[k + 2] = (il * 0.5 + 0.5) * 255; nrm.data[k + 3] = 255;
      }
    }
    const put = (img) => { const c = canvas(w, h); c.getContext('2d').putImageData(img, 0, 0); return c; };
    return { map: col ? texFrom(put(col), true) : null, normalMap: texFrom(put(nrm), false), roughnessMap: texFrom(put(rgh), false) };
  }
  const mix3 = (o, a, b, t) => { o.r = a[0] + (b[0] - a[0]) * t; o.g = a[1] + (b[1] - a[1]) * t; o.b = a[2] + (b[2] - a[2]) * t; };
  const hex3 = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];

  /* madera (melamina decorada): u = a lo largo de la veta (1.30 m), v = a lo ancho (0.65 m) */
  function woodMaps(seed, light, base, dark, w) {
    const n = valueNoise(seed), n2 = valueNoise(seed * 7 + 3), L0 = hex3(light), B0 = hex3(base), D0 = hex3(dark);
    w = w || 1024;
    return bakePBR(w, w / 2, 1.3, (u, v, o) => {
      const warp = fbm(n, u * 2, v * 3, 2, 3, 3) - 0.5;
      const g1 = v * 13 + warp * 3.2;                                        // tablones: tono de cada lámina
      const g2 = v * 64 + warp * 16 + (n(u * 11, v * 30, 11, 30) - 0.5) * 1.6;   // anillos
      const s2 = g2 - Math.floor(g2);
      const late = sstep(0.55, 0.86, s2) * (1 - sstep(0.93, 1, s2));        // madera tardía: banda oscura
      const board = n2(0.5, Math.floor(g1) + 0.5, 1, 13);
      const g3 = v * 210 + warp * 50 + (n2(u * 23, v * 90, 23, 90) - 0.5) * 2.2;  // líneas finas de veta
      const s3 = g3 - Math.floor(g3);
      const line = (1 - sstep(0.0, 0.16, s3)) * (0.55 + 0.45 * n(u * 40, v * 120, 40, 120));
      const pore = sstep(0.62, 0.86, n2(u * 64, v * 300, 64, 300)) * (1 - late * 0.6);
      const cloud = fbm(n2, u * 4, v * 6, 4, 6, 3) - 0.5;
      const t = clamp(0.34 + late * 0.36 + line * 0.18 + (board - 0.5) * 0.34 + cloud * 0.22, 0, 1);
      if (t < 0.5) mix3(o, L0, B0, t * 2); else mix3(o, B0, D0, (t - 0.5) * 2);
      const k = 1 - pore * 0.2;
      o.r *= k; o.g *= k; o.b *= k;
      o.h = -pore * 1.1 - line * 0.35 - late * 0.25;
      o.ro = clamp(0.5 + pore * 0.22 + line * 0.05 - (board - 0.5) * 0.06 + cloud * 0.05, 0, 1);
    }, true);
  }

  /* porcelanato de 0.60 × 0.60: la textura cubre 4 × 4 baldosas (2.40 m) */
  function tileMaps() {
    const n = valueNoise(11), n2 = valueNoise(29), BASE = [0.715, 0.698, 0.665], GROUT = [0.47, 0.452, 0.42];
    return bakePBR(1024, 1024, 1.0, (u, v, o) => {
      const ti = Math.floor(u * 4), tj = Math.floor(v * 4), lu = u * 4 - ti, lv = v * 4 - tj;
      const e = Math.min(lu, 1 - lu, lv, 1 - lv) * 600;                      // mm al borde de la baldosa
      const hv = hash2(ti + 1, tj + 1), hx = hash2(ti + 7, tj + 3) - 0.5, hy = hash2(ti + 2, tj + 9) - 0.5;
      const ox = ti * 3.71 + hv * 9, oy = tj * 5.13 + hv * 7;
      const cl = fbm(n, lu * 3 + ox, lv * 3 + oy, 4096, 4096, 5);                // nubes del porcelanato
      const vein = 1 - sstep(0.0, 0.035, Math.abs(fbm(n2, lu * 2 + oy, lv * 2.4 + ox, 4096, 4096, 5) - 0.5));
      const smudge = fbm(n2, u * 9, v * 9, 9, 9, 4);
      if (e < 1.4) {                                                         // junta de 3 mm
        mix3(o, GROUT, GROUT, 0);
        const gn = n(u * 300, v * 300, 300, 300) * 0.06;
        o.r -= gn; o.g -= gn; o.b -= gn;
        o.h = -2.2; o.ro = 0.92; o.m = 0;
        return;
      }
      const tone = (hv - 0.5) * 0.03 + (cl - 0.5) * 0.04 - vein * 0.022;
      o.r = BASE[0] + tone + 0.004; o.g = BASE[1] + tone; o.b = BASE[2] + tone - 0.006;
      // canto ligeramente redondeado y una mínima diferencia de plano entre baldosas
      o.h = -2.2 * (1 - sstep(1.4, 4.5, e)) + (lu - 0.5) * hx * 2.5 + (lv - 0.5) * hy * 2.5 + (cl - 0.5) * 0.08;
      o.ro = clamp(0.11 + sstep(0.45, 0.8, smudge) * 0.07 + (1 - sstep(1.4, 3.5, e)) * 0.3, 0, 1);
      o.m = sstep(1.4, 3.0, e);
    }, true);
  }

  /* piso de madera: tablas de roble tostado de 0.20 m de ancho y 1.20 / 1.60 / 2.40 m de largo, con las
     juntas de punta trabadas, microbisel en los cuatro cantos y laca satinada. La textura cubre
     2.40 m de ancho (12 tablas, u) por 4.80 m a lo largo de las tablas (v). Cada tabla tiene su propio
     tono y su corte: veta en catedral (arcos) o veta recta, poro abierto del roble y algún nudo pequeño. */
  const PLANK = { w: 0.2, across: 2.4, along: 4.8, light: 0xa8835d, base: 0x8a6541, dark: 0x593b23 };
  function plankMaps() {
    const n = valueNoise(103), n2 = valueNoise(131), n3 = valueNoise(157), PU = 768, PV = 1536;
    const L0 = hex3(PLANK.light), B0 = hex3(PLANK.base), D0 = hex3(PLANK.dark), NC = Math.round(PLANK.across / PLANK.w);
    const LENS = [1.2, 1.6, 2.4], cols = [];
    for (let c = 0; c < NC; c++) cols.push({ len: LENS[Math.floor(hash2(c + 3, 71) * 3)], off: hash2(c + 5, 83) * 2.4 });
    return bakePBR(PU, PV, 1.4, (u, v, o) => {
      const X = u * PLANK.across, Y = v * PLANK.along, c = Math.floor(X / PLANK.w), col = cols[c];
      const a = X - c * PLANK.w, yy = Y + col.off, p = Math.floor(yy / col.len), b = yy - p * col.len;
      const m = Math.round(PLANK.along / col.len), id = ((p % m) + m) % m, h = hash2(c * 13 + id + 1, id * 7 + c + 2), h2 = hash2(c + id * 5 + 9, c * 3 + 11);
      const ox = h * 40, oy = h2 * 40;                                      // cada tabla, su propio trozo de madera
      const warp = fbm(n, a * 8 + ox, b * 1.2 + oy, 4096, 4096, 3) - 0.5;
      // anillos: arcos de catedral (corte plano) o líneas rectas (corte radial)
      const c0 = 0.04 + h2 * 0.12, cath = h < 0.62;
      const g = cath ? (a - c0) * (a - c0) * 1100 + b * (5 + h * 4) + warp * 3.5 : a * 70 + warp * 4;
      const s1 = g - Math.floor(g);
      const late = sstep(0.5, 0.82, s1) * (1 - sstep(0.9, 1, s1));
      const pore = sstep(0.62, 0.86, n2(a * 110 + ox, b * 7 + oy, 4096, 4096)) * (0.5 + late * 0.5);   // poro abierto del roble
      const ray = cath ? 0 : sstep(0.78, 0.92, n3(a * 90 + ox, b * 4 + oy, 4096, 4096)) * 0.5;        // reflejos del radio medular
      const cloud = fbm(n3, a * 3 + ox, b * 0.8 + oy, 4096, 4096, 3) - 0.5;
      // nudo pequeño en una de cada cuatro tablas
      let knot = 0;
      if (h2 < 0.25) { const kx = (a - (0.05 + h * 0.1)) * 1000, ky = (b - col.len * (0.2 + h2 * 2.4)) * 1000 / 1.6, d = Math.sqrt(kx * kx + ky * ky); knot = 1 - sstep(3, 7 + h * 5, d); }
      const tone = (h - 0.5) * 0.3 + (h2 - 0.5) * 0.12;
      const t = clamp(0.36 + tone + late * 0.3 + pore * 0.12 + cloud * 0.28 - ray * 0.12 + knot * 0.55, 0, 1);
      if (t < 0.5) mix3(o, L0, B0, t * 2); else mix3(o, B0, D0, (t - 0.5) * 2);
      // microbisel en los cantos largos y en las puntas, con la junta casi cerrada al fondo
      const eA = Math.min(a, PLANK.w - a) * 1000, eB = Math.min(b, col.len - b) * 1000, e = Math.min(eA, eB);
      const bev = 1 - sstep(0.4, 1.8, e), gap = 1 - sstep(0.15, 0.55, e);
      const k = (1 - bev * 0.22) * (1 - gap * 0.5);
      o.r *= k; o.g *= k; o.b *= k;
      o.h = -bev * 1.6 - gap * 0.6 - pore * 0.55 - late * 0.12 - knot * 0.3;
      o.ro = clamp(0.36 + pore * 0.22 + (cloud * 0.08) + bev * 0.2 + gap * 0.4, 0, 1);
      o.m = 1 - bev * 0.55 - gap * 0.45 - pore * 0.25;
    }, true);
  }

  /* estuco de muros y cielo: la textura cubre 2 m */
  function plasterMaps() {
    const n = valueNoise(41);
    return bakePBR(512, 512, 0.9, (u, v, o) => {
      const big = fbm(n, u * 6, v * 6, 6, 6, 4), fine = n(u * 160, v * 160, 160, 160), mid = n(u * 48, v * 48, 48, 48);
      const k = 0.975 + (big - 0.5) * 0.04 + (fine - 0.5) * 0.015;
      o.r = k; o.g = k; o.b = k;
      o.h = big * 1.6 + mid * 0.5 + fine * 0.35;
      o.ro = clamp(0.86 + (fine - 0.5) * 0.12 + (big - 0.5) * 0.08, 0, 1);
    }, true);
  }

  /* concreto de las materas: la textura cubre 1 m */
  function concreteMaps() {
    const n = valueNoise(57), n2 = valueNoise(83);
    return bakePBR(512, 512, 1.2, (u, v, o) => {
      const big = fbm(n, u * 5, v * 5, 5, 5, 5), fine = n2(u * 140, v * 140, 140, 140);
      const pit = sstep(0.84, 0.95, n2(u * 70 + 0.37, v * 70 + 0.71, 70, 70)) * sstep(0.4, 0.7, n(u * 9, v * 9, 9, 9));
      const k = 0.9 + (big - 0.5) * 0.22 + (fine - 0.5) * 0.08 - pit * 0.35;
      o.r = k; o.g = k * 0.99; o.b = k * 0.965;
      o.h = big * 2 + fine * 0.7 - pit * 2.5;
      o.ro = clamp(0.84 + (fine - 0.5) * 0.12 + pit * 0.1, 0, 1);
    }, true);
  }

  /* micro relieve: melamina lisa, pintura electrostática y lacas (sin color) */
  function stippleMaps(seed, amp, rough, spread) {
    const n = valueNoise(seed);
    return bakePBR(256, 256, amp, (u, v, o) => {
      const a = n(u * 64, v * 64, 64, 64), b = n(u * 128 + 0.5, v * 128 + 0.5, 128, 128);
      o.h = a * 0.7 + b * 0.5;
      o.ro = clamp(rough + (a - 0.5) * spread, 0, 1);
    }, false);
  }

  /* metal cepillado: rayado fino a lo largo de u */
  function brushedMaps(rough) {
    const n = valueNoise(97);
    return bakePBR(256, 256, 0.6, (u, v, o) => {
      const s = n(u * 3, v * 256, 3, 256) * 0.6 + n(u * 7, v * 128 + 0.3, 7, 128) * 0.4;
      o.h = s;
      o.ro = clamp(rough + (s - 0.5) * 0.18, 0, 1);
    }, false);
  }

  /* lámina perforada: 4 × 4 perforaciones de 25 mm por repetición */
  function pegMaps() {
    return bakePBR(128, 128, 2.2, (u, v, o) => {
      const fx = (u * 4) % 1 - 0.5, fy = (v * 4) % 1 - 0.5, d = Math.sqrt(fx * fx + fy * fy) * 25;   // mm al centro del agujero
      const hole = 1 - sstep(2.9, 3.6, d);
      const k = 0.95 - hole * 0.72;
      o.r = k; o.g = k * 0.995; o.b = k * 0.985;
      o.h = -hole * 3 - (1 - sstep(3.0, 4.5, d)) * 0.8;
      o.ro = 0.48 + hole * 0.4;
    }, true);
  }

  /* resplandor: rectángulo redondeado difuso (para LED rasante y gargantas de luz) */
  E.glowTexture = function (w, h, pad, radius) {
    const sc = 96, W = Math.round((w + pad * 2) * sc), H = Math.round((h + pad * 2) * sc);
    const c = canvas(W, H), g = c.getContext('2d');
    // la forma se dibuja fuera del lienzo y solo cae su sombra: un difuminado que funciona en todos los navegadores
    g.shadowColor = '#fff'; g.shadowBlur = pad * sc * 0.85; g.shadowOffsetX = W * 2;
    g.fillStyle = '#fff';
    const x = pad * sc - W * 2, y = pad * sc, ww = w * sc, hh = h * sc, rr = Math.max(1, Math.min(radius * sc, ww / 2, hh / 2));
    for (let i = 0; i < 2; i++) {
      g.beginPath();
      g.moveTo(x + rr, y); g.arcTo(x + ww, y, x + ww, y + hh, rr); g.arcTo(x + ww, y + hh, x, y + hh, rr); g.arcTo(x, y + hh, x, y, rr); g.arcTo(x, y, x + ww, y, rr); g.closePath();
      g.fill();
    }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    return t;
  };
  /* sombra de contacto bajo un mueble: asienta el volumen en el piso */
  E.contactShadow = function (w, d, op) {
    const pad = 0.28;
    const m = new T.Mesh(new T.PlaneGeometry(w + pad * 2, d + pad * 2), new T.MeshBasicMaterial({ map: E.glowTexture(w, d, pad, 0.06), color: 0x1a140c, transparent: true, opacity: (op == null ? 0.34 : op) * (P.on ? 0.55 : 1), depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.004; m.renderOrder = 1; m.raycast = function () {};
    E.noReflect.push(m);
    return m;
  };
  let _softDot = null;
  E.softDot = function () {
    if (_softDot) return _softDot;
    const c = canvas(128, 128), g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    _softDot = new T.CanvasTexture(c); _softDot.colorSpace = T.SRGBColorSpace;
    return _softDot;
  };
  let _softLine = null;
  E.softLine = function () {
    if (_softLine) return _softLine;
    const c = canvas(8, 128), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 8, 128);
    _softLine = new T.CanvasTexture(c); _softLine.colorSpace = T.SRGBColorSpace;
    return _softLine;
  };

  /* ------------------------------------------------------------ materiales */
  const LED_RGB = [3.4, 2.5, 1.5];
  E.ledMats = []; E.glowMats = []; E.ledLights = []; E.emissiveMats = [];
  E.ledLevel = 1;
  E.setLed = function (k) {
    E.ledLevel = k;
    E.ledMats.forEach((m) => m.color.setRGB(lerp(0.16, m.userData.rgb[0], k), lerp(0.15, m.userData.rgb[1], k), lerp(0.14, m.userData.rgb[2], k)));
    E.glowMats.forEach((m) => { m.opacity = m.userData.op * k; });
    E.ledLights.forEach((l) => { l.intensity = l.userData.i * k; });
    E.emissiveMats.forEach((m) => { m.emissiveIntensity = m.userData.ei * k; });
    if (L.mats) L.mats.fondoLit.emissiveIntensity = 0.62 * k;
    E.invalidate();
  };
  E.ledMaterial = function (rgb) {
    const m = new T.MeshBasicMaterial();
    m.userData.rgb = rgb || LED_RGB; m.color.setRGB(m.userData.rgb[0], m.userData.rgb[1], m.userData.rgb[2]);
    E.ledMats.push(m); return m;
  };
  E.glowMaterial = function (tex, color, op) {
    const m = new T.MeshBasicMaterial({ map: tex, color: color || 0xffc98a, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, side: T.DoubleSide });
    m.userData.op = op; E.glowMats.push(m); return m;
  };

  function makeMaterials() {
    const S = (o) => new T.MeshStandardMaterial(o), Ph = (o) => new T.MeshPhysicalMaterial(o);
    const rep = (t, x, y) => { const c = t.clone(); c.repeat.set(x, y); return c; };
    const ns = (k) => new T.Vector2(k, k);
    // 1 unidad de UV en G.box = 1.30 m a lo largo y 0.65 m a lo ancho
    const set = (maps, mx, my, k, o) => Object.assign({ map: maps.map ? rep(maps.map, mx, my) : null, normalMap: rep(maps.normalMap, mx, my), normalScale: ns(k), roughnessMap: rep(maps.roughnessMap, mx, my), roughness: 1 }, o);
    const wood = woodMaps(7, 0xe8d0ab, 0xc9a47a, 0x8f6a45);
    const slat = woodMaps(21, 0xdcbd94, 0xbf966a, 0x7a5637, 512);
    const pl = plasterMaps(), cc = concreteMaps(), peg = pegMaps();
    const smooth = stippleMaps(5, 0.35, 0.42, 0.1), powder = stippleMaps(13, 0.7, 0.55, 0.14), fiber = stippleMaps(31, 1.1, 0.82, 0.12);
    const brushed = brushedMaps(0.3), satin = brushedMaps(0.16);
    E.tile = tileMaps();
    E.plank = plankMaps();
    const st = (c, rough, o) => S(set(smooth, 1.3 / 0.3, 0.65 / 0.3, 0.16, Object.assign({ color: c, roughness: rough / 0.42, map: null }, o)));
    const M = {
      muro: S(set(pl, 0.65, 0.325, 0.55, { color: 0xece7de })),
      cielo: S(set(pl, 0.65, 0.325, 0.4, { color: 0xf0ece5 })),
      carbon: S(set(powder, 1.3 / 0.4, 0.65 / 0.4, 0.22, { color: 0x232325, metalness: 0.15, map: null, roughness: 1.05 })),
      carbonMate: S(set(powder, 1.3 / 0.4, 0.65 / 0.4, 0.3, { color: 0x2c2c2e, map: null, roughness: 1.5 })),
      // fachada: panel de aluminio compuesto negro, satinado y con barniz; marco del vano en bronce cepillado
      fachada: Ph({ color: 0x0f0f11, roughness: 0.36, metalness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.08, normalMap: rep(smooth.normalMap, 1.3 / 0.6, 0.65 / 0.6), normalScale: ns(0.04) }),
      bronce: S(set(brushed, 1.3 / 0.5, 0.65 / 0.5, 0.12, { color: 0xb4915e, metalness: 1, map: null, roughness: 1.05 })),
      melBlanca: st(0xf2f0eb, 0.44),
      melRovere: S(set(wood, 1, 1, 0.42, { color: 0xffffff })),
      melPlomo: st(0x4c4a47, 0.48),
      fondo: st(0xf6f4ef, 0.6),
      fondoLit: st(0xf8f1e4, 0.6, { emissive: 0xffc98c, emissiveIntensity: 0.62 }),
      mdf15: S(set(fiber, 1.3 / 0.25, 0.65 / 0.25, 0.35, { color: 0xb8956b, map: null })),
      mdf55: S(set(fiber, 1.3 / 0.25, 0.65 / 0.25, 0.35, { color: 0xc4a379, map: null })),
      laca: Ph({ color: 0xf6f5f2, roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.12, normalMap: rep(smooth.normalMap, 1.3 / 0.3, 0.65 / 0.3), normalScale: ns(0.05) }),
      negro: st(0x19191b, 0.7),
      acero: S(set(powder, 1.3 / 0.25, 0.65 / 0.25, 0.3, { color: 0x1b1b1d, metalness: 0.45, map: null, roughness: 0.9 })),
      alu: S(set(brushed, 1.3 / 0.5, 0.65 / 0.5, 0.15, { color: 0xc6c8cb, metalness: 0.9, map: null, roughness: 1.15 })),
      inox: S(set(satin, 1.3 / 0.5, 0.65 / 0.5, 0.1, { color: 0xd9dbde, metalness: 1, map: null, roughness: 1.3 })),
      gris: S(set(powder, 1.3 / 0.3, 0.65 / 0.3, 0.25, { color: 0x8d9094, metalness: 0.55, map: null, roughness: 0.9 })),
      plastico: S({ color: 0x141416, roughness: 0.62 }),
      equipo: S(set(powder, 1.3 / 0.3, 0.65 / 0.3, 0.12, { color: 0x2b2c2f, metalness: 0.2, map: null, roughness: 0.75 })),
      cemento: S(set(cc, 1.6, 0.75, 0.9, { color: 0xb3b1ab })),
      perforada: S({ map: peg.map, normalMap: peg.normalMap, normalScale: ns(0.8), roughnessMap: peg.roughnessMap, roughness: 1, metalness: 0.1 }),
      vidrio: Ph({ color: 0xdcefea, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, side: T.DoubleSide, envMapIntensity: 1.7, ior: 1.52, specularIntensity: 1 }),
      vidrioOscuro: Ph({ color: 0x1b2026, roughness: 0.05, transparent: true, opacity: 0.5, depthWrite: false, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.03 }),
      acrilico: Ph({ color: 0xffffff, roughness: 0.03, transparent: true, opacity: 0.13, depthWrite: false, side: T.DoubleSide, envMapIntensity: 1.8, ior: 1.49 }),
      escarcha: S({ color: 0xffffff, roughness: 0.8, transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide }),
      liston: S(set(slat, 1, 1, 0.5, { color: 0xffffff })),
      listonFondo: S({ color: 0x5b4330, roughness: 0.8 }),
      decor: Ph({ vertexColors: true, roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.35 }),
      decorMate: S({ vertexColors: true, roughness: 0.9 }),
      led: E.ledMaterial(),
      ledFrio: E.ledMaterial([1.6, 2.3, 3.4]),
      ledBlanco: E.ledMaterial([3.2, 3.0, 2.7])
    };
    for (const k in M) M[k].name = k;
    L.mats = M;
    return M;
  }

  /* fantasma para aislar un mueble y para resaltar un material */
  E.ghost = new T.MeshBasicMaterial({ color: 0x9a968f, transparent: true, opacity: 0.07, depthWrite: false });
  E.ghostPart = new T.MeshBasicMaterial({ color: 0xb9b4ac, transparent: true, opacity: 0.16, depthWrite: false });
  E.edgeMat = new T.LineBasicMaterial({ color: 0xff9a3d, transparent: true, opacity: 0.95 });
  E.edgeSoft = new T.LineBasicMaterial({ color: 0x2b2b2e, transparent: true, opacity: 0.38 });

  /* ------------------------------------------------------------------ init */
  // balance de blancos de «cámara»: compensa la dominante de 3000 K de los LED, como haría un fotógrafo
  const P = (E.post = { on: false, ao: true, bloom: true, n: 0, max: 32, jit: false, exposure: 0.92, wb: [0.95, 0.99, 1.07] });
  function canPost() {
    if (/[?&]lite\b/.test(location.search)) return false;
    try {
      const c = document.createElement('canvas'), gl = c.getContext('webgl2');
      if (!gl) return false;
      const ok = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
      const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      return ok;
    } catch (e) { return false; }
  }
  /* el mismo ACES de three.js, para hallar el color HDR que tras el tone mapping da el fondo exacto */
  function aces(c) {
    const r = c[0] / 0.6, g = c[1] / 0.6, b = c[2] / 0.6;
    const f = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
    const x = f(0.59719 * r + 0.35458 * g + 0.04823 * b), y = f(0.076 * r + 0.90834 * g + 0.01566 * b), z = f(0.0284 * r + 0.13383 * g + 0.83777 * b);
    return [clamp(1.60475 * x - 0.53108 * y - 0.07367 * z, 0, 1), clamp(-0.10208 * x + 1.10813 * y - 0.00605 * z, 0, 1), clamp(-0.00327 * x - 0.07276 * y + 1.07602 * z, 0, 1)];
  }
  function acesInverse(hex, exposure, wb) {
    const t = new T.Color(hex), goal = [t.r, t.g, t.b], x = goal.slice();
    for (let i = 0; i < 80; i++) { const y = aces(x.map((v, k) => v * exposure * wb[k])); for (let k = 0; k < 3; k++) x[k] = Math.max(0, x[k] + (goal[k] - y[k]) * 1.4); }
    return new T.Color().setRGB(x[0], x[1], x[2]);
  }

  E.init = function (canvasEl) {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    E.mobile = coarse || Math.min(window.innerWidth, window.innerHeight) < 620;
    P.on = canPost();
    if (E.mobile) P.max = 12;
    const renderer = new T.WebGLRenderer({ canvas: canvasEl, antialias: !P.on, powerPreference: 'high-performance' });
    E.renderer = renderer;
    maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    E.dprMax = Math.min(window.devicePixelRatio || 1, E.mobile ? 1.6 : 2);
    E.dpr = E.dprMax;
    renderer.setPixelRatio(E.dpr);
    renderer.outputColorSpace = T.SRGBColorSpace;
    // con postproceso el tone mapping se hace al final, sobre la imagen HDR completa
    renderer.toneMapping = P.on ? T.NoToneMapping : T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;

    const scene = (E.scene = new T.Scene());
    const bg = P.on ? acesInverse(BG, P.exposure, P.wb) : new T.Color(BG);
    scene.background = bg;
    scene.fog = new T.Fog(bg.clone(), 17, 46);

    const camera = (E.camera = new T.PerspectiveCamera(36, 1, 0.08, 140));

    makeMaterials();
    buildEnvironment();
    buildLights();
    buildFloor();
    if (P.on) setupPost();

    E.resize();
    window.addEventListener('resize', () => E.resize());
    if (window.ResizeObserver) new ResizeObserver(() => E.resize()).observe(canvasEl.parentElement);
    bindControls(canvasEl);
    requestAnimationFrame(frame);
    return E;
  };

  /* entorno provisional (un cuarto genérico); E.captureEnv lo cambia por el propio local */
  function buildEnvironment() {
    const pm = new T.PMREMGenerator(E.renderer);
    const s = new T.Scene();
    const basic = (r, g, b) => { const m = new T.MeshBasicMaterial({ side: T.DoubleSide }); m.color.setRGB(r, g, b); return m; };
    const room = new T.Mesh(new T.BoxGeometry(20, 10, 20), basic(0.36, 0.33, 0.30)); room.position.y = 4; s.add(room);
    const floor = new T.Mesh(new T.PlaneGeometry(20, 20), basic(0.24, 0.23, 0.21)); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.95; s.add(floor);
    const pane = (w, h, x, y, z, rx, ry, k, warm) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), basic(k, k * (warm ? 0.86 : 0.98), k * (warm ? 0.66 : 0.95))); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m); };
    pane(9, 5, 0, 8.6, 0, Math.PI / 2, 0, 4.2, false);        // lucernario central
    pane(3, 12, -6, 8.6, 0, Math.PI / 2, 0, 3.2, true);
    pane(3, 12, 6, 8.6, 0, Math.PI / 2, 0, 3.2, true);
    pane(8, 3, 0, 4, -9.8, 0, 0, 3.2, true);                // vitrinas cálidas
    pane(8, 3, 0, 4, 9.8, 0, Math.PI, 4, false);
    pane(6, 2.4, -9.8, 3.5, 0, 0, Math.PI / 2, 2.6, true);
    pane(6, 2.4, 9.8, 3.5, 0, 0, -Math.PI / 2, 2.6, true);
    E.scene.environment = pm.fromScene(s, 0.035).texture;
    pm.dispose();
  }

  /* Reflejos e iluminación indirecta del propio local: una cámara cúbica en el
     centro de la sala fotografía la escena ya armada y ese entorno pasa a ser la
     luz ambiental. Se hace dos veces, así la segunda captura ya trae el rebote
     de luz de la primera (iluminación global aproximada). */
  E.captureEnv = function () {
    const r = E.renderer, sc = E.scene;
    const crt = new T.WebGLCubeRenderTarget(E.mobile ? 128 : 256, { type: T.HalfFloatType });
    const cc = new T.CubeCamera(0.05, 60, crt);
    cc.position.set(0.15, 1.45, 0.4);
    const k = E.reflect.uni.uReflK.value, fog = sc.fog;
    E.reflect.uni.uReflK.value = 0; sc.fog = null;
    // los halos dibujados (resplandores aditivos) no son luz real: no entran a la captura
    const hid = [];
    sc.traverse((o) => { if (o.visible && o.material && (o.material.blending === T.AdditiveBlending || (o.material.transparent && o.material.depthWrite === false && o.material.isMeshBasicMaterial))) { o.visible = false; hid.push(o); } });
    const pm = new T.PMREMGenerator(r);
    let env = null;
    for (let b = 0; b < 2; b++) {
      cc.update(r, sc);
      const next = pm.fromCubemap(crt.texture);
      if (env) env.dispose();
      env = next; sc.environment = env.texture;
    }
    sc.fog = fog; E.reflect.uni.uReflK.value = k;
    hid.forEach((o) => { o.visible = true; });
    pm.dispose(); crt.dispose();
    E.setEnvK(E.envK);
    E.invalidate(3);
  };

  function buildLights() {
    const sc = E.scene;
    E.hemi = new T.HemisphereLight(0xfff1de, 0xc9bfb0, P.on ? 0.26 : 0.42); sc.add(E.hemi);
    const key = (E.key = new T.DirectionalLight(0xffefd8, 1.15));
    key.position.set(2.6, 10.5, 5.4); key.target.position.set(0, 0, -0.2);
    E.keyBase = key.position.clone();
    key.castShadow = true;
    const sh = key.shadow; sh.mapSize.set(E.mobile ? 1536 : 3072, E.mobile ? 1536 : 3072);
    sh.camera.left = -6.5; sh.camera.right = 6.5; sh.camera.top = 7.5; sh.camera.bottom = -7; sh.camera.near = 2; sh.camera.far = 22;
    sh.bias = -0.0004; sh.normalBias = 0.02; sh.radius = 5; sh.blurSamples = 12;
    sc.add(key, key.target);
    const fill = new T.DirectionalLight(0xe9f0ff, P.on ? 0.2 : 0.3); fill.position.set(-6, 6, 3); sc.add(fill);
    // luz cálida del interior (rieles y gargantas), sin sombras
    const warm = (x, y, z, i, d) => { const p = new T.PointLight(0xffd9ad, i, d, 1.6); p.position.set(x, y, z); p.userData.i = i; sc.add(p); E.ledLights.push(p); };
    warm(-1.2, 2.5, 1.6, 9, 9);
    warm(1.3, 2.5, 0.0, 9, 9);
    warm(0, 2.3, -1.6, 7, 7);
  }
  /* foco real (riel, colgante): se atenúa con el resto de la iluminación del local */
  E.spot = function (pos, aim, i, angle, pen, shadow, color) {
    const s = new T.SpotLight(color || 0xffe2bd, i, 0, angle, pen, 2);
    s.position.copy(pos); s.target.position.copy(aim); s.userData.i = i;
    if (shadow && !E.mobile) {
      s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0002; s.shadow.normalBias = 0.015;
      s.shadow.camera.near = 0.2; s.shadow.camera.far = 6;
    }
    E.scene.add(s, s.target); E.ledLights.push(s);
    return s;
  };

  /* ------------------------------------------- pisos con reflejo en espejo
     Dentro del local, tablas de madera a lo largo del fondo; afuera, el porcelanato del pasillo.
     El cambio queda bajo el umbral de acero de la fachada (z = 3.5). */
  E.floorRect = [-3.15, -3.65, 3.15, 3.5];           // x0, z0, x1, z1: el local, hasta debajo de los muros
  /* planta rectangular (con un hueco opcional) en el plano del piso; el uv queda en metros: (x, −z) */
  E.floorGeometry = function (x0, z0, x1, z1, hole) {
    const V = (x, z) => new T.Vector2(x, -z);
    const sh = new T.Shape([V(x0, z1), V(x1, z1), V(x1, z0), V(x0, z0)]);
    if (hole) sh.holes.push(new T.Path([V(hole[0], hole[3]), V(hole[0], hole[1]), V(hole[2], hole[1]), V(hole[2], hole[3])]));
    const g = new T.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
    return g;
  };
  /* mapas de un piso a escala: per = metros que cubre la textura (o [ancho, largo]); org = punto (x, z) donde arranca la trama */
  E.floorMaps = function (maps, per, org) {
    const fr = (a) => ((a % 1) + 1) % 1, pu = per[0] || per, pv = per[1] || per;
    const out = {};
    ['map', 'normalMap', 'roughnessMap'].forEach((k) => {
      const c = maps[k].clone(); c.repeat.set(1 / pu, 1 / pv); c.offset.set(fr(-org[0] / pu), fr(org[1] / pv)); c.anisotropy = maxAniso; out[k] = c;
    });
    return out;
  };
  function floorMaterial(name, maps, nk, env, reflM) {
    const mat = new T.MeshStandardMaterial(Object.assign({ normalScale: new T.Vector2(nk, nk), roughness: 1, metalness: 0, envMapIntensity: env }, maps));
    mat.name = name;
    const uni = E.reflect.uni, reflMul = { value: reflM };
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.tRefl = uni.tRefl; sh.uniforms.uRes = uni.uRes; sh.uniforms.uReflK = uni.uReflK; sh.uniforms.uReflM = reflMul;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tRefl;\nuniform vec2 uRes;\nuniform float uReflK;\nuniform float uReflM;')
        .replace('#include <opaque_fragment>', [
          // el relieve del piso (desnivel entre baldosas, bisel y poro de las tablas) quiebra el reflejo
          'vec2 ruv = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes + clamp(normal.xy - nonPerturbedNormal.xy, -0.03, 0.03) * 0.3;',
          'vec2 px = (1.8 + roughnessFactor * 10.0) / uRes;',
          'vec3 rf = texture2D(tRefl, ruv).rgb * 0.28;',
          'rf += texture2D(tRefl, ruv + vec2(px.x, 0.0)).rgb * 0.12 + texture2D(tRefl, ruv - vec2(px.x, 0.0)).rgb * 0.12;',
          'rf += texture2D(tRefl, ruv + vec2(0.0, px.y * 2.0)).rgb * 0.12 + texture2D(tRefl, ruv - vec2(0.0, px.y * 2.0)).rgb * 0.12;',
          'rf += texture2D(tRefl, ruv + px * 1.6).rgb * 0.06 + texture2D(tRefl, ruv - px * 1.6).rgb * 0.06;',
          'rf += texture2D(tRefl, ruv + vec2(px.x, -px.y) * 1.6).rgb * 0.06 + texture2D(tRefl, ruv - vec2(px.x, -px.y) * 1.6).rgb * 0.06;',
          'float ndv = clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0);',
          'float fres = 0.3 + 0.7 * pow(1.0 - ndv, 2.2);',
          'float gloss = 1.0;',
          '#ifdef USE_ROUGHNESSMAP',
          'gloss = texelRoughness.b;',
          '#endif',
          'gloss *= 1.0 - smoothstep(0.1, 0.45, roughnessFactor);',
          'outgoingLight = mix(outgoingLight, rf, clamp(uReflK * uReflM * fres * gloss, 0.0, 1.0));',
          '#include <opaque_fragment>'
        ].join('\n'));
    };
    return mat;
  }
  function buildFloor() {
    E.reflect = { on: true, scale: E.mobile ? 0.4 : 0.55, k: 0.62 };
    const rt = (E.reflect.rt = P.on
      ? new T.WebGLRenderTarget(4, 4, { type: T.HalfFloatType, minFilter: T.LinearFilter, magFilter: T.LinearFilter })
      : new T.WebGLRenderTarget(4, 4, { type: T.UnsignedByteType, colorSpace: T.SRGBColorSpace, minFilter: T.LinearFilter, magFilter: T.LinearFilter }));
    E.reflect.uni = { tRefl: { value: rt.texture }, uRes: { value: new T.Vector2(1, 1) }, uReflK: { value: E.reflect.k } };
    const fr = E.floorRect, H = 45;
    // las tablas y la trama de 0.60 arrancan en la cara interior del muro izquierdo y en la fachada
    E.floorMats = {
      wood: floorMaterial('piso de madera', E.floorMaps(E.plank, [PLANK.across, PLANK.along], [-3, 3.5]), 0.6, 0.45, 0.6),
      tile: floorMaterial('piso pasillo', E.floorMaps(E.tile, 2.4, [-3, 3.5]), 0.55, 0.5, 1)
    };
    const inside = (E.floor = new T.Mesh(E.floorGeometry(fr[0], fr[1], fr[2], fr[3]), E.floorMats.wood));
    const corridor = new T.Mesh(E.floorGeometry(-H, -H, H, H, fr), E.floorMats.tile);
    [inside, corridor].forEach((f) => { f.receiveShadow = true; f.userData.floor = true; E.scene.add(f); });
    E.corridor = corridor;
    E.vcam = new T.PerspectiveCamera();
    E.vcam.matrixAutoUpdate = false; E.vcam.matrixWorldAutoUpdate = false;
    E.noReflect = [inside, corridor];
  }
  const _mirror = new T.Matrix4().makeScale(1, -1, 1);
  const _flipY = new T.Matrix4().makeScale(1, -1, 1);
  function renderReflection() {
    const r = E.renderer, cam = E.camera, v = E.vcam;
    v.matrixWorld.multiplyMatrices(_mirror, cam.matrixWorld);
    v.matrixWorldInverse.copy(v.matrixWorld).invert();
    v.projectionMatrix.multiplyMatrices(_flipY, cam.projectionMatrix);
    v.projectionMatrixInverse.copy(v.projectionMatrix).invert();
    v.layers.mask = cam.layers.mask;
    const hidden = [];
    E.noReflect.forEach((o) => { if (o.visible) { o.visible = false; hidden.push(o); } });
    r.setRenderTarget(E.reflect.rt);
    r.clear();
    r.render(E.scene, v);
    r.setRenderTarget(null);
    hidden.forEach((o) => { o.visible = true; });
  }

  /* ---------------------------------------------------------------- tamaño */
  E.size = { w: 1, h: 1, pw: 1, ph: 1 };
  E.resize = function (force) {
    const el = E.renderer.domElement.parentElement;
    const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
    if (!force && w === E.size.w && h === E.size.h) return;
    E.size.w = w; E.size.h = h;
    // con postproceso se fija un presupuesto de píxeles; el refinamiento en reposo pone el resto de la nitidez
    E.dpr = P.on ? Math.min(E.dprMax, Math.max(1, Math.sqrt((E.mobile ? 1.6e6 : 3.6e6) / (w * h)))) : E.dprMax;
    E.renderer.setPixelRatio(E.dpr);
    E.renderer.setSize(w, h, false);
    const pw = Math.floor(w * E.dpr), ph = Math.floor(h * E.dpr);
    E.size.pw = pw; E.size.ph = ph;
    E.reflect.rt.setSize(Math.max(2, Math.round(pw * E.reflect.scale)), Math.max(2, Math.round(ph * E.reflect.scale)));
    E.reflect.uni.uRes.value.set(pw, ph);
    if (P.on) resizePost(pw, ph, w, h);
    applyProjection();
    E.invalidate(3);
    if (E.onResize) E.onResize(w, h);
  };
  /* desplazamiento del centro de la vista (deja libre el espacio que tapa el panel) */
  const off = { x: 0, y: 0, gx: 0, gy: 0 };
  const jit = { x: 0, y: 0 };
  E.setViewOffset = function (x, y, instant) { off.gx = x; off.gy = y; if (instant) { off.x = x; off.y = y; applyProjection(); } E.invalidate(); };
  function applyProjection() {
    const c = E.camera, w = E.size.w, h = E.size.h;
    c.aspect = w / h;
    if (Math.abs(off.x) > 0.5 || Math.abs(off.y) > 0.5 || jit.x || jit.y) c.setViewOffset(w, h, off.x + jit.x, off.y + jit.y, w, h); else c.clearViewOffset();
    c.updateProjectionMatrix();
  }
  E.usable = function () { return { w: E.size.w - Math.abs(off.gx) * 2, h: E.size.h - Math.abs(off.gy) * 2 }; };

  /* ---------------------------------------------------------------- cámara */
  const cur = { tx: 0, ty: 1, tz: 0, th: 0.6, ph: 0.9, r: 30 };
  const goal = Object.assign({}, cur);
  E.cam = { cur, goal };
  let fly = null;
  const LIM = { phMin: 0.02, phMax: 1.545, rMin: 0.9, rMax: 26 };
  E.autoRotate = false;
  function normAngle(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }

  E.flyTo = function (v, dur, opt) {
    opt = opt || {};
    const to = { tx: v.target ? v.target.x : goal.tx, ty: v.target ? v.target.y : goal.ty, tz: v.target ? v.target.z : goal.tz, th: v.theta != null ? v.theta : goal.th, ph: v.phi != null ? v.phi : goal.ph, r: v.radius != null ? v.radius : goal.r };
    to.ph = clamp(to.ph, LIM.phMin, LIM.phMax);
    to.th = cur.th + normAngle(to.th - cur.th);
    if (E.reduced || dur === 0) { Object.assign(cur, to); Object.assign(goal, to); fly = null; E.invalidate(3); if (opt.done) opt.done(); return; }
    fly = { from: Object.assign({}, cur), to, t0: performance.now() + (opt.delay || 0) * 1000, dur: (dur || 1.4) * 1000, ease: opt.ease || E.ease.inOut, done: opt.done };
    Object.assign(goal, to);
    E.invalidate();
  };
  E.stopFly = function () { if (fly) { fly = null; Object.assign(goal, cur); } };
  E.camPos = new T.Vector3();
  function updateCamera(dt, now) {
    let moving = false;
    if (fly) {
      if (now >= fly.t0) {
        const k = clamp((now - fly.t0) / fly.dur, 0, 1), e = fly.ease(k);
        for (const key in cur) cur[key] = lerp(fly.from[key], fly.to[key], e);
        if (k >= 1) { const d = fly.done; fly = null; if (d) d(); }
      }
      moving = true;
    } else {
      if (E.autoRotate) { goal.th += dt * 0.16; moving = true; }
      const a = 1 - Math.exp(-dt * 9);
      for (const key in cur) {
        const d = goal[key] - cur[key];
        if (Math.abs(d) > 1e-4) { cur[key] += d * a; moving = true; } else cur[key] = goal[key];
      }
    }
    if (Math.abs(off.gx - off.x) > 0.5 || Math.abs(off.gy - off.y) > 0.5) {
      const a = 1 - Math.exp(-dt * 7);
      off.x += (off.gx - off.x) * a; off.y += (off.gy - off.y) * a; applyProjection(); moving = true;
    } else if (off.x !== off.gx || off.y !== off.gy) { off.x = off.gx; off.y = off.gy; applyProjection(); moving = true; }
    const sp = Math.sin(cur.ph), c = E.camera;
    c.position.set(cur.tx + cur.r * sp * Math.sin(cur.th), cur.ty + cur.r * Math.cos(cur.ph), cur.tz + cur.r * sp * Math.cos(cur.th));
    c.lookAt(cur.tx, cur.ty, cur.tz);
    c.updateMatrixWorld();
    E.camPos.copy(c.position);
    return moving;
  }

  /* controles: arrastrar gira, rueda o pellizco acerca, botón derecho o dos dedos desplaza */
  function bindControls(el) {
    const pts = new Map();
    let mode = null, lastX = 0, lastY = 0, pinch = 0, moved = 0, downT = 0;
    el.style.touchAction = 'none';
    const userStart = () => { E.stopFly(); if (E.onUserMove) E.onUserMove(); };
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => {
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0; downT = performance.now();
      if (pts.size === 1) { mode = (e.button === 2 || e.button === 1 || e.shiftKey) ? 'pan' : 'rot'; lastX = e.clientX; lastY = e.clientY; }
      else if (pts.size === 2) { mode = 'pinch'; const a = [...pts.values()]; pinch = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); lastX = (a[0].x + a[1].x) / 2; lastY = (a[0].y + a[1].y) / 2; }
    });
    el.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) { if (E.onHover) E.onHover(e); return; }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (mode === 'pinch' && pts.size >= 2) {
        const a = [...pts.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), mx = (a[0].x + a[1].x) / 2, my = (a[0].y + a[1].y) / 2;
        if (pinch > 0) { userStart(); goal.r = clamp(goal.r * (pinch / d), LIM.rMin, LIM.rMax); pan(mx - lastX, my - lastY); }
        pinch = d; lastX = mx; lastY = my; moved += 10; E.invalidate(); return;
      }
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved < 4) return;
      userStart();
      if (mode === 'rot') { goal.th -= dx * 0.0052; goal.ph = clamp(goal.ph - dy * 0.0046, LIM.phMin, LIM.phMax); }
      else if (mode === 'pan') pan(dx, dy);
      E.invalidate();
    });
    const up = (e) => {
      const had = pts.has(e.pointerId); pts.delete(e.pointerId);
      if (had && pts.size === 0 && moved < 6 && performance.now() - downT < 600 && e.type === 'pointerup' && E.onClick) E.onClick(e);
      if (pts.size === 1) { const p = [...pts.values()][0]; lastX = p.x; lastY = p.y; mode = 'rot'; moved = 99; }
      if (pts.size === 0) mode = null;
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', (e) => { if (E.onHover) E.onHover(null); });
    el.addEventListener('wheel', (e) => {
      e.preventDefault(); userStart();
      const k = Math.exp(clamp(e.deltaY, -240, 240) * (e.ctrlKey ? 0.006 : 0.0011));
      goal.r = clamp(goal.r * k, LIM.rMin, LIM.rMax); E.invalidate();
    }, { passive: false });
    function pan(dx, dy) {
      const s = goal.r * 0.00125;
      const cx = Math.cos(goal.th), sx = Math.sin(goal.th);
      const up2 = Math.cos(goal.ph) > 0.5 ? 1 : 0;       // vista cenital: arrastre directo en planta
      goal.tx = clamp(goal.tx - dx * s * cx - dy * s * sx * (up2 ? 1 : 0.9), -7, 7);
      goal.tz = clamp(goal.tz + dx * s * sx - dy * s * cx * (up2 ? 1 : 0.9), -7, 8);
    }
    E.zoomBy = function (k) { userStart(); goal.r = clamp(goal.r * k, LIM.rMin, LIM.rMax); E.invalidate(); };
  }

  /* ---------------------------------------------- corte inteligente de muros */
  E.shells = [];
  E.addShell = function (obj, test) {
    const mats = [];
    obj.traverse((o) => {
      if (!o.material) return;
      o.material = o.material.clone(); o.material.userData.op = o.material.opacity; o.material.userData.tr = o.material.transparent; mats.push(o.material);
      if (o.material.userData.glow) E.glowMats.push(o.material);
      if (o.material.userData.rgb) E.ledMats.push(o.material);
      if (o.material.userData.ei !== undefined) E.emissiveMats.push(o.material);
    });
    const s = { obj, test, a: 1, mats }; E.shells.push(s); return s;
  };
  function updateShells(dt) {
    let ch = false;
    for (const s of E.shells) {
      const g = s.test(E.camPos, cur) ? 1 : 0;
      if (s.a === g) continue;
      s.a = Math.abs(g - s.a) < 0.02 || E.reduced ? g : s.a + (g - s.a) * (1 - Math.exp(-dt * 10));
      const full = s.a >= 0.999;
      for (const m of s.mats) {
        const base = m.userData.glow ? m.userData.op * E.ledLevel : m.userData.op;
        m.opacity = base * s.a;
        const tr = full ? m.userData.tr : true;
        if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
        if (!m.userData.tr) m.depthWrite = s.a > 0.6;
      }
      s.obj.visible = s.a > 0.015;
      ch = true;
    }
    return ch;
  }

  /* =============================================================== postproceso
     Cadena propia, sin dependencias:
       escena HDR (MSAA 4×) → prepase de normales y profundidad → oclusión
       ambiental SAO + desenfoque bilateral → bloom de la luz LED (cadena de
       mips) → composición → acumulación temporal → ACES + sRGB + dither.
     Con la cámara quieta cada cuadro nuevo se desplaza una fracción de píxel y
     mueve un poco la luz principal (luz de área): al promediarlos quedan bordes
     limpios, sombras de penumbra suave y una oclusión sin ruido. */
  const FS_VERT = 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const SH = {};
  SH.sao = [
    'uniform sampler2D tDepth; uniform sampler2D tNormal;',
    'uniform mat4 uProjInv; uniform vec2 uRes; uniform float uRadius; uniform float uIntensity; uniform float uScale; uniform float uFrame;',
    'varying vec2 vUv;',
    'vec3 viewPos(vec2 uv) { float d = texture2D(tDepth, uv).x; vec4 p = uProjInv * vec4(vec3(uv, d) * 2.0 - 1.0, 1.0); return p.xyz / p.w; }',
    'float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }',
    'void main() {',
    '  float d = texture2D(tDepth, vUv).x;',
    '  if (d > 0.99999) { gl_FragColor = vec4(1.0); return; }',
    '  vec3 P = viewPos(vUv);',
    '  vec3 N = normalize(texture2D(tNormal, vUv).xyz * 2.0 - 1.0);',
    '  float rPx = min(uRadius * uScale / -P.z, 140.0);',
    '  if (rPx < 1.5) { gl_FragColor = vec4(1.0); return; }',
    '  float r2 = uRadius * uRadius, bias = 0.002 - P.z * 0.002;',
    '  float rot = ign(gl_FragCoord.xy + uFrame * vec2(17.0, 31.0)) * 6.2831853;',
    '  float jit = fract(ign(gl_FragCoord.yx * 1.37) + uFrame * 0.618034);',
    '  float sum = 0.0;',
    '  for (int i = 0; i < SAMPLES; i++) {',
    '    float a = (float(i) + jit) / float(SAMPLES);',
    '    float ang = a * 43.9823 + rot;',
    '    vec2 suv = vUv + vec2(cos(ang), sin(ang)) * (a * a * rPx + 1.0) / uRes;',
    '    if (suv.x < 0.0 || suv.y < 0.0 || suv.x > 1.0 || suv.y > 1.0) continue;',
    '    vec3 v = viewPos(suv) - P;',
    '    float vv = dot(v, v), vn = dot(v, N);',
    '    float f = max(r2 - vv, 0.0) / r2;',
    '    sum += f * f * f * max((vn - bias) / (vv + 0.0025), 0.0);',
    '  }',
    '  float ao = max(0.0, 1.0 - sum * uIntensity * 5.0 / float(SAMPLES));',
    '  gl_FragColor = vec4(vec3(ao), 1.0);',
    '}'
  ].join('\n');
  SH.blur = [
    'uniform sampler2D tAO; uniform sampler2D tDepth; uniform vec2 uDir; uniform float uNear; uniform float uFar;',
    'varying vec2 vUv;',
    'float vz(vec2 uv) { float d = texture2D(tDepth, uv).x; return (uNear * uFar) / ((uFar - uNear) * d - uFar); }',
    'void main() {',
    '  float z0 = vz(vUv), s = 0.0, ws = 0.0, tol = abs(z0) * 0.04 + 0.015;',
    '  for (int i = -4; i <= 4; i++) {',
    '    vec2 uv = vUv + uDir * float(i);',
    '    float w = exp(-float(i * i) * 0.12) * max(0.0, 1.0 - abs(vz(uv) - z0) / tol);',
    '    s += texture2D(tAO, uv).r * w; ws += w;',
    '  }',
    '  gl_FragColor = vec4(vec3(ws > 0.0 ? s / ws : 1.0), 1.0);',
    '}'
  ].join('\n');
  SH.down = [
    'uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uPre; uniform float uThreshold; uniform float uKnee;',
    'varying vec2 vUv;',
    'vec3 s(vec2 o) { return texture2D(tSrc, vUv + o * uTexel).rgb; }',
    'void main() {',
    '  vec3 c = s(vec2(0.0)) * 0.125;',
    '  c += (s(vec2(-1.0, 1.0)) + s(vec2(1.0, 1.0)) + s(vec2(-1.0, -1.0)) + s(vec2(1.0, -1.0))) * 0.125;',
    '  c += (s(vec2(-2.0, 2.0)) + s(vec2(2.0, 2.0)) + s(vec2(-2.0, -2.0)) + s(vec2(2.0, -2.0))) * 0.03125;',
    '  c += (s(vec2(0.0, 2.0)) + s(vec2(0.0, -2.0)) + s(vec2(-2.0, 0.0)) + s(vec2(2.0, 0.0))) * 0.0625;',
    '  if (uPre > 0.5) {',
    '    float br = max(c.r, max(c.g, c.b));',
    '    float sk = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee); sk = sk * sk / (4.0 * uKnee + 1e-4);',
    '    c *= max(sk, br - uThreshold) / max(br, 1e-4);',
    '    c = min(c, vec3(30.0));',
    '  }',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');
  SH.up = [
    'uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uK;',
    'varying vec2 vUv;',
    'vec3 s(vec2 o) { return texture2D(tSrc, vUv + o * uTexel).rgb; }',
    'void main() {',
    '  vec3 c = s(vec2(0.0)) * 4.0 + (s(vec2(-1.0, 0.0)) + s(vec2(1.0, 0.0)) + s(vec2(0.0, -1.0)) + s(vec2(0.0, 1.0))) * 2.0;',
    '  c += s(vec2(-1.0, -1.0)) + s(vec2(1.0, -1.0)) + s(vec2(-1.0, 1.0)) + s(vec2(1.0, 1.0));',
    '  gl_FragColor = vec4(c * (uK / 16.0), 1.0);',
    '}'
  ].join('\n');
  SH.comp = [
    'uniform sampler2D tColor; uniform sampler2D tAO; uniform sampler2D tBloom; uniform sampler2D tPrev;',
    'uniform float uAO; uniform float uBloom; uniform float uW;',
    'varying vec2 vUv;',
    'void main() {',
    '  vec3 c = texture2D(tColor, vUv).rgb;',
    '  #ifdef USE_AO',
    '  float ao = texture2D(tAO, vUv).r;',
    '  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));',
    '  c *= mix(1.0, ao, uAO * (1.0 - smoothstep(1.2, 3.5, lum)));',
    '  #endif',
    '  #ifdef USE_BLOOM',
    '  c += texture2D(tBloom, vUv).rgb * uBloom;',
    '  #endif',
    '  if (uW < 1.0) c = mix(texture2D(tPrev, vUv).rgb, c, uW);',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');
  SH.out = [
    'uniform sampler2D tSrc; uniform float uExposure; uniform float uFrame; uniform vec3 uWB;',
    'varying vec2 vUv;',
    'vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }',
    'vec3 aces(vec3 c) {',
    '  const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));',
    '  const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));',
    '  return clamp(O * RRTAndODTFit(I * (c * uExposure / 0.6)), 0.0, 1.0);',
    '}',
    'vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }',
    'float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }',
    'void main() {',
    '  vec3 c = srgb(aces(texture2D(tSrc, vUv).rgb * uWB));',
    '  c += (ign(gl_FragCoord.xy + uFrame * 7.0) - 0.5) / 255.0;',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  let fsMesh = null;
  const fsCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  function fsPass(mat, target) { fsMesh.material = mat; E.renderer.setRenderTarget(target); E.renderer.render(fsMesh, fsCam); }
  function shader(frag, uniforms, defines, extra) {
    return new T.ShaderMaterial(Object.assign({ vertexShader: FS_VERT, fragmentShader: frag, uniforms, defines: defines || {}, depthTest: false, depthWrite: false }, extra || {}));
  }
  const rtOpt = (type, o) => Object.assign({ type, depthBuffer: false, minFilter: T.LinearFilter, magFilter: T.LinearFilter }, o);

  function setupPost() {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
    g.setAttribute('uv', new T.Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
    fsMesh = new T.Mesh(g); fsMesh.frustumCulled = false;
    P.samples = E.mobile ? 10 : 16;
    P.rtMain = new T.WebGLRenderTarget(4, 4, { type: T.HalfFloatType, samples: 4 });
    P.rtAO = new T.WebGLRenderTarget(4, 4, rtOpt(T.UnsignedByteType));
    P.rtAO2 = new T.WebGLRenderTarget(4, 4, rtOpt(T.UnsignedByteType));
    P.mips = []; for (let i = 0; i < (E.mobile ? 5 : 6); i++) P.mips.push(new T.WebGLRenderTarget(4, 4, rtOpt(T.HalfFloatType)));
    P.acc = [new T.WebGLRenderTarget(4, 4, rtOpt(T.HalfFloatType)), new T.WebGLRenderTarget(4, 4, rtOpt(T.HalfFloatType))];
    P.cur = 0;
    P.normMat = new T.MeshNormalMaterial();
    P.mSao = shader(SH.sao, { tDepth: { value: null }, tNormal: { value: null }, uProjInv: { value: new T.Matrix4() }, uRes: { value: new T.Vector2() }, uRadius: { value: 0.42 }, uIntensity: { value: 0.03 }, uScale: { value: 1 }, uFrame: { value: 0 } }, { SAMPLES: P.samples });
    P.mBlur = shader(SH.blur, { tAO: { value: null }, tDepth: { value: null }, uDir: { value: new T.Vector2() }, uNear: { value: 0.1 }, uFar: { value: 100 } });
    P.mDown = shader(SH.down, { tSrc: { value: null }, uTexel: { value: new T.Vector2() }, uPre: { value: 0 }, uThreshold: { value: 1.6 }, uKnee: { value: 0.7 } });
    P.mUp = shader(SH.up, { tSrc: { value: null }, uTexel: { value: new T.Vector2() }, uK: { value: 0.85 } }, null, { blending: T.AdditiveBlending });
    P.mComp = shader(SH.comp, { tColor: { value: null }, tAO: { value: null }, tBloom: { value: null }, tPrev: { value: null }, uAO: { value: 0.85 }, uBloom: { value: 0.16 }, uW: { value: 1 } }, { USE_AO: '', USE_BLOOM: '' });
    P.mOut = shader(SH.out, { tSrc: { value: null }, uExposure: { value: P.exposure }, uFrame: { value: 0 }, uWB: { value: new T.Vector3().fromArray(P.wb) } });
  }
  function resizePost(pw, ph, w, h) {
    P.rtMain.setSize(pw, ph);
    // la oclusión se calcula a la resolución de la página (1 px CSS), sin el factor de pantalla retina
    const aw = Math.max(2, Math.round(E.mobile ? w * 0.6 : w)), ah = Math.max(2, Math.round(E.mobile ? h * 0.6 : h));
    if (P.rtNorm) { P.rtNorm.depthTexture.dispose(); P.rtNorm.dispose(); }
    P.rtNorm = new T.WebGLRenderTarget(aw, ah, { type: T.UnsignedByteType, minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthTexture: new T.DepthTexture(aw, ah, T.UnsignedIntType) });
    P.rtAO.setSize(aw, ah); P.rtAO2.setSize(aw, ah);
    P.mips.forEach((m, i) => m.setSize(Math.max(2, pw >> (i + 1)), Math.max(2, ph >> (i + 1))));
    P.acc.forEach((a) => a.setSize(pw, ph));
    P.n = 0;
  }
  const _hide = [];
  function renderPost() {
    const r = E.renderer, sc = E.scene, cam = E.camera;
    // 1 · escena en HDR
    r.setRenderTarget(P.rtMain); r.clear(); r.render(sc, cam);
    // 2 · oclusión ambiental: solo superficies opacas
    if (P.ao) {
      sc.traverseVisible((o) => { if ((o.isMesh && (o.material.transparent || o.userData.noAO)) || o.isLine || o.isPoints || o.isSprite) _hide.push(o); });
      _hide.forEach((o) => { o.visible = false; });
      const bg = sc.background; sc.background = null; sc.overrideMaterial = P.normMat;
      r.setRenderTarget(P.rtNorm); r.setClearColor(0x000000, 1); r.clear(); r.render(sc, cam);
      sc.overrideMaterial = null; sc.background = bg;
      _hide.forEach((o) => { o.visible = true; }); _hide.length = 0;
      const u = P.mSao.uniforms, aw = P.rtNorm.width, ah = P.rtNorm.height;
      u.tDepth.value = P.rtNorm.depthTexture; u.tNormal.value = P.rtNorm.texture;
      u.uProjInv.value.copy(cam.projectionMatrixInverse); u.uRes.value.set(aw, ah);
      u.uScale.value = cam.projectionMatrix.elements[5] * ah * 0.5; u.uFrame.value = P.n % 64;
      fsPass(P.mSao, P.rtAO);
      const b = P.mBlur.uniforms; b.tDepth.value = P.rtNorm.depthTexture; b.uNear.value = cam.near; b.uFar.value = cam.far;
      b.tAO.value = P.rtAO.texture; b.uDir.value.set(1 / aw, 0); fsPass(P.mBlur, P.rtAO2);
      b.tAO.value = P.rtAO2.texture; b.uDir.value.set(0, 1 / ah); fsPass(P.mBlur, P.rtAO);
    }
    // 3 · bloom: solo lo que pasa del umbral (los LED y sus reflejos)
    if (P.bloom) {
      const d = P.mDown.uniforms;
      d.uPre.value = 1; d.tSrc.value = P.rtMain.texture; d.uTexel.value.set(1 / P.rtMain.width, 1 / P.rtMain.height); fsPass(P.mDown, P.mips[0]);
      d.uPre.value = 0;
      for (let i = 1; i < P.mips.length; i++) { d.tSrc.value = P.mips[i - 1].texture; d.uTexel.value.set(1 / P.mips[i - 1].width, 1 / P.mips[i - 1].height); fsPass(P.mDown, P.mips[i]); }
      const up = P.mUp.uniforms;
      for (let i = P.mips.length - 1; i > 0; i--) { up.tSrc.value = P.mips[i].texture; up.uTexel.value.set(1 / P.mips[i].width, 1 / P.mips[i].height); r.autoClear = false; fsPass(P.mUp, P.mips[i - 1]); r.autoClear = true; }
    }
    // 4 · composición y acumulación
    const c = P.mComp.uniforms, prev = P.acc[P.cur], next = P.acc[1 - P.cur];
    c.tColor.value = P.rtMain.texture; c.tAO.value = P.rtAO.texture; c.tBloom.value = P.mips[0].texture; c.tPrev.value = prev.texture;
    c.uW.value = 1 / (P.n + 1);
    const def = P.mComp.defines, want = (P.ao ? 1 : 0) + (P.bloom ? 2 : 0);
    if (P.mComp.userData.want !== want) {
      delete def.USE_AO; delete def.USE_BLOOM; if (P.ao) def.USE_AO = ''; if (P.bloom) def.USE_BLOOM = '';
      P.mComp.userData.want = want; P.mComp.needsUpdate = true;
    }
    fsPass(P.mComp, next); P.cur = 1 - P.cur;
    // 5 · tone mapping a la pantalla
    P.mOut.uniforms.tSrc.value = next.texture; P.mOut.uniforms.uFrame.value = P.n % 64;
    fsPass(P.mOut, null);
  }
  /* secuencia de Halton (2, 3) para los desplazamientos subpíxel */
  function halton(i, b) { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; }
  const _kOff = new T.Vector3(), _kU = new T.Vector3(), _kV = new T.Vector3();
  function jitterFrame(n) {
    jit.x = (halton(n + 1, 2) - 0.5) / E.dpr; jit.y = (halton(n + 1, 3) - 0.5) / E.dpr;
    applyProjection();
    // luz principal de área: la fuente se reparte en un disco de 0.9 m (espiral de Vogel)
    const k = E.key, a = n * 2.39996, rr = 0.9 * Math.sqrt((n % P.max + 0.5) / P.max);
    _kOff.copy(E.keyBase).sub(k.target.position).normalize();
    _kU.set(0, 1, 0).cross(_kOff).normalize(); _kV.copy(_kOff).cross(_kU);
    k.position.copy(E.keyBase).addScaledVector(_kU, Math.cos(a) * rr).addScaledVector(_kV, Math.sin(a) * rr);
    E.renderer.shadowMap.needsUpdate = true;
    P.jit = true;
  }
  function unjitter() {
    jit.x = 0; jit.y = 0; applyProjection();
    E.key.position.copy(E.keyBase); E.renderer.shadowMap.needsUpdate = true;
    P.jit = false;
  }
  /* intensidad de la luz ambiental que aporta el entorno capturado */
  E.envK = 0.3;
  E.setEnvK = function (k) {
    E.envK = k;
    E.scene.traverse((o) => {
      const m = o.material;
      if (!m || m.envMapIntensity === undefined) return;
      if (m.userData.env0 === undefined) m.userData.env0 = m.envMapIntensity;
      m.envMapIntensity = m.userData.env0 * k;
    });
    E.invalidate(3);
  };
  /* materiales sin luz (pantallas, letrero): compensan el tone mapping final para conservar su brillo */
  E.finalize = function () {
    if (!P.on) return;
    E.scene.traverse((o) => {
      const m = o.material;
      if (!m || !m.isMeshBasicMaterial || m.toneMapped !== false || !m.map || m.blending === T.AdditiveBlending || m.userData.lift) return;
      m.userData.lift = true; m.color.multiplyScalar(1.55);
    });
  };

  /* ------------------------------------------------------------------ ciclo */
  let last = performance.now(), slow = 0;
  E.onFrame = null;
  E.hooks = [];                                    // funciones que revisan algo en cada cuadro con cambios (p. ej. si un video está a la vista)
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.12, (now - last) / 1000); last = now;
    let active = false;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      if (tw.dead) { tweens.splice(i, 1); continue; }
      active = true;
      if (now < tw.t0) continue;
      const k = clamp((now - tw.t0) / tw.dur, 0, 1);
      tw.fn(tw.ease(k), k);
      if (k >= 1) { tweens.splice(i, 1); if (tw.done) tw.done(); }
    }
    const moving = updateCamera(dt, now);
    const sh = updateShells(dt);
    const changed = active || moving || sh || dirty > 0;
    const refine = !changed && P.on && P.n > 0 && P.n < P.max && !E.reduced;
    if (!changed && !refine) return;
    if (changed) {
      if (dirty > 0) dirty--;
      if (P.jit) unjitter();
      if (E.shadowDirty || active) { E.renderer.shadowMap.needsUpdate = true; E.shadowDirty = false; }
      if (E.onFrame) E.onFrame(dt, now);
      for (let i = 0; i < E.hooks.length; i++) E.hooks[i](dt);
      P.n = 0;
      // calidad adaptable: si moverse cuesta más de ~22 cuadros por segundo, baja la resolución una vez
      if (P.on && moving) {
        slow = slow * 0.96 + (dt > 0.045 ? 0.04 : 0);
        if (slow > 0.75 && E.dprMax > 1) { E.dprMax = Math.max(1, E.dprMax * 0.75); slow = 0; E.resize(true); }
      }
    } else jitterFrame(P.n);
    if (E.reflect.on) renderReflection();
    if (P.on) renderPost(); else E.renderer.render(E.scene, E.camera);
    P.n++;
    if (changed && E.afterRender) E.afterRender(moving || active || sh);
  }
})();
