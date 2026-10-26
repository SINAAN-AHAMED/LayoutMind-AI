import type {PetInstance} from '../types/layout'
import type {PetPose} from './petNavigation'
const poses=new Map<string,{signature:string;pose:PetPose}>()
const signature=(pet:PetInstance)=>`${pet.kind}:${pet.x}:${pet.z}:${pet.rotationY}`
export function rememberPetPose(layoutId:string,pet:PetInstance,pose:PetPose){poses.set(`${layoutId}:${pet.id}`,{signature:signature(pet),pose:{x:pose.x,z:pose.z,rotationY:pose.rotationY}})}
export function livePetPose(layoutId:string,pet:PetInstance):PetPose{const entry=poses.get(`${layoutId}:${pet.id}`);return entry?.signature===signature(pet)?entry.pose:{x:pet.x,z:pet.z,rotationY:pet.rotationY}}
export function livePets(layoutId:string,pets:PetInstance[]=[]){return pets.map(pet=>({...pet,...livePetPose(layoutId,pet)}))}
export function clearPetRuntime(){poses.clear()}
export function forgetPet(layoutId:string,id:string){poses.delete(`${layoutId}:${id}`)}
export function prunePetRuntime(layoutId:string,ids:string[]){const prefix=`${layoutId}:`;for(const key of poses.keys())if(key.startsWith(prefix)&&!ids.includes(key.slice(prefix.length)))poses.delete(key)}
