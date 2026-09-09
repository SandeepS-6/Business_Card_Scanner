import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { can } from '@/security/permissions'
import { PermissionDenied } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/context/app-context'
import { userService } from '@/services/api'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { useState } from 'react'

export function TeamPage() {
  const { organization, user } = useApp()
  const canManage = can(user?.role, 'TEAM_MANAGE')
  const { data = [] } = useQuery({
    queryKey: ['team', organization?.id],
    queryFn: () => userService.byOrg(organization!.id),
    enabled: !!organization,
  })
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Manage Team"
        description="Invite members and manage organization roles."
        actions={
          <Button disabled={!canManage} onClick={() => setInviteOpen(true)}>
            Invite
          </Button>
        }
      />
      {!canManage ? <div className="mb-4"><PermissionDenied message="Team management is limited to organization admins. Actions below are read-only." /></div> : null}
      <DataTable columns={['Name', 'Email', 'Role', 'Status', 'Last active', 'Events assigned', 'Actions']}>
        {data.map((m) => (
          <tr key={m.id}>
            <td className="px-4 py-3 font-medium">{m.firstName} {m.lastName}</td>
            <td className="px-4 py-3">{m.email}</td>
            <td className="px-4 py-3 capitalize">{m.role === 'org_admin' ? 'Admin' : 'User'}</td>
            <td className="px-4 py-3"><Badge variant={m.status === 'active' ? 'success' : m.status === 'invited' ? 'warning' : 'muted'}>{m.status}</Badge></td>
            <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(m.lastActive)}</td>
            <td className="px-4 py-3">{m.eventIds.length}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" disabled={!canManage} onClick={() => toast.message('Edit (mock)')}>Edit</Button>
                <Button size="sm" variant="outline" disabled={!canManage} onClick={() => toast.message('Role changed')}>Change role</Button>
                {m.status === 'invited' ? <Button size="sm" variant="ghost" disabled={!canManage} onClick={() => toast.success('Invitation resent')}>Resend</Button> : null}
                <Button size="sm" variant="ghost" disabled={!canManage} onClick={() => toast.message('Deactivated')}>Deactivate</Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite teammate</DialogTitle></DialogHeader>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); toast.success('Invitation sent (mock)'); setInviteOpen(false) }}>
            <div className="space-y-1"><Label>Email</Label><Input type="email" required /></div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select defaultValue="user">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Send invite</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
