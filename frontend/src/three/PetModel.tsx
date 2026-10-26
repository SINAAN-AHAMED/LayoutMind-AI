import {useMemo,useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import * as THREE from 'three'
import type {PetKind} from '../types/layout'
import type {PetMotion} from '../lib/petSimulation'
type V=[number,number,number]
function Puff({at,scale,color,rotation,gloss=false}:{at:V;scale:V;color:string;rotation?:V;gloss?:boolean}){return <mesh position={at} scale={scale} rotation={rotation} castShadow receiveShadow><sphereGeometry args={[1,24,18]}/><meshStandardMaterial color={color} roughness={gloss?.18:.87} metalness={gloss?.03:0}/></mesh>}
function Curve({points,color,r=.008}:{points:V[];color:string;r?:number}){const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),[points]);return <mesh castShadow><tubeGeometry args={[curve,20,r,8,false]}/><meshStandardMaterial color={color} roughness={.8}/></mesh>}
const still:PetMotion={speed:0,phase:0,time:0,mode:'idle'}
/** Original stylized meshes. Both companions face local +Z and have grounded paws. */
export function PetModel({kind,collarColor='#739181',motion=still,animate=true}:{kind:PetKind;collarColor?:string;motion?:PetMotion;animate?:boolean}){
 const rest=useRef(0)
 const body=useRef<THREE.Group>(null),head=useRef<THREE.Group>(null),tail=useRef<THREE.Group>(null),eyes=useRef<THREE.Group>(null),legs=useRef<(THREE.Group|null)[]>([])
 const cat=kind==='cat',fur=cat?'#d2a16c':'#c8ad86',cream=cat?'#eee0c9':'#d9c6a6',dark=cat?'#785139':'#40362e'
 useFrame((_,delta)=>{
  if(!animate)return
  rest.current=THREE.MathUtils.damp(rest.current,motion.mode==='resting'?1:0,5,Math.min(.05,delta))
  const moving=motion.speed>.01,amp=moving?.27:0,t=motion.time
  if(body.current)body.current.position.y=Math.sin(t*2.1)*.004+(moving?Math.sin(motion.phase*2)*.006:0)-rest.current*(cat?.035:.025)
  if(head.current){head.current.rotation.y=moving?Math.sin(motion.phase*.5)*.035:Math.sin(t*.7)*.10;head.current.rotation.x=motion.mode==='sniffing'?.32:Math.sin(t*1.4)*.025}
  if(tail.current)tail.current.rotation.z=Math.sin(t*(cat?1.8:5))*(moving?.16:.07)
  if(eyes.current)eyes.current.scale.y=motion.mode==='resting'?.12:Math.sin(t*1.8)>.992?.09:1
  legs.current.forEach((leg,i)=>{if(leg){const step=Math.sin(motion.phase+(i===0||i===3?0:Math.PI));leg.rotation.x=step*amp;leg.scale.y=1-rest.current*(cat?.58:.32);leg.position.y=.15*leg.scale.y+(moving?Math.max(0,step)*.025:0)}})
 })
 return <group name={`pet-model-${kind}`} scale={cat?.74:.80}>
  {[-1,1].flatMap((x,xi)=>[-1,1].map((z,zi)=>{const i=xi*2+zi;return <group name={`pet-leg-${i}`} key={i} ref={node=>{legs.current[i]=node}} position={[x*.125,.15,z*.16]}><Puff at={[0,-.045,0]} scale={[.065,.085,.07]} color={fur}/><Puff at={[0,-.12,.035]} scale={[.075,.03,.09]} color={cat?cream:dark}/>{[-1,0,1].map(toe=><Puff key={toe} at={[toe*.025,-.12,.113]} scale={[.003,.011,.004]} color={cat?'#ad936f':'#75654e'}/>)}</group>}))}
  <group ref={body} name="pet-body">
   <Puff at={[0,.29,-.035]} scale={[cat?.205:.19,cat?.235:.215,cat?.285:.25]} color={fur}/><Puff at={[0,.275,.105]} scale={[.15,.18,.15]} color={cream}/>
   {cat&&[-1,1].flatMap(sign=>[-.13,-.035,.06].map((z,i)=><Curve key={`${sign}-${i}`} points={[.27,.33,.39].map(y=>[sign*(.205*Math.sqrt(1-((y-.29)/.235)**2-((z+.035)/.285)**2)+.002),y,z] as V)} color="#a47448" r={.005}/>))}
   <group ref={tail} position={[0,.28,-.22]} name="pet-tail">{cat?<Curve points={[[.02,0,0],[.10,.11,-.055],[.14,.24,-.07],[.08,.35,-.04],[.035,.30,-.015]]} color={fur} r={.034}/>:<><mesh position={[.04,.06,-.045]} rotation={[.4,0,0]} castShadow><torusGeometry args={[.061,.026,10,28,Math.PI*1.85]}/><meshStandardMaterial color={fur} roughness={.8}/></mesh><Puff at={[.043,.075,-.03]} scale={[.035,.025,.025]} color={cream}/></>}</group>
   <group ref={head} position={[0,.42,.18]} name="pet-head" scale={1.025}>
    <Puff at={[0,.09,.035]} scale={[cat?.175:.18,cat?.16:.175,cat?.16:.16]} color={fur}/>
    {cat?[-1,1].map(sign=><group key={sign}><mesh position={[sign*.108,.235,.015]} rotation={[0,0,-sign*.18]} castShadow><coneGeometry args={[.079,.15,3]}/><meshStandardMaterial color={fur} roughness={.9}/></mesh><mesh position={[sign*.108,.24,.049]} rotation={[0,0,-sign*.18]}><coneGeometry args={[.044,.088,3]}/><meshStandardMaterial color="#bf9284" roughness={.9}/></mesh></group>):[-1,1].map(sign=><Puff key={sign} at={[sign*.17,.11,.01]} scale={[.065,.13,.075]} color={dark} rotation={[0,0,sign*.32]}/>)}
    <group ref={eyes} position={[0,.105,.165]} name="pet-eyes">{[-1,1].map(sign=><group key={sign}><Puff at={[sign*.072,0,0]} scale={[cat?.036:.046,cat?.041:.052,.024]} color={cat?'#9baf82':'#302c26'} gloss/><Puff at={[sign*.072,0,.018]} scale={[cat?.012:.027,.029,.012]} color="#242923" gloss/><Puff at={[sign*.072-.009,.012,.029]} scale={[.011,.013,.007]} color="#faf5e9" gloss/></group>)}</group>
    {[-1,1].map(sign=><Puff key={`cheek-${sign}`} at={[sign*.112,.025,.161]} scale={[.030,.014,.009]} color={cat?'#d5a18e':'#b9907b'}/>)}
    {cat?<>
     {[-1,1].map(sign=><Puff key={sign} at={[sign*.037,.037,.174]} scale={[.052,.037,.036]} color={cream}/>)}<Puff at={[0,.055,.207]} scale={[.018,.012,.010]} color="#ad7770"/><Curve points={[[0,.047,.211],[0,.021,.211],[-.025,.012,.202]]} color={dark} r={.003}/><Curve points={[[0,.021,.211],[.025,.012,.202]]} color={dark} r={.003}/>
     {[-1,1].flatMap(sign=>[-1,0,1].map(i=><Curve key={`${sign}-${i}`} points={[[sign*.042,.029+i*.012,.196],[sign*.10,.03+i*.023,.207],[sign*.155,.038+i*.029,.187]]} color="#bba98c" r={.002}/>))}
     {[-1,0,1].map(i=><Curve key={i} points={[.17,.19,.21].map(y=>[i*.042,y,.035+.16*Math.sqrt(1-(i*.042/.175)**2-((y-.09)/.16)**2)+.003] as V)} color="#9e6b42" r={.004}/>)}
    </>:<>
     <Puff at={[0,.015,.165]} scale={[.115,.087,.065]} color={dark}/>{[-1,1].map(sign=><Puff key={sign} at={[sign*.045,.008,.211]} scale={[.061,.047,.037]} color="#64513f"/>)}<Puff at={[0,.054,.226]} scale={[.044,.029,.025]} color="#242722" gloss/><Puff at={[0,-.033,.221]} scale={[.036,.024,.012]} color="#2c3029"/><Puff at={[0,-.050,.231]} scale={[.023,.027,.009]} color="#bd8c83"/>
     {[-1,1].map(sign=><Curve key={sign} points={[[sign*.025,.192,.152],[sign*.065,.203,.142],[sign*.11,.18,.127]]} color="#8a7255" r={.008}/>)}<Curve points={[[-.07,.225,.082],[0,.238,.102],[.07,.225,.082]]} color="#927958" r={.006}/>
    </>}
   </group>
   <mesh position={[0,.392,.16]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[cat?.131:.14,.015,10,36]}/><meshStandardMaterial color={collarColor} roughness={.8}/></mesh><Puff at={[0,.357,.291]} scale={[.024,.029,.009]} color="#b99a61" gloss/>
  </group>
 </group>
}
