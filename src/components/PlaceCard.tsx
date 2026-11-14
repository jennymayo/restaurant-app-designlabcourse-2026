import { statusLabel } from '../types'
import type { Place, Status, Tag } from '../types'

interface PlaceCardProps {
  place: Place
  tagsById: Map<string, Tag>
  onOpen: () => void
}

// Badge colors for each status (dark text on a light tint = good contrast).
const STATUS_STYLES: Record<Status, string> = {
  want: 'bg-amber-100 text-amber-900',
  visited: 'bg-stone-200 text-stone-800',
  'would-return': 'bg-emerald-100 text-emerald-900',
}

const MAX_TAGS_SHOWN = 4

/** One place in the results list. The whole card is a button that opens the details. */
export function PlaceCard({ place, tagsById, onOpen }: PlaceCardProps) {
  const tagLabels = place.tagIds.map((id) => tagsById.get(id)?.label).filter((l): l is string => !!l)
  const shown = tagLabels.slice(0, MAX_TAGS_SHOWN)
  const hiddenCount = tagLabels.length - shown.length

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-3xl border border-stone-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-snug break-words">{place.name}</h3>
          {place.price && (
            <span className="shrink-0 text-lg font-bold text-orange-800">
              <span className="sr-only">Price: </span>
              {place.price}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
          {place.neighborhood && <span>{place.neighborhood}</span>}
          <span className={`rounded-full px-2.5 py-0.5 font-medium ${STATUS_STYLES[place.status]}`}>
            {statusLabel(place.status)}
          </span>
          {place.isSample && (
            <span className="rounded-full border border-stone-300 px-2.5 py-0.5 font-medium">Sample</span>
          )}
        </div>

        {place.note && <p className="mt-2 line-clamp-2 text-stone-700">{place.note}</p>}

        {shown.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
            {shown.map((label) => (
              <li key={label} className="rounded-full bg-orange-50 px-2.5 py-0.5 text-sm text-orange-900">
                {label}
              </li>
            ))}
            {hiddenCount > 0 && (
              <li className="rounded-full bg-stone-100 px-2.5 py-0.5 text-sm text-stone-700">
                +{hiddenCount} more
              </li>
            )}
          </ul>
        )}
      </button>
    </li>
  )
}
