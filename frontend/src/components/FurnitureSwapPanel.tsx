import {useEffect,useState} from 'react'
import {motion} from 'framer-motion'
import {X,ArrowLeftRight,Check,LockKeyhole} from 'lucide-react'
import {formatINR} from '../lib/inr'
import type {FurnitureItem,StyleChip} from '../types/layout'
import {furnitureCatalog} from '../three/catalog'
import {variantsFor} from '../lib/furnitureVariants'
import {useStudioStore} from '../store/useStudioStore'

export function FurnitureSwapPanel({items,onSwap,onClose}:{items:FurnitureItem[];onSwap:(id:string,cost:number,label:string,style:StyleChip)=>boolean;onClose:()=>void}){
 const initial=useStudioStore.getState().selectedItemId
 const [id,setId]=useState(items.some(it=>it.id===initial)?initial:items[0]?.id??null)
 const [message,setMessage]=useState('')
 const selected=items.find(it=>it.id===id)??items[0]
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[onClose])
 return <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="swap-overlay" onClick={onClose}>
  <section role="dialog" aria-modal="true" aria-labelledby="swap-title" className="swap-dialog" onClick={e=>e.stopPropagation()} data-lenis-prevent>
   <header><div><span className="swap-eyebrow">THE MATERIAL LIBRARY</span><h2 id="swap-title">Find your favourite.</h2><p>Swap any individual piece. Its position, colour and dimensions stay yours.</p></div><button aria-label="Close furniture swaps" onClick={onClose}><X size={18}/></button></header>
   <div className="swap-body">
    <nav aria-label="Choose furniture to swap">{items.map((item,i)=><button key={item.id} aria-pressed={selected?.id===item.id} onClick={()=>{setId(item.id);setMessage('')}}><span className="swap-number">{String(i+1).padStart(2,'0')}</span><span><strong>{item._swapLabel??furnitureCatalog[item.type].label}</strong><small>{formatINR(item.costINR)}{item.locked?' · Locked':''}</small></span>{item.locked&&<LockKeyhole size={12}/>}</button>)}</nav>
    <div className="swap-options">{selected?<><div className="swap-piece-heading"><ArrowLeftRight size={16}/><h3>{furnitureCatalog[selected.type].label}</h3></div><p className="swap-hint">{selected.locked?'Unlock this piece in Furniture studio to change it.':'Choose a design below. Each option fits the current footprint.'}</p>
     {variantsFor(selected.type).map(variant=>{const active=selected._swapLabel===variant.label;const diff=variant.costINR-selected.costINR;return <button key={variant.label} disabled={selected.locked} className="swap-option" aria-pressed={active} onClick={()=>{if(onSwap(selected.id,variant.costINR,variant.label,variant.style))setMessage(`${variant.label} applied. Undo is available in Furniture studio.`);else setMessage(useStudioStore.getState().editError||'This piece could not be changed.')}}><span><strong>{variant.label}</strong><small>{variant.style} · {variant.isMaterial?'Finish':'Design'} variation</small><span className="swap-price">{formatINR(variant.costINR)} <em>{active?'Current':diff===0?'Same estimate':`${diff>0?'+':'−'}${formatINR(Math.abs(diff))}`}</em></span></span>{active?<Check size={17}/>:<ArrowLeftRight size={16}/>}</button>})}
    </>:<p className="swap-hint">Add a piece in Furniture studio to explore its designs.</p>}</div>
   </div>
   <footer><p role="status">{message||'All prices are planning estimates. Edit individual colours in Furniture studio.'}</p><button onClick={onClose}>Done</button></footer>
  </section>
 </motion.div>
}
