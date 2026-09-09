import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { NotificationItemCard, NotificationSkeletonList } from '@/components/notifications/notification-item'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/app-context'
import { notificationService } from '@/services/api'
import { cn } from '@/lib/utils'

export function NotificationsPage() {
  const { user } = useApp()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.list(user!.id),
    enabled: !!user,
  })

  const visible = useMemo(
    () => (filter === 'unread' ? data.filter((n) => !n.read) : data),
    [data, filter],
  )

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="System, lead, OCR, CRM, and team alerts."
        actions={
          <Button
            variant="outline"
            disabled={!data.some((n) => !n.read)}
            onClick={async () => {
              await notificationService.markAllRead(user!.id)
              void qc.invalidateQueries({ queryKey: ['notifications'] })
            }}
          >
            Mark all as read
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-1.5">
        {(['all', 'unread'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'inline-flex h-9 items-center justify-center rounded-md px-3 text-xs font-medium capitalize leading-none',
              filter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {isLoading ? <NotificationSkeletonList count={5} /> : null}
      {isError ? (
        <EmptyState title="Unable to load notifications" description="Please try again." actionLabel="Try again" onAction={() => void refetch()} />
      ) : null}
      {!isLoading && !isError && visible.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : null}
      {!isLoading && !isError && visible.length > 0 ? (
        <ul className="mx-auto max-w-2xl divide-y divide-border rounded-lg border border-border bg-card px-3">
          {visible.map((n) => (
            <li key={n.id}>
              <NotificationItemCard
                item={n}
                onMarkRead={async () => {
                  await notificationService.markRead(n.id)
                  void qc.invalidateQueries({ queryKey: ['notifications'] })
                }}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
