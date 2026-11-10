import {WINDOW} from './layout.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function stickVector(dx,dy,radius=44){
  const length=Math.hypot(dx,dy);if(length<radius*.14)return{x:0,z:0,knobX:0,knobY:0};
  const scale=Math.min(1,length/radius),x=dx/length*scale,y=dy/length*scale;
  return{x:x*.76+y*.65,z:-x*.65+y*.76,knobX:x*radius,knobY:y*radius};
}
export function contextAction(round){
  if(!round||round.status!=='playing')return{kind:'none',label:'Use',disabled:true};
  const p=round.player;
  if(round.window.active)return{kind:'window-kick',label:'Kick free'};
  const rival=round.boardingRival;if(round.combatActive&&rival?.boardRoute==='window'&&rival.state==='boarding'&&distance(p,rival)<1.7)return{kind:'grab',label:'Pull rival down'};
  if(round.combatActive&&!round.practice&&distance(p,WINDOW)<1.4)return round.window.watching?{kind:'shove',label:'Shove mate'}:{kind:'vault',label:'Vault window'};
  if(round.combatActive&&round.encounterComplete&&round.nearDoor)return{kind:'board',label:'Hold to board'};
  if(round.street.nearby)return{kind:'pickup',label:'Street trick'};
  if(round.pickups.some(i=>!i.used&&distance(i,p)<1.65))return{kind:'pickup',label:'Pick up'};
  if(round.combatActive)return round.combat.target&&distance(round.combat.target,p)<1.7?{kind:'grab',label:'Throw'}:{kind:'shove',label:'Shove'};
  return{kind:'none',label:'Bus arriving',disabled:true};
}
export function arrivalCall(route,full=false){const destination=route.split('—').at(-1).trim();return full?`${destination}! Full! Wait for the next car!`:`${destination}! ${destination}! Last seat! Come, come, come!`;}
