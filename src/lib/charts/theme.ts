export type ChartThemeTokens = {
  text: string
  muted: string
  border: string
  card: string
  primary: string
  tooltipBg: string
  tooltipBorder: string
  barTrack: string
}

export function readChartTheme(): ChartThemeTokens {
  const s = getComputedStyle(document.documentElement)
  const pick = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback
  return {
    text: pick('--foreground', '#0f172a'),
    muted: pick('--muted-foreground', '#64748b'),
    border: pick('--border', '#e2e8f0'),
    card: pick('--card', '#ffffff'),
    primary: pick('--primary', '#0f766e'),
    tooltipBg: pick('--card', '#ffffff'),
    tooltipBorder: pick('--border', '#e2e8f0'),
    barTrack: 'color-mix(in oklab, var(--muted-foreground) 18%, transparent)',
  }
}

/** Theme-aware palette — primary first, then stable complementary accents. */
export function seriesPalette(theme: ChartThemeTokens): string[] {
  return [theme.primary, '#0ea5e9', '#f59e0b', '#6366f1', '#ef4444', '#94a3b8', '#14b8a6']
}
