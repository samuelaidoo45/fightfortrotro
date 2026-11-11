import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderLoop} from '../dist/render-loop.js';
import {Stage} from '../dist/stage.js';
import * as T from '../dist/vendor/three.module.js';
const target=()=>{const listeners=new Map();return{hidden:false,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),emit(name){listeners.get(name)?.();}};};
function loopFixture(){
 const doc=target(),win=target(),frames=new Map(),steps=[],errors=[];let clock=0,id=0,suspends=0,resumes=0;
 const loop=createRenderLoop({doc,win,requestFrame:fn=>{frames.set(++id,fn);return id;},cancelFrame:key=>frames.delete(key),now:()=>clock,step:dt=>steps.push(dt),onSuspend:()=>suspends++,onResume:()=>resumes++,onError:error=>errors.push(error)});
 return{doc,win,frames,steps,errors,loop,get suspends(){return suspends;},get resumes(){return resumes;},advance(ms){clock+=ms;const next=frames.entries().next().value;if(next){frames.delete(next[0]);next[1](clock);}}};
}
test('backgrounding stops animation and returning resets elapsed time without catch-up damage',()=>{
 const x=loopFixture();x.loop.start();x.advance(16);x.doc.hidden=true;x.doc.emit('visibilitychange');assert.equal(x.frames.size,0);const count=x.steps.length;x.advance(120000);assert.equal(x.steps.length,count);x.doc.hidden=false;x.doc.emit('visibilitychange');x.advance(16);assert.equal(x.steps.at(-1),.016);assert.equal(x.frames.size,1);
});
test('pageshow and visibility events cannot multiply animation loops after repeated app switches',()=>{
 const x=loopFixture();x.loop.start();for(let i=0;i<20;i++){x.win.emit('pagehide');x.doc.hidden=true;x.doc.emit('visibilitychange');x.win.emit('pageshow');assert.equal(x.frames.size,0);x.doc.hidden=false;x.doc.emit('visibilitychange');x.win.emit('pageshow');x.doc.emit('visibilitychange');assert.equal(x.frames.size,1);x.advance(16);}assert.equal(x.steps.length,20);
});
test('context restoration while hidden waits until foreground before rendering',()=>{
 const x=loopFixture();x.loop.start();x.loop.setBlocked(true);assert.equal(x.frames.size,0);x.doc.hidden=true;x.loop.setBlocked(false);assert.equal(x.frames.size,0);x.doc.hidden=false;x.doc.emit('visibilitychange');assert.equal(x.frames.size,1);x.loop.dispose();assert.equal(x.frames.size,0);x.doc.emit('visibilitychange');assert.equal(x.frames.size,0);
});
test('render failure pauses once and an explicit retry can restart the animation chain',()=>{
 const doc=target(),win=target(),frames=new Map();let id=0,broken=true,errors=0;
 const loop=createRenderLoop({doc,win,now:()=>0,requestFrame:fn=>{frames.set(++id,fn);return id;},cancelFrame:key=>frames.delete(key),step:()=>{if(broken)throw new Error('GPU reset');},onError:()=>errors++});loop.start();const entry=frames.entries().next().value;frames.delete(entry[0]);entry[1](16);assert.equal(errors,1);assert.equal(frames.size,0);broken=false;loop.setBlocked(false);assert.equal(frames.size,1);loop.dispose();
});
function stageFixture(){
 const stage=Object.create(Stage.prototype),calls=[];stage.contextLost=false;stage.pixelRatioCap=1.5;stage.scene=new T.Scene();stage.sky=new T.Texture();const texture=new T.Texture(),material=new T.MeshStandardMaterial({map:texture,color:0x267d9b});stage.materials={blue:material};stage.humans={materials:new Set()};const actor=new T.Mesh(new T.BoxGeometry(),material);actor.position.set(2,0,3);stage.scene.add(actor);stage.sun=new T.DirectionalLight();stage.sun.shadow.map=new T.WebGLRenderTarget(1,1);stage.sun.shadow.map.addEventListener('dispose',()=>calls.push('shadow-disposed'));stage.environmentMap=new T.WebGLRenderTarget(1,1);stage.environmentMap.addEventListener('dispose',()=>calls.push('environment-disposed'));
 stage.renderer={getContext:()=>({isContextLost:()=>false}),resetState:()=>calls.push('reset'),setRenderTarget:value=>assert.equal(value,null),setPixelRatio:value=>calls.push(['pixel-ratio',value]),shadowMap:{}};stage.resize=()=>calls.push('resize');stage.makeEnvironmentMap=()=>{calls.push('generated-environment');return new T.WebGLRenderTarget(1,1);};stage.onGraphicsState=state=>calls.push(state);return{stage,calls,actor,texture,material};
}
test('graphics restoration rebuilds GPU lighting and shadows while retaining actors and colours',()=>{
 const oldDpr=globalThis.devicePixelRatio;globalThis.devicePixelRatio=3;
 try{const {stage,calls,actor,texture,material}=stageFixture(),position=actor.position.clone(),color=material.color.clone(),oldEnvironment=stage.environmentMap,version=texture.version;stage.requestGraphicsRefresh(true);assert.equal(stage.restoreGraphics(),true);assert.notEqual(stage.environmentMap,oldEnvironment);assert.equal(stage.scene.environment,stage.environmentMap.texture);assert.ok(calls.indexOf('generated-environment')<calls.indexOf('environment-disposed'));assert.ok(calls.includes('shadow-disposed'));assert.equal(stage.sun.shadow.map,null);assert.ok(texture.version>version);assert.ok(material.color.equals(color));assert.ok(actor.position.equals(position));assert.equal(stage.scene.children[0],actor);assert.equal(stage.renderer.outputColorSpace,T.SRGBColorSpace);assert.equal(stage.renderer.toneMappingExposure,.95);assert.equal(stage.needsTextureRefresh,false);assert.equal(stage.needsLightingRefresh,false);assert.equal(calls.at(-1),'ready');assert.ok(calls.some(c=>Array.isArray(c)&&c[1]===1.5));}
 finally{if(oldDpr===undefined)delete globalThis.devicePixelRatio;else globalThis.devicePixelRatio=oldDpr;}
});
test('normal foreground refresh regenerates lighting without re-uploading every material texture',()=>{
 const oldDpr=globalThis.devicePixelRatio;globalThis.devicePixelRatio=1;
 try{const {stage,texture,calls}=stageFixture(),version=texture.version;stage.requestGraphicsRefresh();stage.restoreGraphics();assert.equal(texture.version,version);assert.ok(calls.includes('generated-environment'));assert.ok(!calls.includes('shadow-disposed'));}finally{if(oldDpr===undefined)delete globalThis.devicePixelRatio;else globalThis.devicePixelRatio=oldDpr;}
});
test('a still-lost context performs no GPU work and retains pending recovery flags',()=>{
 const {stage,calls}=stageFixture();stage.contextLost=true;stage.requestGraphicsRefresh(true);assert.equal(stage.restoreGraphics(),false);stage.update(.02,null,true);assert.deepEqual(calls,[]);assert.equal(stage.needsTextureRefresh,true);assert.equal(stage.needsLightingRefresh,true);
});

test('browser freeze and resume pause rendering and reset the frame clock',()=>{
 const x=loopFixture();x.loop.start();x.advance(16);x.doc.emit('freeze');assert.equal(x.frames.size,0);x.advance(90000);x.doc.emit('resume');x.advance(16);assert.equal(x.steps.at(-1),.016);assert.equal(x.frames.size,1);
});
