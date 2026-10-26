import test from 'node:test'
import assert from 'node:assert/strict'
import {PerspectiveCamera} from 'three'
import fixtures from './fixtures/api-responses.json'
import {PetNavigation,PET_RADIUS} from '../src/lib/petNavigation'
import {PetWorld} from '../src/lib/petSimulation'
import {clearPetRuntime,livePetPose,rememberPetPose} from '../src/lib/petRuntime'
import {normalizePets} from '../src/lib/petData'
import {parsePetDrop,floorDropPoint} from '../src/lib/petDrop'
import type {FurnitureItem,PetInstance,LayoutSolution} from '../src/types/layout'
const room:LayoutSolution['room']={widthM:6,lengthM:6,type:'Living Room'}
const piece:FurnitureItem={id:'obstacle',type:'wardrobe',x:0,y:0,z:0,rotationY:0,scale:1,costINR:1}
const pet:PetInstance={id:'mochi',kind:'cat',name:'Mochi',x:-2,z:0,rotationY:0,roaming:true,collarColor:'#739181'}
test('pet routes detour around rotated furniture without clipping corners',()=>{
 for(const rotationY of [0,.4,Math.PI/2,Math.PI*.8]){
  const nav=new PetNavigation(room,[{...piece,rotationY,widthM:1,depthM:3}],PET_RADIUS.pug),from={x:-2,z:0},to={x:2,z:0}
  const path=nav.route(from,to);assert.ok(path.length>1,`No detour at ${rotationY}`)
  let before=from;for(const point of path){assert.ok(nav.segment(before,point));before=point}
  assert.ok(Math.hypot(before.x-to.x,before.z-to.z)<.01)
 }
})
test('pets respect walls, solid obstructions and disconnected floor areas',()=>{
 const nav=new PetNavigation(room,[{...piece,widthM:6,depthM:.3}],PET_RADIUS.cat)
 assert.deepEqual(nav.route({x:0,z:-2},{x:0,z:2}),[])
 assert.equal(nav.clear({x:3,z:0}),false)
 const full=new PetNavigation({widthM:2,lengthM:2},[{...piece,widthM:2,depthM:2}],PET_RADIUS.cat)
 assert.equal(full.nearest({x:0,z:0}),null)
})
test('rugs and high wall furniture leave pet floor routes open',()=>{
 const nav=new PetNavigation(room,[{...piece,type:'rug',widthM:6,depthM:6},{...piece,type:'wallCabinet',y:1.5}],PET_RADIUS.cat)
 assert.ok(nav.clear({x:0,z:0}));assert.equal(nav.route({x:-2,z:0},{x:2,z:0}).length,1)
})
test('drop projection and payload parsing reject invalid or out-of-room drops',()=>{
 assert.deepEqual(parsePetDrop('{"pet":"cat"}'),{pet:'cat'});assert.deepEqual(parsePetDrop('{"furniture":"petBed"}'),{furniture:'petBed'})
 for(const s of ['{','null','{"pet":"wolf"}','{"furniture":"stove"}','x'.repeat(201)])assert.equal(parsePetDrop(s),null)
 const camera=new PerspectiveCamera(45,1,.1,100);camera.position.set(0,10,.001);camera.lookAt(0,0,0);camera.updateProjectionMatrix()
 const p=floorDropPoint(250,250,{left:0,top:0,width:500,height:500},camera,room)!
 assert.ok(Math.abs(p.x)<.01&&Math.abs(p.z)<.01)
 assert.equal(floorDropPoint(-10,250,{left:0,top:0,width:500,height:500},camera,room),null)
 assert.equal(floorDropPoint(0,0,{left:0,top:0,width:500,height:500},camera,room),null)
})
for(const [name,response] of Object.entries(fixtures))test(`${name}: both pets roam safely around the actual generated layout`,()=>{
 clearPetRuntime();const sol=response.solutions[0] as LayoutSolution
 const world=new PetWorld(name,sol.room,sol.items,[{...pet,x:0,z:0},{...pet,id:'pippin',kind:'pug',x:0,z:1}])
 assert.equal(world.agents.size,2)
 const moved=new Map([...world.agents].map(([id,a])=>[id,{x:a.x,z:a.z,distance:0}]))
 for(let i=0;i<4000;i++){
  world.step(.04)
  for(const a of world.agents.values()){const previous=moved.get(a.pet.id)!;previous.distance+=Math.hypot(a.x-previous.x,a.z-previous.z);previous.x=a.x;previous.z=a.z}
  for(const a of world.agents.values())assert.ok(world.nav(a.pet.kind).clear(a,world.occupants(a.pet.id)),`${name}: ${a.pet.kind} collided at ${i}`)
 }
 for(const a of world.agents.values())assert.ok(moved.get(a.pet.id)!.distance>.5,`${name}: ${a.pet.kind} never explored`)
})
test('stay, pause and explicit call commands behave without automatic teleports',()=>{
 clearPetRuntime();const world=new PetWorld('pause',room,[],[{...pet,roaming:false}]),a=world.agents.get(pet.id)!
 for(let i=0;i<200;i++)world.step(.05);assert.equal(a.x,-2)
 assert.ok(world.sendTo(pet.id,{x:1,z:1}));for(let i=0;i<100;i++)world.step(.05,true);assert.equal(a.x,-2)
 for(let i=0;i<1000;i++)world.step(.05);assert.ok(Math.hypot(a.x-1,a.z-1)<.03)
 const before={x:a.x,z:a.z};for(let i=0;i<200;i++)world.step(.05);assert.deepEqual({x:a.x,z:a.z},before)
})
test('pets visit accessories to sniff and rest, then resume wandering',()=>{
 clearPetRuntime();const items=[{...piece,type:'petBed' as const,x:1,z:-1.5},{...piece,type:'petBowls' as const,x:-1,z:-1.5}]
 const world=new PetWorld('accessories',room,items,[pet]),a=world.agents.get(pet.id)!,modes=new Set<string>()
 for(let i=0;i<15000;i++){world.step(.05);modes.add(a.mode)}
 assert.ok(modes.has('walking'));assert.ok(modes.has('sniffing'));assert.ok(modes.has('resting'))
})
test('moving furniture safely relocates a stranded pet and new drag positions avoid others',()=>{
 clearPetRuntime();const world=new PetWorld('change',room,[],[pet,{...pet,id:'pug',kind:'pug',x:0,z:0}])
 const p=world.place('mochi',{x:0,z:0})!;assert.ok(Math.hypot(p.x,p.z)>=PET_RADIUS.cat+PET_RADIUS.pug)
 const changed=new PetWorld('change',room,[{...piece,x:p.x,z:p.z}],[pet,{...pet,id:'pug',kind:'pug',x:0,z:0}])
 for(const a of changed.agents.values())assert.ok(changed.nav(a.pet.kind).clear(a,changed.occupants(a.pet.id)))
})
test('live positions snapshot without per-frame persisted state and reset on manual edits',()=>{
 clearPetRuntime();rememberPetPose('save',pet,{x:1,z:2,rotationY:1})
 assert.equal(livePetPose('save',pet).x,1);assert.equal(pet.x,-2)
 assert.equal(livePetPose('save',{...pet,x:.4}).x,.4)
 clearPetRuntime();assert.equal(livePetPose('save',pet).x,-2)
})
test('older saves and malformed optional companion records load safely',()=>{
 assert.deepEqual(normalizePets(undefined),[])
 const normalized=normalizePets([pet,{...pet},{...pet,id:'bad',x:NaN},{...pet,id:'dog',kind:'pug',name:'',collarColor:'broken',roaming:false}])
 assert.equal(normalized.length,2);assert.equal(normalized[1].name,'Pippin');assert.equal(normalized[1].collarColor,'#739181');assert.equal(normalized[1].roaming,false)
})
test('four companions handle crossing routes and repeated replanning safely',()=>{
 clearPetRuntime();const pets=[{...pet,id:'a',x:-2,z:-1},{...pet,id:'b',kind:'pug' as const,x:2,z:1},{...pet,id:'c',x:-2,z:1},{...pet,id:'d',kind:'pug' as const,x:2,z:-1}]
 const world=new PetWorld('crossings',room,[{...piece,widthM:.5,depthM:.5}],pets)
 assert.equal(world.agents.size,4)
 for(const a of world.agents.values())world.sendTo(a.pet.id,{x:-a.x,z:-a.z})
 for(let i=0;i<5000;i++){world.step(.04);for(const a of world.agents.values())assert.ok(world.nav(a.pet.kind).clear(a,world.occupants(a.pet.id)))}
})
