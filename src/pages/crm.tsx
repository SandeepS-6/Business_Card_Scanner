import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Cloud, Eye, Plug, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, Pagination, tableActionIconClass } from '@/components/shared/data-table'
import { IntegrationsCatalog, type IntegrationCatalogItem } from '@/components/shared/integrations-catalog'
import { SyncStatusBadge } from '@/components/shared/status-badges'
import { ErrorState } from '@/components/shared/empty-state'
import { useApp } from '@/context/app-context'
import { usePagedRows } from '@/hooks/use-page-size'
import { crmService } from '@/services/api'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { CrmIntegration } from '@/types'
import type { ComponentType } from 'react'

const CRM_META: Record<
  CrmIntegration['provider'],
  { name: string; provider: string; description: string; icon: ComponentType<{ className?: string }> }
> = {
  hubspot: {
    name: 'HubSpot',
    provider: 'HubSpot Inc.',
    description: 'CRM sync for contacts, companies, and deals.',
    icon: Building2,
  },
  salesforce: {
    name: 'Salesforce',
    provider: 'Salesforce',
    description: 'Enterprise CRM connector for lead and contact sync.',
    icon: Cloud,
  },
  zoho: {
    name: 'Zoho CRM',
    provider: 'Zoho',
    description: 'Contact and lead sync for Zoho CRM workspaces.',
    icon: Building2,
  },
  rest: {
    name: 'Generic REST API',
    provider: 'Custom',
    description: 'Push contacts and leads to any REST endpoint.',
    icon: Plug,
  },
}

function toCatalogItem(item: CrmIntegration): IntegrationCatalogItem {
  const meta = CRM_META[item.provider]
  return {
    id: item.id,
    name: meta.name,
    provider: meta.provider,
    description: meta.description,
    category: 'CRM',
    status: item.connected ? 'connected' : 'needs',
    icon: meta.icon,
    meta: item.connected
      ? `Last sync ${item.lastSync ? formatDateTime(item.lastSync) : '—'} · ${item.recordsSynced} records`
      : 'Not connected',
  }
}

export function CrmIntegrationsPage() {
  const { organization } = useApp()
  const { data = [] } = useQuery({
    queryKey: ['crm', organization?.id],
    queryFn: () => crmService.integrations(organization!.id),
    enabled: !!organization,
  })

  const items = useMemo(() => data.map(toCatalogItem), [data])
  // SECURITY: CRM credentials must never be collected in the frontend. Backend required.
  const openCms = () => window.open('http://localhost:5174/platform', '_blank', 'noopener,noreferrer')

  return (
    <IntegrationsCatalog
      title="CRM Integrations"
      description="BusinessCardScanner remains the source of truth. CRM is an external sync layer."
      items={items}
      onAdd={openCms}
      onManage={() => openCms()}
      footnote={
        <>
          Credentials and connector settings are edited in the{' '}
          <button type="button" className="font-medium text-primary hover:underline" onClick={openCms}>
            CMS
          </button>
          .
        </>
      }
    />
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
  const { page, setPage, pageSize, paged, total } = usePagedRows(data)

  return (
    <div>
      <PageHeader title="CRM Sync Status" description="Track outbound synchronization jobs." />
      {data.some((d) => d.status === 'failed') ? (
        <div className="mb-4">
          <ErrorState title="CRM sync failed." description="One or more records could not sync." onRetry={() => toast.message('Retry all')} detailsAction={() => toast.message('Open failed items')} />
        </div>
      ) : null}
      <DataTable columns={['Provider', 'Resource', 'Status', 'Updated', 'Actions']}>
        {paged.map((row) => (
          <tr key={row.id} className="hover:bg-muted/30">
            <td className="px-4 py-3">{row.provider}</td>
            <td className="px-4 py-3">{row.resource}</td>
            <td className="px-4 py-3"><SyncStatusBadge status={row.status} /></td>
            <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(row.updatedAt)}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1.5">
                {(row.status === 'failed' || row.status === 'retrying') && (
                  <button
                    type="button"
                    className={tableActionIconClass}
                    aria-label="Retry sync"
                    title="Retry"
                    onClick={() => {
                      toast.success('Retry queued')
                      void qc.invalidateQueries({ queryKey: ['crm-sync'] })
                    }}
                  >
                    <RefreshCw className="size-4" aria-hidden />
                  </button>
                )}
                {row.error ? (
                  <button
                    type="button"
                    className={tableActionIconClass}
                    aria-label="View error"
                    title="View error"
                    onClick={() => toast.message(row.error!)}
                  >
                    <Eye className="size-4" aria-hidden />
                  </button>
                ) : null}
                <button
                  type="button"
                  className={tableActionIconClass}
                  aria-label="View details"
                  title="View details"
                  onClick={() => toast.message(JSON.stringify(row))}
                >
                  <Eye className="size-4" aria-hidden />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
    </div>
  )
}
