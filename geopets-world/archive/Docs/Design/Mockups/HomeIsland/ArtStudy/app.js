(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const descriptions = {
    scene: ['Separate artwork, together.', 'The scene combines the generated cutouts over the existing distant-world motion study. Buildings are shown near phone gameplay size.'],
    mill: ['The Mill', 'Cream stone and a teal roof keep the silhouette clear. The sails are part of this single illustrated view; independently animated sails would need a separate layer.'],
    bakery: ['The Bakery', 'Warm terracotta, a small bread sign and a striped awning identify its purpose at a glance. One angle for this study; not a verified four-view set.'],
    island: ['Ground and retaining wall', 'Soft checker grass reaches squared corners without a decorative fence. This single section tests the material treatment, not final tile topology or seamless joins.'],
    cloud: ['Room still to discover', 'Blue cloud cover identifies locked land. It stays separate from the pale atmospheric clouds moving below the island.']
  };
  const files = {mill:'mill-front-study.png',bakery:'bakery-front-study.png',island:'island-ground-study-v2.png',cloud:'locked-cloud-study.png'};
  function setView(name) {
    if (!descriptions[name]) name = 'scene';
    document.body.dataset.artView = name;
    document.body.dataset.studyView = name === 'scene' ? 'layout' : 'art';
    $('#composition').hidden = name !== 'scene';
    $('#focus').hidden = name === 'scene';
    $('#focus').dataset.kind = name;
    if (files[name]) { $('#focus-image').src = 'assets/' + files[name]; $('#focus-image').alt = descriptions[name][0]; }
    [$('#detail-title').textContent, $('#detail-copy').textContent] = descriptions[name];
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === name)));
  }
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  $('#backdrop').addEventListener('change', event => { $('#focus').dataset.backdrop = event.target.value; });
  const params = new URLSearchParams(location.search);
  if (params.get('phone') === '1') document.body.classList.add('only');
  if (['green','cream','night'].includes(params.get('backdrop'))) $('#backdrop').value = params.get('backdrop');
  $('#focus').dataset.backdrop = $('#backdrop').value;
  setView(params.get('view') || 'scene');
})();
