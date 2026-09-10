import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { HealthStatusBadge } from '@/components/shared/status-badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { orgService, healthService, userService } from '@/services/api'
import { formatDate, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { UsageMetrics } from '@/types'
import { cn } from '@/lib/utils'

function usageTone(current: number, limit: number) {
  const pct = (current / limit) * 100
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
    <div className="grid gap-4 md:grid-cols-2">
      {items.map(([label, current, limit]) => {
        const pct = Math.min(100, Math.round((current / limit) * 100))
        const tone = usageTone(current, limit)
        return (
          <Card key={label} className={cn(tone === 'danger' && 'border-red-300', tone === 'warning' && 'border-amber-300')}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Badge variant={tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'success'}>
                  {tone === 'danger' ? 'Limit reached' : tone === 'warning' ? 'Near limit' : 'Normal'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm text-muted-foreground">{current} / {limit} ({pct}%)</p>
              <Progress value={pct} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function PlatformOrganizationsPage() {
  const { data = [] } = useQuery({ queryKey: ['orgs'], queryFn: () => orgService.list() })
  return (
    <div>
      <PageHeader title="Organizations" description="Platform-wide tenant management." />
      <DataTable columns={['Organization', 'Status', 'Users', 'Cards', 'Storage', 'OCR', 'Email', 'WhatsApp', 'Plan', 'Created', 'Actions']}>
        {data.map((o) => (
          <tr key={o.id}>
            <td className="px-4 py-3"><Link className="font-medium text-primary hover:underline" to={`/platform/organizations/${o.id}`}>{o.name}</Link></td>
            <td className="px-4 py-3"><Badge variant={o.status === 'active' ? 'success' : 'danger'}>{o.status}</Badge></td>
            <td className="px-4 py-3">{o.usersCount}</td>
            <td className="px-4 py-3">{o.usage.cardsMonth}</td>
            <td className="px-4 py-3">{o.usage.storageGb} GB</td>
            <td className="px-4 py-3">{o.usage.ocrUsage}</td>
            <td className="px-4 py-3">{o.usage.emails}</td>
            <td className="px-4 py-3">{o.usage.whatsapp}</td>
            <td className="px-4 py-3">{o.plan}</td>
            <td className="px-4 py-3 whitespace-nowrap">{formatDate(o.createdAt)}</td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                <Link className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs" to={`/platform/organizations/${o.id}`}>
                  View
                </Link>
                <Button size="sm" variant="ghost" onClick={() => toast.message('Edit (mock)')}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => toast.message(o.status === 'active' ? 'Suspended' : 'Activated')}>
                  {o.status === 'active' ? 'Suspend' : 'Activate'}
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  )
}

export function PlatformOrgDetailPage() {
  const { id = '' } = useParams()
  const { data: org } = useQuery({ queryKey: ['org', id], queryFn: () => orgService.get(id) })
  const { data: users = [] } = useQuery({ queryKey: ['org-users', id], queryFn: () => userService.byOrg(id), enabled: !!id })
  if (!org) return <p className="text-sm text-muted-foreground">Loading…</p>
  return (
    <div>
      <PageHeader
        title={org.name}
        description={`${org.plan} · ${org.status}`}
        backTo="/platform/organizations"
        backLabel="Back to organizations"
      />
      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap">
          {['overview', 'users', 'usage', 'branding', 'templates', 'integrations', 'limits', 'audit'].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Users', org.usersCount],
            ['Cards/mo', org.usage.cardsMonth],
            ['Storage', `${org.usage.storageGb} GB`],
            ['Plan', org.plan],
          ].map(([l, v]) => (
            <Card key={String(l)}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{l}</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{v}</p></CardContent></Card>
          ))}
        </TabsContent>
        <TabsContent value="users">
          <DataTable columns={['Name', 'Email', 'Role', 'Status']}>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u.status}</td>
              </tr>
            ))}
          </DataTable>
        </TabsContent>
        <TabsContent value="usage"><UsageBars usage={org.usage} /></TabsContent>
        <TabsContent value="branding">
          <img src={org.branding.logoUrl} alt="" className="mb-3 h-10" />
          <p className="text-sm">Primary: {org.branding.primaryColor}</p>
        </TabsContent>
        <TabsContent value="templates"><p className="text-sm text-muted-foreground">Organization templates managed in Templates; global templates in Global Templates.</p></TabsContent>
        <TabsContent value="integrations"><p className="text-sm text-muted-foreground">Per-org CRM connections visible in CRM Integrations when viewing as this tenant.</p></TabsContent>
        <TabsContent value="limits"><UsageBars usage={org.usage} /></TabsContent>
        <TabsContent value="audit"><p className="text-sm text-muted-foreground">See Platform Audit Logs filtered by this organization.</p></TabsContent>
      </Tabs>
    </div>
  )
}

export function PlatformUsersPage() {
  const { data = [] } = useQuery({ queryKey: ['platform-users'], queryFn: () => userService.platformUsers() })
  return (
    <div>
      <PageHeader title="Platform Users" description="All users across organizations." />
      <DataTable columns={['Name', 'Email', 'Role', 'Org', 'Status', 'Last active']}>
        {data.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3">{u.firstName} {u.lastName}</td>
            <td className="px-4 py-3">{u.email}</td>
            <td className="px-4 py-3">{u.role}</td>
            <td className="px-4 py-3">{u.orgId ?? '—'}</td>
            <td className="px-4 py-3">{u.status}</td>
            <td className="px-4 py-3">{formatDateTime(u.lastActive)}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  )
}

export function PlatformUsagePage() {
  const { data = [] } = useQuery({ queryKey: ['orgs'], queryFn: () => orgService.list() })
  return (
    <div>
      <PageHeader title="Usage & Limits" description="Cross-tenant consumption with warning states." />
      <div className="space-y-8">
        {data.map((o) => (
          <div key={o.id}>
            <h2 className="mb-3 font-display text-lg font-semibold">{o.name}</h2>
            <UsageBars usage={o.usage} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SystemHealthPage() {
  const { data = [] } = useQuery({ queryKey: ['health'], queryFn: () => healthService.list() })
  return (
    <div>
      <PageHeader title="System Health" description="Mock service status for platform operations." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.map((s) => (
          <Card key={s.name}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{s.name}</CardTitle>
              <HealthStatusBadge status={s.status} />
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>Response: {s.responseMs} ms</p>
              <p>Error rate: {s.errorRate}%</p>
              <p>Last checked: {formatDateTime(s.lastChecked)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function PlatformIntegrationsPage() {
  return (
    <div>
      <PageHeader title="Platform Integrations" description="Global connectors and provider credentials (UI only)." />
      <div className="grid gap-4 md:grid-cols-2">
        {['OCR / Textract', 'Object storage', 'Email provider', 'WhatsApp Business', 'HubSpot app', 'Salesforce connected app'].map((name) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle className="text-base">{name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Configured (mock)</Badge>
              <div className="mt-3"><Button size="sm" variant="outline" onClick={() => toast.message('Configure')}>Configure</Button></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
