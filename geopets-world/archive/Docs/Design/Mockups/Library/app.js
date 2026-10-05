'use strict';
// The library mockup: one entry per species, library stars and a lore page, for critters and Wildlings.
(() => {
  const D = window.LIBRARY;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const INK = '#24483B';
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const PLACE = { meadow: 'Meadow', grove: 'Grove', stonefield: 'Stonefield', marsh: 'Marsh', snow: 'Snow', everywhere: 'every biome', 'any-water': 'any water', 'any-shore': 'any shore' };
  const DIET = { plant: 'Plant bait', sweet: 'Sweet bait', savory: 'Savory bait', fish: 'Fish bait' };
  const TIERS = Object.fromEntries(D.tiers.map(t => [t.tier, t.name]));
  const GRADE_COLOR = { Common: 'var(--g-common)', Uncommon: 'var(--g-uncommon)', Rare: 'var(--g-rare)', Legendary: 'var(--g-legendary)' };
  const DANCE = Object.fromEntries(D.dances.map(d => [d.id, d]));
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const when = iso => { const [, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]}`; };
  const list = xs => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

  const ICON = {
    star: on => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5L40 23L60 25L45 38L49 58L32 48L15 58L19 38L4 25L24 23Z" fill="${on ? '#E0B64E' : '#FFFDF6'}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/></svg>`,
    close: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 18L46 46M46 18L18 46" stroke="${INK}" stroke-width="7" stroke-linecap="round"/></svg>`,
    back: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M40 14L22 32L40 50" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    shared: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="22" cy="24" r="9" fill="#FFFDF6" stroke="${INK}" stroke-width="4"/><circle cx="42" cy="24" r="9" fill="#FFFDF6" stroke="${INK}" stroke-width="4"/><path d="M8 52C8 42 14 37 22 37C30 37 36 42 36 52M28 52C28 42 34 37 42 37C50 37 56 42 56 52" fill="#FFFDF6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg>`,
    lock: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="28" width="36" height="28" rx="6" fill="#FFFDF6" stroke="${INK}" stroke-width="4.5"/><path d="M22 28V20C22 13 27 9 32 9C37 9 42 13 42 20V28" fill="none" stroke="${INK}" stroke-width="4.5"/></svg>`,
  };
  const starsHtml = n => `<span class="stars" aria-label="${n} of 3 stars">${[0, 1, 2].map(i => ICON.star(i < n)).join('')}</span>`;
  const swatch = b => PLACE[b] && !b.startsWith('any') && b !== 'everywhere' ? `<span class="sw" style="--b:var(--b-${b})" aria-hidden="true"></span>` : '';
  const dropChip = drop => `<span class="chip">${window.LadderIcons.svg(drop)}${esc(drop.name)}</span>`;

  const critters = D.critters;
  const families = D.wildlings;
  const forms = families.flatMap(f => f.forms.map(x => ({ ...x, family: f })));
  const totalStars = critters.reduce((s, c) => s + c.stars, 0) + forms.reduce((s, x) => s + x.stars, 0);
  const next = D.house.find(h => h.level === D.houseLevel + 1);

  const S = { open: true, tab: 'critters', filter: 'all', view: 'grid', id: null, size: 'default' };
  const SIZES = { default: [412, 883, 'Galaxy S22 Ultra, 412 x 883'], short: [360, 640, 'Short phone, 360 x 640'], tall: [412, 915, 'Tall phone, 412 x 915'] };

  // ------------------------------------------------------------ grid
  function starCard() {
    const need = next ? next.stars : null;
    const pct = need ? Math.min(100, totalStars / need * 100) : 100;
    const text = !next ? 'Your house is at its top level.'
      : totalStars >= need ? `<strong>House level ${next.level}</strong> needs ${need} stars: you have enough.`
      : `<strong>House level ${next.level}</strong> needs ${need} stars: ${need - totalStars} more.`;
    return `<div class="starcard"><div class="big">${ICON.star(true)}<span>${totalStars}<small>stars</small></span></div><div><p>${text}</p><div class="bar"><i style="width:${pct.toFixed(0)}%"></i></div><p class="note" style="margin:0;font-size:12px">A star for a species' 1st, 10th and 50th catch.</p></div></div>`;
  }
  function critterTile(c) {
    const caught = c.catches > 0;
    return `<button type="button" class="tile${caught ? '' : ' missing'}" data-critter="${c.id}" style="--gc:var(--t${c.tier})">
      <span class="pic"><img class="token" src="assets/critters/${c.id}.png" alt=""></span>
      <strong>${caught ? esc(c.name) : '?'}</strong>
      ${caught ? `<span class="meta">${starsHtml(c.stars)}<span>x${c.catches}</span></span>` : `<span class="hint">${c.biomes.map(swatch).join('')}</span><span class="hint">${esc(c.biomes.map(b => PLACE[b]).join(', '))}</span>`}</button>`;
  }
  function formTile(x) {
    const caught = x.catches > 0;
    return `<button type="button" class="tile${caught ? '' : ' missing'}" data-form="${x.id}" style="--gc:${GRADE_COLOR[x.grade]}">
      <span class="grade" title="${x.grade}"></span>${x.pool === 'shared' ? `<span class="shared" title="Shared sighting">${ICON.shared()}</span>` : ''}
      <span class="pic"><img src="assets/wildlings/${x.id}.png" alt=""></span>
      <strong>${caught ? esc(x.name) : '?'}</strong>
      ${caught ? `<span class="meta">${starsHtml(x.stars)}<span>x${x.catches}</span></span>` : `<span class="hint"><span>${esc(x.grade)}</span></span>`}</button>`;
  }
  function grid() {
    const caughtC = critters.filter(c => c.catches).length, caughtW = forms.filter(x => x.catches).length;
    let chips, body;
    if (S.tab === 'critters') {
      chips = [['all', 'All', 'var(--ink)'], ...D.tiers.map(t => [String(t.tier), t.name, `var(--t${t.tier})`]), ['missing', 'Not caught yet', 'var(--muted)']];
      const shown = critters.filter(c => S.filter === 'all' || (S.filter === 'missing' ? !c.catches : String(c.tier) === S.filter));
      body = `<div class="grid">${shown.map(critterTile).join('')}</div>`;
    } else {
      chips = [['all', 'All', 'var(--ink)'], ...['Common', 'Uncommon', 'Rare', 'Legendary'].map(g => [g, g, GRADE_COLOR[g]]), ['missing', 'Not caught yet', 'var(--muted)']];
      const keep = x => S.filter === 'all' || (S.filter === 'missing' ? !x.catches : x.grade === S.filter);
      body = `<div class="grid">${families.map(f => {
        const fs = f.forms.filter(keep);
        if (!fs.length) return '';
        return `<div class="fam-label">${f.biomes.map(swatch).join('')}${esc(f.name)}${f.starter ? ' (starter)' : ''}</div>${fs.map(x => formTile({ ...x, family: f })).join('')}`;
      }).join('')}</div>`;
    }
    return `<div class="head"><span></span><div><h2>Library</h2><p class="sub">${caughtC + caughtW} of ${critters.length + forms.length} species caught</p></div><button type="button" class="round" id="close" aria-label="Close">${ICON.close()}</button></div>
      <div class="scroll" id="scroll">${starCard()}
      <div class="tabs" role="tablist"><button type="button" role="tab" data-tab="critters" aria-selected="${S.tab === 'critters'}">Critters<small>${caughtC}/${critters.length}</small></button><button type="button" role="tab" data-tab="wildlings" aria-selected="${S.tab === 'wildlings'}">Wildlings<small>${caughtW}/${forms.length}</small></button></div>
      <div class="chips-row">${chips.map(([v, label, c]) => `<button type="button" class="fchip" data-filter="${v}" aria-pressed="${S.filter === v}" style="--c:${c}">${esc(label)}</button>`).join('')}</div>
      ${body}</div>`;
  }

  // ------------------------------------------------------------ species pages
  function starLine(n, catches) {
    const nextT = D.starThresholds.find(t => catches < t);
    const text = catches === 0 ? 'Not caught yet' : nextT ? `${catches} caught. ${nextT - catches} more for the next star.` : `${catches} caught. All three stars.`;
    const prev = [0, ...D.starThresholds].filter(t => t <= catches).pop();
    const pct = nextT ? (catches - prev) / (nextT - prev) * 100 : 100;
    return `<div class="card"><div class="starline">${starsHtml(n)}<div style="flex:1"><p>${text}</p><div class="bar"><i style="width:${pct.toFixed(0)}%"></i></div></div></div></div>`;
  }
  function critterPage(c) {
    const caught = c.catches > 0;
    const tierChip = `<span class="chip fill" style="--c:var(--t${c.tier})">${TIERS[c.tier]}</span>`;
    const lore = caught
      ? `<div class="card lore"><p class="folk">Folk name: ${esc(c.folkName)}</p><p>${esc(c.lore)}</p></div>`
      : `<div class="card lore locked"><p class="folk">${ICON.lock().replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-3px;margin-right:4px"')}Its lore unlocks with your first catch.</p></div>`;
    const record = caught ? `<div class="card"><h4>Your record</h4><dl class="facts"><dt>Caught</dt><dd>${c.catches} times</dd><dt>Best level</dt><dd>${c.bestLevel}</dd><dt>First caught</dt><dd>${esc(c.firstPlace)}, ${when(c.firstDate)}</dd></dl></div>` : '';
    return `<div class="head page"><button type="button" class="round" id="back" aria-label="Back">${ICON.back()}</button><div></div><button type="button" class="round" id="close" aria-label="Close">${ICON.close()}</button></div>
      <div class="scroll" id="scroll"><div class="hero${caught ? '' : ' missing'}"><span class="disc"><img class="token" src="assets/critters/${c.id}.png" alt=""></span><div><h3>${caught ? esc(c.name) : 'Not caught yet'}</h3><div class="chips">${tierChip}<span class="chip">Critter</span></div></div></div>
      ${starLine(c.stars, c.catches)}${lore}
      <div class="card"><h4>${caught ? 'Where to find it' : 'Clues'}</h4><dl class="facts"><dt>Lives in</dt><dd>${c.biomes.map(b => `${swatch(b)}${PLACE[b]}`).join(' ')}</dd><dt>Habitat</dt><dd>${cap(c.habitat)}</dd><dt>Likes</dt><dd style="font-weight:400">${esc(c.likes)}</dd><dt>Bait</dt><dd>${DIET[c.diet]}</dd>${caught ? `<dt>Drop</dt><dd>${dropChip(c.drop)}</dd>` : ''}</dl></div>
      ${record}</div>`;
  }
  function formPage(x) {
    const f = x.family, caught = x.catches > 0;
    const dance = DANCE[f.dance], loves = DANCE[f.entrancedBy];
    const evo = f.forms.map((y, i) => `${i ? '<span class="arrow" aria-hidden="true">&rsaquo;</span>' : ''}<button type="button" class="f${y.id === x.id ? ' here' : ''}${y.catches ? '' : ' missing'}" data-form="${y.id}" style="border-style:solid"><img src="assets/wildlings/${y.id}.png" alt="">${y.catches ? esc(y.name) : '?'}</button>`).join('');
    const lore = caught ? `<div class="card lore"><p class="folk">${esc(f.name)}</p><p>${esc(f.lore)}</p></div>`
      : `<div class="card lore locked"><p class="folk">${ICON.lock().replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-3px;margin-right:4px"')}Its lore unlocks with your first catch.</p></div>`;
    const record = caught ? `<div class="card"><h4>Your record</h4><dl class="facts"><dt>Caught</dt><dd>${x.catches} ${x.catches === 1 ? 'time' : 'times'}, kept</dd><dt>Best level</dt><dd>${x.bestLevel}</dd><dt>First caught</dt><dd>${esc(x.firstPlace)}, ${when(x.firstDate)}</dd><dt>Variant skins</dt><dd style="font-weight:400">None found yet</dd></dl></div>` : '';
    return `<div class="head page"><button type="button" class="round" id="back" aria-label="Back">${ICON.back()}</button><div></div><button type="button" class="round" id="close" aria-label="Close">${ICON.close()}</button></div>
      <div class="scroll" id="scroll"><div class="hero${caught ? '' : ' missing'}"><span class="disc"><img src="assets/wildlings/${x.id}.png" alt=""></span><div><h3>${caught ? esc(x.name) : 'Not caught yet'}</h3>
        <div class="chips"><span class="chip fill" style="--c:${GRADE_COLOR[x.grade]}">${x.grade}</span><span class="chip">${x.pool === 'shared' ? `${ICON.shared()}Shared sighting` : 'Private sighting'}</span><span class="chip fill" style="--c:${dance.color}">${dance.name}</span><span class="chip">Loves ${loves.name}</span></div></div></div>
      <div class="card"><h4>${esc(f.name)} family</h4><div class="evo">${evo}</div></div>
      ${starLine(x.stars, x.catches)}${lore}
      <div class="card"><h4>${caught ? 'Where to find it' : 'Clues'}</h4><dl class="facts"><dt>Seen in</dt><dd>${f.biomes.map(b => `${swatch(b)}${PLACE[b]}`).join(' ')}</dd><dt>When</dt><dd>${f.times.length === 4 ? 'At any hour' : cap(list(f.times))}</dd><dt>Wild levels</dt><dd>${x.levels[0]} to ${x.levels[1]}</dd><dt>Dances</dt><dd>${dance.name}; entranced most by ${loves.name}</dd></dl></div>
      ${record}</div>`;
  }

  // ------------------------------------------------------------ render and wiring
  const CAPTION = {
    grid: { critters: 'The critters tab: caught species show their stars and catch count; the rest are silhouettes with a clue about where they live.', wildlings: 'The Wildlings tab: one row per family, first form to final. The diamond is the grade; the two figures mark shared sightings.' },
    critter: 'A critter\'s page: its stars, its folk name and lore, where to find it, and your own record.',
    form: 'A Wildling\'s page: grade, shared or private sighting, its dance, its family, and your record.',
  };
  function render() {
    const lib = $('#lib');
    lib.hidden = !S.open;
    if (S.open) {
      const keepScroll = S.view === 'grid' && $('#scroll') ? $('#scroll').scrollTop : 0;
      lib.innerHTML = S.view === 'grid' ? grid() : S.view === 'critter' ? critterPage(critters.find(c => c.id === S.id)) : formPage(forms.find(x => x.id === S.id));
      if (S.view === 'grid' && $('#scroll')) $('#scroll').scrollTop = keepScroll;
    }
    $('#caption').textContent = !S.open ? 'Closed: tap the book in the bar to open the library again.' : S.view === 'grid' ? CAPTION.grid[S.tab] : CAPTION[S.view];
    placeBookButton();
  }
  // today's navigation bar is part of the map capture; an invisible button sits over its book icon
  function placeBookButton() {
    let b = $('#book');
    if (!b) {
      b = document.createElement('button');
      b.id = 'book';
      b.type = 'button';
      b.setAttribute('aria-label', 'Library');
      b.style.cssText = 'position:absolute;z-index:4;width:52px;height:52px;border:0;background:transparent;border-radius:50%;padding:0';
      $('#screen').appendChild(b);
      b.addEventListener('click', () => { S.open = true; S.view = 'grid'; render(); });
    }
    const [W, H] = SIZES[S.size];
    const s = Math.max(W / 390, H / 844);
    const x = 127 * s - (390 * s - W) / 2, y = 776 * s - (844 * s - H);   // the capture is anchored to the bottom, like the game's bar
    b.style.left = `${(x - 26).toFixed(1)}px`;
    b.style.top = `${(y - 26).toFixed(1)}px`;
    // keep the panel clear of the navigation bar
    $('#screen').style.setProperty('--navgap', `${Math.max(96, H - (y - 44)).toFixed(0)}px`);
  }
  function setSize(key) {
    S.size = key;
    const [W, H] = SIZES[key];
    const p = $('#phone');
    p.style.setProperty('--w', `${W}px`);
    p.style.setProperty('--h', `${H}px`);
    p.style.setProperty('--status', key === 'short' ? '26px' : '32px');
    p.style.setProperty('--gesture', key === 'short' ? '20px' : '24px');
    render();
  }
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('#close')) { S.open = false; render(); return; }
    if (t.closest('#back')) { S.view = 'grid'; render(); return; }
    const tab = t.closest('[data-tab]');
    if (tab) { S.tab = tab.dataset.tab; S.filter = 'all'; render(); return; }
    const f = t.closest('[data-filter]');
    if (f) { S.filter = f.dataset.filter; render(); return; }
    const c = t.closest('[data-critter]');
    if (c) { S.view = 'critter'; S.id = c.dataset.critter; render(); return; }
    const x = t.closest('[data-form]');
    if (x) { S.view = 'form'; S.id = x.dataset.form; S.tab = 'wildlings'; render(); return; }
    if (t.classList.contains('bg') && S.open) { S.open = false; render(); }   // a tap outside the panel closes it
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.open) { if (S.view !== 'grid') S.view = 'grid'; else S.open = false; render(); } });

  const JUMPS = {
    'Critters': () => Object.assign(S, { open: true, view: 'grid', tab: 'critters', filter: 'all' }),
    'Rabbit': () => Object.assign(S, { open: true, view: 'critter', id: 'rabbit' }),
    'A critter not yet caught': () => Object.assign(S, { open: true, view: 'critter', id: 'bighorn' }),
    'Not caught yet': () => Object.assign(S, { open: true, view: 'grid', tab: 'critters', filter: 'missing' }),
    'Wildlings': () => Object.assign(S, { open: true, view: 'grid', tab: 'wildlings', filter: 'all' }),
    'Pebble Burrback': () => Object.assign(S, { open: true, view: 'form', id: 'burrback-1', tab: 'wildlings' }),
    'A Legendary not yet caught': () => Object.assign(S, { open: true, view: 'form', id: 'moonhowl-3', tab: 'wildlings' }),
    'Closed': () => Object.assign(S, { open: false }),
  };
  $('#jumps').innerHTML = Object.keys(JUMPS).map(k => `<button type="button" data-jump="${esc(k)}">${esc(k)}</button>`).join('');
  $('#jumps').addEventListener('click', e => { const b = e.target.closest('[data-jump]'); if (b) { JUMPS[b.dataset.jump](); render(); } });
  $('#opt-size').innerHTML = Object.entries(SIZES).map(([k, v]) => `<button type="button" role="radio" data-v="${k}" aria-checked="${k === S.size}">${v[2]}</button>`).join('');
  $('#opt-size').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; setSize(b.dataset.v); document.querySelectorAll('#opt-size button').forEach(x => x.setAttribute('aria-checked', x === b)); });

  window.LIBRARY_UI = { jump: name => { JUMPS[name](); render(); }, size: key => { setSize(key); document.querySelectorAll('#opt-size button').forEach(x => x.setAttribute('aria-checked', x.dataset.v === key)); }, state: () => ({ ...S }) };
  setSize('default');
  document.documentElement.dataset.ready = 'true';
})();
