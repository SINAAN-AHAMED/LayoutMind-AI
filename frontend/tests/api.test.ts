import test from 'node:test'
import assert from 'node:assert/strict'
import fixtures from './fixtures/api-responses.json'
import {OptimizeResponseSchema} from '../src/lib/api'
for(const [room,response] of Object.entries(fixtures))test(`${room}: engine responses survive frontend validation`,()=>{
 const parsed=OptimizeResponseSchema.parse(response)
 assert.equal(parsed.solutions.length,3);assert.equal(parsed.solutions[0].room.type,room)
 assert.ok(parsed.solutions.every(sol=>sol.room.doorWall))
 for(let i=0;i<parsed.solutions[0].items.length;i++){
  const before=response.solutions[0].items[i],after=parsed.solutions[0].items[i]
  assert.equal(after.y,before.y);assert.equal(after.widthM,'widthM' in before?before.widthM:undefined)
 }
})
