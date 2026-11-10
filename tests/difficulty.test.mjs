import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {Round,DOOR,distance} from '../dist/core.js';
import {CityJourney} from '../dist/campaign.js';
const modes=['easy','normal','hard'];
const increasing=values=>{assert.ok(values[0]<values[1]&&values[1]<values[2],JSON.stringify(values));};
const decreasing=values=>increasing([...values].reverse());
test('difficulty changes the crowd, actual strike damage and attack warning time',()=>{
 const counts=[],damage=[],warnings=[];
 for(const mode of modes){
  const r=new Round(mode,()=>.5);counts.push(r.enemies.length);r.enemies=[r.keeper];r.raceClock=100;Object.assign(r.player,{x:DOOR.x,z:DOOR.z+2});Object.assign(r.keeper,{x:DOOR.x,z:DOOR.z+1,timer:0});r.tick(.02);assert.equal(r.keeper.state,'windup');warnings.push(r.keeper.timer);r.keeper.timer=0;r.tick(.02);damage.push(100-r.player.hp);
 }
 increasing(counts);increasing(damage);decreasing(warnings);assert.ok(damage[0]>0);
});
test('rivals physically close the gap faster on higher difficulty',()=>{
 const movement=[];
 for(const mode of modes){const r=new Round(mode,()=>.5,{closeStart:true});r.enemies=[r.keeper];r.raceClock=100;Object.assign(r.keeper,{x:0,z:-3,timer:100});const before=distance(r.player,r.keeper);r.tick(.05);movement.push(before-distance(r.player,r.keeper));}
 increasing(movement);assert.ok(movement[0]>0);
});
test('harder modes give less boarding time and send rivals toward the seat sooner',()=>{
 const windows=[],rushTimes=[];
 for(const mode of modes){const r=new Round(mode,()=>.5);windows.push(r.bus.remaining);r.enemies=[r.keeper];r.keeper.timer=100;Object.assign(r.player,{x:8,z:7});while(!r.events.some(e=>e.type==='rival-boarding')&&r.elapsed<12)r.tick(.02);assert.ok(r.events.some(e=>e.type==='rival-boarding'));rushTimes.push(r.elapsed);}
 decreasing(windows);decreasing(rushTimes);
});
test('difficulty changes preserve checkpoint progress, gear and optional choices across reload',()=>{
 const j=new CityJourney({mode:'easy',seed:'difficulty-save'});j.upgrades=['tough'];const r=j.createRound();r.player.hp=43;r.player.weapon='stool';r.finish('won');j.record(r);j.chooseTravel('charge');j.chooseUpgrade(j.offers[0].id);
 const before=j.snapshot();assert.equal(j.setDifficulty('hard'),true);const loaded=CityJourney.restore(j.snapshot());const after=loaded.snapshot();assert.equal(after.mode,'hard');for(const key of ['index','score','health','weapon','upgrades','history','travel','selectedUpgrade'])assert.deepEqual(after[key],before[key]);const next=loaded.advance();assert.equal(next.mode,'hard');assert.equal(next.momentum,100);assert.equal(next.player.weapon,'stool');
});
test('invalid difficulty and mid-fight retuning are rejected',()=>{
 const j=new CityJourney({mode:'normal',seed:'difficulty-invalid'});assert.equal(j.setDifficulty('__proto__'),false);assert.equal(j.mode,'normal');j.createRound();assert.equal(j.setDifficulty('easy'),false);assert.equal(j.mode,'normal');
});
// Run the shipped Continue handler: this was the path that ignored Game Setup.
test('Continue applies an explicit difficulty choice to both City and Endless saves',()=>{
 const source=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8'),start=source.slice(source.indexOf('function startCity('),source.indexOf('function playRound('));
 for(const kind of ['campaign','endless'])for(const phase of ['fight','travel','retry']){
  const saved=new CityJourney({kind,mode:'easy',seed:'resume-'+phase});if(phase!=='fight'){const r=saved.createRound();r.finish(phase==='travel'?'won':'knocked-out');saved.record(r);}
  const c=vm.createContext({CityJourney,playMode:kind,savedJourneys:{[kind]:saved.snapshot()},mode:'hard',difficultyOverride:'hard',arena:{id:'circle'},characterId:'office',run:null,dailyRun:null,cityReward:'',saveJourney(){c.persisted=c.run.snapshot();},playRound(r){c.round=r;},showCityTravel(){c.travelShown=true;}});
  vm.runInContext(start+'\nstartCity();',c);assert.equal(c.run.mode,'hard');assert.equal(c.persisted.mode,'hard');assert.equal(c.difficultyOverride,null);assert.equal(c.run.phase,phase);if(phase==='fight')assert.equal(c.round.mode,'hard');else assert.equal(c.travelShown,true);
 }
});
test('resuming without a new selection preserves the saved difficulty',()=>{
 const source=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8'),start=source.slice(source.indexOf('function startCity('),source.indexOf('function playRound('));const saved=new CityJourney({mode:'hard',seed:'unchanged'});
 const c=vm.createContext({CityJourney,playMode:'campaign',savedJourneys:{campaign:saved.snapshot()},mode:'normal',difficultyOverride:null,arena:{id:'circle'},characterId:'office',run:null,dailyRun:null,cityReward:'',saveJourney(){},playRound(r){c.round=r;},showCityTravel(){}});vm.runInContext(start+'\nstartCity();',c);assert.equal(c.round.mode,'hard');assert.equal(c.mode,'hard');
});
