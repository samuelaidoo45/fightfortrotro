import {DOOR} from './layout.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const alive=e=>e&&e.hp>0&&!['down','boarded'].includes(e.state);

// Targets are locked during wind-up, so dodging and interrupting remain meaningful.
export function crowdTarget(round,enemy){
  const p=round.player;
  const valid=actor=>actor===p?p.hp>0&&!round.window.active&&distance(p,DOOR)<5.2:alive(actor)&&actor!==enemy&&distance(actor,DOOR)<6;
  const revenge=enemy.grudgeUntil>round.elapsed?(enemy.grudgeId==='player'?p:round.enemies.find(e=>e.id===enemy.grudgeId)):null;
  if(valid(revenge)&&distance(enemy,revenge)<3.8)return revenge;
  if(round.practice)return valid(p)?p:null;
  const candidates=[p,...round.enemies].filter(valid);
  return candidates.sort((a,b)=>{
    const cost=t=>distance(enemy,t)-(['rushing','boarding'].includes(t.state)?1.7:0);
    return cost(a)-cost(b);
  })[0]||null;
}

export function hurtRival(round,attacker,target,damage){
  if(!round.combatActive||!alive(attacker)||!alive(target)||attacker===target)return false;
  const blocking=target.defending&&target.guardBroken<=0&&attacker.attackKind!=='low';
  if(blocking){target.guard=Math.max(0,target.guard-(attacker.heavy?58:18));damage*=.2;if(!target.guard){target.guardBroken=2;target.defending=false;}}
  damage=Math.max(1,Math.round(damage));target.hp=Math.max(0,target.hp-damage);target.hurt=.25;
  target.grudgeId=attacker.id;target.grudgeUntil=round.elapsed+3;
  if(['rushing','boarding'].includes(target.state)){target.boardProgress=0;target.y=0;target.vy=0;round.raceClock=Math.max(round.raceClock,1.5);round.emit('crowd-interrupt',{x:target.x,z:target.z,route:target.boardRoute});}
  if(!blocking||target.guardBroken>0){target.state='recover';target.timer=.45;target.defending=false;const d=distance(attacker,target)||1;target.x+=(target.x-attacker.x)/d*.22;target.z+=(target.z-attacker.z)/d*.22;round.constrainActor(target);}
  round.emit('crowd-hit',{x:target.x,z:target.z,damage});
  if(target.hp<=0)round.down(target,false);
  return true;
}
