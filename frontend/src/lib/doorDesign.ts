import type {RoomType,StyleChip} from '../types/layout'
import {designThemes} from './designThemes'
export const doorKinds=['Flush','Shaker','Panelled','Fluted','Frosted','Glazed','Crittall','French','Louvered'] as const
export type DoorKind=typeof doorKinds[number]
export type DoorOptions={design:DoorKind|'Auto';color?:string;hardware?:'Auto'|'Brass'|'Chrome'|'Black'|'Copper'}
export const doorLabels:Record<DoorKind,string>={Flush:'Flush',Shaker:'Shaker',Panelled:'Raised panels',Fluted:'Vertical flutes',Frosted:'Frosted glass',Glazed:'Clear glass',Crittall:'Steel & glass',French:'French pair',Louvered:'Ventilated'}
export const doorDescriptions:Record<DoorKind,string>={Flush:'Clean, solid leaf',Shaker:'Quiet recessed panels',Panelled:'Classic raised mouldings',Fluted:'Warm vertical detailing',Frosted:'Textured privacy glazing',Glazed:'Light oak and clear glass',Crittall:'Slim metal grid',French:'Twin glazed leaves',Louvered:'Solid privacy slats'}
const defaults:Record<RoomType,Record<StyleChip,DoorKind>>={
 'Living Room':{Modern:'Glazed',Minimal:'Flush',Cozy:'Fluted',Luxury:'Panelled',Compact:'Flush',Bohemian:'Shaker',Industrial:'Crittall',Coastal:'Glazed'},
 Bedroom:{Modern:'Shaker',Minimal:'Flush',Cozy:'Panelled',Luxury:'Panelled',Compact:'Flush',Bohemian:'Fluted',Industrial:'Flush',Coastal:'Shaker'},
 Kitchen:{Modern:'Glazed',Minimal:'Glazed',Cozy:'Shaker',Luxury:'Frosted',Compact:'Glazed',Bohemian:'Louvered',Industrial:'Crittall',Coastal:'Louvered'},
 Bathroom:{Modern:'Frosted',Minimal:'Frosted',Cozy:'Louvered',Luxury:'Frosted',Compact:'Flush',Bohemian:'Louvered',Industrial:'Frosted',Coastal:'Louvered'},
 'Dining Room':{Modern:'French',Minimal:'Shaker',Cozy:'Panelled',Luxury:'French',Compact:'Glazed',Bohemian:'Fluted',Industrial:'Crittall',Coastal:'French'},
 'Home Office':{Modern:'Crittall',Minimal:'Glazed',Cozy:'Shaker',Luxury:'Fluted',Compact:'Flush',Bohemian:'Panelled',Industrial:'Crittall',Coastal:'Frosted'}
}
export function resolveDoor(room:RoomType,style:StyleChip,options?:DoorOptions){
 const p=designThemes[style],kind=options?.design&&options.design!=='Auto'?options.design:defaults[room][style]
 const color=options?.color|| (kind==='Crittall'?'#34413b':room==='Bathroom'?'#e2e3d9':room==='Kitchen'?p.cabinet:style==='Luxury'?'#68503c':p.wood)
 const hardware=options?.hardware&&options.hardware!=='Auto'?options.hardware:style==='Luxury'?'Brass':room==='Bathroom'?'Chrome':kind==='Crittall'?'Black':'Brass'
 const metal={Brass:'#bca16b',Chrome:'#c9d2d0',Black:'#303934',Copper:'#b77958'}[hardware]
 return {kind,color,hardware,metal}
}
