import {WINDOW} from './layout.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

export class WindowBoarding {
  constructor(round){this.round=round;this.active=null;this.distracted=0;this.rebuff=0;this.kickCooldown=0;}
  get near(){return distance(this.round.player,WINDOW)<1.4;}
  get watching(){return this.distracted<=0&&this.round.elapsed%7<3.2;}
  get puller(){return this.round.enemies.find(e=>e.hp>0&&e.state==='pulling')||null;}
  distract(){
    if(!this.round.combatActive||distance(this.round.player,WINDOW)>2.3)return false;
    this.distracted=4;this.round.emit('mate-shove',{text:'Mate pushed back. Window clear!'});return true;
  }
  jump(){
    const r=this.round,p=r.player;
    if(r.practice||r.status!=='playing'||!r.combatActive||!this.near||this.active||!r.combat.neutral()||p.stamina<20)return false;
    if(this.watching){
      if(this.rebuff>0)return false;this.rebuff=1.5;
      r.hurtPlayer(6,{x:WINDOW.x,z:WINDOW.z-.5,attackKind:'jab'});p.z=Math.min(8.7,p.z+1.1);r.emit('mate-rebuff',{text:'Mate: “Use the door!” Shove him, or wait until he turns.'});return false;
    }
    p.stamina-=20;r.board=0;p.action='vault';p.actionTime=0;this.active={time:0,x:p.x,z:p.z};r.combat.queue=[];r.emit('window-jump');return true;
  }
  cancel(){
    if(!this.active)return;const r=this.round,p=r.player;this.active=null;p.y=0;p.action='idle';p.x=WINDOW.x;p.z=WINDOW.z+.8;p.vaultPhase=0;r.constrainActor(p);
    for(const e of r.enemies)if(e.state==='pulling'){e.state='recover';e.timer=.7;}
  }
  kick(){
    const r=this.round,p=r.player;if(r.status!=='playing'||!r.combatActive||!this.active||this.kickCooldown>0||p.stamina<12)return false;
    const target=this.puller||r.enemies.filter(e=>e.hp>0&&!['down','boarded','airborne','recover'].includes(e.state)&&distance(e,WINDOW)<2.5).sort((a,b)=>distance(a,WINDOW)-distance(b,WINDOW))[0];
    if(!target)return false;p.stamina-=12;this.kickCooldown=.5;p.vaultKick=.25;r.strikeEnemy(target,14,1.7,1.1,{move:'window-kick',trip:true});r.emit('window-kick');return true;
  }
  tick(dt){
    this.distracted=Math.max(0,this.distracted-dt);this.rebuff=Math.max(0,this.rebuff-dt);this.kickCooldown=Math.max(0,this.kickCooldown-dt);
    if(!this.active)return false;
    const r=this.round,p=r.player,a=this.active;p.vaultKick=Math.max(0,(p.vaultKick||0)-dt);
    if(!r.combatActive||p.hp<=0){this.cancel();return false;}
    const puller=r.enemies.find(e=>e.hp>0&&e.state==='pulling'&&e.timer<=0&&distance(e,WINDOW)<2.5);
    if(puller){this.cancel();p.invulnerable=0;r.hurtPlayer(5,puller);r.emit('window-pulled',{id:puller.id,text:'Pulled down! Stagger nearby rivals, or hold Fight to kick free.'});return false;}
    a.time+=dt;const t=Math.min(1,a.time/1.65),ease=t*t*(3-2*t);
    p.x=a.x+(WINDOW.x-a.x)*ease;p.z=a.z+(WINDOW.z-1.15-a.z)*ease;p.y=Math.sin(t*Math.PI)*1.6+t*.75;p.face=Math.PI;p.action='vault';p.vaultPhase=t;
    if(t===1&&!r.encounterComplete){this.cancel();r.emit('combat-note',{text:'Win the fight first! Rivals still contest this seat.'});return false;}
    if(t===1){this.active=null;r.board=1;r.boardedVia='window';r.finish('won');}
    return true;
  }
}
