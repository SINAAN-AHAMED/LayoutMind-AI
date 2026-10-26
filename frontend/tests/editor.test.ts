import test from 'node:test'
import assert from 'node:assert/strict'
import {fitItem,halfExtents,overlaps,placeItem,yawFromQuaternion,slideItem} from '../src/lib/layoutGeometry'
import type {FurnitureItem,LayoutSolution,OptimizationResult} from '../src/types/layout'
const memory=new Map<string,string>()
const storage={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)}
Object.assign(globalThis,{localStorage:storage,window:{localStorage:storage}})
const {useStudioStore,getSelectedSolution}=await import('../src/store/useStudioStore')
const {editItem,addItem,duplicateItem,removeItem,undoRedo,saveableResult,resetEdits}=await import('../src/lib/editorOps')
const {saveLayout,getSavedLayouts}=await import('../src/lib/savedLayouts')
const item: FurnitureItem={id:'bed',type:'bed',x:0,z:0,y:0,rotationY:0,scale:1,costINR:52000}
const room:LayoutSolution['room']={widthM:6,lengthM:7,type:'Bedroom'}
const solution:LayoutSolution={id:'one',rank:1,room,prompt:'Bedroom',selectedStyles:['Modern'],items:[item],metrics:{totalCostINR:52000,budgetINR:100000,budgetCompliancePct:100,spaceUtilizationPct:10,styleAlignmentPct:90,clearanceScorePct:90,comfortIndexPct:90,fitness:1},explanation:'Generated'}
const result:OptimizationResult={requestId:'test',generatedAtISO:new Date().toISOString(),evolution:[],history_steps:[],solutions:[solution]}
function reset(){useStudioStore.setState({roomHeightM:3.2,avoidCollisions:true,moveLinked:true});useStudioStore.getState().setResult(structuredClone(result))}
test('rotation and scaling keep every corner within walls and height',()=>{
 for(let angle=0;angle<360;angle+=5){
  const i=fitItem({...item,x:100,z:-100,rotationY:angle*Math.PI/180,scale:2},{...room,widthM:2,lengthM:2},2)
  const[x,z]=halfExtents(i)
  assert.ok(Math.abs(i.x)+x<=.97001);assert.ok(Math.abs(i.z)+z<=.97001)
  assert.ok(i.scale*2.1<=1.97001)
 }
})
test('solid additions find clear positions and rugs allow layering',()=>{
 const p=placeItem({...item,id:'second'},room,[item]);assert.ok(p);assert.equal(overlaps(item,p),false)
 assert.equal(overlaps(item,{...item,type:'rug'}),false)
 assert.equal(placeItem(item,{...room,widthM:2,lengthM:2},[fitItem(item,{...room,widthM:2,lengthM:2})]),null)
})
test('edit, undo, redo and immutable original',()=>{
 reset();editItem('bed',{rotationY:Math.PI/2,color:'#ff0000',scale:.8})
 assert.equal(getSelectedSolution()?.items[0].rotationY,Math.PI/2)
 assert.equal(solution.items[0].rotationY,0)
 undoRedo();assert.equal(getSelectedSolution()?.items[0].rotationY,0)
 undoRedo(true);assert.equal(getSelectedSolution()?.items[0].color,'#ff0000')
})
test('lock prevents transforms and deletion, unlock restores editing',()=>{
 reset();editItem('bed',{locked:true});editItem('bed',{x:1});removeItem('bed')
 assert.equal(getSelectedSolution()?.items.length,1);assert.equal(getSelectedSolution()?.items[0].x,0)
 editItem('bed',{locked:false});editItem('bed',{x:1});assert.equal(getSelectedSolution()?.items[0].x,1)
})
test('add, duplicate, delete and honest totals',()=>{
 reset();assert.equal(addItem('chair'),true);duplicateItem('bed')
 assert.equal(getSelectedSolution()?.items.length,3);assert.equal(getSelectedSolution()?.metrics.totalCostINR,116000)
 assert.ok((getSelectedSolution()?.metrics.budgetCompliancePct??100)<100)
 removeItem('bed');assert.equal(getSelectedSolution()?.metrics.totalCostINR,64000)
})
test('customization and item changes survive a save/load round trip',()=>{
 reset();editItem('bed',{color:'#abcdef',rotationY:1,locked:true,_swapStyle:'Coastal',_swapLabel:'Coastal Bed',costINR:60000})
 useStudioStore.getState().setFloorMaterial('Marble');useStudioStore.getState().setWallColor('#123456')
 const saved=saveableResult()!;saveLayout('Edited',saved)
 useStudioStore.getState().setResult(getSavedLayouts()[0].result)
 assert.equal(getSelectedSolution()?.items[0].color,'#abcdef');assert.equal(getSelectedSolution()?.items[0].costINR,60000)
 assert.equal(useStudioStore.getState().floorMaterial,'Marble');assert.equal(useStudioStore.getState().wallColor,'#123456')
})
test('nonfinite input rejected and room height clamps furniture',()=>{
 reset();editItem('bed',{x:NaN});assert.equal(getSelectedSolution()?.items[0].x,0)
 useStudioStore.getState().setRoomHeight(2);assert.ok(getSelectedSolution()!.items[0].scale*2.1<=1.97001)
 useStudioStore.getState().setRoomHeight(NaN);assert.equal(useStudioStore.getState().roomHeightM,2)
})

