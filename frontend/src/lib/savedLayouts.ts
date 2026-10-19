import type { OptimizationResult } from '../types/layout'

export type SavedLayout = {
  id: string
  name: string
  savedAt: string
  thumbnail?: string // base64 data URL
  result: OptimizationResult
}

const STORAGE_KEY = 'roomcraft-saved-layouts'

export function getSavedLayouts(): SavedLayout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // Validate parsed data is an array with expected shape
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item: any) => item && typeof item.id === 'string' && typeof item.name === 'string' && item.result
    ) as SavedLayout[]
  } catch {
    return []
  }
}

export function saveLayout(name: string, result: OptimizationResult, thumbnail?: string): SavedLayout {
  const layouts = getSavedLayouts()
  const entry: SavedLayout = {
    id: crypto.randomUUID(),
    name,
    savedAt: new Date().toISOString(),
    thumbnail,
    result,
  }
  layouts.unshift(entry) // newest first
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts))
    return entry
  } catch (e: unknown) {
    // Handle QuotaExceededError — remove oldest layouts and retry
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      // Remove thumbnails first to free space
      const trimmed = layouts.map(l => ({ ...l, thumbnail: undefined }))
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
        return entry
      } catch {
        // If still too large, keep only the newest 3
        const minimal = trimmed.slice(0, 3)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal))
          return entry
        } catch {
          console.error('Unable to save layout: storage quota exceeded', e)
          throw new Error('Unable to save layout: storage quota exceeded')
        }
      }
    } else {
      console.error('Unable to save layout:', e)
      throw e
    }
  }
}

export function deleteLayout(id: string): boolean {
  const layouts = getSavedLayouts()
  const filtered = layouts.filter((l) => l.id !== id)
  if (filtered.length === layouts.length) return false // not found
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

export function renameLayout(id: string, newName: string): boolean {
  const layouts = getSavedLayouts()
  const target = layouts.find((l) => l.id === id)
  if (!target) return false
  target.name = newName
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts))
  return true
}
