import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function RoomCraftPage() {
  const nav = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const heroImgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Parallax on hero image
  useEffect(() => {
    const onScroll = () => {
      if (heroImgRef.current) {
        heroImgRef.current.style.transform = `translateY(${window.scrollY * 0.12}px)`
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="bg-background text-on-surface font-body antialiased flex flex-col min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── NAVIGATION ── */}
      <header
        id="main-nav"
        className="fixed top-0 w-full z-50 flex justify-between items-center px-20 py-6 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(250,248,245,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: `1px solid ${scrolled ? '#C9A96E40' : 'transparent'}`,
        }}
      >
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 300, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
          LayoutMind
        </div>
        <nav className="hidden md:flex items-center" style={{ gap: '48px' }}>
          {['Studio', 'Philosophy', 'Portfolio'].map(link => (
            <button
              key={link}
              onClick={() => link === 'Studio' ? nav('/studio') : undefined}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#6B6560', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.3s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#2D3B2D')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6B6560')}
            >
              {link}
            </button>
          ))}
        </nav>
        <button
          onClick={() => nav('/studio')}
          style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.25em',
            padding: '12px 24px', background: 'transparent',
            border: '1px solid #2D3B2D', color: '#1A1A1A',
            cursor: 'pointer', transition: 'all 0.3s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2D3B2D'; e.currentTarget.style.color = '#FAF8F5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1A1A1A' }}
        >
          Begin Design
        </button>
      </header>

      <main style={{ flex: 1, paddingTop: '0' }}>

        {/* ── HERO SECTION ── */}
        <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', position: 'relative' }}>
          {/* Left column */}
          <div style={{ width: '60%', paddingLeft: '80px', paddingRight: '64px', paddingTop: '148px', paddingBottom: '96px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 10 }}>

            {/* Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <span style={{ width: '32px', height: '1px', background: '#C9A96E', display: 'block' }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#6B6560' }}>
                AI · SPATIAL INTELLIGENCE
              </span>
            </div>

            {/* Giant headline */}
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(72px, 8.5vw, 110px)',
              fontWeight: 300,
              color: '#1A1A1A',
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              marginBottom: '48px',
            }}>
              Design<br />
              Without<br />
              Limits.
            </h1>

            {/* Gold divider */}
            <div style={{ height: '1px', width: '100%', background: 'rgba(201,169,110,0.5)', marginBottom: '48px' }} />

            {/* Subtext */}
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B6560', maxWidth: '400px', lineHeight: 1.7, marginBottom: '48px' }}>
              Generative AI meets neuro-fuzzy logic — designing interior spaces that honor your vision.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '64px', flexWrap: 'wrap' }}>
              <button
                onClick={() => nav('/studio')}
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.2em',
                  padding: '16px 32px', background: '#2D3B2D', color: '#FAF8F5',
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1a2a1a')}
                onMouseLeave={e => (e.currentTarget.style.background = '#2D3B2D')}
              >
                Generate a Space →
              </button>
              <button
                onClick={() => { document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) }}
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.2em',
                  padding: '16px 32px', background: 'transparent',
                  border: '1px solid #2D3B2D', color: '#1A1A1A',
                  cursor: 'pointer', transition: 'all 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2D3B2D'; e.currentTarget.style.color = '#FAF8F5' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1A1A1A' }}
              >
                See How It Works
              </button>
            </div>

            {/* Footer label */}
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#C9A96E' }}>
              Powered by Genetic Algorithms &amp; NLP
            </span>
          </div>

          {/* Right image panel */}
          <div style={{ width: '40%', position: 'relative', overflow: 'hidden', borderLeft: '1px solid #E8E2DA', background: '#F2EDE8' }}>
            <div
              ref={heroImgRef}
              style={{
                position: 'absolute',
                inset: '-10%',
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCTP_EHC5Lhimf37Za7nvNVKLOnlDXYovH-bxbtg29QxSTwjmLYuhIcINsu4aEjzk11Uh5vr7WvS55sUMr1duB_5T-iSaBOx7VWC3udhdxS0gDBB5RkRtVxmp8y_dkuBDWz0z7W6ImjIn4EYEMgoZdW8Vo_-XHNkV8LxM4RtEKbVwr803fKL-FGIsGN4zqcnfImjxZbv_8fJIcWc6BoyR2m1S_RyFqLq0FWqDqzNK2Xm6R6bEe6zbeDn-e9XzYWwErWVRcrwX7u2e0')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'transform 0.1s linear',
              }}
            />
            {/* Efficiency badge */}
            <div style={{ position: 'absolute', top: '48px', left: '48px', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)', border: '1px solid #E8E2DA', padding: '12px 20px' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C9A96E', display: 'block' }} />
                76.4% Space Efficiency
              </span>
            </div>
            {/* Room label */}
            <div style={{ position: 'absolute', bottom: '48px', left: '48px', background: 'white', border: '1px solid #E8E2DA', padding: '10px 20px' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#1A1A1A' }}>
                Living Room · Modern · Luxury
              </span>
            </div>
          </div>
        </section>

        {/* ── STATS SECTION ── */}
        <section style={{ background: '#F2EDE8', padding: '96px 0', borderTop: '1px solid #C9A96E' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 80px' }}>
            <div style={{ marginBottom: '64px' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#C9A96E' }}>
                BY THE NUMBERS
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0' }}>
              {[
                { value: '40+', label: 'Genetic Algorithm Generations' },
                { value: '8', label: 'Interior Style Systems Available' },
                { value: '∞', label: 'Unique Spatial Layouts Generated' },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    padding: i === 0 ? '0 48px 0 0' : i === 2 ? '0 0 0 48px' : '0 48px',
                    borderLeft: i > 0 ? '1px solid rgba(201,169,110,0.4)' : 'none',
                  }}
                >
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(64px, 6vw, 96px)', color: '#1A1A1A', lineHeight: 1, marginBottom: '16px', fontWeight: 300 }}>
                    {stat.value}
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B6560', lineHeight: 1.6 }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS SECTION ── */}
        <section id="how-it-works" style={{ background: '#FAF8F5', padding: '128px 0', borderBottom: '1px solid rgba(201,169,110,0.4)' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 80px' }}>

            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '96px', gap: '48px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <span style={{ width: '32px', height: '1px', background: '#C9A96E', display: 'block' }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#6B6560' }}>
                    THE PROCESS
                  </span>
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(40px, 4.5vw, 64px)', fontWeight: 400, color: '#1A1A1A', lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: '600px' }}>
                  From Words to<br />Architectural Reality
                </h2>
              </div>
              <div style={{ maxWidth: '400px', paddingTop: '16px' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B6560', lineHeight: 1.7 }}>
                  Our proprietary engine translates your natural language descriptions into mathematically rigorous spatial layouts, balancing aesthetic intent with structural constraints.
                </p>
              </div>
            </div>

            {/* Steps grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '64px' }}>
              {[
                {
                  num: '01', title: 'Describe Your Vision',
                  desc: 'Input your aesthetic preferences, functional requirements, and spatial dimensions using natural language or structured parameters.',
                },
                {
                  num: '02', title: 'AI Analysis',
                  desc: 'The engine generates hundreds of layout permutations, optimizing for light flow, spatial efficiency, and adherence to your style parameters.',
                },
                {
                  num: '03', title: '3D Visualization',
                  desc: 'Review photorealistic renders of the top configurations, complete with material suggestions and structural blueprints ready for implementation.',
                },
              ].map((step, i) => (
                <div key={i} style={{ position: 'relative' }}
                  onMouseEnter={e => { const line = e.currentTarget.querySelector('.step-line') as HTMLElement; if (line) line.style.background = '#C9A96E' }}
                  onMouseLeave={e => { const line = e.currentTarget.querySelector('.step-line') as HTMLElement; if (line) line.style.background = '#E8E2DA' }}
                >
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '120px', color: '#C9A96E', opacity: 0.12, fontWeight: 300, lineHeight: 1, position: 'absolute', top: '-40px', left: '-24px', pointerEvents: 'none', userSelect: 'none' }}>
                    {step.num}
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 400, color: '#1A1A1A', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B6560', lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
                    {step.desc}
                  </p>
                  <div className="step-line" style={{ marginTop: '32px', height: '1px', background: '#E8E2DA', transition: 'background 0.5s' }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section style={{ background: '#FAF8F5', padding: '120px 80px', textAlign: 'center' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
              <span style={{ width: '32px', height: '1px', background: '#C9A96E', display: 'block' }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#6B6560' }}>
                BEGIN
              </span>
              <span style={{ width: '32px', height: '1px', background: '#C9A96E', display: 'block' }} />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(40px, 4.5vw, 64px)', fontWeight: 400, color: '#1A1A1A', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '32px' }}>
              Your Space Awaits
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#6B6560', lineHeight: 1.7, marginBottom: '48px' }}>
              Describe your ideal interior and let our AI engine design a layout tailored to your vision, budget, and aesthetic.
            </p>
            <button
              onClick={() => nav('/studio')}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.2em',
                padding: '18px 48px', background: '#2D3B2D', color: '#FAF8F5',
                border: 'none', cursor: 'pointer', transition: 'all 0.3s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1a2a1a')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2D3B2D')}
            >
              Generate a Space →
            </button>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1A1A1A', color: '#F2EDE8', padding: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 300, color: '#F2EDE8', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            LayoutMind
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(242,237,232,0.55)' }}>
            © 2026 LayoutMind. A Generative AI Interior Studio.
          </p>
        </div>
        <nav style={{ display: 'flex', gap: '40px' }}>
          {['Privacy', 'Terms', 'Contact'].map(link => (
            <a key={link} href="#"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(242,237,232,0.55)', textDecoration: 'none', transition: 'color 0.3s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C9A96E')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(242,237,232,0.55)')}
            >{link}</a>
          ))}
        </nav>
      </footer>
    </div>
  )
}
