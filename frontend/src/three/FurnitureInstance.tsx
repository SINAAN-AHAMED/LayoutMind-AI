import { useStudioStore } from '../store/useStudioStore'
import { furnitureCatalog } from './catalog'
import { RoomSpecificFurniture } from './RoomSpecificFurniture'
import { useMemo, useLayoutEffect, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { FurnitureItem } from '../types/layout'

// Lighten or darken a hex color by an amount (-255 to 255)
function shadeColor(hex: string, amount: number): string {
  let r = parseInt(hex.slice(1, 3), 16) + amount
  let g = parseInt(hex.slice(3, 5), 16) + amount
  let b = parseInt(hex.slice(5, 7), 16) + amount
  r = Math.max(0, Math.min(255, r))
  g = Math.max(0, Math.min(255, g))
  b = Math.max(0, Math.min(255, b))
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

// -------------------------------------------------------------
// STYLE PARSING LOGIC
// -------------------------------------------------------------
export type DominantStyle = 'Cozy' | 'Minimal' | 'Modern' | 'Luxury' | 'Compact' | 'Bohemian' | 'Industrial' | 'Coastal'

const STYLE_PALETTES: Record<DominantStyle, { primary: string, secondary: string, metal: string, wood: string, accent: string }> = {
  Cozy:       { primary: '#b48356', secondary: '#f0e6d8', metal: '#6b5a46', wood: '#7a5230', accent: '#d4a574' },
  Minimal:    { primary: '#e8e8e8', secondary: '#f8f8f8', metal: '#1a1a1a', wood: '#d4ccbb', accent: '#c0c0c0' },
  Modern:     { primary: '#52675e', secondary: '#d4d8cb', metal: '#a5afa6', wood: '#806348', accent: '#b7a887' },
  Luxury:     { primary: '#304d43', secondary: '#e2d5b8', metal: '#b99b62', wood: '#503c30', accent: '#bda16e' },
  Compact:    { primary: '#8b9b8b', secondary: '#c6d0c6', metal: '#7d8a7d', wood: '#9c8968', accent: '#a8b5a8' },
  Bohemian:   { primary: '#c17a4a', secondary: '#f0dfc0', metal: '#8b7355', wood: '#a0522d', accent: '#e0936a' },
  Industrial: { primary: '#4a4a4a', secondary: '#7a7a7a', metal: '#9a9a9a', wood: '#5c4a3a', accent: '#c75000' },
  Coastal:    { primary: '#a8c8d8', secondary: '#f0f8ff', metal: '#c0c0c0', wood: '#d2b48c', accent: '#5f9ea0' },
}

function parseDominantStyle(sliders?: Record<string, number>): DominantStyle {
  if (!sliders) return 'Modern'
  let dominant: DominantStyle = 'Modern'
  let maxV = 0
  const validStyles: DominantStyle[] = ['Cozy','Minimal','Modern','Luxury','Compact','Bohemian','Industrial','Coastal']
  for (const [k, v] of Object.entries(sliders)) {
    if (v > maxV && validStyles.includes(k as DominantStyle)) { maxV = v; dominant = k as DominantStyle }
  }
  return dominant
}

// -------------------------------------------------------------
// SOFA VARIANTS
// -------------------------------------------------------------
function SofaComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isCozy = styleKey === 'Cozy'
  const isMinimal = styleKey === 'Minimal'
  const isModern = styleKey === 'Modern'
  const isCompact = styleKey === 'Compact'
  const isBohemian = styleKey === 'Bohemian'
  const isCoastal = styleKey === 'Coastal'

  const Fabric = <meshStandardMaterial color={p.primary} roughness={isLuxury ? 0.3 : 0.85} metalness={isLuxury ? 0.05 : 0} />
  const Accent = <meshStandardMaterial color={p.secondary} roughness={0.75} />
  const Legs = <meshStandardMaterial color={isLuxury ? p.metal : p.wood} roughness={isLuxury ? 0.2 : 0.65} metalness={isLuxury ? 0.9 : 0.05} />

  // A tailored salon sofa, structurally distinct from the modern sectional.
  if(isLuxury)return <group name="salon-sofa">
    <RoundedBox args={[2.2,.22,.92]} radius={.07} position={[0,.30,0]} castShadow>{Fabric}</RoundedBox>
    <RoundedBox args={[2.05,.58,.19]} radius={.08} position={[0,.66,-.37]} castShadow>{Fabric}</RoundedBox>
    {[-1,1].map(sign=><RoundedBox key={sign} args={[.23,.45,.92]} radius={.10} position={[sign*1.06,.49,0]} castShadow>{Fabric}</RoundedBox>)}
    {[-.66,0,.66].map(x=><group key={x}><RoundedBox args={[.63,.16,.77]} radius={.055} position={[x,.47,.06]} castShadow>{Fabric}</RoundedBox>{[.60,.79].map(y=><mesh key={y} position={[x,y,-.265]}><sphereGeometry args={[.018,10,8]}/>{Legs}</mesh>)}</group>)}
    <mesh position={[0,.18,0]} castShadow><boxGeometry args={[2.12,.045,.82]}/>{Legs}</mesh>
    {[-.90,.90].flatMap(x=>[-.34,.34].map(z=><mesh key={`${x}:${z}`} position={[x,.09,z]} castShadow><cylinderGeometry args={[.018,.027,.18,12]}/>{Legs}</mesh>))}
    {[-.82,.82].map(x=><RoundedBox key={x} args={[.29,.29,.12]} radius={.045} position={[x,.64,-.16]} rotation={[.12,0,x*.12]} castShadow>{Accent}</RoundedBox>)}
  </group>

  // A forward-facing chaise, built near catalog scale to retain normal seat height.
  if(isModern)return <group name="modern-sectional">
    <RoundedBox args={[1.56,.20,.85]} radius={.045} position={[-.36,.28,-.08]} castShadow receiveShadow>{Fabric}</RoundedBox>
    <RoundedBox args={[.72,.20,1.16]} radius={.045} position={[.78,.28,.09]} castShadow receiveShadow>{Fabric}</RoundedBox>
    {[-.74,0].map(x=><RoundedBox key={x} name="sofa-seat" args={[.70,.14,.72]} radius={.04} position={[x,.45,-.04]} castShadow>{Accent}</RoundedBox>)}
    <RoundedBox name="sofa-chaise" args={[.65,.14,1.06]} radius={.04} position={[.77,.45,.10]} castShadow>{Fabric}</RoundedBox>
    <RoundedBox name="sofa-back" args={[2.3,.45,.16]} radius={.045} position={[0,.665,-.43]} castShadow>{Fabric}</RoundedBox>
    <RoundedBox args={[.10,.36,.85]} radius={.04} position={[-1.10,.50,-.08]} castShadow>{Fabric}</RoundedBox>
    <RoundedBox args={[.10,.36,1.16]} radius={.04} position={[1.10,.50,.09]} castShadow>{Fabric}</RoundedBox>
    {[-1,.32,1].flatMap(x=>[-.35,.39].map(z=><mesh key={`${x}:${z}`} position={[x,.09,z]} castShadow><cylinderGeometry args={[.024,.020,.18,12]}/>{Legs}</mesh>))}
  </group>

  // Chesterfield for Cozy
  if (isCozy) {
    return (
      <group>
        <RoundedBox args={[2.1, 0.28, 0.88]} radius={0.08} smoothness={6} position={[0, 0.3, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        <RoundedBox args={[0.68, 0.2, 0.82]} radius={0.06} smoothness={4} position={[-0.65, 0.47, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        <RoundedBox args={[0.68, 0.2, 0.82]} radius={0.06} smoothness={4} position={[0.65, 0.47, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Grand rolled backrest */}
        <RoundedBox args={[2.1, 0.65, 0.24]} radius={0.1} smoothness={6} position={[0, 0.73, -0.32]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Rolled arms */}
        <RoundedBox args={[0.28, 0.52, 0.88]} radius={0.1} smoothness={6} position={[-1.05, 0.54, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        <RoundedBox args={[0.28, 0.52, 0.88]} radius={0.1} smoothness={6} position={[1.05, 0.54, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Turned legs */}
        {[-0.85, 0.85].map(x => [-0.32, 0.32].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.1, z]} castShadow>
            <cylinderGeometry args={[0.04, 0.03, 0.2, 8]} />
            <meshStandardMaterial color={p.wood} roughness={0.6} />
          </mesh>
        )))}
        {/* Cozy throw pillows */}
        {[-0.7, 0, 0.7].map((x, i) => (
          <RoundedBox key={i} args={[0.3, 0.28, 0.12]} radius={0.04} smoothness={3} position={[x * 0.8, 0.68, -0.2]} rotation={[0.1, (i-1) * 0.2, 0.05]} castShadow>
            <meshStandardMaterial color={i % 2 === 0 ? p.accent : p.secondary} roughness={0.85} />
          </RoundedBox>
        ))}
      </group>
    )
  }

  // Loveseat for Compact
  if (isCompact) {
    return (
      <group>
        <RoundedBox args={[1.45, 0.2, 0.75]} radius={0.04} smoothness={4} position={[0, 0.29, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        <RoundedBox args={[0.65, 0.13, 0.7]} radius={0.04} smoothness={4} position={[-0.35, 0.43, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        <RoundedBox args={[0.65, 0.13, 0.7]} radius={0.04} smoothness={4} position={[0.35, 0.43, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        <RoundedBox args={[1.45, 0.42, 0.18]} radius={0.04} smoothness={4} position={[0, 0.58, -0.29]} castShadow receiveShadow>{Fabric}</RoundedBox>
        <RoundedBox args={[0.18, 0.37, 0.75]} radius={0.04} smoothness={4} position={[-0.63, 0.55, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        <RoundedBox args={[0.18, 0.37, 0.75]} radius={0.04} smoothness={4} position={[0.63, 0.55, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {[-0.55, 0.55].map(x => [-0.28, 0.28].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.1, z]} castShadow>
            <cylinderGeometry args={[0.025, 0.02, 0.18, 6]} />
            {Legs}
          </mesh>
        )))}
      </group>
    )
  }

  // Boho Daybed / Floor sofa
  if (isBohemian) {
    return (
      <group>
        <RoundedBox args={[1.9, 0.14, 0.85]} radius={0.06} smoothness={4} position={[0, 0.16, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={p.wood} roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[1.85, 0.18, 0.82]} radius={0.06} smoothness={4} position={[0, 0.3, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Back pillows */}
        {[-0.7, 0, 0.7].map((x, i) => (
          <RoundedBox key={i} args={[0.45, 0.45, 0.14]} radius={0.06} smoothness={3} position={[x * 0.85, 0.55, -0.3]} rotation={[0.2, (i-1)*0.15, 0]} castShadow>
            <meshStandardMaterial color={i % 2 === 0 ? '#c17a4a' : '#8b7355'} roughness={0.9} />
          </RoundedBox>
        ))}
        {/* Fringe/legs */}
        {[-0.8, 0.8].map(x => [-0.35, 0.35].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.06, z]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.12, 6]} />
            <meshStandardMaterial color={p.wood} roughness={0.8} />
          </mesh>
        )))}
      </group>
    )
  }

  // Coastal rattan sofa
  if (isCoastal) {
    return (
      <group>
        <RoundedBox args={[2.0, 0.12, 0.85]} radius={0.06} smoothness={4} position={[0, 0.22, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={p.wood} roughness={0.9} />
        </RoundedBox>
        <RoundedBox args={[1.9, 0.16, 0.8]} radius={0.05} smoothness={4} position={[0, 0.35, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[1.9, 0.45, 0.2]} radius={0.05} smoothness={4} position={[0, 0.6, -0.32]} castShadow receiveShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[0.2, 0.4, 0.85]} radius={0.05} smoothness={4} position={[-0.9, 0.58, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={p.wood} roughness={0.9} />
        </RoundedBox>
        <RoundedBox args={[0.2, 0.4, 0.85]} radius={0.05} smoothness={4} position={[0.9, 0.58, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={p.wood} roughness={0.9} />
        </RoundedBox>
        {/* Sea-blue pillows */}
        {[-0.55, 0.55].map((x, i) => (
          <RoundedBox key={i} args={[0.35, 0.32, 0.12]} radius={0.04} smoothness={3} position={[x, 0.56, -0.18]} rotation={[0.1, 0, 0.05]} castShadow>
            <meshStandardMaterial color={i % 2 === 0 ? '#5f9ea0' : '#a8c8d8'} roughness={0.75} />
          </RoundedBox>
        ))}
      </group>
    )
  }

  // Industrial sofa with bolts
  if (styleKey === 'Industrial') {
    return (
      <group>
        <RoundedBox args={[2.1, 0.26, 0.9]} radius={0.04} smoothness={4} position={[0, 0.29, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#2c2c2c" roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[0.95, 0.16, 0.85]} radius={0.04} smoothness={4} position={[-0.55, 0.46, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={p.primary} roughness={0.75} />
        </RoundedBox>
        <RoundedBox args={[0.95, 0.16, 0.85]} radius={0.04} smoothness={4} position={[0.55, 0.46, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={p.primary} roughness={0.75} />
        </RoundedBox>
        <RoundedBox args={[2.1, 0.5, 0.18]} radius={0.04} smoothness={4} position={[0, 0.63, -0.36]} castShadow receiveShadow>
          <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
        </RoundedBox>
        <RoundedBox args={[0.2, 0.44, 0.9]} radius={0.04} smoothness={4} position={[-1.0, 0.6, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
        </RoundedBox>
        <RoundedBox args={[0.2, 0.44, 0.9]} radius={0.04} smoothness={4} position={[1.0, 0.6, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
        </RoundedBox>
        {/* Metal legs */}
        {[-0.95, 0.95].map(x => [-0.35, 0.35].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.1, z]} castShadow>
            <boxGeometry args={[0.04, 0.2, 0.04]} />
            <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.9} />
          </mesh>
        )))}
      </group>
    )
  }

  // Default / Minimal
  return (
    <group>
      <RoundedBox args={[2.0, 0.2, 0.8]} radius={0.05} smoothness={4} position={[0, 0.3, 0]} castShadow receiveShadow>
        {isMinimal ? Accent : Fabric}
      </RoundedBox>
      <RoundedBox args={[0.9, 0.15, 0.75]} radius={0.05} smoothness={4} position={[-0.46, 0.45, 0.02]} castShadow receiveShadow>{Fabric}</RoundedBox>
      <RoundedBox args={[0.9, 0.15, 0.75]} radius={0.05} smoothness={4} position={[0.46, 0.45, 0.02]} castShadow receiveShadow>{Fabric}</RoundedBox>
      <RoundedBox args={[2.0, 0.5, 0.2]} radius={0.05} smoothness={4} position={[0, 0.65, -0.3]} castShadow receiveShadow>{Fabric}</RoundedBox>
      {[-0.9, 0.9].map(x => [-0.3, 0.3].map(z => (
        <mesh key={`${x}-${z}`} position={[x, 0.1, z]} castShadow>
          <cylinderGeometry args={[0.03, isMinimal ? 0.03 : 0.015, 0.2, 16]} />
          {Legs}
        </mesh>
      )))}
    </group>
  )
}

// -------------------------------------------------------------
// TV UNIT VARIANTS
// -------------------------------------------------------------
function TvUnitComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isModern = styleKey === 'Modern'
  const isIndustrial = styleKey === 'Industrial'
  const isMinimal = styleKey === 'Minimal'
  const isCompact = styleKey === 'Compact'
  const isCozy = styleKey === 'Cozy'
  const isCoastal = styleKey === 'Coastal'

  const WoodBody = <meshStandardMaterial color={p.wood} roughness={0.6} metalness={0.05} />
  const Screen = <meshStandardMaterial color="#050505" roughness={0.05} metalness={0.9} />
  const Glow = <meshStandardMaterial color="#1c2e29" emissive="#29463c" emissiveIntensity={0.12} roughness={.25} />
  const Metal = <meshStandardMaterial color={p.metal} roughness={isLuxury ? 0.2 : 0.4} metalness={0.8} />

  // Minimal: floating wall-mount shelf only — no console
  if (isMinimal) {
    return (
      <group>
        {/* Thin floating wall shelf - in front of unit */}
        <mesh position={[0, 0.12, 0.0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.06, 0.22]} />
          <meshStandardMaterial color={p.secondary} roughness={0.3} metalness={0.1} />
        </mesh>
        {/* TV screen facing into room (positive Z = toward room center) */}
        <mesh position={[0, 0.88, 0.06]} castShadow>
          <boxGeometry args={[1.5, 0.85, 0.04]} />
          {Screen}
        </mesh>
        <mesh position={[0, 0.88, 0.09]}>
          <boxGeometry args={[1.45, 0.8, 0.01]} />
          {Glow}
        </mesh>
        {/* Wall bracket */}
        <mesh position={[0, 0.55, -0.04]}>
          <boxGeometry args={[0.4, 0.04, 0.12]} />
          <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.8} />
        </mesh>
      </group>
    )
  }

  // Compact: small lowboard with open cubbies
  if (isCompact) {
    return (
      <group>
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.34, 0.38]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.8} />
        </mesh>
        {/* Open cubbies */}
        {[-0.45, 0, 0.45].map((x, i) => (
          <mesh key={i} position={[x, 0.18, 0.2]}>
            <boxGeometry args={[0.42, 0.28, 0.01]} />
            <meshStandardMaterial color={p.secondary} roughness={0.6} />
          </mesh>
        ))}
        {/* Slim legs */}
        {[-0.62, 0.62].map(x => [-0.14, 0.14].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.05, z]} castShadow>
            <boxGeometry args={[0.04, 0.1, 0.04]} />
            {Metal}
          </mesh>
        )))}
        {/* TV screen */}
        <mesh position={[0, 0.85, -0.08]} castShadow>
          <boxGeometry args={[1.3, 0.75, 0.04]} />
          {Screen}
        </mesh>
        <mesh position={[0, 0.85, -0.05]}>
          <boxGeometry args={[1.25, 0.7, 0.01]} />
          {Glow}
        </mesh>
      </group>
    )
  }

  // Cozy: vintage solid wood credenza with legs
  if (isCozy) {
    return (
      <group>
        {/* Main credenza body */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.5, 0.48]} />
          <meshStandardMaterial color={p.wood} roughness={0.7} />
        </mesh>
        {/* Panelled doors */}
        {[-0.55, 0, 0.55].map((x, i) => (
          <mesh key={i} position={[x, 0.28, 0.25]} castShadow>
            <boxGeometry args={[0.54, 0.44, 0.02]} />
            <meshStandardMaterial color={p.secondary} roughness={0.75} />
          </mesh>
        ))}
        {/* Brass knobs */}
        {[-0.55, 0, 0.55].map((x, i) => (
          <mesh key={`k${i}`} position={[x, 0.28, 0.27]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
        {/* Tapered legs */}
        {[-0.75, 0.75].map(x => [-0.18, 0.18].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.07, z]} castShadow>
            <cylinderGeometry args={[0.025, 0.015, 0.14, 8]} />
            <meshStandardMaterial color={p.wood} roughness={0.6} />
          </mesh>
        )))}
        {/* TV screen */}
        <mesh position={[0, 1.0, -0.08]} castShadow>
          <boxGeometry args={[1.4, 0.8, 0.04]} />
          {Screen}
        </mesh>
        <mesh position={[0, 1.0, -0.05]}>
          <boxGeometry args={[1.35, 0.75, 0.01]} />
          {Glow}
        </mesh>
      </group>
    )
  }

  // Coastal: rattan-style low console with woven panel
  if (isCoastal) {
    return (
      <group>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.65, 0.38, 0.42]} />
          <meshStandardMaterial color="#c8a882" roughness={0.9} />
        </mesh>
        {/* Woven panel front */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[-0.77 + i * 0.22, 0.22, 0.22]} castShadow>
            <boxGeometry args={[0.04, 0.34, 0.02]} />
            <meshStandardMaterial color="#b89870" roughness={0.95} />
          </mesh>
        ))}
        {/* Simple legs */}
        {[-0.74, 0.74].map(x => [-0.16, 0.16].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.05, z]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
            <meshStandardMaterial color={p.wood} roughness={0.9} />
          </mesh>
        )))}
        {/* TV screen */}
        <mesh position={[0, 0.92, -0.08]} castShadow>
          <boxGeometry args={[1.45, 0.82, 0.04]} />
          {Screen}
        </mesh>
        <mesh position={[0, 0.92, -0.05]}>
          <boxGeometry args={[1.40, 0.77, 0.01]} />
          {Glow}
        </mesh>
      </group>
    )
  }

  // Default: Luxury / Modern / Industrial console
  return (
    <group>
      {/* Console Base */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.4, 0.45]} />
        {WoodBody}
      </mesh>

      {/* Floating Shelf for Modern/Luxury */}
      {(isModern || isLuxury) && (
        <mesh position={[0, 0.48, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.06, 0.3]} />
          {WoodBody}
        </mesh>
      )}

      {/* Cabinet Doors */}
      <mesh position={[-0.45, 0.2, 0.23]} castShadow>
        <boxGeometry args={[0.85, 0.35, 0.02]} />
        {isModern ? <meshStandardMaterial color={p.secondary} roughness={0.4} /> :
         isLuxury ? <meshStandardMaterial color="#1a1a2e" roughness={0.05} metalness={0.9} transparent opacity={0.85} /> :
         <meshStandardMaterial color={p.secondary} roughness={0.6} />}
      </mesh>
      <mesh position={[0.45, 0.2, 0.23]} castShadow>
        <boxGeometry args={[0.85, 0.35, 0.02]} />
        {isModern ? <meshStandardMaterial color={p.secondary} roughness={0.4} /> :
         isLuxury ? <meshStandardMaterial color="#1a1a2e" roughness={0.05} metalness={0.9} transparent opacity={0.85} /> :
         <meshStandardMaterial color={p.secondary} roughness={0.6} />}
      </mesh>

      {(isLuxury || isModern || isIndustrial) && (
        <>
          <mesh position={[-0.45, 0.2, 0.245]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
            {Metal}
          </mesh>
          <mesh position={[0.45, 0.2, 0.245]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
            {Metal}
          </mesh>
        </>
      )}

      {/* TV Screen */}
      <mesh position={[0, 0.9, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.85, 0.04]} />
        {Screen}
      </mesh>
      <mesh position={[0, 0.9, -0.05]}>
        <boxGeometry args={[1.45, 0.8, 0.01]} />
        {Glow}
      </mesh>
      {(isLuxury || isModern) && (
        <rectAreaLight width={1.4} height={0.8} intensity={8} color={isLuxury ? "#66aaff" : "#38bdf8"} position={[0, 0.9, -0.09]} rotation={[0, Math.PI, 0]} />
      )}

      {/* TV Stand/Neck */}
      <mesh position={[0, 0.48, -0.08]} castShadow>
        <cylinderGeometry args={[0.04, 0.08, 0.1, 8]} />
        {Metal}
      </mesh>
      <mesh position={[0, 0.43, -0.08]} castShadow>
        <boxGeometry args={[0.45, 0.02, 0.22]} />
        {Metal}
      </mesh>

      {isIndustrial && (
        <>
          {[-0.8, 0.8].map(x => (
            <mesh key={x} position={[x, 0.04, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.08, 8]} />
              <meshStandardMaterial color="#555" roughness={0.4} metalness={0.9} />
            </mesh>
          ))}
        </>
      )}
    </group>
  )
}

// -------------------------------------------------------------
// WARDROBE VARIANTS
// -------------------------------------------------------------
function WardrobeComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isModern = styleKey === 'Modern'
  const isCompact = styleKey === 'Compact'
  const isIndustrial = styleKey === 'Industrial'

  const Shell = <meshStandardMaterial color={p.wood} roughness={0.7} />
  const Metal = <meshStandardMaterial color={p.metal} roughness={0.2} metalness={0.9} />

  // Built-in / Wall wardrobe for Compact
  if (isCompact) {
    return (
      <group position={[0, 1.1, 0]}>
        <RoundedBox args={[2.2, 2.2, 0.55]} radius={0.01} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
        </RoundedBox>
        {/* 3 door sections */}
        {[-0.73, 0, 0.73].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.285]} castShadow>
            <boxGeometry args={[0.72, 2.15, 0.02]} />
            <meshStandardMaterial color="#f0f0f0" roughness={0.8} />
          </mesh>
        ))}
        {/* Recessed handles */}
        {[-0.73, 0, 0.73].map((x, i) => (
          <mesh key={`h${i}`} position={[x, 0, 0.3]} castShadow>
            <boxGeometry args={[0.02, 0.18, 0.02]} />
            {Metal}
          </mesh>
        ))}

      </group>
    )
  }

  // Luxury walk-in / mirror wardrobe
  if (isLuxury) {
    return (
      <group position={[0, 1.1, 0]}>
        <RoundedBox args={[1.6, 2.2, 0.65]} radius={0.02} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.2} />
        </RoundedBox>
        {/* Gold frame border strips (top, bottom, sides) */}
        <mesh position={[0, 1.08, 0.34]}>
          <boxGeometry args={[1.6, 0.04, 0.015]} />
          <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, -1.08, 0.34]}>
          <boxGeometry args={[1.6, 0.04, 0.015]} />
          <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[-0.79, 0, 0.34]}>
          <boxGeometry args={[0.04, 2.2, 0.015]} />
          <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0.79, 0, 0.34]}>
          <boxGeometry args={[0.04, 2.2, 0.015]} />
          <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Mirror panels */}
        <mesh position={[-0.4, 0, 0.34]}>
          <boxGeometry args={[0.78, 2.15, 0.02]} />
          <meshStandardMaterial color="#c8d0d8" roughness={0.01} metalness={0.95} />
        </mesh>
        <mesh position={[0.4, 0, 0.36]}>
          <boxGeometry args={[0.78, 2.15, 0.02]} />
          <meshStandardMaterial color="#c8d0d8" roughness={0.01} metalness={0.95} />
        </mesh>
        {/* Gold vertical divider */}
        <mesh position={[0, 0, 0.345]}>
          <boxGeometry args={[0.04, 2.2, 0.025]} />
          {Metal}
        </mesh>
        {/* Gold handles */}
        <mesh position={[-0.16, 0, 0.365]}>
          <cylinderGeometry args={[0.015, 0.015, 0.25, 8]} />
          {Metal}
        </mesh>
        <mesh position={[0.16, 0, 0.365]}>
          <cylinderGeometry args={[0.015, 0.015, 0.25, 8]} />
          {Metal}
        </mesh>
        {/* Interior warm glow */}
        <mesh position={[0, 0, 0.28]}>
          <boxGeometry args={[1.5, 2.1, 0.01]} />
          <meshStandardMaterial color="#ffcc88" emissive="#ffaa44" emissiveIntensity={0.15} transparent opacity={0.1} />
        </mesh>
        {/* LED strip at top */}
        <mesh position={[0, 1.05, 0.34]}>
          <boxGeometry args={[1.55, 0.02, 0.015]} />
          <meshStandardMaterial color="#fff8e7" emissive="#ffeecc" emissiveIntensity={2} />
        </mesh>
      </group>
    )
  }

  // Modern sliding glass wardrobe
  if (isModern) {
    return (
      <group position={[0, 1.1, 0]}>
        <RoundedBox args={[1.5, 2.2, 0.65]} radius={0.01} smoothness={4} castShadow receiveShadow>
          {Shell}
        </RoundedBox>
        {/* Sliding glass panels */}
        <mesh position={[-0.22, 0, 0.34]}>
          <boxGeometry args={[1.1, 2.15, 0.025]} />
          <meshStandardMaterial color="#a0b8c8" roughness={0.02} metalness={0.3} transparent opacity={0.5} />
        </mesh>
        <mesh position={[0.22, 0, 0.36]}>
          <boxGeometry args={[1.1, 2.15, 0.025]} />
          <meshStandardMaterial color="#a0b8c8" roughness={0.02} metalness={0.3} transparent opacity={0.5} />
        </mesh>
        {/* Track rail top */}
        <mesh position={[0, 1.1, 0.355]}>
          <boxGeometry args={[1.5, 0.03, 0.04]} />
          {Metal}
        </mesh>
        {/* Track rail bottom */}
        <mesh position={[0, -1.08, 0.355]}>
          <boxGeometry args={[1.5, 0.03, 0.04]} />
          {Metal}
        </mesh>
      </group>
    )
  }

  // Industrial metal frame wardrobe
  if (isIndustrial) {
    return (
      <group position={[0, 1.1, 0]}>
        <RoundedBox args={[1.5, 2.2, 0.65]} radius={0.02} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
        </RoundedBox>
        {/* Metal door frames */}
        {[-0.37, 0.37].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.34]}>
            <boxGeometry args={[0.74, 2.15, 0.025]} />
            <meshStandardMaterial color="#3c3c3c" roughness={0.5} />
          </mesh>
        ))}
        {/* Pipe handles */}
        {[-0.05, 0.05].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.36]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
            <meshStandardMaterial color={p.metal} roughness={0.4} metalness={0.9} />
          </mesh>
        ))}
      </group>
    )
  }

  // Default / Cozy / Bohemian - classic wood wardrobe with ornate detail
  return (
    <group position={[0, 1.1, 0]}>
      <RoundedBox args={[1.5, 2.2, 0.65]} radius={0.02} smoothness={4} castShadow receiveShadow>{Shell}</RoundedBox>
      {/* Raised panel doors */}
      <mesh position={[-0.38, 0, 0.34]} castShadow>
        <boxGeometry args={[0.73, 2.15, 0.025]} />
        <meshStandardMaterial color={p.secondary} roughness={0.7} />
      </mesh>
      <mesh position={[0.38, 0, 0.34]} castShadow>
        <boxGeometry args={[0.73, 2.15, 0.025]} />
        <meshStandardMaterial color={p.secondary} roughness={0.7} />
      </mesh>
      {/* Panel insets */}
      {[-0.38, 0.38].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0.355]}>
          <boxGeometry args={[0.55, 0.8, 0.01]} />
          <meshStandardMaterial color={p.wood} roughness={0.75} />
        </mesh>
      ))}
      {[-0.38, 0.38].map((x, i) => (
        <mesh key={`b${i}`} position={[x, -0.5, 0.355]}>
          <boxGeometry args={[0.55, 1.1, 0.01]} />
          <meshStandardMaterial color={p.wood} roughness={0.75} />
        </mesh>
      ))}
      {/* Brass knob handles */}
      <mesh position={[0, 0, 0.37]} castShadow>
        <boxGeometry args={[0.02, 0.6, 0.03]} />
        {Metal}
      </mesh>
      <mesh position={[0, 0, 0.37]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.035]} />
        {Metal}
      </mesh>

    </group>
  )
}

