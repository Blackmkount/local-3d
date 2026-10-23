/* ============================================================================
   JUEGO DE PLANOS — láminas que se suman, para cada mueble fabricado, al plano
   de ensamble (conjunto), al despiece explosionado y a las piezas de dwg.js:

     ensamble   secuencia de ensamble: una isometría por paso, con lo ya armado
                en gris y las piezas nuevas en negro, separadas y con su flecha
                de montaje. Debajo, las piezas y las uniones del paso con su
                cantidad (salen del modelo, igual que en el armado con operario)
                y el tiempo de planta (datos tipo de la Nota 2). Al pie, los
                herrajes y consumibles, las herramientas y el equipo de
                protección personal.
     detalles   detalles constructivos: ampliaciones a escala 1:5 de uniones
                reales del mueble (dónde se suelda, se atornilla, se ancla…),
                señaladas en una isometría de referencia; los cortes de cada
                unión (uniones.js) y las notas de fabricación.
     indice     índice del juego de planos de la versión y convenciones (tipos
                de línea, rayados, símbolos y notas generales).

   PN.sheets(v) da la lista de láminas de una versión para el visor del Plano 2D.
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D, T = THREE, DW = L.dwg;
  const PN = (L.planos = {});
  const V3 = (x, y, z) => new T.Vector3(x, y, z);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nn = (n) => (n < 10 ? '0' : '') + n;
  const f2 = (v) => v.toFixed(2);
  const fmtMin = (m) => (m >= 60 ? Math.floor(m / 60) + ' h ' + (Math.round(m % 60) ? Math.round(m % 60) + ' min' : '') : Math.max(1, Math.round(m)) + ' min').trim();
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const fecha = () => (L.nota1 && L.nota1.fechaCorta) || '22 oct. 2026';

  /* texto en varias líneas: corta por palabras a un ancho en mm (Inter: ~0.52 × tamaño por carácter) */
  function wrap(t, wmm, size, max) {
    const per = Math.max(8, Math.floor(wmm / (size * 0.52))), words = String(t).split(/\s+/), out = [];
    let cur = '';
    words.forEach((w) => { if (!cur) cur = w; else if ((cur + ' ' + w).length <= per) cur += ' ' + w; else { out.push(cur); cur = w; } });
    if (cur) out.push(cur);
    if (max && out.length > max) { out.length = max; out[max - 1] = out[max - 1].replace(/[\s,;.]*\S{0,12}$/, '') + '…'; }
    return out;
  }
  const lines = (x, y, arr, cls, lh) => arr.map((l, i) => '<text class="' + cls + '" x="' + f2(x) + '" y="' + f2(y + i * lh) + '">' + esc(l) + '</text>').join('');

  /* ------------------------------------------------ datos del mueble */
  const itemOf = (v, n) => L.versions.items[v] && L.versions.items[v][n];
  function instr(it, k) {
    const sq = it.seq[k], m = /^(Ensamble|Fabricación) (\d+)/.exec(sq.src || '');
    const arr = m ? (m[1] === 'Ensamble' ? it.ens : it.fab) : null;
    return arr && arr[+m[2] - 1] ? arr[+m[2] - 1] : '';
  }
  /* uniones de cada paso, con todas sus fijaciones (armado.js) */
  const actCache = {};
  function stepActs(v, n) {
    const key = v + n; if (actCache[key]) return actCache[key];
    const S0 = DW._h.solids(v, n), it = itemOf(v, n), AR = L.armado;
    const itB = S0.it, o = S0.o; itB._seq = it.seq; itB._src = it;
    const out = it.seq.map((_, k) => { try { return AR.plan(itB, o, k, true); } catch (e) { console.error(e); return []; } });
    // piezas que el modelo une en una sola malla (los cuatro niveladores, los chazos): una fijación por componente
    const sol = (p) => S0.list.find((q) => q.idx === o.parts.indexOf(p));
    out.forEach((acts) => acts.forEach((a) => {
      if (a.t !== 'roscar' && a.t !== 'anclar') return;
      // componentes de la malla, juntando los que quedan a menos de 6 cm en planta (base y tornillo del nivelador)
      const comps = [];
      a.parts.forEach((p) => { const q = sol(p); if (q) q.comps.forEach((b) => { const c = b.getCenter(V3()), g = comps.find((x) => Math.hypot(x.getCenter(V3()).x - c.x, x.getCenter(V3()).z - c.z) < 0.06); if (g) g.union(b); else comps.push(b.clone()); }); });
      if (comps.length > a.pts.length) a.pts = comps.map((b) => { const c = b.getCenter(V3()); if (a.t === 'roscar') c.y = b.min.y + 0.02; return { p: c, dir: a.t === 'roscar' ? V3(0, 1, 0) : V3(0, 0, -1), n: a.t === 'roscar' ? V3(0, -1, 0) : V3(0, 0, 1) }; });
    }));
    out.forEach((acts) => {
      acts.forEach((a, i) => {
        // el laminado no se atornilla: se pega con contacto sobre el tablero
        if (a.t === 'atornillar' && a.parts[0].userData.mk === 'hpl') acts[i] = { t: 'encolar', parts: a.parts, what: a.what, cts: [] };
      });
      // las escuadras 3030A (una sola malla) caen en las mismas uniones de los largueros: no se cuentan dos veces
      const aluJoints = acts.some((a) => a.t === 'allen' && a.parts[0].userData.mk === 'perfil3030');
      acts.forEach((a) => { if (a.t === 'allen' && a.parts[0].userData.mk === 'escuadra' && aluJoints) a.dup = true; });
    });
    return (actCache[key] = out);
  }
  const hasSteel = (it) => it.piezas.some((p) => /^tubo/.test(p[0]));
  function screwKind(a, steel) {
    const c = L.armado.classOf(a.parts[0]);
    if (c === 'steel') return 'auto';
    if (steel && a.pts.some((q) => Math.abs(q.dir.y) > 0.5)) return 'auto';
    return 'ens';
  }
  /* resumen de un paso: piezas, uniones y minutos */
  function stepSummary(acts, steel) {
    const piezas = [], ops = [], tipos = new Set();
    let min = 0, auto = 0, ens = 0, weld = 0, allen = 0, impresas = 0;
    const pl = (n, one, many) => n + ' ' + (n === 1 ? one : many);
    acts.forEach((a) => {
      if (a.dup) return;
      min += L.armado.minutes(a);
      const what = String(a.what || '').toLowerCase(), np = a.parts.length;
      if (a.t === 'colocar') { piezas.push((np > 1 ? np + ' × ' : '') + what); return; }
      tipos.add(a.t);
      if (a.t === 'soldar') weld += a.pts.length;
      else if (a.t === 'atornillar') { if (screwKind(a, steel) === 'auto') auto += a.pts.length; else ens += a.pts.length; }
      else if (a.t === 'allen') { if (L.armado.classOf(a.parts[0]) === 'print') impresas += a.pts.length; else allen += a.pts.length; }
      else if (a.t === 'herraje') ops.push('Instalar ' + what + ': ' + pl(a.pts.length, 'fijación', 'fijaciones'));
      else if (a.t === 'anclar') ops.push('Anclar al muro: ' + pl(a.pts.length, 'chazo', 'chazos') + ' de 3/8″');
      else if (a.t === 'roscar') ops.push('Roscar ' + pl(a.pts.length, 'nivelador', 'niveladores') + ' de 5/16″ y nivelar');
      else if (a.t === 'encolar') ops.push('Encolar ' + what + ' (pegante de contacto)');
      else if (a.t === 'prensar') ops.push('Prensar con sargentos hasta que seque');
      else if (a.t === 'conectar') ops.push('Conectar ' + what + ' a su fuente de 12 V');
      else if (a.t === 'asentar') ops.push('Asentar ' + what + ' con ventosas, sobre calzos');
      else if (a.t === 'retocar') ops.push('Retocar la laca en las uniones');
    });
    const pre = [];
    if (weld) pre.push('Soldar ' + pl(weld, 'cordón', 'cordones') + ' MIG, a escuadra');
    if (auto) pre.push('Atornillar ' + pl(auto, 'autoperforante', 'autoperforantes') + ' de 6 × 5/8″');
    if (ens) pre.push('Atornillar ' + pl(ens, 'tornillo', 'tornillos') + ' de ensamble de 6 × 2″ (pretaladro de 3 mm)');
    if (allen) pre.push('Unir el perfil 3030: ' + pl(allen, 'unión', 'uniones') + ' con escuadra y bristol M6');
    if (impresas) pre.push('Fijar las piezas impresas: ' + pl(impresas, 'bristol', 'bristol') + ' M6 a tuerca martillo');
    if (impresas) tipos.add('allen');
    if (auto) tipos.add('auto'); if (ens) tipos.add('ens');
    return { piezas, ops: pre.concat(ops), min, tipos, weld, auto, ens, allen };
  }

  /* herramientas y protección que piden las operaciones del mueble */
  const TOOLS = {
    soldar: 'Soldadora MIG, pulidora con disco de corte y de desbaste, escuadra magnética',
    auto: 'Taladro atornillador con punta Phillips n.º 2',
    ens: 'Taladro atornillador, broca de 3 mm y avellanador',
    allen: 'Llaves bristol (hexagonales) de 4 y 5 mm',
    herraje: 'Broca Forstner de 35 mm para cazoletas y plantilla de perforación',
    anclar: 'Taladro percutor con broca de 3/8″ y detector de tuberías y cables',
    roscar: 'Nivel de burbuja y llave de 13 mm',
    encolar: 'Rodillo o espátula dentada, sargentos (prensas) y refiladora',
    conectar: 'Multímetro, pelacables y conectores rápidos',
    asentar: 'Ventosas para vidrio y calzos de neopreno',
    retocar: 'Pistola de pintura HVLP y lija fina'
  };
  const EPP = {
    soldar: 'Careta fotosensible, guantes de carnaza, peto y mangas de cuero',
    retocar: 'Respirador de media cara con cartuchos para vapores orgánicos',
    anclar: 'Protección auditiva y gafas al perforar el muro',
    asentar: 'Guantes anticorte para manipular el vidrio',
    encolar: 'Guantes de nitrilo y ventilación'
  };

  /* ------------------------------------------------ estilo adicional */
  DW.css += [
    '.vis.old{stroke:#9a9a9f;stroke-width:.16}.vis.new{stroke:#111;stroke-width:.34}',
    '.mnt{fill:none;stroke:#111;stroke-width:.2;stroke-dasharray:1.4 .8}.mnt-h{fill:#111}',
    '.pn-f{fill:none;stroke:#c9c9cc;stroke-width:.22}.pn-n circle{fill:#111}.pn-n text{fill:#fff;font-size:3.1px;font-weight:700;text-anchor:middle}',
    '.pn-t{font-size:2.9px;font-weight:600}.pn-s{font-size:2.05px;fill:#666}.pn-i{font-size:2.05px;fill:#333}.pn-o{font-size:2.15px}.pn-m{font-size:2.15px;font-weight:600;text-anchor:end}',
    '.pn-b{fill:#111}.k-h{font-size:2.3px;font-weight:700;letter-spacing:.08em}.k-t{font-size:2.05px;fill:#222}',
    '.dt-c{fill:none;stroke:#111;stroke-width:.4}.dt-k{fill:#fff;stroke:#111;stroke-width:.3}.dt-l{font-size:3px;font-weight:700}.dt-kl{font-size:2.6px;font-weight:700}',
    '.dt-s{font-size:2.2px;fill:#555}.dt-n{font-size:2.35px;font-weight:600}.mk{fill:#fff;stroke:#111;stroke-width:.25}.mk-d{fill:#111}',
    '.wd{fill:none;stroke:#111;stroke-width:.25}.wd-t{fill:#111}.wd-x{font-size:2.1px;font-weight:600}',
    '.u-t{font-size:2.5px;font-weight:600}.u-x{font-size:1.95px;fill:#333}.u-w{font-size:1.9px;fill:#777;font-style:italic}',
    '.ix-h{font-size:2.2px;letter-spacing:.08em;fill:#555}.ix-c{font-size:2.5px;font-weight:600;font-variant-numeric:tabular-nums}.ix-t{font-size:2.5px}.ix-s{font-size:2.1px;fill:#555}',
    '.lg-v{stroke:#111;stroke-width:.3}.lg-h{stroke:#555;stroke-width:.13;stroke-dasharray:1 .6}.lg-a{stroke:#111;stroke-width:.2;stroke-dasharray:6 1 1 1}.lg-o{stroke:#9a9a9f;stroke-width:.16}',
    '.lg-b{stroke:#111;stroke-width:.25}'
  ].join('').replace(/(^|\})([^{}]+)\{/g, (m, b, sel) => b + sel.split(',').map((x) => '.dwg ' + x.trim()).join(',') + '{');

  /* flecha con punta rellena de (x0, y0) a (x1, y1) */
  function mountArrow(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy); if (l < 4) return '';
    const ux = dx / l, uy = dy / l, a = 2.2, w = 0.85, bx = x1 - ux * a, by = y1 - uy * a;
    return '<line class="mnt" x1="' + f2(x0) + '" y1="' + f2(y0) + '" x2="' + f2(bx) + '" y2="' + f2(by) + '"/><path class="mnt-h" d="M' + f2(x1) + ' ' + f2(y1) + 'L' + f2(bx - uy * w) + ' ' + f2(by + ux * w) + 'L' + f2(bx + uy * w) + ' ' + f2(by - ux * w) + 'Z"/>';
  }

  /* ================================================ lámina: secuencia de ensamble */
  function stepScene(S0, SX, k) {
    const prev = S0.list.some((q) => q.step < k), list = [], isNew = [], pairs = [];
    S0.list.forEach((q, i) => {
      if (q.step < k) { list.push(q); isNew.push(false); }
      else if (q.step === k) {
        const lift = prev && SX && SX.list[i];
        list.push(lift ? SX.list[i] : q); isNew.push(true);
        if (lift) pairs.push({ name: q.name, home: q.bb.getCenter(V3()), at: SX.list[i].bb.getCenter(V3()) });
      }
    });
    return { list, isNew, pairs };
  }
  DW.ensamble = function (v, n) {
    const H = DW._h, S0 = H.solids(v, n), SX = H.solids(v, n, true), it = itemOf(v, n);
    if (!S0 || !it) return '';
    const I = H.info(v, n), seq = it.seq, N = seq.length, steel = hasSteel(it), acts = stepActs(v, n);
    const sums = acts.map((a) => stepSummary(a, steel));
    const cols = N <= 2 ? N : N <= 4 ? 2 : N <= 6 ? 3 : 4, rows = Math.ceil(N / cols);
    const X0 = 20, Y0 = 33, W = 384, HH = 199, gap = 3.5;
    const pw = (W - gap * (cols - 1)) / cols, ph = (HH - gap * (rows - 1)) / rows;
    // medidas de cada panel: cabecera, instrucción, dibujo y lista de operaciones
    const lay = seq.map((sq, k) => {
      const tl = wrap(sq.t, pw - 32, 2.9, 2), ins = wrap(instr(it, k), pw - 8, 2.05, 2);
      const sm = sums[k], opl = [];
      if (sm.piezas.length) opl.push(...wrap('Piezas: ' + sm.piezas.join(', '), pw - 22, 2.15, 2));
      sm.ops.slice(0, 5).forEach((o) => opl.push('· ' + o));
      const th = (tl.length - 1) * 3.3, top = 10.5 + th + (ins.length + 1) * 2.6, bot = opl.length * 2.75 + 3;
      return { tl, th, ins, opl, top, bot, aw: pw - 6, ah: Math.max(20, ph - top - bot - 2) };
    });
    const scenes = seq.map((_, k) => stepScene(S0, SX, k));
    // una escala común (que el mueble no salte de tamaño entre pasos), sin pasarse del panel
    const pre = scenes.map((sc) => H.project({ list: sc.list }, 'iso', 1, { hidden: false, ppm: 1.2 }));
    const fit = pre.map((p, k) => Math.min(lay[k].aw / p.w, lay[k].ah / p.h));
    const common = Math.min.apply(null, fit) * 0.92;
    let s = H.sheetOpen('Secuencia de ensamble, mueble ' + n + ', versión ' + v);
    s += '<text class="title" x="20" y="22">' + esc(n + ' · ' + I.name) + '</text>';
    s += '<text class="subtitle" x="20" y="28">Secuencia de ensamble · ' + N + ' pasos · versión ' + v + ' · ' + esc(I.vi.nombre) + ' · lo ya armado en gris, las piezas del paso en negro con su flecha de montaje</text>';
    let total = 0;
    seq.forEach((sq, k) => {
      const c = k % cols, r = Math.floor(k / cols), x = X0 + c * (pw + gap), y = Y0 + r * (ph + gap), l = lay[k], sm = sums[k];
      total += sm.min;
      s += '<rect class="pn-f" x="' + f2(x) + '" y="' + f2(y) + '" width="' + f2(pw) + '" height="' + f2(ph) + '" rx="1.2"/>';
      s += '<g class="pn-n"><circle cx="' + f2(x + 5) + '" cy="' + f2(y + 5.2) + '" r="3"/><text x="' + f2(x + 5) + '" y="' + f2(y + 6.3) + '">' + (k + 1) + '</text></g>';
      s += lines(x + 10, y + 6.2, l.tl, 'pn-t', 3.3);
      s += '<text class="pn-m" x="' + f2(x + pw - 3) + '" y="' + f2(y + 6.2) + '">≈ ' + fmtMin(sm.min) + '</text>';
      s += lines(x + 3, y + 10.4 + l.th, l.ins, 'pn-i', 2.6);
      s += '<text class="pn-s" x="' + f2(x + 3) + '" y="' + f2(y + 10.4 + l.th + l.ins.length * 2.6) + '">' + esc(sq.src || '') + '</text>';
      // dibujo
      const sc = scenes[k], kk = Math.min(common * 1.35, fit[k] * 0.92);
      const P = H.project({ list: sc.list }, 'iso', kk, { hidden: false });
      const ax = x + 3, ay = y + l.top + 1, ox = ax + (l.aw - P.w) / 2, oy = ay + (l.ah - P.h) / 2;
      const old = P.vis.filter((q) => !sc.isNew[q[5]]), nw = P.vis.filter((q) => sc.isNew[q[5]]);
      if (old.length) s += '<path class="vis old" d="' + H.pathOf(old, ox, oy) + '"/>';
      s += '<path class="vis new" d="' + H.pathOf(nw, ox, oy) + '"/>';
      // flechas de montaje: una por grupo de piezas, las que más se desplazan
      const seen = new Set();
      sc.pairs.filter((p) => { if (seen.has(p.name)) return false; seen.add(p.name); return p.home.distanceTo(p.at) > 0.03; })
        .sort((a, b) => b.home.distanceTo(b.at) - a.home.distanceTo(a.at)).slice(0, 5).forEach((p) => {
          const px = (q) => ox + P.toX(q.dot(P.B.r)), py = (q) => oy + P.toY(q.dot(P.B.u));
          const x0 = px(p.at), y0 = py(p.at), x1 = px(p.home), y1 = py(p.home);
          s += mountArrow(x0 + (x1 - x0) * 0.12, y0 + (y1 - y0) * 0.12, x0 + (x1 - x0) * 0.88, y0 + (y1 - y0) * 0.88);
        });
      // piezas y uniones del paso
      s += lines(x + 3, y + ph - l.bot + 2.6, l.opl, 'pn-o', 2.75);
    });
    // pie: herrajes, herramientas, protección y tiempo
    const P = L.versions.precios, tipos = new Set(); sums.forEach((sm) => sm.tipos.forEach((t) => tipos.add(t)));
    const her = it.herrajes.map((h) => { const p = P[h[0]]; return (h[2] != null ? h[2] + ' × ' : '') + (p ? p.m : h[0]) + (h[1] ? ' (' + String(h[1]).toLowerCase() + ')' : ''); })
      .concat(it.acabados.map((a) => { const p = P[a[0]]; return (p ? p.m : a[0]) + ': ' + String(a[1]).toLowerCase() + (a[2] ? ', ' + String(a[2]).replace('.', ',') + ' m²' : '') + (a[3] ? ' × ' + a[3] + ' manos' : ''); }));
    const tools = ['Flexómetro, escuadra y nivel'].concat(Array.from(tipos).map((t) => TOOLS[t]).filter(Boolean));
    const epp = ['Gafas de seguridad y botas con puntera'].concat(Array.from(tipos).map((t) => EPP[t]).filter(Boolean));
    const col = (x, y, w, h, t, arr) => {
      let o = '<text class="k-h" x="' + x + '" y="' + y + '">' + esc(t) + '</text>', yy = y + 3.6;
      const max = Math.floor((h - 3.6) / 2.6);
      const all = []; arr.forEach((a) => wrap('· ' + a, w, 2.05).forEach((ln, i) => all.push(i ? '  ' + ln : ln)));
      if (all.length > max) { all.length = max; all[max - 1] = '…'; }
      o += lines(x, yy, all, 'k-t', 2.6);
      return o;
    };
    s += col(20, 241, 84, 42, 'HERRAJES Y CONSUMIBLES', her.length ? her : ['Sin herrajes']);
    s += col(108, 241, 66, 32, 'HERRAMIENTAS', tools);
    s += col(178, 241, 66, 32, 'PROTECCIÓN (GTC 45)', epp);
    s += '<text class="k-h" x="108" y="273">TIEMPO DE ENSAMBLE EN PLANTA</text><text class="pn-t" x="108" y="277.2">≈ ' + fmtMin(total) + ' · ' + N + ' pasos · datos tipo de la Nota 2</text>';
    s += '<text class="k-t" x="108" y="281.4">Uniones por paso deducidas del modelo; las cantidades de compra son las de la lista de herrajes.</text>';
    s += H.rotulo({ mueble: n + ' · ' + I.short, lamina: v + '-' + nn(n) + '.3', contenido: 'Secuencia de ensamble', escala: 'Sin escala', version: v + ' · ' + I.vi.nombre, fecha: fecha(), nota: 'Uniones y cantidades deducidas del modelo 3D; los tiempos son estimados de planta.' });
    return s + '</svg>';
  };

  /* ================================================ lámina: detalles constructivos */
  const DETAIL = {
    soldar: ['Unión soldada de tubo con tubo', 'Soldadura MIG a tope, a escuadra; se pule el cordón y se aplican dos manos de anticorrosivo.', 'SO'],
    auto: ['Tablero sobre bastidor de acero', 'Autoperforante de 6 × 5/8″ a través de un agujero de 5 mm en la pared del tubo, cada 300 mm.', 'TA'],
    ens: ['Tablero con tablero', 'Tornillo de ensamble de 6 × 2″ con pretaladro de 3 mm, a 50 mm de cada borde y cada 250 mm.', 'TT'],
    allen: ['Perfil de aluminio 30 × 30', 'Bristol M6 × 16 a tuerca martillo en la ranura del perfil; escuadra 3030 en las esquinas.', 'AT'],
    anclar: ['Anclaje al muro', 'Chazo expansivo de 3/8″ × 1-7/8″ con broca de 3/8″; antes de perforar se verifica que no pasen tuberías ni cables.', 'MU'],
    roscar: ['Apoyo nivelador', 'Nivelador de rosca 5/16″ en tuerca soldada (tubo) o inserto roscado (tablero); regula ±15 mm.', 'NIV'],
    herraje: ['Herraje', 'Se instala con la plantilla del fabricante; perforaciones según el plano de ensamble.', null],
    encolar: ['Capas encoladas', 'Pegante de contacto en las dos caras, 15 minutos de oreo y prensado; luego se refila y se pega el canto.', 'HPL']
  };
  const ORDER = ['soldar', 'auto', 'ens', 'anclar', 'roscar', 'allen', 'herraje', 'encolar'];
  function pickDetails(v, n) {
    const it = itemOf(v, n), steel = hasSteel(it), acts = stepActs(v, n), found = {}, chosen = [];
    acts.forEach((list, k) => list.forEach((a) => {
      if (a.dup) return;
      let key = a.t;
      if (a.t === 'atornillar') key = screwKind(a, steel);
      if (!DETAIL[key] || found[key]) return;
      let pts = a.pts || null;
      if (a.t === 'encolar') pts = (a.cts || []).map((ct) => { const c = ct.c.clone(); c[ct.long] += ct.len / 2; c[ct.short] += ct.wid / 2; return { p: c, n: V3(0, 1, 0), dir: V3(0, -1, 0) }; });
      if (!pts || !pts.length) return;
      // la cara por donde se ve la fijación; los autoperforantes de la tapa entran por debajo del bastidor
      const nrm = key === 'auto' ? V3(0, -1, 0) : (pts[0].n || V3(0, 0, 1)).clone(), eye = isoFor(nrm).f.clone().negate();
      // la fijación más cercana a la esquina que mira al observador: el detalle muestra la unión con su contexto
      // y lejos de los detalles ya elegidos, para que las llamadas no se encimen en la isometría de referencia
      const score = (q) => q.p.dot(eye) + 1.2 * Math.min(0.45, chosen.reduce((m, c) => Math.min(m, c.distanceTo(q.p)), 9));
      const order = pts.slice().sort((a1, b1) => score(b1) - score(a1)), q0 = order[0];
      chosen.push(q0.p.clone());
      found[key] = { key, act: a, step: k, p: q0.p.clone(), nrm, pts, what: a.what, cands: order.slice(0, 5).map((q) => q.p.clone()) };
    }));
    return ORDER.filter((k) => found[k]).map((k) => found[k]).slice(0, 5);
  }
  /* isometría orientada para ver la cara por donde entra la fijación */
  function isoFor(nrm) {
    const f = V3(-1, -0.82, -1);
    if (Math.abs(nrm.y) > 0.5) f.y = nrm.y > 0 ? -0.82 : 0.82;
    if (Math.abs(nrm.x) > 0.5) f.x = nrm.x > 0 ? -1 : 1;
    if (Math.abs(nrm.z) > 0.5) f.z = nrm.z > 0 ? -1 : 1;
    return DW._h.basis(f, V3(0, 1, 0));
  }
  DW.detalles = function (v, n) {
    const H = DW._h, S0 = H.solids(v, n), it = itemOf(v, n);
    if (!S0 || !it) return '';
    const I = H.info(v, n), U = L.uniones ? L.uniones.of(v, n) : [];
    // cada detalle prueba sus uniones candidatas y se queda con la primera que muestre geometría a su alrededor
    const R = 31, den = 5, k = 1000 / den, rad = R / k;
    const D = pickDetails(v, n).map((d) => {
      const B = isoFor(d.nrm);
      for (const p of d.cands) {
        const sub = S0.list.filter((q) => q.bb.distanceToPoint(p) < rad * 1.5);
        const half = rad * 1.12, cr = p.dot(B.r), cu = p.dot(B.u);
        const P = H.project({ list: sub }, null, k, { basis: B, hidden: true, ppm: 6, win: { r0: cr - half, r1: cr + half, u0: cu - half, u1: cu + half } });
        const px = P.toX(cr), py = P.toY(cu);
        // longitud de arista vista que cae dentro del círculo (mm de lámina)
        let inside = 0;
        P.vis.forEach((q) => { const l = Math.hypot(q[2] - q[0], q[3] - q[1]); let c = 0; for (let j = 0; j <= 8; j++) { const t = j / 8; if (Math.hypot(q[0] + (q[2] - q[0]) * t - px, q[1] + (q[3] - q[1]) * t - py) < R * 0.85) c++; } inside += l * c / 9; });
        if (inside >= 60) return Object.assign(d, { p, B, P, px, py });
      }
      return null;
    }).filter(Boolean);
    const uid = 'd' + v + n + '_';
    let s = H.sheetOpen('Detalles constructivos, mueble ' + n + ', versión ' + v);
    s += '<text class="title" x="20" y="22">' + esc(n + ' · ' + I.name) + '</text>';
    s += '<text class="subtitle" x="20" y="28">Detalles constructivos · ' + D.length + (D.length === 1 ? ' detalle' : ' detalles') + ' a escala 1:5 y ' + U.length + (U.length === 1 ? ' unión' : ' uniones') + ' en corte · versión ' + v + ' · ' + esc(I.vi.nombre) + '</text>';
    // isometría de referencia con la ubicación de cada detalle
    const kx = 20, ky = 36, kw = 92, kh = 84;
    const pre = H.project(S0, 'iso', 1, { hidden: false, ppm: 1.5 }), kk = Math.min(kw / pre.w, kh / pre.h) * 0.86;
    const PK = H.project(S0, 'iso', kk, { hidden: false }), kox = kx + (kw - PK.w) / 2, koy = ky + (kh - PK.h) / 2;
    s += H.viewSVG(PK, kox, koy, { thin: true });
    s += H.label(kx, ky + kh + 5, 'UBICACIÓN DE LOS DETALLES', 'Isometría sin escala');
    const LET = 'ABCDE';
    D.forEach((d, i) => {
      const x = kox + PK.toX(d.p.dot(PK.B.r)), y = koy + PK.toY(d.p.dot(PK.B.u));
      s += '<circle class="dt-c" cx="' + f2(x) + '" cy="' + f2(y) + '" r="3.4"/><g><circle class="dt-k" cx="' + f2(x + 4.6) + '" cy="' + f2(y - 4.6) + '" r="2.2"/><text class="dt-kl" x="' + f2(x + 4.6) + '" y="' + f2(y - 3.65) + '" text-anchor="middle">' + LET[i] + '</text></g>';
    });
    // detalles: círculos de 31 mm de radio a escala 1:5 (0,155 m alrededor de la unión)
    const C = [[148, 72], [218, 72], [52, 166], [122, 166], [192, 166]];
    D.forEach((d, i) => {
      const cx = C[i][0], cy = C[i][1], B = d.B, P = d.P, ox = cx - d.px, oy = cy - d.py;
      s += '<clipPath id="' + uid + i + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '"/></clipPath>';
      s += '<g clip-path="url(#' + uid + i + ')">' + H.viewSVG(P, ox, oy) + '</g>';
      // marcas de las fijaciones de este grupo que caen dentro del círculo
      let marks = '';
      d.pts.forEach((q) => {
        const x = ox + P.toX(q.p.dot(B.r)), y = oy + P.toY(q.p.dot(B.u));
        if (Math.hypot(x - cx, y - cy) > R - 2) return;
        marks += d.key === 'soldar' ? '<path class="wd-t" d="M' + f2(x - 1.3) + ' ' + f2(y + 0.9) + 'L' + f2(x + 1.3) + ' ' + f2(y + 0.9) + 'L' + f2(x) + ' ' + f2(y - 1.1) + 'Z"/>'
          : '<circle class="mk" cx="' + f2(x) + '" cy="' + f2(y) + '" r="1.3"/><circle class="mk-d" cx="' + f2(x) + '" cy="' + f2(y) + '" r=".45"/>';
      });
      s += marks;
      s += '<circle class="dt-c" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>';
      // símbolo de soldadura (filete, todo alrededor) con su llamada
      if (d.key === 'soldar') {
        const lx = cx + R * 0.72, ly = cy - R * 0.72;
        s += '<path class="wd" d="M' + f2(cx + 1) + ' ' + f2(cy - 1) + 'L' + f2(lx) + ' ' + f2(ly) + 'H' + f2(lx + 12) + '"/><path class="wd-t" d="M' + f2(lx + 3) + ' ' + f2(ly) + 'v-2.6l2.6 2.6z"/><circle class="wd" cx="' + f2(lx) + '" cy="' + f2(ly) + '" r="1"/><text class="wd-x" x="' + f2(lx + 6.5) + '" y="' + f2(ly - 0.8) + '">MIG</text>';
      }
      const tt = DETAIL[d.key], title = d.key === 'herraje' ? cap(String(d.what).toLowerCase()) : tt[0];
      s += '<text class="dt-l" x="' + (cx - R) + '" y="' + (cy + R + 5.2) + '">DETALLE ' + LET[i] + '</text><text class="dt-s" x="' + (cx + R) + '" y="' + (cy + R + 5.2) + '" text-anchor="end">Esc. 1:' + den + ' · paso ' + (d.step + 1) + '</text>';
      s += lines(cx - R, cy + R + 9, wrap(title, 2 * R, 2.35, 1), 'dt-n', 2.8);
      const NOUN = { soldar: ['cordón', 'cordones'], auto: ['autoperforante', 'autoperforantes'], ens: ['tornillo', 'tornillos'], allen: ['tornillo', 'tornillos'], anclar: ['chazo', 'chazos'], roscar: ['nivelador', 'niveladores'], herraje: ['fijación', 'fijaciones'] }[d.key];
      const cnt = NOUN ? ' En el paso ' + (d.step + 1) + ': ' + d.pts.length + ' ' + NOUN[d.pts.length === 1 ? 0 : 1] + '.' : '';
      s += lines(cx - R, cy + R + 12, wrap(tt[1] + cnt, 2 * R, 2.2, 4), 'dt-s', 2.6);
    });
    if (!D.length) s += '<text class="dt-s" x="120" y="80">Este mueble no tiene uniones mecánicas en el modelo: se apoya o se cuelga.</text>';
    // uniones en corte (uniones.js), columna derecha
    const ux = 252, uw = 152, uy0 = 36, uyH = 196;
    s += '<text class="k-h" x="' + ux + '" y="' + (uy0 + 2) + '">UNIONES EN CORTE (ESQUEMA)</text>';
    const bh = U.length ? Math.min(46, (uyH - 6) / U.length) : 0;
    U.forEach((u, i) => {
      const y = uy0 + 6 + i * bh, dw = bh > 36 ? 72 : 60, dh = Math.min(bh - 6, dw * 92 / 266);
      s += '<line class="rule-t" x1="' + ux + '" y1="' + f2(y - 1.5) + '" x2="' + (ux + uw) + '" y2="' + f2(y - 1.5) + '"/>';
      s += '<text class="u-t" x="' + ux + '" y="' + f2(y + 2.2) + '">' + esc('U' + (i + 1) + ' · ' + u.u.t) + '</text>';
      s += u.u.draw().replace('<svg ', '<svg x="' + ux + '" y="' + f2(y + 3.6) + '" width="' + dw + '" height="' + f2(dh) + '" preserveAspectRatio="xMinYMin meet" ');
      const tl = wrap(u.u.como, uw - dw - 3, 1.95, Math.max(2, Math.floor((bh - 7) / 2.45)));
      s += lines(ux + dw + 3, y + 5.6, tl, 'u-x', 2.45);
    });
    // notas de fabricación (proceso del mueble)
    s += '<text class="k-h" x="20" y="241">NOTAS DE FABRICACIÓN</text>';
    let yy = 245, nl = 0;
    it.fab.forEach((f, i) => {
      const ls = wrap((i + 1) + '. ' + f, 224, 2.1); if (nl + ls.length > 14) return;
      s += lines(20, yy, ls, 'k-t', 2.6); yy += ls.length * 2.6 + 0.4; nl += ls.length;
    });
    s += H.rotulo({ mueble: n + ' · ' + I.short, lamina: v + '-' + nn(n) + '.4', contenido: 'Detalles constructivos', escala: 'Detalles 1:5', version: v + ' · ' + I.vi.nombre, fecha: fecha(), nota: 'Uniones ubicadas desde el modelo 3D; los cortes son esquemáticos.' });
    return s + '</svg>';
  };

  /* ================================================ lista de láminas de una versión */
  const KINDS = [['conjunto', 'Plano de ensamble', 'Vistas, corte, planta, isometría y cotas'], ['explosion', 'Despiece explosionado', 'Isometría explosionada y lista de piezas'], ['ensamble', 'Secuencia de ensamble', 'Paso a paso, uniones, herramientas y tiempos'], ['detalles', 'Detalles constructivos', 'Uniones a escala 1:5 y en corte']];
  PN.fab = (v) => L.data.items.filter((d) => d.origen === 'fabrica' && itemOf(v, d.n));
  PN.sheets = function (v) {
    const out = [{ id: 'g', code: 'G-00', title: 'Índice y convenciones', group: 'General' }, { id: 'a', code: 'A-01', title: 'Planta de distribución y mobiliario', sub: 'Escala 1:50', group: 'General' }];
    PN.fab(v).forEach((d) => {
      const it = itemOf(v, d.n), np = DW.nPiezas(v, d.n), code = v + '-' + nn(d.n), group = d.n + ' · ' + (it.short || d.short);
      KINDS.concat(Array.from({ length: np }, (_, j) => ['piezas:' + (j + 1), 'Piezas' + (np > 1 ? ', hoja ' + (j + 1) : ''), 'Medidas de corte de cada pieza']))
        .forEach((kd, j) => out.push({ id: d.n + '.' + (j + 1), code: code + '.' + (j + 1), key: kd[0], title: kd[1], sub: kd[2], n: d.n, group, name: it.name || d.name }));
    });
    return out;
  };
  /* dibuja una lámina de mueble (las generales las dibuja el visor) */
  PN.draw = function (v, sh) {
    const p = sh.key.split(':');
    return DW[p[0]](v, sh.n, p[1] ? +p[1] : undefined);
  };
  DW.sheetName = (key) => { const p = key.split(':'), k = KINDS.find((x) => x[0] === p[0]); return k ? k[1] : 'Piezas, hoja ' + p[1]; };

  /* ================================================ lámina: índice y convenciones */
  DW.indice = function (v) {
    const H = DW._h, VS = L.versions, vi = VS.list.find((x) => x.id === v), list = PN.sheets(v);
    let s = H.sheetOpen('Índice del juego de planos, versión ' + v);
    s += '<defs><pattern id="ixW" width="1.8" height="1.8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="1.8" stroke="#111" stroke-width=".18"/></pattern>' +
      '<pattern id="ixA" width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V1.2M0 0H1.2" stroke="#111" stroke-width=".14"/></pattern>' +
      '<pattern id="ixP" width="1.2" height="1.2" patternUnits="userSpaceOnUse"><circle cx=".6" cy=".6" r=".2" fill="#111"/></pattern>' +
      '<pattern id="ixG" width=".9" height=".9" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2=".9" stroke="#111" stroke-width=".22"/></pattern></defs>';
    s += '<text class="title" x="20" y="22">Juego de planos · versión ' + v + ' · ' + esc(vi.nombre) + '</text>';
    s += '<text class="subtitle" x="20" y="28">' + list.length + ' láminas A3: planta general y, para cada uno de los ' + PN.fab(v).length + ' muebles fabricados, ensamble, explosionado, secuencia, detalles y piezas</text>';
    // índice
    const tx = 20, ty = 38;
    s += '<text class="h2" x="' + tx + '" y="' + ty + '">Índice de láminas</text>';
    s += '<text class="ix-h" x="' + tx + '" y="' + (ty + 6) + '">LÁMINA</text><text class="ix-h" x="' + (tx + 26) + '" y="' + (ty + 6) + '">CONTENIDO</text><text class="ix-h" x="' + (tx + 150) + '" y="' + (ty + 6) + '">HOJAS</text>';
    s += '<line class="rule" x1="' + tx + '" y1="' + (ty + 7.6) + '" x2="' + (tx + 200) + '" y2="' + (ty + 7.6) + '"/>';
    let y = ty + 12;
    const row = (code, title, sub, hojas) => {
      let o = '<text class="ix-c" x="' + tx + '" y="' + f2(y) + '">' + esc(code) + '</text><text class="ix-t" x="' + (tx + 26) + '" y="' + f2(y) + '">' + esc(title) + '</text>' + (sub ? '<text class="ix-s" x="' + (tx + 26) + '" y="' + f2(y + 2.9) + '">' + esc(sub) + '</text>' : '') +
        '<text class="ix-s" x="' + (tx + 150) + '" y="' + f2(y) + '">' + esc(hojas) + '</text>';
      o += '<line class="rule-t" x1="' + tx + '" y1="' + f2(y + (sub ? 4.4 : 1.8)) + '" x2="' + (tx + 200) + '" y2="' + f2(y + (sub ? 4.4 : 1.8)) + '"/>';
      y += sub ? 8.4 : 5.6; return o;
    };
    s += row('G-00', 'Índice y convenciones', '', '1');
    s += row('A-01', 'Planta de distribución y mobiliario', 'Escala 1:50 · local de 6.00 × 7.00 m', '1');
    PN.fab(v).forEach((d) => {
      const sh = list.filter((x) => x.n === d.n), it = itemOf(v, d.n), np = sh.length - 4;
      s += row(v + '-' + nn(d.n), d.n + ' · ' + (it.name || d.name), '.1 Ensamble · .2 Explosionado · .3 Secuencia · .4 Detalles · ' + (np > 1 ? '.5 a .' + (4 + np) : '.5') + ' Piezas', String(sh.length));
    });
    s += '<text class="ix-s" x="' + tx + '" y="' + f2(y + 2) + '">Total: ' + list.length + ' láminas. Cada lámina de mueble se nombra versión-número.hoja (por ejemplo ' + v + '-03.2).</text>';
    // convenciones
    const cx = 236, cy = 38;
    s += '<text class="h2" x="' + cx + '" y="' + cy + '">Convenciones</text>';
    let yy = cy + 7;
    const ln = (cls, t, extra) => { const o = '<line class="' + cls + '" x1="' + cx + '" y1="' + f2(yy - 0.8) + '" x2="' + (cx + 18) + '" y2="' + f2(yy - 0.8) + '"/>' + (extra || '') + '<text class="k-t" x="' + (cx + 22) + '" y="' + f2(yy) + '">' + esc(t) + '</text>'; yy += 4.4; return o; };
    s += '<text class="k-h" x="' + cx + '" y="' + yy + '">LÍNEAS</text>'; yy += 4.4;
    s += ln('lg-v', 'Arista vista');
    s += ln('lg-h', 'Arista oculta');
    s += ln('lg-a', 'Plano de corte (A–A) y ejes');
    s += ln('lg-o', 'Secuencia: lo ya armado');
    s += ln('lg-b', 'Secuencia: piezas del paso');
    s += '<line class="mnt" x1="' + cx + '" y1="' + f2(yy - 0.8) + '" x2="' + (cx + 15.8) + '" y2="' + f2(yy - 0.8) + '"/><path class="mnt-h" d="M' + (cx + 18) + ' ' + f2(yy - 0.8) + 'l-2.2 -.85v1.7z"/><text class="k-t" x="' + (cx + 22) + '" y="' + f2(yy) + '">Flecha de montaje</text>'; yy += 4.4;
    s += '<line class="d-line" x1="' + cx + '" y1="' + f2(yy - 0.8) + '" x2="' + (cx + 18) + '" y2="' + f2(yy - 0.8) + '"/>' + H.arrow(cx, yy - 0.8, -1, 0) + H.arrow(cx + 18, yy - 0.8, 1, 0) + '<text class="k-t" x="' + (cx + 22) + '" y="' + f2(yy) + '">Cota en milímetros (planta general en metros)</text>'; yy += 7;
    s += '<text class="k-h" x="' + cx + '" y="' + yy + '">RAYADOS DE SECCIÓN</text>'; yy += 2.5;
    [['url(#ixW)', 'Tablero (aglomerado, MDF, melamina)'], ['#111', 'Acero (tubo y lámina)'], ['url(#ixA)', 'Aluminio (perfil 30 × 30)'], ['url(#ixP)', 'Plástico (PVC, acrílico)'], ['url(#ixG)', 'PETG impreso'], ['vidrio', 'Vidrio templado']].forEach((h, i) => {
      const x = cx + (i % 2) * 84, y2 = yy + Math.floor(i / 2) * 6.5;
      s += h[0] === 'vidrio' ? '<rect x="' + x + '" y="' + f2(y2) + '" width="12" height="4.2" fill="#fff" stroke="#111" stroke-width=".25"/><line x1="' + x + '" y1="' + f2(y2 + 1.4) + '" x2="' + (x + 12) + '" y2="' + f2(y2 + 1.4) + '" stroke="#111" stroke-width=".12"/><line x1="' + x + '" y1="' + f2(y2 + 2.8) + '" x2="' + (x + 12) + '" y2="' + f2(y2 + 2.8) + '" stroke="#111" stroke-width=".12"/>'
        : '<rect x="' + x + '" y="' + f2(y2) + '" width="12" height="4.2" fill="' + h[0] + '" stroke="#111" stroke-width=".25"/>';
      s += '<text class="k-t" x="' + (x + 15) + '" y="' + f2(y2 + 3.2) + '">' + esc(h[1]) + '</text>';
    });
    yy += 3 * 6.5 + 5;
    s += '<text class="k-h" x="' + cx + '" y="' + yy + '">SÍMBOLOS</text>'; yy += 5;
    const sym = (draw, t) => { const o = draw(cx + 6, yy - 1) + '<text class="k-t" x="' + (cx + 22) + '" y="' + f2(yy) + '">' + esc(t) + '</text>'; yy += 6; return o; };
    s += sym((x, y2) => '<g class="balloon"><circle cx="' + x + '" cy="' + y2 + '" r="3"/><text x="' + x + '" y="' + (y2 + 1.05) + '">7</text></g>', 'Marca de pieza (despiece y lista de piezas)');
    s += sym((x, y2) => '<circle class="dt-c" cx="' + x + '" cy="' + y2 + '" r="2.6"/><circle class="dt-k" cx="' + (x + 4) + '" cy="' + (y2 - 3.4) + '" r="2"/><text class="dt-kl" x="' + (x + 4) + '" y="' + (y2 - 2.5) + '" text-anchor="middle">A</text>', 'Llamada de detalle (lámina .4)');
    s += sym((x, y2) => '<path class="wd" d="M' + (x - 6) + ' ' + (y2 + 2) + 'L' + (x - 2) + ' ' + (y2 - 1) + 'H' + (x + 9) + '"/><path class="wd-t" d="M' + (x + 1) + ' ' + (y2 - 1) + 'v-2.6l2.6 2.6z"/><circle class="wd" cx="' + (x - 2) + '" cy="' + (y2 - 1) + '" r="1"/>', 'Soldadura de filete todo alrededor (MIG)');
    s += sym((x, y2) => '<circle class="mk" cx="' + x + '" cy="' + y2 + '" r="1.3"/><circle class="mk-d" cx="' + x + '" cy="' + y2 + '" r=".45"/>', 'Fijación: tornillo, chazo o nivelador');
    s += sym((x, y2) => '<g class="pn-n"><circle cx="' + x + '" cy="' + y2 + '" r="3"/><text x="' + x + '" y="' + (y2 + 1.1) + '">2</text></g>', 'Número de paso de ensamble');
    s += sym((x, y2) => '<g class="proj"><path d="M' + (x - 6) + ' ' + (y2 - 1.6) + 'L' + (x - 2) + ' ' + (y2 - 2.6) + 'L' + (x - 2) + ' ' + (y2 + 2.6) + 'L' + (x - 6) + ' ' + (y2 + 1.6) + 'Z"/><circle cx="' + (x + 2.6) + '" cy="' + y2 + '" r="2.6"/><circle cx="' + (x + 2.6) + '" cy="' + y2 + '" r="1.1"/></g>', 'Proyección en el primer diedro (ISO E)');
    // notas generales
    const notes = [
      'Dibujo según ISO 128 (líneas) e ISO 5456-2 (proyección en el primer diedro, método E). Láminas A3 horizontales; la escala de cada vista se indica en ella.',
      'Cotas en milímetros en las láminas de muebles y en metros en la planta general. Las cotas mandan sobre la medida tomada a escala.',
      'Tolerancia general de corte ±1 mm en tableros y ±2 mm en tubos; escuadra verificada con diagonal en cada bastidor.',
      'Tableros cortados y enchapados por el proveedor según las láminas de piezas; tubos cortados a 90° y soldados en el taller.',
      'Todas las láminas se dibujan desde el modelo 3D del visor: el mueble que se ve es el que se fabrica. Verificar en sitio las medidas de muros y vanos antes de cortar.'
    ];
    let ny = 236;
    s += '<text class="k-h" x="20" y="' + ny + '">NOTAS GENERALES</text>'; ny += 4;
    notes.forEach((t, i) => { const ls = wrap((i + 1) + '. ' + t, 224, 2.1); s += lines(20, ny, ls, 'k-t', 2.6); ny += ls.length * 2.6 + 0.6; });
    s += H.rotulo({ mueble: 'Juego de planos · versión ' + v, lamina: 'G-00', contenido: 'Índice y convenciones', escala: 'Sin escala', version: v + ' · ' + vi.nombre, fecha: fecha() });
    return s + '</svg>';
  };
})();
