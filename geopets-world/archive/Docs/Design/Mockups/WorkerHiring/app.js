// Worker hiring workshop. Every phone is a pure function of (flow, model): the state picker loads a preset model, and
// in the interactive view the buttons change the model and draw again. Prices: 1 Energy per worker, 5 Wood per worker
// after 60 seconds. Concept A was selected, with long-press on + and −, and the nearby list as a tab in the worker
// list; the other flows stay as the workshop's record. Text rule: no text the fields already show.
'use strict';

const PRICE = 1, YIELD = 5, RING = 400;
const I = n => `assets/icons/${n}.svg`;
const icon = (n, cls = 'i') => `<img class="${cls}" src="${I(n)}" alt="">`;
const price = n => `<span class="price">${icon('energy')}<b>${n * PRICE}</b></span>`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const FLOWS = [
  { id: 'today', name: 'Today', tag: 'The game now, with the 1-Energy price',
    one: 3, five: 11, fiveNote: 'two more taps for every extra worker',
    text: ['Tap the patch, tap Hire worker, then tap Confirm. The price appears only on the second tap, and the game has no Energy chip, so the player cannot see whether they can pay.',
      'Every result is one grey line inside the sheet. Short of Energy, the player learns it only after confirming ("You do not have the required items."). A ready harvest replaces the hire button until it is collected.'] },
  { id: 'stepper', name: 'Price on the button', tag: 'Concept A, selected',
    one: 2, five: 3, fiveNote: 'hold + until it reads 5',
    text: ['The sheet keeps its place, but the button carries the amount and the price ("Hire 3 workers", 3 Energy), so the confirm step goes. An Undo in the message that follows is the safety net instead.',
      'Hold + or − to count quickly: one step at once, then repeating after 0.4 s and speeding up. The + button stops at what the player can afford; the greyed button is the only sign, with no extra text.'] },
  { id: 'tap', name: 'Tap to add', tag: 'Concept B',
    one: 2, five: 6, fiveNote: 'one tap per worker, each hired at once',
    text: ['One big button. Every tap hires one worker straight away: a worker token joins the row, the pin count goes up and the Energy chip ticks down. "Undo last" takes back the most recent one.',
      'Fastest to learn and the most playful. The risk is a hire the player did not mean, which the undo and the 1-Energy price keep cheap.'] },
  { id: 'chips', name: 'Amounts on the map', tag: 'Concept C',
    one: 2, five: 2, fiveNote: 'the 5 button hires five',
    text: ['No sheet. Tapping the patch opens a small card pointing at it, with four ready amounts: 1, 3, 5 and all you can afford. Each shows its total price, and one tap hires.',
      'Amounts you cannot afford are greyed with how much Energy is missing, so a failed payment cannot happen from here. The map stays visible around the card.'] },
  { id: 'nearby', name: 'Nearby list', tag: 'Concept D',
    one: 3, five: 7, fiveNote: 'across three places, without finding each on the map',
    text: ['A list of every resource place near the player, each with its own count, and one button that hires them all. It opens from the worker shortcut, or from a patch’s card.',
      'This is the only flow that hires at several places in one action. Places outside the ring stay listed, with how far to walk.'] },
  { id: 'tab', name: 'Nearby tab in Your workers', tag: 'Concept D as a tab in the worker list',
    one: 3, five: 7, fiveNote: 'across three places; hold + to count',
    text: ['This version puts the nearby list in a tab of the existing worker list. Its first tab is today’s list of working workers; the second hires at every place in range, with the same counts, long-press and priced button as Concept A.'] },
];

const STATES = [
  { id: 'ready', name: 'Enough Energy' }, { id: 'short', name: 'Short for the amount' }, { id: 'none', name: 'No Energy' },
  { id: 'range', name: 'Out of range' }, { id: 'harvest', name: 'Harvest ready here' }, { id: 'hiring', name: 'Hiring' },
  { id: 'success', name: 'Hired' }, { id: 'failed', name: 'Save failed' },
];

// One place per entry in world-gathering-v1.json; distances are invented for the drawing.
const PLACES = [
  { id: 'wood', name: 'Riverside woodland', item: 'Wood', icon: 'wood', m: 120 },
  { id: 'wheat', name: 'Meadow wheat', item: 'Wheat', icon: 'wheat', m: 260 },
  { id: 'stone', name: 'Hillside stones', item: 'Stone', icon: 'stone', m: 390 },
  { id: 'berry', name: 'Bramble patch', item: 'Blackberries', icon: 'blackberry', m: 610 },
  { id: 'fish', name: 'River shoal', item: 'Fish', icon: 'water', m: 700 },
];

