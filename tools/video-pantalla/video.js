/* global L3D */
/* Video de la pantalla de 75" (assets/video/pantalla-75.mp4): el proceso de impresión 3D en cuatro pasos.
   Vertical 720 × 1280, 30 fps, 36 s, en bucle (empieza y termina en negro). Todo se dibuja aquí: la escena
   con three.js y los textos e indicadores encima, en un lienzo 2D.
   Abierto en el navegador (con un servidor local) se reproduce en tiempo real; ?t=12.5 congela ese instante.
   Para renderizarlo cuadro a cuadro: render.js llama a window.render(i), que devuelve el cuadro i como PNG. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const T = THREE;
const Q = new URLSearchParams(location.search);
const W = 720, H = 1280, FPS = 30, DUR = 36, NFR = FPS * DUR;
const SS = Number(Q.get('ss') || 1.5);
const GW = Math.round(W * SS), GH = Math.round(H * SS);
const PI = Math.PI, TAU = PI * 2;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (a, b, x) => clamp((x - a) / (b - a));
const ss = (a, b, x) => { const u = lin(a, b, x); return u * u * (3 - 2 * u); };
const eo = (u) => 1 - Math.pow(1 - clamp(u), 3);
const eio = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const mix = (a, b, u) => a + (b - a) * u;

/* ------------------------------------------------------------ guion */
const S1 = 3.4, S2 = 10.2, S3 = 16.8, S4 = 27.8, S5 = 32.4, END = DUR;
const STEPS = [
  { t0: S1, t1: S2, n: '01', k: 'MODELADO', title: 'Diseño en 3D', body: 'Dibujamos la pieza en el computador, con cada medida exacta.' },
  { t0: S2, t1: S3, n: '02', k: 'LAMINADO', title: 'Capa por capa', body: 'El software la corta en 600 capas de 0,2\u00a0mm y traza el camino de la boquilla.' },
  { t0: S3, t1: S4, n: '03', k: 'IMPRESIÓN', title: 'Hilo fundido', body: 'La boquilla funde el PLA a 210\u00a0°C y lo deposita en hilos de 0,4\u00a0mm.' },
  { t0: S4, t1: S5, n: '04', k: 'ACABADO', title: 'Lista para ti', body: 'La retiramos de la cama, revisamos cada detalle y queda lista para usar.' }
];
const NAMES = ['Modelado', 'Laminado', 'Impresión', 'Acabado'];

/* ------------------------------------------------------------ render */
const out = document.getElementById('out');
const g = out.getContext('2d');
const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(GW, GH, false);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.localClippingEnabled = true;

const scene = new T.Scene();
const pmrem = new T.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
const camera = new T.PerspectiveCamera(30, W / H, 1, 400);

const hemi = new T.HemisphereLight(0xdfe8ff, 0x1a1410, 0.35);
const key = new T.DirectionalLight(0xfff1e0, 2.4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 5, far: 90 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
const rim = new T.DirectionalLight(0x9cc4ff, 1.6);
const fill = new T.DirectionalLight(0xffd2a8, 0.45);
scene.add(hemi, key, key.target, rim, fill);
function place(l, az, el, d = 40, ty = 4) { l.position.set(d * Math.sin(az) * Math.cos(el), ty + d * Math.sin(el), d * Math.cos(az) * Math.cos(el)); }
key.target.position.set(0, 4, 0);

/* ------------------------------------------------------------ pieza */
const HH = 12, NF = 10, LH = 0.15, NL = Math.round(HH / LH);
const prof = (u) => 2.9 + 1.25 * Math.sin(PI * u * 1.05 + 0.15) - 0.55 * u * u * u + 0.6 * ss(0.86, 1, u);
const twist = (y) => 1.1 * y / HH;
function ring(y, inset = 0) {
  const r = prof(clamp(y / HH)) - inset / Math.cos(PI / NF), a0 = twist(y), p = [];
  for (let k = 0; k < NF; k++) { const a = a0 + TAU * k / NF; p.push([r * Math.cos(a), r * Math.sin(a)]); }
  return p;
}
let RMAX = 0, YMAX = 0;
for (let y = 0; y <= HH; y += 0.01) { const r = prof(y / HH); if (r > RMAX) { RMAX = r; YMAX = y; } }

class GB {
  constructor() { this.p = []; this.u = []; this.i = []; }
  get n() { return this.p.length / 3; }
  v(x, y, z, u = 0, w = 0) { this.p.push(x, y, z); this.u.push(u, w); return this.n - 1; }
  t(a, b, c, dx, dy, dz) {
    const P = this.p, ax = P[3 * a], ay = P[3 * a + 1], az = P[3 * a + 2];
    const ux = P[3 * b] - ax, uy = P[3 * b + 1] - ay, uz = P[3 * b + 2] - az;
    const vx = P[3 * c] - ax, vy = P[3 * c + 1] - ay, vz = P[3 * c + 2] - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * dx + ny * dy + nz * dz < 0) this.i.push(a, c, b); else this.i.push(a, b, c);
  }
  build() {
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(this.u, 2));
    geo.setIndex(this.i);
    geo.computeVertexNormals();
    return geo;
  }
}
/* sólido facetado: caras laterales con normales suaves en altura y aristas vivas; grupo 0 lados, 1 tapas */
function solidGeo(y0, y1, rows, polyAt) {
  const gb = new GB();
  for (let k = 0; k < NF; k++) {
    const base = gb.n;
    for (let j = 0; j <= rows; j++) {
      const y = mix(y0, y1, j / rows), R = polyAt(y), a = R[k], b = R[(k + 1) % NF];
      gb.v(a[0], y, a[1], k / NF, y / HH); gb.v(b[0], y, b[1], (k + 1) / NF, y / HH);
    }
    for (let j = 0; j < rows; j++) {
      const a = base + 2 * j, P = gb.p, mx = (P[3 * a] + P[3 * a + 3]) / 2, mz = (P[3 * a + 2] + P[3 * a + 5]) / 2;
      gb.t(a, a + 2, a + 3, mx, 0, mz); gb.t(a, a + 3, a + 1, mx, 0, mz);
    }
  }
  const nSide = gb.i.length;
  for (const [y, s] of [[y1, 1], [y0, -1]]) {
    const R = polyAt(y), c = gb.v(0, y, 0, 0.5, 0.5), f = gb.n;
    R.forEach((q) => gb.v(q[0], y, q[1], 0.5, 0.5));
    for (let k = 0; k < NF; k++) gb.t(c, f + k, f + (k + 1) % NF, 0, s, 0);
  }
  const geo = gb.build();
  geo.addGroup(0, nSide, 0); geo.addGroup(nSide, gb.i.length - nSide, 1);
  return geo;
}
function polyGeo(P, y) {
  const gb = new GB(), c = gb.v(0, y, 0), f = gb.n;
  P.forEach((q) => gb.v(q[0], y, q[1]));
  for (let k = 0; k < P.length; k++) gb.t(c, f + k, f + (k + 1) % P.length, 0, 1, 0);
  return gb.build();
}

/* ------------------------------------------------------------ texturas */
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const LOGO = L3D.brand.paths.map((d) => new Path2D(d));
const LVB = L3D.brand.viewBox;
function drawLogo(_, x, px, py, w, color) { const s = w / LVB[0]; x.save(); x.translate(px, py); x.scale(s, s); x.fillStyle = color; LOGO.forEach((p) => x.fill(p)); x.restore(); }

