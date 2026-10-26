import {useRef,useLayoutEffect} from 'react'
import * as THREE from 'three'
import type {FurnitureItem,StyleChip} from '../../types/layout'
import {FurnitureInstance} from '../../three/FurnitureInstance'
export function GhostFurniture({items,styleSliders}:{items:FurnitureItem[];styleSliders:Record<StyleChip,number>}){
 const group=useRef<THREE.Group>(null)
 useLayoutEffect(()=>{group.current?.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.castShadow=false;obj.raycast=()=>{};const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(mat=>{mat.transparent=true;mat.opacity=.22;mat.depthWrite=false;mat.needsUpdate=true})}if(obj instanceof THREE.Light)obj.intensity=0})},[items,styleSliders])
 return <group ref={group}>{items.map(it=><FurnitureInstance key={it.id} item={it} styleSliders={styleSliders}/>)}</group>
}
