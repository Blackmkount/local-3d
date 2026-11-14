#!/usr/bin/env node
/* Una sola fuente de medidas: el modelo 3D.
     node tools/medidas.js            comprueba que la tabla de piezas (js/versions.js) coincide con el modelo
     node tools/medidas.js --write    vuelca en js/versions.js las medidas de corte que salen del modelo
   Opciones: --vers=B (versiones que se comprueban o se vuelcan; por defecto B)   --base=http://localhost:8765
   Las filas que no son geometría del modelo (cantos) se conservan como están.
   Necesita un servidor estático en la raíz del repositorio y playwright. Sale con código 1 si hay diferencias. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const opt = {}; process.argv.slice(2).forEach((a) => { const m = /^--([a-z]+)(?:=(.*))?$/.exec(a); if (m) opt[m[1]] = m[2] === undefined ? true : m[2]; });
const BASE = opt.base || 'http://localhost:8765', VERS = (opt.vers || 'B').split(''), FILE = path.resolve(__dirname, '..', 'js', 'versions.js');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const page = await browser.newPage();
  const three = [path.resolve(__dirname, '..', 'node_modules/three/build/three.min.js'), '/home/claude/work/node_modules/three/build/three.min.js'].find((f) => fs.existsSync(f));
  if (three) { const buf = fs.readFileSync(three); await page.route('**/three.min.js', (r) => r.fulfill({ body: buf, contentType: 'application/javascript' })); }
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(BASE + '/index.html?t=' + Date.now(), { waitUntil: 'load', timeout: 240000 });
  await page.waitForFunction(() => document.querySelector('#app.is-ready') && window.L3D && L3D.dwg && L3D.dwg.check, null, { timeout: 240000 });
  let bad = 0, src = fs.readFileSync(FILE, 'utf8');
  for (const v of VERS) {
    if (opt.write) {
      const rows = await page.evaluate((v) => { const o = {}, P = L3D.versions.precios; Object.keys(L3D.versions.items[v]).forEach((n) => { const m = L3D.dwg.cutRows(v, +n), inM = new Set(m.map((r) => r[0])); o[n] = m.concat(L3D.versions.items[v][n].piezas.filter((r) => !inM.has(r[0]) && (/^canto/.test(r[0]) || !/^(lamina|m2|barra|m)$/.test(P[r[0]].tipo)))); }); return o; }, v);
      const a = src.indexOf('\n    ' + v + ': {'), b = src.indexOf('\n    },', a);
      let blk = src.slice(a, b);
      Object.keys(rows).forEach((n) => {
        const i = blk.indexOf('\n      ' + n + ': {'), j = blk.indexOf('piezas: [', i), k = blk.indexOf(']],', j);
        if (i < 0 || j < 0 || k < 0) throw new Error('no encuentro las piezas del mueble ' + n + ' en la versión ' + v);
        const lit = rows[n].map((r) => '[' + r.map((x) => (typeof x === 'string' ? "'" + x.replace(/'/g, "\\'") + "'" : String(x))).join(', ') + ']').join(', ');
        blk = blk.slice(0, j) + 'piezas: [' + lit + blk.slice(k + 1);
      });
      src = src.slice(0, a) + blk + src.slice(b);
      console.log('versión ' + v + ': tabla de piezas escrita desde el modelo (' + Object.keys(rows).length + ' muebles)');
    } else {
      const d = await page.evaluate((v) => L3D.dwg.check(v), v);
      bad += d.length;
      console.log('versión ' + v + ': ' + (d.length ? d.length + ' diferencias' : 'la tabla de piezas coincide con el modelo'));
      d.forEach((x) => console.log('  mueble ' + x.n + ' · ' + x.donde + ' · ' + x.fila));
    }
  }
  if (opt.write) fs.writeFileSync(FILE, src);
  await browser.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