function layerNormalTex() {
  const c = cnv(4, 64), x = c.getContext('2d'), im = x.createImageData(4, 64);
  const hg = (f) => Math.pow(Math.max(0, Math.sin(PI * f)), 0.6);
  for (let j = 0; j < 64; j++) {
    const f = (j + 0.5) / 64, dh = (hg(f + 0.01) - hg(f - 0.01)) / 0.02;
    let ny = -dh * 0.2, nz = 1; const l = Math.hypot(ny, nz); ny /= l; nz /= l;
    for (let i = 0; i < 4; i++) {
      const o = 4 * (j * 4 + i);
      im.data[o] = 128; im.data[o + 1] = Math.round((ny * 0.5 + 0.5) * 255); im.data[o + 2] = Math.round((nz * 0.5 + 0.5) * 255); im.data[o + 3] = 255;
    }
  }
  x.putImageData(im, 0, 0);
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1, NL); t.anisotropy = 8; t.colorSpace = T.NoColorSpace;
  return t;
}
function glowTex() {
  const c = cnv(128, 128), x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return new T.CanvasTexture(c);
}
function bedTex() {
  const S = 1024, c = cnv(S, S), x = c.getContext('2d');
  x.fillStyle = '#18181b'; x.fillRect(0, 0, S, S);
  const im = x.getImageData(0, 0, S, S), d = im.data;
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(im, 0, 0);
  x.strokeStyle = 'rgba(255,255,255,0.06)'; x.lineWidth = 2;
  for (let k = 1; k < 10; k++) { const p = k * S / 10; x.beginPath(); x.moveTo(p, 30); x.lineTo(p, S - 30); x.moveTo(30, p); x.lineTo(S - 30, p); x.stroke(); }
  x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 3; x.strokeRect(24, 24, S - 48, S - 48);
  x.globalAlpha = 0.42; drawLogo(null, x, S - 64 - 260, S - 64 - 48, 260, '#d8d8dc'); x.globalAlpha = 1;
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function shroudTex() {
  const S = 512, c = cnv(S, S), x = c.getContext('2d');
  x.fillStyle = '#1c1c1f'; x.fillRect(0, 0, S, S);
  const cx = 256, cy = 210;
  x.fillStyle = '#0d0d0f'; x.beginPath(); x.arc(cx, cy, 170, 0, TAU); x.fill();
  x.strokeStyle = '#34343a'; x.lineWidth = 7;
  for (let r = 40; r <= 165; r += 25) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); }
  x.lineWidth = 8; for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; x.beginPath(); x.moveTo(cx + 40 * Math.cos(a), cy + 40 * Math.sin(a)); x.lineTo(cx + 168 * Math.cos(a), cy + 168 * Math.sin(a)); x.stroke(); }
  x.fillStyle = '#2a2a2f'; x.beginPath(); x.arc(cx, cy, 36, 0, TAU); x.fill();
  drawLogo(null, x, 256 - 150, 420, 300, '#e9e9ee');
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/* ------------------------------------------------------------ materiales */
const PLA = 0xff7c0a;
const layerN = layerNormalTex();
const plaMat = new T.MeshPhysicalMaterial({ color: PLA, roughness: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.35, normalMap: layerN, normalScale: new T.Vector2(1, 1), envMapIntensity: 0.75, side: T.DoubleSide, clipShadows: true });
const plaCap = new T.MeshPhysicalMaterial({ color: PLA, roughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.75, side: T.DoubleSide, clipShadows: true });
const clipPlane = new T.Plane(new T.Vector3(0, -1, 0), 100);
plaMat.clippingPlanes = [clipPlane]; plaCap.clippingPlanes = [clipPlane];
const clayMat = new T.MeshStandardMaterial({ color: 0xcac6bf, roughness: 0.55, envMapIntensity: 0.6, transparent: true });

/* hilo recién depositado: el calor se suma como emisión por vértice */
const beadMat = new T.MeshStandardMaterial({ color: PLA, roughness: 0.42, envMapIntensity: 0.75 });
beadMat.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float heat;\nvarying float vHeat;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeat = heat;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vHeat;')
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.36, 0.06) * pow(vHeat, 1.4) * 2.6 + vec3(1.0, 0.8, 0.45) * pow(vHeat, 8.0) * 4.0;');
};

function lines(pos, color, width, extra = {}) {
  const geo = new LineSegmentsGeometry(); geo.setPositions(pos);
  const mat = new LineMaterial(Object.assign({ color, linewidth: width * SS, transparent: true, toneMapped: false }, extra));
  mat.resolution.set(GW, GH);
  return new LineSegments2(geo, mat);
}

/* ------------------------------------------------------------ piso */
const ground = new T.Mesh(new T.PlaneGeometry(80, 80), new T.ShadowMaterial({ opacity: 0.42, transparent: true }));
ground.rotation.x = -PI / 2; ground.receiveShadow = true; ground.renderOrder = -3;
scene.add(ground);
const gridMat = new T.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uOp: { value: 0 }, uCol: { value: new T.Vector3(0.34, 0.47, 0.66) } },
  vertexShader: 'varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
  fragmentShader: `uniform float uOp; uniform vec3 uCol; varying vec3 vP;
    float gl(vec2 p, float s, float w){ vec2 q = p / s; vec2 g = abs(fract(q - 0.5) - 0.5) / (fwidth(q) * w); return 1.0 - min(min(g.x, g.y), 1.0); }
    void main(){
      float r = length(vP.xz), f = 1.0 - smoothstep(6.0, 24.0, r);
      float a = gl(vP.xz, 1.0, 1.0) * 0.28 + gl(vP.xz, 5.0, 1.4) * 0.6;
      gl_FragColor = vec4(uCol, a * f * uOp);
    }`
});
const grid = new T.Mesh(new T.PlaneGeometry(60, 60), gridMat);
grid.rotation.x = -PI / 2; grid.position.y = 0.002; grid.renderOrder = -2;
scene.add(grid);

/* ------------------------------------------------------------ 01 modelado */
const modG = new T.Group(); scene.add(modG);
const pieceGeo = solidGeo(0, HH, 144, (y) => ring(y));
const clay = new T.Mesh(pieceGeo, [clayMat, clayMat]);
clay.castShadow = true; clay.receiveShadow = true; clay.renderOrder = 0;
modG.add(clay);
const wirePos = [];
{
  const MR = 96, sc = 1.006;
  for (let k = 0; k < NF; k++) for (let j = 0; j < MR; j++) {
    const y0 = HH * j / MR, y1 = HH * (j + 1) / MR, a = ring(y0)[k], b = ring(y1)[k];
    wirePos.push(a[0] * sc, y0, a[1] * sc, b[0] * sc, y1, b[1] * sc);
  }
  for (let j = 0; j <= MR; j += 8) {
    const y = HH * j / MR, R = ring(y);
    for (let k = 0; k < NF; k++) { const a = R[k], b = R[(k + 1) % NF]; wirePos.push(a[0] * sc, y, a[1] * sc, b[0] * sc, y, b[1] * sc); }
  }
}
const revPlane = new T.Plane(new T.Vector3(0, -1, 0), 0);
const clayClip = new T.Plane(new T.Vector3(0, 1, 0), 1000), slabClip = new T.Plane(new T.Vector3(0, -1, 0), 1000);
clayMat.clippingPlanes = [clayClip];
const wire = lines(wirePos, 0x8fc1ff, 1.25, { clippingPlanes: [revPlane, clayClip] });
wire.renderOrder = -1;
modG.add(wire);
const scan = lines(new Array(6 * NF).fill(0), 0xbfe0ff, 2.2);
const scanGlow = lines(new Array(6 * NF).fill(0), 0x4f9dff, 9, { opacity: 0.22 });
const slicePlane = new T.Mesh(new T.BufferGeometry(), new T.MeshBasicMaterial({ color: 0x3d8bff, transparent: true, opacity: 0.16, side: T.DoubleSide, depthWrite: false, toneMapped: false }));
modG.add(scan, scanGlow, slicePlane);
function setLoop(obj, P, y, sc = 1.012) {
  const a = obj.geometry.attributes.instanceStart.data.array;
  for (let k = 0; k < NF; k++) { const p = P[k], q = P[(k + 1) % NF]; a.set([p[0] * sc, y, p[1] * sc, q[0] * sc, y, q[1] * sc], 6 * k); }
  obj.geometry.attributes.instanceStart.data.needsUpdate = true;
  obj.geometry.computeBoundingSphere();
}

