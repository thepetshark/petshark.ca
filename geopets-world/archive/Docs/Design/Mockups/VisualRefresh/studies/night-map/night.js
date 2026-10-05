/* Builds every phone of the night-map study from geometry.js (written by
   ../../tools/night_plates.py from the owner's three screenshots) and wires the
   page controls. Plain script, no fetch, so the page also works from disk. */
(function () {
  "use strict";
  var G = window.NIGHT_GEOMETRY;
  var ICONS = "../../round1/grove/assets/icons/";
  var CREATURES = "../../round1/shared/creatures/";
  var KIND_ICON = { stall: "market", bushes: "blackberry", trees: "wood", energy: "energy", water: "water" };
  var ZOOMS = ["default", "zoom-in", "zoom-out"];

  /* One illustrative Wildling group BEYOND the range line per zoom, to show how each treatment handles
     something the player can see but not yet reach. These are not in today's screenshots. */
  var FAR = {
    "default": [{ x: 286, y: 118, who: "cragcurl", count: 2, rarity: "common", far: true }],
    "zoom-in": [],
    "zoom-out": [{ x: 246, y: 108, who: "cragcurl", count: 2, rarity: "common", far: true }]
  };
  /* Where the ring that finds the player at night sits: on the ground at the capsule's foot. */
  var BEACON = { "default": { x: 196, y: 430, w: 34, h: 20 }, "zoom-in": { x: 199, y: 452, w: 70, h: 24 }, "zoom-out": { x: 194, y: 425, w: 24, h: 22 } };

  /* The painted plates follow the map closely but not to the pixel (Lanterns was recomposed), so things anchored
     to a painted object use that painting's own position: [x, top of the object] per kind, and where the player
     stands in the painted Lanterns pools. Estimated from the plates, checked in the captures. */
  var PAINTED = {
    "moonlit-default": { stall: [240, 236], bushes: [92, 287], trees: [380, 292] },
    "moonlit-zoom-in": { stall: [275, 198], bushes: [38, 257] },
    "moonlit-zoom-out": { stall: [227, 252], bushes: [133, 297], trees: [338, 302] },
    "reach-default": { stall: [240, 245], bushes: [94, 304], trees: [380, 302] },
    "reach-zoom-in": { stall: [274, 188], bushes: [36, 249] },
    "reach-zoom-out": { stall: [233, 275], bushes: [135, 325], trees: [344, 325] },
    "lanterns-default": { stall: [260, 245], bushes: [45, 314], trees: [322, 322], player: [4, -24] },
    "lanterns-zoom-in": { stall: [300, 225], bushes: [16, 294], player: [-8, -4] },
    "lanterns-zoom-out": { stall: [247, 248], bushes: [50, 329], trees: [355, 337], player: [5, -18] },
    "bluehour-default": { stall: [240, 250], bushes: [92, 308], trees: [380, 312] },
    "bluehour-zoom-in": { stall: [279, 186], bushes: [78, 239] },
    "bluehour-zoom-out": { stall: [236, 256], bushes: [108, 322], trees: [372, 334] }
  };

  function el(tag, cls, style) { var e = document.createElement(tag); if (cls) e.className = cls; if (style) e.setAttribute("style", style); return e; }
  function img(src, alt, cls) { var i = el("img", cls); i.src = src; i.alt = alt || ""; return i; }
  function px(n) { return Math.round(n * 10) / 10 + "px"; }

  function beyondReach(range, x, y) {
    if (range.type === "ellipse") { var dx = (x - range.cx) / range.rx, dy = (y - range.cy) / range.ry; return dx * dx + dy * dy > 1; }
    return y < range.a + range.b * x + range.c * x * x;
  }

  function marker(m) {
    var d = el("div", "mk " + m.rarity + (m.far ? " far" : ""), "left:" + px(m.x) + ";top:" + px(m.y));
    d.appendChild(el("div", "halo")); d.appendChild(el("div", "pool")); d.appendChild(el("div", "rim"));
    var face = el("div", "face"); face.appendChild(img(CREATURES + m.who + ".png", "Wildling group")); d.appendChild(face);
    d.appendChild(el("div", "stem"));
    var c = el("span", "count"); c.textContent = m.count; d.appendChild(c);
    return d;
  }

  function hud(phone) {
    function icon(name, alt) { return img(ICONS + name + ".svg", alt); }
    var top = el("div", "hud-top");
    [["coin", "Coins", "60"], ["water", "Water", "27"]].forEach(function (w) { var p = el("div", "wallet"); p.appendChild(icon(w[0], w[1])); var s = el("span"); s.textContent = w[2]; p.appendChild(s); top.appendChild(p); });
    var left = el("div", "hud-left"), box = el("div", "chipbox"); box.appendChild(icon("wooden-trap", "Traps")); left.appendChild(box);
    var right = el("div", "hud-right");
    [["worker", "Show workers"], ["wooden-trap", "Show traps"]].forEach(function (t) { var m = el("div", "mini"); m.appendChild(icon(t[0], t[1])); right.appendChild(m); });
    var att = el("div", "attribution"); att.textContent = "© Mapbox  © OpenStreetMap";
    var nav = el("div", "nav");
    [["profile", "Profile", "big"], ["collection", "Collection", "mid"], ["inventory", "Inventory", "mid"], ["market", "My Sales", "mid"], ["home", "Home", "big"]].forEach(function (n) { var d = el("div", "disc " + n[2]); d.appendChild(icon(n[0], n[1])); nav.appendChild(d); });
    [top, left, right, att, nav].forEach(function (n) { phone.appendChild(n); });
  }

  function build(phone) {
    var t = phone.getAttribute("data-treatment"), zoom = phone.getAttribute("data-zoom"), g = G[zoom];
    phone.classList.add("nm", "t-" + t);
    phone.appendChild(img("assets/plates/day-" + zoom + ".jpg", "", "plate day"));
    var night = img("", "", "plate night"); night.setAttribute("data-night", t + "-" + zoom); phone.appendChild(night);

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "world"); svg.setAttribute("viewBox", "0 0 390 844"); svg.setAttribute("aria-hidden", "true");
    ["range-day", "range-glow", "range-night"].forEach(function (c) { var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", g.range.path); p.setAttribute("class", c); svg.appendChild(p); });
    phone.appendChild(svg);

    /* things the painted plates do not contain (the painter was told to remove them): the player, pickups and the tiny Wildlings */
    var sprites = el("div", "static sprites");
    g.objects.forEach(function (o) {
      if (!o.sprite) return;
      var s = img("assets/sprites/" + o.sprite.file, "", "plate-sprite");
      s.setAttribute("style", "position:absolute;left:" + o.sprite.x + "px;top:" + o.sprite.y + "px;width:" + o.sprite.w + "px;height:" + o.sprite.h + "px");
      sprites.appendChild(s);
    });
    phone.appendChild(sprites);

    g.objects.forEach(function (o) {
      if (o.kind === "energy" || o.kind === "water") phone.appendChild(el("div", "glow pickup " + o.kind, "left:" + px(o.x) + ";top:" + px(o.y) + ";width:58px;height:58px"));
    });
    var b = BEACON[zoom]; phone.appendChild(el("div", "beacon", "left:" + px(b.x) + ";top:" + px(b.y) + ";width:" + px(b.w) + ";height:" + px(b.h)));

    g.markers.concat(FAR[zoom]).forEach(function (m) { phone.appendChild(marker(m)); });

    g.objects.forEach(function (o) {
      var name = KIND_ICON[o.kind]; if (!name) return;
      var c = el("div", "chip" + (beyondReach(g.range, o.x, o.y) ? " far" : ""));
      c.setAttribute("data-kind", o.kind); c.setAttribute("data-x", o.x); c.setAttribute("data-top", o.y - o.ry);
      c.appendChild(img(ICONS + name + ".svg", o.kind)); phone.appendChild(c);
    });
    hud(phone);
  }

  function applyLayer(layer) {
    document.body.setAttribute("data-layer", layer);
    Array.prototype.forEach.call(document.querySelectorAll("img[data-night]"), function (i) {
      i.src = "assets/" + (layer === "painted" ? "painted/" : "plates/") + i.getAttribute("data-night") + ".jpg";
    });
    Array.prototype.forEach.call(document.querySelectorAll(".phone.nm"), function (p) {
      /* the painted Light-is-reach plates carry their own lit boundary; painted plates lack the small world objects */
      p.classList.toggle("painted-range", layer === "painted" && p.getAttribute("data-treatment") === "reach");
      var sprites = p.querySelector(".sprites"), key = p.getAttribute("data-treatment") + "-" + p.getAttribute("data-zoom");
      var own = layer === "painted" ? PAINTED[key] : {}, shift = own.player || [0, 0];
      sprites.style.opacity = layer === "painted" ? "var(--t)" : "0";
      /* the painted Lanterns plates put the player's pool of light a little off centre: stand the player in it */
      var pl = sprites.querySelector('img[src*="-player-"]'); if (pl) pl.style.transform = "translate(" + shift[0] + "px," + shift[1] + "px)";
      p.querySelector(".beacon").style.marginLeft = shift[0] + "px"; p.querySelector(".beacon").style.marginTop = shift[1] + "px";
      Array.prototype.forEach.call(p.querySelectorAll(".chip"), function (c) {
        var at = own[c.getAttribute("data-kind")];
        /* a chip is 30 px wide and centred on its anchor: keep it whole inside the phone, clear of the right-hand toggle pill */
        c.style.left = px(Math.max(22, Math.min(366, at ? at[0] : parseFloat(c.getAttribute("data-x")))));
        c.style.top = px((at ? at[1] : parseFloat(c.getAttribute("data-top"))) - 8);
      });
    });
  }

  function state() {
    var q = {}; (location.hash.replace(/^#/, "").split("&")).forEach(function (kv) { var p = kv.split("="); if (p[0]) q[p[0]] = p[1] === undefined ? "1" : p[1]; });
    return q;
  }

  function facts() {
    var F = window.NIGHT_FACTS, body = document.getElementById("facts-body"); if (!F || !body) return;
    function row(cls, cells) { var tr = el("tr", cls); cells.forEach(function (c) { var td = el("td"); td.textContent = c; tr.appendChild(td); }); body.appendChild(tr); }
    F.rows.forEach(function (r) { row("", [r.treatment, r.roads + (r.roads_lighter ? " (pale roads)" : ""), r.typical, r.gap, r.far, r.marker.toFixed(1) + " to 1"]); });
    row("", ["Geo Pets World by day", F.today.day.roads, F.today.day.typical, F.today.day.gap, F.today.day.far, F.today.day.marker.toFixed(1) + " to 1"]);
    row("bad", ["Geo Pets World tonight", F.today.tonight.roads, F.today.tonight.typical, 0, F.today.tonight.far, "not measured"]);
    row("ref", ["The reference, night", 16, "36, up to 60", "20 to 45", 20, "not measured"]);
  }

  /* twilight.js, the second-round page, builds its phones from the same pieces, so both pages draw one interface */
  window.NIGHT_PARTS = { el: el, img: img, px: px, marker: marker, hud: hud, state: state, far: FAR };

  document.addEventListener("DOMContentLoaded", function () {
    var time = document.getElementById("nm-time");
    if (!time) return;   /* not the round-one page: twilight.js does its own wiring */
    var q = state();
    facts();
    if (q.capture) document.body.classList.add("capture");
    Array.prototype.forEach.call(document.querySelectorAll(".phone[data-treatment]"), build);

    function setTime(v) { document.documentElement.style.setProperty("--t", String(v)); time.value = Math.round(v * 100); }
    time.addEventListener("input", function () { setTime(time.value / 100); });
    function radios(name, fn) { Array.prototype.forEach.call(document.querySelectorAll('input[name="' + name + '"]'), function (r) { r.addEventListener("change", function () { if (r.checked) fn(r.value); }); }); }
    function check(name, value) { var r = document.querySelector('input[name="' + name + '"][value="' + value + '"]'); if (r) r.checked = true; }
    radios("layer", applyLayer);
    radios("hud", function (v) { document.body.classList.toggle("glass", v === "glass"); });
    radios("chips", function (v) { document.body.classList.toggle("chips", v === "on"); });

    /* the address can set the state, so a capture script can reach every combination: #capture&layer=graded&hud=glass&chips=on&t=0.5 */
    var layer = q.layer === "graded" ? "graded" : "painted"; check("layer", layer); applyLayer(layer);
    if (q.hud === "glass") { check("hud", "glass"); document.body.classList.add("glass"); }
    if (q.chips === "on") { check("chips", "on"); document.body.classList.add("chips"); }
    setTime(q.t === undefined ? 1 : Math.max(0, Math.min(1, parseFloat(q.t))));
  });
})();
