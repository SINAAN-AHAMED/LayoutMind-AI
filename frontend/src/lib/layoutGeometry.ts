import type {FurnitureItem,LayoutSolution} from '../types/layout'
import {furnitureCatalog} from '../three/catalog'
export function itemSize(it:FurnitureItem){const spec=furnitureCatalog[it.type].targetSizeM;return {x:(it.widthM??spec.x)*it.scale,z:(it.depthM??spec.z)*it.scale,y:spec.y*it.scale}}
export function halfExtents(it:FurnitureItem):[number,number]{const size=itemSize(it),c=Math.abs(Math.cos(it.rotationY)),s=Math.abs(Math.sin(it.rotationY));return [(size.x*c+size.z*s)/2,(size.x*s+size.z*c)/2]}
export function fitItem(item:FurnitureItem,room:LayoutSolution['room'],height=5):FurnitureItem{
 const spec=furnitureCatalog[item.type]
 const it={...item,y:Math.max(0,Number.isFinite(item.y)?item.y:spec.mountY),scale:Math.max(.5,Math.min(1.5,item.scale)),rotationY:((item.rotationY%(2*Math.PI))+2*Math.PI)%(2*Math.PI)}
 const [x,z]=halfExtents(it)
 it.scale*=Math.min(1,(room.widthM-.06)/(2*x),(room.lengthM-.06)/(2*z),Math.max(.1,height-.03)/spec.targetSizeM.y/it.scale)
 it.y=Math.max(0,Math.min(it.y,height-spec.targetSizeM.y*it.scale-.03))
 const [hx,hz]=halfExtents(it)
 it.x=Math.max(-room.widthM/2+hx+.03,Math.min(room.widthM/2-hx-.03,it.x));it.z=Math.max(-room.lengthM/2+hz+.03,Math.min(room.lengthM/2-hz-.03,it.z))
 return it
}
/** Oriented rectangle SAT: rotation is checked against actual shape axes, not a loose AABB. */
export function overlaps(a:FurnitureItem,b:FurnitureItem,gap=.008){
 if(a.type==='rug'||b.type==='rug')return false
 const sa=itemSize(a),sb=itemSize(b)
 const ah=(furnitureCatalog[a.type].collisionHeightM??furnitureCatalog[a.type].targetSizeM.y)*a.scale,bh=(furnitureCatalog[b.type].collisionHeightM??furnitureCatalog[b.type].targetSizeM.y)*b.scale
 if(a.y+ah<=b.y+.005||b.y+bh<=a.y+.005)return false
 const axes=(r:number)=>[[Math.cos(r),-Math.sin(r)],[Math.sin(r),Math.cos(r)]]
 const aa=axes(a.rotationY),ba=axes(b.rotationY),dx=b.x-a.x,dz=b.z-a.z
 for(const axis of [...aa,...ba]){
  const ra=Math.abs(axis[0]*aa[0][0]+axis[1]*aa[0][1])*sa.x/2+Math.abs(axis[0]*aa[1][0]+axis[1]*aa[1][1])*sa.z/2
  const rb=Math.abs(axis[0]*ba[0][0]+axis[1]*ba[0][1])*sb.x/2+Math.abs(axis[0]*ba[1][0]+axis[1]*ba[1][1])*sb.z/2
  if(Math.abs(dx*axis[0]+dz*axis[1])>=ra+rb+gap-1e-6)return false
 }
 return true
}
export function blocksEntrance(item:FurnitureItem,room:LayoutSolution['room']){
 const wall=room.doorWall??'front',angle={front:0,right:Math.PI/2,back:Math.PI,left:-Math.PI/2}[wall]
 const d=(wall==='front'||wall==='back'?room.lengthM:room.widthM)/2-.30
 const entry:FurnitureItem={id:'entry',type:'wardrobe',x:Math.sin(angle)*d,z:Math.cos(angle)*d,y:0,rotationY:angle,scale:1,widthM:.8,depthM:.6,costINR:0}
 return overlaps(item,entry,0)
}
export function clearItem(item:FurnitureItem,room:LayoutSolution['room'],others:FurnitureItem[]){return !blocksEntrance(item,room)&&!others.some(it=>it.id!==item.id&&overlaps(item,it))}
export function slideItem(attempt:FurnitureItem,previous:FurnitureItem,room:LayoutSolution['room'],others:FurnitureItem[],height=5):FurnitureItem|null{
 const next=fitItem(attempt,room,height)
 if(clearItem(next,room,others))return next
 const candidates=[fitItem({...next,x:previous.x},room,height),fitItem({...next,z:previous.z},room,height)]
 candidates.sort((a,b)=>(a.x-next.x)**2+(a.z-next.z)**2-((b.x-next.x)**2+(b.z-next.z)**2))
 const slide=candidates.find(it=>clearItem(it,room,others));if(slide)return slide
 for(let t=.95;t>=0;t-=.05){const it=fitItem({...next,x:previous.x+(next.x-previous.x)*t,z:previous.z+(next.z-previous.z)*t},room,height);if(clearItem(it,room,others))return it}
 return null
}
export function placeItem(item:FurnitureItem,room:LayoutSolution['room'],others:FurnitureItem[],height=5):FurnitureItem|null{
 const first=fitItem(item,room,height),spec=furnitureCatalog[item.type]
 const candidates:FurnitureItem[]=[]
 if(spec.wallAnchored){
  for(let wall=0;wall<4;wall++){
   const angle=wall*Math.PI/2,size=itemSize(first),span=wall%2?room.lengthM:room.widthM,limit=span/2-size.x/2-.045
   for(let along=-limit;along<=limit+.001;along+=.08){
    const depth=(wall%2?room.widthM:room.lengthM)/2-size.z/2-.045
    candidates.push({...first,x:Math.sin(angle)*-depth+Math.cos(angle)*along,z:Math.cos(angle)*-depth-Math.sin(angle)*along,rotationY:angle})
   }
  }
 }else{
  candidates.push(first)
  for(let x=-room.widthM/2;x<=room.widthM/2;x+=.16)for(let z=-room.lengthM/2;z<=room.lengthM/2;z+=.16)candidates.push(fitItem({...first,x,z},room,height))
 }
 candidates.sort((a,b)=>(a.x-item.x)**2+(a.z-item.z)**2-((b.x-item.x)**2+(b.z-item.z)**2))
 return candidates.find(it=>clearItem(it,room,others))??null
}
export function updateMetrics(sol:LayoutSolution):LayoutSolution{
 const cost=sol.items.reduce((n,it)=>n+it.costINR,0),budget=sol.metrics.budgetINR
 const area=sol.items.filter(it=>it.type!=='rug'&&it.y<.1).reduce((n,it)=>{const s=itemSize(it);return n+s.x*s.z},0)
 let pairs=0,bad=0
 sol.items.forEach((a,i)=>sol.items.slice(i+1).forEach(b=>{if(a.type!=='rug'&&b.type!=='rug'){pairs++;if(overlaps(a,b,.04))bad++}}))
 const clearance=100*(1-bad/Math.max(1,pairs))
 return {...sol,edited:true,metrics:{...sol.metrics,totalCostINR:cost,budgetCompliancePct:cost<=budget?100:100*budget/cost,spaceUtilizationPct:Math.min(100,100*area/sol.room.widthM/sol.room.lengthM),clearanceScorePct:clearance,comfortIndexPct:clearance},explanation:'Customized layout. Costs and footprint estimates reflect your edits. Style and planning scores refer to the original generated study.'}
}
export function yawFromQuaternion(q:{x:number;y:number;z:number;w:number}){return Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.y*q.y+q.z*q.z))}
