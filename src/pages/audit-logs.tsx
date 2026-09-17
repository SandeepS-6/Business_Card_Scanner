import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, Pagination } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useApp } from '@/context/app-context'
import { usePageSize } from '@/hooks/use-page-size'
import { auditService, userService } from '@/services/api'
import { formatDateTime } from '@/lib/utils'

/** Single Audit Logs module — platform-wide for super_admin, org-scoped otherwise. */
export function AuditLogsPage({
  platform,
  userId,
}: {
  /** Force platform scope. When omitted, super_admin defaults to platform. */
  platform?: boolean
  /** When set, show only this user's events (user detail / scoped view). */
  userId?: string
}) {
  const { organization, user } = useApp()
  const platformScope = platform ?? user?.role === 'super_admin'
  const { data = [], isLoading } = useQuery({
    queryKey: ['audit', platformScope ? 'platform' : organization?.id],
    queryFn: () => auditService.list(platformScope ? null : (organization?.id ?? null)),
  })
  const [userFilter, setUserFilter] = useState(userId ?? 'all')
  const [actionFilter, setActionFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = usePageSize()

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  useEffect(() => {
    if (userId) setUserFilter(userId)
  }, [userId])

  const filtered = useMemo(() => {
    return data.filter((a) => {
      if (!platformScope && a.orgId && a.orgId !== organization?.id) return false
      if (userId && a.userId !== userId) return false
      if (!userId && userFilter !== 'all' && a.userId !== userFilter) return false
      if (
        actionFilter &&
        !a.action.toLowerCase().includes(actionFilter.toLowerCase()) &&
        !a.resource.toLowerCase().includes(actionFilter.toLowerCase())
      ) {
        return false
      }
      if (resultFilter !== 'all' && a.result !== resultFilter) return false
      return true
    })
  }, [data, userFilter, actionFilter, resultFilter, organization?.id, platformScope, userId])

  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)

  const title = userId ? 'User activity' : 'Audit Logs'
  const description = userId
    ? 'Activity for the selected user.'
    : platformScope
      ? 'Platform-wide activity trail.'
      : 'Organization activity trail.'

  return (
    <div>
      <PageHeader title={title} description={description} />
      {!userId ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Select
            value={userFilter}
            onValueChange={(v) => {
              setUserFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {['user-super', 'user-nexus-admin', 'user-nexus-1', 'user-atlas-admin'].map((id) => {
                const u = userService.get(id)
                return (
                  <SelectItem key={id} value={id}>
                    {u ? `${u.firstName} ${u.lastName}` : id}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Input
            className="max-w-xs"
            placeholder="Filter action / resource"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
          />
          <Select
            value={resultFilter}
            onValueChange={(v) => {
              setResultFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All results</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failure">Failure</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {isLoading ? (
        <TableSkeleton cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No audit events" description="No matching activity for the current filters." />
      ) : (
        <>
          <DataTable columns={['User', 'Action', 'Resource', 'Date/time', 'IP / device', 'Result']}>
            {rows.map((a) => {
              const u = userService.get(a.userId)
              return (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">{u ? `${u.firstName} ${u.lastName}` : a.userId}</td>
                  <td className="px-4 py-3 font-medium">{a.action}</td>
                  <td className="px-4 py-3">{a.resource}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(a.createdAt)}</td>
                  <td className="px-4 py-3">{a.ip}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.result === 'success' ? 'success' : 'danger'}>{a.result}</Badge>
                  </td>
                </tr>
              )
            })}
          </DataTable>
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
        </>
      )}
    </div>
  )
}
