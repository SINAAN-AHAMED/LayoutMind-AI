import {parseStoredResult} from './layoutValidation'
import type {OptimizationResult} from '../types/layout'
export type SavedLayout={id:string;name:string;savedAt:string;thumbnail?:string;result:OptimizationResult}
const STORAGE_KEY='roomcraft-saved-layouts'
function entries(strict=false):unknown[]{
 try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return [];const parsed:unknown=JSON.parse(raw);if(!Array.isArray(parsed))throw new Error('Invalid saved layout list');return parsed}
 catch(error){if(strict)throw new Error('Saved layouts could not be read. Existing browser data has been kept intact.',{cause:error});return []}
}
function record(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value)}
export function getSavedLayouts():SavedLayout[]{
 return entries().flatMap(value=>{if(!record(value)||typeof value.id!=='string'||typeof value.name!=='string'||typeof value.savedAt!=='string')return [];const result=parseStoredResult(value.result);return result?[{id:value.id,name:value.name,savedAt:value.savedAt,thumbnail:typeof value.thumbnail==='string'?value.thumbnail:undefined,result}]:[]})
}
function write(list:unknown[]){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(list))}
 catch(error){if(error instanceof DOMException&&error.name==='QuotaExceededError')throw new Error('Browser storage is full. Existing layouts are safe; free storage or remove an unneeded save, then try again.',{cause:error});throw new Error('Browser storage is unavailable. Your existing layouts have not been changed.',{cause:error})}
}
export function saveLayout(name:string,result:OptimizationResult,thumbnail?:string):SavedLayout{
 const valid=parseStoredResult(result);if(!valid)throw new Error('This layout contains invalid or incomplete data and cannot be saved.')
 const label=name.trim();if(!label)throw new Error('Enter a name for this layout.')
 const entry:SavedLayout={id:crypto.randomUUID(),name:label,savedAt:new Date().toISOString(),thumbnail,result:valid}
 // Preserve every existing record, including ones a future version may recover.
 write([entry,...entries(true)]);return entry
}
export function deleteLayout(id:string){const list=entries(true),next=list.filter(value=>!record(value)||value.id!==id);if(next.length===list.length)return false;write(next);return true}
export function renameLayout(id:string,newName:string){const name=newName.trim();if(!name)return false;let found=false;const list=entries(true).map(value=>{if(record(value)&&value.id===id){found=true;return {...value,name}}return value});if(!found)return false;write(list);return true}
