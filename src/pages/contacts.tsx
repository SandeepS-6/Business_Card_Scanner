import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Download, Filter, MoreVertical, Plus, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import {
  DataTable,
  Pagination,
  SortButton,
  compareDate,
  compareLeadIntent,
  compareLeadStatus,
  compareText,
  type SortDir,
} from '@/components/shared/data-table'
import { SearchField } from '@/components/shared/search-field'
import { EmptyState, ErrorState, PermissionDenied } from '@/components/shared/empty-state'
import { can } from '@/security/permissions'
import { LeadIntentBadge, LeadStatusBadge } from '@/components/shared/status-badges'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useApp } from '@/context/app-context'
import { usePageSize } from '@/hooks/use-page-size'
import { contactService, eventService, userService } from '@/services/api'
import { formatDate } from '@/lib/utils'
import type { Contact } from '@/types'
import { toast } from 'sonner'

type SortKey = 'name' | 'company' | 'jobTitle' | 'email' | 'status' | 'intent' | 'owner' | 'lastActivity' | 'createdAt'

function ContactRowActions({ contact }: { contact: Contact }) {
  const navigate = useNavigate()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Actions for ${contact.fullName}`}
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}`)}>Open</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.message('Edit contact (mock)')}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.message('Email composer (mock)')}>Send email</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.message('WhatsApp (mock)')}>WhatsApp</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.message('Assign owner (mock)')}>Assign owner</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ContactsPage() {
  const { organization, user } = useApp()
  const navigate = useNavigate()
  const orgId = organization?.id ?? ''
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [intent, setIntent] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir | null>(null)
  const pageSize = usePageSize()

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  const { data = [], isLoading, isError, refetch } = useQuery({
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
      const matchesQ = `${c.fullName} ${c.company} ${c.email} ${c.jobTitle}`.toLowerCase().includes(q.toLowerCase())
      const matchesStatus = status === 'all' || c.leadStatus === status
      const matchesIntent = intent === 'all' || c.leadIntent === intent
      return matchesQ && matchesStatus && matchesIntent
    })
  }, [data, q, status, intent])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    const rows = [...filtered]
    rows.sort((a, b) => {
      const ownerA = userService.get(a.ownerId)
      const ownerB = userService.get(b.ownerId)
      const ownerName = (u: typeof ownerA) => (u ? `${u.firstName} ${u.lastName}` : '')
      switch (sortKey) {
        case 'name':
          return compareText(a.fullName, b.fullName, sortDir)
        case 'company':
          return compareText(a.company, b.company, sortDir)
        case 'jobTitle':
          return compareText(a.jobTitle, b.jobTitle, sortDir)
        case 'email':
          return compareText(a.email, b.email, sortDir)
        case 'status':
          return compareLeadStatus(a.leadStatus, b.leadStatus, sortDir)
        case 'intent':
          return compareLeadIntent(a.leadIntent, b.leadIntent, sortDir)
        case 'owner':
          return compareText(ownerName(ownerA), ownerName(ownerB), sortDir)
        case 'lastActivity':
          return compareDate(a.lastActivity, b.lastActivity, sortDir)
        case 'createdAt':
          return compareDate(a.createdAt, b.createdAt, sortDir)
        default:
          return 0
      }
    })
    return rows
  }, [filtered, sortKey, sortDir])

  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize)
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id))

  const toggleSort = (key: SortKey) => {
    setPage(1)
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
      return
    }
    if (sortDir === 'asc') setSortDir('desc')
    else if (sortDir === 'desc') {
      setSortKey(null)
      setSortDir(null)
    } else setSortDir('asc')
  }

  const sortBtn = (key: SortKey, label: string) => (
    <SortButton label={label} active={sortKey === key} dir={sortKey === key ? sortDir : null} onClick={() => toggleSort(key)} />
  )

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
        <SearchField
          value={q}
          onChange={(v) => {
            setQ(v)
            setPage(1)
          }}
          placeholder="Search contacts…"
        />
        <div className="flex flex-wrap gap-2">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {['new', 'contacted', 'qualified', 'interested', 'converted', 'lost'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={intent}
            onValueChange={(v) => {
              setIntent(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Lead Intent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All intents</SelectItem>
              <SelectItem value="high">High Intent</SelectItem>
              <SelectItem value="medium">Medium Intent</SelectItem>
              <SelectItem value="low">Low Intent</SelectItem>
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
          {['Assign owner', 'Change status', 'Change lead intent', 'Add tag', 'Add to event', 'Send email', 'Send WhatsApp', 'Delete'].map(
            (a) => (
              <Button
                key={a}
                size="sm"
                variant={a === 'Delete' ? 'destructive' : 'outline'}
                onClick={() => bulk(a)}
                disabled={a === 'Delete' && !can(user?.role, 'CONTACTS_DELETE')}
              >
                {a}
              </Button>
            ),
          )}
          {!can(user?.role, 'CONTACTS_DELETE') ? <PermissionDenied message="Delete requires admin permission." /> : null}
        </div>
      ) : null}

      {isLoading ? (
        <TableSkeleton cols={8} />
      ) : isError ? (
        <ErrorState title="Couldn’t load contacts" description="Try again in a moment." onRetry={() => void refetch()} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title={q || status !== 'all' || intent !== 'all' ? 'No contacts found' : 'No contacts yet'}
          description={
            q || status !== 'all' || intent !== 'all'
              ? 'Try adjusting search or filters.'
              : 'Scan a business card or import a list to get started.'
          }
          actionLabel={q || status !== 'all' || intent !== 'all' ? undefined : 'Capture Card'}
          onAction={q || status !== 'all' || intent !== 'all' ? undefined : () => navigate('/capture')}
        />
      ) : (
        <>
          {/* Mobile / tablet cards — actions always visible */}
          <div className="space-y-3 lg:hidden">
            {pageRows.map((c) => (
              <div key={c.id} className="flex items-start gap-2 rounded-lg border border-border bg-card p-4">
                <Checkbox
                  className="mt-1"
                  checked={selected.includes(c.id)}
                  onCheckedChange={(v) => setSelected((s) => (v ? [...s, c.id] : s.filter((id) => id !== c.id)))}
                  aria-label={`Select ${c.fullName}`}
                />
                <Link to={`/contacts/${c.id}`} className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{c.fullName}</p>
                  <p className="text-sm text-muted-foreground">{c.company}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <LeadStatusBadge status={c.leadStatus} />
                    <LeadIntentBadge intent={c.leadIntent} />
                  </div>
                </Link>
                <ContactRowActions contact={c} />
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block">
            <DataTable
              columns={[
                <Checkbox
                  key="all"
                  checked={allOnPageSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />,
                sortBtn('name', 'Name'),
                sortBtn('company', 'Company'),
                sortBtn('jobTitle', 'Job Title'),
                sortBtn('email', 'Email'),
                'Phone',
                'Event',
                sortBtn('status', 'Lead Status'),
                sortBtn('intent', 'Lead Intent'),
                sortBtn('owner', 'Owner'),
                sortBtn('lastActivity', 'Last Activity'),
                sortBtn('createdAt', 'Created'),
                <span key="actions" className="sr-only">
                  Actions
                </span>,
              ]}
            >
              {pageRows.map((c) => {
                const owner = userService.get(c.ownerId)
                const event = events.find((e) => e.id === c.eventId)
                return (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.includes(c.id)}
                        onCheckedChange={(v) => setSelected((s) => (v ? [...s, c.id] : s.filter((id) => id !== c.id)))}
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
                    <td className="whitespace-nowrap px-4 py-3">{c.phone}</td>
                    <td className="px-4 py-3">{event?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={c.leadStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <LeadIntentBadge intent={c.leadIntent} />
                    </td>
                    <td className="px-4 py-3">{owner ? `${owner.firstName} ${owner.lastName}` : '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(c.lastActivity)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(c.createdAt)}</td>
                    <td className="sticky right-0 bg-card px-2 py-3">
                      <ContactRowActions contact={c} />
                    </td>
                  </tr>
                )
              })}
            </DataTable>
          </div>
          <Pagination page={page} pageSize={pageSize} total={sorted.length} onChange={setPage} />
        </>
      )}
    </div>
  )
}
