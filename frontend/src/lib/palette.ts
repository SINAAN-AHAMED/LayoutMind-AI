import type {RoomFinish} from './roomDesign'
export type PaletteState=Pick<RoomFinish,'wallColor'|'floorColor'|'cabinetColor'|'countertopColor'>&Partial<RoomFinish>
export function capturePalette(state:RoomFinish):PaletteState{return {wallColor:state.wallColor,floorColor:state.floorColor,cabinetColor:state.cabinetColor,countertopColor:state.countertopColor,floorMaterial:state.floorMaterial,wallMaterial:state.wallMaterial,groutColor:state.groutColor,tilePattern:state.tilePattern,tileSize:state.tileSize,metalFinish:state.metalFinish,autoSurfaces:state.autoSurfaces}}
