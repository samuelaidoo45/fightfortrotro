import * as T from './vendor/three.module.js';
import {DOOR} from './core.js';
const C={blue:0x267d9b,cream:0xe7e0ca,rubber:0x242929,skin:0x73452d,road:0x6b7069};
const mat=(color,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
export class Stage {
  constructor(canvas){
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.1,160);this.camera.position.set(18,11,20);
    this.look=new T.Vector3(0,1,-2);this.clock=0;this.effects=[];this.actors=[];this.shake=0;this.shakeEnabled=!matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.hemi=new T.HemisphereLight(0xe5f3fb,0x947657,2.4);this.scene.add(this.hemi);
    this.sun=new T.DirectionalLight(0xffe6bd,3.4);this.sun.position.set(-10,20,10);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-26,right:26,top:24,bottom:-24,near:1,far:65});this.sun.shadow.bias=-.0005;this.sun.shadow.normalBias=.04;this.scene.add(this.sun);
    this.environment=new T.Group();this.scene.add(this.environment);this.dynamic=new T.Group();this.scene.add(this.dynamic);
    this.materials={skin:mat(C.skin),black:mat(0x202c30),cream:mat(C.cream),blue:mat(C.blue,.48,.2),glass:new T.MeshStandardMaterial({color:0x36616b,metalness:.35,roughness:.18}),chrome:mat(0xa7b2ac,.3,.7),yellow:mat(0xe9b844),rubber:mat(C.rubber)};
    this.resize();window.addEventListener('resize',()=>this.resize());
  }
  resize(){this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
  box(parent,w,h,d,material,x=0,y=0,z=0){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),typeof material==='number'?mat(material):material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  cylinder(parent,r1,r2,h,material,x=0,y=0,z=0,segments=12){const mesh=new T.Mesh(new T.CylinderGeometry(r1,r2,h,segments),typeof material==='number'?mat(material):material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  label(text,width=512,height=128,bg='#e7dfbf',fg='#173d47'){
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${Math.min(height*.62,width/(text.length*.65))}px Arial`;ctx.fillText(text,width/2,height/2,width*.94);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:texture,roughness:.9});
  }
  texture(kind){
    const cv=document.createElement('canvas');cv.width=cv.height=512;const cx=cv.getContext('2d');cx.fillStyle=kind==='road'?'#777d75':'#b6a38a';cx.fillRect(0,0,512,512);
    let seed=7;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    for(let i=0;i<16000;i++){const c=Math.floor(rand()*90+80);cx.fillStyle=`rgba(${c},${c},${c},${rand()*.2})`;cx.fillRect(rand()*512,rand()*512,rand()*3,rand()*3);}
    if(kind==='road'){cx.strokeStyle='#4c58504f';cx.lineWidth=1;for(let i=0;i<15;i++){cx.beginPath();let x=rand()*512,y=rand()*512;cx.moveTo(x,y);for(let j=0;j<6;j++){x+=rand()*40-20;y+=rand()*40;cx.lineTo(x,y);}cx.stroke();}}
    const tex=new T.CanvasTexture(cv);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(8,8);tex.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:tex,roughness:1});
  }
  clear(group){const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list)if(!Object.values(this.materials).includes(m))materials.add(m);}});for(const g of geometries)g.dispose();for(const m of materials){if(m.map)m.map.dispose();m.dispose();}group.clear();}
  build(arena){
    this.clear(this.environment);this.clear(this.dynamic);this.actors=[];this.effects=[];this.pickupMeshes=[];this.arena=arena;
    this.scene.background=new T.Color(arena.sky);this.scene.fog=new T.Fog(arena.sky,35,90);const g=this.environment;
    this.box(g,150,.18,150,this.texture('dirt'),0,-.17,0);this.box(g,27,.08,28,this.texture('road'),1,-.045,-1);
    for(let i=-6;i<10;i++){this.box(g,1.3,.1,.35,i%2?0xc8bda2:0x5c625c,-11,.02,i*1.8);}
    for(let i=-1;i<7;i++)this.box(g,.12,.012,1.2,0xddd5b3,9.6,.012,-10+i*3.8);
    // Small stains, drain covers and patched tarmac give the ground scale.
    for(let i=0;i<12;i++){const decal=this.cylinder(g,.3+i%3*.15,.3+i%3*.15,.008,0x626a60,(i*7.13)%19-9,.006,(i*3.75)%17-8,18);decal.scale.x=1.7;}
    this.box(g,1,.02,2,0x3f4948,-8,.02,3);for(let i=0;i<7;i++)this.box(g,.85,.025,.05,0x9a9e90,-8,.035,2.2+i*.25);
    this.mainBus=this.buildBus(g,3,-3.45,arena.route);
    this.doorRing=new T.Mesh(new T.RingGeometry(.8,1,40),new T.MeshBasicMaterial({color:0xffd05b,transparent:true,opacity:.85,side:T.DoubleSide}));this.doorRing.rotation.x=-Math.PI/2;this.doorRing.position.set(DOOR.x,.025,DOOR.z);g.add(this.doorRing);
    const arrow=new T.Group();this.cylinder(arrow,.075,.075,.7,0xffcf49,0,.5,0);const cone=this.cylinder(arrow,0,.25,.32,0xffcf49,0,.03,0);cone.rotation.z=Math.PI;arrow.position.set(DOOR.x,1.4,DOOR.z);g.add(arrow);this.doorArrow=arrow;
    // Shop fronts are original fictional signs, never lifted from Street View.
    const signs=arena.id==='kaneshie'?['KANESHIE MARKET','AKUA’S PROVISIONS','FRESH FRUIT']:arena.id==='madina'?['MADINA MARKET','ZONGO STORES','MOBILE MONEY']:['ACCRA STORES','CHOP BAR','MOBILE MONEY'];
    for(let i=0;i<7;i++){
      const x=-18+i*6.2,h=3.5+(i%3)*1.25,z=-14-(i%2)*1.8;
      const color=[0xc2ad8e,arena.color,0xc7b99a,0x9baaaa,0xbf9472][i%5];this.box(g,5.7,h,4.3,color,x,h/2,z);this.box(g,6,.17,4.7,0x6c7773,x,h+.1,z);
      this.box(g,5.3,.75,.12,this.label(signs[i%3]),x,2.6,z+2.2);
      for(let k=0;k<3;k++){this.box(g,1.25,1.8,.1,i%2?0x687877:0x465e63,x-1.8+k*1.75,.95,z+2.21);for(let j=0;j<8;j++)this.box(g,1.25,.025,.06,0x8b9990,x-1.8+k*1.75,.2+j*.2,z+2.3);}
      if(h>4)for(let k=0;k<3;k++)this.box(g,1.15,.85,.12,this.materials.glass,x-1.7+k*1.7,h-1,z+2.22);
      for(let k=0;k<5;k++)this.box(g,.18,.08,4.8,0x809088,x-2.8+k*1.4,h+.23,z);
    }
    this.stall(-11,-4.5,0xbc6e42,'COLD WATER');this.stall(-11,2.4,0xd3aa49,'FRESH FRUIT');this.stall(10,-9,arena.accent,'CHOP BAR');
    if(arena.feature==='market'){this.stall(-7.5,-9.5,0x9d5c55,'PROVISIONS');this.stall(14,1.2,0xc69248,'FRESH FRUIT');this.stall(13,-4.2,0x588b80,'MARKET');}
    if(arena.feature==='flyover'){
      for(let i=0;i<4;i++)this.box(g,1.4,7,1.8,0xa8aaa0,-21+i*11,3.5,-22);
      this.box(g,65,.75,7,0xaaa99d,0,7.3,-22);this.box(g,65,.65,.25,0xc9c4b0,0,7.95,-18.6);this.box(g,65,.25,.15,0x5e7778,0,8.45,-18.6);
    }
    if(arena.feature==='yard'){this.buildBus(g,-7,-8,'ACCRA  —  TEMA',.82);this.buildBus(g,12,-7,'CIRCLE  —  ACCRA',.85);}
    else this.buildBus(g,13,-10,'ACCRA  —  CIRCLE',.75);
    for(const [x,z] of [[-17,-8],[-15,7],[18,-5],[24,-13]])this.tree(x,z,arena.feature==='trees'?1.4:1);
    this.powerPole(-10,8);this.powerPole(-12,-10);
    const wire=new T.CatmullRomCurve3([new T.Vector3(-10,8.4,8),new T.Vector3(-11,7.4,-1),new T.Vector3(-12,8.4,-10)]);g.add(new T.Mesh(new T.TubeGeometry(wire,20,.018,4,false),mat(0x263e3e)));
    // Traffic cones and tyre stacks sit outside the combat space.
    for(let i=0;i<3;i++){this.cylinder(g,.12,.3,.7,0xd08b4f,-8+i*.8,.35,-8);this.box(g,.65,.08,.65,0x403f36,-8+i*.8,.04,-8);}
    for(let i=0;i<3;i++){const t=new T.Mesh(new T.TorusGeometry(.47,.15,8,20),this.materials.rubber);t.rotation.x=Math.PI/2;t.position.set(10,.2+i*.3,5);g.add(t);}
    this.mate=this.character(0xd2ba6f,false,2);this.mate.group.position.set(4.55,0,-4.25);this.mate.group.rotation.y=.5;g.add(this.mate.group);
    for(let i=0;i<7;i++){const a=this.character([0xae7866,0x7d9c91,0xd8bc76,0x60788f][i%4],false,i%3);a.group.position.set(-13+i*3.7,0,-9.5);a.group.rotation.y=.8;g.add(a.group);}
    this.camera.position.set(19,10.3,20);this.look.set(.6,1.2,-2.2);this.camera.lookAt(this.look);
  }
  buildBus(parent,x,z,route,scale=1){
    const bus=new T.Group();bus.position.set(x,0,z);bus.scale.setScalar(scale);parent.add(bus);const m=this.materials;
    this.box(bus,2.8,1.2,6.3,m.blue,0,1.1,0);this.box(bus,2.75,1.28,6.05,m.cream,0,2.26,-.05);this.box(bus,2.82,.17,5.95,m.cream,0,2.96,-.1);this.box(bus,2.84,.15,6.18,m.yellow,0,1.55,0);
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
  tree(x,z,s){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);this.environment.add(g);this.cylinder(g,.18,.3,4.4,0x7e7056,0,2.2,0);for(let i=0;i<5;i++){const mesh=new T.Mesh(new T.IcosahedronGeometry(1.8+(i%2)*.4,1),mat([0x6c8060,0x708963,0x879774][i%3]));mesh.position.set(Math.cos(i*2)*1.1,4.5+i%2*.8,Math.sin(i*2)*1.1);mesh.castShadow=true;g.add(mesh);}}
  powerPole(x,z){this.cylinder(this.environment,.08,.14,9,0x7b7966,x,4.5,z);this.box(this.environment,1.9,.1,.1,0x575f58,x,8.3,z);}
  character(shirt,player=false,weapon=0){
    const group=new T.Group(),body=new T.Group();group.add(body);const m=this.materials,skin=player?mat(0x75492f):mat([0x68432d,0x8b5d3a,0x5a3a2c][weapon%3]);
    this.box(body,.66,.76,.36,shirt,0,1.14,0);this.cylinder(body,.12,.14,.15,skin,0,1.6,0);const head=new T.Mesh(new T.SphereGeometry(.24,14,12),skin);head.scale.set(.88,1.16,.9);head.position.y=1.9;head.castShadow=true;body.add(head);
    const hair=new T.Mesh(new T.SphereGeometry(.225,12,8,0,Math.PI*2,0,Math.PI*.5),m.black);hair.position.set(0,1.99,0);body.add(hair);
    // Nose and ears orient the silhouette without a cartoon face.
    this.box(body,.075,.1,.085,skin,0,1.89,.215);this.cylinder(body,.045,.045,.11,skin,-.215,1.88,0,8);this.cylinder(body,.045,.045,.11,skin,.215,1.88,0,8);
    const arms=[];for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.41,1.45,0);body.add(arm);this.box(arm,.22,.29,.25,shirt,0,-.12,0);this.cylinder(arm,.095,.08,.42,skin,0,-.45,0);const hand=new T.Mesh(new T.SphereGeometry(.11,10,8),skin);hand.position.y=-.7;arm.add(hand);arms.push(arm);}
    const legs=[];for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.18,.8,0);body.add(leg);this.box(leg,.26,.68,.29,player?0x313d4d:0x475250,0,-.31,0);this.box(leg,.29,.17,.44,m.black,0,-.66,.06);legs.push(leg);}
    if(player){this.box(body,.48,.5,.12,0x3e737c,0,1.2,-.24);this.box(body,.055,.66,.05,0x668c87,-.22,1.22,.2);this.box(body,.055,.66,.05,0x668c87,.22,1.22,.2);}
    const item=new T.Group();arms[1].add(item);item.position.set(0,-.6,.12);
    if(weapon===0){this.box(item,.44,.42,.18,0x9b754e,0,-.1,.1);this.box(item,.28,.05,.05,0x533f2d,0,.18,.1);}
    else if(weapon===1){this.cylinder(item,.025,.025,1.45,0x565d5d,0,.1,0,8);const tip=new T.Mesh(new T.ConeGeometry(.14,.8,10),mat(0x68747d));tip.position.y=.9;item.add(tip);item.rotation.x=.15;}
    else{this.box(item,.37,.6,.22,0x8d6349,0,-.15,0);this.box(item,.22,.07,.08,0xb2966a,0,.21,0);}
    if(player)item.visible=false;
    const ring=new T.Mesh(new T.RingGeometry(.43,.5,24),new T.MeshBasicMaterial({color:player?0xffd15a:0xdc8147,transparent:true,opacity:player?.9:0,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;group.add(ring);
    const hpGroup=new T.Group();hpGroup.position.y=2.35;const hpBg=new T.Mesh(new T.PlaneGeometry(.78,.055),new T.MeshBasicMaterial({color:0x344844,depthTest:false}));const hp=new T.Mesh(new T.PlaneGeometry(.76,.04),new T.MeshBasicMaterial({color:0xe2a86a,depthTest:false}));hp.position.z=.005;hpGroup.add(hpBg,hp);group.add(hpGroup);hpGroup.visible=!player;
    return{group,body,arms,legs,item,ring,hp,hpGroup,player};
  }
  begin(round){
    this.clear(this.dynamic);this.effects=[];this.actors=[];this.player=this.character(0xe4b74f,true);this.dynamic.add(this.player.group);
    this.actors=round.enemies.map(e=>{const a=this.character([0xb87359,0x6e8c94,0x87995d,0xbca278,0x7a7596,0x558c80][e.id%6],false,e.weapon);this.dynamic.add(a.group);return a;});
    this.pickupMeshes=round.pickups.map(p=>{const mesh=new T.Group();mesh.position.set(p.x,0,p.z);this.dynamic.add(mesh);const ring=new T.Mesh(new T.RingGeometry(.35,.42,24),new T.MeshBasicMaterial({color:p.type==='bag'?0xffd15a:0x94ddb7,side:T.DoubleSide,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;mesh.add(ring);if(p.type==='bag'){this.box(mesh,.55,.4,.22,0x986a47,0,.5,0);this.box(mesh,.3,.07,.08,0x5f4f39,0,.76,0);}else{this.cylinder(mesh,.11,.12,.4,0x89ac9d,0,.5,0);this.cylinder(mesh,.07,.07,.1,0xf0ead6,0,.75,0);}return mesh;});
  }
  pose(actor,data,dt){
    const isPlayer=actor.player,state=isPlayer?data.action:data.state;actor.group.position.set(data.x,0,data.z);const diff=Math.atan2(Math.sin(data.face-actor.group.rotation.y),Math.cos(data.face-actor.group.rotation.y));actor.group.rotation.y+=diff*Math.min(1,dt*18);
    actor.body.rotation.set(0,0,0);actor.body.position.y=0;actor.arms[0].rotation.set(0,0,.08);actor.arms[1].rotation.set(0,0,-.08);actor.legs[0].rotation.x=actor.legs[1].rotation.x=0;
    if(state==='down'){actor.body.rotation.x=-Math.PI/2;actor.body.position.y=.2;actor.hpGroup.visible=false;actor.ring.material.opacity=0;return;}
    if(!isPlayer){actor.hpGroup.visible=data.hp<data.maxHp;actor.hp.scale.x=Math.max(0,data.hp/data.maxHp);actor.hp.position.x=-(1-actor.hp.scale.x)*.38;actor.hpGroup.quaternion.copy(this.camera.quaternion);}
    if(state==='chase'||(isPlayer&&data.moving)){const walk=Math.sin(data.walk)*.6;actor.legs[0].rotation.x=walk;actor.legs[1].rotation.x=-walk;actor.arms[0].rotation.x=-walk*.6;actor.arms[1].rotation.x=walk*.6;actor.body.position.y=Math.abs(Math.sin(data.walk))*.035;}
    if(state==='windup'){actor.arms[1].rotation.x=-2.7;actor.body.rotation.z=-.12;actor.ring.material.opacity=.45+Math.sin(this.clock*22)*.25;actor.ring.scale.setScalar(1.7);}
    else if(!isPlayer)actor.ring.material.opacity=0;
    if(state==='swing'||state==='attack'){actor.arms[1].rotation.x=-1.25;actor.arms[1].rotation.z=-.65;actor.body.rotation.y=-.35;actor.arms[0].rotation.x=-.6;}
    if(state==='block'){actor.arms[0].rotation.x=-1.6;actor.arms[0].rotation.z=-.4;actor.arms[1].rotation.x=-1.6;actor.arms[1].rotation.z=.4;actor.body.rotation.x=.1;}
    if(state==='dodge'){actor.body.rotation.x=.5;actor.body.position.y=-.2;actor.legs[0].rotation.x=-.8;actor.legs[1].rotation.x=.7;}
    if(isPlayer)actor.item.visible=data.weapon;
    if(data.hurt>0)actor.body.rotation.z=Math.sin(this.clock*70)*.13;
  }
  impact(x,z,finish=false){for(let i=0;i<7;i++){const mesh=new T.Mesh(new T.BoxGeometry(.06,.06,.06),new T.MeshBasicMaterial({color:finish?0xffce60:0xffeed0}));mesh.position.set(x,1.3,z);this.dynamic.add(mesh);this.effects.push({mesh,v:new T.Vector3((Math.random()-.5)*5,Math.random()*3,(Math.random()-.5)*5),life:.35});}if(this.shakeEnabled)this.shake=finish?.13:.06;}
  update(dt,round,lobby=false){
    this.clock+=dt;const narrow=innerWidth<760;
    if(lobby){const target=new T.Vector3(narrow?17:19,narrow?13:10.3,narrow?24:20);this.camera.position.lerp(target,Math.min(1,dt*2));this.look.lerp(new T.Vector3(narrow?-.5:.6,1.2,-2.2),dt*2);}
    else if(round&&this.player){
      round.player.moving=!!round.player.moving;this.pose(this.player,round.player,dt);round.enemies.forEach((e,i)=>this.pose(this.actors[i],e,dt));
      round.pickups.forEach((p,i)=>{this.pickupMeshes[i].visible=!p.used;this.pickupMeshes[i].children.slice(1).forEach(m=>m.position.y+=Math.sin(this.clock*3)*dt*.04);});
      const p=round.player,focus=new T.Vector3(p.x*.6+1.4,.7,p.z*.65-1.2);const target=focus.clone().add(new T.Vector3(narrow?14:12,narrow?18:14,narrow?17:14));this.camera.position.lerp(target,1-Math.exp(-dt*3.5));this.look.lerp(focus,1-Math.exp(-dt*5));
    }
    this.camera.lookAt(this.look);if(this.shake>0){this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.y+=(Math.random()-.5)*this.shake;this.shake=Math.max(0,this.shake-dt*.4);}
    const departed=round&&(round.status==='won'||round.status==='missed');
    if(departed){this.mainBus.position.z+=dt*2.8;this.mate.group.visible=false;if(round.status==='won')this.player.group.visible=false;}
    if(this.doorArrow){this.doorArrow.position.y=1.3+Math.sin(this.clock*3)*.14;this.doorArrow.visible=!departed&&(lobby||!!round?.doorCalled);this.doorRing.visible=!departed;this.doorRing.material.opacity=(lobby||round?.doorCalled)?.65+Math.sin(this.clock*4)*.15:.18;}
    for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i];e.life-=dt;e.mesh.position.addScaledVector(e.v,dt);e.v.y-=dt*8;e.mesh.scale.setScalar(Math.max(0,e.life/.35));if(e.life<=0){this.dynamic.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();this.effects.splice(i,1);}}
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.clear(this.environment);this.clear(this.dynamic);this.renderer.dispose();}
}
