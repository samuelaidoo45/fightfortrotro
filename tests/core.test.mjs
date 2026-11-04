import test from 'node:test';
import assert from 'node:assert/strict';
import {Round,HomeRun,MODES,DOOR,constrain,distance} from '../dist/core.js';
const step=(round,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds/.02);i++)round.tick(.02,input);};
const keeperOnly=(mode='easy')=>{const r=new Round(mode,()=>.5);r.enemies=[r.keeper];Object.assign(r.player,{x:0,z:5.8});return r;};

test('difficulty changes pressure and later stops increase the challenge',()=>{
  for(const mode of Object.keys(MODES)){const first=new Round(mode,()=>.5),last=new Round(mode,()=>.5,{stage:3});assert.equal(first.enemies.length,MODES[mode].count);assert.ok(last.enemies.length>first.enemies.length);assert.ok(last.keeper.hp>first.keeper.hp);}
  assert.ok(MODES.hard.damage>MODES.normal.damage);assert.ok(MODES.easy.time>MODES.hard.time);assert.ok(MODES.easy.windup>MODES.hard.windup);
});
test('an active doorway blocker prevents boarding even while the player holds guard',()=>{
  const r=keeperOnly();r.keeper.timer=100;Object.assign(r.player,DOOR);step(r,2,{board:true,block:true});assert.equal(r.status,'playing');assert.equal(r.board,0);assert.equal(r.gateCleared,false);
});
test('three confirmed inputs branch into a launching finisher',()=>{
  const r=keeperOnly();Object.assign(r.keeper,{x:0,z:4.5,spawnX:0,spawnZ:4.5,timer:100});const hp=r.keeper.hp;r.attack();assert.equal(r.keeper.hp,hp,'startup has no instant damage');r.attack();r.attack('heavy');step(r,.65);assert.ok(r.keeper.hp<hp-50);assert.equal(r.chain,3);assert.ok(r.keeper.y>0);assert.ok(r.events.some(e=>e.type==='finisher'&&e.move==='uppercut'));
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
test('guards stay at the doorway when the player moves away',()=>{
  const r=new Round('normal',()=>.5);r.raceClock=100;r.player.x=-8;r.player.z=7;step(r,12);assert.equal(r.player.hp,100);assert.equal(r.status,'playing');for(const enemy of r.enemies){assert.ok(distance(enemy,{x:enemy.spawnX,z:enemy.spawnZ})<.2);assert.equal(enemy.state,'guard');}
});
test('remaining guards block entry even after the doorway rival is down',()=>{
  const r=new Round('easy',()=>.5);r.enemies=r.enemies.slice(0,3);r.down(r.keeper);r.enemies.forEach(e=>{if(e.state!=='down')e.timer=100;});Object.assign(r.player,DOOR);step(r,3,{board:true});assert.equal(r.gateCleared,false);assert.equal(r.doorBlocked,true);assert.equal(r.board,0);assert.equal(r.status,'playing');
});
test('shoving the doorway blockers creates a real entry window',()=>{
  const r=new Round('easy',()=>.5);r.enemies=r.enemies.slice(0,3);r.down(r.keeper);Object.assign(r.player,DOOR);assert.equal(r.doorBlocked,true);r.shove();assert.equal(r.doorBlocked,false);step(r,1.9,{board:true});assert.equal(r.status,'won');
});
test('remaining rivals compete to board after the leader is defeated',()=>{
  const r=new Round('normal',()=>.5);r.down(r.keeper);r.player.x=-8;r.player.z=7;step(r,11);assert.equal(r.status,'playing');assert.equal(r.player.hp,100);assert.equal(r.seatsLost,1);assert.equal(r.bus.full,true);assert.ok(r.enemies.some(e=>e.state==='boarded'));
});
test('a shove leaves enough time to enter when the bus prevents a blocker moving away',()=>{
  for(const mode of ['normal','hard']){const r=new Round(mode,()=>.5),blocker=r.enemies[2];r.enemies=[r.keeper,blocker];r.down(r.keeper);Object.assign(blocker,{x:DOOR.x,z:DOOR.z+.35,spawnX:DOOR.x,spawnZ:DOOR.z+.35,state:'guard',timer:100});Object.assign(r.player,{x:DOOR.x,z:DOOR.z+1.05});r.shove();assert.ok(distance(blocker,DOOR)<1.85,'bus collision leaves the defender physically close');step(r,r.config.boardTime+.55,{board:true});assert.equal(r.status,'won');}
});
test('the power shove clears a crowd and cannot be spammed',()=>{
  const r=new Round();Object.assign(r.player,{x:0,z:5.8});r.enemies=r.enemies.slice(1,4);r.enemies.forEach((e,i)=>Object.assign(e,{x:-.4+i*.4,z:4.6}));const before=r.enemies.map(e=>distance(e,r.player));assert.equal(r.shove(),true);r.enemies.forEach((e,i)=>{assert.ok(distance(e,r.player)>before[i]+1);assert.equal(e.state,'recover');});const stamina=r.player.stamina;assert.equal(r.shove(),false);assert.equal(r.player.stamina,stamina);assert.ok(r.player.shoveCooldown>3);
});
test('a timed block counters an attack; a held guard still reduces damage',()=>{
  const r=new Round(),enemy=r.enemies[1];r.player.action='block';r.player.blockTime=.1;assert.equal(r.hurtPlayer(20,enemy),'parried');assert.equal(r.player.hp,100);assert.equal(enemy.state,'recover');assert.ok(r.score>=75);r.player.blockTime=1;r.hurtPlayer(20,enemy);assert.ok(r.player.hp>95&&r.player.hp<100);
});
test('dodging grants brief invulnerability and spends stamina',()=>{
  const r=new Round(),enemy=r.enemies[1];assert.equal(r.dodge(1,0),true);const stamina=r.player.stamina;r.hurtPlayer(20,enemy);assert.equal(r.player.hp,100);assert.ok(stamina<100);assert.ok(r.score>0);
});
test('only a bounded number of doorway guards can wind up at once',()=>{
  const r=new Round('normal',()=>.5);Object.assign(r.player,DOOR);r.enemies.forEach((e,i)=>{Object.assign(e,{x:DOOR.x+Math.cos(i)*1.4,z:DOOR.z+Math.sin(i)*1.4,state:'guard',timer:0});constrain(e);e.spawnX=e.x;e.spawnZ=e.z;});r.tick(.02);const attacks=r.enemies.filter(e=>e.state==='windup').length;assert.ok(attacks>0&&attacks<=r.config.attackers);
});
test('pickups require proximity and cannot be consumed twice',()=>{
  const r=new Round();r.player.hp=40;Object.assign(r.player,r.pickups[2]);r.pickup();assert.equal(r.player.hp,70);r.pickup();assert.equal(r.player.hp,70);r.player.x=r.pickups[0].x;r.player.z=r.pickups[0].z;r.pickup();assert.equal(r.player.weapon,'bag');
});
test('health loss ends the run and a finished round stays frozen',()=>{
  const r=new Round();r.enemies=[];r.player.hp=0;r.tick(.02);assert.equal(r.status,'knocked-out');const time=r.elapsed;r.tick(1);assert.equal(r.elapsed,time);
});
test('pavement boundaries keep characters clear of buses and through traffic',()=>{
  for(const present of [true,false]){const a={x:0,z:-6.2};constrain(a,present);assert.equal(a.z,-4.15);const b={x:100,z:-100};constrain(b,present);assert.equal(b.x,9.5);assert.equal(b.z,-4.15);}
});
test('a displaced defender returns along the pavement to its doorway post',()=>{
  const r=new Round();r.enemies=[{...r.enemies[2],x:0,z:-3,state:'guard'}];r.raceClock=100;r.player.x=-8;r.player.z=7;step(r,15);assert.ok(distance(r.enemies[0],{x:r.enemies[0].spawnX,z:r.enemies[0].spawnZ})<.2);assert.equal(r.player.hp,100);
});
test('the home run needs three wins and carries score, health and growing pressure',()=>{
  const run=new HomeRun('easy','circle',()=>.5);assert.equal(new Set(run.route.map(a=>a.id)).size,3);const counts=[];
  for(let i=0;i<3;i++){const r=i===0?run.createRound():run.advance();counts.push(r.enemies.length);assert.equal(r.stage,i+1);if(i>0){assert.equal(r.player.hp,85);assert.equal(r.player.weapon,'bag');assert.equal(r.pickups[0].used,true);}r.player.hp=60;r.player.weapon='bag';r.kos=1;r.score=200;r.finish('won');run.record(r);const score=run.score;run.record(r);assert.equal(run.score,score,'a result cannot be banked twice');assert.equal(run.complete,i===2);}
  assert.equal(run.history.length,3);assert.equal(run.kos,3);assert.ok(counts[2]>counts[0]);assert.ok(run.score>600);assert.equal(run.advance(),null);
});
test('a lost stop ends the run instead of advancing toward home',()=>{
  const run=new HomeRun();const r=run.createRound();r.finish('knocked-out');run.record(r);assert.equal(run.canContinue,false);assert.equal(run.complete,false);assert.equal(run.advance(),null);
});
