import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { LeadQualityBadge, LeadStatusBadge, FollowUpStatusBadge } from '@/components/shared/status-badges'
import { ErrorState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/input'
import { SafeExternalLink } from '@/components/security/safe-external-link'
import { useApp } from '@/context/app-context'
import { activityService, commService, contactService, eventService, followUpService, userService } from '@/services/api'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

export function ContactDetailPage() {
  const { id = '' } = useParams()
  const { organization, user } = useApp()
  const qc = useQueryClient()
  // SECURITY: Backend IDOR protection required — possession of id is not authorization.
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
  const [note, setNote] = useState('')

  if (!idOk) {
    return <ErrorState title="Invalid contact" description="That link is not valid." />
  }
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading contact…</p>
  if (isError || !contact) {
    return <ErrorState title="Contact not found" description="This contact may have been removed." onRetry={() => void refetch()} />
  }
  // SECURITY: Backend tenant isolation required.
  if (user?.role !== 'super_admin' && organization && contact.orgId !== organization.id) {
    return <ErrorState title="Access denied" description="This contact is outside your organization." />
  }

  const owner = userService.get(contact.ownerId)
  const contactFollowUps = followUps.filter((f) => f.contactId === contact.id)
  const contactComms = comms.filter((c) => c.contactId === contact.id)

  return (
    <div>
      <PageHeader
        title={contact.fullName}
        description={`${contact.jobTitle} · ${contact.company}`}
        actions={
          <>
            <Button variant="outline" onClick={() => toast.message('Email composer (mock)')}>Send email</Button>
            <Button variant="outline" onClick={() => toast.message('WhatsApp composer (mock)')}>WhatsApp</Button>
            <Button onClick={() => toast.message('Follow-up created (mock)')}>Create follow-up</Button>
          </>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap">
          {['overview', 'lead', 'events', 'notes', 'follow-ups', 'communication', 'activity', 'card'].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">{t.replace('-', ' ')}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Email:</span> {contact.email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {contact.phone}</p>
              {contact.website ? (
                <p>
                  <span className="text-muted-foreground">Website:</span>{' '}
                  <SafeExternalLink href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}>
                    {contact.website}
                  </SafeExternalLink>
                </p>
              ) : null}
              {contact.linkedin ? (
                <p>
                  <span className="text-muted-foreground">LinkedIn:</span>{' '}
                  <SafeExternalLink href={contact.linkedin}>{contact.linkedin}</SafeExternalLink>
                </p>
              ) : null}
              <p><span className="text-muted-foreground">Location:</span> {[contact.city, contact.state, contact.country].filter(Boolean).join(', ') || '—'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Lead snapshot</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <LeadStatusBadge status={contact.leadStatus} />
              <LeadQualityBadge quality={contact.leadQuality} />
              <p className="w-full text-sm text-muted-foreground">Owner: {owner ? `${owner.firstName} ${owner.lastName}` : '—'} · Source: {contact.source}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lead">
          <Card>
            <CardContent className="space-y-2 pt-6 text-sm">
              <p>Status: <LeadStatusBadge status={contact.leadStatus} /></p>
              <p>Quality: <LeadQualityBadge quality={contact.leadQuality} /></p>
              <p>Owner: {owner ? `${owner.firstName} ${owner.lastName}` : '—'}</p>
              <p>Source: {contact.source}</p>
              <p>Event: {contact.eventId ? <Link className="text-primary hover:underline" to={`/events/${contact.eventId}`}>{contact.eventId}</Link> : '—'}</p>
              {contact.customFields ? (
                <div className="pt-2">
                  <p className="font-medium">Custom fields</p>
                  {Object.entries(contact.customFields).map(([k, v]) => (
                    <p key={k} className="text-muted-foreground">{k}: <span className="text-foreground">{String(v)}</span></p>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardContent className="pt-6 text-sm">
              {contact.eventId ? (
                <EventLink id={contact.eventId} />
              ) : (
                <p className="text-muted-foreground">No events associated.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <p className="text-sm whitespace-pre-wrap">{contact.notes || 'No notes yet.'}</p>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" />
              <Button
                onClick={async () => {
                  await contactService.update(contact.id, { notes: [contact.notes, note].filter(Boolean).join('\n') })
                  setNote('')
                  void qc.invalidateQueries({ queryKey: ['contact', organization?.id, id] })
                  toast.success('Note saved')
                }}
              >
                Save note
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="follow-ups" className="space-y-2">
          {contactFollowUps.length === 0 ? <p className="text-sm text-muted-foreground">No follow-ups.</p> : null}
          {contactFollowUps.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-5 text-sm">
                <div>
                  <p className="font-medium capitalize">{f.channel}</p>
                  <p className="text-muted-foreground">Due {formatDateTime(f.dueDate)}</p>
                </div>
                <FollowUpStatusBadge status={f.status} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="communication" className="space-y-2">
          {contactComms.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> : null}
          {contactComms.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-5 text-sm">
                <p className="font-medium capitalize">{c.channel} · {c.status}</p>
                <p className="text-muted-foreground">{c.subject || c.body}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="activity">
          <ol className="relative space-y-4 border-l border-border pl-6">
            {activities.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[29px] top-1 size-3 rounded-full bg-primary" />
                <p className="text-sm font-medium">{a.description}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</p>
              </li>
            ))}
          </ol>
        </TabsContent>

        <TabsContent value="card">
          {contact.cardImageUrl ? (
            <img src={contact.cardImageUrl} alt="Original scanned card" className="max-w-xl rounded-lg border border-border" />
          ) : (
            <p className="text-sm text-muted-foreground">No card image on file.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EventLink({ id }: { id: string }) {
  const { data } = useQuery({ queryKey: ['event', id], queryFn: () => eventService.get(id) })
  if (!data) return <p>{id}</p>
  return <Link className="text-primary hover:underline" to={`/events/${id}`}>{data.name}</Link>
}
