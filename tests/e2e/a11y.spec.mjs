/* ============================================================================
   ACCESIBILIDAD — axe-core en los estados principales (inicio, ficha,
   presupuesto, materiales, búsqueda, montaje y ayuda) y la trampa de foco de
   las ventanas. Falla con problemas «serious» o «critical»; solo se perdona el
   contraste de los textos que flotan sobre el lienzo 3D, porque axe no puede
   ver los píxeles del modelo que tienen detrás.
   Mientras la rama de accesibilidad (WS3) no esté unida, los problemas se
   anotan en el informe sin hacer fallar la prueba.
   ========================================================================== */
import AxeBuilder from '@axe-core/playwright';
import { test, expect, abrir, boot, rasgos } from './fixtures.mjs';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/* ¿el texto queda sobre el lienzo? Ningún contenedor suyo tiene fondo opaco antes de llegar a #app */
const sobreLienzo = (page, sel) => page.evaluate((s) => {
  let el = document.querySelector(s);
  const app = document.getElementById('app');
  while (el && el !== app && el !== document.body) {
    const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el).backgroundColor);
    const a = m ? (m[1].split(',')[3] === undefined ? 1 : parseFloat(m[1].split(',')[3])) : 0;
    if (a >= 0.95) return false;
    el = el.parentElement;
  }
  return true;
}, sel);

async function revisar(page, estado, estricto) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).exclude('#gl').analyze();
  const graves = [];
  for (const v of r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) {
    let nodos = v.nodes;
    if (v.id === 'color-contrast') {
      const quedan = [];
      for (const n of nodos) if (!(await sobreLienzo(page, n.target[0]))) quedan.push(n);
      nodos = quedan;
    }
    if (nodos.length) graves.push(`${v.id} (${v.impact}): ${v.help} → ` + nodos.slice(0, 4).map((n) => n.target.join(' ')).join(' | ') + (nodos.length > 4 ? ` y ${nodos.length - 4} más` : ''));
  }
  if (!estricto) {
    if (graves.length) test.info().annotations.push({ type: 'pendiente (WS3) · ' + estado, description: graves.join('\n') });
    return;
  }
  expect(graves, `accesibilidad en «${estado}»`).toEqual([]);
}

test.describe.serial('Accesibilidad', () => {
  let page, errs, R;

  test.beforeAll(async ({ browser }, info) => {
    ({ page, errs } = await abrir(browser, info));
    await page.emulateMedia({ reducedMotion: 'reduce' });     // sin animaciones a medias mientras axe mira
    await boot(page, '/?lite');
    R = await rasgos(page);
  });
  /* vuelve al inicio entre estado y estado: Esc cierra una capa por vez */
  test.afterEach(async () => {
    for (let i = 0; i < 5; i++) {
      const abierto = await page.evaluate(() => ['#spot', '#modal', '#mont', '#panel'].some((s) => { const el = document.querySelector(s); return el && !el.hidden; }));
      if (!abierto) break;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }
    expect(errs.splice(0), 'la página no debe mostrar errores').toEqual([]);
  });
  test.afterAll(async () => { if (page) await page.context().close(); });

  const estados = [
    ['inicio', null],
    ['ficha', (A) => A.select(7)],
    ['presupuesto', (A) => A.openBudget()],
    ['materiales', (A) => A.openMats()],
    ['búsqueda', (A) => A.openSpot()],
    ['montaje', (A) => A.openMontaje()]
  ];
  for (const [estado, abrirEstado] of estados) {
    test('sin problemas graves: ' + estado, async () => {
      if (abrirEstado) await page.evaluate(`(${abrirEstado})(window.L3D.api)`);
      await page.waitForTimeout(700);
      await revisar(page, estado, R.a11y);
    });
  }

  test('sin problemas graves: ayuda', async () => {
    test.skip(!R.ayuda, 'pendiente: se activa al unir la bienvenida y la ayuda (WS4)');
    await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    await page.keyboard.press('?');
    await expect(page.locator('#modal')).toBeVisible();
    await page.waitForTimeout(700);
    await revisar(page, 'ayuda', R.a11y);
  });

  test('Tab no se escapa de la ventana del presupuesto', async () => {
    test.skip(!R.a11y, 'pendiente: se activa al unir la trampa de foco (WS3)');
    await page.evaluate(() => window.L3D.api.openBudget());
    await expect(page.locator('#modal')).toBeVisible();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const dentro = await page.evaluate(() => document.getElementById('modal').contains(document.activeElement));
      expect(dentro, `después de ${i + 1} Tab el foco salió de la ventana`).toBe(true);
    }
  });
});
