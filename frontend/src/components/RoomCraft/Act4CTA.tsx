import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function Act4CTA() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal CTA text
      const words = gsap.utils.toArray('.cta-word') as HTMLElement[]
      gsap.fromTo(words,
        { opacity: 0, y: 30, filter: 'blur(6px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 0.7,
          stagger: 0.06,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      )

      // Floating orbs
      gsap.utils.toArray('.cta-orb').forEach((orb: any, i: number) => {
        gsap.to(orb, {
          y: -20 + i * 5,
          x: 10 - i * 8,
          duration: 3 + i,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const headline = "Ready to Design Your Perfect Space?"

  return (
    <section ref={sectionRef} className="relative w-full min-h-[80vh] flex items-center justify-center bg-[#05050A] overflow-hidden">
      {/* Background gradient orbs */}
      <div className="cta-orb absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#2954FF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="cta-orb absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#8b5cf6]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="cta-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#f43f5e]/8 rounded-full blur-[80px] pointer-events-none" />

      {/* Grid lines overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-4xl">
        {/* Overline */}
        <div className="mb-6" data-animate="fade-up">
          <span className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-bold">Launch Your Vision</span>
        </div>

        {/* Word-by-word headline */}
        <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-tight mb-8">
          {headline.split(' ').map((word, i) => (
            <span key={i} className="cta-word inline-block mr-[0.3em]">{word}</span>
          ))}
        </h2>

        {/* Subtext */}
        <p className="text-white/40 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed" data-animate="fade-up">
          Harness neuro-fuzzy inference, genetic optimization, and real-time NLP to generate
          architecturally precise 3D interior layouts in seconds.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4" data-animate="fade-up">
          <a href="#prompt-studio" 
            className="btn-glow magnetic-hover px-10 py-4 bg-white text-black rounded-full font-bold text-lg tracking-wide shadow-2xl inline-flex items-center gap-3 transition-all"
          >
            Start Designing
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
          <a href="https://github.com/SINAAN-AHAMED" target="_blank" rel="noopener noreferrer"
            className="magnetic-hover px-8 py-4 border border-white/15 text-white/60 rounded-full font-medium text-sm tracking-wide hover:border-white/30 hover:text-white/80 transition-all inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            View Source
          </a>
        </div>

        {/* Tech stack badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-3" data-animate="fade-up">
          {['Three.js', 'React', 'DEAP', 'spaCy', 'scikit-fuzzy', 'FastAPI'].map((tech, i) => (
            <span key={i} 
              className="float-in px-4 py-1.5 rounded-full border border-white/8 text-white/30 text-[11px] font-semibold tracking-wider uppercase hover:border-white/20 hover:text-white/50 transition-all cursor-default"
              style={{ animationDelay: `${1.5 + i * 0.1}s` }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