test('gizmo yaw remains correct past 90 and 180 degrees',()=>{
 for(let deg=-360;deg<=360;deg+=15){const angle=deg*Math.PI/180;const yaw=yawFromQuaternion({x:0,y:Math.sin(angle/2),z:0,w:Math.cos(angle/2)});assert.ok(Math.abs(Math.sin(yaw)-Math.sin(angle))<1e-9);assert.ok(Math.abs(Math.cos(yaw)-Math.cos(angle))<1e-9)}
})
test('reset restores the original even after more than fifty edits',()=>{
 reset();for(let i=1;i<=60;i++)editItem('bed',{rotationY:i*.05})
 resetEdits();assert.equal(getSelectedSolution()?.items[0].rotationY,0)
})

test('saving a historical snapshot keeps the displayed snapshot',()=>{
 reset();const snapshot={generation:5,items:[{...item,rotationY:1}],metrics:solution.metrics,totalCostINR:52000}
 useStudioStore.setState({lastResult:{...result,history_steps:[snapshot]},activeSnapshotIndex:0})
 assert.equal(saveableResult()?.solutions[0].items[0].rotationY,1)
})

test('wall units do not collide with their supporting base cabinets',()=>{
 const base={...item,id:'base',type:'kitchenCounter' as const,y:0}
 const upper={...item,id:'upper',type:'wallCabinet' as const,y:1.5}
 const microwave={...item,id:'micro',type:'microwave' as const,y:.94}
 assert.equal(overlaps(base,upper),false);assert.equal(overlaps(base,microwave),false)
})
test('collision protection slides along a blocked axis',()=>{
 const previous={...item,type:'diningChair' as const,x:-1,z:0}
 const blocker={...item,id:'blocker',type:'diningChair' as const,x:0,z:0}
 const slid=slideItem({...previous,x:-.2,z:.3},previous,room,[blocker])
 assert.ok(slid);assert.equal(slid.x,-1);assert.equal(slid.z,.3)
})
test('dining table movement and rotation preserve chair relationships',()=>{
 reset();const table={...item,id:'table',type:'diningTable' as const,groupId:'set'}
 const chair={...item,id:'seat',type:'diningChair' as const,x:0,z:-.9,groupId:'set'}
 useStudioStore.getState().setResult({...result,solutions:[{...solution,items:[table,chair]}]})
 editItem('table',{x:.4,z:.2,rotationY:Math.PI/2})
 const updated=getSelectedSolution()!,seat=updated.items.find(it=>it.id==='seat')!
 assert.ok(Math.abs(seat.x+.5)<1e-8);assert.ok(Math.abs(seat.z-.2)<1e-8);assert.equal(seat.rotationY,Math.PI/2)
})
test('surface customizations survive save and load',()=>{
 reset();useStudioStore.getState().setAppearance({floorColor:'#ded3bd',groutColor:'#888888',tilePattern:'Hexagon',tileSize:.45,cabinetColor:'#334d3e',countertopColor:'#efdfbb',metalFinish:'Copper'})
 const saved=saveableResult()!;useStudioStore.getState().setAppearance({tilePattern:'Square',metalFinish:'Black'})
 useStudioStore.getState().setResult(saved)
 assert.equal(useStudioStore.getState().tilePattern,'Hexagon');assert.equal(useStudioStore.getState().metalFinish,'Copper')
})

