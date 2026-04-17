import { useMemo } from 'react'
import * as THREE from 'three'
import type { StyleChip } from '../types/layout'
import { useStudioStore } from '../store/useStudioStore'

export type StyleSliders = Record<StyleChip, number>

// ====================================================
// STYLE PALETTES — comprehensive per-style definitions
// ====================================================
const STYLE_PALETTES = {
  Cozy: {
    floor: '#9c7a56', floorRoughness: 0.88, wall: '#f5e8d8', wallRoughness: 0.95,
    accentWall: '#e8d0b8', baseboard: '#c9b49a', ceiling: '#fdf8f3',
    rug: '#c17a4a', curtain: '#d4834a', trim: '#bfaa92',
  },
  Minimal: {
    floor: '#e2ddd8', floorRoughness: 0.35, wall: '#ffffff', wallRoughness: 0.92,
    accentWall: '#f7f7f7', baseboard: '#e4e4e4', ceiling: '#ffffff',
    rug: '#d8d8d8', curtain: '#efefef', trim: '#e0e0e0',
  },
  Modern: {
    floor: '#7a7269', floorRoughness: 0.42, wall: '#e4e4e4', wallRoughness: 0.82,
    accentWall: '#2d333b', baseboard: '#3a3a3a', ceiling: '#f2f2f2',
    rug: '#3d3d3d', curtain: '#222222', trim: '#2a2a2a',
  },
  Luxury: {
    floor: '#121212', floorRoughness: 0.15, wall: '#f5f3ef', wallRoughness: 0.75,
    accentWall: '#1a2238', baseboard: '#c9a227', ceiling: '#ffffff',
    rug: '#1e3a5f', curtain: '#6a0020', trim: '#c9a227',
  },
  Compact: {
    floor: '#b0a898', floorRoughness: 0.82, wall: '#f2ede8', wallRoughness: 0.9,
    accentWall: '#e6e1db', baseboard: '#cec5bb', ceiling: '#f9f7f4',
    rug: '#c0b5a8', curtain: '#e2ddd8', trim: '#c0b8ac',
  },
  Bohemian: {
    floor: '#c49a6c', floorRoughness: 0.72, wall: '#fdfaf6', wallRoughness: 0.88,
    accentWall: '#e8963a', baseboard: '#d4a050', ceiling: '#faf7f0',
    rug: '#c06050', curtain: '#e07858', trim: '#d4a050',
  },
  Industrial: {
    floor: '#5a5248', floorRoughness: 0.55, wall: '#c8c5bf', wallRoughness: 0.75,
    accentWall: '#7a3828', baseboard: '#282828', ceiling: '#a8a8a8',
    rug: '#383838', curtain: '#1c1c1c', trim: '#181818',
  },
  Coastal: {
    floor: '#e0cba8', floorRoughness: 0.78, wall: '#f0f5f8', wallRoughness: 0.88,
    accentWall: '#7aaac0', baseboard: '#ffffff', ceiling: '#ffffff',
    rug: '#a0c8c8', curtain: '#dce8ef', trim: '#ffffff',
  },
}

export function getStyleColors(styleSliders: StyleSliders) {
  const keys = Object.keys(STYLE_PALETTES) as (keyof typeof STYLE_PALETTES)[]
  const total = keys.reduce((s, k) => s + (styleSliders[k as StyleChip] ?? 0), 0) || 1
  const weights = Object.fromEntries(keys.map(k => [k, (styleSliders[k as StyleChip] ?? 0) / total]))

  const blendHex = (key: keyof (typeof STYLE_PALETTES)['Cozy']): string => {
    let r = 0, g = 0, b = 0
    keys.forEach(k => {
      const hex = STYLE_PALETTES[k][key] as string
      const w = weights[k]
      r += parseInt(hex.slice(1, 3), 16) * w
      g += parseInt(hex.slice(3, 5), 16) * w
      b += parseInt(hex.slice(5, 7), 16) * w
    })
    return `#${Math.round(r).toString(16).padStart(2,'0')}${Math.round(g).toString(16).padStart(2,'0')}${Math.round(b).toString(16).padStart(2,'0')}`
  }
  const blendNum = (key: keyof (typeof STYLE_PALETTES)['Cozy']): number => {
    return keys.reduce((s, k) => s + (STYLE_PALETTES[k][key] as number) * weights[k], 0)
  }

  return {
    floor: blendHex('floor'), floorRoughness: blendNum('floorRoughness'),
    wall: blendHex('wall'), wallRoughness: blendNum('wallRoughness'),
    accentWall: blendHex('accentWall'), baseboard: blendHex('baseboard'),
    ceiling: blendHex('ceiling'), rug: blendHex('rug'),
    curtain: blendHex('curtain'), trim: blendHex('trim'),
  }
}

export function getStyleLighting(styleSliders: StyleSliders) {
  const keys = Object.keys(STYLE_PALETTES) as StyleChip[]
  const total = keys.reduce((s, k) => s + (styleSliders[k] ?? 0), 0) || 1
  const w = Object.fromEntries(keys.map(k => [k, (styleSliders[k] ?? 0) / total])) as Record<StyleChip, number>

  const warmth = ((w.Cozy ?? 0) * 0.9 + (w.Luxury ?? 0) * 0.7 + (w.Bohemian ?? 0) * 0.9 + (w.Coastal ?? 0) * 0.4)
  const brightness = ((w.Minimal ?? 0) * 1.0 + (w.Compact ?? 0) * 0.9 + (w.Modern ?? 0) * 0.8 + (w.Coastal ?? 0) * 1.0)
  const drama = ((w.Luxury ?? 0) * 0.8 + (w.Modern ?? 0) * 0.3 + (w.Industrial ?? 0) * 0.9)

  return {
    ambientIntensity: 0.35 + brightness * 0.4,
    ambientColor: warmth > 0.4 ? '#fff6e8' : '#ffffff',
    mainLightIntensity: 1.2 + brightness * 0.8,
    mainLightColor: warmth > 0.4 ? '#fff8f0' : '#ffffff',
    fillLightIntensity: 0.2 + drama * 0.3,
    accentLightIntensity: warmth * 0.5 + drama * 0.3,
  }
}

interface RoomProps {
  lengthM: number
  widthM: number
  wallH?: number
  styleSliders?: StyleSliders
  roomType?: 'Bedroom' | 'Living Room'
}

