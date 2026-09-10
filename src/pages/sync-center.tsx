import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useApp } from '@/context/app-context'
import { syncCenterService } from '@/services/features-api'
import { formatDateTime } from '@/lib/utils'
import type { SyncConflict, SyncRecord } from '@/types/features'
import { toast } from 'sonner'

function syncTone(status: SyncRecord['status']) {
  if (status === 'synced') return { label: 'Synced', variant: 'success' as const }
  if (status === 'pending') return { label: 'Syncing', variant: 'warning' as const }
  if (status === 'processing') return { label: 'Processing', variant: 'secondary' as const }
  if (status === 'failed') return { label: 'Failed', variant: 'danger' as const }
  if (status === 'offline') return { label: 'Offline', variant: 'muted' as const }
  return { label: 'Retrying', variant: 'warning' as const }
}

export function SyncCenterPage() {
  const { organization } = useApp()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [conflict, setConflict] = useState<SyncConflict | null>(null)
  const [compare, setCompare] = useState(false)

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['sync-records', organization?.id],
    queryFn: () => syncCenterService.list(organization!.id),
    enabled: !!organization,
  })

  const { data: conflicts = [] } = useQuery({
    queryKey: ['sync-conflicts', organization?.id],
    queryFn: () => syncCenterService.conflicts(organization!.id),
    enabled: !!organization,
  })

  const counts = useMemo(() => {
    const c = { total: records.length, synced: 0, pending: 0, processing: 0, failed: 0, retrying: 0 }
    for (const r of records) {
      if (r.status in c) (c as Record<string, number>)[r.status]++
    }
    return c
  }, [records])

  const resolve = useMutation({
    mutationFn: ({ id, choice }: { id: string; choice: 'mine' | 'server' }) =>
      syncCenterService.resolveConflict(id, choice),
    onSuccess: () => {
      toast.success('Conflict resolved (mock)')
      setConflict(null)
      setCompare(false)
      void qc.invalidateQueries({ queryKey: ['sync-conflicts'] })
    },
  })

  return (
    <div>
      <PageHeader
        title="Sync Center"
        description="Real-time sync visibility across offline queue and CRM. Mock workflow only."
        actions={
          <Button variant="outline" onClick={() => navigate('/offline-queue')}>
            Offline queue
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ['Total', counts.total],
          ['Synced', counts.synced],
          ['Pending', counts.pending],
          ['Processing', counts.processing],
          ['Failed', counts.failed],
          ['Retrying', counts.retrying],
        ].map(([label, value]) => (
          <Card key={label as string} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
          </Card>
        ))}
      </div>

      {conflicts.length ? (
        <Card className="mb-6 p-4">
          <h2 className="mb-3 font-display text-base font-semibold">Conflicts</h2>
          <ul className="space-y-2">
            {conflicts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p>
                  {c.resource} · {c.field} updated by {c.updatedBy}
                </p>
                <Button size="sm" onClick={() => setConflict(c)}>
                  Resolve
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {isLoading ? <p className="text-sm text-muted-foreground">Loading queue…</p> : null}
      {!isLoading && records.length === 0 ? (
        <EmptyState title="Nothing to sync" description="Pending uploads and CRM pushes appear here." />
      ) : (
        <DataTable columns={['Item', 'Created', 'Status', 'Retries', 'Error', 'Actions']}>
          {records.map((r) => {
            const tone = syncTone(r.status)
            return (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.label}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <Badge variant={tone.variant}>{tone.label}</Badge>
                </td>
                <td className="px-4 py-3">{r.retryCount}</td>
                <td className="px-4 py-3 text-destructive">{r.error ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await syncCenterService.retry(r.id)
                        toast.success('Retrying…')
                        void qc.invalidateQueries({ queryKey: ['sync-records'] })
                      }}
                    >
                      Retry
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toast.message(r.label)}>
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await syncCenterService.remove(r.id)
                        toast.success('Removed')
                        void qc.invalidateQueries({ queryKey: ['sync-records'] })
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </DataTable>
      )}

      <ConfirmDialog
        open={!!conflict && !compare}
        onOpenChange={(v) => !v && setConflict(null)}
        title={conflict ? `Contact updated by ${conflict.updatedBy}` : 'Conflict'}
        description={
          conflict
            ? `Your version: ${conflict.field} ${conflict.mine}. Server version: ${conflict.field} ${conflict.server}.`
            : ''
        }
        confirmLabel="Keep Mine"
        cancelLabel="Keep Latest"
        onConfirm={async () => {
          if (conflict) await resolve.mutateAsync({ id: conflict.id, choice: 'mine' })
        }}
      />
      {conflict ? (
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="link" onClick={() => setCompare(true)}>
            Compare versions
          </Button>
          {compare ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await resolve.mutateAsync({ id: conflict.id, choice: 'server' })
              }}
            >
              Keep Latest
            </Button>
          ) : null}
        </div>
      ) : null}

      {compare && conflict ? (
        <Card className="mt-4 grid gap-3 p-4 sm:grid-cols-2">
          <div>
            <p className="font-medium">Yours</p>
            <p className="text-sm">
              {conflict.field}: {conflict.mine}
            </p>
          </div>
          <div>
            <p className="font-medium">Server</p>
            <p className="text-sm">
              {conflict.field}: {conflict.server}
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
