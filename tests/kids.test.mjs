/* ============================================================================
   PRUEBAS DEL CONTENIDO PARA NIÑOS — js/kids-data.js (L3D.kids) y el buscador
   de palabras de js/glossary.js (L3D.glossary.match), sin navegador.

   glossary.js se carga en una caja con solo { window }: su código de página
   debe quedar protegido (typeof document) para que match() se pueda probar.
   Mientras esos archivos no existan en el árbol, sus pruebas se saltan.
   ========================================================================== */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(ROOT + p, 'utf8');
const hay = (p) => existsSync(ROOT + p);
const json = (x) => JSON.parse(JSON.stringify(x));

const SIN_KIDS = hay('js/kids-data.js') ? false : 'js/kids-data.js aún no está en el árbol';
const SIN_GLOSARIO = SIN_KIDS || (hay('js/glossary.js') ? false : 'js/glossary.js aún no está en el árbol');

/* data.js + kids-data.js (+ glossary.js) en la misma caja, como en la página */
let ctx = null, carga = null;
function caja(conGlosario) {
  const c = vm.createContext({ window: {}, console });
  const files = ['js/data.js', 'js/kids-data.js'].concat(conGlosario ? ['js/glossary.js'] : []);
  for (const f of files) vm.runInContext(read(f), c, { filename: f });
  return c;
}
if (!SIN_KIDS) {
  try { ctx = caja(!SIN_GLOSARIO); } catch (err) { carga = err; ctx = SIN_GLOSARIO ? null : (() => { try { return caja(false); } catch (e) { return null; } })(); }
}
const L = ctx ? ctx.window.L3D : null;
const D = L ? json(L.data) : null, K = L && L.kids ? json(L.kids) : null;
const nums = D ? new Set(D.items.map((i) => i.n)) : new Set();

test('kids-data.js y glossary.js cargan sin página (solo window)', { skip: SIN_KIDS }, () => {
  assert.equal(carga, null, 'no cargó en una caja sin document: ' + (carga && carga.message) + ' — protege el código de página con typeof document');
  assert.ok(K, 'kids-data.js no define window.L3D.kids');
});

/* ------------------------------------------------------- textos por elemento */
test('kids.items: los 20 elementos tienen ¿Qué es?, ¿Para qué sirve? y ¿Sabías que…?', { skip: SIN_KIDS }, () => {
  for (const n of nums) {
    const k = K.items[n];
    assert.ok(k, `kids.items no tiene el elemento #${n}`);
    for (const f of ['que', 'para', 'sabias']) assert.ok(typeof k[f] === 'string' && k[f].trim(), `kids.items[${n}].${f} está vacío`);
  }
  const extra = Object.keys(K.items).filter((n) => !nums.has(+n));
  assert.equal(extra.length, 0, 'kids.items tiene elementos que no existen en data.js: ' + extra.join(', '));
});

test('kids.items: cada respuesta correcta de las preguntas existe', { skip: SIN_KIDS }, () => {
  let conQuiz = 0;
  for (const [n, k] of Object.entries(K.items)) {
    if (!k.quiz) continue;
    conQuiz++;
    const ops = k.quiz.options || k.quiz.a;
    assert.ok(Array.isArray(ops) && ops.length >= 2, `la pregunta de #${n} necesita al menos dos respuestas`);
    assert.ok(Number.isInteger(k.quiz.ok) && k.quiz.ok >= 0 && k.quiz.ok < ops.length, `la pregunta de #${n} marca como correcta la respuesta ${k.quiz.ok}, que no existe`);
  }
  assert.ok(conQuiz >= 10, `solo ${conQuiz} elementos tienen pregunta; deben ser al menos 10`);
});

