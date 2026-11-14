/**
 * Pick one random item from a list.
 *
 * If you pass the item you picked last time as `avoid`, we try not to
 * return it again (as long as there's more than one choice), so tapping
 * "Pick another" always feels like it did something.
 *
 * Returns null if the list is empty.
 */
export function pickRandom<T>(items: T[], avoid?: T | null): T | null {
  if (items.length === 0) return null

  const choices = items.length > 1 && avoid ? items.filter((item) => item !== avoid) : items
  return choices[Math.floor(Math.random() * choices.length)]
}
