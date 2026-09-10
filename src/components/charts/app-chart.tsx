import { useMemo, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsType } from 'echarts'
import { Download, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buildChartOption } from '@/lib/charts/options'
import { readChartTheme } from '@/lib/charts/theme'
import { runChartExport } from '@/lib/charts/export'
import type { AppChartProps } from '@/lib/charts/types'
import { toast } from 'sonner'

export function AppChart(props: AppChartProps & { bare?: boolean }) {
  const {
    id,
    title,
    description,
    height = 260,
    loading,
    error,
    emptyMessage = 'No data for this period.',
    onRetry,
    canExport = true,
    rows,
    bare = false,
  } = props
  const chartRef = useRef<ReactECharts>(null)
  const [busy, setBusy] = useState(false)
  const theme = useMemo(() => (typeof document !== 'undefined' ? readChartTheme() : null), [loading, rows])
  const built = useMemo(() => buildChartOption(props, theme ?? readChartTheme()), [props, theme])

  const empty = !loading && !error && rows.length === 0

  const exportAction = async (action: 'png' | 'jpeg' | 'svg' | 'pdf' | 'csv' | 'copy' | 'print') => {
    if (!canExport) {
      toast.error('You do not have permission to export this chart.')
      return
    }
    const instance = chartRef.current?.getEchartsInstance() as EChartsType | undefined
    if (!instance && action !== 'csv') {
      toast.error('Unable to export the chart. Please try again.')
      return
    }
    setBusy(true)
    await runChartExport(action, {
      chart: instance as EChartsType,
      chartId: id,
      title,
      description,
      csvColumns: built.csvColumns,
      csvRows: built.csvRows,
    })
    setBusy(false)
  }

  const body = (
    <>
      {loading ? (
        <div className="animate-pulse rounded-md bg-muted" style={{ height }} aria-busy aria-label="Loading chart" />
      ) : null}
      {error ? (
        <div className="flex flex-col items-center justify-center gap-2 text-center" style={{ height }} role="alert">
          <p className="text-sm font-medium">Unable to load chart data.</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          {onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}
      {empty ? (
        <div className="flex items-center justify-center text-center text-sm text-muted-foreground" style={{ height }}>
          {emptyMessage}
        </div>
      ) : null}
      {!loading && !error && !empty ? (
        <ReactECharts
          ref={chartRef}
          option={built.option}
          style={{ height, width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge
          lazyUpdate
        />
      ) : null}
    </>
  )

  if (bare) return <div>{body}</div>

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
        {canExport && !loading && !error && !empty ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0" aria-label={`Export ${title}`} disabled={busy}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Download className="size-3.5" /> Download
              </DropdownMenuLabel>
              <DropdownMenuItem disabled={busy} onClick={() => void exportAction('png')}>
                PNG
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy} onClick={() => void exportAction('jpeg')}>
                JPEG
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy} onClick={() => void exportAction('svg')}>
                SVG
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy} onClick={() => void exportAction('pdf')}>
                PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Data</DropdownMenuLabel>
              <DropdownMenuItem disabled={busy} onClick={() => void exportAction('csv')}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Other</DropdownMenuLabel>
              <DropdownMenuItem disabled={busy} onClick={() => void exportAction('copy')}>
                Copy image
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy} onClick={() => void exportAction('print')}>
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
