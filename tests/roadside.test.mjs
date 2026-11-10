import test from 'node:test';
import assert from 'node:assert/strict';
import {Round,HomeRun,BUS_TIMING,DOOR,distance} from '../dist/core.js';
import {STOP,PAVEMENT,busPose} from '../dist/layout.js';
const step=(r,n,input={})=>{for(let i=0;i<Math.ceil(n/.02);i++)r.tick(.02,input);};

test('a home run starts with a safe preparation period, then a crowd forms before the door opens',()=>{
  const r=new HomeRun('normal','circle',()=>.9).createRound();
  assert.equal(r.bus.phase,'arriving');assert.equal(r.bus.full,false);assert.equal(r.attack(),false);assert.equal(r.shove(),false);
  Object.assign(r.player,DOOR);step(r,BUS_TIMING.arriving-.1,{board:true});
  assert.equal(r.bus.phase,'arriving');assert.equal(r.board,0);assert.equal(r.player.hp,100);
  assert.ok(r.enemies.filter(e=>distance(e,{x:e.spawnX,z:e.spawnZ})<.2).length>=3);
  step(r,.12);assert.equal(r.bus.number,1);assert.equal(r.combatActive,true);assert.equal(r.doorBlocked,true);
});

test('a clean shove cannot bypass living rivals on any difficulty',()=>{
  for(const mode of ['easy','normal','hard']){
    const r=new Round(mode,()=>.5);Object.assign(r.player,{x:DOOR.x,z:DOOR.z+1});
    assert.equal(r.doorBlocked,true);assert.equal(r.shove(),true);assert.equal(r.doorBlocked,false);
    step(r,.35,{z:-1});step(r,1.8,{board:true});assert.equal(r.status,'playing',mode);assert.equal(r.board,0);assert.equal(r.kos,0);assert.ok(r.keeper.hp>0);
  }
});

test('a missed opening closes when defenders recover, without them chasing the player',()=>{
  const r=new Round('normal',()=>.5);Object.assign(r.player,{x:DOOR.x,z:DOOR.z+1});r.shove();
  assert.equal(r.doorBlocked,false);Object.assign(r.player,{x:8,z:7});step(r,6);
  assert.equal(r.doorBlocked,true);assert.equal(r.player.hp,100);
  assert.ok(r.enemies.every(e=>distance(e,{x:e.spawnX,z:e.spawnZ})<.2));
});

test('full arrivals keep passengers waiting and cannot consume a boarding attempt',()=>{
  const r=new Round('easy',()=>0,{firstBusFull:true,startWaiting:true});Object.assign(r.player,DOOR);
  step(r,BUS_TIMING.waiting+BUS_TIMING.arriving+.5,{board:true,attack:true});
  assert.equal(r.bus.phase,'full');assert.equal(r.board,0);assert.equal(r.kos,0);assert.equal(r.player.hp,100);
  assert.ok(r.enemies.every(e=>distance(e,r.waitingPost(e))<.1));
});

test('the parallel bus and door use the same world coordinates',()=>{
  const pose=busPose('boarding');assert.equal(pose.yaw,-Math.PI/2);
  assert.ok(Math.abs(pose.x+Math.sin(pose.yaw)*.98+Math.cos(pose.yaw)*2.05-DOOR.x)<1e-6);
  assert.ok(Math.abs(pose.z+Math.cos(pose.yaw)*.98-Math.sin(pose.yaw)*2.05-DOOR.z)<1e-6);
  assert.ok(DOOR.z>=PAVEMENT.minZ);
});

test('arrival decelerates into the bay and departure stays clear of the waiting pavement',()=>{
  let previous=Infinity;
  for(let i=0;i<=100;i++){
    const arriving=busPose('arriving',i/100),leaving=busPose('departing',i/100);
    assert.ok(arriving.x<=previous);previous=arriving.x;
    assert.ok(arriving.z+1.7<PAVEMENT.minZ);assert.ok(leaving.z+1.7<PAVEMENT.minZ);
  }
  assert.deepEqual(busPose('arriving',1),{...STOP});
  assert.ok(distance(busPose('departing',0),STOP)<1e-6);
  const early=busPose('arriving',0).x-busPose('arriving',.1).x;
  const late=busPose('arriving',.9).x-busPose('arriving',1).x;
  assert.ok(early>late*10);
});