// ====================================================
// FLOOR TEXTURE — wood strips, tile grid, carpet
// ====================================================
function FloorTexture({ width, length, floorMaterial, colors }: {
  width: number; length: number;
  floorMaterial: string;
  colors: ReturnType<typeof getStyleColors>
}) {
  if (floorMaterial === 'Wood') {
    const planks = []
    const plankW = 0.18
    const count = Math.floor(width / plankW)
    for (let i = 0; i < count; i++) {
      const x = -width / 2 + plankW * (i + 0.5)
      if (Math.abs(x) > width / 2) continue  // Safety: skip if outside
      planks.push(
        <mesh key={i} position={[x, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[plankW - 0.01, length - 0.02]} />
          <meshStandardMaterial color={i % 2 === 0 ? colors.floor : shadeHex(colors.floor, 0.06)} roughness={colors.floorRoughness} />
        </mesh>
      )
    }
    return <group>{planks}</group>
  }
  if (floorMaterial === 'Tile') {
    const tiles = []
    const tileSize = 0.6
    const cols = Math.floor(width / tileSize)
    const rows = Math.floor(length / tileSize)
    const offsetX = (width - cols * tileSize) / 2  // Center the grid
    const offsetZ = (length - rows * tileSize) / 2
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = -width / 2 + offsetX + tileSize * (c + 0.5)
        const z = -length / 2 + offsetZ + tileSize * (r + 0.5)
        if (Math.abs(x) > width / 2 - 0.05 || Math.abs(z) > length / 2 - 0.05) continue
        const isAlt = (c + r) % 2 === 0
        tiles.push(
          <mesh key={`${c}-${r}`} position={[x, 0.003, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[tileSize - 0.02, tileSize - 0.02]} />
            <meshStandardMaterial color={isAlt ? '#e8e4e0' : '#d8d4d0'} roughness={0.15} metalness={0.05} />
          </mesh>
        )
      }
    }
    return <group>{tiles}</group>
  }
  return null
}

function shadeHex(hex: string, amount: number): string {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)))
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)))
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)))
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

