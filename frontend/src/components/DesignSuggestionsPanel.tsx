import {useDialogDismiss} from '../lib/useDialogDismiss'
import type { LayoutSolution } from '../types/layout'
import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FurnitureItem } from '../types/layout'

// ─── Suggestion rules ────────────────────────────────────────────────────────
// Each rule analyses what's already in the layout and produces an add-on idea.

interface Suggestion {
  id: string
  emoji: string
  title: string
  reason: string
  benefit: string
  estimatedCostINR: number
  furnitureType: string
  priority: 'high' | 'medium' | 'low'
}

function generateSuggestions(
  items: FurnitureItem[],
  roomW: number,
  roomL: number,
  styles: string[],
): Suggestion[] {
  const types = new Set(items.map((i) => i.type))
  const area = roomW * roomL
  const isLuxury = styles.includes('Luxury')
  const isModern = styles.includes('Modern')
  const isCozy = styles.includes('Cozy')
  const isBohemian = styles.includes('Bohemian')
  const suggestions: Suggestion[] = []

  // 1. No plant → suggest one
  if (!types.has('plant') && area > 18) {
    suggestions.push({
      id: 'add-plant',
      emoji: '🌿',
      title: 'Add a Statement Plant',
      reason: 'No greenery detected in the layout.',
      benefit: 'Plants improve air quality, reduce stress, and add a natural focal point.',
      estimatedCostINR: isLuxury ? 8000 : 3500,
      furnitureType: 'plant',
      priority: 'high',
    })
  }

  // 2. No floor lamp → suggest one for ambiance
  if (!types.has('floorLamp') && area > 20) {
    suggestions.push({
      id: 'add-lamp',
      emoji: '💡',
      title: isLuxury ? 'Luxury Arc Floor Lamp' : 'Ambient Floor Lamp',
      reason: 'No secondary lighting source found.',
      benefit: 'Layered lighting creates a warm ambiance and reduces eye strain.',
      estimatedCostINR: isLuxury ? 12000 : 5500,
      furnitureType: 'floorLamp',
      priority: 'high',
    })
  }

  // 3. Sofa but no side table → recommend one
  if (types.has('sofa') && !types.has('sideTable')) {
    suggestions.push({
      id: 'add-sidetable',
      emoji: '🪔',
      title: 'Side / End Table',
      reason: 'Sofa detected but no surface for drinks or remotes.',
      benefit: 'Adds convenience and completes the seating arrangement.',
      estimatedCostINR: isLuxury ? 12000 : 4000,
      furnitureType: 'sideTable',
      priority: 'high',
    })
  }

  // 4. No bookshelf in a large room → add one
  if (!types.has('bookshelf') && area > 25 && !types.has('wardrobe')) {
    suggestions.push({
      id: 'add-bookshelf',
      emoji: '📚',
      title: isModern ? 'Floating Wall Shelves' : 'Bookshelf / Display Unit',
      reason: 'Large room without vertical storage or display space.',
      benefit: 'Adds character, visual height, and useful storage.',
      estimatedCostINR: isModern ? 8000 : 15000,
      furnitureType: 'bookshelf',
      priority: 'medium',
    })
  }

  // 5. Bed but no side table
  if (types.has('bed') && !types.has('sideTable')) {
    suggestions.push({
      id: 'add-bedside',
      emoji: '🕯️',
      title: 'Bedside Table',
      reason: 'Bed placed but no bedside surface.',
      benefit: 'Essential for nighttime comfort — holds lamp, phone, water.',
      estimatedCostINR: 4500,
      furnitureType: 'sideTable',
      priority: 'high',
    })
  }

  // 6. Cozy/Bohemian → suggest a rug if area large enough
  if ((isCozy || isBohemian) && area > 20) {
    suggestions.push({
      id: 'add-rug-pattern',
      emoji: '🏮',
      title: isCozy ? 'Persian Style Rug' : 'Jute & Woven Rug',
      reason: 'Style profile calls for warm, layered textiles.',
      benefit: 'Defines the seating zone and adds warmth underfoot.',
      estimatedCostINR: isCozy ? 18000 : 5500,
      furnitureType: 'rug',
      priority: 'medium',
    })
  }

  // 7. Modern → suggest a chair as accent piece
  if (isModern && !types.has('chair') && area > 22) {
    suggestions.push({
      id: 'add-accent-chair',
      emoji: '💺',
      title: 'Modern Accent Chair',
      reason: 'Modern rooms benefit from a sculptural seating accent.',
      benefit: 'Creates a reading nook and adds visual interest.',
      estimatedCostINR: 14000,
      furnitureType: 'chair',
      priority: 'medium',
    })
  }

  // 8. Room > 30m² with no TV unit in living room
  if (!types.has('tvUnit') && area > 28) {
    suggestions.push({
      id: 'add-tv-unit',
      emoji: '📺',
      title: isLuxury ? 'Luxury Entertainment Centre' : 'TV Console Unit',
      reason: 'Large living space without a media focal point.',
      benefit: 'Creates a clear activity zone and organises cables/devices.',
      estimatedCostINR: isLuxury ? 45000 : 18000,
      furnitureType: 'tvUnit',
      priority: 'medium',
    })
  }

  // 9. No table → suggest coffee table
  if (!types.has('table') && types.has('sofa')) {
    suggestions.push({
      id: 'add-coffee-table',
      emoji: '☕',
      title: 'Coffee / Centre Table',
      reason: 'Sofa arrangement lacks a central surface.',
      benefit: 'Anchors the seating group and provides a functional surface.',
      estimatedCostINR: isLuxury ? 35000 : 12000,
      furnitureType: 'table',
      priority: 'high',
    })
  }

  // 10. Space efficiency tip for small rooms
  if (area < 20 && items.length > 5) {
    suggestions.push({
      id: 'storage-ottoman',
      emoji: '🪑',
      title: 'Multi-functional Ottoman',
      reason: 'Compact room with many items — need multi-use pieces.',
      benefit: 'Acts as seating, footrest, and hidden storage all in one.',
      estimatedCostINR: 6500,
      furnitureType: 'chair',
      priority: 'medium',
    })
  }

  // Sort by priority
  const order = { high: 0, medium: 1, low: 2 }
  return suggestions.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 6)
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  solution: LayoutSolution
  onClose: () => void
  onAddItem?: (type: string, costINR: number) => boolean
}

