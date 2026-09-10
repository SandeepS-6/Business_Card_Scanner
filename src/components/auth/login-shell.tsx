import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CardSyncMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img src="/favicon.svg" alt="" className="size-9 rounded-lg" />
      <span className="font-sans text-xl font-semibold tracking-tight text-foreground">CardSync</span>
    </div>
  )
}

type FeedItem =
  | { id: string; kind: 'scan'; name: string; meta: string }
  | { id: string; kind: 'added'; event: string }
  | { id: string; kind: 'progress'; pct: number }

const FEED_SEED: Omit<FeedItem, 'id'>[] = [
  { kind: 'scan', name: 'Elena Ruiz', meta: 'Head of Partnerships · Northwind' },
  { kind: 'added', event: 'SaaS Summit 2026' },
  { kind: 'progress', pct: 68 },
  { kind: 'scan', name: 'Jordan Lee', meta: 'VP Partnerships · Brightwave Labs' },
  { kind: 'added', event: 'Tech Expo 2026' },
  { kind: 'progress', pct: 42 },
  { kind: 'scan', name: 'Priya Shah', meta: 'Director of Sales · Helix Labs' },
  { kind: 'added', event: 'Field Day Chicago' },
  { kind: 'progress', pct: 55 },
  { kind: 'scan', name: 'Marcus Chen', meta: 'CTO · Orbit Systems' },
  { kind: 'added', event: 'SaaS Summit 2026' },
  { kind: 'progress', pct: 73 },
  { kind: 'scan', name: 'Ava Nguyen', meta: 'Product Lead · Lattice' },
  { kind: 'added', event: 'Moscone Partner Day' },
  { kind: 'progress', pct: 31 },
  { kind: 'scan', name: 'Sam Okonkwo', meta: 'Founder · Meridian' },
  { kind: 'added', event: 'Tech Expo 2026' },
  { kind: 'progress', pct: 89 },
  { kind: 'scan', name: 'Nora Blake', meta: 'Account Executive · Cobalt' },
  { kind: 'added', event: 'SaaS Summit 2026' },
  { kind: 'progress', pct: 61 },
  { kind: 'scan', name: 'Diego Alvarez', meta: 'Growth · Northwind' },
]

const FEED: FeedItem[] = FEED_SEED.map((item, i) => ({ ...item, id: `feed-${i}` }))

const cardShell =
  'flex items-center gap-3 rounded-[1.25rem] border border-black/[0.04] bg-white px-4 py-3.5 shadow-[0_10px_28px_-12px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-card'

function ScanCard({ name, meta }: { name: string; meta: string }) {
  return (
    <div className={cardShell}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300">
        <ScanLine className="size-4" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-[15px] font-bold leading-snug tracking-tight text-slate-900 dark:text-foreground">{name}</p>
        <p className="mt-0.5 truncate font-sans text-[13px] font-normal leading-snug tracking-normal text-slate-500 dark:text-slate-400">{meta}</p>
      </div>
      <span className="ml-auto shrink-0 rounded-full bg-sky-500/15 px-2.5 py-1 font-sans text-xs font-medium text-sky-700 dark:text-sky-300">
        Scanned
      </span>
    </div>
  )
}

function AddedCard({ event }: { event: string }) {
  return (
    <div className={cardShell}>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-emerald-500 text-emerald-600 dark:text-emerald-400">
        <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
      </div>
      <p className="min-w-0 font-sans text-[14px] font-normal leading-snug text-slate-600 dark:text-slate-300">
        Added to &quot;{event}&quot; leads
      </p>
    </div>
  )
}

function ProgressCard({ pct }: { pct: number }) {
  return (
    <div className={cardShell}>
      <div className="h-2 w-28 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
        <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
      <p className="min-w-0 font-sans text-[13px] font-normal tabular-nums tracking-normal text-slate-500 dark:text-slate-400">
        {pct}% of leads followed up
      </p>
    </div>
  )
}

