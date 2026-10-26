import {useSyncExternalStore} from 'react'
import type {StateStorage} from 'zustand/middleware'
let notice=''
const listeners=new Set<()=>void>()
function report(failed:boolean){const next=failed?'This room could not be auto-saved. Keep this tab open and free browser storage before reloading.':'';if(next!==notice){notice=next;for(const listener of listeners)listener()}}
export const sessionStorage:StateStorage={
 getItem(name){try{return typeof localStorage==='undefined'?null:localStorage.getItem(name)}catch{report(true);return null}},
 setItem(name,value){try{if(typeof localStorage==='undefined')return;localStorage.setItem(name,value);report(false)}catch{report(true)}},
 removeItem(name){try{if(typeof localStorage==='undefined')return;localStorage.removeItem(name);report(false)}catch{report(true)}}
}
export const getStorageNotice=()=>notice
export function useStorageNotice(){return useSyncExternalStore(listener=>{listeners.add(listener);return()=>listeners.delete(listener)},getStorageNotice,()=> '')}
