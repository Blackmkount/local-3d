/* global L3D */
/* Video de las dos pantallas exteriores (assets/video/pantalla-exterior.mp4): invita a entrar a BlackForge
   y a conocer la impresión 3D. Las dos pantallas de los pilares reproducen el mismo archivo.
   Vertical 720 × 1280, 30 fps, 24 s, en bucle (empieza y termina en negro). Todo se dibuja aquí: la escena
   con three.js y los textos encima, en un lienzo 2D. Textos grandes y pocos: se lee caminando por el pasillo.
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
const W = 720, H = 1280, FPS = 30, DUR = 24, NFR = FPS * DUR;
const SS = Number(Q.get('ss') || 1.5);
const GW = Math.round(W * SS), GH = Math.round(H * SS);
const PI = Math.PI, TAU = PI * 2;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (a, b, x) => clamp((x - a) / (b - a));
const ss = (a, b, x) => { const u = lin(a, b, x); return u * u * (3 - 2 * u); };
const eo = (u) => 1 - Math.pow(1 - clamp(u), 3);
const eio = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const mix = (a, b, u) => a + (b - a) * u;
const win = (t, a, b, f = 0.5) => ss(a, a + f, t) * (1 - ss(b - f, b, t));   // ventana con entrada y salida suaves

/* ------------------------------------------------------------ guion
   1 · ¿Lo imaginas?   el robot aparece dibujado en líneas, como en el programa de diseño
   2 · Lo imprimimos   la boquilla lo levanta capa por capa, con el hilo aún caliente
   3 · Piezas únicas   el robot se suma a una vitrina giratoria: figuras, decoración, regalos, personalizados, prototipos
   4 · El mundo 3D     tres razones para entrar
   5 · Entra y crea    logotipo y cierre en negro */
const A0 = 0, B0 = 5.2, C0 = 11.2, D0 = 17.4, E0 = 20.6;
const CATS = [
  { k: 'Figuras', d: 'Personajes y coleccionables' },
  { k: 'Decoración', d: 'Jarrones, lámparas y más' },
  { k: 'Regalos', d: 'Detalles que nadie más tiene' },
  { k: 'Personalizados', d: 'Con tu nombre o tu logo' },
  { k: 'Prototipos', d: 'Piezas y repuestos a medida' }
];
const WHY = [
  { ic: 'eye', t: 'Mira las impresoras', s: 'trabajando en vivo' },
  { ic: 'bulb', t: 'Trae tu idea', s: 'y la diseñamos contigo' },
  { ic: 'bag', t: 'Llévate tu pieza', s: 'hecha en el taller' }
];
const AMBER = '#ffa31a', INK = '#f5f5f7', SUB = '#a1a1a6';

/* ------------------------------------------------------------ render */
const out = document.getElementById('out');
const g = out.getContext('2d');
const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(GW, GH, false);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.localClippingEnabled = true;

const scene = new T.Scene();
const pmrem = new T.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
const camera = new T.PerspectiveCamera(30, W / H, 1, 400);

const key = new T.DirectionalLight(0xfff1e0, 2.3);
key.position.set(14, 30, 22); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 5, far: 80 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
const rim = new T.DirectionalLight(0xffb36b, 1.7); rim.position.set(-20, 14, -24);
const fill = new T.DirectionalLight(0xbfd4ff, 0.5); fill.position.set(-18, 6, 20);
scene.add(new T.HemisphereLight(0xdfe8ff, 0x1a1410, 0.3), key, rim, fill);

const ground = new T.Mesh(new T.PlaneGeometry(90, 90), new T.ShadowMaterial({ opacity: 0.45, transparent: true }));
ground.rotation.x = -PI / 2; ground.receiveShadow = true; ground.renderOrder = -2;
scene.add(ground);

/* ------------------------------------------------------------ materiales
   Plástico impreso: las capas de 0.2 mm se notan como líneas finas, y en el robot que se imprime la franja
   recién depositada brilla de calor justo debajo del corte. */
