import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseIso(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [y, m, day] = value.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDisplay(value: string) {
  const d = parseIso(value)
  if (!d) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

type DateFieldProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
}

/** Custom calendar popover — works inside Dialog (native type=date often fails under focus trap). */
export function DateField({ id, value, onChange, placeholder = 'Select date', disabled, error, className }: DateFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selected = parseIso(value)
  const [cursor, setCursor] = useState(() => selected ?? new Date())

  useEffect(() => {
    if (selected) setCursor(selected)
  }, [value])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const startPad = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const out: Array<{ iso: string; day: number; inMonth: boolean }> = []
    for (let i = 0; i < startPad; i++) {
      const d = new Date(year, month, -startPad + i + 1)
      out.push({ iso: toIsoDate(d), day: d.getDate(), inMonth: false })
    }
    for (let day = 1; day <= daysInMonth; day++) {
      out.push({ iso: toIsoDate(new Date(year, month, day)), day, inMonth: true })
    }
    while (out.length % 7) {
      const d = new Date(year, month + 1, out.length - startPad - daysInMonth + 1)
      out.push({ iso: toIsoDate(d), day: d.getDate(), inMonth: false })
    }
    return out
  }, [cursor])

  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={!!error}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-left text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive ring-1 ring-destructive/30',
          !value && 'text-muted-foreground',
        )}
      >
        <span className="truncate">{value ? formatDisplay(value) : placeholder}</span>
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      {open ? (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute left-0 z-[60] mt-1 w-[280px] rounded-lg border border-border bg-card p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Previous month"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <p className="text-sm font-medium">{monthLabel}</p>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Next month"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell) => {
              const isSelected = cell.iso === value
              return (
                <button
                  key={cell.iso + String(cell.inMonth)}
                  type="button"
                  onClick={() => {
                    onChange(cell.iso)
                    setOpen(false)
                  }}
                  className={cn(
                    'h-8 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    !cell.inMonth && 'text-muted-foreground/50',
                    isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                  )}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
