import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '@/context/app-context'
import { can, type Permission } from '@/security/permissions'
import { UnauthorizedRedirect } from '@/components/security/unauthorized-page'

export function RequireAuth() {
  const { authStatus, user } = useApp()
  if (authStatus === 'AUTHENTICATING') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    )
  }
  if (authStatus === 'SESSION_EXPIRED') {
    return <Navigate to="/login" replace state={{ reason: 'session_expired' }} />
  }
  if (!user || authStatus !== 'AUTHENTICATED') {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

export function RequirePermission({ permission }: { permission: Permission }) {
  const { user } = useApp()
  if (!can(user?.role, permission)) return <UnauthorizedRedirect />
  return <Outlet />
}