function pla(color, cut) {
  const m = new T.MeshPhysicalMaterial({ color, roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.8, side: T.DoubleSide });
  const u = cut || { value: 1e3 };
  m.userData.cut = u;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCut = u;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vWY;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWY = (modelMatrix * vec4(transformed, 1.0)).y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vWY;\nuniform float uCut;')
      .replace('#include <color_fragment>', '#include <color_fragment>\nfloat lay = abs(fract(vWY / 0.07) - 0.5) * 2.0;\ndiffuseColor.rgb *= 0.9 + 0.1 * smoothstep(0.0, 0.5, lay);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nfloat hot = smoothstep(0.4, 0.0, uCut - vWY) * step(vWY, uCut);\ntotalEmissiveRadiance += vec3(1.0, 0.36, 0.06) * hot * hot * 1.3;');
  };
  return m;
}
const cut = { value: 1e3 };
const clip = new T.Plane(new T.Vector3(0, -1, 0), 1e3);
const PLA = 0xff7c0a;
const robotMat = pla(PLA, cut), robotDark = pla(0x1c1c20, cut), robotGlow = pla(0xfff2d6, cut);
[robotMat, robotDark, robotGlow].forEach((m) => { m.clippingPlanes = [clip]; m.clipShadows = true; });
robotGlow.emissive = new T.Color(0x9fe6ff); robotGlow.emissiveIntensity = 0.9;

/* ------------------------------------------------------------ piezas */
function mesh(geo, mat, x = 0, y = 0, z = 0, parent, wire) {
  const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  if (wire) m.userData.wire = wire;                // forma simple para el dibujo en líneas
  if (parent) parent.add(m);
  return m;
}
const wBox = (w, h, d) => new T.BoxGeometry(w, h, d, 1, 2, 1);
const wCyl = (r, h, n = 12) => new T.CylinderGeometry(r, r, h, n, 3);
const wBall = (r) => new T.SphereGeometry(r, 10, 6);

