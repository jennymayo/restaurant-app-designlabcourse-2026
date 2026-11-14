import { newId } from '../lib/id'
import type { SupabaseClient } from '@supabase/supabase-js'
import { makeSamplePlaces } from '../data/samplePlaces'
import type { BackupData, Place, PlaceInput, Tag } from '../types'
import type { PlacesRepository } from './PlacesRepository'

/**
 * Stores everything in Supabase (a Postgres database in the cloud).
 *
 * It follows the exact same "contract" as the localStorage version
 * (PlacesRepository), so no other file in the app had to change.
 *
 * Three tables (see the database migration):
 *   places       one row per place
 *   custom_tags  tags the user created
 *   place_tags   links a place to its tags (one row per place + tag)
 *
 * WHO CAN SEE WHAT: people sign in with email + password (see useAuth.ts).
 * Database rules (row level security) make sure each signed-in user can only
 * see and change the rows that belong to them.
 */

// ---------- Row shapes (how the database names things: snake_case) ----------

interface PlaceRow {
  id: string
  name: string
  neighborhood: string | null
  source_url: string | null
  source_type: Place['sourceType']
  price: Place['price']
  note: string | null
  status: Place['status']
  is_sample: boolean
  created_at: string
  updated_at: string
  place_tags: { tag_id: string }[] // comes from the join in listPlaces
}

interface CustomTagRow {
  id: string
  label: string
}

/** Database rows → the Place shape the app uses (camelCase). */
function toPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    neighborhood: row.neighborhood,
    sourceUrl: row.source_url,
    sourceType: row.source_type,
    price: row.price,
    note: row.note,
    tagIds: row.place_tags.map((t) => t.tag_id),
    status: row.status,
    isSample: row.is_sample,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** The editable fields of a place → database column names. */
function toRowFields(input: PlaceInput) {
  return {
    name: input.name,
    neighborhood: input.neighborhood,
    source_url: input.sourceUrl,
    source_type: input.sourceType,
    price: input.price,
    note: input.note,
    status: input.status,
  }
}

