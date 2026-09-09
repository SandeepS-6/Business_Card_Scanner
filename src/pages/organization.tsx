import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { FileUploadArea } from '@/components/shared/file-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/context/app-context'
import type { ThemeMode } from '@/types'
import { toast } from 'sonner'

const PRESETS = {
  Default: { primaryColor: '#0F766E', secondaryColor: '#134E4A', accentColor: '#5EEAD4', borderRadius: '0.5rem' },
  Corporate: { primaryColor: '#1D4ED8', secondaryColor: '#1E3A8A', accentColor: '#93C5FD', borderRadius: '0.375rem' },
  Modern: { primaryColor: '#0F172A', secondaryColor: '#334155', accentColor: '#38BDF8', borderRadius: '0.75rem' },
  Minimal: { primaryColor: '#171717', secondaryColor: '#404040', accentColor: '#A3A3A3', borderRadius: '0.25rem' },
}

export function OrganizationPage() {
  const { organization, updateBranding, themeMode, setThemeMode } = useApp()
  const [draft, setDraft] = useState(organization?.branding)
  const [profile, setProfile] = useState({
    name: organization?.name ?? '',
    website: organization?.website ?? '',
    email: organization?.email ?? '',
    phone: organization?.phone ?? '',
    address: organization?.address ?? '',
    description: organization?.description ?? '',
  })

  if (!organization || !draft) return <p className="text-sm text-muted-foreground">Select an organization.</p>

  const applyLive = async (next = draft) => {
    await updateBranding(next)
    toast.success('Branding applied')
  }

  return (
    <div>
      <PageHeader title="Organization" description="Company profile, branding, theme, and brand assets." />
      <Tabs defaultValue="profile">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="assets">Brand Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="max-w-2xl space-y-3">
          {(['name', 'website', 'email', 'phone', 'address'] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label className="capitalize">{k === 'name' ? 'Company name' : k}</Label>
              <Input value={profile[k]} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} />
            </div>
          ))}
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>LinkedIn</Label><Input defaultValue={organization.social.linkedin} /></div>
            <div className="space-y-1"><Label>Twitter / X</Label><Input defaultValue={organization.social.twitter} /></div>
          </div>
          <Button onClick={() => toast.success('Company profile saved (mock)')}>Save profile</Button>
        </TabsContent>

        <TabsContent value="branding" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Brand colors & images</CardTitle>
              <CardDescription>Changes apply live across the app shell for this tenant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  ['primaryColor', 'Primary color'],
                  ['secondaryColor', 'Secondary color'],
                  ['accentColor', 'Accent color'],
                  ['backgroundColor', 'Background'],
                  ['textColor', 'Text color'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <Label className="w-36">{label}</Label>
                  <Input
                    type="color"
                    className="h-9 w-14 p-1"
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  />
                  <Input value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                </div>
              ))}
              <div className="flex gap-2">
                <Button onClick={() => void applyLive()}>Save Changes</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDraft(organization.branding)
                    void applyLive(organization.branding)
                  }}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Live preview</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border" style={{ borderRadius: draft.borderRadius }}>
                <div className="flex h-10 items-center gap-2 px-3 text-white" style={{ background: draft.secondaryColor }}>
                  <img src={draft.logoUrl} alt="" className="h-6" />
                  <span className="text-xs opacity-80">Sidebar</span>
                </div>
                <div className="p-4" style={{ background: draft.backgroundColor, color: draft.textColor }}>
                  <button type="button" className="rounded px-3 py-1.5 text-sm text-white" style={{ background: draft.primaryColor, borderRadius: draft.borderRadius }}>
                    Primary button
                  </button>
                  <span className="ml-2 rounded px-2 py-1 text-xs" style={{ background: draft.accentColor }}>Accent</span>
                  <p className="mt-3 text-sm">Dashboard content preview for {organization.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Theme customization</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Mode</Label>
                <Select value={themeMode} onValueChange={(v) => setThemeMode(v as ThemeMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PRESETS).map(([name, preset]) => (
                    <Button key={name} size="sm" variant="outline" onClick={() => setDraft({ ...draft, ...preset })}>
                      {name}
                    </Button>
                  ))}
                  <Button size="sm" variant="secondary">Custom</Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Border radius</Label>
                <Input value={draft.borderRadius} onChange={(e) => setDraft({ ...draft, borderRadius: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Sidebar appearance</Label>
                <Select value={draft.sidebarStyle} onValueChange={(v) => setDraft({ ...draft, sidebarStyle: v as typeof draft.sidebarStyle })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void applyLive()}>Save Changes</Button>
                <Button variant="outline" onClick={() => setDraft(organization.branding)}>Reset</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Theme tokens are CSS variables (`--primary`, `--radius`, etc.) so a future backend can push org-specific config without redesigning components.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="grid gap-4 md:grid-cols-2">
          {[
            ['Logo', draft.logoUrl],
            ['Favicon', draft.faviconUrl],
            ['Login background', draft.loginImageUrl],
            ['Dashboard banner', draft.dashboardImageUrl],
            ['Email logo', draft.emailBrandImageUrl],
            ['Email footer image', draft.emailBrandImageUrl],
          ].map(([label, url]) => (
            <Card key={label}>
              <CardHeader><CardTitle className="text-base">{label}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <img src={url} alt={label} className="h-20 max-w-full rounded border object-contain bg-muted/40 p-2" />
                <FileUploadArea
                  label="Upload / replace"
                  className="py-6"
                  onFiles={(files) => {
                    const file = files[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => {
                      const dataUrl = String(reader.result)
                      if (label === 'Logo') setDraft({ ...draft, logoUrl: dataUrl })
                      if (label === 'Login background') setDraft({ ...draft, loginImageUrl: dataUrl })
                      toast.message(`${label} updated locally`)
                    }
                    reader.readAsDataURL(file)
                  }}
                />
                {/* FileUploadArea validates MIME/size client-side; backend must revalidate. */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void applyLive()}>Replace</Button>
                  <Button size="sm" variant="ghost" onClick={() => toast.message('Removed (mock)')}>Remove</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
