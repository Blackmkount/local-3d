/* ============================================================================
   MODO LISTA — toda la información del local en una página de texto, sin 3D.
   Sirve cuando el navegador no puede dibujar el modelo (WebGL), cuando el motor
   no cargó, para leer con lector de pantalla, para equipos viejos y para
   imprimir. Solo usa L3D.data (y L3D.kids si está); nunca toca THREE, así que
   funciona aunque three.js no haya llegado.

   L3D.textMode.show(reason)   reason: 'webgl' | 'engine' (aviso + «Reintentar en 3D»)
                               o 'pedido' (lo pidió el visitante: ?texto, búsqueda, menú)
   L3D.textMode.hide()         vuelve al 3D; el botón solo aparece si el 3D arrancó
   L3D.textMode.print()        imprime la lista completa, se esté viendo o no
   L3D.textMode.shown()        true mientras se ve

   La página lleva un <main id="textmode">: título, índice por grupos, un
   <article id="tm-m7"> por elemento, el presupuesto y el montaje.
   Los estilos están en css/styles.css, bajo «modo lista».
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cop = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  /* coma decimal en los textos (0.95 → 0,95) sin tocar los miles ($1.699.900) */
  const dec = (s) => String(s == null ? '' : s).replace(/(\d)\.(\d{1,2})(?!\d)/g, '$1,$2');
  const escd = (s) => esc(dec(s));
  const icon = (n) => (L.ui && L.ui.icon ? L.ui.icon(n) : '');
  const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const TITLE = 'BlackForge · Local de impresión 3D';
  const REASON = {
    webgl: { t: 'Este navegador no pudo dibujar el modelo 3D', d: 'Aquí tienes la misma información en texto: los 20 elementos, sus materiales, el presupuesto y el montaje. Si activas la aceleración por hardware o usas un navegador actualizado, puedes intentarlo otra vez.' },
    engine: { t: 'No se pudo cargar el motor 3D', d: 'Puede ser la conexión o un bloqueo de la red. Mientras tanto, aquí tienes toda la información en texto.' }
  };
  let root = null, on = false, reason = null, title0 = null;

  const booted = () => document.documentElement.dataset.bfReady === '1' || !!($('#app') && $('#app').classList.contains('is-ready'));
  /* la misma dirección sin ?texto, conservando el enlace a una ficha (#m7) */
  const plainURL = () => location.href.split('#')[0].replace(/([?&])texto\b(=[^&#]*)?&?/, '$1').replace(/[?&]$/, '') + (/^#m\d+/.test(location.hash) ? location.hash : '');
  const go = (url) => { if (url === location.href) location.reload(); else location.assign(url); };

  /* ---------------------------------------------------------------- contenido */
  function itemHtml(d, K) {
    const fab = d.origen === 'fabrica', kid = K && K.items && K.items[d.n];
    const units = parseInt(d.cant, 10);
    let h = '<article class="tm-item" id="tm-m' + d.n + '" aria-labelledby="tm-m' + d.n + '-t">' +
      '<h3 id="tm-m' + d.n + '-t" tabindex="-1"><span class="tm-n" aria-hidden="true">' + d.n + '</span><span><span class="sr-only">Elemento ' + d.n + ': </span>' + escd(d.name) + '</span></h3>' +
      '<p class="tm-meta"><span class="pill pill-' + d.origen + '">' + (fab ? 'Se fabrica' + (d.origenNota ? ' · ' + esc(d.origenNota) : '') : 'Se compra') + '</span>' +
      '<b>' + cop(d.total) + '</b><span>' + (fab ? 'en materiales' : (units > 1 ? units + ' unidades' : 'producto')) + '</span></p>' +
      (kid && kid.que ? '<p class="tm-kid">' + esc(kid.que) + '</p>' : '') +
      '<p>' + escd(d.resumen) + '</p>' +
      '<dl class="tm-facts"><dt>Medidas</dt><dd>' + escd(d.dims) + '</dd><dt>Cantidad</dt><dd>' + escd(d.cant) + '</dd><dt>Ubicación</dt><dd>' + escd(d.ubic) + '</dd></dl>';
    h += '<h4>' + (fab ? 'Materiales y costos' : 'Producto') + '</h4>' +
      '<div class="tm-tbl-wrap"><table class="tm-tbl"><caption class="sr-only">' + (fab ? 'Materiales de ' : 'Producto: ') + esc(d.short) + '</caption><thead><tr><th scope="col">Material</th><th scope="col">Uso</th><th scope="col">Cantidad</th><th scope="col">Precio</th><th scope="col" class="r">Costo</th></tr></thead><tbody>' +
      d.mats.map((m) => '<tr><th scope="row">' + escd(m.m) + '</th><td>' + escd(m.uso) + '</td><td>' + escd(m.cant) + '</td><td>' + escd(m.pu) + (m.prov ? ' · ' + esc(m.prov) : '') + (m.nota ? '<br><small>' + escd(m.nota) + '</small>' : '') + '</td><td class="r">' + (m.costo ? cop(m.costo) : '$0') + '</td></tr>').join('') +
      '</tbody><tfoot><tr><th scope="row" colspan="4">Total' + (fab ? ' de materiales' : '') + '</th><td class="r">' + cop(d.total) + '</td></tr></tfoot></table></div>';
    if (d.fab && d.fab.length) h += '<h4>Cómo se hace</h4><ol>' + d.fab.map((s) => '<li>' + escd(s) + '</li>').join('') + '</ol>';
    if (d.ens && d.ens.length) h += '<h4>' + (fab ? 'Cómo se arma' : 'Cómo se instala') + '</h4><ol>' + d.ens.map((s) => '<li>' + escd(s) + '</li>').join('') + '</ol>';
    if (d.why && d.why.length) h += '<h4>Por qué</h4><dl class="tm-why">' + d.why.map((w) => '<dt>' + escd(w.t) + '</dt><dd>' + escd(w.d) + '</dd>').join('') + '</dl>';
    return h + '</article>';
  }
  function build() {
    if (root) return root;
    const D = L.data, K = L.kids;
    if (!D || !D.items) return null;
    const P = D.presupuesto || {}, M = D.montaje || {}, meta = D.meta || {};
    const byN = {}; D.items.forEach((d) => { byN[d.n] = d; });
    // grupos en el orden en que aparecen
    const groups = [];
    D.items.forEach((d) => { let g = groups.find((x) => x.t === d.grupo); if (!g) { g = { t: d.grupo, id: 'tm-g-' + slug(d.grupo), items: [] }; groups.push(g); } g.items.push(d); });
    const fecha = meta.fechas || meta.fecha;
    let h = '<div class="tm-wrap">' +
      '<header class="tm-head"><h1 id="tm-title" tabindex="-1">' + esc(TITLE) + '</h1>' +
      '<p class="tm-sub">Modo lista: los ' + D.items.length + ' elementos del local' + (meta.medidas ? ' de ' + escd(meta.medidas) : '') + ', de qué están hechos, cómo se fabrican y se arman, cuánto cuestan y en qué orden se monta todo. Sin 3D.</p>' +
      '<div class="tm-banner" id="tm-banner" role="alert" hidden><b></b><p></p><button type="button" class="btn btn-led" id="tm-retry">Reintentar en 3D</button></div>' +
      '<div class="tm-acts"><button type="button" class="btn btn-led" id="tm-back" hidden>' + icon('back') + 'Volver al 3D</button>' +
      '<a class="btn" id="tm-open3d" hidden>' + icon('cube') + 'Ver el modelo 3D</a>' +
      '<button type="button" class="btn" id="tm-print">' + icon('print') + 'Imprimir</button></div></header>';
    // índice
    h += '<nav class="tm-nav" aria-labelledby="tm-nav-t"><h2 id="tm-nav-t">Contenido</h2><ul>' +
      groups.map((g) => '<li><a href="#' + g.id + '">' + esc(g.t) + '</a><ul>' + g.items.map((d) => '<li><a href="#tm-m' + d.n + '"><span class="tm-n" aria-hidden="true">' + d.n + '</span>' + esc(d.short) + '</a></li>').join('') + '</ul></li>').join('') +
      '<li><a href="#tm-presupuesto">Presupuesto</a></li>' + (M.pasos ? '<li><a href="#tm-montaje">Montaje del local</a></li>' : '') + '</ul></nav>';
    // elementos por grupo
    groups.forEach((g) => {
      h += '<section id="' + g.id + '" aria-labelledby="' + g.id + '-t"><h2 id="' + g.id + '-t" tabindex="-1">' + esc(g.t) + '</h2>' +
        g.items.map((d) => itemHtml(d, K)).join('') + '<a class="tm-top" href="#tm-nav-t">Volver al índice</a></section>';
    });
    // presupuesto
    if (P.total) {
      const nFab = D.items.filter((d) => d.origen === 'fabrica').length, nBuy = D.items.length - nFab;
      h += '<section id="tm-presupuesto" aria-labelledby="tm-presupuesto-t"><h2 id="tm-presupuesto-t" tabindex="-1">Presupuesto</h2>' +
        '<p class="tm-total"><span>Total en materiales y equipos (pesos colombianos)</span><b>' + cop(P.total) + '</b></p>' +
        '<ul><li>' + nFab + ' elementos que se fabrican: ' + cop(P.fabricado) + '</li><li>' + nBuy + ' elementos que se compran: ' + cop(P.comprado) + '</li></ul>';
      if (P.rubros && P.rubros.length) {
        h += '<h3>Por tipo de insumo</h3><div class="tm-tbl-wrap"><table class="tm-tbl"><caption class="sr-only">Presupuesto por tipo de insumo</caption><thead><tr><th scope="col">Rubro</th><th scope="col">Qué incluye</th><th scope="col" class="r">Costo</th></tr></thead><tbody>' +
          P.rubros.map((r) => '<tr><th scope="row">' + escd(r.r) + '</th><td>' + escd(r.q) + '</td><td class="r">' + cop(r.c) + '</td></tr>').join('') +
          '</tbody><tfoot><tr><th scope="row" colspan="2">Total</th><td class="r">' + cop(P.total) + '</td></tr></tfoot></table></div>';
      }
      const fuera = P.noIncluye || (P.supuestos && P.supuestos.find((s) => /no incluye/i.test(s)));
      if (fuera) h += '<p>' + escd(fuera) + '</p>';
      if (fecha) h += '<p>Precios publicados en línea el ' + esc(fecha) + '.</p>';
      h += '<a class="tm-top" href="#tm-nav-t">Volver al índice</a></section>';
    }
    // montaje
    if (M.pasos && M.pasos.length) {
      h += '<section id="tm-montaje" aria-labelledby="tm-montaje-t"><h2 id="tm-montaje-t" tabindex="-1">Montaje del local</h2>' +
        (M.intro ? '<p>' + escd(M.intro) + '</p>' : '') +
        '<ol>' + M.pasos.map((p) => '<li><b>' + escd(p.t) + '.</b> ' + escd(p.d) + (p.items && p.items.length ? ' <small>(' + p.items.map((n) => byN[n] ? n + ' ' + esc(byN[n].short) : n).join(', ') + ')</small>' : '') + '</li>').join('') + '</ol>' +
        (M.nota ? '<p>' + escd(M.nota) + '</p>' : '') + '<a class="tm-top" href="#tm-nav-t">Volver al índice</a></section>';
    }
    h += '<p class="tm-foot">Medidas estimadas desde el plano: hay que verificarlas en sitio antes de pedir el corte.' + (fecha ? ' Precios del ' + esc(fecha) + ', en pesos colombianos.' : '') + '</p></div>';

    root = document.createElement('main');
    root.id = 'textmode'; root.tabIndex = -1;
    root.setAttribute('aria-labelledby', 'tm-title');
    root.innerHTML = h;
    const app = $('#app');
    if (app && app.parentNode) app.parentNode.insertBefore(root, app.nextSibling); else document.body.appendChild(root);
    bind();
    return root;
  }
  function bind() {
    // el índice lleva a cada sección sin tocar la dirección (la usan las rutas del 3D)
    root.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#tm-"]');
      if (a) {
        const t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
        e.preventDefault();
        const head = t.matches('h1, h2, h3') ? t : t.querySelector('h2, h3') || t;
        t.scrollIntoView({ block: 'start', behavior: L.ui.reduced && L.ui.reduced() ? 'auto' : 'smooth' });
        if (head.tabIndex < 0 && !head.hasAttribute('tabindex')) head.tabIndex = -1;
        head.focus({ preventScroll: true });
        return;
      }
      if (e.target.closest('#tm-back')) return api.hide();
      if (e.target.closest('#tm-retry')) return go(plainURL());
      if (e.target.closest('#tm-print')) return api.print();
    });
  }
  function sync() {
    if (!root) return;
    const b = $('#tm-banner', root), r = REASON[reason];
    b.hidden = !r;
    if (r) { $('b', b).textContent = r.t; $('p', b).textContent = r.d; }
    // volver al 3D solo si el 3D llegó a arrancar; si no, un enlace para abrirlo (sin ?texto)
    $('#tm-back', root).hidden = !booted();
    const o = $('#tm-open3d', root);
    o.hidden = booted() || !!r;
    o.href = plainURL();
  }

  /* -------------------------------------------------------------------- api */
  const api = {
    show(why) {
      if (!build()) return;
      reason = why || reason || 'pedido';
      sync();
      if (!on) {
        on = true;
        title0 = document.title;
        document.title = 'Modo lista · BlackForge';
        document.documentElement.classList.add('is-text');
        // lo que estuviera abierto en el 3D se cierra para no dejar capas atrapando el foco
        const A = L.api || {};
        try { if (A.closeSpot) A.closeSpot(true); if (A.closeModal) A.closeModal(); } catch (err) { /* sin 3D */ }
      }
      window.scrollTo(0, 0);
      // un enlace directo (#m7) baja hasta ese elemento
      const m = /^#m(\d+)/.exec(location.hash || ''), art = m && document.getElementById('tm-m' + m[1]);
      const h = art ? $('h3', art) : $('#tm-title', root);
      if (art) art.scrollIntoView({ block: 'start' });
      if (h) h.focus({ preventScroll: !!art });
      if (L.bus) L.bus.emit('textmode', { open: true, reason });
    },
    hide() {
      if (!on || !booted()) return;
      on = false;
      document.documentElement.classList.remove('is-text');
      if (title0) document.title = title0;
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event('resize'));      // el lienzo vuelve a medir su tamaño
      const back = $('#btn-search') || $('#brand');
      if (back) back.focus({ preventScroll: true });
      if (L.bus) L.bus.emit('textmode', { open: false });
    },
    print() {
      if (!build()) return;
      sync();
      document.documentElement.classList.add('tm-print');   // afterprint la quita
      window.print();
    },
    shown() { return on; }
  };
  L.textMode = api;

  /* Ctrl+P sin ficha ni ventana abiertas: se imprime la lista completa en vez de una hoja en blanco */
  window.addEventListener('beforeprint', () => {
    if (on) return;
    const open = (q) => { const el = $(q); return el && !el.hidden; };
    if (open('#panel') || open('#modal') || open('#mont')) return;
    if (build()) { sync(); document.documentElement.classList.add('tm-print'); }
  });
  window.addEventListener('afterprint', () => { document.documentElement.classList.remove('tm-print'); });

  /* el 3D terminó de arrancar mientras se leía la lista: ahora sí se puede volver */
  if (L.bus) L.bus.on('ready', () => { if (on) sync(); });

  /* entrada en la búsqueda */
  if (L.ext && L.ext.spot) {
    L.ext.spot.push(() => [{
      sec: 'Acciones', ic: icon('list'), t: 'Ver como lista (sin 3D)',
      s: 'Toda la información en texto, para leer con calma o imprimir',
      q: 'ver como lista sin 3d texto leer lector pantalla imprimir accesible', run: () => api.show('pedido')
    }]);
  }

  /* ?texto en la dirección abre directamente la lista (app.js además se salta el arranque del 3D) */
  if (/[?&]texto\b/.test(location.search)) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => api.show('pedido'));
    else api.show('pedido');
  }
})();
