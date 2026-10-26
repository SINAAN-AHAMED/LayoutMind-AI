import { z } from 'zod'
import type { OptimizationResult } from '../types/layout'

export const FurnitureItemSchema = z.object({
  id: z.string(),
  type: z.enum(['sofa','bed','table','chair','wardrobe','tvUnit','plant','rug','floorLamp','sideTable','bookshelf','ottoman','dresser','kitchenCounter','kitchenIsland','stove','refrigerator','sink','dishwasher','wallCabinet','rangeHood','tallCabinet','microwave','barStool','toilet','shower','bathtub','vanity','towelRack','diningTable','diningChair','sideboard','desk','officeChair','wallArt','wallSconce','wallShelf','kitchenVent','bathroomCabinet','petBed','petBowls','catTree','scratchingPost','petToyBasket']),
  widthM:z.number().optional().nullable().transform(v=>v??undefined),
  depthM:z.number().optional().nullable().transform(v=>v??undefined),
  groupId:z.string().optional().nullable().transform(v=>v??undefined),
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

export const HistoryStepSchema = z.object({
  doorWall:z.enum(['front','back','left','right']).optional().nullable().transform(v=>v??undefined),
  generation: z.number(),
  items: z.array(FurnitureItemSchema),
  metrics: MetricsSchema,
  totalCostINR: z.number(),
})

export const OptimizeResponseSchema = z.object({
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
        type: z.enum(['Bedroom','Living Room','Kitchen','Bathroom','Dining Room','Home Office']),
        doorWall:z.enum(['front','back','left','right']).optional(),
        layoutKind:z.string().optional(),
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
  roomType?: import('../types/layout').RoomType
  lengthM?: number
  widthM?: number
  budgetINR?: number
}

export async function optimizeLayout(req: OptimizeRequest): Promise<OptimizationResult> {
  // In Electron the app loads from file:// — relative /api paths don't work.
  // Detect Electron by protocol and hit the Python engine directly on localhost:8000.
  const isElectron = typeof window !== 'undefined' && window.location.protocol === 'file:'
  const baseUrl = import.meta.env.VITE_API_URL || (isElectron ? 'http://127.0.0.1:8000' : '/api')
  const res = await fetch(`${baseUrl}/optimize`, {
    signal:AbortSignal.timeout(120000),
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
    const baseUrl = import.meta.env.VITE_API_URL || (isElectron ? 'http://127.0.0.1:8000' : '/api')
    const res = await fetch(`${baseUrl}/health`, { signal })
    return res.ok
  } catch {
    return false
  }
}
