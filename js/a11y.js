/* ============================================================================
   ACCESIBILIDAD — lo que oye el lector de pantalla y lo que alcanza el teclado.
   Se carga después de app.js y solo usa L.bus, L.ui y L.api (lee L.data para
   los nombres). Lo que viene de otros módulos se pregunta antes de usarlo.

   - Anuncia en #sr-status (L.ui.say): la ficha que se abre («Ficha 7: Mesón de
     impresoras, 2.153.047 pesos»), la vista, cada paso del armado y del
     montaje, el filtro del mobiliario y cuántos resultados da la búsqueda.
   - Encierra el foco (L.ui.trap) en la ventana y en la búsqueda mientras están
     abiertas, y lo suelta al cerrarlas (L.ui.release).
   - Pestañas de la ficha: ← → Inicio y Fin eligen y enfocan otra pestaña.
   - Esc esconde el globo que sigue al cursor.
   - La primera vez que se usa Tab: «Pulsa ? para ver la ayuda y los atajos».
   - En pantallas angostas la búsqueda dice solo «Buscar…».
   - ⟲ y ⟳ (#z-left, #z-right) giran el modelo.
   - Copia el title de cada botón de la barra en data-tip: de 860 a 1100 px
     el nombre aparece al instante en un globo (css/styles.css).
   - Mide el logotipo de la barra (--brand-w) para poner el selector de modo a su lado.
   - Al imprimir abre los «Para expertos» y rotula cada pestaña de la ficha.
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D || {};
  const U = L.ui, bus = L.bus;
  if (!U || !bus) return;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const pesos = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const byN = {}; ((L.data && L.data.items) || []).forEach((d) => { byN[d.n] = d; });
  const api = () => L.api || {};
  const newCore = () => !!api().current;                // app.js con eventos y L.api completo
  const later = (fn, ms) => { let t = 0; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* ----------------------------------------------------------------- anuncios */
  bus.on('select', (e) => {
    const d = byN[e.n]; if (!d) return;
    U.say('Ficha ' + d.n + ': ' + d.name + ', ' + pesos(d.total) + ' pesos');
  });
  bus.on('view', (e) => {
    const b = $('#views [data-view="' + e.name + '"]');
    U.say('Vista ' + (b ? b.textContent.trim() : e.name));
  });
  bus.on('asm-step', (e) => {
    U.say(e.done ? 'Armado completo' : 'Paso ' + (e.k + 1) + ' de ' + e.count + ': ' + (e.text || ''));
  });
  // el paso del montaje se dice una sola vez, por aquí (la tarjeta del paso deja de ser región viva)
  bus.on('montaje', (e) => { if (e.open) $$('#mont [aria-live]').forEach((el) => el.removeAttribute('aria-live')); });
  bus.on('montaje-step', (e) => {
    U.say('Montaje, paso ' + (e.k + 1) + ' de ' + e.count + ': ' + (e.title || ''));
  });
  bus.on('montaje-done', () => U.say('Montaje completo: el local está listo.'));
  const sayCount = later((n) => U.say(n === 0 ? 'Ningún elemento coincide' : n === 1 ? '1 elemento' : n + ' elementos'), 400);
  bus.on('filter', (e) => { if (typeof e.shown === 'number') sayCount(e.shown); });

  /* resultados de la búsqueda: se dicen cuando cambian mientras se escribe */
  const spotList = $('#spot-list');
  let spotN = -1;
  const countSpot = () => (spotList ? spotList.querySelectorAll('.spot-item').length : 0);
  const saySpot = later(() => {
    const sp = $('#spot'); if (!sp || sp.hidden) return;
    const n = countSpot();
    if (n === spotN) return;
    spotN = n;
    U.say(n === 0 ? 'Sin resultados' : n === 1 ? '1 resultado' : n + ' resultados');
  }, 350);
  if (spotList) new MutationObserver(saySpot).observe(spotList, { childList: true });

  /* ------------------------------------------------------------ foco encerrado
     Los eventos de app.js mandan; además se vigila la clase de #modal y #spot, así
     la trampa funciona también con una versión de app.js que no avise. */
  const card = $('#modal .modal-card'), spotCard = $('#spot .spot-card');
  const syncModal = () => { const m = $('#modal'); if (!m || !card) return; if (m.hidden) U.release(card); else { U.trap(card); fitTables(); } };
  const syncSpot = () => {
    const s = $('#spot'); if (!s || !spotCard) return;
    if (s.hidden) { U.release(spotCard); spotN = -1; } else { U.trap(spotCard); if (spotN < 0) spotN = countSpot(); }
  };
  bus.on('modal', () => { if (card) { U.trap(card); fitTables(); } });
  bus.on('modal-close', () => { if (card) U.release(card); });
  bus.on('spot', (e) => { if (!spotCard) return; if (e.open) { U.trap(spotCard); spotN = countSpot(); } else { U.release(spotCard); spotN = -1; } });
  ['#modal', '#spot'].forEach((q, i) => { const el = $(q); if (el) new MutationObserver(i ? syncSpot : syncModal).observe(el, { attributes: true, attributeFilter: ['class', 'hidden'] }); });
  /* tablas anchas que se desplazan de lado: alcanzables con el teclado y con nombre */
  function fitTables() {
    requestAnimationFrame(() => $$('#modal .tbl-wrap').forEach((w) => {
      if (w.hasAttribute('tabindex') || w.scrollWidth <= w.clientWidth + 1) return;
      let h = w.previousElementSibling; while (h && !/^H[2-4]$/.test(h.tagName)) h = h.previousElementSibling;
      const sum = w.closest('details') && w.closest('details').querySelector('summary');
      w.tabIndex = 0; w.setAttribute('role', 'region');
      w.setAttribute('aria-label', ((h && h.textContent) || (sum && sum.textContent) || 'Tabla') + ' (se desplaza de lado)');
    }));
  }

  /* respaldo para una versión de app.js que todavía no conoce «Cerrar» (#modal-x) ni «Cancelar» (#spot-cancel) */
  const mx = $('#modal-x'), sc = $('#spot-cancel');
  if (mx) mx.addEventListener('click', () => { if (newCore()) return; const c = $('#modal-close'); if (c && !$('#modal').hidden) c.click(); });
  if (sc) sc.addEventListener('click', () => { if (!newCore() && api().closeSpot) api().closeSpot(); });

  /* ------------------------------------------------- pestañas de la ficha con flechas */
  const panel = $('#panel');
  if (panel) panel.addEventListener('keydown', (e) => {
    const tab = e.target.closest && e.target.closest('[role="tab"]');
    if (!tab || e.altKey || e.ctrlKey || e.metaKey) return;
    const tabs = $$('[role="tab"]', tab.parentElement).filter((t) => !t.hidden && !t.disabled);
    const i = tabs.indexOf(tab); if (i < 0) return;
    let k = -1;
    if (e.key === 'ArrowRight') k = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') k = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') k = 0;
    else if (e.key === 'End') k = tabs.length - 1;
    if (k < 0) return;
    e.preventDefault(); e.stopPropagation();          // no cambia de mueble ni gira el modelo
    const key = tabs[k].dataset.tab;
    tabs[k].click();
    // la ficha pudo volver a dibujarse: se busca la pestaña otra vez
    const to = (key && $('[role="tab"][data-tab="' + key + '"]', panel)) || tabs[k];
    $$('[role="tab"]', to.parentElement).forEach((t) => { t.tabIndex = t === to ? 0 : -1; });
    to.focus();
  });

  /* ---------------------------------------------------- teclado: Esc y el primer Tab */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { const tip = $('#tip'); if (tip && !tip.hidden) tip.hidden = true; }
  });
  const app = $('#app');
  function firstTab(e) {
    if (e.key !== 'Tab') return;
    if (L.store && L.store.get('tipTab', false)) { document.removeEventListener('keydown', firstTab); return; }
    if (!app || app.classList.contains('is-loading') || document.documentElement.classList.contains('is-text')) return;
    document.removeEventListener('keydown', firstTab);
    if (L.store) L.store.set('tipTab', true);
    const keys = !L.prefs || L.prefs.get('keys') !== false;
    U.toast(keys ? 'Pulsa ? para ver la ayuda y los atajos' : 'Abre «Ayuda» para ver los atajos', 'Tab avanza, Mayús+Tab retrocede y Esc cierra lo que esté abierto.', 'help', 8000);
  }
  document.addEventListener('keydown', firstTab);

  /* ------------------------------------------------------- búsqueda en el teléfono */
  const q = $('#spot-q');
  if (q && window.matchMedia) {
    const full = q.getAttribute('placeholder'), mq = window.matchMedia('(max-width: 859.98px)');
    const fit = () => q.setAttribute('placeholder', mq.matches ? 'Buscar…' : full);
    fit();
    if (mq.addEventListener) mq.addEventListener('change', fit); else if (mq.addListener) mq.addListener(fit);
  }

  /* --------------------------------------------------------------- girar ⟲ ⟳ */
  function orbit(d) {
    const E = L.engine; if (!E) return;
    if (E.orbit) { E.orbit(d, 0); return; }
    // motor sin E.orbit: se mueve la meta de la cámara como lo haría un arrastre
    if (!E.cam || !E.cam.goal) return;
    if (E.stopFly) E.stopFly();
    E.cam.goal.th += d;
    if (E.onUserMove) E.onUserMove();
    if (E.invalidate) E.invalidate();
  }
  const zl = $('#z-left'), zr = $('#z-right');
  if (zl) zl.addEventListener('click', () => orbit(-0.35));
  if (zr) zr.addEventListener('click', () => orbit(0.35));

  /* -------------------------------------------------------- globos de la barra */
  const tools = $('#tools');
  function tips() {
    $$('.tb', tools).forEach((b) => {
      const s = b.querySelector('span');
      const t = b.getAttribute('title') || b.getAttribute('aria-label') || (s && s.textContent.trim()) || '';
      if (t && b.dataset.tip !== t) b.dataset.tip = t;
    });
  }
  if (tools) { tips(); new MutationObserver(tips).observe(tools, { subtree: true, childList: true, attributes: true, attributeFilter: ['title', 'aria-label'] }); }

  /* ---------------------------------------- ancho del logotipo (para el selector de modo) */
  const brand = $('#brand'), top = $('#top');
  if (brand && top) {
    const measure = () => { if (brand.offsetWidth) top.style.setProperty('--brand-w', brand.offsetWidth + 'px'); };
    measure();
    if (window.ResizeObserver) new ResizeObserver(measure).observe(brand, { box: 'border-box' }); else window.addEventListener('resize', measure);
  }

  /* ---------------------------------------------------------------- impresión */
  let opened = [];
  window.addEventListener('beforeprint', () => {
    opened = $$('details.pro:not([open])');
    opened.forEach((d) => { d.open = true; });
    $$('#panel [role="tabpanel"]').forEach((p) => {
      const t = p.getAttribute('aria-labelledby') ? document.getElementById(p.getAttribute('aria-labelledby')) : $('#panel [data-tab="' + p.dataset.panel + '"]');
      if (t) p.setAttribute('data-tab-title', t.textContent.trim());
    });
  });
  window.addEventListener('afterprint', () => { opened.forEach((d) => { d.open = false; }); opened = []; });
})();
