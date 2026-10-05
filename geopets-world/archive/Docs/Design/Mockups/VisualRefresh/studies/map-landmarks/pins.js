/* The map's 2D pins as SVG, today's and the market's candidates, in the approved identity: Paper fill, Ink contour
   (3.2 on a 64 grid), the 31 symbols, flat. Today's pickup pin follows WorldPortraitMarker.cs (read 2026-09-22): a
   36-point circle rim in the role colour, a 31-point Paper well, a 13-point diamond tip under it. Sizes here are in
   points of the 390-point-wide interface; every pin returns { svg, w, h, tipX, tipY } so a page can stand its tip on
   the spot it marks. */
(function () {
  "use strict";
  var INK = "#24483B", PAPER = "#FAF4E5", CREAM = "#F1EAD8", GREEN = "#366950";
  var ENERGY = "#FFC429", WATER = "#21A6F2", MARKET = "#F07A4A", MARKET_DEEP = "#C9562C";
  var ICONS = "../../round1/grove/assets/icons/";

  function icon(name, x, y, s) { return '<image href="' + ICONS + name + '.svg" x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '"/>'; }
  function wrap(w, h, body) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + body + '</svg>'; }

  /* today's pickup pin: 36 across, the tip 7 below the circle */
  function pickup(kind, size) {
    var s = (size || 36) / 36, rim = kind === "water" ? WATER : ENERGY, w = 36 * s, h = 47 * s;
    var body = '<g transform="scale(' + s + ')">' +
      '<rect x="11.5" y="27.5" width="13" height="13" rx="2" transform="rotate(45 18 34)" fill="' + rim + '"/>' +
      '<circle cx="18" cy="18" r="17.2" fill="' + rim + '" stroke="' + INK + '" stroke-width="1.4"/>' +
      '<circle cx="18" cy="18" r="14" fill="' + PAPER + '"/>' + icon(kind, 7, 7, 22) + '</g>';
    return { svg: wrap(w, h, body), w: w, h: h, tipX: w / 2, tipY: h };
  }

  /* today's animal group pin: Paper rim, green well, a portrait (here the symbol), a count badge */
  function group(size, count) {
    var s = (size || 36) / 36, w = 44 * s, h = 47 * s;
    var body = '<g transform="scale(' + s + ')">' +
      '<rect x="11.5" y="27.5" width="13" height="13" rx="2" transform="rotate(45 18 34)" fill="' + PAPER + '"/>' +
      '<circle cx="18" cy="18" r="17.2" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.4"/><circle cx="18" cy="18" r="14" fill="#456A54"/>' + icon("egg", 9, 9, 18) +
      '<circle cx="34" cy="26" r="8" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.2"/><text x="34" y="29.6" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="10" fill="' + INK + '">' + (count || 3) + '</text></g>';
    return { svg: wrap(w, h, body), w: w, h: h, tipX: 18 * s, tipY: h };
  }

  /* ---- the market's candidates. k: how many times a pickup pin (36) the market's round is. ---------------------- */

  /* A. Awning crest: a big round whose top third is the stall's striped awning with a scalloped edge, the symbol beneath */
  function awning(k) {
    var R = 18 * k, w = 2 * R + 4, cx = w / 2, cy = R + 2, h = cy + R + 11 * k, sw = 1.4 * Math.max(1, k * 0.8), inner = R - 2.6 * k;
    var n = 6, top = cy - inner, band = inner * 0.62, i, stripes = "", scal = "";
    for (i = 0; i < n; i++) stripes += '<rect x="' + (cx - inner + 2 * inner * i / n) + '" y="' + top + '" width="' + (2 * inner / n + 0.5) + '" height="' + band + '" fill="' + (i % 2 ? PAPER : MARKET) + '"/>';
    for (i = 0; i < n; i++) scal += '<circle cx="' + (cx - inner + 2 * inner * (i + 0.5) / n) + '" cy="' + (top + band) + '" r="' + (inner / n) + '" fill="' + (i % 2 ? PAPER : MARKET) + '"/>';
    var body = '<defs><clipPath id="aw' + String(k).replace(".", "_") + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + inner + '"/></clipPath></defs>' +
      '<rect x="' + (cx - 6.5 * k) + '" y="' + (cy + R - 9 * k) + '" width="' + 13 * k + '" height="' + 13 * k + '" rx="' + 2 * k + '" transform="rotate(45 ' + cx + ' ' + (cy + R - 2.5 * k) + ')" fill="' + MARKET + '"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R - 0.6) + '" fill="' + MARKET + '" stroke="' + INK + '" stroke-width="' + sw + '"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + inner + '" fill="' + PAPER + '"/>' +
      '<g clip-path="url(#aw' + String(k).replace(".", "_") + ')">' + stripes + scal + '</g>' +
      icon("market", cx - 9 * k, cy - 1 * k, 18 * k);
    return { svg: wrap(w, h, body), w: w, h: h, tipX: cx, tipY: h };
  }

  /* B. Pennant: the round pin with a swallowtail flag flying from a short mast above it */
  function pennant(k) {
    var R = 18 * k, flagH = 20 * k, w = 2 * R + 26 * k, cx = R + 2, top = flagH + 4 * k, cy = top + R, h = cy + R + 11 * k, sw = 1.4 * Math.max(1, k * 0.8);
    var mast = '<rect x="' + (cx - 1.2 * k) + '" y="' + 2 + '" width="' + 2.4 * k + '" height="' + (top + 4 * k) + '" rx="' + 1.2 * k + '" fill="' + INK + '"/>';
    var fx = cx + 1.2 * k, fy = 3 * k, fw = 30 * k, fh = 14 * k;
    var flag = '<path d="M' + fx + ' ' + fy + ' h' + fw + ' l' + (-6 * k) + ' ' + fh / 2 + ' l' + 6 * k + ' ' + fh / 2 + ' h' + (-fw) + 'Z" fill="' + MARKET + '" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<path d="M' + fx + ' ' + (fy + fh * 0.5) + ' h' + (fw - 6 * k) + '" stroke="' + PAPER + '" stroke-width="' + 2.6 * k + '"/>';
    var body = mast + flag +
      '<rect x="' + (cx - 6.5 * k) + '" y="' + (cy + R - 9 * k) + '" width="' + 13 * k + '" height="' + 13 * k + '" rx="' + 2 * k + '" transform="rotate(45 ' + cx + ' ' + (cy + R - 2.5 * k) + ')" fill="' + MARKET + '"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R - 0.6) + '" fill="' + MARKET + '" stroke="' + INK + '" stroke-width="' + sw + '"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R - 2.6 * k) + '" fill="' + PAPER + '"/>' + icon("market", cx - 12 * k, cy - 12 * k, 24 * k);
    return { svg: wrap(w, h, body), w: w, h: h, tipX: cx, tipY: h };
  }

  /* C. Emblem: a rounded hexagon with a double rim, like a landmark's seal; a count chip only when given one (the owner, 2026-09-22: "no number badge") */
  function emblem(k, count) {
    var R = 19 * k, w = 2 * R + 14 * k, cx = R + 4, cy = R + 4, h = cy + R + 10 * k, sw = 1.4 * Math.max(1, k * 0.8);
    function hex(r) { var p = []; for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; p.push((cx + Math.cos(a) * r).toFixed(2) + " " + (cy + Math.sin(a) * r).toFixed(2)); } return "M" + p.join(" L") + "Z"; }
    var body = '<rect x="' + (cx - 6.5 * k) + '" y="' + (cy + R - 10 * k) + '" width="' + 13 * k + '" height="' + 13 * k + '" rx="' + 2 * k + '" transform="rotate(45 ' + cx + ' ' + (cy + R - 3.5 * k) + ')" fill="' + MARKET + '"/>' +
      '<path d="' + hex(R) + '" fill="' + MARKET + '" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
      '<path d="' + hex(R - 3.4 * k) + '" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="' + sw * 0.7 + '" stroke-linejoin="round"/>' +
      icon("market", cx - 12.5 * k, cy - 12.5 * k, 25 * k) + (!count ? "" :
      '<rect x="' + (cx + R - 6 * k) + '" y="' + (cy - R - 2 * k) + '" width="' + 16 * k + '" height="' + 12 * k + '" rx="' + 6 * k + '" fill="' + GREEN + '" stroke="' + INK + '" stroke-width="' + sw * 0.8 + '"/>' +
      '<text x="' + (cx + R + 2 * k) + '" y="' + (cy - R + 6.8 * k) + '" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="' + 8.4 * k + '" fill="' + PAPER + '">' + count + '</text>');
    return { svg: wrap(w, h, body), w: w, h: h, tipX: cx, tipY: h };
  }

  /* D. Shop sign: a small signboard under a striped awning, the symbol and the place's name, a tip under it */
  function sign(k, name) {
    var W = 68 * k, H = 28 * k, w = W + 4, x0 = 2, aw = 7 * k, y0 = 2 + aw, h = y0 + H + 9 * k, sw = 1.4 * Math.max(1, k * 0.8), cx = w / 2, n = 8, i, stripes = "", scal = "";
    for (i = 0; i < n; i++) stripes += '<rect x="' + (x0 + W * i / n) + '" y="2" width="' + (W / n + 0.4) + '" height="' + aw + '" fill="' + (i % 2 ? PAPER : MARKET) + '"/>';
    for (i = 0; i < n; i++) scal += '<circle cx="' + (x0 + W * (i + 0.5) / n) + '" cy="' + (2 + aw) + '" r="' + (W / n / 2) + '" fill="' + (i % 2 ? PAPER : MARKET) + '"/>';
    var lines = (name || "Market").split("|");
    var text = lines.map(function (t, j) { return '<text x="' + (x0 + 25 * k) + '" y="' + (y0 + (lines.length > 1 ? 13 : 17.5) * k + j * 9 * k) + '" font-family="Nunito, sans-serif" font-weight="800" font-size="' + 7.6 * k + '" fill="' + INK + '">' + t + '</text>'; }).join("");
    var body = '<defs><clipPath id="sg' + String(k).replace(".", "_") + '"><rect x="' + x0 + '" y="2" width="' + W + '" height="' + (aw + H) + '" rx="' + 7 * k + '"/></clipPath></defs>' +
      '<rect x="' + (cx - 5 * k) + '" y="' + (y0 + H - 8 * k) + '" width="' + 10 * k + '" height="' + 10 * k + '" rx="' + 1.6 * k + '" transform="rotate(45 ' + cx + ' ' + (y0 + H - 3 * k) + ')" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="' + sw * 0.8 + '"/>' +
      '<rect x="' + x0 + '" y="2" width="' + W + '" height="' + (aw + H) + '" rx="' + 7 * k + '" fill="' + PAPER + '"/>' +
      '<rect x="' + (cx - 5.6 * k) + '" y="' + (y0 + H - 3.2 * k) + '" width="' + 11.2 * k + '" height="' + 2.4 * k + '" fill="' + PAPER + '"/>' +
      '<g clip-path="url(#sg' + String(k).replace(".", "_") + ')">' + stripes + scal + '</g>' +
      '<rect x="' + x0 + '" y="2" width="' + W + '" height="' + (aw + H) + '" rx="' + 7 * k + '" fill="none" stroke="' + INK + '" stroke-width="' + sw + '"/>' +
      icon("market", x0 + 4 * k, y0 + 5 * k, 19 * k) + text;
    return { svg: wrap(w, h, body), w: w, h: h, tipX: cx, tipY: h };
  }

  window.PINS = { pickup: pickup, group: group, awning: awning, pennant: pennant, emblem: emblem, sign: sign,
    colours: { INK: INK, PAPER: PAPER, CREAM: CREAM, GREEN: GREEN, ENERGY: ENERGY, WATER: WATER, MARKET: MARKET } };
})();
