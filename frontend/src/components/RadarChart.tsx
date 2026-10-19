// RadarChart — SVG parameter trade-off visualization
import type { Metrics } from '../types/layout'

/**
 * SVG Radar Chart for visualizing fuzzy logic parameter trade-offs.
 * Renders 5 axes: Space, Comfort, Style, Clearance, Budget.
 */

type RadarAxis = {
  key: keyof Metrics
  label: string
  max: number
}

const AXES: RadarAxis[] = [
  { key: 'spaceUtilizationPct', label: 'Space', max: 100 },
  { key: 'comfortIndexPct', label: 'Comfort', max: 100 },
  { key: 'styleAlignmentPct', label: 'Aesthetic', max: 100 },
  { key: 'clearanceScorePct', label: 'Flow', max: 100 },
  { key: 'budgetCompliancePct', label: 'Budget', max: 100 },
]

const SIZE = 180
const CENTER = SIZE / 2
const RADIUS = 68
const LEVELS = 4

function polarToCart(angle: number, r: number): [number, number] {
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)]
}

export function RadarChart({
  metrics,
  prevMetrics,
}: {
  metrics: Metrics
  prevMetrics?: Metrics | null
}) {
  const n = AXES.length
  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2 // Start from top

  // Build polygon points for current metrics
  const points = AXES.map((axis, i) => {
    const rawVal = metrics ? metrics[axis.key] : undefined
    const parsed = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal as any)
    const safeVal = isFinite(parsed) ? parsed : 0
    const clampedVal = Math.max(0, Math.min(safeVal, axis.max))
    const val = clampedVal / axis.max
    const angle = startAngle + i * angleStep
    return polarToCart(angle, val * RADIUS)
  })
  const polygon = points.map(([x, y]) => `${x},${y}`).join(' ')

  // Previous metrics polygon (ghost)
  let prevPolygon = ''
  if (prevMetrics) {
    const prevPoints = AXES.map((axis, i) => {
      const rawVal = prevMetrics ? prevMetrics[axis.key] : undefined
      const parsed = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal as any)
      const safeVal = isFinite(parsed) ? parsed : 0
      const clampedVal = Math.max(0, Math.min(safeVal, axis.max))
      const val = clampedVal / axis.max
      const angle = startAngle + i * angleStep
      return polarToCart(angle, val * RADIUS)
    })
    prevPolygon = prevPoints.map(([x, y]) => `${x},${y}`).join(' ')
  }

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full h-auto"
    >
      <defs>
        <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="radarGhostFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* Grid levels */}
      {Array.from({ length: LEVELS }, (_, li) => {
        const r = ((li + 1) / LEVELS) * RADIUS
        const gridPoints = Array.from({ length: n }, (_, i) => {
          const angle = startAngle + i * angleStep
          return polarToCart(angle, r)
        })
        const gridPoly = gridPoints.map(([x, y]) => `${x},${y}`).join(' ')
        return (
          <polygon
            key={li}
            points={gridPoly}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        )
      })}

      {/* Axis lines */}
      {AXES.map((_, i) => {
        const angle = startAngle + i * angleStep
        const [ex, ey] = polarToCart(angle, RADIUS)
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={ex}
            y2={ey}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
          />
        )
      })}

      {/* Previous metrics ghost polygon */}
      {prevPolygon && (
        <polygon
          points={prevPolygon}
          fill="url(#radarGhostFill)"
          stroke="#F59E0B"
          strokeWidth="1"
          strokeOpacity="0.4"
          strokeDasharray="3,2"
          className="transition-all duration-500"
        />
      )}

      {/* Current metrics polygon */}
      <polygon
        points={polygon}
        fill="url(#radarFill)"
        stroke="url(#radarStroke)"
        strokeWidth="1.5"
        className="transition-all duration-500"
      />

      {/* Data points */}
      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="2.5"
          fill="#38BDF8"
          stroke="#0a0a0f"
          strokeWidth="1"
          className="transition-all duration-500"
        />
      ))}

      {/* Axis labels */}
      {AXES.map((axis, i) => {
        const angle = startAngle + i * angleStep
        const [lx, ly] = polarToCart(angle, RADIUS + 16)
        return (
          <text
            key={axis.key}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-white/50 text-[7px] font-medium tracking-wider uppercase"
          >
            {axis.label}
          </text>
        )
      })}

      {/* Value labels on current data points */}
      {AXES.map((axis, i) => {
        const rawVal = metrics ? metrics[axis.key] : undefined
        const parsed = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal as any)
        const safeVal = isFinite(parsed) ? parsed : 0
        const clampedVal = Math.max(0, Math.min(safeVal, axis.max))
        const val = Math.round(clampedVal)
        const angle = startAngle + i * angleStep
        const valR = (clampedVal / axis.max) * RADIUS
        const [vx, vy] = polarToCart(angle, Math.max(valR - 12, 8))
        return (
          <text
            key={`val-${axis.key}`}
            x={vx}
            y={vy}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-white/70 text-[6px] font-bold"
          >
            {val}
          </text>
        )
      })}
    </svg>
  )
}
