/* ============================================================================
   NOTA 3 · PROVEEDORES Y COSTOS — lista de compras para el volumen (P),
   cotizaciones con soporte (Q), cuadro comparativo y proveedor elegido (R),
   hoja de costos de cada mueble, del juego y del volumen (numeral 7.2),
   calidad del documento y guion de la socialización (numeral 9.3).
   Se muestra en la misma vista de las notas (nota1.js), con su propio índice.
   Los cálculos están en costos.js; los datos, en nota3-data.js.
   ========================================================================== */
(function () {
  'use strict';
  const L = window.L3D;
  const N3 = L.nota3, N2 = L.nota2, VS = L.versions, CS = L.costos;
  const H = () => L.n1.h;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cop = (n) => (n < 0 ? '−' : '') + '$' + String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const nf = (v, d) => (d == null ? (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)) : v.toFixed(d)).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const mill = (n) => '$' + nf(n / 1e6, 1) + ' M';
  const V = 'B';
  const ST = { n: 2, cot: null };

  const SECS = [
    { id: 'P', t: 'Lista de compras', d: 'Lista de compras para el volumen (elemento P)', st: 'ok' },
    { id: 'Q', t: 'Cotizaciones', d: 'Cotizaciones con su soporte (elemento Q)', st: 'ok' },
    { id: 'R', t: 'Selección', d: 'Cuadro comparativo y proveedor elegido (elemento R)', st: 'ok' },
    { id: 'MO', t: 'Mano de obra', d: 'Mano de obra directa (numeral 7.2)', st: 'ok' },
    { id: 'CI', t: 'Costos indirectos', d: 'Costos indirectos y tasa de reparto (numeral 7.2)', st: 'ok' },
    { id: 'HC', t: 'Hoja de costos', d: 'Hoja de costos de cada mueble (numeral 7.2)', st: 'ok' },
    { id: 'CV', t: 'Juego y volumen', d: 'Costo del conjunto y del volumen (numeral 7.2)', st: 'ok' },
    { id: 'CD', t: 'Calidad del documento', d: 'Calidad del documento: cada dato con su fuente (criterio 5)', st: 'ok' },
    { id: 'SO', t: 'Socialización', d: 'Guion de la socialización (criterio 6)', st: 'ok' },
    { id: 'X', t: 'Lista de chequeo', d: 'Lista de chequeo de la Nota 3', st: '' }
  ];
  const ST_TXT = { ok: 'Listo', parcial: 'En avance', pendiente: 'Pendiente' };
  const FABN = () => H().FABN;
  const short = (n) => H().itemOf(V, n).short;
  const tipo = (t) => H().tipoTag(t);
  const CAT = { mp: 'Materias primas', luz: 'Iluminación', eq: 'Equipo', her: 'Herrajes y tornillería', srv: 'Servicios de compra' };
  const IVA_TXT = { inc: 'Incluido', mas: 'Más IVA', na: 'No se indica', exc: 'Excluido' };

  function head(id, extra) {
    const s = SECS.find((x) => x.id === id);
    return '<header class="n1-sh"><span class="n1-letter">' + (id === 'X' ? '✓' : id) + '</span><div><h2>' + esc(s.d) + '</h2>' + (s.st ? '<span class="n1-badge b-' + s.st + '">' + ST_TXT[s.st] + '</span>' : '') + '</div>' + (extra || '') + '</header>';
  }
  const tbl = (hd, rows, cls) => '<div class="n1-tbl"><table' + (cls ? ' class="' + cls + '"' : '') + '><thead><tr>' + hd.map((h) => '<th' + (/^\./.test(h) ? ' class="r"' : '') + '>' + esc(h.replace(/^\./, '')) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  const kpi = (arr) => '<div class="n2-kpi">' + arr.map((k) => '<div' + (k[3] ? ' class="is-key"' : '') + '><span>' + esc(k[0]) + '</span><b>' + k[1] + '</b><small>' + k[2] + '</small></div>').join('') + '</div>';
  const link = (u, t) => (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(t || 'Ver') + '</a>' : '—');
  function pickN() {
    return '<div class="n1-pick" role="group" aria-label="Mueble">' + FABN().map((k) => '<button type="button" data-n3n="' + k + '" class="' + (k === ST.n ? 'is-on' : '') + '"><b>' + k + '</b><span>' + esc(short(k)) + '</span></button>').join('') + '</div>';
  }
  const ucant = (r) => {
    const d = r.c.modo === 'rollo' || r.c.modo === 'gal' ? 2 : r.uJ % 1 ? 2 : 0;
    return nf(r.uJ, d);
  };

  /* ------------------------------------------------ P · lista de compras */
  function secP() {
    const t = CS.todo(), nJ = t.nJ, G = {};
    t.rows.forEach((r) => { (G[r.c.g] = G[r.c.g] || []).push(r); });
    const mpV = t.rows.reduce((a, r) => a + r.pv, 0), mpVi = t.rows.reduce((a, r) => a + r.pvIva, 0);
    const eqV = t.rows.filter((r) => r.c.cat === 'eq').reduce((a, r) => a + r.pv, 0);
    const rows = [];
    Object.keys(G).forEach((g) => {
      rows.push('<tr class="n3-grp"><td colspan="7">' + esc(g) + '</td></tr>');
      G[g].forEach((r) => {
        const e = CS.elegido(r.k);
        rows.push('<tr><td><b>' + esc(r.c.m) + '</b><small class="n3-sub">' + esc(r.det) + (r.aprov != null ? ' · aprovechamiento ' + Math.round(r.aprov * 100) + ' %' : '') + '</small></td><td>' + esc(r.c.uc) + '</td><td class="r mono">' + ucant(r) + '</td><td class="r mono"><b>' + nf(r.uV, r.uV % 1 ? 2 : 0) + '</b></td><td>' + esc(e.prov) + '</td><td class="r mono">' + cop(r.pu) + '</td><td class="r mono">' + cop(r.pv) + '</td></tr>');
      });
    });
    const ins = t.ci.ins;
    return head('P') +
      '<p class="n1-lead">Todo lo que compra la planta para fabricar los ' + nJ + ' juegos de 2027: materias primas, iluminación, equipo, herrajes e insumos. Las cantidades salen del despiece de la Nota 1 y de los planes de corte de la Nota 2, y se cotizan por la cantidad real del volumen, no por un mueble (guía, 7.1).</p>' +
      kpi([['Materiales y componentes', String(t.rows.length), 'referencias distintas'], ['Compras del volumen', mill(mpV), 'sin IVA · ' + mill(mpVi) + ' con IVA', true], ['Por juego', mill(mpV / nJ), 'sin IVA'], ['Equipo', Math.round(eqV / mpV * 100) + ' %', 'de las compras son las impresoras']]) +
      '<h3>Materias primas, componentes y equipo</h3>' +
      tbl(['Material', 'Unidad de compra', '.Por juego', '.Volumen (' + nJ + ' juegos)', 'Proveedor elegido', '.Precio sin IVA', '.Total sin IVA'], rows, 'n3-lista') +
      '<p class="n1-note">Tableros y perfiles se compran enteros: cada juego usa las láminas y los tramos de su plan de corte, y lo que sobra vuelve al almacén como retazo (Nota 2, ítem 12). El canto, la laca y los demás acabados se compran por el total del año, porque lo que sobra de un juego sirve para el siguiente. El precio es el del proveedor elegido en el cuadro comparativo (elemento R), sin IVA: la planta es responsable de IVA y descuenta el que paga en las compras (Estatuto Tributario, art. 485).</p>' +
      '<h3>Insumos <small>se gastan en la planta y no quedan en el mueble: van a los costos indirectos</small></h3>' +
      tbl(['Insumo', 'Presentación', '.Consumo por juego', '.Unidades del volumen', 'Proveedor', '.Precio sin IVA', '.Total sin IVA', 'Dato'], ins.rows.map((r) => '<tr><td><b>' + esc(r.t) + '</b><small class="n3-sub">' + esc(r.d) + '</small></td><td>' + esc(r.pres) + '</td><td class="r mono">' + nf(r.uJ, r.uJ % 1 ? 2 : 0) + '</td><td class="r mono">' + r.uV + '</td><td>' + link(r.u, r.prov) + '</td><td class="r mono">' + cop(r.pu) + '</td><td class="r mono">' + cop(r.anual) + '</td><td>' + tipo(r.tag) + '</td></tr>')) +
      '<p class="n1-note">Total de insumos del año: ' + cop(ins.anual) + ' sin IVA. Los consumos son estimados (cuántos discos de lija por m², cuánto filtro por tanda de laca); se ajustan con el primer juego.</p>';
  }

  /* ------------------------------------------------ Q · cotizaciones */
  function secQ() {
    const ks = Object.keys(N3.cot), byCat = {};
    ks.forEach((k) => { const c = N3.cot[k]; (byCat[c.cat] = byCat[c.cat] || []).push(k); });
    const req = { mp: 3, luz: 3, eq: 3, her: 1, srv: 1 };
    const cumple = ks.filter((k) => N3.cot[k].q.filter((q) => q.p).length >= req[N3.cot[k].cat]).length;
    const nQ = ks.reduce((a, k) => a + N3.cot[k].q.length, 0);
    const card = (k) => {
      const c = N3.cot[k], val = c.q.filter((q) => q.p).length, ok = val >= req[c.cat];
      return '<details class="n3-cot" ' + (ST.cot === k ? 'open' : '') + '><summary><b>' + esc(c.m) + '</b><span class="n3-cnt ' + (ok ? 'is-ok' : 'is-low') + '">' + val + ' de ' + req[c.cat] + '</span><small>' + esc(c.g) + ' · se compra por ' + esc(c.uc) + '</small></summary>' +
        tbl(['Proveedor', 'Ciudad', 'Referencia y presentación', '.Precio publicado', 'IVA', 'Envío a Casanare', 'Plazo', 'Mínimo', 'Contacto', 'Soporte'], c.q.map((q, i) => '<tr' + (i === c.sel ? ' class="is-sel"' : '') + '><td><b>' + esc(q.prov) + '</b>' + (i === c.sel ? ' <span class="n1-chip">Elegido</span>' : '') + '</td><td>' + esc(q.sede) + '</td><td>' + esc(q.ref) + '<small class="n3-sub">' + esc(q.pres) + (q.x && q.x !== 1 ? ' · ' + esc(q.xTxt || '') : '') + '</small></td><td class="r mono">' + (q.p ? cop(q.p) : '—') + '</td><td>' + esc(IVA_TXT[q.iva] || '—') + '</td><td>' + esc(q.envio || 'No publicado') + '</td><td>' + esc(q.plazo || 'No publicado') + '</td><td>' + esc(q.min || 'No publicado') + '</td><td>' + esc(q.contacto || '—') + '</td><td>' + link(q.u, 'Página') + '<small class="n3-sub">' + esc(q.fecha || N3.fecha) + '</small>' + tipo(q.tag) + '</td></tr>'), 'n3-q') +
        (c.q.some((q) => q.nota) ? '<ul class="n3-notes">' + c.q.filter((q) => q.nota).map((q) => '<li><b>' + esc(q.prov) + ':</b> ' + esc(q.nota) + '</li>').join('') + '</ul>' : '') + '</details>';
    };
    return head('Q') +
      '<p class="n1-lead">Una cotización real es la que el proveedor da, o el precio de su catálogo con fecha (guía, 7.1). Todas las de esta nota son precios de catálogo publicados en línea, consultados el ' + esc(N3.fecha) + ', con el enlace como soporte. Se exigen tres por materia prima, tres para la iluminación, tres para el equipo y una para herrajes y tornillería.</p>' +
      kpi([['Cotizaciones', String(nQ), 'de ' + ks.length + ' materiales y componentes', true], ['Cumplen lo exigido', cumple + ' de ' + ks.length, 'materiales con las cotizaciones pedidas'], ['Fecha de consulta', esc(N3.fecha), 'precios de catálogo'], ['Soporte', 'Enlace', 'a la página de cada producto']]) +
      Object.keys(CAT).filter((c) => byCat[c]).map((c) => '<h3>' + CAT[c] + ' <small>' + (req[c] === 1 ? 'se exige una' : 'se exigen tres por cada una') + '</small></h3><div class="n3-cots">' + byCat[c].map(card).join('') + '</div>').join('') +
      '<p class="n1-note">' + esc(N3.notaCot) + '</p>';
  }

  /* ------------------------------------------------ R · selección */
  function puntaje(k) {
    const c = N3.cot[k], CR = N3.criterios;
    const ps = c.q.map((q) => (q.p ? CS.sinIva(q) * (q.x || 1) : null)), min = Math.min.apply(null, ps.filter((p) => p != null));
    return c.q.map((q, i) => {
      if (ps[i] == null) return null;
      const s = { costo: 5 * min / ps[i] };
      CR.forEach((cr) => { if (cr.k !== 'costo') s[cr.k] = q.s && q.s[cr.k] ? q.s[cr.k][0] : 3; });
      s.total = CR.reduce((a, cr) => a + cr.peso * s[cr.k], 0) / 100;
      return s;
    });
  }
  function secR() {
    const CR = N3.criterios, ks = Object.keys(N3.cot).filter((k) => N3.cot[k].q.filter((q) => q.p).length > 1);
    const sel = Object.keys(N3.cot).map((k) => { const c = N3.cot[k], q = c.q[c.sel]; return { k, c, q }; });
    const ciudades = {}; sel.forEach((s) => { const cd = s.q.ciudad || s.q.sede; (ciudades[cd] = ciudades[cd] || []).push(s); });
    const changes = ks.filter((k) => { const p = puntaje(k), c = N3.cot[k]; let b = 0; p.forEach((x, i) => { if (x && x.total > p[b].total + 1e-9) b = i; }); return b !== c.sel; });
    return head('R') +
      '<p class="n1-lead">Para cada material se califican sus proveedores de 1 a 5 en cinco criterios con peso (guía, 7.1; ponderación de criterios, PMBOK, apéndice X4.7). El costo se califica solo: el más barato saca 5 y los demás, en proporción a su precio. Los otros cuatro los califica el grupo con la razón escrita. No se elige solo por precio.</p>' +
      '<h3>Criterios</h3>' + tbl(['Criterio', '.Peso', 'Qué se mira', 'Cómo se califica'], CR.map((c) => '<tr><td><b>' + esc(c.t) + '</b></td><td class="r mono">' + c.peso + ' %</td><td>' + esc(c.d) + '</td><td>' + esc(c.e) + '</td></tr>')) +
      '<h3>Cuadro comparativo</h3>' +
      '<div class="n3-cmp">' + ks.map((k) => {
        const c = N3.cot[k], p = puntaje(k);
        return '<div class="n3-cmpc"><h4>' + esc(c.m) + '</h4>' + tbl(['Proveedor'].concat(CR.map((x) => '.' + x.t), ['.Total']), c.q.map((q, i) => p[i] ? '<tr' + (i === c.sel ? ' class="is-sel"' : '') + '><td><b>' + esc(q.prov) + '</b>' + (i === c.sel ? ' <span class="n1-chip">Elegido</span>' : '') + '<small class="n3-sub">' + cop(CS.sinIva(q) * (q.x || 1)) + ' sin IVA por ' + esc(c.uc) + '</small></td>' + CR.map((x) => '<td class="r mono"' + (x.k !== 'costo' && q.s && q.s[x.k] ? ' title="' + esc(q.s[x.k][1]) + '"' : '') + '>' + nf(p[i][x.k], 1) + '</td>').join('') + '<td class="r mono"><b>' + nf(p[i].total, 2) + '</b></td></tr>' : '<tr><td>' + esc(q.prov) + '</td><td colspan="' + (CR.length + 1) + '">Sin precio publicado: no se califica</td></tr>'), 'n3-sc') +
          '<p class="n3-por"><b>Por qué:</b> ' + esc(c.por) + '</p></div>';
      }).join('') + '</div>' +
      (changes.length ? '<p class="n1-box">En ' + changes.length + (changes.length === 1 ? ' material' : ' materiales') + ' el elegido no es el de mayor puntaje: ' + changes.map((k) => esc(N3.cot[k].m)).join('; ') + '. La razón está en «Por qué».</p>' : '') +
      '<h3>Proveedores elegidos y ubicación de la planta</h3>' +
      tbl(['Ciudad', '.Distancia a Villanueva', 'Proveedor y lo que se le compra'], Object.keys(ciudades).sort((a, b) => (km(a) - km(b))).map((cd) => '<tr><td><b>' + esc(cd) + '</b></td><td class="r mono">' + (km(cd) != null && isFinite(km(cd)) ? nf(km(cd), 0) + ' km' : '—') + '</td><td>' + Object.entries(ciudades[cd].reduce((a, s) => { (a[s.q.prov] = a[s.q.prov] || []).push(s.c.m); return a; }, {})).map(([p, ms]) => '<b>' + esc(p) + '</b>: ' + esc(ms.join(', '))).join('<br>') + '</td></tr>')) +
      '<p class="n1-note">' + esc(N3.notaUbic) + '</p>';
  }
  function km(c) {
    if (/Villanueva/.test(c)) return 0;
    const x = N2.loc.ciudades.find((z) => c.indexOf(z.t) >= 0) || N2.loc.obra.map((o) => ({ t: o[0], km: o[1] })).find((z) => c.indexOf(z.t) >= 0);
    return x ? x.km : Infinity;
  }

  /* ------------------------------------------------ MO · mano de obra */
  function secMO() {
    const t = CS.todo(), mo = t.mo, M = N3.mo;
    const fRows = M.factor.map((f) => '<tr><td><b>' + esc(f.t) + '</b></td><td class="r mono">' + nf(f.pct, 2) + ' %</td><td>' + (f.base === 'sal' ? 'Salario' : 'Salario + auxilio de transporte') + '</td><td>' + esc(f.f) + '</td></tr>');
    const pRows = mo.per.map((p) => '<tr><td><b>' + esc(p.t) + '</b><small class="n3-sub">' + esc(p.d) + '</small></td><td class="r mono">' + cop(p.sal) + '</td><td class="r mono">' + cop(p.aux) + '</td><td class="r mono">' + cop(p.mes) + '</td><td class="r mono">' + cop(p.anual) + '</td><td class="r mono">' + nf(p.h, 0) + ' h</td><td class="r mono"><b>' + cop(p.tasa) + '</b></td></tr>');
    const nm = FABN().map((n) => { const m = mo.mue[n]; return '<tr><td><b>' + n + '</b> ' + esc(short(n)) + '</td>' + mo.per.map((p) => '<td class="r mono">' + nf(m.det[p.k] || 0, 1) + ' h</td>').join('') + '<td class="r mono">' + nf(m.h, 1) + ' h</td><td class="r mono"><b>' + cop(m.c) + '</b></td></tr>'; });
    nm.push('<tr class="n3-tot"><td><b>Juego</b></td>' + mo.per.map((p) => '<td class="r mono">' + nf(mo.hP[p.k], 1) + ' h</td>').join('') + '<td class="r mono">' + nf(mo.hJ, 1) + ' h</td><td class="r mono"><b>' + cop(mo.cJ) + '</b></td></tr>');
    return head('MO') +
      '<p class="n1-lead">Mano de obra directa = tiempos del ítem 11 × salario con prestaciones (guía, 7.2). Cada estación la hace una persona: el ebanista corta, mecaniza, curva, enchapa, arma e instala la luz; el auxiliar lija, laca y empaca. La hora de cada uno sale de lo que cuesta en el año dividido por las horas que trabaja.</p>' +
      kpi([['Horas por juego', nf(mo.hJ, 1) + ' h', 'tiempos de la Nota 2, con suplementos'], ['Costo por juego', cop(mo.cJ), 'mano de obra directa', true], ['Hora del ebanista', cop(mo.per[0].tasa), 'con prestaciones'], ['Hora del auxiliar', cop(mo.per[1].tasa), 'con prestaciones']]) +
      '<h3>Salario con prestaciones</h3>' + tbl(['Persona', '.Salario', '.Auxilio de transporte', '.Costo al mes', '.Costo al año', '.Horas trabajadas', '.Costo de la hora'], pRows) +
      '<p class="n2-formula">Costo al mes = salario + auxilio + (salario + auxilio) × ' + nf(mo.per[0].fPrest * 100, 2) + ' % + salario × ' + nf(mo.per[0].fSal * 100, 2) + ' %. Horas trabajadas = ' + nf(mo.R.horas, 0) + ' h de jornada en 2027 − ' + M.vacDias + ' días de vacaciones × ' + nf(mo.R.hDia, 1) + ' h = ' + nf(mo.hAnio, 0) + ' h (tiempo completo).</p>' +
      '<div class="n1-box"><p><b>Salarios.</b> ' + esc(M.salariosTxt) + ' ' + M.personas.map((p) => tipo(p.tag)).join(' ') + '</p><p><b>Vacaciones.</b> ' + esc(M.vacTxt) + '</p></div>' +
      '<h3>Factor prestacional <small>empresa S.A.S. exonerada de salud, SENA e ICBF (E.T., art. 114-1)</small></h3>' + tbl(['Concepto', '.Porcentaje', 'Base', 'Fuente'], fRows) +
      '<h3>Mano de obra directa de cada mueble</h3>' + tbl(['Mueble'].concat(mo.per.map((p) => '.' + p.corto), ['.Total', '.Costo']), nm) +
      '<p class="n1-note">Las horas son las del ítem 11 de la Nota 2 (datos tipo con 9 % de suplementos), sin las demoras de secado, que no ocupan a nadie. ' + esc(M.notaOciosa) + '</p>';
  }

  /* ------------------------------------------------ CI · costos indirectos */
  function secCI() {
    const t = CS.todo(), ci = t.ci, nJ = t.nJ;
    const en = ci.energia, dp = ci.dep, pe = ci.pers;
    return head('CI') +
      '<p class="n1-lead">Los costos indirectos son lo que la planta gasta en el año aunque no se pueda asignar a una pieza: arriendo, energía, depreciación, mantenimiento, supervisión e insumos. Se suman en un presupuesto anual y se reparten entre los muebles por las horas de mano de obra directa (guía, 7.2; Goetsch y Davis, 2016, cap. 21).</p>' +
      kpi([['Presupuesto anual', mill(ci.anual), 'sin IVA'], ['Horas de mano de obra directa', nf(ci.hMOD, 0) + ' h', nf(t.mo.hJ, 1) + ' h × ' + nJ + ' juegos'], ['Tasa de reparto', cop(ci.tasa) + ' por hora', 'presupuesto ÷ horas', true], ['Por juego', mill(ci.anual / nJ), 'de costos indirectos']]) +
      '<p class="n2-formula">Tasa = costos indirectos del año ÷ horas de mano de obra directa del año = ' + cop(ci.anual) + ' ÷ ' + nf(ci.hMOD, 0) + ' h = <b>' + cop(ci.tasa) + ' por hora</b></p>' +
      '<h3>Presupuesto de la planta para 2027</h3>' + tbl(['Concepto', 'Cálculo', '.Al año', '.Parte', 'Dato'], ci.rows.map((r) => '<tr><td><b>' + esc(r.t) + '</b></td><td>' + esc(r.calc) + (r.f ? '<small class="n3-sub">' + esc(r.f) + '</small>' : '') + '</td><td class="r mono">' + cop(r.anual) + '</td><td class="r mono">' + Math.round(r.anual / ci.anual * 100) + ' %</td><td>' + tipo(r.tag) + '</td></tr>').concat(['<tr class="n3-tot"><td><b>Total</b></td><td></td><td class="r mono"><b>' + cop(ci.anual) + '</b></td><td class="r mono">100 %</td><td></td></tr>'])) +
      bars(ci.rows.map((r) => [r.t, r.anual]), ci.anual) +
      '<h3>Energía <small>' + nf(en.kwh, 0) + ' kWh al año</small></h3>' + tbl(['Carga', '.Potencia', 'Cuándo trabaja', '.Horas al año', '.kWh al año'], en.rows.map((r) => '<tr><td><b>' + esc(r.t) + '</b></td><td class="r mono">' + nf(r.kw, 2) + ' kW</td><td>' + esc(r.d) + '</td><td class="r mono">' + nf(r.h, 0) + '</td><td class="r mono">' + nf(r.kwh, 0) + '</td></tr>')) +
      '<p class="n1-note">' + esc(N3.cif.energia.nota) + '</p>' +
      '<h3>Depreciación <small>línea recta, sin valor de salvamento</small></h3>' + tbl(['Máquina o equipo', 'Modelo', '.Cant.', '.Valor', '.Vida útil', '.Al año'], dp.rows.map((r) => '<tr><td><b>' + esc(r.t) + '</b></td><td>' + esc(r.m) + (r.ov ? ' ' + tipo(r.ov.tag) : r.tag ? ' ' + tipo(r.tag) : '') + '</td><td class="r mono">' + r.n + '</td><td class="r mono">' + cop(r.valor) + '</td><td class="r mono">' + r.vida + ' años</td><td class="r mono">' + cop(r.anual) + '</td></tr>').concat(['<tr class="n3-tot"><td><b>Total</b></td><td></td><td></td><td class="r mono"><b>' + cop(dp.valor) + '</b></td><td></td><td class="r mono"><b>' + cop(dp.anual) + '</b></td></tr>'])) +
      '<p class="n1-note">' + esc(N3.cif.depreciacion.nota) + '</p>' +
      '<h3>Dotación, protección personal y exámenes</h3>' + tbl(['Concepto', 'Detalle', '.Por persona al año', '.Precio sin IVA', '.Al año', 'Dato'], pe.rows.map((r) => '<tr><td><b>' + esc(r.t) + '</b></td><td>' + esc(r.d) + (r.u ? ' · ' + link(r.u, r.prov) : '') + '</td><td class="r mono">' + nf(r.porPersona, r.porPersona % 1 ? 1 : 0) + '</td><td class="r mono">' + cop(CS.sinIva(r)) + '</td><td class="r mono">' + cop(r.anual) + '</td><td>' + tipo(r.tag) + '</td></tr>')) +
      '<p class="n1-note">Los insumos están en la lista de compras (elemento P). ' + esc(N3.cif.notaFinal) + '</p>';
  }
  function bars(items, tot) {
    return '<div class="n3-bars">' + items.slice().sort((a, b) => b[1] - a[1]).map((x) => '<div><span>' + esc(x[0]) + '</span><i style="--w:' + (x[1] / tot * 100).toFixed(2) + '%"></i><b class="mono">' + Math.round(x[1] / tot * 100) + ' %</b></div>').join('') + '</div>';
  }

  /* ------------------------------------------------ HC · hoja de costos de cada mueble */
  function secHC() {
    const t = CS.todo(), n = ST.n, h = t.hojas[n], mo = t.mo.mue[n], ci = t.ci;
    const mpRows = h.mpRows.slice().sort((a, b) => b.costo - a.costo);
    const mpTxt = mpRows.slice(0, 4).map((r) => r.m.split(',')[0].toLowerCase()).join(', ') + (mpRows.length > 4 ? ' y ' + (mpRows.length - 4) + ' más' : '');
    const all = FABN().map((k) => { const x = t.hojas[k]; return '<tr' + (k === n ? ' class="is-sel"' : '') + '><td><button type="button" class="link" data-n3n="' + k + '"><b>' + k + '</b> ' + esc(short(k)) + '</button></td><td class="r mono">' + cop(x.mp) + '</td><td class="r mono">' + cop(x.mo) + '</td><td class="r mono">' + cop(x.ci) + '</td><td class="r mono"><b>' + cop(x.total) + '</b></td><td class="r mono">' + Math.round(x.total / t.juego.total * 100) + ' %</td></tr>'; });
    all.push('<tr class="n3-tot"><td><b>Juego</b></td><td class="r mono">' + cop(t.juego.mp) + '</td><td class="r mono">' + cop(t.juego.mo) + '</td><td class="r mono">' + cop(t.juego.ci) + '</td><td class="r mono"><b>' + cop(t.juego.total) + '</b></td><td class="r mono">100 %</td></tr>');
    return head('HC') +
      '<p class="n1-lead">El costo de cada mueble en sus tres componentes, con el cálculo a la vista (guía, 7.2 y anexo A). Elija el mueble.</p>' + pickN() +
      '<div class="n3-sheet"><div class="n3-sh"><span>Hoja de costos</span><b>' + n + ' · ' + esc(VS.items[V][n].name) + '</b><small>Versión B · Galería · ' + esc(VS.items[V][n].dims) + ' · precios sin IVA del ' + esc(N3.fecha) + '</small></div>' +
      tbl(['Componente', 'Cálculo', '.Costo'], [
        '<tr><td><b>Materias primas</b></td><td>' + esc(mpTxt) + ' (detalle abajo)</td><td class="r mono">' + cop(h.mp) + '</td></tr>',
        '<tr><td><b>Mano de obra directa</b></td><td>' + t.mo.per.filter((p) => mo.det[p.k]).map((p) => nf(mo.det[p.k], 1) + ' h × ' + cop(p.tasa) + ' (' + p.corto.toLowerCase() + ')').join(' + ') + '</td><td class="r mono">' + cop(h.mo) + '</td></tr>',
        '<tr><td><b>Costos indirectos</b></td><td>' + nf(h.h, 1) + ' h de mano de obra × ' + cop(ci.tasa) + ' por hora</td><td class="r mono">' + cop(h.ci) + '</td></tr>',
        '<tr class="n3-tot"><td><b>Total del mueble</b></td><td></td><td class="r mono"><b>' + cop(h.total) + '</b></td></tr>'
      ]) + '</div>' +
      '<h3>Materias primas del mueble ' + n + '</h3>' + tbl(['Material', '.Cantidad del mueble', '.Parte de la compra del juego', '.Costo'], mpRows.map((r) => '<tr><td><b>' + esc(r.m) + '</b></td><td class="r mono">' + cantTxt(r) + '</td><td class="r mono">' + nf(r.share * 100, r.share < 0.1 ? 1 : 0) + ' %</td><td class="r mono">' + cop(r.costo) + '</td></tr>')) +
      '<p class="n1-note">Los tableros se cuestan enteros: el mueble paga la parte de las láminas del juego que corresponde a su área de piezas (guía, 7.2). Con el canto, los perfiles, las tiras de luz y los acabados pasa lo mismo con lo que se compra en el año.</p>' +
      '<h3>Los doce muebles</h3>' + tbl(['Mueble', '.Materias primas', '.Mano de obra', '.Indirectos', '.Total', '.Parte del juego'], all);
  }
  function cantTxt(r) {
    const c = N3.cot[r.k];
    if (c.modo === 'lamina' || c.modo === 'm2') return nf(r.cant, 2) + ' m²';
    if (c.modo === 'barra' || c.modo === 'rollo') return nf(r.cant, 1) + ' m';
    if (c.modo === 'gal') return nf(r.cant, 2) + ' gal';
    if (c.modo === 'viaje') return nf(r.cant, 2) + ' m² de tablero';
    return nf(r.cant, r.cant % 1 ? 1 : 0) + ' ' + (r.cant === 1 ? c.ucons1 || 'unidad' : c.ucons || 'unidades');
  }

  /* ------------------------------------------------ CV · juego y volumen */
  function secCV() {
    const t = CS.todo(), nJ = t.nJ, j = t.juego, v = t.volumen;
    const ivaV = t.rows.reduce((a, r) => a + r.pvIva - r.pv, 0);
    const sinEq = j.total - t.equipo;
    const sens = N3.sensibilidad.map((n) => CS.conVolumen(n));
    const comp = [['Materias primas sin equipo', j.mp - t.equipo], ['Equipo (impresoras)', t.equipo], ['Mano de obra directa', j.mo], ['Costos indirectos', j.ci]];
    return head('CV') +
      '<p class="n1-lead">El costo del conjunto es la suma de sus doce muebles; el del volumen, ' + nJ + ' juegos. Es lo que cuesta fabricar, no el precio de venta: la empresa solo produce (guía, 1 y 7).</p>' +
      kpi([['Un juego', mill(j.total), 'doce muebles, sin IVA', true], ['Volumen', mill(v.total), nJ + ' juegos en 2027'], ['Sin el equipo', mill(sinEq), 'un juego sin las 4 impresoras'], ['IVA de las compras', mill(ivaV), 'se descuenta; no es costo']]) +
      '<h3>Composición del costo de un juego</h3>' + stack(comp, j.total) +
      tbl(['Componente', '.Un juego', '.Volumen (' + nJ + ' juegos)', '.Parte'], comp.map((c) => '<tr><td><b>' + esc(c[0]) + '</b></td><td class="r mono">' + cop(c[1]) + '</td><td class="r mono">' + cop(c[1] * nJ) + '</td><td class="r mono">' + Math.round(c[1] / j.total * 100) + ' %</td></tr>').concat(['<tr class="n3-tot"><td><b>Total</b></td><td class="r mono"><b>' + cop(j.total) + '</b></td><td class="r mono"><b>' + cop(v.total) + '</b></td><td class="r mono">100 %</td></tr>'])) +
      '<p class="n1-note">Comprobación: el costo del volumen (' + cop(v.total) + ') es igual a las compras del año (' + cop(t.rows.reduce((a, r) => a + r.pv, 0)) + ') + la nómina (' + cop(t.mo.nomina) + ') + los demás costos indirectos (' + cop(t.ci.anual - t.ci.rows.find((r) => r.k === 'moi').anual) + '), con diferencias de redondeo.</p>' +
      '<h3>Capacidad ociosa: el costo de un juego según cuántos se fabriquen</h3>' +
      tbl(['Juegos al año', '.Materias primas', '.Conversión (mano de obra + indirectos)', '.Costo de un juego', '.Frente a ' + nJ + ' juegos'], sens.map((s) => '<tr' + (s.juegos === nJ ? ' class="is-sel"' : '') + '><td><b>' + s.juegos + '</b>' + (s.juegos === nJ ? ' <span class="n1-chip">Encargo</span>' : '') + '</td><td class="r mono">' + cop(s.mp) + '</td><td class="r mono">' + cop(s.conv) + '</td><td class="r mono"><b>' + cop(s.total) + '</b></td><td class="r mono">' + (s.juegos === nJ ? '—' : nf((s.total / sens.find((x) => x.juegos === nJ).total - 1) * 100, 1) + ' %') + '</td></tr>')) +
      '<p class="n1-box">' + esc(N3.notaCapacidad) + '</p>' +
      '<h3>Lo que el diseño puede ahorrar</h3>' + tbl(['Dónde', 'Hoy', 'Cambio de diseño', '.Ahorro en el volumen', 'Estado'], N3.ahorros.map((a) => '<tr><td><b>' + esc(a.d) + '</b></td><td>' + esc(a.hoy) + '</td><td>' + esc(a.cambio) + '</td><td class="r mono">' + cop(typeof a.ahorro === 'function' ? a.ahorro(t) : a.ahorro) + '</td><td>' + esc(a.st) + '</td></tr>')) +
      '<p class="n1-note">Como pide la guía (7.2): si el grupo rediseña las piezas para que quepan en menos tableros, el ahorro sale del diseño. Los ahorros se calculan con los precios elegidos.</p>';
  }
  function stack(items, tot) {
    const cls = ['s1', 's2', 's3', 's4', 's5'];
    return '<div class="n3-stack" role="img" aria-label="Composición del costo">' + items.map((x, i) => '<i class="' + cls[i] + '" style="--w:' + (x[1] / tot * 100).toFixed(2) + '%" title="' + esc(x[0]) + '"></i>').join('') + '</div><div class="n3-leg">' + items.map((x, i) => '<span><i class="' + cls[i] + '"></i>' + esc(x[0]) + ' · ' + Math.round(x[1] / tot * 100) + ' %</span>').join('') + '</div>';
  }

  /* ------------------------------------------------ CD · calidad del documento */
  function secCD() {
    const cnt = { fuente: 0, secundaria: 0, estimado: 0, no: 0 };
    const tag = (t) => { if (cnt[t] != null) cnt[t]++; };
    Object.values(N3.cot).forEach((c) => c.q.forEach((q) => tag(q.tag)));
    N3.cif.insumos.forEach((x) => tag(x.tag)); N3.cif.personal.forEach((x) => tag(x.tag)); N3.cif.fijos.forEach((x) => tag(x.tag));
    [N3.cif.arriendo, N3.cif.energia, N3.cif.mantenimiento].forEach((x) => tag(x.tag)); N3.mo.personas.forEach((p) => tag(p.tag));
    const tot = Object.values(cnt).reduce((a, b) => a + b, 0);
    return head('CD') +
      '<p class="n1-lead">Criterio 5 de la Nota 3: cada afirmación con su soporte gráfico o su dato, cada dato con su fuente y lo estimado marcado. En esta nota cada precio lleva su enlace y su fecha, y cada dato su etiqueta.</p>' +
      kpi([['Datos etiquetados', String(tot), 'precios, salarios y supuestos de esta nota', true], ['De la fuente', String(cnt.fuente), 'página del proveedor o norma'], ['Secundarios', String(cnt.secundaria), 'portales, directorios, promedios'], ['Estimados', String(cnt.estimado), 'cálculo o supuesto del grupo']]) +
      '<h3>Qué significa cada etiqueta</h3>' + tbl(['Etiqueta', 'Cuándo se usa'], [['fuente', 'El dato se leyó en la página del proveedor, en la ficha del fabricante o en la norma.'], ['secundaria', 'Viene de un portal, un directorio, un promedio de avisos o una nota de prensa.'], ['estimado', 'Es un cálculo o un supuesto del grupo: se dice de dónde sale y cómo se valida.'], ['no', 'Se buscó y no se encontró: queda como pendiente.']].map((r) => '<tr><td>' + tipo(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>')) +
      '<h3>Supuestos que más pesan en el costo <small>y cómo se validan</small></h3>' + tbl(['Supuesto', 'Valor', 'Cómo se valida'], N3.supuestos.map((s) => '<tr><td><b>' + esc(s[0]) + '</b></td><td>' + esc(s[1]) + '</td><td>' + esc(s[2]) + '</td></tr>')) +
      '<h3>Fuentes de la Nota 3</h3><ol class="n3-refs">' + N3.fuentes.map((f) => '<li>' + esc(f.t) + (f.u ? ' ' + link(f.u, 'Enlace') : '') + '</li>').join('') + '</ol>';
  }

  /* ------------------------------------------------ SO · socialización */
  function secSO() {
    const t = CS.todo(), G = N3.guion;
    const total = G.reduce((a, b) => a + b.min, 0);
    return head('SO') +
      '<p class="n1-lead">La socialización dura de 15 a 20 minutos y recorre el trabajo completo: del local a los muebles, la empresa, el proceso, la planta y los costos, y cierra con lo que la planta le cambió al mueble (guía, 9.3). Cada integrante debe poder responder por cualquier decisión.</p>' +
      kpi([['Duración', total + ' min', 'más preguntas'], ['Bloques', String(G.length), 'cada uno con su soporte en el visor'], ['Cifra de cierre', mill(t.juego.total), 'costo de un juego'], ['Cambios al mueble', String(N3.cambiosN()), 'de la Nota 1 a la 3', true]]) +
      '<h3>Guion</h3><ol class="n3-guion">' + G.map((b, i) => '<li><div class="n3-gh"><b>' + esc(b.t) + '</b><span>' + b.min + ' min · ' + esc(b.quien) + '</span></div><p>' + esc(typeof b.dice === 'function' ? b.dice(t) : b.dice) + '</p><small>Se muestra: ' + esc(b.muestra) + '</small></li>').join('') + '</ol>' +
      '<h3>Preguntas probables</h3>' + tbl(['Pregunta', 'Respuesta corta', 'Dónde está'], N3.preguntas.map((p) => '<tr><td><b>' + esc(p[0]) + '</b></td><td>' + esc(typeof p[1] === 'function' ? p[1](t) : p[1]) + '</td><td>' + esc(p[2]) + '</td></tr>'));
  }

  /* ------------------------------------------------ X · lista de chequeo */
  function secX() {
    const CH = [['Lista de compras para todo el volumen', 'P'], ['Cotizaciones exigidas, con soporte', 'Q'], ['Cuadro comparativo y proveedor elegido', 'R'], ['Hoja de costos de cada mueble', 'HC'], ['Costo del conjunto y del volumen', 'CV']];
    const st = (s) => SECS.find((x) => x.id === s).st;
    const CR = [['Lista de compras (P)', 'Están todos los materiales, componentes e insumos, con la cantidad del volumen', 'P'], ['Cotizaciones (Q)', 'Las exigidas, reales y con soporte', 'Q'], ['Selección (R)', 'Cuadro comparativo con criterios; proveedores coherentes con la ubicación de la planta', 'R'], ['Costos (7.2)', 'Hoja de costos de cada mueble, conjunto y volumen, con el cálculo a la vista', 'HC'], ['Calidad del documento', 'Cada afirmación con su soporte gráfico o su dato, cada dato con su fuente, lo estimado marcado', 'CD'], ['Socialización', '15 a 20 minutos con el recorrido completo; cada integrante responde por cualquier decisión', 'SO']];
    return head('X') + '<ul class="n1-check">' + CH.map((c) => '<li class="c-' + st(c[1]) + '"><i></i><span>' + esc(c[0]) + '</span><button type="button" class="link" data-n1sec="' + c[1] + '">' + c[1] + ' · ' + esc(SECS.find((x) => x.id === c[1]).t) + '</button><em>' + ST_TXT[st(c[1])] + '</em></li>').join('') + '</ul>' +
      '<h3>Criterios de la Nota 3 <small>guía, 9.3</small></h3>' + tbl(['Criterio', 'Completo cuando', 'Dónde'], CR.map((c) => '<tr><td><b>' + esc(c[0]) + '</b></td><td>' + esc(c[1]) + '</td><td><button type="button" class="link" data-n1sec="' + c[2] + '">' + esc(SECS.find((x) => x.id === c[2]).t) + '</button></td></tr>')) +
      '<h3>Pendientes</h3><ul class="n1-check">' + N3.pendientes.map((q) => '<li class="c-parcial"><i></i><span>' + esc(q) + '</span></li>').join('') + '</ul>';
  }

  function render(id) {
    const f = { P: secP, Q: secQ, R: secR, MO: secMO, CI: secCI, HC: secHC, CV: secCV, CD: secCD, SO: secSO, X: secX }[id];
    return f ? f() : '';
  }
  function click(e) {
    const b = e.target.closest('[data-n3n]');
    if (b) { ST.n = +b.dataset.n3n; const body = document.getElementById('n1-body'), top = body.scrollTop; L.n1.render(); body.scrollTop = top; return true; }
    return false;
  }
  L.notaMods[3] = { titulo: 'Nota 3 · Proveedores y costos', sub: 'Lista de compras, cotizaciones, selección y hoja de costos de los 12 juegos de la versión B · entrega del 18 de noviembre', secs: SECS, render, click };
})();
