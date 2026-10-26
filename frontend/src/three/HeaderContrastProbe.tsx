import {useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import {backdropIsDark} from '../lib/headerContrast'
/** A tiny, throttled sample of the previous WebGL frame keeps DOM title contrast in sync with orbit/shadows. */
export function HeaderContrastProbe({onChange}:{onChange:(dark:boolean|null)=>void}){
 const sample=useRef<CanvasRenderingContext2D|null>(null),last=useRef(0),tone=useRef<boolean|null>(null),failed=useRef(false)
 useFrame(({gl,clock})=>{
  if(failed.current||clock.elapsedTime-last.current<.3)return;last.current=clock.elapsedTime
  const source=gl.domElement,root=source.closest?.('.workspace-page'),heading=root?.querySelector('h1');if(!heading)return
  try{
   if(!sample.current){const canvas=document.createElement('canvas');canvas.width=24;canvas.height=8;sample.current=canvas.getContext('2d',{willReadFrequently:true})}
   const context=sample.current;if(!context)return
   const rect=heading.getBoundingClientRect(),bounds=source.getBoundingClientRect();if(!bounds.width||!bounds.height)return
   const scaleX=source.width/bounds.width,scaleY=source.height/bounds.height,x=Math.max(0,(rect.left-bounds.left)*scaleX),y=Math.max(0,(rect.top-bounds.top)*scaleY)
   const width=Math.min(rect.width*scaleX,source.width-x),height=Math.min(rect.height*scaleY,source.height-y);if(width<=0||height<=0)return
   context.fillStyle='#f2ede8';context.fillRect(0,0,24,8);context.drawImage(source,x,y,width,height,0,0,24,8)
   const next=backdropIsDark(context.getImageData(0,0,24,8).data,tone.current)
   if(next!==tone.current){tone.current=next;onChange(next)}
  }catch{failed.current=true;onChange(null)}
 })
 return null
}
