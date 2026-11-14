import { supabase } from '../lib/supabaseClient'
import { localStorageRepository } from './localStorageRepository'
import type { PlacesRepository } from './PlacesRepository'
import { createSupabaseRepository } from './supabaseRepository'

/**
 * THE ONE PLACE that decides where data is stored.
 *
 *  - If Supabase is configured (.env.local has the project address and key),
 *    data is saved in your Supabase database.
 *  - Otherwise it falls back to this browser's localStorage, so the app still
 *    works with no setup.
 *
 * Nothing else in the app knows or cares which one is in use.
 */
export const repository: PlacesRepository = supabase
  ? createSupabaseRepository(supabase)
  : localStorageRepository
