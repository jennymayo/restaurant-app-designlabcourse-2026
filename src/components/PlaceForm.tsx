import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { normalizeUrl } from '../lib/url'
import { PRICES, SOURCE_TYPES, STATUSES } from '../types'
import type { Place, PlaceInput, Price, SourceType, Status, Tag } from '../types'
import { Chip } from './Chip'
import { TagChipGroups } from './TagChipGroups'

interface PlaceFormProps {
  /** Pass a place to edit it. Leave out to add a new one. */
  place?: Place
  allTags: Tag[]
  /** Save the place. Resolves to true if it worked. */
  onSave: (input: PlaceInput) => Promise<boolean>
  onCancel: () => void
  /** Create a custom tag; resolves to the new tag (or undefined if it failed). */
  onCreateTag: (label: string) => Promise<Tag | undefined>
  onRemoveTag: (tag: Tag) => void
}

// Shared look for text boxes, selects and the notes area.
const FIELD_CLASS = 'min-h-12 w-full rounded-2xl border-2 border-stone-300 bg-white px-4 text-base'
const LABEL_CLASS = 'mb-1 block font-semibold'

/**
 * The add / edit form.
 *
 * Speed matters: only the NAME is visible at first (and already focused), so
 * a new place can be saved in a few seconds. Everything else sits under
 * "More details" and is entirely optional.
 */
