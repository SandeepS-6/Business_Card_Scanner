import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Check, CloudDownload, FileText, Filter, Info } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, Pagination, tableActionIconClass } from '@/components/shared/data-table'
import { SearchField } from '@/components/shared/search-field'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusDot } from '@/components/shared/status-badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useApp } from '@/context/app-context'
import { usePagedRows } from '@/hooks/use-page-size'
import { can } from '@/security/permissions'
import { billingService } from '@/services/features-api'
import { cn, formatDate } from '@/lib/utils'
import type { Plan, PlanId } from '@/types/features'
import { toast } from 'sonner'

function planSummary(p: Plan) {
  if (p.id === 'enterprise') return 'Unlimited seats and card scans'
  return `Includes up to ${p.users} users`
}

function planFeatures(p: Plan): string[] {
  if (p.id === 'enterprise') {
    return ['Unlimited users', 'Unlimited card scans', 'Unlimited events', `${p.support} support`, 'CRM sync included']
  }
  return [
    `Up to ${p.users} users`,
    `${p.cardsMonth.toLocaleString()} card scans / month`,
    `${p.events} events`,
    `${p.support} support`,
    p.crm ? 'CRM sync included' : 'CRM sync not included',
  ]
}

function invoiceLabel(planName: string, date: string) {
  const d = new Date(date)
  const month = d.toLocaleString('en-US', { month: 'short' })
  const year = d.getFullYear()
  return `${planName} Plan – ${month} ${year}`
}

