import * as React from 'react'
import { motion } from 'framer-motion'
import { useStudioStore } from '../store/useStudioStore'
import type { FloorMaterial, WallMaterial } from '../store/useStudioStore'

const FLOOR_OPTIONS: { value: FloorMaterial; label: string; color: string }[] = [
  { value: 'Wood',      label: 'Hardwood',   color: '#7a5230' },
  { value: 'Parquet',   label: 'Parquet',    color: '#9c7a56' },
  { value: 'Tile',      label: 'Tile',       color: '#e0e6ec' },
  { value: 'Marble',    label: 'Marble',     color: '#f0ece8' },
  { value: 'Granite',   label: 'Granite',    color: '#3a3632' },
  { value: 'Epoxy',     label: 'Epoxy',      color: '#e0ddd8' },
  { value: 'Carpet',    label: 'Carpet',     color: '#c8c4bc' },
  { value: 'Concrete',  label: 'Concrete',   color: '#909090' },
  { value: 'Terrazzo',  label: 'Terrazzo',   color: '#e8e2d8' },
]

const WALL_OPTIONS: { value: WallMaterial; label: string; color: string }[] = [
  { value: 'Plain',     label: 'Plain Paint',   color: '#f5f5f4' },
  { value: 'Plaster',   label: 'Plaster',       color: '#ede8e0' },
  { value: 'Lime',      label: 'Lime Wash',     color: '#e8e0d0' },
  { value: 'Wallpaper', label: 'Wallpaper',     color: '#e8dfd4' },
  { value: 'Textured',  label: 'Textured',      color: '#d8d0c8' },
  { value: 'Fabric',    label: 'Fabric Panel',  color: '#d4c8b8' },
  { value: 'Panel',     label: 'Wood Panel',    color: '#2d2d2d' },
  { value: 'Fluted',    label: 'Fluted PVC',    color: '#3a4048' },
  { value: 'Stone',     label: 'Stone',         color: '#8a8078' },
  { value: 'Brick',     label: 'Brick',         color: '#7a3828' },
  { value: 'Concrete',  label: 'Concrete',      color: '#909090' },
  { value: 'Ceramic',   label: 'Ceramic Tile',  color: '#d0ccc8' },
]

