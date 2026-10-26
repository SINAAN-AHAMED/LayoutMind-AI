import type {FurnitureItem,LayoutSolution} from '../types/layout'
import {furnitureCatalog} from '../three/catalog'
import {halfExtents} from './layoutGeometry'
/** Mounted accessories disappear with their supporting cutaway wall. */
export function mountedItemVisible(item:FurnitureItem,room:LayoutSolution['room'],camera:{x:number;z:number},view:'cutaway'|'full',topView:boolean){
 if(view==='full'||item.y<=0||!furnitureCatalog[item.type].wallAnchored)return true
 const [hx,hz]=halfExtents(item)
 const walls=[{d:room.lengthM/2+item.z-hz,visible:-camera.z<room.lengthM/2},{d:room.lengthM/2-item.z-hz,visible:camera.z<room.lengthM/2},{d:room.widthM/2+item.x-hx,visible:-camera.x<room.widthM/2},{d:room.widthM/2-item.x-hx,visible:camera.x<room.widthM/2}].sort((a,b)=>a.d-b.d)
 return walls[0].d>.16||(!topView&&walls[0].visible)
}
