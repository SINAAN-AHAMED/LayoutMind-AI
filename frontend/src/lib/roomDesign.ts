import type {FloorMaterial,WallMaterial,Appearance} from '../store/useStudioStore'
import type {RoomType,StyleChip} from '../types/layout'
import {designThemes} from './designThemes'
export type LightingMode='Auto'|'Warm'|'Neutral'|'Cool'
export type RoomFinish=Appearance&{floorMaterial:FloorMaterial;wallMaterial:WallMaterial;wallColor:string;autoSurfaces:boolean}
export function roomDesign(room:RoomType,style:StyleChip):RoomFinish{
 const p=designThemes[style],lux=style==='Luxury',raw=style==='Industrial',soft=['Cozy','Bohemian','Coastal'].includes(style)
 const floorMaterial=room==='Bathroom'?(lux?'Marble':'Tile'):room==='Kitchen'?(raw?'Concrete':lux?'Marble':'Terrazzo'):raw?'Concrete':lux?'Parquet':'Wood'
 const wallMaterial=room==='Bathroom'?(lux?'Stone':'Ceramic'):room==='Kitchen'?(raw?'Concrete':'Plaster'):lux?'Panel':style==='Bohemian'?'Lime':room==='Bedroom'?'Fabric':room==='Home Office'?'Fluted':'Plaster'
 return {floorMaterial,wallMaterial,wallColor:p.wall,floorColor:room==='Bathroom'||room==='Kitchen'?p.floor:'',groutColor:lux?'#b4a58d':'#c0bbb0',tilePattern:style==='Coastal'?'Subway':soft?'Hexagon':'Square',tileSize:lux?1.1:room==='Bathroom'?.4:.6,cabinetColor:'',countertopColor:'',metalFinish:'Auto',autoSurfaces:true}
}
export function lightingDesign(room:RoomType,style:StyleChip,mode:LightingMode='Auto'){
 const warm=mode==='Warm'||(mode==='Auto'&&['Luxury','Cozy','Bohemian'].includes(style)),cool=mode==='Cool'
 return {color:cool?'#e6f0ff':warm?'#ffe0ad':'#fff5e9',ambient:style==='Luxury'?.46:.62,key:room==='Home Office'||room==='Kitchen'?1.9:1.55,accent:warm?1.6:1.1,fixture:style==='Luxury'?'chandelier':style==='Industrial'?'cage':style==='Modern'||style==='Minimal'||style==='Compact'?'linear':'lantern'}
}
