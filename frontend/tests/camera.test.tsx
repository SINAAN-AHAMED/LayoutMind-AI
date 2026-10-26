import React,{createRef,useLayoutEffect} from 'react'
import test from 'node:test'
import assert from 'node:assert/strict'
import {renderToStaticMarkup} from 'react-dom/server'
import {PerspectiveCamera,MOUSE,TOUCH,Vector3} from 'three'
import {OrbitControls} from 'three-stdlib'
import {cameraBindings,moveCameraVertical,resetCameraView} from '../src/lib/cameraNavigation'
import {CameraPanel} from '../src/components/CameraPanel'
import {CameraRig} from '../src/three/CameraRig'
import type {CameraNavigationHandle} from '../src/lib/cameraNavigation'
import {useThree} from '@react-three/fiber'
import {create,act} from '@react-three/test-renderer'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})

test('camera up/down preserves direction, orbit distance and zoom at varied views',()=>{
 for(const distance of [2.5,10])for(const elevation of [.1,.7,1.4])for(let azimuth=0;azimuth<Math.PI*2;azimuth+=Math.PI/4){
  const camera=new PerspectiveCamera(42,1.5,.1,150),controls=new OrbitControls(camera)
  camera.position.set(distance*Math.sin(elevation)*Math.cos(azimuth),distance*Math.cos(elevation),distance*Math.sin(elevation)*Math.sin(azimuth))
  controls.target.set(.2,.3,-.1);controls.enableDamping=true;controls.update()
  const eye=camera.position.clone(),target=controls.target.clone(),offset=eye.clone().sub(target),direction=camera.getWorldDirection(new Vector3()),zoom=camera.zoom
  assert.ok(moveCameraVertical(camera,controls,.25))
  assert.ok(camera.position.distanceTo(eye.clone().add(new Vector3(0,.25,0)))<1e-10)
  assert.ok(controls.target.distanceTo(target.clone().add(new Vector3(0,.25,0)))<1e-10)
  assert.ok(camera.position.clone().sub(controls.target).distanceTo(offset)<1e-10)
  assert.ok(camera.getWorldDirection(new Vector3()).distanceTo(direction)<1e-10);assert.equal(camera.zoom,zoom);assert.equal(controls.enableDamping,true)
  moveCameraVertical(camera,controls,-.25);assert.ok(camera.position.distanceTo(eye)<1e-10);assert.ok(controls.target.distanceTo(target)<1e-10)
  controls.dispose()
 }
})

test('disabled camera commands and invalid distances do not move the view',()=>{
 const camera=new PerspectiveCamera(),controls=new OrbitControls(camera);camera.position.set(4,3,5);controls.update()
 const eye=camera.position.clone(),target=controls.target.clone()
 for(const distance of [NaN,Infinity,-Infinity,0])assert.equal(moveCameraVertical(camera,controls,distance),false)
 controls.enabled=false;assert.equal(moveCameraVertical(camera,controls,1),false);assert.equal(resetCameraView(camera,controls,5,false),false)
 assert.ok(camera.position.equals(eye));assert.ok(controls.target.equals(target));controls.dispose()
})

test('reset restores the room-facing 3D and top views after panning and orbiting',()=>{
 for(const size of [2,6,15])for(const wall of ['front','right','back','left'] as const)for(const top of [false,true]){
  const camera=new PerspectiveCamera(42,1,.1,150),controls=new OrbitControls(camera);controls.maxPolarAngle=Math.PI/2.05;controls.enableDamping=true
  camera.position.set(3,4,5);controls.update();assert.ok(resetCameraView(camera,controls,size,top,wall))
  const home=camera.position.clone(),direction=camera.getWorldDirection(new Vector3())
  assert.ok(controls.target.distanceTo(new Vector3(0,.3,0))<1e-10)
  if(top){assert.ok(Math.abs(home.x)<1e-8);assert.ok(Math.abs(home.y-size*1.65)<1e-8)}
  else{assert.ok(Math.abs(home.y-size*.85)<1e-8);assert.ok(Math.abs(Math.hypot(home.x,home.z)-Math.hypot(size*.85,size*1.1))<1e-8)}
  moveCameraVertical(camera,controls,3);controls.setAzimuthalAngle(.7);controls.setPolarAngle(.6)
  resetCameraView(camera,controls,size,top,wall)
  assert.ok(camera.position.distanceTo(home)<1e-8);assert.ok(camera.getWorldDirection(new Vector3()).distanceTo(direction)<1e-8)
  assert.equal(controls.enableDamping,true);controls.dispose()
 }
})

