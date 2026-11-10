import test from 'node:test';
import assert from 'node:assert/strict';
import {Round,HomeRun,DOOR,MODES} from '../dist/core.js';
import {CONDITIONS,CAPTAINS,UPGRADES,seededRandom,dailyRoute,upgradeEffects,cleanProfile,awardRound,rankFor,masteryFor} from '../dist/journey.js';
const step=(r,s,input={})=>{for(let t=0;t<s;t+=.02)r.tick(.02,input);};
const dummy=(options={})=>{const r=new Round('easy',()=>.5,options);r.enemies=[r.keeper];Object.assign(r.player,{x:0,z:0});Object.assign(r.keeper,{x:0,z:1,spawnX:0,spawnZ:1,hp:1000,maxHp:1000,timer:100});return r;};

test('daily route repeats fighter, conditions, offers and AI seed without touching global randomness',()=>{
  const date=new Date('2026-11-04T10:30:00Z'),d=dailyRoute(date);
  assert.deepEqual(d,dailyRoute(new Date('2026-11-04T23:59:59Z')));assert.notEqual(d.seed,dailyRoute(new Date('2026-11-05T00:00:00Z')).seed);
  const a=new HomeRun('normal','circle',seededRandom(d.seed),d.fighter,{daily:d.day}),b=new HomeRun('normal','circle',seededRandom(d.seed),d.fighter,{daily:d.day});
  assert.deepEqual(a.conditions,b.conditions);assert.equal(new Set(a.conditions.map(c=>c.id)).size,3);assert.deepEqual(a.captain,b.captain);
  const r=a.createRound(),q=b.createRound();assert.deepEqual(r.enemies,q.enemies);r.finish('won');q.finish('won');a.record(r);b.record(q);assert.deepEqual(a.offers,b.offers);
});

test('every run begins with a guaranteed usable arrival in under four seconds',()=>{
  for(const mode of Object.keys(MODES))for(let seed=0;seed<20;seed++){const r=new HomeRun(mode,'circle',seededRandom(seed),'office').createRound();assert.equal(r.bus.phase,'arriving');assert.equal(r.bus.full,false);step(r,3.7);assert.equal(r.bus.canBoard,true);assert.equal(r.player.hp,100);assert.equal(r.status,'playing');}
});

test('winning offers three distinct unowned upgrades; one choice carries for the rest of the run',()=>{
  const run=new HomeRun('easy','circle',seededRandom(2),'market'),r=run.createRound();assert.equal(run.chooseUpgrade('crowd'),false);r.finish('won');run.record(r);assert.equal(run.offers.length,3);assert.equal(new Set(run.offers.map(u=>u.id)).size,3);assert.equal(run.chooseUpgrade('unknown'),false);
  const picked=run.offers[0].id;assert.equal(run.chooseUpgrade(picked),true);const next=run.advance();assert.deepEqual(next.upgrades,[picked]);assert.equal(next.player.character,'market');next.finish('won');run.record(next);assert.ok(run.offers.every(u=>u.id!==picked));run.chooseUpgrade(run.offers[0].id);const last=run.advance();assert.equal(last.upgrades.length,2);assert.equal(last.captain.id,run.captain.id);assert.ok(last.keeper.captain);
});

test('damage, stamina, guard, boarding and movement upgrades change actual combat',()=>{
  const base=dummy(),brawler=dummy({upgrades:['brawler']});base.attack();brawler.attack();step(base,.12);step(brawler,.12);assert.ok(brawler.keeper.hp<base.keeper.hp);
  const dancer=dummy({upgrades:['dancer']}),plain=dummy();dancer.dodge(1,0);plain.dodge(1,0);assert.ok(dancer.player.stamina>plain.player.stamina);
  const tough=dummy({upgrades:['tough']}),t=100;tough.hurtPlayer(20,tough.keeper);assert.equal(tough.player.hp,t-16);
  const crowd=dummy({upgrades:['crowd']});crowd.shove();assert.equal(crowd.player.shoveCooldown,2.4);const ordinary=dummy();ordinary.shove();assert.ok(crowd.keeper.z>ordinary.keeper.z);
  const guard=dummy({upgrades:['counter']});guard.player.action='block';guard.player.blockTime=.28;assert.equal(guard.hurtPlayer(20,guard.keeper),'parried');
  const seat=dummy({upgrades:['seat']});assert.equal(seat.config.boardTime,.75);
  const showtime=dummy({upgrades:['showtime']});assert.equal(showtime.momentum,65);showtime.gainMomentum(10);assert.equal(showtime.momentum,78.5);
  const runner=dummy({upgrades:['dancer']}),walker=dummy();runner.enemies=[];walker.enemies=[];step(runner,.5,{x:1});step(walker,.5,{x:1});assert.ok(runner.player.x>walker.player.x);
  assert.equal(upgradeEffects(['tough','tough']).armor,.8);
});

