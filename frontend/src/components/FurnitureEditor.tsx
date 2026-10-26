import {useEffect,useState} from 'react'
import type {FurnitureType,LayoutSolution,StyleChip} from '../types/layout'
import {useStudioStore} from '../store/useStudioStore'
import {furnitureCatalog} from '../three/catalog'
import {overlaps} from '../lib/layoutGeometry'
import {editorKeyBlocked} from '../lib/keyboard'
import {editItem,addItem,duplicateItem,removeItem,undoRedo} from '../lib/editorOps'
export function FurnitureEditor({solution}:{solution:LayoutSolution}){
 const s=useStudioStore(),[type,setType]=useState<FurnitureType>('diningChair'),item=solution.items.find(it=>it.id===s.selectedItemId)
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{
  if(editorKeyBlocked(e))return
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undoRedo(e.shiftKey)}
  else if(item&&!item.locked&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const step=e.shiftKey?.20:.05;editItem(item.id,{x:item.x+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),z:item.z+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)})}
  else if(e.key==='Escape')useStudioStore.setState({selectedItemId:null})
  else if(item&&!item.locked&&e.key.toLowerCase()==='r')editItem(item.id,{rotationY:item.rotationY+Math.PI/12})
  else if(item&&(e.key==='Delete'||e.key==='Backspace')){e.preventDefault();removeItem(item.id)}
 };window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[item])
 return <aside className="furniture-editor" aria-label="Furniture editor" data-lenis-prevent>
  <div className="editor-heading"><div><span>MAKE IT YOURS</span><h2>Furniture studio</h2></div><button onClick={s.toggleDragMode} aria-label="Close furniture editor">×</button></div>
  <div className="editor-row"><button disabled={!s.undoStack.length} onClick={()=>undoRedo()}>↶ Undo</button><button disabled={!s.redoStack.length} onClick={()=>undoRedo(true)}>↷ Redo</button><button onClick={()=>useStudioStore.setState({topView:!s.topView})}>{s.topView?'3D view':'Top view'}</button></div>
  <label>Select a piece<select aria-label="Select furniture" value={item?.id??''} onChange={e=>useStudioStore.setState({selectedItemId:e.target.value||null})}><option value="">Click furniture in the room</option>{solution.items.map((it,i)=><option key={it.id} value={it.id}>{it._swapLabel??furnitureCatalog[it.type].label} {i+1}{it.locked?' · Locked':''}</option>)}</select></label>
  {item&&<>
   <div className="editor-row"><button aria-pressed={s.transformMode==='translate'} onClick={()=>useStudioStore.setState({transformMode:'translate'})}>Move</button><button aria-pressed={s.transformMode==='rotate'} onClick={()=>useStudioStore.setState({transformMode:'rotate'})}>Rotate</button><button onClick={()=>editItem(item.id,{locked:!item.locked})}>{item.locked?'Unlock':'Lock'}</button></div>
   <label>Rotation · {Math.round(item.rotationY*180/Math.PI)}°<input aria-label="Furniture rotation" type="range" min="0" max="360" step={s.snapToGrid?5:1} disabled={item.locked} value={Math.round(item.rotationY*180/Math.PI)} onChange={e=>editItem(item.id,{rotationY:Number(e.target.value)*Math.PI/180})}/></label>
   <div className="editor-row"><button disabled={item.locked} onClick={()=>editItem(item.id,{rotationY:item.rotationY-Math.PI/2})}>−90°</button><button disabled={item.locked} onClick={()=>editItem(item.id,{rotationY:item.rotationY+Math.PI/2})}>+90°</button></div>
   <label>Size · {Math.round(item.scale*100)}%<input aria-label="Furniture size" type="range" min=".5" max="1.5" step=".05" value={item.scale} disabled={item.locked} onChange={e=>editItem(item.id,{scale:Number(e.target.value)})}/></label>
   <div className="editor-row">{(['x','z'] as const).map(axis=><label key={axis}>{axis.toUpperCase()} · meters<input aria-label={`Furniture ${axis}`} type="number" step=".05" disabled={item.locked} value={Number(item[axis].toFixed(2))} onChange={e=>{if(e.target.value!=='')editItem(item.id,{[axis]:Number(e.target.value)})}}/></label>)}</div>
   <div className="editor-row">{(['widthM','depthM'] as const).map(axis=><label key={axis}>{axis==='widthM'?'Width':'Depth'} · m<input aria-label={`Furniture ${axis}`} type="number" min={Math.min(axis==='widthM'?.25:.2,furnitureCatalog[item.type].targetSizeM[axis==='widthM'?'x':'z'])} max="15" step={furnitureCatalog[item.type].targetSizeM[axis==='widthM'?'x':'z']<.25?.01:.05} disabled={item.locked} value={Number((item[axis]??furnitureCatalog[item.type].targetSizeM[axis==='widthM'?'x':'z']).toFixed(2))} onChange={e=>{if(e.target.value)editItem(item.id,{[axis]:Number(e.target.value)})}}/></label>)}</div>
   {item.type==='diningTable'&&<label className="editor-check"><input type="checkbox" checked={s.moveLinked} onChange={()=>useStudioStore.setState({moveLinked:!s.moveLinked})}/> Move and rotate chairs with the table</label>}
   {furnitureCatalog[item.type].mountY>0&&<label>Mount / surface height · m<input aria-label="Mounting height" type="number" min="0" max={s.roomHeightM} step=".05" disabled={item.locked} value={Number(item.y.toFixed(2))} onChange={e=>{if(e.target.value)editItem(item.id,{y:Number(e.target.value)})}}/></label>}
   <label>Finish style<select aria-label="Furniture style" disabled={item.locked} value={item._swapStyle??solution.selectedStyles[0]??'Modern'} onChange={e=>editItem(item.id,{_swapStyle:e.target.value as StyleChip})}>{['Modern','Cozy','Minimal','Luxury','Compact','Bohemian','Industrial','Coastal'].map(v=><option key={v}>{v}</option>)}</select></label>
   <div className="editor-row"><label>Custom tint<input aria-label="Furniture color" type="color" value={item.color??'#c9a96e'} disabled={item.locked} onChange={e=>editItem(item.id,{color:e.target.value})}/></label><button disabled={item.locked} onClick={()=>editItem(item.id,{color:undefined})}>Reset tint</button></div>
   <div className="editor-row"><button onClick={()=>duplicateItem(item.id)}>Duplicate</button><button disabled={item.locked} onClick={()=>removeItem(item.id)}>Delete</button></div>
   {solution.items.some(it=>it.id!==item.id&&overlaps(item,it,0))&&<p role="status" className="editor-notice">This piece overlaps another item. Move it to leave clear floor space.</p>}
  </>}
  <hr/><label>Add furniture or fixtures<select aria-label="Furniture catalog" value={type} onChange={e=>setType(e.target.value as FurnitureType)}>{Object.values(furnitureCatalog).sort((a,b)=>Number(b.room===solution.room.type)-Number(a.room===solution.room.type)).map(it=><option key={it.type} value={it.type}>{it.label} · ₹{it.costINR.toLocaleString('en-IN')}</option>)}</select></label>
  <button className="editor-add" onClick={()=>addItem(type)}>＋ Add to room</button>
  <label className="editor-check"><input type="checkbox" checked={s.snapToGrid} onChange={()=>useStudioStore.setState({snapToGrid:!s.snapToGrid})}/> Snap to 5 cm / 5°</label>
  <label className="editor-check"><input type="checkbox" checked={s.avoidCollisions} onChange={()=>useStudioStore.setState({avoidCollisions:!s.avoidCollisions})}/> Prevent overlaps and keep entry clear</label>
  <button onClick={()=>useStudioStore.setState({wallView:s.wallView==='cutaway'?'full':'cutaway'})}>{s.wallView==='cutaway'?'Show all walls':'Automatic wall cutaway'}</button>
  {s.editError&&<p role="alert" className="editor-notice">{s.editError}</p>}
  <p className="editor-help">Drag arrows to move or the ring to rotate. Arrow keys slide 5 cm (Shift: 20 cm). R rotates 15°. Delete removes. Ctrl/⌘ Z undoes. Furniture stays inside the walls.</p>
 </aside>
}
