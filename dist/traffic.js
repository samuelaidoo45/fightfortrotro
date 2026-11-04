import {TRAFFIC_LANES} from './layout.js';
// Through traffic shares the road beside the parallel bay, not the pavement.
export class TrafficFleet {
  constructor(){this.vehicles=Array.from({length:6},(_,i)=>{const lane=TRAFFIC_LANES[Math.floor(i/3)];return{id:i,kind:i===1||i===5?'trotro':i%3===0?'taxi':'car',x:-48+(i%3)*34,...lane,wheel:0};});}
  tick(dt){for(const v of this.vehicles){v.x+=v.speed*v.direction*dt;v.wheel+=v.speed*dt/.38;if(v.x>54)v.x-=108;if(v.x< -54)v.x+=108;}}
}