test('all catalog assets have distinct priced swap options',async()=>{
 const {furnitureCatalog}=await import('../src/three/catalog'),{variantsFor}=await import('../src/lib/furnitureVariants')
 for(const spec of Object.values(furnitureCatalog)){
  const choices=variantsFor(spec.type);assert.ok(choices.length>=3,spec.type)
  assert.equal(new Set(choices.map(v=>v.label)).size,choices.length)
  assert.ok(choices.every(v=>v.costINR>0))
 }
})
test('swapping one chair preserves its transform, tint, neighbours and saved choice',async()=>{
 const {variantsFor}=await import('../src/lib/furnitureVariants');reset()
 const seat={...item,type:'diningChair' as const,id:'seat',x:-1,color:'#667766',rotationY:Math.PI/2},other={...seat,id:'other',x:1}
 useStudioStore.getState().setResult({...result,solutions:[{...solution,items:[seat,other]}]})
 const v=variantsFor('diningChair')[1]
 assert.equal(editItem('seat',{costINR:v.costINR,_swapLabel:v.label,_swapStyle:v.style}),true)
 const updated=getSelectedSolution()!.items[0];assert.equal(updated.x,-1);assert.equal(updated.rotationY,Math.PI/2);assert.equal(updated.color,seat.color)
 assert.deepEqual(getSelectedSolution()!.items[1],other)
 const saved=saveableResult()!;useStudioStore.getState().setResult(saved);assert.equal(getSelectedSolution()!.items[0]._swapLabel,v.label)
 editItem('seat',{locked:true});assert.equal(editItem('seat',{_swapLabel:'Blocked'}),false)
})
test('new wall decorations can be added, tinted, removed and restored',()=>{
 reset();assert.ok(addItem('wallArt'));const art=getSelectedSolution()!.items.find(it=>it.type==='wallArt')!
 assert.equal(art.y,1.35);editItem(art.id,{color:'#ac6544'});assert.equal(getSelectedSolution()!.items.find(it=>it.id===art.id)!.color,'#ac6544')
 removeItem(art.id);assert.equal(getSelectedSolution()!.items.some(it=>it.id===art.id),false);undoRedo();assert.ok(getSelectedSolution()!.items.some(it=>it.id===art.id))
})
test('mounted accessories follow cutaway walls and remain editable',async()=>{
 const {mountedItemVisible}=await import('../src/lib/roomVisibility')
 const art={...item,id:'art',type:'wallArt' as const,x:0,y:1.35,z:-room.lengthM/2+.0725},camera={x:10,z:10}
 assert.equal(mountedItemVisible(art,room,camera,'cutaway',false),true)
 const front={...art,z:room.lengthM/2-.0725,rotationY:Math.PI}
 assert.equal(mountedItemVisible(front,room,camera,'cutaway',false),false)
 assert.equal(mountedItemVisible(front,room,camera,'full',false),true)
 assert.equal(mountedItemVisible(art,room,camera,'cutaway',true),false)
 assert.equal(mountedItemVisible({...art,type:'vanity',y:0},room,camera,'cutaway',true),true)
})
test('appearance changes do not move an intentionally overlapping piece',()=>{
 reset();useStudioStore.setState({avoidCollisions:false});editItem('bed',{x:1});assert.ok(addItem('diningChair'))
 const chair=getSelectedSolution()!.items.find(it=>it.type==='diningChair')!;editItem(chair.id,{x:1,z:0});useStudioStore.setState({avoidCollisions:true})
 const before={...getSelectedSolution()!.items.find(it=>it.id===chair.id)!}
 assert.equal(editItem(chair.id,{color:'#334433',_swapStyle:'Luxury',_swapLabel:'Velvet seat',costINR:12000}),true)
 const after=getSelectedSolution()!.items.find(it=>it.id===chair.id)!
 assert.equal(after.x,before.x);assert.equal(after.z,before.z);assert.equal(after.rotationY,before.rotationY)
})

