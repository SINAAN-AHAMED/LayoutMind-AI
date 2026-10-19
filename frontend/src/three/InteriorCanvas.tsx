import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import { FurnitureInstance } from './FurnitureInstance'
import { Room } from './Room'
import { GhostFurniture } from '../components/GenerationHistory/GhostFurniture'
import { useMemo, Suspense, useRef } from 'react'
import * as THREE from 'three'
import type { StyleChip, FurnitureItem } from '../types/layout'
import type { StyleSliders } from './Room'

// Static constant — avoids recreation on every render
const ITEM_HALF_DIMS: Record<string, [number, number]> = {
  bed:       [0.95, 1.05],
  sofa:      [1.15, 0.50],
  table:     [0.60, 0.40],
  chair:     [0.30, 0.30],
  wardrobe:  [0.80, 0.40],
  tvUnit:    [0.90, 0.25],
  bookshelf: [0.60, 0.20],
  plant:     [0.25, 0.25],
  floorLamp: [0.20, 0.20],
  sideTable: [0.25, 0.25],
  rug:       [1.25, 0.75],
}

function AnimatedScene({ 
  lengthM, widthM, styleSliders, roomType, displayItems,
  ghostItems, showGhost,
}: { 
  lengthM: number; widthM: number; styleSliders: StyleSliders; roomType: 'Bedroom' | 'Living Room'; displayItems: FurnitureItem[]
  ghostItems: FurnitureItem[]; showGhost: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)

  // Smooth drop-in entrance animation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.05)
      groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, 1, 0.05)
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, 1, 0.05)
      groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, 1, 0.05)
    }
  })

  return (
    <group ref={groupRef} position={[0, -5, 0]} scale={[0.8, 0.8, 0.8]}>
      <Room lengthM={lengthM} widthM={widthM} styleSliders={styleSliders} roomType={roomType} />
      
      {/* Ghost overlay from previous generation */}
      {showGhost && ghostItems.length > 0 && (
        <GhostFurniture items={ghostItems} styleSliders={styleSliders} />
      )}

      {displayItems.map((it) => (
        <FurnitureInstance key={it.id} item={it} styleSliders={styleSliders} />
      ))}
      
      <ContactShadows position={[0, 0.002, 0]} opacity={0.6} scale={Math.max(lengthM, widthM) * 2} blur={1.5} far={4} />
    </group>
  )
}

export function InteriorCanvas({ 
  solution,
  ghostItems = [],
  showGhost = false,
}: { 
  solution: any
  ghostItems?: FurnitureItem[]
  showGhost?: boolean
}) {
  const selectedStyles = solution?.selectedStyles || ['Modern']
  
  const styleSliders = useMemo(() => {
    const base = { Cozy: 0, Minimal: 0, Modern: 0, Luxury: 0, Compact: 0, Bohemian: 0, Industrial: 0, Coastal: 0 } as Record<StyleChip, number>
    selectedStyles.forEach((s: StyleChip) => { base[s] = 1.0 })
    return base
  }, [selectedStyles])

  const displayItems = useMemo(() => {
    if (!solution?.room || !solution?.items) return []
    const { lengthM, widthM } = solution.room
    return solution.items.map((it: FurnitureItem) => {
      const halfW = widthM / 2
      const halfL = lengthM / 2
      const [hw, hd] = ITEM_HALF_DIMS[it.type] ?? [0.25, 0.25]
      const margin = 0.15  // wall gap
      const x = Math.max(-halfW + hw + margin, Math.min(halfW - hw - margin, it.x))
      const z = Math.max(-halfL + hd + margin, Math.min(halfL - hd - margin, it.z))
      return { ...it, x, z }
    })
  }, [solution?.items, solution?.room])

  if (!solution?.room) return null

  const { lengthM, widthM, type: roomType } = solution.room

  return (
    <div className="h-full w-full bg-transparent overflow-hidden relative">
      
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.5]}
        camera={{
          position: [
            Math.max(lengthM, widthM) * 0.85,
            Math.max(lengthM, widthM) * 0.55,
            Math.max(lengthM, widthM) * 1.1,
          ],
          fov: 42,
        }}
        gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      >
        <fog attach="fog" args={['#030305', Math.max(lengthM, widthM) * 2.5, Math.max(lengthM, widthM) * 5]} />
        
        {/* Single unified lighting setup — no duplicates */}
        <ambientLight intensity={selectedStyles.includes('Luxury') ? 0.35 : 0.6} />
        
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={selectedStyles.includes('Cozy') ? 1.2 : 1.8} 
          color={selectedStyles.includes('Cozy') ? "#ffedda" : "#ffffff"} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-8, 12, -5]} intensity={0.3} color="#dde4ff" />

        <Suspense fallback={null}>
          <AnimatedScene 
            lengthM={lengthM} 
            widthM={widthM} 
            styleSliders={styleSliders} 
            roomType={roomType} 
            displayItems={displayItems}
            ghostItems={ghostItems}
            showGhost={showGhost}
          />
        </Suspense>
        
        <OrbitControls
          makeDefault
          autoRotate={false}
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={0.05}
          minDistance={2}
          maxDistance={Math.max(lengthM, widthM) * 3}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}
