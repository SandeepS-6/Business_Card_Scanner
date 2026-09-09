import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { venueService } from '@/services/features-api'
import type { VenueBooth } from '@/types/features'

type MapFilter = 'all' | 'team' | 'activity' | 'leads' | 'cards' | 'sync'

export function VenueMapPage() {
  const { data: booths = [], isLoading } = useQuery({
    queryKey: ['venue-booths', 'org-scoped'],
    queryFn: () => venueService.booths(),
  })
  // BACKEND REQUIRED: Venue booths must be scoped to event + organization server-side.
  const [filter, setFilter] = useState<MapFilter>('all')
  const [selected, setSelected] = useState<VenueBooth | null>(null)

  const visible = useMemo(() => {
    if (filter === 'team') return booths.filter((b) => b.team.length)
    if (filter === 'leads') return booths.filter((b) => b.leads > 0)
    if (filter === 'cards') return booths.filter((b) => b.cards > 0)
    if (filter === 'activity') return booths.filter((b) => b.lastActivity.includes('second'))
    if (filter === 'sync') return booths.filter((b) => b.cards > 50)
    return booths
  }, [booths, filter])

  return (
    <div>
      <PageHeader
        title="Event Venue Map"
        description="Mock floor plan — no external map provider. Click a booth for live stats."
      />
      <div className="mb-4 flex flex-wrap gap-1" role="group" aria-label="Map filters">
        {(['all', 'team', 'activity', 'leads', 'cards', 'sync'] as MapFilter[]).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All locations' : f === 'team' ? 'Team members' : f === 'sync' ? 'Sync status' : f}
          </Button>
        ))}
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading map…</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
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

        <Card className="p-4">
          {selected ? (
            <div className="space-y-2 text-sm">
              <h2 className="font-display text-lg font-semibold">{selected.label}</h2>
              <p>
                <span className="text-muted-foreground">Team: </span>
                {selected.team.length ? selected.team.join(', ') : 'Unassigned'}
              </p>
              <p>
                Cards: <strong>{selected.cards}</strong>
              </p>
              <p>
                Leads: <strong>{selected.leads}</strong>
              </p>
              <p className="text-muted-foreground">Last activity: {selected.lastActivity}</p>
              <Badge variant="secondary">Scanner location</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a booth to see team and capture stats.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
