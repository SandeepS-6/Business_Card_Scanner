import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { useApp } from '@/context/app-context'
import { searchService } from '@/services/api'
import { can } from '@/security/permissions'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { organization, user } = useApp()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchService.search>> | null>(null)
  const navigate = useNavigate()
  const showOrgs = can(user?.role, 'SUPER_ADMIN_ACCESS')
  const showAutomations = can(user?.role, 'AUTOMATIONS_VIEW')
  const showTickets = can(user?.role, 'TICKETS_VIEW')
  const showTeam = can(user?.role, 'TEAM_VIEW') || can(user?.role, 'PRESENCE_VIEW')

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      void searchService.search(organization?.id ?? null, q).then(setResults)
    }, 150)
    return () => clearTimeout(t)
  }, [q, open, organization?.id])

  const go = (path: string) => {
    onOpenChange(false)
    setQ('')
    navigate(path)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <Command className="bg-card" shouldFilter={false}>
          <div className="flex items-center border-b border-border px-3">
            <Command.Input
              value={q}
              onValueChange={setQ}
              placeholder="Search contacts, leads, events, tickets, automations…"
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            {!q.trim() ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">Type to search across your workspace</p>
            ) : null}
            {results?.contacts.length ? (
              <Command.Group heading="Contacts" className="px-2 text-xs font-semibold text-muted-foreground">
                {results.contacts.map((c) => (
                  <Command.Item
                    key={c.id}
                    value={c.id}
                    onSelect={() => go(`/contacts/${c.id}`)}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
                  >
                    {c.fullName} · {c.company}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
            {results?.leads.length ? (
              <Command.Group heading="Leads" className="px-2 text-xs font-semibold text-muted-foreground">
                {results.leads.map((l) => (
                  <Command.Item
                    key={l.id}
                    value={l.id}
                    onSelect={() => go('/leads')}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
                  >
                    Lead {l.id} · {l.status}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
            {results?.events.length ? (
              <Command.Group heading="Events" className="px-2 text-xs font-semibold text-muted-foreground">
                {results.events.map((e) => (
                  <Command.Item
                    key={e.id}
                    value={e.id}
                    onSelect={() => go(`/events/${e.id}`)}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
                  >
                    {e.name}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
            {showTickets && results?.tickets.length ? (
              <Command.Group heading="Tickets" className="px-2 text-xs font-semibold text-muted-foreground">
                {results.tickets.map((t) => (
                  <Command.Item
                    key={t.id}
                    value={t.id}
                    onSelect={() => go(`/tickets/${t.id}`)}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
                  >
                    {t.id} · {t.subject}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
            {showAutomations && results?.automations.length ? (
              <Command.Group heading="Automations" className="px-2 text-xs font-semibold text-muted-foreground">
                {results.automations.map((a) => (
                  <Command.Item
                    key={a.id}
                    value={a.id}
                    onSelect={() => go(`/automations/${a.id}`)}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
                  >
                    {a.name}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
            {results?.templates.length ? (
              <Command.Group heading="Templates" className="px-2 text-xs font-semibold text-muted-foreground">
                {results.templates.map((t) => (
                  <Command.Item
                    key={t.id}
                    value={t.id}
                    onSelect={() => go('/templates')}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
                  >
                    {t.name} ({t.kind})
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
            {showTeam && results?.users.length ? (
              <Command.Group heading="Team members" className="px-2 text-xs font-semibold text-muted-foreground">
                {results.users.map((u) => (
                  <Command.Item
                    key={u.id}
                    value={u.id}
                    onSelect={() => go('/presence')}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
                  >
                    {u.firstName} {u.lastName}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
            {showOrgs && results?.organizations.length ? (
              <Command.Group heading="Organizations" className="px-2 text-xs font-semibold text-muted-foreground">
                {results.organizations.map((o) => (
                  <Command.Item
                    key={o.id}
                    value={o.id}
                    onSelect={() => go(`/platform/organizations/${o.id}`)}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
                  >
                    {o.name}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
