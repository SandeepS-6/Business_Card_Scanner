import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useApp } from '@/context/app-context'
import { presenceService } from '@/services/features-api'
import { formatDateTime } from '@/lib/utils'
import type { PresenceStatus, TeamPresence } from '@/types/features'

const FILTERS: Array<PresenceStatus | 'all'> = ['all', 'online', 'idle', 'offline']

function statusLabel(s: PresenceStatus) {
  if (s === 'online') return '🟢 Online'
  if (s === 'idle') return '🟡 Idle'
  return '⚫ Offline'
}

export function PresencePage() {
  const { organization } = useApp()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [detail, setDetail] = useState<TeamPresence | null>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: ['presence', organization?.id],
    queryFn: () => presenceService.list(organization!.id),
    enabled: !!organization,
  })

  const list = filter === 'all' ? data : data.filter((p) => p.status === filter)

  return (
    <div>
      <PageHeader title="Live Team Presence" description="Who is online at the event. Statuses are mock." />
      <div className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f}
          </Button>
        ))}
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading presence…</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <button
            key={p.userId}
            type="button"
            className="rounded-lg border border-border bg-card p-4 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setDetail(p)}
          >
            <div className="mb-2 flex items-center gap-3">
              <span
                className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold"
                aria-hidden
              >
                {p.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </span>
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.role}</p>
              </div>
            </div>
            <p className="text-sm">{statusLabel(p.status)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{p.activity}</p>
          </button>
        ))}
      </div>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
            <DialogDescription>Presence detail — no session secrets exposed.</DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="space-y-2 text-sm">
              <p>{statusLabel(detail.status)}</p>
              <p>Current event: {detail.eventId ?? 'None'}</p>
              <p>Activity: {detail.activity}</p>
              <p>Cards scanned: {detail.cardsScanned}</p>
              <p>Leads generated: {detail.leadsGenerated}</p>
              <p>Last seen: {formatDateTime(detail.lastSeen)}</p>
              <Badge variant="outline">Device: Field tablet (mock)</Badge>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
