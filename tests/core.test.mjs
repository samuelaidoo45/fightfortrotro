import test from 'node:test';
import assert from 'node:assert/strict';
import {Round,HomeRun,MODES,DOOR,constrain,distance} from '../dist/core.js';
const step=(round,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds/.02);i++)round.tick(.02,input);};
const keeperOnly=(mode='easy')=>{const r=new Round(mode,()=>.5);r.enemies=[r.keeper];return r;};

test('difficulty changes pressure and later stops increase the challenge',()=>{
  for(const mode of Object.keys(MODES)){const first=new Round(mode,()=>.5),last=new Round(mode,()=>.5,{stage:3});assert.equal(first.enemies.length,MODES[mode].count);assert.ok(last.enemies.length>first.enemies.length);assert.ok(last.keeper.hp>first.keeper.hp);}
  assert.ok(MODES.hard.damage>MODES.normal.damage);assert.ok(MODES.easy.time>MODES.hard.time);assert.ok(MODES.easy.windup>MODES.hard.windup);
});
test('the marked doorway rival must be beaten before boarding',()=>{
  const r=keeperOnly();r.config.damage=0;Object.assign(r.player,DOOR);step(r,4,{board:true,block:true});assert.equal(r.status,'playing');assert.equal(r.board,0);assert.equal(r.gateCleared,false);
});
test('three connected strikes create a finisher and can clear the doorway',()=>{
  const r=keeperOnly();Object.assign(r.keeper,{x:0,z:4.5});const hp=r.keeper.hp;r.attack();assert.ok(r.keeper.hp<hp);const after=r.keeper.hp;r.attack();assert.equal(r.keeper.hp,after,'cooldown prevents a second instant hit');step(r,.31);r.attack();step(r,.31);r.attack();assert.equal(r.combo,3);assert.equal(r.keeper.state,'down');assert.equal(r.kos,1);assert.equal(r.gateCleared,true);assert.ok(r.events.some(e=>e.type==='door-open'));
});
test('missing a swing does not advance the hit combo',()=>{
  const r=new Round();r.enemies=[];r.attack();step(r,.31);r.attack();assert.equal(r.combo,0);
});
test('a cleared doorway permits boarding without an arbitrary waiting timer',()=>{
  const r=keeperOnly();r.down(r.keeper);Object.assign(r.player,DOOR);step(r,.55,{board:true});assert.equal(r.status,'playing');assert.ok(r.board>0);step(r,.8,{board:true});assert.equal(r.status,'won');assert.ok(r.elapsed<2);
});
test('taking a hit interrupts a boarding attempt',()=>{
  const r=keeperOnly();r.down(r.keeper);Object.assign(r.player,DOOR);step(r,.55,{board:true});assert.ok(r.board>.4);r.hurtPlayer(12,{x:6,z:-2});assert.equal(r.board,0);
});
test('a rusher can take the seat if the player fails to intervene',()=>{
  const r=new Round('normal',()=>.5);r.down(r.keeper);const thief=r.enemies.find(e=>e.role==='rusher');r.enemies=[r.keeper,thief];Object.assign(thief,DOOR,{state:'chase'});r.player.x=-8;r.player.z=7;step(r,r.config.claimTime+.3);assert.equal(r.status,'seat-taken');assert.ok(r.events.some(e=>e.type==='end'&&e.result==='seat-taken'));
});
test('a strike cancels a rival boarding and creates a recovery window',()=>{
  const r=new Round('normal',()=>.5);r.down(r.keeper);const thief=r.enemies.find(e=>e.role==='rusher');r.enemies=[r.keeper,thief];Object.assign(thief,DOOR,{state:'chase'});r.player.x=-8;r.player.z=7;step(r,1);assert.ok(thief.board>0);r.player.x=DOOR.x+1;r.player.z=DOOR.z;r.attack();assert.equal(thief.board,0);assert.equal(thief.state,'recover');
});
test('the power shove clears a crowd and cannot be spammed',()=>{
  const r=new Round();r.enemies=r.enemies.slice(1,4);r.enemies.forEach((e,i)=>Object.assign(e,{x:-.4+i*.4,z:4.6}));const before=r.enemies.map(e=>distance(e,r.player));assert.equal(r.shove(),true);r.enemies.forEach((e,i)=>{assert.ok(distance(e,r.player)>before[i]+1);assert.equal(e.state,'recover');});const stamina=r.player.stamina;assert.equal(r.shove(),false);assert.equal(r.player.stamina,stamina);assert.ok(r.player.shoveCooldown>3);
});
test('a timed block counters an attack; a held guard still reduces damage',()=>{
  const r=new Round(),enemy=r.enemies[1];r.player.action='block';r.player.blockTime=.1;assert.equal(r.hurtPlayer(20,enemy),'parried');assert.equal(r.player.hp,100);assert.equal(enemy.state,'recover');assert.ok(r.score>=75);r.player.blockTime=1;r.hurtPlayer(20,enemy);assert.ok(r.player.hp>95&&r.player.hp<100);
});
test('dodging grants brief invulnerability and spends stamina',()=>{
  const r=new Round(),enemy=r.enemies[1];assert.equal(r.dodge(1,0),true);const stamina=r.player.stamina;r.hurtPlayer(20,enemy);assert.equal(r.player.hp,100);assert.ok(stamina<100);assert.ok(r.score>0);
});
test('only a bounded number of rivals can wind up at once',()=>{
  const r=new Round('normal',()=>.5);r.enemies.forEach((e,i)=>Object.assign(e,{x:r.player.x+Math.cos(i)*1.6,z:r.player.z+Math.sin(i)*1.6,state:'chase',timer:0}));r.tick(.02);assert.ok(r.enemies.filter(e=>e.state==='windup').length<=r.config.attackers);
});
test('pickups require proximity and cannot be consumed twice',()=>{
  const r=new Round();r.player.hp=40;Object.assign(r.player,r.pickups[2]);r.pickup();assert.equal(r.player.hp,70);r.pickup();assert.equal(r.player.hp,70);r.player.x=r.pickups[0].x;r.player.z=r.pickups[0].z;r.pickup();assert.equal(r.player.weapon,true);
});
test('timeout and health loss produce distinct terminal outcomes',()=>{
  const r=new Round();r.enemies=[];r.player.hp=0;r.tick(.02);assert.equal(r.status,'knocked-out');const s=new Round();s.enemies=[];s.elapsed=s.config.time;s.tick(.02);assert.equal(s.status,'missed');const time=s.elapsed;s.tick(1);assert.equal(s.elapsed,time);
});
test('bus and arena boundaries keep characters out of solid space',()=>{
  const a={x:3,z:-3};constrain(a);assert.ok(a.x<=1.15||a.x>=4.65||a.z<=-7.15||a.z>=.15);const b={x:100,z:-100};constrain(b);assert.equal(b.x,9.5);assert.equal(b.z,-7.7);
});
test('rivals route around the bus to reach the player',()=>{
  const r=new Round();r.config.damage=0;r.enemies=[{...r.enemies[2],role:'swinger',x:0,z:-3,state:'chase'}];Object.assign(r.player,DOOR);step(r,15);assert.ok(r.enemies[0].x>4.6);assert.ok(distance(r.enemies[0],r.player)<2.4);
});
test('the home run needs three wins and carries score, health and growing pressure',()=>{
  const run=new HomeRun('easy','circle',()=>.5);assert.equal(new Set(run.route.map(a=>a.id)).size,3);const counts=[];
  for(let i=0;i<3;i++){const r=i===0?run.createRound():run.advance();counts.push(r.enemies.length);assert.equal(r.stage,i+1);if(i>0){assert.equal(r.player.hp,85);assert.equal(r.player.weapon,true);assert.equal(r.pickups[0].used,true);}r.player.hp=60;r.player.weapon=true;r.kos=1;r.score=200;r.finish('won');run.record(r);const score=run.score;run.record(r);assert.equal(run.score,score,'a result cannot be banked twice');assert.equal(run.complete,i===2);}
  assert.equal(run.history.length,3);assert.equal(run.kos,3);assert.ok(counts[2]>counts[0]);assert.ok(run.score>600);assert.equal(run.advance(),null);
});
test('a lost stop ends the run instead of advancing toward home',()=>{
  const run=new HomeRun();const r=run.createRound();r.finish('seat-taken');run.record(r);assert.equal(run.canContinue,false);assert.equal(run.complete,false);assert.equal(run.advance(),null);
});
