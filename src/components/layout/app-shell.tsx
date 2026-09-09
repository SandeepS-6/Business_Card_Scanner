import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { InstallAppPrompt } from '@/components/layout/install-app-prompt'
import { Calendar, Contact, LayoutDashboard, Target } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const mobileTabs = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/contacts', label: 'Contacts', icon: Contact },
  { to: '/leads', label: 'Leads', icon: Target },
  { to: '/events', label: 'Events', icon: Calendar },
]

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <InstallAppPrompt />
        <main className="flex-1 overflow-x-hidden p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card md:hidden" aria-label="Mobile">
          {mobileTabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                cn('flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground', isActive && 'text-primary')
              }
            >
              <t.icon className="size-5" />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
