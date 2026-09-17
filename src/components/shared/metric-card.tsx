import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  /** Percent change; positive = green, negative = red, omit to hide trend. */
  change?: number
  comparison?: string
  className?: string
}

/** Nested KPI card: muted shell + white value panel. Radius matches Card (`rounded-lg`). */
export function MetricCard({
  label,
  value,
  icon: Icon,
  change,
  comparison = 'vs last 30 days',
  className,
}: MetricCardProps) {
  const up = change != null && change >= 0
  return (
    <div className={cn('rounded-lg border border-border bg-muted/50 p-3', className)}>
      <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-sm ring-1 ring-border"
            aria-hidden
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
        ) : null}
      </div>
      <div className="rounded-lg bg-card p-4 shadow-sm ring-1 ring-border/70">
        <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {value ?? '—'}
        </p>
        {change != null ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold',
                up
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
              )}
            >
              {up ? '+' : ''}
              {change}%
            </span>
            <span className="text-xs text-muted-foreground">{comparison}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
