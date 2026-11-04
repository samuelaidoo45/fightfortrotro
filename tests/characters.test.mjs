import test from 'node:test';
import assert from 'node:assert/strict';
import {CHARACTERS,characterById} from '../dist/characters.js';
import {HomeRun,Round,WEAPONS} from '../dist/core.js';
test('ten distinct characters have individual rigs, clear perks and valid starting items',()=>{
 assert.equal(CHARACTERS.length,10);assert.equal(new Set(CHARACTERS.map(c=>c.id)).size,10);assert.equal(new Set(CHARACTERS.map(c=>c.model)).size,10);assert.equal(characterById('invalid').id,'office');for(const c of CHARACTERS){assert.ok(c.name&&c.role&&c.detail&&c.perk);assert.ok(c.item===null||WEAPONS[c.item]);}
});
test('chosen appearance, equipment and health bonus carry through the whole home run',()=>{
 for(const c of CHARACTERS){const run=new HomeRun('easy','circle',()=>.5,c.id);let r=run.createRound();assert.equal(r.player.character,c.id);assert.equal(r.player.weapon,c.item);r.player.weapon='stool';r.player.hp=50;r.finish('won');run.record(r);r=run.advance();assert.equal(r.player.character,c.id);assert.equal(r.player.weapon,'stool');assert.equal(r.player.hp,50+(c.heal||25));assert.equal(r.pickups.find(p=>p.type==='stool').used,true);}
});
test('mobility, defence, stamina, kicks and meter bonuses change actual play',()=>{
 const base=new Round(),pupil=new Round('normal',()=>.5,{character:'schoolboy'});base.enemies=[];pupil.enemies=[];const x=base.player.x;base.tick(.05,{x:1});pupil.tick(.05,{x:1});assert.ok(pupil.player.x-x>base.player.x-x);
 const builder=new Round('normal',()=>.5,{character:'builder'});builder.hurtPlayer(20,builder.keeper);assert.equal(builder.player.hp,82.4);
 const office=new Round('normal',()=>.5,{character:'office'});office.momentum=0;office.gainMomentum(20);assert.equal(office.momentum,23);
 const mechanic=new Round('normal',()=>.5,{character:'mechanic'}),sameWeapon=new Round('normal',()=>.5,{weapon:'baton'});mechanic.attack();sameWeapon.attack();assert.ok(mechanic.player.stamina>sameWeapon.player.stamina);
 const athlete=new Round('normal',()=>.5,{character:'footballer'});athlete.attack('kick');base.attack('kick');assert.ok(athlete.combat.active.move.damage>base.combat.active.move.damage);
 const rider=new Round('normal',()=>.5,{character:'rider'});rider.dodge();assert.equal(rider.player.stamina,85.75);
 const girl=new Round('normal',()=>.5,{character:'schoolgirl'});girl.player.stamina=50;base.player.stamina=50;base.combat.reset();girl.tick(.05);base.player.rest=0;base.tick(.05);assert.ok(girl.player.stamina>base.player.stamina);
});
