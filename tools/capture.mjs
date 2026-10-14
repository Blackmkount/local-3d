/* ============================================================================
   CAPTURAS — la imagen para redes sociales y las fotos del README, tomadas
   del propio sitio con Chromium (Playwright).

   Uso (con el sitio servido: npm start en otra terminal):
     npm run og                         todo: imagen para redes + docs/img/*.png
     npm run og -- --solo og            solo assets/og/blackforge-og.jpg
     npm run og -- --solo docs          solo las capturas del README
     npm run og -- --base http://localhost:4173/   otro servidor
     npm run og -- --gif                además graba docs/img/demo.gif (necesita ffmpeg)

   assets/og/blackforge-og.jpg   1200 × 630, JPEG calidad 80, vista Entrada sin
                                 interfaz (?clean); debe pesar menos de 200 KB
   docs/img/<estado>.png         1400 × 900 (movil.png: 390 × 844), con la interfaz

   Las capturas que dependen de algo que todavía no existe en la página (la
   ayuda…) se saltan y se avisa al final.
   ========================================================================== */
import { chromium } from '@playwright/test';
import { mkdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('base', 'http://localhost:8000/').replace(/\/?$/, '/');
const SOLO = opt('solo', 'todo');
const GIF = args.includes('--gif');
const ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'];
const saltadas = [];

/* sin internet también: three.js y la letra Inter salen de node_modules si la página aún los pide afuera */
async function reroute(ctx) {
  const three = path.join(ROOT, 'node_modules/three'), inter = path.join(ROOT, 'node_modules/@fontsource/inter/files');
  await ctx.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', (r) => {
    const f = path.join(three, new URL(r.request().url()).pathname.split('/three@0.160.0/')[1] || '');
    return existsSync(f) ? r.fulfill({ path: f }) : r.continue();
  });
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ contentType: 'text/css', body: [400, 500, 600, 700].map((w) => `@font-face{font-family:'Inter';font-weight:${w};src:url(https://fonts.gstatic.com/bf/inter-latin-${w}-normal.woff2) format('woff2')}`).join('\n') }));
  await ctx.route('https://fonts.gstatic.com/**', (r) => {
    const f = path.join(inter, path.basename(new URL(r.request().url()).pathname));
    return existsSync(f) ? r.fulfill({ path: f, contentType: 'font/woff2', headers: { 'Access-Control-Allow-Origin': '*' } }) : r.continue();
  });
}

async function pagina(browser, viewport, extra = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: 'es-CO', ...extra });
  await reroute(ctx);
  await ctx.addInitScript(() => { try { localStorage.setItem('bf:pref:welcomed', 'true'); } catch (err) { /* sin almacenamiento */ } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn('  [error en la página]', e.message));
  return page;
}

/* espera el «listo» del local (bfReady); sin él, a que se quite la pantalla de inicio y termine el vuelo */
async function listo(page, ruta) {
  await page.goto(BASE + ruta, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.bfReady === '1' ||
    (!!document.querySelector('#app.is-ready') && !!(window.L3D && window.L3D.api) && !window.L3D.api.current), null, { timeout: 180_000 });
  await page.waitForTimeout(4500);
}
const api = (page, code) => page.evaluate(`(() => { const A = window.L3D.api, L = window.L3D; ${code} })()`);
/* el refinamiento progresivo necesita unos segundos con la cámara quieta */
const quieto = (page, s = 6) => page.waitForTimeout(s * 1000);
async function cerrarTodo(page) {
  for (let i = 0; i < 5; i++) {
    const abierto = await page.evaluate(() => ['#spot', '#modal', '#mont', '#panel', '#gl-pop'].some((s) => { const el = document.querySelector(s); return el && !el.hidden; }));
    if (!abierto) break;
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  }
}