function preset(flow, state) {
  const m = { energy: 7, want: 1, working: 0, ready: 0, far: 0, phase: 'idle', hired: 0, wants: { wood: 2, wheat: 1, stone: 0 }, done: {} };
  switch (state) {
    case 'short': Object.assign(m, { energy: 3, want: 3 }); if (flow === 'tap') Object.assign(m, { energy: 1, working: 2 }); break;
    case 'none': Object.assign(m, { energy: 0, wants: { wood: 0, wheat: 0, stone: 0 } }); break;
    case 'range': m.far = 180; m.wants = { wood: 0, wheat: 0, stone: 0 }; break;
    case 'harvest': m.ready = 2; break;
    case 'hiring': Object.assign(m, { want: 3, phase: 'hiring' }); if (flow === 'tap') Object.assign(m, { working: 2, phase: 'hiring', energy: 5 }); if (flow === 'today') m.want = 1; break;
    case 'success': Object.assign(m, { energy: 4, want: 1, working: 3, hired: 3, phase: 'done', wants: { wood: 0, wheat: 0, stone: 0 }, done: { wood: 2, wheat: 1 } });
      if (flow === 'today') Object.assign(m, { energy: 6, working: 1, hired: 1 }); if (flow === 'nearby' || flow === 'tab') m.place = 'items'; break;
    case 'failed': Object.assign(m, { want: 3, phase: 'failed' }); if (flow === 'tap') Object.assign(m, { working: 2, energy: 5 }); if (flow === 'today') m.want = 1; break;
  }
  if (state === 'short' && (flow === 'nearby' || flow === 'tab')) m.wants = { wood: 2, wheat: 1, stone: 0 };
  return m;
}

// ---- pieces shared by every flow ----
function hud(flow, m) {
  if (flow === 'today') return `<div class="hud"><span class="chip">${icon('coin')}<b>50</b></span><span class="chip">${icon('water')}<b>19</b></span></div>`;
  const low = m.energy < PRICE || (m.phase === 'idle' && m.want > m.energy);
  const delta = m.phase === 'done' && m.hired ? `<span class="delta">−${m.hired * PRICE}</span>` : '';
  return `<div class="hud"><span class="chip${m.energy < PRICE ? ' warn' : ''}" title="Energy">${icon('energy')}<b>${m.energy}</b>${delta}</span></div>`;
}

const OUTLINE = '0,365 20,350 60,338 120,328 180,325 230,335 270,358 310,372 345,395 385,415 412,440 412,525 370,530 335,540 300,560 270,590 240,610 190,612 150,600 110,588 60,585 20,572 0,560';
function mapLayer(flow, m, selected) {
  let s = selected ? `<svg class="map-svg" viewBox="0 0 412 883" aria-hidden="true"><polygon points="${OUTLINE}" fill="#f2cf5c22" stroke="#f2cf5c" stroke-width="3" stroke-linejoin="round"/></svg>` : '';
  if (m.working) s += `<div class="pin" style="left:206px;top:${flow === 'chips' ? 520 : 452}px">${icon('worker', '')}<span class="count">${m.working}</span></div>`;
  if (m.ready) s += `<div class="pin ready" style="left:292px;top:${flow === 'chips' ? 560 : 470}px">${icon('wood', '')}<span class="count">${m.ready}</span></div>`;
  return s;
}

function toast(m) {
  if (m.phase !== 'done' || !m.hired) return '';
  return `<div class="toast pop" role="status">${icon('check')}<div>${plural(m.hired, 'worker', 'workers')} hired</div><button data-act="undo">Undo</button></div>`;
}

// Short on purpose: say only what the fields do not already show. A greyed + or a greyed button with
// "You have 0" needs no sentence; a place out of range needs the distance; a failed save needs "nothing was spent".
const NOTES = {
  none: () => '',
  range: m => `<div class="note range"><span class="mark">!</span><div><b>Too far.</b> Walk ${m.far} m closer.</div></div>`,
  failed: () => `<div class="note error"><span class="mark">!</span><div><b>Not hired: no connection.</b> No Energy was spent.</div></div>`,
};

