import { useState, type ReactNode } from 'react'
import { ExternalLink, Globe, Link2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FileUploadArea } from '@/components/shared/file-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/context/app-context'
import { ThemeSwitcher } from '@/components/theme/theme-switcher'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const PRESETS = {
  Default: { primaryColor: '#0F766E', secondaryColor: '#134E4A', accentColor: '#5EEAD4', borderRadius: '0.5rem' },
  Corporate: { primaryColor: '#1D4ED8', secondaryColor: '#1E3A8A', accentColor: '#93C5FD', borderRadius: '0.375rem' },
  Modern: { primaryColor: '#0F172A', secondaryColor: '#334155', accentColor: '#38BDF8', borderRadius: '0.75rem' },
  Minimal: { primaryColor: '#171717', secondaryColor: '#404040', accentColor: '#A3A3A3', borderRadius: '0.25rem' },
}

const NAV = [
  { value: 'company', label: 'Company information' },
  { value: 'contact', label: 'Contact & location' },
  { value: 'social', label: 'Social presence' },
  { value: 'branding', label: 'Branding' },
  { value: 'theme', label: 'Theme' },
  { value: 'assets', label: 'Brand assets' },
  { value: 'delete', label: 'Delete account' },
] as const

type NavValue = (typeof NAV)[number]['value']

