// Illustrative browser backdrop, not a Unity texture or real geographic map.
(() => {
  'use strict';
  const canvas=document.querySelector('#depth-background'),ctx=canvas.getContext('2d');
  const phone=document.querySelector('#phone'),toggle=document.querySelector('#background-motion');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const tile=document.createElement('canvas');tile.width=tile.height=640;
  const paint=tile.getContext('2d');
  paint.fillStyle='#84b5c6';paint.fillRect(0,0,640,640);
  for(let i=0;i<15;i++)for(const ox of [-640,0,640])for(const oy of [-640,0,640]){
    const x=(i*197+75)%640+ox,y=(i*269+130)%640+oy;
    paint.fillStyle=['#90b49a','#a8b891','#aebca0','#7ba99d'][i%4];
    paint.beginPath();paint.ellipse(x,y,70+i%4*24,36+i%3*20,.25+i*.43,0,Math.PI*2);paint.fill();
  }
  const blurred=document.createElement('canvas');blurred.width=blurred.height=640;
  const brush=blurred.getContext('2d');brush.filter='blur(17px)';
  // Repeat outside the crop before blurring to preserve both texture seams.
  for(const x of [-640,0,640])for(const y of [-640,0,640])brush.drawImage(tile,x,y);
  const cloud=document.createElement('canvas');cloud.width=260;cloud.height=130;
  const puff=cloud.getContext('2d');
  for(const [x,y,r] of [[65,71,49],[105,49,44],[150,68,57],[195,81,41]]){
    const g=puff.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#fffef5c7');g.addColorStop(.45,'#f5f5f299');g.addColorStop(1,'#f5f5f200');
    puff.fillStyle=g;puff.beginPath();puff.arc(x,y,r,0,Math.PI*2);puff.fill();
  }
  const clouds=Array.from({length:9},(_,i)=>({x:(i*173+81)%640,y:((i*127+83)%844)/844,scale:.8+(i%4)*.24,speed:3.1+(i%5)*.85}));
  let width=390,height=844,frame=0,elapsed=0,last=0,drawnAt=-Infinity,enabled=false,visible=false;
  function draw(){
    const dpr=Math.min(devicePixelRatio||1,2);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#bad3dd';ctx.fillRect(0,0,width,height);
    const size=640,offset=(elapsed*1.1)%size;
    for(let x=offset-size;x<width;x+=size)for(let y=-100;y<height;y+=size)ctx.drawImage(blurred,x,y,size,size);
    ctx.fillStyle='#d9e7ef78';ctx.fillRect(0,0,width,height);
    for(const c of clouds){const cloudWidth=260*c.scale,span=width+2*cloudWidth,x=((c.x+elapsed*c.speed)%span)-cloudWidth,y=c.y*height-35;ctx.drawImage(cloud,x,y,cloudWidth,130*c.scale);}
  }
  function tick(now){
    frame=0;if(!visible||!enabled||document.hidden){last=0;return;}
    if(last)elapsed+=(now-last)/1000;last=now;
    if(now-drawnAt>=1000/24){drawnAt=now;draw();}
    frame=requestAnimationFrame(tick);
  }
  function refresh(){
    if(frame)cancelAnimationFrame(frame);frame=0;last=0;
    visible=document.body.dataset.studyScene==='home'&&document.body.dataset.studyView==='layout';
    enabled=toggle.checked;canvas.hidden=!visible;draw();
    if(visible&&enabled&&!document.hidden)frame=requestAnimationFrame(tick);
  }
  function resize(){const box=phone.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);draw();}
  toggle.checked=!reduced.matches&&new URLSearchParams(location.search).get('motion')!=='0';
  toggle.addEventListener('change',refresh);document.addEventListener('visibilitychange',refresh);
  reduced.addEventListener('change',e=>{toggle.checked=!e.matches;refresh();});
  new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:['data-study-scene','data-study-view']});
  new ResizeObserver(resize).observe(phone);resize();refresh();
  window.homeBackgroundStudy=Object.freeze({snapshot:()=>({enabled,visible,elapsed,landSpeed:1.1,cloudSpeeds:clouds.map(c=>c.speed),tileSize:640})});
})();
