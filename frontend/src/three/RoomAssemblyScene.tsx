import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, PresentationControls } from '@react-three/drei'
import { useRef, useEffect, Suspense } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'

export function RoomAssemblyScene({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  return (
    <Canvas shadows className="w-full h-full pointer-events-none">
       <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={45} />
       <Suspense fallback={null}>
         <ambientLight intensity={0.8} />
         <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
         <directionalLight position={[-10, 10, -5]} intensity={0.5} />
       </Suspense>
       
       <PresentationControls global snap={true} speed={1} zoom={1} rotation={[0, -Math.PI / 4, 0]}>
         <scene position={[0,-1,0]}>
           <RoomGeometry sectionRef={sectionRef} />
         </scene>
       </PresentationControls>
    </Canvas>
  )
}

function RoomGeometry({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const wallMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const floorMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const furnitureGroupRef = useRef<THREE.Group>(null)
  const progressRef = useRef({ val: 0 })

  useEffect(() => {
    if (!sectionRef.current) return
    const ctx = gsap.context(() => {
       gsap.to(progressRef.current, {
         val: 1,
         ease: 'none',
         scrollTrigger: {
           trigger: sectionRef.current,
           start: 'top top',
           end: 'bottom top',
           scrub: true
         }
       })
    }, sectionRef)
    return () => ctx.revert()
  }, [sectionRef])

  useFrame(() => {
    const p = progressRef.current.val

    // Floor Color: Light Grey -> Oak (#a67c52)
    if (floorMaterialRef.current) {
       floorMaterialRef.current.color.lerpColors(
         new THREE.Color('#d1d5db'), 
         new THREE.Color('#a67c52'), 
         p
       )
    }

    // Wall Color: Cool Grey -> Warm Offwhite (#F7F3EE)
    if (wallMaterialRef.current) {
       wallMaterialRef.current.color.lerpColors(
         new THREE.Color('#e2e8f0'), 
         new THREE.Color('#F7F3EE'), 
         p
       )
    }

    // Furniture Slide In
    if (furnitureGroupRef.current) {
       furnitureGroupRef.current.children.forEach((child, index) => {
         // Staggered threshold
         const startP = index * 0.15 + 0.2
         const endP = startP + 0.2
         let localP = (p - startP) / (endP - startP)
         localP = Math.max(0, Math.min(1, localP))
         
         // Apply spring-like easing manually (or simple easeOut)
         const easedP = 1 - Math.pow(1 - localP, 3)
         
         child.position.y = THREE.MathUtils.lerp(5, 0, easedP)
         // We also hide it if localP === 0 to avoid seeing it clip
         child.visible = localP > 0.01
       })
    }
  })

  return (
    <group>
      {/* Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial ref={floorMaterialRef} color="#d1d5db" />
      </mesh>
      
      {/* Left Wall */}
      <mesh receiveShadow position={[-3, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 6]} />
        <meshStandardMaterial ref={wallMaterialRef} color="#e2e8f0" />
      </mesh>
      
      {/* Back Wall */}
      <mesh receiveShadow position={[0, 1.5, -3]}>
        <boxGeometry args={[6, 3, 0.2]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>

      {/* Furniture Items */}
      <group ref={furnitureGroupRef}>
         {/* Sofa mock */}
         <mesh castShadow receiveShadow position={[0, 0, -1]}>
           <boxGeometry args={[2, 0.6, 0.8]} />
           <meshStandardMaterial color="#4A90D9" />
         </mesh>
         
         {/* Table mock */}
         <mesh castShadow receiveShadow position={[0, 0, 0.5]}>
           <cylinderGeometry args={[0.6, 0.6, 0.4, 32]} />
           <meshStandardMaterial color="#ffffff" />
         </mesh>
         
         {/* Bookshelf mock */}
         <mesh castShadow receiveShadow position={[-2.5, 0, 1]}>
           <boxGeometry args={[0.6, 2.5, 1]} />
           <meshStandardMaterial color="#8b5cf6" />
         </mesh>
      </group>
    </group>
  )
}
