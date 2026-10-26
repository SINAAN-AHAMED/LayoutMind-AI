import {useMemo} from 'react'
import {RoundedBox} from '@react-three/drei'
import * as THREE from 'three'
import type {FurnitureType,StyleChip} from '../types/layout'
type V=[number,number,number]
function Box({at,size,color,r=.01,metal=0}:{at:V;size:V;color:string;r?:number;metal?:number}){return <RoundedBox position={at} args={size} radius={Math.min(r,...size.map(n=>n/3))} smoothness={3} castShadow receiveShadow><meshStandardMaterial color={color} roughness={metal?.3:.6} metalness={metal}/></RoundedBox>}
function Rod({from,to,color,r=.014}:{from:V;to:V;color:string;r?:number}){
 const {length,mid,q}=useMemo(()=>{const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),d=b.clone().sub(a);return {length:d.length(),mid:a.add(b).multiplyScalar(.5),q:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())}},[from,to])
 return <mesh position={mid.toArray()} quaternion={q.toArray()} castShadow><cylinderGeometry args={[r,r,length,12]}/><meshStandardMaterial color={color} roughness={.42} metalness={.25}/></mesh>
}
function Orb({at,r,color,scale=[1,1,1],glow=false}:{at:V;r:number;color:string;scale?:V;glow?:boolean}){return <mesh position={at} scale={scale} castShadow><sphereGeometry args={[r,24,16]}/><meshStandardMaterial color={color} roughness={.28} emissive={glow?color:'#000'} emissiveIntensity={glow?.65:0}/></mesh>}
function CurvedBack({y,color}:{y:number;color:string}){
 const shape=useMemo(()=>{const s=new THREE.Shape();for(let i=0;i<=32;i++){const a=Math.PI*(.65+.7*i/32),x=.265*Math.sin(a),z=.265*Math.cos(a);if(i===0)s.moveTo(x,z);else s.lineTo(x,z)}for(let i=32;i>=0;i--){const a=Math.PI*(.65+.7*i/32);s.lineTo(.235*Math.sin(a),.235*Math.cos(a))}s.closePath();return s},[])
 return <mesh name="chair-back" position={[0,y,0]} rotation={[Math.PI/2,0,0]} castShadow receiveShadow><extrudeGeometry args={[shape,{depth:.29,bevelEnabled:true,bevelSize:.007,bevelThickness:.007,bevelSegments:3,steps:1}]}/><meshStandardMaterial color={color} roughness={.78}/></mesh>
}
/** Seats face +Z; backrests stay on -Z in every variation. Seat height is 46 cm. */
export function DiningSeating({stool,style,wood,metal,fabric}:{stool:boolean;style:StyleChip;wood:string;metal:string;fabric:string}){
 const y=stool?.66:.46,leg=style==='Luxury'?metal:style==='Industrial'?'#303a35':wood
 const spindle=style==='Coastal'||style==='Cozy'||style==='Bohemian',industrial=style==='Industrial'
 return <group scale={stool?[.8,1,.8]:[1,1,1]}>
  <group name="chair-seat"><Box at={[0,y,.01]} size={[.50,.065,.48]} color={spindle||industrial?wood:fabric} r={.04}/></group>
  <group name="chair-back">
  {!stool&&!spindle&&!industrial&&<><CurvedBack y={.92} color={fabric}/>{[-1,1].map(sign=><Rod key={sign} from={[sign*.19,y+.015,-.19]} to={[sign*.18,.72,-.18]} color={leg} r={style==='Luxury'?.012:.018}/>)}</>}
  {!stool&&spindle&&<><Box at={[0,.91,-.235]} size={[.48,.055,.05]} color={wood} r={.025}/>{[-2,-1,0,1,2].map(i=><Rod key={i} from={[i*.082,y+.03,-.22]} to={[i*.095,.90,-.235]} color={wood} r={.012}/>)}</>}
  {!stool&&industrial&&<><Box at={[0,.89,-.24]} size={[.48,.09,.045]} color={wood}/>{[-1,1].map(sign=><Rod key={sign} from={[sign*.21,.43,-.22]} to={[sign*.21,.91,-.24]} color={leg}/>)}</>}
  {stool&&<><Box at={[0,.82,-.23]} size={[.47,.16,.05]} color={spindle?wood:fabric} r={.04}/>{[-1,1].map(sign=><Rod key={sign} from={[sign*.18,y+.015,-.19]} to={[sign*.18,.81,-.23]} color={leg} r={.014}/>)}</>}
  </group>
  {[-1,1].flatMap(x=>[-1,1].map(z=><group key={`${x}-${z}`}><Rod from={[x*.23,.015,z*.24]} to={[x*.17,y-.025,z*.17]} color={leg} r={style==='Luxury'?.012:.019}/>{style==='Luxury'&&<Box at={[x*.23,.025,z*.24]} size={[.029,.05,.029]} color={metal} metal={.7}/>}</group>))}
  {stool&&<Rod from={[-.22,.27,.23]} to={[.22,.27,.23]} color={metal} r={.012}/>}
 </group>
}
export function OfficeTaskChair({style,metal,fabric}:{style:StyleChip;metal:string;fabric:string}){
 const mesh=style==='Industrial',luxury=style==='Luxury',back=mesh?'#35453e':fabric
 return <group>
  {Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5,x=Math.sin(a)*.29,z=Math.cos(a)*.29;return <group key={i}><Rod from={[0,.13,0]} to={[x,.07,z]} color={metal} r={.02}/><Orb at={[x,.035,z]} r={.035} color="#27362d" scale={[1,.8,1]}/></group>})}
  <Rod from={[0,.09,0]} to={[0,.49,0]} color={metal} r={.035}/><Rod from={[0,.49,-.20]} to={[0,.72,-.21]} color={metal} r={.024}/><Box at={[0,.52,.025]} size={[.49,.08,.47]} color={fabric} r={.04}/><Box at={[0,.84,-.21]} size={[.47,.50,.065]} color={back} r={.04}/>
  {mesh&&Array.from({length:15},(_,i)=><Box key={i} at={[0,.63+i*.029,-.173]} size={[.40,.006,.006]} color="#71877a"/>)}
  {[-1,1].map(sign=><group key={sign}><Rod from={[sign*.23,.49,-.08]} to={[sign*.27,.71,-.08]} color={metal}/><Box at={[sign*.27,.72,.02]} size={[.07,.035,.32]} color={back} r={.015}/></group>)}
  {luxury&&<><Rod from={[0,1.01,-.20]} to={[0,1.12,-.20]} color={metal}/><Box at={[0,1.13,-.20]} size={[.31,.10,.075]} color={fabric} r={.035}/></>}
 </group>
}
export function WallAccessory({type,style,wood,metal,cabinet}:{type:FurnitureType;style:StyleChip;wood:string;metal:string;cabinet:string}){
 const white='#e9e5d7',dark='#2e493c'
 if(type==='wallArt')return <group><Box at={[0,.325,0]} size={[.8,.65,.055]} color={wood}/><Box at={[0,.325,.03]} size={[.75,.60,.008]} color={white}/>{style==='Coastal'?<><Rod from={[-.10,.10,.039]} to={[.08,.55,.039]} color={dark} r={.006}/>{[-1,0,1,2].map((i)=><Orb key={i} at={[(i%2?-.05:.08),.23+i*.09,.039]} r={.07} color={i%2?dark:'#99a08c'} scale={[.6,1,.035]}/>)}</>:<><Orb at={[-.13,.40,.04]} r={.18} color={style==='Industrial'?'#8b795e':'#c4a16a'} scale={[1,1,.025]}/><Box at={[.11,.24,.04]} size={[.25,.28,.006]} color={dark}/><Rod from={[-.29,.13,.044]} to={[.26,.51,.044]} color="#ad795d" r={.008}/></>}</group>
 if(type==='wallSconce'){
  const linear=style==='Minimal',twin=style==='Luxury'
  return <group><Box at={[0,.24,-.05]} size={[.10,.30,.025]} color={metal} metal={.7}/><Rod from={[0,.24,-.04]} to={[0,.24,.045]} color={metal}/>{linear?<Box at={[0,.24,.035]} size={[.045,.48,.055]} color={white}/>:<><Orb at={[0,twin?.34:.24,.035]} r={.085} color={white} glow/>{twin&&<Orb at={[0,.10,.035]} r={.075} color={white} glow/>}</>}<pointLight position={[0,.24,.18]} intensity={.6} distance={1.8} color="#ffe4b0" decay={2}/></group>
 }
 if(type==='wallShelf')return <group><Box at={[0,.035,0]} size={[.9,.07,.26]} color={wood}/>{[-1,1].map(sign=><Box key={sign} at={[sign*.32,.12,-.095]} size={[.025,.24,.025]} color={style==='Industrial'?'#333e37':metal} metal={.5}/>)}{[0,1,2,3].map(i=><Box key={i} at={[-.29+i*.047,.18,-.015]} size={[.038,.22+i%2*.05,.16]} color={['#b3a480','#647762','#d2bba0','#94a291'][i]}/>)}<Orb at={[.25,.14,0]} r={.075} color={cabinet} scale={[.8,1,.8]}/><Rod from={[.25,.18,0]} to={[.23,.40,0]} color={dark} r={.006}/><Orb at={[.26,.34,0]} r={.06} color={dark} scale={[.4,.7,.22]}/>{style==='Cozy'&&<Box at={[0,.29,0]} size={[.9,.035,.26]} color={wood}/>}</group>
 if(type==='kitchenVent')return <group><Box at={[0,.2,0]} size={[.4,.4,.08]} color={style==='Industrial'?'#293a31':'#b6b9aa'}/>{style==='Minimal'?<><mesh position={[0,.2,.044]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.16,.16,.009,40]}/><meshStandardMaterial color="#263c32"/></mesh>{[0,1,2,3].map(i=><mesh key={i} position={[0,.2,.054]} rotation={[0,0,i*Math.PI/2]}><boxGeometry args={[.27,.04,.008]}/><meshStandardMaterial color="#9aab9a"/></mesh>)}</>:Array.from({length:9},(_,i)=><Box key={i} at={[0,.055+i*.036,.044]} size={[.33,.016,.01]} color={style==='Industrial'?'#708474':'#d7dacd'}/> )}</group>
 if(type==='bathroomCabinet')return <group><Box at={[0,.4,0]} size={[.5,.8,.22]} color={wood}/>{style==='Coastal'?<><Box at={[0,.40,.115]} size={[.44,.70,.012]} color="#3e5546"/>{[.10,.36,.62].map((y,i)=><group key={y}><Box at={[0,y,.14]} size={[.44,.025,.16]} color={wood}/><Box at={[0,y+.075,.14]} size={[.33,.11,.12]} color={i===1?'#a7b9aa':white} r={.025}/></group>)}</>:<>{[-1,1].map(sign=><Box key={sign} at={[sign*.122,.4,.12]} size={[.236,.76,.016]} color="#a0b9ad" metal={.75}/>)}<Box at={[0,.40,.135]} size={[.008,.74,.012]} color={metal}/>{style==='Luxury'&&Array.from({length:16},(_,i)=><Box key={i} at={[-.23+i*.0307,.045,.135]} size={[.014,.055,.015]} color={metal} metal={.6}/>)}</>}</group>
 return null
}