// -------------------------------------------------------------
// BED VARIANTS
// -------------------------------------------------------------
function BedComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isModern = styleKey === 'Modern'
  const isCompact = styleKey === 'Compact'
  const isBohemian = styleKey === 'Bohemian'
  const isCoastal = styleKey === 'Coastal'
  const isCozy = styleKey === 'Cozy'

  const Mattress = <meshStandardMaterial color={isCoastal ? '#f0f8ff' : '#f8f9fa'} roughness={0.85} />
  const Frame = <meshStandardMaterial color={p.wood} roughness={0.65} />

  // Murphy/Storage bed for Compact
  if (isCompact) {
    return (
      <group>
        <mesh position={[0, 0.12, 0.08]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.18, 2.0]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.8} />
        </mesh>
        <RoundedBox args={[1.75, 0.22, 1.95]} radius={0.04} smoothness={4} position={[0, 0.3, 0.08]} castShadow receiveShadow>{Mattress}</RoundedBox>
        {/* Storage drawers */}
        <mesh position={[-0.6, 0.1, -0.95]} castShadow>
          <boxGeometry args={[0.55, 0.17, 0.06]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.8} />
        </mesh>
        <mesh position={[0.6, 0.1, -0.95]} castShadow>
          <boxGeometry args={[0.55, 0.17, 0.06]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.8} />
        </mesh>
        {/* Handles */}
        {[-0.6, 0.6].map(x => (
          <mesh key={x} position={[x, 0.1, -0.91]}>
            <boxGeometry args={[0.12, 0.02, 0.025]} />
            <meshStandardMaterial color="#999" roughness={0.4} metalness={0.7} />
          </mesh>
        ))}
        {/* Low headboard */}
        <RoundedBox args={[1.85, 0.45, 0.12]} radius={0.04} smoothness={4} position={[0, 0.35, -0.92]} castShadow receiveShadow>{Frame}</RoundedBox>
        {/* Pillows */}
        {[-0.36, 0.36].map((x, i) => (
          <RoundedBox key={i} args={[0.55, 0.09, 0.38]} radius={0.025} smoothness={4} position={[x, 0.43, -0.6]} rotation={[0.1, 0, 0]} castShadow>
            <meshStandardMaterial color="#fff" roughness={0.85} />
          </RoundedBox>
        ))}
      </group>
    )
  }

  // Four-poster for Luxury
  if (isLuxury) {
    return (
      <group>
        <mesh position={[0, 0.16, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[1.95, 0.22, 2.15]} />
          {Frame}
        </mesh>
        <RoundedBox args={[1.85, 0.26, 2.0]} radius={0.06} smoothness={4} position={[0, 0.38, 0.1]} castShadow receiveShadow>{Mattress}</RoundedBox>
        {/* Gold blanket */}
        <mesh position={[0, 0.52, 0.4]} castShadow receiveShadow>
          <boxGeometry args={[1.87, 0.07, 1.5]} />
          <meshStandardMaterial color={p.secondary} roughness={0.7} metalness={0.05} />
        </mesh>
        {/* Grand headboard */}
        <RoundedBox args={[2.05, 1.4, 0.18]} radius={0.08} smoothness={6} position={[0, 0.85, -0.96]} castShadow receiveShadow>
          <meshStandardMaterial color={p.wood} roughness={0.5} metalness={0.1} />
        </RoundedBox>
        {/* Gold headboard decorative bars */}
        {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
          <mesh key={i} position={[x, 0.75, -0.87]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 1.2, 8]} />
            <meshStandardMaterial color={p.metal} roughness={0.2} metalness={0.9} />
          </mesh>
        ))}
        {/* Four posts */}
        {[-0.88, 0.88].map(x => [-0.9, 1.05].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 1.0, z]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.9, 10]} />
            <meshStandardMaterial color={p.metal} roughness={0.2} metalness={0.9} />
          </mesh>
        )))}
        {/* Canopy top rails */}
        <mesh position={[0, 1.95, 0.08]} castShadow>
          <boxGeometry args={[1.79, 0.03, 0.03]} />
          <meshStandardMaterial color={p.metal} roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 1.95, 0]} rotation={[0, Math.PI/2, 0]} castShadow>
          <boxGeometry args={[1.97, 0.03, 0.03]} />
          <meshStandardMaterial color={p.metal} roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Silk canopy */}
        <mesh position={[0, 1.94, 0.08]} rotation={[Math.PI/2, 0, 0]}>
          <planeGeometry args={[1.76, 1.94]} />
          <meshStandardMaterial color={p.primary} roughness={0.3} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        {/* Luxury pillows */}
        {[-0.6, 0, 0.6].map((x, i) => (
          <RoundedBox key={i} args={[0.45, 0.12, 0.42]} radius={0.04} smoothness={4} position={[x, 0.53, -0.5]} rotation={[0.12, 0, 0]} castShadow>
            <meshStandardMaterial color={i === 1 ? '#ffffff' : p.secondary} roughness={0.8} />
          </RoundedBox>
        ))}
      </group>
    )
  }

  // Platform bed for Modern
  if (isModern) {
    return (
      <group>
        {/* Very low platform */}
        <mesh position={[0, 0.08, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.14, 2.2]} />
          {Frame}
        </mesh>
        <RoundedBox args={[1.88, 0.22, 2.08]} radius={0.03} smoothness={4} position={[0, 0.24, 0.1]} castShadow receiveShadow>{Mattress}</RoundedBox>
        {/* Blanket */}
        <mesh position={[0, 0.36, 0.42]} castShadow>
          <boxGeometry args={[1.9, 0.06, 1.45]} />
          <meshStandardMaterial color={p.primary} roughness={0.7} />
        </mesh>
        {/* Minimal slab headboard */}
        <RoundedBox args={[2.05, 0.8, 0.1]} radius={0.02} smoothness={4} position={[0, 0.44, -0.98]} castShadow receiveShadow>
          <meshStandardMaterial color={p.wood} roughness={0.4} metalness={0.1} />
        </RoundedBox>
        {/* LED strip under bed */}
        <mesh position={[0, 0.01, 0.1]}>
          <boxGeometry args={[1.95, 0.01, 2.15]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} transparent opacity={0.3} />
        </mesh>
        <pointLight position={[0, 0.02, 0]} intensity={0.4} color="#38bdf8" distance={3} />
        {/* 2 clean pillows */}
        {[-0.42, 0.42].map((x, i) => (
          <RoundedBox key={i} args={[0.6, 0.1, 0.42]} radius={0.03} smoothness={4} position={[x, 0.32, -0.6]} rotation={[0.1, 0, 0]} castShadow>
            <meshStandardMaterial color="#ffffff" roughness={0.85} />
          </RoundedBox>
        ))}
      </group>
    )
  }

  // Boho hanging-feel / low bed
  if (isBohemian) {
    return (
      <group>
        <mesh position={[0, 0.06, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[1.85, 0.1, 2.05]} />
          <meshStandardMaterial color={p.wood} roughness={0.85} />
        </mesh>
        <RoundedBox args={[1.78, 0.2, 1.98]} radius={0.05} smoothness={4} position={[0, 0.2, 0.1]} castShadow receiveShadow>{Mattress}</RoundedBox>
        {/* Colorful blanket */}
        <mesh position={[0, 0.32, 0.4]} castShadow>
          <boxGeometry args={[1.8, 0.07, 1.4]} />
          <meshStandardMaterial color={p.primary} roughness={0.95} />
        </mesh>
        {/* Woven headboard - cross-hatch strips */}
        <group position={[0, 0.45, -0.94]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={`hv${i}`} position={[-0.8 + i * 0.23, 0, 0]} castShadow>
              <boxGeometry args={[0.04, 0.85, 0.06]} />
              <meshStandardMaterial color={p.wood} roughness={0.95} />
            </mesh>
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <mesh key={`hh${i}`} position={[0, -0.3 + i * 0.2, 0]} castShadow>
              <boxGeometry args={[1.85, 0.04, 0.06]} />
              <meshStandardMaterial color={shadeColor(p.wood, -15)} roughness={0.95} />
            </mesh>
          ))}
        </group>
        <mesh position={[0, 0.45, -0.96]} castShadow>
          <boxGeometry args={[1.9, 0.9, 0.04]} />
          <meshStandardMaterial color={p.accent} roughness={0.9} transparent opacity={0.7} />
        </mesh>
        {/* Many colorful pillows */}
        {[[-0.6, 0], [0, 0.05], [0.6, 0]].map(([x, dz], i) => (
          <RoundedBox key={i} args={[0.45, 0.12, 0.42]} radius={0.05} smoothness={3} position={[x, 0.3, -0.55 + dz]} rotation={[0.1, (i-1)*0.2, 0]} castShadow>
            <meshStandardMaterial color={['#e07a5f', '#f2cc8f', '#81b29a'][i]} roughness={0.9} />
          </RoundedBox>
        ))}
      </group>
    )
  }

  // Coastal driftwood bed
  if (isCoastal) {
    return (
      <group>
        <mesh position={[0, 0.14, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[1.88, 0.2, 2.08]} />
          <meshStandardMaterial color="#c8a882" roughness={0.9} />
        </mesh>
        <RoundedBox args={[1.8, 0.22, 2.0]} radius={0.04} smoothness={4} position={[0, 0.34, 0.1]} castShadow receiveShadow>{Mattress}</RoundedBox>
        <mesh position={[0, 0.47, 0.4]} castShadow>
          <boxGeometry args={[1.82, 0.06, 1.4]} />
          <meshStandardMaterial color="#b8d8d8" roughness={0.75} />
        </mesh>
        {/* Driftwood slat headboard */}
        {[-0.55, -0.18, 0.18, 0.55].map((x, i) => (
          <mesh key={i} position={[x, 0.52, -0.92]} castShadow>
            <boxGeometry args={[0.1, [0.75, 0.95, 0.88, 0.7][i], 0.06]} />
            <meshStandardMaterial color="#c8a882" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 0.2, -0.93]} castShadow>
          <boxGeometry args={[1.9, 0.06, 0.06]} />
          <meshStandardMaterial color="#c8a882" roughness={0.9} />
        </mesh>
        {/* Coastal pillows */}
        {[-0.42, 0.42].map((x, i) => (
          <RoundedBox key={i} args={[0.58, 0.1, 0.42]} radius={0.03} smoothness={4} position={[x, 0.42, -0.58]} rotation={[0.1, 0, 0]} castShadow>
            <meshStandardMaterial color={i % 2 === 0 ? '#f0f8ff' : '#a8c8d8'} roughness={0.85} />
          </RoundedBox>
        ))}
      </group>
    )
  }

  // Default / Cozy classic bed
  return (
    <group>
      <mesh position={[0, 0.15, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.2, 2.1]} />
        {Frame}
      </mesh>
      <RoundedBox args={[1.8, 0.25, 2.0]} radius={0.05} smoothness={4} position={[0, 0.35, 0.1]} castShadow receiveShadow>{Mattress}</RoundedBox>
      <mesh position={[0, 0.48, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[1.82, 0.06, 1.4]} />
        <meshStandardMaterial color={p.primary} roughness={0.8} />
      </mesh>
      <RoundedBox args={[2.0, isCozy ? 1.0 : 0.75, 0.15]} radius={0.05} smoothness={4} position={[0, isCozy ? 0.62 : 0.48, -0.9]} castShadow receiveShadow>
        <meshStandardMaterial color={isCozy ? p.accent : p.wood} roughness={0.6} />
      </RoundedBox>
      {[-0.4, 0.4].map((x, i) => (
        <RoundedBox key={i} args={[0.6, 0.1, 0.4]} radius={0.03} smoothness={4} position={[x, 0.5, -0.6]} rotation={[0.1, 0, 0]} castShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </RoundedBox>
      ))}
    </group>
  )
}

// -------------------------------------------------------------
// TABLE VARIANTS
// -------------------------------------------------------------
function TableComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isMinimal = styleKey === 'Minimal'
  const isLuxury = styleKey === 'Luxury'
  const isCozy = styleKey === 'Cozy'
  const isIndustrial = styleKey === 'Industrial'
  const isModern = styleKey === 'Modern'

  // Marble top for Luxury
  if (isLuxury) {
    return (
      <group>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.62, 0.62, 0.06, 32]} />
          <meshStandardMaterial color="#e8e4e0" roughness={0.1} metalness={0.05} />
        </mesh>
        {/* Marble veins */}
        <mesh position={[0, 0.48, 0]} rotation={[Math.PI/2, 0, 0]}>
          <planeGeometry args={[1.22, 1.22]} />
          <meshStandardMaterial color="#d8d4d0" roughness={0.15} transparent opacity={0.4} />
        </mesh>
        {/* Gold pedestal */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.2, 0.45, 16]} />
          <meshStandardMaterial color={p.metal} roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Gold base */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.4, 0.04, 32]} />
          <meshStandardMaterial color={p.metal} roughness={0.2} metalness={0.9} />
        </mesh>
      </group>
    )
  }

  // Farmhouse / wooden for Cozy
  if (isCozy) {
    return (
      <group>
        <RoundedBox args={[1.3, 0.08, 0.88]} radius={0.02} smoothness={3} position={[0, 0.46, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={p.wood} roughness={0.6} />
        </RoundedBox>
        {/* Plank lines */}
        {[-0.3, 0, 0.3].map((z, i) => (
          <mesh key={i} position={[0, 0.5, z]}>
            <boxGeometry args={[1.28, 0.002, 0.01]} />
            <meshStandardMaterial color="#5a3c1e" roughness={0.9} />
          </mesh>
        ))}
        {/* Turned legs */}
        {[[-0.55, 0.35], [0.55, 0.35], [-0.55, -0.35], [0.55, -0.35]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.22, z]} castShadow>
            <cylinderGeometry args={[0.04, 0.03, 0.45, 8]} />
            <meshStandardMaterial color={p.wood} roughness={0.7} />
          </mesh>
        ))}
        {/* Cross stretcher */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.9, 0.035, 0.035]} />
          <meshStandardMaterial color={p.wood} roughness={0.7} />
        </mesh>
      </group>
    )
  }

  // Glass + metal for Modern/Minimal
  if (isMinimal || isModern) {
    return (
      <group>
        {isMinimal ? (
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.62, 0.62, 0.05, 32]} />
            <meshStandardMaterial color={p.secondary} roughness={0.02} metalness={0.1} transparent opacity={0.85} />
          </mesh>
        ) : (
          <RoundedBox args={[1.25, 0.06, 0.82]} radius={0.02} smoothness={3} position={[0, 0.45, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={p.secondary} roughness={0.05} metalness={0.1} transparent opacity={0.8} />
          </RoundedBox>
        )}
        {isMinimal ? (
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.18, 0.45, 16]} />
            <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.8} />
          </mesh>
        ) : (
          [[-0.52, 0.3], [0.52, 0.3], [-0.52, -0.3], [0.52, -0.3]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.22, z]} castShadow>
              <cylinderGeometry args={[0.025, 0.02, 0.45, 8]} />
              <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.8} />
            </mesh>
          ))
        )}
      </group>
    )
  }

  // Industrial pipe table
  if (isIndustrial) {
    return (
      <group>
        <RoundedBox args={[1.2, 0.06, 0.8]} radius={0.01} smoothness={3} position={[0, 0.45, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={p.wood} roughness={0.7} />
        </RoundedBox>
        {/* Pipe legs */}
        {[[-0.5, 0.32], [0.5, 0.32], [-0.5, -0.32], [0.5, -0.32]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.22, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.45, 8]} />
            <meshStandardMaterial color={p.metal} roughness={0.5} metalness={0.8} />
          </mesh>
        ))}
        {/* Pipe connectors */}
        {[[-0.5, 0.32], [0.5, 0.32], [-0.5, -0.32], [0.5, -0.32]].map(([x, z], i) => (
          <mesh key={`c${i}`} position={[x, 0.42, z]} castShadow>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.9} />
          </mesh>
        ))}
      </group>
    )
  }

  // Default rectangular table
  return (
    <group>
      <RoundedBox args={[1.2, 0.08, 0.8]} radius={0.02} smoothness={3} position={[0, 0.45, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={p.wood} roughness={0.5} />
      </RoundedBox>
      {[[-0.5, 0.3], [0.5, 0.3], [-0.5, -0.3], [0.5, -0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]} castShadow>
          <cylinderGeometry args={[0.03, 0.02, 0.45, 8]} />
          <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// -------------------------------------------------------------
// CHAIR VARIANTS
// -------------------------------------------------------------
function ChairComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isCozy = styleKey === 'Cozy'
  const isModern = styleKey === 'Modern'
  const isCompact = styleKey === 'Compact'
  const isBohemian = styleKey === 'Bohemian'

  const Fabric = <meshStandardMaterial color={p.primary} roughness={0.8} />
  const LegMat = <meshStandardMaterial color={p.metal} metalness={0.6} roughness={0.4} />

  // Upholstered lounge seating, rather than a dining/task-chair silhouette.
  if(isModern)return <group name="modern-lounge-chair">
    <RoundedBox args={[.58,.18,.56]} radius={.055} position={[0,.30,0]} castShadow receiveShadow>{Fabric}</RoundedBox>
    <RoundedBox name="accent-seat" args={[.45,.105,.46]} radius={.04} position={[0,.435,.035]} castShadow receiveShadow><meshStandardMaterial color={p.secondary} roughness={.85}/></RoundedBox>
    <RoundedBox name="accent-back" args={[.53,.49,.12]} radius={.055} position={[0,.64,-.22]} rotation={[-.10,0,0]} castShadow>{Fabric}</RoundedBox>
    {[-1,1].map(sign=><RoundedBox key={sign} args={[.095,.26,.55]} radius={.045} position={[sign*.265,.46,0]} castShadow>{Fabric}</RoundedBox>)}
    {[-.22,.22].flatMap(x=>[-.21,.21].map(z=><mesh key={`${x}:${z}`} position={[x,.11,z]} castShadow><cylinderGeometry args={[.022,.017,.22,12]}/><meshStandardMaterial color={p.wood} roughness={.65}/></mesh>))}
  </group>

  // Wingback for Luxury
  if (isLuxury) {
    return (
      <group>
        <RoundedBox args={[0.58, 0.12, 0.58]} radius={0.04} smoothness={4} position={[0, 0.44, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Back */}
        <RoundedBox args={[0.55, 0.85, 0.1]} radius={0.04} smoothness={4} position={[0, 0.93, -0.23]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Wings */}
        <RoundedBox args={[0.12, 0.4, 0.28]} radius={0.04} smoothness={4} position={[-0.22, 0.88, -0.1]} castShadow receiveShadow>{Fabric}</RoundedBox>
        <RoundedBox args={[0.12, 0.4, 0.28]} radius={0.04} smoothness={4} position={[0.22, 0.88, -0.1]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Arms */}
        <RoundedBox args={[0.1, 0.1, 0.55]} radius={0.04} smoothness={4} position={[-0.26, 0.6, 0.02]} castShadow receiveShadow>{Fabric}</RoundedBox>
        <RoundedBox args={[0.1, 0.1, 0.55]} radius={0.04} smoothness={4} position={[0.26, 0.6, 0.02]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Tapered legs */}
        {[[-0.22, 0.22], [0.22, 0.22], [-0.22, -0.22], [0.22, -0.22]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.18, z]} castShadow>
            <cylinderGeometry args={[0.025, 0.018, 0.37, 8]} />
            <meshStandardMaterial color={p.metal} roughness={0.2} metalness={0.8} />
          </mesh>
        ))}
      </group>
    )
  }

  // Barrel chair for Cozy
  if (isCozy) {
    return (
      <group>
        <RoundedBox args={[0.58, 0.12, 0.58]} radius={0.05} smoothness={4} position={[0, 0.44, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Round back & sides */}
        <mesh position={[0, 0.78, -0.1]} castShadow receiveShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.6, 16, 1, true, Math.PI*0.25, Math.PI*1.5]} />
          <meshStandardMaterial color={p.primary} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {[[-0.22, 0.22], [0.22, 0.22], [-0.22, -0.22], [0.22, -0.22]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.2, z]} castShadow>
            <cylinderGeometry args={[0.03, 0.025, 0.4, 8]} />
            <meshStandardMaterial color={p.wood} roughness={0.7} />
          </mesh>
        ))}
      </group>
    )
  }

  // Bean Bag for Compact
  if (isCompact) {
    return (
      <group>
        <mesh position={[0, 0.28, 0]} scale={[1, 0.8, 1]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.42, 2]} />
          <meshStandardMaterial color={p.primary} roughness={0.9} />
        </mesh>
        {/* Top tuft / slouch */}
        <mesh position={[0, 0.55, -0.05]} scale={[0.8, 0.6, 0.8]} rotation={[-0.1, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={p.primary} roughness={0.9} />
        </mesh>
      </group>
    )
  }

  // Rattan Peacock chair for Bohemian
  if (isBohemian) {
    return (
      <group>
        {/* Seat cushion */}
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
          <meshStandardMaterial color={p.secondary} roughness={0.9} />
        </mesh>
        {/* Rattan base */}
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.25, 0.35, 0.44, 16]} />
          <meshStandardMaterial color={p.wood} roughness={0.8} />
        </mesh>
        {/* Large peacock backrest */}
        <mesh position={[0, 0.9, -0.25]} rotation={[0.1, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.6, 0.6, 0.05, 16]} />
          <meshStandardMaterial color={p.wood} roughness={0.8} />
        </mesh>
      </group>
    )
  }

  // Default chair
  return (
    <group>
      <RoundedBox args={[0.5, 0.1, 0.5]} radius={0.03} smoothness={3} position={[0, 0.45, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
      <RoundedBox args={[0.45, 0.5, 0.1]} radius={0.03} smoothness={3} position={[0, 0.75, -0.2]} castShadow receiveShadow>{Fabric}</RoundedBox>
      {[[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]} castShadow>
          <cylinderGeometry args={[0.02, 0.015, 0.45, 8]} />
          {LegMat}
        </mesh>
      ))}
    </group>
  )
}

