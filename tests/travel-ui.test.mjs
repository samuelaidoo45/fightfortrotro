import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {CityJourney} from '../dist/campaign.js';
// Exercise the shipped modal handlers without a browser or WebGL renderer.
const source=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
function harness(){
 const nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{id:id.slice(1),open:false,hidden:false,handlers:{},addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);},fire(type,event={}){for(const fn of this.handlers[type]||[])fn(event);},close(){this.open=false;},focus(){},getBoundingClientRect(){return{left:100,right:500,top:100,bottom:600};}});return nodes.get(id);};
 const j=new CityJourney({seed:'modal'}),r=j.createRound();r.finish('won');j.record(r);
 const c=vm.createContext({run:j,round:r,paused:true,playMode:'campaign',cityReward:'',checkpointSaved:true,saves:0,frames:0,arena:{},$:node,document:{querySelectorAll:selector=>selector==='dialog[open]'?[...nodes.values()].filter(n=>n.open):[node('#city-travel'),node('#guide')],body:{classList:{remove(){}}}},window:{speechSynthesis:{cancel(){}}},saveJourney(){c.saves++;},selectArena(){},refreshCareer(){},clearInput(){},renderCityTravel(){},playRound(next){c.round=next;c.paused=false;c.frames++;node('#city-travel').close();},startCity(){c.run=new CityJourney({kind:'endless'});c.playRound(c.run.createRound());}});
 node('#city-travel').open=true;
 vm.runInContext(source.slice(source.indexOf('function lobby(){'),source.indexOf('function finish(')),c);
 vm.runInContext(source.slice(source.indexOf("$('#keep-upgrades').addEventListener"),source.indexOf("$('#mode-description').textContent=MODES[mode].description;\nfor")),c);
 vm.runInContext(source.slice(source.indexOf("for(const dialog of document.querySelectorAll('.information-dialog'))"),source.indexOf("$('#play-tab').addEventListener")),c);
 return{c,node,j};
}
test('clicking outside the result saves the journey and leaves no hidden paused game',()=>{
 const {c,node}=harness(),dialog=node('#city-travel');dialog.fire('click',{target:dialog,clientX:20,clientY:20});assert.equal(c.saves,1);assert.equal(c.run,null);assert.equal(c.round,null);assert.equal(c.paused,false);assert.equal(dialog.open,false);assert.equal(node('#hud').hidden,true);
});
test('clicking blank space inside the result does not dismiss it',()=>{
 const {c,node}=harness(),dialog=node('#city-travel');dialog.fire('click',{target:dialog,clientX:200,clientY:200});assert.equal(c.run.phase,'travel');assert.equal(dialog.open,true);assert.equal(c.saves,0);
});
test('Escape and unexpected native close return safely to the menu',()=>{
 for(const type of ['cancel','close']){const {c,node}=harness(),dialog=node('#city-travel');let prevented=false;if(type==='close')dialog.open=false;dialog.fire(type,{preventDefault(){prevented=true;}});assert.equal(c.run,null);assert.equal(c.paused,false);assert.equal(c.saves,1);if(type==='cancel')assert.equal(prevented,true);}
});
test('Continue starts the next fight and its queued close event does not return to the menu',()=>{
 const {c,node}=harness();node('#city-continue').fire('click');assert.equal(c.run.index,1);assert.equal(c.round.status,'playing');assert.equal(c.paused,false);assert.equal(c.frames,1);node('#city-travel').fire('close');assert.equal(c.run.index,1);assert.equal(c.paused,false);
});
test('dismissal keeps upgrade and recovery choices available when the save is restored',()=>{
 const {c,node,j}=harness();j.chooseUpgrade(j.offers[0].id);j.chooseTravel('charge');let snapshot;c.saveJourney=()=>{snapshot=c.run.snapshot();};const dialog=node('#city-travel');dialog.fire('click',{target:dialog,clientX:0,clientY:0});const restored=CityJourney.restore(snapshot);assert.equal(restored.selectedUpgrade,j.selectedUpgrade);assert.equal(restored.travel,'charge');assert.equal(restored.advance().momentum,100);
});
