/* ============================================================================
   PRUEBAS DE PUBLICACIÓN — lo que GitHub Pages va a servir está completo:
   archivos que existen, ?v= al día, sin servidores externos, íconos,
   manifest, imagen para redes y la lista de archivos que se despliegan.
   Sin dependencias: node --test (npm test).
   ========================================================================== */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(ROOT + p, 'utf8');
const hay = (p) => existsSync(ROOT + p);
const html = read('index.html');
const html404 = hay('404.html') ? read('404.html') : '';
const local = (u) => u && !/^(https?:|\/\/|data:|#|mailto:)/i.test(u);
const limpia = (u) => u.split('#')[0].split('?')[0];

/* direcciones que la página pide al cargar: scripts, hojas, íconos, manifest, precargas, imágenes */
function refs(src) {
  const out = [];
  for (const m of src.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) out.push(m[1]);
  for (const m of src.matchAll(/<link\b[^>]*\bhref="([^"]+)"/g)) out.push(m[1]);
  for (const m of src.matchAll(/<(?:img|source|video)\b[^>]*\b(?:src|poster)="([^"]+)"/g)) out.push(m[1]);
  return out;
}

/* ---------------------------------------------------------- archivos que existen */
test('index.html y 404.html solo nombran archivos que existen', () => {
  for (const [nombre, src] of [['index.html', html], ['404.html', html404]]) {
    for (const u of refs(src).filter(local)) assert.ok(hay(limpia(u)), `${nombre} pide ${u}, que no existe`);
  }
});

test('404.html no pide nada a otros servidores ni a otras carpetas', () => {
  assert.ok(html404, 'falta 404.html');
  const fuera = refs(html404).filter((u) => !/^data:/.test(u));
  assert.deepEqual(fuera, [], '404.html debe ser autosuficiente (se sirve desde cualquier carpeta): ' + fuera.join(', '));
  assert.match(html404, /<meta name="robots" content="noindex">/, '404.html debe llevar robots noindex');
  assert.match(html404, /location\.replace\(/, '404.html perdió el salto de los enlaces cortos');
});

test('index.html no carga scripts ni estilos de otros servidores', { todo: hay('vendor') ? false : 'pendiente: three.js y la letra Inter se copian a vendor/ y assets/fonts/ (WS2)' }, () => {
  const ext = [
    ...[...html.matchAll(/<script\b[^>]*\bsrc="(https?:[^"]+|\/\/[^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/<link\b[^>]*\brel="(?:stylesheet|preload|modulepreload)"[^>]*\bhref="(https?:[^"]+|\/\/[^"]+)"/g)].map((m) => m[1])
  ];
  assert.deepEqual(ext, [], 'index.html todavía depende de: ' + ext.join(', '));
});

/* -------------------------------------------------------------------- ?v= */
const etiquetas = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+\.(?:js|css))(?:\?v=([^"#]*))?"/g)]
  .filter((m) => local(m[1])).map((m) => ({ file: m[1], v: m[2] }));
const sinCorrer = etiquetas.length && etiquetas.every((e) => !e.v || /^\d{8}-\d+$/.test(e.v));

test('cada css/js propio lleva ?v= con la huella de su contenido (npm run version)', { todo: sinCorrer ? 'pendiente: correr npm run version cuando estén unidas todas las ramas' : false }, () => {
  assert.ok(etiquetas.length, 'index.html no tiene css/js propios');
  for (const e of etiquetas) {
    const h = createHash('sha1').update(readFileSync(ROOT + e.file)).digest('hex').slice(0, 8);
    assert.equal(e.v, h, `${e.file} cambió y su ?v= no: corre «npm run version» (tiene ${e.v || 'ninguno'}, debe ser ${h})`);
  }
});

/* --------------------------------------------------- vista previa e íconos */
test('index.html trae las etiquetas para redes, íconos y manifest', () => {
  const props = ['og:type', 'og:locale', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt'];
  for (const p of props) assert.match(html, new RegExp(`<meta property="${p}" content="[^"]+">`), `falta <meta property="${p}">`);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/, 'falta twitter:card');
  assert.match(html, /<link rel="canonical" href="https:\/\/[^"]+\/">/, 'falta el enlace canonical');
  assert.match(html, /<link rel="icon" href="assets\/icons\/favicon\.svg" type="image\/svg\+xml">/, 'falta el favicon SVG');
  assert.match(html, /<link rel="icon" href="assets\/icons\/favicon-32\.png" sizes="32x32"/, 'falta el favicon PNG de 32 px');
  assert.match(html, /<link rel="apple-touch-icon" href="assets\/icons\/apple-touch-icon\.png">/, 'falta el ícono para iPhone');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/, 'falta el manifest');
  const img = /<meta property="og:image" content="([^"]+)">/.exec(html)[1], url = /<meta property="og:url" content="([^"]+)">/.exec(html)[1];
  assert.ok(img.startsWith(url), 'og:image debe ser una dirección completa dentro del sitio publicado');
  assert.ok(hay(img.slice(url.length)), 'og:image apunta a ' + img.slice(url.length) + ', que no existe');
});

test('manifest.webmanifest es JSON válido, con íconos de 192 y 512 que existen', () => {
  let m;
  assert.doesNotThrow(() => { m = JSON.parse(read('manifest.webmanifest')); }, 'manifest.webmanifest no es JSON válido');
  for (const k of ['name', 'short_name', 'start_url', 'display', 'background_color', 'theme_color', 'lang']) assert.ok(m[k], 'al manifest le falta ' + k);
  const tam = new Set(m.icons.map((i) => i.sizes));
  assert.ok(tam.has('192x192') && tam.has('512x512'), 'el manifest necesita íconos de 192x192 y 512x512');
  for (const i of m.icons) assert.ok(hay(i.src), `el ícono ${i.src} del manifest no existe`);
  for (const i of m.icons.filter((x) => /png$/.test(x.src))) {
    const [w, h] = png(readFileSync(ROOT + i.src));
    assert.equal(w + 'x' + h, i.sizes, `${i.src} mide ${w}x${h} y el manifest dice ${i.sizes}`);
  }
});

/* medidas de un PNG (cabecera IHDR) y de un JPEG (marcador SOF) */
function png(b) { return [b.readUInt32BE(16), b.readUInt32BE(20)]; }
function jpeg(b) {
  assert.equal(b.readUInt16BE(0), 0xffd8, 'no es un JPEG');
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const mk = b[i + 1];
    if (mk >= 0xc0 && mk <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(mk)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + b.readUInt16BE(i + 2);
  }
  return [0, 0];
}

test('la imagen para redes mide 1200×630 y pesa menos de 200 KB', () => {
  const f = 'assets/og/blackforge-og.jpg';
  assert.ok(hay(f), `falta ${f} (npm run og)`);
  const [w, h] = jpeg(readFileSync(ROOT + f));
  assert.equal(w + '×' + h, '1200×630', `${f} mide ${w}×${h}`);
  const kb = statSync(ROOT + f).size / 1024;
  assert.ok(kb < 200, `${f} pesa ${Math.round(kb)} KB; WhatsApp y otros la ignoran si es muy pesada`);
});

/* ------------------------------------------------------ lo que se despliega */
const SITIO = ['index.html', '404.html', 'manifest.webmanifest', 'css', 'js', 'assets', 'vendor'];

test('todo lo que pide la página está dentro de lo que se publica', () => {
  for (const u of [...refs(html), ...refs(html404)].filter(local).map(limpia)) {
    assert.ok(SITIO.includes(u.split('/')[0]), `${u} no se publicaría: pages.yml solo copia ${SITIO.join(', ')}`);
  }
});

test('pages.yml publica solo los archivos del sitio', () => {
  const y = read('.github/workflows/pages.yml');
  for (const s of SITIO) assert.ok(y.includes(s), `pages.yml no copia ${s}`);
  for (const s of ['tests', 'tools', 'docs', 'node_modules', 'README']) assert.ok(!new RegExp('cp[^\\n]*\\b' + s + '\\b').test(y), `pages.yml no debe publicar ${s}`);
  assert.match(y, /actions\/upload-pages-artifact@v3/);
  assert.match(y, /actions\/deploy-pages@v4/);
});

/* --------------------------------------------------------------- README */
test('README: cada imagen que muestra existe', { todo: /CAPTURAS PENDIENTES/.test(read('README.md')) ? 'pendiente: las capturas de docs/img/ se toman con la interfaz final (npm run og)' : false }, () => {
  const md = read('README.md');
  const imgs = [...md.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g), ...md.matchAll(/<(?:img|source)\b[^>]*\b(?:src|srcset)="([^"]+)"/g)].map((m) => m[1]).filter(local).map(limpia);
  assert.ok(imgs.length, 'el README no muestra ninguna imagen');
  for (const i of imgs) assert.ok(hay(i), `el README muestra ${i}, que no existe`);
});
