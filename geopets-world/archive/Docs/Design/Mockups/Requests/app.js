(() => {
  'use strict';
  const $ = s => document.querySelector(s), icons = '../VisualIdentity/assets/icons/';
  const image = (name, alt = '') => `<img src="${icons}${name}.svg" alt="${alt}">`;
  const items = {biscuit:{name:'Biscuits',icon:'biscuit'},milk:{name:'Milk',icon:'milk'},flour:{name:'Flour',icon:'flour'},tonic:{name:'Berry tonic',icon:'care'},water:{name:'Water',icon:'water'},egg:{name:'Eggs',icon:'egg'},wheat:{name:'Wheat',icon:'wheat'}};
  // Local review fixtures only. No live definitions or Firebase connection.
  const orders = [
    {id:'comfort',title:'A little comfort',customer:'Willow · wildlife shelter',goods:{biscuit:2,milk:1},coins:40},
    {id:'nursery',title:'Breakfast at the shelter',customer:'Rowan · recovery nursery',goods:{milk:3},coins:18},
    {id:'pantry',title:'Stock the pantry',customer:'Willow · wildlife shelter',goods:{flour:2},coins:16},
    {id:'care',title:'Care supplies, please',customer:'Juniper · travelling Geo Vet',goods:{tonic:1},coins:20},
    {id:'tray',title:'A breakfast tray',customer:'Rowan · recovery nursery',goods:{biscuit:1,milk:2},coins:30},
    {id:'field',title:'Pack the field kitchen',customer:'Juniper · travelling Geo Vet',goods:{flour:1,water:2,egg:2},coins:26},
    {id:'snacks',title:'Snacks for the journey',customer:'Willow · wildlife shelter',goods:{biscuit:3},coins:45},
    {id:'meal',title:'A good meal',customer:'Rowan · recovery nursery',goods:{wheat:4,egg:2,milk:1},coins:32},
    {id:'restock',title:'Restock the care bag',customer:'Juniper · travelling Geo Vet',goods:{tonic:2,biscuit:1},coins:48}
  ];
  let state, stack=[], selected='comfort', returnFocus=null, closing=false;
  const layers=$('#layers'), find=id=>orders.find(o=>o.id===id);
  function reset(){state={coins:100,inventory:{biscuit:2,milk:5,flour:1,tonic:0,water:9,egg:4,wheat:3},cycles:{},completed:[],connection:'online',pending:null};selected='comfort';}
  const key=o=>`${o.id}:${state.cycles[o.id]||0}`;
  const enough=o=>Object.entries(o.goods).every(([id,n])=>state.inventory[id]>=n);
  const canDeliver=o=>enough(o)&&state.connection==='online'&&!state.pending;
  const goodsText=o=>Object.entries(o.goods).map(([id,n])=>`${n} ${items[id].name}`).join(' + ');
  const header=(title,subtitle,icon='mail',showHistory=false)=>`<header>${image(icon)}<div class="heading"><h2>${title}</h2><p>${subtitle}</p></div>${showHistory?`<button class="history-button" data-action="history" aria-label="Completed orders">${image('timer')}</button>`:''}<button class="close" data-action="back" aria-label="Close active panel">${image('close')}</button></header>`;
  function go(view){returnFocus=document.activeElement;stack.push(view);history.pushState({requestStudy:true,stack:[...stack]},'');render();}
  function close(){if(stack.length&&!closing){closing=true;history.back();}}
  window.addEventListener('popstate',e=>{closing=false;stack=e.state?.requestStudy?[...e.state.stack]:[];render();if(returnFocus?.isConnected&&!returnFocus.closest('[inert]'))returnFocus.focus();});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&stack.length){e.preventDefault();close();}if(e.key==='Tab')trap(e);});
  function trap(e){const modal=layers.lastElementChild?.querySelector('[role=dialog]');if(!modal)return;const nodes=[...modal.querySelectorAll('button:not(:disabled),[tabindex="0"]')];if(!nodes.length)return;const n=nodes.indexOf(document.activeElement);if(e.shiftKey&&n<=0){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&(n<0||n===nodes.length-1)){e.preventDefault();nodes[0].focus();}}
  function layer(content,detail=false){return `<div class="layer ${detail?'detail':''}"><button class="backdrop" data-action="back" aria-label="Close active panel by tapping outside"></button><section class="sheet" role="dialog" aria-modal="true" tabindex="-1">${content}</section></div>`;}
  function connection(){if(state.connection==='online'&&!state.pending)return '';return `<div class="connection"><div><strong>${state.pending?'Delivery not confirmed':'You’re offline'}</strong><p>${state.pending?'Check the last delivery before sending another.':'Reconnect to deliver your supplies.'}</p></div><button data-action="reconnect">${state.pending?'Check':'Reconnect'}</button></div>`;}
  function requirements(o){return `<div class="requirements">${Object.entries(o.goods).map(([id,n])=>`<div class="requirement ${state.inventory[id]>=n?'have':'need'}"><span class="ingredient-art">${image(items[id].icon)}${state.inventory[id]>=n?'<span class="ingredient-check" aria-label="Enough">✓</span>':''}</span><strong>${state.inventory[id]} <span>/ ${n}</span></strong><small>${items[id].name}</small></div>`).join('')}</div>`;}
  function card(o){return `<button class="order-note ${enough(o)?'ready':''} ${selected===o.id?'selected':''}" data-action="select" data-order="${o.id}" aria-pressed="${selected===o.id}" aria-label="${o.title}; ${goodsText(o)}; ${o.coins} Coins; ${enough(o)?'ready':'missing supplies'}"><span class="pin" aria-hidden="true"></span><span class="note-items count-${Object.keys(o.goods).length}">${Object.entries(o.goods).map(([id,n])=>`<span class="note-item ${state.inventory[id]>=n?'have':'need'}">${image(items[id].icon)}<small>${state.inventory[id]}/${n}</small></span>`).join('')}</span><span class="note-bottom"><span class="note-reward">${image('coin')}${o.coins}</span>${enough(o)?'<span class="ready-check" aria-hidden="true">✓</span>':'<span class="note-dash" aria-hidden="true">· · ·</span>'}</span></button>`;}
  function selection(){const o=find(selected),label=state.pending?'Check pending delivery':state.connection!=='online'?'Reconnect to deliver':!enough(o)?'More supplies needed':'Deliver order';return `<section class="selection" aria-label="Selected order"><div class="selected-heading"><h3>${o.title}</h3><p>${o.customer}</p></div><div class="requirement-label">SUPPLIES · HAVE / NEED</div>${requirements(o)}<div class="send-row"><div class="selected-reward"><small>Reward</small><strong>${image('coin')}${o.coins}</strong></div><button class="primary" data-action="review" data-order="${o.id}" ${canDeliver(o)?'':'disabled'}>${label}</button></div>${o.goods.tonic&&!enough(o)?'<button class="recipe-link" data-action="recipe">How to craft Berry tonic ›</button>':'<p class="selection-note">No rush — this order has no deadline.</p>'}</section>`;}
  function board(){return layer(`${header('Request board',`${orders.filter(enough).length} ready · ${orders.length} requests`,'mail',true)}${connection()}<div class="board-scroll"><div class="noticeboard" role="group" aria-label="Nine supply requests">${orders.map(card).join('')}</div>${selection()}</div>`);}
  function historyRows(){return state.completed.length?state.completed.map(o=>`<div class="history-row">${image(items[Object.keys(o.goods)[0]].icon)}<div><strong>${goodsText(o)}</strong><small>${o.customer} · Just now</small></div><b>+${o.coins}</b></div>`).join(''):`<div class="empty">${image('mail')}<h3>Your first delivery awaits</h3><p>Completed requests will appear here.</p></div>`;}
  function confirmation(o){return layer(`${header('Deliver these supplies?',o.customer,items[Object.keys(o.goods)[0]].icon)}<div class="detail-content"><p class="customer-note">${o.title}</p>${requirements(o)}<div class="payout"><span>You receive</span><strong>${image('coin')}${o.coins} Coins</strong></div><p class="helper">${goodsText(o)} will leave your inventory.</p></div><footer><button class="primary" data-action="deliver" data-order="${o.id}" data-instance="${key(o)}" ${canDeliver(o)?'':'disabled'}>Confirm delivery</button><button class="secondary" data-action="back">Keep my supplies</button></footer>`,true);}
  function recipe(){return layer(`${header('Berry tonic','Care Bench · proposed starter recipe','care')}<div class="detail-content"><p class="customer-note">A fantasy care supply for your fellow Geo Vets.</p><div class="recipe-line">${image('herb')}<span>Blackberries</span><strong>2</strong></div><div class="recipe-line">${image('water')}<span>Water</span><strong>1</strong></div><div class="recipe-line">${image('care')}<span>Makes 1 Berry tonic</span><strong>60s</strong></div></div><footer><button class="primary" data-action="back">Got it</button><p class="helper">Recipe study only. The Care Bench and a reachable map source for berries still need to be added.</p></footer>`,true);}
  function render(focusSelector){
    $('#coins').textContent=state.coins;$('#board-entrance b').textContent=orders.filter(enough).length;
    layers.innerHTML=stack.map(v=>v==='board'?board():v==='history'?layer(`${header('Completed orders','Your latest deliveries','timer')}<div class="detail-content">${historyRows()}</div><footer><button class="primary" data-action="back">Back to requests</button></footer>`,true):v==='recipe'?recipe():confirmation(find(v.slice('confirm:'.length)))).join('');
    layers.querySelectorAll('header>img').forEach(x=>x.classList.add('heading-icon'));
    const all=[...layers.children];all.forEach((x,i)=>{const h=x.querySelector('h2');h.id='request-heading-'+i;x.querySelector('[role=dialog]').setAttribute('aria-labelledby',h.id);});
    all.slice(0,-1).forEach(x=>{x.inert=true;x.setAttribute('aria-hidden','true');});$('#board-entrance').inert=all.length>0;
    all.at(-1)?.querySelector(focusSelector||'[role=dialog]')?.focus({preventScroll:true});
  }
  function commit(o,instance){if(state.completed.some(x=>x.instance===instance)||key(o)!==instance||!enough(o))return false;Object.entries(o.goods).forEach(([id,n])=>state.inventory[id]-=n);state.coins+=o.coins;state.cycles[o.id]=(state.cycles[o.id]||0)+1;state.completed.unshift({...o,instance});return true;}
  function notice(o){const el=document.createElement('div');el.className='toast';el.innerHTML=`${image('coin')}<div><strong>+${o.coins} Coins</strong><p>Supplies delivered</p></div>`;$('#notifications').prepend(el);while($('#notifications').children.length>3)$('#notifications').lastChild.remove();setTimeout(()=>el.classList.add('leaving'),4200);setTimeout(()=>el.remove(),4650);}
  layers.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||closing)return;e.stopPropagation();const a=b.dataset.action;
    if(a==='back')close();
    if(a==='select'){selected=b.dataset.order;render(`[data-action="select"][data-order="${selected}"]`);}
    if(a==='history')go('history');
    if(a==='recipe')go('recipe');
    if(a==='review'&&canDeliver(find(b.dataset.order)))go('confirm:'+b.dataset.order);
    if(a==='deliver'){const o=find(b.dataset.order);if(canDeliver(o)&&commit(o,b.dataset.instance)){b.disabled=true;notice(o);close();}}
    if(a==='reconnect'){state.connection='online';if(state.pending){const o=find(state.pending.id);commit(o,state.pending.instance);state.pending=null;notice(o);}render();}
  });
  $('#board-entrance').addEventListener('click',()=>go('board'));
  function fixture(name){reset();closing=false;$('#notifications').innerHTML='';stack=[];history.replaceState({requestStudy:true,stack:[]},'');if(name!=='home')go('board');if(name==='missing')selected='restock';if(name==='confirm')go('confirm:comfort');if(name==='recipe')go('recipe');if(name==='offline')state.connection='offline';if(name==='uncertain'){const o=orders[0];state.pending={id:o.id,instance:key(o)};/* Server committed but response was lost. */commit(o,key(o));}if(name==='history'){commit(orders[0],key(orders[0]));go('history');}render();document.querySelectorAll('[data-fixture]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fixture===name)));}
  document.querySelectorAll('[data-fixture]').forEach(b=>b.addEventListener('click',()=>fixture(b.dataset.fixture)));
  function size(width){const compact=width<=360;document.documentElement.style.setProperty('--pw',compact?'360px':'390px');document.documentElement.style.setProperty('--ph',compact?'640px':'844px');$('#phone').classList.toggle('compact',compact);}
  document.querySelectorAll('[data-size]').forEach(b=>b.addEventListener('click',()=>size(Number(b.dataset.size))));
  const p=new URLSearchParams(location.search);if(p.get('phone')==='1')document.body.classList.add('only');function responsive(){if(document.body.classList.contains('only'))size(innerHeight<=700||innerWidth<=360?360:390);}addEventListener('resize',responsive);size(p.get('size')==='360'?360:390);responsive();fixture(p.get('state')||'board');
  window.requestStudy={snapshot:()=>structuredClone({...state,selected}),fixture};
})();
