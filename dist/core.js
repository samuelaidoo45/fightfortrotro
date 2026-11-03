export const MODES = {
  easy: {count:4,time:95,damage:8,speed:1.55,hp:60,windup:.95,description:'4 rivals. 95 seconds. Room to learn the ropes.'},
  normal: {count:6,time:75,damage:12,speed:1.95,hp:80,windup:.72,description:'6 rivals. 75 seconds. A proper evening rush.'},
  hard: {count:9,time:60,damage:17,speed:2.3,hp:100,windup:.5,description:'9 rivals. 60 seconds. Accra is not playing.'}
};
export const ARENAS = [
  {id:'circle',name:'Circle',subtitle:'The evening scramble',description:'Under the flyover. In the middle of everything.',query:'Kwame Nkrumah Circle trotro station Accra',color:0xc6c1ac,sky:0xc3d5d8,accent:0x397e8d,route:'CIRCLE  —  MADINA',feature:'flyover'},
  {id:'kaneshie',name:'Kaneshie',subtitle:'Market-day mayhem',description:'Market stalls, tight corners, and one very busy door.',query:'Kaneshie Market trotro station Accra',color:0xceac85,sky:0xc8d1cb,accent:0xc7783c,route:'KANESHIE  —  ACCRA',feature:'market'},
  {id:'madina',name:'Madina',subtitle:'The market rush',description:'A lively market, colourful awnings, and a crowd with plans.',query:'Madina trotro station Accra',color:0xb9aa9b,sky:0xc1c8d2,accent:0x71678a,route:'MADINA  —  CIRCLE',feature:'market'},
  {id:'37',name:'37 Station',subtitle:'The roadside showdown',description:'A leafy roadside. A short wait. A sudden rush.',query:'37 Military Hospital trotro station Accra',color:0xb5bf9b,sky:0xc2d4d2,accent:0x578d78,route:'37  —  MADINA',feature:'trees'},
  {id:'lapaz',name:'Lapaz',subtitle:'Rush-hour pressure',description:'The roadside strip gets crowded. Keep a way out.',query:'Lapaz trotro station Accra',color:0xc3b298,sky:0xc8d6dd,accent:0x3e789b,route:'LAPAZ  —  CIRCLE',feature:'strip'},
  {id:'tema',name:'Tema Station',subtitle:'The last departure',description:'A busy central yard, parked trotros, and a narrow escape.',query:'Tema Station Accra trotro',color:0xc7b8a2,sky:0xd4d1bf,accent:0x41868a,route:'ACCRA  —  TEMA',feature:'yard'}
];
export const DOOR={x:5.05,z:-2.45};
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function constrain(a){
  a.x=Math.max(-9.5,Math.min(9.5,a.x)); a.z=Math.max(-7.7,Math.min(8.7,a.z));
  // The bus is a solid obstacle. Resolve against the closest expanded edge.
  const minX=1.15,maxX=4.65,minZ=-7.15,maxZ=.15;
  if(a.x>minX&&a.x<maxX&&a.z>minZ&&a.z<maxZ){
    const edges=[{v:a.x-minX,k:'x',p:minX},{v:maxX-a.x,k:'x',p:maxX},{v:a.z-minZ,k:'z',p:minZ},{v:maxZ-a.z,k:'z',p:maxZ}].sort((u,v)=>u.v-v.v);
    a[edges[0].k]=edges[0].p;
  }
}
export class Round {
  constructor(mode='normal',random=Math.random){
    this.mode=mode;this.config=MODES[mode];this.random=random;this.elapsed=0;this.status='playing';this.kos=0;this.board=0;this.lastCombo=-10;this.combo=0;this.events=[];this.doorCalled=false;
    this.player={x:0,z:5.8,hp:100,stamina:100,face:Math.PI,action:'idle',actionTime:0,cooldown:0,invulnerable:0,hurt:0,weapon:false,rest:0,dx:0,dz:-1,walk:0};
    this.enemies=Array.from({length:this.config.count},(_,i)=>{const angle=i/this.config.count*Math.PI*2;const a={id:i,x:Math.cos(angle)*5,z:2.3+Math.sin(angle)*4.3,hp:this.config.hp,maxHp:this.config.hp,face:0,state:'chase',timer:.5+random(),hurt:0,walk:random()*5,weapon:i%3};constrain(a);return a;});
    this.pickups=[{type:'bag',x:-3.8,z:2.7,used:false},{type:'drink',x:-5,z:-3,used:false},{type:'drink',x:7.5,z:4,used:false}];
  }
  emit(type,data={}){this.events.push({type,...data});}
  attack(){
    const p=this.player;if(this.status!=='playing'||p.cooldown>0||p.action==='dodge')return;
    if(p.stamina<11){this.emit('message',{text:'Catch your breath. Let stamina recover.'});return;}
    p.stamina-=11;p.rest=1;p.action='attack';p.actionTime=.32;p.cooldown=.34;
    this.combo=this.elapsed-this.lastCombo<1?this.combo%3+1:1;this.lastCombo=this.elapsed;
    const targets=this.enemies.filter(e=>e.state!=='down'&&distance(p,e)<(p.weapon?2.65:2.15)).sort((a,b)=>distance(p,a)-distance(p,b));
    if(targets[0])p.face=Math.atan2(targets[0].x-p.x,targets[0].z-p.z);
    this.emit('swing');let hit=0;
    for(const e of targets.slice(0,p.weapon?2:1)){
      const finish=this.combo===3;e.hp-=p.weapon?29:finish?27:20;e.hurt=.25;
      const len=distance(p,e)||1;const push=finish?2.15:.7;e.x+=(e.x-p.x)/len*push;e.z+=(e.z-p.z)/len*push;constrain(e);
      e.state='recover';e.timer=finish?1.3:.6;hit++;this.emit('hit',{x:e.x,z:e.z,finish});
      if(e.hp<=0){e.state='down';e.timer=7;this.kos++;this.emit('down');}
    }
    if(hit)this.emit('combo',{count:this.combo});
  }
  dodge(mx=0,mz=0){
    const p=this.player;if(this.status!=='playing'||p.stamina<23||p.cooldown>.2||p.action==='dodge')return;
    let len=Math.hypot(mx,mz);if(!len){mx=Math.sin(p.face);mz=Math.cos(p.face);len=1;}
    p.dx=mx/len;p.dz=mz/len;p.stamina-=23;p.rest=.8;p.invulnerable=.48;p.action='dodge';p.actionTime=.32;p.cooldown=.48;this.emit('dodge');
  }
  pickup(){
    const p=this.player;if(this.status!=='playing')return;
    const item=this.pickups.find(a=>!a.used&&distance(p,a)<1.8);
    if(!item)return;
    if(item.type==='bag'){p.weapon=true;this.emit('message',{text:'Bag equipped. Wider swings. More space.'});}
    else{p.hp=Math.min(100,p.hp+30);this.emit('message',{text:'A quick drink. +30 health.'});}
    item.used=true;this.emit('pickup');
  }
  hurtPlayer(damage,enemy){
    const p=this.player;if(p.invulnerable>0)return;
    if(p.action==='block'&&p.stamina>8){p.stamina=Math.max(0,p.stamina-15);p.rest=.8;damage*=.14;this.emit('block');}
    else{this.emit('damage');p.invulnerable=.3;}
    p.hp=Math.max(0,p.hp-damage);p.hurt=.22;this.board=0;
    const len=distance(p,enemy)||1;p.x+=(p.x-enemy.x)/len*.38;p.z+=(p.z-enemy.z)/len*.38;constrain(p);
  }
  tick(dt,input={}){
    if(this.status!=='playing')return;dt=Math.min(.05,Math.max(0,dt));this.elapsed+=dt;
    const p=this.player;p.cooldown=Math.max(0,p.cooldown-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);p.hurt=Math.max(0,p.hurt-dt);p.rest=Math.max(0,p.rest-dt);
    if(p.actionTime>0){p.actionTime-=dt;if(p.actionTime<=0)p.action='idle';}
    if(p.action!=='dodge'&&p.action!=='attack')p.action=input.block&&p.stamina>5?'block':'idle';
    if(!p.rest&&p.action!=='block')p.stamina=Math.min(100,p.stamina+25*dt);
    const mx=input.x||0,mz=input.z||0,len=Math.hypot(mx,mz),speed=p.action==='block'?1.7:3.9;
    if(p.action==='dodge'){p.x+=p.dx*12*dt;p.z+=p.dz*12*dt;}
    else if(len){p.x+=mx/Math.max(1,len)*speed*dt;p.z+=mz/Math.max(1,len)*speed*dt;if(p.action!=='attack')p.face=Math.atan2(mx,mz);p.walk+=dt*10;}
    constrain(p);
    for(const e of this.enemies){
      e.hurt=Math.max(0,e.hurt-dt);e.timer-=dt;
      if(e.state==='down'){if(e.timer<=0){e.hp=e.maxHp*.7;e.state='recover';e.timer=1;}continue;}
      e.face=Math.atan2(p.x-e.x,p.z-e.z);
      if(e.state==='windup'&&e.timer<=0){if(distance(p,e)<2.05)this.hurtPlayer(this.config.damage*(e.weapon===1?1.2:1),e);e.state='swing';e.timer=.22;}
      else if(e.state==='swing'&&e.timer<=0){e.state='recover';e.timer=1.05+this.random()*.6;}
      else if(e.state==='recover'&&e.timer<=0){e.state='chase';e.timer=.15;}
      else if(e.state==='chase'){
        const d=distance(p,e);
        if(d>1.5){
          let goal=p;
          // Route around either end of the solid bus when it blocks pursuit.
          const crosses=Array.from({length:9},(_,i)=>{const t=(i+1)/10;return{x:e.x+(p.x-e.x)*t,z:e.z+(p.z-e.z)*t};}).some(a=>a.x>1&&a.x<4.8&&a.z>-7.3&&a.z<.3);
          if(crosses){const laneZ=(Math.abs(e.z-.9)+Math.abs(p.z-.9))<(Math.abs(e.z+7.6)+Math.abs(p.z+7.6))?.9:-7.6;goal={x:e.z>-.05&&laneZ===.9||e.z<-7.2&&laneZ===-7.6?p.x:e.x,z:laneZ};}
          const length=distance(e,goal)||1,pace=this.config.speed*(e.weapon===2?.94:1);e.x+=(goal.x-e.x)/length*pace*dt;e.z+=(goal.z-e.z)/length*pace*dt;e.walk+=dt*8;
        }
        if(d<1.9&&e.timer<=0){e.state='windup';e.timer=this.config.windup;}
      }
      constrain(e);
    }
    // Soft separation keeps crowds physical without locking the player in place.
    for(let i=0;i<this.enemies.length;i++){
      const e=this.enemies[i];if(e.state==='down')continue;
      for(let j=i+1;j<this.enemies.length;j++){const b=this.enemies[j];if(b.state==='down')continue;const d=distance(e,b);if(d<.85&&d>.01){const q=(.85-d)*.5;e.x+=(e.x-b.x)/d*q;e.z+=(e.z-b.z)/d*q;b.x-=(e.x-b.x)/d*q;b.z-=(e.z-b.z)/d*q;constrain(e);constrain(b);}}
      const d=distance(p,e);if(d<.72&&d>.01&&p.action!=='dodge'){p.x+=(p.x-e.x)/d*.025;p.z+=(p.z-e.z)/d*.025;constrain(p);}
    }
    if(this.elapsed>=8&&!this.doorCalled){this.doorCalled=true;this.emit('message',{text:'Mate: “One more! One more!” The door is open.'});}
    this.nearDoor=distance(p,DOOR)<1.7;
    if(input.board&&this.nearDoor&&this.doorCalled&&p.action!=='dodge'&&p.action!=='attack'){
      this.board+=dt/1.6;
    }else this.board=Math.max(0,this.board-dt*2);
    if(p.hp<=0)this.finish('knocked-out');
    else if(this.elapsed>=this.config.time)this.finish('missed');
    else if(this.board>=1)this.finish('won');
  }
  finish(result){if(this.status!=='playing')return;this.status=result;this.emit('end',{result});}
}
