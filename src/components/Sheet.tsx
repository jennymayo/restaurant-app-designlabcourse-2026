import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface SheetProps {
  title: string
  /** Called when the user closes the sheet (Close button, Escape key, or tapping outside). */
  onClose: () => void
  children: ReactNode
}

/**
 * A popup panel: slides up from the bottom on phones, centered on larger screens.
 *
 * It's built on the browser's native <dialog> element, which gives us important
 * accessibility features for free:
 *   - keyboard focus stays inside the popup while it's open
 *   - the Escape key closes it
 *   - the page behind it can't be clicked
 *
 * Usage: render <Sheet> only while it should be visible. When it's not rendered,
 * it's closed. (That also resets any form inside it.)
 */
export function Sheet({ title, onClose, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    // Remember what had focus so we can give it back when the sheet closes.
    const previouslyFocused = document.activeElement as HTMLElement | null

    if (!dialog.open) dialog.showModal()

    // Move the cursor to the first field that asked for it (the name field in the form).
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()

    // Stop the page behind from scrolling while the sheet is open.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // 'close' fires when Escape is pressed.
      onClose={onClose}
      // Tapping the dark backdrop (outside the white panel) closes the sheet.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      className="mx-auto mt-auto mb-0 w-full max-w-lg overflow-hidden rounded-t-3xl bg-white p-0 text-stone-900 shadow-xl backdrop:bg-black/50 sm:my-auto sm:rounded-3xl"
    >
      <div className="flex max-h-[92dvh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
          <h2 id={titleId} className="text-xl font-bold leading-tight break-words">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 shrink-0 rounded-full border-2 border-stone-300 px-4 text-base font-medium hover:bg-stone-100"
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </dialog>
  )
}
