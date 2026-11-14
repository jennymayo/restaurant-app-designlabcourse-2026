/**
 * Make a new unique id (a UUID, like 3f2b8c1e-...).
 *
 * `crypto.randomUUID()` is the simplest way, but browsers only allow it on
 * secure pages (https or localhost). When you test on your phone over your
 * local network (http://192.168...), it isn't available. In that case we
 * build the same kind of id from random bytes, which works everywhere.
 */
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  // These two lines mark the id as a "version 4" UUID, as the standard requires.
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}
