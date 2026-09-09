import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/context/app-context'
import { toast } from 'sonner'
import { FileUploadArea } from '@/components/shared/file-upload'
import { Link } from 'react-router-dom'

export function SettingsPage() {
  const { user, organization, expireSession } = useApp()

  return (
    <div>
      <PageHeader title="Settings" description="Profile, notifications, security, and preferences." />
      <Tabs defaultValue="profile">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="max-w-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>First name</Label><Input defaultValue={user?.firstName} /></div>
            <div className="space-y-1"><Label>Last name</Label><Input defaultValue={user?.lastName} /></div>
          </div>
          <div className="space-y-1"><Label>Email</Label><Input type="email" defaultValue={user?.email} /></div>
          <div className="space-y-1"><Label>Phone</Label><Input defaultValue={user?.phone} /></div>
          <FileUploadArea label="Profile image upload" className="py-8" onFiles={() => toast.message('Avatar updated (mock)')} />
          <Button onClick={() => toast.success('Profile saved')}>Save</Button>
        </TabsContent>

        <TabsContent value="notifications" className="max-w-lg space-y-4">
          {[
            ['In-app', true],
            ['Email', true],
            ['WhatsApp', false],
            ['Browser notifications', false],
          ].map(([label, on]) => (
            <div key={String(label)} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <Label>{label}</Label>
              <Switch defaultChecked={!!on} />
            </div>
          ))}
          <Button onClick={() => toast.success('Notification preferences saved')}>Save</Button>
        </TabsContent>

        <TabsContent value="security" className="max-w-lg space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Password</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {/* SECURITY: Backend password change required — never log or persist password fields. */}
              <Input type="password" placeholder="Current password" autoComplete="current-password" />
              <Input type="password" placeholder="New password" autoComplete="new-password" />
              <Button onClick={() => toast.success('Password updated (mock)')}>Update password</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Sessions</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Current session · Chrome on Windows · Active now</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => toast.message('Other sessions revoked')}>
                  Sign out other sessions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Demo-only: exercises SESSION_EXPIRED UX for future 401 handling.
                    expireSession()
                  }}
                >
                  Simulate session expired
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Two-factor authentication</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Placeholder — enable when backend auth is connected.
              <div className="mt-3"><Button disabled>Enable 2FA</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-3 text-sm">
          <p>{organization?.name}</p>
          <p className="text-muted-foreground">{organization?.description}</p>
          <Link className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm text-primary-foreground" to="/organization">
            Open branding & preferences
          </Link>
        </TabsContent>

        <TabsContent value="communication" className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Email configuration</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Provider placeholder (SES / SendGrid)</p>
              <Input placeholder="From address" defaultValue={organization?.email} />
              <Button variant="outline" disabled>Connect email</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">WhatsApp configuration</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Business API placeholder</p>
              <Input placeholder="Phone number ID" />
              <Button variant="outline" disabled>Connect WhatsApp</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
