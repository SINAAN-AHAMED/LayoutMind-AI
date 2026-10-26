import {APP_BUILD} from '../lib/buildInfo'
import {roomDesign} from '../lib/roomDesign'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { optimizeLayout, checkHealth } from '../lib/api'
import type { OptimizeRequest } from '../lib/api'
import {optionalNumber,boundedNumber} from '../lib/parameters'
import { useStudioStore } from '../store/useStudioStore'

// ─── Constants ────────────────────────────────────────────────────────────────
const STYLES = ['Modern', 'Cozy', 'Luxury', 'Minimal', 'Compact', 'Bohemian', 'Industrial', 'Coastal'] as const
const PLACEHOLDER = 'Design a modern living room 7 by 6 meters under ₹4,50,000...'
const ROOM_TYPES = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room', 'Home Office'] as const
const PRESETS = [
  'Design a modern living room 7×6m under ₹4,50,000',
  'Design a cozy bedroom 4×5m with bed, wardrobe and study table',
  'Design a kitchen 5×4m with kitchen counter, stove, fridge and island under ₹3,00,000',
  'Design a modern bathroom 3×3m with shower, toilet and vanity under ₹1,50,000',
  'Design a dining room 5×4m with dining table and chairs',
  'Design a home office 4×4m with desk, chair and bookshelf',
]
const FLOOR_MATERIALS = ['Wood', 'Parquet', 'Tile', 'Carpet', 'Marble', 'Granite', 'Epoxy', 'Concrete', 'Terrazzo']
const WALL_MATERIALS = ['Plain', 'Plaster', 'Lime', 'Panel', 'Fluted', 'Brick', 'Wallpaper', 'Textured', 'Fabric', 'Stone', 'Concrete', 'Ceramic']

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  label: {
    display: 'block',
    fontFamily: "'DM Sans Variable', sans-serif",
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
    fontFamily: "'DM Sans Variable', sans-serif",
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
    fontFamily: "'DM Sans Variable', sans-serif",
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
  const activeFloor = st.floorMaterial
  const activeWall = st.wallMaterial

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
    if(st.isOptimizing)return
    const promptToUse = st.prompt.trim() || PLACEHOLDER
    if (!st.prompt.trim()) st.setPrompt(promptToUse)
    st.setOptimizing(true)
    try {
      const payload: OptimizeRequest = {
        prompt: promptToUse,
        explicitStyle: st.explicitStyle,
        addPlants: st.addPlants,
        addRugs: st.addRugs,
        roomType: st.preferredRoomType ?? undefined,
        lengthM: boundedNumber(st.preferredLengthM,2,15) ?? undefined,
        widthM: boundedNumber(st.preferredWidthM,2,15) ?? undefined,
        budgetINR: boundedNumber(st.preferredBudgetINR,20000,1000000) ?? undefined,
      }
      const result = await optimizeLayout(payload)
      const first=result.solutions[0]
      if(first&&st.autoSurfaces){
        const defaults=roomDesign(first.room.type,first.selectedStyles[0]??'Modern')
        result.customization={...defaults,roomHeightM:st.roomHeightM,lightingMode:st.lightingMode}
      }
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
        fontFamily: "'DM Sans Variable', sans-serif",
        background: '#FAF8F5', color: '#1A1A1A',
      }}
    >

      {/* ══ LEFT PANEL ══════════════════════════════════════════════════════════ */}
      <aside data-lenis-prevent className="prompt-sidebar" style={{
        width: '420px', flexShrink: 0, height: '100%',
        background: '#FAF8F5',
        borderRight: '1px solid #E8E2DA',
        display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 10,
      }}>

        {/* Header */}
        <header style={{ padding: '32px 40px 24px', borderBottom: '1px solid #E8E2DA', flexShrink: 0 }}>
          <h1 style={{ fontFamily: "'Playfair Display Variable', serif", fontSize: '22px', fontWeight: 400, color: '#1A1A1A', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            LayoutMind
          </h1>
          <p style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#C9A96E' }}>
            AI INTERIOR STUDIO
          </p>
        </header>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior:'contain', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

          {/* Section 1 — Prompt */}
          <section>
            <label style={S.label}>YOUR VISION</label>
            <div>
              <textarea aria-label="Room description" maxLength={600}
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
                  fontFamily: "'Playfair Display Variable', serif",
                  fontStyle: 'italic', fontSize: '16px',
                  color: '#1A1A1A', resize: 'none',
                  lineHeight: 1.6,
                }}
                onFocus={e => { e.currentTarget.style.borderBottomColor = '#C9A96E' }}
                onBlur={e => { e.currentTarget.style.borderBottomColor = '#1A1A1A' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#C9A96E' }}>
                  Ctrl+Enter to generate
                </span>
              </div>
            </div>
          </section>

          {/* Room type — explicit selection and prompt presets */}
          <section>
            <label style={S.label}>ROOM TYPE</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
              <button type="button" onClick={() => st.setPreferredRoomType(null)} style={S.chip(st.preferredRoomType === null)} aria-pressed={st.preferredRoomType === null}>AUTO DETECT</button>
              {ROOM_TYPES.map(type => (
                <button key={type} type="button" onClick={() => st.setPreferredRoomType(type)} style={S.chip(st.preferredRoomType === type)} aria-pressed={st.preferredRoomType === type}>
                  {type}
                </button>
              ))}
            </div>
          </section>
          {/* Optional exact dimensions and budget (otherwise parsed from the prompt) */}
          <section>
            <label style={S.label}>SPACE PARAMETERS <span style={{fontSize:9,color:'#B09B7B',letterSpacing:'.04em'}}>· OPTIONAL</span></label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
              {([
                {name:'LENGTH (M)', value:st.preferredLengthM, set:st.setPreferredLengthM},
                {name:'WIDTH (M)', value:st.preferredWidthM, set:st.setPreferredWidthM},
              ] as const).map(d=><label key={d.name} style={{fontSize:9,color:'#6B6560',letterSpacing:'.13em'}}>
                {d.name}
                <input type="number" min={2} max={15} step={.5} value={d.value ?? ''}
                  onChange={e => d.set(optionalNumber(e.target.value))}
                  onBlur={e=>d.set(boundedNumber(optionalNumber(e.target.value),2,15))}
                  placeholder="From prompt" style={{display:'block',width:'100%',marginTop:8,padding:'10px',fontFamily:"'DM Sans Variable', sans-serif",fontSize:12,color:'#2D3B2D',background:'transparent',border:'1px solid #E8E2DA',boxSizing:'border-box'}}/>
              </label>)}
            </div>
            <label style={{display:'block',marginTop:14,fontSize:9,color:'#6B6560',letterSpacing:'.13em'}}>BUDGET (INR)
              <input type="number" min={20000} max={1000000} step={5000} value={st.preferredBudgetINR ?? ''}
                onChange={e=>st.setPreferredBudgetINR(optionalNumber(e.target.value))}
                onBlur={e=>st.setPreferredBudgetINR(boundedNumber(optionalNumber(e.target.value),20000,1000000))}
                placeholder="From prompt" style={{display:'block',width:'100%',marginTop:8,padding:'10px',fontFamily:"'DM Sans Variable', sans-serif",fontSize:12,color:'#2D3B2D',background:'transparent',border:'1px solid #E8E2DA',boxSizing:'border-box'}}/>
            </label>
            <p style={{fontSize:10,color:'#A39C93',marginTop:8,lineHeight:1.4}}>Leave fields empty to detect measurements from your description.</p>
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
                    onClick={() => st.setFloorMaterial(m as typeof st.floorMaterial)}
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
                    onClick={() => st.setWallMaterial(m as typeof st.wallMaterial)}
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
                  <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '15px', color: opt.value ? '#1A1A1A' : '#6B6560', transition: 'color 0.2s' }}>
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
              <span style={{ fontFamily: "'Playfair Display Variable', serif", fontSize: '24px', fontWeight: 300, color: '#1A1A1A', minWidth: '54px' }}>
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
                    fontFamily: "'DM Sans Variable', sans-serif", fontSize: '10px', fontWeight: 600,
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
                  onClick={() => { st.setPrompt(preset); st.setPreferredRoomType(null); st.setPreferredLengthM(null); st.setPreferredWidthM(null); st.setPreferredBudgetINR(null) }}
                  style={{
                    paddingLeft: '16px',
                    borderLeft: `2px solid ${i === 0 ? '#C9A96E' : 'transparent'}`,
                    cursor: 'pointer', paddingTop: '4px', paddingBottom: '4px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderLeftColor = '#C9A96E'; e.currentTarget.style.background = 'rgba(242,237,232,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderLeftColor = i === 0 ? '#C9A96E' : 'transparent'; e.currentTarget.style.background = 'transparent' }}
                >
                  <p style={{ fontFamily: "'Playfair Display Variable', serif", fontStyle: 'italic', fontSize: '14px', color: i === 0 ? '#1A1A1A' : '#6B6560', lineHeight: 1.5, margin: 0 }}>
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
              fontFamily: "'DM Sans Variable', sans-serif",
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
            <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6B6560' }}>
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
        {/* Center wireframe illustration */}
        <div style={{ flex: 1, minHeight:0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <div style={{ width: '100%', maxWidth: '700px' }}>
            <img
              alt="One-bedroom apartment plan with a dedicated foyer opening to the living room, and a separate kitchen, bedroom and bathroom"
              src={`${import.meta.env.BASE_URL}images/architectural-blueprint.svg?v=${APP_BUILD}`}
              style={{ width: '100%', height: 'auto', maxHeight:'calc(100vh - 160px)', objectFit: 'contain', opacity: 1 }}
            />
          </div>
        </div>

      </main>

      {/* Keyframes */}
      <style>{`
        @keyframes elyse-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes elyse-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}
