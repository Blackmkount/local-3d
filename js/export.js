/* ============================================================================
   EXPORTACIÓN — el local completo a glTF binario (.glb): muros, mobiliario
   pieza por pieza, materiales PBR con sus texturas, luces y las vistas de la
   página como cámaras. Se abre tal cual en Blender, Unreal Engine 5,
   Twinmotion, D5 Render o cualquier visor glTF.
   El exportador de three.js (vendor/GLTFExporter-0.160.0.js) se carga solo
   cuando se pide el archivo; si no se puede leer el local (página abierta con
   doble clic), se descarga de jsDelivr.
   Fuera del archivo queda lo que el visor no muestra: piezas ocultas y todo lo
   marcado con userData.noExport (p. ej. la silueta de «¿Qué tan grande es?»).
   Las impresoras salen con su pieza terminada sobre la cama.
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const T = window.THREE;
  if (!T) return;
  const X = (L.exporter = {});

  /* los módulos de three.js importan 'three': se reescriben para usar el THREE global */
  const LOCAL = 'vendor/GLTFExporter-0.160.0.js';
  const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/exporters/GLTFExporter.js';
  const blobs = {};
  async function moduleURL(url) {
    if (blobs[url]) return blobs[url];
    const res = await fetch(url);
    if (!res.ok) throw new Error('No se pudo descargar ' + url);
    let code = await res.text();
    code = code.replace(/import\s*\{([^}]*)\}\s*from\s*['"]three['"];?/g, (m, names) => 'const {' + names.replace(/\s+as\s+/g, ': ') + '} = window.THREE;');
    const deps = Array.from(code.matchAll(/from\s*['"](\.{1,2}\/[^'"]+)['"]/g));
    for (const d of deps) code = code.split(d[0]).join('from ' + JSON.stringify(await moduleURL(new URL(d[1], url).href)));
    return (blobs[url] = URL.createObjectURL(new Blob([code], { type: 'text/javascript' })));
  }
  let exporterP = null;
  function loadExporter() {
    if (!exporterP) {
      exporterP = moduleURL(new URL(LOCAL, location.href).href)
        .catch(() => moduleURL(CDN))
        .then((u) => import(u))
        .catch((e) => { exporterP = null; throw e; });
    }
    return exporterP;
  }

  /* materiales tal como deben verse fuera del visor */
  function exportMaterial(m, cache) {
    if (!m) return null;
    if (cache.has(m)) return cache.get(m);
    const u = m.userData || {};
    let out = m;
    if (u.rgb) {                                         // LED: emisión real con su intensidad
      const k = Math.max(u.rgb[0], u.rgb[1], u.rgb[2]);
      out = new T.MeshStandardMaterial({ color: 0x000000, roughness: 0.4, emissive: new T.Color().setRGB(u.rgb[0] / k, u.rgb[1] / k, u.rgb[2] / k), emissiveIntensity: k });
      out.name = m.name || 'led';
    } else if (m.blending === T.AdditiveBlending) out = null;   // resplandores dibujados: en un motor físico los da la luz
    else if (u.lift || (u.op !== undefined && u.tr !== undefined)) {
      out = m.clone();
      if (u.lift) out.color.setRGB(1, 1, 1);                    // pantallas: sin la compensación del tone mapping del visor
      if (u.op !== undefined) { out.opacity = u.op; out.transparent = u.tr; out.depthWrite = !u.tr; }   // muros que el visor desvanece
    }
    // pantalla con video: se exporta su imagen fija
    if (out && out.map && out.map.isVideoTexture) { if (out === m) out = m.clone(); out.map = m._poster || null; }
    // la textura de rugosidad ya trae el canal azul en blanco: sirve también de mapa metálico y evita
    // que el exportador cree una imagen combinada por cada material
    if (out && out.roughnessMap && !out.metalnessMap) { if (out === m) out = m.clone(); out.metalnessMap = out.roughnessMap; }
    // el color de un material opaco viaja en JPEG (mucho más liviano); relieve y rugosidad siguen en PNG, sin pérdida
    if (out && out.map && !out.transparent && !out.alphaTest) out.map.userData.mimeType = 'image/jpeg';
    cache.set(m, out);
    return out;
  }

  const pad = (n) => (n < 10 ? '0' : '') + n;
  /* ¿se ve en el visor? Un objeto oculto o con userData.noExport (él o alguno de sus padres) no se exporta */
  function exportable(o, root) {
    for (let x = o; x && x !== root; x = x.parent) if (!x.visible || (x.userData && x.userData.noExport)) return false;
    return true;
  }

  X.buildScene = function (opt) {
    opt = opt || {};
    const R = L.room, F = L.furn, E = L.engine, byN = {};
    (L.data ? L.data.items : []).forEach((i) => { byN[i.n] = i; });
    const scene = new T.Scene(); scene.name = 'Local Impresión 3D';
    const local = new T.Group(); local.name = 'Local'; scene.add(local);
    const mob = new T.Group(); mob.name = 'Mobiliario'; scene.add(mob);
    const cache = new Map(), groups = new Map(), p = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3();
    // los muros que el visor corta para ver adentro se exportan completos; las impresoras, con la pieza terminada
    const shells = (E.shells || []).map((sh) => [sh.obj, sh.obj.visible]);
    shells.forEach((sh) => { sh[0].visible = true; });
    const restorePrints = F.finishPrints ? F.finishPrints() : null;
    try {
      R.root.updateMatrixWorld(true);
      const groupFor = (top) => {
        if (groups.has(top)) return groups.get(top);
        const g = new T.Group(), inst = top.userData.inst;
        if (inst) {
          const it = byN[inst.n], many = inst.item && inst.item.insts.length > 1;
          g.name = pad(inst.n) + ' ' + (it ? it.short : 'Elemento') + (many ? ' ' + (inst.idx + 1) : '');
          mob.add(g);
        } else { g.name = top.name || 'Local'; local.add(g); }
        groups.set(top, g);
        return g;
      };
      R.root.traverse((o) => {
        if (!o.isMesh || o.userData.fx || o === R.cotas) return;
        let top = o; while (top.parent && top.parent !== R.root) top = top.parent;
        if (top === R.cotas || !exportable(o, R.root)) return;
        const mat = exportMaterial(o.userData.mat0 || o.material, cache);
        if (!mat) return;
        // la pieza impresa cambia de forma con cada capa: se exporta una copia tal como está ahora (terminada)
        const m = new T.Mesh(o.userData.printPiece ? o.geometry.clone() : o.geometry, mat);
        o.matrixWorld.decompose(p, q, s); m.position.copy(p); m.quaternion.copy(q); m.scale.copy(s);
        const ud = o.userData;
        m.name = ud.name || (ud.printPiece ? 'Pieza impresa' : ud.decor ? 'Piezas impresas en exhibición' : ud.plant ? 'Planta' : ud.child ? (o.parent.userData.name || 'Pieza') + ' · detalle' : o.name || 'Pieza');
        groupFor(top).add(m);
      });
    } finally {
      shells.forEach((sh) => { sh[0].visible = sh[1]; });
      if (restorePrints) restorePrints();
      R.root.updateMatrixWorld(true);
    }
    // pisos: madera dentro del local y porcelanato en 16 × 16 m de pasillo alrededor, con las mismas texturas a escala
    const fr = E.floorRect;
    const floor = (name, geo, mat) => {
      const fm = mat.clone(); fm.onBeforeCompile = () => {}; fm.name = mat.name; fm.metalnessMap = fm.roughnessMap;
      if (fm.map) fm.map.userData.mimeType = 'image/jpeg';
      const f = new T.Mesh(geo, fm); f.name = name; local.add(f);
    };
    floor('Piso de madera (tablas de roble)', E.floorGeometry(fr[0], fr[1], fr[2], fr[3]), E.floorMats.wood);
    floor('Piso del pasillo (porcelanato 60 × 60)', E.floorGeometry(-8, -6.5, 8, 9.5, fr), E.floorMats.tile);
    // luces del local (focos y luz cálida); la luz general del pasillo queda a cargo de cada motor
    if (opt.lights !== false) {
      const lg = new T.Group(); lg.name = 'Luces'; scene.add(lg);
      E.ledLights.forEach((l, i) => {
        let c;
        if (l.isSpotLight) {
          c = new T.SpotLight(l.color, l.userData.i, 0, l.angle, l.penumbra, 2);
          c.position.copy(l.position); c.lookAt(l.target.position); c.add(c.target); c.target.position.set(0, 0, -1);
          c.name = 'Foco ' + (i + 1);
        } else {
          c = new T.PointLight(l.color, l.userData.i, l.distance, l.decay); c.position.copy(l.position); c.name = 'Luz cálida ' + (i + 1);
        }
        lg.add(c);
      });
    }
    // las vistas de la página como cámaras
    (opt.views || []).forEach((v) => {
      const c = new T.PerspectiveCamera(36, 16 / 9, 0.05, 200), sp = Math.sin(v.ph);
      c.position.set(v.t[0] + v.r * sp * Math.sin(v.th), v.t[1] + v.r * Math.cos(v.ph), v.t[2] + v.r * sp * Math.cos(v.th));
      c.lookAt(v.t[0], v.t[1], v.t[2]); c.name = 'Vista ' + v.name;
      scene.add(c);
    });
    return scene;
  };

  /* devuelve el .glb como ArrayBuffer. opt.progress(fracción 0–1) avisa: exportador listo (0.1),
     escena recorrida (0.3), conversión terminada (0.9) y archivo escrito (1, en X.download) */
  // un respiro para que se pinte el aviso de avance (con la pestaña oculta no hay cuadros: basta el reloj)
  const breathe = () => new Promise((r) => {
    let go = false;
    const done = () => { if (!go) { go = true; r(); } };
    requestAnimationFrame(() => setTimeout(done, 0)); setTimeout(done, 120);
  });
  X.glb = async function (opt) {
    opt = opt || {};
    const say = (k) => { try { if (opt.progress) opt.progress(k); } catch (err) { /* el aviso no detiene la exportación */ } };
    say(0.02);
    const mod = await loadExporter();
    say(0.1); await breathe();
    const scene = X.buildScene(opt);
    say(0.3); await breathe();
    const buf = await new Promise((resolve, reject) => {
      new mod.GLTFExporter().parse(scene, resolve, reject, { binary: true, maxTextureSize: 2048 });
    });
    scene.traverse((o) => { if (o.isMesh && o.name === 'Pieza impresa') o.geometry.dispose(); });
    say(0.9);
    return buf;
  };
  X.download = async function (opt) {
    opt = opt || {};
    const buf = await X.glb(opt);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }));
    a.download = 'local-impresion-3d.glb';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    try { if (opt.progress) opt.progress(1); } catch (err) { /* nada */ }
    return buf.byteLength;
  };
})();
