import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '@/context/app-context'
import { Button } from '@/components/ui/button'

export function UnauthorizedPage() {
  const { user, logout } = useApp()
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-4 p-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">403</p>
      <h1 className="font-display text-2xl font-semibold">Access denied</h1>
      <p className="text-sm text-muted-foreground">
        You do not have permission to open this area. Access is based on your role and organization
        membership. Protected resource details are not shown.
      </p>
      <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
        Current role: <span className="font-medium capitalize">{user?.role.replace(/_/g, ' ') ?? 'none'}</span>
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => navigate('/')}>Go to dashboard</Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button variant="ghost" onClick={logout}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

export function UnauthorizedRedirect() {
  return <Navigate to="/unauthorized" replace />
}
