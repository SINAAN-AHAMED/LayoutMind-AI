import type {LayoutSolution} from '../types/layout'
import {doorKinds,doorLabels,doorDescriptions,resolveDoor,type DoorOptions} from '../lib/doorDesign'
import {editDoor} from '../lib/editorOps'
export function DoorControls({solution}:{solution:LayoutSolution}){
 const selected=solution.door?.design??'Auto',current=resolveDoor(solution.room.type,solution.selectedStyles[0]??'Modern',solution.door)
 return <div className="door-controls"><p className="door-intro">A doorway with its own character.</p><button className="door-auto" aria-pressed={selected==='Auto'} onClick={()=>editDoor({design:'Auto'})}><strong>Follow the room & style</strong><span>{solution.room.type} · {doorLabels[current.kind]}</span></button>
  <div className="door-grid">{doorKinds.map(kind=><button key={kind} className={`door-choice door-choice-${kind}`} aria-pressed={selected===kind} onClick={()=>editDoor({design:kind})}><span className="door-line-preview" aria-hidden="true"><i/><b/></span><span><strong>{doorLabels[kind]}</strong><small>{doorDescriptions[kind]}</small></span></button>)}</div>
  <label className="finish-color"><span>Door colour</span><input aria-label="Door colour" type="color" value={current.color} onChange={e=>editDoor({color:e.target.value})}/><code>{current.color.toUpperCase()}</code></label>
  <button className="finish-reset" onClick={()=>editDoor({color:''})}>Use the style’s door colour</button>
  <label>Hardware<select aria-label="Door hardware" value={solution.door?.hardware??'Auto'} onChange={e=>editDoor({hardware:e.target.value as DoorOptions['hardware']})}>{(['Auto','Brass','Chrome','Black','Copper'] as const).map(value=><option key={value}>{value}</option>)}</select></label>
  <p>Every design fits the existing doorway. Orbit to face the door and inspect its detail. Your choice is saved with this layout and supports undo.</p>
 </div>
}
