import type { Place, Tag } from '../types'
import { PlaceCard } from './PlaceCard'

interface PlaceListProps {
  /** Every saved place (used to tell "nothing saved yet" from "nothing matches"). */
  totalCount: number
  /** The places that match the current filters. */
  results: Place[]
  tagsById: Map<string, Tag>
  onOpen: (placeId: string) => void
  onAdd: () => void
  onClearFilters: () => void
}

/** The list of results, plus the two "empty" screens that guide the user. */
export function PlaceList({ totalCount, results, tagsById, onOpen, onAdd, onClearFilters }: PlaceListProps) {
  // Empty state 1: she hasn't saved anything yet.
  if (totalCount === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white p-8 text-center">
        <p className="text-4xl" aria-hidden="true">
          🍽️
        </p>
        <h2 className="mt-2 text-xl font-bold">Add your first place</h2>
        <p className="mt-1 text-stone-700">
          Save a spot you want to try. Only the name is needed, you can add the rest later.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 min-h-12 rounded-full bg-stone-900 px-6 text-base font-semibold text-white hover:bg-stone-700"
        >
          Add a place
        </button>
      </div>
    )
  }

  // Empty state 2: places exist, but the filters hide all of them.
  if (results.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-white p-8 text-center">
        <p className="text-4xl" aria-hidden="true">
          🔍
        </p>
        <h2 className="mt-2 text-xl font-bold">No matches</h2>
        <p className="mt-1 text-stone-700">Try removing a filter or changing your search.</p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 min-h-12 rounded-full bg-stone-900 px-6 text-base font-semibold text-white hover:bg-stone-700"
        >
          Clear all filters
        </button>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {results.map((place) => (
        <PlaceCard key={place.id} place={place} tagsById={tagsById} onOpen={() => onOpen(place.id)} />
      ))}
    </ul>
  )
}
