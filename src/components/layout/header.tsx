import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  CircleHelp,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  User as UserIcon,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { BellRingIcon } from '@animateicons/react/lucide'
import { useApp } from '@/context/app-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GlobalSearch } from '@/components/layout/global-search'
import { NotificationPanel } from '@/components/layout/notification-panel'
import { initials } from '@/lib/utils'
import { notificationService, queueService } from '@/services/api'
import { useQuery } from '@tanstack/react-query'

function crumbsFromPath(pathname: string) {
  if (pathname === '/') return ['Home']
  return pathname
    .split('/')
    .filter(Boolean)
    .map((p) => p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
}

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
              className="hidden items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900 lg:flex dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
            >
              <WifiOff className="size-3.5" />
              {offline ? `Offline — ${pendingQueue} cards waiting` : `${pendingQueue} cards waiting to sync`}
            </button>
          )}

          <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex" onClick={() => setSearchOpen(true)}>
            <Search className="size-3.5" />
            <span className="text-muted-foreground">Search…</span>
            <kbd className="rounded border border-border bg-muted px-1 text-[10px]">⌘K</kbd>
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setSearchOpen(true)} aria-label="Search">
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

          <Button variant="ghost" size="icon" onClick={() => setOffline(!offline)} aria-label={offline ? 'Go online' : 'Simulate offline'}>
            {offline ? <WifiOff className="size-4 text-amber-600" /> : <Wifi className="size-4" />}
          </Button>

          <Button variant="ghost" size="icon" aria-label="Help" onClick={() => navigate('/settings')}>
            <CircleHelp className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(true)}
          >
            <BellRingIcon size={16} color="currentColor" />
            {unread > 0 ? (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            ) : null}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar>
                  <AvatarFallback>{initials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {user.firstName} {user.lastName}
                <p className="font-normal text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  )
}
