import { useState } from 'react'
import { openLinkLabel } from '../lib/place'
import { pickRandom } from '../lib/pickRandom'
import { statusLabel } from '../types'
import type { Place, Tag } from '../types'

interface NightOffPickProps {
  /** The places that match the current filters. We pick from these only. */
  candidates: Place[]
  tagsById: Map<string, Tag>
  onSeeDetails: (placeId: string) => void
}

/** The "Night off" result: one randomly chosen place, with a button to pick again. */
export function NightOffPick({ candidates, tagsById, onSeeDetails }: NightOffPickProps) {
  // Pick one as soon as the sheet opens. (The function form runs only once.)
  const [pick, setPick] = useState<Place | null>(() => pickRandom(candidates))

  if (!pick) {
    return <p>Nothing to pick from. Try removing a filter.</p>
  }

  const tagLabels = pick.tagIds.map((id) => tagsById.get(id)?.label).filter((l): l is string => !!l)

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-stone-600">
        Picked from {candidates.length} {candidates.length === 1 ? 'place' : 'places'}
      </p>

      {/* aria-live announces the new pick to screen readers when it changes. */}
      <div aria-live="polite" className="rounded-3xl bg-orange-50 p-5">
        <p className="text-3xl" aria-hidden="true">
          🎉
        </p>
        <h3 className="mt-1 text-2xl font-bold break-words">{pick.name}</h3>
        <p className="mt-1 text-stone-700">
          {[pick.price, pick.neighborhood, statusLabel(pick.status)].filter(Boolean).join(' · ')}
        </p>
        {pick.note && <p className="mt-2 text-stone-800">{pick.note}</p>}
        {tagLabels.length > 0 && (
          <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
            {tagLabels.map((label) => (
              <li key={label} className="rounded-full bg-white px-3 py-1 text-sm text-orange-900">
                {label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {pick.sourceUrl && (
          <a
            href={pick.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center rounded-full bg-stone-900 px-6 font-semibold text-white hover:bg-stone-700"
          >
            {openLinkLabel(pick)} <span aria-hidden="true">&nbsp;↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        <button
          type="button"
          onClick={() => onSeeDetails(pick.id)}
          className="min-h-12 rounded-full border-2 border-stone-300 px-6 font-semibold hover:bg-stone-100"
        >
          See details
        </button>
        {candidates.length > 1 && (
          <button
            type="button"
            onClick={() => setPick(pickRandom(candidates, pick))}
            className="min-h-12 rounded-full bg-orange-700 px-6 font-bold text-white hover:bg-orange-800"
          >
            Pick another
          </button>
        )}
      </div>
    </div>
  )
}
