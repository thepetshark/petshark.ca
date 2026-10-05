'use strict';
// The Dance-Off capture scene as a playable mockup. One clock drives the flow, the 3D stage (stage.js) and every
// overlay, so a review tool can freeze any moment. Rules and numbers are placeholders.
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

  // ------------------------------------------------------------ content (placeholders)
  const BEAT = 0.6;   // 100 beats a minute
  const BEATS = 8;
  const STYLES = {
    sway: { name: 'Sway', color: '#C4552F' }, twirl: { name: 'Twirl', color: '#A2548F' }, shuffle: { name: 'Shuffle', color: '#2F7F86' },
    stomp: { name: 'Stomp', color: '#7A5A3A' }, hop: { name: 'Hop', color: '#B7851C' },
  };
  const CYCLE = ['sway', 'twirl', 'shuffle', 'stomp', 'hop'];   // each style entrances the families that dance the next
  const lovedBy = style => CYCLE[(CYCLE.indexOf(style) + CYCLE.length - 1) % CYCLE.length];
  const TARGET = { id: 'burrback', family: 'Burrback', form: 'Pebble Burrback', style: 'shuffle' };
  const ROSTER = [
    { id: 'petalwisp', family: 'Petalwisp', form: 'Petal Bud', style: 'twirl', level: 6, charm: 3, rhythm: 4, starter: true },
    { id: 'emberglide', family: 'Emberglide', form: 'Ember Spark', style: 'sway', level: 9, charm: 3, rhythm: 3, starter: true },
    { id: 'tidehaven', family: 'Tidehaven', form: 'Tide Shell', style: 'shuffle', level: 8, charm: 2, rhythm: 3, starter: true },
    { id: 'hollowwing', family: 'Hollowwing', form: 'Hollow Down', style: 'twirl', level: 12, charm: 4, rhythm: 2 },
    { id: 'bramblekin', family: 'Bramblekin', form: 'Bramble Sprout', style: 'hop', level: 5, charm: 2, rhythm: 5 },
    { id: 'grovehorn', family: 'Grovehorn', form: 'Grove Bud', style: 'stomp', level: 7, charm: 3, rhythm: 2 },
  ];
  const byId = Object.fromEntries(ROSTER.map(w => [w.id, w]));
  const LASSOS = [
    { id: 'twine', name: 'Twine lasso', tier: 1, count: 12, color: '#6F7F64', levels: '1 to 8' },
    { id: 'rope', name: 'Rope lasso', tier: 2, count: 4, color: '#4A7F47', levels: '9 to 16' },
    { id: 'braided', name: 'Braided lasso', tier: 3, count: 1, color: '#2F6690', levels: '17 to 24' },
  ];
  const bracket = lv => Math.min(6, Math.floor((lv - 1) / 8) + 1);
  // Any lasso can be thrown; a big level gap fails about 99 % of the time, never 100 %.
  const chance = (tier, lv) => { const d = tier - bracket(lv); return d >= 1 ? 99 : d === 0 ? 90 : d === -1 ? 35 : 1; };
  const band = pct => pct >= 60 ? 'good' : pct >= 10 ? 'risky' : 'hopeless';

  // ------------------------------------------------------------ icons (flat, the game's 64-unit symbol grid)
  const INK = '#24483B';
  const ICON = {
    lasso: c => `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="34" cy="26" rx="20" ry="13" fill="none" stroke="${INK}" stroke-width="9.6"/><ellipse cx="34" cy="26" rx="20" ry="13" fill="none" stroke="${c}" stroke-width="5"/><path d="M17 33C12 42 18 50 12 58" fill="none" stroke="${INK}" stroke-width="8.2" stroke-linecap="round"/><path d="M17 33C12 42 18 50 12 58" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/></svg>`,
    spark: c => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6L38 26L58 32L38 38L32 58L26 38L6 32L26 26Z" fill="${c}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/></svg>`,
    heart: c => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 54C16 43 8 34 8 23C8 15 14 9 21 9C26 9 30 12 32 16C34 12 38 9 43 9C50 9 56 15 56 23C56 34 48 43 32 54Z" fill="${c}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/></svg>`,
    book: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 14C18 10 26 12 32 17C38 12 46 10 56 14V52C46 48 38 50 32 55C26 50 18 48 8 52Z" fill="#FFFDF6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M32 17V55" stroke="${INK}" stroke-width="4"/></svg>`,
    sway: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 56C18 50 20 36 28 28C30 36 36 36 36 30C36 22 30 16 32 8C44 16 50 30 44 44C42 50 38 54 32 56Z" fill="#FFFDF6" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/></svg>`,
    twirl: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 32C32 28 36 28 36 32C36 38 28 38 28 32C28 24 40 24 40 32C40 42 24 42 24 32C24 20 44 20 44 32C44 46 20 46 20 32" fill="none" stroke="#FFFDF6" stroke-width="5" stroke-linecap="round"/></svg>`,
    shuffle: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 32H54M20 22L10 32L20 42M44 22L54 32L44 42" fill="none" stroke="#FFFDF6" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    stomp: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8V38M20 28L32 40L44 28M12 52H52" fill="none" stroke="#FFFDF6" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    hop: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 50C14 22 50 22 52 50M44 16L52 24M52 24L44 32" fill="none" stroke="#FFFDF6" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 50C14 22 38 14 50 22" fill="none" stroke="#FFFDF6" stroke-width="5.5" stroke-linecap="round"/></svg>`,
  };
  const styleChip = s => `<span class="chip style" style="--d:${STYLES[s].color}">${STYLES[s].name}</span>`;
  const lovesChip = s => `<span class="chip">${ICON.heart('#E9A0B0')}Loves ${STYLES[s].name}</span>`;

  // ------------------------------------------------------------ state
  const V = { control: 'flourish', progress: 'ring', size: 'default', level: 7, lasso: 'chance', stay: 'chance' };
  const SIZES = { default: [412, 883, 'Galaxy S22 Ultra, 412 x 883'], short: [360, 640, 'Short phone, 360 x 640'], tall: [412, 915, 'Tall phone, 412 x 915'] };
  let now = 0, frozen = false, lastReal = performance.now();
  const S = {};
  function reset() {
    Object.assign(S, { phase: 'map', t0: now, dancer: null, sheet: null, tried: [], fails: 0, flourish: null, taps: [], moves: [], lassoOpen: false,
      lasso: null, throwHit: false, used: {}, outcome: null, seed: 7 });
  }
  function go(phase) { S.phase = phase; S.t0 = now; }
  const L = () => now - S.t0;
  function rng() { S.seed = (S.seed * 1103515245 + 12345) % 2147483648; return S.seed / 2147483648; }

  // ------------------------------------------------------------ the dance rules (placeholders)
  const beatAt = k => BEAT * (1 + k);            // beat k of 0..7, after one lead-in beat
  const DANCE_END = beatAt(BEATS - 1) + BEAT * 0.9;
  function styleFactor(style) { return style === lovedBy(TARGET.style) ? 1.5 : style === TARGET.style ? 1.0 : 0.75; }
  function levelFactor(d) { return clamp(1 + (d.level - V.level) * 0.05, 0.6, 1.4); }
  const perBeat = d => 8 * styleFactor(d.style) * levelFactor(d);
  const FLOURISH = { perfect: 30, good: 15, miss: 0 };
  const TAP = { perfect: 1.4, good: 1.15, miss: 0.5 };
  function grade(delta) { return delta <= 0.08 ? 'perfect' : delta <= 0.18 ? 'good' : 'miss'; }
  function moveValue(d, style) {
    const mf = style === lovedBy(TARGET.style) ? 1.4 : style === TARGET.style ? 1.0 : 0.6;
    return 28 * mf * (style === d.style ? 1.15 : 0.7) * levelFactor(d);
  }
  // gains per beat (A, B) or per round (C) up to local dance time t
  function gains(t) {
    const d = byId[S.dancer];
    const out = [];
    if (!d) return out;
    if (V.control === 'moves') {
      S.moves.forEach(m => { if (m.t + BEAT * 2 <= t) out.push({ at: m.t + BEAT * 2, g: moveValue(d, m.style) }); });
      return out;
    }
    for (let k = 0; k < BEATS; k++) {
      const at = beatAt(k);
      if (V.control === 'flourish') { if (at <= t) out.push({ at, g: perBeat(d) }); continue; }
      const tap = S.taps.find(x => x.beat === k);
      if (tap) out.push({ at: tap.t, g: perBeat(d) * TAP[tap.grade], grade: tap.grade });
      else if (at + 0.25 <= t) out.push({ at: at + 0.25, g: perBeat(d) * TAP.miss, grade: 'miss' });
    }
    if (V.control === 'flourish' && S.flourish && S.flourish.t <= t) out.push({ at: S.flourish.t, g: FLOURISH[S.flourish.grade], flourish: true });
    return out;
  }
  const trance = t => gains(t).reduce((s, x) => s + x.g, 0);

  // ------------------------------------------------------------ actions
  function tapSighting() { if (S.phase === 'map') go('intro'); }
  function openSheet(id) { if (S.phase === 'choose') S.sheet = id; }
  function closeSheet() { S.sheet = null; }
  function choose(id) { S.sheet = null; S.dancer = id; S.flourish = null; S.taps = []; S.moves = []; go('enter'); }
  function onFlourish() {
    if (S.phase !== 'dance' || V.control !== 'flourish' || S.flourish) return;
    const t = L();
    if (t < beatAt(2)) return;   // still charging
    let best = 9;
    for (let k = 3; k < BEATS; k++) best = Math.min(best, Math.abs(t - beatAt(k)));
    S.flourish = { t, grade: grade(best) };
  }
  function onTap() {
    if (S.phase !== 'dance' || V.control !== 'rhythm') return;
    const t = L();
    for (let k = 0; k < BEATS; k++) {
      if (S.taps.some(x => x.beat === k)) continue;
      const delta = Math.abs(t - beatAt(k));
      if (delta <= 0.25) { S.taps.push({ beat: k, t, grade: grade(delta) }); return; }
    }
  }
  function onMove(style) {
    if (S.phase !== 'dance' || V.control !== 'moves') return;
    const t = L(), last = S.moves[S.moves.length - 1];
    if (last && t < last.t + BEAT * 2.6) return;   // still performing or reacting
    if (S.moves.length >= 3) return;
    S.moves.push({ style, t });
  }
  function openLassos() { if (S.phase === 'entranced') S.lassoOpen = true; }
  function throwLasso(id) {
    if (S.phase !== 'entranced' || !S.lassoOpen) return;
    const l = LASSOS.find(x => x.id === id);
    if ((S.used[id] || 0) >= l.count) return;
    S.used[id] = (S.used[id] || 0) + 1;
    const p = chance(l.tier, V.level) / 100;
    S.lasso = id;
    S.throwHit = V.lasso === 'catch' ? true : V.lasso === 'slip' ? false : rng() < p;
    S.lassoOpen = false;
    go('throw');
  }
  function leave() { reset(); go('map'); sheetKey = modalKey = null; }

  // the clock moves the flow on
  function advance() {
    const t = L();
    switch (S.phase) {
      case 'intro': if (t > 1.3) go('choose'); break;
      case 'enter': if (t > 0.9) go('dance'); break;
      case 'dance': {
        const done = V.control === 'moves' ? (S.moves.length === 3 && t > S.moves[2].t + BEAT * 2.6) : t > DANCE_END;
        if (done) { const ok = trance(t) >= 100; if (!ok) S.fails += 1; go(ok ? 'entranced' : 'unimpressed'); }
        break;
      }
      case 'throw': if (t > 1.15) go(S.throwHit ? 'caught' : 'slip'); break;
      case 'caught': if (t > 1.0) { S.outcome = 'caught'; go('result'); } break;
      case 'slip': if (t > 1.2) { const stays = V.stay === 'stay' ? true : V.stay === 'leave' ? false : rng() < 0.6; if (stays) go('entranced'); else { S.outcome = 'fled'; go('fled'); } } break;
      case 'fled': if (t > 3.0) go('result'); break;
      case 'unimpressed': if (t > 1.7) { const stays = V.stay === 'stay' ? true : V.stay === 'leave' ? false : S.fails < 2 && rng() < 0.6; if (stays) { S.tried.push(S.dancer); go('stays'); } else { S.outcome = 'stormed'; go('storm'); } } break;
      case 'storm': if (t > 3.4) go('result'); break;
    }
  }

  // ------------------------------------------------------------ layout helpers
  let W = 412, H = 883;
  function coverPoint(imgW, imgH, fx, fy) {
    const s = Math.max(W / imgW, H / imgH);
    return [fx * imgW * s - (imgW * s - W) / 2, fy * imgH * s - (imgH * s - H) / 2, s];
  }
  function setSize(key) {
    V.size = key;
    [W, H] = SIZES[key];
    const phone = $('#phone');
    phone.style.setProperty('--w', `${W}px`);
    phone.style.setProperty('--h', `${H}px`);
    phone.style.setProperty('--status', key === 'short' ? '26px' : '32px');
    phone.style.setProperty('--gesture', key === 'short' ? '20px' : '24px');
    if (window.Stage.ready) window.Stage.resize(W, H);
  }

  // ------------------------------------------------------------ rendering: the 3D stage
  function stagePose() {
    const t = L();
    const pose = { beat: BEAT, target: { id: TARGET.id, mode: 'idle', t: now }, dancer: null };
    const d = S.dancer && byId[S.dancer];
    const dancer = (mode, tt, style) => ({ id: d.id, mode, t: tt, style: style || d.style });
    switch (S.phase) {
      case 'intro': pose.target = t < 0.55 ? { id: TARGET.id, visible: false, t: 0 } : { id: TARGET.id, mode: 'spawn', t: t - 0.55 }; break;
      case 'choose': case 'stays': pose.target.mode = S.phase === 'stays' ? 'bored' : 'idle'; break;
      case 'enter': pose.dancer = dancer('enter', t); break;
      case 'dance': {
        const g = gains(t), last = g.filter(x => !x.flourish).slice(-1)[0];
        pose.target.mode = !last ? 'idle' : last.g >= 10 ? 'impressed' : last.g < 6.5 ? 'bored' : 'idle';
        pose.target.t = t;
        if (V.control === 'moves') {
          const m = S.moves[S.moves.length - 1];
          pose.dancer = m && t < m.t + BEAT * 2 ? dancer('dance', t - m.t, m.style) : dancer('idle', t);
        } else if (S.flourish && t >= S.flourish.t && t < S.flourish.t + BEAT * 1.6) {
          pose.dancer = dancer('flourish', t - S.flourish.t);
        } else {
          pose.dancer = t >= BEAT ? dancer('dance', t - BEAT) : dancer('idle', t);
        }
        break;
      }
      case 'entranced': case 'throw': case 'slip':
        pose.target = { id: TARGET.id, mode: 'entranced', t: now };
        pose.dancer = dancer(S.phase === 'entranced' ? 'proud' : 'idle', t);
        break;
      case 'caught': pose.target = { id: TARGET.id, mode: 'captured', t }; pose.dancer = dancer('proud', t); break;
      case 'unimpressed': pose.target = { id: TARGET.id, mode: 'shake', t }; pose.dancer = dancer('sad', t); break;
      case 'storm': case 'fled': pose.target = { id: TARGET.id, mode: 'leave', t }; pose.dancer = dancer('sad', t); break;
      case 'result':
        pose.target = { id: TARGET.id, visible: false, t: 0 };
        if (d) pose.dancer = dancer(S.outcome === 'caught' ? 'proud' : 'sad', t);
        break;
    }
    if (pose.target && pose.target.visible === false) pose.target.mode = 'idle';
    return pose;
  }

  // ------------------------------------------------------------ rendering: overlays (trance ring, emotes, lasso)
  function ringPath(pts, from, to) {
    const n = pts.length - 1, a = Math.floor(from * n), b = Math.max(a + 1, Math.round(to * n));
    return pts.slice(a, b + 1).map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
  }
  function drawFx() {
    const fx = $('#fx');
    const t = L();
    const d = S.dancer && byId[S.dancer];
    let html = '';
    const showRing = V.progress === 'ring' && d && ['dance', 'entranced', 'throw', 'slip', 'unimpressed'].includes(S.phase);
    if (showRing) {
      const pts = window.Stage.project('target', 'ring');
      const p = S.phase === 'dance' ? clamp(trance(t) / 100, 0, 1) : S.phase === 'unimpressed' ? clamp(trance(DANCE_END + 99) / 100, 0, 1) * (1 - ease(t / 1.2)) : 1;
      const col = STYLES[d.style].color;
      const full = ringPath(pts, 0, 1);
      html += `<path d="${full}" fill="none" stroke="${INK}" stroke-width="14" stroke-linejoin="round" opacity=".9"/><path d="${full}" fill="none" stroke="#FFFDF6" stroke-width="9" stroke-linejoin="round"/>`;
      if (p > 0.005) html += `<path d="${ringPath(pts, 0, p)}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    // emotes above the target: notes when a beat pleases it, dots when it bores it, hearts once entranced
    const head = window.Stage.project('target', 'head');
    const emotes = [];
    if (S.phase === 'dance') gains(t).forEach((x, i) => { if (!x.flourish) emotes.push({ age: t - x.at, kind: x.g >= 10 ? 'note' : x.g < 6.5 ? 'dots' : null, i }); });
    if (['entranced', 'throw', 'slip'].includes(S.phase)) for (let k = 0; k < 4; k++) emotes.push({ age: ((now + k * 0.45) % 1.8), kind: 'heart', i: k });
    if (S.phase === 'unimpressed') emotes.push({ age: t * 0.8, kind: 'cross', i: 0 });
    const big = V.progress === 'reactions' ? 1.35 : 1;
    emotes.forEach(e => {
      if (!e.kind || e.age < 0 || e.age > 1.4) return;
      const x = head[0] + ((e.i * 37) % 60 - 30) * 0.8, y = head[1] + 4 - e.age * 30, o = 1 - ease((e.age - 0.9) / 0.5), r = 15 * big;
      const sym = e.kind === 'note' ? `<path d="M-3 6V-8L7 -10V4" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><circle cx="-5.5" cy="6" r="3.2" fill="${INK}"/><circle cx="4.5" cy="4" r="3.2" fill="${INK}"/>`
        : e.kind === 'dots' ? `<circle cx="-6" cy="0" r="2.3" fill="${INK}"/><circle cx="0" cy="0" r="2.3" fill="${INK}"/><circle cx="6" cy="0" r="2.3" fill="${INK}"/>`
        : e.kind === 'cross' ? `<path d="M-6 -6L6 6M6 -6L-6 6" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
        : `<path d="M0 8C-7 3 -10 0 -10 -4C-10 -8 -6 -10 -3.5 -10C-2 -10 -0.6 -9 0 -7.6C0.6 -9 2 -10 3.5 -10C6 -10 10 -8 10 -4C10 0 7 3 0 8Z" fill="#E9A0B0" stroke="${INK}" stroke-width="2"/>`;
      html += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${big})" opacity="${o.toFixed(2)}"><circle r="${15}" fill="#FFFDF6" stroke="${INK}" stroke-width="2.6"/>${sym}</g>`;
    });
    // the lasso flies from the Capture button to the target and tightens
    if (['throw', 'caught', 'slip'].includes(S.phase) && S.lasso) {
      const l = LASSOS.find(x => x.id === S.lasso);
      const cb = $('#capture'), sr = $('#screen').getBoundingClientRect(), br = cb ? cb.getBoundingClientRect() : null;
      const start = br ? [br.left - sr.left + br.width / 2, br.top - sr.top + br.height / 2] : [W - 50, H - 90], body = window.Stage.project('target', 'head');
      const feet = window.Stage.project('target', 'feet');
      const mid = [(body[0] + feet[0]) / 2, body[1] * 0.45 + feet[1] * 0.55];
      const k = S.phase === 'throw' ? ease(t / 0.7) : 1;
      const cx = start[0] + (mid[0] - start[0]) * k, cy = start[1] + (mid[1] - start[1]) * k - Math.sin(k * Math.PI) * 120;
      let rx = 42 - 10 * k, ry = 16;
      let lift = 0, op = 1;
      if (S.phase === 'throw' && t > 0.7) rx = 32 - 12 * ease((t - 0.7) / 0.4);
      if (S.phase === 'caught') { rx = 20 - 14 * ease(t / 0.5); op = 1 - ease((t - 0.5) / 0.4); }
      if (S.phase === 'slip') { rx = 32 + 18 * ease(t / 0.3); lift = -70 * ease(t / 0.8); op = 1 - ease((t - 0.4) / 0.6); }
      const tail = `M${(cx - rx).toFixed(1)} ${(cy + lift).toFixed(1)} Q${((cx + start[0]) / 2 - 30).toFixed(1)} ${((cy + start[1]) / 2 + 40).toFixed(1)} ${start[0]} ${start[1]}`;
      html += `<g opacity="${op.toFixed(2)}"><path d="${tail}" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="${tail}" fill="none" stroke="${l.color}" stroke-width="4.5" stroke-linecap="round"/>
        <ellipse cx="${cx.toFixed(1)}" cy="${(cy + lift).toFixed(1)}" rx="${Math.max(4, rx).toFixed(1)}" ry="${ry}" fill="none" stroke="${INK}" stroke-width="9"/><ellipse cx="${cx.toFixed(1)}" cy="${(cy + lift).toFixed(1)}" rx="${Math.max(4, rx).toFixed(1)}" ry="${ry}" fill="none" stroke="${l.color}" stroke-width="5"/></g>`;
      if (S.phase === 'caught') {
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2, r = 20 + ease(t / 0.8) * 60;
          html += `<g transform="translate(${(mid[0] + Math.cos(a) * r).toFixed(1)} ${(mid[1] + Math.sin(a) * r * 0.7).toFixed(1)}) scale(${(0.5 * (1 - ease(t / 1))).toFixed(2)})"><path d="M0 -14L4 -4L14 0L4 4L0 14L-4 4L-14 0L-4 -4Z" fill="#F2CF5A" stroke="${INK}" stroke-width="2.4"/></g>`;
        }
      }
    }
    // the flourish burst
    if (S.phase === 'dance' && S.flourish && t >= S.flourish.t && t < S.flourish.t + 0.9 && S.flourish.grade !== 'miss') {
      const dh = window.Stage.project('dancer', 'head'), k = (t - S.flourish.t) / 0.9;
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2, r = 16 + k * 70;
        html += `<g transform="translate(${(dh[0] + Math.cos(a) * r).toFixed(1)} ${(dh[1] + 30 + Math.sin(a) * r).toFixed(1)}) scale(${(0.55 * (1 - k)).toFixed(2)})"><path d="M0 -14L4 -4L14 0L4 4L0 14L-4 4L-14 0L-4 -4Z" fill="${STYLES[d.style].color}" stroke="${INK}" stroke-width="2.4"/></g>`;
      }
    }
    fx.setAttribute('viewBox', `0 0 ${W} ${H}`);
    fx.innerHTML = html;
  }

  // ------------------------------------------------------------ rendering: the interface
  let dockKey = '', plateKey = '', sheetKey = '', modalKey = '';
  function plate() {
    const key = `${S.phase}|${V.progress}|${V.level}`;
    if (key !== plateKey) {
      plateKey = key;
      $('#plate').innerHTML = `<h3>${TARGET.form}</h3><div class="chips"><span class="chip">Level ${V.level}</span>${styleChip(TARGET.style)}<span class="chip" title="From your library notes">${ICON.book()}Loves ${STYLES[lovedBy(TARGET.style)].name}</span></div>${V.progress === 'bar' ? '<div class="meter" id="meter"><i></i></div>' : ''}`;
    }
    const m = $('#meter i');
    if (m) {
      const d = S.dancer && byId[S.dancer];
      const p = S.phase === 'dance' ? trance(L()) : ['entranced', 'throw', 'slip', 'caught'].includes(S.phase) ? 100 : S.phase === 'unimpressed' ? trance(DANCE_END + 99) * (1 - ease(L() / 1.2)) : 0;
      m.style.width = `${clamp(p, 0, 100)}%`;
      m.parentElement.style.setProperty('--d', d ? STYLES[d.style].color : STYLES.twirl.color);
    }
  }
  function card(w) {
    const loved = w.style === lovedBy(TARGET.style);
    return `<button type="button" class="card${S.tried.includes(w.id) ? ' tried' : ''}" data-card="${w.id}">${loved ? `<span class="chip loved loved-chip">${ICON.heart('#FFFDF6')}Loved</span>` : ''}<span class="disc"><img src="assets/portraits/${w.id}.png" alt=""></span><strong>${w.family}</strong><span class="lv">Level ${w.level}</span>${styleChip(w.style)}</button>`;
  }
  function dock() {
    const d = S.dancer && byId[S.dancer];
    const key = `${S.phase}|${V.control}|${S.lassoOpen}|${S.dancer}|${S.tried.join()}|${S.moves.length}|${JSON.stringify(S.used)}|${V.level}`;
    if (key !== dockKey) {
      dockKey = key;
      let html = '';
      const capture = (active, big) => `<div class="capture-wrap"><button type="button" class="capture${big ? ' big' : ''}" id="capture" ${active ? '' : 'disabled'} aria-label="Capture">${ICON.lasso(active ? '#FFFDF6' : '#E6E8DE')}</button><span class="ctl-label">Capture</span></div>`;
      switch (S.phase) {
        case 'choose':
          html = `<div class="box"><h4>Choose a dancer</h4><div class="cards">${ROSTER.map(card).join('')}</div></div>`;
          break;
        case 'stays':
          html = `<div class="box"><h4>Burrback is still here</h4><p style="margin-bottom:10px">It didn't care for that. Try another dancer before it wanders off?</p><div class="cards">${ROSTER.map(card).join('')}</div></div>`;
          break;
        case 'enter': case 'dance': {
          let ctl = '';
          if (V.control === 'flourish') ctl = `<div><div class="flourish"><svg class="ring" viewBox="-58 -58 116 116" id="fring"></svg><button type="button" id="flourish" aria-label="Flourish">${ICON.spark(d ? STYLES[d.style].color : '#fff')}</button></div><div class="ctl-label" id="fl-label"></div></div>`;
          if (V.control === 'rhythm') ctl = `<div style="width:190px"><button type="button" class="tap-zone" id="tapzone" aria-label="Tap on the beat"><div class="track" id="track"><span class="hit"></span></div></button><div class="ctl-label" id="fl-label">Tap on each beat</div></div>`;
          if (V.control === 'moves') ctl = `<div style="width:236px"><div class="moves" id="moves">${CYCLE.map(s => `<button type="button" class="move" data-move="${s}" style="--d:${STYLES[s].color}"><span class="face">${ICON[s]()}</span>${STYLES[s].name}</button>`).join('')}</div><div class="ctl-label" id="fl-label"></div></div>`;
          html = `<div class="box"><div class="dance"><div class="beats" id="beats" style="--d:${d ? STYLES[d.style].color : '#999'}"></div>${ctl}${capture(false)}</div></div>`;
          if (V.control === 'moves') html = `<div class="box"><div class="moves" id="moves">${CYCLE.map(s => `<button type="button" class="move" data-move="${s}" style="--d:${STYLES[s].color}"><span class="face">${ICON[s]()}</span>${STYLES[s].name}</button>`).join('')}</div><div class="moves-row"><div class="beats" id="beats" style="--d:${d ? STYLES[d.style].color : '#999'};max-width:60px"></div><div class="ctl-label" id="fl-label"></div>${capture(false)}</div></div>`;
          break;
        }
        case 'entranced': case 'throw': case 'caught': case 'slip': {
          const active = S.phase === 'entranced';
          const msg = active ? (S.lassoOpen ? 'Pick a lasso<small>Its chance shows on the right</small>' : 'Burrback is entranced<small>Throw a lasso while it lasts</small>') : S.phase === 'slip' ? 'It slipped!' : 'Throwing...';
          const list = active && S.lassoOpen ? `<div class="lassos">${LASSOS.map(l => { const left = l.count - (S.used[l.id] || 0), pct = chance(l.tier, V.level), b = band(pct); return `<button type="button" class="lasso ${b}" data-lasso="${l.id}" ${left ? '' : 'disabled'} style="--c:var(--${b})">${ICON.lasso(b === 'hopeless' ? '#C9CCC3' : l.color)}<span><strong>${l.name}</strong><small>Levels ${l.levels}, ${left} left</small></span><span class="pct">${pct} %</span></button>`; }).join('')}</div>` : '';
          html = `${list}<div class="box"><div class="dance"><div class="beats" id="beats" style="--d:${d ? STYLES[d.style].color : '#999'}"></div><div class="entranced-msg">${msg}</div>${capture(active)}</div></div>`;
          break;
        }
      }
      $('#dock').innerHTML = html;
    }
    // moving parts
    if (['entranced', 'throw', 'caught', 'slip'].includes(S.phase) && $('#beats')) $('#beats').innerHTML = Array.from({ length: V.control === 'moves' ? 3 : BEATS }, () => '<i class="on"></i>').join('');
    if (['enter', 'dance'].includes(S.phase) && d) {
      const t = S.phase === 'dance' ? L() : 0;
      const beats = $('#beats');
      if (beats) {
        const n = V.control === 'moves' ? 3 : BEATS, done = V.control === 'moves' ? S.moves.length : [...Array(BEATS).keys()].filter(k => beatAt(k) <= t).length;
        beats.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join('');
      }
      const label = $('#fl-label');
      if (V.control === 'flourish') {
        const ring = $('#fring');
        const charge = clamp((t - BEAT) / (beatAt(2) - BEAT), 0, 1);
        const col = STYLES[d.style].color;
        const c = 2 * Math.PI * 50;
        let svg = `<circle r="50" fill="none" stroke="#D5DDC9" stroke-width="7"/><circle r="50" fill="none" stroke="${col}" stroke-width="7" stroke-dasharray="${(c * (S.flourish ? 1 : charge)).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90)" stroke-linecap="round"/>`;
        if (!S.flourish && t >= beatAt(2) && t < DANCE_END) {
          // the beat ring closes on the button each beat; tap as it meets the edge
          const k = [3, 4, 5, 6, 7].find(b => t <= beatAt(b) + 0.12);
          if (k !== undefined) { const u = clamp((beatAt(k) - t) / BEAT, -0.2, 1); svg += `<circle r="${(44 + u * 30).toFixed(1)}" fill="none" stroke="${INK}" stroke-width="3.5" opacity="${(1 - Math.max(0, u - 0.8) * 5).toFixed(2)}"/>`; }
        }
        ring.innerHTML = svg;
        const f = S.flourish;
        label.textContent = f ? { perfect: 'Perfect flourish!', good: 'Good flourish', miss: 'Missed the beat' }[f.grade] : t < beatAt(2) ? 'Charging...' : t < DANCE_END ? 'Tap on the beat!' : '';
        $('#flourish').disabled = !!f || t < beatAt(2);
      }
      if (V.control === 'rhythm') {
        const track = $('#track');
        const col = STYLES[d.style].color;
        let marks = '<span class="hit"></span>';
        for (let k = 0; k < BEATS; k++) {
          const x = 34 + (beatAt(k) - t) * 150;
          if (x < -20 || x > 230) continue;
          marks += `<span class="mk${S.taps.some(z => z.beat === k) ? ' done' : ''}" style="left:${x.toFixed(1)}px;--d:${col}"></span>`;
        }
        track.innerHTML = marks;
        const lastTap = S.taps[S.taps.length - 1];
        label.textContent = lastTap && t - lastTap.t < 0.5 ? { perfect: 'Perfect!', good: 'Good', miss: 'Off beat' }[lastTap.grade] : 'Tap on each beat';
      }
      if (V.control === 'moves') {
        const last = S.moves[S.moves.length - 1];
        const busy = last && t < last.t + BEAT * 2.6;
        document.querySelectorAll('.move').forEach(b => { b.disabled = S.phase !== 'dance' || busy || S.moves.length >= 3; });
        label.textContent = S.moves.length >= 3 && busy ? '' : busy ? `${byId[S.dancer].family} dances ${STYLES[last.style].name}` : `Round ${S.moves.length + 1} of 3: pick a move`;
      }
    }
  }
  function sheet() {
    const key = S.sheet || '';
    if (key === sheetKey) return;
    sheetKey = key;
    const el = $('#sheet');
    document.querySelectorAll('.scrim').forEach(s => s.remove());
    if (!S.sheet) { el.hidden = true; return; }
    const w = byId[S.sheet];
    const loved = w.style === lovedBy(TARGET.style), same = w.style === TARGET.style;
    const hint = loved ? `Burrback loves ${STYLES[w.style].name}. ${w.family} dances ${STYLES[w.style].name}: a strong match.`
      : same ? `${w.family} dances Shuffle, like Burrback. Burrback loves Twirl more.`
      : `${w.family} dances ${STYLES[w.style].name}. Burrback isn't moved much by ${STYLES[w.style].name}; it loves Twirl.`;
    const dots = n => '<span class="dots">' + '●'.repeat(n) + '○'.repeat(5 - n) + '</span>';
    el.innerHTML = `<div class="top"><span class="disc"><img src="assets/portraits/${w.id}.png" alt=""></span><div><h3>${w.family}</h3><div class="chips">${styleChip(w.style)}<span class="chip">Level ${w.level}</span>${w.starter ? '<span class="chip">Starter</span>' : ''}</div><p class="note" style="margin:6px 0 0">${w.form}</p></div></div>
      <dl class="stats"><dt>Charm</dt><dd>${dots(w.charm)}</dd><dt>Rhythm</dt><dd>${dots(w.rhythm)}</dd></dl>
      <p class="hint${loved ? ' match' : ''}">${esc(hint)}</p><div class="actions"><button type="button" class="btn" id="sheet-back">Back</button><button type="button" class="btn primary" id="sheet-choose">Choose</button></div>`;
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.addEventListener('click', closeSheet);
    el.before(scrim);
    el.hidden = false;
  }
  function modal() {
    const key = S.phase === 'result' ? S.outcome : '';
    if (key === modalKey) return;
    modalKey = key;
    const el = $('#modal');
    if (!key) { el.hidden = true; el.innerHTML = ''; return; }
    const d = S.dancer && byId[S.dancer];
    const copy = {
      caught: [`Burrback joined you!`, `A new ${TARGET.form} for your team and your library.`, `<span class="chip">Level ${V.level}</span>${styleChip(TARGET.style)}<span class="chip">Your 2nd Burrback</span>`, 'burrback'],
      fled: ['Burrback wandered off', 'The lasso slipped, and it snapped out of its trance.', lovesChip('twirl'), 'burrback'],
      stormed: ['Burrback stormed off', d ? `It wasn't impressed by ${d.family}'s ${STYLES[d.style].name}. Burrback loves Twirl.` : 'It wasn\'t impressed.', lovesChip('twirl'), 'burrback'],
    }[key];
    el.innerHTML = `<div class="result" role="dialog" aria-label="${esc(copy[0])}"><span class="disc"><img src="assets/portraits/${copy[3]}.png" alt=""></span><h3>${copy[0]}</h3><p>${copy[1]}</p><div class="chips">${copy[2]}</div><div class="actions"><button type="button" class="btn primary" id="to-map">Back to the map</button></div></div>`;
    el.hidden = false;
  }
  function banner() {
    const t = L();
    const b = $('#banner');
    let text = '', k = 0;
    if (S.phase === 'dance' && t < BEAT * 1.4) { text = 'Dance!'; k = t / (BEAT * 1.4); }
    if (S.phase === 'entranced' && t < 1.4) { text = 'Entranced!'; k = t / 1.4; }
    if (S.phase === 'unimpressed') { text = 'Not impressed'; k = t / 1.7; }
    if (S.phase === 'slip' && t > 0.3) { text = 'It slipped!'; k = (t - 0.3) / 0.9; }
    if (!text) { b.style.opacity = 0; return; }
    b.textContent = text;
    const inn = ease(k / 0.15), out = 1 - ease((k - 0.75) / 0.25);
    b.style.opacity = Math.min(inn, out).toFixed(2);
    b.style.transform = `translate(-50%, -50%) scale(${(0.85 + 0.15 * inn).toFixed(3)})`;
  }
  function mapLayer() {
    const map = $('#map'), scene = $('#scene');
    const t = L();
    const inScene = S.phase !== 'map';
    const k = S.phase === 'intro' ? ease((t - 0.1) / 0.7) : inScene ? 1 : 0;
    map.style.display = inScene && k >= 1 ? 'none' : '';
    map.style.opacity = (1 - k).toFixed(3);
    map.style.transform = `scale(${(1 + k * 0.55).toFixed(3)})`;
    scene.hidden = !inScene;
    scene.style.opacity = S.phase === 'intro' ? ease((t - 0.3) / 0.6).toFixed(3) : 1;
    if (!inScene || S.phase === 'intro') {
      const [x, y] = coverPoint(390, 844, 0.3, 0.655);
      const s = $('#sighting');
      s.style.left = `${x.toFixed(1)}px`;
      s.style.top = `${(y + Math.sin(now * 2.4) * 2.5).toFixed(1)}px`;
      const p = (now % 1.6) / 1.6;
      $('#pulse').style.transform = `scale(${(0.6 + p * 0.9).toFixed(3)})`;
      $('#pulse').style.opacity = (1 - p).toFixed(3);
      map.style.transformOrigin = `${x}px ${y}px`;
    }
  }
  const CAPTION = {
    map: 'A Wildling stands in the open on the map, not hidden, no footprints. Tap it.',
    intro: 'The camera drops to street level: the Dance-Off happens right on the map.',
    choose: 'Pick a dancer from your Wildlings. Tap a card for its stats and a hint; the Loved badge marks the style Burrback loves.',
    enter: 'Your Wildling takes its place across from Burrback.',
    dance: 'The dance: eight beats. Watch Burrback react, and use the selected control.',
    entranced: 'Entranced. The Capture button wakes up; tap it to see your lassos and their chances.',
    throw: 'The lasso flies.', caught: 'Caught.', slip: 'The lasso slipped.',
    unimpressed: 'Not impressed. It may stay for one more dancer, or storm off.',
    stays: 'It stayed: pick another dancer. Tried dancers are dimmed.',
    storm: 'It storms off.', fled: 'It snapped out of the trance and wanders off.', result: 'The result.',
  };
  function readout() {
    const d = S.dancer && byId[S.dancer];
    const rows = [['Moment', S.phase], ['Burrback', `level ${V.level}, dances Shuffle, loves Twirl`]];
    if (d) {
      rows.push(['Dancer', `${d.family}, level ${d.level}, ${STYLES[d.style].name}`]);
      if (V.control !== 'moves') rows.push(['Per beat', `${perBeat(d).toFixed(1)} (style x${styleFactor(d.style)}, level x${levelFactor(d).toFixed(2)})`]);
      const tt = S.phase === 'dance' ? L() : DANCE_END + 99;
      rows.push(['Trance', `${Math.round(trance(tt))} of 100`]);
      if (S.flourish) rows.push(['Flourish', `${S.flourish.grade}, +${FLOURISH[S.flourish.grade]}`]);
    }
    rows.push(['Lassos', LASSOS.map(l => `${l.name.split(' ')[0]} ${chance(l.tier, V.level)} %`).join(', ')]);
    $('#readout').innerHTML = `<h2>Numbers behind this moment</h2><dl>${rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl><p class="note" style="margin-top:8px">Placeholders: 8 beats at 100 a minute; a loved style fills 1.5 times faster; a perfect flourish adds 30; entranced at 100.</p>`;
  }

  // ------------------------------------------------------------ frame loop
  let lastReadout = '';
  function frame() {
    const real = performance.now();
    if (!frozen) now += Math.min(0.05, (real - lastReal) / 1000);
    lastReal = real;
    advance();
    window.Stage.targetId = TARGET.id;
    window.Stage.dancerId = S.dancer;
    mapLayer();
    if (S.phase !== 'map') {
      window.Stage.render(stagePose());
      drawFx();
      plate();
      dock();
      banner();
    }
    sheet();
    modal();
    const cap = CAPTION[S.phase] || '';
    if ($('#caption').textContent !== cap) $('#caption').textContent = cap;
    const ro = `${S.phase}|${S.dancer}|${Math.round(S.phase === 'dance' ? trance(L()) : 0)}|${V.level}|${S.flourish && S.flourish.grade}`;
    if (ro !== lastReadout) { lastReadout = ro; readout(); }
    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------ review controls
  const OPTIONS = {
    control: [['flourish', 'Flourish', 'Your Wildling dances by itself; you release one charged move on the beat.'],
      ['rhythm', 'Tap the rhythm', 'Tap on each of the eight beats.'],
      ['moves', 'Pick the moves', 'Three rounds: choose which style to dance each time.']],
    progress: [['ring', 'Trance ring', 'A ring on the ground round Burrback fills in your dancer\'s colour.'],
      ['bar', 'Meter bar', 'A bar under Burrback\'s name fills.'],
      ['reactions', 'Reactions only', 'No meter: read Burrback\'s notes, dots and hearts.']],
    size: Object.entries(SIZES).map(([k, v]) => [k, v[2], '']),
    lasso: [['chance', 'Lasso: chance'], ['catch', 'Always catch'], ['slip', 'Always slip']],
    stay: [['chance', 'After a fail: chance'], ['stay', 'It stays'], ['leave', 'It leaves']],
  };
  function options(id, key, list) {
    const el = $(id);
    el.innerHTML = list.map(([v, label, sub]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${V[key] === v}">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</button>`).join('');
    el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      if (key === 'size') setSize(b.dataset.v); else V[key] = b.dataset.v;
      el.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', x === b));
      if (key === 'control' && ['enter', 'dance'].includes(S.phase)) choose(S.dancer);
      plateKey = dockKey = '';
    }));
  }
  const JUMPS = {
    'Map': () => leave(),
    'Choose a dancer': () => { reset(); go('choose'); S.t0 = now - 2; },
    'Dancer info': () => { reset(); go('choose'); S.sheet = 'petalwisp'; },
    'Dancing': () => { reset(); S.dancer = 'petalwisp'; go('dance'); S.t0 = now - (V.control === 'moves' ? BEAT * 3.2 : beatAt(3) + 0.25); if (V.control === 'moves') S.moves = [{ style: 'twirl', t: BEAT * 0.4 }]; if (V.control === 'rhythm') S.taps = [0, 1, 2].map(k => ({ beat: k, t: beatAt(k) + (k === 1 ? 0.1 : 0.02), grade: k === 1 ? 'good' : 'perfect' })); },
    'Flourish': () => { reset(); S.dancer = 'petalwisp'; go('dance'); S.t0 = now - (beatAt(4) + 0.35); S.flourish = { t: beatAt(4) + 0.03, grade: 'perfect' }; },
    'Entranced': () => { reset(); S.dancer = 'petalwisp'; S.flourish = { t: beatAt(4), grade: 'perfect' }; go('entranced'); S.t0 = now - 0.7; },
    'Lassos': () => { reset(); S.dancer = 'petalwisp'; S.flourish = { t: beatAt(4), grade: 'perfect' }; go('entranced'); S.t0 = now - 2; S.lassoOpen = true; },
    'Throw': () => { reset(); S.dancer = 'petalwisp'; S.lasso = 'twine'; S.throwHit = true; S.used = { twine: 1 }; go('throw'); S.t0 = now - 0.55; },
    'Caught': () => { reset(); S.dancer = 'petalwisp'; S.outcome = 'caught'; go('result'); },
    'Not impressed': () => { reset(); S.dancer = 'emberglide'; S.fails = 1; go('unimpressed'); S.t0 = now - 0.5; },
    'Storms off': () => { reset(); S.dancer = 'emberglide'; S.fails = 2; S.outcome = 'stormed'; go('storm'); S.t0 = now - 1.4; },
  };

  function bind() {
    options('#opt-control', 'control', OPTIONS.control);
    options('#opt-progress', 'progress', OPTIONS.progress);
    options('#opt-size', 'size', OPTIONS.size);
    options('#opt-lasso', 'lasso', OPTIONS.lasso);
    options('#opt-stay', 'stay', OPTIONS.stay);
    $('#jumps').innerHTML = Object.keys(JUMPS).map(k => `<button type="button" data-jump="${esc(k)}">${esc(k)}</button>`).join('');
    $('#jumps').addEventListener('click', e => { const b = e.target.closest('[data-jump]'); if (b) { JUMPS[b.dataset.jump](); dockKey = plateKey = sheetKey = modalKey = null; } });
    const lv = $('#target-level');
    lv.value = V.level; $('#target-level-out').textContent = V.level;
    lv.addEventListener('input', () => { V.level = +lv.value; $('#target-level-out').textContent = V.level; });
    $('#sighting').addEventListener('click', tapSighting);
    $('#leave').addEventListener('click', leave);
    document.addEventListener('click', e => {
      const c = e.target.closest('[data-card]');
      if (c) { openSheet(c.dataset.card); return; }
      if (e.target.closest('#sheet-back')) { closeSheet(); return; }
      if (e.target.closest('#sheet-choose')) { choose(S.sheet); return; }
      if (e.target.closest('#flourish')) { onFlourish(); return; }
      if (e.target.closest('#tapzone')) { onTap(); return; }
      const m = e.target.closest('[data-move]');
      if (m) { onMove(m.dataset.move); return; }
      if (e.target.closest('#capture')) { openLassos(); return; }
      const l = e.target.closest('[data-lasso]');
      if (l) { throwLasso(l.dataset.lasso); return; }
      if (e.target.closest('#to-map')) { leave(); return; }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.sheet) closeSheet(); if (e.key === ' ' && S.phase === 'dance') { e.preventDefault(); if (V.control === 'flourish') onFlourish(); if (V.control === 'rhythm') onTap(); } });
  }

  // a hook for the Chrome check: jump to a moment and hold the clock still
  window.DANCEOFF = {
    jump(name) { JUMPS[name](); dockKey = plateKey = sheetKey = modalKey = null; },
    freeze(on) { frozen = on; },
    advance(sec) { now += sec; },
    peek: () => L(),
    set(key, value) { if (key === 'size') setSize(value); else V[key] = value; document.querySelectorAll(`#opt-${key} button`).forEach(b => b.setAttribute('aria-checked', b.dataset.v === value)); dockKey = plateKey = ''; },
    state: () => ({ phase: S.phase, dancer: S.dancer, trance: Math.round(trance(S.phase === 'dance' ? L() : DANCE_END + 99)), flourish: S.flourish, sheet: S.sheet, lassoOpen: S.lassoOpen, outcome: S.outcome }),
    act: { tapSighting, choose, onFlourish, onTap, onMove, openLassos, throwLasso, leave, openSheet },
  };

  reset();
  bind();
  setSize('default');
  window.Stage.init($('#gl')).then(() => {
    window.Stage.resize(W, H);
    document.documentElement.dataset.ready = 'true';
  }).catch(e => {
    document.body.insertAdjacentHTML('afterbegin', `<p style="background:#F6D8CF;padding:12px;margin:0">The 3D scene did not load: ${esc(e && e.message || e)}</p>`);
  });
  requestAnimationFrame(frame);
})();
