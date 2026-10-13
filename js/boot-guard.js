/* ============================================================================
   GUARDIÁN DEL ARRANQUE — el primer script de la página. Solo toca la pantalla
   de inicio (#intro) y no depende de nada: si el motor 3D no carga, si el
   navegador no puede dibujar o si la carga se demora, el visitante ve qué pasó
   y qué puede hacer, en lugar de quedarse mirando «Preparando el local…».

   L3D.bootProgress(p, msg)   avance real de la carga: p de 0 a 1 llena la barra;
                              msg (opcional) cambia el texto de abajo
   L3D.bootFail(kind, err)    tarjeta de error. kind: 'engine' (three.js no cargó)
                              o 'webgl' (el navegador no pudo crear el lienzo 3D).
                              Llamarla dos veces no hace daño.
   L3D.bootError              el primer error de JavaScript de la página, si hubo

   Botones de la tarjeta: Reintentar · Versión ligera (?lite) · Ver la
   información sin 3D (L3D.textMode.show(kind), solo si ese módulo existe).
   A los 25 s, si la página sigue cargando y no llegó ningún avance en los
   últimos 15 s, aparece un aviso suave con los mismos botones; la carga sigue.
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const $ = (id) => document.getElementById(id);
  let lastProgress = performance.now(), failed = null, slow = false;

  L.bootError = null;
  window.addEventListener('error', (e) => { if (!L.bootError) L.bootError = e.error || e.message || 'error'; });

  L.bootProgress = function (p, msg) {
    const intro = $('intro');
    lastProgress = performance.now();
    if (!intro || failed) return;
    const k = Math.max(0, Math.min(1, +p || 0));
    intro.style.setProperty('--p', k.toFixed(3));
    intro.classList.add('has-progress');
    if (msg) { const m = $('intro-msg'); if (m) m.textContent = msg; }
    if (slow) { slow = false; intro.classList.remove('is-slow'); const c = intro.querySelector('.boot-card'); if (c) c.remove(); }
  };

  const TEXT = {
    engine: { title: 'No se pudo cargar el motor 3D', body: 'Puede ser la conexión o un bloqueo de la red.' },
    webgl: {
      title: 'Este navegador no pudo dibujar el modelo 3D',
      body: 'Así puedes verlo:',
      steps: ['Activa la aceleración por hardware en la configuración del navegador.', 'Prueba la versión ligera.', 'Usa Chrome, Edge, Safari o Firefox actualizados.']
    },
    slow: { title: 'Esto está tardando más de lo normal…', body: 'El modelo 3D sigue cargando. Puedes esperar un poco más o elegir otra opción.' }
  };
  const isLite = () => /[?&]lite\b/.test(location.search);
  function liteURL() {
    const u = location.href.split('#'), q = u[0].indexOf('?') >= 0 ? '&lite' : '?lite';
    return u[0] + q + (u[1] !== undefined ? '#' + u[1] : '');
  }
  function card(kind) {
    const t = TEXT[kind], el = document.createElement('div');
    el.className = 'boot-card';
    el.setAttribute('role', kind === 'slow' ? 'status' : 'alert');
    const h = document.createElement('h2'); h.textContent = t.title; el.appendChild(h);
    const p = document.createElement('p'); p.textContent = t.body; el.appendChild(p);
    if (t.steps) {
      const ol = document.createElement('ol');
      t.steps.forEach((s) => { const li = document.createElement('li'); li.textContent = s; ol.appendChild(li); });
      el.appendChild(ol);
    }
    const acts = document.createElement('div'); acts.className = 'boot-acts';
    const btn = (label, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + cls; b.textContent = label; b.addEventListener('click', fn); acts.appendChild(b); return b; };
    btn('Reintentar', 'btn-led', () => location.reload());
    if (!isLite()) btn('Versión ligera', '', () => { location.href = liteURL(); });
    if (L.textMode && typeof L.textMode.show === 'function') btn('Ver la información sin 3D', '', () => L.textMode.show(kind === 'slow' ? 'pedido' : kind));
    el.appendChild(acts);
    return el;
  }

  L.bootFail = function (kind, err) {
    kind = TEXT[kind] && kind !== 'slow' ? kind : 'engine';
    if (err && !L.bootError) L.bootError = err;
    const intro = $('intro');
    if (!intro || failed === kind) return;
    failed = kind; slow = false;
    const old = intro.querySelector('.boot-card'); if (old) old.remove();
    intro.classList.remove('is-slow');
    intro.classList.add('is-error');
    const c = card(kind);
    intro.appendChild(c);
    const b = c.querySelector('button'); if (b) b.focus();
  };

  // three.js no llegó (archivo bloqueado o borrado): el aviso sale apenas termina de leerse la página
  document.addEventListener('DOMContentLoaded', () => { if (!window.THREE) L.bootFail('engine'); });

  // vigía: aviso suave si la carga se estanca, sin detenerla
  function watch() {
    const app = $('app'), intro = $('intro');
    if (!app || !intro || !app.classList.contains('is-loading') || failed) return;
    if (!slow && performance.now() - lastProgress > 15000) {
      slow = true;
      intro.classList.add('is-slow');
      intro.appendChild(card('slow'));
    }
    setTimeout(watch, 5000);
  }
  setTimeout(watch, 25000);
})();
