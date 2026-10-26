import { seededRandom } from '../../lib/seededRandom'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { RoomAssemblyScene } from '../../three/RoomAssemblyScene'

gsap.registerPlugin(ScrollTrigger)

export function Act1Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const bgRef      = useRef<HTMLDivElement>(null)
  const silRef     = useRef<HTMLDivElement>(null)
  const uiRef      = useRef<HTMLDivElement>(null)
  const headlineRef= useRef<HTMLHeadingElement>(null)
  const cursorRef  = useRef<HTMLDivElement>(null)
  const statsRef   = useRef<HTMLDivElement>(null)
  const nav = useNavigate()

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`
        cursorRef.current.style.top  = `${e.clientY}px`
      }
    }
    window.addEventListener('mousemove', handleMouse)

    const ctx = gsap.context(() => {
      // Background parallax
      gsap.to(bgRef.current, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: true }
      })
      // 3D Room parallax
      gsap.to(silRef.current, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: true }
      })
      // UI fade
      gsap.to(uiRef.current, {
        yPercent: 50, opacity: 0, ease: 'power1.in',
        scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'center top', scrub: true }
      })

      // Headline letter animation
      if (headlineRef.current) {
        const chars = headlineRef.current.querySelectorAll('.char')
        gsap.fromTo(chars,
          { opacity: 0, y: 80, rotateX: -80, filter: 'blur(8px)' },
          { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)',
            duration: 1.4, stagger: 0.04, ease: 'expo.out', delay: 0.3 }
        )
      }

      // Stats stagger
      if (statsRef.current) {
        gsap.fromTo(statsRef.current.children,
          { opacity: 0, y: 32, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.12, ease: 'expo.out', delay: 1.8 }
        )
      }

      // Subtitle words
      const subtitleWords = document.querySelectorAll('.hero-subtitle-word')
      gsap.fromTo(subtitleWords,
        { opacity: 0, y: 16, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.06, ease: 'expo.out', delay: 1.1 }
      )

      // Floating elements
      gsap.fromTo('.hero-badge',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: 0.2 }
      )
    }, sectionRef)

    return () => { ctx.revert(); window.removeEventListener('mousemove', handleMouse) }
  }, [])

  const headline = 'LayoutMind'
  const subtitle = 'Architectural Harmony via Neuro-Fuzzy Logic & Spatial Constraints'

  return (
    <section ref={sectionRef} className="relative h-[200vh] overflow-hidden" style={{ background: '#03030A' }}>
      {/* Cursor glow */}
      <div ref={cursorRef} className="cursor-glow" />

      {/* Animated gradient mesh */}
      <div ref={bgRef} className="absolute inset-0 z-0 h-[130vh]">
        <div className="mesh-bg absolute inset-0" />

        {/* Conic gradient orb */}
        <div className="absolute top-1/4 right-1/4 w-[800px] h-[800px] pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, #7C3AED22, #06B6D422, #7C3AED22)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            animation: 'spin 40s linear infinite',
          }}
        />

        {/* Particle field */}
        <div className="absolute inset-0 opacity-50">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: seededRandom(i*31+1) * 2 + 1 + 'px',
                height: seededRandom(i*31+2) * 2 + 1 + 'px',
                left: seededRandom(i*31+3) * 100 + '%',
                top: seededRandom(i*31+4) * 100 + '%',
                background: i % 2 === 0 ? '#7C3AED' : '#06B6D4',
                opacity: seededRandom(i*31+5) * 0.6 + 0.2,
                animation: `float-y ${3 + seededRandom(i*31+6) * 4}s ease-in-out ${seededRandom(i*31+7) * 2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 3D Room Scene */}
      <div ref={silRef} className="absolute inset-0 z-10 h-screen w-full pointer-events-none">
        <div className="w-full h-full opacity-50">
          <RoomAssemblyScene sectionRef={sectionRef} />
        </div>
      </div>

      {/* Cinematic vignette */}
      <div className="absolute inset-0 z-[12] pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, transparent 30%, rgba(3,3,10,0.7) 100%)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-40 z-[12] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #03030A)' }}
      />

      {/* UI Layer */}
      <div ref={uiRef} className="relative z-20 h-screen w-full flex flex-col items-center justify-center px-6 pointer-events-none">

        {/* Top badge */}
        <div className="hero-badge mb-8">
          <span className="badge-violet">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Spatial Intelligence Engine
          </span>
        </div>

        {/* Giant headline */}
        <h1 ref={headlineRef}
          className="text-center mb-6 max-w-5xl perspective-1000"
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(72px, 14vw, 160px)',
            fontWeight: 900,
            lineHeight: 0.88,
            letterSpacing: '-0.05em',
            color: 'white',
          }}
        >
          {headline.split('').map((char, i) => (
            <span key={i} className="char inline-block will-change-transform"
              style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p className="text-center mb-10 max-w-lg"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', lineHeight: 1.8 }}
        >
          {subtitle.split(' ').map((word, i) => (
            <span key={i} className="hero-subtitle-word inline-block mr-[0.5em]">{word}</span>
          ))}
        </p>

        {/* Stats row */}
        <div ref={statsRef} className="flex items-center gap-6 md:gap-12 mb-10">
          {[
            { value: '40+', label: 'GA Generations' },
            { value: '8',   label: 'Style Systems'  },
            { value: '∞',   label: 'Unique Layouts' },
          ].map((stat, i) => (
            <div key={i} className="text-center opacity-0">
              {/* Glass card stat */}
              <div className="glass rounded-2xl px-5 py-3 border border-white/06">
                <div className="counter-glow"
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: 'clamp(28px, 4vw, 44px)',
                    fontWeight: 300,
                    color: 'white',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >{stat.value}</div>
                <div className="text-label mt-1">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => nav('/studio')}
          className="pointer-events-auto btn-primary text-sm"
          style={{ fontSize: '13px', padding: '14px 32px' }}
        >
          Generate Your Space
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Scroll indicator */}
        <div className="scroll-indicator mt-12">
          <div className="scroll-indicator-line" />
          <div className="scroll-indicator-label">Scroll</div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </section>
  )
}
