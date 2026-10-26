import React from 'react'
import test from 'node:test'
import assert from 'node:assert/strict'
import {create,act} from '@react-three/test-renderer'
import {Box3,Vector3,Mesh,MeshStandardMaterial,Texture,PerspectiveCamera,Quaternion} from 'three'
import {createCanvas} from '@napi-rs/canvas'
import {FurnitureInstance} from '../src/three/FurnitureInstance'
import {furnitureCatalog} from '../src/three/catalog'
import {Room} from '../src/three/Room'
import {useStudioStore,type FloorMaterial,type WallMaterial} from '../src/store/useStudioStore'
import type {FurnitureType,StyleChip} from '../src/types/layout'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
const styles:StyleChip[]=['Cozy','Minimal','Modern','Luxury','Compact','Bohemian','Industrial','Coastal']
for(const type of Object.keys(furnitureCatalog) as FurnitureType[]){
 test(`${type}: eight styles stay within catalog dimensions`,async()=>{
  const item={id:type,type,x:0,z:0,y:furnitureCatalog[type].mountY,scale:1,rotationY:0,costINR:1}
  const renderer=await create(<group/> )
  for(const style of styles){
   await renderer.update(<FurnitureInstance item={item} styleSliders={{[style]:1}}/> )
   const box=new Box3().setFromObject(renderer.scene.instance),size=box.getSize(new Vector3()),target=furnitureCatalog[type].targetSizeM
   assert.ok(Math.abs(size.x-target.x)<.005,`${style}: width ${size.x}`)
   assert.ok(Math.abs(size.z-target.z)<.005,`${style}: depth ${size.z}`)
   assert.ok(size.y<=target.y+.005,`${style}: height ${size.y}`)
   assert.ok(Math.abs(box.min.y-furnitureCatalog[type].mountY)<.005,`${style}: ground ${box.min.y}`)
  }
  await renderer.unmount()
 })
}
test('custom tint resets to original material color',async()=>{
 const item={id:'chair',type:'chair' as const,x:0,z:0,y:0,scale:1,rotationY:0,costINR:1}
 const renderer=await create(<FurnitureInstance item={item}/> )
 const colors=()=>{const values:string[]=[];renderer.scene.instance.traverse(o=>{if((o as Mesh).isMesh){const mesh=o as Mesh;const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];for(const m of materials)if((m as MeshStandardMaterial).isMeshStandardMaterial)values.push((m as MeshStandardMaterial).color.getHexString())}});return values}
 const original=colors()
 await renderer.update(<FurnitureInstance item={{...item,color:'#ff0000'}}/> );assert.notDeepEqual(colors(),original)
 await renderer.update(<FurnitureInstance item={item}/> );assert.deepEqual(colors(),original)
 await renderer.unmount()
})

test('rug borders stay on a full-size rectangular rug instead of forming a cross',async()=>{
 const renderer=await create(<group/> )
 try{for(const style of styles){
  await renderer.update(<FurnitureInstance item={{id:'rug',type:'rug',x:0,y:0,z:0,rotationY:0,scale:1,costINR:1}} styleSliders={{[style]:1}}/> )
  const whole=new Box3().setFromObject(renderer.scene.instance),base=new Box3().setFromObject(renderer.scene.instance.getObjectByName('rug-base')!)
  assert.ok(Math.abs(base.min.x-whole.min.x)<.005&&Math.abs(base.max.x-whole.max.x)<.005,style)
  assert.ok(Math.abs(base.min.z-whole.min.z)<.005&&Math.abs(base.max.z-whole.max.z)<.005,style)
 }}finally{await renderer.unmount()}
})
test('modern accent chair has a lounge seat and back facing local positive Z',async()=>{
 const renderer=await create(<FurnitureInstance item={{id:'chair',type:'chair',x:0,y:0,z:0,rotationY:0,scale:1,costINR:1}} styleSliders={{Modern:1}}/> )
 try{
  const scene=renderer.scene.instance;scene.updateMatrixWorld(true)
  const seat=new Box3().setFromObject(scene.getObjectByName('accent-seat')!).getCenter(new Vector3()),back=new Box3().setFromObject(scene.getObjectByName('accent-back')!).getCenter(new Vector3())
  assert.ok(seat.y>.4&&seat.y<.55);assert.ok(back.z<seat.z-.15)
 }finally{await renderer.unmount()}
})

