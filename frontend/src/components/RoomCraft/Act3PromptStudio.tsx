import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudioStore } from '../../store/useStudioStore'
import { optimizeLayout } from '../../lib/api'
import Cubes from '../Cubes'
import { GlowCard } from '../ui/GlowCard'
import { MagneticButton } from '../ui/MagneticButton'

export function Act3PromptStudio() {
  const [prompt, setPrompt] = useState('Design a cozy reading nook with a large oak bookshelf, a warm yellow armchair, and minimal indoor plants.')
  const [isProcessing, setIsProcessing] = useState(false)
  const [nlpStage, setNlpStage] = useState(0) // 0: raw, 1: scanning, 2: highlighted
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d')

  const nav = useNavigate()
  const setResult = useStudioStore(s => s.setResult)
  const setOptimizing = useStudioStore(s => s.setOptimizing)
  
  const explicitStyle = useStudioStore(s => s.explicitStyle)
  const setExplicitStyle = useStudioStore(s => s.setExplicitStyle)
  const floorMaterial = useStudioStore(s => s.floorMaterial)
  const setFloorMaterial = useStudioStore(s => s.setFloorMaterial)
  const wallMaterial = useStudioStore(s => s.wallMaterial)
  const setWallMaterial = useStudioStore(s => s.setWallMaterial)

  const handleSubmit = async () => {
    if (!prompt.trim() || isProcessing) return
    setIsProcessing(true)
    setNlpStage(1)
    
    // Simulate NLP scanning effect for UI
    await new Promise(r => setTimeout(r, 1200))
    setNlpStage(2)
    
    try {
      setOptimizing(true)
      const fullPrompt = `${prompt} (${explicitStyle} style, ${floorMaterial} floor, ${wallMaterial} walls)`
      const res = await optimizeLayout({ 
         prompt: fullPrompt, 
         addPlants: true, 
         addRugs: true 
      })
      setResult(res)
      nav('/workspace')
    } catch (err) {
      console.error(err)
      alert("Failed to analyze prompt. Ensure backend is running.")
    } finally {
      setIsProcessing(false)
      setOptimizing(false)
    }
  }

  const renderHighlightedPrompt = () => {
    if (nlpStage === 0) return <span className="opacity-100">{prompt}</span>
    if (nlpStage === 1) return (
      <span className="relative">
        <span className="opacity-30">{prompt}</span>
        <span className="absolute inset-0 bg-accent/20 w-1/2 animate-pulse rounded-md" style={{ width: '100%', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', transformOrigin: 'left' }} />
      </span>
    )
    
    return (
      <span className="leading-relaxed">
        {prompt.split(/(\b(?:cozy|minimal|modern|luxury|compact|bohemian|industrial|coastal|oak|bookshelf|armchair|plants|sofa|bed|chair|table|wardrobe|rug|lamp|blue|red|yellow|green|white|black)\b)/i).map((part, i) => {
          const lower = part.toLowerCase()
          if (['cozy', 'minimal', 'modern', 'luxury', 'compact', 'bohemian', 'industrial', 'coastal'].includes(lower)) {
             return <span key={i} className="px-2 py-0.5 rounded-full bg-skeuo-purple/20 text-skeuo-purple font-medium">{part}</span>
          }
          if (['oak', 'wood', 'blue', 'red', 'yellow', 'green', 'white', 'black'].includes(lower)) {
             return <span key={i} className="px-2 py-0.5 rounded-full bg-skeuo-amber/20 text-skeuo-amber font-medium">{part}</span>
          }
          if (['bookshelf', 'armchair', 'plants', 'sofa', 'bed', 'chair', 'table', 'wardrobe', 'rug', 'lamp'].includes(lower)) {
             return <span key={i} className="px-2 py-0.5 rounded-full bg-skeuo-teal/20 text-skeuo-teal font-medium">{part}</span>
          }
          return <span key={i}>{part}</span>
        })}
      </span>
    )
  }

  return (
    <section className="relative w-full min-h-screen pt-24 pb-12 px-4 md:px-8 bg-transparent overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
        <Cubes 
          gridSize={8}
          maxAngle={35}
          radius={3}
          borderStyle="2px dashed rgba(131, 151, 136, 0.5)"
          faceColor="transparent"
          rippleColor="rgba(251, 177, 60, 0.4)"
          rippleSpeed={1.5}
          autoAnimate
          rippleOnClick
        />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <header className="mb-12 text-center" data-animate="fade-up">
          <h2 className="font-serif text-4xl md:text-5xl text-text-primary mb-4">Prompt Studio</h2>
          <p className="text-text-secondary">Craft your environment using natural language.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* Left: History, Style & Context */}
          <div className="lg:col-span-3 space-y-6" data-animate="fade-up" style={{ transitionDelay: '100ms' }}>
            <GlowCard className="p-6 skeuo-card bg-skeuo-card-bg/90 backdrop-blur-md rounded-2xl">
               <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider relative z-10">Style Context</h3>
               <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                  {['Minimal', 'Modern', 'Luxury', 'Bohemian', 'Industrial', 'Coastal'].map(s => (
                    <div 
                      key={s} 
                      onClick={() => setExplicitStyle(s)}
                      className={`skeuo-inner py-2 px-3 text-xs text-center cursor-pointer transition-all duration-300 ${explicitStyle === s ? 'bg-text-primary text-bg-primary font-bold shadow-lg scale-105 opacity-100 ring-2 ring-accent/50' : 'text-text-secondary hover:bg-white/40 hover:text-text-primary'}`}
                    >
                      {s}
                    </div>
                  ))}
               </div>

               <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider relative z-10">Materials</h3>
               <div className="space-y-4 relative z-10">
                 <div>
                   <label className="text-xs font-semibold text-text-secondary mb-2 block uppercase">Floor</label>
                   <div className="flex gap-2 bg-skeuo-inner p-1 rounded-lg">
                     {(['Wood', 'Tile', 'Carpet'] as const).map(m => (
                       <button onClick={() => setFloorMaterial(m)} key={m} className={`flex-1 py-1.5 text-xs rounded transition-all duration-300 ${floorMaterial === m ? 'bg-white text-black font-bold shadow-md transform scale-105' : 'text-text-secondary hover:bg-white/50 hover:text-text-primary'}`}>{m}</button>
                     ))}
                   </div>
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-text-secondary mb-2 block uppercase">Walls</label>
                   <div className="flex gap-2 bg-skeuo-inner p-1 rounded-lg">
                     {(['Plain', 'Panel', 'Brick'] as const).map(m => (
                       <button onClick={() => setWallMaterial(m)} key={m} className={`flex-1 py-1.5 text-xs rounded transition-all duration-300 ${wallMaterial === m ? 'bg-white text-black font-bold shadow-md transform scale-105' : 'text-text-secondary hover:bg-white/50 hover:text-text-primary'}`}>{m}</button>
                     ))}
                   </div>
                 </div>
               </div>
            </GlowCard>
          </div>

          {/* Center: Skeuomorphic Input */}
          <div className="lg:col-span-5 relative" data-animate="fade-up" style={{ transitionDelay: '200ms' }}>
            <div className="skeuo-card p-2 h-full flex flex-col bg-skeuo-card-bg/90 backdrop-blur-md">
              <div className="flex-1 rounded-2xl skeuo-inner p-6 paper-texture ruled-lines relative overflow-hidden flex flex-col">
                <div className="flex-1 relative z-20">
                  {nlpStage === 0 ? (
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full h-full bg-transparent resize-none outline-none font-serif text-xl leading-relaxed text-text-primary placeholder:text-text-primary/30"
                      spellCheck="false"
                    />
                  ) : (
                    <div className="w-full h-full font-serif text-xl leading-relaxed text-text-primary">
                      {renderHighlightedPrompt()}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-between items-center z-20">
                  <div className="flex gap-2">
                     <span className="w-3 h-3 rounded-full bg-skeuo-teal"></span>
                     <span className="w-3 h-3 rounded-full bg-skeuo-purple"></span>
                     <span className="w-3 h-3 rounded-full bg-skeuo-amber"></span>
                  </div>
                  <MagneticButton disabled={isProcessing} onClick={handleSubmit}>
                    <button 
                      className={`px-8 py-2.5 rounded-full font-semibold shadow-skeuo-outer hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ${isProcessing ? 'bg-white/10 text-white/50' : 'bg-gradient-to-r from-accent to-purple-400 text-bg-primary'}`}
                    >
                      {isProcessing ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></span>
                          Processing NLP...
                        </>
                      ) : 'Assemble View'}
                    </button>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-4" data-animate="fade-up" style={{ transitionDelay: '300ms' }}>
            <div className="skeuo-card p-4 h-full min-h-[400px] flex flex-col bg-skeuo-card-bg/90 backdrop-blur-md">
               <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-text-primary">Viewer</span>
                  <div className="flex bg-skeuo-inner rounded-full p-1 shadow-inner border border-white/20">
                     <button onClick={() => setViewMode('2d')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${viewMode === '2d' ? 'bg-white shadow text-black' : 'text-text-secondary hover:text-text-primary'}`}>2D SVG</button>
                     <button onClick={() => setViewMode('3d')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${viewMode === '3d' ? 'bg-white shadow text-black' : 'text-text-secondary hover:text-text-primary'}`}>3D Vis</button>
                  </div>
               </div>
               
               <div className="flex-1 skeuo-inner rounded-xl overflow-hidden relative group border border-white/20 flex items-center justify-center">
                  {nlpStage < 2 ? (
                    <div className="text-text-primary/30 font-medium">Awaiting prompt...</div>
                  ) : (
                    viewMode === '2d' ? (
                      <div className="inset-0 absolute p-8">
                         <svg className="w-full h-full text-accent" viewBox="0 0 100 100" stroke="currentColor" fill="none" strokeWidth="2">
                           <path d="M10,10 L90,10 L90,90 L10,90 Z" />
                           <path d="M10,30 L40,30 L40,10" />
                           <rect x="50" y="50" width="20" height="15" />
                         </svg>
                      </div>
                    ) : (
                      <div className="inset-0 absolute bg-[#0A0A10]">
                         <img src="/images/house.jpg" className="w-full h-full object-cover opacity-60 mix-blend-screen" alt="Preview Placeholder" />
                         <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white font-serif text-sm">
                           Scene Rendered dynamically
                         </div>
                      </div>
                    )
                  )}
               </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