function head(sub, close = true) {
  return `<div class="head"><span class="tile">${icon('wood', '')}</span><div><h3>Riverside woodland</h3><p>${sub}</p></div>${close ? `<button class="x" aria-label="Close">${icon('close', '')}</button>` : ''}</div>`;
}
const harvestRow = m => m.ready ? `<div class="harvest">${icon('wood', '')}<span>${m.ready * YIELD} Wood ready</span><button data-act="collect">Collect</button></div>` : '';
const balance = m => `<span class="balance${m.energy < Math.max(PRICE, m.want) ? ' low' : ''}">You have ${icon('energy')}<b>${m.energy}</b></span>`;

// ---- today ----
function today(m) {
  let notice = 'You can leave while the worker gathers.', label = 'Hire worker', off = false, body = 'Wood · 5 per worker<br>60 seconds of work';
  if (m.ready) body += `<br>${m.ready} assigned · Harvest ready`;
  switch (m.state) {
    case 'short': notice = 'Pay for this single assignment?'; label = 'Confirm · 1 Energy'; break;
    case 'none': notice = 'You do not have the required items.'; break;
    case 'range': notice = `Move within ${RING + 20} m to interact.`; off = true; break;
    case 'harvest': label = 'Collect harvest'; break;
    case 'hiring': notice = 'Pay for this single assignment?'; label = 'Please wait…'; off = true; break;
    case 'success': notice = 'Worker hired. Come back for the harvest.'; break;
    case 'failed': notice = 'Player data could not be saved. Reconnect and reload.'; label = 'Retry hire'; break;
  }
  return `<div class="sheet"><div class="head"><span class="tile">${icon('wood', '')}</span><div><h3>Riverside woodland</h3></div></div>
    <p class="today-body">${body}</p><p class="today-notice">${notice}</p>
    <button class="cta center" ${off ? 'disabled' : ''}>${label}</button></div>`;
}

// ---- A: price on the button ----
function stepper(m) {
  const busy = m.phase === 'hiring', blocked = m.energy < PRICE || m.far;
  const max = Math.max(1, Math.floor(m.energy / PRICE)), n = Math.min(m.want, max);
  let note = '';
  if (m.far) note = NOTES.range(m);
  else if (m.phase === 'failed') note = NOTES.failed(m);
  const label = busy ? `<span class="spin"></span>Hiring ${plural(n, 'worker', 'workers')}…` : m.phase === 'failed' ? 'Try again' : `Hire ${plural(n, 'worker', 'workers')}`;
  return `<div class="sheet">${head('5 Wood per worker, ready in 1 minute')}${harvestRow(m)}
    <div class="row"><span class="stepper-label">Workers</span><div class="stepper">
      <button data-act="less" aria-label="Fewer" ${n <= 1 || busy || blocked ? 'disabled' : ''}>−</button><output>${n}</output>
      <button data-act="more" aria-label="More" ${n >= max || busy || blocked ? 'disabled' : ''}>+</button></div>${balance(m)}</div>
    ${note}
    <button class="cta${busy ? ' busy' : ''}" data-act="hire" ${blocked || busy ? 'disabled' : ''}>${label}${busy ? '' : price(n)}</button></div>`;
}

// ---- B: tap to add ----
function tap(m) {
  const busy = m.phase === 'hiring', blocked = m.energy < PRICE || m.far;
  let tokens = '';
  for (let k = 0; k < m.working; k++) tokens += `<span class="head-token">${icon('worker', '')}</span>`;
  if (busy) tokens += `<span class="head-token pending">${icon('worker', '')}</span>`;
  if (m.phase === 'failed') tokens += `<span class="head-token failed">${icon('worker', '')}</span>`;
  const count = m.working ? `${plural(m.working, 'worker', 'workers')} working here` : 'Each tap hires one worker at once';
  let note = '';
  if (m.far) note = NOTES.range(m);
  else if (m.phase === 'failed') note = `<div class="note error"><span class="mark">!</span><div><b>The last hire did not save.</b> No Energy was spent on it. Tap again when you are back online.</div></div>`;
  else if (m.energy < PRICE) note = NOTES.none();
  return `<div class="sheet">${head('5 Wood per worker, ready in 1 minute')}${harvestRow(m)}
    <button class="cta big" data-act="add" ${blocked ? 'disabled' : ''}><span>+ Hire a worker</span>${price(1)}</button>
    <div class="crew">${tokens}<span class="crew-text">${busy ? 'Hiring…' : count}</span>${m.working && !busy ? '<button class="link" data-act="undo-last">Undo last</button>' : ''}</div>
    ${note}<div class="row" style="margin-top:6px">${balance(m)}</div></div>`;
}

