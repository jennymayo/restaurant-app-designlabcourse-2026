import { useId, useState } from 'react'
import { PRICES, STATUSES } from '../types'
import type { Filters, Price, Status, Tag } from '../types'
import { Chip } from './Chip'
import { TagChipGroups } from './TagChipGroups'

interface FilterPanelProps {
  filters: Filters
  allTags: Tag[]
  activeCount: number
  onTogglePrice: (price: Price) => void
  onToggleStatus: (status: Status) => void
  onToggleTag: (tagId: string) => void
  onClearAll: () => void
}

/**
 * The filter chips. On a phone the panel starts folded up to save space, and
 * the chips you've picked are still shown underneath so you always see what's active.
 */
export function FilterPanel({
  filters,
  allTags,
  activeCount,
  onTogglePrice,
  onToggleStatus,
  onToggleTag,
  onClearAll,
}: FilterPanelProps) {
  const panelId = useId()

  // Start open on wider screens (640px+), folded on phones.
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 640px)').matches)

  // The chips that are switched on, used for the summary row when the panel is folded.
  const tagLabel = (id: string) => allTags.find((t) => t.id === id)?.label ?? id
  const activeChips = [
    ...filters.prices.map((p) => ({ key: `price-${p}`, label: p, off: () => onTogglePrice(p) })),
    ...filters.statuses.map((s) => ({
      key: `status-${s}`,
      label: STATUSES.find((x) => x.value === s)?.label ?? s,
      off: () => onToggleStatus(s),
    })),
    ...filters.tagIds.map((id) => ({ key: `tag-${id}`, label: tagLabel(id), off: () => onToggleTag(id) })),
  ]

  return (
    <section aria-label="Filters" className="rounded-3xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-11 items-center gap-2 rounded-full px-2 text-lg font-bold"
        >
          <span aria-hidden="true">{open ? '▾' : '▸'}</span>
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-orange-700 px-2.5 py-0.5 text-sm text-white">
              {activeCount}
              <span className="sr-only"> active</span>
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="min-h-11 rounded-full border-2 border-stone-300 px-4 text-base font-semibold hover:bg-stone-100"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Folded: show only the active chips (tap one to turn it off). */}
      {!open && activeChips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <Chip key={chip.key} label={chip.label} pressed onToggle={chip.off} />
          ))}
        </div>
      )}

      {/* Open: show every chip. */}
      {open && (
        <div id={panelId} className="mt-3 space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-600">
              Price
            </legend>
            <div className="flex flex-wrap gap-2">
              {PRICES.map((price) => (
                <Chip
                  key={price}
                  label={price}
                  pressed={filters.prices.includes(price)}
                  onToggle={() => onTogglePrice(price)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-600">
              Status
            </legend>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <Chip
                  key={status.value}
                  label={status.label}
                  pressed={filters.statuses.includes(status.value)}
                  onToggle={() => onToggleStatus(status.value)}
                />
              ))}
            </div>
          </fieldset>

          <TagChipGroups tags={allTags} selectedIds={filters.tagIds} onToggle={onToggleTag} />
        </div>
      )}
    </section>
  )
}
