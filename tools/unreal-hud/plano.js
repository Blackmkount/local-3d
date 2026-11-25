#!/usr/bin/env node
/* Plano del minimapa del recorrido en Unreal (hud_plano.png): el modelo visto desde arriba, cortado a 1.25 m,
   muros en blanco y muebles en línea, sobre fondo transparente.
   Uso: copiar galeria.glb junto a plano.html, servir esta carpeta en el puerto 8799 con un enlace «three» a
   node_modules/three, y correr:  NODE_PATH=… node plano.js
   Encuadre: x de -3.6 a 3.6 m, z de -4.0 a 6.8 m (en Unreal: x -360…360 cm, y -400…680 cm; MAPA en hud_recorrido.py). */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 2400 } });
  await p.goto('http://localhost:8799/plano.html');
  await p.waitForFunction(() => window.__n, null, { timeout: 240000 });
  const c = await p.$('canvas');
  await c.screenshot({ path: 'plano_raw.png', omitBackground: true });
  await b.close();
  execFileSync('python3', ['-c', `
from PIL import Image, ImageFilter
im = Image.open('plano_raw.png'); a = im.split()[3].filter(ImageFilter.MaxFilter(3))
Image.merge('RGBA', (Image.new('L', im.size, 255),) * 3 + (a,)).resize((800, 1200), Image.LANCZOS).save('hud_plano.png')`]);
  console.log('hud_plano.png');
})();
