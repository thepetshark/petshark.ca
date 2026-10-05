/* Design-only fixtures. No network, storage or real authentication. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const states = [
    ['bootstrap','Startup · preparing your session','Only core startup runs here. This capture is frozen; Advance restores the guest session.'],
    ['bootstrap-retry','Startup · retry','A core-startup failure stays on this screen. Retry never skips into a partially initialized session.'],
    ['guest','Splash · guest','A guest can continue immediately, protect this same progress with an account, or explicitly switch accounts.'],
    ['registered','Splash · registered','The restored account is visible before Continue. World content loads only after Continue.'],
    ['signed-out','Splash · signed out','Logging out returns here. Choose Sign in, Create account or Play as guest; the app does not quit.'],
    ['signup','Create account · keep guest progress','Link the current guest identity. Success keeps the same simulated UID; it does not create a replacement player.'],
    ['signup-email-exists','Create account · email already used','Guest progress remains untouched. An existing email requires sign-in or a different email, never a silent merge.'],
    ['signup-error','Create account · submit error','A neutral failure preserves the form and the guest session. No account change is assumed.'],
    ['signin','Sign in','Signing in from a guest requires explicit account-switch confirmation. Use the prefilled made-up credentials only.'],
    ['offline-signin','Sign in · offline','Account sign-in requires a connection. Returning to the guest session remains available.'],
    ['reset','Password reset','The acknowledgement is neutral: it does not reveal whether the entered email belongs to an account.'],
    ['reset-sent','Password reset · acknowledgement','No email is actually sent by this study. The displayed response is the intended neutral wording.'],
    ['switch-account','Confirm account switch','Guest progress is not transferred. Create account first offers a route to protect it; cancel changes nothing.'],
    ['link-success','Account created · same progress','The guest UID is retained after linking. In Settings, this confirmation returns to Settings.'],
    ['logout','Confirm log out','Log out clears this signed-in session and returns to the signed-out splash.'],
    ['loading','World loading','Second loading phase, after Continue: resolve player data and prepare the world view. Advance opens the destination.'],
    ['loading-retry','World loading · retry','The account stays signed in if loading the world fails. Retry does not repeat account creation.'],
    ['world','World · destination','A destination placeholder only. This study does not redesign the map or promise additional gameplay.'],
    ['settings','Settings · guest account','The same create-account form is reachable from Settings; successful linking returns here.'],
    ['settings-registered','Settings · registered account','The linked email is shown in Account settings; Log out asks for confirmation.']
  ];
  if (params.get('board') === '1') { buildBoard(); return; }
  if (params.get('phone') === '1') document.body.classList.add('phone-only');
  const app = document.querySelector('#app'), overlay = document.querySelector('#overlay');
  const picker = document.querySelector('#state-picker');
  const phone = document.querySelector('#phone');
  picker.innerHTML = states.map(([id,title])=>`<option value="${id}">${title}</option>`).join('');
  let account, page, modal = null, origin = 'splash', demoState, pending = null;
  let outcome = 'success', operationSerial = 0, timer = null, toastTimer = null, focusReturn = null;
  let formDraft = {email:'fern@example.test',password:'demo-pass-123'};
  // Fixture identities only; never retain passwords or pretend to authenticate.
  const knownAccounts = new Map([['willow@example.test','player-2048'],['used@example.test','player-2049']]);
  let nextIdentity = 3096;
  const guest = () => ({uid:'guest-1042',guest:true,email:null});
  const registered = () => ({uid:'player-2048',guest:false,email:'willow@example.test'});
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const brand = () => '<div class="brand" aria-label="Geo Pets World"><span class="brand-title">Geo Pets</span><span class="brand-world">WORLD</span><div class="brand-rule"></div></div>';
  const button = (text, action, cls='primary', extra='') => `<button type="button" class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
  const disable = () => pending ? 'disabled' : '';
  function rail(){
    picker.value = demoState;
    document.querySelector('#state-note').textContent = states.find(s=>s[0]===demoState)?.[2] || '';
    document.querySelector('#session-identity').textContent = account ? account.guest ? 'Guest' : account.email : 'Signed out';
    document.querySelector('#session-uid').textContent = account?.uid || '—';
    document.querySelector('#session-operation').textContent = pending?.kind || 'None';
    document.querySelector('#advance').disabled = Boolean(pending);
  }
  function render(){
    app.inert = false;
    if(page === 'bootstrap' || page === 'bootstrap-retry' || page === 'loading' || page === 'loading-retry') renderLoading();
    else if(page === 'world') renderWorld();
    else if(page === 'settings') renderSettings();
    else renderSplash();
    if(pending && !modal) app.insertAdjacentHTML('afterbegin','<div class="pending-strip" role="status">Account request in progress…</div>');
    if(modal){app.inert=true; renderModal();} else overlay.replaceChildren();
    rail();
  }
  function renderSplash(){
    let title,copy,actions;
    if(!account){title='Your next discovery awaits.';copy='Step back into your world.';actions=button('SIGN IN','signin')+`<div class="account-options">${button('Create account','signup','plain') }<span class="option-dot">·</span>${button('Play as guest','play-guest','plain subtle')}</div>`;}
    else if(account.guest){title='Ready to explore?';copy='Playing as a guest';actions=button('CONTINUE','continue','primary',disable())+`<div class="account-options">${button('Create account','signup','plain',disable())}<span class="option-dot">·</span>${button('Sign in','signin','plain subtle',disable())}</div>`;}
    else{title='Welcome back.';copy='Your world is ready when you are.';actions=`<div class="identity"><span class="identity-dot"></span><span>${escape(account.email)}</span></div>`+button('CONTINUE','continue','primary',disable())+`<div class="account-options">${button('Log out','logout','plain subtle',disable())}</div>`;}
    app.innerHTML=`<section class="splash">${brand()}<div class="splash-space"></div><div class="welcome"><h2>${title}</h2><p>${copy}</p>${actions}</div></section>`;
  }
  function renderLoading(){
    const boot=page.startsWith('bootstrap'), failed=page.endsWith('retry');
    const title=failed ? boot?'We couldn’t get started.':'Your world needs a moment.' : boot?'Getting things ready…':'Opening your world…';
    const copy=failed ? boot?'Something interrupted startup. Please try again.':'We couldn’t finish loading. Your account is still signed in.' : boot?'Preparing the essentials for your next visit.':'Gathering your progress and preparing the map.';
    app.innerHTML=`<section class="loading">${brand()}<div class="loading-copy"></div><div class="loading-card">${failed?'<div class="error-mark" aria-hidden="true">!</div>':''}<h2>${title}</h2><p>${copy}</p>${failed?button('Try again',boot?'retry-bootstrap':'retry-world'):`<div class="progress-track" role="progressbar" aria-label="${boot?'Startup':'World loading'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${boot?35:65}"><div class="progress-fill" style="width:${boot?35:65}%"></div></div><div class="loading-step"><span class="step-dot"></span>${boot?'Restoring your session':'Preparing your surroundings'}</div>`}${!boot&&failed?button('Back to welcome','back-splash','plain subtle'):''}</div><p class="splash-footer">${boot?'A NEW ADVENTURE CAN START ANYWHERE.':'ALMOST TIME TO EXPLORE.'}</p></section>`;
  }
  function renderWorld(){app.innerHTML=`<section class="world"><header class="world-top"><span class="world-wordmark">Geo Pets World</span>${button('⚙','settings','icon-button','aria-label="Open Settings"')}</header><div class="world-destination"><span class="status-tag">WORLD DESTINATION</span><h2>Ready to explore.</h2><p>This is where the world map opens after startup. Account options stay available in Settings.</p>${button('Open Settings','settings','secondary')}<div class="destination-line"><span class="identity-dot"></span>${account?.guest?'Playing as a guest':escape(account?.email || 'Signed out')}</div></div></section>`;}
  function renderSettings(){const isGuest=account?.guest;app.innerHTML=`<section class="settings"><header class="page-head">${button('‹','world','icon-button','aria-label="Back to world"')}<h2>Settings</h2></header><div class="settings-content"><p class="section-label">ACCOUNT</p><div class="account-card"><div class="account-card-main"><div class="account-emblem" aria-hidden="true">${isGuest?'◇':'✓'}</div><div class="account-details"><h3>${isGuest?'Playing as a guest':'Account connected'}</h3><p>${isGuest?'Keep this adventure yours.':escape(account?.email)}</p></div></div><p class="account-card-copy">${isGuest?'Create an account to keep this progress connected to you. Your current adventure stays with you.':'Use this account when you return to the game.'}</p><div class="account-card-actions">${isGuest?button('Create account','signup','primary',disable())+button('Sign in to another account','signin','plain',disable()):button('Log out','logout','secondary',disable())}</div></div><p class="settings-note">${isGuest?'Signing in to a different account opens that account’s progress instead.':'Logging out returns you to the welcome screen.'}</p></div></section>`;}
  function openModal(type){focusReturn=document.activeElement;origin=page==='settings'?'settings':'splash';modal=type;outcome='success';demoState=type;render();focusModal();}
  function focusModal(){requestAnimationFrame(()=>{const target=overlay.querySelector('input:not([disabled]),button:not([disabled]),[tabindex]');target?.focus({preventScroll:true});});}
  function closeModal(){const returnAction=focusReturn?.dataset?.action;modal=null;outcome='success';demoState=page==='settings'?(account?.guest?'settings':'settings-registered'):account?account.guest?'guest':'registered':'signed-out';render();const target=returnAction?app.querySelector(`[data-action="${returnAction}"]:not([disabled])`):null;(target||app.querySelector('button:not([disabled])'))?.focus({preventScroll:true});}
  function sheet(title,body,cls=''){overlay.innerHTML=`<div class="scrim" data-backdrop><section class="sheet ${cls}" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1"><div class="handle"></div><header class="sheet-head"><h2 class="sheet-title" id="dialog-title">${title}</h2>${button('×','close','dismiss','aria-label="Close dialog"')}</header>${body}</section></div>`;}
  function fields(password=true){return `<label class="field"><span class="field-label">Email</span><input id="email" name="email" type="email" inputmode="email" autocomplete="off" spellcheck="false" autocapitalize="none" value="${escape(formDraft.email)}" placeholder="you@example.test" ${disable()} required></label>${password?`<label class="field"><span class="field-label">Password</span><span class="password-wrap"><input id="password" name="password" type="password" autocomplete="off" value="${escape(formDraft.password)}" placeholder="Enter a password" ${disable()} required>${button('Show','show-password','password-toggle',disable()+' aria-label="Show password"')}</span></label>`:''}`;}
  function renderModal(){
    if(modal==='signup'||modal==='signin'){
      const create=modal==='signup';
      const savedGuest=create&&account?.guest;
      const error=outcome==='email-exists'?'This email is already linked to an account. Try another email or sign in.':outcome==='error'?'We couldn’t complete that request. Please try again.':outcome==='offline'?'You’re offline. Reconnect to sign in.':null;
      sheet(create?'Create your account':'Welcome back',`<p class="sheet-copy">${create?savedGuest?'Keep your discoveries and carry on from here.':'A new world of discoveries starts here.':'Sign in to return to your account.'}</p>${savedGuest?'<div class="preserve-note"><span class="note-icon" aria-hidden="true">✓</span><span>Your current progress stays with this account.</span></div>':''}<form id="account-form" novalidate>${fields()}${create?'<p class="form-help">Use at least 8 characters.</p>':`<div class="forgot-row">${button('Forgot password?','reset','plain',disable())}</div>`}${error?`<p class="field-error" role="alert">${error}</p>`:''}<div id="validation" aria-live="polite"></div><div class="form-actions"><button class="primary" type="submit" ${disable()}>${pending?'Please wait…':create?'Create account':'Sign in'}</button></div>${pending?'<p class="form-status" role="status">This request will continue if you close this panel.</p>':''}</form><p class="form-switch">${create?'Already have an account?':'New here?'} ${button(create?'Sign in':'Create account',create?'signin':'signup','plain',disable())}</p>`);
    }else if(modal==='reset'){
      sheet('Reset your password',`<p class="sheet-copy">Enter your email and we’ll help you get back to your account.</p><form id="reset-form" novalidate>${fields(false)}<div id="validation" aria-live="polite"></div><div class="form-actions"><button class="primary" type="submit" ${disable()}>${pending?'Please wait…':'Send reset email'}</button>${button('Back to sign in','signin','plain',disable())}</div>${pending?'<p class="form-status" role="status">This request will continue if you close this panel.</p>':''}</form>`);
    }else if(modal==='reset-sent'){
      sheet('Check your inbox',`<div class="success-mark" aria-hidden="true">✓</div><p class="sheet-copy">If an account matches that email, you’ll receive a password reset link. Check your inbox and spam folder.</p><div class="stack">${button('Back to sign in','signin')}${button('Done','close','plain')}</div>`,'confirmation');
    }else if(modal==='switch-account'){
      sheet('Switch accounts?',`<p class="sheet-copy">You’re about to leave this guest session and open a different account.</p><div class="warning-panel">Your guest progress will not transfer to the other account. If you leave without creating an account first, you may not be able to recover this guest progress.</div><div class="stack">${button('Create account first','protect-guest')}${button('Switch account','confirm-switch','secondary')}${button('Cancel','close','plain')}</div>`,'confirmation');
    }else if(modal==='logout'){
      sheet('Log out?',`<p class="sheet-copy">You’ll return to the welcome screen. Sign in again to return to this account.</p><div class="identity"><span class="identity-dot"></span><span>${escape(account?.email)}</span></div><div class="stack">${button('Log out','confirm-logout')}${button('Stay signed in','close','secondary')}</div>`,'confirmation');
    }else if(modal==='link-success'){
      sheet('Your adventure stays yours.',`<div class="success-mark" aria-hidden="true">✓</div><p class="sheet-copy">Your account is ready. You’re continuing with the same discoveries and progress.</p><div class="identity"><span class="identity-dot"></span><span>${escape(account?.email)}</span></div><div class="stack">${button(origin==='settings'?'Back to Settings':'Back to welcome','close')}</div>`,'confirmation');
    }
  }
  function note(text){clearTimeout(toastTimer);const target=document.querySelector('#toast');target.textContent=text;target.hidden=false;toastTimer=setTimeout(()=>target.hidden=true,4500);}
  function resetTransient(){clearTimeout(timer);timer=null;clearTimeout(toastTimer);document.querySelector('#toast').hidden=true;operationSerial++;pending=null;modal=null;outcome='success';origin='splash';formDraft={email:'fern@example.test',password:'demo-pass-123'};}
  function show(state='guest'){
    if(!states.some(s=>s[0]===state))state='guest';
    resetTransient();demoState=state;account=guest();page='splash';
    if(state==='registered'||state==='logout'||state==='settings-registered')account=registered();
    if(state==='signed-out')account=null;
    if(['bootstrap','bootstrap-retry','loading','loading-retry','world'].includes(state))page=state;
    else if(state.startsWith('settings')){page='settings';origin='settings';}
    else if(['signup','signup-email-exists','signup-error'].includes(state)){modal='signup';if(state==='signup-email-exists'){outcome='email-exists';formDraft.email='used@example.test';}if(state==='signup-error')outcome='error';}
    else if(['signin','offline-signin'].includes(state)){modal='signin';if(state==='offline-signin')outcome='offline';}
    else if(['reset','reset-sent','switch-account','logout'].includes(state))modal=state;
    else if(state==='link-success'){account={...guest(),guest:false,email:formDraft.email};modal='link-success';}
    render();
  }
  function advance(){
    if(pending)return;
    if(page==='bootstrap'||page==='bootstrap-retry'){page='splash';account=guest();demoState='guest';render();}
    else if(page==='loading'||page==='loading-retry'){page='world';demoState='world';render();}
    else if(modal==='link-success'||modal==='reset-sent')closeModal();
    else if(page==='splash'&&!modal)act('continue');
    else note('Use the controls on this screen to review this step.');
  }
  function validate(needsPassword){
    const email=document.querySelector('#email'),password=document.querySelector('#password');
    const value=email.value.trim();let message='';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){message='Enter a valid email address.';email.setAttribute('aria-invalid','true');}
    else if(needsPassword&&!password.value){message='Enter your password.';password.setAttribute('aria-invalid','true');}
    else if(needsPassword&&modal==='signup'&&password.value.length<8){message='Use a password with at least 8 characters.';password.setAttribute('aria-invalid','true');}
    if(message){document.querySelector('#validation').innerHTML=`<p class="field-error" role="alert">${message}</p>`;document.querySelector('[aria-invalid=true]')?.focus();return false;}
    email.removeAttribute('aria-invalid');password?.removeAttribute('aria-invalid');formDraft={email:value,password:password?.value||''};return true;
  }
  function submitAccount(){
    if(pending||!validate(true))return;
    if(modal==='signin'&&outcome==='offline'){document.querySelector('#validation').innerHTML='<p class="field-error" role="alert">Reconnect before signing in. You can close this panel to return.</p>';return;}
    if(modal==='signin'&&account?.guest){modal='switch-account';demoState='switch-account';render();focusModal();return;}
    perform(modal==='signup'?'link':'signin');
  }
  function perform(kind){
    if(pending)return;
    const serial=++operationSerial;const request={kind,serial,email:formDraft.email,uid:account?.uid,guest:Boolean(account?.guest),origin};
    const forced=outcome;pending=request;render();
    timer=setTimeout(()=>{
      if(!pending||pending.serial!==serial)return;
      pending=null;
      if(kind==='link'&&knownAccounts.has(request.email.toLowerCase())&&knownAccounts.get(request.email.toLowerCase())!==request.uid){outcome='email-exists';demoState='signup-email-exists';if(modal)modal='signup';render();if(!modal)note('That email is already linked. Your guest progress is unchanged.');return;}
      if(forced==='error'){outcome='success';render();if(modal){const v=document.querySelector('#validation');if(v)v.innerHTML='<p class="field-error" role="alert">We couldn’t complete that request. Your progress is unchanged. Please try again.</p>';}else note('Request not completed. Your account is unchanged.');return;}
      if(kind==='reset'){if(modal){modal='reset-sent';demoState='reset-sent';render();focusModal();}else{render();note('If an account matches, a reset link will be sent.');}return;}
      const emailKey=request.email.toLowerCase();
      const uid=kind==='link'&&request.guest?request.uid:knownAccounts.get(emailKey)||`player-${nextIdentity++}`;
      knownAccounts.set(emailKey,uid);
      account={uid,guest:false,email:request.email};
      page=kind==='link'&&request.origin==='settings'?'settings':'splash';origin=request.origin;
      if(kind==='link'&&modal){modal='link-success';demoState='link-success';render();focusModal();}
      else{modal=null;demoState=page==='settings'?'settings-registered':'registered';render();note(kind==='link'?'Account created. Your current progress stays with you.':'Signed in to this account.');}
    },900);
  }
  function act(action){
    if(action==='close'){closeModal();return;}
    if(action==='show-password'){const field=document.querySelector('#password');field.type=field.type==='password'?'text':'password';const toggle=document.querySelector('[data-action="show-password"]');toggle.textContent=field.type==='password'?'Show':'Hide';toggle.setAttribute('aria-label',`${field.type==='password'?'Show':'Hide'} password`);return;}
    if(pending)return;
    if(['signup','signin','reset','logout'].includes(action)){if(modal){modal=action;outcome='success';demoState=action;render();focusModal();}else openModal(action);return;}
    if(action==='protect-guest'){modal='signup';outcome='success';formDraft.email='fern@example.test';demoState='signup';render();focusModal();return;}
    if(action==='confirm-switch'){modal='signin';outcome='success';perform('signin');return;}
    if(action==='confirm-logout'){account=null;page='splash';modal=null;demoState='signed-out';render();return;}
    if(action==='settings'){page='settings';demoState=account?.guest?'settings':'settings-registered';render();return;}
    if(action==='world'){page='world';demoState='world';render();return;}
    if(action==='back-splash'){page='splash';demoState=account?.guest?'guest':'registered';render();return;}
    if(action==='play-guest'){account={...guest(),uid:`guest-${nextIdentity++}`};page='splash';demoState='guest';render();return;}
    if(action==='continue'){if(!account){openModal('signin');return;}modal=null;page='loading';demoState='loading';render();timer=setTimeout(()=>{page='world';demoState='world';render();},1300);return;}
    if(action==='retry-bootstrap'){page='bootstrap';demoState='bootstrap';render();timer=setTimeout(()=>advance(),1000);return;}
    if(action==='retry-world'){page='loading';demoState='loading';render();timer=setTimeout(()=>advance(),1000);}
  }
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-action]');
    if(target&&!target.disabled){event.preventDefault();act(target.dataset.action);}
    else if(event.target.matches('[data-backdrop]'))closeModal();
  });
  document.addEventListener('submit',event=>{if(event.target.id==='account-form'){event.preventDefault();submitAccount();}else if(event.target.id==='reset-form'){event.preventDefault();if(!pending&&validate(false))perform('reset');}});
  document.addEventListener('input',event=>{if(event.target.id==='email')formDraft.email=event.target.value;if(event.target.id==='password')formDraft.password=event.target.value;});
  document.addEventListener('keydown',event=>{
    if(!modal)return;
    if(event.key==='Escape'){event.preventDefault();closeModal();return;}
    if(event.key!=='Tab')return;
    const items=[...overlay.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')].filter(el=>el.getClientRects().length);
    if(!items.length){event.preventDefault();overlay.querySelector('.sheet')?.focus();return;}
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&(document.activeElement===first||!overlay.contains(document.activeElement))){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||!overlay.contains(document.activeElement))){event.preventDefault();first.focus();}
  });
  picker.addEventListener('change',()=>show(picker.value));
  document.querySelector('#advance').addEventListener('click',advance);
  document.querySelector('#reset-demo').addEventListener('click',()=>show('guest'));
  document.querySelector('#size-picker').addEventListener('change',event=>phone.classList.toggle('small',event.target.value==='360'));
  window.mockup={show,advance,getState:()=>({state:demoState,page,modal,origin,account:account?{...account}:null,pending:pending?{kind:pending.kind,uid:pending.uid}:null})};
  show(params.get('state')||'guest');
  function buildBoard(){
    const selected=['bootstrap','guest','signup','registered','loading','settings','signin','switch-account','signed-out','bootstrap-retry','loading-retry','reset-sent'];
    document.body.innerHTML=`<main class="board"><header class="board-heading"><p class="eyebrow">GEOPETS WORLD · STARTUP & ACCOUNTS</p><h1>One welcome. A clear way forward.</h1><p>Portrait screen study · 390 × 844. Each panel is a live, individually scrollable portrait preview.</p><p class="board-warning"><strong>Mockup only.</strong> Use made-up details. No credentials are submitted, no cloud services are connected and nothing is saved.</p><a class="board-back" href="./">← Open the interactive flow</a></header><div class="board-grid">${selected.map(id=>{const entry=states.find(s=>s[0]===id);return `<figure class="board-card"><div class="board-viewport"><iframe loading="lazy" src="?phone=1&state=${id}" title="${escapeBoard(entry[1])}"></iframe></div><figcaption><strong>${escapeBoard(entry[1])}</strong><span>${escapeBoard(entry[2])}</span></figcaption></figure>`;}).join('')}</div></main>`;
    const resize=()=>document.querySelectorAll('.board-viewport').forEach(view=>view.querySelector('iframe').style.transform=`scale(${view.clientWidth/390})`);
    new ResizeObserver(resize).observe(document.querySelector('.board-grid'));resize();
  }
  function escapeBoard(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
})();