test('finisher rewards are once per confirmed move; no rewards for whiffs',()=>{
  const r=dummy({upgrades:['flow'],condition:CONDITIONS.find(c=>c.id==='express')});r.player.hp=40;r.bus.remaining=10;r.player.counterTime=1;r.attack('heavy');step(r,.2);assert.equal(r.stats.finishers,1);assert.equal(r.player.hp,48);assert.ok(r.bus.remaining>12);step(r,.4);assert.equal(r.stats.finishers,1);
  r.combat.reset();r.enemies=[];r.player.counterTime=1;r.attack('heavy');step(r,.7);assert.equal(r.stats.finishers,1);
});

test('counter healing occurs once on contact even when an attack hits multiple people',()=>{
  const r=dummy({upgrades:['counter'],weapon:'stool'});r.player.hp=40;r.player.counterTime=1;r.attack('light');r.enemies.push({...r.keeper,id:9,x:.2});step(r,.2);assert.equal(r.player.hp,50);
});

test('interrupts grant time, score and healing once; repeatedly hitting recovery cannot farm rewards',()=>{
  const r=dummy({upgrades:['seat'],condition:CONDITIONS.find(c=>c.id==='scramble')});r.player.hp=50;r.bus.remaining=12;r.keeper.state='boarding';r.keeper.boardProgress=.9;
  r.strikeEnemy(r.keeper,1,0,.5);assert.equal(r.stats.interrupts,1);assert.equal(r.bus.remaining,17);assert.equal(r.player.hp,62);assert.equal(r.keeper.boardProgress,0);const score=r.score;
  r.strikeEnemy(r.keeper,1,0,.5);assert.equal(r.stats.interrupts,1);assert.equal(r.bus.remaining,17);assert.equal(r.score-score,10);
});

test('Rush requires variety within a fixed six-second window and cannot retrigger while active',()=>{
  const r=dummy();for(let i=0;i<10;i++){r.stylish('jab');r.stylish('cross');}assert.equal(r.rushTime,0);assert.equal(r.styleMoves.size,1);
  r.stylish('kick');r.stylish('shove');assert.equal(r.rushTime,0);r.stylish('parry');assert.equal(r.rushTime,6);assert.equal(r.stats.surges,1);assert.equal(r.player.stamina,100);
  for(const kind of ['jab','kick','throw','parry'])r.stylish(kind);assert.equal(r.stats.surges,1);
  const slow=dummy();slow.enemies=[];slow.stylish('jab');step(slow,5);slow.stylish('kick');step(slow,1.1);assert.equal(slow.styleMoves.size,0);
  const whiff=dummy();whiff.enemies=[];whiff.attack();step(whiff,.5);assert.equal(whiff.styleMoves.size,0);
});

test('all six stop rules affect real timings, rival counts or combat rewards',()=>{
  for(const rule of CONDITIONS){const r=dummy({condition:rule});assert.equal(r.config.busWindow,MODES.easy.busWindow+(rule.window||0));assert.equal(r.config.count,Math.max(2,MODES.easy.count+(rule.count||0)));assert.equal(r.config.raceDelay,MODES.easy.raceDelay*(rule.race||1));}
  const duel=dummy({condition:CONDITIONS.find(c=>c.id==='duel')}),base=dummy();duel.attack('grab');base.attack('grab');assert.ok(duel.combat.active.move.damage>base.combat.active.move.damage);
});

test('captains telegraph their stated patterns and stay at the doorway instead of boarding',()=>{
  for(const captain of CAPTAINS){const r=new Round('hard',()=>.5,{captain});r.enemies=[r.keeper];Object.assign(r.player,DOOR);r.raceClock=0;
    for(let i=0;i<3;i++){Object.assign(r.keeper,{state:'guard',timer:0,x:r.keeper.spawnX,z:r.keeper.spawnZ,attacks:i});r.tick(.02);assert.equal(r.keeper.state,'windup');assert.equal(r.keeper.attackKind,captain.pattern[i]);assert.ok(r.keeper.timer>=.8);}
    r.down(r.keeper);assert.equal(r.stats.captains,1);assert.equal(r.momentum,100);
  }
});

test('damage dealt survives missed buses; only a passenger replacement returns at full health',()=>{
  const r=new Round();r.keeper.hp=24;r.busChanged({to:'departing',full:false,number:1});r.busChanged({to:'arriving',full:false,number:2});r.busChanged({to:'boarding',full:false,number:2});assert.equal(r.keeper.hp,24);
  r.down(r.keeper);r.busChanged({to:'departing',full:false,number:2});assert.equal(r.keeper.state,'down');assert.equal(r.keeper.hp,0);
  const replacement=r.enemies[1];replacement.hp=1;replacement.state='boarded';r.busChanged({to:'arriving',full:false,number:3});assert.equal(replacement.hp,replacement.maxHp);
});