/* ------------------------------------------------------------ 02 laminado */
const lamG = new T.Group(); scene.add(lamG);
const NS = 24, SH = HH / NS, FS = 13;
const slabs = [];
for (let i = 0; i < NS; i++) {
  const ym = (i + 0.5) * SH, P = ring(ym);
  const mat = new T.MeshStandardMaterial({ color: 0xe4e7ec, roughness: 0.5, envMapIntensity: 0.7, transparent: true, clippingPlanes: [slabClip] });
  const mesh = new T.Mesh(solidGeo(0, SH, 1, () => P), [mat, mat]);
  mesh.castShadow = mesh.receiveShadow = true;
  const op = [];
  P.forEach((q, k) => { const r = P[(k + 1) % NF]; op.push(q[0] * 1.004, SH + 0.004, q[1] * 1.004, r[0] * 1.004, SH + 0.004, r[1] * 1.004); });
  const ol = lines(op, 0xffa31a, 1.5, { clippingPlanes: [slabClip] });
  const grp = new T.Group(); grp.add(mesh, ol); lamG.add(grp);
  slabs.push({ grp, mat, ol, mesh });
}
function zigzag(P, sp, ang) {
  const dx = Math.cos(ang), dz = Math.sin(ang), nx = -dz, nz = dx;
  let c0 = Infinity, c1 = -Infinity;
  P.forEach((p) => { const c = p[0] * nx + p[1] * nz; c0 = Math.min(c0, c); c1 = Math.max(c1, c); });
  const out = []; let flip = false;
  for (let c = c0 + sp * 0.5; c < c1; c += sp) {
    const hits = [];
    for (let k = 0; k < P.length; k++) {
      const a = P[k], b = P[(k + 1) % P.length], sa = a[0] * nx + a[1] * nz - c, sb = b[0] * nx + b[1] * nz - c;
      if ((sa < 0) !== (sb < 0)) { const u = sa / (sa - sb); hits.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
    }
    if (hits.length < 2) continue;
    hits.sort((p, q) => (p[0] * dx + p[1] * dz) - (q[0] * dx + q[1] * dz));
    const A = hits[0], B = hits[hits.length - 1];
    if (flip) out.push(B, A); else out.push(A, B);
    flip = !flip;
  }
  return out;
}
const lamPerim = [], lamInf = [];
{
  const ym = (FS + 0.5) * SH, y = SH + 0.02;
  [0.12, 0.3, 0.48].forEach((d) => { const R = ring(ym, d); for (let k = 0; k < NF; k++) { const a = R[k], b = R[(k + 1) % NF]; lamPerim.push([a[0], y, a[1], b[0], y, b[1]]); } });
  const Z = zigzag(ring(ym, 0.62), 0.42, PI / 4);
  for (let k = 0; k + 1 < Z.length; k++) lamInf.push([Z[k][0], y, Z[k][1], Z[k + 1][0], y, Z[k + 1][1]]);
}
const segLen = (s) => Math.hypot(s[3] - s[0], s[4] - s[1], s[5] - s[2]);
const lamPL = lines(lamPerim.flat(), 0xffa31a, 2.6);
const lamIL = lines(lamInf.flat(), 0x5ac8fa, 1.7);
slabs[FS].grp.add(lamPL, lamIL);
const LP_LEN = lamPerim.reduce((a, s) => a + segLen(s), 0), LI_LEN = lamInf.reduce((a, s) => a + segLen(s), 0);
/* dibuja los primeros `len` de un recorrido; devuelve el extremo (local) o null */
function drawPartial(obj, segs, len) {
  const arr = obj.geometry.attributes.instanceStart.data.array;
  let n = 0, end = null;
  for (const s of segs) {
    if (len <= 0) break;
    const L = segLen(s);
    if (L <= len) { arr.set(s, 6 * n); end = [s[3], s[4], s[5]]; } else {
      const u = len / L, e = [s[0] + (s[3] - s[0]) * u, s[1] + (s[4] - s[1]) * u, s[2] + (s[5] - s[2]) * u];
      arr.set([s[0], s[1], s[2], e[0], e[1], e[2]], 6 * n); end = e;
    }
    len -= L; n++;
  }
  obj.geometry.attributes.instanceStart.data.needsUpdate = true;
  obj.geometry.instanceCount = n;
  obj.visible = n > 0;
  return end;
}

/* ------------------------------------------------------------ 03 impresión */
const prG = new T.Group(); scene.add(prG);
const fadeMats = [];
const fm = (m) => { m.transparent = true; fadeMats.push(m); return m; };
// cama
const bed = new T.Group(); prG.add(bed);
{
  const body = new T.Mesh(new RoundedBoxGeometry(25.6, 0.6, 25.6, 3, 0.25), fm(new T.MeshStandardMaterial({ color: 0x2a2b30, metalness: 0.8, roughness: 0.35 })));
  body.position.y = -0.31; body.receiveShadow = true;
  const top = new T.Mesh(new T.PlaneGeometry(25.2, 25.2), fm(new T.MeshStandardMaterial({ map: bedTex(), color: 0x8a8a8a, roughness: 0.78, metalness: 0.05, envMapIntensity: 0.3 })));
  top.rotation.x = -PI / 2; top.position.y = 0.004; top.receiveShadow = true;
  bed.add(body, top);
}
// cabezal: punta en el origen, frente hacia +z
const head = new T.Group(); prG.add(head);
const brass = new T.MeshStandardMaterial({ color: 0xd2a24c, metalness: 1, roughness: 0.28 });
const alu = new T.MeshStandardMaterial({ color: 0xc4c8d0, metalness: 1, roughness: 0.3 });
const steel = new T.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 1, roughness: 0.25 });
const sock = new T.MeshStandardMaterial({ color: 0x25252a, roughness: 0.62 });
const plast = new T.MeshStandardMaterial({ color: 0x1b1b1f, roughness: 0.5, envMapIntensity: 0.8 });
const hotTip = new T.MeshStandardMaterial({ color: 0x6b3a12, emissive: 0xff6a10, emissiveIntensity: 1.6, metalness: 0.6, roughness: 0.4 });
const led = new T.MeshBasicMaterial({ color: 0xffa31a, toneMapped: false });
{
  const add = (geo, mat, x, y, z, o = {}) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; m.castShadow = true; m.receiveShadow = true; head.add(m); return m; };
  add(new T.CylinderGeometry(0.1, 0.05, 0.12, 24), hotTip, 0, 0.06, 0);
  add(new T.CylinderGeometry(0.3, 0.1, 0.42, 24), brass, 0, 0.33, 0);
  add(new T.CylinderGeometry(0.44, 0.44, 0.26, 6), brass, 0, 0.67, 0);
  add(new RoundedBoxGeometry(2.0, 1.1, 1.7, 3, 0.2), sock, 0.25, 1.35, 0);
  add(new T.CylinderGeometry(0.14, 0.14, 0.6, 16), steel, 0, 2.2, 0);
  add(new T.CylinderGeometry(0.42, 0.42, 2.4, 24), alu, 0, 3.7, 0);
  for (let k = 0; k < 9; k++) add(new T.CylinderGeometry(1.05, 1.05, 0.1, 40), alu, 0, 2.62 + 0.27 * k, 0);
  add(new RoundedBoxGeometry(3.8, 3.4, 1.3, 3, 0.25), plast, 0, 3.55, 1.45);
  const front = add(new T.PlaneGeometry(3.45, 3.05), new T.MeshStandardMaterial({ map: shroudTex(), roughness: 0.5, envMapIntensity: 0.8 }), 0, 3.55, 2.106);
  front.castShadow = false;
  add(new RoundedBoxGeometry(2.6, 0.5, 1.0, 2, 0.12), plast, 0, 1.6, 1.55, { rx: 0.45 });
  add(new T.BoxGeometry(2.0, 0.07, 0.05), led, 0, 1.86, 2.08, { rx: 0.45 });
  add(new T.BoxGeometry(4.2, 4.6, 0.35), new T.MeshStandardMaterial({ color: 0x2c2d31, metalness: 0.7, roughness: 0.4 }), 0, 3.1, -1.4);
}
const beam = new T.Group(); prG.add(beam);
{
  const b = new T.Mesh(new T.BoxGeometry(36, 1.4, 1.8), new T.MeshStandardMaterial({ color: 0x2a2c31, metalness: 0.7, roughness: 0.42 }));
  const r = new T.Mesh(new T.BoxGeometry(36, 0.32, 0.22), steel);
  r.position.set(0, 0.25, 0.95); b.castShadow = true; beam.add(b, r);
}
const tipGlow = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: 0xff7a22, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
tipGlow.scale.set(1.3, 1.3, 1);
const tipLight = new T.PointLight(0xff7a20, 2.2, 4, 2);
prG.add(tipGlow, tipLight);
// pieza impresa (recortada a la altura actual) y su interior
const plaPiece = new T.Mesh(pieceGeo, [plaMat, plaCap]);
plaPiece.castShadow = plaPiece.receiveShadow = true;
const pieceG = new T.Group(); pieceG.add(plaPiece); prG.add(pieceG);
const inner = new T.Mesh(new T.BufferGeometry(), new T.MeshStandardMaterial({ color: 0x7a3608, roughness: 0.7, side: T.DoubleSide }));
pieceG.add(inner);
const beads = new T.Mesh(new T.BufferGeometry(), beadMat);
beads.castShadow = true; beads.receiveShadow = true;
pieceG.add(beads);

