/* ============================================================================
   CONTRATO ENTRE MÓDULOS — se carga antes que data.js y no depende de three.js.
   Todo cuelga de window.L3D (= L). Los módulos nuevos (bienvenida, recorrido,
   glosario, pasaporte…) se enchufan aquí sin tocar app.js.

   L.bus     mensajes entre módulos
             on(ev, fn) → función para dejar de escuchar · off(ev, fn) · emit(ev, detail)
             emit es síncrono; cada oyente corre dentro de try/catch.
   L.store   memoria del navegador, siempre segura
             get(key, fallback) · set(key, value). Guarda JSON en localStorage
             con el prefijo 'bf:'. Si el navegador no deja (modo privado, datos
             bloqueados), usa un Map en memoria: dura lo que dura la pestaña.
   L.prefs   preferencias del visitante
             get(k) · set(k, v) · all()
             Valores por defecto: { mode: 'explorador', big: false, motion: true,
             keys: true, welcomed: false, speak: false }.
             ?modo=experto | ?modo=explorador en la dirección manda solo en esa visita.
             set() guarda, vuelve a poner las clases de #app y emite 'prefs' { key, value }.
             Clases en #app: is-simple (modo explorador), is-big (letra grande),
             is-still (sin animaciones).
   L.ext     puntos de extensión
             spot:        [() => [{ sec, ic, t, s, q, run, r? }]]   entradas de la búsqueda
             menu:        [{ id, t, ic, run, order, when? }]       menú «Más»
             routes:      { clave: (resto) => void }                 #clave/resto en la dirección
             afterRender: [fn]                                      después de cada cuadro con cambios

   Eventos (L.bus) que emite app.js:
     ready {}                       una vez, cuando el local ya se ve (o al primer gesto)
     usermove {}                    el visitante movió la cámara (una vez por gesto)
     select { n, via }              via: '3d' | 'list' | 'search' | 'route' | 'nav' | 'api'
     deselect {}
     panel { n, el }                la ficha #panel se acaba de dibujar
     tab { n, tab }
     view { name }                  fachada | interior | taller | aerea | planta
     mode { n, mode }               solid | exploded | asm
     asm-step { n, k, count, text, done }
     montaje { open }
     montaje-step { k, count, title }
     montaje-land { n, k }          un mueble terminó de caer en su sitio durante el montaje
     montaje-done {}
     modal { kind, title, el }      kind: budget | mats | ayuda | ajustes | historia | …
     modal-close { kind }
     spot { open }
     filter { shown }
     help {}
     prefs { key, value }           (lo emite L.prefs)
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});

  /* ------------------------------------------------------------------ bus */
  const subs = new Map();
  L.bus = {
    on(ev, fn) {
      if (!subs.has(ev)) subs.set(ev, new Set());
      subs.get(ev).add(fn);
      return () => L.bus.off(ev, fn);
    },
    off(ev, fn) { const s = subs.get(ev); if (s) s.delete(fn); },
    emit(ev, detail) {
      const s = subs.get(ev); if (!s) return;
      Array.from(s).forEach((fn) => { try { fn(detail || {}); } catch (err) { console.error('[L3D.bus] ' + ev, err); } });
    }
  };

  /* ---------------------------------------------------------------- store */
  const mem = new Map();
  let ls = null;
  try { ls = window.localStorage; const k = 'bf:__t'; ls.setItem(k, '1'); ls.removeItem(k); } catch (err) { ls = null; }
  L.store = {
    get(key, fallback) {
      try {
        if (ls) { const raw = ls.getItem('bf:' + key); if (raw != null) return JSON.parse(raw); }
        else if (mem.has(key)) return mem.get(key);
      } catch (err) { /* valor dañado: se usa el de respaldo */ }
      return fallback;
    },
    set(key, value) {
      mem.set(key, value);
      try { if (ls) ls.setItem('bf:' + key, JSON.stringify(value)); } catch (err) { /* lleno o bloqueado: queda en memoria */ }
    }
  };

  /* ---------------------------------------------------------------- prefs */
  const DEF = { mode: 'explorador', big: false, motion: true, keys: true, welcomed: false, speak: false };
  const q = /[?&]modo=(experto|explorador)\b/.exec(location.search);
  const urlMode = q ? q[1] : null;
  const get = (k) => {
    if (k === 'mode' && urlMode) return urlMode;
    const v = L.store.get('pref:' + k, undefined);
    return v === undefined ? DEF[k] : v;
  };
  function apply() {
    const app = document.getElementById('app');
    if (!app) return;
    app.classList.toggle('is-simple', get('mode') === 'explorador');
    app.classList.toggle('is-big', !!get('big'));
    app.classList.toggle('is-still', get('motion') === false);
  }
  L.prefs = {
    get,
    set(k, v) {
      L.store.set('pref:' + k, v);
      apply();
      L.bus.emit('prefs', { key: k, value: get(k) });
    },
    all() { const o = {}; Object.keys(DEF).forEach((k) => { o[k] = get(k); }); return o; },
    defaults: Object.assign({}, DEF)
  };
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);

  /* ------------------------------------------------------------------ ext */
  L.ext = L.ext || {};
  L.ext.spot = L.ext.spot || [];
  L.ext.menu = L.ext.menu || [];
  L.ext.routes = L.ext.routes || {};
  L.ext.afterRender = L.ext.afterRender || [];
})();
