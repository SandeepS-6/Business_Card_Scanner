import type { EChartsOption } from 'echarts'

export type ChartKind = 'line' | 'area' | 'bar' | 'stackedBar' | 'doughnut'

export type ChartSeries = {
  key: string
  label: string
  color?: string
}

export type ChartRow = Record<string, string | number>

export type AppChartProps = {
  id: string
  title: string
  description?: string
  kind: ChartKind
  categoryKey: string
  series: ChartSeries[]
  rows: ChartRow[]
  height?: number
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  onRetry?: () => void
  /** SECURITY: hide export when caller lacks view permission */
  canExport?: boolean
}

export type BuiltChart = {
  option: EChartsOption
  csvColumns: string[]
  csvRows: (string | number)[][]
}
