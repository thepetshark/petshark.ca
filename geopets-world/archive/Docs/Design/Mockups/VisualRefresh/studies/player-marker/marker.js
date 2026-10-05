/* The player marker and the ring of the interaction area: every ring and every marker of the study, drawn live on the
   owner's real map through ../shared/mapfx.js. A phone names its pair with data-ring and data-marker; the zoom and the
   time of day are page-wide switches, except in the chooser, whose three phones are fixed to the three zooms. */
(function () {
  "use strict";
  var M = window.MAPFX, G = window.NIGHT_GEOMETRY, E = M.ease;
  var INK = "#24483B", PAPER = "#FAF4E5", CORAL = "#FF7A59", CYAN = "#6FE3F5", HONEY = "#FFD79A";
  var view = { zoom: "default", time: "day" };

  /* the way the player faces, swaying slowly so a heading marker can be seen to turn. 0 = straight away from the camera.
     A page may set window.MARKER_HEADING: "off" when the phone has no compass (null comes back), or a fixed angle. */
  function heading(t) { var o = window.MARKER_HEADING; if (o === "off") return null; if (typeof o === "number") return o; return 0.55 + 0.5 * Math.sin(t * 0.45); }

  /* ---- the ring, from the line measured in the owner's screenshots -------------------------------------------- */
  var geoCache = {};
  function ringGeo(cam) {
    if (geoCache[cam.zoom]) return geoCache[cam.zoom];
    var r = G[cam.zoom].range, pts = [], i;
    if (r.type === "arc") for (i = -6; i <= 396; i += 3) pts.push([i, r.a + r.b * i + r.c * i * i]);
    else for (i = 0; i <= 140; i++) pts.push([r.cx + Math.cos(i / 140 * 2 * Math.PI) * r.rx, r.cy + Math.sin(i / 140 * 2 * Math.PI) * r.ry]);
    var world = pts.map(function (p) { return cam.ground(p[0], p[1]); }), R = 0;
    world.forEach(function (g) { R += Math.sqrt(g.X * g.X + g.Z * g.Z) / world.length; });
    return (geoCache[cam.zoom] = { pts: pts, world: world, open: r.type === "arc", R: R });
  }
  /* the ring moved w units toward the player (negative = outward), or lifted to height h */
  function moved(cam, geo, w, h) {
    return geo.world.map(function (g) { var d = Math.sqrt(g.X * g.X + g.Z * g.Z), k = 1 - w / d, q = cam.project(g.X * k, h || 0, g.Z * k); return [q.x, q.y]; });
  }
  function trace(c, pts, close) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); if (close) c.closePath(); }
  function stroke(c, pts, style, width, alpha) { c.globalAlpha = alpha; c.strokeStyle = style; c.lineWidth = width; c.lineJoin = "round"; trace(c, pts); c.stroke(); c.globalAlpha = 1; }
  /* the ground inside the ring as a closed shape: an arc is closed down the sides of the screen, where its near side lies */
  function inside(geo, pts) { return geo.open ? pts.concat([[M.W + 8, M.H + 60], [-8, M.H + 60]]) : pts; }
  function strip(c, a, b, style, alpha) { c.globalAlpha = alpha; c.fillStyle = style; c.beginPath(); a.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); for (var i = b.length - 1; i >= 0; i--) c.lineTo(b[i][0], b[i][1]); c.closePath(); c.fill(); c.globalAlpha = 1; }

  var RINGS = {
    today: function (fr, geo) { stroke(fr.ground, geo.pts, "#3FA0F5", 1.2, 1); },
    cased: function (fr, geo) { stroke(fr.ground, geo.pts, INK, 4.4, 0.95); stroke(fr.ground, geo.pts, PAPER, 2.2, 1); },
    band: function (fr, geo) {
      var n = 30, depth = 46 * fr.cam.scale, prev = geo.pts, k, next;   /* many thin strips: a dozen showed as steps */
      for (k = 0; k < n; k++) { next = moved(fr.cam, geo, (k + 1) * depth / n); strip(fr.ground, prev, next, fr.night ? "#CFF6FF" : "#F4FFFF", (fr.night ? 0.30 : 0.40) * Math.pow(1 - k / n, 1.5)); prev = next; }
      if (fr.night) stroke(fr.add, geo.pts, CYAN, 6, 0.28);
      stroke(fr.ground, geo.pts, PAPER, 1.8, 0.96);
    },
    dashes: function (fr, geo) {
      var c = fr.ground; c.setLineDash([11, 9]); c.lineDashOffset = -fr.t * 9; c.lineCap = "butt";
      stroke(c, geo.pts, INK, 4.6, 0.95); stroke(c, geo.pts, PAPER, 2.4, 1); c.setLineDash([]);
    },
    curtain: function (fr, geo) {
      var top = moved(fr.cam, geo, 0, 11 * fr.cam.scale), c = fr.night ? fr.add : fr.ground, i;
      for (i = 0; i < geo.pts.length - 1; i++) {
        var a = geo.pts[i], b = geo.pts[i + 1], ta = top[i], tb = top[i + 1], shimmer = 0.72 + 0.28 * Math.sin(i * 0.55 - fr.t * 2.4);
        var g = c.createLinearGradient((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (ta[0] + tb[0]) / 2, (ta[1] + tb[1]) / 2);
        g.addColorStop(0, fr.night ? M.rgba(CYAN, 0.62 * shimmer) : "rgba(255,255,255," + 0.5 * shimmer + ")"); g.addColorStop(1, fr.night ? M.rgba(CYAN, 0) : "rgba(255,255,255,0)");
        c.fillStyle = g; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0] + 0.5, b[1]); c.lineTo(tb[0] + 0.5, tb[1]); c.lineTo(ta[0], ta[1]); c.closePath(); c.fill();
      }
      stroke(fr.ground, geo.pts, PAPER, 1.6, 0.95);
    },
    lit: function (fr, geo) {
      var c = fr.ground, n = 8, soft = 26 * fr.cam.scale, dim = fr.night ? 0.36 : 0.30, prev = geo.pts, k, next;
      if (fr.night && M.ok(fr.albedo)) { c.save(); trace(c, inside(geo, geo.pts), true); c.clip(); c.globalAlpha = 0.40; c.drawImage(fr.albedo, 0, 0, M.W, M.H); c.restore(); c.globalAlpha = 1; }
      for (k = 0; k < n; k++) { next = moved(fr.cam, geo, -(k + 1) * soft / n); strip(c, prev, next, "#0C162C", dim * (k + 0.5) / n); prev = next; }
      c.globalAlpha = dim; c.fillStyle = "#0C162C"; c.beginPath(); c.rect(-10, -10, M.W + 20, M.H + 80);
      inside(geo, prev).forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.fill("evenodd"); c.globalAlpha = 1;
      stroke(c, geo.pts, PAPER, 1.4, 0.8);
    },
    sonar: function (fr, geo) {
      stroke(fr.ground, geo.pts, INK, 3.2, 0.9); stroke(fr.ground, geo.pts, PAPER, 1.5, 1);
      var k = (fr.t % 3.6) / 2.8; if (k >= 1) return;
      var r = geo.R * (0.03 + 0.97 * E.outCubic(k)), a = 0.62 * Math.pow(1 - k, 1.3);
      fr.circlePath(fr.ground, 0, 0, r, 0.3, 96); fr.ground.globalAlpha = a; fr.ground.strokeStyle = PAPER; fr.ground.lineWidth = 2.4 - k; fr.ground.stroke(); fr.ground.globalAlpha = 1;
      fr.circlePath(fr.add, 0, 0, r, 0.3, 96); fr.add.globalAlpha = a * 0.5; fr.add.strokeStyle = CYAN; fr.add.lineWidth = 6; fr.add.stroke(); fr.add.globalAlpha = 1;
    }
  };

  /* ---- small meshes --------------------------------------------------------------------------------------------- */
  function ngon(n, r, y, turn) { var v = []; for (var i = 0; i < n; i++) v.push([Math.cos(i / n * 2 * Math.PI + (turn || 0)) * r, y, Math.sin(i / n * 2 * Math.PI + (turn || 0)) * r]); return v; }
  function prism(n, r, y0, y1, color, turn) {
    var v = ngon(n, r, y0, turn).concat(ngon(n, r, y1, turn)), f = [], top = [], bottom = [];
    for (var i = 0; i < n; i++) { f.push([i, (i + 1) % n, n + (i + 1) % n, n + i]); top.push(n + i); bottom.push(i); }
    f.push(top); f.push(bottom); return { v: v, f: f, color: color };
  }
  function pyramid(n, r, y0, apex, color, turn, at) {
    var v = ngon(n, r, y0, turn).concat([[0, apex, 0]]), f = [], base = [];
    for (var i = 0; i < n; i++) { f.push([i, (i + 1) % n, n]); base.push(i); }
    f.push(base); if (at) v = v.map(function (p) { return [p[0] + at[0], p[1], p[2] + at[1]]; });
    return { v: v, f: f, color: color };
  }
  function box(cx, y0, cz, sx, sy, sz, color) {
    var x0 = cx - sx / 2, x1 = cx + sx / 2, z0 = cz - sz / 2, z1 = cz + sz / 2, y1 = y0 + sy;
    return { v: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]],
      f: [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [4, 5, 6, 7], [0, 1, 2, 3]], color: color };
  }
  function roof(cx, y0, cz, sx, sy, sz, color) {
    var x0 = cx - sx / 2, x1 = cx + sx / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    return { v: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y0 + sy, cz], [x1, y0 + sy, cz]], f: [[0, 1, 5, 4], [3, 2, 5, 4], [0, 3, 4], [1, 2, 5], [0, 1, 2, 3]], color: color };
  }
  var GEM = [{ v: [[0, 1, 0], [0, -1.35, 0], [0.64, 0, 0], [0, 0, 0.64], [-0.64, 0, 0], [0, 0, -0.64]], f: [[0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 2], [1, 3, 2], [1, 4, 3], [1, 5, 4], [1, 2, 5]], color: CORAL, glow: true }];
  var LEAF = [
    { v: [[0, 0, 1.7], [0, 0.34, 0.1], [-0.8, 0, -0.05], [0, 0.1, -1.05]], f: [[0, 1, 2], [2, 1, 3]], color: PAPER, glow: true, flat: true, line: INK },
    { v: [[0, 0, 1.7], [0, 0.34, 0.1], [0.8, 0, -0.05], [0, 0.1, -1.05]], f: [[0, 2, 1], [2, 3, 1]], color: "#EFE6CC", glow: true, flat: true, line: INK }
  ];
  var ISLAND = [
    pyramid(6, 1.0, 0, -1.45, "#8C7B69", 0.26), prism(6, 1.08, 0, 0.24, "#6FBF5B", 0.26),
    box(-0.22, 0.24, 0.05, 0.62, 0.42, 0.5, PAPER), roof(-0.22, 0.66, 0.05, 0.74, 0.34, 0.62, "#E8664A"),
    pyramid(5, 0.24, 0.24, 1.0, "#3E8F4E", 0, [0.5, -0.2]), pyramid(5, 0.19, 0.24, 0.8, "#4BA25B", 0.5, [0.42, 0.42])
  ];

  function anchorRing(fr, r) { fr.ring(fr.ground, 0, 0, r, 1.5 * fr.cam.scale, INK, 0.9); fr.ring(fr.ground, 0, 0, r, 0.75 * fr.cam.scale, PAPER, 1); }
  /* where the sun puts the shadow of something hovering at height h */
  function shadowAt(fr, h) { return fr.night ? { X: 0, Z: 0 } : { X: -fr.sun.x / fr.sun.y * h, Z: -fr.sun.z / fr.sun.y * h }; }
  function shadow(fr, h, r, a) { var s = shadowAt(fr, h); fr.pool(fr.ground, s.X, s.Z, r, M.puff("#10201A"), fr.night ? a * 0.5 : a); }

  var MARKERS = {
    none: function () {},
    today: function () {},
    glyph: function (fr) {
      var cs = fr.cam.scale, r = 6.4 * cs, hd = heading(fr.t), th = hd === null ? 0 : Math.PI / 2 - hd;
      fr.onGround(fr.ground, 0, 0, function (c) {
        if (hd !== null) { var g = c.createRadialGradient(0, 0, r, 0, 0, r * 4.2); g.addColorStop(0, M.rgba(PAPER, 0.78)); g.addColorStop(1, M.rgba(PAPER, 0));
          c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r * 4.2, th - 0.5, th + 0.5); c.closePath(); c.fill(); }
        c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fillStyle = PAPER; c.fill(); c.lineWidth = 1.05 * cs; c.strokeStyle = INK; c.stroke();
        /* no compass: never a made-up direction, only a dot at the centre */
        if (hd === null) { c.beginPath(); c.arc(0, 0, r * 0.2, 0, Math.PI * 2); c.fillStyle = INK; c.fill(); return; }
        c.beginPath(); c.moveTo(Math.cos(th) * r * 0.66, Math.sin(th) * r * 0.66); c.lineTo(Math.cos(th + 2.5) * r * 0.56, Math.sin(th + 2.5) * r * 0.56); c.lineTo(Math.cos(th + Math.PI) * r * 0.16, Math.sin(th + Math.PI) * r * 0.16); c.lineTo(Math.cos(th - 2.5) * r * 0.56, Math.sin(th - 2.5) * r * 0.56); c.closePath(); c.fillStyle = INK; c.fill();
      });
    },
    gem: function (fr) {
      var cs = fr.cam.scale, h = (10.5 + 0.6 * Math.sin(fr.t * 2.1)) * cs;
      shadow(fr, h, 4.6 * cs, 0.34); anchorRing(fr, 3.6 * cs);
      if (fr.night) { fr.pool(fr.add, 0, 0, 11 * cs, M.soft(CORAL), 0.5); fr.light(0, 0, 26 * cs, "#FFB59C", 0.55); }
      fr.mesh(fr.over, GEM, [0, h, 0], fr.t * 0.9, 5.4 * cs, { unlit: true });
    },
    wisp: function (fr) {
      var cs = fr.cam.scale, h = (7 + 0.5 * Math.sin(fr.t * 1.7)) * cs, q = fr.P(0, h, 0), k = q.k * cs, i;
      anchorRing(fr, 3.4 * cs);
      fr.light(0, 0, 44 * cs, HONEY, fr.night ? 0.95 : 0.5);
      fr.pool(fr.add, 0, 0, 10 * cs, M.soft(HONEY), fr.night ? 0.55 : 0.3);
      fr.glow(fr.add, M.soft(HONEY), q.x, q.y, 13 * k, fr.night ? 0.85 : 0.6);
      /* by day light alone is lost on bright grass, so the wisp also has a body: a cream bead with a dark rim */
      fr.over.beginPath(); fr.over.arc(q.x, q.y, 2.7 * k, 0, 7); fr.over.fillStyle = "#FFF8E1"; fr.over.fill(); fr.over.lineWidth = Math.max(1, 0.42 * k); fr.over.strokeStyle = fr.night ? "#E0A94A" : INK; fr.over.stroke();
      fr.glow(fr.add, M.hot(HONEY), q.x, q.y, 6 * k, fr.night ? 1 : 0.55);
      for (i = 0; i < 5; i++) {
        var a = fr.t * 1.5 + i * 1.2566, m = fr.P(Math.cos(a) * 5 * cs, h + Math.sin(fr.t * 2.2 + i * 1.9) * 1.7 * cs, Math.sin(a) * 5 * cs);
        fr.glow(fr.add, M.hot(HONEY), m.x, m.y, 2.1 * k, 0.9); if (!fr.night) { fr.over.beginPath(); fr.over.arc(m.x, m.y, 0.6 * k, 0, 7); fr.over.fillStyle = "#FFF8E1"; fr.over.fill(); }
      }
    },
    tether: function (fr) {
      var cs = fr.cam.scale, top = fr.cam.exitHeight(0, 0), a = fr.P(0, 0, 0), b = fr.P(0, top, 0), c = fr.over, g;
      anchorRing(fr, 3.8 * cs); fr.ring(fr.ground, 0, 0, 1.0 * cs, 2.0 * cs, PAPER, 1);
      g = c.createLinearGradient(a.x, a.y, b.x, b.y); g.addColorStop(0, M.rgba(INK, 0.85)); g.addColorStop(0.6, M.rgba(INK, 0.35)); g.addColorStop(1, M.rgba(INK, 0.15));
      if (!fr.night) { c.strokeStyle = g; c.lineWidth = 3.2; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      g = c.createLinearGradient(a.x, a.y, b.x, b.y); g.addColorStop(0, M.rgba(PAPER, 1)); g.addColorStop(0.6, M.rgba(PAPER, 0.7)); g.addColorStop(1, M.rgba(PAPER, 0.4));
      c.strokeStyle = g; c.lineWidth = 1.5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      if (fr.night) { fr.column(fr.add, 0, 0, 0, top, 1.1 * cs, M.columnTex("tether", [[0, CYAN, 0], [0.5, "#EFFFFF", 0.9], [1, CYAN, 0]], 0, 1), function (h) { return 0.8 - 0.5 * h / top; }, 0, 1, 30); fr.pool(fr.add, 0, 0, 8 * cs, M.soft(CYAN), 0.45); fr.light(0, 0, 20 * cs, "#CFF6FF", 0.5); }
      var k = (fr.t % 3.2) / 2.2; if (k < 1) { var q = fr.P(0, top * E.inQuad(k), 0); fr.glow(fr.add, M.hot(fr.night ? CYAN : HONEY), q.x, q.y, 7 * q.k * cs * 0.45 + 3, E.bell(k) * 0.95); if (!fr.night) { c.beginPath(); c.arc(q.x, q.y, 2.1, 0, 7); c.fillStyle = "#FFFDF2"; c.globalAlpha = E.bell(k); c.fill(); c.globalAlpha = 1; } }
    },
    leaf: function (fr) {
      var cs = fr.cam.scale, h = (4.6 + 0.4 * Math.sin(fr.t * 1.9)) * cs;
      shadow(fr, h, 5 * cs, 0.3);
      fr.mesh(fr.over, LEAF, [0, h, 0], heading(fr.t) || 0, 6.4 * cs, { unlit: true, lineWidth: Math.max(1.1, 0.5 * fr.P(0, 0, 0).k * cs), tilt: -0.12 + 0.05 * Math.sin(fr.t * 1.9) });
    },
    island: function (fr) {
      var cs = fr.cam.scale, h = (22 + 0.8 * Math.sin(fr.t * 1.3)) * cs, size = 8.6 * cs, q, i;
      shadow(fr, h, 10 * cs, 0.36); anchorRing(fr, 3.2 * cs);
      fr.mesh(fr.over, ISLAND, [0, h, 0], 0.5 + 0.12 * Math.sin(fr.t * 0.5), size, { unlit: fr.night });
      for (i = 0; i < 3; i++) { q = fr.P([-1.25, 1.2, 0.2][i] * size, h + [-0.15, 0.05, -0.5][i] * size, [0.3, -0.5, -1.0][i] * size); fr.glow(fr.over, M.puff("#FFFFFF"), q.x + Math.sin(fr.t * 0.6 + i) * 1.5, q.y, [0.62, 0.5, 0.42][i] * size * q.k, 0.95); }
      if (fr.night) { q = fr.P(-0.22 * size, h + 0.42 * size, -0.2 * size); fr.glow(fr.add, M.hot(HONEY), q.x, q.y, 1.6 * size * q.k * 0.5, 0.9); fr.light(0, 0, 26 * cs, HONEY, 0.5); }
    }
  };

  /* ---- phones -------------------------------------------------------------------------------------------------- */
  var phones = [];
  function build(el) {
    var fixed = el.getAttribute("data-zoom-fixed"), p = { el: el, fixed: fixed, ring: el.getAttribute("data-ring"), marker: el.getAttribute("data-marker") };
    p.scene = { zoom: fixed || view.zoom, time: view.time, clear: true, bloom: false, draw: function (fr) { RINGS[p.ring](fr, ringGeo(fr.cam)); MARKERS[p.marker](fr); } };
    p.refresh = function () { p.scene.zoom = p.fixed || view.zoom; p.scene.time = view.time; p.scene.clear = p.marker !== "today"; var canvas = M.phone(el, p.scene.zoom); if (!p.stage) { p.stage = new M.Stage(canvas); p.player = new M.Player(p.stage, p.scene, { length: 3600, start: 1.2 }); } };
    p.refresh(); phones.push(p);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var q = M.state();
    if (q.capture) document.body.classList.add("capture");
    view.zoom = q.zoom || "default"; view.time = q.time || "day";
    Array.prototype.forEach.call(document.querySelectorAll(".phone[data-ring]"), build);
    function refreshAll() { phones.forEach(function (p) { p.refresh(); }); }
    M.radios("zoom", function (v) { view.zoom = v; refreshAll(); }, view.zoom);
    M.radios("time", function (v) { view.time = v; refreshAll(); }, view.time);
    var chooser = phones.filter(function (p) { return p.fixed; });
    /* a page may name its own opening pair in window.MARKER_DEFAULTS; the hash still wins */
    var D = window.MARKER_DEFAULTS || {}, ring0 = q.ring || D.ring || "sonar", marker0 = q.marker || D.marker || "wisp";
    M.radios("pick-ring", function (v) { chooser.forEach(function (p) { p.ring = v; }); }, ring0);
    M.radios("pick-marker", function (v) { chooser.forEach(function (p) { p.marker = v; p.refresh(); }); }, marker0);
    chooser.forEach(function (p) { p.ring = ring0; p.marker = marker0; p.refresh(); });
    var pause = document.getElementById("st-pause");
    function setPaused(v) { M.clock.paused = v; if (pause) { pause.setAttribute("aria-pressed", v ? "true" : "false"); pause.textContent = v ? "Play" : "Pause"; } }
    if (pause) pause.addEventListener("click", function () { setPaused(!M.clock.paused); });
    setPaused(!!q.capture || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));
    if (q.t !== undefined) M.players.forEach(function (p) { p.t = parseFloat(q.t); });
    /* for the capture script: every phone at one exact moment, in one state */
    window.STUDY = { film: function (t, scale, which) { var set = phones.filter(function (p) { return which === "rings" ? !p.fixed && p.marker === "none" : which === "markers" ? !p.fixed && p.marker !== "none" && p.marker !== "today" : p.fixed; }); return M.film(set.map(function (p) { return p.scene; }), t, scale).toDataURL("image/jpeg", 0.92); },
      set: function (s) { if (s.zoom) view.zoom = s.zoom; if (s.time) view.time = s.time; refreshAll(); M.players.forEach(function (p) { p.visible = true; p.seek(s.t === undefined ? p.t : s.t); }); },
    };
    M.start();
  });
})();
