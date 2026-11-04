// One shared roadside layout for simulation, rendering and collision checks.
export const STOP={x:0,z:-6.2,yaw:-Math.PI/2};
export const DOOR={x:-.98,z:-4.15};
export const PAVEMENT={minX:-9.5,maxX:9.5,minZ:-4.15,maxZ:8.7};
export const BUS_BOUNDS={minX:-3.65,maxX:3.65,minZ:-7.85,maxZ:-4.55};
export const GUARD_POSTS=[[-.98,-3.15],[-2.2,-3.7],[.3,-3.7],[-2.4,-2.3],[.55,-2.3],[-.9,-1.45],[-3.6,-3.5],[1.7,-3.5],[-3.4,-1.1],[1.5,-1.2]].map(([x,z])=>({x,z}));
export const TRAFFIC_LANES=[{z:-11.5,direction:-1,speed:7},{z:-15,direction:1,speed:8.5}];
export function busPose(phase,progress=0){
  const t=Math.max(0,Math.min(1,progress)),smooth=t*t*(3-2*t);
  // The approach shoulder leaves both through lanes clear, including bus mirrors.
  if(phase==='arriving')return{x:34*(1-t)**2,z:STOP.z-2.15*(1-smooth),yaw:STOP.yaw-.12*Math.sin(t*Math.PI)};
  if(phase==='departing')return{x:-38*t*t,z:STOP.z-2.15*smooth,yaw:STOP.yaw+.12*Math.sin(t*Math.PI)};
  return{...STOP};
}