export function PlaceForm({ place, allTags, onSave, onCancel, onCreateTag, onRemoveTag }: PlaceFormProps) {
  const ids = useId() // a unique prefix so each label can point to its input

  // One piece of state per field. When editing, start from the existing values.
  const [name, setName] = useState(place?.name ?? '')
  const [neighborhood, setNeighborhood] = useState(place?.neighborhood ?? '')
  const [sourceUrl, setSourceUrl] = useState(place?.sourceUrl ?? '')
  const [sourceType, setSourceType] = useState<SourceType | ''>(place?.sourceType ?? '')
  const [price, setPrice] = useState<Price | null>(place?.price ?? null)
  const [status, setStatus] = useState<Status>(place?.status ?? 'want')
  const [tagIds, setTagIds] = useState<string[]>(place?.tagIds ?? [])
  const [note, setNote] = useState(place?.note ?? '')
  const [newTag, setNewTag] = useState('')

  // The "More details" section is open by default only when editing.
  const [showMore, setShowMore] = useState(place !== undefined)
  const [nameError, setNameError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function toggleTag(tagId: string) {
    setTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    )
  }

  /** Make a brand-new custom tag, or just select it if one with that name exists. */
  async function addCustomTag() {
    const label = newTag.trim()
    if (!label) return

    const existing = allTags.find((t) => t.label.toLowerCase() === label.toLowerCase())
    if (existing) {
      setTagIds((current) => (current.includes(existing.id) ? current : [...current, existing.id]))
    } else {
      const created = await onCreateTag(label)
      if (created) setTagIds((current) => [...current, created.id])
    }
    setNewTag('')
  }

  function removeCustomTag(tag: Tag) {
    if (window.confirm(`Delete the tag "${tag.label}"? It will be removed from every place.`)) {
      setTagIds((current) => current.filter((id) => id !== tag.id))
      onRemoveTag(tag)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault() // stop the browser from reloading the page

    // Check the name.
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('Please enter a name.')
      return
    }
    setNameError(null)

    // Check the link (only if one was typed).
    let cleanUrl: string | null = null
    if (sourceUrl.trim()) {
      cleanUrl = normalizeUrl(sourceUrl)
      if (!cleanUrl) {
        setShowMore(true) // make sure the problem field is visible
        setUrlError("That doesn't look like a web link. Try pasting it again.")
        return
      }
    }
    setUrlError(null)

    setIsSaving(true)
    const ok = await onSave({
      name: trimmedName,
      neighborhood: neighborhood.trim() || null,
      sourceUrl: cleanUrl,
      sourceType: sourceType || null,
      price,
      note: note.trim() || null,
      tagIds,
      status,
    })
    // If it saved, the parent closes this form. If not, let her try again.
    if (!ok) setIsSaving(false)
  }

  return (
    // noValidate: we show our own friendly messages instead of the browser's pop-ups.
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* ---------- The only required field ---------- */}
      <div>
        <label htmlFor={`${ids}-name`} className={LABEL_CLASS}>
          Name <span className="font-normal text-stone-600">(required)</span>
        </label>
        <input
          id={`${ids}-name`}
          data-autofocus // the Sheet moves the cursor here when it opens
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={nameError !== null}
          aria-describedby={nameError ? `${ids}-name-error` : undefined}
          autoComplete="off"
          className={FIELD_CLASS}
        />
        {nameError && (
          <p id={`${ids}-name-error`} role="alert" className="mt-1 font-medium text-red-700">
            {nameError}
          </p>
        )}
      </div>

      {/* ---------- Everything else is optional ---------- */}
      <button
        type="button"
        aria-expanded={showMore}
        aria-controls={`${ids}-more`}
        onClick={() => setShowMore((s) => !s)}
        className="flex min-h-11 items-center gap-2 rounded-full border-2 border-stone-300 px-4 font-semibold hover:bg-stone-100"
      >
        <span aria-hidden="true">{showMore ? '▾' : '▸'}</span>
        {showMore ? 'Hide details' : 'Add details (optional)'}
      </button>

      {showMore && (
        <div id={`${ids}-more`} className="space-y-5">
          <div>
            <label htmlFor={`${ids}-hood`} className={LABEL_CLASS}>
              Neighborhood or address
            </label>
            <input
              id={`${ids}-hood`}
              type="text"
              value={neighborhood}
              onChange={(event) => setNeighborhood(event.target.value)}
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label htmlFor={`${ids}-url`} className={LABEL_CLASS}>
              Source link
            </label>
            <input
              id={`${ids}-url`}
              type="text"
              inputMode="url"
              placeholder="Paste an Instagram, TikTok, or Google Maps link"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              aria-invalid={urlError !== null}
              aria-describedby={urlError ? `${ids}-url-error` : undefined}
              autoComplete="off"
              className={FIELD_CLASS}
            />
            {urlError && (
              <p id={`${ids}-url-error`} role="alert" className="mt-1 font-medium text-red-700">
                {urlError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${ids}-source`} className={LABEL_CLASS}>
              Where did you find it?
            </label>
            <select
              id={`${ids}-source`}
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value as SourceType | '')}
              className={FIELD_CLASS}
            >
              <option value="">Not sure / skip</option>
              {SOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className={LABEL_CLASS}>Price</legend>
            <div className="flex flex-wrap gap-2">
              {PRICES.map((p) => (
                // Tapping the selected price again turns it off.
                <Chip key={p} label={p} pressed={price === p} onToggle={() => setPrice(price === p ? null : p)} />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={LABEL_CLASS}>Status</legend>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Chip key={s.value} label={s.label} pressed={status === s.value} onToggle={() => setStatus(s.value)} />
              ))}
            </div>
          </fieldset>

          <div>
            <p className={LABEL_CLASS}>Tags</p>
            <TagChipGroups
              tags={allTags}
              selectedIds={tagIds}
              onToggle={toggleTag}
              onRemoveCustom={removeCustomTag}
            />

            {/* Make a tag of your own. */}
            <div className="mt-4">
              <label htmlFor={`${ids}-newtag`} className={LABEL_CLASS}>
                Add your own tag
              </label>
              <div className="flex gap-2">
                <input
                  id={`${ids}-newtag`}
                  type="text"
                  value={newTag}
                  onChange={(event) => setNewTag(event.target.value)}
                  onKeyDown={(event) => {
                    // Enter here should add the tag, not save the whole form.
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCustomTag()
                    }
                  }}
                  placeholder="e.g. great patio"
                  autoComplete="off"
                  className={FIELD_CLASS}
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="min-h-12 shrink-0 rounded-2xl border-2 border-stone-300 px-4 font-semibold hover:bg-stone-100"
                >
                  Add tag
                </button>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor={`${ids}-note`} className={LABEL_CLASS}>
              Personal note
            </label>
            <textarea
              id={`${ids}-note`}
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Why did you save this?"
              className="w-full rounded-2xl border-2 border-stone-300 bg-white p-4 text-base"
            />
          </div>
        </div>
      )}

      {/* ---------- Buttons ---------- */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-12 flex-1 rounded-full bg-orange-700 px-6 text-base font-bold text-white hover:bg-orange-800 disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : place ? 'Save changes' : 'Save place'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-12 rounded-full border-2 border-stone-300 px-6 text-base font-semibold hover:bg-stone-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