test('pan mode maps primary mouse/touch drags to pan and retains pinch zoom',()=>{
 assert.equal(cameraBindings('orbit').mouseButtons.LEFT,MOUSE.ROTATE)
 assert.equal(cameraBindings('pan').mouseButtons.LEFT,MOUSE.PAN)
 for(const mode of ['orbit','pan'] as const){const b=cameraBindings(mode);assert.equal(b.mouseButtons.RIGHT,MOUSE.PAN);assert.equal(b.mouseButtons.MIDDLE,MOUSE.DOLLY);assert.equal(b.touches.TWO,TOUCH.DOLLY_PAN)}
 assert.equal(cameraBindings('pan').touches.ONE,TOUCH.PAN);assert.equal(cameraBindings('orbit').touches.ONE,TOUCH.ROTATE)
})

test('camera panel routes up/down, mode, reset, top-view and close commands',()=>{
 const moves:number[]=[],modes:string[]=[];let resets=0,tops=0,closes=0
 const panel=CameraPanel({mode:'orbit',onMode:m=>modes.push(m),topView:false,onTopView:()=>tops++,onMove:m=>moves.push(m),onReset:()=>resets++,onClose:()=>closes++})
 type Props={children?:React.ReactNode;onClick?:()=>void;'aria-label'?:string}
 const buttons:React.ReactElement<Props>[]=[]
 const walk=(node:React.ReactNode)=>React.Children.forEach(node,child=>{if(React.isValidElement<Props>(child)){if(child.type==='button')buttons.push(child);walk(child.props.children)}})
 walk(panel)
 const click=(label:string)=>{const button=buttons.find(b=>b.props['aria-label']===label||b.props.children===label);assert.ok(button,label);button.props.onClick!()}
 click('Move camera up');click('Move camera down');click('Pan');click('Orbit');click('Top view');click('Reset view');click('Close camera controls')
 assert.deepEqual(moves,[.25,-.25]);assert.deepEqual(modes,['pan','orbit']);assert.equal(resets,1);assert.equal(tops,1);assert.equal(closes,1)
 const html=renderToStaticMarkup(panel);assert.match(html,/aria-label="Camera controls"/);assert.match(html,/aria-pressed="true">Orbit/);assert.doesNotMatch(html,/Furniture elevation/)
})

test('mounted camera rig exposes live commands, keeps panning across rerenders and cleans up',async()=>{
 const handle=createRef<CameraNavigationHandle>();let controls:OrbitControls|undefined,camera:PerspectiveCamera|undefined
 function Scene({top=false}:{top?:boolean}){
  const sceneCamera=useThree(s=>s.camera),set=useThree(s=>s.set)
  useLayoutEffect(()=>{
   camera=sceneCamera as PerspectiveCamera;controls=new OrbitControls(camera);controls.enableDamping=true
   set({controls});return()=>{controls?.dispose();set({controls:null})}
  },[sceneCamera,set])
  return <CameraRig size={6} topView={top} doorWall="left" navigationRef={handle}/>
 }
 const renderer=await create(<Scene/>)
 try{
  assert.ok(handle.current);assert.ok(camera);assert.ok(controls)
  const eye=camera.position.clone();await act(async()=>handle.current!.moveVertical(.25))
  assert.ok(camera.position.distanceTo(eye.clone().add(new Vector3(0,.25,0)))<1e-8)
  await renderer.update(<Scene/>);assert.ok(camera.position.distanceTo(eye.clone().add(new Vector3(0,.25,0)))<1e-8)
  controls.enabled=false;await act(async()=>handle.current!.moveVertical(1));assert.equal(controls.target.y,.55)
  controls.enabled=true;await act(async()=>handle.current!.reset());assert.ok(camera.position.distanceTo(eye)<1e-8)
  await renderer.update(<Scene top/>);assert.ok(Math.abs(camera.position.x)<1e-8);assert.ok(Math.abs(camera.position.y-9.9)<1e-8)
 }finally{await renderer.unmount()}
 assert.equal(handle.current,null)
})
