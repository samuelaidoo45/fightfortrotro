import test from 'node:test';
import assert from 'node:assert/strict';
import {Round,DOOR,distance} from '../dist/core.js';
const step=(r,t,input={})=>{for(let i=0;i<Math.ceil(t/.01);i++)r.tick(.01,input);};
function setup(mode='easy',options={}){const r=new Round(mode,()=>.5,options);r.enemies=[r.keeper];r.raceClock=100;Object.assign(r.player,{x:0,z:2});Object.assign(r.keeper,{x:0,z:.7,spawnX:0,spawnZ:.7,timer:100,hp:1000,maxHp:1000});return r;}
for(const [route,move] of [[['light','light','heavy'],'uppercut'],[['light','kick','kick'],'spin'],[['kick','light','heavy'],'rush']])test(`${route.join(' → ')} branches only on connected hits`,()=>{
 const r=setup();for(const key of route)assert.equal(r.attack(key),true);step(r,1);assert.ok(r.events.some(e=>e.type==='finisher'&&e.move===move));assert.equal(r.chain,3);assert.equal(r.challenge.progress,1);
});
test('startup, bounded input buffering, stamina and whiffs prevent instant damage spam',()=>{
 const r=setup();r.enemies=[];r.attack();assert.equal(r.chain,0);assert.equal(r.attack('light'),true);assert.equal(r.attack('heavy'),true);assert.equal(r.attack('kick'),false);assert.equal(r.combat.queue.length,2);step(r,.2);assert.equal(r.combat.active.move.id,'jab','whiff cannot cancel recovery');step(r,1.3);assert.equal(r.chain,0);assert.ok(!r.events.some(e=>e.type==='finisher'));r.combat.reset();r.player.stamina=1;assert.equal(r.attack(),false);assert.equal(r.combat.active,null);
});
test('an uppercut launches and air hits have damage scaling and a juggle cap',()=>{
 const r=setup();r.attack();r.attack();r.attack('heavy');step(r,.55);assert.ok(r.keeper.y>.05);assert.equal(r.keeper.state,'airborne');
 const hit=()=>{r.combat.reset();r.player.stamina=100;Object.assign(r.keeper,{x:0,z:.7,y:.5,vy:0});r.attack();step(r,.11);return r.events.filter(e=>e.type==='hit').at(-1).damage;};const a=hit(),b=hit();assert.ok(b<a);hit();assert.equal(r.keeper.juggleHits,3);assert.ok(r.keeper.vy<0);step(r,1);assert.equal(r.keeper.y,0);assert.ok(r.events.some(e=>e.type==='land'));
});
test('high guard blocks lights, lows and throws bypass it, heavy hits break it',()=>{
 const attempt=(kind,direction=0,guard=100)=>{const r=setup('normal');r.player.z=-1.8;Object.assign(r.keeper,{z:-3.1,spawnZ:-3.1});r.keeper.guard=guard;r.keeper.defending=true;r.attack(kind,direction);step(r,.29);return r;};
 const light=attempt('light');assert.equal(light.chain,0);assert.ok(light.events.some(e=>e.type==='guard-hit'));assert.equal(light.keeper.guard,86);
 for(const [kind,dir] of [['kick',-1],['grab',0]]){const r=attempt(kind,dir);assert.equal(r.chain,1);assert.ok(r.keeper.hp<990);}
 const heavy=attempt('heavy',0,40);assert.ok(heavy.keeper.guardBroken>0);assert.equal(heavy.keeper.guard,0);assert.ok(heavy.events.some(e=>e.type==='guard-break'));
});
test('perfect blocks open a launching counter; low attacks require a low guard',()=>{
 const r=setup();r.player.action='block';r.player.blockTime=.05;r.hurtPlayer(10,r.keeper);assert.ok(r.player.counterTime>0);r.attack('heavy');assert.equal(r.combat.active.move.id,'uppercut');step(r,.2);assert.ok(r.keeper.y>0);
 const low=setup();low.keeper.attackKind='low';low.player.action='block';low.player.blockTime=.05;low.hurtPlayer(10,low.keeper);assert.equal(low.player.hp,90);low.player.invulnerable=0;low.player.action='block';low.player.crouch=true;assert.equal(low.hurtPlayer(10,low.keeper),'parried');
});
test('throws require close range and specials do not spend charge without a target',()=>{
 const r=setup();r.keeper.z=-.5;r.attack('grab');step(r,.3);assert.equal(r.chain,0);r.combat.reset();r.momentum=100;r.keeper.z=-4;r.burst();assert.equal(r.momentum,100);assert.equal(r.combat.active,null);r.keeper.z=.7;assert.equal(r.burst(),true);assert.equal(r.momentum,0);assert.equal(r.chain,0);step(r,1.1);assert.equal(r.chain,3);assert.ok(r.keeper.y>0);assert.equal(r.burst(),false);
});
test('damage cancels buffered moves and bus changes clear all action recovery',()=>{
 const r=setup();r.attack();r.attack('heavy');r.hurtPlayer(10,r.keeper);assert.equal(r.combat.active,null);assert.equal(r.combat.queue.length,0);assert.equal(r.player.action,'hitstun');r.busChanged({to:'departing',full:false,number:1});assert.equal(r.player.action,'idle');assert.equal(r.player.cooldown,0);
});
test('rivals announce, approach the door and take the last seat without ending the run',()=>{
 const r=new Round('easy',()=>.5,{weapon:'baton',health:67});step(r,9.1);assert.ok(r.boardingRival);assert.ok(r.events.some(e=>e.type==='rival-boarding'));step(r,4);assert.equal(r.seatsLost,1);assert.equal(r.bus.full,true);assert.equal(r.bus.canBoard,false);assert.equal(r.status,'playing');assert.equal(r.player.hp,70);assert.equal(r.player.weapon,'baton');step(r,13);assert.equal(r.bus.canBoard,true);assert.equal(r.bus.number,2);
});
test('a hit or shove interrupts boarding and delays the next attempt',()=>{
 for(const method of ['attack','shove']){const r=new Round('easy',()=>.5);r.enemies=[r.keeper];Object.assign(r.keeper,{...DOOR,state:'boarding',boardProgress:.8});Object.assign(r.player,{x:DOOR.x,z:DOOR.z+1.1});r[method]();step(r,.15);assert.equal(r.boardingRival,null);assert.equal(r.keeper.boardProgress,0);assert.ok(r.raceClock>2.8);assert.equal(r.seatsLost,0);assert.ok(r.events.some(e=>e.type==='boarding-stopped'));}
});
test('contact on the final boarding tick interrupts before the seat is awarded',()=>{
 const r=new Round('easy',()=>.5);r.enemies=[r.keeper];Object.assign(r.keeper,{...DOOR,state:'boarding',boardProgress:.965});Object.assign(r.player,{x:DOOR.x,z:DOOR.z+1});r.attack();step(r,.12);assert.equal(r.seatsLost,0);assert.equal(r.boardingRival,null);
});
test('an uncontested doorway still lets the player board, and practice never loses its bus',()=>{
 const r=new Round('hard',()=>.5);Object.assign(r.player,{x:DOOR.x,z:DOOR.z+1});r.enemies=r.enemies.slice(0,3);r.shove();step(r,2,{board:true});assert.equal(r.status,'playing');for(const e of r.enemies)r.down(e);step(r,1.3,{board:true});assert.equal(r.status,'won');
 const practice=setup('hard',{practice:true});practice.player.hp=100;practice.hurtPlayer(999,practice.keeper);assert.equal(practice.player.hp,100);practice.down(practice.keeper);step(practice,2.6);assert.ok(practice.keeper.hp>0);practice.player.x=8;practice.player.z=7;step(practice,60);assert.equal(practice.seatsLost,0);assert.equal(practice.bus.canBoard,true);assert.equal(practice.status,'playing');
});
