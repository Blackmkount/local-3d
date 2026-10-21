/* ============================================================================
   APLICACIÓN — selección, acercamiento, explosionado, animación de armado,
   fichas de materiales y costos, presupuesto y montaje del local.
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D, T = THREE, E = L.engine, F = L.furn, R = L.room, DATA = L.data;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cop = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const copShort = (n) => (n >= 1e6 ? '$' + (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace('.', ',') + ' M' : '$' + Math.round(n / 1000) + ' mil');
  const byN = {}; DATA.items.forEach((i) => { byN[i.n] = i; });
  const VS = L.versions, baseN = Object.assign({}, byN);
  /* datos de un elemento en una versión: los fabricados toman su diseño, despiece y costo de versions.js;
     los comprados son los mismos, pero en A y B cambian de lugar */
  function dataFor(n, v) {
    const a = baseN[n], lay = VS.layout[v] && VS.layout[v][n];
    if (a.origen !== 'fabrica' || !VS.items[v][n]) {
      if (!lay) return a;
      const ens = a.ens.map((e, i) => (lay.ens && lay.ens[i]) || e);
      return Object.assign({}, a, { ubic: lay.ubic, ens }, lay.resumen ? { resumen: lay.resumen } : null);
    }
    const it = VS.items[v][n], c = VS.calc(v).items[n];
    return Object.assign({}, a, { name: it.name, resumen: it.resumen, mats: c.mats, total: c.total, fab: it.fab, ens: it.ens, seq: it.seq, why: it.why, ver: v },
      it.short ? { short: it.short } : null, it.dims ? { dims: it.dims } : null, it.ubic ? { ubic: it.ubic } : null, it.cant ? { cant: it.cant } : null);
  }
  /* proceso industrial de cada material (data.js, procesos) */
  const PROC_OF = { blanca15: ['aglomerado', 'melamina'], blanca15v: ['aglomerado', 'melamina'], cantoRovere33: ['canto'], rovere15: ['aglomerado', 'melamina'], fondo6: ['aglomerado', 'melamina'], mdf15: ['mdf'], mdf55: ['mdf'], canto: ['canto'], cantoRovere: ['canto'], tubo1: ['tubo'], tubo15: ['tubo'], tuboRect: ['tubo'], perforada: ['tubo'], vidrio6: ['vidrio'], vidrio10: ['vidrio'], perfil3030: ['aluminio'], perfilLed: ['aluminio', 'led'], perfilManija: ['aluminio'], acril3: ['acrilico'], opal3: ['acrilico'], cob: ['led'] };
  const MT = () => VS.montaje[S.ver] || DATA.montaje;
  const ITEMS = () => DATA.items.map((d) => byN[d.n]);
  const NEXT = (n, k) => { const i = DATA.items.findIndex((x) => x.n === n); return byN[DATA.items[(i + k + DATA.items.length) % DATA.items.length].n]; };
  function totals(v) {
    const P = DATA.presupuesto, c = VS.calc(v);
    return { total: P.comprado + c.total, fabricado: c.total, comprado: P.comprado };
  }
  const verInfo = (v) => VS.list.find((x) => x.id === v);
  const procBy = {}; DATA.procesos.forEach((p) => { procBy[p.id] = p; });
  const app = $('#app');
  const Y = new T.Vector3(0, 1, 0);

  const S = { ver: 'A', sel: null, inst: null, mode: 'solid', step: -1, playing: false, gen: 0, labels: false, plan: false, hover: null, hl: null, tab: 'resumen', filter: 'todos', inv: false, mont: null, usable: { w: 1, h: 1 }, tws: [] };

  /* ------------------------------------------------------------------ vistas */
  const VIEWS = {
    fachada: { t: [0.1, 1.72, 1.2], th: 0.17, ph: 1.485, r: 12.2, min: 1.45 },
    interior: { t: [0, 1.15, -0.9], th: 0.3, ph: 1.36, r: 5.4, min: 0.9 },
    aerea: { t: [0, 0.7, 0.1], th: 0.62, ph: 0.86, r: 13.4, min: 1.15 },
    planta: { t: [0, 0, 0.72], th: 0, ph: 0.02, r: 18.4, min: 1.05 }
  };
  function goView(name, dur) {
    if (name === 'plano') { openPlan(); return; }
    const v = VIEWS[name]; if (!v) return;
    if (S.planOpen) closePlan(true);
    exitMontaje(true); deselect(true);
    S.plan = name === 'planta'; S.view = name;
    $$('#views button').forEach((b) => b.classList.toggle('is-on', b.dataset.view === name));
    layout();
    const a = S.usable.w / S.usable.h, k = Math.max(1, v.min / a);
    E.flyTo({ target: new T.Vector3(v.t[0], v.t[1], v.t[2]), theta: v.th, phi: v.ph, radius: Math.min(25, v.r * k) }, dur == null ? 1.6 : dur);
    syncLabels();
  }

  function refit(dur) {
    const v = VIEWS[S.view]; if (!v) return;
    const a = S.usable.w / S.usable.h, k = Math.max(1, v.min / a);
    E.flyTo({ target: new T.Vector3(v.t[0], v.t[1], v.t[2]), theta: v.th, phi: v.ph, radius: Math.min(25, v.r * k) }, dur);
  }

  /* --------------------------------------------- disposición y centro de vista */
  function layout() {
    const w = E.size.w, h = E.size.h, wide = w >= 860;
    app.classList.toggle('is-narrow', !wide);
    let ox = 0, oy = 0, uw = w, uh = h - 64 - 84;
    const panelOpen = !$('#panel').hidden, leftOpen = !$('#inv').hidden || !$('#mont').hidden;
    if (wide) {
      const pw = panelOpen ? $('#panel').offsetWidth + 16 : 0, lw = leftOpen ? ($('#inv').hidden ? $('#mont') : $('#inv')).offsetWidth + 16 : 0;
      ox = (pw - lw) / 2; uw = w - pw - lw; oy = 10;
    } else if (panelOpen) {
      const sh = $('#panel').offsetHeight; oy = sh / 2 - 56; uh = h - sh - 190;
    }
    S.usable = { w: Math.max(120, uw), h: Math.max(120, uh) };
    app.style.setProperty('--ul', (wide && leftOpen ? ($('#inv').hidden ? $('#mont') : $('#inv')).offsetWidth + 12 : 0) + 'px');
    app.style.setProperty('--ur', (wide && panelOpen ? $('#panel').offsetWidth + 12 : 0) + 'px');
    app.style.setProperty('--ub', (!wide && panelOpen ? $('#panel').offsetHeight + 8 : 0) + 'px');
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
  function stopTweens() { S.tws.forEach(E.cancel); S.tws = []; }

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

  function select(n, o, opt) {
    const it = F.items[n]; if (!it) return;
    opt = opt || {};
    if (S.mont) exitMontaje(true);
    if (S.sel === it && !opt.force) { if (S.mode === 'solid' && o && o !== S.inst) { S.inst = o; focus(it, o); } return; }
    if (S.sel) resetItem(S.sel);
    S.sel = it; S.inst = o || it.insts[0]; S.mode = 'solid'; S.step = -1; S.playing = false; S.hl = null; S.tab = opt.tab || 'resumen';
    R.hideDiv = it.zone === 'trastienda'; R.keepPillars = it.zone === 'fachada';
    S.plan = false; S.view = null; $$('#views button').forEach((b) => b.classList.remove('is-on'));
    const swap = !$('#panel').hidden;
    renderPanel(); $('#panel').hidden = false; $('#tip').hidden = true; S.hover = null;
    if (swap) { const pn = $('#panel'); pn.classList.remove('is-swap'); void pn.offsetWidth; pn.classList.add('is-swap'); }
    $('#panel').classList.remove('is-tall');
    if (app.classList.contains('is-narrow')) toggleInv(false);
    $('#hint').hidden = true;
    const canAnim = it.insts[0].steps > 1 || it.insts[0].parts.length > 1;
    $('#actions').hidden = !canAnim; $('#stepper').hidden = true;
    $('#act-explode').setAttribute('aria-pressed', 'false'); $('#act-explode span').textContent = 'Explosionar';
    $('#act-play').hidden = !(byN[n].seq && byN[n].seq.length);
    if (it.zone === 'trastienda') ghostOthers(it, true);
    layout(); focus(it, S.inst);
    markInv(); syncLabels(); refreshEdges();
    setHash('m' + n);
  }
  function setHash(h) {
    const v = S.ver === 'A' ? '' : S.ver.toLowerCase(), t = h ? h + v : v;
    try { history.replaceState(null, '', t ? '#' + t : location.pathname + location.search); } catch (e) { /* sin historial */ }
  }
  function deselect(silent) {
    if (!S.sel) return;
    resetItem(S.sel);
    S.sel = null; S.inst = null; S.hl = null; R.hideDiv = false; R.keepPillars = false; E.autoRotate = false;
    $('#act-spin').setAttribute('aria-pressed', 'false');
    $('#panel').hidden = true; $('#actions').hidden = true; $('#stepper').hidden = true; $('#hint').hidden = false;
    layout(); markInv(); syncLabels(); refreshEdges();
    setHash('');
    if (!silent) { const g = E.cam.goal; E.flyTo({ radius: Math.max(g.r, 6.5), phi: Math.min(g.ph, 1.25) }, 1.0); }
  }
  /* deja el mueble armado y la escena completa */
  function resetItem(it) {
    if (L.armado) L.armado.stop();
    S.gen++; stopTweens();
    it.insts.forEach((o) => {
      o.group.position.copy(o.home);
      o.parts.forEach((p) => { p.position.copy(p.userData.home); p.visible = true; if (p.userData.mat0) p.material = p.userData.mat0; });
      o.decor.forEach((d) => { d.visible = true; d.position.y = 0; });
      o.glows.forEach((g) => { g.visible = true; });
    });
    if (S.ghosted) ghostOthers(it, false, true);
    S.mode = 'solid'; S.step = -1; S.playing = false; S.hl = null;
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

  /* -------------------------------------------------------------- explosionado */
  function setExplode(on) {
    const it = S.sel; if (!it) return;
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
    S.mode = on ? 'exploded' : 'solid';
    const gen = S.gen;
    if (!on) track(E.tween(0.01, () => {}, { delay: 0.95 + max * 0.06, done: () => { if (gen !== S.gen) return; ghostOthers(it, false); showDecor(it, true, true); refreshEdges(); } }));
    $('#act-explode').setAttribute('aria-pressed', on ? 'true' : 'false'); $('#act-explode span').textContent = on ? 'Armar' : 'Explosionar';
    $('#stepper').hidden = true; $('#actions').hidden = false;
    focus(it, S.inst, on, 1.1);
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
    S.gen++; stopTweens();
    if (!S.ghosted) ghostOthers(it, true);
    showDecor(it, false);
    S.mode = 'asm'; S.playing = true; E.autoRotate = false; $('#act-spin').setAttribute('aria-pressed', 'false');
    $('#actions').hidden = true; $('#stepper').hidden = false;
    $('#act-explode').setAttribute('aria-pressed', 'false'); $('#act-explode span').textContent = 'Explosionar';
    buildDots(seq.length);
    focus(it, S.inst, true, 1.0);
    const AR = L.armado;
    if (AR && AR.available() && AR.play(it, S.inst, from || 0, byN[it.n])) { S.step = from || 0; updateStepper(); syncPanelState(); syncLabels(); return; }
    asmStep(from || 0, true);
    syncPanelState(); syncLabels();
  }
  function asmStep(k, anim) {
    const it = S.sel, seq = byN[it.n].seq, gen = ++S.gen;
    stopTweens();
    const AR = L.armado;
    if (AR && AR.state.on) { k = E.clamp(k, 0, seq.length - 1); S.step = k; AR.goto(k, anim); updateStepper(); return; }
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
    if (!anim) return;
    track(E.tween(0.01, () => {}, { delay: Math.max(0.5, total) + 0.05, done: () => { if (gen !== S.gen) return; S.moving = -1; refreshEdges(); } }));
    if (S.playing) {
      track(E.tween(0.01, () => {}, { delay: Math.max(0.9, total) + 1.25, done: () => {
        if (gen !== S.gen || !S.playing) return;
        if (k < seq.length - 1) asmStep(k + 1, true); else finishAsm();
      } }));
    }
  }
  function finishAsm() {
    const it = S.sel; S.playing = false; S.done = true;
    showDecor(it, true, true);
    updateStepper();
    const gen = S.gen;
    track(E.tween(0.01, () => {}, { delay: 1.6, done: () => { if (gen === S.gen && S.mode === 'asm') exitAsm(); } }));
  }
  function exitAsm(quiet) {
    const it = S.sel; if (!it) return;
    if (L.armado) L.armado.stop();
    S.gen++; stopTweens(); S.done = false; S.moving = -1;
    it.insts.forEach((o) => { o.group.position.copy(o.home); o.parts.forEach((p) => { p.visible = true; p.position.copy(p.userData.home); }); });
    S.mode = 'solid'; S.playing = false; S.step = -1;
    if (!quiet) { ghostOthers(it, false); showDecor(it, true); focus(it, S.inst, false, 1.0); }
    $('#stepper').hidden = true; $('#actions').hidden = false;
    refreshEdges(); syncPanelState(); syncLabels(); E.shadowDirty = true; E.invalidate();
  }
  const ICON_PLAY = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4.5v11l9-5.5z" fill="currentColor"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4.5v11M14 4.5v11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  function buildDots(n) { $('#st-dots').innerHTML = Array.from({ length: n }, (_, i) => '<button type="button" class="dot" data-k="' + i + '" aria-label="Ir al paso ' + (i + 1) + '"></button>').join(''); }
  function updateStepper() {
    const it = S.sel; if (!it) return;
    const seq = byN[it.n].seq, s = seq[S.step] || seq[0];
    $('#st-n').textContent = S.done ? 'Listo' : 'Paso ' + (S.step + 1) + ' de ' + seq.length;
    $('#st-t').textContent = S.done ? 'Armado completo' : s.t;
    $('#st-src').textContent = S.done ? '' : s.src;
    $('#st-play').innerHTML = S.playing ? ICON_PAUSE : ICON_PLAY;
    $('#st-play').setAttribute('aria-label', S.playing ? 'Pausar' : 'Reproducir');
    $$('#st-dots .dot').forEach((d, i) => { d.classList.toggle('is-done', i < S.step || !!S.done); d.classList.toggle('is-on', i === S.step && !S.done); });
    $$('#panel .seq li').forEach((li, i) => { li.classList.toggle('is-on', S.mode === 'asm' && i === S.step); li.classList.toggle('is-done', S.mode === 'asm' && i < S.step); });
  }
  function syncPanelState() {
    const p = $('#panel'); if (p.hidden) return;
    const ex = $('.js-explode', p), pl = $('.js-play', p);
    if (ex) ex.textContent = S.mode === 'exploded' ? 'Armar de nuevo' : 'Explosionar';
    if (pl) pl.textContent = S.mode === 'asm' ? 'Reiniciar armado' : 'Ver armado paso a paso';
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
    const on = (m, mat) => { if (!m.visible) return; const ls = edgesOf(m); ls.material = mat; ls.visible = true; lit.add(ls); };
    const sel = S.sel;
    if (sel) {
      sel.insts.forEach((o) => o.parts.forEach((p) => {
        const u = p.userData;
        if (u.mat0 && S.mode !== 'asm') p.material = (S.hl && u.mk !== S.hl) ? E.ghostPart : u.mat0;
        if (S.hl) { if (u.mk === S.hl) on(p, E.edgeMat); return; }
        if (S.mode === 'exploded') on(p, E.edgeSoft);
        if (S.mode === 'asm') on(p, u.step === S.moving ? E.edgeMat : E.edgeSoft);
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

  /* --------------------------------------------------------------- puntero */
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  function pickAt(e) {
    const r = E.renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, E.camera);
    const targets = []; F.order.forEach((n) => F.items[n].insts.forEach((o) => { if (o.group.visible) targets.push(o.group); }));
    const hits = ray.intersectObjects(targets, true);
    for (const h of hits) {
      let m = h.object; if (!m.visible) continue;
      let part = null;
      while (m && !(m.userData && m.userData.inst)) m = m.parent;
      if (!m) continue;
      if (h.object.userData.part) part = h.object; else if (h.object.parent && h.object.parent.userData.part) part = h.object.parent;
      return { n: m.userData.n, inst: m.userData.inst, part };
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
        html = '<b>' + esc(u.name) + '</b><span>' + esc(row ? row.m : d.name) + '</span>';
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
    if (hit) select(hit.n, hit.inst);
    else if (S.sel && S.mode === 'solid') deselect();
  }

  /* ------------------------------------------------------- números del plano */
  const labelEls = [];
  function buildLabels() {
    const box = $('#labels');
    box.innerHTML = ''; labelEls.length = 0;
    F.order.forEach((n) => {
      const it = F.items[n], multi = it.insts.length > 1 && unionRadius(it) > 2.6;
      (multi ? it.insts : [null]).forEach((o) => {
        const b = new T.Box3(); (o ? [o] : it.insts).forEach((x) => b.union(x.box));
        const c = b.getCenter(new T.Vector3()); if (it.lp && !o) c.add(new T.Vector3(it.lp[0], 0, it.lp[1]));
        const el = document.createElement('button'); el.type = 'button'; el.className = 'lbl'; el.textContent = n; el.title = byN[n].name; el.tabIndex = -1;
        el.addEventListener('click', () => select(n, o));
        box.appendChild(el);
        labelEls.push({ el, n, top: new T.Vector3(c.x, b.max.y + 0.14, c.z), mid: new T.Vector3(c.x, b.max.y, c.z), kind: 'item' });
      });
    });
    const text = (d, cls) => { const el = document.createElement('div'); el.className = cls; el.innerHTML = '<b>' + esc(d.t) + '</b><span>' + esc(d.s) + '</span>'; box.appendChild(el); labelEls.push({ el, top: d.p, mid: d.p, kind: cls }); };
    R.cotaLabels.forEach((d) => text(d, 'cota'));
    R.zoneLabels.forEach((d) => text(d, 'zona'));
  }
  function syncLabels() {
    const show = S.labels || S.plan;
    $('#labels').classList.toggle('is-on', show && !S.mont && S.mode === 'solid');
    $('#labels').classList.toggle('is-plan', S.plan);
    R.cotas.visible = S.plan;
    $('#btn-labels').setAttribute('aria-pressed', show ? 'true' : 'false');
    labelEls.forEach((l) => { if (l.kind === 'item') l.el.classList.toggle('is-sel', !!S.sel && S.sel.n === l.n); });
    E.invalidate();
  }
  const pv = new T.Vector3();
  function updateLabels() {
    if (!(S.labels || S.plan) || S.mont || S.mode !== 'solid') return;
    const w = E.size.w, h = E.size.h;
    for (const l of labelEls) {
      if (l.kind !== 'item' && !S.plan) { if (l.shown !== false) { l.el.style.display = 'none'; l.shown = false; } continue; }
      pv.copy(S.plan ? l.mid : l.top).project(E.camera);
      const ok = pv.z < 1 && pv.x > -1.05 && pv.x < 1.05 && pv.y > -1.05 && pv.y < 1.05;
      if (!ok) { if (l.shown !== false) { l.el.style.display = 'none'; l.shown = false; } continue; }
      if (l.shown !== true) { l.el.style.display = ''; l.shown = true; }
      l.el.style.transform = 'translate(' + ((pv.x * 0.5 + 0.5) * w).toFixed(1) + 'px,' + ((-pv.y * 0.5 + 0.5) * h).toFixed(1) + 'px) translate(-50%,-50%)';
    }
  }

  /* ------------------------------------------------------------- inventario */
  const norm = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function buildInventory() {
    renderInvList();
    $('#inv-list').addEventListener('click', (e) => { const b = e.target.closest('.inv-row'); if (b) select(+b.dataset.n, null, { force: S.mode !== 'solid' }); });
    $('#inv-list').addEventListener('pointerover', (e) => { const b = e.target.closest('.inv-row'); const n = b ? +b.dataset.n : null; if (n !== S.rowHover) { S.rowHover = n; refreshEdges(); } });
    $('#inv-list').addEventListener('pointerleave', () => { if (S.rowHover) { S.rowHover = null; refreshEdges(); } });
    $('#inv-filter').addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      S.filter = b.dataset.f; $$('#inv-filter .chip').forEach((c) => c.classList.toggle('is-on', c === b));
      filterInv();
    });
    const q = $('#inv-search');
    q.addEventListener('input', filterInv);
    q.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && q.value) { e.stopPropagation(); q.value = ''; filterInv(); }
      else if (e.key === 'Enter') { const li = $$('#inv-list li').find((x) => !x.hidden); if (li) select(+li.firstChild.dataset.n, null, { force: S.mode !== 'solid' }); }
    });
    $('#inv-total').addEventListener('click', openBudget);
  }
  function renderInvList() {
    const vi = verInfo(S.ver);
    $('#inv-ver').innerHTML = '<i style="--vc:' + vi.color + '">' + S.ver + '</i>' + esc(vi.nombre) + ' · ' + esc(vi.titulo);
    $('#inv-list').innerHTML = ITEMS().map((d, i) =>
      '<li data-o="' + d.origen + '" data-q="' + esc(norm(d.n + ' ' + d.short + ' ' + d.name + ' ' + d.grupo)) + '" style="--i:' + i + '"><button type="button" class="inv-row" data-n="' + d.n + '">' +
      '<span class="num">' + d.n + '</span><span class="inv-name">' + esc(d.short) + '<small>' + (d.origen === 'fabrica' ? (VS.items[S.ver][d.n] && VS.items[S.ver][d.n].short ? 'Se fabrica' : esc(d.name)) : 'Se compra') + (d.cant !== '1' ? ' · ' + esc(d.cant.split(' ')[0]) + ' u.' : '') + '</small></span>' +
      '<span class="inv-cost">' + cop(d.total) + '</span></button></li>').join('');
    $('#inv-total').innerHTML = '<span>Total del local<small>versión ' + S.ver + ' · materiales y equipos</small></span><b>' + cop(totals(S.ver).total) + '</b>';
    filterInv(); markInv();
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
  }
  function markInv() { $$('#inv-list .inv-row').forEach((b) => b.classList.toggle('is-on', !!S.sel && +b.dataset.n === S.sel.n)); }
  function toggleInv(on) {
    S.inv = on == null ? !S.inv : on;
    if (S.inv) { exitMontaje(true); }
    $('#inv').hidden = !S.inv; $('#btn-inv').setAttribute('aria-pressed', S.inv ? 'true' : 'false');
    layout(); if (S.sel) focus(S.sel, S.inst, S.mode !== 'solid' ? true : null, 0.8); else if (S.view && !S.mont) refit(0.8);
  }

  /* -------------------------------------------------------------------- ficha */
  const TABS = [['resumen', 'Resumen'], ['mats', 'Materiales'], ['fab', 'Fabricación'], ['ens', 'Ensamble'], ['why', 'Por qué'], ['req', 'Requisitos']];
  function barList(rows, max, cls) {
    return '<ul class="bars ' + (cls || '') + '">' + rows.map((r) =>
      '<li' + (r.n ? ' data-n="' + r.n + '" tabindex="0" role="button"' : '') + ' title="' + esc(r.label) + ': ' + cop(r.v) + (r.sub ? ' — ' + esc(r.sub) : '') + '">' +
      '<span class="bar-l">' + (r.n ? '<i class="num">' + r.n + '</i>' : '') + esc(r.label) + '</span>' +
      '<span class="bar-t"><span class="bar-f" style="width:' + Math.max(0.6, r.v / max * 100).toFixed(2) + '%"></span></span>' +
      '<span class="bar-v">' + cop(r.v) + '</span>' + (r.sub ? '<span class="bar-s">' + esc(r.sub) + '</span>' : '') + '</li>').join('') + '</ul>';
  }
  function renderPanel() {
    const it = S.sel, d = byN[it.n], p = $('#panel');
    const fab = d.origen === 'fabrica', hasParts = new Set(); it.insts[0].parts.forEach((x) => hasParts.add(x.userData.mk));
    const tabs = TABS.filter((t) => (t[0] !== 'fab' || d.fab.length) && (t[0] !== 'req' || VS.req[d.n])).map((t) => [t[0], !fab && t[0] === 'mats' ? 'Producto' : !fab && t[0] === 'ens' ? 'Instalación' : t[1]]);
    if (!tabs.find((t) => t[0] === S.tab)) S.tab = 'resumen';
    const prev = NEXT(d.n, -1), next = NEXT(d.n, 1), TT = totals(S.ver);
    const top = d.mats.slice().sort((a, b) => b.costo - a.costo).slice(0, 5), maxC = top[0] ? top[0].costo : 1;
    const canAnim = d.seq && d.seq.length;
    const share = (d.total / TT.total * 100);
    const sec = {};
    sec.resumen =
      '<p class="lead">' + esc(d.resumen) + '</p>' +
      '<dl class="facts"><div><dt>Medidas</dt><dd class="mono">' + esc(d.dims) + '</dd></div><div><dt>Cantidad</dt><dd>' + esc(d.cant) + '</dd></div><div class="wide"><dt>Ubicación en el plano</dt><dd>' + esc(d.ubic) + '</dd></div></dl>' +
      (it.insts[0].parts.length > 1 ? '<div class="cta"><button type="button" class="btn btn-led js-play"' + (canAnim ? '' : ' hidden') + '>Ver armado paso a paso</button><button type="button" class="btn js-explode">Explosionar</button></div>' : '') +
      '<h3>' + (fab ? 'En qué se va el costo' : 'Qué se compra') + '</h3>' + barList(top.map((m) => ({ label: m.m, v: m.costo })), maxC) +
      '<p class="note">' + (fab ? 'Costo de materiales. ' : '') + 'Es el ' + (share < 1 ? share.toFixed(1).replace('.', ',') : Math.round(share)) + ' % del total del local en la versión ' + S.ver + ' (' + cop(TT.total) + '). Precios publicados por cada tienda; la fecha va en la nota de cada precio.</p>' +
      (VS.req[d.n] ? versCompare(d.n) : '');
    sec.mats =
      '<p class="note">' + (fab ? (d.ver ? 'Láminas, barras, galones y carretes se compran completos para toda la versión ' + d.ver + ' y su costo se reparte entre los muebles por área, metros o peso. Toca el nombre de la tienda para ver el producto. Pasa el cursor por un material para verlo en el modelo.' : 'El costo de tableros y cantos es la parte que le toca al mueble de las láminas y rollos completos que se compran. Pasa el cursor por un material para verlo en el modelo.') : 'El material es el que declara la ficha de la tienda.') + '</p>' +
      '<ul class="mats">' + d.mats.map((m, i) => {
        const live = fab && hasParts.has(m.key);
        const procs = (m.proc || PROC_OF[m.key] || []).map((id) => procBy[id]).filter(Boolean);
        return '<li class="mat' + (live ? ' is-live' : '') + '"' + (live ? ' data-key="' + m.key + '" tabindex="0"' : '') + '>' +
          '<div class="mat-h"><b>' + esc(m.m) + '</b><span class="mono">' + (m.costo ? cop(m.costo) : '$0') + '</span></div>' +
          '<p>' + esc(m.uso) + '</p>' +
          '<p class="mat-q"><span>' + esc(m.cant) + '</span><span>' + esc(m.pu) + '</span></p>' +
          (m.prov ? '<p class="mat-q"><span>' + (m.u ? '<a href="' + esc(m.u) + '" target="_blank" rel="noopener">' + esc(m.prov) + '</a>' : esc(m.prov)) + '</span><span>' + esc(m.nota || '') + '</span></p>' : '') +
          (live ? '<span class="eye" aria-hidden="true">ver en 3D</span>' : '') +
          (procs.length ? '<details><summary>Cómo se fabrica este material</summary>' + procs.map((pr) => '<div class="proc"><h4>' + esc(pr.mat) + '</h4><p>' + esc(pr.proceso) + '</p><p class="dato">' + esc(pr.dato) + '</p><p class="src">' + pr.fuentes.map((f) => '<a href="' + esc(f.u) + '" target="_blank" rel="noopener">' + esc(f.t) + '</a>').join(' · ') + '</p></div>').join('') + '</details>' : '') +
          '</li>';
      }).join('') + '</ul>' +
      '<div class="total-row"><span>Total ' + (fab ? 'de materiales' : '') + '</span><b class="mono">' + cop(d.total) + '</b></div>';
    sec.fab = '<p class="note">En el taller, antes de llevar las piezas al local.</p><ol class="steps">' + d.fab.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>';
    sec.ens =
      (canAnim ? '<div class="seq-box"><div class="seq-h"><h3>Animación de armado</h3><button type="button" class="btn btn-led js-play">Ver armado paso a paso</button></div>' + (L.armado && L.armado.available() ? '<p class="seq-lead">Un ebanista arma el mueble pieza por pieza: suelda cada unión de tubo, atornilla los tableros, encola y prensa las capas, ancla al muro, asienta el vidrio y conecta la luz. Cada operación muestra su tiempo estimado en planta (Nota 2).</p>' : '') + '<ol class="seq">' + d.seq.map((s, i) => '<li><button type="button" data-k="' + i + '"><span>' + esc(s.t) + '</span><small>' + esc(s.src) + '</small></button></li>').join('') + '</ol></div>' : '') +
      '<h3>' + (fab ? 'Ensamble en el local' : 'Instalación') + '</h3><ol class="steps">' + d.ens.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>';
    sec.why = '<ul class="why">' + d.why.map((w) => '<li><h4>' + esc(w.t) + '</h4><p>' + esc(w.d) + '</p></li>').join('') + '</ul>';
    if (VS.req[d.n]) sec.req = reqPanel(d.n);

    p.innerHTML =
      '<div class="grabber" aria-hidden="true"></div>' +
      '<header class="p-head">' +
        '<div class="p-top"><span class="num num-lg">' + d.n + '</span><span class="pill pill-' + d.origen + '">' + (fab ? 'Se fabrica' + (d.origenNota ? ' · ' + esc(d.origenNota) : '') : 'Se compra') + '</span>' + (VS.req[d.n] ? '<button type="button" class="vchip" data-vers="1" title="Comparar las tres versiones" style="--vc:' + verInfo(S.ver).color + '"><i>' + S.ver + '</i>' + esc(verInfo(S.ver).nombre) + '</button>' : '<span class="p-group">' + esc(d.grupo) + '</span>') +
        '<div class="p-acts"><button type="button" class="ibtn ibtn-fill" id="p-share" aria-label="Copiar enlace a esta ficha" title="Copiar enlace"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 12.4V3.2M6.6 6.4 10 3l3.4 3.4M6.2 9H4.6v8h10.8V9h-1.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button type="button" class="ibtn ibtn-fill" id="p-close" aria-label="Cerrar ficha" title="Cerrar"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div></div>' +
        '<h2>' + esc(d.name) + '</h2>' +
        '<div class="p-cost"><b class="mono">' + cop(d.total) + '</b><span>' + (fab ? 'en materiales' : (d.cant !== '1' ? esc(d.cant) + ' unidades' : 'producto')) + ' · ' + esc(d.dims) + '</span></div>' +
      '</header>' +
      '<div class="tabs seg" role="tablist">' + tabs.map((t) => '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (t[0] === S.tab) + '">' + t[1] + '</button>').join('') + '</div>' +
      '<div class="p-body">' + tabs.map((t) => '<section role="tabpanel" data-panel="' + t[0] + '"' + (t[0] === S.tab ? '' : ' hidden') + '>' + sec[t[0]] + '</section>').join('') + '</div>' +
      '<footer class="p-foot"><button type="button" class="btn" data-go="' + prev.n + '"><span class="num">' + prev.n + '</span>' + esc(prev.short) + '</button><button type="button" class="btn" data-go="' + next.n + '">' + esc(next.short) + '<span class="num">' + next.n + '</span></button></footer>';
    $('.p-body', p).scrollTop = 0;
    L.ui.seg($('.tabs', p));
  }
  function setHL(key) { if (S.mode === 'asm') key = null; if (S.hl === key) return; S.hl = key; $$('#panel .mat').forEach((li) => li.classList.toggle('is-on', !!key && li.dataset.key === key)); refreshEdges(); }
  function bindPanel() {
    const p = $('#panel');
    p.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('#p-close')) return deselect();
      if (t.closest('#p-share')) return shareLink();
      const tab = t.closest('[data-tab]');
      if (tab) { S.tab = tab.dataset.tab; $$('[data-tab]', p).forEach((b) => b.setAttribute('aria-selected', b === tab)); $$('[data-panel]', p).forEach((s) => { s.hidden = s.dataset.panel !== S.tab; }); $('.p-body', p).scrollTop = 0; setHL(null); return; }
      const go = t.closest('[data-go]'); if (go) return select(+go.dataset.go, null, { tab: S.tab, force: true });
      const sv = t.closest('[data-setver]'); if (sv) return setVersion(sv.dataset.setver);
      if (t.closest('[data-vers]')) return openVersions();
      if (t.closest('[data-reqs]')) return openReqs(+t.closest('[data-reqs]').dataset.reqs);
      if (t.closest('.js-play')) return playAsm(0);
      if (t.closest('.js-explode')) return setExplode(S.mode !== 'exploded');
      const sq = t.closest('.seq button'); if (sq) { if (S.mode !== 'asm') { playAsm(+sq.dataset.k); } else { S.playing = false; asmStep(+sq.dataset.k, true); } return; }
      const mat = t.closest('.mat.is-live'); if (mat && !t.closest('details')) setHL(S.hl === mat.dataset.key ? null : mat.dataset.key);
    });
    p.addEventListener('pointerover', (e) => { if (e.pointerType === 'touch') return; const m = e.target.closest('.mat.is-live'); if (m) setHL(m.dataset.key); });
    p.addEventListener('pointerout', (e) => { if (e.pointerType === 'touch') return; const m = e.target.closest('.mat.is-live'); if (m && !m.contains(e.relatedTarget)) setHL(null); });
    p.addEventListener('focusin', (e) => { const m = e.target.closest('.mat.is-live'); if (m && e.target === m) setHL(m.dataset.key); });
  }

  /* ------------------------------------------------------------------ modales */
  /* ventanas al estilo macOS: crecen desde el botón que las abrió, se arrastran por la barra de título,
     el semáforo cierra, minimiza hacia ese botón o amplía */
  let lastFocus = null, lastPress = null, lastPressT = 0, winDrag = null;
  document.addEventListener('pointerdown', (e) => { const b = e.target.closest && e.target.closest('button, .inv-foot'); if (b) { lastPress = b; lastPressT = performance.now(); } }, true);
  function openModal(title, html, cls, from) {
    if (S.reopen) { $('#modal-title').textContent = title; $('#modal-body').innerHTML = html; return; }
    lastFocus = document.activeElement;
    const card = $('.modal-card');
    $('#modal-title').textContent = title; $('#modal-body').innerHTML = html; $('#modal-body').scrollTop = 0;
    card.className = 'modal-card window ' + (cls || '');
    if (winDrag) winDrag.reset();
    S.winFrom = from || (lastPress && performance.now() - lastPressT < 1500 ? lastPress : lastFocus);
    $('#modal').classList.remove('is-min');
    $('#modal').hidden = false;
    L.ui.originFrom(card, S.winFrom);
    $('#modal-close').focus({ preventScroll: true });
  }
  function closeModal(min) {
    if ($('#modal').hidden) return;
    S.modalKind = null;
    if (min === true) { L.ui.originFrom($('.modal-card'), S.winFrom); $('#modal').classList.add('is-min'); }
    $('#modal').hidden = true;
    restoreFocus(lastFocus, $('#modal'));
  }
  /* devuelve el foco a quien abrió la capa; si no hay a quién, lo saca de la capa que se cierra */
  function restoreFocus(to, layer) {
    const ae = document.activeElement;
    if (to && to !== document.body && to.focus && document.contains(to)) to.focus({ preventScroll: true });
    else if (ae && layer.contains(ae)) ae.blur();
  }
  function zoomModal() { $('.modal-card').classList.toggle('is-zoomed'); if (winDrag) winDrag.reset(); }
  function openBudget() {
    S.modalKind = 'budget';
    const vline = '<p class="vline">' + vtag(S.ver) + '<span>Versión ' + S.ver + ' · ' + esc(verInfo(S.ver).nombre) + ' — ' + esc(verInfo(S.ver).titulo) + '</span><button type="button" class="btn btn-sm" data-vers="1">Comparar versiones</button></p>';
    openModal('Presupuesto del local · versión ' + S.ver, vline + budgetAlt(S.ver), 'is-wide');
  }
  function openMats() {
    S.modalKind = 'mats';
    const v = S.ver, vi = verInfo(v), C = VS.calc(v), keys = new Set(C.compras.map((c) => c.id));
    const provs = new Set(C.compras.map((c) => c.prov.split(',')[0]));
    const procIds = new Set(); keys.forEach((k) => (PROC_OF[k] || []).forEach((id) => procIds.add(id)));
    const usoDe = (id) => C.compras.filter((c) => (PROC_OF[c.id] || []).includes(id)).map((c) => c.m.split(',')[0]).filter((x, i, a) => a.indexOf(x) === i).join(' · ');
    const cats = {}; C.compras.forEach((c) => { (cats[c.cat] = cats[c.cat] || []).push(c); });
    const tabla = (filas) => '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Material</th><th>Presentación</th><th>Precio (COP)</th><th>Proveedor</th><th>Nota</th></tr></thead><tbody>' + filas + '</tbody></table></div>';
    const comprados = DATA.catalogo.find((g) => /compran hechos/.test(g.grupo));
    openModal('Materiales y procesos · versión ' + v,
      '<p class="vline">' + vtag(v) + '<span>Versión ' + v + ' · ' + esc(vi.nombre) + ' — ' + esc(vi.titulo) + '</span><button type="button" class="btn btn-sm" data-vers="1">Comparar versiones</button></p>' +
      '<p class="lead">El mobiliario de esta versión sale de ' + C.compras.length + ' insumos de ' + provs.size + ' tiendas, con su precio publicado en línea y el enlace a cada producto. En pesos colombianos.</p>' +
      '<h3>Cómo se fabrica cada material</h3><p class="note">Así llega cada material a la tienda antes de que el carpintero o el soldador lo toque.</p>' +
      '<div class="procs">' + DATA.procesos.filter((p) => procIds.has(p.id)).map((p) => '<article class="proc"><h4>' + esc(p.mat) + '</h4><p class="uso">' + esc(usoDe(p.id)) + '</p><p>' + esc(p.proceso) + '</p><p class="dato">' + esc(p.dato) + '</p><p class="src">' + p.fuentes.map((f) => '<a href="' + esc(f.u) + '" target="_blank" rel="noopener">' + esc(f.t) + '</a>').join(' · ') + '</p></article>').join('') + '</div>' +
      Object.keys(cats).map((k) => '<h3>' + esc(k) + '</h3>' + tabla(cats[k].map((c) => { const P = c.precio; return '<tr><td>' + (c.u ? '<a href="' + esc(c.u) + '" target="_blank" rel="noopener">' + esc(c.m) + '</a>' : esc(c.m)) + '</td><td>' + esc(P.pres) + '</td><td class="mono">' + esc(VS.precioTxt(P)) + '</td><td>' + esc(c.prov) + '</td><td>' + esc(P.nota || '') + '</td></tr>'; }).join(''))).join('') +
      (comprados ? '<h3>' + esc(comprados.grupo) + ' <small>iguales en las tres versiones</small></h3>' + tabla(comprados.filas.map((f) => '<tr><td><a href="' + esc(f.u) + '" target="_blank" rel="noopener">' + esc(f.m) + '</a></td><td>' + esc(f.pres) + '</td><td class="mono">' + esc(f.precio) + '</td><td>' + esc(f.prov) + '</td><td>' + esc(f.nota) + '</td></tr>').join('')) : ''), 'is-wide');
  }

  /* enlace directo a la ficha (#m7) */
  function copyText(t) {
    const a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0';
    document.body.appendChild(a); a.select(); let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    a.remove(); return ok;
  }
  function shareLink() {
    const it = S.sel; if (!it) return;
    const url = location.href.split('#')[0] + '#m' + it.n + (S.ver === 'A' ? '' : S.ver.toLowerCase()), name = byN[it.n].short;
    const ok = () => L.ui.toast('Enlace copiado', 'Abre directamente la ficha de ' + name + '.', 'link');
    const fail = () => (copyText(url) ? ok() : L.ui.toast('No se pudo copiar', url, 'err', 8000));
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, fail); else fail();
  }
  /* el local completo en .glb, para Unreal Engine, Blender, Twinmotion o D5 */
  let exporting = false;
  async function downloadGLB() {
    if (exporting) return;
    exporting = true;
    L.ui.toast('Preparando el modelo 3D', 'Muros, mobiliario pieza por pieza, materiales y luces.', 'cube', 2500);
    try {
      exitMontaje(true); deselect(true);
      const views = ['fachada', 'interior', 'aerea', 'planta'].map((k) => Object.assign({ name: k === 'aerea' ? 'Aérea' : k[0].toUpperCase() + k.slice(1) }, VIEWS[k]));
      const bytes = await L.exporter.download({ views }), mb = (bytes / 1048576).toFixed(1).replace('.', ',');
      L.ui.toast('Modelo 3D listo', 'local-impresion-3d.glb · ' + mb + ' MB. Ábrelo en Unreal Engine, Blender o Twinmotion.', 'cube', 6000);
    } catch (err) {
      console.error(err);
      L.ui.toast('No se pudo exportar', 'Revisa la conexión: el exportador se descarga al pedir el archivo.', 'err', 7000);
    }
    exporting = false;
  }

  /* -------------------------------------------------------- montaje del local */
  function montInsts(tag) {
    return F.items[tag].insts;
  }
  function openMontaje() {
    deselect(true); toggleInv(false);
    const M = MT();
    $('#mont').innerHTML =
      '<div class="inv-head"><h2>Orden de fabricación y montaje</h2><p>' + esc(M.intro) + '</p></div>' +
      '<div class="mont-body"><h3>Cuatro frentes trabajan en paralelo</h3><div class="frentes">' + M.frentes.map((f) => '<div><b>' + esc(f.t) + '</b>' + f.d.map((x) => '<span>' + esc(x) + '</span>').join('') + '</div>').join('') + '</div>' +
      '<h3>Montaje en el local <small>con piso, cielo y tomas ya terminados</small></h3><ol class="mont-steps">' + M.pasos.map((p, i) => '<li><button type="button" data-k="' + i + '"><b>' + esc(p.t) + '</b><span>' + esc(p.d) + '</span></button></li>').join('') + '</ol>' +
      '<p class="note">' + esc(M.nota) + '</p></div>' +
      '<div class="mont-foot"><button type="button" class="btn btn-led" id="mont-play">Reproducir montaje</button><button type="button" class="btn" id="mont-exit">Cerrar</button></div>';
    $('#mont').hidden = false; S.mont = { step: -1, playing: false }; $('#hint').hidden = true;
    syncLabels(); layout();
    const a = S.usable.w / S.usable.h;
    E.flyTo({ target: new T.Vector3(0, 0.6, 0), theta: 0.55, phi: 0.82, radius: Math.min(25, 14 * Math.max(1, 1.15 / a)) }, 1.4);
    playMontaje(0);
  }
  function montState(k) {       // deja a la vista lo montado hasta el paso k (inclusive)
    const M = MT(), shown = new Set();
    M.pasos.forEach((p, i) => { if (i <= k) p.items.forEach((t) => montInsts(t).forEach((o) => shown.add(o))); });
    F.order.forEach((n) => F.items[n].insts.forEach((o) => { o.group.visible = shown.has(o); o.group.position.copy(o.home); }));
    E.setLed(k >= M.pasos.length - 1 ? 1 : 0.1);
  }
  function playMontaje(k) {
    const M = MT(), st = S.mont; if (!st) return;
    const gen = ++S.gen; stopTweens();
    st.playing = true; st.step = k;
    montState(k - 1);
    const p = M.pasos[k]; let i = 0, total = 0.4;
    p.items.forEach((t) => montInsts(t).forEach((o) => {
      const delay = 0.35 + i * 0.16; i++;
      o.group.visible = false;
      const h0 = 2.2;
      track(E.tween(0.85, (e) => { o.group.visible = true; o.group.position.copy(o.home); o.group.position.y += h0 * (1 - e); }, { delay, ease: E.ease.outQuint }));
      total = delay + 0.85;
    }));
    if (p.led) { track(E.tween(1.8, (e) => E.setLed(E.lerp(0.1, 1, e)), { delay: total, ease: E.ease.inOut })); total += 1.8; }
    $$('#mont .mont-steps li').forEach((li, j) => { li.classList.toggle('is-on', j === k); li.classList.toggle('is-done', j < k); });
    $('#mont-play').textContent = 'Pausar';
    E.shadowDirty = true;
    track(E.tween(0.01, () => {}, { delay: total + 1.3, done: () => {
      if (gen !== S.gen || !S.mont || !S.mont.playing) return;
      if (k < M.pasos.length - 1) playMontaje(k + 1);
      else { S.mont.playing = false; $('#mont-play').textContent = 'Repetir montaje'; $$('#mont .mont-steps li').forEach((li) => { li.classList.remove('is-on'); li.classList.add('is-done'); }); }
    } }));
  }
  function exitMontaje(quiet) {
    if (!S.mont) return;
    S.gen++; stopTweens(); S.mont = null;
    F.order.forEach((n) => F.items[n].insts.forEach((o) => { o.group.visible = true; o.group.position.copy(o.home); }));
    E.setLed(1); $('#mont').hidden = true; $('#hint').hidden = !!S.sel;
    E.shadowDirty = true; syncLabels(); layout();
    if (!quiet) goView('aerea');
  }

  /* ---------------------------------------------------- versiones del mobiliario */
  const FABN = DATA.items.filter((d) => d.origen === 'fabrica' && VS.req[d.n]).map((d) => d.n);
  const cumpleOf = (n, v) => VS.cumple(n, v);
  const stIcon = (e) => '<i class="st st-' + e + '" role="img" aria-label="' + (e === 'si' ? 'Cumple' : 'Cumple con una salvedad') + '"></i>';
  const vtag = (v, cls) => '<i class="vtag ' + (cls || '') + '" style="--vc:' + verInfo(v).color + '">' + v + '</i>';
  const itemCost = (n, v) => VS.calc(v).items[n].total;
  const itemName = (n, v) => VS.items[v][n].name;
  /* posición de los productos comprados en la distribución original (furniture.js), para la versión C */
  const basePos = {};
  const MOVIBLES = [1, 6, 8, 14, 16, 18];
  function placeBought(v) {
    const lay = VS.layout[v], moved = {};
    MOVIBLES.forEach((n) => {
      const it = F.items[n]; if (!it) return;
      if (!basePos[n]) basePos[n] = it.insts.map((o) => ({ p: o.home.clone(), r: o.group.rotation.y }));
      it.insts.forEach((o, i) => {
        const q = lay && lay[n] && lay[n].pos[i];
        if (q) { o.group.position.set(R.wx(q[0]), q[1], R.wz(q[2])); o.group.rotation.y = q[3] || 0; }
        else { o.group.position.copy(basePos[n][i].p); o.group.rotation.y = basePos[n][i].r; }
        o.home.copy(o.group.position); o._off = null;
      });
      it._ur = null; moved[n] = it;
    });
    F.finish(moved);
  }

  function setVersion(v, opt) {
    opt = opt || {};
    const vi = verInfo(v);
    if (!vi || (v === S.ver && !opt.force)) return;
    exitMontaje(true);
    const keep = S.sel ? { n: S.sel.n, tab: S.tab } : null;
    if (S.sel) deselect(true);
    let set = null;
    try { set = L.alt.build(v); E.finalize(); } catch (err) { console.error(err); L.ui.toast('No se pudo armar la versión ' + v, String(err && err.message || err), 'err', 7000); return; }
    const gen = (S.verGen = (S.verGen || 0) + 1), fresh = [];
    FABN.forEach((n) => {
      const cur = F.items[n], nxt = set[n];
      if (!nxt) return;
      if (cur !== nxt) cur.insts.forEach((o) => { o.group.visible = false; o.group.userData.verOff = true; });
      nxt.insts.forEach((o) => { o.group.visible = true; o.group.userData.verOff = false; o.group.position.copy(o.home); fresh.push(o); });
      F.items[n] = nxt; byN[n] = dataFor(n, v);
    });
    S.ver = v;
    placeBought(v);
    MOVIBLES.forEach((n) => { byN[n] = dataFor(n, v); if (VS.layout[v] && VS.layout[v][n]) F.items[n].insts.forEach((o) => fresh.push(o)); });
    if (R.setFixtures) R.setFixtures(VS.fixtures[v]);
    // los muebles nuevos (y los equipos que cambian de lugar) caen en su sitio, del fondo hacia la fachada
    if (!opt.quiet && !E.reduced) {
      fresh.sort((a, b) => a.home.z - b.home.z);
      fresh.forEach((o, i) => {
        o.group.visible = false;
        E.tween(0.75, (e) => {
          if (gen !== S.verGen) return;
          o.group.visible = true; o.group.position.copy(o.home); o.group.position.y += 1.4 * (1 - e);
        }, { delay: 0.05 + i * 0.05, ease: E.ease.outQuint, done: () => { if (gen === S.verGen) { o.group.position.copy(o.home); E.shadowDirty = true; } } });
      });
    }
    E.setLed(E.ledLevel); E.shadowDirty = true; E.invalidate(3);
    buildLabels(); syncLabels(); renderInvList(); SP.all = null;
    syncVerUI();
    if (S.planOpen) renderPlan();
    if (keep) select(keep.n, null, { tab: keep.tab, force: true });
    if (!opt.quiet) setHash(S.planOpen ? 'plano' : keep ? 'm' + keep.n : '');
    if (!$('#modal').hidden && S.modalKind) reopenModal();
    if (!opt.quiet) L.ui.toast('Versión ' + v + ' · ' + vi.nombre, vi.titulo + '. Mobiliario fabricado: ' + cop(totals(v).fabricado) + ' en materiales.', 'cube', 4200);
  }
  function syncVerUI() {
    $$('[data-ver]').forEach((b) => { const on = b.dataset.ver === S.ver; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
    app.style.setProperty('--vc', verInfo(S.ver).color);
  }
  /* comparación de las tres versiones de un mueble (pestaña Resumen) */
  function versCompare(n) {
    const rows = VS.list.map((v) => ({ v: v.id, c: itemCost(n, v.id), nm: itemName(n, v.id) })), max = Math.max.apply(null, rows.map((r) => r.c));
    return '<h3>Tres versiones de este mueble</h3><ul class="vcmp">' + rows.map((r) =>
      '<li class="' + (r.v === S.ver ? 'is-on' : '') + '">' + vtag(r.v) +
      '<span class="vcmp-n"><b>' + esc(r.nm) + '</b><span class="vbar"><span style="width:' + (r.c / max * 100).toFixed(1) + '%;background:' + verInfo(r.v).color + '"></span></span></span>' +
      '<span class="vcmp-c mono">' + cop(r.c) + '</span>' +
      (r.v === S.ver ? '<span class="vcmp-a">En el modelo</span>' : '<button type="button" class="btn btn-sm" data-setver="' + r.v + '">Ver</button>') + '</li>').join('') + '</ul>' +
      '<p class="note">Cada versión ordena el local a su manera y cambia los doce muebles que se fabrican; los ocho productos que se compran son los mismos. <button type="button" class="link" data-vers="1">Comparar las tres versiones</button></p>';
  }
  /* requisitos del mueble y cómo los cumple cada versión (pestaña Requisitos) */
  function reqPanel(n) {
    const R0 = VS.req[n], cur = cumpleOf(n, S.ver);
    return '<p class="note" style="margin-top:0">Lo que el mueble debe resolver, sacado del documento del proyecto, del plano y de las imágenes de referencia. Es igual para las tres versiones; cambia la manera de cumplirlo.</p>' +
      '<ol class="reqs">' + R0.map((r, i) => {
        const c = cur[i] || ['si', ''];
        return '<li class="req-' + c[0] + '"><div class="req-h">' + stIcon(c[0]) + '<b>' + esc(r) + '</b></div>' +
          '<p><span class="req-v">' + vtag(S.ver, 'sm') + '</span>' + esc(c[1]) + '</p>' +
          '<div class="req-o">' + VS.list.filter((v) => v.id !== S.ver).map((v) => { const o = cumpleOf(n, v.id)[i] || ['si', '']; return '<span title="' + esc('Versión ' + v.id + ': ' + o[1]) + '">' + vtag(v.id, 'sm') + stIcon(o[0]) + '<em>' + esc(o[1]) + '</em></span>'; }).join('') + '</div></li>';
      }).join('') + '</ol>' +
      '<div class="cta"><button type="button" class="btn" data-reqs="' + n + '">Todos los requisitos de diseño</button></div>';
  }

  /* ventana: las tres versiones lado a lado */
  function openVersions() {
    S.modalKind = 'vers';
    const T3 = VS.list.map((v) => Object.assign({ v }, totals(v.id)));
    const maxF = Math.max.apply(null, T3.map((t) => t.fabricado));
    const minF = Math.min.apply(null, T3.map((t) => t.fabricado));
    const card = (t) => {
      const v = t.v, cur = v.id === S.ver, dif = t.fabricado - minF;
      return '<article class="vcard' + (cur ? ' is-on' : '') + '" style="--vc:' + v.color + '">' +
        '<header>' + vtag(v.id, 'lg') + '<div><h4>' + esc(v.nombre) + '</h4><span>' + esc(v.titulo) + '</span></div></header>' +
        '<p>' + esc(v.concepto) + '</p>' +
        '<dl class="vnums"><div><dt>Mobiliario fabricado</dt><dd class="mono">' + cop(t.fabricado) + '</dd></div><div><dt>Total del local</dt><dd class="mono">' + cop(t.total) + '</dd></div>' +
        '<div class="wide"><dt>Frente a la más económica</dt><dd class="mono">' + (!dif ? 'Es la más económica' : '+' + cop(dif) + ' (+' + Math.round(dif / minF * 100) + ' %)') + '</dd></div></dl>' +
        '<h5>Distribución</h5><ul class="plain">' + (v.distribucion || []).map((m) => '<li>' + esc(m) + '</li>').join('') + '</ul>' +
        '<h5>Materiales</h5><ul class="plain">' + v.materiales.map((m) => '<li>' + esc(m) + '</li>').join('') + '</ul>' +
        '<h5>A favor</h5><ul class="plain pro">' + v.ventajas.map((m) => '<li>' + esc(m) + '</li>').join('') + '</ul>' +
        '<h5>En contra</h5><ul class="plain con">' + v.contras.map((m) => '<li>' + esc(m) + '</li>').join('') + '</ul>' +
        '<footer>' + (cur ? '<span class="vcur">Es la versión que está en el modelo</span>' : '<button type="button" class="btn btn-led" data-setver="' + v.id + '">Ver la versión ' + v.id + ' en 3D</button>') + '</footer></article>';
    };
    const maxI = Math.max.apply(null, FABN.map((n) => Math.max(itemCost(n, 'A'), itemCost(n, 'B'), itemCost(n, 'C'))));
    const chart = '<div class="gbars" role="table" aria-label="Costo de materiales por mueble y versión">' +
      '<div class="gb-legend" aria-hidden="true">' + VS.list.map((v) => '<span><i style="background:' + v.color + '"></i>' + v.id + ' · ' + esc(v.nombre) + '</span>').join('') + '</div>' +
      FABN.map((n) => '<div class="gb-row" role="row" data-n="' + n + '" tabindex="0"><span class="gb-l" role="rowheader"><i class="num">' + n + '</i>' + esc(baseN[n].short) + '</span><span class="gb-b">' +
        VS.list.map((v) => { const c = itemCost(n, v.id); return '<span class="gb-bar" role="cell" title="' + esc(v.id + ' · ' + itemName(n, v.id) + ': ' + cop(c)) + '"><span style="width:' + Math.max(0.8, c / maxI * 100).toFixed(2) + '%;background:' + v.color + '"></span><em class="mono">' + v.id + ' ' + copShort(c) + '</em></span>'; }).join('') +
        '</span></div>').join('') + '</div>';
    const html =
      '<p class="lead">El mismo local de 6.00 × 7.00 m ordenado de tres maneras. Cada versión tiene su propia distribución y sus doce muebles fabricados, con diseño, materiales, fabricación y armado propios. Los ocho productos que se compran son los mismos: en A y B cambian de lugar.</p>' +
      '<div class="vtot">' + T3.map((t) => '<div style="--vc:' + t.v.color + '"><span>' + vtag(t.v.id, 'sm') + esc(t.v.nombre) + '</span><span class="vtot-b"><span style="width:' + (t.fabricado / maxF * 100).toFixed(1) + '%"></span></span><b class="mono">' + cop(t.fabricado) + '</b></div>').join('') + '</div>' +
      '<p class="note" style="margin-top:6px">Materiales de los doce muebles fabricados. Precios publicados por cada tienda entre el 9 y el 15 de octubre de 2026; sin mano de obra, transporte ni instalación.</p>' +
      '<div class="vcards">' + T3.map(card).join('') + '</div>' +
      '<h3>Costo de cada mueble en las tres versiones <small>toca un mueble para ver su ficha</small></h3>' + chart +
      '<div class="cta"><button type="button" class="btn" data-reqs="0">Requisitos de diseño</button><button type="button" class="btn" data-plan="1">Ver el plano 2D</button><button type="button" class="btn" data-budget="1">Presupuesto de la versión ' + S.ver + '</button></div>';
    openModal('Versiones del mobiliario', html, 'is-wide');
  }

  /* ventana: requisitos de diseño */
  function openReqs(n) {
    S.modalKind = 'reqs'; S.reqN = n || 0;
    const cnt = (v) => { let si = 0, pa = 0; FABN.forEach((k) => cumpleOf(k, v).forEach((c) => { if (c[0] === 'si') si++; else pa++; })); return { si, pa }; };
    const tot = FABN.reduce((a, k) => a + VS.req[k].length, 0);
    const html =
      '<p class="lead">Antes de dibujar un mueble se fijaron las condiciones que debía cumplir: el espacio del plano, la ergonomía de quien atiende y de quien compra, las cargas de las impresoras y del filamento, la luz, la seguridad, la fabricación con láminas comerciales, la imagen de marca y el presupuesto. Las tres versiones responden a los mismos requisitos.</p>' +
      '<div class="rq-sum">' + VS.list.map((v) => { const c = cnt(v.id); return '<div style="--vc:' + v.color + '">' + vtag(v.id) + '<span><b>' + esc(v.nombre) + '</b><small>' + c.si + ' de ' + tot + ' requisitos cumplidos' + (c.pa ? ' · ' + c.pa + ' con salvedad' : '') + '</small></span></div>'; }).join('') + '</div>' +
      '<h3>Requisitos generales</h3><div class="rq-gen">' + VS.generales.map((g) => '<article><h4>' + esc(g.t) + '</h4><span class="src">' + esc(g.src) + '</span><ul class="plain">' + g.d.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></article>').join('') + '</div>' +
      '<h3>Requisitos de cada mueble <small>' + stIcon('si') + ' cumple · ' + stIcon('parcial') + ' cumple con una salvedad</small></h3>' +
      '<div class="rq-pick seg seg-sm" role="group" aria-label="Mueble">' + '<button type="button" data-rqn="0"' + (S.reqN ? '' : ' class="is-on"') + '>Todos</button>' + FABN.map((k) => '<button type="button" data-rqn="' + k + '"' + (S.reqN === k ? ' class="is-on"' : '') + '>' + k + '</button>').join('') + '</div>' +
      '<div class="rq-items">' + FABN.map((k) => '<section class="rq-item" data-rq="' + k + '"' + (S.reqN && S.reqN !== k ? ' hidden' : '') + '><header><i class="num">' + k + '</i><h4>' + esc(baseN[k].short) + '</h4><button type="button" class="btn btn-sm" data-goitem="' + k + '">Ver ficha</button></header>' +
        '<div class="tbl-wrap"><table class="tbl rq-tbl"><thead><tr><th>Requisito</th>' + VS.list.map((v) => '<th class="' + (v.id === S.ver ? 'is-cur' : '') + '">' + vtag(v.id, 'sm') + esc(v.nombre) + '</th>').join('') + '</tr></thead><tbody>' +
        VS.req[k].map((r, i) => '<tr><td>' + esc(r) + '</td>' + VS.list.map((v) => { const c = cumpleOf(k, v.id)[i] || ['si', '']; return '<td class="' + (v.id === S.ver ? 'is-cur' : '') + ' rq-' + c[0] + '">' + stIcon(c[0]) + esc(c[1]) + '</td>'; }).join('') + '</tr>').join('') +
        '</tbody></table></div></section>').join('') + '</div>' +
      '<p class="note">Fuentes: documento «Intención del proyecto», plano de distribución e imágenes de referencia del local. Las medidas del plano se estimaron desde la imagen con el frente de 6.00 m; se verifican en sitio antes de cortar.</p>';
    openModal('Requisitos de diseño', html, 'is-wide');
    L.ui.seg($('.rq-pick'));
    if (S.reqN && !S.reopen) {
      const pk = $('.rq-pick'), el = $('.rq-pick .is-on'), body = $('#modal-body');
      requestAnimationFrame(() => { body.scrollTop = pk.offsetTop - 14; if (el) pk.scrollLeft = el.offsetLeft - pk.clientWidth / 2 + el.offsetWidth / 2; });
    }
  }
  function reopenModal() {
    const k = S.modalKind, body = $('#modal-body'), top = body.scrollTop;
    S.reopen = true;
    try { if (k === 'vers') openVersions(); else if (k === 'reqs') openReqs(S.reqN); else if (k === 'budget') openBudget(); } finally { S.reopen = false; }
    body.scrollTop = top;
  }

  /* --------------------------------------------------------------- plano 2D */
  const PO = { k: 1, x: 0, y: 0, cotas: true, nums: true, ptrs: new Map(), W: 1260, H: 891 };
  const inFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  function openPlan() {
    if (S.planOpen) return;
    exitMontaje(true); deselect(true); if (!$('#modal').hidden) closeModal(); closeSpot(true);
    S.planOpen = true; S.planFrom = S.view || 'fachada';
    renderPlan();
    $('#plano').hidden = false; document.body.classList.add('plan-open');
    $$('#views button').forEach((b) => b.classList.toggle('is-on', b.dataset.view === 'plano'));
    requestAnimationFrame(() => { L.ui.syncSegs(); planFit(false); });
    setHash('plano');
  }
  function closePlan(silent) {
    if (!S.planOpen) return;
    S.planOpen = false; $('#plano').hidden = true; document.body.classList.remove('plan-open'); planCard(null);
    setHash('');
    if (!silent) goView(S.planFrom && VIEWS[S.planFrom] ? S.planFrom : 'fachada', 1.2);
  }
  function renderPlan() {
    $('#pl-sheet').innerHTML = L.plan.svg(S.ver, { cotas: PO.cotas, nums: PO.nums });
    const vi = verInfo(S.ver);
    $('#pl-sub').textContent = 'Versión ' + S.ver + ' · escala 1:50 en A3'; void vi;
    $('#pl-cotas').setAttribute('aria-pressed', PO.cotas ? 'true' : 'false');
    $('#pl-nums').setAttribute('aria-pressed', PO.nums ? 'true' : 'false');
    if (PO.card) planCard(PO.card);
  }
  function planApply(anim) {
    const sh = $('#pl-sheet');
    sh.classList.toggle('is-anim', !!anim);
    sh.style.transform = 'translate(' + PO.x.toFixed(1) + 'px,' + PO.y.toFixed(1) + 'px) scale(' + PO.k.toFixed(4) + ')';
    $('#pl-zv').textContent = Math.round(PO.k / PO.fitK * 100) + ' %';
  }
  function planFit(anim) {
    const st = $('#pl-stage'), w = st.clientWidth, h = st.clientHeight, pad = w < 600 ? 12 : 36;
    PO.fitK = PO.k = Math.min((w - pad * 2) / PO.W, (h - pad * 2) / PO.H);
    PO.x = (w - PO.W * PO.k) / 2; PO.y = (h - PO.H * PO.k) / 2;
    planApply(anim);
  }
  function planZoom(f, cx, cy, anim) {
    const st = $('#pl-stage');
    if (cx == null) { cx = st.clientWidth / 2; cy = st.clientHeight / 2; }
    const k = E.clamp(PO.k * f, PO.fitK * 0.6, PO.fitK * 8), r = k / PO.k;
    PO.x = cx - (cx - PO.x) * r; PO.y = cy - (cy - PO.y) * r; PO.k = k;
    planApply(anim);
  }
  function planHL(n) {
    if (PO.hl === n) return; PO.hl = n;
    $$('#pl-sheet [data-n]').forEach((g) => g.classList.toggle('is-hl', n != null && +g.dataset.n === n));
  }
  function planCard(n) {
    PO.card = n; const c = $('#pl-card');
    if (n == null) { c.hidden = true; planHL(null); return; }
    const d = byN[n], fab = d.origen === 'fabrica';
    c.innerHTML = '<div class="plc-h"><span class="num">' + n + '</span><span class="pill pill-' + d.origen + '">' + (fab ? 'Se fabrica' : 'Se compra') + '</span>' + (fab && VS.req[n] ? vtag(S.ver, 'sm') : '') +
      '<button type="button" class="ibtn ibtn-fill" id="plc-x" aria-label="Cerrar"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>' +
      '<h4>' + esc(d.name) + '</h4><p class="plc-m mono">' + esc(d.dims) + ' · ' + esc(d.cant) + '</p><p class="plc-u">' + esc(d.ubic) + '</p>' +
      '<div class="plc-f"><b class="mono">' + cop(d.total) + '</b><button type="button" class="btn btn-led" id="plc-go">Abrir ficha en 3D</button></div>';
    c.hidden = false; planHL(n);
  }
  function planPrint() {
    document.body.classList.add('is-printing');
    const done = () => { document.body.classList.remove('is-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => { try { window.print(); } catch (e) { done(); } }, 60);
  }
  function planDownload() {
    const svg = '<?xml version="1.0" encoding="UTF-8"?>\n' + L.plan.svg(S.ver, { cotas: PO.cotas, nums: PO.nums });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const a = document.createElement('a'); a.href = url; a.download = 'plano-blackforge-version-' + S.ver.toLowerCase() + '.svg';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    L.ui.toast('Plano descargado', a.download + ' · lámina A3 a escala 1:50, lista para AutoCAD, Illustrator o Inkscape.', 'ok', 5000);
  }
  function bindPlan() {
    const st = $('#pl-stage'), root = $('#plano');
    if (inFrame) { $('#pl-print').hidden = true; $('#pl-svg').hidden = true; }
    L.ui.seg($('#pl-ver'));
    root.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('#pl-back')) return closePlan();
      const vb = t.closest('[data-ver]'); if (vb) return setVersion(vb.dataset.ver);
      if (t.closest('#pl-cotas')) { PO.cotas = !PO.cotas; return renderPlan(); }
      if (t.closest('#pl-nums')) { PO.nums = !PO.nums; return renderPlan(); }
      if (t.closest('#pl-zi')) return planZoom(1.4, null, null, true);
      if (t.closest('#pl-zo')) return planZoom(1 / 1.4, null, null, true);
      if (t.closest('#pl-fit')) return planFit(true);
      if (t.closest('#pl-print')) return planPrint();
      if (t.closest('#pl-svg')) return planDownload();
      if (t.closest('#plc-x')) return planCard(null);
      if (t.closest('#plc-go')) { const n = PO.card; closePlan(true); planCard(null); return select(n, null, { force: true }); }
    });
    const elAt = (t) => t.closest && t.closest('#pl-sheet [data-n]');
    st.addEventListener('pointerover', (e) => { if (e.pointerType === 'touch') return; const g = elAt(e.target); if (PO.card == null) planHL(g ? +g.dataset.n : null); });
    st.addEventListener('pointerleave', () => { if (PO.card == null) planHL(null); });
    st.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { const g = elAt(e.target); if (g) { e.preventDefault(); planCard(+g.dataset.n); } } });
    // desplazar con un dedo o el ratón, pellizcar o rueda para acercar
    let moved = 0, pinch = null;
    st.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      PO.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0;
      try { st.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
      if (PO.ptrs.size === 2) { const p = Array.from(PO.ptrs.values()); pinch = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), k: PO.k }; }
      st.classList.add('is-grab');
    });
    st.addEventListener('pointermove', (e) => {
      const p0 = PO.ptrs.get(e.pointerId); if (!p0) return;
      const dx = e.clientX - p0.x, dy = e.clientY - p0.y; p0.x = e.clientX; p0.y = e.clientY;
      if (PO.ptrs.size === 1) { PO.x += dx; PO.y += dy; moved += Math.abs(dx) + Math.abs(dy); planApply(false); }
      else if (pinch && PO.ptrs.size === 2) {
        const p = Array.from(PO.ptrs.values()), d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), r = st.getBoundingClientRect();
        planZoom(pinch.k * d / pinch.d / PO.k, (p[0].x + p[1].x) / 2 - r.left, (p[0].y + p[1].y) / 2 - r.top, false); moved = 99;
      }
    });
    const up = (e) => {
      const had = PO.ptrs.delete(e.pointerId);
      if (PO.ptrs.size < 2) pinch = null;
      if (!PO.ptrs.size) st.classList.remove('is-grab');
      if (had && moved < 6 && e.type === 'pointerup') {
        const hit = document.elementFromPoint(e.clientX, e.clientY), g = hit && elAt(hit);
        if (g) planCard(+g.dataset.n); else if (!hit || !hit.closest('#pl-card')) planCard(null);
      }
    };
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    st.addEventListener('wheel', (e) => {
      e.preventDefault(); const r = st.getBoundingClientRect();
      if (e.ctrlKey || Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey) planZoom(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX - r.left, e.clientY - r.top, false);
      else { PO.x -= e.deltaX; PO.y -= e.deltaY; planApply(false); }
    }, { passive: false });
    st.addEventListener('dblclick', (e) => { const r = st.getBoundingClientRect(); planZoom(1.8, e.clientX - r.left, e.clientY - r.top, true); });
    window.addEventListener('resize', () => { if (S.planOpen) planFit(false); });
  }

  /* presupuesto de una versión alternativa */
  function budgetAlt(v) {
    const P = DATA.presupuesto, C = VS.calc(v), vi = verInfo(v), TT = totals(v);
    const fab = FABN.map((n) => byN[n]).sort((a, b) => b.total - a.total), buy = DATA.items.filter((i) => i.origen === 'compra').sort((a, b) => b.total - a.total);
    const row = (i) => ({ n: i.n, label: i.short, v: i.total, sub: i.origen === 'fabrica' ? i.name : '' });
    const group = (key) => { const g = {}; C.compras.forEach((c) => { const k = c[key] || 'Otros'; g[k] = g[k] || { r: k, c: 0, n: 0 }; g[k].c += c.costo; g[k].n++; }); return Object.values(g).sort((a, b) => b.c - a.c); };
    const cats = group('cat'), provs = group('prov');
    const compras = C.compras.slice().sort((a, b) => b.costo - a.costo);
    const minFab = Math.min.apply(null, VS.list.map((x) => totals(x.id).fabricado)), keys = new Set(C.compras.map((c) => c.id));
    return '<div class="kpis"><div><span>Total en materiales y equipos · versión ' + v + '</span><b class="mono">' + cop(TT.total) + '</b></div><div><span>12 muebles que se fabrican</span><b class="mono">' + cop(TT.fabricado) + '</b></div><div><span>8 productos que se compran</span><b class="mono">' + cop(P.comprado) + '</b></div></div>' +
      '<p class="lead">' + esc(vi.nombre) + ': ' + esc(vi.titulo.toLowerCase()) + '. ' + (TT.fabricado === minFab ? 'Es la versión de mobiliario más económica de las tres. ' : 'El mobiliario cuesta ' + cop(TT.fabricado - minFab) + ' más que en la versión más económica. ') + 'Los ocho productos que se compran, impresoras incluidas, son los mismos en las tres versiones. Sin mano de obra, transporte ni instalación eléctrica.</p>' +
      '<div class="cols"><section><h3>Se fabrica <small>materiales por mueble</small></h3>' + barList(fab.map(row), fab[0].total, 'is-click') + '</section>' +
      '<section><h3>Se compra <small>igual en las tres versiones</small></h3>' + barList(buy.map(row), buy[0].total, 'is-click') + '</section></div>' +
      '<div class="cols"><section><h3>Por tipo de insumo</h3>' + barList(cats.map((r) => ({ label: r.r, v: r.c, sub: r.n + (r.n === 1 ? ' insumo' : ' insumos') })), cats[0].c) + '</section>' +
      '<section><h3>Por tienda</h3>' + barList(provs.map((r) => ({ label: r.r, v: r.c, sub: r.n + (r.n === 1 ? ' insumo' : ' insumos') })), provs[0].c) + '</section></div>' +
      '<h3>Plan de compras de la versión ' + v + ' <small>' + compras.length + ' insumos · toca el nombre para ver el producto en la tienda</small></h3>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Insumo</th><th>Se compra</th><th>Precio</th><th>Tienda</th><th class="r">Costo</th></tr></thead><tbody>' +
      compras.map((c) => '<tr><td>' + (c.u ? '<a href="' + esc(c.u) + '" target="_blank" rel="noopener">' + esc(c.m) + '</a>' : esc(c.m)) + '</td><td>' + esc(c.texto) + '</td><td class="mono">' + esc(precioTxt(c.precio)) + '</td><td>' + esc(c.prov) + '</td><td class="r mono">' + cop(c.costo) + '</td></tr>').join('') +
      '<tr class="tot"><td>Total de insumos</td><td></td><td></td><td></td><td class="r mono">' + cop(C.total) + '</td></tr></tbody></table></div>' +
      '<div class="cols"><section><h3>Supuestos de las cifras</h3><ul class="plain">' +
      ['Precios publicados en línea por cada tienda entre el 9 y el 15 de octubre de 2026, en pesos colombianos con IVA; la fecha va en la nota de cada precio.',
        'Tableros: se compran láminas completas con un aprovechamiento del 72 %; su costo se reparte entre los muebles por área de piezas.',
        'Tubos y perfiles: se compran barras completas con un 8 % de desperdicio de corte; cintas LED y cantos con un 5 %.',
        'Pinturas y barnices: galones según el área, las manos y el rendimiento de la ficha técnica; filamento en carretes de 1 kg.',
        'El vidrio templado se paga por metro cuadrado con un mínimo de 3 m² por pedido.',
        keys.has('perfil3030') ? 'El perfil de aluminio 30 × 30 se cotizó en tramos de 1 m con el descuento por volumen de la tienda; los tramos largos se cotizan con un distribuidor industrial.' : '',
        'No incluye mano de obra, corte en la tienda, transporte, instalación eléctrica ni plantas.'].filter(Boolean).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></section>' +
      '<section><h3>Antes de comprar</h3><ul class="plain check">' + ['Confirmar precios y existencias: cambian cada semana.', 'Verificar en sitio las medidas del local y de cada mueble.', 'Pedir el despiece al carpintero o al taller metálico antes de comprar láminas y barras.', ({ A: 'Confirmar con la administración del centro comercial que la losa admite los anclajes de la repisa colgante.', B: 'Pedir una muestra de la laca sobre MDF y aprobar el blanco antes de lacar todo.', C: 'Imprimir primero una unión de prueba y comprobar el ajuste con el perfil real.' })[v]].map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></section></div>';
  }
  const precioTxt = (P) => '$' + String(Math.round(P.precio)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' · ' + String(P.pres || '').toLowerCase();

  /* --------------------------------------------------- búsqueda (Spotlight) */
  const SIC = {
    view: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.8 6.8h3.1l1.4-2h5.4l1.4 2h3.1v9.4H2.8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10" cy="11.3" r="2.8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    chart: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 16V9M10 16V4.5M15.5 16v-5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    stack: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3 17 7l-7 4-7-4zM3 10.5l7 4 7-4M3 14l7 4 7-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    house: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16.2V9l6-5 6 5v7.2M8 16.2v-4h4v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    pin: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17.4s-5.2-4.6-5.2-8.6a5.2 5.2 0 1 1 10.4 0c0 4-5.2 8.6-5.2 8.6z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10" cy="8.8" r="1.8" fill="currentColor"/></svg>',
    cube: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.6 16.4 6.3v7.4L10 17.4 3.6 13.7V6.3zM10 10l6.4-3.7M10 10 3.6 6.3M10 10v7.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    plan: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3.5h14v13H3zM3 9.5h5.5v7M11.5 3.5v6H17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    vers: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="5" width="4.4" height="10" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="7.8" y="5" width="4.4" height="10" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="13.1" y="5" width="4.4" height="10" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    req: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8.5 5.5h8M8.5 10h8M8.5 14.5h8M3.2 5.6l1.2 1.1 2-2.2M3.2 10.1l1.2 1.1 2-2.2M3.2 14.6l1.2 1.1 2-2.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  const SP = { list: [], k: 0, from: null };
  function spotEntries() {
    if (SP.all) return SP.all;
    const items = ITEMS().map((d) => ({ sec: 'Mobiliario', ic: String(d.n), t: d.short, s: d.name + ' · ' + (d.origen === 'fabrica' ? 'se fabrica' : 'se compra'), r: cop(d.total), q: norm(d.n + ' ' + d.short + ' ' + d.name + ' ' + d.grupo + ' ' + (d.origen === 'fabrica' ? 'fabrica' : 'compra')), run: () => select(d.n, null, { force: true }) }));
    const views = [['fachada', 'Fachada'], ['interior', 'Interior'], ['aerea', 'Aérea'], ['planta', 'Planta']].map((v) => ({ sec: 'Vistas', ic: SIC.view, t: 'Vista ' + v[1], s: 'Llevar la cámara a esta vista', q: norm('vista camara ' + v[1]), run: () => goView(v[0]) }));
    views.push({ sec: 'Vistas', ic: SIC.plan, t: 'Plano 2D', s: 'Planta de arquitectura a escala 1:50, para imprimir en A3', q: norm('plano 2d planta arquitectura escala imprimir dibujo cotas'), run: () => openPlan() });
    const vers = VS.list.map((v) => ({ sec: 'Versiones', ic: '<b class="vtag" style="--vc:' + v.color + '">' + v.id + '</b>', t: 'Versión ' + v.id + ' · ' + v.nombre + (v.id === S.ver ? ' (en el modelo)' : ''), s: v.titulo, r: copShort(totals(v.id).fabricado), q: norm('version ' + v.id + ' ' + v.nombre + ' ' + v.titulo + ' ' + v.materiales.join(' ')), run: () => setVersion(v.id) }));
    const acts = [
      { ic: SIC.chart, t: 'Presupuesto', s: 'Total, costo por mueble, por insumo, por tienda y plan de corte', q: 'presupuesto costo total precio dinero corte', run: () => openBudget() },
      { ic: SIC.stack, t: 'Materiales y procesos', s: 'Catálogo de precios y cómo se fabrica cada material', q: 'materiales catalogo procesos precios tiendas', run: () => openMats() },
      { ic: SIC.vers, t: 'Comparar versiones', s: 'Las tres versiones del mobiliario, sus materiales y su costo', q: 'versiones comparar alternativas diseño industrial modular original', run: () => openVersions() },
      { ic: SIC.req, t: 'Requisitos de diseño', s: 'Lo que debía cumplir cada mueble y cómo lo cumple cada versión', q: 'requisitos diseño criterios ergonomia cargas normas condiciones', run: () => openReqs(0) },
      { ic: SIC.house, t: 'Montaje del local', s: 'Orden de fabricación y montaje en seis pasos', q: 'montaje armado fabricacion orden pasos', run: () => openMontaje() },
      { ic: SIC.pin, t: 'Números del plano', s: 'Mostrar u ocultar el número de cada elemento', q: 'numeros rotulos etiquetas plano', run: () => $('#btn-labels').click() },
      { ic: SIC.cube, t: 'Descargar modelo 3D (.glb)', s: 'Para Unreal Engine, Blender, Twinmotion o D5', q: 'descargar exportar glb gltf unreal blender twinmotion modelo', run: () => downloadGLB() }
    ].map((a) => Object.assign({ sec: 'Acciones' }, a, { q: norm(a.q + ' ' + a.t) }));
    return (SP.all = acts.concat(views, vers, items));
  }
  function spotRender() {
    const q = norm($('#spot-q').value.trim()), words = q.split(/\s+/).filter(Boolean);
    let list = spotEntries().filter((e) => words.every((w) => e.q.includes(w)));
    if (q) list = list.map((e, i) => [e, (norm(e.t).startsWith(q) ? 0 : 1) * 1000 + i]).sort((a, b) => a[1] - b[1]).map((a) => a[0]);
    SP.list = list; SP.k = Math.min(SP.k, Math.max(0, list.length - 1));
    let sec = '', html = '';
    list.forEach((e, i) => {
      if (!q && e.sec !== sec) { sec = e.sec; html += '<li class="spot-sec" role="presentation">' + sec + '</li>'; }
      html += '<li class="spot-item' + (i === SP.k ? ' is-on' : '') + '" role="option" id="spot-o' + i + '" data-i="' + i + '" aria-selected="' + (i === SP.k) + '"><span class="spot-ic">' + e.ic + '</span><span><b>' + esc(e.t) + '</b><small>' + esc(e.s) + '</small></span><em>' + (e.r || '') + '</em></li>';
    });
    $('#spot-list').innerHTML = html || '<li class="spot-empty">Sin resultados para «' + esc($('#spot-q').value.trim()) + '»</li>';
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
    $('#spot-q').value = ''; spotRender();
    $('#spot').hidden = false; $('#spot-q').focus();
  }
  function closeSpot(keep) {
    if ($('#spot').hidden) return;
    $('#spot').hidden = true;
    if (keep) $('#spot-q').blur(); else restoreFocus(SP.from, $('#spot'));
  }
  function runSpot(i) {
    const e = SP.list[i]; if (!e) return;
    closeSpot(true);
    if (!$('#modal').hidden) closeModal();
    e.run();
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
    $('#spot').addEventListener('click', (e) => { if (e.target.id === 'spot') closeSpot(); });
    $('#btn-search').addEventListener('click', openSpot);
  }

  /* ----------------------------------- ficha como hoja inferior en pantallas angostas */
  function bindSheet() {
    const p = $('#panel');
    let y0 = null, dy = 0, t0 = 0, tap = false;
    p.addEventListener('pointerdown', (e) => {
      if (!app.classList.contains('is-narrow') || !e.target.closest('.grabber, .p-head') || e.target.closest('button')) return;
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

  /* ------------------------------------------------------------------- eventos */
  function bindUI() {
    const U = L.ui;
    ['#panel', '#inv', '#mont'].forEach((q) => U.animated($(q), 460));
    ['#actions', '#stepper', '#hint'].forEach((q) => U.animated($(q), 340));
    U.animated($('#tip'), 150); U.animated($('#modal'), 520); U.animated($('#spot'), 280);
    U.seg($('#views')); U.seg($('#inv-filter'));
    $('#kbd-k').textContent = U.isMac ? '⌘K' : 'Ctrl K';
    $('#btn-search').title = 'Buscar muebles, vistas y acciones (' + (U.isMac ? '⌘K' : 'Ctrl+K') + ')';
    winDrag = U.windowDrag($('.modal-card'), $('.modal-head'), zoomModal);
    bindSpot(); bindSheet();
    $('#views').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) goView(b.dataset.view); });
    $('#brand').addEventListener('click', (e) => { e.preventDefault(); goView('fachada'); });
    $('#btn-inv').addEventListener('click', () => toggleInv());
    $('#btn-budget').addEventListener('click', openBudget);
    $('#btn-mats').addEventListener('click', openMats);
    $('#btn-vers').addEventListener('click', openVersions);
    $('#btn-req').addEventListener('click', () => openReqs(S.sel && VS.req[S.sel.n] ? S.sel.n : 0));
    $('#inv-ver').addEventListener('click', openVersions);
    $('#vers').addEventListener('click', (e) => { const b = e.target.closest('[data-ver]'); if (b) setVersion(b.dataset.ver); });
    U.seg($('#vers'));
    bindPlan();
    $('#btn-montaje').addEventListener('click', () => (S.mont ? exitMontaje() : openMontaje()));
    $('#btn-labels').addEventListener('click', () => { S.labels = !(S.labels || S.plan); if (!S.labels && S.plan) { S.plan = false; } syncLabels(); });
    $('#act-explode').addEventListener('click', () => setExplode(S.mode !== 'exploded'));
    $('#act-play').addEventListener('click', () => playAsm(0));
    $('#act-spin').addEventListener('click', () => { E.autoRotate = !E.autoRotate; $('#act-spin').setAttribute('aria-pressed', E.autoRotate ? 'true' : 'false'); E.invalidate(); });
    $('#st-prev').addEventListener('click', () => { S.playing = false; S.done = false; asmStep(S.step - 1, false); });
    $('#st-next').addEventListener('click', () => { S.playing = false; S.done = false; asmStep(S.step + 1, true); });
    $('#st-play').addEventListener('click', () => {
      const AR = L.armado;
      if (S.playing) { S.playing = false; if (AR && AR.state.on) AR.pause(); updateStepper(); return; }
      const seq = byN[S.sel.n].seq; S.done = false;
      if (AR && AR.state.on && AR.state.paused) { S.playing = true; AR.resume(); updateStepper(); return; }
      S.playing = true;
      asmStep(S.step >= seq.length - 1 ? 0 : S.step + 1, true);
    });
    $('#st-speed').addEventListener('click', (e) => { const b = e.target.closest('[data-speed]'); if (!b) return; $$('#st-speed [data-speed]').forEach((x) => x.classList.toggle('is-on', x === b)); if (L.armado) L.armado.setSpeed(+b.dataset.speed); });
    $('#st-sound').addEventListener('click', () => { const on = $('#st-sound').getAttribute('aria-pressed') !== 'true'; $('#st-sound').setAttribute('aria-pressed', on ? 'true' : 'false'); if (L.armado) L.armado.setSound(on); });
    $('#st-cam').addEventListener('click', () => { const on = $('#st-cam').getAttribute('aria-pressed') !== 'true'; $('#st-cam').setAttribute('aria-pressed', on ? 'true' : 'false'); if (L.armado) L.armado.setFollow(on); });
    if (L.armado) { L.armado.init({ state: S, focus, showDecor, ghostOthers, updateStepper, refreshEdges, afterFinish: () => { if (S.mode === 'asm') exitAsm(); } }); if (L.armado.state.sound) $('#st-sound').setAttribute('aria-pressed', 'true'); }
    $('#st-dots').addEventListener('click', (e) => { const d = e.target.closest('.dot'); if (d) { S.playing = false; S.done = false; asmStep(+d.dataset.k, true); } });
    $('#st-exit').addEventListener('click', () => exitAsm());
    $('#z-in').addEventListener('click', () => E.zoomBy(0.78));
    $('#z-out').addEventListener('click', () => E.zoomBy(1.28));
    $('#modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal' || e.target.closest('#modal-close')) return closeModal();
      if (e.target.closest('#modal-min')) return closeModal(true);
      if (e.target.closest('#modal-zoom')) return zoomModal();
      const li = e.target.closest('.bars.is-click li[data-n], .gb-row[data-n]'); if (li) { closeModal(); select(+li.dataset.n, null, { tab: li.classList.contains('gb-row') ? 'resumen' : 'mats', force: true }); return; }
      const t = e.target;
      const sv = t.closest('[data-setver]'); if (sv) { closeModal(); return setVersion(sv.dataset.setver); }
      if (t.closest('[data-vers]')) return openVersions();
      const rq = t.closest('[data-reqs]'); if (rq) return openReqs(+rq.dataset.reqs);
      if (t.closest('[data-plan]')) { closeModal(); return openPlan(); }
      if (t.closest('[data-budget]')) return openBudget();
      const gi = t.closest('[data-goitem]'); if (gi) { closeModal(); if (S.planOpen) closePlan(true); return select(+gi.dataset.goitem, null, { tab: 'req', force: true }); }
      const rn = t.closest('[data-rqn]'); if (rn) { S.reqN = +rn.dataset.rqn; $$('.rq-pick button').forEach((b) => b.classList.toggle('is-on', b === rn)); $$('.rq-item').forEach((x) => { x.hidden = !!S.reqN && +x.dataset.rq !== S.reqN; }); }
    });
    $('#modal').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const li = e.target.closest && e.target.closest('.bars.is-click li[data-n], .gb-row[data-n]'); if (li) { closeModal(); select(+li.dataset.n, null, { tab: 'mats', force: true }); } } });
    $('#mont').addEventListener('click', (e) => {
      if (e.target.closest('#mont-exit')) return exitMontaje();
      if (e.target.closest('#mont-play')) {
        const st = S.mont, n = MT().pasos.length;
        if (st.playing) { st.playing = false; S.gen++; stopTweens(); montState(st.step); $('#mont-play').textContent = 'Continuar'; E.shadowDirty = true; E.invalidate(); }
        else playMontaje(st.step >= n - 1 ? 0 : st.step + 1);
        return;
      }
      const b = e.target.closest('.mont-steps button'); if (b) playMontaje(+b.dataset.k);
    });
    bindPanel();
    window.addEventListener('keydown', (e) => {
      // ⌘K / Ctrl+K o «/» abren la búsqueda, como Spotlight
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if ($('#spot').hidden) openSpot(); else closeSpot(); return; }
      if (!$('#spot').hidden) { if (e.key === 'Escape') closeSpot(); return; }
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openSpot(); return; }
      if (e.key === 'Escape') { if (!$('#modal').hidden) return closeModal(); if (S.planOpen) { if (PO.card != null) return planCard(null); return closePlan(); } if (S.mode === 'asm') return exitAsm(); if (S.mode === 'exploded') return setExplode(false); if (S.mont) return exitMontaje(); if (S.sel) return deselect(); }
      if (!$('#modal').hidden || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      if (S.planOpen) { if (e.key === '+' || e.key === '=') planZoom(1.4, null, null, true); else if (e.key === '-') planZoom(1 / 1.4, null, null, true); else if (e.key === '0') planFit(true); return; }
      if (!S.sel && /^[abc]$/i.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) { setVersion(e.key.toUpperCase()); return; }
      if (!S.sel) return;
      if (e.key === 'ArrowRight' && !e.target.closest('.tabs')) select(NEXT(S.sel.n, 1).n, null, { tab: S.tab, force: true });
      else if (e.key === 'ArrowLeft' && !e.target.closest('.tabs')) select(NEXT(S.sel.n, -1).n, null, { tab: S.tab, force: true });
      else if (e.key === 'e' || e.key === 'E') { if (!$('#actions').hidden || S.mode === 'exploded') setExplode(S.mode !== 'exploded'); }
    });
    E.onClick = onClick; E.onHover = onHover; E.afterRender = updateLabels;
    E.onResize = () => { layout(); };
    E.onUserMove = () => { $('#tip').hidden = true; if (L.armado && L.armado.state.on && L.armado.state.follow) { L.armado.setFollow(false); $('#st-cam').setAttribute('aria-pressed', 'false'); } if (S.view) { S.view = null; $$('#views button').forEach((b) => b.classList.remove('is-on')); } };
  }

  /* -------------------------------------------------------------------- inicio */
  function boot() {
    if (!window.THREE) { $('#intro-msg').textContent = 'No se pudo cargar el motor 3D. Revisa la conexión y recarga la página.'; return; }
    try {
      E.init($('#gl'));
      R.build(E.scene); F.build();
      E.finalize(); E.captureEnv();
    } catch (err) {
      console.error(err);
      $('#intro-msg').textContent = 'Este navegador no pudo iniciar el modelo 3D (WebGL).';
      return;
    }
    const hm0 = /^#(?:m\d+|plano)?([abc])?$/i.exec(location.hash || '') || [];
    setVersion(hm0[1] ? hm0[1].toUpperCase() : 'A', { quiet: true, force: true });
    buildInventory(); buildLabels(); bindUI(); syncVerUI();
    const redraw = () => { L.redraws.forEach((f) => f()); E.invalidate(3); };
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('300 80px Jost'), document.fonts.load('600 80px Jost'), document.fonts.load('400 40px Jost')]).then(redraw, () => {});
    const hm = /^#(?:m(\d+)|(plano))?([abc])?$/i.exec(location.hash || '') || [];
    const start = hm[1] ? [null, hm[1]] : null, startPlan = !!hm[2];

    if (E.size.w >= 1280 && !start) { S.inv = true; $('#inv').hidden = false; $('#btn-inv').setAttribute('aria-pressed', 'true'); }
    S.view = 'fachada';
    layout();
    E.cam.cur.th = E.cam.goal.th = 0.95; E.cam.cur.ph = E.cam.goal.ph = 0.62; E.cam.cur.r = E.cam.goal.r = 27; E.cam.cur.ty = E.cam.goal.ty = 0.6;
    if (startPlan) openPlan();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      app.classList.remove('is-loading'); app.classList.add('is-ready');
      const v = VIEWS.fachada, a = S.usable.w / S.usable.h, k = Math.max(1, v.min / a);
      E.flyTo({ target: new T.Vector3(v.t[0], v.t[1], v.t[2]), theta: v.th, phi: v.ph, radius: Math.min(25, v.r * k) }, 3.4, {
        delay: 0.35, ease: E.ease.inOut,
        done: () => { if (start && F.items[+start[1]]) select(+start[1]); }
      });
    }));
  }
  L.api = { select, deselect, setExplode, playAsm, asmStep, goView, openMontaje, exitMontaje, openBudget, openMats, openSpot, downloadGLB, closeSpot, toggleInv, layout, setVersion, openPlan, closePlan, openReqs, openVersions, planFit, state: S };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
