/* Market, Energy and Water on the map: composites the candidate 3D objects (generated, cut out) into today's map,
   with today's pickup pins and the market pin candidates (pins.js) above them. Every choice is a page switch, so any
   combination can be seen on the two map pictures. Sizes are in map units, turned into pixels by each picture's own
   scale, which was measured on today's 17-unit market stall (WorldMapMarket.cs: marketObjectScale 6). */
(function () {
  "use strict";
  var P = window.PINS;

  /* per candidate: its sprite and its height in map units, from the generated row it was cut from (all of a row share
     one scale, so a well stays taller than a basin) */
  var OBJECTS = {
    energy: {
      today: { label: "Today: a yellow disk", disk: "energy" },
      a: { label: "A · Rune stone", src: "assets/energy-a.png" }, b: { label: "B · Crystals", src: "assets/energy-b.png" },
      c: { label: "C · Pinwheel", src: "assets/energy-c.png" }, d: { label: "D · Orb post", src: "assets/energy-d.png" } },
    water: {
      today: { label: "Today: a blue disk", disk: "water" },
      a: { label: "A · Spring basin", src: "assets/water-a.png" }, b: { label: "B · Hand pump", src: "assets/water-b.png" },
      c: { label: "C · Little well", src: "assets/water-c.png" }, d: { label: "D · Rain barrel", src: "assets/water-d.png" } },
    market: {
      a: { label: "A · Stall, refined", src: "assets/market-a.png" }, b: { label: "B · Tiny square", src: "assets/market-b.png" },
      c: { label: "C · Trader's cart", src: "assets/market-c.png" }, d: { label: "D · Pavilion", src: "assets/market-d.png" },
      e: { label: "E · Kiosk", src: "assets/market-e.png" } }
  };
  var SIZES = window.LANDMARK_SIZES || {};   /* written by tools/landmarks_assets.py: { "energy-a": {w, h, units}, ... } */

  /* the two pictures: where each thing stands (the point on the ground under it) and pixels per map unit there */
  var PLATES = {
    near: { src: "assets/plate-near.jpg", pin: 60, spots: {
      market: { x: 240, y: 288, ppu: 2.2 }, energy: { x: 196, y: 426, ppu: 2.6 }, water: { x: 300, y: 456, ppu: 2.7 } } },
    far: { src: "assets/plate-far.jpg", pin: 24, spots: {
      market: { x: 128, y: 330, ppu: 1.15 }, energy: { x: 190, y: 422, ppu: 1.25 }, water: { x: 232, y: 396, ppu: 1.22 } } }
  };
  /* opens on the owner's choice of 2026-09-22: the Orb post, the Spring, the Pavilion, the Emblem at 1.25 x, pins close */
  var view = { energy: "d", water: "a", market: "d", marker: "emblem", msize: "1.25", pins: "on", lift: "close" };
  /* how far a pin floats above the top of what it marks, in pin heights. The owner, 2026-09-22: "the 2D pins need to
     float a fair distance above the location on the map (or object on the map) for them to look good." */
  var LIFT = { close: 0.12, float: 0.9, high: 1.6 };

  function el(tag, cls, css) { var e = document.createElement(tag); if (cls) e.className = cls; if (css) e.style.cssText = css; return e; }

  function drawObject(layer, kind, spot) {
    var o = OBJECTS[kind][view[kind]], key = kind + "-" + view[kind], size = SIZES[key], top;
    if (o.disk) {                                          /* today's disk: 10.4 units across, 1.5 tall, flat and coloured */
      var dw = 10.4 * spot.ppu, dh = dw * 0.42, col = o.disk === "energy" ? "#FFC429" : "#21A6F2";
      layer.appendChild(el("i", "lm-disk", "left:" + (spot.x - dw / 2) + "px;top:" + (spot.y - dh / 2) + "px;width:" + dw + "px;height:" + dh + "px;background:" + col));
      return spot.y - dh / 2 - 1.5 * spot.ppu;
    }
    if (!size) return spot.y;
    var h = size.units * spot.ppu, w = h * size.w / size.h;
    var sh = el("i", "lm-shadow", "left:" + (spot.x - w * 0.45 + w * 0.12) + "px;top:" + (spot.y - w * 0.13) + "px;width:" + (w * 0.9) + "px;height:" + (w * 0.3) + "px");
    layer.appendChild(sh);
    var img = el("img", "lm-obj", "left:" + (spot.x - w / 2) + "px;top:" + (spot.y - h + h * (size.foot || 0)) + "px;width:" + w + "px;height:" + h + "px");
    img.src = o.src; img.alt = ""; layer.appendChild(img);
    top = spot.y - h + h * (size.foot || 0);
    return top;
  }

  function drawPin(layer, pin, x, bottom) {
    var d = el("div", "lm-pin", "left:" + (x - pin.tipX) + "px;top:" + (bottom - pin.tipY) + "px;width:" + pin.w + "px;height:" + pin.h + "px");
    d.innerHTML = pin.svg; layer.appendChild(d);
  }

  function render(phone) {
    var plate = PLATES[phone.getAttribute("data-plate")], layer = phone.querySelector(".lm-layer");
    layer.textContent = "";
    var tops = {};
    ["market", "energy", "water"].forEach(function (kind) { tops[kind] = drawObject(layer, kind, plate.spots[kind]); });
    var gap = plate.pin * LIFT[view.lift];
    if (view.pins === "on") ["water", "energy"].forEach(function (kind) { drawPin(layer, P.pickup(kind, plate.pin), plate.spots[kind].x, tops[kind] - gap); });
    if (view.marker !== "none") {
      var k = parseFloat(view.msize) * plate.pin / 36, m = plate.spots.market, pin;
      if (view.marker === "awning") pin = P.awning(k); else if (view.marker === "pennant") pin = P.pennant(k);
      else if (view.marker === "emblem") pin = P.emblem(k); else pin = P.sign(k, plate.pin > 40 ? "Test area|Market" : "");
      drawPin(layer, pin, m.x, tops.market - gap);
    }
  }

  function renderAll() { Array.prototype.forEach.call(document.querySelectorAll(".phone[data-plate]"), render); }

  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(document.querySelectorAll('.nm-bar input[type="radio"]'), function (r) {
      if (view[r.name] !== undefined) r.checked = r.value === view[r.name];
      r.addEventListener("change", function () { if (r.checked) { view[r.name] = r.value; renderAll(); } });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".phone[data-plate]"), function (p) {
      var plate = PLATES[p.getAttribute("data-plate")], img = el("img", "lm-plate"); img.src = plate.src; img.alt = ""; p.appendChild(img); p.appendChild(el("div", "lm-layer"));
    });
    renderAll();
    /* the market pins beside today's pins, at the three sizes */
    var board = document.getElementById("lm-board");
    if (board) [["Today: Energy", P.pickup("energy", 36)], ["Today: Water", P.pickup("water", 36)], ["Today: animal group", P.group(36, 3)],
      ["A · Awning crest", P.awning(1.5)], ["B · Pennant", P.pennant(1.5)], ["C · Emblem (chosen, no badge)", P.emblem(1.25)], ["D · Shop sign", P.sign(1.5, "Test area|Market")]].forEach(function (row) {
      var f = el("figure", "lm-pinfig"); f.innerHTML = row[1].svg + "<figcaption>" + row[0] + "</figcaption>"; board.appendChild(f);
    });
    var sizes = document.getElementById("lm-sizes");
    if (sizes) ["1.25", "1.5", "2"].forEach(function (s) {
      var f = el("figure", "lm-pinfig"); f.innerHTML = '<div class="pair">' + P.pickup("energy", 36).svg + P.pennant(parseFloat(s)).svg + "</div><figcaption>" + s + " × a pickup pin</figcaption>"; sizes.appendChild(f);
    });
    window.STUDY = { set: function (s) { Object.keys(s).forEach(function (k) { view[k] = s[k]; }); renderAll(); }, view: view };
  });
})();
