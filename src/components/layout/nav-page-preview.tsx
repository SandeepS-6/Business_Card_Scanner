import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const META: Record<string, { description: string }> = {
  dashboard: { description: 'Overview of activity and capture' },
  contacts: { description: 'Manage your contacts' },
  leads: { description: 'Track and qualify leads' },
  events: { description: 'Events, venues, and attendance' },
  'command-center': { description: 'Live ops and field status' },
  venue: { description: 'Booth and floor layout' },
  followups: { description: 'Scheduled follow-up tasks' },
  email: { description: 'Email outreach and threads' },
  whatsapp: { description: 'WhatsApp conversations' },
  templates: { description: 'Reusable message templates' },
  crm: { description: 'CRM connections and sync' },
  sync: { description: 'Sync health and conflicts' },
  offline: { description: 'Queued cards waiting to sync' },
  presence: { description: 'Who is online at the event' },
  automations: { description: 'Rules and workflows' },
  tickets: { description: 'Support tickets' },
  team: { description: 'Team members and roles' },
  organization: { description: 'Org profile and branding' },
  billing: { description: 'Plans and invoices' },
  recovery: { description: 'Restore deleted records' },
  versions: { description: 'Change history' },
  audit: { description: 'Security and audit trail' },
  settings: { description: 'Preferences and notifications' },
  'platform.orgs': { description: 'All organizations' },
  'platform.users': { description: 'Platform-wide users' },
  'platform.templates': { description: 'Global templates' },
  'platform.integrations': { description: 'Platform integrations' },
  'platform.usage': { description: 'Usage and plan limits' },
  'platform.health': { description: 'System health checks' },
  'platform.audit': { description: 'Platform audit logs' },
}

function Chrome({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-md border border-border bg-background', className)}>
      <div className="h-3.5 border-b border-border bg-muted/60" />
      <div className="p-1.5">{children}</div>
    </div>
  )
}

function Bar({ className, w = 'w-full' }: { className?: string; w?: string }) {
  return <div className={cn('h-1.5 rounded-sm bg-muted', w, className)} />
}

