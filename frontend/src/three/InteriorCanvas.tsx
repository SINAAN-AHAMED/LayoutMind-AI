import {CameraRig} from './CameraRig'
import {HeaderContrastProbe} from './HeaderContrastProbe'
import {GuestScene} from './GuestScene'
import {RoomLighting} from './RoomLighting'
import {Canvas,useFrame} from '@react-three/fiber'
import {OrbitControls,ContactShadows,TransformControls} from '@react-three/drei'
import {useMemo,useRef,useState,useCallback,Suspense,Component,type ReactNode,type Ref} from 'react'
import * as THREE from 'three'
import {mountedItemVisible} from '../lib/roomVisibility'
import {PetScene} from './PetScene'
import {PET_DRAG_MIME,parsePetDrop,floorDropPoint} from '../lib/petDrop'
import {addPet,callPet} from '../lib/petOps'
import {FurnitureInstance} from './FurnitureInstance'
import {Room,type StyleSliders} from './Room'
import {GhostFurniture} from '../components/GenerationHistory/GhostFurniture'
import {useStudioStore,getSelectedSolution} from '../store/useStudioStore'
import {editItem,addItem} from '../lib/editorOps'
import {halfExtents,itemSize,yawFromQuaternion} from '../lib/layoutGeometry'
import type {FurnitureItem,LayoutSolution,StyleChip} from '../types/layout'
import {cameraBindings,type CameraDragMode,type CameraNavigationHandle} from '../lib/cameraNavigation'
function EditableFurniture({item,styleSliders,room}:{item:FurnitureItem;styleSliders:StyleSliders;room:LayoutSolution['room']}){
 const group=useRef<THREE.Group>(null),dragging=useRef(false),[object,setObject]=useState<THREE.Group|null>(null)
 const assign=useCallback((node:THREE.Group|null)=>{group.current=node;setObject(node)},[])
 const s=useStudioStore(),selected=s.selectedItemId===item.id,[hx,hz]=halfExtents(item)
 useFrame(({camera})=>{if(group.current)group.current.visible=(s.dragMode&&selected)||mountedItemVisible(item,room,camera.position,s.wallView,s.topView)})
 return <>
  <group ref={assign} position={[item.x,item.y,item.z]} rotation={[0,item.rotationY,0]} onClick={e=>{if(s.dragMode){e.stopPropagation();useStudioStore.setState({selectedItemId:item.id})}}}>
   <FurnitureInstance item={{...item,x:0,y:0,z:0,rotationY:0}} styleSliders={styleSliders}/>
   {s.dragMode&&selected&&<mesh position={[0,.065,itemSize(item).z/2+.16]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.055,.15,3]}/><meshBasicMaterial color="#bfa06b"/></mesh>}
   {s.dragMode&&selected&&<mesh position={[0,.035,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[Math.max(hx,hz)+.06,Math.max(hx,hz)+.09,64]}/><meshBasicMaterial color={item.locked?'#84928c':'#C9A96E'} transparent opacity={.8} depthWrite={false}/></mesh>}
  </group>
  {s.dragMode&&selected&&!item.locked&&object&&<TransformControls object={object} mode={s.transformMode} showX={s.transformMode==='translate'} showZ={s.transformMode==='translate'} showY={s.transformMode==='rotate'} space="world" translationSnap={s.snapToGrid?.05:null} rotationSnap={s.snapToGrid?Math.PI/36:null} onMouseDown={()=>{dragging.current=true}} onMouseUp={()=>{
   if(!dragging.current||!group.current)return;dragging.current=false
   const g=group.current;editItem(item.id,{x:g.position.x,z:g.position.z,rotationY:yawFromQuaternion(g.quaternion)})
   const next=getSelectedSolution()?.items.find(it=>it.id===item.id);if(next){g.position.set(next.x,next.y,next.z);g.rotation.set(0,next.rotationY,0)}
  }}/>}
 </>
}
class CanvasErrorBoundary extends Component<{children:ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true}};render(){return this.state.error?<div role="alert" style={{padding:40,color:'#2D3B2D'}}>The 3D view could not start. Enable browser hardware acceleration, then reload. Your saved layout is retained.</div>:this.props.children}}
export function InteriorCanvas({solution,ghostItems=[],showGhost=false,onHeaderContrast,cameraMode='orbit',cameraNavigationRef}:{cameraMode?:CameraDragMode;cameraNavigationRef?:Ref<CameraNavigationHandle>;onHeaderContrast?:(dark:boolean|null)=>void;solution:LayoutSolution;ghostItems?:FurnitureItem[];showGhost?:boolean}){
 const dropSurface=useRef<{camera:THREE.Camera;canvas:HTMLCanvasElement}|null>(null),[dropHover,setDropHover]=useState(false)
 const petDragging=useStudioStore(s=>s.petDraggingId!==null)
 const height=useStudioStore(s=>s.roomHeightM),topView=useStudioStore(s=>s.topView)
 const styleSliders=useMemo(()=>{const base={Cozy:0,Minimal:0,Modern:0,Luxury:0,Compact:0,Bohemian:0,Industrial:0,Coastal:0} as Record<StyleChip,number>;if(!solution.selectedStyles.length)base.Modern=1;solution.selectedStyles.forEach((style,i)=>{base[style]=1-i*.05});return base},[solution.selectedStyles])
 const {lengthM,widthM,type}=solution.room,size=Math.max(lengthM,widthM)
 const floorPoint=(x:number,y:number)=>{const surface=dropSurface.current;return surface?floorDropPoint(x,y,surface.canvas.getBoundingClientRect(),surface.camera,solution.room):null}
 return <div className="h-full w-full overflow-hidden relative" onDragOver={e=>{if(e.dataTransfer.types.includes(PET_DRAG_MIME)){e.preventDefault();e.dataTransfer.dropEffect='copy';setDropHover(true)}}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setDropHover(false)}} onDrop={e=>{if(!e.dataTransfer.types.includes(PET_DRAG_MIME))return;e.preventDefault();setDropHover(false);const data=parsePetDrop(e.dataTransfer.getData(PET_DRAG_MIME)),point=floorPoint(e.clientX,e.clientY);if(!data)return;if(!point){useStudioStore.setState({petError:'Drop onto the room floor to place it.'});return}if('pet' in data)addPet(data.pet,point);else addItem(data.furniture,undefined,point)}}><CanvasErrorBoundary><Canvas onCreated={({camera,gl})=>{dropSurface.current={camera,canvas:gl.domElement}}} shadows dpr={[1,1.5]} camera={{position:[size*.85,size*.85,size*1.1],fov:42,near:.1,far:150}} gl={{antialias:true,preserveDrawingBuffer:true}} onPointerMissed={event=>{const s=useStudioStore.getState();useStudioStore.setState({selectedItemId:null});if(s.petPanelOpen&&s.selectedPetId&&event.button===0){const point=floorPoint(event.clientX,event.clientY);if(point)callPet(s.selectedPetId,point)}}} fallback={<div>WebGL is unavailable. Enable hardware acceleration to view this room.</div>}>
  {onHeaderContrast&&<HeaderContrastProbe onChange={onHeaderContrast}/>}<RoomLighting solution={solution} height={height}/>
  <Suspense fallback={null}><Room lengthM={lengthM} widthM={widthM} wallH={height} styleSliders={styleSliders} roomType={type} doorWall={solution.room.doorWall} doorOptions={solution.door}/>{showGhost&&ghostItems.length>0&&<GhostFurniture items={ghostItems} styleSliders={styleSliders}/>} {solution.items.map(item=><EditableFurniture key={item.id} item={item} styleSliders={styleSliders} room={solution.room}/>)}{Boolean(solution.pets?.length)&&<PetScene solution={solution}/>} {solution.guest&&<GuestScene solution={solution}/>}<ContactShadows position={[0,.005,0]} opacity={.35} scale={[widthM,lengthM]} blur={2} far={3} resolution={256}/></Suspense>
  <OrbitControls makeDefault enabled={!petDragging} enablePan screenSpacePanning {...cameraBindings(cameraMode)} enableDamping dampingFactor={.08} maxPolarAngle={Math.PI/2.05} minPolarAngle={.001} minDistance={2} maxDistance={size*3} enableRotate={!topView}/><CameraRig size={size} topView={topView} doorWall={solution.room.doorWall} navigationRef={cameraNavigationRef}/>
 </Canvas></CanvasErrorBoundary>{dropHover&&<div className="pet-drop-hint" role="status">Drop onto the floor to place</div>}</div>
}
