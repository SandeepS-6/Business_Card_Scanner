import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  notificationRelativeTime,
  resolveNotificationConfig,
} from '@/lib/notifications/type-config'
import type { NotificationItem } from '@/types'

const LONG_MSG = 72

export function NotificationItemCard({
  item,
  onMarkRead,
  compact,
}: {
  item: NotificationItem
  onMarkRead?: () => void
  compact?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const config = resolveNotificationConfig(item.type, item.title)
  const Icon = config.Icon
  const truncatable = item.message.trim().length > LONG_MSG

  return (
    <article
      className={cn(
        'relative px-1 py-3',
        !item.read && 'bg-muted/30',
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md',
            config.iconWell,
          )}
          aria-hidden
        >
          <Icon className="size-4" strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-5 text-foreground">{item.title}</p>
              <p
                className={cn(
                  'mt-1 text-sm leading-5 text-muted-foreground',
                  !expanded && 'truncate',
                )}
              >
                {item.message}
              </p>
              {truncatable ? (
                <button
                  type="button"
                  className="mt-0.5 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              ) : null}
              <p className="mt-1.5 text-xs text-muted-foreground">
                <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>
                  {notificationRelativeTime(item.createdAt)}
                </time>
                <span aria-hidden> · </span>
                <span>{config.label}</span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 pt-1">
              {!item.read ? (
                <span className="size-2 rounded-full bg-primary" title="Unread" aria-label="Unread" />
              ) : (
                <span className="sr-only">Read</span>
              )}
            </div>
          </div>

          {!item.read && onMarkRead ? (
            <div className="mt-2 flex flex-wrap gap-1">
              <Button size="sm" variant="ghost" className="h-9 px-3 text-xs" onClick={onMarkRead}>
                Mark as read
              </Button>
              {!compact && item.type === 'ticket' ? (
                <Link
                  to="/tickets"
                  className="inline-flex h-9 items-center rounded-md px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Open
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function NotificationSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <ul className="divide-y divide-border" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="animate-pulse py-3">
          <div className="flex gap-3">
            <div className="size-9 rounded-md bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/5 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
