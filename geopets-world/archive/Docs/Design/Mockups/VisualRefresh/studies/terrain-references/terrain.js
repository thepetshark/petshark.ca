/* Terrain references: builds the rows from one list, so the page, the README and tools/terrain_refs.py name the same
   files. A pair is three phones: the game's first trial, the target, and the two wiped over each other. The relief row
   is one capture and three strengths of the same relief, with a wipe whose target can be switched. */
(function () {
  "use strict";
  var PAIRS = [
    ["lake-bank", "lake-bank-48.png", "Inland lake, bank", "One pale stone course and a foam line along the whole shore, a little lower than a sea bank."],
    ["lake-beach", "lake-beach-48.png", "Inland lake, beach", "An edit of the image above: only the shore band changes. Sand widest in the hollows, pinching out at the point, with a low rise behind it."],
    ["coast-beach", "coast-beach-48.png", "Sea coast, beach", "Seen across open water, foam, sand and rise must each still be readable. The sand varies in width along the coast."],
    ["coast-bank", "coast-bank-48.png", "Sea coast, bank", "An edit of the image above: the sand removed, a sea bank a full road-width tall."],
    ["stone-rise-near", "angles-near.png", "Stonefield, close camera", "From here the skyline matters: a bumpy line of low ridges, nothing flat. The road keeps its route and goes up and over the rock; nothing is cut for it."],
    ["far-plan", "angles-far.png", "Stonefield, highest camera", "No outline shows from here, so the relief reads through light alone: every ridge a line where a lit facet meets a shaded one. A pale bank line along the river."],
    ["stone-shore", "angles-orbit.png", "Stonefield meeting water", "Rock slopes coming down to a low rough bank, greyer than a meadow bank, the ridges rising behind it."]
  ];
  var LEVELS = { game: "river-bank-48.png", targets: [
    ["relief-low", "Low", "The same ridges pressed to about half: rumpled, gently rolling rock. Still never flat."],
    ["relief-mid", "Middle", "Ridges, knolls and saddles about three road-widths tall. The roads keep their routes and climb and dip over the rock."],
    ["relief-high", "High", "Nearly twice the middle: real small hills of rock with longer shaded faces. Still no cliffs. In the game, hills this tall would hide stretches of road, and whatever stands on them, from the camera; the picture does not show that."]
  ] };
  var DETAILS = [
    ["bank-close", "How a bank is built", "Lowest camera. One course of big faceted blocks, the grass lapping over its top edge, a foam line, the water deepening away."],
    ["beach-close", "Beach and bank in one view", "The same shore with a beach: water, foam, sand shelf, low rise, grass. The sand pinches out at a headland, where the shore is a bank again."],
    ["road-over-ridges", "A road over the ridges", "Lowest camera, the rock in profile. The road leaves the meadow, climbs the rock as steeply as the rock beside it, and carries on over the ridges. Nothing is cut or flattened for it."],
    ["roads-onto-rock", "Two roads onto the rock", "Default camera. The rock rises out of the meadow as the foot of its slopes, with no wall; the junction lies on a saddle between two knolls."],
    ["stone-ponds", "Small ponds in the rock", "Each lies in a slight hollow between the humps, the water almost level with the rock round it: a place where water would settle."],
    ["boulders-plan", "Boulders against roads, in plan", "Every whole boulder a road-width clear of every road. Drawn before the Stonefield relief was settled, so its ground is flat: use it for the spacing only."],
    ["road-surface", "The road surface", "Straight down. A paler worn middle, darker shoulders, a soft ragged edge, the dirt lying over the rock. Use it for the surface only."]
  ];
  var SHEETS = [];

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  function img(src, alt, cls) {
    var i = el("img", cls); i.alt = alt; i.width = 390; i.height = 844; i.decoding = "async";
    i.addEventListener("error", function () { if (i.parentNode) i.parentNode.classList.add("tr-missing"); });
    i.src = src;
    return i;
  }
  function phone(src, alt) { var p = el("div", "tr-phone"); p.appendChild(img(src, alt)); return p; }
  function figure(node, title, text, file) {
    var f = el("figure"); f.appendChild(node);
    f.appendChild(el("figcaption", "", "<b>" + title + "</b>" + (text || "")));
    return f;
  }
  // a wipe between the game's capture and a target; returns the figure and a way to change the target
  function wipe(game, target, label) {
    var f = el("figure"), w = el("div", "tr-phone tr-wipe"), swapped = false;
    var under = img(game, "", ""), top = img(target, "", "top");
    w.appendChild(under); w.appendChild(top); w.appendChild(el("i", "cut"));
    var tl = el("span", "tag l", "game"), tr = el("span", "tag r", "target"); w.appendChild(tl); w.appendChild(tr);
    f.appendChild(w);
    var controls = el("div", "st-controls");
    var range = el("input"); range.type = "range"; range.min = 0; range.max = 100; range.value = 50;
    range.setAttribute("aria-label", "Wipe between the game and the target: " + label);
    var swap = el("button", "st-btn", "Swap"); swap.type = "button"; swap.setAttribute("aria-pressed", "false");
    controls.appendChild(range); controls.appendChild(swap); f.appendChild(controls);
    function show() {
      under.src = swapped ? target : game; top.src = swapped ? game : target;
      tl.textContent = swapped ? "target" : "game"; tr.textContent = swapped ? "game" : "target";
    }
    range.addEventListener("input", function () { w.style.setProperty("--at", range.value + "%"); });
    swap.addEventListener("click", function () { swapped = !swapped; swap.setAttribute("aria-pressed", String(swapped)); show(); });
    return { figure: f, controls: controls, set: function (t) { target = t; show(); } };
  }

  var pairs = document.getElementById("tr-pairs");
  PAIRS.forEach(function (row) {
    var name = row[0], game = "source/game/" + row[1], target = "targets/390/" + name + ".jpg";
    var wrap = el("div", "tr-pair"); wrap.dataset.name = name;
    wrap.appendChild(figure(phone(game, "The game, first trial: " + row[1]), "The game, first trial", "", row[1]));
    var pb = phone(target, "Target: " + row[2]); pb.dataset.target = name;
    wrap.appendChild(figure(pb, "Target: " + row[2], row[3], "targets/" + name + ".jpg"));
    wrap.appendChild(wipe(game, target, row[2]).figure);
    pairs.appendChild(wrap);
  });

  var levels = document.getElementById("tr-levels"), lgame = "source/game/" + LEVELS.game;
  levels.dataset.name = "relief-levels";
  levels.appendChild(figure(phone(lgame, "The game, first trial: " + LEVELS.game), "The game, first trial", "", LEVELS.game));
  LEVELS.targets.forEach(function (row) {
    var p = phone("targets/390/" + row[0] + ".jpg", "Target: " + row[1] + " relief"); p.dataset.target = row[0];
    levels.appendChild(figure(p, row[1], row[2], "targets/" + row[0] + ".jpg"));
  });
  var lw = wipe(lgame, "targets/390/relief-mid.jpg", "Stonefield relief");
  var pick = el("span", "nm-seg tr-seg");
  LEVELS.targets.forEach(function (row) {
    var label = el("label"), radio = el("input"); radio.type = "radio"; radio.name = "relief"; radio.value = row[0]; radio.checked = row[0] === "relief-mid";
    radio.addEventListener("change", function () { lw.set("targets/390/" + row[0] + ".jpg"); });
    label.appendChild(radio); label.appendChild(document.createTextNode(row[1])); pick.appendChild(label);
  });
  lw.controls.appendChild(pick);
  levels.appendChild(lw.figure);

  var details = document.getElementById("tr-details");
  DETAILS.forEach(function (row) {
    var p = phone("targets/390/" + row[0] + ".jpg", row[1]); p.dataset.target = row[0];
    var f = figure(p, row[1], row[2], "targets/" + row[0] + ".jpg"); f.className = "tr-detail"; details.appendChild(f);
  });

  

  if (location.hash === "#capture") document.body.classList.add("capture");
  window.STUDY = { pairs: PAIRS.map(function (r) { return r[0]; }), levels: LEVELS.targets.map(function (r) { return r[0]; }), details: DETAILS.map(function (r) { return r[0]; }), sheets: SHEETS };
})();
