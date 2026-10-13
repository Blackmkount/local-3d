/* ============================================================================
   ESTADÍSTICAS DEL MOTOR — solo con ?stats en la dirección (p. ej. index.html?stats).
   Un panel en la esquina, cada medio segundo: cuadros por segundo (dibujados,
   con cambios y solo de contenido), llamadas de dibujo y triángulos del último
   cuadro, memoria de video (geometrías y texturas), refinamiento (n / máx.),
   resolución, estado de los videos y tiempo sin tocar nada (reposo a los 20 s).
   Interruptores para la oclusión ambiental, el bloom y el reflejo del piso.
   ========================================================================== */
(function () {
  'use strict';
  if (!/[?&]stats\b/.test(location.search)) return;
  const L = (window.L3D = window.L3D || {});
  let box = null, out = null, prev = null, tPrev = 0;

  function build(E) {
    box = document.createElement('div');
    box.id = 'stats';
    box.setAttribute('aria-label', 'Estadísticas del motor 3D');
    box.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:60;min-width:230px;padding:10px 12px;border-radius:12px;' +
      'background:rgba(16,16,18,0.88);color:#f5f5f7;font:500 11px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;' +
      'box-shadow:0 0 0 0.5px rgba(255,255,255,0.14),0 10px 30px -8px rgba(0,0,0,0.6);white-space:pre;pointer-events:auto';
    out = document.createElement('div');
    box.appendChild(out);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;margin-top:6px;white-space:normal';
    const P = E.post;
    const toggle = (label, get, set) => {
      const l = document.createElement('label'), c = document.createElement('input');
      l.style.cssText = 'display:flex;gap:4px;align-items:center;cursor:pointer';
      c.type = 'checkbox'; c.checked = get();
      c.addEventListener('change', () => { set(c.checked); E.invalidate(2); });
      l.append(c, document.createTextNode(label)); row.appendChild(l);
      return () => { c.checked = get(); c.disabled = !P.on && label !== 'reflejo'; };
    };
    const syncs = [
      toggle('AO', () => P.ao, (v) => { P.ao = v; }),
      toggle('bloom', () => P.bloom, (v) => { P.bloom = v; }),
      toggle('reflejo', () => E.reflect.on, (v) => E.setReflect(v))
    ];
    box.appendChild(row);
    box._sync = () => syncs.forEach((f) => f());
    document.body.appendChild(box);
    // el motor suma las llamadas de todas las pasadas del cuadro
    E.renderer.info.autoReset = false;
  }

  function tick() {
    const E = L.engine;
    if (!E || !E.renderer) return;
    if (!box) build(E);
    const now = performance.now(), s = E.stats, m = E.renderer.info.memory, P = E.post;
    const cur = { f: s.frames, c: s.changed, k: s.content };
    const dt = prev ? (now - tPrev) / 1000 : 0;
    const rate = (k) => (prev && dt > 0 ? ((cur[k] - prev[k]) / dt).toFixed(1) : '–');
    const vids = (L.furn && L.furn.videos) || [];
    out.textContent = [
      'cuadros/s      ' + rate('f') + '  (con cambios ' + rate('c') + ', contenido ' + rate('k') + ')',
      'llamadas       ' + s.calls + '   triángulos ' + Math.round(s.triangles / 1000) + ' k',
      'memoria        ' + m.geometries + ' geometrías · ' + m.textures + ' texturas',
      'refinamiento   ' + (P.on ? P.n + ' / ' + P.max : 'sin postproceso') + (E.lite ? '   · ligero' : ''),
      'resolución     ' + E.dpr.toFixed(2) + ' × (' + E.size.pw + ' × ' + E.size.ph + ')',
      'sin tocar      ' + (E.idleMs() / 1000).toFixed(0) + ' s' + (E.still ? '   · quieto' : ''),
      ...vids.map((v) => 'video          ' + v.name + ': ' + v.state())
    ].join('\n');
    box._sync();
    prev = cur; tPrev = now;
  }
  setInterval(tick, 500);
})();
