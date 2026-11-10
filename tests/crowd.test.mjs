import test from 'node:test';
import assert from 'node:assert/strict';
import {Round,DOOR} from '../dist/core.js';
import {WINDOW} from '../dist/layout.js';
import {crowdTarget,hurtRival} from '../dist/crowd.js';
const step=(r,t,input={})=>{for(let i=0;i<Math.ceil(t/.02);i++)r.tick(.02,input);};
const setup=()=>{const r=new Round('easy',()=>.5);r.raceClock=100;r.enemies=r.enemies.slice(0,2);Object.assign(r.enemies[0],{x:0,z:-3,timer:0});Object.assign(r.enemies[1],{x:1,z:-3,timer:0});Object.assign(r.player,{x:8,z:7});return r;};
test('the crowd fights each other while the player stays away, without awarding player combat rewards',()=>{
 const r=setup();step(r,5);assert.ok(r.events.some(e=>e.type==='crowd-hit'));assert.ok(r.enemies.some(e=>e.hp<e.maxHp));assert.equal(r.player.hp,100);assert.equal(r.score,0);assert.equal(r.kos,0);assert.equal(r.momentum,35);
});
test('rivals select a nearby player and retaliate against whoever hit them',()=>{
 const r=setup(),[a,b]=r.enemies;assert.equal(crowdTarget(r,a),b);Object.assign(r.player,{x:0,z:-2.6});assert.equal(crowdTarget(r,a),r.player);hurtRival(r,b,a,5);Object.assign(r.player,{x:8,z:7});assert.equal(crowdTarget(r,a),b);Object.assign(r.player,{x:0,z:-2.6});r.strikeEnemy(a,1,0,.1);assert.equal(crowdTarget(r,a),r.player);r.elapsed=4;Object.assign(r.player,{x:8,z:7});assert.equal(crowdTarget(r,a),b);
});
test('a committed rival attack hits its selected rival rather than the player',()=>{
 const r=setup(),[a,b]=r.enemies;Object.assign(a,{state:'windup',timer:0,attackTargetId:b.id,attackKind:'jab'});b.timer=100;Object.assign(r.player,{x:0,z:-2.4});const hp=b.hp;r.tick(.02);assert.ok(b.hp<hp);assert.equal(r.player.hp,100);assert.equal(a.state,'swing');
});
test('a committed attack cannot teleport damage to a displaced or defeated rival',()=>{
 for(const removed of [false,true]){const r=setup(),[a,b]=r.enemies;Object.assign(a,{state:'windup',timer:0,attackTargetId:b.id});Object.assign(b,{x:8,z:7,timer:100});if(removed)r.down(b,false);const hp=b.hp;r.tick(.02);assert.equal(b.hp,hp);assert.ok(!r.events.some(e=>e.type==='crowd-hit'));}
});
test('rival knockouts stay down and count toward the last-standing gate without awarding kills or captain rewards',()=>{
 const r=setup(),[a,b]=r.enemies;b.captain='wall';b.hp=1;hurtRival(r,a,b,5);assert.equal(b.state,'down');assert.equal(r.encounterProgress,1);assert.equal(r.encounterComplete,false);assert.equal(r.kos,0);assert.equal(r.stats.captains,0);assert.equal(r.score,0);assert.equal(r.momentum,35);r.down(b);assert.equal(r.kos,0);r.strikeEnemy(a,999,0,1);assert.equal(r.encounterComplete,true);assert.equal(r.kos,1);Object.assign(r.player,DOOR);step(r,1.2,{board:true});assert.equal(r.status,'won');
});
test('rivals can interrupt each other at both entrances without giving the player an interruption reward',()=>{
 for(const route of ['door','window']){const r=setup(),[a,b]=r.enemies;Object.assign(b,{state:'boarding',boardRoute:route,boardProgress:.8,y:.5});hurtRival(r,a,b,10);assert.equal(b.state,'recover');assert.equal(b.boardProgress,0);assert.equal(b.y,0);assert.equal(r.stats.interrupts,0);assert.equal(r.score,0);assert.ok(r.events.some(e=>e.type==='crowd-interrupt'));}
});
test('guarding softens rival hits, while low attacks bypass the guard',()=>{
 const r=setup(),[a,b]=r.enemies;b.defending=true;const hp=b.hp;hurtRival(r,a,b,10);assert.equal(hp-b.hp,2);a.attackKind='low';hurtRival(r,a,b,10);assert.equal(hp-b.hp,12);
});
test('full buses and practice do not start rival-on-rival brawls',()=>{
 const r=setup();r.bus.full=true;r.bus.phase='full';step(r,1);assert.ok(r.enemies.every(e=>e.hp===e.maxHp));assert.equal(hurtRival(r,r.enemies[0],r.enemies[1],10),false);const practice=new Round('easy',()=>.5,{practice:true});assert.equal(crowdTarget(practice,practice.keeper),practice.player);
});
test('winning the fight unlocks window boarding even when rivals defeated one another',()=>{
 const r=setup(),[a,b]=r.enemies;hurtRival(r,a,b,999);r.strikeEnemy(a,999,0,1);Object.assign(r.player,WINDOW);r.window.distracted=5;assert.equal(r.window.jump(),true);step(r,1.7);assert.equal(r.status,'won');assert.equal(r.boardedVia,'window');
});


test('nearby challengers prioritise the player even when another rival is closer or has struck them',()=>{
 const r=new Round('normal',()=>.5,{quickArrival:true,closeStart:true});r.bus.phase='boarding';r.bus.full=false;
 const targets=r.enemies.map(e=>[e,crowdTarget(r,e)]),challengers=targets.filter(([,t])=>t===r.player);
 assert.ok(challengers.length>=2);assert.ok(targets.some(([,t])=>t!==r.player));
 const [challenger]=challengers[0],other=r.enemies.find(e=>e!==challenger);hurtRival(r,other,challenger,1);assert.equal(crowdTarget(r,challenger),r.player);
});
test('the starting approach gets real player attacks alongside rival-on-rival combat',()=>{
 const r=new Round('normal',()=>.5,{quickArrival:true,closeStart:true});r.raceClock=100;step(r,8);
 assert.ok(r.events.some(e=>e.type==='damage'));assert.ok(r.player.hp<100);assert.ok(r.events.some(e=>e.type==='crowd-hit'));
});
test('player attacks remain capped by difficulty even with the whole crowd nearby',()=>{
 for(const mode of ['easy','normal','hard']){
  const r=new Round(mode,()=>.5);r.raceClock=100;Object.assign(r.player,{x:DOOR.x,z:DOOR.z+2});
  for(let i=0;i<200;i++){r.tick(.02);assert.ok(r.enemies.filter(e=>['windup','swing'].includes(e.state)&&e.attackTargetId==='player').length<=r.config.attackers);}
 }
});
test('challengers stop pursuing a player who retreats from the boarding area',()=>{
 const r=new Round('normal',()=>.5,{closeStart:true});assert.ok(r.enemies.some(e=>crowdTarget(r,e)===r.player));Object.assign(r.player,{x:8,z:7});assert.ok(r.enemies.every(e=>crowdTarget(r,e)!==r.player));
});
test('winding-up challengers miss if the player leaves the scramble or starts climbing',()=>{
 for(const vault of [false,true]){const r=setup(),a=r.enemies[0];Object.assign(a,{state:'windup',timer:0,attackTargetId:'player'});Object.assign(r.player,{x:a.x,z:a.z+.4});if(vault)r.window.active={time:1.3};else Object.assign(r.player,{x:8,z:7});const hp=r.player.hp;r.tick(.02);assert.equal(r.player.hp,hp);}
});