// ---- C: amounts on the map ----
function chips(m) {
  const afford = Math.floor(m.energy / PRICE), off = m.far || afford < 1;
  const amounts = [1, 3, 5, Math.max(afford, 1)];
  const btn = (n, k) => {
    const all = k === 3, need = n * PRICE - m.energy;
    const chosen = (m.phase === 'hiring' || m.phase === 'failed') && n === m.want && !all;
    const dis = off || need > 0 || m.phase === 'hiring';
    const cls = chosen ? (m.phase === 'failed' ? ' failed' : ' chosen') : '';
    return `<button class="amount${cls}" data-act="hire-n" data-n="${n}" ${dis && !chosen ? 'disabled' : ''}>
      <span class="n">${all ? 'All' : n}</span><span class="w">${all ? plural(Math.max(afford, 0), 'worker', 'workers') : n === 1 ? 'worker' : 'workers'}</span>
      ${chosen && m.phase === 'hiring' ? '<span class="spin"></span>' : price(n)}${need > 0 && !off ? `<span class="need">need ${need} more</span>` : ''}</button>`;
  };
  let note = '';
  if (m.far) note = NOTES.range(m);
  else if (afford < 1) note = NOTES.none();
  else if (m.phase === 'failed') note = NOTES.failed(m) + '<button class="cta secondary" data-act="retry">Try again</button>';
  else if (m.phase === 'done') note = `<div class="note ok">${icon('check')}<div><b>${plural(m.hired, 'worker', 'workers')} hired.</b> Tap another amount to add more.</div></div>`;
  return `<div class="card">${head('5 Wood per worker, ready in 1 minute')}${harvestRow(m)}
    <div class="amounts">${amounts.map(btn).join('')}</div>${note}${m.phase === 'failed' ? '' : `<div class="balance${afford < 3 ? ' low' : ''}">You have ${icon('energy')}<b>${m.energy}</b></div>`}</div>`;
}

// ---- D: nearby list, alone (the workshop) or as the second tab of Your workers (the chosen variant) ----
function nearbyBody(m) {
  const busy = m.phase === 'hiring';
  const total = Object.values(m.wants).reduce((a, b) => a + b, 0);
  const left = m.energy - total * PRICE;
  const rows = PLACES.map(p => {
    const dist = m.far ? p.m + RING - 120 + m.far : p.m, inRing = dist <= RING, want = m.wants[p.id] || 0, done = m.done[p.id] || 0;
    let right;
    if (!inRing) right = `<span class="far-note">Walk ${dist - RING} m</span>`;
    else if (m.phase === 'done' && done) right = `<span class="done">${icon('check', '')}${done} working</span>`;
    else right = `<div class="stepper"><button data-act="p-less" data-p="${p.id}" aria-label="Fewer at ${p.name}" ${want < 1 || busy ? 'disabled' : ''}>−</button><output>${want}</output>
      <button data-act="p-more" data-p="${p.id}" aria-label="More at ${p.name}" ${left < PRICE || busy ? 'disabled' : ''}>+</button></div>`;
    const ready = m.ready && p.id === 'wood' ? ` <button class="ready-tag" data-act="collect">Collect ${m.ready * YIELD}</button>` : '';
    return `<div class="place${inRing ? '' : ' far'}"><span class="tile">${icon(p.icon, '')}</span><div><h4>${p.name}</h4><p>${p.item}, ${dist} m${ready}</p></div>${right}</div>`;
  }).join('');
  let note = '';
  if (m.phase === 'done' && m.hired) note = `<div class="note ok">${icon('check')}<div><b>${plural(m.hired, 'worker', 'workers')} hired.</b></div><button class="link" data-act="undo" style="margin:-8px 0">Undo</button></div>`;
  else if (m.phase === 'failed') note = NOTES.failed();
  const label = busy ? `<span class="spin"></span>Hiring ${plural(total, 'worker', 'workers')}…` : m.phase === 'failed' ? 'Try again' : total ? `Hire ${plural(total, 'worker', 'workers')}` : 'Hire workers';
  return `<div class="places">${rows}</div>
    <footer>${note}<div class="row" style="margin-top:0">${balance(m)}</div>
    <button class="cta${busy ? ' busy' : ''}" data-act="hire-all" ${!total || busy || m.energy < PRICE || m.far ? 'disabled' : ''}>${label}${busy ? '' : price(total)}</button></footer>`;
}
function nearby(m) {
  return `<div class="panel"><header><div><h3>Hire workers nearby</h3></div><button class="x" aria-label="Close">${icon('close', '')}</button></header>${nearbyBody(m)}</div>`;
}
function tab(m) {
  const working = m.working + 2;   // two workers elsewhere, so the first tab is never empty in the drawing
  return `<div class="panel roster"><header><div><h3>Your workers</h3></div><button class="x" aria-label="Close">${icon('close', '')}</button></header>
    <div class="tabs" role="tablist"><button role="tab" aria-selected="false">Working <span class="tab-count">${working}</span></button><button role="tab" aria-selected="true">Hire nearby</button></div>
    ${nearbyBody(m)}</div>`;
}

