'use strict';
// Draws the workshop from window.MG (data.js, written by tools/build_bundle.py). Letters on the Stonefield-group sheets sit
// at the top left of each quadrant (the sheets are drawn as a two-by-two grid); letters on the map tiles sit at the measured
// points in tools/markers.json (390x844 interface points).
(function () {
  const D = window.MG;
  const QUAD = { A: [5, 8], B: [55, 8], C: [5, 58], D: [55, 58] };   // top-left of each quadrant, clear of the drawing
  const tile = (src, cap, chips) => `<figure class="tile"><figcaption>${cap}</figcaption><div class="frame"><img src="${src}" alt="${cap}">${chips || ''}</div></figure>`;

  const stone = `<section class="group" id="stone"><h2>Stone</h2><p class="rule">Every biome. Large in Stonefield, small elsewhere.</p>` +
    D.stone.map(c => `<article class="concept" id="stone-${c.id}"><h3>${c.name}</h3>` +
      (c.sheet ? `<figure class="sheet"><img src="${c.sheet}" alt="${c.name}: Stonefield, Meadow, Snow"></figure>` : '') +
      `<div class="tiles">${c.stonefield ? tile(c.stonefield, 'Stonefield') : ''}${c.meadow ? tile(c.meadow, 'Meadow') : ''}</div>` +
      `<p class="build"><span class="tris">${c.tris} tris</span><span>${c.build}</span></p></article>`).join('') + `</section>`;

  const groups = D.groups.map(g => {
    const sheetChips = g.concepts.map(c => `<span class="chip" style="left:${QUAD[c.letter][0]}%;top:${QUAD[c.letter][1]}%">${c.letter}</span>`).join('');
    const mapChips = g.concepts.filter(c => c.at).map(c => `<span class="chip" style="left:${c.at[0]}px;top:${c.at[1]}px">${c.letter}</span>`).join('');
    return `<section class="group" id="${g.id}"><h2>${g.name}</h2><div class="gwrap"><div>` +
      (g.sheet ? `<figure class="sheet"><img src="${g.sheet}" alt="${g.name} concepts">${sheetChips}</figure>` : '') +
      `<ol class="letters">${g.concepts.map(c => `<li><b>${c.letter}</b><span class="t">${c.build}</span><span class="tris">${c.tris} tris</span></li>`).join('')}</ol></div>` +
      (g.map ? tile(g.map, 'Stonefield, zoomed in', mapChips) : '') + `</div></section>`;
  }).join('');

  const alt = `<section class="group" id="alternate"><h2>Stone alternate</h2><p class="rule">Rock mound in Stonefield, boulder cluster elsewhere.</p>` +
    `<div class="tiles">${tile(D.alternate.stonefield, 'Stonefield')}${tile(D.alternate.meadow, 'Meadow')}</div></section>`;
  const round2 = D.round2.map(r => `<section class="group r2" id="r2-${r.id}"><h2>${r.title}</h2><div class="gwrap"><div>` +
    r.sheets.map(src => `<figure class="sheet"><img src="${src}" alt="${r.title}"></figure>`).join('') + `</div>` +
    r.tiles.map(src => tile(src, 'Stonefield')).join('') + `</div></section>`).join('');
  document.getElementById('main').innerHTML = `<h2 class="round">Round two</h2>` + round2 + alt + `<h2 class="round">Round one</h2>` + stone + groups;
  document.getElementById('nav').innerHTML = D.round2.map(r => ['r2-' + r.id, r.title]).concat([['alternate', 'Stone alternate'], ['stone', 'Stone']]).concat(D.groups.map(g => [g.id, g.name]))
    .map(([id, n]) => `<a href="#${id}">${n}</a>`).join('');
})();
