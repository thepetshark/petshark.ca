/* Browser-only layout fixture. Current-game mode displays unmodified Unity captures. */
const iconRoot = '../../../../Assets/_GeoPets/Content/UI/Icons/';
const stations = {
  bakery:{name:'Bakery',icon:'butter',capacity:3,recipes:[
    {id:'butter',name:'Butter',time:'1m',need:{milk:3}},
    {id:'cheese',name:'Cheese',time:'1m 30s',need:{milk:3}},
    {id:'yak-cream',name:'Yak cream',time:'1m 30s',need:{'yak-milk':2}},
    {id:'biscuit',name:'Biscuit',time:'1m',need:{flour:1,egg:1,water:1}},
    {id:'milk-bun',name:'Milk bun',time:'1m',need:{flour:1,milk:2}}
  ]},
  mill:{name:'Mill',icon:'flour',capacity:3,recipes:[
    {id:'flour',name:'Flour',time:'30s',need:{wheat:2}},
    {id:'sugar',name:'Sugar',time:'1m 30s',need:{sugarcane:3}}
  ]}
};
const baseInventory={milk:0,'yak-milk':0,egg:0,water:0,flour:0,wheat:3,sugarcane:0};
const fullInventory={milk:9,'yak-milk':4,egg:4,water:4,flour:3,wheat:8,sugarcane:8};
const params=new URLSearchParams(location.search);
const state={mode:'current',open:true,size:['360','compact'].includes(params.get('size'))?'compact':'large',station:'bakery',view:'station',fixture:'capture',selected:{bakery:'butter',mill:'flour'},jobs:{bakery:[],mill:[]},inventory:{...baseInventory},search:'',focus:'biscuit',message:''};
const phone=document.getElementById('phone'),capture=document.getElementById('current-capture'),proposal=document.getElementById('proposal'),header=document.getElementById('sheet-header'),scroll=document.getElementById('sheet-scroll'),footer=document.getElementById('sheet-footer');
if(params.has('phone'))document.body.classList.add('phone-only');
const picture=(id,cls='')=>'<img class="'+cls+'" src="'+iconRoot+id+'.png" alt="">';
const station=()=>stations[state.station],recipe=(s,id)=>stations[s].recipes.find(r=>r.id===id);
const ready=r=>Object.entries(r.need).every(([id,n])=>(state.inventory[id]||0)>=n);
const full=s=>state.jobs[s].length>=stations[s].capacity;
const labels={milk:'Milk','yak-milk':'Yak milk',egg:'Egg',water:'Water',flour:'Flour',wheat:'Wheat',sugarcane:'Sugarcane'};
function ingredients(r){return Object.entries(r.need).map(([id,n])=>'<span class="chip '+((state.inventory[id]||0)<n?'short':'')+'">'+picture(id)+(state.inventory[id]||0)+'/'+n+'</span>').join('')}
function row(s,r){const selected=state.view!=='path'&&state.station===s&&state.selected[s]===r.id,can=ready(r);return '<article class="recipe '+(selected?'selected':'')+'" data-id="'+r.id+'"><button class="recipe-pick" data-select="'+r.id+'" data-from="'+s+'" aria-label="Select '+r.name+' at '+stations[s].name+'"></button>'+picture(r.id,'recipe-icon')+'<span class="recipe-name">'+r.name+' ×1</span><span class="recipe-time">'+r.time+'</span><span class="recipe-state '+(can?'ready':'')+'">'+(can?'Ready':'Missing')+'</span><span class="chips">'+ingredients(r)+'</span></article>'}
function stationContent(){const s=station(),jobs=state.jobs[state.station];return '<p class="section-title">Queue · '+jobs.length+' of '+s.capacity+'</p>'+(jobs.length?jobs.map((id,i)=>'<div class="queue-row">'+picture(id)+'<span><b>'+recipe(state.station,id).name+'</b>'+(i?'Queued':'Working')+'</span></div>').join(''):'<p class="queue-empty">No batches yet. Pick a recipe below and start it.</p>')+'<div class="inline-links"><button id="all-entry">All crafting ›</button><button id="path-entry">Item path ›</button></div><p class="section-title">Recipes · '+s.recipes.length+'</p>'+s.recipes.map(r=>row(state.station,r)).join('')}
function overviewContent(){const q=state.search.toLowerCase();return '<button class="back" data-back>‹ Back to station</button><p class="subhead">Recipes across your stations</p><input id="search" class="search" type="search" placeholder="Search recipes" aria-label="Search recipes" value="'+state.search.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')+'">'+Object.entries(stations).map(([id,s])=>{const rows=s.recipes.filter(r=>r.name.toLowerCase().includes(q));return rows.length?'<div class="group">'+s.name+' · '+state.jobs[id].length+'/'+s.capacity+' slots<button data-open="'+id+'">Open ›</button></div>'+rows.map(r=>row(id,r)).join(''):''}).join('')}
function findRecipe(item){for(const [id,s] of Object.entries(stations)){const r=s.recipes.find(r=>r.id===item);if(r)return {station:id,recipe:r}}return null}
function pathNode(item,count,visited=new Set()){
 const found=findRecipe(item),title=found?.recipe.name||labels[item]||item;
 if(visited.has(item))return '<p class="feedback">Recipe loop: '+title+'</p>';
 const source=found?stations[found.station].name:item==='water'?'POI pickup':['milk','yak-milk','egg'].includes(item)?'Animal source':'World resource';
 const node='<div class="path-row">'+picture(item)+'<span><b>'+title+' ×'+count+'</b><small>'+source+' · owned '+(state.inventory[item]||0)+'</small></span></div>';
 if(!found)return node;
 const next=new Set(visited);next.add(item);
 return node+'<div class="indent">'+Object.entries(found.recipe.need).map(([id,n])=>pathNode(id,n*count,next)).join('')+'</div>';
}
function pathContent(){const title=findRecipe(state.focus)?.recipe.name||state.focus;return '<button class="back" data-back>‹ Back to station</button><p class="subhead">'+title+' path · one item</p>'+pathNode(state.focus,1)}
function render(){document.querySelector('.sheet').hidden=!state.open;proposal.classList.toggle('closed',!state.open);phone.dataset.size=state.size;capture.src='Captures/current-crafting-'+state.station+'-390.png';capture.alt='Unmodified Unity capture of the '+station().name+' crafting sheet at 390 by 844';capture.hidden=state.mode!=='current';proposal.hidden=state.mode!=='proposed';document.getElementById('below').textContent=state.mode==='current'?(state.size==='large'?'Current Unity capture · 390 × 844 native':'Current Unity capture scaled from 390 × 844; compact was not captured'):'Proposed sheet over the current Hometown capture · browser fixture only';document.querySelectorAll('[data-mode],[data-size],[data-station],[data-fixture]').forEach(b=>{const key=b.dataset.mode?'mode':b.dataset.size?'size':b.dataset.station?'station':'fixture';b.setAttribute('aria-pressed',String(b.dataset[key]===state[key]))});
 const s=station(),inner=state.view==='station';header.innerHTML=picture(inner?s.icon:state.view==='overview'?'flour':state.focus,'station-icon')+'<div class="station-title"><h2>'+(inner?s.name:state.view==='overview'?'All crafting':'Item path')+'</h2><small>'+(inner?'Level 1 · '+state.jobs[state.station].length+' of '+s.capacity+' slots in use':(state.view==='overview'?'Your buildings':'Ingredients'))+'</small></div>'+(inner?'<div class="station-arrows"><button data-step="-1" aria-label="Previous station">‹</button><button data-step="1" aria-label="Next station">›</button></div>':'')+'<button class="close" id="close" aria-label="Close crafting">×</button>';
 scroll.innerHTML=inner?stationContent():state.view==='overview'?overviewContent():pathContent();
 const chosen=recipe(state.station,state.selected[state.station]),blocked=full(state.station),can=chosen&&ready(chosen)&&!blocked;
 footer.innerHTML=state.view!=='path'?'<button class="primary" id="start" '+(can?'':'disabled')+'>'+(blocked?'Queue full':!ready(chosen)?'Missing ingredients':state.jobs[state.station].length?'Queue '+chosen.name:'Start '+chosen.name)+'</button><p class="feedback" role="status">'+(state.message|| (blocked?'Queue is full.':!ready(chosen)?'You need more '+Object.entries(chosen.need).filter(([id,n])=>(state.inventory[id]||0)<n).map(([id])=>labels[id]||id).join(', ')+'.':'Ingredients are used when the batch is queued.'))+'</p>':'<button class="primary" data-open="'+(findRecipe(state.focus)?.station||state.station)+'">Open '+stations[findRecipe(state.focus)?.station||state.station].name+'</button>';
}
function resetFixture(value){state.fixture=value;state.inventory={...(value==='capture'?baseInventory:fullInventory)};state.jobs={bakery:[],mill:[]};if(value==='full')state.jobs[state.station]=Array(station().capacity).fill(station().recipes[0].id);state.message='';render()}
function openStation(id){state.open=true;state.station=id;state.view='station';state.message='';render()}
function step(dir){const ids=Object.keys(stations);openStation(ids[(ids.indexOf(state.station)+dir+ids.length)%ids.length])}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.mode){state.mode=b.dataset.mode;state.open=true;render()}else if(b.dataset.size){state.size=b.dataset.size;render()}else if(b.dataset.station){openStation(b.dataset.station)}else if(b.dataset.fixture){resetFixture(b.dataset.fixture)}else if(b.dataset.step){step(Number(b.dataset.step))}else if(b.id==='all-entry'){state.view='overview';render()}else if(b.id==='path-entry'){state.focus=state.selected[state.station];state.view='path';render()}else if(b.dataset.back!==undefined){state.view='station';render()}else if(b.dataset.open){openStation(b.dataset.open)}else if(b.dataset.select){state.station=b.dataset.from;state.selected[state.station]=b.dataset.select;state.message='';render()}else if(b.id==='start'){const r=recipe(state.station,state.selected[state.station]);if(!r||!ready(r)||full(state.station))return;Object.entries(r.need).forEach(([id,n])=>state.inventory[id]-=n);state.jobs[state.station].push(r.id);state.message=r.name+' queued';render()}else if(b.id==='close'){state.open=false;render()}});
scroll.addEventListener('input',e=>{if(e.target.id!=='search')return;state.search=e.target.value;const pos=e.target.selectionStart;render();const input=document.getElementById('search');input?.focus();input?.setSelectionRange(pos,pos)});
let swipe=null;scroll.addEventListener('pointerdown',e=>{swipe=state.view==='station'&&!e.target.closest('button,input')?{x:e.clientX,y:e.clientY}:null});scroll.addEventListener('pointerup',e=>{if(!swipe)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;swipe=null;if(Math.abs(dx)>56&&Math.abs(dx)>Math.abs(dy)*1.5)step(dx<0?1:-1)});scroll.addEventListener('pointercancel',()=>swipe=null);
document.addEventListener('keydown',e=>{if(state.mode!=='proposed'||state.view!=='station'||!['ArrowLeft','ArrowRight'].includes(e.key)||e.target.closest('button,input'))return;e.preventDefault();step(e.key==='ArrowRight'?1:-1)});
render();
