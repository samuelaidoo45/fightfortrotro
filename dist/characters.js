// Original fictional commuters. Bonuses are deliberately modest; all share the move list.
export const CHARACTERS=[
 {id:'schoolboy',name:'Kweku',role:'School pupil',model:'Male_Child_02',height:1.49,item:null,look:'school',color:'#e8bd64',perk:'Quick feet',detail:'Move 12% faster. Start with free hands.',speed:1.12},
 {id:'schoolgirl',name:'Abena',role:'School pupil',model:'Female_Child_02',height:1.48,item:'umbrella',look:'school',color:'#d69ec0',perk:'Second wind',detail:'Stamina recovers 18% faster. Starts with an umbrella.',regen:1.18},
 {id:'market',name:'Auntie Esi',role:'Market woman',model:'Female_Adult_15',height:1.72,item:'bag',look:'market',color:'#d58c56',perk:'Make room',detail:'Power shoves push 20% farther. Starts with a travel bag.',shove:1.2},
 {id:'builder',name:'Yaw',role:'Construction worker',model:'Construction_Male_07',height:1.88,item:null,color:'#f6ad57',perk:'Solid stance',detail:'Take 12% less damage. Starts with free hands.',armor:.88},
 {id:'office',name:'Kojo',role:'Office worker',model:'Business_Male_05',height:1.84,item:'suitcase',color:'#9dbbd5',perk:'Keep your cool',detail:'Special meter charges 15% faster. Starts with a suitcase.',meter:1.15},
 {id:'officewoman',name:'Akosua',role:'Office worker',model:'Female_Adult_02',height:1.76,item:'umbrella',color:'#a6d4d4',perk:'Perfect timing',detail:'Perfect-block window lasts 30% longer. Starts with an umbrella.',parry:1.3},
 {id:'mechanic',name:'Kwame',role:'Mechanic',model:'Construction_Male_05',height:1.82,item:'baton',color:'#87b3cb',perk:'Efficient hands',detail:'Light and heavy strikes use 15% less stamina. Starts with a baton.',cost:.85},
 {id:'nurse',name:'Adjoa',role:'Nurse',model:'Medical_Female_01',height:1.76,item:'bag',color:'#c6ded1',perk:'Back on your feet',detail:'Recover 40 health between rides. Starts with a travel bag.',heal:40},
 {id:'footballer',name:'Nii',role:'Footballer',model:'Sports_Male_03',height:1.85,item:null,color:'#f1d874',perk:'Strong legs',detail:'Kicks deal 15% more damage. Starts with free hands.',kick:1.15},
 {id:'rider',name:'Sena',role:'Delivery rider',model:'Delivery_Male_01',height:1.8,item:'bag',look:'rider',color:'#df8e86',perk:'Always moving',detail:'Dodges use 25% less stamina. Starts with a travel bag.',dodge:.75}
];
export const characterById=id=>CHARACTERS.find(c=>c.id===id)||CHARACTERS.find(c=>c.id==='office');
export const MODEL_NAMES=['Male_Adult_12','Male_Adult_04','Male_Adult_17',...CHARACTERS.map(c=>c.model)];