test('pets add, rename, edit, save live positions, delete and undo without changing furniture',async()=>{
 const {addPet,editPet,removePet}=await import('../src/lib/petOps'),{rememberPetPose}=await import('../src/lib/petRuntime')
 reset();assert.equal(addPet('cat',{x:2,z:1}),true);assert.equal(addPet('pug',{x:-2,z:1}),true)
 assert.equal(getSelectedSolution()!.items.length,1);assert.equal(getSelectedSolution()!.metrics.totalCostINR,52000)
 const cat=getSelectedSolution()!.pets![0];editPet(cat.id,{name:'Biscuit',collarColor:'#bc9360',roaming:false})
 const changed=getSelectedSolution()!.pets![0];assert.equal(changed.name,'Biscuit');assert.equal(changed.roaming,false)
 rememberPetPose('one',changed,{x:2,z:2,rotationY:1})
 const saved=saveableResult()!;assert.equal(saved.solutions[0].pets![0].z,2)
 saveLayout('Companions',saved);useStudioStore.getState().setResult(getSavedLayouts()[0].result)
 assert.equal(getSelectedSolution()!.pets![0].name,'Biscuit');assert.equal(getSelectedSolution()!.pets![0].collarColor,'#bc9360')
 removePet(cat.id);assert.equal(getSelectedSolution()!.pets!.length,1);undoRedo();assert.equal(getSelectedSolution()!.pets!.length,2)
 assert.equal(getSelectedSolution()!.items[0].id,'bed')
})
test('pet limits, malformed edits and full-room additions fail safely',async()=>{
 const {addPet,editPet}=await import('../src/lib/petOps');reset()
 for(let i=0;i<4;i++)assert.equal(addPet(i%2?'pug':'cat'),true)
 assert.equal(addPet('cat'),false);const p=getSelectedSolution()!.pets![0]
 assert.equal(editPet(p.id,{x:NaN}),false);assert.equal(editPet(p.id,{collarColor:'invalid'}),false)
 useStudioStore.getState().setResult({...result,solutions:[{...solution,room:{...room,widthM:2,lengthM:2},items:[{...item,widthM:2,depthM:2}]}]})
 assert.equal(addPet('pug'),false);assert.equal(getSelectedSolution()!.pets,undefined)
})
test('pet panel and existing editors remain exclusive; old saves load and history omits pets',async()=>{
 const {addPet}=await import('../src/lib/petOps');reset();useStudioStore.setState({dragMode:true,sidebarOpen:true});useStudioStore.getState().openPetPanel()
 assert.equal(useStudioStore.getState().dragMode,false);assert.equal(useStudioStore.getState().sidebarOpen,false)
 useStudioStore.getState().toggleDragMode();assert.equal(useStudioStore.getState().petPanelOpen,false)
 assert.ok(addPet('cat'));const snapshot={generation:1,items:[item],metrics:solution.metrics,totalCostINR:52000}
 useStudioStore.setState({lastResult:{...useStudioStore.getState().lastResult!,history_steps:[snapshot]},activeSnapshotIndex:0})
 assert.equal(saveableResult()!.solutions[0].pets,undefined)
 reset();assert.equal(getSelectedSolution()!.pets,undefined);assert.equal(useStudioStore.getState().selectedPetId,null)
})
test('pet accessories participate in canonical edits, cost totals and undo',()=>{
 reset();assert.ok(addItem('petBed',undefined,{x:2,z:2}));const bed=getSelectedSolution()!.items.find(i=>i.type==='petBed')!
 assert.ok(Math.hypot(bed.x-2,bed.z-2)<.01);assert.equal(getSelectedSolution()!.metrics.totalCostINR,55500)
 editItem(bed.id,{color:'#9c8464',rotationY:Math.PI/2});removeItem(bed.id);undoRedo()
 const restored=getSelectedSolution()!.items.find(i=>i.id===bed.id)!;assert.equal(restored.color,'#9c8464');assert.equal(restored.rotationY,Math.PI/2)
 assert.equal(useStudioStore.getState().petPanelOpen,false)
})
test('resetting furniture preserves companions added to the room',async()=>{
 const {addPet}=await import('../src/lib/petOps');reset();assert.ok(addPet('cat',{x:2,z:2}));editItem('bed',{rotationY:1})
 resetEdits();assert.equal(getSelectedSolution()!.items[0].rotationY,0);assert.equal(getSelectedSolution()!.pets!.length,1)
})

