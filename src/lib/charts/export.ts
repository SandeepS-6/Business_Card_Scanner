import type { EChartsType } from 'echarts'
import { jsPDF } from 'jspdf'
import { chartFilename } from '@/lib/charts/formatters'
import { toast } from 'sonner'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function dataUrlToBlob(dataUrl: string) {
  const [meta, data] = dataUrl.split(',')
  const mime = /data:(.*?);/.exec(meta)?.[1] ?? 'application/octet-stream'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export type ChartExportPayload = {
  chart: EChartsType
  chartId: string
  title: string
  description?: string
  csvColumns: string[]
  csvRows: (string | number)[][]
}

export async function exportChartPng(p: ChartExportPayload) {
  const url = p.chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
  downloadBlob(dataUrlToBlob(url), chartFilename(p.chartId, 'png'))
  toast.success('PNG downloaded.')
}

export async function exportChartJpeg(p: ChartExportPayload) {
  const url = p.chart.getDataURL({ type: 'jpeg', pixelRatio: 2, backgroundColor: '#ffffff' })
  downloadBlob(dataUrlToBlob(url), chartFilename(p.chartId, 'jpg'))
  toast.success('JPEG downloaded.')
}

export async function exportChartSvg(p: ChartExportPayload) {
  const url = p.chart.getDataURL({ type: 'svg', backgroundColor: '#ffffff' })
  downloadBlob(dataUrlToBlob(url), chartFilename(p.chartId, 'svg'))
  toast.success('SVG downloaded.')
}

export async function exportChartPdf(p: ChartExportPayload) {
  const url = p.chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const margin = 40
  const pageW = pdf.internal.pageSize.getWidth()
  pdf.setFontSize(14)
  pdf.text(p.title, margin, margin)
  if (p.description) {
    pdf.setFontSize(10)
    pdf.setTextColor(100)
    pdf.text(p.description, margin, margin + 18)
  }
  pdf.setFontSize(9)
  pdf.setTextColor(120)
  pdf.text(`Generated ${new Date().toLocaleString()}`, margin, margin + (p.description ? 34 : 18))
  const imgY = margin + (p.description ? 48 : 32)
  const imgW = pageW - margin * 2
  const imgH = imgW * 0.45
  pdf.addImage(url, 'PNG', margin, imgY, imgW, imgH)
  pdf.save(chartFilename(p.chartId, 'pdf'))
  toast.success('PDF downloaded.')
}

export function exportChartCsv(p: ChartExportPayload) {
  const escape = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [p.csvColumns.map(escape).join(','), ...p.csvRows.map((r) => r.map(escape).join(','))]
  downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }), chartFilename(p.chartId, 'csv'))
  toast.success('CSV exported.')
}

export async function copyChartImage(p: ChartExportPayload) {
  if (!navigator.clipboard?.write) {
    toast.error('Clipboard image copy is not available in this browser.')
    return
  }
  const url = p.chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
  const blob = dataUrlToBlob(url)
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
  toast.success('Chart copied to clipboard.')
}

export function printChart(p: ChartExportPayload) {
  const url = p.chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
  const win = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720')
  if (!win) {
    toast.error('Unable to open print window. Check popup settings.')
    return
  }
  // SECURITY: Build DOM nodes — avoid document.write / HTML injection.
  const doc = win.document
  doc.title = p.title.replace(/[<>&"']/g, '')
  const style = doc.createElement('style')
  style.textContent = 'body{font-family:system-ui;margin:24px}img{max-width:100%}'
  doc.head.appendChild(style)
  const h1 = doc.createElement('h1')
  h1.textContent = p.title
  doc.body.appendChild(h1)
  if (p.description) {
    const desc = doc.createElement('p')
    desc.textContent = p.description
    doc.body.appendChild(desc)
  }
  const img = doc.createElement('img')
  img.src = url
  img.alt = ''
  doc.body.appendChild(img)
  win.onload = () => win.print()
  // Safari/Firefox: print after paint
  setTimeout(() => {
    try {
      win.print()
    } catch {
      /* ignore */
    }
  }, 250)
}

export async function runChartExport(
  action: 'png' | 'jpeg' | 'svg' | 'pdf' | 'csv' | 'copy' | 'print',
  payload: ChartExportPayload,
) {
  try {
    switch (action) {
      case 'png':
        await exportChartPng(payload)
        break
      case 'jpeg':
        await exportChartJpeg(payload)
        break
      case 'svg':
        await exportChartSvg(payload)
        break
      case 'pdf':
        await exportChartPdf(payload)
        break
      case 'csv':
        exportChartCsv(payload)
        break
      case 'copy':
        await copyChartImage(payload)
        break
      case 'print':
        printChart(payload)
        break
    }
  } catch {
    toast.error('Unable to export the chart. Please try again.')
  }
}
