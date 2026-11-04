import {DOOR,PAVEMENT,BUS_BOUNDS,GUARD_POSTS} from './layout.js';
import {CHARACTERS,characterById} from './characters.js';
import {CombatSystem} from './combat.js';
export {DOOR} from './layout.js';
export const MODES = {
  easy: {count:4,time:85,damage:8,speed:1.6,hp:84,gateHp:116,windup:1.1,attackers:1,raceDelay:9,rivalBoardTime:3.4,boardTime:1,busWindow:38,fullChance:.35,description:'4 rivals · 38 seconds · learn the combos.'},
  normal: {count:6,time:75,damage:11,speed:1.95,hp:108,gateHp:148,windup:.85,attackers:2,raceDelay:7,rivalBoardTime:2.9,boardTime:1.1,busWindow:32,fullChance:.45,description:'6 rivals · 32 seconds · fight for the last seat.'},
  hard: {count:8,time:65,damage:15,speed:2.3,hp:132,gateHp:180,windup:.66,attackers:3,raceDelay:5.5,rivalBoardTime:2.5,boardTime:1.2,busWindow:26,fullChance:.55,description:'8 rivals · 26 seconds · fast boarding rivals.'}
};
export const ARENAS = [
  {id:'circle',name:'Circle',subtitle:'The evening scramble',description:'Under the flyover. In the middle of everything.',query:'Kwame Nkrumah Circle trotro station Accra',color:0xc6c1ac,sky:0xc3d5d8,accent:0x397e8d,route:'CIRCLE  —  MADINA',feature:'flyover'},
  {id:'kaneshie',name:'Kaneshie',subtitle:'Market-day mayhem',description:'Market stalls, tight corners, and one very busy door.',query:'Kaneshie Market trotro station Accra',color:0xceac85,sky:0xc8d1cb,accent:0xc7783c,route:'KANESHIE  —  ACCRA',feature:'market'},
  {id:'madina',name:'Madina',subtitle:'The market rush',description:'A lively market, colourful awnings, and a crowd with plans.',query:'Madina trotro station Accra',color:0xb9aa9b,sky:0xc1c8d2,accent:0x71678a,route:'MADINA  —  CIRCLE',feature:'market'},
  {id:'37',name:'37 Station',subtitle:'The roadside showdown',description:'A leafy roadside. A short wait. A sudden rush.',query:'37 Military Hospital trotro station Accra',color:0xb5bf9b,sky:0xc2d4d2,accent:0x578d78,route:'37  —  MADINA',feature:'trees'},
  {id:'lapaz',name:'Lapaz',subtitle:'Rush-hour pressure',description:'The roadside strip gets crowded. Keep a way out.',query:'Lapaz trotro station Accra',color:0xc3b298,sky:0xc8d6dd,accent:0x3e789b,route:'LAPAZ  —  CIRCLE',feature:'strip'},
  {id:'tema',name:'Tema Station',subtitle:'The last departure',description:'A busy central yard, parked trotros, and a narrow escape.',query:'Tema Station Accra trotro',color:0xc7b8a2,sky:0xd4d1bf,accent:0x41868a,route:'ACCRA  —  TEMA',feature:'yard'}
];
export const WEAPONS={
  hands:{name:'Bare hands',trait:'Quick single strikes',reach:2.05,damage:22,finisher:36,cost:9,cooldown:.3,targets:1,push:1.55,color:0xd9c59b,enemyDamage:1,windup:1},
  bag:{name:'Travel bag',trait:'Wide swing · hits 2',reach:2.5,damage:29,finisher:43,cost:9,cooldown:.34,targets:2,push:1.55,color:0xffd15a,enemyDamage:1,windup:1},
  umbrella:{name:'Umbrella',trait:'Longest reach · light jabs',reach:3.05,damage:20,finisher:34,cost:8,cooldown:.29,targets:1,push:1.3,color:0x91cddd,enemyDamage:.85,windup:.95},
  baton:{name:'Baton',trait:'Fast strikes · low stamina',reach:2.2,damage:24,finisher:38,cost:7,cooldown:.24,targets:1,push:1.4,color:0xd6a1e5,enemyDamage:1,windup:.8},
  stool:{name:'Market stool',trait:'Heavy sweep · hits 3',reach:2.45,damage:37,finisher:54,cost:17,cooldown:.62,targets:3,push:2.15,color:0xe59a73,enemyDamage:1.25,windup:1.3},
  suitcase:{name:'Suitcase',trait:'Strong knockback · hits 2',reach:2.65,damage:32,finisher:48,cost:13,cooldown:.46,targets:2,push:2.05,color:0xb9d99b,enemyDamage:1.1,windup:1.15}
};
export const weaponStats=key=>WEAPONS[key===true?'bag':key]||WEAPONS.hands;
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function constrain(a,busPresent=true){
  a.x=Math.max(PAVEMENT.minX,Math.min(PAVEMENT.maxX,a.x)); a.z=Math.max(PAVEMENT.minZ,Math.min(PAVEMENT.maxZ,a.z));
  // The bus is a solid obstacle. Resolve against the closest expanded edge.
  const {minX,maxX,minZ,maxZ}=BUS_BOUNDS;
  if(busPresent&&a.x>minX&&a.x<maxX&&a.z>minZ&&a.z<maxZ){
    const edges=[{v:a.x-minX,k:'x',p:minX},{v:maxX-a.x,k:'x',p:maxX},{v:a.z-minZ,k:'z',p:minZ},{v:maxZ-a.z,k:'z',p:maxZ}].sort((u,v)=>u.v-v.v);
    a[edges[0].k]=edges[0].p;
  }
}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

