#!/usr/bin/env node
/* ============================================================================
   COPIAS LOCALES (vendor) — la página no depende de ningún servidor externo:
   three.js r160 y la tipografía Inter viajan con el sitio, así funciona sin
   conexión y al abrir index.html con doble clic.

   Uso:   node tools/vendor.mjs                 (copia desde node_modules)
          node tools/vendor.mjs --check         (solo compara con lo que ya está en el repositorio)
          node tools/vendor.mjs --three DIR --inter DIR
                                                (copia desde paquetes ya descomprimidos, p. ej. de
                                                 `npm pack three@0.160.0 @fontsource/inter@5.0.18`)
   Sin dependencias: solo Node 18 o más reciente.

   Copia:
     three/build/three.min.js                       → vendor/three-0.160.0.min.js
     three/examples/jsm/exporters/GLTFExporter.js   → vendor/GLTFExporter-0.160.0.js
     three/examples/jsm/utils/TextureUtils.js       → vendor/TextureUtils-0.160.0.js
     three/LICENSE                                  → vendor/THREE-LICENSE.txt
     @fontsource/inter/files/inter-latin-{400,500,600,700}-normal.woff2 → assets/fonts/
     @fontsource/inter/LICENSE (SIL Open Font License 1.1)               → assets/fonts/OFL.txt

   El único cambio sobre los originales: GLTFExporter importa '../utils/TextureUtils.js';
   aquí apunta a './TextureUtils-0.160.0.js', su vecino en vendor/. Al final imprime el
   sha256 de cada archivo, para comparar con otra copia.
   ========================================================================== */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const THREE_VER = '0.160.0', INTER_VER = '5.0.18';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const check = args.includes('--check');
const threeDir = resolve(opt('--three') || join(ROOT, 'node_modules', 'three'));
const interDir = resolve(opt('--inter') || join(ROOT, 'node_modules', '@fontsource', 'inter'));

function version(dir, want, name) {
  const pkg = join(dir, 'package.json');
  if (!existsSync(pkg)) throw new Error('No encuentro ' + name + ' en ' + dir + '. Instálalo con `npm install` o pasa la carpeta con --three / --inter.');
  const v = JSON.parse(readFileSync(pkg, 'utf8')).version;
  if (v !== want) throw new Error(name + ' ' + v + ' en ' + dir + ': se esperaba la versión ' + want + ' exacta.');
}

// [origen, destino, transformación opcional del texto]
const jobs = [
  [join(threeDir, 'build/three.min.js'), 'vendor/three-' + THREE_VER + '.min.js'],
  [join(threeDir, 'examples/jsm/exporters/GLTFExporter.js'), 'vendor/GLTFExporter-' + THREE_VER + '.js', (code) => {
    const from = "from './../utils/TextureUtils.js'";
    if (!code.includes(from)) throw new Error('GLTFExporter.js cambió: no trae el import de TextureUtils esperado.');
    return code.replace(from, "from './TextureUtils-" + THREE_VER + ".js'");
  }],
  [join(threeDir, 'examples/jsm/utils/TextureUtils.js'), 'vendor/TextureUtils-' + THREE_VER + '.js'],
  [join(threeDir, 'LICENSE'), 'vendor/THREE-LICENSE.txt'],
  ...[400, 500, 600, 700].map((w) => [join(interDir, 'files/inter-latin-' + w + '-normal.woff2'), 'assets/fonts/inter-latin-' + w + '-normal.woff2']),
  [join(interDir, 'LICENSE'), 'assets/fonts/OFL.txt']
];

const sha = (buf) => createHash('sha256').update(buf).digest('hex');
let bad = 0;
try {
  version(threeDir, THREE_VER, 'three');
  version(interDir, INTER_VER, '@fontsource/inter');
} catch (err) {
  if (!check) { console.error(err.message); process.exit(1); }
}
for (const [src, dst, fix] of jobs) {
  const out = join(ROOT, dst);
  if (check) {
    // --check: el repositorio debe traer cada archivo; si además está el paquete, deben coincidir
    if (!existsSync(out)) { console.log('FALTA    ' + dst); bad++; continue; }
    const have = readFileSync(out);
    let note = '';
    if (existsSync(src)) {
      let want = readFileSync(src);
      if (fix) want = Buffer.from(fix(want.toString('utf8')), 'utf8');
      if (sha(want) !== sha(have)) { note = '  ≠ distinto del paquete'; bad++; }
    }
    console.log(sha(have) + '  ' + dst + note);
    continue;
  }
  let buf = readFileSync(src);
  if (fix) buf = Buffer.from(fix(buf.toString('utf8')), 'utf8');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  console.log(sha(buf) + '  ' + dst + '  (' + Math.round(buf.length / 1024) + ' KB)');
}
if (bad) { console.error(bad + ' archivo(s) no coinciden. Corre `node tools/vendor.mjs` para copiarlos de nuevo.'); process.exit(1); }
