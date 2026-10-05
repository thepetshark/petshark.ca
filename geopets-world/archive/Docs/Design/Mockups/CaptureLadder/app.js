'use strict';
(() => {
  const D = window.CAPTURE_LADDER;
  if (!D) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="error">The ladder data did not load. Keep data.js next to index.html.</p>');
    return;
  }
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PORTRAITS = new Set(window.CRITTER_PORTRAITS || []);
  const items = new Map(D.items.map(i => [i.id, i]));
  const recipeOf = new Map(D.recipes.map(r => [r.output.itemId, r]));
  const buildings = new Map(D.buildings.map(b => [b.id, b]));
  const critters = new Map(D.critters.map(c => [c.id, c]));
  const lines = new Map(D.lines.map(l => [l.id, l]));
  const tierName = t => (D.tiers.find(x => x.tier === t) || { name: 'Top' }).name;
  const PLACE = { meadow: 'Meadow', grove: 'Grove', stonefield: 'Stonefield', marsh: 'Marsh', snow: 'Snow', everywhere: 'every biome', 'any-water': 'any water', 'any-shore': 'any shore' };
  const EVERYWHERE = new Set(['everywhere', 'any-water', 'any-shore']);
  const HABITAT = { land: 'land', shore: 'shore', water: 'water', any: 'anywhere' };
  const DIET = { plant: 'plant bait', sweet: 'sweet bait', savory: 'savory bait', fish: 'fish bait' };
  const KIND = { material: 'World material', farm: 'Farm animal product', pickup: 'Map pickup', processed: 'Processed good', care: 'Care good', drop: 'Signature drop', rare: 'Rare drop', trap: 'Trap', bait: 'Bait', lasso: 'Lasso', charm: 'Charm' };
  const secs = s => s >= 60 ? `${Math.round(s / 6) / 10} min` : `${s} s`;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const list = (xs, last = 'and') => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${last} ${xs[xs.length - 1]}`;
  const places = (bs, last) => list(bs.map(b => PLACE[b] || b), last);
  const swatches = bs => bs.filter(b => !EVERYWHERE.has(b)).map(b => `<span class="sw" style="--b:var(--b-${b})" aria-hidden="true"></span>`).join('');

  const usedIn = new Map();
  const note = (id, v) => { if (!usedIn.has(id)) usedIn.set(id, []); usedIn.get(id).push(v); };
  D.recipes.forEach(r => r.inputs.forEach(i => note(i.itemId, { recipe: r.id })));
  D.buildings.forEach(b => {
    b.purchase.forEach(i => note(i.itemId, { building: b.id }));
    b.upgrades.forEach(u => u.inputs.forEach(i => note(i.itemId, { building: b.id, level: u.level })));
  });
  D.houseLevels.forEach(h => h.inputs.forEach(i => note(i.itemId, { house: h.level })));

  // The raw goods under a recipe, followed down through processed goods; the regional ones are those
  // not found in every biome, water or shore.
  const rawCache = new Map();
  const rawInputs = id => {
    if (!rawCache.has(id)) {
      const r = recipeOf.get(id);
      rawCache.set(id, r ? new Set(r.inputs.flatMap(i => [...rawInputs(i.itemId)])) : new Set([id]));
    }
    return rawCache.get(id);
  };
  const regional = id => [...rawInputs(id)].filter(x => !(items.get(x).biomes || []).some(b => EVERYWHERE.has(b)));

  // ------------------------------------------------------------ pieces
  const chip = (id, qty) => {
    const it = items.get(id);
    const drop = it.kind === 'drop' || it.kind === 'rare';
    const style = drop ? ` style="--c:var(--t${it.tier});--cs:var(--t${it.tier}s)"` : '';
    return `<button type="button" class="chip${drop ? ' drop' : ''}" data-item="${it.id}"${style}>${LadderIcons.svg(it)}${qty ? `<span class="q">${qty}</span>` : ''}<span class="nm">${esc(it.name)}</span></button>`;
  };
  const token = (c, size = '') => {
    const inner = PORTRAITS.has(c.id) ? `<img src="assets/critters/${c.id}.png" alt="">` : esc(c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase());
    return `<span class="token${PORTRAITS.has(c.id) ? ' has-img' : ''}${size ? ' ' + size : ''}" style="--c:var(--t${c.tier});--cs:var(--t${c.tier}s)" title="${esc(c.name)}">${inner}</span>`;
  };
  const gearTag = it => it.kind === 'trap' ? `${HABITAT[it.habitat]} trap` : it.kind === 'bait' ? DIET[it.diet] : it.kind === 'lasso' ? `lasso ${it.bracket}` : it.kind;
  const fromLine = id => {
    const goods = regional(id);
    if (!goods.length) return '<p class="from">Made anywhere: goods from every biome only.</p>';
    return `<p class="from">${goods.map(x => `${swatches(items.get(x).biomes)}${esc(items.get(x).name)} from ${esc(places(items.get(x).biomes, 'or'))}`).join('; ')}</p>`;
  };
  const recipeCard = rid => {
    const r = recipeOf.get(rid), it = items.get(rid), b = buildings.get(r.buildingId);
    const lvl = r.buildingLevel > 1 ? ` level ${r.buildingLevel}` : '';
    const tier = it.tier || 1;
    const ins = r.inputs.map(i => chip(i.itemId, i.quantity)).join('');
    const gear = ['trap', 'bait', 'lasso', 'charm'].includes(it.kind);
    return `<article class="recipe${it.status === 'live' ? ' live' : ''}" style="--c:var(--t${Math.min(tier, 6)})">
      <header>${LadderIcons.svg(it)}<strong>${esc(it.name)}</strong><span class="tag">${esc(gearTag(it))}</span></header>
      <p class="meta">${esc(b.name)}${lvl}, ${secs(r.seconds)}</p><div class="ins">${ins}</div>${gear ? fromLine(rid) : ''}</article>`;
  };

  // ------------------------------------------------------------ pyramid
  const pa = D.checks.pyramidAtDefaults;
  const perTier = pa.perTier;
  const defaults = D.pyramidDefaults;
  const fresh = () => ({ success: { ...defaults.successByTier }, y: defaults.dropsPerRelease, charm: false, habitat: false, out: defaults.trapsOutDefault });
  let state = fresh();
  function renderDials() {
    $('#success-dials').innerHTML = D.tiers.map(t => `<label class="dial" style="--c:var(--t${t.tier})"><span>${t.name}</span><input type="range" min="0.1" max="0.95" step="0.05" data-tier="${t.tier}" aria-label="${t.name} trap success"><output data-out="${t.tier}"></output></label>`).join('');
    document.querySelectorAll('#success-dials input').forEach(inp => inp.addEventListener('input', () => { state.success[inp.dataset.tier] = +inp.value; renderPyramid(); }));
    $('#yield').addEventListener('input', e => { state.y = +e.target.value; renderPyramid(); });
    $('#charm').addEventListener('change', e => { state.charm = e.target.checked; renderPyramid(); });
    $('#habitat').addEventListener('change', e => { state.habitat = e.target.checked; renderPyramid(); });
    $('#traps-out').addEventListener('input', e => { state.out = +e.target.value; renderPyramid(); });
    $('#reset').addEventListener('click', () => { state = fresh(); syncDials(); renderPyramid(); });
    const caps = D.houseLevels.map(h => defaults.trapsOutByHouseLevel[h.level]);
    $('#traps-note').textContent = `The proposal allows ${caps[0]} traps out at house level 1, rising to ${caps[caps.length - 1]} at level ${D.houseLevels.length}.`;
    syncDials();
  }
  function syncDials() {
    document.querySelectorAll('#success-dials input').forEach(inp => { inp.value = state.success[inp.dataset.tier]; });
    $('#yield').value = state.y;
    $('#charm').checked = state.charm;
    $('#habitat').checked = state.habitat;
    $('#traps-out').value = state.out;
  }
  function renderPyramid() {
    // Where a critter likes to be multiplies the chance; a charm then adds points. Nothing is certain.
    const p = t => Math.min(0.98, state.success[t] * (state.habitat ? defaults.habitatBonus : 1) + (state.charm && t >= 2 ? defaults.charmBonus : 0));
    const ratio = t => perTier[t].dropsPerAttempt / (p(t) * state.y);
    const catches = { 5: 1 };
    for (let t = 4; t >= 1; t--) catches[t] = catches[t + 1] * ratio(t + 1);
    const maxLog = Math.log10(Math.max(10, catches[1]));
    const round = n => n < 10 ? n.toFixed(1).replace(/\.0$/, '') : Math.round(n).toLocaleString('en');
    const wait = m => m >= 60 ? `${m / 60} h` : `${m} min`;
    $('#pyr').innerHTML = [5, 4, 3, 2, 1].map(t => {
      const w = 22 + 78 * (Math.log10(catches[t]) / maxLog);
      const traps = catches[t] / p(t);
      return `<div class="step" style="--w:${w.toFixed(1)}%;--c:var(--t${t})"><div><div class="tn">${tierName(t)}</div><div class="sub">${Math.round(p(t) * 100)}% success, ${wait(defaults.trapMinutesByTier[t])} a trap</div></div><div class="n">${round(catches[t])}<small>from ${round(traps)} traps</small></div></div>`;
    }).join('');
    document.querySelectorAll('[data-out]').forEach(o => { o.textContent = `${Math.round(state.success[o.dataset.out] * 100)}%`; });
    $('#yield-out').textContent = state.y.toFixed(2).replace(/0$/, '');
    $('#traps-out-out').textContent = state.out;
    const trapHours = [1, 2, 3, 4, 5].reduce((sum, t) => sum + catches[t] / p(t) * defaults.trapMinutesByTier[t] / 60, 0);
    const elapsed = trapHours / state.out;
    const span = elapsed < 1 ? `${Math.max(1, Math.round(elapsed * 60))} minutes` : elapsed < 36 ? `${round(elapsed)} hours` : `${Math.round(elapsed / 24 * 10) / 10} days`;
    $('#readout').innerHTML = `With these numbers, one Legendary catch needs about <strong>${round(catches[1])} Common catches</strong> underneath it (${round(catches[1] / p(1))} Common traps). All the traps in that pyramid wait about <strong>${round(trapHours)} hours</strong> in total: <strong>${span}</strong> of trapping with ${state.out} traps out at once.`;
    // The same pyramid in raw goods and crafting time.
    const bill = new Map();
    let craft = 0;
    for (let t = 1; t <= 5; t++) {
      const attempts = catches[t] / p(t), per = pa.perAttempt[t];
      Object.entries(per.materials).forEach(([id, q]) => bill.set(id, (bill.get(id) || 0) + q * attempts));
      craft += per.craftSeconds * attempts;
    }
    const top = [...bill.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    $('#bill').innerHTML = `<p>Those traps and their bait take about <strong>${round(craft / 3600)} hours of crafting</strong> in one queue, and these raw goods, most of all:</p><div class="bill-chips">${top.map(([id, q]) => chip(id, Math.round(q).toLocaleString('en'))).join('')}</div>`;
    $('#how').textContent = `Every trap is baited, Common included. From Uncommon up, each trap and its bait together use about ${perTier[2].dropsPerAttempt} drops from the tier below. A trap that catches nothing keeps nothing. So each catch costs ${perTier[2].dropsPerAttempt} ÷ (success × drops per release) catches from the tier below, and the costs multiply down the pyramid. With many traps out, waiting stops being the limit: raw goods and crafting time are. Critter Stalls and charms flatten the pyramid; the game-shop trap buffs would too. Every number here is a placeholder.`;
  }

  // ------------------------------------------------------------ tiers
  let currentTier = 1;
  function renderTierPicker() {
    $('#tier-picker').innerHTML = D.tiers.map(t => `<button type="button" data-tier="${t.tier}" style="--c:var(--t${t.tier})" aria-pressed="${t.tier === currentTier}">${t.name}<small>${D.critters.filter(c => c.tier === t.tier).length} critters</small></button>`).join('');
    document.querySelectorAll('#tier-picker button').forEach(b => b.addEventListener('click', () => { currentTier = +b.dataset.tier; renderTiers(); setHash(`tiers/${currentTier}`); }));
  }
  function renderTiers() {
    renderTierPicker();
    const t = currentTier;
    const gear = D.recipes.filter(r => { const it = items.get(r.id); return ['trap', 'bait'].includes(it.kind) && it.tier === t; });
    $('#catch-note').textContent = t === 1 ? 'Common gear uses goods found in every biome, so anyone can start anywhere.' : `Made with ${tierName(t - 1)} drops, highlighted in ${tierName(t - 1)} colour. Each card says where its regional goods come from.`;
    $('#catch-with').innerHTML = gear.map(r => recipeCard(r.id)).join('');
    $('#farm').innerHTML = t === 1 ? '<h3>Farm animals, tapped on the map</h3>' + D.farmCritters.map(f => `<article class="critter">${token({ id: f.id, name: f.name, tier: 1 })}<div><h3>${esc(f.name)}</h3><p class="where">${swatches(f.biomes)}${esc(cap(places(f.biomes)))}. ${esc(f.note)}</p>${chip(f.gives)}</div></article>`).join('') : '';
    const here = D.critters.filter(c => c.tier === t);
    $('#critter-title').textContent = `${tierName(t)} critters`;
    $('#critter-list').innerHTML = here.map(c => `<article class="critter" style="--c:var(--t${c.tier})">${token(c)}<div><h3>${esc(c.name)}</h3><p class="where">${swatches(c.biomes)}${esc(cap(places(c.biomes)))}, on ${HABITAT[c.habitat]}. ${esc(c.likes.hint)}</p>
        <p class="lore">${esc(c.lore)} <span>Folk name: ${esc(c.folkName)}</span></p>
        <div class="badges"><span class="badge">${DIET[c.diet]}</span>${c.liveSpeciesId ? `<span class="badge" title="The live species this one would replace">was ${esc(c.liveSpeciesId)}</span>` : ''}</div>${chip(c.dropId)}</div></article>`).join('');
    const tierDrops = new Set(D.items.filter(i => (i.kind === 'drop' || i.kind === 'rare') && i.tier === t).map(i => i.id));
    const makes = D.recipes.filter(r => r.inputs.some(i => tierDrops.has(i.itemId)));
    const houses = D.houseLevels.filter(h => h.inputs.some(i => tierDrops.has(i.itemId)));
    const rare = D.items.find(i => i.kind === 'rare' && i.tier === t);
    $('#make-note').innerHTML = `Any ${tierName(t)} critter may also leave this rare drop: ${chip(rare.id)}`;
    $('#drops-make').innerHTML = makes.map(r => recipeCard(r.id)).join('') + houses.map(h => `<article class="recipe" style="--c:var(--green)"><header><strong>House level ${h.level}</strong><span class="tag">Hometown</span></header><p class="meta">${esc(h.unlocks)}</p><div class="ins">${h.inputs.map(i => chip(i.itemId, i.quantity)).join('')}</div></article>`).join('');
  }

  // ------------------------------------------------------------ biomes and trade
  const HOMES = D.checks.trade.homes;
  const LIMIT = D.checks.trade.importLimit;
  let currentHome = D.biomes[0];
  function renderBiomes() {
    $('#home-picker').innerHTML = D.biomes.map(b => `<button type="button" data-home="${b}" aria-pressed="${b === currentHome}"><span class="sw" style="--b:var(--b-${b})" aria-hidden="true"></span>${PLACE[b]}</button>`).join('');
    document.querySelectorAll('#home-picker button').forEach(btn => btn.addEventListener('click', () => { currentHome = btn.dataset.home; renderBiomes(); setHash(`biomes/${currentHome}`); }));
    const basics = D.items.filter(i => ['material', 'farm', 'pickup'].includes(i.kind) && i.biomes.some(b => EVERYWHERE.has(b)));
    const roamers = D.critters.filter(c => c.biomes.some(b => EVERYWHERE.has(b)));
    $('#basics').innerHTML = `<div><h3>Found in every biome</h3><div class="ins">${basics.map(i => chip(i.id)).join('')}</div><p class="note">Fish come from any water and sugarcane from any shore, so both count as local everywhere.</p></div>
      <div><h3>Critters in every biome</h3><div class="roamers">${roamers.map(c => `<span class="roamer">${token(c, 'sm')}<span>${esc(c.name)}<small>${esc(cap(places(c.biomes)))}</small></span></span>`).join('')}</div></div>`;

    const h = HOMES[currentHome];
    const mats = D.items.filter(i => ['material', 'farm'].includes(i.kind) && i.biomes.includes(currentHome));
    const farm = D.farmCritters.filter(f => f.biomes.includes(currentHome));
    const rows = [1, 2, 3, 4, 5].map(t => {
      const tv = h.tiers[t];
      const easiest = tv.localCritters.reduce((a, b) => b.imports.length < a.imports.length ? b : a);
      const buy = easiest.imports.length ? easiest.imports.map(x => chip(x)).join('') : '<p class="none">Nothing: every good is found here.</p>';
      const all = tv.importsForAllLocal.length;
      const sell = tv.exports.length ? tv.exports.map(e => chip(e.itemId)).join('') : '<p class="none">Nothing yet: Common gear is made anywhere.</p>';
      return `<div class="row" style="--c:var(--t${t});--cs:var(--t${t}s)">
        <div class="tier">${tierName(t)}${LIMIT[t] ? `<small>limit ${LIMIT[t]} to buy</small>` : ''}</div>
        <div class="who"><div class="tokens">${tv.localCritters.map(p => token(critters.get(p.critterId), 'sm')).join('')}</div><p>Easiest here: <strong>${esc(critters.get(easiest.critterId).name)}</strong>, with the ${esc(items.get(easiest.trap).name)} and ${esc(items.get(easiest.bait).name)}.</p></div>
        <div class="side buy"><span class="n">${easiest.imports.length}</span><div><h4>To buy for that catch</h4>${buy}${all > easiest.imports.length ? `<p class="more">For every species here: ${all} goods to buy.</p>` : ''}</div></div>
        <div class="side sell"><span class="n">${tv.exports.length}</span><div><h4>Others buy from here</h4>${sell}</div></div>
      </div>`;
    }).join('');
    const stars = D.houseLevels.filter(x => x.level >= 2).map(x => {
      const have = h.plausibleStarsByHouseLevel[x.level - 1];
      return `<li><span class="lv">Level ${x.level}</span><span class="need">${x.libraryStars} stars</span><span class="have">${have} here</span></li>`;
    }).join('');
    $('#home').innerHTML = `<header class="home-card" style="--b:var(--b-${currentHome})">
        <h2><span class="sw big" aria-hidden="true"></span>${PLACE[currentHome]}</h2>
        <p>${h.species} critter species live here, counting water and shore.</p>
        ${farm.map(f => `<div class="farm-mini">${token({ id: f.id, name: f.name, tier: 1 }, 'sm')}<span>${esc(f.name)}<small>Farm animal</small></span>${chip(f.gives)}</div>`).join('')}
        <div class="spec"><h3>Its own goods</h3><div class="ins">${mats.filter(i => i.flavour !== 'fantasy').map(i => chip(i.id)).join('')}</div>
        <h3>Its fantasy material</h3><div class="ins">${mats.filter(i => i.flavour === 'fantasy').map(i => chip(i.id)).join('') || '<p class="none">None.</p>'}</div></div>
      </header>
      <div class="ledger" role="table" aria-label="What a ${PLACE[currentHome]} player buys and sells at each tier">${rows}</div>
      <div class="stars"><h3>Library stars a player here can plausibly hold</h3><p class="note">Critters cannot be bought, so each house level asks for library stars instead of species. A species earns a star at its 1st, 10th and 50th catch. The check assumes 3 stars for each Common and Uncommon species, 2 for each Rare and 1 for each Epic or Legendary, counted at the level before.</p><ul>${stars}</ul></div>`;

    $('#glance').innerHTML = `<p class="note">For each home and tier: goods to buy for the easiest local catch, and goods of that home that other homes need.</p>
      <table><thead><tr><th scope="col">Home</th>${[2, 3, 4, 5].map(t => `<th scope="col" style="--c:var(--t${t})">${tierName(t)}</th>`).join('')}</tr></thead>
      <tbody>${D.biomes.map(b => `<tr${b === currentHome ? ' class="here"' : ''}><th scope="row"><span class="sw" style="--b:var(--b-${b})" aria-hidden="true"></span>${PLACE[b]}</th>${[2, 3, 4, 5].map(t => { const tv = HOMES[b].tiers[t]; return `<td><b>${tv.fewestImports}</b> to buy<br><b>${tv.exports.length}</b> to sell</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
  }

  // ------------------------------------------------------------ hometown
  function renderHometown() {
    const lineIds = D.lines.map(l => l.id);
    let html = `<div class="th">House level<small>Items to reach it, and the library stars</small></div>` + D.lines.map(l => `<div class="th">${esc(l.name)}<small>${esc(l.summary)}</small></div>`).join('');
    for (const h of D.houseLevels) {
      html += `<div class="lvl"><div><span class="num">${h.level}</span><strong>${h.level === 1 ? 'Start' : 'Level ' + h.level}</strong></div>
        ${h.inputs.length ? `<div class="ins" style="margin-top:6px">${h.inputs.map(i => chip(i.itemId, i.quantity)).join('')}</div>` : ''}
        ${h.libraryStars ? `<p class="lib">${h.libraryStars} library stars</p>` : ''}<p class="unl">${esc(h.unlocks)}</p></div>`;
      for (const lid of lineIds) {
        const here = D.buildings.filter(b => b.lineId === lid && (b.starter ? h.level === 1 : b.houseLevel === h.level));
        const ups = D.buildings.filter(b => b.lineId === lid).flatMap(b => b.upgrades.filter(u => u.houseLevel === h.level).map(u => ({ b, u })));
        const cell = here.map(b => `<button type="button" class="bchip${b.starter ? ' starter' : ''}" data-building="${b.id}">${esc(b.name)}</button>`).join('') +
          ups.map(({ b, u }) => `<button type="button" class="bchip up" data-building="${b.id}">${esc(b.name)} level ${u.level}</button>`).join('');
        html += `<div class="cell" data-line="${esc(lines.get(lid).name)}">${cell}</div>`;
      }
    }
    $('#tech').innerHTML = html;
    document.querySelectorAll('#tech .cell').forEach(c => { if (!c.children.length) c.textContent = ''; });
  }

  // ------------------------------------------------------------ wildlings
  function renderWildlings() {
    const dance = new Map(D.dances.map(d => [d.id, d]));
    const TIME = { day: 'by day', dawn: 'at dawn', dusk: 'at dusk', night: 'at night' };
    const pill = id => `<span class="dance" style="--d:${dance.get(id).color}">${esc(dance.get(id).name)}</span>`;
    const fam = f => `<article class="fam${f.starter ? ' starter' : ''}"><h3>${esc(f.name)}${f.starter ? '<span class="start">Starter</span>' : ''}</h3><p class="pack">${esc(f.pack)}, seen in ${esc(PLACE[f.biome])} ${TIME[f.time]}</p>
      <div class="forms">${f.forms.map(n => `<span>${esc(n)}</span>`).join('')}</div>
      <p class="loves">Dances ${pill(f.dance)} Entranced by ${pill(f.entrancedBy)}</p><p class="fit">${esc(f.fit)}</p></article>`;
    $('#starters').innerHTML = D.wildlings.filter(f => f.starter).map(fam).join('');
    $('#families').innerHTML = D.wildlings.map(fam).join('');
    // the dance cycle: each style entrances the next
    const order = D.dances.map(d => d.id);
    const pos = order.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / order.length; return [180 + 124 * Math.cos(a), 180 + 124 * Math.sin(a)]; });
    const R = 40, GAP = 7;
    const arrows = order.map((id, i) => {
      const [x1, y1] = pos[i], [x2, y2] = pos[(i + 1) % order.length];
      const mx = (x1 + x2) / 2 - (180 - (x1 + x2) / 2) * 0.35, my = (y1 + y2) / 2 - (180 - (y1 + y2) / 2) * 0.35;
      const edge = (px, py, qx, qy, r) => { const dx = qx - px, dy = qy - py, l = Math.hypot(dx, dy); return [px + dx / l * r, py + dy / l * r]; };
      const [sx, sy] = edge(x1, y1, mx, my, R + 3), [ex, ey] = edge(x2, y2, mx, my, R + GAP);
      return `<path d="M${sx.toFixed(1)} ${sy.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="#24483B" stroke-width="3" marker-end="url(#arr)"/>`;
    }).join('');
    const nodes = order.map((id, i) => `<g><circle cx="${pos[i][0]}" cy="${pos[i][1]}" r="40" fill="${dance.get(id).color}" stroke="#24483B" stroke-width="3"/><text x="${pos[i][0]}" y="${pos[i][1] + 6}" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="17" fill="#FFFDF6">${esc(dance.get(id).name)}</text></g>`).join('');
    $('#cycle').innerHTML = `<svg viewBox="0 0 360 360" role="img" aria-label="${esc(order.map(id => dance.get(id).name).join(' entrances ') + ' entrances ' + dance.get(order[0]).name)}"><defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#24483B"/></marker></defs>${arrows}${nodes}</svg><figcaption>Each style entrances the families that dance the next one round the circle: a Sway dancer entrances Twirl families, a Twirl dancer entrances Shuffle families, and so on. A team with all five styles can dance for anything.</figcaption><ul class="looks">${D.dances.map(d => `<li><span class="dance" style="--d:${d.color}">${esc(d.name)}</span> ${esc(d.looks)}</li>`).join('')}</ul>`;
    $('#lassos').innerHTML = D.lassoBrackets.map(b => {
      const it = items.get(b.itemId), r = recipeOf.get(b.itemId);
      const dropTier = r.inputs.map(i => items.get(i.itemId)).find(x => x.kind === 'drop' || x.kind === 'rare');
      return `<article class="lasso" style="--c:var(--t${Math.min(it.tier, 5)})"><header>${LadderIcons.svg(it)}<strong>${esc(it.name)}</strong></header>
        <p>Wildlings of level ${b.minLevel} to ${b.maxLevel}. ${dropTier ? `Made with ${tierName(dropTier.tier)} drops.` : 'Twine spun from Meadow flax at the Loom; also an occasional bonus from Energy and Water pickups.'}</p><div class="ins">${r.inputs.map(i => chip(i.itemId, i.quantity)).join('')}</div></article>`;
    }).join('');
  }

  // ------------------------------------------------------------ drawer
  function openDrawer(html) {
    $('#drawer').innerHTML = `<button type="button" class="close" id="close">Close</button>${html}`;
    $('#drawer').hidden = false; $('#scrim').hidden = false;
    $('#close').addEventListener('click', closeDrawer);
    $('#close').focus();
  }
  function closeDrawer() { $('#drawer').hidden = true; $('#scrim').hidden = true; }
  function itemDetail(id) {
    const it = items.get(id), r = recipeOf.get(id);
    let body = '';
    if (it.kind === 'drop') {
      const c = critters.get(it.speciesId);
      body += `<p>Left behind by the <strong>${esc(c.name)}</strong> (${tierName(c.tier)}) when it is released after a trap catch. Every release leaves at least one. Found where it lives: ${esc(places(c.biomes))}.</p>`;
    } else if (it.kind === 'rare') {
      body += `<p>A small chance from any ${tierName(it.tier)} critter on release, in every biome.</p>`;
    } else if (['material', 'farm', 'pickup'].includes(it.kind)) {
      const fam = { foraging: 'Foraging', mining: 'Mining', fishing: 'Fishing' }[it.family];
      body += `<p>${fam ? `${fam}, material tier ${it.materialTier}. ` : ''}Found in ${esc(places(it.biomes))}. Source: ${esc(it.source)}.</p>
        <p class="note">${it.flavour === 'fantasy' ? 'A fantasy material: it makes a recipe of familiar goods feel magical.' : 'A familiar material.'} Prop: ${esc(it.prop)}. ${it.status && it.status.startsWith('live') ? 'In the game today.' : 'Proposed.'}</p>`;
    }
    if (r) {
      const b = buildings.get(r.buildingId);
      body += `<h3>Recipe</h3><p class="note">${esc(b.name)}${r.buildingLevel > 1 ? ' level ' + r.buildingLevel : ''}, ${secs(r.seconds)}</p><div>${r.inputs.map(i => chip(i.itemId, i.quantity)).join('')}</div>`;
      if (['trap', 'bait', 'lasso', 'charm'].includes(it.kind)) body += fromLine(id);
    }
    const uses = usedIn.get(id) || [];
    if (uses.length) {
      body += `<h3>Used in</h3><ul>${uses.map(u => u.recipe ? `<li>${esc(items.get(u.recipe).name)}</li>` : u.house ? `<li>House level ${u.house}</li>` : `<li>${esc(buildings.get(u.building).name)}${u.level ? ' level ' + u.level : ''}</li>`).join('')}</ul>`;
    }
    const icon = it.kind === 'drop' && PORTRAITS.has(it.speciesId) ? `<img class="portrait" src="assets/critters/${it.speciesId}.png" alt="">` : '';
    openDrawer(`<div class="big">${LadderIcons.svg(it)}<div><h2>${esc(it.name)}</h2><div class="kind">${KIND[it.kind] || it.kind}${it.tier ? `, ${tierName(it.tier)}` : ''}</div></div>${icon}</div>${body}`);
  }
  function buildingDetail(id) {
    const b = buildings.get(id);
    const crafts = D.recipes.filter(r => r.buildingId === id);
    let body = `<p>${esc(b.makes)}.</p>`;
    body += b.starter ? '<p>Starter building: every player has it from the beginning.</p>' : `<h3>Buy it</h3><p class="note">From house level ${b.houseLevel}${b.requires.length ? ', with ' + b.requires.map(q => `${buildings.get(q.buildingId).name} level ${q.level}`).join(' and ') : ''}.</p><div>${b.purchase.map(i => chip(i.itemId, i.quantity)).join('')}</div>`;
    if (b.upgrades.length) body += `<h3>Upgrades</h3>` + b.upgrades.map(u => `<p class="note">Level ${u.level}, from house level ${u.houseLevel}: ${esc(u.effect)}.</p><div>${u.inputs.map(i => chip(i.itemId, i.quantity)).join('')}</div>`).join('');
    if (id === 'critter-stall') body += '<p class="note">A drop farm. It keeps up to three critters of one species for good; they make that species\' signature drop on a timer while the Stall has Energy. Better individuals work faster, and a better duplicate can replace a kept one.</p><p class="note">Guard rails: you choose keep or release when you open a trap. Each Stall level raises the highest tier it can hold: Common and Uncommon, then Rare, then Epic, never Legendary. Energy per drop rises with the tier, a Stall stores only a few drops until you collect them, and kept critters can be named.</p>';
    if (crafts.length) body += `<h3>Crafts</h3><div>${crafts.map(r => chip(r.id)).join('')}</div>`;
    openDrawer(`<div class="big"><div><h2>${esc(b.name)}</h2><div class="kind">${esc(lines.get(b.lineId).name)}</div></div></div>${body}`);
  }
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-item]');
    if (c) { itemDetail(c.dataset.item); return; }
    const b = e.target.closest('[data-building]');
    if (b) { buildingDetail(b.dataset.building); return; }
    if (e.target.id === 'scrim') closeDrawer();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer(); });

  // ------------------------------------------------------------ views
  function setHash(h) { history.replaceState(null, '', '#' + h); }
  function show(view) {
    document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.view === view));
    document.querySelectorAll('.view').forEach(v => { v.hidden = v.id !== 'view-' + view; });
  }
  const hashFor = view => view === 'tiers' ? `tiers/${currentTier}` : view === 'biomes' ? `biomes/${currentHome}` : view;
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => { show(b.dataset.view); setHash(hashFor(b.dataset.view)); }));

  function footer() {
    const c = D.checks;
    const opens = Object.entries(c.tierOpensAtHouseLevel).map(([t, v]) => `${tierName(+t)} from house level ${v.first}`).join(', ');
    const limits = list(Object.values(LIMIT).map(String));
    $('#foot').innerHTML = `<p><strong>Checks ${c.passed ? 'pass' : 'fail'}.</strong> Every drop and material is used; each tier's gear uses only drops from the tier below; Common gear and the Hometown up to house level 3 use only goods found in every biome; every building can be bought before a recipe needs it; a player in any one biome can meet every library milestone, and buys at most ${limits} goods for their easiest local catch from Uncommon to Legendary. ${opens}. ${esc(c.assumption)}</p>
      <p>Capture ladder version ${esc(D.version)}, ${esc(D.authoredOn)}. Critter portraits are AI-generated placeholders; final art would come from the game's own 3D models. Biome swatches are the map's daylight ground colours.</p>`;
  }

  renderDials(); renderPyramid(); renderTiers(); renderBiomes(); renderHometown(); renderWildlings(); footer();
  const [view, arg] = (location.hash.slice(1) || 'pyramid').split('/');
  if (view === 'tiers' && arg) { currentTier = Math.max(1, Math.min(5, +arg || 1)); renderTiers(); }
  if (view === 'biomes' && D.biomes.includes(arg)) { currentHome = arg; renderBiomes(); }
  show(['pyramid', 'tiers', 'biomes', 'hometown', 'wildlings'].includes(view) ? view : 'pyramid');
  document.documentElement.dataset.ready = 'true';
})();
