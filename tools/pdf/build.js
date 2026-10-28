#!/usr/bin/env node
/* Genera los PDF de la entrega desde el visor, en un Chromium sin cabeza.
     node tools/pdf/build.js 1 2 3 4 5 6            todos (o los que se indiquen) → entrega/*.pdf
   Opciones:  --base=http://localhost:8765   --out=entrega   --vers=B   (solo esa versión en los documentos 3 y 6)
              --ms=25000  (tiempo máximo por render)   --fast  (renders rápidos, para probar)
   Necesita: npm i playwright (Chromium con WebGL por software) y python3 con pypdf.
   Cada documento se imprime dos veces: la primera da la página de cada sección (destinos con nombre
   del PDF), la segunda lleva el índice con páginas; luego se superpone la capa con cabeceras y pies. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const opt = {}; const nums = [];
args.forEach((a) => { const m = /^--([a-z]+)(?:=(.*))?$/.exec(a); if (m) opt[m[1]] = m[2] === undefined ? true : m[2]; else nums.push(+a); });
const BASE = opt.base || 'http://localhost:8765', OUT = path.resolve(opt.out || 'entrega'), ROOT = path.resolve(__dirname, '..', '..');
const POST = path.join(__dirname, 'post.py');
const DOCS = nums.length ? nums : [1, 2, 3, 4, 5, 6];
const TMP = path.join(OUT, '.tmp');
fs.mkdirSync(TMP, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const threeLocal = path.join(ROOT, 'node_modules', 'three', 'build', 'three.min.js'), threeWork = '/home/claude/work/node_modules/three/build/three.min.js';
  const three = fs.existsSync(threeLocal) ? threeLocal : fs.existsSync(threeWork) ? threeWork : null;
  if (three) { const buf = fs.readFileSync(three); await page.route('**/three.min.js', (r) => r.fulfill({ body: buf, contentType: 'application/javascript' })); }
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/net::ERR|three\.min/.test(m.text())) errs.push(m.text()); });
  await page.goto(BASE + '/index.html', { waitUntil: 'load', timeout: 240000 });
  await page.waitForFunction(() => document.querySelector('#app.is-ready') && window.L3D && L3D.api && L3D.n1, null, { timeout: 240000 });
  await page.addStyleTag({ url: BASE + '/css/entrega.css?t=' + Date.now() });
  await page.addScriptTag({ url: BASE + '/js/entrega.js?t=' + Date.now() });
  await page.evaluate(() => { L3D.engine.dprMax = 1; if (L3D.vida && L3D.vida.setOn) L3D.vida.setOn(false); });
  log('visor listo');

  const run = (cmd) => JSON.parse(execFileSync('python3', [POST].concat(cmd), { encoding: 'utf8', maxBuffer: 1 << 26 }));

  for (const num of DOCS) {
    const t0 = Date.now();
    const docOpt = {};
    if (opt.vers) docOpt.vers = opt.vers.split('');
    if (num === 6) {
      // renders: cada mueble y una vista general, versión por versión
      const vers = docOpt.vers || ['B', 'A', 'C'];
      docOpt.general = {};
      for (const v of vers) {
        log('renders de la versión', v);
        await page.evaluate(async ({ v, ms }) => { await L3D.n1.capture({ ver: v, ms, keep: true, q: 0.9 }); }, { v, ms: opt.fast ? 3000 : +(opt.ms || 25000) });
        docOpt.general[v] = await page.evaluate(({ v, ms }) => new Promise((res) => {
          const E = L3D.engine, T = THREE, api = L3D.api;
          if (api.state.ver !== v) api.setVersion(v, { quiet: true });
          document.body.classList.add('n1-capturing'); E.setViewOffset(0, 0, true);
          E.flyTo({ target: new T.Vector3(0.1, 1.0, 0.2), theta: Math.PI + 0.42, phi: 1.22, radius: 7.4 }, 0);
          E.shadowDirty = true; E.invalidate(6);
          let n = 0; const t0 = performance.now();
          E.capture = (pn, max, on) => {
            n++;
            if (E.busy && performance.now() - t0 < ms - 1000) { E.invalidate(2); return; }
            if (n >= 3 && (!on || pn >= max - 1 || performance.now() - t0 > ms)) { E.capture = null; document.body.classList.remove('n1-capturing'); res(E.renderer.domElement.toDataURL('image/jpeg', 0.9)); } else E.invalidate(2);
          };
        }), { v, ms: opt.fast ? 3000 : +(opt.ms || 25000) });
        log('  listo', v, Math.round((Date.now() - t0) / 1000) + ' s');
      }
    }
    const info = await page.evaluate((a) => L3D.entrega.mount(a.num, a.opt), { num, opt: docOpt });
    const doc = info.doc;
    log('documento', num, doc.t, '· láminas A3:', info.pages);
    await page.emulateMedia({ media: 'print' });
    const pdfOpt = { preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false, timeout: 0 };
    const p1 = path.join(TMP, 'd' + num + '-1.pdf');
    await page.pdf(Object.assign({ path: p1 }, pdfOpt));
    const d = run(['dests', p1]);
    // índice con páginas y segunda pasada
    await page.evaluate((map) => L3D.entrega.setPages(map), d.ids);
    const p2 = path.join(TMP, 'd' + num + '-2.pdf');
    await page.pdf(Object.assign({ path: p2 }, pdfOpt));
    const d2 = run(['dests', p2]);
    const N = d2.sizes.length;
    // secciones por página (para la cabecera) y marcadores
    const secs = await page.evaluate(() => Array.from(document.querySelectorAll('#entrega .en-sec, #entrega .en-toc')).map((s) => ({ id: s.id, t: s.dataset.title || 'Contenido' })));
    const subs = await page.evaluate(() => Array.from(document.querySelectorAll('#entrega .en-toc li.is-sub a')).map((a) => ({ id: a.getAttribute('href').slice(1), t: a.querySelector('.en-tt').textContent })));
    const starts = secs.map((s) => ({ t: s.t, p: d2.ids[s.id] || 0 })).filter((s) => s.p).sort((a, b) => a.p - b.p);
    const secAt = (p) => { let t = ''; starts.forEach((s) => { if (s.p <= p) t = s.t; }); return t; };
    const outline = [];
    secs.forEach((s) => { const p = d2.ids[s.id]; if (p) outline.push([s.t, p, 0]); subs.forEach((u) => { if (u.id.startsWith(s.id + '-') && d2.ids[u.id] && !outline.some((o) => o[1] === d2.ids[u.id] && o[2] === 1 && o[0] === u.t)) outline.push([u.t, d2.ids[u.id], 1]); }); });
    // capa con cabeceras y pies: una página del mismo tamaño por cada página del contenido
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const sizesKey = {}; d2.sizes.forEach((s) => { sizesKey[s[0].toFixed(1) + 'x' + s[1].toFixed(1)] = s; });
    let css = 'body{margin:0;font-family:Inter,"Helvetica Neue",Arial,sans-serif;color:#6e6e73;font-size:8.4px;-webkit-print-color-adjust:exact}.pg{position:relative;overflow:hidden;break-after:page}.pg:last-child{break-after:auto}.h,.f{position:absolute;left:14mm;right:14mm;display:flex;justify-content:space-between;gap:10mm;white-space:nowrap}.h{top:7mm;border-bottom:.4px solid #d8d7d3;padding-bottom:1.6mm}.f{bottom:7mm}.a3 .h{display:none}.a3 .f{left:10mm;right:10mm;bottom:3.2mm}.land .h,.land .f{left:13mm;right:13mm}.land .f{bottom:5.5mm}.land .h{top:5mm}b{color:#1d1d1f;font-weight:600}.t{overflow:hidden;text-overflow:ellipsis}';
    Object.keys(sizesKey).forEach((k, i) => { css += '@page p' + i + '{size:' + sizesKey[k][0].toFixed(2) + 'mm ' + sizesKey[k][1].toFixed(2) + 'mm;margin:0}.s' + i + '{page:p' + i + ';width:' + sizesKey[k][0].toFixed(2) + 'mm;height:' + sizesKey[k][1].toFixed(2) + 'mm}'; });
    const keys = Object.keys(sizesKey);
    let html = '<!doctype html><html><head><meta charset="utf-8"><style>' + css + '</style></head><body>';
    d2.sizes.forEach((s, i) => {
      const p = i + 1, k = keys.indexOf(s[0].toFixed(1) + 'x' + s[1].toFixed(1)), isA3 = s[0] > 400, land = !isA3 && s[0] > s[1];
      const left = '<span class="t"><b>Documento ' + doc.num + '</b> · ' + esc(doc.t) + ' · BlackForge 3D · Nota 1</span>';
      html += '<div class="pg s' + k + (isA3 ? ' a3' : land ? ' land' : '') + '">' + (p === 1 ? '' :
        '<div class="h">' + left + '<span class="t">' + esc(secAt(p)) + '</span></div>' +
        '<div class="f">' + (isA3 ? left + '<span>' + esc(secAt(p)) + '</span>' : '<span>Diseño VIII · Producción · UPTC Duitama · 28 de octubre de 2026</span>') + '<span>Página <b>' + p + '</b> de ' + N + '</span></div>') + '</div>';
    });
    html += '</body></html>';
    const ov = await browser.newPage();
    await ov.setContent(html, { waitUntil: 'load' });
    await ov.emulateMedia({ media: 'print' });
    const p3 = path.join(TMP, 'd' + num + '-capa.pdf');
    await ov.pdf({ path: p3, preferCSSPageSize: true, printBackground: false, timeout: 0 });
    await ov.close();
    const metaPath = path.join(TMP, 'd' + num + '-meta.json');
    fs.writeFileSync(metaPath, JSON.stringify({ title: 'Documento ' + doc.num + ' · ' + doc.t + ' · BlackForge 3D · Nota 1', author: 'Grupo BlackForge 3D · Diseño VIII Producción · UPTC', subject: doc.sub, outline }));
    const out = path.join(OUT, doc.file + '.pdf');
    const r = run(['merge', p2, p3, out, metaPath]);
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => L3D.entrega.unmount());
    log('  →', path.relative(process.cwd(), out), r.pages + ' páginas', (fs.statSync(out).size / 1048576).toFixed(1) + ' MB', Math.round((Date.now() - t0) / 1000) + ' s');
  }
  if (errs.length) log('errores en la página:', errs.slice(0, 10));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
