import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { venueService } from '@/services/features-api'
import type { VenueBooth } from '@/types/features'
import { StatusDot } from '@/components/shared/status-badges'

type MapFilter = 'all' | 'team' | 'activity' | 'leads' | 'cards' | 'sync'

type ScanFeedItem = {
  id: string
  booth: string
  actor: string
  role: 'admin' | 'user'
  contact: string
  at: string
}

const MOCK_CONTACTS = ['Jordan Lee', 'Priya Shah', 'Marcus Chen', 'Elena Rossi', 'Sam Okonkwo', 'Ava Nguyen']
const MOCK_ACTORS = [
  { name: 'Ava Chen', role: 'admin' as const },
  { name: 'Maya Patel', role: 'user' as const },
  { name: 'Noah Kim', role: 'user' as const },
]

function nowLabel() {
  return new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function VenueMapPage() {
  const { data: booths = [], isLoading } = useQuery({
    queryKey: ['venue-booths', 'org-scoped'],
    queryFn: () => venueService.booths(),
  })
  // BACKEND REQUIRED: Venue booths must be scoped to event + organization server-side.
  // BACKEND REQUIRED: Live scan feed should arrive over WebSocket; UI below is a local mock.
  const [filter, setFilter] = useState<MapFilter>('all')
  const [selected, setSelected] = useState<VenueBooth | null>(null)
  const [feed, setFeed] = useState<ScanFeedItem[]>([
    {
      id: 's0',
      booth: 'Booth A',
      actor: 'Ava Chen',
      role: 'admin',
      contact: 'Jordan Lee',
      at: nowLabel(),
    },
  ])

  useEffect(() => {
    if (!booths.length) return
    const timer = window.setInterval(() => {
      const booth = booths[Math.floor(Math.random() * booths.length)]
      const actor = MOCK_ACTORS[Math.floor(Math.random() * MOCK_ACTORS.length)]
      const contact = MOCK_CONTACTS[Math.floor(Math.random() * MOCK_CONTACTS.length)]
      setFeed((prev) =>
        [
          {
            id: `s-${Date.now()}`,
            booth: booth.label,
            actor: actor.name,
            role: actor.role,
            contact,
            at: nowLabel(),
          },
          ...prev,
        ].slice(0, 24),
      )
    }, 4500)
    return () => window.clearInterval(timer)
  }, [booths])

  const visible = useMemo(() => {
    if (filter === 'team') return booths.filter((b) => b.team.length)
    if (filter === 'leads') return booths.filter((b) => b.leads > 0)
    if (filter === 'cards') return booths.filter((b) => b.cards > 0)
    if (filter === 'activity') return booths.filter((b) => b.lastActivity.includes('second'))
    if (filter === 'sync') return booths.filter((b) => b.cards > 50)
    return booths
  }, [booths, filter])

  const panelFeed = useMemo(() => {
    if (!selected) return feed
    return feed.filter((f) => f.booth === selected.label)
  }, [feed, selected])

  return (
    <div>
      <PageHeader
        title="Event Venue Map"
        description="Mock floor plan — no external map provider. Live scan feed awaits backend WebSocket."
      />
      <div className="mb-4 flex flex-wrap gap-1" role="group" aria-label="Map filters">
        {(['all', 'team', 'activity', 'leads', 'cards', 'sync'] as MapFilter[]).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All locations' : f === 'team' ? 'Team members' : f === 'sync' ? 'Sync status' : f}
          </Button>
        ))}
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading map…</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="relative aspect-[4/3] overflow-hidden bg-muted/40 p-2" role="img" aria-label="Venue floor plan">
          <div className="absolute inset-2 rounded-md border border-dashed border-border bg-card/80">
            {visible.map((b) => {
              const density = Math.min(1, b.cards / 130)
              return (
                <button
                  key={b.id}
                  type="button"
                  className="absolute flex flex-col items-center justify-center rounded border border-border text-center text-[10px] sm:text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: `${b.w}%`,
                    height: `${b.h}%`,
                    backgroundColor: `color-mix(in oklab, var(--primary) ${Math.round(density * 45)}%, transparent)`,
                  }}
                  onClick={() => setSelected(b)}
                  aria-label={`${b.label}, ${b.cards} cards`}
                >
                  <span className="font-semibold">{b.label}</span>
                  {b.team.length ? <span className="hidden sm:inline">{b.team.length} on site</span> : null}
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="flex max-h-[min(70vh,560px)] flex-col p-4">
          {selected ? (
            <div className="mb-3 space-y-1 border-b border-border pb-3 text-sm">
              <h2 className="font-display text-lg font-semibold">{selected.label}</h2>
              <p>
                <span className="text-muted-foreground">Team: </span>
                {selected.team.length ? selected.team.join(', ') : 'Unassigned'}
              </p>
              <p>
                Cards: <strong>{selected.cards}</strong> · Leads: <strong>{selected.leads}</strong>
              </p>
              <Badge variant="secondary">Scanner location</Badge>
            </div>
          ) : (
            <p className="mb-3 border-b border-border pb-3 text-sm text-muted-foreground">
              Select a booth to filter the live feed, or watch all scans below.
            </p>
          )}

          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Live scans</h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <StatusDot tone="success" />
              Waiting for WebSocket
            </span>
          </div>
          <ul className="min-h-0 flex-1 space-y-0 overflow-y-auto" aria-live="polite" aria-label="Scanned contacts feed">
            {panelFeed.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">No scans for this booth yet.</li>
            ) : (
              panelFeed.map((item) => (
                <li key={item.id} className="border-b border-border py-2.5 text-sm last:border-b-0">
                  <p className="font-medium">
                    {item.booth} · {item.actor}{' '}
                    <span className="font-normal text-muted-foreground">({item.role})</span>
                  </p>
                  <p className="text-muted-foreground">
                    scanned <span className="font-medium text-foreground">{item.contact}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.at}</p>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}
