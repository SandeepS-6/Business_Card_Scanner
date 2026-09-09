import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '@/context/app-context'
import { notificationService } from '@/services/api'
import { formatDateTime } from '@/lib/utils'
import { StatusDot } from '@/components/shared/status-badges'

export function NotificationsPage() {
  const { user } = useApp()
  const qc = useQueryClient()
  const { data = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.list(user!.id),
    enabled: !!user,
  })

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="System, lead, OCR, CRM, and team alerts."
        actions={
          <Button
            variant="outline"
            onClick={async () => {
              await notificationService.markAllRead(user!.id)
              void qc.invalidateQueries({ queryKey: ['notifications'] })
            }}
          >
            Mark all as read
          </Button>
        }
      />
      {data.length === 0 ? (
        <EmptyState title="You're all caught up" description="New notifications will appear here." />
      ) : (
        <div className="space-y-2">
          {data.map((n) => (
            <Card key={n.id} className={n.read ? 'opacity-70' : ''}>
              <CardContent className="flex items-start justify-between gap-3 pt-5">
                <div className="flex gap-3">
                  <StatusDot tone={n.priority === 'high' ? 'danger' : n.read ? 'muted' : 'success'} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      <Badge variant="outline" className="capitalize">{n.type.replace('_', ' ')}</Badge>
                      <Badge variant={n.priority === 'high' ? 'danger' : 'muted'}>{n.priority}</Badge>
                      {!n.read ? <Badge variant="secondary">Unread</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!n.read ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await notificationService.markRead(n.id)
                        void qc.invalidateQueries({ queryKey: ['notifications'] })
                      }}
                    >
                      Mark read
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost">Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
