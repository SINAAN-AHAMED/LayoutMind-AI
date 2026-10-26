import {useCallback,useEffect,useImperativeHandle,type Ref} from 'react'
import {useThree} from '@react-three/fiber'
import {moveCameraVertical,resetCameraView,type CameraNavigationHandle,type OrbitViewControls} from '../lib/cameraNavigation'

export function CameraRig({size,topView,doorWall='front',navigationRef}:{size:number;topView:boolean;doorWall?:'front'|'right'|'back'|'left';navigationRef?:Ref<CameraNavigationHandle>}){
 const {camera,controls}=useThree()
 const orbit=controls as unknown as OrbitViewControls|undefined
 const reset=useCallback(()=>{if(orbit)resetCameraView(camera,orbit,size,topView,doorWall)},[camera,orbit,size,topView,doorWall])
 useImperativeHandle(navigationRef,()=>({moveVertical:meters=>{if(orbit)moveCameraVertical(camera,orbit,meters)},reset}),[camera,orbit,reset])
 useEffect(()=>{
  reset()
 },[reset])
 return null
}
