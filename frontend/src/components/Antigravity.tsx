import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface AntigravityProps {
  count?: number
  radius?: number
  magnetRadius?: number
  ringRadius?: number
  waveSpeed?: number
  waveAmplitude?: number
  particleSize?: number
  lerpSpeed?: number
  color?: string
  autoAnimate?: boolean
  particleVariance?: number
  rotationSpeed?: number
  depthFactor?: number
  pulseSpeed?: number
  particleShape?: 'plane' | 'tetrahedron' | 'sphere' | 'box'
  fieldStrength?: number
}

function CursorOrbitalField({
  count = 2500,
  radius = 25,
  magnetRadius = 6,
  ringRadius = 7,
  waveSpeed = 0.4,
  waveAmplitude = 1,
  particleSize = 1.5,
  lerpSpeed = 0.05,
  color = '#5227FF',
  autoAnimate = true,
  particleVariance = 1,
  rotationSpeed = 0.08,
  depthFactor = 1,
  pulseSpeed = 3,
  particleShape = 'tetrahedron',
  fieldStrength = 10,
}: AntigravityProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { mouse, camera, size } = useThree()
  const timeRef = useRef(0)

  // Parse base color and create gradient palette
  const baseColor = useMemo(() => new THREE.Color(color), [color])

  const particles = useMemo(() => {
    const temp = []
    const colorStart = baseColor.clone()
    const colorMid = new THREE.Color().setHSL(
      (baseColor.getHSL({ h: 0, s: 0, l: 0 }).h + 0.15) % 1,
      0.8, 0.55
    )
    const colorEnd = new THREE.Color().setHSL(
      (baseColor.getHSL({ h: 0, s: 0, l: 0 }).h + 0.35) % 1,
      0.75, 0.5
    )

    const phi = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < count; i++) {
      const r = radius * Math.sqrt(i / count) + 0.1
      const theta = i * phi

      const x = Math.cos(theta) * r
      const y = Math.sin(theta) * r
      const z = (Math.random() - 0.5) * 2 * depthFactor

      const angle = Math.atan2(y, x)

      const c = new THREE.Color()
      const mix = (angle + Math.PI) / (Math.PI * 2)
      if (mix < 0.33) c.lerpColors(colorStart, colorMid, mix * 3)
      else if (mix < 0.66) c.lerpColors(colorMid, colorEnd, (mix - 0.33) * 3)
      else c.lerpColors(colorEnd, colorStart, (mix - 0.66) * 3)

      // Radial fade
      if (r > radius * 0.8) {
        c.lerp(new THREE.Color('#0a0a12'), (r - radius * 0.8) / (radius * 0.2))
      }

      // Size variance
      const sizeVar = 1 + (Math.random() - 0.5) * particleVariance * 0.6

      temp.push({
        initialPos: new THREE.Vector3(x, y, z),
        currentPos: new THREE.Vector3(x, y, z),
        targetPos: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, angle),
        color: c,
        phase: Math.random() * Math.PI * 2,
        r,
        sizeVar,
      })
    }
    return temp
  }, [count, radius, baseColor, depthFactor, particleVariance])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  const colorArray = useMemo(() => {
    const arr = new Float32Array(count * 3)
    particles.forEach((p, i) => {
      arr[i * 3 + 0] = p.color.r
      arr[i * 3 + 1] = p.color.g
      arr[i * 3 + 2] = p.color.b
    })
    return arr
  }, [particles, count])

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3)
    }
  }, [colorArray])

  useFrame((state, delta) => {
    timeRef.current += delta
    const t = timeRef.current
    if (!meshRef.current) return

    // Convert mouse to 3D plane
    const vec = new THREE.Vector3(mouse.x, mouse.y, 0.5)
    vec.unproject(camera)
    const dir = vec.sub(camera.position).normalize()
    const distance = -camera.position.z / dir.z
    const pointerPos = camera.position.clone().add(dir.multiplyScalar(distance))

    particles.forEach((p, i) => {
      // Idle breathing / pulsing
      const breathe = Math.sin(t * waveSpeed + p.phase) * waveAmplitude * 0.15
      const pulse = Math.sin(t * pulseSpeed + p.phase * 2) * 0.02
      const naturalPos = p.initialPos.clone().multiplyScalar(1 + breathe * 0.08 + pulse)

      // Mouse magnetic field interaction
      const distToMouse = pointerPos.distanceTo(naturalPos)
      const effectiveRadius = magnetRadius + ringRadius * 0.5

      if (distToMouse < effectiveRadius) {
        const pullStr = Math.pow((effectiveRadius - distToMouse) / effectiveRadius, 1.5)
        const forceDir = naturalPos.clone().sub(pointerPos).normalize()

        // Tangential twist for liquid swirl effect
        const twist = new THREE.Vector3(-forceDir.y, forceDir.x, 0)
          .multiplyScalar(pullStr * fieldStrength * 0.3)

        // Radial repulsion
        const repulsion = forceDir.clone().multiplyScalar(pullStr * fieldStrength * 0.45)

        p.targetPos.copy(naturalPos).add(repulsion).add(twist)

        // Ring formation at magnetRadius boundary
        if (distToMouse > magnetRadius * 0.7 && distToMouse < ringRadius * 1.2) {
          const ringDir = naturalPos.clone().sub(pointerPos).normalize()
          const ringPos = pointerPos.clone().add(ringDir.multiplyScalar(ringRadius))
          p.targetPos.lerp(ringPos, pullStr * 0.3)
        }

        // Rotate particle to align with flow
        const targetAngle = Math.atan2(p.targetPos.y, p.targetPos.x) + pullStr * 2.0
        p.rotation.z = THREE.MathUtils.lerp(p.rotation.z, targetAngle, 0.15)
      } else {
        p.targetPos.copy(naturalPos)
        const targetAngle = Math.atan2(p.targetPos.y, p.targetPos.x)
        p.rotation.z = THREE.MathUtils.lerp(p.rotation.z, targetAngle, 0.04)
      }

      // Spring physics lerp
      p.currentPos.lerp(p.targetPos, lerpSpeed + 0.05)

      // Global slow spin (autoAnimate)
      const globalAngle = autoAnimate ? t * rotationSpeed : 0
      const cosA = Math.cos(globalAngle)
      const sinA = Math.sin(globalAngle)

      dummy.position.set(
        p.currentPos.x * cosA - p.currentPos.y * sinA,
        p.currentPos.x * sinA + p.currentPos.y * cosA,
        p.currentPos.z
      )
      dummy.rotation.set(
        t * 0.2 + p.phase,
        t * 0.15 + p.phase * 0.5,
        p.rotation.z + globalAngle
      )

      // Scale with distance fade and variance
      const distFade = Math.max(0.15, 1 - (p.r / radius))
      const s = particleSize * 0.08 * distFade * p.sizeVar
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()

      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  // Choose geometry based on particleShape
  const geometry = useMemo(() => {
    switch (particleShape) {
      case 'tetrahedron':
        return <tetrahedronGeometry args={[1, 0]} />
      case 'sphere':
        return <sphereGeometry args={[1, 6, 6]} />
      case 'box':
        return <boxGeometry args={[1, 1, 1]} />
      case 'plane':
      default:
        return <planeGeometry args={[1, 1]} />
    }
  }, [particleShape])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {geometry}
      <meshBasicMaterial
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

export default function Antigravity(props: AntigravityProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: true,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
        style={{ pointerEvents: 'auto' }}
      >
        <CursorOrbitalField {...props} />
      </Canvas>
    </div>
  )
}
