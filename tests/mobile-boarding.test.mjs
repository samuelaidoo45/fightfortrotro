import test from 'node:test';
import assert from 'node:assert/strict';
import {Round,DOOR,MODES} from '../dist/core.js';
import {WINDOW} from '../dist/layout.js';
import {contextAction,stickVector,arrivalCall} from '../dist/mobile.js';
const tick=(r,t,input={})=>{for(let i=0;i<Math.ceil(t/.02);i++)r.tick(.02,input);};
const cleared=()=>{const r=new Round('easy',()=>.5);for(const e of r.enemies)r.down(e);Object.assign(r.player,WINDOW);return r;};

test('defeated rivals stay down until the next vehicle replaces the crowd',()=>{
 const r=cleared(),old=r.enemies;Object.assign(r.player,{x:8,z:7});tick(r,12);assert.ok(r.enemies.every(e=>e.hp===0&&e.state==='down'));assert.equal(r.encounterComplete,true);while(r.bus.number===1)r.tick(.02);assert.equal(r.crowdNumber,2);assert.ok(r.enemies.every(e=>e.hp===e.maxHp&&!old.includes(e)));assert.equal(r.encounterComplete,false);assert.equal(r.encounterProgress,0);assert.equal(r.seatsLost,0);
});

test('the door is locked and an early window attempt cannot win',()=>{
 const r=new Round('easy',()=>.5);r.street.wins=2;for(const e of r.enemies.slice(1))r.down(e);r.keeper.state='recover';r.keeper.timer=100;Object.assign(r.player,DOOR);tick(r,2,{board:true});assert.equal(r.status,'playing');assert.equal(r.board,0);Object.assign(r.player,WINDOW);r.window.distracted=10;assert.equal(r.window.jump(),true);tick(r,1.7);assert.equal(r.status,'playing');assert.equal(r.window.active,null);
});
test('a watching conductor rebuffs the player without draining health rapidly',()=>{
 const r=cleared();assert.equal(r.window.watching,true);assert.equal(r.window.jump(),false);assert.equal(r.player.hp,94);assert.ok(r.player.z>WINDOW.z+.9);Object.assign(r.player,WINDOW);r.window.jump();assert.equal(r.player.hp,94);assert.equal(r.events.filter(e=>e.type==='mate-rebuff').length,1);
});
test('shoving the conductor opens a window vault with a visible arc and a real win',()=>{
 const r=cleared();assert.equal(contextAction(r).label,'Shove mate');assert.equal(r.shove(),true);assert.ok(r.window.distracted>0);tick(r,.6);assert.equal(contextAction(r).kind,'vault');assert.equal(r.window.jump(),true);tick(r,.4);assert.equal(r.status,'playing');assert.ok(r.player.y>1);assert.equal(r.player.action,'vault');tick(r,1.3);assert.equal(r.status,'won');assert.equal(r.boardedVia,'window');assert.ok(r.player.z<WINDOW.z);
});
test('waiting until the conductor looks away allows a vault without shoving',()=>{
 const r=cleared();r.elapsed=4;assert.equal(r.window.watching,false);assert.equal(r.window.jump(),true);tick(r,1.7);assert.equal(r.status,'won');
});
test('a departing or full bus cannot be boarded through its window',()=>{
 const r=cleared();r.elapsed=4;r.bus.full=true;assert.equal(r.window.jump(),false);r.bus.full=false;r.window.jump();r.bus.phase='departing';tick(r,.02);assert.equal(r.window.active,null);assert.equal(r.player.y,0);assert.ok(r.player.z>=WINDOW.z);assert.equal(r.status,'playing');
});
test('vaulting requires stamina and prevents attacks or dodges during the jump',()=>{
 const r=cleared();r.elapsed=4;r.player.stamina=19;assert.equal(r.window.jump(),false);r.player.stamina=100;r.window.jump();assert.equal(r.dodge(),false);assert.equal(r.shove(),false);r.momentum=100;assert.equal(r.burst(),false);assert.equal(r.player.stamina,80);
});
test('context action chooses tricks, pickups, combat and clear-door boarding',()=>{
 const r=new Round();Object.assign(r.player,r.street.props[0]);assert.equal(contextAction(r).kind,'pickup');Object.assign(r.player,r.pickups[0]);assert.equal(contextAction(r).kind,'pickup');Object.assign(r.player,DOOR);r.nearDoor=true;assert.notEqual(contextAction(r).kind,'board');for(const e of r.enemies)r.down(e);assert.equal(contextAction(r).kind,'board');
});
test('thumbstick has a dead zone and bounded movement in camera-relative directions',()=>{
 assert.deepEqual(stickVector(2,2),{x:0,z:0,knobX:0,knobY:0});const up=stickVector(0,-44);assert.ok(up.x<0&&up.z<0);const right=stickVector(44,0);assert.ok(right.x>0&&right.z<0);const far=stickVector(999,999);assert.ok(Math.hypot(far.x,far.z)<1.01);assert.ok(Math.hypot(far.knobX,far.knobY)<=44.01);
});
test('health tuning lowers enemy damage and recovery requires a safe break',()=>{
 const r=new Round('normal',()=>.5,{health:40});assert.equal(r.config.damage,MODES.normal.damage*.65);Object.assign(r.player,{x:8,z:7});r.lastDamage=0;tick(r,3);assert.equal(r.player.hp,40);tick(r,2);assert.ok(r.player.hp>40&&r.player.hp<45);tick(r,15);assert.equal(r.player.hp,70);
});
test('repeated incoming swings share a longer damage protection window',()=>{
 const r=new Round();r.hurtPlayer(10,r.keeper);assert.equal(r.player.hp,90);assert.equal(r.player.invulnerable,.65);r.hurtPlayer(10,r.keeper);assert.equal(r.player.hp,90);
});
test('holding the simplified Fight control confirms combos rather than only repeating jab',()=>{
 const r=new Round('easy',()=>.5);r.enemies=[r.keeper];Object.assign(r.player,{x:0,z:0});Object.assign(r.keeper,{x:0,z:-1,spawnX:0,spawnZ:-1,timer:100,hp:500,maxHp:500});tick(r,1.4,{assist:true});assert.ok(r.events.some(e=>e.type==='finisher'));assert.ok(r.keeper.hp<450);
});
test('mate arrival shouts use the destination and distinguish full buses',()=>{
 assert.match(arrivalCall('CIRCLE — MADINA'),/MADINA! MADINA! Last seat/);assert.match(arrivalCall('KANESHIE — ACCRA',true),/ACCRA! Full!/);
});