// -------------------------------------------------------------
// BOOKSHELF VARIANTS
// -------------------------------------------------------------
function BookshelfComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isMinimal = styleKey === 'Minimal'
  const isIndustrial = styleKey === 'Industrial'

  const WoodBody = <meshStandardMaterial color={p.wood} roughness={0.7} />

  // Generate books for shelves
  const bookColors = [p.primary, p.secondary, p.accent, p.wood, '#c0392b', '#27ae60', '#2980b9', '#8e44ad']
  const books = []
  // Shelf plank centers: 0.42, 0.84, 1.26, 1.68 — top surface = center + 0.035/2 = +0.0175
  const shelfTops = [0.44, 0.86, 1.28, 1.70] // shelf top surface Y for each row
  const shelfRows = isMinimal ? 3 : 4
  for (let row = 0; row < shelfRows; row++) {
    const shelfTopY = shelfTops[row]
    const count = isMinimal ? 4 : 6 + (row % 3)
    let x = -0.50
    for (let b = 0; b < count; b++) {
      const w = 0.04 + (((row * 7 + b * 3) % 5) * 0.01)
      const h = 0.20 + (((row * 3 + b * 7) % 5) * 0.025)
      const colorIdx = (row * 5 + b * 3) % bookColors.length
      const color = bookColors[colorIdx]
      const lean = b % 7 === 0 ? ((b % 2 === 0 ? 1 : -1) * 0.18) : 0
      if (x + w > 0.52) break
      books.push(
        <mesh key={`b-${row}-${b}`} position={[x + w / 2, shelfTopY + h / 2, 0]} rotation={[0, 0, lean]} castShadow>
          <boxGeometry args={[w, h, 0.24]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      )
      x += w + 0.004
    }
  }

  return (
    <group>
      {/* Sides */}
      <mesh position={[-0.58, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 2.1, 0.35]} />
        {isIndustrial ? <meshStandardMaterial color={p.metal} roughness={0.5} metalness={0.7} /> : WoodBody}
      </mesh>
      <mesh position={[0.58, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 2.1, 0.35]} />
        {isIndustrial ? <meshStandardMaterial color={p.metal} roughness={0.5} metalness={0.7} /> : WoodBody}
      </mesh>
      {/* Top & bottom */}
      <mesh position={[0, 2.09, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.04, 0.35]} />
        {WoodBody}
      </mesh>
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.04, 0.35]} />
        {WoodBody}
      </mesh>
      {/* Back panel */}
      <mesh position={[0, 1.05, -0.15]} castShadow receiveShadow>
        <boxGeometry args={[1.16, 2.1, 0.02]} />
        {WoodBody}
      </mesh>
      {/* Shelves */}
      {[0.42, 0.84, 1.26, 1.68].slice(0, isMinimal ? 3 : 4).map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.16, 0.035, 0.33]} />
          {WoodBody}
        </mesh>
      ))}
      {/* Books */}
      {books}
      {/* Industrial top metal bar */}
      {isIndustrial && (
        <mesh position={[0, 2.14, 0]}>
          <boxGeometry args={[1.22, 0.04, 0.04]} />
          <meshStandardMaterial color={p.accent} roughness={0.4} metalness={0.8} />
        </mesh>
      )}
    </group>
  )
}

