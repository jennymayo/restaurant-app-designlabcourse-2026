import type { Place, PlaceInput } from '../types'

/**
 * Turn a saved Place back into the "form shape" (PlaceInput) by dropping the
 * fields the app manages itself. Handy when we want to change one field of an
 * existing place, like its status.
 */
export function toInput(place: Place): PlaceInput {
  return {
    name: place.name,
    neighborhood: place.neighborhood,
    sourceUrl: place.sourceUrl,
    sourceType: place.sourceType,
    price: place.price,
    note: place.note,
    tagIds: place.tagIds,
    status: place.status,
  }
}

/** Friendly text for the "open source link" button, e.g. "Open on Instagram". */
export function openLinkLabel(place: Place): string {
  const named = place.sourceType && place.sourceType !== 'Friend' && place.sourceType !== 'Other'
  return named ? `Open on ${place.sourceType}` : 'Open source link'
}