const DRAW = { today, stepper, tap, chips, nearby, tab };

function phoneHtml(flow, m) {
  const list = flow === 'nearby' || flow === 'tab';
  return mapLayer(flow, m, !list) + (list ? '<div class="dim"></div>' : '') + hud(flow, m) + DRAW[flow](m) + (flow === 'chips' || flow === 'stepper' ? toast(m) : '');
}

// ---- interaction, in the single-phone view only ----
function act(phone, e) {
  const b = e.target.closest('button[data-act]'); if (!b || b.disabled) return;
  const m = phone.model, flow = phone.dataset.flow, a = b.dataset.act;
  const settle = (n, place) => setTimeout(() => {
    m.energy -= n * PRICE; m.working += n; m.hired = n; m.phase = 'done'; m.place = place; m.want = 1; draw(phone);
  }, 700);
  if (REPEAT.has(a)) { if (e.detail === 0) count(phone, a, b.dataset.p); return; }   // pointer presses go through hold()
  if (a === 'hire' || a === 'retry') { m.phase = 'hiring'; m.state = ''; settle(Math.min(m.want, Math.floor(m.energy / PRICE))); }
  else if (a === 'hire-n') { m.want = +b.dataset.n; m.phase = 'hiring'; m.state = ''; settle(m.want); }
  else if (a === 'add') { m.energy -= PRICE; m.working++; m.phase = 'idle'; m.state = ''; }
  else if (a === 'undo-last') { m.energy += PRICE; m.working--; }
  else if (a === 'undo') { m.energy += m.hired * PRICE; m.working -= m.hired; m.hired = 0; m.phase = 'idle'; m.done = {}; }
  else if (a === 'collect') m.ready = 0;
  else if (a === 'hire-all') {
    const total = Object.values(m.wants).reduce((x, y) => x + y, 0); m.phase = 'hiring'; m.state = ''; draw(phone);
    setTimeout(() => { m.done = { ...m.wants }; m.energy -= total * PRICE; m.hired = total; m.phase = 'done'; m.place = 'items'; m.wants = { wood: 0, wheat: 0, stone: 0 }; draw(phone); }, 700);
    return;
  }
  draw(phone);
}
// Long-press on + and −: one step on press, then repeats after 0.4 s, speeding up from every 110 ms to
// every 45 ms, and stops on release or when the button greys out (the player's Energy, or zero).
const REPEAT = new Set(['more', 'less', 'p-more', 'p-less']);
function count(phone, a, place) {
  const m = phone.model;
  if (a === 'more') m.want++;
  else if (a === 'less') m.want = Math.max(1, m.want - 1);
  else if (a === 'p-more') m.wants[place]++;
  else if (a === 'p-less') m.wants[place]--;
  draw(phone);
}
function hold(phone, e) {
  const b = e.target.closest('button[data-act]');
  if (!b || b.disabled || !REPEAT.has(b.dataset.act) || e.button > 0) return;
  e.preventDefault();
  const a = b.dataset.act, place = b.dataset.p, sel = `button[data-act="${a}"]` + (place ? `[data-p="${place}"]` : '');
  let delay = 110, timer = 0;
  const stop = () => { clearTimeout(timer); removeEventListener('pointerup', stop); removeEventListener('pointercancel', stop); phone.querySelector(sel)?.classList.remove('held'); };
  const step = () => { const now = phone.querySelector(sel); if (!now || now.disabled) return stop(); count(phone, a, place); phone.querySelector(sel)?.classList.add('held'); };
  addEventListener('pointerup', stop); addEventListener('pointercancel', stop);
  step();
  timer = setTimeout(function tick() { step(); delay = Math.max(45, delay * .85); timer = setTimeout(tick, delay); }, 400);
}
function draw(phone) { phone.innerHTML = phoneHtml(phone.dataset.flow, phone.model); }

