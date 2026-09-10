import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Download, Filter, Plus, Search, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, Pagination } from '@/components/shared/data-table'
import { EmptyState, PermissionDenied } from '@/components/shared/empty-state'
import { can } from '@/security/permissions'
import { LeadQualityBadge, LeadStatusBadge } from '@/components/shared/status-badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useApp } from '@/context/app-context'
import { usePageSize } from '@/hooks/use-page-size'
import { contactService, eventService, userService } from '@/services/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export function ContactsPage() {
  const { organization, user } = useApp()
  const navigate = useNavigate()
  const orgId = organization?.id ?? ''
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [quality, setQuality] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const pageSize = usePageSize()

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  const { data = [], isLoading } = useQuery({
    queryKey: ['contacts', orgId],
    queryFn: () => contactService.list(orgId),
    enabled: !!orgId,
  })
  const { data: events = [] } = useQuery({
    queryKey: ['events', orgId],
    queryFn: () => eventService.list(orgId),
    enabled: !!orgId,
  })

  const filtered = useMemo(() => {
    return data.filter((c) => {
      const matchesQ = `${c.fullName} ${c.company} ${c.email}`.toLowerCase().includes(q.toLowerCase())
      const matchesStatus = status === 'all' || c.leadStatus === status
      const matchesQuality = quality === 'all' || c.leadQuality === quality
      return matchesQ && matchesStatus && matchesQuality
    })
  }, [data, q, status, quality])

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id))

  const toggleAll = () => {
    if (allOnPageSelected) setSelected((s) => s.filter((id) => !pageRows.some((r) => r.id === id)))
    else setSelected((s) => [...new Set([...s, ...pageRows.map((r) => r.id)])])
  }

  const bulk = (action: string) => {
    if (!can(user?.role, 'CONTACTS_DELETE') && action === 'Delete') {
      toast.error('Permission denied')
      return
    }
    toast.message(`Bulk: ${action}`, { description: `${selected.length} contacts (mock)` })
  }

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Search, filter, and manage scanned contacts."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.message('Import placeholder')}>
              <Upload className="size-4" /> Import
            </Button>
            <Button variant="outline" onClick={() => toast.message('Export started (mock)')}>
              <Download className="size-4" /> Export
            </Button>
            <Button onClick={() => navigate('/capture')}>
              <Plus className="size-4" /> Add Contact
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search contacts…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {['new', 'contacted', 'qualified', 'interested', 'converted', 'lost'].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={quality} onValueChange={(v) => { setQuality(v); setPage(1) }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Quality" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All quality</SelectItem>
              {['hot', 'warm', 'cold'].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" aria-label="Advanced filters">
            <Filter className="size-4" />
          </Button>
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 text-sm">
          <span className="px-2 font-medium">{selected.length} selected</span>
          {['Assign owner', 'Change status', 'Change lead quality', 'Add tag', 'Add to event', 'Send email', 'Send WhatsApp', 'Delete'].map((a) => (
            <Button key={a} size="sm" variant={a === 'Delete' ? 'destructive' : 'outline'} onClick={() => bulk(a)} disabled={a === 'Delete' && !can(user?.role, 'CONTACTS_DELETE')}>
              {a}
            </Button>
          ))}
          {!can(user?.role, 'CONTACTS_DELETE') ? <PermissionDenied message="Delete requires admin permission." /> : null}
        </div>
      ) : null}

      {isLoading ? (
        <TableSkeleton cols={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          description="Scan a business card or import a list to get started."
          actionLabel="Capture Card"
          onAction={() => navigate('/capture')}
          secondaryLabel="Import"
          onSecondary={() => toast.message('Import placeholder')}
        />
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {pageRows.map((c) => (
              <Link key={c.id} to={`/contacts/${c.id}`} className="block rounded-lg border border-border bg-card p-4">
                <p className="font-medium">{c.fullName}</p>
                <p className="text-sm text-muted-foreground">{c.company} · {c.jobTitle}</p>
                <div className="mt-2 flex gap-2">
                  <LeadStatusBadge status={c.leadStatus} />
                  <LeadQualityBadge quality={c.leadQuality} />
                </div>
              </Link>
            ))}
          </div>
          <div className="hidden md:block">
            <DataTable
              columns={['', 'Name', 'Company', 'Job Title', 'Email', 'Phone', 'Event', 'Lead Status', 'Lead Quality', 'Owner', 'Last Activity', 'Created']}
            >
              <tr className="bg-muted/20">
                <td className="px-4 py-2">
                  <Checkbox checked={allOnPageSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                </td>
                <td colSpan={11} className="px-4 py-2 text-xs text-muted-foreground">
                  Column visibility & sort controls available in production table
                </td>
              </tr>
              {pageRows.map((c) => {
                const owner = userService.get(c.ownerId)
                const event = events.find((e) => e.id === c.eventId)
                return (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.includes(c.id)}
                        onCheckedChange={(v) =>
                          setSelected((s) => (v ? [...s, c.id] : s.filter((id) => id !== c.id)))
                        }
                        aria-label={`Select ${c.fullName}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link className="font-medium text-primary hover:underline" to={`/contacts/${c.id}`}>
                        {c.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.company}</td>
                    <td className="px-4 py-3">{c.jobTitle}</td>
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{c.phone}</td>
                    <td className="px-4 py-3">{event?.name ?? '—'}</td>
                    <td className="px-4 py-3"><LeadStatusBadge status={c.leadStatus} /></td>
                    <td className="px-4 py-3"><LeadQualityBadge quality={c.leadQuality} /></td>
                    <td className="px-4 py-3">{owner ? `${owner.firstName} ${owner.lastName}` : '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.lastActivity)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                  </tr>
                )
              })}
            </DataTable>
          </div>
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
        </>
      )}
    </div>
  )
}
