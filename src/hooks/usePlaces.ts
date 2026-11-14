import { useCallback, useEffect, useMemo, useState } from 'react'
import { PRESET_TAGS } from '../data/presetTags'
import { repository } from '../repository'
import type { BackupData, Place, PlaceInput, Tag } from '../types'

/**
 * usePlaces: a "custom hook" that owns the app's data.
 *
 * A hook is a function whose name starts with "use" and that can use React
 * features like state. This one:
 *   1. Loads places and custom tags from the repository when the app starts.
 *   2. Keeps them in React state, so the screen updates when they change.
 *   3. Gives components simple functions: addPlace, editPlace, removePlace, ...
 *
 * Components never touch storage directly. They only use this hook.
 */
export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([])
  const [customTags, setCustomTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load once, when the app first appears.
  useEffect(() => {
    let cancelled = false // ignore the result if the component went away
    async function load() {
      try {
        const [loadedPlaces, loadedTags] = await Promise.all([
          repository.listPlaces(),
          repository.listCustomTags(),
        ])
        if (cancelled) return
        setPlaces(loadedPlaces)
        setCustomTags(loadedTags)
      } catch (loadError) {
        console.error(loadError)
        // Show the real reason when we have one (e.g. "turn on anonymous sign-ins").
        const reason = loadError instanceof Error ? ` ${loadError.message}` : ''
        if (!cancelled) setError(`Sorry, your saved places could not be loaded.${reason}`)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * Run a save action and show a friendly message if it fails.
   * Returns the action's result, or undefined if it failed.
   */
  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    try {
      setError(null)
      return await action()
    } catch {
      setError('Sorry, that change could not be saved. Please try again.')
      return undefined
    }
  }, [])

  // Every tag the user can pick: presets first, then her own.
  const allTags = useMemo(() => [...PRESET_TAGS, ...customTags], [customTags])

  // ----- Actions -----

  const addPlace = useCallback(
    (input: PlaceInput) =>
      run(async () => {
        const created = await repository.createPlace(input)
        setPlaces((current) => [created, ...current])
        return created
      }),
    [run],
  )

  const editPlace = useCallback(
    (id: string, input: PlaceInput) =>
      run(async () => {
        const updated = await repository.updatePlace(id, input)
        setPlaces((current) => current.map((p) => (p.id === id ? updated : p)))
        return updated
      }),
    [run],
  )

  const removePlace = useCallback(
    (id: string) =>
      run(async () => {
        await repository.deletePlace(id)
        setPlaces((current) => current.filter((p) => p.id !== id))
      }),
    [run],
  )

  const addCustomTag = useCallback(
    (label: string) =>
      run(async () => {
        const created = await repository.createCustomTag(label)
        setCustomTags((current) => [...current, created])
        return created
      }),
    [run],
  )

  const removeCustomTag = useCallback(
    (id: string) =>
      run(async () => {
        await repository.deleteCustomTag(id)
        setCustomTags((current) => current.filter((t) => t.id !== id))
        // Mirror what the repository did: take the tag off every place.
        setPlaces((current) => current.map((p) => ({ ...p, tagIds: p.tagIds.filter((t) => t !== id) })))
      }),
    [run],
  )

  const clearSamples = useCallback(
    () =>
      run(async () => {
        await repository.deleteSamples()
        setPlaces((current) => current.filter((p) => !p.isSample))
      }),
    [run],
  )

  /** Replace everything with the contents of an imported backup. */
  const importData = useCallback(
    (data: BackupData) =>
      run(async () => {
        await repository.replaceAll(data)
        // Re-read from the repository so the screen matches what was really saved.
        setPlaces(await repository.listPlaces())
        setCustomTags(await repository.listCustomTags())
        return true
      }),
    [run],
  )

  return {
    places,
    customTags,
    allTags,
    isLoading,
    error,
    addPlace,
    editPlace,
    removePlace,
    addCustomTag,
    removeCustomTag,
    clearSamples,
    importData,
  }
}
