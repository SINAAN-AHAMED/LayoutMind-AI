import {surfaceIsDark} from '../lib/headerContrast'
import {designThemes} from '../lib/designThemes'
import {APP_BUILD} from '../lib/buildInfo'
import {StorageNotice} from '../components/StorageNotice'
import {CameraPanel} from '../components/CameraPanel'
import type {CameraDragMode,CameraNavigationHandle} from '../lib/cameraNavigation'
import {PetPanel} from '../components/PetPanel'
import { FurnitureEditor } from '../components/FurnitureEditor'
import { editItem,addItem,resetEdits } from '../lib/editorOps'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudioStore } from '../store/useStudioStore'
import { InteriorCanvas } from '../three/InteriorCanvas'
import { GenerationSidebar } from '../components/GenerationHistory/GenerationSidebar'
import { SaveLoadPanel } from '../components/SaveLoadPanel'
import { CostBreakdown } from '../components/CostBreakdown'
import { FurnitureSwapPanel } from '../components/FurnitureSwapPanel'
import { GlobalMaterialsPanel } from '../components/GlobalMaterialsPanel'
import { DesignSuggestionsPanel } from '../components/DesignSuggestionsPanel'

import { exportLayoutPDF } from '../lib/exportPDF'
import type { FurnitureItem } from '../types/layout'

