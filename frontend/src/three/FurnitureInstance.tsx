import { useMemo } from 'react'
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
  Modern:     { primary: '#2d333b', secondary: '#4a535e', metal: '#8fa0b5', wood: '#3c3a38', accent: '#38bdf8' },
  Luxury:     { primary: '#1a2238', secondary: '#8a6a2f', metal: '#d4af37', wood: '#0d0d0d', accent: '#c9a227' },
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

  // L-Sectional for Luxury / Modern
  if (isLuxury || isModern) {
    return (
      <group>
        {/* Main seat body */}
        <RoundedBox args={[2.2, 0.22, 0.95]} radius={0.05} smoothness={4} position={[0, 0.3, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Right arm extension seat */}
        <RoundedBox args={[0.9, 0.22, 0.85]} radius={0.05} smoothness={4} position={[1.5, 0.3, -0.5]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Seat cushions - main */}
        <RoundedBox args={[0.92, 0.15, 0.88]} radius={0.05} smoothness={4} position={[-0.6, 0.45, 0]} castShadow receiveShadow>{isModern ? Accent : Fabric}</RoundedBox>
        <RoundedBox args={[0.92, 0.15, 0.88]} radius={0.05} smoothness={4} position={[0.5, 0.45, 0]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Seat cushion - L-arm */}
        <RoundedBox args={[0.85, 0.15, 0.8]} radius={0.05} smoothness={4} position={[1.5, 0.45, -0.5]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Main backrest */}
        <RoundedBox args={[2.2, 0.55, 0.22]} radius={0.05} smoothness={4} position={[0, 0.67, -0.37]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* L-arm backrest */}
        <RoundedBox args={[0.22, 0.55, 0.85]} radius={0.04} smoothness={4} position={[2.05, 0.67, -0.5]} castShadow receiveShadow>{Fabric}</RoundedBox>
        {/* Low modern legs */}
        {[-1.0, 1.0].map(x => [-0.38, 0.38].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.07, z]} castShadow>
            <boxGeometry args={[0.06, 0.12, 0.06]} />
            {Legs}
          </mesh>
        )))}
        {/* Throw pillows */}
        {isLuxury && <>
          <RoundedBox args={[0.35, 0.3, 0.12]} radius={0.04} smoothness={3} position={[-1.5, 0.62, -0.2]} rotation={[0.1, 0.2, 0.05]} castShadow>
            <meshStandardMaterial color={p.accent} roughness={0.7} />
          </RoundedBox>
          <RoundedBox args={[0.28, 0.28, 0.1]} radius={0.04} smoothness={3} position={[0.1, 0.62, -0.2]} rotation={[0.05, -0.3, 0.08]} castShadow>
            <meshStandardMaterial color={p.secondary} roughness={0.7} />
          </RoundedBox>
        </>}
      </group>
    )
  }

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

  const WoodBody = <meshStandardMaterial color={p.wood} roughness={0.6} metalness={0.05} />
  const Screen = <meshStandardMaterial color="#050505" roughness={0.05} metalness={0.9} />
  const Glow = <meshStandardMaterial color="#0a0a0a" emissive="#1d4ed8" emissiveIntensity={0.3} />
  const Metal = <meshStandardMaterial color={p.metal} roughness={isLuxury ? 0.2 : 0.4} metalness={0.8} />

  return (
    <group>
      {/* Console Base */}
      <RoundedBox args={[1.8, 0.4, 0.45]} radius={0.015} smoothness={4} position={[0, 0.2, 0]} castShadow receiveShadow>
        {WoodBody}
      </RoundedBox>

      {/* Floating Shelf for Modern/Luxury */}
      {(isModern || isLuxury) && (
        <RoundedBox args={[1.8, 0.06, 0.3]} radius={0.01} smoothness={3} position={[0, 0.48, 0.05]} castShadow receiveShadow>
          {WoodBody}
        </RoundedBox>
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

      {/* Gold/Metal handles for Luxury */}
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
      <RoundedBox args={[1.5, 0.85, 0.04]} radius={0.015} smoothness={3} position={[0, 0.9, -0.08]} castShadow receiveShadow>
        {Screen}
      </RoundedBox>
      {/* Screen glow panel */}
      <mesh position={[0, 0.9, -0.05]}>
        <boxGeometry args={[1.45, 0.8, 0.01]} />
        {Glow}
      </mesh>
      {/* LED backlight for Luxury/Modern */}
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

      {/* Industrial metal legs */}
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

  const Fabric = <meshStandardMaterial color={p.primary} roughness={0.8} />
  const LegMat = <meshStandardMaterial color={p.metal} metalness={0.6} roughness={0.4} />

  // Eames-style shell for Modern
  if (isModern) {
    return (
      <group>
        <RoundedBox args={[0.52, 0.08, 0.52]} radius={0.04} smoothness={4} position={[0, 0.45, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={p.secondary} roughness={0.4} />
        </RoundedBox>
        <RoundedBox args={[0.5, 0.44, 0.08]} radius={0.04} smoothness={4} position={[0, 0.7, -0.2]} castShadow receiveShadow>
          <meshStandardMaterial color={p.secondary} roughness={0.4} />
        </RoundedBox>
        {[[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.22, z]} castShadow>
            <cylinderGeometry args={[0.018, 0.014, 0.45, 8]} />
            {LegMat}
          </mesh>
        ))}
        {/* Eames cross brace under seat */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.42, 0.02, 0.02]} />
          {LegMat}
        </mesh>
        <mesh position={[0, 0.12, 0]} rotation={[0, Math.PI/2, 0]} castShadow>
          <boxGeometry args={[0.42, 0.02, 0.02]} />
          {LegMat}
        </mesh>
      </group>
    )
  }

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
  const shelfRows = isMinimal ? 3 : 5
  for (let row = 0; row < shelfRows; row++) {
    const y = 0.28 + row * 0.42
    const count = isMinimal ? 4 : 7 + Math.floor(Math.random() * 3)
    let x = -0.52
    for (let b = 0; b < count; b++) {
      const w = 0.04 + Math.random() * 0.04
      const h = 0.22 + Math.random() * 0.12
      const color = bookColors[Math.floor(Math.random() * bookColors.length)]
      const lean = Math.random() > 0.85 ? (Math.random() * 0.3 - 0.15) : 0
      books.push(
        <mesh key={`b-${row}-${b}`} position={[x + w / 2, y + h / 2, 0]} rotation={[0, 0, lean]} castShadow>
          <boxGeometry args={[w, h, 0.22]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      )
      x += w + 0.005
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

  // Cactus for Industrial/Minimal
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

  // Default plant
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
      {[[0, 0.9, 0, 0.22], [-0.1, 0.8, 0.08, 0.16], [0.12, 0.85, -0.05, 0.15], [0.05, 0.95, 0.1, 0.13], [-0.08, 0.95, -0.08, 0.14]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 12, 12]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#2d6a2e' : '#3a8a3a'} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

// -------------------------------------------------------------
// FLOOR LAMP VARIANT
// -------------------------------------------------------------
function FloorLampComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isIndustrial = styleKey === 'Industrial'
  const isModern = styleKey === 'Modern'

  return (
    <group>
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.04, 16]} />
        <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.55, 8]} />
        <meshStandardMaterial color={isLuxury ? p.metal : isIndustrial ? '#8a8a8a' : '#333333'} roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Arc arm for Modern */}
      {isModern && (
        <mesh position={[0.3, 1.4, 0]} rotation={[0, 0, -0.6]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
          <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.8} />
        </mesh>
      )}
      <mesh position={isModern ? [0.52, 1.2, 0] : [0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.18, 0.25, isIndustrial ? 6 : 16, 1, true]} />
        <meshStandardMaterial color={isLuxury ? p.secondary : isIndustrial ? '#3c3c3c' : '#f5f0e8'} roughness={0.8} side={2} />
      </mesh>
      <mesh position={isModern ? [0.52, 1.18, 0] : [0, 1.5, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#fff4e0" emissive="#ffcc66" emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={isModern ? [0.52, 1.2, 0] : [0, 1.5, 0]} intensity={0.8} color="#ffedcc" distance={4} />
      {/* Industrial cage */}
      {isIndustrial && (
        <mesh position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.18, 6, 6]} />
          <meshStandardMaterial color={p.metal} roughness={0.4} metalness={0.8} transparent opacity={0.3} />
        </mesh>
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
// MAIN EXPORT
// -------------------------------------------------------------
export function FurnitureInstance({ item, styleSliders }: { item: FurnitureItem; styleSliders?: Record<string, number> }) {
  const dominantStyle = useMemo(() => parseDominantStyle(styleSliders), [styleSliders])

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
      default:           return null
    }
  }

  return (
    <group
      position={[item.x, 0, item.z]}
      rotation={[0, item.rotationY, 0]}
      scale={[item.scale, item.scale, item.scale]}
    >
      {renderGeometry()}
    </group>
  )
}