test('normal budget and dimension typing is not clamped after every digit',async()=>{
 const {optionalNumber,boundedNumber}=await import('../src/lib/parameters')
 for(const text of ['5','50','500','5000','50000'])assert.equal(optionalNumber(text),Number(text))
 assert.equal(optionalNumber(''),null);assert.equal(optionalNumber('abc'),null)
 assert.equal(boundedNumber(optionalNumber('50000'),20000,1000000),50000)
 assert.equal(boundedNumber(1,2,15),2);assert.equal(boundedNumber(20,2,15),15)
 assert.equal(boundedNumber(null,2,15),null)
})
test('locked linked chairs block table transforms and duplicates leave the group',()=>{
 reset();const table={...item,id:'table',type:'diningTable' as const,groupId:'set'}
 const chair={...item,id:'seat',type:'diningChair' as const,x:0,z:-.9,groupId:'set',locked:true}
 useStudioStore.getState().setResult({...result,solutions:[{...solution,items:[table,chair]}]})
 assert.equal(editItem('table',{x:.5,rotationY:1}),false)
 assert.equal(getSelectedSolution()!.items[0].x,0);assert.equal(getSelectedSolution()!.items[1].rotationY,0)
 duplicateItem('seat');const copy=getSelectedSolution()!.items.at(-1)!
 assert.notEqual(copy.id,'seat');assert.equal(copy.groupId,undefined);assert.equal(copy.locked,false)
 useStudioStore.setState({moveLinked:false});assert.equal(editItem('table',{x:.5}),true)
 assert.equal(getSelectedSolution()!.items.find(i=>i.id==='seat')!.x,0)
})
test('palette undo and redo restore surfaces with the style but preserve unrelated edits',async()=>{
 const {applyRoomStyle}=await import('../src/lib/editorOps');const {capturePalette}=await import('../src/lib/palette')
 reset();useStudioStore.getState().setWallColor('#112233');useStudioStore.getState().setAppearance({floorColor:'#445566',cabinetColor:'#123123',countertopColor:'#456456'})
 const before=capturePalette(useStudioStore.getState());applyRoomStyle('Coastal');const after=capturePalette(useStudioStore.getState())
 assert.notDeepEqual(before,after);undoRedo();assert.deepEqual(capturePalette(useStudioStore.getState()),before)
 assert.equal(getSelectedSolution()!.selectedStyles[0],'Modern');undoRedo(true)
 assert.deepEqual(capturePalette(useStudioStore.getState()),after);assert.equal(getSelectedSolution()!.selectedStyles[0],'Coastal')
 assert.equal('undoPalette' in getSelectedSolution()!,false)
 editItem('bed',{rotationY:.3});useStudioStore.getState().setWallColor('#abcdef');undoRedo()
 assert.equal(useStudioStore.getState().wallColor,'#abcdef');assert.equal(getSelectedSolution()!.items[0].rotationY,0)
})
test('undo captures live roaming positions before redo restores a pet edit',async()=>{
 const {addPet,editPet}=await import('../src/lib/petOps'),{rememberPetPose}=await import('../src/lib/petRuntime')
 reset();addPet('cat',{x:2,z:2});const original=getSelectedSolution()!.pets![0]
 editPet(original.id,{name:'Mochi'});const renamed=getSelectedSolution()!.pets![0]
 rememberPetPose('one',renamed,{x:-2,z:2,rotationY:1});undoRedo();undoRedo(true)
 const restored=getSelectedSolution()!.pets![0];assert.equal(restored.name,'Mochi');assert.equal(restored.x,-2);assert.equal(restored.rotationY,1)
})
test('thin mounted pieces accept their actual dimensions and reject invalid dimensions',async()=>{
 const {furnitureCatalog}=await import('../src/three/catalog');reset()
 for(const type of ['wallArt','wallSconce'] as const){
  assert.ok(addItem(type));const added=getSelectedSolution()!.items.find(it=>it.type===type)!,size=furnitureCatalog[type].targetSizeM
  assert.equal(editItem(added.id,{widthM:size.x,depthM:size.z}),true,type)
  assert.equal(editItem(added.id,{depthM:-1}),false);assert.equal(editItem(added.id,{widthM:16}),false)
 }
})
test('old customizations reset optional finishes rather than inheriting a different save',()=>{
 reset();useStudioStore.getState().setAppearance({cabinetColor:'#123456',floorColor:'#abcdef',metalFinish:'Brass'})
 useStudioStore.getState().setResult({...result,customization:{floorMaterial:'Wood',wallMaterial:'Plain',wallColor:'#ffffff',roomHeightM:3}})
 assert.equal(useStudioStore.getState().cabinetColor,'');assert.equal(useStudioStore.getState().floorColor,'');assert.equal(useStudioStore.getState().metalFinish,'Auto')
})
test('corrupt saved records do not hide valid saves and are preserved on mutation',async()=>{
 const {renameLayout,deleteLayout}=await import('../src/lib/savedLayouts');reset()
 const bad={id:'broken',name:'Keep raw',savedAt:'yesterday',result:{solutions:null}}
 memory.set('roomcraft-saved-layouts',JSON.stringify([bad]));const saved=saveLayout('Valid',saveableResult()!)
 assert.equal(getSavedLayouts().length,1);assert.equal(getSavedLayouts()[0].id,saved.id)
 assert.equal(renameLayout(saved.id,'Renamed'),true);assert.equal(getSavedLayouts()[0].name,'Renamed')
 assert.deepEqual(JSON.parse(memory.get('roomcraft-saved-layouts')!)[1],bad)
 assert.equal(deleteLayout(saved.id),true);assert.deepEqual(JSON.parse(memory.get('roomcraft-saved-layouts')!),[bad])
 memory.delete('roomcraft-saved-layouts')
})
test('malformed saved list is not silently overwritten',()=>{
 reset();memory.set('roomcraft-saved-layouts','{bad json')
 assert.deepEqual(getSavedLayouts(),[]);assert.throws(()=>saveLayout('New',saveableResult()!),/kept intact/)
 assert.equal(memory.get('roomcraft-saved-layouts'),'{bad json');memory.delete('roomcraft-saved-layouts')
})
test('quota failure leaves all named saves intact and does not break room edits',async()=>{
 const {getStorageNotice}=await import('../src/lib/sessionStorage');reset()
 memory.delete('roomcraft-saved-layouts');for(let i=0;i<6;i++)saveLayout(`Layout ${i}`,saveableResult()!)
 const bytes=memory.get('roomcraft-saved-layouts'),original=storage.setItem
 storage.setItem=()=>{throw new DOMException('Storage full','QuotaExceededError')}
 try{
  assert.throws(()=>saveLayout('Extra',saveableResult()!),/storage is full/)
  assert.equal(memory.get('roomcraft-saved-layouts'),bytes)
  assert.equal(editItem('bed',{rotationY:.7}),true);assert.ok(Math.abs(getSelectedSolution()!.items[0].rotationY-.7)<1e-9)
  assert.match(getStorageNotice(),/could not be auto-saved/)
 }finally{storage.setItem=original}
 editItem('bed',{rotationY:.8});assert.equal(getStorageNotice(),'');assert.equal(getSavedLayouts().length,6)
})
test('invalid layouts are rejected without clearing the current design or undo history',()=>{
 reset();editItem('bed',{rotationY:.5});const current=getSelectedSolution(),undo=useStudioStore.getState().undoStack
 assert.throws(()=>useStudioStore.getState().setResult({...result,solutions:[]}),/invalid or incomplete/)
 assert.equal(getSelectedSolution(),current);assert.equal(useStudioStore.getState().undoStack,undo)
})
test('session restoration whitelists data and safely ignores broken layout fields',async()=>{
 const {restoreSession}=await import('../src/lib/layoutValidation')
 const restored=restoreSession({theme:'dark',roomHeightM:-1,floorMaterial:'broken',setPrompt:'overwrite action',lastResult:{solutions:[]}})
 assert.deepEqual(restored,{theme:'dark'})
 const valid=restoreSession({lastResult:result,selectedLayoutId:'missing',preferredBudgetINR:50000})
 assert.equal(valid.selectedLayoutId,'one');assert.equal(valid.preferredBudgetINR,50000)
 assert.equal(restoreSession({lastResult:{...result,solutions:[{...solution,items:[item,item]}]}}).lastResult,undefined)
})
test('dialogs and text inputs block room editing keyboard shortcuts',async()=>{
 const {editorKeyBlocked}=await import('../src/lib/keyboard')
 const oldDocument=globalThis.document,oldElement=globalThis.Element
 class MockElement{constructor(public selectorMatch:boolean){}closest(){return this.selectorMatch?{}:null}}
 let dialog=false
 Object.assign(globalThis,{document:{querySelector:()=>dialog?{}:null},Element:MockElement})
 try{
  assert.equal(editorKeyBlocked({target:null,defaultPrevented:false}),false)
  dialog=true;assert.equal(editorKeyBlocked({target:null,defaultPrevented:false}),true)
  dialog=false;assert.equal(editorKeyBlocked({target:new MockElement(true) as unknown as EventTarget,defaultPrevented:false}),true)
  assert.equal(editorKeyBlocked({target:null,defaultPrevented:true}),true)
 }finally{Object.assign(globalThis,{document:oldDocument,Element:oldElement})}
})