test('modern chaise extends forward with a normal seat height',async()=>{
 const renderer=await create(<FurnitureInstance item={{id:'sofa',type:'sofa',x:0,y:0,z:0,rotationY:0,scale:1,costINR:1}} styleSliders={{Modern:1}}/> )
 try{
  const scene=renderer.scene.instance;scene.updateMatrixWorld(true)
  const seat=new Box3().setFromObject(scene.getObjectByName('sofa-seat')!).getCenter(new Vector3()),chaise=new Box3().setFromObject(scene.getObjectByName('sofa-chaise')!),back=new Box3().setFromObject(scene.getObjectByName('sofa-back')!).getCenter(new Vector3())
  assert.ok(seat.y>.42&&seat.y<.51);assert.ok(chaise.max.z>seat.z+.35);assert.ok(back.z<seat.z-.2)
 }finally{await renderer.unmount()}
})

test('room lighting changes fixture geometry with style and honours manual mood',async()=>{
 const {RoomLighting}=await import('../src/three/RoomLighting')
 const fixture=(await import('./fixtures/api-responses.json')).default['Dining Room'].solutions[0] as unknown as import('../src/types/layout').LayoutSolution
 const renderer=await create(<group/>)
 try{
  await renderer.update(<RoomLighting solution={{...fixture,selectedStyles:['Luxury']}} height={3.2}/> )
  assert.ok(renderer.scene.instance.getObjectByName('fixture-chandelier'))
  await renderer.update(<RoomLighting solution={{...fixture,selectedStyles:['Luxury']}} height={2}/> )
  const lowFixture=renderer.scene.instance.getObjectByName('fixture-linear')!,bounds=new Box3().setFromObject(lowFixture)
  assert.ok(bounds.min.y>1.9&&bounds.max.y<=2.001,'low ceilings need a close-mounted fixture')
  await renderer.update(<RoomLighting solution={{...fixture,selectedStyles:['Modern']}} height={3.2}/> )
  assert.ok(renderer.scene.instance.getObjectByName('fixture-linear'))
  await act(async()=>useStudioStore.getState().setLightingMode('Cool'))
  const lights:import('three').PointLight[]=[];renderer.scene.instance.traverse(o=>{if((o as import('three').PointLight).isPointLight)lights.push(o as import('three').PointLight)})
  assert.equal(lights[0].color.getHexString(),'e6f0ff')
 }finally{await renderer.unmount();useStudioStore.setState({lightingMode:'Auto'})}
})
test('bathroom wet zones and kitchen backsplash are real clipped wall surfaces',async()=>{
 const renderer=await create(<group/>),oldDocument=globalThis.document
 Object.assign(globalThis,{document:{createElement:()=>createCanvas(512,512)}})
 try{
  useStudioStore.setState({autoSurfaces:true})
  for(const type of ['Bathroom','Kitchen'] as const){
   await renderer.update(<Room widthM={4} lengthM={4} roomType={type} doorWall="front"/> )
   const zones:import('three').Object3D[]=[];renderer.scene.instance.traverse(o=>{if(o.name==='wall-wet-zone')zones.push(o)})
   assert.ok(zones.length>0,type)
   for(const zone of zones){const b=new Box3().setFromObject(zone);assert.ok(b.max.y<=2.13);if(type==='Kitchen')assert.ok(b.min.y>=.939)}
  }
  await act(async()=>useStudioStore.setState({autoSurfaces:false}))
  assert.equal(renderer.scene.instance.getObjectByName('wall-wet-zone'),undefined)
 }finally{await renderer.unmount();Object.assign(globalThis,{document:oldDocument})}
})
test('all floor and wall materials render with real canvas textures',async()=>{
 const renderer=await create(<group/> )
 const oldDocument=globalThis.document
 Object.assign(globalThis,{document:{createElement:()=>createCanvas(1024,1024)}})
 try{
  const floors:FloorMaterial[]=['Wood','Parquet','Tile','Marble','Granite','Epoxy','Carpet','Concrete','Terrazzo']
  const walls:WallMaterial[]=['Plain','Plaster','Lime','Wallpaper','Textured','Fabric','Panel','Fluted','Stone','Brick','Concrete','Ceramic']
  await renderer.update(<Room widthM={5} lengthM={6} roomType="Kitchen"/> )
  for(const floor of floors)await act(async()=>{useStudioStore.getState().setFloorMaterial(floor)})
  for(const wall of walls)await act(async()=>{useStudioStore.getState().setWallMaterial(wall);useStudioStore.getState().setWallColor('#ddd4c6')})
  for(const pattern of ['Square','Subway','Herringbone','Hexagon'] as const)await act(async()=>{useStudioStore.getState().setAppearance({tilePattern:pattern,tileSize:.45,groutColor:'#aaaaaa'})})
  const bounds=new Box3().setFromObject(renderer.scene.instance);assert.ok(Number.isFinite(bounds.max.x));assert.ok(bounds.max.y>2)
 }finally{await renderer.unmount();Object.assign(globalThis,{document:oldDocument})}
})

