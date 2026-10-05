const assignments = {
  working: [{ task: 'Harvest softwood', place: 'Woodland coppice · 220 m', status: 'Working', time: '42 min remaining', icon: 'wood' }],
  ready: [{ task: 'Harvest wheat', place: 'Community field · 180 m', status: 'Ready', time: 'Harvest is ready', icon: 'wheat' }],
  mixed: [
    { task: 'Harvest softwood', place: 'Woodland coppice · 220 m', status: 'Working', time: '42 min remaining', icon: 'wood' },
    { task: 'Harvest wheat', place: 'Community field · 180 m', status: 'Ready', time: 'Harvest is ready', icon: 'wheat' }
  ], empty: []
};
let state = 'mixed', rosterOpen = false, canceling = null, focused = null;
const $ = selector => document.querySelector(selector);
const workers = () => assignments[state];
function row(worker, index) {
  return `<article class="worker"><div class="worker-top"><span class="resource"><img src="../VisualIdentity/assets/icons/${worker.icon}.svg" alt=""></span><div><h3>${worker.task}</h3><small>${worker.place}</small></div><span class="state ${worker.status === 'Ready' ? 'ready' : 'working'}">${worker.status}</span></div><div class="details"><span>${worker.time}</span><span>${worker.status === 'Ready' ? 'Collect at patch' : 'Worker assigned'}</span></div><div class="actions"><button data-focus="${index}">Show on map</button><button class="cancel" data-cancel="${index}">Cancel</button></div></article>`;
}
function render() {
  const list = workers(), shortcut = $('.worker-shortcut');
  shortcut.hidden = !list.length; shortcut.querySelector('.badge').textContent = list.length; shortcut.setAttribute('aria-expanded', rosterOpen);
  $('.roster').hidden = !rosterOpen;
  $('.summary').textContent = list.length ? `${list.length} ${list.length === 1 ? 'assignment' : 'assignments'} in the world` : 'No workers are currently assigned.';
  $('.worker-list').innerHTML = list.map(row).join('') || '<div class="worker"><h3>No assignments in the world</h3><small>The worker shortcut stays hidden until a new assignment begins.</small></div>';
  const selected = Number.isInteger(canceling) ? list[canceling] : null;
  $('.cancel-modal').hidden = !selected;
  if (selected) { $('.cancel-modal h3').textContent = `Cancel ${selected.task.toLowerCase()}?`; $('.keep').textContent = selected.status === 'Ready' ? 'Keep assignment' : 'Keep working'; }
  const chip = $('.focus-chip'), focus = Number.isInteger(focused) ? list[focused] : null;
  chip.hidden = !focus;
  if (focus) chip.innerHTML = `<img src="../VisualIdentity/assets/icons/${focus.icon}.svg" alt="">${focus.place}<br><b>${focus.task} · map focus only</b>`;
  document.querySelectorAll('[data-state]').forEach(button => button.classList.toggle('selected', button.dataset.state === state));
}
function closeRoster() { rosterOpen = false; canceling = null; render(); }
function closeTopLayer() { if (canceling !== null) { canceling = null; render(); return true; } if (rosterOpen) { closeRoster(); return true; } return false; }
$('.worker-shortcut').onclick = () => { rosterOpen = true; focused = null; render(); };
$('.close').onclick = closeRoster;
$('.confirm').onclick = () => { workers().splice(canceling, 1); if (!workers().length) { state = 'empty'; rosterOpen = false; focused = null; } canceling = null; render(); };
$('.keep').onclick = () => { canceling = null; render(); };
document.addEventListener('click', event => {
  const focusButton = event.target.closest('[data-focus]'), cancelButton = event.target.closest('[data-cancel]');
  if (focusButton) { event.stopImmediatePropagation(); focused = +focusButton.dataset.focus; rosterOpen = false; canceling = null; render(); return; }
  if (cancelButton) { event.stopImmediatePropagation(); canceling = +cancelButton.dataset.cancel; render(); return; }
  if (event.target === $('.cancel-modal') || event.target.closest('[data-action="cancel-backdrop"]')) { canceling = null; render(); return; }
  if (!event.target.closest('.roster,.worker-shortcut,.cancel-modal') && rosterOpen) closeRoster();
});
document.querySelectorAll('[data-state]').forEach(button => button.onclick = () => { state = button.dataset.state; rosterOpen = false; canceling = null; focused = null; render(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && closeTopLayer()) { event.preventDefault(); event.stopPropagation(); } });
render();