/* recorrido de una capa: perímetro exterior, interior y relleno; remuestreado cada 0,22 */
function resample(pts, step) {
  const o = [pts[0]];
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1], b = pts[k], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / step));
    for (let s = 1; s <= n; s++) o.push([a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n]);
  }
  return o;
}
const pathCache = new Map();
function layerPath(i) {
  if (pathCache.has(i)) return pathCache.get(i);
  const ym = (i + 0.5) * LH, solid = i < 3 || i >= NL - 4;
  const polys = [0.11, 0.33].map((d) => { const R = ring(ym, d), s0 = (i * 3) % NF, L = []; for (let k = 0; k <= NF; k++) L.push(R[(s0 + k) % NF]); return { pts: resample(L, 0.22), closed: true }; });
  polys.push({ pts: resample(zigzag(ring(ym, 0.5), solid ? 0.22 : 0.66, (i % 2 ? -1 : 1) * PI / 4), 0.22), closed: false });
  let acc = 0;
  polys.forEach((p) => { p.s = [acc]; for (let k = 1; k < p.pts.length; k++) { acc += Math.hypot(p.pts[k][0] - p.pts[k - 1][0], p.pts[k][1] - p.pts[k - 1][1]); p.s.push(acc); } });
  const r = { i, y: i * LH, polys, len: acc, perLen: polys[0].s[polys[0].s.length - 1] + (polys[1].s[polys[1].s.length - 1] - polys[1].s[0]) };
  pathCache.set(i, r);
  return r;
}
/* punto del recorrido a la longitud s */
function pathAt(P, s) {
  for (const p of P.polys) {
    const e = p.s[p.s.length - 1];
    if (s > e) continue;
    for (let k = 1; k < p.pts.length; k++) if (p.s[k] >= s) {
      const u = (s - p.s[k - 1]) / Math.max(1e-6, p.s[k] - p.s[k - 1]);
      return [mix(p.pts[k - 1][0], p.pts[k][0], u), mix(p.pts[k - 1][1], p.pts[k][1], u)];
    }
  }
  const p = P.polys[P.polys.length - 1]; return p.pts[p.pts.length - 1];
}
const XS = []; for (let q = 0; q <= 6; q++) { const th = PI * q / 6; XS.push([Math.cos(th), Math.sin(th)]); }
/* cordones de hilo: lista de capas {P, len, heatEnd, heatK} */
function buildBeads(list) {
  const pos = [], nor = [], hea = [], idx = [];
  const w = 0.23, h = LH * 1.08;
  for (const it of list) {
    const P = it.P, y0 = P.y - 0.012, lim = it.len;
    for (const p of P.polys) {
      if (p.s[0] >= lim) break;
      let m = p.pts.length; const pts = p.pts.slice(), sv = p.s.slice();
      let cut = m;
      for (let k = 1; k < m; k++) if (sv[k] > lim) { const u = (lim - sv[k - 1]) / (sv[k] - sv[k - 1]); pts[k] = [mix(pts[k - 1][0], pts[k][0], u), mix(pts[k - 1][1], pts[k][1], u)]; sv[k] = lim; cut = k + 1; break; }
      m = cut;
      if (m < 2) continue;
      const closed = p.closed && cut === p.pts.length;
      const base = pos.length / 3;
      for (let k = 0; k < m; k++) {
        const c = pts[k];
        let pv = k > 0 ? pts[k - 1] : (closed ? pts[m - 2] : null), nx = k < m - 1 ? pts[k + 1] : (closed ? pts[1] : null);
        let d1 = null, d2 = null;
        if (pv) { const l = Math.hypot(c[0] - pv[0], c[1] - pv[1]) || 1; d1 = [(c[0] - pv[0]) / l, (c[1] - pv[1]) / l]; }
        if (nx) { const l = Math.hypot(nx[0] - c[0], nx[1] - c[1]) || 1; d2 = [(nx[0] - c[0]) / l, (nx[1] - c[1]) / l]; }
        let tx = (d1 ? d1[0] : 0) + (d2 ? d2[0] : 0), tz = (d1 ? d1[1] : 0) + (d2 ? d2[1] : 0);
        const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const sx = -tz, sz = tx, ref = d1 || d2, mit = 1 / Math.max(0.4, Math.abs(sx * -ref[1] + sz * ref[0]));
        const ht = it.heatK ? it.heatK * Math.exp(-(it.heatEnd - sv[k]) / 1.1) : 0;
        for (const q of XS) {
          const ac = q[0] * w * 0.5 * mit;
          pos.push(c[0] + sx * ac, y0 + q[1] * h, c[1] + sz * ac);
          let nX = sx * q[0] / (w * 0.5), nY = q[1] / h, nZ = sz * q[0] / (w * 0.5); const nl = Math.hypot(nX, nY, nZ); nor.push(nX / nl, nY / nl, nZ / nl);
          hea.push(ht);
        }
      }
      for (let k = 0; k < m - 1; k++) for (let q = 0; q < 6; q++) {
        const a = base + k * 7 + q, b = a + 1, c = a + 7, d = a + 8;
        // orientación: la normal del triángulo debe coincidir con la de sus vértices
        const tri = (i0, i1, i2) => {
          const ax = pos[3 * i0], ay = pos[3 * i0 + 1], az = pos[3 * i0 + 2];
          const ux = pos[3 * i1] - ax, uy = pos[3 * i1 + 1] - ay, uz = pos[3 * i1 + 2] - az, vx = pos[3 * i2] - ax, vy = pos[3 * i2 + 1] - ay, vz = pos[3 * i2 + 2] - az;
          const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
          const dot = fx * (nor[3 * i0] + nor[3 * i1] + nor[3 * i2]) + fy * (nor[3 * i0 + 1] + nor[3 * i1 + 1] + nor[3 * i2 + 1]) + fz * (nor[3 * i0 + 2] + nor[3 * i1 + 2] + nor[3 * i2 + 2]);
          if (dot < 0) idx.push(i0, i2, i1); else idx.push(i0, i1, i2);
        };
        tri(a, c, d); tri(a, d, b);
      }
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  geo.setAttribute('heat', new T.Float32BufferAttribute(hea, 1));
  geo.setIndex(idx);
  return geo;
}
// línea de purga al frente de la cama
const purge = (() => { const p = { y: 0, polys: [{ pts: resample([[-9, 9.6], [3, 9.6]], 0.5), closed: false }] }; p.polys[0].s = p.polys[0].pts.map((q) => q[0] + 9); return p; })();

/* tiempos de la impresión */
const P0 = layerPath(0), P1 = layerPath(1);
const TA = 17.05, TB = 21.0, VP = 18, VI = 30;
function closeLen(t) { const u = Math.max(0, t - TA), tp = P1.perLen / VP; return u <= tp ? u * VP : Math.min(P1.len, P1.perLen + (u - tp) * VI); }
const F_END = closeLen(TB) / P1.len;
function layersAt(t) { return t < TB ? 1 + closeLen(t) / P1.len : mix(1 + F_END, NL, ss(TB, 27.3, t)); }
function lissa(t, y) { const r = prof(clamp(y / HH)) * 0.55; return [r * Math.sin(2.3 * t + 0.4), r * Math.sin(1.7 * t + 1.9)]; }
/* posición de la boquilla (x, z, y de la punta) */
function nozzle(t) {
  const Lc = layersAt(t), c = Math.min(NL - 1, Math.floor(Lc)), f = Lc >= NL ? 1 : Lc - c, P = layerPath(c);
  const e = t < TB ? pathAt(P1, closeLen(t)) : pathAt(P, f * P.len);
  const y = (c + 1) * LH + 0.02;
  const w = ss(TB, TB + 1.0, t) * (1 - ss(26.4, 27.2, t));
  const l = lissa(t, y);
  return [mix(e[0], l[0], w), y, mix(e[1], l[1], w)];
}

/* ------------------------------------------------------------ cámara */
function fit(y0, y1, el, a = 0.36, b = 0.80) {
  const Hh = 1.06 * (y1 - y0) / (2 * (b - a)), d = Hh / Math.tan(15 * PI / 180);
  return { d, ty: (y0 + y1) / 2 + ((a + b) / 2 - 0.5) * 2 * Hh * Math.cos(el) };
}
function setCam(c) {
  const ce = Math.cos(c.el);
  camera.position.set(c.tx + c.d * Math.sin(c.az) * ce, c.ty + c.d * Math.sin(c.el), c.tz + c.d * Math.cos(c.az) * ce);
  camera.lookAt(c.tx, c.ty, c.tz);
  camera.updateProjectionMatrix();
}
const blendCam = (A, B, u) => ({ tx: mix(A.tx, B.tx, u), ty: mix(A.ty, B.ty, u), tz: mix(A.tz, B.tz, u), d: mix(A.d, B.d, u), az: mix(A.az, B.az, u), el: mix(A.el, B.el, u) });
const gap = (t) => 0.4 * eio(lin(11.4, 12.8, t));
const SW0 = 10.4, SW1 = 11.3;
const sweepY = (t) => mix(-0.3, HH + 0.3, eio(lin(SW0, SW1, t)));
const focus = (t) => ss(12.7, 14.1, t);
function slabY(i, t) { const f = focus(t); return i * SH + i * gap(t) + (i > FS ? 6 * eio(f) : 0); }

function camAt(t) {
  if (t < S3) {
    const az = -0.55 + 0.15 * (t - S1), el0 = 0.3;
    if (t < S2 + 0.8) {
      const f = fit(0, HH, el0), k = mix(1.1, 1, eo(lin(S1, 6.8, t)));
      return { tx: 0, ty: f.ty, tz: 0, d: f.d * k, az, el: el0 };
    }
    const top = HH + (NS - 1) * gap(t), el = mix(el0, 0.46, ss(11.0, 12.8, t));
    const f = fit(0, top, el);
    const A = { tx: 0, ty: f.ty, tz: 0, d: f.d, az, el };
    const yF = slabY(FS, t) + SH;
    const B = { tx: 0, ty: yF + 3.4, tz: 0, d: 45, az: az + 0.1, el: 0.92 };
    return blendCam(A, B, eio(focus(t)));
  }
  // impresión
  const n = nozzle(t);
  let sx = 0, sz = 0; for (let k = 0; k < 10; k++) { const p = nozzle(Math.max(S3, t - k * 0.09)); sx += p[0]; sz += p[2]; }
  sx /= 10; sz /= 10;
  const el = mix(0.27, 0.22, ss(21, 27, t)), top = Math.max(6.0, n[1] + 5.2), f = fit(0, top, el);
  const follow = 0.55 * (1 - ss(20.6, 22.6, t));
  const Pc = { tx: sx * follow, ty: f.ty, tz: sz * follow, d: f.d, az: 0.42 + 0.06 * (t - S3), el };
  if (t < 27.4) return Pc;
  const lift = 0.7 * eio(lin(28.3, 29.6, t));
  const fa = fit(lift, HH + lift, 0.2, 0.36, 0.82);
  const Pa = { tx: 0, ty: fa.ty, tz: 0, d: fa.d, az: 0.42 + 0.06 * (t - S3), el: 0.2 };
  return blendCam(Pc, Pa, eio(lin(27.4, 29.2, t)));
}

/* ------------------------------------------------------------ estado 3D por tiempo */
const tmpV = new T.Vector3();
let last = { lam: null };
function update(t) {
  const inMod = t >= S1 - 0.1 && t < S3, inPr = t >= S3;
  modG.visible = inMod; lamG.visible = t >= S2 && t < S3; prG.visible = inPr;
  grid.visible = inMod;
  setCam(camAt(t));

  if (!inPr) {
    place(key, 0.9, 0.95); place(rim, -2.4, 0.5); place(fill, -0.9, 0.2);
    key.intensity = 2.4; rim.intensity = 1.6; fill.intensity = 0.45; hemi.intensity = 0.35;
    key.target.position.set(0, 5, 0);
    ground.visible = true; ground.position.y = 0;
    gridMat.uniforms.uOp.value = ss(S1, S1 + 0.8, t) * (1 - 0.5 * ss(12.6, 14, t));
    // reconstrucción de las líneas, de abajo hacia arriba
    const rev = mix(-0.3, HH + 0.4, eio(lin(S1 + 0.15, 6.0, t)));
    revPlane.constant = rev;
    const sw = sweepY(t), slicing = t > SW0 - 0.2 && t < SW1 + 0.2;
    clayClip.constant = t >= SW0 ? -sw : 1000;
    slabClip.constant = t >= SW0 ? sw : -1000;
    if (t >= SW1) slabClip.constant = 1000;
    const sOn = (t < 6.2 && rev > 0 && rev < HH) || slicing;
    scan.visible = scanGlow.visible = slicePlane.visible = sOn;
    if (sOn) {
      const yy = slicing ? clamp(sw, 0.001, HH - 0.001) : rev, R = ring(yy);
      setLoop(scan, R, yy); setLoop(scanGlow, R, yy);
      slicePlane.geometry.dispose(); slicePlane.geometry = polyGeo(R.map((q) => [q[0] * 1.01, q[1] * 1.01]), yy);
      const a = slicing ? ss(SW0 - 0.2, SW0 + 0.05, t) * (1 - ss(SW1 - 0.1, SW1 + 0.15, t)) : ss(S1 + 0.1, S1 + 0.5, t) * (1 - ss(5.7, 6.1, t));
      scan.material.color.setHex(slicing ? 0xffd08a : 0xbfe0ff); scanGlow.material.color.setHex(slicing ? 0xff9f0a : 0x4f9dff); slicePlane.material.color.setHex(slicing ? 0xff9f0a : 0x3d8bff);
      scan.material.opacity = a; scanGlow.material.opacity = 0.22 * a; slicePlane.material.opacity = (slicing ? 0.24 : 0.16) * a;
    }
    // la arcilla aparece y las líneas pasan a ser aristas
    const cl = ss(5.3, 6.6, t) * (t < SW1 ? 1 : 0);
    clayMat.opacity = cl; clay.visible = cl > 0.002; clayMat.transparent = cl < 0.999; clayMat.depthWrite = cl > 0.5;
    const wc = new T.Color(0x8fc1ff).lerp(new T.Color(0x39414f), ss(5.4, 6.6, t));
    wire.material.color.copy(wc);
    wire.material.opacity = (1 - 0.35 * ss(5.4, 6.6, t)) * (t < SW1 ? 1 : 0);
    wire.visible = wire.material.opacity > 0.002;
    // laminado
    if (lamG.visible) {
      const app = t >= SW0 ? 1 : 0, f = focus(t);
      slabs.forEach((s, i) => {
        s.grp.position.y = slabY(i, t);
        let op = app;
        if (i > FS) op *= 1 - ss(12.7, 13.6, t);
        s.mat.opacity = op; s.mesh.visible = op > 0.003;
        s.mat.transparent = op < 0.999; s.mat.depthWrite = op > 0.5;
        s.mat.color.setHex(0xe4e7ec).lerp(new T.Color(i === FS ? 0x2c3038 : 0x24272d), f * (i === FS ? 1 : 0.9));
        s.ol.material.opacity = op * (i === FS ? 1 : 1 - 0.75 * f);
        s.ol.visible = s.ol.material.opacity > 0.003;
      });
      const u = lin(13.7, 15.7, t), tot = LP_LEN + LI_LEN, L = eio(u) * tot;
      const e1 = drawPartial(lamPL, lamPerim, Math.min(L, LP_LEN));
      const e2 = drawPartial(lamIL, lamInf, L - LP_LEN);
      const e = e2 || e1;
      slabs[FS].grp.updateMatrixWorld(true);
      last.lam = e && u > 0 && u < 1 ? slabs[FS].grp.localToWorld(tmpV.set(e[0], e[1], e[2])).clone() : null;
    } else last.lam = null;
    return;
  }

  // ---- impresión y acabado
  ground.visible = true; ground.position.y = 0;
  const bedOp = 1 - ss(28.0, 28.9, t);
  fadeMats.forEach((m) => { m.opacity = bedOp; m.depthWrite = bedOp > 0.5; });
  bed.visible = bedOp > 0.003;
  const sweep = lin(S4, S5, t);
  if (t < S4) { place(key, 0.55, 1.05); key.intensity = 2.1; rim.intensity = 2.0; place(rim, -2.6, 0.55); }
  else { place(key, mix(-1.3, 1.5, eio(sweep)), 0.62); key.intensity = 2.4; rim.intensity = 2.4; place(rim, mix(-2.8, -1.9, sweep), 0.5); }
  place(fill, -0.9, 0.2); fill.intensity = 0.45; hemi.intensity = 0.3;
  key.target.position.set(0, 3, 0);

  const Lc = layersAt(t), c = Math.min(NL, Math.floor(Lc)), f = Lc - c, n = nozzle(t);
  const park = eio(lin(27.35, 28.6, t));
  head.position.set(n[0], n[1] + 14 * park, n[2] - 4 * park);
  beam.position.set(0, head.position.y + 2.9, head.position.z - 2.4);
  head.visible = beam.visible = park < 0.999;
  const printing = t < 27.3;
  const hot = ss(S3, S3 + 0.3, t) * (1 - ss(27.2, 27.6, t));
  tipGlow.position.set(n[0], n[1] + 0.03 + 14 * park, n[2] - 4 * park); tipGlow.material.opacity = 0.85 * hot; tipGlow.visible = hot > 0.01;
  tipLight.position.set(n[0], n[1] + 0.25, n[2]); tipLight.intensity = 2.2 * hot;
  hotTip.emissiveIntensity = 0.3 + 1.4 * hot;

  // pieza y cordones
  const list = [];
  const done = Lc >= NL - 0.001 || t >= 27.3;
  if (t < TB) {
    list.push({ P: P0, len: Infinity }, { P: P1, len: closeLen(t), heatEnd: closeLen(t), heatK: hot });
    list.push({ P: purge, len: Infinity });
    clipPlane.constant = -1; inner.visible = false;
  } else if (!done) {
    const wk = 1 - 0.8 * ss(TB, TB + 1.0, t) * (1 - ss(26.4, 27.2, t));
    if (c >= 1) list.push({ P: layerPath(c - 1), len: Infinity });
    if (c < NL) { const P = layerPath(c); list.push({ P, len: f * P.len, heatEnd: f * P.len, heatK: hot * wk }); }
    if (c <= 2) list.push({ P: purge, len: Infinity });
    const cy = (c - 1) * LH;
    clipPlane.constant = cy;
    inner.visible = c >= 2;
    if (inner.visible) { inner.geometry.dispose(); inner.geometry = polyGeo(ring(cy, 0.02), cy - 0.002); }
  } else {
    clipPlane.constant = 100; inner.visible = false;
  }
  beads.geometry.dispose();
  beads.geometry = list.length ? buildBeads(list) : new T.BufferGeometry();
  beads.visible = list.length > 0;
  pieceG.position.y = 0.7 * eio(lin(28.3, 29.6, t));
  pieceG.rotation.y = t > 28.0 ? 0.5 * (t - 28.0) * ss(28.0, 29.2, t) : 0;
  ground.visible = bedOp < 0.999;
}

/* ------------------------------------------------------------ 2D: fondo, textos, interfaz */
const FONT = 'Inter, system-ui, sans-serif';
const AMBER = '#ffa31a';
const GLOW = [[0, 255, 159, 10, 0.0], [1.2, 255, 159, 10, 0.1], [S1, 90, 140, 255, 0.15], [S2, 60, 185, 255, 0.13], [S3, 255, 128, 30, 0.15], [S4, 255, 170, 90, 0.17], [S5, 255, 159, 10, 0.12], [END, 255, 159, 10, 0.12]];
function glowAt(t) {
  for (let k = 0; k < GLOW.length - 1; k++) {
    const a = GLOW[k], b = GLOW[k + 1];
    if (t <= b[0]) { const u = ss(Math.max(a[0], b[0] - 1.0), b[0], t); return a.slice(1).map((v, i) => mix(v, b[i + 1], u)); }
  }
  return GLOW[GLOW.length - 1].slice(1);
}
function background(t) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0f1013'); gr.addColorStop(1, '#060607');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const [r, gg, b, a] = glowAt(t);
  const rg = g.createRadialGradient(W * 0.5, H * 0.6, 0, W * 0.5, H * 0.6, W * 0.9);
  rg.addColorStop(0, `rgba(${r | 0},${gg | 0},${b | 0},${a})`); rg.addColorStop(0.55, `rgba(${r | 0},${gg | 0},${b | 0},${a * 0.35})`); rg.addColorStop(1, `rgba(${r | 0},${gg | 0},${b | 0},0)`);
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
}
function font(size, weight) { return `${weight} ${size}px ${FONT}`; }
function text(s, x, y, size, weight, color, alpha, o = {}) {
  if (alpha <= 0.002) return;
  g.save(); g.globalAlpha = alpha; g.font = font(size, weight); g.fillStyle = color; g.textAlign = o.align || 'left'; g.textBaseline = 'alphabetic';
  g.letterSpacing = (o.ls || 0) + 'px';
  g.fillText(s, x, y); g.restore();
}
function wrap(s, size, weight, maxW) {
  g.font = font(size, weight); g.letterSpacing = '0px';
  const words = s.split(' '), out = []; let line = '';
  for (const w of words) { const tl = line ? line + ' ' + w : w; if (g.measureText(tl).width > maxW && line) { out.push(line); line = w; } else line = tl; }
  if (line) out.push(line);
  return out;
}
const anim = (t, t0, t1, d) => {
  const i = eo(lin(t0 + d, t0 + d + 0.7, t)), o = 1 - ss(t1 - 0.5 + d * 0.4, t1 - 0.12 + d * 0.4, t);
  return { a: i * o, dy: (1 - i) * 26 - (1 - o) * 10 };
};
function rrect(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function logo(x, y, w, alpha, color = '#f5f5f7') { if (alpha <= 0.002) return; g.save(); g.globalAlpha = alpha; drawLogo(null, g, x, y, w, color); g.restore(); }

function stepText(t, s) {
  if (t < s.t0 - 0.1 || t > s.t1 + 0.1) return;
  const A = anim(t, s.t0, s.t1, 0.15), B = anim(t, s.t0, s.t1, 0.25), C = anim(t, s.t0, s.t1, 0.35);
  text(s.n, 56, 172 + A.dy, 22, 700, AMBER, A.a, { ls: 2 });
  g.font = font(22, 700); g.letterSpacing = '2px'; const nw = g.measureText(s.n).width;
  text('·  ' + s.k, 56 + nw + 10, 172 + A.dy, 22, 600, '#c7c7cc', A.a, { ls: 3 });
  text(s.title, 54, 244 + B.dy, 68, 700, '#f5f5f7', B.a, { ls: -1.2 });
  wrap(s.body, 30, 400, 600).forEach((l, k) => text(l, 56, 302 + k * 42 + C.dy, 30, 400, '#a1a1a6', C.a));
}
function chips(cx, y, list, alpha) {
  if (alpha <= 0.002) return;
  const H0 = 42, padX = 16, gapX = 10;
  g.save(); g.letterSpacing = '0px';
  const ws = list.map((c) => {
    g.font = font(20, 500); let w = padX * 2 + (c.dot ? 18 : 0) + g.measureText(c.label).width;
    if (c.value) { g.font = font(20, 600); w += 8 + g.measureText(c.value).width; }
    return w;
  });
  const total = ws.reduce((a, b) => a + b, 0) + gapX * (list.length - 1);
  let x = cx - total / 2;
  list.forEach((c, k) => {
    const a = alpha * (c.a == null ? 1 : c.a);
    g.globalAlpha = a;
    rrect(x, y, ws[k], H0, H0 / 2); g.fillStyle = 'rgba(255,255,255,0.075)'; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = 1; g.stroke();
    let tx = x + padX;
    if (c.dot) { g.fillStyle = c.dot; g.beginPath(); g.arc(tx + 5, y + H0 / 2, 5, 0, TAU); g.fill(); tx += 18; }
    g.font = font(20, 500); g.fillStyle = c.value ? '#a1a1a6' : '#f5f5f7'; g.textBaseline = 'middle'; g.fillText(c.label, tx, y + H0 / 2 + 1);
    if (c.value) { const lw = g.measureText(c.label).width; g.font = font(20, 600); g.fillStyle = '#f5f5f7'; g.fillText(c.value, tx + lw + 8, y + H0 / 2 + 1); }
    x += ws[k] + gapX;
  });
  g.restore();
}
function project(x, y, z) { tmpV.set(x, y, z).project(camera); return [(tmpV.x * 0.5 + 0.5) * W, (-tmpV.y * 0.5 + 0.5) * H]; }

function dimensions(t) {
  const a = 1 - ss(9.7, 10.1, t);
  if (t < 6.5 || a <= 0) return;
  const c = camAt(t), rx = Math.cos(c.az), rz = -Math.sin(c.az);
  g.save(); g.lineCap = 'round';
  // alto
  const off = RMAX + 1.25, A = project(rx * off, 0, rz * off), B = project(rx * off, HH, rz * off);
  const u = eio(lin(6.6, 7.4, t)), M = [mix(A[0], B[0], 0.5), mix(A[1], B[1], 0.5)];
  const P1 = [mix(M[0], A[0], u), mix(M[1], A[1], u)], P2 = [mix(M[0], B[0], u), mix(M[1], B[1], u)];
  g.globalAlpha = a * 0.9; g.strokeStyle = '#f5f5f7'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(P1[0], P1[1]); g.lineTo(P2[0], P2[1]); g.stroke();
  const ang = Math.atan2(B[1] - A[1], B[0] - A[0]), px = -Math.sin(ang), py = Math.cos(ang);
  [P1, P2].forEach((p) => { g.beginPath(); g.moveTo(p[0] - px * 9, p[1] - py * 9); g.lineTo(p[0] + px * 9, p[1] + py * 9); g.stroke(); });
  // líneas de referencia hacia la pieza
  g.globalAlpha = a * 0.45 * u; g.setLineDash([4, 5]); g.lineWidth = 1.2;
  [[0, prof(0)], [HH, prof(1)]].forEach(([y, r]) => { const p = project(rx * r, y, rz * r), q = project(rx * (off + 0.35), y, rz * (off + 0.35)); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); });
  g.setLineDash([]);
  // diámetro
  const v = eio(lin(7.0, 7.9, t)), R = RMAX + 0.3, n = 72, pts = [];
  for (let k = 0; k <= n * v; k++) { const th = c.az + TAU * k / n; pts.push(project(R * Math.sin(th), YMAX, R * Math.cos(th))); }
  g.globalAlpha = a * 0.8; g.setLineDash([6, 6]); g.lineWidth = 1.6; g.beginPath();
  pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); g.setLineDash([]);
  g.restore();
  // rótulos
  const la = a * ss(7.3, 7.9, t);
  if (la > 0.002) {
    g.save(); g.globalAlpha = la; g.translate(M[0] + 2, M[1]); g.rotate(ang);
    g.font = font(21, 600); g.letterSpacing = '0px'; const s = '120 mm', w = g.measureText(s).width + 24;
    rrect(-w / 2, -16, w, 32, 16); g.fillStyle = 'rgba(28,28,31,0.92)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#f5f5f7'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, 1); g.restore();
    const F = project(R * Math.sin(c.az), YMAX, R * Math.cos(c.az));
    const s2 = 'Ø ' + Math.round(RMAX * 20) + ' mm';
    g.save(); g.globalAlpha = la; g.font = font(21, 600); const w2 = g.measureText(s2).width + 24;
    rrect(F[0] - w2 / 2, F[1] + 14, w2, 32, 16); g.fillStyle = 'rgba(28,28,31,0.92)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#f5f5f7'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s2, F[0], F[1] + 31); g.restore();
  }
}
function gizmo(t, alpha) {
  if (alpha <= 0.002) return;
  const cx = 86, cy = 1088, L = 30, m = camera.matrixWorldInverse;
  const ax = [[1, 0, 0, '#ff453a', 'X'], [0, 1, 0, '#30d158', 'Y'], [0, 0, 1, '#0a84ff', 'Z']].map((q) => {
    tmpV.set(q[0], q[1], q[2]).transformDirection(m); return { x: tmpV.x, y: -tmpV.y, z: tmpV.z, c: q[3], n: q[4] };
  }).sort((p, q) => p.z - q.z);
  g.save(); g.globalAlpha = alpha;
  rrect(cx - 50, cy - 50, 100, 100, 22); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.12)'; g.stroke();
  g.lineCap = 'round';
  ax.forEach((p) => {
    g.strokeStyle = p.c; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + p.x * L, cy + p.y * L); g.stroke();
    g.fillStyle = p.c; g.beginPath(); g.arc(cx + p.x * L, cy + p.y * L, 8, 0, TAU); g.fill();
    g.fillStyle = '#0b0b0d'; g.font = font(11, 700); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.n, cx + p.x * L, cy + p.y * L + 0.5);
  });
  g.restore();
}
function progressBars(t) {
  const a = ss(S1 - 0.4, S1 + 0.3, t) * (1 - ss(S5 - 0.1, S5 + 0.4, t));
  if (a <= 0.002) return;
  const x0 = 56, tw = 608, gp = 8, sw = (tw - gp * 3) / 4, y = 40;
  g.save(); g.globalAlpha = a;
  STEPS.forEach((s, k) => {
    const x = x0 + k * (sw + gp), p = clamp((t - s.t0) / (s.t1 - s.t0));
    rrect(x, y, sw, 4, 2); g.fillStyle = 'rgba(255,255,255,0.16)'; g.fill();
    if (p > 0) { rrect(x, y, Math.max(4, sw * p), 4, 2); g.fillStyle = t >= s.t1 ? 'rgba(245,245,247,0.8)' : AMBER; g.fill(); }
  });
  g.restore();
}
function intro(t) {
  if (t > S1 + 0.1) return;
  const A = anim(t, 0.15, S1, 0.2), B = anim(t, 0.15, S1, 0.32), B2 = anim(t, 0.15, S1, 0.42), C = anim(t, 0.15, S1, 0.55);
  text('IMPRESIÓN 3D', 56, 236 + A.dy, 22, 700, AMBER, A.a, { ls: 4 });
  text('Así nace', 52, 336 + B.dy, 92, 700, '#f5f5f7', B.a, { ls: -2 });
  text('una pieza', 52, 432 + B2.dy, 92, 700, '#f5f5f7', B2.a, { ls: -2 });
  text('Del archivo al objeto, en cuatro pasos.', 56, 500 + C.dy, 30, 400, '#a1a1a6', C.a);
  NAMES.forEach((nm, k) => {
    const R = anim(t, 0.15, S1, 0.9 + k * 0.14), y = 600 + k * 104;
    g.save(); g.globalAlpha = R.a; g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(56, y - 64 + R.dy, 608 * eo(lin(1.0 + k * 0.14, 1.8 + k * 0.14, t)), 1); g.restore();
    text('0' + (k + 1), 56, y + R.dy, 26, 700, AMBER, R.a, { ls: 1 });
    text(nm, 118, y + R.dy, 46, 600, '#f5f5f7', R.a, { ls: -0.6 });
  });
}
function outro(t) {
  if (t < S5) return;
  const a = eo(lin(S5 + 0.4, S5 + 1.3, t)), sc = mix(0.94, 1, eo(lin(S5 + 0.4, S5 + 1.6, t)));
  const w = 480 * sc, h = w * LVB[1] / LVB[0];
  logo(360 - w / 2, 590 - h / 2, w, a);
  const b = eo(lin(S5 + 0.9, S5 + 1.7, t)), c = eo(lin(S5 + 1.3, S5 + 2.1, t));
  text('Diseña · Imprime · Crea', 360, 712 + (1 - b) * 16, 34, 500, '#d1d1d6', b, { align: 'center', ls: 0.5 });
  text('Cuéntanos tu idea en el mostrador', 360, 776 + (1 - c) * 16, 26, 500, AMBER, c, { align: 'center' });
}
function hud(t) {
  // modelado: ejes de la vista
  gizmo(t, ss(S1 + 0.4, S1 + 1.2, t) * (1 - ss(S2 - 0.4, S2, t)));
  // laminado
  const la = ss(13.5, 14.1, t) * (1 - ss(16.2, 16.6, t));
  chips(360, 1066, [{ label: 'Capa', value: Math.round((FS + 0.5) / NS * 600) + ' / 600' }, { dot: AMBER, label: 'Perímetros' }, { dot: '#5ac8fa', label: 'Relleno', value: '15 %' }], la);
  if (last.lam && la > 0) {
    const p = project(last.lam.x, last.lam.y, last.lam.z), gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], 22);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(160,225,255,0.8)'); gr.addColorStop(1, 'rgba(90,200,250,0)');
    g.save(); g.globalAlpha = la; g.fillStyle = gr; g.fillRect(p[0] - 22, p[1] - 22, 44, 44); g.restore();
  }
  // impresión
  const pa = ss(S3 + 0.3, S3 + 0.9, t) * (1 - ss(S4 - 0.5, S4 - 0.1, t));
  if (pa > 0.002) {
    const tl = ss(TB - 0.2, TB + 0.3, t);
    chips(360, 1040, [{ dot: '#ff5a1f', label: 'Boquilla', value: '210 °C' }, { dot: '#ffb340', label: 'Cama', value: '60 °C' }, { dot: tl > 0.5 ? '#64d2ff' : '#30d158', label: tl > 0.5 ? 'Time-lapse' : 'Tiempo real', a: tl > 0.5 ? ss(0.5, 1, tl) : 1 - ss(0, 0.5, tl) }], pa);
    const Lc = Math.min(NL, layersAt(t)), lay = Math.max(1, Math.round(Lc / NL * 600)), pc = Math.round(Lc / NL * 100);
    g.save(); g.globalAlpha = pa;
    g.font = font(21, 500); g.fillStyle = '#a1a1a6'; g.textBaseline = 'alphabetic'; g.letterSpacing = '0px'; g.fillText('Capa', 56, 1124);
    const cw = g.measureText('Capa ').width; g.font = font(21, 600); g.fillStyle = '#f5f5f7'; g.fillText(lay + ' / 600', 56 + cw, 1124);
    g.textAlign = 'right'; g.fillText(pc + ' %', 664, 1124);
    rrect(56, 1138, 608, 5, 2.5); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fill();
    rrect(56, 1138, Math.max(5, 608 * Lc / NL), 5, 2.5); g.fillStyle = AMBER; g.fill();
    g.restore();
  }
  // acabado
  const aa = ss(29.4, 30.1, t) * (1 - ss(S5 - 0.5, S5 - 0.1, t));
  chips(360, 1066, [{ label: 'Material', value: 'PLA' }, { label: 'Peso', value: '135 g' }, { label: 'Tiempo', value: '9 h 10 min' }], aa);
}

