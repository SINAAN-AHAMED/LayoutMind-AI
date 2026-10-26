import {DoorControls} from './DoorControls'
import {roomDesign,type LightingMode} from '../lib/roomDesign'
import {useState} from 'react'
import {motion} from 'framer-motion'
import {X,Download,RotateCcw} from 'lucide-react'
import {useStudioStore,type FloorMaterial,type WallMaterial,type TilePattern,type MetalFinish} from '../store/useStudioStore'
import type {LayoutSolution,StyleChip} from '../types/layout'
import {designThemes} from '../lib/designThemes'
import {applyRoomStyle} from '../lib/editorOps'
import {exportDXF} from '../lib/exportDXF'
const floors:FloorMaterial[]=['Wood','Parquet','Tile','Marble','Granite','Epoxy','Carpet','Concrete','Terrazzo']
const walls:WallMaterial[]=['Plain','Plaster','Lime','Wallpaper','Textured','Fabric','Panel','Fluted','Stone','Brick','Concrete','Ceramic']
const colors=['#f5f1e7','#ded7c7','#b9aa8e','#8e775d','#5b5145','#293d33','#9baa8e','#8fb1b1','#d0d7ce','#a9755a','#393f3c','#ffffff']
const swatch=(color:string)=>({background:color})
export function GlobalMaterialsPanel({onClose,solution}:{onClose:()=>void;solution?:LayoutSolution}){
 const s=useStudioStore(),[tab,setTab]=useState<'floor'|'walls'|'fixtures'|'doors'|'export'>('floor')
 const style=solution?.selectedStyles[0]??'Modern',palette=designThemes[style]
 const picker=(label:string,color:string,onChange:(v:string)=>void)=><label className="finish-color"><span>{label}</span><input aria-label={label} type="color" value={color} onChange={e=>onChange(e.target.value)}/><code>{color.toUpperCase()}</code></label>
 const tiles=<div className="finish-section"><label>Tile layout</label><div className="finish-grid">{(['Square','Subway','Herringbone','Hexagon'] as TilePattern[]).map(pattern=><button key={pattern} aria-pressed={s.tilePattern===pattern} onClick={()=>s.setAppearance({tilePattern:pattern})}>{pattern}</button>)}</div><label>Tile module · {Math.round(s.tileSize*100)} cm<input aria-label="Tile size" type="range" min=".2" max="1.2" step=".05" value={s.tileSize} onChange={e=>s.setAppearance({tileSize:Number(e.target.value)})}/></label>{picker('Grout color',s.groutColor,v=>s.setAppearance({groutColor:v}))}</div>
 return <motion.aside initial={{opacity:0,x:-15}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-15}} className="finish-panel" aria-label="Room surfaces and finishes" data-lenis-prevent>
  <div className="finish-header"><div><span>THE MATERIAL LIBRARY</span><h2>Surfaces & finishes</h2></div><button aria-label="Close material panel" onClick={onClose}><X size={16}/></button></div>
  <div className="finish-tabs">{(['floor','walls','fixtures','doors','export'] as const).map(value=><button key={value} aria-pressed={tab===value} onClick={()=>setTab(value)}>{value==='export'?'CAD':value}</button>)}</div>
  <div className="finish-body">
   {tab!=='export'&&tab!=='doors'&&<label className="finish-auto"><input type="checkbox" checked={s.autoSurfaces} onChange={e=>{const enabled=e.target.checked;useStudioStore.setState(enabled&&solution?roomDesign(solution.room.type,style):{autoSurfaces:enabled})}}/> Room-aware style defaults</label>}

   {tab==='floor'&&<><div className="finish-section"><label>Floor material</label><div className="finish-grid">{floors.map(value=><button key={value} aria-pressed={s.floorMaterial===value} onClick={()=>s.setFloorMaterial(value)}>{value}</button>)}</div></div>{picker('Floor color',s.floorColor||((s.floorMaterial==='Wood'||s.floorMaterial==='Parquet')?palette.wood:palette.floor),v=>s.setAppearance({floorColor:v}))}<button className="finish-reset" onClick={()=>s.setAppearance({floorColor:''})}><RotateCcw size={12}/> Use the style’s floor color</button>{tiles}</>}
   {tab==='walls'&&<><div className="finish-section"><label>Wall finish</label><div className="finish-grid">{walls.map(value=><button key={value} aria-pressed={s.wallMaterial===value} onClick={()=>s.setWallMaterial(value)}>{value}</button>)}</div></div>{picker('Wall color',s.wallColor,v=>s.setWallColor(v))}<div className="finish-swatches">{colors.map(color=><button key={color} title={color} aria-label={`Wall ${color}`} style={swatch(color)} onClick={()=>s.setWallColor(color)}/>)}</div>{tiles}<label>Wall display<select aria-label="Wall display" value={s.wallView} onChange={e=>useStudioStore.setState({wallView:e.target.value as 'cutaway'|'full'})}><option value="cutaway">Automatic cutaway</option><option value="full">All walls</option></select></label></>}
   {tab==='fixtures'&&<><div className="finish-section"><label>Room palette</label><div className="finish-grid">{(Object.keys(designThemes) as StyleChip[]).map(key=><button key={key} aria-pressed={style===key} onClick={()=>applyRoomStyle(key)}><i style={swatch(designThemes[key].cabinet)}/>{key}</button>)}</div><p>The default furniture finish follows the palette. Pieces styled individually keep their own finish.</p></div><label>Lighting mood<select aria-label="Lighting mood" value={s.lightingMode} onChange={e=>s.setLightingMode(e.target.value as LightingMode)}>{(['Auto','Warm','Neutral','Cool'] as LightingMode[]).map(v=><option key={v}>{v}</option>)}</select></label>{picker('Cabinet color',s.cabinetColor||palette.cabinet,v=>s.setAppearance({cabinetColor:v}))}{picker('Worktop / stone',s.countertopColor||palette.top,v=>s.setAppearance({countertopColor:v}))}<label>Tap & handle finish<select aria-label="Metal finish" value={s.metalFinish} onChange={e=>s.setAppearance({metalFinish:e.target.value as MetalFinish})}>{(['Auto','Brass','Chrome','Black','Copper'] as MetalFinish[]).map(value=><option key={value}>{value}</option>)}</select></label><button className="finish-reset" onClick={()=>s.setAppearance({cabinetColor:'',countertopColor:''})}><RotateCcw size={12}/> Restore style finishes</button></>}
   {tab==='doors'&&solution&&<DoorControls solution={solution}/>}
   {tab==='export'&&<div className="finish-section"><label>Plan drawing</label><h3>Take the plan with you.</h3><p>Export the current furniture outlines, rotations and dimensions as a DXF drawing. Wall-mounted fixtures use their own layer. Drawing units are centimeters.</p><button className="finish-primary" disabled={!solution} onClick={()=>{if(solution)exportDXF(solution)}}><Download size={15}/> Download DXF</button></div>}
  </div>
 </motion.aside>
}
