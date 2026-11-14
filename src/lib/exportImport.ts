import { newId } from './id'
import { PRESET_TAGS } from '../data/presetTags'
import { PRICES, SOURCE_TYPES, STATUSES } from '../types'
import type { BackupData, Place, Tag } from '../types'
import { normalizeUrl } from './url'

/**
 * Export and import: a simple JSON backup file.
 */

// ---------- Export ----------

/** Download the data as a .json file (the browser saves it to Downloads). */
export function downloadBackup(data: BackupData): void {
  const text = JSON.stringify(data, null, 2) // 2 = pretty-print, easy to read
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  // Trick: make an invisible link, "click" it, then clean up.
  const link = document.createElement('a')
  link.href = url
  link.download = `night-off-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

// ---------- Import ----------

/** Is this value a plain object (not null, not an array)? */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Return the text if it's a non-empty string, otherwise null. */
function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/**
 * Read the text of a backup file and turn it into safe, valid data.
 *
 * Files from outside the app can't be trusted, so we check every field and
 * quietly fix or drop anything odd. If the file isn't a backup at all, we
 * throw an Error with a message that's friendly enough to show the user.
 */
export function parseBackup(text: string): BackupData {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error("That file isn't a valid backup (it couldn't be read as JSON).")
  }

  if (!isRecord(json) || !Array.isArray(json.places)) {
    throw new Error("That file doesn't look like a Night Off backup.")
  }

  // 1. Custom tags: keep only well-formed ones.
  const customTags: Tag[] = []
  const rawTags: unknown[] = Array.isArray(json.customTags) ? json.customTags : []
  for (const raw of rawTags) {
    if (!isRecord(raw)) continue
    const id = cleanString(raw.id)
    const label = cleanString(raw.label)
    if (id && label) customTags.push({ id, label, group: 'custom' })
  }

  // Tag ids a place is allowed to use: the presets plus the custom ones we just read.
  const knownTagIds = new Set([...PRESET_TAGS, ...customTags].map((t) => t.id))

  // 2. Places: rebuild each one field by field.
  const places: Place[] = []
  for (const raw of json.places) {
    if (!isRecord(raw)) continue
    const name = cleanString(raw.name)
    if (!name) continue // a place without a name is useless, skip it

    const now = new Date().toISOString()
    const price = PRICES.find((p) => p === raw.price) ?? null
    const sourceType = SOURCE_TYPES.find((s) => s === raw.sourceType) ?? null
    const status = STATUSES.find((s) => s.value === raw.status)?.value ?? 'want'
    const rawTagIds: unknown[] = Array.isArray(raw.tagIds) ? raw.tagIds : []
    const rawUrl = cleanString(raw.sourceUrl)

    places.push({
      id: cleanString(raw.id) ?? newId(),
      name,
      neighborhood: cleanString(raw.neighborhood),
      sourceUrl: rawUrl ? normalizeUrl(rawUrl) : null, // also blocks unsafe links
      sourceType,
      price,
      note: cleanString(raw.note),
      tagIds: rawTagIds.filter((id): id is string => typeof id === 'string' && knownTagIds.has(id)),
      status,
      isSample: raw.isSample === true,
      createdAt: cleanString(raw.createdAt) ?? now,
      updatedAt: cleanString(raw.updatedAt) ?? now,
    })
  }

  return { version: 1, places, customTags }
}
