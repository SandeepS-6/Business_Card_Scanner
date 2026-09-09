import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useApp } from '@/context/app-context'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { mockAuth } from '@/security/mock-auth'
import { toUserErrorMessage } from '@/security/api-errors'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { user, login, authStatus } = useApp()
  const location = useLocation()
  const expired = (location.state as { reason?: string } | null)?.reason === 'session_expired'
  const [error, setError] = useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: import.meta.env.DEV ? 'admin@nexus-events.example' : '',
      password: '',
      remember: true,
    },
  })

  if (authStatus === 'AUTHENTICATING') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Checking session…</div>
  }
  if (user && authStatus === 'AUTHENTICATED') return <Navigate to="/" replace />

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    try {
      await login(values.email, values.password, values.remember !== false)
      form.setValue('password', '')
    } catch (e) {
      setError(toUserErrorMessage(e))
      form.setValue('password', '')
    }
  })

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-900 lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,' +
              encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0f766e"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs><rect width="800" height="1200" fill="url(#g)"/></svg>',
              ) +
              '")',
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-teal-600 font-display font-bold">B</div>
            <span className="font-display text-xl font-semibold">BusinessCardScanner</span>
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight">Card → Contact → Lead → Follow-up</h2>
            <p className="mt-3 max-w-md text-slate-300">
              Multi-tenant event lead capture with OCR review, communications, and CRM sync — ready for backend integration.
            </p>
          </div>
          <p className="text-sm text-slate-400">Demo UI · mock authentication only (not production auth)</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>Use a demo account to explore roles and branding.</CardDescription>
          </CardHeader>
          <CardContent>
            {expired ? (
              <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
                Your session expired. Sign in again to continue.
              </p>
            ) : null}
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="username" {...form.register('email')} />
                {form.formState.errors.email ? <p className="text-xs text-destructive">{form.formState.errors.email.message}</p> : null}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs text-primary hover:underline" disabled title="UI placeholder">
                    Forgot password?
                  </button>
                </div>
                <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={!!form.watch('remember')}
                  onCheckedChange={(v) => form.setValue('remember', !!v)}
                />
                <Label htmlFor="remember" className="font-normal">
                  Remember me
                </Label>
              </div>
              {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
              <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
                Sign in
              </Button>
              <Button type="button" variant="outline" className="w-full" disabled title="Placeholder for SSO">
                Continue with SSO
              </Button>
            </form>

            {import.meta.env.DEV ? (
              <div className="mt-6 space-y-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Demo users (DEV only — password shown in local demo docs)</p>
                {mockAuth.demoUsers().map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="block w-full rounded px-1 py-0.5 text-left hover:bg-muted"
                    onClick={() => form.reset({ email: u.email, password: 'demo123', remember: true })}
                  >
                    {u.email} · {u.role.replace('_', ' ')}
                  </button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
