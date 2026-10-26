import {useMemo} from 'react'
import {RoundedBox} from '@react-three/drei'
import * as THREE from 'three'
import type {FurnitureType,StyleChip} from '../types/layout'
import {useStudioStore} from '../store/useStudioStore'
import {designThemes} from '../lib/designThemes'
import {PetFurniture} from './PetFurniture'
import {DiningSeating,OfficeTaskChair,WallAccessory} from './FurnitureDetails'
type V=[number,number,number]
function Block({at,size,color,metal=0,rough=.55,r=.015}:{at:V;size:V;color:string;metal?:number;rough?:number;r?:number}){
 return <RoundedBox args={size} radius={Math.min(r,...size.map(v=>v/3))} smoothness={3} position={at} castShadow receiveShadow><meshStandardMaterial color={color} metalness={metal} roughness={rough}/></RoundedBox>
}
function Disc({at,radius,height=.015,color,metal=.1,rotation,scale}:{at:V;radius:number;height?:number;color:string;metal?:number;rotation?:V;scale?:V}){
 return <mesh position={at} rotation={rotation} scale={scale} castShadow receiveShadow><cylinderGeometry args={[radius,radius,height,32]}/><meshStandardMaterial color={color} metalness={metal} roughness={.24}/></mesh>
}
function Pipe({points,color,radius=.012}:{points:V[];color:string;radius?:number}){
 const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),[points])
 return <mesh castShadow><tubeGeometry args={[curve,24,radius,8,false]}/><meshStandardMaterial color={color} metalness={.7} roughness={.24}/></mesh>
}
function Tap({at=[0,0,0],metal}:{at?:V;metal:string}){
 return <group position={at}><Disc at={[0,.014,0]} radius={.04} height={.028} color={metal} metal={.7}/><Pipe points={[[0,.02,0],[0,.22,0],[0,.27,.08],[0,.19,.15]]} color={metal}/><Block at={[.046,.065,0]} size={[.065,.018,.025]} color={metal} metal={.7}/></group>
}
function Cabinet({w=1.2,d=.64,h=.88,cabinet,top,metal,drawers=false,island=false,hollow=false,style='Modern'}:{w?:number;d?:number;h?:number;cabinet:string;top:string;metal:string;drawers?:boolean;island?:boolean;hollow?:boolean;style?:StyleChip}){
 const n=drawers?3:Math.max(1,Math.round(w/.5))
 return <group>
  <Block at={[0,.045,0]} size={[w-.08,.09,d-.09]} color="#323832"/>
  {hollow?<>{[-1,1].map(sign=><Block key={sign} at={[sign*(w/2-.02),(h+.09)/2,0]} size={[.025,h-.09,d-.035]} color={cabinet}/>)}<Block at={[0,(h+.09)/2,-d/2+.02]} size={[w-.018,h-.09,.025]} color={cabinet}/></>:<><Block at={[0,(h+.09)/2,0]} size={[w-.018,h-.09,d-.035]} color={cabinet}/><Block at={[0,h+.02,0]} size={[w,.04,d]} color={top} rough={.22} r={.008}/></>}
  {Array.from({length:n},(_,i)=>drawers?<group key={i}><Block at={[0,.22+i*.23,d/2-.008]} size={[w-.06,.215,.027]} color={cabinet}/>{style!=='Minimal'&&<Block at={[0,.3+i*.23,d/2+.014]} size={[Math.min(.22,w*.5),.014,.022]} color={metal} metal={.7}/> }</group>:<group key={i}><Block at={[-w/2+(i+.5)*w/n,.465,d/2-.008]} size={[w/n-.018,.70,.026]} color={cabinet}/>{style!=='Minimal'&&<Block at={[-w/2+(i+.5)*w/n,.70,d/2+.012]} size={[Math.min(.16,w/n*.55),.014,.023]} color={metal} metal={.7}/> }</group>)}
  {(style==='Cozy'||style==='Coastal')&&Array.from({length:n},(_,i)=>{const cw=drawers?w-.065:w/n-.025,cx=drawers?0:-w/2+(i+.5)*w/n,cy=drawers?.22+i*.23:.465,ch=drawers?.20:.68;return <group key={`frame-${i}`}>{[-1,1].map(sign=><group key={sign}><Block at={[cx+sign*(cw/2-.018),cy,d/2+.009]} size={[.027,ch,.014]} color={cabinet}/><Block at={[cx,cy+sign*(ch/2-.018),d/2+.009]} size={[cw,.027,.014]} color={cabinet}/></group>)}</group>})}
  {style==='Luxury'&&Array.from({length:Math.max(5,Math.floor(w/.045))},(_,i)=>{const count=Math.max(5,Math.floor(w/.045));return <Block key={`flute-${i}`} at={[-w/2+.045+i*(w-.09)/(count-1),.45,d/2+.009]} size={[.013,.64,.014]} color={cabinet}/>})}
  {island&&<><Block at={[0,h+.02,-d/2-.035]} size={[w,.045,.12]} color={top} rough={.2}/>{Array.from({length:15},(_,i)=><Block key={i} at={[-w/2+.06+i*(w-.12)/14,.46,-d/2+.012]} size={[.028,.74,.023]} color={cabinet}/>)}</>}
 </group>
}
function Basin({at,width=.54,depth=.36,metal=false,color='#f2f1eb'}:{at:V;width?:number;depth?:number;metal?:boolean;color?:string}){
 const profile=useMemo(()=>[new THREE.Vector2(0,.012),new THREE.Vector2(.18,.012),new THREE.Vector2(.25,.028),new THREE.Vector2(.36,.11),new THREE.Vector2(.48,.16),new THREE.Vector2(.5,.165)],[])
 return <group position={at} scale={[width,1,depth]}><mesh castShadow receiveShadow><latheGeometry args={[profile,40]}/><meshStandardMaterial color={color} metalness={metal?.65:.02} roughness={metal?.24:.13} side={THREE.DoubleSide}/></mesh><Disc at={[0,.018,0]} radius={.055} height={.004} color="#707b78" metal={.7}/></group>
}
function Vessel({at,color}:{at:V;color:string}){return <group position={at}><Disc at={[0,.05,0]} radius={.035} height={.10} color={color}/><Disc at={[0,.105,0]} radius={.027} height={.012} color="#d4c2a2"/></group>}
function GlassPanel({at,size}:{at:V;size:V}){return <mesh position={at} receiveShadow><boxGeometry args={size}/><meshPhysicalMaterial color="#b9d3cd" transparent opacity={.18} roughness={.08} metalness={.05} depthWrite={false} side={THREE.DoubleSide}/></mesh>}

