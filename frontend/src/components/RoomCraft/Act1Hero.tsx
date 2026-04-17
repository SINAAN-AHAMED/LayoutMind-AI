import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RoomAssemblyScene } from '../../three/RoomAssemblyScene'
import Antigravity from '../Antigravity'

gsap.registerPlugin(ScrollTrigger)

export function Act1Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const silRef = useRef<HTMLDivElement>(null)
  const uiRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Cursor glow follows mouse
    const handleMouse = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`
        cursorRef.current.style.top = `${e.clientY}px`
      }
    }
    window.addEventListener('mousemove', handleMouse)

    const ctx = gsap.context(() => {
      // Background parallax
      gsap.to(bgRef.current, {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      })
      
      // 3D Room parallax
      gsap.to(silRef.current, {
        yPercent: 35,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      })
      
      // UI Text parallax (faster)
      gsap.to(uiRef.current, {
        yPercent: 60,
        opacity: 0,
        ease: 'power1.in',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'center top',
          scrub: true
        }
      })

      // Text stagger animation on mount
      if (headlineRef.current) {
        const letters = headlineRef.current.querySelectorAll('.char')
        gsap.fromTo(letters, 
          { opacity: 0, y: 100, rotateX: -90 },
          { 
            opacity: 1, 
            y: 0, 
            rotateX: 0,
            duration: 1.2, 
            stagger: 0.03, 
            ease: 'expo.out',
            delay: 0.5
          }
        )
      }

      // Stats counter reveal
      if (statsRef.current) {
        gsap.fromTo(statsRef.current.children,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'expo.out',
            delay: 1.8
          }
        )
      }

      // Subtitle word-by-word reveal
      const subtitleWords = document.querySelectorAll('.hero-subtitle-word')
      gsap.fromTo(subtitleWords,
        { opacity: 0, y: 20, filter: 'blur(4px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 0.6,
          stagger: 0.08,
          ease: 'expo.out',
          delay: 1.2
        }
      )
    }, sectionRef)
    
    return () => {
      ctx.revert()
      window.removeEventListener('mousemove', handleMouse)
    }
  }, [])

  const subtitleText = "Architectural Harmony via Neuro-Fuzzy Logic & Genetic Algorithms"

  return (
    <section ref={sectionRef} className="relative h-[200vh] bg-[#05050A] overflow-hidden whitespace-nowrap">
      {/* Cursor glow orb — follows mouse */}
      <div ref={cursorRef} className="cursor-glow" />

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 z-[5] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-[0.07]"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, #2954ff, #8b5cf6, #f43f5e, #2954ff)',
            animation: 'spin 30s linear infinite',
          }}
        />
      </div>

      {/* Background layer (Parallax 0.15x) */}
      <div ref={bgRef} className="absolute inset-0 z-0 h-[120vh] w-full" style={{ pointerEvents: 'auto' }}>
         <Antigravity
            count={400}
            radius={30}
            magnetRadius={6}
            ringRadius={7}
            waveSpeed={0.4}
            waveAmplitude={1}
            particleSize={1.5}
            lerpSpeed={0.05}
            color="#5227FF"
            autoAnimate
            particleVariance={1}
            rotationSpeed={0.06}
            depthFactor={1}
            pulseSpeed={3}
            particleShape="tetrahedron"
            fieldStrength={10}
         />
      </div>
      
      {/* Middle Silhouettes / 3D Canvas wrapper (Parallax 0.35x) */}
      <div ref={silRef} className="absolute inset-0 z-10 h-screen w-full pointer-events-none flex items-center justify-center">
        <div className="w-full h-full opacity-60">
           <RoomAssemblyScene sectionRef={sectionRef} />
        </div>
      </div>
      
      {/* UI Overlay layer (Parallax 0.6x) */}
      <div ref={uiRef} className="relative z-20 h-screen w-full flex flex-col items-center justify-center pointer-events-none px-6">
        {/* Top label */}
        <div className="mb-4">
           <span className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-bold">Spatial Intelligence Engine</span>
        </div>
        
        {/* Headline with letter animation */}
        <h1 ref={headlineRef} className="font-serif text-6xl md:text-8xl lg:text-[10rem] text-center text-white mb-6 max-w-6xl tracking-tighter leading-[0.85] perspective-1000">
           {"LayoutMind".split('').map((char, cIdx) => (
             <span key={cIdx} className="char inline-block font-serif will-change-transform">{char}</span>
           ))}
        </h1>
        
        {/* Subtitle with word-by-word reveal */}
        <p className="font-sans text-sm md:text-lg text-white/40 mb-12 max-w-xl text-center tracking-[0.15em] font-light uppercase whitespace-normal">
           {subtitleText.split(' ').map((word, i) => (
             <span key={i} className="hero-subtitle-word inline-block mr-[0.5em]">{word}</span>
           ))}
        </p>

        {/* Stats row */}
        <div ref={statsRef} className="flex items-center gap-8 md:gap-16 mt-4 mb-12">
          {[
            { value: '40+', label: 'Generations' },
            { value: '8', label: 'Style Systems' },
            { value: '∞', label: 'Layouts' },
          ].map((stat, i) => (
            <div key={i} className="text-center opacity-0">
              <div className="text-3xl md:text-4xl font-light text-white tracking-tight counter-glow">{stat.value}</div>
              <div className="text-[9px] uppercase tracking-[0.3em] text-white/25 mt-1 font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="flex flex-col items-center gap-4 animate-bounce mt-8 opacity-20">
           <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
           <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Scroll to Begin</span>
        </div>
      </div>

      {/* CSS animation keyframe for gradient spin */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  )
}
