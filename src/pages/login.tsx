import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '@/context/app-context'
import { AuthLoginLayout } from '@/components/auth/auth-login-layout'
import { mockAuth } from '@/security/mock-auth'
import { toUserErrorMessage } from '@/security/api-errors'

export function LoginPage() {
  const { user, login, authStatus } = useApp()
  const location = useLocation()
  const expired = (location.state as { reason?: string } | null)?.reason === 'session_expired'
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (authStatus === 'AUTHENTICATING') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Checking session…</div>
  }
  if (user && authStatus === 'AUTHENTICATED') return <Navigate to="/" replace />

  return (
    <AuthLoginLayout
      productLabel="your workspace"
      defaultEmail=""
      error={error}
      expired={expired}
      submitting={submitting}
      onSubmit={async (values) => {
        setError(null)
        setSubmitting(true)
        try {
          await login(values.email, values.password, values.remember)
        } catch (e) {
          setError(toUserErrorMessage(e))
        } finally {
          setSubmitting(false)
        }
      }}
      demoSlot={
        import.meta.env.DEV ? (
          <div className="mt-6 space-y-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Demo users (DEV only)</p>
            {mockAuth.demoUsers().map((u) => (
              <button
                key={u.id}
                type="button"
                className="block w-full rounded px-1 py-0.5 text-left hover:bg-muted"
                onClick={() => {
                  void (async () => {
                    setError(null)
                    setSubmitting(true)
                    try {
                      await login(u.email, 'demo123', true)
                    } catch (e) {
                      setError(toUserErrorMessage(e))
                    } finally {
                      setSubmitting(false)
                    }
                  })()
                }}
              >
                {u.email} · {u.role.replace('_', ' ')}
              </button>
            ))}
          </div>
        ) : null
      }
    />
  )
}
