import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { FollowUpStatusBadge } from '@/components/shared/status-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/context/app-context'
import { contactService, followUpService, userService } from '@/services/api'
import { formatDate, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

export function FollowUpsPage() {
  const { organization } = useApp()
  const orgId = organization?.id ?? ''
  const { data = [] } = useQuery({ queryKey: ['followups', orgId], queryFn: () => followUpService.list(orgId), enabled: !!orgId })
  const { data: contacts = [] } = useQuery({ queryKey: ['contacts', orgId], queryFn: () => contactService.list(orgId), enabled: !!orgId })
  const [open, setOpen] = useState(false)
  const [viewMonth] = useState(new Date(2026, 8, 1))

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

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="List and calendar views for outreach tasks."
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Create Follow-up</Button>}
      />
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          {data.length === 0 ? (
            <EmptyState title="No follow-ups" description="Create a follow-up from a contact or lead." actionLabel="Create" onAction={() => setOpen(true)} />
          ) : (
            <DataTable columns={['Contact', 'Lead', 'Event', 'Assigned', 'Due date', 'Channel', 'Status']}>
              {data.map((f) => {
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
                    <td className="px-4 py-3"><FollowUpStatusBadge status={f.status} /></td>
                  </tr>
                )
              })}
            </DataTable>
          )}
        </TabsContent>
        <TabsContent value="calendar">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
            {days.map((day) => (
              <Card key={day} className="min-h-24">
                <CardContent className="p-2">
                  <p className="text-xs font-medium text-muted-foreground">{formatDate(day, { month: 'short', day: 'numeric', year: undefined })}</p>
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
        <DialogContent>
          <DialogHeader><DialogTitle>Create Follow-up</DialogTitle></DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              toast.success('Follow-up created (mock)')
              setOpen(false)
            }}
          >
            <div className="space-y-1"><Label>Contact</Label><Select defaultValue="c1"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Due date</Label><Input type="datetime-local" required /></div>
            <div className="space-y-1"><Label>Channel</Label><Select defaultValue="email"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['email','whatsapp','phone','meeting','other'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea /></div>
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
