import {doorKinds} from './doorDesign'
import {guestPosition} from './guestData'
import {roomDesign} from './roomDesign'
import {useStudioStore,getSelectedSolution} from '../store/useStudioStore'
import type {FurnitureItem,FurnitureType,LayoutSolution,OptimizationResult} from '../types/layout'
import {fitItem,placeItem,updateMetrics,slideItem,clearItem} from './layoutGeometry'
import {capturePalette,type PaletteState} from './palette'
import {designThemes} from './designThemes'
import {livePets} from './petRuntime'
import {furnitureCatalog} from '../three/catalog'
export function commit(next:LayoutSolution,palette?:PaletteState){
 const s=useStudioStore.getState(),prev=getSelectedSolution();if(!s.lastResult||!prev)return
 useStudioStore.setState({...palette,lastResult:{...s.lastResult,solutions:s.lastResult.solutions.map(it=>it.id===prev.id?updateMetrics(next):it)},editBaseline:s.editBaseline??prev,undoStack:[...s.undoStack.slice(-49),{...prev,...(prev.pets?{pets:livePets(prev.id,prev.pets)}:{}),...(palette?{undoPalette:capturePalette(s)}:{})}],redoStack:[],activeSnapshotIndex:-1,editError:''})
}
export function editItem(id:string,patch:Partial<FurnitureItem>){
 const s=useStudioStore.getState(),sol=getSelectedSolution(),item=sol?.items.find(it=>it.id===id);if(!sol||!item)return false
 if(item.locked&&patch.locked!==false){useStudioStore.setState({editError:'Unlock this item before editing.'});return false}
 if(Object.values(patch).some(v=>typeof v==='number'&&!Number.isFinite(v)))return false
 const attempt={...item,...patch,id:item.id,type:item.type}
 if((patch.widthM!==undefined&&(patch.widthM<Math.min(.25,furnitureCatalog[item.type].targetSizeM.x)||patch.widthM>15))||(patch.depthM!==undefined&&(patch.depthM<Math.min(.2,furnitureCatalog[item.type].targetSizeM.z)||patch.depthM>15))){useStudioStore.setState({editError:'That dimension is outside the supported range for this piece.'});return false}
 const linked=s.moveLinked&&item.type==='diningTable'&&item.groupId&&('x' in patch||'z' in patch||'rotationY' in patch)
 if(linked&&sol.items.some(it=>it.id!==id&&it.groupId===item.groupId&&it.locked)){useStudioStore.setState({editError:'Unlock the linked chairs, or turn off linked movement, before moving this table.'});return false}
 const obstacles=linked?sol.items.filter(it=>it.groupId!==item.groupId):sol.items
 const geometryChange=['x','z','y','scale','rotationY','widthM','depthM'].some(key=>key in patch)
 const next=geometryChange?(s.avoidCollisions?slideItem(attempt,item,sol.room,obstacles,s.roomHeightM):fitItem(attempt,sol.room,s.roomHeightM)):attempt
 if(!next){useStudioStore.setState({editError:'This edit would overlap another piece or the entrance. Move it into clear space, or turn off collision protection.'});return false}
 let items=sol.items.map(it=>it.id===id?next:it)
 if(linked){
  const delta=next.rotationY-item.rotationY,c=Math.cos(delta),sin=Math.sin(delta)
  const moved=sol.items.filter(it=>it.groupId===item.groupId&&it.id!==id).map(it=>({...it,x:next.x+(it.x-item.x)*c+(it.z-item.z)*sin,z:next.z-(it.x-item.x)*sin+(it.z-item.z)*c,rotationY:it.rotationY+delta}))
  const outside=sol.items.filter(it=>it.groupId!==item.groupId)
  if(moved.some(it=>{const fitted=fitItem(it,sol.room,s.roomHeightM);return Math.abs(fitted.x-it.x)>.001||Math.abs(fitted.z-it.z)>.001||(s.avoidCollisions&&!clearItem(it,sol.room,outside))})){useStudioStore.setState({editError:'The dining set needs more space. Turn off linked chairs to move the table by itself.'});return false}
  items=items.map(it=>moved.find(m=>m.id===it.id)??it)
 }
 commit({...sol,items});return true
}
export function addItem(type:FurnitureType,cost?:number,position?:{x:number;z:number}):boolean{
 const s=useStudioStore.getState(),sol=getSelectedSolution(),spec=furnitureCatalog[type];if(!sol||!spec)return false
 const item=placeItem({id:crypto.randomUUID(),type,x:position?.x??0,z:position?.z??0,y:spec.mountY,rotationY:0,scale:1,costINR:cost??spec.costINR},sol.room,sol.items,s.roomHeightM)
 if(!item){useStudioStore.setState({editError:'No clear floor space. Move or remove furniture first.'});return false}
 commit({...sol,items:[...sol.items,item]});useStudioStore.setState({selectedItemId:item.id,dragMode:true,petPanelOpen:false,selectedPetId:null});return true
}
export function duplicateItem(id:string){
 const s=useStudioStore.getState(),sol=getSelectedSolution(),item=sol?.items.find(it=>it.id===id);if(!sol||!item)return
 const copy=placeItem({...item,id:crypto.randomUUID(),groupId:undefined,locked:false,x:item.x+.3,z:item.z+.3},sol.room,sol.items,s.roomHeightM)
 if(!copy){useStudioStore.setState({editError:'No clear space for a duplicate.'});return}
 commit({...sol,items:[...sol.items,copy]});useStudioStore.setState({selectedItemId:copy.id})
}
export function removeItem(id:string){
 const sol=getSelectedSolution();if(!sol)return
 if(sol.items.find(it=>it.id===id)?.locked){useStudioStore.setState({editError:'Unlock this item before deleting.'});return}
 commit({...sol,items:sol.items.filter(it=>it.id!==id)});useStudioStore.setState({selectedItemId:null})
}
export function undoRedo(redo=false){
 const s=useStudioStore.getState(),sol=getSelectedSolution(),source=redo?s.redoStack:s.undoStack,entry=source.at(-1);if(!sol||!entry||!s.lastResult)return
 const {undoPalette,...next}=entry
 const current={...sol,...(sol.pets?{pets:livePets(sol.id,sol.pets)}:{}),...(undoPalette?{undoPalette:capturePalette(s)}:{})}
 useStudioStore.setState({...undoPalette,lastResult:{...s.lastResult,solutions:s.lastResult.solutions.map(it=>it.id===sol.id?{...next,items:next.items.map(item=>fitItem(item,next.room,s.roomHeightM))}:it)},undoStack:redo?[...s.undoStack,current]:s.undoStack.slice(0,-1),redoStack:redo?s.redoStack.slice(0,-1):[...s.redoStack,current],activeSnapshotIndex:-1,selectedItemId:null,selectedPetId:null,petDraggingId:null,editError:''})
}
export function resetEdits(){const s=useStudioStore.getState(),original=s.editBaseline,sol=getSelectedSolution();if(original)commit({...original,guest:sol?.guest,...(sol?.pets?{pets:livePets(sol.id,sol.pets)}:{}),items:original.items.map(it=>fitItem(it,original.room,s.roomHeightM))})}
export function saveableResult():OptimizationResult|undefined{
 const s=useStudioStore.getState(),sol=getSelectedSolution();if(!s.lastResult||!sol)return
 const step=s.lastResult.history_steps?.[s.activeSnapshotIndex]
 const saved=step?{...sol,room:{...sol.room,doorWall:step.doorWall??sol.room.doorWall},items:step.items,pets:undefined,guest:undefined,metrics:step.metrics,edited:false,explanation:`Saved planning study ${step.generation}.`}:{...sol,...(sol.pets?{pets:livePets(sol.id,sol.pets)}:{})}
 const point=guestPosition(saved);if(saved.guest&&point)saved.guest={...saved.guest,...point}
 return {...s.lastResult,solutions:[saved,...s.lastResult.solutions.filter(it=>it.id!==sol.id)],customization:{autoSurfaces:s.autoSurfaces,lightingMode:s.lightingMode,floorMaterial:s.floorMaterial,wallMaterial:s.wallMaterial,wallColor:s.wallColor,roomHeightM:s.roomHeightM,floorColor:s.floorColor,groutColor:s.groutColor,tilePattern:s.tilePattern,tileSize:s.tileSize,cabinetColor:s.cabinetColor,countertopColor:s.countertopColor,metalFinish:s.metalFinish}}
}

export function applyRoomStyle(style:import('../types/layout').StyleChip){const sol=getSelectedSolution(),s=useStudioStore.getState();if(sol){const p=designThemes[style];commit({...sol,selectedStyles:[style]},s.autoSurfaces?roomDesign(sol.room.type,style):{wallColor:p.wall,floorColor:p.floor,cabinetColor:p.cabinet,countertopColor:p.top})}}

export function editDoor(patch:Partial<import('./doorDesign').DoorOptions>){
 const sol=getSelectedSolution();if(!sol)return false
 if(patch.design!==undefined&&patch.design!=='Auto'&&!doorKinds.includes(patch.design))return false
 if(patch.color!==undefined&&patch.color!==''&&!/^#[0-9a-f]{6}$/i.test(patch.color))return false
 if(patch.hardware!==undefined&&!['Auto','Brass','Chrome','Black','Copper'].includes(patch.hardware))return false
 const door={design:'Auto' as const,...sol.door,...patch}
 commit({...sol,door});return true
}
