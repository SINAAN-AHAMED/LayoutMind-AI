import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OptimizationResult } from '../types/layout'

type StudioState = {
  theme: 'dark' | 'light'
  prompt: string
  isOptimizing: boolean
  lastResult?: OptimizationResult
  selectedLayoutId?: string

  explicitStyle: string
  addPlants: boolean
  addRugs: boolean
  floorMaterial: 'Wood' | 'Tile' | 'Carpet'
  wallMaterial: 'Plain' | 'Panel' | 'Brick'

  setTheme: (t: 'dark' | 'light') => void
  setPrompt: (v: string) => void
  setExplicitStyle: (v: string) => void
  setAddPlants: (v: boolean) => void
  setAddRugs: (v: boolean) => void
  setFloorMaterial: (v: 'Wood' | 'Tile' | 'Carpet') => void
  setWallMaterial: (v: 'Plain' | 'Panel' | 'Brick') => void
  setOptimizing: (v: boolean) => void
  setResult: (r: OptimizationResult) => void
  selectLayout: (id: string) => void
  clearResult: () => void
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      prompt: 'Design a modern living room under 100000 spacious with sofa TV unit.',
      isOptimizing: false,
      lastResult: undefined,
      selectedLayoutId: undefined,
      explicitStyle: 'Modern',
      addPlants: true,
      addRugs: true,
      floorMaterial: 'Wood',
      wallMaterial: 'Plain',

      setTheme: (t) => set({ theme: t }),
      setPrompt: (v) => set({ prompt: v }),
      setExplicitStyle: (v) => set({ explicitStyle: v }),
      setAddPlants: (v) => set({ addPlants: v }),
      setAddRugs: (v) => set({ addRugs: v }),
      setFloorMaterial: (v) => set({ floorMaterial: v }),
      setWallMaterial: (v) => set({ wallMaterial: v }),

      setOptimizing: (v) => set({ isOptimizing: v }),

      setResult: (r) => {
        set({
          lastResult: r,
          selectedLayoutId: r.solutions[0]?.id,
          isOptimizing: false,
        })
      },

      selectLayout: (id) => set({ selectedLayoutId: id }),

      clearResult: () => set({ lastResult: undefined, selectedLayoutId: undefined }),
    }),
    {
      name: 'layoutmindx-studio',
      partialize: (s) => ({
        theme: s.theme,
        prompt: s.prompt,
        lastResult: s.lastResult,
        selectedLayoutId: s.selectedLayoutId,
        floorMaterial: s.floorMaterial,
        wallMaterial: s.wallMaterial,
      }),
      version: 2,
    },
  ),
)

export function getSelectedSolution() {
  const st = useStudioStore.getState()
  const id = st.selectedLayoutId
  return st.lastResult?.solutions.find((s) => s.id === id) ?? st.lastResult?.solutions[0]
}
