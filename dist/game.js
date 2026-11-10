import {HomeRun,Round,MODES,ARENAS,DOOR,distance,WEAPONS,weaponStats} from './core.js';
import {CHARACTERS,characterById} from './characters.js';
import {COMBO_ROUTES} from './combat.js';
import {Stage} from './stage.js';
import {stickVector,contextAction,arrivalCall} from './mobile.js';
import {CityJourney,TRAVEL_CHOICES} from './campaign.js';
import {UPGRADES,BADGES,cleanProfile,rankFor,masteryFor,awardRound,dailyRoute,seededRandom} from './journey.js';
let playMode='campaign',checkpointSaved=true,cityReward='';const savedJourneys={};
for(const kind of ['campaign','endless']){try{const saved=CityJourney.restore(JSON.parse(localStorage.getItem('trotro-'+kind+'-v1')||'null'));if(saved)savedJourneys[kind]=saved.snapshot();}catch{}}
const $=selector=>document.querySelector(selector),keys=new Set(),touchState={x:0,z:0,assist:false};
function clearInput(){keys.clear();touchState.x=0;touchState.z=0;touchState.assist=false;$('#stick-knob').style.transform='translate(-50%,-50%)';}
let mode='normal',arena=ARENAS[0],run=null,round=null,paused=false,stage,lastTime=performance.now(),messageTimeout,comboTimeout,impactPause=0,audio,noiseBuffer,lastCountdown=-1;
let records={},sound=true,characterId='office',profile=cleanProfile(null),dailyRun=null,saveAvailable=true;
try{profile=cleanProfile(JSON.parse(localStorage.getItem('trotro-career-v1')||'null'));}catch{saveAvailable=false;}
try{characterId=characterById(localStorage.getItem('trotro-character')).id;}catch{}
try{records=JSON.parse(localStorage.getItem('trotro-fighters-records')||'{}');sound=localStorage.getItem('trotro-sound')!=='off';}catch{}
function setSound(value){sound=value;if(!sound)window.speechSynthesis?.cancel();$('.sound-off').hidden=sound;$('#sound-setting').checked=sound;$('#sound-toggle').setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');$('#sound-toggle').title=sound?'Turn sound off':'Turn sound on';try{localStorage.setItem('trotro-sound',sound?'on':'off');}catch{}}
function mateCall(text){
  if(!sound||!window.speechSynthesis)return;
  // Use a device voice when available; the same call always appears as a subtitle.
  const voices=window.speechSynthesis.getVoices(),voice=voices.find(v=>v.lang==='en-GH')||voices.find(v=>v.lang.startsWith('en')&&v.localService)||voices.find(v=>v.lang.startsWith('en'));const call=new SpeechSynthesisUtterance(text);if(voice)call.voice=voice;call.rate=1.12;call.volume=1;window.speechSynthesis.cancel();window.speechSynthesis.speak(call);
}
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
    else if(type==='bus-state'){tone(330,330,.2,.045);tone(415,415,.2,.035);}
    else if(type==='arriving'){tone(83,38,1.6,.065,0,'sawtooth');noise(.24,1700,.055);}
    else if(type==='departing'){tone(42,105,1.4,.065,0,'sawtooth');}
    else if(type==='won'){tone(392,392,.18,.07);tone(523,523,.2,.07,.14);tone(659,659,.35,.07,.28);tone(220,220,.3,.025);tone(277,277,.3,.025);}
    else if(type==='missed'||type==='knocked-out'){tone(220,90,.45,.07);}
    else if(type==='danger'||type==='tick'){tone(type==='danger'?660:330,type==='danger'?440:220,.09,.035);}
    else{tone(440,660,.15,.05);}
  }catch{}
}
function announce(text,duration=2400){$('#announcement').textContent=text;$('#announcement').classList.add('show');clearTimeout(messageTimeout);messageTimeout=setTimeout(()=>$('#announcement').classList.remove('show'),duration);}
function feedback(text){$('#combo').textContent=text;clearTimeout(comboTimeout);comboTimeout=setTimeout(()=>$('#combo').textContent='',1200);}
function movement(){const up=keys.has('w')||keys.has('arrowup'),down=keys.has('s')||keys.has('arrowdown'),left=keys.has('a')||keys.has('arrowleft'),right=keys.has('d')||keys.has('arrowright');return{x:(right-left)*.76+(down-up)*.65+touchState.x,z:(left-right)*.65+(down-up)*.76+touchState.z};}
function action(type){if(!round||paused||round.status!=='playing')return;if(['attack','heavy','kick','grab'].includes(type))round.attack(type==='attack'?'light':type,type==='kick'?(keys.has('s')||keys.has('arrowdown')?-1:keys.has('w')||keys.has('arrowup')?1:0):0);if(type==='target')round.combat.cycleTarget();if(type==='shove')round.shove();if(type==='dodge'){const m=movement();round.dodge(m.x,m.z);}if(type==='pickup')round.pickup();if(type==='burst')round.burst();if(type==='vault')round.window.jump();if(type==='window-kick')round.window.kick();}
function selectArena(next){
  arena=next;stage.build(arena);$('#scene-caption').textContent=`${arena.name}, Accra`;$('#arena-detail').textContent=arena.description;$('#maps-link').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(arena.query)}`;
  document.querySelectorAll('.arena-choice').forEach(el=>{const on=el.dataset.arena===arena.id;el.classList.toggle('selected',on);el.setAttribute('aria-pressed',on);});
  refreshJourneyMenu();
}
function saveJourney(){
  if(!run?.kind)return;const snapshot=run.snapshot();savedJourneys[run.kind]=snapshot;try{localStorage.setItem('trotro-'+run.kind+'-v1',JSON.stringify(snapshot));checkpointSaved=true;}catch{checkpointSaved=false;}
}
function mapMarkup(journey){
  const lap=journey.kind==='endless'?Math.floor(journey.district/6)*6:0;
  return Array.from({length:6},(_,i)=>{const district=i+lap,first=district*3,done=Math.max(0,Math.min(3,journey.index-first+(journey.canContinue||journey.complete?1:0))),current=journey.district===district;return `<div class="district ${current?'current':''} ${done===3?'cleared':''}"><b>${journey.arenaAt(first).name}</b><span>${Array.from({length:3},(_,n)=>`<i class="${n<done?'won':''}">${n<done?'✓':n+1}</i>`).join('')}</span><small>${done}/3 cleared</small></div>`;}).join('');
}
function refreshJourneyMenu(){
  document.querySelectorAll('[data-journey]').forEach(el=>{el.classList.toggle('selected',el.dataset.journey===playMode);el.setAttribute('aria-pressed',el.dataset.journey===playMode);});
  const city=playMode!=='quick',saved=city?CityJourney.restore(savedJourneys[playMode]):null,ongoing=saved&&!saved.complete;
  $('#journey-description').textContent=playMode==='campaign'?'18 encounters · 6 districts · Saved checkpoints':playMode==='endless'?'Keep riding · Evolving builds · Chase your longest journey':'Three stops · The original short arcade run';
  $('#start>span:first-child').textContent=ongoing?'Continue '+(playMode==='campaign'?'City Journey':'Endless Commute'):playMode==='campaign'?'Start City Journey':playMode==='endless'?'Start Endless Commute':'Start a quick ride';
  $('#fresh-journey').hidden=!ongoing;$('#checkpoint-note').textContent=ongoing?`${saved.character.name} · ${saved.mode} · ${saved.arena.name} · Encounter ${saved.index+1}${playMode==='campaign'?'/18':''}. ${saved.phase==='travel'?'Your travel choices are saved.':'Resume from this encounter’s start.'}`:city?'Progress saves after every encounter. Leave and return when you want.':'';
  $('#arena-count').textContent=playMode==='campaign'?'6 districts · 18 encounters':playMode==='endless'?'As far as you can go':'3 stops to win';
  const preview=saved||new CityJourney({kind:playMode==='endless'?'endless':'campaign',startId:arena.id,seed:'preview'});$('#city-route').innerHTML=mapMarkup(preview);$('#city-ticket-title').textContent=playMode==='endless'?'How far can you go?':'Make the city yours.';$('#city-ticket-detail').textContent=playMode==='quick'?'A short run. Try City Journey when you want a longer adventure.':'Queue clash. Seat defence. Captain showdown. Three battles in every district.';
  $('#route-preview').textContent=city?'Queue clash  ›  Seat defence  ›  Captain  ›  Next district':new HomeRun(mode,arena.id).route.map(a=>a.name).join(' › ')+' › Home';
}
function refreshJourney(){
  $('#journey-progress').innerHTML=run.kind?`<span class="current"><b>${run.kind==='campaign'?'City Journey':'Endless Commute'}</b> ${run.index+1}${run.kind==='campaign'?'/18':''}</span><i>›</i><span>${run.arena.name}</span>`:run.route.map((a,i)=>`<span class="${i<run.index?'complete':i===run.index?'current':''}">${i<run.index?'✓':i+1} <b>${a.name}</b></span>`).join('<i>›</i>');
}
function renderCityTravel(){
  const won=run.phase!=='retry',complete=run.complete;$('#city-build').hidden=!run.canContinue;$('#travel-eyebrow').textContent=run.kind==='campaign'?`City Journey · Encounter ${run.index+1}/18`:`Endless Commute · Encounter ${run.index+1}`;
  $('#travel-title').textContent=complete?'You conquered Accra.':!won?'Get back in the fight.':run.index%3===2?run.arena.name+' is yours.':'Seat secured. Journey continues.';
  $('#travel-detail').textContent=complete?`${run.score.toLocaleString()} points across 18 encounters. Your completed journey is saved. Keep going in Endless Commute.`:!won?'This encounter got you. Retry with at least 70 health. Your completed encounters, score and build stay intact.':`Next: ${run.arenaAt(run.index+1).name} · ${run.index%3===1?'Captain showdown':run.index%3===2?'Break the queue':'Hold your place'}. ${run.score.toLocaleString()} points banked.`;
  $('#travel-map').innerHTML=mapMarkup(run);$('#travel-reward').textContent=cityReward||`${run.upgrades.length}/3 build slots · ${Math.ceil(run.health)} health at the checkpoint`;$('#build-help').textContent=run.upgrades.length===3?'Your build is full. Pick a new upgrade, then choose one to replace.':'Choose an upgrade to carry through the journey. You have three build slots.';
  $('#city-offers').replaceChildren(...run.offers.map(u=>{const b=document.createElement('button');b.className='upgrade-choice';b.dataset.cityUpgrade=u.id;b.setAttribute('aria-pressed',run.selectedUpgrade===u.id);b.innerHTML=`<small>${u.tag}</small><b>${u.name}</b><span>${u.detail}</span>`;b.addEventListener('click',()=>{run.chooseUpgrade(u.id);saveJourney();renderCityTravel();document.querySelector(`[data-city-upgrade="${u.id}"]`).focus();});return b;}));
  $('#replace-section').hidden=!run.canContinue||run.upgrades.length<3;$('#replace-options').replaceChildren(...run.upgrades.map(id=>{const b=document.createElement('button');b.dataset.replace=id;b.textContent=UPGRADES.find(u=>u.id===id).name;b.setAttribute('aria-pressed',run.replaceUpgrade===id);b.addEventListener('click',()=>{run.chooseReplacement(id);saveJourney();renderCityTravel();document.querySelector(`[data-replace="${id}"]`).focus();});return b;}));
  $('#travel-options').replaceChildren(...TRAVEL_CHOICES.map(t=>{const b=document.createElement('button');b.dataset.travel=t.id;b.setAttribute('aria-pressed',run.travel===t.id);b.innerHTML=`<b>${t.name}</b><span>${t.detail}</span>`;b.addEventListener('click',()=>{run.chooseTravel(t.id);saveJourney();renderCityTravel();document.querySelector(`[data-travel="${t.id}"]`).focus();});return b;}));
  $('#city-save-status').textContent=checkpointSaved?'Checkpoint saved on this device. Your current travel choices are saved too.':'Browser storage unavailable. This journey is kept for this session only.';$('#city-continue').disabled=run.canContinue&&!run.ready;$('#city-continue').textContent=complete?'Keep riding in Endless':won?(!run.selectedUpgrade?'Choose your upgrade':!run.ready?'Choose an upgrade to replace':'Travel to the next encounter'):'Retry this encounter';$('#city-leave').textContent=checkpointSaved?'Save and return to menu':'Return to menu (session only)';
}
function showCityTravel(){clearInput();paused=true;renderCityTravel();$('#city-travel').showModal();}
function startCity(fresh=false){
  dailyRun=null;cityReward='';const saved=!fresh?CityJourney.restore(savedJourneys[playMode]):null;run=saved&&!saved.complete?saved:new CityJourney({kind:playMode,mode,startId:arena.id,character:characterId});saveJourney();
  if(run.phase==='fight')playRound(run.createRound());else showCityTravel();
}
function playRound(next){
  for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();clearInput();paused=false;impactPause=0;round=next;lastCountdown=-1;
  stage.build(run.arena);stage.begin(round);document.body.classList.add('playing');document.body.classList.toggle('campaign-playing',!!run.kind);$('#hud').hidden=false;$('#round-location').textContent=round.practice?'Combat practice / '+run.arena.name:`${run.kind?'Encounter':'Stop'} ${run.index+1}${run.kind==='endless'?'':run.kind?'/18':'/3'} / ${run.arena.name} · ${round.condition.name}`;$('#combo').textContent='';$('#start').blur();refreshJourney();soundEffect('start');if(run.kind)saveJourney();if(!round.practice)mateCall(arrivalCall(run.arena.route));
  announce(round.practice?'Practice safely. J J I launches. Press M for every move.':'Everyone fights for the last seat. Be the last one standing, then board!',3300);updateHUD();
}
function start(){if(playMode!=='quick'){startCity();return;}dailyRun=null;run=new HomeRun(mode,arena.id,Math.random,characterId);playRound(run.createRound());}
function startDaily(repeat=false){const d=repeat&&dailyRun?dailyRun:dailyRoute();dailyRun=d;run=new HomeRun('normal',ARENAS[d.start].id,seededRandom(d.seed),d.fighter,{daily:d.day});playRound(run.createRound());}
function refreshCareer(){
  const rank=rankFor(profile.xp),d=dailyRoute(),record=profile.daily[d.day];
  $('#career-rank').textContent=rank.name;$('#career-summary').textContent=`Level ${rank.level} · ${profile.seats} ${profile.seats===1?'seat':'seats'} secured · ${profile.xp.toLocaleString()} XP`;$('#career-fill').style.width=`${Math.round(rank.progress*100)}%`;
  $('#daily-route').textContent=ARENAS[d.start].name+' rush';$('#daily-detail').textContent=`${characterById(d.fighter).name} · Normal · ${d.day}`;$('#daily-best').textContent=record?`Your best: ${record.best.toLocaleString()} · ${record.seats}/3 seats${record.won?' · Home!':''}`:'A fixed route. A fresh challenge every day.';
  $('#career-title').textContent=rank.name;$('#career-progress').textContent=rank.next?`Level ${rank.level} · ${profile.xp.toLocaleString()} XP · ${rank.next-profile.xp} XP to ${rankFor(rank.next).name}`:`Level ${rank.level} · ${profile.xp.toLocaleString()} XP · Keep setting new personal bests.`;
  $('#career-totals').innerHTML=`<span><b>${profile.wins}</b>Routes completed</span><span><b>${profile.seats}</b>Seats won</span><span><b>${profile.badges.length}/${BADGES.length}</b>Badges</span>`;
  $('#career-badges').innerHTML=BADGES.map(b=>`<article class="${profile.badges.includes(b.id)?'earned':''}"><span>${profile.badges.includes(b.id)?'✓':'◇'}</span><div><b>${b.name}</b><p>${b.detail}</p></div></article>`).join('');
  $('#mastery-list').innerHTML=CHARACTERS.map(c=>{const f=profile.fighters[c.id]||{xp:0,seats:0};return `<div><span>${c.name}<small>${c.role}</small></span><b>${masteryFor(f.xp)}<small>${f.xp} XP · ${f.seats} ${f.seats===1?'seat':'seats'}</small></b></div>`;}).join('');
  $('#career-city').textContent=`City Journey: ${profile.journeyBest}/18 best · ${profile.campaignClears} completed · Endless best: ${profile.endlessBest} encounters`;
  $('#save-note').textContent=saveAvailable?'Progress and daily records are saved in this browser on this device.':'Browser storage is unavailable. Progress lasts for this session only.';
}
function renderUpgrades(){
  $('#upgrade-section').hidden=!run.canContinue;$('#result').classList.toggle('has-upgrades',run.canContinue);$('#retry').disabled=run.canContinue&&!run.selectedUpgrade;
  if(!run.canContinue){$('#upgrade-choices').replaceChildren();return;}
  const rule=run.conditions[run.index+1];$('#next-stop-rule').textContent=`Next: ${run.route[run.index+1].name} · ${rule.name}${run.index===1?' · '+run.captain.name:''}`;
  $('#upgrade-choices').replaceChildren(...run.offers.map(u=>{const b=document.createElement('button');b.className='upgrade-choice';b.dataset.upgrade=u.id;b.setAttribute('aria-pressed',u.id===run.selectedUpgrade);b.innerHTML=`<small>${u.tag}</small><b>${u.name}</b><span>${u.detail}</span>`;b.addEventListener('click',()=>{run.chooseUpgrade(u.id);soundEffect('pickup');renderUpgrades();document.querySelector(`[data-upgrade="${u.id}"]`).focus();});return b;}));
}
function practice(){dailyRun=null;run=new HomeRun(mode,arena.id,Math.random,characterId);playRound(new Round(mode,Math.random,{practice:true,character:characterId}));}
function moves(){if(!round||round.status!=='playing')return;$('#pause-dialog').close();$('#paused-objective').textContent=`Rivals defeated: ${round.encounterProgress}/${round.encounterGoal}. ${round.street.dare.hint} Win dares for health and special charge. Rivals fight each other and you. Win the fight before boarding either way. Hold Fight while vaulting to kick away grabbers.`;paused=true;clearInput();round.combat.queue=[];$('#moves-dialog').showModal();}
function selectCharacter(id){characterId=characterById(id).id;const c=characterById(id);stage.selectCharacter(id);$('#character-summary').textContent=`${c.name} · ${c.role}`;$('#character-name').textContent=c.name;$('#character-role').textContent=c.role;$('#character-perk').textContent=c.perk;$('#character-detail').textContent=c.detail;document.querySelectorAll('[data-character]').forEach(b=>{const selected=b.dataset.character===id;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});try{localStorage.setItem('trotro-character',id);}catch{}}
function characterMenu(){selectCharacter(characterId);$('#character-dialog').showModal();}
function retry(){if(run?.canContinue){if(run.selectedUpgrade)playRound(run.advance());}else if(dailyRun)startDaily(true);else start();}
function pause(){if(!round||round.status!=='playing'||paused)return;paused=true;window.speechSynthesis?.cancel();clearInput();round.combat.queue=[];$('#pause-detail').textContent=round.practice?'Practice is paused. Try different moves to fill the Rush meter.':`${round.condition.name}: ${round.condition.detail}${round.captain?' '+round.captain.name+': '+round.captain.detail:''}`;$('#quit').textContent=run.kind?'Save journey and leave':'Back to stops';if(run.kind)$('#pause-detail').textContent+=' Your completed encounters and build are saved. Continuing later restarts this encounter.';$('#pause-dialog').showModal();}
function resume(){paused=false;clearInput();$('#pause-dialog').close();$('#moves-dialog').close();lastTime=performance.now();}
function lobby(){if(run?.kind)saveJourney();window.speechSynthesis?.cancel();for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();round=null;run=null;paused=false;clearInput();$('#hud').hidden=true;document.body.classList.remove('playing','campaign-playing');selectArena(arena);refreshCareer();$('#start').focus({preventScroll:true});}
function finish(result){
  clearInput();window.speechSynthesis?.cancel();$('#announcement').classList.remove('show');run.record(round);const won=result==='won';
  const reward=awardRound(profile,run,round);if(reward){profile=reward.profile;try{localStorage.setItem('trotro-career-v1',JSON.stringify(profile));saveAvailable=true;}catch{saveAvailable=false;}$('#career-reward').textContent=`+${reward.xp} XP · ${reward.mastery} ${round.character?.name||'fighter'}${reward.earned.length?' · New badge: '+reward.earned.join(', '):''}${saveAvailable?'':' · Session only'}`;}if(run.kind){cityReward=reward?`+${reward.xp} XP · ${reward.mastery}${reward.earned.length?' · '+reward.earned.join(', '):''}`:result==='won'?'Encounter saved. Career reward already collected.':'Keep your build. Come back stronger.';saveJourney();refreshCareer();soundEffect(won?'won':result);showCityTravel();return;}renderUpgrades();refreshCareer();
  $('#result-eyebrow').textContent=run.complete?'Home run complete':won?`Stop ${run.index+1} secured`:`Run ended at stop ${run.index+1}`;
  $('#result-title').textContent=run.complete?'You made it home.':won?'That seat is yours.':result==='missed'?'The last trotro left.':'The crowd got you.';
  $('#result-description').textContent=run.complete?'Three rushes beaten. Three rides secured. Accra could not stop you.':won?`Next: ${run.route[run.index+1].name}. Recover ${run.character?.heal||25} health, choose an upgrade for the next fight.`:result==='missed'?'Service has ended at this stop. Grab a weapon and break through when a free seat arrives.':`You cleared ${run.history.filter(h=>h.result==='won').length} of 3 stops. Block their swings and use F to open a gap at the doorway.`;
  $('#result-time').textContent=`${run.time.toFixed(1)}s`;$('#result-kos').textContent=run.kos;$('#result-hp').textContent=Math.ceil(round.player.hp);$('#result-score').textContent=run.score.toLocaleString();$('#result-feats').textContent=`${run.history.filter(h=>h.challenge).length} bonus ${run.history.filter(h=>h.challenge).length===1?'challenge':'challenges'} · Best streak ${Math.max(...run.history.map(h=>h.bestChain))} hits`;
  $('#result-stamps').innerHTML=run.route.map((a,i)=>`<span class="${run.history[i]?.result==='won'?'cleared':''}">${run.history[i]?.result==='won'?'✓':'○'} ${a.name}</span>`).join('');
  $('#retry').textContent=run.canContinue?`Next stop: ${run.route[run.index+1].name}`:'Try the run again';
  const recordKey=`${arena.id}-${mode}-${characterId}`;
  if(run.complete&&!run.daily){const best=records[recordKey]||0;if(run.score>best){records[recordKey]=run.score;try{localStorage.setItem('trotro-fighters-records',JSON.stringify(records));}catch{}$('#best-time').textContent='New home run best!';}else $('#best-time').textContent=`Your best: ${best.toLocaleString()} points`;}
  else $('#best-time').textContent=won?(run.weapon?`Keep your ${weaponStats(run.weapon).name.toLowerCase()}. Recover ${run.character?.heal||25} health. Keep the run alive.`:'Your health carries forward. Your score keeps climbing.'):records[recordKey]?`Home run best: ${records[recordKey].toLocaleString()} points`:'The goal: win three last seats in one run.';
  if(run.daily)$('#best-time').textContent=`Daily ${run.daily} · Your best: ${profile.daily[run.daily]?.best.toLocaleString()||0} points · Try the same route again.`;soundEffect(won?'won':result);$('#result').showModal();
}
function updateHUD(){
  if(!round)return;
  $('#rule-label').textContent=run.daily?'Today’s rush · '+run.daily:round.practice?'Practice':(run.kind?'Encounter ':'Stop ')+(run.index+1)+(run.kind==='endless'?'':run.kind?' / 18':' / 3');$('#rule-name').textContent=round.captain?round.captain.name:round.condition?.name||'Find your rhythm';$('#rule-detail').textContent=round.captain?round.captain.detail:round.condition?.detail||'Mix moves. Watch the Rush meter.';$('#run-upgrades').textContent=round.upgrades.map(id=>UPGRADES.find(u=>u.id===id).name).join(' + ');
  $('#style-label').textContent=round.rushTime>0?`RUSH · ${round.rushTime.toFixed(1)}s`:round.surgeCooldown>0?'Catch your breath':'Win over the crowd';$('#style-panel').classList.toggle('active',round.rushTime>0);$('#style-help').textContent=round.rushTime>0?'+25% damage · Half-cost dodges':`Mix moves + defence · ${round.styleMoves.size}/4`;$('#style-pips').querySelectorAll('i').forEach((el,i)=>el.classList.toggle('lit',round.rushTime>0||i<round.styleMoves.size));
  $('#player-name').textContent=round.character?.name||'You';const p=round.player,cleared=round.gateCleared,blocked=round.doorBlocked;
  $('#health-fill').style.width=`${p.hp}%`;$('#health-fill').style.background=p.hp<30?'#e68e75':'#b9c99c';$('#stamina-fill').style.width=`${p.stamina}%`;$('#health-text').textContent=`${Math.ceil(p.hp)} health`;
  const bus=round.bus,active=round.combatActive;
  $('#timer-label').textContent=round.practice?'Practice time':active?'Boarding closes in':'Next trotro in';$('#timer').innerHTML=round.practice?'∞':`${Math.ceil(active?bus.remaining:bus.arrivalIn)}<span>s</span>`;$('#timer').style.color=active&&bus.remaining<10?'#ffba84':'';
  $('#service-time').textContent=round.practice?'Unlimited health · refill special':round.seatsLost?`${round.seatsLost} ${round.seatsLost===1?"seat":"seats"} taken by rivals · Keep fighting`:round.missedBuses?`${round.missedBuses} ${round.missedBuses===1?'bus missed':'buses missed'} · Keep the run alive`:run.kind?`${run.index} ${run.index===1?'encounter':'encounters'} cleared · ${checkpointSaved?'Checkpoint saved':'Session only'}`:'Three seats to win · Get home';
  $('#bus-capacity').textContent=round.practice?'SPARRING':active?'1 FREE SEAT':bus.phase==='full'?'FULL · 0 SEATS':bus.phase==='arriving'?'PULLING IN':bus.phase==='departing'?'LEAVING':'WAITING FOR NEXT';
  $('#bus-number').textContent=`Trotro ${bus.number}`;$('#bus-status').classList.toggle('available',active);$('#bus-status').classList.toggle('full',bus.phase==='full');
  const countdown=Math.ceil(bus.remaining);if(active&&countdown<=5&&countdown!==lastCountdown){lastCountdown=countdown;soundEffect('tick');}
  $('#weapon-label').textContent=weaponStats(p.weapon).name;$('#weapon-trait').textContent=weaponStats(p.weapon).trait;const unbanked=round.status==='playing';$('#knockdowns').textContent=run.kos+(unbanked?round.kos:0);$('#live-score').textContent=(run.score+(unbanked?round.score:0)).toLocaleString();$('#hit-flash').style.opacity=p.hurt>0?.55:0;
  const boarder=round.boardingRival;$('#hud').classList.toggle('has-boarder',!!boarder);$('#objective-title').textContent=round.practice?'Learn your combos.':boarder?'Stop them taking your seat!':!active?(bus.phase==='full'?'Full. Save your strength.':bus.phase==='arriving'?'Trotro pulling in!':'Choose your opening.') : blocked?'Break through the doorway.':'The gap is open. Get in!';
  $('#objective-detail').textContent=round.practice?'Connect J J I, then juggle with J / U':boarder?'Hit or shove the orange-marked rival to interrupt.':!active?(round.gathering?'The crowd is gathering. Get into position.':'R picks up a weapon or water. Watch the road.'):blocked?'J J I launches · J U U clears a crowd · F shoves':'Hold E at the door before the blockers recover.';
  const encounterLocked=!round.practice&&!round.encounterComplete;
  $('#encounter-status').hidden=round.practice;$('#encounter-status').textContent=round.encounterComplete?'All rivals defeated · Door or window':`${round.encounterProgress}/${round.encounterGoal} rivals defeated`;
  if(encounterLocked&&active){$('#objective-title').textContent=boarder?'Stop them taking your seat!':'Defeat every rival';$('#objective-detail').textContent='Rivals fight each other too. Be the last one standing, then board.';}
  $('#blocker-panel').hidden=!active||!blocked;$('#blocker-count').textContent=`${round.blockers.length} ${round.blockers.length===1?'passenger blocks':'passengers block'} the entrance`;
  const phase=active?(round.board>0?'board':'fight'):bus.phase==='arriving'?'arrival':'wait';
  document.querySelectorAll('[data-phase]').forEach(el=>{el.classList.toggle('current',el.dataset.phase===phase);});
  const destination=run.arena.route.split('—').at(-1).trim();
  $('#mate-call').textContent=round.practice?'COMBAT LAB · No time limit':bus.phase==='full'?'MATE: “Full! Next car!”':bus.phase==='arriving'?`MATE: “${destination}! ${bus.full?'Full!':'One seat!'}”`:active&&bus.remaining<=8?'MATE: “Last seat! We are going!”':active&&bus.remaining>bus.window-4?`MATE: “${destination}! One seat!”`:'';
  const ready=active&&p.shoveCooldown<=0&&p.stamina>=28;$('#shove-status').textContent=!active?'Waiting for a seat':p.shoveCooldown>0?`Shove ${p.shoveCooldown.toFixed(1)}s`:p.stamina<28?'Shove: need stamina':'Shove ready';
  document.querySelectorAll('[data-action="shove"]').forEach(button=>{button.disabled=!ready;});document.querySelectorAll('[data-action="attack"]').forEach(button=>button.disabled=!active);
  const c=round.challenge,challengeLabels={finisher:'Land 2 combo finishers',shove:'Shove 3 rivals in one push',defend:'Perfect block or dodge a live swing'};
  $('#challenge-title').textContent=c.status==='won'?'BONUS COMPLETE':c.status==='expired'?'NEXT CHALLENGE AT NEXT STOP':'STOP CHALLENGE';
  $('#challenge-detail').textContent=c.status==='won'?'+300 points · +15 health':c.status==='expired'?'Keep fighting for your seat.':`${challengeLabels[c.kind]} · ${c.progress}/${c.goal} · ${Math.ceil(c.time)}s`;
  $('#challenge-panel').classList.toggle('completed',c.status==='won');$('#challenge-panel').hidden=round.practice;
  if(!round.practice){const street=round.street;$('#challenge-title').textContent=street.intermission?'CROWD DARE COMPLETE':`CROWD DARE · ${Math.ceil(street.time)}s`;$('#challenge-detail').textContent=street.intermission?`${street.wins} won · +10 health · +20 special`:`${street.dare.title} · ${Math.min(street.progress,street.dare.goal)}/${street.dare.goal} — ${street.dare.hint}`;$('#challenge-panel').classList.toggle('completed',street.intermission>0);}
  $('#momentum-fill').style.width=`${round.momentum}%`;$('#momentum-label').textContent=round.combat.active?.move.id==='special'?'LAST SEAT SPECIAL':round.momentum>=100?'Q · LAST SEAT SPECIAL READY':`SPECIAL · ${Math.floor(round.momentum)}%`;
  $('#momentum-help').textContent=round.momentum>=100?'Get close. Unleash three powerful strikes.':'Charge with combos, blocks and dodges.';
  $('#momentum-panel').classList.toggle('ready',round.momentum>=100);$('#streak').textContent=round.chain>1?`${round.chain} HIT STREAK  ×${round.multiplier}`:'';
  document.querySelectorAll('[data-action="burst"]').forEach(b=>{b.disabled=!active||round.momentum<100;});
  const low=round.enemies.some(e=>e.attackKind==='low'&&e.state==='windup'&&distance(p,e)<3);if(low)$('#objective-detail').textContent='LOW SWEEP! Hold S + K, or dodge.';const heavy=round.enemies.some(e=>e.heavy&&e.state==='windup'&&distance(p,e)<3.3);
  $('#objective-detail').classList.toggle('danger',heavy);if(heavy)$('#objective-detail').textContent='HEAVY SWEEP! Dodge with L / Space. Blocking will hurt.';
  $('#hud').classList.toggle('last-call',active&&bus.remaining<=8);
  const item=round.pickups.find(a=>!a.used&&distance(p,a)<1.65);let content='';
  if(round.street.nearby)content=`<kbd>R</kbd> ${round.street.nearby.name}<small>Catch rivals in the trick · 10 stamina</small>`;
  else if(item)content=`<kbd>R</kbd> ${WEAPONS[item.type]?`Equip ${WEAPONS[item.type].name}<small>${WEAPONS[item.type].trait}</small>`:'Drink · +30 health'}`;
  else if(!active)content=bus.phase==='full'?'No space on this trotro. Let it leave.':`Next arrival · ${Math.ceil(bus.arrivalIn)}s`;
  else if(round.nearDoor&&encounterLocked)content=`Defeat every rival<small>${round.encounterProgress}/${round.encounterGoal} defeated</small>`;
  else if(round.window.near&&!round.practice)content=round.window.watching?'<kbd>F</kbd> Shove the mate, then G to vault':'<kbd>G</kbd> Vault through the window';
  else if(round.nearDoor){content=blocked?'<kbd>F</kbd> Shove the blockers out of the doorway':`<kbd>E</kbd> Hold to enter<div class="board-meter"><div style="width:${Math.min(100,round.board*100)}%"></div></div>`;}
  else if(cleared&&distance(p,DOOR)<3.8)content=`Move closer to the glowing door · ${Math.ceil(distance(p,DOOR))} m`;
  document.querySelectorAll('[data-key="r"]').forEach(b=>b.textContent=round.street.nearby?'Street trick':'Pick up');
  $('#context-action').innerHTML=round.practice?'S + U low sweep · W + U flying knee':content;
  const foe=round.combat.target;$('#rival-panel').hidden=!active||!foe;
  if(foe){$('#rival-name').textContent=round.practice?'Sparring partner':foe.captain?round.captain.name:foe.character?characterById(foe.character).name+' · '+characterById(foe.character).role:foe.role==='keeper'?'Heavy blocker':foe.role==='bruiser'?'Bag brawler':foe.role==='swinger'?'Street swinger':'Quick striker';$('#rival-health').style.width=`${Math.max(0,foe.hp/foe.maxHp)*100}%`;$('#rival-guard').style.width=`${foe.guard}%`;$('#rival-state').textContent=foe.state==='airborne'?'AIRBORNE':foe.guardBroken>0?'GUARD BROKEN':foe.defending?'HIGH GUARD':foe.state==='boarding'?'BOARDING':'FOCUSED';$('#rival-tip').textContent=p.counterTime>0?'COUNTER NOW · I launches':(foe.readUntil||0)>round.elapsed?'READING YOUR JABS · S+U / O throws':foe.defending?'S + U sweeps · O throws':'O throws · Tab switches rival';}
  $('#boarding-alert').hidden=!boarder;$('#boarding-warning').textContent=boarder?.state==='boarding'?'Interrupt now — hit or shove!':`Rival rushing to the ${boarder?.boardRoute||'door'}!`;$('#rival-board-fill').style.width=`${(boarder?.boardProgress||0)*100}%`;
  const inputs=round.combat.trail.map(i=>i.key);$('#input-trail').textContent=inputs.length?inputs.join(' › '):'J › J › I';$('#move-name').textContent=round.elapsed<round.combat.moveUntil?round.combat.moveName:'Circle Uppercut';$('#move-hint').textContent=round.chain>1?`${round.chain} hits · ${round.comboDamage} damage · ×${round.multiplier} score`:!round.coach.hit?'Get close, then J → J → I to launch.':!round.coach.shove?'F shoves a crowd. Use the gap to reach the door.':'Hold E at the glowing doorway to take the seat.';$('#cinema-bars').classList.toggle('active',round.combat.active?.move.id==='special');
  const use=contextAction(round);$('#touch-use').textContent=use.label;$('#touch-use').disabled=!!use.disabled;$('#touch-charge').textContent=Math.floor(round.momentum)+'%';
  $('#mobile-status').textContent=round.practice?'Practice · Pause for moves':round.window.active?round.window.puller?'Being grabbed · Hold Fight to kick free!':'Climbing · Hold Fight to keep rivals away':!active?(bus.full?'Full trotro · Next one coming':`Next trotro · ${Math.ceil(bus.arrivalIn)}s`):round.encounterComplete?(round.window.near&&round.window.watching?'Mate watching · Shove him back':'All rivals down · Door or window'):boarder?`Rival at ${boarder.boardRoute||'door'} · Hit or shove!`:`Door: ${round.encounterGoal-round.encounterProgress} rivals left · Win the fight to board`;
  const target=round.practice?null:round.target;if(target){const position=stage.project(target.x,2.45,target.z);$('#objective-marker').hidden=distance(p,target)<3;$('#objective-marker').style.left=`${Math.max(55,Math.min(innerWidth-65,position.x))}px`;$('#objective-marker').style.top=`${Math.max(innerWidth<760?350:160,Math.min(innerHeight-230,position.y))}px`;$('#marker-label').textContent=round.street.props.includes(target)?'R · Street trick':boarder?'Stop this rival':encounterLocked?'Fight this rival':cleared?'Last seat':'Board here';$('#marker-distance').textContent=`${Math.ceil(distance(p,target))} m`;$('#objective-marker').classList.toggle('door-ready',cleared);}else $('#objective-marker').hidden=true;
}
function processEvents(){
  for(const event of round.events.splice(0)){
    if(event.type==='message')announce(event.text);
    else if(event.type==='dare-won'){announce(event.text,2600);soundEffect('won');stage.shoveWave(round.player.x,round.player.z);}
    else if(event.type==='street-trick'||event.type==='street-hit'){feedback(event.text);stage.impact(event.x,event.z,true,.6);stage.shoveWave(event.x,event.z);soundEffect('shove');}
    else if(event.type==='comeback'){announce(event.text,3400);soundEffect('won');stage.shoveWave(round.player.x,round.player.z);}
    else if(event.type==='rush'){feedback('RUSH · KEEP IT GOING');soundEffect('won');stage.shoveWave(round.player.x,round.player.z);}
    else if(event.type==='captain-down'){announce(event.text,3000);soundEffect('won');}
    else if(event.type==='encounter-cleared'){announce('Everyone down! Door or window — your choice.',2200);soundEffect('won');}
    else if(event.type==='challenge'){announce(event.text,3200);soundEffect('won');}
    else if(event.type==='mate-shove'||event.type==='mate-rebuff'){announce(event.text,2100);soundEffect('shove');stage.shoveWave(round.player.x,round.player.z);if(event.type==='mate-rebuff')mateCall('Ei! Use the door!');}
    else if(event.type==='crowd-hit'){stage.impact(event.x,event.z,false);soundEffect('hit');}
    else if(event.type==='crowd-down'){stage.shoveWave(event.x,event.z);soundEffect('down');}
    else if(event.type==='crowd-interrupt'){stage.shoveWave(event.x,event.z);soundEffect('shove');}
    else if(event.type==='window-jump'){soundEffect('dodge');feedback('WINDOW ESCAPE');}
    else if(event.type==='window-grab'){soundEffect('danger');announce('They are grabbing you! Hold Fight / J to kick free.',1400);}
    else if(event.type==='window-kick'){soundEffect('shove');feedback('KICK FREE');}
    else if(event.type==='window-pulled'){soundEffect('damage');announce(event.text,2000);if(stage.shakeEnabled)stage.shake=.18;}
    else if(event.type==='special'){feedback('LAST SEAT SPECIAL');soundEffect('shove');}
    else if(event.type==='combat-note')announce(event.text,1600);
    else if(event.type==='move'){}
    else if(event.type==='guard-hit'){stage.impact(event.x,event.z,false);soundEffect('block');feedback('GUARDED · Sweep or throw');impactPause=.02;}
    else if(event.type==='guard-break'){stage.impact(event.x,event.z,true);feedback('GUARD BROKEN');soundEffect('parry');}
    else if(event.type==='launch'){stage.shoveWave(event.x,event.z);}
    else if(event.type==='crowd-crash'){feedback('CROWD CRASH · MAKE A GAP');stage.shoveWave(event.x,event.z);soundEffect('shove');}
    else if(event.type==='land'){stage.shoveWave(event.x,event.z);soundEffect('hit');}
    else if(event.type==='finisher'){feedback(event.name.toUpperCase());}
    else if(event.type==='rival-boarding'){announce(`Rival taking the ${event.route||'door'}! Hit or shove them!`,1900);soundEffect('danger');}
    else if(event.type==='boarding-stopped'){feedback(`SEAT SAVED · +${2+round.bonuses.interruptTime}s · +100`);soundEffect('parry');}
    else if(event.type==='seat-stolen'){feedback('SEAT TAKEN · NEXT TROTRO');soundEffect('missed');}
    else if(event.type==='last-call'){soundEffect('danger');mateCall('Last seat! We are going!');}
    else if(event.type==='bus-state'){lastCountdown=-1;if(event.phase==='boarding'||event.phase==='full')soundEffect('bus-state');if(event.phase==='arriving'){soundEffect('arriving');mateCall(arrivalCall(run.arena.route,event.full));}if(event.phase==='departing')soundEffect('departing');}
    else if(event.type==='end')finish(event.result);
    else if(event.type==='hit'){if(stage.shakeEnabled&&navigator.vibrate)navigator.vibrate(event.finish?35:12);stage.impact(event.x,event.z,event.finish,1.3+(event.y||0));soundEffect('hit');impactPause=event.finish?.065:.035;const at=stage.project(event.x,1.7+(event.y||0),event.z);if(at.x>0&&at.x<innerWidth&&at.y>0&&at.y<innerHeight){const number=document.createElement('span');number.className='floating-damage'+(event.finish?' finisher':'');number.textContent=event.damage;number.style.left=at.x+'px';number.style.top=at.y+'px';$('#hud').appendChild(number);setTimeout(()=>number.remove(),700);}}
    else if(event.type==='combo')feedback(`${event.aerial?'AIR ':''}${event.count} HIT · ${event.damage} DAMAGE`);
    else if(event.type==='down'){feedback(event.keeper?'Heavy blocker down! +500':'Knockdown! +150');soundEffect('down');}
    else if(event.type==='shove'){stage.shoveWave(event.x,event.z);feedback('Make some space!');soundEffect('shove');}
    else if(event.type==='parry'){stage.impact(event.x,event.z,true);feedback('PERFECT BLOCK · I TO COUNTER');soundEffect('parry');}
    else if(event.type==='evade'){feedback('Clean dodge! +35');}
    else if(event.type==='door-open'){feedback('GAP OPEN · HOLD E AT THE DOOR');soundEffect('danger');}
    else{soundEffect(event.type);if(event.type==='damage'&&stage.shakeEnabled)stage.shake=.14;}
  }
}
for(const button of document.querySelectorAll('[data-mode]')){button.setAttribute('aria-pressed',button.dataset.mode===mode);button.addEventListener('click',()=>{mode=button.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>{const selected=b.dataset.mode===mode;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});$('#mode-description').textContent=MODES[mode].description;});}
for(const b of document.querySelectorAll('[data-journey]'))b.addEventListener('click',()=>{playMode=b.dataset.journey;document.querySelectorAll('[data-journey]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',el===b);});refreshJourneyMenu();});
$('#fresh-journey').addEventListener('click',()=>$('#new-journey-dialog').showModal());$('#cancel-fresh').addEventListener('click',()=>$('#new-journey-dialog').close());$('#confirm-fresh').addEventListener('click',()=>{$('#new-journey-dialog').close();startCity(true);});
$('#city-continue').addEventListener('click',()=>{if(run.complete){playMode='endless';$('#city-travel').close();startCity();return;}const next=run.phase==='retry'?run.retry():run.advance();if(next){cityReward='';playRound(next);}});$('#city-leave').addEventListener('click',lobby);$('#city-travel').addEventListener('cancel',e=>{e.preventDefault();lobby();});
$('#mode-description').textContent=MODES[mode].description;
for(const button of document.querySelectorAll('[data-dialog]'))button.addEventListener('click',()=>$('#'+button.dataset.dialog).showModal());
for(const button of document.querySelectorAll('.close-dialog'))button.addEventListener('click',()=>button.closest('dialog').close());
for(const dialog of document.querySelectorAll('.information-dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();}});
$('#play-tab').addEventListener('click',()=>$('#start').focus());$('#start').addEventListener('click',start);$('#daily').addEventListener('click',()=>startDaily());$('#career-button').addEventListener('click',()=>{refreshCareer();$('#career-dialog').showModal();});$('#choose-character').addEventListener('click',characterMenu);$('#character-play').addEventListener('click',start);$('#practice').addEventListener('click',practice);$('#moves-button').addEventListener('click',moves);$('#moves-return').addEventListener('click',resume);$('#close-moves').addEventListener('click',resume);$('#moves-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('#combo-routes').innerHTML=COMBO_ROUTES.map(c=>`<article><kbd>${c.keys}</kbd><b>${c.name}</b><p>${c.detail}</p></article>`).join('');$('#retry').addEventListener('click',retry);$('#back-lobby').addEventListener('click',lobby);$('#quit').addEventListener('click',lobby);$('#pause').addEventListener('click',pause);$('#resume').addEventListener('click',resume);
$('#pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('#result').addEventListener('cancel',e=>{e.preventDefault();lobby();});$('#shake-setting').checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;$('#shake-setting').addEventListener('change',e=>stage.shakeEnabled=e.target.checked);
$('#sound-toggle').addEventListener('click',()=>{setSound(!sound);if(sound)soundEffect('pickup');});$('#sound-setting').addEventListener('change',e=>setSound(e.target.checked));setSound(sound);
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}});
window.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();if(!round||round.status!=='playing')return;
  if(key==='escape'||key==='p'){e.preventDefault();if(!e.repeat)paused?resume():pause();return;}if(key==='m'){e.preventDefault();if(!e.repeat)$('#moves-dialog').open?resume():moves();return;}if(paused)return;
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','j','i','u','o','tab','k','l',' ','e','r','f','q','g'].includes(key))e.preventDefault();keys.add(key);
  if(!e.repeat){if(key==='j')action('attack');if(key==='i')action('heavy');if(key==='u')action('kick');if(key==='o')action('grab');if(key==='tab')action('target');if(key==='f')action('shove');if(key==='q')action('burst');if(key==='g')action('vault');if(key==='l'||key===' ')action('dodge');if(key==='r')action('pickup');}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{clearInput();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else if(!round)refreshCareer();});
function bindHold(button,key,press){
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);if(key)keys.add(key);press?.();});const release=()=>{if(key)keys.delete(key);};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  button.addEventListener('click',e=>{if(e.detail===0){if(press)press();else if(key==='k'){keys.add('k');setTimeout(()=>keys.delete('k'),500);}}});
}
document.querySelectorAll('[data-action]').forEach(button=>{const actionName=button.dataset.action;bindHold(button,actionName==='block'?'k':actionName==='attack'?'j':null,actionName==='block'?null:()=>action(actionName));});
document.querySelectorAll('[data-key]').forEach(button=>bindHold(button,button.dataset.key,button.dataset.key==='r'?()=>action('pickup'):null));
$('#menu-options').addEventListener('click',()=>{const expanded=document.body.classList.toggle('menu-expanded');$('#menu-options').setAttribute('aria-expanded',expanded);$('#menu-options').textContent=expanded?'Close game options':'Game options';});
$('#pause-moves').addEventListener('click',moves);
const stick=$('#thumbstick');let stickPointer=null;
function updateStick(event){const box=stick.getBoundingClientRect(),v=stickVector(event.clientX-box.left-box.width/2,event.clientY-box.top-box.height/2);touchState.x=v.x;touchState.z=v.z;$('#stick-knob').style.transform=`translate(calc(-50% + ${v.knobX}px),calc(-50% + ${v.knobY}px))`;}
stick.addEventListener('pointerdown',event=>{if(paused||!round)return;event.preventDefault();stickPointer=event.pointerId;stick.setPointerCapture(event.pointerId);updateStick(event);});
stick.addEventListener('pointermove',event=>{if(event.pointerId===stickPointer)updateStick(event);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,()=>{stickPointer=null;touchState.x=0;touchState.z=0;$('#stick-knob').style.transform='translate(-50%,-50%)';});
const fight=$('#touch-fight');fight.addEventListener('pointerdown',event=>{event.preventDefault();fight.setPointerCapture(event.pointerId);if(!paused)touchState.assist=true;});
for(const name of ['pointerup','pointercancel','lostpointercapture'])fight.addEventListener(name,()=>touchState.assist=false);
fight.addEventListener('click',event=>{if(event.detail===0)action('attack');});
function useContext(){if(paused||!round)return;const use=contextAction(round);if(use.kind==='board')keys.add('e');else if(!use.disabled)action(use.kind);}
const useButton=$('#touch-use');useButton.addEventListener('pointerdown',event=>{event.preventDefault();useButton.setPointerCapture(event.pointerId);useContext();});
for(const name of ['pointerup','pointercancel','lostpointercapture'])useButton.addEventListener(name,()=>keys.delete('e'));
useButton.addEventListener('click',event=>{if(event.detail===0){useContext();setTimeout(()=>keys.delete('e'),1500);}});
try{
  stage=new Stage($('#world'));await stage.prepare();
  for(const a of ARENAS){const button=document.createElement('button');button.className='arena-choice';button.dataset.arena=a.id;button.innerHTML=`<strong>${a.name}</strong><small>${a.subtitle}</small>`;button.addEventListener('click',()=>selectArena(a));$('#arena-list').appendChild(button);}
  selectArena(arena);const portraits=stage.portraits();for(const c of CHARACTERS){const button=document.createElement('button');button.type='button';button.className='character-card';button.dataset.character=c.id;button.style.setProperty('--fighter-color',c.color);button.innerHTML=`<img alt="${c.name}, ${c.role}" src="${portraits.get(c.id)}"><span>${c.role}</span><strong>${c.name}</strong><small>${c.perk}</small>`;button.addEventListener('click',()=>selectCharacter(c.id));$('#character-grid').appendChild(button);}selectCharacter(characterId);refreshCareer();$('#load-screen').remove();
  function loop(now){
    const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;let simulationDt=dt;
    if(impactPause>0){impactPause-=dt;simulationDt*=.15;}
    if(round&&!paused&&round.status==='playing'){const m=movement();round.tick(simulationDt,{...m,assist:touchState.assist,attack:keys.has('j'),block:keys.has('k'),crouch:keys.has('s')||keys.has('arrowdown'),board:keys.has('e')});processEvents();updateHUD();}
    stage.update(paused?0:simulationDt,round,!round);requestAnimationFrame(loop);
  }requestAnimationFrame(loop);
}catch(error){console.error(error);$('#load-screen').innerHTML='<strong>The arena could not start.</strong><p>Check your connection and enable WebGL, then reload.</p><button class="secondary" onclick="location.reload()">Try again</button>';}
