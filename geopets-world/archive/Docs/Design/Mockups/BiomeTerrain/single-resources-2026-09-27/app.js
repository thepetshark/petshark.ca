'use strict';
// Draws the page from window.SINGLES (data.js, written by tools/build_bundle.py): the specimen shelf and the map tiles of each
// biome, with a pickup pin over every painted find. The pin follows `pickup` in VisualRefresh/studies/map-landmarks/pins.js,
// which follows WorldPortraitMarker.cs: a 36-point rim with a 1.4 ink contour, a 31-point Paper well, a diamond tip.
(function () {
  const INK = '#24483B', PAPER = '#FAF4E5';
  const RIMS = { a: '#6BB45A', b: PAPER };   // A: a Foraging family colour (a concept); B: Paper, like the animal-group pin
  const GAP = 2;   // the tip stands this many points above the top of the painted find
  const D = window.SINGLES;
  const state = { night: false, rim: 'a' };

  function pin(icon, rim, size) {
    const s = (size || 36) / 36, w = 36 * s, h = 47 * s;
    // the tip: the diamond's centre (y 34) plus half its 13-point diagonal
    return { w, h, tip: (34 + 13 * Math.SQRT1_2) * s, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><g transform="scale(${s})">` +
      `<rect x="11.5" y="27.5" width="13" height="13" rx="2" transform="rotate(45 18 34)" fill="${rim}"/>` +
      `<circle cx="18" cy="18" r="17.2" fill="${rim}" stroke="${INK}" stroke-width="1.4"/>` +
      `<circle cx="18" cy="18" r="14" fill="${PAPER}"/>` +
      `<image href="assets/icons/${icon}" x="7" y="7" width="22" height="22"/></g></svg>` };
  }

  const find = id => { for (const b of D.biomes) for (const s of b.singles) if (s.id === id) return s; return null; };

  function shelf(b) {
    return `<div class="shelf">` + b.singles.map(s => {
      const views = `<img class="prop" src="${s.crop}" alt="${s.name}">` + (s.cropNight ? `<img class="prop" src="${s.cropNight}" alt="${s.name} at night">` : '');
      const pins = ['a', 'b'].map(r => `<figure>${pin(s.icon, RIMS[r]).svg}<figcaption>${r.toUpperCase()}</figcaption></figure>`).join('');
      return `<article class="spec${s.cropNight ? ' fantasy' : ''}" data-id="${s.id}"><div class="views">${views}</div>` +
        `<h3>${s.name}${s.candidate ? '<span class="tag">Candidate</span>' : ''}</h3><div class="pins">${pins}</div></article>`;
    }).join('') + `</div>`;
  }

  function tile(t) {
    const pins = Object.entries(t.pins).map(([id, [x, y]]) => {
      const p = pin(find(id).icon, RIMS[state.rim]);
      return `<span class="pin" data-id="${id}" style="left:${(x - p.w / 2).toFixed(1)}px;top:${(y - p.tip - GAP).toFixed(1)}px">${p.svg}</span>`;
    }).join('');
    return `<figure class="tile" id="tile-${t.id}"><figcaption>${t.caption}</figcaption>` +
      `<div class="frame${t.night ? ' has-night' : ''}"><img class="map" src="${t.image}" alt="${t.caption}">` +
      (t.night ? `<img class="map night" src="${t.night}" alt="${t.caption} at night">` : '') + pins + `</div></figure>`;
  }

  function draw() {
    document.body.classList.toggle('night', state.night);
    document.getElementById('biomes').innerHTML = D.biomes.map(b =>
      `<section class="biome${b.singles.length > 4 ? ' wide' : ''}" id="${b.id}"><h2>${b.name}</h2><div class="body">${shelf(b)}<div class="tiles">${b.tiles.map(tile).join('')}</div></div></section>`).join('');
    document.querySelectorAll('[data-set]').forEach(el => {
      const [k, v] = el.dataset.set.split('=');
      el.setAttribute('aria-pressed', String(k === 'night' ? state.night === (v === '1') : state[k] === v));
    });
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-set]');
    if (!el) return;
    const [k, v] = el.dataset.set.split('=');
    state[k] = k === 'night' ? v === '1' : v;
    draw();
  });

  // #rim=b&night=1 sets the start state (the capture script uses it)
  const q = new URLSearchParams(location.hash.slice(1));
  if (q.get('rim') === 'b') state.rim = 'b';
  if (q.get('night') === '1') state.night = true;
  window.SINGLES_SET = (k, v) => { state[k] = v; draw(); };
  draw();
})();