function FeedCard({ item }: { item: FeedItem }) {
  if (item.kind === 'scan') return <ScanCard name={item.name} meta={item.meta} />
  if (item.kind === 'added') return <AddedCard event={item.event} />
  return <ProgressCard pct={item.pct} />
}

const STACK_SIZE = 3
const STACK_INTERVAL_MS = 2800

const stackSpring = { type: 'spring' as const, stiffness: 280, damping: 32, mass: 0.85 }

/**
 * Notification stack: new card enters at the bottom, older cards shift up;
 * top card exits. Smooth layout + spring (not a marquee).
 */
function ActivityFeedStack() {
  const [stack, setStack] = useState(() =>
    FEED.slice(0, STACK_SIZE).map((item, i) => ({ ...item, key: `${item.id}-init-${i}` })),
  )

  useEffect(() => {
    let nextIndex = STACK_SIZE
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const timer = window.setInterval(() => {
      const item = FEED[nextIndex % FEED.length]
      const key = `${item.id}-${nextIndex}`
      nextIndex += 1
      setStack((prev) => [...prev, { ...item, key }].slice(-STACK_SIZE))
    }, STACK_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [])

  // Staircase: top flush / widest; each lower card steps further right.
  const step = ['ml-0 w-full', 'ml-6 w-[94%]', 'ml-12 w-[88%]'] as const

  return (
    <div className="relative mt-8 h-[280px] xl:h-[300px]" aria-hidden>
      <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {stack.map((item, i) => (
            <motion.div
              key={item.key}
              layout
              initial={{ opacity: 0, y: 36, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.96 }}
              transition={stackSpring}
              className={step[i] ?? step[2]}
            >
              <FeedCard item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

type ShowcaseSlide = {
  id: string
  eyebrow?: string
  title: string
  body: string
  visual?: ReactNode
}

/** Showcase-panel slides — add more when product content is provided. */
const DEFAULT_SLIDES: ShowcaseSlide[] = [
  {
    id: 'capture',
    title: 'Capture. Connect.\nFollow up.',
    body: 'Turn every business card into an organised contact, linked to the event it came from and the follow-up it deserves.',
  },
]

export function LoginShowcase({ slides = DEFAULT_SLIDES }: { slides?: ShowcaseSlide[] }) {
  const [index, setIndex] = useState(0)
  const slide = slides[index] ?? slides[0]

  useEffect(() => {
    if (slides.length < 2) return
    const t = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000)
    return () => window.clearInterval(t)
  }, [slides.length])

  return (
    <div className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(14,165,233,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(15,118,110,0.10),_transparent_50%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.22]"
        style={{
          backgroundImage:
            'linear-gradient(to right, color-mix(in oklab, var(--border) 65%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 65%, transparent) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-1 flex-col p-10 xl:p-12">
        <CardSyncMark />

        <div className="mt-14 max-w-xl flex-1" key={slide.id}>
          {slide.eyebrow ? (
            <p className="mb-3 font-sans text-sm font-medium text-muted-foreground">{slide.eyebrow}</p>
          ) : null}
          <h2 className="font-sans text-[2.5rem] font-semibold leading-[1.12] tracking-[-0.03em] whitespace-pre-line text-foreground xl:text-[3.25rem]">
            {slide.title}
          </h2>
          <p className="mt-4 max-w-md font-sans text-[15px] font-normal leading-6 tracking-normal text-slate-500 dark:text-slate-400">
            {slide.body}
          </p>
          {slide.visual ?? <ActivityFeedStack />}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          {slides.length > 1 ? (
            <div className="flex gap-1.5" role="tablist" aria-label="Showcase slides">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === index ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50',
                  )}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          ) : (
            <span />
          )}
          <p className="font-sans text-xs font-normal tracking-normal text-slate-500 dark:text-slate-400">
            Trusted by revenue teams to keep every conversation moving.
          </p>
        </div>
      </div>
    </div>
  )
}
