interface ChipProps {
  label: string
  /** Is this chip currently selected? */
  pressed: boolean
  onToggle: () => void
}

/**
 * A big, tappable on/off button used for every filter and tag choice.
 *
 * - `aria-pressed` tells screen readers whether it's on.
 * - Selected chips are a solid dark-orange color AND show a check mark, so you
 *   never have to rely on color alone to tell which are active.
 * - `min-h-11` = 44px tall, the recommended minimum size for a finger tap.
 */
export function Chip({ label, pressed, onToggle }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={
        'inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-base font-medium transition-colors ' +
        (pressed
          ? 'border-orange-700 bg-orange-700 text-white hover:bg-orange-800'
          : 'border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-100')
      }
    >
      {pressed && <span aria-hidden="true">✓</span>}
      {label}
    </button>
  )
}
