import type {LayoutSolution,StyleChip} from '../types/layout'
import {useStudioStore} from '../store/useStudioStore'
import {lightingDesign} from '../lib/roomDesign'
export function RoomLighting({solution,height}:{solution:LayoutSolution;height:number}){
 const mode=useStudioStore(s=>s.lightingMode),style:StyleChip=solution.selectedStyles[0]??'Modern',d=lightingDesign(solution.room.type,style,mode)
 const size=Math.max(solution.room.widthM,solution.room.lengthM),focus=solution.items.find(i=>i.type==='diningTable'||i.type==='kitchenIsland'),x=focus?.x??0,z=focus?.z??0,fixture=height<2.6?'linear':d.fixture,y=height<2.6?height-.04:height-.38
 const metal=style==='Luxury'?'#b89b65':style==='Industrial'?'#303837':'#8d9b93'
 return <group name={`lighting-${style}`}>
  <ambientLight intensity={d.ambient}/><hemisphereLight args={['#fff8ee','#817965',.5]}/>
  <directionalLight position={[size,size*2,size]} color={d.color} intensity={d.key} castShadow shadow-mapSize={[2048,2048]} shadow-bias={-.0003} shadow-normalBias={.02} shadow-camera-left={-size} shadow-camera-right={size} shadow-camera-top={size} shadow-camera-bottom={-size} shadow-camera-far={size*5}/>
  <directionalLight position={[-size,size,-size]} intensity={.4}/>
  <pointLight position={[x,y-.15,z]} color={d.color} intensity={d.accent*3} distance={size*1.4} decay={2}/>
  <group name={`fixture-${fixture}`} position={[x,y,z]}>
   <mesh position={[0,(height-y)/2,0]}><cylinderGeometry args={[.009,.009,height-y,8]}/><meshStandardMaterial color={metal} metalness={.65}/></mesh>
   {fixture==='chandelier'?<>{[-.32,.32].flatMap(dx=>[-.22,.22].map(dz=><group key={`${dx}:${dz}`} position={[dx,-.08,dz]}><mesh position={[0,.10,0]}><cylinderGeometry args={[.008,.008,.25,8]}/><meshStandardMaterial color={metal} metalness={.8}/></mesh><mesh><sphereGeometry args={[.105,24,16]}/><meshStandardMaterial color="#fff3d9" emissive={d.color} emissiveIntensity={.45} roughness={.18}/></mesh></group>))}<mesh><boxGeometry args={[.8,.025,.025]}/><meshStandardMaterial color={metal} metalness={.8}/></mesh>{[-.32,.32].map(dx=><mesh key={dx} position={[dx,0,0]}><boxGeometry args={[.025,.025,.52]}/><meshStandardMaterial color={metal} metalness={.8}/></mesh>)}</>:
    fixture==='linear'?<><mesh><boxGeometry args={[.95,.045,.085]}/><meshStandardMaterial color={metal} metalness={.5}/></mesh><mesh position={[0,-.025,0]}><boxGeometry args={[.9,.008,.065]}/><meshStandardMaterial color="#fff8e9" emissive={d.color} emissiveIntensity={.65}/></mesh></>:
    <group><mesh><sphereGeometry args={[.23,24,16]}/><meshStandardMaterial color={fixture==='cage'?'#e6b975':'#f0dfbd'} wireframe={fixture==='cage'} roughness={.85}/></mesh><mesh><sphereGeometry args={[.065,16,12]}/><meshStandardMaterial color="#fff4dc" emissive={d.color} emissiveIntensity={.8}/></mesh></group>}
  </group>
 </group>
}
