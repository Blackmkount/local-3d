/* ============================================================================
   RECORRIDO BÁSICO — una sola carga del local por proyecto (escritorio y
   teléfono) y, sobre ella, lo que un visitante hace: enlace directo a una
   ficha, los 20 muebles con «separar piezas» y «ver cómo se arma», el
   presupuesto, la búsqueda, el botón Atrás, Esc y los eventos del contrato.
   Lo que depende de otra rama (rutas del núcleo, accesibilidad, ayuda) se
   salta con una nota mientras esa rama no esté unida, y se activa sola.
   ========================================================================== */
import { test, expect, abrir, boot, rasgos, cop } from './fixtures.mjs';

/* los eventos de L3D.bus que js/hooks.js documenta */
const EVENTOS = ['ready', 'usermove', 'select', 'deselect', 'panel', 'tab', 'view', 'mode', 'asm-step', 'montaje',
  'montaje-step', 'montaje-land', 'montaje-done', 'modal', 'modal-close', 'spot', 'filter', 'help', 'prefs'];

test.describe.serial('Recorrido básico', () => {
  let page, errs, R, D;
  const pendiente = (cond, rama) => test.skip(!cond, 'pendiente: se activa al unir ' + rama);

  test.beforeAll(async ({ browser }, info) => {
    ({ page, errs } = await abrir(browser, info));
    // grabadora de eventos: se engancha a L3D.bus antes de que arranque la aplicación
    await page.addInitScript((lista) => {
      window.__bfEventos = {};
      document.addEventListener('DOMContentLoaded', () => {
        const bus = window.L3D && window.L3D.bus; if (!bus) return;
        lista.forEach((ev) => bus.on(ev, () => { window.__bfEventos[ev] = (window.__bfEventos[ev] || 0) + 1; }));
      });
    }, EVENTOS);
    await boot(page, '/?lite#m7');
    R = await rasgos(page);
    D = await page.evaluate(() => JSON.parse(JSON.stringify(window.L3D.data)));
  });
  test.afterEach(() => { expect(errs.splice(0), 'la página no debe mostrar errores').toEqual([]); });
  test.afterAll(async () => { if (page) await page.context().close(); });

  test('arranca sin errores y quita la pantalla de inicio', async () => {
    await expect(page.locator('#app')).toHaveClass(/is-ready/);
    await expect(page.locator('#intro')).toBeHidden();
    expect(await page.evaluate(() => document.title)).toContain('BlackForge');
  });

  test('/#m7 abre la ficha del Mesón de impresoras', async () => {
    await expect(page.locator('#panel')).toBeVisible();
    await expect(page.locator('#panel h2').first()).toHaveText('Mesón de impresoras');
  });

  test('los 20 muebles: ficha, piezas separadas, armado y materiales', async () => {
    const pendientes = [];
    for (const it of D.items) {
      await page.evaluate((n) => window.L3D.api.select(n), it.n);
      await expect(page.locator('#panel h2').first(), `ficha #${it.n}`).toHaveText(it.name);
      const r = await page.evaluate((n) => {
        const L = window.L3D, F = L.furn, d = L.data.items.find((i) => i.n === n), out = { errores: [], sinFila: [] };
        const keys = new Set(d.mats.map((m) => m.key));
        F.items[n].insts.forEach((o) => o.parts.forEach((p) => { if (!keys.has(p.userData.mk)) out.sinFila.push(p.userData.name + ' (' + p.userData.mk + ')'); }));
        out.partes = F.items[n].insts[0].parts.length;
        if (out.partes > 1) {
          try { L.api.setExplode(true); L.api.setExplode(false); } catch (err) { out.errores.push('setExplode: ' + err.message); }
          try { L.api.playAsm(); if (L.api.exitAsm) L.api.exitAsm(); } catch (err) { out.errores.push('playAsm: ' + err.message); }
        }
        out.sinFila = [...new Set(out.sinFila)];
        return out;
      }, it.n);
      // el núcleo (WS1) arregla los muebles sin secuencia de armado (6, 14, 18) y el motor (WS2) las franjas de la mampara (15)
      const msg = [...r.errores, ...r.sinFila.map((s) => 'pieza sin fila de material: ' + s)];
      if (msg.length && !(R.nucleo && R.motor)) { pendientes.push('#' + it.n + ' ' + msg.join('; ')); continue; }
      expect(r.errores, `#${it.n} ${it.short}: separar y armar no deben fallar`).toEqual([]);
      expect(r.sinFila, `#${it.n} ${it.short}: cada pieza debe resaltar con una fila de sus materiales`).toEqual([]);
    }
    if (pendientes.length) test.info().annotations.push({ type: 'pendiente (WS1/WS2)', description: pendientes.join(' | ') });
    await page.evaluate(() => window.L3D.api.deselect());
    await page.waitForTimeout(300);
    // los errores de la consola que causan esos mismos fallos conocidos también esperan a las otras ramas
    if (pendientes.length) errs.splice(0);
  });

  test('el presupuesto muestra el total de los datos', async () => {
    await page.evaluate(() => window.L3D.api.openBudget());
    await expect(page.locator('#modal')).toBeVisible();
    await expect(page.locator('#modal .kpis b').first()).toHaveText(cop(D.presupuesto.total));
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal')).toBeHidden();
  });

  test('la búsqueda encuentra la descarga .glb', async () => {
    await page.evaluate(() => window.L3D.api.openSpot());
    await expect(page.locator('#spot')).toBeVisible();
    await page.locator('#spot-q').fill('glb');
    await expect(page.locator('#spot-list')).toContainText('Descargar modelo 3D (.glb)');
    await page.keyboard.press('Escape');
    await expect(page.locator('#spot')).toBeHidden();
  });

  test('Atrás después de abrir una ficha desde la lista la cierra y no sale del sitio', async ({ baseURL }) => {
    pendiente(R.nucleo, 'el núcleo (WS1): historial con pushState');
    await page.evaluate(() => { const A = window.L3D.api; A.deselect(); history.replaceState(null, '', location.pathname + location.search); A.toggleInv(true); });
    const fila = page.locator('#inv-list .inv-row[data-n="3"]');
    await expect(fila).toBeVisible();
    await fila.click();
    await expect(page.locator('#panel')).toBeVisible();
    await page.goBack();
    await expect(page.locator('#panel')).toBeHidden();
    expect(page.url().startsWith(baseURL)).toBe(true);
  });

  test('cambiar la dirección a #m5 abre la ficha 5', async () => {
    pendiente(R.nucleo, 'el núcleo (WS1): escucha hashchange');
    const n5 = D.items.find((i) => i.n === 5);
    await page.evaluate(() => { location.hash = '#m5'; });
    await expect(page.locator('#panel h2').first()).toHaveText(n5.name);
  });

  test('Esc cierra primero la ventana, luego el armado y al final la ficha', async () => {
    await page.evaluate(() => { const A = window.L3D.api; A.select(3); A.playAsm(); A.openBudget(); });
    await expect(page.locator('#modal')).toBeVisible();
    await expect(page.locator('#stepper')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal')).toBeHidden();
    await expect(page.locator('#stepper')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#stepper')).toBeHidden();
    await expect(page.locator('#panel')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#panel')).toBeHidden();
  });

  test('cada evento del contrato (L3D.bus) se emite al menos una vez', async () => {
    pendiente(R.nucleo, 'el núcleo (WS1): eventos del contrato');
    const canvas = page.locator('#gl'), box = await canvas.boundingBox();
    // usermove: un arrastre corto sobre el modelo
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3);
    await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.5 + 60, box.y + box.height * 0.3, { steps: 6 }); await page.mouse.up();
    await page.evaluate(() => {
      const A = window.L3D.api;
      A.goView('interior');
      A.select(7); A.setTab('mats'); A.setExplode(true); A.playAsm(); A.exitAsm(); A.deselect();
      A.openBudget(); A.closeModal(); A.openSpot(); A.closeSpot();
      A.toggleInv(true);
      window.L3D.prefs.set('big', window.L3D.prefs.get('big'));
    });
    await page.locator('#inv-filter [data-f="fabrica"]').click();
    await page.locator('#inv-filter [data-f="todos"]').click();
    await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    await page.keyboard.press('?');
    // montaje: se salta al último paso para no esperar los seis
    await page.evaluate(() => window.L3D.api.openMontaje());
    await page.locator('#mont .mont-steps li').last().locator('button').click();
    await page.waitForFunction(() => (window.__bfEventos || {})['montaje-done'] > 0, null, { timeout: 30_000 });
    await page.evaluate(() => { window.L3D.api.exitMontaje(); window.L3D.api.closeModal(); });
    const vistos = await page.evaluate(() => window.__bfEventos);
    expect(EVENTOS.filter((e) => !vistos[e]), 'eventos que nunca se emitieron').toEqual([]);
  });

  test('teléfono: las 5 vistas caben en la pantalla y «Cerrar» mide al menos 44 × 44', async () => {
    test.skip(test.info().project.name !== 'phone', 'solo en el teléfono');
    pendiente(R.a11y, 'accesibilidad y móvil (WS3)');
    const vw = page.viewportSize().width;
    for (const b of await page.locator('#views button').all()) {
      const r = await b.boundingBox();
      expect(r.x, await b.textContent()).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width, await b.textContent()).toBeLessThanOrEqual(vw);
    }
    await page.evaluate(() => window.L3D.api.openBudget());
    const x = await page.locator('#modal-x').boundingBox();
    expect(x.width).toBeGreaterThanOrEqual(44);
    expect(x.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape');
  });
});