export const BUS_TIMING={full:2.4,departing:3.2,waiting:4.2,arriving:3.6};
export class BusCycle {
  constructor({firstFull=false,startWaiting=false,window=25,fullChance=.4,random=Math.random}={}){
    this.random=random;this.window=window;this.fullChance=fullChance;this.number=1;this.full=firstFull;this.initialApproach=startWaiting;this.phase=startWaiting?'waiting':firstFull?'full':'boarding';this.duration=this.phase==='boarding'?window:BUS_TIMING[this.phase];this.remaining=this.duration;this.lastWasFull=firstFull;
  }
  get canBoard(){return this.phase==='boarding'&&!this.full;}
  get seats(){return this.full?0:1;}
  get progress(){return Math.max(0,Math.min(1,1-this.remaining/this.duration));}
  get arrivalIn(){return this.phase==='boarding'?0:this.remaining+(this.phase==='full'?BUS_TIMING.departing+BUS_TIMING.waiting+BUS_TIMING.arriving:this.phase==='departing'?BUS_TIMING.waiting+BUS_TIMING.arriving:this.phase==='waiting'?BUS_TIMING.arriving:0);}
  tick(dt){
    this.remaining=Math.max(0,this.remaining-dt);if(this.remaining>1e-8)return null;const from=this.phase;
    if(from==='full'||from==='boarding'){this.lastWasFull=this.full;this.phase='departing';}
    else if(from==='departing'){this.phase='waiting';}
    else if(from==='waiting'){if(this.initialApproach)this.initialApproach=false;else{this.number++;this.full=!this.lastWasFull&&this.random()<this.fullChance;}this.phase='arriving';}
    else{this.phase=this.full?'full':'boarding';}
    this.duration=this.phase==='boarding'?this.window:BUS_TIMING[this.phase];this.remaining=this.duration;
    return{from,to:this.phase,number:this.number,full:this.full};
  }
}

