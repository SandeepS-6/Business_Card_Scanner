import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useApp } from '@/context/app-context'
import { presenceService } from '@/services/features-api'
import { userService } from '@/services/api'
import { formatDateTime, initials } from '@/lib/utils'
import { StatusDot } from '@/components/shared/status-badges'
import type { PresenceStatus, TeamPresence } from '@/types/features'

const STATUS_FILTERS: Array<PresenceStatus | 'all'> = ['all', 'online', 'idle', 'offline']
const ROLE_FILTERS = ['all', 'Admin', 'User'] as const

function PresenceStatusLabel({ status }: { status: PresenceStatus }) {
  const tone = status === 'online' ? 'success' : status === 'idle' ? 'warning' : 'muted'
  const label = status === 'online' ? 'Online' : status === 'idle' ? 'Idle' : 'Offline'
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      <StatusDot tone={tone} />
      {label}
    </span>
  )
}

export function PresencePage() {
  const { organization } = useApp()
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_FILTERS)[number]>('all')
  const [detail, setDetail] = useState<TeamPresence | null>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: ['presence', organization?.id],
    queryFn: () => presenceService.list(organization!.id),
    enabled: !!organization,
  })

  const list = useMemo(() => {
    return data.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (roleFilter !== 'all' && p.role !== roleFilter) return false
      return true
    })
  }, [data, statusFilter, roleFilter])

  return (
    <div>
      <PageHeader title="Live Team Presence" description="Who is online at the event. Statuses are mock." />
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <Button key={f} size="sm" variant={statusFilter === f ? 'default' : 'outline'} onClick={() => setStatusFilter(f)}>
              {f === 'all' ? 'All statuses' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {ROLE_FILTERS.map((f) => (
            <Button key={f} size="sm" variant={roleFilter === f ? 'default' : 'outline'} onClick={() => setRoleFilter(f)}>
              {f === 'all' ? 'All roles' : f === 'Admin' ? 'Admins' : 'Users'}
            </Button>
          ))}
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading presence…</p> : null}
      {!isLoading && list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No team members match these filters.</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => {
          const user = userService.get(p.userId)
          const email = user?.email
          return (
            <button
              key={p.userId}
              type="button"
              className="rounded-lg border border-border bg-card p-4 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setDetail(p)}
            >
              <div className="mb-3 flex items-start gap-3">
                <Avatar className="size-10">
                  {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                  <AvatarFallback>{initials(p.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.role}
                    {user?.role === 'org_admin' ? ' · Org admin' : ''}
                  </p>
                  {email ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p> : null}
                </div>
              </div>
              <PresenceStatusLabel status={p.status} />
              <p className="mt-1 text-sm text-muted-foreground">{p.activity}</p>
              <p className="mt-2 text-xs text-muted-foreground">Last seen {formatDateTime(p.lastSeen)}</p>
            </button>
          )
        })}
      </div>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
            <DialogDescription>Presence detail — no session secrets exposed.</DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="space-y-3 text-sm">
              {(() => {
                const user = userService.get(detail.userId)
                return (
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12">
                      {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                      <AvatarFallback>{initials(detail.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium">{detail.name}</p>
                      <p className="text-muted-foreground">{detail.role}</p>
                      {user?.email ? <p className="truncate text-muted-foreground">{user.email}</p> : null}
                    </div>
                  </div>
                )
              })()}
              <PresenceStatusLabel status={detail.status} />
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
