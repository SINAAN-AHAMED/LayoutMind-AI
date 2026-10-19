import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { FurnitureItem, StyleChip } from '../../types/layout'
import { FurnitureInstance } from '../../three/FurnitureInstance'

/**
 * GhostFurniture
 * 
 * Renders a previous generation's furniture layout at low opacity (0.3)
 * to allow direct visual comparison with the current layout.
 * Positions smoothly interpolate using useFrame.
 */
export function GhostFurniture({
  items,
  styleSliders,
}: {
  items: FurnitureItem[]
  styleSliders: Record<StyleChip, number>
}) {
  const groupRef = useRef<THREE.Group>(null)

  // Smooth fade-in
  useFrame(() => {
    if (groupRef.current) {
      const targetOpacity = 0.3
      groupRef.current.children.forEach((child) => {
        child.traverse((obj: any) => {
          if (obj.isMesh && obj.material) {
            if (!obj.material._ghostInitialized) {
              obj.material = obj.material.clone()
              obj.material.transparent = true
              obj.material.opacity = 0
              obj.material.depthWrite = false
              obj.material._ghostInitialized = true
            }
            obj.material.opacity = THREE.MathUtils.lerp(
              obj.material.opacity,
              targetOpacity,
              0.05
            )
          }
        })
      })
    }
  })

  return (
    <group ref={groupRef} name="ghost-generation">
      {items.map((item) => (
        <FurnitureInstance
          key={`ghost-${item.id}`}
          item={item}
          styleSliders={styleSliders}
        />
      ))}
    </group>
  )
}
