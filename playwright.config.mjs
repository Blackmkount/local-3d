/* ============================================================================
   PRUEBAS EN EL NAVEGADOR — npm run test:e2e
   Chromium sin ventana dibuja el 3D por software (SwiftShader): es lento, así
   que hay un solo trabajador, tiempos amplios y pocas cargas de página.
   El servidor se levanta solo (http-server en el puerto 4173) o se reusa.
   ========================================================================== */
import { defineConfig } from '@playwright/test';

/* E2E_PORT permite usar otro puerto si el 4173 está ocupado por otro proyecto */
const PORT = +process.env.E2E_PORT || 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '*.spec.mjs',
  timeout: 240_000,
  expect: { timeout: 20_000 },
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  webServer: {
    command: 'npx http-server -p ' + PORT + ' -c-1 -s .',
    url: 'http://localhost:' + PORT + '/',
    reuseExistingServer: true,
    timeout: 60_000
  },
  use: {
    baseURL: 'http://localhost:' + PORT,
    browserName: 'chromium',
    locale: 'es-CO',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required']
    }
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1400, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } }
  ]
});
