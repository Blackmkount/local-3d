#!/usr/bin/env node
/* ============================================================================
   Exporta el local de la versión B (Galería) para Unreal Engine:
     unreal/galeria.glb    modelo con marcadores (luces LED, focos, cámaras, inicio del recorrido, fichas)
     unreal/muebles.json   nombre y medidas de cada elemento (textos del recorrido)
   Uso (con el sitio servido en http://localhost:8765, p. ej. python3 -m http.server 8765):
     NODE_PATH=… CHROMIUM=… node tools/unreal-export.js [carpeta de salida]
   El exportador glTF de three.js se toma de node_modules/three si está, para no depender de la red.
   ========================================================================== */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'unreal'));
const BASE = process.env.BASE || 'http://localhost:8765';
let NM = null;
for (const d of (process.env.NODE_PATH || '').split(path.delimiter).concat([path.join(__dirname, '..', 'node_modules')])) {
  if (d && fs.existsSync(path.join(d, 'three', 'build', 'three.min.js'))) { NM = path.join(d, 'three') + '/'; break; }   // si no está, se usa el CDN
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
  if (NM) await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)$/, (r) => {
    const f = NM + /three@0\.160\.0\/(.*)$/.exec(r.request().url())[1].split('?')[0];
    if (fs.existsSync(f)) r.fulfill({ body: fs.readFileSync(f), contentType: 'application/javascript' }); else r.continue();
  });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());   // sin red hacia las fuentes, la página igual carga
  await p.goto(BASE + '/index.html?t=' + Date.now() + '#b', { waitUntil: 'load', timeout: 240000 });
  await p.waitForFunction(() => document.querySelector('#app.is-ready') && window.L3D && L3D.api, null, { timeout: 240000 });
  await p.evaluate(() => { if (L3D.vida && L3D.vida.setOn) L3D.vida.setOn(false); });
  await p.waitForTimeout(3000);
  const n = await p.evaluate(async () => {
    const V = L3D.api.VIEWS, cams = ['fachada', 'interior'].map((k) => Object.assign({ name: k }, V[k]));
    const buf = await L3D.exporter.glb({ unreal: true, lights: false, cams });
    const u8 = new Uint8Array(buf); window.__chunks = [];
    for (let i = 0; i < u8.length; i += 1 << 20) {
      let t = ''; const sub = u8.subarray(i, i + (1 << 20));
      for (let j = 0; j < sub.length; j += 8192) t += String.fromCharCode.apply(null, sub.subarray(j, j + 8192));
      window.__chunks.push(btoa(t));
    }
    return window.__chunks.length;
  });
  const parts = [];
  for (let i = 0; i < n; i++) parts.push(Buffer.from(await p.evaluate((k) => window.__chunks[k], i), 'base64'));
  const glb = Buffer.concat(parts);
  fs.writeFileSync(path.join(OUT, 'galeria.glb'), glb);
  const info = await p.evaluate(() => L3D.exporter.lastInfo);
  fs.writeFileSync(path.join(OUT, 'muebles.json'), JSON.stringify(info, null, 1));
  console.log('galeria.glb', (glb.length / 1048576).toFixed(1) + ' MB ·', info.length, 'elementos →', OUT);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
