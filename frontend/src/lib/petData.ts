import type {PetInstance,FurnitureType} from '../types/layout'
import {MAX_PETS} from './petNavigation'
export const PET_FURNITURE_TYPES:FurnitureType[]=['petBed','petBowls','catTree','scratchingPost','petToyBasket']
/** Companion data is optional so furniture-only projects keep loading unchanged. */
export function normalizePets(value:unknown):PetInstance[]{
 if(!Array.isArray(value))return []
 const ids=new Set<string>(),pets:PetInstance[]=[]
 for(const p of value){
  if(!p||typeof p.id!=='string'||ids.has(p.id)||!['cat','pug'].includes(p.kind)||![p.x,p.z,p.rotationY].every(Number.isFinite))continue
  ids.add(p.id);pets.push({id:p.id,kind:p.kind,x:p.x,z:p.z,rotationY:p.rotationY,name:typeof p.name==='string'&&p.name.trim()?p.name.trim().slice(0,32):p.kind==='cat'?'Mochi':'Pippin',roaming:p.roaming!==false,collarColor:typeof p.collarColor==='string'&&/^#[0-9a-f]{6}$/i.test(p.collarColor)?p.collarColor:'#739181'})
  if(pets.length===MAX_PETS)break
 }
 return pets
}
