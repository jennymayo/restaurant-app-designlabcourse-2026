import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { downloadBackup, parseBackup } from '../lib/exportImport'
import type { BackupData } from '../types'

interface BackupPanelProps {
  places: BackupData['places']
  customTags: BackupData['customTags']
  sampleCount: number
  onImport: (data: BackupData) => Promise<boolean | undefined>
  onClearSamples: () => void
}

/** Content of the "Backup & data" popup: export, import, and clear sample data. */
export function BackupPanel({ places, customTags, sampleCount, onImport, onClearSamples }: BackupPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  function handleExport() {
    downloadBackup({ version: 1, places, customTags })
    setMessage({ kind: 'ok', text: 'Backup downloaded. Check your Downloads folder.' })
  }

  async function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow choosing the same file again later
    if (!file) return

    try {
      const data = parseBackup(await file.text())

      // Importing replaces everything, so ask first.
      const ok = window.confirm(
        `Replace your current ${places.length} place(s) with the ${data.places.length} place(s) in this file? This can't be undone.`,
      )
      if (!ok) return

      const saved = await onImport(data)
      setMessage(
        saved
          ? { kind: 'ok', text: `Imported ${data.places.length} place(s).` }
          : { kind: 'error', text: 'The import could not be saved.' },
      )
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Import failed.' })
    }
  }

  const buttonClass = 'min-h-12 w-full rounded-full border-2 border-stone-300 px-6 text-base font-semibold hover:bg-stone-100'

  return (
    <div className="space-y-5">
      <p className="text-stone-700">
        Your places are saved in this browser only. Download a backup file to keep a copy or move to another device.
      </p>

      <div className="space-y-3">
        <button type="button" onClick={handleExport} className={buttonClass}>
          Export backup (download)
        </button>

        {/* The real file picker is hidden; the button above/below opens it. */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChosen}
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose a backup file to import"
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} className={buttonClass}>
          Import backup (replaces everything)
        </button>

        {sampleCount > 0 && (
          <button
            type="button"
            onClick={onClearSamples}
            className="min-h-12 w-full rounded-full border-2 border-red-300 px-6 text-base font-semibold text-red-800 hover:bg-red-50"
          >
            Clear sample data ({sampleCount})
          </button>
        )}
      </div>

      {message && (
        <p
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={`rounded-2xl p-3 font-medium ${
            message.kind === 'error' ? 'bg-red-50 text-red-900' : 'bg-emerald-50 text-emerald-900'
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
