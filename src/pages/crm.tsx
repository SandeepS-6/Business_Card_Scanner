import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { SyncStatusBadge } from '@/components/shared/status-badges'
import { ErrorState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApp } from '@/context/app-context'
import { crmService } from '@/services/api'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

const LABELS: Record<string, string> = {
  hubspot: 'HubSpot',
  salesforce: 'Salesforce',
  zoho: 'Zoho CRM',
  rest: 'Generic REST API',
}

export function CrmIntegrationsPage() {
  const { organization } = useApp()
  const { data = [] } = useQuery({
    queryKey: ['crm', organization?.id],
    queryFn: () => crmService.integrations(organization!.id),
    enabled: !!organization,
  })

  return (
    <div>
      <PageHeader
        title="CRM Integrations"
        description="BusinessCardScanner remains the source of truth. CRM is an external sync layer."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>{LABELS[item.provider]}</CardTitle>
                  <CardDescription>
                    {item.connected ? `Last sync ${item.lastSync ? formatDateTime(item.lastSync) : '—'}` : 'Not connected'}
                  </CardDescription>
                </div>
                <Badge variant={item.connected ? 'success' : 'muted'}>{item.connected ? 'Connected' : 'Not Connected'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{item.recordsSynced} records synced</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toast.message('Configure (mock)')}>Configure</Button>
                {item.connected ? (
                  <Button size="sm" variant="destructive" onClick={() => toast.message('Disconnected (mock)')}>Disconnect</Button>
                ) : (
                  // SECURITY: CRM credentials must never be collected in the frontend. Backend required.
                  <Button size="sm" onClick={() => toast.success('Connected (mock)')}>Connect</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function CrmSyncPage() {
  const { organization } = useApp()
  const qc = useQueryClient()
  const { data = [] } = useQuery({
    queryKey: ['crm-sync', organization?.id],
    queryFn: () => crmService.syncStatus(organization!.id),
    enabled: !!organization,
  })

  return (
    <div>
      <PageHeader title="CRM Sync Status" description="Track outbound synchronization jobs." />
      {data.some((d) => d.status === 'failed') ? (
        <div className="mb-4">
          <ErrorState title="CRM sync failed." description="One or more records could not sync." onRetry={() => toast.message('Retry all')} detailsAction={() => toast.message('Open failed items')} />
        </div>
      ) : null}
      <DataTable columns={['Provider', 'Resource', 'Status', 'Updated', 'Actions']}>
        {data.map((row) => (
          <tr key={row.id}>
            <td className="px-4 py-3">{row.provider}</td>
            <td className="px-4 py-3">{row.resource}</td>
            <td className="px-4 py-3"><SyncStatusBadge status={row.status} /></td>
            <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(row.updatedAt)}</td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                {(row.status === 'failed' || row.status === 'retrying') && (
                  <Button size="sm" variant="outline" onClick={() => { toast.success('Retry queued'); void qc.invalidateQueries({ queryKey: ['crm-sync'] }) }}>Retry</Button>
                )}
                {row.error ? <Button size="sm" variant="ghost" onClick={() => toast.message(row.error!)}>View error</Button> : null}
                <Button size="sm" variant="ghost" onClick={() => toast.message(JSON.stringify(row))}>View details</Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  )
}