export function DesignSuggestionsPanel({ solution, onClose, onAddItem }: Props) {
  useDialogDismiss(onClose)
  const [added, setAdded] = React.useState<Set<string>>(new Set())
  const [animating, setAnimating] = React.useState<string | null>(null)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const suggestions = React.useMemo(() => {
    if (!solution) return []
    const suggestions = generateSuggestions(
      solution.items ?? [],
      solution.room?.widthM ?? 7,
      solution.room?.lengthM ?? 6,
      solution.selectedStyles ?? [],
    )
    return ['Kitchen','Bathroom'].includes(solution.room.type) ? suggestions.filter(s => s.furnitureType === 'plant') : suggestions
  }, [solution])

  const handleAdd = (s: Suggestion) => {
    if (added.has(s.id) || animating === s.id) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    setAnimating(s.id)
    timerRef.current = setTimeout(() => {
      if (onAddItem?.(s.furnitureType, s.estimatedCostINR)) setAdded((prev) => new Set([...prev, s.id]))
      setAnimating(null)
      timerRef.current = null
    }, 600)
  }

  const priorityColor = (p: string) =>
    p === 'high' ? '#22c55e' : p === 'medium' ? '#f59e0b' : '#94a3b8'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        role="dialog" aria-modal="true" aria-label="Design suggestions" onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg mx-4 max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(8,8,16,0.96)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              ✨
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">AI Design Suggestions</h2>
              <p className="text-[10px] text-white/30 font-medium mt-0.5">
                {suggestions.length} improvement{suggestions.length !== 1 ? 's' : ''} detected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Insight bar */}
        <div className="px-5 py-3 bg-violet-500/[0.06] border-b border-white/[0.04]">
          <p className="text-[11px] text-white/50 leading-relaxed">
            Analysis based on your{' '}
            <span className="text-violet-300 font-medium">
              {solution?.room?.widthM ?? 7}m × {solution?.room?.lengthM ?? 6}m
            </span>{' '}
            {solution?.room?.type ?? 'room'} with{' '}
            <span className="text-violet-300 font-medium">{solution?.items?.length ?? 0} items</span>.
            Click any suggestion to add it instantly.
          </p>
        </div>

        {/* Suggestions list */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          <AnimatePresence>
            {suggestions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="text-4xl mb-4">🎉</div>
                <p className="text-white/60 text-sm font-medium">Your layout looks complete!</p>
                <p className="text-white/30 text-xs mt-1">No major additions suggested.</p>
              </motion.div>
            ) : (
              suggestions.map((s, idx) => {
                const isAdded = added.has(s.id)
                const isAnimating = animating === s.id
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className={`rounded-xl border p-4 transition-all duration-300 ${
                      isAdded
                        ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0 mt-0.5">{s.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-white">{s.title}</span>
                          <span
                            className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                            style={{
                              color: priorityColor(s.priority),
                              background: `${priorityColor(s.priority)}18`,
                              border: `1px solid ${priorityColor(s.priority)}30`,
                            }}
                          >
                            {s.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/40 mb-1">{s.reason}</p>
                        <p className="text-[11px] text-violet-300/70 mb-3">{s.benefit}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/35 font-mono">
                            est. ₹{s.estimatedCostINR.toLocaleString()}
                          </span>
                          <button
                            onClick={() => !isAdded && handleAdd(s)}
                            disabled={isAdded || isAnimating}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                              isAdded
                                ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                                : isAnimating
                                ? 'bg-violet-500/30 text-violet-300 cursor-wait'
                                : 'bg-violet-500 text-white hover:bg-violet-400 shadow-lg shadow-violet-500/20'
                            }`}
                          >
                            {isAdded ? (
                              <>✓ Added</>
                            ) : isAnimating ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 border-2 border-violet-300/30 border-t-violet-300 rounded-full animate-spin" />
                                Adding…
                              </span>
                            ) : (
                              <>+ Add to Layout</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-[9px] text-white/20 text-center leading-relaxed">
            Suggestions are generated by analysing your layout against interior design best practices.
            Costs are approximate market estimates for India.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