/* 1 · Figuras: el robot (es también la pieza que se imprime) */
function robot() {
  const o = new T.Group();
  for (const s of [-1, 1]) {
    mesh(new RoundedBoxGeometry(0.85, 1.5, 1.0, 4, 0.18), robotMat, s * 0.62, 0.75, 0, o, wBox(0.85, 1.5, 1.0));            // piernas
    mesh(new RoundedBoxGeometry(1.0, 0.36, 1.35, 4, 0.14), robotDark, s * 0.62, 0.18, 0.12, o, wBox(1.0, 0.36, 1.35));       // pies
    const arm = mesh(new T.CapsuleGeometry(0.3, 1.25, 6, 16), robotMat, s * 1.72, 2.55, 0, o, wCyl(0.3, 1.85));            // brazos
    arm.rotation.z = s * 0.22;
    mesh(new T.SphereGeometry(0.36, 20, 14), robotDark, s * 1.88, 1.72, 0, o, wBall(0.36));                                 // manos
    mesh(new T.CylinderGeometry(0.16, 0.16, 0.3, 16).rotateZ(PI / 2), robotDark, s * 1.55, 4.55, 0, o);                    // orejas
  }
  mesh(new RoundedBoxGeometry(2.7, 2.25, 1.75, 5, 0.38), robotMat, 0, 2.6, 0, o, wBox(2.7, 2.25, 1.75));                    // cuerpo
  mesh(new RoundedBoxGeometry(1.5, 0.95, 0.12, 4, 0.05), robotDark, 0, 2.75, 0.88, o, wBox(1.5, 0.95, 0.12));               // pecho
  mesh(new T.CircleGeometry(0.17, 24), robotGlow, -0.35, 2.75, 0.945, o);
  mesh(new T.CircleGeometry(0.11, 24), robotGlow, 0.2, 2.82, 0.945, o);
  mesh(new T.CircleGeometry(0.08, 24), robotGlow, 0.46, 2.62, 0.945, o);
  mesh(new T.CylinderGeometry(0.34, 0.42, 0.28, 20), robotDark, 0, 3.85, 0, o);                                           // cuello
  mesh(new RoundedBoxGeometry(2.6, 1.85, 1.95, 5, 0.5), robotMat, 0, 4.85, 0, o, wBox(2.6, 1.85, 1.95));                    // cabeza
  mesh(new RoundedBoxGeometry(2.05, 1.05, 0.12, 4, 0.2), robotDark, 0, 4.9, 0.97, o, wBox(2.05, 1.05, 0.12));               // visor
  for (const s of [-1, 1]) mesh(new T.CircleGeometry(0.2, 28), robotGlow, s * 0.48, 4.95, 1.035, o, new T.CircleGeometry(0.2, 16)); // ojos
  mesh(new T.CylinderGeometry(0.06, 0.06, 0.75, 10), robotDark, 0, 6.1, 0, o, wCyl(0.06, 0.75, 6));                         // antena
  mesh(new T.SphereGeometry(0.2, 20, 14), robotMat, 0, 6.5, 0, o, wBall(0.2));
  return o;
}
/* 2 · Decoración: jarrón facetado y torcido */
function vase(mat) {
  const pts = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push(new T.Vector2(1.05 + 0.75 * Math.sin(PI * u * 1.1 + 0.2) - 0.35 * u * u, u * 5.4)); }
  const geo = new T.LatheGeometry(pts, 10);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), a = 0.9 * y / 5.4, x = p.getX(i), z = p.getZ(i); p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)); }
  geo.computeVertexNormals();
  const o = new T.Group(); mesh(geo, mat, 0, 0, 0, o);
  mesh(new T.CircleGeometry(1.25, 10).rotateX(-PI / 2), mat, 0, 0.02, 0, o);
  return o;
}
/* 3 · Regalos: corazón */
function heart(mat) {
  const s = new T.Shape();
  s.moveTo(0, -1.6);
  s.bezierCurveTo(-0.6, -1.0, -2.0, -0.2, -2.0, 0.8);
  s.bezierCurveTo(-2.0, 1.8, -1.0, 2.2, 0, 1.3);
  s.bezierCurveTo(1.0, 2.2, 2.0, 1.8, 2.0, 0.8);
  s.bezierCurveTo(2.0, -0.2, 0.6, -1.0, 0, -1.6);
  const geo = new T.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.3, bevelSegments: 6, curveSegments: 32 });
  geo.center();
  const o = new T.Group(), m = mesh(geo, mat, 0, 2.2, 0, o); m.scale.setScalar(0.85);
  return o;
}
/* 4 · Personalizados: llavero con nombre */
const redraws = [];                              // texturas con texto: se vuelven a dibujar cuando carga la fuente
function nameTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 400;
  const x = c.getContext('2d'), t = new T.CanvasTexture(c);
  const draw = () => {
    x.fillStyle = '#2f6fd0'; x.fillRect(0, 0, 1024, 400);
    x.fillStyle = '#ffffff'; x.font = '800 150px Inter, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('TU NOMBRE', 512, 212);
    t.needsUpdate = true;
  };
  draw(); redraws.push(draw);
  t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function keychain(mat) {
  const o = new T.Group();
  const s = new T.Shape(); const w = 4.2, h = 1.7, r = 0.5;
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const hole = new T.Path(); hole.absarc(-w / 2 + 0.55, 0, 0.22, 0, TAU, true); s.holes.push(hole);
  const geo = new T.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3, curveSegments: 24 });
  const plate = new T.Group(); plate.position.set(0, 2.4, 0); plate.rotation.x = -0.12; o.add(plate);
  mesh(geo, mat, 0, 0, -0.15, plate);
  const lbl = new T.Mesh(new T.PlaneGeometry(3.1, 1.21), new T.MeshStandardMaterial({ map: nameTex(), roughness: 0.5, transparent: true }));
  lbl.position.set(0.3, 0, 0.24); plate.add(lbl);
  const ring = mesh(new T.TorusGeometry(0.62, 0.08, 12, 40), new T.MeshStandardMaterial({ color: 0xd9dbde, metalness: 1, roughness: 0.25 }), -w / 2 + 0.05, 0.25, 0, plate);
  ring.rotation.y = PI / 2;
  return o;
}
/* 5 · Prototipos: engranaje */
function gear(mat) {
  const s = new T.Shape(), n = 14, ro = 2.1, ri = 1.72;
  for (let i = 0; i < n; i++) {
    const a = i * TAU / n, d = TAU / n;
    const pts = [[ri, a], [ro, a + d * 0.18], [ro, a + d * 0.48], [ri, a + d * 0.66]];
    pts.forEach(([r, b], k) => { const x = r * Math.cos(b), y = r * Math.sin(b); if (!i && !k) s.moveTo(x, y); else s.lineTo(x, y); });
  }
  s.closePath();
  const hole = new T.Path(); hole.absarc(0, 0, 0.6, 0, TAU, true); s.holes.push(hole);
  for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + 0.3, hp = new T.Path(); hp.absarc(1.15 * Math.cos(a), 1.15 * Math.sin(a), 0.28, 0, TAU, true); s.holes.push(hp); }
  const geo = new T.ExtrudeGeometry(s, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2, curveSegments: 24 });
  geo.center();
  const o = new T.Group(), m = mesh(geo, mat, 0, 2.2, 0, o); m.rotation.x = -0.15; m.scale.setScalar(0.9);
  return o;
}

