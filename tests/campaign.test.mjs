import test from 'node:test';
import assert from 'node:assert/strict';
import {CityJourney,ENCOUNTERS} from '../dist/campaign.js';
import {Round,DOOR,distance} from '../dist/core.js';
import {CONDITIONS,cleanProfile,awardRound} from '../dist/journey.js';
const tick=(r,t,input={})=>{for(let i=0;i<Math.ceil(t/.02);i++)r.tick(.02,input);};
const finish=(j)=>{const r=j.createRound();r.finish('won');j.record(r);return r;};
const choose=(j)=>{assert.equal(j.chooseUpgrade(j.offers[0].id),true);if(j.upgrades.length===3)j.chooseReplacement(j.upgrades[0]);};

test('a City Journey has eighteen encounters across six districts with a distinct objective at each stop',()=>{
 const j=new CityJourney({seed:'route'});assert.equal(j.route.length,18);assert.equal(new Set(j.route.map(a=>a.id)).size,6);
 for(let i=0;i<18;i++){assert.equal(j.index,i);const r=finish(j);assert.equal(r.encounter.kind,ENCOUNTERS[i%3].kind);assert.equal(!!r.captain,i%3===2);assert.equal(j.complete,i===17);if(i<17){choose(j);assert.ok(j.advance());}}
 assert.equal(j.history.length,18);assert.equal(j.canContinue,false);assert.equal(j.phase,'complete');
});

test('a shove-and-board shortcut cannot skip a campaign objective',()=>{
 for(const encounter of ENCOUNTERS.slice(0,2)){const r=new Round('easy',()=>.5,{encounter});Object.assign(r.player,{x:DOOR.x,z:DOOR.z+1});r.shove();tick(r,1.8,{board:true});assert.equal(r.board,0);assert.equal(r.status,'playing');assert.equal(r.encounterComplete,false);}
});

test('every rival must be defeated, and progress persists through bus changes',()=>{
 const r=new Round('easy',()=>.5,{encounter:ENCOUNTERS[0]});r.down(r.enemies[1]);r.enemies[1].hp=10;r.down(r.enemies[1]);assert.equal(r.encounterProgress,1);r.down(r.enemies[2]);assert.equal(r.encounterComplete,false);
 r.busChanged({to:'boarding',full:false,number:2});assert.equal(r.encounterProgress,2);for(const e of r.enemies)if(e.hp>0)r.down(e);Object.assign(r.player,DOOR);tick(r,1.2,{board:true});assert.equal(r.status,'won');assert.equal(r.events.filter(e=>e.type==='encounter-cleared').length,1);
});

test('boarding interruptions buy time but every rival still needs defeating',()=>{
 const r=new Round('easy',()=>.5,{encounter:ENCOUNTERS[1],condition:CONDITIONS.find(c=>c.id==='duel')});assert.ok(r.enemies.length>=3);
 const [a,b,c]=r.enemies;a.state='boarding';r.strikeEnemy(a,1,0,.3);a.state='boarding';r.strikeEnemy(a,1,0,.3);assert.equal(r.encounterProgress,0);r.down(b);r.down(c);assert.equal(r.encounterComplete,false);r.down(a);assert.equal(r.encounterComplete,true);
});

test('captain showdowns cannot be bypassed while the captain is alive, and defeated captains stay defeated after a stolen seat',()=>{
 const j=new CityJourney({seed:'boss'});j.index=2;const r=j.createRound();assert.equal(r.encounterComplete,false);Object.assign(r.player,DOOR);for(const e of r.enemies){e.state='recover';e.timer=10;}tick(r,1.8,{board:true});assert.equal(r.status,'playing');r.down(r.keeper);assert.equal(r.encounterComplete,false);
 r.rivalTakesSeat(r.enemies[1]);assert.equal(r.keeper.timer,Infinity);tick(r,15);assert.equal(r.keeper.hp,0);assert.equal(r.encounterComplete,false);for(const e of r.enemies)if(e.hp>0)r.down(e);assert.equal(r.encounterComplete,true);
});

test('full three-slot builds require an explicit replacement, never accumulate all upgrades',()=>{
 const j=new CityJourney({seed:'slots'});for(let n=0;n<7;n++){finish(j);assert.equal(j.advance(),null);const selected=j.offers[0].id;j.chooseUpgrade(selected);if(j.upgrades.length===3){assert.equal(j.ready,false);assert.equal(j.advance(),null);const removed=j.upgrades[0];j.chooseReplacement(removed);j.advance();assert.ok(!j.upgrades.includes(removed));}else j.advance();assert.ok(j.upgrades.includes(selected));assert.ok(j.upgrades.length<=3);}
});

test('travel choices change recovery, initial special charge and actual risk/reward',()=>{
 for(const [choice,health] of [['rest',70],['charge',45],['risk',55]]){const j=new CityJourney({seed:'travel'}),r=j.createRound();r.player.hp=30;r.finish('won');j.record(r);choose(j);j.chooseTravel(choice);const next=j.advance();assert.equal(next.player.hp,health);if(choice==='charge')assert.equal(next.momentum,100);if(choice==='risk'){const base=new CityJourney({seed:'travel'});base.index=1;assert.ok(next.config.damage>base.createRound().config.damage);next.score=100;next.finish('knocked-out');assert.equal(next.score,130);}}
});

