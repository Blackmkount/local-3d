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
    // pantalla con video: se exporta su imagen fija
    if (out && out.map && out.map.isVideoTexture) { if (out === m) out = m.clone(); out.map = m._poster || null; }
    // la textura de rugosidad ya trae el canal azul en blanco: sirve también de mapa metálico y evita
    // que el exportador cree una imagen combinada por cada material
    if (out && out.roughnessMap && !out.metalnessMap) { if (out === m) out = m.clone(); out.metalnessMap = out.roughnessMap; }
    // glTF admite rugosidad de 0 a 1 (el visor usa algo más para apagar el brillo)
    if (out && out.roughness > 1) { if (out === m) out = m.clone(); out.roughness = 1; }
    cache.set(m, out);
    return out;
  }
  /* piezas sin coordenadas de textura (herrajes, patas, impresoras) con material texturizado: proyección de caja en metros */
  const uvCache = new Map();
  function withUV(geo, mat) {
    if (geo.attributes.uv || !mat || !(mat.map || mat.roughnessMap || mat.normalMap)) return geo;
    if (uvCache.has(geo)) return uvCache.get(geo);
    const g = geo.clone(), P = g.attributes.position, N = g.attributes.normal, uv = new Float32Array(P.count * 2);
    for (let i = 0; i < P.count; i++) {
      const nx = N ? Math.abs(N.getX(i)) : 0, ny = N ? Math.abs(N.getY(i)) : 1, nz = N ? Math.abs(N.getZ(i)) : 0;
      if (ny >= nx && ny >= nz) { uv[i * 2] = P.getX(i); uv[i * 2 + 1] = P.getZ(i); }
      else if (nx >= nz) { uv[i * 2] = P.getZ(i); uv[i * 2 + 1] = P.getY(i); }
      else { uv[i * 2] = P.getX(i); uv[i * 2 + 1] = P.getY(i); }
    }
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    uvCache.set(geo, g);
    return g;
  }

  const pad = (n) => (n < 10 ? '0' : '') + n;

  X.buildScene = function (opt) {
    opt = opt || {};
    const R = L.room, F = L.furn, E = L.engine, byN = {};
    // nombres de la versión a la vista (la Galería llama «Muro de nichos» a lo que en los datos base es «Estantería retroiluminada»)
    const VS = L.versions, ver = L.api && L.api.state ? L.api.state.ver : null;
    (L.data ? L.data.items : []).forEach((i) => { const o = ver && VS && VS.items[ver] && VS.items[ver][i.n]; byN[i.n] = o ? Object.assign({}, i, { name: o.name || i.name, short: o.short || i.short }) : i; });
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
      if (top === R.cotas || top.userData.verOff) return;          // muebles de las versiones que no están a la vista
      const mat = exportMaterial(o.userData.mat0 || o.material, cache);
      if (!mat) return;
      const m = new T.Mesh(withUV(o.geometry, mat), mat);
      o.matrixWorld.decompose(p, q, s); m.position.copy(p); m.quaternion.copy(q); m.scale.copy(s);
      const ud = o.userData;
      m.name = ud.name || (ud.decor ? 'Piezas impresas en exhibición' : ud.plant ? 'Planta' : ud.child ? (o.parent.userData.name || 'Pieza') + ' · detalle' : o.name || 'Pieza');
      groupFor(top).add(m);
    });
    // pisos: madera dentro del local y porcelanato en 16 × 16 m de pasillo alrededor, con las mismas texturas a escala
    const fr = E.floorRect;
    const floor = (name, geo, mat) => {
      const fm = mat.clone(); fm.onBeforeCompile = () => {}; fm.name = mat.name; fm.metalnessMap = fm.roughnessMap;
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
    // Unreal: marcadores (cubos de 1 cm con nombre) que el script de Unreal convierte en luces, cámaras e inicio del recorrido.
    // Se leen ya convertidos a las coordenadas de Unreal, así no importa el cambio de ejes del importador.
    if (opt.unreal) {
      const mk = new T.Group(); mk.name = 'MARCADORES'; scene.add(mk);
      const mg = new T.BoxGeometry(0.01, 0.01, 0.01), mm = new T.MeshBasicMaterial({ color: 0xff00ff }); mm.name = 'MARCADOR';
      const add = (name, v) => { const m = new T.Mesh(mg, mm); m.name = name; m.position.copy(v); mk.add(m); };
      const box = new T.Box3(), c = new T.Vector3(), sz = new T.Vector3(), info = [];
      let k = 0;
      F.order.forEach((n) => F.items[n].insts.forEach((o, ii) => {
        let top = o.group; while (top.parent && top.parent !== R.root) top = top.parent;
        if (top.userData.verOff || !o.group.visible) return;
        o.parts.forEach((p) => {
          if (!/^(cob|perfilLed)$/.test(p.userData.mk || '') || !p.visible) return;
          box.setFromObject(p); box.getCenter(c); box.getSize(sz);
          const ax = sz.x >= sz.y && sz.x >= sz.z ? new T.Vector3(1, 0, 0) : sz.y >= sz.z ? new T.Vector3(0, 1, 0) : new T.Vector3(0, 0, 1);
          const len = Math.max(sz.x, sz.y, sz.z), id = 'LED_' + pad(n) + '_' + pad(++k);
          add(id + '_A_L' + Math.round(len * 100), c);
          add(id + '_C', c.clone().addScaledVector(ax, 0.1));
        });
        if (o.box && ii === 0) {
          const it = byN[n]; o.box.getCenter(c); o.box.getSize(sz);
          add('INFO_' + pad(n), new T.Vector3(c.x, o.box.max.y, c.z));
          info.push({ n, nombre: it ? it.name : '', corto: it ? it.short : '', medidas: [sz.x, sz.y, sz.z].map((v) => Math.round(v * 1000)) });
        }
      }));
      E.ledLights.forEach((l, i) => {
        const id = (l.isSpotLight ? 'LUZ_FOCO_' : 'LUZ_CALIDA_') + pad(i + 1);
        add(id + '_A_I' + Math.round(l.userData.i * 10), l.position);
        if (l.isSpotLight) add(id + '_B_G' + Math.round(T.MathUtils.radToDeg(l.angle)), l.target.position);
      });
      // inicio del recorrido: afuera, en el pasillo, mirando la vitrina
      const vw = opt.inicio || { a: [0, 0, 5.4], b: [0, 0, 3.4] };
      add('INICIO_A', new T.Vector3().fromArray(vw.a)); add('INICIO_B', new T.Vector3().fromArray(vw.b));
      (opt.cams || []).forEach((v) => {
        const sp = Math.sin(v.ph);
        add('CAM_' + v.name + '_A', new T.Vector3(v.t[0] + v.r * sp * Math.sin(v.th), v.t[1] + v.r * Math.cos(v.ph), v.t[2] + v.r * sp * Math.cos(v.th)));
        add('CAM_' + v.name + '_B', new T.Vector3().fromArray(v.t));
      });
      scene.userData.info = info;
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
    X.lastInfo = scene.userData.info || null;
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
