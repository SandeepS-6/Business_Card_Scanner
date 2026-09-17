import { useMemo, useState, type ComponentType, type ReactNode } from 'react'
import {
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SearchField } from '@/components/shared/search-field'
import { StatusDot } from '@/components/shared/status-badges'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

export type IntegrationCatalogStatus = 'connected' | 'needs' | 'error'

export type IntegrationCatalogItem = {
  id: string
  name: string
  provider: string
  description: string
  category: string
  status: IntegrationCatalogStatus
  error?: string
  meta?: string
  icon: ComponentType<{ className?: string }>
}

function IntegrationStatusBadge({ status }: { status: IntegrationCatalogStatus }) {
  const tone = status === 'connected' ? 'success' : status === 'error' ? 'danger' : 'warning'
  const label = status === 'connected' ? 'Connected' : status === 'error' ? 'Error' : 'Needs configuration'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-xs font-medium">
      <StatusDot tone={tone} />
      {label}
    </span>
  )
}

export function IntegrationsCatalog({
  title,
  description,
  items,
  footnote,
  onAdd,
  addLabel = 'Add integration',
  onManage,
}: {
  title: string
  description: string
  items: IntegrationCatalogItem[]
  footnote?: ReactNode
  onAdd?: () => void
  addLabel?: string
  onManage?: (item: IntegrationCatalogItem) => void
}) {
  const [filter, setFilter] = useState<'all' | 'connected' | 'needs'>('all')
  const [q, setQ] = useState('')
  const [checkedAt, setCheckedAt] = useState(() => new Date().toISOString())

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items.filter((item) => {
      if (filter === 'connected' && item.status !== 'connected') return false
      if (filter === 'needs' && item.status === 'connected') return false
      if (!query) return true
      return `${item.name} ${item.provider} ${item.category} ${item.description}`.toLowerCase().includes(query)
    })
  }, [filter, q, items])

  const counts = useMemo(() => {
    const connected = items.filter((i) => i.status === 'connected').length
    const needs = items.length - connected
    return { services: items.length, connected, needs }
  }, [items])

  const manage = (item: IntegrationCatalogItem) => {
    if (onManage) onManage(item)
    else toast.message(`Manage ${item.name} (mock)`)
  }

  const refreshAll = () => {
    setCheckedAt(new Date().toISOString())
    toast.message('Status refreshed')
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={refreshAll}>
              <RefreshCw className="size-4" />
              Refresh status
            </Button>
            {onAdd ? (
              <Button size="sm" onClick={onAdd}>
                <Plus className="size-4" />
                {addLabel}
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Integration status">
          {(
            [
              ['all', 'All'],
              ['connected', 'Connected'],
              ['needs', 'Needs configuration'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition',
                filter === id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            Services {counts.services}
            <span className="mx-2 text-border">·</span>
            Connected {counts.connected}
            <span className="mx-2 text-border">·</span>
            Needs attention {counts.needs}
          </p>
          <SearchField value={q} onChange={setQ} placeholder="Search integrations" className="sm:max-w-[220px]" />
        </div>
      </div>

      {footnote ? <div className="mb-4 text-sm text-muted-foreground">{footnote}</div> : null}

      {filtered.length === 0 ? (
        <EmptyState title="No integrations match" description="Try another filter or search." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const Icon = item.icon
            const needsAction = item.status !== 'connected'
            return (
              <article key={item.id} className="flex flex-col rounded-lg border border-border bg-card p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-muted/40 text-foreground">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <IntegrationStatusBadge status={item.status} />
                </div>
                <h2 className="text-sm font-semibold">
                  {item.name}{' '}
                  <span className="font-normal text-muted-foreground">{item.provider}</span>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                {item.error ? (
                  <div className="mt-3 flex gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>{item.error}</span>
                  </div>
                ) : null}
                <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" aria-hidden />
                    {item.meta ?? `Last checked ${formatDateTime(checkedAt)}`}
                  </span>
                  <span className="text-border">·</span>
                  <span>{item.category}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Button size="sm" variant={needsAction ? 'default' : 'outline'} onClick={() => manage(item)}>
                    {needsAction ? 'Configure' : 'Manage'}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={`More actions for ${item.name}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => manage(item)}>Open settings</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setCheckedAt(new Date().toISOString())
                          toast.message(`Checked ${item.name}`)
                        }}
                      >
                        Refresh status
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