// -------------------------------------------------------------
// PLANT VARIANTS
// -------------------------------------------------------------
function PlantComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isMinimal = styleKey === 'Minimal'
  const isBohemian = styleKey === 'Bohemian'
  const isIndustrial = styleKey === 'Industrial'

  // Large fiddle leaf / architectural plant for Luxury/Modern
  if (isLuxury || isMinimal) {
    return (
      <group>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.16, 0.13, 0.4, 8]} />
          <meshStandardMaterial color={isLuxury ? p.metal : '#e0e0e0'} roughness={0.4} metalness={isLuxury ? 0.7 : 0.1} />
        </mesh>
        {/* Tall trunk */}
        <mesh position={[0, 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.028, 0.035, 0.7, 8]} />
          <meshStandardMaterial color="#5c4a34" roughness={0.8} />
        </mesh>
        {/* Architectural leaves - tall */}
        {[0, 0.15, -0.1, 0.08, -0.06].map((xOff, i) => {
          const ang = i * (Math.PI / 2.5)
          return (
            <mesh key={i} position={[Math.cos(ang) * 0.15 + xOff * 0.3, 1.05 + i * 0.04, Math.sin(ang) * 0.15]} rotation={[Math.PI / 4 + i * 0.1, ang, 0]} castShadow>
              <boxGeometry args={[0.08, 0.45, 0.01]} />
              <meshStandardMaterial color="#2d6a2e" roughness={0.7} />
            </mesh>
          )
        })}
      </group>
    )
  }

  // Hanging/trailing plant for Bohemian
  if (isBohemian) {
    return (
      <group>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.16, 0.4, 12]} />
          <meshStandardMaterial color="#c67a4b" roughness={0.9} />
        </mesh>
        {/* Trailing vines */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const ang = i * (Math.PI / 3)
          const r = 0.14
          return (
            <group key={i}>
              <mesh position={[Math.cos(ang) * r, 0.28, Math.sin(ang) * r]} rotation={[Math.PI/2.2, ang, 0]} castShadow>
                <cylinderGeometry args={[0.008, 0.005, 0.4, 4]} />
                <meshStandardMaterial color="#4a7c59" roughness={0.8} />
              </mesh>
              <mesh position={[Math.cos(ang) * r * 1.6, 0.12, Math.sin(ang) * r * 1.6]}>
                <sphereGeometry args={[0.05, 6, 6]} />
                <meshStandardMaterial color="#3d6b4a" roughness={0.8} />
              </mesh>
            </group>
          )
        })}
        {/* Main bush */}
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshStandardMaterial color="#2d6a2e" roughness={0.8} />
        </mesh>
      </group>
    )
  }

      {/* Cactus for Industrial */}
  if (isIndustrial) {
    return (
      <group>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.3, 8]} />
          <meshStandardMaterial color="#3d2b1f" roughness={1} />
        </mesh>
        <mesh position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.55, 8]} />
          <meshStandardMaterial color="#4a7a3a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.15, 0.42, 0]} rotation={[0, 0, -0.8]} castShadow>
          <cylinderGeometry args={[0.055, 0.06, 0.25, 8]} />
          <meshStandardMaterial color="#4a7a3a" roughness={0.8} />
        </mesh>
        <mesh position={[0.15, 0.38, 0]} rotation={[0, 0, 0.7]} castShadow>
          <cylinderGeometry args={[0.055, 0.06, 0.2, 8]} />
          <meshStandardMaterial color="#4a7a3a" roughness={0.8} />
        </mesh>
      </group>
    )
  }

  // Compact: succulent in pot
  if (styleKey === 'Compact') {
    return (
      <group>
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.12, 0.09, 0.18, 10]} />
          <meshStandardMaterial color="#c0784a" roughness={0.8} />
        </mesh>
        {[0,1,2,3,4,5].map(i => {
          const ang = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(ang) * 0.08, 0.22, Math.sin(ang) * 0.08]} rotation={[0.6, ang, 0]} castShadow>
              <boxGeometry args={[0.04, 0.12, 0.025]} />
              <meshStandardMaterial color="#4a9a4a" roughness={0.7} />
            </mesh>
          )
        })}
        <mesh position={[0, 0.19, 0]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#3a8040" roughness={0.8} />
        </mesh>
      </group>
    )
  }

  // Coastal: palm tree
  if (styleKey === 'Coastal') {
    return (
      <group>
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.14, 0.11, 0.35, 10]} />
          <meshStandardMaterial color="#a8c8d8" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, 0.7, 8]} />
          <meshStandardMaterial color="#8b7355" roughness={0.9} />
        </mesh>
        {[0,1,2,3,4].map(i => {
          const ang = (i / 5) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(ang) * 0.22, 1.0 - Math.abs(Math.sin(ang)) * 0.1, Math.sin(ang) * 0.22]}
              rotation={[Math.PI/2.2, ang, 0]} castShadow>
              <boxGeometry args={[0.06, 0.4, 0.01]} />
              <meshStandardMaterial color="#2d8a2e" roughness={0.7} />
            </mesh>
          )
        })}
      </group>
    )
  }

  // Cozy/default: monstera / lush plant with large leaves
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.3, 16]} />
        <meshStandardMaterial color="#c67a4b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.02, 16]} />
        <meshStandardMaterial color="#3d2b1f" roughness={1} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.5, 8]} />
        <meshStandardMaterial color="#5c3c1e" roughness={0.8} />
      </mesh>
      {/* Large monstera-style leaves */}
      {[[0,0.9,0,0.22],[-0.12,0.82,0.08,0.18],[0.14,0.86,-0.06,0.16],[0.06,0.96,0.12,0.14],[-0.1,0.98,-0.1,0.15],
        [0.18,0.78,0.05,0.13],[-0.16,0.92,-0.04,0.17]].map(([x,y,z,r],i) => (
        <mesh key={i} position={[x,y,z]} castShadow>
          <sphereGeometry args={[r, 10, 10]} />
          <meshStandardMaterial color={i%2===0?'#2d6a2e':'#3a8a3a'} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

// -------------------------------------------------------------
function FloorLampComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isIndustrial = styleKey === 'Industrial'
  const isBohemian = styleKey === 'Bohemian'
  const isCoastal = styleKey === 'Coastal'
  const isCozy = styleKey === 'Cozy'

  if (isLuxury) {
    return (
      <group>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.04, 20]} />
          <meshStandardMaterial color={p.metal} roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 1.66, 8]} />
          <meshStandardMaterial color={p.metal} roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 1.72, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.04, 0.28, 20, 1, true]} />
          <meshStandardMaterial color={p.secondary} roughness={0.5} side={2} />
        </mesh>
        <mesh position={[0, 1.72, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#fff8e0" emissive="#ffdd88" emissiveIntensity={3} />
        </mesh>
        <pointLight position={[0, 1.75, 0]} intensity={1.2} color="#ffeedd" distance={5} />
      </group>
    )
  }

  if (isBohemian) {
    return (
      <group>
        {[-0.18, 0.18, 0].map((x, i) => (
          <mesh key={i} position={[x, 0.7, i === 2 ? 0.22 : 0]}
            rotation={[i === 2 ? 0.35 : -0.22, (i * Math.PI * 2) / 3, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 1.44, 6]} />
            <meshStandardMaterial color="#8b6540" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 1.4, 0]} castShadow>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshStandardMaterial color="#c49a5a" roughness={0.9} transparent opacity={0.45} />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#fff4e0" emissive="#ffcc66" emissiveIntensity={2.2} />
        </mesh>
        <pointLight position={[0, 1.4, 0]} intensity={1.0} color="#ffeecc" distance={5} castShadow />
      </group>
    )
  }

  if (isCoastal) {
    return (
      <group>
        {[0, 1, 2].map(i => {
          const ang = (i / 3) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(ang) * 0.15, 0.72, Math.sin(ang) * 0.15]}
              rotation={[Math.cos(ang) * 0.32, ang, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.03, 1.44, 6]} />
              <meshStandardMaterial color="#c8a882" roughness={0.95} />
            </mesh>
          )
        })}
        <mesh position={[0, 1.42, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.18, 0.24, 16, 1, true]} />
          <meshStandardMaterial color="#e8f0f4" roughness={0.7} side={2} />
        </mesh>
        <mesh position={[0, 1.38, 0]}>
          <sphereGeometry args={[0.038, 8, 8]} />
          <meshStandardMaterial color="#fff8f0" emissive="#ffeecc" emissiveIntensity={2.5} />
        </mesh>
        <pointLight position={[0, 1.4, 0]} intensity={0.9} color="#f0f8ff" distance={4} />
      </group>
    )
  }

  if (isCozy) {
    return (
      <group>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.2, 0.16, 12]} />
          <meshStandardMaterial color="#c9a227" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.82, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 1.32, 8]} />
          <meshStandardMaterial color="#c9a227" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 1.55, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.22, 0.3, 16, 1, true]} />
          <meshStandardMaterial color={p.secondary} roughness={0.85} side={2} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.042, 8, 8]} />
          <meshStandardMaterial color="#fff4e0" emissive="#ffcc66" emissiveIntensity={2.2} />
        </mesh>
        <pointLight position={[0, 1.5, 0]} intensity={0.9} color="#ffedcc" distance={4.5} />
      </group>
    )
  }

  if (isIndustrial) {
    return (
      <group>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.16, 0.04, 8]} />
          <meshStandardMaterial color="#555" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.55, 8]} />
          <meshStandardMaterial color="#8a8a8a" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.55, 0]} castShadow>
          <sphereGeometry args={[0.16, 6, 6]} />
          <meshStandardMaterial color={p.metal} roughness={0.4} metalness={0.8} transparent opacity={0.35} />
        </mesh>
        <mesh position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#fff4e0" emissive="#ffcc44" emissiveIntensity={3} />
        </mesh>
        <pointLight position={[0, 1.55, 0]} intensity={0.8} color="#ffeecc" distance={4} />
      </group>
    )
  }

  // Modern: arc floor lamp (default)
  return (
    <group>
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.04, 16]} />
        <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.55, 8]} />
        <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0.3, 1.4, 0]} rotation={[0, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
        <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0.52, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.18, 0.25, 16, 1, true]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.8} side={2} />
      </mesh>
      <mesh position={[0.52, 1.18, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#fff4e0" emissive="#ffcc66" emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[0.52, 1.2, 0]} intensity={0.8} color="#ffedcc" distance={4} />
    </group>
  )
}

