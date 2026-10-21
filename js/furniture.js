/* ============================================================================
   MOBILIARIO — los 20 elementos del plano, modelados pieza por pieza según el
   despiece del documento. Cada pieza guarda: su material (mk, enlaza con la
   tabla de costos), el paso de armado (step) y hacia dónde se separa (ex).

   Sistema local de cada mueble: x = largo, y = alto, z = fondo
   (z = 0 contra el muro, z crece hacia el frente del mueble).
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  // versión con que index.html carga este archivo (?v=): la usa también el video, para no ver el anterior en caché
  const VER = ((document.currentScript && document.currentScript.src.match(/[?&]v=([^&#]+)/)) || [])[1];
  const T = THREE, E = L.engine, G = L.geo, R = L.room;
  const F = (L.furn = { items: {}, order: [] });
  const wx = R.wx, wz = R.wz, PI = Math.PI;
  const V = (a) => new T.Vector3(a[0], a[1], a[2]);
  L.redraws = [];

  /* ------------------------------------------------------------ constructores */
  function inst(n, X, y, D, rot) {
    const g = new T.Group(); g.position.set(wx(X), y, wz(D)); g.rotation.y = rot || 0;
    const o = { n, group: g, parts: [], decor: [], glows: [], home: g.position.clone() };
    g.userData.inst = o;
    return o;
  }
  function reg(o, mesh, data) { mesh.userData = Object.assign({ n: o.n, inst: o, mat0: mesh.material }, data); o.group.add(mesh); return mesh; }
  /* pieza en forma de tablero: esquina mínima (x, y, z) + tamaño */
  function P(o, name, mat, x, y, z, sx, sy, sz, step, ex, opt) {
    opt = opt || {};
    const m = new T.Mesh(opt.geo || G.box(sx, sy, sz, opt.grain, opt.bev), L.mats[mat] || mat);
    if (opt.geo) m.position.set(x, y, z); else m.position.set(x + sx / 2, y + sy / 2, z + sz / 2);
    m.castShadow = !opt.noShadow; m.receiveShadow = !opt.noShadow;
    if (opt.order) m.renderOrder = opt.order;
    reg(o, m, { part: true, name, mk: opt.mk || mat, step: step || 0, home: m.position.clone(), ex: V(ex || [0, 0, 0]), exA: opt.exA ? V(opt.exA) : null, pts: opt.pts || null });
    o.parts.push(m);
    return m;
  }
  /* pieza a partir de una lista de sólidos unidos (herrajes, patas, cajones…) */
  function PM(o, name, mat, list, step, ex, opt) {
    opt = opt || {};
    return P(o, name, mat, 0, 0, 0, 0, 0, 0, step, ex, Object.assign({ geo: G.merge(list) }, opt));
  }
  /* objetos de exhibición: no son parte del mueble y se ocultan al explosionar */
  function D(o, list, mat) {
    if (!list.length) return null;
    const m = new T.Mesh(G.merge(list), L.mats[mat || 'impreso']);
    m.castShadow = true; m.receiveShadow = true;
    reg(o, m, { decor: true }); o.decor.push(m);
    return m;
  }
  const cylM = (x, y, z, r, h, axis) => G.mat(x, y, z, axis === 'z' ? PI / 2 : 0, 0, axis === 'x' ? PI / 2 : 0, r, h, r);
  function patas(o, pts, h, step, ex, opt) {
    const l = pts.map((p) => ({ g: G.cyl(), m: cylM(p[0], h / 2, p[1], 0.022, h), c: 0x18181a }));
    return PM(o, 'Patas niveladoras', 'plastico', l, step, ex, Object.assign({ mk: 'patas', noShadow: true, pts: pts.map((p) => [p[0], 0, p[1]]) }, opt));
  }
  function chazos(o, pts, step, ex, opt) {
    const l = pts.map((p) => ({ g: G.cyl(), m: cylM(p[0], p[1], p[2], 0.009, 0.06, 'z'), c: 0xd0d2d5 }));
    return PM(o, 'Chazos', 'inox', l, step, ex, Object.assign({ mk: 'anclaje', noShadow: true, pts: pts.map((p) => [p[0], p[1], p[2] + 0.03]) }, opt));
  }
  /* tgt: diccionario de una versión alternativa (furniture-alt.js); sin tgt, la versión A */
  function add(n, insts, cfg, tgt) {
    const it = Object.assign({ n, insts, th: 0.5, ph: 1.08, zone: 'sala', ver: tgt ? tgt._ver : 'A' }, cfg || {});
    insts.forEach((o, i) => { o.idx = i; o.item = it; R.root.add(o.group); });
    if (tgt) tgt[n] = it; else { F.items[n] = it; F.order.push(n); }
    return it;
  }
  /* sombra de contacto: huella (x0, z0, ancho, fondo) en el sistema local del mueble */
  function sombra(o, x0, z0, w, d, op) {
    const m = E.contactShadow(w, d, op); m.position.x = x0 + w / 2; m.position.z = z0 + d / 2; m.position.y = 0.004 - o.group.position.y;
    o.group.add(m); o.glows.push(m); m.userData = { n: o.n, inst: o, fx: true };
  }
  const PAL = [0xf4f2ee, 0xf4f2ee, 0xf4f2ee, 0x232326, 0x232326, 0x8f9094, 0x2f6fd0, 0xd9412e, 0xf08a24, 0x3f9b57, 0xf2c230, 0xefece6];
  const pick = (a) => a[Math.floor(G.rand() * a.length)];
  /* fila de figuras sobre una superficie */
  function fila(list, x0, x1, y, z, count, hMin, hMax, pal) {
    const step = (x1 - x0) / count;
    for (let i = 0; i < count; i++) {
      const h = hMin + G.rand() * (hMax - hMin);
      G.fig(list, pick(G.figNames), x0 + step * (i + 0.5) + (G.rand() - 0.5) * step * 0.25, y, z + (G.rand() - 0.5) * 0.04, h, pick(pal || PAL), (G.rand() - 0.5) * 0.9);
    }
  }

  /* ----------------------------------------------------- texturas con texto */
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    L.redraws.push(() => { const g = c.getContext('2d'); g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; });
    return t;
  }
  /* imagen fija de la pantalla de 75" (mientras carga el video o si no se puede reproducir):
     la portada del video del proceso de impresión, con la misma composición */
  const INTER = '"Inter",system-ui,-apple-system,"Segoe UI",sans-serif';
  function drawProcessScreen(g, w, h) {
    const s = w / 720, Y = (v) => v * h / 1280;
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0f1013'); bg.addColorStop(1, '#060607');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const halo = g.createRadialGradient(w * 0.5, h * 0.6, 0, w * 0.5, h * 0.6, w * 0.9);
    halo.addColorStop(0, 'rgba(255,159,10,0.12)'); halo.addColorStop(0.55, 'rgba(255,159,10,0.04)'); halo.addColorStop(1, 'rgba(255,159,10,0)');
    g.fillStyle = halo; g.fillRect(0, 0, w, h);
    const B = L.brand;
    if (B) { const k = 128 * s / B.viewBox[0]; g.save(); g.translate(56 * s, Y(70)); g.scale(k, k); g.fillStyle = '#f5f5f7'; B.paths.forEach((d) => g.fill(new Path2D(d))); g.restore(); }
    g.textBaseline = 'alphabetic';
    const txt = (t, x, y, size, weight, color) => { g.font = weight + ' ' + Math.round(size * s) + 'px ' + INTER; g.fillStyle = color; g.fillText(t, x * s, Y(y)); };
    txt('IMPRESIÓN 3D', 56, 236, 22, 700, '#ffa31a');
    txt('Así nace', 52, 336, 92, 700, '#f5f5f7'); txt('una pieza', 52, 432, 92, 700, '#f5f5f7');
    txt('Del archivo al objeto, en cuatro pasos.', 56, 500, 30, 400, '#a1a1a6');
    ['Modelado', 'Laminado', 'Impresión', 'Acabado'].forEach((n, i) => {
      const y = 650 + i * 104;
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(56 * s, Y(y - 64), 608 * s, Math.max(1, s));
      txt('0' + (i + 1), 56, y, 26, 700, '#ffa31a'); txt(n, 118, y, 46, 600, '#f5f5f7');
    });
  }
  /* imagen fija de las pantallas exteriores: la portada de su video («Entra y crea») */
  function drawExteriorScreen(g, w, h) {
    const s = w / 720, Y = (v) => v * h / 1280;
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#101114'); bg.addColorStop(1, '#060607');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const halo = g.createRadialGradient(w * 0.5, h * 0.62, 0, w * 0.5, h * 0.62, w * 0.95);
    halo.addColorStop(0, 'rgba(255,159,10,0.16)'); halo.addColorStop(0.5, 'rgba(255,159,10,0.05)'); halo.addColorStop(1, 'rgba(255,159,10,0)');
    g.fillStyle = halo; g.fillRect(0, 0, w, h);
    const B = L.brand;
    if (B) { const k = 500 * s / B.viewBox[0]; g.save(); g.translate(110 * s, Y(440)); g.scale(k, k); g.fillStyle = '#f5f5f7'; B.paths.forEach((d) => g.fill(new Path2D(d))); g.restore(); }
    g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    const txt = (t, y, size, weight, color) => { g.font = weight + ' ' + Math.round(size * s) + 'px ' + INTER; g.fillStyle = color; g.fillText(t, w / 2, Y(y)); };
    txt('Entra y crea', 720, 92, 700, '#f5f5f7');
    txt('Te esperamos aquí mismo', 780, 32, 400, '#a1a1a6');
    g.strokeStyle = '#ffa31a'; g.lineWidth = 5 * s; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(w / 2 - 26 * s, Y(905)); g.lineTo(w / 2, Y(929)); g.lineTo(w / 2 + 26 * s, Y(905)); g.stroke();
    txt('IMPRESIÓN 3D · DISEÑO · REGALOS', 1150, 22, 600, '#ffa31a');
  }
  const screenMat = (tex) => { const m = new T.MeshBasicMaterial({ map: tex, toneMapped: false }); m.name = 'pantalla'; return m; };

  /* Video en bucle sobre una o varias pantallas, sin sonido. Mientras carga, si el archivo no está, si el navegador
     no deja usarlo (página abierta con doble clic: file://) o si el sistema pide reducir movimiento, queda
     la imagen fija. Solo se reproduce mientras alguna de sus pantallas está a la vista: así no gasta batería ni GPU.
     Las pantallas que piden el mismo archivo comparten un solo video (las dos de los pilares van sincronizadas). */
  const _fr = new T.Frustum(), _pm = new T.Matrix4(), _sp = new T.Sphere(), _nv = new T.Vector3(), _dv = new T.Vector3();
  const videos = {};
  function screenVideo(mesh, base) {
    if (E.reduced || location.protocol === 'file:') return;
    if (videos[base]) { videos[base].add(mesh); return; }
    const v = document.createElement('video'), meshes = [];
    // MP4 (H.264) en casi todos los navegadores; WebM (VP9) para los que no traen H.264
    const src = base + (v.canPlayType('video/mp4; codecs="avc1.640028"') ? '.mp4' : '.webm');
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    let tex = null, on = false;
    const use = (m) => { const mat = m.material; mat._poster = mat.map; mat.map = tex; mat.needsUpdate = true; };
    const shown = (m) => { for (let o = m; o; o = o.parent) if (!o.visible) return false; return m.material === m.userData.screenMat; };
    const seen = (m) => {
      const cam = E.camera;
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      _sp.copy(m.geometry.boundingSphere).applyMatrix4(m.matrixWorld);
      _nv.set(0, 0, 1).transformDirection(m.matrixWorld); _dv.copy(cam.position).sub(_sp.center);
      return shown(m) && _fr.intersectsSphere(_sp) && _nv.dot(_dv) > 0 && _dv.length() < 16;
    };
    const check = () => {
      if (!tex) return;
      const cam = E.camera;
      _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm);
      const vis = meshes.some(seen);
      if (vis === on) return;
      on = vis;
      if (on) { const p = v.play(); if (p && p.catch) p.catch(() => { on = false; }); } else v.pause();
    };
    videos[base] = { add(m) { m.userData.screenMat = m.material; meshes.push(m); if (tex) use(m); } };
    videos[base].add(mesh);
    // cada cuadro nuevo del video pide redibujar el modelo, solo mientras se ve
    const frameCb = () => { if (on) E.invalidate(1); v.requestVideoFrameCallback(frameCb); };
    v.addEventListener('loadeddata', () => {
      try {                                            // un video de otro origen no se puede usar como textura
        const c = document.createElement('canvas'); c.width = c.height = 1;
        const g = c.getContext('2d'); g.drawImage(v, 0, 0, 1, 1); g.getImageData(0, 0, 1, 1);
      } catch (err) { return; }
      tex = new T.VideoTexture(v); tex.colorSpace = T.SRGBColorSpace;
      meshes.forEach(use);
      if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(frameCb);
      else setInterval(() => { if (on) E.invalidate(1); }, 1000 / 30);
      E.hooks.push(check); check(); E.invalidate(2);
    }, { once: true });
    v.src = src + (VER ? '?v=' + VER : '');
  }

  /* ----------------------------------------------- impresoras: piezas y animación
     Cada impresora fabrica en bucle una pieza distinta. La pieza es un sólido de revolución armado por filas
     (una fila = una capa de 2.5 mm), así basta con dibujar las primeras filas para mostrarla a medio imprimir;
     la tapa de arriba se recoloca en cada capa. La cama baja una capa cada vez, como en la P1S real, y el
     cabezal recorre el contorno de la capa que está imprimiendo. */
  const impresoras = [];
  const PIEZAS = [
    { name: 'Jarrón torcido', color: 0xf2f0eb, H: 0.16, seg: 8, twist: 1.1, r: (u) => 0.044 + 0.024 * Math.sin(PI * u * 1.1 + 0.2) - 0.014 * u * u, ciclo: 96, fase: 0.62 },
    { name: 'Jarrón facetado', color: 0xff8a2b, H: 0.14, seg: 6, twist: 0.5, r: (u) => 0.05 - 0.02 * Math.sin(3 * u) + 0.012 * u, ciclo: 84, fase: 0.18 },
    { name: 'Peón de ajedrez', color: 0x3b82f6, H: 0.11, seg: 28, twist: 0, r: (u) => {
      if (u < 0.1) return 0.04 - 0.04 * u;                                        // base
      if (u < 0.16) return 0.03;                                                   // moldura
      if (u < 0.6) return 0.026 - 0.014 * Math.pow((u - 0.16) / 0.44, 0.8);        // cuerpo
      if (u < 0.66) return 0.021;                                                  // cuello
      const d = (u - 0.83) / 0.17; return Math.max(0.0015, 0.019 * Math.sqrt(Math.max(0, 1 - d * d)));   // cabeza
    }, ciclo: 70, fase: 0.4 },
    { name: 'Florero estrella', color: 0x22c55e, H: 0.15, seg: 16, star: 0.8, twist: 1.6, r: (u) => 0.04 + 0.012 * Math.sin(PI * u), ciclo: 102, fase: 0.85 }
  ];
  const ROW = 0.0025;
  function anillo(pr, i, rows) {
    const u = i / rows, y = u * pr.H, r = pr.r(u), out = [];
    for (let k = 0; k < pr.seg; k++) {
      const a = (k / pr.seg) * PI * 2 + pr.twist * u, rr = r * (pr.star && k % 2 ? pr.star : 1);
      out.push([rr * Math.cos(a), y, rr * Math.sin(a)]);
    }
    return out;
  }
  function solidoPorCapas(pr) {
    const rows = Math.round(pr.H / ROW), pos = [], c = new T.Color(pr.color);
    let prev = anillo(pr, 0, rows);
    for (let i = 1; i <= rows; i++) {
      const cur = anillo(pr, i, rows);
      for (let k = 0; k < pr.seg; k++) {
        const k1 = (k + 1) % pr.seg, a = prev[k], b = prev[k1], d = cur[k], e = cur[k1];
        pos.push(...a, ...d, ...b, ...b, ...d, ...e);
      }
      prev = cur;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, i) => [c.r, c.g, c.b][i % 3]), 3));
    geo.computeVertexNormals();
    // tapa: abanico que se recoloca a la altura de la capa actual
    const cap = new T.BufferGeometry(), cp = new Float32Array((pr.seg + 1) * 3), idx = [];
    for (let k = 0; k < pr.seg; k++) idx.push(0, 1 + ((k + 1) % pr.seg), 1 + k);
    cap.setAttribute('position', new T.BufferAttribute(cp, 3));
    cap.setAttribute('normal', new T.Float32BufferAttribute(new Array(cp.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
    cap.setAttribute('color', new T.Float32BufferAttribute(new Array(cp.length).fill(0).map((_, i) => [c.r, c.g, c.b][i % 3]), 3));
    cap.setIndex(idx);
    return { geo, cap, rows, per: pr.seg * 6 };
  }
  /* muestra la pieza hasta la fila i y deja la cama a la altura que le corresponde */
  function ponerCapa(p, i, bedUp) {
    const { part, pr } = p;
    i = Math.max(0, Math.min(part.rows, i));
    if (p.row !== i) {
      p.row = i;
      part.geo.setDrawRange(0, i * part.per);
      const ring = anillo(pr, i, part.rows), cp = part.cap.attributes.position;
      cp.setXYZ(0, 0, (i / part.rows) * pr.H, 0);
      ring.forEach((q, k) => cp.setXYZ(k + 1, q[0], q[1], q[2]));
      cp.needsUpdate = true; part.cap.computeBoundingSphere();
      p.piece.visible = p.cap.visible = i > 0;
    }
    p.bed.position.y = p.top - (i / part.rows) * pr.H + (bedUp || 0);
  }
  /* pantalla de la impresora: estado, porcentaje y barra de avance */
  function LCD(k) {
    const c = document.createElement('canvas'); c.width = 160; c.height = 82;
    const g = c.getContext('2d'), tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    let last = '';
    this.tex = tex;
    this.set = (state, pct) => {
      const key = state + pct; if (key === last) return; last = key;
      const ok = state === 'Terminada', acc = ok ? '#30d158' : '#ffa31a';
      g.fillStyle = '#0d1117'; g.fillRect(0, 0, 160, 82);
      g.fillStyle = '#7d8590'; g.font = '500 11px ' + INTER; g.fillText('P1S · 0' + (k + 1), 10, 16);
      g.fillStyle = '#e8eaed'; g.font = '600 14px ' + INTER; g.fillText(state, 10, 34);
      g.fillStyle = acc; g.font = '700 22px ' + INTER; g.fillText(pct + ' %', 10, 60);
      g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(10, 68, 140, 5);
      g.fillStyle = acc; g.fillRect(10, 68, 140 * pct / 100, 5);
      tex.needsUpdate = true;
    };
    this.set('Imprimiendo', 0);
  }
  /* un ciclo: imprime (88 %), espera con la pieza terminada y el cabezal atrás (6 %), retira la pieza y sube la cama (6 %) */
  function animarImpresora(p, t) {
    const pr = p.pr, C = pr.ciclo, f = ((t / C + pr.fase) % 1 + 1) % 1, P1 = 0.88, P2 = 0.94;
    let row, hx, hz, state, pct;
    if (f < P1) {
      const u = f / P1, rowsF = u * p.part.rows; row = Math.floor(rowsF) + 1;
      // contorno de la capa actual: dos vueltas por capa, la segunda por dentro (perímetro interior)
      const lu = rowsF - Math.floor(rowsF), a = lu * PI * 4 + pr.twist * (row / p.part.rows), r = pr.r(Math.min(1, row / p.part.rows)) * (lu < 0.5 ? 1 : 0.86);
      const star = pr.star ? (Math.cos(a * pr.seg / 2) * 0.5 + 0.5) * (1 - pr.star) : 0;
      hx = (r * (1 - star)) * Math.cos(a); hz = (r * (1 - star)) * Math.sin(a);
      state = 'Imprimiendo'; pct = Math.min(99, Math.floor(u * 100));
    } else if (f < P2) {
      row = p.part.rows; const u = (f - P1) / (P2 - P1), e = Math.min(1, u * 4);
      hx = 0.13 * e; hz = -0.15 * e; state = 'Terminada'; pct = 100;
    } else {
      // pieza retirada: la cama vacía sube despacio hasta la boquilla
      const u = (f - P2) / (1 - P2), k = Math.min(1, u * 1.25), e = k * k * (3 - 2 * k);
      ponerCapa(p, 0, -(1 - e) * pr.H);
      hx = 0.13 * (1 - u); hz = -0.15 * (1 - u); state = 'Preparando'; pct = 0;
    }
    if (f < P2) ponerCapa(p, row, 0);
    p.head.position.x = hx; p.head.position.z = hz; p.xbar.position.z = hz;
    p.lcd.set(state, pct);
  }
  /* ciclo de animación propio: unas 30 veces por segundo y solo mientras alguna impresora está a la vista */
  function animarImpresoras() {
    if (!impresoras.length || E.reduced) return;
    let lastT = 0;
    const seen = (o) => {
      for (let x = o.group; x; x = x.parent) if (!x.visible) return false;
      const cam = E.camera;
      _pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm);
      _sp.set(o.center, o.radius);
      return _fr.intersectsSphere(_sp) && cam.position.distanceTo(o.center) < 9;
    };
    const tick = (now) => {
      requestAnimationFrame(tick);
      if (now - lastT < 33 || document.hidden) return;
      lastT = now;
      if (!impresoras.some((p) => seen(p.o))) return;
      impresoras.forEach((p) => animarImpresora(p, now / 1000));
      E.invalidate(1);
    };
    requestAnimationFrame(tick);
  }

  /* ================================================================ modelos */
  F.build = function () {
    const M = L.mats;

    /* ---- 1 · Pantalla 75" en vertical (muro izquierdo) -------------------- */
    {
      const o = inst(1, 0, 0.40, 0.475, PI / 2);
      PM(o, 'Soporte fijo', 'acero', [{ g: new T.BoxGeometry(0.44, 0.44, 0.022), m: G.mat(0.475, 0.9, 0.011), c: 0x2a2a2c }, { g: new T.BoxGeometry(0.05, 0.6, 0.03), m: G.mat(0.34, 0.9, 0.022), c: 0x2a2a2c }, { g: new T.BoxGeometry(0.05, 0.6, 0.03), m: G.mat(0.61, 0.9, 0.022), c: 0x2a2a2c }], 0, [0, 0, 0.16], { mk: 'soporte' });
      const tv = P(o, 'Televisor 75"', 'plastico', 0, 0, 0.035, 0.95, 1.67, 0.045, 1, [0, 0, 0.62], { mk: 'producto' });
      const scr = new T.Mesh(new T.PlaneGeometry(0.93, 1.65), screenMat(canvasTex(512, 900, drawProcessScreen)));
      scr.position.z = 0.0235; tv.add(scr); scr.userData = { n: 1, inst: o, child: true };
      screenVideo(scr, 'assets/video/pantalla-75');
      add(1, [o], { th: 1.0, ph: 1.3 });
    }

    /* ---- 2 · Estantería exhibidora retroiluminada (muro izquierdo) --------- */
    {
      G.reseed(202);
      const o = inst(2, 0, 0, 1.60, PI / 2), dec = [];
      const ys = [0.969, 1.323, 1.677, 2.031];
      for (let m = 0; m < 2; m++) {
        const x0 = m * 1.2, dx = (m ? 1 : -1) * 0.16;
        P(o, 'Lateral', 'melBlanca', x0, 0, 0, 0.015, 2.4, 0.4, 0, [dx - 0.26, 0, 0.5]);
        P(o, 'Lateral', 'melBlanca', x0 + 1.185, 0, 0, 0.015, 2.4, 0.4, 0, [dx + 0.26, 0, 0.5]);
        P(o, 'Piso', 'melBlanca', x0 + 0.015, 0.08, 0.006, 1.17, 0.015, 0.394, 0, [dx, 0, 0.5]);
        P(o, 'Divisor', 'melBlanca', x0 + 0.015, 0.6, 0.006, 1.17, 0.015, 0.394, 0, [dx, 0, 0.5]);
        P(o, 'Techo', 'melBlanca', x0 + 0.015, 2.385, 0.006, 1.17, 0.015, 0.394, 0, [dx, 0.32, 0.5]);
        P(o, 'Fondo 6 mm', 'fondoLit', x0 + 0.005, 0.005, 0, 1.19, 2.39, 0.006, 1, [dx, 0, 0], { mk: 'fondo', exA: [0, 0, -0.42] });
        patas(o, [[x0 + 0.1, 0.06], [x0 + 1.1, 0.06], [x0 + 0.1, 0.33], [x0 + 1.1, 0.33]], 0.08, 2, [dx, 0, 0.5], { exA: [0, 0, 0.55] });
        P(o, 'Zócalo', 'melPlomo', x0 + 0.015, 0, 0.36, 1.17, 0.08, 0.015, 2, [dx, 0, 0.95]);
        for (let i = 0; i < 2; i++) P(o, 'Puerta', 'melPlomo', x0 + 0.002 + i * 0.6, 0.083, 0.4, 0.596, 0.517, 0.015, 3, [dx + (i ? 0.1 : -0.1), 0, 1.3], { grain: 1 });
        P(o, 'Perfil LED', 'led', x0 + 0.017, 0.62, 0.374, 0.014, 1.76, 0.012, 4, [dx - 0.13, 0, 0.82], { noShadow: true });
        P(o, 'Perfil LED', 'led', x0 + 1.169, 0.62, 0.374, 0.014, 1.76, 0.012, 4, [dx + 0.13, 0, 0.82], { noShadow: true });
        chazos(o, [[x0 + 0.3, 2.2, 0.03], [x0 + 0.9, 2.2, 0.03]], 5, [dx, 0, 0.28], { exA: [0, 0, 0.4] });
        ys.forEach((y) => P(o, 'Entrepaño', 'melBlanca', x0 + 0.015, y, 0.006, 1.17, 0.015, 0.38, 6, [dx, 0, 0.9]));
        [0.615].concat(ys.map((y) => y + 0.015)).forEach((y, k) => fila(dec, x0 + 0.08, x0 + 1.12, y, 0.2, 3 + ((k + m) % 2), 0.15, 0.27));
      }
      P(o, 'Fuente 12 V', 'equipo', 0.5, 0.1, 0.1, 0.16, 0.04, 0.06, 4, [-0.16, 0, 1.05], { mk: 'fuente' });
      D(o, dec); sombra(o, 0, 0, 2.4, 0.4);
      add(2, [o], { th: 0.85, asm: { off: [0, 0, 0.8], step: 5, first: true } });
    }

    /* ---- 3 · Isla exhibidora principal -------------------------------------- */
    {
      G.reseed(303);
      const o = inst(3, 1.5, 0, 1.9, 0), r3 = { bl: 0.25, fl: 0.25, fr: 0.25, br: 0 };
      // zócalo retranqueado, tira LED y patas
      PM(o, 'Zócalo retranqueado', 'negro', (() => { const l = []; G.pushBox(l, 0.1, 0, 0.1, 1.8, 0.1, 0.015, 0x19191b); G.pushBox(l, 0.1, 0, 0.985, 1.8, 0.1, 0.015, 0x19191b); G.pushBox(l, 0.1, 0, 0.115, 0.015, 0.1, 0.87, 0x19191b); G.pushBox(l, 1.885, 0, 0.115, 0.015, 0.1, 0.87, 0x19191b); return l; })(), 3, [0, 0, 0], { mk: 'mdf15', exA: [0, -0.34, 0] });
      PM(o, 'Tira LED COB', 'led', (() => { const l = []; G.pushBox(l, 0.1, 0.082, 0.092, 1.8, 0.01, 0.008, 0xffffff); G.pushBox(l, 0.1, 0.082, 1.0, 1.8, 0.01, 0.008, 0xffffff); G.pushBox(l, 0.092, 0.082, 0.1, 0.008, 0.01, 0.9, 0xffffff); G.pushBox(l, 1.9, 0.082, 0.1, 0.008, 0.01, 0.9, 0xffffff); return l; })(), 3, [0, 0, 0], { mk: 'led', noShadow: true, exA: [0, -0.34, 0] });
      patas(o, [[0.3, 0.3], [1.0, 0.3], [1.7, 0.3], [0.3, 0.8], [1.0, 0.8], [1.7, 0.8]], 0.1, 4, [0, 0, 0], { exA: [0, -0.3, 0] });
      // esqueleto
      P(o, 'Piso estructural', 'mdf15', 0, 0.1, 0, 0, 0, 0, 0, [0, 0.26, 0], { geo: G.slab(G.planShape(2, 1.1, r3, 0.02), 0.015) });
      const rib = (x, z, sx, sz) => P(o, 'Costilla', 'mdf15', x, 0.115, z, sx, 0.805, sz, 0, [0, 0.52, 0]);
      [0.5, 1.0, 1.5].forEach((x) => { rib(x, 0.785, 0.015, 0.3); rib(x, 0.015, 0.015, 0.3); });
      rib(0.015, 0.54, 0.3, 0.015); rib(1.685, 0.54, 0.3, 0.015);
      const ring = G.planShape(2, 1.1, r3, 0.02); ring.holes.push(new T.Path().moveTo(0.16, -0.16).lineTo(0.16, -0.94).lineTo(1.84, -0.94).lineTo(1.84, -0.16).closePath());
      P(o, 'Bastidor superior', 'mdf15', 0, 0.92, 0, 0, 0, 0, 0, [0, 0.98, 0], { geo: G.slab(ring, 0.015) });
      // paños rectos lacados
      P(o, 'Paño frontal', 'laca', 0.25, 0.115, 1.085, 1.5, 0.82, 0.015, 1, [0, 0.52, 0.5], { mk: 'mdf15' });
      P(o, 'Paño posterior', 'laca', 0.25, 0.115, 0, 1.75, 0.82, 0.015, 1, [0, 0.52, -0.5], { mk: 'mdf15' });
      P(o, 'Paño lateral', 'laca', 0, 0.115, 0.25, 0.015, 0.82, 0.6, 1, [-0.5, 0.52, 0], { mk: 'mdf15' });
      P(o, 'Paño lateral', 'laca', 1.985, 0.115, 0, 0.015, 0.82, 0.85, 1, [0.5, 0.52, 0], { mk: 'mdf15' });
      // pieles de esquina, dos capas de 5.5 mm
      [['fl', 0.25, 0.85, -1, 1], ['fr', 1.75, 0.85, 1, 1], ['bl', 0.25, 0.25, -1, -1]].forEach((c) => {
        P(o, 'Piel exterior 5.5 mm', 'laca', 0, 0.115, 0, 0, 0, 0, 2, [c[3] * 0.62, 0.52, c[4] * 0.62], { geo: G.arcSkin(c[1], c[2], 0.25, 0.0055, 0.82, c[0]), mk: 'mdf55' });
        P(o, 'Piel interior 5.5 mm', 'mdf55', 0, 0.115, 0, 0, 0, 0, 2, [c[3] * 0.4, 0.52, c[4] * 0.4], { geo: G.arcSkin(c[1], c[2], 0.2445, 0.0055, 0.82, c[0]) });
      });
      P(o, 'Tapa Rovere', 'melRovere', 0, 0.935, 0, 0, 0, 0, 5, [0, 1.42, 0], { geo: G.slab(G.planShape(2, 1.1, r3), 0.015, true) });
      P(o, 'Fuente 12 V', 'equipo', 1.2, 0.02, 0.03, 0.2, 0.05, 0.06, 6, [0, 0, -0.32], { mk: 'fuente' });
      const gl = new T.Mesh(new T.PlaneGeometry(2.9, 2.0), E.glowMaterial(E.glowTexture(2.0, 1.1, 0.45, 0.25), 0xffbe7a, 0.95));
      gl.rotation.x = -PI / 2; gl.position.set(1.0, 0.006, 0.55); gl.renderOrder = 2; gl.raycast = function () {}; o.group.add(gl); o.glows.push(gl); E.noReflect.push(gl);
      const dec = [];
      [[0.3, 0.75, 'jarron', 0.2, 0xf4f2ee], [0.62, 0.42, 'conejo', 0.34, 0xf7d9c8], [0.95, 0.72, 'conejo', 0.4, 0xf4f2ee], [1.28, 0.36, 'torre', 0.42, 0xf4f2ee], [1.6, 0.74, 'facetado', 0.2, 0xf4f2ee], [1.78, 0.4, 'gema', 0.16, 0xf4f2ee], [0.3, 0.3, 'nudo', 0.17, 0xf4f2ee]].forEach((f) => G.fig(dec, f[2], f[0], 0.95, f[1], f[3], f[4], 0.2));
      G.pushBox(dec, 1.42, 0.95, 0.72, 0.03, 0.2, 0.26, 0x16171a, 0.5);   // tableta de pedidos
      D(o, dec);
      add(3, [o], { th: 0.55, ph: 1.0, asm: { off: [0, 0.42, 0], step: 4, first: false } });
    }

    /* ---- 4 · Isla exhibidora secundaria ------------------------------------- */
    {
      G.reseed(404);
      const o = inst(4, 2.3, 0, 2.5, 0), r4 = { bl: 0.18, br: 0.18, fl: 0, fr: 0 };
      PM(o, 'Zócalo', 'negro', (() => { const l = []; G.pushBox(l, 0.1, 0, 0.08, 1.0, 0.1, 0.015, 0x19191b); G.pushBox(l, 0.1, 0, 0.095, 0.015, 0.1, 0.45, 0x19191b); G.pushBox(l, 1.085, 0, 0.095, 0.015, 0.1, 0.45, 0x19191b); return l; })(), 3, [0, 0, 0], { mk: 'mdf15', exA: [0, -0.3, 0] });
      PM(o, 'Tira LED COB', 'led', (() => { const l = []; G.pushBox(l, 0.1, 0.082, 0.072, 1.0, 0.01, 0.008, 0xffffff); G.pushBox(l, 0.092, 0.082, 0.08, 0.008, 0.01, 0.47, 0xffffff); G.pushBox(l, 1.1, 0.082, 0.08, 0.008, 0.01, 0.47, 0xffffff); return l; })(), 3, [0, 0, 0], { mk: 'led', noShadow: true, exA: [0, -0.3, 0] });
      patas(o, [[0.25, 0.2], [0.95, 0.2], [0.25, 0.48], [0.95, 0.48]], 0.1, 4, [0, 0, 0], { exA: [0, -0.26, 0] });
      P(o, 'Piso', 'mdf15', 0, 0.1, 0, 0, 0, 0, 0, [0, 0.24, 0], { geo: G.slab(G.planShape(1.2, 0.6, r4, 0.02), 0.015) });
      [0.4, 0.8].forEach((x) => P(o, 'Costilla', 'mdf15', x, 0.115, 0.015, 0.015, 0.655, 0.3, 0, [0, 0.46, 0]));
      P(o, 'Costilla', 'mdf15', 0.015, 0.115, 0.36, 0.3, 0.655, 0.015, 0, [0, 0.46, 0]);
      P(o, 'Costilla', 'mdf15', 0.885, 0.115, 0.36, 0.3, 0.655, 0.015, 0, [0, 0.46, 0]);
      const ring = G.planShape(1.2, 0.6, r4, 0.02); ring.holes.push(new T.Path().moveTo(0.14, -0.14).lineTo(0.14, -0.5).lineTo(1.06, -0.5).lineTo(1.06, -0.14).closePath());
      P(o, 'Bastidor', 'mdf15', 0, 0.77, 0, 0, 0, 0, 0, [0, 0.84, 0], { geo: G.slab(ring, 0.015) });
      P(o, 'Paño posterior', 'laca', 0.18, 0.115, 0, 0.84, 0.67, 0.015, 1, [0, 0.46, -0.45], { mk: 'mdf15' });
      P(o, 'Costado', 'laca', 0, 0.115, 0.18, 0.015, 0.67, 0.42, 1, [-0.45, 0.46, 0], { mk: 'mdf15' });
      P(o, 'Costado', 'laca', 1.185, 0.115, 0.18, 0.015, 0.67, 0.42, 1, [0.45, 0.46, 0], { mk: 'mdf15' });
      [['bl', 0.18, 0.18, -1], ['br', 1.02, 0.18, 1]].forEach((c) => {
        P(o, 'Piel exterior 5.5 mm', 'laca', 0, 0.115, 0, 0, 0, 0, 2, [c[3] * 0.55, 0.46, -0.55], { geo: G.arcSkin(c[1], c[2], 0.18, 0.0055, 0.67, c[0]), mk: 'mdf55' });
        P(o, 'Piel interior 5.5 mm', 'mdf55', 0, 0.115, 0, 0, 0, 0, 2, [c[3] * 0.36, 0.46, -0.36], { geo: G.arcSkin(c[1], c[2], 0.1745, 0.0055, 0.67, c[0]) });
      });
      P(o, 'Tapa Rovere', 'melRovere', 0, 0.785, 0, 0, 0, 0, 5, [0, 1.22, 0], { geo: G.slab(G.planShape(1.2, 0.6, r4), 0.015, true) });
      const gl = new T.Mesh(new T.PlaneGeometry(2.0, 1.4), E.glowMaterial(E.glowTexture(1.2, 0.6, 0.4, 0.18), 0xffbe7a, 0.9));
      gl.rotation.x = -PI / 2; gl.position.set(0.6, 0.007, 0.3); gl.renderOrder = 2; gl.raycast = function () {}; o.group.add(gl); o.glows.push(gl); E.noReflect.push(gl);
      const dec = [];
      [[0.25, 0.3, 'busto', 0.24, 0xf4f2ee], [0.6, 0.26, 'torre', 0.3, 0x232326], [0.93, 0.32, 'aro', 0.2, 0xf4f2ee]].forEach((f) => G.fig(dec, f[2], f[0], 0.8, f[1], f[3], f[4], -0.2));
      D(o, dec);
      add(4, [o], { th: -0.55, ph: 1.0, asm: { off: [0, 0.36, -0.5], step: 4, first: false } });
    }

    /* ---- 5 · Mesa alta de atención -------------------------------------------- */
    {
      const o = inst(5, 1.5, 0, 4.2, 0), a = 0.038;
      [[0, -1], [1.762, 1]].forEach((s) => {
        const x = s[0], ex = [s[1] * 0.55, 0, 0];
        P(o, 'Pata', 'acero', x, 0, 0, a, 1.02, a, 0, ex); P(o, 'Pata', 'acero', x, 0, 0.662, a, 1.02, a, 0, ex);
        P(o, 'Travesaño superior', 'acero', x, 0.982, a, a, a, 0.624, 0, ex); P(o, 'Travesaño reposapiés', 'acero', x, 0.3, a, a, a, 0.624, 0, ex);
      });
      [[0, -1], [0.662, 1]].forEach((s) => {
        P(o, 'Larguero superior', 'acero', a, 0.982, s[0], 1.724, a, a, 1, [0, 0.12, s[1] * 0.42]);
        P(o, 'Larguero reposapiés', 'acero', a, 0.3, s[0], 1.724, a, a, 1, [0, 0, s[1] * 0.42]);
      });
      P(o, 'Tapa inferior', 'melRovere', 0.02, 1.02, 0.02, 1.76, 0.015, 0.66, 2, [0, 0.38, 0]);
      P(o, 'Tapa superior', 'melRovere', 0, 1.035, 0, 1.8, 0.015, 0.7, 3, [0, 0.66, 0]);
      const dec = []; G.pushBox(dec, 0.5, 1.05, 0.22, 0.3, 0.012, 0.21, 0x1a1b1e, 0.15); G.pushBox(dec, 0.9, 1.05, 0.3, 0.2, 0.008, 0.14, 0xe9e7e2, -0.2);
      D(o, dec); sombra(o, 0, 0, 1.8, 0.7, 0.16);
      add(5, [o], { th: 0.6, ph: 1.05 });
    }

    /* ---- 6 · Taburetes altos (4) -------------------------------------------------- */
    {
      const mk = (X, Dd) => {
        const o = inst(6, X, 0, Dd, 0), l = [], c = 0x151517;
        l.push({ g: G.cyl(), m: cylM(0, 0.755, 0, 0.175, 0.05), c });
        l.push({ g: G.cyl(), m: cylM(0, 0.72, 0, 0.14, 0.03), c });
        for (let i = 0; i < 4; i++) {
          const an = PI / 4 + i * PI / 2, top = [Math.cos(an) * 0.12, Math.sin(an) * 0.12], bot = [Math.cos(an) * 0.2, Math.sin(an) * 0.2];
          const mid = new T.Vector3((top[0] + bot[0]) / 2, 0.36, (top[1] + bot[1]) / 2), dir = new T.Vector3(top[0] - bot[0], 0.72, top[1] - bot[1]);
          const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize());
          l.push({ g: G.cyl(), m: new T.Matrix4().compose(mid, q, new T.Vector3(0.013, dir.length(), 0.013)), c });
        }
        l.push({ g: new T.TorusGeometry(0.168, 0.009, 6, 28), m: G.mat(0, 0.27, 0, PI / 2, 0, 0), c });
        PM(o, 'Taburete', 'plastico', l, 0, [0, 0, 0], { mk: 'producto' }); sombra(o, -0.17, -0.17, 0.34, 0.34, 0.24);
        return o;
      };
      add(6, [mk(1.95, 3.24), mk(2.4, 3.24), mk(2.85, 3.24), mk(3.58, 3.85)], { th: 0.5, ph: 1.05, lp: [-0.25, 0.42] });
    }

    /* ---- 7 · Mesón de impresoras -------------------------------------------------- */
    {
      const o = inst(7, 0.6, 0, 5.5, 0), pc = [];
      for (let m = 0; m < 4; m++) {
        const x0 = m * 0.8, dx = (m - 1.5) * 0.2;
        P(o, 'Lateral', 'melBlanca', x0, 0.1, 0, 0.015, 0.77, 0.58, 0, [dx - 0.09, 0, 0.5]);
        P(o, 'Lateral', 'melBlanca', x0 + 0.785, 0.1, 0, 0.015, 0.77, 0.58, 0, [dx + 0.09, 0, 0.5]);
        P(o, 'Piso', 'melBlanca', x0 + 0.015, 0.1, 0.006, 0.77, 0.015, 0.574, 0, [dx, 0, 0.5]);
        P(o, 'Amarre', 'melBlanca', x0 + 0.015, 0.855, 0.006, 0.77, 0.015, 0.1, 0, [dx, 0.16, 0.5]);
        P(o, 'Amarre', 'melBlanca', x0 + 0.015, 0.855, 0.48, 0.77, 0.015, 0.1, 0, [dx, 0.16, 0.5]);
        P(o, 'Fondo 6 mm', 'fondo', x0 + 0.02, 0.1, 0, 0.76, 0.77, 0.006, 1, [dx, 0, 0], { exA: [0, 0, -0.4] });
        patas(o, [[x0 + 0.08, 0.07], [x0 + 0.72, 0.07], [x0 + 0.08, 0.5], [x0 + 0.72, 0.5]], 0.1, 2, [dx, 0, 0.5], { exA: [0, 0, 0.5] });
        P(o, 'Entrepaño', 'melBlanca', x0 + 0.015, 0.47, 0.01, 0.77, 0.015, 0.56, 6, [dx, 0, 0.92]);
        for (let i = 0; i < 2; i++) P(o, 'Puerta', 'melPlomo', x0 + 0.002 + i * 0.4, 0.103, 0.58, 0.396, 0.764, 0.015, 6, [dx + (i ? 0.05 : -0.05), 0, 1.32], { grain: 1 });
        pc.push({ g: G.cyl(), m: cylM(x0 + 0.4, 0.901, 0.1, 0.03, 0.004), c: 0x111113 });
      }
      P(o, 'Tapa lateral', 'melPlomo', -0.015, 0, 0, 0.015, 0.87, 0.6, 4, [-0.72, 0, 0.5], { grain: 1 });
      P(o, 'Tapa lateral', 'melPlomo', 3.2, 0, 0, 0.015, 0.87, 0.6, 4, [0.72, 0, 0.5], { grain: 1 });
      P(o, 'Zócalo', 'melPlomo', 0, 0.005, 0.52, 1.6, 0.09, 0.015, 4, [-0.3, 0, 1.0]);
      P(o, 'Zócalo', 'melPlomo', 1.6, 0.005, 0.52, 1.6, 0.09, 0.015, 4, [0.3, 0, 1.0]);
      [0, 1].forEach((i) => {
        const dx = i ? 0.3 : -0.3;
        P(o, 'Subtapa blanca', 'melBlanca', i * 1.6, 0.87, 0, 1.6, 0.015, 0.6, 5, [dx, 0.36, 0.5]);
        P(o, 'Tapa Rovere', 'melRovere', i * 1.6, 0.885, 0, 1.6, 0.015, 0.6, 5, [dx, 0.56, 0.5]);
      });
      PM(o, 'Pasacables', 'plastico', pc, 6, [0, 0.8, 0.5], { mk: 'pasacable', noShadow: true }); sombra(o, 0, 0, 3.2, 0.6);
      add(7, [o], { th: 0.45, ph: 1.05, asm: { off: [0, 0, 0.75], step: 3, first: true } });
    }

    /* ---- 8 · Impresoras 3D con AMS (4) --------------------------------------------
       Cada una con su cámara a la vista tras la puerta de vidrio: cama, guías, cabezal y la pieza que crece.
       La animación de impresión vive en animarImpresoras(), más abajo. */
    {
      const sp = [0xf2c230, 0xd9412e, 0x2f6fd0, 0x232326, 0x3f9b57, 0xf4f2ee, 0xf08a24, 0x8f9094];
      const mk = (X, k) => {
        const o = inst(8, X, 0.9, 5.2, 0), w = 0.389, h = 0.458, hw = w / 2, t = 0.022, yb = 0.075, yt = h - 0.03;
        // carcasa: base con la pantalla, costados, fondo y marco superior; el frente es la puerta de vidrio
        const shell = [];
        G.pushBox(shell, -hw, 0, -hw, w, yb, w);
        G.pushBox(shell, -hw, yb, -hw, t, h - yb, w); G.pushBox(shell, hw - t, yb, -hw, t, h - yb, w);
        G.pushBox(shell, -hw + t, yb, -hw, w - 2 * t, h - yb, 0.02);
        G.pushBox(shell, -hw + t, yt, -hw + 0.02, w - 2 * t, h - yt, 0.03); G.pushBox(shell, -hw + t, yt, hw - 0.03, w - 2 * t, h - yt, 0.03);
        const body = PM(o, 'Impresora P1S', 'equipo', shell, 0, [0, 0, 0], { mk: 'producto' });
        const kid = (m, x, y, z, opt) => { m.position.set(x, y, z); body.add(m); m.userData = Object.assign({ n: 8, inst: o, child: true }, opt); if (!opt || !opt.flat) { m.castShadow = false; m.receiveShadow = true; } return m; };
        const box = (sx, sy, sz, mat) => new T.Mesh(new T.BoxGeometry(sx, sy, sz), mat);
        // puerta: marco fino, vidrio y manija
        const fr = [];
        G.pushBox(fr, -hw + t, yb, hw - 0.012, w - 2 * t, 0.014, 0.012); G.pushBox(fr, -hw + t, yt - 0.014, hw - 0.012, w - 2 * t, 0.014, 0.012);
        G.pushBox(fr, -hw + t, yb, hw - 0.012, 0.012, yt - yb, 0.012); G.pushBox(fr, hw - t - 0.012, yb, hw - 0.012, 0.012, yt - yb, 0.012);
        kid(new T.Mesh(G.merge(fr), M.carbon), 0, 0, 0);
        const door = kid(new T.Mesh(new T.PlaneGeometry(w - 2 * t - 0.02, yt - yb - 0.02), M.vidrioPuerta), 0, (yb + yt) / 2, hw - 0.006, { flat: true }); door.renderOrder = 3;
        kid(box(0.008, 0.11, 0.012, M.inox), hw - t - 0.03, (yb + yt) / 2, hw + 0.004);
        const lid = kid(new T.Mesh(new T.PlaneGeometry(w - 2 * t, w - 0.06), M.vidrioPuerta), 0, h - 0.004, 0, { flat: true }); lid.rotation.x = -PI / 2; lid.renderOrder = 3;
        // pantalla táctil y luz de la cámara
        const lcd = new LCD(k);
        kid(new T.Mesh(new T.PlaneGeometry(0.07, 0.036), screenMat(lcd.tex)), -0.11, yb / 2 + 0.006, hw + 0.0015, { flat: true });
        kid(box(w - 2 * t - 0.06, 0.006, 0.01, M.ledBlanco), 0, yt - 0.012, hw - 0.04, { flat: true });
        // eje Z: dos husillos atrás y la cama que baja capa por capa
        [-1, 1].forEach((sx) => kid(new T.Mesh(new T.CylinderGeometry(0.006, 0.006, yt - yb, 10), M.inox), sx * 0.13, (yb + yt) / 2, -hw + 0.05));
        const bed = new T.Group(); body.add(bed);
        const plate = kid(box(0.256, 0.008, 0.256, M.pei), 0, -0.004, 0); bed.add(plate);
        const carrier = kid(box(0.29, 0.012, 0.25, M.carbonMate), 0, -0.016, -0.02); bed.add(carrier);
        // ejes X/Y (CoreXY): dos guías a los lados, la barra de carbono que avanza y el cabezal que la recorre
        const NZ = 0.372, gy = NZ + 0.05;
        [-1, 1].forEach((sx) => kid(box(0.012, 0.012, w - 0.06, M.carbon), sx * (hw - t - 0.012), gy, 0));
        const xbar = kid(box(w - 2 * t - 0.03, 0.01, 0.012, M.carbon), 0, gy, 0);
        const headL = []; G.pushBox(headL, -0.027, -0.03, -0.024, 0.054, 0.06, 0.048, 0x2b2c2f); G.pushBox(headL, -0.022, -0.026, 0.024, 0.044, 0.044, 0.004, 0xe7e6e2);
        headL.push({ g: new T.CylinderGeometry(0.0035, 0.0008, 0.012, 10), m: G.mat(0, -0.036, 0), c: 0xd8a24a });
        const head = kid(new T.Mesh(G.merge(headL), M.cabezal), 0, gy, 0);
        // la pieza: un sólido de revolución por filas, dibujado hasta la capa actual, con su tapa
        const pr = PIEZAS[k], part = solidoPorCapas(pr);
        const piece = kid(new T.Mesh(part.geo, M.impreso), 0, 0, 0); piece.castShadow = true; bed.add(piece);
        const cap = kid(new T.Mesh(part.cap, M.impreso), 0, 0, 0); bed.add(cap);
        // unidad AMS encima, con sus cuatro carretes bajo la tapa ahumada
        const l = [];
        G.pushBox(l, -0.184, h, -0.1415, 0.368, 0.05, 0.283, 0x2b2c2f);
        for (let i = 0; i < 4; i++) G.spool(l, -0.132 + i * 0.088, h + 0.135, 0, 0.085, 0.066, sp[(k * 3 + i) % sp.length], 'x');
        const ams = PM(o, 'Unidad AMS', 'decor', l, 1, [0, 0.34, 0], { mk: 'producto' });
        const cover = new T.Mesh(new T.BoxGeometry(0.368, 0.176, 0.283), M.vidrioOscuro); cover.position.set(0, h + 0.05 + 0.088, 0); cover.renderOrder = 3; ams.add(cover); cover.userData = { n: 8, inst: o, child: true };
        impresoras.push({ o, k, bed, head, xbar, piece, cap, part, pr, lcd, top: NZ + 0.008 });
        return o;
      };
      add(8, [1.0, 1.8, 2.6, 3.4].map(mk), { th: 0.42, ph: 1.12 });
      impresoras.forEach((p) => ponerCapa(p, 0, 0));
    }

    /* ---- 9 · Repisa de filamentos ----------------------------------------------------- */
    {
      G.reseed(909);
      const o = inst(9, 0.6, 1.6, 5.5, 0), l = [];
      for (let i = 0; i < 8; i++) l.push({ g: G.cyl(), m: cylM(0.2 + i * 0.4, 0.015, 0.09, 0.0055, 0.18, 'z'), c: 0xd0d2d5 });
      PM(o, 'Soportes invisibles', 'inox', l, 0, [0, 0, 0.3], { mk: 'soporte', noShadow: true });
      [0, 1].forEach((i) => {
        const dx = i ? 0.22 : -0.22;
        P(o, 'Capa inferior', 'melRovere', i * 1.6, 0, 0, 1.6, 0.015, 0.25, 1, [dx, -0.13, 0.62]);
        P(o, 'Capa superior', 'melRovere', i * 1.6, 0.015, 0, 1.6, 0.015, 0.25, 1, [dx, 0.13, 0.62]);
      });
      const dec = [], cs = [0x232326, 0x232326, 0x2f6fd0, 0x232326, 0xf4f2ee, 0x232326, 0xd9412e, 0x232326, 0x232326, 0xf08a24, 0x232326, 0x3f9b57];
      for (let i = 0; i < 12; i++) { if (i === 5) continue; G.spool(dec, 0.2 + i * 0.255, 0.13, 0.13, 0.1, 0.07, cs[i], 'z'); }
      G.fig(dec, 'jarron', 1.47, 0.03, 0.13, 0.2, 0x8f9094, 0);
      D(o, dec, 'decor');
      add(9, [o], { th: 0.4, ph: 1.1, lp: [-1.35, 0] });
    }

    /* ---- 10 · Mueble bajo con cajones (muro derecho) ----------------------------- */
    {
      G.reseed(1010);
      const o = inst(10, 6, 0, 5.0, -PI / 2);
      for (let m = 0; m < 5; m++) {
        const x0 = m * 0.6, dx = (m - 2) * 0.17;
        P(o, 'Lateral', 'melBlanca', x0, 0.1, 0, 0.015, 0.77, 0.48, 0, [dx - 0.065, 0, 0.45]);
        P(o, 'Lateral', 'melBlanca', x0 + 0.585, 0.1, 0, 0.015, 0.77, 0.48, 0, [dx + 0.065, 0, 0.45]);
        P(o, 'Piso', 'melBlanca', x0 + 0.015, 0.1, 0.006, 0.57, 0.015, 0.474, 0, [dx, 0, 0.45]);
        P(o, 'Amarre', 'melBlanca', x0 + 0.015, 0.855, 0.006, 0.57, 0.015, 0.1, 0, [dx, 0.14, 0.45]);
        P(o, 'Amarre', 'melBlanca', x0 + 0.015, 0.855, 0.38, 0.57, 0.015, 0.1, 0, [dx, 0.14, 0.45]);
        P(o, 'Fondo 6 mm', 'fondo', x0 + 0.005, 0.1, 0, 0.59, 0.76, 0.006, 0, [dx, 0, 0], { exA: [0, 0, -0.35] });
        patas(o, [[x0 + 0.07, 0.07], [x0 + 0.53, 0.07], [x0 + 0.07, 0.42], [x0 + 0.53, 0.42]], 0.1, 1, [dx, 0, 0.45], { exA: [0, 0, 0.45] });
        const rl = [];
        for (let j = 0; j < 3; j++) {
          const y = 0.103 + j * 0.2555, bx = [];
          G.pushBox(bx, x0 + 0.03, y + 0.04, 0.03, 0.015, 0.18, 0.45, 0xf2f0eb); G.pushBox(bx, x0 + 0.555, y + 0.04, 0.03, 0.015, 0.18, 0.45, 0xf2f0eb);
          G.pushBox(bx, x0 + 0.045, y + 0.04, 0.03, 0.51, 0.18, 0.015, 0xf2f0eb); G.pushBox(bx, x0 + 0.045, y + 0.04, 0.465, 0.51, 0.18, 0.015, 0xf2f0eb);
          G.pushBox(bx, x0 + 0.031, y + 0.034, 0.03, 0.538, 0.006, 0.45, 0xf6f4ef);
          PM(o, 'Caja de cajón', 'decor', bx, 4, [dx, 0, 0.98], { mk: 'melBlanca' });
          G.pushBox(rl, x0 + 0.016, y + 0.1, 0.03, 0.012, 0.036, 0.45, 0xc6c8cb); G.pushBox(rl, x0 + 0.572, y + 0.1, 0.03, 0.012, 0.036, 0.45, 0xc6c8cb);
          P(o, 'Frente de cajón', 'melRovere', x0 + 0.002, y, 0.48, 0.596, 0.252, 0.015, 5, [dx, 0, 1.45]);
          P(o, 'Perfil manija', 'alu', x0 + 0.002, y + 0.243, 0.495, 0.596, 0.011, 0.012, 5, [dx, 0.05, 1.45], { mk: 'manija', noShadow: true });
        }
        PM(o, 'Rieles de extensión total', 'alu', rl, 4, [dx, 0, 0.45], { mk: 'riel', noShadow: true, exA: [0, 0, 0.5] });
      }
      P(o, 'Tapa lateral', 'melRovere', -0.015, 0, 0, 0.015, 0.87, 0.5, 2, [-0.62, 0, 0.45], { grain: 1 });
      P(o, 'Tapa lateral', 'melRovere', 3.0, 0, 0, 0.015, 0.87, 0.5, 2, [0.62, 0, 0.45], { grain: 1 });
      P(o, 'Zócalo', 'melRovere', 0, 0.005, 0.43, 1.5, 0.09, 0.015, 2, [-0.3, 0, 0.9]);
      P(o, 'Zócalo', 'melRovere', 1.5, 0.005, 0.43, 1.5, 0.09, 0.015, 2, [0.3, 0, 0.9]);
      [0, 1].forEach((i) => {
        const dx = i ? 0.3 : -0.3;
        P(o, 'Tapa blanca (capa inferior)', 'melBlanca', i * 1.5, 0.87, 0, 1.5, 0.015, 0.5, 3, [dx, 0.34, 0.45]);
        P(o, 'Tapa blanca (capa superior)', 'melBlanca', i * 1.5, 0.885, 0, 1.5, 0.015, 0.5, 3, [dx, 0.5, 0.45]);
      });
      const dec = [];
      G.fig(dec, 'jarron', 0.35, 0.9, 0.25, 0.22, 0xf4f2ee, 0); G.fig(dec, 'gema', 0.62, 0.9, 0.3, 0.12, 0x232326, 0.4);
      G.pushBox(dec, 1.9, 0.9, 0.12, 0.3, 0.1, 0.24, 0xc9a579, 0.1); G.pushBox(dec, 1.95, 1.0, 0.14, 0.22, 0.08, 0.2, 0xd8b88c, -0.15);
      G.fig(dec, 'conejo', 1.35, 0.9, 0.26, 0.24, 0xf4f2ee, 0.3);
      D(o, dec); sombra(o, 0, 0, 3.0, 0.5);
      add(10, [o], { th: -0.95, ph: 1.05, asm: { off: [0, 0, 0.65], step: 1, first: false } });
    }

    /* ---- 11 · Panel perforado ------------------------------------------------------ */
    {
      G.reseed(1111);
      const o = inst(11, 6, 1.0, 4.95, -PI / 2);
      [0, 0.585, 1.17].forEach((y, i) => P(o, 'Listón horizontal', 'negro', 0, y, 0, 2.2, 0.05, 0.015, 0, [0, (i - 1) * 0.18, 0.22], { mk: 'mdf15' }));
      chazos(o, [0.15, 0.75, 1.45, 2.05].flatMap((x) => [[x, 0.025, 0.03], [x, 1.195, 0.03]]), 0, [0, 0, 0.4]);
      [0.3, 0.83, 1.32, 1.85].forEach((x) => P(o, 'Listón vertical', 'negro', x, 0.05, 0, 0.05, 1.12, 0.0145, 1, [0, 0, 0.52], { mk: 'mdf15' }));
      const sheet = P(o, 'Lámina perforada', 'perforada', 0, 0, 0.015, 2.2, 1.22, 0.002, 2, [0, 0, 0.9], { bev: 0 });
      const uv = sheet.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (i % 4 === 1 || i % 4 === 3 ? 1 : 0) * 21.6, (i % 4 < 2 ? 1 : 0) * 12);
      const l = [], cs = [0x2f6fd0, 0xf2c230, 0xd9412e, 0x3f9b57, 0xf08a24, 0x232326, 0xf4f2ee, 0x8a4fd0, 0x2aa3a0, 0xe96aa6];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {            // carretes hacia el fondo del local
        const x = 0.2 + c * 0.24, y = 1.03 - r * 0.33;
        G.spool(l, x, y, 0.065, 0.098, 0.062, cs[(r * 4 + c * 3) % cs.length], 'z');
        l.push({ g: G.cyl(), m: cylM(x, y, 0.06, 0.006, 0.09, 'z'), c: 0x9a9da1 });
      }
      for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {            // accesorios y repuestos hacia la fachada
        const x = 1.2 + c * 0.2, y = 1.08 - r * 0.27, w = 0.07 + G.rand() * 0.05, hh = 0.1 + G.rand() * 0.07;
        l.push({ g: G.cyl(), m: cylM(x, y + hh / 2 + 0.01, 0.04, 0.004, 0.05, 'z'), c: 0x9a9da1 });
        G.pushBox(l, x - w / 2, y - hh / 2, 0.03, w, hh, 0.03, G.rand() > 0.35 ? 0x26272a : 0xe9e7e2);
      }
      PM(o, 'Ganchos, carretes y accesorios', 'decor', l, 3, [0, 0, 1.32], { mk: 'ganchos' });
      add(11, [o], { th: -1.0, ph: 1.2 });
    }

    /* ---- 12 · Vitrina vertical mural ---------------------------------------------- */
    {
      G.reseed(1212);
      const o = inst(12, 6, 1.05, 2.5, -PI / 2);
      P(o, 'Lateral', 'melBlanca', 0, 0, 0, 0.015, 1.2, 0.15, 0, [-0.2, 0, 0.26]);
      P(o, 'Lateral', 'melBlanca', 0.385, 0, 0, 0.015, 1.2, 0.15, 0, [0.2, 0, 0.26]);
      P(o, 'Piso', 'melBlanca', 0.015, 0, 0, 0.37, 0.015, 0.15, 0, [0, -0.2, 0.26]);
      P(o, 'Fondo 6 mm', 'fondoLit', 0.005, 0.005, 0, 0.39, 1.19, 0.006, 0, [0, 0, 0], { mk: 'fondo', exA: [0, 0, -0.2] });
      [0.3, 0.6, 0.9].forEach((y) => P(o, 'Entrepaño de acrílico', 'acrilico', 0.016, y, 0.007, 0.368, 0.003, 0.14, 1, [0, 0, 0.55], { noShadow: true, order: 3 }));
      P(o, 'Frente de acrílico', 'acrilico', 0.002, 0.002, 0.139, 0.396, 1.196, 0.003, 2, [0, 0, 0.85], { noShadow: true, order: 4 });
      P(o, 'Techo', 'melBlanca', 0.015, 1.185, 0, 0.37, 0.015, 0.15, 2, [0, 0.24, 0.26]);
      P(o, 'Perfil LED (retal)', 'led', 0.017, 0.02, 0.118, 0.012, 1.16, 0.01, 3, [-0.1, 0, 0.6], { noShadow: true });
      P(o, 'Fuente 12 V', 'equipo', 0.14, 1.2, 0.04, 0.12, 0.03, 0.05, 3, [0, 0.4, 0.26], { mk: 'fuente' });
      chazos(o, [[0.1, 1.1, 0.03], [0.3, 1.1, 0.03]], 4, [0, 0, 0.2], { exA: [0, 0, 0.3] });
      const dec = [];
      [0.015, 0.303, 0.603, 0.903].forEach((y, i) => { G.fig(dec, ['torre', 'conejo', 'busto', 'jarron'][i], 0.13, y, 0.075, 0.2, [0x232326, 0xf4f2ee, 0x232326, 0x2f6fd0][i], 0.3); G.fig(dec, ['gema', 'nudo', 'aro', 'facetado'][i], 0.28, y, 0.075, 0.13, [0xf4f2ee, 0x232326, 0xf4f2ee, 0x232326][i], 0); });
      D(o, dec);
      add(12, [o], { th: -0.9, ph: 1.25, asm: { off: [0, 0, 0.5], step: 4, first: true } });
    }

    /* ---- 13 · Estantería exhibidora alta (muro derecho) ------------------------- */
    {
      G.reseed(1313);
      const o = inst(13, 6, 0, 1.5, -PI / 2), dec = [];
      P(o, 'Lateral', 'melRovere', 0, 0, 0, 0.015, 2.4, 0.35, 0, [-0.3, 0, 0.5]);
      P(o, 'Lateral', 'melRovere', 1.185, 0, 0, 0.015, 2.4, 0.35, 0, [0.3, 0, 0.5]);
      P(o, 'Piso', 'melRovere', 0.015, 0.08, 0.006, 1.17, 0.015, 0.344, 0, [0, 0, 0.5]);
      P(o, 'Techo', 'melRovere', 0.015, 2.385, 0.006, 1.17, 0.015, 0.344, 0, [0, 0.32, 0.5]);
      P(o, 'Fondo 6 mm', 'fondoLit', 0.005, 0.005, 0, 1.19, 2.39, 0.006, 1, [0, 0, 0], { mk: 'fondo', exA: [0, 0, -0.42] });
      patas(o, [[0.1, 0.06], [1.1, 0.06], [0.1, 0.28], [1.1, 0.28]], 0.08, 2, [0, 0, 0.5], { exA: [0, 0, 0.55] });
      P(o, 'Zócalo', 'melRovere', 0.015, 0, 0.31, 1.17, 0.08, 0.015, 2, [0, 0, 0.95]);
      P(o, 'Perfil LED', 'led', 0.017, 0.1, 0.324, 0.014, 2.28, 0.012, 3, [-0.15, 0, 0.8], { noShadow: true });
      P(o, 'Perfil LED', 'led', 1.169, 0.1, 0.324, 0.014, 2.28, 0.012, 3, [0.15, 0, 0.8], { noShadow: true });
      P(o, 'Fuente 12 V', 'equipo', 0.5, 2.4, 0.1, 0.16, 0.04, 0.06, 3, [0, 0.5, 0.5], { mk: 'fuente' });
      chazos(o, [[0.3, 2.2, 0.03], [0.9, 2.2, 0.03]], 4, [0, 0, 0.28], { exA: [0, 0, 0.4] });
      const ys = [1, 2, 3, 4, 5].map((i) => 0.095 + i * 0.3817);
      ys.forEach((y) => P(o, 'Entrepaño', 'melRovere', 0.015, y, 0.006, 1.17, 0.015, 0.33, 4, [0, 0, 0.9]));
      const pal = [0x232326, 0x232326, 0xf4f2ee, 0xf4f2ee, 0x2f6fd0, 0x232326, 0xf4f2ee];
      [0.095].concat(ys).forEach((y, k) => fila(dec, 0.1, 1.1, y + 0.015, 0.18, 2 + (k % 2), 0.17, 0.3, pal));
      D(o, dec); sombra(o, 0, 0, 1.2, 0.35);
      add(13, [o], { th: -0.85, asm: { off: [0, 0, 0.8], step: 4, first: true } });
    }

    /* ---- 14 · Maceteros con planta (3, todos dentro del local) --------------------------------------------- */
    {
      G.reseed(1414);
      const mk = (X, Dd) => {
        const o = inst(14, X, 0, Dd, 0);
        const g = new T.CylinderGeometry(0.2828, 0.215, 0.75, 4, 1); g.rotateY(PI / 4); g.translate(0, 0.375, 0);
        P(o, 'Matera Urbi Beton', 'cemento', 0, 0, 0, 0, 0, 0, 0, [0, 0, 0], { geo: g, mk: 'producto' });
        const l = []; G.pushBox(l, -0.17, 0.72, -0.17, 0.34, 0.025, 0.34, 0x3a2e24); G.plant(l, 0, 0.73, 0, 0.56, 15);
        const m = new T.Mesh(G.merge(l), L.mats.decorMate); m.castShadow = true; m.receiveShadow = true;
        reg(o, m, { plant: true }); o.plants = [m]; sombra(o, -0.2, -0.2, 0.4, 0.4, 0.3);
        return o;
      };
      add(14, [mk(0.45, 0.30), mk(5.75, 1.76), mk(0.3, 5.2)], { th: 0.5, ph: 1.1 });
    }

    /* ---- 15 · Mampara de vidrio con puerta ----------------------------------------- */
    {
      const o = inst(15, 3.9, 0, 5.6, 0);
      P(o, 'Canal de piso', 'acero', 0, 0, 0.03, 1.05, 0.025, 0.04, 0, [-0.2, 0, 0.5], { mk: 'canal' });
      P(o, 'Canal de cielo', 'acero', 0, 2.375, 0.03, 1.95, 0.025, 0.04, 0, [0, 0, 0.5], { mk: 'canal' });
      P(o, 'Canal lateral', 'acero', 0, 0.025, 0.03, 0.025, 2.35, 0.04, 0, [-0.35, 0, 0.5], { mk: 'canal' });
      P(o, 'Canal de columna', 'acero', 1.925, 0, 0.03, 0.025, 2.375, 0.04, 0, [0.12, 0, 0.5], { mk: 'canal' });
      P(o, 'Vidrio fijo 1050 × 2400', 'vidrio', 0.025, 0.025, 0.045, 1.02, 2.35, 0.01, 1, [-0.2, 0, 0.9], { noShadow: true, order: 3 });
      P(o, 'Puerta 900 × 2400', 'vidrio', 1.05, 0.012, 0.045, 0.875, 2.36, 0.01, 2, [0, 0, 1.3], { noShadow: true, order: 3 });
      PM(o, 'Bisagras', 'inox', [0.35, 2.05].map((y) => ({ g: new T.BoxGeometry(0.07, 0.1, 0.03), m: G.mat(1.9, y, 0.05), c: 0xd9dbde })), 2, [0.1, 0, 1.3], { mk: 'kit' });
      PM(o, 'Manija', 'inox', [{ g: G.cyl(), m: cylM(1.13, 1.1, 0.085, 0.011, 0.42), c: 0xd9dbde }, { g: G.cyl(), m: cylM(1.13, 1.1, 0.015, 0.011, 0.42), c: 0xd9dbde }, { g: G.cyl(), m: cylM(1.13, 0.96, 0.05, 0.007, 0.08, 'z'), c: 0xd9dbde }, { g: G.cyl(), m: cylM(1.13, 1.24, 0.05, 0.007, 0.08, 'z'), c: 0xd9dbde }], 3, [0, 0, 1.6], { mk: 'kit' });
      P(o, 'Franja visible', 'escarcha', 0.03, 1.45, 0.056, 1.01, 0.09, 0.001, 4, [-0.2, 0, 1.75], { noShadow: true, order: 4, mk: 'franja' });
      P(o, 'Franja visible', 'escarcha', 1.06, 1.45, 0.056, 0.855, 0.09, 0.001, 4, [0, 0, 1.9], { noShadow: true, order: 4, mk: 'franja' });
      add(15, [o], { th: 0.1, ph: 1.25 });
    }

    /* ---- 16 · Estanterías de bodega (2, trastienda) --------------------------------- */
    {
      G.reseed(1616);
      const o = inst(16, 3.2, 0, 7.0, 0), dec = [];
      for (let u = 0; u < 2; u++) {
        const x0 = u * 0.9, dx = u ? 0.25 : -0.25, post = [];
        [[0, 0], [0.87, 0], [0, 0.37], [0.87, 0.37]].forEach((p) => G.pushBox(post, x0 + p[0], 0, p[1], 0.03, 1.8, 0.03, 0x8d9094));
        PM(o, 'Parales', 'gris', post, 0, [dx, 0, 0.3], { mk: 'producto' });
        [0.08, 0.5, 0.93, 1.36, 1.77].forEach((y, k) => {
          P(o, 'Nivel', 'gris', x0 + 0.005, y, 0.005, 0.89, 0.03, 0.39, 1, [dx, 0.06 * k, 0.75], { mk: 'producto' });
          if (k < 4) for (let b = 0; b < 2; b++) { const w = 0.22 + G.rand() * 0.14, h = 0.14 + G.rand() * 0.14; G.pushBox(dec, x0 + 0.08 + b * 0.42 + G.rand() * 0.05, y + 0.03, 0.06, w, h, 0.26, pick([0xc9a579, 0xb8935f, 0xd8b88c, 0x2b2c2f, 0xe9e7e2])); }
        });
      }
      D(o, dec, 'decorMate'); sombra(o, 0, 0, 1.8, 0.4, 0.26);
      add(16, [o], { th: 0.3, ph: 0.6, zone: 'trastienda' });
    }

    /* ---- 17 · Escritorio de diseño (trastienda) ---------------------------------------- */
    {
      const o = inst(17, 0.2, 0, 7.0, 0), a = 0.025;
      P(o, 'Larguero', 'acero', 0.05 + a, 0.71, 0.07, 1.05, a, a, 0, [0, 0.24, 0]);
      P(o, 'Larguero', 'acero', 0.05 + a, 0.71, 0.505, 1.05, a, a, 0, [0, 0.24, 0]);
      P(o, 'Travesaño', 'acero', 0.05, 0.71, 0.07 + a, a, a, 0.41, 0, [0, 0.24, 0]);
      P(o, 'Travesaño', 'acero', 1.125, 0.71, 0.07 + a, a, a, 0.41, 0, [0, 0.24, 0]);
      [[0.05, 0.07, -1, -1], [1.125, 0.07, 1, -1], [0.05, 0.505, -1, 1], [1.125, 0.505, 1, 1]].forEach((p) => P(o, 'Pata', 'acero', p[0], 0, p[1], a, 0.71, a, 1, [p[2] * 0.24, 0, p[3] * 0.2]));
      P(o, 'Tapa blanca', 'melBlanca', 0, 0.735, 0, 1.2, 0.015, 0.6, 2, [0, 0.62, 0]);
      PM(o, 'Pasacable', 'plastico', [{ g: G.cyl(), m: cylM(1.1, 0.751, 0.08, 0.03, 0.004), c: 0x111113 }], 2, [0, 0.72, 0], { mk: 'pasacable', noShadow: true });
      const dec = [];
      G.pushBox(dec, 0.33, 0.75, 0.1, 0.24, 0.012, 0.14, 0x1a1b1e); G.pushBox(dec, 0.44, 0.76, 0.14, 0.03, 0.12, 0.03, 0x1a1b1e);
      G.pushBox(dec, 0.15, 0.86, 0.13, 0.6, 0.34, 0.018, 0x1a1b1e); G.pushBox(dec, 0.165, 0.875, 0.149, 0.57, 0.31, 0.002, 0x4f79b8);
      G.pushBox(dec, 0.26, 0.75, 0.36, 0.38, 0.012, 0.13, 0xdedcd7); G.pushBox(dec, 0.72, 0.75, 0.38, 0.06, 0.02, 0.1, 0xdedcd7);
      D(o, dec, 'decorMate'); sombra(o, 0, 0, 1.2, 0.6, 0.16);
      add(17, [o], { th: 0.35, ph: 0.6, zone: 'trastienda' });
    }

    /* ---- 18 · Silla de trabajo (trastienda) ---------------------------------------------- */
    {
      const o = inst(18, 0.82, 0, 6.02, PI), l = [], c = 0x151517;
      for (let i = 0; i < 5; i++) l.push({ g: new T.BoxGeometry(0.28, 0.025, 0.04), m: G.mat(Math.cos(i * PI * 0.4) * 0.14, 0.05, Math.sin(i * PI * 0.4) * 0.14, 0, -i * PI * 0.4, 0), c });
      l.push({ g: G.cyl(), m: cylM(0, 0.24, 0, 0.025, 0.38), c: 0x8d9094 });
      G.pushBox(l, -0.23, 0.42, -0.22, 0.46, 0.06, 0.44, c);
      G.pushBox(l, -0.21, 0.56, 0.2, 0.42, 0.42, 0.035, 0x232326);
      G.pushBox(l, -0.03, 0.44, 0.19, 0.06, 0.16, 0.03, c);
      PM(o, 'Silla ergonómica', 'decorMate', l, 0, [0, 0, 0], { mk: 'producto' }); sombra(o, -0.25, -0.25, 0.5, 0.5, 0.2);
      add(18, [o], { th: 0.35, ph: 0.6, zone: 'trastienda' });
    }

    /* ---- 19 y 20 · Pantallas de 55" en vertical (pilares de la fachada, exterior) --------
       Las dos reproducen el mismo video; cada una va centrada en su pilar de 0.75 m, con la base a 0.90 m. */
    const pilar = (n, X, cfg) => {
      const o = inst(n, X - 0.3465, 0.9, -R.dim.PD, 0);
      PM(o, 'Soporte fijo', 'acero', [{ g: new T.BoxGeometry(0.44, 0.44, 0.022), m: G.mat(0.3465, 0.6055, 0.011), c: 0x2a2a2c }, { g: new T.BoxGeometry(0.05, 0.6, 0.03), m: G.mat(0.2115, 0.6055, 0.022), c: 0x2a2a2c }, { g: new T.BoxGeometry(0.05, 0.6, 0.03), m: G.mat(0.4815, 0.6055, 0.022), c: 0x2a2a2c }], 0, [0, 0, 0.14], { mk: 'soporte' });
      const tv = P(o, 'Televisor 55"', 'plastico', 0, 0, 0.035, 0.693, 1.211, 0.045, 1, [0, 0, 0.55], { mk: 'producto' });
      const scr = new T.Mesh(new T.PlaneGeometry(0.677, 1.195), screenMat(canvasTex(432, 768, drawExteriorScreen)));
      scr.position.z = 0.0235; tv.add(scr); scr.userData = { n, inst: o, child: true };
      screenVideo(scr, 'assets/video/pantalla-exterior');
      add(n, [o], Object.assign({ ph: 1.3, zone: 'fachada' }, cfg));
    };
    pilar(19, 0.225, { th: 0.35 });
    pilar(20, 5.775, { th: -0.35, lp: [-0.3, 0.12] });

    F.finish(F.items);
    animarImpresoras();
  };
  /* cajas envolventes y datos derivados de un juego de muebles */
  F.finish = function (items) {
    Object.keys(items).forEach((n) => { if (!items[n] || !items[n].insts) return; items[n].insts.forEach((o) => {
      o.group.updateMatrixWorld(true);
      o.box = new T.Box3();
      o.parts.forEach((p) => o.box.expandByObject(p));
      o.center = o.box.getCenter(new T.Vector3()); o.radius = o.box.getSize(new T.Vector3()).length() / 2;
      o.steps = o.parts.reduce((a, p) => Math.max(a, p.userData.step + 1), 0);
    }); });
  };
  /* constructores para las versiones alternativas */
  F.h = { inst, reg, P, PM, D, cylM, patas, chazos, add, sombra, fila, pick, PAL };
})();