/* ------------------------------------------------------------ escena */
const R = 7.2;                                   // radio de la vitrina giratoria
const car = new T.Group(); car.position.set(0, 0, -R); scene.add(car);
const rob = robot();
const items = [rob, vase(pla(0xf2efe9)), heart(pla(0xe0412e)), keychain(pla(0x2f6fd0)), gear(pla(0xf2c230))];
items.forEach((it, k) => {
  const a = k * TAU / items.length, p = new T.Group();
  p.position.set(R * Math.sin(a), 0, R * Math.cos(a)); p.rotation.y = a;
  p.add(it); car.add(p); it.userData.slot = p;
});

/* el robot en líneas (programa de diseño): aristas de cada pieza */
const wirePos = [];
rob.updateMatrixWorld(true);
rob.traverse((m) => {
  if (!m.isMesh || !m.userData.wire) return;
  const e = new T.EdgesGeometry(m.userData.wire, 1), p = e.attributes.position, v = new T.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrix); wirePos.push(v.x, v.y, v.z); }
});
// de abajo hacia arriba, para que se dibuje como un trazo que sube
const segs = [];
for (let i = 0; i < wirePos.length; i += 6) segs.push(wirePos.slice(i, i + 6));
segs.sort((a, b) => Math.min(a[1], a[4]) - Math.min(b[1], b[4]));
const wireGeo = new LineSegmentsGeometry(); wireGeo.setPositions(segs.flat());
const wireMat = new LineMaterial({ color: 0xffb340, linewidth: 1.3 * SS, transparent: true, toneMapped: false, depthWrite: false });
wireMat.resolution.set(GW, GH);
const wire = new LineSegments2(wireGeo, wireMat); wire.renderOrder = 2;
rob.add(wire);
const NSEG = segs.length;

/* cama de impresión y cabezal */
function bedTex() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d'); x.fillStyle = '#17171a'; x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(255,255,255,0.07)'; x.lineWidth = 2;
  for (let k = 1; k < 8; k++) { const p = k * S / 8; x.beginPath(); x.moveTo(p, 16); x.lineTo(p, S - 16); x.moveTo(16, p); x.lineTo(S - 16, p); x.stroke(); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
const bedMat = new T.MeshStandardMaterial({ map: bedTex(), roughness: 0.55, metalness: 0.2, transparent: true });
const bed = new T.Mesh(new RoundedBoxGeometry(9, 0.3, 7.5, 3, 0.1), bedMat);
bed.position.y = -0.16; bed.receiveShadow = true; scene.add(bed);

const head = new T.Group(); scene.add(head);
const metal = new T.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.35, metalness: 0.6 });
const brass = new T.MeshStandardMaterial({ color: 0xd8a24a, roughness: 0.25, metalness: 1 });
mesh(new RoundedBoxGeometry(1.3, 0.9, 1.3, 3, 0.12), metal, 0, 1.25, 0, head);
mesh(new T.CylinderGeometry(0.22, 0.22, 0.35, 16), brass, 0, 0.62, 0, head);
mesh(new T.ConeGeometry(0.22, 0.42, 16).rotateX(PI), brass, 0, 0.24, 0, head);
mesh(new T.CylinderGeometry(0.08, 0.08, 2.4, 10), metal, 0, 2.9, 0, head);                         // tubo de filamento
function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,190,110,0.7)'); gr.addColorStop(1, 'rgba(255,120,20,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return new T.CanvasTexture(c);
}
const spark = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
spark.scale.setScalar(1.1); head.add(spark);
const heat = new T.PointLight(0xff7a1a, 0, 6, 1.6); head.add(heat);

