/**
 * Clean up a link the user typed or pasted.
 *
 *  - Adds "https://" if it's missing (people often paste "instagram.com/...").
 *  - Only allows http and https links. This blocks sneaky links like
 *    "javascript:..." that could run code when clicked.
 *
 * Returns the cleaned link, or null if it isn't a usable web link.
 */
export function normalizeUrl(input: string): string | null {
  const text = input.trim()
  if (!text) return null

  // If there's no "something://" at the start, assume https.
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`

  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    // A real web address has a dot in it (instagram.com), or is localhost.
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null
    return url.toString()
  } catch {
    return null
  }
}
