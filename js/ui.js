/* ============================================================================
   INTERFAZ — comportamiento estilo macOS, sin dependencias:
   visibilidad animada, controles segmentados con indicador deslizante,
   notificaciones y ventanas que se arrastran, se amplían y se minimizan hacia
   el botón que las abrió. También las piezas compartidas de accesibilidad.

   L.ui (= U), para todos los módulos:
     animated(el, ms)           el.hidden se anima (entra y sale con resorte)
     seg(el) · syncSegs()       control segmentado con indicador deslizante
     toast(título, texto, kind, ms) → { el, set(texto, título?), close() }
                                kind: ok | err | link | cube | … (cualquier nombre de icon)
                                ms: duración; 0 = se queda hasta close(). Los de error
                                (kind 'err') traen ✕, no se van solos ni con un clic
                                en cualquier parte. El tiempo se detiene con el cursor
                                o el foco encima.
     say(texto)                 lo lee el lector de pantalla (#sr-status, sin interrumpir)
     trap(el, { initial })      el foco queda dentro de el y todo lo demás queda inerte
                                (salvo #toasts, #sr-status y lo marcado con data-no-inert).
                                Es una pila: una capa encima de otra.
     release(el)                suelta esa capa y vuelve a la anterior
     tabbables(el)              lo que se alcanza con Tab dentro de el, en orden
     icon(nombre)               juego de íconos SVG compartido (ok, err, link, cube, chart,
                                view, stack, house, pin, search, list, close, rotL, rotR,
                                plus, minus, play, pause, prev, next, help, print, back, text)
     originFrom(win, from) · windowDrag(win, handle, onZoom) · isMac · reduced()
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const U = (L.ui = L.ui || {});
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  U.reduced = () => !!(mq && mq.matches) || !!(document.getElementById('app') && document.getElementById('app').classList.contains('is-still'));
  const hidDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidden');

  /* -------------------------------------------------------------- íconos
     Un solo juego para la barra, la búsqueda, las notificaciones y los módulos nuevos. */
  const sv = (d, extra) => '<svg viewBox="0 0 20 20" aria-hidden="true"' + (extra || '') + '>' + d + '</svg>';
  const ln = (d, w) => '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="' + (w || 1.6) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  const ICONS = {
    ok: sv(ln('m5 10.4 3.2 3.2L15.2 6.6', 2.2)),
    err: sv(ln('M10 5.5v5.2M10 14.2v.3', 2.4)),
    link: sv(ln('M8.6 11.4a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-1 1M11.4 8.6a3 3 0 0 0-4.2 0l-2.6 2.6a3 3 0 0 0 4.2 4.2l1-1', 1.8)),
    cube: sv(ln('M10 2.6 16.4 6.3v7.4L10 17.4 3.6 13.7V6.3zM10 10l6.4-3.7M10 10 3.6 6.3M10 10v7.4', 1.5)),
    chart: sv(ln('M4.5 16V9M10 16V4.5M15.5 16v-5.5', 2)),
    view: sv(ln('M2.8 6.8h3.1l1.4-2h5.4l1.4 2h3.1v9.4H2.8z', 1.5) + '<circle cx="10" cy="11.3" r="2.8" fill="none" stroke="currentColor" stroke-width="1.5"/>'),
    stack: sv(ln('M10 3 17 7l-7 4-7-4zM3 10.5l7 4 7-4M3 14l7 4 7-4', 1.5)),
    house: sv(ln('M4 16.2V9l6-5 6 5v7.2M8 16.2v-4h4v4', 1.5)),
    pin: sv(ln('M10 17.4s-5.2-4.6-5.2-8.6a5.2 5.2 0 1 1 10.4 0c0 4-5.2 8.6-5.2 8.6z', 1.5) + '<circle cx="10" cy="8.8" r="1.8" fill="currentColor"/>'),
    search: sv('<circle cx="8.6" cy="8.6" r="5.4" fill="none" stroke="currentColor" stroke-width="1.7"/>' + ln('m12.6 12.6 4.4 4.4', 1.8)),
    list: sv(ln('M7.5 5.5h9M7.5 10h9M7.5 14.5h9', 1.7) + '<circle cx="4" cy="5.5" r="1.1" fill="currentColor"/><circle cx="4" cy="10" r="1.1" fill="currentColor"/><circle cx="4" cy="14.5" r="1.1" fill="currentColor"/>'),
    text: sv(ln('M5 3.5h7l3 3v10H5zM12 3.5v3h3M7.5 10h5M7.5 13h5', 1.5)),
    close: sv(ln('M5.5 5.5l9 9M14.5 5.5l-9 9', 2.2)),
    rotL: sv(ln('M4 10a6 6 0 1 0 2-4.5M5.5 2.5v3.3h3.3', 1.7)),
    rotR: sv(ln('M16 10a6 6 0 1 1-2-4.5M14.5 2.5v3.3h-3.3', 1.7)),
    plus: sv(ln('M10 4.5v11M4.5 10h11', 1.8)),
    minus: sv(ln('M4.5 10h11', 1.8)),
    play: sv('<path d="M6 4.5v11l9-5.5z" fill="currentColor"/>'),
    pause: sv(ln('M6 4.5v11M14 4.5v11', 2.6)),
    prev: sv(ln('M12.5 4.5 7 10l5.5 5.5', 2)),
    next: sv(ln('M7.5 4.5 13 10l-5.5 5.5', 2)),
    back: sv(ln('M16 10H4.5M9 5 4 10l5 5', 1.8)),
    help: sv('<circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" stroke-width="1.5"/>' + ln('M7.9 8a2.2 2.2 0 1 1 3.1 2c-.7.3-1 .8-1 1.5v.3', 1.6) + '<circle cx="10" cy="14.4" r="1" fill="currentColor"/>'),
    print: sv(ln('M5.5 7.5V3.5h9v4M5.5 14H3.5V8.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1V14h-2M5.5 11.5h9v5h-9z', 1.5))
  };
  U.icon = function (name) { return ICONS[name] || ''; };

  /* ------------------------------------------------- visibilidad animada
     La aplicación sigue usando el.hidden como fuente de verdad (lo lee y lo
     escribe al instante); aquí solo se anima. Al ocultar, el atributo real
     se pone cuando termina la salida, así el panel se va deslizando. */
  U.animated = function (el, ms) {
    if (!el || el._anim) return el;
    ms = ms == null ? 380 : ms;
    let logical = hidDesc.get.call(el), timer = 0;
    el._anim = true;
    el.classList.add('anim');
    if (!logical) el.classList.add('is-shown');
    Object.defineProperty(el, 'hidden', {
      configurable: true,
      get() { return logical; },
      set(v) {
        v = !!v;
        if (v === logical) return;
        logical = v; clearTimeout(timer);
        if (!v) {
          hidDesc.set.call(el, false);
          el.classList.remove('is-leaving');
          void el.offsetWidth;                         // fija el estado de partida antes de animar
          el.classList.add('is-shown');
          requestAnimationFrame(U.syncSegs);
        } else {
          el.classList.remove('is-shown'); el.classList.add('is-leaving');
          timer = setTimeout(() => { if (logical) { hidDesc.set.call(el, true); el.classList.remove('is-leaving'); } }, U.reduced() ? 0 : ms);
        }
      }
    });
    return el;
  };

  /* --------------------------------------- control segmentado con indicador */
  const segs = [];
  /* los controles que ya no están en la página (la ficha se vuelve a dibujar) se sueltan con su vigía */
  function prune() {
    for (let i = segs.length - 1; i >= 0; i--) {
      if (segs[i].isConnected) continue;
      if (segs[i]._mo) segs[i]._mo.disconnect();
      segs.splice(i, 1);
    }
  }
  U.seg = function (seg) {
    if (!seg || seg._sync) return;
    prune();
    const th = document.createElement('span');
    th.className = 'seg-thumb no-anim'; th.setAttribute('aria-hidden', 'true');
    seg.appendChild(th);
    let ready = false;
    seg._sync = function () {
      const on = seg.querySelector(':scope > button.is-on, :scope > button[aria-selected="true"]');
      if (!on || !on.offsetWidth) { th.style.opacity = '0'; return; }
      th.style.width = on.offsetWidth + 'px';
      th.style.transform = 'translateX(' + on.offsetLeft + 'px)';
      th.style.opacity = '1';
      if (!ready) { ready = true; requestAnimationFrame(() => requestAnimationFrame(() => th.classList.remove('no-anim'))); }
    };
    seg._mo = new MutationObserver(seg._sync);
    seg._mo.observe(seg, { subtree: true, attributes: true, attributeFilter: ['class', 'aria-selected'] });
    segs.push(seg);
    seg._sync();
  };
  U.syncSegs = function () {
    prune();
    segs.forEach((s) => s._sync());
  };
  window.addEventListener('resize', U.syncSegs);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(U.syncSegs);

  /* ------------------------------------------------------- notificaciones
     El contenedor #toasts ya es una región «cortés»: cada aviso nuevo se lee una vez. */
  U.toast = function (title, body, kind, ms) {
    const box = document.getElementById('toasts');
    const none = { el: null, set() {}, close() {} };
    if (!box) return none;
    const err = kind === 'err', keep = err || ms === 0;
    const t = document.createElement('div');
    t.className = 'toast' + (err ? ' is-err' : '');
    t.innerHTML = '<span class="toast-ic' + (err ? ' is-err' : '') + '">' + (ICONS[kind] || ICONS.ok) + '</span><div class="toast-txt"><b></b><p></p></div>' +
      (err ? '<button type="button" class="toast-x" aria-label="Cerrar aviso" title="Cerrar">' + ICONS.close + '</button>' : '');
    const tb = t.querySelector('b'), tp = t.querySelector('p');
    tb.textContent = title || '';
    tp.textContent = body || ''; tp.hidden = !body;
    box.appendChild(t);
    let gone = false, timer = 0, left = keep ? 0 : (ms || 4200), t0 = 0, held = 0;
    const close = () => {
      if (gone) return; gone = true; clearTimeout(timer);
      t.classList.add('is-out');
      setTimeout(() => t.remove(), U.reduced() ? 0 : 420);
    };
    const run = () => { if (!left || gone || held) return; t0 = performance.now(); timer = setTimeout(close, left); };
    // el tiempo se detiene mientras el cursor o el foco están encima, y sigue al salir
    const hold = () => { held++; if (held === 1 && left && timer) { clearTimeout(timer); timer = 0; left = Math.max(1200, left - (performance.now() - t0)); } };
    const free = () => { held = Math.max(0, held - 1); if (!held) run(); };
    t.addEventListener('pointerenter', hold); t.addEventListener('pointerleave', free);
    t.addEventListener('focusin', hold); t.addEventListener('focusout', free);
    if (err) t.querySelector('.toast-x').addEventListener('click', close);
    else t.addEventListener('click', (e) => { if (!e.target.closest('a, button')) close(); });
    run();
    // como mucho tres a la vez: primero se van los que se irían solos
    const list = Array.from(box.querySelectorAll('.toast:not(.is-out)'));
    if (list.length > 3) {
      const old = list.find((x) => x !== t && !x._keep) || list[0];
      if (old && old._close) old._close(); else if (old) old.remove();
    }
    t._keep = keep; t._close = close;
    return {
      el: t,
      set(text, head) { if (head != null) tb.textContent = head; tp.textContent = text || ''; tp.hidden = !text; },
      close
    };
  };

  /* --------------------------------------------------- avisos para el lector de pantalla
     Se vacía y se escribe en el cuadro siguiente: así se anuncia aunque el texto se repita. */
  let sayId = 0;
  U.say = function (text) {
    let el = document.getElementById('sr-status');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sr-status'; el.className = 'sr-only';
      el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      (document.getElementById('app') || document.body).appendChild(el);
    }
    const id = ++sayId, msg = String(text == null ? '' : text);
    el.textContent = '';
    const put = () => { if (id === sayId && el.textContent !== msg) el.textContent = msg; };
    requestAnimationFrame(put);
    setTimeout(put, 120);                              // pestañas en segundo plano no dibujan cuadros
  };

  /* --------------------------------------------------------- foco encerrado
     Mientras una ventana o la búsqueda están abiertas, Tab da la vuelta dentro de
     ellas y todo lo demás queda inerte (ni foco, ni clic, ni lector de pantalla). */
  const FOCUSABLE = 'a[href], area[href], button, input, select, textarea, iframe, summary, audio[controls], video[controls], [tabindex], [contenteditable=""], [contenteditable="true"]';
  const KEEP = '#toasts, #sr-status, [data-no-inert]';
  const SKIP = /^(SCRIPT|STYLE|LINK|TEMPLATE|NOSCRIPT)$/;
  const traps = [];                                  // pila: { el, back, last }
  const mine = new Set();                            // lo que dejamos inerte nosotros (lo demás no se toca)
  const hist = [];                                   // últimos elementos con foco, para devolverlo
  const shown = (n) => !!(n && n.isConnected && n.getClientRects().length && !n.closest('[inert], [hidden], .anim:not(.is-shown)') && getComputedStyle(n).visibility !== 'hidden');
  U.tabbables = function (root) {
    if (!root) return [];
    return Array.from(root.querySelectorAll(FOCUSABLE)).filter((n) => {
      if (n.tabIndex < 0 || n.disabled || (n.tagName === 'INPUT' && n.type === 'hidden')) return false;
      if (n.tagName === 'SUMMARY' && n.parentElement.querySelector(':scope > summary') !== n) return false;
      return shown(n);
    });
  };
  function shut(root, keep) {
    Array.from(root.children).forEach((c) => {
      if (keep.indexOf(c) >= 0 || SKIP.test(c.tagName)) return;
      if (keep.some((k) => c.contains(k))) { shut(c, keep); return; }
      if (c.hasAttribute('inert')) return;             // ya estaba inerte por otro motivo
      c.setAttribute('inert', ''); mine.add(c);
    });
  }
  function applyInert() {
    mine.forEach((n) => n.removeAttribute('inert')); mine.clear();
    const top = traps[traps.length - 1];
    if (!top || !top.el.isConnected) return;
    shut(document.body, [top.el].concat(Array.from(document.querySelectorAll(KEEP))));
  }
  const focusTo = (n) => { if (!n) return false; if (!n.matches(FOCUSABLE) && n.tabIndex < 0 && !n.hasAttribute('tabindex')) n.setAttribute('tabindex', '-1'); n.focus({ preventScroll: true }); return document.activeElement === n; };
  document.addEventListener('focusin', (e) => {
    const t = e.target;
    hist.push(t); if (hist.length > 8) hist.shift();
    traps.forEach((x) => { if (x.el.contains(t)) x.last = t; });
  }, true);
  U.trap = function (el, opt) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return;
    opt = opt || {};
    if (traps.some((x) => x.el === el)) return;       // ya está en la pila: no se reordena
    // a dónde volver: el último elemento con foco que no está en la capa
    const back = hist.slice().reverse().find((n) => n !== document.body && !el.contains(n)) || null;
    traps.push({ el, back, last: null });
    applyInert();
    const ae = document.activeElement;
    const ini = typeof opt.initial === 'string' ? el.querySelector(opt.initial) : opt.initial;
    if (ini && shown(ini)) focusTo(ini);
    else if (!el.contains(ae)) focusTo(U.tabbables(el)[0] || el);
  };
  U.release = function (el) {
    if (typeof el === 'string') el = document.querySelector(el);
    const i = traps.findIndex((x) => x.el === el);
    if (i < 0) return;
    const entry = traps.splice(i, 1)[0];
    applyInert();
    // si el foco se quedó en la capa que se cierra (o en nada), vuelve a la capa de abajo o a quien la abrió
    const ae = document.activeElement;
    if (ae && ae !== document.body && !entry.el.contains(ae)) return;
    const top = traps[traps.length - 1];
    const cands = top ? [top.last].concat(U.tabbables(top.el)) : [entry.back].concat(hist.slice().reverse());
    const to = cands.find((n) => n && n !== document.body && !entry.el.contains(n) && (!top || top.el.contains(n)) && shown(n));
    if (to) focusTo(to);
  };
  /* Tab y Mayús+Tab dan la vuelta dentro de la capa de arriba (también donde inert no existe) */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey || !traps.length) return;
    const top = traps[traps.length - 1];
    if (!top.el.isConnected) return;
    const list = U.tabbables(top.el);
    if (!list.length) { e.preventDefault(); focusTo(top.el); return; }
    const ae = document.activeElement, first = list[0], last = list[list.length - 1];
    let to = null;
    if (!top.el.contains(ae)) to = e.shiftKey ? last : first;
    else if (e.shiftKey ? ae === first || first.compareDocumentPosition(ae) & Node.DOCUMENT_POSITION_PRECEDING : ae === last || last.compareDocumentPosition(ae) & Node.DOCUMENT_POSITION_FOLLOWING) to = e.shiftKey ? last : first;
    else if (ae === top.el) to = e.shiftKey ? last : first;
    if (to) { e.preventDefault(); focusTo(to); }
  }, true);

  /* -------------------------------------------------------------- ventanas */
  /* origen de la animación: el botón que abrió la ventana (como en el Dock de macOS) */
  U.originFrom = function (win, from) {
    if (!from || !from.getBoundingClientRect || !win.offsetParent) { win.style.transformOrigin = ''; return; }
    const b = from.getBoundingClientRect(), p = win.offsetParent.getBoundingClientRect();
    if (!b.width) { win.style.transformOrigin = ''; return; }
    const ox = b.left + b.width / 2 - p.left - win.offsetLeft, oy = b.top + b.height / 2 - p.top - win.offsetTop;
    win.style.transformOrigin = ox.toFixed(0) + 'px ' + oy.toFixed(0) + 'px';
  };
  /* la barra de título arrastra la ventana; doble clic la amplía */
  U.windowDrag = function (win, handle, onZoom) {
    let on = false, sx = 0, sy = 0, dx = 0, dy = 0, r0 = null;
    const set = () => { win.style.setProperty('--dx', dx + 'px'); win.style.setProperty('--dy', dy + 'px'); };
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button') || win.classList.contains('is-zoomed') || e.pointerType === 'touch') return;
      on = true; sx = e.clientX - dx; sy = e.clientY - dy; r0 = win.getBoundingClientRect();
      r0 = { left: r0.left - dx, top: r0.top - dy, width: r0.width };
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
    });
    handle.addEventListener('pointermove', (e) => {
      if (!on) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      // la barra de título nunca sale de la pantalla
      dx = Math.max(-r0.left - r0.width + 120, Math.min(window.innerWidth - r0.left - 120, dx));
      dy = Math.max(8 - r0.top, Math.min(window.innerHeight - r0.top - 52, dy));
      set();
    });
    const up = () => { on = false; };
    handle.addEventListener('pointerup', up); handle.addEventListener('pointercancel', up);
    handle.addEventListener('dblclick', (e) => { if (!e.target.closest('button') && onZoom) onZoom(); });
    return { reset() { dx = 0; dy = 0; set(); } };
  };

  /* ⌘ en Mac, Ctrl en los demás */
  U.isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
})();
