import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { FurnitureInstance } from './FurnitureInstance'
import { Room } from './Room'
import { useMemo, Suspense, useRef } from 'react'
import * as THREE from 'three'
import type { StyleChip } from '../types/layout'

function AnimatedScene({ 
  lengthM, widthM, styleSliders, roomType, displayItems 
}: { 
  lengthM: number; widthM: number; styleSliders: any; roomType: any; displayItems: any[] 
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
      
      {displayItems.map((it: any) => (
        <FurnitureInstance key={it.id} item={it} styleSliders={styleSliders} />
      ))}
      
      <ContactShadows position={[0, 0.002, 0]} opacity={0.6} scale={Math.max(lengthM, widthM) * 2} blur={1.5} far={4} />
    </group>
  )
}

export function InteriorCanvas({ solution }: { solution: any }) {
  const { lengthM, widthM, type: roomType } = solution.room
  const selectedStyles = solution.selectedStyles || ['Modern']
  
  const styleSliders = useMemo(() => {
    const base = { Cozy: 0, Minimal: 0, Modern: 0, Luxury: 0, Compact: 0, Bohemian: 0, Industrial: 0, Coastal: 0 } as Record<StyleChip, number>
    selectedStyles.forEach((s: StyleChip) => { base[s] = 1.0 })
    return base
  }, [selectedStyles])

  const displayItems = solution.items.map((it: any) => {
    const halfW = widthM / 2
    const halfL = lengthM / 2
    const x = Math.max(-halfW + 0.15, Math.min(halfW - 0.15, it.x))
    const z = Math.max(-halfL + 0.15, Math.min(halfL - 0.15, it.z))
    return { ...it, x, z }
  })

  return (
    <div className="h-full w-full bg-transparent overflow-hidden relative">
      
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.5]}
        camera={{ position: [0, Math.max(lengthM, widthM) * 0.8, Math.max(lengthM, widthM) * 1.2], fov: 45 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <fog attach="fog" args={['#030305', Math.max(lengthM, widthM) * 1.5, Math.max(lengthM, widthM) * 3]} />
        
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
          />
        </Suspense>
        
        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 2.1} minPolarAngle={0.1} />
      </Canvas>
    </div>
  )
}

