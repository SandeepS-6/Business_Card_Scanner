export function formatInteger(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function formatPercent(n: number) {
  return `${(n * (n <= 1 ? 100 : 1)).toFixed(n % 1 === 0 ? 0 : 1)}%`
}

/** Safe filename segment — never use raw user input unescaped. */
export function sanitizeFilenamePart(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'chart'
}

export function chartFilename(chartId: string, ext: string) {
  const day = new Date().toISOString().slice(0, 10)
  return `businesscardscanner-${sanitizeFilenamePart(chartId)}-${day}.${ext}`
}
