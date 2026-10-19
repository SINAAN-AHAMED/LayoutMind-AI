import { z } from 'zod'
import type { OptimizationResult } from '../types/layout'

const FurnitureItemSchema = z.object({
  id: z.string(),
  type: z.union([
    z.literal('sofa'),
    z.literal('bed'),
    z.literal('table'),
    z.literal('chair'),
    z.literal('wardrobe'),
    z.literal('tvUnit'),
    z.literal('plant'),
    z.literal('rug'),
    z.literal('floorLamp'),
    z.literal('sideTable'),
    z.literal('bookshelf'),
    z.literal('ottoman'),
    z.literal('dresser'),
  ]),
  x: z.number(),
  z: z.number(),
  y: z.number(),
  rotationY: z.number(),
  scale: z.number(),
  costINR: z.number(),
})

const MetricsSchema = z.object({
  totalCostINR: z.number(),
  budgetINR: z.number(),
  budgetCompliancePct: z.number(),
  spaceUtilizationPct: z.number(),
  styleAlignmentPct: z.number(),
  clearanceScorePct: z.number(),
  comfortIndexPct: z.number(),
  fitness: z.number(),
})

const HistoryStepSchema = z.object({
  generation: z.number(),
  items: z.array(FurnitureItemSchema),
  metrics: MetricsSchema,
  totalCostINR: z.number(),
})

const OptimizeResponseSchema = z.object({
  requestId: z.string(),
  generatedAtISO: z.string(),
  evolution: z.array(
    z.object({
      generation: z.number(),
      bestFitness: z.number(),
      avgFitness: z.number(),
    }),
  ),
  solutions: z.array(
    z.object({
      id: z.string(),
      rank: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      room: z.object({
        lengthM: z.number(),
        widthM: z.number(),
        type: z.union([z.literal('Bedroom'), z.literal('Living Room')]),
      }),
      prompt: z.string(),
      selectedStyles: z.array(
        z.union([z.literal('Cozy'), z.literal('Minimal'), z.literal('Modern'), z.literal('Luxury'), z.literal('Compact'), z.literal('Bohemian'), z.literal('Industrial'), z.literal('Coastal')]),
      ),
      items: z.array(FurnitureItemSchema),
      metrics: MetricsSchema,
      explanation: z.string(),
      removedItems: z.array(
        z.object({
          type: z.string(),
          reason: z.string(),
        })
      ).optional(),
    }),
  ),
  history_steps: z.array(HistoryStepSchema).optional().default([]),
})

export type OptimizeRequest = {
  prompt: string
  explicitStyle?: string
  addPlants?: boolean
  addRugs?: boolean
}

export async function optimizeLayout(req: OptimizeRequest): Promise<OptimizationResult> {
  // In Electron the app loads from file:// — relative /api paths don't work.
  // Detect Electron by protocol and hit the Python engine directly on localhost:8000.
  const isElectron = typeof window !== 'undefined' && window.location.protocol === 'file:'
  const baseUrl = import.meta.env.VITE_API_URL || (isElectron ? 'http://localhost:8000' : '/api')
  const res = await fetch(`${baseUrl}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Optimize failed (${res.status}): ${t || res.statusText}`)
  }
  const json = await res.json()
  return OptimizeResponseSchema.parse(json) as OptimizationResult
}

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const isElectron = typeof window !== 'undefined' && window.location.protocol === 'file:'
    const baseUrl = import.meta.env.VITE_API_URL || (isElectron ? 'http://localhost:8000' : '/api')
    const res = await fetch(`${baseUrl}/health`, { signal })
    return res.ok
  } catch {
    return false
  }
}
