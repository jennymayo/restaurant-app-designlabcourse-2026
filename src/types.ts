/**
 * types.ts: the "shape" of our data.
 *
 * TypeScript types describe what our data looks like, so the editor can warn us
 * when we make a mistake (like misspelling a field name). Read this file first:
 * every other file in the app uses these types.
 */

// ---------- Fixed lists of choices ----------

// `as const` makes TypeScript treat these as exact values ('$', '$$', ...)
// instead of just "some strings". We reuse the arrays to draw the buttons.
export const PRICES = ['$', '$$', '$$$', '$$$$'] as const
export type Price = (typeof PRICES)[number] // '$' | '$$' | '$$$' | '$$$$'

export const SOURCE_TYPES = ['Instagram', 'TikTok', 'Google Maps', 'Friend', 'Other'] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

// Each status has a short code we store, and a friendly label we show.
export const STATUSES = [
  { value: 'want', label: 'Want to try' },
  { value: 'visited', label: 'Visited' },
  { value: 'would-return', label: 'Would go back' },
] as const
export type Status = (typeof STATUSES)[number]['value'] // 'want' | 'visited' | 'would-return'

/** Look up the friendly label for a status code. */
export function statusLabel(status: Status): string {
  return STATUSES.find((s) => s.value === status)?.label ?? status
}

// ---------- Tags ----------

// Tags are organised into groups. 'custom' is for tags the user makes herself.
export type TagGroup = 'occasion' | 'vibe' | 'goodFor' | 'dietary' | 'custom'

export interface Tag {
  id: string // stable id, e.g. 'vibe-cozy'
  label: string // what the user sees, e.g. 'cozy'
  group: TagGroup
}

// ---------- Places ----------

/**
 * A saved restaurant or café.
 *
 * Design notes (these make the later Supabase move easy):
 *  - `id` is a UUID string, like a database primary key.
 *  - Optional fields use `null` (not `undefined`), which is how databases
 *    represent "empty".
 *  - `tagIds` only stores tag ids. The tag names live in one place (tags).
 */
export interface Place {
  id: string
  name: string // the ONLY required field
  neighborhood: string | null // neighborhood or address
  sourceUrl: string | null // link to the Instagram / TikTok / Maps post
  sourceType: SourceType | null
  price: Price | null
  note: string | null // "why I saved this"
  tagIds: string[]
  status: Status
  isSample: boolean // true for the demo places, so they're easy to clear
  createdAt: string // ISO date string, e.g. '2026-11-11T17:00:00.000Z'
  updatedAt: string
}

/**
 * What the form gives us when adding or editing: a Place without the fields
 * the app fills in by itself (id, timestamps, isSample).
 */
export type PlaceInput = Omit<Place, 'id' | 'createdAt' | 'updatedAt' | 'isSample'>

// ---------- Filters ----------

export interface Filters {
  search: string // text typed into the search box
  prices: Price[] // match ANY selected price
  statuses: Status[] // match ANY selected status
  tagIds: string[] // match ALL selected tags
}

// ---------- Backup file ----------

/** What we save in the export file (and what import reads back). */
export interface BackupData {
  version: 1
  places: Place[]
  customTags: Tag[]
}