test('room designs choose practical distinct surfaces and style-aware lighting',async()=>{
 const {roomDesign,lightingDesign}=await import('../src/lib/roomDesign')
 assert.equal(roomDesign('Bathroom','Modern').wallMaterial,'Ceramic')
 assert.equal(roomDesign('Kitchen','Modern').floorMaterial,'Terrazzo')
 assert.equal(roomDesign('Bedroom','Cozy').wallMaterial,'Fabric')
 assert.equal(roomDesign('Bathroom','Luxury').wallMaterial,'Stone')
 assert.notEqual(lightingDesign('Dining Room','Luxury').fixture,lightingDesign('Dining Room','Modern').fixture)
 assert.notEqual(lightingDesign('Bedroom','Cozy').color,lightingDesign('Bedroom','Cozy','Cool').color)
})
test('room-aware palette changes and their complete surface defaults undo together',async()=>{
 const {roomDesign}=await import('../src/lib/roomDesign'),{applyRoomStyle}=await import('../src/lib/editorOps')
 reset();useStudioStore.setState({...roomDesign('Bedroom','Modern'),autoSurfaces:true})
 const before=useStudioStore.getState().floorMaterial;applyRoomStyle('Luxury')
 assert.equal(useStudioStore.getState().floorMaterial,'Parquet');assert.equal(useStudioStore.getState().wallMaterial,'Panel')
 undoRedo();assert.equal(useStudioStore.getState().floorMaterial,before);assert.equal(useStudioStore.getState().wallMaterial,'Fabric')
 undoRedo(true);assert.equal(useStudioStore.getState().floorMaterial,'Parquet')
 useStudioStore.getState().setWallMaterial('Wallpaper');assert.equal(useStudioStore.getState().autoSurfaces,false)
 applyRoomStyle('Coastal');assert.equal(useStudioStore.getState().wallMaterial,'Wallpaper')
})
test('lighting mood and room default preferences survive named saves',()=>{
 reset();useStudioStore.setState({autoSurfaces:true,lightingMode:'Cool'})
 const saved=saveableResult()!;useStudioStore.setState({autoSurfaces:false,lightingMode:'Warm'});useStudioStore.getState().setResult(saved)
 assert.equal(useStudioStore.getState().autoSurfaces,true);assert.equal(useStudioStore.getState().lightingMode,'Cool')
})

