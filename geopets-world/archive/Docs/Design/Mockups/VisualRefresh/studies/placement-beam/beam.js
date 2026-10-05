/* The placement beam: six ways a worker or a trap could be beamed down from the Hometown floating above, off camera.
   Each is drawn live on the owner's real map through ../shared/mapfx.js and is made only of what Unity's effect tools
   provide. Every effect is a pure function of the time since the player confirmed, so the page can loop it, slow it,
   scrub it, and lay its key moments side by side.

   What arrives is today's PIN: the game has no 3D model of a trap or a worker on the map (WorldAssignmentMarkers.cs). */
(function () {
  "use strict";
  var M = window.MAPFX, E = M.ease, seg = E.seg;
  var INK = "#24483B", PAPER = "#FAF4E5", WHITE = "#FFFFFF";
  var ICONS = "../../round1/grove/assets/icons/";
  var LEAD = 0.7, HOLD = 1.4;   /* seconds of "before" and "after" round each effect in the loop */
  var view = { zoom: "default", time: "day", kind: "trap", surface: "land", bloom: true };

  /* where things land, per zoom, in screen pixels of the owner's screenshots: a free spot for a trap (the game lets a trap go
     anywhere the map is loaded, water included), and the blackberry patch for a worker (a worker is hired at a fixed patch) */
  var TARGETS = {
    "default": { trap: [158, 548], worker: [92, 326], water: [322, 662] },
    "zoom-in": { trap: [128, 600], worker: [46, 300], water: null },
    "zoom-out": { trap: [262, 468], worker: [131, 342], water: [300, 642] }
  };

  /* ---- skins ---------------------------------------------------------------------------------------------------- */
  function halo(color, streaks) { return M.columnTex("halo" + color + streaks, [[0, color, 0], [0.22, color, 0.2], [0.5, color, 0.6], [0.78, color, 0.2], [1, color, 0]], streaks, 7); }
  function core(color) { return M.columnTex("core" + color, [[0, color, 0], [0.3, color, 0.35], [0.5, WHITE, 1], [0.7, color, 0.35], [1, color, 0]], 0, 1); }
  function body() { return M.columnTex("body", [[0, WHITE, 0], [0.5, WHITE, 0.95], [1, WHITE, 0]], 0, 1); }
  /* A column that also reads by day: light added to bright grass washes out, so by day a pale body is laid under the pin
     with ordinary blending as well. In Unity that is one premultiplied-alpha material instead of a purely additive one. */
  function beam(fr, c, h0, h1, radius, tex, alpha, scroll, dayBody) {
    fr.column(fr.add, c.X, c.Z, h0, h1, radius, tex, alpha, scroll, 1);
    if (!fr.night && dayBody) fr.column(fr.over, c.X, c.Z, h0, h1, typeof radius === "function" ? function (h) { return radius(h) * 0.5; } : radius * 0.5, body(), typeof alpha === "function" ? function (h) { return alpha(h) * dayBody; } : alpha * dayBody, 0, 1);
  }

  /* ---- pieces shared by the concepts ---------------------------------------------------------------------------- */
  function mark(fr, c, a, r, turn) {   /* a flat target on the ground, in the approved symbols' cream with a dark edge */
    if (a <= 0.003) return;
    fr.ring(fr.ground, c.X, c.Z, r, 1.5 * c.cs, INK, 0.85 * a, [r * 0.9, r * 0.67], turn || 0);
    fr.ring(fr.ground, c.X, c.Z, r, 0.8 * c.cs, PAPER, a, [r * 0.9, r * 0.67], turn || 0);
  }
  function ghost(fr, c, tau) { if (c.kind === "trap" && tau < 0.14) fr.pin(fr.over, c.tip.x, c.tip.y, c.icon, { a: 0.55 * (1 - seg(tau, 0, 0.14)), s: 1 - 0.25 * seg(tau, 0, 0.14) }); }
  /* what the ground does when something arrives: dust on land, rings and drops on water */
  function landing(fr, c, k, strength) {
    if (k <= 0 || k >= 1) return; var i, cs = c.cs;
    if (c.surface === "water") {
      for (i = 0; i < 3; i++) { var kk = seg(k, i * 0.16, 0.62 + i * 0.16); if (kk > 0 && kk < 1) { fr.ring(fr.ground, c.X, c.Z, (3 + 20 * E.outQuad(kk)) * cs * strength, 0.7 * cs, WHITE, 0.75 * (1 - kk)); } }
      for (i = 0; i < 9; i++) {
        var a = i * 0.698 + 0.3, u = k * 0.9, v = 20 + 14 * M.rnd(i, 3), hy = (v * u - 38 * u * u) * cs, rr = 9 * u * cs * (0.6 + M.rnd(i, 5));
        if (hy > 0) { var p = fr.P(c.X + Math.cos(a) * rr, hy, c.Z + Math.sin(a) * rr); fr.glow(fr.over, M.puff(WHITE), p.x, p.y, 1.1 * p.k * cs, 0.9 * (1 - k)); }
      }
      return;
    }
    var dust = fr.night ? "#8C93A8" : "#CDBF9F";
    for (i = 0; i < 10; i++) {
      var ang = i * 0.628 + 0.2, d = (4 + 15 * E.outCubic(k) * (0.7 + 0.6 * M.rnd(i, 9))) * cs * strength, q = fr.P(c.X + Math.cos(ang) * d, (1 + 3.5 * k) * cs, c.Z + Math.sin(ang) * d);
      fr.glow(fr.over, M.puff(dust), q.x, q.y, (2.6 + 4.2 * k) * cs * q.k * strength, 0.62 * (1 - k) * (1 - k));
    }
  }
  function pop(fr, c, k, o) {   /* the pin arrives with a little overshoot */
    if (k <= 0) return; o = o || {};
    fr.pin(fr.over, c.tip.x, c.tip.y, c.icon, { s: k >= 1 ? 1 : E.outBack(k), sy: o.squash ? (k < 0.5 ? 0.6 + 1.2 * k : 1.2 - 0.4 * (k - 0.5)) : 1, flash: o.flash, flashColor: o.flashColor, a: o.a, reveal: o.reveal });
  }
  function sparks(fr, c, tau, t0, n, speed, up, grav, color, salt, life) {   /* a burst of stretched sprites on ballistic paths */
    var u = tau - t0; if (u <= 0 || u >= life) return; var spr = M.hot(color), cs = c.cs;
    function at(i, s) { var a = M.rnd(i, salt) * 6.283, v = speed * (0.55 + 0.75 * M.rnd(i, salt + 1)), vy = up * (0.6 + 0.8 * M.rnd(i, salt + 2)); return fr.P(c.X + Math.cos(a) * v * s * cs, Math.max(0, (c.h0 || 0) + (vy * s - grav * s * s) * cs), c.Z + Math.sin(a) * v * s * cs); }
    for (var i = 0; i < n; i++) { var p = at(i, u), q = at(i, Math.max(0, u - 0.04)), a = Math.pow(1 - u / life, 1.4); fr.streak(fr.add, spr, q.x, q.y, p.x, p.y, 2.2 * p.k * cs + 1.5, a); if (!fr.night) fr.streak(fr.over, M.puff(WHITE), q.x, q.y, p.x, p.y, 0.9 * p.k * cs + 0.8, a * 0.8); }
  }

  /* ---- the six ---------------------------------------------------------------------------------------------------- */
  var CONCEPTS = [
    {
      id: "column", name: "Column", length: 1.6, color: "#9FF0E8",
      idea: "The classic: a soft column of light snaps down, holds while sparkles pour through it, the pin forms inside, and the column thins to a thread and is pulled back up.",
      phases: [[0, 0.1, "mark"], [0.1, 0.32, "descends"], [0.32, 1.05, "holds, pin forms"], [1.05, 1.4, "withdraws"]],
      keys: [[-0.2, "before"], [0.2, "coming down"], [0.34, "touches"], [0.75, "pin forms"], [1.2, "withdraws"], [1.9, "after"]],
      build: ["<b>Column:</b> two open cylinders, one inside the other, with an additive scrolling-noise material (soft edges from a fresnel or a gradient across).", "<b>Sparkles:</b> one particle system shaped as the cylinder, about 70 alive, gravity pulling down.", "<b>Ground:</b> a ring quad that grows and fades; one point light for 1.3 seconds.", "<b>Pin:</b> scale and white flash on the pin's own canvas."],
      cost: ["mid", "Medium: a tall transparent surface drawn twice; brief"],
      draw: function (fr, c, tau) {
        var col = this.color, cs = c.cs, down = E.inQuad(seg(tau, 0.1, 0.32)), up = E.inCubic(seg(tau, 1.05, 1.4)), thin = 1 - 0.85 * seg(tau, 1.0, 1.3), on = tau > 0.1 && tau < 1.4;
        ghost(fr, c, tau); mark(fr, c, seg(tau, 0, 0.1) * (1 - seg(tau, 1.1, 1.4)), 7.5 * cs, tau * 6);
        if (on) {
          var h0 = Math.max(c.top * (1 - down), c.top * up), a = (1 - seg(tau, 1.25, 1.4));
          beam(fr, c, h0, c.top, 7.5 * cs * thin, halo(col, 16), 0.85 * a, -tau * 300, 0);
          beam(fr, c, h0, c.top, 2.6 * cs * thin, core(col), a, 0, 0.55);
          var tip = fr.P(c.X, h0, c.Z); fr.glow(fr.add, M.hot(col), tip.x, tip.y, 9 * cs * tip.k, (tau < 0.34 ? 1 : up > 0 ? 0.8 : 0) * a);
          for (var i = 0; i < 70; i++) {
            var f = ((M.rnd(i, 1) - tau * 0.9) % 1 + 1) % 1, h = f * Math.min(c.top, 150 * cs), ang = M.rnd(i, 2) * 6.283 + tau * 1.5, rr = M.rnd(i, 3) * 5.6 * cs * thin;
            if (h < h0) continue; var p = fr.P(c.X + Math.cos(ang) * rr, h, c.Z + Math.sin(ang) * rr), tw = 0.55 + 0.45 * Math.sin(tau * 22 + i * 1.7);
            fr.glow(fr.add, M.star(col), p.x, p.y, (1.6 + 2.2 * M.rnd(i, 4)) * p.k * cs, tw * a * seg(tau, 0.3, 0.42));
          }
        }
        var hit = seg(tau, 0.32, 0.8), glowA = seg(tau, 0.3, 0.36) * (1 - seg(tau, 1.05, 1.45));
        if (hit > 0 && hit < 1) { fr.ring(fr.add, c.X, c.Z, (2 + 18 * E.outCubic(hit)) * cs, (1.6 - 1.2 * hit) * cs, col, 0.9 * (1 - hit)); if (!fr.night) fr.ring(fr.ground, c.X, c.Z, (2 + 18 * E.outCubic(hit)) * cs, 0.7 * cs, WHITE, 0.8 * (1 - hit)); }
        fr.glow(fr.add, M.hot(col), c.base.x, c.base.y, 15 * cs * c.base.k, (1 - seg(tau, 0.32, 0.6)) * (tau > 0.32 ? 1 : 0));
        fr.pool(fr.add, c.X, c.Z, 15 * cs, M.soft(col), 0.55 * glowA); fr.light(c.X, c.Z, 42 * cs, "#DFFFF8", 0.95 * glowA);
        landing(fr, c, seg(tau, 0.32, 1.0), 0.7);
        pop(fr, c, seg(tau, 0.62, 0.9), { flash: 1 - seg(tau, 0.72, 1.1) });
      }
    },
    {
      id: "drop", name: "Drop", length: 1.0, color: "#FFC861",
      idea: "Fast and physical: a bright head with a tapering tail streaks down, hits with a flash, a shock ring, dust and a few sparks, and the pin bounces out of it. The screen nudges for a tenth of a second.",
      phases: [[0, 0.08, "mark"], [0.08, 0.3, "falls"], [0.3, 0.45, "impact"], [0.36, 0.62, "pin bounces out"], [0.45, 0.95, "dust settles"]],
      keys: [[-0.2, "before"], [0.18, "falling"], [0.29, "about to hit"], [0.33, "impact"], [0.5, "pin bounces out"], [1.3, "after"]],
      build: ["<b>Head and tail:</b> one sprite and a trail renderer on an object moved by a script; nothing tall is drawn, so it is the cheapest to fill.", "<b>Impact:</b> three one-shot particle bursts (flash, dust with normal blending, sparks as stretched billboards with gravity) and a ring quad.", "<b>Nudge:</b> the camera offset by 3 pixels for 0.12 seconds; a switch for players who dislike shake.", "<b>Pin:</b> squash and stretch on the pin's canvas."],
      cost: ["low", "Low: small sprites, short life"],
      draw: function (fr, c, tau) {
        var col = this.color, cs = c.cs, fall = E.inQuad(seg(tau, 0.08, 0.3)), h = c.top * (1 - fall), gone = seg(tau, 0.3, 0.52);
        ghost(fr, c, tau); mark(fr, c, seg(tau, 0, 0.08) * (1 - seg(tau, 0.3, 0.4)), 6.5 * cs, 0);
        if (tau > 0.08 && gone < 1) {
          var len = c.top * 0.5, tail = function (hh) { return 2.8 * cs * Math.max(0, 1 - (hh - h) / len); };
          beam(fr, c, h, Math.min(c.top, h + len), tail, core(col), function (hh) { return (1 - gone) * Math.max(0, 1 - (hh - h) / len); }, 0, 0.7);
          beam(fr, c, h, Math.min(c.top, h + len), function (hh) { return tail(hh) * 2.6; }, halo(col, 0), function (hh) { return 0.7 * (1 - gone) * Math.max(0, 1 - (hh - h) / len); }, 0, 0);
          if (tau < 0.3) { var p = fr.P(c.X, h, c.Z); fr.glow(fr.add, M.hot(col), p.x, p.y, 8 * cs * p.k, 1.2); if (!fr.night) fr.glow(fr.over, M.puff("#FFF6DC"), p.x, p.y, 2.6 * cs * p.k, 1); }
        }
        var k = seg(tau, 0.3, 0.64);
        if (tau >= 0.3) {
          var sh = 1 - seg(tau, 0.3, 0.42); if (sh > 0) fr.shake = { x: Math.sin(tau * 95) * 3 * sh, y: Math.cos(tau * 71) * 2 * sh };
          fr.glow(fr.add, M.hot("#FFE9B5"), c.base.x, c.base.y, 21 * cs * c.base.k, 1.5 * (1 - seg(tau, 0.3, 0.46)));
          if (k < 1) { fr.ring(fr.add, c.X, c.Z, (4 + 28 * E.outCubic(k)) * cs, (1.8 - 1.4 * k) * cs, "#FFE9B5", 1 - k); fr.ring(fr.ground, c.X, c.Z, (4 + 28 * E.outCubic(k)) * cs, (1.0 - 0.7 * k) * cs, WHITE, 0.85 * (1 - k)); }
          fr.pool(fr.add, c.X, c.Z, 18 * cs, M.soft(col), 0.7 * (1 - seg(tau, 0.3, 0.8))); fr.light(c.X, c.Z, 46 * cs, "#FFE3B0", 1.1 * (1 - seg(tau, 0.3, 0.8)));
        }
        landing(fr, c, seg(tau, 0.3, 0.95), 1); sparks(fr, c, tau, 0.3, 14, 30, 42, 60, col, 11, 0.5);
        pop(fr, c, seg(tau, 0.36, 0.6), { squash: true, flash: 1 - seg(tau, 0.4, 0.62), flashColor: "#FFF6DC" });
      }
    },
    {
      id: "lowered", name: "Lowered", length: 2.1, color: "#BFE9FF",
      idea: "The most literal: a wide, faint shaft with rings of light running down it, and the pin itself is seen coming down inside, fast at first and gently at the end, as if the Hometown were lowering it on a line.",
      phases: [[0, 0.25, "shaft opens"], [0.15, 1.45, "pin is lowered"], [1.45, 1.75, "touches down"], [1.5, 2.0, "shaft closes upward"]],
      keys: [[-0.2, "before"], [0.3, "shaft open"], [0.6, "coming down"], [1.1, "slowing"], [1.5, "touches down"], [2.4, "after"]],
      build: ["<b>Shaft:</b> one open cylinder with an additive banded texture scrolling downward, which gives the rings for free.", "<b>Pin:</b> it is a screen-space canvas, so it is simply moved down the projected line and tinted white until it lands.", "<b>Ground:</b> a rotating dashed decal and one soft pulse."],
      cost: ["mid", "Medium: a tall, wide transparent surface for two seconds"],
      draw: function (fr, c, tau) {
        var col = this.color, cs = c.cs, open = seg(tau, 0, 0.25), close = seg(tau, 1.5, 1.98), r = 8.5 * cs, hPin = c.top * (1 - E.outCubic(seg(tau, 0.15, 1.45))), i;
        ghost(fr, c, tau); mark(fr, c, open * (1 - seg(tau, 1.6, 2.0)), 9.5 * cs, tau * 10);
        if (tau > 0 && close < 1) {
          var vis = function (h) { return h >= c.top * close ? 1 : 0; };
          beam(fr, c, c.top * close, c.top, r, halo(col, 6), function (h) { return 0.5 * open * vis(h); }, -tau * 120, 0.28);
          for (i = 0; i < 10; i++) {
            var f = ((i / 10 - tau * 0.5) % 1 + 1) % 1, h = f * c.top, edge = Math.min(1, f * 8) * Math.min(1, (1 - f) * 5); if (h < c.top * close) continue;
            fr.circlePath(fr.add, c.X, c.Z, r, h, 40); fr.add.globalAlpha = 0.85 * open * edge; fr.add.strokeStyle = col; fr.add.lineWidth = Math.max(1.1, 0.5 * cs * fr.P(c.X, h, c.Z).k); fr.add.stroke(); fr.add.globalAlpha = 1;
            if (!fr.night) { fr.circlePath(fr.over, c.X, c.Z, r, h, 40); fr.over.globalAlpha = 0.6 * open * edge; fr.over.strokeStyle = WHITE; fr.over.lineWidth = 1; fr.over.stroke(); fr.over.globalAlpha = 1; }
          }
          fr.pool(fr.add, c.X, c.Z, 13 * cs, M.soft(col), 0.5 * open * (1 - close)); fr.light(c.X, c.Z, 40 * cs, "#E4F5FF", 0.85 * open * (1 - close));
        }
        var land = seg(tau, 1.45, 1.85); if (land > 0 && land < 1) { fr.ring(fr.add, c.X, c.Z, (8 + 12 * E.outCubic(land)) * cs, 1.2 * cs, col, 0.9 * (1 - land)); if (!fr.night) fr.ring(fr.ground, c.X, c.Z, (8 + 12 * E.outCubic(land)) * cs, 0.6 * cs, WHITE, 0.7 * (1 - land)); }
        landing(fr, c, seg(tau, 1.45, 2.05), 0.55);
        if (tau > 0.15) { var p = fr.P(c.X, hPin + 1.5, c.Z), white = 1 - seg(tau, 1.45, 1.8); fr.glow(fr.add, M.soft(col), p.x, p.y - 26, 34, 0.8 * white); fr.pin(fr.over, p.x, p.y, c.icon, { flash: 0.92 * white, flashColor: "#F2FBFF", s: 0.92 + 0.08 * seg(tau, 1.35, 1.5) }); }
      }
    },
    {
      id: "sunshaft", name: "Sunshaft", length: 2.2, color: "#FFE7A8", nightColor: "#CFE0FF",
      idea: "The gentle one: a broad shaft of light opens as if the clouds under the Hometown had parted, motes and a few leaves drift down it, and the pin fades in on the ground. It takes its colour from the hour, gold by day and silver at night.",
      phases: [[0, 0.5, "shaft opens"], [0.3, 1.7, "motes and leaves drift down"], [1.0, 1.5, "pin fades in"], [1.5, 2.2, "shaft closes"]],
      keys: [[-0.2, "before"], [0.4, "opening"], [0.9, "motes drift down"], [1.25, "pin fades in"], [1.8, "closing"], [2.5, "after"]],
      build: ["<b>Shaft:</b> three overlapping additive quads or cylinders with slow scrolling streaks: the old, cheap way to fake light shafts, no volumetrics.", "<b>Motes, leaves, cloud wisps:</b> three small particle systems; leaves use a texture sheet and the noise module for flutter.", "<b>Colour:</b> read from the same hour the sun and moon use, so the effect belongs to the time of day.", "<b>Ground:</b> a soft decal and one light."],
      cost: ["high", "Highest: the widest transparent surfaces, for the longest"],
      draw: function (fr, c, tau) {
        var col = fr.night ? this.nightColor : this.color, cs = c.cs, a = seg(tau, 0, 0.5) * (1 - seg(tau, 1.5, 2.2)), i;
        ghost(fr, c, tau);
        if (a > 0) {
          [[13, 0.30, 0, 30], [8.5, 0.34, 1.6, 46], [4.6, 0.42, -1.1, 64]].forEach(function (s, j) { fr.column(fr.add, c.X + s[2] * cs, c.Z, 0, c.top, s[0] * cs, halo(col, 9 + j), s[1] * a, -tau * s[3] + j * 70, 1.7); });
          if (!fr.night) fr.column(fr.over, c.X, c.Z, 0, c.top, 9 * cs, M.columnTex("sunbody", [[0, "#FFF8E0", 0], [0.5, "#FFF8E0", 0.34], [1, "#FFF8E0", 0]], 8, 3), a, -tau * 40, 1.7);
          fr.pool(fr.add, c.X, c.Z, 20 * cs, M.soft(col), 0.6 * a); fr.light(c.X, c.Z, 50 * cs, col, 1.0 * a);
          for (i = 0; i < 46; i++) {
            var f = ((M.rnd(i, 21) - tau * 0.2) % 1 + 1) % 1, h = f * Math.min(c.top, 130 * cs), ang = M.rnd(i, 22) * 6.283 + tau * (0.5 + M.rnd(i, 23)), rr = (1.5 + 9 * M.rnd(i, 24)) * cs, p = fr.P(c.X + Math.cos(ang) * rr, h, c.Z + Math.sin(ang) * rr);
            fr.glow(fr.add, M.hot(col), p.x, p.y, (0.9 + 1.4 * M.rnd(i, 25)) * p.k * cs, a * (0.5 + 0.5 * Math.sin(tau * 5 + i)) * Math.min(1, f * 6));
          }
          for (i = 0; i < 9; i++) {   /* leaves: small turning flakes, ordinary blending */
            var lf = ((M.rnd(i, 31) - tau * 0.16) % 1 + 1) % 1, lh = lf * Math.min(c.top, 90 * cs), la = M.rnd(i, 32) * 6.283 + tau * 1.1, lr = (2 + 7 * M.rnd(i, 33)) * cs + Math.sin(tau * 3 + i) * 1.5 * cs, q = fr.P(c.X + Math.cos(la) * lr, lh, c.Z + Math.sin(la) * lr), o = fr.over;
            o.save(); o.translate(q.x, q.y); o.rotate(tau * 2.4 + i); o.scale(1, 0.35 + 0.65 * Math.abs(Math.sin(tau * 3.1 + i * 2))); o.globalAlpha = a * Math.min(1, lf * 5) * 0.95; o.fillStyle = i % 3 ? "#7CC46A" : "#F3E2A0"; o.beginPath(); o.ellipse(0, 0, 1.5 * q.k * cs, 0.75 * q.k * cs, 0, 0, 7); o.fill(); o.restore(); o.globalAlpha = 1;
          }
          for (i = 0; i < 4; i++) { var ch = c.top * (0.95 - 0.35 * seg(tau, 0.1, 1.6)) - i * c.top * 0.08, w = fr.P(c.X + (i - 1.5) * 5 * cs, ch, c.Z); fr.glow(fr.over, M.puff(WHITE), w.x, w.y, (9 + 3 * i) * cs * w.k, 0.5 * a * (1 - seg(tau, 0.9, 1.6))); }
        }
        var ring = seg(tau, 1.05, 1.75); if (ring > 0 && ring < 1) for (i = 0; i < 14; i++) { var s = fr.P(c.X + Math.cos(i * 0.449) * 8 * cs, 0.6 * cs, c.Z + Math.sin(i * 0.449) * 8 * cs); fr.glow(fr.add, M.star(col), s.x, s.y, 3.4 * s.k * cs, E.bell(ring) * (0.5 + 0.5 * Math.sin(tau * 16 + i * 2.1))); }
        if (tau > 1.0) fr.pin(fr.over, c.tip.x, c.tip.y, c.icon, { a: seg(tau, 1.0, 1.4), s: 0.86 + 0.14 * E.outCubic(seg(tau, 1.0, 1.45)), flash: 0.85 * (1 - seg(tau, 1.15, 1.7)), flashColor: "#FFF6DC" });
      }
    },
    {
      id: "print", name: "Print", length: 1.5, color: "#8CFFE0",
      idea: "The precise one: a hair-thin line strikes the spot, a flat target draws itself on the ground, and a bright scan line climbs the pin, building it from the bottom up while sparks fly off its edge.",
      phases: [[0, 0.06, "line strikes"], [0.05, 0.4, "target draws"], [0.4, 1.0, "scan builds the pin"], [1.0, 1.5, "line and target go"]],
      keys: [[-0.2, "before"], [0.04, "line strikes"], [0.3, "target draws"], [0.7, "scanning"], [1.05, "complete"], [1.8, "after"]],
      build: ["<b>Line:</b> a line renderer two points long; unlit; a flicker on its alpha.", "<b>Target:</b> one quad with a flat symbol texture whose fill amount and rotation are driven by a script, in the approved symbols' cream and green.", "<b>Scan:</b> a rectangular mask on the pin's canvas that opens upward, a bright bar along its edge, and a dozen sparks.", "Needs nothing the interface does not already have."],
      cost: ["low", "Lowest: a line, a quad, a dozen sparks"],
      draw: function (fr, c, tau) {
        var col = this.color, cs = c.cs, on = seg(tau, 0, 0.05), up = E.inCubic(seg(tau, 1.05, 1.3)), flick = 0.85 + 0.15 * Math.sin(tau * 61), i;
        ghost(fr, c, tau);
        if (tau > 0 && up < 1) {
          beam(fr, c, c.top * up, c.top, 0.75 * cs, core(col), on * flick, 0, 0.9); beam(fr, c, c.top * up, c.top, 2.6 * cs, halo(col, 0), 0.6 * on * flick, 0, 0);
          fr.glow(fr.add, M.hot(col), c.base.x, c.base.y, 9 * cs * c.base.k, (1 - seg(tau, 0, 0.25)) + 0.35 * (1 - up));
        }
        var drawn = seg(tau, 0.05, 0.38), away = seg(tau, 1.15, 1.5), R = 9 * cs * (1 - 0.6 * E.inCubic(away)), ga = (1 - away);
        if (drawn > 0 && ga > 0) fr.onGround(fr.ground, c.X, c.Z, function (g) {
          [[INK, 1.7 * cs, 0.85], [PAPER, 0.85 * cs, 1]].forEach(function (s) {
            g.globalAlpha = s[2] * ga; g.strokeStyle = s[0]; g.lineWidth = s[1]; g.beginPath(); g.arc(0, 0, R, -1.57, -1.57 + 6.283 * drawn); g.stroke();
            for (var j = 0; j < 8; j++) if (drawn > j / 8) { var an = j * 0.7854; g.beginPath(); g.moveTo(Math.cos(an) * R * 1.08, Math.sin(an) * R * 1.08); g.lineTo(Math.cos(an) * R * 1.3, Math.sin(an) * R * 1.3); g.stroke(); }
            g.setLineDash([R * 0.5, R * 0.35]); g.lineDashOffset = tau * 14 * cs; g.beginPath(); g.arc(0, 0, R * 0.58, 0, 6.283); g.stroke(); g.setLineDash([]);
          });
        });
        if (drawn > 0 && ga > 0) { fr.ring(fr.add, c.X, c.Z, R, 1.6 * cs, col, (fr.night ? 0.7 : 0.25) * ga * drawn); fr.light(c.X, c.Z, 30 * cs, "#DFFFF4", 0.7 * ga * drawn); }
        var scan = seg(tau, 0.4, 1.0);
        if (scan > 0) {
          pop(fr, c, 1, { reveal: scan, flash: 0.9 * (1 - seg(tau, 1.0, 1.2)) * (scan >= 1 ? 1 : 0.35), flashColor: "#E6FFF8" });
          if (scan < 1) {
            var y = c.tip.y - 52 * scan; fr.streak(fr.add, M.hot(col), c.tip.x - 34, y, c.tip.x + 34, y, 9, 1); fr.over.fillStyle = WHITE; fr.over.fillRect(c.tip.x - 26, y - 1, 52, 2);
            for (i = 0; i < 12; i++) { var life = ((tau * 3.2 + M.rnd(i, 41)) % 1), side = i % 2 ? 1 : -1, sx = c.tip.x + side * (24 + 30 * life), sy = y - 10 * life + 26 * life * life + (M.rnd(i, 42) - 0.5) * 8; fr.streak(fr.add, M.hot(col), sx - side * 7, sy - 1, sx, sy, 3.5, 1 - life); }
          }
        }
      }
    },
    {
      id: "ribbons", name: "Ribbons", length: 1.6, color: "#FFF1C9", colors: ["#FFF1C9", "#9BE58A", "#8FDCFF"],
      idea: "The playful one: three ribbons of light spiral down round an empty middle, tighten as they fall, meet at the ground in a star, and the pin springs out of the burst.",
      phases: [[0, 0.85, "ribbons spiral down"], [0.85, 1.0, "they meet"], [0.9, 1.2, "pin springs out"], [1.0, 1.5, "sparkles fall"]],
      keys: [[-0.2, "before"], [0.35, "spiralling down"], [0.7, "tightening"], [0.88, "they meet"], [1.05, "pin springs out"], [1.9, "after"]],
      build: ["<b>Ribbons:</b> three trail renderers on emitters that a script moves along a tightening helix; the trail does the rest.", "<b>Burst:</b> one star sprite and a one-shot particle burst with a little gravity.", "<b>Pin:</b> scale with overshoot on the pin's canvas.", "Almost nothing tall and transparent, so it stays cheap even zoomed in."],
      cost: ["low", "Low: thin trails and one burst"],
      draw: function (fr, c, tau) {
        var cs = c.cs, self = this, j, s;
        ghost(fr, c, tau); mark(fr, c, seg(tau, 0, 0.12) * (1 - seg(tau, 0.85, 1.0)), 6.5 * cs, tau * 8);
        function at(u, jj) { var h = c.top * (1 - E.inOut(seg(u, 0, 0.85))), ang = jj * 2.0944 + u * 10.5, rr = (1.2 + 10 * Math.pow(h / c.top, 0.7)) * cs; return fr.P(c.X + Math.cos(ang) * rr, h, c.Z + Math.sin(ang) * rr); }
        if (tau > 0 && tau < 1.35) for (j = 0; j < 3; j++) {
          var prev = null; for (s = 0; s <= 26; s++) {
            var u = tau - s / 26 * 0.42; if (u < 0) break; var p = at(Math.min(u, 0.85), j), fade = Math.pow(1 - s / 26, 1.4) * (1 - seg(tau, 0.95, 1.35));
            if (prev && fade > 0.01) { fr.streak(fr.add, M.hot(self.colors[j]), prev.x, prev.y, p.x, p.y, (1 - s / 26) * 3.4 * p.k * cs + 1.4, fade); if (!fr.night) fr.streak(fr.over, M.puff(WHITE), prev.x, prev.y, p.x, p.y, (1 - s / 26) * 1.3 * p.k * cs + 0.8, fade * 0.85); }
            prev = p;
          }
          if (tau < 0.88) { var head = at(tau, j); fr.glow(fr.add, M.hot(self.colors[j]), head.x, head.y, 5 * head.k * cs, 1); if (tau % 0.06 < 0.03) fr.glow(fr.add, M.star(self.colors[j]), head.x, head.y, 8 * head.k * cs, 0.8); }
        }
        if (tau > 0.1 && tau < 1.0) beam(fr, c, c.top * (1 - E.inOut(seg(tau, 0, 0.85))), c.top, 0.9 * cs, core("#FFF1C9"), 0.3 * (1 - seg(tau, 0.8, 1.0)), 0, 0);
        var b = seg(tau, 0.85, 1.25);
        if (b > 0 && b < 1) { fr.glow(fr.add, M.star("#FFF1C9"), c.base.x, c.base.y, (14 + 22 * b) * cs * c.base.k, 1.3 * (1 - b)); fr.glow(fr.add, M.hot("#FFF1C9"), c.base.x, c.base.y, 14 * cs * c.base.k, 1.2 * (1 - b)); fr.ring(fr.add, c.X, c.Z, (3 + 16 * E.outCubic(b)) * cs, 1.2 * cs, "#CFF6FF", 0.8 * (1 - b)); }
        var g = seg(tau, 0.85, 1.6) > 0 ? (1 - seg(tau, 0.85, 1.6)) : 0; fr.pool(fr.add, c.X, c.Z, 15 * cs, M.soft("#FFF1C9"), 0.6 * g); fr.light(c.X, c.Z, 40 * cs, "#FFF3D6", 0.95 * g);
        for (j = 0; j < 3; j++) sparks(fr, c, tau, 0.86, 6, 20, 36, 46, self.colors[j], 50 + j * 7, 0.7);
        landing(fr, c, seg(tau, 0.86, 1.4), 0.6);
        pop(fr, c, seg(tau, 0.9, 1.18), { flash: 1 - seg(tau, 0.95, 1.25), flashColor: "#FFF6DC" });
      }
    }
  ];

  /* ---- a scene for one concept: the loop is [before | the effect | after] ------------------------------------------ */
  function sceneFor(concept, fixedZoom) {
    var scene = { bloom: true, clear: false, zoom: "default", time: "day" };
    scene.sync = function () { scene.zoom = fixedZoom || view.zoom; scene.time = view.time; scene.bloom = view.bloom; };
    scene.draw = function (fr) {
      var z = TARGETS[fr.cam.zoom], water = view.kind === "trap" && view.surface === "water" && z.water, at = water ? z.water : z[view.kind], g = fr.cam.ground(at[0], at[1]);
      var c = { X: g.X, Z: g.Z, cs: fr.cam.scale, kind: view.kind, surface: water ? "water" : "land", icon: M.image(ICONS + (view.kind === "trap" ? "wooden-trap" : "worker") + ".svg") };
      c.top = fr.cam.exitHeight(c.X, c.Z); c.base = fr.P(c.X, 0, c.Z); c.tip = fr.P(c.X, 1.5, c.Z);
      var tau = fr.t - LEAD;
      if (tau < 0) { ghost(fr, c, tau); return; }
      concept.draw(fr, c, tau);
    };
    scene.sync(); return scene;
  }
  function total(concept) { return LEAD + concept.length + HOLD; }

  /* ---- the page ---------------------------------------------------------------------------------------------------- */
  var lives = [], boards = [];
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }

  function buildLive(row, concept, i) {
    var item = el("div", "rv-item"), bezel = el("div", "rv-bezel"), phone = el("div", "phone"); phone.id = "beam-" + concept.id; bezel.appendChild(phone); item.appendChild(bezel);
    var scene = sceneFor(concept), canvas = M.phone(phone, scene.zoom), stage = new M.Stage(canvas), len = total(concept);
    var ctl = el("div", "st-controls"), range = el("input"), out = el("output"); range.type = "range"; range.min = 0; range.max = len; range.step = 0.01; range.value = 0; range.setAttribute("aria-label", "Time in " + concept.name);
    ctl.appendChild(range); ctl.appendChild(out); item.appendChild(ctl);
    var ph = el("div", "st-phases"), now = el("b", "now"); concept.phases.forEach(function (p, j) {
      /* phases overlap in time and their names are longer than their bars: each takes the next of three tracks */
      var bar = el("i"); bar.style.left = (LEAD + p[0]) / len * 100 + "%"; bar.style.width = (p[1] - p[0]) / len * 100 + "%"; bar.style.top = (j % 3) * 6 + "px"; ph.appendChild(bar);
      var lab = el("span", "", p[2]); lab.style.left = (LEAD + p[0]) / len * 100 + "%"; lab.style.top = 22 + (j % 3) * 13 + "px"; ph.appendChild(lab);
    }); ph.appendChild(now); item.appendChild(ph);
    item.appendChild(el("p", "rv-cap", "<b>" + concept.name + "</b>" + concept.idea));
    var ul = el("ul", "st-build"); concept.build.forEach(function (b) { ul.appendChild(el("li", "", b)); }); item.appendChild(ul);
    item.appendChild(el("span", "st-cost " + concept.cost[0], concept.cost[1]));
    row.appendChild(item);
    var player = new M.Player(stage, scene, { length: len, start: (i * 0.37) % len, onTime: function (t) { if (!player.held) range.value = t; out.textContent = (t - LEAD >= 0 ? "+" : "") + (t - LEAD).toFixed(2) + " s"; now.style.left = t / len * 100 + "%"; } });
    range.addEventListener("input", function () { player.held = true; player.seek(parseFloat(range.value)); });
    range.addEventListener("change", function () { player.held = false; });
    lives.push({ phone: phone, scene: scene, player: player, concept: concept });
  }

  function buildBoard(host, concept) {
    host.appendChild(el("h3", "st-board-title", concept.name));
    var board = el("div", "st-board"); board.id = "board-" + concept.id; host.appendChild(board);
    concept.keys.forEach(function (k) {
      var fig = el("figure"), cv = el("canvas"); fig.appendChild(cv); fig.appendChild(el("figcaption", "", "<b>" + (k[0] >= 0 ? "+" : "") + k[0].toFixed(2) + " s</b>" + k[1])); board.appendChild(fig);
      boards.push({ stage: new M.Stage(cv), scene: sceneFor(concept), t: LEAD + k[0] });
    });
  }
  function drawBoards() { boards.forEach(function (b) { b.scene.sync(); b.stage.render(b.scene, b.t); }); }

  document.addEventListener("DOMContentLoaded", function () {
    var q = M.state(); if (q.capture) document.body.classList.add("capture");
    ["zoom", "time", "kind", "surface"].forEach(function (k) { if (q[k]) view[k] = q[k]; }); if (q.bloom) view.bloom = q.bloom !== "off";
    var row = document.getElementById("beam-live"), host = document.getElementById("beam-boards");
    CONCEPTS.forEach(function (c, i) { buildLive(row, c, i); buildBoard(host, c); });
    function refresh() { lives.forEach(function (l) { l.scene.sync(); M.phone(l.phone, l.scene.zoom); }); var w = document.getElementById("surface-set"); if (w) w.disabled = view.kind !== "trap" || !TARGETS[view.zoom].water; drawBoards(); }
    M.radios("zoom", function (v) { view.zoom = v; refresh(); }, view.zoom);
    M.radios("time", function (v) { view.time = v; refresh(); }, view.time);
    M.radios("kind", function (v) { view.kind = v; refresh(); }, view.kind);
    M.radios("surface", function (v) { view.surface = v; refresh(); }, view.surface);
    M.radios("bloom", function (v) { view.bloom = v === "on"; refresh(); }, view.bloom ? "on" : "off");
    M.radios("speed", function (v) { M.clock.speed = parseFloat(v); }, q.speed || "1"); M.clock.speed = parseFloat(q.speed || "1");
    var pause = document.getElementById("st-pause");
    function setPaused(v) { M.clock.paused = v; if (pause) { pause.setAttribute("aria-pressed", v ? "true" : "false"); pause.textContent = v ? "Play" : "Pause"; } }
    if (pause) pause.addEventListener("click", function () { setPaused(!M.clock.paused); });
    var again = document.getElementById("st-again"); if (again) again.addEventListener("click", function () { lives.forEach(function (l) { l.player.t = 0; }); setPaused(false); });
    setPaused(!!q.capture || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));
    refresh();
    /* images arrive after the first drawing: draw the still boards again once they are in */
    var tries = 0, iv = setInterval(function () { drawBoards(); if (++tries > 12) clearInterval(iv); }, 250);
    /* for the capture script: one state, one exact moment after the confirmation, on every live phone */
    window.STUDY = { lead: LEAD, concepts: CONCEPTS.map(function (c) { return { id: c.id, length: c.length, keys: c.keys }; }),
      set: function (s) { ["zoom", "time", "kind", "surface"].forEach(function (k) { if (s[k]) view[k] = s[k]; }); if (s.bloom !== undefined) view.bloom = s.bloom; refresh(); if (s.tau !== undefined) lives.forEach(function (l) { l.player.visible = true; l.player.held = true; l.player.seek(LEAD + s.tau); }); },
      /* all six side by side at one moment after the confirmation, as a JPEG data URL (the page must be served, not opened from disk) */
      film: function (tau, scale) { var scenes = lives.map(function (l) { l.scene.sync(); return l.scene; }); return M.film(scenes, LEAD + tau, scale).toDataURL("image/jpeg", 0.92); },
      frame: function (id, tau) { lives.forEach(function (l) { if (l.concept.id === id) { l.player.held = true; l.player.seek(LEAD + tau); } }); } };
    M.start();
  });
})();
