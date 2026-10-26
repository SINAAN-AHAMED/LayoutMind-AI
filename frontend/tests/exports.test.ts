import test from 'node:test'
import assert from 'node:assert/strict'
import {layoutToDXF} from '../src/lib/exportDXF'
import type {LayoutSolution} from '../src/types/layout'
const solution:LayoutSolution={id:'cad',rank:1,room:{widthM:5,lengthM:5,type:'Kitchen'},selectedStyles:['Modern'],prompt:'Kitchen',explanation:'',items:[{id:'c',type:'kitchenCounter',widthM:2,depthM:.6,x:1,z:-.5,y:0,rotationY:Math.PI/2,scale:1,costINR:28000}],metrics:{totalCostINR:28000,budgetINR:50000,budgetCompliancePct:100,spaceUtilizationPct:5,styleAlignmentPct:100,clearanceScorePct:100,comfortIndexPct:100,fitness:1}}
test('DXF uses edited dimensions and the Three.js rotation convention',()=>{
 const dxf=layoutToDXF(solution)
 assert.ok(dxf.endsWith('0\nEOF\n'))
 const records=dxf.split('0\nLINE\n').filter(r=>r.startsWith('8\nFURNITURE\n'))
 assert.equal(records.length,4)
 const starts=records.map(record=>{const match=record.match(/\n10\n([^\n]+)\n20\n([^\n]+)/)!;return [Number(match[1]),Number(match[2])]})
 assert.ok(Math.abs(starts[0][0]-70)<1e-8);assert.ok(Math.abs(starts[0][1]-50)<1e-8)
 assert.ok(Math.abs(starts[1][0]-70)<1e-8);assert.ok(Math.abs(starts[1][1]+150)<1e-8)
})
