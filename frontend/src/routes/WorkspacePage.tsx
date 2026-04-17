import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudioStore } from '../store/useStudioStore'
import { InteriorCanvas } from '../three/InteriorCanvas'

export function WorkspacePage() {
  const nav = useNavigate()
  const result = useStudioStore((state) => state.lastResult)
  const isOptimizing = useStudioStore((state) => state.isOptimizing)
  const [showRemovedNotice, setShowRemovedNotice] = React.useState(true)
  const [showPanel, setShowPanel] = React.useState(true)

  if (isOptimizing) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#05050A]">
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 mb-8">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }} className="absolute inset-0 border-t-2 border-r-2 border-white/20 rounded-full" />
            <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} className="absolute inset-2 border-b-2 border-l-2 border-primary/50 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
            </div>
          </div>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="text-2xl font-serif text-white tracking-widest uppercase mb-2"
          >
            Compiling Geometry
          </motion.div>
          <div className="text-white/40 text-sm tracking-[0.3em] font-semibold">
            ENGAGING SPATIAL ENGINE
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen pt-32 px-8 bg-[#05050A] flex flex-col items-center justify-center">
         <h1 className="text-4xl text-white mb-4 font-serif">No Layout Data</h1>
         <button onClick={() => nav('/')} className="bg-white text-black px-6 py-3 rounded-full font-medium hover:scale-105 active:scale-95 transition-transform">Back to Studio</button>
      </div>
    )
  }

  const sol = result.solutions[0]
  const removedItems = sol.removedItems || []

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="fixed inset-0 w-full h-full bg-[#05050A] font-sans overflow-hidden"
    >

      {/* ── Full-bleed 3D Canvas ── */}
      <div className="absolute inset-0 z-0">
         <InteriorCanvas solution={sol} />
      </div>

      {/* ── Minimal top-left info (Unseen Studio style) ── */}
      <div className="absolute inset-0 z-10 pointer-events-none">

        {/* Top strip */}
        <div className="flex justify-between items-start p-6 md:p-10 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white tracking-tight font-light leading-none">
              {sol.room.type}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[11px] uppercase tracking-[0.25em] text-white/50 font-medium">
                {sol.room.lengthM}m × {sol.room.widthM}m
              </span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-white/40 font-medium">
                {sol.selectedStyles.join(' · ')}
              </span>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            onClick={() => nav('/')}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            New Project
          </motion.button>
        </div>

        {/* Bottom data strip */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
          <AnimatePresence>
            {showPanel && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mx-6 md:mx-10 mb-6 md:mb-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.08]">

                  {/* Card 1 — Architectural Logic */}
                  <div className="bg-[#0a0a0f]/80 backdrop-blur-sm p-6 group hover:bg-[#0f0f18]/80 transition-colors duration-500">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-semibold">Logic</span>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed font-light">
                      {sol.items.length} items placed with deterministic spatial engine. Zero overlap, wall-flush anchoring.
                    </p>
                  </div>

                  {/* Card 2 — Space Utilization */}
                  <div className="bg-[#0a0a0f]/80 backdrop-blur-sm p-6 group hover:bg-[#0f0f18]/80 transition-colors duration-500">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-semibold">Utilization</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-light tracking-tight text-white">
                        {sol.metrics.spaceUtilizationPct.toFixed(1)}
                      </span>
                      <span className="text-lg text-white/30 font-light">%</span>
                    </div>
                    <div className="mt-3 w-full h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sol.metrics.spaceUtilizationPct}%` }}
                        transition={{ duration: 2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-gradient-to-r from-primary/60 to-primary"
                      />
                    </div>
                  </div>

                  {/* Card 3 — Cost */}
                  <div className="bg-[#0a0a0f]/80 backdrop-blur-sm p-6 group hover:bg-[#0f0f18]/80 transition-colors duration-500">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#D4AF37]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/50 font-semibold">Cost</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-light tracking-tight text-white">
                        ₹{sol.metrics.totalCostINR.toLocaleString()}
                      </span>
                      <span className="text-xs text-white/20 line-through">₹{sol.metrics.budgetINR.toLocaleString()}</span>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle panel button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            onClick={() => setShowPanel(!showPanel)}
            className="absolute bottom-3 right-3 md:bottom-4 md:right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all pointer-events-auto"
          >
            <svg className={`w-4 h-4 transition-transform ${showPanel ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* ── Removed Items Toast ── */}
      <AnimatePresence>
        {removedItems.length > 0 && showRemovedNotice && (
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ duration: 0.5, delay: 2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-24 right-6 z-50 max-w-xs pointer-events-auto"
          >
            <div className="bg-[#0a0a0f]/90 backdrop-blur-md border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-amber-400/80">Space Optimized</span>
                </div>
                <button onClick={() => setShowRemovedNotice(false)} className="text-white/30 hover:text-white transition-colors text-sm">✕</button>
              </div>
              <p className="text-white/50 text-[11px] mb-2">
                Removed to fit {sol.room.lengthM}×{sol.room.widthM}m:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {removedItems.map((ri: any, i: number) => (
                  <span key={i} className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-300/80 font-medium capitalize">
                    {ri.type.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
