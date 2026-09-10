import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { SearchField } from '@/components/shared/search-field'
import { can, type Permission } from '@/security/permissions'
import { PermissionDenied } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/context/app-context'
import { userService } from '@/services/api'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

const PERMISSION_GROUPS: { label: string; perms: { key: Permission; label: string }[] }[] = [
  {
    label: 'Contacts',
    perms: [
      { key: 'CONTACTS_VIEW', label: 'View' },
      { key: 'CONTACTS_CREATE', label: 'Create' },
      { key: 'CONTACTS_EDIT', label: 'Edit' },
      { key: 'CONTACTS_DELETE', label: 'Delete' },
    ],
  },
  {
    label: 'Events',
    perms: [
      { key: 'EVENTS_VIEW', label: 'View' },
      { key: 'EVENTS_CREATE', label: 'Create' },
      { key: 'EVENTS_EDIT', label: 'Edit' },
    ],
  },
  {
    label: 'Follow-ups',
    perms: [
      { key: 'FOLLOW_UPS_VIEW', label: 'View' },
      { key: 'FOLLOW_UPS_CREATE', label: 'Create' },
    ],
  },
  {
    label: 'Leads',
    perms: [
      { key: 'LEADS_VIEW', label: 'View' },
      { key: 'LEADS_EDIT', label: 'Edit' },
    ],
  },
  {
    label: 'Team',
    perms: [
      { key: 'TEAM_VIEW', label: 'View' },
      { key: 'TEAM_MANAGE', label: 'Manage' },
    ],
  },
]

type CustomRole = {
  id: string
  name: string
  description: string
  permissions: Permission[]
  status: 'active' | 'draft'
}

export function TeamPage() {
  const { organization, user } = useApp()
  const canManage = can(user?.role, 'TEAM_MANAGE')
  const { data = [] } = useQuery({
    queryKey: ['team', organization?.id],
    queryFn: () => userService.byOrg(organization!.id),
    enabled: !!organization,
  })
  const [q, setQ] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [roles, setRoles] = useState<CustomRole[]>([
    {
      id: 'role-sales',
      name: 'Sales Manager',
      description: 'Manages sales contacts and follow-ups',
      permissions: ['CONTACTS_VIEW', 'CONTACTS_CREATE', 'CONTACTS_EDIT', 'FOLLOW_UPS_VIEW', 'FOLLOW_UPS_CREATE', 'LEADS_VIEW', 'LEADS_EDIT'],
      status: 'active',
    },
  ])
  const [roleName, setRoleName] = useState('')
  const [roleDesc, setRoleDesc] = useState('')
  const [rolePerms, setRolePerms] = useState<Permission[]>(['CONTACTS_VIEW', 'EVENTS_VIEW', 'FOLLOW_UPS_VIEW'])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return data
    return data.filter((m) =>
      `${m.firstName} ${m.lastName} ${m.email} ${m.role}`.toLowerCase().includes(query),
    )
  }, [data, q])

  const togglePerm = (p: Permission) => {
    setRolePerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  return (
    <div>
      <PageHeader
        title="Manage Team"
        description="Invite members, assign organization roles, and define custom role presets (UI mock)."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!canManage} onClick={() => setRoleOpen(true)}>
              Create role
            </Button>
            <Button disabled={!canManage} onClick={() => setInviteOpen(true)}>
              Invite
            </Button>
          </div>
        }
      />
      {!canManage ? (
        <div className="mb-4">
          <PermissionDenied message="Team management is limited to organization admins. Actions below are read-only." />
        </div>
      ) : null}

      <p className="mb-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Organization logo</span> is managed under Organization → Branding.
        Team members use profile names below — not a separate team logo.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchField value={q} onChange={setQ} placeholder="Search team members…" />
      </div>

      {roles.length ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{r.name}</p>
                <Badge variant={r.status === 'active' ? 'success' : 'muted'}>{r.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">{r.permissions.length} permissions · mock preset</p>
            </div>
          ))}
        </div>
      ) : null}

      <DataTable columns={['Name', 'Email', 'Role', 'Status', 'Last active', 'Events assigned', 'Actions']}>
        {filtered.map((m) => (
          <tr key={m.id} className="hover:bg-muted/30">
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {m.firstName[0]}
                  {m.lastName[0]}
                </span>
                <span className="font-medium">
                  {m.firstName} {m.lastName}
                </span>
              </div>
            </td>
            <td className="px-4 py-3">{m.email}</td>
            <td className="px-4 py-3 capitalize">{m.role === 'org_admin' ? 'Admin' : 'User'}</td>
            <td className="px-4 py-3">
              <Badge variant={m.status === 'active' ? 'success' : m.status === 'invited' ? 'warning' : 'muted'}>{m.status}</Badge>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(m.lastActive)}</td>
            <td className="px-4 py-3">{m.eventIds.length}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" disabled={!canManage} onClick={() => toast.message('Edit (mock)')}>
                  Edit
                </Button>
                <Button size="sm" variant="outline" disabled={!canManage} onClick={() => toast.message('Role changed (mock)')}>
                  Change role
                </Button>
                {m.status === 'invited' ? (
                  <Button size="sm" variant="ghost" disabled={!canManage} onClick={() => toast.success('Invitation resent')}>
                    Resend
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" disabled={!canManage} onClick={() => toast.message('Deactivated')}>
                  Deactivate
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      {filtered.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No team members match your search.</p> : null}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite teammate</DialogTitle>
            <DialogDescription>Send an invite with an organization role. Mock only.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              toast.success('Invitation sent (mock)')
              setInviteOpen(false)
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" required />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select defaultValue="user">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} (preset)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Send invite
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create role</DialogTitle>
            <DialogDescription>
              Custom role presets for invites. Built-in RBAC remains Admin / User until backend roles ship.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!roleName.trim()) return
              setRoles((list) => [
                {
                  id: `role-${Date.now()}`,
                  name: roleName.trim(),
                  description: roleDesc.trim() || 'Custom role',
                  permissions: rolePerms,
                  status: 'active',
                },
                ...list,
              ])
              toast.success('Role preset created (mock)')
              setRoleName('')
              setRoleDesc('')
              setRoleOpen(false)
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Role name</Label>
              <Input id="role-name" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Sales Manager" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-desc">Description</Label>
              <Textarea
                id="role-desc"
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                placeholder="Manages sales contacts and follow-ups"
                rows={2}
              />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Permissions</p>
              {PERMISSION_GROUPS.map((g) => (
                <div key={g.label} className="rounded-md border border-border p-3">
                  <p className="mb-2 text-sm font-medium">{g.label}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {g.perms.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={rolePerms.includes(p.key)} onCheckedChange={() => togglePerm(p.key)} />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRoleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create role</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
