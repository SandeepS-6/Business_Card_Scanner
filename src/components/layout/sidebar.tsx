import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Activity,
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  Mail,
  Map,
  MessageCircle,
  Plug,
  Radio,
  RefreshCw,
  Settings,
  Shield,
  Users,
  UserCog,
  WifiOff,
  Contact,
  Target,
  Layers,
  Globe,
  Trash2,
  Workflow,
  History,
  LifeBuoy,
  CreditCard,
  Radar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/context/app-context'
import { canAccess } from '@/services/api'
import type { Role } from '@/types'
import { NavPagePreview } from '@/components/layout/nav-page-preview'

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; area: string }

const mainNav: NavItem[] = [
  { to: '/', label: 'Home', icon: LayoutDashboard, area: 'dashboard' },
  { to: '/contacts', label: 'Contacts', icon: Contact, area: 'contacts' },
  { to: '/leads', label: 'Leads', icon: Target, area: 'leads' },
  { to: '/events', label: 'Events', icon: Calendar, area: 'events' },
  { to: '/command-center', label: 'Command Center', icon: Radar, area: 'command-center' },
  { to: '/venue-map', label: 'Venue Map', icon: Map, area: 'venue' },
  { to: '/follow-ups', label: 'Follow-ups', icon: ClipboardList, area: 'followups' },
]

const commNav: NavItem[] = [
  { to: '/communications/email', label: 'Email', icon: Mail, area: 'email' },
  { to: '/communications/whatsapp', label: 'WhatsApp', icon: MessageCircle, area: 'whatsapp' },
  { to: '/templates', label: 'Templates', icon: FileText, area: 'templates' },
]

const crmNav: NavItem[] = [
  { to: '/crm/integrations', label: 'Integrations', icon: Plug, area: 'crm' },
  { to: '/crm/sync', label: 'Sync Status', icon: RefreshCw, area: 'crm' },
  { to: '/sync-center', label: 'Sync Center', icon: Radio, area: 'sync' },
]

const opsNav: NavItem[] = [
  { to: '/offline-queue', label: 'Offline Queue', icon: WifiOff, area: 'offline' },
  { to: '/presence', label: 'Team Presence', icon: Users, area: 'presence' },
  { to: '/automations', label: 'Automations', icon: Workflow, area: 'automations' },
  { to: '/tickets', label: 'Support', icon: LifeBuoy, area: 'tickets' },
]

const adminNav: NavItem[] = [
  { to: '/team', label: 'Manage Team', icon: Users, area: 'team' },
  { to: '/organization', label: 'Organization', icon: Building2, area: 'organization' },
  { to: '/billing', label: 'Plans & Billing', icon: CreditCard, area: 'billing' },
  { to: '/recovery', label: 'Recently Deleted', icon: Trash2, area: 'recovery' },
  { to: '/versions', label: 'Version History', icon: History, area: 'versions' },
  { to: '/audit-logs', label: 'Audit Logs', icon: Shield, area: 'audit' },
  { to: '/settings', label: 'Settings', icon: Settings, area: 'settings' },
]

const superNav: NavItem[] = [
  { to: '/platform/organizations', label: 'Organizations', icon: Building2, area: 'platform.orgs' },
  { to: '/platform/users', label: 'Platform Users', icon: UserCog, area: 'platform.users' },
  { to: '/platform/templates', label: 'Global Templates', icon: Globe, area: 'platform.templates' },
  { to: '/platform/integrations', label: 'Platform Integrations', icon: Layers, area: 'platform.integrations' },
  { to: '/platform/usage', label: 'Usage & Limits', icon: Gauge, area: 'platform.usage' },
  { to: '/platform/health', label: 'System Health', icon: HeartPulse, area: 'platform.health' },
  { to: '/platform/audit', label: 'Platform Audit Logs', icon: Activity, area: 'platform.audit' },
]

function useFineHover() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setOk(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return ok
}

const PREVIEW_W = 260
const PREVIEW_GAP = 10

