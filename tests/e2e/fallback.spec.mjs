/* ============================================================================
   CUANDO ALGO FALLA — sin WebGL, modo lista (?texto), sin internet y los
   enlaces cortos de las etiquetas QR (404.html). Solo en escritorio: lo que
   se prueba aquí no depende del tamaño de la pantalla.
   ========================================================================== */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect, boot, rasgos } from './fixtures.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const conCDN = /<(?:script|link)\b[^>]*\b(?:src|href)="https?:\/\/[^"]+"[^>]*>/.test(
  readFileSync(ROOT + 'index.html', 'utf8').replace(/<link rel="(?:canonical|preconnect)"[^>]*>/g, ''));

test.skip(({ isMobile }) => isMobile, 'solo en escritorio');

test.describe('sin WebGL', () => {
  // three.js y la aplicación avisan por la consola que no hubo lienzo 3D: es lo esperado aquí
  test.use({ consoleOk: /WebGL|creating .*context/i });

  test('muestra la tarjeta de error con sus salidas', async ({ page }) => {
    await page.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (tipo, ...r) { return /webgl/i.test(tipo) ? null : get.call(this, tipo, ...r); };
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const R = await rasgos(page);
    if (!R.bootFail) {
      // antes del guardián del arranque (WS2): al menos el mensaje cambia
      await expect(page.locator('#intro-msg')).toContainText('WebGL');
      test.info().annotations.push({ type: 'pendiente (WS2)', description: 'sin la tarjeta de error de js/boot-guard.js' });
      return;
    }
    const card = page.locator('#intro .boot-card');
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card.locator('h2')).toContainText('no pudo dibujar');
    await expect(card.locator('button')).toHaveCount(R.textMode ? 3 : 2);
    if (!R.textMode) { test.info().annotations.push({ type: 'pendiente (WS3)', description: 'sin el modo lista' }); return; }
    await card.getByRole('button', { name: 'Ver la información sin 3D' }).click();
    await expect(page.locator('article')).toHaveCount(20);
  });
});

test('?texto muestra la información sin 3D (20 artículos)', async ({ page }) => {
  await page.goto('/?texto', { waitUntil: 'domcontentloaded' });
  const R = await rasgos(page);
  test.skip(!(R.textMode && R.nucleo), 'pendiente: se activa al unir el modo lista (WS3) y el núcleo (WS1)');
  await expect(page.locator('article')).toHaveCount(20, { timeout: 60_000 });
});

test('sin internet arranca igual: nada se pide fuera del sitio', async ({ page, baseURL }) => {
  test.skip(conCDN, 'pendiente: index.html todavía carga three.js o letras de otro servidor (WS2)');
  const fuera = [];
  const host = new URL(baseURL).host;
  await page.route('**/*', (r) => {
    const u = new URL(r.request().url());
    if (u.host === host || u.protocol === 'data:' || u.protocol === 'blob:') return r.continue();
    fuera.push(u.href);
    return r.abort();
  });
  await boot(page, '/?lite');
  await expect(page.locator('#app')).toHaveClass(/is-ready/);
  expect(fuera, 'pedidos a otros servidores').toEqual([]);
});

test.describe('enlaces cortos (404.html)', () => {
  // la primera respuesta es un 404 de verdad: el navegador lo anota en la consola
  test.use({ consoleOk: /status of 404/ });

  test('/m7 abre la ficha 7', async ({ page }) => {
    await boot(page, '/m7?lite');
    expect(new URL(page.url()).hash).toBe('#m7');
    await expect(page.locator('#panel h2').first()).toHaveText('Mesón de impresoras');
  });

  test('cada forma de enlace corto lleva a su ruta, sin perder la carpeta ni la consulta', async ({ page, baseURL }) => {
    const casos = [
      ['/local-3d-test/7', '/local-3d-test/#m7'],
      ['/local-3d-test/m12/', '/local-3d-test/#m12'],
      ['/local-3d-test/7?lite', '/local-3d-test/?lite#m7'],
      ['/local-3d-test/presupuesto', '/local-3d-test/#presupuesto'],
      ['/local-3d-test/Montaje', '/local-3d-test/#montaje']
    ];
    for (const [desde, hacia] of casos) {
      await page.goto(desde);
      await page.waitForURL(baseURL + hacia);
      // /local-3d-test/ tampoco existe aquí: queda la página de error, sin dar vueltas
      await expect(page.locator('h1')).toHaveText('Esta página no existe');
    }
    await page.goto('/local-3d-test/m100');
    await expect(page.locator('h1')).toHaveText('Esta página no existe');
    expect(new URL(page.url()).hash).toBe('');
    await expect(page.locator('#home')).toHaveAttribute('href', '/');
  });
});
