// GenerationSidebar — evolution timeline scrubber
import { motion, AnimatePresence } from 'framer-motion'
import { useStudioStore } from '../../store/useStudioStore'
import { useGenerationTransition } from '../../hooks/useGenerationTransition'
import { RadarChart } from '../RadarChart'
import { formatINR } from '../../lib/inr'


export function GenerationSidebar() {
  const result = useStudioStore((s) => s.lastResult)
  const activeIndex = useStudioStore((s) => s.activeSnapshotIndex)
  const ghostMode = useStudioStore((s) => s.ghostMode)
  const sidebarOpen = useStudioStore((s) => s.sidebarOpen)
  const setActiveSnapshot = useStudioStore((s) => s.setActiveSnapshot)
  const toggleGhostMode = useStudioStore((s) => s.toggleGhostMode)
  const toggleSidebar = useStudioStore((s) => s.toggleSidebar)

  const steps = result?.history_steps ?? []
  const maxIndex = steps.length - 1

  const { currentStep, previousStep } = useGenerationTransition(
    steps,
    activeIndex,
  )

  if (steps.length === 0) return null

  const currentGen = currentStep?.generation ?? steps[maxIndex]?.generation ?? 0
  const finalGen = steps[maxIndex]?.generation ?? 0

  // Cost delta vs final study
  const finalCost = steps[maxIndex]?.totalCostINR ?? 0
  const currentCost = currentStep?.totalCostINR ?? 0
  const costDiff = currentCost - finalCost
  const costDiffSign = costDiff > 0 ? '+' : costDiff < 0 ? '-' : ''
  const costDiffAbs = Math.abs(costDiff)

  return (
    <>
      {/* Toggle button (always visible) */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        onClick={toggleSidebar}
        className="gen-sidebar-toggle"
        title="Planning studies"
        aria-label="Open planning studies"
        aria-expanded={sidebarOpen}
        aria-controls="gen-history-sidebar"
        id="gen-history-toggle"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-[9px] font-bold tracking-widest uppercase">GEN</span>
      </motion.button>

      {/* Sidebar panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="gen-sidebar" data-lenis-prevent
            id="gen-history-sidebar"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h3 className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/60">
                  Planning studies
                </h3>
              </div>
              <button
                onClick={toggleSidebar}
                aria-label="Close planning studies"
                className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Generation counter */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-light tracking-tight text-white tabular-nums">
                  {activeIndex < 0 ? 'Final layout' : `Study ${currentGen}`} 
                </span>
                <span className="text-xs text-white/30">/ {finalGen}</span>
              </div>
              <div className="text-[10px] text-white/40 font-medium">
                {steps.length} room arrangements evaluated
              </div>
            </div>

            <button onClick={() => setActiveSnapshot(-1)} className="w-full p-2 mb-4 rounded border border-white/20 text-xs text-white" aria-pressed={activeIndex < 0}>Return to final layout</button>
            {/* Timeline slider */}
            <div className="gen-slider-container mb-6">
              <input
                aria-label="Planning study"
                type="range"
                min={0}
                max={maxIndex}
                value={activeIndex < 0 ? maxIndex : activeIndex}
                onChange={(e) => setActiveSnapshot(Number(e.target.value))}
                className="gen-slider"
                id="gen-timeline-slider"
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-white/30 font-medium">Study 1</span>
                <span className="text-[9px] text-white/30 font-medium">Study {finalGen}</span>
              </div>
              {/* Tick marks */}
              <div className="flex justify-between px-[2px] mt-1">
                {steps.map((step, i) => (
                  <button
                    key={step.generation}
                    onClick={() => setActiveSnapshot(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? 'bg-primary scale-150 shadow-[0_0_6px_rgba(56,189,248,0.5)]'
                        : 'bg-white/15 hover:bg-white/30'
                    }`}
                    title={`Study ${step.generation}`}
                  />
                ))}
              </div>
            </div>

            {/* Fitness score */}
            {currentStep && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/40">Fitness</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-light text-white tabular-nums">
                    {(currentStep.metrics.fitness * 100).toFixed(1)}
                  </span>
                  <span className="text-sm text-white/30">%</span>
                  {previousStep && (
                    <FitnessDelta
                      current={currentStep.metrics.fitness}
                      previous={previousStep.metrics.fitness}
                    />
                  )}
                </div>
                <div className="mt-2 w-full h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, Math.min(100, currentStep.metrics.fitness * 100))}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Radar chart */}
            {currentStep && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/40">Parameter Trade-offs</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                  <RadarChart
                    metrics={currentStep.metrics}
                    prevMetrics={previousStep?.metrics}
                  />
                  {previousStep && (
                    <div className="flex items-center gap-3 mt-2 justify-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-[2px] bg-[#38BDF8] rounded-full" />
                        <span className="text-[8px] text-white/40 font-medium">Study {currentGen}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-[2px] bg-[#F59E0B] rounded-full opacity-60" style={{ borderStyle: 'dashed' }} />
                        <span className="text-[8px] text-white/40 font-medium">Study {previousStep.generation}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cost delta */}
            {currentStep && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#D4AF37]/60">Cost Comparison</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-lg font-light text-white tabular-nums">
                      {formatINR(currentCost)}
                    </span>
                  </div>
                  {costDiff !== 0 && (
                    <div className={`flex items-center gap-1.5 text-[11px] font-medium ${
                      costDiff > 0 ? 'text-red-400/80' : 'text-emerald-400/80'
                    }`}>
                      <svg className={`w-3 h-3 ${costDiff < 0 ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                      {costDiffSign}{formatINR(costDiffAbs)} vs final
                    </div>
                  )}
                  {costDiff === 0 && (
                    <div className="text-[11px] text-white/30 font-medium">Same estimated cost as final study</div>
                  )}
                </div>
              </div>
            )}

            {/* Ghost mode toggle */}
            <div className="mt-auto pt-4 border-t border-white/[0.06]">
              <button
                onClick={toggleGhostMode}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  ghostMode
                    ? 'bg-primary/15 border border-primary/30 text-primary'
                    : 'bg-white/[0.03] border border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.05]'
                }`}
                id="ghost-mode-toggle"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs">Ghost Overlay</span>
                </div>
                <div className={`w-8 h-4.5 rounded-full transition-all relative ${
                  ghostMode ? 'bg-primary/40' : 'bg-white/10'
                }`}>
                  <motion.div
                    animate={{ x: ghostMode ? 14 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`absolute top-[2px] w-3 h-3 rounded-full ${
                      ghostMode ? 'bg-primary' : 'bg-white/40'
                    }`}
                  />
                </div>
              </button>
              <p className="text-[9px] text-white/25 mt-2 leading-relaxed px-1">
                Renders previous generation at 30% opacity for direct spatial comparison.
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

function FitnessDelta({ current, previous }: { current: number; previous: number }) {
  const diff = (current - previous) * 100
  if (Math.abs(diff) < 0.05) return null

  const isPositive = diff > 0
  return (
    <span className={`text-[11px] font-medium flex items-center gap-0.5 ${
      isPositive ? 'text-emerald-400/80' : 'text-red-400/80'
    }`}>
      <svg className={`w-2.5 h-2.5 ${!isPositive ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
      {isPositive ? '+' : ''}{diff.toFixed(1)}
    </span>
  )
}