test('walls, trims, doorway and floor stay inside the requested footprint',async()=>{
 const renderer=await create(<group/>),oldDocument=globalThis.document
 Object.assign(globalThis,{document:{createElement:()=>createCanvas(512,512)}})
 try{
  for(const [w,l,h] of [[2,2,2],[2.5,4,3.2],[7,3,4.5]])for(const doorWall of ['back','front','left','right'] as const){
   await renderer.update(<Room widthM={w} lengthM={l} wallH={h} doorWall={doorWall}/> )
   const b=new Box3().setFromObject(renderer.scene.instance)
   assert.ok(b.min.x>=-w/2-.00001&&b.max.x<=w/2+.00001,`${doorWall}: width overflow`)
   assert.ok(b.min.z>=-l/2-.00001&&b.max.z<=l/2+.00001,`${doorWall}: length overflow`)
   assert.ok(b.max.y<=h+.00001,`${doorWall}: height overflow`)
   const floor=renderer.scene.instance.getObjectByName('floor-surface')!,base=renderer.scene.instance.getObjectByName('floor-base')!
   assert.ok(new Box3().setFromObject(floor).min.y>new Box3().setFromObject(base).max.y,'floor surface must not fight slab surface')
  }
 }finally{await renderer.unmount();Object.assign(globalThis,{document:oldDocument})}
})
test('dining chair backrests are behind their seats in every style and orientation',async()=>{
 const renderer=await create(<group/> )
 try{
  for(const style of styles)for(const rotationY of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
   await renderer.update(<FurnitureInstance item={{id:'seat',type:'diningChair',x:0,y:0,z:0,rotationY,scale:1,costINR:1}} styleSliders={{[style]:1}}/> )
   const scene=renderer.scene.instance;scene.updateMatrixWorld(true);const seat=new Box3().setFromObject(scene.getObjectByName('chair-seat')!).getCenter(new Vector3()),back=new Box3().setFromObject(scene.getObjectByName('chair-back')!).getCenter(new Vector3())
   assert.ok(seat.y>.43&&seat.y<.51,`${style}: unsuitable seat height ${seat.y}`)
   assert.ok(back.clone().sub(seat).dot(new Vector3(Math.sin(rotationY),0,Math.cos(rotationY)))<-.12,`${style} at ${rotationY}: backrest faces the wrong direction ${JSON.stringify(back.clone().sub(seat))}`)
  }
 }finally{await renderer.unmount()}
})
test('room-specific design choices change geometry while preserving the footprint',async()=>{
 const renderer=await create(<group/> )
 const meshCount=()=>{let n=0;renderer.scene.instance.traverse(o=>{if((o as Mesh).isMesh)n++});return n}
 try{
  for(const [type,a,b] of [['diningChair','Modern','Coastal'],['diningTable','Modern','Minimal'],['rangeHood','Modern','Luxury'],['refrigerator','Modern','Minimal'],['toilet','Modern','Minimal'],['desk','Modern','Cozy'],['wallShelf','Modern','Cozy']] as [FurnitureType,StyleChip,StyleChip][]){
   const item={id:type,type,x:0,y:furnitureCatalog[type].mountY,z:0,rotationY:0,scale:1,costINR:1}
   await renderer.update(<FurnitureInstance item={item} styleSliders={{[a]:1}}/> );const count=meshCount()
   await renderer.update(<FurnitureInstance item={item} styleSliders={{[b]:1}}/> );assert.notEqual(meshCount(),count,`${type}: choice changed no geometry`)
  }
 }finally{await renderer.unmount()}
})

