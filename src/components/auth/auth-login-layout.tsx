import { useState, type ReactNode } from 'react'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { CardSyncMark, LoginShowcase } from '@/components/auth/login-shell'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
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

/** Login type scale — Inter regular subtitle matches product reference. */
const loginType = {
  title: 'font-sans text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-[2rem]',
  subtitle: 'mt-2 font-sans text-[15px] font-normal leading-6 tracking-normal text-slate-500 dark:text-slate-400',
  label: 'font-sans text-sm font-medium leading-none text-foreground',
  body: 'font-sans text-sm font-normal leading-5 text-slate-500 dark:text-slate-400',
  link: 'font-sans text-sm font-medium leading-5 text-primary hover:underline',
  meta: 'font-sans text-xs font-normal leading-4 text-slate-500 dark:text-slate-400',
  input: 'h-11 font-sans text-sm font-normal',
  button: 'h-11 font-sans text-sm font-semibold',
  buttonMuted: 'h-11 font-sans text-sm font-medium text-slate-600 dark:text-slate-300',
}

/** Multi-color Google G — reference mark for the SSO button (mock IdP). */
function SsoColorLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  )
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
    <div className="grid min-h-screen bg-background font-sans antialiased lg:grid-cols-2">
      <LoginShowcase />

      <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-24">
        <div className="mb-8 lg:hidden">
          <CardSyncMark />
        </div>

        <div className="mx-auto w-full max-w-[420px]">
          <h1 className={loginType.title}>Welcome back</h1>
          <p className={loginType.subtitle}>Sign in to continue to {productLabel}.</p>

          {expired ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-normal text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100" role="status">
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
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="login-email" className={loginType.label}>
                  Email
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox id="login-remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                  <Label htmlFor="login-remember" className={cn(loginType.body, 'cursor-pointer')}>
                    Remember me
                  </Label>
                </div>
              </div>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  className={cn(loginType.input, 'pl-9')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="login-password" className={loginType.label}>
                  Password
                </Label>
                <button
                  type="button"
                  className={loginType.link}
                  onClick={() => {
                    setForgotEmail(email)
                    setForgotOpen(true)
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={cn(loginType.input, 'px-9')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <p className="font-sans text-sm font-normal text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" className={cn(loginType.button, 'w-full')} loading={submitting}>
              Sign in
            </Button>

            <div className="relative py-1 text-center">
              <span className="absolute inset-x-0 top-1/2 border-t border-border" aria-hidden />
              <span className={cn(loginType.meta, 'relative bg-background px-3')}>or continue with</span>
            </div>

            <Button
              type="button"
              variant="outline"
              className={cn(loginType.buttonMuted, 'w-full gap-2.5')}
              onClick={() => toast.message('SSO is a UI placeholder — connect your IdP later.')}
            >
              <SsoColorLogo className="size-5 shrink-0" />
              Continue with SSO
            </Button>
          </form>

          <p className={cn(loginType.body, 'mt-6 text-center')}>
            Don&apos;t have an account?{' '}
            <button type="button" className={loginType.link} onClick={() => toast.message('Ask your organization admin for an invite (mock).')}>
              Create an account
            </button>
          </p>

          <p className={cn(loginType.meta, 'mt-8 flex items-center justify-center gap-1.5')}>
            <ShieldCheck className="size-3.5 text-primary" aria-hidden />
            Secure workspace access
          </p>

          {demoSlot}
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans text-lg font-semibold tracking-tight">Forgot password</DialogTitle>
            <DialogDescription className="font-sans text-[15px] font-normal leading-6 text-slate-500">
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
              <Label htmlFor="forgot-email" className={loginType.label}>
                Email
              </Label>
              <Input
                id="forgot-email"
                type="email"
                required
                className={loginType.input}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className={cn(loginType.button, 'w-full')}>
              Send reset link
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
