import { Wifi, WifiHigh, WifiLow, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Real-life style: single arc, two arcs, or full — not a binary on/off glyph when online. */
export type WifiStrength = 'off' | 'single' | 'mid' | 'full'

export function wifiStrengthFromEffectiveType(effectiveType?: string): Exclude<WifiStrength, 'off'> {
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'single'
  if (effectiveType === '3g') return 'mid'
  return 'full'
}

export function WifiStrengthIcon({
  strength,
  className,
}: {
  strength: WifiStrength
  className?: string
}) {
  const cls = cn('size-4', className)
  if (strength === 'off') return <WifiOff className={cn(cls, 'text-amber-600')} aria-hidden />
  if (strength === 'single') return <WifiLow className={cn(cls, 'text-amber-600')} aria-hidden />
  if (strength === 'mid') return <WifiHigh className={cls} aria-hidden />
  return <Wifi className={cls} aria-hidden />
}

export function wifiStrengthLabel(strength: WifiStrength) {
  if (strength === 'off') return 'Offline'
  if (strength === 'single') return 'Weak Wi‑Fi'
  if (strength === 'mid') return 'Fair Wi‑Fi'
  return 'Strong Wi‑Fi'
}
