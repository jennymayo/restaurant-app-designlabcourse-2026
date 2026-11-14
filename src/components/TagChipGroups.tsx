import { TAG_GROUPS } from '../data/presetTags'
import type { Tag } from '../types'
import { Chip } from './Chip'

interface TagChipGroupsProps {
  tags: Tag[]
  selectedIds: string[]
  onToggle: (tagId: string) => void
  /** If given, custom tags get a small "x" button so they can be deleted. */
  onRemoveCustom?: (tag: Tag) => void
}

/**
 * Shows all tags as chips, grouped under headings (Occasion, Vibe, ...).
 * Used in two places: the filter panel and the add/edit form.
 */
export function TagChipGroups({ tags, selectedIds, onToggle, onRemoveCustom }: TagChipGroupsProps) {
  return (
    <div className="space-y-4">
      {TAG_GROUPS.map((group) => {
        const groupTags = tags.filter((t) => t.group === group.id)
        if (groupTags.length === 0) return null // e.g. no custom tags yet

        return (
          // <fieldset> + <legend> tells screen readers which chips belong together.
          <fieldset key={group.id}>
            <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-600">
              {group.label}
            </legend>
            <div className="flex flex-wrap gap-2">
              {groupTags.map((tag) => (
                <span key={tag.id} className="inline-flex items-center gap-1">
                  <Chip
                    label={tag.label}
                    pressed={selectedIds.includes(tag.id)}
                    onToggle={() => onToggle(tag.id)}
                  />
                  {onRemoveCustom && tag.group === 'custom' && (
                    <button
                      type="button"
                      onClick={() => onRemoveCustom(tag)}
                      aria-label={`Delete the tag ${tag.label}`}
                      className="flex size-11 items-center justify-center rounded-full text-lg text-stone-600 hover:bg-stone-200"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  )}
                </span>
              ))}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}