const noise = new Int8Array(W * H);
{ let s = 12345; for (let k = 0; k < noise.length; k++) { s = (s * 1103515245 + 12345) & 0x7fffffff; noise[k] = ((s >> 16) % 3) - 1; } }
const scrimCol = [15, 16, 19];
function compose(t) {
  background(t);
  let a3 = 0;
  if (t >= S1 - 0.1) a3 = t < S3 ? 1 - ss(16.35, S3, t) : t < S5 ? ss(S3, S3 + 0.45, t) : 1 - ss(S5, S5 + 0.6, t);
  if (a3 > 0.002) { g.save(); g.globalAlpha = a3; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(renderer.domElement, 0, 0, W, H); g.restore(); }
  dimensions(t);
  // velo superior: los textos siempre sobre fondo limpio
  const sg = g.createLinearGradient(0, 0, 0, 470);
  sg.addColorStop(0, `rgba(${scrimCol},0.94)`); sg.addColorStop(0.72, `rgba(${scrimCol},0.82)`); sg.addColorStop(1, `rgba(${scrimCol},0)`);
  g.fillStyle = sg; g.fillRect(0, 0, W, 470);
  const bg2 = g.createLinearGradient(0, 940, 0, H);
  bg2.addColorStop(0, 'rgba(6,6,7,0)'); bg2.addColorStop(0.55, 'rgba(6,6,7,0.72)'); bg2.addColorStop(1, 'rgba(6,6,7,0.9)');
  g.fillStyle = bg2; g.fillRect(0, 940, W, H - 940);
  hud(t);
  progressBars(t);
  logo(56, 70, 128, ss(0.2, 0.9, t) * (1 - ss(S5 - 0.2, S5 + 0.3, t)), '#f5f5f7');
  intro(t);
  STEPS.forEach((s) => stepText(t, s));
  outro(t);
  const blk = Math.max(1 - ss(0, 0.7, t), ss(35.15, 35.97, t));
  if (blk > 0.001) { g.fillStyle = `rgba(0,0,0,${blk})`; g.fillRect(0, 0, W, H); }
  const im = g.getImageData(0, 0, W, H), d = im.data;
  for (let k = 0, p = 0; k < d.length; k += 4, p++) { const n = noise[p]; d[k] += n; d[k + 1] += n; d[k + 2] += n; }
  g.putImageData(im, 0, 0);
}

function renderAt(t) {
  update(t);
  renderer.render(scene, camera);
  compose(t);
}
window.N = NFR;
window.FPS = FPS;
window.renderAt = (t) => { renderAt(t); return out.toDataURL('image/png'); };
window.render = (i) => window.renderAt(i / FPS);
window.ready = Promise.all([400, 500, 600, 700].map((w) => document.fonts.load(`${w} 40px Inter`))).then(() => { renderAt(0); return true; });

/* vista previa en el navegador */
if (!Q.has('render')) {
  window.ready.then(() => {
    if (Q.has('t')) { renderAt(Number(Q.get('t'))); return; }
    const t0 = performance.now();
    const loop = (now) => { renderAt(((now - t0) / 1000) % DUR); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });
}