// -------------------------------------------------------------
// OTTOMAN COMPOSITE
// -------------------------------------------------------------
function OttomanComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isModern = styleKey === 'Modern'
  const segs = isModern ? 32 : 12
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[isModern ? 0.38 : 0.42, isModern ? 0.36 : 0.4, 0.28, segs]} />
        <meshStandardMaterial color={p.primary} roughness={isLuxury ? 0.3 : 0.85} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[isModern ? 0.36 : 0.40, isModern ? 0.34 : 0.38, 0.06, segs]} />
        <meshStandardMaterial color={p.secondary} roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3].map(i => {
        const ang = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(ang) * 0.32, 0.06, Math.sin(ang) * 0.32]} castShadow>
            <cylinderGeometry args={[0.02, 0.015, 0.12, 8]} />
            <meshStandardMaterial color={isLuxury ? p.metal : p.wood}
              roughness={isLuxury ? 0.2 : 0.6} metalness={isLuxury ? 0.8 : 0} />
          </mesh>
        )
      })}
    </group>
  )
}

// -------------------------------------------------------------
// DRESSER COMPOSITE
// -------------------------------------------------------------
function DresserComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isCozy = styleKey === 'Cozy'
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 1.0, 0.48]} />
        <meshStandardMaterial color={p.wood} roughness={0.7} />
      </mesh>
      {[0.12, 0.5, 0.88].map((y, row) =>
        [-0.27, 0.27].map((x, col) => (
          <mesh key={`d-${row}-${col}`} position={[x, y, 0.25]} castShadow>
            <boxGeometry args={[0.5, 0.28, 0.02]} />
            <meshStandardMaterial color={p.secondary} roughness={0.75} />
          </mesh>
        ))
      )}
      {[0.12, 0.5, 0.88].map((y, row) =>
        [-0.27, 0.27].map((x, col) => (
          <mesh key={`h-${row}-${col}`} position={[x, y, 0.27]}>
            <boxGeometry args={[0.12, 0.02, 0.025]} />
            <meshStandardMaterial color={isLuxury ? '#c9a227' : '#888'}
              roughness={0.3} metalness={0.7} />
          </mesh>
        ))
      )}
      <mesh position={[0, 1.02, 0]} castShadow>
        <boxGeometry args={[1.12, 0.04, 0.5]} />
        <meshStandardMaterial color={p.wood} roughness={0.6} />
      </mesh>
      {(isLuxury || isCozy) && (
        <>
          <mesh position={[0, 1.55, -0.06]} castShadow>
            <boxGeometry args={[0.7, 1.0, 0.03]} />
            <meshStandardMaterial color={p.wood} roughness={0.65} />
          </mesh>
          <mesh position={[0, 1.55, -0.045]}>
            <boxGeometry args={[0.62, 0.9, 0.01]} />
            <meshStandardMaterial color="#c8d0d8" roughness={0.02} metalness={0.9} />
          </mesh>
        </>
      )}
    </group>
  )
}