export function WorkspacePage() {
  const nav = useNavigate()
  const result = useStudioStore((state) => state.lastResult)
  const isOptimizing = useStudioStore((state) => state.isOptimizing)
  const activeSnapshotIndex = useStudioStore((state) => state.activeSnapshotIndex)
  const ghostMode = useStudioStore((state) => state.ghostMode)
  const roomHeightM = useStudioStore((state) => state.roomHeightM)
  const setRoomHeight = useStudioStore((state) => state.setRoomHeight)
  const petPanelOpen=useStudioStore(s=>s.petPanelOpen)
  const openPetPanel=useStudioStore(s=>s.openPetPanel)
  const dragMode = useStudioStore((state) => state.dragMode)
  const toggleDragMode = useStudioStore((state) => state.toggleDragMode)
  const clearItemOverrides = resetEdits
  const [headerDark,setHeaderDark]=React.useState<boolean|null>(null)
  const wallColor=useStudioStore(s=>s.wallColor)
  const [showRemovedNotice, setShowRemovedNotice] = React.useState(true)
  const [showPanel, setShowPanel] = React.useState(true)
  const [showSaveLoad, setShowSaveLoad] = React.useState(false)
  const [showCostBreakdown, setShowCostBreakdown] = React.useState(false)
  const [showFurnitureSwap, setShowFurnitureSwap] = React.useState(false)
  const [showMaterialsPanel, setShowMaterialsPanel] = React.useState(false)
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [showHeightSlider, setShowHeightSlider] = React.useState(false)
  const [showCamera,setShowCamera]=React.useState(false)
  const [cameraMode,setCameraMode]=React.useState<CameraDragMode>('orbit')
  const cameraNavigation=React.useRef<CameraNavigationHandle>(null)
  const topView=useStudioStore(s=>s.topView)
  const selectedLayoutId=useStudioStore(s=>s.selectedLayoutId)
  const elyseFont = { fontFamily: "'DM Sans Variable', sans-serif" } as React.CSSProperties
  const elyseFontSerif = { fontFamily: "'Playfair Display Variable', serif" } as React.CSSProperties

  if (isOptimizing) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF8F5', ...elyseFont }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              style={{ position: 'absolute', inset: 0, border: '1px solid #E8E2DA', borderTopColor: '#C9A96E', borderRadius: '50%' }} />
            <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              style={{ position: 'absolute', inset: '8px', border: '1px solid #E8E2DA', borderBottomColor: '#2D3B2D', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ width: '6px', height: '6px', background: '#C9A96E', borderRadius: '50%' }} />
            </div>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ ...elyseFontSerif, fontSize: '28px', fontWeight: 300, color: '#1A1A1A', letterSpacing: '-0.02em' }}
          >
            Composing Your Space
          </motion.div>
          <div style={{ ...elyseFont, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#C9A96E' }}>
            SPATIAL ENGINE ACTIVE
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FAF8F5', ...elyseFont }}>
        <h1 style={{ ...elyseFontSerif, fontSize: '40px', fontWeight: 300, color: '#1A1A1A', marginBottom: '16px' }}>No Layout Data</h1>
        <button onClick={() => nav('/studio')} style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', padding: '14px 32px', background: '#2D3B2D', color: '#FAF8F5', border: 'none', cursor: 'pointer' }}>Back to Studio</button>
      </div>
    )
  }

  const sol = result.solutions.find(it=>it.id===selectedLayoutId)??result.solutions?.[0]
  if (!sol) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FAF8F5', ...elyseFont }}>
        <h1 style={{ ...elyseFontSerif, fontSize: '40px', fontWeight: 300, color: '#1A1A1A', marginBottom: '16px' }}>No Solutions Found</h1>
        <button onClick={() => nav('/studio')} style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', padding: '14px 32px', background: '#2D3B2D', color: '#FAF8F5', border: 'none', cursor: 'pointer' }}>Back to Studio</button>
      </div>
    )
  }
  const removedItems = sol.removedItems || []
  const steps = result.history_steps ?? []

  // Determine which items to display based on active snapshot
  const isViewingSnapshot = sol.id===result.solutions[0].id && activeSnapshotIndex >= 0 && activeSnapshotIndex < steps.length
  const isViewingFinal = !isViewingSnapshot

  // Get the active snapshot's items (if scrubbing timeline)
  const activeStep = isViewingSnapshot ? steps[activeSnapshotIndex] : null
  
  // Build the solution to render — either from a snapshot or the final solution
  // Apply furniture swaps to item costs
  const displaySolution = activeStep && !isViewingFinal ? {...sol,room:{...sol.room,doorWall:activeStep.doorWall??sol.room.doorWall},items:activeStep.items,pets:[],metrics:activeStep.metrics} : sol
  const ghostItems: FurnitureItem[] = ghostMode && isViewingSnapshot && activeSnapshotIndex>0 ? steps[activeSnapshotIndex-1]?.items??[] : []
  // Displayed metrics — reads from displaySolution which includes swap adjustments
  const displayMetrics = displaySolution.metrics

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="workspace-page" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', background: '#F2EDE8', fontFamily: "'DM Sans Variable', sans-serif", overflow: 'hidden' }}
    >

      {/* ── Full-bleed 3D Canvas ── */}
      <div className="absolute inset-0 z-0">
         <InteriorCanvas
           cameraMode={cameraMode}
           cameraNavigationRef={cameraNavigation}
           onHeaderContrast={setHeaderDark}
           solution={displaySolution}
           ghostItems={ghostItems}
           showGhost={ghostMode && ghostItems.length > 0}
         />
      </div>

      {/* ── Overlay UI ── */}
      <div className="workspace-overlay absolute inset-0 z-10 pointer-events-none">

        {/* Top strip */}
        <div className="workspace-top-strip" data-surface={(headerDark??surfaceIsDark(wallColor==='#f5f5f4'?designThemes[sol.selectedStyles[0]??'Modern'].wall:wallColor))?'dark':'light'}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <h1 style={{ fontFamily: "'Playfair Display Variable', serif", fontSize: 'clamp(48px, 6vw, 80px)', fontWeight: 300, color: 'var(--workspace-title-color)', lineHeight: 1, letterSpacing: '-0.02em', textShadow: 'var(--workspace-title-shadow)' }}>
              {sol.room.type}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--workspace-meta-color)' }}>
                {sol.room.lengthM}m × {sol.room.widthM}m
              </span>
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#C9A96E', display: 'inline-block' }} />
              {/* Interactive Ceiling Height Badge & Stepper in Top Bar */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'white',
                  border: '1px solid #E8E2DA',
                  padding: '2px 8px',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#C9A96E' }}>
                  Ceiling
                </span>
                <button
                  id="btn-height-decrease"
                  title="Decrease Room Height (-0.2m)"
                  onClick={() => setRoomHeight(Math.max(2.0, +(roomHeightM - 0.2).toFixed(1)))}
                  style={{
                    width: '18px', height: '18px', border: '1px solid #E8E2DA', background: '#FAF8F5',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '12px', lineHeight: 1, color: '#1A1A1A', fontWeight: 'bold',
                    padding: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2D3B2D'; e.currentTarget.style.color = '#FAF8F5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FAF8F5'; e.currentTarget.style.color = '#1A1A1A' }}
                >
                  −
                </button>
                <span
                  id="topbar-room-height-display"
                  style={{
                    fontFamily: "'DM Sans Variable', sans-serif", fontSize: '11px', fontWeight: 700, color: '#1A1A1A',
                    minWidth: '34px', textAlign: 'center',
                  }}
                >
                  {roomHeightM.toFixed(1)}m
                </span>
                <button
                  id="btn-height-increase"
                  title="Increase Room Height (+0.2m)"
                  onClick={() => setRoomHeight(Math.min(5.0, +(roomHeightM + 0.2).toFixed(1)))}
                  style={{
                    width: '18px', height: '18px', border: '1px solid #E8E2DA', background: '#FAF8F5',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '12px', lineHeight: 1, color: '#1A1A1A', fontWeight: 'bold',
                    padding: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2D3B2D'; e.currentTarget.style.color = '#FAF8F5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FAF8F5'; e.currentTarget.style.color = '#1A1A1A' }}
                >
                  +
                </button>
              </div>
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#C9A96E', display: 'inline-block' }} />
              <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--workspace-meta-color)' }}>
                {sol.selectedStyles.join(' · ')}
              </span>
              {activeStep && !isViewingFinal && (
                <>
                  <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#C9A96E', display: 'inline-block' }} />
                  <motion.span
                    key={activeStep.generation}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2D3B2D', padding: '2px 8px', border: '1px solid #2D3B2D' }}
                  >
                    STUDY {activeStep.generation}
                  </motion.span>
                </>
              )}
            </div>
            <label className="workspace-layout-choice"><span>Arrangement</span><select aria-label="Layout alternative" value={sol.id} onChange={e=>useStudioStore.getState().selectLayout(e.target.value)}>{result.solutions.map(it=><option key={it.id} value={it.id}>{it.room.layoutKind??'Layout'} {it.rank}{it.edited?' · Edited':''}</option>)}</select></label>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            onClick={() => nav('/studio')}
            className="workspace-new-project" style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', padding: '12px 24px', background: 'white', color: '#1A1A1A', border: '1px solid #E8E2DA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', pointerEvents: 'auto' }}
            whileHover={{ background: '#2D3B2D', color: '#FAF8F5' }}
          >
            ← New Project
          </motion.button>
        </div>


        <span className="workspace-build">Studio {APP_BUILD}</span>
        {/* ── Floating Action Toolbar (left side) ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="workspace-toolbar" aria-label="Room tools"
        >
          {[
            {id:'btn-camera-view',label:'View',title:'Camera: pan, move up/down and reset view',active:showCamera,icon:<><path d="M8 4H5a1 1 0 0 0-1 1v3m12-4h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3m12-4v3a1 1 0 0 1-1 1h-3"/><path d="M12 7v10m-3-7 3-3 3 3m-6 4 3 3 3-3"/></>,action:()=>{setShowCamera(p=>!p);setShowHeightSlider(false);setShowMaterialsPanel(false);useStudioStore.setState({dragMode:false,sidebarOpen:false,petPanelOpen:false,selectedPetId:null})}},
            { id: 'btn-save-load', label: 'Save', title: 'Save / Load Layouts', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />, action: () => setShowSaveLoad(true) },
            { id: 'btn-cost-breakdown', label: 'Cost', title: 'Cost Breakdown', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, action: () => setShowCostBreakdown(true) },
            { id: 'btn-furniture-swap', label: 'Swap', title: 'Swap Furniture', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />, action: () => setShowFurnitureSwap(true) },
            { id:'btn-companions',label:'Companions',title:'Companions: pets, accessories and Aira',active:petPanelOpen,icon:<><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20v-2a5.5 5.5 0 0 1 11 0v2M14 14a4.5 4.5 0 0 1 7.5 3.5V20"/></>,action:()=>{setShowMaterialsPanel(false);setShowHeightSlider(false);openPetPanel(!petPanelOpen)} },
            { id: 'btn-room-materials', label: 'Surfaces', title: 'Room Materials', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />, action: () => {useStudioStore.setState({dragMode:false,sidebarOpen:false,petPanelOpen:false,selectedPetId:null});setShowMaterialsPanel(true)} },
            { id: 'btn-room-height', label: 'Height', title: 'Adjust Room Height', active: showHeightSlider, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M12 3v4.5" />, action: () => setShowHeightSlider(p => !p) },
            { id: 'btn-suggestions', label: 'Suggest', title: 'AI Design Suggestions', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />, action: () => setShowSuggestions(true) },
          ].map(btn => {
            const isActive = btn.active ?? false
            return (
              <button
                key={btn.id}
                id={btn.id}
                title={btn.title}
                aria-expanded={btn.id==='btn-camera-view'?showCamera:undefined}
                aria-controls={btn.id==='btn-camera-view'?'camera-view-panel':undefined}
                onClick={()=>{if(btn.id!=='btn-camera-view')setShowCamera(false);btn.action()}}
                style={{
                  width: '68px', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  background: isActive ? '#FAF8F5' : 'white', border: 'none', cursor: 'pointer',
                  color: isActive ? '#2D3B2D' : '#6B6560', transition: 'all 0.2s',
                  borderLeft: `2px solid ${isActive ? '#C9A96E' : 'transparent'}`,
                }}
                onMouseEnter={e => {
                  if (!isActive) { e.currentTarget.style.background = '#F2EDE8'; e.currentTarget.style.borderLeftColor = '#C9A96E'; e.currentTarget.style.color = '#1A1A1A' }
                }}
                onMouseLeave={e => {
                  if (!isActive) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.color = '#6B6560' }
                }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{btn.icon}</svg>
                <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '7px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{btn.label}</span>
              </button>
            )
          })}

          {/* ── DRAG MODE TOGGLE ── */}
          <button
            id="btn-drag-mode"
            title={dragMode ? 'Close furniture editor' : 'Edit furniture: move, rotate, resize and customize'}
            onClick={() => {setShowCamera(false);setShowMaterialsPanel(false);setShowHeightSlider(false);toggleDragMode()}}
            style={{
              width: '68px', padding: '10px 0', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer',
              transition: 'all 0.2s', borderLeft: '2px solid transparent',
              background: dragMode ? '#2D3B2D' : 'white',
              color: dragMode ? '#FAF8F5' : '#6B6560',
              borderLeftColor: dragMode ? '#C9A96E' : 'transparent',
            }}
            onMouseEnter={e => {
              if (!dragMode) { e.currentTarget.style.background = '#F2EDE8'; e.currentTarget.style.borderLeftColor = '#C9A96E'; e.currentTarget.style.color = '#1A1A1A' }
            }}
            onMouseLeave={e => {
              if (!dragMode) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.color = '#6B6560' }
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
            <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '7px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{dragMode ? 'Done' : 'Edit'}</span>
          </button>



          {/* drag mode: reset overrides button */}
          {dragMode && (
            <button
              id="btn-reset-positions"
              title="Reset all furniture positions to AI layout"
              onClick={() => clearItemOverrides()}
              style={{ width: '68px', padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: '#FFF5F5', border: 'none', cursor: 'pointer', color: '#C05050', transition: 'all 0.2s', borderLeft: '2px solid #E09090' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FFE8E8' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFF5F5' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '7px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reset</span>
            </button>
          )}

          {/* PDF Export */}
          <button
            id="btn-export-pdf"
            title="Export PDF Report"
            onClick={async () => {
              setIsExporting(true)
              try { await exportLayoutPDF(displaySolution) } catch (e: unknown) { console.error('PDF Error:', e); alert('PDF export failed: ' + (e instanceof Error ? e.message : String(e))) }
              setIsExporting(false)
            }}
            disabled={isExporting}
            style={{ width: '68px', padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'white', border: 'none', cursor: isExporting ? 'not-allowed' : 'pointer', color: '#6B6560', transition: 'all 0.2s', borderLeft: '2px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F2EDE8'; e.currentTarget.style.borderLeftColor = '#C9A96E' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderLeftColor = 'transparent' }}
          >
            {isExporting
              ? <div style={{ width: '16px', height: '16px', border: '1px solid #E8E2DA', borderTopColor: '#C9A96E', borderRadius: '50%', animation: 'elyse-spin 0.8s linear infinite' }} />
              : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            }
            <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '7px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>PDF</span>
          </button>
        </motion.div>

        {showCamera&&<CameraPanel mode={cameraMode} onMode={setCameraMode} topView={topView} onTopView={()=>useStudioStore.setState({topView:!topView})} onMove={meters=>cameraNavigation.current?.moveVertical(meters)} onReset={()=>cameraNavigation.current?.reset()} onClose={()=>setShowCamera(false)}/>}

          {/* ── Height slider flyout ── */}
          <AnimatePresence>
            {showHeightSlider && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="workspace-height-flyout"
                style={{
                  position: 'absolute', left: '116px', top: 0,
                  background: 'white', border: '1px solid #E8E2DA', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '10px',
                  minWidth: '220px', zIndex: 120, borderRadius: '2px',
                }}
              >
                <div style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#C9A96E' }}>Room Height</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: "'Playfair Display Variable', serif", fontSize: '22px', fontWeight: 300, color: '#1A1A1A', minWidth: '48px' }}>{roomHeightM.toFixed(1)}m</span>
                  <input
                    id="room-height-slider"
                    type="range"
                    min={2.0}
                    max={5.0}
                    step={0.1}
                    value={roomHeightM}
                    onChange={e => setRoomHeight(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: '#C9A96E', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Sans Variable', sans-serif", fontSize: '8px', color: '#9B9690' }}>
                  <span>2.0m — Low</span>
                  <span>5.0m — High</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {[2.4, 2.8, 3.2, 3.6, 4.0, 4.5].map(h => (
                    <button
                      key={h}
                      onClick={() => setRoomHeight(h)}
                      style={{
                        fontFamily: "'DM Sans Variable', sans-serif", fontSize: '9px', fontWeight: 600,
                        padding: '4px 8px', border: `1px solid ${Math.abs(roomHeightM - h) < 0.05 ? '#C9A96E' : '#E8E2DA'}`,
                        background: Math.abs(roomHeightM - h) < 0.05 ? '#C9A96E' : 'transparent',
                        color: Math.abs(roomHeightM - h) < 0.05 ? 'white' : '#6B6560',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >{h.toFixed(1)}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        {/* Bottom data strip */}
        <div className="workspace-data-strip" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'auto' }}>
          <AnimatePresence>
            {showPanel && !dragMode && (
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ margin: '0 40px 32px' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'white', border: '1px solid #E8E2DA', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

                  {/* Card 1 — Logic */}
                  <div style={{ padding: '24px 32px', borderRight: '1px solid #E8E2DA' }}>
                    <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#C9A96E', display: 'block', marginBottom: '12px' }}>LOGIC</span>
                    <p style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '14px', color: '#6B6560', lineHeight: 1.6 }}>
                      {displaySolution.items.length} items placed with deterministic spatial engine. {sol.edited ? 'Custom edits are active; use the editor to check overlaps.' : 'Furniture footprints checked for room bounds and overlap.'}
                    </p>
                  </div>

                  {/* Card 2 — Utilization */}
                  <div style={{ padding: '24px 32px', borderRight: '1px solid #E8E2DA' }}>
                    <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#C9A96E', display: 'block', marginBottom: '12px' }}>UTILIZATION</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                      <span style={{ fontFamily: "'Playfair Display Variable', serif", fontSize: '40px', fontWeight: 300, color: '#1A1A1A', lineHeight: 1 }}>
                        {displayMetrics.spaceUtilizationPct.toFixed(1)}
                      </span>
                      <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '16px', color: '#6B6560' }}>% Space Used</span>
                    </div>
                    <div style={{ width: '100%', height: '2px', background: '#E8E2DA' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, displayMetrics.spaceUtilizationPct)}%` }}
                        transition={{ duration: 2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: '100%', background: '#C9A96E' }}
                      />
                    </div>
                  </div>

                  {/* Card 3 — Cost */}
                  <div style={{ padding: '24px 32px' }}>
                    <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#C9A96E', display: 'block', marginBottom: '12px' }}>COST</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                      <span style={{ fontFamily: "'Playfair Display Variable', serif", fontSize: '32px', fontWeight: 300, color: '#1A1A1A', lineHeight: 1 }}>
                        ₹{(displayMetrics.totalCostINR || 0).toLocaleString()}
                      </span>
                      <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '13px', color: '#6B6560', textDecoration: 'line-through' }}>₹{displayMetrics.budgetINR.toLocaleString()}</span>
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
            style={{ position: 'absolute', bottom: '8px', right: '8px', width: '28px', height: '28px', border: '1px solid #E8E2DA', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B6560', transition: 'all 0.2s', pointerEvents: 'auto' }}
          >
            <svg style={{ width: '12px', height: '12px', transform: showPanel ? 'none' : 'rotate(180deg)', transition: 'transform 0.3s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* ── Planning studies Sidebar ── */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="pointer-events-auto">
          {sol.id===result.solutions[0].id&&<GenerationSidebar />}
        </div>
      </div>

      {/* ── Removed Items Toast ── */}
      <AnimatePresence>
        {removedItems.length > 0 && showRemovedNotice && !dragMode && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.5, delay: 2, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'absolute', top: '96px', right: '24px', zIndex: 50, maxWidth: '280px', pointerEvents: 'auto' }}
          >
            <div style={{ background: 'white', border: '1px solid #C9A96E', padding: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9A96E', display: 'inline-block' }} />
                  <span style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#C9A96E' }}>Space Optimised</span>
                </div>
                <button onClick={() => setShowRemovedNotice(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6560', fontSize: '14px' }}>✕</button>
              </div>
              <p style={{ fontFamily: "'DM Sans Variable', sans-serif", fontSize: '12px', color: '#6B6560', marginBottom: '10px' }}>
                Removed to fit {sol.room.lengthM}×{sol.room.widthM}m:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {removedItems.map((ri, i) => (
                  <span key={i} style={{ padding: '3px 8px', border: '1px solid #C9A96E', fontFamily: "'DM Sans Variable', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8B5E52' }}>
                    {ri.type.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes elyse-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {dragMode && !petPanelOpen && <FurnitureEditor solution={sol}/>}
      <AnimatePresence>{petPanelOpen&&<PetPanel solution={sol} onClose={()=>{openPetPanel(false);setShowMaterialsPanel(false)}}/>}</AnimatePresence>
      <StorageNotice/>
      {/* ── Feature Modals ── */}
      <AnimatePresence>
        {showSaveLoad && <SaveLoadPanel onClose={() => setShowSaveLoad(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCostBreakdown && (
          <CostBreakdown
            items={displaySolution.items}
            metrics={displayMetrics}
            onClose={() => setShowCostBreakdown(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showFurnitureSwap && (
          <FurnitureSwapPanel
            items={sol.items}
            onSwap={(itemId, newCost, label, style) => {
              if(sol.items.find(it=>it.id===itemId)?.locked){alert('Unlock this item in the furniture editor first.');return false}
              return editItem(itemId,{costINR:newCost,_swapLabel:label,_swapStyle:style})
            }}
            onClose={() => setShowFurnitureSwap(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showMaterialsPanel && !petPanelOpen && (
          <GlobalMaterialsPanel onClose={() => setShowMaterialsPanel(false)} solution={displaySolution} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSuggestions && (
          <DesignSuggestionsPanel
            solution={displaySolution}
            onClose={() => setShowSuggestions(false)}
            onAddItem={(type, cost) => {
              const success=addItem(type as FurnitureItem['type'],cost)
              if(!success)alert(useStudioStore.getState().editError)
              return success
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
