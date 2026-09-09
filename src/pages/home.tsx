import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarPlus, ClipboardList, Contact, UserPlus } from 'lucide-react'
import { useApp } from '@/context/app-context'
import { PageHeader } from '@/components/shared/page-header'
import { CapturePanel } from '@/components/capture/capture-panel'
import { AppChart } from '@/components/charts/app-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/ui/skeleton'
import { LeadQualityBadge, LeadStatusBadge } from '@/components/shared/status-badges'
import { contactService, dashboardService, followUpService, userService } from '@/services/api'
import { formatDateTime } from '@/lib/utils'
import { can } from '@/security/permissions'

/** Combined home: capture + dashboard analytics. */
export function HomePage() {
  const { user, organization, selectedEventId } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const orgId = organization?.id ?? ''
  const canExport = can(user?.role, 'CAPTURE')

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

  const kpis = [
    { label: 'Cards Scanned', value: stats?.cardsScanned },
    { label: 'Contacts Created', value: stats?.contactsCreated },
    { label: 'Leads', value: stats?.leads },
    { label: 'Qualified Leads', value: stats?.qualifiedLeads },
    { label: 'Follow-ups Pending', value: stats?.followUpsPending },
    { label: 'Hot Leads', value: stats?.hotLeads },
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
          <AppChart
            id="cards-scanned-over-time"
            title="Cards scanned over time"
            description="Weekly scan volume for the current organization."
            kind="area"
            categoryKey="day"
            series={[{ key: 'scans', label: 'Cards scanned' }]}
            rows={charts.scansOverTime}
            height={208}
            loading={isLoading}
            canExport={canExport}
            emptyMessage="No scan activity for this period."
          />
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

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <AppChart
          id="leads-by-status"
          title="Leads by status"
          kind="bar"
          categoryKey="status"
          series={[{ key: 'count', label: 'Leads' }]}
          rows={charts.leadsByStatus}
          height={224}
          loading={isLoading}
          canExport={canExport}
          emptyMessage="No lead activity for this period."
        />
        <AppChart
          id="lead-quality"
          title="Lead quality"
          kind="doughnut"
          categoryKey="quality"
          series={[{ key: 'count', label: 'Leads' }]}
          rows={charts.leadQuality}
          height={224}
          loading={isLoading}
          canExport={canExport}
          emptyMessage="No quality breakdown yet."
        />
        <AppChart
          id="follow-up-activity"
          title="Follow-up activity"
          kind="stackedBar"
          categoryKey="day"
          series={[
            { key: 'completed', label: 'Completed' },
            { key: 'pending', label: 'Pending', color: '#94a3b8' },
          ]}
          rows={charts.followUpActivity}
          height={224}
          loading={isLoading}
          canExport={canExport}
          emptyMessage="No follow-up activity for this period."
        />
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
                  <LeadQualityBadge quality={c.leadQuality} />
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
