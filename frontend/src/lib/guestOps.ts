import {useStudioStore,getSelectedSolution} from '../store/useStudioStore'
import {commit} from './editorOps'
import {PetNavigation,PET_RADIUS} from './petNavigation'
import {livePets} from './petRuntime'
import {GUEST_RADIUS,normalizeGuest} from './guestData'
import type {GuestInstance} from '../types/layout'
export function inviteGuest(){const sol=getSelectedSolution();if(!sol||sol.guest)return false;return editGuest({x:0,z:0,heightM:1.74})}
export function editGuest(patch:Partial<GuestInstance>){
 const sol=getSelectedSolution();if(!sol||Object.entries(patch).some(([key,v])=>!(key==='portrait'&&v===undefined)&&!(key==='outfit'&&(v==='classic'||v==='eva'))&&!Number.isFinite(v)))return false
 const guest=normalizeGuest({...sol.guest,...patch});if(!guest)return false
 const p=new PetNavigation(sol.room,sol.items,GUEST_RADIUS).nearest(guest,livePets(sol.id,sol.pets).map(p=>({...p,radius:PET_RADIUS[p.kind]})))
 if(!p){useStudioStore.setState({petError:'The guest needs a clear patch of floor. Move a piece of furniture first.'});return false}
 commit({...sol,guest:{...guest,...p}});useStudioStore.setState({petError:''});return true
}
export function removeGuest(){const sol=getSelectedSolution();if(sol?.guest){commit({...sol,guest:undefined});useStudioStore.setState({petDraggingId:null})}}
