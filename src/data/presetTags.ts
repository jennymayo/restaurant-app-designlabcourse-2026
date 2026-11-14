import type { Tag, TagGroup } from '../types'

/**
 * The built-in tags, organised in groups.
 * Preset tags live in code (not in storage). Only custom tags are stored.
 */

// The groups in the order we show them, with their headings.
export const TAG_GROUPS: { id: TagGroup; label: string }[] = [
  { id: 'occasion', label: 'Occasion' },
  { id: 'vibe', label: 'Vibe' },
  { id: 'goodFor', label: 'Good for' },
  { id: 'dietary', label: 'Dietary' },
  { id: 'custom', label: 'My tags' },
]

// Small helper so we don't repeat ourselves: 'vibe' + 'cozy' → { id: 'vibe-cozy', ... }
function makeTags(group: TagGroup, labels: string[]): Tag[] {
  return labels.map((label) => ({
    id: `${group}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    label,
    group,
  }))
}

export const PRESET_TAGS: Tag[] = [
  ...makeTags('occasion', ['date night', 'friends outing', 'birthday', 'solo', 'business lunch']),
  ...makeTags('vibe', ['cozy', 'lively', 'quiet', 'trendy', 'hole-in-the-wall']),
  ...makeTags('goodFor', ['reading or working', 'brunch', 'late night', 'dessert']),
  ...makeTags('dietary', ['vegetarian-friendly', 'vegan-friendly', 'gluten-free options']),
]

/**
 * Look up a preset tag id by its label. Used by the sample data so we can
 * write readable names ('cozy') instead of ids ('vibe-cozy').
 */
export function presetId(label: string): string {
  const tag = PRESET_TAGS.find((t) => t.label === label)
  if (!tag) throw new Error(`Unknown preset tag: ${label}`)
  return tag.id
}
