import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { SearchField } from '@/components/shared/search-field'
import { EmptyState } from '@/components/shared/empty-state'
import { LeadQualityBadge, LeadStatusBadge } from '@/components/shared/status-badges'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/context/app-context'
import { contactService, leadService, userService } from '@/services/api'
import type { Lead, LeadStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const COLUMNS: LeadStatus[] = ['new', 'contacted', 'qualified', 'interested', 'converted', 'lost']

export function LeadsPage() {
  const { organization } = useApp()
  const orgId = organization?.id ?? ''
  const { data: serverLeads = [] } = useQuery({ queryKey: ['leads', orgId], queryFn: () => leadService.list(orgId), enabled: !!orgId })
  const { data: contacts = [] } = useQuery({ queryKey: ['contacts', orgId], queryFn: () => contactService.list(orgId), enabled: !!orgId })
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [q, setQ] = useState('')
  const rows = leads ?? serverLeads

  const visibleRows = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((l) => {
      const c = contacts.find((x) => x.id === l.contactId)
      return `${c?.fullName ?? ''} ${c?.company ?? ''} ${l.status} ${l.quality}`.toLowerCase().includes(query)
    })
  }, [rows, q, contacts])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c, [] as Lead[]])) as Record<LeadStatus, Lead[]>
    visibleRows.forEach((l) => map[l.status].push(l))
    return map
  }, [visibleRows])

  const onDragEnd = (event: DragEndEvent) => {
    const over = event.over?.id as LeadStatus | undefined
    const id = String(event.active.id)
    if (!over || !COLUMNS.includes(over)) return
    setLeads((prev) => (prev ?? serverLeads).map((l) => (l.id === id ? { ...l, status: over } : l)))
  }

  if (!rows.length) {
    return (
      <EmptyState
        title="No leads yet"
        description="Save a contact as a lead from the review flow."
        actionLabel="Capture Card"
        onAction={() => (window.location.href = '/capture')}
      />
    )
  }

  return (
    <div>
      <PageHeader title="Leads" description="Table and kanban views for pipeline management." />
      <div className="mb-4">
        <SearchField value={q} onChange={setQ} placeholder="Search leads…" />
      </div>
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban">
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-4">
              {COLUMNS.map((status) => (
                <KanbanColumn key={status} status={status} leads={byStatus[status]} contacts={contacts} />
              ))}
            </div>
          </DndContext>
        </TabsContent>
        <TabsContent value="table">
          <DataTable columns={['Contact', 'Company', 'Event', 'Owner', 'Status', 'Quality', 'Last activity', 'Next follow-up']}>
            {visibleRows.map((l) => {
              const c = contacts.find((x) => x.id === l.contactId)
              const owner = userService.get(l.ownerId)
              return (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link className="text-primary hover:underline" to={`/contacts/${l.contactId}`}>
                      {c?.fullName ?? l.contactId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c?.company}</td>
                  <td className="px-4 py-3">{l.eventId ?? '—'}</td>
                  <td className="px-4 py-3">{owner ? `${owner.firstName} ${owner.lastName}` : '—'}</td>
                  <td className="px-4 py-3"><LeadStatusBadge status={l.status} /></td>
                  <td className="px-4 py-3"><LeadQualityBadge quality={l.quality} /></td>
                  <td className="px-4 py-3">{formatDate(l.lastActivity)}</td>
                  <td className="px-4 py-3">{l.nextFollowUp ? formatDate(l.nextFollowUp) : '—'}</td>
                </tr>
              )
            })}
          </DataTable>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function KanbanColumn({
  status,
  leads,
  contacts,
}: {
  status: LeadStatus
  leads: Lead[]
  contacts: Awaited<ReturnType<typeof contactService.list>>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div
      ref={setNodeRef}
      className={cn('w-64 shrink-0 rounded-lg border border-border bg-muted/30 p-2', isOver && 'ring-2 ring-primary')}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{status}</p>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <div className="space-y-2">
        {leads.map((l) => {
          const c = contacts.find((x) => x.id === l.contactId)
          return <KanbanCard key={l.id} lead={l} title={c?.fullName ?? l.contactId} company={c?.company ?? ''} />
        })}
      </div>
    </div>
  )
}

function KanbanCard({ lead, title, company }: { lead: Lead; title: string; company: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn('cursor-grab rounded-md border border-border bg-card p-3 shadow-sm active:cursor-grabbing', isDragging && 'opacity-70')}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{company}</p>
      <div className="mt-2">
        <LeadQualityBadge quality={lead.quality} />
      </div>
      <Link to={`/contacts/${lead.contactId}`} className="mt-1 inline-block text-xs text-primary hover:underline">
        Open
      </Link>
    </div>
  )
}
