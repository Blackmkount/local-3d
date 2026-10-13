/* ============================================================================
   BASE DE LAS PRUEBAS EN EL NAVEGADOR (Playwright)

   Cada página de prueba:
   1. sirve three.js desde node_modules/three si la página lo pide a jsDelivr
      (también la copia del exportador glTF), y la letra Inter desde
      node_modules/@fontsource/inter si la pide a Google Fonts: así las pruebas
      corren sin internet, antes y después de copiar three.js a vendor/;
   2. junta los errores de la página (pageerror y console.error) y la prueba
      falla al final si hubo alguno (consoleOk: una expresión con lo que se tolera);
   3. marca la bienvenida como vista (bf:pref:welcomed), salvo en las pruebas
      con la etiqueta @first-visit.
   boot(page, ruta) abre la página y espera a que el local esté listo
   (document.documentElement.dataset.bfReady === '1').
   ========================================================================== */
import { test as base, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const THREE_DIR = path.join(ROOT, 'node_modules/three');
const INTER_DIR = path.join(ROOT, 'node_modules/@fontsource/inter/files');
const PESOS = [400, 500, 600, 700];

/* las rutas de red de la nota de arriba */
export async function reroute(target) {
  await target.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', (r) => {
    const rel = new URL(r.request().url()).pathname.split('/three@0.160.0/')[1] || '';
    const f = path.join(THREE_DIR, rel);
    return existsSync(f) ? r.fulfill({ path: f, headers: { 'Access-Control-Allow-Origin': '*' } }) : r.fulfill({ status: 404, body: '' });
  });
  await target.route('https://fonts.googleapis.com/**', (r) => r.fulfill({
    contentType: 'text/css',
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: PESOS.map((w) => `@font-face{font-family:'Inter';font-style:normal;font-weight:${w};font-display:swap;src:url(https://fonts.gstatic.com/bf/inter-latin-${w}-normal.woff2) format('woff2')}`).join('\n')
  }));
  await target.route('https://fonts.gstatic.com/**', (r) => {
    const f = path.join(INTER_DIR, path.basename(new URL(r.request().url()).pathname));
    return existsSync(f) ? r.fulfill({ path: f, contentType: 'font/woff2', headers: { 'Access-Control-Allow-Origin': '*' } }) : r.fulfill({ status: 200, contentType: 'font/woff2', body: '' });
  });
}

/* errores de la página; se devuelven en una lista que la prueba revisa al final */
export function collect(page, ok = null) {
  const errs = [];
  const tolera = (t) => !!ok && ok.test(t);
  page.on('pageerror', (e) => { const t = '[pageerror] ' + (e.stack || e.message); if (!tolera(t)) errs.push(t); });
  page.on('console', (m) => { if (m.type() === 'error') { const t = '[console.error] ' + m.text(); if (!tolera(t)) errs.push(t); } });
  return errs;
}

/* la bienvenida ya se vio: así ningún diálogo tapa lo que se prueba */
export const marcarBienvenida = () => { try { localStorage.setItem('bf:pref:welcomed', 'true'); } catch (err) { /* sin almacenamiento */ } };

/* espera el «listo» del local. Antes de que exista bfReady (núcleo sin unir), espera a que se quite la
   pantalla de inicio y a que termine el vuelo de entrada (3,75 s), como hace el núcleo con su reloj de 4,5 s */
export async function boot(page, ruta = '/?lite') {
  await page.goto(ruta, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.bfReady === '1' ||
    (!!document.querySelector('#app.is-ready') && !!(window.L3D && window.L3D.api) && !window.L3D.api.current), null, { timeout: 150_000 });
  const nucleo = await page.evaluate(() => !!(window.L3D.api && window.L3D.api.current));
  if (!nucleo) await page.waitForTimeout(4500);
  return page;
}

/* opciones de contexto del proyecto (escritorio o teléfono), para las páginas que se abren a mano en beforeAll */
export function opcionesDe(info) {
  const u = info.project.use, o = {};
  for (const k of ['viewport', 'isMobile', 'hasTouch', 'deviceScaleFactor', 'baseURL', 'locale', 'userAgent', 'colorScheme', 'reducedMotion']) if (u[k] !== undefined) o[k] = u[k];
  return o;
}

/* una página compartida por varias pruebas seguidas (test.describe.serial): un solo arranque por proyecto */
export async function abrir(browser, info, { ok = null, bienvenida = false } = {}) {
  const context = await browser.newContext(opcionesDe(info));
  await reroute(context);
  if (!bienvenida) await context.addInitScript(marcarBienvenida);
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  const errs = collect(page, ok);
  return { context, page, errs };
}

/* ¿qué partes del plan ya están en el árbol? Las pruebas que dependen de otra rama se activan solas */
export const rasgos = (page) => page.evaluate(() => {
  const L = window.L3D || {};
  return {
    nucleo: !!(L.api && L.api.current),              // WS1: rutas, eventos, L.api completo
    motor: !!(L.engine && L.engine.after),           // WS2: motor con E.after
    a11y: !!(L.ui && L.ui.trap) || !!document.getElementById('sr-status'),   // WS3
    textMode: !!(L.textMode && L.textMode.show),     // WS3: modo lista
    bootFail: typeof L.bootFail === 'function',      // WS2: tarjeta de error del arranque
    glosario: !!(L.glossary && L.glossary.match),    // WS5
    ayuda: !!(L.onboarding || L.tour)                // WS4
  };
});

export const cop = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* página de prueba normal: rutas, bienvenida vista (salvo @first-visit) y cero errores al final */
export const test = base.extend({
  consoleOk: [null, { option: true }],
  page: async ({ page, consoleOk }, use, info) => {
    await reroute(page);
    const primera = info.tags.includes('@first-visit') || /@first-visit/.test(info.title);
    if (!primera) await page.addInitScript(marcarBienvenida);
    const errs = collect(page, consoleOk);
    await use(page);
    expect(errs, 'la página no debe mostrar errores').toEqual([]);
  }
});

export { expect };
