import type { BackupData, Place, PlaceInput, Tag } from '../types'

/**
 * PlacesRepository: the "contract" for saving and loading data.
 *
 * The rest of the app (hooks and components) ONLY talks to this interface.
 * It doesn't know or care WHERE the data is stored. Today it's the browser's
 * localStorage (see localStorageRepository.ts). Later you can write a
 * SupabaseRepository that follows the same contract, change one line in
 * `repository/index.ts`, and nothing else in the app needs to change.
 *
 * Every method returns a Promise (it's "async") because talking to a real
 * database takes time. Using async from day one means the UI is already
 * ready for that.
 */
export interface PlacesRepository {
  /** All places, newest first. */
  listPlaces(): Promise<Place[]>
  createPlace(input: PlaceInput): Promise<Place>
  updatePlace(id: string, input: PlaceInput): Promise<Place>
  deletePlace(id: string): Promise<void>

  /** Tags the user created herself (the preset tags live in code). */
  listCustomTags(): Promise<Tag[]>
  createCustomTag(label: string): Promise<Tag>
  /** Also removes the tag from any place that used it. */
  deleteCustomTag(id: string): Promise<void>

  /** Used by import: throw away everything and store this instead. */
  replaceAll(data: BackupData): Promise<void>
  /** Remove only the demo places (isSample === true). */
  deleteSamples(): Promise<void>
}
