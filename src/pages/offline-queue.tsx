import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { QueueStatusBadge } from '@/components/shared/status-badges'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useApp } from '@/context/app-context'
import { queueService } from '@/services/api'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { OfflineQueueItem } from '@/types'

export function OfflineQueuePage() {
  const { organization, offline, setOffline } = useApp()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<OfflineQueueItem | null>(null)
  const { data = [] } = useQuery({
    queryKey: ['queue', organization?.id],
    queryFn: () => queueService.list(organization!.id),
    enabled: !!organization,
  })

  return (
    <div>
      <PageHeader
        title="Offline Queue"
        description="Cards captured offline wait here until sync completes."
        actions={
          <div className="flex items-center gap-2">
            <Switch id="offline" checked={offline} onCheckedChange={setOffline} />
            <Label htmlFor="offline">Simulate offline</Label>
          </div>
        }
      />
      {data.length === 0 ? (
        <EmptyState
          title="Queue empty"
          description="Capture a card while offline to see items here."
          actionLabel="Capture Card"
          onAction={() => navigate('/capture')}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => (
            <li key={item.id}>
              <Card
                role="button"
                tabIndex={0}
                className="cursor-pointer overflow-hidden border-border p-0 transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setDetail(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setDetail(item)
                  }
                }}
              >
                <div className="aspect-[16/10] bg-muted">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No preview</div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{item.cardLabel}</p>
                    <QueueStatusBadge status={item.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.eventId ?? 'No event'} · {formatDateTime(item.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">Retries: {item.retryCount}</p>
                  {item.error ? <p className="text-xs text-destructive">{item.error}</p> : null}
                  <div className="flex flex-wrap gap-1 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async (e) => {
                        e.stopPropagation()
                        await queueService.retry(item.id)
                        toast.success('Retrying…')
                        void qc.invalidateQueries({ queryKey: ['queue'] })
                      }}
                    >
                      Retry
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDetail(item)
                      }}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        toast.message('Removed (mock)')
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.cardLabel ?? 'Queue item'}</DialogTitle>
            <DialogDescription>Queued card waiting to sync.</DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="space-y-3">
              {detail.imageUrl ? (
                <img src={detail.imageUrl} alt="" className="max-h-64 w-full rounded-md border border-border object-contain" />
              ) : null}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <QueueStatusBadge status={detail.status} />
                <span className="text-muted-foreground">{formatDateTime(detail.createdAt)}</span>
              </div>
              <p className="text-sm">Event: {detail.eventId ?? '—'}</p>
              <p className="text-sm">Retries: {detail.retryCount}</p>
              {detail.error ? <p className="text-sm text-destructive">{detail.error}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={async () => {
                    await queueService.retry(detail.id)
                    toast.success('Retrying…')
                    void qc.invalidateQueries({ queryKey: ['queue'] })
                    setDetail(null)
                  }}
                >
                  Retry sync
                </Button>
                <Button variant="outline" onClick={() => setDetail(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
