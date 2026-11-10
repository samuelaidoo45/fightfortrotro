import test from 'node:test';
import assert from 'node:assert/strict';
import {createScreenControls} from '../dist/screen-controls.js';
function setup(){
 const calls=[],messages=[],states=[],listeners={},orientationListeners={};let width=390,height=844;
 const doc={fullscreenElement:null,documentElement:{},addEventListener:(type,fn)=>listeners[type]=fn};
 const screen={orientation:{addEventListener:(type,fn)=>orientationListeners[type]=fn,unlock(){calls.push('unlock');},async lock(value){calls.push(value);if(value==='landscape'){width=844;height=390;}else{width=390;height=844;}orientationListeners.change?.();}}};
 doc.documentElement.requestFullscreen=async function(options){assert.equal(this,doc.documentElement);assert.equal(options.navigationUI,'hide');calls.push('enter');doc.fullscreenElement=this;listeners.fullscreenchange();};
 doc.exitFullscreen=async function(){assert.equal(this,doc);calls.push('exit');doc.fullscreenElement=null;listeners.fullscreenchange();};
 const controls=createScreenControls({doc,screen,viewport:()=>({width,height}),onMessage:m=>messages.push(m),onChange:s=>states.push(s)});
 return{controls,doc,screen,calls,messages,states,listeners,setViewport:(w,h)=>{width=w;height=h;}};
}
test('fullscreen enters and exits with truthful button state and unlocks on exit',async()=>{
 const x=setup();assert.equal(await x.controls.toggleFullscreen(),true);assert.equal(x.states.at(-1).fullscreen,true);assert.equal(await x.controls.toggleFullscreen(),true);assert.equal(x.states.at(-1).fullscreen,false);assert.ok(x.calls.includes('unlock'));assert.deepEqual(x.messages,[]);
});
test('Rotate enters fullscreen before locking landscape then switches back to portrait',async()=>{
 const x=setup();await x.controls.rotate();assert.deepEqual(x.calls,['enter','landscape']);assert.equal(x.states.at(-1).orientation,'landscape');await x.controls.rotate();assert.equal(x.calls.at(-1),'portrait');assert.equal(x.calls.filter(c=>c==='enter').length,1);assert.equal(x.states.at(-1).orientation,'portrait');
});
test('unsupported orientation lock gives physical rotation guidance without forcing fullscreen',async()=>{
 const x=setup();delete x.screen.orientation.lock;assert.equal(await x.controls.rotate(),false);assert.ok(x.messages[0].includes('sideways'));assert.equal(x.calls.length,0);x.setViewport(844,390);await x.controls.rotate();assert.ok(x.messages[1].includes('upright'));assert.equal(x.states.at(-1).busy,false);
});
test('denied orientation requests explain physical rotation and leave controls usable',async()=>{
 const x=setup();x.screen.orientation.lock=async()=>{throw new Error('NotSupportedError');};assert.equal(await x.controls.rotate(),false);assert.ok(x.messages[0].includes('auto-rotate'));assert.equal(x.states.at(-1).busy,false);assert.equal(await x.controls.toggleFullscreen(),true);
});
test('unavailable or rejected fullscreen does not throw or leave buttons disabled',async()=>{
 for(const unsupported of [true,false]){const x=setup();if(unsupported)delete x.doc.documentElement.requestFullscreen;else x.doc.documentElement.requestFullscreen=async()=>{throw new Error('NotAllowedError');};assert.equal(await x.controls.toggleFullscreen(),false);assert.equal(x.messages.length,1);assert.equal(x.states.at(-1).fullscreen,false);assert.equal(x.states.at(-1).busy,false);}
});
test('a rejected fullscreen request during Rotate falls back without attempting a lock',async()=>{
 const x=setup();x.doc.documentElement.requestFullscreen=async()=>{throw new Error('NotAllowedError');};assert.equal(await x.controls.rotate(),false);assert.equal(x.calls.length,0);assert.ok(x.messages[0].includes('sideways'));
});
test('rapid taps cannot launch overlapping fullscreen and rotation operations',async()=>{
 const x=setup();let release;x.doc.documentElement.requestFullscreen=()=>new Promise(resolve=>{release=resolve;});const pending=x.controls.toggleFullscreen();assert.equal(await x.controls.rotate(),false);assert.equal(await x.controls.toggleFullscreen(),false);release();await pending;assert.equal(x.states.at(-1).busy,false);
});
test('browser fullscreen exit unlocks orientation and viewport changes update Rotate direction',async()=>{
 const x=setup();await x.controls.rotate();x.doc.fullscreenElement=null;x.listeners.fullscreenchange();assert.equal(x.calls.at(-1),'unlock');assert.equal(x.states.at(-1).fullscreen,false);x.setViewport(390,844);x.controls.sync();assert.equal(x.states.at(-1).orientation,'portrait');
});
test('prefixed fullscreen methods are bound correctly when standard methods are absent',async()=>{
 const x=setup();delete x.doc.documentElement.requestFullscreen;delete x.doc.exitFullscreen;x.doc.documentElement.webkitRequestFullscreen=function(){assert.equal(this,x.doc.documentElement);x.doc.webkitFullscreenElement=this;x.listeners.webkitfullscreenchange();};x.doc.webkitExitFullscreen=function(){assert.equal(this,x.doc);x.doc.webkitFullscreenElement=null;x.listeners.webkitfullscreenchange();};assert.equal(await x.controls.toggleFullscreen(),true);assert.equal(x.states.at(-1).fullscreen,true);assert.equal(await x.controls.toggleFullscreen(),true);assert.equal(x.states.at(-1).fullscreen,false);
});
test('standalone browsers can lock orientation without a fullscreen API',async()=>{
 const x=setup();delete x.doc.documentElement.requestFullscreen;assert.equal(await x.controls.rotate(),true);assert.equal(x.calls.at(-1),'landscape');assert.deepEqual(x.messages,[]);
});