function PreviewVisual({ area }: { area: string }) {
  switch (area) {
    case 'dashboard':
      return (
        <Chrome>
          <div className="mb-1.5 grid grid-cols-4 gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-sm border border-border bg-muted/40 p-1">
                <Bar w="w-2/3" className="mb-1" />
                <div className="h-2 w-4 rounded-sm bg-primary/40" />
              </div>
            ))}
          </div>
          <div className="flex h-10 items-end gap-0.5 rounded-sm border border-border bg-muted/20 px-1 pb-1">
            {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-primary/35" style={{ height: `${h}%` }} />
            ))}
          </div>
        </Chrome>
      )
    case 'contacts':
      return (
        <Chrome>
          <div className="mb-1 flex gap-1">
            <Bar className="flex-1" />
            <div className="h-1.5 w-6 rounded-sm bg-primary/40" />
          </div>
          <div className="space-y-1">
            {['Name · Acme', 'Name · Globex', 'Name · Initech'].map((row) => (
              <div key={row} className="flex items-center gap-1.5 rounded-sm border border-border px-1 py-1">
                <div className="size-2.5 shrink-0 rounded-sm bg-muted" />
                <span className="truncate text-[9px] text-muted-foreground">{row}</span>
              </div>
            ))}
          </div>
        </Chrome>
      )
    case 'leads':
      return (
        <Chrome>
          <div className="grid grid-cols-3 gap-1">
            {['New', 'Qual.', 'Won'].map((col) => (
              <div key={col} className="space-y-1 rounded-sm border border-border bg-muted/20 p-1">
                <p className="text-[8px] font-medium text-muted-foreground">{col}</p>
                <div className="h-5 rounded-sm border border-border bg-card" />
                <div className="h-5 rounded-sm border border-border bg-card" />
              </div>
            ))}
          </div>
        </Chrome>
      )
    case 'events':
      return (
        <Chrome>
          <div className="space-y-1">
            {['Tech Expo 2026', 'SaaS Summit', 'Growth Forum'].map((name) => (
              <div key={name} className="flex gap-1.5 rounded-sm border border-border p-1">
                <div className="w-6 shrink-0 rounded-sm bg-primary/20 py-1 text-center text-[8px] font-medium text-primary">
                  12
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-[9px] font-medium">{name}</p>
                  <Bar w="w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </Chrome>
      )
    case 'followups':
      return (
        <Chrome>
          <div className="space-y-1">
            {['Call · Due today', 'Email · Tomorrow', 'WhatsApp · Fri'].map((row) => (
              <div key={row} className="flex items-center gap-1.5 rounded-sm border border-border px-1 py-1">
                <div className="size-2 shrink-0 rounded-sm border border-border" />
                <span className="truncate text-[9px] text-muted-foreground">{row}</span>
              </div>
            ))}
          </div>
        </Chrome>
      )
    case 'team':
    case 'presence':
      return (
        <Chrome>
          <div className="mb-1.5 flex -space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="size-4 rounded-full border border-background bg-muted" />
            ))}
          </div>
          <div className="space-y-1">
            {['Alex · Online', 'Sam · Away', 'Jordan · Offline'].map((row) => (
              <div key={row} className="flex items-center justify-between rounded-sm border border-border px-1 py-1">
                <span className="text-[9px] text-muted-foreground">{row.split(' · ')[0]}</span>
                <span className="text-[8px] font-medium text-muted-foreground">{row.split(' · ')[1]}</span>
              </div>
            ))}
          </div>
        </Chrome>
      )
    case 'settings':
      return (
        <Chrome>
          <div className="space-y-1.5">
            {['Email alerts', 'Push notifications', 'Weekly digest'].map((row) => (
              <div key={row} className="flex items-center justify-between gap-2">
                <Bar w="w-2/3" />
                <div className="h-2.5 w-5 shrink-0 rounded-full bg-primary/40" />
              </div>
            ))}
          </div>
        </Chrome>
      )
    case 'venue':
      return (
        <Chrome>
          <div className="grid h-16 grid-cols-4 grid-rows-3 gap-0.5 rounded-sm border border-border bg-muted/20 p-1">
            <div className="col-span-2 row-span-2 rounded-sm bg-primary/25" />
            <div className="rounded-sm bg-muted" />
            <div className="rounded-sm bg-muted" />
            <div className="col-span-2 rounded-sm bg-muted" />
          </div>
        </Chrome>
      )
    case 'command-center':
      return (
        <Chrome>
          <div className="mb-1 grid grid-cols-3 gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-sm border border-border p-1 text-center">
                <div className="mx-auto mb-0.5 h-2 w-3 rounded-sm bg-primary/40" />
                <Bar />
              </div>
            ))}
          </div>
          <div className="h-8 rounded-sm border border-dashed border-border bg-muted/30" />
        </Chrome>
      )
    case 'email':
    case 'whatsapp':
      return (
        <Chrome>
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-1.5 rounded-sm border border-border p-1">
                <div className="size-3 shrink-0 rounded-full bg-muted" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <Bar w="w-1/2" />
                  <Bar w="w-full" />
                </div>
              </div>
            ))}
          </div>
        </Chrome>
      )
    default:
      return (
        <Chrome>
          <div className="mb-1.5 space-y-1">
            <Bar w="w-1/3" className="h-2" />
            <Bar w="w-2/3" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="h-8 rounded-sm border border-border bg-muted/30" />
            <div className="h-8 rounded-sm border border-border bg-muted/30" />
          </div>
        </Chrome>
      )
  }
}

export function NavPagePreview({ area, label }: { area: string; label: string }) {
  const description = META[area]?.description ?? `Open ${label}`
  return (
    <div className="w-[260px] p-2">
      <PreviewVisual area={area} />
      <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
