import type {CameraDragMode} from '../lib/cameraNavigation'

export function CameraPanel({mode,onMode,topView,onTopView,onMove,onReset,onClose}:{mode:CameraDragMode;onMode:(mode:CameraDragMode)=>void;topView:boolean;onTopView:()=>void;onMove:(meters:number)=>void;onReset:()=>void;onClose:()=>void}){
 return <aside id="camera-view-panel" className="workspace-camera-flyout" aria-label="Camera controls" data-lenis-prevent onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();onClose()}}}>
  <header><div><span>YOUR VIEWPOINT</span><h2>Camera</h2></div><button onClick={onClose} aria-label="Close camera controls">×</button></header>
  <div className="camera-modes" role="group" aria-label="Camera drag mode">
   <button aria-pressed={mode==='orbit'} onClick={()=>onMode('orbit')}>Orbit</button>
   <button aria-pressed={mode==='pan'} onClick={()=>onMode('pan')}>Pan</button>
  </div>
  <p>{mode==='pan'?'Drag the room view to move it freely.':'Drag to orbit. Right-drag to pan.'} Pinch or scroll to zoom.</p>
  <span className="camera-control-label">Move camera vertically</span>
  <div className="camera-height-buttons">
   <button aria-label="Move camera up" title="Raise camera and focus by 25 cm" onClick={()=>onMove(.25)}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20V4m-6 6 6-6 6 6"/></svg>Up</button>
   <button aria-label="Move camera down" title="Lower camera and focus by 25 cm" onClick={()=>onMove(-.25)}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4v16m-6-6 6 6 6-6"/></svg>Down</button>
  </div>
  <div className="camera-view-buttons"><button onClick={onTopView}>{topView?'3D view':'Top view'}</button><button onClick={onReset}>Reset view</button></div>
  <p className="camera-help">Up / Down moves 25 cm at a time. Two fingers pan and pinch on touchscreens. In Pan mode, one finger moves the view.</p>
 </aside>
}
