import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { SearchField } from '@/components/shared/search-field'
import { EmptyState } from '@/components/shared/empty-state'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApp } from '@/context/app-context'
import { can } from '@/security/permissions'
import { ticketService } from '@/services/features-api'
import { formatDateTime } from '@/lib/utils'
import type { TicketCategory, TicketPriority, TicketStatus } from '@/types/features'
import { toast } from 'sonner'

const STATUS_FILTERS: Array<TicketStatus | 'all'> = ['all', 'open', 'pending', 'resolved', 'closed']

function priorityVariant(p: TicketPriority) {
  if (p === 'urgent' || p === 'high') return 'danger' as const
  if (p === 'medium') return 'warning' as const
  return 'muted' as const
}

export function TicketsPage() {
  const { organization, user } = useApp()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all')
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

  const filtered = useMemo(() => {
    const byStatus = status === 'all' ? data : data.filter((t) => t.status === status)
    const query = q.trim().toLowerCase()
    if (!query) return byStatus
    return byStatus.filter((t) =>
      `${t.id} ${t.subject} ${t.requester} ${t.assignee ?? ''} ${t.priority}`.toLowerCase().includes(query),
    )
  }, [data, status, q])

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
        title="Support tickets"
        description="Lightweight helpdesk — conversation UI only, no backend."
        actions={<Button onClick={() => setCreateOpen(true)}>Create ticket</Button>}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchField value={q} onChange={setQ} placeholder="Search tickets…" />
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((s) => (
            <Button key={s} size="sm" variant={status === s ? 'default' : 'outline'} onClick={() => setStatus(s)}>
              {s === 'all' ? 'All' : s}
            </Button>
          ))}
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading tickets…</p> : null}
      {!isLoading && filtered.length === 0 ? (
        <EmptyState title="No tickets" description="Create a ticket when you need help." />
      ) : (
        <DataTable columns={['Ticket ID', 'Subject', 'Requester', 'Priority', 'Status', 'Assigned To', 'Last Updated']}>
          {filtered.map((t) => (
            <tr key={t.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/tickets/${t.id}`)}>
              <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
              <td className="px-4 py-3 font-medium">{t.subject}</td>
              <td className="px-4 py-3">{t.requester}</td>
              <td className="px-4 py-3">
                <Badge variant={priorityVariant(t.priority)}>{t.priority}</Badge>
              </td>
              <td className="px-4 py-3 capitalize">{t.status}</td>
              <td className="px-4 py-3">{t.assignee ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(t.updatedAt)}</td>
            </tr>
          ))}
        </DataTable>
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

export function TicketDetailPage() {
  const { id } = useParams()
  const { user, organization } = useApp()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const canManage = can(user?.role, 'TICKETS_MANAGE')
  const [reply, setReply] = useState('')
  const [internal, setInternal] = useState(false)

  // BACKEND REQUIRED: Server must independently verify auth, role, org, and ticket ownership.
  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', organization?.id, id, canManage],
    queryFn: () => ticketService.get(id!, organization?.id, canManage),
    enabled: !!id && !!organization,
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

  const visibleMessages = canManage ? ticket.messages : ticket.messages.filter((m) => !m.internal)

  return (
    <div>
      <PageHeader
        title={ticket.subject}
        description={`${ticket.id} · ${ticket.category}`}
        backTo="/tickets"
        backLabel="Back to tickets"
      />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Badge variant={priorityVariant(ticket.priority)}>{ticket.priority}</Badge>
        <Badge variant="secondary" className="capitalize">
          {ticket.status}
        </Badge>
        <span className="text-muted-foreground">Assignee: {ticket.assignee ?? 'Unassigned'}</span>
        <span className="text-muted-foreground">Requester: {ticket.requester}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          <Card className="mb-4 space-y-4 p-4">
            {visibleMessages.map((m) => (
              <div
                key={m.id}
                className={`rounded-md border border-border p-3 text-sm ${m.internal ? 'bg-amber-500/5' : 'bg-card'}`}
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {m.author}
                    {m.internal ? ' · Internal note' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(m.at)}</p>
                </div>
                {/* SECURITY: plain text only — never render HTML from tickets */}
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
          </Card>
          <Card className="space-y-3 p-4">
            <Label htmlFor="reply">Reply</Label>
            <Textarea id="reply" value={reply} onChange={(e) => setReply(e.target.value)} />
            {canManage ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                Internal note
              </label>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!reply.trim()}
                onClick={async () => {
                  await ticketService.reply(
                    ticket.id,
                    `${user?.firstName ?? 'You'}`,
                    reply,
                    internal,
                    canManage,
                  )
                  setReply('')
                  setInternal(false)
                  toast.success(internal && canManage ? 'Note added' : 'Reply sent')
                  void qc.invalidateQueries({ queryKey: ['ticket', organization?.id, id] })
                }}
              >
                Send
              </Button>
              <Button variant="outline" onClick={() => toast.message('Attach file (mock)')}>
                Attach file
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-2 p-4">
            <p className="font-semibold">Actions</p>
            <Select
              value={ticket.status}
              onValueChange={async (v) => {
                await ticketService.update(ticket.id, { status: v as TicketStatus })
                toast.success('Status updated')
                void qc.invalidateQueries({ queryKey: ['ticket', organization?.id, id] })
              }}
            >
              <SelectTrigger aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.filter((s) => s !== 'all').map((s) => (
                  <SelectItem key={s} value={s!}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={ticket.priority}
              onValueChange={async (v) => {
                await ticketService.update(ticket.id, { priority: v as TicketPriority })
                toast.success('Priority updated')
                void qc.invalidateQueries({ queryKey: ['ticket', organization?.id, id] })
              }}
            >
              <SelectTrigger aria-label="Priority">
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
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await ticketService.update(ticket.id, { assignee: user?.firstName ?? 'You' })
                toast.success('Assigned to you')
                void qc.invalidateQueries({ queryKey: ['ticket', organization?.id, id] })
              }}
            >
              Assign to me
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await ticketService.update(ticket.id, { status: ticket.status === 'closed' ? 'open' : 'closed' })
                toast.success(ticket.status === 'closed' ? 'Reopened' : 'Closed')
                void qc.invalidateQueries({ queryKey: ['ticket', organization?.id, id] })
              }}
            >
              {ticket.status === 'closed' ? 'Reopen' : 'Close ticket'}
            </Button>
          </Card>
          <Card className="p-4">
            <p className="mb-2 font-semibold">History</p>
            <ul className="space-y-2 text-sm">
              {ticket.history.map((h) => (
                <li key={h.id}>
                  <p>{h.text}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(h.at)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