test('career awards real rounds once, preserves badges and grants no practice XP',()=>{
  const run=new HomeRun('easy','circle',()=>.5,'office'),r=run.createRound();assert.equal(awardRound(cleanProfile(null),run,r),null);r.stats.interrupts=10;r.stats.surges=5;r.stats.captains=3;r.finish('won');run.record(r);
  const reward=awardRound(cleanProfile(null),run,r);assert.ok(reward.xp>0);assert.equal(reward.profile.seats,1);assert.equal(reward.profile.fighters.office.seats,1);assert.ok(reward.profile.badges.includes('clean'));assert.ok(reward.earned.includes('That seat is mine'));assert.equal(awardRound(reward.profile,run,r),null);
  const p=dummy({practice:true});p.finish('won');assert.equal(awardRound(reward.profile,run,p),null);
  const r2=run.advance();r2.hitsTaken=1;r2.finish('knocked-out');run.record(r2);const two=awardRound(reward.profile,run,r2);assert.equal(two.profile.seats,1);assert.ok(two.xp>0);assert.equal(two.earned.length,0);
  assert.deepEqual(cleanProfile(JSON.parse(JSON.stringify(two.profile))),two.profile);
});

test('daily personal best never goes backwards and rank/mastery use earned XP',()=>{
  let profile=cleanProfile(null);const run=new HomeRun('normal','circle',()=>.5,'market',{daily:'2026-11-04'});
  for(let i=0;i<3;i++){const r=i?run.advance():run.createRound();r.finish('won');run.record(r);profile=awardRound(profile,run,r).profile;}
  assert.equal(profile.wins,1);assert.equal(profile.daily['2026-11-04'].seats,3);assert.equal(profile.daily['2026-11-04'].won,true);const best=profile.daily['2026-11-04'].best;
  const retry=new HomeRun('normal','circle',()=>.5,'market',{daily:'2026-11-04'}),lost=retry.createRound();lost.finish('knocked-out');retry.record(lost);profile=awardRound(profile,retry,lost).profile;assert.equal(profile.daily['2026-11-04'].best,best);
  assert.equal(rankFor(0).level,1);assert.equal(rankFor(300).level,2);assert.equal(rankFor(8000).progress,1);assert.equal(masteryFor(2400),'Legend');
});

test('malformed saves fall back to bounded numbers and known achievement definitions',()=>{
  const p=cleanProfile({xp:'<img>',seats:-1,wins:Infinity,fighters:{office:{xp:42,seats:'bad'},'<script>':{}},daily:{bad:{},'2026-11-04':{best:'html',seats:99}},badges:['injected']});assert.equal(p.xp,0);assert.equal(p.seats,0);assert.equal(p.wins,0);assert.equal(p.fighters.office.xp,42);assert.equal(Object.keys(p.fighters).length,1);assert.equal(p.daily['2026-11-04'].best,0);assert.equal(p.daily['2026-11-04'].seats,3);assert.deepEqual(p.badges,[]);
});


test('a braced captain resists one-button shoves but can be displaced during recovery',()=>{
  const r=new Round('easy',()=>.5,{captain:CAPTAINS[0]});r.enemies=[r.keeper];Object.assign(r.player,{x:DOOR.x,z:DOOR.z+1});r.shove();assert.equal(r.keeper.timer,.45);step(r,.5,{board:true});assert.equal(r.status,'playing');
  r.combat.reset();r.player.cooldown=0;r.player.shoveCooldown=0;r.player.stamina=100;r.keeper.state='recover';r.keeper.timer=1;Object.assign(r.player,{x:DOOR.x,z:DOOR.z+1});Object.assign(r.keeper,{x:DOOR.x,z:DOOR.z});r.shove();assert.equal(r.keeper.timer,2.55);step(r,1.8,{board:true});assert.equal(r.status,'playing');r.down(r.keeper);step(r,1.2,{board:true});assert.equal(r.status,'won');
});

test('a thrown rival crashes into nearby passengers once and interrupts their boarding',()=>{
  const r=dummy(),source=r.keeper;Object.assign(source,{x:0,z:1});const victim={...source,id:8,z:1.65,state:'boarding',boardProgress:.9};r.enemies.push(victim);
  r.strikeEnemy(source,10,2.5,1.6,{smooth:true,move:'throw'});r.crowdCrash(source,.02);assert.equal(victim.hp,986);assert.equal(victim.state,'recover');assert.equal(r.stats.interrupts,1);assert.equal(r.events.filter(e=>e.type==='crowd-crash').length,1);
  r.crowdCrash(source,.02);assert.equal(victim.hp,986);r.crowdCrash(source,1);assert.equal(source.crash,null);
  const whiff=dummy();whiff.strikeEnemy(whiff.keeper,5,.1,.5,{smooth:true,move:'jab'});assert.equal(whiff.keeper.crash,undefined);
});


test('daily upgrade offers and later spawns are independent of time spent fighting earlier',()=>{
  const a=new HomeRun('normal','circle',seededRandom('same-day'),'office'),b=new HomeRun('normal','circle',seededRandom('same-day'),'office');const r=a.createRound(),q=b.createRound();for(let i=0;i<1000;i++)r.random();r.finish('won');q.finish('won');a.record(r);b.record(q);assert.deepEqual(a.offers,b.offers);a.chooseUpgrade(a.offers[0].id);b.chooseUpgrade(b.offers[0].id);const next=a.advance(),same=b.advance();assert.deepEqual(next.enemies,same.enemies);
});
