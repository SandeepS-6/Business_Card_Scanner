import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { EventStatusBadge, LeadQualityBadge, LeadStatusBadge } from '@/components/shared/status-badges'
import { AppChart } from '@/components/charts/app-chart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DateField } from '@/components/shared/date-field'
import { useApp } from '@/context/app-context'
import { contactService, eventService, followUpService, userService } from '@/services/api'
import { dashboardService } from '@/services/api'
import type { CustomField, FieldType } from '@/types'
import { can } from '@/security/permissions'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { GripVertical, Plus, Trash2 } from 'lucide-react'

const eventSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  location: z.string().min(1),
})

export function EventsPage() {
  const { organization } = useApp()
  const navigate = useNavigate()
  const orgId = organization?.id ?? ''
  const { data = [], isLoading } = useQuery({ queryKey: ['events', orgId], queryFn: () => eventService.list(orgId), enabled: !!orgId })
  const [open, setOpen] = useState(false)
  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: { name: '', description: '', startDate: '', endDate: '', location: '' },
  })

  return (
    <div>
      <PageHeader
        title="Events"
        description="Manage trade shows and field events."
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Create Event</Button>}
      />
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {!isLoading && data.length === 0 ? (
        <EmptyState title="No events" description="Create an event to start capturing cards." actionLabel="Create Event" onAction={() => setOpen(true)} />
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:hidden">
            {data.map((e) => (
              <Link key={e.id} to={`/events/${e.id}`} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{e.name}</p>
                  <EventStatusBadge status={e.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{e.location}</p>
                <p className="mt-2 text-xs text-muted-foreground">{e.cardsScanned} cards · {e.leadsCount} leads</p>
              </Link>
            ))}
          </div>
          <div className="hidden lg:block">
            <DataTable columns={['Event name', 'Date', 'Location', 'Owner', 'Cards scanned', 'Contacts', 'Leads', 'Status']}>
              {data.map((e) => {
                const owner = userService.get(e.ownerId)
                return (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3"><Link className="font-medium text-primary hover:underline" to={`/events/${e.id}`}>{e.name}</Link></td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(e.startDate)} – {formatDate(e.endDate)}</td>
                    <td className="px-4 py-3">{e.location}</td>
                    <td className="px-4 py-3">{owner ? `${owner.firstName} ${owner.lastName}` : '—'}</td>
                    <td className="px-4 py-3">{e.cardsScanned}</td>
                    <td className="px-4 py-3">{e.contactsCount}</td>
                    <td className="px-4 py-3">{e.leadsCount}</td>
                    <td className="px-4 py-3"><EventStatusBadge status={e.status} /></td>
                  </tr>
                )
              })}
            </DataTable>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-visible">
          <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(() => {
              toast.success('Event created (mock)')
              setOpen(false)
              navigate('/events')
            })}
          >
            <div className="space-y-1"><Label>Event name</Label><Input {...form.register('name')} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea {...form.register('description')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="event-start">Start date</Label>
                <DateField
                  id="event-start"
                  value={form.watch('startDate')}
                  onChange={(v) => form.setValue('startDate', v, { shouldValidate: true })}
                  error={form.formState.errors.startDate?.message}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="event-end">End date</Label>
                <DateField
                  id="event-end"
                  value={form.watch('endDate')}
                  onChange={(v) => form.setValue('endDate', v, { shouldValidate: true })}
                  error={form.formState.errors.endDate?.message}
                />
              </div>
            </div>
            <div className="space-y-1"><Label>Location</Label><Input {...form.register('location')} /></div>
            <div className="space-y-1">
              <Label>Event owner</Label>
              <Select defaultValue="user-nexus-admin">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user-nexus-admin">Ava Chen</SelectItem>
                  <SelectItem value="user-nexus-1">Maya Patel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="team" defaultChecked /><Label htmlFor="team" className="font-normal">Include assigned team members</Label>
            </div>
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function EventDetailPage() {
  const { id = '' } = useParams()
  const { user, organization } = useApp()
  const canExport = can(user?.role, 'EVENTS_VIEW')
  // BACKEND REQUIRED: Server must verify event belongs to caller's organization.
  const { data: event, isLoading: eventLoading, isFetched } = useQuery({
    queryKey: ['event', organization?.id, id],
    queryFn: () => eventService.get(id, organization?.id),
    enabled: !!id && !!organization,
  })
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', event?.orgId],
    queryFn: () => contactService.list(event!.orgId),
    enabled: !!event,
  })
  const { data: followUps = [] } = useQuery({
    queryKey: ['followups', event?.orgId],
    queryFn: () => followUpService.list(event!.orgId),
    enabled: !!event,
  })
  const [fields, setFields] = useState<CustomField[] | null>(null)
  const charts = dashboardService.charts()

  if (eventLoading || !organization) return <p className="text-sm text-muted-foreground">Loading event…</p>
  if (isFetched && !event) {
    return <p className="text-sm text-muted-foreground">Event not found or outside your organization.</p>
  }
  if (!event) return <p className="text-sm text-muted-foreground">Loading event…</p>
  const customFields = fields ?? event.customFields
  const eventContacts = contacts.filter((c) => c.eventId === event.id)

  const metrics = [
    { label: 'Cards scanned', value: event.cardsScanned },
    { label: 'Successful extraction', value: Math.round(event.cardsScanned * 0.94) },
    { label: 'Needs review', value: Math.round(event.cardsScanned * 0.08) },
    { label: 'Duplicates', value: Math.round(event.cardsScanned * 0.06) },
    { label: 'Unique contacts', value: event.contactsCount },
    { label: 'Qualified leads', value: Math.round(event.leadsCount * 0.37) },
    { label: 'Hot leads', value: Math.round(event.leadsCount * 0.14) },
    { label: 'Follow-ups pending', value: followUps.filter((f) => f.eventId === event.id && f.status === 'pending').length },
  ]

  return (
    <div>
      <PageHeader title={event.name} description={`${event.location} · ${formatDate(event.startDate)} – ${formatDate(event.endDate)}`} actions={<EventStatusBadge status={event.status} />} />
      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap">
          {['overview', 'contacts', 'leads', 'scans', 'team', 'follow-ups', 'analytics', 'settings'].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <Card key={m.label}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{m.label}</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{m.value}</p></CardContent></Card>
          ))}
        </TabsContent>
        <TabsContent value="contacts">
          <DataTable columns={['Name', 'Company', 'Status', 'Quality']}>
            {eventContacts.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3"><Link className="text-primary hover:underline" to={`/contacts/${c.id}`}>{c.fullName}</Link></td>
                <td className="px-4 py-3">{c.company}</td>
                <td className="px-4 py-3"><LeadStatusBadge status={c.leadStatus} /></td>
                <td className="px-4 py-3"><LeadQualityBadge quality={c.leadQuality} /></td>
              </tr>
            ))}
          </DataTable>
        </TabsContent>
        <TabsContent value="leads"><p className="text-sm text-muted-foreground">{event.leadsCount} leads linked to this event. See Leads board for pipeline.</p></TabsContent>
        <TabsContent value="scans"><p className="text-sm text-muted-foreground">{event.cardsScanned} scans recorded (mock list).</p></TabsContent>
        <TabsContent value="team" className="space-y-2">
          {event.teamIds.map((uid) => {
            const u = userService.get(uid)
            return <Card key={uid}><CardContent className="pt-5 text-sm">{u ? `${u.firstName} ${u.lastName} · ${u.email}` : uid}</CardContent></Card>
          })}
        </TabsContent>
        <TabsContent value="follow-ups" className="space-y-2">
          {followUps.filter((f) => f.eventId === event.id).map((f) => (
            <Card key={f.id}><CardContent className="pt-5 text-sm">{f.channel} · {f.status} · due {formatDate(f.dueDate)}</CardContent></Card>
          ))}
        </TabsContent>
        <TabsContent value="analytics" className="grid gap-4 lg:grid-cols-2">
          <AppChart
            id={`event-${event.id}-scans-over-time`}
            title="Scans over time"
            kind="bar"
            categoryKey="day"
            series={[{ key: 'scans', label: 'Scans' }]}
            rows={charts.scansOverTime}
            height={224}
            canExport={canExport}
            emptyMessage="No scan activity for this event period."
          />
          <AppChart
            id={`event-${event.id}-leads-by-quality`}
            title="Leads by quality"
            kind="bar"
            categoryKey="quality"
            series={[{ key: 'count', label: 'Leads' }]}
            rows={charts.leadQuality}
            height={224}
            canExport={canExport}
            emptyMessage="No quality data for this event."
          />
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Custom event fields</CardTitle>
              <Button
                size="sm"
                onClick={() =>
                  setFields([
                    ...customFields,
                    {
                      id: `cf-${Date.now()}`,
                      eventId: event.id,
                      label: 'New field',
                      type: 'text',
                      required: false,
                      order: customFields.length,
                    },
                  ])
                }
              >
                <Plus className="size-4" /> Add field
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {customFields.length === 0 ? <p className="text-sm text-muted-foreground">No custom fields yet.</p> : null}
              {customFields.map((f, idx) => (
                <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-3">
                  <GripVertical className="size-4 text-muted-foreground" aria-hidden />
                  <Input
                    className="max-w-[180px]"
                    value={f.label}
                    onChange={(e) =>
                      setFields(customFields.map((x) => (x.id === f.id ? { ...x, label: e.target.value } : x)))
                    }
                  />
                  <Select
                    value={f.type}
                    onValueChange={(v) =>
                      setFields(customFields.map((x) => (x.id === f.id ? { ...x, type: v as FieldType } : x)))
                    }
                  >
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['text', 'number', 'dropdown', 'multi_select', 'date', 'checkbox'] as FieldType[]).map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={f.required}
                      onCheckedChange={(v) =>
                        setFields(customFields.map((x) => (x.id === f.id ? { ...x, required: !!v } : x)))
                      }
                    />
                    Required
                  </label>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete field"
                    onClick={() => setFields(customFields.filter((x) => x.id !== f.id))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={idx === 0}
                    onClick={() => {
                      const next = [...customFields]
                      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
                      setFields(next.map((x, i) => ({ ...x, order: i })))
                    }}
                  >
                    Up
                  </Button>
                </div>
              ))}
              <Button onClick={() => toast.success('Custom fields saved (mock)')}>Save fields</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
