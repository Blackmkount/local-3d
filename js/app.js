/* ============================================================================
   APLICACIÓN — selección, acercamiento, piezas separadas, animación de armado,
   fichas de materiales y costos, presupuesto, montaje del local y rutas (#m7).

   Avisa todo lo que pasa por L.bus (la lista de eventos está en js/hooks.js) y
   expone L.api para los demás módulos. Lo nuevo se enchufa por L.ext (búsqueda,
   menú, rutas y dibujo de cada cuadro) sin tocar este archivo.

   Rutas: #m7 · #m7/materiales|fabricacion|ensamble|porque · #vista/entrada…
   (también fachada, adentro, taller, arriba, plano) · #presupuesto ·
   #materiales · #montaje · y cualquier clave de L.ext.routes (#clave/resto).
   Abrir una capa desde cero (ficha, ventana, montaje) deja una entrada en el
   historial; cambiar de ficha o de pestaña la reemplaza. Así el botón Atrás
   cierra primero la ventana, luego la ficha, luego el montaje, y nunca saca al
   visitante de la página si las entradas las puso la aplicación.
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D, T = window.THREE, E = L.engine, F = L.furn, R = L.room, DATA = L.data;
  const bus = L.bus, ext = L.ext, prefs = L.prefs;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cop = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  /* coma decimal para el texto que viene de data.js (0.40 m → 0,40 m); deja quietos los miles ($1.699.900) */
  const dec = (s) => String(s == null ? '' : s).replace(/(\d)\.(\d{1,2})(?!\d)/g, '$1,$2');
  const escd = (s) => esc(dec(s));
  const norm = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const NUM = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
  /* número en letras del 1 al 20 (g: 'f' o 'm' para «una» / «un») */
  const palabras = (n, g) => (n === 1 && g ? (g === 'f' ? 'una' : 'un') : NUM[n] != null ? NUM[n] : String(n));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const emit = (ev, d) => bus.emit(ev, d);
  const byN = {}; DATA.items.forEach((i) => { byN[i.n] = i; });
  const procBy = {}; DATA.procesos.forEach((p) => { procBy[p.id] = p; });
  const app = $('#app');
  let Y = null, ray = null, ndc = null, pv = null;   // se crean al arrancar, cuando ya se sabe que three.js cargó

  const S = { sel: null, inst: null, mode: 'solid', step: -1, playing: false, done: false, moving: -1, gen: 0, labels: false, plan: false, hot: null, view: null, prevView: null, hover: null, hl: null, pin: null, tab: 'resumen', filter: 'todos', inv: false, mont: null, modal: null, usable: { w: 1, h: 1 }, tws: [], opener: null, returnTo: null, kbd: false, held: false, moved: false, moveT: 0, booted: false, ready: false, pending: null, routing: false, lastHash: location.hash, title0: document.title };

  /* palabras de la interfaz: las mismas en el dock, la ficha y el montaje */
  const STR = { explode: 'Separar piezas', play: 'Ver cómo se arma', replay: 'Volver a empezar', exit: 'Salir', montaje: 'Montaje del local' };
  const VIEW_NAMES = { fachada: 'Entrada', interior: 'Adentro', taller: 'Taller', aerea: 'Arriba', planta: 'Plano' };
  const VIEW_KEYS = { entrada: 'fachada', adentro: 'interior', arriba: 'aerea', plano: 'planta' };
  const TAB_SLUG = { mats: 'materiales', fab: 'fabricacion', ens: 'ensamble', why: 'porque' };
  const SLUG_TAB = { resumen: 'resumen', materiales: 'mats', fabricacion: 'fab', ensamble: 'ens', porque: 'why' };

  /* temporizador que E.cancel puede detener (E.after llega con el motor nuevo; mientras tanto, setTimeout) */
  function after(sec, fn) {
    if (E.after) return E.after(sec, fn);
    const h = { dead: false };
    setTimeout(() => { if (!h.dead) fn(); }, sec * 1000);
    return h;
  }
  const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 60));

  /* -------------------------------------------------------------- foco */
  const LAYERS = ['#panel', '#inv', '#mont', '#modal', '#spot', '#actions', '#stepper'];
  function inClosed(el) { return LAYERS.some((q) => { const l = $(q); return l && l.hidden && l.contains(el); }); }
  /* el elemento existe, se ve y mide algo (no es BODY ni algo de 0 × 0) */
  function visible(el) {
    if (!el || !el.focus || el === document.body || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !inClosed(el);
  }
  /* el foco se perdió: está en BODY o dentro de una capa que se acaba de cerrar */
  function focusLost() {
    const ae = document.activeElement;
    return !ae || ae === document.body || ae === document.documentElement || inClosed(ae);
  }
  const focusEl = (el) => { if (el) el.focus({ preventScroll: true }); };
  function rescue(el) { if (focusLost() && visible(el)) focusEl(el); }
  const focusTitle = () => focusEl($('#p-title'));
  /* devuelve el foco a quien abrió la capa; si ya no está, a la ficha abierta o a la búsqueda */
  function restoreFocus(to, layer) {
    const ae = document.activeElement;
    if (!(focusLost() || (layer && layer.contains(ae)))) return;
    focusEl(visible(to) ? to : S.sel && !$('#panel').hidden ? $('#p-title') : $('#btn-search'));
  }

  /* ------------------------------------------------------------------ vistas */
  const VIEWS = {
    fachada: { t: [0.1, 1.72, 1.2], th: 0.17, ph: 1.485, r: 12.2, min: 1.45 },
    interior: { t: [0, 1.15, -0.9], th: 0.3, ph: 1.36, r: 5.4, min: 0.9 },
    taller: { t: [-0.7, 1.05, -1.6], th: -0.5, ph: 1.27, r: 5.1, min: 0.8 },
    aerea: { t: [0, 0.7, 0.1], th: 0.62, ph: 0.86, r: 13.4, min: 1.15 },
    planta: { t: [0, 0, 0.72], th: 0, ph: 0.02, r: 18.4, min: 1.05 }
  };
  /* destino de cámara de una vista, ajustado al espacio libre que dejan los paneles */
  function viewGoal(name) {
    const v = VIEWS[name]; if (!v) return null;
    const a = S.usable.w / S.usable.h, k = Math.max(1, v.min / a);
    return { target: new T.Vector3(v.t[0], v.t[1], v.t[2]), theta: v.th, phi: v.ph, radius: Math.min(25, v.r * k) };
  }
  function markViews(name) {
    $$('#views button').forEach((b) => { const on = b.dataset.view === name; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  }
  function clearView() { if (S.view) { S.view = null; markViews(null); } }
  function goView(name, dur) {
    if (!VIEWS[name]) return;
    exitMontaje(true); deselect(true);
    S.plan = name === 'planta'; S.view = name;
    markViews(name);
    layout();
    E.flyTo(viewGoal(name), dur == null ? 1.6 : dur);
    syncLabels();
    emit('view', { name });
  }
  function refit(dur) { const g = viewGoal(S.view); if (g) E.flyTo(g, dur); }
  /* lleva la cámara a un punto cualquiera ({ target: [x, y, z], theta, phi, radius }) */
  function focusOn(goal, dur) {
    if (!goal) return;
    const t = goal.target;
    const v = t == null ? null : Array.isArray(t) ? new T.Vector3(t[0], t[1], t[2]) : new T.Vector3(t.x, t.y, t.z);
    clearView();
    E.flyTo({ target: v, theta: goal.theta, phi: goal.phi, radius: goal.radius }, dur == null ? 1.4 : dur);
  }

  /* --------------------------------------------- disposición y centro de vista */
  function layout() {
    const w = E.size.w, h = E.size.h, wide = w >= 860, land = !wide && w > h && h < 520;
    app.classList.toggle('is-narrow', !wide);
    app.classList.toggle('is-land', land);
    const pn = $('#panel'), inv = $('#inv'), mont = $('#mont');
    const panelOpen = !pn.hidden, montOpen = !mont.hidden, right = panelOpen ? pn : montOpen ? mont : null;
    let ox = 0, oy = 0, uw = w, uh = h - 64 - 84, ul = 0, ur = 0, ub = 0;
    if (wide) {
      const left = !inv.hidden ? inv : montOpen ? mont : null;
      const pw = panelOpen ? pn.offsetWidth + 16 : 0, lw = left ? left.offsetWidth + 16 : 0;
      ox = (pw - lw) / 2; uw = w - pw - lw; oy = 10;
      ul = left ? left.offsetWidth + 12 : 0; ur = panelOpen ? pn.offsetWidth + 12 : 0;
    } else if (land && !(right && right.offsetWidth > w * 0.6)) {
      // teléfono acostado: la ficha y el montaje son un cajón a la derecha, como en el escritorio
      const pw = right ? right.offsetWidth + 16 : 0;
      ox = pw / 2; uw = w - pw; oy = 10;
      ur = right ? right.offsetWidth + 12 : 0;
    } else {
      // pantalla angosta: la ficha o el montaje abajo, el dock encima; se mide lo que de verdad ocupa cada cosa
      const bottom = panelOpen ? pn : montOpen ? mont : null;
      const dock = ['#stepper', '#actions'].map((q) => $(q)).filter((el) => !el.hidden && el.offsetHeight);
      if (bottom || dock.length) {
        const top = $('#top'), topB = top.offsetTop + top.offsetHeight;
        let used = bottom ? bottom.offsetHeight + 8 : 0;
        dock.forEach((el) => { used += el.offsetHeight + 10; });
        uh = h - topB - used - 32;
        oy = h / 2 - (topB + 16 + Math.max(120, uh) / 2);
        ub = bottom ? bottom.offsetHeight + 8 : 0;
      }
    }
    S.usable = { w: Math.max(120, uw), h: Math.max(120, uh) };
    app.style.setProperty('--ul', ul + 'px');
    app.style.setProperty('--ur', ur + 'px');
    app.style.setProperty('--ub', ub + 'px');
    E.setViewOffset(ox, oy);
  }

  /* ---------------------------------------------------------------- selección */
  function allMeshes(it, fn) { it.insts.forEach((o) => o.group.traverse((m) => { if (m.isMesh) fn(m, o); })); }
  function ghostOthers(it, on, force) {
    if (!on && !force && it === S.sel && it.zone === 'trastienda') return;   // la trastienda se ve aislada mientras esté elegida
    F.order.forEach((n) => {
      const x = F.items[n]; if (x === it) return;
      allMeshes(x, (m) => {
        if (m.userData.mat0 === undefined) m.userData.mat0 = m.material;
        if (m.userData.cs === undefined) m.userData.cs = m.castShadow;
        m.material = on ? E.ghost : m.userData.mat0; m.castShadow = on ? false : m.userData.cs;
      });
      x.insts.forEach((o) => o.glows.forEach((g) => { g.visible = !on; }));
    });
    if (on) { E.ghost.opacity = 0.4; E.tween(0.45, (k) => { E.ghost.opacity = E.lerp(0.4, 0.07, k); }); }
    S.ghosted = on; E.shadowDirty = true; E.invalidate();
  }
  function track(tw) { S.tws.push(tw); return tw; }
  function stopTweens() { S.tws.forEach((tw) => E.cancel(tw)); S.tws = []; }
  /* modo del mueble elegido: 'solid' | 'exploded' | 'asm' */
  function setMode(m) {
    if (S.mode === m) return;
    S.mode = m;
    if (S.sel) emit('mode', { n: S.sel.n, mode: m });
  }

  function focusBox(it, o, exploded) {
    const box = new T.Box3(), v = new T.Vector3();
    const list = (it.insts.length > 1 && unionRadius(it) > 2.6) ? [o || it.insts[0]] : it.insts;
    list.forEach((oi) => {
      if (!exploded) { box.union(oi.box); return; }
      const m = new T.Matrix4().compose(oi.home, oi.group.quaternion, oi.group.scale);
      oi.parts.forEach((p) => {
        const u = p.userData, bb = p.geometry.boundingBox || (p.geometry.computeBoundingBox(), p.geometry.boundingBox);
        [u.home, v.copy(u.home).add(u.ex).clone()].forEach((c) => { box.expandByPoint(v.copy(bb.min).add(c).applyMatrix4(m)); box.expandByPoint(v.copy(bb.max).add(c).applyMatrix4(m)); });
      });
    });
    return box;
  }
  function unionRadius(it) { if (it._ur == null) { const b = new T.Box3(); it.insts.forEach((o) => b.union(o.box)); it._ur = b.getSize(new T.Vector3()).length() / 2; } return it._ur; }
  function focus(it, o, exploded, dur) {
    const box = focusBox(it, o, exploded), c = box.getCenter(new T.Vector3()), rad = Math.max(0.35, box.getSize(new T.Vector3()).length() / 2);
    const vf = T.MathUtils.degToRad(E.camera.fov), asp = S.usable.w / S.usable.h * (S.usable.h / E.size.h);
    const hf = 2 * Math.atan(Math.tan(vf / 2) * asp), vfu = 2 * Math.atan(Math.tan(vf / 2) * (S.usable.h / E.size.h));
    const d = rad / Math.sin(Math.min(vfu, hf) / 2) * 1.02;
    const keep = exploded != null && S.sel === it;
    E.flyTo({ target: c, theta: keep ? E.cam.goal.th : it.th, phi: keep ? Math.min(E.cam.goal.ph, 1.2) : it.ph, radius: E.clamp(d, 1.5, 15) }, dur || 1.35);
  }

  /* opt: { tab, force, via: '3d' | 'list' | 'search' | 'route' | 'nav' | 'api' } */
  function select(n, o, opt) {
    const it = F.items[n]; if (!it) return;
    opt = opt || {};
    const via = opt.via || 'api';
    if (S.mont) exitMontaje(true, true);                 // la ficha reemplaza al montaje
    if (S.sel === it && !opt.force) { if (S.mode === 'solid' && o && o !== S.inst) { S.inst = o; focus(it, o); } return; }
    const had = !!S.sel;
    if (!had) S.opener = S.returnTo || document.activeElement;
    if (S.sel) resetItem(S.sel);
    S.sel = it; S.inst = o || it.insts[0]; S.mode = 'solid'; S.step = -1; S.playing = false; S.hl = null; S.pin = null; S.tab = opt.tab || 'resumen';
    R.hideDiv = it.zone === 'trastienda'; R.keepPillars = it.zone === 'fachada';
    S.plan = false; S.view = null; markViews(null);
    const pn = $('#panel'), swap = !pn.hidden;
    renderPanel(); pn.hidden = false; $('#tip').hidden = true; S.hover = null;
    if (swap) { pn.classList.remove('is-swap'); void pn.offsetWidth; pn.classList.add('is-swap'); }
    pn.classList.remove('is-tall');
    if (app.classList.contains('is-narrow')) toggleInv(false);
    $('#hint').hidden = true;
    const canAnim = it.insts[0].steps > 1 || it.insts[0].parts.length > 1;
    $('#actions').hidden = !canAnim; $('#stepper').hidden = true;
    $('#act-explode').setAttribute('aria-pressed', 'false');
    $('#act-play').hidden = !(byN[n].seq && byN[n].seq.length);
    if (it.zone === 'trastienda') ghostOthers(it, true);
    layout(); focus(it, S.inst);
    markInv(); syncLabels(); refreshEdges(); pulseSel();
    document.title = byN[n].short + ' · BlackForge';
    if (had) histSwap(); else histOpen('card');
    // si la ficha se abrió desde el teclado (o el foco quedó en una capa que se cerró), el foco pasa a su título
    if (!had && (inClosed(document.activeElement) || (S.kbd && (via === 'list' || via === 'nav' || via === '3d')))) focusTitle();
    emit('select', { n, via });
  }
  function deselect(silent, swap) {
    if (!S.sel) return;
    resetItem(S.sel);
    S.sel = null; S.inst = null; S.hl = null; S.pin = null; R.hideDiv = false; R.keepPillars = false; E.autoRotate = false;
    $('#act-spin').setAttribute('aria-pressed', 'false');
    $('#panel').hidden = true; $('#actions').hidden = true; $('#stepper').hidden = true; $('#hint').hidden = false;
    layout(); markInv(); syncLabels(); refreshEdges();
    document.title = S.title0;
    if (!swap) histClose('card');
    if (!silent) { const g = E.cam.goal; E.flyTo({ radius: Math.max(g.r, 6.5), phi: Math.min(g.ph, 1.25) }, 1.0); }
    if (focusLost()) focusEl(visible(S.opener) ? S.opener : $('#btn-inv'));
    S.opener = null;
    emit('deselect', {});
  }
  /* deja el mueble armado y la escena completa */
  function resetItem(it) {
    S.gen++; stopTweens();
    it.insts.forEach((o) => {
      o.group.position.copy(o.home);
      o.parts.forEach((p) => { p.position.copy(p.userData.home); p.visible = true; if (p.userData.mat0) p.material = p.userData.mat0; });
      o.decor.forEach((d) => { d.visible = true; d.position.y = 0; });
      o.glows.forEach((g) => { g.visible = true; });
    });
    if (S.ghosted) ghostOthers(it, false, true);
    setMode('solid'); S.step = -1; S.playing = false; S.done = false; S.moving = -1; S.hl = null; S.pin = null;
    E.shadowDirty = true; E.invalidate();
  }
  function showDecor(it, on, drop) {
    it.insts.forEach((o) => {
      o.decor.forEach((d) => {
        d.visible = on;
        if (on && drop) { d.position.y = 0.16; track(E.tween(0.55, (k) => { d.position.y = 0.16 * (1 - k); }, { ease: E.ease.outBack })); } else d.position.y = 0;
      });
      o.glows.forEach((g) => { g.visible = on; });
    });
  }

  /* ---------------------------------------------------------- separar piezas */
  function setExplode(on) {
    const it = S.sel; if (!it) return;
    if (it.insts[0].parts.length < 2) return;           // un mueble de una sola pieza no se separa
    pinHL(null);
    if (S.mode === 'asm') exitAsm(true);
    S.gen++; stopTweens();
    const max = it.insts[0].steps;
    if (on) { ghostOthers(it, true); showDecor(it, false); }
    it.insts.forEach((o) => {
      o.group.position.copy(o.home);
      o.parts.forEach((p) => {
        const u = p.userData, from = p.position.clone(), to = u.home.clone(); if (on) to.add(u.ex);
        p.visible = true;
        const delay = (on ? (max - 1 - u.step) : u.step) * 0.06;
        track(E.tween(0.95, (k) => { p.position.lerpVectors(from, to, k); }, { delay, ease: on ? E.ease.out : E.ease.inOut }));
      });
    });
    setMode(on ? 'exploded' : 'solid');
    const gen = S.gen;
    if (!on) track(after(0.95 + max * 0.06, () => { if (gen !== S.gen) return; ghostOthers(it, false); showDecor(it, true, true); refreshEdges(); }));
    $('#act-explode').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('#stepper').hidden = true; $('#actions').hidden = false;
    layout(); focus(it, S.inst, on, 1.1);
    refreshEdges(); syncPanelState(); syncLabels();
  }

  /* ----------------------------------------------------- animación de armado */
  function offW(o) { if (!o._off) { const a = o.item.asm; o._off = a ? new T.Vector3(a.off[0], a.off[1], a.off[2]).applyAxisAngle(Y, o.group.rotation.y) : new T.Vector3(); } return o._off; }
  function setOff(o, f) { o.group.position.copy(o.home).addScaledVector(offW(o), f); }
  function partStart(p) {
    const u = p.userData, d = (u.exA || u.ex).clone();
    if (d.lengthSq() < 1e-6) d.set(0, 0.28, 0);
    return u.home.clone().add(d);
  }
  function playAsm(from) {
    const it = S.sel; if (!it) return;
    const seq = byN[it.n].seq; if (!seq || !seq.length) return;
    pinHL(null);
    S.gen++; stopTweens(); S.done = false; S.moving = -1;
    if (!S.ghosted) ghostOthers(it, true);
    showDecor(it, false);
    setMode('asm'); S.playing = true; E.autoRotate = false; $('#act-spin').setAttribute('aria-pressed', 'false');
    $('#actions').hidden = true; $('#stepper').hidden = false;
    $('#act-explode').setAttribute('aria-pressed', 'false');
    buildDots(seq.length);
    layout(); focus(it, S.inst, true, 1.0);              // el stepper ya ocupa su sitio: se mide antes de encuadrar
    asmStep(from || 0, true);
    syncPanelState(); syncLabels();
    rescue($('#st-play'));
  }
  function asmStep(k, anim) {
    const it = S.sel; if (!it) return;
    const seq = byN[it.n].seq; if (!seq || !seq.length) return;
    const gen = ++S.gen;
    stopTweens();
    k = E.clamp(k, 0, seq.length - 1); S.step = k;
    const A = it.asm;
    let total = 0;
    it.insts.forEach((o) => {
      const settledBefore = A ? (k - 1 >= A.step ? 0 : 1) : 0, settledAfter = A ? (k >= A.step ? 0 : 1) : 0;
      let d0 = 0;
      const mine = o.parts.filter((p) => p.userData.step === k);
      const partsDur = mine.length ? 0.9 + Math.min(0.6, mine.length * 0.035) : 0;
      if (!anim || E.reduced) setOff(o, settledAfter);
      else if (A && k === A.step) {
        setOff(o, 1);
        const slide = (delay) => track(E.tween(1.0, (e) => { setOff(o, 1 - e); }, { delay, ease: E.ease.inOut }));
        if (A.first) { slide(0.15); d0 = 1.0; total = Math.max(total, 1.15 + partsDur); } else { slide(partsDur + 0.1); total = Math.max(total, partsDur + 1.1); }
      } else setOff(o, settledBefore);
      o.parts.forEach((p) => {
        const u = p.userData;
        if (u.step < k) { p.visible = true; p.position.copy(u.home); }
        else if (u.step > k) { p.visible = false; }
        else if (!anim || E.reduced) { p.visible = true; p.position.copy(u.home); }
      });
      mine.forEach((p, i) => {
        if (!anim || E.reduced) return;
        const from = partStart(p), to = p.userData.home, delay = d0 + Math.min(0.6, i * 0.035);
        p.visible = false; p.position.copy(from);
        track(E.tween(0.9, (e) => { p.visible = true; p.position.lerpVectors(from, to, e); }, { delay, ease: E.ease.outQuint }));
      });
      total = Math.max(total, d0 + partsDur);
    });
    S.moving = k; refreshEdges();
    updateStepper();
    E.shadowDirty = true; E.invalidate();
    emit('asm-step', { n: it.n, k, count: seq.length, text: seq[k].t, done: false });
    if (!anim) return;
    track(after(Math.max(0.5, total) + 0.05, () => { if (gen !== S.gen) return; S.moving = -1; refreshEdges(); }));
    if (S.playing) {
      track(after(Math.max(0.9, total) + 1.25, () => {
        if (gen !== S.gen || !S.playing) return;
        if (k < seq.length - 1) asmStep(k + 1, true); else finishAsm();
      }));
    }
  }
  /* un paso elegido a mano (flechas del stepper, puntos, lista de la ficha) detiene la reproducción */
  function stepTo(k, anim) { S.playing = false; S.done = false; asmStep(k, anim); }
  function finishAsm() {
    const it = S.sel; if (!it) return;
    const seq = byN[it.n].seq;
    S.playing = false; S.done = true;
    showDecor(it, true, true);
    updateStepper();
    emit('asm-step', { n: it.n, k: S.step, count: seq.length, text: 'Armado completo', done: true });
    const gen = S.gen;
    track(after(1.6, () => { if (gen === S.gen && S.mode === 'asm') exitAsm(); }));
  }
  function exitAsm(quiet) {
    const it = S.sel; if (!it) return;
    S.gen++; stopTweens(); S.done = false; S.moving = -1;
    it.insts.forEach((o) => { o.group.position.copy(o.home); o.parts.forEach((p) => { p.visible = true; p.position.copy(p.userData.home); }); });
    setMode('solid'); S.playing = false; S.step = -1;
    $('#stepper').hidden = true; $('#actions').hidden = false;
    layout();
    if (!quiet) { ghostOthers(it, false); showDecor(it, true); focus(it, S.inst, false, 1.0); }
    refreshEdges(); syncPanelState(); syncLabels(); E.shadowDirty = true; E.invalidate();
    if (!quiet) rescue($('#act-play'));
  }
  const ICON_PLAY = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4.5v11l9-5.5z" fill="currentColor"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4.5v11M14 4.5v11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  const ICON_PREV = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_NEXT = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function buildDots(n) { $('#st-dots').innerHTML = Array.from({ length: n }, (_, i) => '<button type="button" class="dot" data-k="' + i + '" aria-label="Ir al paso ' + (i + 1) + '"></button>').join(''); }
  function updateStepper() {
    const it = S.sel; if (!it) return;
    const seq = byN[it.n].seq; if (!seq || !seq.length) return;
    const s = seq[S.step] || seq[0];
    $('#st-n').textContent = S.done ? 'Listo' : 'Paso ' + (S.step + 1) + ' de ' + seq.length;
    $('#st-t').textContent = S.done ? 'Armado completo' : dec(s.t);
    $('#st-src').textContent = S.done ? '' : 'Del manual: ' + s.src;
    $('#st-play').innerHTML = S.playing ? ICON_PAUSE : ICON_PLAY;
    $('#st-play').setAttribute('aria-label', S.playing ? 'Pausar' : 'Reproducir');
    $$('#st-dots .dot').forEach((d, i) => {
      const on = i === S.step && !S.done;
      d.classList.toggle('is-done', i < S.step || !!S.done); d.classList.toggle('is-on', on);
      if (on) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
    $$('#panel .seq li').forEach((li, i) => {
      const on = S.mode === 'asm' && i === S.step;
      li.classList.toggle('is-on', on); li.classList.toggle('is-done', S.mode === 'asm' && i < S.step);
      if (on) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
  }
  function syncPanelState() {
    const p = $('#panel'); if (p.hidden) return;
    const ex = $('.js-explode', p);
    if (ex) { ex.textContent = STR.explode; ex.setAttribute('aria-pressed', S.mode === 'exploded' ? 'true' : 'false'); }
    $$('.js-play', p).forEach((b) => { b.textContent = S.mode === 'asm' ? STR.replay : STR.play; });
    updateStepper();
  }

  /* ---------------------------------------------------- aristas de resaltado */
  const lit = new Set();
  function edgesOf(m) {
    if (!m.userData.edges) {
      const ls = new T.LineSegments(new T.EdgesGeometry(m.geometry, 30), E.edgeMat);
      ls.visible = false; ls.raycast = function () {}; ls.renderOrder = 6; m.add(ls); m.userData.edges = ls;
    }
    return m.userData.edges;
  }
  function refreshEdges() {
    lit.forEach((ls) => { ls.visible = false; }); lit.clear();
    const on = (m, mat) => { if (!m.visible || !m.geometry) return; const ls = edgesOf(m); ls.material = mat; ls.visible = true; lit.add(ls); };
    const sel = S.sel;
    if (sel) {
      sel.insts.forEach((o) => o.parts.forEach((p) => {
        const u = p.userData;
        if (u.mat0 && S.mode !== 'asm') p.material = (S.hl && u.mk !== S.hl) ? E.ghostPart : u.mat0;
        if (S.hl) { if (u.mk === S.hl) on(p, E.edgeMat); return; }
        if (S.mode === 'exploded') on(p, E.edgeSoft);
        else if (S.mode === 'asm') on(p, u.step === S.moving ? E.edgeMat : E.edgeSoft);
        else if (E.edgeSel) on(p, E.edgeSel);              // el mueble elegido queda marcado en el 3D
      }));
    }
    const hv = S.hover;
    if (hv && !S.hl) {
      const it = F.items[hv.n];
      if (it && it !== sel) it.insts.forEach((o) => o.parts.forEach((p) => on(p, E.edgeMat)));
      else if (it && hv.part && S.mode === 'exploded') on(hv.part, E.edgeMat);
    }
    if (S.rowHover && !S.hl) { const it = F.items[S.rowHover]; if (it && it !== sel) it.insts.forEach((o) => o.parts.forEach((p) => on(p, E.edgeMat))); }
    E.invalidate();
  }
  /* al elegir, el contorno se enciende y baja a su brillo de reposo */
  function pulseSel() {
    if (!E.edgeSel) return;
    if (S.pulse) E.cancel(S.pulse);
    E.edgeSel.opacity = 1;
    S.pulse = E.tween(1.2, (k) => { E.edgeSel.opacity = E.lerp(1, 0.45, k); }, { ease: E.ease.out });
  }
  /* las aristas se calculan de a poco cuando el navegador está libre: el primer resaltado ya no se traba */
  function prebuildEdges() {
    const list = [];
    F.order.forEach((n) => F.items[n].insts.forEach((o) => o.parts.forEach((p) => { if (p.geometry && !p.userData.edges) list.push(p); })));
    let i = 0;
    const chunk = () => {
      const end = Math.min(list.length, i + 40);
      for (; i < end; i++) if (!list[i].userData.edges) edgesOf(list[i]);
      if (i < list.length) idle(chunk);
    };
    idle(chunk);
  }

  /* --------------------------------------------------------------- puntero */
  function pickAt(e) {
    const r = E.renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, E.camera);
    const targets = []; F.order.forEach((n) => F.items[n].insts.forEach((o) => { if (o.group.visible) targets.push(o.group); }));
    const hits = ray.intersectObjects(targets, true);
    for (const h of hits) {
      let m = h.object; if (!m.visible || m.material === E.ghost) continue;   // lo desvanecido no se toca
      let part = null;
      while (m && !(m.userData && m.userData.inst)) m = m.parent;
      if (!m) continue;
      if (S.ghosted && S.sel && m.userData.inst.n !== S.sel.n) continue;
      if (h.object.userData.part) part = h.object; else if (h.object.parent && h.object.parent.userData.part) part = h.object.parent;
      return { n: m.userData.inst.n, inst: m.userData.inst, part };
    }
    return null;
  }
  let hoverRaf = 0, lastMove = null;
  function onHover(e) {
    lastMove = e;
    if (hoverRaf) return;
    hoverRaf = requestAnimationFrame(() => {
      hoverRaf = 0;
      const ev = lastMove, tip = $('#tip');
      const hit = ev && ev.pointerType !== 'touch' && !S.mont ? pickAt(ev) : null;
      const prev = S.hover;
      S.hover = hit;
      E.renderer.domElement.style.cursor = hit ? 'pointer' : '';
      if (!hit) { tip.hidden = true; if (prev) refreshEdges(); return; }
      if (!prev || prev.n !== hit.n || prev.part !== hit.part) refreshEdges();
      const d = byN[hit.n];
      let html;
      if (S.sel && S.sel.n === hit.n && hit.part && S.mode !== 'solid') {
        const u = hit.part.userData, row = d.mats.find((m) => m.key === u.mk);
        html = '<b>' + escd(u.name) + '</b><span>' + escd(row ? row.m : d.name) + '</span>';
      } else html = '<i>' + d.n + '</i><b>' + esc(d.short) + '</b><span>' + cop(d.total) + ' · ' + (d.origen === 'fabrica' ? 'se fabrica' : 'se compra') + '</span>';
      tip.innerHTML = html; tip.hidden = false;
      const r = $('#stage').getBoundingClientRect();
      const x = Math.min(ev.clientX - r.left + 16, r.width - tip.offsetWidth - 8), y = Math.min(ev.clientY - r.top + 18, r.height - tip.offsetHeight - 8);
      tip.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
    });
  }
  function onClick(e) {
    if (S.mont) return;
    const hit = pickAt(e);
    if (hit) select(hit.n, hit.inst, { via: '3d' });
    else if (S.sel && S.mode === 'solid') deselect();
  }

  /* ------------------------------------------------------- números del plano */
  const labelEls = [];
  function buildLabels() {
    const box = $('#labels');
    F.order.forEach((n) => {
      const it = F.items[n], multi = it.insts.length > 1 && unionRadius(it) > 2.6;
      (multi ? it.insts : [null]).forEach((o) => {
        const b = new T.Box3(); (o ? [o] : it.insts).forEach((x) => b.union(x.box));
        const c = b.getCenter(new T.Vector3()); if (it.lp && !o) c.add(new T.Vector3(it.lp[0], 0, it.lp[1]));
        const el = document.createElement('button'); el.type = 'button'; el.className = 'lbl'; el.title = byN[n].name; el.tabIndex = -1;
        el.innerHTML = '<span class="lbl-n">' + n + '</span><span class="lbl-t" hidden>' + esc(byN[n].short) + '</span>';
        el.addEventListener('click', () => select(n, o, { via: '3d' }));
        box.appendChild(el);
        labelEls.push({ el, n, top: new T.Vector3(c.x, b.max.y + 0.14, c.z), mid: new T.Vector3(c.x, b.max.y, c.z), kind: 'item', w: 0 });
      });
    });
    const text = (d, cls) => { const el = document.createElement('div'); el.className = cls; el.innerHTML = '<b>' + esc(d.t) + '</b><span>' + esc(d.s) + '</span>'; box.appendChild(el); labelEls.push({ el, top: d.p, mid: d.p, kind: cls }); };
    R.cotaLabels.forEach((d) => text(d, 'cota'));
    R.zoneLabels.forEach((d) => text(d, 'zona'));
    nameLabels();
  }
  /* en modo explorador y en los destacados, el número lleva el nombre del mueble */
  function nameLabels() {
    const simple = app.classList.contains('is-simple');
    labelEls.forEach((l) => {
      if (l.kind !== 'item') return;
      const hot = !!(S.hot && S.hot.has(l.n)), named = simple || hot;
      l.el.classList.toggle('is-named', named); l.el.classList.toggle('pulse', hot);
      l.el.querySelector('.lbl-t').hidden = !named;
      l.w = 0;                                          // el ancho cambió: se vuelve a medir
    });
    E.invalidate();
  }
  function syncLabels() {
    const show = S.labels || S.plan || !!S.hot;
    $('#labels').classList.toggle('is-on', show && !S.mont && S.mode === 'solid');
    $('#labels').classList.toggle('is-plan', S.plan);
    R.cotas.visible = S.plan;
    const bl = $('#btn-labels'); if (bl) bl.setAttribute('aria-pressed', S.labels || S.plan ? 'true' : 'false');
    labelEls.forEach((l) => { if (l.kind === 'item') l.el.classList.toggle('is-sel', !!S.sel && S.sel.n === l.n); });
    E.invalidate();
  }
  function setLabels(on) {
    S.labels = !!on;
    if (!S.labels && S.plan) S.plan = false;            // apagarlos en la planta también quita las cotas
    syncLabels();
  }
  /* números destacados (primera visita, recorrido): se ven aunque los números estén apagados */
  function setHot(list) {
    S.hot = list && list.length ? new Set(list.map(Number)) : null;
    nameLabels(); syncLabels();
  }
  function updateLabels() {
    if (!(S.labels || S.plan || S.hot) || S.mont || S.mode !== 'solid') return;
    const w = E.size.w, h = E.size.h, hotOnly = !!S.hot, items = [];
    for (const l of labelEls) {
      const want = l.kind === 'item' ? (!hotOnly || S.hot.has(l.n)) : (S.plan && !hotOnly);
      if (want) pv.copy(S.plan ? l.mid : l.top).project(E.camera);
      const ok = want && pv.z < 1 && pv.x > -1.05 && pv.x < 1.05 && pv.y > -1.05 && pv.y < 1.05;
      if (!ok) { if (l.shown !== false) { l.el.style.display = 'none'; l.shown = false; } continue; }
      if (l.shown !== true) { l.el.style.display = ''; l.shown = true; }
      l.x = (pv.x * 0.5 + 0.5) * w; l.y = (-pv.y * 0.5 + 0.5) * h;
      l.el.style.transform = 'translate(' + l.x.toFixed(1) + 'px,' + l.y.toFixed(1) + 'px) translate(-50%,-50%)';
      if (l.kind === 'item') { l.d = E.camPos.distanceToSquared(l.top); items.push(l); }
    }
    // despeje: si dos números se tapan, queda el más cercano a la cámara; el elegido y los destacados siempre quedan
    const keep = (l) => !!((S.sel && S.sel.n === l.n) || (S.hot && S.hot.has(l.n)));
    items.sort((a, b) => (keep(b) - keep(a)) || a.d - b.d);
    const placed = [];
    for (const l of items) {
      if (!l.w) l.w = l.el.offsetWidth || 26;
      const hide = !keep(l) && placed.some((p) => Math.abs(p.y - l.y) < 26 && Math.abs(p.x - l.x) < 1.1 * (p.w + l.w) / 2);
      if (hide !== !!l.hid) { l.hid = hide; l.el.style.visibility = hide ? 'hidden' : ''; }
      if (!hide) placed.push(l);
    }
  }

  /* ------------------------------------------------------------- inventario */
  function origenLabel(d) {
    if (d.origen !== 'fabrica') return { t: 'Se compra', title: 'Se compra listo en una tienda' };
    const metal = d.mats.some((m) => m.key === 'acero');
    return {
      t: 'Se fabrica' + (d.origenNota ? ' · ' + d.origenNota : ''),
      title: d.origenNota === 'vidriería' ? 'Lo hace una vidriería a la medida' : metal ? 'Lo hacen un taller de metal y un carpintero' : 'Lo hace un carpintero con tableros y herrajes'
    };
  }
  function buildInventory() {
    const N = DATA.items.length, nFab = DATA.items.filter((d) => d.origen === 'fabrica').length;
    const counts = { todos: N, fabrica: nFab, compra: N - nFab };
    $$('#inv [data-count]').forEach((el) => { if (counts[el.dataset.count] != null) el.textContent = counts[el.dataset.count]; });
    const ic = $('#inv-count'); if (ic) ic.textContent = N + ' elementos del plano';
    $('#inv-list').innerHTML = DATA.items.map((d, i) => {
      const u = parseInt(d.cant, 10);
      return '<li data-o="' + d.origen + '" data-q="' + esc(norm(d.n + ' ' + d.short + ' ' + d.name + ' ' + d.grupo)) + '" style="--i:' + i + '"><button type="button" class="inv-row" data-n="' + d.n + '">' +
        '<span class="num">' + d.n + '</span><span class="inv-name">' + esc(d.short) + '<small>' + (d.origen === 'fabrica' ? 'Se fabrica' : 'Se compra') + (u > 1 ? ' · ' + u + ' unidades' : '') + '</small></span>' +
        '<span class="inv-cost">' + cop(d.total) + '</span></button></li>';
    }).join('');
    $('#inv-total').innerHTML = '<span>Total del local<small>materiales y equipos</small></span><b>' + cop(DATA.presupuesto.total) + '</b>';
    $('#inv-list').addEventListener('click', (e) => { const b = e.target.closest('.inv-row'); if (b) select(+b.dataset.n, null, { force: S.mode !== 'solid', via: 'list' }); });
    $('#inv-list').addEventListener('pointerover', (e) => { const b = e.target.closest('.inv-row'); const n = b ? +b.dataset.n : null; if (n !== S.rowHover) { S.rowHover = n; refreshEdges(); } });
    $('#inv-list').addEventListener('pointerleave', () => { if (S.rowHover) { S.rowHover = null; refreshEdges(); } });
    $('#inv-filter').addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      S.filter = b.dataset.f;
      $$('#inv-filter .chip').forEach((c) => { c.classList.toggle('is-on', c === b); c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      filterInv();
    });
    const q = $('#inv-search');
    q.addEventListener('input', filterInv);
    q.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && q.value) { e.stopPropagation(); q.value = ''; filterInv(); }
      else if (e.key === 'Enter') { const li = $$('#inv-list li').find((x) => !x.hidden); if (li) select(+li.firstChild.dataset.n, null, { force: S.mode !== 'solid', via: 'list' }); }
    });
    $('#inv-total').addEventListener('click', openBudget);
  }
  /* filtro por origen y búsqueda sin tildes ni mayúsculas, por número, nombre o grupo */
  function filterInv() {
    const words = norm($('#inv-search').value.trim()).split(/\s+/).filter(Boolean);
    let shown = 0;
    $$('#inv-list li').forEach((li) => {
      const ok = (S.filter === 'todos' || li.dataset.o === S.filter) && words.every((w) => li.dataset.q.includes(w));
      li.hidden = !ok; if (ok) shown++;
    });
    $('#inv-empty').hidden = shown > 0;
    emit('filter', { shown });
  }
  function markInv() {
    $$('#inv-list .inv-row').forEach((b) => {
      const on = !!S.sel && +b.dataset.n === S.sel.n;
      b.classList.toggle('is-on', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }
  function toggleInv(on) {
    S.inv = on == null ? !S.inv : on;
    if (S.inv) { exitMontaje(true); }
    $('#inv').hidden = !S.inv; $('#btn-inv').setAttribute('aria-pressed', S.inv ? 'true' : 'false');
    layout(); if (S.sel) focus(S.sel, S.inst, S.mode !== 'solid' ? true : null, 0.8); else if (S.view && !S.mont) refit(0.8);
  }

  /* -------------------------------------------------------------------- ficha */
  const TABS = [['resumen', 'Qué es'], ['mats', 'Materiales'], ['fab', 'Cómo se hace'], ['ens', 'Cómo se arma'], ['why', 'Por qué']];
  function tabsOf(d) {
    const fab = d.origen === 'fabrica';
    return TABS.filter((t) => t[0] !== 'fab' || d.fab.length).map((t) => [t[0], !fab && t[0] === 'mats' ? 'Producto' : !fab && t[0] === 'ens' ? 'Cómo se instala' : t[1]]);
  }
  const expert = () => prefs.get('mode') === 'experto';
  /* lo técnico queda a un toque: abierto en modo experto, plegado en modo explorador */
  const pro = (label, html) => '<details class="pro"' + (expert() ? ' open' : '') + '><summary>Para expertos · ' + label + '</summary>' + html + '</details>';
  /* filas de barras; las que llevan n son botones que abren la ficha de ese mueble */
  function barList(rows, max, cls) {
    return '<ul class="bars ' + (cls || '') + '">' + rows.map((r) => {
      const label = escd(r.label);
      return '<li' + (r.n ? ' data-n="' + r.n + '"' : '') + ' title="' + label + ': ' + cop(r.v) + (r.sub ? ' — ' + escd(r.sub) : '') + '">' +
        '<span class="bar-l">' + (r.n ? '<i class="num">' + r.n + '</i><button type="button" class="bar-btn" data-n="' + r.n + '" aria-label="' + label + ': ' + cop(r.v) + '. Ver sus materiales">' + label + '</button>' : label) + '</span>' +
        '<span class="bar-t"><span class="bar-f" style="width:' + Math.max(0.6, r.v / max * 100).toFixed(2) + '%"></span></span>' +
        '<span class="bar-v">' + cop(r.v) + '</span>' + (r.sub ? '<span class="bar-s">' + escd(r.sub) + '</span>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function procHtml(pr, tag) {
    return '<' + tag + ' class="proc" data-proc="' + pr.id + '"><h4>' + esc(pr.mat) + '</h4>' + (tag === 'article' ? '<p class="uso">' + escd(pr.uso) + '</p>' : '') + '<p>' + escd(pr.proceso) + '</p>' +
      pro('Dato técnico y fuentes', '<p class="dato">' + escd(pr.dato) + '</p><p class="src">' + pr.fuentes.map((f) => '<a href="' + esc(f.u) + '" target="_blank" rel="noopener">' + esc(f.t) + '</a>').join(' · ') + '</p>') + '</' + tag + '>';
  }
  function renderPanel() {
    const it = S.sel, d = byN[it.n], p = $('#panel');
    const fab = d.origen === 'fabrica', hasParts = new Set(); it.insts[0].parts.forEach((x) => hasParts.add(x.userData.mk));
    const tabs = tabsOf(d);
    if (!tabs.find((t) => t[0] === S.tab)) S.tab = 'resumen';
    const N = DATA.items.length, idx = DATA.items.indexOf(d), prev = DATA.items[(idx + N - 1) % N], next = DATA.items[(idx + 1) % N];
    const top = d.mats.slice().sort((a, b) => b.costo - a.costo).slice(0, 5), maxC = top[0] ? top[0].costo : 1;
    const canAnim = d.seq && d.seq.length, units = parseInt(d.cant, 10), ol = origenLabel(d);
    const share = (d.total / DATA.presupuesto.total * 100);
    const sec = {};
    sec.resumen =
      '<p class="lead">' + escd(d.resumen) + '</p>' +
      '<dl class="facts"><div><dt>Medidas</dt><dd class="mono" data-fact="dims">' + escd(d.dims) + '</dd></div><div><dt>Cantidad</dt><dd>' + escd(d.cant) + '</dd></div><div class="wide"><dt>Ubicación en el plano</dt><dd>' + escd(d.ubic) + '</dd></div></dl>' +
      (it.insts[0].parts.length > 1 ? '<div class="cta"><button type="button" class="btn btn-led js-play"' + (canAnim ? '' : ' hidden') + '>' + (S.mode === 'asm' ? STR.replay : STR.play) + '</button><button type="button" class="btn js-explode" aria-pressed="' + (S.mode === 'exploded') + '" title="Mira cada pieza por separado, como un LEGO desarmado">' + STR.explode + '</button></div>' : '') +
      '<h3>' + (fab ? 'En qué se va el costo' : 'Qué se compra') + '</h3>' + barList(top.map((m) => ({ label: m.m, v: m.costo })), maxC) +
      '<p class="note">' + (fab ? 'Costo de materiales. ' : '') + 'Es el ' + (share < 1 ? share.toFixed(1).replace('.', ',') : Math.round(share)) + ' % del total del local (' + cop(DATA.presupuesto.total) + '). Precios del ' + esc(DATA.meta.fechas || DATA.meta.fecha) + '.</p>';
    sec.mats =
      '<p class="note">' + (fab ? 'El costo de tableros y cantos es la parte que le toca al mueble de las láminas y rollos completos que se compran. Toca o pasa el cursor por un material para verlo brillar en el modelo.' : 'El material es el que declara la ficha de la tienda.') + '</p>' +
      '<ul class="mats">' + d.mats.map((m) => {
        const live = fab && hasParts.has(m.key);
        const procs = (m.proc || []).map((id) => procBy[id]).filter(Boolean);
        return '<li class="mat' + (live ? ' is-live' : '') + (live && S.hl === m.key ? ' is-on' : '') + '"' + (live ? ' data-key="' + m.key + '"' : '') + '>' +
          '<div class="mat-h"><b>' + escd(m.m) + '</b><span class="mono">' + (m.costo ? cop(m.costo) : '$0') + '</span></div>' +
          '<p>' + escd(m.uso) + '</p>' +
          '<p class="mat-q pro-only"><span>' + escd(m.cant) + '</span><span>' + escd(m.pu) + '</span></p>' +
          (m.prov || m.nota ? '<p class="mat-q pro-only"><span>' + escd(m.prov || '') + '</span><span>' + escd(m.nota || '') + '</span></p>' : '') +
          (live ? '<button type="button" class="eye" data-key="' + m.key + '" aria-pressed="' + (S.pin === m.key) + '" aria-label="Ver en 3D: ' + escd(m.m) + '">Ver en 3D</button>' : '') +
          (procs.length ? '<details><summary>Cómo se fabrica este material</summary>' + procs.map((pr) => procHtml(pr, 'div')).join('') + '</details>' : '') +
          '</li>';
      }).join('') + '</ul>' +
      '<div class="total-row"><span>Total ' + (fab ? 'de materiales' : '') + '</span><b class="mono">' + cop(d.total) + '</b></div>';
    sec.fab = '<p class="note">En el taller, antes de llevar las piezas al local.</p><ol class="steps">' + d.fab.map((s) => '<li>' + escd(s) + '</li>').join('') + '</ol>';
    sec.ens =
      (canAnim ? '<div class="seq-box"><div class="seq-h"><h3>Animación de armado</h3><button type="button" class="btn btn-led js-play">' + (S.mode === 'asm' ? STR.replay : STR.play) + '</button></div><ol class="seq">' + d.seq.map((s, i) => '<li><button type="button" data-k="' + i + '"><span>' + escd(s.t) + '</span><small class="pro-only">' + esc(s.src) + '</small></button></li>').join('') + '</ol></div>' : '') +
      '<h3>' + (fab ? 'Cómo se arma en el local' : 'Cómo se instala') + '</h3><ol class="steps">' + d.ens.map((s) => '<li>' + escd(s) + '</li>').join('') + '</ol>';
    sec.why = '<ul class="why">' + d.why.map((w) => '<li><h4>' + escd(w.t) + '</h4><p>' + escd(w.d) + '</p></li>').join('') + '</ul>';

    // conserva el foco en la pestaña o en el botón del pie (anterior / siguiente) que lo tenía
    const ae = document.activeElement, had = ae && p.contains(ae);
    const keep = had ? (ae.dataset.dir ? '[data-dir="' + ae.dataset.dir + '"]' : ae.dataset.tab ? '[data-tab="' + ae.dataset.tab + '"]' : null) : null;
    p.setAttribute('aria-labelledby', 'p-title');
    p.innerHTML =
      '<div class="grabber" aria-hidden="true"></div>' +
      '<header class="p-head">' +
        '<div class="p-top"><span class="num num-lg">' + d.n + '</span><span class="pill pill-' + d.origen + '" title="' + esc(ol.title) + '">' + esc(ol.t) + '</span><span class="p-group">' + esc(d.grupo) + '</span>' +
        '<div class="p-acts"><button type="button" class="ibtn ibtn-fill" id="p-share" aria-label="Copiar enlace a esta ficha" title="Copiar enlace"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 12.4V3.2M6.6 6.4 10 3l3.4 3.4M6.2 9H4.6v8h10.8V9h-1.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button type="button" class="ibtn ibtn-fill" id="p-close" aria-label="Cerrar ficha" title="Cerrar"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div></div>' +
        '<h2 id="p-title" tabindex="-1">' + esc(d.name) + '</h2>' +
        '<div class="p-cost"><b class="mono">' + cop(d.total) + '</b><span>' + (fab ? 'en materiales' : (units > 1 ? units + ' unidades' : 'producto')) + ' · ' + escd(d.dims) + '</span></div>' +
      '</header>' +
      '<div class="tabs seg" role="tablist" aria-label="Secciones de la ficha">' + tabs.map((t) => { const on = t[0] === S.tab; return '<button type="button" role="tab" id="tab-' + t[0] + '" aria-controls="tp-' + t[0] + '" data-tab="' + t[0] + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="p-body">' + tabs.map((t) => '<section role="tabpanel" id="tp-' + t[0] + '" aria-labelledby="tab-' + t[0] + '" tabindex="0" data-panel="' + t[0] + '"' + (t[0] === S.tab ? '' : ' hidden') + '>' + sec[t[0]] + '</section>').join('') + '</div>' +
      '<footer class="p-foot"><button type="button" class="btn" data-go="' + prev.n + '" data-dir="prev" title="Mueble anterior"><span class="num">' + prev.n + '</span>' + esc(prev.short) + '</button><button type="button" class="btn" data-go="' + next.n + '" data-dir="next" title="Mueble siguiente">' + esc(next.short) + '<span class="num">' + next.n + '</span></button></footer>';
    $('.p-body', p).scrollTop = 0;
    L.ui.seg($('.tabs', p));
    if (had) focusEl((keep && $(keep, p)) || $('#p-title', p));
    emit('panel', { n: d.n, el: p });
  }
  function setTab(key) {
    const p = $('#panel'); if (!S.sel || p.hidden) return;
    const btn = $('[data-tab="' + key + '"]', p); if (!btn) return;
    S.tab = key;
    $$('[data-tab]', p).forEach((b) => { const on = b === btn; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    $$('[data-panel]', p).forEach((s) => { s.hidden = s.dataset.panel !== key; });
    $('.p-body', p).scrollTop = 0; pinHL(null);
    histSwap();
    emit('tab', { n: S.sel.n, tab: key });
  }
  /* resaltado de un material en el 3D: pasar el cursor (o enfocar «Ver en 3D») lo muestra; tocar lo fija */
  function setHL(key) {
    if (S.mode === 'asm') key = null;
    if (S.hl === key) return;
    S.hl = key;
    $$('#panel .mat').forEach((li) => li.classList.toggle('is-on', !!key && li.dataset.key === key));
    refreshEdges();
  }
  function pinHL(key) {
    S.pin = S.mode === 'asm' ? null : key;
    $$('#panel .eye').forEach((b) => b.setAttribute('aria-pressed', !!S.pin && b.dataset.key === S.pin ? 'true' : 'false'));
    setHL(S.pin);
  }
  function bindPanel() {
    const p = $('#panel');
    p.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('#p-close')) return deselect();
      if (t.closest('#p-share')) return shareLink();
      const tab = t.closest('[data-tab]'); if (tab) return setTab(tab.dataset.tab);
      const go = t.closest('[data-go]'); if (go) return select(+go.dataset.go, null, { tab: S.tab, force: true, via: 'nav' });
      if (t.closest('.js-play')) return playAsm(0);
      if (t.closest('.js-explode')) return setExplode(S.mode !== 'exploded');
      const sq = t.closest('.seq button'); if (sq) { if (S.mode !== 'asm') playAsm(+sq.dataset.k); else stepTo(+sq.dataset.k, true); return; }
      const mat = t.closest('.mat.is-live'); if (mat && !t.closest('details')) pinHL(S.pin === mat.dataset.key ? null : mat.dataset.key);
    });
    p.addEventListener('pointerover', (e) => { if (e.pointerType === 'touch' || S.pin) return; const m = e.target.closest('.mat.is-live'); if (m) setHL(m.dataset.key); });
    p.addEventListener('pointerout', (e) => { if (e.pointerType === 'touch' || S.pin) return; const m = e.target.closest('.mat.is-live'); if (m && !m.contains(e.relatedTarget)) setHL(null); });
    p.addEventListener('focusin', (e) => { const b = e.target.closest('.eye'); if (b && !S.pin) setHL(b.dataset.key); });
    // al salir el foco de la tarjeta del material, el resaltado se apaga
    p.addEventListener('focusout', (e) => {
      const m = e.target.closest && e.target.closest('.mat.is-live');
      if (!m || (e.relatedTarget && m.contains(e.relatedTarget))) return;
      if (S.pin === m.dataset.key || S.hl === m.dataset.key) pinHL(null);
    });
  }

  /* ------------------------------------------------------------------ ventanas */
  /* ventanas al estilo macOS: crecen desde el botón que las abrió, se arrastran por la barra de título,
     el semáforo cierra, minimiza hacia ese botón o amplía */
  let lastFocus = null, lastPress = null, lastPressT = 0, winDrag = null;
  /* opts: { cls, kind, from } · kind: 'budget' | 'mats' | el que pase cada módulo ('ayuda', 'historia'…) */
  function openModal(title, html, opts) {
    if (typeof opts === 'string') opts = { cls: opts };
    opts = opts || {};
    const m = $('#modal'), card = $('.modal-card'), was = !m.hidden, zoomed = was && card.classList.contains('is-zoomed');
    if (!was) lastFocus = S.returnTo || document.activeElement;
    $('#modal-title').textContent = title; $('#modal-body').innerHTML = html; $('#modal-body').scrollTop = 0;
    card.className = 'modal-card window ' + (opts.cls || '') + (zoomed ? ' is-zoomed' : '');
    S.modal = opts.kind || 'modal';
    if (!was) {
      if (winDrag) winDrag.reset();
      S.winFrom = opts.from || (lastPress && performance.now() - lastPressT < 1500 ? lastPress : lastFocus);
      m.classList.remove('is-min');
      m.hidden = false;
      L.ui.originFrom(card, S.winFrom);
      focusEl([$('#modal-close'), $('#modal-x')].find(visible) || $('#modal-close'));
      histOpen('modal');
    } else histSwap();
    emit('modal', { kind: S.modal, title, el: $('#modal-body') });
  }
  function closeModal(min) {
    const m = $('#modal'); if (m.hidden) return;
    const kind = S.modal;
    if (min === true) { L.ui.originFrom($('.modal-card'), S.winFrom); m.classList.add('is-min'); }
    m.hidden = true; S.modal = null;
    histClose('modal');
    emit('modal-close', { kind });                     // primero se libera la trampa de foco, luego se devuelve el foco
    restoreFocus(lastFocus, m);
  }
  function zoomModal() { $('.modal-card').classList.toggle('is-zoomed'); if (winDrag) winDrag.reset(); }
  /* desde las barras del presupuesto: abre la ficha del mueble en su pestaña de materiales */
  function openItemMats(n) { closeModal(); select(n, null, { tab: 'mats', force: true, via: 'list' }); }
  function openBudget() {
    const P = DATA.presupuesto, notas = P.notas || {};
    const fab = DATA.items.filter((i) => i.origen === 'fabrica').sort((a, b) => b.total - a.total), buy = DATA.items.filter((i) => i.origen === 'compra').sort((a, b) => b.total - a.total);
    const row = (i) => ({ n: i.n, label: i.short, v: i.total });
    const imp = DATA.items.find((i) => i.id === 'impresoras'), nImp = imp ? parseInt(imp.cant, 10) : 0;
    const of = (P.ofertas || []).reduce((a, o) => a + o.ahorro, 0);
    openModal('Presupuesto del local',
      '<div class="kpis"><div><span>Total en materiales y equipos (pesos colombianos)</span><b class="mono">' + cop(P.total) + '</b></div><div><span>' + fab.length + ' elementos que se fabrican</span><b class="mono">' + cop(P.fabricado) + '</b></div><div><span>' + buy.length + ' elementos que se compran</span><b class="mono">' + cop(P.comprado) + '</b></div></div>' +
      '<p class="lead">' + (nImp ? 'Las ' + palabras(nImp, 'f') + ' impresoras 3D' : 'Las impresoras 3D') + ' son el ' + Math.round(P.impresoras / P.total * 100) + ' % del total. ' + esc(P.supuestos[2]) + (P.noIncluye ? ' ' + esc(P.noIncluye) : '') + '</p>' +
      (of ? '<p class="note">Varios precios están en oferta: con precios normales el total sería ' + cop(P.total + of) + ' (+' + Math.round(of / P.total * 100) + ' %).</p>' +
        pro('Precios en oferta', '<ul class="plain">' + P.ofertas.map((o) => '<li>' + escd(o.t) + ': ' + cop(o.ahorro) + ' menos</li>').join('') + '</ul>') : '') +
      '<div class="cols"><section><h3>Se fabrica <small>materiales por mueble</small></h3>' + barList(fab.map(row), fab[0].total, 'is-click') + (notas.fabrica ? '<p class="note">' + escd(notas.fabrica) + '</p>' : '') + '</section>' +
      '<section><h3>Se compra <small>cada lista usa su propia escala</small></h3>' + barList(buy.map(row), buy[0].total, 'is-click') + (notas.compra ? '<p class="note">' + escd(notas.compra) + '</p>' : '') + '</section></div>' +
      '<div class="cols"><section><h3>Por tipo de insumo</h3>' + barList(P.rubros.map((r) => ({ label: r.r, v: r.c, sub: r.q })), P.rubros[0].c) + '</section>' +
      '<section>' + pro('Por tienda', barList(P.tiendas.map((r) => ({ label: r.r, v: r.c, sub: r.q })), P.tiendas[0].c)) + '</section></div>' +
      pro('Plan de corte de tableros', '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tablero</th><th>Formato (m)</th><th class="r">Piezas</th><th class="r">Área (m²)</th><th class="r">Láminas</th><th>Aprovechamiento</th><th class="r">Costo</th></tr></thead><tbody>' +
        P.corte.map((c) => '<tr><td>' + esc(c.t) + '</td><td class="mono">' + escd(c.f) + '</td><td class="r mono">' + c.piezas + '</td><td class="r mono">' + escd(c.area) + '</td><td class="r mono">' + c.laminas + '</td><td><span class="meter"><span style="width:' + c.ap + '%"></span></span><span class="mono">' + c.ap + ' %</span></td><td class="r mono">' + cop(c.c) + '</td></tr>').join('') +
        '</tbody></table></div><p class="note">' + escd(P.corteNota) + '</p>') +
      '<div class="cols"><section>' + pro('Supuestos de las cifras', '<ul class="plain">' + P.supuestos.map((s) => '<li>' + escd(s) + '</li>').join('') + '</ul>') + '</section>' +
      '<section>' + pro('Pendientes antes del primer corte', '<ul class="plain check">' + P.pendientes.map((s) => '<li>' + escd(s) + '</li>').join('') + '</ul>') + '</section></div>',
      { cls: 'is-wide', kind: 'budget' });
  }
  function openMats() {
    const C = DATA.catalogo, P = DATA.presupuesto;
    const nCanto = C.reduce((a, g) => a + g.filas.filter((f) => /^Canto/.test(f.m)).length, 0);
    const nIns = C.filter((g) => /^(Herrajes|Metal)/.test(g.grupo)).reduce((a, g) => a + g.filas.length, 0);
    openModal('Materiales y procesos',
      '<p class="lead">Todo el mobiliario sale de ' + P.corte.length + ' tableros, ' + nCanto + ' cantos y ' + nIns + ' herrajes, insumos y acabados, casi todos de Madecentro y Homecenter. Precios publicados en línea por cada tienda el ' + esc(DATA.meta.fechas || DATA.meta.fecha) + ', en pesos colombianos.</p>' +
      '<h3>Cómo se fabrica cada material</h3><p class="note">' + cap(palabras(DATA.procesos.length)) + ' materiales industriales componen el mobiliario. Así llega cada uno a la tienda antes de que el carpintero lo toque.</p>' +
      '<div class="procs">' + DATA.procesos.map((pr) => procHtml(pr, 'article')).join('') + '</div>' +
      '<p class="note">Dos consecuencias prácticas: el vidrio templado se pide a medida porque se templa después de cortado, así que la posición de bisagras y manija se define con la vidriería antes de fabricar. Y el aglomerado RH resiste humedad ambiental, no agua: todo canto expuesto debe ir enchapado.</p>' +
      C.map((g) => '<h3>' + esc(g.grupo) + '</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Material</th><th>Presentación</th><th>Precio (COP)</th><th>Proveedor</th><th>Nota</th></tr></thead><tbody>' +
        g.filas.map((f) => '<tr><td><a href="' + esc(f.u) + '" target="_blank" rel="noopener">' + escd(f.m) + '</a></td><td>' + escd(f.pres) + '</td><td class="mono">' + escd(f.precio) + '</td><td>' + esc(f.prov) + '</td><td>' + escd(f.nota) + '</td></tr>').join('') + '</tbody></table></div>').join(''),
      { cls: 'is-wide', kind: 'mats' });
  }

  /* enlace directo a lo que se ve (#m7/materiales, #presupuesto…) */
  function copyText(t) {
    const a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0';
    document.body.appendChild(a); a.select(); let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    a.remove(); return ok;
  }
  function shareLink() {
    const url = location.href.split('#')[0] + currentRoute(), name = S.sel ? byN[S.sel.n].short : null;
    const ok = () => L.ui.toast('Enlace copiado', name ? 'Abre directamente la ficha de ' + name + '.' : 'Abre la página en esta misma vista.', 'link');
    const fail = () => (copyText(url) ? ok() : L.ui.toast('No se pudo copiar', url, 'err', 8000));
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, fail); else fail();
    return url;
  }
  /* el local completo en .glb, para Unreal Engine, Blender, Twinmotion o D5 */
  let exporting = false;
  async function downloadGLB() {
    if (exporting) return;
    exporting = true;
    const t = L.ui.toast('Preparando el modelo 3D', 'Muros, mobiliario pieza por pieza, materiales y luces.', 'cube', 0);
    const el = $('#toasts') && $('#toasts').lastElementChild, body = el && el.querySelector('p');
    const say = (msg) => { if (t && t.set) t.set(msg); else if (body && body.isConnected) body.textContent = msg; };
    const close = () => { if (t && t.close) t.close(); else if (el && el.isConnected) el.click(); };
    try {
      exitMontaje(true); deselect(true);
      const views = Object.keys(VIEWS).map((k) => Object.assign({ name: VIEW_NAMES[k] }, VIEWS[k]));
      const bytes = await L.exporter.download({ views, progress: (f) => say('Preparando… ' + Math.round(f * 100) + ' %') });
      const mb = (bytes / 1048576).toFixed(1).replace('.', ',');
      close();
      L.ui.toast('Modelo 3D listo', 'local-impresion-3d.glb · ' + mb + ' MB. Ábrelo en Unreal Engine, Blender o Twinmotion.', 'cube', 6000);
    } catch (err) {
      console.error(err);
      close();
      L.ui.toast('No se pudo exportar', 'Revisa la conexión: el exportador se descarga al pedir el archivo.', 'err', 7000);
    }
    exporting = false;
  }

  /* -------------------------------------------------------- montaje del local */
  function openMontaje() {
    if (S.mont) return;
    S.prevView = S.view;
    deselect(true, true); toggleInv(false);
    S.view = null; markViews(null);
    $('#btn-montaje').setAttribute('aria-pressed', 'true');
    const M = DATA.montaje, N = M.pasos.length;
    $('#mont').innerHTML =
      '<div class="inv-head"><h2>' + STR.montaje + '</h2><p>' + escd(M.intro) + '</p></div>' +
      '<div class="mont-now" aria-live="polite"><span class="mont-k"></span> <b></b> <span></span></div>' +
      '<div class="mont-ctl"><button type="button" class="ibtn" id="mont-prev" aria-label="Paso anterior">' + ICON_PREV + '</button>' +
        '<button type="button" class="ibtn ibtn-led" id="mont-play" aria-label="Pausar el montaje">' + ICON_PAUSE + '</button>' +
        '<button type="button" class="ibtn" id="mont-next" aria-label="Paso siguiente">' + ICON_NEXT + '</button>' +
        '<button type="button" class="btn" id="mont-more" aria-expanded="false" aria-controls="mont-body">Ver los ' + N + ' pasos</button>' +
        '<button type="button" class="btn" id="mont-exit">' + STR.exit + '</button></div>' +
      '<div class="mont-body" id="mont-body"><h3>' + cap(palabras(M.frentes.length)) + ' equipos trabajan al mismo tiempo</h3><div class="frentes">' + M.frentes.map((f) => '<div><b>' + esc(f.t) + '</b>' + f.d.map((x) => '<span>' + escd(x) + '</span>').join('') + '</div>').join('') + '</div>' +
      '<h3>Montaje en el local <small>con piso, techo y enchufes ya terminados</small></h3><ol class="mont-steps">' + M.pasos.map((p, i) => '<li><button type="button" data-k="' + i + '"><b>' + escd(p.t) + '</b><span>' + escd(p.d) + '</span></button></li>').join('') + '</ol>' +
      '<p class="note">' + escd(M.nota) + '</p></div>';
    $('#mont').hidden = false; S.mont = { step: -1, playing: false }; $('#hint').hidden = true;
    syncLabels(); layout();
    const a = S.usable.w / S.usable.h;
    E.flyTo({ target: new T.Vector3(0, 0.6, 0), theta: 0.55, phi: 0.82, radius: Math.min(25, 14 * Math.max(1, 1.15 / a)) }, 1.4);
    histOpen('montaje');
    emit('montaje', { open: true });
    playMontaje(0);
  }
  function montState(k) {       // deja a la vista lo montado hasta el paso k (inclusive)
    const M = DATA.montaje, shown = new Set();
    M.pasos.forEach((p, i) => { if (i <= k) p.items.forEach((t) => F.items[t].insts.forEach((o) => shown.add(o))); });
    F.order.forEach((n) => F.items[n].insts.forEach((o) => { o.group.visible = shown.has(o); o.group.position.copy(o.home); }));
    E.setLed(k >= M.pasos.length - 1 ? 1 : 0.1);
  }
  function setMontPlay(playing, finished) {
    const b = $('#mont-play'); if (!b) return;
    b.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    b.setAttribute('aria-label', playing ? 'Pausar el montaje' : finished ? 'Repetir el montaje' : 'Continuar el montaje');
  }
  function markMont(k) {
    const N = DATA.montaje.pasos.length;
    $$('#mont .mont-steps li').forEach((li, j) => {
      const on = j === k;
      li.classList.toggle('is-on', on); li.classList.toggle('is-done', j < k);
      if (on) { li.setAttribute('aria-current', 'step'); li.scrollIntoView({ block: 'nearest', behavior: E.reduced ? 'auto' : 'smooth' }); } else li.removeAttribute('aria-current');
    });
    const p = DATA.montaje.pasos[Math.min(k, N - 1)], now = $('#mont .mont-now');
    if (now && p) { $('.mont-k', now).textContent = k >= N ? 'Listo · ' + N + ' de ' + N + ' pasos' : 'Paso ' + (k + 1) + ' de ' + N; $('b', now).textContent = dec(p.t); $('span:last-child', now).textContent = dec(p.d); }
  }
  function playMontaje(k) {
    const M = DATA.montaje, st = S.mont; if (!st) return;
    const N = M.pasos.length; k = E.clamp(k, 0, N - 1);
    const gen = ++S.gen; stopTweens();
    st.playing = true; st.step = k;
    montState(k - 1);
    const p = M.pasos[k], landed = new Set(); let i = 0, total = 0.4;
    // el primer ejemplar de cada mueble avisa una vez cuando termina de caer en su sitio
    const land = (t) => { if (gen !== S.gen || landed.has(t)) return; landed.add(t); emit('montaje-land', { n: t, k }); };
    p.items.forEach((t) => F.items[t].insts.forEach((o, j) => {
      const delay = 0.35 + i * 0.16; i++;
      o.group.visible = false;
      const h0 = 2.2;
      track(E.tween(0.85, (e) => { o.group.visible = true; o.group.position.copy(o.home); o.group.position.y += h0 * (1 - e); }, { delay, ease: E.ease.outQuint, done: j === 0 ? () => land(t) : null }));
      total = delay + 0.85;
    }));
    if (p.led) { track(E.tween(1.8, (e) => E.setLed(E.lerp(0.1, 1, e)), { delay: total, ease: E.ease.inOut })); total += 1.8; }
    markMont(k); setMontPlay(true);
    E.shadowDirty = true;
    emit('montaje-step', { k, count: N, title: p.t });
    track(after(total + 1.3, () => {
      if (gen !== S.gen || !S.mont || !S.mont.playing) return;
      p.items.forEach(land);                            // en un equipo lento el reloj puede adelantarse al último cuadro
      if (k < N - 1) playMontaje(k + 1);
      else { S.mont.playing = false; setMontPlay(false, true); markMont(N); emit('montaje-done', {}); }
    }));
  }
  function pauseMontaje() {
    const st = S.mont; if (!st || !st.playing) return;
    st.playing = false; S.gen++; stopTweens(); montState(st.step); setMontPlay(false); E.shadowDirty = true; E.invalidate();
  }
  function exitMontaje(quiet, swap) {
    if (!S.mont) return;
    S.gen++; stopTweens(); S.mont = null;
    F.order.forEach((n) => F.items[n].insts.forEach((o) => { o.group.visible = true; o.group.position.copy(o.home); }));
    E.setLed(1);
    const mt = $('#mont'); mt.hidden = true; mt.classList.remove('is-tall');
    $('#hint').hidden = !!S.sel;
    $('#btn-montaje').setAttribute('aria-pressed', 'false');
    E.shadowDirty = true; syncLabels(); layout();
    if (!swap) histClose('montaje');
    emit('montaje', { open: false });
    if (!quiet) goView(S.prevView || 'aerea');
    rescue($('#btn-montaje'));
  }

  /* --------------------------------------------------- búsqueda (Spotlight) */
  /* íconos propios; el resto (gráfica, cubo) viene del juego compartido L.ui.icon */
  const SIC = {
    view: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.8 6.8h3.1l1.4-2h5.4l1.4 2h3.1v9.4H2.8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10" cy="11.3" r="2.8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    stack: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3 17 7l-7 4-7-4zM3 10.5l7 4 7-4M3 14l7 4 7-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    house: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16.2V9l6-5 6 5v7.2M8 16.2v-4h4v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    pin: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17.4s-5.2-4.6-5.2-8.6a5.2 5.2 0 1 1 10.4 0c0 4-5.2 8.6-5.2 8.6z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10" cy="8.8" r="1.8" fill="currentColor"/></svg>'
  };
  const icon = (n) => (L.ui.icon && L.ui.icon(n)) || SIC[n] || '';
  const SP = { list: [], k: 0, from: null, base: null, all: null };
  function spotEntries() {
    if (!SP.base) {
      const items = DATA.items.map((d) => ({ sec: 'Mobiliario', ic: String(d.n), t: d.short, s: d.name + ' · ' + (d.origen === 'fabrica' ? 'se fabrica' : 'se compra'), r: cop(d.total), q: norm(d.n + ' ' + d.short + ' ' + d.name + ' ' + d.grupo + ' ' + (d.origen === 'fabrica' ? 'fabrica' : 'compra')), run: () => select(d.n, null, { force: true, via: 'search' }) }));
      const views = Object.keys(VIEWS).map((k) => ({ sec: 'Vistas', ic: icon('view'), t: 'Vista ' + VIEW_NAMES[k], s: 'Llevar la cámara a esta vista', q: norm('vista camara ' + VIEW_NAMES[k] + ' ' + k), run: () => goView(k) }));
      const acts = [
        { ic: icon('chart'), t: 'Presupuesto', s: 'Cuánto cuesta: total, costo por mueble, por insumo y por tienda', q: 'presupuesto costos cuanto cuesta total precio dinero corte', run: () => openBudget() },
        { ic: icon('stack'), t: 'Materiales y procesos', s: 'Catálogo de precios y cómo se fabrica cada material', q: 'materiales catalogo procesos precios tiendas', run: () => openMats() },
        { ic: icon('house'), t: STR.montaje, s: 'Mira cómo se arma toda la tienda en ' + palabras(DATA.montaje.pasos.length) + ' pasos', q: 'montaje armar local tienda armado fabricacion orden pasos', run: () => openMontaje() },
        { ic: icon('pin'), t: 'Números del plano', s: 'Mostrar u ocultar el número de cada mueble', q: 'numeros rotulos etiquetas plano nombres', run: () => setLabels(!(S.labels || S.plan)) },
        { ic: icon('cube'), t: 'Descargar modelo 3D (.glb)', s: 'Para Unreal Engine, Blender, Twinmotion o D5', q: 'descargar exportar glb gltf unreal blender twinmotion modelo', run: () => downloadGLB() }
      ].map((a) => Object.assign({ sec: 'Acciones' }, a, { q: norm(a.q + ' ' + a.t) }));
      SP.base = acts.concat(views, items);
    }
    // entradas de otros módulos (L.ext.spot): se piden cada vez, por si cambiaron
    const seen = new Set(SP.base.map((e) => e.t)), more = [];
    ext.spot.forEach((f) => {
      let list = [];
      try { list = f() || []; } catch (err) { console.error('[L3D.ext.spot]', err); }
      list.forEach((e) => { if (!e || !e.t || seen.has(e.t)) return; seen.add(e.t); more.push(Object.assign({ sec: 'Más', ic: '' }, e, { q: norm([e.q, e.t].filter(Boolean).join(' ')) })); });
    });
    return (SP.all = SP.base.concat(more));
  }
  function spotRender() {
    const q = norm($('#spot-q').value.trim()), words = q.split(/\s+/).filter(Boolean);
    let list = (SP.all || spotEntries()).filter((e) => words.every((w) => e.q.includes(w)));
    if (q) list = list.map((e, i) => [e, (norm(e.t).startsWith(q) ? 0 : 1) * 1000 + i]).sort((a, b) => a[1] - b[1]).map((a) => a[0]);
    SP.list = list; SP.k = Math.min(SP.k, Math.max(0, list.length - 1));
    let sec = '', html = '';
    list.forEach((e, i) => {
      if (!q && e.sec !== sec) { sec = e.sec; html += '<li class="spot-sec" role="presentation">' + esc(sec) + '</li>'; }
      html += '<li class="spot-item' + (i === SP.k ? ' is-on' : '') + '" role="option" id="spot-o' + i + '" data-i="' + i + '" aria-selected="' + (i === SP.k) + '"><span class="spot-ic">' + (e.ic || '') + '</span><span><b>' + esc(e.t) + '</b><small>' + esc(e.s || '') + '</small></span><em>' + esc(e.r || '') + '</em></li>';
    });
    $('#spot-list').innerHTML = html || '<li class="spot-empty" role="option" aria-disabled="true" aria-selected="false">Sin resultados para «' + esc($('#spot-q').value.trim()) + '»</li>';
    $('#spot-q').setAttribute('aria-expanded', list.length ? 'true' : 'false');
    $('#spot-q').setAttribute('aria-activedescendant', list.length ? 'spot-o' + SP.k : '');
  }
  function spotMove(k) {
    if (!SP.list.length) return;
    SP.k = (k + SP.list.length) % SP.list.length;
    $$('#spot-list .spot-item').forEach((li) => { const on = +li.dataset.i === SP.k; li.classList.toggle('is-on', on); li.setAttribute('aria-selected', on); if (on) li.scrollIntoView({ block: 'nearest' }); });
    $('#spot-q').setAttribute('aria-activedescendant', 'spot-o' + SP.k);
  }
  function openSpot() {
    if (!$('#spot').hidden) return;
    SP.from = document.activeElement; SP.k = 0;
    spotEntries();
    $('#spot-q').value = ''; spotRender();
    $('#spot').hidden = false; $('#spot-q').focus();
    emit('spot', { open: true });
  }
  function closeSpot(keep) {
    const sp = $('#spot'); if (sp.hidden) return;
    sp.hidden = true;
    emit('spot', { open: false });
    if (!keep) restoreFocus(SP.from, sp);
  }
  function runSpot(i) {
    const e = SP.list[i]; if (!e) return;
    const from = SP.from;
    closeSpot(true);
    if (!$('#modal').hidden) closeModal();
    // quien abrió la búsqueda recibe el foco al cerrar lo que se abra desde ella
    const back = visible(from) ? from : null;
    S.returnTo = back;
    try { e.run(); } catch (err) { console.error(err); }
    S.returnTo = null;
    if (focusLost()) { if (S.sel && !$('#panel').hidden) focusTitle(); else restoreFocus(back, $('#spot')); }
  }
  function bindSpot() {
    const q = $('#spot-q');
    q.addEventListener('input', () => { SP.k = 0; spotRender(); });
    q.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); spotMove(SP.k + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); spotMove(SP.k - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); runSpot(SP.k); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeSpot(); }
    });
    $('#spot-list').addEventListener('pointermove', (e) => { const li = e.target.closest('.spot-item'); if (li && +li.dataset.i !== SP.k) spotMove(+li.dataset.i); });
    $('#spot-list').addEventListener('click', (e) => { const li = e.target.closest('.spot-item'); if (li) runSpot(+li.dataset.i); });
    $('#spot').addEventListener('click', (e) => { if (e.target.id === 'spot' || e.target.closest('#spot-cancel')) closeSpot(); });
    $('#btn-search').addEventListener('click', openSpot);
  }

  /* ----------------------------------- ficha como hoja inferior en pantallas angostas */
  function bindSheet() {
    const p = $('#panel');
    let y0 = null, dy = 0, t0 = 0, tap = false;
    p.addEventListener('pointerdown', (e) => {
      if (!app.classList.contains('is-narrow') || app.classList.contains('is-land') || !e.target.closest('.grabber, .p-head') || e.target.closest('button')) return;
      y0 = e.clientY; dy = 0; t0 = performance.now(); tap = !!e.target.closest('.grabber');
      p.classList.add('is-dragging');
      try { p.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
    });
    p.addEventListener('pointermove', (e) => {
      if (y0 == null) return;
      dy = e.clientY - y0;
      p.style.translate = '0 ' + (dy < 0 ? dy * 0.25 : dy).toFixed(1) + 'px';    // hacia arriba ofrece resistencia
    });
    const end = () => {
      if (y0 == null) return;
      const v = dy / Math.max(1, performance.now() - t0);
      y0 = null; p.classList.remove('is-dragging'); p.style.translate = '';
      const tall = p.classList.contains('is-tall');
      if (Math.abs(dy) < 5 && tap) p.classList.toggle('is-tall');
      else if (dy > 110 || v > 0.6) { if (tall) p.classList.remove('is-tall'); else return deselect(); }
      else if (dy < -40 || v < -0.5) p.classList.add('is-tall');
      else return;
      setTimeout(layout, 520);
    };
    p.addEventListener('pointerup', end); p.addEventListener('pointercancel', end);
  }

  /* ------------------------------------------------------------------- rutas */
  const base = () => location.pathname + location.search;
  /* '#m7/materiales' → { kind: 'card', n: 7, tab: 'mats' }; null si no es una ruta conocida */
  function parseRoute(hash) {
    let h = String(hash || '').replace(/^#/, '');
    try { h = decodeURIComponent(h); } catch (err) { /* se usa tal cual */ }
    h = h.trim();
    if (!h) return null;
    let m = /^m(\d+)(?:\/([a-z]+))?$/i.exec(h);
    if (m) {
      const n = +m[1];
      if (!byN[n] || !F.items[n]) return null;
      return { kind: 'card', n, tab: m[2] ? SLUG_TAB[m[2].toLowerCase()] || null : null };
    }
    m = /^vista\/([a-z]+)$/i.exec(h);
    if (m) { const k = m[1].toLowerCase(), v = VIEWS[k] ? k : VIEW_KEYS[k]; return v ? { kind: 'view', view: v } : null; }
    if (h === 'presupuesto') return { kind: 'modal', modal: 'budget' };
    if (h === 'materiales') return { kind: 'modal', modal: 'mats' };
    if (h === 'montaje') return { kind: 'montaje' };
    const i = h.indexOf('/'), head = i < 0 ? h : h.slice(0, i), rest = i < 0 ? '' : h.slice(i + 1);
    if (typeof ext.routes[head] === 'function') return { kind: 'ext', head, rest };
    return null;
  }
  /* la ruta de lo que se ve ahora (la capa de arriba manda) */
  function currentRoute() {
    if (S.modal && !$('#modal').hidden) {
      const h = S.modal === 'budget' ? '#presupuesto' : S.modal === 'mats' ? '#materiales' : typeof ext.routes[S.modal] === 'function' ? '#' + S.modal : '';
      if (h) return h;
    }
    if (S.sel) return '#m' + S.sel.n + (TAB_SLUG[S.tab] ? '/' + TAB_SLUG[S.tab] : '');
    if (S.mont) return '#montaje';
    return '';
  }
  /* aplica una ruta como estado de destino: cierra lo que no nombra (búsqueda, ventana, ficha, montaje)
     y abre lo que nombra. record = false (Atrás, Adelante, enlace) no escribe en el historial. */
  function applyRoute(r, record) {
    S.routing = !record;
    try {
      closeSpot();
      const keepModal = r && ((r.kind === 'modal' && S.modal === r.modal) || (r.kind === 'ext' && S.modal === r.head));
      if (!keepModal) closeModal();
      if (!r) { if (S.sel) deselect(); if (S.mont) exitMontaje(); }
      else if (r.kind === 'card') {
        if (!S.sel || S.sel.n !== r.n) select(r.n, null, { tab: r.tab || undefined, force: true, via: 'route' });
        else if (r.tab && r.tab !== S.tab) setTab(r.tab);
      } else if (r.kind === 'view') goView(r.view);
      else if (r.kind === 'modal') { if (S.modal !== r.modal) { if (r.modal === 'budget') openBudget(); else openMats(); } }
      else if (r.kind === 'montaje') { if (!S.mont) openMontaje(); }
      else if (r.kind === 'ext') { try { ext.routes[r.head](r.rest); } catch (err) { console.error('[L3D.ext.routes] ' + r.head, err); } }
    } finally { S.routing = false; }
    S.lastHash = location.hash;
  }
  /* L.api.route('#m7'): como seguir un enlace dentro de la página */
  function route(hash) {
    const r = parseRoute(hash), empty = !String(hash || '').replace(/^#/, '').trim();
    if (!r && !empty) return false;
    applyRoute(r, true);
    return true;
  }

  /* historial: pushState al abrir una capa desde cero, replaceState al cambiar de ficha o de pestaña,
     history.back() al cerrar una capa cuya entrada puso la aplicación. Mientras vuelve, lo demás espera. */
  const H = { pending: 0, ops: [] };
  function layerOpen(layer) { return layer === 'card' ? !!S.sel : layer === 'modal' ? !$('#modal').hidden : layer === 'montaje' ? !!S.mont : false; }
  function histWrite(op, layer) {
    if (S.routing || !S.booted) return;
    if (H.pending) { H.ops.push([op, layer]); return; }
    const url = base() + currentRoute();
    try {
      if (op === 'push') history.pushState({ bf: 1, layer }, '', url);
      else history.replaceState(op === 'clear' ? null : history.state, '', url);
    } catch (err) { /* sin historial */ }
    S.lastHash = location.hash;
  }
  const histOpen = (layer) => histWrite('push', layer);
  const histSwap = () => histWrite('replace');
  function histClose(layer) {
    if (S.routing || !S.booted) return;
    if (H.pending) { H.ops.push(['replace']); return; }
    const st = history.state;
    if (st && st.bf && st.layer === layer) { H.pending++; try { history.back(); } catch (err) { H.pending--; } return; }
    histWrite(st && st.bf ? 'replace' : 'clear');
  }
  function onPop() {
    if (H.pending) {
      H.pending--;
      if (H.pending) return;
      const st = history.state, ops = H.ops.splice(0);
      // la entrada anterior era de una capa que ya se cerró por otro camino: también se descarta
      if (!ops.length && st && st.bf && !layerOpen(st.layer)) { H.pending++; history.back(); return; }
      const push = ops.find((o) => o[0] === 'push');
      if (push) histWrite('push', push[1]); else histWrite(st && st.bf ? 'replace' : 'clear');
      return;
    }
    onNav();
  }
  function onNav(e) {
    if (e && e.type === 'hashchange' && (H.pending || location.hash === S.lastHash)) return;
    const r = parseRoute(location.hash);
    if (!S.ready) { S.pending = r; S.lastHash = location.hash; return; }
    if (location.hash && !r) { try { history.replaceState(history.state, '', base() + currentRoute()); } catch (err) { /* sin historial */ } S.lastHash = location.hash; return; }
    applyRoute(r, false);
  }

  /* ------------------------------------------------------------------- eventos */
  function bindUI() {
    const U = L.ui;
    ['#panel', '#inv', '#mont'].forEach((q) => U.animated($(q), 460));
    ['#actions', '#stepper', '#hint'].forEach((q) => U.animated($(q), 340));
    U.animated($('#tip'), 150); U.animated($('#modal'), 520); U.animated($('#spot'), 280);
    U.seg($('#views')); U.seg($('#inv-filter'));
    markViews(S.view);
    const kk = U.isMac ? '⌘K' : 'Ctrl+K';
    $('#kbd-k').textContent = U.isMac ? '⌘K' : 'Ctrl K';
    $('#btn-search').title = 'Buscar muebles, vistas y acciones (' + kk + ')';
    $('#btn-search').setAttribute('aria-label', 'Buscar (' + kk + ')');
    $('#btn-search').setAttribute('aria-keyshortcuts', 'Control+K Meta+K /');
    winDrag = U.windowDrag($('.modal-card'), $('.modal-head'), zoomModal);
    bindSpot(); bindSheet();
    $('#views').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) goView(b.dataset.view); });
    $('#brand').addEventListener('click', (e) => { e.preventDefault(); goView('fachada'); });
    $('#btn-inv').addEventListener('click', () => toggleInv());
    $('#btn-budget').addEventListener('click', openBudget);
    $('#btn-mats').addEventListener('click', openMats);
    $('#btn-montaje').addEventListener('click', () => (S.mont ? exitMontaje() : openMontaje()));
    const bl = $('#btn-labels'); if (bl) bl.addEventListener('click', () => setLabels(!(S.labels || S.plan)));
    $('#act-explode').addEventListener('click', () => setExplode(S.mode !== 'exploded'));
    $('#act-play').addEventListener('click', () => playAsm(0));
    $('#act-spin').addEventListener('click', () => { E.autoRotate = !E.autoRotate; $('#act-spin').setAttribute('aria-pressed', E.autoRotate ? 'true' : 'false'); E.invalidate(); });
    $('#st-prev').addEventListener('click', () => stepTo(S.step - 1, false));
    $('#st-next').addEventListener('click', () => stepTo(S.step + 1, true));
    $('#st-play').addEventListener('click', () => {
      if (!S.sel) return;
      if (S.playing) { S.playing = false; updateStepper(); return; }
      const seq = byN[S.sel.n].seq; S.playing = true; S.done = false;
      asmStep(S.step >= seq.length - 1 ? 0 : S.step + 1, true);
    });
    $('#st-dots').addEventListener('click', (e) => { const d = e.target.closest('.dot'); if (d) stepTo(+d.dataset.k, true); });
    $('#st-exit').addEventListener('click', () => exitAsm());
    $('#z-in').addEventListener('click', () => E.zoomBy(0.78));
    $('#z-out').addEventListener('click', () => E.zoomBy(1.28));
    $('#modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal' || e.target.closest('#modal-close, #modal-x')) return closeModal();
      if (e.target.closest('#modal-min')) return closeModal(true);
      if (e.target.closest('#modal-zoom')) return zoomModal();
      const b = e.target.closest('.bars.is-click [data-n]'); if (b) openItemMats(+b.dataset.n);
    });
    $('#mont').addEventListener('click', (e) => {
      const st = S.mont; if (!st) return;
      const N = DATA.montaje.pasos.length;
      if (e.target.closest('#mont-exit')) return exitMontaje();
      if (e.target.closest('#mont-play')) { if (st.playing) pauseMontaje(); else playMontaje(st.step >= N - 1 ? 0 : st.step + 1); return; }
      if (e.target.closest('#mont-prev')) return playMontaje(Math.max(0, st.step - 1));
      if (e.target.closest('#mont-next')) return playMontaje(Math.min(N - 1, st.step + 1));
      const more = e.target.closest('#mont-more');
      if (more) {
        const tall = $('#mont').classList.toggle('is-tall');
        more.setAttribute('aria-expanded', tall ? 'true' : 'false');
        more.textContent = tall ? 'Ocultar los pasos' : 'Ver los ' + N + ' pasos';
        if (!app.classList.contains('is-narrow')) { const ol = $('#mont .mont-steps'); if (ol) ol.scrollIntoView({ block: 'nearest', behavior: E.reduced ? 'auto' : 'smooth' }); }
        setTimeout(layout, 520);
        return;
      }
      const b = e.target.closest('.mont-steps button'); if (b) playMontaje(+b.dataset.k);
    });
    bindPanel();
    // ¿el último gesto fue del teclado o del puntero? (decide a dónde va el foco al abrir una ficha)
    document.addEventListener('keydown', () => { S.kbd = true; }, true);
    document.addEventListener('pointerdown', (e) => {
      S.kbd = false;
      if (e.target === E.renderer.domElement) { S.held = true; S.moved = false; }   // empieza un gesto sobre el modelo
      const b = e.target.closest && e.target.closest('button, .inv-foot'); if (b) { lastPress = b; lastPressT = performance.now(); }
    }, true);
    const release = () => { S.held = false; };
    window.addEventListener('pointerup', release, true); window.addEventListener('pointercancel', release, true);
    window.addEventListener('keydown', (e) => {
      // ⌘K / Ctrl+K abren la búsqueda desde cualquier parte, como Spotlight
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if ($('#spot').hidden) openSpot(); else closeSpot(); return; }
      if (!$('#spot').hidden) { if (e.key === 'Escape') closeSpot(); return; }
      if (e.defaultPrevented) return;                   // el lienzo ya usó la tecla (flechas para girar)
      // las teclas sueltas solo cuentan con el foco en la página, el modelo o la ficha (no en un control)
      const ae = document.activeElement;
      const free = !ae || ae === document.body || ae === $('#gl') || ae === $('#panel') || ae.id === 'p-title';
      const keys = free && prefs.get('keys') !== false && !e.altKey && !e.ctrlKey && !e.metaKey;
      if (keys && e.key === '?') { e.preventDefault(); emit('help', {}); return; }
      if (keys && e.key === '/') { e.preventDefault(); openSpot(); return; }
      if (e.key === 'Escape') { if (!$('#modal').hidden) return closeModal(); if (S.mode === 'asm') return exitAsm(); if (S.mode === 'exploded') return setExplode(false); if (S.mont) return exitMontaje(); if (S.sel) return deselect(); }
      if (!keys || !$('#modal').hidden || !S.sel) return;
      const N = DATA.items.length, idx = DATA.items.indexOf(byN[S.sel.n]);
      if (e.key === 'ArrowRight') select(DATA.items[(idx + 1) % N].n, null, { tab: S.tab, force: true, via: 'nav' });
      else if (e.key === 'ArrowLeft') select(DATA.items[(idx + N - 1) % N].n, null, { tab: S.tab, force: true, via: 'nav' });
      else if (e.key === 'e' || e.key === 'E') { if (!$('#actions').hidden || S.mode === 'exploded') setExplode(S.mode !== 'exploded'); }
    });
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onNav);
    E.onClick = onClick; E.onHover = onHover;
    E.afterRender = (moving) => {
      updateLabels();
      ext.afterRender.forEach((fn) => { try { fn(moving); } catch (err) { console.error('[L3D.ext.afterRender]', err); } });
    };
    E.onResize = () => { layout(); };
    E.onUserMove = () => {
      $('#tip').hidden = true; clearView();
      // una vez por gesto: mientras el dedo o el botón siguen abajo, o hasta 0,4 s sin rueda ni zoom
      const now = performance.now();
      if (S.held ? !S.moved : now - S.moveT > 400) emit('usermove', {});
      S.moved = true; S.moveT = now;
      ready();
    };
    E.onResetView = () => (S.view ? refit(0.8) : goView('fachada'));
    // al cambiar de modo (explorador / experto) se vuelve a dibujar lo abierto, sin perder la pestaña
    bus.on('prefs', (d) => {
      if (d.key !== 'mode') return;
      nameLabels();
      if (S.sel && !$('#panel').hidden) { renderPanel(); syncPanelState(); }
      if (!$('#modal').hidden && (S.modal === 'budget' || S.modal === 'mats')) { if (S.modal === 'budget') openBudget(); else openMats(); }
    });
  }

  /* -------------------------------------------------------------------- inicio */
  function fail(kind, err) {
    if (L.bootFail) { L.bootFail(kind, err); return; }
    $('#intro-msg').textContent = kind === 'engine' ? 'No se pudo cargar el motor 3D. Revisa la conexión y recarga la página.' : 'Este navegador no pudo iniciar el modelo 3D (WebGL).';
  }
  /* «listo»: una sola vez, cuando termina el vuelo de entrada, a los 4,5 s o al primer gesto */
  function ready() {
    if (S.ready || !S.booted) return;
    S.ready = true; clearTimeout(S.readyT);
    document.documentElement.dataset.bfReady = '1';
    const r = S.pending, hash = location.hash; S.pending = null;
    // si el visitante ya abrió algo durante la entrada, manda lo que eligió
    if (r && !S.sel && !S.mont && $('#modal').hidden) applyRoute(r, false);
    emit('ready', { route: r ? hash : '' });
    prebuildEdges();
  }
  async function boot() {
    const sub = $('#intro-sub') || $('.intro-sub');
    if (sub && DATA.meta.lema) sub.textContent = DATA.meta.lema.join(' · ');
    // ?texto: la información sin 3D (js/textmode.js); el modelo ni siquiera se arranca
    if (/texto/.test(location.search) && L.textMode) { $('#intro').hidden = true; L.textMode.show('pedido'); return; }
    if (!T || !E || !F || !R) { fail('engine'); return; }
    Y = new T.Vector3(0, 1, 0); ray = new T.Raycaster(); ndc = new T.Vector2(); pv = new T.Vector3();
    /* avance de la carga: js/boot-guard.js lo dibuja si está; si no, se escribe aquí y la barra deja de
       moverse sola (una animación infinita le roba tiempo al motor en equipos sin tarjeta de video) */
    const bar = $('.intro-bar span');
    const say = (p, msg) => {
      if (L.bootProgress) { L.bootProgress(p, msg); return; }
      if (msg) $('#intro-msg').textContent = msg;
      if (bar) { bar.style.animation = 'none'; bar.style.transform = 'none'; bar.style.width = Math.max(4, Math.round(p * 100)) + '%'; }
    };
    const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
    let r3 = null, render = null;
    try {
      say(0, 'Cortando la madera…');
      if (E.initAsync) await E.initAsync($('#gl'), (p, msg) => say(p, msg)); else { await frame(); E.init($('#gl')); }
      // mientras se arma el local, el motor no dibuja cuadros a medias: cada luz nueva obligaría a compilar
      // otra vez todos los sombreadores (segundos en equipos lentos). La pantalla de inicio tapa el lienzo.
      r3 = E.renderer; render = r3.render; r3.render = function () {};
      say(0.6, 'Levantando los muros…'); await frame();
      R.build(E.scene);
      say(0.75, 'Colocando los muebles…'); await frame();
      F.build();
      say(0.9, 'Encendiendo las luces…'); await frame();
      E.finalize();                                     // es instantáneo: no merece un cuadro aparte
      r3.render = render; r3 = null;
      await E.captureEnv();
      say(1, 'Encendiendo las luces…');
    } catch (err) {
      if (r3) r3.render = render;
      console.error(err);
      fail('webgl', err);
      return;
    }
    E.edgeSel = E.edgeSel || new T.LineBasicMaterial({ color: 0xff9a3d, transparent: true, opacity: 0.45 });
    buildInventory(); buildLabels(); bindUI();
    const redraw = () => { (L.redraws || []).forEach((f) => f()); E.invalidate(3); };
    if (document.fonts && document.fonts.load) Promise.all(['700 92px Inter', '600 46px Inter', '400 30px Inter'].map((f) => document.fonts.load(f))).then(redraw, () => {});
    // ruta de entrada: se guarda y se aplica en «listo»; una que no existe (#m99) se borra
    const start = parseRoute(location.hash);
    if (location.hash && !start) { try { history.replaceState(null, '', base()); } catch (err) { /* sin historial */ } }
    S.pending = start; S.lastHash = location.hash;
    const clean = /clean/.test(location.search), simple = prefs.get('mode') === 'explorador';
    if (E.size.w >= 1280 && !start && !clean && !simple && prefs.get('welcomed')) { S.inv = true; $('#inv').hidden = false; $('#btn-inv').setAttribute('aria-pressed', 'true'); }
    S.view = 'fachada'; markViews('fachada');
    layout();
    E.cam.cur.th = E.cam.goal.th = 0.95; E.cam.cur.ph = E.cam.goal.ph = 0.62; E.cam.cur.r = E.cam.goal.r = 27; E.cam.cur.ty = E.cam.goal.ty = 0.6;
    S.booted = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      app.classList.remove('is-loading'); app.classList.add('is-ready');
      E.flyTo(viewGoal('fachada'), 3.4, { delay: 0.35, ease: E.ease.inOut, done: ready });
      S.readyT = setTimeout(ready, 4500);
    }));
  }
  function current() {
    return { n: S.sel ? S.sel.n : null, mode: S.mode, view: S.view, montaje: !!S.mont, modal: $('#modal').hidden ? null : S.modal, labels: !!(S.labels || S.plan), tab: S.sel ? S.tab : null, route: currentRoute() };
  }
  L.api = {
    select, deselect, setExplode, playAsm, asmStep, exitAsm, goView, focusOn, openMontaje, exitMontaje,
    openBudget, openMats, openModal, closeModal: () => closeModal(), openSpot, closeSpot, downloadGLB, toggleInv, layout,
    setTab, setHot, setLabels, route, current, shareLink, state: S
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
