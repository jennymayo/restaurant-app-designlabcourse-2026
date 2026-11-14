import { newId } from '../lib/id'
import { makeSamplePlaces } from '../data/samplePlaces'
import type { BackupData, Place, PlaceInput, Tag } from '../types'
import type { PlacesRepository } from './PlacesRepository'

/**
 * Stores everything in the browser's localStorage, as one JSON string.
 *
 * localStorage is a tiny key-value store built into every browser. It survives
 * page refreshes, but only on this browser and device. (That's why we'll move
 * to Supabase later.)
 */

const STORAGE_KEY = 'night-off:v1'

// If localStorage is blocked (some private modes), we fall back to keeping
// the data in memory so the app still works until the tab is closed.
let memoryFallback: string | null = null

/** What we keep in storage: the same shape as the backup file. */
type StoredData = BackupData

/** Read everything from storage. On the very first visit, seed the samples. */
function load(): StoredData {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    raw = memoryFallback
  }

  if (raw === null) {
    // First visit: start with the sample places so the filters can be tried right away.
    // (After the user clears them, the file exists with an empty list, so they stay gone.)
    const fresh: StoredData = { version: 1, places: makeSamplePlaces(), customTags: [] }
    save(fresh)
    return fresh
  }

  try {
    const parsed = JSON.parse(raw) as StoredData
    return {
      version: 1,
      places: Array.isArray(parsed.places) ? parsed.places : [],
      customTags: Array.isArray(parsed.customTags) ? parsed.customTags : [],
    }
  } catch {
    // The stored text is damaged. Start empty rather than crash.
    return { version: 1, places: [], customTags: [] }
  }
}

/** Write everything to storage. */
function save(data: StoredData): void {
  const text = JSON.stringify(data)
  memoryFallback = text
  try {
    localStorage.setItem(STORAGE_KEY, text)
  } catch {
    // Storage is full or blocked. The in-memory copy above keeps the app working.
  }
}

/** Newest first. */
function sortNewestFirst(places: Place[]): Place[] {
  return [...places].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const localStorageRepository: PlacesRepository = {
  async listPlaces() {
    return sortNewestFirst(load().places)
  },

  async createPlace(input: PlaceInput) {
    const data = load()
    const now = new Date().toISOString()
    const place: Place = {
      ...input,
      id: newId(),
      isSample: false,
      createdAt: now,
      updatedAt: now,
    }
    save({ ...data, places: [place, ...data.places] })
    return place
  },

  async updatePlace(id: string, input: PlaceInput) {
    const data = load()
    const existing = data.places.find((p) => p.id === id)
    if (!existing) throw new Error('That place no longer exists.')

    const updated: Place = {
      ...existing,
      ...input,
      // Once you edit a sample place it becomes "yours", so "Clear sample data" won't delete it.
      isSample: false,
      updatedAt: new Date().toISOString(),
    }
    save({ ...data, places: data.places.map((p) => (p.id === id ? updated : p)) })
    return updated
  },

  async deletePlace(id: string) {
    const data = load()
    save({ ...data, places: data.places.filter((p) => p.id !== id) })
  },

  async listCustomTags() {
    return load().customTags
  },

  async createCustomTag(label: string) {
    const data = load()
    const tag: Tag = { id: `custom-${newId()}`, label: label.trim(), group: 'custom' }
    save({ ...data, customTags: [...data.customTags, tag] })
    return tag
  },

  async deleteCustomTag(id: string) {
    const data = load()
    save({
      ...data,
      customTags: data.customTags.filter((t) => t.id !== id),
      // Don't leave places pointing at a tag that no longer exists.
      places: data.places.map((p) => ({ ...p, tagIds: p.tagIds.filter((t) => t !== id) })),
    })
  },

  async replaceAll(data: BackupData) {
    save({ version: 1, places: data.places, customTags: data.customTags })
  },

  async deleteSamples() {
    const data = load()
    save({ ...data, places: data.places.filter((p) => !p.isSample) })
  },
}
