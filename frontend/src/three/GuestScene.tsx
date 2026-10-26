import {GuestArtwork,GuestSprite} from './GuestSprite'
import {useRef,useEffect,useState,Suspense} from 'react'
import {useFrame,useThree,type ThreeEvent} from '@react-three/fiber'
import {useCursor} from '@react-three/drei'
import * as THREE from 'three'
import type {LayoutSolution} from '../types/layout'
import {useStudioStore} from '../store/useStudioStore'
import {guestPosition} from '../lib/guestData'
import {editGuest} from '../lib/guestOps'
const floor=new THREE.Plane(new THREE.Vector3(0,1,0),0)
const dragId='@room-guest'
type Target=EventTarget&{setPointerCapture:(id:number)=>void;releasePointerCapture:(id:number)=>void}
/** Illustrated camera-facing companion with floor-constrained pointer dragging. */
export function GuestFigure({solution,atlas}:{solution:LayoutSolution;atlas?:THREE.Texture}){
 const group=useRef<THREE.Group>(null),drag=useRef<{id:number;x:number;z:number;offsetX:number;offsetZ:number;moved:boolean}|null>(null),[hover,setHover]=useState(false),{gl}=useThree()
 const placed=guestPosition(solution),height=Math.min(solution.guest?.heightM??1.74,useStudioStore(s=>s.roomHeightM)-.1)
 const dragging=useStudioStore(s=>s.petDraggingId===dragId)
 useCursor(hover||dragging,dragging?'grabbing':'grab','auto',gl.domElement)
 useEffect(()=>()=>{if(useStudioStore.getState().petDraggingId===dragId)useStudioStore.setState({petDraggingId:null})},[])
 useFrame(()=>{if(!group.current||!placed)return;if(drag.current&&!dragging)drag.current=null;const p=drag.current??placed;group.current.position.set(p.x,0,p.z)})
 if(!placed)return null
 const end=(e:ThreeEvent<PointerEvent>,cancel=false)=>{const d=drag.current;if(!d)return;e.stopPropagation();drag.current=null;if(!cancel&&d.moved)editGuest({x:d.x,z:d.z});useStudioStore.setState({petDraggingId:null});try{(e.target as Target).releasePointerCapture(e.pointerId)}catch{/* Browser cancellation can release capture first. */}}
 return <group ref={group} name="room-guest" position={[placed.x,0,placed.z]}
  onPointerOver={e=>{e.stopPropagation();setHover(true)}} onPointerOut={()=>setHover(false)}
  onPointerDown={e=>{if(e.button!==0)return;const p=e.ray.intersectPlane(floor,new THREE.Vector3());if(!p)return;e.stopPropagation();drag.current={id:e.pointerId,...placed,offsetX:placed.x-p.x,offsetZ:placed.z-p.z,moved:false};useStudioStore.setState({petDraggingId:dragId,selectedPetId:null,selectedItemId:null,dragMode:false});(e.target as Target).setPointerCapture(e.pointerId)}}
  onPointerMove={e=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;e.stopPropagation();const p=e.ray.intersectPlane(floor,new THREE.Vector3());if(!p)return;const next=guestPosition(solution,{x:p.x+d.offsetX,z:p.z+d.offsetZ});if(next){d.moved ||= Math.hypot(next.x-placed.x,next.z-placed.z)>.025;d.x=next.x;d.z=next.z}}}
  onPointerUp={e=>end(e)} onPointerCancel={e=>end(e,true)} onLostPointerCapture={e=>end(e,true)}>
  <Suspense fallback={null}>{atlas?<GuestSprite height={height} offset={solution.guest?.rotationY} portrait={solution.guest?.portrait} outfit={solution.guest?.outfit} atlas={atlas}/>:<GuestArtwork height={height} offset={solution.guest?.rotationY} portrait={solution.guest?.portrait} outfit={solution.guest?.outfit}/>}</Suspense>
  <mesh position={[0,.011,0]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><circleGeometry args={[.23,40]}/><meshBasicMaterial color="#344737" transparent opacity={.10} depthWrite={false}/></mesh>
 </group>
}
export function GuestScene({solution}:{solution:LayoutSolution}){return <GuestFigure solution={solution}/>}
