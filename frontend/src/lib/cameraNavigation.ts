import {MOUSE,TOUCH,type Camera,type Vector3} from 'three'

export type CameraDragMode='orbit'|'pan'
export type CameraNavigationHandle={moveVertical:(meters:number)=>void;reset:()=>void}
export type OrbitViewControls={target:Vector3;enabled:boolean;enableDamping:boolean;update:()=>void}

export function cameraBindings(mode:CameraDragMode){return {
 mouseButtons:{LEFT:mode==='pan'?MOUSE.PAN:MOUSE.ROTATE,MIDDLE:MOUSE.DOLLY,RIGHT:MOUSE.PAN},
 touches:{ONE:mode==='pan'?TOUCH.PAN:TOUCH.ROTATE,TWO:TOUCH.DOLLY_PAN},
}}

/** Settle pending orbit/pan inertia before applying an exact view command. */
function settled(controls:OrbitViewControls,change:()=>void){
 const damping=controls.enableDamping
 try{controls.enableDamping=false;controls.update();change();controls.update()}
 finally{controls.enableDamping=damping}
}

/** Translate both eye and focus equally: no furniture, zoom or viewing-angle changes. */
export function moveCameraVertical(camera:Camera,controls:OrbitViewControls,meters:number){
 if(!controls.enabled||!Number.isFinite(meters)||meters===0)return false
 settled(controls,()=>{camera.position.y+=meters;controls.target.y+=meters})
 return true
}

export function resetCameraView(camera:Camera,controls:OrbitViewControls,size:number,topView:boolean,doorWall:'front'|'right'|'back'|'left'='front'){
 if(!controls.enabled||!Number.isFinite(size)||size<=0)return false
 const angle={front:0,right:Math.PI/2,back:Math.PI,left:3*Math.PI/2}[doorWall],x=size*.85,z=size*1.1
 settled(controls,()=>{
  camera.position.set(topView?0:x*Math.cos(angle)+z*Math.sin(angle),topView?size*1.65:size*.85,topView?.001:-x*Math.sin(angle)+z*Math.cos(angle))
  controls.target.set(0,.3,0);camera.lookAt(controls.target)
 })
 return true
}
