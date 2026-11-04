import * as T from './vendor/three.module.js';
import {DOOR,WEAPONS} from './core.js';
import {TrafficFleet} from './traffic.js';
import {STOP,BUS_BOUNDS,busPose} from './layout.js';
import {CHARACTERS,characterById} from './characters.js';
import {HumanLibrary} from './humans.js';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
const C={blue:0x267d9b,cream:0xe7e0ca,rubber:0x242929,skin:0x73452d,road:0x6b7069};
const mat=(color,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
export class Stage {
  constructor(canvas){
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.95;
    this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.1,160);this.camera.position.set(18,11,20);
    this.look=new T.Vector3(0,1,-2);this.clock=0;this.effects=[];this.actors=[];this.shake=0;this.shakeEnabled=!matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.hemi=new T.HemisphereLight(0xb9d0e5,0x61523e,1.1);this.scene.add(this.hemi);
    this.sun=new T.DirectionalLight(0xffd6a0,3.8);this.sun.position.set(-14,14,9);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-26,right:26,top:24,bottom:-24,near:1,far:65});this.sun.shadow.bias=-.00025;this.sun.shadow.normalBias=.025;this.sun.shadow.radius=3;this.scene.add(this.sun);
    const rim=new T.DirectionalLight(0x9abacb,.8);rim.position.set(12,7,-10);this.scene.add(rim);this.humans=new HumanLibrary();
    this.environment=new T.Group();this.scene.add(this.environment);this.dynamic=new T.Group();this.scene.add(this.dynamic);
    this.materials={skin:mat(C.skin),black:mat(0x202c30),cream:mat(C.cream,.65,.12),blue:mat(C.blue,.38,.3),glass:new T.MeshPhysicalMaterial({color:0x658b94,metalness:.1,roughness:.12,transparent:true,opacity:.66,envMapIntensity:1.4,side:T.DoubleSide}),chrome:mat(0xa7b2ac,.3,.7),yellow:mat(0xe9b844),rubber:mat(C.rubber)};
    this.resize();window.addEventListener('resize',()=>this.resize());
  }
  resize(){this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
  async prepare(){
    await this.humans.load((done,total)=>{const label=document.querySelector('#load-screen p');if(label)label.textContent=`Loading commuters and motion… ${done} / ${total}`;});
    const loader=new T.TextureLoader(),maps=await Promise.all(['Diffuse','nor_gl','Rough'].map(key=>loader.loadAsync(new URL('./assets/surfaces/asphalt-'+key+'.jpg',import.meta.url).href)));
    maps.forEach(map=>{map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(17,17);map.anisotropy=8;});maps[0].colorSpace=T.SRGBColorSpace;this.materials.asphalt=new T.MeshStandardMaterial({map:maps[0],normalMap:maps[1],roughnessMap:maps[2],normalScale:new T.Vector2(.55,.55),roughness:1});
    const sky=document.createElement('canvas');sky.width=1024;sky.height=512;const context=sky.getContext('2d'),gradient=context.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#31516f');gradient.addColorStop(.42,'#8da8b8');gradient.addColorStop(.52,'#c6bda4');gradient.addColorStop(.57,'#a39b82');gradient.addColorStop(1,'#605a4a');context.fillStyle=gradient;context.fillRect(0,0,1024,512);const texture=new T.CanvasTexture(sky);texture.colorSpace=T.SRGBColorSpace;texture.mapping=T.EquirectangularReflectionMapping;this.sky=texture;const generator=new T.PMREMGenerator(this.renderer);this.environmentMap=generator.fromEquirectangular(texture);this.scene.environment=this.environmentMap.texture;this.scene.environmentIntensity=.6;generator.dispose();
  }
  box(parent,w,h,d,material,x=0,y=0,z=0){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),typeof material==='number'?mat(material):material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  roundedBox(parent,w,h,d,material,x=0,y=0,z=0,radius=.08){const mesh=new T.Mesh(new RoundedBoxGeometry(w,h,d,3,radius),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  cylinder(parent,r1,r2,h,material,x=0,y=0,z=0,segments=12){const mesh=new T.Mesh(new T.CylinderGeometry(r1,r2,h,segments),typeof material==='number'?mat(material):material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  label(text,width=512,height=128,bg='#e7dfbf',fg='#173d47'){
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${Math.min(height*.62,width/(text.length*.65))}px Arial`;ctx.fillText(text,width/2,height/2,width*.94);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:texture,roughness:.9});
  }
  texture(kind){
    if(kind==='road'&&this.materials.asphalt)return this.materials.asphalt;
    const cv=document.createElement('canvas');cv.width=cv.height=512;const cx=cv.getContext('2d');cx.fillStyle=kind==='road'?'#777d75':kind==='pavement'?'#858779':'#8b7f66';cx.fillRect(0,0,512,512);
    let seed=7;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    for(let i=0;i<16000;i++){const c=Math.floor(rand()*90+80);cx.fillStyle=`rgba(${c},${c},${c},${rand()*.2})`;cx.fillRect(rand()*512,rand()*512,rand()*3,rand()*3);}
    if(kind==='road'){cx.strokeStyle='#4c58504f';cx.lineWidth=1;for(let i=0;i<15;i++){cx.beginPath();let x=rand()*512,y=rand()*512;cx.moveTo(x,y);for(let j=0;j<6;j++){x+=rand()*40-20;y+=rand()*40;cx.lineTo(x,y);}cx.stroke();}}
    const tex=new T.CanvasTexture(cv);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(8,8);tex.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:tex,roughness:1});
  }
  clear(group){const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.isMesh){if(!this.humans.geometries.has(o.geometry))geometries.add(o.geometry);const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list)if(!Object.values(this.materials).includes(m)&&!this.humans.materials.has(m))materials.add(m);if(o.isSkinnedMesh)o.skeleton.dispose();if(o.isInstancedMesh)o.dispose();}});for(const g of geometries)g.dispose();for(const m of materials){if(m.map)m.map.dispose();m.dispose();}group.clear();}
  build(arena){
    this.clear(this.environment);this.clear(this.dynamic);this.actors=[];this.effects=[];this.pickupMeshes=[];this.extras=[];this.busRiders=[];this.escapeDeparture=0;this.queue=[];this.arena=arena;
    this.scene.background=this.sky;this.scene.fog=new T.Fog(0xb9b4a1,35,110);const g=this.environment;
    this.box(g,150,.18,150,this.texture('dirt'),0,-.17,0);this.box(g,65,.08,65,this.texture('road'),1,-.045,-1);
    for(let i=-6;i<10;i++){this.box(g,1.3,.1,.35,i%2?0xc8bda2:0x5c625c,-11,.02,i*1.8);}
    for(let i=-1;i<7;i++)this.box(g,.12,.012,1.2,0xddd5b3,9.6,.012,-10+i*3.8);
    // Small stains, drain covers and patched tarmac give the ground scale.
    this.box(g,1,.02,2,0x3f4948,-8,.02,3);for(let i=0;i<7;i++)this.box(g,.85,.025,.05,0x9a9e90,-8,.035,2.2+i*.25);
    this.mainBus=this.buildBus(g,STOP.x,STOP.z,arena.route);this.mainBus.rotation.y=STOP.yaw;this.doorOpenness=1;
    this.busPaint=this.materials.blue.clone();this.mainBus.children[0].material=this.busPaint;
    this.closedDoor=new T.Group();this.mainBus.add(this.closedDoor);this.box(this.closedDoor,.07,1.05,1.25,this.busPaint,1.49,1.13,.98);this.box(this.closedDoor,.075,.79,1.23,this.materials.glass,1.49,2.07,.98);this.box(this.closedDoor,.09,.08,.23,this.materials.chrome,1.55,1.53,1.36);
    this.fullSign=this.box(this.mainBus,.85,.29,.03,this.label('FULL',256,64,'#9b3b28','#fff0ce'),.72,2.35,3.13);
    this.seatSign=this.box(this.mainBus,.85,.29,.03,this.label('1 SEAT',256,64,'#274f42','#f4de86'),.72,2.35,3.13);
    for(let i=0;i<8;i++){const rider=this.humans.create(i%3);rider.group.position.set(i%2?.72:-.72,.65,-2.1+Math.floor(i/2)*1.28);this.mainBus.add(rider.group);this.busRiders.push(rider);}

    this.doorRing=new T.Mesh(new T.RingGeometry(.8,1,40),new T.MeshBasicMaterial({color:0xffd05b,transparent:true,opacity:.85,side:T.DoubleSide}));this.doorRing.rotation.x=-Math.PI/2;this.doorRing.position.set(DOOR.x,.025,DOOR.z);g.add(this.doorRing);
    const arrow=new T.Group();this.cylinder(arrow,.075,.075,.7,0xffcf49,0,.5,0);const cone=this.cylinder(arrow,0,.25,.32,0xffcf49,0,.03,0);cone.rotation.z=Math.PI;arrow.position.set(DOOR.x,1.4,DOOR.z);g.add(arrow);this.doorArrow=arrow;
    // Shop fronts are original fictional signs, never lifted from Street View.
    const signs=arena.id==='kaneshie'?['KANESHIE MARKET','AKUA’S PROVISIONS','FRESH FRUIT']:arena.id==='madina'?['MADINA MARKET','ZONGO STORES','MOBILE MONEY']:['ACCRA STORES','CHOP BAR','MOBILE MONEY'];
    for(let i=0;i<7;i++){
      const x=-22+i*7.2,h=3.5+(i%3)*1.25,z=-25-(i%2)*1.8;
      const color=[0xc2ad8e,arena.color,0xc7b99a,0x9baaaa,0xbf9472][i%5];this.box(g,5.7,h,4.3,color,x,h/2,z);this.box(g,6,.17,4.7,0x6c7773,x,h+.1,z);
      this.box(g,5.3,.75,.12,this.label(signs[i%3]),x,2.6,z+2.2);
      for(let k=0;k<3;k++){this.box(g,1.25,1.8,.1,i%2?0x687877:0x465e63,x-1.8+k*1.75,.95,z+2.21);for(let j=0;j<8;j++)this.box(g,1.25,.025,.06,0x8b9990,x-1.8+k*1.75,.2+j*.2,z+2.3);}
      if(h>4)for(let k=0;k<3;k++)this.box(g,1.15,.85,.12,this.materials.glass,x-1.7+k*1.7,h-1,z+2.22);
      for(let k=0;k<5;k++)this.box(g,.18,.08,4.8,0x809088,x-2.8+k*1.4,h+.23,z);
    }
    this.stall(-11,-4.5,0xbc6e42,'COLD WATER');this.stall(-11,2.4,0xd3aa49,'FRESH FRUIT');this.stall(14,-21,arena.accent,'CHOP BAR');
    if(arena.feature==='market'){this.stall(-7.5,-21,0x9d5c55,'PROVISIONS');this.stall(14,1.2,0xc69248,'FRESH FRUIT');this.stall(15,-4.2,0x588b80,'MARKET');}
    if(arena.feature==='flyover'){
      for(let i=0;i<4;i++)this.box(g,1.4,7,1.8,0xa8aaa0,-21+i*11,3.5,-22);
      this.box(g,65,.75,7,0xaaa99d,0,7.3,-22);this.box(g,65,.65,.25,0xc9c4b0,0,7.95,-18.6);this.box(g,65,.25,.15,0x5e7778,0,8.45,-18.6);
    }
    this.buildStation(g,arena);
    for(const [x,z] of [[-17,-8],[-15,7],[18,-5],[24,-13]])this.tree(x,z,arena.feature==='trees'?1.4:1);
    this.powerPole(-10,8);this.powerPole(-12,-10);
    const wire=new T.CatmullRomCurve3([new T.Vector3(-10,8.4,8),new T.Vector3(-11,7.4,-1),new T.Vector3(-12,8.4,-10)]);g.add(new T.Mesh(new T.TubeGeometry(wire,20,.018,4,false),mat(0x263e3e)));
    // Traffic cones and tyre stacks sit outside the combat space.
    for(let i=0;i<3;i++){this.cylinder(g,.12,.3,.7,0xd08b4f,-8+i*.8,.35,-8);this.box(g,.65,.08,.65,0x403f36,-8+i*.8,.04,-8);}
    for(let i=0;i<3;i++){const t=new T.Mesh(new T.TorusGeometry(.38,.13,16,32),this.materials.rubber);t.rotation.x=Math.PI/2;t.position.set(-9,.16+i*.24,-7.5);g.add(t);}
    this.mate=this.character(0xd2ba6f,false,null,2);this.mate.group.position.set(DOOR.x-2.3,0,DOOR.z+.05);this.mate.group.rotation.y=.35;g.add(this.mate.group);this.extras.push(this.mate);
    for(let i=0;i<6;i++){const a=this.character(0x7d9c91,false,i%2?'bag':'suitcase',i%3,CHARACTERS[(i+1)%CHARACTERS.length].id);a.group.position.set(-8.3+(i%2)*1.05,0,1.7+Math.floor(i/2)*1.1);a.group.rotation.y=Math.PI;g.add(a.group);this.queue.push({actor:a,x:a.group.position.x,z:a.group.position.z,index:i});}
    for(let i=0;i<3;i++){const a=this.character(0x7d9c91,false,'bag');a.group.position.set(-13+i*9,0,-19.7);a.group.rotation.y=1.6;g.add(a.group);this.extras.push(a);}
    this.menuHero=this.character(0xe4b74f,true,null,null,this.selectedCharacter||'office');this.menuHero.group.position.set(4.5,0,3);this.menuHero.group.rotation.y=.1;this.menuHero.ring.visible=false;g.add(this.menuHero.group);this.extras.push(this.menuHero);
    this.camera.fov=44;this.camera.updateProjectionMatrix();this.camera.position.set(10,3.6,10);this.look.set(1.2,1,-4);this.camera.lookAt(this.look);
  }
  groundText(parent,text,x,z,w,d){const material=this.label(text,1024,160,'#545953','#e9cb76');const mesh=new T.Mesh(new T.PlaneGeometry(w,d),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.035,z);parent.add(mesh);return mesh;}
  buildStation(g,arena){
    // Through traffic and the pull-in bay run parallel to the pavement.
    for(const [z,width] of [[-13.3,7.5]]){
      this.box(g,120,.025,width,0x414947,0,.008,z);
      for(let x=-55;x<58;x+=5)this.box(g,2.5,.015,.09,0xe7e3cb,x,.03,z);
      for(const side of [-1,1])this.box(g,120,.015,.12,0xe6dfb7,0,.03,z+side*(width/2-.2));
    }
    // Marked boarding bay, pedestrian kerb, shelter, and stop flag.
    this.box(g,26,.025,5.1,0x515750,0,.013,-6.95);
    for(const z of [-8.2,-4.5])for(let x=-4.8;x<5;x+=1.4)this.box(g,.85,.018,.1,0xf0c75a,x,.035,z);
    this.groundText(g,'TROTRO ONLY',0,-8.65,6.5,.7);
    this.groundText(g,'WAIT HERE',-4,3.6,3.7,.7);
    this.groundText(g,'BUS STOP',4.8,-3.4,3.3,.7);
    this.box(g,24,.018,14,this.texture('pavement'),0,.018,2.55);
    for(let x=-11;x<12;x+=1.2){if(Math.abs(x-DOOR.x)<.9)continue;this.box(g,1.15,.18,.22,(Math.round(x/1.2)%2)?0xdbcaa7:0x4c5553,x,.09,-4.5);}
    for(let x=-11;x<12;x+=2)this.box(g,.025,.008,12,0x787e73,x,.034,2);
    const shelter=new T.Group();shelter.position.set(-7.6,0,3.5);g.add(shelter);
    for(const x of [-2,2])for(const z of [-.9,.9])this.cylinder(shelter,.045,.045,2.85,0x385d59,x,1.42,z);
    this.roundedBox(shelter,4.6,.17,2.5,mat(0x3e706b),0,2.9,0,.055);
    this.box(shelter,4,.85,.05,this.label(arena.name.toUpperCase()+'  •  TROTRO STOP',1024,128,'#234c48','#f5df8d'),0,2.4,-.91);
    this.box(shelter,3.5,.13,.55,0x775c3e,0,.53,-.42);for(const x of [-1.3,1.3])this.box(shelter,.1,.5,.45,0x3a5351,x,.25,-.42);
    this.cylinder(g,.055,.055,3.3,0x67736c,4.8,1.65,-4.3);this.box(g,1.05,1.2,.08,this.label('BUS STOP',256,256,'#dbb45b','#193f42'),4.8,2.7,-4.3);
    this.groundText(g,'←  PULL IN',8,-7,3.5,.65);this.groundText(g,'←  DEPART',-8,-7,3.5,.65);
    this.traffic=new TrafficFleet();this.trafficModels=this.traffic.vehicles.map(v=>{
      const model=v.kind==='trotro'?this.buildBus(g,v.x,v.z,'ACCRA  —  CIRCLE',.9):this.buildCar(g,v.kind,v.id);model.rotation.y=v.direction*Math.PI/2;return model;
    });
  }
  buildCar(parent,kind,index){
    const car=new T.Group();parent.add(car);const paint=mat(kind==='taxi'?0xb9933d:[0x476b78,0xd2d3c7,0x6e3f35,0x3a4655][index%4],.32,.45),glass=this.materials.glass;
    this.roundedBox(car,1.85,.62,4.2,paint,0,.69,0,.16);this.roundedBox(car,1.64,.65,2.05,paint,0,1.21,-.28,.16);
    this.box(car,1.47,.49,.04,glass,0,1.24,.78).rotation.x=.26;this.box(car,1.45,.45,.04,glass,0,1.23,-1.3).rotation.x=-.22;
    for(const side of [-1,1]){for(const z of [-.8,.24])this.box(car,.025,.42,.83,glass,side*.83,1.25,z);this.box(car,.03,.5,.07,paint,side*.85,1.25,-.28);this.box(car,.03,.08,.2,this.materials.chrome,side*.94,.88,-.35);this.box(car,.19,.15,.22,paint,side*1,1.02,.69);}
    const wheels=[];for(const side of [-1,1])for(const z of [-1.35,1.3]){const wheel=new T.Group();wheel.position.set(side*.94,.4,z);car.add(wheel);const tyre=this.cylinder(wheel,.37,.37,.23,this.materials.rubber);tyre.rotation.z=Math.PI/2;const hub=this.cylinder(wheel,.21,.21,.24,this.materials.chrome);hub.rotation.z=Math.PI/2;wheels.push(wheel);}
    for(const side of [-1,1]){this.box(car,.45,.17,.04,0xf1e7bf,side*.59,.77,2.1);this.box(car,.43,.17,.04,0xa33229,side*.59,.77,-2.1);}
    this.box(car,1.6,.12,.1,this.materials.chrome,0,.47,2.12);this.box(car,.7,.17,.035,this.label('GR  2438',256,64,'#ddc368','#243a3e'),0,.64,2.13);
    if(kind==='taxi')this.box(car,.49,.19,.28,this.label('TAXI',256,80,'#f3d25f','#1c373d'),0,1.67,-.15);
    car.userData.wheels=wheels;return car;
  }
  updateStreet(dt,round){
    this.traffic.tick(dt);this.traffic.vehicles.forEach((v,i)=>{const mesh=this.trafficModels[i];mesh.position.x=v.x;mesh.position.z=v.z;for(const w of mesh.userData.wheels||[])w.rotation.x=v.wheel;});
    for(const q of this.queue){const goal=q.z-(round?.gathering?.6:0),moving=Math.abs(q.actor.group.position.z-goal)>.05;q.actor.group.position.z=T.MathUtils.damp(q.actor.group.position.z,goal,2,dt);q.actor.group.rotation.y=Math.PI+.15*Math.sin(this.clock*.5+q.index);this.humans.update(q.actor,{state:'idle',moving},dt,this.clock);}
  }
  buildBus(parent,x,z,route,scale=1){
    const bus=new T.Group();bus.position.set(x,0,z);bus.scale.setScalar(scale);parent.add(bus);const m=this.materials;
    this.roundedBox(bus,2.8,1.2,6.3,m.blue,0,1.1,0,.12);this.roundedBox(bus,2.75,.32,6.05,m.cream,0,2.74,-.05,.10);this.roundedBox(bus,2.82,.17,5.95,m.cream,0,2.96,-.1,.08);this.box(bus,2.84,.15,6.18,m.yellow,0,1.55,0);
    this.box(bus,2.5,.08,5.8,0x444a46,0,1.38,0);this.box(bus,2.38,.21,.65,0x343f42,0,1.87,2.63);
    for(const side of [-1,1])for(let i=0;i<4;i++){
      this.box(bus,.09,1.1,.08,m.cream,side*1.34,2.18,-2.7+i*1.43);
      if(side===1&&i===2)continue;
      this.roundedBox(bus,.76,.14,.65,m.black,side*.72,1.57,-2.1+i*1.28,.05);this.roundedBox(bus,.76,.55,.12,m.black,side*.72,1.86,-2.36+i*1.28,.06);
    }
    const steering=new T.Mesh(new T.TorusGeometry(.22,.025,10,28),m.black);steering.position.set(-.73,1.96,2.29);steering.rotation.x=-.35;bus.add(steering);
    // Passenger-side sliding doorway, recessed step and open black interior.
    this.box(bus,.06,1.88,1.27,0x20363c,1.43,1.55,.98);this.box(bus,.33,.16,1.3,m.chrome,1.56,.48,.98);this.box(bus,.06,1.79,.65,m.blue,1.49,1.61,-.02);this.box(bus,.08,.76,.53,m.glass,1.54,2.13,-.02);
    for(const side of [-1,1]){
      for(let i=0;i<4;i++){if(side===1&&i===3)continue;this.box(bus,.05,.81,1.1,m.glass,side*1.396,2.28,-2.15+i*1.4);this.box(bus,.065,.84,.045,m.chrome,side*1.43,2.28,-2.68+i*1.4);}
      this.box(bus,.06,.075,5.9,m.chrome,side*1.43,1.72,-.03);
      for(const wz of [-2,2]){
        const wheel=this.cylinder(bus,.5,.5,.25,m.rubber,side*1.36,.53,wz,24);wheel.rotation.z=Math.PI/2;const hub=this.cylinder(bus,.26,.26,.27,m.chrome,side*1.4,.53,wz,16);hub.rotation.z=Math.PI/2;
      }
      this.box(bus,.06,.4,.05,m.chrome,side*1.68,2.07,2.6);this.box(bus,.22,.4,.15,m.black,side*1.69,2.3,2.68);
      // Weathering marks, seams and worn lower panels.
      for(let i=0;i<13;i++){this.box(bus,.012,.018+(.02*(i%3)),.12+(i%4)*.14,i%2?0x6c827d:0x657a72,side*1.409,.72+(i%4)*.16,-2.7+i*.43);}
      this.box(bus,.015,.42,.025,0x356172,side*1.415,1.12,-.85);
    }
    const wind=this.box(bus,2.45,1.05,.08,m.glass,0,2.27,3.06);wind.rotation.x=.09;
    this.box(bus,2.5,.35,.09,this.label(route,512,80,'#e5d8ad','#253d42'),0,2.82,3.13);
    this.box(bus,2.55,.25,.15,m.chrome,0,.71,3.22);this.box(bus,1.1,.32,.06,0x223f4a,0,1.05,3.2);
    for(let i=0;i<6;i++)this.box(bus,.85,.025,.07,m.chrome,0,.96+i*.06,3.25);
    for(const side of [-1,1]){this.box(bus,.48,.3,.1,0xe0dec0,side*.95,1.12,3.19);this.box(bus,.18,.18,.11,0xd88b35,side*1.22,1.12,3.2);}
    this.box(bus,.67,.18,.06,this.label('GT  2457 – 24',256,64,'#d8af50','#263538'),0,.56,3.33);
    this.box(bus,1.8,.18,.07,this.label('BY GRACE',256,48,'#e8e0c5','#3b5558'),0,1.59,3.18);
    this.box(bus,2.4,.88,.07,m.glass,0,2.28,-3.09);this.box(bus,2.65,.16,.13,m.chrome,0,.71,-3.22);
    for(const side of [-1,1]){this.box(bus,.22,.62,.1,0x9d4d3d,side*1.13,1,-3.19);this.box(bus,.04,.5,5.4,m.chrome,side*1.18,3.26,-.15);}
    for(let i=0;i<7;i++)this.box(bus,2.4,.045,.055,m.chrome,0,3.03,-2.6+i*.8);
    for(const side of [-1,1]){const wiper=this.box(bus,.035,.65,.025,m.black,side*.6,2.03,3.14);wiper.rotation.z=-.6;}
    return bus;
  }
  stall(x,z,color,title){const g=new T.Group();g.position.set(x,0,z);this.environment.add(g);this.box(g,3.4,1.1,1.8,0x79644b,0,.55,0);for(const sx of [-1.6,1.6])this.cylinder(g,.045,.045,2.8,0x6f7766,sx,1.4,0);const roof=this.box(g,4,.12,2.8,color,0,2.6,0);roof.rotation.z=.04;this.box(g,3.4,.4,.04,this.label(title),0,1.8,.92);for(let i=0;i<10;i++){this.cylinder(g,.11,.13,.28,i%2?0xc2a755:0xb16f3c,-1.3+(i%5)*.6,1.24,-.4+Math.floor(i/5)*.7,7);}}
  tree(x,z,s){
    const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);this.environment.add(g);this.cylinder(g,.15,.3,4.8,0x5b5546,0,2.4,0,14);
    let seed=Math.abs(x*139+z*751)+5;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d');for(let i=0;i<22;i++){ctx.fillStyle=['#61734d','#6c8156','#455b3c'][i%3];ctx.beginPath();ctx.ellipse(20+random()*88,20+random()*88,3+random()*6,9+random()*12,random()*Math.PI,0,Math.PI*2);ctx.fill();}
    const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;const leaves=new T.MeshStandardMaterial({map:tex,alphaTest:.5,side:T.DoubleSide,roughness:1});
    const foliage=new T.InstancedMesh(new T.PlaneGeometry(.85,.85),leaves,700),dummy=new T.Object3D();
    for(let i=0;i<700;i++){const angle=random()*Math.PI*2,r=Math.sqrt(random())*2.9;dummy.position.set(Math.cos(angle)*r,4.9+random()*1.8-r*.15,Math.sin(angle)*r);dummy.rotation.set(random()*3,random()*6,random()*6);dummy.scale.setScalar(.65+random()*.7);dummy.updateMatrix();foliage.setMatrixAt(i,dummy.matrix);}foliage.castShadow=true;g.add(foliage);
    for(let i=0;i<9;i++){const end=new T.Vector3(Math.cos(i*2.4)*2,4.9+random(),Math.sin(i*2.4)*2),start=new T.Vector3(0,3.1+random(),0),dir=end.clone().sub(start);const branch=this.cylinder(g,.022,.09,dir.length(),0x5e5b4b);branch.position.copy(start.add(end).multiplyScalar(.5));branch.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());}
  }
  powerPole(x,z){this.cylinder(this.environment,.08,.14,9,0x7b7966,x,4.5,z);this.box(this.environment,1.9,.1,.1,0x575f58,x,8.3,z);}
  weaponModel(kind){
    const item=new T.Group(),leather=mat(kind==='suitcase'?0x36534c:0x795337,.88),dark=this.materials.black,metal=this.materials.chrome;
    if(kind==='umbrella'){
      this.cylinder(item,.014,.014,.94,metal,0,-.27,0,10);this.cylinder(item,.028,.075,.74,0x344756,0,-.35,0,14);
      const grip=new T.Mesh(new T.TorusGeometry(.055,.014,8,16,Math.PI),dark);grip.position.y=.15;item.add(grip);
    }else if(kind==='baton'){
      this.cylinder(item,.028,.028,.68,0x363c3d,0,-.19,0,12);for(let i=0;i<5;i++)this.cylinder(item,.032,.032,.015,dark,0,.02+i*.035,0,10);this.cylinder(item,.04,.04,.05,metal,0,-.53,0,12);
    }else if(kind==='stool'){
      this.roundedBox(item,.54,.1,.5,mat(0xa46b3c),0,-.07,0,.035);
      for(const x of [-.2,.2])for(const z of [-.18,.18]){const leg=this.box(item,.065,.48,.065,0x735035,x,-.35,z);leg.rotation.z=-x*.25;}
      this.box(item,.44,.04,.05,0x8a5b36,0,-.42,.18);this.box(item,.44,.04,.05,0x8a5b36,0,-.42,-.18);
    }else{
      const large=kind==='suitcase',w=large?.48:.37,h=large?.48:.28,d=large?.23:.14;
      this.roundedBox(item,w,h,d,leather,0,-h*.6,0,.035);this.box(item,w*.92,.022,d+.012,dark,0,-h*.1,0);
      const handle=new T.Mesh(new T.TorusGeometry(.065,.014,8,18,Math.PI),dark);handle.position.y=.025;item.add(handle);
      for(const side of [-1,1]){this.box(item,.022,h*.85,d+.012,dark,side*w*.32,-h*.6,0);this.box(item,.036,.04,.012,metal,side*w*.32,-h*.22,d*.54);if(large){const wheel=this.cylinder(item,.046,.046,.05,dark,side*.17,-.56,0,10);wheel.rotation.x=Math.PI/2;}}
    }
    return item;
  }
  equipVisual(actor,kind){
    kind=kind===true?'bag':kind;if(actor.item&&actor.weaponId===kind)return;
    if(actor.item){this.clear(actor.item);actor.group.remove(actor.item);}
    actor.item=kind?this.weaponModel(kind):new T.Group();actor.weaponId=kind;actor.group.add(actor.item);actor.item.visible=!!kind;
  }
  character(shirt,player=false,weapon=0,variant,characterId){
    const profile=characterId?characterById(characterId):null;
    const actor=this.humans.create(profile?.model??variant??(player?0:1+(Object.keys(WEAPONS).indexOf(weapon)%2)));actor.player=player;
    if(profile)actor.group.scale.setScalar(profile.height/1.84);
    if((player&&!profile)||profile?.look==='school'||profile?.look==='rider'){const fabric=mat(0x252e2c,.95),pack=new T.Group();actor.body.add(pack);this.roundedBox(pack,.33,.4,.17,fabric,0,1.25,-.23,.065);this.roundedBox(pack,.27,.2,.035,fabric,0,1.15,-.325,.025);this.box(pack,.2,.008,.012,this.materials.chrome,0,1.26,-.347);for(const side of [-1,1]){const strap=new T.CatmullRomCurve3([new T.Vector3(side*.15,1.05,-.24),new T.Vector3(side*.19,1.55,-.07),new T.Vector3(side*.19,1.48,.16),new T.Vector3(side*.16,1.12,.16)]);pack.add(new T.Mesh(new T.TubeGeometry(strap,14,.014,6,false),fabric));}}
    actor.weaponId=null;this.equipVisual(actor,player?(profile?.item||null):(weapon||profile?.item||'bag'));
    const ring=new T.Mesh(new T.RingGeometry(.34,.365,40),new T.MeshBasicMaterial({color:player?0xe7bb5b:0xc87737,transparent:true,opacity:player?.55:0,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.018;actor.group.add(ring);actor.ring=ring;
    const hpGroup=new T.Group();hpGroup.position.y=2.03;const hpBg=new T.Mesh(new T.PlaneGeometry(.55,.034),new T.MeshBasicMaterial({color:0x15242b,depthTest:false}));const hp=new T.Mesh(new T.PlaneGeometry(.53,.022),new T.MeshBasicMaterial({color:0xd6b076,depthTest:false}));hp.position.z=.005;hpGroup.add(hpBg,hp);actor.group.add(hpGroup);hpGroup.visible=false;actor.hp=hp;actor.hpGroup=hpGroup;
    this.humans.update(actor,{state:'idle'},.01,this.clock);return actor;
  }
  selectCharacter(id){
    this.selectedCharacter=id;if(!this.menuHero)return;const old=this.menuHero,index=this.extras.indexOf(old);this.clear(old.group);this.environment.remove(old.group);const hero=this.character(0xe4b74f,true,null,null,id);hero.group.position.set(4.5,0,3);hero.group.rotation.y=.1;hero.ring.visible=false;this.environment.add(hero.group);this.menuHero=hero;this.extras[index]=hero;
  }
  portraits(){
    const portraits=new Map(),scene=new T.Scene();scene.background=new T.Color(0x1b2d37);scene.add(new T.HemisphereLight(0xd8e8ef,0x82745b,2));const light=new T.DirectionalLight(0xffddb0,3);light.position.set(-2,4,5);scene.add(light);scene.environment=this.scene.environment;
    const camera=new T.PerspectiveCamera(28,180/230,.1,20);camera.position.set(.2,1.13,4.4);camera.lookAt(0,.99,0);this.renderer.setPixelRatio(1);this.renderer.setSize(180,230,false);
    for(const c of CHARACTERS){const actor=this.character(0xe4b74f,true,null,null,c.id);scene.add(actor.group);actor.group.rotation.y=.18;actor.ring.visible=false;this.humans.update(actor,{state:'idle'},.3,0);this.renderer.render(scene,camera);portraits.set(c.id,this.renderer.domElement.toDataURL('image/webp',.86));this.clear(actor.group);scene.remove(actor.group);}
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.resize();return portraits;
  }
  begin(round){
    this.menuHero.group.visible=false;this.camera.fov=50;this.camera.updateProjectionMatrix();this.clear(this.dynamic);this.effects=[];this.actors=[];this.player=this.character(0xe4b74f,true,null,null,round.player.character);this.dynamic.add(this.player.group);
    this.actors=round.enemies.map(e=>{
      const a=this.character([0xb87359,0x6e8c94,0x87995d,0xbca278,0x7a7596,0x558c80][e.id%6],false,e.weapon,null,e.character);this.dynamic.add(a.group);
      if(e.role==='keeper'){
        const material=this.label('HEAVY BLOCKER',512,64,'#18252c','#f4c66a');material.depthTest=false;material.fog=false;
        a.roleLabel=new T.Mesh(new T.PlaneGeometry(1.15,.145),material);a.roleLabel.position.y=.15;a.hpGroup.add(a.roleLabel);
      }
      if(e.role==='keeper'){a.group.scale.multiplyScalar(1.04);a.hpGroup.scale.setScalar(1.25);}
      return a;
    });
    this.pickupMeshes=round.pickups.map(p=>{
      const mesh=new T.Group();mesh.position.set(p.x,0,p.z);this.dynamic.add(mesh);
      const color=WEAPONS[p.type]?.color||0x94ddb7,ring=new T.Mesh(new T.RingGeometry(.35,.42,24),new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;mesh.add(ring);
      const display=new T.Group();mesh.add(display);display.position.y=.8;
      if(WEAPONS[p.type]){display.add(this.weaponModel(p.type));const label=this.box(mesh,.9,.18,.025,this.label(WEAPONS[p.type].name.toUpperCase(),256,64,'#15242b','#ecd9ac'),0,1.1,0);mesh.userData.label=label;}
      else{this.cylinder(display,.11,.12,.4,0x89ac9d);this.cylinder(display,.07,.07,.1,0xf0ead6,0,.25,0);}
      mesh.userData.display=display;return mesh;
    });
  }
  pose(actor,data,dt){
    const isPlayer=actor.player,state=isPlayer?data.action:data.state;actor.group.visible=state!=='boarded';actor.group.position.set(data.x,data.y||0,data.z);const diff=Math.atan2(Math.sin(data.face-actor.group.rotation.y),Math.cos(data.face-actor.group.rotation.y));actor.group.rotation.y+=diff*Math.min(1,dt*15);
    this.equipVisual(actor,data.weapon);this.humans.update(actor,data,dt,this.clock);
    if(isPlayer){actor.ring.material.color.setHex(data.rushing?0x83e4df:0xe7bb5b);actor.ring.scale.setScalar(data.rushing?1.35:1);}
    if(!isPlayer){actor.hpGroup.visible=(data.focused||data.hp<data.maxHp)&&!['down','boarded'].includes(state);actor.hp.scale.x=Math.max(0,data.hp/data.maxHp);actor.hp.position.x=-(1-actor.hp.scale.x)*.265;actor.hp.material.color.setHex(0xd6b076);actor.hpGroup.quaternion.copy(this.camera.quaternion);if(actor.roleLabel)actor.roleLabel.visible=data.role==='keeper';}
    if(state==='windup'){actor.ring.material.opacity=.35+Math.sin(this.clock*18)*.15;actor.ring.material.color.setHex(data.heavy?0xf04836:data.attackKind==='low'?0xffd45a:0xef8953);actor.ring.scale.setScalar(data.heavy?5.5:1.7);}else if(!isPlayer){actor.ring.position.y=.025-(data.y||0);actor.ring.scale.setScalar(data.focused?1.7:1);actor.ring.material.opacity=['down','boarded'].includes(state)?0:data.focused?.85:.12;actor.ring.material.color.setHex(['rushing','boarding'].includes(state)?0xff835b:data.defending?0x89e4e0:0xf2c261);}
    if(state==='down'){actor.item.position.set(.45,.15,.25);actor.item.rotation.set(0,.3,Math.PI/2);}
    if(isPlayer){actor.item.visible=!!data.weapon;this.attackTrail(actor,data,dt);}
  }
  attackTrail(actor,data,dt){
    const active=data.action==='attack'&&data.movePhase>.08&&data.movePhase<.65;
    const kick=['kick','spin','sweep','knee'].includes(data.moveId),bone=kick?actor.bones.rightFoot:data.moveId==='jab'?actor.bones.leftHand:actor.bones.rightHand;
    actor.group.updateWorldMatrix(true,true);const point=bone.getWorldPosition(new T.Vector3());
    if(active&&actor.lastTrail&&actor.trailMove===data.moveId&&dt>0){const length=point.distanceTo(actor.lastTrail);if(length>.035&&length<2){const mesh=new T.Mesh(new T.CylinderGeometry(.017,.035,length,5),new T.MeshBasicMaterial({color:data.moveId==='special'?0x8cfff2:0xffdf9b,transparent:true,opacity:.6,depthWrite:false}));mesh.position.copy(point).add(actor.lastTrail).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),point.clone().sub(actor.lastTrail).normalize());this.dynamic.add(mesh);this.effects.push({mesh,kind:'trail',life:.13});}}
    actor.lastTrail=active?point:null;actor.trailMove=data.moveId;
  }
  impact(x,z,finish=false,height=1.3){for(let i=0;i<7;i++){const mesh=new T.Mesh(new T.BoxGeometry(.06,.06,.06),new T.MeshBasicMaterial({color:finish?0xffce60:0xffeed0}));mesh.position.set(x,height,z);this.dynamic.add(mesh);this.effects.push({mesh,v:new T.Vector3((Math.random()-.5)*5,Math.random()*3,(Math.random()-.5)*5),life:.35});}if(this.shakeEnabled)this.shake=finish?.13:.06;}
  project(x,y,z){const point=new T.Vector3(x,y,z).project(this.camera);return{x:(point.x+1)*innerWidth/2,y:(1-point.y)*innerHeight/2};}
  shoveWave(x,z){const mesh=new T.Mesh(new T.RingGeometry(.8,.9,48),new T.MeshBasicMaterial({color:0xf2cd80,transparent:true,opacity:.45,side:T.DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.035,z);this.dynamic.add(mesh);this.effects.push({mesh,kind:'wave',life:.4});if(this.shakeEnabled)this.shake=.13;}
  updateBus(round,dt,lobby){
    const bus=this.mainBus,cycle=round?.bus,phase=lobby?'boarding':cycle.phase,departed=round&&round.status==='won',t=cycle?.progress||0;
    const pose=busPose(phase,t);bus.visible=phase!=='waiting';bus.rotation.y=pose.yaw;bus.position.set(pose.x,0,pose.z);
    if(departed){this.escapeDeparture=Math.min(1,this.escapeDeparture+dt/3.2);const exit=busPose('departing',this.escapeDeparture);bus.position.set(exit.x,0,exit.z);bus.rotation.y=exit.yaw;this.player.group.visible=false;}
    const parked=phase==='full'||phase==='boarding',full=!lobby&&cycle.full;
    this.busPaint.color.setHex([0x267d9b,0x427f6b,0x935744][((cycle?.number||1)-1)%3]);
    const open=phase==='boarding'&&!departed?(cycle?.remaining<1?.3:1):0;this.doorOpenness=T.MathUtils.damp(this.doorOpenness,open,7,dt);this.closedDoor.visible=true;this.closedDoor.position.z=-1.4*this.doorOpenness;this.fullSign.visible=full;this.seatSign.visible=!full;
    this.mate.group.visible=parked&&!departed;
    this.busRiders.forEach((rider,i)=>{rider.group.visible=full||i!==7;this.humans.update(rider,{state:'seated'},dt,this.clock);});
    this.doorArrow.position.y=1.3+Math.sin(this.clock*3)*.14;this.doorArrow.visible=!departed&&phase==='boarding';
    this.doorRing.visible=parked&&!departed;this.doorRing.material.color.setHex(full?0xa08d81:round?.doorCalled?0xffd05b:0xcc8d57);this.doorRing.material.opacity=full?.22:(lobby||round?.doorCalled)?.65+Math.sin(this.clock*4)*.15:.18;
  }
  update(dt,round,lobby=false){
    this.clock+=dt;this.updateStreet(dt,round);const narrow=innerWidth<760;for(const actor of this.extras||[])this.humans.update(actor,{state:'idle'},dt,this.clock);
    if(lobby){const target=new T.Vector3(narrow?10:10,narrow?4.4:3.6,narrow?13:10);this.camera.position.lerp(target,Math.min(1,dt*2));this.look.lerp(new T.Vector3(narrow?2:1.2,1,-4),dt*2);}
    else if(round&&this.player){
      round.player.moving=!!round.player.moving;round.player.rushing=round.rushTime>0;round.player.combat=round.combatActive;this.pose(this.player,round.player,dt);const focused=round.combat.target;round.enemies.forEach((e,i)=>{e.combat=round.combatActive;e.focused=e.id===focused?.id;this.pose(this.actors[i],e,dt);});
      round.pickups.forEach((p,i)=>{const mesh=this.pickupMeshes[i];mesh.visible=!p.used;mesh.userData.display.position.y=.8+Math.sin(this.clock*3+i)*.04;if(mesh.userData.label)mesh.userData.label.quaternion.copy(this.camera.quaternion);});
      const p=round.player,focus=new T.Vector3(p.x*.72+DOOR.x*.28,1.05,p.z*.72+DOOR.z*.28),waiting=!round.combatActive;
      const special=round.combat.active?.move.id==='special'&&this.shakeEnabled;
      if(special&&focused){focus.x=(p.x+focused.x)/2;focus.z=(p.z+focused.z)/2;focus.y=1.2;}
      const target=focus.clone().add(new T.Vector3(narrow?7.5:special?3.8:5.2,narrow?6.5:special?2.2:waiting?5.1:3.6,narrow?11:special?5.3:waiting?10:7.1));
      this.camera.fov=T.MathUtils.damp(this.camera.fov,special?43:50,5,dt);this.camera.updateProjectionMatrix();
      const obstruction=new T.Box3(new T.Vector3(BUS_BOUNDS.minX,.25,BUS_BOUNDS.minZ),new T.Vector3(BUS_BOUNDS.maxX,3.2,BUS_BOUNDS.maxZ));const sight=new T.Ray(target,focus.clone().sub(target).normalize());if(round.busBlocksGround&&sight.intersectsBox(obstruction))target.y+=3;
      this.camera.position.lerp(target,1-Math.exp(-dt*3.5));this.look.lerp(focus,1-Math.exp(-dt*5));
    }
    this.camera.lookAt(this.look);if(this.shake>0){this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.y+=(Math.random()-.5)*this.shake;this.shake=Math.max(0,this.shake-dt*.4);}
    this.updateBus(round,dt,lobby);
    for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i];e.life-=dt;if(e.kind==='wave'){e.mesh.scale.setScalar(1+(.4-e.life)*6);e.mesh.material.opacity=Math.max(0,e.life/.4)*.45;}else if(e.kind==='trail'){e.mesh.material.opacity=Math.max(0,e.life/.13)*.6;}else{e.mesh.position.addScaledVector(e.v,dt);e.v.y-=dt*8;e.mesh.scale.setScalar(Math.max(0,e.life/.35));}if(e.life<=0){this.dynamic.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();this.effects.splice(i,1);}}
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.clear(this.environment);this.clear(this.dynamic);this.renderer.dispose();}
}
