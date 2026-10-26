import type {FurnitureItem,GuestInstance,LayoutSolution} from '../types/layout'
import {PetNavigation,type Point} from './petNavigation'
export const GUEST_RADIUS=.36
export function guestPosition(solution:LayoutSolution,point:Point|undefined=solution.guest){return point?new PetNavigation(solution.room,solution.items,GUEST_RADIUS).nearest(point):null}
/** A small, invisible footprint keeps roaming companions out of the guest. */
export function sceneObstacles(solution:LayoutSolution):FurnitureItem[]{
 const p=guestPosition(solution)
 return p?[...solution.items,{id:'@guest-footprint',type:'chair',...p,y:0,rotationY:0,scale:1,widthM:.6,depthM:.6,costINR:0}]:solution.items
}
export function normalizeGuest(value:unknown):GuestInstance|undefined{
 if(!value||typeof value!=='object')return
 const g=value as Record<string,unknown>
 if(!Number.isFinite(g.x)||!Number.isFinite(g.z))return
 return {x:g.x as number,z:g.z as number,rotationY:typeof g.rotationY==='number'&&Number.isFinite(g.rotationY)?((g.rotationY%(2*Math.PI))+2*Math.PI)%(2*Math.PI):0,heightM:typeof g.heightM==='number'&&Number.isFinite(g.heightM)?Math.max(1.4,Math.min(2,g.heightM)):1.74,...(typeof g.portrait==='number'&&Number.isInteger(g.portrait)&&g.portrait>=0&&g.portrait<8?{portrait:g.portrait}:{}),...(g.outfit==='eva'?{outfit:'eva' as const}:{})}
}
