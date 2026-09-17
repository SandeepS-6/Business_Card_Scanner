import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, ExternalLink, Eye } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, Pagination, tableActionIconClass } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/context/app-context'
import { usePagedRows } from '@/hooks/use-page-size'
import { templateService, commService, orgService } from '@/services/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { ErrorState } from '@/components/shared/empty-state'
import type { Communication } from '@/types'

function EmailRowsTable({ rows }: { rows: Communication[] }) {
  const { page, setPage, pageSize, paged, total } = usePagedRows(rows)
  return (
    <>
      <DataTable columns={['Subject', 'Status', 'When']}>
        {paged.map((r) => (
          <tr key={r.id} className="hover:bg-muted/30">
            <td className="px-4 py-3">{r.subject ?? r.body}</td>
            <td className="px-4 py-3">
              <Badge variant="secondary">{r.status}</Badge>
            </td>
            <td className="px-4 py-3">{r.sentAt || r.scheduledAt ? formatDate(r.sentAt || r.scheduledAt!) : '—'}</td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
    </>
  )
}

function WhatsAppRowsTable({ rows }: { rows: Communication[] }) {
  const { page, setPage, pageSize, paged, total } = usePagedRows(rows)
  return (
    <>
      <DataTable columns={['Message', 'Status', 'Error']}>
        {paged.map((r) => (
          <tr key={r.id} className="hover:bg-muted/30">
            <td className="px-4 py-3">{r.body}</td>
            <td className="px-4 py-3">
              <Badge variant={r.status === 'failed' ? 'danger' : 'secondary'}>{r.status}</Badge>
            </td>
            <td className="px-4 py-3">{r.error ?? '—'}</td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
    </>
  )
}

export function EmailCommsPage() {
  const { organization } = useApp()
  const { data = [] } = useQuery({
    queryKey: ['comms', organization?.id],
    queryFn: () => commService.list(organization!.id),
    enabled: !!organization,
  })
  const emails = data.filter((c) => c.channel === 'email')
  const groups = {
    sent: emails.filter((e) => e.status === 'sent'),
    scheduled: emails.filter((e) => e.status === 'scheduled'),
    drafts: emails.filter((e) => e.status === 'draft'),
    failed: emails.filter((e) => e.status === 'failed'),
  }

  return (
    <div>
      <PageHeader title="Email" description="Sent, scheduled, drafts, and failed messages." />
      <Tabs defaultValue="sent">
        <TabsList>
          {Object.keys(groups).map((k) => (
            <TabsTrigger key={k} value={k} className="capitalize">
              {k}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(groups).map(([k, rows]) => (
          <TabsContent key={k} value={k}>
            {rows.length === 0 ? (
              <EmptyState title={`No ${k} emails`} description="Compose from a contact or template." />
            ) : k === 'failed' ? (
              <div className="space-y-3">
                {rows.map((r) => (
                  <ErrorState
                    key={r.id}
                    title="Email failed"
                    description={r.error ?? r.subject ?? 'Unknown error'}
                    onRetry={() => toast.message('Retry queued')}
                    detailsAction={() => toast.message(r.error ?? 'No details')}
                  />
                ))}
              </div>
            ) : (
              <EmailRowsTable rows={rows} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export function WhatsAppCommsPage() {
  const { organization } = useApp()
  const { data = [] } = useQuery({
    queryKey: ['comms-wa', organization?.id],
    queryFn: () => commService.list(organization!.id),
    enabled: !!organization,
  })
  const rows = data.filter((c) => c.channel === 'whatsapp')
  const groups = {
    sent: rows.filter((e) => e.status === 'sent'),
    scheduled: rows.filter((e) => e.status === 'scheduled'),
    failed: rows.filter((e) => e.status === 'failed'),
  }

  return (
    <div>
      <PageHeader title="WhatsApp" description="Outbound WhatsApp activity (mock)." />
      <Tabs defaultValue="sent">
        <TabsList>
          {Object.keys(groups).map((k) => (
            <TabsTrigger key={k} value={k} className="capitalize">
              {k}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(groups).map(([k, list]) => (
          <TabsContent key={k} value={k}>
            {list.length === 0 ? (
              <EmptyState title={`No ${k} messages`} description="Send from a contact profile." />
            ) : (
              <WhatsAppRowsTable rows={list} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export function TemplatesPage({ globalOnly = false }: { globalOnly?: boolean }) {
  const { organization } = useApp()
  const orgId = globalOnly ? null : organization?.id ?? null
  const { data = [] } = useQuery({
    queryKey: ['templates', orgId, globalOnly],
    queryFn: () => (globalOnly ? templateService.listAll() : templateService.list(orgId, true)),
  })
  const { data: orgs = [] } = useQuery({
    queryKey: ['orgs'],
    queryFn: () => orgService.list(),
    enabled: globalOnly,
  })
  const list = data
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'whatsapp'>('all')

  const orgLabel = (id: string | null) => {
    if (!id) return 'All organizations'
    return orgs.find((o) => o.id === id)?.name ?? id
  }

  const filtered = useMemo(
    () => list.filter((t) => channelFilter === 'all' || t.channel === channelFilter),
    [list, channelFilter],
  )
  const { page, setPage, pageSize, paged, total } = usePagedRows(filtered, channelFilter)

  return (
    <div>
      <PageHeader
        title={globalOnly ? 'Global Templates' : 'Templates'}
        description={
          globalOnly
            ? 'Platform and organization templates with ownership.'
            : 'Email and WhatsApp templates for your organization.'
        }
        actions={
          <Button onClick={() => window.open('http://localhost:5174/email-templates', '_blank', 'noopener,noreferrer')}>
            Open CMS
          </Button>
        }
      />
      <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Template editing now lives in the separate `cms` React app so the operational UI stays focused.
      </div>
      <div className="mb-4 flex gap-2">
        {(['all', 'email', 'whatsapp'] as const).map((c) => (
          <Button
            key={c}
            size="sm"
            variant={channelFilter === c ? 'default' : 'outline'}
            onClick={() => setChannelFilter(c)}
            className="capitalize"
          >
            {c}
          </Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          title="No templates"
          description="Create your first template in the dedicated CMS app."
          actionLabel="Open CMS"
          onAction={() => window.open('http://localhost:5174/email-templates', '_blank', 'noopener,noreferrer')}
        />
      ) : (
        <>
          <DataTable
            columns={
              globalOnly
                ? ['Template', 'Organization', 'Channel', 'Category', 'Type', 'Status', 'Language', 'Last modified', 'Actions']
                : ['Name', 'Channel', 'Category', 'Type', 'Status', 'Language', 'Last modified', 'Actions']
            }
          >
            {paged.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                {globalOnly ? <td className="px-4 py-3">{orgLabel(t.orgId)}</td> : null}
                <td className="px-4 py-3 capitalize">{t.channel}</td>
                <td className="px-4 py-3">{t.category}</td>
                <td className="px-4 py-3">
                  <Badge variant={t.kind === 'global' ? 'default' : 'secondary'}>{t.kind}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={t.status === 'pending_approval' ? 'warning' : 'secondary'}>
                    {t.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-4 py-3">{t.language ?? '—'}</td>
                <td className="px-4 py-3">{formatDate(t.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className={tableActionIconClass}
                      aria-label={`Edit ${t.name} in CMS`}
                      title="Edit in CMS"
                      onClick={() =>
                        window.open(
                          t.channel === 'whatsapp'
                            ? 'http://localhost:5174/whatsapp-templates'
                            : 'http://localhost:5174/email-templates',
                          '_blank',
                          'noopener,noreferrer',
                        )
                      }
                    >
                      <ExternalLink className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={tableActionIconClass}
                      aria-label={`Duplicate ${t.name}`}
                      title="Duplicate"
                      onClick={() => toast.message('Duplicated (mock)')}
                    >
                      <Copy className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={tableActionIconClass}
                      aria-label={`Preview ${t.name}`}
                      title="Preview"
                      onClick={() => toast.message(`Preview ${t.name} in CMS`)}
                    >
                      <Eye className="size-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </>
      )}
    </div>
  )
}
