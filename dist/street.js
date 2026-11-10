const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const DARES=[
  {kind:'trick',title:'Make some trouble',hint:'R near the trolley or cooler. Catch a rival in the trick.',goal:1},
  {kind:'throw',title:'Special delivery',hint:'Get close and O to throw a rival.',goal:1},
  {kind:'variety',title:'Show us something new',hint:'Connect 3 different attacks. Repeated jabs count once.',goal:3},
  {kind:'defence',title:'You missed!',hint:'Time K to parry, or L / Space through a live swing.',goal:1},
  {kind:'finisher',title:'Finish with style',hint:'Connect J → J → I or J → U → U.',goal:1}
];

// Small, physical opportunities that work alongside combat, not another timer to survive.
export class StreetPlay {
  constructor(round){
    this.round=round;this.wins=0;this.streak=0;this.index=(round.stage-1)%DARES.length;this.time=22;this.intermission=0;this.progress=0;this.moves=new Set();this.comeback=false;
    this.props=round.practice?[]:[
      {id:'trolley',name:'Kick the trolley',x:2.4,z:-1.3,homeX:2.4,homeZ:-1.3,state:'ready',time:0,hits:new Set()},
      {id:'cooler',name:'Spill the cooler',x:-4.1,z:-2.3,homeX:-4.1,homeZ:-2.3,state:'ready',time:0,hits:new Set()}
    ];
  }
  get dare(){return DARES[this.index%DARES.length];}
  get nearby(){return this.round.combatActive?this.props.find(p=>p.state==='ready'&&distance(p,this.round.player)<1.8):null;}
  record(kind,move){
    const r=this.round;if(r.practice||!r.combatActive||r.status!=='playing'||this.intermission>0)return;
    if(this.dare.kind==='variety'&&kind==='move'){
      this.moves.add(['jab','cross'].includes(move)?'hands':move);this.progress=this.moves.size;
    }else if(kind===this.dare.kind)this.progress++;
    if(this.progress<this.dare.goal)return;
    this.wins++;this.streak++;const points=150*Math.min(3,this.streak);r.score+=points;r.player.hp=Math.min(100,r.player.hp+10);r.gainMomentum(20);r.player.stamina=100;this.intermission=3;
    r.emit('dare-won',{text:`CROWD LOVES IT! +${points} · +10 health · +20 special`,wins:this.wins});
  }
  activate(){
    const r=this.round,p=r.player,prop=this.nearby;
    if(!prop||!r.combat.neutral()||p.stamina<10)return false;
    p.stamina-=10;p.rest=.4;p.action='shove';p.actionTime=.35;p.cooldown=.4;prop.hits.clear();
    if(prop.id==='trolley'){
      const target=r.enemies.filter(e=>e.hp>0&&e.state!=='boarded').sort((a,b)=>distance(a,prop)-distance(b,prop))[0];
      const dx=(target?.x??-.98)-prop.x,dz=(target?.z??-4.15)-prop.z,len=Math.hypot(dx,dz)||1;
      prop.dx=dx/len;prop.dz=dz/len;prop.state='rolling';prop.time=1.35;p.face=Math.atan2(prop.dx,prop.dz);
    }else{prop.state='spill';prop.time=7;p.face=Math.atan2(prop.x-p.x,prop.z-p.z);}
    r.emit('street-trick',{x:prop.x,z:prop.z,text:prop.id==='trolley'?'SPECIAL DELIVERY!':'WATCH YOUR STEP!'});return true;
  }
  resetProps(){for(const p of this.props)if(p.state==='spent'){p.state='ready';p.x=p.homeX;p.z=p.homeZ;p.hits.clear();}}
  tick(dt){
    const r=this.round;if(r.practice)return;
    if(r.combatActive){
      if(this.intermission>0){this.intermission=Math.max(0,this.intermission-dt);if(!this.intermission)this.next();}
      else{this.time=Math.max(0,this.time-dt);if(!this.time){this.streak=0;this.next();}}
      if(!this.comeback&&r.player.hp>0&&r.player.hp<=25){this.comeback=true;r.momentum=100;r.player.stamina=100;r.player.invulnerable=Math.max(1.3,r.player.invulnerable);r.emit('comeback',{text:'NOT TODAY! Special charged — get close and press Q.'});}
    }
    for(const prop of this.props){
      if(!['rolling','spill'].includes(prop.state))continue;
      prop.time-=dt;
      if(prop.state==='rolling'){prop.x+=prop.dx*8*dt;prop.z+=prop.dz*8*dt;if(prop.z<-4.15){prop.z=-4.15;prop.dz=0;}}
      if(r.combatActive)for(const enemy of r.enemies){
        if(enemy.hp<=0||enemy.state==='boarded'||(enemy.y||0)>.4||prop.hits.has(enemy.id)||distance(prop,enemy)>(prop.state==='spill'?2.3:1))continue;
        prop.hits.add(enemy.id);r.strikeEnemy(enemy,prop.state==='spill'?14:42,prop.state==='spill'?.15:1.5,prop.state==='spill'?2.3:1.7,{smooth:true,move:'street',trip:true});
        if(prop.hits.size===1){this.record('trick');r.stylish('street');r.gainMomentum(12);}
        r.emit('street-hit',{x:enemy.x,z:enemy.z,text:prop.state==='spill'?'SLIP!':'TROLLEY STRIKE!'});
      }
      if(prop.time<=0||Math.abs(prop.x)>9.5){prop.state='spent';prop.time=0;}
    }
  }
  next(){this.index++;this.time=22;this.progress=0;this.moves.clear();}
}
