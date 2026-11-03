/* =====================================================================
   Café Ruelle to-go cup, three.js
   The profile is measured from media/cup.png (406 × 517 px), so one scene
   unit = one PNG pixel. An orthographic camera tilted 8° down frames the
   cup exactly like the photo, so at rotation 0 the render lines up with
   the PNG and with the cup in the last video frame.
   ===================================================================== */
function createCup(THREE, canvas, opts){
  const TILT = 8 * Math.PI / 180, COS = Math.cos(TILT);
  const BOX_W = 406, BOX_H = 517, TOP = 496.5;          // PNG box; screen y of PNG row 0
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: !!opts.preserve });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-BOX_W / 2, BOX_W / 2, BOX_H / 2, -BOX_H / 2, 1, 4000);
  const centerY = (TOP - BOX_H / 2) / COS;               // world height that projects to the box centre
  cam.position.set(0, centerY + Math.sin(TILT) * 2000, Math.cos(TILT) * 2000);
  cam.lookAt(0, centerY, 0);

  // ---------- profiles (r, h) ----------
  const V = (r, h) => new THREE.Vector2(r, h);
  const rc = h => 147.1 + 0.1184 * (h - 107.6);          // cup wall under the sleeve
  const cupPts = [V(0, 0), V(124, 0), V(130, 1.5), V(133.5, 4.5), V(135.5, 10), V(136.8, 16.7), V(139.7, 47), V(143.6, 77.3),
    V(146, 97.5), V(147.1, 107.6), V(rc(220), 220), V(174.6, 339.8), V(175.5, 349.9), V(177.8, 370.1), V(180.4, 390.3),
    V(181.4, 400.4), V(182.2, 408.5), V(182.6, 412)];
  const lidPts = [V(181.5, 406), V(186, 411), V(191, 416.3), V(199, 419.5), V(201.5, 422.3), V(199.5, 427), V(197, 433),
    V(196, 440), V(196.2, 448), V(195.5, 452.8), V(191, 456.9), V(184, 459), V(176, 460.5), V(170.5, 462.5), V(169.5, 465),
    V(168.3, 470.5), V(167.2, 474), V(165, 477), V(160, 478.3), V(120, 478.6), V(0, 478.6)];
  const SB = 117, ST = 336, OFF = 6.8, N = 28;            // sleeve bottom, top, offset from the wall
  const sleevePts = [];
  for (let i = 0; i <= N; i++){
    const h = SB + (ST - SB) * i / N;
    const edge = (i === 0 || i === N) ? 2.2 : (i === 1 || i === N - 1) ? 0.4 : 0;
    sleevePts.push(V(rc(h) + OFF - edge, h));
  }
  const decalPts = sleevePts.map(p => V(p.x + 0.35, p.y));
  const SEG = 160, PHI0 = -Math.PI;                       // u = 0.5 faces the camera

  // ---------- textures ----------
  const kraft = document.createElement('canvas'); kraft.width = 2048; kraft.height = 440;
  (function paintKraft(){
    const g = kraft.getContext('2d');
    g.fillStyle = '#C49F7B'; g.fillRect(0, 0, 2048, 440);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 9000; i++){                       // paper fibres
      const x = rnd() * 2048, y = rnd() * 440, l = 3 + rnd() * 16, a = rnd() * Math.PI;
      g.strokeStyle = rnd() > .5 ? `rgba(255,236,205,${.05 + rnd() * .09})` : `rgba(92,58,30,${.05 + rnd() * .1})`;
      g.lineWidth = .6 + rnd() * 1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * .35); g.stroke();
    }
    for (let x = 0; x < 2048; x += 2){                    // faint vertical corrugation
      g.fillStyle = `rgba(80,50,26,${.025 + .025 * Math.sin(x * .9)})`; g.fillRect(x, 0, 1, 440);
    }
    const e = g.createLinearGradient(0, 0, 0, 440);       // darker folded edges
    e.addColorStop(0, 'rgba(70,42,20,.45)'); e.addColorStop(.035, 'rgba(70,42,20,0)'); e.addColorStop(.965, 'rgba(70,42,20,0)'); e.addColorStop(1, 'rgba(70,42,20,.45)');
    g.fillStyle = e; g.fillRect(0, 0, 2048, 440);
  })();
  const kraftTex = new THREE.CanvasTexture(kraft); kraftTex.colorSpace = THREE.SRGBColorSpace; kraftTex.anisotropy = 4;

  const decal = document.createElement('canvas'); decal.width = 2048; decal.height = 440;
  const decalTex = new THREE.CanvasTexture(decal); decalTex.colorSpace = THREE.SRGBColorSpace; decalTex.anisotropy = 8;
  const paintLogo = img => {
    const g = decal.getContext('2d'); g.clearRect(0, 0, 2048, 440);
    const w = 560, h = w * img.height / img.width;        // ≈ 285 units around the front of the sleeve
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const t = tmp.getContext('2d'); t.drawImage(img, 0, 0, w, h); t.globalCompositeOperation = 'source-in'; t.fillStyle = '#3A2117'; t.fillRect(0, 0, w, h);
    g.drawImage(tmp, 1024 - w / 2, 220 - h / 2 + 6);
    decalTex.needsUpdate = true; if (api) api.dirty = true;
  };
  if (opts.logo){ const im = new Image(); im.onload = () => paintLogo(im); im.src = opts.logo; }

  // ---------- meshes ----------
  const cupMat = new THREE.MeshStandardMaterial({ color: 0xF3EEE7, roughness: .62, metalness: 0 });
  const lidMat = new THREE.MeshStandardMaterial({ color: 0xEEE7DD, roughness: .36, metalness: 0 });
  const sleeveMat = new THREE.MeshStandardMaterial({ map: kraftTex, roughness: .92, metalness: 0 });
  const decalMat = new THREE.MeshStandardMaterial({ map: decalTex, transparent: true, roughness: .8, metalness: 0, opacity: 0, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2 });
  const group = new THREE.Group();
  const lathe = (pts, mat) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts, SEG, PHI0, Math.PI * 2), mat); group.add(m); return m; };
  lathe(cupPts, cupMat); lathe(lidPts, lidMat); lathe(sleevePts, sleeveMat); lathe(decalPts, decalMat);
  group.position.x = -1.5;
  scene.add(group);

  // ---------- light: 0 = the café frame (backlit from the left), 1 = studio on cream ----------
  const hemi = new THREE.HemisphereLight(0xFFF1E0, 0x6B4A35, 1);
  const rim = new THREE.DirectionalLight(0xFFE9D2, 1);   // window, behind-left
  const key = new THREE.DirectionalLight(0xFFF4E8, 1);   // front-left key
  const bounce = new THREE.DirectionalLight(0xFFD6B8, 1);
  rim.position.set(-900, 160, -300); key.position.set(-500, 700, 900); bounce.position.set(900, 120, 300);
  scene.add(hemi, rim, key, bounce);
  const L = (a, b, m) => a + (b - a) * m;
  const MOODS = opts.moods || {
    cafe:   { hemi: .32, rim: 7.5, key: .3, bounce: 1.1, exposure: 1.02 },
    studio: { hemi: 1.15, rim: 1.4, key: 2.3, bounce: .7, exposure: 1.0 }
  };

  const lidCafe = new THREE.Color(0xA99C8E), lidStudio = new THREE.Color(0xEEE7DD);
  let api;
  const state = { rot: 0, mood: 0, logo: 0 };
  function render(){
    const a = MOODS.cafe, b = MOODS.studio, m = state.mood;
    hemi.intensity = L(a.hemi, b.hemi, m); rim.intensity = L(a.rim, b.rim, m); key.intensity = L(a.key, b.key, m); bounce.intensity = L(a.bounce, b.bounce, m);
    renderer.toneMappingExposure = L(a.exposure, b.exposure, m);
    lidMat.color.copy(lidCafe).lerp(lidStudio, m);
    group.rotation.y = state.rot; decalMat.opacity = state.logo;
    renderer.render(scene, cam); api.dirty = false;
  }
  api = {
    dirty: true, state, render, MOODS,
    size(pxH){ const h = Math.max(64, Math.min(1400, Math.round(pxH))), w = Math.round(h * BOX_W / BOX_H); renderer.setSize(w, h, false); api.dirty = true; },
    set(o){ for (const k in o){ if (state[k] !== o[k]){ state[k] = o[k]; api.dirty = true; } } }
  };
  return api;
}
