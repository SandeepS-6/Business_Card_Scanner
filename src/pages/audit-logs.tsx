import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, Pagination } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/context/app-context'
import { auditService, userService } from '@/services/api'
import { formatDateTime } from '@/lib/utils'

export function AuditLogsPage({ platform = false }: { platform?: boolean }) {
  const { organization } = useApp()
  const { data = [] } = useQuery({
    queryKey: ['audit', platform ? 'platform' : organization?.id],
    queryFn: () => auditService.list(platform ? null : organization?.id ?? null),
  })
  const [userFilter, setUserFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const filtered = useMemo(() => {
    return data.filter((a) => {
      if (!platform && a.orgId && a.orgId !== organization?.id) return false
      if (userFilter !== 'all' && a.userId !== userFilter) return false
      if (actionFilter && !a.action.toLowerCase().includes(actionFilter.toLowerCase()) && !a.resource.toLowerCase().includes(actionFilter.toLowerCase())) return false
      if (resultFilter !== 'all' && a.result !== resultFilter) return false
      return true
    })
  }, [data, userFilter, actionFilter, resultFilter, organization?.id, platform])

  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div>
      <PageHeader title={platform ? 'Platform Audit Logs' : 'Audit Logs'} description="Immutable activity trail (mock)." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={userFilter} onValueChange={(v) => { setUserFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="User" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {['user-super', 'user-nexus-admin', 'user-nexus-1', 'user-atlas-admin'].map((id) => {
              const u = userService.get(id)
              return <SelectItem key={id} value={id}>{u ? `${u.firstName} ${u.lastName}` : id}</SelectItem>
            })}
          </SelectContent>
        </Select>
        <Input className="max-w-xs" placeholder="Filter action / resource" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1) }} />
        <Select value={resultFilter} onValueChange={(v) => { setResultFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Result" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failure">Failure</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={['User', 'Action', 'Resource', 'Date/time', 'IP / device', 'Result']}>
        {rows.map((a) => {
          const u = userService.get(a.userId)
          return (
            <tr key={a.id}>
              <td className="px-4 py-3">{u ? `${u.firstName} ${u.lastName}` : a.userId}</td>
              <td className="px-4 py-3">{a.action}</td>
              <td className="px-4 py-3">{a.resource}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(a.createdAt)}</td>
              <td className="px-4 py-3">{a.ip}</td>
              <td className="px-4 py-3"><Badge variant={a.result === 'success' ? 'success' : 'danger'}>{a.result}</Badge></td>
            </tr>
          )
        })}
      </DataTable>
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
    </div>
  )
}
