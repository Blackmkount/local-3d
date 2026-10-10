/* ============================================================================
   ARQUITECTURA DEL LOCAL — muros, fachada, cielo, luces de techo y cotas.
   Coordenadas del plano: X = distancia al muro izquierdo (0–6.00),
   D = distancia a la fachada (0–7.00). Mundo: x = X − 3, z = 3.5 − D.
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const T = THREE, E = L.engine, G = L.geo;
  const R = (L.room = {});
  const W = 6, DP = 7, TH = 0.15, HC = 3.0, HS = 2.8, HF = 3.9, PD = 0.30;
  R.dim = { W, DP, TH, HC, HS, HF, PD, SALA: 5.5 };
  const wx = (X) => X - 3, wz = (D) => 3.5 - D;
  R.wx = wx; R.wz = wz;

  function box(mat, X0, y0, D0, sx, sy, sd, opt) {
    const m = new T.Mesh(G.box(sx, sy, sd, null, opt && opt.bev != null ? opt.bev : 0), mat);
    m.position.set(wx(X0) + sx / 2, y0 + sy / 2, wz(D0) - sd / 2);
    m.receiveShadow = true; if (opt && opt.cast) m.castShadow = true;
    return m;
  }

  function signTexture() {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 256;
    const draw = () => {
      const g = c.getContext('2d'); g.clearRect(0, 0, 2048, 256);
      g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineJoin = 'round';
      // logo: cubo en línea
      const cx = 250, cy = 128, s = 62;
      g.lineWidth = 9;
      const p = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      g.beginPath(); for (let i = 0; i < 6; i++) { const q = p(-Math.PI / 2 + i * Math.PI / 3, s); if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); } g.closePath(); g.stroke();
      g.beginPath(); [1, 3, 5].forEach((i) => { const q = p(-Math.PI / 2 + i * Math.PI / 3, s); g.moveTo(cx, cy); g.lineTo(q[0], q[1]); }); g.stroke();
      const F = '"Jost","Century Gothic","Futura","Avenir Next",system-ui,sans-serif';
      g.textBaseline = 'middle';
      g.font = '300 124px ' + F;
      let x = 370; const txt = 'IMPRESIÓN';
      for (const ch of txt) { g.fillText(ch, x, 134); x += g.measureText(ch).width + 20; }
      x += 34; g.font = '600 132px ' + F;
      for (const ch of '3D') { g.fillText(ch, x, 134); x += g.measureText(ch).width + 12; }
      x += 56; g.fillRect(x, 58, 4, 140); x += 62;
      g.font = '400 36px ' + F;
      ['DISEÑA', 'IMPRIME', 'CREA'].forEach((w, i) => { let xx = x; for (const ch of w) { g.fillText(ch, xx, 84 + i * 46); xx += g.measureText(ch).width + 11; } });
      c._w = x + 260;
    };
    draw();
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    t.userData.redraw = () => { draw(); t.needsUpdate = true; };
    return t;
  }

  R.build = function (scene) {
    const M = L.mats;
    const root = new T.Group(); scene.add(root);
    R.root = root;
    const always = new T.Group(); always.name = 'Local'; root.add(always);

    /* ---------------------------------------------------- muros perimetrales */
    const left = new T.Group(); left.add(box(M.muro, -TH, 0, 0, TH, HC, DP + TH));
    const right = new T.Group(); right.add(box(M.muro, W, 0, 0, TH, HC, DP + TH));
    const back = new T.Group(); back.add(box(M.muro, -TH, 0, DP, W + TH * 2, HC, TH));
    left.name = 'Muro izquierdo'; right.name = 'Muro derecho'; back.name = 'Muro de fondo';
    root.add(left, right, back);
    E.addShell(left, (c) => c.x > -3.25);
    E.addShell(right, (c) => c.x < 3.25);
    E.addShell(back, (c) => c.z > -3.75);

    /* -------------------------------------------- división sala / trastienda */
    const div = new T.Group(); div.name = 'División sala-trastienda'; root.add(div);
    div.add(box(M.listonFondo, 0, 0, 5.5, 3.9, HC, 0.1));
    const sl = [];
    for (let i = 0; i < 65; i++) G.pushBox(sl, wx(0.012 + i * 0.06), 0, wz(5.5), 0.034, HS, 0.022, 0xffffff);
    // uv a escala real para la veta vertical
    const slGeo = G.merge(sl);
    const uv = new Float32Array(slGeo.attributes.position.count * 2), ps = slGeo.attributes.position;
    for (let i = 0; i < ps.count; i++) { uv[i * 2] = ps.getY(i) / 1.3; uv[i * 2 + 1] = ps.getX(i) / 0.65 + ps.getZ(i); }
    slGeo.setAttribute('uv', new T.BufferAttribute(uv, 2));
    const slats = new T.Mesh(slGeo, M.liston); slats.castShadow = true; slats.receiveShadow = true;
    slats.material = M.liston.clone(); slats.material.vertexColors = false;
    div.add(slats);
    div.add(box(M.carbon, 3.9, 2.4, 5.5, 2.1, HC - 2.4, 0.1));          // dintel sobre la mampara
    div.add(box(M.carbon, 5.85, 0, 5.5, 0.15, 2.4, 0.1, { cast: true })); // columna de 0.15
    // garganta de luz sobre el muro de listones
    const wash = new T.Mesh(new T.PlaneGeometry(3.9, 1.5), E.glowMaterial(E.softLine(), 0xffc88a, 0.5));
    wash.material.userData.glow = true;
    wash.position.set(wx(1.95), HS - 0.75, wz(5.5) + 0.03); div.add(wash);
    R.divShell = E.addShell(div, (c) => !(R.hideDiv && c.z > -2.2));

    /* ----------------------------------------------------------------- fachada */
    // pilares: sostienen el tótem y la pantalla; solo se apartan si tapan lo que se está mirando
    const pilL = new T.Group(), pilR = new T.Group(); pilL.name = 'Pilar izquierdo'; pilR.name = 'Pilar derecho'; root.add(pilL, pilR);
    pilL.add(box(M.carbon, -TH, 0, -PD, 0.6 + TH, HS, PD, { cast: true }));
    pilR.add(box(M.carbon, 5.4, 0, -PD, 0.6 + TH, HS, PD, { cast: true }));
    const fac = new T.Group(); fac.name = 'Fachada y pasillo'; root.add(fac);
    fac.add(box(M.carbon, -TH, HS, -PD - 0.06, W + TH * 2, HF - HS, PD + 0.06));
    const mall = M.muro.clone(); mall.color.set(0xe6e1d8); mall.name = 'muroPasillo';
    fac.add(box(mall, -TH - 14, 0, -0.14, 14, HF + 2.6, 0.14));
    fac.add(box(mall, W + TH, 0, -0.14, 14, HF + 2.6, 0.14));
    fac.add(box(mall, -TH, HF, -0.14, W + TH * 2, 2.6, 0.14));
    const sTex = signTexture(); R.signTex = sTex;
    const signM = new T.MeshBasicMaterial({ map: sTex, transparent: true, toneMapped: false, depthWrite: false }); signM.name = 'letrero';
    const sign = new T.Mesh(new T.PlaneGeometry(5.36, 0.67), signM);
    sign.position.set(0.28, HS + (HF - HS) / 2, wz(-PD - 0.06) + 0.004); fac.add(sign);
    const halo = new T.Mesh(new T.PlaneGeometry(4.6, 1.0), E.glowMaterial(E.softDot(), 0xffffff, 0.16));
    halo.material.userData.glow = true; halo.position.set(0.1, HS + (HF - HS) / 2, wz(-PD - 0.06) + 0.002); fac.add(halo);
    /* los cortes se registran más abajo, cuando cada grupo ya tiene sus tiras de luz */
    // línea de luz que enmarca el vano
    const led = M.led;
    const strip = (grp, X0, y0, D0, sx, sy, sd) => { const m = new T.Mesh(new T.BoxGeometry(sx, sy, sd), led); m.position.set(wx(X0) + sx / 2, y0 + sy / 2, wz(D0) - sd / 2); grp.add(m); };
    strip(pilL, 0.6, 0.02, -0.05, 0.012, HS - 0.02, 0.03);
    strip(pilR, 5.388, 0.02, -0.05, 0.012, HS - 0.02, 0.03);
    const topLed = new T.Mesh(new T.BoxGeometry(4.8, 0.012, 0.03), led); topLed.position.set(0, HS - 0.006, wz(-0.05) - 0.015); fac.add(topLed);
    const tgt = new T.Vector3();
    const blocks = (c, st, x0, x1, y0, y1, z0, z1) => {       // ¿el segmento cámara → objetivo cruza la caja?
      tgt.set(st.tx, st.ty, st.tz);
      let t0 = 0, t1 = 0.97;
      const ax = [[c.x, tgt.x, x0, x1], [c.y, tgt.y, y0, y1], [c.z, tgt.z, z0, z1]];
      for (const a of ax) {
        const d = a[1] - a[0];
        if (Math.abs(d) < 1e-6) { if (a[0] < a[2] || a[0] > a[3]) return false; continue; }
        let u = (a[2] - a[0]) / d, v = (a[3] - a[0]) / d; if (u > v) { const w = u; u = v; v = w; }
        t0 = Math.max(t0, u); t1 = Math.min(t1, v); if (t0 > t1) return false;
      }
      return true;
    };
    E.addShell(fac, (c, st) => !blocks(c, st, -3.3, 3.3, 2.42, 7, 3.4, 4.0) && !(c.z > 3.3 && c.y > 4.4));
    E.addShell(pilL, (c, st) => R.keepPillars || !blocks(c, st, -3.45, -2.1, 0, 3.1, 3.3, 4.1));
    E.addShell(pilR, (c, st) => R.keepPillars || !blocks(c, st, 2.1, 3.45, 0, 3.1, 3.3, 4.1));

    /* -------------------------------------------------------------------- cielo */
    const ceil = new T.Group(); ceil.name = 'Cielo y luminarias'; root.add(ceil);
    const slab = box(M.cielo, 0, HC, 0, W, 0.08, DP); ceil.add(slab);
    // descolgado perimetral de la sala de ventas
    ceil.add(box(M.cielo, 0, HS, 0, 0.5, HC - HS, 5.0));
    ceil.add(box(M.cielo, 5.5, HS, 0, 0.5, HC - HS, 5.0));
    ceil.add(box(M.cielo, 0.5, HS, 0, 5.0, HC - HS, 0.5));
    ceil.add(box(M.cielo, 0, HS, 5.0, W, HC - HS, 0.5));
    // gargantas de luz
    const cove = (X0, D0, sx, sd) => { const m = new T.Mesh(new T.BoxGeometry(sx, 0.02, sd), led); m.position.set(wx(X0) + sx / 2, HC - 0.03, wz(D0) - sd / 2); ceil.add(m); };
    cove(0.5, 0.5, 0.03, 4.5); cove(5.47, 0.5, 0.03, 4.5); cove(0.5, 0.5, 5.0, 0.03); cove(0.5, 4.97, 5.0, 0.03);
    const gl = (w, h, x, z, rz) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), E.glowMaterial(E.softLine(), 0xffcf96, 0.75)); m.material.userData.glow = true; m.rotation.set(Math.PI / 2, 0, rz); m.position.set(x, HC - 0.004, z); ceil.add(m); };
    gl(4.5, 0.9, wx(0.5) + 0.45, wz(2.75), Math.PI / 2);
    gl(4.5, 0.9, wx(5.5) - 0.45, wz(2.75), -Math.PI / 2);
    gl(5.0, 0.9, 0, wz(0.5) - 0.45, 0);
    gl(5.0, 0.9, 0, wz(5.0) + 0.45, Math.PI);
    // rieles con proyectores
    const blk = M.carbonMate, spotL = M.ledBlanco;
    const rail = (X) => {
      ceil.add(box(blk, X - 0.02, HC - 0.04, 1.0, 0.04, 0.04, 3.4));
      for (let i = 0; i < 5; i++) {
        const D = 1.3 + i * 0.7, dir = X < 3 ? -1 : 1;
        const head = new T.Mesh(new T.CylinderGeometry(0.035, 0.042, 0.13, 12), blk);
        head.position.set(wx(X) + dir * 0.03, HC - 0.13, wz(D)); head.rotation.z = dir * 0.5; ceil.add(head);
        const lens = new T.Mesh(new T.CircleGeometry(0.03, 12), spotL);
        lens.position.set(wx(X) + dir * 0.062, HC - 0.187, wz(D)); lens.rotation.set(Math.PI / 2, dir * 0.5, 0); ceil.add(lens);
        // dos de cada cinco proyectores encienden un foco real sobre la exhibición del muro
        if (i === 1 || i === 3) E.spot(new T.Vector3(wx(X) + dir * 0.07, HC - 0.2, wz(D)), new T.Vector3(wx(X < 3 ? 0.3 : 5.7), 1.15, wz(D + 0.05)), 5.5, 0.42, 0.75);
      }
    };
    rail(1.45); rail(4.55);
    // lámpara lineal rectangular sobre la mesa alta
    const pc = { X: 2.4, D: 3.85, y: 2.12, w: 1.6, d: 0.5 };
    const bar = (X0, D0, sx, sd) => ceil.add(box(blk, X0, pc.y, D0, sx, 0.05, sd));
    bar(pc.X - pc.w / 2, pc.D - pc.d / 2, pc.w, 0.035); bar(pc.X - pc.w / 2, pc.D + pc.d / 2 - 0.035, pc.w, 0.035);
    bar(pc.X - pc.w / 2, pc.D - pc.d / 2, 0.035, pc.d); bar(pc.X + pc.w / 2 - 0.035, pc.D - pc.d / 2, 0.035, pc.d);
    const und = (X0, D0, sx, sd) => { const m = new T.Mesh(new T.BoxGeometry(sx, 0.006, sd), M.ledBlanco); m.position.set(wx(X0) + sx / 2, pc.y - 0.003, wz(D0) - sd / 2); ceil.add(m); };
    und(pc.X - pc.w / 2 + 0.04, pc.D - pc.d / 2 + 0.008, pc.w - 0.08, 0.02); und(pc.X - pc.w / 2 + 0.04, pc.D + pc.d / 2 - 0.028, pc.w - 0.08, 0.02);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((s) => {
      const wire = new T.Mesh(new T.CylinderGeometry(0.003, 0.003, HC - pc.y - 0.05, 5), blk);
      wire.position.set(wx(pc.X + s[0] * (pc.w / 2 - 0.02)), (HC + pc.y + 0.05) / 2, wz(pc.D + s[1] * (pc.d / 2 - 0.02))); ceil.add(wire);
    });
    // dos colgantes sobre la isla
    [[2.15, 1.3], [2.85, 1.45]].forEach((p, i) => {
      const h = 0.7 + i * 0.14;
      const wire = new T.Mesh(new T.CylinderGeometry(0.003, 0.003, h, 5), blk); wire.position.set(wx(p[0]), HC - h / 2, wz(p[1])); ceil.add(wire);
      const lamp = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 0.2, 12), blk); lamp.position.set(wx(p[0]), HC - h - 0.1, wz(p[1])); ceil.add(lamp);
      const tip = new T.Mesh(new T.CircleGeometry(0.024, 12), M.ledBlanco); tip.rotation.x = Math.PI / 2; tip.position.set(wx(p[0]), HC - h - 0.201, wz(p[1])); ceil.add(tip);
      E.spot(new T.Vector3(wx(p[0]), HC - h - 0.21, wz(p[1])), new T.Vector3(wx(p[0]) + 0.02, 0, wz(p[1])), 4.2, 0.62, 0.9, true);
    });
    // la lámpara lineal baña la mesa alta
    E.spot(new T.Vector3(wx(pc.X), pc.y - 0.02, wz(pc.D)), new T.Vector3(wx(pc.X), 0, wz(pc.D)), 3.2, 1.05, 1.0, false, 0xfff0dc);
    // luz de trabajo de la trastienda
    const tl = new T.Mesh(new T.BoxGeometry(1.2, 0.02, 0.22), M.ledBlanco); tl.position.set(wx(2.6), HC - 0.012, wz(6.3)); ceil.add(tl);
    E.addShell(ceil, (c) => c.y < 2.92);
    E.noReflect.push(wash, halo);

    /* ------------------------------------------------- cotas generales del plano */
    const cot = new T.Group(); cot.visible = false; root.add(cot); R.cotas = cot;
    const lm = new T.LineBasicMaterial({ color: 0x3a3a3d, transparent: true, opacity: 0.85 });
    const seg = [];
    const dim = (x1, z1, x2, z2) => {
      const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz), nx = -dz / len * 0.12, nz = dx / len * 0.12;
      seg.push(x1, 0.012, z1, x2, 0.012, z2, x1 - nx, 0.012, z1 - nz, x1 + nx, 0.012, z1 + nz, x2 - nx, 0.012, z2 - nz, x2 + nx, 0.012, z2 + nz);
    };
    dim(wx(0), wz(-1.5), wx(6), wz(-1.5));
    dim(wx(0.6), wz(-0.95), wx(5.4), wz(-0.95));
    dim(wx(-0.95), wz(0), wx(-0.95), wz(7));
    dim(wx(6.95), wz(0), wx(6.95), wz(5.5));
    dim(wx(6.95), wz(5.6), wx(6.95), wz(7));
    const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(seg, 3));
    cot.add(new T.LineSegments(lg, lm));
    E.noReflect.push(cot);
    R.cotaLabels = [
      { t: '6.00 m', s: 'frente', p: new T.Vector3(wx(3), 0, wz(-1.5)) },
      { t: '4.80', s: 'vano de acceso', p: new T.Vector3(wx(3), 0, wz(-0.95)) },
      { t: '7.00 m', s: 'fondo', p: new T.Vector3(wx(-0.95), 0, wz(3.5)) },
      { t: '5.50', s: 'sala de ventas', p: new T.Vector3(wx(6.95), 0, wz(2.75)) },
      { t: '1.40', s: 'trastienda', p: new T.Vector3(wx(6.95), 0, wz(6.3)) }
    ];
    R.zoneLabels = [
      { t: 'Sala de ventas', s: '6.00 × 5.50 · piso en trama de 0.60', p: new T.Vector3(wx(4.55), 0, wz(1.0)) },
      { t: 'Trastienda · taller', s: '6.00 × 1.40 · distribución propuesta', p: new T.Vector3(wx(2.35), 0, wz(6.42)) },
      { t: 'Acceso', s: 'desde el pasillo del centro comercial', p: new T.Vector3(wx(3), 0, wz(-0.45)) }
    ];
    return root;
  };
})();
