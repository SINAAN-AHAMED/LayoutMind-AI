import {sceneObstacles} from '../lib/guestData'
import {useMemo,useRef,useEffect,useState} from 'react'
import {useFrame,useThree,type ThreeEvent} from '@react-three/fiber'
import {useCursor} from '@react-three/drei'
import * as THREE from 'three'
import type {LayoutSolution} from '../types/layout'
import {useStudioStore} from '../store/useStudioStore'
import {PetWorld,type PetAgent} from '../lib/petSimulation'
import {PET_RADIUS,type PetPose} from '../lib/petNavigation'
import {editPet} from '../lib/petOps'
import {prunePetRuntime} from '../lib/petRuntime'
import {PetModel} from './PetModel'
type PointerTarget=EventTarget&{setPointerCapture:(id:number)=>void;releasePointerCapture:(id:number)=>void}
const floor=new THREE.Plane(new THREE.Vector3(0,1,0),0)
function Companion({agent,world}:{agent:PetAgent;world:PetWorld}){
 const group=useRef<THREE.Group>(null),drag=useRef<{pointerId:number;offset:{x:number;z:number};start:PetPose;moved:boolean}|null>(null)
 const [hovered,setHovered]=useState(false),isDragging=useStudioStore(s=>s.petDraggingId===agent.pet.id)
 const selected=useStudioStore(s=>s.selectedPetId===agent.pet.id&&s.petPanelOpen),{gl}=useThree()
 useFrame(()=>{
  if(drag.current&&useStudioStore.getState().petDraggingId!==agent.pet.id){world.place(agent.pet.id,drag.current.start);drag.current=null}
  if(group.current){group.current.position.set(agent.x,0,agent.z);group.current.rotation.y=agent.rotationY}
 })
 useCursor(hovered||isDragging,isDragging?'grabbing':'grab','auto',gl.domElement)
 const end=(event:ThreeEvent<PointerEvent>,cancel=false)=>{
  if(!drag.current)return;event.stopPropagation();const before=drag.current;drag.current=null
  if(cancel)world.place(agent.pet.id,before.start)
  else if(before.moved)editPet(agent.pet.id,{x:agent.x,z:agent.z,rotationY:agent.rotationY})
  useStudioStore.setState({petDraggingId:null})
  try{(event.target as PointerTarget|null)?.releasePointerCapture(event.pointerId)}catch{/* A browser cancel may already have released capture. */}
 }
 return <group ref={group} name={`companion-${agent.pet.id}`} position={[agent.x,0,agent.z]} rotation={[0,agent.rotationY,0]}
  onPointerOver={e=>{e.stopPropagation();setHovered(true)}} onPointerOut={()=>setHovered(false)}
  onPointerDown={e=>{
   if(e.button!==0)return;e.stopPropagation();const point=e.ray.intersectPlane(floor,new THREE.Vector3());if(!point)return
   drag.current={pointerId:e.pointerId,start:{x:agent.x,z:agent.z,rotationY:agent.rotationY},offset:{x:agent.x-point.x,z:agent.z-point.z},moved:false}
   useStudioStore.setState({petPanelOpen:true,selectedPetId:agent.pet.id,petDraggingId:agent.pet.id,dragMode:false,sidebarOpen:false,selectedItemId:null,petError:''});
   (e.target as PointerTarget|null)?.setPointerCapture(e.pointerId)
  }}
  onPointerMove={e=>{const d=drag.current;if(!d||d.pointerId!==e.pointerId||useStudioStore.getState().petDraggingId!==agent.pet.id)return;e.stopPropagation();const p=e.ray.intersectPlane(floor,new THREE.Vector3());if(p){const pose=world.place(agent.pet.id,{x:p.x+d.offset.x,z:p.z+d.offset.z});if(pose&&Math.hypot(pose.x-d.start.x,pose.z-d.start.z)>.025)d.moved=true}}}
  onPointerUp={e=>end(e)} onPointerCancel={e=>end(e,true)} onLostPointerCapture={e=>end(e,true)}>
  <PetModel kind={agent.pet.kind} collarColor={agent.pet.collarColor} motion={agent}/>
  {selected&&<mesh position={[0,.012,0]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}><ringGeometry args={[PET_RADIUS[agent.pet.kind]+.035,PET_RADIUS[agent.pet.kind]+.048,64]}/><meshBasicMaterial color="#b39a67" transparent opacity={.7} depthWrite={false}/></mesh>}
 </group>
}
export function PetScene({solution}:{solution:LayoutSolution}){
 const world=useMemo(()=>new PetWorld(solution.id,solution.room,sceneObstacles(solution),solution.pets??[]),[solution])
 const destination=useStudioStore(s=>s.petDestination),lastCommand=useRef('')
 useEffect(()=>{
  prunePetRuntime(solution.id,(solution.pets??[]).map(p=>p.id))
  return()=>{if(world.agents.has(useStudioStore.getState().petDraggingId??''))useStudioStore.setState({petDraggingId:null})}
 },[world,solution.id,solution.pets])
 useEffect(()=>{if(destination&&destination.nonce!==lastCommand.current){lastCommand.current=destination.nonce;if(!world.sendTo(destination.id,destination))useStudioStore.setState({petError:'That spot is not reachable. Try another clear patch of floor.'})}},[world,destination])
 useFrame((_,delta)=>{const s=useStudioStore.getState();world.step(delta,s.petsPaused||s.dragMode||s.petDraggingId!==null||document.hidden)})
 return <group name="pet-companions">{[...world.agents.values()].map(agent=><Companion key={agent.pet.id} agent={agent} world={world}/>)}</group>
}
