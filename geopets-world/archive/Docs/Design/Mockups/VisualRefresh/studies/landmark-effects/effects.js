/* The landmark effects: the Orb post, the Spring and the Pavilion drawn in 3D from their real meshes (models/web/*.js), through the game's camera numbers (../shared/scene.js), over the map plates, with today's interface on
   top (../shared/mapfx.js phone()). Every effect is what Unity would use: an emissive material, a water surface whose
   ripples come from its shader, a jet whose flow is a scrolling band, a vertex wave on the pennant, a few sprites and
   particles, and at night a light added to the ground in its own colours. Everything is a pure function of time, so a
   capture script can ask for an exact moment. Axes: three.js, Y up, -Z away from the camera; one unit is one map unit. */
(function () {
  "use strict";
  var T = window.THREE, S = window.STUDY_SCENE, MESH = window.LANDMARK_MESHES, M = window.MAPFX;
  T.ColorManagement.enabled = false;                       // colours as they are: the project renders in Gamma
  var W = 390, H = 844;
  var SUN = new T.Vector3(-0.45, 0.78, -0.43).normalize();  // toward the sun, from mapfx.js SUN (its +Z is away = three -Z)
  var MOON = new T.Vector3(0.35, 0.8, -0.3).normalize();
  var LIGHT = {
    day: { dir: SUN, col: new T.Vector3(0.98, 0.95, 0.88), amb: new T.Vector3(0.5, 0.53, 0.58) },
    night: { dir: MOON, col: new T.Vector3(0.28, 0.34, 0.5), amb: new T.Vector3(0.14, 0.17, 0.26) }
  };
  /* where each object stands on the map, round the player (x right, z; negative z is away from the camera) */
  var PLACES = { orb_post: [-30, -40], spring: [26, -26], pavilion: [-4, -92] };
  var view = { time: "day", state: "cycle", orb: "a", spring: "a", lantern: "a", glow: "disc" };   // the chosen options
  var CYCLE = 12, HALF = 6, EASE = 0.9;                     // the study's stand-in for the game's 100-second cooldown

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
  function bell(x) { return Math.sin(Math.PI * clamp01(x)); }

  /* ready (1) or cooling down (0), and how far through the cooldown, at time t */
  function status(t) {
    if (view.state === "ready") return { r: 1, prog: 1, since: 99, ready: true };
    if (view.state === "cooling") return { r: 0, prog: (t % HALF) / HALF, since: 99, ready: false };
    var ph = ((t % CYCLE) + CYCLE) % CYCLE, ready = ph < HALF, since = ready ? ph : ph - HALF;
    return { r: ready ? smooth(since / EASE) : 1 - smooth(since / EASE), prog: ready ? 1 : since / HALF, since: since, ready: ready };
  }

  /* ---- textures, made on the page (so a page opened from disk may use them in WebGL) ---------------------------- */
  function canvasTexture(size, paint) { var c = document.createElement("canvas"); c.width = c.height = size; paint(c.getContext("2d"), size); var t = new T.CanvasTexture(c); t.colorSpace = T.NoColorSpace; return t; }
  var SOFT = canvasTexture(64, function (x, n) { var g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); [[0, 1], [0.2, 0.62], [0.45, 0.22], [0.7, 0.06], [1, 0]].forEach(function (s) { g.addColorStop(s[0], "rgba(255,255,255," + s[1] + ")"); }); x.fillStyle = g; x.fillRect(0, 0, n, n); });
  var RING = canvasTexture(64, function (x, n) { var g = x.createRadialGradient(n / 2, n / 2, n * 0.3, n / 2, n / 2, n / 2); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.7, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, n, n); });
  var BLOB = canvasTexture(64, function (x, n) { var g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); g.addColorStop(0, "rgba(16,32,26,0.55)"); g.addColorStop(0.6, "rgba(16,32,26,0.28)"); g.addColorStop(1, "rgba(16,32,26,0)"); x.fillStyle = g; x.fillRect(0, 0, n, n); });

  /* ---- materials: one small shader family, lit like the map ------------------------------------------------------ */
  var VERT = [
    "attribute vec3 aColor; varying vec3 vN; varying vec3 vC; varying vec3 vW;",
    "uniform float uTime; uniform float uWave; uniform float uWaveX0;",
    "void main() { vec3 p = position;",
    "  if (uWave > 0.0) { float k = clamp((p.x - uWaveX0) / 2.3, 0.0, 1.0); p.z += uWave * k * sin(p.x * 2.6 - uTime * 6.0); }",
    "  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vC = aColor;",
    "  gl_Position = projectionMatrix * viewMatrix * w; }"].join("\n");
  var LIT = "uniform vec3 uL; uniform vec3 uLC; uniform vec3 uAmb; vec3 lit(vec3 b, vec3 n) { return b * (uAmb + uLC * max(dot(normalize(n), uL), 0.0)); }\n";
  var FRAG = {
    /* the body; also the orb and the lantern, with emission */
    body: LIT + "varying vec3 vN; varying vec3 vC; varying vec3 vW; uniform float uEmit; uniform vec3 uEmitCol; uniform float uAlbedo;\n" +
      "uniform vec3 uLampPos; uniform float uLamp;\n" +
      "void main() { vec3 toL = uLampPos - vW; float fall = pow(max(0.0, 1.0 - length(toL) / 7.0), 2.0);\n" +
      "  vec3 lamp = vC * vec3(1.0, 0.72, 0.38) * uLamp * fall * max(dot(normalize(vN), normalize(toL)), 0.0) * 2.2;\n" +
      "  gl_FragColor = vec4(lit(vC * uAlbedo, vN) + uEmitCol * uEmit + lamp, 1.0); }",
    /* the water surface: rings moving out from the centre, a moving glint, and at night a faint blue glow of its own, strong
       enough to find the Spring by (the owner, 2026-09-22) */
    water: LIT + "varying vec3 vN; varying vec3 vC; varying vec3 vW; uniform float uTime; uniform float uCalm; uniform float uNight; uniform vec3 uCentre;\n" +
      "void main() { float d = length(vW.xz - uCentre.xz); float ring = sin(d * 2.8 - uTime * 3.4) * (1.0 - uCalm) * smoothstep(0.2, 1.2, d);\n" +
      "  float glint = pow(max(0.0, sin(vW.x * 3.1 + uTime * 1.7) * sin(vW.z * 2.7 - uTime * 1.3)), 8.0) * (1.0 - uCalm);\n" +
      "  vec3 c = lit(vC, vN) + vec3(0.07, 0.10, 0.12) * ring + vec3(0.35, 0.40, 0.42) * glint + uNight * vec3(0.08, 0.30, 0.50);\n" +
      "  gl_FragColor = vec4(c, 1.0); }",
    /* the jet: bands flowing up it */
    jet: LIT + "varying vec3 vN; varying vec3 vC; varying vec3 vW; uniform float uTime; uniform float uNight;\n" +
      "void main() { float b = 0.5 + 0.5 * sin(vW.y * 3.2 - uTime * 7.0);\n" +
      "  vec3 c = lit(vC, vN) * (0.9 + 0.22 * b) + uNight * vec3(0.08, 0.28, 0.46) + vec3(0.06) * b;\n" +
      "  gl_FragColor = vec4(c, 1.0); }"
  };
  function material(kind, light, extra) {
    var u = { uL: { value: light.dir }, uLC: { value: light.col }, uAmb: { value: light.amb }, uTime: { value: 0 }, uWave: { value: 0 }, uWaveX0: { value: 0 },
      uEmit: { value: 0 }, uEmitCol: { value: new T.Vector3(1, 0.8, 0.3) }, uAlbedo: { value: 1 }, uLampPos: { value: new T.Vector3() }, uLamp: { value: 0 }, uCalm: { value: 0 }, uNight: { value: 0 }, uCentre: { value: new T.Vector3() } };
    Object.keys(extra || {}).forEach(function (k) { u[k] = { value: extra[k] }; });
    return new T.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG[kind] });
  }
  function geometry(part) {
    var g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(part.position, 3));
    g.setAttribute("normal", new T.Float32BufferAttribute(part.normal, 3));
    g.setAttribute("aColor", new T.Float32BufferAttribute(part.color, 3));
    return g;
  }
  function sprite(tex, color, additive) {
    return new T.Sprite(new T.SpriteMaterial({ map: tex, color: new T.Color(color), transparent: true, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending }));
  }
  function blob(radius) {
    var m = new T.Mesh(new T.PlaneGeometry(radius * 2, radius * 2), new T.MeshBasicMaterial({ map: BLOB, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.04;
    return m;
  }

  /* ---- one object on a stage, with its effects ------------------------------------------------------------------- */
  function Rig(stage, name, at) {
    var root = new T.Group(), parts = MESH[name].parts, light = stage.light, self = this, mats = [];
    root.position.set(at[0], 0, at[1]);
    stage.scene.add(root);
    this.name = name; this.root = root; this.at = at; this.sprites = [];
    var shadow = blob(name === "orb_post" ? 3.2 : 6.6); shadow.position.x = 0.9; shadow.position.z = 0.9; root.add(shadow);
    Object.keys(parts).forEach(function (pn) {
      var part = parts[pn], kind = pn === "Water" ? "water" : pn === "Jet" ? "jet" : "body";
      var mat = material(kind, light, pn === "Pennant" ? { uWave: 0.32, uWaveX0: 0.16 } : null);
      if (pn === "Water") mat.uniforms.uCentre.value.set(at[0], 0, at[1]);
      if (pn === "Lantern") mat.uniforms.uEmitCol.value.set(1.0, 0.72, 0.32);
      var mesh = new T.Mesh(geometry(part), mat);
      mats.push(mat);
      if (pn === "Jet") {                                   // the jet shrinks toward its base at the water line
        var pivot = new T.Group(); pivot.position.y = 2.7; mesh.position.y = -2.7; pivot.add(mesh); root.add(pivot); self.jet = pivot;
      } else if (pn === "Water") {
        var wg = new T.Group(); wg.add(mesh); root.add(wg); self.water = wg;
      } else root.add(mesh);
      self[pn] = mesh;
    });
    this.mats = mats;
    /* the owner's unlit disc on the ground at night, instead of lighting the terrain: on the map phones it is drawn onto
       the plate (MapPhone.render), in the close-ups it is this pool */
    if (stage.pools) {
      this.pool = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: SOFT, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      this.pool.rotation.x = -Math.PI / 2; this.pool.position.y = 0.06; root.add(this.pool);
    }
    if (name === "orb_post") {
      this.halo = sprite(SOFT, "#FFD34D", true); this.halo.position.y = 9.75; root.add(this.halo);
      this.pulse = sprite(RING, "#FFE08A", true); this.pulse.position.y = 9.75; root.add(this.pulse);
      this.sparks = []; for (var i = 0; i < 8; i++) { var s = sprite(SOFT, "#FFD34D", true); root.add(s); this.sparks.push(s); }
    }
    if (name === "spring") {
      this.drops = []; this.splashes = [];
      for (var j = 0; j < 10; j++) {
        var d = sprite(SOFT, "#E6F8FF", false); root.add(d); this.drops.push(d);
        var ring = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: RING, color: 0xdff6ff, transparent: true, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; this.water.add(ring); this.splashes.push(ring);
      }
    }
    if (name === "pavilion") {
      this.halo = sprite(SOFT, "#FFC45A", true); this.halo.position.y = 4.15; root.add(this.halo);
      mats.forEach(function (m) { m.uniforms.uLampPos.value.set(at[0], 4.15, at[1]); });   // the lantern's light on the deck and posts
    }
  }
  Rig.prototype.update = function (t, night) {
    var st = status(t), self = this;
    if (this.pool) this.pool.material.opacity = 0;
    this.mats.forEach(function (m) { m.uniforms.uTime.value = t; m.uniforms.uNight.value = night; });
    this.lights = [];
    if (this.name === "orb_post") {
      var r = st.r, opt = view.orb, emit, lvl = r;
      if (opt === "c") lvl = st.ready ? r : Math.max(r, st.prog * 0.8);        // Charging: fills through the cooldown
      emit = 0.06 + 0.84 * lvl + 0.12 * lvl * Math.sin(t * 2.4);
      this.Orb.material.uniforms.uEmit.value = emit;
      this.Orb.material.uniforms.uAlbedo.value = 0.45 + 0.55 * lvl;
      var halo = lvl * (night ? 0.9 : 0.4) * (1 + 0.1 * Math.sin(t * 2.4));
      this.halo.material.opacity = halo; this.halo.scale.setScalar(4.6 + 0.4 * Math.sin(t * 2.4));
      var sparks = opt === "b" ? r : 0;
      this.sparks.forEach(function (s, i) {
        var ph = (t * 0.5 + i / 8) % 1, a = i * Math.PI / 4 + t * 1.2, rad = 1.7 - 0.9 * ph;
        s.position.set(Math.cos(a) * rad, 9.2 + ph * 2.6, Math.sin(a) * rad); s.scale.setScalar(0.55);
        s.material.opacity = sparks * bell(ph) * (night ? 1 : 0.8);
      });
      /* the ring: in A (the owner's choice) the moment Energy is ready again and the moment it is collected; in C when ready */
      var pulse = (opt === "a" || opt === "c" && st.ready) && st.since < 1.2 ? st.since / 1.2 : -1;
      this.pulse.material.opacity = pulse < 0 ? 0 : (1 - pulse) * 0.9; this.pulse.scale.setScalar(2.4 + pulse * 8);
      /* at night an unlit, pale gradient disc on the ground round the orb: drawn on the map phones straight onto the plate,
         added, with no terrain lighting (the owner, 2026-09-22); in the close-ups the same disc is the pool */
      if (night && lvl > 0.02 && view.glow !== "none") this.lights.push({ radius: 16, color: [255, 228, 150], a: 0.42 * lvl, unlit: true });
      if (this.pool && night && view.glow !== "none") { this.pool.scale.setScalar(32); this.pool.material.color.setRGB(1, 0.89, 0.59); this.pool.material.opacity = 0.42 * lvl; }
    }
    if (this.name === "spring") {
      var rr = st.r;
      this.water.position.y = -2.45 * (1 - rr); this.water.visible = rr > 0.02;
      this.Water.material.uniforms.uCalm.value = 1 - rr;
      this.jet.scale.set(1, Math.max(0.001, rr), 1); this.jet.visible = rr > 0.02;
      /* at night a pale blue unlit disc round the Spring while it holds water */
      if (night && rr > 0.02 && view.glow !== "none") this.lights.push({ radius: 17, color: [130, 196, 255], a: 0.6 * rr, unlit: true });
      if (this.pool && night && view.glow !== "none") { this.pool.scale.setScalar(34); this.pool.material.color.setRGB(0.51, 0.77, 1); this.pool.material.opacity = 0.6 * rr; }
      var drops = view.spring === "b" ? rr : 0;
      this.drops.forEach(function (d, i) {
        var ph = (t * 0.7 + i / 10) % 1, a = i * Math.PI * 2 / 10 + 0.3;
        d.position.set(Math.cos(a) * 2.6 * ph, 7.6 + 3.0 * ph - 7.9 * ph * ph, Math.sin(a) * 2.6 * ph); d.scale.setScalar(0.5);
        d.material.opacity = drops * (ph < 0.92 ? 1 : (1 - ph) * 12);
      });
      this.splashes.forEach(function (ring, i) {
        var ph = (t * 0.7 + i / 10) % 1, a = i * Math.PI * 2 / 10 + 0.3, k = ph < 0.3 ? ph / 0.3 : 1;
        ring.position.set(Math.cos(a) * 2.6, 2.74, Math.sin(a) * 2.6); ring.scale.setScalar(0.3 + 1.4 * k);
        ring.material.opacity = drops * (ph < 0.3 ? (1 - k) * 0.7 : 0);
      });
    }
    if (this.name === "pavilion") {
      var lamp = night ? 1 : 0;
      this.Lantern.material.uniforms.uEmit.value = 0.05 + 0.95 * lamp;
      this.halo.material.opacity = lamp * 0.85; this.halo.scale.setScalar(3.6 + 0.2 * Math.sin(t * 3.1));
      this.mats.forEach(function (m) { m.uniforms.uLamp.value = lamp * (0.92 + 0.08 * Math.sin(t * 3.1)); });
      /* A (chosen): a warm unlit disc on the ground under the lantern; B (not chosen) still lights the terrain, as reviewed */
      if (night && view.lantern === "b") this.lights.push({ y: 4.15, radius: 22, color: [255, 200, 110], a: 0.55 });
      else if (night && view.glow !== "none") this.lights.push({ radius: 20, color: [255, 206, 132], a: 0.45 * lamp, unlit: true });
      if (this.pool && night && (view.lantern === "b" || view.glow !== "none")) { this.pool.scale.setScalar(view.lantern === "b" ? 44 : 40); this.pool.material.color.setRGB(1, 0.8, 0.5); this.pool.material.opacity = view.lantern === "b" ? 0.4 : 0.45; }
    }
  };

  /* ---- a stage: a scene, a camera and a renderer on one canvas ---------------------------------------------------- */
  function Stage(canvas, w, h) {
    this.canvas = canvas; this.w = w; this.h = h;
    this.renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1); this.renderer.setSize(w, h, false);
    this.renderer.outputColorSpace = T.LinearSRGBColorSpace;
    this.scene = new T.Scene();
    this.light = { dir: LIGHT.day.dir.clone(), col: LIGHT.day.col.clone(), amb: LIGHT.day.amb.clone() };
    this.camera = new T.PerspectiveCamera(S.fov, w / h, 1, 6000);
    this.rigs = [];
  }
  Stage.prototype.setTime = function (time) { var L = LIGHT[time]; this.light.dir.copy(L.dir); this.light.col.copy(L.col); this.light.amb.copy(L.amb); };
  Stage.prototype.render = function (t, night) { this.rigs.forEach(function (r) { r.update(t, night); }); this.renderer.render(this.scene, this.camera); };

  /* ---- the map phones: the plate, the night's ground light, the 3D objects, today's interface --------------------- */
  var images = {};
  function image(src) { if (!images[src]) { var i = new Image(); i.src = src; images[src] = i; } return images[src]; }
  function ok(i) { return i && i.complete && i.naturalWidth > 0; }
  var tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H; var tx = tmp.getContext("2d");

  function MapPhone(el) {
    var zoom = el.getAttribute("data-zoom-fixed");
    var flat = M.phone(el, zoom, { markers: false });       // today's interface, and a 2D canvas for the plate and the light
    flat.width = W; flat.height = H;                         // phone() leaves the canvas at the browser's 300 x 150
    var gl = document.createElement("canvas"); gl.className = "fx-canvas lx-gl";
    el.insertBefore(gl, flat.nextSibling);
    this.el = el; this.zoom = zoom; this.flat = flat; this.ctx = flat.getContext("2d");
    this.stage = new Stage(gl, W, H);
    var z = S.camera[zoom], p = z.pitch * Math.PI / 180;
    this.stage.camera.position.set(0, S.lookAtHeight + z.distance * Math.sin(p), z.distance * Math.cos(p));
    this.stage.camera.lookAt(0, S.lookAtHeight, 0);
    var st = this.stage;
    Object.keys(PLACES).forEach(function (n) { st.rigs.push(new Rig(st, n, PLACES[n])); });
  }
  MapPhone.prototype.render = function (t) {
    var night = view.time === "night" ? 1 : 0, c = this.ctx, cam = this.stage.camera;
    this.stage.setTime(view.time);
    this.stage.render(t, night);
    /* the shared clear plates with today's striped stall painted out too (plates/provenance.json) */
    var plate = image("plates/" + view.time + "-" + this.zoom + ".png"), albedo = image("plates/day-" + this.zoom + ".png");
    c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
    if (ok(plate)) c.drawImage(plate, 0, 0, W, H); else { c.fillStyle = "#2b3a2f"; c.fillRect(0, 0, W, H); }
    var lights = [], discs = [];
    this.stage.rigs.forEach(function (r) { (r.lights || []).forEach(function (l) { (l.unlit ? discs : lights).push({ r: r, l: l }); }); });
    /* a soft pool lying on the ground: its screen ellipse from the centre and a point a radius across and a radius back
       (project() changes the vector it is called on, so each point is a fresh one) */
    function pool(ctx, o) {
      var cx = o.r.at[0], cz = o.r.at[1];
      var a = new T.Vector3(cx, 0, cz).project(cam), b = new T.Vector3(cx + o.l.radius, 0, cz).project(cam), f = new T.Vector3(cx, 0, cz - o.l.radius).project(cam);
      var x = (a.x + 1) / 2 * W, y = (1 - a.y) / 2 * H, rad = Math.abs((b.x - a.x) / 2 * W), ry = Math.abs((f.y - a.y) / 2 * H);
      var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      [[0, 1], [0.2, 0.62], [0.45, 0.22], [0.7, 0.06], [1, 0]].forEach(function (s) { g.addColorStop(s[0], "rgba(" + o.l.color.join(",") + "," + s[1] * o.l.a + ")"); });
      ctx.save(); ctx.translate(x, y); ctx.scale(1, Math.max(0.2, ry / Math.max(rad, 0.001))); ctx.translate(-x, -y);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (lights.length && ok(albedo)) {                        // light added to the ground in its own colours (mapfx light()): the Pavilion's B only
      tx.globalCompositeOperation = "source-over"; tx.fillStyle = "#000"; tx.fillRect(0, 0, W, H); tx.globalCompositeOperation = "lighter";
      lights.forEach(function (o) { pool(tx, o); });
      tx.globalCompositeOperation = "multiply"; tx.drawImage(albedo, 0, 0, W, H);
      c.globalCompositeOperation = "lighter"; c.drawImage(tmp, 0, 0); c.globalCompositeOperation = "source-over";
    }
    if (discs.length) {                                       // the unlit disc: its own colour added over the ground, no lighting
      c.globalCompositeOperation = "lighter"; discs.forEach(function (o) { pool(c, o); }); c.globalCompositeOperation = "source-over";
    }
  };

  /* ---- the close-ups: one object on a patch of ground, closer, at the default camera tilt ------------------------ */
  function CloseUp(el) {
    var name = el.getAttribute("data-model"), canvas = document.createElement("canvas"); canvas.width = canvas.height = 360; el.appendChild(canvas);
    this.name = name; this.stage = new Stage(canvas, 360, 360); this.stage.pools = true;
    var st = this.stage, rig = new Rig(st, name, [0, 0]);
    st.rigs.push(rig);
    this.ground = new T.Mesh(new T.CircleGeometry(15, 24), new T.MeshBasicMaterial({ color: 0x7cb455 }));
    this.ground.rotation.x = -Math.PI / 2; st.scene.add(this.ground);
    var h = { orb_post: 11, spring: 8, pavilion: 15 }[name], p = 40.2 * Math.PI / 180, a = 25 * Math.PI / 180, d = h * 2.6 + 16;
    st.camera.fov = 30; st.camera.updateProjectionMatrix();
    st.camera.position.set(Math.sin(a) * Math.cos(p) * d, h * 0.45 + Math.sin(p) * d, Math.cos(a) * Math.cos(p) * d);
    st.camera.lookAt(0, h * 0.45, 0);
  }
  CloseUp.prototype.render = function (t) {
    var night = view.time === "night" ? 1 : 0;
    this.stage.setTime(view.time);
    this.ground.material.color.set(night ? 0x1f3a33 : 0x7cb455);
    this.stage.renderer.setClearColor(night ? 0x0e1a24 : 0xc9d4c4, 1);
    this.stage.render(t, night);
  };

  /* ---- the page ------------------------------------------------------------------------------------------------- */
  var views = [], clock = { t: 0, last: 0, paused: false };
  function renderAll() { views.forEach(function (v) { v.render(clock.t); }); }
  function tick(now) {
    var dt = Math.min(0.1, (now - clock.last) / 1000); clock.last = now;
    if (!clock.paused) clock.t += dt;
    renderAll(); requestAnimationFrame(tick);
  }
  document.addEventListener("DOMContentLoaded", function () {
    var q = M.state(), capture = !!q.capture;
    if (capture) document.body.classList.add("capture");
    Array.prototype.forEach.call(document.querySelectorAll(".phone[data-zoom-fixed]"), function (el) { views.push(new MapPhone(el)); });
    Array.prototype.forEach.call(document.querySelectorAll(".lx-close[data-model]"), function (el) { views.push(new CloseUp(el)); });
    Array.prototype.forEach.call(document.querySelectorAll('.nm-bar input[type="radio"]'), function (r) {
      if (view[r.name] !== undefined) r.checked = r.value === view[r.name];
      r.addEventListener("change", function () { if (r.checked) { view[r.name] = r.value; renderAll(); } });
    });
    var pause = document.getElementById("st-pause");
    function setPaused(v) { clock.paused = v; if (pause) { pause.setAttribute("aria-pressed", v ? "true" : "false"); pause.textContent = v ? "Play" : "Pause"; } }
    if (pause) pause.addEventListener("click", function () { setPaused(!clock.paused); });
    setPaused(capture || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));
    /* for the capture script: any state at an exact moment */
    window.STUDY = { set: function (s) { Object.keys(s).forEach(function (k) { if (k === "t") clock.t = s.t; else view[k] = s[k]; }); renderAll(); }, view: view, cycle: CYCLE, half: HALF };
    clock.last = performance.now(); requestAnimationFrame(tick);
  });
})();
