import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function CardSyncMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img src="/favicon.svg" alt="" className="size-9 rounded-lg" />
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">CardSync</span>
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

/** Left-panel slides — add more when product content is provided. */
const DEFAULT_SLIDES: ShowcaseSlide[] = [
  {
    id: 'capture',
    eyebrow: 'Product',
    title: 'Capture. Connect.\nFollow up.',
    body: 'Scan business cards at events, review OCR fields, and turn meetings into contacts and follow-ups.',
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
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(15,118,110,0.14),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.10),_transparent_50%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
        style={{
          backgroundImage:
            'linear-gradient(to right, color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-1 flex-col justify-between p-10 xl:p-12">
        <CardSyncMark />

        <div className="max-w-lg transition-opacity duration-500" key={slide.id}>
          {slide.eyebrow ? (
            <p className="mb-3 text-sm font-medium text-muted-foreground">{slide.eyebrow}</p>
          ) : null}
          <h2 className="font-display text-4xl font-semibold leading-[1.15] tracking-tight whitespace-pre-line text-foreground xl:text-5xl">
            {slide.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{slide.body}</p>
          {slide.visual ? <div className="mt-8">{slide.visual}</div> : (
            <div className="mt-10 rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <p className="text-sm font-medium">Card → Contact → Lead</p>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-[80%] rounded bg-muted" />
                <div className="h-2 w-[60%] rounded bg-muted" />
                <div className="h-2 w-[66%] rounded bg-muted" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Showcase preview — more slides can be added later.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
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
          <p className="text-xs text-muted-foreground">Demo UI · mock authentication</p>
        </div>
      </div>
    </div>
  )
}
