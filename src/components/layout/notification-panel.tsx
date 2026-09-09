import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Inbox, Settings, X } from 'lucide-react'
import { useApp } from '@/context/app-context'
import { notificationService } from '@/services/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NotificationItemCard, NotificationSkeletonList } from '@/components/notifications/notification-item'

type FilterKey = 'all' | 'unread' | 'event' | 'team' | 'billing' | 'ticket' | 'system'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'event', label: 'Events' },
  { key: 'team', label: 'Team' },
  { key: 'billing', label: 'Billing' },
  { key: 'ticket', label: 'Tickets' },
  { key: 'system', label: 'System' },
]

function matchesFilter(type: string, filter: FilterKey) {
  if (filter === 'all' || filter === 'unread') return true
  if (filter === 'event') return type === 'event' || type === 'lead' || type === 'ocr'
  if (filter === 'team') return type === 'team'
  if (filter === 'billing') return type === 'billing'
  if (filter === 'ticket') return type === 'ticket'
  if (filter === 'system') return type === 'system' || type === 'cms' || type === 'sync' || type === 'crm' || type === 'automation' || type === 'recovery'
  return true
}

export function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { user } = useApp()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<FilterKey>('all')

  const { data: items = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.list(user!.id),
    enabled: !!user && open,
  })

  useEffect(() => {
    if (!open) setFilter('all')
  }, [open])

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items])
  const visible = useMemo(() => {
    let list = items
    if (filter === 'unread') list = list.filter((i) => !i.read)
    else if (filter !== 'all') list = list.filter((i) => matchesFilter(i.type, filter))
    return list
  }, [items, filter])

  if (!open || !user) return null

  async function markRead(id: string) {
    await notificationService.markRead(id)
    void qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  async function markAll() {
    await notificationService.markAllRead(user!.id)
    void qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close notifications"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-card shadow-lg sm:max-w-sm md:max-w-md"
      >
        <header className="shrink-0 border-b border-border px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bell className="size-4" aria-hidden />
              </div>
              <div>
                <h2 id="notifications-title" className="font-display text-base font-semibold">
                  Notifications
                </h2>
                <p className="text-xs text-muted-foreground">
                  {unreadCount ? `${unreadCount} unread` : "You're all caught up"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/settings"
                onClick={onClose}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Notification settings"
              >
                <Settings className="size-4" />
              </Link>
              <Button size="icon" variant="ghost" className="size-8" onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5" role="tablist" aria-label="Filter notifications">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center justify-center rounded-md px-3 text-xs font-medium leading-none transition',
                  filter === f.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
                {f.key === 'unread' && unreadCount ? ` (${unreadCount})` : null}
              </button>
            ))}
          </div>

          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-9 gap-1.5 px-3 text-xs"
              disabled={!unreadCount}
              onClick={() => void markAll()}
            >
              <CheckCheck className="size-3.5 shrink-0" />
              Mark all as read
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {isLoading ? <NotificationSkeletonList /> : null}
          {isError ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-4 text-center">
              <p className="text-sm font-medium">Unable to load notifications</p>
              <p className="text-xs text-muted-foreground">Please try again.</p>
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : null}
          {!isLoading && !isError && visible.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Inbox className="size-5" aria-hidden />
              </div>
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground">
                {filter === 'unread' ? 'No unread items right now.' : "You're all caught up."}
              </p>
            </div>
          ) : null}
          {!isLoading && !isError && visible.length > 0 ? (
            <ul className="divide-y divide-border">
              {visible.map((item) => (
                <li key={item.id}>
                  <NotificationItemCard
                    item={item}
                    compact
                    onMarkRead={() => void markRead(item.id)}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </aside>
    </div>
  )
}
