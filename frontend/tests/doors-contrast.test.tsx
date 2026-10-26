import React from 'react'
import test from 'node:test'
import assert from 'node:assert/strict'
import {create} from '@react-three/test-renderer'
import {Box3,Vector3,Mesh,MeshStandardMaterial} from 'three'
import {renderToStaticMarkup} from 'react-dom/server'
import {DoorModel} from '../src/three/DoorModel'
import {DoorControls} from '../src/components/DoorControls'
import {doorKinds,resolveDoor} from '../src/lib/doorDesign'
import {backdropIsDark,surfaceIsDark} from '../src/lib/headerContrast'
import fixture from './fixtures/api-responses.json'
import type {LayoutSolution,RoomType,StyleChip} from '../src/types/layout'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
const styles:StyleChip[]=['Cozy','Minimal','Modern','Luxury','Compact','Bohemian','Industrial','Coastal'],rooms:RoomType[]=['Living Room','Bedroom','Kitchen','Bathroom','Dining Room','Home Office']
test('door defaults reflect room use and style while manual design and finishes win',()=>{
 assert.equal(resolveDoor('Bathroom','Modern').kind,'Frosted');assert.equal(resolveDoor('Home Office','Modern').kind,'Crittall');assert.equal(resolveDoor('Dining Room','Modern').kind,'French')
 assert.ok(new Set(rooms.map(room=>resolveDoor(room,'Modern').kind)).size>=5)
 assert.ok(new Set(styles.map(style=>resolveDoor('Living Room',style).kind)).size>=5)
 const selected=resolveDoor('Bathroom','Luxury',{design:'Fluted',color:'#193e2c',hardware:'Chrome'});assert.equal(selected.kind,'Fluted');assert.equal(selected.color,'#193e2c');assert.equal(selected.hardware,'Chrome')
})
test('all nine real door meshes are distinct, grounded and contained at low and normal heights',async()=>{
 const renderer=await create(<group/>),signatures=new Set<string>()
 try{for(const kind of doorKinds)for(const height of [1.96,2.12]){
  await renderer.update(<DoorModel height={height} roomType="Bedroom" style="Modern" options={{design:kind}}/>)
  const b=new Box3().setFromObject(renderer.scene.instance),size=b.getSize(new Vector3());assert.ok(b.min.y>=-.00001);assert.ok(b.max.y<=height+.00001);assert.ok(size.x<=.94&&b.min.z>=0&&b.max.z<.13)
  assert.ok(renderer.scene.instance.getObjectByName(`door-${kind}`));assert.ok(renderer.scene.instance.getObjectByName('door-handle'))
  if(height===2.12){const meshShapes:string[]=[];renderer.scene.instance.traverse(o=>{const mesh=o as Mesh;if(mesh.isMesh)meshShapes.push(JSON.stringify([mesh.position.toArray(),mesh.geometry.getAttribute('position').count,(mesh.material as MeshStandardMaterial).opacity]))});signatures.add(meshShapes.join('|'))}
 }}finally{await renderer.unmount()}
 assert.equal(signatures.size,doorKinds.length)
})
test('bathroom privacy and hardware are represented by geometry/materials',async()=>{
 const renderer=await create(<DoorModel height={2.12} roomType="Bathroom" style="Modern"/>)
 try{const glass=renderer.scene.instance.getObjectByName('door-privacy-glass') as Mesh;assert.ok(glass);assert.ok((glass.material as MeshStandardMaterial).roughness>.8);assert.ok((glass.material as MeshStandardMaterial).opacity>.8);assert.ok(renderer.scene.instance.getObjectByName('door-privacy-lock'))}finally{await renderer.unmount()}
})
test('door controls expose the automatic room choice, nine designs, colour and hardware',()=>{
 const solution=fixture.Bathroom.solutions[0] as LayoutSolution,html=renderToStaticMarkup(<DoorControls solution={solution}/> )
 assert.match(html,/Follow the room/);assert.match(html,/Door colour/);assert.match(html,/Door hardware/)
 assert.equal((html.match(/class="door-choice /g)??[]).length,9)
})
const pixels=(value:number)=>new Uint8ClampedArray(Array.from({length:24},()=>[value,value,value,255]).flat())
test('title contrast uses rendered luminance and keeps a stable tone near the threshold',()=>{
 assert.equal(surfaceIsDark('#20261c'),true);assert.equal(surfaceIsDark('#faf8f3'),false)
 assert.equal(backdropIsDark(pixels(20)),true);assert.equal(backdropIsDark(pixels(240),true),false)
 assert.equal(backdropIsDark(pixels(125),true),true);assert.equal(backdropIsDark(pixels(125),false),false)
 assert.equal(backdropIsDark(new Uint8ClampedArray([0,0,0,0]),false),false)
 assert.equal(backdropIsDark(new Uint8ClampedArray()),null)
})
