const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const COMBO_ROUTES=[
  {keys:'J J I',name:'Circle Uppercut',detail:'Launch, then J or U to juggle.',sequence:['light','light','heavy'],move:'uppercut'},
  {keys:'J U U',name:'Roundabout',detail:'A spinning kick clears nearby blockers.',sequence:['light','kick','kick'],move:'spin'},
  {keys:'U J I',name:'Last Stop',detail:'Drive through the guard with a shoulder finish.',sequence:['kick','light','heavy'],move:'rush'}
];
export const MOVES={
  jab:{name:'Jab',startup:.09,total:.34,cancel:.17,cost:7,damage:14,reach:2.05,push:.08,stun:.42,guard:14,targets:1},
  cross:{name:'Cross',startup:.11,total:.37,cancel:.19,cost:7,damage:16,reach:2.15,push:.1,stun:.46,guard:17,targets:1},
  heavy:{name:'Heavy cross',startup:.28,total:.76,cancel:.55,cost:17,damage:30,reach:2.2,push:.75,stun:.8,guard:58,targets:1},
  kick:{name:'Roundhouse',startup:.18,total:.58,cancel:.30,cost:13,damage:24,reach:2.65,push:.25,stun:.55,guard:28,targets:1},
  uppercut:{name:'Circle Uppercut',startup:.17,total:.65,cancel:.29,cost:18,damage:36,reach:2.55,push:.12,stun:1.2,guard:100,targets:1,launch:5.8,finisher:true},
  spin:{name:'Roundabout',startup:.24,total:.84,cancel:.68,cost:22,damage:38,reach:3.15,push:2.8,stun:1.8,guard:85,targets:3,trip:true,finisher:true,arc:Math.PI},
  rush:{name:'Last Stop',startup:.22,total:.78,cancel:.62,cost:23,damage:42,reach:2.6,push:3.15,stun:1.7,guard:110,targets:2,lunge:1.1,trip:true,finisher:true},
  sweep:{name:'Low Sweep',startup:.23,total:.72,cancel:.58,cost:14,damage:18,reach:2.35,push:.25,stun:1.55,guard:0,targets:2,low:true,trip:true},
  knee:{name:'Flying Knee',startup:.21,total:.7,cancel:.51,cost:17,damage:29,reach:2.55,push:.6,stun:.85,guard:38,targets:1,lunge:.85},
  throw:{name:'Trotro Toss',startup:.2,total:.94,cancel:.8,cost:20,damage:27,reach:1.7,push:2.5,stun:1.6,guard:0,targets:1,throw:true,launch:3.4},
  special:{name:'Last Seat Special',startup:.22,total:1.48,cancel:1.48,cost:0,damage:18,reach:3.2,push:.05,stun:.7,guard:120,targets:1,finisher:true,hits:[.22,.58,1.02]}
};

