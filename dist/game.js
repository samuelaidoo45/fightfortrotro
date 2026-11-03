import {Round,MODES,ARENAS,DOOR,distance} from './core.js';
import {Stage} from './stage.js';
const $=s=>document.querySelector(s);
const keys=new Set();let mode='normal',arena=ARENAS[0],round=null,paused=false,stage,lastTime=performance.now(),messageTimeout,comboTimeout,sound=false,audio;
let records={};try{records=JSON.parse(localStorage.getItem('trotro-records')||'{}');}catch{}
function soundEffect(type){
  if(!sound)return;
  try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);
    const tones={swing:[170,70,.12],hit:[95,35,.13],damage:[75,30,.2],block:[330,160,.08],dodge:[200,400,.1],pickup:[440,880,.18],down:[130,55,.3],won:[440,880,.4],missed:[220,90,.4]};const [a,b,t]=tones[type]||tones.hit;osc.type=type==='pickup'||type==='won'?'sine':'triangle';osc.frequency.setValueAtTime(a,now);osc.frequency.exponentialRampToValueAtTime(b,now+t);gain.gain.setValueAtTime(.1,now);gain.gain.exponentialRampToValueAtTime(.001,now+t);osc.start(now);osc.stop(now+t);
  }catch{sound=false;}
}
function announce(text,duration=2700){$('#announcement').textContent=text;$('#announcement').classList.add('show');clearTimeout(messageTimeout);messageTimeout=setTimeout(()=>$('#announcement').classList.remove('show'),duration);}
function getMovement(){const up=keys.has('w')||keys.has('arrowup'),down=keys.has('s')||keys.has('arrowdown'),left=keys.has('a')||keys.has('arrowleft'),right=keys.has('d')||keys.has('arrowright');return{x:(right-left)*.76+(down-up)*.65,z:(left-right)*.65+(down-up)*.76};}
function action(type){if(!round||paused||round.status!=='playing')return;if(type==='attack')round.attack();if(type==='dodge'){const m=getMovement();round.dodge(m.x,m.z);}if(type==='pickup')round.pickup();}
function selectArena(next){arena=next;stage.build(arena);$('#scene-caption').textContent=`${arena.name}, Accra`;$('#arena-detail').textContent=arena.description;$('#maps-link').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(arena.query)}`;document.querySelectorAll('.arena-choice').forEach(el=>{const on=el.dataset.arena===arena.id;el.classList.toggle('selected',on);el.setAttribute('aria-pressed',on);});}
function start(){
  for(const d of document.querySelectorAll('dialog[open]'))d.close();keys.clear();paused=false;round=new Round(mode);stage.build(arena);stage.begin(round);document.body.classList.add('playing');$('#hud').hidden=false;$('#round-location').textContent=`${arena.name} · ${mode[0].toUpperCase()+mode.slice(1)}`;$('#combo').textContent='';$('#start').blur();announce('Last seat! Get ready for the rush.',2600);updateHUD();
}
function pause(){if(!round||round.status!=='playing'||paused)return;paused=true;keys.clear();$('#pause-dialog').showModal();}
function resume(){paused=false;keys.clear();$('#pause-dialog').close();lastTime=performance.now();}
function lobby(){for(const d of document.querySelectorAll('dialog[open]'))d.close();round=null;paused=false;keys.clear();$('#hud').hidden=true;document.body.classList.remove('playing');stage.build(arena);$('#start').focus({preventScroll:true});}
function finish(result){
  keys.clear();$('#announcement').classList.remove('show');const won=result==='won';$('#result-eyebrow').textContent=won?'Last seat secured':result==='missed'?'The trotro has left':'The crowd got you';$('#result-title').textContent=won?'You made it.':result==='missed'?'Chale. Next one.':'Down, but not done.';$('#result-description').textContent=won?'The door closes. The city rolls by. Next stop: home.':result==='missed'?'Time ran out. Take the outside lane and save stamina for the door.':'Read the orange wind-up ring. Block or dodge, then strike back.';
  $('#result-time').textContent=`${round.elapsed.toFixed(1)}s`;$('#result-kos').textContent=round.kos;$('#result-hp').textContent=Math.ceil(round.player.hp);const key=`${arena.id}-${mode}`;let best=records[key];if(won&&(!best||round.elapsed<best)){best=records[key]=round.elapsed;try{localStorage.setItem('trotro-records',JSON.stringify(records));}catch{}$('#best-time').textContent='Your fastest escape at this stop!';}else $('#best-time').textContent=best?`Your best on ${mode}: ${best.toFixed(1)} seconds`:'Every rush teaches you something.';soundEffect(won?'won':'missed');$('#result').showModal();
}
function updateHUD(){
  if(!round)return;const p=round.player;$('#health-fill').style.width=`${p.hp}%`;$('#health-fill').style.background=p.hp<30?'#e68e75':'#96cf9f';$('#stamina-fill').style.width=`${p.stamina}%`;$('#health-text').textContent=`${Math.ceil(p.hp)} health`;$('#timer').innerHTML=`${Math.max(0,Math.ceil(round.config.time-round.elapsed))}<span>s</span>`;$('#timer').style.color=round.config.time-round.elapsed<15?'#ffba84':'';$('#weapon-label').textContent=p.weapon?'Travel bag':'Bare hands';$('#knockdowns').textContent=round.kos;
  $('#hit-flash').style.opacity=p.hurt>0?.55:0;
  const item=round.pickups.find(a=>!a.used&&distance(p,a)<1.8);let content='';
  if(round.nearDoor){content=round.doorCalled?`<kbd>E</kbd> Hold to board<div class="board-meter"><div style="width:${Math.min(100,round.board*100)}%"></div></div>`:'The mate is checking the last seat…';}
  else if(item)content=`<kbd>R</kbd> ${item.type==='bag'?'Pick up travel bag':'Drink · +30 health'}`;
  $('#context-action').innerHTML=content;$('#objective-detail').textContent=round.doorCalled?'The mate is calling. Reach the glowing door.':`The mate opens boarding in ${Math.max(0,Math.ceil(8-round.elapsed))}s. Find your opening.`;
}
function processEvents(){for(const event of round.events.splice(0)){
  if(event.type==='message')announce(event.text);
  else if(event.type==='end')finish(event.result);
  else if(event.type==='hit'){stage.impact(event.x,event.z,event.finish);soundEffect('hit');}
  else if(event.type==='combo'){$('#combo').textContent=event.count===3?'3-hit shove!':`${event.count} hit${event.count>1?'s':''}`;clearTimeout(comboTimeout);comboTimeout=setTimeout(()=>$('#combo').textContent='',900);}
  else{soundEffect(event.type);if(event.type==='damage'&&stage.shakeEnabled)stage.shake=.18;}
}}
for(const button of document.querySelectorAll('[data-mode]')){button.setAttribute('aria-pressed',button.dataset.mode===mode);button.addEventListener('click',()=>{mode=button.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>{const selected=b.dataset.mode===mode;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});$('#mode-description').textContent=MODES[mode].description;});}
for(const button of document.querySelectorAll('[data-dialog]'))button.addEventListener('click',()=>$('#'+button.dataset.dialog).showModal());
for(const button of document.querySelectorAll('.close-dialog'))button.addEventListener('click',()=>button.closest('dialog').close());
for(const dialog of document.querySelectorAll('.information-dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();}});
$('#play-tab').addEventListener('click',()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();$('#start').focus();});$('#start').addEventListener('click',start);$('#retry').addEventListener('click',start);$('#back-lobby').addEventListener('click',lobby);$('#quit').addEventListener('click',lobby);$('#pause').addEventListener('click',pause);$('#resume').addEventListener('click',resume);
$('#pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('#result').addEventListener('cancel',e=>{e.preventDefault();lobby();});$('#shake-setting').checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;$('#shake-setting').addEventListener('change',e=>stage.shakeEnabled=e.target.checked);
$('#sound-toggle').addEventListener('click',()=>{sound=!sound;$('.sound-off').hidden=sound;$('#sound-toggle').setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');$('#sound-toggle').title=sound?'Turn sound off':'Turn sound on';if(sound)soundEffect('pickup');});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}});
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(!round||round.status!=='playing')return;if(key==='escape'||key==='p'){e.preventDefault();if(!e.repeat)paused?resume():pause();return;}if(paused)return;if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','j','k','l',' ','e','r'].includes(key))e.preventDefault();keys.add(key);if(!e.repeat){if(key==='j')action('attack');if(key==='l'||key===' ')action('dodge');if(key==='r')action('pickup');}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function bindHold(button,key,press){button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);if(key)keys.add(key);press?.();});const release=()=>{if(key)keys.delete(key);};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);button.addEventListener('click',e=>{if(e.detail===0){if(press)press();else if(key==='k'){keys.add('k');setTimeout(()=>keys.delete('k'),500);}}});}
document.querySelectorAll('[data-action]').forEach(button=>{const a=button.dataset.action;bindHold(button,a==='block'?'k':null,a==='block'?null:()=>action(a));});document.querySelectorAll('[data-key]').forEach(button=>bindHold(button,button.dataset.key,button.dataset.key==='r'?()=>action('pickup'):null));
try{
  stage=new Stage($('#world'));
  await stage.prepare();
  for(const a of ARENAS){const button=document.createElement('button');button.className='arena-choice';button.dataset.arena=a.id;button.innerHTML=`<span class="route-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><strong>${a.name}</strong><small>${a.subtitle}</small>`;button.addEventListener('click',()=>selectArena(a));$('#arena-list').appendChild(button);}
  selectArena(arena);$('#load-screen').remove();
  function loop(now){const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;
    if(round&&!paused&&round.status==='playing'){const m=getMovement();round.player.moving=!!(m.x||m.z);round.tick(dt,{...m,block:keys.has('k'),board:keys.has('e')});processEvents();updateHUD();}
    stage.update(paused?0:dt,round,!round);requestAnimationFrame(loop);
  }requestAnimationFrame(loop);
}catch(error){console.error(error);$('#load-screen').innerHTML='<strong>This device could not start the 3D arena.</strong><p>Try a browser with WebGL enabled, then reload.</p><button class="secondary" onclick="location.reload()">Try again</button>';}
