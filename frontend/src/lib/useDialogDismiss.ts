import {useEffect} from 'react'
export function useDialogDismiss(onClose:()=>void){
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();onClose()}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[onClose])
}
