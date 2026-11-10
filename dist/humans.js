import * as T from './vendor/three.module.js';
import {FBXLoader} from './vendor/FBXLoader.js';
import {MODEL_NAMES} from './characters.js';
import {clone} from './vendor/SkeletonUtils.js';
const ASSETS=new URL('./assets/characters/',import.meta.url).href;
const v=(x,y,z)=>new T.Vector3(x,y,z);
export function normalizeHumanRig(model){model.traverse(node=>{if(node.isBone)node.name=node.name.replace(/^Bip\d+/, 'Bip01');});return model;}

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
    const names=MODEL_NAMES;
    // The FBX parser has module-level parsing state; parse each model in sequence.
    for(const name of names){const model=normalizeHumanRig(await loader.loadAsync(ASSETS+name+'.fbx'));
      model.traverse(mesh=>{if(!mesh.isMesh)return;this.geometries.add(mesh.geometry);const old=Array.isArray(mesh.material)?mesh.material:[mesh.material];const materials=old.map(source=>{const material=new T.MeshStandardMaterial({name:source.name,map:source.map,alphaMap:source.alphaMap,alphaTest:source.alphaMap?.35:0,side:source.alphaMap?T.DoubleSide:T.FrontSide,roughness:source.name.includes('head')?.68:.88,metalness:0});if(material.map)material.map.anisotropy=4;this.materials.add(material);source.dispose();return material;});mesh.material=Array.isArray(mesh.material)?materials:materials[0];mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;});
      const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());const scale=1.84/size.y;model.scale.setScalar(scale);model.position.set(-(bounds.min.x+bounds.max.x)*.5*scale,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*.5*scale);model.updateMatrixWorld(true);this.templates.push(model);
    }
    this.clips={};for(const name of ['idle','walk']){const source=await loader.loadAsync(ASSETS+name+'.fbx');const clip=source.animations[0];this.clips[name]=new T.AnimationClip(name,clip.duration,clip.tracks.filter(track=>track.name.endsWith('.quaternion')&&track.name.startsWith('Bip01_')&&!/Footsteps/.test(track.name)).map(track=>track.clone()));}
    await Promise.all(textureJobs);
  }
  create(index=0){
    const group=new T.Group(),body=new T.Group(),model=clone(this.templates[(typeof index==='string'?Math.max(0,MODEL_NAMES.indexOf(index)):index)%this.templates.length]);group.add(body);body.add(model);
    const mixer=new T.AnimationMixer(model),idle=mixer.clipAction(this.clips.idle),walk=mixer.clipAction(this.clips.walk);idle.play();walk.play();walk.setEffectiveWeight(0);mixer.update((typeof index==='number'?index*.37:.3)%2);
    const bone=name=>model.getObjectByName('Bip01_'+name);
    const bones={right:bone('R_UpperArm'),rightElbow:bone('R_Forearm'),rightHand:bone('R_Hand'),left:bone('L_UpperArm'),leftElbow:bone('L_Forearm'),leftHand:bone('L_Hand'),head:bone('Head'),spine:bone('Spine2'),leftThigh:bone('L_Thigh'),leftCalf:bone('L_Calf'),leftFoot:bone('L_Foot'),rightThigh:bone('R_Thigh'),rightCalf:bone('R_Calf'),rightFoot:bone('R_Foot')};
    return{group,body,model,mixer,idle,walk,bones,phase:typeof index==='number'?index*.43:0,walkWeight:0};
  }
  aim(bone,child,target){
    bone.updateWorldMatrix(true,false);const origin=bone.getWorldPosition(new T.Vector3()),world=bone.getWorldQuaternion(new T.Quaternion());const from=child.position.clone().normalize().applyQuaternion(world),to=target.clone().sub(origin).normalize();const rotation=new T.Quaternion().setFromUnitVectors(from,to).multiply(world),parent=bone.parent.getWorldQuaternion(new T.Quaternion()).invert();bone.quaternion.copy(parent.multiply(rotation));bone.updateWorldMatrix(false,true);
  }
  arm(actor,side,target,hint){
    this.limb(actor,actor.bones[side],actor.bones[side+'Elbow'],actor.bones[side+'Hand'],target,hint);
  }
  leg(actor,side,target,hint){
    this.limb(actor,actor.bones[side+'Thigh'],actor.bones[side+'Calf'],actor.bones[side+'Foot'],target,hint);
  }
  limb(actor,a,b,c,target,hint){
    if(!a||!b||!c)return;
    actor.group.updateWorldMatrix(true,true);const start=a.getWorldPosition(new T.Vector3()),elbow=b.getWorldPosition(new T.Vector3()),hand=c.getWorldPosition(new T.Vector3());const end=actor.group.localToWorld(target.clone()),bend=actor.group.localToWorld(hint.clone());const l1=start.distanceTo(elbow),l2=elbow.distanceTo(hand),d=Math.min(l1+l2-.006,Math.max(.05,start.distanceTo(end))),direction=end.clone().sub(start).normalize();
    const along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along)),perpendicular=bend.sub(start);perpendicular.addScaledVector(direction,-perpendicular.dot(direction)).normalize();const knee=start.clone().addScaledVector(direction,along).addScaledVector(perpendicular,height);
    this.aim(a,b,knee);this.aim(b,c,end);
  }
  update(actor,data,dt,time){
    const state=data.action||data.state||'idle',moving=!!data.moving&&!['down','airborne','attack','swing','boarding'].includes(state);const speed=moving?1:0;
    actor.walkWeight=T.MathUtils.damp(actor.walkWeight,speed,10,dt);actor.walk.setEffectiveWeight(actor.walkWeight);actor.idle.setEffectiveWeight(1-actor.walkWeight);actor.walk.setEffectiveTimeScale(data.action?1.65:1.1);actor.mixer.update(dt);
    actor.body.position.set(0,0,0);actor.body.rotation.set(0,0,0);
    if(state==='down'){const fall=Math.min(1,(data.downAge||0)/.28);actor.body.rotation.z=1.5*fall;actor.body.rotation.x=(data.y||0)>.05?-.6:0;actor.body.position.set(.1*fall,.3*fall,0);return;}
    const guard=()=>{this.arm(actor,'left',v(.16,1.42,.32),v(.42,1.14,.05));this.arm(actor,'right',v(-.15,1.38,.39),v(-.42,1.1,.05));};
    let power=0;
    if(data.combat&&!moving&&['idle','guard'].includes(state)){actor.body.position.y=-.045+Math.sin(time*3+actor.phase)*.012;actor.body.rotation.y=-.12;guard();}
    if(state==='seated'){
      for(const [side,x] of [['left',.14],['right',-.14]]){const thigh=actor.bones[side+'Thigh'],calf=actor.bones[side+'Calf'],foot=actor.bones[side+'Foot'];if(thigh&&calf&&foot){this.aim(thigh,calf,actor.group.localToWorld(v(x,.9,.44)));this.aim(calf,foot,actor.group.localToWorld(v(x,.43,.46)));}}
      this.arm(actor,'left',v(.18,.98,.36),v(.34,1.07,.12));this.arm(actor,'right',v(-.18,.98,.36),v(-.34,1.07,.12));
    }else if(state==='vault'){
      actor.body.rotation.x=-.65;actor.body.position.y=.1;this.arm(actor,'left',v(.25,1.65,.55),v(.45,1.3,.2));this.arm(actor,'right',v(-.25,1.65,.55),v(-.45,1.3,.2));this.leg(actor,'left',v(.25,.4,.45),v(.25,.8,.6));this.leg(actor,'right',data.vaultKick>0?v(-.25,.65,-.9):v(-.25,.25,.3),data.vaultKick>0?v(-.3,.85,-.4):v(-.3,.7,.5));
    }else if(state==='airborne'){
      actor.body.rotation.x=-.45-Math.min(1,(data.y||0))*.45;actor.body.rotation.z=data.airStyle==='throw'?Math.sin(time*13)*.55:.18;
      this.arm(actor,'left',v(.56,1.6,.1),v(.55,1.3,-.05));this.arm(actor,'right',v(-.55,1.55,.1),v(-.55,1.22,-.05));
      this.leg(actor,'right',v(-.22,.35,.42),v(-.22,.8,.65));this.leg(actor,'left',v(.25,.2,-.22),v(.25,.7,.1));
    }else if(state==='block'||data.defending){actor.body.rotation.x=.08;actor.body.position.y=data.crouch?-.35:-.06;guard();if(data.crouch){this.leg(actor,'right',v(-.22,.08,.13),v(-.25,.55,.5));this.leg(actor,'left',v(.23,.08,-.12),v(.25,.55,.3));}}
    else if(state==='shove'){const phase=1-Math.max(0,data.actionTime)/.44,extension=Math.sin(Math.min(1,phase)*Math.PI);actor.body.rotation.x=.13*extension;this.arm(actor,'left',v(.19,1.33,.3+extension*.37),v(.4,1.05,.18));this.arm(actor,'right',v(-.19,1.33,.3+extension*.37),v(-.4,1.05,.18));}
    else if(state==='pulling'){actor.body.rotation.x=-.15;this.arm(actor,'left',v(.2,1.85,.55),v(.4,1.35,.25));this.arm(actor,'right',v(-.2,1.85,.55),v(-.4,1.35,.25));}
    else if(state==='boarding'){actor.body.rotation.x=.12;this.arm(actor,'left',v(.2,1.25,.46),v(.4,1.08,.13));this.arm(actor,'right',v(-.2,1.4,.4),v(-.4,1.15,.1));}
    else if(state==='attack'||state==='swing'){
      let phase=data.movePhase??(.35+(1-Math.max(0,data.timer)/.23)*.65),id=data.moveId||(data.attackKind==='low'?'sweep':data.attackKind)||'jab',hitAt=data.moveStartup||.38;
      if(id==='special'){const sequence=['knee','uppercut','spin'];const index=Math.min(2,Math.floor(phase*3));id=sequence[index];phase=(phase*3)%1;hitAt=.48;}
      power=Math.sin(Math.min(1,phase/(hitAt*2))*Math.PI);const recoil=Math.sin(phase*Math.PI);guard();
      if(id==='kick'||id==='spin'){
        actor.body.rotation.y=id==='spin'?phase*Math.PI*2:power*.65;actor.body.rotation.z=.15*power;actor.body.position.y=.04*power;
        this.leg(actor,'right',v(-.2-power*.3,.08+power*1.22,.05+power*.9),v(-.28,.75+power*.5,.45));
        this.arm(actor,'left',v(.2+power*.35,1.35,.15),v(.5,1.12,-.1));
      }else if(id==='sweep'){
        actor.body.position.y=-.38*recoil;actor.body.rotation.y=phase*Math.PI*1.5;actor.body.rotation.z=.2*power;
        this.leg(actor,'right',v(-.2-power*.7,.08+power*.07,.1+power*.85),v(-.4,.45,.5));
        this.leg(actor,'left',v(.23,.08,-.13),v(.32,.45,.4));
      }else if(id==='knee'){
        actor.body.position.y=.35*recoil;actor.body.rotation.x=-.12*power;
        this.leg(actor,'right',v(-.16,.12+power*.65,.1+power*.45),v(-.15,.75+power*.55,.25+power*.65));
        this.leg(actor,'left',v(.18,.06,-.2*power),v(.2,.6,.15));
      }else if(id==='uppercut'){
        actor.body.position.y=-.12+power*.25;actor.body.rotation.y=-.35+power*.7;actor.body.rotation.x=-.13*power;
        this.arm(actor,'right',v(-.18,.82+power*1.05,.1+power*.68),v(-.4,1.05,.08+power*.35));
      }else if(id==='rush'){
        actor.body.rotation.x=.33*power;actor.body.rotation.y=-.45*power;actor.body.position.z=.28*power;
        this.arm(actor,'right',v(-.15,1.2,.42),v(-.42,1.1,.1));
      }else if(id==='throw'){
        actor.body.rotation.y=power*1.2;actor.body.rotation.x=.12*recoil;
        this.arm(actor,'left',v(.25,1.2,.2+power*.55),v(.45,1.1,.1));this.arm(actor,'right',v(-.25,1.28,.2+power*.55),v(-.45,1.1,.1));
      }else{
        const side=id==='jab'?'left':'right',x=side==='left'?.16:-.16,heavy=id==='heavy';
        actor.body.rotation.y=(side==='left'?-1:1)*(-.18+power*(heavy?.85:.45));actor.body.rotation.x=.09*power;actor.body.position.z=power*.12;
        this.arm(actor,side,v(x,heavy?1.48:1.36,.18+power*.75),v(x*2.5,1.12,.12));
      }
    }else if(state==='windup'){
      actor.body.rotation.y=-.35;actor.body.position.y=data.attackKind==='low'?-.24:0;this.arm(actor,'right',v(-.35,data.heavy?1.85:1.54,-.15),v(-.46,1.23,-.28));this.arm(actor,'left',v(.17,1.33,.3),v(.43,1.08,.08));
    }else if(state==='dodge'){actor.body.position.y=-.23;actor.body.rotation.x=.24;actor.body.rotation.z=-.1;guard();}
    else if(state==='recover'&&data.tripTime>0){const tilt=Math.min(1,data.tripTime/.3);actor.body.position.y=.23*tilt;actor.body.rotation.z=-1.35*tilt;}
    else if(state==='hitstun'||(state==='recover'&&data.hurt>0)){actor.body.rotation.x=-.28;actor.body.rotation.z=.14;this.arm(actor,'left',v(.35,1.3,.08),v(.5,1,-.1));this.arm(actor,'right',v(-.35,1.25,.1),v(-.5,1,-.1));}
    if(data.hurt>0)actor.body.rotation.z+=Math.sin(time*35)*.05;
    if(actor.item){actor.group.updateWorldMatrix(true,true);const hand=actor.bones.rightHand.getWorldPosition(new T.Vector3());actor.item.position.copy(actor.group.worldToLocal(hand));actor.item.position.y-=.11;actor.item.rotation.set(-power*(data.weapon==='umbrella'||data.weapon==='baton'?1.4:.6),0,Math.sin(time*5+actor.phase)*(moving?.12:.015));}
  }
}
