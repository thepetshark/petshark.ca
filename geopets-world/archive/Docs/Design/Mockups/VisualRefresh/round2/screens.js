/* Round two: one builder for every direction. It turns <div class="phone" data-screen="…"> into a screen made
   of the game's real content; each direction's stylesheet decides shape, colour, type and layout. Nothing here
   draws a shadow, a bevel or a gloss: the owner ruled those out for buttons, icons and windows.
   Plain script, no fetch, so the pages open straight from disk. */
(function () {
  "use strict";
  var G = window.GPW, S = window.R2_SYMBOLS, NG = window.NIGHT_GEOMETRY, C = window.R2_CONFIG;
  var CRE = "../../round1/shared/creatures/";
  var ITEM_SYMBOL = { softwood: "wood", blackberries: "blackberry", "berry-tonic": "care", "wooden-trap": "wooden-trap" };
  /* The plates are redrawn from the owner's 390x844 screenshots; on the 412x884 canvas they are fitted by width. */
  var SX = 412 / 390, SY = 1.0553, DY = -3.3;
  /* One illustrative group beyond the range line, low enough that a marker drawn above its anchor clears the wallet. */
  var FAR = { "default": [{ x: 250, y: 158, who: "cragcurl", count: 2, rarity: "uncommon" }], "zoom-in": [], "zoom-out": [{ x: 246, y: 152, who: "cragcurl", count: 2, rarity: "uncommon" }] };
  var PLAYER = { "default": [195.5, 426], "zoom-in": [196, 440], "zoom-out": [194.5, 424] };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function add(parent) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]); return parent; }
  function sym(name, label) {
    var s = el("span", "sym sym-" + name);
    s.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + S[name] + "</svg>";
    if (label) { s.setAttribute("role", "img"); s.setAttribute("aria-label", label); }
    return s;
  }
  function creature(slug, alt) { var i = el("img", "creature"); i.src = CRE + slug + ".png"; i.alt = alt || ""; return i; }
  function itemIcon(slug, title) {
    if (C.items === "sheet") { var i = el("img", "item-img"); i.src = "assets/items/" + slug + ".png"; i.alt = title; return i; }
    return sym(ITEM_SYMBOL[slug] || slug, title);
  }
  function at(node, x, y) { node.style.left = Math.round(x * SX * 10) / 10 + "px"; node.style.top = Math.round((y * SY + DY) * 10) / 10 + "px"; return node; }

  /* the device's own furniture: a punch-hole camera and the gesture bar. No control may sit under either. */
  function device(phone) { add(phone, el("i", "cutout"), el("i", "gesture")); }

  function wallet() {
    var w = el("div", "wallet");
    [["coin", "Coins", G.wallet.coins], ["water", "Water", G.wallet.water]].forEach(function (p) { add(w, add(el("div", "purse"), sym(p[0], p[1]), el("b", null, p[2]))); });
    return w;
  }
  function nav(other) {
    var n = el("nav", "nav");
    [["profile", "Profile", "big"], ["collection", "Collection", ""], ["inventory", "Inventory", ""], ["market", "My sales", ""], [other === "world" ? "world" : "home", other === "world" ? "World" : "Home", "big"]]
      .forEach(function (d) { add(n, add(el("div", "dest " + d[2]), sym(d[0], d[1]))); });
    return n;
  }

  function marker(m) {
    var d = at(el("div", "mk " + m.rarity), m.x, m.y);
    add(d, add(el("div", "face"), creature(m.who, "Wildling group")), el("i", "stem"), el("b", "count", m.count));
    return d;
  }

  function plate(phone) { var p = el("img", "plate"); p.src = phone.getAttribute("data-plate"); p.alt = ""; add(phone, p); }

  function map(phone, bare) {
    var zoom = phone.getAttribute("data-zoom") || "default", g = NG[zoom];
    plate(phone);
    var ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg"), grp = document.createElementNS(ns, "g");
    svg.setAttribute("class", "range"); svg.setAttribute("viewBox", "0 0 412 884"); svg.setAttribute("aria-hidden", "true");
    grp.setAttribute("transform", "translate(0 " + DY + ") scale(" + SX + " " + SY + ")");
    ["range-under", "range-line"].forEach(function (c) { var p = document.createElementNS(ns, "path"); p.setAttribute("d", g.range.path); p.setAttribute("class", c); p.setAttribute("vector-effect", "non-scaling-stroke"); grp.appendChild(p); });
    svg.appendChild(grp); add(phone, svg);
    g.objects.forEach(function (o) { if (o.kind === "energy" || o.kind === "water") add(phone, add(at(el("div", "pickup " + o.kind), o.x, o.y), sym(o.kind, o.kind === "energy" ? "Energy" : "Water"))); });
    add(phone, add(at(el("div", "player"), PLAYER[zoom][0], PLAYER[zoom][1]), sym("profile", "You")));
    g.markers.concat(FAR[zoom]).forEach(function (m) { add(phone, marker(m)); });
    if (bare) return;
    add(phone, wallet(),
      add(el("div", "side left"), add(el("div", "short"), sym("wooden-trap", "Traps"), el("b", "badge", "3"))),
      add(el("div", "side right"), add(el("div", "toggle on"), sym("worker", "Show workers")), add(el("div", "toggle on"), sym("wooden-trap", "Show traps"))),
      el("div", "attribution", "© Mapbox  © OpenStreetMap"), nav("home"));
  }

  function home(phone) {
    plate(phone);
    (C.home || []).forEach(function (b) {
      var n = el("div", "bubble " + b.state); n.style.left = b.x + "px"; n.style.top = b.y + "px";
      if (b.state === "working") add(n, itemIcon(b.item, b.title), add(el("span", "lines"), el("b", null, b.time), add(el("i", "meter"), el("u"))));
      else if (b.state === "locked") add(n, sym("lock", "Locked"), el("b", null, b.label));
      else add(n, sym(b.symbol, b.title), el("b", null, b.label));
      n.querySelector && b.progress && (n.querySelector("u").style.width = b.progress + "%");
      add(phone, n);
    });
    add(phone, wallet(), nav("world"));
  }

  function sheet(phone, title) {
    plate(phone); add(phone, el("div", "scrim"));
    var s = el("section", "sheet");
    add(s, add(el("header", "sheet-head"), el("h2", null, title), add(el("div", "close"), sym("close", "Close"))));
    add(phone, s, nav("home"));
    return s;
  }

  function collection(phone) {
    var s = sheet(phone, "Wildlings"), found = G.wildlings.filter(function (w) { return w.found; }).length;
    add(s, add(el("div", "progress"), el("span", "lead", found + " of " + G.wildlings.length + " found"), add(el("i", "meter"), el("u"))));
    s.querySelector(".progress u").style.width = Math.round(100 * found / G.wildlings.length) + "%";
    var chips = el("div", "chips");
    [["all", "All"]].concat(Object.keys(G.biomes).map(function (k) { return [k, G.biomes[k]]; })).forEach(function (b, i) { add(chips, add(el("span", "chip biome-" + b[0] + (i === 0 ? " on" : "")), el("i"), document.createTextNode(b[1]))); });
    add(s, chips);
    var grid = el("div", "grid wild");
    G.wildlings.slice(0, C.wildCount || 12).forEach(function (w) {
      var c = el("article", "card " + w.rarity + " biome-" + w.biome + (w.found ? "" : " missing"));
      add(c, add(el("div", "stage"), creature(w.slug, w.name)), el("h3", "name", w.found ? w.name : "Not found yet"),
        add(el("p", "meta"), el("span", "tier", w.rarity), el("span", "where", G.biomes[w.biome]), w.found ? el("span", "lvl", "Level " + w.level) : null));
      add(grid, c);
    });
    add(s, grid);
  }

  function inventory(phone) {
    var s = sheet(phone, "Inventory"), used = G.items.reduce(function (n, i) { return n + i.count; }, 0);
    add(s, add(el("div", "progress storage"), el("span", "lead", used + " of 120 stored"), add(el("i", "meter"), el("u")), el("span", "btn small", "Upgrade")));
    s.querySelector(".progress u").style.width = Math.round(100 * used / 120) + "%";
    var tabs = el("div", "tabs"); ["All", "Materials", "Products", "Tools"].forEach(function (t, i) { add(tabs, el("span", "tab" + (i === 0 ? " on" : ""), t)); }); add(s, tabs);
    var grid = el("div", "grid items");
    G.items.forEach(function (it) { add(grid, add(el("article", "tile kind-" + it.kind.toLowerCase()), add(el("div", "well"), itemIcon(it.slug, it.title)), el("h3", "name", it.title), el("span", "kind", it.kind), el("b", "count", it.count))); });
    add(s, grid);
  }

  function confirm(phone) {
    map(phone, true); add(phone, el("div", "scrim"));
    var h = G.copy.hire, m = el("section", "modal");
    add(m, add(el("div", "close"), sym("close", "Close")), el("h2", null, h.place),
      add(el("div", "facts"), add(el("div", "fact"), itemIcon("softwood", "Softwood"), el("b", null, h.yieldLine)), add(el("div", "fact"), sym("timer", "Time"), el("b", null, h.timeLine))),
      el("p", "prompt", h.prompt),
      add(el("div", "actions"), add(el("span", "btn"), document.createTextNode("Pay "), sym("coin", "coins"), el("b", null, h.coins), sym("water", "water"), el("b", null, h.water)), el("span", "btn quiet", "Not now")));
    add(phone, m, nav("home"));
  }

  var BUILD = { map: map, home: home, collection: collection, inventory: inventory, confirm: confirm };
  document.addEventListener("DOMContentLoaded", function () {
    if (location.hash.indexOf("capture") >= 0) document.body.classList.add("capture");
    Array.prototype.forEach.call(document.querySelectorAll(".phone[data-screen]"), function (p) {
      p.classList.add("p2", C.cls); BUILD[p.getAttribute("data-screen")](p); device(p);
    });
  });
})();
