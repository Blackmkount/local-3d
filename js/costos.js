/* ============================================================================
   COSTOS (Nota 3, numeral 7) — cuánto cuesta fabricar lo que se diseñó.

     Costo del mueble = materias primas + mano de obra directa + costos indirectos

   Materias primas: las cantidades del despiece de la versión B y los planes de
     corte de la Nota 2 (tableros enteros por juego; perfiles, tiras y tubos con
     un plan de corte lineal), al precio del proveedor elegido en el cuadro
     comparativo (L.nota3.cot). Sin IVA: la planta es responsable de IVA y lo
     descuenta (art. 485 del Estatuto Tributario).
   Mano de obra directa: los tiempos del ítem 11 (por estación y por mueble, con
     suplementos) × el costo de una hora trabajada de quien hace esa estación.
   Costos indirectos: el presupuesto anual de la planta, repartido entre los
     muebles por las horas de mano de obra directa (Goetsch y Davis, 2016, cap. 21).
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D;
  const C = (L.costos = {});
  const V = 'B';
  const N2 = L.nota2, N3 = L.nota3, VS = L.versions, PR = L.proceso, CO = L.corte;
  const IVA = 0.19;
  const FAB = () => Object.keys(VS.items[V]).map(Number);
  const J = () => N2.volumen.juegos;
  let cache = null;
  C.reset = () => { cache = null; };

  /* --------------------------------------------------------------- precios */
  const sinIva = (q) => (q.iva === 'mas' || q.iva === 'exc' ? q.p : q.p / (1 + IVA));
  const conIva = (q) => (q.iva === 'mas' ? q.p * (1 + IVA) : q.p);
  C.sinIva = sinIva; C.conIva = conIva;
  /* precio por unidad de compra del proveedor elegido (o del índice i) */
  C.pu = (k, i) => { const c = N3.cot[k]; const q = c.q[i == null ? c.sel : i]; return sinIva(q) * (q.x || 1); };
  C.elegido = (k) => { const c = N3.cot[k]; return c.q[c.sel]; };

  /* ----------------------------------------------- plan de corte lineal (FFD) */
  function lineal(piezas, Lb, kerf) {
    const bars = [];
    piezas.slice().sort((a, b) => b.l - a.l).forEach((p) => {
      let b = bars.find((x) => x.libre >= p.l - 1e-9);
      if (!b) { b = { libre: Lb, cortes: [] }; bars.push(b); }
      b.cortes.push(p); b.libre -= p.l + kerf;
    });
    const usado = piezas.reduce((a, p) => a + p.l, 0);
    return { bars, n: bars.length, usado, aprov: usado / (bars.length * Lb) };
  }
  C.lineal = lineal;

  /* --------------------------------------------------- consumo por mueble
     cons[k][n] = cantidad que usa el mueble n del material k, en la unidad de consumo:
     m² de piezas (tableros y vidrio), m (perfiles, tiras, cantos), m² × mano (acabados),
     unidades (herrajes y equipo). */
  function consumo() {
    const I = VS.items[V], P = VS.precios, cons = {}, piezasL = {};
    const add = (k, n, q) => { (cons[k] = cons[k] || {})[n] = (cons[k][n] || 0) + q; };
    const lac = N3.laca;
    FAB().forEach((n) => {
      const it = I[n];
      it.piezas.forEach((p) => {
        const pr = P[p[0]];
        if (pr.tipo === 'lamina' || pr.tipo === 'm2') add(p[0], n, p[2] * p[3] * (p[4] || 1));
        else if (pr.tipo === 'barra') { add(p[0], n, p[2] * p[3]); for (let i = 0; i < p[2]; i++) (piezasL[p[0]] = piezasL[p[0]] || []).push({ n, l: p[3], t: p[1] }); }
        else add(p[0], n, p[2] * p[3]);
      });
      it.acabados.forEach((a) => {
        if (a[0] === 'laca') { add('_lacaArea', n, a[2]); lac.sistema.forEach((s) => add(s.k, n, a[2] * s.manos / (lac.rend * lac.te) * (s.prop || 1))); }
        else if (a[0] === 'anticorr') add(N3.negro.k, n, a[2] * a[3] / (N3.negro.rend * lac.te));
      });
      it.herrajes.forEach((h) => add(h[0], n, h[2]));
    });
    N3.equipo.forEach((e) => add(e.k, e.n, e.q));
    return { cons, piezasL };
  }

  /* ------------------------------------------------ P · lista de compras
     Una fila por material: consumo del juego, unidades de compra del juego y del volumen. */
  function compras() {
    const { cons, piezasL } = consumo(), out = [], plan = CO.plan(V), nJ = J();
    const planBy = {}; plan.forEach((g) => { planBy[g.mk] = g; });
    Object.keys(N3.cot).forEach((k) => {
      const c = N3.cot[k], q = cons[k] || {};
      const tot = Object.values(q).reduce((a, b) => a + b, 0);
      let uJ, uV, det, aprov = null, lin = null;
      if (c.modo === 'lamina') { const g = planBy[k]; uJ = g ? g.boards.length : 0; uV = uJ * nJ; aprov = g ? g.aprov : null; det = 'Plan de corte de la Nota 2: ' + uJ + (uJ === 1 ? ' lámina' : ' láminas') + ' por juego'; }
      else if (c.modo === 'barra') { lin = lineal(piezasL[k] || [], c.L, c.kerf || 0); uJ = lin.n; uV = uJ * nJ; aprov = lin.aprov; det = 'Plan de corte lineal: ' + (piezasL[k] || []).length + ' tramos en ' + uJ + ' × ' + c.uc; }
      else if (c.modo === 'rollo') { const m = tot * (c.merma || 1); uJ = m / c.L; uV = Math.ceil(m * nJ / c.L - 1e-9); det = fmt(m, 1) + ' m por juego con ' + Math.round(((c.merma || 1) - 1) * 100) + ' % de recorte; se compra el rollo para el año'; }
      else if (c.modo === 'm2') { uJ = Math.max(tot, c.min || 0); uV = uJ * nJ; det = fmt(tot, 2) + ' m² por juego, a medida' + (c.min && tot < c.min ? ' (mínimo de ' + c.min + ' m²)' : ''); }
      else if (c.modo === 'gal') { const g = tot / (c.conv || 1); uJ = g; uV = Math.ceil(g * nJ - 1e-9); det = fmt(tot, 1) + ' gal por juego' + (c.conv > 1 ? ' (' + fmt(g, 2) + ' × ' + c.uc + ')' : ''); }
      else if (c.modo === 'viaje') { uJ = c.porJuego || 1; uV = uJ * nJ; det = c.det || ''; }
      else { uJ = tot / (c.conv || 1); uV = Math.ceil(tot * nJ / (c.conv || 1) - 1e-9); det = 'Despiece de la Nota 1'; }
      const pu = C.pu(k), ccon = conIva(c.q[c.sel]) * (c.q[c.sel].x || 1);
      out.push({ k, c, cons: q, tot, uJ, uV, det, aprov, lin, pu, pv: uV * pu, pvIva: uV * ccon, pj: uV * pu / nJ });
    });
    return out;
  }

  /* ------------------------------------------------ materias primas de cada mueble */
  function mp(rows) {
    const per = {};
    FAB().forEach((n) => { per[n] = { rows: [], total: 0 }; });
    rows.forEach((r) => {
      let base = r.cons, tot = r.tot;
      if (r.c.reparto) { base = {}; r.c.reparto.forEach((k2) => { const r2 = rows.find((x) => x.k === k2); if (r2) Object.keys(r2.cons).forEach((n) => { base[n] = (base[n] || 0) + r2.cons[n]; }); }); tot = Object.values(base).reduce((a, b) => a + b, 0); }
      Object.keys(base).forEach((n) => {
        if (!per[n] || !tot) return;
        const share = base[n] / tot, costo = r.pj * share;
        per[n].rows.push({ k: r.k, m: r.c.m, g: r.c.g, cant: base[n], share, costo, uni: r.c.ucons || '' });
        per[n].total += costo;
      });
    });
    return per;
  }

  /* --------------------------------------------- horas por mueble y estación */
  function horas() {
    const T = N2.tiempos, sup = 1 + N2.suplemento.pct, out = {};
    FAB().forEach((n) => {
      const p = PR.de(V, n), ops = p.comps.reduce((a, c) => a.concat(c.ops), []).concat(p.main), e = {};
      ops.forEach((o) => { if (T[o.k] && T[o.k].demora) return; e[o.e] = (e[o.e] || 0) + PR.tiempo(o, T) * sup / 60; });
      out[n] = e;
    });
    return out;
  }

  /* ------------------------------------------------ mano de obra directa */
  function manoObra() {
    const M = N3.mo, R = L.notaMods[2].ritmo(), nJ = J();
    const hAnio = R.horas - M.vacDias * R.hDia;                 // horas trabajadas en 2027 por persona de tiempo completo
    const fPrest = M.factor.filter((f) => f.base === 'sal+aux').reduce((a, f) => a + f.pct, 0) / 100;
    const fSal = M.factor.filter((f) => f.base === 'sal').reduce((a, f) => a + f.pct, 0) / 100;
    const per = M.personas.map((p) => {
      const sal = p.salario * p.jornada, aux = M.auxTransp * (p.auxPct == null ? 1 : p.auxPct);
      const mes = sal + aux + (sal + aux) * fPrest + sal * fSal;
      const anual = mes * 12, h = hAnio * p.jornada;
      return Object.assign({}, p, { sal, aux, mes, anual, h, tasa: anual / h, fPrest, fSal });
    });
    const por = {}; per.forEach((p) => p.estaciones.forEach((e) => { por[e] = p; }));
    const H = horas(), mue = {};
    let hJ = 0, cJ = 0;
    const hP = {}; per.forEach((p) => { hP[p.k] = 0; });
    FAB().forEach((n) => {
      let h = 0, c = 0; const det = {};
      Object.keys(H[n]).forEach((e) => { const p = por[e]; h += H[n][e]; c += H[n][e] * p.tasa; det[p.k] = (det[p.k] || 0) + H[n][e]; hP[p.k] += H[n][e]; });
      mue[n] = { h, c, det, est: H[n] }; hJ += h; cJ += c;
    });
    const nomina = per.reduce((a, p) => a + p.anual, 0), aplicada = cJ * nJ;
    return { per, por, mue, hJ, cJ, hP, hAnio, R, nomina, aplicada, ociosa: nomina - aplicada };
  }

  /* ------------------------------------------------ costos indirectos (presupuesto anual) */
  function indirectos(mo, rows) {
    const D = N3.cif, nJ = J(), out = [];
    const push = (k, t, anual, calc, tag, f) => out.push({ k, t, anual, calc, tag, f });
    // 1. mano de obra no aplicada (tiempo pagado que no transforma muebles)
    push('moi', 'Mano de obra indirecta: tiempo pagado no aplicado', mo.ociosa, 'Nómina del año ' + cop(mo.nomina) + ' − mano de obra directa de ' + nJ + ' juegos ' + cop(mo.aplicada) + '. Incluye la supervisión que hace el ebanista como jefe de taller, el aseo, el mantenimiento y el tiempo sin pedidos.', 'estimado', 'Ítem «Mano de obra» de esta nota');
    // 2. arriendo
    push('arr', 'Arriendo de la bodega', D.arriendo.m2 * D.arriendo.pm2 * 12, fmt(D.arriendo.m2, 0) + ' m² × ' + cop(D.arriendo.pm2) + ' por m² al mes × 12', D.arriendo.tag, D.arriendo.f);
    // 3. energía
    const en = energia(mo);
    push('ene', 'Energía eléctrica', en.kwh * D.energia.tarifa, fmt(en.kwh, 0) + ' kWh al año × ' + cop(D.energia.tarifa) + ' por kWh (detalle abajo)', D.energia.tag, D.energia.f);
    // 4. depreciación
    const dp = depreciacion();
    push('dep', 'Depreciación de máquinas y equipo', dp.anual, 'Línea recta: ' + cop(dp.valor) + ' de máquinas y equipo de planta, a ' + dp.txt, 'fuente', D.depreciacion.f);
    // 5. mantenimiento
    push('man', 'Mantenimiento de máquinas', dp.valorMaq * D.mantenimiento.pct, Math.round(D.mantenimiento.pct * 100) + ' % al año del valor de las máquinas (' + cop(dp.valorMaq) + ')', D.mantenimiento.tag, D.mantenimiento.f);
    // 6. insumos
    const ins = insumos();
    push('ins', 'Insumos que no quedan en el mueble', ins.anual, 'Lijas, discos, fresas, filtros, cinta, empaque (detalle abajo) × ' + nJ + ' juegos', 'estimado', 'Consumos estimados; precios de catálogo');
    // 7. personal: dotación, protección y exámenes
    const pers = personal(mo);
    push('per', 'Dotación, protección personal y exámenes', pers.anual, pers.calc, 'estimado', 'Art. 230 CST; GTC 45 (Nota 2, ítem 14)');
    // 8. servicios y administración
    D.fijos.forEach((x) => push(x.k, x.t, x.mes * 12, cop(x.mes) + ' al mes × 12' + (x.d ? ' · ' + x.d : ''), x.tag, x.f));
    const anual = out.reduce((a, x) => a + x.anual, 0), hMOD = mo.hJ * nJ;
    return { rows: out, anual, hMOD, tasa: anual / hMOD, energia: en, dep: dp, ins, pers };
  }

  function energia(mo) {
    const D = N3.cif.energia, nJ = J();
    const est = {}; Object.values(mo.mue).forEach((m) => Object.keys(m.est).forEach((e) => { est[e] = (est[e] || 0) + m.est[e]; }));
    const rows = D.cargas.map((c) => {
      const h = c.hFijas === 'jornada' ? mo.R.horas : c.hFijas != null ? c.hFijas : (c.est || []).reduce((a, e) => a + (est[e] || 0), 0) * c.uso * nJ;
      return Object.assign({}, c, { h, kwh: c.kw * h });
    });
    return { rows, kwh: rows.reduce((a, r) => a + r.kwh, 0) };
  }
  function depreciacion() {
    const D = N3.cif.depreciacion;
    const rows = N2.maquinas.map((m) => {
      const ov = D.precios[m.t] || null, p = ov ? ov.p : m.p, vida = D.vidas[D.clase[m.t] || 'maq'];
      return { t: m.t, m: ov ? ov.m : m.m, n: m.n, p, valor: p * m.n, vida, anual: p * m.n / vida, clase: D.clase[m.t] || 'maq', ov };
    }).concat(D.extra.map((x) => ({ t: x.t, m: x.m, n: 1, p: x.p, valor: x.p, vida: D.vidas[x.clase], anual: x.p / D.vidas[x.clase], clase: x.clase, tag: x.tag })));
    const valor = rows.reduce((a, r) => a + r.valor, 0), valorMaq = rows.filter((r) => r.clase === 'maq' || r.clase === 'herr').reduce((a, r) => a + r.valor, 0);
    const vs = Object.keys(D.vidas).map((k) => D.nombres[k] + ' ' + D.vidas[k] + ' años');
    return { rows, valor, valorMaq, anual: rows.reduce((a, r) => a + r.anual, 0), txt: vs.join(', ') };
  }
  function insumos() {
    const nJ = J();
    const rows = N3.cif.insumos.map((x) => { const uJ = x.porJuego / (x.conv || 1); return Object.assign({}, x, { uJ, uV: Math.ceil(uJ * nJ - 1e-9), pu: sinIva(x) }); });
    rows.forEach((r) => { r.anual = r.uV * r.pu; });
    return { rows, anual: rows.reduce((a, r) => a + r.anual, 0) };
  }
  function personal(mo) {
    const D = N3.cif.personal, n = mo.per.length;
    const rows = D.map((x) => { const q = x.porPersona * n; return Object.assign({}, x, { q, anual: q * sinIva(x) }); });
    return { rows, anual: rows.reduce((a, r) => a + r.anual, 0), calc: rows.map((r) => r.t.toLowerCase()).join(', ') + ' para ' + n + ' personas (detalle abajo)' };
  }

  /* ------------------------------------------------ hoja de costos */
  function todo() {
    if (cache) return cache;
    const rows = compras(), M = mp(rows), mo = manoObra(), ci = indirectos(mo, rows), nJ = J();
    const hojas = {};
    let mpJ = 0, moJ = 0, ciJ = 0;
    FAB().forEach((n) => {
      const m = M[n].total, o = mo.mue[n].c, i = mo.mue[n].h * ci.tasa;
      hojas[n] = { mp: m, mo: o, ci: i, total: m + o + i, h: mo.mue[n].h, mpRows: M[n].rows };
      mpJ += m; moJ += o; ciJ += i;
    });
    const juego = { mp: mpJ, mo: moJ, ci: ciJ, total: mpJ + moJ + ciJ };
    const volumen = { mp: mpJ * nJ, mo: moJ * nJ, ci: ciJ * nJ, total: juego.total * nJ };
    const equipo = N3.equipo.reduce((a, e) => a + e.q * C.pu(e.k), 0);
    cache = { rows, mp: M, mo, ci, hojas, juego, volumen, equipo, nJ };
    return cache;
  }
  C.todo = todo;
  C.horas = horas;

  /* sensibilidad: el costo de un juego si la planta hace otro volumen en el mismo año
     (la nómina y los indirectos fijos no cambian; los materiales, la energía de máquinas y los insumos sí) */
  C.conVolumen = function (juegos) {
    const t = todo(), nJ = t.nJ;
    const varCI = t.ci.rows.filter((r) => r.k === 'ins').reduce((a, r) => a + r.anual, 0) + t.ci.energia.rows.filter((r) => r.hFijas == null).reduce((a, r) => a + r.kwh, 0) * N3.cif.energia.tarifa;
    const fijoCI = t.ci.anual - varCI - t.ci.rows.find((r) => r.k === 'moi').anual;
    const cap = t.mo.nomina;                            // la misma nómina
    const mpJ = t.juego.mp, vJ = varCI / nJ;
    const total = mpJ + (cap + fijoCI) / juegos + vJ;
    return { juegos, mp: mpJ, conv: (cap + fijoCI) / juegos + vJ, total };
  };

  function fmt(v, d) { return (d == null ? v.toFixed(2) : v.toFixed(d)).replace('.', ','); }
  function cop(n) { return '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  C.fmt = fmt; C.cop = cop;
})();