test('chubby cat and pug are grounded, distinct and fit their navigation footprints',async()=>{
 const {PetModel}=await import('../src/three/PetModel'),{PET_RADIUS}=await import('../src/lib/petNavigation')
 const renderer=await create(<group/> )
 try{for(const kind of ['cat','pug'] as const){
  await renderer.update(<PetModel kind={kind} animate={false}/> )
  const scene=renderer.scene.instance,bounds=new Box3().setFromObject(scene)
  assert.ok(Math.abs(bounds.min.y)<.005,`${kind}: paws not grounded ${bounds.min.y}`)
  assert.ok(bounds.max.y>.4&&bounds.max.y<.57,`${kind}: inappropriate scale`)
  scene.traverse(o=>{const mesh=o as Mesh;if(!mesh.isMesh)return;const positions=mesh.geometry.getAttribute('position');for(let i=0;i<positions.count;i++){const p=new Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);assert.ok(Math.hypot(p.x,p.z)<=PET_RADIUS[kind]-.005,`${kind}: visual mesh exceeds collision radius`)}})
  assert.ok(scene.getObjectByName('pet-eyes'));assert.ok(scene.getObjectByName('pet-tail'))
 }}finally{await renderer.unmount()}
})
test('pet pointer dragging captures, commits once, cancels safely and releases camera state',async()=>{
 const {PetScene}=await import('../src/three/PetScene'),{getSelectedSolution}=await import('../src/store/useStudioStore'),{Ray}=await import('three')
 const pet={id:'pointer-cat',kind:'cat' as const,name:'Mochi',x:-1,z:0,rotationY:0,roaming:false,collarColor:'#739181'}
 const solution={id:'pointer',rank:1 as const,room:{widthM:6,lengthM:6,type:'Living Room' as const},prompt:'Test',selectedStyles:['Modern' as const],items:[],pets:[pet],metrics:{totalCostINR:0,budgetINR:100000,budgetCompliancePct:100,spaceUtilizationPct:0,styleAlignmentPct:100,clearanceScorePct:100,comfortIndexPct:100,fitness:1},explanation:'Test'}
 await act(async()=>useStudioStore.getState().setResult({requestId:'p',generatedAtISO:'',solutions:[solution],history_steps:[],evolution:[]}))
 const renderer=await create(<PetScene solution={solution}/>),oldDocument=globalThis.document
 Object.assign(globalThis,{document:{hidden:false}})
 let captured=false
 const target={setPointerCapture:()=>{captured=true},releasePointerCapture:()=>{captured=false}},event=(x:number,z:number)=>({button:0,pointerId:1,ray:new Ray(new Vector3(x,3,z),new Vector3(0,-1,0)),target})
 try{
  const actor=renderer.scene.findByProps({name:'companion-pointer-cat'})
  await renderer.fireEvent(actor,'pointerDown',event(-1,0));assert.equal(captured,true);assert.equal(useStudioStore.getState().petDraggingId,pet.id)
  await renderer.fireEvent(actor,'pointerMove',event(1,1));await renderer.fireEvent(actor,'pointerUp',event(1,1))
  assert.equal(captured,false);assert.equal(useStudioStore.getState().petDraggingId,null);assert.equal(useStudioStore.getState().undoStack.length,1)
  assert.ok(Math.abs(getSelectedSolution()!.pets![0].x-1)<.01)
  const committed=getSelectedSolution()!
  await renderer.update(<PetScene solution={committed}/> )
  const next=renderer.scene.findByProps({name:'companion-pointer-cat'})
  await renderer.fireEvent(next,'pointerDown',event(1,1));await renderer.fireEvent(next,'pointerMove',event(2,2));await renderer.fireEvent(next,'pointerCancel',event(2,2))
  assert.equal(captured,false);assert.equal(useStudioStore.getState().petDraggingId,null);assert.equal(useStudioStore.getState().undoStack.length,1)
  assert.equal(getSelectedSolution()!.pets![0].x,1)
 }finally{await renderer.unmount();Object.assign(globalThis,{document:oldDocument})}
})
test('pet walking and resting animate while keeping paws above the floor',async()=>{
 const {PetModel}=await import('../src/three/PetModel')
 const renderer=await create(<group/> )
 try{for(const kind of ['cat','pug'] as const){
  const motion={speed:.3,phase:Math.PI/2,time:3,mode:'walking' as 'walking'|'resting'}
  await renderer.update(<PetModel kind={kind} motion={motion}/> );await renderer.advanceFrames(1,.03)
  const leg=renderer.scene.instance.getObjectByName('pet-leg-0')!;assert.ok(Math.abs(leg.rotation.x)>.1)
  assert.ok(new Box3().setFromObject(renderer.scene.instance,true).min.y>-.005,`${kind}: ${new Box3().setFromObject(renderer.scene.instance,true).min.y}`)
  motion.mode='resting';motion.speed=0;await renderer.advanceFrames(90,.03)
  assert.ok(leg.scale.y<.9);assert.ok(Math.abs(new Box3().setFromObject(renderer.scene.instance,true).min.y)<.005)
 }}finally{await renderer.unmount()}
})

