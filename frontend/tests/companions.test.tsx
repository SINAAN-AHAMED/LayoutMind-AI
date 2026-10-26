import React from 'react'
import test from 'node:test'
import assert from 'node:assert/strict'
import {renderToStaticMarkup} from 'react-dom/server'
import {PetPanel} from '../src/components/PetPanel'
import {APP_BUILD} from '../src/lib/buildInfo'
import fixtures from './fixtures/api-responses.json'
import type {LayoutSolution} from '../src/types/layout'
const solution=fixtures['Living Room'].solutions[0] as LayoutSolution
test('Companions has visible Pets, Accessories and Aira tabs without a hidden guest disclosure',()=>{
 const html=renderToStaticMarkup(<PetPanel solution={solution} onClose={()=>{}}/> )
 assert.match(html,/aria-label="Companions"/)
 for(const label of ['Pets','Accessories','Aira'])assert.match(html,new RegExp(`>${label}</button>`))
 assert.doesNotMatch(html,/<details|Room guests|Add cat|Add pug|lucide-plus/)
 assert.match(html,/aria-label="Invite cat"/);assert.match(html,/aria-label="Invite pug"/)
 assert.match(html,/class="pet-portrait" width="160" height="118"/)
})
test('Aira invitation is directly visible on her own tab before the preview image',()=>{
 const html=renderToStaticMarkup(<PetPanel solution={solution} initialTab="aira" onClose={()=>{}}/> )
 assert.ok(html.includes('>Invite Aira</button>'))
 assert.ok(html.indexOf('Invite Aira')<html.indexOf('aira-preview'))
 assert.doesNotMatch(html,/pet-choices/)
 assert.ok(html.includes(`Studio ${APP_BUILD}`))
})
test('Aira tab exposes removal, height and illustrated looks for an existing companion',()=>{
 const html=renderToStaticMarkup(<PetPanel solution={{...solution,guest:{x:0,z:0,heightM:1.74,rotationY:1}}} initialTab="aira" onClose={()=>{}}/> )
 assert.ok(html.includes('>Remove Aira</button>'));assert.match(html,/aria-label="Aira illustrated look"/);assert.match(html,/aria-label="Guest height"/);assert.match(html,/Camera views · automatic/);assert.doesNotMatch(html,/3D COMPANION|Guest rotation|aira-model/)
})

test('Aira exposes Classic and Eva suit choices and previews the selected outfit',()=>{
 const html=renderToStaticMarkup(<PetPanel solution={{...solution,guest:{x:0,z:0,heightM:1.74,outfit:'eva'}}} initialTab="aira" onClose={()=>{}}/>)
 assert.match(html,/aria-label="Aira outfit"/);assert.match(html,/>Classic</);assert.match(html,/>Eva suit</);assert.match(html,/images\/aira-eva\/view-0.webp/)
})