/* ------------------------------------------------------------ animación */
const HR = 6.75;                                  // alto del robot
const printH = (t) => mix(-0.05, HR, eio(lin(B0 + 0.5, C0 - 0.7, t)) * 0.15 + lin(B0 + 0.5, C0 - 0.7, t) * 0.85);
const PHASE0 = C0 + 0.9, DWELL = (D0 - PHASE0) / CATS.length;
function phase(t) {                               // cuál pieza de la vitrina está al frente (con giro suave entre una y otra)
  const u = (t - PHASE0) / DWELL;
  if (u <= 0) return 0;
  const k = Math.floor(u), f = u - k, move = 0.42;
  return Math.min(CATS.length - 1 + 0.0001, k + eio(lin(1 - move, 1, f)));
}

function update(t) {
  // impresión del robot
  const printing = t >= B0 && t < C0 + 0.5;
  const h = t < B0 ? 1e3 : t < C0 ? printH(t) : 1e3;
  clip.constant = t < B0 ? 1e3 : t < C0 ? h : 1e3;
  cut.value = t >= B0 + 0.4 && t < C0 - 0.6 ? h : 1e3;
  // el robot solo es sólido desde que empieza a imprimirse
  rob.traverse((m) => { if (m.isMesh && m !== wire) m.visible = t >= B0 + 0.4; });
  // líneas: se dibujan en 1 · y se apagan cuando la pieza termina
  const draw = eo(lin(0.6, 3.6, t));
  wireGeo.instanceCount = Math.max(0, Math.round(NSEG * draw));
  wireMat.opacity = t < B0 ? 1 : mix(1, 0.45, ss(B0, B0 + 0.6, t)) * (1 - ss(C0 - 1.2, C0 - 0.4, t));
  wire.visible = wireMat.opacity > 0.01;

  // cama y cabezal
  const bedA = win(t, B0 - 0.4, C0 + 0.1, 0.5);
  bed.visible = bedA > 0.01; bedMat.opacity = bedA;
  head.visible = printing && t > B0 + 0.1 && t < C0 - 0.35;
  if (head.visible) {
    const w = t * 9.5, rr = 1.45 + 0.3 * Math.sin(t * 3.1);
    head.position.set(rr * Math.cos(w), h + 0.02, 0.85 * rr * Math.sin(w));
    const ha = win(t, B0 + 0.1, C0 - 0.35, 0.3);
    head.scale.setScalar(ha); spark.material.opacity = ha * (0.75 + 0.25 * Math.sin(t * 40));
    heat.intensity = 18 * ha;
  }

  // vitrina: aparecen las otras cuatro piezas y gira hasta dejar cada una al frente
  const pop = (k) => eo(lin(C0 + 0.05 + k * 0.12, C0 + 0.75 + k * 0.12, t));
  items.forEach((it, k) => {
    if (k) { const s = pop(k); it.visible = s > 0.001; it.scale.setScalar(Math.max(0.001, s)); }
    it.rotation.y = k ? t * 0.55 + k : (t < C0 ? 0.35 * Math.sin(t * 0.5) : (t - C0) * 0.55);
  });
  car.rotation.y = -phase(t) * TAU / CATS.length;

  // cámara
  let cx, cy, cz, tx, ty, tz;
  if (t < C0) {
    const a = 0.55 - 0.055 * t, d = mix(25, 23, lin(0, C0, t));
    const ly = t < B0 ? 3.3 : mix(3.3, clamp(h, 2.4, 4.2), ss(B0, B0 + 1.2, t));
    cx = d * Math.sin(a); cz = d * Math.cos(a); cy = mix(9, 7.5, lin(0, C0, t)); tx = 0; ty = ly - 0.6; tz = 0;
  } else {
    const u = eio(lin(C0, C0 + 1.6, t)), a0 = 0.55 - 0.055 * C0, d0 = 23;
    const a = mix(a0, 0, u), d = mix(d0, 30, u);
    cx = d * Math.sin(a); cz = d * Math.cos(a) - (t - C0) * 0.15; cy = mix(7.5, 10.5, u) + (t > D0 ? (t - D0) * 0.5 : 0);
    tx = 0; ty = mix(2.7, 5.6, u); tz = mix(0, -2.5, u);
  }
  camera.position.set(cx, cy, cz); camera.lookAt(tx, ty, tz);
  // la escena se aparta mientras hablan los textos de 4 y 5
  scene.visible = t < E0 + 0.2;
}