const WALL_COLORS = [
  { hex: '#ffffff', label: 'Pure White' },
  { hex: '#f5f5f4', label: 'Off White' },
  { hex: '#fdf6e3', label: 'Cream' },
  { hex: '#fce7c8', label: 'Warm Ivory' },
  { hex: '#e8d5b0', label: 'Sand' },
  { hex: '#d4c5a9', label: 'Greige' },
  { hex: '#c8b89a', label: 'Latte' },
  { hex: '#b5a48a', label: 'Warm Taupe' },
  { hex: '#8b7355', label: 'Caramel' },
  { hex: '#dde8e4', label: 'Sage Mist' },
  { hex: '#b8cec8', label: 'Sage Green' },
  { hex: '#7aaa94', label: 'Forest Sage' },
  { hex: '#d0dce8', label: 'Sky Blue' },
  { hex: '#8ab4cc', label: 'Steel Blue' },
  { hex: '#1a2238', label: 'Navy' },
  { hex: '#2d3748', label: 'Slate' },
  { hex: '#1a1a2e', label: 'Midnight' },
  { hex: '#f0e6f0', label: 'Blush' },
  { hex: '#e8d0d8', label: 'Rose' },
  { hex: '#c06080', label: 'Dusty Rose' },
  { hex: '#fef3c7', label: 'Lemon' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#92400e', label: 'Terracotta' },
  { hex: '#333333', label: 'Charcoal' },
]

// ── AutoCAD DXF Export ──────────────────────────────────
function exportDXF(solution: any) {
  if (!solution?.room || !solution?.items) return
  const { lengthM: L, widthM: W } = solution.room
  const scale = 100 // 1m = 100 units
  const lines: string[] = []

  const dxfHeader = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`
  lines.push(dxfHeader)

  const addLine = (x1: number, y1: number, x2: number, y2: number, layer = '0') =>
    lines.push(`0\nLINE\n8\n${layer}\n10\n${x1}\n20\n${y1}\n30\n0\n11\n${x2}\n21\n${y2}\n31\n0\n`)

  const addRect = (cx: number, cy: number, w: number, d: number, layer: string) => {
    const x1 = (cx - w / 2) * scale, x2 = (cx + w / 2) * scale
    const y1 = (cy - d / 2) * scale, y2 = (cy + d / 2) * scale
    addLine(x1, y1, x2, y1, layer)
    addLine(x2, y1, x2, y2, layer)
    addLine(x2, y2, x1, y2, layer)
    addLine(x1, y2, x1, y1, layer)
  }

  const addText = (x: number, y: number, text: string, layer = 'TEXT') =>
    lines.push(`0\nTEXT\n8\n${layer}\n10\n${x}\n20\n${y}\n30\n0\n40\n15\n1\n${text}\n`)

  // Room boundary
  const hw = W / 2 * scale, hl = L / 2 * scale
  addLine(-hw, -hl, hw, -hl, 'WALLS')
  addLine(hw, -hl, hw, hl, 'WALLS')
  addLine(hw, hl, -hw, hl, 'WALLS')
  addLine(-hw, hl, -hw, -hl, 'WALLS')

  // Room label
  addText(0, hl + 20, `ROOM: ${W}m x ${L}m`, 'TEXT')

  // Furniture items
  const DIMS: Record<string, [number, number]> = {
    bed: [1.9, 2.1], sofa: [2.2, 1.0], table: [1.2, 0.8], chair: [0.55, 0.55],
    wardrobe: [1.5, 0.65], tvUnit: [1.8, 0.45], bookshelf: [1.2, 0.35],
    plant: [0.5, 0.5], floorLamp: [0.4, 0.4], sideTable: [0.45, 0.45],
  }

  solution.items.forEach((item: any) => {
    const [fw, fd] = DIMS[item.type] ?? [0.5, 0.5]
    addRect(item.x, item.z, fw * item.scale, fd * item.scale, 'FURNITURE')
    addText(item.x * scale, item.z * scale, item.type.toUpperCase(), 'TEXT')
  })

  lines.push(`0\nENDSEC\n0\nEOF\n`)

  const blob = new Blob([lines.join('')], { type: 'application/dxf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `RoomCraft_Layout_${W}x${L}m.dxf`
  a.click()
  URL.revokeObjectURL(url)
}

export function GlobalMaterialsPanel({ onClose, solution }: { onClose: () => void; solution?: any }) {
  const floorMaterial = useStudioStore(s => s.floorMaterial)
  const setFloorMaterial = useStudioStore(s => s.setFloorMaterial)
  const wallMaterial = useStudioStore(s => s.wallMaterial)
  const setWallMaterial = useStudioStore(s => s.setWallMaterial)
  const wallColor = useStudioStore(s => s.wallColor)
  const setWallColor = useStudioStore(s => s.setWallColor)
  const [activeTab, setActiveTab] = React.useState<'floor' | 'wall' | 'color' | 'autocad'>('floor')

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-20 md:left-24 z-40 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-[360px] max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'rgba(8,8,16,0.96)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.07]">
          <div>
            <h3 className="text-sm font-semibold text-white">Room Surfaces</h3>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Materials & Finishes</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06]">
          {(['floor', 'wall', 'color', 'autocad'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${activeTab === tab ? 'text-amber-400 border-b-2 border-amber-400' : 'text-white/30 hover:text-white/60'}`}>
              {tab === 'autocad' ? 'AutoCAD' : tab}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {/* Floor Tab */}
          {activeTab === 'floor' && (
            <div className="grid grid-cols-3 gap-2">
              {FLOOR_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setFloorMaterial(opt.value)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${floorMaterial === opt.value ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'}`}>
                  <div className="w-10 h-10 rounded-lg border border-white/10" style={{ backgroundColor: opt.color }} />
                  <span className={`text-[9px] font-medium text-center leading-tight ${floorMaterial === opt.value ? 'text-amber-400' : 'text-white/50'}`}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Wall Texture Tab */}
          {activeTab === 'wall' && (
            <div className="grid grid-cols-3 gap-2">
              {WALL_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setWallMaterial(opt.value)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${wallMaterial === opt.value ? 'border-blue-400/50 bg-blue-400/10' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'}`}>
                  <div className="w-10 h-10 rounded-lg border border-white/10" style={{ backgroundColor: opt.color }} />
                  <span className={`text-[9px] font-medium text-center leading-tight ${wallMaterial === opt.value ? 'text-blue-400' : 'text-white/50'}`}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Wall Color Tab */}
          {activeTab === 'color' && (
            <div>
              <p className="text-[10px] text-white/30 mb-3 uppercase tracking-wider">Paint Colour</p>
              <div className="grid grid-cols-6 gap-2 mb-4">
                {WALL_COLORS.map(c => (
                  <button key={c.hex} onClick={() => setWallColor(c.hex)} title={c.label}
                    className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${wallColor === c.hex ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c.hex }} />
                ))}
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Custom</span>
                <input type="color" value={wallColor} onChange={e => setWallColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                <span className="text-[10px] font-mono text-white/50">{wallColor}</span>
              </div>
            </div>
          )}

          {/* AutoCAD DXF Export Tab */}
          {activeTab === 'autocad' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-400 text-lg">📐</span>
                  <span className="text-sm font-semibold text-amber-400">AutoCAD Export</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Export your layout as a DXF file compatible with AutoCAD, AutoCAD LT, and other CAD software. Includes room boundary, furniture footprints, and labels.
                </p>
              </div>

              <div className="space-y-2 text-[11px] text-white/40">
                <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Room boundary walls</div>
                <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> All furniture footprints (to scale)</div>
                <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Furniture type labels</div>
                <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Dimensions in meters</div>
                <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Layered: WALLS, FURNITURE, TEXT</div>
              </div>

              <button
                onClick={() => solution && exportDXF(solution)}
                disabled={!solution}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all
                  bg-amber-500 hover:bg-amber-400 text-black active:scale-95
                  disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
              >
                📥 Download .DXF File
              </button>

              <p className="text-[9px] text-white/20 text-center">
                Open in AutoCAD, FreeCAD, or LibreCAD
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
