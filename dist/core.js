export const MODES = {
  easy: {count:4,time:85,damage:8,speed:1.6,hp:48,gateHp:68,windup:1,attackers:2,boardTime:1.15,busWindow:34,fullChance:.35,description:'4 rivals to start. A little breathing room.'},
  normal: {count:6,time:75,damage:11,speed:1.95,hp:62,gateHp:88,windup:.8,attackers:2,boardTime:1.3,busWindow:30,fullChance:.45,description:'6 rivals to start. Break through the doorway crowd.'},
  hard: {count:8,time:65,damage:15,speed:2.3,hp:78,gateHp:112,windup:.64,attackers:3,boardTime:1.4,busWindow:26,fullChance:.55,description:'8 rivals to start. Three brutal rushes.'}
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
export const DOOR={x:5.05,z:-2.45};
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function constrain(a,busPresent=true){
  a.x=Math.max(-9.5,Math.min(9.5,a.x)); a.z=Math.max(-7.7,Math.min(8.7,a.z));
  // The bus is a solid obstacle. Resolve against the closest expanded edge.
  const minX=1.15,maxX=4.65,minZ=-7.15,maxZ=.15;
  if(busPresent&&a.x>minX&&a.x<maxX&&a.z>minZ&&a.z<maxZ){
    const edges=[{v:a.x-minX,k:'x',p:minX},{v:maxX-a.x,k:'x',p:maxX},{v:a.z-minZ,k:'z',p:minZ},{v:maxZ-a.z,k:'z',p:maxZ}].sort((u,v)=>u.v-v.v);
    a[edges[0].k]=edges[0].p;
  }
}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

export const BUS_TIMING={full:2.5,departing:1.5,waiting:3,arriving:1.5};
export class BusCycle {
  constructor({firstFull=false,window=30,fullChance=.4,random=Math.random}={}){
    this.random=random;this.window=window;this.fullChance=fullChance;this.number=1;this.full=firstFull;this.phase=firstFull?'full':'boarding';this.duration=firstFull?BUS_TIMING.full:window;this.remaining=this.duration;this.lastWasFull=firstFull;
  }
  get canBoard(){return this.phase==='boarding'&&!this.full;}
  get seats(){return this.full?0:1;}
  get progress(){return Math.max(0,Math.min(1,1-this.remaining/this.duration));}
  get arrivalIn(){return this.phase==='boarding'?0:this.remaining+(this.phase==='full'?BUS_TIMING.departing+BUS_TIMING.waiting+BUS_TIMING.arriving:this.phase==='departing'?BUS_TIMING.waiting+BUS_TIMING.arriving:this.phase==='waiting'?BUS_TIMING.arriving:0);}
  tick(dt){
    this.remaining=Math.max(0,this.remaining-dt);if(this.remaining>1e-8)return null;const from=this.phase;
    if(from==='full'||from==='boarding'){this.lastWasFull=this.full;this.phase='departing';}
    else if(from==='departing'){this.phase='waiting';}
    else if(from==='waiting'){this.number++;this.full=!this.lastWasFull&&this.random()<this.fullChance;this.phase='arriving';}
    else{this.phase=this.full?'full':'boarding';}
    this.duration=this.phase==='boarding'?this.window:BUS_TIMING[this.phase];this.remaining=this.duration;
    return{from,to:this.phase,number:this.number,full:this.full};
  }
}

export class Round {
  constructor(mode='normal',random=Math.random,options={}){
    this.mode=mode;this.random=random;this.stage=options.stage||1;
    const level=this.stage-1,base=MODES[mode];
    this.config={...base,count:base.count+level,hp:Math.round(base.hp*(1+level*.1)),gateHp:Math.round(base.gateHp*(1+level*.12)),speed:base.speed*(1+level*.06)};
    this.elapsed=0;this.status='playing';this.kos=0;this.score=0;this.board=0;this.combo=0;this.lastCombo=-10;this.events=[];this.doorCalled=false;this.hitsTaken=0;
    this.bus=new BusCycle({firstFull:!!options.firstBusFull,window:base.busWindow,fullChance:base.fullChance,random});
    this.player={x:0,z:5.8,hp:options.health??100,stamina:100,face:Math.PI,action:'idle',actionTime:0,cooldown:0,shoveCooldown:0,invulnerable:0,hurt:0,weapon:options.weapon===true?'bag':options.weapon||null,rest:0,dx:0,dz:-1,walk:0,blockTime:0};
    const posts=[{x:5.25,z:-1.15},{x:5.3,z:-3.8},{x:6.3,z:-2.5},{x:6.5,z:-.3},{x:6.5,z:-4.7},{x:7.5,z:-2.5},{x:8,z:-.7},{x:8,z:-4.1},{x:8.9,z:-2.5},{x:8.7,z:.8}];
    this.enemies=Array.from({length:this.config.count},(_,i)=>{
      const role=i===0?'keeper':i%3===1?'bruiser':i%3===2?'swinger':'jabber',post=posts[i%posts.length];
      const enemy={id:i,role,x:post.x,z:post.z,hp:i===0?this.config.gateHp:this.config.hp,maxHp:i===0?this.config.gateHp:this.config.hp,face:Math.PI*.2,state:'guard',timer:.5+random(),hurt:0,walk:random()*5,weapon:i===0?'suitcase':['umbrella','stool','bag','baton','suitcase'][(i-1)%5],spawnX:post.x,spawnZ:post.z};
      this.constrainActor(enemy);return enemy;
    });
    this.pickups=[{type:'bag',x:-2.7,z:3.4,used:options.weapon===true||options.weapon==='bag'},{type:'drink',x:-5,z:-3,used:false},{type:'drink',x:7.5,z:4.8,used:false},...([{type:'umbrella',x:-4,z:1},{type:'baton',x:-.7,z:3},{type:'stool',x:7,z:6.4},{type:'suitcase',x:-6,z:5.5}].map(item=>({...item,used:item.type===options.weapon})))];
  }
  get combatActive(){return this.bus.canBoard;}
  get busBlocksGround(){return this.bus.phase==='full'||this.bus.phase==='boarding'||(this.bus.phase==='arriving'&&this.bus.progress>.94)||(this.bus.phase==='departing'&&this.bus.progress<.12);}
  constrainActor(actor){constrain(actor,this.busBlocksGround);}
  waitingPost(enemy){return{x:6.7+(enemy.id%3)*1.1,z:3.6+Math.floor(enemy.id/3)*1.25};}
  busChanged(change){
    this.board=0;this.combo=0;this.doorCalled=false;if(this.player.action==='boarding')this.player.action='idle';
    if(change.to==='departing'||change.to==='boarding')for(const e of this.enemies){e.hp=e.maxHp;e.state='guard';e.hurt=0;e.timer=.5+this.random();}
    this.emit('bus-state',{phase:change.to,full:change.full,number:change.number});
    if(change.to==='departing')this.emit('message',{text:change.full?'This trotro is full. It is leaving. Wait for the next one.':'That trotro has left. Another one is on the way.'});
    else if(change.to==='arriving')this.emit('message',{text:'Another trotro is pulling in. Check for a free seat.'});
    else if(change.to==='full')this.emit('message',{text:'This one is full too. Save your strength for the next trotro.'});
    else if(change.to==='boarding')this.emit('message',{text:'One free seat! Clear the doorway and fight your way in.'});
  }
  get keeper(){return this.enemies.find(e=>e.role==='keeper');}
  get gateCleared(){return !this.keeper||this.keeper.state==='down';}
  get target(){return this.combatActive?(this.gateCleared?DOOR:this.keeper):null;}
  get blockers(){return this.enemies.filter(e=>e.state!=='down'&&e.state!=='recover'&&distance(e,DOOR)<1.85);}
  get doorBlocked(){return this.blockers.length>0;}
  emit(type,data={}){this.events.push({type,...data});}
  down(enemy){
    enemy.hp=0;enemy.state='down';enemy.timer=enemy.role==='keeper'?Infinity:8;this.kos++;
    this.score+=enemy.role==='keeper'?500:150;this.player.stamina=Math.min(100,this.player.stamina+12);
    this.emit('down',{x:enemy.x,z:enemy.z,keeper:enemy.role==='keeper'});
    if(enemy.role==='keeper'){
      this.doorCalled=true;this.emit('door-open');this.emit('message',{text:'Doorway rival down! Push the blockers aside, then hold E to enter.'});
    }
  }
  strikeEnemy(enemy,damage,push,stun){
    const p=this.player;enemy.hp-=damage;enemy.hurt=.26;
    let dx=enemy.x-p.x,dz=enemy.z-p.z,len=Math.hypot(dx,dz);if(len<.01){dx=Math.sin(p.face);dz=Math.cos(p.face);len=1;}
    enemy.x+=dx/len*push;enemy.z+=dz/len*push;this.constrainActor(enemy);enemy.state='recover';enemy.timer=stun;
    this.score+=10;this.emit('hit',{x:enemy.x,z:enemy.z,finish:push>1,damage});
    if(enemy.hp<=0)this.down(enemy);
  }
  attack(){
    const p=this.player,w=weaponStats(p.weapon);if(!this.combatActive||this.status!=='playing'||p.cooldown>0||p.action==='dodge'||p.action==='shove'||p.stamina<w.cost)return false;
    p.stamina-=w.cost;p.rest=.55;p.action='attack';p.actionTime=w.cooldown*.9;p.attackDuration=p.actionTime;p.cooldown=w.cooldown;
    const targets=this.enemies.filter(e=>e.state!=='down'&&distance(p,e)<w.reach).sort((a,b)=>distance(p,a)-distance(p,b));
    this.emit('swing');if(!targets.length){if(this.elapsed-this.lastCombo>1.05)this.combo=0;return true;}
    this.combo=this.elapsed-this.lastCombo<1.05?this.combo%3+1:1;this.lastCombo=this.elapsed;
    p.face=Math.atan2(targets[0].x-p.x,targets[0].z-p.z);const finish=this.combo===3;
    for(const enemy of targets.slice(0,w.targets))this.strikeEnemy(enemy,finish?w.finisher:w.damage,finish?w.push:.17,finish?1.35:.46);
    p.stamina=Math.min(100,p.stamina+2);this.emit('combo',{count:this.combo});return true;
  }
  shove(){
    const p=this.player;if(!this.combatActive||this.status!=='playing'||p.shoveCooldown>0||p.stamina<28||p.action==='dodge')return false;
    p.stamina-=28;p.rest=.7;p.shoveCooldown=4;p.action='shove';p.actionTime=.44;p.cooldown=.48;
    const targets=this.enemies.filter(e=>e.state!=='down'&&distance(p,e)<2.65).sort((a,b)=>distance(p,a)-distance(p,b));
    if(targets[0])p.face=Math.atan2(targets[0].x-p.x,targets[0].z-p.z);
    for(const enemy of targets.slice(0,4))this.strikeEnemy(enemy,12,2.35,2.2);
    this.emit('shove',{x:p.x,z:p.z});return true;
  }
  dodge(mx=0,mz=0){
    const p=this.player;if(this.status!=='playing'||p.stamina<19||p.action==='dodge'||p.action==='shove')return false;
    let len=Math.hypot(mx,mz);if(!len){mx=Math.sin(p.face);mz=Math.cos(p.face);len=1;}
    p.dx=mx/len;p.dz=mz/len;p.stamina-=19;p.rest=.5;p.invulnerable=.46;p.action='dodge';p.actionTime=.29;p.cooldown=.35;this.emit('dodge');return true;
  }
  pickup(){
    const p=this.player;if(this.status!=='playing')return;
    const item=this.pickups.find(a=>!a.used&&distance(p,a)<1.65);if(!item)return;
    if(WEAPONS[item.type]){p.weapon=item.type;this.combo=0;this.emit('message',{text:weaponStats(p.weapon).name+' equipped. '+weaponStats(p.weapon).trait+'.'});}
    else{p.hp=Math.min(100,p.hp+30);this.emit('message',{text:'+30 health. Get back to the doorway.'});}
    item.used=true;this.emit('pickup');
  }
  hurtPlayer(damage,enemy){
    const p=this.player;if(!this.combatActive)return 'waiting';if(p.invulnerable>0){if(p.action==='dodge'){this.score+=35;this.emit('evade');}return 'dodged';}
    if(p.action==='block'&&p.stamina>=5){
      if(p.blockTime<.2){p.stamina=Math.max(0,p.stamina-4);p.rest=.3;enemy.state='recover';enemy.timer=1.25;this.score+=75;this.emit('parry',{x:enemy.x,z:enemy.z});return 'parried';}
      p.stamina=Math.max(0,p.stamina-11);p.rest=.6;damage*=.12;this.emit('block');
    }else{this.emit('damage');p.invulnerable=.32;this.hitsTaken++;}
    p.hp=Math.max(0,p.hp-damage);p.hurt=.2;this.board=0;
    const len=distance(p,enemy)||1;p.x+=(p.x-enemy.x)/len*.16;p.z+=(p.z-enemy.z)/len*.16;this.constrainActor(p);return 'hit';
  }
  moveEnemy(enemy,goal,dt,pace){
    const d=distance(enemy,goal);if(d<.05)return;let waypoint=goal;
    const blocked=this.busBlocksGround&&Array.from({length:9},(_,i)=>{const t=(i+1)/10;return{x:enemy.x+(goal.x-enemy.x)*t,z:enemy.z+(goal.z-enemy.z)*t};}).some(a=>a.x>1&&a.x<4.8&&a.z>-7.3&&a.z<.3);
    if(blocked){const front=Math.abs(enemy.z-.9)+Math.abs(goal.z-.9)<Math.abs(enemy.z+7.6)+Math.abs(goal.z+7.6),lane=front?.9:-7.6;waypoint={x:(front&&enemy.z>-.05)||(!front&&enemy.z<-7.2)?goal.x:enemy.x,z:lane};}
    const length=distance(enemy,waypoint)||1;enemy.x+=(waypoint.x-enemy.x)/length*pace*dt;enemy.z+=(waypoint.z-enemy.z)/length*pace*dt;enemy.walk+=dt*8;enemy.moving=true;enemy.face=Math.atan2(waypoint.x-enemy.x,waypoint.z-enemy.z);this.constrainActor(enemy);
  }
  tick(dt,input={}){
    if(this.status!=='playing')return;dt=clamp(dt,0,.05);this.elapsed+=dt;const change=this.bus.tick(dt);if(change)this.busChanged(change);
    const p=this.player;p.cooldown=Math.max(0,p.cooldown-dt);p.shoveCooldown=Math.max(0,p.shoveCooldown-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);p.hurt=Math.max(0,p.hurt-dt);p.rest=Math.max(0,p.rest-dt);
    if(p.actionTime>0){p.actionTime-=dt;if(p.actionTime<=0)p.action='idle';}
    if(!['dodge','attack','shove'].includes(p.action)){
      if(input.block&&p.stamina>=5){if(p.action!=='block')p.blockTime=0;p.action='block';p.blockTime+=dt;}
      else{p.action='idle';p.blockTime=0;}
    }
    if(!p.rest&&p.action!=='block')p.stamina=Math.min(100,p.stamina+28*dt);
    if(this.combatActive&&input.attack&&p.cooldown===0)this.attack();
    const mx=input.x||0,mz=input.z||0,len=Math.hypot(mx,mz),speed=p.action==='block'?1.9:4.25;
    p.moving=len>.01;p.moveX=mx;p.moveZ=mz;
    if(p.action==='dodge'){p.x+=p.dx*12*dt;p.z+=p.dz*12*dt;}
    else if(len){const factor=p.action==='shove'?.4:1;p.x+=mx/Math.max(1,len)*speed*factor*dt;p.z+=mz/Math.max(1,len)*speed*factor*dt;if(p.action!=='attack')p.face=Math.atan2(mx,mz);p.walk+=dt*10;}
    this.constrainActor(p);
    let attacking=this.enemies.filter(e=>e.state==='windup'||e.state==='swing').length;
    for(const e of this.enemies){
      e.hurt=Math.max(0,e.hurt-dt);e.timer-=dt;e.moving=false;
      if(!this.combatActive){e.state='guard';e.timer=.5;this.moveEnemy(e,this.waitingPost(e),dt,this.config.speed*1.3);continue;}
      const post={x:e.spawnX,z:e.spawnZ};
      if(e.state==='down'){if(e.timer<=0){e.hp=e.maxHp*.65;e.x=e.spawnX;e.z=e.spawnZ;e.state='recover';e.timer=.65;this.constrainActor(e);}continue;}
      if(e.state==='recover'){if(e.timer<=0){e.state='guard';e.timer=.15;}continue;}
      const weapon=weaponStats(e.weapon),reach=e.role==='keeper'?1.9:weapon.reach*.78;
      if(e.state==='windup'){
        if(e.timer<=0){const canHit=distance(p,e)<reach+.3&&distance(p,DOOR)<5.2;const result=canHit?this.hurtPlayer(this.config.damage*(e.role==='keeper'?1.15:weapon.enemyDamage),e):'miss';if(result!=='parried'){e.state='swing';e.timer=.23;}}
        continue;
      }
      if(e.state==='swing'){if(e.timer<=0){e.state='recover';e.timer=.85+this.random()*.5;}continue;}
      // Every rival holds an assigned doorway post. No pursuit and no NPC boarding.
      if(distance(e,post)>.12)this.moveEnemy(e,post,dt,this.config.speed);
      const d=distance(p,e),nearEntrance=distance(p,DOOR)<5.2;
      if(nearEntrance&&distance(e,post)<1.35&&d<reach+.1&&e.timer<=0&&attacking<this.config.attackers){
        e.face=Math.atan2(p.x-e.x,p.z-e.z);e.state='windup';e.timer=this.config.windup*weapon.windup;attacking++;
      }else if(nearEntrance&&!e.moving)e.face=Math.atan2(p.x-e.x,p.z-e.z);
    }
    for(let i=0;i<this.enemies.length;i++){
      const a=this.enemies[i];if(a.state==='down')continue;
      for(let j=i+1;j<this.enemies.length;j++){const b=this.enemies[j];if(b.state==='down')continue;const d=distance(a,b);if(d<.78&&d>.01){const dx=(a.x-b.x)/d,dz=(a.z-b.z)/d,q=(.78-d)*.5;a.x+=dx*q;a.z+=dz*q;b.x-=dx*q;b.z-=dz*q;this.constrainActor(a);this.constrainActor(b);}}
      const d=distance(p,a);if(d<.64&&d>.01&&p.action!=='dodge'){p.x+=(p.x-a.x)/d*.025;p.z+=(p.z-a.z)/d*.025;this.constrainActor(p);}
    }
    this.nearDoor=distance(p,DOOR)<1.65;
    if(input.board&&this.nearDoor&&this.combatActive&&this.gateCleared&&!this.doorBlocked&&!['dodge','attack','shove'].includes(p.action)){this.board+=dt/this.config.boardTime;if(p.action!=='block')p.action='boarding';}
    else this.board=Math.max(0,this.board-dt*2);
    if(p.hp<=0)this.finish('knocked-out');else if(this.elapsed>=this.config.time)this.finish('missed');else if(this.board>=1)this.finish('won');
  }
  finish(result){
    if(this.status!=='playing')return;this.status=result;
    if(result==='won')this.score+=400+Math.ceil(this.config.time-this.elapsed)*5+Math.ceil(this.player.hp)*4;
    this.stars=result==='won'?(this.player.hp>=70?3:this.player.hp>=35?2:1):0;this.emit('end',{result});
  }
}

export class HomeRun {
  constructor(mode='normal',startId='circle',random=Math.random){
    this.mode=mode;this.random=random;const start=Math.max(0,ARENAS.findIndex(a=>a.id===startId));this.route=[0,2,4].map(offset=>ARENAS[(start+offset)%ARENAS.length]);this.index=0;this.score=0;this.health=100;this.weapon=null;this.kos=0;this.time=0;this.history=[];this.complete=false;this.canContinue=false;
  }
  get arena(){return this.route[this.index];}
  createRound(){this.round=new Round(this.mode,this.random,{stage:this.index+1,health:this.health,weapon:this.weapon,firstBusFull:this.random()<MODES[this.mode].fullChance});return this.round;}
  record(round){
    if(round.status==='playing'||this.history.some(h=>h.stage===round.stage))return;
    this.score+=round.score;this.kos+=round.kos;this.time+=round.elapsed;this.health=round.player.hp;this.weapon=round.player.weapon;
    this.history.push({stage:round.stage,arena:this.arena.id,result:round.status,score:round.score,stars:round.stars});
    this.complete=round.status==='won'&&this.index===2;this.canContinue=round.status==='won'&&!this.complete;
  }
  advance(){if(!this.canContinue)return null;this.index++;this.health=Math.min(100,this.health+25);this.canContinue=false;return this.createRound();}
}
