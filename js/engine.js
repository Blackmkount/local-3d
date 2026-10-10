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

  /* ------------------------------------------------------------- texturas */
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  E.rnd = rnd;

  function woodTexture(base, dark, light, seed) {
    const c = canvas(1024, 512), g = c.getContext('2d'), r = rnd(seed);
    g.fillStyle = base; g.fillRect(0, 0, 1024, 512);
    // bandas anchas de tono
    for (let i = 0; i < 26; i++) {
      const y = r() * 512, h = 8 + r() * 46;
      g.fillStyle = r() > 0.5 ? light : dark; g.globalAlpha = 0.05 + r() * 0.1;
      g.fillRect(0, y, 1024, h);
    }
    // veta fina, a lo largo de U
    for (let i = 0; i < 520; i++) {
      const y = r() * 512, x = r() * 1024, len = 120 + r() * 700;
      g.strokeStyle = r() > 0.35 ? dark : light; g.globalAlpha = 0.05 + r() * 0.16; g.lineWidth = 0.6 + r() * 1.3;
      g.beginPath(); g.moveTo(x, y);
      g.bezierCurveTo(x + len * 0.3, y + (r() - 0.5) * 5, x + len * 0.6, y + (r() - 0.5) * 5, x + len, y + (r() - 0.5) * 3);
      g.stroke();
      if (x + len > 1024) { g.beginPath(); g.moveTo(x - 1024, y); g.lineTo(x + len - 1024, y + (r() - 0.5) * 3); g.stroke(); }
    }
    // catedrales suaves
    for (let i = 0; i < 5; i++) {
      const cx = r() * 1024, cy = r() * 512;
      g.strokeStyle = dark; g.lineWidth = 1.2;
      for (let k = 1; k < 7; k++) { g.globalAlpha = 0.07; g.beginPath(); g.ellipse(cx, cy, 60 * k + 40, 5 * k + 2, 0, 0, Math.PI * 2); g.stroke(); }
    }
    g.globalAlpha = 1;
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }

  function tileTexture() {
    const N = 4, S = 1024, c = canvas(S, S), g = c.getContext('2d'), r = rnd(11), ts = S / N;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const v = 163 + Math.round(r() * 9);
      g.fillStyle = 'rgb(' + (v + 4) + ',' + (v + 1) + ',' + (v - 6) + ')';
      g.fillRect(i * ts, j * ts, ts, ts);
      for (let k = 0; k < 16; k++) {           // nubes del porcelanato
        const x = i * ts + r() * ts, y = j * ts + r() * ts, rad = 30 + r() * 110;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        const a = 0.035 + r() * 0.04, w = r() > 0.5 ? 255 : 150;
        gr.addColorStop(0, 'rgba(' + w + ',' + w + ',' + (w - 6) + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + w + ',' + w + ',' + w + ',0)');
        g.save(); g.beginPath(); g.rect(i * ts, j * ts, ts, ts); g.clip(); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); g.restore();
      }
    }
    g.strokeStyle = 'rgba(96,92,85,0.6)'; g.lineWidth = 2;
    for (let i = 0; i <= N; i++) { g.beginPath(); g.moveTo(i * ts, 0); g.lineTo(i * ts, S); g.stroke(); g.beginPath(); g.moveTo(0, i * ts); g.lineTo(S, i * ts); g.stroke(); }
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 16;
    return t;
  }

  function dotsTexture() {
    const c = canvas(128, 128), g = c.getContext('2d');
    g.fillStyle = '#f1f0ec'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#6f6d69';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(16 + i * 32, 16 + j * 32, 4.2, 0, 7); g.fill(); }
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    return t;
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
    const m = new T.Mesh(new T.PlaneGeometry(w + pad * 2, d + pad * 2), new T.MeshBasicMaterial({ map: E.glowTexture(w, d, pad, 0.06), color: 0x1a140c, transparent: true, opacity: op == null ? 0.34 : op, depthWrite: false, toneMapped: false }));
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
  E.ledMats = []; E.glowMats = []; E.ledLights = [];
  E.ledLevel = 1;
  E.setLed = function (k) {
    E.ledLevel = k;
    E.ledMats.forEach((m) => m.color.setRGB(lerp(0.16, m.userData.rgb[0], k), lerp(0.15, m.userData.rgb[1], k), lerp(0.14, m.userData.rgb[2], k)));
    E.glowMats.forEach((m) => { m.opacity = m.userData.op * k; });
    E.ledLights.forEach((l) => { l.intensity = l.userData.i * k; });
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
    const S = (o) => new T.MeshStandardMaterial(o);
    const rovere = woodTexture('#c9a47a', '#8f6a45', '#e3c9a3', 7);
    const slat = woodTexture('#c39a6c', '#855f3c', '#dcbd94', 21);
    const M = {
      muro: S({ color: 0xece7de, roughness: 0.92 }),
      cielo: S({ color: 0xf0ece5, roughness: 0.95 }),
      carbon: S({ color: 0x232325, roughness: 0.62, metalness: 0.1 }),
      carbonMate: S({ color: 0x2c2c2e, roughness: 0.85 }),
      melBlanca: S({ color: 0xf2f0eb, roughness: 0.5 }),
      melRovere: S({ map: rovere, color: 0xffffff, roughness: 0.58 }),
      melPlomo: S({ color: 0x4c4a47, roughness: 0.55 }),
      fondo: S({ color: 0xf6f4ef, roughness: 0.6 }),
      fondoLit: S({ color: 0xf8f1e4, roughness: 0.6, emissive: 0xffc98c, emissiveIntensity: 0.62 }),
      mdf15: S({ color: 0xb8956b, roughness: 0.85 }),
      mdf55: S({ color: 0xc4a379, roughness: 0.85 }),
      laca: S({ color: 0xf6f5f2, roughness: 0.3 }),
      negro: S({ color: 0x19191b, roughness: 0.7 }),
      acero: S({ color: 0x1b1b1d, roughness: 0.5, metalness: 0.45 }),
      alu: S({ color: 0xc6c8cb, roughness: 0.35, metalness: 0.85 }),
      inox: S({ color: 0xd9dbde, roughness: 0.22, metalness: 1 }),
      gris: S({ color: 0x8d9094, roughness: 0.5, metalness: 0.55 }),
      plastico: S({ color: 0x141416, roughness: 0.72 }),
      equipo: S({ color: 0x2b2c2f, roughness: 0.4, metalness: 0.2 }),
      cemento: S({ color: 0xa3a19b, roughness: 0.95 }),
      perforada: S({ map: dotsTexture(), color: 0xffffff, roughness: 0.55, metalness: 0.15 }),
      vidrio: S({ color: 0xd9ecea, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.17, depthWrite: false, side: T.DoubleSide, envMapIntensity: 1.8 }),
      vidrioOscuro: S({ color: 0x1b2026, roughness: 0.06, transparent: true, opacity: 0.45, depthWrite: false, envMapIntensity: 1.6 }),
      acrilico: S({ color: 0xffffff, roughness: 0.03, transparent: true, opacity: 0.13, depthWrite: false, side: T.DoubleSide, envMapIntensity: 1.8 }),
      escarcha: S({ color: 0xffffff, roughness: 0.8, transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide }),
      liston: S({ map: slat, color: 0xffffff, roughness: 0.62 }),
      listonFondo: S({ color: 0x5b4330, roughness: 0.8 }),
      decor: S({ vertexColors: true, roughness: 0.55 }),
      decorMate: S({ vertexColors: true, roughness: 0.9 }),
      led: E.ledMaterial(),
      ledFrio: E.ledMaterial([1.6, 2.3, 3.4]),
      ledBlanco: E.ledMaterial([3.2, 3.0, 2.7])
    };
    L.mats = M;
    E.textures = { rovere, slat };
    return M;
  }

  /* fantasma para aislar un mueble y para resaltar un material */
  E.ghost = new T.MeshBasicMaterial({ color: 0x9a968f, transparent: true, opacity: 0.07, depthWrite: false });
  E.ghostPart = new T.MeshBasicMaterial({ color: 0xb9b4ac, transparent: true, opacity: 0.16, depthWrite: false });
  E.edgeMat = new T.LineBasicMaterial({ color: 0xff9a3d, transparent: true, opacity: 0.95 });
  E.edgeSoft = new T.LineBasicMaterial({ color: 0x2b2b2e, transparent: true, opacity: 0.38 });

  /* ------------------------------------------------------------------ init */
  E.init = function (canvasEl) {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    E.mobile = coarse || Math.min(window.innerWidth, window.innerHeight) < 620;
    const renderer = new T.WebGLRenderer({ canvas: canvasEl, antialias: true, powerPreference: 'high-performance' });
    E.renderer = renderer;
    E.dpr = Math.min(window.devicePixelRatio || 1, E.mobile ? 1.6 : 2);
    renderer.setPixelRatio(E.dpr);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;

    const scene = (E.scene = new T.Scene());
    scene.background = new T.Color(BG);
    scene.fog = new T.Fog(BG, 17, 46);

    const camera = (E.camera = new T.PerspectiveCamera(36, 1, 0.08, 140));

    makeMaterials();
    buildEnvironment();
    buildLights();
    buildFloor();

    E.resize();
    window.addEventListener('resize', E.resize);
    if (window.ResizeObserver) new ResizeObserver(E.resize).observe(canvasEl.parentElement);
    bindControls(canvasEl);
    requestAnimationFrame(frame);
    return E;
  };

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

  function buildLights() {
    const sc = E.scene;
    sc.add(new T.HemisphereLight(0xfff1de, 0xc9bfb0, 0.42));
    const key = (E.key = new T.DirectionalLight(0xffefd8, 1.15));
    key.position.set(2.6, 10.5, 5.4); key.target.position.set(0, 0, -0.2);
    key.castShadow = true;
    const sh = key.shadow; sh.mapSize.set(E.mobile ? 1536 : 3072, E.mobile ? 1536 : 3072);
    sh.camera.left = -6.5; sh.camera.right = 6.5; sh.camera.top = 7.5; sh.camera.bottom = -7; sh.camera.near = 2; sh.camera.far = 22;
    sh.bias = -0.0004; sh.normalBias = 0.02; sh.radius = 5; sh.blurSamples = 12;
    sc.add(key, key.target);
    const fill = new T.DirectionalLight(0xe9f0ff, 0.3); fill.position.set(-6, 6, 3); sc.add(fill);
    // luz cálida del interior (rieles y gargantas), sin sombras
    const warm = (x, y, z, i, d) => { const p = new T.PointLight(0xffd9ad, i, d, 1.6); p.position.set(x, y, z); p.userData.i = i; sc.add(p); E.ledLights.push(p); };
    warm(-1.2, 2.5, 1.6, 9, 9);
    warm(1.3, 2.5, 0.0, 9, 9);
    warm(0, 2.3, -1.6, 7, 7);
  }

  /* ------------------------------------------- piso con reflejo en espejo */
  function buildFloor() {
    const tex = tileTexture();
    const size = 90;
    tex.repeat.set(size / 2.4, size / 2.4);
    // la trama de 0.60 arranca en la cara interior del muro izquierdo y de la fachada
    tex.offset.set((size / 2 - 3) / 2.4 % 1, (size / 2 - 3.5) / 2.4 % 1);
    const mat = new T.MeshStandardMaterial({ map: tex, roughness: 0.34, metalness: 0.0, envMapIntensity: 0.55 });
    E.reflect = { on: true, scale: E.mobile ? 0.4 : 0.55, k: 0.62 };
    const rt = (E.reflect.rt = new T.WebGLRenderTarget(4, 4, { type: T.UnsignedByteType, colorSpace: T.SRGBColorSpace, minFilter: T.LinearFilter, magFilter: T.LinearFilter, samples: 0 }));
    const uni = (E.reflect.uni = { tRefl: { value: rt.texture }, uRes: { value: new T.Vector2(1, 1) }, uReflK: { value: E.reflect.k } });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.tRefl = uni.tRefl; sh.uniforms.uRes = uni.uRes; sh.uniforms.uReflK = uni.uReflK;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D tRefl;\nuniform vec2 uRes;\nuniform float uReflK;')
        .replace('#include <opaque_fragment>', [
          'vec2 ruv = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes;',
          'vec2 px = 2.2 / uRes;',
          'vec3 rf = texture2D(tRefl, ruv).rgb * 0.28;',
          'rf += texture2D(tRefl, ruv + vec2(px.x, 0.0)).rgb * 0.12 + texture2D(tRefl, ruv - vec2(px.x, 0.0)).rgb * 0.12;',
          'rf += texture2D(tRefl, ruv + vec2(0.0, px.y * 2.0)).rgb * 0.12 + texture2D(tRefl, ruv - vec2(0.0, px.y * 2.0)).rgb * 0.12;',
          'rf += texture2D(tRefl, ruv + px * 1.6).rgb * 0.06 + texture2D(tRefl, ruv - px * 1.6).rgb * 0.06;',
          'rf += texture2D(tRefl, ruv + vec2(px.x, -px.y) * 1.6).rgb * 0.06 + texture2D(tRefl, ruv - vec2(px.x, -px.y) * 1.6).rgb * 0.06;',
          'float ndv = clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0);',
          'float fres = 0.3 + 0.7 * pow(1.0 - ndv, 2.2);',
          'float joint = smoothstep(0.25, 0.75, diffuseColor.r * 1.25);',
          'outgoingLight = mix(outgoingLight, rf, uReflK * fres * joint);',
          '#include <opaque_fragment>'
        ].join('\n'));
    };
    const floor = (E.floor = new T.Mesh(new T.PlaneGeometry(size, size), mat));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.userData.floor = true;
    E.scene.add(floor);
    E.vcam = new T.PerspectiveCamera();
    E.vcam.matrixAutoUpdate = false; E.vcam.matrixWorldAutoUpdate = false;
    E.noReflect = [floor];
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
    const fog = E.scene.fog;
    r.setRenderTarget(E.reflect.rt);
    r.clear();
    r.render(E.scene, v);
    r.setRenderTarget(null);
    hidden.forEach((o) => { o.visible = true; });
    E.scene.fog = fog;
  }

  /* ---------------------------------------------------------------- tamaño */
  E.size = { w: 1, h: 1 };
  E.resize = function () {
    const el = E.renderer.domElement.parentElement;
    const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
    if (w === E.size.w && h === E.size.h) return;
    E.size.w = w; E.size.h = h;
    E.renderer.setSize(w, h, false);
    const pw = Math.round(w * E.dpr), ph = Math.round(h * E.dpr);
    E.reflect.rt.setSize(Math.max(2, Math.round(pw * E.reflect.scale)), Math.max(2, Math.round(ph * E.reflect.scale)));
    E.reflect.uni.uRes.value.set(pw, ph);
    applyProjection();
    E.invalidate(3);
    if (E.onResize) E.onResize(w, h);
  };
  /* desplazamiento del centro de la vista (deja libre el espacio que tapa el panel) */
  const off = { x: 0, y: 0, gx: 0, gy: 0 };
  E.setViewOffset = function (x, y, instant) { off.gx = x; off.gy = y; if (instant) { off.x = x; off.y = y; applyProjection(); } E.invalidate(); };
  function applyProjection() {
    const c = E.camera, w = E.size.w, h = E.size.h;
    c.aspect = w / h;
    if (Math.abs(off.x) > 0.5 || Math.abs(off.y) > 0.5) c.setViewOffset(w, h, off.x, off.y, w, h); else c.clearViewOffset();
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

  /* ------------------------------------------------------------------ ciclo */
  let last = performance.now();
  E.onFrame = null;
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
    if (!(active || moving || sh || dirty > 0)) return;
    if (dirty > 0) dirty--;
    if (E.shadowDirty || active) { E.renderer.shadowMap.needsUpdate = true; E.shadowDirty = false; }
    if (E.onFrame) E.onFrame(dt, now);
    if (E.reflect.on) renderReflection();
    E.renderer.render(E.scene, E.camera);
    if (E.afterRender) E.afterRender(moving || active || sh);
  }
})();
