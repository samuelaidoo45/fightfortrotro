import * as T from './vendor/three.module.js';
import {FBXLoader} from './vendor/FBXLoader.js';
import {clone} from './vendor/SkeletonUtils.js';
const ASSETS=new URL('./assets/characters/',import.meta.url).href;
const v=(x,y,z)=>new T.Vector3(x,y,z);

export class HumanLibrary {
  constructor(){this.templates=[];this.geometries=new Set();this.materials=new Set();}
  async load(onProgress=()=>{}){
    const manager=new T.LoadingManager(),textureJobs=[];
    manager.onProgress=(url,done,total)=>onProgress(done,total);
    const images=new T.TextureLoader(manager);
    manager.addHandler(/\.tga$/i,{
      path:'',setPath(value){this.path=value;return this;},
      load(url){const name=(url||'').split(/[\\/]/).at(-1);if(!name?.endsWith('_color.tga'))return new T.Texture();const ext=name.includes('opacity')?'.png':'.jpg';let texture;textureJobs.push(new Promise((resolve,reject)=>{texture=images.load(ASSETS+name.replace('.tga',ext),resolve,undefined,reject);}));return texture;}
    });
    const loader=new FBXLoader(manager);
    const names=['Male_Adult_12','Male_Adult_04','Male_Adult_17'];
    // The FBX parser has module-level parsing state; parse each model in sequence.
    for(const name of names){const model=await loader.loadAsync(ASSETS+name+'.fbx');
      model.traverse(mesh=>{if(!mesh.isMesh)return;this.geometries.add(mesh.geometry);const old=Array.isArray(mesh.material)?mesh.material:[mesh.material];const materials=old.map(source=>{const material=new T.MeshStandardMaterial({name:source.name,map:source.map,alphaMap:source.alphaMap,alphaTest:source.alphaMap?.35:0,side:source.alphaMap?T.DoubleSide:T.FrontSide,roughness:source.name.includes('head')?.68:.88,metalness:0});if(material.map)material.map.anisotropy=4;this.materials.add(material);source.dispose();return material;});mesh.material=Array.isArray(mesh.material)?materials:materials[0];mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;});
      const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());const scale=1.84/size.y;model.scale.setScalar(scale);model.position.set(-(bounds.min.x+bounds.max.x)*.5*scale,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*.5*scale);model.updateMatrixWorld(true);this.templates.push(model);
    }
    this.clips={};for(const name of ['idle','walk']){const source=await loader.loadAsync(ASSETS+name+'.fbx');const clip=source.animations[0];this.clips[name]=new T.AnimationClip(name,clip.duration,clip.tracks.filter(track=>track.name.endsWith('.quaternion')&&track.name.startsWith('Bip01_')&&!/Footsteps/.test(track.name)).map(track=>track.clone()));}
    await Promise.all(textureJobs);
  }
  create(index=0){
    const group=new T.Group(),body=new T.Group(),model=clone(this.templates[index%this.templates.length]);group.add(body);body.add(model);
    const mixer=new T.AnimationMixer(model),idle=mixer.clipAction(this.clips.idle),walk=mixer.clipAction(this.clips.walk);idle.play();walk.play();walk.setEffectiveWeight(0);mixer.update((index*.37)%2);
    const bone=name=>model.getObjectByName('Bip01_'+name);
    const bones={right:bone('R_UpperArm'),rightElbow:bone('R_Forearm'),rightHand:bone('R_Hand'),left:bone('L_UpperArm'),leftElbow:bone('L_Forearm'),leftHand:bone('L_Hand'),head:bone('Head'),spine:bone('Spine2')};
    return{group,body,model,mixer,idle,walk,bones,phase:index*.43,walkWeight:0};
  }
  aim(bone,child,target){
    bone.updateWorldMatrix(true,false);const origin=bone.getWorldPosition(new T.Vector3()),world=bone.getWorldQuaternion(new T.Quaternion());const from=child.position.clone().normalize().applyQuaternion(world),to=target.clone().sub(origin).normalize();const rotation=new T.Quaternion().setFromUnitVectors(from,to).multiply(world),parent=bone.parent.getWorldQuaternion(new T.Quaternion()).invert();bone.quaternion.copy(parent.multiply(rotation));bone.updateWorldMatrix(false,true);
  }
  arm(actor,side,target,hint){
    const a=actor.bones[side],b=actor.bones[side+'Elbow'],c=actor.bones[side+'Hand'];if(!a||!b||!c)return;
    actor.group.updateWorldMatrix(true,true);const start=a.getWorldPosition(new T.Vector3()),elbow=b.getWorldPosition(new T.Vector3()),hand=c.getWorldPosition(new T.Vector3());const end=actor.group.localToWorld(target.clone()),bend=actor.group.localToWorld(hint.clone());const l1=start.distanceTo(elbow),l2=elbow.distanceTo(hand),d=Math.min(l1+l2-.006,Math.max(.05,start.distanceTo(end))),direction=end.clone().sub(start).normalize();
    const along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along)),perpendicular=bend.sub(start);perpendicular.addScaledVector(direction,-perpendicular.dot(direction)).normalize();const knee=start.clone().addScaledVector(direction,along).addScaledVector(perpendicular,height);
    this.aim(a,b,knee);this.aim(b,c,end);
  }
  update(actor,data,dt,time){
    const state=data.action||data.state||'idle',moving=(data.moving??(state==='chase'))&&state!=='down';const speed=moving?1:0;
    actor.walkWeight=T.MathUtils.damp(actor.walkWeight,speed,10,dt);actor.walk.setEffectiveWeight(actor.walkWeight);actor.idle.setEffectiveWeight(1-actor.walkWeight);actor.walk.setEffectiveTimeScale(data.action?1.65:1.1);actor.mixer.update(dt);
    actor.body.position.set(0,0,0);actor.body.rotation.set(0,0,0);
    if(state==='down'){actor.body.rotation.z=1.5;actor.body.position.set(.1,.3,0);return;}
    const guard=()=>{this.arm(actor,'left',v(.16,1.42,.32),v(.42,1.14,.05));this.arm(actor,'right',v(-.15,1.38,.39),v(-.42,1.1,.05));};
    if(state==='block'){actor.body.rotation.x=.06;guard();}
    else if(state==='shove'){const phase=1-Math.max(0,data.actionTime)/.44,extension=Math.sin(Math.min(1,phase)*Math.PI);actor.body.rotation.x=.13*extension;this.arm(actor,'left',v(.19,1.33,.3+extension*.37),v(.4,1.05,.18));this.arm(actor,'right',v(-.19,1.33,.3+extension*.37),v(-.4,1.05,.18));}
    else if(state==='boarding'){actor.body.rotation.x=.12;this.arm(actor,'left',v(.2,1.25,.46),v(.4,1.08,.13));this.arm(actor,'right',v(-.2,1.4,.4),v(-.4,1.15,.1));}
    else if(state==='attack'||state==='swing'){
      const phase=data.actionTime!==undefined?1-Math.max(0,data.actionTime)/.32:1-Math.max(0,data.timer)/.22;const extension=Math.sin(Math.min(1,phase)*Math.PI)*.44;
      actor.body.rotation.y=-.13+extension*.65;this.arm(actor,'right',v(-.12,1.34,.29+extension),v(-.4,1.16,.15));this.arm(actor,'left',v(.16,1.37,.28),v(.4,1.1,.05));
    }else if(state==='windup'){
      actor.body.rotation.y=-.19;this.arm(actor,'right',v(-.35,1.54,-.05),v(-.46,1.23,-.23));this.arm(actor,'left',v(.17,1.33,.3),v(.43,1.08,.08));
    }else if(state==='dodge'){actor.body.position.y=-.23;actor.body.rotation.x=.24;actor.body.rotation.z=-.1;guard();}
    else if(state==='recover'&&data.hurt>0){actor.body.rotation.x=-.12;actor.body.rotation.z=.09;}
    if(data.hurt>0)actor.body.rotation.z+=Math.sin(time*35)*.05;
    if(actor.item){actor.group.updateWorldMatrix(true,true);const hand=actor.bones.rightHand.getWorldPosition(new T.Vector3());actor.item.position.copy(actor.group.worldToLocal(hand));actor.item.position.y-=.11;actor.item.rotation.set(0,0,Math.sin(time*5+actor.phase)*(moving?.12:.015));}
  }
}
