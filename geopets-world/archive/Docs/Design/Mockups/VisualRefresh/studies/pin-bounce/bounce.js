/* The pin bounce when tapped. Three candidate shapes for the vertical "bounce" touch feedback, playing on the
   owner's real map at the three zooms, over today's flat interface (../night-map/night.js hud(), ../shared/study.css).
   Pins are drawn exactly as the game draws them (../map-landmarks/pins.js: the same SVG a WorldPortraitMarker or the
   market's Emblem would show), moved with plain CSS transforms - no canvas, no WebGL, because a bounce is only ever
   an extra screen-pixel offset and, for one shape, a local scale, both of which a transform does exactly.

   Every shape is a pure function of elapsed time since its tap (shape.offset(t), shape.squash(t)): no state is kept
   between frames, so window.STUDY.set({t}) can ask for any instant and a capture script gets the same pixels twice
   for the same t. Plain script, no modules, no fetch, so the page also opens from disk. */
(function () {
  "use strict";

  /* ---- small math, self-contained (no dependency on ../shared/mapfx.js: nothing here needs its camera) ---------- */
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
  function bell(x) { return Math.sin(Math.PI * clamp01(x)); }
  function outCubic(x) { x = clamp01(x); return 1 - Math.pow(1 - x, 3); }
  function inQuad(x) { x = clamp01(x); return x * x; }

  /* ---- the shapes. Every number below is the number printed on the page: change one place, both agree. The fourth is
     the owner's pick of 2026-09-23, "squash and hop and settle": shape 3 whole, then shape 2's settle. ---- */
  var SHAPES = [
    {
      key: "hop", name: "1 · Single hop",
      height: 12, duration: 0.36,
      summary: "The pin rises once and falls back to exactly where it stood. The plainest feedback: it only says “that tap landed.”",
      get total() { return this.duration; },
      get peakAt() { return this.duration / 2; },
      offset: function (t) { return (t < 0 || t > this.duration) ? 0 : this.height * Math.sin(Math.PI * t / this.duration); },
      squash: function () { return [1, 1]; },
      nums: function () { return "<b>" + this.height + " px</b> up, over <b>" + this.duration.toFixed(2) + " s</b>."; }
    },
    {
      key: "settle", name: "2 · Hop and settle",
      height: 13, duration: 0.30, settleHeight: 4, settleDuration: 0.16,
      summary: "The same hop, then a small second bounce about a third as high before it settles. Reads as a softer landing than the single hop.",
      get total() { return this.duration + this.settleDuration; },
      get peakAt() { return this.duration / 2; },
      offset: function (t) {
        if (t < 0) return 0;
        if (t <= this.duration) return this.height * Math.sin(Math.PI * t / this.duration);
        var u = t - this.duration;
        return u <= this.settleDuration ? this.settleHeight * Math.sin(Math.PI * u / this.settleDuration) : 0;
      },
      squash: function () { return [1, 1]; },
      nums: function () {
        return "<b>" + this.height + " px</b> up over <b>" + this.duration.toFixed(2) + " s</b>, then a <b>" + this.settleHeight + " px</b> settle over <b>" +
          this.settleDuration.toFixed(2) + " s</b> — " + Math.round(100 * this.settleHeight / this.height) + "% of the first hop. Total <b>" + this.total.toFixed(2) + " s</b>.";
      }
    },
    {
      key: "squash", name: "3 · Squash and hop",
      height: 14, squashDown: 0.07, recover: 0.06, hopDuration: 0.20, landSquash: 0.10,
      widthGain: 0.12, depthLoss: 0.10, landWidthGain: 0.06, landDepthLoss: 0.05,
      summary: "The pin squashes wider and shorter at the moment of the tap, hops, and lands with a smaller squash before it settles. The most “game-like” of the three; it reads as a bounce even in a single still.",
      get total() { return this.squashDown + this.hopDuration + this.landSquash; },
      get peakAt() { return this.squashDown + this.hopDuration / 2; },
      offset: function (t) {
        var u = t - this.squashDown;
        return (u < 0 || u > this.hopDuration) ? 0 : this.height * Math.sin(Math.PI * u / this.hopDuration);
      },
      squash: function (t) {
        if (t >= 0 && t <= this.squashDown) {
          var k = smooth(t / this.squashDown);
          return [1 + this.widthGain * k, 1 - this.depthLoss * k];
        }
        var u = t - this.squashDown;
        if (u >= 0 && u <= this.recover) {
          var k2 = 1 - smooth(u / this.recover);
          return [1 + this.widthGain * k2, 1 - this.depthLoss * k2];
        }
        var w = t - this.squashDown - this.hopDuration;
        if (w >= 0 && w <= this.landSquash) {
          var b = bell(w / this.landSquash);
          return [1 + this.landWidthGain * b, 1 - this.landDepthLoss * b];
        }
        return [1, 1];
      },
      nums: function () {
        return "Squash <b>" + Math.round(100 * this.widthGain) + "%</b> wider / <b>" + Math.round(100 * this.depthLoss) + "%</b> shorter on the tap (" +
          this.squashDown.toFixed(2) + " s), a <b>" + this.height + " px</b> hop (" + this.hopDuration.toFixed(2) + " s), then a <b>" +
          Math.round(100 * this.landWidthGain) + "%</b> / <b>" + Math.round(100 * this.landDepthLoss) + "%</b> landing squash (" + this.landSquash.toFixed(2) +
          " s). Total <b>" + this.total.toFixed(2) + " s</b>.";
      }
    },
    {
      key: "combo", name: "4 · Squash, hop and settle — the chosen shape",
      height: 14, squashDown: 0.07, recover: 0.06, hopDuration: 0.20, landSquash: 0.10, settleHeight: 4, settleDuration: 0.16,
      widthGain: 0.12, depthLoss: 0.10, landWidthGain: 0.06, landDepthLoss: 0.05,
      summary: "Shape 3 whole, then shape 2's small second bounce: it squashes on the tap, hops, lands with a smaller squash, bounces once more about a third as high, and rests.",
      get total() { return this.squashDown + this.hopDuration + this.landSquash + this.settleDuration; },
      get peakAt() { return this.squashDown + this.hopDuration / 2; },
      get settleAt() { return this.squashDown + this.hopDuration + this.landSquash; },
      offset: function (t) {
        var u = t - this.squashDown;
        if (u >= 0 && u <= this.hopDuration) return this.height * Math.sin(Math.PI * u / this.hopDuration);
        var s = t - this.settleAt;
        return (s >= 0 && s <= this.settleDuration) ? this.settleHeight * Math.sin(Math.PI * s / this.settleDuration) : 0;
      },
      squash: function (t) { return SHAPES[2].squash.call(this, t); },
      nums: function () {
        return "Squash <b>" + Math.round(100 * this.widthGain) + "%</b> wider / <b>" + Math.round(100 * this.depthLoss) + "%</b> shorter on the tap (" +
          this.squashDown.toFixed(2) + " s), a <b>" + this.height + " px</b> hop (" + this.hopDuration.toFixed(2) + " s), a <b>" +
          Math.round(100 * this.landWidthGain) + "%</b> / <b>" + Math.round(100 * this.landDepthLoss) + "%</b> landing squash (" + this.landSquash.toFixed(2) +
          " s), then a <b>" + this.settleHeight + " px</b> settle (" + this.settleDuration.toFixed(2) + " s). Total <b>" + this.total.toFixed(2) + " s</b>.";
      }
    }
  ];

  var TAP_INTERVAL = 2.0;         // a tap lands on the next pin this often - shared by every shape and every zoom
  var RING_DURATION = 0.4;        // the tap ring's own lifetime, the same for all three shapes

  var ZOOMS = [
    { key: "zoom-in", label: "Fully zoomed in" },
    { key: "default", label: "Default" },
    { key: "zoom-out", label: "Fully zoomed out" }
  ];

  /* Where the four pins stand on each of the owner's plates (studies/shared/plates/day-<zoom>-clear.jpg), chosen by
     eye so each sits in the open, clear of the market stall, the trees and the bushes already in the photograph.
     Order matches the tap cycle named on the page: Energy, Water, the market, a Wildling group. */
  var PIN_SPOTS = {
    "zoom-in": [
      { kind: "energy", x: 95, y: 460 },
      { kind: "water", x: 310, y: 490 },
      { kind: "market", x: 300, y: 266 },
      { kind: "group", x: 55, y: 618, count: 3 }
    ],
    "default": [
      { kind: "energy", x: 60, y: 400 },
      { kind: "water", x: 345, y: 618 },
      { kind: "market", x: 228, y: 270 },
      { kind: "group", x: 112, y: 558, count: 4 }
    ],
    "zoom-out": [
      { kind: "energy", x: 132, y: 250 },
      { kind: "water", x: 300, y: 460 },
      { kind: "market", x: 222, y: 275 },
      { kind: "group", x: 60, y: 600, count: 5 }
    ]
  };

  var PLATES = "../shared/plates/";
  var P = window.PINS, N = window.NIGHT_PARTS;

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function svgEl(tag, attrs) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function pinArt(spot) {
    if (spot.kind === "energy") return P.pickup("energy", 36);
    if (spot.kind === "water") return P.pickup("water", 36);
    if (spot.kind === "market") return P.emblem(1.25);
    return P.group(36, spot.count || 3);
  }

  /* ---- one phone: the plate, the pin layer, today's flat interface on top ---------------------------------------- */
  function buildPhone(zoomInfo) {
    var wrap = el("div", "phone nm fx");
    wrap.setAttribute("data-zoom", zoomInfo.key);

    var plate = el("img", "plate"); plate.alt = ""; plate.src = PLATES + "day-" + zoomInfo.key + "-clear.jpg";
    wrap.appendChild(plate);

    var layer = el("div", "bp-layer");
    wrap.appendChild(layer);

    var ui = el("div", "fx-ui");
    wrap.appendChild(ui);
    if (N && N.hud) N.hud(ui);

    var pins = PIN_SPOTS[zoomInfo.key].map(function (spot) {
      var art = pinArt(spot);
      var anchor = el("div", "bp-pin"); anchor.style.left = spot.x + "px"; anchor.style.top = spot.y + "px";
      anchor.setAttribute("data-kind", spot.kind);
      var lift = el("div", "bp-lift");
      lift.style.left = (-art.tipX) + "px"; lift.style.top = (-art.tipY) + "px";
      lift.style.width = art.w + "px"; lift.style.height = art.h + "px";
      var squash = el("div", "bp-squash"); squash.style.transformOrigin = (100 * art.tipX / art.w) + "% " + (100 * art.tipY / art.h) + "%";
      squash.innerHTML = art.svg;
      lift.appendChild(squash); anchor.appendChild(lift); layer.appendChild(anchor);

      var ring = el("div", "bp-ring"); ring.style.left = spot.x + "px"; ring.style.top = spot.y + "px";
      layer.appendChild(ring);

      return { spot: spot, lift: lift, squash: squash, ring: ring };
    });

    return { el: wrap, pins: pins };
  }

  /* ---- the close-up: the water pin at 4x, so the squash shape's squash shows even in a still -------------------- */
  function buildCloseup() {
    var card = el("div", "bp-close-card");
    var stage = el("div", "bp-close-stage");
    var art = P.pickup("water", 36);
    var magnify = el("div"); magnify.style.cssText = "position:absolute;left:0;top:0;transform:scale(4);transform-origin:0% 100%";
    var lift = el("div", "bp-lift");
    lift.style.left = (-art.tipX) + "px"; lift.style.top = (-art.tipY) + "px";
    lift.style.width = art.w + "px"; lift.style.height = art.h + "px";
    var squash = el("div", "bp-squash"); squash.style.transformOrigin = (100 * art.tipX / art.w) + "% " + (100 * art.tipY / art.h) + "%";
    squash.innerHTML = art.svg;
    lift.appendChild(squash); magnify.appendChild(lift); stage.appendChild(magnify); card.appendChild(stage);
    return { el: card, lift: lift, squash: squash };
  }

  /* ---- the timing strip: one shape's offset(t) plotted, with the numbers marked ------------------------------- */
  function buildStrip(shape) {
    var box = el("div", "bp-strip");
    var W = 1200, H = 150, mL = 44, mR = 18, mT = 14, mB = 30;
    var plotW = W - mL - mR, plotH = H - mT - mB;
    var tMin = -0.10, tMax = shape.total + 0.18;
    var maxH = shape.height * 1.18;
    function X(t) { return mL + (t - tMin) / (tMax - tMin) * plotW; }
    function Y(o) { return mT + plotH - clamp01(o / maxH) * plotH; }

    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" });
    svg.appendChild(svgEl("line", { class: "bp-rest", x1: X(tMin), x2: X(tMax), y1: Y(0), y2: Y(0) }));

    var d = "", steps = 220;
    for (var i = 0; i <= steps; i++) {
      var t = tMin + (tMax - tMin) * i / steps, o = shape.offset(t), x = X(t), y = Y(o);
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    }
    svg.appendChild(svgEl("path", { class: "bp-curve", d: d }));

    [0, shape.peakAt, shape.total].forEach(function (t, i) {
      var o = shape.offset(t);
      svg.appendChild(svgEl("line", { class: "bp-peak", x1: X(t), x2: X(t), y1: Y(0), y2: Y(Math.max(o, 0.001)) }));
      var txt = svgEl("text", { x: X(t) + (i === 2 ? -2 : 4), y: i === 1 ? Y(o) - 6 : H - 8, "text-anchor": i === 2 ? "end" : "start" });
      txt.textContent = i === 1 ? shape.height + " px" : (i === 0 ? "0 s" : shape.total.toFixed(2) + " s");
      svg.appendChild(txt);
    });

    var play = svgEl("line", { class: "bp-playhead", x1: X(0), x2: X(0), y1: mT, y2: H - mB, opacity: 0 });
    svg.appendChild(play);

    var axisLabel = svgEl("text", { class: "bp-label", x: mL, y: 11 }); axisLabel.textContent = "offset above rest, in pixels of a 390-wide screen (0 to " + Math.ceil(maxH) + ")";
    svg.appendChild(axisLabel);

    box.appendChild(svg);
    return { el: box, X: X, tMin: tMin, tMax: tMax, playhead: play };
  }

  /* ---- lay out the page: one row per shape, three phones, then its strip ---------------------------------------- */
  var root = document.getElementById("bp-shapes");
  var rows = SHAPES.map(function (shape) {
    var row = el("section", "bp-row");
    var h2 = el("h2"); h2.textContent = shape.name; row.appendChild(h2);
    var nums = el("p", "bp-nums"); nums.innerHTML = shape.nums(); row.appendChild(nums);
    var summary = el("p", "bp-summary"); summary.textContent = shape.summary; row.appendChild(summary);

    var rv = el("div", "rv-row");
    var phones = ZOOMS.map(function (z) {
      var bezel = el("div", "rv-bezel"); var phone = buildPhone(z); bezel.appendChild(phone.el);
      var item = el("div", "rv-item"); item.appendChild(bezel);
      var cap = el("p", "rv-cap"); cap.innerHTML = "<b>" + z.label + "</b>Energy, Water, the market and a Wildling group, one tap every " + TAP_INTERVAL.toFixed(0) + " s.";
      item.appendChild(cap); rv.appendChild(item);
      return phone;
    });
    row.appendChild(rv);

    var close = buildCloseup();
    var closeWrap = el("div", "bp-close");
    closeWrap.appendChild(close.el);
    var note = el("p", "bp-close-note"); note.innerHTML = "<b>The Water pin at 4×</b>, the same instant as the phones beside it — close enough to see the squash.";
    closeWrap.appendChild(note);
    row.appendChild(closeWrap);

    var strip = buildStrip(shape);
    row.appendChild(strip.el);

    root.appendChild(row);
    return { shape: shape, phones: phones, close: close, strip: strip };
  });

  /* ---- render one instant: every pin in every row, from PIN_SPOTS order, cycling every TAP_INTERVAL -------------- */
  function render(t) {
    var localT = ((t % TAP_INTERVAL) + TAP_INTERVAL) % TAP_INTERVAL;
    var active = Math.floor(t / TAP_INTERVAL);
    if (active < 0) active = ((active % 4) + 4) % 4; else active = active % 4;

    rows.forEach(function (row) {
      var shape = row.shape;
      row.phones.forEach(function (phone) {
        phone.pins.forEach(function (pin, idx) {
          var isActive = idx === active && localT <= shape.total + 0.001;
          var o = isActive ? shape.offset(localT) : 0;
          var sc = isActive ? shape.squash(localT) : [1, 1];
          pin.lift.style.transform = "translateY(" + (-o).toFixed(2) + "px)";
          pin.squash.style.transform = "scale(" + sc[0].toFixed(4) + "," + sc[1].toFixed(4) + ")";
          var rt = idx === active ? localT : -1;
          if (rt >= 0 && rt <= RING_DURATION) {
            var r = 6 + 20 * outCubic(rt / RING_DURATION), a = 0.55 * (1 - inQuad(rt / RING_DURATION));
            pin.ring.style.width = pin.ring.style.height = (2 * r).toFixed(1) + "px";
            pin.ring.style.marginLeft = pin.ring.style.marginTop = (-r).toFixed(1) + "px";
            pin.ring.style.opacity = a.toFixed(3);
          } else {
            pin.ring.style.opacity = 0;
          }
        });
      });
      var waterActive = active === 1 && localT <= shape.total + 0.001;
      var co = waterActive ? shape.offset(localT) : 0, cs = waterActive ? shape.squash(localT) : [1, 1];
      row.close.lift.style.transform = "translateY(" + (-co).toFixed(2) + "px)";
      row.close.squash.style.transform = "scale(" + cs[0].toFixed(4) + "," + cs[1].toFixed(4) + ")";
      var strip = row.strip, within = localT >= strip.tMin && localT <= strip.tMax;
      strip.playhead.setAttribute("x1", strip.X(localT)); strip.playhead.setAttribute("x2", strip.X(localT));
      strip.playhead.setAttribute("opacity", within ? 1 : 0);
    });
  }

  /* ---- the clock: pause and 0.25x slow motion, and #capture opens paused like every other study ------------------ */
  var clock = { t: 0, last: 0, paused: false, rate: 1 };
  function tick(now) {
    var dt = Math.min(0.1, (now - clock.last) / 1000); clock.last = now;
    if (!clock.paused) clock.t += dt * clock.rate;
    render(clock.t);
    requestAnimationFrame(tick);
  }

  function hashState() {
    var q = {}; location.hash.replace(/^#/, "").split("&").forEach(function (kv) { var p = kv.split("="); if (p[0]) q[p[0]] = p[1] === undefined ? "1" : decodeURIComponent(p[1]); });
    return q;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var q = hashState(), capture = !!q.capture;
    if (capture) document.body.classList.add("capture");

    var pause = document.getElementById("bp-pause");
    function setPaused(v) { clock.paused = v; pause.setAttribute("aria-pressed", v ? "true" : "false"); pause.textContent = v ? "Play" : "Pause"; }
    pause.addEventListener("click", function () { setPaused(!clock.paused); });
    setPaused(capture || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));

    Array.prototype.forEach.call(document.querySelectorAll('input[name="bp-rate"]'), function (r) {
      r.addEventListener("change", function () { if (r.checked) clock.rate = parseFloat(r.value); });
    });

    /* for the capture script: any instant, exactly. Nothing here reads pixels back, so the page also works from disk. */
    window.STUDY = {
      set: function (s) { if (s.t !== undefined) clock.t = s.t; if (s.paused !== undefined) setPaused(s.paused); if (s.rate !== undefined) clock.rate = s.rate; render(clock.t); },
      shapes: SHAPES, tapInterval: TAP_INTERVAL, ringDuration: RING_DURATION, pinOrder: ["energy", "water", "market", "group"]
    };

    render(0);
    clock.last = performance.now(); requestAnimationFrame(tick);
  });
})();
