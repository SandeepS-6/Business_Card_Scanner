import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Building2,
  CreditCard,
  Mail,
  MessageSquare,
  Shield,
  Users,
  Calendar,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FileUploadArea } from '@/components/shared/file-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/context/app-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function PrefRow({
  icon: Icon,
  iconClass,
  title,
  description,
  defaultChecked,
}: {
  icon: typeof Bell
  iconClass: string
  title: string
  description: string
  defaultChecked?: boolean
}) {
  const [on, setOn] = useState(!!defaultChecked)
  return (
    <div className="flex items-start gap-3 border-b border-border py-4 last:border-0 last:pb-0 first:pt-0">
      <div className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md', iconClass)} aria-hidden>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <Label className="text-sm font-medium">{title}</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} aria-label={title} />
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  )
}

export function SettingsPage() {
  const { user, organization, expireSession } = useApp()

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, notifications, security, and preferences." />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information and avatar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name">
                  <Input defaultValue={user?.firstName} autoComplete="given-name" />
                </Field>
                <Field label="Last name">
                  <Input defaultValue={user?.lastName} autoComplete="family-name" />
                </Field>
              </div>
              <Field label="Email">
                <Input type="email" defaultValue={user?.email} autoComplete="email" />
              </Field>
              <Field label="Phone">
                <Input defaultValue={user?.phone} autoComplete="tel" />
              </Field>
              <Field label="Profile image">
                <FileUploadArea
                  label="Upload a JPEG, PNG, or WEBP image"
                  className="py-8"
                  onFiles={() => toast.message('Avatar updated (mock)')}
                />
              </Field>
              <div className="flex justify-end pt-1">
                <Button onClick={() => toast.success('Profile saved')}>Save profile</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>Choose how and when BusinessCardScanner alerts you.</CardDescription>
            </CardHeader>
            <CardContent>
              <PrefRow
                icon={Bell}
                iconClass="bg-primary/10 text-primary"
                title="In-app notifications"
                description="Show alerts in the notification center."
                defaultChecked
              />
              <PrefRow
                icon={Mail}
                iconClass="bg-sky-500/10 text-sky-700 dark:text-sky-400"
                title="Email notifications"
                description="Receive important updates by email."
                defaultChecked
              />
              <PrefRow
                icon={MessageSquare}
                iconClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                title="WhatsApp notifications"
                description="Optional alerts via WhatsApp Business."
              />
              <PrefRow
                icon={Calendar}
                iconClass="bg-teal-500/10 text-teal-800 dark:text-teal-400"
                title="Event activity"
                description="Cards scanned, leads captured, and live event updates."
                defaultChecked
              />
              <PrefRow
                icon={Users}
                iconClass="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                title="Team activity"
                description="Invites, assignments, and presence changes."
                defaultChecked
              />
              <PrefRow
                icon={CreditCard}
                iconClass="bg-orange-500/10 text-orange-800 dark:text-orange-400"
                title="Billing alerts"
                description="Usage thresholds, invoices, and plan changes."
                defaultChecked
              />
              <PrefRow
                icon={MessageSquare}
                iconClass="bg-blue-500/10 text-blue-700 dark:text-blue-400"
                title="Support tickets"
                description="New tickets, replies, and status changes."
                defaultChecked
              />
              <PrefRow
                icon={Shield}
                iconClass="bg-violet-500/10 text-violet-700 dark:text-violet-400"
                title="Security alerts"
                description="Sign-ins, password changes, and permission updates."
                defaultChecked
              />
              <div className="flex justify-end pt-4">
                <Button onClick={() => toast.success('Notification preferences saved')}>Save preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-0 max-w-2xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your password. Backend authentication required for production.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Current password">
                <Input type="password" placeholder="Current password" autoComplete="current-password" />
              </Field>
              <Field label="New password">
                <Input type="password" placeholder="New password" autoComplete="new-password" />
              </Field>
              <div className="flex justify-end">
                <Button onClick={() => toast.success('Password updated (mock)')}>Update password</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Manage where you are signed in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Current session · Chrome on Windows · Active now</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => toast.message('Other sessions revoked')}>
                  Sign out other sessions
                </Button>
                <Button variant="outline" onClick={() => expireSession()}>
                  Simulate session expired
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-factor authentication</CardTitle>
              <CardDescription>Add an extra layer of security when backend auth is connected.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled>Enable 2FA</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="mt-0 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Workspace details for the current tenant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Building2 className="size-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{organization?.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{organization?.description}</p>
                </div>
              </div>
              <Link
                to="/organization"
                className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Open branding & preferences
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="mt-0 max-w-2xl">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Email</CardTitle>
                <CardDescription>Outbound email provider (placeholder).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="From address">
                  <Input placeholder="From address" defaultValue={organization?.email} />
                </Field>
                <Button variant="outline" disabled>
                  Connect email
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp</CardTitle>
                <CardDescription>Business API configuration (placeholder).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Phone number ID">
                  <Input placeholder="Phone number ID" />
                </Field>
                <Button variant="outline" disabled>
                  Connect WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
