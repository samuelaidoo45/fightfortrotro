// Run rules and local progression are independent of rendering and wall-clock combat.
export const CONDITIONS = [
  {id:'breather',name:'Room to move',detail:'One fewer rival. Extra time to learn the crowd.',count:-1,window:7},
  {id:'express',name:'Express departure',detail:'A shorter boarding window. Finishers add 3 seconds.',window:-6,finisherTime:3},
  {id:'market',name:'Market rush',detail:'Two extra passengers. Shoves recharge 30% faster.',count:2,shove:.7},
  {id:'power',name:'Crowd favourite',detail:'Special meter fills 40% faster. Rivals hit 15% harder.',meter:1.4,damage:1.15},
  {id:'scramble',name:'Seat scramble',detail:'Rivals rush earlier. Interruptions restore 12 health.',race:.72,interruptHeal:12},
  {id:'duel',name:'Heavy luggage',detail:'Fewer rivals, tougher guards. Throws deal 50% more damage.',count:-2,hp:1.2,throws:1.5}
];
export const CAPTAINS = [
  {id:'wall',name:'The Wall',character:'builder',detail:'Heavy → low → heavy. Dodge the red ring, then shove during recovery.',pattern:['heavy','low','heavy'],recovery:1.8},
  {id:'swift',name:'Quickstep',character:'footballer',detail:'Jab → kick → low. Block high, then low; counter or shove after the sweep.',pattern:['jab','kick','low'],recovery:1.3},
  {id:'swing',name:'Big Swing',character:'market',detail:'Low → heavy → kick. Step out of the sweep, then shove during recovery.',pattern:['low','heavy','kick'],recovery:1.65}
];
export const UPGRADES = [
  {id:'brawler',name:'Heavy hands',tag:'Damage',detail:'Hand strikes deal 25% more damage.',damage:1.25},
  {id:'dancer',name:'Light feet',tag:'Mobility',detail:'Move 15% faster. Dodges cost 35% less stamina.',speed:1.15,dodge:.65},
  {id:'crowd',name:'Make way',tag:'Crowd control',detail:'Shove recharges 40% faster and pushes 20% further.',shove:.6,push:1.2},
  {id:'showtime',name:'Showtime',tag:'Special',detail:'Gain 35% more special meter. Start each stop with +30.',meter:1.35,charge:30},
  {id:'counter',name:'Read the room',tag:'Defence',detail:'Perfect-block window is 50% wider. Counters restore 10 health.',parry:1.5,counterHeal:10},
  {id:'flow',name:'Second wind',tag:'Combos',detail:'Finishers restore 8 health and 18 stamina.',finisherHeal:8,finisherStamina:18},
  {id:'seat',name:'Door specialist',tag:'Boarding',detail:'Board 25% faster. Interruptions buy 3 extra seconds.',board:.75,interruptTime:3},
  {id:'tough',name:'Thick skin',tag:'Survival',detail:'Take 20% less damage for the rest of this run.',armor:.8}
];
export function shuffled(list,random){const result=[...list];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function seededRandom(seed){let value=2166136261;for(const c of String(seed))value=Math.imul(value^c.charCodeAt(0),16777619);return()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function dailyRoute(date=new Date()){
  const day=date.toISOString().slice(0,10),random=seededRandom('trotro-v09-'+day);
  return{day,seed:'daily-'+day,start:Math.floor(random()*6),fighter:['office','market','footballer','mechanic','schoolgirl','nurse'][Math.floor(random()*6)]};
}
export function upgradeEffects(ids=[]){const effects={damage:1,speed:1,dodge:1,shove:1,push:1,meter:1,parry:1,board:1,armor:1,charge:0,counterHeal:0,finisherHeal:0,finisherStamina:0,interruptTime:0};for(const id of new Set(ids)){const item=UPGRADES.find(u=>u.id===id);if(!item)continue;for(const key of Object.keys(effects))if(item[key]!==undefined)effects[key]=['charge','counterHeal','finisherHeal','finisherStamina','interruptTime'].includes(key)?effects[key]+item[key]:effects[key]*item[key];}return effects;}
export const BADGES = [
  {id:'home',name:'Home at last',detail:'Complete a three-stop run.',test:p=>p.wins>=1},
  {id:'defender',name:'That seat is mine',detail:'Interrupt 10 boarding rivals.',test:p=>p.interrupts>=10},
  {id:'style',name:'Crowd favourite',detail:'Trigger Rush 5 times.',test:p=>p.surges>=5},
  {id:'captain',name:'Captain breaker',detail:'Knock down 3 captains.',test:p=>p.captains>=3},
  {id:'clean',name:'Untouchable',detail:'Board with no unblocked hits taken.',test:p=>p.clean>=1},
  {id:'roster',name:'City regular',detail:'Secure a seat with 5 different fighters.',test:p=>Object.values(p.fighters).filter(f=>f.seats>0).length>=5}
];
const number=n=>Number.isFinite(n)?Math.max(0,Math.min(1e9,Math.floor(n))):0;
export function cleanProfile(raw){
  const p={version:1,xp:0,wins:0,seats:0,interrupts:0,surges:0,captains:0,clean:0,fighters:{},daily:{},badges:[]};
  if(!raw||typeof raw!=='object')return p;
  for(const k of ['xp','wins','seats','interrupts','surges','captains','clean'])p[k]=number(raw[k]);
  if(raw.fighters&&typeof raw.fighters==='object')for(const [id,f] of Object.entries(raw.fighters).slice(0,20))if(/^[a-z]+$/.test(id)&&f&&typeof f==='object')Object.defineProperty(p.fighters,id,{value:{xp:number(f.xp),seats:number(f.seats),best:number(f.best)},enumerable:true,writable:true});
  if(raw.daily&&typeof raw.daily==='object')for(const [day,d] of Object.entries(raw.daily).sort().slice(-30))if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&d&&typeof d==='object')p.daily[day]={best:number(d.best),seats:Math.min(3,number(d.seats)),won:!!d.won};
  p.badges=BADGES.filter(b=>b.test(p)).map(b=>b.id);return p;
}
export function rankFor(xp){const levels=[0,300,900,1800,3200,5200,8000],names=['New arrival','Regular','Street smart','Seat hunter','Rush-hour ace','Stop champion','Accra legend'];let level=0;while(level<levels.length-1&&xp>=levels[level+1])level++;return{level:level+1,name:names[level],progress:level===6?1:(xp-levels[level])/(levels[level+1]-levels[level]),next:levels[level+1]??null};}
export function masteryFor(xp){return xp>=2400?'Legend':xp>=1200?'Expert':xp>=450?'Regular':'Rookie';}
export function awardRound(profile,run,round){
  // The round object is a transaction boundary. Reopening a result never grants XP twice.
  if(round.practice||round.status==='playing'||round.careerAward)return null;
  const won=round.status==='won',p=cleanProfile(profile),id=round.character?.id||'office';
  const xp=(won?120:20)+Math.min(80,round.kos*12)+Math.min(60,round.stats.interrupts*15)+(round.challenge.status==='won'?40:0)+(run.complete?160:0);
  const f=p.fighters[id]||{xp:0,seats:0,best:0};f.xp+=xp;f.seats+=won?1:0;f.best=Math.max(f.best,run.score);p.fighters[id]=f;
  p.xp+=xp;p.seats+=won?1:0;p.wins+=run.complete?1:0;p.interrupts+=round.stats.interrupts;p.surges+=round.stats.surges;p.captains+=round.stats.captains;p.clean+=won&&round.hitsTaken===0?1:0;
  if(run.daily){const d=p.daily[run.daily]||{best:0,seats:0,won:false};d.best=Math.max(d.best,run.score);d.seats=Math.max(d.seats,run.history.filter(h=>h.result==='won').length);d.won||=run.complete;p.daily[run.daily]=d;}
  const earned=BADGES.filter(b=>!p.badges.includes(b.id)&&b.test(p));p.badges.push(...earned.map(b=>b.id));
  round.careerAward={profile:p,xp,earned:earned.map(b=>b.name),mastery:masteryFor(f.xp)};return round.careerAward;
}