test('optional illustrated guest adds, moves, saves, removes and undoes independently',async()=>{
 const {inviteGuest,editGuest,removeGuest}=await import('../src/lib/guestOps'),{guestPosition}=await import('../src/lib/guestData')
 reset();assert.equal(getSelectedSolution()!.guest,undefined)
 assert.equal(inviteGuest(),true);assert.equal(inviteGuest(),false)
 assert.ok(guestPosition(getSelectedSolution()!));assert.equal(editGuest({x:2,z:2,heightM:1.8,rotationY:0}),true)
 assert.equal(getSelectedSolution()!.guest!.x,2);assert.equal(getSelectedSolution()!.items.length,1)
 const saved=saveableResult()!;useStudioStore.getState().setResult(saved)
 assert.deepEqual(getSelectedSolution()!.guest,{x:2,z:2,heightM:1.8,rotationY:0})
 assert.equal(editGuest({x:NaN}),false);assert.equal(editGuest({heightM:9}),true);assert.equal(getSelectedSolution()!.guest!.heightM,2)
 removeGuest();assert.equal(getSelectedSolution()!.guest,undefined);undoRedo();assert.equal(getSelectedSolution()!.guest!.heightM,2)
})
test('guest footprint leaves pets clear and malformed guest records are ignored',async()=>{
 const {inviteGuest}=await import('../src/lib/guestOps'),{sceneObstacles,normalizeGuest}=await import('../src/lib/guestData'),{PetNavigation}=await import('../src/lib/petNavigation'),{parseStoredResult}=await import('../src/lib/layoutValidation')
 reset();assert.ok(inviteGuest());const sol=getSelectedSolution()!,g=sol.guest!
 assert.equal(new PetNavigation(sol.room,sceneObstacles(sol),.31).clear(g),false)
 assert.equal(normalizeGuest({x:'bad',z:0}),undefined)
 assert.equal(parseStoredResult({...result,solutions:[{...solution,guest:{x:null,z:1}}]})!.solutions[0].guest,undefined)
 useStudioStore.getState().setResult({...result,solutions:[{...solution,room:{...room,widthM:2,lengthM:2},items:[{...item,widthM:2,depthM:2}]}]})
 assert.equal(inviteGuest(),false)
})

