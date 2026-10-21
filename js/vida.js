/* ============================================================================
   VIDA DEL LOCAL — gente en la tienda, en las tres versiones:
   · clientes que llegan por el pasillo del centro comercial, entran, recorren
     el mobiliario, miran y tocan los productos, les toman fotos, preguntan en
     la mesa de atención y se van (otros solo pasan y miran la vitrina);
   · una dependienta que vigila las impresoras, ordena la mesa y atiende a
     quien pregunta;
   · un diseñador que trabaja en su MacBook Pro en la barra, toma café y mira
     quién entra.

   Usa el esqueleto, la pose y la navegación de armado.js (mismo rig que el
   operario). Todo sale de los muebles de la versión activa: la barra con sus
   taburetes, el mesón con las impresoras, los exhibidores con producto.
   Nadie atraviesa muebles ni personas: las rutas se calculan con A* y, si
   alguien se cruza, uno espera o rodea.
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D, T = THREE, E = L.engine, AR = L.armado;
  const V = (L.vida = {});
  const V3 = (x, y, z) => new T.Vector3(x, y, z), clamp = E.clamp, lerp = E.lerp, UP = V3(0, 1, 0);
  const rnd = (a, b) => a + Math.random() * (b - a), pick = (arr) => arr[Math.floor(Math.random() * arr.length)], chance = (p) => Math.random() < p;
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const S = { on: false, paused: false, suspended: false, speed: 1, gen: 0, actors: [], timers: [], t: 0, uid: 0, queue: [], max: 3, staff: null, dev: null, spawnT: 0, hooked: false, booted: false };
  V.state = S;
  const ABORT = { abort: true };

  /* ------------------------------------------------------------ reloj propio: se pausa con el armado y con la ventana oculta */
  function wait(sec) { const gen = S.gen; return new Promise((res) => S.timers.push({ left: sec, res, gen })).then(() => { if (gen !== S.gen) throw ABORT; }); }
  function anim(sec, fn) { const gen = S.gen; return new Promise((res) => S.timers.push({ left: sec, dur: sec, fn, res, gen })).then(() => { if (gen !== S.gen) throw ABORT; }); }
  function until(fn) { const gen = S.gen; return new Promise((res) => S.timers.push({ until: fn, res, gen })).then(() => { if (gen !== S.gen) throw ABORT; }); }
  /* ¿algo tapa la escena? (las Notas, una ventana como el presupuesto, el plano 2D, la pestaña oculta) */
  function covered() {
    if (document.hidden || document.body.classList.contains('n1-open')) return true;
    const m = document.getElementById('modal'); if (m && !m.hidden && !m.classList.contains('is-min')) return true;
    const st = L.api && L.api.state; return !!(st && st.planOpen);
  }
  /* mientras hay gente a la vista, pide un cuadro nuevo en cada fotograma; si algo tapa la escena, todo se congela */
  function tick() { requestAnimationFrame(tick); if (S.on && !S.suspended && !S.paused && S.actors.length && !covered()) E.invalidate(1); }
  function update(dt) {
    if (!S.on || S.paused || S.suspended || covered()) return;
    dt = Math.min(dt, 0.12) * (S.speed || 1); S.t += dt;
    for (let i = S.timers.length - 1; i >= 0; i--) {
      const tm = S.timers[i];
      if (tm.gen !== S.gen) { S.timers.splice(i, 1); tm.res(); continue; }
      if (tm.until) { let d = false; try { d = tm.until(dt); } catch (e) { d = true; console.error(e); } if (d) { S.timers.splice(i, 1); tm.res(); } continue; }
      tm.left -= dt;
      if (tm.fn) { try { tm.fn(clamp(1 - tm.left / tm.dur, 0, 1), dt); } catch (e) { console.error(e); } }
      if (tm.left <= 0) { S.timers.splice(i, 1); tm.res(); }
    }
    for (let i = 0; i < S.actors.length; i++) { const a = S.actors[i]; if (a.frame) a.frame(dt); if (a.bubble && a.bubble.visible) placeBubble(a); }
    spawner(dt);
    E.shadowDirty = true;
  }

  /* ------------------------------------------------------------ props: MacBook Pro, taza, teléfono y globo de habla */
  function screenTexture() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 332; const g = c.getContext('2d');
    g.fillStyle = '#1c1c20'; g.fillRect(0, 0, 512, 332);
    g.fillStyle = '#26262b'; g.fillRect(0, 0, 512, 26); g.fillRect(0, 26, 54, 306); g.fillRect(392, 26, 120, 306);
    g.fillStyle = '#ff9f0a'; g.fillRect(12, 9, 8, 8); g.fillStyle = '#e8e8ec'; g.font = '600 12px sans-serif'; g.fillText('BlackForge · laminado · pieza-del-dia.3mf', 30, 18);
    for (let i = 0; i < 7; i++) { g.fillStyle = i === 2 ? '#ff9f0a' : '#44444b'; g.fillRect(16, 44 + i * 36, 22, 22); }
    // rejilla de la cama y el modelo en capas
    g.strokeStyle = '#2f2f36'; g.lineWidth = 1; for (let x = 70; x < 380; x += 24) { g.beginPath(); g.moveTo(x, 60); g.lineTo(x, 300); g.stroke(); } for (let y = 60; y < 300; y += 24) { g.beginPath(); g.moveTo(70, y); g.lineTo(380, y); g.stroke(); }
    g.strokeStyle = '#ffb340'; g.lineWidth = 1.5; for (let i = 0; i < 26; i++) { const y = 275 - i * 7, w = 120 - Math.abs(i - 10) * 4; g.beginPath(); g.ellipse(225, y, w, w * 0.32, 0, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#9a9aa3'; g.font = '11px sans-serif'; ['Capas  612', 'Altura  0,2 mm', 'Relleno  15 %', 'Tiempo  4 h 12 min', 'Filamento  38 g', 'PLA  215 °C'].forEach((t, i) => g.fillText(t, 404, 56 + i * 24));
    g.fillStyle = '#ff9f0a'; g.fillRect(404, 220, 96, 22); g.fillStyle = '#141416'; g.font = '600 11px sans-serif'; g.fillText('Laminar', 428, 235);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function macbook() {
    const g = new T.Group(); g.name = 'macbook';
    const alu = AR.cloth(0xc2c5cb, 0.35, { metalness: 0.75 }), dark = AR.cloth(0x1b1b1e, 0.5), keys = AR.cloth(0x2a2a2e, 0.6);
    const add = (geo, mat, x, y, z, parent) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || g).add(m); return m; };
    add(new T.BoxGeometry(0.312, 0.012, 0.221), alu, 0, 0.006, 0);
    add(new T.BoxGeometry(0.27, 0.003, 0.105), keys, 0, 0.0125, -0.03);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) add(new T.BoxGeometry(0.016, 0.002, 0.016), dark, -0.124 + c * 0.019, 0.0145, -0.072 + r * 0.02);
    add(new T.BoxGeometry(0.13, 0.002, 0.075), AR.cloth(0xb3b6bc, 0.3, { metalness: 0.6 }), 0, 0.0125, 0.062);
    const lid = new T.Group(); lid.position.set(0, 0.012, -0.108); lid.rotation.x = -0.3; g.add(lid);
    add(new T.BoxGeometry(0.312, 0.215, 0.007), alu, 0, 0.107, 0, lid);
    const scr = add(new T.BoxGeometry(0.292, 0.19, 0.002), new T.MeshStandardMaterial({ color: 0x000000, roughness: 0.25, emissive: 0xffffff, emissiveMap: screenTexture(), emissiveIntensity: 1.1 }), 0, 0.11, 0.0045, lid);
    scr.castShadow = false; scr.material.name = 'pantallaMac';
    add(new T.BoxGeometry(0.312, 0.215, 0.001), dark, 0, 0.107, 0.0038, lid).castShadow = false;
    scr.renderOrder = 1;
    g.userData.screen = V3(0, 0.2, -0.06);                                              // dónde mirar (local)
    return g;
  }
  function mug() {
    const g = new T.Group(); const m = AR.cloth(0xf2efe8, 0.5), cafe = AR.cloth(0x3a2416, 0.4);
    const c = new T.Mesh(new T.CylinderGeometry(0.038, 0.034, 0.095, 16), m); c.position.y = 0.0475; c.castShadow = true; g.add(c);
    const top = new T.Mesh(new T.CylinderGeometry(0.033, 0.033, 0.004, 16), cafe); top.position.y = 0.09; g.add(top);
    const h = new T.Mesh(new T.TorusGeometry(0.024, 0.006, 8, 16, Math.PI), m); h.position.set(0.04, 0.05, 0); h.rotation.z = -Math.PI / 2; g.add(h);
    return g;
  }
  function phone() {
    const g = new T.Group(); const m = new T.Mesh(new T.BoxGeometry(0.072, 0.15, 0.008), AR.cloth(0x1c1c1f, 0.4, { metalness: 0.5 })); g.add(m);
    const s = new T.Mesh(new T.BoxGeometry(0.066, 0.142, 0.001), new T.MeshStandardMaterial({ color: 0x0a0a0c, emissive: 0x7fa6d8, emissiveIntensity: 0.9, roughness: 0.3 })); s.position.z = 0.0045; g.add(s);
    return g;
  }
  let bubbleTex = null;
  function bubble() {
    if (!bubbleTex) {
      const c = document.createElement('canvas'); c.width = 128; c.height = 96; const g = c.getContext('2d');
      g.fillStyle = 'rgba(255,255,255,0.96)'; g.beginPath(); g.roundRect(8, 8, 112, 60, 22); g.fill(); g.beginPath(); g.moveTo(44, 64); g.lineTo(34, 86); g.lineTo(62, 66); g.fill();
      g.fillStyle = '#2a2a2e'; [40, 64, 88].forEach((x) => { g.beginPath(); g.arc(x, 38, 6, 0, Math.PI * 2); g.fill(); });
      bubbleTex = new T.CanvasTexture(c); bubbleTex.colorSpace = T.SRGBColorSpace;
    }
    const sp = new T.Sprite(new T.SpriteMaterial({ map: bubbleTex, transparent: true, depthWrite: false, opacity: 0.95 })); sp.scale.set(0.26, 0.195, 1); sp.center.set(0.25, 0); sp.visible = false; sp.renderOrder = 5;
    return sp;
  }
  function placeBubble(a) { const p = a.w.head.getWorldPosition(new T.Vector3()); a.bubble.position.set(p.x, p.y + 0.36, p.z); }
  function talkBubble(a, on) { if (!a.bubble) { a.bubble = bubble(); E.scene.add(a.bubble); } a.bubble.visible = !!on; if (on) placeBubble(a); }

  /* productos impresos que el cliente toma del exhibidor, y la bolsa de papel con la marca */
  const PRODUCT_COL = [0xff9f0a, 0xf2efe8, 0x3a7bd5, 0x2a2a2e, 0xd94f3d, 0x6bbf8a];
  function product() {
    const g = new T.Group(); g.name = 'producto'; const mat = AR.cloth(pick(PRODUCT_COL), 0.45);
    const k = Math.floor(Math.random() * 3); let m;
    if (k === 0) { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new T.Vector2(0.03 + 0.025 * Math.sin(t * Math.PI * 1.4) + (t < 0.05 ? -0.03 : 0), t * 0.12)); } m = new T.Mesh(new T.LatheGeometry(pts, 18), mat); }   // jarrón en capas
    else if (k === 1) { m = new T.Mesh(new T.TorusKnotGeometry(0.03, 0.011, 48, 8), mat); m.position.y = 0.045; }                                          // nudo
    else { m = new T.Mesh(new T.IcosahedronGeometry(0.045, 0), mat); m.position.y = 0.045; }                                                                // poliedro
    m.castShadow = true; g.add(m); return g;
  }
  function paperBag() {
    const g = new T.Group(); g.name = 'bolsa'; const kraft = AR.cloth(0xc8a26e, 0.95), dark = AR.cloth(0x1a1a1c, 0.6), acc = AR.cloth(0xff9f0a, 0.6);
    const body = new T.Mesh(new T.BoxGeometry(0.2, 0.24, 0.09), kraft); body.position.y = -0.17; body.castShadow = true; g.add(body);
    const logo = new T.Mesh(new T.BoxGeometry(0.07, 0.07, 0.002), dark); logo.position.set(0, -0.16, 0.046); g.add(logo);
    const dot = new T.Mesh(new T.BoxGeometry(0.03, 0.03, 0.002), acc); dot.position.set(0, -0.16, 0.0475); g.add(dot);
    [-1, 1].forEach((s) => { const h = new T.Mesh(new T.TorusGeometry(0.032, 0.003, 6, 14, Math.PI), dark); h.position.set(0, -0.05, s * 0.03); g.add(h); });
    return g;                                                                                   // el origen está en las asas: cuelga de la mano
  }
  function terminal() {
    const g = new T.Group(); g.name = 'datáfono';
    const b = new T.Mesh(new T.BoxGeometry(0.075, 0.16, 0.03), AR.cloth(0x1c1c1f, 0.5)); b.position.y = -0.06; g.add(b);
    const s = new T.Mesh(new T.BoxGeometry(0.06, 0.05, 0.002), new T.MeshStandardMaterial({ color: 0x050506, emissive: 0x9fd7a8, emissiveIntensity: 0.8 })); s.position.set(0, -0.02, 0.016); g.add(s);
    return g;
  }
  /* ------------------------------------------------------------ personas */
  function actor(opt) {
    const w = AR.person(opt); AR.bake(w.root); w.root.visible = true;
    const a = { w, id: ++S.uid, kind: opt.kind || 'cliente', pos: w.root.position, frame: null, bubble: null, speed: opt.speed || 1.0, name: opt.name || opt.kind, phone: null, walking: false, done: false, attended: false, carry: null, hold: false, props: [] };
    S.actors.push(a);
    return a;
  }
  function remove(a) {
    const i = S.actors.indexOf(a); if (i >= 0) S.actors.splice(i, 1);
    E.scene.remove(a.w.root); a.w.root.traverse((m) => { if (m.isMesh && m.geometry) m.geometry.dispose(); });
    if (a.bubble) { E.scene.remove(a.bubble); a.bubble.material.dispose(); }
    a.props.forEach((g) => { if (g.parent) g.parent.remove(g); });
    const q = S.queue.indexOf(a); if (q >= 0) S.queue.splice(q, 1);
    E.shadowDirty = true;
  }
  const front = (a, dx, dy, dz) => a.pos.clone().add(V3(Math.sin(a.w.facing) * dz + Math.cos(a.w.facing) * dx, dy, Math.cos(a.w.facing) * dz - Math.sin(a.w.facing) * dx));
  /* lo que lleva en la mano derecha: un producto delante, a la altura de la cintura, o la bolsa colgando al costado */
  function holdCarry(a) {
    const arm = a.w.arms.R; arm.target = arm.cur;
    if (a.carry.mode === 'front') { arm.cur.copy(front(a, -0.12, 1.0, 0.28)); arm.curDir.set(Math.sin(a.w.facing), -0.5, Math.cos(a.w.facing)).normalize(); }
    else { arm.cur.copy(front(a, -0.25, 0.8, 0.05)); arm.curDir.set(0, -1, 0); }
  }
  const pose = (a) => { if (a.carry && a.hold) holdCarry(a); AR.pose(a.w); };
  const faceTo = (a, p) => Math.atan2(p.x - a.pos.x, p.z - a.pos.z);
  function look(a, p) { a.w.look = p ? p.clone() : null; }
  /* pasa un objeto a la mano (o a la escena, en un punto del mundo) */
  function toHand(a, obj, side, off) { (side === 'L' ? a.w.arms.L : a.w.arms.R).tool.add(obj); obj.position.copy(off || V3(0, -0.06, 0.0)); obj.rotation.set(0, 0, 0); }
  function toWorld(obj, p, ry) { E.scene.add(obj); obj.position.copy(p); obj.rotation.set(0, ry || 0, 0); }

  /* --- obstáculos: los muebles (armado.js) y las demás personas */
  function obstaclesFor(a, m) {
    const list = AR.nav.obstacles(m);
    S.actors.forEach((o) => { if (o !== a) list.push({ x0: o.pos.x - 0.45, z0: o.pos.z - 0.45, x1: o.pos.x + 0.45, z1: o.pos.z + 0.45, person: o, top: 1.8, bottom: 0 }); });
    return list;
  }
  const inCorridor = (p) => p.z > E.floorRect[3] + 0.42;
  function route(a, from, to, obs) {
    let p = AR.nav.findPath(from, to, obs);
    if (!p) { const o2 = AR.nav.obstacles(AR.nav.RW); p = AR.nav.findPath(from, to, o2); }
    return p || [from];
  }
  /* punto del pasillo frente al vano, lejos de donde están o van los demás */
  function approach(x, me) {
    const z = E.floorRect[3] + 0.95;
    const busy = (p) => S.actors.some((o) => o !== me && (Math.hypot(o.pos.x - p.x, o.pos.z - p.z) < 0.7 || (o.goal && Math.hypot(o.goal.x - p.x, o.goal.z - p.z) < 0.7)));
    for (let i = 0; i < 12; i++) { const p = V3(clamp(x + (i ? (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.35 : 0), -1.6, 1.6), 0, z); if (!busy(p)) return p; }
    return V3(clamp(x, -1.6, 1.6), 0, z + 0.5);
  }

  async function turnTo(a, ang, quick) {
    const w = a.w, a0 = w.facing, d = Math.atan2(Math.sin(ang - a0), Math.cos(ang - a0));
    if (Math.abs(d) < 0.03) return;
    await anim(quick ? Math.min(0.35, 0.12 + Math.abs(d) * 0.15) : Math.min(0.6, 0.2 + Math.abs(d) * 0.25), (k) => { w.facing = a0 + d * E.ease.inOut(k); w.root.rotation.y = w.facing; pose(a); });
  }
  /* ¿con quién va a chocar? Quien está quieto delante estorba; con quien camina se predice el punto de máxima
     aproximación en el próximo segundo: si quedarían a menos de medio metro, cede el que llegó después */
  const velOf = (o) => (o.walking && o.w.walking ? V3(Math.sin(o.w.facing), 0, Math.cos(o.w.facing)).multiplyScalar(o.curSpeed || 1) : V3(0, 0, 0));
  function conflict(a, fwd, speed, nearEnd) {
    const myV = fwd.clone().multiplyScalar(speed);
    for (let i = 0; i < S.actors.length; i++) {
      const o = S.actors[i]; if (o === a) continue;
      const d = o.pos.clone().sub(a.pos); d.y = 0; const l = d.length(); if (l > 1.6) continue;
      if (l < 0.42 && o.id < a.id) return o;                                           // encimados: sigue el que llegó antes
      const ov = velOf(o), moving = ov.lengthSq() > 1e-4;
      if (!moving) {                                                                    // quieto (o cediendo el paso): ¿mi trayectoria pasa a menos de 46 cm?
        if (nearEnd) continue;
        const rv = myV.clone().negate(), vv = rv.lengthSq(); if (vv < 1e-4) continue;
        const tca = -d.dot(rv) / vv; if (tca > 0 && tca < 1.0 && d.clone().addScaledVector(rv, tca).length() < 0.5) return o;
        continue;
      }
      if (o.id > a.id) continue;
      const rv = ov.sub(myV), vv = rv.lengthSq(); if (vv < 1e-4) continue;
      const tca = -d.dot(rv) / vv; if (tca <= 0 || tca > 1.3) continue;
      if (d.clone().addScaledVector(rv, tca).length() < 0.56) return o;
    }
    return null;
  }
  /* regla dura: ningún paso deja a alguien a menos de 46 cm de otra persona (alejarse siempre se puede) */
  const PERSONAL = 0.46;
  function canMove(a, x, z) {
    for (let i = 0; i < S.actors.length; i++) {
      const o = S.actors[i]; if (o === a) continue;
      const dn = Math.hypot(o.pos.x - x, o.pos.z - z); if (dn >= PERSONAL) continue;
      if (dn < Math.hypot(o.pos.x - a.pos.x, o.pos.z - a.pos.z) - 1e-4) return false;
    }
    return true;
  }
  const at = (segs, s) => { let sg = segs[segs.length - 1]; for (let i = 0; i < segs.length; i++) if (s <= segs[i].s0 + segs[i].d) { sg = segs[i]; break; } const t = clamp((s - sg.s0) / sg.d, 0, 1); return { sg, x: sg.a.x + (sg.b.x - sg.a.x) * t, z: sg.a.z + (sg.b.z - sg.a.z) * t }; };
  /* camina por una ruta; si alguien se cruza cerca, espera (el de menor número sigue) o, si no se despeja, rodea */
  async function walkPath(a, path, opt) {
    opt = opt || {};
    const w = a.w;
    for (let tries = 0; tries < 3; tries++) {
      const segs = []; let total = 0;
      for (let i = 1; i < path.length; i++) { const d = path[i].distanceTo(path[i - 1]); if (d < 1e-3) continue; segs.push({ a: path[i - 1], b: path[i], d, s0: total, h: Math.atan2(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z) }); total += d; }
      if (!segs.length) return;
      a.goal = segs[segs.length - 1].b;
      await turnTo(a, segs[0].h, true);
      w.walking = true; a.walking = true; w.crouch = 0; w.sit = null; w.arms.L.target = null; if (!a.hold) w.arms.R.target = null;
      const speed = (opt.speed || a.speed) * 1.05; let s = 0, blockedT = 0, replan = false;
      await until((dt) => {
        // ¿alguien delante, a menos de 0.6 m?
        const fwd = V3(Math.sin(w.facing), 0, Math.cos(w.facing));
        if (s > total - 0.6) {                                                            // llegando: si hay alguien ya parado ahí, se queda un paso antes
          const goal = segs[segs.length - 1].b;
          const near = S.actors.find((o) => { if (o === a || o.walking) return false; const l = Math.hypot(o.pos.x - a.pos.x, o.pos.z - a.pos.z); return l < 0.6 && Math.hypot(o.pos.x - goal.x, o.pos.z - goal.z) < 0.47; });
          if (near) return true;
        }
        const other = conflict(a, fwd, speed, s > total - 0.5);
        if (other) {
          blockedT += dt; a.blocker = other;
          // si quien tiene el paso viene hacia mí, retrocedo por mi propia ruta (por donde vine está libre) hasta que pase
          if (other.id < a.id && velOf(other).lengthSq() > 1e-4 && blockedT > 0.35 && s > 0.02 && other.pos.distanceTo(a.pos) < 1.1) {
            const s2 = Math.max(0, s - dt * speed * 0.7), p = at(segs, s2);
            if (canMove(a, p.x, p.z)) {
              s = s2; w.root.position.set(p.x, 0, p.z);
              w.walking = true; a.curSpeed = -speed * 0.7; w.walk -= dt * speed * 0.7 / 0.62 * Math.PI * 2; pose(a);
              if (blockedT > 6) { replan = true; return true; }
              return false;
            }
          }
          w.walking = false; a.curSpeed = 0; w.walk = 0; pose(a);
          if (blockedT > (velOf(other).lengthSq() > 1e-4 ? 3.0 : 1.0 + (a.id % 3) * 0.35)) { replan = true; return true; }
          return false;
        }
        a.curSpeed = speed;
        const s2 = Math.min(total, s + dt * speed), p = at(segs, s2), sg = p.sg;
        if (!canMove(a, p.x, p.z)) {                                                      // el siguiente paso lo encimaría: espera
          blockedT += dt; w.walking = false; a.curSpeed = 0; w.walk = 0; pose(a);
          a.blocker = S.actors.filter((o) => o !== a).sort((x, y) => x.pos.distanceTo(a.pos) - y.pos.distanceTo(a.pos))[0] || null;
          if (blockedT > 1.2 + (a.id % 3) * 0.4) { replan = true; return true; }
          return false;
        }
        w.walking = true; blockedT = 0; s = s2; w.root.position.set(p.x, 0, p.z);
        const dh = Math.atan2(Math.sin(sg.h - w.facing), Math.cos(sg.h - w.facing)); w.facing += dh * Math.min(1, dt * 9); w.root.rotation.y = w.facing;
        w.walk += dt * speed / 0.62 * Math.PI * 2; pose(a);
        return s >= total;
      });
      w.walking = false; a.walking = false; w.walk = 0; pose(a);
      if (!replan) { a.goal = null; return; }
      const obs = obstaclesFor(a, AR.nav.RW), goal = path[path.length - 1];
      if (a.blocker && a.blocker.pos.distanceTo(a.pos) < 0.45) {                         // encimado: medio paso atrás, lejos del otro
        const away = a.pos.clone().sub(a.blocker.pos).setY(0); if (away.lengthSq() < 1e-4) away.set(Math.random() - 0.5, 0, Math.random() - 0.5); away.normalize();
        const back = AR.nav.freeSpot(a.pos.clone().addScaledVector(away, 0.5), AR.nav.obstacles(AR.nav.RW), a.pos);
        await walkPath(a, [a.pos.clone(), back], { speed: 0.6 });
      }
      const from = a.pos.clone(), start = AR.nav.blocked(obs, from.x, from.z) ? AR.nav.freeSpot(from.clone(), obs, goal) : from;
      if (inCorridor(from) && inCorridor(goal)) {
        // en el pasillo: se hace a un lado (del lado contrario a quien estorba) y sigue
        const h = goal.clone().sub(from).setY(0).normalize(), lat = V3(h.z, 0, -h.x), o = a.blocker ? a.blocker.pos.clone().sub(from) : lat;
        const sg = o.dot(lat) > 0 ? -1 : 1, side = from.clone().addScaledVector(lat, sg * 0.7).addScaledVector(h, 0.4); side.z = clamp(side.z, E.floorRect[3] + 0.75, E.floorRect[3] + 2.3);
        path = [from, side, goal];
      } else { path = route(a, start, goal, obs); if (start !== from) path.unshift(from); }
      a.blocker = null;
      await wait(rnd(0.2, 0.6));
    }
  }
  /* va a un punto (y = 0) rodeando muebles y personas; entre el pasillo y la sala pasa por el vano */
  async function walkTo(a, dest, opt) {
    opt = opt || {};
    const from = a.pos.clone(); from.y = 0; const to = dest.clone(); to.y = 0;
    const obs = obstaclesFor(a, AR.nav.RW);
    let path;
    if (inCorridor(from) && inCorridor(to)) path = [from, to];
    else if (inCorridor(from)) { const p = approach(to.x, a); path = [from, p].concat(route(a, p, AR.nav.freeSpot(to, obs, to), obs).slice(1)); }
    else if (inCorridor(to)) { const p = approach(from.x, a); const st = AR.nav.blocked(obs, from.x, from.z) ? AR.nav.freeSpot(from.clone(), obs, p) : from; path = route(a, st, p, obs); if (st !== from) path.unshift(from); if (path[path.length - 1] === p) path.push(to); }
    else { const st = AR.nav.blocked(obs, from.x, from.z) ? AR.nav.freeSpot(from.clone(), obs, to) : from; path = route(a, st, AR.nav.freeSpot(to, obs, to), obs); if (st !== from) path.unshift(from); }
    await walkPath(a, path, opt);
    if (opt.face !== undefined) await turnTo(a, opt.face);
  }
  /* lleva una mano a un punto del mundo y la deja ahí */
  async function reach(a, side, pt, dur, dir) {
    const w = a.w, arm = w.arms[side];
    if (side === 'R') a.hold = false;
    const from = arm.target ? arm.cur.clone() : arm.hand.getWorldPosition(new T.Vector3());
    const d0 = arm.curDir.clone(), d1 = (dir || V3(0, -1, 0)).clone().normalize();
    arm.target = arm.cur;
    await anim(dur || 0.6, (k) => { const e = E.ease.inOut(k); arm.cur.lerpVectors(from, pt, e); arm.curDir.lerpVectors(d0, d1, e).normalize(); pose(a); });
  }
  async function release(a, side, dur) {
    const w = a.w, arm = w.arms[side]; if (!arm.target) return;
    // vuelve suavemente al descanso (o a la postura de cargar lo que lleva) y suelta
    const from = arm.cur.clone(), d0 = arm.curDir.clone();
    let rest = a.pos.clone().add(V3(Math.cos(w.facing) * arm.side * 0.24, 0.82, -Math.sin(w.facing) * arm.side * 0.24)), dir = V3(0, -1, 0);
    if (side === 'R' && a.carry) { const h = a.hold; a.hold = true; holdCarry(a); rest = arm.cur.clone(); dir = arm.curDir.clone(); a.hold = h; arm.cur.copy(from); }
    await anim(dur || 0.45, (k) => { const e = E.ease.inOut(k); arm.cur.lerpVectors(from, rest, e); arm.curDir.lerpVectors(d0, dir, e).normalize(); AR.pose(w); });
    if (side === 'R' && a.carry) a.hold = true; else arm.target = null;
    pose(a);
  }

  /* se sienta en un taburete (de frente a la barra) y se levanta */
  async function sitOn(a, st) {
    const w = a.w, dir = st.n.clone().negate(), seat = st.o.box.max.y;
    const from = a.pos.clone(), to = V3(st.c.x, 0, st.c.z);
    await turnTo(a, Math.atan2(dir.x, dir.z));
    a.seated = st;
    await anim(0.6, (k) => { const e = E.ease.inOut(k); w.root.position.lerpVectors(from, to, e); w.crouch = Math.sin(e * Math.PI) * 0.35; pose(a); });
    w.crouch = 0; w.sit = { seat }; w.lean = 0.06; a.goal = from.clone(); pose(a);
  }
  async function standUp(a) {
    const w = a.w; if (!w.sit || !a.seated) return;
    const from = a.pos.clone(), n = a.seated.n;
    const clear = (p) => Math.min.apply(null, S.actors.filter((o) => o !== a).map((o) => Math.hypot(o.pos.x - p.x, o.pos.z - p.z)).concat([9]));
    const obs = AR.nav.obstacles(0.12);
    const cands = [0, 0.8, -0.8, 1.5, -1.5].map((ang) => from.clone().addScaledVector(n.clone().applyAxisAngle(UP, ang), 0.38)).filter((p) => !AR.nav.blocked(obs, p.x, p.z) || p === undefined);
    if (!cands.length) cands.push(from.clone().addScaledVector(n, 0.38));
    let to = null; const t0 = S.t;
    await until(() => { to = cands.find((p) => clear(p) >= 0.5) || null; return !!to || S.t - t0 > 30; });
    to = to || cands.slice().sort((p, q) => clear(q) - clear(p))[0];
    w.sit = null; w.lean = 0;
    await anim(0.6, (k) => { const e = E.ease.inOut(k); w.root.position.lerpVectors(from, to, e); w.crouch = Math.sin(e * Math.PI) * 0.3; pose(a); });
    w.crouch = 0; a.seated = null; a.goal = null; pose(a);
  }
  /* --- gestos */
  async function idle(a, sec, opt) {
    opt = opt || {}; const w = a.w, t0 = S.t;
    await anim(sec, () => { const t = S.t - t0; w.sway = Math.sin(t * 0.9 + a.id) * 0.018; w.nod = opt.nod ? Math.sin(t * 2.6) * 0.03 : 0; pose(a); });
    w.sway = 0; w.nod = 0;
  }
  async function touch(a, pt) {
    const side = a.carry ? 'L' : 'R';
    look(a, pt);
    await reach(a, side, pt.clone().add(V3(0, 0.02, 0)), 0.8, V3(Math.sin(a.w.facing), -0.6, Math.cos(a.w.facing)).normalize());
    await anim(rnd(0.7, 1.3), () => { a.w.arms[side].cur.y += Math.sin(S.t * 6) * 0.0006; pose(a); });
    await release(a, side);
  }
  async function photo(a, pt) {
    if (!a.phone) { a.phone = phone(); a.w.arms.L.tool.add(a.phone); a.phone.position.set(0, -0.02, 0.03); a.phone.rotation.x = -1.1; }
    a.phone.visible = true;
    const p = front(a, 0.0, 1.32, 0.34);
    await Promise.all([reach(a, 'L', p.clone(), 0.7, front(a, 0, 1.0, 0.6).sub(front(a, 0, 1.32, 0.34)).normalize()), reach(a, 'R', p.clone().add(front(a, -0.16, 0, 0).sub(a.pos)), 0.7, V3(0, -1, 0))]);
    look(a, p.clone().add(V3(0, 0.02, 0)));
    await idle(a, rnd(1.6, 2.6));
    await Promise.all([release(a, 'L'), release(a, 'R')]);
    a.phone.visible = false; look(a, pt);
  }
  async function talk(a, sec, listenTo) {
    const w = a.w, t0 = S.t, side = a.carry ? 'L' : 'R'; let next = 0; talkBubble(a, true);
    if (listenTo) look(a, listenTo.w.head.getWorldPosition(new T.Vector3()));
    await until(() => {
      const t = S.t - t0; w.nod = Math.sin(t * 3.1) * 0.035 * (Math.sin(t * 0.7) > 0 ? 1 : 0.2); w.sway = Math.sin(t * 1.3) * 0.012;
      if (t > next) { next = t + rnd(0.9, 1.8); if (chance(0.55)) { const p = front(a, side === 'R' ? rnd(-0.22, 0.05) : rnd(-0.05, 0.22), rnd(1.05, 1.3), rnd(0.22, 0.34)); reach(a, side, p, 0.5).catch(() => {}); } else release(a, side, 0.5).catch(() => {}); }
      pose(a); return t >= sec;
    });
    w.nod = 0; w.sway = 0; talkBubble(a, false);
    await release(a, side);
  }
  async function listen(a, sec, speaker) {
    const w = a.w, t0 = S.t;
    if (speaker) look(a, speaker.w.head.getWorldPosition(new T.Vector3()));
    await until(() => { const t = S.t - t0; w.nod = Math.max(0, Math.sin(t * 2.2)) * 0.05; w.sway = Math.sin(t * 1.1) * 0.012; pose(a); return t >= sec; });
    w.nod = 0; w.sway = 0;
  }
  async function chat(x, y, turns) { for (let i = 0; i < turns; i++) { const sec = rnd(2, 3.6); if (i % 2 === 0) await Promise.all([talk(x, sec, y), listen(y, sec, x)]); else await Promise.all([talk(y, sec, x), listen(x, sec, y)]); } }

  /* ------------------------------------------------------------ lugares de la versión activa */
  const items = () => (L.furn && L.furn.items) || {};
  const insts = (n) => ((items()[n] && items()[n].insts) || []).filter((o) => o.group.visible && o.box);
  const frontOf = (o) => V3(0, 0, 1).applyAxisAngle(UP, o.group.rotation.y);
  const centerOf = (o) => o.box.getCenter(new T.Vector3());
  /* punto para pararse frente a una caja por el lado n (unitario en planta), a dist del borde, corrido lateralmente */
  function standAt(box, n, dist, lat) {
    const c = box.getCenter(new T.Vector3()), s = box.getSize(new T.Vector3());
    const half = Math.abs(n.x) * s.x / 2 + Math.abs(n.z) * s.z / 2, l = V3(n.z, 0, -n.x), lhalf = Math.abs(l.x) * s.x / 2 + Math.abs(l.z) * s.z / 2;
    const p = c.clone().addScaledVector(n, half + dist).addScaledVector(l, clamp(lat === undefined ? 0 : lat, -lhalf + 0.2, lhalf - 0.2)); p.y = 0; return p;
  }
  /* la cara de una caja (en planta) que mira hacia un punto */
  function faceOf(box, p) { const c = box.getCenter(new T.Vector3()), s = box.getSize(new T.Vector3()), dx = (p.x - c.x) / (s.x / 2), dz = (p.z - c.z) / (s.z / 2); return Math.abs(dx) > Math.abs(dz) ? V3(Math.sign(dx), 0, 0) : V3(0, 0, Math.sign(dz)); }
  function freeStand(a, p, pref) {
    const obs = obstaclesFor(a, AR.nav.RW);
    S.actors.forEach((o) => { if (o !== a && o.goal) obs.push({ x0: o.goal.x - 0.45, z0: o.goal.z - 0.45, x1: o.goal.x + 0.45, z1: o.goal.z + 0.45, person: o, top: 1.8, bottom: 0 }); });
    return AR.nav.freeSpot(p.clone(), obs, pref || p);
  }
  /* puntos de interés para un cliente: exhibidores con producto, el mesón con las impresoras, la pantalla */
  function pois() {
    const out = [];
    [2, 3, 4, 7, 9, 11, 12, 13].forEach((n) => insts(n).forEach((o) => out.push({ o, n, kind: n === 7 ? 'impresoras' : (o.box.min.y > 0.9 ? 'alto' : 'exhibidor') })));
    insts(1).forEach((o) => out.push({ o, n: 1, kind: 'pantalla' }));
    return out;
  }
  function sidesOf(o) {
    const f = frontOf(o), l = V3(f.z, 0, -f.x), c = centerOf(o), FR = E.floorRect;
    const wall = (p) => p.x < FR[0] + 0.5 || p.x > FR[2] - 0.5 || p.z < FR[1] + 0.5 || p.z > FR[3] - 0.3 || (p.z < -2.15 && p.x < 0.95);   // muros, fachada y división
    return [f, l, l.clone().negate(), f.clone().negate()].filter((n) => { const p = standAt(o.box, n, 0.55, 0); return !wall(p) && !wall(c.clone().addScaledVector(n, 0.3)); });
  }
  /* la barra (mesa alta de atención) con sus taburetes: cada taburete sabe a qué cara de la barra da;
     el lado de los clientes es la cara con más taburetes y el del equipo, la opuesta */
  function bar() {
    const o = insts(5)[0]; if (!o) return null;
    const c = centerOf(o), size = o.box.getSize(new T.Vector3()), top = o.box.max.y;
    const stools = insts(6).map((s) => { const sc = centerOf(s); return { o: s, c: sc, n: faceOf(o.box, sc) }; });
    const count = {}; let side = frontOf(o), best = 0;
    stools.forEach((s) => { const k = s.n.x + ',' + s.n.z; count[k] = (count[k] || 0) + 1; if (count[k] > best) { best = count[k]; side = s.n.clone(); } });
    return { o, c, side, staff: side.clone().negate(), lat: V3(side.z, 0, -side.x), stools, top, size };
  }
  /* dónde se para el equipo para atender en la barra: detrás, si cabe; si la barra está pegada a otro mueble
     (versión B: espalda con espalda con la isla), en la punta más cercana a quien atiende */
  function staffSpot(a, B, off, pref) {
    const obs = AR.nav.obstacles(AR.nav.RW), ok = (p) => AR.nav.inWalk(p.x, p.z) && !AR.nav.blocked(obs, p.x, p.z);
    const back = standAt(B.o.box, B.staff, 0.36, off || 0);
    if (ok(back)) return freeStand(a, back, pref || back);
    const ends = [B.lat, B.lat.clone().negate()].map((f) => standAt(B.o.box, f, 0.42, 0)).filter(ok);
    if (!ends.length) return freeStand(a, back, pref || back);
    const r = pref || a.pos; ends.sort((p, q) => p.distanceTo(r) - q.distanceTo(r));
    return freeStand(a, ends[0], pref || ends[0]);
  }
  /* un punto sobre la tapa de la barra, entre dos personas */
  function onBar(B, p, q, inset) {
    const m = p.clone().lerp(q, 0.5), b = B.o.box, k = inset || 0.1;
    m.x = clamp(m.x, b.min.x + k, b.max.x - k); m.z = clamp(m.z, b.min.z + k, b.max.z - k); m.y = B.top; return m;
  }

  /* ------------------------------------------------------------ el diseñador en la barra, con su MacBook Pro */
  async function designer() {
    const B = bar(); if (!B || !B.stools.length) return;
    // el taburete de la punta que queda más hacia la fachada, del lado de los clientes
    const main = B.stools.filter((s) => s.n.equals(B.side)), list = main.length ? main : B.stools;
    const st = list.slice().sort((p, q) => (q.c.z + 0.3 * Math.abs(q.c.clone().sub(B.c).dot(B.lat))) - (p.c.z + 0.3 * Math.abs(p.c.clone().sub(B.c).dot(B.lat))))[0];
    const dir = st.n.clone().negate(), lat = V3(dir.z, 0, -dir.x);
    const a = actor({ kind: 'diseñador', name: 'diseñador', outfit: 'staff', hair: 'short', beard: true, glasses: chance(0.6), logo: true, col: { top: 0x1d1d20, topOsc: 0x151517, pants: 0x3a4250, shoes: 0xe9e9ea, sole: 0xc9c9c9, hair: 0x1f1512, skin: pick([0xc8976f, 0xa9744e, 0xe3b48f]) } });
    S.dev = a; a.seated = st;
    const w = a.w; w.root.position.set(st.c.x, 0, st.c.z); w.facing = Math.atan2(dir.x, dir.z); w.root.rotation.y = w.facing; w.sit = { seat: st.o.box.max.y }; w.lean = 0.12; pose(a);
    // el portátil sobre la barra, al borde frente a él; la taza a su derecha
    const edge = B.c.clone().addScaledVector(st.n, (Math.abs(st.n.x) * B.size.x + Math.abs(st.n.z) * B.size.z) / 2);
    const lp = edge.clone().addScaledVector(dir, 0.17).addScaledVector(lat, st.c.clone().sub(B.c).dot(lat)); lp.y = B.top;
    const mac = macbook(); mac.position.copy(lp); mac.rotation.y = w.facing + Math.PI; E.scene.add(mac);
    const cup = mug(); cup.position.copy(lp).addScaledVector(lat, -0.3).addScaledVector(dir, -0.02); E.scene.add(cup);
    a.props.push(mac, cup);
    const scr = lp.clone().add(V3(0, 0.2, 0)).addScaledVector(dir, -0.06);
    const keyL = lp.clone().addScaledVector(dir, -0.1).addScaledVector(lat, 0.07).add(V3(0, 0.03, 0)), keyR = keyL.clone().addScaledVector(lat, -0.14);
    const hd = V3(dir.x * 0.5, -1, dir.z * 0.5).normalize();
    look(a, scr);
    try {
      await wait(rnd(0.5, 1.5));
      await Promise.all([reach(a, 'L', keyL, 0.8, hd), reach(a, 'R', keyR, 0.8, hd)]);
      for (;;) {
        // teclea
        const sec = rnd(4, 10), t0 = S.t;
        await until(() => { const t = S.t - t0; w.arms.L.cur.copy(keyL).add(V3(0, Math.max(0, Math.sin(t * 11)) * 0.012, 0)).addScaledVector(lat, Math.sin(t * 2.3) * 0.02); w.arms.R.cur.copy(keyR).add(V3(0, Math.max(0, Math.sin(t * 9.5 + 1)) * 0.012, 0)).addScaledVector(lat, Math.sin(t * 1.7) * 0.02); w.nod = Math.sin(t * 1.4) * 0.012; pose(a); return t >= sec; });
        w.nod = 0;
        const r = Math.random();
        if (r < 0.25) {                                                                    // mira la pantalla y piensa, mano en la barbilla
          await reach(a, 'R', w.head.getWorldPosition(new T.Vector3()).add(V3(0, -0.02, 0)).addScaledVector(dir, 0.1).addScaledVector(lat, -0.03), 0.6, V3(0, -1, 0));
          await idle(a, rnd(2, 4)); await reach(a, 'R', keyR, 0.6, hd);
        } else if (r < 0.45) {                                                             // toma café
          const cp = cup.position.clone().add(V3(0, 0.06, 0));
          await reach(a, 'R', cp.clone().addScaledVector(dir, -0.01), 0.7, V3(0, -1, 0)); toHand(a, cup, 'R', V3(0, -0.09, 0));
          const mouth = w.head.getWorldPosition(new T.Vector3()).add(V3(0, -0.04, 0)).addScaledVector(dir, 0.1);
          await reach(a, 'R', mouth, 0.8, V3(dir.x * 0.5, -0.7, dir.z * 0.5)); look(a, null);
          await idle(a, rnd(1, 1.8));
          await reach(a, 'R', cp, 0.8, V3(0, -1, 0)); look(a, scr);
          toWorld(cup, cp.clone().sub(V3(0, 0.06, 0)));
          await reach(a, 'R', keyR, 0.6, hd);
        } else if (r < 0.65) {                                                             // mira quién anda por el local
          const near = S.actors.filter((o) => o !== a && o.kind === 'cliente' && o.pos.distanceTo(a.pos) < 4.5);
          if (near.length) { const o = pick(near), t1 = S.t; await until(() => { look(a, o.w.head.getWorldPosition(new T.Vector3())); pose(a); return S.t - t1 > 2 || S.actors.indexOf(o) < 0; }); }
          look(a, scr); await idle(a, rnd(0.8, 1.6));
        } else if (r < 0.75 && S.staff && S.staff.pos.distanceTo(a.pos) < 2.2 && !S.queue.length) {   // comenta algo con la dependienta
          look(a, S.staff.w.head.getWorldPosition(new T.Vector3())); await talk(a, rnd(1.5, 2.5), S.staff); look(a, scr);
          await reach(a, 'R', keyR, 0.5, hd);
        } else { await idle(a, rnd(0.8, 2)); }
      }
    } catch (e) { if (e !== ABORT) console.error(e); }
  }

  /* ------------------------------------------------------------ la dependienta: impresoras, barra, atención y venta */
  async function clerk() {
    const a = actor({ kind: 'dependienta', name: 'dependienta', outfit: 'staff', female: true, scale: 0.95, hair: 'pony', logo: true, speed: 1.05, col: { top: 0x1d1d20, topOsc: 0x151517, pants: 0x2c3340, shoes: 0xececec, sole: 0xcfcfcf, hair: 0x3b2314, skin: pick([0xd7a781, 0xb8835c, 0xe8c3a2]) } });
    S.staff = a;
    const B = bar(), meson = insts(7)[0], printers = insts(8), w = a.w;
    // empieza en la barra, del lado del equipo
    const home = B ? staffSpot(a, B, 0) : V3(0, 0, 0);
    w.root.position.copy(home); w.facing = B ? faceTo(a, B.c) : 0; w.root.rotation.y = w.facing; pose(a);
    /* venta en la barra: el cliente deja el producto, ella lo empaca, cobra con el datáfono y le entrega la bolsa */
    const sale = async (c) => {
      const prod = c.carry.obj, m = onBar(B, c.pos, a.pos, 0.12), toC = c.pos.clone().sub(a.pos).setY(0).normalize();
      await reach(c, 'R', m.clone().add(V3(0, 0.1, 0)), 0.7); toWorld(prod, m); c.carry = null; await release(c, 'R');
      await talk(a, rnd(1.5, 2.2), c);
      // lo toma y lo mete en la bolsa
      look(a, m); await reach(a, 'R', m.clone().add(V3(0, 0.07, 0)), 0.6); toHand(a, prod, 'R', V3(0, -0.07, 0));
      const bag = paperBag(), bp = m.clone().addScaledVector(toC, -0.08).add(V3(0, 0.245, 0)); toWorld(bag, bp, Math.atan2(toC.x, toC.z)); a.props.push(bag);
      await reach(a, 'R', bp.clone().add(V3(0, 0.06, 0)), 0.6); prod.visible = false;
      await reach(a, 'R', bp.clone().add(V3(0, 0.02, 0)), 0.3);
      const bp2 = bp.clone().addScaledVector(toC, 0.16);
      await anim(0.6, (k) => { const e = E.ease.inOut(k); bag.position.lerpVectors(bp, bp2, e); w.arms.R.cur.copy(bag.position).add(V3(0, 0.02, 0)); pose(a); });
      await release(a, 'R');
      // cobro: ella sostiene el datáfono; el cliente acerca el celular
      const term = terminal(); toHand(a, term, 'L', V3(0, -0.05, 0.02)); a.props.push(term);
      const tp = onBar(B, c.pos, a.pos, 0.1).add(V3(0, 0.22, 0)).addScaledVector(toC, -0.04);
      await reach(a, 'L', tp, 0.6, toC.clone().negate().add(V3(0, -0.4, 0)));
      if (!c.phone) { c.phone = phone(); c.w.arms.L.tool.add(c.phone); c.phone.position.set(0, -0.02, 0.03); c.phone.rotation.x = -1.1; }
      c.phone.visible = true; look(c, tp);
      await reach(c, 'L', tp.clone().addScaledVector(toC, 0.06).add(V3(0, 0.04, 0)), 0.7, toC.clone().negate().add(V3(0, -0.5, 0)));
      await idle(c, 0.8); await release(c, 'L'); c.phone.visible = false;
      await release(a, 'L'); term.parent.remove(term); a.props.splice(a.props.indexOf(term), 1);
      // le entrega la bolsa
      look(c, bag.position); await reach(c, 'R', bag.position.clone().add(V3(0, 0.0, 0)), 0.7);
      toHand(c, bag, 'R', V3(0, 0.0, 0)); c.carry = { obj: bag, mode: 'side' }; c.props.push(bag); a.props.splice(a.props.indexOf(bag), 1);
      await release(c, 'R', 0.6);
      await Promise.all([talk(a, rnd(1.5, 2.2), c), listen(c, 2, a)]);
      if (prod.parent) prod.parent.remove(prod);
    };
    const attend = async () => {
      const c = S.queue[0];
      if (!c || S.actors.indexOf(c) < 0) { S.queue.shift(); return; }
      let spot;
      if (c.atBar && B) spot = staffSpot(a, B, c.pos.clone().sub(B.c).dot(B.lat), c.pos);
      else { const d = a.pos.clone().sub(c.pos).setY(0); if (d.lengthSq() < 1e-4) d.set(1, 0, 0); d.normalize(); spot = freeStand(a, c.pos.clone().addScaledVector(d, 0.85), c.pos); }
      await walkTo(a, spot, { face: faceTo(a, c.pos) });
      if (S.actors.indexOf(c) < 0) { S.queue.shift(); return; }
      if (!c.seated) await turnTo(c, faceTo(c, a.pos));
      c.attended = true;
      await chat(c, a, Math.floor(rnd(2, 4)));
      if (c.atBar && c.carry && c.carry.kind === 'producto' && B) await sale(c);
      else {
        // le señala un exhibidor
        const P = pois().filter((p) => p.kind !== 'pantalla');
        if (P.length) {
          const tgt = centerOf(pick(P).o); tgt.y = 1.2; look(a, tgt);
          await reach(a, 'R', a.pos.clone().add(tgt.clone().sub(a.pos).setY(0).normalize().multiplyScalar(0.45)).add(V3(0, 1.25, 0)), 0.6, tgt.clone().sub(a.pos).normalize());
          if (S.actors.indexOf(c) >= 0) look(c, tgt);
          await idle(a, 1.2); await release(a, 'R');
        }
      }
      c.done = true; look(a, null);
      const q = S.queue.indexOf(c); if (q >= 0) S.queue.splice(q, 1);
    };
    try {
      await wait(rnd(1, 2));
      for (;;) {
        if (S.queue.length) { await attend(); continue; }
        const r = Math.random();
        if (printers.length && meson && r < 0.55) {
          // revisa una impresora: se para frente al mesón (por dentro del local), mira la cama, abre la puerta, ajusta
          const pr = pick(printers), pc = centerOf(pr); let f = frontOf(meson);
          let spot = standAt(meson.box, f, 0.48, pc.clone().sub(centerOf(meson)).dot(V3(f.z, 0, -f.x)));
          if (spot.z > E.floorRect[3] - 0.1) { f = f.clone().negate(); spot = standAt(meson.box, f, 0.48, pc.clone().sub(centerOf(meson)).dot(V3(f.z, 0, -f.x))); }   // si el frente da al pasillo, por detrás
          spot = freeStand(a, spot, pc);
          await walkTo(a, spot, { face: faceTo(a, pc) });
          if (S.queue.length) continue;
          look(a, pc); await idle(a, rnd(1.2, 2.2));
          await touch(a, pc.clone().addScaledVector(f, 0.19).add(V3(0, -0.05, 0)));
          if (chance(0.5)) await touch(a, pc.clone().addScaledVector(f, 0.12).add(V3(0, 0.3, 0)));
          await idle(a, rnd(1.5, 3), { nod: true });
        } else if (B && r < 0.8) {
          // ordena la barra
          const spot = staffSpot(a, B, rnd(-0.4, 0.4));
          await walkTo(a, spot, { face: faceTo({ pos: spot }, B.c) });
          if (S.queue.length) continue;
          const tp = front(a, 0.1, B.top + 0.03, 0.5); look(a, tp);
          await reach(a, 'R', tp, 0.7);
          await anim(rnd(1.5, 2.5), (k) => { w.arms.R.cur.copy(tp).add(V3(Math.sin(k * 9) * 0.1 * Math.cos(w.facing), 0, -Math.sin(k * 9) * 0.1 * Math.sin(w.facing))); pose(a); });
          await release(a, 'R');
          look(a, null); await idle(a, rnd(2, 5));
        } else {
          // mira el local; si entra alguien, lo sigue con la mirada
          const near = S.actors.filter((o) => o.kind === 'cliente');
          if (near.length) { const c = pick(near), t0 = S.t, d = rnd(2, 3); await until(() => { look(a, c.w.head.getWorldPosition(new T.Vector3())); pose(a); return S.t - t0 > d || S.actors.indexOf(c) < 0; }); look(a, null); }
          await idle(a, rnd(2, 4));
        }
      }
    } catch (e) { if (e !== ABORT) console.error(e); }
  }

  /* ------------------------------------------------------------ clientes */
  const OUTFITS = [0xc9553d, 0x2f6f8f, 0x6b8e4e, 0xe0b23c, 0x8c6a9c, 0x3d3d44, 0xf0ebe3, 0x2a4a80, 0xb5765a, 0x3f7f6e];
  const PANTS = [0x2d3a5c, 0x24262b, 0x5b5f66, 0x8a7a66, 0x1f2f4a, 0x3a3f4a];
  const SKIN = [0xf0d2b6, 0xe3b48f, 0xc8976f, 0xa9744e, 0x7d4f33, 0xd7a781];
  function customerOpts() {
    const fem = chance(0.5);
    return { kind: 'cliente', outfit: 'casual', female: fem, scale: rnd(0.93, 1.05), hair: fem ? pick(['long', 'pony', 'bun', 'short']) : pick(['short', 'short', 'buzz']), beard: !fem && chance(0.35), glasses: chance(0.25),
      sleeves: chance(0.45) ? 'long' : 'short', backpack: chance(0.3) ? pick([0x2a2a2e, 0x4d6a8a, 0x8a4d3d]) : null, bag: fem && chance(0.4) ? pick([0x3a2a1e, 0x1c1c1e, 0xb08a5a]) : null, stripe: chance(0.2) ? 0xf5f1e8 : null,
      col: { top: pick(OUTFITS), topOsc: 0x1f1f22, pants: pick(PANTS), shoes: pick([0xf2f2f2, 0x1e1e20, 0xd8cfc0, 0x8a3a2a]), sole: 0xdcdcdc, hair: pick([0x1f1512, 0x3b2314, 0x6b4a2a, 0xa8743a, 0x2a2a2a]), skin: pick(SKIN) }, speed: rnd(0.85, 1.05) };
  }
  function spawner(dt) {
    S.spawnT -= dt; if (S.spawnT > 0) return;
    const n = S.actors.filter((a) => a.kind === 'cliente').length;
    S.spawnT = rnd(6, 14);
    if (n >= S.max) return;
    customer().catch((e) => { if (e !== ABORT) console.error(e); });
  }
  /* pide ayuda y espera a que la atiendan (o se cansa) */
  async function askHelp(a, atBar) {
    a.atBar = atBar; a.attended = false; a.done = false; S.queue.push(a);
    const t0 = S.t; await until(() => { pose(a); return a.attended || S.t - t0 > 30; });
    if (a.attended) { const t1 = S.t; await until(() => a.done || S.t - t1 > 70); }
    else { const q = S.queue.indexOf(a); if (q >= 0) S.queue.splice(q, 1); }
    return a.attended;
  }
  async function customer() {
    const sideIn = chance(0.5) ? 1 : -1, lanes = shuffle([4.35, 4.85, 5.35]);
    const zc = lanes.find((z) => !S.actors.some((o) => Math.abs(o.pos.x - sideIn * 6) < 1.6 && Math.abs(o.pos.z - z) < 0.45));
    if (zc === undefined) return;                                                       // el pasillo está ocupado en esa punta: luego
    const a = actor(customerOpts()), w = a.w;
    w.root.position.set(sideIn * rnd(5.9, 6.3), 0, zc); w.facing = Math.atan2(-sideIn, 0); w.root.rotation.y = w.facing; pose(a);
    try {
      if (chance(0.3)) {
        // solo pasa: mira la vitrina de la fachada o la pantalla «Entra y crea» del pilar, y sigue
        const scr = insts(sideIn > 0 ? 20 : 19)[0], toScreen = scr && chance(0.5);
        const look1 = toScreen ? centerOf(scr).add(V3(0, 0.1, 0)) : V3(sideIn * rnd(1.0, 2.0), 1.3, 3.0);
        await walkTo(a, toScreen ? V3(look1.x + rnd(-0.3, 0.3), 0, Math.max(zc, 4.75)) : V3(sideIn * rnd(1.0, 2.0), 0, zc));
        await turnTo(a, faceTo(a, look1)); look(a, look1); await idle(a, rnd(2, 5));
        if (chance(0.4)) await photo(a, look1);
        look(a, null);
        await walkTo(a, V3(-sideIn * 6.2, 0, rnd(4.3, 5.4)));
        remove(a); return;
      }
      // entra y recorre de dos a cuatro muebles
      await walkTo(a, approach(rnd(-1.4, 1.4), a));
      const P = shuffle(pois()).slice(0, Math.floor(rnd(2, 5)));
      let asked = false;
      for (const p of P) {
        if (S.actors.indexOf(a) < 0) return;
        const c = centerOf(p.o); let spot, lookAt = c.clone(), n = null;
        if (p.kind === 'pantalla') { const f = frontOf(p.o); spot = freeStand(a, standAt(p.o.box, f, rnd(1.4, 2.0), rnd(-0.3, 0.3))); lookAt.y = clamp(c.y, 1.2, 1.7); }
        else {
          const sides = sidesOf(p.o); if (!sides.length) continue; n = pick(sides);
          const s = p.o.box.getSize(new T.Vector3()), l = V3(n.z, 0, -n.x), lh = Math.abs(l.x) * s.x / 2 + Math.abs(l.z) * s.z / 2;
          spot = freeStand(a, standAt(p.o.box, n, rnd(0.5, 0.65), rnd(-lh + 0.3, lh - 0.3)));
          lookAt = spot.clone().addScaledVector(n, -(0.85)); lookAt.y = p.kind === 'alto' ? clamp(c.y, 1.3, 2.0) : clamp(rnd(c.y - 0.2, c.y + 0.4), 0.8, 1.6);
        }
        await walkTo(a, spot, { face: faceTo(a, lookAt) });
        look(a, lookAt); await idle(a, rnd(1.5, 3.5));
        const low = p.o.box.min.y < 1.2 && p.kind !== 'pantalla';
        if (low) {
          const tp = lookAt.clone(); tp.y = clamp(rnd(0.85, 1.4), p.o.box.min.y + 0.1, Math.max(p.o.box.min.y + 0.12, p.o.box.max.y - 0.05));
          const d = tp.clone().sub(a.pos).setY(0); if (d.length() > 0.72) tp.addScaledVector(d.normalize(), -(d.length() - 0.72));
          const r = Math.random();
          if (r < 0.32 && !a.carry && p.kind === 'exhibidor') {
            // toma un producto del exhibidor y se lo lleva para pagarlo
            await reach(a, 'R', tp, 0.8, V3(Math.sin(w.facing), -0.6, Math.cos(w.facing)).normalize());
            const prod = product(); toHand(a, prod, 'R', V3(0, -0.07, 0.02)); a.props.push(prod);
            a.carry = { obj: prod, mode: 'front', kind: 'producto' }; await release(a, 'R', 0.6);
            look(a, prod.getWorldPosition(new T.Vector3())); await idle(a, rnd(1.2, 2));
          } else if (r < 0.6) await touch(a, tp);
          else if (r < 0.78 && !a.carry) await photo(a, lookAt);
          else { const l2 = lookAt.clone().add(V3(rnd(-0.5, 0.5), rnd(-0.3, 0.3), rnd(-0.5, 0.5))); look(a, l2); await idle(a, rnd(1.5, 3)); }
        } else if (!a.carry && chance(0.3)) await photo(a, lookAt);
        // a veces pide que le expliquen ahí mismo
        if (!asked && !a.carry && S.staff && !S.queue.length && chance(0.25)) { asked = true; look(a, S.staff.w.head.getWorldPosition(new T.Vector3())); await askHelp(a, false); }
        await idle(a, rnd(0.5, 1.5));
        look(a, null);
      }
      // en la barra: paga lo que lleva o pregunta algo
      const B = bar();
      if (B && S.staff && (a.carry || chance(0.4))) {
        const taken = S.actors.map((o) => o.seated).filter(Boolean);
        const free = B.stools.filter((st) => taken.indexOf(st.o) < 0 && !taken.some((t) => t.o === st.o));
        const st = free.length && chance(0.7) ? pick(free) : null;
        let spot;
        if (st) spot = V3(st.c.x, 0, st.c.z).addScaledVector(st.n, 0.38);
        else { const dev = S.dev ? S.dev.pos.clone().sub(B.c).dot(B.lat) : 99, lh = (Math.abs(B.lat.x) * B.size.x + Math.abs(B.lat.z) * B.size.z) / 2; let off = rnd(-lh + 0.35, lh - 0.35); if (Math.abs(off - dev) < 0.8) off = dev > 0 ? -lh + 0.4 : lh - 0.4; spot = standAt(B.o.box, B.side, 0.42, off); }
        const goal = freeStand(a, spot, spot);
        await walkTo(a, goal, { face: Math.atan2(-B.side.x, -B.side.z) });
        // se sienta solo si llegó justo frente al taburete y sigue libre
        if (st && Math.hypot(a.pos.x - spot.x, a.pos.z - spot.z) < 0.16 && !S.actors.some((o) => o !== a && o.seated && o.seated.o === st.o)) await sitOn(a, st);
        look(a, B.c.clone().add(V3(0, 0.5, 0)));
        const ok = await askHelp(a, true);
        if (!ok && a.carry && a.carry.kind === 'producto') {                                   // nadie lo atendió: deja el producto en la barra
          const m = onBar(B, a.pos, B.c, 0.15); await reach(a, 'R', m.clone().add(V3(0, 0.1, 0)), 0.6); toWorld(a.carry.obj, m); a.carry = null; await release(a, 'R');
        }
        look(a, null); await idle(a, rnd(0.6, 1.2));
        if (a.seated) await standUp(a);
      }
      // se va por el pasillo (con su bolsa, si compró)
      await walkTo(a, approach(rnd(-1.2, 1.2), a));
      await walkTo(a, V3(pick([-1, 1]) * 6.3, 0, rnd(4.3, 5.4)));
    } catch (e) { if (e !== ABORT) console.error(e); }
    remove(a);
  }

  /* ------------------------------------------------------------ API */
  function start() {
    if (!S.on || S.actors.length) return;
    S.gen++;
    designer().catch((e) => { if (e !== ABORT) console.error(e); }); clerk().catch((e) => { if (e !== ABORT) console.error(e); }); S.spawnT = rnd(1, 3);
    E.shadowDirty = true; E.invalidate();
  }
  function clear() {
    S.gen++;
    S.actors.slice().forEach(remove);
    S.queue = []; S.staff = null; S.dev = null; S.timers = [];
  }
  V.setOn = function (on, quiet) {
    S.on = !!on;
    try { localStorage.setItem('l3d-vida', on ? '1' : '0'); } catch (e) { /* */ }
    if (on) start(); else clear();
    const b = document.getElementById('btn-vida'); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    E.shadowDirty = true; E.invalidate();
    if (!quiet && L.ui && L.ui.toast) L.ui.toast(on ? 'Gente en el local' : 'Local sin gente', on ? 'Clientes, la dependienta y el diseñador en la barra.' : 'Se quitan las personas del modelo.', null, 2500);
  };
  /* el armado y el montaje ocupan la escena: la gente se va mientras tanto y vuelve después */
  V.suspend = function (yes) {
    if (S.suspended === !!yes) return;
    S.suspended = !!yes;
    if (yes) clear(); else if (S.on) start();
  };
  V.reset = function () { if (!S.on || S.suspended) return; clear(); start(); };
  V.init = function () {
    if (S.booted) return; S.booted = true;
    if (!S.hooked) { E.hooks.push(update); S.hooked = true; requestAnimationFrame(tick); }
    let on = !E.mobile && !E.reduced;
    try { const v = localStorage.getItem('l3d-vida'); if (v === '1') on = true; else if (v === '0') on = false; } catch (e) { /* */ }
    if (E.reduced) on = false;
    const b = document.getElementById('btn-vida'); if (b) { b.addEventListener('click', () => V.setOn(!S.on)); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    document.addEventListener('visibilitychange', () => { S.paused = document.hidden; });
    S.max = E.mobile ? 2 : 3;
    S.on = on;
    if (on) start();
  };
  V.actors = () => S.actors;
  V._step = (dt) => update(dt);                                                         // pruebas: avanza la simulación sin dibujar
})();
