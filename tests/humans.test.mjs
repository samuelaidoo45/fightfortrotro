import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../dist/vendor/three.module.js';
import {FBXLoader} from '../dist/vendor/FBXLoader.js';
import {clone} from '../dist/vendor/SkeletonUtils.js';

// Geometry/rig checks need no GPU, DOM, or image decoding.
const manager=new T.LoadingManager();manager.addHandler(/\.tga$/i,{path:'',setPath(){return this;},load(){return new T.Texture();}});
const parse=name=>{const bytes=fs.readFileSync(new URL('../dist/assets/characters/'+name+'.fbx',import.meta.url));return new FBXLoader(manager).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');};
const models=['Male_Adult_12','Male_Adult_04','Male_Adult_17'].map(parse);
test('all commuter models contain textured, weighted human meshes and usable body joints',()=>{
 for(const model of models){let count=0;model.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;count++;assert.ok(mesh.geometry.attributes.position.count>1000);assert.equal(mesh.geometry.attributes.skinWeight.count,mesh.geometry.attributes.position.count);assert.ok(mesh.geometry.attributes.uv);assert.ok(mesh.skeleton.bones.length>50);});assert.ok(count>0);for(const bone of ['Head','R_UpperArm','R_Forearm','R_Hand','L_UpperArm','L_Forearm','L_Hand'])assert.ok(model.getObjectByName('Bip01_'+bone));const height=new T.Box3().setFromObject(model).getSize(new T.Vector3()).y;assert.ok(height>150&&height<220);}
});
test('locomotion clips target joints present in every commuter rig',()=>{
 for(const name of ['idle','walk']){const source=parse(name),clip=source.animations[0];assert.ok(clip.duration>.5);const tracks=clip.tracks.filter(track=>track.name.endsWith('.quaternion')&&track.name.startsWith('Bip01_')&&!/Footsteps/.test(track.name));assert.ok(tracks.length>40);for(const model of models)for(const track of tracks)assert.ok(model.getObjectByName(track.name.replace('.quaternion','')),`${name}: ${track.name}`);}
});
test('crowd clones have independent skeletons while reusing mesh buffers',()=>{
 const a=clone(models[0]),b=clone(models[0]);const armA=a.getObjectByName('Bip01_R_UpperArm'),armB=b.getObjectByName('Bip01_R_UpperArm');assert.notEqual(armA,armB);const before=armB.quaternion.clone();armA.rotateY(.5);assert.ok(armB.quaternion.equals(before));let meshA,meshB;a.traverse(x=>{if(x.isSkinnedMesh)meshA=x;});b.traverse(x=>{if(x.isSkinnedMesh)meshB=x;});assert.equal(meshA.geometry,meshB.geometry);assert.notEqual(meshA.skeleton,meshB.skeleton);
});
