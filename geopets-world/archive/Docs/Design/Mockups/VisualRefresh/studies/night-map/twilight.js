/* Second round of the night-map study: nine levels between Blue hour and Moonlit
   in which the map keeps more of its own colour. Plates and numbers come from
   ../../tools/night_twilight.py (twilight-data.js); the phones are drawn with the
   same pieces as the first round (night.js). Markers are drawn plain, exactly as
   by day: in the game they are world-space canvases, which lighting does not touch. */
(function () {
  "use strict";
  var G = window.NIGHT_GEOMETRY, T = window.TWILIGHT, P = window.NIGHT_PARTS;
  var ZOOMS = ["default", "zoom-in", "zoom-out"];
  var GROUND = [["meadow", "Meadow"], ["olive", "Olive biome"], ["rock", "Rock"], ["road", "Roads"], ["sea", "Sea"]];
  var now = { cell: "d50-k60", objects: "in" };

  function src(kind, zoom) {   /* kind: a cell key, or "end-bluehour" / "end-moonlit" */
    return "assets/twilight/" + (kind.indexOf("end-") === 0 ? kind : "tw-" + kind) + "-" + zoom + "-" + now.objects + ".jpg";
  }

  function phone(node, zoom) {
    var g = G[zoom];
    node.classList.add("nm", "t-twilight");
    var plate = P.img("", "", "plate"); plate.setAttribute("data-zoom", zoom); node.appendChild(plate);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "world"); svg.setAttribute("viewBox", "0 0 390 844"); svg.setAttribute("aria-hidden", "true");
    ["range-glow", "range-night"].forEach(function (c) { var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", g.range.path); p.setAttribute("class", c); svg.appendChild(p); });
    node.appendChild(svg);
    g.markers.concat(P.far[zoom]).forEach(function (m) { var copy = {}; for (var key in m) copy[key] = m[key]; copy.far = false; node.appendChild(P.marker(copy)); });
    P.hud(node);
    return plate;
  }

  function mini(kind, label) {
    var wrap = P.el("div", "tw-mini"), ph = P.el("div", "phone");
    var plate = phone(ph, "default"); plate.setAttribute("data-kind", kind);
    wrap.appendChild(ph);
    if (label) { var cap = P.el("span", "tw-end"); cap.textContent = label; wrap.appendChild(cap); }
    return wrap;
  }

  function refresh() {
    Array.prototype.forEach.call(document.querySelectorAll(".tw-mini img.plate"), function (i) { i.src = src(i.getAttribute("data-kind"), "default"); });
    Array.prototype.forEach.call(document.querySelectorAll("#tw-chosen img.plate"), function (i) { i.src = src(now.cell, i.getAttribute("data-zoom")); });
    Array.prototype.forEach.call(document.querySelectorAll(".tw-cell"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-cell") === now.cell ? "true" : "false"); });
    var c = T.cells[now.cell], f = c["facts_" + now.objects];
    document.getElementById("tw-name").textContent = "Darkness " + Math.round(c.darkness * 100) + " in 100 of the way from Blue hour to Moonlit, with " + Math.round(c.colourKept * 100) + " in 100 of the map's own colour kept";
    var facts = document.getElementById("tw-facts"); facts.textContent = "";
    [["Roads", f.roads], ["Land", f.typical], ["Gap", f.gap], ["Far away", f.far], ["Marker to ground", f.marker.toFixed(1) + " to 1"]].forEach(function (r) {
      var dt = P.el("dt"), dd = P.el("dd"); dt.textContent = r[0]; dd.textContent = r[1]; facts.appendChild(dt); facts.appendChild(dd);
    });
    var sw = document.getElementById("tw-swatches"); sw.textContent = "";
    GROUND.concat([["fog", "Distance haze"]]).forEach(function (gr) {
      var hex = gr[0] === "fog" ? c.fog : c.palette[gr[0]], s = P.el("span"), i = P.el("i");
      i.style.background = hex; s.appendChild(i); s.appendChild(document.createTextNode(gr[1])); var code = P.el("code"); code.textContent = hex; s.appendChild(code); sw.appendChild(s);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var q = P.state();
    if (q.capture) document.body.classList.add("capture");
    if (q.cell && T.cells[q.cell]) now.cell = q.cell;
    if (q.objects === "out") now.objects = "out";

    var grid = document.getElementById("tw-grid");
    grid.appendChild(mini("end-bluehour", "Blue hour")).classList.add("tw-left");
    T.colourKept.forEach(function (k, row) {
      T.darkness.forEach(function (d, col) {
        var key = "d" + d + "-k" + k, b = P.el("button", "tw-cell");
        b.type = "button"; b.setAttribute("data-cell", key); b.style.gridRow = String(row + 2); b.style.gridColumn = String(col + 3);
        b.setAttribute("aria-label", "Darkness " + d + " in 100, colour kept " + k + " in 100");
        b.appendChild(mini(key));
        b.addEventListener("click", function () { now.cell = key; refresh(); });
        grid.appendChild(b);
      });
    });
    grid.appendChild(mini("end-moonlit", "Moonlit")).classList.add("tw-right");

    ZOOMS.forEach(function (z) { phone(document.getElementById("screen-tw-" + z), z); });

    Array.prototype.forEach.call(document.querySelectorAll('input[name="objects"]'), function (r) {
      if (r.value === now.objects) r.checked = true;
      r.addEventListener("change", function () { if (r.checked) { now.objects = r.value; refresh(); } });
    });
    refresh();
  });
})();
