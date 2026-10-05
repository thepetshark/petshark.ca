'use strict';
// The capture scene in 3D: placeholder Wildling models standing on the zoomed-in map, dancing to a beat.
// Everything is a pure function of the app's clock, so any moment can be captured exactly.
// Uses window.DANCE3D (three.js r159, GLTFLoader, SkeletonUtils) and window.WILDLING_GLB (base64 glTF).
(() => {
  const { THREE, GLTFLoader, cloneSkinned } = window.DANCE3D;
  // The backdrop is the in-game closest-zoom capture with its interface removed; its horizon sits 21.4 % down.
  const BACKDROP = { w: 853, h: 1844, horizon: 0.2142 };
  const FOV = 38;
  const EYE = 1.6;
  const SPOT = { target: new THREE.Vector3(0.58, 0, -7.4), dancer: new THREE.Vector3(-0.55, 0, -6.1) };
  // display heights in metres; every export is 1 unit tall
  const HEIGHT = { burrback: 0.95, emberglide: 0.94, petalwisp: 0.92, tidehaven: 0.86, hollowwing: 0.9, bramblekin: 1.1, grovehorn: 0.78 };

  let renderer, scene, camera, W = 412, H = 883;
  const gltf = {};
  const actors = {};
  const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  const tri = x => { const f = x - Math.floor(x); return f < 0.5 ? 4 * f - 1 : 3 - 4 * f; };

  function buffer(b64) {
    const bin = atob(b64), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  }

  const shadowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    r.addColorStop(0, 'rgba(26,48,30,0.55)');
    r.addColorStop(0.6, 'rgba(26,48,30,0.28)');
    r.addColorStop(1, 'rgba(26,48,30,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();

  function makeActor(id) {
    const g = gltf[id];
    const root = new THREE.Group();
    const pivot = new THREE.Group();
    const body = cloneSkinned(g.scene);
    const h = HEIGHT[id] || 1;
    body.scale.setScalar(h);
    pivot.add(body);
    root.add(pivot);
    body.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(body, true);
    const size = box.getSize(new THREE.Vector3());
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.004;
    shadow.scale.set(Math.max(size.x, 0.5) * 1.25, Math.max(size.z, 0.45) * 1.25, 1);
    root.add(shadow);
    const mixer = new THREE.AnimationMixer(body);
    const actions = {};
    g.animations.forEach(c => { actions[c.name] = mixer.clipAction(c); });
    root.visible = false;
    scene.add(root);
    return { id, root, pivot, body, shadow, mixer, actions, height: h, size, current: null };
  }

  function clip(actor, name, t, loop = true, speed = 1) {
    const a = actor.actions[name] || actor.actions.idle;
    if (actor.current !== a) {
      Object.values(actor.actions).forEach(x => x.stop());
      a.play();
      actor.current = a;
    }
    const d = a.getClip().duration;
    const tt = t * speed;
    a.time = loop ? ((tt % d) + d) % d : Math.min(Math.max(tt, 0), d - 1e-3);
    actor.mixer.update(0);
  }

  function reset(actor) {
    actor.pivot.position.set(0, 0, 0);
    actor.pivot.rotation.set(0, 0, 0);
    actor.pivot.scale.set(1, 1, 1);
  }

  // One motion per dance style, in beats: Sway flickers, Twirl spins, Shuffle side-steps, Stomp thumps, Hop bounces.
  function dance(actor, style, t, beat, amount = 1) {
    const b = t / beat, s = Math.abs(Math.sin(b * Math.PI));
    const p = actor.pivot;
    switch (style) {
      case 'sway':
        p.rotation.z = Math.sin(b * Math.PI) * 0.24 * amount;
        p.position.x = Math.sin(b * Math.PI) * 0.08 * amount;
        p.position.y = s * 0.03 * amount;
        break;
      case 'twirl': {
        const u = b / 2, turn = Math.floor(u) + ease(u - Math.floor(u));
        p.rotation.y = turn * Math.PI * 2 * amount;
        p.position.y = s * 0.05 * amount;
        break;
      }
      case 'shuffle':
        p.position.x = tri(b / 2) * 0.2 * amount;
        p.rotation.z = Math.sin(b * Math.PI * 2) * 0.06 * amount;
        p.position.y = s * 0.025 * amount;
        break;
      case 'stomp':
        p.position.y = s * 0.1 * amount;
        p.scale.set(1 + (1 - s) * 0.06 * amount, 1 - (1 - s) * 0.09 * amount, 1 + (1 - s) * 0.06 * amount);
        break;
      case 'hop':
        p.position.y = s * 0.34 * amount;
        p.scale.set(1 - (s - 0.5) * 0.08 * amount, 1 + (s - 0.5) * 0.14 * amount, 1 - (s - 0.5) * 0.08 * amount);
        break;
    }
  }

  const Stage = {
    ready: false,
    async init(canvas) {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xfff9ea, 0x6e8a55, 1.5));
      const sun = new THREE.DirectionalLight(0xffffff, 1.55);
      sun.position.set(-4, 7, 5);
      scene.add(sun);
      camera = new THREE.PerspectiveCamera(FOV, W / H, 0.05, 200);
      const loader = new GLTFLoader();
      await Promise.all(Object.entries(window.WILDLING_GLB || {}).map(([id, b64]) =>
        new Promise((resolve, reject) => loader.parse(buffer(b64), '', g => { gltf[id] = g; resolve(); }, reject))));
      Object.keys(gltf).forEach(id => { actors[id] = makeActor(id); });
      Stage.ready = true;
    },
    resize(w, h) {
      W = w; H = h;
      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // pitch the camera so the ground's horizon meets the backdrop's horizon at this screen size
      const s = Math.max(w / BACKDROP.w, h / BACKDROP.h);
      const horizonY = (BACKDROP.horizon * BACKDROP.h * s - (BACKDROP.h * s - h) / 2) / h;
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      camera.position.set(0, EYE, 0);
      camera.rotation.set(-Math.atan((0.5 - horizonY) * 2 * tanHalf), 0, 0);
      camera.updateProjectionMatrix();
    },
    // Pose every actor for scene time t. `pose` describes what each one is doing; see app.js.
    render(pose) {
      if (!Stage.ready) return;
      Object.values(actors).forEach(a => { a.root.visible = false; });
      const beat = pose.beat;
      const tg = pose.target && actors[pose.target.id];
      const dn = pose.dancer && actors[pose.dancer.id];
      if (tg) {
        const p = pose.target, a = tg;
        a.root.visible = p.visible !== false;
        reset(a);
        a.root.position.copy(SPOT.target);
        const face = dn ? Math.atan2(SPOT.dancer.x - SPOT.target.x, SPOT.dancer.z - SPOT.target.z) : -0.18;
        a.root.rotation.y = face;
        const t = p.t;
        switch (p.mode) {
          case 'spawn': {
            const k = ease(t / 0.45);
            a.pivot.scale.setScalar(0.2 + 0.8 * k + Math.sin(k * Math.PI) * 0.12);
            clip(a, 'idle', t);
            break;
          }
          case 'impressed':
            dance(a, 'sway', t, beat, 0.45);
            clip(a, 'idle', t, true, 1.2);
            break;
          case 'bored':
            a.pivot.rotation.y = -0.45 * ease(t / 0.5);
            clip(a, 'idle', t, true, 0.7);
            break;
          case 'entranced':
            a.pivot.rotation.z = Math.sin(t / beat * Math.PI / 2) * 0.16;
            a.pivot.position.y = 0.06 + Math.sin(t / beat * Math.PI) * 0.04;
            clip(a, 'idle', t, true, 0.5);
            break;
          case 'shake':
            a.pivot.rotation.y = Math.sin(t * Math.PI * 7) * 0.38 * (1 - ease(t / 0.9));
            clip(a, 'idle', t);
            break;
          case 'leave': {
            const turn = ease(t / 0.5);
            a.root.rotation.y = face + Math.PI * turn;
            const walk = Math.max(0, t - 0.45);
            const dir = new THREE.Vector3(0.35, 0, -1).normalize();
            a.root.position.addScaledVector(dir, walk * 1.15);
            if (walk > 0) clip(a, 'walk', walk, true, 1.1); else clip(a, 'idle', t);
            a.root.visible = walk < 4.2;
            break;
          }
          case 'captured': {
            const k = ease(t / 0.55);
            a.pivot.scale.setScalar(Math.max(0.001, 1 - k));
            a.pivot.rotation.y = k * Math.PI * 2;
            a.pivot.position.y = k * 0.35;
            a.shadow.visible = k < 0.9;
            clip(a, 'idle', t, true, 0.5);
            a.root.visible = t < 0.6;
            break;
          }
          default:
            clip(a, 'idle', t);
        }
        if (p.mode !== 'captured') a.shadow.visible = true;
      }
      if (dn) {
        const p = pose.dancer, a = dn;
        a.root.visible = true;
        reset(a);
        a.root.position.copy(SPOT.dancer);
        a.root.rotation.y = Math.atan2(SPOT.target.x - SPOT.dancer.x, SPOT.target.z - SPOT.dancer.z);
        const t = p.t;
        switch (p.mode) {
          case 'enter': {
            const k = ease(t / 0.5);
            a.pivot.scale.setScalar(Math.max(0.001, k + Math.sin(k * Math.PI) * 0.15));
            a.pivot.position.y = (1 - k) * 0.6;
            clip(a, 'idle', t);
            break;
          }
          case 'dance':
            dance(a, p.style, t, beat, 1);
            clip(a, 'idle', t, true, 1.35);
            break;
          case 'flourish': {
            if (a.actions.flourish) {
              clip(a, 'flourish', t, false, 1);
              dance(a, p.style, t, beat, 0.5);
            } else {
              const k = ease(t / (beat * 1.5));
              a.pivot.rotation.y = k * Math.PI * 2;
              a.pivot.position.y = Math.sin(k * Math.PI) * 0.45;
              clip(a, 'idle', t, true, 1.6);
            }
            break;
          }
          case 'proud':
            a.pivot.position.y = Math.abs(Math.sin(t * Math.PI * 1.6)) * 0.12 * (1 - ease(t / 1.6));
            clip(a, 'idle', t);
            break;
          case 'sad':
            a.pivot.rotation.x = 0.12 * ease(t / 0.6);
            a.pivot.scale.set(1, 0.97, 1);
            clip(a, 'idle', t, true, 0.6);
            break;
          default:
            clip(a, 'idle', t);
        }
      }
      renderer.render(scene, camera);
    },
    // Screen positions (CSS px) for overlays: the target's feet ring and head, and the dancer's head.
    project(role, what) {
      const spot = SPOT[role];
      const v = new THREE.Vector3();
      if (what === 'ring') {
        const pts = [];
        const a = actors[Object.keys(actors).find(k => k === Stage.targetId)] || null;
        const r = a ? Math.min(0.6, Math.max(0.38, Math.max(a.size.x, a.size.z) * 0.42)) : 0.5;
        for (let i = 0; i <= 72; i++) {
          const ang = Math.PI / 2 + (i / 72) * Math.PI * 2;
          v.set(spot.x + Math.cos(ang) * r, 0.01, spot.z + Math.sin(ang) * r).project(camera);
          pts.push([(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]);
        }
        return pts;
      }
      const id = role === 'target' ? Stage.targetId : Stage.dancerId;
      const h = (actors[id] && actors[id].height) || 1;
      v.set(spot.x, what === 'head' ? h * 1.08 : 0, spot.z).project(camera);
      return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H];
    },
    targetId: 'burrback',
    dancerId: null,
  };
  window.Stage = Stage;
})();
