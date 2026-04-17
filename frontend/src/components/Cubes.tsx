import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export interface CubesProps {
  gridSize?: number
  maxAngle?: number
  radius?: number
  borderStyle?: string
  faceColor?: string
  rippleColor?: string
  rippleSpeed?: number
  autoAnimate?: boolean
  rippleOnClick?: boolean
}

export default function Cubes({
  gridSize = 8,
  maxAngle = 45,
  radius = 3,
  borderStyle = "2px dashed #B19EEF",
  faceColor = "#1a1a2e",
  rippleColor = "#ff6b6b",
  rippleSpeed = 1.5,
  autoAnimate = false,
  rippleOnClick = true
}: CubesProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    container.innerHTML = ''
    container.style.display = 'grid'
    container.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`
    container.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.position = 'absolute'
    container.style.inset = '0'

    const totalCubes = gridSize * gridSize
    const cubes: HTMLDivElement[] = []

    for (let i = 0; i < totalCubes; i++) {
        const cube = document.createElement('div')
        cube.className = 'gsap-cube'
        cube.style.width = '100%'
        cube.style.height = '100%'
        cube.style.border = borderStyle
        cube.style.backgroundColor = faceColor
        cube.style.transformOrigin = 'center center'
        cube.style.transition = 'background-color 0.4s ease'
        // Pre-rotate slightly for an organic feel
        const initRot = (Math.random() - 0.5) * maxAngle
        gsap.set(cube, { rotation: initRot, scale: 0.9 })
        
        container.appendChild(cube)
        cubes.push(cube)

        if (rippleOnClick) {
            cube.addEventListener('click', () => {
                triggerRipple(i)
            })
        }
    }

    const triggerRipple = (index: number) => {
      const col = index % gridSize
      const row = Math.floor(index / gridSize)

      gsap.to(cubes, {
        duration: rippleSpeed,
        scale: 0.5,
        rotation: (i) => {
           const c = i % gridSize
           const r = Math.floor(i / gridSize)
           const dist = Math.sqrt(Math.pow(c - col, 2) + Math.pow(r - row, 2))
           return (Math.random() - 0.5) * maxAngle * (10 / maxAngle) * dist
        },
        backgroundColor: rippleColor,
        ease: "power2.out",
        stagger: {
          amount: rippleSpeed,
          grid: [gridSize, gridSize],
          from: index
        },
        onComplete: () => {
           gsap.to(cubes, {
             duration: rippleSpeed * 1.5,
             scale: 0.9,
             rotation: () => (Math.random() - 0.5) * maxAngle,
             backgroundColor: faceColor,
             ease: "elastic.out(1, 0.3)",
             stagger: {
               amount: rippleSpeed,
               grid: [gridSize, gridSize],
               from: index
             }
           })
        }
      })
    }

    if (autoAnimate) {
        const centerIndex = Math.floor(gridSize / 2) * gridSize + Math.floor(gridSize / 2)
        setTimeout(() => triggerRipple(centerIndex), 500)
    }

    // Cursor tracking parallax effect
    const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        cubes.forEach((cube, i) => {
            const col = i % gridSize
            const row = Math.floor(i / gridSize)
            const cx = (col + 0.5) * (rect.width / gridSize)
            const cy = (row + 0.5) * (rect.height / gridSize)
            
            const dx = mouseX - cx
            const dy = mouseY - cy
            const dist = Math.sqrt(dx*dx + dy*dy)
            
            // Interaction radius: 300px
            const influence = Math.max(0, 300 - dist) / 300
            
            if (influence > 0) {
                gsap.to(cube, {
                    rotationX: -dy * 0.05 * influence,
                    rotationY: dx * 0.05 * influence,
                    z: 20 * influence, // pull up slightly
                    scale: 0.9 + (0.15 * influence),
                    duration: 0.3,
                    ease: "power2.out",
                    overwrite: "auto"
                })
            } else {
                gsap.to(cube, {
                    rotationX: 0,
                    rotationY: 0,
                    z: 0,
                    scale: 0.9,
                    duration: 0.6,
                    ease: "power2.out",
                    overwrite: "auto"
                })
            }
        })
    }

    const handleMouseLeave = () => {
         gsap.to(cubes, { rotationX: 0, rotationY: 0, z: 0, scale: 0.9, duration: 1, ease: "power2.out", overwrite: "auto" })
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
       container.removeEventListener('mousemove', handleMouseMove)
       container.removeEventListener('mouseleave', handleMouseLeave)
       cubes.forEach(c => gsap.killTweensOf(c))
    }
  }, [gridSize, maxAngle, radius, borderStyle, faceColor, rippleColor, rippleSpeed, autoAnimate, rippleOnClick])

  return (
    <div 
        className="cubes-wrapper" 
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, opacity: 0.4 }}
    >
        <div ref={containerRef} />
        {/* Subtle blur overlay for depth */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent, var(--bg-primary) 80%)', pointerEvents: 'none' }} />
    </div>
  )
}