/* ---------------------------------------------------------------- glosario */
test('kids.glosario: al menos 55 palabras, con id único y definición', { skip: SIN_KIDS }, () => {
  const ids = K.glosario.map((g) => g.id), rep = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.ok(K.glosario.length >= 55, `el glosario tiene ${K.glosario.length} palabras; deben ser al menos 55`);
  assert.equal(rep.length, 0, 'id repetido en el glosario: ' + rep.join(', '));
  for (const g of K.glosario) {
    assert.ok(g.t && g.d, `la palabra «${g.id}» necesita t (cómo se escribe) y d (definición)`);
    assert.ok(Array.isArray(g.alias) && g.alias.length, `la palabra «${g.id}» no tiene alias para buscarla en el texto`);
  }
});

test('kids.glosario: cada «Ver en 3D» lleva a un elemento que existe', { skip: SIN_KIDS }, () => {
  for (const g of K.glosario) if (g.ver != null) assert.ok(nums.has(g.ver), `«${g.id}» manda a ver el elemento #${g.ver}, que no existe`);
});

test('kids.procesos: cada proceso existe en data.procesos', { skip: SIN_KIDS }, () => {
  const ids = new Set(D.procesos.map((p) => p.id));
  for (const id of Object.keys(K.procesos)) assert.ok(ids.has(id), `kids.procesos tiene «${id}», que no está en data.procesos`);
  for (const p of D.procesos) assert.ok(K.procesos[p.id], `falta la explicación sencilla del proceso «${p.id}»`);
});

test('kids.historia: las tarjetas cubren el video de 0 a 36 s sin huecos', { skip: SIN_KIDS }, () => {
  const h = K.historia;
  assert.ok(h.length >= 2, 'la historia necesita varias tarjetas');
  assert.equal(h[0].t0, 0, 'la primera tarjeta debe empezar en el segundo 0');
  assert.equal(h[h.length - 1].t1, 36, 'la última tarjeta debe terminar en el segundo 36 (largo del video)');
  h.forEach((c, i) => {
    assert.ok(c.t1 > c.t0, `la tarjeta «${c.title}» termina antes de empezar`);
    if (i) assert.equal(c.t0, h[i - 1].t1, `entre «${h[i - 1].title}» y «${c.title}» hay un hueco o un cruce (${h[i - 1].t1} → ${c.t0})`);
  });
});

/* ------------------------------------------------------- glossary.match() */
const match = (txt) => json(L.glossary.match(txt, new Set()));
const ids = (txt) => match(txt).map((h) => h.id);

test('glossary.match: «Piso de MDF 15 mm» encuentra MDF', { skip: SIN_GLOSARIO }, () => {
  assert.ok(ids('Piso de MDF 15 mm').includes('mdf'), 'no encontró «mdf»: ' + JSON.stringify(match('Piso de MDF 15 mm')));
});

test('glossary.match: «al fondo del local» no encuentra nada', { skip: SIN_GLOSARIO }, () => {
  assert.deepEqual(match('al fondo del local'), [], '«fondo» suelto no es la tapa de atrás de un mueble');
});

test('glossary.match: «Melamina Plomo RH» encuentra Plomo y RH', { skip: SIN_GLOSARIO }, () => {
  const r = ids('Melamina Plomo RH');
  assert.ok(r.includes('plomo') && r.includes('rh'), 'esperaba plomo y rh, encontró ' + r.join(', '));
  assert.ok(!ids('el plomo de la pintura').includes('plomo'), '«plomo» en minúscula no es el color Plomo');
});

test('glossary.match: «vidrio templado» prefiere el alias más largo', { skip: SIN_GLOSARIO }, () => {
  const h = match('Una puerta de vidrio templado de 10 mm').find((x) => x.id === 'vidrio-templado');
  assert.ok(h, 'no encontró «vidrio-templado»');
  assert.equal(h.length, 'vidrio templado'.length, 'debe marcar «vidrio templado» completo, no solo «templado»');
  assert.equal(h.index, 'Una puerta de '.length);
});

test('glossary.match: respeta las palabras ya vistas (seen)', { skip: SIN_GLOSARIO }, () => {
  const r = json(L.glossary.match('Piso de MDF 15 mm', new Set(['mdf'])));
  assert.ok(!r.some((h) => h.id === 'mdf'), 'una palabra ya marcada no se vuelve a marcar en la misma sección');
});
