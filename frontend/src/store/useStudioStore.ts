import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OptimizationResult, HistoryStep } from '../types/layout'

export type FloorMaterial = 'Wood' | 'Tile' | 'Carpet' | 'Marble' | 'Granite' | 'Epoxy' | 'Parquet' | 'Concrete' | 'Terrazzo'
export type WallMaterial = 'Plain' | 'Panel' | 'Brick' | 'Wallpaper' | 'Textured' | 'Stone' | 'Concrete' | 'Plaster' | 'Fabric' | 'Ceramic' | 'Fluted' | 'Lime'

type StudioState = {
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
      theme: 'dark',
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

      // ── Generation History State ──
      activeSnapshotIndex: -1, // -1 = show final result (default)
      ghostMode: false,
      sidebarOpen: false,

      setTheme: (t) => set({ theme: t }),
      setPrompt: (v) => set({ prompt: v }),
      setExplicitStyle: (v) => set({ explicitStyle: v }),
      setAddPlants: (v) => set({ addPlants: v }),
      setAddRugs: (v) => set({ addRugs: v }),
      setFloorMaterial: (v) => set({ floorMaterial: v }),
      setWallMaterial: (v) => set({ wallMaterial: v }),
      setWallColor: (v) => set({ wallColor: v }),

      setOptimizing: (v) => set({ isOptimizing: v }),

      setResult: (r) => {
        const lastIdx = (r.history_steps?.length ?? 0) - 1
        set({
          lastResult: r,
          selectedLayoutId: r.solutions[0]?.id,
          isOptimizing: false,
          activeSnapshotIndex: lastIdx, // default to last snapshot (final)
        })
      },

      selectLayout: (id) => set({ selectedLayoutId: id }),

      clearResult: () => set({ lastResult: undefined, selectedLayoutId: undefined, activeSnapshotIndex: -1 }),

      // ── Generation History Actions ──
      setActiveSnapshot: (idx) => {
        const steps = get().lastResult?.history_steps
        const maxIdx = steps ? steps.length - 1 : -1
        const clamped = Math.max(-1, Math.min(idx, maxIdx))
        set({ activeSnapshotIndex: clamped })
      },
      toggleGhostMode: () => set((s) => ({ ghostMode: !s.ghostMode })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: 'layoutmindx-studio-v4',
      partialize: (s) => ({
        theme: s.theme,
        prompt: s.prompt,
        lastResult: s.lastResult,
        selectedLayoutId: s.selectedLayoutId,
        floorMaterial: s.floorMaterial,
        wallMaterial: s.wallMaterial,
        wallColor: s.wallColor,
      }),
      version: 4,
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
