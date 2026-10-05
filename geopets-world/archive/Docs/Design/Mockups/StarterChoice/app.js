// Starter choice mockup. One starter takes the stage at a time and dances its style; the round
// buttons switch between them, and the main button names the one it will choose. Placeholder data only.
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // From the capture ladder (dances, what each style wins over) and the rarity draft (where wild ones live).
  const DANCES = { twirl: ['Twirl', '#A2548F'], sway: ['Sway', '#C4552F'], shuffle: ['Shuffle', '#2F7F86'], stomp: ['Stomp', '#7A5A3A'], hop: ['Hop', '#B7851C'] };
  const WINS = { sway: 'twirl', twirl: 'shuffle', shuffle: 'stomp', stomp: 'hop', hop: 'sway' };
  const BIOMES = { meadow: ['Meadow', '#569433'], stonefield: ['Stonefield', '#A7886D'], marsh: ['Marsh', '#687A30'] };
  const STARTERS = [
    { id: 'petalwisp-1', name: 'Petal Bud', dance: 'twirl', biome: 'meadow', when: 'by day',
      lore: 'A bud that floats on sunny breezes and spins like a falling petal when it dances.' },
    { id: 'emberglide-1', name: 'Ember Spark', dance: 'sway', biome: 'stonefield', when: 'by day',
      lore: 'A baby dragon made of warm light. Its flame flickers in time with its sway.' },
    { id: 'tidehaven-1', name: 'Tide Shell', dance: 'shuffle', biome: 'marsh', when: 'by day',
      lore: 'It carries its home on its back and shuffles sideways beneath it, claws held high.' },
  ];
  const SIZES = { default: [412, 883, 'Galaxy S22 Ultra, 412 x 883'], short: [360, 640, 'Short phone, 360 x 640'], tall: [412, 915, 'Tall phone, 412 x 915'] };
  const S = { focus: 0, chosen: null, open: true, size: 'default' };

  const chips = st => {
    const [dn, dc] = DANCES[st.dance];
    const [wn] = DANCES[WINS[st.dance]];
    return `<div class="chips"><span class="chip fill" style="--c:${dc}">Dances ${dn}</span><span class="chip" style="--c:${dc}">Wins over ${wn} dancers</span></div>`;
  };
  const stage = st => {
    const [bn, bc] = BIOMES[st.biome];
    return `<div class="stage" style="--biome:${bc}">
      <div class="floor"><div class="spot"><span class="ground"></span><img class="dancer ${st.dance}" src="assets/wildlings/${st.id}.png" alt="${esc(st.name)}"></div></div>
      <div class="about"><h3>${esc(st.name)}</h3>${chips(st)}<p>${esc(st.lore)}</p>${S.chosen === null ? `<p class="wild">Wild ones live in ${bn}, ${st.when}.</p>` : ''}</div>
    </div>`;
  };

  function render() {
    const sheet = $('#sheet');
    sheet.hidden = !S.open;
    sheet.classList.toggle('joined', S.chosen !== null);
    if (S.chosen === null) {
      const st = STARTERS[S.focus];
      sheet.innerHTML = `<h2>Choose your first Wildling</h2>
        <p class="sub">It will dance for the wild Wildlings you meet on the map.</p>
        ${stage(st)}
        <div class="pick" role="group" aria-label="Starters">${STARTERS.map((x, i) => `<button type="button" data-pick="${i}" aria-pressed="${i === S.focus}"><span class="disc"><img src="assets/wildlings/${x.id}.png" alt=""></span><span>${esc(x.name)}</span></button>`).join('')}</div>
        <button type="button" class="primary" id="choose">Choose ${esc(st.name)}</button>
        <p class="later">You can meet the other two in the wild later.</p>`;
    } else {
      const st = STARTERS[S.chosen];
      const others = STARTERS.filter((_, i) => i !== S.chosen).map(x => x.name);
      sheet.innerHTML = `<h2>${esc(st.name)} joins you</h2>
        <p class="sub">Tap a Wildling on the map to dance for it.</p>
        ${stage(st)}
        <button type="button" class="primary" id="go" style="margin-top:12px">Go to the map</button>
        <p class="later">You can meet ${esc(others[0])} and ${esc(others[1])} in the wild.</p>`;
    }
    $('#caption').textContent = !S.open ? 'The map, once the starter is chosen. Jump to a screen to see it again.'
      : S.chosen === null ? `${STARTERS[S.focus].name} on the stage, dancing its style. The round buttons switch starters; the button names the one it will choose.`
      : `After the choice: one screen that says it has joined and how to use it, then the map.`;
    document.querySelectorAll('#opt-size button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === S.size)));
  }

  function size(key) {
    S.size = key;
    const [W, H] = SIZES[key];
    const p = $('#phone');
    p.style.setProperty('--w', `${W}px`);
    p.style.setProperty('--h', `${H}px`);
    p.style.setProperty('--status', key === 'short' ? '26px' : '32px');
    p.style.setProperty('--gesture', key === 'short' ? '20px' : '24px');
    p.classList.toggle('short', key === 'short');
    render();
  }

  const JUMPS = {
    'Petal Bud': () => Object.assign(S, { focus: 0, chosen: null, open: true }),
    'Ember Spark': () => Object.assign(S, { focus: 1, chosen: null, open: true }),
    'Tide Shell': () => Object.assign(S, { focus: 2, chosen: null, open: true }),
    'Ember Spark chosen': () => Object.assign(S, { focus: 1, chosen: 1, open: true }),
  };
  $('#jumps').innerHTML = Object.keys(JUMPS).map(k => `<button type="button" data-jump="${esc(k)}">${esc(k)}</button>`).join('');
  $('#jumps').addEventListener('click', e => { const b = e.target.closest('[data-jump]'); if (b) { JUMPS[b.dataset.jump](); render(); } });
  $('#opt-size').innerHTML = Object.entries(SIZES).map(([k, v]) => `<button type="button" role="radio" data-v="${k}" aria-checked="${k === S.size}">${v[2]}</button>`).join('');
  $('#opt-size').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) size(b.dataset.v); });
  $('#sheet').addEventListener('click', e => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { S.focus = Number(pick.dataset.pick); render(); return; }
    if (e.target.closest('#choose')) { S.chosen = S.focus; render(); return; }
    if (e.target.closest('#go')) { S.open = false; render(); }
  });

  window.STARTER_UI = {
    size, state: () => ({ focus: S.focus, chosen: S.chosen === null ? null : STARTERS[S.chosen].name, open: S.open, size: S.size }),
    jump: name => { JUMPS[name](); render(); },
  };
  size('default');
  document.documentElement.dataset.ready = 'true';
})();