test('a nearby rival telegraphs a grab and pulls a climbing player back onto the pavement',()=>{
 const r=new Round('easy',()=>.5);r.elapsed=4;Object.assign(r.player,WINDOW);for(const e of r.enemies)Object.assign(e,{state:'recover',timer:100});const e=r.enemies[2];Object.assign(e,{x:WINDOW.x-.7,z:WINDOW.z+.2,state:'guard'});assert.equal(r.window.jump(),true);tick(r,.1);assert.equal(e.state,'pulling');assert.ok(r.events.some(e=>e.type==='window-grab'));tick(r,.6);assert.equal(r.window.active,null);assert.equal(r.player.y,0);assert.equal(r.player.hp,95);assert.equal(r.status,'playing');assert.ok(r.events.some(e=>e.type==='window-pulled'));
});
for(const input of ['assist','attack'])test(`${input} held kicks away a grabber but cannot skip winning the fight`,()=>{
 const r=new Round('easy',()=>.5);r.elapsed=4;Object.assign(r.player,WINDOW);for(const e of r.enemies)Object.assign(e,{state:'recover',timer:100});const e=r.enemies[2];Object.assign(e,{x:WINDOW.x-.7,z:WINDOW.z+.2,state:'guard'});r.window.jump();tick(r,.1);assert.equal(contextAction(r).kind,'window-kick');tick(r,1.7,{[input]:true});assert.equal(r.status,'playing');assert.equal(r.window.active,null);assert.equal(r.boardedVia,undefined);assert.equal(r.encounterComplete,false);assert.ok(r.events.some(e=>e.type==='window-kick'));
});
test('rivals alternate between door and window and a window climber can be pulled down',()=>{
 const r=new Round('easy',()=>.5);r.enemies=[r.enemies[1]];r.raceClock=0;tick(r,.02);assert.equal(r.boardingRival.boardRoute,'door');r.strikeEnemy(r.boardingRival,1,0,.1);tick(r,3.4);const e=r.boardingRival;assert.equal(e.boardRoute,'window');Object.assign(e,WINDOW);tick(r,.02);assert.equal(e.state,'boarding');tick(r,1.5);assert.ok(e.y>0);Object.assign(r.player,{x:WINDOW.x,z:WINDOW.z+.7});assert.equal(contextAction(r).label,'Pull rival down');assert.equal(r.attack('grab'),true);tick(r,.3);assert.notEqual(e.state,'boarding');assert.equal(e.boardProgress,0);assert.ok(r.stats.interrupts>=2);
});
test('a rival can steal the seat through the window and cancels a concurrent player vault',()=>{
 const r=new Round('easy',()=>.5);r.elapsed=4;const e=r.enemies[1];Object.assign(e,{...WINDOW,state:'boarding',boardRoute:'window',boardProgress:.99});Object.assign(r.player,WINDOW);r.window.jump();tick(r,.1);assert.equal(r.seatsLost,1);assert.equal(r.bus.full,true);assert.equal(r.window.active,null);assert.equal(r.player.y,0);assert.equal(r.status,'playing');assert.equal(e.state,'boarded');
});
