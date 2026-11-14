import type { Filters, Place, Tag } from '../types'

/** The "nothing selected" state. */
export const EMPTY_FILTERS: Filters = { search: '', prices: [], statuses: [], tagIds: [] }

/** How many things are narrowing the list right now (search counts as one). */
export function countActiveFilters(filters: Filters): number {
  return (
    filters.prices.length +
    filters.statuses.length +
    filters.tagIds.length +
    (filters.search.trim() ? 1 : 0)
  )
}

/**
 * Keep only the places that match the filters.
 *
 * This is a "pure function": the same inputs always give the same output, and
 * it changes nothing. That makes it easy to understand and to test.
 *
 * The rules:
 *   - Price:   a place matches if its price is ANY of the selected prices ($ or $$).
 *   - Status:  a place matches if its status is ANY of the selected statuses.
 *   - Tags:    a place must have ALL of the selected tags (cozy AND reading or working).
 *   - Search:  every word typed must appear in the name, neighborhood, note, or a tag label.
 *   - All of the above are combined with AND.
 *
 * A place with no price is hidden while a price filter is on.
 */
export function filterPlaces(places: Place[], filters: Filters, allTags: Tag[]): Place[] {
  // Turn the tag list into a quick lookup: id → label.
  const labelById = new Map(allTags.map((t) => [t.id, t.label]))
  const words = filters.search.toLowerCase().split(/\s+/).filter(Boolean)

  return places.filter((place) => {
    if (filters.prices.length > 0 && (!place.price || !filters.prices.includes(place.price))) {
      return false
    }

    if (filters.statuses.length > 0 && !filters.statuses.includes(place.status)) {
      return false
    }

    if (!filters.tagIds.every((tagId) => place.tagIds.includes(tagId))) {
      return false
    }

    if (words.length > 0) {
      // Build one big lowercase string to search inside.
      const searchable = [
        place.name,
        place.neighborhood ?? '',
        place.note ?? '',
        ...place.tagIds.map((id) => labelById.get(id) ?? ''),
      ]
        .join(' ')
        .toLowerCase()
      if (!words.every((word) => searchable.includes(word))) return false
    }

    return true
  })
}
