import { useEffect, useRef } from 'react'

// Pure CSS/Canvas 2D animated background — avoids nested R3F Canvas conflicts
export function AbstractBackground({ variant = 'default' }: { variant?: 'default' | 'luxury' | 'cozy' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const COLORS = {
    default: { a: '#3b82f6', b: '#8b5cf6', c: '#06b6d4' },
    luxury:  { a: '#10b981', b: '#d4af37', c: '#c026d3' },
    cozy:    { a: '#f59e0b', b: '#ef4444', c: '#f97316' },
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let t = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const cols = COLORS[variant]


    const draw = () => {
      if (!ctx) return
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // Draw 3 animated orbs
      const orbs = [
        { x: 0.3 + 0.25 * Math.sin(t * 0.7), y: 0.3 + 0.2 * Math.cos(t * 0.5), r: 0.45, color: cols.a },
        { x: 0.7 + 0.2 * Math.cos(t * 0.6), y: 0.6 + 0.2 * Math.sin(t * 0.8), r: 0.38, color: cols.b },
        { x: 0.5 + 0.3 * Math.sin(t * 0.4 + 1), y: 0.8 + 0.15 * Math.cos(t * 0.9), r: 0.32, color: cols.c },
      ]

      for (const orb of orbs) {
        const ox = orb.x * w
        const oy = orb.y * h
        const radius = orb.r * Math.min(w, h)
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius)
        grad.addColorStop(0, orb.color + 'aa')
        grad.addColorStop(1, orb.color + '00')
        ctx.beginPath()
        ctx.arc(ox, oy, radius, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      t += 0.008
      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [variant])

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-50 mix-blend-screen"
        style={{ display: 'block' }}
      />
    </div>
  )
}
