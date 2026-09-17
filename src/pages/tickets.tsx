import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpDown, Check, CheckCircle2, CircleDot, Clock, Filter, MoreHorizontal, UserX, Archive } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, Pagination } from '@/components/shared/data-table'
import { DateField } from '@/components/shared/date-field'
import { SearchField } from '@/components/shared/search-field'
import { EmptyState } from '@/components/shared/empty-state'
import { MetricCard } from '@/components/shared/metric-card'
import { AppChart } from '@/components/charts/app-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Label, Textarea } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TicketChat, type TicketChatMessage } from '@/components/tickets/ticket-chat'
import { useTicketChatSocket } from '@/hooks/use-ticket-chat-socket'
import { usePagedRows } from '@/hooks/use-page-size'
import { useApp } from '@/context/app-context'
import { can } from '@/security/permissions'
import { ticketService } from '@/services/features-api'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { StatusDot } from '@/components/shared/status-badges'
import type { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from '@/types/features'
import { toast } from 'sonner'

const PRIORITY_RANK: Record<TicketPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

function priorityVariant(p: TicketPriority) {
  if (p === 'urgent' || p === 'high') return 'danger' as const
  if (p === 'medium') return 'warning' as const
  return 'muted' as const
}

function statusVariant(s: TicketStatus) {
  if (s === 'open') return 'success' as const
  if (s === 'pending') return 'warning' as const
  if (s === 'resolved') return 'secondary' as const
  return 'muted' as const
}

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

export function TicketsPage() {
  const { organization, user } = useApp()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [priorityFilter, setPriorityFilter] = useState<'all' | TicketPriority>('all')
  const [sort, setSort] = useState<'latest' | 'oldest' | 'priority'>('latest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<TicketCategory>('technical')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [description, setDescription] = useState('')

  const { data = [], isLoading } = useQuery({
    queryKey: ['tickets', organization?.id],
    queryFn: () => ticketService.list(organization!.id),
    enabled: !!organization,
  })

  const stats = useMemo(() => {
    const c = { open: 0, pending: 0, resolved: 0, closed: 0, unassigned: 0 }
    for (const t of data) {
      c[t.status]++
      if (!t.assignee) c.unassigned++
    }
    return c
  }, [data])

  const statusChartRows = useMemo(
    () =>
      (['open', 'pending', 'resolved', 'closed'] as TicketStatus[]).map((s) => ({
        status: s,
        count: data.filter((t) => t.status === s).length,
      })),
    [data],
  )

  const priorityChartRows = useMemo(
    () =>
      (['urgent', 'high', 'medium', 'low'] as TicketPriority[]).map((p) => ({
        priority: p,
        count: data.filter((t) => t.priority === p).length,
      })),
    [data],
  )

  const volumeChartRows = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of data) {
      const k = dayKey(t.createdAt)
      map.set(k, (map.get(k) ?? 0) + 1)
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day, count }))
  }, [data])

  const filtered = useMemo(() => {
    let rows = data
    if (priorityFilter !== 'all') rows = rows.filter((t) => t.priority === priorityFilter)
    if (dateFrom) rows = rows.filter((t) => dayKey(t.updatedAt) >= dateFrom)
    if (dateTo) rows = rows.filter((t) => dayKey(t.updatedAt) <= dateTo)
    const query = q.trim().toLowerCase()
    if (query) {
      rows = rows.filter((t) =>
        `${t.id} ${t.subject} ${t.requester} ${t.assignee ?? ''} ${t.priority} ${t.status}`.toLowerCase().includes(query),
      )
    }
    const sorted = [...rows]
    if (sort === 'oldest') sorted.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    else if (sort === 'priority') sorted.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    else sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return sorted
  }, [data, priorityFilter, sort, dateFrom, dateTo, q])

  const { page, setPage, pageSize, paged, total } = usePagedRows(
    filtered,
    `${priorityFilter}|${sort}|${dateFrom}|${dateTo}|${q}`,
  )

  const create = useMutation({
    mutationFn: () =>
      ticketService.create({
        orgId: organization!.id,
        subject,
        category,
        priority,
        status: 'open',
        requester: `${user?.firstName ?? 'You'} ${user?.lastName ?? ''}`.trim(),
        assignee: 'Support Bot',
      }),
    onSuccess: (t) => {
      toast.success('Ticket created')
      setCreateOpen(false)
      setSubject('')
      setDescription('')
      void qc.invalidateQueries({ queryKey: ['tickets'] })
      navigate(`/tickets/${t.id}`)
    },
  })

  return (
    <div>
      <PageHeader
        title="Support"
        description="Tickets, volume, and response overview."
        actions={<Button onClick={() => setCreateOpen(true)}>Create ticket</Button>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Open" value={stats.open} icon={CircleDot} change={12} />
        <MetricCard label="Pending" value={stats.pending} icon={Clock} change={-4} />
        <MetricCard label="Resolved" value={stats.resolved} icon={CheckCircle2} change={10} />
        <MetricCard label="Closed" value={stats.closed} icon={Archive} change={3} />
        <MetricCard label="Unassigned" value={stats.unassigned} icon={UserX} change={-8} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <AppChart
          id="tickets-by-status"
          title="By status"
          kind="bar"
          categoryKey="status"
          series={[{ key: 'count', label: 'Tickets' }]}
          rows={statusChartRows}
          height={200}
          canExport={false}
        />
        <AppChart
          id="tickets-by-priority"
          title="By priority"
          kind="bar"
          categoryKey="priority"
          series={[{ key: 'count', label: 'Tickets' }]}
          rows={priorityChartRows}
          height={200}
          canExport={false}
        />
        <AppChart
          id="tickets-volume"
          title="Created over time"
          kind="line"
          categoryKey="day"
          series={[{ key: 'count', label: 'Created' }]}
          rows={volumeChartRows}
          height={200}
          canExport={false}
        />
      </div>

      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Priority filter">
            <Filter className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High priority</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Sort">
            <ArrowUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="priority">Highest priority</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-nowrap">
          <DateField
            id="tickets-date-from"
            value={dateFrom}
            onChange={setDateFrom}
            placeholder="From date"
            className="min-w-[10rem] flex-1"
          />
          <span className="hidden text-muted-foreground sm:inline" aria-hidden>
            –
          </span>
          <DateField
            id="tickets-date-to"
            value={dateTo}
            onChange={setDateTo}
            placeholder="To date"
            className="min-w-[10rem] flex-1"
          />
        </div>

        <div className="min-w-[200px] flex-1">
          <SearchField value={q} onChange={setQ} placeholder="Search" />
        </div>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading tickets…</p> : null}
      {!isLoading && total === 0 ? (
        <EmptyState title="No tickets" description="Create a ticket when you need help." />
      ) : (
        <>
          <DataTable columns={['Ticket ID', 'Subject', 'Requester', 'Priority', 'Status', 'Assigned To', 'Last Updated']}>
            {paged.map((t) => (
              <tr
                key={t.id}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => navigate(`/tickets/${t.id}`)}
              >
                <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                <td className="px-4 py-3 font-medium">{t.subject}</td>
                <td className="px-4 py-3">{t.requester}</td>
                <td className="px-4 py-3">
                  <Badge variant={priorityVariant(t.priority)}>{t.priority}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(t.status)} className="capitalize">
                    {t.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">{t.assignee ?? '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(t.updatedAt)}</td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create ticket</DialogTitle>
            <DialogDescription>Describe the issue. Attachments are simulated.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="subj">Subject</Label>
              <Input id="subj" className="mt-1" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['technical', 'billing', 'account', 'ocr', 'crm', 'whatsapp', 'email', 'other'].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['low', 'medium', 'high', 'urgent'].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button
              disabled={!subject.trim() || create.isPending}
              onClick={() => {
                void create.mutateAsync().then(async (t) => {
                  if (description.trim()) {
                    await ticketService.reply(t.id, `${user?.firstName ?? 'You'}`, description)
                  }
                })
              }}
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TicketHistoryTimeline({ history }: { history: SupportTicket['history'] }) {
  const items = [...history].reverse()
  return (
    <ol className="relative space-y-4 border-l border-border pl-4">
      {items.map((h) => {
        const highlight = /assign/i.test(h.text)
        return (
          <li key={h.id} className="relative">
            <span
              className={cn(
                'absolute -left-[1.3125rem] top-1.5 size-2.5 rounded-full border-2',
                highlight ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-background',
              )}
              aria-hidden
            />
            <p className="text-sm font-medium leading-snug">{h.text}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(h.at)}</p>
          </li>
        )
      })}
    </ol>
  )
}

function priorityDotTone(p: TicketPriority) {
  if (p === 'urgent' || p === 'high') return 'danger' as const
  if (p === 'medium') return 'warning' as const
  return 'muted' as const
}

function formatTimeOnly(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export function TicketDetailPage() {
  const { id } = useParams()
  const { user, organization } = useApp()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const canAssign = can(user?.role, 'TICKETS_MANAGE')
  const currentUserName = `${user?.firstName ?? 'You'}`.trim()
  const [liveMessages, setLiveMessages] = useState<TicketChatMessage[]>([])

  // BACKEND REQUIRED: Server must independently verify auth, role, org, and ticket ownership.
  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', organization?.id, id, canAssign],
    queryFn: () => ticketService.get(id!, organization?.id, canAssign),
    enabled: !!id && !!organization,
  })

  const socket = useTicketChatSocket(id, {
    orgId: organization?.id,
    enabled: !!id && !!organization,
    onMessage: (message) => {
      setLiveMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
      void qc.invalidateQueries({ queryKey: ['ticket', organization?.id, id] })
    },
    onStatus: (messageId, status) => {
      setLiveMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, status } : m)))
    },
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading ticket…</p>
  if (!ticket) {
    return (
      <EmptyState
        title="Ticket not found"
        description="It may be outside your organization or you may not have access."
        actionLabel="Back"
        onAction={() => navigate('/tickets')}
      />
    )
  }

  const baseMessages = canAssign ? ticket.messages : ticket.messages.filter((m) => !m.internal)
  const visibleMessages = [...baseMessages, ...liveMessages.filter((m) => !baseMessages.some((b) => b.id === m.id))]

  const refresh = () => void qc.invalidateQueries({ queryKey: ['ticket', organization?.id, id] })

  return (
    <div className="flex h-[calc(100dvh-9.5rem)] flex-col overflow-hidden md:h-[calc(100dvh-6.5rem)]">
      <div className="shrink-0">
        <PageHeader
          title={ticket.subject}
          backTo="/tickets"
          backLabel="Back to tickets"
          className="mb-3"
          actions={
            canAssign ? (
              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <MoreHorizontal className="size-4" aria-hidden />
                      More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.message('Copied ticket link')}>Copy link</DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        await ticketService.update(ticket.id, { status: 'pending' })
                        toast.success('Marked pending')
                        refresh()
                      }}
                    >
                      Mark pending
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  onClick={async () => {
                    await ticketService.update(ticket.id, { status: 'resolved' })
                    toast.success('Ticket resolved')
                    refresh()
                  }}
                >
                  <Check className="size-4" aria-hidden />
                  Resolve ticket
                </Button>
              </div>
            ) : null
          }
        />

        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
          <Badge variant="muted" className="rounded-full capitalize">
            {ticket.category.replace(/_/g, ' ')}
          </Badge>
          <Badge variant={priorityVariant(ticket.priority)} className="rounded-full capitalize">
            {ticket.priority} priority
          </Badge>
          <Badge variant={statusVariant(ticket.status)} className="rounded-full capitalize">
            {ticket.status}
          </Badge>
          <span className="text-muted-foreground">
            Requester: <span className="font-medium text-foreground">{ticket.requester}</span>
          </span>
          <span className="text-muted-foreground">
            Assignee: <span className="font-medium text-foreground">{ticket.assignee ?? 'Unassigned'}</span>
          </span>
          {socket.configured ? (
            <span className="text-xs text-muted-foreground">{socket.connected ? 'Live' : 'Reconnecting…'}</span>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          'grid min-h-0 flex-1 gap-4',
          canAssign ? 'lg:grid-cols-[minmax(0,1fr)_300px]' : '',
        )}
      >
        <TicketChat
          className="min-h-0"
          messages={visibleMessages}
          currentUserName={currentUserName}
          peerName={ticket.requester}
          canAssign={canAssign}
          peerPresence="online"
          selfPresence="online"
          connected={socket.connected}
          onTyping={(isTyping) => {
            socket.sendTyping(isTyping)
          }}
          onSend={async (body, files) => {
            const note =
              files.length > 0
                ? `${body}${body ? '\n' : ''}Attached: ${files.map((f) => f.name).join(', ')}`
                : body
            // Internal notes are CMS-only — app chat always sends a normal reply.
            const viaWs = socket.connected && socket.sendMessage(note || 'Attachment', false)
            if (!viaWs) {
              await ticketService.reply(ticket.id, currentUserName, note || 'Attachment', false, canAssign)
            }
            toast.success('Reply sent')
            refresh()
          }}
        />

        {canAssign ? (
          <aside className="min-h-0 space-y-4 overflow-y-auto scrollbar-thin">
            <Card className="space-y-4 p-4">
              <p className="text-sm font-semibold text-muted-foreground">Actions</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status</Label>
                  <Select
                    value={ticket.status}
                    onValueChange={async (v) => {
                      await ticketService.update(ticket.id, { status: v as TicketStatus })
                      toast.success('Status updated')
                      refresh()
                    }}
                  >
                    <SelectTrigger className="mt-1.5 capitalize" aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['open', 'pending', 'resolved', 'closed'] as TicketStatus[]).map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Priority</Label>
                  <Select
                    value={ticket.priority}
                    onValueChange={async (v) => {
                      await ticketService.update(ticket.id, { priority: v as TicketPriority })
                      toast.success('Priority updated')
                      refresh()
                    }}
                  >
                    <SelectTrigger className="mt-1.5 capitalize" aria-label="Priority">
                      <span className="flex items-center gap-2">
                        <StatusDot tone={priorityDotTone(ticket.priority)} />
                        <SelectValue />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">
                          <span className="inline-flex items-center gap-2 capitalize">
                            <StatusDot tone={priorityDotTone(p)} />
                            {p}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await ticketService.update(ticket.id, { assignee: user?.firstName ?? 'You' })
                      toast.success('Assigned to you')
                      refresh()
                    }}
                  >
                    Assign to me
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await ticketService.update(ticket.id, {
                        status: ticket.status === 'closed' ? 'open' : 'closed',
                      })
                      toast.success(ticket.status === 'closed' ? 'Reopened' : 'Closed')
                      refresh()
                    }}
                  >
                    {ticket.status === 'closed' ? 'Reopen ticket' : 'Close ticket'}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-muted-foreground">Ticket details</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="size-8" aria-label="Ticket details menu">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.message('Copied ticket ID')}>Copy ticket ID</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.message('Copied ticket link')}>Copy link</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Ticket ID</dt>
                  <dd className="mt-0.5 font-mono text-xs font-medium">{ticket.id}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Category</dt>
                  <dd className="mt-0.5 font-medium capitalize">{ticket.category.replace(/_/g, ' ')}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Requester</dt>
                  <dd className="mt-0.5 font-medium">{ticket.requester}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Assignee</dt>
                  <dd className="mt-0.5 font-medium">{ticket.assignee ?? 'Unassigned'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Created</dt>
                  <dd className="mt-0.5 font-medium">{formatDate(ticket.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Last updated</dt>
                  <dd className="mt-0.5 font-medium">{formatTimeOnly(ticket.updatedAt)}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-4">
              <p className="mb-3 text-sm font-semibold text-muted-foreground">History</p>
              <TicketHistoryTimeline history={ticket.history} />
            </Card>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
