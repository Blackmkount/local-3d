/* ============================================================================
   VERSIONES — pone a cada css/js propio de index.html su ?v= con la huella
   de su contenido (los 8 primeros caracteres del sha1). Un archivo que no
   cambió conserva su ?v= y el navegador lo sigue tomando de la caché; uno que
   cambió estrena dirección y se descarga de nuevo. Nada más que hacer a mano.

   Uso:  npm run version                 reescribe index.html
         node tools/bump-version.mjs --check    solo revisa (sale con error si falta)
         node tools/bump-version.mjs --root otra/carpeta   trabaja sobre otra copia

   Al final sugiere el nombre de la versión para el CHANGELOG (AAAA.MM.DD-n).
   Los videos no llevan ?v=: cambian de nombre si cambia el video.
   ========================================================================== */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const args = process.argv.slice(2);
const check = args.includes('--check');
const r = args.indexOf('--root');
const ROOT = r >= 0 ? path.resolve(args[r + 1]) : fileURLToPath(new URL('..', import.meta.url));
const INDEX = path.join(ROOT, 'index.html');

const huella = (buf) => createHash('sha1').update(buf).digest('hex').slice(0, 8);
/* <script src="js/app.js?v=…"> y <link … href="css/styles.css?v=…">, solo direcciones propias */
const ETIQUETA = /(<(?:script|link)\b[^>]*?\b(?:src|href)=")((?!https?:|\/\/|data:)[^"?#]+\.(?:js|css))(?:\?v=([^"#]*))?(")/g;

const html = readFileSync(INDEX, 'utf8');
const cambios = [], faltan = [];
const nuevo = html.replace(ETIQUETA, (all, pre, file, v, post) => {
  const abs = path.join(ROOT, file);
  if (!existsSync(abs)) { faltan.push(file); return all; }
  const h = huella(readFileSync(abs));
  if (h !== v) cambios.push({ file, antes: v || '(sin ?v=)', ahora: h });
  return pre + file + '?v=' + h + post;
});

if (faltan.length) {
  console.error('index.html nombra archivos que no existen:\n  ' + faltan.join('\n  '));
  process.exit(1);
}
if (!cambios.length) console.log('Todo al día: ningún ?v= cambió.');
else {
  console.log((check ? 'Falta correr npm run version. Cambiarían ' : 'Actualizados ') + cambios.length + ' archivos:');
  for (const c of cambios) console.log('  ' + c.file.padEnd(28) + ' ' + c.antes + ' → ' + c.ahora);
}
if (check) process.exit(cambios.length ? 1 : 0);
if (cambios.length) writeFileSync(INDEX, nuevo);

/* nombre de la versión: la fecha de hoy y el siguiente número libre en el CHANGELOG */
const d = new Date(), p2 = (n) => String(n).padStart(2, '0');
const hoy = d.getFullYear() + '.' + p2(d.getMonth() + 1) + '.' + p2(d.getDate());
const log = existsSync(path.join(ROOT, 'CHANGELOG.md')) ? readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8') : '';
const usados = [...log.matchAll(new RegExp('^## \\[' + hoy.replace(/\./g, '\\.') + '-(\\d+)\\]', 'gm'))].map((m) => +m[1]);
const n = usados.length ? Math.max(...usados) + 1 : 1;
console.log('\nVersión para el CHANGELOG: ' + hoy + '-' + n + (cambios.length ? '' : ' (si publicas algo más)'));
