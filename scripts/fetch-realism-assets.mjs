import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const catalog=JSON.parse(await fs.readFile(root+'/scripts/realism-sources.json','utf8'));
const base=`https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/${catalog.revision}/`;
const cast=['Male_Adult_12','Male_Adult_04','Male_Adult_17'];
await fs.mkdir(root+'/dist/assets/characters',{recursive:true});await fs.mkdir('/private/tmp/trotro-source-textures',{recursive:true});
const jobs=[];
for(const name of cast){
 const prefix=`Assets/Avatars/Adults/${name}/`;
 for(const file of catalog.files.filter(file=>file.startsWith(prefix)).map(path=>({path}))){
  const target=file.path.endsWith('.fbx')?`${root}/dist/assets/characters/${name}.fbx`:`/private/tmp/trotro-source-textures/${file.path.split('/').at(-1)}`;jobs.push({url:base+file.path,target});
 }
}
for(const [name,source] of [['walk','all_animations_max_motextr_xy/m_walk_fast_01.max.fbx'],['idle','all_animations_max_motextr_static/m_idle_breathe_01.max.fbx']])jobs.push({url:base+'Assets/Animations/'+source,target:`${root}/dist/assets/characters/${name}.fbx`});
jobs.push({url:base+'LICENSE.md',target:root+'/dist/assets/characters/LICENSE.txt'});
for(const [name,source] of [['RoundedBoxGeometry.js','geometries/RoundedBoxGeometry.js'],['FBXLoader.js','loaders/FBXLoader.js'],['SkeletonUtils.js','utils/SkeletonUtils.js'],['NURBSCurve.js','curves/NURBSCurve.js'],['NURBSUtils.js','curves/NURBSUtils.js'],['fflate.module.js','libs/fflate.module.js']])jobs.push({url:'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/'+source,target:root+'/dist/vendor/'+name,module:true});
await fs.mkdir(root+'/dist/assets/surfaces',{recursive:true});
for(const key of ['Diffuse','nor_gl','Rough'])jobs.push({url:catalog.surfaces[key],target:root+'/dist/assets/surfaces/asphalt-'+key+'.jpg'});
let cursor=0;await Promise.all(Array.from({length:5},async()=>{while(cursor<jobs.length){const job=jobs[cursor++];try{await fs.access(job.target);continue;}catch{}const r=await fetch(job.url,{signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error(`${job.target}: ${r.status}`);let bytes=new Uint8Array(await r.arrayBuffer());if(job.module){let code=new TextDecoder().decode(bytes).replaceAll("from 'three'","from './three.module.js'").replaceAll("'../libs/fflate.module.js'","'./fflate.module.js'").replaceAll("'../curves/NURBSCurve.js'","'./NURBSCurve.js'").replaceAll("'../curves/NURBSUtils.js'","'./NURBSUtils.js'");bytes=new TextEncoder().encode(code);}await fs.writeFile(job.target,bytes);console.log(path.basename(job.target));}}));
await fs.writeFile(root+'/dist/assets/characters/provenance.json',JSON.stringify({source:'https://github.com/microsoft/Microsoft-Rocketbox',revision:catalog.revision,license:'MIT',cast,animations:['m_walk_fast_01','m_idle_breathe_01'],textures:'Colour textures resized and converted from TGA to web formats; source files not redistributed.'},null,2));
console.log('Realism assets downloaded.');
