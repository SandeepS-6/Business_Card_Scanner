import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Check,
  ChevronDown,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
} from 'lucide-react'
import { LeadIntentBadge, LeadStatusBadge, FollowUpStatusBadge } from '@/components/shared/status-badges'
import { ErrorState } from '@/components/shared/empty-state'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/input'
import { SafeExternalLink } from '@/components/security/safe-external-link'
import { useApp } from '@/context/app-context'
import { activityService, commService, contactService, eventService, followUpService, userService } from '@/services/api'
import { cn, formatDate, formatDateTime, initials } from '@/lib/utils'
import type { LeadIntent } from '@/types'
import { toast } from 'sonner'

function sectionTitle(className?: string) {
  return cn('font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground', className)
}

function leadScoreForIntent(intent: LeadIntent) {
  return intent === 'high' ? 86 : intent === 'medium' ? 62 : 34
}

export function ContactDetailPage() {
  const { id = '' } = useParams()
  const { organization, user } = useApp()
  const qc = useQueryClient()
  const idOk = /^[a-zA-Z0-9_-]{1,64}$/.test(id)
  const { data: contact, isLoading, isError, refetch } = useQuery({
    queryKey: ['contact', organization?.id, id],
    queryFn: () => contactService.get(id, organization?.id),
    enabled: idOk,
  })
  const { data: activities = [] } = useQuery({
    queryKey: ['activities', organization?.id, id],
    queryFn: () => activityService.forContact(id),
    enabled: idOk && !!id,
  })
  const { data: followUps = [] } = useQuery({
    queryKey: ['followups-all', contact?.orgId],
    queryFn: async () => (contact ? followUpService.list(contact.orgId) : []),
    enabled: !!contact,
  })
  const { data: comms = [] } = useQuery({
    queryKey: ['comms', contact?.orgId],
    queryFn: () => commService.list(contact!.orgId),
    enabled: !!contact,
  })
  const { data: events = [] } = useQuery({
    queryKey: ['events', contact?.orgId],
    queryFn: () => eventService.list(contact!.orgId),
    enabled: !!contact,
  })
  const [note, setNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front')

  const relatedEvents = useMemo(() => {
    if (!contact) return []
    const primary = events.filter((e) => e.id === contact.eventId)
    const rest = events.filter((e) => e.id !== contact.eventId).slice(0, 2)
    return [...primary, ...rest].slice(0, 3)
  }, [events, contact])

  if (!idOk) return <ErrorState title="Invalid contact" description="That link is not valid." />
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading contact…</p>
  if (isError || !contact) {
    return <ErrorState title="Contact not found" description="This contact may have been removed." onRetry={() => void refetch()} />
  }
  if (user?.role !== 'super_admin' && organization && contact.orgId !== organization.id) {
    return <ErrorState title="Access denied" description="This contact is outside your organization." />
  }

  const owner = userService.get(contact.ownerId)
  const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : '—'
  const location = [contact.city, contact.state, contact.country].filter(Boolean).join(', ') || '—'
  const score = leadScoreForIntent(contact.leadIntent)
  const contactFollowUps = followUps.filter((f) => f.contactId === contact.id)
  const openFollowUps = contactFollowUps.filter((f) => f.status !== 'completed' && f.status !== 'cancelled')
  const completedCount = contactFollowUps.filter((f) => f.status === 'completed').length
  const contactComms = comms.filter((c) => c.contactId === contact.id)
  const primaryEvent = events.find((e) => e.id === contact.eventId)

  const noteLines = (contact.notes ?? '')
    .split('\n')
    .map((n) => n.trim())
    .filter(Boolean)
  const notePreviews = noteLines.length
    ? noteLines.map((body, i) => ({
        id: `n-${i}`,
        author: i === 0 ? ownerName : 'Devan Rao',
        at: i === 0 ? '3 hours ago' : 'Yesterday',
        body,
      }))
    : [
        {
          id: 'n-empty',
          author: ownerName,
          at: 'Just now',
          body: 'No notes yet — add the first conversation detail.',
        },
      ]

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/contacts"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Contacts
        </Link>
        <p className="text-xs text-muted-foreground">Last updated {formatDateTime(contact.lastActivity)}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <Avatar className="size-14 rounded-xl bg-teal-800 text-white">
              <AvatarFallback className="rounded-xl bg-teal-800 text-base font-semibold text-white">
                {initials(contact.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{contact.fullName}</h1>
                <p className="text-sm text-muted-foreground">
                  {contact.jobTitle} @ {contact.company}
                </p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0" aria-hidden />
                  {contact.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0" aria-hidden />
                  {contact.phone}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {location}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <LeadStatusBadge status={contact.leadStatus} />
                <LeadIntentBadge intent={contact.leadIntent} />
                <Badge variant="outline" className="font-medium">
                  Owner: {ownerName}
                </Badge>
                <Badge variant="outline" className="font-medium">
                  Source: {contact.source}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button onClick={() => toast.message('Follow-up created (mock)')}>
              <Plus className="size-4" /> Add follow-up
            </Button>
            <Button variant="outline" onClick={() => toast.message('Edit contact (mock)')}>
              <Pencil className="size-4" /> Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-muted">
                More <ChevronDown className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast.message('Email composer (mock)')}>Send email</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.message('WhatsApp composer (mock)')}>WhatsApp</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.message('Assign owner (mock)')}>Assign owner</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className={sectionTitle()}>Lead Snapshot</CardTitle>
              <div className="flex gap-1.5">
                <LeadStatusBadge status={contact.leadStatus} />
                <LeadIntentBadge intent={contact.leadIntent} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-display text-3xl font-semibold tabular-nums tracking-tight">{score}</p>
                <p className="text-sm text-muted-foreground">Lead score</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${score}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-teal-700 dark:text-teal-300">
                  <span className="inline-flex items-center gap-1">
                    <Check className="size-3.5" aria-hidden /> Budget confirmed
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Check className="size-3.5" aria-hidden /> Decision maker
                  </span>
                </div>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Owner</dt>
                  <dd className="font-medium">{ownerName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Source</dt>
                  <dd className="font-medium">{contact.source}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Event</dt>
                  <dd className="font-medium">
                    {primaryEvent ? (
                      <Link className="text-primary hover:underline" to={`/events/${primaryEvent.id}`}>
                        {primaryEvent.name}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Tags</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {(contact.tags.length ? contact.tags : ['Enterprise', 'Partnership']).map((t) => (
                      <Badge key={t} variant="outline" className="capitalize">
                        {t}
                      </Badge>
                    ))}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className={sectionTitle()}>Contact Information</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => toast.message('Edit contact (mock)')}>
                Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ['First name', contact.firstName],
                  ['Last name', contact.lastName],
                  ['Job title', contact.jobTitle],
                  ['Company', contact.company],
                  ['Email', contact.email],
                  ['Phone', contact.phone],
                  ['Website', contact.website ?? '—'],
                  ['LinkedIn', contact.linkedin ?? '—'],
                  ['Location', location],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="break-all font-medium">
                      {label === 'Website' && contact.website ? (
                        <SafeExternalLink href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}>
                          {contact.website}
                        </SafeExternalLink>
                      ) : label === 'LinkedIn' && contact.linkedin ? (
                        <SafeExternalLink href={contact.linkedin}>{contact.linkedin}</SafeExternalLink>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <Button variant="outline" size="sm" onClick={() => toast.message('Email composer (mock)')}>
                  <Mail className="size-4" /> Email
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.message('Call (mock)')}>
                  <Phone className="size-4" /> Call
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.message('WhatsApp (mock)')}>
                  <MessageCircle className="size-4" /> WhatsApp
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.message('Map (mock)')}>
                  <MapPin className="size-4" /> Map
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className={sectionTitle()}>Notes</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setAddingNote((v) => !v)}>
                <Plus className="size-3.5" /> Add note
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {addingNote ? (
                <div className="space-y-2">
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" rows={3} />
                  <Button
                    size="sm"
                    onClick={async () => {
                      await contactService.update(contact.id, { notes: [contact.notes, note].filter(Boolean).join('\n') })
                      setNote('')
                      setAddingNote(false)
                      void qc.invalidateQueries({ queryKey: ['contact', organization?.id, id] })
                      toast.success('Note saved')
                    }}
                  >
                    Save note
                  </Button>
                </div>
              ) : null}
              {notePreviews.slice(0, 2).map((n) => (
                <div key={n.id} className="rounded-lg border border-border p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px] font-medium">{initials(n.author)}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">{n.author}</p>
                    <p className="text-xs text-muted-foreground">{n.at}</p>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{n.body}</p>
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => toast.message('Notes history (mock)')}
              >
                View all {Math.max(noteLines.length, 3)} notes
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className={sectionTitle()}>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l border-border pl-5">
                {activities.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[23px] top-1.5 size-2.5 rounded-full bg-teal-600" />
                    <p className="text-sm font-medium">{a.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className={sectionTitle()}>Follow-ups</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => toast.message('Follow-up created (mock)')}>
                <Plus className="size-3.5" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {openFollowUps.length === 0 ? <p className="text-sm text-muted-foreground">No open follow-ups.</p> : null}
              {openFollowUps.map((f) => {
                const assignee = userService.get(f.assignedUserId)
                const isOverdue = f.status === 'overdue'
                return (
                  <div
                    key={f.id}
                    className={cn('rounded-lg border border-border p-3', !isOverdue && 'bg-teal-50/60 dark:bg-teal-950/20')}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 capitalize">
                        <Mail className="size-3.5" aria-hidden /> {f.channel}
                      </span>
                      <span>·</span>
                      <span>{formatDateTime(f.dueDate)}</span>
                      <FollowUpStatusBadge status={f.status} />
                    </div>
                    <p className="text-sm font-medium">{f.notes || `${f.channel} follow-up`}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned'}
                    </p>
                    {!isOverdue ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => toast.success('Marked complete (mock)')}>
                          Mark complete
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toast.message('Edit follow-up (mock)')}>
                          Edit
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )
              })}
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => toast.message('Follow-up history (mock)')}
              >
                {completedCount} completed follow-up · View history
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className={sectionTitle()}>Events</CardTitle>
              <Link to="/events" className="text-xs font-medium text-primary hover:underline">
                View all events
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {relatedEvents.length === 0 ? <p className="text-sm text-muted-foreground">No events linked.</p> : null}
              {relatedEvents.map((e, i) => (
                <Link
                  key={e.id}
                  to={`/events/${e.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Calendar className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(e.startDate)} · {e.location}
                    </p>
                  </div>
                  <Badge variant="outline">{i === 0 ? 'Visitor' : i === 1 ? 'Speaker' : 'Guest'}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className={sectionTitle()}>Communication</CardTitle>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => toast.message('Communication history (mock)')}
              >
                View history
              </button>
            </CardHeader>
            <CardContent className="space-y-2">
              {contactComms.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> : null}
              {contactComms.slice(0, 3).map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{c.subject || (c.channel === 'email' ? 'Email sent' : 'Message sent')}</p>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {c.channel} · Outbound
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.sentAt ? formatDateTime(c.sentAt) : c.status}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className={sectionTitle()}>Business Card</CardTitle>
              <div className="flex rounded-md border border-border p-0.5 text-xs">
                {(['front', 'back'] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    className={cn(
                      'rounded px-2 py-1 font-medium capitalize',
                      cardSide === side ? 'bg-muted text-foreground' : 'text-muted-foreground',
                    )}
                    onClick={() => setCardSide(side)}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.cardImageUrl ? (
                <img
                  src={contact.cardImageUrl}
                  alt={`${contact.fullName} business card ${cardSide}`}
                  className="aspect-[1.6/1] w-full rounded-lg border border-border bg-muted object-cover"
                />
              ) : (
                <div className="flex aspect-[1.6/1] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                  No card image
                </div>
              )}
              <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                <div>
                  <dt>Captured</dt>
                  <dd className="font-medium text-foreground">{formatDate(contact.createdAt)}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd className="font-medium text-foreground">Camera scan</dd>
                </div>
                <div>
                  <dt>Captured by</dt>
                  <dd className="font-medium text-foreground">{ownerName}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.message('Open full image (mock)')}>
                  Open full image
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.message('Re-scan (mock)')}>
                  Re-scan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
