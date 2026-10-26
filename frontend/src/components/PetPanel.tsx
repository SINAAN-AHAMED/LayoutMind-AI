import {AIRA_LOOKS,guestOutfitViews} from '../lib/guestViews'
import {APP_BUILD} from '../lib/buildInfo'
import {inviteGuest,removeGuest,editGuest} from '../lib/guestOps'
import {editorKeyBlocked} from '../lib/keyboard'
import {useState,useEffect} from 'react'
import {motion} from 'framer-motion'
import {X,Pause,Play,PawPrint,Trash2,ArrowUpRight} from 'lucide-react'
import type {LayoutSolution,PetKind,FurnitureType} from '../types/layout'
import {useStudioStore} from '../store/useStudioStore'
import {addPet,editPet,removePet} from '../lib/petOps'
import {addItem,removeItem,undoRedo} from '../lib/editorOps'
import {PET_FURNITURE_TYPES} from '../lib/petData'
import {MAX_PETS} from '../lib/petNavigation'
import {PET_DRAG_MIME} from '../lib/petDrop'
import {furnitureCatalog} from '../three/catalog'
import {formatINR} from '../lib/inr'
import {PetPortrait} from './PetPortrait'
type Tab='pets'|'accessories'|'aira'
export function PetPanel({solution,onClose,initialTab='pets'}:{solution:LayoutSolution;onClose:()=>void;initialTab?:Tab}){
 const s=useStudioStore(),[tab,setTab]=useState<Tab>(initialTab),pets=solution.pets??[],selected=pets.find(p=>p.id===s.selectedPetId)
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(editorKeyBlocked(e))return;if(e.key==='Escape')onClose();else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undoRedo(e.shiftKey)}else if(tab==='pets'&&selected&&(e.key==='Delete'||e.key==='Backspace')){e.preventDefault();removePet(selected.id)}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[onClose,selected,tab])
 const editFurniture=(id:string)=>useStudioStore.setState({petPanelOpen:false,selectedPetId:null,selectedItemId:id,dragMode:true,sidebarOpen:false})
 const drag=(e:React.DragEvent,data:{pet:PetKind}|{furniture:FurnitureType})=>{e.dataTransfer.setData(PET_DRAG_MIME,JSON.stringify(data));e.dataTransfer.effectAllowed='copy'}
 return <motion.aside initial={{opacity:0,x:14}} animate={{opacity:1,x:0}} exit={{opacity:0,x:14}} className="pet-panel" aria-label="Companions" data-lenis-prevent>
  <header><div><span>MAKE ROOM FOR COMPANY</span><h2>Companions</h2></div><button aria-label="Close companions" onClick={onClose}><X size={17}/></button></header>
  <nav className="pet-tabs" aria-label="Companion sections">{(['pets','accessories','aira'] as const).map(key=><button key={key} aria-pressed={tab===key} aria-controls={`companion-${key}`} onClick={()=>setTab(key)}>{key==='aira'?'Aira':key==='pets'?'Pets':'Accessories'}</button>)}</nav>
  <div className="pet-panel-body" id={`companion-${tab}`}>
   {tab==='pets'&&<>
    <p className="pet-caption">Choose a portrait to invite, or drag it onto the floor.</p>
    <div className="pet-choices">{(['cat','pug'] as PetKind[]).map(kind=><button type="button" className="pet-choice" key={kind} aria-label={`Invite ${kind==='cat'?'cat':'pug'}`} disabled={pets.length>=MAX_PETS} draggable={pets.length<MAX_PETS} onDragStart={e=>drag(e,{pet:kind})} onClick={()=>addPet(kind)}><PetPortrait kind={kind}/><span className="pet-choice-label"><span>{kind==='cat'?'Cat':'Pug'}</span><span>Invite</span></span></button>)}</div>
    {pets.length>0&&<><div className="pet-section-heading"><h3>Your companions <span>{pets.length}/{MAX_PETS}</span></h3><button aria-label={s.petsPaused?'Resume all pets':'Pause all pets'} onClick={()=>useStudioStore.setState({petsPaused:!s.petsPaused})}>{s.petsPaused?<Play size={13}/>:<Pause size={13}/>}</button></div>
     <div className="pet-list">{pets.map(pet=><button key={pet.id} aria-pressed={pet.id===selected?.id} onClick={()=>useStudioStore.setState({selectedPetId:pet.id,selectedItemId:null})}><PawPrint size={14}/><span>{pet.name}<small>{pet.kind==='cat'?'Chubby cat':'Pug'} · {s.petsPaused?'Paused':pet.roaming?'Roaming':'Staying'}</small></span><i style={{background:pet.collarColor}}/></button>)}</div>
    </>}
    {selected&&<div className="pet-inspector"><label>Name<input key={`${selected.id}:${selected.name}`} aria-label="Pet name" defaultValue={selected.name} maxLength={32} onBlur={e=>editPet(selected.id,{name:e.target.value})} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}/></label><div className="pet-inspector-row"><label>Collar<input aria-label="Pet collar colour" type="color" value={selected.collarColor} onChange={e=>editPet(selected.id,{collarColor:e.target.value})}/></label><button aria-pressed={selected.roaming} onClick={()=>editPet(selected.id,{roaming:!selected.roaming})}>{selected.roaming?<Pause size={12}/>:<Play size={12}/>} {selected.roaming?'Stay here':'Let roam'}</button><button aria-label={`Remove ${selected.name}`} onClick={()=>removePet(selected.id)}><Trash2 size={13}/></button></div><p className="pet-caption">Drag this pet to reposition it. Click clear floor to call it over.</p></div>}

    {!pets.length&&<p className="pet-empty">A cosy home deserves a little company.</p>}
   </>}
   {tab==='accessories'&&<>
    <p className="pet-caption">Drag an accessory into the room, or add it to the nearest clear space.</p>
    <div className="pet-accessories">{PET_FURNITURE_TYPES.map(type=>{const spec=furnitureCatalog[type];return <div className="pet-accessory" key={type} draggable onDragStart={e=>drag(e,{furniture:type})}><span className="pet-accessory-icon"><PawPrint size={19}/></span><span><strong>{spec.label}</strong><small>{formatINR(spec.costINR)} · estimate</small></span><button aria-label={`Add ${spec.label}`} onClick={()=>addItem(type)}>Add</button></div>})}</div>
    {solution.items.some(it=>PET_FURNITURE_TYPES.includes(it.type))&&<><h3 className="pet-owned-heading">In this room</h3>{solution.items.filter(it=>PET_FURNITURE_TYPES.includes(it.type)).map(it=><div key={it.id} className="pet-owned"><span>{it._swapLabel??furnitureCatalog[it.type].label}</span><button aria-label={`Edit ${furnitureCatalog[it.type].label}`} onClick={()=>editFurniture(it.id)}><ArrowUpRight size={14}/></button><button disabled={it.locked} aria-label={`Remove ${furnitureCatalog[it.type].label}`} onClick={()=>removeItem(it.id)}><Trash2 size={13}/></button></div>)}</>}
    <p className="pet-caption">Accessories use the furniture editor for colour, rotation, size and removal. Pets visit nearby to sniff or rest.</p>
   </>}
   {tab==='aira'&&<section className="aira-panel" aria-label="Aira illustrated companion">
    <p className="pet-caption">An optional guest, with a little JRPG charm.</p>
    <div className="aira-heading"><h3>Aira</h3><span>ILLUSTRATED GUEST</span></div>
    <button className="aira-invite" onClick={solution.guest?removeGuest:inviteGuest}>{solution.guest?'Remove Aira':'Invite Aira'}</button>
    <div className="aira-preview"><img src={`${import.meta.env?.BASE_URL??'/'}${guestOutfitViews(solution.guest?.outfit)[0].url}`} alt="Aira, original illustrated character"/></div>
    {solution.guest&&<><label>Outfit<select aria-label="Aira outfit" value={solution.guest.outfit??'classic'} onChange={e=>editGuest({outfit:e.target.value as 'classic'|'eva'})}><option value="classic">Classic</option><option value="eva">Eva suit</option></select></label><label>Height · {solution.guest.heightM.toFixed(2)} m<input aria-label="Guest height" type="range" min="1.4" max="2" step=".02" value={solution.guest.heightM} onChange={e=>editGuest({heightM:Number(e.target.value)})}/></label><label>Look<select aria-label="Aira illustrated look" value={solution.guest.portrait??'auto'} onChange={e=>editGuest({portrait:e.target.value==='auto'?undefined:Number(e.target.value)})}><option value="auto">Camera views · automatic</option>{AIRA_LOOKS.map((name,i)=><option key={name} value={i}>{name}</option>)}</select></label><p className="pet-caption">Drag to move. She stays upright as you orbit and zoom; eight illustrations follow your viewing direction.</p></>}
   </section>}
   {s.petError&&<p role="alert" className="pet-notice">{s.petError}</p>}
   <div className="pet-footer"><button disabled={!s.undoStack.length} onClick={()=>undoRedo()}>↶ Undo</button><button disabled={!s.redoStack.length} onClick={()=>undoRedo(true)}>↷ Redo</button><span>Saved with your layout</span></div>
  </div><div className="companion-build">Studio {APP_BUILD}</div>
 </motion.aside>
}