test('a defeat retries only the current encounter with a recovery floor and keeps banked progress',()=>{
 const j=new CityJourney({seed:'retry'});finish(j);choose(j);let r=j.advance();j.health=35;r.player.hp=0;r.score=500;r.finish('knocked-out');const score=j.score,gear=[...j.upgrades];j.record(r);assert.equal(j.phase,'retry');assert.equal(j.score,score);assert.equal(j.index,1);assert.equal(j.history.length,1);assert.deepEqual(j.upgrades,gear);r=j.retry();assert.equal(r.player.hp,70);assert.equal(j.index,1);assert.equal(r.score,0);
});

test('snapshots resume fight, travel choices, replacement choices, failure and final completion',()=>{
 const original=new CityJourney({seed:'persist',character:'market',mode:'hard',startId:'madina'});let r=original.createRound();r.player.hp=12; // Mid-fight save intentionally resumes at the stop boundary.
 let saved=CityJourney.restore(JSON.parse(JSON.stringify(original.snapshot())));assert.equal(saved.createRound().player.hp,100);assert.equal(saved.character.id,'market');assert.equal(saved.mode,'hard');assert.equal(saved.startId,'madina');
 r.finish('won');original.record(r);choose(original);original.chooseTravel('charge');saved=CityJourney.restore(original.snapshot());assert.equal(saved.phase,'travel');assert.equal(saved.selectedUpgrade,original.selectedUpgrade);assert.equal(saved.travel,'charge');assert.equal(saved.ready,true);assert.equal(saved.advance().momentum,100);
 const lost=saved.round;lost.finish('knocked-out');saved.record(lost);const retry=CityJourney.restore(saved.snapshot());assert.equal(retry.phase,'retry');assert.ok(retry.retry());assert.equal(retry.index,1);
 const complete=new CityJourney({seed:'done'});complete.index=17;finish(complete);assert.equal(CityJourney.restore(complete.snapshot()).complete,true);
});

test('loading an intermission does not reroll upgrades or award a result a second time',()=>{
 const j=new CityJourney({seed:'ledger'}),r=finish(j);const first=awardRound(cleanProfile(null),j,r);assert.ok(first);const loaded=CityJourney.restore(j.snapshot());assert.deepEqual(loaded.offers,j.offers);assert.equal(loaded.createRound(),null);
 const replay=new CityJourney({seed:'ledger'}),duplicate=finish(replay);assert.equal(awardRound(first.profile,replay,duplicate),null);assert.equal(first.profile.journeyBest,1);
 const loss=new CityJourney({seed:'failed'}),lost=loss.createRound();lost.finish('knocked-out');loss.record(lost);assert.equal(awardRound(first.profile,loss,lost),null);
});

test('Endless Commute passes the old three-stop and eighteen-stop endings with bounded encounters',()=>{
 const j=new CityJourney({kind:'endless',seed:'endless',mode:'hard'});for(let n=0;n<40;n++){const r=finish(j);assert.equal(j.complete,false);assert.ok(r.enemies.length<=10);assert.ok(r.config.hp<250);choose(j);j.advance();}
 assert.equal(j.index,40);const saved=CityJourney.restore(j.snapshot());assert.equal(saved.index,40);assert.equal(saved.arena.id,j.arena.id);assert.ok(saved.createRound());
});

test('campaign achievements survive profile reload and endless best is tracked separately',()=>{
 let profile=cleanProfile(null);const j=new CityJourney({seed:'achievement'});j.index=17;let r=finish(j);profile=awardRound(profile,j,r).profile;assert.equal(profile.campaignClears,1);assert.equal(profile.journeyBest,18);assert.ok(profile.badges.includes('city'));
 const e=new CityJourney({kind:'endless',seed:'achievement'});e.index=11;r=finish(e);profile=awardRound(profile,e,r).profile;assert.equal(profile.endlessBest,12);assert.ok(profile.badges.includes('endless'));assert.deepEqual(cleanProfile(JSON.parse(JSON.stringify(profile))),profile);
});

test('checkpoint validation rejects incompatible data and sanitizes loadout and counters',()=>{
 assert.equal(CityJourney.restore(null),null);assert.equal(CityJourney.restore({version:1,kind:'bad'}),null);const good=new CityJourney({seed:'validate'}).snapshot();for(const bad of [{version:2},{index:18},{index:-1},{kind:'oops'},{mode:'__proto__'},{character:'<script>'},{phase:'travel',index:17},{phase:'complete',index:0}])assert.equal(CityJourney.restore({...good,...bad}),null);
 const cleaned=CityJourney.restore({...good,score:'<script>',health:Infinity,upgrades:['brawler','brawler','tough','dancer','flow','bad'],history:[null,{stage:'bad'}]});assert.equal(cleaned.score,0);assert.equal(cleaned.health,100);assert.equal(cleaned.upgrades.length,3);assert.equal(cleaned.history.length,0);
});
