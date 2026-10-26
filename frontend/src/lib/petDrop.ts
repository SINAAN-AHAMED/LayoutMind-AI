import * as THREE from 'three'
import type {FurnitureType,PetKind} from '../types/layout'
import type {RoomSize} from './petNavigation'
import {PET_FURNITURE_TYPES} from './petData'
export const PET_DRAG_MIME='application/x-layoutmind-pet-studio'
export type PetDrop={pet:PetKind}|{furniture:FurnitureType}
export function parsePetDrop(raw:string):PetDrop|null{
 if(raw.length>200)return null
 try{const p=JSON.parse(raw);if(p&&['cat','pug'].includes(p.pet))return {pet:p.pet};if(p&&PET_FURNITURE_TYPES.includes(p.furniture))return {furniture:p.furniture};return null}catch{return null}
}
export function floorDropPoint(x:number,y:number,rect:{left:number;top:number;width:number;height:number},camera:THREE.Camera,room:RoomSize){
 if(!rect.width||!rect.height||x<rect.left||x>rect.left+rect.width||y<rect.top||y>rect.top+rect.height)return null
 camera.updateMatrixWorld(true)
 const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),camera)
 const p=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Vector3())
 return p&&Math.abs(p.x)<room.widthM/2&&Math.abs(p.z)<room.lengthM/2?{x:p.x,z:p.z}:null
}
