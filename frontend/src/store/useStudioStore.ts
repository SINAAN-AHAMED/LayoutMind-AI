import type {LightingMode} from '../lib/roomDesign'
import type {PaletteState} from '../lib/palette'
import { fitItem, updateMetrics } from '../lib/layoutGeometry'
import {clearPetRuntime} from '../lib/petRuntime'
import {normalizePets} from '../lib/petData'
import { editItem } from '../lib/editorOps'
import { create } from 'zustand'
import {parseStoredResult,restoreSession} from '../lib/layoutValidation'
import {sessionStorage} from '../lib/sessionStorage'
import { persist,createJSONStorage } from 'zustand/middleware'
import type { OptimizationResult, HistoryStep, LayoutSolution, RoomType } from '../types/layout'

export type FloorMaterial = 'Wood' | 'Tile' | 'Carpet' | 'Marble' | 'Granite' | 'Epoxy' | 'Parquet' | 'Concrete' | 'Terrazzo'
export type WallMaterial = 'Plain' | 'Panel' | 'Brick' | 'Wallpaper' | 'Textured' | 'Stone' | 'Concrete' | 'Plaster' | 'Fabric' | 'Ceramic' | 'Fluted' | 'Lime'

export type TilePattern = 'Square' | 'Subway' | 'Herringbone' | 'Hexagon'
export type MetalFinish = 'Auto' | 'Brass' | 'Chrome' | 'Black' | 'Copper'
export type Appearance = {floorColor:string;groutColor:string;tilePattern:TilePattern;tileSize:number;cabinetColor:string;countertopColor:string;metalFinish:MetalFinish}
export const appearanceDefaults:Appearance = {floorColor:'',groutColor:'#bcb6ab',tilePattern:'Square',tileSize:.6,cabinetColor:'',countertopColor:'',metalFinish:'Auto'}
type StudioState = Appearance & {
  autoSurfaces:boolean
  lightingMode:LightingMode
  setLightingMode:(mode:LightingMode)=>void
  petPanelOpen:boolean
  selectedPetId:string|null
  petDraggingId:string|null
  petsPaused:boolean
  petError:string
  petDestination:({id:string;x:number;z:number;nonce:string})|null
  openPetPanel:(open?:boolean)=>void
  preferredRoomType: RoomType | null
  preferredLengthM: number | null
  preferredWidthM: number | null
  preferredBudgetINR: number | null
  setPreferredRoomType: (v:RoomType|null)=>void
  setPreferredLengthM: (v:number|null)=>void
  setPreferredWidthM: (v:number|null)=>void
  setPreferredBudgetINR: (v:number|null)=>void
  setAppearance: (patch:Partial<Appearance>)=>void
  avoidCollisions:boolean
  moveLinked:boolean
  wallView:'cutaway'|'full'

  selectedItemId: string | null
  transformMode: 'translate' | 'rotate'
  snapToGrid: boolean
  topView: boolean
  editBaseline: LayoutSolution | null
  undoStack: (LayoutSolution&{undoPalette?:PaletteState})[]
  redoStack: (LayoutSolution&{undoPalette?:PaletteState})[]
  editError: string
  theme: 'dark' | 'light'
  prompt: string
  isOptimizing: boolean
  lastResult?: OptimizationResult
  selectedLayoutId?: string

  explicitStyle: string
  addPlants: boolean
  addRugs: boolean
  floorMaterial: FloorMaterial
  wallMaterial: WallMaterial
  wallColor: string

  // ── Room height ──
  roomHeightM: number

  // ── Drag mode (transform controls) ──
  dragMode: boolean

  // ── Per-item position overrides from drag ──
  itemOverrides: Record<string, { x: number; z: number }>

  // ── Generation History ──
  activeSnapshotIndex: number
  ghostMode: boolean
  sidebarOpen: boolean

  setTheme: (t: 'dark' | 'light') => void
  setPrompt: (v: string) => void
  setExplicitStyle: (v: string) => void
  setAddPlants: (v: boolean) => void
  setAddRugs: (v: boolean) => void
  setFloorMaterial: (v: FloorMaterial) => void
  setWallMaterial: (v: WallMaterial) => void
  setWallColor: (v: string) => void
  setRoomHeight: (v: number) => void
  toggleDragMode: () => void
  setItemOverride: (id: string, x: number, z: number) => void
  clearItemOverrides: () => void
  setOptimizing: (v: boolean) => void
  setResult: (r: OptimizationResult) => void
  selectLayout: (id: string) => void
  clearResult: () => void

  // ── Generation History Actions ──
  setActiveSnapshot: (idx: number) => void
  toggleGhostMode: () => void
  toggleSidebar: () => void
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      ...appearanceDefaults,autoSurfaces:true,lightingMode:'Auto',setLightingMode:(lightingMode)=>set({lightingMode}),
      petPanelOpen:false,selectedPetId:null,petDraggingId:null,petsPaused:false,petError:'',petDestination:null,
      openPetPanel:(open=true)=>set({petPanelOpen:open,dragMode:false,sidebarOpen:false,activeSnapshotIndex:-1,petError:'',petDraggingId:null}),
      preferredRoomType:null, preferredLengthM:null, preferredWidthM:null, preferredBudgetINR:null,
      setPreferredRoomType: (preferredRoomType)=>set({preferredRoomType}),
      setPreferredLengthM: (preferredLengthM)=>set({preferredLengthM}),
      setPreferredWidthM: (preferredWidthM)=>set({preferredWidthM}),
      setPreferredBudgetINR: (preferredBudgetINR)=>set({preferredBudgetINR}),
      setAppearance: (patch)=>set(patch),
      avoidCollisions:true,moveLinked:true,wallView:'cutaway',
      editBaseline: null, selectedItemId: null, transformMode: 'translate', snapToGrid: true, topView: false, undoStack: [], redoStack: [], editError: '',
      theme: 'light',
      prompt: 'Design a modern living room 7 by 6 meters under 150000 spacious with sofa TV unit.',
      isOptimizing: false,
      lastResult: undefined,
      selectedLayoutId: undefined,
      explicitStyle: 'Modern',
      addPlants: true,
      addRugs: true,
      floorMaterial: 'Wood',
      wallMaterial: 'Plain',
      wallColor: '#f5f5f4',

      // ── Room height (2.0m – 5.0m) ──
      roomHeightM: 3.2,

      // ── Drag mode ──
      dragMode: false,
      itemOverrides: {},

      // ── Generation History State ──
      activeSnapshotIndex: -1, // -1 = show final result (default)
      ghostMode: false,
      sidebarOpen: false,

      setTheme: (t) => set({ theme: t }),
      setPrompt: (v) => set({ prompt: v }),
      setExplicitStyle: (v) => set({ explicitStyle: v }),
      setAddPlants: (v) => set({ addPlants: v }),
      setAddRugs: (v) => set({ addRugs: v }),
      setFloorMaterial: (v) => set({ floorMaterial: v,autoSurfaces:false }),
      setWallMaterial: (v) => set({ wallMaterial: v,autoSurfaces:false }),
      setWallColor: (v) => set({ wallColor: v }),
      setRoomHeight: (v) => {
        if (!Number.isFinite(v)) return
        const height = Math.max(2, Math.min(5, v))
        set(s => ({ roomHeightM: height, lastResult: s.lastResult ? {...s.lastResult, solutions:s.lastResult.solutions.map(sol => updateMetrics({...sol,items:sol.items.map(it => fitItem(it,sol.room,height))}))} : undefined }))
      },
      toggleDragMode: () => set((s) => ({ dragMode: !s.dragMode, petPanelOpen:false, selectedPetId:null, sidebarOpen: false, activeSnapshotIndex: -1 })),
      setItemOverride: (id, x, z) => editItem(id, { x, z }),
      clearItemOverrides: () => set({ itemOverrides: {} }),

      setOptimizing: (v) => set({ isOptimizing: v }),

      setResult: (r) => {
        const valid=parseStoredResult(r)
        if(!valid)throw new Error('This layout contains invalid or incomplete data and could not be loaded.')
        r=valid
        clearPetRuntime()
        const c = r.customization
        const height = c?.roomHeightM ?? get().roomHeightM
        r = {...r,solutions:r.solutions.map(sol => ({...sol,...(sol.pets?{pets:normalizePets(sol.pets)}:{}),items:sol.items.map(it=>fitItem(it,sol.room,height))}))}
        set({
          lastResult: r,petPanelOpen:false,selectedPetId:null,petDraggingId:null,petDestination:null,petsPaused:false,petError:'',
          itemOverrides: {}, selectedItemId: null, undoStack: [], redoStack: [], editBaseline: null, editError: '', dragMode: false,
          ...(c ? {autoSurfaces:c.autoSurfaces??false,lightingMode:c.lightingMode??'Auto',floorMaterial:c.floorMaterial as FloorMaterial,wallMaterial:c.wallMaterial as WallMaterial,wallColor:c.wallColor,roomHeightM:c.roomHeightM,...appearanceDefaults,...Object.fromEntries(Object.keys(appearanceDefaults).filter(key=>key in c).map(key=>[key,c[key as keyof typeof c]]))} : {}),
          selectedLayoutId: r.solutions[0]?.id,
          isOptimizing: false,
          activeSnapshotIndex: -1, // default to last snapshot (final)
        })
      },

      selectLayout: (id) => set({ selectedLayoutId: id, selectedItemId: null,selectedPetId:null,petDraggingId:null,petDestination:null,petPanelOpen:false, undoStack: [], redoStack: [], editBaseline: null, activeSnapshotIndex: -1, editError: '' }),

      clearResult: () => set({ lastResult: undefined, selectedLayoutId: undefined, activeSnapshotIndex: -1,petPanelOpen:false,selectedPetId:null,petDraggingId:null }),

      // ── Generation History Actions ──
      setActiveSnapshot: (idx) => {
        const steps = get().lastResult?.history_steps
        const maxIdx = steps ? steps.length - 1 : -1
        const clamped = Math.max(-1, Math.min(idx, maxIdx))
        set({ activeSnapshotIndex: clamped, dragMode: false,petPanelOpen:false,selectedPetId:null, selectedItemId: null })
      },
      toggleGhostMode: () => set((s) => ({ ghostMode: !s.ghostMode })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen, dragMode: false,petPanelOpen:false,selectedPetId:null })),
    }),
    {
      name: 'layoutmind-studio-v7',
      storage:createJSONStorage(()=>sessionStorage),
      merge:(persisted,current)=>({...current,...restoreSession(persisted)}),
      partialize: (s) => ({
        autoSurfaces:s.autoSurfaces,lightingMode:s.lightingMode,
        preferredRoomType:s.preferredRoomType,preferredLengthM:s.preferredLengthM,preferredWidthM:s.preferredWidthM,preferredBudgetINR:s.preferredBudgetINR,
        floorColor:s.floorColor,groutColor:s.groutColor,tilePattern:s.tilePattern,tileSize:s.tileSize,cabinetColor:s.cabinetColor,countertopColor:s.countertopColor,metalFinish:s.metalFinish,
        explicitStyle: s.explicitStyle, addPlants: s.addPlants, addRugs: s.addRugs,
        theme: s.theme,
        prompt: s.prompt,
        lastResult: s.lastResult,
        selectedLayoutId: s.selectedLayoutId,
        floorMaterial: s.floorMaterial,
        wallMaterial: s.wallMaterial,
        wallColor: s.wallColor,
        roomHeightM: s.roomHeightM,
      }),
      version: 5,
    },
  ),
)

export function getSelectedSolution() {
  const st = useStudioStore.getState()
  const id = st.selectedLayoutId
  return st.lastResult?.solutions.find((s) => s.id === id) ?? st.lastResult?.solutions[0]
}

/** Get the currently active history step, or null if viewing the final solution */
export function getActiveHistoryStep(): HistoryStep | null {
  const st = useStudioStore.getState()
  const steps = st.lastResult?.history_steps
  if (!steps || steps.length === 0) return null
  const idx = st.activeSnapshotIndex
  if (idx < 0 || idx >= steps.length) return null
  return steps[idx]
}