/** Models are built in metres. All fronts point toward local +Z. */
export function RoomSpecificFurniture({type,style}:{type:FurnitureType;style:StyleChip}){
 const appearance=useStudioStore()
 const palette=designThemes[style]
 const cabinet=appearance.cabinetColor||palette.cabinet,top=appearance.countertopColor||palette.top,wood=palette.wood
 const metal=appearance.metalFinish==='Auto'?palette.metal:{Brass:'#b89a62',Chrome:'#aebbb8',Black:'#343c39',Copper:'#b77b58'}[appearance.metalFinish]
 const white='#f2f0e9',dark='#25302d'
 if(['petBed','petBowls','catTree','scratchingPost','petToyBasket'].includes(type))return <PetFurniture type={type} style={style} wood={wood} fabric={cabinet} metal={metal}/>
 if(type==='kitchenCounter'||type==='kitchenIsland'){
  const island=type==='kitchenIsland',w=island?1.8:1.2,d=island?.9:.64
  return <group><Cabinet style={style} w={w} d={d} cabinet={cabinet} top={top} metal={metal} island={island} drawers={!island}/>
   {!island&&<><Block at={[-.36,.932,-.04]} size={[.34,.016,.26]} color={wood}/><Block at={[-.41,.951,-.02]} size={[.19,.009,.12]} color="#d5be8a" r={.025}/><Vessel at={[.38,.92,-.18]} color="#d7cbbb"/><Vessel at={[.27,.92,-.18]} color="#4c6154"/></>}
  {island&&<><Disc at={[.42,.956,-.08]} radius={.19} height={.02} color={white}/><Disc at={[.42,.967,-.08]} radius={.15} height={.006} color="#bcba9f"/><Disc at={[-.43,.97,-.12]} radius={.09} height={.05} color="#c3ad8c"/></>}
  </group>
 }
 if(type==='wallCabinet'||type==='tallCabinet'){
  const tall=type==='tallCabinet',w=tall?.6:.9,h=tall?2.16:.72,d=tall?.64:.34
  return <group><Block at={[0,h/2,0]} size={[w,h,d]} color={cabinet}/>{[-1,1].map(sign=><group key={sign}><Block at={[sign*w/4,h/2,d/2+.004]} size={[w/2-.018,h-.025,.023]} color={cabinet}/><Block at={[sign*.045,tall?1.08:.25,d/2+.025]} size={[.012,tall?.32:.16,.018]} color={metal} metal={.75}/></group>)}{(style==='Cozy'||style==='Coastal')&&[-1,1].map(sign=><group key={`shaker-${sign}`}>{[-1,1].map(edge=><group key={edge}><Block at={[sign*w/4+edge*(w/4-.035),h/2,d/2+.02]} size={[.025,h-.06,.014]} color={cabinet}/><Block at={[sign*w/4,h/2+edge*(h/2-.035),d/2+.02]} size={[w/2-.04,.025,.014]} color={cabinet}/></group>)}</group>)}{style==='Luxury'&&Array.from({length:16},(_,i)=><Block key={i} at={[-w/2+.03+i*(w-.06)/15,h/2,d/2+.022]} size={[.012,h-.05,.012]} color={cabinet}/>)}{tall&&<Block at={[0,.08,d/2+.019]} size={[w-.02,.10,.009]} color="#37443b"/>}</group>
 }
 if(type==='rangeHood'&&style==='Minimal')return <group><Block at={[0,.045,0]} size={[.65,.09,.45]} color={metal} metal={.6}/><Block at={[0,.29,-.13]} size={[.40,.49,.16]} color={cabinet}/><Block at={[0,.005,.13]} size={[.4,.008,.03]} color="#e7dec4"/></group>
 if(type==='rangeHood'&&style==='Luxury')return <group><Disc at={[0,.06,0]} radius={.27} height={.12} color={metal} metal={.65} scale={[1,1,.82]}/><Disc at={[0,.35,-.06]} radius={.11} height={.55} color={metal} metal={.65}/><Disc at={[0,.008,.03]} radius={.18} height={.006} color="#d7cba8"/></group>
 if(type==='rangeHood')return <group><Block at={[0,.045,0]} size={[.65,.09,.45]} color={metal} metal={.55}/><mesh position={[0,.16,-.04]} castShadow><cylinderGeometry args={[.14,.31,.21,4]}/><meshStandardMaterial color={metal} metalness={.55} roughness={.32}/></mesh><Block at={[0,.40,-.12]} size={[.22,.44,.20]} color={metal} metal={.55}/><Block at={[0,-.003,.14]} size={[.4,.009,.035]} color="#eadbbe" rough={.4}/></group>
 if(type==='stove')return <group>
  <Block at={[0,.045,0]} size={[.58,.09,.57]} color={dark}/><Block at={[0,.47,0]} size={[.64,.85,.64]} color={cabinet}/><Block at={[0,.912,0]} size={[.64,.035,.64]} color="#141d1a" rough={.15}/>
  {[-.16,.16].flatMap(x=>[-.16,.16].map(z=><group key={`${x}-${z}`}>{style==='Modern'||style==='Minimal'?<><mesh position={[x,.935,z]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.092,.096,40]}/><meshStandardMaterial color="#8c9890"/></mesh><mesh position={[x,.9355,z]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.060,.062,32]}/><meshStandardMaterial color="#566b60"/></mesh></>:<><Disc at={[x,.934,z]} radius={.105} height={.007} color="#5b6760" metal={.6}/><Disc at={[x,.94,z]} radius={.066} height={.012} color="#1c2720"/>{[0,Math.PI/2].map(r=><mesh key={r} position={[x,.95,z]} rotation={[0,r,0]}><boxGeometry args={[.23,.012,.018]}/><meshStandardMaterial color="#424d45" metalness={.5}/></mesh>)}</>}</group>))}
  <Block at={[0,.43,.325]} size={[.57,.48,.025]} color={metal} metal={.5}/><Block at={[0,.43,.341]} size={[.46,.34,.01]} color="#172322" metal={.2} rough={.12}/>{[.32,.4,.48].map(y=><Block key={y} at={[0,y,.348]} size={[.36,.008,.007]} color="#7d8b80" metal={.6}/>)}
  <Block at={[0,.68,.36]} size={[.47,.025,.035]} color={metal} metal={.7}/>{[-.23,-.115,0,.115,.23].map(x=><Disc key={x} at={[x,.80,.335]} radius={.024} height={.025} color={metal} metal={.6} rotation={[Math.PI/2,0,0]}/>)}
 </group>
 if(type==='refrigerator'&&style==='Minimal')return <group><Block at={[0,.99,0]} size={[.76,1.98,.74]} color={white} r={.035}/><Block at={[0,1.20,.376]} size={[.72,1.48,.025]} color={white}/><Block at={[-.27,1.25,.405]} size={[.018,.50,.028]} color={metal} metal={.7}/><Block at={[0,.24,.376]} size={[.72,.40,.025]} color={white}/><Block at={[0,.38,.402]} size={[.44,.02,.025]} color={metal} metal={.7}/></group>
 if(type==='refrigerator'&&style==='Cozy')return <group><Block at={[0,.99,0]} size={[.76,1.98,.74]} color={wood}/>{[.57,1.53].map((y,i)=><group key={y}><Block at={[0,y,.378]} size={[.72,i?.84:1.04,.025]} color={cabinet}/><Block at={[-.28,y,.408]} size={[.018,.28,.028]} color={metal} metal={.7}/></group>)}</group>
 if(type==='refrigerator')return <group>
  <Block at={[0,.99,0]} size={[.76,1.98,.74]} color="#9ba6a1" metal={.4} rough={.3} r={.035}/>{[-1,1].map(sign=><group key={sign}><Block at={[sign*.184,1.18,.376]} size={[.357,1.50,.028]} color={style==='Minimal'?white:'#aeb8b1'} metal={.4} rough={.26}/><Block at={[sign*.042,1.24,.405]} size={[.018,.49,.025]} color={metal} metal={.75}/></group>)}<Block at={[0,.24,.377]} size={[.72,.40,.025]} color="#aeb8b1" metal={.4}/><Block at={[0,.38,.408]} size={[.42,.018,.022]} color={metal} metal={.7}/><Block at={[-.19,1.46,.395]} size={[.14,.20,.012]} color="#344943" rough={.25}/><Block at={[-.19,1.51,.405]} size={[.075,.018,.005]} color="#bed1c2"/><Block at={[0,.035,.335]} size={[.65,.035,.07]} color="#323f37"/>
 </group>
 if(type==='dishwasher')return <group><Block at={[0,.46,0]} size={[.60,.92,.64]} color={cabinet}/><Block at={[0,.47,.322]} size={[.57,.79,.025]} color={style==='Minimal'||style==='Cozy'?cabinet:'#a7b3ac'} metal={style==='Minimal'||style==='Cozy'?.02:.45} rough={.3}/><Block at={[0,.83,.344]} size={[.51,.09,.018]} color={dark}/><Block at={[0,.745,.365]} size={[.40,.022,.025]} color={metal} metal={.7}/>{[-.16,-.1,-.04].map(x=><Disc key={x} at={[x,.83,.359]} radius={.009} height={.004} color="#c2d5c2" rotation={[Math.PI/2,0,0]}/>)}<Block at={[0,.045,.33]} size={[.53,.07,.015]} color="#465047"/></group>
 if(type==='microwave')return <group><Block at={[0,.15,0]} size={[.5,.3,.4]} color={style==='Industrial'?dark:style==='Cozy'?white:'#b3bdb6'} metal={.45}/><Block at={[-.045,.15,.205]} size={[.35,.23,.012]} color="#172722" rough={.16}/><Block at={[.18,.15,.218]} size={[.016,.20,.024]} color={metal} metal={.7}/><Block at={[.221,.22,.209]} size={[.032,.043,.008]} color="#406453"/>{[.08,.12,.16].map(y=><Block key={y} at={[.22,y,.21]} size={[.035,.012,.009]} color="#778a7c"/>)}</group>
 if(type==='sink'||type==='vanity'){
  const vanity=type==='vanity',w=vanity?1:.9,d=vanity?.54:.64
  const opening=.54,openingD=.37
  return <group>
   <Cabinet style={style} w={w} d={d} h={.85} hollow cabinet={vanity?wood:cabinet} top={top} metal={metal}/>
   {/* Four rim sections keep the basin visibly recessed instead of a flat painted square. */}
   <Block at={[-(w+opening)/4,.91,0]} size={[(w-opening)/2,.06,d]} color={top} rough={.2}/><Block at={[(w+opening)/4,.91,0]} size={[(w-opening)/2,.06,d]} color={top} rough={.2}/>
   <Block at={[0,.91,-(d+openingD)/4]} size={[opening,.06,(d-openingD)/2]} color={top} rough={.2}/><Block at={[0,.91,(d+openingD)/4]} size={[opening,.06,(d-openingD)/2]} color={top} rough={.2}/>
   <Basin at={[0,.77,0]} width={opening} depth={openingD} metal={!vanity} color={vanity?white:'#81928b'}/><Tap at={[0,.94,-d/2+.045]} metal={metal}/><Vessel at={[-w/2+.09,.94,-.12]} color={vanity?'#b2a28a':'#6c8069'}/>
   {vanity&&<>{style==='Luxury'||style==='Coastal'?<><Disc at={[0,1.55,-d/2+.025]} radius={.40} height={.025} color={metal} metal={.7} rotation={[Math.PI/2,0,0]}/><Disc at={[0,1.55,-d/2+.043]} radius={.375} height={.008} color="#a8bdb5" metal={.75} rotation={[Math.PI/2,0,0]}/></>:<><Block at={[0,1.55,-d/2+.025]} size={[.80,.89,.025]} color={metal} metal={.6} r={.06}/><Block at={[0,1.55,-d/2+.043]} size={[.76,.85,.009]} color="#a8bdb5" metal={.72} rough={.09} r={.055}/></>}<Block at={[0,1.98,-d/2+.06]} size={[.60,.025,.045]} color="#e8dbc0" rough={.2}/></>}

  </group>
 }
 if(type==='toilet'){
  const profile=[new THREE.Vector2(.085,.12),new THREE.Vector2(.125,.17),new THREE.Vector2(.18,.30),new THREE.Vector2(.205,.40),new THREE.Vector2(.20,.43),new THREE.Vector2(.175,.43),new THREE.Vector2(.145,.33),new THREE.Vector2(.07,.27)]
  return <group>
   <Block at={[0,.04,.05]} size={[.28,.08,.42]} color={white} rough={.14} r={.035}/><Block at={[0,.21,.015]} size={[style==='Industrial'?.32:.25,.35,.31]} color={white} rough={.12} r={style==='Industrial'?.012:.075}/>
   <mesh position={[0,0,.10]} scale={[1,1,1.22]} castShadow receiveShadow><latheGeometry args={[profile,48]}/><meshStandardMaterial color={white} roughness={.12} side={THREE.DoubleSide}/></mesh>
   <mesh position={[0,.445,.10]} rotation={[-Math.PI/2,0,0]} scale={[1,1.25,1]} castShadow><torusGeometry args={[.18,.023,12,48]}/><meshStandardMaterial color="#e4e3da" roughness={.14}/></mesh><Disc at={[0,.282,.09]} radius={.086} height={.005} color="#9eaba1" scale={[1,1,1.2]}/>
   {style==='Minimal'?<><Block at={[0,.41,-.28]} size={[.40,.82,.08]} color={top} r={.008}/><Block at={[0,.70,-.232]} size={[.17,.10,.014]} color={metal} metal={.6}/></>:<>   <Block at={[0,.60,-.25]} size={[.37,.37,.19]} color={white} rough={.13} r={.035}/><Block at={[0,.80,-.25]} size={[.39,.035,.21]} color={white} rough={.12} r={.025}/><Disc at={[0,.822,-.25]} radius={.032} height={.005} color={metal} metal={.7}/><Block at={[0,.49,-.125]} size={[.27,.04,.025]} color="#f2f0e9" rough={.15}/></>}

  </group>
 }
 if(type==='bathtub'){
  const profile=[new THREE.Vector2(.66,.015),new THREE.Vector2(.78,.05),new THREE.Vector2(.94,.42),new THREE.Vector2(1,.61),new THREE.Vector2(.98,.65),new THREE.Vector2(.88,.65),new THREE.Vector2(.82,.56),new THREE.Vector2(.64,.14),new THREE.Vector2(.12,.13)]
  return <group>{style==='Industrial'&&<>{[-1,1].map(sign=><group key={sign}><Block at={[sign*.365,.28,0]} size={[.09,.56,1.7]} color={top} r={.006}/><Block at={[0,.28,sign*.79]} size={[.73,.56,.12]} color={top} r={.006}/></group>)}</>}<mesh scale={[.41,1,.85]} castShadow receiveShadow><latheGeometry args={[profile,64]}/><meshStandardMaterial color={white} roughness={.12} side={THREE.DoubleSide}/></mesh><Disc at={[0,.145,0]} radius={.12} height={.006} color="#afc5b9" scale={[1,1,3.7]}/><Disc at={[0,.15,.32]} radius={.025} height={.007} color={metal} metal={.7}/><Pipe points={[[-.25,.61,-.49],[-.25,.66,-.49],[-.18,.66,-.49],[-.14,.61,-.49]]} color={metal}/><Disc at={[-.30,.64,-.59]} radius={.025} color={metal} metal={.7}/></group>
 }
 if(type==='shower')return <group>{(style==='Industrial'||style==='Luxury')&&<>{[-1,1].map(sign=><Block key={sign} at={[sign*.474,1.075,.474]} size={[.022,2.04,.022]} color={metal} metal={.6}/>)}<Block at={[0,2.09,.474]} size={[.96,.022,.022]} color={metal} metal={.6}/></>}
  <Block at={[0,.028,0]} size={[.98,.056,.98]} color={white} rough={.28} r={.018}/><Block at={[0,.066,.37]} size={[.47,.008,.045]} color="#788c7f" metal={.6}/>{[-1,1].map(sign=><Block key={sign} at={[sign*.474,1.08,-.474]} size={[.018,2.04,.018]} color={metal} metal={.7}/>)}
  <GlassPanel at={[.473,1.075,0]} size={[.012,2.02,.96]}/><GlassPanel at={[-.11,1.075,.473]} size={[.73,2.02,.012]}/><Block at={[.26,1.075,.473]} size={[.016,2.04,.022]} color={metal} metal={.7}/><Block at={[.14,1.10,.49]} size={[.018,.25,.018]} color={metal} metal={.7}/><Block at={[-.1,2.09,.473]} size={[.76,.018,.02]} color={metal} metal={.7}/>
  <Block at={[0,1.10,-.456]} size={[.20,.17,.023]} color={metal} metal={.65}/><Pipe points={[[0,.45,-.43],[0,1.84,-.43],[0,2.01,-.34],[0,2.01,-.13]]} color={metal}/><Disc at={[0,1.98,-.13]} radius={.13} height={.024} color={metal} metal={.6}/><Pipe points={[[.06,1.06,-.4],[.14,.85,-.39],[.13,.65,-.37],[.04,.67,-.4]]} color={metal} radius={.006}/><Block at={[-.25,1.28,-.39]} size={[.27,.025,.14]} color={metal} metal={.6}/><Vessel at={[-.30,1.30,-.40]} color="#71886e"/><Vessel at={[-.2,1.30,-.40]} color="#d3c3a6"/>
 </group>
 if(type==='towelRack'&&style==='Minimal')return <group><Block at={[0,.70,0]} size={[.58,.025,.025]} color={metal} metal={.7}/>{[-1,1].map(sign=><Block key={sign} at={[sign*.26,.70,-.025]} size={[.035,.035,.08]} color={metal} metal={.7}/>)}<Block at={[0,.37,.025]} size={[.32,.66,.045]} color={white} r={.015}/></group>
 if(type==='towelRack')return <group>{[-1,1].map(sign=><Pipe key={sign} points={[[sign*.265,0,0],[sign*.265,.8,0]]} color={metal} radius={.015}/>)}{Array.from({length:7},(_,i)=><Block key={i} at={[0,.06+i*.11,.008]} size={[.53,.018,.022]} color={metal} metal={.65}/>)}<Block at={[.02,.33,.055]} size={[.30,.40,.05]} color={style==='Coastal'?'#a7c3ba':'#e7dfcf'} r={.012}/>{[-1,1].map(sign=><Block key={sign} at={[sign*.265,.08,-.045]} size={[.025,.025,.10]} color={metal} metal={.6}/>)}</group>
 if(type==='diningTable'||type==='desk'){
  const dining=type==='diningTable',w=dining?1.8:1.3,d=dining?.95:.65
  const pedestal=dining&&(style==='Minimal'||style==='Luxury')
  return <group>{pedestal?<><Disc at={[0,.735,0]} radius={1} height={.07} color={style==='Luxury'?top:wood} scale={[w/2,1,d/2]}/><Disc at={[0,.36,0]} radius={.18} height={.70} color={style==='Luxury'?metal:wood} metal={style==='Luxury'?.5:.02} scale={[1.6,1,1]}/><Disc at={[0,.025,0]} radius={.32} height={.05} color={style==='Luxury'?metal:wood} scale={[1.4,1,1]}/></>:<><Block at={[0,.735,0]} size={[w,.07,d]} color={style==='Luxury'?top:wood} rough={.28} r={dining?.09:.02}/>{[-1,1].flatMap(x=>[-1,1].map(z=><Block key={`${x}-${z}`} at={[x*(w/2-.12),.35,z*(d/2-.12)]} size={[.055,.70,.055]} color={style==='Industrial'?dark:wood}/>))}</>}
   {!dining&&style==='Cozy'&&<><Block at={[-.40,.44,0]} size={[.38,.52,.54]} color={cabinet}/>{[.27,.44,.61].map(y=><group key={y}><Block at={[-.40,y,.28]} size={[.35,.15,.025]} color={cabinet}/><Block at={[-.40,y,.30]} size={[.13,.012,.02]} color={metal} metal={.6}/></group>)}</>}
   {!dining&&style==='Industrial'&&[-1,1].map(sign=><Pipe key={sign} points={[[sign*.53,.69,-.22],[sign*.53,.05,-.22],[sign*.53,.05,.22],[sign*.53,.69,.22]]} color={metal} radius={.022}/>)}
   {dining?[-.48,.48].flatMap(x=>[-.25,.25].map(z=><group key={`${x}-${z}`}><Disc at={[x,.778,z]} radius={.125} height={.012} color={white}/><Disc at={[x,.786,z]} radius={.092} height={.006} color="#d2cbb4"/><Block at={[x+.16,.782,z]} size={[.012,.009,.19]} color={metal} metal={.7}/><Disc at={[x-.16,.84,z-.025]} radius={.029} height={.09} color="#b5c8bd" metal={.05}/></group>)):<><Block at={[.13,.785,0]} size={[.38,.02,.27]} color={dark}/><Block at={[.13,.925,-.13]} size={[.38,.26,.015]} color={dark}/><Block at={[-.38,.787,.05]} size={[.18,.025,.23]} color="#e6dfc8"/></>}
  </group>
 }
 if(type==='diningChair'||type==='barStool')return <DiningSeating stool={type==='barStool'} style={style} wood={wood} metal={metal} fabric={palette.cabinet}/>
 if(type==='officeChair')return <OfficeTaskChair style={style} metal={metal} fabric={palette.cabinet}/>
 if(['wallArt','wallSconce','wallShelf','kitchenVent','bathroomCabinet'].includes(type))return <WallAccessory type={type} style={style} wood={wood} metal={metal} cabinet={cabinet}/>
 if(type==='sideboard')return <group><Cabinet style={style} w={1.5} d={.45} h={.8} cabinet={wood} top={top} metal={metal}/><Block at={[-.35,.855,0]} size={[.30,.025,.20]} color="#d7c5a3"/><Block at={[-.33,.882,.02]} size={[.25,.025,.18]} color="#6b7a65"/><Disc at={[.40,.9,-.04]} radius={.09} height={.12} color="#bba582"/></group>
 return null
}
