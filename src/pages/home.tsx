import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, CalendarPlus, ClipboardList, Contact, Download, Table2, UserPlus } from 'lucide-react'
import { useApp } from '@/context/app-context'
import { PageHeader } from '@/components/shared/page-header'
import { CapturePanel } from '@/components/capture/capture-panel'
import { AppChart, type AppChartHandle } from '@/components/charts/app-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/ui/skeleton'
import { LeadIntentBadge, LeadStatusBadge } from '@/components/shared/status-badges'
import { contactService, dashboardService, followUpService, userService } from '@/services/api'
import { formatDateTime } from '@/lib/utils'
import { can } from '@/security/permissions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/** Combined home: capture + dashboard analytics. */
export function HomePage() {
  const { user, organization, selectedEventId } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const orgId = organization?.id ?? ''
  const canExport = can(user?.role, 'CAPTURE')
  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily')
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const chartApi = useRef<AppChartHandle>(null)

  useEffect(() => {
    if (params.get('mode') === 'upload' || params.get('focus') === 'capture') {
      document.getElementById('capture')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [params])

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', orgId],
    queryFn: () => dashboardService.stats(orgId),
    enabled: !!orgId,
  })
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', orgId],
    queryFn: () => contactService.list(orgId),
    enabled: !!orgId,
  })
  const { data: followUps = [] } = useQuery({
    queryKey: ['followups', orgId],
    queryFn: () => followUpService.list(orgId),
    enabled: !!orgId,
  })
  const charts = dashboardService.charts()

  const scanRows = useMemo(() => {
    if (period === 'daily') return charts.scansOverTime
    // Mock monthly rollup from weekly series
    return [
      { day: 'Jul', scans: charts.scansOverTime.slice(0, 2).reduce((s, r) => s + Number(r.scans ?? 0), 0) },
      { day: 'Aug', scans: charts.scansOverTime.slice(2, 5).reduce((s, r) => s + Number(r.scans ?? 0), 0) },
      { day: 'Sep', scans: charts.scansOverTime.slice(5).reduce((s, r) => s + Number(r.scans ?? 0), 0) },
    ]
  }, [charts.scansOverTime, period])

  const rangeLabel = period === 'daily' ? 'Jul 09 - Sep 09' : 'Jul - Sep 2026'

  const kpis = [
    { label: 'Cards Scanned', value: stats?.cardsScanned },
    { label: 'Contacts Created', value: stats?.contactsCreated },
    { label: 'Leads', value: stats?.leads },
    { label: 'Qualified Leads', value: stats?.qualifiedLeads },
    { label: 'Follow-ups Pending', value: stats?.followUpsPending },
    { label: 'High Intent Leads', value: stats?.highIntentLeads },
    { label: 'OCR Success Rate', value: stats ? `${stats.ocrSuccessRate}%` : undefined },
    { label: 'Duplicate Rate', value: stats ? `${stats.duplicateRate}%` : undefined },
  ]

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.firstName}`}
        description={`${organization?.name ?? 'Organization'}${selectedEventId ? ' · Event selected' : ''} · Scan cards and track performance in one place.`}
      />

      <div className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <CapturePanel
          heading="Capture business cards"
          instructions="Use the camera or upload images, then confirm to run OCR review."
          help="Tip: batch upload works best with the offline queue when Wi‑Fi is weak."
        />
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              : kpis.slice(0, 4).map((k) => (
                  <Card key={k.label}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-display text-2xl font-semibold">{k.value ?? '—'}</p>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={`k2-${i}`} />)
          : kpis.slice(4).map((k) => (
              <Card key={k.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-2xl font-semibold">{k.value ?? '—'}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="mb-6 overflow-hidden rounded-lg bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/60 px-4 py-3">
          <h2 className="min-w-0 font-display text-base font-semibold text-foreground">
            Cards scanned ({period === 'daily' ? 'daily' : 'monthly'}) ({rangeLabel})
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex h-9 items-center rounded-full bg-background/80 p-0.5" role="group" aria-label="Period">
              <button
                type="button"
                className={cn(
                  'h-8 rounded-full px-3 text-sm transition-colors',
                  period === 'daily'
                    ? 'bg-primary text-sm font-semibold text-primary-foreground'
                    : 'text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                aria-pressed={period === 'daily'}
                onClick={() => setPeriod('daily')}
              >
                Daily
              </button>
              <button
                type="button"
                className={cn(
                  'h-8 rounded-full px-3 text-sm transition-colors',
                  period === 'monthly'
                    ? 'bg-primary text-sm font-semibold text-primary-foreground'
                    : 'text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                aria-pressed={period === 'monthly'}
                onClick={() => setPeriod('monthly')}
              >
                Monthly
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn('size-9', view === 'chart' && 'bg-primary/10 text-primary')}
                aria-label="Chart view"
                aria-pressed={view === 'chart'}
                onClick={() => setView('chart')}
              >
                <BarChart3 className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn('size-9', view === 'table' && 'bg-primary/10 text-primary')}
                aria-label="Table view"
                aria-pressed={view === 'table'}
                onClick={() => setView('table')}
              >
                <Table2 className="size-4" />
              </Button>
              <div className="group relative">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-9"
                  aria-label="Download"
                  aria-haspopup="menu"
                  disabled={!canExport}
                >
                  <Download className="size-4" />
                </Button>
                <div
                  role="menu"
                  className="invisible absolute right-0 top-full z-20 mt-1 min-w-[8.5rem] rounded-md bg-popover py-1 text-popover-foreground opacity-0 shadow-md transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full px-3 py-2 text-left text-sm font-medium hover:bg-muted"
                    disabled={!canExport}
                    onClick={() => {
                      if (!canExport) {
                        toast.error('No export permission')
                        return
                      }
                      void chartApi.current?.exportExcel()
                    }}
                  >
                    Excel
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full px-3 py-2 text-left text-sm font-medium hover:bg-muted"
                    disabled={!canExport}
                    onClick={() => {
                      if (!canExport) {
                        toast.error('No export permission')
                        return
                      }
                      void chartApi.current?.exportPng()
                    }}
                  >
                    PNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative p-4">
          <div className={cn(view === 'chart' ? 'relative' : 'pointer-events-none absolute left-0 top-0 w-full opacity-0')}>
            <AppChart
              ref={chartApi}
              bare
              id="home-cards-scanned"
              title="Cards scanned"
              kind="bar"
              categoryKey="day"
              series={[{ key: 'scans', label: 'Cards scanned' }]}
              rows={scanRows}
              height={260}
              loading={isLoading}
              canExport={canExport}
              emptyMessage="No scan activity for this period."
            />
          </div>
          {view === 'table' ? (
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="px-2 py-2 text-sm font-medium">{period === 'daily' ? 'Day' : 'Month'}</th>
                    <th className="px-2 py-2 text-sm font-medium">Cards scanned</th>
                  </tr>
                </thead>
                <tbody>
                  {scanRows.map((r) => (
                    <tr key={String(r.day)}>
                      <td className="px-2 py-2 font-medium">{String(r.day)}</td>
                      <td className="px-2 py-2 tabular-nums">{Number(r.scans ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => navigate('/events')}>
          <CalendarPlus className="size-4" /> Create Event
        </Button>
        <Button variant="secondary" onClick={() => navigate('/contacts')}>
          <UserPlus className="size-4" /> Add Contact
        </Button>
        <Button variant="secondary" onClick={() => navigate('/follow-ups')}>
          <ClipboardList className="size-4" /> Create Follow-up
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                to={`/contacts/${c.id}`}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 hover:bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">{c.fullName}</p>
                  <p className="text-xs text-muted-foreground">{c.company}</p>
                </div>
                <div className="flex items-center gap-2">
                  <LeadStatusBadge status={c.leadStatus} />
                  <LeadIntentBadge intent={c.leadIntent} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent follow-ups & team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {followUps.slice(0, 3).map((f) => {
              const contact = contacts.find((c) => c.id === f.contactId)
              const assignee = userService.get(f.assignedUserId)
              return (
                <div key={f.id} className="rounded-md border border-border px-3 py-2 text-sm">
                  <p className="font-medium">{contact?.fullName ?? f.contactId}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.channel} · {f.status.replace('_', ' ')} · due {formatDateTime(f.dueDate)} · {assignee?.firstName}
                  </p>
                </div>
              )
            })}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Contact className="size-3.5" /> Team activity updates appear in the audit log.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