/** Supabase returns errors as values. Turn them into normal thrown Errors. */
function check(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

/** Has the sample data already been added for this user on this browser? */
function wasSeeded(flag: string): boolean {
  try {
    return localStorage.getItem(flag) !== null
  } catch {
    return true // storage blocked: don't risk adding samples over and over
  }
}

function markSeeded(flag: string): void {
  try {
    localStorage.setItem(flag, '1')
  } catch {
    // ignore: see wasSeeded
  }
}

export function createSupabaseRepository(supabase: SupabaseClient): PlacesRepository {
  /**
   * Return the signed-in user's id. The sign-in screen guarantees someone is
   * signed in before the app loads data, so this is just a safety check.
   * (Supabase attaches the user's login to every request automatically.)
   */
  async function ensureUser(): Promise<string> {
    const { data } = await supabase.auth.getSession()
    if (!data.session) throw new Error('You are signed out. Please sign in again.')
    return data.session.user.id
  }

  /** Save places (and their tag links) in one go. Used by seeding and import. */
  async function insertPlaces(places: Place[]): Promise<void> {
    if (places.length === 0) return

    const { error } = await supabase.from('places').insert(
      places.map((p) => ({
        id: p.id,
        ...toRowFields(p),
        is_sample: p.isSample,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })),
    )
    check(error)

    const links = places.flatMap((p) => p.tagIds.map((tagId) => ({ place_id: p.id, tag_id: tagId })))
    if (links.length > 0) {
      const { error: linkError } = await supabase.from('place_tags').insert(links)
      check(linkError)
    }
  }

  /** Replace the tag links of one place. */
  async function setPlaceTags(placeId: string, tagIds: string[]): Promise<void> {
    const { error } = await supabase.from('place_tags').delete().eq('place_id', placeId)
    check(error)
    if (tagIds.length > 0) {
      const { error: insertError } = await supabase
        .from('place_tags')
        .insert(tagIds.map((tag_id) => ({ place_id: placeId, tag_id })))
      check(insertError)
    }
  }

  /** Fetch one place with its tags. */
  async function getPlace(id: string): Promise<Place> {
    const { data, error } = await supabase
      .from('places')
      .select('*, place_tags(tag_id)')
      .eq('id', id)
      .single()
    check(error)
    return toPlace(data as PlaceRow)
  }

  return {
    async listPlaces() {
      const userId = await ensureUser()

      const { data, error } = await supabase
        .from('places')
        .select('*, place_tags(tag_id)')
        .order('created_at', { ascending: false })
      check(error)
      const places = (data as PlaceRow[]).map(toPlace)

      // First visit ever on this browser: add the sample places once so the
      // filters can be tried. The flag stops them coming back after "Clear sample data".
      const seededFlag = `night-off:seeded:${userId}`
      if (places.length === 0 && !wasSeeded(seededFlag)) {
        markSeeded(seededFlag)
        const samples = makeSamplePlaces()
        await insertPlaces(samples)
        return samples
      }
      return places
    },

    async createPlace(input: PlaceInput) {
      await ensureUser()
      const { data, error } = await supabase
        .from('places')
        .insert({ ...toRowFields(input) })
        .select('id')
        .single()
      check(error)
      const id = (data as { id: string }).id

      try {
        await setPlaceTags(id, input.tagIds)
      } catch (tagError) {
        // Don't leave a half-saved place behind.
        await supabase.from('places').delete().eq('id', id)
        throw tagError
      }
      return getPlace(id)
    },

    async updatePlace(id: string, input: PlaceInput) {
      await ensureUser()
      const { error } = await supabase
        .from('places')
        .update({
          ...toRowFields(input),
          // Once you edit a sample place it becomes "yours".
          is_sample: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      check(error)
      await setPlaceTags(id, input.tagIds)
      return getPlace(id)
    },

    async deletePlace(id: string) {
      await ensureUser()
      // The tag links are removed automatically ("on delete cascade").
      const { error } = await supabase.from('places').delete().eq('id', id)
      check(error)
    },

    async listCustomTags() {
      await ensureUser()
      const { data, error } = await supabase
        .from('custom_tags')
        .select('id, label')
        .order('created_at', { ascending: true })
      check(error)
      return (data as CustomTagRow[]).map((row): Tag => ({ id: row.id, label: row.label, group: 'custom' }))
    },

    async createCustomTag(label: string) {
      await ensureUser()
      const { data, error } = await supabase
        .from('custom_tags')
        .insert({ label: label.trim() })
        .select('id, label')
        .single()
      check(error)
      const row = data as CustomTagRow
      return { id: row.id, label: row.label, group: 'custom' }
    },

    async deleteCustomTag(id: string) {
      await ensureUser()
      // Take the tag off every place first, then delete the tag itself.
      const { error: linkError } = await supabase.from('place_tags').delete().eq('tag_id', id)
      check(linkError)
      const { error } = await supabase.from('custom_tags').delete().eq('id', id)
      check(error)
    },

    async replaceAll(data: BackupData) {
      await ensureUser()

      // Give everything brand-new ids. A backup made on another device still
      // contains the ids from that device, and ids must be unique across the
      // whole database, so reusing them could clash.
      const oldToNewTagId = new Map<string, string>()
      for (const tag of data.customTags) {
        oldToNewTagId.set(tag.id, `custom-${newId()}`)
      }
      const places: Place[] = data.places.map((p) => ({
        ...p,
        id: newId(),
        tagIds: p.tagIds.map((id) => oldToNewTagId.get(id) ?? id),
      }))

      // Wipe the current data (links go with the places automatically).
      // Supabase refuses a delete with no filter at all, so "delete everything"
      // is written as "where id is not null". Row level security still limits
      // it to this user's own rows.
      const { error: deletePlacesError } = await supabase.from('places').delete().not('id', 'is', null)
      check(deletePlacesError)
      const { error: deleteTagsError } = await supabase.from('custom_tags').delete().not('id', 'is', null)
      check(deleteTagsError)

      if (data.customTags.length > 0) {
        const { error } = await supabase.from('custom_tags').insert(
          data.customTags.map((t) => ({ id: oldToNewTagId.get(t.id), label: t.label })),
        )
        check(error)
      }
      await insertPlaces(places)
    },

    async deleteSamples() {
      await ensureUser()
      const { error } = await supabase.from('places').delete().eq('is_sample', true)
      check(error)
    },
  }
}
