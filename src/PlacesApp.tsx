import { useMemo, useState } from 'react'
import { BackupPanel } from './components/BackupPanel'
import { FilterPanel } from './components/FilterPanel'
import { NightOffPick } from './components/NightOffPick'
import { PlaceDetail } from './components/PlaceDetail'
import { PlaceForm } from './components/PlaceForm'
import { PlaceList } from './components/PlaceList'
import { SearchBar } from './components/SearchBar'
import { Sheet } from './components/Sheet'
import { useFilters } from './hooks/useFilters'
import { usePlaces } from './hooks/usePlaces'
import { countActiveFilters, filterPlaces } from './lib/filtering'
import { toInput } from './lib/place'
import type { PlaceInput, Status } from './types'

/**
 * Which popup (if any) is open right now.
 * Only one can be open at a time, so we keep a single value for it.
 */
type SheetState =
  | { kind: 'add' }
  | { kind: 'edit'; placeId: string }
  | { kind: 'detail'; placeId: string }
  | { kind: 'pick' }
  | { kind: 'backup' }
  | null

interface PlacesAppProps {
  /** Who is signed in (shown in the header). Not set when running without Supabase. */
  userEmail?: string | null
  /** Sign out. Not set when running without Supabase, so no button is shown. */
  onSignOut?: () => void
}

