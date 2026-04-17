import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Textarea } from '../components/ui/Textarea'
import { optimizeLayout } from '../lib/api'
import type { OptimizeRequest } from '../lib/api'
import { useStudioStore } from '../store/useStudioStore'
import { AbstractBackground } from '../components/AbstractBackground'
import { useState } from 'react'

export function PromptStudioPage() {
  const nav = useNavigate()
  const st = useStudioStore()

  // Default professional prompt when empty
  const defaultPrompt = 'Design a living room spanning 6x8 meters under 450,000 INR.'

  async function onGenerate() {
    const promptToUse = st.prompt.trim() ? st.prompt : defaultPrompt
    if (!st.prompt.trim()) st.setPrompt(defaultPrompt) 
    
    st.setOptimizing(true)
    try {
      const payload: OptimizeRequest = {
        prompt: promptToUse,
        explicitStyle: st.explicitStyle,
        addPlants: st.addPlants,
        addRugs: st.addRugs
      }
      const result = await optimizeLayout(payload)
      st.setResult(result)
      nav('/workspace')
    } catch (e: any) {
      alert(e?.message ?? 'Optimization failed')
    } finally {
      st.setOptimizing(false)
    }
  }

  const STYLES = ["Modern", "Cozy", "Luxury", "Minimal", "Compact"]

  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 pb-32 relative bg-bg-primary overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="mb-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary dark:text-white mb-3">
              New Layout Project
            </h1>
            <p className="text-text-secondary dark:text-white/60 text-lg">
              Configure parameters and natural language constraints to generate a 3D layout.
            </p>
          </motion.div>
        </header>

        {/* 2-Column SaaS Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form Controls */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 space-y-8"
          >
            {/* Prompt Card */}
            <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <label className="block text-sm font-semibold text-text-primary dark:text-white mb-2">Architectural Prompt</label>
              <Textarea
                value={st.prompt}
                onChange={(e) => st.setPrompt(e.target.value)}
                placeholder={defaultPrompt}
                className="w-full h-32 bg-transparent text-base md:text-lg"
              />
            </div>

            {/* Config Card */}
            <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-6">
              
              <div>
                <label className="block text-sm font-semibold text-text-primary dark:text-white mb-3">Aesthetic Style</label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map(style => (
                    <button
                      key={style}
                      onClick={() => st.setExplicitStyle(style)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        st.explicitStyle === style 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-text-primary/5 dark:bg-white/5 text-text-secondary dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-black/5 dark:border-white/10">
                <label className="block text-sm font-semibold text-text-primary dark:text-white mb-4">Additional Decor Primitives</label>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${st.addPlants ? 'bg-primary border-primary' : 'border-black/20 dark:border-white/20 group-hover:border-primary/50'}`}>
                      {st.addPlants && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input type="checkbox" className="hidden" checked={st.addPlants} onChange={(e) => st.setAddPlants(e.target.checked)} />
                    <span className="text-sm font-medium text-text-secondary dark:text-white/80 select-none">Include Indoor Plants</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${st.addRugs ? 'bg-primary border-primary' : 'border-black/20 dark:border-white/20 group-hover:border-primary/50'}`}>
                      {st.addRugs && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input type="checkbox" className="hidden" checked={st.addRugs} onChange={(e) => st.setAddRugs(e.target.checked)} />
                    <span className="text-sm font-medium text-text-secondary dark:text-white/80 select-none">Include Center Rugs</span>
                  </label>
                </div>
              </div>

            </div>

            <button 
              onClick={onGenerate}
              disabled={st.isOptimizing}
              className="w-full relative overflow-hidden rounded-xl bg-text-primary dark:bg-white text-bg-primary dark:text-black px-6 py-4 font-bold tracking-wide hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
            >
              {st.isOptimizing ? (
                <>
                  <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing Layout...
                </>
              ) : (
                <>
                  Generate 3D Layout
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
          </motion.div>

          {/* Right Column: Preview/Interactive Visuals */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-7"
          >
            <div className="w-full h-full min-h-[400px] lg:min-h-full relative rounded-3xl overflow-hidden shadow-2xl border border-black/5 dark:border-white/10 group bg-[#070812]">
              
              <img 
                src="/images/house.jpg" 
                alt="Modern Architecture" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 z-10 transition-colors duration-700 pointer-events-none">
                 <div className="text-white/70 text-xs font-bold tracking-widest uppercase mb-2">Smart Engine</div>
                 <div className="text-white text-3xl font-black">{st.explicitStyle || 'Modern'} Generation</div>
                 <div className="flex gap-4 mt-4">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-semibold text-white">AI Spacing Constraints</span>
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-semibold text-white">Arch-Viz Material Textures</span>
                 </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