// Owns startup, contact, recovery, input buffering and confirmed combo branches.
export class CombatSystem {
  constructor(round){this.round=round;this.active=null;this.queue=[];this.history=[];this.trail=[];this.targetId=null;this.lastContact=-10;this.moveName='Ready';this.moveUntil=0;}
  get target(){
    const r=this.round,p=r.player;
    const candidates=r.enemies.filter(e=>e.hp>0&&e.state!=='boarded'&&dist(p,e)<6);
    if(r.boardingRival&&dist(p,r.boardingRival)<5&&(this.manualUntil||0)<r.elapsed)return r.boardingRival;
    return candidates.find(e=>e.id===this.targetId)||candidates.sort((a,b)=>dist(p,a)-dist(p,b))[0]||null;
  }
  cycleTarget(){const list=this.round.enemies.filter(e=>e.hp>0&&e.state!=='boarded'&&dist(e,this.round.player)<6).sort((a,b)=>a.id-b.id);if(!list.length)return;const index=list.findIndex(e=>e.id===this.target?.id);this.targetId=list[(index+1)%list.length].id;this.manualUntil=this.round.elapsed+4;}
  reset(){this.active=null;this.queue=[];this.history=[];this.trail=[];this.lastContact=-10;this.round.player.moveId=null;this.round.player.cooldown=0;this.round.player.actionTime=0;this.round.player.action='idle';}
  interrupted(){this.reset();this.round.combo=0;this.round.comboDamage=0;}
  neutral(){const p=this.round.player;return !this.active&&!['dodge','shove','hitstun'].includes(p.action)&&p.cooldown<=0;}
  press(kind='light',direction=0){
    const r=this.round;if(!r.combatActive||r.status!=='playing'||!['light','heavy','kick','grab'].includes(kind))return false;
    this.trail.push({key:kind==='light'?'J':kind==='heavy'?'I':kind==='grab'?'O':direction<0?'S+U':direction>0?'W+U':'U',time:r.elapsed});this.trail=this.trail.slice(-6);
    const input={kind,direction,expires:r.elapsed+1.25};
    if(this.neutral())return this.start(input);
    if(r.player.action==='hitstun'||this.queue.length>=2)return false;
    this.queue.push(input);return true;
  }
  choose(input){
    const r=this.round;
    if(input.kind==='grab')return 'throw';
    if(input.kind==='kick'&&input.direction)return input.direction<0?'sweep':'knee';
    if(input.kind==='heavy'&&r.player.counterTime>0)return 'uppercut';
    const sequence=[...this.history,input.kind].slice(-3);
    const route=COMBO_ROUTES.find(c=>c.sequence.every((k,i)=>sequence[i]===k));if(route)return route.move;
    return input.kind==='light'?(this.history.at(-1)==='light'?'cross':'jab'):input.kind;
  }
  start(input,special=false){
    const r=this.round,p=r.player,w=r.weapon;
    if(r.elapsed-this.lastContact>1.15)this.history=[];
    const id=special?'special':this.choose(input),base=MOVES[id];
    const weaponStrike=['jab','cross','heavy'].includes(id),pace=weaponStrike?clamp(w.cooldown/.3,.85,1.45):1;
    const move={...base,id,startup:base.startup*pace,total:base.total*pace,cancel:base.cancel*pace,
      cost:weaponStrike?Math.round(base.cost+w.cost*.25):base.cost,
      damage:weaponStrike?Math.round(base.damage*w.damage/22):base.damage,
      reach:weaponStrike?w.reach+(id==='heavy'?.15:0):base.reach,
      targets:weaponStrike?w.targets:base.targets};
    if(weaponStrike)move.damage=Math.round(move.damage*r.bonuses.damage);if(id==='throw')move.damage=Math.round(move.damage*(r.condition?.throws||1));
    if(weaponStrike)move.cost=Math.round(move.cost*(r.character?.cost||1));if(['kick','sweep','knee','spin'].includes(id))move.damage=Math.round(move.damage*(r.character?.kick||1));
    if(p.stamina<move.cost){r.emit('combat-note',{text:'Need stamina — create some space.'});return false;}
    const target=this.target;if(target){this.targetId=target.id;p.face=Math.atan2(target.x-p.x,target.z-p.z);}
    p.stamina-=move.cost;p.rest=.65;p.action='attack';p.actionTime=move.total;p.attackDuration=move.total;p.cooldown=move.total;p.moveId=id;p.movePhase=0;p.moveStartup=move.startup/move.total;p.counterStrike=p.counterTime>0;p.counterTime=0;
    if(p.counterStrike)move.damage=Math.round(move.damage*1.35);
    r.board=0;this.active={move,input,elapsed:0,hitIndex:0,confirmed:false,targetId:target?.id,lunge:0};
    this.moveName=move.name;this.moveUntil=r.elapsed+1.6;r.emit('move',{name:move.name,id,finisher:!!move.finisher});r.emit('swing',{move:id});
    return true;
  }
  special(){
    const r=this.round,p=r.player;if(!r.combatActive||r.status!=='playing'||r.momentum<100||this.active?.move.id==='special')return false;
    if(!this.target||dist(this.target,p)>3.5){r.emit('combat-note',{text:'Get closer to a rival to use your special.'});return false;}
    this.reset();r.momentum=0;p.stamina=100;p.invulnerable=1.6;r.rushTime=3;this.start({kind:'special',direction:0},true);r.emit('special',{x:p.x,z:p.z});return true;
  }
  tick(dt){
    const r=this.round,p=r.player;p.counterTime=Math.max(0,(p.counterTime||0)-dt);
    this.queue=this.queue.filter(q=>q.expires>=r.elapsed);this.trail=this.trail.filter(i=>r.elapsed-i.time<3);
    if(r.elapsed-this.lastContact>1.15)this.history=[];
    const a=this.active;
    if(a){
      a.elapsed+=dt;p.movePhase=clamp(a.elapsed/a.move.total,0,1);p.moveId=a.move.id;
      if(a.move.lunge&&a.elapsed<a.move.startup){const step=Math.min(a.move.lunge-a.lunge,a.move.lunge*dt/a.move.startup);p.x+=Math.sin(p.face)*step;p.z+=Math.cos(p.face)*step;a.lunge+=step;r.constrainActor(p);}
      const times=a.move.hits||[a.move.startup];
      while(a.hitIndex<times.length&&a.elapsed>=times[a.hitIndex]){this.contact(a,a.hitIndex);a.hitIndex++;}
      const canCancel=a.confirmed&&a.elapsed>=a.move.cancel&&a.move.id!=='special';
      if(a.elapsed>=a.move.total||(canCancel&&this.queue.length)){
        this.active=null;p.cooldown=0;p.actionTime=0;p.action='idle';p.moveId=null;
        if(!a.confirmed)this.history=[];
        if(this.queue.length)this.start(this.queue.shift());
      }
    }else if(this.queue.length&&this.neutral())this.start(this.queue.shift());
  }
  contact(a,index){
    const r=this.round,p=r.player,move={...a.move},special=move.id==='special',last=special&&index===2;
    if(special){move.damage=[13,17,32][index];move.reach=last?3.8:3.3;move.targets=last?5:1;move.push=last?3.2:.03;move.stun=last?2.4:.7;move.launch=last?4.2:undefined;move.arc=last?Math.PI:1.6;}
    const candidates=r.enemies.filter(e=>e.hp>0&&e.state!=='boarded'&&dist(p,e)<move.reach&&(e.y||0)<2.1).filter(e=>{
      const angle=Math.atan2(e.x-p.x,e.z-p.z)-p.face;return Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<=(move.arc||1.2);
    }).sort((x,y)=>(x.id===a.targetId?-1:y.id===a.targetId?1:dist(p,x)-dist(p,y)));
    let connected=false,damageTotal=0;
    for(const e of candidates.slice(0,move.targets)){
      const guarding=e.defending&&e.state==='guard'&&!move.low&&!move.throw;
      let damage=move.damage;
      if(guarding){
        e.guard=Math.max(0,(e.guard??100)-move.guard);e.lastGuardHit=r.elapsed;
        if(e.guard>0){e.hp=Math.max(1,e.hp-Math.max(1,Math.round(damage*.08)));r.emit('guard-hit',{x:e.x,z:e.z});continue;}
        e.guardBroken=3;e.defending=false;damage=Math.round(damage*.65);move.stun=Math.max(move.stun,1.65);r.emit('guard-break',{x:e.x,z:e.z});
      }
      const aerial=(e.y||0)>.05;if(aerial)damage=Math.round(damage*Math.max(.45,.78**(e.juggleHits||0)));
      if(!a.counterRewarded&&p.counterStrike){a.counterRewarded=true;p.hp=Math.min(100,p.hp+r.bonuses.counterHeal);r.stylish('counter');}
      const before=e.hp;r.strikeEnemy(e,damage,move.push,move.stun,{smooth:true,move:move.id,finisher:!!move.finisher,air:aerial,trip:move.trip});damageTotal+=Math.min(before,before-e.hp);connected=true;
      if(move.launch||aerial){
        e.juggleHits=aerial?(e.juggleHits||0)+1:0;
        e.y=Math.max(.06,e.y||0);e.vy=e.juggleHits>=3?-2:move.launch||Math.max(e.vy||0,3.2);
        if(e.hp>0)e.state='airborne';e.airStyle=move.throw?'throw':'launch';
        if(!aerial)r.emit('launch',{x:e.x,z:e.z});
      }
      if(move.trip)e.tripTime=move.stun;
    }
    if(connected){
      if(!a.confirmed){
        this.history=a.move.finisher?[]:[...this.history,a.input.kind].slice(-2);
        r.coach.hit=true;r.stylish(move.id);if(a.move.finisher){r.finisherReward();r.progressChallenge('finisher');r.emit('finisher',{name:move.name,move:move.id});}
      }
      a.confirmed=true;this.lastContact=r.elapsed;r.lastCombo=r.elapsed;r.combo++;
      r.chain++;r.bestChain=Math.max(r.bestChain,r.chain);r.chainTime=3.5;r.comboDamage=(r.comboDamage||0)+damageTotal;r.gainMomentum(move.finisher?17:8);p.stamina=Math.min(100,p.stamina+2);
      r.emit('combo',{count:r.chain,damage:r.comboDamage,aerial:candidates.some(e=>(e.y||0)>.05),move:move.name});
    }else if(!special){this.history=[];r.combo=0;}
  }
}
