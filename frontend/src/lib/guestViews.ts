import {Quaternion,Vector3} from 'three'

import views from './airaViews.json'
import evaViews from './airaEvaViews.json'
export const AIRA_VIEWS=views
export const guestOutfitViews=(outfit?:'classic'|'eva')=>outfit==='eva'?evaViews:views
export const AIRA_LOOKS=['Welcome','Soft smile','Over the shoulder','Looking back','Book close','Quiet glance','Hair sweep','At ease'] as const
const turn=Math.PI*2,sector=turn/8
/** Eight illustrated views, with a small dead band to avoid flicker at boundaries. */
export function guestView(x:number,z:number,offset=0,previous?:number){
 if(Math.hypot(x,z)<.001)return previous??0
 const angle=((Math.atan2(x,z)-offset)%turn+turn)%turn
 if(previous!==undefined){const distance=Math.abs(Math.atan2(Math.sin(angle-previous*sector),Math.cos(angle-previous*sector)));if(distance<sector/2+.07)return previous}
 return Math.round(angle/sector)%8
}
/** Upright billboard: orbit changes yaw only; camera height and zoom never lean the figure. */
export function guestBillboard(cameraPosition:Vector3,anchor:Vector3,cameraRotation:Quaternion,target=new Quaternion()){
 const normal=new Vector3().subVectors(cameraPosition,anchor);normal.y=0
 if(normal.lengthSq()<1e-10){normal.set(0,0,1).applyQuaternion(cameraRotation);normal.y=0}
 if(normal.lengthSq()<1e-10)normal.set(0,0,1)
 return target.setFromAxisAngle(new Vector3(0,1,0),Math.atan2(normal.x,normal.z))
}