export class Round {
  constructor(mode='normal',random=Math.random,options={}){
    this.character=options.character?characterById(options.character):null;this.mode=mode;this.random=random;this.stage=options.stage||1;this.practice=!!options.practice;
    const level=this.stage-1,base=MODES[mode];
    this.config={...base,count:base.count+level,hp:Math.round(base.hp*(1+level*.1)),gateHp:Math.round(base.gateHp*(1+level*.12)),speed:base.speed*(1+level*.06)};
    this.momentum=35;this.rushTime=0;this.chain=0;this.chainTime=0;this.bestChain=0;this.lastCall=false;this.challenge={kind:['finisher','shove','defend'][(this.stage-1)%3],progress:0,goal:this.stage===1?2:1,time:30,status:'active'};
    this.elapsed=0;this.status='playing';this.kos=0;this.score=0;this.board=0;this.combo=0;this.lastCombo=-10;this.events=[];this.doorCalled=false;this.hitsTaken=0;
    this.bus=new BusCycle({firstFull:!!options.firstBusFull,startWaiting:!!options.startWaiting,window:base.busWindow,fullChance:base.fullChance,random});
    this.player={x:3.6,z:5.2,hp:options.health??100,stamina:100,face:Math.PI,action:'idle',actionTime:0,cooldown:0,shoveCooldown:0,invulnerable:0,hurt:0,character:this.character?.id,weapon:options.weapon===true?'bag':options.weapon!==undefined?options.weapon:this.character?.item||null,rest:0,dx:0,dz:-1,walk:0,blockTime:0};
    const posts=GUARD_POSTS;
    this.enemies=Array.from({length:this.config.count},(_,i)=>{
      const role=i===0?'keeper':i%3===1?'bruiser':i%3===2?'swinger':'jabber',post=posts[i%posts.length];
      const enemy={id:i,character:CHARACTERS[(i+this.stage*3)%CHARACTERS.length].id,role,x:post.x,z:post.z,hp:i===0?this.config.gateHp:this.config.hp,maxHp:i===0?this.config.gateHp:this.config.hp,face:Math.PI*.2,guard:100,guardBroken:0,y:0,vy:0,knockX:0,knockZ:0,state:'guard',timer:.5+random(),hurt:0,walk:random()*5,weapon:i===0?'suitcase':['umbrella','stool','bag','baton','suitcase'][(i-1)%5],spawnX:post.x,spawnZ:post.z};
      if(!this.combatActive)Object.assign(enemy,this.waitingPost(enemy));this.constrainActor(enemy);return enemy;
    });
    this.pickups=[{type:'bag',x:2.4,z:3.7,used:options.weapon===true||options.weapon==='bag'},{type:'drink',x:-7,z:0,used:false},{type:'drink',x:7.5,z:1,used:false},...([{type:'umbrella',x:-1,z:4},{type:'baton',x:5,z:1.5},{type:'stool',x:-7,z:5.7},{type:'suitcase',x:7.2,z:5.9}].map(item=>({...item,used:item.type===options.weapon})))];
    for(const item of this.pickups)if(item.type===this.player.weapon)item.used=true;
    this.gapWasOpen=false;this.missedBuses=0;this.seatsLost=0;this.raceClock=base.raceDelay;this.comboDamage=0;this.combat=new CombatSystem(this);
    if(this.practice){this.bus.phase='boarding';this.bus.full=false;this.bus.remaining=base.busWindow;this.enemies=this.enemies.slice(0,1);Object.assign(this.keeper,{hp:350,maxHp:350});Object.assign(this.player,{x:DOOR.x,z:DOOR.z+2.5});this.momentum=100;}
  }
  get weapon(){return weaponStats(this.player.weapon);}
  get boardingRival(){return this.enemies.find(e=>e.state==='rushing'||e.state==='boarding')||null;}
  get combatActive(){return this.bus.canBoard;}
  get busBlocksGround(){return this.bus.phase==='full'||this.bus.phase==='boarding'||(this.bus.phase==='arriving'&&this.bus.progress>.94)||(this.bus.phase==='departing'&&this.bus.progress<.12);}
  constrainActor(actor){constrain(actor,this.busBlocksGround);}
  get gathering(){return this.combatActive||(this.bus.phase==='arriving'&&!this.bus.full&&this.bus.progress>.12);}
  waitingPost(enemy){return{x:-5.7+(enemy.id%5)*1.2,z:1.4+Math.floor(enemy.id/5)*1.35};}
  busChanged(change){
    this.combat.reset();this.raceClock=this.config.raceDelay;this.board=0;this.combo=0;this.lastCall=false;this.doorCalled=false;this.gapWasOpen=false;if(this.player.action==='boarding')this.player.action='idle';
    if(change.to==='departing'&&!change.full)this.missedBuses++;
    if(['departing','arriving','boarding'].includes(change.to))for(const e of this.enemies){if(e.state==='boarded'&&change.to==='departing')continue;if(e.state==='boarded')Object.assign(e,this.waitingPost(e));e.hp=e.maxHp;e.state='guard';e.hurt=0;e.timer=.5+this.random();e.y=0;e.vy=0;e.knockX=0;e.knockZ=0;e.boardProgress=0;e.guard=100;e.guardBroken=0;e.tripTime=0;e.defending=false;}
    this.emit('bus-state',{phase:change.to,full:change.full,number:change.number});
    if(change.to==='departing')this.emit('message',{text:change.full?'This trotro is full. It is leaving. Wait for the next one.':'That trotro has left. Another one is on the way.'});
    else if(change.to==='arriving')this.emit('message',{text:'Another trotro is pulling in. Check for a free seat.'});
    else if(change.to==='full')this.emit('message',{text:'This trotro is full. Save your strength for the next arrival.'});
    else if(change.to==='boarding')this.emit('message',{text:'One free seat! Clear the doorway and fight your way in.'});
  }
  get keeper(){return this.enemies.find(e=>e.role==='keeper');}
  get gateCleared(){return !this.doorBlocked;}
  get target(){return this.combatActive?(this.boardingRival||DOOR):null;}
  get blockers(){return this.enemies.filter(e=>e.hp>0&&['guard','windup','swing','rushing','boarding'].includes(e.state)&&distance(e,DOOR)<1.65);}
  get doorBlocked(){return this.blockers.length>0;}
  emit(type,data={}){this.events.push({type,...data});}
  get multiplier(){return Math.min(3,1+Math.floor(this.chain/4));}
  gainMomentum(amount){amount*=this.character?.meter||1;const wasReady=this.momentum>=100;this.momentum=Math.min(100,this.momentum+amount);if(!wasReady&&this.momentum>=100)this.emit('message',{text:'LAST SEAT SPECIAL ready! Get close and press Q.'});}
  progressChallenge(kind,amount=1){
    const c=this.challenge;if(c.status!=='active'||c.kind!==kind)return;c.progress=Math.min(c.goal,c.progress+amount);
    if(c.progress>=c.goal){c.status='won';this.score+=300;this.player.hp=Math.min(100,this.player.hp+15);this.gainMomentum(25);this.emit('challenge',{text:'Challenge complete! +300 points · +15 health'});}
  }
  burst(){return this.combat.special();}
  down(enemy){
    enemy.hp=0;enemy.state='down';enemy.downAge=0;enemy.timer=this.practice?2.5:enemy.role==='keeper'?Infinity:8;this.kos++;
    this.score+=(enemy.role==='keeper'?500:150)*this.multiplier;this.gainMomentum(12);this.player.stamina=Math.min(100,this.player.stamina+12);
    this.emit('down',{x:enemy.x,z:enemy.z,keeper:enemy.role==='keeper'});
    if(enemy.role==='keeper'){
      this.emit('message',{text:'Heavy blocker down! Take the gap before the others regroup.'});
    }
  }
  strikeEnemy(enemy,damage,push,stun,hit={}){
    if(enemy.state==='rushing'||enemy.state==='boarding'){this.raceClock=3.2;enemy.boardProgress=0;this.emit('boarding-stopped',{x:enemy.x,z:enemy.z});}
    enemy.defending=false;
    const p=this.player;damage=Math.round(damage*(this.rushTime>0?1.25:1));enemy.hp-=damage;enemy.hurt=.26;
    let dx=enemy.x-p.x,dz=enemy.z-p.z,len=Math.hypot(dx,dz);if(len<.01){dx=Math.sin(p.face);dz=Math.cos(p.face);len=1;}
    if(hit.smooth){enemy.knockX=dx/len*push*6;enemy.knockZ=dz/len*push*6;}else{enemy.x+=dx/len*push;enemy.z+=dz/len*push;}this.constrainActor(enemy);enemy.state='recover';enemy.timer=stun;enemy.tripTime=hit.trip?stun:0;
    this.score+=10*this.multiplier;this.emit('hit',{x:enemy.x,z:enemy.z,y:enemy.y||0,finish:hit.finisher||push>1,damage,move:hit.move,air:hit.air});
    if(enemy.hp<=0)this.down(enemy);
  }
  attack(kind='light',direction=0){return this.combat.press(kind,direction);}
  shove(){
    const p=this.player;if(!this.combatActive||this.status!=='playing'||p.shoveCooldown>0||p.stamina<28||!this.combat.neutral())return false;
    p.stamina-=28;p.rest=.7;p.shoveCooldown=4;p.action='shove';p.actionTime=.44;p.cooldown=.48;
    const targets=this.enemies.filter(e=>e.state!=='down'&&distance(p,e)<2.65).sort((a,b)=>distance(p,a)-distance(p,b));
    if(targets[0])p.face=Math.atan2(targets[0].x-p.x,targets[0].z-p.z);
    for(const enemy of targets.slice(0,4))this.strikeEnemy(enemy,12,2.35*(this.character?.shove||1),2.55);
    if(targets.length>=3)this.progressChallenge('shove');this.emit('shove',{x:p.x,z:p.z});return true;
  }
  dodge(mx=0,mz=0){
    const p=this.player;if(this.status!=='playing'||p.stamina<19*(this.character?.dodge||1)||['dodge','shove','hitstun'].includes(p.action)||this.combat.active)return false;
    let len=Math.hypot(mx,mz);if(!len){mx=Math.sin(p.face);mz=Math.cos(p.face);len=1;}
    p.dx=mx/len;p.dz=mz/len;p.stamina-=19*(this.character?.dodge||1);p.rest=.5;p.invulnerable=.46;p.action='dodge';p.actionTime=.29;p.cooldown=.35;this.emit('dodge');return true;
  }
  pickup(){
    const p=this.player;if(this.status!=='playing')return;
    const item=this.pickups.find(a=>!a.used&&distance(p,a)<1.65);if(!item)return;
    if(WEAPONS[item.type]){p.weapon=item.type;this.combo=0;this.emit('message',{text:weaponStats(p.weapon).name+' equipped. '+weaponStats(p.weapon).trait+'.'});}
    else{p.hp=Math.min(100,p.hp+30);this.emit('message',{text:'+30 health. Get back to the doorway.'});}
    item.used=true;this.emit('pickup');
  }
  hurtPlayer(damage,enemy){
    const p=this.player;if(!this.combatActive)return 'waiting';if(p.invulnerable>0){if(p.action==='dodge'){p.counterTime=1.2;this.score+=35;this.gainMomentum(18);this.progressChallenge('defend');this.emit('evade');}return 'dodged';}
    if(p.action==='block'&&p.stamina>=5&&(enemy.attackKind!=='low'||p.crouch)){
      if(p.blockTime<.2*(this.character?.parry||1)&&!enemy.heavy){p.stamina=Math.max(0,p.stamina-4);p.rest=.3;enemy.state='recover';enemy.timer=1.65;enemy.defending=false;p.counterTime=1.4;this.score+=75;this.gainMomentum(25);this.progressChallenge('defend');this.emit('parry',{x:enemy.x,z:enemy.z});return 'parried';}
      p.stamina=Math.max(0,p.stamina-11);p.rest=.6;damage*=enemy.heavy?.55:.12;this.emit('block');
    }else{this.combat.interrupted();p.action='hitstun';p.actionTime=.26;p.cooldown=.26;this.emit('damage');p.invulnerable=.32;this.hitsTaken++;this.chain=0;this.chainTime=0;}
    p.hp=this.practice?100:Math.max(0,p.hp-damage*(this.character?.armor||1));p.hurt=.2;this.board=0;
    const len=distance(p,enemy)||1;p.x+=(p.x-enemy.x)/len*.16;p.z+=(p.z-enemy.z)/len*.16;this.constrainActor(p);return 'hit';
  }
  moveEnemy(enemy,goal,dt,pace){
    const d=distance(enemy,goal);if(d<.05)return;const amount=Math.min(d,pace*dt);
    enemy.face=Math.atan2(goal.x-enemy.x,goal.z-enemy.z);enemy.x+=(goal.x-enemy.x)/d*amount;enemy.z+=(goal.z-enemy.z)/d*amount;enemy.walk+=dt*8;enemy.moving=true;this.constrainActor(enemy);
  }
  tick(dt,input={}){
    if(this.status!=='playing')return;dt=clamp(dt,0,.05);this.elapsed+=dt;const change=this.practice?null:this.bus.tick(dt);if(change)this.busChanged(change);
    this.rushTime=Math.max(0,this.rushTime-dt);this.chainTime=Math.max(0,this.chainTime-dt);if(!this.chainTime){this.chain=0;this.comboDamage=0;}
    if(this.combatActive){
      if(this.challenge.status==='active'){this.challenge.time=Math.max(0,this.challenge.time-dt);if(!this.challenge.time)this.challenge.status='expired';}
      if(this.bus.remaining<=8&&!this.lastCall){this.lastCall=true;this.emit('last-call');this.emit('message',{text:'LAST CALL! Eight seconds. Open a gap and get in!'});}
    }
    const p=this.player;p.cooldown=Math.max(0,p.cooldown-dt);p.shoveCooldown=Math.max(0,p.shoveCooldown-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);p.hurt=Math.max(0,p.hurt-dt);p.rest=Math.max(0,p.rest-dt);
    if(p.actionTime>0){p.actionTime-=dt;if(p.actionTime<=0)p.action='idle';}
    p.crouch=!!input.crouch;
    if(!['dodge','attack','shove','hitstun'].includes(p.action)){
      if(input.block&&p.stamina>=5){if(p.action!=='block')p.blockTime=0;p.action='block';p.blockTime+=dt;}
      else{p.action='idle';p.blockTime=0;}
    }
    if(!p.rest&&p.action!=='block')p.stamina=Math.min(100,p.stamina+28*(this.character?.regen||1)*dt);
    if(this.combatActive&&input.attack&&p.cooldown===0&&!this.combat.active)this.attack();
    this.combat.tick(dt);if(this.practice)this.momentum=Math.min(100,this.momentum+dt*14);
    const crouched=p.action==='block'&&p.crouch,mx=crouched?0:input.x||0,mz=crouched?0:input.z||0,len=Math.hypot(mx,mz),speed=(p.action==='block'?1.9:4.25)*(this.character?.speed||1);
    p.moving=len>.01;p.moveX=mx;p.moveZ=mz;
    if(p.action==='dodge'){p.x+=p.dx*12*dt;p.z+=p.dz*12*dt;}
    else if(len){const factor=p.action==='hitstun'?0:['shove','attack'].includes(p.action)?.3:1;p.x+=mx/Math.max(1,len)*speed*factor*dt;p.z+=mz/Math.max(1,len)*speed*factor*dt;if(p.action!=='attack')p.face=Math.atan2(mx,mz);p.walk+=dt*10;}
    this.constrainActor(p);
    let attacking=this.enemies.filter(e=>e.state==='windup'||e.state==='swing').length;
    for(const e of this.enemies){
      e.hurt=Math.max(0,e.hurt-dt);e.timer-=dt;e.moving=false;e.guardBroken=Math.max(0,(e.guardBroken||0)-dt);e.tripTime=Math.max(0,(e.tripTime||0)-dt);e.downAge=(e.downAge||0)+dt;
      if(e.state==='boarded')continue;
      if(Math.abs(e.knockX||0)+Math.abs(e.knockZ||0)>.01){e.x+=(e.knockX||0)*dt;e.z+=(e.knockZ||0)*dt;e.knockX*=Math.exp(-dt*6);e.knockZ*=Math.exp(-dt*6);this.constrainActor(e);}
      if((e.y||0)>0||e.vy>0){e.y=Math.max(0,(e.y||0)+e.vy*dt);e.vy-=14*dt;if(e.y===0){e.vy=0;e.juggleHits=0;if(e.hp>0){e.state='recover';e.timer=.85;}this.emit('land',{x:e.x,z:e.z});}}
      if(!this.combatActive){if(e.hp<=0)continue;e.state='guard';e.timer=.5;this.moveEnemy(e,this.gathering?{x:e.spawnX,z:e.spawnZ}:this.waitingPost(e),dt,this.config.speed*1.65);continue;}
      const post={x:e.spawnX,z:e.spawnZ};
      if(e.state==='airborne')continue;
      if(e.state==='rushing'){this.moveEnemy(e,DOOR,dt,this.config.speed*1.35);if(distance(e,DOOR)<.45){e.state='boarding';e.boardProgress=0;e.face=Math.PI;}continue;}
      if(e.state==='boarding'){e.boardProgress+=dt/this.config.rivalBoardTime;if(e.boardProgress>=1)this.rivalTakesSeat(e);continue;}
      if(e.state==='down'){if(e.timer<=0){e.hp=e.maxHp*.65;e.x=e.spawnX;e.z=e.spawnZ;e.state='recover';e.timer=.65;e.y=0;e.vy=0;this.constrainActor(e);}continue;}
      if(e.state==='recover'){if(e.timer<=0){e.state='guard';e.heavy=false;e.timer=.15;}continue;}
      const weapon=weaponStats(e.weapon),reach=e.heavy?2.8:e.attackKind==='low'?2.5:e.role==='keeper'?1.9:weapon.reach*.78;
      if(!e.guardBroken&&this.elapsed-(e.lastGuardHit||0)>1.5)e.guard=Math.min(100,(e.guard??100)+dt*18);
      if(e.state==='windup'){
        if(e.timer<=0){const canHit=distance(p,e)<reach+.3&&distance(p,DOOR)<5.2;const result=canHit?this.hurtPlayer(this.config.damage*(e.heavy?1.6:e.role==='keeper'?1.15:weapon.enemyDamage),e):'miss';if(result!=='parried'){e.state='swing';e.timer=.23;}}
        continue;
      }
      if(e.state==='swing'){if(e.timer<=0){if(e.followUp){e.followUp=false;e.state='windup';e.timer=.42;}else{e.state='recover';e.timer=.85+this.random()*.5;}}continue;}
      // Hold the entrance until a boarding opportunity. Never pursue into the street.
      if(distance(e,post)>.12)this.moveEnemy(e,post,dt,this.config.speed);
      const d=distance(p,e),nearEntrance=distance(p,DOOR)<5.2;
      e.defending=this.mode!=='easy'&&['keeper','bruiser'].includes(e.role)&&e.guardBroken<=0&&e.state==='guard'&&!e.moving&&nearEntrance&&d<3.5&&(this.elapsed+e.id*.65)%4<1.25;
      if(nearEntrance&&distance(e,post)<1.35&&d<reach+.1&&e.timer<=0&&attacking<this.config.attackers){
        e.face=Math.atan2(p.x-e.x,p.z-e.z);e.state='windup';e.attacks=(e.attacks||0)+1;e.heavy=e.role==='keeper'&&e.attacks%3===0;e.attackKind=e.heavy?'heavy':e.role==='swinger'&&e.attacks%3===2?'low':e.attacks%2?'jab':'kick';e.defending=false;e.followUp=this.mode==='hard'&&e.role==='bruiser'&&e.attacks%2===0;e.timer=this.config.windup*weapon.windup*(e.heavy?1.65:e.attackKind==='low'?1.2:1);e.windupDuration=e.timer;attacking++;
      }else if(nearEntrance&&!e.moving)e.face=Math.atan2(p.x-e.x,p.z-e.z);
    }
    for(let i=0;i<this.enemies.length;i++){
      const a=this.enemies[i];if(['down','boarded','boarding','airborne'].includes(a.state))continue;
      for(let j=i+1;j<this.enemies.length;j++){const b=this.enemies[j];if(['down','boarded','boarding','airborne'].includes(b.state))continue;const d=distance(a,b);if(d<.78&&d>.01){const dx=(a.x-b.x)/d,dz=(a.z-b.z)/d,q=(.78-d)*.5;a.x+=dx*q;a.z+=dz*q;b.x-=dx*q;b.z-=dz*q;this.constrainActor(a);this.constrainActor(b);}}
      const d=distance(p,a);if(d<.64&&d>.01&&p.action!=='dodge'){p.x+=(p.x-a.x)/d*.025;p.z+=(p.z-a.z)/d*.025;this.constrainActor(p);}
    }
    if(this.combatActive&&!this.practice){this.raceClock=Math.max(0,this.raceClock-dt);if(!this.boardingRival&&this.raceClock===0){const rival=this.enemies.filter(e=>e.hp>0&&e.state==='guard'&&e.guardBroken<1).sort((a,b)=>distance(a,DOOR)-distance(b,DOOR))[0];if(rival){rival.state='rushing';rival.defending=false;rival.boardProgress=0;this.emit('rival-boarding',{id:rival.id});}}}
    this.nearDoor=distance(p,DOOR)<1.3;
    const gapOpen=this.combatActive&&!this.doorBlocked;this.doorCalled=gapOpen;
    if(gapOpen&&!this.gapWasOpen&&distance(p,DOOR)<4.5)this.emit('door-open');this.gapWasOpen=gapOpen;
    if(!this.practice&&input.board&&this.nearDoor&&gapOpen&&!['dodge','attack','shove','hitstun'].includes(p.action)){this.board+=dt/this.config.boardTime;if(p.action!=='block')p.action='boarding';}
    else this.board=Math.max(0,this.board-dt*2);
    if(p.hp<=0)this.finish('knocked-out');else if(this.board>=1)this.finish('won');
  }
  rivalTakesSeat(enemy){
    enemy.state='boarded';enemy.boardProgress=1;this.seatsLost++;this.board=0;this.combat.reset();
    this.bus.full=true;this.bus.phase='full';this.bus.duration=1.6;this.bus.remaining=1.6;this.bus.lastWasFull=true;
    for(const e of this.enemies)if(e!==enemy){e.state=e.hp>0?'guard':'down';e.timer=.5;e.y=0;e.vy=0;e.knockX=0;e.knockZ=0;e.defending=false;}
    this.emit('seat-stolen',{id:enemy.id});this.emit('message',{text:'A rival took the last seat! Keep your gear — stop them on the next trotro.'});
  }
  finish(result){
    if(this.status!=='playing')return;this.status=result;
    if(result==='won')this.score+=400+Math.ceil(Math.max(0,this.config.time-this.elapsed))*5+Math.ceil(this.player.hp)*4;
    this.stars=result==='won'?(this.player.hp>=70?3:this.player.hp>=35?2:1):0;this.emit('end',{result});
  }
}

