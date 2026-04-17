import type { FurnitureType } from '../types/layout'

export type FurnitureSpec = {
  type: FurnitureType
  label: string
  modelUrl: string
  // desired footprint size in meters (approx) for auto-scaling
  targetSizeM: { x: number; z: number; y: number }
  costINR: number
}

// Using reliable GLTF models - these are from the Khronos glTF sample repository
// which is highly available. For production, you'd host your own models.
export const furnitureCatalog: Record<FurnitureType, FurnitureSpec> = {
  sofa: {
    type: 'sofa',
    label: 'Sofa',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
    targetSizeM: { x: 2.1, z: 0.9, y: 0.9 },
    costINR: 48000,
  },
  bed: {
    type: 'bed',
    label: 'Bed',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
    targetSizeM: { x: 2.1, z: 1.6, y: 0.9 },
    costINR: 52000,
  },
  table: {
    type: 'table',
    label: 'Table',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
    targetSizeM: { x: 1.0, z: 1.0, y: 0.8 },
    costINR: 18000,
  },
  chair: {
    type: 'chair',
    label: 'Chair',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
    targetSizeM: { x: 0.9, z: 0.9, y: 1.0 },
    costINR: 12000,
  },
  wardrobe: {
    type: 'wardrobe',
    label: 'Wardrobe',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
    targetSizeM: { x: 1.4, z: 0.6, y: 2.0 },
    costINR: 35000,
  },
  tvUnit: {
    type: 'tvUnit',
    label: 'TV Unit',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
    targetSizeM: { x: 1.6, z: 0.45, y: 0.8 },
    costINR: 22000,
  },
  plant: {
    type: 'plant',
    label: 'Plant',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
    targetSizeM: { x: 0.5, z: 0.5, y: 1.2 },
    costINR: 4500,
  },
  rug: {
    type: 'rug',
    label: 'Rug',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
    targetSizeM: { x: 2.5, z: 1.5, y: 0.02 },
    costINR: 8000,
  },
  floorLamp: {
    type: 'floorLamp',
    label: 'Floor Lamp',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
    targetSizeM: { x: 0.4, z: 0.4, y: 1.8 },
    costINR: 6000,
  },
  sideTable: {
    type: 'sideTable',
    label: 'Side Table',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
    targetSizeM: { x: 0.45, z: 0.45, y: 0.6 },
    costINR: 4000,
  },
  bookshelf: {
    type: 'bookshelf',
    label: 'Bookshelf',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb',
    targetSizeM: { x: 1.2, z: 0.35, y: 2.1 },
    costINR: 15000,
  },
}

