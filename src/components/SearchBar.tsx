import { useId } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

/** The text search box. Results update on every keystroke. */
export function SearchBar({ value, onChange }: SearchBarProps) {
  const id = useId()
  return (
    <div>
      {/* The label is visually hidden (sr-only) but still read by screen readers. */}
      <label htmlFor={id} className="sr-only">
        Search places, notes, and tags
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search name, note, or tag…"
        autoComplete="off"
        className="min-h-12 w-full rounded-2xl border-2 border-stone-300 bg-white px-4 text-base placeholder:text-stone-500"
      />
    </div>
  )
}
