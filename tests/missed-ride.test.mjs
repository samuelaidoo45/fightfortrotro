import test from 'node:test';
import assert from 'node:assert/strict';
import {Round,MISSED_RIDE_DAMAGE} from '../dist/core.js';
import {WINDOW} from '../dist/layout.js';
const tick=(r,t)=>{for(let i=0;i<Math.ceil(t/.02);i++)r.tick(.02);};
const setup=options=>{const r=new Round('easy',()=>.5,options);r.enemies.forEach(e=>{e.state='recover';e.timer=100;});return r;};
test('missing an available bus costs five health exactly when it departs',()=>{
 const r=setup();r.bus.remaining=.1;r.tick(.05);assert.equal(r.player.hp,100);r.tick(.05);assert.equal(r.bus.phase,'departing');assert.equal(r.player.hp,100-MISSED_RIDE_DAMAGE);assert.equal(r.events.filter(e=>e.type==='missed-ride').length,1);tick(r,1);assert.equal(r.player.hp,95);
});
test('a stolen seat costs health on departure, not at the moment the rival boards',()=>{
 const r=setup();r.rivalTakesSeat(r.enemies[1]);assert.equal(r.player.hp,100);r.bus.remaining=.02;r.tick(.02);assert.equal(r.player.hp,95);assert.equal(r.lastMissedRide,1);
});
test('full arrivals do not punish the player, but the next missed available bus does',()=>{
 const r=setup({firstBusFull:true});r.bus.remaining=.02;r.tick(.02);assert.equal(r.player.hp,100);while(r.bus.number<2||!r.bus.canBoard)r.tick(.02);r.bus.remaining=.02;r.tick(.02);assert.equal(r.player.hp,95);assert.equal(r.lastMissedRide,2);
});
test('repeated departure notifications cannot charge health twice for one vehicle',()=>{
 const r=setup();const change={from:'boarding',to:'departing',number:1,full:false};r.busChanged(change);r.busChanged(change);assert.equal(r.player.hp,95);assert.equal(r.events.filter(e=>e.type==='missed-ride').length,1);r.busChanged({...change,number:2});assert.equal(r.player.hp,90);
});
test('missed ride damage ignores combat armour and dodge protection and resets the recovery delay',()=>{
 const r=setup({character:'builder',health:60});r.player.invulnerable=5;r.player.action='dodge';r.bus.remaining=.02;r.tick(.02);assert.equal(r.player.hp,55);tick(r,3.8);assert.equal(r.player.hp,55);tick(r,.5);assert.ok(r.player.hp>55&&r.player.hp<57);
});
test('missing a ride at low health ends once and cannot heal back into play',()=>{
 const r=setup({health:3});r.bus.remaining=.02;r.tick(.02);assert.equal(r.player.hp,0);assert.equal(r.status,'knocked-out');assert.equal(r.events.find(e=>e.type==='missed-ride').damage,3);tick(r,10);assert.equal(r.player.hp,0);assert.equal(r.events.filter(e=>e.type==='end').length,1);
});
test('a successful boarding and practice never incur a missed-ride penalty',()=>{
 const r=setup();r.finish('won');r.bus.remaining=.02;tick(r,2);assert.equal(r.player.hp,100);assert.equal(r.missRide(1),false);const p=new Round('easy',()=>.5,{practice:true});assert.equal(p.missRide(1),false);p.bus.remaining=.02;tick(p,1);assert.equal(p.player.hp,100);
});
test('departure interrupts a window climb and applies only the missed-ride cost',()=>{
 const r=setup();r.elapsed=4;Object.assign(r.player,WINDOW);r.window.jump();assert.ok(r.window.active);r.bus.remaining=.02;r.tick(.02);assert.equal(r.window.active,null);assert.equal(r.player.y,0);assert.equal(r.player.hp,95);assert.equal(r.status,'playing');
});
