import type {LayoutSolution} from '../types/layout'
import {itemSize} from './layoutGeometry'
/** Centimeter coordinates, with the same clockwise X/Z convention as Three.js. */
export function layoutToDXF(solution:LayoutSolution){
 const records=['0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n']
 const line=(x:number,z:number,x2:number,z2:number,layer:string)=>records.push(`0\nLINE\n8\n${layer}\n10\n${x*100}\n20\n${z*100}\n30\n0\n11\n${x2*100}\n21\n${z2*100}\n31\n0\n`)
 const w=solution.room.widthM/2,l=solution.room.lengthM/2
 line(-w,-l,w,-l,'WALLS');line(w,-l,w,l,'WALLS');line(w,l,-w,l,'WALLS');line(-w,l,-w,-l,'WALLS')
 for(const item of solution.items){
  const size=itemSize(item),c=Math.cos(item.rotationY),s=Math.sin(item.rotationY)
  const corners=[[-size.x/2,-size.z/2],[size.x/2,-size.z/2],[size.x/2,size.z/2],[-size.x/2,size.z/2]].map(([x,z])=>[item.x+x*c+z*s,item.z-x*s+z*c])
  corners.forEach((p,i)=>{const next=corners[(i+1)%4];line(p[0],p[1],next[0],next[1],item.y>.1?'WALL_FIXTURES':'FURNITURE')})
  records.push(`0\nTEXT\n8\nLABELS\n10\n${item.x*100}\n20\n${item.z*100}\n30\n0\n40\n8\n1\n${item.type.toUpperCase()}\n`)
 }
 return records.join('')+'0\nENDSEC\n0\nEOF\n'
}
export function exportDXF(solution:LayoutSolution){const url=URL.createObjectURL(new Blob([layoutToDXF(solution)],{type:'application/dxf'}));const a=document.createElement('a');a.href=url;a.download=`LayoutMind_${solution.room.type.replace(/\s+/g,'_')}.dxf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