test('illustrated guest drag captures, commits once and cancels without changes',async()=>{
 const {GuestFigure}=await import('../src/three/GuestScene'),{getSelectedSolution}=await import('../src/store/useStudioStore'),{Ray}=await import('three')
 const solution={id:'guest',rank:1 as const,room:{widthM:6,lengthM:6,type:'Bedroom' as const},prompt:'Test',selectedStyles:['Modern' as const],items:[],guest:{x:0,z:0,heightM:1.74},metrics:{totalCostINR:0,budgetINR:100000,budgetCompliancePct:100,spaceUtilizationPct:0,styleAlignmentPct:100,clearanceScorePct:100,comfortIndexPct:100,fitness:1},explanation:'Test'}
 await act(async()=>useStudioStore.getState().setResult({requestId:'g',generatedAtISO:'',solutions:[solution],history_steps:[],evolution:[]}))
 const renderer=await create(<GuestFigure solution={solution} atlas={new Texture()}/>)
 let captured=false
 const target={setPointerCapture:()=>{captured=true},releasePointerCapture:()=>{captured=false}},event=(x:number,z:number)=>({button:0,pointerId:1,ray:new Ray(new Vector3(x,3,z),new Vector3(0,-1,0)),target})
 try{
  const actor=renderer.scene.findByProps({name:'room-guest'})
  await renderer.fireEvent(actor,'pointerDown',event(0,0));assert.equal(captured,true)
  await renderer.fireEvent(actor,'pointerMove',event(1,1));await renderer.fireEvent(actor,'pointerUp',event(1,1))
  assert.equal(captured,false);assert.equal(useStudioStore.getState().petDraggingId,null);assert.equal(useStudioStore.getState().undoStack.length,1)
  assert.equal(getSelectedSolution()!.guest!.x,1)
  await renderer.update(<GuestFigure solution={getSelectedSolution()!} atlas={new Texture()}/> )
  const next=renderer.scene.findByProps({name:'room-guest'})
  await renderer.fireEvent(next,'pointerDown',event(1,1));await renderer.fireEvent(next,'pointerMove',event(2,2));await renderer.fireEvent(next,'pointerCancel',event(2,2))
  assert.equal(captured,false);assert.equal(useStudioStore.getState().undoStack.length,1);assert.equal(getSelectedSolution()!.guest!.x,1)
 }finally{await renderer.unmount()}
})

