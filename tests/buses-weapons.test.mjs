import test from 'node:test';
import assert from 'node:assert/strict';
import {Round,HomeRun,BusCycle,BUS_TIMING,WEAPONS,DOOR,distance} from '../dist/core.js';
const step=(round,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds/.02);i++)round.tick(.02,input);};
const nextPhase=cycle=>cycle.tick(cycle.remaining);

test('a full trotro leaves, waits, and is replaced by an available trotro',()=>{
  const bus=new BusCycle({firstFull:true,random:()=>0,fullChance:1});assert.equal(bus.seats,0);assert.equal(bus.canBoard,false);assert.equal(bus.arrivalIn,Object.values(BUS_TIMING).reduce((a,b)=>a+b,0));
  nextPhase(bus);assert.equal(bus.phase,'departing');nextPhase(bus);assert.equal(bus.phase,'waiting');nextPhase(bus);assert.equal(bus.phase,'arriving');assert.equal(bus.number,2);assert.equal(bus.full,false);nextPhase(bus);assert.equal(bus.canBoard,true);assert.equal(bus.seats,1);
  // Even with maximum full-bus probability, a full bus is never followed by another full bus.
  for(let i=0;i<4;i++)nextPhase(bus);assert.equal(bus.phase,'full');for(let i=0;i<4;i++)nextPhase(bus);assert.equal(bus.canBoard,true);
});
test('full buses cannot be boarded, and the waiting crowd does not attack or pursue',()=>{
  const r=new Round('normal',()=>.5,{firstBusFull:true});Object.assign(r.player,DOOR);const stamina=r.player.stamina;assert.equal(r.attack(),false);assert.equal(r.shove(),false);step(r,2,{board:true,attack:true});assert.equal(r.board,0);assert.equal(r.player.hp,100);assert.equal(r.player.stamina,stamina);assert.ok(r.enemies.every(e=>e.state==='guard'&&distance(e,r.waitingPost(e))<5));
});
test('missing one bus keeps the same stop, supplies, health and score alive',()=>{
  const r=new Round('easy',()=>.5,{health:63,weapon:'umbrella'});r.raceClock=100;r.score=230;step(r,r.bus.window+BUS_TIMING.departing+BUS_TIMING.waiting+BUS_TIMING.arriving+.2);assert.equal(r.status,'playing');assert.equal(r.bus.number,2);assert.equal(r.bus.canBoard,true);assert.equal(r.player.hp,70);assert.equal(r.player.weapon,'umbrella');assert.equal(r.score,230);assert.equal(r.stage,1);assert.ok(r.enemies.every(e=>e.hp<=e.maxHp&&e.state!=='boarding'));assert.ok(r.enemies.some(e=>e.hp<e.maxHp));
});
test('the road stays outside the playable pavement during an empty bay and arrival',()=>{
  const r=new Round('easy',()=>.5,{firstBusFull:true});step(r,BUS_TIMING.full+BUS_TIMING.departing+.1);assert.equal(r.bus.phase,'waiting');Object.assign(r.player,{x:0,z:-6.2});r.tick(.02);assert.equal(r.player.z,-4.15);step(r,BUS_TIMING.waiting+BUS_TIMING.arriving);assert.equal(r.bus.canBoard,true);assert.ok(r.player.z>=-4.15);
});
test('waiting for a full bus never banks a ride or advances the home run',()=>{
  const run=new HomeRun('easy','circle',()=>0),r=new Round('easy',()=>0,{firstBusFull:true,startWaiting:true});step(r,BUS_TIMING.waiting+BUS_TIMING.arriving+Object.values(BUS_TIMING).reduce((a,b)=>a+b,0)+.2);run.record(r);assert.equal(run.index,0);assert.equal(run.history.length,0);assert.equal(run.canContinue,false);assert.equal(r.bus.canBoard,true);
});
test('missing several arrivals never ends a healthy run on an unrelated service timer',()=>{
  const r=new Round('hard',()=>0,{firstBusFull:true});r.enemies=[];step(r,r.config.time*3);assert.equal(r.status,'playing');assert.equal(r.player.hp,100);assert.ok(r.bus.number>3);assert.ok(r.missedBuses>1);
});
test('all five weapons can be equipped, replaced, and carried to the next stop',()=>{
  const run=new HomeRun('easy','circle',()=>.9),r=run.createRound();const kinds=Object.keys(WEAPONS).filter(k=>k!=='hands');
  for(const kind of kinds){const item=r.pickups.find(p=>p.type===kind);assert.ok(item);Object.assign(r.player,{x:item.x,z:item.z});r.pickup();assert.equal(r.player.weapon,kind);assert.equal(item.used,true);}
  r.finish('won');run.record(r);const next=run.advance();assert.equal(next.player.weapon,'suitcase');assert.equal(next.pickups.find(p=>p.type==='suitcase').used,true);
});
test('umbrella reach hits beyond bare hands while preserving its lighter damage',()=>{
  function attempt(weapon){const r=new Round('normal',()=>.5,{weapon});r.enemies=[r.keeper];Object.assign(r.player,{x:-4,z:4});Object.assign(r.keeper,{x:-4,z:6.8,spawnX:-4,spawnZ:6.8,timer:100});const hp=r.keeper.hp;r.attack();step(r,.2);return hp-r.keeper.hp;}
  assert.equal(attempt(null),0);assert.equal(attempt('umbrella'),13);assert.equal(attempt('stool'),0);
});
test('stool sweeps three rivals, bag and suitcase hit two, baton hits one',()=>{
  for(const [kind,hits] of [['stool',3],['bag',2],['suitcase',2],['baton',1]]){const r=new Round('normal',()=>.5,{weapon:kind});Object.assign(r.player,{x:0,z:5.8});r.enemies=r.enemies.slice(0,3);r.enemies.forEach((e,i)=>Object.assign(e,{x:-.4+i*.4,z:4.5,spawnX:-.4+i*.4,spawnZ:4.5,timer:100}));const hp=r.enemies.map(e=>e.hp);r.attack();step(r,.2);assert.equal(r.enemies.filter((e,i)=>e.hp<hp[i]).length,hits);}
});
test('heavy weapons spend more stamina and recover slower than the baton',()=>{
  const fast=new Round('easy',()=>.5,{weapon:'baton'}),heavy=new Round('easy',()=>.5,{weapon:'stool'});fast.enemies=[];heavy.enemies=[];fast.attack();heavy.attack();assert.ok(fast.player.stamina>heavy.player.stamina);step(fast,.31);step(heavy,.31);assert.equal(fast.combat.active,null);assert.ok(heavy.combat.active);heavy.combat.reset();heavy.player.stamina=5;assert.equal(heavy.attack(),false);
});
test('a heavy stool attack hits harder and pushes farther than a light one',()=>{
  const attack=kind=>{const r=new Round('easy',()=>.5,{weapon:'stool'});r.enemies=[r.keeper];Object.assign(r.player,{x:-4,z:4});Object.assign(r.keeper,{x:-4,z:5.2,spawnX:-4,spawnZ:5.2,hp:200,maxHp:200,timer:100});r.attack(kind);step(r,.6);return{damage:200-r.keeper.hp,range:distance(r.player,r.keeper)};};const light=attack('light'),heavy=attack('heavy');assert.ok(heavy.damage>light.damage*1.8);assert.ok(heavy.range>light.range+.3);
});