/* ------------------------------------------------------------ 2D */
const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';
const font = (s, w) => `${w} ${s}px ${FONT}`;
const LOGO = L3D.brand.paths.map((d) => new Path2D(d)), LVB = L3D.brand.viewBox;
function logo(x, y, w, a, color = INK) {
  if (a <= 0.002) return;
  const s = w / LVB[0]; g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s); g.fillStyle = color; LOGO.forEach((p) => g.fill(p)); g.restore();
}
function rrect(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
/* texto que entra subiendo y sale subiendo */
function text(str, x, y, size, weight, color, a, slide = 0, opt = {}) {
  if (a <= 0.002) return;
  g.save(); g.globalAlpha = a; g.font = font(size, weight); g.fillStyle = color; g.textBaseline = 'alphabetic';
  g.textAlign = opt.align || 'left'; g.letterSpacing = (opt.ls || 0) + 'px';
  g.fillText(str, x, y + slide); g.restore();
}
/* bloque de título: rótulo en ámbar, dos líneas grandes y una línea de apoyo */
function block(t, t0, t1, kick, l1, l2, sub, y = 236) {
  const ins = (d) => eo(lin(t0 + d, t0 + d + 0.6, t)), outs = ss(t1 - 0.45, t1, t);
  const a = (d) => ins(d) * (1 - outs), sl = (d) => (1 - ins(d)) * 34 - outs * 24;
  text(kick, 56, y, 22, 700, AMBER, a(0), sl(0), { ls: 3 });
  g.save(); g.font = font(96, 800); g.letterSpacing = '-2px';
  const fs = Math.min(96, Math.floor(96 * 616 / Math.max(g.measureText(l1).width, l2 ? g.measureText(l2).width : 0))); g.restore();
  text(l1, 52, y + 104, fs, 800, INK, a(0.08), sl(0.08), { ls: -2 });
  if (l2) text(l2, 52, y + 104 + fs * 1.04, fs, 800, INK, a(0.16), sl(0.16), { ls: -2 });
  if (sub) text(sub, 56, y + (l2 ? 268 : 168), 30, 400, SUB, a(0.28), sl(0.28));
}

function background(t) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#101114'); bg.addColorStop(1, '#060607');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // halo ámbar que respira despacio, siempre detrás de la pieza
  const k = 0.85 + 0.15 * Math.sin(t * TAU / 6);
  const halo = g.createRadialGradient(W * 0.5, H * 0.66, 0, W * 0.5, H * 0.66, W * 0.95);
  halo.addColorStop(0, `rgba(255,159,10,${0.16 * k})`); halo.addColorStop(0.5, `rgba(255,159,10,${0.05 * k})`); halo.addColorStop(1, 'rgba(255,159,10,0)');
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
}

function chip(x, y, label, value, a, dot) {
  if (a <= 0.002) return 0;
  g.save(); g.globalAlpha = a; g.font = font(22, 500);
  const lw = g.measureText(label).width; g.font = font(22, 700); const vw = value ? g.measureText(' ' + value).width : 0;
  const w = (dot ? 22 : 0) + lw + vw + 40;
  rrect(x, y, w, 46, 23); g.fillStyle = 'rgba(255,255,255,0.09)'; g.fill();
  let cx = x + 20;
  if (dot) { g.fillStyle = dot; g.beginPath(); g.arc(cx + 5, y + 23, 6, 0, TAU); g.fill(); cx += 22; }
  g.textBaseline = 'middle'; g.font = font(22, 500); g.fillStyle = SUB; g.fillText(label, cx, y + 24);
  if (value) { g.font = font(22, 700); g.fillStyle = INK; g.fillText(' ' + value, cx + lw, y + 24); }
  g.restore();
  return w;
}