export function BillingPage() {
  const { organization, user } = useApp()
  const qc = useQueryClient()
  const canManage = can(user?.role, 'BILLING_MANAGE')
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [downgradeOpen, setDowngradeOpen] = useState(false)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: () => billingService.plans() })
  const { data: current } = useQuery({
    queryKey: ['org-plan', organization?.id],
    queryFn: () => billingService.current(organization!.id),
    enabled: !!organization,
  })
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', organization?.id],
    queryFn: () => billingService.invoices(organization!.id),
    enabled: !!organization,
  })

  const plan = useMemo(() => plans.find((p) => p.id === current?.planId), [plans, current])

  const filteredInvoices = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return invoices
    return invoices.filter((inv) => {
      const label = invoiceLabel(plan?.name ?? 'Plan', inv.date).toLowerCase()
      return label.includes(query) || inv.number.toLowerCase().includes(query) || String(inv.amount).includes(query)
    })
  }, [invoices, q, plan?.name])

  const { page, setPage, pageSize, paged: pageInvoices, total: invoiceTotal } = usePagedRows(filteredInvoices, q)

  const allSelected = pageInvoices.length > 0 && pageInvoices.every((i) => selected.includes(i.id))

  const setPlan = useMutation({
    mutationFn: (planId: PlanId) => billingService.setPlan(organization!.id, planId),
    onSuccess: () => {
      toast.success('Plan updated (mock)')
      setSelectedPlan(null)
      void qc.invalidateQueries({ queryKey: ['org-plan'] })
    },
  })

  const requestSwitch = (target: PlanId) => {
    if (!canManage || !plan) return
    if (target === plan.id) return
    setSelectedPlan(target)
    const targetIdx = plans.findIndex((p) => p.id === target)
    const currentIdx = plans.findIndex((p) => p.id === plan.id)
    if (targetIdx < currentIdx) {
      setDowngradeOpen(true)
      return
    }
    void setPlan.mutateAsync(target)
  }

  return (
    <div>
      <PageHeader
        title="Plans & Billing"
        description="Manage your plan and billing history here."
      />

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const isCurrent = current?.planId === p.id
          return (
            <div
              key={p.id}
              className={cn(
                'relative flex flex-col rounded-xl border p-5 transition',
                isCurrent ? 'border-primary/40 bg-primary/5' : 'border-border bg-card',
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{p.name}</p>
                  <Info className="size-3.5 text-muted-foreground" aria-hidden />
                </div>
                <span
                  className={cn(
                    'inline-flex size-5 shrink-0 items-center justify-center rounded-full border',
                    isCurrent ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 bg-transparent',
                  )}
                  aria-hidden
                >
                  {isCurrent ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
              </div>
              <p className="font-display text-3xl font-semibold tracking-tight">
                {p.id === 'enterprise' ? (
                  'Custom'
                ) : (
                  <>
                    ${p.priceMonthly}
                    <span className="text-base font-medium text-muted-foreground">/mth</span>
                  </>
                )}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{planSummary(p)}</p>
              <ul className="mt-4 flex-1 space-y-2.5">
                {planFeatures(p).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              {canManage ? (
                <Button
                  className="mt-5 w-full"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || setPlan.isPending}
                  onClick={() => requestSwitch(p.id)}
                >
                  {isCurrent ? (
                    'Current plan'
                  ) : (
                    <>
                      <ArrowLeftRight className="size-4" />
                      Switch plan
                    </>
                  )}
                </Button>
              ) : isCurrent ? (
                <p className="mt-5 text-center text-sm font-medium text-muted-foreground">Current plan</p>
              ) : null}
            </div>
          )
        })}
      </div>

      {current && plan ? (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Card scans this period</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {current.usage.cards.toLocaleString()} / {plan.id === 'enterprise' ? '∞' : plan.cardsMonth.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Users</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {current.usage.users} / {plan.id === 'enterprise' ? '∞' : plan.users}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="font-display text-base font-semibold">Billing history</h2>
          <span className="text-sm text-muted-foreground">{invoiceTotal}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchField value={q} onChange={setQ} placeholder="Search invoices" className="sm:max-w-[200px]" />
          <Button size="sm" variant="outline" onClick={() => toast.message('Filters (mock)')}>
            <Filter className="size-4" />
            Filter
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" type="button">
                <CloudDownload className="size-4" />
                Download{selected.length > 0 ? ` (${selected.length})` : ' all'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  toast.success(
                    selected.length > 0
                      ? `Download CSV for ${selected.length} invoices (mock)`
                      : 'Download all as CSV (mock)',
                  )
                }
              >
                <CloudDownload className="size-4" aria-hidden />
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toast.success(
                    selected.length > 0
                      ? `Download PDF for ${selected.length} invoices (mock)`
                      : 'Download all as PDF (mock)',
                  )
                }
              >
                <CloudDownload className="size-4" aria-hidden />
                Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {invoiceTotal === 0 ? (
        <EmptyState title="No invoices" description="Billing history will appear here after your first invoice." />
      ) : (
        <>
          <DataTable
            columns={[
              <Checkbox
                key="all"
                checked={allSelected}
                onCheckedChange={(v) =>
                  setSelected(v ? pageInvoices.map((i) => i.id) : selected.filter((id) => !pageInvoices.some((i) => i.id === id)))
                }
                aria-label="Select all invoices"
              />,
              'Invoice',
              'Amount',
              'Date',
              'Status',
              'Plan',
              '',
            ]}
          >
            {pageInvoices.map((inv) => {
              const label = invoiceLabel(plan?.name ?? 'Plan', inv.date)
              return (
                <tr key={inv.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.includes(inv.id)}
                      onCheckedChange={(v) => setSelected((s) => (v ? [...s, inv.id] : s.filter((id) => id !== inv.id)))}
                      aria-label={`Select ${inv.number}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded bg-foreground text-background">
                        <FileText className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{label}</p>
                        <p className="truncate text-xs text-muted-foreground">{inv.number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">USD ${inv.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(inv.date)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={inv.status === 'paid' ? 'success' : inv.status === 'failed' ? 'danger' : 'warning'}
                      className="gap-1 capitalize"
                    >
                      {inv.status === 'paid' ? <Check className="size-3" aria-hidden /> : null}
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium">
                      <StatusDot tone={inv.status === 'paid' ? 'success' : inv.status === 'failed' ? 'danger' : 'warning'} />
                      {plan?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={tableActionIconClass}
                          aria-label={`Download ${inv.number}`}
                          title="Download"
                        >
                          <CloudDownload className="size-4" aria-hidden />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.success(`Download ${inv.number} as CSV (mock)`)}>
                          Download CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success(`Download ${inv.number} as PDF (mock)`)}>
                          Download PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </DataTable>
          <Pagination page={page} pageSize={pageSize} total={invoiceTotal} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={downgradeOpen}
        onOpenChange={setDowngradeOpen}
        title="Downgrade plan?"
        description={`You will lose higher quotas from ${plan?.name}. Change is applied immediately in this mock.`}
        confirmLabel="Continue downgrade"
        destructive
        onConfirm={() => {
          setDowngradeOpen(false)
          if (selectedPlan) void setPlan.mutateAsync(selectedPlan)
        }}
      />
    </div>
  )
}
