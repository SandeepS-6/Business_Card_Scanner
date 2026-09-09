import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className,
}: {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center', className)}>
      {Icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Icon className="size-6 text-muted-foreground" aria-hidden />
        </div>
      ) : null}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {(actionLabel || secondaryLabel) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
          {secondaryLabel && onSecondary ? (
            <Button variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function ErrorState({
  title,
  description,
  onRetry,
  detailsAction,
}: {
  title: string
  description: string
  onRetry?: () => void
  detailsAction?: () => void
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40" role="alert">
      <h3 className="font-display text-base font-semibold text-red-800 dark:text-red-200">{title}</h3>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">{description}</p>
      <div className="mt-4 flex justify-center gap-2">
        {onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
        {detailsAction ? (
          <Button variant="outline" onClick={detailsAction}>
            View details
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function PermissionDenied({ message = 'You do not have permission to perform this action.' }: { message?: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200" role="status">
      {message}
    </div>
  )
}
