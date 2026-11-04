// Ambient traffic stays in dedicated lanes beyond the fighting area.
export class TrafficFleet {
  constructor(){this.vehicles=Array.from({length:9},(_,i)=>{const lane=Math.floor(i/3);return{id:i,kind:i===1||i===5?'trotro':i%3===0?'taxi':'car',x:-48+(i%3)*34,z:[-11.5,-15,14.2][lane],direction:lane===0?-1:1,speed:[7,8.5,8][lane],wheel:0};});}
  tick(dt){for(const v of this.vehicles){v.x+=v.speed*v.direction*dt;v.wheel+=v.speed*dt/.38;if(v.x>54)v.x-=108;if(v.x< -54)v.x+=108;}}
}