function icon(kind, x, y, s, a) {
  g.save(); g.globalAlpha = a; g.strokeStyle = AMBER; g.lineWidth = 3.2; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath();
  if (kind === 'eye') {
    g.moveTo(x - s, y); g.quadraticCurveTo(x, y - s * 1.05, x + s, y); g.quadraticCurveTo(x, y + s * 1.05, x - s, y); g.stroke();
    g.beginPath(); g.arc(x, y, s * 0.34, 0, TAU); g.stroke();
  } else if (kind === 'bulb') {
    g.arc(x, y - s * 0.22, s * 0.6, PI * 0.78, PI * 2.22); g.lineTo(x + s * 0.26, y + s * 0.62); g.lineTo(x - s * 0.26, y + s * 0.62); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(x - s * 0.22, y + s * 0.88); g.lineTo(x + s * 0.22, y + s * 0.88); g.stroke();
  } else {
    rrect(x - s * 0.72, y - s * 0.38, s * 1.44, s * 1.16, 5); g.stroke();
    g.beginPath(); g.arc(x, y - s * 0.38, s * 0.38, PI, 0); g.stroke();
  }
  g.restore();
}

function hud(t) {
  // 2 · indicadores de la impresión
  const pa = win(t, B0 + 0.6, C0 - 0.3, 0.4);
  if (pa > 0.002) {
    const h = clamp(printH(t) / HR), lay = Math.max(1, Math.round(h * 340));
    g.save(); g.globalAlpha = pa;
    let x = 56; x += chip(x, 1046, 'Boquilla', '210 °C', 1, '#ff5a1f') + 12; chip(x, 1046, 'Material', 'PLA', 1, AMBER);
    g.font = font(22, 500); g.fillStyle = SUB; g.textBaseline = 'alphabetic'; g.fillText('Capa', 56, 1144);
    const cw = g.measureText('Capa ').width; g.font = font(22, 700); g.fillStyle = INK; g.fillText(lay + ' / 340', 56 + cw, 1144);
    g.textAlign = 'right'; g.fillText(Math.round(h * 100) + ' %', 664, 1144);
    rrect(56, 1160, 608, 6, 3); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fill();
    rrect(56, 1160, Math.max(6, 608 * h), 6, 3); g.fillStyle = AMBER; g.fill();
    g.restore();
  }
  // 3 · categoría de la pieza que está al frente
  const ca = win(t, C0 + 0.8, D0 + 0.1, 0.4);
  if (ca > 0.002) {
    const p = phase(t), k = Math.round(p), f = Math.abs(p - k);       // f: 0 en reposo, 0.5 a mitad del giro
    const la = ca * (1 - ss(0.12, 0.4, f));
    g.save(); g.globalAlpha = ca;
    for (let i = 0; i < CATS.length; i++) {                           // puntos de la vitrina
      const on = 1 - clamp(Math.abs(p - i));
      rrect(56 + i * 34 + (on > 0 ? 0 : 0), 1180, 14 + 26 * on, 8, 4); g.fillStyle = on > 0.01 ? `rgba(255,163,26,${0.35 + 0.65 * on})` : 'rgba(255,255,255,0.22)'; g.fill();
    }
    g.restore();
    text(CATS[k].k, 52, 1100, 72, 800, INK, la, (1 - la) * 16, { ls: -1 });
    text(CATS[k].d, 56, 1150, 28, 400, SUB, la, (1 - la) * 16);
  }
}

function why(t) {
  const a0 = ss(D0 + 0.1, D0 + 0.6, t), a1 = ss(E0 - 0.35, E0, t);
  if (a0 * (1 - a1) <= 0.002) return;
  // velo: la escena queda de fondo, apagada
  g.fillStyle = `rgba(8,8,10,${0.72 * a0 * (1 - a1)})`; g.fillRect(0, 0, W, H);
  block(t, D0 + 0.1, E0, 'VEN A CONOCER', 'El mundo de la', 'impresión 3D', null, 300);
  WHY.forEach((w, i) => {
    const d = 0.55 + i * 0.22, a = eo(lin(D0 + d, D0 + d + 0.55, t)) * (1 - a1), sl = (1 - a) * 30, y = 760 + i * 130;
    if (a <= 0.002) return;
    g.save(); g.globalAlpha = a; rrect(56, y - 50 + sl, 608, 108, 22); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fill(); g.restore();
    icon(w.ic, 116, y + 4 + sl, 24, a);
    text(w.t, 172, y - 2, 36, 700, INK, a, sl);
    text(w.s, 172, y + 38, 26, 400, SUB, a, sl);
  });
}

