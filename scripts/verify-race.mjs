import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const out=resolve('node_modules/.cache/race-check'); await mkdir(out,{recursive:true});
for(const name of ['track','types','physics','combat','simulation']) {
 const source=await readFile(`shared/race/${name}.ts`,'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText.replace(/from '(.\/[a-z]+)'/g,"from '$1.js'");
 await writeFile(`${out}/${name}.js`,code);
}
const {createRacer,createPickups,stepRace,crossCheckpoint,recoverRacer}=await import(pathToFileURL(`${out}/simulation.js`));
const {trackPose,TRACK_LENGTH,CHECKPOINTS,LENGTHS,nearestTrack,ROAD_WIDTH}=await import(pathToFileURL(`${out}/track.js`));
const {driveRacer}=await import(pathToFileURL(`${out}/physics.js`));
const state={id:'test',phase:'countdown',serverTime:0,startsAt:1000,endsAt:601000,racers:Array.from({length:6},(_,i)=>createRacer(`bot${i}`,`Bot ${i}`,i,true)),pickups:createPickups(),winner:null};
const start=state.racers[0].x; stepRace(state,new Map(),500,1/60); assert.equal(state.racers[0].x,start,'countdown holds grid');
for(let tick=60;tick<36000 && state.phase!=='finished';tick++) stepRace(state,new Map(),tick*1000/60,1/60);
console.log(state.racers.map(car=>({id:car.id,lap:car.lap,next:car.nextGate,place:car.place,progress:Math.round(car.progress)})));
assert.ok(state.winner,'bots can finish the authored circuit');
assert.ok(state.racers.filter(car=>car.finishedAt!==null).length>=4,'bot grid remains navigable over three laps');
const gateCar=createRacer('g','Gate',0,false);
for(const _gateIndex of [0,0,0]) {const p=trackPose(2);Object.assign(gateCar,p);crossCheckpoint(gateCar,trackPose(-2));}
assert.equal(gateCar.lap,0,'start-line farming does not award laps');
for(let lap=0;lap<3;lap++) for(let gate=1;gate<=CHECKPOINTS.length;gate++) {const d=LENGTHS[CHECKPOINTS[gate%CHECKPOINTS.length]];Object.assign(gateCar,trackPose(d+2));crossCheckpoint(gateCar,trackPose(d-2));}
assert.equal(gateCar.lap,3,'three ordered circuits count exactly three laps');
const car=createRacer('physics','Physics',0,false); for(let i=0;i<300;i++) driveRacer(car,{throttle:1,steer:0,brake:false,fire:false},1/60);
assert.ok(nearestTrack(car).distance<=ROAD_WIDTH/2,'barriers contain vehicle');
assert.ok(Math.hypot(car.vx,car.vz)<=49,'speed remains bounded');
const speed=Math.hypot(car.vx,car.vz);for(let i=0;i<120;i++)driveRacer(car,{throttle:0,steer:0,brake:true,fire:false},1/60);assert.ok(Math.hypot(car.vx,car.vz)<speed*.1,'braking stops vehicle');
car.weapon='missile';car.ammo=3;recoverRacer(car,10000);assert.equal(car.weapon,null);assert.equal(car.respawnAt,13000);
assert.ok(TRACK_LENGTH>900 && TRACK_LENGTH<2000,'full sized circuit');
console.log('PASS: race grid, bot completion, ordered three-lap finish, start-line exploit rejection, barriers, brakes and recovery.');

// Pickup ownership and combat cannot be claimed without server-side proximity/aim.
const attacker=createRacer('attacker','Attacker',0,false),victim=createRacer('victim','Victim',1,false);
const combat={id:'combat',phase:'racing',startsAt:1,endsAt:600000,serverTime:10000,racers:[attacker,victim],pickups:createPickups(),winner:null};
const pickup=combat.pickups[0];Object.assign(attacker,trackPose(pickup.distance,pickup.lane));Object.assign(victim,trackPose(pickup.distance+18,pickup.lane));
stepRace(combat,new Map(),10000,1/60);assert.equal(attacker.weapon,pickup.item);assert.ok(attacker.ammo>0);assert.equal(pickup.availableAt,20000);
const ammo=attacker.ammo,health=victim.health;const firing=new Map([[attacker.id,{throttle:0,steer:0,brake:true,fire:true}]]);
assert.equal(stepRace(combat,new Map(),10225,1/60).length,0,'lock alone never fires a human race weapon');
assert.equal(attacker.ammo,ammo);assert.equal(victim.health,health);assert.equal(attacker.targetId,victim.id,'automatic aim still acquires with no trigger');
assert.equal(stepRace(combat,firing,10230,1/60).length,1);assert.equal(attacker.ammo,ammo-1);assert.ok(victim.health<health);
assert.equal(stepRace(combat,firing,10231,1/60).length,0,'fire cadence is enforced');
victim.protectedUntil=20000;assert.equal(stepRace(combat,firing,10500,1/60).length,0,'respawn protection blocks damage');
const recovery=createRacer('recover','Recover',0,false);recovery.started=true;recovery.lap=1;recovery.nextGate=5;recoverRacer(recovery,10000);
const recovered={...combat,racers:[recovery],pickups:[]};stepRace(recovered,new Map(),13001,1/60);
assert.equal(recovery.health,600);assert.equal(recovery.lap,1);assert.equal(recovery.nextGate,5);assert.ok(recovery.protectedUntil>13001);
const reverse=createRacer('reverse','Reverse',0,false);Object.assign(reverse,trackPose(-2));crossCheckpoint(reverse,trackPose(2));assert.equal(reverse.started,false,'reverse crossings never advance');
stepRace(combat,new Map(),600001,1/60);assert.equal(combat.phase,'finished','deadline ends unfinished races');
console.log('PASS: pickup proximity, limited ammunition, damage, cadence, protection, checkpoint recovery and race deadline.');

// Verify actual circuit mesh continuity, upward road faces and static draw budget without a browser.
const {NullEngine,Scene,Ray,Vector3}=await import('@babylonjs/core');
const terrainSource=await readFile('src/game/levels/LandscapeTerrain.ts','utf8');
await writeFile(`${out}/LandscapeTerrain.js`,ts.transpileModule(terrainSource,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText);
const horizonSource=await readFile('src/game/levels/OuterLandscape.ts','utf8');
await writeFile(`${out}/OuterLandscape.js`,ts.transpileModule(horizonSource,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText.replace('./LandscapeTerrain','./LandscapeTerrain.js'));
for (const [name, folder] of [['Grass', 'levels'], ['GraphicsSettingsManager', 'settings']]) {
 const source = await readFile(`src/game/${folder}/${name}.ts`, 'utf8');
 await writeFile(`${out}/${name}.js`, ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText.replace('../settings/GraphicsSettingsManager', './GraphicsSettingsManager.js'));
}
const trackSource=await readFile('src/game/race/RaceTrack.ts','utf8');
const trackCode=ts.transpileModule(trackSource,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText.replace('../../../shared/race/track','./track.js').replace('../levels/OuterLandscape','./OuterLandscape.js').replace('../levels/Grass','./Grass.js');
await writeFile(`${out}/RaceTrack.js`,trackCode);
const {buildRaceTrack}=await import(pathToFileURL(`${out}/RaceTrack.js`));
const engine=new NullEngine(),scene=new Scene(engine);buildRaceTrack(scene);
const road=scene.getMeshByName('race-tarmac');road.computeWorldMatrix(true);
for(let d=0;d<TRACK_LENGTH;d+=7) {
 const pose=trackPose(d);
 for(const lane of [-8,0,8]) {
  const x=pose.x+pose.tz*lane,z=pose.z-pose.tx*lane;
  const hit=new Ray(new Vector3(x,40,z),new Vector3(0,-1,0),60).intersectsMesh(road);
  assert.ok(hit.hit,'road surface is continuous across the full driving corridor');
  assert.ok(Math.abs(hit.pickedPoint.y-pose.y)<.35,'rendered road follows simulation height across driving lanes');
 }
}
const normals=road.getVerticesData('normal');for(let i=1;i<normals.length;i+=3)assert.ok(normals[i]>.9,'road normals face upward');
assert.ok(scene.meshes.length<40,'static scenery stays within draw budget');
scene.dispose();engine.dispose();console.log('PASS: seamless road collision corridor, face orientation and batched scenery budget.');

// Human/bot use the same lock, ammo, delayed lightning and cancellation rules.
const {canTargetRacer}=await import(pathToFileURL(`${out}/combat.js`));
const {RACE_ABILITY,RACE_WEAPONS}=await import(pathToFileURL(`${out}/types.js`));
const controls={throttle:0,steer:0,brake:true,fire:true,ability:false};
const duel=()=>{
 const a=createRacer('a','A',0,false),b=createRacer('b','B',1,false);
 Object.assign(a,trackPose(20));Object.assign(b,trackPose(40));
 return {id:'duel',phase:'racing',serverTime:1000,startsAt:1,endsAt:600000,racers:[a,b],pickups:[],winner:null};
};
for(const bot of [false,true]) {
 const match=duel(),[a,b]=match.racers;a.bot=bot;a.weapon='plasma';a.ammo=2;
 const input=new Map([['a',controls]]);
 assert.equal(stepRace(match,input,1000,1/60).length,0,'acquisition does not instantly fire');
 assert.equal(a.targetId,b.id);
 if(bot) assert.equal(stepRace(match,input,1250,1/60).length,0,'bot waits for deliberate reaction window');
 const shot=stepRace(match,input,bot ? 1450 : 1250,1/60).find(shot=>shot.weapon==='plasma');
 assert.equal(shot?.target,b.id);assert.equal(a.ammo,1);assert.ok(b.health<600);
 b.protectedUntil=5000;assert.equal(stepRace(match,input,2000,1/60).length,0);assert.equal(a.targetId,null);
}
{
 const match=duel(),[a,b]=match.racers;
 const input=new Map([['a',{...controls,fire:false,ability:true}]]);
 stepRace(match,input,1000,1/60);assert.equal(a.abilityTarget,b.id);assert.equal(b.health,600,'wind-up causes no early damage');
 assert.equal(stepRace(match,input,2099,1/60).length,0);
 const impact=stepRace(match,input,2100,1/60);assert.equal(impact[0]?.weapon,'lightning');assert.equal(b.health,600-RACE_ABILITY.damage);
 stepRace(match,input,3000,1/60);assert.equal(a.lastAbility,1000,'held input cannot bypass cooldown');
 stepRace(match,input,16000,1/60);assert.equal(a.lastAbility,16000,'ability can be repeated');
 recoverRacer(a,16010);assert.equal(stepRace(match,input,17100,1/60).length,0,'death cancels pending ability');
}
{
 const match=duel(),[a,b]=match.racers;
 const input=new Map([['a',{...controls,fire:false,ability:true}]]);
 stepRace(match,input,1000,1/60);b.protectedUntil=5000;
 assert.equal(stepRace(match,input,2100,1/60).length,0,'protected targets reject delayed lightning');
 b.protectedUntil=0;b.connected=false;assert.equal(canTargetRacer(a,b,2200,80),false);
 b.connected=true;Object.assign(b,trackPose(5));assert.equal(canTargetRacer(a,b,2200,80),false,'no rear-facing auto aim');
 Object.assign(a,trackPose(TRACK_LENGTH*.255));Object.assign(b,trackPose(TRACK_LENGTH*.305));
 assert.equal(canTargetRacer(a,b,2200,100),true,'bridge deck permits visible attacks');
}
const uphill=createRacer('up','Up',0,false),flat=createRacer('flat','Flat',0,false);
Object.assign(uphill,trackPose(TRACK_LENGTH*.19));Object.assign(flat,trackPose(20));
for(const car of [uphill,flat]) {car.vx=Math.sin(car.yaw)*20;car.vz=Math.cos(car.yaw)*20;driveRacer(car,{...controls,throttle:1,brake:false},.01);}
assert.ok(Math.hypot(uphill.vx,uphill.vz)<Math.hypot(flat.vx,flat.vz),'climbing reduces acceleration');
assert.ok(trackPose(TRACK_LENGTH*.7).y>19,'second bridge reaches authored height');
assert.equal(trackPose(0).y,trackPose(TRACK_LENGTH).y,'height closes at start line');
console.log('PASS: human/bot auto-lock, delayed/repeat lightning, death/protection cancellation, bridge targeting and slope physics.');

for(const weapon of Object.keys(RACE_WEAPONS)) {
 const match=duel(),[a,b]=match.racers;a.weapon=weapon;a.ammo=1;
 const input=new Map([['a',controls]]);
 stepRace(match,input,1000,1/60);
 const shots=stepRace(match,input,1600,1/60);assert.equal(shots[0]?.weapon,weapon);assert.equal(shots[0]?.target,b.id);
 assert.equal(a.ammo,0);assert.equal(b.health,600-RACE_WEAPONS[weapon].damage);
 assert.equal(stepRace(match,input,5000,1/60).length,0,'empty weapons cannot fire');
}
console.log('PASS: all five pickup weapons damage the locked opponent and stop at empty ammo.');

// Use real Babylon pickup geometry/materials; only the browser text canvas is substituted.
const pickupSource=await readFile('src/game/race/RacePickup.ts','utf8');
await writeFile(`${out}/RacePickup.js`,ts.transpileModule(pickupSource,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText.replace('../../../shared/race/track','./track.js'));
const {createRacePickup}=await import(pathToFileURL(`${out}/RacePickup.js`));
const pickupEngine=new NullEngine(),pickupScene=new Scene(pickupEngine);
const labels=[];
pickupEngine.createCanvas=()=>({width:256,height:64,getContext:()=>({fillRect(){},measureText:text=>({width:text.length*16}),fillText:text=>labels.push(text)})});
for(const pickup of createPickups()) {
 const mesh=createRacePickup(pickupScene,pickup);
 assert.ok(mesh.material.alpha>0 && mesh.material.alpha<1,'pickup shell is translucent');
 assert.ok(mesh.material.opacityFresnelParameters,'glowing sphere keeps visible edge definition');
 assert.equal(mesh.position.y,trackPose(pickup.distance).y+2.5,'pickup floats above elevated road');
 mesh.setEnabled(false);assert.ok(mesh.getChildMeshes().every(child=>!child.isEnabled()),'collected pickup hides its complete hierarchy');
 mesh.setEnabled(true);assert.ok(mesh.getChildMeshes().every(child=>child.isEnabled()),'respawn restores label and energy core');
}
assert.equal(labels.length,10,'every pickup identifies its item in text');
pickupScene.dispose();assert.equal(pickupScene.meshes.length,0);pickupEngine.dispose();
console.log('PASS: translucent pickup geometry, labels, elevation, collection/respawn visibility and cleanup.');

{
 const match=duel(),[a,b]=match.racers; a.bot=true;
 stepRace(match,new Map(),1000,1/60);
 assert.equal(a.abilityTarget,null,'unarmed bot observes before activating');
 assert.equal(a.targetId,b.id,'unarmed bot can acquire an ability target');
 stepRace(match,new Map(),1500,1/60);
 assert.equal(a.abilityTarget,b.id,'unarmed bot uses lightning after stable acquisition');
}
