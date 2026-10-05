const concepts = [
  {id:'a',file:'a-village-green',title:'Village Green',description:'A generous shared lawn with buildings around its edges. Cloud-covered land continues behind the village, with one bridge leading farther out.',tradeoff:'Most freedom to rearrange. Connected expansion boundaries need clearer seams.'},
  {id:'b',file:'b-garden-terraces',title:'Garden Terraces',description:'A broad starting lawn below a raised garden terrace. Retaining walls and steps give the Home a stronger sense of place.',tradeoff:'More structured composition. Terraces create separate placement surfaces and less freedom across their edges.'},
  {id:'c',file:'c-bridge-neighborhoods',title:'Bridge Neighborhoods',description:'A central island with visible routes to future neighborhoods, plus an adjoining extension concealed behind the clouds.',tradeoff:'Clearest expansion destinations. Keep the starting island large as more land opens; pan instead of fitting everything onscreen.'}
];
const iconRoot='../VisualIdentity/assets/icons/';
function phone(c){return `<div class="phone" data-concept="${c.id}"><img class="art" src="artwork/${c.file}.png" alt="${c.title}: spacious grassy starter island with three concept buildings and cloud-covered expansion land"><div class="ui" aria-label="Navigation appearance only"><span class="arrange">Arrange</span><div class="nav">${['profile','collection','inventory','market','world'].map((icon,i)=>`<span class="nav-symbol ${i===0||i===4?'outer':''}"><img src="${iconRoot+icon}.svg" alt="${icon==='world'?'Return to world map':icon}"></span>`).join('')}</div><span class="home-indicator"></span></div></div>`;}
const query=new URLSearchParams(location.search);
if(query.get('phone')==='1'){
  const c=concepts.find(c=>c.id===query.get('concept'))||concepts[0];
  document.body.classList.add('only');
  document.querySelector('#phone-only').innerHTML=phone(c);
  if(query.get('ui')==='0')document.body.classList.add('hide-ui');
}else{
  document.querySelector('#concepts').innerHTML=concepts.map(c=>`<article class="concept">${phone(c)}<h2><span>${c.id.toUpperCase()}</span>${c.title}</h2><p>${c.description}</p><p class="tradeoff">${c.tradeoff}</p><div class="links"><a href="?phone=1&concept=${c.id}">Phone view</a><a href="artwork/${c.file}.png">Original artwork</a></div></article>`).join('');
  document.querySelector('#show-ui').addEventListener('change',e=>document.body.classList.toggle('hide-ui',!e.target.checked));
}
