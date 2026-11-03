import {HomeRun,MODES,ARENAS,DOOR,distance} from './core.js';
import {Stage} from './stage.js';
const $=selector=>document.querySelector(selector),keys=new Set();
let mode='normal',arena=ARENAS[0],run=null,round=null,paused=false,stage,lastTime=performance.now(),messageTimeout,comboTimeout,impactPause=0,audio,noiseBuffer,lastCountdown=-1;
let records={},sound=true;
try{records=JSON.parse(localStorage.getItem('trotro-door-run-records')||'{}');sound=localStorage.getItem('trotro-sound')!=='off';}catch{}
function setSound(value){sound=value;$('.sound-off').hidden=sound;$('#sound-setting').checked=sound;$('#sound-toggle').setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');$('#sound-toggle').title=sound?'Turn sound off':'Turn sound on';try{localStorage.setItem('trotro-sound',sound?'on':'off');}catch{}}
function soundEffect(type){
  if(!sound)return;
  try{
    audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();
    const now=audio.currentTime;
    function tone(hz,end,duration,volume=.08,delay=0,wave='triangle'){const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.connect(gain);gain.connect(audio.destination);oscillator.type=wave;oscillator.frequency.setValueAtTime(hz,now+delay);oscillator.frequency.exponentialRampToValueAtTime(end,now+delay+duration);gain.gain.setValueAtTime(volume,now+delay);gain.gain.exponentialRampToValueAtTime(.001,now+delay+duration);oscillator.start(now+delay);oscillator.stop(now+delay+duration);}
    function noise(duration,frequency,volume){if(!noiseBuffer){noiseBuffer=audio.createBuffer(1,audio.sampleRate*.25,audio.sampleRate);const channel=noiseBuffer.getChannelData(0);for(let i=0;i<channel.length;i++)channel[i]=Math.random()*2-1;}const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=frequency;source.connect(filter);filter.connect(gain);gain.connect(audio.destination);gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);source.start(now);source.stop(now+duration);}
    if(type==='hit'||type==='damage'||type==='down'||type==='shove'){tone(type==='shove'?95:130,36,.16,.11);noise(.12,600,.2);if(type==='down')tone(70,28,.28,.08);}
    else if(type==='swing'||type==='dodge')noise(.09,type==='swing'?950:450,.12);
    else if(type==='parry'||type==='block'){tone(520,180,.12,.06);noise(.07,2200,.11);}
    else if(type==='won'){tone(392,392,.18,.07);tone(523,523,.2,.07,.14);tone(659,659,.35,.07,.28);tone(220,220,.3,.025);tone(277,277,.3,.025);}
    else if(type==='missed'||type==='knocked-out'){tone(220,90,.45,.07);}
    else if(type==='danger'||type==='tick'){tone(type==='danger'?660:330,type==='danger'?440:220,.09,.035);}
    else{tone(440,660,.15,.05);}
  }catch{}
}
function announce(text,duration=2400){$('#announcement').textContent=text;$('#announcement').classList.add('show');clearTimeout(messageTimeout);messageTimeout=setTimeout(()=>$('#announcement').classList.remove('show'),duration);}
function feedback(text){$('#combo').textContent=text;clearTimeout(comboTimeout);comboTimeout=setTimeout(()=>$('#combo').textContent='',1200);}
function movement(){const up=keys.has('w')||keys.has('arrowup'),down=keys.has('s')||keys.has('arrowdown'),left=keys.has('a')||keys.has('arrowleft'),right=keys.has('d')||keys.has('arrowright');return{x:(right-left)*.76+(down-up)*.65,z:(left-right)*.65+(down-up)*.76};}
function action(type){if(!round||paused||round.status!=='playing')return;if(type==='attack')round.attack();if(type==='shove')round.shove();if(type==='dodge'){const m=movement();round.dodge(m.x,m.z);}if(type==='pickup')round.pickup();}
function selectArena(next){
  arena=next;stage.build(arena);$('#scene-caption').textContent=`${arena.name}, Accra`;$('#arena-detail').textContent=arena.description;$('#maps-link').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(arena.query)}`;
  document.querySelectorAll('.arena-choice').forEach(el=>{const on=el.dataset.arena===arena.id;el.classList.toggle('selected',on);el.setAttribute('aria-pressed',on);});
  const route=new HomeRun(mode,arena.id).route;$('#route-preview').textContent=route.map(a=>a.name).join('  ›  ')+'  ›  Home';
}
function refreshJourney(){
  $('#journey-progress').innerHTML=run.route.map((a,i)=>`<span class="${i<run.index?'complete':i===run.index?'current':''}">${i<run.index?'✓':i+1} <b>${a.name}</b></span>`).join('<i>›</i>');
}
function playRound(next){
  for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();keys.clear();paused=false;impactPause=0;round=next;lastCountdown=-1;
  stage.build(run.arena);stage.begin(round);document.body.classList.add('playing');$('#hud').hidden=false;$('#round-location').textContent=`Stop ${run.index+1} of 3 / ${run.arena.name}`;$('#combo').textContent='';$('#start').blur();refreshJourney();soundEffect('start');
  announce(run.index===0?'Three rides home. The crowd holds the doorway. Fight your way through.':`Stop ${run.index+1}: ${run.arena.name}. A bigger crowd. Same last seat.`,3000);updateHUD();
}
function start(){run=new HomeRun(mode,arena.id);playRound(run.createRound());}
function retry(){if(run?.canContinue)playRound(run.advance());else start();}
function pause(){if(!round||round.status!=='playing'||paused)return;paused=true;keys.clear();$('#pause-dialog').showModal();}
function resume(){paused=false;keys.clear();$('#pause-dialog').close();lastTime=performance.now();}
function lobby(){for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();round=null;run=null;paused=false;keys.clear();$('#hud').hidden=true;document.body.classList.remove('playing');selectArena(arena);$('#start').focus({preventScroll:true});}
function finish(result){
  keys.clear();$('#announcement').classList.remove('show');run.record(round);const won=result==='won';
  $('#result-eyebrow').textContent=run.complete?'Home run complete':won?`Stop ${run.index+1} secured`:`Run ended at stop ${run.index+1}`;
  $('#result-title').textContent=run.complete?'You made it home.':won?'That seat is yours.':result==='missed'?'The last trotro left.':'The crowd got you.';
  $('#result-description').textContent=run.complete?'Three rushes beaten. Three rides secured. Accra could not stop you.':won?`Next: ${run.route[run.index+1].name}. Recover 25 health, then face a bigger crowd.`:result==='missed'?'The doorway rival cost you time. A travel bag makes the fight shorter.':`You cleared ${run.history.filter(h=>h.result==='won').length} of 3 stops. Block their swings and use F to open a gap at the doorway.`;
  $('#result-time').textContent=`${run.time.toFixed(1)}s`;$('#result-kos').textContent=run.kos;$('#result-hp').textContent=Math.ceil(round.player.hp);$('#result-score').textContent=run.score.toLocaleString();
  $('#result-stamps').innerHTML=run.route.map((a,i)=>`<span class="${run.history[i]?.result==='won'?'cleared':''}">${run.history[i]?.result==='won'?'✓':'○'} ${a.name}</span>`).join('');
  $('#retry').textContent=run.canContinue?`Next stop: ${run.route[run.index+1].name}`:'Try the run again';
  const recordKey=`${arena.id}-${mode}`;
  if(run.complete){const best=records[recordKey]||0;if(run.score>best){records[recordKey]=run.score;try{localStorage.setItem('trotro-door-run-records',JSON.stringify(records));}catch{}$('#best-time').textContent='New home run best!';}else $('#best-time').textContent=`Your best: ${best.toLocaleString()} points`;}
  else $('#best-time').textContent=won?(run.weapon?'Keep your bag. Recover 25 health. Keep the run alive.':'Your health carries forward. Your score keeps climbing.'):records[recordKey]?`Home run best: ${records[recordKey].toLocaleString()} points`:'The goal: win three last seats in one run.';
  soundEffect(won?'won':result);$('#result').showModal();
}
function updateHUD(){
  if(!round)return;const p=round.player,keeper=round.keeper,cleared=round.gateCleared,blocked=round.doorBlocked;
  $('#health-fill').style.width=`${p.hp}%`;$('#health-fill').style.background=p.hp<30?'#e68e75':'#b9c99c';$('#stamina-fill').style.width=`${p.stamina}%`;$('#health-text').textContent=`${Math.ceil(p.hp)} health`;
  const remaining=Math.max(0,Math.ceil(round.config.time-round.elapsed));$('#timer').innerHTML=`${remaining}<span>s</span>`;$('#timer').style.color=remaining<15?'#ffba84':'';
  if(remaining<=10&&remaining!==lastCountdown){lastCountdown=remaining;soundEffect('tick');}
  $('#weapon-label').textContent=p.weapon?'Travel bag':'Bare hands';const unbanked=round.status==='playing';$('#knockdowns').textContent=run.kos+(unbanked?round.kos:0);$('#live-score').textContent=(run.score+(unbanked?round.score:0)).toLocaleString();$('#hit-flash').style.opacity=p.hurt>0?.55:0;
  $('#objective-title').textContent=!cleared?'Drop the doorway rival.':blocked?'Make a gap at the door.':'The gap is open. Get in!';
  $('#objective-detail').textContent=!cleared?'They hold the doorway. J strikes. K blocks.':blocked?'F shoves blockers out of the entrance.':'Hold E before the blockers return to their posts.';
  $('#keeper-panel').hidden=cleared;$('#keeper-fill').style.width=`${keeper?Math.max(0,keeper.hp/keeper.maxHp*100):0}%`;$('#keeper-health').textContent=keeper?`${Math.ceil(Math.max(0,keeper.hp))} / ${keeper.maxHp}`:'';
  $('#blocker-panel').hidden=!cleared||!blocked;$('#blocker-count').textContent=`${round.blockers.length} ${round.blockers.length===1?'rival blocks':'rivals block'} the entrance`;
  const ready=p.shoveCooldown<=0&&p.stamina>=28;$('#shove-status').textContent=p.shoveCooldown>0?`Shove ${p.shoveCooldown.toFixed(1)}s`:p.stamina<28?'Shove: need stamina':'Shove ready';
  document.querySelectorAll('[data-action="shove"]').forEach(button=>{button.disabled=!ready;});
  const item=round.pickups.find(a=>!a.used&&distance(p,a)<1.65);let content='';
  if(round.nearDoor){content=!cleared?'The doorway rival is blocking you. Drop them first.':blocked?'<kbd>F</kbd> Shove the blockers out of the doorway':`<kbd>E</kbd> Hold to enter<div class="board-meter"><div style="width:${Math.min(100,round.board*100)}%"></div></div>`;}
  else if(cleared&&distance(p,DOOR)<3.8)content=`Move closer to the glowing door · ${Math.ceil(distance(p,DOOR))} m`;
  else if(item)content=`<kbd>R</kbd> ${item.type==='bag'?'Take the travel bag':'Drink · +30 health'}`;
  $('#context-action').innerHTML=content;
  const target=round.target;if(target){const position=stage.project(target.x,2.45,target.z);$('#objective-marker').hidden=distance(p,target)<3;$('#objective-marker').style.left=`${Math.max(55,Math.min(innerWidth-65,position.x))}px`;$('#objective-marker').style.top=`${Math.max(innerWidth<760?240:160,Math.min(innerHeight-230,position.y))}px`;$('#marker-label').textContent=cleared?'Last seat':'Doorway rival';$('#marker-distance').textContent=`${Math.ceil(distance(p,target))} m`;$('#objective-marker').classList.toggle('door-ready',cleared);}
}
function processEvents(){
  for(const event of round.events.splice(0)){
    if(event.type==='message')announce(event.text);
    else if(event.type==='end')finish(event.result);
    else if(event.type==='hit'){stage.impact(event.x,event.z,event.finish);soundEffect('hit');impactPause=event.finish?.065:.035;const at=stage.project(event.x,1.7,event.z);if(at.x>0&&at.x<innerWidth&&at.y>0&&at.y<innerHeight){const number=document.createElement('span');number.className='floating-damage'+(event.finish?' finisher':'');number.textContent=event.damage;number.style.left=at.x+'px';number.style.top=at.y+'px';$('#hud').appendChild(number);setTimeout(()=>number.remove(),700);}}
    else if(event.type==='combo')feedback(event.count===3?'Three-hit shove!':`${event.count}-hit combo`);
    else if(event.type==='down'){feedback(event.keeper?'Doorway rival down! +500':'Knockdown! +150');soundEffect('down');}
    else if(event.type==='shove'){stage.shoveWave(event.x,event.z);feedback('Make some space!');soundEffect('shove');}
    else if(event.type==='parry'){stage.impact(event.x,event.z,true);feedback('Perfect block! +75');soundEffect('parry');}
    else if(event.type==='evade'){feedback('Clean dodge! +35');}
    else if(event.type==='door-open')soundEffect('danger');
    else{soundEffect(event.type);if(event.type==='damage'&&stage.shakeEnabled)stage.shake=.14;}
  }
}
for(const button of document.querySelectorAll('[data-mode]')){button.setAttribute('aria-pressed',button.dataset.mode===mode);button.addEventListener('click',()=>{mode=button.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>{const selected=b.dataset.mode===mode;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});$('#mode-description').textContent=MODES[mode].description;});}
$('#mode-description').textContent=MODES[mode].description;
for(const button of document.querySelectorAll('[data-dialog]'))button.addEventListener('click',()=>$('#'+button.dataset.dialog).showModal());
for(const button of document.querySelectorAll('.close-dialog'))button.addEventListener('click',()=>button.closest('dialog').close());
for(const dialog of document.querySelectorAll('.information-dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();}});
$('#play-tab').addEventListener('click',()=>$('#start').focus());$('#start').addEventListener('click',start);$('#retry').addEventListener('click',retry);$('#back-lobby').addEventListener('click',lobby);$('#quit').addEventListener('click',lobby);$('#pause').addEventListener('click',pause);$('#resume').addEventListener('click',resume);
$('#pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('#result').addEventListener('cancel',e=>{e.preventDefault();lobby();});$('#shake-setting').checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;$('#shake-setting').addEventListener('change',e=>stage.shakeEnabled=e.target.checked);
$('#sound-toggle').addEventListener('click',()=>{setSound(!sound);if(sound)soundEffect('pickup');});$('#sound-setting').addEventListener('change',e=>setSound(e.target.checked));setSound(sound);
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}});
window.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();if(!round||round.status!=='playing')return;
  if(key==='escape'||key==='p'){e.preventDefault();if(!e.repeat)paused?resume():pause();return;}if(paused)return;
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','j','k','l',' ','e','r','f'].includes(key))e.preventDefault();keys.add(key);
  if(!e.repeat){if(key==='j')action('attack');if(key==='f')action('shove');if(key==='l'||key===' ')action('dodge');if(key==='r')action('pickup');}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function bindHold(button,key,press){
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);if(key)keys.add(key);press?.();});const release=()=>{if(key)keys.delete(key);};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  button.addEventListener('click',e=>{if(e.detail===0){if(press)press();else if(key==='k'){keys.add('k');setTimeout(()=>keys.delete('k'),500);}}});
}
document.querySelectorAll('[data-action]').forEach(button=>{const actionName=button.dataset.action;bindHold(button,actionName==='block'?'k':actionName==='attack'?'j':null,actionName==='block'?null:()=>action(actionName));});
document.querySelectorAll('[data-key]').forEach(button=>bindHold(button,button.dataset.key,button.dataset.key==='r'?()=>action('pickup'):null));
try{
  stage=new Stage($('#world'));await stage.prepare();
  for(const a of ARENAS){const button=document.createElement('button');button.className='arena-choice';button.dataset.arena=a.id;button.innerHTML=`<strong>${a.name}</strong><small>${a.subtitle}</small>`;button.addEventListener('click',()=>selectArena(a));$('#arena-list').appendChild(button);}
  selectArena(arena);$('#load-screen').remove();
  function loop(now){
    const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;let simulationDt=dt;
    if(impactPause>0){impactPause-=dt;simulationDt*=.15;}
    if(round&&!paused&&round.status==='playing'){const m=movement();round.tick(simulationDt,{...m,attack:keys.has('j'),block:keys.has('k'),board:keys.has('e')});processEvents();updateHUD();}
    stage.update(paused?0:simulationDt,round,!round);requestAnimationFrame(loop);
  }requestAnimationFrame(loop);
}catch(error){console.error(error);$('#load-screen').innerHTML='<strong>The arena could not start.</strong><p>Check your connection and enable WebGL, then reload.</p><button class="secondary" onclick="location.reload()">Try again</button>';}
