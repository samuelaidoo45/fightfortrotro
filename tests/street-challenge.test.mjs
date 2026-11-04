import test from 'node:test';
import assert from 'node:assert/strict';
import {Round,DOOR} from '../dist/core.js';
import {TrafficFleet} from '../dist/traffic.js';
const step=(r,n,input={})=>{for(let i=0;i<Math.ceil(n/.02);i++)r.tick(.02,input);};
test('traffic moves in both directions, stays out of combat and maintains lane spacing',()=>{
  const fleet=new TrafficFleet(),before=fleet.vehicles.map(v=>v.x);fleet.tick(1);assert.ok(fleet.vehicles.some((v,i)=>v.x>before[i]));assert.ok(fleet.vehicles.some((v,i)=>v.x<before[i]));
  for(let t=0;t<600;t++){fleet.tick(.1);for(const v of fleet.vehicles){assert.ok(v.z< -9.5||v.z>10);assert.ok(v.x>=-54&&v.x<=54);for(const b of fleet.vehicles.filter(b=>b.id!==v.id&&b.z===v.z))assert.ok(Math.min(Math.abs(v.x-b.x),108-Math.abs(v.x-b.x))>30);}}
  const paused=fleet.vehicles.map(v=>v.x);fleet.tick(0);assert.deepEqual(fleet.vehicles.map(v=>v.x),paused);
});
test('a crowd breaker requires earned charge and an available bus',()=>{
  const r=new Round('easy',()=>.5);assert.equal(r.burst(),false);r.gainMomentum(100);const e=r.keeper;r.enemies=[e];Object.assign(r.player,DOOR);r.burst();assert.ok(r.momentum<100);assert.ok(r.rushTime>0);assert.equal(r.player.stamina,100);assert.equal(e.state,'recover');assert.ok(e.timer>=3);assert.equal(r.burst(),false);
  const waiting=new Round('easy',()=>.5,{firstBusFull:true});waiting.momentum=100;assert.equal(waiting.burst(),false);assert.equal(waiting.momentum,100);
});
test('connected hits build a capped multiplier while whiffs do not charge it',()=>{
  const r=new Round('easy',()=>.5);r.enemies=[r.keeper];Object.assign(r.player,{x:-4,z:4});Object.assign(r.keeper,{x:-4,z:5,hp:999,maxHp:999});
  for(let i=0;i<9;i++){r.player.cooldown=0;r.keeper.z=5;r.attack();r.elapsed+=.32;}
  assert.equal(r.multiplier,3);assert.equal(r.chain,9);assert.equal(r.bestChain,9);assert.equal(r.momentum,100);
  r.enemies=[];r.player.cooldown=0;r.momentum=20;r.attack();assert.equal(r.momentum,20);step(r,3.6);assert.equal(r.multiplier,1);assert.equal(r.chain,0);
});
test('unblocked hits break a streak and a parry rewards momentum',()=>{
  const r=new Round();r.chain=5;r.chainTime=3;r.hurtPlayer(10,r.keeper);assert.equal(r.chain,0);r.player.invulnerable=0;r.player.action='block';r.player.blockTime=.1;const before=r.momentum;r.hurtPlayer(10,r.keeper);assert.ok(r.momentum>before);
});
test('timed challenges reward once and do not spend time while a full bus waits',()=>{
  const r=new Round('easy',()=>.5,{stage:2,firstBusFull:true});step(r,2);assert.equal(r.challenge.time,30);r.bus.phase='boarding';r.bus.full=false;Object.assign(r.player,DOOR);r.enemies.slice(0,3).forEach((e,i)=>Object.assign(e,{x:5+i*.3,z:-2}));r.player.hp=50;r.shove();assert.equal(r.challenge.status,'won');assert.equal(r.player.hp,65);const score=r.score;r.progressChallenge('shove');assert.equal(r.score,score);
});
test('expired bonus challenges never block the main boarding goal',()=>{
  const r=new Round('easy',()=>.5);r.challenge.time=.01;r.enemies=[];Object.assign(r.player,DOOR);step(r,1.5,{board:true});assert.equal(r.challenge.status,'expired');assert.equal(r.status,'won');
});
test('keeper heavy swing is telegraphed and a held block takes more damage',()=>{
  const r=new Round('easy',()=>.5);r.enemies=[r.keeper];Object.assign(r.player,DOOR);Object.assign(r.keeper,{timer:0,attacks:2});r.tick(.02);assert.equal(r.keeper.heavy,true);assert.equal(r.keeper.state,'windup');assert.ok(r.keeper.timer>r.config.windup);r.player.action='block';r.player.blockTime=.1;const hp=r.player.hp;r.hurtPlayer(10,r.keeper);assert.ok(r.player.hp<hp-5);r.player.action='dodge';r.player.invulnerable=.4;const after=r.player.hp;assert.equal(r.hurtPlayer(10,r.keeper),'dodged');assert.equal(r.player.hp,after);
});
test('last-call cue fires once per available arrival',()=>{
  const r=new Round();r.enemies=[];r.bus.remaining=8;r.tick(.02);r.tick(.02);assert.equal(r.events.filter(e=>e.type==='last-call').length,1);
});
