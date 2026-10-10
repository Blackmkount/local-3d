/* ============================================================================
   EXPORTACIÓN — el local completo a glTF binario (.glb): muros, mobiliario
   pieza por pieza, materiales PBR con sus texturas, luces y las vistas de la
   página como cámaras. Se abre tal cual en Blender, Unreal Engine 5,
   Twinmotion, D5 Render o cualquier visor glTF.
   El exportador de three.js se descarga solo cuando se pide el archivo.
   ========================================================================== */
(function () {
  'use strict';
  const L = (window.L3D = window.L3D || {});
  const T = THREE;
  const X = (L.exporter = {});

  /* los módulos de three.js importan 'three': se reescriben para usar el THREE global */
  function threeBase() {
    const s = document.querySelector('script[src*="three@"]');
    return s ? s.src.replace(/build\/three(\.min)?\.js.*$/, '') : 'https://cdn.jsdelivr.net/npm/three@0.160.0/';
  }
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
    if (!exporterP) exporterP = moduleURL(threeBase() + 'examples/jsm/exporters/GLTFExporter.js').then((u) => import(u)).catch((e) => { exporterP = null; throw e; });
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
    // la textura de rugosidad ya trae el canal azul en blanco: sirve también de mapa metálico y evita
    // que el exportador cree una imagen combinada por cada material
    if (out && out.roughnessMap && !out.metalnessMap) { if (out === m) out = m.clone(); out.metalnessMap = out.roughnessMap; }
    cache.set(m, out);
    return out;
  }

  const pad = (n) => (n < 10 ? '0' : '') + n;

  X.buildScene = function (opt) {
    opt = opt || {};
    const R = L.room, F = L.furn, E = L.engine, byN = {};
    (L.data ? L.data.items : []).forEach((i) => { byN[i.n] = i; });
    const scene = new T.Scene(); scene.name = 'Local Impresión 3D';
    const local = new T.Group(); local.name = 'Local'; scene.add(local);
    const mob = new T.Group(); mob.name = 'Mobiliario'; scene.add(mob);
    const cache = new Map(), groups = new Map(), p = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3();
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
      if (top === R.cotas) return;
      const mat = exportMaterial(o.userData.mat0 || o.material, cache);
      if (!mat) return;
      const m = new T.Mesh(o.geometry, mat);
      o.matrixWorld.decompose(p, q, s); m.position.copy(p); m.quaternion.copy(q); m.scale.copy(s);
      const ud = o.userData;
      m.name = ud.name || (ud.decor ? 'Piezas impresas en exhibición' : ud.plant ? 'Planta' : ud.child ? (o.parent.userData.name || 'Pieza') + ' · detalle' : o.name || 'Pieza');
      groupFor(top).add(m);
    });
    // piso de porcelanato: 16 × 16 m con la trama alineada al local
    const S = 16, cx = 0, cz = 1.5, fm = E.floor.material.clone();
    fm.onBeforeCompile = () => {};
    const fr = (v) => v - Math.floor(v);
    ['map', 'normalMap', 'roughnessMap'].forEach((k) => {
      const t = fm[k].clone(); t.repeat.set(S / 2.4, S / 2.4); t.offset.set(fr(-(-3 - cx + S / 2) / 2.4), fr(-(cz - 3.5 + S / 2) / 2.4)); fm[k] = t;
    });
    fm.name = 'piso';
    const floor = new T.Mesh(new T.PlaneGeometry(S, S), fm); floor.name = 'Piso porcelanato 60 × 60'; floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz);
    local.add(floor);
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

  /* devuelve el .glb como ArrayBuffer */
  X.glb = async function (opt) {
    const mod = await loadExporter();
    const scene = X.buildScene(opt);
    return new Promise((resolve, reject) => {
      new mod.GLTFExporter().parse(scene, resolve, reject, { binary: true, maxTextureSize: 2048 });
    });
  };
  X.download = async function (opt) {
    const buf = await X.glb(opt);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }));
    a.download = 'local-impresion-3d.glb';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return buf.byteLength;
  };
})();