test('legacy guest direction survives save, undo and older records',async()=>{
 const {inviteGuest,editGuest}=await import('../src/lib/guestOps'),{normalizeGuest}=await import('../src/lib/guestData')
 reset();assert.ok(inviteGuest());assert.ok(editGuest({rotationY:Math.PI/2}));assert.equal(saveableResult()!.solutions[0].guest!.rotationY,Math.PI/2)
 undoRedo();assert.equal(getSelectedSolution()!.guest!.rotationY,0);undoRedo(true);assert.equal(getSelectedSolution()!.guest!.rotationY,Math.PI/2)
 assert.equal(normalizeGuest({x:1,z:1,heightM:1.74})!.rotationY,0)
})

test('illustrated guest looks save, undo, reset to auto and reject invalid values',async()=>{
 const {inviteGuest,editGuest}=await import('../src/lib/guestOps'),{normalizeGuest}=await import('../src/lib/guestData')
 reset();assert.ok(inviteGuest());assert.ok(editGuest({portrait:6}));assert.equal(saveableResult()!.solutions[0].guest!.portrait,6)
 undoRedo();assert.equal(getSelectedSolution()!.guest!.portrait,undefined);undoRedo(true);assert.equal(getSelectedSolution()!.guest!.portrait,6)
 assert.ok(editGuest({portrait:undefined}));assert.equal(getSelectedSolution()!.guest!.portrait,undefined)
 for(const portrait of [-1,8,1.5,'2',null])assert.equal(normalizeGuest({x:0,z:0,portrait})!.portrait,undefined)
})

test('Aira outfit survives saved-result validation, undo and older records',async()=>{
 const {inviteGuest,editGuest}=await import('../src/lib/guestOps'),{parseStoredResult}=await import('../src/lib/layoutValidation'),{normalizeGuest}=await import('../src/lib/guestData')
 reset();assert.ok(inviteGuest());assert.ok(editGuest({outfit:'eva'}));assert.equal(parseStoredResult(saveableResult())!.solutions[0].guest!.outfit,'eva')
 undoRedo();assert.equal(getSelectedSolution()!.guest!.outfit,undefined);undoRedo(true);assert.equal(getSelectedSolution()!.guest!.outfit,'eva')
 assert.ok(editGuest({outfit:'classic'}));assert.equal(getSelectedSolution()!.guest!.outfit,undefined)
 assert.equal(normalizeGuest({x:0,z:0,outfit:'bad'})!.outfit,undefined);assert.equal(normalizeGuest({x:0,z:0})!.outfit,undefined)
})

test('door overrides save, validate, undo, redo and restore automatic designs',async()=>{
 const {editDoor}=await import('../src/lib/editorOps'),{parseStoredResult}=await import('../src/lib/layoutValidation')
 reset();assert.ok(editDoor({design:'French',color:'#123456',hardware:'Chrome'}))
 assert.equal(getSelectedSolution()!.door!.design,'French');assert.equal(parseStoredResult(saveableResult())!.solutions[0].door!.color,'#123456')
 undoRedo();assert.equal(getSelectedSolution()!.door,undefined);undoRedo(true);assert.equal(getSelectedSolution()!.door!.hardware,'Chrome')
 assert.ok(editDoor({design:'Auto'}));assert.equal(getSelectedSolution()!.door!.design,'Auto');assert.equal(editDoor({color:'bad'}),false)
 const stored=saveableResult()!;assert.equal(parseStoredResult({...stored,solutions:stored.solutions.map(sol=>({...sol,door:null}))})!.solutions[0].door,undefined)
})