function NavItemLink({
  item,
  collapsed,
  showPreview,
}: {
  item: NavItem
  collapsed: boolean
  showPreview: boolean
}) {
  const triggerRef = useRef<HTMLAnchorElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const openTimer = useRef(0)
  const closeTimer = useRef(0)

  const clearTimers = () => {
    window.clearTimeout(openTimer.current)
    window.clearTimeout(closeTimer.current)
  }

  const place = () => {
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return
    const left = Math.min(r.right + PREVIEW_GAP, window.innerWidth - PREVIEW_W - 8)
    // Center on the icon; clamp so the card stays in the viewport (~220px tall).
    const top = Math.min(Math.max(r.top + r.height / 2, 110), window.innerHeight - 110)
    setPos({ top, left })
  }

  const scheduleOpen = () => {
    if (!showPreview) return
    window.clearTimeout(closeTimer.current)
    openTimer.current = window.setTimeout(() => {
      place()
      setOpen(true)
    }, 280)
  }

  const scheduleClose = () => {
    window.clearTimeout(openTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), 120)
  }

  useEffect(() => () => clearTimers(), [])

  useEffect(() => {
    if (!open) return
    const onScroll = () => setOpen(false)
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [open])

  return (
    <>
      <NavLink
        ref={triggerRef}
        to={item.to}
        end={item.to === '/'}
        title={collapsed && !showPreview ? item.label : undefined}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={scheduleOpen}
        onBlur={scheduleClose}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-foreground',
            isActive && 'bg-sidebar-accent text-sidebar-foreground font-medium',
            collapsed && 'justify-center px-2',
          )
        }
      >
        <item.icon className="size-4 shrink-0" aria-hidden />
        {!collapsed ? <span>{item.label}</span> : null}
      </NavLink>
      {showPreview && open
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-auto fixed z-50 -translate-y-1/2 rounded-lg border border-border bg-popover text-popover-foreground shadow-md"
              style={{ top: pos.top, left: pos.left, width: PREVIEW_W }}
              onMouseEnter={() => {
                window.clearTimeout(closeTimer.current)
                setOpen(true)
              }}
              onMouseLeave={scheduleClose}
            >
              <NavPagePreview area={item.area} label={item.label} />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function NavSection({
  title,
  items,
  collapsed,
  role,
  showPreview,
}: {
  title: string
  items: NavItem[]
  collapsed: boolean
  role: Role
  showPreview: boolean
}) {
  const filtered =
    role === 'user'
      ? items.filter((i) => canAccess(role, i.area))
      : role === 'org_admin'
        ? items.filter((i) => !i.area.startsWith('platform'))
        : items

  if (!filtered.length) return null

  return (
    <div className="mb-4">
      {!collapsed ? <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">{title}</p> : null}
      <ul className="space-y-0.5">
        {filtered.map((item) => (
          <li key={item.to}>
            <NavItemLink item={item} collapsed={collapsed} showPreview={showPreview} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Sidebar() {
  const { user, organization, sidebarCollapsed, mobileNavOpen, setMobileNavOpen } = useApp()
  const location = useLocation()
  const fineHover = useFineHover()
  if (!user) return null

  const showPreview = sidebarCollapsed && fineHover

  const content = (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col self-start border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all',
        sidebarCollapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      <div className={cn('flex h-14 items-center gap-2 border-b border-sidebar-border px-3', sidebarCollapsed && 'justify-center')}>
        {organization?.branding.logoUrl ? (
          <img src={organization.branding.logoUrl} alt={organization.name} className="h-7 max-w-[140px] object-contain" />
        ) : (
          <span className="font-display text-sm font-semibold">BCS</span>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-none p-2" aria-label="Main">
        <NavSection title="Main" items={mainNav} collapsed={sidebarCollapsed} role={user.role} showPreview={showPreview} />
        <NavSection title="Communications" items={commNav} collapsed={sidebarCollapsed} role={user.role} showPreview={showPreview} />
        {user.role !== 'user' ? <NavSection title="CRM" items={crmNav} collapsed={sidebarCollapsed} role={user.role} showPreview={showPreview} /> : null}
        <NavSection title="Workspace" items={opsNav} collapsed={sidebarCollapsed} role={user.role} showPreview={showPreview} />
        {user.role !== 'user' ? <NavSection title="Administration" items={adminNav} collapsed={sidebarCollapsed} role={user.role} showPreview={showPreview} /> : null}
        {user.role === 'user' ? (
          <NavSection
            title="Account"
            items={[{ to: '/settings', label: 'Settings', icon: Settings, area: 'settings' }]}
            collapsed={sidebarCollapsed}
            role={user.role}
            showPreview={showPreview}
          />
        ) : null}
        {user.role === 'super_admin' ? (
          <NavSection title="Super Admin" items={superNav} collapsed={sidebarCollapsed} role={user.role} showPreview={showPreview} />
        ) : null}
      </nav>
      {!sidebarCollapsed && organization ? (
        <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/60">
          <p className="truncate font-medium text-sidebar-foreground/80">{organization.name}</p>
          <p className="truncate">{organization.plan} plan</p>
        </div>
      ) : null}
    </aside>
  )

  return (
    <>
      <div className="hidden md:block">{content}</div>
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72" onClick={() => setMobileNavOpen(false)} key={location.pathname}>
            {content}
          </div>
        </div>
      ) : null}
    </>
  )
}