test('illustrated guest stays upright at every azimuth, elevation and supported height',async()=>{
 const {GuestSprite}=await import('../src/three/GuestSprite')
 const camera=new PerspectiveCamera(45,1,.1,100),atlas=new Texture()
 const renderer=await create(<group/>,{camera})
 try{for(const height of [1.4,1.74,2]){
  await renderer.update(<GuestSprite height={height} atlas={atlas}/> )
  for(const elevation of [0,.4,1,Math.PI/2])for(let a=0;a<32;a++){
   const angle=a*Math.PI/16;camera.position.set(5*Math.sin(angle)*Math.cos(elevation),5*Math.sin(elevation),5*Math.cos(angle)*Math.cos(elevation));camera.lookAt(0,0,0)
   await renderer.advanceFrames(1,.016)
   const mesh=renderer.scene.instance.getObjectByName('aira-illustration') as Mesh
   const normal=new Vector3(0,0,1).applyQuaternion(mesh.quaternion),toward=camera.position.clone();toward.y=0
   const up=new Vector3(0,1,0).applyQuaternion(mesh.quaternion)
   assert.ok(up.distanceTo(new Vector3(0,1,0))<1e-8,'zoom or elevation must never pitch or roll Aira')
   if(toward.length()>.001)assert.ok(normal.dot(toward.normalize())>.99999,'artwork must face the camera horizontally')
   assert.equal(mesh.geometry.type,'BufferGeometry');assert.ok(mesh.userData.view>=0&&mesh.userData.view<8)
   const pos=mesh.geometry.getAttribute('position');assert.equal(pos.getY(0),0);assert.ok(Math.abs(pos.getY(2)-height)<1e-6)
   for(let i=0;i<pos.count;i++)assert.ok(Number.isFinite(pos.getX(i)+pos.getY(i)+pos.getZ(i)))
  }
 }}finally{await renderer.unmount()}
})
test('eight camera views wrap, resist boundary flicker and allow a chosen illustration',async()=>{
 const {guestView,guestBillboard}=await import('../src/lib/guestViews'),{GuestSprite}=await import('../src/three/GuestSprite')
 for(let i=0;i<8;i++){const a=i*Math.PI/4;assert.equal(guestView(Math.sin(a),Math.cos(a)),i)}
 assert.equal(guestView(0,0,0,6),6);assert.equal(guestView(Math.sin(Math.PI/8+.02),Math.cos(Math.PI/8+.02),0,0),0)
 assert.equal(guestView(Math.sin(Math.PI/8+.12),Math.cos(Math.PI/8+.12),0,0),1)
 const rotation=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),1)
 assert.ok(guestBillboard(new Vector3(),new Vector3(),rotation).angleTo(rotation)<1e-7)
 const camera=new PerspectiveCamera(),renderer=await create(<GuestSprite height={1.74} atlas={new Texture()} portrait={5}/>,{camera})
 try{for(const x of [-5,5]){camera.position.set(x,4,3);camera.lookAt(0,0,0);await renderer.advanceFrames(1,.016);assert.equal(renderer.scene.instance.getObjectByName('aira-illustration')!.userData.view,5)}}finally{await renderer.unmount()}
})

test('close zoom never tilts or flips Aira and both outfits preserve the selected look',async()=>{
 const {guestBillboard}=await import('../src/lib/guestViews'),{GuestSprite}=await import('../src/three/GuestSprite')
 const anchor=new Vector3(2,0,3),up=new Vector3(0,1,0)
 for(const distance of [.02,.2,1,8])for(const y of [-2,0,1,20]){
  const q=guestBillboard(new Vector3(2+distance,y,3+distance),anchor,new Quaternion())
  assert.ok(up.clone().applyQuaternion(q).distanceTo(up)<1e-8)
  assert.ok(new Vector3(0,0,1).applyQuaternion(q).dot(new Vector3(1,0,1).normalize())>.99999)
 }
 const camera=new PerspectiveCamera(),atlas=Array.from({length:8},()=>new Texture()),renderer=await create(<GuestSprite height={1.74} atlas={atlas} portrait={3}/>,{camera})
 try{
  camera.position.set(2,5,3);await renderer.advanceFrames(1,.016)
  const mesh=renderer.scene.instance.getObjectByName('aira-illustration') as Mesh,uv=Array.from(mesh.geometry.getAttribute('uv').array)
  await renderer.update(<GuestSprite height={1.74} atlas={atlas} portrait={3} outfit="eva"/>);await renderer.advanceFrames(1,.016)
  assert.equal(mesh.userData.view,3);assert.equal(mesh.userData.outfit,'eva');assert.notDeepEqual(Array.from(mesh.geometry.getAttribute('uv').array),uv)
  assert.ok(Math.abs(new Vector3(0,1,0).applyQuaternion(mesh.quaternion).y-1)<1e-8)
 }finally{await renderer.unmount()}
})
