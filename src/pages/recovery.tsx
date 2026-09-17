import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, Pagination, tableActionIconDanger, tableActionIconSuccess } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/context/app-context'
import { usePagedRows } from '@/hooks/use-page-size'
import { recoveryService } from '@/services/features-api'
import { formatDateTime } from '@/lib/utils'
import type { DeletedItem, DeletedItemType } from '@/types/features'
import { toast } from 'sonner'

const TYPES: Array<DeletedItemType | 'all'> = ['all', 'contact', 'lead', 'event', 'template', 'page', 'other']

export function RecoveryPage() {
  const { organization } = useApp()
  const qc = useQueryClient()
  const [type, setType] = useState<(typeof TYPES)[number]>('all')
  const [q, setQ] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [restoreItem, setRestoreItem] = useState<DeletedItem | null>(null)
  const [purgeItem, setPurgeItem] = useState<DeletedItem | null>(null)

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['recovery', organization?.id],
    queryFn: () => recoveryService.list(organization!.id),
    enabled: !!organization,
  })

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (type !== 'all' && d.type !== type) return false
      if (userFilter && !d.deletedBy.toLowerCase().includes(userFilter.toLowerCase())) return false
      const hay = `${d.name} ${d.company ?? ''} ${d.originalLocation}`.toLowerCase()
      return !q.trim() || hay.includes(q.trim().toLowerCase())
    })
  }, [data, type, q, userFilter])

  const { page, setPage, pageSize, paged, total } = usePagedRows(filtered, `${type}|${q}|${userFilter}`)

  const restoreMut = useMutation({
    mutationFn: (id: string) => recoveryService.restore(id),
    onSuccess: () => {
      toast.success('Item restored')
      setRestoreItem(null)
      void qc.invalidateQueries({ queryKey: ['recovery'] })
    },
  })

  const purgeMut = useMutation({
    mutationFn: (id: string) => recoveryService.purge(id),
    onSuccess: () => {
      toast.success('Permanently deleted')
      setPurgeItem(null)
      void qc.invalidateQueries({ queryKey: ['recovery'] })
    },
  })

  return (
    <div>
      <PageHeader
        title="Recently Deleted"
        description="Restore items within the retention window, or delete them permanently. Mock recovery only."
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, company, location…"
          className="max-w-sm"
          aria-label="Search deleted items"
        />
        <Input
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          placeholder="Deleted by…"
          className="max-w-[200px]"
          aria-label="Filter by user"
        />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Type filter">
          {TYPES.map((t) => (
            <Button key={t} size="sm" variant={type === t ? 'default' : 'outline'} onClick={() => setType(t)}>
              {t === 'all' ? 'All' : t}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading deleted items…</p> : null}
      {isError ? (
        <EmptyState title="Could not load recovery list" description="Try again." actionLabel="Retry" onAction={() => void refetch()} />
      ) : null}
      {!isLoading && !isError && total === 0 ? (
        <EmptyState title="Nothing in recently deleted" description="Deleted contacts, leads, and templates appear here for a limited time." />
      ) : null}
      {total > 0 ? (
        <>
          <DataTable columns={['Item', 'Type', 'Deleted', 'Deleted by', 'Location', 'Days left', 'Actions']}>
            {paged.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{item.name}</p>
                  {item.company ? <p className="text-xs text-muted-foreground">{item.company}</p> : null}
                </td>
                <td className="px-4 py-3 capitalize">
                  <Badge variant="secondary">{item.type}</Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(item.deletedAt)}</td>
                <td className="px-4 py-3">{item.deletedBy}</td>
                <td className="px-4 py-3">{item.originalLocation}</td>
                <td className="px-4 py-3">{item.daysRemaining}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className={tableActionIconSuccess}
                      aria-label={`Restore ${item.name}`}
                      title="Restore"
                      onClick={() => setRestoreItem(item)}
                    >
                      <RotateCcw className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={tableActionIconDanger}
                      aria-label={`Permanently delete ${item.name}`}
                      title="Delete permanently"
                      onClick={() => setPurgeItem(item)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </>
      ) : null}

      <ConfirmDialog
        open={!!restoreItem}
        onOpenChange={(v) => !v && setRestoreItem(null)}
        title={restoreItem ? `Restore ${restoreItem.name}?` : 'Restore'}
        description="The item will return to its original location. Related history stays intact in this mock demo."
        confirmLabel="Restore"
        busy={restoreMut.isPending}
        onConfirm={async () => {
          if (restoreItem) await restoreMut.mutateAsync(restoreItem.id)
        }}
      />
      <ConfirmDialog
        open={!!purgeItem}
        onOpenChange={(v) => !v && setPurgeItem(null)}
        title={purgeItem ? `Permanently delete ${purgeItem.name}?` : 'Delete'}
        description="This action cannot be undone. The item will be removed from recovery permanently (mock)."
        confirmLabel="Delete permanently"
        destructive
        busy={purgeMut.isPending}
        onConfirm={async () => {
          if (purgeItem) await purgeMut.mutateAsync(purgeItem.id)
        }}
      />
    </div>
  )
}
