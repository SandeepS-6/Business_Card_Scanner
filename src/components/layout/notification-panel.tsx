import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BellRingIcon,
  CheckCheckIcon,
  ClockAlertIcon,
  FileScanIcon,
  FlameIcon,
  InboxIcon,
  MailIcon,
  RefreshCwIcon,
  SettingsIcon,
  UsersIcon,
  XIcon,
  type BellRingIconHandle,
} from '@animateicons/react/lucide'
import { useApp } from '@/context/app-context'
import { notificationService } from '@/services/api'
import { cn, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { NotificationItem, NotificationType } from '@/types'

const typeMeta: Record<
  NotificationType,
  { label: string; Icon: typeof FileScanIcon; tone: string }
> = {
  system: { label: 'System', Icon: SettingsIcon, tone: 'bg-slate-100 text-slate-700' },
  lead: { label: 'Lead', Icon: FlameIcon, tone: 'bg-orange-50 text-orange-700' },
  follow_up: { label: 'Follow-up', Icon: ClockAlertIcon, tone: 'bg-amber-50 text-amber-800' },
  ocr: { label: 'OCR', Icon: FileScanIcon, tone: 'bg-teal-50 text-teal-800' },
  crm: { label: 'CRM', Icon: RefreshCwIcon, tone: 'bg-sky-50 text-sky-800' },
  communication: { label: 'Message', Icon: MailIcon, tone: 'bg-emerald-50 text-emerald-800' },
  team: { label: 'Team', Icon: UsersIcon, tone: 'bg-indigo-50 text-indigo-800' },
  ticket: { label: 'Ticket', Icon: InboxIcon, tone: 'bg-violet-50 text-violet-800' },
  automation: { label: 'Automation', Icon: SettingsIcon, tone: 'bg-fuchsia-50 text-fuchsia-800' },
  sync: { label: 'Sync', Icon: RefreshCwIcon, tone: 'bg-cyan-50 text-cyan-800' },
  event: { label: 'Event', Icon: BellRingIcon, tone: 'bg-rose-50 text-rose-800' },
  billing: { label: 'Billing', Icon: ClockAlertIcon, tone: 'bg-lime-50 text-lime-800' },
  cms: { label: 'CMS', Icon: FileScanIcon, tone: 'bg-stone-100 text-stone-700' },
  recovery: { label: 'Recovery', Icon: InboxIcon, tone: 'bg-neutral-100 text-neutral-700' },
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return d === 1 ? 'Yesterday' : `${d}d ago`
}

export function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { user } = useApp()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const titleBell = useRef<BellRingIconHandle>(null)

  const { data: items = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.list(user!.id),
    enabled: !!user,
  })

  useEffect(() => {
    if (!open) return
    titleBell.current?.startAnimation()
    const t = window.setTimeout(() => titleBell.current?.stopAnimation(), 1400)
    return () => window.clearTimeout(t)
  }, [open])

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items])
  const visible = filter === 'unread' ? items.filter((i) => !i.read) : items

  if (!open || !user) return null

  async function markRead(id: string) {
    await notificationService.markRead(id)
    void qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  async function markAll() {
    await notificationService.markAllRead(user!.id)
    void qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
        aria-label="Close notifications"
        onClick={onClose}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
        style={{ animation: 'notif-slide 180ms ease-out' }}
      >
        <div className="relative overflow-hidden border-b border-border px-4 pb-3 pt-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                'radial-gradient(120% 80% at 0% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 55%), linear-gradient(180deg, color-mix(in oklab, var(--accent) 55%, white), transparent)',
            }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <BellRingIcon ref={titleBell} size={22} color="currentColor" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Notifications</h2>
                <p className="text-sm text-muted-foreground">
                  {unreadCount ? `${unreadCount} need attention` : 'You are all caught up'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onClose}
              aria-label="Close panel"
            >
              <XIcon size={18} color="currentColor" />
            </button>
          </div>

          <div className="relative mt-4 flex items-center gap-2">
            {(['all', 'unread'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition',
                  filter === key
                    ? 'bg-foreground text-background'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {key}
                {key === 'unread' && unreadCount ? ` · ${unreadCount}` : null}
              </button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-8 gap-1.5 text-xs"
              disabled={!unreadCount}
              onClick={() => void markAll()}
            >
              <CheckCheckIcon size={14} color="currentColor" />
              Mark all read
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {visible.length === 0 ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <InboxIcon size={28} color="currentColor" />
              </div>
              <div>
                <p className="font-medium">Nothing here</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filter === 'unread' ? 'No unread alerts right now.' : 'New alerts will show up here.'}
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {visible.map((item) => (
                <NotificationRow key={item.id} item={item} onMarkRead={() => void markRead(item.id)} />
              ))}
            </ul>
          )}
        </div>
      </aside>

      <style>{`
        @keyframes notif-slide {
          from { transform: translateX(12px); opacity: 0.85; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function NotificationRow({
  item,
  onMarkRead,
}: {
  item: NotificationItem
  onMarkRead: () => void
}) {
  const meta = typeMeta[item.type]
  const Icon = meta.Icon
  const high = item.priority === 'high'

  return (
    <li>
      <article
        className={cn(
          'group relative overflow-hidden rounded-xl border border-border/80 bg-background/80 p-3 transition hover:border-border hover:bg-muted/30',
          !item.read && 'bg-accent/25',
          high && !item.read && 'border-destructive/25',
        )}
      >
        {!item.read ? (
          <span
            aria-hidden
            className={cn(
              'absolute inset-y-3 left-0 w-1 rounded-full',
              high ? 'bg-destructive' : 'bg-primary',
            )}
          />
        ) : null}

        <div className="flex gap-3 pl-1.5">
          <div
            className={cn(
              'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5',
              meta.tone,
            )}
          >
            <Icon size={20} color="currentColor" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-5">{item.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', meta.tone)}>
                    {meta.label}
                  </span>
                  {high ? (
                    <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                      High
                    </span>
                  ) : null}
                </div>
              </div>
              <time
                className="shrink-0 text-[11px] text-muted-foreground"
                dateTime={item.createdAt}
                title={formatDateTime(item.createdAt)}
              >
                {relativeTime(item.createdAt)}
              </time>
            </div>

            <p className="mt-2 text-sm leading-5 text-muted-foreground">{item.message}</p>

            {!item.read ? (
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onMarkRead}>
                  Mark read
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    </li>
  )
}
