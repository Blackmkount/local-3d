/* ============================================================================
   ARMADO CON OPERARIO — un ebanista arma cada mueble pieza por pieza: recibe
   cada pieza, la asienta y la fija como dice el despiece: suelda los tubos en
   cada punto de contacto (con máscara, chispas, humo y el cordón que se enfría),
   atornilla los tableros, encola y prensa las capas, ancla al muro con chazos,
   rosca los niveladores, asienta el vidrio con ventosas, pega y conecta la luz
   y al final revisa el mueble.

   Las operaciones salen del propio modelo: cada pieza nueva se compara con las
   que ya están puestas; donde se tocan hay una unión, y el tipo de unión lo dan
   los materiales (acero con acero se suelda; tablero con tablero se atornilla;
   una capa sobre otra se encola…). Los textos de ensamble del despiece (seq,
   ens, fab) afinan la decisión. Los tiempos de planta de cada operación vienen
   de los datos tipo de la Nota 2 cuando existen.

   Todo es procedural: el operario, las herramientas, las chispas y el sonido
   (sintetizado con WebAudio) se generan aquí; no hay archivos externos.
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D, T = THREE, E = L.engine, G = L.geo;
  const AR = (L.armado = {});
  const $ = (s, el) => (el || document).querySelector(s);
  const clamp = E.clamp, lerp = E.lerp;
  const V3 = (x, y, z) => new T.Vector3(x, y, z);
  const UP = V3(0, 1, 0), DOWN = V3(0, -1, 0);
  let H = null;                   // ganchos a la aplicación (app.js): ghostOthers, showDecor, focus, updateStepper, refreshEdges, state

  /* ------------------------------------------------------------ estado */
  const S = { on: false, gen: 0, it: null, inst: null, step: -1, playing: false, paused: false, speed: 1, follow: true, sound: false, fx: [], tws: [], stats: null, pauseP: null, op: null, done: false };
  AR.state = S;
  const ABORT = { abort: true };
  function track(tw) { S.tws.push(tw); return tw; }
  function stopTweens() { S.tws.forEach(E.cancel); S.tws = []; }
  /* espera animada: la promesa se resuelve al terminar el tween; si la animación se cancela, se corta la cadena */
  function wait(sec, fn, opt) {
    const gen = S.gen;
    return new Promise((res) => {
      const d = Math.max(0.02, sec / S.speed);
      track(E.tween(d, fn || (() => {}), Object.assign({ ease: E.ease.lin }, opt || {}, { done: () => res() })));
    }).then(() => { if (gen !== S.gen) throw ABORT; return pauseGate(); });
  }
  function pauseGate() { if (!S.paused) return; return new Promise((res) => { S.pauseP = res; }); }
  const sleep = (s) => wait(s);

  /* ------------------------------------------------------------ clases de material */
  const CLASS = {
    steel: /^(tubo1|tubo15|tuboRect|acero|perforada|manija)$/,
    board: /^(mdf15|mdf55|rovere15|blanca15|blanca15v|fondo6|hpl|pvc10|pvc5|laca|negro|melBlanca|melRovere|melPlomo|fondo|fondoLit|mdf|liston|listonFondo|gris|cemento)$/,
    glass: /^(vidrio10|vidrio6|vidrio|vidrioOscuro)$/,
    acrylic: /^(acril3|opal3|acrilico|escarcha)$/,
    led: /^(cob|perfilLed|led|ledFrio|ledBlanco|fuente\d*|equipo)$/,
    alu: /^(perfil3030|escuadra|perfilManija|alu)$/,
    print: /^(petg|impreso)$/,
    hw: /^(bisagraCaz|bisagraSold|riel45|soporteInv|kitBatiente|kitRiel|ganchos|pasacable|nivelador|pataNiv|chazo|patas|anclaje|tornEns|tornAuto|tornM6|plastico|inox|cantoRovere|cantoRovere33|canto)$/
  };
  function classOf(p) {
    const mk = p.userData.mk || '', nm = (p.userData.name || '').toLowerCase();
    if (/chazo|anclaje/.test(nm) || mk === 'chazo' || mk === 'anclaje') return 'anchor';
    if (/niveladora|nivelador/.test(nm) || mk === 'pataNiv' || mk === 'nivelador' || mk === 'patas') return 'leveler';
    if (/vidrio/.test(nm) || CLASS.glass.test(mk)) return 'glass';
    if (/manija|bisagra|riel|soporte|gancho|pasacable|chapeta|tirador/.test(nm) && !/perfil manija|gola/.test(nm)) return 'hw';
    for (const k in CLASS) if (CLASS[k].test(mk)) return k;
    if (p.material && p.material.name === 'led') return 'led';
    return 'board';
  }

  /* ------------------------------------------------------------ uniones: dónde se tocan dos piezas */
  const _bA = new T.Box3(), _bB = new T.Box3(), _bI = new T.Box3();
  function boxOf(p) {
    if (!p.userData.lbox) {
      const g = p.geometry; if (!g.boundingBox) g.computeBoundingBox();
      p.userData.lbox = g.boundingBox.clone().translate(p.userData.home);
    }
    return p.userData.lbox;
  }
  const size = (b) => b.getSize(new T.Vector3());
  /* puntos de fijación entre la pieza nueva p y la base b; devuelve [] si no se tocan */
  function contact(p, b, eps, thinIs) {
    _bA.copy(boxOf(p)).expandByScalar(eps); _bB.copy(boxOf(b));
    if (!_bA.intersectsBox(_bB)) return null;
    _bI.copy(_bA).intersect(_bB);
    const s = size(_bI), ax = s.x <= s.y && s.x <= s.z ? 0 : s.y <= s.z ? 1 : 2;   // eje del contacto: el de menor solape
    const sp = size(boxOf(p)), sb = size(boxOf(b));
    const cp = boxOf(p).getCenter(new T.Vector3()), cb = boxOf(b).getCenter(new T.Vector3());
    const axes = ['x', 'y', 'z'], a = axes[ax];
    // el tornillo entra por la cara exterior de la pieza más delgada en ese eje
    const thin = thinIs === 'p' ? p : thinIs === 'b' ? b : (sp[a] <= sb[a] ? p : b), other = thin === p ? b : p;
    const ct = boxOf(thin).getCenter(new T.Vector3()), co = boxOf(other).getCenter(new T.Vector3());
    const sgn = Math.sign(co[a] - ct[a]) || 1;               // hacia la otra pieza
    const face = boxOf(thin)[sgn > 0 ? 'min' : 'max'][a];     // cara exterior (opuesta a la otra pieza)
    const dir = new T.Vector3(); dir[a] = sgn;                 // dirección del tornillo
    const lens = [s.x, s.y, s.z].map((v, i) => (i === ax ? 0 : v));
    const long = lens.indexOf(Math.max.apply(null, lens)), short = 3 - ax - long;
    const c = _bI.getCenter(new T.Vector3());
    return { ax, a, long: axes[long], short: axes[short], len: lens[long], wid: lens[short], c, face, dir, thin, other, cp, cb, sp, sb };
  }
  /* reparte n puntos a lo largo del contacto, a inset de los extremos */
  function spread(ct, spacing, min, max, inset) {
    const n = clamp(Math.round(ct.len / spacing) + 1, min, max);
    const out = [];
    const l0 = ct.c[ct.long] - ct.len / 2 + (ct.len > inset * 2.2 ? inset : ct.len * 0.3), l1 = ct.c[ct.long] + ct.len / 2 - (ct.len > inset * 2.2 ? inset : ct.len * 0.3);
    for (let i = 0; i < n; i++) {
      const q = ct.c.clone(); q[ct.long] = n === 1 ? ct.c[ct.long] : lerp(l0, l1, i / (n - 1)); q[ct.a] = ct.face;
      out.push({ p: q, dir: ct.dir.clone(), n: ct.dir.clone().negate() });
    }
    return out;
  }
  /* puntos de soldadura: en el borde visible de la unión (hacia el frente del mueble) */
  function weldPts(ct) {
    const n = clamp(Math.round(ct.len / 0.35) + 1, 1, 4), out = [];
    const zFront = Math.max(boxOf(ct.thin).max.z, boxOf(ct.other).min.z);
    for (let i = 0; i < n; i++) {
      const q = ct.c.clone();
      if (n > 1) q[ct.long] = ct.c[ct.long] - ct.len / 2 + 0.03 + (ct.len - 0.06) * i / (n - 1);
      q.z = Math.min(zFront, ct.c.z + 0.03);
      out.push({ p: q, dir: V3(0, 0, -1), n: V3(0, 0, 1) });
    }
    return out;
  }

  /* ------------------------------------------------------------ plan de un paso
     Para cada pieza del paso (agrupadas por nombre) decide: cómo llega y cómo se fija. */
  const TXT = (it, k) => {
    const seq = (it._seq || [])[k]; if (!seq) return '';
    let t = (seq.t || '') + ' ';
    const m = /^(Ensamble|Fabricación) (\d+)/.exec(seq.src || '');
    const src = it._src;
    if (m && src) { const arr = m[1] === 'Ensamble' ? src.ens : src.fab; if (arr && arr[+m[2] - 1]) t += arr[+m[2] - 1]; }
    return t.toLowerCase();
  };
  function plan(it, o, k) {
    const txt = TXT(it, k);
    const placed = o.parts.filter((p) => p.userData.step < k), mine = o.parts.filter((p) => p.userData.step === k);
    const groups = [];
    mine.forEach((p) => { const nm = p.userData.name; let g = groups.find((x) => x.name === nm && x.cls === classOf(p)); if (!g) { g = { name: nm, cls: classOf(p), parts: [] }; groups.push(g); } g.parts.push(p); });
    const acts = [];
    const base = placed.slice();
    const wantsGlue = /encol|pegar|pegante|prensa|contacto|lamin/.test(txt);
    groups.forEach((g) => {
      const cls = g.cls, nm = g.name.toLowerCase();
      if (cls === 'anchor') { const pts = []; g.parts.forEach((p) => (p.userData.pts || [[boxOf(p).getCenter(new T.Vector3()).x, boxOf(p).getCenter(new T.Vector3()).y, boxOf(p).getCenter(new T.Vector3()).z]]).forEach((q) => pts.push({ p: V3(q[0], q[1], q[2]), dir: V3(0, 0, -1), n: V3(0, 0, 1) }))); acts.push({ t: 'anclar', parts: g.parts, pts, what: g.name }); base.push.apply(base, g.parts); return; }
      if (cls === 'leveler') { const pts = []; g.parts.forEach((p) => (p.userData.pts || [[boxOf(p).getCenter(new T.Vector3()).x, 0, boxOf(p).getCenter(new T.Vector3()).z]]).forEach((q) => pts.push({ p: V3(q[0], Math.max(0.02, q[1]) + 0.04, q[2]), dir: V3(0, 1, 0), n: V3(0, -1, 0) }))); acts.push({ t: 'colocar', parts: g.parts, what: g.name, quick: true }); acts.push({ t: 'roscar', parts: g.parts, pts, what: g.name }); base.push.apply(base, g.parts); return; }
      const sup = /capa superior/.test(nm);
      const glueThis = sup || /piel/.test(nm) || (cls === 'board' && wantsGlue && /lamin|hpl/.test((g.parts[0].userData.mk || '')));
      if (glueThis) {
        // la cola va sobre la pieza de abajo, antes de asentar esta
        const under = g.parts.map((p) => { let best = null, bl = 0; base.forEach((b) => { const ct = contact(p, b, 0.004); if (ct && ct.a === 'y' && ct.len * ct.wid > bl) { bl = ct.len * ct.wid; best = ct; } }); return best; }).filter(Boolean);
        if (under.length) acts.push({ t: 'encolar', parts: g.parts, cts: under, what: g.name });
        acts.push({ t: 'colocar', parts: g.parts, what: g.name, slow: true });
        if (under.length) acts.push({ t: 'prensar', parts: g.parts, cts: under, what: g.name });
        base.push.apply(base, g.parts); return;
      }
      if (cls === 'glass') { acts.push({ t: 'asentar', parts: g.parts, what: g.name }); base.push.apply(base, g.parts); return; }
      if (cls === 'led') {
        acts.push({ t: 'colocar', parts: g.parts, what: g.name, quick: true });
        acts.push({ t: 'conectar', parts: g.parts, what: g.name });
        base.push.apply(base, g.parts); return;
      }
      acts.push({ t: 'colocar', parts: g.parts, what: g.name, quick: cls === 'hw' || cls === 'acrylic' });
      // fijaciones de cada pieza con lo que ya está puesto
      const weld = [], screw = [], hwp = [], allen = [];
      g.parts.forEach((p) => {
        base.forEach((b) => {
          const cb = classOf(b), ct = contact(p, b, 0.006, cls === 'hw' ? 'p' : (cls === 'steel' && cb === 'board') ? 'p' : null); if (!ct) return;
          if (cls === 'steel' && cb === 'steel') { weldPts(ct).forEach((q) => weld.push(q)); return; }
          if ((cls === 'alu' || cb === 'alu') && (cls === 'alu' || cls === 'print' || cb === 'print')) { spread(ct, 0.6, 1, 2, 0.03).forEach((q) => allen.push(q)); return; }
          if (cls === 'hw') { spread(ct, 0.12, 1, 2, 0.015).forEach((q) => hwp.push(q)); return; }
          if (cls === 'acrylic' || cb === 'acrylic' || cls === 'print') return;
          if (cls === 'steel' && cb === 'board') { spread(ct, 0.4, 1, 3, 0.05).forEach((q) => screw.push(q)); return; }
          if (cls === 'board' && (cb === 'steel' || cb === 'board' || cb === 'print')) { spread(ct, ct.a === 'z' && /fondo/.test(nm) ? 0.35 : 0.32, 1, 4, 0.05).forEach((q) => screw.push(q)); }
        });
        base.push(p);
      });
      if (weld.length) acts.push({ t: 'soldar', parts: g.parts, pts: cap(weld, 10), what: g.name });
      if (allen.length) acts.push({ t: 'allen', parts: g.parts, pts: cap(allen, 10), what: g.name });
      if (screw.length) acts.push({ t: 'atornillar', parts: g.parts, pts: cap(screw, 10), what: g.name });
      if (hwp.length) acts.push({ t: 'herraje', parts: g.parts, pts: cap(hwp, 8), what: g.name });
    });
    if (/lacar|retoc|pintar/.test(txt) && groups.some((g) => /laca|negro/.test(g.parts[0].material.name || ''))) acts.push({ t: 'retocar', parts: mine.filter((p) => /laca|negro/.test(p.material.name || '')), what: 'retoque de laca' });
    return acts;
  }
  function cap(pts, n) { if (pts.length <= n) return pts; const out = []; for (let i = 0; i < n; i++) out.push(pts[Math.round(i * (pts.length - 1) / (n - 1))]); return out; }

  /* ------------------------------------------------------------ tiempos de planta (Nota 2, datos tipo) */
  const MIN = { soldar: ['soldarAcero', 2.5], atornillar: ['armar', 0.8], herraje: ['herraje', 4], allen: ['armar', 1.0], anclar: ['anclar', 3], roscar: ['armar', 0.5], encolar: ['encolar', 10], prensar: ['prensado', 0], conectar: ['conectar', 3], asentar: ['inspVidrio', 5], retocar: ['lacar', 1.5], colocar: ['colocar', 0.6] };
  function minutes(act) {
    const d = MIN[act.t]; if (!d) return 0;
    const N2 = L.nota2 && L.nota2.tiempos, T2 = N2 && N2[d[0]];
    const per = T2 ? T2.min : d[1];
    const n = act.pts ? act.pts.length : act.parts.length;
    return per * (act.t === 'encolar' || act.t === 'conectar' ? Math.max(1, act.parts.length) : n);
  }

  /* ------------------------------------------------------------ materiales del operario y de los efectos */
  let MT = null;
  function mats() {
    if (MT) return MT;
    const std = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85, metalness: 0 }, o || {}));
    MT = {
      overol: std(0x2a4a80, { roughness: 0.95 }), overolOsc: std(0x1f3a66, { roughness: 0.95 }), camisa: std(0x8d949c, { roughness: 0.9 }), camisaOsc: std(0x6f767e, { roughness: 0.9 }),
      piel: std(0xc8976f, { roughness: 0.7 }), ojo: std(0x1a1512, { roughness: 0.3 }), boca: std(0x9a6558, { roughness: 0.8 }), guante: std(0x8a6a44, { roughness: 0.9 }), guanteOsc: std(0x6e5234, { roughness: 0.9 }),
      bota: std(0x2a2522, { roughness: 0.55 }), suela: std(0x15130f, { roughness: 0.9 }), gorra: std(0x1d1d1f, { roughness: 0.8 }), naranja: std(0xff9f0a, { roughness: 0.6 }), pelo: std(0x2b1d14),
      gafas: new T.MeshStandardMaterial({ color: 0xdfeaf2, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.3 }),
      mascara: std(0x203a2b, { roughness: 0.5, metalness: 0.1 }), visor: new T.MeshStandardMaterial({ color: 0x0b1b12, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.8 }),
      herr: std(0x2a2a2d, { roughness: 0.6, metalness: 0.3 }), herrAm: std(0xf2b400, { roughness: 0.55 }), herrRojo: std(0xc8402a, { roughness: 0.6 }), metal: std(0xc9ccd1, { roughness: 0.35, metalness: 0.9 }),
      cobre: std(0xb87333, { roughness: 0.4, metalness: 0.9 }), cable: std(0x111113, { roughness: 0.9 }), cola: new T.MeshStandardMaterial({ color: 0xfff3c4, roughness: 0.15, transparent: true, opacity: 0.85 }),
      tornillo: std(0xd9dbde, { roughness: 0.4, metalness: 0.9 }), cordon: new T.MeshStandardMaterial({ color: 0x5c5c62, roughness: 0.55, metalness: 0.6, emissive: 0xff7a1a, emissiveIntensity: 0 }),
      madera: std(0xd2a86e, { roughness: 0.8 }), plasticoAm: std(0xf5c400, { roughness: 0.5 }), ventosa: std(0x1a1a1c, { roughness: 0.3 }),
      chispa: new T.PointsMaterial({ map: E.softDot(), color: 0xffd08a, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }),
      polvo: new T.PointsMaterial({ map: E.softDot(), color: 0xd9cfbf, size: 0.03, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false }),
      bruma: new T.PointsMaterial({ map: E.softDot(), color: 0xffffff, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.35, depthWrite: false }),
      humo: new T.SpriteMaterial({ map: E.softDot(), color: 0x8e8e90, transparent: true, opacity: 0.3, depthWrite: false }),
      flash: new T.SpriteMaterial({ map: E.softDot(), color: 0xcfe4ff, transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }),
      ledOff: new T.MeshStandardMaterial({ color: 0x8a8a84, roughness: 0.6 })
    };
    for (const k in MT) MT[k].name = 'op_' + k;
    return MT;
  }

  /* ------------------------------------------------------------ el operario */
  const DIM = { shin: 0.43, thigh: 0.43, torso: 0.5, up: 0.3, fore: 0.27, hand: 0.09, hipW: 0.1, shW: 0.2, head: 0.11 };
  const capsule = (r, len, mat) => { const m = new T.Mesh(new T.CapsuleGeometry(r, len, 4, 10), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  const box = (sx, sy, sz, mat) => { const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  const cyl = (r0, r1, h, mat, seg) => { const m = new T.Mesh(new T.CylinderGeometry(r0, r1, h, seg || 14), mat); m.castShadow = true; return m; };
  /* segmento que cuelga hacia -y desde su origen */
  function limb(r, len, mat, r2) {
    const g = new T.Group(); const m = capsule(r, Math.max(0.01, len - r * 2), mat); m.position.y = -len / 2; g.add(m);
    if (r2) { const m2 = capsule(r2, Math.max(0.01, len * 0.5), mat); m2.position.y = -len * 0.7; g.add(m2); }
    g.userData.len = len; return g;
  }
  /* materiales de ropa por color (compartidos entre personas) */
  const CLOTH = {};
  function cloth(c, r, extra) { const k = c + ':' + (r || 0.9) + ':' + (extra ? JSON.stringify(extra) : ''); if (!CLOTH[k]) { CLOTH[k] = new T.MeshStandardMaterial(Object.assign({ color: c, roughness: r || 0.9, metalness: 0 }, extra || {})); CLOTH[k].name = 'ropa'; } return CLOTH[k]; }
  AR.cloth = cloth;
  /* una persona: el mismo esqueleto para el operario, el equipo de la tienda y los clientes.
     opt: { outfit: 'overol' | 'staff' | 'casual', female, scale, hair: 'cap'|'short'|'bun'|'pony'|'long',
            sleeves: 'long'|'short', col: { top, topOsc, pants, shoes, sole, hair, skin, acc }, glasses, beard, backpack, bag, logo } */
  function buildPerson(opt) {
    opt = opt || {}; const M = mats();
    const kind = opt.outfit || 'overol', fem = !!opt.female, k = opt.scale || 1;
    const D = { shin: DIM.shin * k, thigh: DIM.thigh * k, torso: DIM.torso * k, up: DIM.up * k, fore: DIM.fore * k, hand: DIM.hand, hipW: fem ? 0.105 : 0.1, shW: fem ? 0.172 : 0.2, head: DIM.head * (fem ? 0.96 : 1) };
    const col = Object.assign({ top: 0x8d949c, topOsc: 0x6f767e, pants: 0x2a4a80, pantsOsc: 0x1f3a66, shoes: 0x2a2522, sole: 0x15130f, hair: 0x2b1d14, skin: 0xc8976f, acc: 0xff9f0a }, opt.col || {});
    const ov = kind === 'overol';
    const mTop = ov ? M.camisa : cloth(col.top), mTopOsc = ov ? M.camisaOsc : cloth(col.topOsc), mPants = ov ? M.overol : cloth(col.pants), mPantsOsc = ov ? M.overolOsc : cloth(col.pantsOsc);
    const mShoes = ov ? M.bota : cloth(col.shoes, 0.6), mSole = ov ? M.suela : cloth(col.sole, 0.85), mHair = ov ? M.pelo : cloth(col.hair, 0.8), mSkin = ov ? M.piel : cloth(col.skin, 0.7), mAcc = cloth(col.acc, 0.6);
    const sleeves = opt.sleeves || (ov ? 'long' : 'short'), hair = opt.hair || (ov ? 'cap' : 'short');
    const root = new T.Group(); root.name = ov ? 'operario' : 'persona';
    const pelvis = new T.Group(); root.add(pelvis);
    const spine = new T.Group(); pelvis.add(spine);
    const TY = D.torso, at = (m, x, y, z, rx, ry, rz) => { m.position.set(x, y, z); if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0); return m; };
    const tw = fem ? 0.9 : 1;                                                                                       // tronco más estrecho
    // tronco
    const torso = capsule(0.165, TY - 0.22, mTop); torso.position.y = TY / 2 + 0.01; torso.scale.set(tw, 1, 0.62); spine.add(torso);
    const cad = capsule(0.165, 0.1, mPants); cad.position.y = 0.0; cad.scale.set(tw * 1.02, 1, 0.68); spine.add(cad);          // cadera / pantalón
    if (ov) {
      // camisa de manga larga bajo el overol de peto (pantalón alto, peto con bolsillo y tirantes cruzados)
      spine.add(at(box(0.014, 0.12, 0.004, M.camisaOsc), 0, TY - 0.02, 0.104));                                   // tapeta de botones
      [0, 1, 2].forEach((i) => spine.add(at(cyl(0.006, 0.006, 0.004, M.gorra, 8), 0, TY - 0.06 + i * 0.035, 0.108, Math.PI / 2)));
      const cuello = cyl(0.062, 0.072, 0.035, M.camisa, 16); cuello.position.set(0, TY + 0.035, 0.005); spine.add(cuello);
      const cint = cyl(0.17, 0.168, 0.15, M.overol, 20); cint.position.y = 0.165; cint.scale.set(1, 1, 0.66); spine.add(cint);
      [-1, 1].forEach((s) => spine.add(at(box(0.016, 0.2, 0.13, M.overol), s * 0.163, 0.3, -0.005)));                 // costados del overol
      const peto = box(0.21, 0.25, 0.016, M.overol); peto.position.set(0, TY - 0.175, 0.104); spine.add(peto);
      spine.add(at(box(0.12, 0.1, 0.008, M.overolOsc), 0, TY - 0.21, 0.115));                                        // bolsillo del peto
      spine.add(at(cyl(0.005, 0.005, 0.075, M.herrAm, 6), 0.038, TY - 0.17, 0.119, 0, 0, 0.12));                    // lápiz de carpintero
      spine.add(at(box(0.05, 0.05, 0.004, M.naranja), 0, TY - 0.085, 0.114)); spine.add(at(box(0.026, 0.026, 0.003, M.gorra), 0, TY - 0.085, 0.117));
      [-1, 1].forEach((s) => {                                                                                        // tirantes y hebillas
        spine.add(at(box(0.04, 0.17, 0.012, M.overol), s * 0.07, TY - 0.005, 0.088, -0.42));
        spine.add(at(box(0.04, 0.2, 0.012, M.overol), s * 0.072, TY - 0.08, -0.097, 0.1));
        spine.add(at(box(0.04, 0.012, 0.13, M.overol), s * 0.07, TY + 0.052, 0.0, 0.1));
        spine.add(at(box(0.046, 0.03, 0.01, M.metal), s * 0.07, TY - 0.09, 0.114));
      });
      // porta-herramientas en la cadera derecha: destornillador y flexómetro
      const bolsa = box(0.09, 0.11, 0.05, M.guanteOsc); bolsa.position.set(-0.165, 0.09, 0.045); spine.add(bolsa);
      spine.add(at(cyl(0.004, 0.004, 0.09, M.herr, 8), -0.185, 0.17, 0.04)); spine.add(at(cyl(0.009, 0.009, 0.045, M.herrRojo, 10), -0.185, 0.2, 0.04));
      spine.add(at(box(0.05, 0.05, 0.03, M.herrAm), 0.165, 0.11, 0.06));
    } else {
      // camiseta o buzo: cuello redondo, dobladillo y cinturón; el equipo de la tienda lleva el logo en el pecho
      const cuello = cyl(0.06, 0.068, 0.022, mTopOsc, 16); cuello.position.set(0, TY + 0.035, 0.005); spine.add(cuello);
      const dob = cyl(0.168 * tw, 0.168 * tw, 0.025, mTopOsc, 20); dob.position.y = 0.11; dob.scale.set(1, 1, 0.64); spine.add(dob);
      const cint = cyl(0.166 * tw, 0.166 * tw, 0.03, cloth(0x1a1715, 0.7), 20); cint.position.y = 0.085; cint.scale.set(1.02, 1, 0.66); spine.add(cint);
      if (opt.logo) { spine.add(at(box(0.045, 0.045, 0.004, mAcc), 0.06 * tw, TY - 0.09, 0.104 - 0.0, 0, 0, 0)); spine.add(at(box(0.022, 0.022, 0.003, cloth(0x141416)), 0.06 * tw, TY - 0.09, 0.107)); }
      if (opt.stripe) spine.add(at(box(0.2 * tw, 0.03, 0.004, cloth(opt.stripe)), 0, TY - 0.16, 0.104));
      if (opt.backpack) {                                                                                           // morral
        const mb = cloth(opt.backpack, 0.95);
        spine.add(at(box(0.24, 0.32, 0.11, mb), 0, TY - 0.2, -0.16)); spine.add(at(box(0.18, 0.1, 0.03, cloth(opt.backpack, 0.7)), 0, TY - 0.3, -0.225));
        [-1, 1].forEach((s) => spine.add(at(box(0.04, 0.012, 0.16, mb), s * 0.08, TY + 0.05, -0.04, 0.15)));
        [-1, 1].forEach((s) => spine.add(at(box(0.04, 0.22, 0.012, mb), s * 0.085, TY - 0.07, 0.095, -0.15)));
      }
      if (opt.bag) {                                                                                                // bolso cruzado
        const mg = cloth(opt.bag, 0.6);
        spine.add(at(box(0.2, 0.15, 0.07, mg), -0.2, 0.06, 0.02)); spine.add(at(box(0.025, 0.46, 0.008, mg), -0.05, TY - 0.2, 0.108, 0, 0, 0.42)); spine.add(at(box(0.025, 0.4, 0.008, mg), -0.1, TY - 0.2, -0.1, 0, 0, 0.3));
      }
    }
    // cuello y cabeza: cráneo, pelo, orejas, cejas, ojos, nariz y boca
    const neck = new T.Group(); neck.position.y = TY + 0.06; spine.add(neck);
    const head = new T.Group(); neck.add(head);
    const HR = D.head;
    const skull = new T.Mesh(new T.SphereGeometry(HR, 18, 14), mSkin); skull.position.y = 0.13; skull.scale.set(0.9, 1.05, 0.95); skull.castShadow = true; head.add(skull);
    const nk = cyl(0.045, 0.05, 0.06, mSkin); nk.position.y = 0.03; head.add(nk);
    const pelo = new T.Mesh(new T.SphereGeometry(HR + 0.005, 16, 10, Math.PI * 0.92, Math.PI * 1.16, 0, Math.PI * 0.62), mHair); pelo.position.y = 0.128; pelo.scale.set(0.92, 1.03, 0.95); head.add(pelo);   // nuca y sienes
    if (hair !== 'cap') { const top = new T.Mesh(new T.SphereGeometry(HR + 0.006, 16, 10, 0, Math.PI * 2, 0, Math.PI * (hair === 'buzz' ? 0.4 : 0.44)), mHair); top.position.y = 0.132; top.scale.set(0.92, 1.03, 0.96); top.castShadow = true; head.add(top); }
    if (hair === 'bun') { const b = new T.Mesh(new T.SphereGeometry(0.042, 12, 10), mHair); b.position.set(0, 0.215, -0.085); head.add(b); }
    if (hair === 'pony') { const c = capsule(0.028, 0.16, mHair); c.position.set(0, 0.04, -0.12); c.rotation.x = -0.35; head.add(c); const b = new T.Mesh(new T.SphereGeometry(0.03, 10, 8), mHair); b.position.set(0, 0.13, -0.11); head.add(b); }
    if (hair === 'long') { const c = capsule(0.1, 0.1, mHair); c.position.set(0, 0.07, -0.05); c.scale.set(1, 1, 0.5); head.add(c); }
    [-1, 1].forEach((s) => { const o = new T.Mesh(new T.SphereGeometry(0.022, 10, 8), mSkin); o.position.set(s * 0.098, 0.125, 0.0); o.scale.set(0.5, 1, 0.8); head.add(o); });
    [-1, 1].forEach((s) => { head.add(at(box(0.03, 0.006, 0.006, mHair), s * 0.036, 0.157, 0.104, 0, 0, s * 0.12)); const e = new T.Mesh(new T.SphereGeometry(fem ? 0.012 : 0.011, 10, 8), M.ojo); e.position.set(s * 0.036, 0.137, 0.103); e.scale.set(1, 0.85, 0.6); head.add(e); });
    const nariz = new T.Mesh(new T.SphereGeometry(fem ? 0.015 : 0.017, 10, 8), mSkin); nariz.position.set(0, 0.115, 0.1); nariz.scale.set(0.75, 1.1, 1); head.add(nariz);
    head.add(at(box(0.036, fem ? 0.009 : 0.006, 0.004, fem ? cloth(0xb5584f, 0.7) : M.boca), 0, 0.082, 0.1));
    if (opt.beard) head.add(at(new T.Mesh(new T.SphereGeometry(0.1, 14, 10, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.5, Math.PI * 0.36), mHair), 0, 0.128, 0.004)).scale.set(0.92, 1.03, 0.96);
    let mask = null, resp = null;
    if (hair === 'cap') {
      const cap = new T.Mesh(new T.SphereGeometry(HR + 0.012, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.46), M.gorra); cap.position.y = 0.145; cap.scale.set(0.92, 1, 0.97); head.add(cap);
      const visera = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.01, 16, 1, false, -Math.PI * 0.42, Math.PI * 0.84), M.gorra); visera.position.set(0, 0.165, 0.03); visera.scale.set(1.05, 1, 1.25); visera.castShadow = true; head.add(visera);
      head.add(at(cyl(0.012, 0.012, 0.006, M.gorra, 8), 0, 0.268, 0.0)); head.add(at(box(0.04, 0.03, 0.004, M.naranja), 0, 0.205, 0.113, -0.25));
    }
    if (ov || opt.glasses) {                                                                                        // gafas de seguridad claras / gafas
      const gafas = new T.Group(); head.add(gafas); const mg = ov ? M.gafas : cloth(0xdfeaf2, 0.1, { transparent: true, opacity: 0.25 }), mf = ov ? M.gorra : cloth(0x1a1a1c, 0.5);
      [-1, 1].forEach((s) => gafas.add(at(box(0.05, 0.028, 0.008, mg), s * 0.033, 0.138, 0.114)));
      gafas.add(at(box(0.135, 0.003, 0.003, mf), 0, 0.151, 0.112)); [-1, 1].forEach((s) => gafas.add(at(box(0.003, 0.003, 0.1, mf), s * 0.1, 0.146, 0.05)));
    }
    if (ov) {
      // máscara de soldar con bisagra en la frente: baja sobre la cara
      mask = new T.Group(); mask.position.set(0, 0.23, 0.03); head.add(mask);
      const shield = box(0.2, 0.27, 0.012, M.mascara); shield.position.set(0, -0.12, 0.12); mask.add(shield);
      const vis = box(0.11, 0.035, 0.006, M.visor); vis.position.set(0, -0.08, 0.128); mask.add(vis);
      mask.rotation.x = -Math.PI * 0.62; mask.visible = false;
      // respirador de media cara con dos cartuchos (GTC 45: vapores orgánicos)
      resp = new T.Group(); resp.position.set(0, 0.1, 0.085); head.add(resp);
      const rb = new T.Mesh(new T.SphereGeometry(0.06, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), M.herr); rb.rotation.x = Math.PI / 2; rb.scale.set(1.1, 0.9, 0.9); resp.add(rb);
      [-1, 1].forEach((sx) => { const c = cyl(0.028, 0.028, 0.03, M.naranja, 12); c.position.set(sx * 0.055, -0.01, 0.035); c.rotation.x = Math.PI / 2; resp.add(c); });
      resp.visible = false;
    }
    // brazos
    const arms = {};
    [['L', 1], ['R', -1]].forEach(([kk, s]) => {
      const sh = new T.Group(); sh.position.set(s * D.shW, TY + 0.02, 0); spine.add(sh);
      const hombro = new T.Mesh(new T.SphereGeometry(fem ? 0.052 : 0.058, 12, 10), mTop); hombro.position.set(-s * 0.012, -0.005, 0); hombro.castShadow = true; sh.add(hombro);
      const up = limb(fem ? 0.044 : 0.05, D.up, sleeves === 'long' ? mTop : mSkin); sh.add(up);
      if (sleeves !== 'long') { const sl = cyl(fem ? 0.05 : 0.056, fem ? 0.048 : 0.054, D.up * 0.5, mTop, 12); sl.position.y = -D.up * 0.25; up.add(sl); }
      const elbow = new T.Group(); elbow.position.y = -D.up; up.add(elbow);
      elbow.add(new T.Mesh(new T.SphereGeometry(fem ? 0.04 : 0.046, 10, 8), sleeves === 'long' ? mTop : mSkin));
      const fore = limb(fem ? 0.037 : 0.042, D.fore, sleeves === 'long' ? mTop : mSkin); elbow.add(fore);
      if (sleeves === 'long') { const cuff = cyl(0.046, 0.046, 0.04, mTopOsc); cuff.position.y = -D.fore + 0.07; fore.add(cuff); }
      const hand = new T.Group(); hand.position.y = -D.fore; fore.add(hand);
      const mH = ov ? M.guante : mSkin;
      if (ov) hand.add(at(cyl(0.05, 0.044, 0.06, M.guanteOsc, 12), 0, 0.01, 0));                                    // puño del guante de carnaza
      const palm = box(fem ? 0.062 : 0.07, 0.085, 0.032, mH); palm.position.y = -0.045; hand.add(palm);
      hand.add(at(box(fem ? 0.058 : 0.066, 0.03, 0.034, mH), 0, -0.095, 0));                                         // dedos
      hand.add(at(capsule(0.011, 0.03, mH), s * 0.04, -0.04, 0.012, 0, 0, s * 0.5));                                   // pulgar
      const tool = new T.Group(); tool.position.y = -0.06; hand.add(tool);
      arms[kk] = { sh, up, elbow, fore, hand, tool, side: s, target: null, dir: null, cur: new T.Vector3(), curDir: new T.Vector3(0, -1, 0) };
    });
    // piernas
    const legs = {};
    [['L', 1], ['R', -1]].forEach(([kk, s]) => {
      const hip = new T.Group(); hip.position.set(s * D.hipW, 0, 0); pelvis.add(hip);
      const thigh = limb(fem ? 0.07 : 0.075, D.thigh, mPants); hip.add(thigh);
      if (ov) thigh.add(at(box(0.07, 0.09, 0.01, M.overolOsc), s * 0.03, -0.12, 0.068));                             // bolsillo lateral
      const knee = new T.Group(); knee.position.y = -D.thigh; thigh.add(knee);
      knee.add(new T.Mesh(new T.SphereGeometry(fem ? 0.06 : 0.066, 10, 8), mPants));
      const shin = limb(fem ? 0.055 : 0.06, D.shin, mPants); knee.add(shin);
      if (ov) shin.add(at(box(0.09, 0.09, 0.02, M.overolOsc), 0, -0.06, 0.056));                                      // rodillera
      const foot = new T.Group(); foot.position.set(0, -D.shin + 0.05, 0); shin.add(foot);
      if (ov) {                                                                                                     // bota de seguridad con suela
        foot.add(at(box(0.1, 0.1, 0.13, mShoes), 0, 0, 0.0)); foot.add(at(box(0.1, 0.06, 0.17, mShoes), 0, -0.02, 0.1));
        foot.add(at(box(0.104, 0.02, 0.29, mSole), 0, -0.04, 0.06)); foot.add(at(box(0.096, 0.03, 0.05, mSole), 0, -0.035, 0.17));
        foot.add(at(cyl(0.004, 0.004, 0.07, M.gorra, 6), 0, 0.03, 0.065, Math.PI / 2));
      } else {                                                                                                      // tenis
        foot.add(at(box(0.09, 0.06, 0.11, mShoes), 0, -0.015, 0.0)); foot.add(at(box(0.09, 0.05, 0.16, mShoes), 0, -0.02, 0.1));
        foot.add(at(box(0.096, 0.022, 0.27, mSole), 0, -0.04, 0.06));
      }
      legs[kk] = { hip, thigh, knee, shin, foot, side: s };
    });
    root.visible = false;
    const w = { root, pelvis, spine, neck, head, mask, resp, arms, legs, dim: D, hipY: D.thigh + D.shin, crouch: 0, lean: 0, walk: 0, walking: false, look: null, stool: 0, facing: 0, tool: null, toolL: null, maskDown: false, sit: null, sway: 0 };
    E.scene.add(root);
    return w;
  }
  /* fusiona las mallas hermanas que comparten material (una por hueso y material): de ~110 piezas a ~30 llamadas de dibujo */
  function bake(root) {
    const groups = []; root.traverse((o) => { if (!o.isMesh) groups.push(o); });
    groups.forEach((g) => {
      const byMat = new Map();
      g.children.forEach((m) => { if (m.isMesh && !m.children.length && m.geometry.index && m.geometry.attributes.uv) { if (!byMat.has(m.material)) byMat.set(m.material, []); byMat.get(m.material).push(m); } });
      byMat.forEach((list, mat) => {
        if (list.length < 2) return;
        let nv = 0, ni = 0; list.forEach((m) => { m.updateMatrix(); nv += m.geometry.attributes.position.count; ni += m.geometry.index.count; });
        const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new (nv > 65535 ? Uint32Array : Uint16Array)(ni);
        const v = new T.Vector3(), nm = new T.Matrix3(); let ov = 0, oi = 0;
        list.forEach((m) => {
          const G = m.geometry, P = G.attributes.position, N = G.attributes.normal, U = G.attributes.uv, I = G.index; nm.getNormalMatrix(m.matrix);
          for (let i = 0; i < P.count; i++) {
            v.fromBufferAttribute(P, i).applyMatrix4(m.matrix); pos[(ov + i) * 3] = v.x; pos[(ov + i) * 3 + 1] = v.y; pos[(ov + i) * 3 + 2] = v.z;
            v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[(ov + i) * 3] = v.x; nor[(ov + i) * 3 + 1] = v.y; nor[(ov + i) * 3 + 2] = v.z;
            uv[(ov + i) * 2] = U.getX(i); uv[(ov + i) * 2 + 1] = U.getY(i);
          }
          for (let i = 0; i < I.count; i++) idx[oi + i] = I.getX(i) + ov;
          ov += P.count; oi += I.count;
          g.remove(m); G.dispose();
        });
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3)); geo.setAttribute('uv', new T.BufferAttribute(uv, 2)); geo.setIndex(new T.BufferAttribute(idx, 1));
        const mm = new T.Mesh(geo, mat); mm.castShadow = true; mm.receiveShadow = true; g.add(mm);
      });
    });
    return root;
  }
  AR.bake = bake;
  const buildWorker = () => { const w = buildPerson({ outfit: 'overol' }); bake(w.root); return w; };
  AR.person = buildPerson;
  let W = null;
  AR.worker = () => W || (W = buildWorker());

  /* pose del cuerpo a partir del estado: piernas por la altura de la cadera, brazos por IK */
  const _q = new T.Quaternion(), _qp = new T.Quaternion(), _v = new T.Vector3(), _v2 = new T.Vector3(), _v3 = new T.Vector3(), _m = new T.Matrix4();
  function aimLimb(group, worldDir) {
    group.parent.getWorldQuaternion(_qp); _qp.invert();
    _v.copy(worldDir).applyQuaternion(_qp).normalize();
    group.quaternion.setFromUnitVectors(DOWN, _v);
  }
  function ikArm(w, a, worldTarget, worldDir) {
    const S0 = a.sh.getWorldPosition(new T.Vector3());
    const l1 = w.dim.up, l2 = w.dim.fore;
    const d = new T.Vector3().copy(worldTarget).sub(S0); let dist = d.length();      // (vector propio: aimLimb usa los temporales)
    dist = clamp(dist, 0.12, l1 + l2 - 0.01); d.normalize();
    // el codo cuelga: hacia abajo, un poco afuera y atrás del cuerpo (nunca por delante de la mano).
    // Si la mano cruza al otro lado del cuerpo, el codo se pega al costado en vez de abrirse.
    _qp.copy(w.root.quaternion).invert(); const tl = _v2.copy(d).applyQuaternion(_qp);
    const cross = tl.x * a.side < -0.15, high = tl.y > 0.35;
    const hint = new T.Vector3(a.side * (cross ? 0.15 : high ? 0.7 : 0.45), cross ? -0.75 : -0.8, cross ? -0.5 : -0.35).applyQuaternion(w.root.quaternion).normalize();
    let perp = new T.Vector3().copy(hint).addScaledVector(d, -hint.dot(d));
    if (perp.lengthSq() < 1e-4) { perp.set(a.side, 0, 0).applyQuaternion(w.root.quaternion); perp.addScaledVector(d, -perp.dot(d)); }
    perp.normalize();
    const aa = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), hh = Math.sqrt(Math.max(0, l1 * l1 - aa * aa));
    const elbow = new T.Vector3().copy(S0).addScaledVector(d, aa).addScaledVector(perp, hh);
    aimLimb(a.up, new T.Vector3().copy(elbow).sub(S0));
    a.up.updateMatrixWorld(true);
    const E0 = a.elbow.getWorldPosition(new T.Vector3());
    const hand = new T.Vector3().copy(S0).addScaledVector(d, dist);
    aimLimb(a.fore, hand.clone().sub(E0));
    a.fore.updateMatrixWorld(true);
    if (worldDir) { aimLimb(a.hand, worldDir); } else a.hand.quaternion.identity();
  }
  function restArm(a, swing) {
    a.up.quaternion.setFromEuler(new T.Euler(0.1 + swing * 0.5, 0, a.side * 0.14));
    a.fore.quaternion.setFromEuler(new T.Euler(-0.3 - Math.max(0, -swing) * 0.4, 0, 0));
    a.hand.quaternion.identity();
  }
  function pose(w) {
    w = w || W;
    if (!w || !w.root.visible) return;
    const l = w.dim.thigh;
    if (w.sit) {
      // sentado: la pelvis sobre el asiento, muslos al frente, piernas colgando
      w.pelvis.position.y = w.sit.seat + 0.08;
      ['L', 'R'].forEach((k, i) => { const lg = w.legs[k], a1 = Math.PI / 2 - 0.08 + (i ? 0.04 : -0.04), a2 = Math.PI / 2 + 0.12; lg.thigh.rotation.set(-a1, 0, i ? -0.12 : 0.12); lg.knee.rotation.set(a2, 0, 0); lg.foot.rotation.set(a1 - a2, 0, 0); });
      w.spine.rotation.set(w.lean, 0, 0); w.spine.position.y = 0;
    } else {
      const hip = w.hipY * (1 - w.crouch) + 0.52 * w.crouch;
      w.pelvis.position.y = hip + w.stool;
      const cosA = clamp(hip / (2 * l), -1, 1), a = Math.acos(cosA);
      ['L', 'R'].forEach((k, i) => {
        const lg = w.legs[k], ph = w.walk + (i ? Math.PI : 0), sw = w.walking ? Math.sin(ph) * 0.55 : 0, lift = w.walking ? Math.max(0, Math.sin(ph + Math.PI / 2)) * 0.55 : 0;
        lg.thigh.rotation.set(-a - sw, 0, i ? -0.03 : 0.03);
        lg.knee.rotation.set(2 * a + lift, 0, 0);
        lg.foot.rotation.set(-a - lift * 0.6, 0, 0);
      });
      w.spine.rotation.set(w.lean + w.crouch * 0.35, w.walking ? Math.sin(w.walk) * 0.04 : 0, w.sway || 0);
      w.spine.position.y = w.walking ? Math.abs(Math.sin(w.walk)) * 0.02 : 0;
    }
    w.root.updateMatrixWorld(true);
    ['L', 'R'].forEach((k, i) => {
      const arm = w.arms[k];
      if (arm.target) ikArm(w, arm, arm.cur, arm.curDir);
      else restArm(arm, w.walking ? Math.sin(w.walk + (i ? 0 : Math.PI)) * 0.6 : 0);
    });
    // la cabeza mira al trabajo
    if (w.look) {
      w.root.updateMatrixWorld(true);
      const hp = w.head.getWorldPosition(_v2); _v.copy(w.look).sub(hp);
      w.neck.parent.getWorldQuaternion(_qp); _qp.invert(); _v.applyQuaternion(_qp);
      const yaw = clamp(Math.atan2(_v.x, _v.z), -1.0, 1.0), pitch = clamp(-Math.atan2(_v.y, Math.hypot(_v.x, _v.z)), -0.5, 0.42);
      w.neck.rotation.set(pitch + (w.nod || 0), yaw, 0);
    } else w.neck.rotation.set(w.nod || 0, 0, 0);
    if (w.mask) w.mask.rotation.x = w.maskDown ? 0 : -Math.PI * 0.62;
    w.root.updateMatrixWorld(true);
  }
  AR.pose = pose;

  /* ------------------------------------------------------------ herramientas (en la mano derecha) */
  const TOOLS = {};
  function tool(name) {
    if (TOOLS[name]) return TOOLS[name];
    const M = mats(), g = new T.Group(); g.name = 'tool_' + name;
    const add = (m, x, y, z, rx, ry, rz) => { m.position.set(x, y, z); if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0); g.add(m); return m; };
    if (name === 'soldador') {           // portaelectrodo: mango, pinza y electrodo
      add(cyl(0.016, 0.014, 0.12, M.herrRojo), 0, -0.02, 0);
      add(cyl(0.012, 0.006, 0.07, M.cobre), 0, -0.11, 0);
      add(cyl(0.0022, 0.0022, 0.14, M.metal, 8), 0, -0.2, 0);
      g.userData.tip = V3(0, -0.27, 0);
    } else if (name === 'taladro') {     // atornillador inalámbrico
      add(box(0.05, 0.05, 0.14, M.herrAm), 0, -0.02, 0.05);
      add(box(0.035, 0.09, 0.045, M.herr), 0, -0.07, 0.015);
      add(box(0.045, 0.035, 0.06, M.herr), 0, -0.125, 0.02);
      add(cyl(0.014, 0.014, 0.05, M.herr), 0, -0.02, 0.145, Math.PI / 2);
      const bit = add(cyl(0.003, 0.003, 0.075, M.metal, 8), 0, -0.02, 0.2, Math.PI / 2); bit.name = 'bit';
      g.rotation.x = Math.PI / 2;   // el eje de la broca queda hacia -y de la mano
      g.userData.tip = V3(0, -0.24, 0);
    } else if (name === 'cola') {
      add(cyl(0.028, 0.028, 0.11, M.plasticoAm), 0, -0.04, 0);
      add(cyl(0.004, 0.012, 0.04, M.herrRojo), 0, -0.115, 0);
      g.userData.tip = V3(0, -0.14, 0);
    } else if (name === 'allen') {
      add(cyl(0.004, 0.004, 0.1, M.metal, 6), 0, -0.05, 0);
      add(cyl(0.004, 0.004, 0.035, M.metal, 6), 0, 0, 0.016, Math.PI / 2);
      g.userData.tip = V3(0, -0.1, 0);
    } else if (name === 'martillo') {
      add(cyl(0.012, 0.014, 0.24, M.madera), 0, -0.08, 0);
      add(box(0.03, 0.03, 0.09, M.herr), 0, -0.2, 0);
      g.userData.tip = V3(0, -0.2, 0.045);
    } else if (name === 'pistola') {     // pistola HVLP con vaso
      add(box(0.03, 0.08, 0.1, M.metal), 0, -0.03, 0.02);
      add(cyl(0.032, 0.026, 0.09, M.plasticoAm), 0, 0.06, 0.03);
      add(cyl(0.008, 0.008, 0.04, M.metal), 0, -0.01, 0.085, Math.PI / 2);
      g.rotation.x = Math.PI / 2;
      g.userData.tip = V3(0, -0.12, 0);
    } else if (name === 'cinta') {       // flexómetro
      add(box(0.06, 0.06, 0.03, M.herrAm), 0, -0.03, 0);
      g.userData.tip = V3(0, -0.06, 0);
    } else if (name === 'ventosa') {
      add(cyl(0.055, 0.06, 0.02, M.ventosa), 0, -0.015, 0);
      add(box(0.03, 0.04, 0.09, M.herrRojo), 0, 0.02, 0);
      g.userData.tip = V3(0, -0.025, 0);
    }
    g.traverse((m) => { if (m.isMesh) { m.castShadow = true; } });
    TOOLS[name] = g; return g;
  }
  function equip(name, left) {
    const w = AR.worker(), arm = w.arms[left ? 'L' : 'R'];
    const cur = left ? w.toolL : w.tool;
    if (cur === name) return;
    arm.tool.children.slice().forEach((c) => arm.tool.remove(c));
    if (name) arm.tool.add(tool(name));
    if (left) w.toolL = name; else w.tool = name;
    E.invalidate();
  }
  const tipOffset = (name) => (name && TOOLS[name] ? TOOLS[name].userData.tip.length() : 0) + 0.06;

  /* ------------------------------------------------------------ efectos */
  const FX = { sparks: null, dust: null, mist: null, light: null, flash: null, smoke: [] };
  function particles(mat, n) {
    const g = new T.BufferGeometry(), pos = new Float32Array(n * 3);
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    const pt = new T.Points(g, mat); pt.frustumCulled = false; pt.visible = false; pt.renderOrder = 9; pt.raycast = function () {};
    pt.userData = { vel: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n), n, live: 0, grav: -6, drag: 0.98 };
    E.scene.add(pt); E.noReflect.push(pt);
    return pt;
  }
  function emit(pt, at, dir, count, speed, spread, life, grav) {
    const u = pt.userData, p = pt.geometry.attributes.position;
    let k = 0;
    for (let i = 0; i < u.n && k < count; i++) {
      if (u.life[i] > 0) continue;
      const vx = dir.x + (Math.random() - 0.5) * spread, vy = dir.y + (Math.random() - 0.5) * spread, vz = dir.z + (Math.random() - 0.5) * spread;
      const s = speed * (0.4 + Math.random() * 0.8);
      u.vel[i * 3] = vx * s; u.vel[i * 3 + 1] = vy * s; u.vel[i * 3 + 2] = vz * s;
      p.setXYZ(i, at.x, at.y, at.z);
      u.life[i] = u.max[i] = life * (0.5 + Math.random() * 0.8);
      k++;
    }
    u.grav = grav == null ? -6 : grav; u.live = 1; pt.visible = true; p.needsUpdate = true; E.invalidate();
  }
  function stepParticles(pt, dt) {
    const u = pt.userData; if (!u.live) return;
    const p = pt.geometry.attributes.position; let any = 0;
    for (let i = 0; i < u.n; i++) {
      if (u.life[i] <= 0) { p.setXYZ(i, 0, -5, 0); continue; }
      u.life[i] -= dt; any++;
      u.vel[i * 3 + 1] += u.grav * dt; u.vel[i * 3] *= u.drag; u.vel[i * 3 + 2] *= u.drag;
      let y = p.getY(i) + u.vel[i * 3 + 1] * dt;
      if (y < 0.004) { y = 0.004; u.vel[i * 3 + 1] *= -0.3; u.vel[i * 3] *= 0.5; u.vel[i * 3 + 2] *= 0.5; }
      p.setXYZ(i, p.getX(i) + u.vel[i * 3] * dt, y, p.getZ(i) + u.vel[i * 3 + 2] * dt);
    }
    p.needsUpdate = true;
    if (!any) { u.live = 0; pt.visible = false; }
    E.invalidate();
  }
  function fxInit() {
    if (FX.sparks) return;
    const M = mats();
    FX.sparks = particles(M.chispa, 140); FX.dust = particles(M.polvo, 60); FX.mist = particles(M.bruma, 160);
    FX.light = new T.PointLight(0xbfd8ff, 0, 2.6, 2); FX.light.visible = false; E.scene.add(FX.light);
    FX.flash = new T.Sprite(M.flash); FX.flash.scale.set(0.22, 0.22, 1); FX.flash.visible = false; FX.flash.renderOrder = 10; E.scene.add(FX.flash); E.noReflect.push(FX.flash);
    for (let i = 0; i < 8; i++) { const s = new T.Sprite(M.humo.clone()); s.visible = false; s.userData = { life: 0 }; E.scene.add(s); E.noReflect.push(s); FX.smoke.push(s); }
    E.hooks.push((dt) => {
      stepParticles(FX.sparks, dt); stepParticles(FX.dust, dt); stepParticles(FX.mist, dt);
      let any = false;
      FX.smoke.forEach((s) => { if (!s.visible) return; any = true; s.userData.life -= dt; const k = 1 - s.userData.life / 1.8; s.position.y += dt * 0.22; s.position.x += s.userData.vx * dt; s.material.opacity = 0.28 * (1 - k) * Math.min(1, k * 6); const sc = 0.06 + k * 0.3; s.scale.set(sc, sc, 1); if (s.userData.life <= 0) s.visible = false; });
      if (any) E.invalidate();
      if (FX.light.visible) { FX.light.intensity = 2 + Math.random() * 9; FX.flash.material.opacity = 0.5 + Math.random() * 0.5; FX.flash.scale.setScalar(0.14 + Math.random() * 0.14); E.invalidate(); }
    });
  }
  function smokeAt(p) { const s = FX.smoke.find((x) => !x.visible); if (!s) return; s.position.copy(p); s.position.y += 0.02; s.userData.life = 1.8; s.userData.vx = (Math.random() - 0.5) * 0.08; s.visible = true; s.material.opacity = 0; s.scale.set(0.06, 0.06, 1); }
  function fxGroup(o) { if (!o._fx) { o._fx = new T.Group(); o._fx.name = 'fx'; o.group.add(o._fx); } return o._fx; }
  function clearFx() {
    S.fx.forEach((m) => { if (m.parent) m.parent.remove(m); if (m.geometry && m.userData.own) m.geometry.dispose(); });
    S.fx = [];
    if (FX.light) { FX.light.visible = false; FX.flash.visible = false; FX.smoke.forEach((s) => { s.visible = false; }); [FX.sparks, FX.dust, FX.mist].forEach((pt) => { pt.userData.live = 0; pt.userData.life.fill(0); pt.visible = false; }); }
  }
  /* props de la planta: el equipo de soldar, el taburete, el carro de herramientas */
  const PROPS = {};
  function prop(name) {
    if (PROPS[name]) return PROPS[name];
    const M = mats(), g = new T.Group(); g.name = 'prop_' + name;
    const add = (m, x, y, z, ry) => { m.position.set(x, y, z); if (ry) m.rotation.y = ry; g.add(m); return m; };
    if (name === 'soldadora') {
      add(box(0.3, 0.06, 0.42, M.herr), 0, 0.09, 0);
      add(box(0.26, 0.3, 0.36, M.herrRojo), 0, 0.27, 0);
      add(box(0.2, 0.08, 0.02, M.herr), 0, 0.35, 0.185);
      add(cyl(0.008, 0.008, 0.9, M.metal, 8), -0.12, 0.6, -0.16); add(cyl(0.008, 0.008, 0.9, M.metal, 8), 0.12, 0.6, -0.16);
      add(cyl(0.008, 0.008, 0.25, M.metal, 8), 0, 1.04, -0.16).rotation.z = Math.PI / 2;
      [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].forEach((p) => { const r = cyl(0.045, 0.045, 0.03, M.gorra, 16); r.rotation.z = Math.PI / 2; add(r, p[0], 0.045, p[1]); });
      const cable = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([V3(0.1, 0.36, 0.2), V3(0.3, 0.1, 0.4), V3(0.2, 0.02, 0.7)]), 12, 0.008, 6, false), M.cable); g.add(cable); g.userData.cable = cable;
    } else if (name === 'taburete') {
      add(box(0.5, 0.04, 0.42, M.plasticoAm), 0, 0.43, 0);
      [[-0.21, -0.17], [0.21, -0.17], [-0.21, 0.17], [0.21, 0.17]].forEach((p) => add(cyl(0.018, 0.022, 0.42, M.herr, 10), p[0], 0.21, p[1]));
      add(box(0.44, 0.03, 0.03, M.herr), 0, 0.2, 0.17); add(box(0.44, 0.03, 0.03, M.herr), 0, 0.2, -0.17);
      add(box(0.5, 0.035, 0.24, M.plasticoAm), 0, 0.21, 0.38);
      [[-0.21, 0.48], [0.21, 0.48]].forEach((p) => add(cyl(0.018, 0.022, 0.2, M.herr, 10), p[0], 0.1, p[1]));
    } else if (name === 'carro') {
      add(box(0.6, 0.72, 0.42, M.herrRojo), 0, 0.42, 0);
      for (let i = 0; i < 3; i++) add(box(0.5, 0.17, 0.01, M.herr), 0, 0.2 + i * 0.2, 0.213);
      for (let i = 0; i < 3; i++) add(box(0.2, 0.02, 0.02, M.metal), 0, 0.2 + i * 0.2, 0.225);
      add(box(0.62, 0.03, 0.44, M.herr), 0, 0.795, 0);
      [[-0.24, -0.15], [0.24, -0.15], [-0.24, 0.15], [0.24, 0.15]].forEach((p) => { const r = cyl(0.035, 0.035, 0.03, M.gorra, 14); r.rotation.z = Math.PI / 2; add(r, p[0], 0.035, p[1]); });
      // herramientas encima: caja, pistola, lijadora
      add(box(0.26, 0.1, 0.14, M.herrAm), -0.12, 0.86, 0.02); add(cyl(0.06, 0.07, 0.07, M.herr), 0.14, 0.85, 0.08); add(box(0.08, 0.05, 0.14, M.herrAm), 0.17, 0.84, -0.1);
    } else if (name === 'sargento') {
      add(box(0.02, 0.26, 0.035, M.herr), 0, 0.13, 0); add(box(0.09, 0.03, 0.035, M.herr), 0.035, 0.015, 0); add(box(0.09, 0.03, 0.035, M.herr), 0.035, 0.245, 0);
      add(cyl(0.006, 0.006, 0.08, M.metal, 8), 0.075, 0.2, 0); add(box(0.04, 0.012, 0.04, M.herrRojo), 0.075, 0.25, 0);
    }
    g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    g.userData.r = { soldadora: 0.24, carro: 0.36 }[name] || 0;      // radio en planta (para que el operario los rodee)
    g.visible = false; E.scene.add(g);
    PROPS[name] = g; return g;
  }
  function showProp(name, pos, ry) { const g = prop(name); g.position.copy(pos); g.rotation.y = ry || 0; g.visible = true; g.scale.setScalar(0.01); track(E.tween(0.5, (k) => { g.scale.setScalar(k); }, { ease: E.ease.outBack })); E.shadowDirty = true; return g; }
  function hideProps() { for (const k in PROPS) PROPS[k].visible = false; }

  /* ------------------------------------------------------------ sonido sintetizado */
  const AU = { ctx: null, gain: null };
  function audio() {
    if (AU.ctx) return AU.ctx;
    try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); AU.gain = AU.ctx.createGain(); AU.gain.gain.value = 0.5; AU.gain.connect(AU.ctx.destination); } catch (e) { AU.ctx = null; }
    return AU.ctx;
  }
  function noiseBuf(ctx, sec) { const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function snd(kind, dur) {
    if (!S.sound) return;
    const c = audio(); if (!c) return;
    if (c.state === 'suspended') c.resume();
    const t = c.currentTime, g = c.createGain(); g.connect(AU.gain);
    const env = (a, s, r, peak) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + s); g.gain.exponentialRampToValueAtTime(0.0008, t + s + r); };
    if (kind === 'soldar') {
      const src = c.createBufferSource(); src.buffer = noiseBuf(c, dur + 0.1); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.7;
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.type = 'square'; lfo.frequency.value = 28; lg.gain.value = 0.5; lfo.connect(lg); lg.connect(f.frequency);
      src.connect(f); f.connect(g); const hum = c.createOscillator(); hum.frequency.value = 60; const hg = c.createGain(); hg.gain.value = 0.05; hum.connect(hg); hg.connect(g);
      env(0.03, dur, 0.12, 0.22); src.start(t); hum.start(t); lfo.start(t); src.stop(t + dur + 0.2); hum.stop(t + dur + 0.2); lfo.stop(t + dur + 0.2);
    } else if (kind === 'taladro') {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.linearRampToValueAtTime(230, t + dur * 0.6); o.frequency.linearRampToValueAtTime(90, t + dur);
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800; const src = c.createBufferSource(); src.buffer = noiseBuf(c, dur + 0.1); const ng = c.createGain(); ng.gain.value = 0.12;
      o.connect(f); f.connect(g); src.connect(ng); ng.connect(g); env(0.02, dur, 0.08, 0.16); o.start(t); src.start(t); o.stop(t + dur + 0.1); src.stop(t + dur + 0.1);
    } else if (kind === 'martillo') {
      const o = c.createOscillator(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.09); o.connect(g); env(0.004, 0.02, 0.14, 0.5); o.start(t); o.stop(t + 0.25);
      const src = c.createBufferSource(); src.buffer = noiseBuf(c, 0.08); const g2 = c.createGain(); g2.gain.setValueAtTime(0.25, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06); src.connect(g2); g2.connect(AU.gain); src.start(t);
    } else if (kind === 'pistola') {
      const src = c.createBufferSource(); src.buffer = noiseBuf(c, dur + 0.1); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3500; src.connect(f); f.connect(g); env(0.08, dur, 0.15, 0.12); src.start(t); src.stop(t + dur + 0.2);
    } else if (kind === 'clic') {
      const src = c.createBufferSource(); src.buffer = noiseBuf(c, 0.05); const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000; src.connect(f); f.connect(g); env(0.002, 0.01, 0.05, 0.3); src.start(t);
    } else if (kind === 'rosca') {
      for (let i = 0; i < 4; i++) { const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 520 + i * 40; const gg = c.createGain(); gg.gain.setValueAtTime(0, t + i * 0.1); gg.gain.linearRampToValueAtTime(0.08, t + i * 0.1 + 0.01); gg.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.06); o.connect(gg); gg.connect(AU.gain); o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.08); }
    } else if (kind === 'listo') {
      [[660, 0], [880, 0.14], [1320, 0.28]].forEach((n) => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = n[0]; const gg = c.createGain(); gg.gain.setValueAtTime(0, t + n[1]); gg.gain.linearRampToValueAtTime(0.18, t + n[1] + 0.02); gg.gain.exponentialRampToValueAtTime(0.001, t + n[1] + 0.5); o.connect(gg); gg.connect(AU.gain); o.start(t + n[1]); o.stop(t + n[1] + 0.55); });
    } else if (kind === 'vacio') {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.25); o.connect(g); env(0.01, 0.05, 0.25, 0.12); o.start(t); o.stop(t + 0.35);
    }
  }
  AR.setSound = function (on) { S.sound = on; try { localStorage.setItem('l3d-sonido', on ? '1' : '0'); } catch (e) { /* */ } if (on) { audio(); snd('clic', 0.05); } };
  try { S.sound = localStorage.getItem('l3d-sonido') === '1'; } catch (e) { /* */ }

  /* ------------------------------------------------------------ movimiento del operario */
  const frontDir = (o) => V3(0, 0, 1).applyAxisAngle(UP, o.group.rotation.y);
  const toWorld = (o, p) => o.group.localToWorld(p.clone());
  const toWorldDir = (o, d) => d.clone().applyAxisAngle(UP, o.group.rotation.y);
  /* dentro del local, sin atravesar muros */
  function inRoom(p, m) { const FR = E.floorRect; m = m || 0.3; p.x = clamp(p.x, FR[0] + m, FR[2] - m); p.z = clamp(p.z, FR[1] + m, FR[3] + 2.2); return p; }
  const inWalk = (x, z) => { const FR = E.floorRect; if (z > FR[3] + 0.42 && z <= FR[3] + 2.6) return Math.abs(x) < 9; return x >= FR[0] + 0.28 && x <= FR[2] - 0.28 && z >= FR[1] + 0.28 && z <= FR[3] + 2.0; };
  function localBox(o) { if (!o._lbox) { o._lbox = new T.Box3(); o.parts.forEach((p) => o._lbox.union(boxOf(p))); } return o._lbox; }

  /* --- obstáculos: el operario no atraviesa muebles, equipos del taller ni los pilares de la fachada.
     Cada obstáculo es un rectángulo en planta (la caja del mueble, en su posición actual) agrandado con el
     medio ancho del operario, de modo que su cuerpo entero quede por fuera. */
  const RW = 0.27;
  const inRect = (r, x, z) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;
  function obstacles(m, skip) {
    m = m === undefined ? RW : m;
    const list = [], items = L.furn ? L.furn.items : {};
    Object.keys(items).forEach((n) => { const it = items[n]; if (!it || !it.insts) return; it.insts.forEach((oi) => {
      if (oi === skip || !oi.box || oi.box.min.y > 1.75 || !oi.group.visible) return;
      const dx = oi.group.position.x - oi.home.x, dz = oi.group.position.z - oi.home.z;
      list.push({ x0: oi.box.min.x + dx - m, z0: oi.box.min.z + dz - m, x1: oi.box.max.x + dx + m, z1: oi.box.max.z + dz + m, o: oi, top: oi.box.max.y, bottom: oi.box.min.y });
    }); });
    for (const k in PROPS) { const g = PROPS[k], r = g.userData.r; if (!g.visible || !r) continue; list.push({ x0: g.position.x - r - m * 0.7, z0: g.position.z - r - m * 0.7, x1: g.position.x + r + m * 0.7, z1: g.position.z + r + m * 0.7, prop: k, top: 1.1, bottom: 0 }); }
    const FR = E.floorRect;
    list.push({ x0: -9, z0: FR[3] - 0.05 - m, x1: -2.4 + m, z1: FR[3] + 0.45 + m, top: 9, bottom: 0 }, { x0: 2.4 - m, z0: FR[3] - 0.05 - m, x1: 9, z1: FR[3] + 0.45 + m, top: 9, bottom: 0 });
    // división sala-trastienda (muro de listones de x = −3 a 0.9 y columna de 2.85 a 3, en z ≈ −2.05); se pasa por la mampara
    const R = L.room, zd = R && R.wz ? R.wz(R.dim.SALA) - 0.05 : -2.05;
    list.push({ x0: -9, z0: zd - 0.07 - m, x1: 0.9 + m, z1: zd + 0.07 + m, top: 9, bottom: 0 }, { x0: 2.85 - m, z0: zd - 0.07 - m, x1: 9, z1: zd + 0.07 + m, top: 9, bottom: 0 });
    return list;
  }
  const blocked = (obs, x, z) => { for (let i = 0; i < obs.length; i++) if (inRect(obs[i], x, z)) return obs[i]; return null; };
  function segFree(obs, a, b) {
    const n = Math.max(2, Math.ceil(a.distanceTo(b) / 0.05));
    for (let i = 0; i <= n; i++) { const t = i / n; if (blocked(obs, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false; }
    return true;
  }
  /* el punto libre más cercano a p (y, a igual anillo, el más cercano a pref) */
  function freeSpot(p, obs, pref) {
    if (inWalk(p.x, p.z) && !blocked(obs, p.x, p.z)) return p;
    for (let r = 0.1; r <= 3; r += 0.1) {
      let best = null;
      for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r; if (!inWalk(x, z) || blocked(obs, x, z)) continue; const s = pref ? Math.hypot(x - pref.x, z - pref.z) : 0; if (!best || s < best.s) best = { x, z, s }; }
      if (best) { p.x = best.x; p.z = best.z; return p; }
    }
    return p;
  }
  /* ruta a pie entre dos puntos: A* sobre una trama de 10 cm, luego se tensa la cuerda (atajos rectos libres) */
  function findPath(from, to, obs) {
    if (segFree(obs, from, to)) return [from, to];
    const FR = E.floorRect, CS = 0.1, x0 = FR[0] + 0.28, z0 = FR[1] + 0.28, nx = Math.floor((FR[2] - 0.28 - x0) / CS) + 1, nz = Math.floor((FR[3] + 2.0 - z0) / CS) + 1, N = nx * nz;
    const free = new Uint8Array(N);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) free[j * nx + i] = blocked(obs, x0 + i * CS, z0 + j * CS) ? 0 : 1;
    const ci = (p) => clamp(Math.round((p.x - x0) / CS), 0, nx - 1), cj = (p) => clamp(Math.round((p.z - z0) / CS), 0, nz - 1);
    const s = cj(from) * nx + ci(from), t = cj(to) * nx + ci(to); free[s] = free[t] = 1;
    const g = new Float32Array(N).fill(1e9), par = new Int32Array(N).fill(-1), done = new Uint8Array(N);
    const heap = [], hpush = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const q = (k - 1) >> 1; if (heap[q][0] <= heap[k][0]) break; [heap[q], heap[k]] = [heap[k], heap[q]]; k = q; } };
    const hpop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const a = 2 * k + 1, b = a + 1; let m = k; if (a < heap.length && heap[a][0] < heap[m][0]) m = a; if (b < heap.length && heap[b][0] < heap[m][0]) m = b; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    const h = (i) => Math.hypot((i % nx) - (t % nx), Math.floor(i / nx) - Math.floor(t / nx));
    g[s] = 0; hpush(h(s), s);
    const NB = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    let found = false, guard = 0;
    while (heap.length && guard++ < 60000) {
      const [, u] = hpop(); if (done[u]) continue; done[u] = 1; if (u === t) { found = true; break; }
      const ui = u % nx, uj = Math.floor(u / nx);
      for (const [di, dj, c] of NB) {
        const vi = ui + di, vj = uj + dj; if (vi < 0 || vj < 0 || vi >= nx || vj >= nz) continue;
        const v = vj * nx + vi; if (!free[v] || done[v]) continue;
        if (c > 1 && (!free[uj * nx + vi] || !free[vj * nx + ui])) continue;      // no cortar esquinas
        const ng = g[u] + c; if (ng < g[v]) { g[v] = ng; par[v] = u; hpush(ng + h(v), v); }
      }
    }
    if (!found) return null;
    const raw = [to]; for (let u = par[t]; u >= 0 && u !== s; u = par[u]) raw.push(V3(x0 + (u % nx) * CS, 0, z0 + Math.floor(u / nx) * CS)); raw.push(from); raw.reverse();
    const out = [raw[0]]; let i = 0;
    while (i < raw.length - 1) { let j = raw.length - 1; while (j > i + 1 && !segFree(obs, raw[i], raw[j])) j--; out.push(raw[j]); i = j; }
    return out;
  }

  /* dónde pararse para alcanzar unos puntos: por fuera del mueble, en la cara más cercana a los puntos
     (frente, costados o fondo si no hay muro), a la distancia de la herramienta; con el punto un poco a la
     derecha del operario (trabaja con la mano derecha); en el taburete si queda alto; agachado si queda bajo */
  function standFor(o, pts, toolName) {
    const c = new T.Vector3(); pts.forEach((q) => c.add(o.group.worldToLocal(q.w.clone()))); c.multiplyScalar(1 / pts.length);
    const lb = localBox(o), maxY = Math.max.apply(null, pts.map((q) => q.w.y)), minY = Math.min.apply(null, pts.map((q) => q.w.y));
    const stool = maxY > 1.92 ? 0.45 : 0;
    const dist = clamp(0.22 + tipOffset(toolName === undefined ? AR.worker().tool : toolName), 0.3, 0.6) + (stool ? 0.06 : 0);
    const obs = obstacles(), target = o.group.localToWorld(c.clone());
    const sides = [
      { n: V3(0, 0, 1), p: V3(c.x - 0.12, 0, lb.max.z + dist), pen: 0 },
      { n: V3(1, 0, 0), p: V3(lb.max.x + dist, 0, c.z + 0.12), pen: 0.3 },
      { n: V3(-1, 0, 0), p: V3(lb.min.x - dist, 0, c.z - 0.12), pen: 0.3 },
      { n: V3(0, 0, -1), p: V3(c.x + 0.12, 0, lb.min.z - dist), pen: 0.5 }
    ];
    const reach = 0.6 + tipOffset(toolName === undefined ? AR.worker().tool : toolName);     // hasta dónde llega con el brazo estirado
    let best = null;
    sides.forEach((sd) => {
      const raw = o.group.localToWorld(sd.p.clone()); raw.y = 0; const pos = inRoom(raw.clone());
      let far = 0; pts.forEach((q) => { far = Math.max(far, Math.hypot(pos.x - q.w.x, pos.z - q.w.z)); });
      let cost = sd.pen + far + (far > reach ? (far - reach) * 4 : 0);        // que alcance el punto más lejano del grupo
      if (pos.distanceTo(raw) > 0.04) cost += 10;                                 // chocaría con un muro
      if (!inWalk(pos.x, pos.z) || blocked(obs, pos.x, pos.z)) cost += 6;         // está ocupado por otro mueble o equipo
      if (!best || cost < best.cost) best = { pos, cost };
    });
    const pos = freeSpot(best.pos, obs, target); pos.y = 0;
    const face = Math.atan2(target.x - pos.x, target.z - pos.z);
    return { pos, face, stool, crouch: minY < 0.72 ? clamp((0.9 - minY) / 0.6, 0, 1) : 0 };
  }
  /* camina por una ruta de varios tramos girando suavemente en cada vértice */
  async function walkPath(path) {
    const w = AR.worker(), segs = []; let total = 0;
    for (let i = 1; i < path.length; i++) { const d = path[i].distanceTo(path[i - 1]); if (d < 1e-3) continue; segs.push({ a: path[i - 1], b: path[i], d, s0: total, h: Math.atan2(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z) }); total += d; }
    if (!segs.length) return;
    await turnTo(segs[0].h);
    w.walking = true; w.crouch = 0; w.arms.L.target = w.arms.R.target = null;
    const dur = Math.max(0.35, total / 1.15); let lastK = 0;
    await wait(dur, (k) => {
      const s = k * total; let sg = segs[segs.length - 1]; for (let i = 0; i < segs.length; i++) if (s <= segs[i].s0 + segs[i].d) { sg = segs[i]; break; }
      const t = clamp((s - sg.s0) / sg.d, 0, 1); w.root.position.lerpVectors(sg.a, sg.b, t); w.root.position.y = 0;
      const dk = Math.max(0, k - lastK); lastK = k;
      const dh = Math.atan2(Math.sin(sg.h - w.facing), Math.cos(sg.h - w.facing)); w.facing += dh * Math.min(1, dk * dur * 10); w.root.rotation.y = w.facing;
      w.walk = (s / 0.62) * Math.PI * 2; pose(); E.shadowDirty = true;
    });
    w.walking = false; w.walk = 0;
  }
  async function moveTo(st) {
    const w = AR.worker(), from = w.root.position.clone(), to = st.pos, d = from.distanceTo(to);
    const a0 = w.facing, a1 = w.facing + Math.atan2(Math.sin(st.face - w.facing), Math.cos(st.face - w.facing));
    const stoolChange = st.stool !== w.stool;
    if (d < 0.08 && Math.abs(a1 - a0) < 0.05 && !stoolChange) { await crouchTo(st.crouch); return; }
    if (w.stool && (d > 0.08 || stoolChange)) { await stepStool(0); }
    if (d > 0.08) {
      // rodea los muebles y equipos: ruta libre entre donde está y donde debe pararse
      const obs = obstacles();
      const start = blocked(obs, from.x, from.z) ? freeSpot(from.clone(), obs, to) : from;
      const path = findPath(start, to, obs) || [start, to]; if (start !== from) path.unshift(from);
      await walkPath(path);
    }
    if (st.stool && !w.stool) { placeStool(st); await stepStool(st.stool); }
    await turnTo(a1);
    await crouchTo(st.crouch);
  }
  AR._path = { obstacles, findPath, freeSpot, standFor };
  AR.nav = { obstacles, findPath, freeSpot, segFree, blocked, inWalk, inRoom, RW };
  async function turnTo(a) {
    const w = AR.worker(), a0 = w.facing, d = Math.atan2(Math.sin(a - a0), Math.cos(a - a0));
    if (Math.abs(d) < 0.03) return;
    await wait(Math.min(0.5, 0.18 + Math.abs(d) * 0.25), (k) => { w.facing = a0 + d * E.ease.inOut(k); w.root.rotation.y = w.facing; pose(); });
  }
  async function crouchTo(c) {
    const w = AR.worker(), c0 = w.crouch; if (Math.abs(c - c0) < 0.02) { w.crouch = c; pose(); return; }
    await wait(0.4, (k) => { w.crouch = lerp(c0, c, E.ease.inOut(k)); pose(); });
  }
  function placeStool(st) { const w = AR.worker(); const f = V3(Math.sin(st.face), 0, Math.cos(st.face)); const p = st.pos.clone().addScaledVector(f, 0.0); p.y = 0; showProp('taburete', p, st.face); w._stoolPos = p; }
  async function stepStool(h) {
    const w = AR.worker(), h0 = w.stool;
    await wait(0.45, (k) => { w.stool = lerp(h0, h, E.ease.inOut(k)); w.walk = k * Math.PI; w.walking = k < 0.95; pose(); });
    w.walking = false; w.walk = 0; if (!h) PROPS.taburete && (PROPS.taburete.visible = false);
  }
  /* lleva una mano a un punto (con la punta de la herramienta en el punto) */
  async function reach(side, worldPt, worldDir, dur, hold) {
    const w = AR.worker(), a = w.arms[side], name = side === 'R' ? w.tool : w.toolL;
    const off = hold ? 0.06 : tipOffset(name);
    const dir = (worldDir || V3(0, -1, 0)).clone().normalize();
    const target = worldPt.clone().addScaledVector(dir, -off);
    const from = a.target ? a.cur.clone() : a.hand.getWorldPosition(new T.Vector3());
    const d0 = a.curDir.clone();
    a.target = target; w.look = worldPt;
    await wait(dur || 0.4, (k) => { const e = E.ease.inOut(k); a.cur.lerpVectors(from, target, e); a.curDir.lerpVectors(d0, dir, e).normalize(); pose(); });
    a.cur.copy(target); a.curDir.copy(dir); pose();
  }
  function release(side) { const a = AR.worker().arms[side]; a.target = null; }
  async function idle(dur) { const w = AR.worker(); release('L'); release('R'); w.look = null; await wait(dur || 0.3, () => pose()); }

  /* ------------------------------------------------------------ cámara */
  /* cámara por encima del hombro del operario (como en un videojuego en tercera persona): detrás y a un lado
     de él, un poco más alta que su cabeza, mirando al punto de trabajo. Se elige el lado que quede más lejos de
     los muros y fuera del mueble. Con los paneles abiertos se ve menos pantalla: se aleja un poco más. */
  function camOp(o, pts, st) {
    if (!S.follow || E.reduced) return;
    const c = new T.Vector3(); pts.forEach((q) => c.add(q.w)); c.multiplyScalar(1 / pts.length);
    let spread = 0; pts.forEach((q) => { spread = Math.max(spread, q.w.distanceTo(c)); });
    const us = E.usable ? E.usable() : { w: E.size.w, h: E.size.h }, kFit = clamp(E.size.w / Math.max(120, us.w), 1, 2.1) * 0.8;
    const face = V3(Math.sin(st.face), 0, Math.cos(st.face)), back = face.clone().negate(), lat = V3(face.z, 0, -face.x);
    const wk = st.pos.clone(), dist = (1.7 + spread * 0.8) * Math.max(1, kFit), FR = E.floorRect;
    const box = o.box ? o.box.clone().expandByScalar(0.25) : null;
    // mira entre el punto de trabajo y el pecho del operario, para que él siempre quede en cuadro
    const tgt = c.clone().lerp(wk.clone().setY(1.15 + st.stool - st.crouch * 0.4), 0.35); tgt.y = clamp(tgt.y, 0.6, 1.9);
    const obs = obstacles(0.2);
    // ¿la cámara queda dentro de un mueble o equipo más alto que ella, o algo tapa la vista hasta el punto?
    const inside = (P) => { const r = blocked(obs, P.x, P.z); return r && (r.top === undefined || r.top > P.y - 0.25); };
    const hidden = (P) => { const n = 14; for (let i = 1; i < n; i++) { const t = i / n, x = P.x + (tgt.x - P.x) * t, z = P.z + (tgt.z - P.z) * t, y = P.y + (tgt.y - P.y) * t; const r = blocked(obs, x, z); if (r && r.o !== o && r.top !== undefined && r.top > y && r.bottom < y) return true; } return false; };
    let best = null;
    [1, -1].forEach((sg) => [[1, 1.8], [0.72, 1.75], [1, 2.5]].forEach((v) => {
      const P = wk.clone().addScaledVector(back, dist * v[0]).addScaledVector(lat, sg * (1.5 + spread * 0.3) * Math.max(1, kFit * 0.9) * v[0]); P.y = v[1] + st.stool + Math.max(0, c.y - 1.4) * 0.5;
      const raw = P.clone(); inRoom(P, 0.45);
      let score = Math.min(P.x - FR[0], FR[2] - P.x, P.z - FR[1]) - P.distanceTo(raw) * 2 - (1 - v[0]) * 1.2 - (v[1] > 2 ? 0.8 : 0);
      if (box && box.containsPoint(P)) score -= 5;
      if (inside(P)) score -= 5;
      if (hidden(P)) score -= 3;
      if (sg * c.clone().sub(wk).dot(lat) > 0) score += 0.45;                   // del lado en que queda el punto de trabajo (no lo tapa el cuerpo)
      if (!best || score > best.score) best = { P, score, sg };
    }));
    const P = best.P, d = P.clone().sub(tgt), r = Math.max(1.4, d.length());
    const th = Math.atan2(d.x, d.z), ph = Math.acos(clamp(d.y / r, -1, 1));
    AR._lastCam = best;
    E.flyTo({ target: tgt, theta: th, phi: clamp(ph, 0.5, 1.45), radius: r }, 1.1 / S.speed, { ease: E.ease.inOut });
  }
  function camWhole(dur) { if (!S.follow || E.reduced) return; H.focus(S.it, S.inst, true, dur || 1.1); }

  /* ------------------------------------------------------------ operaciones */
  function setOp(ico, text, i, n, mins) {
    S.op = { ico, text, i, n, mins };
    const el = $('#st-op'); if (!el) return;
    el.hidden = false;
    $('#st-ico').innerHTML = ICO[ico] || ICO.mano;
    $('#st-opt').textContent = text;
    $('#st-cnt').textContent = n > 1 ? (i + 1) + ' de ' + n : '';
    $('#st-barf').style.width = (n ? Math.round(((i + 1) / n) * 100) : 100) + '%';
    const tm = $('#st-min'); if (tm) tm.textContent = mins ? '≈ ' + fmtMin(mins) + ' en planta' : '';
  }
  const fmtMin = (m) => (m >= 60 ? (m / 60).toFixed(1).replace('.', ',') + ' h' : Math.round(m) + ' min');
  const ICO = {
    soldar: '<svg viewBox="0 0 20 20"><path d="M3 17 9 11M9 11l2-2M11 9l1.5 1.5M12 4l1 3M16 8l-3 1M15 13l-2.5-1M11 3l-.5 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    atornillar: '<svg viewBox="0 0 20 20"><path d="M4 7h8v6H4zM12 8h4v4h-4zM6 10h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 13v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    encolar: '<svg viewBox="0 0 20 20"><path d="M8 3h4v3l1 1v9H7V7l1-1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 16v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    conectar: '<svg viewBox="0 0 20 20"><path d="M4 10h4M12 10h4M8 7v6M12 7v6M8 7h4M8 13h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    mano: '<svg viewBox="0 0 20 20"><path d="M6 11V5.5a1 1 0 0 1 2 0V10M8 9V4.5a1 1 0 0 1 2 0V10M10 9V5a1 1 0 0 1 2 0v6l2.5-2a1 1 0 0 1 1.4 1.4L12 15c-1 1.3-2 2-3.5 2C6 17 5 15.5 5 13v-2a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    martillo: '<svg viewBox="0 0 20 20"><path d="M3 17l7-7M9 5l3-2 4 4-2 3zM10 10l3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    vidrio: '<svg viewBox="0 0 20 20"><rect x="4" y="3" width="12" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 14l6-8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    allen: '<svg viewBox="0 0 20 20"><path d="M5 15 12 8M12 8l3-3M12 8h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    pistola: '<svg viewBox="0 0 20 20"><path d="M3 8h9v4H8l-1 5H5l1-5H3zM12 9h5M12 11h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    revisar: '<svg viewBox="0 0 20 20"><path d="M4 10.5 8 14.5 16 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    prensa: '<svg viewBox="0 0 20 20"><path d="M6 3v14M6 5h8M6 15h8M14 5v3M14 12v3M12 8h4v4h-4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  const LBL = { soldar: 'Soldando', atornillar: 'Atornillando', herraje: 'Instalando herraje', allen: 'Fijando con escuadras', anclar: 'Anclando al muro', roscar: 'Roscando', encolar: 'Encolando', prensar: 'Prensando', conectar: 'Conectando la luz', asentar: 'Asentando el vidrio', retocar: 'Retocando la laca', colocar: 'Colocando' };
  const ICOOF = { soldar: 'soldar', atornillar: 'atornillar', herraje: 'atornillar', allen: 'allen', anclar: 'martillo', roscar: 'allen', encolar: 'encolar', prensar: 'prensa', conectar: 'conectar', asentar: 'vidrio', retocar: 'pistola', colocar: 'mano' };
  const low = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  /* la pieza llega: vuela desde su posición explosionada hasta su sitio; el operario la recibe con las dos manos */
  function partStart(p) { const u = p.userData, d = (u.exA || u.ex).clone(); if (d.lengthSq() < 1e-6) d.set(0, 0.28, 0); return u.home.clone().add(d); }
  async function colocar(o, act) {
    const parts = act.parts, big = parts.some((p) => { const s = size(boxOf(p)); return Math.max(s.x, s.y, s.z) > 0.5; });
    const pts = parts.map((p) => ({ w: toWorld(o, boxOf(p).getCenter(new T.Vector3())) }));
    const st = standFor(o, pts);
    setOp('mano', LBL.colocar + ' ' + low(act.what) + (parts.length > 1 ? ' (' + parts.length + ')' : ''), 0, 1, minutes(act));
    equip(null); equip(null, true);
    await moveTo(st);
    camOp(o, pts, st);
    const dur = act.quick ? 0.55 : act.slow ? 1.3 : 0.9, stagger = parts.length > 1 ? Math.min(0.5, 0.06 * parts.length) : 0;
    const w = AR.worker();
    const froms = parts.map((p) => { p.visible = false; const f = partStart(p); p.position.copy(f); return f; });
    const main = parts[0], mc = boxOf(main).getCenter(new T.Vector3()), ms = size(boxOf(main));
    const lx = ms.x >= ms.z ? 'x' : 'z', half = Math.min(0.35, ms[lx] * 0.4);
    const hl = mc.clone(), hr = mc.clone(); hl[lx] -= half; hr[lx] += half;
    const offL = hl.clone().sub(main.userData.home), offR = hr.clone().sub(main.userData.home);
    w.arms.L.target = w.arms.L.cur; w.arms.R.target = w.arms.R.cur;
    const grab = big || !act.quick;
    await wait(dur + stagger, (k, raw) => {
      parts.forEach((p, i) => {
        const d = parts.length > 1 ? i / (parts.length - 1) * stagger / (dur + stagger) : 0, kk = clamp((raw - d) / (dur / (dur + stagger)), 0, 1), e = E.ease.outQuint(kk);
        p.visible = kk > 0; p.position.lerpVectors(froms[i], p.userData.home, e);
      });
      if (grab) {
        const cur = main.position;
        w.arms.L.cur.copy(toWorld(o, cur.clone().add(offL))); w.arms.R.cur.copy(toWorld(o, cur.clone().add(offR)));
        w.arms.L.curDir.set(0, -1, 0); w.arms.R.curDir.set(0, -1, 0); w.look = toWorld(o, cur.clone());
      } else { w.arms.L.target = null; w.arms.R.cur.copy(toWorld(o, main.position.clone())); w.look = w.arms.R.cur; }
      pose(); E.shadowDirty = true;
    });
    parts.forEach((p) => { p.visible = true; p.position.copy(p.userData.home); });
    if (act.slow) await sleep(0.25);
    if (S.stats) S.stats.piezas += parts.length;
  }
  /* puntos de una acción, llevados al mundo */
  const worldPts = (o, pts) => pts.map((q) => ({ p: q.p, dir: q.dir, n: q.n, w: toWorld(o, q.p), wd: toWorldDir(o, q.dir), wn: toWorldDir(o, q.n) }));
  /* agrupa puntos cercanos para no caminar entre uno y otro */
  function clusters(pts) {
    const out = [];
    pts.forEach((q) => { let c = out.find((x) => Math.hypot(x.c.x - q.w.x, x.c.z - q.w.z) < 0.7 && Math.abs(x.c.y - q.w.y) < 0.9); if (!c) { c = { c: q.w.clone(), pts: [] }; out.push(c); } c.pts.push(q); });
    return out;
  }
  async function perPoint(o, act, toolName, ico, body) {
    const pts = worldPts(o, act.pts), mins = minutes(act);
    equip(toolName);
    let i = 0;
    for (const cl of clusters(pts)) {
      const st = standFor(o, cl.pts);
      await moveTo(st);
      camOp(o, cl.pts, st);
      for (const q of cl.pts) {
        setOp(ico, LBL[act.t] + ' ' + low(act.what), i, pts.length, mins);
        await body(q, i, pts.length);
        i++;
      }
    }
    if (S.stats) S.stats[act.t] = (S.stats[act.t] || 0) + pts.length;
    release('R'); release('L');
  }
  /* --- soldar: máscara abajo, arco con chispas y humo, cordón que se enfría */
  async function soldar(o, act) {
    const w = AR.worker(); fxInit();
    const pts = worldPts(o, act.pts), st0 = standFor(o, pts);
    const f = frontDir(o), side = V3(-f.z, 0, f.x);
    const mach = showProp('soldadora', freeSpot(inRoom(st0.pos.clone().addScaledVector(side, 0.95).addScaledVector(f, 0.35), 0.4), obstacles(0.3).concat([{ x0: st0.pos.x - 0.5, z0: st0.pos.z - 0.5, x1: st0.pos.x + 0.5, z1: st0.pos.z + 0.5 }]), st0.pos), st0.face);
    if (!w.maskDown) { await wait(0.35, (k) => { w.mask.visible = true; w.mask.rotation.x = lerp(-Math.PI * 0.62, 0, E.ease.inOut(k)); pose(); }); w.maskDown = true; }
    await perPoint(o, act, 'soldador', 'soldar', async (q) => {
      const tilt = q.wn.clone().multiplyScalar(0.55).add(V3(0, 0.6, 0)).normalize();        // el electrodo entra inclinado
      await reach('R', q.w, tilt.negate(), 0.45);
      await reach('L', q.w.clone().addScaledVector(q.wd, 0.0).add(V3(0, 0.12, 0)).addScaledVector(q.wn, 0.1), V3(0, -1, 0), 0.25, true);
      FX.light.position.copy(q.w).addScaledVector(q.wn, 0.03); FX.light.visible = true; FX.flash.position.copy(FX.light.position); FX.flash.visible = true;
      snd('soldar', 0.8 / S.speed);
      const bead = new T.Mesh(new T.SphereGeometry(0.009, 10, 8), mats().cordon.clone()); bead.position.copy(q.p).addScaledVector(q.n, 0.002); bead.scale.set(1.3, 0.7, 1.3); bead.material.emissiveIntensity = 2.5; bead.castShadow = false; fxGroup(o).add(bead); S.fx.push(bead);
      let acc = 0;
      await wait(0.8, (k, raw) => {
        acc += 0.016 * S.speed;
        if (acc > 0.02) { acc = 0; emit(FX.sparks, FX.light.position, q.wn.clone().multiplyScalar(0.5).add(V3(0, 0.5, 0)), 7, 1.6, 1.4, 0.45); if (Math.random() < 0.3) smokeAt(FX.light.position); }
        // la pinza recorre el cordón
        const a = w.arms.R; a.cur.addScaledVector(side, Math.sin(raw * 7) * 0.0012); pose();
      });
      FX.light.visible = false; FX.flash.visible = false;
      track(E.tween(1.8, (k) => { bead.material.emissiveIntensity = 2.5 * (1 - k); }, { ease: E.ease.out }));
    });
    await wait(0.3, (k) => { w.mask.rotation.x = lerp(0, -Math.PI * 0.62, E.ease.inOut(k)); pose(); }); w.maskDown = false; w.mask.visible = false;
    mach.visible = false;
  }
  /* --- atornillar / herrajes / escuadras: el tornillo entra girando con el atornillador */
  async function atornillar(o, act, small) {
    fxInit();
    const allen = act.t === 'allen';
    const rScrew = small ? 0.003 : 0.0035, lScrew = allen ? 0.016 : small ? 0.016 : 0.05;
    await perPoint(o, act, allen ? 'allen' : 'taladro', ICOOF[act.t], async (q) => {
      const screw = new T.Group();
      const sh = cyl(rScrew, rScrew * 0.8, lScrew, mats().tornillo, 8); sh.position.y = -lScrew / 2; screw.add(sh);
      const hd = cyl(allen ? 0.005 : rScrew * 2, allen ? 0.005 : rScrew * 2, 0.003, mats().tornillo, allen ? 6 : 12); hd.position.y = 0.0015; screw.add(hd);
      screw.position.copy(q.p).addScaledVector(q.n, lScrew * 0.9); screw.quaternion.setFromUnitVectors(DOWN, q.dir.clone()); screw.traverse((m) => { if (m.isMesh) m.castShadow = false; });
      fxGroup(o).add(screw); S.fx.push(screw);
      await reach('R', q.w.clone().addScaledVector(q.wn, lScrew * 0.9 + 0.003), q.wd, 0.38);
      await reach('L', q.w.clone().addScaledVector(q.wn, 0.02).add(V3(0, 0.09, 0)), V3(0, -1, 0), 0.2, true);
      snd(allen ? 'rosca' : 'taladro', 0.45 / S.speed);
      const a = AR.worker().arms.R, from = a.cur.clone(), to = from.clone().addScaledVector(q.wd, lScrew * 0.9), bit = TOOLS.taladro && TOOLS.taladro.getObjectByName('bit');
      const t0 = screw.position.clone(), t1 = q.p.clone().addScaledVector(q.n, 0.0005);
      await wait(0.45, (k) => { const e = E.ease.inOut(k); a.cur.lerpVectors(from, to, e); screw.position.lerpVectors(t0, t1, e); screw.rotateY(0.5); if (allen) a.hand.rotateY(0.35); pose(); });
      if (allen) a.hand.quaternion.identity();
      await sleep(0.06);
    });
  }
  /* --- anclar: perforar el muro con el taladro (polvo), golpear el chazo y atornillar */
  async function anclar(o, act) {
    fxInit();
    await perPoint(o, act, 'taladro', 'martillo', async (q) => {
      await reach('R', q.w.clone().addScaledVector(q.wn, 0.06), q.wd, 0.4);
      snd('taladro', 0.7 / S.speed);
      const a = AR.worker().arms.R, from = a.cur.clone(), to = from.clone().addScaledVector(q.wd, 0.05);
      await wait(0.7, (k, raw) => { a.cur.lerpVectors(from, to, E.ease.inOut(k)); if (Math.random() < 0.5) emit(FX.dust, q.w.clone().addScaledVector(q.wn, 0.01), q.wn.clone().multiplyScalar(0.3).add(V3(0, 0.2, 0)), 3, 0.5, 0.8, 0.6, -2); a.cur.x += Math.sin(raw * 60) * 0.001; pose(); });
      equip('martillo');
      await reach('R', q.w.clone().addScaledVector(q.wn, 0.1), q.wd, 0.3);
      for (let i = 0; i < 3; i++) {
        const f0 = a.cur.clone(), f1 = f0.clone().addScaledVector(q.wd, 0.07);
        await wait(0.14, (k) => { a.cur.lerpVectors(f0, f1, k < 0.5 ? E.ease.in(k * 2) : 1 - E.ease.out((k - 0.5) * 2)); pose(); });
        snd('martillo', 0.1);
      }
      equip('taladro');
    });
  }
  /* --- roscar los niveladores: la mano gira cada pata */
  async function roscar(o, act) {
    await perPoint(o, act, null, 'allen', async (q) => {
      await reach('R', q.w, V3(0, -1, 0), 0.35, true);
      snd('rosca', 0.4);
      const a = AR.worker().arms.R;
      await wait(0.4, (k) => { a.hand.rotation.y = Math.sin(k * Math.PI * 3) * 0.9; pose(); });
      a.hand.rotation.y = 0;
    });
  }
  /* --- encolar: un cordón en zigzag sobre la pieza de abajo, que crece con el recorrido de la mano */
  async function encolar(o, act) {
    const w = AR.worker(), mins = minutes(act);
    equip('cola');
    let i = 0;
    for (const ct of act.cts) {
      // la cola va sobre la pieza de abajo, la que ya está puesta
      const under = act.parts.indexOf(ct.thin) >= 0 ? ct.other : ct.thin;
      const ub = boxOf(under), y = ub.max.y + 0.001;
      const x0 = Math.max(ub.min.x, ct.c.x - ct.len / 2), x1 = Math.min(ub.max.x, ct.c.x + ct.len / 2), z0 = ub.min.z + 0.03, z1 = ub.max.z - 0.03;
      const long = (x1 - x0) >= (z1 - z0), n = clamp(Math.round((long ? x1 - x0 : z1 - z0) / 0.14), 2, 12);
      const path = [];
      for (let k = 0; k <= n; k++) { const t = k / n; path.push(long ? V3(lerp(x0 + 0.03, x1 - 0.03, t), y, k % 2 ? z1 : z0) : V3(k % 2 ? x1 - 0.03 : x0 + 0.03, y, lerp(z0, z1, t))); }
      const curve = new T.CatmullRomCurve3(path, false, 'catmullrom', 0.2), segs = 24 * n;
      const bead = new T.Mesh(new T.TubeGeometry(curve, segs, 0.0045, 6, false), mats().cola); bead.geometry.setDrawRange(0, 0); bead.castShadow = false; bead.userData.own = true;
      fxGroup(o).add(bead); S.fx.push(bead);
      const pts = path.map((p) => ({ w: toWorld(o, p) }));
      const st = standFor(o, pts); await moveTo(st); camOp(o, pts, st);
      setOp('encolar', LBL.encolar + ' ' + low(act.what), i, act.cts.length, mins);
      await reach('R', pts[0].w.clone(), V3(0, -1, 0), 0.4);
      const total = bead.geometry.index ? bead.geometry.index.count : bead.geometry.attributes.position.count;
      const a = w.arms.R, len = curve.getLength(), dur = clamp(len / 0.9, 0.8, 3.2);
      await wait(dur, (k) => { const p = curve.getPointAt(k); a.cur.copy(toWorld(o, p)).add(V3(0, 0.06, 0)); w.look = a.cur; bead.geometry.setDrawRange(0, Math.floor(total * k)); pose(); });
      bead.geometry.setDrawRange(0, total);
      i++;
    }
    release('R'); if (S.stats) S.stats.encolar = (S.stats.encolar || 0) + act.cts.length;
  }
  /* --- prensar: dos sargentos aprietan la capa durante un momento */
  async function prensar(o, act) {
    const ct = act.cts[0], top = act.parts[0], tb = boxOf(top);
    const pts = [V3(tb.min.x + 0.08, tb.max.y, tb.max.z), V3(tb.max.x - 0.08, tb.max.y, tb.max.z)];
    const under = boxOf(ct.thin === top ? ct.other : ct.thin);
    setOp('prensa', LBL.prensar + ' ' + low(act.what), 0, 1, 0);
    const wp = pts.map((p) => ({ w: toWorld(o, p) }));
    const st = standFor(o, wp); await moveTo(st);
    const cl = [];
    for (const p of pts) {
      const g = prop('sargento').clone(); g.visible = true; g.position.set(p.x, under.min.y - 0.02, p.z + 0.03); g.rotation.y = Math.PI / 2; g.scale.set(1, (tb.max.y - under.min.y + 0.06) / 0.26, 1);
      fxGroup(o).add(g); S.fx.push(g); cl.push(g);
      await reach('R', toWorld(o, V3(p.x, p.y + 0.02, p.z)), V3(0, -1, 0), 0.4, true);
      snd('clic', 0.05);
      const a = AR.worker().arms.R; await wait(0.3, (k) => { a.hand.rotation.y = Math.sin(k * Math.PI * 2) * 0.8; pose(); }); a.hand.rotation.y = 0;
    }
    release('R'); await sleep(0.5);
    cl.forEach((g) => { g.visible = false; });
  }
  /* --- conectar la luz: la mano pasa a lo largo de la tira y la luz enciende con un parpadeo */
  async function conectar(o, act) {
    const mins = minutes(act), offs = [];
    act.parts.forEach((p) => { if (p.material && (p.material.name === 'led' || p.material.name === 'ledFrio' || p.material.name === 'ledBlanco')) { offs.push([p, p.material]); p.material = mats().ledOff; } });
    equip(null);
    let i = 0;
    for (const p of act.parts) {
      const bb = boxOf(p), s = size(bb), c = bb.getCenter(new T.Vector3()), lx = s.x >= s.z ? 'x' : 'z';
      const a0 = c.clone(), a1 = c.clone(); a0[lx] -= s[lx] / 2 - 0.02; a1[lx] += s[lx] / 2 - 0.02;
      const w0 = toWorld(o, a0), w1 = toWorld(o, a1), pts = [{ w: w0 }, { w: w1 }];
      const st = standFor(o, pts); await moveTo(st); camOp(o, pts, st);
      setOp('conectar', LBL.conectar + ' · ' + low(act.what), i, act.parts.length, mins);
      const isStrip = s[lx] > 0.25;
      await reach('R', w0.clone().add(V3(0, 0.02, 0)), V3(0, -1, 0), 0.4, true);
      if (isStrip) { const a = AR.worker().arms.R; await wait(clamp(s[lx] / 0.6, 0.4, 1.6), (k) => { a.cur.lerpVectors(w0, w1, k).y += 0.02; AR.worker().look = a.cur; pose(); }); }
      else { await wait(0.35, () => pose()); }
      const pair = offs.find((x) => x[0] === p);
      if (pair) {
        snd('clic', 0.05);
        await wait(0.5, (k) => { p.material = (Math.floor(k * 9) % 3 === 1 && k < 0.8) ? mats().ledOff : pair[1]; });
        p.material = pair[1];
      }
      i++;
    }
    offs.forEach((x) => { x[0].material = x[1]; });
    release('R'); if (S.stats) S.stats.conectar = (S.stats.conectar || 0) + act.parts.length;
  }
  /* --- asentar el vidrio: ventosas en las dos manos, el paño baja despacio */
  async function asentar(o, act) {
    const mins = minutes(act);
    equip('ventosa'); equip('ventosa', true);
    let i = 0;
    for (const p of act.parts) {
      const bb = boxOf(p), s = size(bb), c = bb.getCenter(new T.Vector3());
      const nrm = s.z <= s.x && s.z <= s.y ? V3(0, 0, 1) : s.x <= s.y ? V3(1, 0, 0) : V3(0, 1, 0);
      const lx = s.x >= s.y && s.x >= s.z ? 'x' : s.y >= s.z ? 'y' : 'z';
      const hl = c.clone(), hr = c.clone(); hl[lx] -= Math.min(0.3, s[lx] * 0.3); hr[lx] += Math.min(0.3, s[lx] * 0.3);
      hl.y = Math.min(hl.y, 1.5); hr.y = Math.min(hr.y, 1.5);
      const pts = [{ w: toWorld(o, hl) }, { w: toWorld(o, hr) }];
      const st = standFor(o, pts); await moveTo(st); camOp(o, pts, st);
      setOp('vidrio', LBL.asentar + ' · ' + low(act.what), i, act.parts.length, mins);
      const from = partStart(p); p.visible = false; p.position.copy(from);
      const w = AR.worker(), wn = toWorldDir(o, nrm), offL = hl.clone().sub(p.userData.home), offR = hr.clone().sub(p.userData.home);
      w.arms.L.target = w.arms.L.cur; w.arms.R.target = w.arms.R.cur;
      snd('vacio', 0.3);
      await wait(1.6, (k) => {
        const e = E.ease.inOut(k); p.visible = true; p.position.lerpVectors(from, p.userData.home, e);
        w.arms.L.cur.copy(toWorld(o, p.position.clone().add(offL))).addScaledVector(wn, 0.0); w.arms.R.cur.copy(toWorld(o, p.position.clone().add(offR)));
        w.arms.L.curDir.copy(wn).negate(); w.arms.R.curDir.copy(wn).negate(); w.look = toWorld(o, p.position.clone()); pose(); E.shadowDirty = true;
      });
      p.position.copy(p.userData.home);
      await sleep(0.3); snd('vacio', 0.2);
      i++;
    }
    release('L'); release('R'); equip(null); equip(null, true);
    if (S.stats) { S.stats.piezas += act.parts.length; S.stats.asentar = (S.stats.asentar || 0) + act.parts.length; }
  }
  /* --- retocar la laca: pistola, bruma y la pieza se aclara */
  async function retocar(o, act) {
    fxInit(); equip('pistola');
    const w = AR.worker(); w.resp.visible = true;
    const mins = minutes(act);
    let i = 0;
    for (const p of act.parts.slice(0, 4)) {
      const bb = boxOf(p), s = size(bb), c = bb.getCenter(new T.Vector3()); c.z = bb.max.z;
      const pts = [{ w: toWorld(o, c) }];
      const st = standFor(o, pts); await moveTo(st); camOp(o, pts, st);
      setOp('pistola', LBL.retocar + ' · ' + low(p.userData.name), i, Math.min(4, act.parts.length), mins);
      const a = AR.worker().arms.R, wn = toWorldDir(o, V3(0, 0, 1));
      const l0 = c.clone(), l1 = c.clone(); l0.x -= s.x * 0.4; l1.x += s.x * 0.4;
      await reach('R', toWorld(o, l0).addScaledVector(wn, 0.22), wn.clone().negate(), 0.4);
      snd('pistola', 1.2 / S.speed);
      await wait(1.2, (k) => { const t = k < 0.5 ? k * 2 : 2 - k * 2; a.cur.copy(toWorld(o, l0.clone().lerp(l1, t))).addScaledVector(wn, 0.22); emit(FX.mist, a.cur.clone().addScaledVector(wn, -0.05), wn.clone().negate(), 6, 1.2, 0.5, 0.35, -0.5); pose(); });
      i++;
    }
    release('R'); w.resp.visible = false; if (S.stats) S.stats.retocar = (S.stats.retocar || 0) + act.parts.length;
  }
  /* --- revisión final: el operario se aparta, mide y aprueba */
  async function revisar(o) {
    const w = AR.worker(), bb = o.box || new T.Box3().setFromObject(o.group), c = bb.getCenter(new T.Vector3()), s = bb.getSize(new T.Vector3());
    const f = frontDir(o), pos = inRoom(c.clone().addScaledVector(f, Math.max(1.0, s.length() * 0.45))); pos.y = 0;
    setOp('revisar', 'Revisando escuadra, nivel y acabado', 0, 1, L.nota2 && L.nota2.tiempos.inspFinal ? L.nota2.tiempos.inspFinal.min : 20);
    equip('cinta'); equip(null, true);
    await moveTo({ pos, face: Math.atan2(-f.x, -f.z), stool: 0, crouch: 0 });
    camWhole(1.2);
    w.look = c.clone();
    await reach('R', pos.clone().add(V3(0, 1.25, 0)).addScaledVector(f, -0.3), V3(0, -0.5, -1), 0.5, true);
    await wait(1.0, (k) => { w.look = c.clone().add(V3(Math.sin(k * 6) * s.x * 0.4, Math.sin(k * 4) * s.y * 0.3, 0)); pose(); });
    snd('listo', 0.6);
    release('R'); equip(null);
    await idle(0.5);
  }

  /* ------------------------------------------------------------ ejecución */
  const RUN = { soldar, atornillar: (o, a) => atornillar(o, a, false), herraje: (o, a) => atornillar(o, a, true), allen: (o, a) => atornillar(o, a, true), anclar, roscar, encolar, prensar, conectar, asentar, retocar, colocar };
  function setStepState(k) {
    // deja las piezas de los pasos anteriores puestas y esconde las que faltan
    const it = S.it, A = it.asm;
    it.insts.forEach((o) => {
      if (A) { const f = k >= A.step ? 0 : 1; o.group.position.copy(o.home).addScaledVector(offW(o), f); }
      o.parts.forEach((p) => { const u = p.userData; if (u.step < k || (o !== S.inst && u.step === k)) { p.visible = true; p.position.copy(u.home); } else if (u.step >= k) p.visible = false; });
    });
  }
  function offW(o) { if (!o._off) { const a = o.item.asm; o._off = a ? V3(a.off[0], a.off[1], a.off[2]).applyAxisAngle(UP, o.group.rotation.y) : new T.Vector3(); } return o._off; }
  async function runStep(k) {
    const it = S.it, o = S.inst, seq = it._seq, gen = S.gen;
    S.step = k; S.done = false; H.state.step = k; H.state.done = false;
    setStepState(k);
    H.updateStepper(); H.refreshEdges(); E.shadowDirty = true; E.invalidate();
    const acts = plan(it, o, k);
    const A = it.asm;
    if (A && k === A.step) {
      // el módulo entra deslizándose a su sitio; el operario lo acompaña
      setOp('mano', 'Entrando el módulo a su sitio', 0, 1, 0);
      const w = AR.worker(), f = frontDir(o);
      const st = { pos: o.home.clone().addScaledVector(offW(o), 1).addScaledVector(f, 0.6), face: Math.atan2(-f.x, -f.z), stool: 0, crouch: 0 }; st.pos.y = 0; freeSpot(st.pos, obstacles(), st.pos.clone());
      await moveTo(st);
      const p0 = w.root.position.clone(), p1 = p0.clone().addScaledVector(offW(o), -1);
      w.arms.L.target = w.arms.L.cur; w.arms.R.target = w.arms.R.cur;
      await wait(1.1, (k2) => { const e = E.ease.inOut(k2); it.insts.forEach((oi) => { oi.group.position.copy(oi.home).addScaledVector(offW(oi), 1 - e); }); w.root.position.lerpVectors(p0, p1, e); const c = toWorld(o, o.box ? o.box.getCenter(new T.Vector3()).sub(o.group.position) : V3(0, 0.9, 0)); w.arms.L.cur.copy(c).add(V3(-0.2, 0, 0)); w.arms.R.cur.copy(c).add(V3(0.2, 0, 0)); w.look = c; pose(); E.shadowDirty = true; });
      release('L'); release('R');
    }
    camWhole(1.0);
    for (const act of acts) {
      if (gen !== S.gen) throw ABORT;
      const fn = RUN[act.t]; if (!fn) continue;
      S.stats.min += minutes(act);
      await fn(o, act);
      H.refreshEdges();
    }
    // lo que no tuvo acción propia queda puesto
    o.parts.forEach((p) => { if (p.userData.step === k) { p.visible = true; p.position.copy(p.userData.home); } });
    await idle(0.25);
    if (k === seq.length - 1) { await revisar(o); S.done = true; H.state.done = true; finish(); return; }
    if (S.playing) { await sleep(0.5); return runStep(k + 1); }
  }
  function finish() {
    hideProps(); S.playing = false; H.state.playing = false;
    H.showDecor(S.it, true, true); H.updateStepper();
    const st = S.stats, parts = [];
    if (st.soldar) parts.push(st.soldar + ' puntos de soldadura'); if (st.atornillar || st.herraje || st.allen) parts.push((st.atornillar || 0) + (st.herraje || 0) + (st.allen || 0) + ' tornillos'); if (st.anclar) parts.push(st.anclar + ' anclajes'); if (st.encolar) parts.push(st.encolar + ' encolados'); if (st.conectar) parts.push(st.conectar + ' conexiones');
    setOp('revisar', 'Mueble armado: ' + st.piezas + ' piezas' + (parts.length ? ' · ' + parts.join(' · ') : ''), 0, 1, st.min);
    const gen = S.gen;
    track(E.tween(0.01, () => {}, { delay: 2.6, done: () => { if (gen === S.gen && S.on) { AR.stop(); if (H.afterFinish) H.afterFinish(); } } }));
  }

  /* ------------------------------------------------------------ API */
  AR.available = () => !E.reduced;
  AR.init = function (hooks) { H = hooks; };
  AR.play = function (it, inst, from, src) {
    AR.stop(true);
    const seq = src.seq; if (!seq || !seq.length) return false;
    it._seq = seq; it._src = src;
    S.on = true; S.it = it; S.inst = inst; S.playing = true; S.paused = false; S.done = false; S.stats = { piezas: 0, min: 0 };
    const w = AR.worker(); w.root.visible = true;
    // el operario empieza frente al mueble, a la derecha, junto a su carro de herramientas
    const f = frontDir(inst), side = V3(-f.z, 0, f.x), c = inst.box ? inst.box.getCenter(new T.Vector3()) : inst.home.clone();
    w.root.position.copy(c).addScaledVector(f, 1.3).addScaledVector(side, -0.9); inRoom(w.root.position); freeSpot(w.root.position, obstacles(), c); w.root.position.y = 0; w.facing = Math.atan2(-f.x, -f.z); w.root.rotation.y = w.facing; w.crouch = 0; w.stool = 0; w.walking = false; w.look = null; w.maskDown = false; w.mask.visible = false;
    release('L'); release('R'); equip(null); equip(null, true); pose();
    const wp = w.root.position, carro = freeSpot(inRoom(c.clone().addScaledVector(f, 1.55).addScaledVector(side, -1.55).setY(0), 0.45), obstacles(0.42).concat([{ x0: wp.x - 0.7, z0: wp.z - 0.7, x1: wp.x + 0.7, z1: wp.z + 0.7 }]), wp);
    showProp('carro', carro, w.facing + Math.PI / 2);
    const gen = ++S.gen;
    const stepper = $('#st-op'); if (stepper) stepper.hidden = false;
    runStep(from || 0).catch((e) => { if (e !== ABORT) console.error(e); });
    void gen;
    return true;
  };
  AR.goto = function (k, anim) {
    if (!S.on) return;
    S.gen++; stopTweens(); clearFx(); S.paused = false;
    const w = AR.worker(); release('L'); release('R'); w.maskDown = false; w.mask.visible = false; w.look = null; w.walking = false; pose();
    S.playing = H.state.playing;
    if (!anim) { S.step = k; setStepState(k + 1); H.state.step = k; H.updateStepper(); H.refreshEdges(); E.invalidate(); return; }
    runStep(k).catch((e) => { if (e !== ABORT) console.error(e); });
  };
  AR.pause = function () { S.paused = true; S.playing = false; };
  AR.resume = function () { S.playing = true; if (S.paused) { S.paused = false; const r = S.pauseP; S.pauseP = null; if (r) r(); } };
  AR.setSpeed = function (v) { S.speed = v; };
  AR.setFollow = function (v) { S.follow = v; };
  AR.stop = function (quiet) {
    if (!S.on && !quiet) return;
    S.gen++; stopTweens(); clearFx(); hideProps(); S.paused = false; S.pauseP = null;
    if (W) { W.root.visible = false; W.maskDown = false; W.mask.visible = false; W.resp.visible = false; }
    if (S.it) S.it.insts.forEach((o) => o.parts.forEach((p) => { if (p.userData.mat0 && p.material.name === 'op_ledOff') p.material = p.userData.mat0; }));
    S.on = false; S.playing = false; S.it = null; S.inst = null; S.op = null;
    const el = $('#st-op'); if (el) el.hidden = true;
    E.shadowDirty = true; E.invalidate();
  };
  AR.plan = plan; AR.classOf = classOf; AR.minutes = minutes; AR._fx = FX; AR._dbg = { emit, smokeAt, fxInit, mats, pose, equip };
})();
