const BLOCKED = /^(javascript|vbscript|data):/i

/** Returns a safe http(s)/mailto/tel URL or null. */
export function sanitizeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const value = raw.trim()
  if (BLOCKED.test(value)) return null
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://app.invalid'
    const url = new URL(value, base)
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return null
    return url.href
  } catch {
    return null
  }
}

export function isSafeExternalUrl(raw: string | null | undefined): boolean {
  return sanitizeExternalUrl(raw) !== null
}
