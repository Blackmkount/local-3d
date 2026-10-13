/* ============================================================================
   ÍCONOS — genera el favicon y los íconos de la app a partir del logotipo.
   Uso: npm run icons   (usa el Chromium de Playwright; no necesita servidor)

   assets/icons/favicon.svg        la «B» de BlackForge (primer trazo de
                                   js/brand.js) en #f5f5f7 sobre un cuadrado
                                   redondeado #1c1c1e, con un punto ámbar
   assets/icons/favicon-32.png     pestaña del navegador
   assets/icons/apple-touch-icon.png   180 px, cuadrado lleno (iOS lo redondea)
   assets/icons/icon-192.png, icon-512.png       manifest.webmanifest
   assets/icons/icon-maskable-512.png            con 20 % de margen seguro
   Si cambia el logotipo, basta con volver a correr este archivo.
   ========================================================================== */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = ROOT + 'assets/icons/';
const FONDO = '#1c1c1e', LETRA = '#f5f5f7', ACENTO = '#ff9f0a';

/* el primer trazo de js/brand.js es la «B» */
const ctx = vm.createContext({ window: {}, document: { readyState: 'complete', querySelectorAll: () => [] } });
vm.runInContext(readFileSync(ROOT + 'js/brand.js', 'utf8'), ctx);
const B = ctx.window.L3D.brand.paths[0];

/* la composición en un lienzo de 64 × 64: «B» de 36 de alto y el punto sobre la línea de base.
   k < 1 la achica alrededor del centro (ícono enmascarable); round: esquinas redondeadas */
function svg({ k = 1, round = true }, box) {
  const H = 36 * k, s = H / box.height, r = 4.6 * k, gap = 2.2 * k;
  const w = box.width * s, total = w + gap + 2 * r;
  const x0 = (64 - total) / 2, y0 = (64 - H) / 2;
  const tx = (x0 - box.x * s).toFixed(3), ty = (y0 - box.y * s).toFixed(3);
  const cx = (x0 + w + gap + r).toFixed(2), cy = (y0 + H - r).toFixed(2);
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<rect width="64" height="64"' + (round ? ' rx="14"' : '') + ' fill="' + FONDO + '"/>' +
    '<path fill="' + LETRA + '" transform="translate(' + tx + ' ' + ty + ') scale(' + s.toFixed(5) + ')" d="' + B + '"/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(2) + '" fill="' + ACENTO + '"/></svg>\n';
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setContent('<svg xmlns="http://www.w3.org/2000/svg"><path id="b" d="' + B + '"/></svg>');
const box = await page.evaluate(() => { const b = document.getElementById('b').getBBox(); return { x: b.x, y: b.y, width: b.width, height: b.height }; });

mkdirSync(OUT, { recursive: true });
const fav = svg({}, box);
writeFileSync(OUT + 'favicon.svg', fav);

const pngs = [
  ['favicon-32.png', 32, fav],
  ['apple-touch-icon.png', 180, svg({ round: false }, box)],
  ['icon-192.png', 192, fav],
  ['icon-512.png', 512, fav],
  // zona segura de un ícono enmascarable: el círculo del 80 % central; el dibujo queda dentro del 60 %
  ['icon-maskable-512.png', 512, svg({ k: 0.72, round: false }, box)]
];
for (const [name, size, s] of pngs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent('<html><body style="margin:0;background:transparent">' + s.replace('<svg ', '<svg width="' + size + '" height="' + size + '" style="display:block" ') + '</body></html>');
  await page.screenshot({ path: OUT + name, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('assets/icons/' + name, size + '×' + size);
}
await browser.close();
console.log('assets/icons/favicon.svg', fav.length, 'bytes');
