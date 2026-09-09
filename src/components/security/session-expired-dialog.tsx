import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/app-context'
import { Button } from '@/components/ui/button'

export function SessionExpiredDialog() {
  const { authStatus, acknowledgeSessionExpired } = useApp()
  const navigate = useNavigate()

  if (authStatus !== 'SESSION_EXPIRED') return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4">
      <div role="alertdialog" aria-labelledby="session-expired-title" className="w-full max-w-md rounded-lg border border-border bg-card p-5">
        <h2 id="session-expired-title" className="font-display text-lg font-semibold">
          Session expired
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          For your security, your session ended. Sign in again to continue. No sensitive details are shown here.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            onClick={() => {
              acknowledgeSessionExpired()
              navigate('/login', { replace: true, state: { reason: 'session_expired' } })
            }}
          >
            Sign in
          </Button>
        </div>
      </div>
    </div>
  )
}
