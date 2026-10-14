/* ============================================================================
   ESLint (configuración plana). Solo revisa errores reales: no cambia el
   formato de nada (el proyecto no usa Prettier en js/ ni css/, ver README).
   Uso: npm run lint
   ========================================================================== */
import js from '@eslint/js';
import globals from 'globals';

const reglas = {
  'no-empty': ['error', { allowEmptyCatch: true }],
  'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
  // `let ok = false; try { ok = … } catch (err) { ok = false; }` es un valor por defecto a propósito
  'no-useless-assignment': 'off'
};

export default [
  {
    ignores: ['vendor/**', 'dist/**', 'node_modules/**', '.claude/**', 'tools/qr/qrcode.js', 'tools/*/frames/**',
      'test-results/**', 'playwright-report/**', 'blob-report/**', 'coverage/**']
  },
  js.configs.recommended,

  /* el sitio: scripts clásicos que cuelgan de window.L3D; three.js llega como global */
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, THREE: 'readonly' }
    },
    rules: reglas
  },

  /* pruebas y herramientas en Node; el código que va dentro de page.evaluate() corre en el navegador */
  {
    files: ['tests/**/*.mjs', 'tools/**/*.mjs', '*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, L3D: 'readonly' }
    },
    rules: reglas
  },

  /* renderizadores de los videos: CommonJS (por eso package.json no lleva "type");
     lo que va dentro de p.evaluate() corre en la página */
  {
    files: ['tools/*/render.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser }
    },
    rules: reglas
  },

  /* escenas de los videos: módulos del navegador con importmap. No se publican con el sitio:
     una variable sin usar es un aviso, no un error */
  {
    files: ['tools/video-*/video.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser }
    },
    rules: { ...reglas, 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] }
  }
];