// -------------------------------------------------------------
// SIDE TABLE VARIANT
// -------------------------------------------------------------
function SideTableComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isMinimal = styleKey === 'Minimal'
  const isLuxury = styleKey === 'Luxury'

  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 20]} />
        <meshStandardMaterial color={isMinimal ? '#ffffff' : isLuxury ? '#d4af37' : p.wood} roughness={isMinimal ? 0.1 : isLuxury ? 0.2 : 0.5} metalness={isMinimal ? 0.4 : isLuxury ? 0.7 : 0} />
      </mesh>
      {/* Small bedside lamp / decor on top */}
      {isLuxury && (
        <mesh position={[0, 0.54, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.04, 8]} />
          <meshStandardMaterial color={p.accent} roughness={0.2} metalness={0.8} />
        </mesh>
      )}
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * 0.12, 0.25, Math.sin(angle) * 0.12]} rotation={[0, 0, (Math.cos(angle) > 0 ? -1 : 1) * 0.08]} castShadow>
          <cylinderGeometry args={[0.015, 0.02, 0.5, 6]} />
          <meshStandardMaterial color={p.metal} roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// -------------------------------------------------------------
// RUG / AREA RUG VARIANT
// -------------------------------------------------------------
function RugComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isBohemian = styleKey === 'Bohemian'
  const isCoastal = styleKey === 'Coastal'
  const isMinimal = styleKey === 'Minimal'
  const isModern = styleKey === 'Modern'

  // Pick rug colors based on style
  const rugColor = isLuxury ? '#8b0000' : isBohemian ? '#c17a4a' : isCoastal ? '#5f9ea0' :
    isMinimal ? '#d4d4d4' : isModern ? '#2d333b' : p.primary
  const patternColor = isLuxury ? '#d4af37' : isBohemian ? '#f0e6d8' : isCoastal ? '#f0f8ff' :
    isMinimal ? '#f8f8f8' : isModern ? '#8fa0b5' : p.secondary

  return (
    <group>
      {/* Main rug base */}
      <mesh name="rug-base" position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[2.5, 0.02, 1.5]} />
        <meshStandardMaterial color={rugColor} roughness={1.0} />
      </mesh>
      {/* Border strip */}
      <mesh position={[0, 0.016, 0]} receiveShadow>
        <boxGeometry args={[2.5, 0.005, 1.5]} />
        <meshStandardMaterial color={patternColor} roughness={1.0} transparent opacity={0.35} />
      </mesh>
      {/* Inner border rectangle */}
      {[[-1.1, 0, 0, .06, 0.004, 1.38], [1.1, 0, 0, .06, 0.004, 1.38],
        [0, 0, -0.67, 2.3, 0.004, .06], [0, 0, 0.67, 2.3, 0.004, .06]].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x as number, 0.018 + (y as number), z as number]} receiveShadow>
          <boxGeometry args={[w as number, h as number, d as number]} />
          <meshStandardMaterial color={patternColor} roughness={0.9} />
        </mesh>
      ))}
      {/* Center medallion for luxury/bohemian */}
      {(isLuxury || isBohemian) && (
        <mesh position={[0, 0.018, 0]} receiveShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.005, 16]} />
          <meshStandardMaterial color={patternColor} roughness={0.9} />
        </mesh>
      )}
      {/* Coastal: stripe pattern */}
      {isCoastal && [- 0.6, -0.2, 0.2, 0.6].map((z, i) => (
        <mesh key={i} position={[0, 0.018, z]} receiveShadow>
          <boxGeometry args={[2.4, 0.005, 0.1]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#ffffff' : patternColor} roughness={0.9} opacity={0.5} transparent />
        </mesh>
      ))}
    </group>
  )
}


