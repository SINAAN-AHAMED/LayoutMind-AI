import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function AnimatedSphere({ color, speed = 2, distort = 0.4 }: { color: string, speed?: number, distort?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3
    }
  })

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={2}>
      <MeshDistortMaterial color={color} attach="material" distort={distort} speed={speed} roughness={0.2} metalness={0.8} />
    </Sphere>
  )
}

export function AbstractBackground({ variant = 'default' }: { variant?: 'default' | 'luxury' | 'cozy' }) {
  const colors = {
    default: '#3b82f6',
    luxury: '#10b981',
    cozy: '#f59e0b',
  }
  
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 mix-blend-screen opacity-60">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#f472b6" />
        <AnimatedSphere color={colors[variant]} speed={1.5} distort={0.5} />
      </Canvas>
    </div>
  )
}