export class HomeRun {
  constructor(mode='normal',startId='circle',random=Math.random,character=null){
    this.character=character?characterById(character):null;this.mode=mode;this.random=random;const start=Math.max(0,ARENAS.findIndex(a=>a.id===startId));this.route=[0,2,4].map(offset=>ARENAS[(start+offset)%ARENAS.length]);this.index=0;this.score=0;this.health=100;this.weapon=this.character?.item||null;this.kos=0;this.time=0;this.history=[];this.complete=false;this.canContinue=false;
  }
  get arena(){return this.route[this.index];}
  createRound(){this.round=new Round(this.mode,this.random,{character:this.character?.id,stage:this.index+1,health:this.health,weapon:this.weapon,startWaiting:true,firstBusFull:this.random()<MODES[this.mode].fullChance});return this.round;}
  record(round){
    if(round.status==='playing'||this.history.some(h=>h.stage===round.stage))return;
    this.score+=round.score;this.kos+=round.kos;this.time+=round.elapsed;this.health=round.player.hp;this.weapon=round.player.weapon;
    this.history.push({challenge:round.challenge.status==='won',bestChain:round.bestChain,stage:round.stage,arena:this.arena.id,result:round.status,score:round.score,stars:round.stars});
    this.complete=round.status==='won'&&this.index===2;this.canContinue=round.status==='won'&&!this.complete;
  }
  advance(){if(!this.canContinue)return null;this.index++;this.health=Math.min(100,this.health+(this.character?.heal||25));this.canContinue=false;return this.createRound();}
}
