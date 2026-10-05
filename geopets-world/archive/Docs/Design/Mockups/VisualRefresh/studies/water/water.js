/* Water: the illusion of depth falling off from the shore, the shadow shapes of small groups of fish, a fishing spot that
   keeps a school to one place, and what could glow in the water at night - drawn live on the owner's real map through
   ../shared/mapfx.js.

   Map water has no real depth, so DISTANCE TO THE SHORE stands in for it. ../../tools/study_plates.py finds the water by
   colour, measures that distance on the ground (not on the screen) through the game's camera, and writes the still colour
   field of each look plus three masks: all water, shallow water, and where fish may swim. This script adds what moves: light
   rippling in the shallows, foam breathing on the shoreline, glints, and everything that swims. Every swimmer's place is a
   pure function of time. Nothing reads pixels back, so it works from disk.

   A phone says what it shows: data-look (today | lagoon | bands | glass); data-spot (school | patch | tapped) for a fishing
   spot, which is a world resource a worker is sent to; data-critter (turtle | ray | eel) for a place where a water critter
   shows itself briefly, which is where a trap does best; data-glow (school | jellies | seaflies) for the night;
   data-time-fixed to ignore the page's day and night switch. */
(function () {
  "use strict";
  var M = window.MAPFX, W = M.W, H = M.H, A = "assets/", E = M.ease;
  var INK = "#24483B", PAPER = "#FAF4E5", CYAN = "#6FF0FF";
  var view = { zoom: "default", time: "day", fish: true, every: 7 };
  var LOOKS = ["today", "lagoon", "bands", "glass"];
  /* the first screen row that can hold water, and the first that can hold open water, per zoom: nothing is laid above them */
  var WATER_TOP = { "default": 420, "zoom-out": 290 }, OPEN_TOP = { "default": 560, "zoom-out": 400 };

  /* where the fish swim, per zoom: the middle of each group's beat in screen pixels of the owner's screenshots, its reach in
     ground units, and how many swim together. A few groups here and there; three or four in a group. A fish is about 6 units
     long: the owner asked for the size they first had when fully zoomed out to be their size at the default zoom, which
     halves them, and they swim slower to match. */
  var GROUPS = {
    "default": [{ at: [330, 668], reach: [20, 12], n: 4, turn: 0.105 }, { at: [228, 742], reach: [16, 9], n: 3, turn: -0.09 }, { at: [372, 590], reach: [9, 9], n: 3, turn: 0.13 }],
    "zoom-out": [{ at: [300, 640], reach: [42, 26], n: 4, turn: 0.06 }, { at: [178, 742], reach: [34, 20], n: 3, turn: -0.052 }, { at: [352, 500], reach: [24, 22], n: 3, turn: 0.075 }, { at: [250, 800], reach: [38, 14], n: 4, turn: -0.045 }, { at: [96, 800], reach: [18, 12], n: 3, turn: 0.068 }]
  };

  /* A fishing spot, per zoom: its middle in screen pixels of the owner's screenshots and its radius in ground units (22 is
     about 34 metres). The owner: it is a world resource, so a worker is sent to it, and like today's resource groups it is
     outlined when tapped - "just needs to be a circle around the designated spot". Both sit where the shore is further off
     than the radius, so the whole spot is open water - which is also the rule for where the game could put one. */
  var SPOT = { "default": { at: [338, 676], R: 22 }, "zoom-out": { at: [286, 612], R: 22 } };
  /* Where a water critter shows itself, per zoom. The owner: a trap set here has a better chance of a water critter, and
     unlike the fish, which are always visible, the critter "randomly and briefly appears, just enough so a player who watches
     for them can see it is there". */
  var HAUNT = { "default": { at: [300, 690], R: 16 }, "zoom-out": { at: [230, 690], R: 16 } };

  /* ---- a tileable web of light, made once: the caustics in the shallows ------------------------------------------ */
  var caustic = null;
  function causticTex() {
    if (caustic) return caustic;
    var n = 256, tile = M.blank(n, n), x = tile.getContext("2d"), img = x.createImageData(n, n), d = img.data, i = 0;
    for (var py = 0; py < n; py++) for (var px = 0; px < n; px++) {
      var u = px / n * 6.2832, w = py / n * 6.2832;
      var f = Math.sin(3 * u + 1.7 * Math.sin(2 * w)) + Math.sin(4 * w + 1.3 * Math.sin(3 * u)) + Math.sin(2 * u + 3 * w + 0.9 * Math.sin(u - 2 * w));
      var v = Math.pow(1 - Math.abs(f) / 3, 7);
      d[i++] = 255; d[i++] = 255; d[i++] = 255; d[i++] = Math.round(255 * v);
    }
    x.putImageData(img, 0, 0);
    caustic = M.blank(n * 5, n * 2); var c = caustic.getContext("2d");
    for (var a = 0; a < 5; a++) for (var b = 0; b < 2; b++) c.drawImage(tile, a * n, b * n);
    caustic.tile = n; return caustic;
  }

  /* ---- per look, time and zoom: the still colour field cut to the water, cached ------------------------------------ */
  var fields = {};
  function field(look, time, zoom) {
    var key = look + time + zoom; if (fields[key]) return fields[key];
    var col = M.image(A + zoom + "-" + look + "-" + time + ".jpg"), mask = M.image(A + zoom + "-mask.png");
    if (!M.ok(col) || !M.ok(mask)) return null;
    var c = M.blank(W, H), x = c.getContext("2d"); x.drawImage(col, 0, 0, W, H); x.globalCompositeOperation = "destination-in"; x.drawImage(mask, 0, 0, W, H);
    return (fields[key] = c);
  }

  var layer = null;
  function scratch(op) { if (!layer) { layer = M.blank(W, H); layer.x = layer.getContext("2d"); } var x = layer.x; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.filter = "none"; x.clearRect(0, 0, W, H); if (op) x.globalCompositeOperation = op; return x; }
  function cut(x, maskName, zoom) { var m = M.image(A + zoom + "-" + maskName + ".png"); if (!M.ok(m)) return false; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "destination-in"; x.globalAlpha = 1; x.drawImage(m, 0, 0, W, H); return true; }
  function put(ctx, op, alpha, blur) { ctx.save(); if (blur && typeof ctx.filter === "string") ctx.filter = "blur(" + blur + "px)"; ctx.globalCompositeOperation = op; ctx.globalAlpha = alpha; ctx.drawImage(layer, 0, 0); ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; }

  /* a flat pattern lying on the water, laid row by row so it foreshortens with the camera. unit = ground units per texture pixel */
  function lay(x, fr, tex, unit, scrollX, scrollZ, alpha, yTop) {
    var n = tex.tile, cam = fr.cam, step = 3;
    x.globalAlpha = alpha;
    for (var y = yTop; y < H; y += step) {
      var a = cam.ground(0, y + step), b = cam.ground(W, y + step), c = cam.ground(0, y); if (!a || !c) continue;
      var sx = ((a.X / unit + scrollX) % n + n) % n, sw = (b.X - a.X) / unit, sy = ((-(c.Z) / unit + scrollZ) % n + n) % n, sh = Math.max(0.5, (c.Z - a.Z) / unit);
      if (sw > n * 4 || sh > n) continue;
      x.drawImage(tex, sx, sy, sw, sh, 0, y, W, step);
    }
    x.globalAlpha = 1;
  }

  /* ---- who swims where: each swimmer is handed out as a function from time to a place on the water ----------------- */
  function spotOf(fr) { var sp = SPOT[fr.cam.zoom]; if (!sp) return null; var g = fr.cam.ground(sp.at[0], sp.at[1]); return { X: g.X, Z: g.Z, R: sp.R }; }
  /* the passing groups: one leads along a slow looping beat, the others follow a moment behind and a little to the side */
  function passing(fr, keepOff, each) {
    (GROUPS[fr.cam.zoom] || []).forEach(function (gr, gi) {
      var c = fr.cam.ground(gr.at[0], gr.at[1]);
      if (keepOff && Math.sqrt((c.X - keepOff.X) * (c.X - keepOff.X) + (c.Z - keepOff.Z) * (c.Z - keepOff.Z)) < keepOff.R * 2.4 + gr.reach[0]) return;
      function beat(tt) { var a = tt * gr.turn * 6.2832 + gi * 1.9; return { X: c.X + Math.cos(a) * gr.reach[0] + Math.sin(a * 2.3 + gi) * gr.reach[0] * 0.18, Z: c.Z + Math.sin(a * 2) * gr.reach[1] * 0.5 + Math.sin(a) * gr.reach[1] * 0.5 }; }
      for (var i = 0; i < gr.n; i++) (function (i) {
        var lag = i * 0.5 + M.rnd(i, gi) * 0.3, side = (i % 2 ? 1 : -1) * (1.3 + 1.0 * M.rnd(i, gi + 7)) * (i ? 1 : 0);
        each(function (tt) { var p = beat(tt - lag), q = beat(tt - lag + 0.05), dx = q.X - p.X, dz = q.Z - p.Z, d = Math.sqrt(dx * dx + dz * dz) || 1; return { X: p.X - dz / d * side, Z: p.Z + dx / d * side }; }, 5.6 + 1.6 * M.rnd(i, gi + 3), gi * 8 + i);
      })(i);
    });
  }
  /* A fishing spot's own school. Two things keep it in, and either would do alone. (1) The school LIVES in the spot: every
     fish's place is worked out in the spot's own terms - an angle that advances and a distance from the middle that breathes
     between a third and two thirds of the radius - so it cannot leave, and nothing has to steer it back. (2) A fence in the
     drawing (below). The last fish is sent on a wider round on purpose, past the edge and back, so the fence can be seen working. */
  function circling(c, each) {
    for (var i = 0; i < 6; i++) (function (i) {
      var w = 0.42 + 0.12 * M.rnd(i, 71), ph = i / 6 * 6.2832 + M.rnd(i, 72) * 0.6, stray = i === 5;
      each(function (tt) { var a = tt * w + ph, r = c.R * (stray ? 0.62 + 0.46 * Math.sin(tt * 0.31) : 0.34 + 0.26 * (0.5 + 0.5 * Math.sin(tt * 0.37 + i * 2.1))); return { X: c.X + Math.cos(a) * r, Z: c.Z + Math.sin(a) * r }; }, 5.2 + 1.5 * M.rnd(i, 73), 100 + i);
    })(i);
  }
  /* the fence: whatever has been drawn is multiplied by a soft disc, solid to a share of the radius and gone at the edge */
  function fence(fr, x, c, solid) {
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "destination-in"; x.globalAlpha = 1;
    fr.onGround(x, c.X, c.Z, function (g) { var gr = g.createRadialGradient(0, 0, c.R * solid, 0, 0, c.R); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(-5000, -5000, 10000, 10000); });
  }

  /* ---- how a swimmer is drawn ----------------------------------------------------------------------------------------- */
  function fishShape(g, len, wag) {   /* nose toward +y; drawn in ground units */
    var w = len * 0.2;
    g.beginPath(); g.moveTo(0, len * 0.5);
    g.bezierCurveTo(w, len * 0.3, w * 0.9, -len * 0.1, wag * 0.35, -len * 0.3);
    g.lineTo(wag + w * 0.95, -len * 0.56); g.lineTo(wag, -len * 0.45); g.lineTo(wag - w * 0.95, -len * 0.56);
    g.lineTo(wag * 0.35, -len * 0.3);
    g.bezierCurveTo(-w * 0.9, -len * 0.1, -w, len * 0.3, 0, len * 0.5); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(w * 0.95, len * 0.12, w * 0.55, w * 0.22, 0.5, 0, 7); g.ellipse(-w * 0.95, len * 0.12, w * 0.55, w * 0.22, -0.5, 0, 7); g.fill();
  }
  /* by day: a dark, soft shape with a swaying tail */
  function shadowFish(fr, x) {
    return function (at, len, key) {
      var t = fr.t, p = at(t), q = at(t + 0.05), dx = q.X - p.X, dz = q.Z - p.Z, wag = Math.sin(t * 7.5 + key * 1.7) * len * 0.11;
      fr.onGround(x, p.X, p.Z, function (g) { g.rotate(Math.atan2(-dx, dz)); g.fillStyle = "#06121F"; fishShape(g, len, wag); });
    };
  }
  /* at night: the fish itself glows, and the water it has just swum through still sparkles behind it */
  function glowFish(fr, x, color) {
    return function (at, len, key) {
      var t = fr.t, p = at(t), q = at(t + 0.05), dx = q.X - p.X, dz = q.Z - p.Z, d = Math.sqrt(dx * dx + dz * dz) || 1, ux = dx / d, uz = dz / d;
      var head = fr.P(p.X + ux * len * 0.5, 0.2, p.Z + uz * len * 0.5), tail = fr.P(p.X - ux * len * 0.5, 0.2, p.Z - uz * len * 0.5);
      fr.streak(x, M.hot(color), tail.x, tail.y, head.x, head.y, len * 0.46 * head.k, 0.95);
      for (var k = 1; k <= 9; k++) {
        var w = at(t - k * 0.13), s = fr.P(w.X + (M.rnd(key * 16 + k, 5) - 0.5) * 1.8, 0.2, w.Z + (M.rnd(key * 16 + k, 6) - 0.5) * 1.8), tw = 0.5 + 0.5 * Math.sin(t * 9 + key * 3 + k * 1.9);
        fr.glow(x, M.star(color), s.x, s.y, (1.6 + 1.5 * tw) * s.k, (1 - k / 10) * (0.3 + 0.7 * tw));
      }
    };
  }
  /* a smack of jellyfish: slow, pulsing, each a pale disc with the four-leaf mark of a moon jelly */
  function jellies(fr, x, c) {
    for (var i = 0; i < 11; i++) (function (i) {
      var t = fr.t, a0 = M.rnd(i, 31) * 6.2832, dir = i % 2 ? 1 : -1, beat = t * 0.62 + M.rnd(i, 32), ph = beat % 1, squeeze = ph < 0.24 ? Math.sin(ph / 0.24 * Math.PI) : 0;
      var ang = i * 2.39996 + a0 * 0.35 + dir * (0.03 * t - 0.0046 * Math.cos(beat * 6.2832)), rad = c.R * (0.1 + 0.68 * Math.sqrt((i + 0.5) / 11)), X = c.X + Math.cos(ang) * rad, Z = c.Z + Math.sin(ang) * rad;
      var r = 1.7 + 1.4 * M.rnd(i, 34), col = i % 4 === 0 ? "#E9B8FF" : "#A8ECFF", s = 1 - 0.2 * squeeze;
      fr.pool(x, X, Z, r * 2.1, M.soft(col), 0.08 + 0.12 * squeeze);
      fr.onGround(x, X, Z, function (g) {
        g.scale(s, s); var gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, M.rgba(col, 0.10 + 0.08 * squeeze)); gr.addColorStop(0.72, M.rgba(col, 0.18 + 0.1 * squeeze)); gr.addColorStop(0.93, M.rgba(col, 0.72)); gr.addColorStop(1, M.rgba(col, 0));
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
        g.strokeStyle = M.rgba("#FFFFFF", 0.6); g.lineWidth = r * 0.07;
        for (var q = 0; q < 4; q++) { g.beginPath(); g.arc(Math.cos(q * 1.5708 + a0) * r * 0.3, Math.sin(q * 1.5708 + a0) * r * 0.3, r * 0.17, 0, 7); g.stroke(); }
      });
    })(i);
  }
  /* sea fireflies: dozens of tiny lights that rest, dart a little way with a flash, and leave a puff of light where they were */
  function seaflies(fr, x, c) {
    for (var i = 0; i < 46; i++) {
      var t = fr.t, period = 1.2 + 0.9 * M.rnd(i, 41), u = t / period + M.rnd(i, 42), hop = Math.floor(u), f = u - hop;
      var ha = M.rnd(i, 43) * 6.2832, hr = c.R * 0.7 * Math.sqrt(M.rnd(i, 44)), hx = c.X + Math.cos(ha) * hr, hz = c.Z + Math.sin(ha) * hr;
      var n0 = [hx + (M.rnd(i * 131 + hop, 45) - 0.5) * 8, hz + (M.rnd(i * 131 + hop, 46) - 0.5) * 8], n1 = [hx + (M.rnd(i * 131 + hop + 1, 45) - 0.5) * 8, hz + (M.rnd(i * 131 + hop + 1, 46) - 0.5) * 8];
      var k = E.outCubic(E.seg(f, 0, 0.22)), p = fr.P(n0[0] + (n1[0] - n0[0]) * k, 0.2, n0[1] + (n1[1] - n0[1]) * k), b = f < 0.22 ? 1 : 0.22 + 0.16 * Math.sin(t * 5 + i), left = fr.P(n0[0], 0.2, n0[1]);
      if (f < 0.75) fr.glow(x, M.soft("#7FD8FF"), left.x, left.y, (1.4 + 2.6 * f) * left.k, 0.55 * (1 - f / 0.75));
      fr.glow(x, M.hot("#7FD8FF"), p.x, p.y, (0.9 + 1.5 * b) * p.k, 0.35 + 0.65 * b);
    }
  }

  /* ---- a fishing spot ---------------------------------------------------------------------------------------------------- */
  function drawSpot(fr, ctx, p) {
    var zoom = fr.cam.zoom, c = spotOf(fr); if (!c) return;
    var R = c.R, night = fr.night, t = fr.t, glow = night && p.glow, x, j;
    if (p.spot === "patch") {
      /* a paler, livelier patch of water marks the place even when no fish is in sight: a shoal, or fish stirring the bottom */
      x = scratch(); fr.onGround(x, c.X, c.Z, function (g) { var gr = g.createRadialGradient(0, 0, 0, 0, 0, R); gr.addColorStop(0, "rgba(190,255,236,.8)"); gr.addColorStop(0.62, "rgba(170,245,230,.42)"); gr.addColorStop(1, "rgba(170,245,230,0)"); g.fillStyle = gr; g.fillRect(-R, -R, 2 * R, 2 * R); });
      if (cut(x, "mask", zoom)) put(ctx, "lighter", night ? 0.16 : 0.36);
      x = scratch("lighter"); lay(x, fr, causticTex(), 0.2, t * 12, -t * 7, 0.9, WATER_TOP[zoom]); fence(fr, x, c, 0.35);
      if (cut(x, "mask", zoom)) put(ctx, "lighter", night ? 0.2 : 0.5);
    }
    if (view.fish) {
      if (glow === "jellies") { x = scratch("lighter"); jellies(fr, x, c); fence(fr, x, c, 0.8); if (cut(x, "fish", zoom)) put(ctx, "lighter", 1); }
      else if (glow === "seaflies") { x = scratch("lighter"); seaflies(fr, x, c); fence(fr, x, c, 0.8); if (cut(x, "fish", zoom)) put(ctx, "lighter", 1); }
      else if (glow) { x = scratch("lighter"); circling(c, glowFish(fr, x, CYAN)); fence(fr, x, c, 0.72); if (cut(x, "fish", zoom)) put(ctx, "lighter", 1); }
      else { x = scratch(); circling(c, shadowFish(fr, x)); fence(fr, x, c, 0.72); if (cut(x, "fish", zoom)) put(ctx, "source-over", night ? 0.4 : 0.56, 0.7); }
    }
    /* something breaks the surface now and then: a ring that opens and fades, somewhere inside the spot */
    for (j = 0; j < 2; j++) {
      var period = 2.9 + j * 1.3, cyc = Math.floor(t / period), k = (t / period) % 1 / 0.75;
      if (k < 1) fr.ring(ctx, c.X + (M.rnd(cyc, 81 + j) - 0.5) * R * 0.9, c.Z + (M.rnd(cyc, 91 + j) - 0.5) * R * 0.9, 1 + 5.5 * E.outQuad(k), 0.4, glow ? "#9FF4FF" : "#FFFFFF", (night ? 0.45 : 0.65) * (1 - k));
    }
    /* tapped: outlined as the game outlines any resource group today - its thin gold line (1, .84, .32), here as a circle */
    if (p.spot === "tapped") fr.ring(ctx, c.X, c.Z, R, 0.8, "#FFD652", 1);
  }

  /* ---- a water critter shows itself, briefly ------------------------------------------------------------------------------
     Once in every `view.every` seconds, at a moment and a place inside the haunt that change each time, it rises, glides a
     short way, and dives; a ring opens where it went under and outlasts it by a moment. Its outline is nothing like a fish. */
  var SHAPES = {
    turtle: function (g, L, sway) {
      g.beginPath(); g.ellipse(0, 0, L * 0.34, L * 0.43, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(0, L * 0.55, L * 0.1, L * 0.13, 0, 0, 7); g.fill();
      [1, -1].forEach(function (s) {
        g.save(); g.translate(s * L * 0.3, L * 0.26); g.rotate(s * (-0.95 + 0.45 * sway)); g.beginPath(); g.ellipse(s * L * 0.2, 0, L * 0.27, L * 0.085, 0, 0, 7); g.fill(); g.restore();
        g.save(); g.translate(s * L * 0.26, -L * 0.36); g.rotate(s * (0.7 + 0.2 * sway)); g.beginPath(); g.ellipse(s * L * 0.1, 0, L * 0.14, L * 0.06, 0, 0, 7); g.fill(); g.restore();
      });
      g.beginPath(); g.moveTo(-L * 0.04, -L * 0.42); g.lineTo(0, -L * 0.56); g.lineTo(L * 0.04, -L * 0.42); g.fill();
    },
    ray: function (g, L, sway) {
      var tip = L * 0.08 * sway;
      g.beginPath(); g.moveTo(0, L * 0.5); g.quadraticCurveTo(L * 0.34, L * 0.36, L * 0.66, L * 0.02 + tip); g.quadraticCurveTo(L * 0.3, -L * 0.2, 0, -L * 0.3);
      g.quadraticCurveTo(-L * 0.3, -L * 0.2, -L * 0.66, L * 0.02 - tip); g.quadraticCurveTo(-L * 0.34, L * 0.36, 0, L * 0.5); g.fill();
      g.lineWidth = L * 0.035; g.lineCap = "round"; g.beginPath(); g.moveTo(0, -L * 0.28); g.quadraticCurveTo(L * 0.1 * sway, -L * 0.7, -L * 0.06 * sway, -L * 1.05); g.stroke();
    },
    eel: function (g, L, sway, t) {
      g.lineCap = "round"; g.lineJoin = "round";
      for (var k = 0; k < 16; k++) {
        var y0 = L * 0.7 - k * L * 0.1, y1 = y0 - L * 0.1, x0 = Math.sin(t * 4 - k * 0.55) * L * 0.035 * k * 0.5, x1 = Math.sin(t * 4 - (k + 1) * 0.55) * L * 0.035 * (k + 1) * 0.5;
        g.lineWidth = L * (0.13 - k * 0.006); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      }
    }
  };
  function drawHaunt(fr, ctx, p) {
    var zoom = fr.cam.zoom, hp = HAUNT[zoom]; if (!hp || !view.fish) return;
    var g0 = fr.cam.ground(hp.at[0], hp.at[1]), T = view.every, shown = 2.8, t = fr.t, n = Math.floor(t / T), u = t - n * T - M.rnd(n, 51) * (T - shown - 1.6), night = fr.night, x;
    if (u < 0 || u > shown + 1.6) return;
    var a = M.rnd(n, 52) * 6.2832, r = hp.R * 0.6 * Math.sqrt(M.rnd(n, 53)), hd = M.rnd(n, 54) * 6.2832, go = E.inOut(E.seg(u, 0, shown)) * 9;
    var X = g0.X + Math.cos(a) * r + Math.sin(hd) * go, Z = g0.Z + Math.sin(a) * r + Math.cos(hd) * go, L = 10, vis = E.seg(u, 0, 0.45) * (1 - E.seg(u, shown - 0.45, shown)), sway = Math.sin(t * 2.6);
    if (vis > 0.01) {
      x = scratch(night ? "lighter" : "source-over"); x.fillStyle = x.strokeStyle = night ? CYAN : "#06121F";
      if (night) fr.pool(x, X, Z, L * 1.1, M.soft(CYAN), 0.35);
      fr.onGround(x, X, Z, function (g) { g.rotate(-hd); g.scale(0.78 + 0.22 * vis, 0.78 + 0.22 * vis); SHAPES[p.critter](g, L, sway, t); });
      if (cut(x, "fish", zoom)) put(ctx, night ? "lighter" : "source-over", (night ? 0.8 : 0.62) * vis, night ? 0 : 0.7);
    }
    var k = E.seg(u, shown - 0.3, shown + 1.6); if (k > 0 && k < 1) { fr.ring(ctx, X, Z, 1.5 + 11 * E.outQuad(k), 0.5, night ? "#9FF4FF" : "#FFFFFF", 0.85 * (1 - k)); fr.ring(ctx, X, Z, 0.8 + 6 * E.outQuad(k), 0.4, night ? "#9FF4FF" : "#FFFFFF", 0.6 * (1 - k)); }
  }

  /* ---- one phone, one frame ------------------------------------------------------------------------------------------------ */
  function drawWater(fr, ctx, p) {
    var look = p.look, zoom = fr.cam.zoom, time = fr.scene.time, night = fr.night, t = fr.t, yTop = WATER_TOP[zoom], glow = night && p.glow, x;
    if (!GROUPS[zoom]) return;   /* no water in this view */
    if (look !== "today") { var f = field(look, time, zoom); if (f) ctx.drawImage(f, 0, 0); }
    if (look !== "today") {
      /* light rippling on the bottom of the shallows: two webs sliding across each other */
      x = scratch("lighter"); var tex = causticTex();
      lay(x, fr, tex, 0.27, t * 9, t * 5, 0.75, yTop); lay(x, fr, tex, 0.41, -t * 6 + 90, t * 8 + 40, 0.55, yTop);
      if (cut(x, "shallow", zoom)) put(ctx, "lighter", (night ? 0.13 : 0.31) * (look === "bands" ? 0.5 : 1));
      /* foam: two lines along the shore that take turns, like a small wave arriving and the one before it fading */
      var foam = M.image(A + zoom + "-foam.png"), foam2 = M.image(A + zoom + "-foam2.png"), k = 0.5 + 0.5 * Math.sin(t * 1.25);
      if (M.ok(foam)) { ctx.globalAlpha = (night ? 0.5 : 0.85) * (0.55 + 0.45 * k); ctx.drawImage(foam, 0, 0, W, H); }
      if (M.ok(foam2) && look !== "bands") { ctx.globalAlpha = (night ? 0.3 : 0.55) * (1 - k); ctx.drawImage(foam2, 0, 0, W, H); }
      ctx.globalAlpha = 1;
      if (glow && M.ok(foam) && M.ok(foam2)) {
        /* the glow of the sea itself: where small waves break on the shore the water lights up, blue */
        x = scratch(); x.globalAlpha = 0.55 + 0.45 * k; x.drawImage(foam, 0, 0, W, H); x.globalAlpha = 1 - k; x.drawImage(foam2, 0, 0, W, H); x.globalAlpha = 1;
        x.globalCompositeOperation = "source-in"; x.fillStyle = "#4FE3FF"; x.fillRect(0, 0, W, H); put(ctx, "lighter", 0.5, 1.4); put(ctx, "lighter", 0.5);
      }
    }
    if (view.fish && (!glow || glow === "school")) {
      var keepOff = p.spot ? spotOf(fr) : null;
      if (glow) { x = scratch("lighter"); passing(fr, keepOff, glowFish(fr, x, "#8CFFE4")); if (cut(x, "fish", zoom)) put(ctx, "lighter", 0.9); }
      else { x = scratch(); passing(fr, keepOff, shadowFish(fr, x)); if (cut(x, "fish", zoom)) put(ctx, "source-over", night ? 0.34 : (look === "today" ? 0.36 : 0.5), 0.7); }
    }
    if (look === "glass") {
      /* glints: the sun, or the moon, caught on small waves; they belong to the open water, not the shallows */
      x = scratch("lighter"); var spr = M.star(night ? "#CFE0FF" : "#FFF6D6");
      for (var i = 0; i < 70; i++) {
        var sx = M.rnd(i, 61) * W, sy = OPEN_TOP[zoom] + M.rnd(i, 62) * (H - OPEN_TOP[zoom]), g = fr.cam.ground(sx, sy); if (!g) continue;
        var tw = Math.pow(Math.max(0, Math.sin(t * (1.1 + 1.6 * M.rnd(i, 63)) + i * 2.4)), 10), q = fr.P(g.X + Math.sin(t * 0.4 + i) * 2, 0.2, g.Z);
        if (tw > 0.02) fr.glow(x, spr, q.x, q.y, (3 + 5 * M.rnd(i, 64)) * fr.cam.scale * (0.6 + 0.4 * q.k), tw);
      }
      if (cut(x, "mask", zoom)) put(ctx, "lighter", night ? 0.7 : 0.95);
    }
    if (p.spot) drawSpot(fr, ctx, p);
    if (p.critter) drawHaunt(fr, ctx, p);
  }

  /* ---- the page ---------------------------------------------------------------------------------------------------- */
  var phones = [];
  function build(el) {
    var p = { el: el, look: el.getAttribute("data-look"), fixed: el.getAttribute("data-zoom-fixed"), timeFixed: el.getAttribute("data-time-fixed"), spot: el.getAttribute("data-spot"), glow: el.getAttribute("data-glow"), critter: el.getAttribute("data-critter") };
    p.kind = p.glow ? "glow" : p.critter ? "critters" : p.spot ? "spots" : "looks";
    p.scene = { zoom: p.fixed || view.zoom, time: p.timeFixed || view.time, clear: false, bloom: false, under: function (fr, ctx) { drawWater(fr, ctx, p); } };
    /* tapped and a worker sent: the worker's pin stands over the spot, as it does over a woodland today */
    if (p.spot === "tapped") p.scene.draw = function (fr) { var c = spotOf(fr); if (!c) return; var tip = fr.P(c.X, 1.5, c.Z); fr.pin(fr.over, tip.x, tip.y, M.image("../../round1/grove/assets/icons/worker.svg"), {}); };
    p.refresh = function () { p.scene.zoom = p.fixed || view.zoom; p.scene.time = p.timeFixed || view.time; var canvas = M.phone(el, p.scene.zoom); if (!p.stage) { p.stage = new M.Stage(canvas); p.player = new M.Player(p.stage, p.scene, { length: 3600, start: 2 }); } };
    p.refresh(); phones.push(p);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var q = M.state(); if (q.capture) document.body.classList.add("capture");
    if (q.zoom) view.zoom = q.zoom; if (q.time) view.time = q.time; if (q.fish) view.fish = q.fish !== "off";
    Array.prototype.forEach.call(document.querySelectorAll(".phone[data-look]"), build);
    function refreshAll() { phones.forEach(function (p) { p.refresh(); }); }
    M.radios("zoom", function (v) { view.zoom = v; refreshAll(); }, view.zoom);
    M.radios("time", function (v) { view.time = v; refreshAll(); }, view.time);
    M.radios("fish", function (v) { view.fish = v === "on"; }, view.fish ? "on" : "off");
    M.radios("every", function (v) { view.every = parseFloat(v); }, String(q.every || view.every)); view.every = parseFloat(q.every || view.every);
    var pause = document.getElementById("st-pause");
    function setPaused(v) { M.clock.paused = v; if (pause) { pause.setAttribute("aria-pressed", v ? "true" : "false"); pause.textContent = v ? "Play" : "Pause"; } }
    if (pause) pause.addEventListener("click", function () { setPaused(!M.clock.paused); });
    setPaused(!!q.capture || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));
    window.STUDY = { looks: LOOKS, phones: phones.map(function (p) { return { kind: p.kind, look: p.look, spot: p.spot, glow: p.glow, critter: p.critter }; }),
      /* which: "looks" (the four looks), "spots" (the fishing spot), "critters" (a water critter showing itself) or "glow" (the night) */
      film: function (t, scale, which) { return M.film(phones.filter(function (p) { return p.kind === (which || "looks"); }).map(function (p) { return p.scene; }), t, scale).toDataURL("image/jpeg", 0.92); },
      /* the middle of the n-th showing of the water critter, for a capture script */
      critterAt: function (n) { var T = view.every; return n * T + M.rnd(n, 51) * (T - 2.8 - 1.6) + 1.3; },
      set: function (s) { if (s.zoom) view.zoom = s.zoom; if (s.time) view.time = s.time; if (s.fish !== undefined) view.fish = s.fish; if (s.every) view.every = s.every; refreshAll(); M.players.forEach(function (p) { p.visible = true; p.seek(s.t === undefined ? p.t : s.t); }); } };
    M.start();
  });
})();
