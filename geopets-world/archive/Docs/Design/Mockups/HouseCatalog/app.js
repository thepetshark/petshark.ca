'use strict';
// The house catalog mockup: buy buildings and upgrades with items, and level up the house, all gated.
(() => {
  const D = window.CATALOG;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const INK = '#24483B';
  const o = `stroke="${INK}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"`;
  // One flat symbol per building, in the game's icon language: 64-unit grid, dark-green contour, flat fills.
  const BUILDING_ICON = {
    mill: `<path d="M22 58L27 28H37L42 58Z" fill="#E8D9B8" ${o}/><path d="M26 30L32 20L38 30Z" fill="#C4674E" ${o}/><path d="M32 22L14 8L10 13L28 26Z M32 22L50 8L54 13L36 26Z M32 22L20 40L25 43L34 26Z M32 22L46 40L41 43L31 26Z" fill="#FFFDF6" ${o}/><circle cx="32" cy="22" r="3.5" fill="#B7851C" ${o}/><path d="M29 58V49C29 46 35 46 35 49V58" fill="#7A5A3A" ${o}/>`,
    bakery: `<path d="M8 40C8 26 20 18 32 18C44 18 56 26 56 40C56 48 50 50 32 50C14 50 8 48 8 40Z" fill="#D9A864" ${o}/><path d="M20 26L24 38M31 22L33 36M42 26L40 38" stroke="#8C5A2E" stroke-width="3.2" stroke-linecap="round"/>`,
    confectionery: `<path d="M16 32H48L44 56H20Z" fill="#F4E6C6" ${o}/><path d="M22 32V56M32 32V56M42 32V56" stroke="#D9C79A" stroke-width="2.4"/><path d="M14 32C12 22 22 16 32 16C42 16 52 22 50 32Z" fill="#E9A0B0" ${o}/><circle cx="32" cy="12" r="5" fill="#C4485A" ${o}/>`,
    patisserie: `<rect x="12" y="38" width="40" height="16" rx="3" fill="#F4E6C6" ${o}/><rect x="18" y="26" width="28" height="12" rx="3" fill="#E9A0B0" ${o}/><rect x="24" y="16" width="16" height="10" rx="3" fill="#FFFDF6" ${o}/><path d="M32 16V8" ${o}/><path d="M29 8C29 4 35 4 35 8C35 10 32 12 32 12C32 12 29 10 29 8Z" fill="#E0B64E" ${o}/>`,
    workbench: `<rect x="8" y="28" width="48" height="8" rx="2" fill="#D9B07A" ${o}/><path d="M14 36V56M50 36V56" ${o}/><path d="M18 8L30 20L26 24L14 12Z" fill="#8E969C" ${o}/><path d="M28 18L40 30" stroke="#7A5A3A" stroke-width="5" stroke-linecap="round"/><path d="M44 10L40 26H48Z" fill="#C8743E" ${o}/>`,
    'trappers-lodge': `<path d="M8 30L32 12L56 30" fill="#A9784A" ${o}/><rect x="14" y="30" width="36" height="24" fill="#D9B07A" ${o}/><path d="M14 38H50M14 46H50" stroke="#A9784A" stroke-width="2.4"/><rect x="27" y="40" width="10" height="14" fill="#7A5A3A" ${o}/>`,
    artificer: `<circle cx="26" cy="36" r="14" fill="#8E969C" ${o}/><circle cx="26" cy="36" r="5" fill="#FFFDF6" ${o}/><path d="M26 18V22M26 50V54M8 36H12M40 36H44M13 23L16 26M36 46L39 49M13 49L16 46M36 26L39 23" ${o}/><circle cx="46" cy="18" r="9" fill="#D6EEF4" ${o}/>`,
    loom: `<rect x="10" y="10" width="44" height="44" rx="3" fill="#D9B07A" ${o}/><rect x="17" y="17" width="30" height="30" fill="#FFFDF6" ${o}/><path d="M22 17V47M27 17V47M32 17V47M37 17V47M42 17V47" stroke="#7E9ACC" stroke-width="2.2"/><path d="M17 27H47M17 37H47" stroke="#C4552F" stroke-width="3"/>`,
    ropewalk: `<path d="M32 12C46 12 50 22 50 30C50 40 42 48 32 48C22 48 16 42 16 34C16 26 22 22 30 22C38 22 42 26 42 32C42 38 36 40 32 40" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M32 12C46 12 50 22 50 30C50 40 42 48 32 48C22 48 16 42 16 34C16 26 22 22 30 22C38 22 42 26 42 32C42 38 36 40 32 40" fill="none" stroke="#C9A56E" stroke-width="5" stroke-linecap="round"/><path d="M32 48L30 58" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M32 48L30 58" stroke="#C9A56E" stroke-width="5" stroke-linecap="round"/>`,
    kiln: `<path d="M10 56V36C10 22 20 12 32 12C44 12 54 22 54 36V56Z" fill="#C4674E" ${o}/><path d="M22 56V44C22 38 42 38 42 44V56" fill="#24483B" ${o}/><path d="M28 54C26 50 30 48 32 44C34 48 38 50 36 54Z" fill="#E0B64E"/>`,
    forge: `<path d="M10 24H46C52 24 56 28 56 32H22L20 38H14Z" fill="#8E969C" ${o}/><path d="M24 32H40L42 44H22Z" fill="#6E767C" ${o}/><rect x="16" y="44" width="32" height="10" rx="2" fill="#6E767C" ${o}/>`,
    'care-bench': `<rect x="20" y="8" width="24" height="9" rx="2" fill="#9E7A4E" ${o}/><path d="M18 17H46L50 26V52C50 55 48 57 45 57H19C16 57 14 55 14 52V26Z" fill="#FFFDF6" ${o}/><path d="M32 48C24 42 20 38 20 33C20 29 23 27 26 27C29 27 31 29 32 31C33 29 35 27 38 27C41 27 44 29 44 33C44 38 40 42 32 48Z" fill="#E9A0B0" ${o}/>`,
    apothecary: `<path d="M26 8H38V22L50 46C53 52 49 57 43 57H21C15 57 11 52 14 46L26 22Z" fill="#FFFDF6" ${o}/><path d="M17 42H47L50 47C52 52 49 55 44 55H20C15 55 12 52 14 47Z" fill="#8CB86A"/><path d="M24 8H40" ${o}/>`,
    'critter-stall': `<path d="M6 26L32 10L58 26" fill="#C4552F" ${o}/><path d="M10 26H54" ${o}/><path d="M12 26V56M52 26V56" ${o}/><path d="M12 40H52M12 48H52" stroke="${INK}" stroke-width="3.2"/><path d="M20 40V56M28 40V56M36 40V56M44 40V56" stroke="#D9B07A" stroke-width="3.2"/>`,
    house: `<path d="M8 30L32 10L56 30" fill="#2F7F86" ${o}/><rect x="14" y="30" width="36" height="26" fill="#FFFDF6" ${o}/><rect x="27" y="40" width="10" height="16" fill="#7A5A3A" ${o}/><rect x="18" y="35" width="7" height="7" fill="#D6EEF4" ${o}/><rect x="39" y="35" width="7" height="7" fill="#D6EEF4" ${o}/>`,
  };
  const bicon = id => `<svg viewBox="0 0 64 64" aria-hidden="true">${BUILDING_ICON[id] || BUILDING_ICON.house}</svg>`;
  const UI = {
    ok: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="#366950" ${o}/><path d="M20 33L28 41L45 23" fill="none" stroke="#FFFDF6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    no: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="#FFFDF6" stroke="#B5652B" stroke-width="4"/><path d="M24 24L40 40M40 24L24 40" stroke="#B5652B" stroke-width="5" stroke-linecap="round"/></svg>`,
    lock: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="28" width="36" height="28" rx="6" fill="#FFFDF6" stroke="${INK}" stroke-width="4.5"/><path d="M22 28V20C22 13 27 9 32 9C37 9 42 13 42 20V28" fill="none" stroke="${INK}" stroke-width="4.5"/></svg>`,
    star: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5L40 23L60 25L45 38L49 58L32 48L15 58L19 38L4 25L24 23Z" fill="#E0B64E" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/></svg>`,
    close: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 18L46 46M46 18L18 46" stroke="${INK}" stroke-width="7" stroke-linecap="round"/></svg>`,
    back: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M40 14L22 32L40 50" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };
  const itemIcon = id => window.LadderIcons.svg(D.items[id] || { id, kind: 'material' });
  const itemName = id => (D.items[id] || { name: id }).name;
  const B = Object.fromEntries(D.buildings.map(b => [b.id, b]));
  const LINE = Object.fromEntries(D.lines.map(l => [l.id, l]));

  const fresh = () => ({ houseLevel: D.player.houseLevel, stars: D.player.stars, owned: { ...D.player.owned }, inv: { ...D.player.inventory } });
  let P = fresh();
  const S = { open: true, tab: 'build', view: 'list', id: null, size: 'default', toast: '', toastUntil: 0 };
  const SIZES = { default: [412, 883, 'Galaxy S22 Ultra, 412 x 883'], short: [360, 640, 'Short phone, 360 x 640'], tall: [412, 915, 'Tall phone, 412 x 915'] };

  // ------------------------------------------------------------ gates
  const have = id => P.inv[id] || 0;
  function gatesFor(kind, b, u) {
    const out = [];
    const houseNeed = kind === 'upgrade' ? u.houseLevel : b.houseLevel;
    if (!b.starter || kind === 'upgrade') out.push({ kind: 'house', ok: P.houseLevel >= houseNeed, text: `House level ${houseNeed}` });
    if (kind === 'building') b.requires.forEach(r => out.push({ kind: 'building', ok: (P.owned[r.buildingId] || 0) >= r.level, text: `${B[r.buildingId].name} level ${r.level}`, id: r.buildingId }));
    (kind === 'upgrade' ? u.inputs : b.purchase).forEach(i => out.push({ kind: 'item', ok: have(i.itemId) >= i.quantity, id: i.itemId, need: i.quantity, have: have(i.itemId) }));
    return out;
  }
  function status(kind, b, u) {
    const g = gatesFor(kind, b, u);
    const house = g.find(x => x.kind === 'house' && !x.ok);
    if (house) return { state: 'lock', label: house.text, gates: g };
    const req = g.find(x => x.kind === 'building' && !x.ok);
    if (req) return { state: 'lock', label: `Needs ${req.text}`, gates: g };
    const short = g.filter(x => x.kind === 'item' && !x.ok);
    if (short.length) return { state: 'short', label: short.length === 1 ? `${short[0].need - short[0].have} ${itemName(short[0].id)} short` : `${short.length} items short`, gates: g };
    return { state: 'go', label: kind === 'upgrade' ? 'Upgrade' : 'Buy', gates: g };
  }
  const nextUpgrade = b => b.upgrades.find(u => u.level === (P.owned[b.id] || 0) + 1);
  const houseNext = () => D.houseLevels.find(h => h.level === P.houseLevel + 1);
  function houseGates() {
    const h = houseNext();
    if (!h) return [];
    return [...h.inputs.map(i => ({ kind: 'item', ok: have(i.itemId) >= i.quantity, id: i.itemId, need: i.quantity, have: have(i.itemId) })),
      { kind: 'stars', ok: P.stars >= h.libraryStars, need: h.libraryStars, have: P.stars }];
  }

  // ------------------------------------------------------------ pieces
  const badge = st => st.state === 'go' ? `<span class="badge go">${esc(st.label)}</span>`
    : st.state === 'lock' ? `<span class="badge lock">${UI.lock}${esc(st.label)}</span>`
    : st.state === 'owned' ? `<span class="badge owned">${esc(st.label)}</span>`
    : `<span class="badge short">${esc(st.label)}</span>`;
  function checklist(gates) {
    return `<ul class="checks">${gates.map(g => {
      const mark = g.ok ? UI.ok : UI.no;
      if (g.kind === 'house') return `<li><span class="mark">${mark}</span><span class="item">${bicon('house').replace('<svg', '<svg class="ic"')}${esc(g.text)}</span><span class="qty">${g.ok ? 'reached' : `you are ${P.houseLevel}`}</span></li>`;
      if (g.kind === 'building') return `<li><span class="mark">${mark}</span><span class="item">${bicon(g.id).replace('<svg', '<svg class="ic"')}${esc(g.text)}</span><span class="qty">${g.ok ? 'owned' : (P.owned[g.id] ? `yours is ${P.owned[g.id]}` : 'not owned')}</span></li>`;
      if (g.kind === 'stars') return `<li><span class="mark">${mark}</span><span class="item">${UI.star.replace('<svg', '<svg class="ic"')}Library stars</span><span class="qty${g.ok ? '' : ' short'}">${g.have} / ${g.need}</span>${g.ok ? '' : `<span class="routes"><button type="button" class="route">Open the library</button></span>`}</li>`;
      const maker = D.madeAt[g.id], ownsMaker = maker && P.owned[maker];
      const routes = g.ok ? '' : `<span class="routes">${maker ? `<button type="button" class="route">${ownsMaker ? `Make it at the ${esc(B[maker].name)}` : `Made at the ${esc(B[maker].name)}`}</button>` : ''}<button type="button" class="route">Find it on the market</button></span>`;
      return `<li><span class="mark">${mark}</span><span class="item">${itemIcon(g.id)}${esc(itemName(g.id))}</span><span class="qty${g.ok ? '' : ' short'}">${g.have} / ${g.need}</span>${routes}</li>`;
    }).join('')}</ul>`;
  }
  const head = (title, sub, page) => `<div class="head${page ? ' page' : ''}">${page ? `<button type="button" class="round" id="back" aria-label="Back">${UI.back}</button>` : `<span class="round" style="background:transparent">${bicon('house')}</span>`}<div><h2>${esc(title)}</h2><p class="sub">${esc(sub)}</p></div><button type="button" class="round" id="close" aria-label="Close">${UI.close}</button></div>`;
  const tabs = () => `<div class="tabs" role="tablist" style="grid-template-columns:1fr 1fr 1fr">${[['build', 'Buildings'], ['upgrade', 'Upgrades'], ['house', 'House']].map(([k, n]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${S.tab === k}">${n}</button>`).join('')}</div>`;

  // ------------------------------------------------------------ views
  function listBuild() {
    return D.lines.map(l => {
      const bs = D.buildings.filter(b => b.lineId === l.id);
      return `<div class="line-h">${esc(l.name)}</div>${bs.map(b => {
        const lv = P.owned[b.id];
        const st = lv ? { state: 'owned', label: `Level ${lv}` } : status('building', b);
        return `<button type="button" class="row${st.state === 'lock' ? ' locked' : ''}" data-building="${b.id}"><span class="ic">${bicon(b.id)}</span><span style="min-width:0"><strong>${esc(b.name)}</strong><small>${esc(b.makes)}</small></span>${badge(st)}</button>`;
      }).join('')}`;
    }).join('');
  }
  function listUpgrade() {
    const owned = D.buildings.filter(b => P.owned[b.id]);
    return owned.map(b => {
      const u = nextUpgrade(b);
      const st = u ? status('upgrade', b, u) : { state: 'owned', label: 'Top level' };
      const sub = u ? `Level ${P.owned[b.id]} to ${u.level}: ${u.effect}` : `Level ${P.owned[b.id]}, fully upgraded`;
      return `<button type="button" class="row${st.state === 'lock' ? ' locked' : ''}" data-upgrade="${b.id}"><span class="ic">${bicon(b.id)}</span><span style="min-width:0"><strong>${esc(b.name)}</strong><small>${esc(sub)}</small></span>${badge(st)}</button>`;
    }).join('');
  }
  function houseView() {
    const h = houseNext();
    const g = houseGates();
    const ready = h && g.every(x => x.ok);
    const ladder = D.houseLevels.map(x => {
      const cls = x.level < P.houseLevel ? 'done' : x.level === P.houseLevel ? 'now' : 'later';
      return `<li class="${cls}"><span class="n">${x.level}</span><span><strong>${x.level === P.houseLevel ? 'Your house now' : x.level === P.houseLevel + 1 ? 'Next' : `Level ${x.level}`}</strong>${x.libraryStars ? `, ${x.libraryStars} stars` : ''}. ${esc(x.unlocks)}</span></li>`;
    }).join('');
    return `${h ? `<div class="card"><h4>House level ${P.houseLevel} to ${h.level}</h4><p>Opens: ${esc(h.unlocks)}</p>${checklist(g)}</div>
      <button type="button" class="buy" id="levelup" ${ready ? '' : 'disabled'}>Level up the house</button>${ready ? '' : `<p class="why">${g.filter(x => !x.ok).length} things still missing</p>`}` : '<div class="card"><p>Your house is at its top level.</p></div>'}
      <div class="card"><h4>Every house level</h4><ul class="levels">${ladder}</ul></div>`;
  }
  function detail(kind, id) {
    const b = B[id];
    const lv = P.owned[id] || 0;
    const u = kind === 'upgrade' ? nextUpgrade(b) : null;
    const owned = kind === 'building' && lv;
    const st = owned ? { state: 'owned', label: `Level ${lv}` } : kind === 'upgrade' ? (u ? status('upgrade', b, u) : { state: 'owned', label: 'Top level' }) : status('building', b);
    const crafts = (D.makes[id] || []).map(x => `<span class="chip">${itemIcon(x)}${esc(itemName(x))}</span>`).join('');
    const ups = b.upgrades.map(x => `<li class="${lv >= x.level ? 'done' : 'later'}"><span class="n">${x.level}</span><span><strong>${esc(x.effect)}</strong>. From house level ${x.houseLevel}.</span></li>`).join('');
    let action = '';
    if (kind === 'building' && !owned) action = `<div class="card"><h4>To buy it</h4>${checklist(st.gates)}</div><button type="button" class="buy" id="buy" ${st.state === 'go' ? '' : 'disabled'}>Buy the ${esc(b.name)}</button>${st.state === 'go' ? '' : `<p class="why">${esc(st.label)}</p>`}`;
    if (kind === 'upgrade' && u) action = `<div class="card"><h4>To reach level ${u.level}: ${esc(u.effect)}</h4>${checklist(st.gates)}</div><button type="button" class="buy" id="upgrade" ${st.state === 'go' ? '' : 'disabled'}>Upgrade to level ${u.level}</button>${st.state === 'go' ? '' : `<p class="why">${esc(st.label)}</p>`}`;
    return `${head(b.name, LINE[b.lineId].name, true)}<div class="scroll" id="scroll">
      <div class="hero2"><span class="ic">${bicon(id)}</span><div><div class="chips" style="display:flex;flex-wrap:wrap;gap:5px">${badge(st.state === 'go' ? { ...st, label: 'Ready' } : st)}${b.starter ? '<span class="badge">Starter</span>' : ''}</div><p>${esc(b.makes)}.</p></div></div>
      ${action}${crafts ? `<div class="card"><h4>It crafts</h4><div class="outs">${crafts}</div></div>` : ''}${ups ? `<div class="card"><h4>Its levels</h4><ul class="levels">${ups}</ul></div>` : ''}</div>`;
  }
  const CAPTION = {
    build: 'Buildings, by line. Each row says what it makes, and whether you own it, can buy it, or what stops you.',
    upgrade: 'Upgrades for the buildings you own: each level adds a queue slot and speed, and needs items and a house level.',
    house: 'The house is your level: the next one needs items and library stars, and opens new buildings.',
    detail: 'A building\'s page: what stops you, item by item, with a route to each missing item.',
  };
  function render() {
    const cat = $('#cat');
    cat.hidden = !S.open;
    if (S.open) {
      if (S.view === 'list') {
        const body = S.tab === 'build' ? listBuild() : S.tab === 'upgrade' ? listUpgrade() : houseView();
        cat.innerHTML = `${head('Your house', `House level ${P.houseLevel}. Buildings are bought with items.`)}<div class="scroll" id="scroll">${tabs()}${body}</div>`;
      } else {
        cat.innerHTML = detail(S.view, S.id);
      }
    }
    const t = $('#toast');
    t.hidden = !(S.toast && performance.now() < S.toastUntil);
    t.textContent = S.toast;
    $('#caption').textContent = !S.open ? 'Closed: tap the house in your Hometown to open the catalog again.' : S.view === 'list' ? CAPTION[S.tab] : CAPTION.detail;
    placeHouseButton();
  }
  // an invisible button over the little house in the Hometown capture reopens the catalog
  function placeHouseButton() {
    let b = $('#housebtn');
    if (!b) {
      b = document.createElement('button');
      b.id = 'housebtn';
      b.type = 'button';
      b.setAttribute('aria-label', 'Your house');
      b.style.cssText = 'position:absolute;z-index:4;width:64px;height:64px;border:0;background:transparent;padding:0';
      $('#screen').appendChild(b);
      b.addEventListener('click', () => { S.open = true; S.view = 'list'; render(); });
    }
    const [W, H] = SIZES[S.size];
    const s = Math.max(W / 390, H / 844);
    const x = 148 * s - (390 * s - W) / 2, y = 365 * s - (844 * s - H);   // the teal-roofed house below the Care Bench
    b.style.left = `${(x - 32).toFixed(1)}px`;
    b.style.top = `${(y - 32).toFixed(1)}px`;
    const navY = 776 * s - (844 * s - H);
    $('#screen').style.setProperty('--navgap', `${Math.max(96, H - (navY - 44)).toFixed(0)}px`);
  }
  function spend(inputs) { inputs.forEach(i => { P.inv[i.itemId] = have(i.itemId) - i.quantity; }); }
  function toast(msg) { S.toast = msg; S.toastUntil = performance.now() + 2600; render(); setTimeout(render, 2700); }
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
    if (t.closest('#back')) { S.view = 'list'; render(); return; }
    const tab = t.closest('[data-tab]');
    if (tab) { S.tab = tab.dataset.tab; render(); return; }
    const b = t.closest('[data-building]');
    if (b) { S.view = 'building'; S.id = b.dataset.building; render(); return; }
    const u = t.closest('[data-upgrade]');
    if (u) { S.view = 'upgrade'; S.id = u.dataset.upgrade; render(); return; }
    if (t.closest('#buy')) { const bb = B[S.id]; spend(bb.purchase); P.owned[bb.id] = 1; S.view = 'list'; toast(`${bb.name} bought. Place it in your Hometown.`); return; }
    if (t.closest('#upgrade')) { const bb = B[S.id], uu = nextUpgrade(bb); spend(uu.inputs); P.owned[bb.id] = uu.level; S.view = 'list'; toast(`${bb.name} is now level ${uu.level}.`); return; }
    if (t.closest('#levelup')) { const h = houseNext(); spend(h.inputs); P.houseLevel = h.level; toast(`Your house is now level ${h.level}.`); return; }
    if (t.classList.contains('bg') && S.open) { S.open = false; render(); }   // a tap outside the panel closes it
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.open) { if (S.view !== 'list') S.view = 'list'; else S.open = false; render(); } });

  const JUMPS = {
    'Buildings': () => Object.assign(S, { open: true, view: 'list', tab: 'build' }),
    'Ropewalk (short of rope)': () => Object.assign(S, { open: true, view: 'building', id: 'ropewalk' }),
    'Critter Stall (ready to buy)': () => Object.assign(S, { open: true, view: 'building', id: 'critter-stall' }),
    'Artificer (locked)': () => Object.assign(S, { open: true, view: 'building', id: 'artificer' }),
    'Upgrades': () => Object.assign(S, { open: true, view: 'list', tab: 'upgrade' }),
    'Forge upgrade': () => Object.assign(S, { open: true, view: 'upgrade', id: 'forge' }),
    'House level': () => Object.assign(S, { open: true, view: 'list', tab: 'house' }),
    'Closed': () => Object.assign(S, { open: false }),
  };
  $('#jumps').innerHTML = Object.keys(JUMPS).map(k => `<button type="button" data-jump="${esc(k)}">${esc(k)}</button>`).join('');
  $('#jumps').addEventListener('click', e => { const b = e.target.closest('[data-jump]'); if (b) { JUMPS[b.dataset.jump](); render(); } });
  $('#opt-size').innerHTML = Object.entries(SIZES).map(([k, v]) => `<button type="button" role="radio" data-v="${k}" aria-checked="${k === S.size}">${v[2]}</button>`).join('');
  $('#opt-size').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; setSize(b.dataset.v); document.querySelectorAll('#opt-size button').forEach(x => x.setAttribute('aria-checked', x === b)); });
  $('#reset').addEventListener('click', () => { P = fresh(); S.view = 'list'; render(); });

  window.CATALOG_UI = { jump: n => { JUMPS[n](); render(); }, size: k => { setSize(k); document.querySelectorAll('#opt-size button').forEach(x => x.setAttribute('aria-checked', x.dataset.v === k)); },
    reset: () => { P = fresh(); S.view = 'list'; render(); }, state: () => ({ ...S, player: JSON.parse(JSON.stringify(P)) }) };
  setSize('default');
  document.documentElement.dataset.ready = 'true';
})();
