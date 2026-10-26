import {doorKinds} from './doorDesign'
import {normalizeGuest} from './guestData'
import {z} from 'zod'
import {OptimizeResponseSchema,FurnitureItemSchema,HistoryStepSchema} from './api'
import {normalizePets} from './petData'
import {fitItem} from './layoutGeometry'
import type {OptimizationResult} from '../types/layout'
const color=z.string().regex(/^#[0-9a-f]{6}$/i),tint=z.union([color,z.literal('')])
const floors=z.enum(['Wood','Tile','Carpet','Marble','Granite','Epoxy','Parquet','Concrete','Terrazzo'])
const walls=z.enum(['Plain','Panel','Brick','Wallpaper','Textured','Stone','Concrete','Plaster','Fabric','Ceramic','Fluted','Lime'])
const patterns=z.enum(['Square','Subway','Herringbone','Hexagon']),metals=z.enum(['Auto','Brass','Chrome','Black','Copper'])
const solutionBase=OptimizeResponseSchema.shape.solutions.element,styles=solutionBase.shape.selectedStyles.element
const size=z.number().positive().max(100).nullish().transform(v=>v??undefined)
const storedItem=FurnitureItemSchema.extend({widthM:size,depthM:size,scale:z.number().positive(),costINR:z.number().nonnegative(),y:z.number().nonnegative(),color:color.optional(),locked:z.boolean().optional(),_swapStyle:styles.optional(),_swapLabel:z.string().max(200).optional()})
const storedMetrics=solutionBase.shape.metrics.extend({budgetINR:z.number().positive(),totalCostINR:z.number().nonnegative()})
const door=z.object({design:z.enum(['Auto',...doorKinds]).catch('Auto'),color:tint.optional().catch(''),hardware:z.enum(['Auto','Brass','Chrome','Black','Copper']).catch('Auto')}).optional().catch(undefined)
const storedSolution=solutionBase.extend({door,guest:z.unknown().optional().transform(normalizeGuest),id:z.string().min(1),room:solutionBase.shape.room.extend({lengthM:z.number().min(2).max(15),widthM:z.number().min(2).max(15)}),items:z.array(storedItem).refine(items=>new Set(items.map(it=>it.id)).size===items.length),metrics:storedMetrics,pets:z.unknown().optional().transform(v=>v===undefined?undefined:normalizePets(v)),edited:z.boolean().optional()})
const customization=z.object({autoSurfaces:z.boolean().catch(false),lightingMode:z.enum(['Auto','Warm','Neutral','Cool']).catch('Auto'),floorMaterial:floors.catch('Wood'),wallMaterial:walls.catch('Plain'),wallColor:color.catch('#f5f5f4'),roomHeightM:z.number().min(2).max(5).catch(3.2),floorColor:tint.catch(''),groutColor:color.catch('#bcb6ab'),tilePattern:patterns.catch('Square'),tileSize:z.number().min(.2).max(1.2).catch(.6),cabinetColor:tint.catch(''),countertopColor:tint.catch(''),metalFinish:metals.catch('Auto')})
const storedResult=OptimizeResponseSchema.extend({solutions:z.array(storedSolution).min(1).refine(s=>new Set(s.map(it=>it.id)).size===s.length),history_steps:z.array(HistoryStepSchema.extend({items:z.array(storedItem),metrics:storedMetrics})).optional().default([]),customization:z.unknown().optional().transform(v=>v&&typeof v==='object'&&!Array.isArray(v)?customization.parse(v):undefined)})
export function parseStoredResult(value:unknown):OptimizationResult|undefined{const parsed=storedResult.safeParse(value);return parsed.success?parsed.data as OptimizationResult:undefined}
const preferences={autoSurfaces:z.boolean(),lightingMode:z.enum(['Auto','Warm','Neutral','Cool']),preferredRoomType:solutionBase.shape.room.shape.type.nullable(),preferredLengthM:z.number().min(2).max(15).nullable(),preferredWidthM:z.number().min(2).max(15).nullable(),preferredBudgetINR:z.number().min(20000).max(1000000).nullable(),explicitStyle:z.union([styles,z.literal('')]),addPlants:z.boolean(),addRugs:z.boolean(),theme:z.enum(['dark','light']),prompt:z.string().max(600),floorMaterial:floors,wallMaterial:walls,wallColor:color,roomHeightM:z.number().min(2).max(5),floorColor:tint,groutColor:color,tilePattern:patterns,tileSize:z.number().min(.2).max(1.2),cabinetColor:tint,countertopColor:tint,metalFinish:metals}
/** Whitelist persisted data so corrupt records cannot overwrite store actions. */
export function restoreSession(value:unknown){
 const result:Record<string,unknown>={};if(!value||typeof value!=='object'||Array.isArray(value))return result
 const raw=value as Record<string,unknown>
 for(const [key,schema] of Object.entries(preferences)){if(raw[key]===undefined)continue;const parsed=schema.safeParse(raw[key]);if(parsed.success)result[key]=parsed.data}
 const layout=parseStoredResult(raw.lastResult)
 if(layout){const height=layout.customization?.roomHeightM??(typeof result.roomHeightM==='number'?result.roomHeightM:3.2);result.lastResult={...layout,solutions:layout.solutions.map(sol=>({...sol,items:sol.items.map(it=>fitItem(it,sol.room,height))}))};result.selectedLayoutId=layout.solutions.some(sol=>sol.id===raw.selectedLayoutId)?raw.selectedLayoutId:layout.solutions[0].id}
 return result
}
