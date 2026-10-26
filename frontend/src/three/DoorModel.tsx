import type {RoomType,StyleChip} from '../types/layout'
import {resolveDoor,type DoorOptions} from '../lib/doorDesign'
function Block({at,size,color,metal=0,rough=.65,name}:{at:[number,number,number];size:[number,number,number];color:string;metal?:number;rough?:number;name?:string}){return <mesh name={name} position={at} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} metalness={metal} roughness={rough}/></mesh>}
export function DoorModel({height,roomType,style,options}:{height:number;roomType:RoomType;style:StyleChip;options?:DoorOptions}){
 const {kind,color,metal}=resolveDoor(roomType,style,options),h=height-.09,w=.76,glass=['Frosted','Glazed','Crittall','French'].includes(kind)
 const bar=(x:number,y:number,width:number,high:number,z=.058)=> <Block key={`${x}:${y}:${width}:${high}`} at={[x,y,z]} size={[width,high,.022]} color={color}/>
 const rim=(x:number,y:number,width:number,high:number)=> <group key={`${x}:${y}`}>{bar(x-width/2,y,.022,high)}{bar(x+width/2,y,.022,high)}{bar(x,Math.max(.012,y-high/2),width,.022)}{bar(x,y+high/2,width,.022)}</group>
 const pane=(x:number,width:number,privacy=false)=> <mesh name={privacy?'door-privacy-glass':'door-clear-glass'} key={x} position={[x,h/2,.033]}><boxGeometry args={[width,h-.24,.032]}/><meshStandardMaterial color={privacy?'#c9d8d1':'#b5c9c1'} transparent opacity={privacy?.88:.25} roughness={privacy?.85:.12} metalness={.05}/></mesh>
 return <group name={`door-${kind}`} userData={{kind,roomType,style}}>
  {[-1,1].map(sign=><Block key={sign} name="door-jamb" at={[sign*.44,height/2,.035]} size={[.045,height-.02,.065]} color={color}/>)}
  <Block name="door-lintel" at={[0,height-.025,.035]} size={[.93,.05,.065]} color={color}/>
  {glass?<>
   {kind==='French'?[-.19,.19].map(x=><group key={x}>{pane(x,.30)}{rim(x,h/2,.355,h)}{bar(x,h*.48,.32,.024)}{bar(x,h*.73,.32,.024)}</group>):<>{pane(0,w-.11,kind==='Frosted')}{rim(0,h/2,w,h)}{bar(0,.08,w,.11)}{bar(0,h-.04,w,.09)}{kind==='Crittall'&&<>{bar(0,h/2,.022,h)}{[.28,.52,.76].map(f=>bar(0,h*f,w,.024))}</>}{kind==='Frosted'&&Array.from({length:22},(_,i)=><Block key={i} at={[-.30+i*.028,h/2,.054]} size={[.005,h-.25,.006]} color="#e0e8de" rough={.95}/>)}</>}
  </>:<>
   <Block name="door-solid-leaf" at={[0,h/2,.03]} size={[w,h,.042]} color={color}/>
   {kind==='Shaker'&&[.28,.73].map(f=>rim(0,h*f,.58,h*.37))}
   {kind==='Panelled'&&[-.155,.155].flatMap(x=>[.27,.73].map(f=><group key={`${x}:${f}`}>{rim(x,h*f,.255,h*.37)}<Block at={[x,h*f,.065]} size={[.205,h*.31,.022]} color={color}/></group>))}
   {kind==='Fluted'&&Array.from({length:19},(_,i)=><Block key={i} at={[-.34+i*.038,h/2,.059]} size={[.014,h-.12,.026]} color={color}/>)}
   {kind==='Louvered'&&<>{rim(0,h/2,.62,h-.12)}{Array.from({length:18},(_,i)=><mesh key={i} name="door-louver" position={[0,.14+i*(h-.27)/17,.056]} rotation={[.35,0,0]} castShadow><boxGeometry args={[.57,.06,.017]}/><meshStandardMaterial color={color} roughness={.72}/></mesh>)}</>}
   {kind==='Flush'&&<Block at={[0,h-.22,.055]} size={[w-.12,.006,.004]} color={metal} metal={.65}/>}
  </>}
  {(kind==='French'?[-.055,.055]:[.275]).map(x=><group key={x}><Block name="door-handle-plate" at={[x,h*.49,.086]} size={[.032,.10,.012]} color={metal} metal={.8} rough={.24}/><Block name="door-handle" at={[x-(kind==='French'?0:.028),h*.50,.105]} size={[kind==='French'?.025:.11,kind==='French'?.16:.024,.025]} color={metal} metal={.8} rough={.2}/></group>)}
  {roomType==='Bathroom'&&<Block name="door-privacy-lock" at={[.275,h*.44,.088]} size={[.025,.025,.014]} color={metal} metal={.8}/>}
 </group>
}
