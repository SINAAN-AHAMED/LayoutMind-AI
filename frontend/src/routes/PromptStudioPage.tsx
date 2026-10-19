import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { optimizeLayout, checkHealth } from '../lib/api'
import type { OptimizeRequest } from '../lib/api'
import { useStudioStore } from '../store/useStudioStore'

// ─── Constants ────────────────────────────────────────────────────────────────
const STYLES = ['Modern', 'Cozy', 'Luxury', 'Minimal', 'Compact', 'Bohemian'] as const
const PLACEHOLDER = 'Design a modern living room 7 by 6 meters under ₹4,50,000...'
const PRESETS = [
  'Design a modern living room 7×6m under ₹4,50,000',
  'Design a cozy bedroom 4×5m with wardrobe and study table',
  'Design a compact studio apartment 5×5m under ₹2,00,000',
]
const FLOOR_MATERIALS = ['Wood', 'Tile', 'Carpet', 'Marble', 'Granite', 'Epoxy']
const WALL_MATERIALS = ['Plain', 'Panel', 'Brick', 'Wallpaper', 'Textured', 'Stone']

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  label: {
    display: 'block',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.25em',
    color: '#6B6560',
    marginBottom: '20px',
  } as React.CSSProperties,
  chip: (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    border: `1px solid ${active ? '#2D3B2D' : '#E8E2DA'}`,
    background: active ? '#2D3B2D' : 'transparent',
    color: active ? '#FAF8F5' : '#6B6560',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    cursor: 'pointer',
    transition: 'all 0.25s',
  }),
  materialChip: (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    border: `1px solid ${active ? '#1A1A1A' : '#E8E2DA'}`,
    background: 'transparent',
    color: active ? '#1A1A1A' : '#6B6560',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PromptStudioPage() {
  const nav = useNavigate()
  const st = useStudioStore()
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const [activeFloor, setActiveFloor] = useState('Wood')
  const [activeWall, setActiveWall] = useState('Panel')

  // Poll Python engine health every 5 seconds
  useEffect(() => {
    const check = async () => {
      try {
        const ctrl = new AbortController()
        const timeout = setTimeout(() => ctrl.abort(), 3000)
        const isOk = await checkHealth(ctrl.signal)
        clearTimeout(timeout)
        setServiceStatus(isOk ? 'ok' : 'error')
      } catch {
        setServiceStatus('error')
      }
    }
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [])

  async function onGenerate() {
    const promptToUse = st.prompt.trim() || PLACEHOLDER
    if (!st.prompt.trim()) st.setPrompt(promptToUse)
    st.setOptimizing(true)
    try {
      const payload: OptimizeRequest = {
        prompt: promptToUse,
        explicitStyle: st.explicitStyle,
        addPlants: st.addPlants,
        addRugs: st.addRugs,
      }
      const result = await optimizeLayout(payload)
      st.setResult(result)
      nav('/workspace')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      alert(`Generation failed: ${msg}\n\nMake sure Python is installed and the AI engine started.`)
    } finally {
      st.setOptimizing(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', overflow: 'hidden',
        fontFamily: "'DM Sans', sans-serif",
        background: '#FAF8F5', color: '#1A1A1A',
      }}
    >

      {/* ══ LEFT PANEL ══════════════════════════════════════════════════════════ */}
      <aside style={{
        width: '420px', flexShrink: 0, height: '100%',
        background: '#FAF8F5',
        borderRight: '1px solid #E8E2DA',
        display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 10,
      }}>

        {/* Header */}
        <header style={{ padding: '32px 40px 24px', borderBottom: '1px solid #E8E2DA', flexShrink: 0 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 400, color: '#1A1A1A', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            LayoutMind
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#C9A96E' }}>
            AI INTERIOR STUDIO
          </p>
        </header>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

          {/* Section 1 — Prompt */}
          <section>
            <label style={S.label}>YOUR VISION</label>
            <div>
              <textarea
                value={st.prompt}
                onChange={e => st.setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onGenerate() }}
                placeholder="Describe your ideal interior space..."
                rows={5}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'transparent',
                  border: 'none', borderBottom: '1px solid #1A1A1A',
                  padding: '0 0 12px 0', outline: 'none',
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic', fontSize: '16px',
                  color: '#1A1A1A', resize: 'none',
                  lineHeight: 1.6,
                }}
                onFocus={e => { e.currentTarget.style.borderBottomColor = '#C9A96E' }}
                onBlur={e => { e.currentTarget.style.borderBottomColor = '#1A1A1A' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#C9A96E' }}>
                  Ctrl+Enter to generate
                </span>
              </div>
            </div>
          </section>

          {/* Section 2 — Style */}
          <section>
            <label style={S.label}>AESTHETIC DIRECTION</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {STYLES.map(style => (
                <button
                  key={style}
                  onClick={() => st.setExplicitStyle(st.explicitStyle === style ? '' : style)}
                  style={S.chip(st.explicitStyle === style)}
                  onMouseEnter={e => { if (st.explicitStyle !== style) { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.color = '#1A1A1A' } }}
                  onMouseLeave={e => { if (st.explicitStyle !== style) { e.currentTarget.style.borderColor = '#E8E2DA'; e.currentTarget.style.color = '#6B6560' } }}
                >
                  {style}
                </button>
              ))}
            </div>
          </section>

          {/* Section 3 — Materials */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <label style={S.label}>FLOOR MATERIAL</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {FLOOR_MATERIALS.map(m => (
                  <span
                    key={m}
                    onClick={() => setActiveFloor(m)}
                    style={S.materialChip(activeFloor === m)}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label style={S.label}>WALL MATERIAL</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {WALL_MATERIALS.map(m => (
                  <span
                    key={m}
                    onClick={() => setActiveWall(m)}
                    style={S.materialChip(activeWall === m)}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Section 4 — Space Elements */}
          <section>
            <label style={S.label}>SPACE ELEMENTS</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Indoor Plants', value: st.addPlants, set: st.setAddPlants },
                { label: 'Center Rugs', value: st.addRugs, set: st.setAddRugs },
              ].map(opt => (
                <label
                  key={opt.label}
                  onClick={() => opt.set(!opt.value)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                >
                  <div style={{
                    width: '16px', height: '16px',
                    border: '1px solid #1A1A1A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: opt.value ? '#2D3B2D' : 'transparent',
                    transition: 'all 0.2s', flexShrink: 0,
                  }}>
                    {opt.value && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FAF8F5" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: opt.value ? '#1A1A1A' : '#6B6560', transition: 'color 0.2s' }}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Section 4.5 — Ceiling Height */}
          <section>
            <label style={S.label}>CEILING HEIGHT</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 300, color: '#1A1A1A', minWidth: '54px' }}>
                {st.roomHeightM.toFixed(1)}m
              </span>
              <input
                id="studio-room-height-slider"
                type="range"
                min={2.0}
                max={5.0}
                step={0.1}
                value={st.roomHeightM}
                onChange={e => st.setRoomHeight(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#C9A96E', cursor: 'pointer' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[2.4, 2.8, 3.2, 3.6, 4.0, 4.5].map(h => (
                <button
                  key={h}
                  onClick={() => st.setRoomHeight(h)}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600,
                    padding: '6px 12px',
                    border: `1px solid ${Math.abs(st.roomHeightM - h) < 0.05 ? '#2D3B2D' : '#E8E2DA'}`,
                    background: Math.abs(st.roomHeightM - h) < 0.05 ? '#2D3B2D' : 'transparent',
                    color: Math.abs(st.roomHeightM - h) < 0.05 ? '#FAF8F5' : '#6B6560',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {h.toFixed(1)}m
                </button>
              ))}
            </div>
          </section>

          {/* Section 5 — Presets */}
          <section>
            <label style={S.label}>QUICK COMPOSITIONS</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {PRESETS.map((preset, i) => (
                <div
                  key={preset}
                  onClick={() => st.setPrompt(preset)}
                  style={{
                    paddingLeft: '16px',
                    borderLeft: `2px solid ${i === 0 ? '#C9A96E' : 'transparent'}`,
                    cursor: 'pointer', paddingTop: '4px', paddingBottom: '4px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderLeftColor = '#C9A96E'; e.currentTarget.style.background = 'rgba(242,237,232,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderLeftColor = i === 0 ? '#C9A96E' : 'transparent'; e.currentTarget.style.background = 'transparent' }}
                >
                  <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '14px', color: i === 0 ? '#1A1A1A' : '#6B6560', lineHeight: 1.5, margin: 0 }}>
                    "{preset}"
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer style={{ padding: '24px 40px', borderTop: '1px solid #E8E2DA', background: '#FAF8F5', flexShrink: 0 }}>
          <button
            onClick={onGenerate}
            disabled={st.isOptimizing}
            style={{
              width: '100%',
              padding: '16px',
              background: st.isOptimizing ? '#6B6560' : '#2D3B2D',
              color: '#FAF8F5',
              border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '11px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.2em',
              cursor: st.isOptimizing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginBottom: '12px',
            }}
            onMouseEnter={e => { if (!st.isOptimizing) e.currentTarget.style.background = '#1a2a1a' }}
            onMouseLeave={e => { if (!st.isOptimizing) e.currentTarget.style.background = '#2D3B2D' }}
          >
            {st.isOptimizing ? (
              <>
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(250,248,245,0.3)', borderTopColor: '#FAF8F5', display: 'inline-block', animation: 'elyse-spin 0.8s linear infinite' }} />
                Processing Layout...
              </>
            ) : (
              <>
                GENERATE LAYOUT
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>

          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: serviceStatus === 'ok' ? '#C9A96E' : serviceStatus === 'error' ? '#8B5E52' : '#E8E2DA',
              animation: 'elyse-pulse 2s ease infinite',
            }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6B6560' }}>
              {serviceStatus === 'ok' ? 'AI Engine ready' : serviceStatus === 'error' ? 'Engine offline' : 'Connecting...'}
            </span>
          </div>
        </footer>
      </aside>

      {/* ══ RIGHT PANEL ═════════════════════════════════════════════════════════ */}
      <main style={{
        flex: 1, height: '100%',
        background: '#F2EDE8',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Version watermark */}
        <div style={{ position: 'absolute', top: '32px', right: '40px', zIndex: 20 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#6B6560' }}>
            LAYOUTMIND v1.0
          </span>
        </div>

        {/* Center wireframe illustration */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
          <div style={{ width: '100%', maxWidth: '700px' }}>
            <img
              alt="Architectural wireframe"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhosh8L-GD7OwcyKM48HyfCzsgiDcb7EKWNBkqWdjLwZsQYt0f0c30LOH8e5L8GHHFgVwLdThFL94tuCr58B8Ou4t6BKkj7ultiI-ksjkTDZ2ueudx5JkUfarmmzYlSiH2KQgwaPC_jiHnyyuy9ccGlalyL-dDviCljc0lr41HcK52CxXyNPD2jJxoj19i2HomLEZnfMgUOxNtHu5UUIT5kg_3mdYM3mF_zqBtO6clqBEZCZLEvV_grnY9buk2SKNZgtlhqLzmyRY"
              style={{ width: '100%', height: 'auto', objectFit: 'contain', mixBlendMode: 'multiply', opacity: 0.75 }}
            />
          </div>
        </div>

        {/* Bottom row */}
        <div style={{
          padding: '32px 40px',
          borderTop: '1px solid #E8E2DA',
          background: 'rgba(242,237,232,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'relative', zIndex: 20,
        }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '64px' }}>
            {[
              { value: '40+', label: 'Generations' },
              { value: '8', label: 'Styles' },
              { value: '∞', label: 'Layouts' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 400, color: '#1A1A1A' }}>
                  {s.value}
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6B6560', marginTop: '4px' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Tech tags */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {['NLP', 'Scikit-Fuzzy', 'DEAP', 'R3F'].map(tag => (
              <span key={tag} style={{
                padding: '4px 10px',
                border: '1px solid #C9A96E',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '9px', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.2em',
                color: '#C9A96E',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Keyframes */}
      <style>{`
        @keyframes elyse-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes elyse-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=Playfair+Display:ital,wght@0,300;0,400;1,400&display=swap');
      `}</style>
    </div>
  )
}