function makePhone(flow, state, live) {
  const phone = document.createElement('div');
  phone.className = 'phone'; phone.id = `phone-${flow}-${state}`; phone.dataset.flow = flow;
  phone.model = Object.assign(preset(flow, state), { state });
  phone.setAttribute('role', 'img'); phone.setAttribute('aria-label', `${FLOWS.find(f => f.id === flow).name}, ${STATES.find(s => s.id === state).name}`);
  if (live) { phone.removeAttribute('role'); phone.addEventListener('click', e => act(phone, e)); phone.addEventListener('pointerdown', e => hold(phone, e)); }
  draw(phone);
  return phone;
}

// ---- the page ----
function parse() {
  const h = new URLSearchParams(location.hash.slice(1));
  return { flow: h.get('c') || 'stepper', state: h.get('s') || 'ready', grid: h.get('grid'), capture: h.has('capture'), all: h.has('all') };
}
function render() {
  const r = parse(), stage = document.getElementById('stage');
  document.body.classList.toggle('grid', !!r.grid || r.all);
  document.body.classList.toggle('capture', r.capture);
  stage.innerHTML = '';
  const state = r.grid || r.state;
  const conceptBar = document.getElementById('concepts'), stateBar = document.getElementById('states');
  conceptBar.innerHTML = FLOWS.map(f => `<button role="tab" aria-pressed="${!r.grid && f.id === r.flow}" data-c="${f.id}">${f.name}</button>`).join('');
  stateBar.innerHTML = STATES.map(s => `<button aria-pressed="${s.id === state}" data-s="${s.id}">${s.name}</button>`).join('');
  conceptBar.onclick = e => { const c = e.target.dataset.c; if (c) location.hash = `c=${c}&s=${state}`; };
  stateBar.onclick = e => { const s = e.target.dataset.s; if (s) location.hash = r.grid ? `grid=${s}` : `c=${r.flow}&s=${s}`; };
  document.getElementById('grid-link').href = r.grid ? `#c=stepper&s=${state}` : `#grid=${state}`;
  document.getElementById('grid-link').textContent = r.grid ? 'Back to one flow at a time' : 'Compare all flows in one state';
  if (r.all) {   // capture sheet: every flow in every state
    for (const f of FLOWS) for (const s of STATES) stage.append(frame(f, s.id, false));
    return;
  }
  if (r.grid) { for (const f of FLOWS) stage.append(frame(f, state, false)); return; }
  const f = FLOWS.find(x => x.id === r.flow) || FLOWS[3];
  stage.append(frame(f, state, !r.capture));
  document.getElementById('about').innerHTML = `<span class="concept-tag">${f.tag}</span><h2>${f.name}</h2>${f.text.map(t => `<p>${t}</p>`).join('')}
    <div class="taps"><b>${f.one}</b><span>taps to hire one worker</span><b>${f.five}</b><span>taps to hire five (${f.fiveNote})</span></div>
    ${f.id === 'stepper' ? '<p class="rec"><b>Selected on 2026-09-27</b>, with long-press on + and − and no text that the fields already show.</p>' : ''}
    ${f.id === 'today' ? '' : '<p>Try it: the phone is live in this view. Hire, undo, collect, and change the amounts.</p>'}`;
}
function frame(f, state, live) {
  const fig = document.createElement('figure'); fig.className = 'frame';
  const s = STATES.find(x => x.id === state);
  fig.innerHTML = `<figcaption>${f.name}<small>${f.tag}. ${s.name}</small></figcaption>`;
  fig.append(makePhone(f.id, state, live));
  return fig;
}
addEventListener('hashchange', render);
render();