function outro(t) {
  const a = ss(E0, E0 + 0.6, t) * (1 - ss(DUR - 1.1, DUR - 0.5, t));
  if (a <= 0.002) return;
  const sc = mix(0.94, 1, eo(lin(E0, E0 + 1.4, t)));
  g.save(); g.translate(W / 2, 560); g.scale(sc, sc); g.translate(-W / 2, -560);
  logo(110, 440, 500, a);
  g.restore();
  const b = eo(lin(E0 + 0.35, E0 + 0.95, t)) * a, c = eo(lin(E0 + 0.6, E0 + 1.2, t)) * a;
  text('Entra y crea', W / 2, 720, 92, 800, INK, b, (1 - b) * 30, { align: 'center', ls: -2 });
  text('Te esperamos aquí mismo', W / 2, 780, 32, 400, SUB, c, (1 - c) * 30, { align: 'center' });
  // flecha que invita a pasar, con un pulso suave
  const p = (Math.sin((t - E0) * 4.2) + 1) / 2;
  g.save(); g.globalAlpha = c * (0.55 + 0.45 * p); g.strokeStyle = AMBER; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
  const y = 900 + p * 10; g.beginPath(); g.moveTo(W / 2 - 26, y); g.lineTo(W / 2, y + 24); g.lineTo(W / 2 + 26, y); g.stroke();
  g.restore();
  text('IMPRESIÓN 3D · DISEÑO · REGALOS', W / 2, 1150, 22, 600, AMBER, c, 0, { align: 'center', ls: 3 });
}

const noise = new Int8Array(W * H);
{ let s = 12345; for (let k = 0; k < noise.length; k++) { s = (s * 1103515245 + 12345) & 0x7fffffff; noise[k] = ((s >> 16) % 3) - 1; } }
function compose(t) {
  background(t);
  const a3 = 1 - ss(E0 - 0.3, E0 + 0.2, t);
  if (a3 > 0.002) { g.save(); g.globalAlpha = a3; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(renderer.domElement, 0, 0, W, H); g.restore(); }
  // velos arriba y abajo: los textos siempre sobre fondo limpio
  const sg = g.createLinearGradient(0, 0, 0, 560);
  sg.addColorStop(0, 'rgba(15,16,19,0.95)'); sg.addColorStop(0.7, 'rgba(15,16,19,0.8)'); sg.addColorStop(1, 'rgba(15,16,19,0)');
  g.fillStyle = sg; g.fillRect(0, 0, W, 560);
  const bg2 = g.createLinearGradient(0, 960, 0, H);
  bg2.addColorStop(0, 'rgba(6,6,7,0)'); bg2.addColorStop(0.5, 'rgba(6,6,7,0.75)'); bg2.addColorStop(1, 'rgba(6,6,7,0.92)');
  g.fillStyle = bg2; g.fillRect(0, 960, W, H - 960);

  logo(56, 70, 128, ss(0.2, 0.9, t) * (1 - ss(E0 - 0.4, E0, t)));
  block(t, 0.5, B0, 'IMPRESIÓN 3D', '¿Lo', 'imaginas?', 'Si lo puedes imaginar, lo imprimimos.');
  block(t, B0, C0, 'EN VIVO, EN ESTE LOCAL', 'Lo hacemos', 'realidad', 'Capa por capa, frente a ti.');
  block(t, C0, D0, 'HECHO EN BLACKFORGE', 'Piezas', 'únicas', 'Diseñadas e impresas en nuestro taller.');
  hud(t);
  why(t);
  outro(t);
  const blk = Math.max(1 - ss(0, 0.6, t), ss(DUR - 0.75, DUR - 0.03, t));
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
window.ready = Promise.all([400, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px Inter`))).then(() => { redraws.forEach((f) => f()); renderAt(0); return true; });

/* vista previa en el navegador */
if (!Q.has('render')) {
  window.ready.then(() => {
    if (Q.has('t')) { renderAt(Number(Q.get('t'))); return; }
    const t0 = performance.now();
    const loop = (now) => { renderAt(((now - t0) / 1000) % DUR); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });
}
