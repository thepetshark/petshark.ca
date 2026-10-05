/* Shared base of the three live map studies (placement beam, player marker, water).

   A study draws over the owner's real map (plates/, made by ../../tools/study_plates.py) with the kinds of parts
   Unity's effect tools offer - soft additive sprites, stretched sprites, a cylinder with a scrolling pattern, rings
   and decals on the ground, small flat-shaded meshes, a light that brightens the ground by the map's own colours,
   and a bloom pass - through a camera set to the game's real numbers (scene.js), so a vertical beam leans, widens
   and foreshortens at each zoom as it would in the game.

   Every drawing is a pure function of time: no state is kept between frames, so a page can scrub, slow down, and a
   capture script can ask for an exact moment. Nothing reads pixels back, so the pages also work from disk.
   Plain script, no modules, no fetch. */
(function () {
  "use strict";
  var S = window.STUDY_SCENE, W = S.size[0], H = S.size[1];
  var F = (H / 2) / Math.tan(S.fov * Math.PI / 360);
  var PLATES = "../shared/plates/";
  /* the direction TO the sun by day, read off the capsule's shadow in the owner's screenshots: it falls to the lower right */
  var SUN = { x: -0.45, y: 0.78, z: 0.43 };

  /* ---- camera ------------------------------------------------------------------------------------------------
     x to the right, y up, z away from the camera along the ground. The player stands at the origin. */
  function camera(zoom) {
    var z = S.camera[zoom], p = z.pitch * Math.PI / 180, s = Math.sin(p), c = Math.cos(p);
    var cy = S.lookAtHeight + z.distance * s, cz = -z.distance * c;
    var cam = { zoom: zoom, s: s, c: c, x: 0, y: cy, z: cz, distance: z.distance, pitch: z.pitch, scale: Math.sqrt(z.distance / S.camera["default"].distance) };
    cam.project = function (X, Y, Z) {
      var vy = Y - cy, vz = Z - cz, zc = -vy * s + vz * c, yc = vy * c + vz * s;
      return { x: W / 2 + F * X / zc, y: H / 2 - F * yc / zc, k: F / zc, zc: zc };
    };
    cam.ground = function (x, y) {
      var dx = (x - W / 2) / F, dy = (H / 2 - y) / F, down = s - dy * c;
      if (down <= 1e-6) return null;
      var t = cy / down;
      return { X: t * dx, Z: cz + t * (dy * s + c) };
    };
    /* the ground plane round a point as an affine frame: good for anything much smaller than its distance */
    cam.frame = function (X, Z, Y) {
      Y = Y || 0;
      var o = cam.project(X, Y, Z), ex = cam.project(X + 1, Y, Z), ez = cam.project(X, Y, Z + 1);
      return { o: o, ax: ex.x - o.x, ay: ex.y - o.y, bx: ez.x - o.x, by: ez.y - o.y };
    };
    /* the height at which a vertical line over (X, Z) leaves the top of the screen */
    cam.exitHeight = function (X, Z) {
      for (var h = 0; h < 1500; h += 2) { var q = cam.project(X, h, Z); if (q.zc < 12 || q.y < -60 || q.x < -120 || q.x > W + 120) return h; }
      return 1500;
    };
    return cam;
  }

  /* ---- small tools --------------------------------------------------------------------------------------------- */
  function rnd(i, salt) {
    var x = (Math.imul(i + 1, 374761393) + Math.imul((salt | 0) + 1, 668265263)) | 0;
    x = Math.imul(x ^ (x >>> 13), 1274126177);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  var ease = {
    seg: function (t, a, b) { return clamp((t - a) / (b - a)); },
    inQuad: function (k) { return k * k; },
    outQuad: function (k) { return 1 - (1 - k) * (1 - k); },
    inCubic: function (k) { return k * k * k; },
    outCubic: function (k) { return 1 - Math.pow(1 - k, 3); },
    inOut: function (k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
    outBack: function (k) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
    bell: function (k) { return Math.sin(Math.PI * clamp(k)); },
    /* up quickly, down slowly: 0 at k=0, 1 at k=peak, 0 at k=1 */
    pulse: function (k, peak) { k = clamp(k); return k < peak ? k / peak : 1 - (k - peak) / (1 - peak); }
  };
  function rgb(hex) { hex = hex.replace("#", ""); return [parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16)]; }
  function rgba(hex, a) { var c = rgb(hex); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  function mix(a, b, k) { var p = rgb(a), q = rgb(b); return "rgb(" + Math.round(p[0] + (q[0] - p[0]) * k) + "," + Math.round(p[1] + (q[1] - p[1]) * k) + "," + Math.round(p[2] + (q[2] - p[2]) * k) + ")"; }

  var images = {};
  function image(src) { if (!images[src]) { var i = new Image(); i.src = src; images[src] = i; } return images[src]; }
  function ok(img) { return img && img.complete && img.naturalWidth > 0; }
  function blank(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

  /* ---- sprites: painted once, reused ------------------------------------------------------------------------- */
  var sprites = {};
  function sprite(key, size, paint) { if (!sprites[key]) { var c = blank(size, size); paint(c.getContext("2d"), size); sprites[key] = c; } return sprites[key]; }
  function radial(x, n, stops) { var g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); x.fillStyle = g; x.fillRect(0, 0, n, n); }
  /* a soft particle: what a default particle texture is */
  function soft(color) { return sprite("soft" + color, 96, function (x, n) { radial(x, n, [[0, rgba(color, 1)], [0.2, rgba(color, 0.62)], [0.45, rgba(color, 0.22)], [0.7, rgba(color, 0.06)], [1, rgba(color, 0)]]); }); }
  /* the same with a white-hot centre */
  function hot(color) { return sprite("hot" + color, 96, function (x, n) { radial(x, n, [[0, "rgba(255,255,255,1)"], [0.12, "rgba(255,255,255,.92)"], [0.3, rgba(color, 0.6)], [0.6, rgba(color, 0.14)], [1, rgba(color, 0)]]); }); }
  /* a four-point sparkle */
  function star(color) {
    return sprite("star" + color, 96, function (x, n) {
      x.globalCompositeOperation = "lighter";
      [0, Math.PI / 2].forEach(function (a) {
        x.save(); x.translate(n / 2, n / 2); x.rotate(a); x.scale(1, 0.09);
        var g = x.createRadialGradient(0, 0, 0, 0, 0, n / 2); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, rgba(color, 0.8)); g.addColorStop(1, rgba(color, 0));
        x.fillStyle = g; x.beginPath(); x.arc(0, 0, n / 2, 0, 7); x.fill(); x.restore();
      });
      x.save(); x.translate(n / 2, n / 2); var g2 = x.createRadialGradient(0, 0, 0, 0, 0, n * 0.16); g2.addColorStop(0, "rgba(255,255,255,1)"); g2.addColorStop(1, rgba(color, 0)); x.fillStyle = g2; x.beginPath(); x.arc(0, 0, n * 0.16, 0, 7); x.fill(); x.restore();
    });
  }
  /* an opaque-ish puff for dust and cloud: drawn with normal blending, not added */
  function puff(color) { return sprite("puff" + color, 96, function (x, n) { radial(x, n, [[0, rgba(color, 0.9)], [0.45, rgba(color, 0.55)], [0.8, rgba(color, 0.12)], [1, rgba(color, 0)]]); }); }

  /* The skin of a light column: across = the falloff from edge to core; along = a pattern that can scroll.
     stops: [[0..1 across, colour, alpha], ...]; streaks cut soft vertical gaps so the scrolling is visible. */
  var texes = {};
  function columnTex(key, stops, streaks, seed) {
    if (texes[key]) return texes[key];
    var tw = 64, th = 256, tile = blank(tw, th), x = tile.getContext("2d");
    var g = x.createLinearGradient(0, 0, tw, 0); stops.forEach(function (s) { g.addColorStop(s[0], rgba(s[1], s[2])); });
    x.fillStyle = g; x.fillRect(0, 0, tw, th);
    x.globalCompositeOperation = "destination-out";
    for (var i = 0; i < (streaks || 0); i++) {
      var sx = rnd(i, seed) * tw, sw = 3 + rnd(i, seed + 1) * 9, sy = rnd(i, seed + 2) * th, sh = 50 + rnd(i, seed + 3) * 150, a = 0.25 + rnd(i, seed + 4) * 0.5;
      [-th, 0, th].forEach(function (off) {
        var gg = x.createLinearGradient(0, sy + off, 0, sy + off + sh); gg.addColorStop(0, "rgba(0,0,0,0)"); gg.addColorStop(0.5, "rgba(0,0,0," + a + ")"); gg.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = gg; x.fillRect(sx - sw / 2, sy + off, sw, sh);
      });
    }
    var out = blank(tw, th * 2), o = out.getContext("2d"); o.drawImage(tile, 0, 0); o.drawImage(tile, 0, th);
    out.tile = th; texes[key] = out; return out;
  }

  /* ---- scratch layers shared by every phone (drawing is sequential) -------------------------------------------- */
  var scratch = null;
  function layers() {
    if (!scratch) {
      scratch = { ground: blank(W, H), add: blank(W, H), over: blank(W, H), lit: blank(W, H), q1: blank(W / 2, H / 2), q2: blank(W / 4, H / 4), q3: blank(Math.ceil(W / 8), Math.ceil(H / 8)) };
      Object.keys(scratch).forEach(function (k) { scratch[k + "x"] = scratch[k].getContext("2d"); });
      scratch.blur = typeof scratch.q2x.filter === "string";
    }
    return scratch;
  }

  /* ---- what a study draws with ------------------------------------------------------------------------------- */
  function Frame(cam, t, scene) {
    var L = layers();
    this.W = W; this.H = H; this.F = F; this.cam = cam; this.t = t; this.scene = scene; this.night = scene.time === "night";
    this.ground = L.groundx; this.add = L.addx; this.over = L.overx; this.lights = []; this.shake = null;
    this.sun = SUN;
  }
  Frame.prototype.P = function (X, Y, Z) { return this.cam.project(X, Y, Z); };
  Frame.prototype.glow = function (ctx, spr, x, y, r, a) { if (a <= 0.003 || r <= 0.2) return; ctx.globalAlpha = a > 1 ? 1 : a; ctx.drawImage(spr, x - r, y - r, 2 * r, 2 * r); if (a > 1) { ctx.globalAlpha = Math.min(1, a - 1); ctx.drawImage(spr, x - r, y - r, 2 * r, 2 * r); } ctx.globalAlpha = 1; };
  /* a sprite stretched along its motion: Unity's stretched billboard */
  Frame.prototype.streak = function (ctx, spr, x0, y0, x1, y1, width, a) {
    if (a <= 0.003) return;
    var dx = x1 - x0, dy = y1 - y0, len = Math.sqrt(dx * dx + dy * dy) + width;
    ctx.save(); ctx.translate((x0 + x1) / 2, (y0 + y1) / 2); ctx.rotate(Math.atan2(dy, dx)); ctx.globalAlpha = Math.min(1, a); ctx.drawImage(spr, -len / 2, -width / 2, len, width); ctx.restore(); ctx.globalAlpha = 1;
  };
  /* run fn with the ground round (X, Z) as the coordinate system: x right, y AWAY from the camera, one unit = one world unit */
  Frame.prototype.onGround = function (ctx, X, Z, fn, Y) { var f = this.cam.frame(X, Z, Y); ctx.save(); ctx.transform(f.ax, f.ay, f.bx, f.by, f.o.x, f.o.y); fn(ctx, f); ctx.restore(); };
  /* a ring lying on the ground; width in world units */
  Frame.prototype.ring = function (ctx, X, Z, r, width, style, a, dash, turn) {
    if (a <= 0.003 || r <= 0) return;
    this.onGround(ctx, X, Z, function (c) { c.globalAlpha = Math.min(1, a); c.strokeStyle = style; c.lineWidth = width; if (dash) { c.setLineDash(dash); c.lineDashOffset = turn || 0; } c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke(); });
    ctx.globalAlpha = 1;
  };
  /* a soft disc lying on the ground */
  Frame.prototype.pool = function (ctx, X, Z, r, spr, a) { if (a <= 0.003) return; this.onGround(ctx, X, Z, function (c) { c.globalAlpha = Math.min(1, a); c.drawImage(spr, -r, -r, 2 * r, 2 * r); }); ctx.globalAlpha = 1; };
  /* a circle too large for the affine frame: projected point by point, at height Y */
  Frame.prototype.circlePath = function (ctx, X, Z, r, Y, n) {
    ctx.beginPath(); n = n || 72; var started = false;
    for (var i = 0; i <= n; i++) { var a = i / n * Math.PI * 2, q = this.cam.project(X + Math.cos(a) * r, Y || 0, Z + Math.sin(a) * r); if (q.zc < 5) { started = false; continue; } if (started) ctx.lineTo(q.x, q.y); else { ctx.moveTo(q.x, q.y); started = true; } }
  };
  /* a light that brightens the ground by the map's own daytime colours, as a point light does */
  Frame.prototype.light = function (X, Z, r, color, a) { if (a > 0.003) this.lights.push({ X: X, Z: Z, r: r, color: color, a: a }); };

  /* A vertical column of light from height h0 to h1 over (X, Z). radius: number or function(h). alpha: number or function(h).
     The skin is laid along the column one texture pixel per screen pixel, measured from the ground, so it stays put while
     the column's ends move; `scroll` slides it in pixels (rising = the pattern climbs, falling = it flows down) and
     `stretch` (default 1) pulls it longer. */
  Frame.prototype.column = function (ctx, X, Z, h0, h1, radius, tex, alpha, scroll, stretch, steps) {
    if (h1 <= h0) return;
    /* Bands share their edges exactly. Added light then joins without a seam (the two antialiased edges sum to one);
       overlapping them instead would draw a bright stripe at every join. Ordinary blending needs a sliver of overlap.
       Each band takes as many texture rows as it has screen rows: a thin slice stretched long shows its clamped ends as stripes. */
    var n = steps || 44, prev = null, tile = tex.tile, m = 1 / (stretch || 1), lap = ctx.globalCompositeOperation === "lighter" ? 0 : 0.35;
    var foot = this.cam.project(X, 0, Z);
    for (var i = 0; i <= n; i++) {
      var h = h0 + (h1 - h0) * i / n, q = this.cam.project(X, h, Z); q.h = h;
      if (q.zc < 8) break;
      q.d = Math.sqrt((q.x - foot.x) * (q.x - foot.x) + (q.y - foot.y) * (q.y - foot.y));
      if (prev) {
        var dx = q.x - prev.x, dy = q.y - prev.y, len = Math.sqrt(dx * dx + dy * dy), hm = (h + prev.h) / 2;
        var r = typeof radius === "function" ? radius(hm) : radius, a = typeof alpha === "function" ? alpha(hm) : alpha;
        if (len > 0.01 && r > 0.001 && a > 0.003) {
          var w = r * (q.k + prev.k), sv = ((((scroll || 0) - q.d) * m) % tile + tile) % tile, sh = Math.min(tile, Math.max(0.5, len * m));
          ctx.save(); ctx.translate(prev.x, prev.y); ctx.rotate(Math.atan2(dy, dx) + Math.PI / 2); ctx.globalAlpha = Math.min(1, a);
          ctx.drawImage(tex, 0, sv, tex.width, sh, -w / 2, -len - lap, w, len + 2 * lap); ctx.restore();
        }
      }
      prev = q;
    }
    ctx.globalAlpha = 1;
  };

  /* Small flat-shaded meshes. parts: [{ v: [[x,y,z]...], f: [[i,j,k,...]...], color, glow }] - each part convex, so a
     face normal can simply be turned outward from the part's middle and no winding order has to be kept by hand. */
  Frame.prototype.mesh = function (ctx, parts, at, turn, size, o) {
    o = o || {}; var cam = this.cam, faces = [], cs = Math.cos(turn || 0), sn = Math.sin(turn || 0), sun = this.sun, night = this.night, tilt = o.tilt || 0, ct = Math.cos(tilt), st = Math.sin(tilt);
    parts.forEach(function (part) {
      var wv = part.v.map(function (p) { var x = p[0] * size, y = p[1] * size, z = p[2] * size, y2 = y * ct - z * st, z2 = y * st + z * ct; return [at[0] + x * cs + z2 * sn, at[1] + y2, at[2] - x * sn + z2 * cs]; });
      var mid = [0, 0, 0]; wv.forEach(function (p) { mid[0] += p[0] / wv.length; mid[1] += p[1] / wv.length; mid[2] += p[2] / wv.length; });
      part.f.forEach(function (f) {
        var a = wv[f[0]], b = wv[f[1]], c = wv[f[2]], ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        var fc = [0, 0, 0]; f.forEach(function (i) { fc[0] += wv[i][0] / f.length; fc[1] += wv[i][1] / f.length; fc[2] += wv[i][2] / f.length; });
        if (!part.flat && nx * (fc[0] - mid[0]) + ny * (fc[1] - mid[1]) + nz * (fc[2] - mid[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
        var toCam = nx * (cam.x - fc[0]) + ny * (cam.y - fc[1]) + nz * (cam.z - fc[2]);
        if (part.flat) { if (toCam < 0) { nx = -nx; ny = -ny; nz = -nz; } } else if (toCam <= 0) return;
        var lit = Math.max(0, nx * sun.x + ny * sun.y + nz * sun.z), shade = part.glow ? 0.6 + 0.5 * lit : (night && !o.unlit ? 0.34 + 0.22 * lit : 0.58 + 0.5 * lit);
        var col = rgb(part.color), q = f.map(function (i) { return cam.project(wv[i][0], wv[i][1], wv[i][2]); }), depth = cam.project(fc[0], fc[1], fc[2]).zc;
        var tint = night && !o.unlit && !part.glow ? [0.62, 0.74, 1.0] : [1, 1, 1];
        faces.push({ q: q, depth: depth, fill: "rgb(" + Math.min(255, Math.round(col[0] * shade * tint[0])) + "," + Math.min(255, Math.round(col[1] * shade * tint[1])) + "," + Math.min(255, Math.round(col[2] * shade * tint[2])) + ")", line: part.line });
      });
    });
    faces.sort(function (a, b) { return b.depth - a.depth; });
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha; ctx.lineJoin = "round";
    faces.forEach(function (fa) {
      ctx.beginPath(); fa.q.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }); ctx.closePath();
      ctx.fillStyle = fa.fill; ctx.fill(); ctx.strokeStyle = fa.line || fa.fill; ctx.lineWidth = fa.line ? (o.lineWidth || 1.2) : 0.7; ctx.stroke();
    });
    ctx.globalAlpha = 1;
  };

  /* Today's pin for a placed trap or worker: a cream squircle with a tip, drawn on the canvas so an effect can scale,
     squash, fade, flash or reveal it. (x, y) is the tip. */
  Frame.prototype.pin = function (ctx, x, y, icon, o) {
    o = o || {}; var s = o.s === undefined ? 1 : o.s, sy = o.sy === undefined ? 1 : o.sy, a = o.a === undefined ? 1 : o.a;
    if (a <= 0.003 || s <= 0.003) return;
    function body(c) { c.beginPath(); c.roundRect(-21.5, -50, 43, 43, 14); c.moveTo(-6.5, -8); c.lineTo(0, 0); c.lineTo(6.5, -8); c.closePath(); }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s * sy);
    if (o.reveal !== undefined && o.reveal < 1) { ctx.beginPath(); ctx.rect(-32, -52 * o.reveal - 1, 64, 52 * o.reveal + 3); ctx.clip(); }
    ctx.globalAlpha = a; ctx.fillStyle = o.fill || "#FAF4E5"; body(ctx); ctx.fill();
    if (ok(icon)) ctx.drawImage(icon, -16, -44.5, 32, 32);
    if (o.flash > 0.003) { ctx.globalAlpha = a * Math.min(1, o.flash); ctx.fillStyle = o.flashColor || "#FFFFFF"; body(ctx); ctx.fill(); }
    ctx.restore(); ctx.globalAlpha = 1;
  };

  /* ---- one phone ---------------------------------------------------------------------------------------------- */
  function Stage(canvas) { this.canvas = canvas; canvas.width = W; canvas.height = H; this.ctx = canvas.getContext("2d"); }
  /* scene: { zoom, time: "day"|"night", clear: bool (today's player removed), bloom: bool, draw: function (frame) } */
  Stage.prototype.render = function (scene, t, into) {
    var L = layers(), ctx = into || this.ctx, cam = camera(scene.zoom), fr = new Frame(cam, t, scene);
    var plate = image(PLATES + scene.time + "-" + scene.zoom + (scene.clear ? "-clear" : "") + ".jpg"), albedo = image(PLATES + "day-" + scene.zoom + (scene.clear ? "-clear" : "") + ".jpg");
    fr.plate = plate; fr.albedo = albedo;
    [L.groundx, L.addx, L.overx].forEach(function (c) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, W, H); });
    L.addx.globalCompositeOperation = "lighter";
    if (scene.draw) scene.draw(fr);
    ctx.save(); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
    if (ok(plate)) ctx.drawImage(plate, 0, 0, W, H); else { ctx.fillStyle = "#2b3a2f"; ctx.fillRect(0, 0, W, H); }
    if (fr.shake) { ctx.translate(fr.shake.x, fr.shake.y); if (ok(plate)) ctx.drawImage(plate, 0, 0, W, H); }   /* the unshaken plate underneath fills the edge the shake uncovers */
    if (scene.under) scene.under(fr, ctx);
    ctx.drawImage(L.ground, 0, 0);
    if (fr.lights.length && ok(albedo)) {
      var x = L.litx; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.fillStyle = "#000"; x.fillRect(0, 0, W, H); x.globalCompositeOperation = "lighter";
      fr.lights.forEach(function (l) { fr.pool(x, l.X, l.Z, l.r, soft(l.color), l.a * (fr.night ? 1 : 0.4)); });
      x.globalCompositeOperation = "multiply"; x.globalAlpha = 1; x.drawImage(albedo, 0, 0, W, H);
      ctx.globalCompositeOperation = "lighter"; ctx.drawImage(L.lit, 0, 0); ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalCompositeOperation = "lighter"; ctx.drawImage(L.add, 0, 0);
    if (scene.bloom) {
      [[L.q1x, L.add, L.q1], [L.q2x, L.q1, L.q2], [L.q3x, L.q2, L.q3]].forEach(function (p) { var c = p[0]; c.globalCompositeOperation = "copy"; c.imageSmoothingQuality = "high"; if (L.blur) c.filter = "blur(1.6px)"; c.drawImage(p[1], 0, 0, p[2].width, p[2].height); });
      ctx.imageSmoothingQuality = "high"; ctx.globalAlpha = 0.5; ctx.drawImage(L.q2, 0, 0, W, H); ctx.globalAlpha = 0.62; ctx.drawImage(L.q3, 0, 0, W, H); ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "source-over"; ctx.drawImage(L.over, 0, 0);
    ctx.restore();
    return fr;
  };

  /* ---- the clock: one loop for every phone on the page -------------------------------------------------------- */
  var players = [], clock = { speed: 1, paused: false, last: 0, started: false };
  function Player(stage, scene, o) {
    this.stage = stage; this.scene = scene; this.length = o.length; this.loop = o.loop !== false; this.t = o.start || 0; this.visible = true; this.held = false; this.onTime = o.onTime || null;
    players.push(this);
    if (window.IntersectionObserver) { var self = this; new IntersectionObserver(function (es) { self.visible = es[es.length - 1].isIntersecting; }, { rootMargin: "200px" }).observe(stage.canvas); }
  }
  Player.prototype.draw = function () { this.stage.render(this.scene, this.t); if (this.onTime) this.onTime(this.t); };
  Player.prototype.seek = function (t) { this.t = t; this.draw(); };
  function tick(now) {
    var dt = Math.min(0.1, (now - clock.last) / 1000) * clock.speed; clock.last = now;
    players.forEach(function (p) {
      if (!p.visible) return;
      if (!clock.paused && !p.held) { p.t += dt; if (p.t > p.length) p.t = p.loop ? p.t % p.length : p.length; }
      p.draw();
    });
    requestAnimationFrame(tick);
  }
  function start() { if (clock.started) return; clock.started = true; clock.last = performance.now(); requestAnimationFrame(tick); }

  /* ---- today's interface over a phone, flat (../shared/study.css) --------------------------------------------- */
  function phone(el, zoom, o) {
    o = o || {}; var N = window.NIGHT_PARTS, G = window.NIGHT_GEOMETRY;
    el.classList.add("nm", "fx"); el.setAttribute("data-zoom", zoom);
    var canvas = el.querySelector("canvas"); if (!canvas) { canvas = document.createElement("canvas"); canvas.className = "fx-canvas"; el.appendChild(canvas); }
    Array.prototype.slice.call(el.querySelectorAll(".fx-ui")).forEach(function (n) { n.remove(); });
    var ui = N.el("div", "fx-ui"); el.appendChild(ui);
    if (o.markers !== false) G[zoom].markers.forEach(function (m) { ui.appendChild(N.marker(m)); });
    if (o.hud !== false) N.hud(ui);
    return canvas;
  }

  /* Several scenes side by side in one canvas at one moment, for a capture script to turn into a film. World and effects
     only: the interface is HTML and is not part of a canvas. times: one number, or one per scene. */
  var reel = null;
  function film(scenes, times, scale) {
    scale = scale || 0.5; var w = Math.round(W * scale), h = Math.round(H * scale), gap = 6;
    if (!reel || reel.width !== scenes.length * (w + gap) - gap || reel.height !== h) reel = blank(scenes.length * (w + gap) - gap, h);
    var full = film.full || (film.full = new Stage(blank(W, H))), x = reel.getContext("2d");
    x.fillStyle = "#181A20"; x.fillRect(0, 0, reel.width, reel.height); x.imageSmoothingQuality = "high";
    scenes.forEach(function (sc, i) { full.render(sc, typeof times === "number" ? times : times[i]); x.drawImage(full.canvas, i * (w + gap), 0, w, h); });
    return reel;
  }

  function state() { var q = {}; location.hash.replace(/^#/, "").split("&").forEach(function (kv) { var p = kv.split("="); if (p[0]) q[p[0]] = p[1] === undefined ? "1" : decodeURIComponent(p[1]); }); return q; }
  /* wire a group of radio buttons; returns the current value */
  function radios(name, fn, initial) {
    var all = Array.prototype.slice.call(document.querySelectorAll('input[name="' + name + '"]'));
    all.forEach(function (r) { if (initial !== undefined) r.checked = r.value === initial; r.addEventListener("change", function () { if (r.checked) fn(r.value); }); });
    var on = all.filter(function (r) { return r.checked; })[0]; return on ? on.value : undefined;
  }

  window.MAPFX = { W: W, H: H, F: F, SUN: SUN, camera: camera, rnd: rnd, clamp: clamp, ease: ease, rgb: rgb, rgba: rgba, mix: mix, image: image, ok: ok, blank: blank,
    soft: soft, hot: hot, star: star, puff: puff, columnTex: columnTex, Stage: Stage, Player: Player, players: players, clock: clock, start: start, phone: phone, film: film, state: state, radios: radios };
})();
