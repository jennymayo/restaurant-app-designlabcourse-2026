import { useCallback, useState } from 'react'
import { EMPTY_FILTERS } from '../lib/filtering'
import type { Filters, Price, Status } from '../types'

/** Add the value to the list if it's missing, remove it if it's there. */
function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

/**
 * useFilters: holds what's currently selected in the search box and chips.
 * Because it's React state, the results list re-renders instantly on every change.
 */
export function useFilters() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const setSearch = useCallback((search: string) => {
    setFilters((f) => ({ ...f, search }))
  }, [])

  const togglePrice = useCallback((price: Price) => {
    setFilters((f) => ({ ...f, prices: toggleInList(f.prices, price) }))
  }, [])

  const toggleStatus = useCallback((status: Status) => {
    setFilters((f) => ({ ...f, statuses: toggleInList(f.statuses, status) }))
  }, [])

  const toggleTag = useCallback((tagId: string) => {
    setFilters((f) => ({ ...f, tagIds: toggleInList(f.tagIds, tagId) }))
  }, [])

  /** The one-tap "Clear all". */
  const clearAll = useCallback(() => setFilters(EMPTY_FILTERS), [])

  return { filters, setSearch, togglePrice, toggleStatus, toggleTag, clearAll }
}