const VALID_STYLES: DominantStyle[] = ['Cozy','Minimal','Modern','Luxury','Compact','Bohemian','Industrial','Coastal']

export function FurnitureInstance({ item, styleSliders }: { item: FurnitureItem; styleSliders?: Record<string, number> }) {
  const appearanceKey=useStudioStore(s=>`${s.cabinetColor}|${s.countertopColor}|${s.metalFinish}`)
  // If item has a _swapStyle override from the swap panel, use that instead of global style
  const swapStyle = item._swapStyle as DominantStyle | undefined
  const dominantStyle = useMemo(() => {
    if (swapStyle && VALID_STYLES.includes(swapStyle)) return swapStyle
    return parseDominantStyle(styleSliders)
  }, [styleSliders, swapStyle])

  const renderGeometry = () => {
    switch (item.type) {
      case 'sofa':       return <SofaComposite styleKey={dominantStyle} />
      case 'bed':        return <BedComposite styleKey={dominantStyle} />
      case 'wardrobe':   return <WardrobeComposite styleKey={dominantStyle} />
      case 'tvUnit':     return <TvUnitComposite styleKey={dominantStyle} />
      case 'table':      return <TableComposite styleKey={dominantStyle} />
      case 'chair':      return <ChairComposite styleKey={dominantStyle} />
      case 'bookshelf':  return <BookshelfComposite styleKey={dominantStyle} />
      case 'plant':      return <PlantComposite styleKey={dominantStyle} />
      case 'floorLamp':  return <FloorLampComposite styleKey={dominantStyle} />
      case 'sideTable':  return <SideTableComposite styleKey={dominantStyle} />
      case 'rug':        return <RugComposite styleKey={dominantStyle} />
      case 'ottoman':    return <OttomanComposite styleKey={dominantStyle} />
      case 'dresser':    return <DresserComposite styleKey={dominantStyle} />
      default:           return <RoomSpecificFurniture type={item.type} style={dominantStyle}/>
    }
  }

  const geometryRef=useRef<THREE.Group>(null)
  useLayoutEffect(()=>{
    const group=geometryRef.current;if(!group)return
    group.position.set(0,0,0);group.scale.set(1,1,1)
    const parent=group.parent;group.removeFromParent();group.updateMatrixWorld(true)
    const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3())
    if(parent)parent.add(group)
    const spec=furnitureCatalog[item.type].targetSizeM
    const target={...spec,x:item.widthM??spec.x,z:item.depthM??spec.z}
    if(size.x>0&&size.y>0&&size.z>0){
      group.scale.set(target.x/size.x,Math.min(target.y/size.y,Math.max(target.x/size.x,target.z/size.z)),target.z/size.z)
      group.position.set(-center.x*group.scale.x,-bounds.min.y*group.scale.y,-center.z*group.scale.z)
    }
    group.traverse(obj=>{if((obj as THREE.Mesh).isMesh){
      const mesh=obj as THREE.Mesh
      const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material]
      materials.forEach(mat=>{if((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial){
        const material=mat as THREE.MeshStandardMaterial
        if(!material.userData.originalColor)material.userData.originalColor=material.color.clone()
        material.color.copy(material.userData.originalColor)
        if(item.color)material.color.multiply(new THREE.Color(item.color))
      }})
    }})
  },[item.type,dominantStyle,item.color,item.widthM,item.depthM,appearanceKey])
  return <group position={[item.x,item.y??0,item.z]} rotation={[0,item.rotationY,0]} scale={item.scale}><group ref={geometryRef} key={`${dominantStyle}:${appearanceKey}`}>{renderGeometry()}</group></group>
}
