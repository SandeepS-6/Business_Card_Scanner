import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { MetricCard } from '@/components/shared/metric-card'
import { DataTable, Pagination } from '@/components/shared/data-table'
import { SearchField } from '@/components/shared/search-field'
import { EmptyState } from '@/components/shared/empty-state'
import { FollowUpStatusBadge } from '@/components/shared/status-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CardSkeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/context/app-context'
import { usePagedRows } from '@/hooks/use-page-size'
import { contactService, dashboardService, followUpService, userService } from '@/services/api'
import { formatDate, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { BarChart3, ClipboardList, Copy, Plus, Users } from 'lucide-react'

export function FollowUpsPage() {
  const { organization } = useApp()
  const orgId = organization?.id ?? ''
  const { data = [] } = useQuery({ queryKey: ['followups', orgId], queryFn: () => followUpService.list(orgId), enabled: !!orgId })
  const { data: contacts = [] } = useQuery({ queryKey: ['contacts', orgId], queryFn: () => contactService.list(orgId), enabled: !!orgId })
  const { data: members = [] } = useQuery({ queryKey: ['users', orgId], queryFn: () => userService.byOrg(orgId), enabled: !!orgId })
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', orgId],
    queryFn: () => dashboardService.stats(orgId),
    enabled: !!orgId,
  })
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [viewMonth] = useState(new Date(2026, 8, 1))
  const [contactId, setContactId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [channel, setChannel] = useState('email')

  useEffect(() => {
    if (!open) return
    if (!contactId && contacts[0]) setContactId(contacts[0].id)
    if (!assigneeId && members[0]) setAssigneeId(members[0].id)
  }, [open, contacts, members, contactId, assigneeId])

  const listRows = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return data
    return data.filter((f) => {
      const c = contacts.find((x) => x.id === f.contactId)
      const u = userService.get(f.assignedUserId)
      return `${c?.fullName ?? ''} ${f.channel} ${f.status} ${u?.firstName ?? ''}`.toLowerCase().includes(query)
    })
  }, [data, q, contacts])

  const { page, setPage, pageSize, paged, total } = usePagedRows(listRows, q)

  const byDay = useMemo(() => {
    const map = new Map<string, typeof data>()
    data.forEach((f) => {
      const key = f.dueDate.slice(0, 10)
      map.set(key, [...(map.get(key) ?? []), f])
    })
    return map
  }, [data])

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)
    return d.toISOString().slice(0, 10)
  })

  const kpis = [
    { label: 'Follow-ups Pending', value: stats?.followUpsPending, icon: ClipboardList, change: -4 },
    { label: 'High Intent Leads', value: stats?.highIntentLeads, icon: Users, change: 15 },
    { label: 'OCR Success Rate', value: stats ? `${stats.ocrSuccessRate}%` : undefined, icon: BarChart3, change: 2 },
    { label: 'Duplicate Rate', value: stats ? `${stats.duplicateRate}%` : undefined, icon: Copy, change: -3 },
  ]

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="List and calendar views for outreach tasks."
        actions={
          <Button
            onClick={() => {
              setContactId(contacts[0]?.id ?? '')
              setAssigneeId(members[0]?.id ?? '')
              setChannel('email')
              setOpen(true)
            }}
          >
            <Plus className="size-4" /> Create Follow-up
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : kpis.map((k) => (
              <MetricCard key={k.label} label={k.label} value={k.value} icon={k.icon} change={k.change} />
            ))}
      </div>

      <Tabs defaultValue="list">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
          <SearchField value={q} onChange={setQ} placeholder="Search follow-ups…" />
        </div>
        <TabsContent value="list">
          {total === 0 ? (
            <EmptyState
              title="No follow-ups"
              description={q ? 'No follow-ups match your search.' : 'Create a follow-up from a contact or lead.'}
              actionLabel="Create"
              onAction={() => setOpen(true)}
            />
          ) : (
            <>
              <DataTable columns={['Contact', 'Lead', 'Event', 'Assigned', 'Due date', 'Channel', 'Status']}>
                {paged.map((f) => {
                  const c = contacts.find((x) => x.id === f.contactId)
                  const u = userService.get(f.assignedUserId)
                  return (
                    <tr key={f.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">{c?.fullName ?? f.contactId}</td>
                      <td className="px-4 py-3">{f.leadId ?? '—'}</td>
                      <td className="px-4 py-3">{f.eventId ?? '—'}</td>
                      <td className="px-4 py-3">{u ? `${u.firstName} ${u.lastName}` : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(f.dueDate)}</td>
                      <td className="px-4 py-3 capitalize">{f.channel}</td>
                      <td className="px-4 py-3">
                        <FollowUpStatusBadge status={f.status} />
                      </td>
                    </tr>
                  )
                })}
              </DataTable>
              <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
            </>
          )}
        </TabsContent>
        <TabsContent value="calendar">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
            {days.map((day) => (
              <Card key={day} className="min-h-24">
                <CardContent className="p-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {formatDate(day, { month: 'short', day: 'numeric', year: undefined })}
                  </p>
                  <div className="mt-1 space-y-1">
                    {(byDay.get(day) ?? []).map((f) => (
                      <div key={f.id} className="rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary">
                        {f.channel}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="overflow-visible"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => {
            const t = e.target as HTMLElement
            if (t.closest('[data-radix-select-content]')) e.preventDefault()
          }}
          onInteractOutside={(e) => {
            const t = e.target as HTMLElement
            if (t.closest('[data-radix-select-content]')) e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>Create Follow-up</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!contactId) {
                toast.error('Select a contact')
                return
              }
              toast.success('Follow-up created (mock)')
              setOpen(false)
            }}
          >
            <div className="space-y-1">
              <Label>Contact</Label>
              <Select value={contactId || undefined} onValueChange={setContactId}>
                <SelectTrigger aria-label="Contact">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Assigned to</Label>
              <Select value={assigneeId || undefined} onValueChange={setAssigneeId}>
                <SelectTrigger aria-label="Assignee">
                  <SelectValue placeholder="Select teammate" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {members.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Due date</Label>
              <Input type="datetime-local" required />
            </div>
            <div className="space-y-1">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger aria-label="Channel">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {['email', 'whatsapp', 'phone', 'meeting', 'other'].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea />
            </div>
            <Button type="submit" className="w-full">
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
