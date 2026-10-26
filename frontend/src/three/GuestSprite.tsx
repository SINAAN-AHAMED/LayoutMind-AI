import {useMemo,useRef,useEffect} from 'react'
import {useFrame} from '@react-three/fiber'
import {useTexture} from '@react-three/drei'
import {BufferGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial,Quaternion,SRGBColorSpace,Texture,Vector3} from 'three'
import {guestOutfitViews,guestBillboard,guestView} from '../lib/guestViews'

export function GuestArtwork(props:{height:number;offset?:number;portrait?:number;outfit?:'classic'|'eva'}){
 const atlas=useTexture(guestOutfitViews(props.outfit).map(view=>`${import.meta.env?.BASE_URL??'/'}${view.url}`))
 return <GuestSprite {...props} atlas={atlas}/>
}
/** Original 2D artwork only. Bottom-centred quads replace the retired mesh character. */
export function GuestSprite({height,offset=0,portrait,outfit,atlas}:{height:number;offset?:number;portrait?:number;outfit?:'classic'|'eva';atlas:Texture|Texture[]}){
 const mesh=useRef<Mesh>(null),frame=useRef(-1)
 const geometry=useMemo(()=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(12,3));g.setAttribute('uv',new Float32BufferAttribute(8,2));g.setIndex([0,1,2,0,2,3]);return g},[])
 const scratch=useMemo(()=>({anchor:new Vector3(),camera:new Vector3(),rotation:new Quaternion()}),[])
 useEffect(()=>()=>geometry.dispose(),[geometry])
 const textures=useMemo(()=>(Array.isArray(atlas)?atlas:Array.from({length:8},()=>atlas)).map(source=>{const copy=source.clone();copy.colorSpace=SRGBColorSpace;copy.needsUpdate=true;return copy}),[atlas])
 useEffect(()=>()=>textures.forEach(texture=>texture.dispose()),[textures])
 useFrame(({camera})=>{
  const actor=mesh.current;if(!actor)return
  actor.parent!.getWorldPosition(scratch.anchor);camera.getWorldPosition(scratch.camera);camera.getWorldQuaternion(scratch.rotation)
  const view=portrait??guestView(scratch.camera.x-scratch.anchor.x,scratch.camera.z-scratch.anchor.z,offset,frame.current<0?undefined:frame.current)
  const data=guestOutfitViews(outfit)[view],{left,right,top,bottom,width:sourceWidth,height:sourceHeight}=data,pixels=bottom-top
  const w=height*(right-left)/pixels
  ;(geometry.getAttribute('position') as Float32BufferAttribute).copyArray([-w/2,0,0,w/2,0,0,w/2,height,0,-w/2,height,0]);geometry.getAttribute('position').needsUpdate=true
  if(frame.current!==view||actor.userData.outfit!==outfit){
   actor.userData.outfit=outfit;
   frame.current=view
   ;(geometry.getAttribute('uv') as Float32BufferAttribute).copyArray([left/sourceWidth,1-bottom/sourceHeight,right/sourceWidth,1-bottom/sourceHeight,right/sourceWidth,1-top/sourceHeight,left/sourceWidth,1-top/sourceHeight]);geometry.getAttribute('uv').needsUpdate=true
  }
  ;(actor.material as MeshBasicMaterial).map=textures[view]
  actor.quaternion.copy(guestBillboard(scratch.camera,scratch.anchor,scratch.rotation));actor.userData.view=view
  geometry.computeBoundingSphere()
 })
 return <mesh name="aira-illustration" ref={mesh} geometry={geometry} frustumCulled={false}>
  <meshBasicMaterial map={textures[0]} transparent alphaTest={.18} depthWrite={false} toneMapped={false}/>
 </mesh>
}
