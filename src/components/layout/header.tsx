import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  User as UserIcon,
} from 'lucide-react'
import { BellRingIcon } from '@animateicons/react/lucide'
import { useApp } from '@/context/app-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GlobalSearch } from '@/components/layout/global-search'
import { NotificationPanel } from '@/components/layout/notification-panel'
import {
  WifiStrengthIcon,
  wifiStrengthFromEffectiveType,
  wifiStrengthLabel,
  type WifiStrength,
} from '@/components/shared/wifi-strength-icon'
import { cardUsageTone, cn, initials } from '@/lib/utils'
import { can } from '@/security/permissions'
import { notificationService, queueService } from '@/services/api'
import { useQuery } from '@tanstack/react-query'

function crumbsFromPath(pathname: string) {
  if (pathname === '/') return ['Home']
  return pathname
    .split('/')
    .filter(Boolean)
    .map((p) => p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
}

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  org_admin: 'Org Admin',
  user: 'Team Member',
} as const

export function Header() {
  const {
    user,
    organization,
    organizations,
    offline,
    setOffline,
    sidebarCollapsed,
    setSidebarCollapsed,
    setMobileNavOpen,
    setOrganizationId,
    logout,
    selectedEventId,
    setSelectedEventId,
  } = useApp()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchMod, setSearchMod] = useState('Ctrl')
  /** Simulated / measured Wi‑Fi fill: single → mid (2 bars) → full. */
  const [wifiStrength, setWifiStrength] = useState<WifiStrength>('full')
  const location = useLocation()
  const navigate = useNavigate()
  const crumbs = crumbsFromPath(location.pathname)

  const { data: notifs = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.list(user!.id),
    enabled: !!user,
  })
  const unread = notifs.filter((n) => !n.read).length
  const pendingQueue = organization ? queueService.pendingCount(organization.id) : 0
  const cardsUsed = organization?.usage.cardsMonth ?? 0
  const cardsLimit = organization?.usage.cardsLimit ?? 0
  const usageTone = organization ? cardUsageTone(cardsUsed, cardsLimit) : null

  const displayWifi: WifiStrength = offline ? 'off' : wifiStrength === 'off' ? 'full' : wifiStrength

  useEffect(() => {
    const mac = /Mac|iPhone|iPad|iPod/.test(navigator.platform) || navigator.userAgent.includes('Mac')
    setSearchMod(mac ? '⌘' : 'Ctrl')
  }, [])

  useEffect(() => {
    type Conn = { effectiveType?: string }
    const nav = navigator as Navigator & { connection?: Conn; mozConnection?: Conn; webkitConnection?: Conn }
    const conn = nav.connection ?? nav.mozConnection ?? nav.webkitConnection
    setWifiStrength(wifiStrengthFromEffectiveType(conn?.effectiveType))
  }, [])

  useEffect(() => {
    if (offline) setWifiStrength('off')
    else setWifiStrength((s) => (s === 'off' ? 'full' : s))
  }, [offline])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const cycleWifi = () => {
    // full → mid (2 bars) → single → off → full
    const order: WifiStrength[] = ['full', 'mid', 'single', 'off']
    const i = order.indexOf(displayWifi)
    const next = order[(i + 1) % order.length]!
    setWifiStrength(next)
    setOffline(next === 'off')
  }

  if (!user) return null

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-3 backdrop-blur md:px-5">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
          <Menu className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>

        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-sm text-muted-foreground sm:flex">
          {crumbs.map((c, i) => (
            <span key={c} className="flex items-center gap-1">
              {i > 0 ? <ChevronRight className="size-3.5" /> : null}
              <span className={i === crumbs.length - 1 ? 'truncate font-medium text-foreground' : 'truncate'}>{c}</span>
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {(offline || pendingQueue > 0) && (
            <button
              type="button"
              onClick={() => navigate('/offline-queue')}
              className="hidden items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 text-xs text-amber-900 h-9 lg:flex dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
            >
              <WifiStrengthIcon strength={offline ? 'off' : displayWifi} className="size-3.5" />
              {offline ? `Offline — ${pendingQueue} cards waiting` : `${pendingQueue} cards waiting to sync`}
            </button>
          )}

          <Button variant="outline" className="hidden h-9 min-w-[12rem] justify-start gap-2 sm:inline-flex" onClick={() => setSearchOpen(true)}>
            <Search className="size-4 shrink-0" />
            <span className="flex-1 text-left text-muted-foreground">Search…</span>
            <span className="flex items-center gap-0.5 text-muted-foreground" aria-hidden>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none">{searchMod}</kbd>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none">K</kbd>
            </span>
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setSearchOpen(true)} aria-label={`Search (${searchMod}+K)`}>
            <Search className="size-4" />
          </Button>

          {user.role === 'super_admin' && organization ? (
            <Select value={organization.id} onValueChange={(v) => void setOrganizationId(v)}>
              <SelectTrigger className="hidden w-[180px] lg:flex" aria-label="Organization">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Select value={selectedEventId ?? 'none'} onValueChange={(v) => setSelectedEventId(v === 'none' ? null : v)}>
            <SelectTrigger className="hidden w-[160px] xl:flex" aria-label="Current event">
              <SelectValue placeholder="Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All events</SelectItem>
              <SelectItem value="evt-tech-expo">Tech Expo 2026</SelectItem>
              <SelectItem value="evt-saas-summit">SaaS Summit East</SelectItem>
              <SelectItem value="evt-midwest">Midwest Growth Forum</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={cycleWifi}
            aria-label={`${wifiStrengthLabel(displayWifi)}. Click to cycle signal strength.`}
            title={wifiStrengthLabel(displayWifi)}
          >
            <WifiStrengthIcon strength={displayWifi} />
          </Button>

          {organization && usageTone ? (
            <button
              type="button"
              onClick={() => navigate(can(user.role, 'BILLING_VIEW') ? '/billing' : '/organization')}
              className={cn(
                'hidden h-9 items-center rounded-md border px-3 text-xs font-medium sm:inline-flex',
                usageTone === 'unlimited' &&
                  'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
                usageTone === 'success' &&
                  'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
                usageTone === 'warning' &&
                  'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
                usageTone === 'danger' &&
                  'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200',
              )}
              aria-label={
                usageTone === 'unlimited'
                  ? `${organization.plan} plan, unlimited card scans`
                  : `${organization.plan} plan, ${cardsUsed} of ${cardsLimit} cards scanned`
              }
            >
              {usageTone === 'unlimited'
                ? `${organization.plan} · Unlimited`
                : `${organization.plan} · ${cardsUsed.toLocaleString()}/${cardsLimit.toLocaleString()} cards`}
            </button>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
            onClick={() => setNotificationsOpen(true)}
          >
            <BellRingIcon size={16} color="currentColor" />
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none tabular-nums text-white">
                {unread > 99 ? '99+' : unread}
              </span>
            ) : null}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-md px-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="size-9">
                  {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                  <AvatarFallback>{initials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
                </Avatar>
                <span className="hidden min-w-0 flex-col sm:flex">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-0">
              <div className="flex items-center gap-2.5 px-3 py-3">
                <Avatar className="size-9">
                  {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                  <AvatarFallback>{initials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</p>
                </div>
              </div>
              <DropdownMenuSeparator className="mx-0" />
              <div className="p-1">
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <UserIcon className="size-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="size-4" /> Preferences
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/organization')}>
                  Organization
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </div>
              <div className="border-t border-border bg-muted/40 px-4 py-3">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <a href="#" className="hover:text-foreground hover:underline" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </a>
                  <span aria-hidden>-</span>
                  <a href="#" className="hover:text-foreground hover:underline" onClick={(e) => e.preventDefault()}>
                    Terms of Service
                  </a>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  )
}
