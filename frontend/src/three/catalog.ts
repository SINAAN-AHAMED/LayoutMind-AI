import data from '../../../softcomputing-service/catalog.json'
import type { FurnitureType } from '../types/layout'
export type FurnitureSpec = {type:FurnitureType;label:string;targetSizeM:{x:number;z:number;y:number};costINR:number;room:string;mountY:number;wallAnchored:boolean;collisionHeightM?:number}
/** Shared with the engine. Every asset's front points along local +Z. */
export const furnitureCatalog = data as Record<FurnitureType,FurnitureSpec>
