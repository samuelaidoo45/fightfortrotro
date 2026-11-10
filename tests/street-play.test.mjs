import test from 'node:test';
import assert from 'node:assert/strict';
import {Round,HomeRun,DOOR} from '../dist/core.js';
import {CityJourney,ENCOUNTERS} from '../dist/campaign.js';
const tick=(r,t,input={})=>{for(let i=0;i<Math.ceil(t/.02);i++)r.tick(.02,input);};
const quiet=()=>{const r=new Round('normal',()=>.5);r.enemies.forEach(e=>e.timer=100);return r;};

test('trolley requires proximity and stamina, rolls through multiple rivals and hits each once',()=>{
 const r=quiet(),s=r.street,cart=s.props[0];assert.equal(s.activate(),false);Object.assign(r.player,{x:cart.x,z:cart.z+.5});
 r.enemies=r.enemies.slice(0,2);r.enemies.forEach((e,i)=>Object.assign(e,{x:cart.x,z:cart.z-1-i,spawnX:cart.x,spawnZ:cart.z-1-i,timer:100}));
 r.player.stamina=9;assert.equal(s.activate(),false);r.player.stamina=100;const hp=r.enemies.map(e=>e.hp);assert.equal(s.activate(),true);assert.equal(s.activate(),false);tick(r,1.5);
 assert.equal(cart.hits.size,2);assert.equal(cart.state,'spent');assert.equal(s.wins,1);r.enemies.forEach((e,i)=>assert.equal(e.hp,hp[i]-42));
 assert.equal(s.activate(),false);r.busChanged({to:'arriving',number:2,full:false});assert.equal(cart.state,'ready');assert.equal(cart.x,cart.homeX);
});

test('water creates a seven-second trip zone and cannot repeatedly farm one rival',()=>{
 const r=quiet(),s=r.street,p=s.props[1];r.enemies=[r.keeper];Object.assign(r.player,{x:p.x,z:p.z+.5});Object.assign(r.keeper,{x:p.x+.9,z:p.z,spawnX:p.x+.9,spawnZ:p.z,timer:100});const hp=r.keeper.hp;
 assert.equal(s.activate(),true);tick(r,.1);assert.equal(r.keeper.hp,hp-14);assert.ok(r.keeper.tripTime>0);tick(r,1);assert.equal(r.keeper.hp,hp-14);assert.equal(s.wins,1);tick(r,7);assert.equal(p.state,'spent');
});

test('a missed trick awards no dare, damage or special charge',()=>{
 const r=quiet(),s=r.street,p=s.props[0];r.enemies=[];Object.assign(r.player,p);const meter=r.momentum;s.activate();tick(r,1.5);assert.equal(s.wins,0);assert.equal(r.momentum,meter);
});

test('crowd dares require distinct connected moves, pause outside combat, and cycle after success',()=>{
 const r=quiet(),s=r.street;s.index=2;s.record('move','jab');s.record('move','cross');s.record('move','jab');assert.equal(s.progress,1);s.record('move','kick');s.record('move','throw');assert.equal(s.wins,1);assert.equal(s.intermission,3);
 s.record('move','heavy');assert.equal(s.wins,1);r.bus.phase='waiting';const time=s.intermission;s.tick(1);assert.equal(s.intermission,time);r.bus.phase='boarding';s.tick(3);assert.equal(s.dare.kind,'defence');assert.equal(s.progress,0);
 s.time=.1;s.tick(.2);assert.equal(s.dare.kind,'finisher');assert.equal(s.streak,0);
});

test('crowd dares grant rewards but never bypass the requirement to defeat every rival',()=>{
 for(const encounter of ENCOUNTERS){const r=new Round('easy',()=>.5,{encounter});r.street.record('trick');r.street.tick(3);r.street.record('throw');assert.equal(r.street.wins,2);assert.equal(r.encounterComplete,false);
 for(const e of r.enemies){e.state='recover';e.timer=10;}Object.assign(r.player,DOOR);tick(r,1.2,{board:true});assert.equal(r.status,'playing');for(const e of r.enemies)r.down(e);tick(r,1.2,{board:true});assert.equal(r.status,'won');}
});

test('critical-health comeback grants one special and brief protection, never revives a defeated player',()=>{
 const r=quiet();r.player.hp=24;r.momentum=0;r.street.tick(.02);assert.equal(r.momentum,100);assert.ok(r.player.invulnerable>=1);assert.equal(r.player.hp,24);r.momentum=0;r.street.tick(.02);assert.equal(r.momentum,0);assert.equal(r.events.filter(e=>e.type==='comeback').length,1);
 const dead=quiet();dead.player.hp=0;dead.momentum=0;dead.street.tick(.02);assert.equal(dead.momentum,0);
});

test('dodge cancels recovery after contact, but not startup or the cinematic special',()=>{
 const r=quiet();r.enemies=[r.keeper];Object.assign(r.player,{x:0,z:0});Object.assign(r.keeper,{x:0,z:-1,spawnX:0,spawnZ:-1,timer:100});r.attack('heavy');assert.equal(r.dodge(1,0),false);tick(r,.3);assert.ok(r.combat.active);assert.equal(r.dodge(1,0),true);assert.equal(r.combat.active,null);assert.equal(r.player.action,'dodge');
 tick(r,.4);r.momentum=100;Object.assign(r.player,{x:0,z:0});r.burst();tick(r,.3);assert.equal(r.dodge(1,0),false);
});

test('a connected throw advances the live dare, but a whiff does not',()=>{
 const r=quiet();r.street.index=1;r.enemies=[r.keeper];Object.assign(r.player,{x:0,z:2});Object.assign(r.keeper,{x:0,z:-2,spawnX:0,spawnZ:-2,timer:100});r.attack('grab');tick(r,1);assert.equal(r.street.wins,0);Object.assign(r.player,{x:0,z:-.7});r.attack('grab');tick(r,.3);assert.equal(r.street.wins,1);
});

test('real runs shorten replacement-bus transit while keeping the initial preparation and boarding window',()=>{
 for(const run of [new HomeRun(),new CityJourney({seed:'pace'})]){const r=run.createRound();assert.equal(r.bus.remaining,3.6);const window=r.bus.window;tick(r,3.7);assert.ok(r.combatActive);r.rivalTakesSeat(r.enemies[1]);assert.ok(r.bus.arrivalIn<7);tick(r,6.5);assert.ok(r.combatActive);assert.equal(r.bus.window,window);}
});

test('practice has no props, crowd-dare rewards or comeback boosts',()=>{
 const r=new Round('normal',()=>.5,{practice:true});assert.equal(r.street.props.length,0);r.street.record('trick');assert.equal(r.street.wins,0);r.player.hp=20;r.momentum=0;r.street.tick(.02);assert.equal(r.momentum,0);
});

test('rivals read repeated jabs but low sweeps break the predictable pattern',()=>{
 const r=quiet();r.enemies=[r.keeper];Object.assign(r.player,{x:0,z:0});Object.assign(r.keeper,{x:0,z:-1,spawnX:0,spawnZ:-1,hp:500,maxHp:500,timer:100});
 const hit=(kind,direction=0)=>{r.player.stamina=100;r.combat.reset();r.keeper.timer=100;const before=r.keeper.hp;r.attack(kind,direction);tick(r,.24);return before-r.keeper.hp;};
 hit('light');hit('light');hit('light');const guarded=hit('light');assert.ok(guarded<5);assert.ok(r.keeper.guard<100);const swept=hit('kick',-1);assert.ok(swept>10);assert.equal(r.keeper.readUntil,0);
});