/* ------------------------------------------------------------ imagen para redes */
async function og(browser) {
  const page = await pagina(browser, { width: 1200, height: 630 });
  await listo(page, '?clean');
  // si la página todavía no entiende ?clean, se esconde la interfaz aquí
  await page.addStyleTag({ content: '#app:not(.is-clean) :is(#top,#dock,#zoom,#inv,#toasts,#hint,#labels,#tip,#panel,#mont,#mode-chip){display:none!important}' });
  await api(page, "A.goView('fachada');");
  await page.waitForTimeout(3500); await quieto(page, 8);
  const out = path.join(ROOT, 'assets/og/blackforge-og.jpg');
  mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, type: 'jpeg', quality: 80 });
  const kb = Math.round(statSync(out).size / 1024);
  console.log('assets/og/blackforge-og.jpg  1200×630 · ' + kb + ' KB' + (kb >= 200 ? '  ¡pesa demasiado! (máximo 200 KB)' : ''));
  await page.context().close();
}

/* ------------------------------------------------------------ capturas del README */
const ESTADOS = [
  ['entrada', "A.goView('fachada');", 4],
  ['ficha', 'A.select(7);', 3],
  ['separar', 'A.select(10); A.setExplode(true);', 3],
  ['armar', 'A.select(7); A.playAsm();', 4],
  ['presupuesto', 'A.openBudget();', 1.5],
  ['montaje', 'A.openMontaje();', 7],
  ['experto', "L.prefs.set('mode', 'experto'); A.select(7); A.setTab && A.setTab('mats');", 3]
];

async function docs(browser) {
  mkdirSync(path.join(ROOT, 'docs/img'), { recursive: true });
  const page = await pagina(browser, { width: 1400, height: 900 });
  await listo(page, '');
  for (const [nombre, code, espera] of ESTADOS) {
    await cerrarTodo(page);
    const r = await api(page, code);
    if (r === 'falta') { saltadas.push(nombre); continue; }
    if (r === 'gl') {     // la palabra subrayada de la ficha abre su definición
      const gl = page.locator('#panel .gl').first();
      if (!(await gl.count())) { saltadas.push(nombre); continue; }
      await gl.click();
    }
    await page.waitForTimeout(espera * 1000);
    await page.screenshot({ path: path.join(ROOT, 'docs/img', nombre + '.png') });
    console.log('docs/img/' + nombre + '.png');
  }
  await page.context().close();

  const tel = await pagina(browser, { width: 390, height: 844 }, { isMobile: true, hasTouch: true });
  await listo(tel, '');
  await api(tel, 'A.select(7);');
  await tel.waitForTimeout(4000);
  await tel.screenshot({ path: path.join(ROOT, 'docs/img/movil.png') });
  console.log('docs/img/movil.png');
  await tel.context().close();
}

/* ------------------------------------------------------------ GIF (opcional) */
async function gif(browser) {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (err) { saltadas.push('demo.gif (no hay ffmpeg)'); return; }
  const dir = path.join(ROOT, 'docs/img/.video');
  rmSync(dir, { recursive: true, force: true });
  const page = await pagina(browser, { width: 1200, height: 675 }, { recordVideo: { dir, size: { width: 1200, height: 675 } } });
  await listo(page, '?lite');
  await api(page, "A.goView('interior');"); await page.waitForTimeout(2500);
  await api(page, 'A.select(7);'); await page.waitForTimeout(2500);
  await api(page, 'A.setExplode(true);'); await page.waitForTimeout(2500);
  await api(page, 'A.playAsm();'); await page.waitForTimeout(3000);
  const video = await page.video().path();
  await page.context().close();
  const out = path.join(ROOT, 'docs/img/demo.gif');
  execFileSync('ffmpeg', ['-y', '-ss', '6', '-t', '10', '-i', video, '-vf', 'fps=12,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse', out], { stdio: 'ignore' });
  rmSync(dir, { recursive: true, force: true });
  console.log('docs/img/demo.gif · ' + Math.round(statSync(out).size / 1024) + ' KB');
}

try { await fetch(BASE); } catch (err) {
  console.error('No hay servidor en ' + BASE + '. Arráncalo con «npm start» (puerto 8000) o pasa --base <dirección>.');
  process.exit(1);
}
const browser = await chromium.launch({ args: ARGS });
try {
  if (SOLO === 'todo' || SOLO === 'og') await og(browser);
  if (SOLO === 'todo' || SOLO === 'docs') await docs(browser);
  if (GIF) await gif(browser);
} finally {
  await browser.close();
}
if (saltadas.length) console.log('\nSaltadas (la página aún no tiene esa parte): ' + saltadas.join(', '));
