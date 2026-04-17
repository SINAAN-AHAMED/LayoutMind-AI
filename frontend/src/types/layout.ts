export type RoomType = 'Bedroom' | 'Living Room'
export type StyleChip = 'Cozy' | 'Minimal' | 'Modern' | 'Luxury' | 'Compact' | 'Bohemian' | 'Industrial' | 'Coastal'
export type FurnitureType = 'sofa' | 'bed' | 'table' | 'chair' | 'wardrobe' | 'tvUnit' | 'rug' | 'plant' | 'floorLamp' | 'sideTable' | 'bookshelf'

export type NLPExtracted = {
  roomType: RoomType
  lengthM: number
  widthM: number
  budgetINR: number
  styles: StyleChip[]
  styleSliders: Record<StyleChip, number>
  floorMaterial?: 'Wood' | 'Tile' | 'Carpet'
  wallMaterial?: 'Plain' | 'Panel' | 'Brick'
}

export type OptimizeRequest = {
  prompt: string
}

export type Metrics = {
  totalCostINR: number
  budgetINR: number
  budgetCompliancePct: number
  spaceUtilizationPct: number
  styleAlignmentPct: number
  clearanceScorePct: number
  comfortIndexPct: number
  fitness: number
}

export type EvolutionPoint = { generation: number; bestFitness: number; avgFitness: number }

export type FurnitureItem = {
  id: string
  type: FurnitureType
  x: number
  z: number
  y: number
  rotationY: number
  scale: number
  costINR: number
}

export type RemovedItemInfo = {
  type: string
  reason: string
}

export type LayoutSolution = {
  id: string
  rank: 1 | 2 | 3
  room: { lengthM: number; widthM: number; type: RoomType }
  prompt: string
  selectedStyles: StyleChip[]
  items: FurnitureItem[]
  metrics: Metrics
  explanation: string
  removedItems?: RemovedItemInfo[]
}

export type OptimizationResult = {
  requestId: string
  generatedAtISO: string
  evolution: EvolutionPoint[]
  solutions: LayoutSolution[]
}