function SectionCard({
  title,
  description,
  children,
  className,
  danger,
}: {
  title: string
  description: string
  children: ReactNode
  className?: string
  danger?: boolean
}) {
  return (
    <Card className={cn(danger && 'border-destructive/40', className)}>
      <CardHeader className="border-b border-border">
        <CardTitle className={cn(danger && 'text-destructive')}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">{children}</CardContent>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  )
}

function IconInput({
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon: typeof Globe
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type={type}
        className="pl-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export function OrganizationPage() {
  const { organization, updateBranding, expireSession } = useApp()
  const [tab, setTab] = useState<NavValue>('company')
  const [draft, setDraft] = useState(organization?.branding)
  const [profile, setProfile] = useState({
    name: organization?.name ?? '',
    website: organization?.website ?? '',
    email: organization?.email ?? '',
    phone: organization?.phone ?? '',
    address: organization?.address ?? '',
    description: organization?.description ?? '',
    linkedin: organization?.social.linkedin ?? '',
    twitter: organization?.social.twitter ?? '',
  })
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  if (!organization || !draft) return <p className="text-sm text-muted-foreground">Select an organization.</p>

  const applyLive = async (next = draft) => {
    await updateBranding(next)
    toast.success('Branding applied')
  }

  const saveProfile = () => toast.success('Saved (mock)')

  return (
    <div className="space-y-6">
      <PageHeader title="Organization" description="Company profile, branding, theme, brand assets, and account." />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav
          className="flex w-full shrink-0 flex-col gap-1 rounded-lg border border-border bg-card p-2 lg:w-56"
          aria-label="Organization sections"
        >
          {NAV.map((item) => {
            const active = tab === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                  active
                    ? item.value === 'delete'
                      ? 'bg-destructive text-white'
                      : 'bg-primary text-primary-foreground'
                    : item.value === 'delete'
                      ? 'text-destructive hover:bg-destructive/10'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="min-w-0 flex-1">
          {tab === 'company' ? (
            <SectionCard title="Company Information" description="Basic details about your organization.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company Name">
                  <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </Field>
                <Field label="Website">
                  <IconInput
                    icon={Globe}
                    value={profile.website}
                    onChange={(v) => setProfile({ ...profile, website: v })}
                    placeholder="https://"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfile}>Save changes</Button>
              </div>
            </SectionCard>
          ) : null}

          {tab === 'contact' ? (
            <SectionCard
              title="Contact & Location"
              description="Where your organization is based and how it is described."
            >
              <Field label="Address">
                <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={4}
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                />
              </Field>
              <div className="flex justify-end">
                <Button onClick={saveProfile}>Save changes</Button>
              </div>
            </SectionCard>
          ) : null}

          {tab === 'social' ? (
            <SectionCard title="Social Presence" description="Connect your organization's public profiles.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="LinkedIn">
                  <IconInput
                    icon={Link2}
                    value={profile.linkedin}
                    onChange={(v) => setProfile({ ...profile, linkedin: v })}
                    placeholder="https://linkedin.com/company/…"
                  />
                </Field>
                <Field label="Twitter / X">
                  <IconInput
                    icon={ExternalLink}
                    value={profile.twitter}
                    onChange={(v) => setProfile({ ...profile, twitter: v })}
                    placeholder="https://x.com/…"
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfile}>Save changes</Button>
              </div>
            </SectionCard>
          ) : null}

          {tab === 'branding' ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="Brand colors & images" description="Changes apply live across the app shell for this tenant.">
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
                    <Label className="w-36 shrink-0 text-sm font-medium">{label}</Label>
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
                  <Button onClick={() => void applyLive()}>Save changes</Button>
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
              </SectionCard>
              <SectionCard title="Live preview" description="How your brand colors look in the shell.">
                <div className="overflow-hidden rounded-lg border" style={{ borderRadius: draft.borderRadius }}>
                  <div className="flex h-10 items-center gap-2 px-3 text-white" style={{ background: draft.secondaryColor }}>
                    <img src={draft.logoUrl} alt="" className="h-6" />
                    <span className="text-xs opacity-80">Sidebar</span>
                  </div>
                  <div className="p-4" style={{ background: draft.backgroundColor, color: draft.textColor }}>
                    <button
                      type="button"
                      className="rounded px-3 py-1.5 text-sm text-white"
                      style={{ background: draft.primaryColor, borderRadius: draft.borderRadius }}
                    >
                      Primary button
                    </button>
                    <span className="ml-2 rounded px-2 py-1 text-xs" style={{ background: draft.accentColor }}>
                      Accent
                    </span>
                    <p className="mt-3 text-sm">Dashboard content preview for {organization.name}</p>
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : null}

          {tab === 'theme' ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="Theme customization" description="Mode, presets, radius, and sidebar appearance.">
                <Field label="Mode">
                  <ThemeSwitcher id="theme-mode" />
                </Field>
                <Field label="Presets">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PRESETS).map(([name, preset]) => (
                      <Button key={name} size="sm" variant="outline" onClick={() => setDraft({ ...draft, ...preset })}>
                        {name}
                      </Button>
                    ))}
                  </div>
                </Field>
                <Field label="Border radius">
                  <Input value={draft.borderRadius} onChange={(e) => setDraft({ ...draft, borderRadius: e.target.value })} />
                </Field>
                <Field label="Sidebar appearance">
                  <Select
                    value={draft.sidebarStyle}
                    onValueChange={(v) => setDraft({ ...draft, sidebarStyle: v as typeof draft.sidebarStyle })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="brand">Brand</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="flex gap-2">
                  <Button onClick={() => void applyLive()}>Save changes</Button>
                  <Button variant="outline" onClick={() => setDraft(organization.branding)}>
                    Reset
                  </Button>
                </div>
              </SectionCard>
              <SectionCard
                title="Preview"
                description="Theme tokens are CSS variables so org config can update without redesigning components."
              >
                <p className="text-sm text-muted-foreground">
                  Tokens such as <code className="text-xs">--primary</code> and <code className="text-xs">--radius</code> drive
                  the live shell when you save.
                </p>
              </SectionCard>
            </div>
          ) : null}

          {tab === 'assets' ? (
            <SectionCard title="Brand assets" description="Upload logos and images used across the product and email.">
              <div className="grid gap-4 md:grid-cols-2">
                {(
                  [
                    ['Logo', draft.logoUrl],
                    ['Favicon', draft.faviconUrl],
                    ['Login background', draft.loginImageUrl],
                    ['Dashboard banner', draft.dashboardImageUrl],
                    ['Email logo', draft.emailBrandImageUrl],
                    ['Email footer image', draft.emailBrandImageUrl],
                  ] as const
                ).map(([label, url]) => (
                  <div key={label} className="space-y-3 rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{label}</p>
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
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => void applyLive()}>
                        Replace
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toast.message('Removed (mock)')}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {tab === 'delete' ? (
            <SectionCard
              title="Delete my account"
              description="Permanently remove this organization workspace and associated demo data. This cannot be undone."
              danger
            >
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>All contacts, leads, and scan history for this org</li>
                <li>Events, follow-ups, tickets, and brand assets</li>
                <li>Team access to this workspace</li>
              </ul>
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                Type <span className="font-medium">{organization.name}</span> to confirm deletion.
              </div>
              <Field label="Confirm organization name">
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={organization.name}
                  autoComplete="off"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  disabled={confirmName.trim() !== organization.name}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete organization
                </Button>
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {organization.name}?</DialogTitle>
            <DialogDescription>
              This is a mock delete — your session will end. Connect a backend before using in production.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false)
                toast.success('Organization deleted (mock)')
                expireSession()
              }}
            >
              Confirm delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
