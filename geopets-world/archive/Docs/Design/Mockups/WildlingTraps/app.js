'use strict';
// Browser-only interaction fixtures. No account, network, game save or Unity calls.
const $ = s => document.querySelector(s);
const icons = '../VisualIdentity/assets/icons/';
const art = id => id === 'trap' ? 'assets/trap.svg' : id === 'meadowling' ? 'assets/meadowling.svg' : `${icons}${id==='softwood'?'wood':id}.svg`;
const img = (id, cls = '') => `<img class="${cls}" src="${art(id)}" alt="">`;
const cfg = Object.freeze({woodCost:5, craftSeconds:30, waitSeconds:60, collectSeconds:86400});
const mapVisibility = {workers:true,traps:true};
const textNotices = new TextNotificationStack($('#text-notices'));
let feedbackTimers = [];
let state, panel = null, detail = null, filter = 'all', point = {x:50,y:40}, placing = false, noticeIds = 0;
let sortMode='ready', trapChoice=null, baitChoice=null, locationChosen=false;
let stamp = performance.now(), elapsed = 0, notices = [], pendingRender = false;
const now = () => state.time + elapsed;
const active = () => state.traps.filter(t => !t.collected && !t.cancelled && now() < t.expires);
const ready = t => now() >= t.due;
const coordinate = p => ({lat:40.7812+(50-p.y)*.00010, lon:-73.9665+(p.x-50)*.00016});
const distanceMeters = t => {const p=coordinate({x:50,y:55});return Math.hypot((t.lat-p.lat)*111320,(t.lon-p.lon)*111320*Math.cos(p.lat*Math.PI/180));};
const distanceText = t => `${Math.round(distanceMeters(t)/10)*10} m away`;
const duration = seconds => { const s=Math.max(0,Math.ceil(seconds));return s>=3600?`${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m`:s>=60?`${Math.floor(s/60)}m ${s%60}s`:`${s}s`; };
const countdown = until => `<span data-until="${until}">${duration(until-now())}</span>`;
// Extra zero-stock types demonstrate selector density; these are not runtime definitions.
const trapExamples=['Wooden trap','Woven trap','Reinforced trap','Bramble trap','Rune trap','Crystal trap','Lantern trap','Moonlit trap','Guardian trap'];
const baitExamples=['Biscuit','Berry biscuit','Honey biscuit','Oat biscuit','Spiced biscuit','Trail mix','Berry tart','Fruit cake','Cookie'];
function selectionGrid(kind){
  const isTrap=kind==='trap', names=isTrap?trapExamples:baitExamples, chosen=isTrap?trapChoice:baitChoice;
  return `<div class="selection-grid" role="group" aria-label="${isTrap?'Trap types':'Bait types'}">${names.map((name,i)=>{const count=i===0?(isTrap?state.trapsInBag:state.biscuits):0;return `<button class="select-item ${i===0&&chosen?'chosen':''}" data-action="select-${kind}" aria-label="${name}, ${count} in bag" aria-pressed="${i===0&&!!chosen}" ${count<1?'disabled':''}><div class="select-art" style="--tint:${i*23}deg">${img(isTrap?'trap':'biscuit')}<b>${count}</b></div><strong>${name}</strong><small>${isTrap?(i===0?'1m wait · single use':'Single use'):'1 used per trap'}</small></button>`;}).join('')}</div>`;
}
const costs = () => `<div class="cost"><span>${img('trap')} 1 trap</span><span>+</span><span>${img('biscuit')} 1 Biscuit</span></div>`;
function seedTrap(id,due,x,y,success=true,window=cfg.collectSeconds){const p=coordinate({x,y});return {id,due,expires:due+window,x,y,...p,success,collected:false,cancelled:false};}
function reset(){state={scene:'map',time:1000,next:5,wood:18,trapsInBag:2,biscuits:3,flour:2,eggs:4,water:8,caught:[],crafts:[],traps:[]};elapsed=0;stamp=performance.now();panel=null;detail=null;filter='all';sortMode='ready';placing=false;trapChoice=null;baitChoice=null;locationChosen=false;notices.forEach(n=>n.el.remove());notices=[];textNotices.clear();feedbackTimers.forEach(clearTimeout);feedbackTimers=[];}
function fixtures(name){
  reset();
  if(['ready','many','world'].includes(name)){
    state.traps=[seedTrap(1,900,62,35,true),seedTrap(2,940,33,42,false),seedTrap(3,1045,65,58,true),seedTrap(4,1031,42,29,false)];
    state.traps[1].expires=now()+4200;
    if(name==='many'){for(let i=5;i<=30;i++)state.traps.push(seedTrap(i,now()+i*7,20+(i*13)%65,23+(i*19)%44,i%2===0));state.next=31;}
    panel=name==='world'?null:'roster';
  } else if(name==='waiting'){state.traps=[seedTrap(1,now()+46,63,39)];detail=1;panel='detail';}
  else if(name==='choose-trap'){panel='choose-trap';}
  else if(name==='choose-bait'){trapChoice='wooden-trap';panel='choose-bait';}
  else if(name==='place'){trapChoice='wooden-trap';baitChoice='biscuit';placing=true;point={x:55,y:38};}
  else if(name==='confirm-place'){trapChoice='wooden-trap';baitChoice='biscuit';locationChosen=true;point={x:55,y:38};panel='confirm-place';}
  else if(name==='home'){state.scene='home';state.traps=[seedTrap(1,900,62,35,true),seedTrap(2,1045,33,42,false)];panel='roster';}
  else if(name==='success'){state.caught=[{id:'wildling-1',species:'Meadowling'}];panel='success';}
  else if(name==='empty')panel='empty';
  else if(name==='expired'){panel='roster';notify('One trap broke','trap');}
  else if(name==='collection'){state.caught=[{id:'wildling-1',species:'Meadowling'},{id:'wildling-2',species:'Meadowling'}];panel='collection';}
  else if(name==='craft'){state.scene='home';panel='craft';state.crafts=[{due:now()-15,collected:false}];}
  else panel='bag';
  document.querySelectorAll('[data-state]').forEach(b=>b.classList.toggle('selected',b.dataset.state===name));render();
}
function shell(title,subtitle,body,footer='',extraClass=''){
  return `<div class="overlay"><button class="backdrop" data-action="close" aria-label="Close panel"></button><section class="sheet ${extraClass}" role="dialog" aria-modal="true" aria-label="${title}"><header class="sheet-header"><div><span class="kicker">${subtitle}</span><h2>${title}</h2></div><button class="close" data-action="close" aria-label="Close ${title}">${img('close')}</button></header>${body}${footer?`<footer class="sheet-footer">${footer}</footer>`:''}</section></div>`;
}
function render(){
  const layers=$('#layers'), previousPanel=layers.dataset.panel;
  const scrolls=previousPanel===panel?Array.from(layers.querySelectorAll('.trap-list,.body')).map(e=>e.scrollTop):[];
  renderContent();
  layers.dataset.panel=panel||'';
  layers.querySelectorAll('.trap-list,.body').forEach((e,i)=>{e.scrollTop=scrolls[i]||0;});
  pendingRender=false;
}
function renderContent(){
  const traps=active();$('#trap-count').textContent=traps.length;$('#trap-count').hidden=traps.length===0;$('#traps').hidden=false;$('#workers').hidden=placing;$('#traps').style.visibility='';
  $('.map').classList.toggle('home-scene',state.scene==='home');$('.player').hidden=state.scene==='home';
  $('[data-nav="home"] img').src=art(state.scene==='home'?'world':'home');$('[data-nav="home"] img').alt=state.scene==='home'?'World':'Home';
  $('#map-input').hidden=!placing;$('#placement-pin').hidden=!placing;$('#placement-hint').hidden=!placing;
  $('#placement-pin').style.left=point.x+'%';$('#placement-pin').style.top=point.y+'%';
  $('#markers').innerHTML=state.scene==='home'?'':traps.map(t=>`<button class="map-trap" style="left:${t.x}%;top:${t.y}%" data-trap="${t.id}" aria-label="Wooden trap ${t.id}, ${ready(t)?'ready to open':'waiting'}">${img('trap')}<b>${ready(t)?'Open':countdown(t.due)}</b></button>`).join('')+`<button class="map-trap map-worker" style="left:24%;top:59%" data-worker="1" aria-label="Worker gathering wood">${img('worker')}<b>Working</b></button><button class="map-trap map-worker" style="left:79%;top:31%" data-worker="2" aria-label="Worker harvest ready">${img('worker')}<b>Collect</b></button>`;
  $('#map-toggles').hidden=state.scene!=='map';
  document.querySelectorAll('[data-map-layer]').forEach(b=>{const enabled=mapVisibility[b.dataset.mapLayer];b.setAttribute('aria-pressed',String(enabled));b.classList.toggle('off',!enabled);});
  document.querySelectorAll('[data-trap]').forEach(e=>e.hidden=!mapVisibility.traps);
  document.querySelectorAll('[data-worker]').forEach(e=>e.hidden=!mapVisibility.workers);
  const layers=$('#layers');
  if(placing){layers.innerHTML=`<section class="placement" aria-label="Choose map location"><span class="kicker">STEP 3 OF 4</span><h2>Choose your spot</h2><p class="tiny-copy">${locationChosen?'Location selected':'Tap anywhere on the map.'}</p><div class="row-actions"><button class="secondary" data-action="back-bait">Back</button><button class="primary" data-action="review-place" ${!locationChosen?'disabled':''}>Use this spot</button></div><button class="quiet" data-action="cancel-placement">Cancel placement</button></section>`;return;}
  if(!panel){layers.innerHTML='';return;}
  if(panel==='choose-trap'){
    layers.innerHTML=shell('Choose a trap','STEP 1 OF 4',`<div class="body">${selectionGrid('trap')}</div>`,`<button class="primary" data-action="next-bait" ${!trapChoice?'disabled':''}>Choose bait</button>`);return;
  }
  if(panel==='choose-bait'){
    layers.innerHTML=shell('Choose bait','STEP 2 OF 4',`<div class="body">${selectionGrid('bait')}</div>`,`<div class="row-actions"><button class="secondary" data-action="back-trap">Back</button><button class="primary" data-action="next-location" ${!baitChoice?'disabled':''}>Choose location</button></div>`);return;
  }
  if(panel==='confirm-place'){
    layers.innerHTML=shell('Set this trap?','STEP 4 OF 4',`<div class="body"><div class="hero">${img('trap')}<h3>Wooden trap + Biscuit</h3></div>${costs()}<div class="confirmation-terms"><p><span>Ready to open</span><strong>In 1 minute</strong></p><p><span>Collect within</span><strong>24 hours after ready</strong></p></div><p class="tiny-copy">The trap and bait are used when placed.</p></div>`,`<div class="row-actions"><button class="secondary" data-action="back-location">Back</button><button class="primary" data-action="place" ${state.trapsInBag<1||state.biscuits<1||!locationChosen?'disabled':''}>Set trap</button></div>`,'confirmation-sheet');return;
  }
  if(panel==='roster'){
    let shown=traps.filter(t=>filter==='all'||(filter==='ready'&&ready(t))||(filter==='waiting'&&!ready(t))).sort((a,b)=>sortMode==='expiry'?a.expires-b.expires:sortMode==='newest'?b.id-a.id:sortMode==='distance'?distanceMeters(a)-distanceMeters(b):(ready(b)-ready(a))||(ready(a)?a.expires-b.expires:a.due-b.due));
    const rows=shown.length?shown.map(t=>`<article class="trap-row"><div class="trap-portrait">${img('trap')}</div><div class="trap-copy"><strong>Wooden trap ${t.id}</strong><small>${distanceText(t)}</small><p class="${!ready(t)?'wait':t.expires-now()<7200?'urgent':''}">${ready(t)?`Open · breaks in ${countdown(t.expires)}`:`Waiting · ${countdown(t.due)}`}</p></div><button class="trap-action ${ready(t)?'':'view'}" data-action="${ready(t)?'check':'view'}" data-id="${t.id}" aria-label="${ready(t)?'Open':'View'} trap ${t.id}">${ready(t)?'Open':'View'}</button></article>`).join(''):`<div class="empty-state">${img('trap')}<h3>${traps.length?'No traps in this view':'No traps out'}</h3><p>${traps.length?'Try another filter.':'Pack a trap and a biscuit to set one.'}</p></div>`;
    const controls=`<div class="roster-tools"><div class="tabs" role="group" aria-label="Filter traps">${[['all','All'],['ready','Ready'],['waiting','Waiting']].map(([id,label])=>`<button data-filter="${id}" class="${filter===id?'active':''}">${label}</button>`).join('')}</div><select id="sort-traps" aria-label="Sort traps">${[['ready','Ready first'],['expiry','Breaking soonest'],['newest','Newest placed'],['distance','Nearest']].map(([id,title])=>`<option value="${id}" ${id===sortMode?'selected':''}>${title}</option>`).join('')}</select></div>`;
    layers.innerHTML=shell('Your traps','',`<div class="roster-top"><button class="primary" data-action="start-place" ${state.scene!=='map'?'disabled':''}>+ Place trap</button>${state.scene!=='map'?'<p class="tiny-copy">Place traps from the world map.</p>':''}</div><p class="subline">${traps.length} placed · ${traps.filter(ready).length} ready to open</p>${controls}<div class="trap-list">${rows}</div>`,'','roster-sheet');return;
  }
  if(panel==='detail'){
    const t=traps.find(t=>t.id===detail);if(!t){panel='roster';render();return;}
    layers.innerHTML=shell('Wooden trap',`TRAP ${t.id}`,`<div class="body"><div class="hero">${img('trap')}<h3>${ready(t)?'Ready to open':'Waiting for a visitor'}</h3>${ready(t)?'<p class="unknown">What will you find?</p>':`<div class="timer-badge">${countdown(t.due)}</div>`}<p>${distanceText(t)}</p></div><p class="expiry">${ready(t)?`Breaks in ${countdown(t.expires)}`:'Collect within 24h after it is ready.'}</p></div>`,`<button class="primary" data-action="check" data-id="${t.id}" ${ready(t)?'':'disabled'}>Open trap</button><button class="quiet" data-action="cancel-prompt" data-id="${t.id}" style="width:100%">Remove trap</button>`);return;
  }
  if(panel==='cancel'){
    layers.innerHTML=shell('Remove this trap?','LEAVE NO TRACE',`<div class="body"><div class="hero">${img('trap')}</div><p class="warning">The trap, biscuit and any catch will be lost.</p></div>`,`<div class="row-actions"><button class="secondary" data-action="keep">Keep trap</button><button class="primary" data-action="remove" data-id="${detail}">Remove</button></div>`);return;
  }
  if(panel==='craft'){
    let pending=state.crafts.filter(c=>!c.collected);
    const queue=Array.from({length:3},(_,i)=>{const c=pending[i];return c?`<button class="slot ${c.due<=now()?'ready':''}" data-action="collect-craft" data-index="${state.crafts.indexOf(c)}" ${c.due>now()?'disabled':''}>${img('trap')}${c.due<=now()?'Collect':countdown(c.due)}</button>`:'<div class="slot">Empty slot</div>';}).join('');
    layers.innerHTML=shell('Workbench','MAKE SOMETHING USEFUL',`<div class="body"><div class="hero">${img('trap')}<h3>Wooden trap</h3><p>One trap. One chance to meet a Wildling.</p></div><div class="cost"><span>${img('softwood')} ${cfg.woodCost} Wood</span><span class="dot">·</span><span>${img('timer')} 30s</span></div><p class="tiny-copy">${state.wood} Wood in your bag</p><button class="primary" data-action="queue" ${state.wood<cfg.woodCost||pending.length>=3?'disabled':''}>Craft trap</button><div class="queue">${queue}</div></div>`);return;
  }
  if(panel==='bag'){
    const items=[['trap','Wooden trap',state.trapsInBag],['biscuit','Biscuit',state.biscuits],['softwood','Wood',state.wood],['flour','Flour',state.flour],['egg','Egg',state.eggs],['water','Water',state.water]];
    layers.innerHTML=shell('Inventory','READY FOR A LITTLE ADVENTURE',`<p class="subline">Your supplies for the next outing.</p><div class="body"><div class="grid">${items.map(([id,name,count])=>`<button class="item ${id==='trap'?'featured':''}" data-item="${id}" aria-label="${name}, ${count}">${img(id)}<b>${count}</b><span>${name}</span></button>`).join('')}</div></div>`);return;
  }
  if(panel==='success'){
    layers.innerHTML=shell('A new companion!','TRAP COLLECTED',`<div class="body"><div class="hero">${img('meadowling','result-stars')}<h3>Meadowling</h3><p>Added to your Wildlings.</p></div></div>`,`<button class="primary" data-action="collection">View Wildlings</button><button class="quiet" data-action="close" style="width:100%">Keep exploring</button>`);return;
  }
  if(panel==='empty'){
    layers.innerHTML=shell('Empty this time','TRAP COLLECTED',`<div class="body"><div class="hero">${img('trap')}<h3>No visitor this time</h3><p>The trap and biscuit are used.</p></div></div>`,`<button class="primary" data-action="close">Keep exploring</button>`);return;
  }
  if(panel==='collection'){
    const count=state.caught.length;
    layers.innerHTML=shell('Wildlings','YOUR COMPANIONS',`<p class="subline">${count} collected · ${count?1:0} species discovered</p><div class="body"><div class="grid collection-grid">${count?`<div class="item">${img('meadowling')}<b>Meadowling</b><span>${count} companions</span></div>`:''}<div class="item locked">${img('collection')}<b>Undiscovered</b></div></div></div>`);return;
  }
}
function notify(message,icon='trap'){
  const el=document.createElement('div');el.className='notice';el.innerHTML=`${img(icon)}<span>${message}</span>`;$('#notices').prepend(el);
  const n={id:++noticeIds,el};notices.unshift(n);while(notices.length>3)notices.pop().el.remove();
  let start;el.addEventListener('pointerdown',e=>{start=e.clientX;el.setPointerCapture(e.pointerId);});el.addEventListener('pointerup',e=>{if(start!==undefined&&Math.abs(e.clientX-start)>45)dismiss();start=undefined;});
  const dismiss=()=>{el.classList.add('out');setTimeout(()=>{el.remove();notices=notices.filter(x=>x.id!==n.id);},220);};setTimeout(dismiss,5000);
}
function collect(id){
  const t=state.traps.find(t=>t.id===id);if(!t||t.collected||t.cancelled)return;
  if(now()>=t.expires){state.traps=state.traps.filter(x=>x!==t);notify('This trap broke');panel='roster';render();return;}
  if(!ready(t)){detail=id;panel='detail';render();return;}
  t.collected=true;
  if(t.success){state.caught.push({id:`wildling-${id}`,species:'Meadowling'});panel='success';}else panel='empty';render();
}
function advance(seconds){
  const before=active(),wasReady=new Set(before.filter(ready).map(t=>t.id));
  const craftsReady=state.crafts.filter(c=>!c.collected&&c.due<=now()).length;
  state.time+=seconds;
  const broken=state.traps.filter(t=>!t.collected&&!t.cancelled&&now()>=t.expires);
  state.traps=state.traps.filter(t=>!broken.includes(t));
  const newlyReady=active().filter(t=>ready(t)&&!wasReady.has(t.id));
  if(broken.length)notify(broken.length===1?'One trap broke':`${broken.length} traps broke`);
  if(newlyReady.length)notify(newlyReady.length===1?'A trap is ready to open':`${newlyReady.length} traps are ready to open`);
  if(broken.length||newlyReady.length||craftsReady!==state.crafts.filter(c=>!c.collected&&c.due<=now()).length)pendingRender=true;
  if(pendingRender&&!pointerBusy&&document.activeElement?.tagName!=='SELECT')render();
  document.querySelectorAll('[data-until]').forEach(e=>{e.textContent=duration(+e.dataset.until-now());});
}
document.addEventListener('click',e=>{
  const toggle=e.target.closest('[data-map-layer]');if(toggle){const key=toggle.dataset.mapLayer;mapVisibility[key]=!mapVisibility[key];textNotices.post(`${key==='workers'?'Workers':'Traps'} ${mapVisibility[key]?'shown':'hidden'}`);render();return;}
  const feedback=e.target.closest('[data-feedback]');if(feedback){panel=null;placing=false;state.scene='map';render();
    const postRange=()=>textNotices.post('You are too far away',{color:'#ff625c',bold:true});
    if(feedback.dataset.feedback==='range')postRange();
    else if(feedback.dataset.feedback==='warning')textNotices.post('Warning preview',{color:'#ffbf47',bold:true});
    else if(feedback.dataset.feedback==='burst'){feedbackTimers.forEach(clearTimeout);feedbackTimers=[];document.querySelector('[data-map-layer="workers"]').click();feedbackTimers.push(setTimeout(()=>document.querySelector('[data-map-layer="traps"]').click(),220),setTimeout(postRange,440),setTimeout(()=>document.querySelector('[data-map-layer="workers"]').click(),660));}
    else textNotices.post('Map view updated');return;}
  const fixture=e.target.closest('[data-state]');if(fixture){fixtures(fixture.dataset.state);return;}
  const size=e.target.closest('[data-size]');if(size){const w=+size.dataset.size;$('#phone').style.width=w+'px';$('#phone').style.height=(w===360?640:844)+'px';document.querySelectorAll('[data-size]').forEach(x=>x.classList.toggle('selected',x===size));return;}
  const tab=e.target.closest('[data-filter]');if(tab){filter=tab.dataset.filter;render();return;}
  if(e.target.closest('[data-worker]')){document.querySelector('#workers').click();return;}
  const marker=e.target.closest('[data-trap]');if(marker){detail=+marker.dataset.trap;panel='detail';render();return;}
  const item=e.target.closest('[data-item]');if(item){if(item.dataset.item==='trap'){panel='roster';render();}else if(item.dataset.item==='biscuit')notify('Craft biscuits at the Bakery','biscuit');return;}
  const nav=e.target.closest('[data-nav]');if(nav){placing=false;if(nav.dataset.nav==='home'){state.scene=state.scene==='home'?'map':'home';panel=state.scene==='home'?'craft':null;}else panel=nav.dataset.nav;if(panel&&!['craft','bag','collection'].includes(panel)){panel=null;notify('This study focuses on traps','collection');}render();return;}
  const b=e.target.closest('[data-action]');if(!b)return;
  const id=+b.dataset.id;
  switch(b.dataset.action){
    case 'close':panel=null;break;
    case 'start-place':if(state.scene!=='map')return;trapChoice=null;baitChoice=null;locationChosen=false;panel='choose-trap';break;
    case 'select-trap':trapChoice='wooden-trap';break;
    case 'select-bait':baitChoice='biscuit';break;
    case 'next-bait':if(trapChoice)panel='choose-bait';break;
    case 'back-trap':panel='choose-trap';break;
    case 'next-location':if(baitChoice){panel=null;placing=true;}break;
    case 'back-bait':placing=false;panel='choose-bait';break;
    case 'review-place':if(locationChosen){placing=false;panel='confirm-place';}break;
    case 'back-location':panel=null;placing=true;break;
    case 'cancel-placement':placing=false;panel='roster';break;
    case 'place':if(state.scene!=='map'||panel!=='confirm-place'||!trapChoice||!baitChoice||!locationChosen||state.trapsInBag<1||state.biscuits<1)return;state.trapsInBag--;state.biscuits--;{const id=state.next++;state.traps.push(seedTrap(id,now()+cfg.waitSeconds,point.x,point.y,id%2===1));}placing=false;panel=null;notify('Trap set');break;
    case 'view':detail=id;panel='detail';break;
    case 'check':collect(id);return;
    case 'cancel-prompt':detail=id;panel='cancel';break;
    case 'keep':panel='detail';break;
    case 'remove':{const t=state.traps.find(t=>t.id===id);if(t)t.cancelled=true;}panel='roster';notify('Trap removed');break;
    case 'collection':panel='collection';break;
    case 'queue':if(state.wood<cfg.woodCost||state.crafts.filter(c=>!c.collected).length>=3)return;state.wood-=cfg.woodCost;state.crafts.push({due:Math.max(now(),...state.crafts.map(c=>c.due))+cfg.craftSeconds,collected:false});break;
    case 'collect-craft':{const c=state.crafts[+b.dataset.index];if(c&&!c.collected&&c.due<=now()){c.collected=true;state.trapsInBag++;notify('+1 Wooden trap');}}break;
  }render();
});
$('#map-input').addEventListener('click',e=>{const r=$('#phone').getBoundingClientRect();point={x:Math.max(5,Math.min(95,(e.clientX-r.left)/r.width*100)),y:Math.max(12,Math.min(70,(e.clientY-r.top)/r.height*100))};locationChosen=true;render();});
document.addEventListener('change',e=>{if(e.target.id==='sort-traps'){sortMode=e.target.value;render();}});
$('#traps').addEventListener('click',()=>{placing=false;panel='roster';filter='all';render();});
$('#workers').addEventListener('click',()=>notify('Workers keep their own list','worker'));
$('#wait-minute').addEventListener('click',()=>advance(60));$('#wait-day').addEventListener('click',()=>advance(86400));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(panel==='cancel')panel='detail';else panel=null;placing=false;render();}});
let pointerBusy=false;$('#phone').addEventListener('pointerdown',()=>pointerBusy=true);window.addEventListener('pointerup',()=>pointerBusy=false);window.addEventListener('pointercancel',()=>pointerBusy=false);
setInterval(()=>{if(document.hidden)return;const step=(performance.now()-stamp)/1000;stamp=performance.now();advance(step);},1000);
const query=new URLSearchParams(location.search);if(query.get('phone')==='1')document.body.classList.add('phone-only');fixtures(query.get('state')||'world');
