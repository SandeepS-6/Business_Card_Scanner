import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...opts,
  }).format(typeof value === 'string' ? new Date(value) : value)
}

export function formatDateTime(value: string | Date) {
  return formatDate(value, { hour: 'numeric', minute: '2-digit' })
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

/** Card scan quota: unlimited when limit ≤ 0; else green <80%, amber 80–99%, red ≥100%. */
export function cardUsageTone(used: number, limit: number): 'unlimited' | 'success' | 'warning' | 'danger' {
  if (!Number.isFinite(limit) || limit <= 0) return 'unlimited'
  const pct = (used / limit) * 100
  if (pct >= 100) return 'danger'
  if (pct >= 80) return 'warning'
  return 'success'
}
