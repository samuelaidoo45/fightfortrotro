import {Round,ARENAS,MODES,WEAPONS} from './core.js';
import {characterById,CHARACTERS} from './characters.js';
import {CONDITIONS,CAPTAINS,UPGRADES,seededRandom,shuffled} from './journey.js';

export const ENCOUNTERS=[
  {kind:'crew',name:'Break the queue',detail:'Knock down 2 different rivals, then fight your way onto the trotro.',goal:2},
  {kind:'defence',name:'Hold your place',detail:'Stop 3 different rivals: interrupt their boarding or knock them down. Then take your seat.',goal:3},
  {kind:'captain',name:'Captain showdown',detail:'Defeat the district captain, then board. Shoving past them is not enough.',goal:1}
];
export const TRAVEL_CHOICES=[
  {id:'rest',name:'Take a breather',tag:'Recovery',detail:'Recover 40 health before the next encounter.'},
  {id:'charge',name:'Arrive ready',tag:'Special',detail:'Recover 15 health. Start the next fight with a full special meter.'},
  {id:'risk',name:'Raise the stakes',tag:'High score',detail:'Recover 25 health. Next encounter: +30% score, but rivals hit 20% harder.'}
];
const count=(n,max=1e8)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
const validKind=k=>['campaign','endless'].includes(k);

