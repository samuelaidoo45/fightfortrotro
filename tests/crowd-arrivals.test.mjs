import test from 'node:test';
import assert from 'node:assert/strict';
import {Round,DOOR} from '../dist/core.js';
import {Stage} from '../dist/stage.js';
import * as T from '../dist/vendor/three.module.js';
const arrive=(r,number,full=false)=>{r.bus.number=number;r.bus.phase='arriving';r.bus.full=full;r.busChanged({to:'arriving',number,full});};
test('each new arrival clears old crowd state but preserves the player and earned totals',()=>{
 const r=new Round('normal',()=>.5,{weapon:'bag',health:63});for(const e of r.enemies)r.down(e);r.encounterAnnounced=true;r.board=.8;r.combat.targetId=r.enemies[0].id;r.combat.manualUntil=99;
 const old=r.enemies,score=r.score,kos=r.kos,meter=r.momentum;arrive(r,2);
 assert.equal(r.enemies.length,r.config.count);assert.ok(r.enemies.every(e=>!old.includes(e)&&!old.some(o=>o.id===e.id)&&e.hp===e.maxHp&&e.state==='guard'));
 assert.notDeepEqual(r.enemies.map(e=>e.character),old.map(e=>e.character));assert.notDeepEqual(r.enemies.map(e=>e.weapon),old.map(e=>e.weapon));
 assert.equal(r.defeated.size,0);assert.equal(r.stopped.size,0);assert.equal(r.encounterProgress,0);assert.equal(r.encounterComplete,false);assert.equal(r.encounterAnnounced,false);assert.equal(r.board,0);assert.equal(r.combat.targetId,null);assert.equal(r.combat.manualUntil,0);
 assert.equal(r.player.hp,63);assert.equal(r.player.weapon,'bag');assert.equal(r.score,score);assert.equal(r.kos,kos);assert.equal(r.momentum,meter);
});
test('initial arrival and repeated phase notifications do not replace the same crowd twice',()=>{
 const r=new Round('easy',()=>.5,{startWaiting:true}),first=r.enemies;arrive(r,1);assert.equal(r.enemies,first);arrive(r,2);const second=r.enemies;arrive(r,2);r.busChanged({to:'boarding',number:2,full:false});assert.equal(r.enemies,second);assert.equal(r.events.filter(e=>e.type==='crowd-arrived').length,1);
});
test('a full replacement brings waiting passengers who cannot fight or board',()=>{
 const r=new Round('easy',()=>.5);arrive(r,2,true);const hp=r.enemies.map(e=>e.hp);for(let i=0;i<50;i++)r.tick(.02,{attack:true,board:true});assert.deepEqual(r.enemies.map(e=>e.hp),hp);assert.equal(r.player.hp,100);assert.equal(r.board,0);assert.equal(r.combatActive,false);
});
test('many replacement crowds remain bounded and spawn inside the waiting area',()=>{
 const r=new Round('hard',()=>.5,{startWaiting:true});const ids=new Set();for(let n=1;n<=80;n++){arrive(r,n);assert.equal(r.enemies.length,r.config.count);for(const e of r.enemies){assert.ok(!ids.has(e.id));ids.add(e.id);assert.ok(e.z>=1.4&&e.z<=2.75);assert.ok(e.x>=-5.7&&e.x<=-.8);}}
});
test('replacement crowds relock the seat until the new fight is won',()=>{
 const r=new Round('easy',()=>.5);for(const e of r.enemies)r.down(e);assert.equal(r.encounterComplete,true);arrive(r,2);r.bus.phase='boarding';r.bus.full=false;Object.assign(r.player,DOOR);r.enemies.forEach(e=>{e.timer=100;});for(let i=0;i<60;i++)r.tick(.02,{board:true,block:true});assert.equal(r.board,0);assert.equal(r.status,'playing');
});
test('replacing the rendered crowd removes old meshes while retaining player and pickup scene objects',()=>{
 const r=new Round('easy',()=>.5),stage=Object.create(Stage.prototype);stage.dynamic=new T.Group();stage.actors=[];stage.materials={};stage.humans={geometries:new Set(),materials:new Map()};stage.character=()=>({group:new T.Group(),hpGroup:new T.Group()});stage.label=()=>new T.MeshBasicMaterial();const player=new T.Group(),pickup=new T.Group();stage.dynamic.add(player,pickup);
 stage.replaceCrowd(r);const old=stage.actors.map(a=>a.group);arrive(r,2);stage.replaceCrowd(r);assert.ok(old.every(g=>g.parent===null));assert.equal(stage.dynamic.children.length,r.config.count+2);assert.ok(stage.dynamic.children.includes(player)&&stage.dynamic.children.includes(pickup));assert.equal(stage.crowdNumber,2);for(let n=3;n<12;n++){arrive(r,n);stage.replaceCrowd(r);}assert.equal(stage.dynamic.children.length,r.config.count+2);
});
