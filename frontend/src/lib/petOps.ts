import {sceneObstacles} from './guestData'
import {useStudioStore,getSelectedSolution} from '../store/useStudioStore'
import {commit} from './editorOps'
import type {PetInstance,PetKind} from '../types/layout'
import {PetNavigation,MAX_PETS,PET_RADIUS,type Point} from './petNavigation'
import {livePets,forgetPet} from './petRuntime'
export function addPet(kind:PetKind,point:Point={x:0,z:0}){
 const sol=getSelectedSolution();if(!sol||!['cat','pug'].includes(kind))return false
 const pets=livePets(sol.id,sol.pets)
 if(pets.length>=MAX_PETS){useStudioStore.setState({petError:'This room already has four companions.'});return false}
 const position=new PetNavigation(sol.room,sceneObstacles(sol),PET_RADIUS[kind]).nearest(point,pets.map(p=>({...p,radius:PET_RADIUS[p.kind]})))
 if(!position){useStudioStore.setState({petError:'There is no clear floor space for this pet. Move a piece of furniture first.'});return false}
 const pet:PetInstance={id:crypto.randomUUID(),kind,name:kind==='cat'?'Mochi':'Pippin',...position,rotationY:0,roaming:true,collarColor:kind==='cat'?'#739181':'#9e7451'}
 commit({...sol,pets:[...pets,pet]});useStudioStore.setState({petPanelOpen:true,selectedPetId:pet.id,selectedItemId:null,petError:'',dragMode:false,sidebarOpen:false,activeSnapshotIndex:-1});return true
}
export function editPet(id:string,patch:Partial<Pick<PetInstance,'name'|'x'|'z'|'rotationY'|'roaming'|'collarColor'>>){
 const sol=getSelectedSolution();if(!sol)return false
 const pets=livePets(sol.id,sol.pets),pet=pets.find(p=>p.id===id);if(!pet)return false
 if(Object.values(patch).some(v=>typeof v==='number'&&!Number.isFinite(v)))return false
 if(patch.collarColor!==undefined&&!/^#[0-9a-f]{6}$/i.test(patch.collarColor))return false
 const next={...pet,...patch,name:patch.name===undefined?pet.name:patch.name.trim().slice(0,32)||pet.name}
 if('x' in patch||'z' in patch){const p=new PetNavigation(sol.room,sceneObstacles(sol),PET_RADIUS[pet.kind]).nearest(next,pets.filter(p=>p.id!==id).map(p=>({...p,radius:PET_RADIUS[p.kind]})));if(!p)return false;Object.assign(next,p)}
 next.rotationY=((next.rotationY%(Math.PI*2))+Math.PI*2)%(Math.PI*2)
 commit({...sol,pets:pets.map(p=>p.id===id?next:p)});useStudioStore.setState({petError:''});return true
}
export function removePet(id:string){const sol=getSelectedSolution();if(!sol||!sol.pets?.some(p=>p.id===id))return;commit({...sol,pets:livePets(sol.id,sol.pets).filter(p=>p.id!==id)});forgetPet(sol.id,id);useStudioStore.setState({selectedPetId:null,petDraggingId:null,petError:''})}
export function callPet(id:string,point:Point){if(!Number.isFinite(point.x)||!Number.isFinite(point.z))return;useStudioStore.setState({petDestination:{id,...point,nonce:crypto.randomUUID()},petError:''})}
