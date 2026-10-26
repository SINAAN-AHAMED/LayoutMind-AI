import type {DoorOptions} from '../lib/doorDesign'
export type GuestInstance={x:number;z:number;heightM:number;rotationY?:number;portrait?:number;outfit?:'classic'|'eva'}
export type PetKind = 'cat' | 'pug'
export type PetInstance = {id:string;kind:PetKind;name:string;x:number;z:number;rotationY:number;roaming:boolean;collarColor:string}

export type RoomType = 'Bedroom' | 'Living Room' | 'Kitchen' | 'Bathroom' | 'Dining Room' | 'Home Office'
export type StyleChip = 'Cozy' | 'Minimal' | 'Modern' | 'Luxury' | 'Compact' | 'Bohemian' | 'Industrial' | 'Coastal'
export type FurnitureType = 'sofa' | 'bed' | 'table' | 'chair' | 'wardrobe' | 'tvUnit' | 'plant' | 'rug' | 'floorLamp' | 'sideTable' | 'bookshelf' | 'ottoman' | 'dresser' | 'kitchenCounter' | 'kitchenIsland' | 'stove' | 'refrigerator' | 'sink' | 'dishwasher' | 'wallCabinet' | 'rangeHood' | 'tallCabinet' | 'microwave' | 'barStool' | 'toilet' | 'shower' | 'bathtub' | 'vanity' | 'towelRack' | 'diningTable' | 'diningChair' | 'sideboard' | 'desk' | 'officeChair' | 'wallArt' | 'wallSconce' | 'wallShelf' | 'kitchenVent' | 'bathroomCabinet' | 'petBed' | 'petBowls' | 'catTree' | 'scratchingPost' | 'petToyBasket'

export type NLPExtracted = {
  roomType: RoomType
  lengthM: number
  widthM: number
  budgetINR: number
  styles: StyleChip[]
  styleSliders: Record<StyleChip, number>
  floorMaterial?: 'Wood' | 'Tile' | 'Carpet' | 'Marble' | 'Granite' | 'Epoxy'
  wallMaterial?: 'Plain' | 'Panel' | 'Brick' | 'Wallpaper' | 'Textured' | 'Stone'
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
  widthM?: number
  depthM?: number
  groupId?: string
  color?: string
  locked?: boolean
  /** Style override applied by the furniture swap panel */
  _swapStyle?: StyleChip
  /** Label override applied by the furniture swap panel */
  _swapLabel?: string
}

export type RemovedItemInfo = {
  type: string
  reason: string
}

export type LayoutSolution = {
  door?:DoorOptions
  guest?:GuestInstance
  pets?: PetInstance[]
  id: string
  rank: 1 | 2 | 3
  room: { lengthM: number; widthM: number; type: RoomType; doorWall?: 'front' | 'back' | 'left' | 'right'; layoutKind?:string }
  prompt: string
  selectedStyles: StyleChip[]
  items: FurnitureItem[]
  metrics: Metrics
  explanation: string
  removedItems?: RemovedItemInfo[]
  edited?: boolean
}

/** Snapshot of the best individual at a given generation milestone */
export type HistoryStep = {
  doorWall?: 'front' | 'back' | 'left' | 'right'
  generation: number
  items: FurnitureItem[]
  metrics: Metrics
  /** @deprecated Use metrics.totalCostINR instead — kept for API compatibility */
  totalCostINR: number
}

export type OptimizationResult = {
  customization?: { autoSurfaces?:boolean; lightingMode?:import('../lib/roomDesign').LightingMode; floorMaterial: string; wallMaterial: string; wallColor: string; roomHeightM: number; floorColor?:string; groutColor?:string; tilePattern?:string; tileSize?:number; cabinetColor?:string; countertopColor?:string; metalFinish?:string }
  requestId: string
  generatedAtISO: string
  evolution: EvolutionPoint[]
  solutions: LayoutSolution[]
  history_steps: HistoryStep[]
}
