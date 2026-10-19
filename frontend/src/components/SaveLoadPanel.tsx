import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudioStore } from '../store/useStudioStore'
import { getSavedLayouts, saveLayout, deleteLayout, renameLayout, type SavedLayout } from '../lib/savedLayouts'
import { formatINR } from '../lib/inr'

export function SaveLoadPanel({ onClose }: { onClose: () => void }) {
  const result = useStudioStore((s) => s.lastResult)
  const setResult = useStudioStore((s) => s.setResult)

  const [layouts, setLayouts] = React.useState<SavedLayout[]>([])
  const [saveName, setSaveName] = React.useState('')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState('')
  const [showSaveSuccess, setShowSaveSuccess] = React.useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  const timeoutIdRef = React.useRef<any>(null)

  React.useEffect(() => {
    setLayouts(getSavedLayouts())
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
    }
  }, [])

  const handleSave = () => {
    if (!result || !saveName.trim()) return
    saveLayout(saveName.trim(), result)
    setLayouts(getSavedLayouts())
    setSaveName('')
    setShowSaveSuccess(true)
    
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }
    
    timeoutIdRef.current = setTimeout(() => {
      setShowSaveSuccess(false)
      timeoutIdRef.current = null
    }, 2000)
  }

  const handleLoad = (layout: SavedLayout) => {
    setResult(layout.result)
    onClose()
  }

  const handleDelete = (id: string) => {
    deleteLayout(id)
    setLayouts(getSavedLayouts())
    setConfirmDeleteId(null)
  }

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameLayout(id, editName.trim())
      setLayouts(getSavedLayouts())
    }
    setEditingId(null)
    setEditName('')
  }

  const roomLabel = (l: SavedLayout) => {
    const sol = l.result.solutions[0]
    if (!sol) return 'Unknown'
    return `${sol.room.type} · ${sol.room.lengthM}×${sol.room.widthM}m`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden rounded-2xl"
        style={{
          background: 'rgba(10, 10, 18, 0.92)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
        id="save-load-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Saved Layouts</h2>
              <p className="text-[10px] text-white/30 font-medium">{layouts.length} layout{layouts.length !== 1 ? 's' : ''} saved</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Save current layout */}
        {result && (
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Name this layout…"
                className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                id="save-layout-input"
              />
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="px-4 py-2 bg-primary/15 border border-primary/25 rounded-xl text-xs font-semibold text-primary hover:bg-primary/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                id="save-layout-btn"
              >
                Save
              </button>
            </div>
            <AnimatePresence>
              {showSaveSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 text-[11px] text-emerald-400/80 font-medium flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Layout saved successfully
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Layout list */}
        <div className="overflow-y-auto max-h-[50vh] p-3 space-y-2">
          {layouts.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <p className="text-xs text-white/25 font-medium">No saved layouts yet</p>
              <p className="text-[10px] text-white/15 mt-1">Generate a layout, then save it here</p>
            </div>
          )}

          {layouts.map((layout, i) => {
            const sol = layout.result.solutions[0]
            const cost = sol?.metrics.totalCostINR ?? 0
            const fitness = sol?.metrics.fitness ?? 0
            const date = new Date(layout.savedAt)
            const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
            const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

            return (
              <motion.div
                key={layout.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer overflow-hidden"
              >
                <div className="p-3.5" onClick={() => handleLoad(layout)}>
                  {/* Name row */}
                  <div className="flex items-start justify-between mb-2">
                    {editingId === layout.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRename(layout.id); if (e.key === 'Escape') setEditingId(null) }}
                        onBlur={() => handleRename(layout.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 bg-white/[0.06] border border-primary/30 rounded text-sm text-white focus:outline-none w-full"
                      />
                    ) : (
                      <h4 className="text-sm font-medium text-white/90 truncate pr-2">{layout.name}</h4>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setEditingId(layout.id); setEditName(layout.name) }}
                        className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
                        title="Rename"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      {confirmDeleteId === layout.id ? (
                        <button
                          onClick={() => handleDelete(layout.id)}
                          className="px-2 py-0.5 rounded bg-red-500/20 text-[10px] font-semibold text-red-400 hover:bg-red-500/30 transition-all"
                        >
                          Confirm
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(layout.id)}
                          className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white/30 hover:text-red-400/80 hover:bg-red-500/10 transition-all"
                          title="Delete"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-2 text-[10px] text-white/35 font-medium">
                    <span>{roomLabel(layout)}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                    <span>{sol?.items.length ?? 0} items</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                    <span className="text-[#D4AF37]/60">{formatINR(cost)}</span>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-[3px] w-12 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full" style={{ width: `${Math.max(0, Math.min(100, fitness * 100))}%` }} />
                      </div>
                      <span className="text-[9px] text-white/25">{(fitness * 100).toFixed(0)}%</span>
                    </div>
                    <span className="text-[9px] text-white/20">{dateStr} · {timeStr}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
