import { useMemo } from 'react'
import type { FurnitureItem, HistoryStep } from '../types/layout'

/**
 * useGenerationTransition
 * 
 * Computes interpolated furniture positions between two history snapshots
 * for smooth 3D transition when scrubbing the timeline slider.
 */
export function useGenerationTransition(
  steps: HistoryStep[],
  activeIndex: number,
  /** 0..1 fractional position between steps[activeIndex - 1] and steps[activeIndex] (i.e., previousStep and currentStep) */
  t: number = 1.0,
) {
  const currentStep = steps[activeIndex] ?? null
  const previousStep = activeIndex > 0 ? steps[activeIndex - 1] : null

  // Interpolated items (lerp between previous and current positions)
  const interpolatedItems: FurnitureItem[] = useMemo(() => {
    if (!currentStep) return []
    if (!previousStep || t >= 1.0) return currentStep.items

    // Build a lookup by id from previous step
    const prevMap = new Map<string, FurnitureItem>()
    previousStep.items.forEach((item) => prevMap.set(item.id, item))

    // Lerp helper
    const lerp = (a: number, b: number, f: number) => a + (b - a) * f

    // Shortest-path angle interpolation to handle wrapping (e.g. -170° to 170° should go via 180°)
    const lerpAngle = (a: number, b: number, f: number) => {
      let delta = b - a
      // Normalize delta to [-π, π]
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      return a + delta * f
    }

    return currentStep.items.map((item) => {
      const prev = prevMap.get(item.id)
      if (!prev) return item

      return {
        ...item,
        x: lerp(prev.x, item.x, t),
        z: lerp(prev.z, item.z, t),
        y: lerp(prev.y, item.y, t),
        rotationY: lerpAngle(prev.rotationY, item.rotationY, t),
        scale: lerp(prev.scale, item.scale, t),
      }
    })
  }, [currentStep, previousStep, t])

  return {
    currentStep,
    previousStep,
    interpolatedItems,
  }
}