/** The main screen (shown once signed in). It wires the data, the filters, and the popups together. */
export default function PlacesApp({ userEmail, onSignOut }: PlacesAppProps) {
  // ----- Data and filters -----
  const data = usePlaces()
  const { filters, setSearch, togglePrice, toggleStatus, toggleTag, clearAll } = useFilters()

  const [sheet, setSheet] = useState<SheetState>(null)
  const closeSheet = () => setSheet(null)

  // A quick lookup of tag id → tag, used by the cards.
  const tagsById = useMemo(() => new Map(data.allTags.map((t) => [t.id, t])), [data.allTags])

  // If a custom tag was deleted while selected as a filter, quietly ignore it.
  const effectiveFilters = useMemo(
    () => ({ ...filters, tagIds: filters.tagIds.filter((id) => tagsById.has(id)) }),
    [filters, tagsById],
  )

  // The matching places. useMemo means we only recalculate when something changes.
  const results = useMemo(
    () => filterPlaces(data.places, effectiveFilters, data.allTags),
    [data.places, effectiveFilters, data.allTags],
  )
  const activeCount = countActiveFilters(effectiveFilters)
  const sampleCount = data.places.filter((p) => p.isSample).length

  // The place the open popup is about (for detail and edit).
  const currentPlace =
    sheet && (sheet.kind === 'detail' || sheet.kind === 'edit')
      ? data.places.find((p) => p.id === sheet.placeId)
      : undefined

  // ----- Actions -----

  async function handleSave(input: PlaceInput): Promise<boolean> {
    if (sheet?.kind === 'edit') {
      const updated = await data.editPlace(sheet.placeId, input)
      if (updated) setSheet({ kind: 'detail', placeId: updated.id })
      return updated !== undefined
    }
    const created = await data.addPlace(input)
    if (created) closeSheet()
    return created !== undefined
  }

  async function handleDelete(placeId: string) {
    await data.removePlace(placeId)
    closeSheet()
  }

  async function handleChangeStatus(placeId: string, status: Status) {
    const place = data.places.find((p) => p.id === placeId)
    if (place) await data.editPlace(placeId, { ...toInput(place), status })
  }

  function handleClearSamples() {
    if (window.confirm('Remove all sample places? Places you added or edited yourself are kept.')) {
      data.clearSamples()
    }
  }

  // ----- Popup title -----
  let sheetTitle = ''
  if (sheet?.kind === 'add') sheetTitle = 'Add a place'
  if (sheet?.kind === 'edit') sheetTitle = 'Edit place'
  if (sheet?.kind === 'detail') sheetTitle = currentPlace?.name ?? 'Place'
  if (sheet?.kind === 'pick') sheetTitle = 'Tonight’s pick'
  if (sheet?.kind === 'backup') sheetTitle = 'Backup & data'

  return (
    <div className="min-h-dvh">
      {/* ---------- Header ---------- */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-2xl font-extrabold text-orange-800">Night Off</h1>
            <p className="text-sm text-stone-600">Find the right place, fast.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSheet({ kind: 'backup' })}
              className="min-h-11 rounded-full border-2 border-stone-300 px-4 font-semibold hover:bg-stone-100"
            >
              Backup
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="min-h-11 rounded-full border-2 border-stone-300 px-4 font-semibold hover:bg-stone-100"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
        {userEmail && (
          <p className="mx-auto max-w-2xl px-4 pb-2 text-sm text-stone-600">
            Signed in as <span className="font-medium break-all">{userEmail}</span>
          </p>
        )}
      </header>

      {/* ---------- Main content ---------- */}
      {/* pb-32 leaves room so the bottom buttons never cover the last card. */}
      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-4 pb-32">
        {data.error && (
          <p role="alert" className="rounded-2xl bg-red-50 p-3 font-medium text-red-900">
            {data.error}
          </p>
        )}

        {sampleCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sky-50 p-3 text-sky-950">
            <p className="font-medium">
              These are <strong>sample places</strong> so you can try the filters.
            </p>
            <button
              type="button"
              onClick={handleClearSamples}
              className="min-h-11 rounded-full border-2 border-sky-800 px-4 font-semibold hover:bg-sky-100"
            >
              Clear sample data
            </button>
          </div>
        )}

        <SearchBar value={filters.search} onChange={setSearch} />

        <FilterPanel
          filters={effectiveFilters}
          allTags={data.allTags}
          activeCount={activeCount}
          onTogglePrice={togglePrice}
          onToggleStatus={toggleStatus}
          onToggleTag={toggleTag}
          onClearAll={clearAll}
        />

        {data.isLoading ? (
          <p className="py-8 text-center text-stone-700">Loading your places…</p>
        ) : (
          <>
            {/* aria-live: screen readers hear the count change as filters change. */}
            <p aria-live="polite" className="font-semibold text-stone-700">
              {data.places.length === 0
                ? ''
                : `Showing ${results.length} of ${data.places.length} ${data.places.length === 1 ? 'place' : 'places'}`}
            </p>
            <PlaceList
              totalCount={data.places.length}
              results={results}
              tagsById={tagsById}
              onOpen={(placeId) => setSheet({ kind: 'detail', placeId })}
              onAdd={() => setSheet({ kind: 'add' })}
              onClearFilters={clearAll}
            />
          </>
        )}
      </main>

      {/* ---------- Bottom action bar (easy to reach with a thumb) ---------- */}
      <nav
        aria-label="Main actions"
        className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className="mx-auto flex max-w-2xl gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setSheet({ kind: 'pick' })}
            disabled={results.length === 0}
            className="min-h-14 flex-1 rounded-full bg-orange-700 px-3 text-base font-bold whitespace-nowrap text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">🎲 </span>Night off pick
          </button>
          <button
            type="button"
            onClick={() => setSheet({ kind: 'add' })}
            className="min-h-14 flex-1 rounded-full bg-stone-900 px-3 text-base font-bold whitespace-nowrap text-white hover:bg-stone-700"
          >
            <span aria-hidden="true">+ </span>Add place
          </button>
        </div>
      </nav>

      {/* ---------- Popups ---------- */}
      {/* `key` makes React start a fresh popup when the kind changes, so the cursor and form reset. */}
      {sheet && (
        <Sheet key={sheet.kind} title={sheetTitle} onClose={closeSheet}>
          {sheet.kind === 'add' && (
            <PlaceForm
              allTags={data.allTags}
              onSave={handleSave}
              onCancel={closeSheet}
              onCreateTag={data.addCustomTag}
              onRemoveTag={(tag) => data.removeCustomTag(tag.id)}
            />
          )}

          {sheet.kind === 'edit' && currentPlace && (
            <PlaceForm
              place={currentPlace}
              allTags={data.allTags}
              onSave={handleSave}
              onCancel={() => setSheet({ kind: 'detail', placeId: currentPlace.id })}
              onCreateTag={data.addCustomTag}
              onRemoveTag={(tag) => data.removeCustomTag(tag.id)}
            />
          )}

          {sheet.kind === 'detail' && currentPlace && (
            <PlaceDetail
              place={currentPlace}
              tagsById={tagsById}
              onChangeStatus={(status) => handleChangeStatus(currentPlace.id, status)}
              onEdit={() => setSheet({ kind: 'edit', placeId: currentPlace.id })}
              onDelete={() => handleDelete(currentPlace.id)}
            />
          )}

          {sheet.kind === 'pick' && (
            <NightOffPick
              candidates={results}
              tagsById={tagsById}
              onSeeDetails={(placeId) => setSheet({ kind: 'detail', placeId })}
            />
          )}

          {sheet.kind === 'backup' && (
            <BackupPanel
              places={data.places}
              customTags={data.customTags}
              sampleCount={sampleCount}
              onImport={data.importData}
              onClearSamples={handleClearSamples}
            />
          )}
        </Sheet>
      )}
    </div>
  )
}
