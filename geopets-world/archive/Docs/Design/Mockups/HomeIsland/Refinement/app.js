(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const canvas=$('#scene'),ctx=canvas.getContext('2d'),phone=$('#phone');
  const icons='../../VisualIdentity/assets/icons/';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const initial=[{id:'cottage',name:'Cottage',u:0,v:6,w:4,d:3,turn:0,roof:'#498e82'}, {id:'mill',name:'Mill',u:6,v:4,w:3,d:3,turn:0,roof:'#438b7e'}, {id:'bakery',name:'Bakery',u:6,v:12,w:3,d:2,turn:0,roof:'#c97c4d'}];
  const regions=[{id:'starter',name:'Village Green',u:0,v:0,w:12,d:16},{id:'meadow',name:'Cloud Meadow',u:0,v:-6,w:6,d:6},{id:'clearing',name:'Far Clearing',u:6,v:-6,w:6,d:6},{id:'grove',name:'Bridge Grove',u:-9,v:3,w:6,d:6}];
  const sx=28,sy=sx/Math.sqrt(3); // orthographic-looking 35.264 degree pitch, 45 degree yaw
  let width=390,height=844,view={x:0,y:0,z:1},mode='art',scene='home',arrange=false,expanded=false;
  let buildings=clone(initial),draft=null,selected=null,noticeTimer,drawBounds=[],regionBounds=[];
  let pointers=new Map(),gesture=null,pinching=false,dirty=true,framePending=false;
  const project=(u,v)=>({x:(u-v)*sx,y:(u+v)*sy});
  const inverse=(x,y)=>({u:(x/sx+y/sy)/2,v:(y/sy-x/sx)/2});
  const toScreen=(u,v)=>{const p=project(u,v);return{x:p.x*view.z+view.x,y:p.y*view.z+view.y};};
  const fromScreen=(x,y)=>inverse((x-view.x)/view.z,(y-view.y)/view.z);
  const dims=b=>(b.turn%2)?{w:b.d,d:b.w}:{w:b.w,d:b.d};
  const contains=(r,u,v)=>u>=r.u&&v>=r.v&&u<r.u+r.w&&v<r.v+r.d;
  const regionAt=(u,v)=>regions.find(r=>contains(r,u,v));
  function validate(candidate){
    const a=dims(candidate);
    for(let u=candidate.u;u<candidate.u+a.w;u++)for(let v=candidate.v;v<candidate.v+a.d;v++){
      const r=regionAt(u,v);if(!r)return{ok:false,reason:'Keep the entire building on the island.'};
      if(r.id!=='starter'&&!expanded)return{ok:false,reason:'This land has not been unlocked.'};
    }
    for(const b of buildings){if(b.id===candidate.id)continue;const e=dims(b);
      if(candidate.u<b.u+e.w&&candidate.u+a.w>b.u&&candidate.v<b.v+e.d&&candidate.v+a.d>b.v)return{ok:false,reason:`Overlaps ${b.name}.`};
    }
    return{ok:true,reason:'Ready to place. Edge and corner cells are usable.'};
  }
  const worldMap=new Image();worldMap.src='../../WorldNavigation/assets/map-background.png';worldMap.onload=requestDraw;
  function path(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
  function polygon(points,fill,stroke,lineWidth=1){path(points);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}}
  function rectPoints(u,v,w,d,lift=0){return[[u,v],[u+w,v],[u+w,v+d],[u,v+d]].map(([a,b])=>{const p=project(a,b);return{x:p.x,y:p.y-lift};});}
  function ellipse(x,y,rx,ry,fill){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
  function line(a,b,color,lw){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.stroke();}
  function label(text,x,y,fill='#24483b',size=12){ctx.fillStyle=fill;ctx.font=`800 ${size}px Nunito, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,y);}
  function drawWalls(r){
    for(let u=r.u;u<r.u+r.w;u++)for(let v=r.v;v<r.v+r.d;v++){
      for(const edge of [{du:1,dv:0,a:[u+1,v],b:[u+1,v+1],shade:'#c1ae91'},{du:0,dv:1,a:[u+1,v+1],b:[u,v+1],shade:'#d9c6a6'}]){
        if(regionAt(u+edge.du,v+edge.dv))continue;
        const a=project(...edge.a),b=project(...edge.b),drop=35;
        polygon([a,b,{x:b.x,y:b.y+drop},{x:a.x,y:a.y+drop}],edge.shade);
        line({x:a.x,y:a.y+17},{x:b.x,y:b.y+17},'#b7a78e',.7);
        line({x:(a.x+b.x)/2,y:(a.y+b.y)/2},{x:(a.x+b.x)/2,y:(a.y+b.y)/2+17},'#b7a78e',.7);
        line(a,b,'#cadc91',3); // rim lies on/outside the boundary; cells remain available
      }
    }
  }
  function drawLand(r){
    const colors=['#accb76','#a8c871','#b0cd7a','#abca74'];
    polygon(rectPoints(r.u,r.v,r.w,r.d),colors[0]);
    for(let u=r.u;u<r.u+r.w;u++)for(let v=r.v;v<r.v+r.d;v++){
      const n=((u*17+v*31)%11+11)%11;
      polygon(rectPoints(u,v,1,1),colors[((u+v)&1)?0:1]);
      if(n===2||n===6){const p=project(u+.28,v+.69);line(p,{x:p.x+2,y:p.y-2},'#d1df9b50',.8);}
    }
    if(arrange&&(r.id==='starter'||expanded)){
      ctx.globalAlpha=.43;
      for(let u=r.u;u<=r.u+r.w;u++)line(project(u,r.v),project(u,r.v+r.d),'#edf3c8',.65);
      for(let v=r.v;v<=r.v+r.d;v++)line(project(r.u,v),project(r.u+r.w,v),'#edf3c8',.65);
      ctx.globalAlpha=1;
    }
  }
  function drawBridge(){
    const points=rectPoints(-3,5,3,1.5,3);polygon(points,'#b68856','#866740',1.2);
    for(let u=-3;u<=0;u+=.3)line(project(u,5),project(u,6.5),'#ddbb86',1.2);
    for(const v of [5,6.5]){line({...project(-3,v),y:project(-3,v).y-12},{...project(0,v),y:project(0,v).y-12},'#8c6743',2);for(const u of [-3,-1.5,0]){const p=project(u,v);line(p,{x:p.x,y:p.y-17},'#aa8050',4);}}
  }
  function drawTree(u,v,size=1){
    const p=project(u,v);ellipse(p.x+6,p.y+2,16*size,7*size,'#3b612d21');
    line(p,{x:p.x,y:p.y-27*size},'#93714a',5*size);
    ellipse(p.x,p.y-32*size,19*size,22*size,'#6e9859');ellipse(p.x-8*size,p.y-37*size,13*size,16*size,'#87ad67');ellipse(p.x+6*size,p.y-44*size,12*size,15*size,'#a3bf75');
  }
  function drawBuilding(b,isDraft=false){
    const d=dims(b),valid=isDraft?validate(b):{ok:true},base=rectPoints(b.u,b.v,d.w,d.d),center=project(b.u+d.w/2,b.v+d.d/2);
    if(arrange)polygon(base,isDraft?(valid.ok?'#316f5550':'#bd4b4b55'):'#264c3918',isDraft?(valid.ok?'#245f45':'#a73535'):'#6e885144',isDraft?2:1);
    const inset=.20,body=rectPoints(b.u+inset,b.v+inset,d.w-2*inset,d.d-2*inset),h=b.id==='mill'?49:34;
    const top=body.map(p=>({x:p.x,y:p.y-h}));
    ellipse(center.x+9,center.y+9,24,9,'#315b2629');
    polygon([body[1],body[2],top[2],top[1]],'#d9c39c','#a89773',1);
    polygon([body[2],body[3],top[3],top[2]],'#f4e3bc','#b7a783',1);
    polygon(top,b.roof,'#356658',1.1);
    const ridgeA={x:(top[0].x+top[1].x)/2,y:(top[0].y+top[1].y)/2-23},ridgeB={x:(top[3].x+top[2].x)/2,y:(top[3].y+top[2].y)/2-23};
    polygon([top[0],top[3],ridgeB,ridgeA],b.roof,'#345c4d80',.8);polygon([top[1],top[2],ridgeB,ridgeA],b.id==='bakery'?'#db925e':'#65a496','#345c4d80',.8);
    const door={x:(body[2].x+body[3].x)/2,y:(body[2].y+body[3].y)/2};
    polygon([{x:door.x-5,y:door.y},{x:door.x+5,y:door.y-3},{x:door.x+5,y:door.y-22},{x:door.x-5,y:door.y-19}],'#987351','#755b3b',.7);
    if(b.id==='mill'){
      const hub={x:door.x,y:door.y-47};for(let i=0;i<4;i++){const angle=.38+i*Math.PI/2;const dx=Math.cos(angle),dy=Math.sin(angle);polygon([{x:hub.x+dx*6-dy*3,y:hub.y+dy*6+dx*3},{x:hub.x+dx*33-dy*6,y:hub.y+dy*33+dx*6},{x:hub.x+dx*33+dy*5,y:hub.y+dy*33-dx*5},{x:hub.x+dx*7+dy*2,y:hub.y+dy*7-dx*2}],'#f3dfb1','#917749',1);}ellipse(hub.x,hub.y,4,4,'#9d7950');
    }
    if(b.id==='bakery'){const canopy=rectPoints(b.u+.2,b.v+d.d-.3,d.w-.4,.7,24);polygon(canopy,'#f6deb0','#bd814d',1);const p=project(b.u+d.w/2,b.v+d.d+.15);label('BAKERY',p.x,p.y-26,'#8a6444',6);}
    const labelY=Math.max(...body.map(p=>p.y))+11;
    ctx.fillStyle='#faf4e5ed';ctx.beginPath();ctx.roundRect(center.x-30,labelY-9,60,18,7);ctx.fill();label(b.name,center.x,labelY,'#24483b',10);
    const xs=[...base,...top,ridgeA,ridgeB].map(p=>p.x),ys=[...base,...top,ridgeA,ridgeB].map(p=>p.y);
    drawBounds.push({id:b.id,x:Math.min(...xs)-5,y:Math.min(...ys)-8,w:Math.max(...xs)-Math.min(...xs)+10,h:labelY-Math.min(...ys)+20});
  }
  function drawCloudRegion(r){
    if(expanded)return;
    const corners=rectPoints(r.u,r.v,r.w,r.d),c=project(r.u+r.w/2,r.v+r.d/2);
    ctx.save();path(corners);ctx.clip();
    polygon(corners,'#84a9cb');
    for(let u=r.u-1;u<r.u+r.w+1;u+=1.6)for(let v=r.v-1;v<r.v+r.d+1;v+=1.5){const p=project(u+.5,v+.4);const g=ctx.createRadialGradient(p.x-7,p.y-9,2,p.x,p.y,46);g.addColorStop(0,'#e1edf9');g.addColorStop(1,'#a5c4e300');ellipse(p.x,p.y,48,31,g);}
    ctx.restore();
    polygon(corners,null,'#eef0f780',2);
    ctx.fillStyle='#faf4e5f2';ctx.beginPath();ctx.roundRect(c.x-47,c.y-18,94,37,14);ctx.fill();
    label('▣',c.x,c.y-8,'#74877a',11);label(r.name,c.x,c.y+7,'#486452',10);
    regionBounds.push({id:r.id,x:c.x-50,y:c.y-25,w:100,h:50});
  }
  function draw(){
    framePending=false;if(!dirty)return;dirty=false;const dpr=Math.min(devicePixelRatio||1,2);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    if(scene==='world'){if(worldMap.complete&&worldMap.naturalWidth)ctx.drawImage(worldMap,0,0,width,height);return;}
    ctx.save();ctx.translate(view.x,view.y);ctx.scale(view.z,view.z);drawBounds=[];regionBounds=[];
    regions.forEach(drawWalls);regions.forEach(drawLand);drawBridge();
    const objects=buildings.filter(b=>!draft||b.id!==draft.id).map(b=>({b,draft:false}));if(draft)objects.push({b:draft,draft:true});
    objects.sort((a,b)=>(a.b.u+a.b.v)-(b.b.u+b.b.v)).forEach(o=>drawBuilding(o.b,o.draft));
    regions.filter(r=>r.id!=='starter').forEach(drawCloudRegion);ctx.restore();
  }
  function requestDraw(){dirty=true;if(!framePending){framePending=true;requestAnimationFrame(draw);}}
  function workingView(){view.z=Math.min(width/390,height/844)*1.04;const center=project(6,8);view.x=width*.5-center.x*view.z;view.y=height*.47-center.y*view.z;requestDraw();}
  function overview(){setMode('layout');view.z=Math.min(width/920,height/770);const center=project(3.5,5);view.x=width*.5-center.x*view.z;view.y=height*.43-center.y*view.z;requestDraw();}
  function resize(){const box=phone.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);workingView();}
  function setMode(next){mode=next;document.body.dataset.studyView=mode;document.body.dataset.studyScene=scene;$('#art').hidden=mode!=='art'||scene!=='home';canvas.hidden=mode==='art'&&scene==='home';document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===mode)));requestDraw();}
  function showNotice(message){clearTimeout(noticeTimer);$('#status').textContent=message;$('#status').hidden=false;noticeTimer=setTimeout(()=>{$('#status').hidden=true;},3200);}
  function updateUi(){
    $('#arrange').textContent=arrange?'Done':'Arrange';$('#arrange').hidden=scene!=='home';$('#center').hidden=scene!=='home';
    $('#move-panel').hidden=!draft||!arrange;
    if(draft){const d=dims(draft),v=validate(draft);$('#move-name').textContent=draft.name;$('#move-size').textContent=`${d.w} × ${d.d}`;$('#move-validity').textContent=v.reason;$('#move-validity').classList.toggle('invalid',!v.ok);$('#place').disabled=!v.ok;}
    const occupied=buildings.reduce((sum,b)=>sum+b.w*b.d,0),available=expanded?regions.reduce((sum,r)=>sum+r.w*r.d,0):192;
    $('#metrics').textContent=`${available} available cells · ${occupied} occupied · ${available-occupied} free. Decorative walls reserve no placement cells.`;
    const dest=scene==='home'?'world':'home';$('#navigation').innerHTML=`<div class="nav">${['profile','collection','inventory','market',dest].map((name,i)=>i===4?`<button class="nav-symbol outer" id="travel" aria-label="${scene==='home'?'Return to world':'Return Home'}"><img src="${icons+name}.svg" alt=""></button>`:`<span class="nav-symbol ${i===0?'outer':''}"><img src="${icons+name}.svg" alt="${name}"></span>`).join('')}</div>`;
    $('#travel').onclick=()=>{closeModal();draft=null;selected=null;arrange=false;scene=scene==='home'?'world':'home';setMode(scene==='world'?'layout':mode);updateUi();requestDraw();};requestDraw();
  }
  function selectBuilding(id){selected=id;draft=clone(buildings.find(b=>b.id===id));updateUi();}
  function closeModal(){const modal=$('#modal');modal.hidden=true;modal.innerHTML='';}
  function openModal(title,body,link){$('#modal').innerHTML=`<section class="sheet" role="dialog" aria-modal="true" aria-label="${title}"><h2>${title}</h2><p>${body}</p><div class="links">${link||''}<button id="close-modal">Close</button></div></section>`;$('#modal').hidden=false;$('#close-modal').onclick=closeModal;$('#close-modal').focus();}
  $('#modal').addEventListener('pointerdown',e=>{if(e.target===$('#modal')){e.preventDefault();e.stopPropagation();closeModal();}});
  function hit(bounds,p){return [...bounds].reverse().find(b=>p.x>=b.x&&p.y>=b.y&&p.x<=b.x+b.w&&p.y<=b.y+b.h);}
  function local(event){const r=canvas.getBoundingClientRect();return{x:event.clientX-r.left,y:event.clientY-r.top};}
  function worldPixel(p){return{x:(p.x-view.x)/view.z,y:(p.y-view.y)/view.z};}
  function zoomAt(factor,p){const anchor=worldPixel(p);view.z=Math.max(.32,Math.min(1.7,view.z*factor));view.x=p.x-anchor.x*view.z;view.y=p.y-anchor.y*view.z;requestDraw();}
  canvas.addEventListener('wheel',e=>{e.preventDefault();if(scene==='home')zoomAt(Math.exp(-e.deltaY*.0012),local(e));},{passive:false});
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0||scene!=='home')return;e.preventDefault();canvas.focus({preventScroll:true});const p=local(e);pointers.set(e.pointerId,p);canvas.setPointerCapture(e.pointerId);
    if(pointers.size===2){const [a,b]=[...pointers.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};gesture={type:'pinch',distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:view.z,anchor:worldPixel(mid)};pinching=true;return;}
    if(pinching)return;
    const building=hit(drawBounds,worldPixel(p));
    if(arrange&&building){selectBuilding(building.id);const uv=fromScreen(p.x,p.y);gesture={type:'building',start:p,offset:{u:uv.u-draft.u,v:uv.v-draft.v},moved:false};}
    else gesture={type:'pan',start:p,view:clone(view),building:building?.id,region:hit(regionBounds,worldPixel(p))?.id,moved:false};
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId)||!gesture)return;const p=local(e);pointers.set(e.pointerId,p);
    if(gesture.type==='pinch'&&pointers.size===2){const[a,b]=[...pointers.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};view.z=Math.max(.32,Math.min(1.7,gesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(gesture.distance,1)));view.x=mid.x-gesture.anchor.x*view.z;view.y=mid.y-gesture.anchor.y*view.z;requestDraw();return;}
    if(pinching)return;
    const dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;if(Math.hypot(dx,dy)>4)gesture.moved=true;
    if(gesture.type==='building'&&gesture.moved&&draft){const uv=fromScreen(p.x,p.y);draft.u=Math.round(uv.u-gesture.offset.u);draft.v=Math.round(uv.v-gesture.offset.v);updateUi();}
    else if(gesture.type==='pan'&&gesture.moved){view.x=gesture.view.x+dx;view.y=gesture.view.y+dy;requestDraw();}
  });
  function pointerEnd(e,cancelled){
    if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);
    if(!cancelled&&!pinching&&gesture?.type==='pan'&&!gesture.moved){
      if(gesture.building&&!arrange){const b=buildings.find(b=>b.id===gesture.building);openModal(b.name,b.id==='cottage'?'Your cottage can be rearranged with the other Home buildings.':'Tap this building to open its recipes and queue.',b.id!=='cottage'?`<a href="../../HomeCrafting/index.html?phone=1&state=${b.id}" target="_blank" rel="noopener">Open the crafting study</a>`:'');}
      else if(gesture.region){const r=regions.find(r=>r.id===gesture.region);openModal(r.name,'More room for your Home, waiting beyond the clouds.');}
    }
    if(pointers.size===0){gesture=null;pinching=false;}else if(pinching)gesture={type:'blocked'};
  }
  canvas.addEventListener('pointerup',e=>pointerEnd(e,false));canvas.addEventListener('pointercancel',e=>pointerEnd(e,true));
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{draft=null;arrange=false;setMode(b.dataset.view);updateUi();});
  $('#arrange').onclick=()=>{setMode('layout');arrange=!arrange;draft=null;selected=null;updateUi();if(arrange)showNotice('Drag a building, then confirm its position.');};
  $('#center').onclick=workingView;$('#reset-view').onclick=()=>{setMode('layout');workingView();};$('#overview').onclick=overview;
  $('#reset-layout').onclick=()=>{buildings=clone(initial);draft=null;expanded=false;$('#preview-expansions').checked=false;workingView();updateUi();};
  $('#preview-expansions').onchange=e=>{expanded=e.target.checked;draft=null;if(!expanded)buildings=clone(initial);setMode('layout');updateUi();};
  $('#turn').onclick=()=>{if(draft){draft.turn=(draft.turn+1)%4;updateUi();}};
  $('#cancel').onclick=()=>{draft=null;selected=null;updateUi();};
  $('#place').onclick=()=>{if(draft&&validate(draft).ok){buildings=buildings.map(b=>b.id===draft.id?clone(draft):b);const name=draft.name;draft=null;selected=null;updateUi();showNotice(`${name} placed.`);}};
  addEventListener('keydown',e=>{if(!$('#modal').hidden){if(e.key==='Escape'){e.preventDefault();closeModal();}return;}if(e.key==='Escape'){draft=null;selected=null;arrange=false;updateUi();return;}if(arrange&&draft){const moves={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(moves[e.key]){e.preventDefault();draft.u+=moves[e.key][0];draft.v+=moves[e.key][1];updateUi();}}});
  new ResizeObserver(resize).observe(phone);
  const params=new URLSearchParams(location.search);if(params.get('phone')==='1')document.body.classList.add('only');
  setMode(params.get('view')==='layout'?'layout':'art');if(params.get('state')==='arrange'){setMode('layout');arrange=true;selectBuilding('mill');}if(params.get('state')==='expanded'){expanded=true;$('#preview-expansions').checked=true;setMode('layout');}
  updateUi();resize();document.fonts.ready.then(requestDraw);
  // Read-only oracle for the browser review; no gameplay backend or persistence.
  window.homeLayoutStudy=Object.freeze({snapshot:()=>clone({view,mode,scene,arrange,expanded,buildings,draft,selected,valid:draft?validate(draft):null,regions,drawBounds}),project:(u,v)=>toScreen(u,v),inverse:(x,y)=>fromScreen(x,y),validate:candidate=>validate(clone(candidate))});
})();
