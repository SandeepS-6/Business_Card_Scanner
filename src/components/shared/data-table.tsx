import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortDir = 'asc' | 'desc'

/** Icon-only row actions. Light fill by default; hover goes to the action color. */
export const tableActionIconClass =
  'inline-flex size-8 items-center justify-center rounded-md bg-muted/50 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'

export const tableActionIconSuccess =
  'inline-flex size-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 transition hover:bg-emerald-600 hover:text-white dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'

export const tableActionIconDanger =
  'inline-flex size-8 items-center justify-center rounded-md bg-red-100 text-red-700 transition hover:bg-destructive hover:text-white dark:bg-red-950 dark:text-red-300 dark:hover:bg-destructive dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'

export function DataTable({
  columns,
  children,
  className,
}: {
  columns: ReactNode[]
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('scrollbar-none overflow-x-auto rounded-lg border border-border bg-card', className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-primary bg-primary">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 font-medium text-primary-foreground">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  )
}

/** Sortable column header — cycle none → asc → desc → none. */
export function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: SortDir | null
  onClick: () => void
}) {
  const Icon = !active || !dir ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-medium text-primary-foreground/90 hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
      onClick={onClick}
      aria-label={`Sort by ${label}${active && dir ? `, ${dir === 'asc' ? 'ascending' : 'descending'}` : ''}`}
    >
      {label}
      <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
    </button>
  )
}

export function compareText(a: string, b: string, dir: SortDir) {
  const r = a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
  return dir === 'asc' ? r : -r
}

export function compareNumber(a: number, b: number, dir: SortDir) {
  const av = Number.isFinite(a) ? a : Number.NEGATIVE_INFINITY
  const bv = Number.isFinite(b) ? b : Number.NEGATIVE_INFINITY
  return dir === 'asc' ? av - bv : bv - av
}

export function compareDate(a: string | undefined | null, b: string | undefined | null, dir: SortDir) {
  const at = a ? new Date(a).getTime() : 0
  const bt = b ? new Date(b).getTime() : 0
  return dir === 'asc' ? at - bt : bt - at
}

/** Semantic Lead Intent: high > medium > low */
export function compareLeadIntent(a: string, b: string, dir: SortDir) {
  const rank: Record<string, number> = { high: 3, medium: 2, low: 1 }
  return compareNumber(rank[a] ?? 0, rank[b] ?? 0, dir)
}

/** Semantic lead status pipeline order */
export function compareLeadStatus(a: string, b: string, dir: SortDir) {
  const rank: Record<string, number> = {
    new: 1,
    contacted: 2,
    interested: 3,
    qualified: 4,
    converted: 5,
    lost: 6,
  }
  return compareNumber(rank[a] ?? 0, rank[b] ?? 0, dir)
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="h-9 rounded-md border border-border px-3 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="h-9 rounded-md border border-border px-3 disabled:opacity-50"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