// ====================================================
// WALL DECORATIONS — style-specific feature walls
// ====================================================
function WallDecorations({ width, length, wallH, styleSliders }: {
  width: number; length: number; wallH: number; styleSliders?: StyleSliders
}) {
  if (!styleSliders) return null
  const halfW = width / 2
  const halfL = length / 2
  const isLuxury = styleSliders.Luxury > 0.4
  const isModern = styleSliders.Modern > 0.45
  const isIndustrial = styleSliders.Industrial > 0.45
  const isCoastal = styleSliders.Coastal > 0.45
  const isBohemian = styleSliders.Bohemian > 0.45
  const isCozy = styleSliders.Cozy > 0.45

  return (
    <group>
      {/* ── MODERN: PVC fluted panels on accent wall ── */}
      {isModern && (
        <group position={[0, wallH / 2, -halfL + 0.01]}>
          <mesh receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color="#2d333b" roughness={0.85} />
          </mesh>
          {/* Fluted vertical strips */}
          <group position={[0, 0, 0.025]}>
            {Array.from({ length: Math.floor(width / 0.1) }).map((_, i) => {
              const x = -halfW + 0.05 + i * 0.1
              return (
                <mesh key={`flute-${i}`} position={[x, 0, 0]} castShadow>
                  <boxGeometry args={[0.06, wallH, 0.03]} />
                  <meshStandardMaterial color={i % 3 === 0 ? '#3a4048' : '#252b32'} roughness={0.55} />
                </mesh>
              )
            })}
          </group>
          {/* LED cove at base of accent wall */}
          <mesh position={[0, -wallH / 2 + 0.03, 0.04]}>
            <boxGeometry args={[width * 0.8, 0.015, 0.01]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3} />
          </mesh>
          <rectAreaLight width={width * 0.8} height={0.1} intensity={15} color="#38bdf8"
            position={[0, -wallH / 2 + 0.05, 0.04]} rotation={[Math.PI / 2, Math.PI, 0]} />
        </group>
      )}

      {/* ── LUXURY: Wainscoting + gold trim on accent wall ── */}
      {isLuxury && (
        <group>
          {/* Royal blue / navy accent wall */}
          <mesh position={[0, wallH / 2, -halfL + 0.01]} receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color="#1a2238" roughness={0.7} />
          </mesh>
          {/* Horizontal gold strips - dado rail */}
          {[0.25, 0.5, 0.75].map((yFrac, i) => (
            <mesh key={i} position={[0, wallH * yFrac, -halfL + 0.03]}>
              <boxGeometry args={[width, 0.025, 0.01]} />
              <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.15} />
            </mesh>
          ))}
          {/* Vertical gold pilasters */}
          {[-0.38, -0.12, 0.12, 0.38].map((xFrac, i) => (
            <mesh key={i} position={[width * xFrac, wallH / 2, -halfL + 0.03]}>
              <boxGeometry args={[0.02, wallH, 0.01]} />
              <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.15} />
            </mesh>
          ))}
          {/* Wainscoting panels lower section */}
          {[-0.25, 0.25].map((xFrac, i) => (
            <mesh key={i} position={[width * xFrac, wallH * 0.2, -halfL + 0.03]}>
              <boxGeometry args={[width * 0.44, wallH * 0.35, 0.02]} />
              <meshStandardMaterial color="#22304a" roughness={0.8} />
            </mesh>
          ))}
          {/* Right wall wood panelling */}
          <group position={[halfW - 0.02, wallH / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            {Array.from({ length: 4 }).map((_, i) => (
              <mesh key={i} position={[-length * 0.1 + i * length * 0.25, 0, 0.015]}>
                <boxGeometry args={[length * 0.2, wallH * 0.8, 0.025]} />
                <meshStandardMaterial color="#1e2a42" roughness={0.75} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* ── INDUSTRIAL: Exposed brick accent wall ── */}
      {isIndustrial && (
        <group position={[0, wallH / 2, -halfL + 0.01]}>
          <mesh receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color="#6a3828" roughness={0.95} />
          </mesh>
          {/* Brick courses */}
          {Array.from({ length: Math.ceil(wallH / 0.09) }).map((_, row) => {
            const y = -wallH / 2 + row * 0.09 + 0.045
            const offset = row % 2 === 0 ? 0 : 0.115
            return Array.from({ length: Math.ceil(width / 0.23) + 1 }).map((_, col) => {
              const x = -halfW + col * 0.23 + offset - 0.11
              return (
                <mesh key={`${row}-${col}`} position={[x, y, 0.008]}>
                  <boxGeometry args={[0.21, 0.07, 0.01]} />
                  <meshStandardMaterial color={row % 3 === 0 ? '#7a4030' : '#5a2818'} roughness={0.98} />
                </mesh>
              )
            })
          })}
          {/* Metal pipes on left wall */}
          <group position={[halfW - 0.02, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            {[wallH * 0.3, wallH * 0.6].map((y, i) => (
              <mesh key={i} position={[0, y - wallH / 2, 0.06]}>
                <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                <meshStandardMaterial color="#888" roughness={0.4} metalness={0.8} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* ── COASTAL: Ship-lap paneling ── */}
      {isCoastal && (
        <group position={[0, wallH / 2, -halfL + 0.01]}>
          <mesh receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color="#7aaac0" roughness={0.85} />
          </mesh>
          {/* Horizontal ship-lap boards */}
          {Array.from({ length: Math.ceil(wallH / 0.14) }).map((_, i) => (
            <mesh key={i} position={[0, -wallH / 2 + i * 0.14 + 0.07, 0.015]}>
              <boxGeometry args={[width, 0.12, 0.02]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#e8eef2' : '#dce4ea'} roughness={0.85} />
            </mesh>
          ))}
          {/* Rope detail */}
          <mesh position={[0, wallH * 0.3, 0.04]}>
            <cylinderGeometry args={[0.015, 0.015, width * 0.6, 8]} />
            <meshStandardMaterial color="#c8a870" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* ── BOHEMIAN: Terracotta plaster look + macramé ── */}
      {isBohemian && (
        <group>
          <mesh position={[0, wallH / 2, -halfL + 0.01]} receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color="#e8a060" roughness={0.95} />
          </mesh>
          {/* Arch window cutout effect */}
          <mesh position={[0, wallH * 0.55, -halfL + 0.03]}>
            <mesh>
              <ringGeometry args={[0, width * 0.18, 32, 1, 0, Math.PI]} />
              <meshStandardMaterial color="#d08040" roughness={0.95} />
            </mesh>
          </mesh>
          {/* Left wall tapestry/textile */}
          <group position={[-halfW + 0.03, wallH * 0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <boxGeometry args={[length * 0.22, wallH * 0.42, 0.02]} />
              <meshStandardMaterial color="#c06050" roughness={0.95} />
            </mesh>
            {/* Fringe strips */}
            {Array.from({ length: 8 }).map((_, i) => (
              <mesh key={i} position={[-length * 0.09 + i * length * 0.025, -wallH * 0.22, 0.015]}>
                <boxGeometry args={[0.01, 0.12, 0.01]} />
                <meshStandardMaterial color="#d4a070" roughness={0.95} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* ── COZY: Wainscoting + wallpaper ── */}
      {isCozy && (
        <group>
          {/* Warm textured accent wall */}
          <mesh position={[0, wallH / 2, -halfL + 0.01]} receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color="#e8c898" roughness={0.9} />
          </mesh>
          {/* Chair rail */}
          <mesh position={[0, wallH * 0.38, -halfL + 0.025]}>
            <boxGeometry args={[width, 0.04, 0.025]} />
            <meshStandardMaterial color="#c09870" roughness={0.7} />
          </mesh>
          {/* Wainscoting below */}
          <mesh position={[0, wallH * 0.18, -halfL + 0.025]}>
            <boxGeometry args={[width, wallH * 0.36, 0.03]} />
            <meshStandardMaterial color="#d4a880" roughness={0.85} />
          </mesh>
          {/* Vertical wainscoting lines */}
          {Array.from({ length: Math.floor(width / 0.5) }).map((_, i) => (
            <mesh key={i} position={[-halfW + 0.25 + i * 0.5, wallH * 0.18, -halfL + 0.042]}>
              <boxGeometry args={[0.02, wallH * 0.34, 0.012]} />
              <meshStandardMaterial color="#c09463" roughness={0.75} />
            </mesh>
          ))}
          {/* Fireplace on left wall */}
          {width > 4 && (
            <group position={[-halfW + 0.05, 0, length * 0.1]} rotation={[0, Math.PI / 2, 0]}>
              {/* Mantle surround */}
              <mesh position={[0, 0.65, 0.1]}>
                <boxGeometry args={[1.4, 1.2, 0.15]} />
                <meshStandardMaterial color="#c09870" roughness={0.75} />
              </mesh>
              {/* Firebox */}
              <mesh position={[0, 0.4, 0.12]}>
                <boxGeometry args={[0.85, 0.7, 0.05]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
              </mesh>
              {/* Fire glow */}
              <mesh position={[0, 0.38, 0.14]}>
                <boxGeometry args={[0.75, 0.55, 0.01]} />
                <meshStandardMaterial color="#ff6610" emissive="#ff4400" emissiveIntensity={2} transparent opacity={0.8} />
              </mesh>
              <pointLight position={[0, 0.4, 0.2]} intensity={1.5} color="#ff6610" distance={3} />
              {/* Mantle shelf */}
              <mesh position={[0, 1.28, 0.12]}>
                <boxGeometry args={[1.5, 0.06, 0.22]} />
                <meshStandardMaterial color="#b08860" roughness={0.65} />
              </mesh>
              {/* Mantle decor */}
              <mesh position={[0.4, 1.37, 0.12]}>
                <cylinderGeometry args={[0.04, 0.04, 0.22, 8]} />
                <meshStandardMaterial color="#d4a870" roughness={0.7} />
              </mesh>
            </group>
          )}
        </group>
      )}
    </group>
  )
}

// ====================================================
// CEILING DECORATIONS — gypsum, tray, drop ceiling
// ====================================================
function CeilingDecorations({ width, length, wallH, styleSliders }: {
  width: number; length: number; wallH: number; styleSliders?: StyleSliders
}) {
  if (!styleSliders) return null
  const isLuxury = styleSliders.Luxury > 0.4
  const isModern = styleSliders.Modern > 0.45
  const isCozy = styleSliders.Cozy > 0.45
  const isIndustrial = styleSliders.Industrial > 0.45

  return (
    <group position={[0, wallH, 0]}>
      {/* ── MODERN/LUXURY: Tray / Drop ceiling with cove light ── */}
      {(isModern || isLuxury) && (
        <group>
          {/* Outer ceiling plane - the drop border */}
          <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[width, length]} />
            <meshStandardMaterial color={isLuxury ? '#ffffff' : '#f2f2f2'} roughness={0.9} />
          </mesh>
          {/* Inner recessed section */}
          <mesh position={[0, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width - 0.7, length - 0.7]} />
            <meshStandardMaterial color={isLuxury ? '#f8f8f8' : '#ebebeb'} roughness={0.95} />
          </mesh>

          {/* COVE LIGHT STRIP GEOMETRY */}
          <group position={[0, -0.046, 0]}>
            {/* Front/back strips */}
            {[0, Math.PI].map((rot, i) => (
              <mesh key={i} position={[0, 0, (length / 2 - 0.38) * (i === 0 ? -1 : 1)]} rotation={[Math.PI / 2, rot, 0]}>
                <planeGeometry args={[width - 0.72, 0.05]} />
                <meshStandardMaterial color={isLuxury ? '#ffddaa' : '#a0d4ff'} emissive={isLuxury ? '#ffaa44' : '#38bdf8'} emissiveIntensity={6} transparent opacity={0.9} />
              </mesh>
            ))}
            {/* Left/right strips */}
            {[0, Math.PI].map((rot, i) => (
              <mesh key={`lr${i}`} position={[(width / 2 - 0.38) * (i === 0 ? -1 : 1), 0, 0]} rotation={[Math.PI / 2, rot + Math.PI / 2, 0]}>
                <planeGeometry args={[length - 0.72, 0.05]} />
                <meshStandardMaterial color={isLuxury ? '#ffddaa' : '#a0d4ff'} emissive={isLuxury ? '#ffaa44' : '#38bdf8'} emissiveIntensity={6} transparent opacity={0.9} />
              </mesh>
            ))}
            <rectAreaLight width={width - 0.75} height={length - 0.75} intensity={isLuxury ? 12 : 8}
              color={isLuxury ? '#ffcc88' : '#7dd3fc'} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} />
          </group>

          {/* Ceiling spotlights / downlights */}
          {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([xs, zs], i) => {
            const x = (width / 2 - 0.7) * xs
            const z = (length / 2 - 0.7) * zs
            return (
              <group key={`spot-${i}`} position={[x, -0.048, z]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.065, 24]} />
                  <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={isLuxury ? 1.5 : 1} />
                </mesh>
                <spotLight position={[0, 0, 0]} angle={0.45} penumbra={1} intensity={isLuxury ? 12 : 8}
                  castShadow target-position={[x, -wallH, z]} />
              </group>
            )
          })}

          {/* LUXURY: Coffered ceiling grid */}
          {isLuxury && (
            <group position={[0, -0.052, 0]}>
              {/* Grid beams */}
              {[-1, 0, 1].map((xi) => (
                <mesh key={`cx${xi}`} position={[xi * (width / 3 - 0.12), 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.05, length - 0.72]} />
                  <meshStandardMaterial color="#e8e4e0" roughness={0.8} />
                </mesh>
              ))}
              {[-1, 0, 1].map((zi) => (
                <mesh key={`cz${zi}`} position={[0, 0, zi * (length / 3 - 0.12)]} rotation={[Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[width - 0.72, 0.05]} />
                  <meshStandardMaterial color="#e8e4e0" roughness={0.8} />
                </mesh>
              ))}
            </group>
          )}

          {/* MODERN: Air vent grille */}
          {isModern && (
            <group position={[width / 2 - 0.6, -0.048, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.3, 0.12]} />
                <meshStandardMaterial color="#555" roughness={0.5} metalness={0.6} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ── COZY: Exposed beam ceiling ── */}
      {isCozy && (
        <group>
          <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[width, length]} />
            <meshStandardMaterial color="#faf5ee" roughness={0.9} />
          </mesh>
          {/* Wood beams across */}
          {Array.from({ length: Math.floor(length / 1.2) + 1 }).map((_, i) => {
            const z = -length / 2 + i * 1.2
            return (
              <mesh key={i} position={[0, -0.1, z]} castShadow>
                <boxGeometry args={[width + 0.1, 0.14, 0.18]} />
                <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
              </mesh>
            )
          })}
        </group>
      )}

      {/* ── INDUSTRIAL: Duct / exposed ceiling ── */}
      {isIndustrial && (
        <group>
          <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[width, length]} />
            <meshStandardMaterial color="#888" roughness={0.9} />
          </mesh>
          {/* HVAC duct */}
          <mesh position={[0, -0.15, 0]}>
            <boxGeometry args={[0.45, 0.22, length * 0.85]} />
            <meshStandardMaterial color="#6a6a6a" roughness={0.55} metalness={0.5} />
          </mesh>
          {/* Track light rail */}
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[width * 0.7, 0.04, 0.04]} />
            <meshStandardMaterial color="#333" roughness={0.4} metalness={0.8} />
          </mesh>
          {/* Pendants on rail */}
          {[-0.35, 0, 0.35].map((xFrac, i) => (
            <group key={i} position={[width * xFrac, -0.1, 0]}>
              <mesh>
                <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
                <meshStandardMaterial color="#555" roughness={0.4} metalness={0.8} />
              </mesh>
              <mesh position={[0, -0.3, 0]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.7} />
              </mesh>
              <mesh position={[0, -0.29, 0]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#fff8e0" emissive="#ffcc66" emissiveIntensity={2.5} />
              </mesh>
              <pointLight position={[0, -0.3, 0]} intensity={0.5} color="#ffeecc" distance={4} />
            </group>
          ))}
        </group>
      )}
    </group>
  )
}

// ====================================================
// BASEBOARD
// ====================================================
function Baseboard({ width, length, height, color, styleSliders }: {
  width: number; length: number; height: number; color: string; styleSliders?: StyleSliders
}) {
  const t = 0.025
  const halfW = width / 2
  const halfL = length / 2
  const isLuxury = styleSliders?.Luxury ?? 0 > 0.4
  const isModern = styleSliders?.Modern ?? 0 > 0.45

  const bh = isLuxury ? height * 1.4 : height
  const bc = isModern ? '#303030' : color
  const met = isLuxury ? 0.3 : 0
  const rou = isLuxury ? 0.3 : 0.75

  return (
    <group>
      {[
        [[0, bh / 2, -halfL + t / 2], [width, bh, t]],
        [[0, bh / 2, halfL - t / 2], [width, bh, t]],
        [[-halfW + t / 2, bh / 2, 0], [t, bh, length]],
        [[halfW - t / 2, bh / 2, 0], [t, bh, length]],
      ].map(([pos, size], i) => (
        <mesh key={i} position={pos as [number,number,number]}>
          <boxGeometry args={size as [number,number,number]} />
          <meshStandardMaterial color={bc} roughness={rou} metalness={met} />
        </mesh>
      ))}
    </group>
  )
}

// ====================================================
// CROWN MOLDING
// ====================================================
function CrownMolding({ width, length, wallH, color, styleSliders }: {
  width: number; length: number; wallH: number; color: string; styleSliders?: StyleSliders
}) {
  const halfW = width / 2
  const halfL = length / 2
  const mh = 0.1
  const md = 0.05
  const isLuxury = styleSliders?.Luxury ?? 0 > 0.4
  const isMinimal = styleSliders?.Minimal ?? 0 > 0.5
  const isModern = styleSliders?.Modern ?? 0 > 0.45

  if (isMinimal && !isLuxury) return null

  const mc = isModern ? '#2a2a2a' : isLuxury ? '#c9a227' : color
  const met = isLuxury ? 0.45 : 0
  const rou = isLuxury ? 0.25 : 0.7

  return (
    <group>
      {[
        [[0, wallH - mh / 2, -halfL + md / 2], [width, mh, md]],
        [[0, wallH - mh / 2, halfL - md / 2], [width, mh, md]],
        [[-halfW + md / 2, wallH - mh / 2, 0], [md, mh, length]],
        [[halfW - md / 2, wallH - mh / 2, 0], [md, mh, length]],
      ].map(([pos, size], i) => (
        <mesh key={i} position={pos as [number,number,number]}>
          <boxGeometry args={size as [number,number,number]} />
          <meshStandardMaterial color={mc} roughness={rou} metalness={met} />
        </mesh>
      ))}
      {/* Luxury double molding */}
      {isLuxury && [
        [[0, wallH - mh * 1.8, -halfL + md / 2], [width, mh * 0.5, md * 0.6]],
        [[0, wallH - mh * 1.8, halfL - md / 2], [width, mh * 0.5, md * 0.6]],
        [[-halfW + md / 2, wallH - mh * 1.8, 0], [md * 0.6, mh * 0.5, length]],
        [[halfW - md / 2, wallH - mh * 1.8, 0], [md * 0.6, mh * 0.5, length]],
      ].map(([pos, size], i) => (
        <mesh key={`d${i}`} position={pos as [number,number,number]}>
          <boxGeometry args={size as [number,number,number]} />
          <meshStandardMaterial color={mc} roughness={0.3} metalness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// ====================================================
// WINDOW WITH CURTAINS — style-specific
// ====================================================
function WindowWithCurtains({ width, length, wallH, curtainColor, styleSliders }: {
  width: number; length: number; wallH: number; curtainColor: string; styleSliders?: StyleSliders
}) {
  const halfL = length / 2
  const isMinimal = styleSliders?.Minimal ?? 0 > 0.5
  const isModern = styleSliders?.Modern ?? 0 > 0.45
  const isCozy = styleSliders?.Cozy ?? 0 > 0.45
  const isLuxury = styleSliders?.Luxury ?? 0 > 0.4
  const isCoastal = styleSliders?.Coastal ?? 0 > 0.45
  const isBohemian = styleSliders?.Bohemian ?? 0 > 0.45

  const winWidth = width * 0.42
  const winHeight = wallH * 0.58
  const winY = wallH * 0.5

  const frameColor = isModern ? '#1a1a1a' : isLuxury ? '#c9a227' : isCoastal ? '#ffffff' : '#e0e0e0'
  const frameMet = isLuxury ? 0.6 : 0
  const frameRou = isModern ? 0.35 : 0.55

  const showCurtains = !isMinimal || isCozy || isLuxury || isBohemian
  const curtainH = isLuxury ? wallH * 0.92 : isBohemian ? wallH * 0.8 : wallH * 0.72

  return (
    <group>
      {/* Sky/exterior glow */}
      <mesh position={[0, winY, -halfL + 0.005]}>
        <planeGeometry args={[winWidth, winHeight]} />
        <meshStandardMaterial color="#b0c8e0" roughness={0.9} emissive="#4a7a9b" emissiveIntensity={0.35} />
      </mesh>
      {/* Window frame — 4 bars */}
      {[
        [[0, winY + winHeight / 2 + 0.035, -halfL + 0.022], [winWidth + 0.12, 0.07, 0.045]],
        [[0, winY - winHeight / 2 - 0.035, -halfL + 0.022], [winWidth + 0.12, 0.07, 0.045]],
        [[-winWidth / 2 - 0.035, winY, -halfL + 0.022], [0.07, winHeight, 0.045]],
        [[winWidth / 2 + 0.035, winY, -halfL + 0.022], [0.07, winHeight, 0.045]],
      ].map(([pos, size], i) => (
        <mesh key={i} position={pos as [number,number,number]}>
          <boxGeometry args={size as [number,number,number]} />
          <meshStandardMaterial color={frameColor} metalness={frameMet} roughness={frameRou} />
        </mesh>
      ))}
      {/* Window divider cross */}
      <mesh position={[0, winY, -halfL + 0.022]}>
        <boxGeometry args={[winWidth, 0.04, 0.03]} />
        <meshStandardMaterial color={frameColor} metalness={frameMet} roughness={frameRou} />
      </mesh>
      <mesh position={[0, winY, -halfL + 0.022]}>
        <boxGeometry args={[0.04, winHeight, 0.03]} />
        <meshStandardMaterial color={frameColor} metalness={frameMet} roughness={frameRou} />
      </mesh>

      {/* Natural light */}
      <rectAreaLight width={winWidth} height={winHeight} intensity={isCoastal ? 20 : 12}
        color="#e8f0ff" position={[0, winY, -halfL + 0.1]} rotation={[0, 0, 0]} />

      {/* Curtains */}
      {showCurtains && (
        <>
          {/* Curtain rod */}
          <mesh position={[0, curtainH + 0.12, -halfL + 0.12]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, winWidth + 0.8, 8]} />
            <meshStandardMaterial color={isLuxury ? '#c9a227' : isModern ? '#333' : '#9a9a9a'} metalness={isLuxury ? 0.7 : 0.3} roughness={isLuxury ? 0.2 : 0.5} />
          </mesh>
          {/* Rod finials */}
          {[-1, 1].map(s => (
            <mesh key={s} position={[s * (winWidth / 2 + 0.4), curtainH + 0.12, -halfL + 0.12]}>
              <sphereGeometry args={[0.038, 12, 12]} />
              <meshStandardMaterial color={isLuxury ? '#c9a227' : '#9a9a9a'} metalness={0.7} roughness={0.2} />
            </mesh>
          ))}
          {/* Left curtain panel */}
          <mesh position={[-winWidth / 2 - 0.18, curtainH / 2, -halfL + 0.07]} castShadow>
            <boxGeometry args={[winWidth * 0.35, curtainH, 0.02]} />
            <meshStandardMaterial color={curtainColor} roughness={isCozy ? 0.92 : isBohemian ? 0.95 : 0.65} side={THREE.DoubleSide} />
          </mesh>
          {/* Right curtain panel */}
          <mesh position={[winWidth / 2 + 0.18, curtainH / 2, -halfL + 0.07]} castShadow>
            <boxGeometry args={[winWidth * 0.35, curtainH, 0.02]} />
            <meshStandardMaterial color={curtainColor} roughness={isCozy ? 0.92 : isBohemian ? 0.95 : 0.65} side={THREE.DoubleSide} />
          </mesh>
          {/* Curtain tie-backs for Cozy/Luxury */}
          {(isCozy || isLuxury) && [-1, 1].map(s => (
            <mesh key={s} position={[s * (winWidth / 2 + 0.18), curtainH * 0.45, -halfL + 0.08]}>
              <torusGeometry args={[0.06, 0.015, 8, 16, Math.PI]} />
              <meshStandardMaterial color={isLuxury ? '#c9a227' : '#8b7355'} metalness={isLuxury ? 0.7 : 0.2} roughness={0.4} />
            </mesh>
          ))}
          {/* Valance for Cozy */}
          {isCozy && (
            <mesh position={[0, curtainH + 0.15, -halfL + 0.065]}>
              <boxGeometry args={[winWidth + 0.7, 0.22, 0.08]} />
              <meshStandardMaterial color={curtainColor} roughness={0.9} />
            </mesh>
          )}
        </>
      )}
      {/* Minimal blinds */}
      {isMinimal && !showCurtains && (
        <mesh position={[0, winY, -halfL + 0.035]}>
          <boxGeometry args={[winWidth, winHeight, 0.01]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.5} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  )
}

// ====================================================
// WALL ART — style-specific paintings & decor
// ====================================================
function WallArt({ width, length, wallH, styleSliders, roomType }: {
  width: number; length: number; wallH: number;
  styleSliders?: StyleSliders; roomType: 'Bedroom' | 'Living Room'
}) {
  const halfW = width / 2
  const halfL = length / 2
  const isLuxury = styleSliders?.Luxury ?? 0 > 0.4
  const isModern = styleSliders?.Modern ?? 0 > 0.45
  const isCozy = styleSliders?.Cozy ?? 0 > 0.45
  const isMinimal = styleSliders?.Minimal ?? 0 > 0.5
  const isCoastal = styleSliders?.Coastal ?? 0 > 0.45
  const isBohemian = styleSliders?.Bohemian ?? 0 > 0.45
  const isIndustrial = styleSliders?.Industrial ?? 0 > 0.45

  const artY = wallH * 0.62
  const artW = width * 0.28
  const artH = wallH * 0.32
  const frameColor = isLuxury ? '#c9a227' : isModern ? '#1a1a1a' : '#5a5a5a'
  const frameMet = isLuxury ? 0.6 : 0.1
  const ft = isLuxury ? 0.045 : 0.022

  // Art fill colour by style
  const artFills = isLuxury ? ['#1a2238', '#2a3a5a'] :
                   isModern ? ['#2d333b', '#4a535e'] :
                   isCozy   ? ['#9c4221', '#d69e2e'] :
                   isCoastal ? ['#5f9ea0', '#88acc3'] :
                   isBohemian ? ['#c06050', '#e08050'] :
                   isIndustrial ? ['#4a4a4a', '#8a4032'] :
                   ['#1e3a5f', '#c9a227']

  return (
    <group>
      {/* Main painting on back wall */}
      <group position={[0, artY, -halfL + 0.005]}>
        {/* Frame */}
        <mesh>
          <boxGeometry args={[artW + ft * 2, artH + ft * 2, 0.025]} />
          <meshStandardMaterial color={frameColor} metalness={frameMet} roughness={0.45} />
        </mesh>
        {/* Canvas - divided sections */}
        <mesh position={[0, 0, 0.015]}>
          <boxGeometry args={[artW * 0.48, artH * 0.86, 0.01]} />
          <meshStandardMaterial color={artFills[0]} roughness={0.88} />
        </mesh>
        <mesh position={[artW * 0.26, 0, 0.015]}>
          <boxGeometry args={[artW * 0.46, artH * 0.86, 0.01]} />
          <meshStandardMaterial color={artFills[1]} roughness={0.88} />
        </mesh>
        {/* Picframe inner line for luxury */}
        {isLuxury && (
          <>
            {/* Gold inner mat border strips */}
            <mesh position={[0, (artH + ft) / 2, 0.013]}>
              <boxGeometry args={[artW + ft, 0.02, 0.01]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.2} />
            </mesh>
            <mesh position={[0, -(artH + ft) / 2, 0.013]}>
              <boxGeometry args={[artW + ft, 0.02, 0.01]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.2} />
            </mesh>
            <mesh position={[(artW + ft) / 2, 0, 0.013]}>
              <boxGeometry args={[0.02, artH + ft, 0.01]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.2} />
            </mesh>
            <mesh position={[-(artW + ft) / 2, 0, 0.013]}>
              <boxGeometry args={[0.02, artH + ft, 0.01]} />
              <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.2} />
            </mesh>
          </>
        )}
        {/* Small wall light / picture light */}
        {(isLuxury || isCozy) && (
          <>
            <mesh position={[0, artH / 2 + 0.08, 0.06]}>
              <boxGeometry args={[artW * 0.5, 0.04, 0.08]} />
              <meshStandardMaterial color={frameColor} metalness={0.5} roughness={0.3} />
            </mesh>
            <rectAreaLight width={artW * 0.5} height={0.04} intensity={8}
              color="#ffeecc" position={[0, artH / 2 + 0.07, 0.1]} rotation={[Math.PI * 0.3, 0, 0]} />
          </>
        )}
      </group>

      {/* Wall sconce / secondary art on right wall */}
      <group position={[halfW - 0.02, wallH * 0.55, -length * 0.12]} rotation={[0, -Math.PI / 2, 0]}>
        {isLuxury || isCoastal ? (
          /* Round mirror */
          <>
            <mesh>
              <torusGeometry args={[0.38, isLuxury ? 0.04 : 0.03, 16, 32]} />
              <meshStandardMaterial color={isLuxury ? '#c9a227' : '#c0c0c0'} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh>
              <circleGeometry args={[0.355, 32]} />
              <meshStandardMaterial color="#d0d8e0" metalness={0.9} roughness={0.04} />
            </mesh>
          </>
        ) : (
          /* Framed art */
          <>
            <mesh position={[0, 0, -0.005]}>
              <boxGeometry args={[length * 0.2 + 0.04, wallH * 0.22 + 0.04, 0.012]} />
              <meshStandardMaterial color={frameColor} metalness={frameMet} roughness={0.45} />
            </mesh>
            <mesh>
              <boxGeometry args={[length * 0.2, wallH * 0.22, 0.01]} />
              <meshStandardMaterial color={artFills[0]} roughness={0.88} />
            </mesh>
          </>
        )}
      </group>

      {/* Bohemian wall tapestry extra */}
      {isBohemian && (
        <group position={[-halfW + 0.025, wallH * 0.62, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[length * 0.25, wallH * 0.45, 0.025]} />
            <meshStandardMaterial color="#c06050" roughness={0.95} />
          </mesh>
          {/* Fringe */}
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i} position={[-length * 0.105 + i * length * 0.023, -wallH * 0.235, 0.02]}>
              <boxGeometry args={[0.012, 0.14, 0.012]} />
              <meshStandardMaterial color="#d4a060" roughness={0.95} />
            </mesh>
          ))}
        </group>
      )}

      {/* Industrial wall clock */}
      {isIndustrial && (
        <group position={[-halfW + 0.025, wallH * 0.65, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.28, 0.28, 0.04, 32]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.01, 32]} />
            <meshStandardMaterial color="#e0d8c8" roughness={0.8} />
          </mesh>
          {/* Clock hands */}
          <mesh position={[0.06, 0.04, 0]} rotation={[Math.PI / 2, 0, 0.5]}>
            <boxGeometry args={[0.01, 0.16, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0.02, 0.04, 0]} rotation={[Math.PI / 2, 0, 1.2]}>
            <boxGeometry args={[0.01, 0.1, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      )}

      {/* Modern floating shelf */}
      {isModern && (
        <group>
          <mesh position={[-halfW + 0.05, wallH * 0.5, length * 0.05]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[length * 0.2, 0.03, 0.22]} />
            <meshStandardMaterial color="#2d333b" roughness={0.4} metalness={0.1} />
          </mesh>
          {/* Shelf decor - small objects */}
          {[0, 0.08].map((zOff, i) => (
            <mesh key={i} position={[-halfW + 0.08, wallH * 0.52 + i * 0.05, length * 0.05 + zOff - length * 0.04]}>
              <boxGeometry args={[0.05, [0.15, 0.1][i], 0.05]} />
              <meshStandardMaterial color={i === 0 ? '#38bdf8' : '#8fa0b5'} roughness={0.5} />
            </mesh>
          ))}
        </group>
      )}

      {/* Living Room: additional shelf for Cozy/Luxury */}
      {roomType === 'Living Room' && (isCozy || isLuxury) && (
        <mesh position={[0, artY - artH / 2 - 0.09, -halfL + 0.09]}>
          <boxGeometry args={[artW + 0.22, 0.035, 0.16]} />
          <meshStandardMaterial color={isCozy ? '#8b7355' : '#c9a227'} roughness={0.6} metalness={isLuxury ? 0.3 : 0} />
        </mesh>
      )}
    </group>
  )
}

// ====================================================
// CEILING LIGHT FIXTURE — premium variants
// ====================================================
function CeilingLight({ width, length, wallH, styleSliders }: {
  width: number; length: number; wallH: number; styleSliders?: StyleSliders
}) {
  const isLuxury = styleSliders?.Luxury ?? 0 > 0.4
  const isModern = styleSliders?.Modern ?? 0 > 0.45
  const isBohemian = styleSliders?.Bohemian ?? 0 > 0.45
  const isCozy = styleSliders?.Cozy ?? 0 > 0.45
  const isCoastal = styleSliders?.Coastal ?? 0 > 0.45
  const isIndustrial = styleSliders?.Industrial ?? 0 > 0.45

  // Modern/Industrial use ceiling decoration lights
  if (isModern || isIndustrial) return null

  // Luxury chandelier
  if (isLuxury) {
    return (
      <group position={[0, wallH, 0]}>
        {/* Main rod */}
        <mesh position={[0, -0.35, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.7, 8]} />
          <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Canopy */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.1, 0.06, 0.1, 16]} />
          <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Arms */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const angle = (i / 6) * Math.PI * 2
          const r = 0.42
          return (
            <group key={i}>
              <mesh position={[Math.cos(angle) * r / 2, -0.7 + 0.06, Math.sin(angle) * r / 2]}
                rotation={[0.18, angle, 0]} castShadow>
                <cylinderGeometry args={[0.015, 0.012, r, 6]} />
                <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.2} />
              </mesh>
              {/* Crystal drop */}
              <mesh position={[Math.cos(angle) * r * 0.95, -0.85, Math.sin(angle) * r * 0.95]}>
                <octahedronGeometry args={[0.04, 0]} />
                <meshStandardMaterial color="#ffffff" roughness={0.01} metalness={0.1} transparent opacity={0.85} />
              </mesh>
              <pointLight position={[Math.cos(angle) * r * 0.8, -0.84, Math.sin(angle) * r * 0.8]}
                intensity={0.3} color="#ffeecc" distance={3} />
            </group>
          )
        })}
        {/* Central globe */}
        <mesh position={[0, -0.75, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} transparent opacity={0.88} emissive="#ffddaa" emissiveIntensity={0.3} />
        </mesh>
        <pointLight position={[0, -0.76, 0]} intensity={3} color="#ffedda" castShadow distance={10} />
      </group>
    )
  }

  // Bohemian rattan pendant
  if (isBohemian) {
    return (
      <group position={[0, wallH, 0]}>
        <mesh position={[0, -0.4, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.82, 0]} castShadow>
          <sphereGeometry args={[0.28, 10, 10]} />
          <meshStandardMaterial color="#c49a5a" roughness={0.9} transparent opacity={0.35} />
        </mesh>
        <mesh position={[0, -0.82, 0]} castShadow>
          <sphereGeometry args={[0.26, 10, 10]} />
          <meshStandardMaterial color="#d4a870" roughness={0.9} transparent opacity={0.4} />
        </mesh>
        <mesh position={[0, -0.8, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#fff4e0" emissive="#ffcc66" emissiveIntensity={2} />
        </mesh>
        <pointLight position={[0, -0.82, 0]} intensity={1.8} color="#ffeecc" distance={6} castShadow />
      </group>
    )
  }

  // Cozy/Coastal: classic pendant
  return (
    <group position={[0, wallH, 0]}>
      <mesh position={[0, -0.35, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 8]} />
        <meshStandardMaterial color={isCoastal ? '#c0c0c0' : '#6b5a46'} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, -0.78, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.22, 0.28, 16, 1, true]} />
        <meshStandardMaterial color={isCoastal ? '#e8f0f8' : '#e8d8c0'} roughness={0.75} side={2} />
      </mesh>
      <mesh position={[0, -0.72, 0]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#fff4e0" emissive="#ffcc66" emissiveIntensity={2.2} />
      </mesh>
      <pointLight position={[0, -0.78, 0]} intensity={2} color={isCoastal ? '#f0f8ff' : '#ffedcc'} distance={8} castShadow />
    </group>
  )
}

// ====================================================
// RUG — style-specific patterns
// ====================================================
function Rug({ widthM, lengthM, color, styleSliders }: {
  widthM: number; lengthM: number; color: string; styleSliders?: StyleSliders
}) {
  const isMinimal = styleSliders?.Minimal ?? 0 > 0.5
  const isModern = styleSliders?.Modern ?? 0 > 0.45
  const isLuxury = styleSliders?.Luxury ?? 0 > 0.4
  const isCozy = styleSliders?.Cozy ?? 0 > 0.45
  const isBohemian = styleSliders?.Bohemian ?? 0 > 0.45
  const isCoastal = styleSliders?.Coastal ?? 0 > 0.45

  if (isMinimal && !isCozy) return null

  const rw = widthM * 0.68
  const rl = lengthM * 0.58
  const borderColor = isLuxury ? '#c9a227' : isModern ? '#1a1a1a' : isCoastal ? '#5f9ea0' : '#8b7355'

  return (
    <group position={[0, 0.012, 0]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[rw, rl]} />
        <meshStandardMaterial color={color} roughness={isCozy ? 0.96 : isBohemian ? 0.95 : 0.72} />
      </mesh>
      {/* Border */}
      {(isLuxury || isModern || isCoastal) && (
        <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.min(rw, rl) * 0.42, Math.min(rw, rl) * 0.48, isModern ? 4 : 32]} />
          <meshStandardMaterial color={borderColor} roughness={0.5} metalness={isLuxury ? 0.25 : 0.05} />
        </mesh>
      )}
      {/* Inner pattern for cozy/bohemian */}
      {(isCozy || isBohemian) && (
        <>
          <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[rw * 0.85, rl * 0.85]} />
            <meshStandardMaterial color={borderColor} roughness={0.95} transparent opacity={0.25} />
          </mesh>
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[rw * 0.65, rl * 0.65]} />
            <meshStandardMaterial color={isBohemian ? '#c06050' : color} roughness={0.95} transparent opacity={0.35} />
          </mesh>
        </>
      )}
    </group>
  )
}

// ====================================================
// DECORATIVE PLANT CORNER
// ====================================================
function DecorativePlant({ width, length, styleSliders }: {
  width: number; length: number; styleSliders?: StyleSliders
}) {
  const isMinimal = styleSliders?.Minimal ?? 0 > 0.6
  const isModern = styleSliders?.Modern ?? 0 > 0.45
  if (isMinimal) return null

  const potX = width / 2 - 0.35
  const potZ = length / 2 - 0.35
  const potColor = isModern ? '#2d2d2d' : '#c67a4b'

  return (
    <group position={[potX, 0, potZ]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.11, 0.35, 12]} />
        <meshStandardMaterial color={potColor} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.135, 0.135, 0.025, 12]} />
        <meshStandardMaterial color="#3d2b1f" roughness={1} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.55, 8]} />
        <meshStandardMaterial color="#5c3c1e" roughness={0.8} />
      </mesh>
      {[[0,0.9,0,0.22], [-0.12,0.8,0.1,0.17], [0.14,0.85,-0.06,0.15], [0.06,0.93,0.12,0.13], [-0.1,0.96,-0.1,0.14]].map(([x,y,z,r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 10, 10]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#2d6a2e' : '#3a8040'} roughness={0.82} />
        </mesh>
      ))}
    </group>
  )
}

// ====================================================
// MAIN ROOM COMPONENT
// ====================================================
export function Room({ lengthM, widthM, wallH = 2.7, styleSliders, roomType = 'Living Room' }: RoomProps) {
  const halfW = widthM / 2
  const halfL = lengthM / 2
  const floorMaterial = useStudioStore(s => s.floorMaterial)
  const wallMaterial = useStudioStore(s => s.wallMaterial)

  const colors = useMemo(() => {
    let base = {
      floor: roomType === 'Bedroom' ? '#b0906a' : '#9a857a',
      floorRoughness: 0.82,
      wall: '#f5f5f4', wallRoughness: 0.94,
      accentWall: roomType === 'Living Room' ? '#e8e4df' : '#faf9f8',
      baseboard: '#e4e2e0', ceiling: '#ffffff',
      rug: '#a39382', curtain: '#e0dbd5', trim: '#d4d4d4',
    }
    if (styleSliders) base = getStyleColors(styleSliders)
    if (floorMaterial === 'Wood') { base.floor = '#7a5230'; base.floorRoughness = 0.5 }
    else if (floorMaterial === 'Tile') { base.floor = '#e0e6ec'; base.floorRoughness = 0.18 }
    else if (floorMaterial === 'Carpet') { base.floor = '#c8c4bc'; base.floorRoughness = 0.96 }
    if (wallMaterial === 'Panel') { base.wall = '#2d2d2d'; base.accentWall = '#1a1a1a' }
    else if (wallMaterial === 'Brick') { base.wall = '#7a3828'; base.wallRoughness = 1.0 }
    return base
  }, [styleSliders, roomType, floorMaterial, wallMaterial])

  const lighting = useMemo(() => {
    if (!styleSliders) return { ambientIntensity: 0.6, ambientColor: '#ffffff', mainLightIntensity: 1.8, mainLightColor: '#fff8f0', fillLightIntensity: 0.35, accentLightIntensity: 0.4 }
    return getStyleLighting(styleSliders)
  }, [styleSliders])

  return (
    <group>
      {/* ── Lighting ── */}
      <ambientLight intensity={lighting.ambientIntensity} color={lighting.ambientColor} />
      <directionalLight
        position={[halfW * 0.5, wallH * 3, halfL * 0.5]}
        intensity={lighting.mainLightIntensity}
        color={lighting.mainLightColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-camera-left={-halfW * 2}
        shadow-camera-right={halfW * 2}
        shadow-camera-top={halfL * 2}
        shadow-camera-bottom={-halfL * 2}
      />
      <hemisphereLight skyColor="#fff5e6" groundColor="#8a7a6a" intensity={0.25} />

      {/* ── Base Floor ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[widthM, lengthM]} />
        <meshStandardMaterial color={colors.floor} roughness={colors.floorRoughness} metalness={0.03} />
      </mesh>

      {/* ── Floor texture overlay ── */}
      <FloorTexture width={widthM} length={lengthM} floorMaterial={floorMaterial} colors={colors} />

      {/* ── Rug ── */}
      <Rug widthM={widthM} lengthM={lengthM} color={colors.rug} styleSliders={styleSliders} />

      {/* ── Back wall (accent) ── */}
      <mesh receiveShadow position={[0, wallH / 2, -halfL]}>
        <planeGeometry args={[widthM, wallH]} />
        <meshStandardMaterial color={colors.accentWall} roughness={colors.wallRoughness} />
      </mesh>
      {/* ── Front wall ── */}
      <mesh receiveShadow position={[0, wallH / 2, halfL]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[widthM, wallH]} />
        <meshStandardMaterial color={colors.wall} roughness={colors.wallRoughness} />
      </mesh>
      {/* ── Left wall ── */}
      <mesh receiveShadow position={[-halfW, wallH / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[lengthM, wallH]} />
        <meshStandardMaterial color={colors.wall} roughness={colors.wallRoughness} />
      </mesh>
      {/* ── Right wall ── */}
      <mesh receiveShadow position={[halfW, wallH / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[lengthM, wallH]} />
        <meshStandardMaterial color={colors.wall} roughness={colors.wallRoughness} />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh position={[0, wallH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[widthM, lengthM]} />
        <meshStandardMaterial color={colors.ceiling} roughness={0.92} />
      </mesh>

      {/* ── Architectural features ── */}
      <WallDecorations width={widthM} length={lengthM} wallH={wallH} styleSliders={styleSliders} />
      <CeilingDecorations width={widthM} length={lengthM} wallH={wallH} styleSliders={styleSliders} />
      <Baseboard width={widthM} length={lengthM} height={0.12} color={colors.baseboard} styleSliders={styleSliders} />
      <CrownMolding width={widthM} length={lengthM} wallH={wallH} color={colors.trim} styleSliders={styleSliders} />
      <WindowWithCurtains width={widthM} length={lengthM} wallH={wallH} curtainColor={colors.curtain} styleSliders={styleSliders} />
      <WallArt width={widthM} length={lengthM} wallH={wallH} styleSliders={styleSliders} roomType={roomType} />
      <CeilingLight width={widthM} length={lengthM} wallH={wallH} styleSliders={styleSliders} />

      {/* ── Corner decorative plant ── */}
      {Math.min(widthM, lengthM) > 3 && (
        <DecorativePlant width={widthM} length={lengthM} styleSliders={styleSliders} />
      )}

      {/* ── Wall sconce lights ── */}
      {widthM > 4 && (
        <>
          <group position={[halfW - 0.05, wallH * 0.5, 0]}>
            <mesh rotation={[0, -Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.06, 0.02, 0.1, 8]} />
              <meshStandardMaterial color={colors.trim} roughness={0.4} metalness={0.3} />
            </mesh>
            <mesh position={[-0.06, 0.04, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#fff8e0" emissive="#ffcc66" emissiveIntensity={2} />
            </mesh>
            <pointLight position={[-0.1, 0.04, 0]} intensity={0.6} color="#ffedcc" distance={3.5} />
          </group>
          <group position={[-halfW + 0.05, wallH * 0.5, 0]}>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.06, 0.02, 0.1, 8]} />
              <meshStandardMaterial color={colors.trim} roughness={0.4} metalness={0.3} />
            </mesh>
            <mesh position={[0.06, 0.04, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#fff8e0" emissive="#ffcc66" emissiveIntensity={2} />
            </mesh>
            <pointLight position={[0.1, 0.04, 0]} intensity={0.6} color="#ffedcc" distance={3.5} />
          </group>
        </>
      )}
    </group>
  )
}
