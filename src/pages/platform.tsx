import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Cloud,
  Database,
  Eye,
  FileScan,
  Mail,
  MessageCircle,
  Pause,
  Pencil,
  Building2,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, Pagination, tableActionIconClass } from '@/components/shared/data-table'
import { SearchField } from '@/components/shared/search-field'
import { EmptyState } from '@/components/shared/empty-state'
import { IntegrationsCatalog, type IntegrationCatalogItem } from '@/components/shared/integrations-catalog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableSkeleton } from '@/components/ui/skeleton'
import { orgService, userService, auditService } from '@/services/api'
import { cn, formatDate, formatDateTime, initials } from '@/lib/utils'
import { toast } from 'sonner'
import { usePageSize, usePagedRows } from '@/hooks/use-page-size'
import type { Organization, UsageMetrics, User } from '@/types'

const PLATFORM_INTEGRATIONS: IntegrationCatalogItem[] = [
  {
    id: 'textract',
    name: 'AWS Textract',
    provider: 'Amazon Web Services',
    description: 'OCR and document field extraction for business cards.',
    category: 'Document intelligence',
    status: 'connected',
    icon: FileScan,
  },
  {
    id: 's3',
    name: 'Amazon S3',
    provider: 'Amazon Web Services',
    description: 'Object storage for card images and exports.',
    category: 'Storage',
    status: 'connected',
    icon: Database,
  },
  {
    id: 'email',
    name: 'Email provider',
    provider: 'CardSync Mail',
    description: 'Transactional and outreach email delivery.',
    category: 'Messaging',
    status: 'error',
    error: 'Sending domain is not verified. Add the DNS records, then test again.',
    icon: Mail,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    provider: 'Meta',
    description: 'WhatsApp Business API for follow-ups and alerts.',
    category: 'Messaging',
    status: 'needs',
    icon: MessageCircle,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    provider: 'HubSpot Inc.',
    description: 'CRM sync for contacts, companies, and deals.',
    category: 'CRM',
    status: 'connected',
    icon: Building2,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    provider: 'Salesforce',
    description: 'Enterprise CRM connector for lead and contact sync.',
    category: 'CRM',
    status: 'needs',
    icon: Cloud,
  },
]

function usageTone(current: number, limit: number) {
  const pct = limit > 0 ? (current / limit) * 100 : 0
  if (pct >= 100) return 'danger' as const
  if (pct >= 80) return 'warning' as const
  return 'normal' as const
}

function UsageBars({ usage }: { usage: UsageMetrics }) {
  const items: [string, number, number][] = [
    ['Cards/month', usage.cardsMonth, usage.cardsLimit],
    ['OCR usage', usage.ocrUsage, usage.ocrLimit],
    ['Storage (GB)', usage.storageGb, usage.storageLimit],
    ['Users', usage.users, usage.usersLimit],
    ['Events', usage.events, usage.eventsLimit],
    ['Emails', usage.emails, usage.emailsLimit],
    ['WhatsApp', usage.whatsapp, usage.whatsappLimit],
    ['CRM sync', usage.crmSync, usage.crmSyncLimit],
  ]
  return (
    <div className="space-y-4">
      {items.map(([label, current, limit]) => {
        const pct = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0
        const tone = usageTone(current, limit)
        return (
          <div key={label} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">
                {current} / {limit}
                <span
                  className={cn(
                    'ml-2 font-medium',
                    tone === 'danger' && 'text-red-600',
                    tone === 'warning' && 'text-amber-600',
                  )}
                >
                  {pct}%
                </span>
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        )
      })}
    </div>
  )
}

function OrgAvatar({ org, className }: { org: Pick<Organization, 'name' | 'branding'>; className?: string }) {
  const logo = org.branding.logoUrl?.trim()
  return (
    <Avatar className={cn('size-9 rounded-md', className)}>
      {logo ? <AvatarImage src={logo} alt="" className="object-contain p-0.5" /> : null}
      <AvatarFallback className="rounded-md text-xs font-medium">{initials(org.name)}</AvatarFallback>
    </Avatar>
  )
}

