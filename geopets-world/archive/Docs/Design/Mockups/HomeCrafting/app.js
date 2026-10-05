(() => {
  'use strict';

  const iconRoot = '../VisualIdentity/assets/icons/';
  const recipes = Object.freeze({
    mill: { name: 'Mill', product: 'flour', label: 'Flour', seconds: 30, ingredients: { wheat: 2 } },
    bakery: { name: 'Bakery', product: 'biscuit', label: 'Biscuit', seconds: 60, ingredients: { flour: 1, egg: 1, water: 1 } }
  });
  const names = { wheat: 'Wheat', flour: 'Flour', egg: 'Egg', water: 'Water', biscuit: 'Biscuit' };
  const fixtures = ['idle', 'mill', 'bakery', 'missing', 'working', 'full', 'ready', 'pending', 'retry', 'arrange', 'invalid', 'world'];
  const initialLayout = () => ({ mill: { x: 35, y: 42, rotation: 0 }, bakery: { x: 65, y: 52, rotation: 0 } });
  const clone = value => JSON.parse(JSON.stringify(value));
  const icon = (name, className = '') => `<img src="${iconRoot}${name}.svg" alt=""${className ? ` class="${className}"` : ''}>`;
  const time = milliseconds => {
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };

  // One timestamp engine owns both stations. Views never own or restart jobs.
  class MockCraftingEngine {
    constructor() {
      this.inventory = { wheat: 12, flour: 4, egg: 3, water: 8, biscuit: 2 };
      this.queues = { mill: [], bakery: [] };
      this.receipts = new Map();
      this.claimedJobs = new Set();
      this.clockOffset = 0;
      this.sequence = 0;
    }
    now() { return Date.now() + this.clockOffset; }
    status(job) {
      const now = this.now();
      return now >= job.finishAt ? 'ready' : now >= job.startAt ? 'working' : 'queued';
    }
    missing(station) {
      return Object.entries(recipes[station].ingredients)
        .filter(([item, count]) => this.inventory[item] < count)
        .map(([item, count]) => ({ item, count: count - this.inventory[item] }));
    }
    canAdd(station) { return this.queues[station].length < 3 && this.missing(station).length === 0; }
    accept(command) {
      if (this.receipts.has(command.requestId)) return this.receipts.get(command.requestId);
      const { station, kind } = command;
      let result;
      if (kind === 'add') {
        if (this.queues[station].length >= 3) return { ok: false, message: 'All three slots are occupied.' };
        if (this.missing(station).length) return { ok: false, message: 'Gather the missing ingredients first.' };
        const recipe = recipes[station];
        const queue = this.queues[station];
        const startAt = Math.max(this.now(), ...queue.map(job => job.finishAt));
        const job = { id: `job-${++this.sequence}`, station, startAt, finishAt: startAt + recipe.seconds * 1000 };
        for (const [item, count] of Object.entries(recipe.ingredients)) this.inventory[item] -= count;
        queue.push(job);
        result = { ok: true, kind, station, jobId: job.id, product: recipe.product };
      } else {
        const index = this.queues[station].findIndex(job => job.id === command.jobId);
        if (index < 0 || this.claimedJobs.has(command.jobId)) return { ok: false, message: 'This batch was already collected.' };
        const job = this.queues[station][index];
        if (this.status(job) !== 'ready') return { ok: false, message: 'This batch is still working.' };
        this.claimedJobs.add(job.id);
        this.queues[station].splice(index, 1);
        this.inventory[recipes[station].product] += 1;
        result = { ok: true, kind, station, jobId: job.id, product: recipes[station].product };
      }
      this.receipts.set(command.requestId, result);
      return result;
    }
    // Fixtures represent already accepted work: their ingredient costs are paid.
    seed(station, finishOffsets) {
      const recipe = recipes[station];
      const now = this.now();
      for (const offset of finishOffsets) {
        const finishAt = now + offset * 1000;
        this.queues[station].push({ id: `job-${++this.sequence}`, station, startAt: finishAt - recipe.seconds * 1000, finishAt });
        for (const [item, count] of Object.entries(recipe.ingredients)) this.inventory[item] -= count;
      }
    }
  }

  const phone = document.getElementById('phone');
  const scene = document.getElementById('scene');
  const controls = document.getElementById('scene-controls');
  const navigation = document.getElementById('navigation');
  const overlayRoot = document.getElementById('overlay-root');
  const notifications = document.getElementById('notifications');
  const baseView = () => ({ scene: 'home', overlay: null, station: null, mode: 'normal' });
  let engine = new MockCraftingEngine();
  let view = baseView();
  let layout = initialLayout();
  let draft = null;
  let selected = 'mill';
  let pending = null;
  let generation = 0;
  let requestSequence = 0;
  let fixture = 'idle';
  let historyDepth = 0;
  let lastSignature = '';
  let returnFocus = null;
  let drag = null;
  let suppressStationClick = false;
  let noticeSequence = 0;
  const notices = [];
  const params = new URLSearchParams(location.search);
  if (params.get('phone') === '1') document.body.classList.add('only');
  phone.dataset.size = params.get('size') === 'compact' ? 'compact' : 'standard';

  function stateUrl() {
    const url = new URL(location.href);
    url.searchParams.set('state', fixture);
    if (phone.dataset.size === 'compact') url.searchParams.set('size', 'compact');
    else url.searchParams.delete('size');
    return url;
  }
  function writeHistory(push) {
    const state = { homeCrafting: generation, view: clone(view), depth: historyDepth };
    history[push ? 'pushState' : 'replaceState'](state, '', stateUrl());
  }
  function changeView(next) {
    if (view.mode === 'arrange' && next.mode !== 'arrange') draft = null;
    if (!view.overlay && next.overlay) returnFocus = document.activeElement?.dataset.focus || null;
    view = next;
    historyDepth += 1;
    writeHistory(true);
    render(true);
  }
  function dismiss() {
    if (!view.overlay && view.mode !== 'arrange' && view.scene !== 'world') return;
    if (historyDepth > 0) history.back();
    else {
      view = { ...view, overlay: null, station: null, mode: 'normal' };
      draft = null;
      writeHistory(false);
      render(true);
    }
  }
  window.addEventListener('popstate', event => {
    const state = event.state;
    if (state?.homeCrafting === generation) {
      if (view.mode === 'arrange' && state.view.mode !== 'arrange') draft = null;
      view = clone(state.view);
      historyDepth = state.depth;
      if (view.mode === 'arrange' && !draft) draft = clone(layout);
    } else {
      view = baseView();
      draft = null;
      historyDepth = 0;
      writeHistory(false);
    }
    render(true);
  });

  function fixtureState(name) {
    generation += 1;
    fixture = fixtures.includes(name) ? name : 'idle';
    engine = new MockCraftingEngine();
    layout = initialLayout();
    draft = null;
    pending = null;
    notices.length = 0;
    selected = 'mill';
    view = baseView();
    historyDepth = 0;
    writeHistory(false);
    const openStation = ['mill', 'working', 'ready'].includes(fixture) ? 'mill' : 'bakery';
    if (fixture === 'missing') engine.inventory.egg = 0;
    if (fixture === 'working' || fixture === 'world') engine.seed('mill', [18, 48]);
    if (fixture === 'full') {
      engine.inventory.egg = 6;
      engine.seed('bakery', [45, 105, 165]);
    }
    if (fixture === 'ready') engine.seed('mill', [-5, 25]);
    if (fixture === 'arrange' || fixture === 'invalid') {
      view.mode = 'arrange';
      draft = clone(layout);
      if (fixture === 'invalid') {
        selected = 'bakery';
        draft.bakery = { x: 38, y: 43, rotation: 0 };
      }
    } else if (fixture === 'world') view.scene = 'world';
    else if (fixture !== 'idle') {
      view.overlay = 'station';
      view.station = openStation;
    }
    if (fixture !== 'idle') { historyDepth = 1; writeHistory(true); }
    if (fixture === 'pending' || fixture === 'retry') {
      pending = { kind: 'add', station: 'bakery', requestId: `request-${++requestSequence}`, status: fixture === 'retry' ? 'retry' : 'sending' };
      if (fixture === 'pending') {
        const snapshot = generation;
        setTimeout(() => {
          if (generation !== snapshot || !pending) return;
          pending.status = 'retry';
          render();
        }, 5000);
      }
    }
    render(true);
  }

  function notify(product, title, message) {
    const id = ++noticeSequence;
    notices.push({ id, product, title, message });
    while (notices.length > 3) notices.shift();
    renderNotices();
    setTimeout(() => {
      const index = notices.findIndex(notice => notice.id === id);
      if (index >= 0) notices.splice(index, 1);
      renderNotices();
    }, 3600);
  }
  function renderNotices() {
    notifications.innerHTML = notices.map(notice => `<div class="notice">${icon(notice.product)}<p><strong>${notice.title}</strong>${notice.message}</p><button data-action="dismiss-notice" data-id="${notice.id}" aria-label="Dismiss notification">${icon('close')}</button></div>`).join('');
  }
  function sendCommand(kind, station, jobId) {
    if (pending) return;
    if (kind === 'add' && !engine.canAdd(station)) return;
    pending = { kind, station, jobId, requestId: `request-${++requestSequence}`, status: 'sending' };
    acknowledge();
  }
  function acknowledge() {
    const command = pending;
    if (!command) return;
    command.status = 'sending';
    const snapshot = generation;
    render();
    setTimeout(() => {
      if (generation !== snapshot || pending !== command) return;
      const result = engine.accept(command);
      pending = null;
      render();
      if (!result.ok) notify('craft', 'Work unchanged', result.message);
      else if (result.kind === 'collect') notify(result.product, `${names[result.product]} ×1`, 'Collected');
      else notify(result.product, `${names[result.product]} ×1`, 'Added to queue');
    }, 650);
  }

  function stationMarkup(station) {
    const recipe = recipes[station];
    const pose = (draft || layout)[station];
    const rows = engine.queues[station];
    const ready = rows.filter(job => engine.status(job) === 'ready').length;
    const active = rows.find(job => engine.status(job) === 'working');
    let badge = '';
    if (ready) badge = `<span class="station-status ready">${ready} ready</span>`;
    else if (active) badge = `<span class="station-status" data-station-countdown="${station}">${time(active.finishAt - engine.now())}</span>`;
    const selectedClass = view.mode === 'arrange' && selected === station ? ` selected${placementValid() ? '' : ' invalid'}` : '';
    return `<button class="station station-${station}${selectedClass}" style="left:${pose.x}%;top:${pose.y}%" data-station="${station}" data-focus="${station}" aria-label="${view.mode === 'arrange' ? 'Select' : 'Open'} ${recipe.name}${ready ? `, ${ready} ready to collect` : ''}"${view.mode === 'arrange' ? ' aria-describedby="arrange-help"' : ''}>
      <img class="station-art" src="assets/${station}.svg" alt="" style="transform:scaleX(${pose.rotation % 2 ? -1 : 1})">
      <span class="station-emblem">${icon(recipe.product)}</span><span class="station-name">${recipe.name}</span>${view.mode === 'arrange' ? '' : badge}
    </button>`;
  }
  function renderScene() {
    if (view.scene === 'world') {
      scene.innerHTML = '<div class="world-scene"></div>';
      controls.innerHTML = '<p class="away-note"><strong>Work carries on at home.</strong>Your buildings keep working while you explore.</p><div class="map-attribution"><span>© Mapbox © OpenStreetMap</span></div>';
      return;
    }
    const arranging = view.mode === 'arrange';
    scene.innerHTML = `<div class="home-stage${view.overlay === 'station' ? ' sheet-open' : ''}${arranging ? ' arranging' : ''}"><img class="island" src="assets/island.svg" alt="A small floating lawn with two crafting buildings">${stationMarkup('mill')}${stationMarkup('bakery')}</div>`;
    if (arranging) {
      controls.innerHTML = `<p class="arrange-instruction" id="arrange-help">Drag a building on the lawn.<br>Arrow keys move the selection.</p><button class="arrange-toggle" data-action="dismiss">Done</button>${arrangementMarkup()}`;
    } else {
      controls.innerHTML = `<button class="arrange-toggle" data-action="arrange" data-focus="arrange"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 1 4 4h-3v5h5V7l4 4-4 4v-3h-5v5h3l-4 4-4-4h3v-5H6v3l-4-4 4-4v3h5V5H8z"/></svg>Arrange</button>${view.overlay ? '' : '<p class="home-hint"><strong>A place to make things.</strong>Tap a building to get started.</p>'}`;
    }
  }
  function renderNav() {
    const destinations = [
      ['profile', 'Profile', 'outer'], ['collection', 'Collection', ''], ['inventory', 'Inventory', ''],
      ['market', 'My Sales', ''], [view.scene === 'home' ? 'world' : 'home', view.scene === 'home' ? 'Visit World' : 'Return Home', 'outer']
    ];
    navigation.innerHTML = destinations.map(([id, label, style]) => `<button class="${style}" data-nav="${id}" data-focus="nav-${id}" aria-label="${label}"${view.overlay === id ? ' aria-current="page"' : ''}><span class="disc">${icon(id)}</span></button>`).join('');
  }
  function queueMarkup(job) {
    const recipe = recipes[job.station];
    const status = engine.status(job);
    const confirmation = pending?.kind === 'collect' && pending.jobId === job.id;
    const detail = status === 'ready' ? 'Ready · holds this slot' : status === 'working' ? 'Working' : 'Queued · starts automatically';
    const value = status === 'working' ? job.finishAt - engine.now() : job.startAt - engine.now();
    return `<div class="queue-row ${status}" data-job="${job.id}">${icon(recipe.product)}<div class="queue-copy"><strong>${recipe.label} ×1</strong><small>${detail}</small></div>${status === 'ready' ? `<button class="collect" data-action="collect" data-station-id="${job.station}" data-job-id="${job.id}" data-focus="collect-${job.id}" aria-label="Collect ${recipe.label.toLowerCase()} from batch ${job.id.replace('job-', '')}"${pending ? ' disabled' : ''}>${confirmation ? 'Confirming…' : 'Collect'}</button>` : `<span class="queue-time" data-job-countdown="${job.id}" aria-label="${status === 'working' ? 'Time remaining' : 'Starts in'}">${status === 'queued' ? 'In ' : ''}${time(value)}</span>`}${status === 'working' ? `<span class="progress" data-progress="${job.id}"></span>` : ''}</div>`;
  }
  function connectionMarkup(station) {
    if (!pending || pending.station !== station) return '';
    const retry = pending.status === 'retry';
    const isCollection = pending.kind === 'collect';
    return `<div class="connection" role="status">${retry ? '' : '<span class="spinner" aria-hidden="true"></span>'}<div><strong>${retry ? 'Waiting for a connection' : isCollection ? 'Confirming collection…' : 'Confirming your work…'}</strong><p>${retry ? 'Retry this request when connected.' : isCollection ? 'Goods stay here until confirmed.' : 'Ingredients stay yours until confirmed.'}</p></div>${retry ? '<button class="retry" data-action="retry" data-focus="retry">Retry</button>' : ''}</div>`;
  }
  function stationSheet() {
    const station = view.station;
    const recipe = recipes[station];
    const missing = engine.missing(station);
    const full = engine.queues[station].length >= 3;
    const isPending = pending?.station === station && pending.kind === 'add';
    const actionLabel = isPending ? (pending.status === 'retry' ? 'Awaiting confirmation' : 'Confirming…') : full ? 'Queue full · 3 / 3' : missing.length ? 'Missing ingredients' : `Add ${recipe.label.toLowerCase()} to queue`;
    const footer = full ? 'Collect finished goods to free a slot.' : pending && pending.station !== station ? `Finish the pending ${recipes[pending.station].name} request first.` : 'One batch · ingredients spent on confirmation';
    return `<section class="station-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <header class="sheet-header">${icon(recipe.product, 'heading-icon')}<div class="sheet-heading"><h2 id="sheet-title">${recipe.name}</h2><p>${station === 'mill' ? 'Grind a little goodness.' : 'Something warm to share.'}</p></div><button class="icon-button" data-action="dismiss" data-focus="close-sheet" aria-label="Close ${recipe.name}">${icon('close')}</button></header>
      <div class="sheet-scroll">${connectionMarkup(station)}<div class="recipe-summary">${icon(recipe.product)}<h3>${recipe.label}<span>×1</span></h3><span class="duration">${icon('timer')}${recipe.seconds}s</span></div>
      <div class="ingredients-heading"><span>Ingredients</span><span>Have / need</span></div><ul class="ingredients">${Object.entries(recipe.ingredients).map(([item, count]) => `<li class="ingredient${engine.inventory[item] < count ? ' missing' : ''}">${icon(item)}<div><span>${names[item]}</span><b>${engine.inventory[item]} / ${count}</b></div></li>`).join('')}</ul>
      ${missing.length ? `<p class="missing-note">Need ${missing.map(item => `${item.count} more ${names[item.item].toLowerCase()}`).join(', ')}.</p>` : ''}
      <div class="queue-heading"><h3>Production queue</h3><span>${engine.queues[station].length} / 3 slots</span></div><div class="queue-list">${engine.queues[station].length ? engine.queues[station].map(queueMarkup).join('') : '<p class="queue-empty">No work yet. Add your first batch.</p>'}</div></div>
      <footer class="sheet-footer"><button class="primary" data-action="add" data-station-id="${station}" data-focus="add"${pending || full || missing.length ? ' disabled' : ''}>${actionLabel}</button><p class="footer-note">${footer}</p></footer>
    </section>`;
  }
  function destinationSheet() {
    const destination = view.overlay;
    if (destination === 'profile') return `<section class="profile-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><h2 id="sheet-title">Your profile</h2><p>Back to your buildings whenever you're ready.</p><button class="icon-button" data-action="dismiss" data-focus="close-sheet">Back</button></section>`;
    const title = { inventory: 'Inventory', collection: 'Collection', market: 'My Sales' }[destination];
    const content = destination === 'inventory' ? `<p>Ingredients and collected goods.</p><div class="inventory-grid">${Object.keys(names).map(item => `<article class="inventory-item">${icon(item)}<b>×${engine.inventory[item]}</b><strong>${names[item]}</strong></article>`).join('')}</div>` : `<div class="availability">${icon(destination)}<h3>${destination === 'collection' ? 'Room for new friends' : 'Nothing on sale'}</h3><p>${destination === 'collection' ? 'Your creatures will be here.' : 'Your listed goods will appear here.'}</p></div>`;
    return `<section class="destination-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><header class="sheet-header">${icon(destination, 'heading-icon')}<div class="sheet-heading"><h2 id="sheet-title">${title}</h2></div><button class="icon-button" data-action="dismiss" data-focus="close-sheet" aria-label="Close ${title}">${icon('close')}</button></header><div class="destination-content">${content}</div></section>`;
  }

  function placementValid() {
    if (!draft) return true;
    const withinLawn = Object.values(draft).every(pose => ((pose.x - 50) / 33) ** 2 + ((pose.y + 12 - 55) / 15) ** 2 <= .94);
    const clear = Math.hypot(draft.mill.x - draft.bakery.x, (draft.mill.y - draft.bakery.y) * 1.15) >= 26;
    return withinLawn && clear;
  }
  function arrangementMarkup() {
    const valid = placementValid();
    return `<section class="arrangement" aria-labelledby="arrange-title"><h2 id="arrange-title">${recipes[selected].name}</h2><p${valid ? '' : ' class="invalid-note"'} data-placement-message>${valid ? 'Keep a little space around each building.' : 'Choose clear lawn, away from the other building.'}</p><div class="arrange-actions"><button data-action="rotate" data-focus="rotate">Turn</button><button data-action="reset-placement" data-focus="reset-placement">Reset</button><button class="place" data-action="place" data-focus="place"${valid ? '' : ' disabled'}>Place here</button></div></section>`;
  }
  function refreshPlacement() {
    const valid = placementValid();
    for (const station of Object.keys(recipes)) {
      const node = scene.querySelector(`[data-station="${station}"]`);
      const pose = draft[station];
      node.style.left = `${pose.x}%`;
      node.style.top = `${pose.y}%`;
      node.classList.toggle('selected', selected === station);
      node.classList.toggle('invalid', selected === station && !valid);
      node.querySelector('.station-art').style.transform = `scaleX(${pose.rotation % 2 ? -1 : 1})`;
    }
    const old = controls.querySelector('.arrangement');
    if (old) old.outerHTML = arrangementMarkup();
  }
  function signature() {
    return JSON.stringify({ generation, view, pending, inventory: engine.inventory, jobs: Object.values(engine.queues).flat().map(job => [job.id, engine.status(job)]) });
  }
  function render(moveFocus = false) {
    const focused = document.activeElement;
    const focusedKey = focused && phone.contains(focused) ? focused.dataset.focus : null;
    const scroll = overlayRoot.querySelector('.sheet-scroll')?.scrollTop || 0;
    renderScene();
    renderNav();
    overlayRoot.innerHTML = view.overlay ? `<div class="modal-layer"><button class="backdrop" data-action="dismiss" aria-label="Close active panel" tabindex="-1"></button>${view.overlay === 'station' ? stationSheet() : destinationSheet()}</div>` : '';
    scene.inert = controls.inert = navigation.inert = !!view.overlay;
    renderNotices();
    document.querySelectorAll('[data-state]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.state === fixture)));
    document.querySelectorAll('.size-picker [data-size]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.size === phone.dataset.size)));
    const scrolling = overlayRoot.querySelector('.sheet-scroll');
    if (scrolling && !moveFocus) scrolling.scrollTop = scroll;
    const dialog = overlayRoot.querySelector('[role="dialog"]');
    if (dialog) dialog.tabIndex = -1;
    const key = moveFocus ? (view.overlay ? null : returnFocus) : focusedKey;
    const target = key ? phone.querySelector(`[data-focus="${key}"]`) : null;
    if (moveFocus && dialog) dialog.focus({ preventScroll: true });
    else if (target && !target.disabled && !target.closest('[inert]')) target.focus({ preventScroll: true });
    else if (focusedKey && view.overlay) overlayRoot.querySelector('[data-focus="close-sheet"]')?.focus({ preventScroll: true });
    if (moveFocus && !view.overlay) returnFocus = null;
    lastSignature = signature();
    updateClock();
  }
  function updateClock() {
    for (const station of Object.keys(recipes)) {
      for (const job of engine.queues[station]) {
        const status = engine.status(job);
        const node = phone.querySelector(`[data-job-countdown="${job.id}"]`);
        if (node) node.textContent = `${status === 'queued' ? 'In ' : ''}${time((status === 'queued' ? job.startAt : job.finishAt) - engine.now())}`;
        const bar = phone.querySelector(`[data-progress="${job.id}"]`);
        if (bar) bar.style.width = `${Math.min(100, Math.max(0, (engine.now() - job.startAt) / (job.finishAt - job.startAt) * 100))}%`;
      }
      const badge = phone.querySelector(`[data-station-countdown="${station}"]`);
      const active = engine.queues[station].find(job => engine.status(job) === 'working');
      if (badge && active) badge.textContent = time(active.finishAt - engine.now());
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.state) { fixtureState(button.dataset.state); return; }
    if (button.closest('.size-picker')) {
      phone.dataset.size = button.dataset.size;
      writeHistory(false);
      render();
      return;
    }
    if (button.dataset.reviewAction === 'advance') {
      engine.clockOffset += 30000;
      render();
      return;
    }
    if (button.dataset.station) {
      if (suppressStationClick) { suppressStationClick = false; return; }
      if (view.mode === 'arrange') { selected = button.dataset.station; refreshPlacement(); }
      else changeView({ ...view, overlay: 'station', station: button.dataset.station });
      return;
    }
    if (button.dataset.nav) {
      const destination = button.dataset.nav;
      if (destination === 'home' || destination === 'world') changeView({ ...baseView(), scene: destination });
      else changeView({ ...view, mode: 'normal', overlay: destination, station: null });
      return;
    }
    switch (button.dataset.action) {
      case 'dismiss': dismiss(); break;
      case 'arrange':
        draft = clone(layout);
        changeView({ ...view, mode: 'arrange', overlay: null, station: null });
        break;
      case 'add': sendCommand('add', button.dataset.stationId); break;
      case 'collect': sendCommand('collect', button.dataset.stationId, button.dataset.jobId); break;
      case 'retry': if (pending?.status === 'retry') acknowledge(); break;
      case 'rotate': draft[selected].rotation = (draft[selected].rotation + 1) % 2; refreshPlacement(); break;
      case 'reset-placement': draft[selected] = clone(layout[selected]); refreshPlacement(); break;
      case 'place':
        if (!placementValid()) break;
        layout = clone(draft);
        notify('check', `${recipes[selected].name} placed`, 'Home arrangement saved');
        dismiss();
        break;
      case 'dismiss-notice': {
        const index = notices.findIndex(notice => notice.id === Number(button.dataset.id));
        if (index >= 0) notices.splice(index, 1);
        renderNotices();
        break;
      }
    }
  });
  scene.addEventListener('pointerdown', event => {
    const station = event.target.closest('[data-station]');
    if (!station || view.mode !== 'arrange' || event.button !== 0) return;
    selected = station.dataset.station;
    refreshPlacement();
    const stage = scene.querySelector('.home-stage').getBoundingClientRect();
    drag = { pointerId: event.pointerId, station: selected, clientX: event.clientX, clientY: event.clientY, x: draft[selected].x, y: draft[selected].y, width: stage.width, height: stage.height, moved: false };
    station.setPointerCapture(event.pointerId);
  });
  scene.addEventListener('pointermove', event => {
    if (!drag || drag.pointerId !== event.pointerId || !draft) return;
    const dx = event.clientX - drag.clientX;
    const dy = event.clientY - drag.clientY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    if (!drag.moved) return;
    draft[selected].x = Math.min(90, Math.max(10, drag.x + dx / drag.width * 100));
    draft[selected].y = Math.min(73, Math.max(20, drag.y + dy / drag.height * 100));
    refreshPlacement();
  });
  function finishDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    suppressStationClick = drag.moved;
    drag = null;
    setTimeout(() => { suppressStationClick = false; }, 0);
  }
  scene.addEventListener('pointerup', finishDrag);
  scene.addEventListener('pointercancel', finishDrag);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' || event.key === 'Backspace' && !event.target.closest('input, textarea, [contenteditable="true"]')) {
      if (view.overlay || view.mode === 'arrange' || view.scene === 'world') { event.preventDefault(); dismiss(); }
      return;
    }
    if (view.overlay && event.key === 'Tab') {
      const focusable = [...overlayRoot.querySelectorAll('button:not(:disabled), [tabindex="0"]')].filter(node => node.tabIndex >= 0);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (view.mode !== 'arrange' || !event.target.closest('.station')) return;
    const direction = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[event.key];
    if (direction) {
      event.preventDefault();
      selected = event.target.dataset.station;
      draft[selected].x = Math.min(90, Math.max(10, draft[selected].x + direction[0]));
      draft[selected].y = Math.min(73, Math.max(20, draft[selected].y + direction[1]));
      refreshPlacement();
    }
  });

  // Read-only QA surface. State changes use the same visible review controls.
  window.HomeCraftingMockup = Object.freeze({
    getState: () => clone({ fixture, view, inventory: engine.inventory, queues: engine.queues, pending, now: engine.now(), layout, draft, selected, placementValid: placementValid() })
  });
  fixtureState(params.get('state') || 'idle');
  setInterval(() => {
    if (drag) return;
    if (signature() !== lastSignature) render();
    else updateClock();
  }, 250);
})();
