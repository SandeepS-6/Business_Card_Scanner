import type { EChartsOption } from 'echarts'
import type { AppChartProps, BuiltChart } from '@/lib/charts/types'
import { formatInteger } from '@/lib/charts/formatters'
import { SERIES_PALETTE, readChartTheme, type ChartThemeTokens } from '@/lib/charts/theme'

function categories(props: AppChartProps) {
  return props.rows.map((r) => String(r[props.categoryKey] ?? ''))
}

function seriesValues(props: AppChartProps, key: string) {
  return props.rows.map((r) => Number(r[key] ?? 0))
}

function baseGrid() {
  return { left: 48, right: 16, top: 28, bottom: 36, containLabel: true }
}

function axisStyle(theme: ChartThemeTokens) {
  return {
    axisLabel: { color: theme.muted, fontSize: 11 },
    axisLine: { lineStyle: { color: theme.border } },
    splitLine: { lineStyle: { color: theme.border, type: 'dashed' as const } },
  }
}

/** Plain-text tooltips only — SECURITY: no HTML injection from chart labels. */
function tooltip(theme: ChartThemeTokens) {
  return {
    trigger: 'axis' as const,
    backgroundColor: theme.tooltipBg,
    borderColor: theme.tooltipBorder,
    textStyle: { color: theme.text, fontSize: 12 },
    // SECURITY: formatter returns plain text only; never inject HTML from data.
    valueFormatter: (v: unknown) => formatInteger(Number(v)),
  }
}

export function buildChartOption(props: AppChartProps, theme = readChartTheme()): BuiltChart {
  const cats = categories(props)
  const csvColumns = [props.categoryKey, ...props.series.map((s) => s.label)]
  const csvRows = props.rows.map((row) => [
    String(row[props.categoryKey] ?? ''),
    ...props.series.map((s) => Number(row[s.key] ?? 0)),
  ])

  const colors = props.series.map((s, i) => s.color ?? SERIES_PALETTE[i % SERIES_PALETTE.length])

  if (props.kind === 'doughnut') {
    const s = props.series[0]
    const data = props.rows.map((row, i) => ({
      name: String(row[props.categoryKey] ?? ''),
      value: Number(row[s?.key ?? 'count'] ?? 0),
      itemStyle: { color: colors[i % colors.length] },
    }))
    const option: EChartsOption = {
      color: colors,
      tooltip: {
        trigger: 'item',
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        textStyle: { color: theme.text, fontSize: 12 },
        // SECURITY: plain text only
        formatter: (p: unknown) => {
          const item = p as { name?: string; value?: number; percent?: number }
          return `${item.name ?? ''}: ${formatInteger(Number(item.value ?? 0))} (${Number(item.percent ?? 0).toFixed(1)}%)`
        },
      },
      legend: { bottom: 0, textStyle: { color: theme.muted, fontSize: 11 } },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '46%'],
          data,
          label: { color: theme.muted, fontSize: 11 },
        },
      ],
    }
    return { option, csvColumns, csvRows }
  }

  const echartsSeries = props.series.map((s, i) => {
    const base = {
      name: s.label,
      type: props.kind === 'bar' || props.kind === 'stackedBar' ? ('bar' as const) : ('line' as const),
      data: seriesValues(props, s.key),
      itemStyle: { color: colors[i] },
      emphasis: { focus: 'series' as const },
    }
    if (props.kind === 'area') {
      return { ...base, areaStyle: { opacity: 0.15 }, smooth: true, showSymbol: false }
    }
    if (props.kind === 'line') {
      return { ...base, smooth: true, showSymbol: false }
    }
    if (props.kind === 'stackedBar') {
      return { ...base, stack: 'total', barMaxWidth: 36 }
    }
    return { ...base, barMaxWidth: 36 }
  })

  const option: EChartsOption = {
    color: colors,
    grid: baseGrid(),
    tooltip: tooltip(theme),
    legend: props.series.length > 1 ? { top: 0, textStyle: { color: theme.muted, fontSize: 11 } } : undefined,
    xAxis: {
      type: 'category',
      data: cats,
      ...axisStyle(theme),
    },
    yAxis: {
      type: 'value',
      ...axisStyle(theme),
    },
    series: echartsSeries,
  }

  return { option, csvColumns, csvRows }
}