// Combat and rewards have separate random streams; a checkpoint is a stop boundary.
export class CityJourney {
  constructor({kind='campaign',mode='normal',startId='circle',character='office',seed=String(Date.now())+'-'+Math.random()}={}){
    this.kind=validKind(kind)?kind:'campaign';this.mode=Object.hasOwn(MODES,mode)?mode:'normal';this.startId=ARENAS.find(a=>a.id===startId)?.id||'circle';this.character=characterById(character);this.seed=String(seed);this.id=this.kind+':'+this.seed;this.index=0;this.score=0;this.kos=0;this.time=0;this.health=100;this.weapon=this.character.item;this.upgrades=[];this.history=[];this.phase='fight';this.complete=false;this.canContinue=false;this.selectedUpgrade=null;this.replaceUpgrade=null;this.travel='rest';this.arrival='rest';this.round=null;this.lastResult=null;this.daily=null;
  }
  arenaAt(index){const start=ARENAS.findIndex(a=>a.id===this.startId);return ARENAS[(start+Math.floor(index/3))%6];}
  get route(){return Array.from({length:this.kind==='campaign'?18:this.index+2},(_,i)=>this.arenaAt(i));}
  get arena(){return this.arenaAt(this.index);}
  get district(){return Math.floor(this.index/3);}
  get encounter(){return ENCOUNTERS[this.index%3];}
  get captain(){return CAPTAINS[this.district%CAPTAINS.length];}
  conditionAt(index){return shuffled(CONDITIONS,seededRandom(this.seed+':conditions:'+Math.floor(index/6)))[index%6];}
  get conditions(){return Array.from({length:this.index+2},(_,i)=>this.conditionAt(i));}
  get offers(){return this.canContinue?shuffled(UPGRADES.filter(u=>!this.upgrades.includes(u.id)),seededRandom(this.seed+':offers:'+this.index)).slice(0,3):[];}
  get ready(){return this.canContinue&&!!this.selectedUpgrade&&(this.upgrades.length<3||this.upgrades.includes(this.replaceUpgrade));}
  createRound(){
    if(this.phase!=='fight')return null;
    const r=new Round(this.mode,seededRandom(this.seed+':fight:'+this.index),{character:this.character.id,stage:this.index+1,difficultyLevel:Math.min(4,this.district),health:this.health,weapon:this.weapon,condition:this.conditionAt(this.index),upgrades:this.upgrades,captain:this.index%3===2?this.captain:null,quickArrival:true,closeStart:true,encounter:this.encounter});
    if(this.arrival==='charge')r.momentum=100;if(this.arrival==='risk'){r.config.damage*=1.2;r.scoreBonus=1.3;}
    this.round=r;return r;
  }
  chooseUpgrade(id){if(!this.offers.some(u=>u.id===id))return false;this.selectedUpgrade=id;return true;}
  chooseReplacement(id){if(!this.canContinue||!this.upgrades.includes(id))return false;this.replaceUpgrade=id;return true;}
  chooseTravel(id){if(!this.canContinue||!TRAVEL_CHOICES.some(t=>t.id===id))return false;this.travel=id;return true;}
  record(r){
    if(r!==this.round||r.status==='playing'||this.phase!=='fight')return false;
    this.lastResult={result:r.status,health:Math.ceil(r.player.hp),elapsed:r.elapsed,score:r.score,kos:r.kos};
    if(r.status!=='won'){this.phase='retry';return true;}
    this.score+=r.score;this.kos+=r.kos;this.time+=r.elapsed;this.health=r.player.hp;this.weapon=r.player.weapon;
    this.history.push({stage:r.stage,arena:this.arena.id,result:'won',score:r.score,stars:r.stars,bestChain:r.bestChain,challenge:r.challenge.status==='won'});
    this.complete=this.kind==='campaign'&&this.index===17;this.canContinue=!this.complete;this.phase=this.complete?'complete':'travel';this.selectedUpgrade=null;this.replaceUpgrade=null;this.travel='rest';return true;
  }
  advance(){
    if(!this.ready)return null;
    if(this.upgrades.length===3)this.upgrades=this.upgrades.filter(id=>id!==this.replaceUpgrade);
    this.upgrades.push(this.selectedUpgrade);const healing=this.travel==='rest'?40:this.travel==='charge'?15:25;
    this.health=Math.min(100,this.health+healing+(this.character.heal===40?15:0));this.arrival=this.travel;this.index++;this.phase='fight';this.canContinue=false;this.complete=false;this.selectedUpgrade=null;this.replaceUpgrade=null;return this.createRound();
  }
  retry(){if(this.phase!=='retry')return null;this.phase='fight';this.health=Math.max(70,this.health);return this.createRound();}
  snapshot(){return{version:1,kind:this.kind,mode:this.mode,startId:this.startId,character:this.character.id,seed:this.seed,index:this.index,score:this.score,kos:this.kos,time:this.time,health:this.health,weapon:this.weapon,upgrades:[...this.upgrades],history:this.history.slice(-24),phase:this.phase,selectedUpgrade:this.selectedUpgrade,replaceUpgrade:this.replaceUpgrade,travel:this.travel,arrival:this.arrival,lastResult:this.lastResult};}
  static restore(raw){
    if(!raw||raw.version!==1||!validKind(raw.kind)||!Object.hasOwn(MODES,raw.mode)||!CHARACTERS.some(c=>c.id===raw.character)||!ARENAS.some(a=>a.id===raw.startId)||typeof raw.seed!=='string'||raw.seed.length>100||!Number.isInteger(raw.index)||raw.index<0||raw.index>10000||(raw.kind==='campaign'&&raw.index>17)||!['fight','travel','retry','complete'].includes(raw.phase))return null;
    if(raw.phase==='complete'&&(raw.kind!=='campaign'||raw.index!==17)||raw.phase==='travel'&&raw.kind==='campaign'&&raw.index===17)return null;
    const run=new CityJourney({...raw});run.index=raw.index;run.score=count(raw.score);run.kos=count(raw.kos);run.time=count(raw.time);run.health=Math.max(1,Math.min(100,Number(raw.health)||100));run.weapon=Object.hasOwn(WEAPONS,raw.weapon)?raw.weapon:null;
    run.upgrades=[...new Set(Array.isArray(raw.upgrades)?raw.upgrades:[])].filter(id=>UPGRADES.some(u=>u.id===id)).slice(0,3);
    run.history=(Array.isArray(raw.history)?raw.history:[]).slice(-24).filter(h=>h&&Number.isInteger(h.stage)&&h.stage>0&&h.stage<=run.index+1&&ARENAS.some(a=>a.id===h.arena)).map(h=>({stage:h.stage,arena:h.arena,result:'won',score:count(h.score),stars:count(h.stars,3),bestChain:count(h.bestChain),challenge:!!h.challenge}));
    run.phase=raw.phase;run.canContinue=raw.phase==='travel';run.complete=raw.phase==='complete';run.selectedUpgrade=run.offers.some(u=>u.id===raw.selectedUpgrade)?raw.selectedUpgrade:null;run.replaceUpgrade=run.upgrades.includes(raw.replaceUpgrade)?raw.replaceUpgrade:null;run.travel=TRAVEL_CHOICES.some(t=>t.id===raw.travel)?raw.travel:'rest';run.arrival=TRAVEL_CHOICES.some(t=>t.id===raw.arrival)?raw.arrival:'rest';
    const last=raw.lastResult;run.lastResult=last&&typeof last==='object'?{result:last.result==='won'?'won':'knocked-out',health:count(last.health,100),elapsed:count(last.elapsed),score:count(last.score),kos:count(last.kos)}:null;return run;
  }
}
