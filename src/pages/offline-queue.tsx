import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { QueueStatusBadge } from '@/components/shared/status-badges'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/input'
import { useApp } from '@/context/app-context'
import { queueService } from '@/services/api'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

export function OfflineQueuePage() {
  const { organization, offline, setOffline } = useApp()
  const qc = useQueryClient()
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
        <EmptyState title="Queue empty" description="Capture a card while offline to see items here." actionLabel="Capture Card" onAction={() => (window.location.href = '/capture')} />
      ) : (
        <DataTable columns={['Card', 'Event', 'Created', 'Status', 'Retry count', 'Error', 'Actions']}>
          {data.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-10 w-16 rounded object-cover" /> : null}
                  {item.cardLabel}
                </div>
              </td>
              <td className="px-4 py-3">{item.eventId ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(item.createdAt)}</td>
              <td className="px-4 py-3"><QueueStatusBadge status={item.status} /></td>
              <td className="px-4 py-3">{item.retryCount}</td>
              <td className="px-4 py-3 text-destructive">{item.error ?? '—'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await queueService.retry(item.id)
                      toast.success('Retrying…')
                      void qc.invalidateQueries({ queryKey: ['queue'] })
                    }}
                  >
                    Retry
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toast.message('Open review')}>View</Button>
                  <Button size="sm" variant="ghost" onClick={() => toast.message('Removed (mock)')}>Remove</Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
