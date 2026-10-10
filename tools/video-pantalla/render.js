/* Renderiza los cuadros del video con Chromium sin ventana y los guarda en frames/.
   Uso (desde la raíz del repositorio, con un servidor local en marcha):
     python3 -m http.server 8000
     node tools/video-pantalla/render.js http://localhost:8000/tools/video-pantalla/index.html
   Requiere Playwright (npm i playwright) y luego ffmpeg para armar el MP4 (ver README). */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const url = process.argv[2] || 'http://localhost:8000/tools/video-pantalla/index.html';
const dir = path.join(__dirname, 'frames');
(async () => {
  fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  p.on('pageerror', (e) => console.log('[error]', e.message));
  await p.goto(url + (url.includes('?') ? '&' : '?') + 'render');
  await p.waitForFunction(() => window.ready, null, { timeout: 120000 });
  await p.evaluate(() => window.ready);
  const n = await p.evaluate(() => window.N);
  for (let i = 0; i < n; i++) {
    const data = await p.evaluate((i) => window.render(i), i);
    fs.writeFileSync(path.join(dir, 'f' + String(i).padStart(4, '0') + '.png'), Buffer.from(data.split(',')[1], 'base64'));
    if (i % 30 === 0) console.log('cuadro', i, 'de', n);
  }
  await b.close();
})();
