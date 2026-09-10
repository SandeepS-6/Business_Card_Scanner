import { useState, type ReactNode } from 'react'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { CardSyncMark, LoginShowcase } from '@/components/auth/login-shell'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

export type LoginFormValues = {
  email: string
  password: string
  remember: boolean
}

type Props = {
  onSubmit: (values: LoginFormValues) => Promise<void>
  submitting?: boolean
  error?: string | null
  expired?: boolean
  /** Optional DEV-only demo account picker */
  demoSlot?: ReactNode
  defaultEmail?: string
  productLabel?: string
}

export function AuthLoginLayout({
  onSubmit,
  submitting,
  error,
  expired,
  demoSlot,
  defaultEmail = '',
  productLabel = 'your workspace',
}: Props) {
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <LoginShowcase />

      <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-24">
        <div className="mb-8 lg:hidden">
          <CardSyncMark />
        </div>

        <div className="mx-auto w-full max-w-[420px]">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to {productLabel}.</p>

          {expired ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100" role="status">
              Your session expired. Sign in again to continue.
            </p>
          ) : null}

          <form
            className="mt-8 space-y-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              void onSubmit({ email, password, remember }).then(() => setPassword(''))
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  className="h-11 pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="login-password">Password</Label>
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() => {
                    setForgotEmail(email)
                    setForgotOpen(true)
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="h-11 px-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="login-remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
              <Label htmlFor="login-remember" className="font-normal">
                Remember me
              </Label>
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="h-11 w-full text-sm font-semibold" loading={submitting}>
              Sign in
            </Button>

            <div className="relative py-1 text-center text-xs text-muted-foreground">
              <span className="absolute inset-x-0 top-1/2 border-t border-border" aria-hidden />
              <span className="relative bg-background px-3">or</span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full text-sm font-medium text-muted-foreground"
              onClick={() => toast.message('SSO is a UI placeholder — connect your IdP later.')}
            >
              Continue with SSO
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need an account?{' '}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => toast.message('Ask your organization admin for an invite (mock).')}>
              Create account
            </button>
          </p>

          <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden />
            Secured workspace · mock auth for demo only
          </p>

          {demoSlot}
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forgot password</DialogTitle>
            <DialogDescription>
              Enter your email and we&apos;ll send a reset link. This is UI-only — no email is sent.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              toast.success('Password reset link queued (mock)')
              setForgotOpen(false)
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
