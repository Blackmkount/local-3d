/* ============================================================================
   INTERFAZ — comportamiento estilo macOS, sin dependencias:
   visibilidad animada, controles segmentados con indicador deslizante,
   notificaciones y ventanas que se arrastran, se amplían y se minimizan hacia
   el botón que las abrió.
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const U = (L.ui = {});
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  U.reduced = () => !!(mq && mq.matches);
  const hidDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidden');

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
  U.seg = function (seg) {
    if (!seg || seg._sync) return;
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
    new MutationObserver(seg._sync).observe(seg, { subtree: true, attributes: true, attributeFilter: ['class', 'aria-selected'] });
    segs.push(seg);
    seg._sync();
  };
  U.syncSegs = function () {
    for (let i = segs.length - 1; i >= 0; i--) { if (segs[i].isConnected) segs[i]._sync(); else segs.splice(i, 1); }
  };
  window.addEventListener('resize', U.syncSegs);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(U.syncSegs);

  /* ------------------------------------------------------- notificaciones */
  const ICON = {
    ok: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10.4 3.2 3.2L15.2 6.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    err: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 5.5v5.2M10 14.2v.3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    link: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8.6 11.4a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-1 1M11.4 8.6a3 3 0 0 0-4.2 0l-2.6 2.6a3 3 0 0 0 4.2 4.2l1-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    cube: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.6 16.4 6.3v7.4L10 17.4 3.6 13.7V6.3zM10 10l6.4-3.7M10 10 3.6 6.3M10 10v7.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
  };
  U.toast = function (title, body, kind, ms) {
    const box = document.getElementById('toasts');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = '<span class="toast-ic' + (kind === 'err' ? ' is-err' : '') + '">' + (ICON[kind] || ICON.ok) + '</span><div><b></b><p></p></div>';
    t.querySelector('b').textContent = title;
    t.querySelector('p').textContent = body || '';
    box.appendChild(t);
    let gone = false;
    const kill = () => { if (gone) return; gone = true; t.classList.add('is-out'); setTimeout(() => t.remove(), U.reduced() ? 0 : 420); };
    t.addEventListener('click', kill);
    setTimeout(kill, ms || 4200);
    while (box.children.length > 3) box.firstElementChild.remove();
  };

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
