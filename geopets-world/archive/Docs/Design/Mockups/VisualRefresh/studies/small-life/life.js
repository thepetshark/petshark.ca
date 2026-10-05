/* Small life: fireflies at night, butterflies by day, and three ways birds could cross the map - drawn live on the owner's
   real map through ../shared/mapfx.js. None of it is a creature to collect; it is there so the world looks lived in.

   Everything is placed where it would belong in the owner's screenshots - the blackberry patch, the trees, the meadow, the
   shore, the water - and every position is a pure function of time, so nothing keeps state and any moment can be asked for.
   A phone says what it shows with data-life: fireflies | fireflies-step | butterflies | skein | gulls | flock. */
(function () {
  "use strict";
  var M = window.MAPFX, E = M.ease;
  var INK = "#24483B", CREAM = "#FBF7EA";
  var view = { zoom: "default" };

  /* where small life belongs, per zoom: the middle in screen pixels of the owner's screenshots, the reach in ground units
     along the screen's width and depth, and how many. Names say why it is there. */
  var PLACES = {
    "default": [{ name: "blackberry patch", at: [92, 322], r: [22, 12], n: 16 }, { name: "trees", at: [376, 350], r: [10, 18], n: 10 }, { name: "meadow by the shore", at: [150, 588], r: [36, 16], n: 18 }, { name: "meadow", at: [255, 470], r: [22, 13], n: 9 }],
    "zoom-in": [{ name: "blackberry patch", at: [58, 300], r: [13, 7], n: 12 }, { name: "meadow", at: [140, 560], r: [15, 8], n: 16 }, { name: "meadow", at: [300, 480], r: [17, 9], n: 12 }],
    "zoom-out": [{ name: "blackberry patch", at: [131, 338], r: [24, 18], n: 13 }, { name: "trees", at: [336, 355], r: [38, 34], n: 22 }, { name: "meadow by the shore", at: [92, 566], r: [40, 24], n: 16 }, { name: "meadow", at: [196, 470], r: [30, 20], n: 9 }]
  };
  /* over water, for the gulls: the water study's fishing spot; the zoomed-in screenshot has no water, so there they wheel over the meadow */
  var OVER = { "default": [338, 676], "zoom-in": [250, 430], "zoom-out": [286, 612] };
  /* where a small flock lives: the trees */
  var GROVE = { "default": [262, 366], "zoom-in": [200, 330], "zoom-out": [292, 372] };

  function places(fr) { return PLACES[fr.cam.zoom].map(function (p) { var g = fr.cam.ground(p.at[0], p.at[1]); return { X: g.X, Z: g.Z, rx: p.r[0], rz: p.r[1], n: p.n }; }); }

  /* ---- fireflies ------------------------------------------------------------------------------------------------------
     Each drifts slowly round its own home and blinks: lit for a little under half of its beat, dark for the rest. "In step"
     is the real thing some kinds do: the beat is shared, and its timing runs across the place as a wave. */
  function fireflies(fr, inStep) {
    var t = fr.t, cs = fr.cam.scale, spr = M.hot("#E4FF7A");
    places(fr).forEach(function (pl, pi) {
      var lit = 0;
      for (var i = 0; i < pl.n; i++) {
        var k = pi * 40 + i, a = M.rnd(k, 1) * 6.2832, d = Math.sqrt(M.rnd(k, 2)), hx = pl.X + Math.cos(a) * d * pl.rx, hz = pl.Z + Math.sin(a) * d * pl.rz;
        var X = hx + Math.sin(t * (0.21 + 0.2 * M.rnd(k, 3)) + k) * 3.2 * cs + Math.sin(t * 0.9 + k * 2.1) * 0.8 * cs, Z = hz + Math.sin(t * (0.17 + 0.2 * M.rnd(k, 4)) + k * 1.7) * 3.2 * cs;
        var Y = (1.6 + 5.2 * M.rnd(k, 5) + Math.sin(t * 0.7 + k) * 0.9) * cs;
        var beat = inStep ? (t * 0.45 - (hx * 0.05 + hz * 0.03)) : (t * (0.34 + 0.3 * M.rnd(k, 6)) + M.rnd(k, 7)), ph = ((beat % 1) + 1) % 1, b = ph < 0.42 ? Math.pow(Math.sin(ph / 0.42 * Math.PI), 1.6) : 0;
        lit += b; if (b < 0.02) continue;
        var q = fr.P(X, Y, Z); fr.glow(fr.add, spr, q.x, q.y, (1.5 + 1.3 * b) * q.k * cs, b);
      }
      fr.light(pl.X, pl.Z, Math.max(pl.rx, pl.rz) * 1.5, "#D9FF8A", 0.16 + 0.5 * lit / pl.n);
    });
  }

  /* ---- butterflies ----------------------------------------------------------------------------------------------------
     A few to a place. The path wanders and jitters; the wings are two pairs of ellipses whose width is the flap; each has a
     small shadow where the sun would put it. */
  var WINGS = ["#FFFDF2", "#FFE27A", "#FF9E4A", "#8FD3FF", "#F7A8C8"];
  function butterflies(fr) {
    var t = fr.t, cs = fr.cam.scale, sun = fr.sun;
    places(fr).forEach(function (pl, pi) {
      var n = Math.max(3, Math.round(pl.n / 4));
      for (var i = 0; i < n; i++) (function (i) {
        var k = pi * 20 + i, a = M.rnd(k, 11) * 6.2832, d = Math.sqrt(M.rnd(k, 12)) * 0.8, hx = pl.X + Math.cos(a) * d * pl.rx, hz = pl.Z + Math.sin(a) * d * pl.rz;
        function at(tt) { return { X: hx + (Math.sin(tt * 0.61 + k) * 7 + Math.sin(tt * 1.7 + k * 3) * 2.2 + Math.sin(tt * 4.3 + k) * 0.7) * cs, Z: hz + (Math.sin(tt * 0.47 + k * 1.3) * 6 + Math.sin(tt * 2.1 + k) * 2 + Math.sin(tt * 3.7 + k * 2) * 0.7) * cs }; }
        var p = at(t), q = at(t + 0.06), Y = (2.6 + 1.3 * Math.sin(t * 1.9 + k) + 0.45 * Math.sin(t * 6.1 + k)) * cs, w = 2.1 * cs, flap = 0.22 + 0.78 * Math.abs(Math.sin(t * 15 + k * 2.3)), col = WINGS[k % WINGS.length];
        fr.pool(fr.ground, p.X - sun.x / sun.y * Y, p.Z - sun.z / sun.y * Y, w * 1.1, M.puff("#10201A"), 0.2);
        fr.onGround(fr.over, p.X, p.Z, function (g) {
          g.rotate(Math.atan2(-(q.X - p.X), q.Z - p.Z)); g.fillStyle = col; g.strokeStyle = M.rgba(INK, 0.55); g.lineWidth = w * 0.09;
          [[1, 1], [-1, 1]].forEach(function (s) {
            g.beginPath(); g.ellipse(s[0] * w * 0.5 * flap, w * 0.14, w * 0.5 * flap, w * 0.36, 0, 0, 7); g.fill(); g.stroke();
            g.beginPath(); g.ellipse(s[0] * w * 0.38 * flap, -w * 0.24, w * 0.38 * flap, w * 0.26, 0, 0, 7); g.fill(); g.stroke();
          });
          g.fillStyle = INK; g.beginPath(); g.ellipse(0, 0, w * 0.07, w * 0.44, 0, 0, 7); g.fill();
        }, Y);
      })(i);
    });
  }

  /* ---- birds ------------------------------------------------------------------------------------------------------------
     One bird: a body and two wings, each wing two flat pieces hinged at the elbow. It is built in the air where it flies and
     projected, so it foreshortens and banks correctly; the same outline laid on the ground where the sun would throw it is its
     shadow, and the gap between the two is what says how high it is. */
  function bird(fr, P, hx, hz, span, flap, bank, color) {
    var rx = hz, rz = -hx, lift = Math.sin(flap) * span * 0.2, sun = fr.sun;
    function pt(f, r, u) { return [P[0] + hx * f + rx * r, P[1] + u, P[2] + hz * f + rz * r]; }
    function wing(s) { var bk = s * Math.sin(bank); return [pt(span * 0.14, 0, 0), pt(span * 0.1, s * span * 0.25, lift * 0.55 + bk * span * 0.25), pt(-span * 0.1, s * span * 0.5, lift + bk * span * 0.5), pt(-span * 0.14, s * span * 0.2, lift * 0.4 + bk * span * 0.2), pt(-span * 0.1, 0, 0)]; }
    var body = [pt(span * 0.27, 0, 0), pt(span * 0.06, span * 0.06, 0), pt(-span * 0.3, 0, 0), pt(span * 0.06, -span * 0.06, 0)], parts = [wing(1), wing(-1), body];
    function trace(c, poly, shadow) { c.beginPath(); poly.forEach(function (v, i) { var q = shadow ? fr.P(v[0] - sun.x / sun.y * v[1], 0.15, v[2] - sun.z / sun.y * v[1]) : fr.P(v[0], v[1], v[2]); if (i) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); }); c.closePath(); }
    if (!fr.night) { fr.ground.fillStyle = "rgba(10,28,22,.24)"; parts.forEach(function (poly) { trace(fr.ground, poly, true); fr.ground.fill(); }); }
    var c = fr.over; c.lineJoin = "round"; c.lineWidth = 0.9; c.strokeStyle = M.rgba(INK, 0.6); c.fillStyle = color;
    parts.forEach(function (poly) { trace(c, poly, false); c.fill(); c.stroke(); });
  }
  /* a skein: seven in a V on a straight line across the map, every fifteen seconds, from one side and then the other */
  function skein(fr) {
    var t = fr.t, cs = fr.cam.scale, every = 15, pass = Math.floor(t / every), s = (t % every) - every / 2, dir = 0.62 + (pass % 2) * 2.5 + M.rnd(pass, 3) * 0.3;
    var hx = Math.sin(dir), hz = -Math.cos(dir), g = fr.cam.ground(205, 470), span = 9.5 * cs, speed = 34 * cs;
    for (var i = 0; i < 7; i++) {
      var rank = Math.ceil(i / 2), side = i % 2 ? 1 : -1, back = rank * span * 0.78, out = rank * span * 0.62 * side, glide = Math.sin(t * 0.5 + i) > 0.55;
      var X = g.X + hx * (speed * s - back) + hz * out, Z = g.Z + hz * (speed * s - back) - hx * out, Y = (46 + Math.sin(t * 0.8 + i) * 0.8) * cs;
      bird(fr, [X, Y, Z], hx, hz, span, glide ? 0.35 : t * 7.5 + i * 0.9, 0, CREAM);
    }
  }
  /* gulls wheeling: the fishing spot's school again, in the air - an angle that advances round a middle, a radius, a height */
  function gulls(fr) {
    var t = fr.t, cs = fr.cam.scale, at = OVER[fr.cam.zoom], g = fr.cam.ground(at[0], at[1]);
    for (var i = 0; i < 5; i++) {
      var w = 0.42 + 0.1 * M.rnd(i, 21), a = t * w + i * 1.2566 + M.rnd(i, 22), r = (15 + 9 * M.rnd(i, 23) + Math.sin(t * 0.23 + i) * 3) * cs, Y = (27 + 12 * M.rnd(i, 24) + Math.sin(t * 0.31 + i * 2) * 3) * cs;
      bird(fr, [g.X + Math.cos(a) * r, Y, g.Z + Math.sin(a) * r], -Math.sin(a), Math.cos(a), 8.5 * cs, Math.sin(t * 0.37 + i) > 0.2 ? 0.3 : t * 6 + i, 0.42, CREAM);
    }
  }
  /* a small flock that lives in the trees: it lifts, swirls as a loose ball that stretches along its own travel, and comes back */
  function flock(fr) {
    var t = fr.t, cs = fr.cam.scale, at = GROVE[fr.cam.zoom], g = fr.cam.ground(at[0], at[1]);
    function mid(tt) { return { X: g.X + (Math.sin(tt * 0.43) * 34 + Math.sin(tt * 0.97 + 1) * 10) * cs, Z: g.Z + (Math.sin(tt * 0.31 + 2) * 22 + Math.sin(tt * 0.83) * 8) * cs }; }
    var c = mid(t), c2 = mid(t + 0.1), vx = c2.X - c.X, vz = c2.Z - c.Z, vl = Math.sqrt(vx * vx + vz * vz) || 1; vx /= vl; vz /= vl;
    for (var i = 0; i < 16; i++) {
      var a = t * (1.1 + 0.9 * M.rnd(i, 31)) + i * 0.7, r = (3.5 + 8 * M.rnd(i, 32)) * cs, ox = Math.cos(a) * r, oz = Math.sin(a) * r, along = ox * vx + oz * vz;
      ox += vx * along * 0.9; oz += vz * along * 0.9;   /* the ball is drawn out along the way it is going */
      var lag = mid(t - 0.25 * M.rnd(i, 33)), X = lag.X + ox, Z = lag.Z + oz, Y = (20 + 7 * Math.sin(a * 0.7 + i) + 3 * Math.sin(t * 0.5)) * cs;
      var n = mid(t + 0.1 - 0.25 * M.rnd(i, 33)), hx = n.X - lag.X - Math.sin(a) * r * 0.14, hz = n.Z - lag.Z + Math.cos(a) * r * 0.14, hl = Math.sqrt(hx * hx + hz * hz) || 1;
      bird(fr, [X, Y, Z], hx / hl, hz / hl, 4.4 * cs, t * 14 + i * 1.3, 0.2, "#F3EEDD");
    }
  }

  var KINDS = {
    "fireflies": { time: "night", bloom: true, draw: function (fr) { fireflies(fr, false); } },
    "fireflies-step": { time: "night", bloom: true, draw: function (fr) { fireflies(fr, true); } },
    "butterflies": { time: "day", draw: butterflies },
    "skein": { time: "day", draw: skein },
    "gulls": { time: "day", draw: gulls },
    "flock": { time: "day", draw: flock }
  };

  /* ---- the page ---------------------------------------------------------------------------------------------------- */
  var phones = [];
  function build(el) {
    var kind = el.getAttribute("data-life"), k = KINDS[kind], p = { el: el, kind: kind };
    p.scene = { zoom: view.zoom, time: k.time, clear: false, bloom: !!k.bloom, draw: k.draw };
    p.refresh = function () { p.scene.zoom = view.zoom; var canvas = M.phone(el, p.scene.zoom); if (!p.stage) { p.stage = new M.Stage(canvas); p.player = new M.Player(p.stage, p.scene, { length: 3600, start: 3 }); } };
    p.refresh(); phones.push(p);
  }
  document.addEventListener("DOMContentLoaded", function () {
    var q = M.state(); if (q.capture) document.body.classList.add("capture");
    if (q.zoom) view.zoom = q.zoom;
    Array.prototype.forEach.call(document.querySelectorAll(".phone[data-life]"), build);
    function refreshAll() { phones.forEach(function (p) { p.refresh(); }); }
    M.radios("zoom", function (v) { view.zoom = v; refreshAll(); }, view.zoom);
    var pause = document.getElementById("st-pause");
    function setPaused(v) { M.clock.paused = v; if (pause) { pause.setAttribute("aria-pressed", v ? "true" : "false"); pause.textContent = v ? "Play" : "Pause"; } }
    if (pause) pause.addEventListener("click", function () { setPaused(!M.clock.paused); });
    setPaused(!!q.capture || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));
    window.STUDY = { kinds: phones.map(function (p) { return p.kind; }),
      /* which: a list of kinds to lay side by side */
      film: function (t, scale, which) { return M.film(phones.filter(function (p) { return which.indexOf(p.kind) >= 0; }).map(function (p) { return p.scene; }), t, scale).toDataURL("image/jpeg", 0.92); },
      set: function (s) { if (s.zoom) view.zoom = s.zoom; refreshAll(); M.players.forEach(function (p) { p.visible = true; p.seek(s.t === undefined ? p.t : s.t); }); } };
    M.start();
  });
})();
