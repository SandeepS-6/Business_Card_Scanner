import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { AppChart } from '@/components/charts/app-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApp } from '@/context/app-context'
import { can } from '@/security/permissions'
import { commandCenterService, presenceService } from '@/services/features-api'
import { StatusDot } from '@/components/shared/status-badges'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

const EVENT_ID = 'evt-tech-expo'

export function CommandCenterPage() {
  const { organization, user } = useApp()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [paused, setPaused] = useState(false)
  const canExport = can(user?.role, 'COMMAND_CENTER_VIEW')

  const { data: kpis } = useQuery({
    queryKey: ['cc-kpis', organization?.id, EVENT_ID],
    queryFn: () => commandCenterService.kpis(EVENT_ID),
    enabled: !!organization,
  })

  const { data: activity = [] } = useQuery({
    queryKey: ['cc-activity', organization?.id, EVENT_ID],
    queryFn: () => commandCenterService.activity(organization!.id, EVENT_ID),
    enabled: !!organization,
  })

  const { data: team = [] } = useQuery({
    queryKey: ['presence', organization?.id],
    queryFn: () => presenceService.list(organization!.id),
    enabled: !!organization,
  })

  useEffect(() => {
    if (paused || !organization) return
    const t = setInterval(() => {
      void commandCenterService.pushMockActivity(organization.id, EVENT_ID).then(() => {
        void qc.invalidateQueries({ queryKey: ['cc-activity'] })
      })
    }, 8000)
    return () => clearInterval(t)
  }, [paused, organization, qc])

  const metrics = [
    { label: 'Cards scanned', value: kpis?.cardsScanned ?? '—' },
    { label: 'Contacts captured', value: kpis?.contacts ?? '—' },
    { label: 'Leads generated', value: kpis?.leads ?? '—' },
    { label: 'Qualified leads', value: kpis?.qualified ?? '—' },
    { label: 'Follow-ups created', value: kpis?.followUps ?? '—' },
    { label: 'Team active', value: kpis?.teamActive ?? '—' },
    { label: 'Sync status', value: kpis?.sync ?? '—' },
  ]

  return (
    <div>
      <PageHeader
        title="Live Event Command Center"
        description="Operations view for in-progress events. Updates are simulated locally."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select defaultValue={EVENT_ID}>
              <SelectTrigger className="w-[200px]" aria-label="Event">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EVENT_ID}>Tech Expo 2026</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant={paused ? 'warning' : 'success'}>{paused ? 'PAUSED' : 'LIVE'}</Badge>
            <Button size="sm" variant="outline" onClick={() => setPaused((p) => !p)}>
              {paused ? 'Resume' : 'Pause event'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(`/events/${EVENT_ID}`)}>
              View event
            </Button>
            <Button size="sm" variant="ghost" onClick={() => toast.message('Settings (mock)')}>
              Event settings
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void qc.invalidateQueries({ queryKey: ['cc-'] })
                toast.success('Refreshed')
              }}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums capitalize">{m.value}</p>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 font-display text-base font-semibold">Live activity</h2>
          <ul className="max-h-72 space-y-3 overflow-y-auto" aria-live="polite">
            {activity.map((a) => (
              <li key={a.id} className="border-b border-border pb-2 text-sm last:border-0">
                <p>{a.text}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(a.at)}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Team activity</h2>
            <Button size="sm" variant="link" onClick={() => navigate('/presence')}>
              Presence
            </Button>
          </div>
          <ul className="space-y-2">
            {team.map((p) => (
              <li key={p.userId} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <StatusDot
                      tone={p.status === 'online' ? 'success' : p.status === 'idle' ? 'warning' : 'muted'}
                    />
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.cardsScanned} cards · {p.leadsGenerated} leads · {p.activity}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {p.status}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AppChart
          id="cc-scans"
          title="Cards scanned over time"
          kind="area"
          categoryKey="hour"
          series={[{ key: 'scans', label: 'Scans' }]}
          rows={[
            { hour: '09:00', scans: 12 },
            { hour: '10:00', scans: 28 },
            { hour: '11:00', scans: 44 },
            { hour: '12:00', scans: 31 },
            { hour: '13:00', scans: 52 },
            { hour: '14:00', scans: 61 },
          ]}
          canExport={canExport}
        />
        <AppChart
          id="cc-leads"
          title="Leads generated"
          kind="bar"
          categoryKey="hour"
          series={[{ key: 'leads', label: 'Leads' }]}
          rows={[
            { hour: '09:00', leads: 4 },
            { hour: '10:00', leads: 11 },
            { hour: '11:00', leads: 18 },
            { hour: '12:00', leads: 9 },
            { hour: '13:00', leads: 22 },
            { hour: '14:00', leads: 27 },
          ]}
          canExport={canExport}
        />
        <AppChart
          id="cc-team"
          title="Team performance"
          kind="bar"
          categoryKey="name"
          series={[
            { key: 'cards', label: 'Cards' },
            { key: 'leads', label: 'Leads' },
          ]}
          rows={team.map((p) => ({ name: p.name.split(' ')[0], cards: p.cardsScanned, leads: p.leadsGenerated }))}
          canExport={canExport}
        />
        <AppChart
          id="cc-status"
          title="Lead status mix"
          kind="doughnut"
          categoryKey="status"
          series={[{ key: 'count', label: 'Count' }]}
          rows={[
            { status: 'New', count: 40 },
            { status: 'Qualified', count: 74 },
            { status: 'Interested', count: 28 },
            { status: 'Lost', count: 12 },
          ]}
          canExport={canExport}
        />
      </div>
    </div>
  )
}