function UserAvatar({ user, className }: { user: Pick<User, 'firstName' | 'lastName' | 'avatarUrl'>; className?: string }) {
  const name = `${user.firstName} ${user.lastName}`
  return (
    <Avatar className={cn('size-9', className)}>
      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
      <AvatarFallback className="text-xs font-medium">{initials(name)}</AvatarFallback>
    </Avatar>
  )
}

function OrgStatusBadge({ status }: { status: Organization['status'] }) {
  return (
    <Badge variant={status === 'active' ? 'success' : 'danger'} className="capitalize">
      {status}
    </Badge>
  )
}

function UserStatusBadge({ status }: { status: User['status'] }) {
  const variant = status === 'active' ? 'success' : status === 'invited' ? 'warning' : 'muted'
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  )
}

const ORG_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'usage', label: 'Usage & limits' },
  { id: 'branding', label: 'Branding' },
  { id: 'templates', label: 'Templates' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'audit', label: 'Audit' },
] as const

type OrgSection = (typeof ORG_SECTIONS)[number]['id']

export function PlatformOrganizationsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['orgs'], queryFn: () => orgService.list() })
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = usePageSize()

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return data.filter((o) => {
      const matchesQ = !query || `${o.name} ${o.plan} ${o.status} ${o.email}`.toLowerCase().includes(query)
      const matchesStatus = status === 'all' || o.status === status
      return matchesQ && matchesStatus
    })
  }, [data, q, status])

  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div>
      <PageHeader title="Organizations" description="Platform-wide tenant management." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          value={q}
          onChange={(v) => {
            setQ(v)
            setPage(1)
          }}
          placeholder="Search organizations…"
        />
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <TableSkeleton cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No organizations found" description="Try adjusting search or filters." />
      ) : (
        <>
          <DataTable columns={['Organization', 'Status', 'Users', 'Plan', 'Created', 'Actions']}>
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <OrgAvatar org={o} />
                    <div className="min-w-0">
                      <Link className="text-sm font-medium text-foreground hover:underline" to={`/platform/organizations/${o.id}`}>
                        {o.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{o.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <OrgStatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3">{o.usersCount}</td>
                <td className="px-4 py-3 capitalize">{o.plan}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/platform/organizations/${o.id}`}
                      className={tableActionIconClass}
                      aria-label={`View ${o.name}`}
                      title="View"
                    >
                      <Eye className="size-4" aria-hidden />
                    </Link>
                    <button
                      type="button"
                      className={tableActionIconClass}
                      aria-label={`Edit ${o.name}`}
                      title="Edit"
                      onClick={() => toast.message('Edit (mock)')}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={tableActionIconClass}
                      aria-label={o.status === 'active' ? `Suspend ${o.name}` : `Activate ${o.name}`}
                      title={o.status === 'active' ? 'Suspend' : 'Activate'}
                      onClick={() => toast.message(o.status === 'active' ? 'Suspended' : 'Activated')}
                    >
                      <Pause className="size-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
        </>
      )}
    </div>
  )
}

export function PlatformOrgDetailPage() {
  const { id = '' } = useParams()
  const { data: org, isLoading } = useQuery({ queryKey: ['org', id], queryFn: () => orgService.get(id) })
  const { data: users = [] } = useQuery({ queryKey: ['org-users', id], queryFn: () => userService.byOrg(id), enabled: !!id })
  const [section, setSection] = useState<OrgSection>('overview')
  const { page, setPage, pageSize, paged: pagedUsers, total: usersTotal } = usePagedRows(users)

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!org) return <EmptyState title="Organization not found" description="This organization may have been removed." />

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/platform/organizations"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Back to organizations
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <OrgAvatar org={org} className="size-14" />
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold tracking-tight">{org.name}</h1>
                <OrgStatusBadge status={org.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {org.plan} plan · {org.usersCount} users · Created {formatDate(org.createdAt)}
              </p>
              <p className="text-sm text-muted-foreground">
                {org.email}
                {org.website ? ` · ${org.website}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => toast.message('Edit (mock)')}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.message(org.status === 'active' ? 'Suspended' : 'Activated')}
            >
              {org.status === 'active' ? 'Suspend' : 'Activate'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Users', String(org.usersCount)],
          ['Cards / month', String(org.usage.cardsMonth)],
          ['Storage', `${org.usage.storageGb} GB`],
          ['Plan', org.plan],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-base font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-44 lg:flex-col lg:overflow-visible" aria-label="Organization sections">
          {ORG_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                'whitespace-nowrap rounded-md px-3 py-2 text-left text-sm font-medium transition',
                section === s.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {section === 'overview' ? (
            <div className="space-y-4 text-sm">
              <div>
                <h2 className="font-display text-base font-semibold">About</h2>
                <p className="mt-2 text-muted-foreground">{org.description || 'No description.'}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{org.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium">{org.address || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Slug</p>
                  <p className="font-medium">{org.slug}</p>
                </div>
              </div>
            </div>
          ) : null}

          {section === 'users' ? (
            users.length === 0 ? (
              <EmptyState title="No users" description="This organization has no users yet." />
            ) : (
              <>
                <DataTable columns={['Name', 'Email', 'Role', 'Status', 'Actions']}>
                  {pagedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} className="size-8" />
                          <span className="text-sm font-medium">
                            {u.firstName} {u.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3 capitalize">{u.role.replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <UserStatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/platform/users/${u.id}`}
                          className={tableActionIconClass}
                          aria-label={`View ${u.firstName} ${u.lastName}`}
                          title="View"
                        >
                          <Eye className="size-4" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </DataTable>
                <Pagination page={page} pageSize={pageSize} total={usersTotal} onChange={setPage} />
              </>
            )
          ) : null}

          {section === 'usage' ? <UsageBars usage={org.usage} /> : null}

          {section === 'branding' ? (
            <div className="space-y-3 text-sm">
              {org.branding.logoUrl ? (
                <img src={org.branding.logoUrl} alt="" className="h-10 object-contain" />
              ) : (
                <OrgAvatar org={org} className="size-12" />
              )}
              <p>
                Primary color: <span className="font-medium">{org.branding.primaryColor}</span>
              </p>
            </div>
          ) : null}

          {section === 'templates' ? (
            <p className="text-sm text-muted-foreground">
              Organization templates are managed in Templates; platform-wide templates are in{' '}
              <Link className="font-medium text-primary hover:underline" to="/platform/templates">
                Global Templates
              </Link>
              .
            </p>
          ) : null}

          {section === 'integrations' ? (
            <p className="text-sm text-muted-foreground">
              Per-org CRM connections are visible in CRM Integrations when viewing as this tenant.
            </p>
          ) : null}

          {section === 'audit' ? (
            <p className="text-sm text-muted-foreground">
              Activity for this organization is in{' '}
              <Link className="font-medium text-primary hover:underline" to="/audit-logs">
                Audit Logs
              </Link>
              .
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function PlatformUsersPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['platform-users'], queryFn: () => userService.platformUsers() })
  const { data: orgs = [] } = useQuery({ queryKey: ['orgs'], queryFn: () => orgService.list() })
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [role, setRole] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = usePageSize()

  const orgName = (orgId: string | null) => orgs.find((o) => o.id === orgId)?.name ?? '—'

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return data.filter((u) => {
      const matchesQ =
        !query ||
        `${u.firstName} ${u.lastName} ${u.email} ${u.role} ${orgName(u.orgId)}`.toLowerCase().includes(query)
      const matchesStatus = status === 'all' || u.status === status
      const matchesRole = role === 'all' || u.role === role
      return matchesQ && matchesStatus && matchesRole
    })
  }, [data, q, status, role, orgs])

  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div>
      <PageHeader title="Platform Users" description="All users across organizations." />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchField
          value={q}
          onChange={(v) => {
            setQ(v)
            setPage(1)
          }}
          placeholder="Search users…"
        />
        <div className="flex flex-wrap gap-2">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="super_admin">Super admin</SelectItem>
              <SelectItem value="org_admin">Org admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {isLoading ? (
        <TableSkeleton cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No users found" description="Try adjusting search or filters." />
      ) : (
        <>
          <DataTable columns={['User', 'Email', 'Role', 'Organization', 'Status', 'Last active', 'Actions']}>
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={u} />
                    <span className="text-sm font-medium">
                      {u.firstName} {u.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role.replace('_', ' ')}</td>
                <td className="px-4 py-3">{orgName(u.orgId)}</td>
                <td className="px-4 py-3">
                  <UserStatusBadge status={u.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(u.lastActive)}</td>
                <td className="px-4 py-3">
                  <Link
                    to={`/platform/users/${u.id}`}
                    className={tableActionIconClass}
                    aria-label={`View ${u.firstName} ${u.lastName}`}
                    title="View"
                  >
                    <Eye className="size-4" aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
        </>
      )}
    </div>
  )
}

export function PlatformUserDetailPage() {
  const { id = '' } = useParams()
  const user = userService.get(id)
  const { data: orgs = [] } = useQuery({ queryKey: ['orgs'], queryFn: () => orgService.list() })
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit', 'user', id],
    queryFn: () => auditService.list(null),
    enabled: !!id,
  })

  const scoped = useMemo(() => logs.filter((a) => a.userId === id), [logs, id])
  const { page, setPage, pageSize, paged, total } = usePagedRows(scoped)
  const org = orgs.find((o) => o.id === user?.orgId)

  if (!user) {
    return <EmptyState title="User not found" description="This user may have been removed." />
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/platform/users"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Back to platform users
        </Link>
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start">
          <UserAvatar user={user} className="size-14" />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {user.firstName} {user.lastName}
              </h1>
              <UserStatusBadge status={user.status} />
            </div>
            <p className="text-sm font-medium capitalize text-muted-foreground">{user.role.replace('_', ' ')}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground">
              {org ? (
                <Link className="hover:underline" to={`/platform/organizations/${org.id}`}>
                  {org.name}
                </Link>
              ) : (
                'No organization'
              )}
              {' · '}
              Last active {formatDateTime(user.lastActive)}
            </p>
          </div>
        </div>
      </div>

      <h2 className="mb-3 font-display text-base font-semibold">Activity</h2>
      {isLoading ? (
        <TableSkeleton cols={5} />
      ) : scoped.length === 0 ? (
        <EmptyState title="No activity" description="No audit events recorded for this user." />
      ) : (
        <>
          <DataTable columns={['Action', 'Resource', 'Date/time', 'IP', 'Result']}>
            {paged.map((a) => (
              <tr key={a.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{a.action}</td>
                <td className="px-4 py-3">{a.resource}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(a.createdAt)}</td>
                <td className="px-4 py-3">{a.ip}</td>
                <td className="px-4 py-3">
                  <Badge variant={a.result === 'success' ? 'success' : 'danger'}>{a.result}</Badge>
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </>
      )}
    </div>
  )
}

export function PlatformUsagePage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['orgs'], queryFn: () => orgService.list() })

  return (
    <div>
      <PageHeader title="Usage & Limits" description="How much of each organization’s allowance has been used." />
      {isLoading ? (
        <TableSkeleton cols={3} />
      ) : (
        <div className="space-y-8">
          {data.map((o) => (
            <section key={o.id} className="rounded-lg border border-border bg-card p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <OrgAvatar org={o} />
                  <div>
                    <Link className="text-base font-semibold hover:underline" to={`/platform/organizations/${o.id}`}>
                      {o.name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{o.plan}</span>
                      <OrgStatusBadge status={o.status} />
                    </div>
                  </div>
                </div>
              </div>
              <UsageBars usage={o.usage} />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export function PlatformIntegrationsPage() {
  const openCms = () => window.open('http://localhost:5174/platform', '_blank', 'noopener,noreferrer')

  return (
    <IntegrationsCatalog
      title="Platform Integrations"
      description="Manage the services and platforms connected to your CardSync workspace."
      items={PLATFORM_INTEGRATIONS}
      onAdd={openCms}
      onManage={() => openCms()}
      footnote={
        <>
          Credentials and connector settings are edited in the{' '}
          <button type="button" className="font-medium text-primary hover:underline" onClick={openCms}>
            CMS
          </button>
          .
        </>
      }
    />
  )
}
