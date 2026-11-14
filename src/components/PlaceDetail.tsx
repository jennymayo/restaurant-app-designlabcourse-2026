import { useState } from 'react'
import { openLinkLabel } from '../lib/place'
import { STATUSES } from '../types'
import type { Place, Status, Tag } from '../types'
import { Chip } from './Chip'

interface PlaceDetailProps {
  place: Place
  tagsById: Map<string, Tag>
  onChangeStatus: (status: Status) => void
  onEdit: () => void
  onDelete: () => void
}

/** Everything about one place, plus Edit, Delete, and the source link. */
export function PlaceDetail({ place, tagsById, onChangeStatus, onEdit, onDelete }: PlaceDetailProps) {
  // Deleting can't be undone, so the first tap just asks "are you sure?"
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const tagLabels = place.tagIds.map((id) => tagsById.get(id)?.label).filter((l): l is string => !!l)

  return (
    <div className="space-y-5">
      {/* Quick facts */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-stone-700">
        {place.price && (
          <span className="text-lg font-bold text-orange-800">
            <span className="sr-only">Price: </span>
            {place.price}
          </span>
        )}
        {place.neighborhood && <span>{place.neighborhood}</span>}
        {place.sourceType && <span>Found via {place.sourceType}</span>}
        {place.isSample && (
          <span className="rounded-full border border-stone-300 px-2.5 py-0.5 text-sm font-medium">
            Sample data
          </span>
        )}
      </div>

      {place.note && (
        <section>
          <h3 className="mb-1 font-semibold">Note</h3>
          <p className="whitespace-pre-wrap text-stone-800">{place.note}</p>
        </section>
      )}

      {tagLabels.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold">Tags</h3>
          <ul className="flex flex-wrap gap-1.5">
            {tagLabels.map((label) => (
              <li key={label} className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-900">
                {label}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Change the status in one tap, for example after visiting. */}
      <fieldset>
        <legend className="mb-2 font-semibold">Status</legend>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Chip
              key={s.value}
              label={s.label}
              pressed={place.status === s.value}
              onToggle={() => onChangeStatus(s.value)}
            />
          ))}
        </div>
      </fieldset>

      {/* Opens the original post in a new tab. rel="noopener noreferrer" keeps the new tab from controlling this one. */}
      {place.sourceUrl && (
        <a
          href={place.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center rounded-full bg-stone-900 px-6 text-base font-semibold text-white hover:bg-stone-700"
        >
          {openLinkLabel(place)} <span aria-hidden="true">&nbsp;↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}

      {/* Edit and delete */}
      {confirmingDelete ? (
        <div role="alertdialog" aria-label="Confirm delete" className="rounded-2xl bg-red-50 p-4">
          <p className="font-semibold text-red-900">Delete “{place.name}”? This can’t be undone.</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={onDelete}
              className="min-h-12 flex-1 rounded-full bg-red-700 px-6 font-bold text-white hover:bg-red-800"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="min-h-12 rounded-full border-2 border-stone-300 bg-white px-6 font-semibold hover:bg-stone-100"
            >
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="min-h-12 flex-1 rounded-full border-2 border-stone-300 px-6 text-base font-semibold hover:bg-stone-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="min-h-12 rounded-full border-2 border-red-300 px-6 text-base font-semibold text-red-800 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
