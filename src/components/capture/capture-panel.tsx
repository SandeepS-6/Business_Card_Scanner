import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Camera,
  CameraOff,
  Check,
  ImagePlus,
  Info,
  Layers,
  RotateCcw,
  SwitchCamera,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { SecureFileUpload } from '@/components/security/secure-file-upload'
import { StatusDot } from '@/components/shared/status-badges'
import { secureStorage } from '@/security/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/context/app-context'
import { ocrService } from '@/services/api'
import { cn } from '@/lib/utils'
import type { OcrBatchItem } from '@/types'
import { toast } from 'sonner'

const STEPS = [
  'Image received',
  'Image preprocessing',
  'OCR extraction',
  'Field detection',
  'Data normalization',
  'Duplicate checking',
  'Review preparation',
]

const MAX_BATCH = 20

const TAB_HELP: Record<'camera' | 'upload' | 'multiple', { title: string; description: string }> = {
  camera: {
    title: 'Camera',
    description:
      'Place the card inside the frame and make sure all four corners are visible. Use Front or Rear camera, then Capture card.',
  },
  upload: {
    title: 'Upload',
    description: 'Upload one or more card image files from your device, then confirm to run OCR on the selected image.',
  },
  multiple: {
    title: 'Multiple',
    description:
      'Built for events — capture or upload into a stack, process once, then review each card with Save & next.',
  },
}

function readFilesAsDataUrls(files: File[]) {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(file)
        }),
    ),
  )
}

function CornerGuides() {
  const arm = 'pointer-events-none absolute size-10 border-primary'
  return (
    <>
      <span className={cn(arm, 'left-4 top-4 rounded-tl-sm border-l-2 border-t-2')} aria-hidden />
      <span className={cn(arm, 'right-4 top-4 rounded-tr-sm border-r-2 border-t-2')} aria-hidden />
      <span className={cn(arm, 'bottom-4 left-4 rounded-bl-sm border-b-2 border-l-2')} aria-hidden />
      <span className={cn(arm, 'bottom-4 right-4 rounded-br-sm border-b-2 border-r-2')} aria-hidden />
    </>
  )
}

export function CapturePanel({ compact }: { compact?: boolean } = {}) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { offline, organization, selectedEventId } = useApp()
  const [mode, setMode] = useState<'camera' | 'upload' | 'multiple'>(
    params.get('mode') === 'upload' ? 'upload' : params.get('mode') === 'multiple' ? 'multiple' : 'camera',
  )
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [image, setImage] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [batchImages, setBatchImages] = useState<string[]>([])
  const [batchFocus, setBatchFocus] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)
  const multiVideoRef = useRef<HTMLVideoElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    if (params.get('mode') === 'upload') setMode('upload')
    if (params.get('mode') === 'multiple') setMode('multiple')
  }, [params])

  useEffect(() => {
    const needCamera = (mode === 'camera' && !image) || (mode === 'multiple' && batchFocus === null)
    if (!needCamera) return
    let stream: MediaStream | null = null
    let cancelled = false
    setCameraError(null)
    const timer = window.setTimeout(() => {
      const el = mode === 'multiple' ? multiVideoRef.current : videoRef.current
      void navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: facing } })
        .then((s) => {
          if (cancelled) {
            s.getTracks().forEach((t) => t.stop())
            return
          }
          stream = s
          if (el) {
            el.srcObject = s
            void el.play()
          }
        })
        .catch(() => {
          if (!cancelled) setCameraError('Camera is unavailable')
        })
    }, 40)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [mode, image, batchFocus, facing])

  const snapFrom = (video: HTMLVideoElement | null) => {
    if (!video) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 360
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg')
  }

  const mockCard = (label = 'Jordan Lee') =>
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#0f172a"/><text x="40" y="140" fill="#fff" font-size="32" font-family="Georgia">${label}</text><text x="40" y="180" fill="#94a3b8" font-size="16">Business card</text></svg>`,
    )

  const captureFromVideo = () => {
    const data = snapFrom(videoRef.current)
    if (data) setImage(data)
  }

  const mockCapture = () => setImage(mockCard())

  const addToBatch = (urls: string[]) => {
    setBatchImages((prev) => {
      const next = [...prev, ...urls].slice(0, MAX_BATCH)
      if (prev.length + urls.length > MAX_BATCH) {
        toast.message(`Batch capped at ${MAX_BATCH} cards`)
      }
      return next
    })
    setBatchFocus(null)
  }

  const captureToBatch = () => {
    const data = snapFrom(multiVideoRef.current)
    if (!data) return
    addToBatch([data])
    toast.success('Card added', { description: 'Keep scanning — camera stays live.' })
  }

  const mockToBatch = () => {
    addToBatch([mockCard(`Card ${(batchImages.length % 5) + 1}`)])
    toast.success('Mock card added')
  }

  const onFiles = (files: File[]) => {
    if (!files.length) return
    void readFilesAsDataUrls(files).then((images) => {
      setUploadedImages(images)
      setImage(images[0] ?? null)
    })
  }

  const onBatchFiles = (files: File[]) => {
    if (!files.length) return
    void readFilesAsDataUrls(files).then(addToBatch)
  }

  const confirm = async () => {
    if (!image) return
    secureStorage.clearOcrBatch()
    if (offline) {
      toast.message('Saved to offline queue', { description: 'Will sync when back online.' })
      navigate('/offline-queue')
      return
    }
    setProcessing(true)
    setStepIdx(0)
    for (let i = 0; i < STEPS.length; i++) {
      setStepIdx(i)
      await new Promise((r) => setTimeout(r, 350))
    }
    const result = await ocrService.process(image)
    secureStorage.setOcrDraft(
      JSON.stringify(result),
      JSON.stringify({ orgId: organization?.id, eventId: selectedEventId, side: 'front' }),
    )
    navigate('/review')
  }

  const processBatch = async () => {
    if (!batchImages.length) return
    if (offline) {
      toast.message('Batch saved to offline queue', { description: 'Will sync when back online.' })
      navigate('/offline-queue')
      return
    }
    setProcessing(true)
    setBatchProgress({ done: 0, total: batchImages.length })
    const items: OcrBatchItem[] = []
    for (let i = 0; i < batchImages.length; i++) {
      setBatchProgress({ done: i, total: batchImages.length })
      const result = await ocrService.process(batchImages[i]!, i)
      items.push({ id: `batch-${Date.now()}-${i}`, result, status: 'pending' })
    }
    setBatchProgress({ done: batchImages.length, total: batchImages.length })
    secureStorage.setOcrBatch({
      items,
      index: 0,
      orgId: organization?.id,
      eventId: selectedEventId,
      savedCount: 0,
      skippedCount: 0,
    })
    toast.success(`${items.length} cards ready to review`)
    navigate('/review')
  }

  const progress = useMemo(() => ((stepIdx + 1) / STEPS.length) * 100, [stepIdx])
  const batchPct = batchProgress.total ? (batchProgress.done / batchProgress.total) * 100 : 0
  const facingLabel = facing === 'user' ? 'Front camera' : 'Rear camera'
  const tabHelp = TAB_HELP[mode]

  if (processing) {
    const isBatch = batchProgress.total > 0
    return (
      <Card id="capture">
        <CardHeader>
          <CardTitle className="font-display text-base font-semibold">
            {isBatch
              ? `Scanning card ${Math.min(batchProgress.done + 1, batchProgress.total)} of ${batchProgress.total}`
              : 'Processing card'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={isBatch ? batchPct : progress} />
          {isBatch ? (
            <p className="inline-flex items-center gap-2 text-sm font-medium">
              <StatusDot tone="warning" />
              Running OCR on your batch — review starts next
            </p>
          ) : (
            <ul className="space-y-2">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex size-5 items-center justify-center rounded-full ${i <= stepIdx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    {i < stepIdx ? <Check className="size-3" /> : i + 1}
                  </span>
                  <span className={i === stepIdx ? 'font-medium' : 'text-muted-foreground'}>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div id="capture" className={cn('scroll-mt-20 space-y-4', compact && 'space-y-3')}>
      {mode === 'camera' ? (
        <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <StatusDot tone="success" />
          Ready to capture
        </p>
      ) : null}

      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto w-full flex-wrap justify-start sm:w-auto">
            <TabsTrigger value="camera" className="gap-1.5">
              <Camera className="size-4" aria-hidden />
              Camera
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5">
              <ImagePlus className="size-4" aria-hidden />
              Upload
            </TabsTrigger>
            <TabsTrigger value="multiple" className="gap-1.5">
              <Layers className="size-4" aria-hidden />
              Multiple
            </TabsTrigger>
          </TabsList>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {mode === 'camera' ? (
              <div
                className="inline-flex items-center gap-1 rounded-lg bg-muted p-1 ring-1 ring-border"
                role="group"
                aria-label="Camera facing"
              >
                <button
                  type="button"
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
                    facing === 'user' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-background/80',
                  )}
                  aria-pressed={facing === 'user'}
                  onClick={() => setFacing('user')}
                >
                  <Camera className="size-4" aria-hidden />
                  Front camera
                </button>
                <button
                  type="button"
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
                    facing === 'environment'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-background/80',
                  )}
                  aria-pressed={facing === 'environment'}
                  onClick={() => setFacing('environment')}
                >
                  <SwitchCamera className="size-4" aria-hidden />
                  Rear camera
                </button>
              </div>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground ring-1 ring-border transition-colors hover:bg-muted/80"
                  aria-label={`${tabHelp.title} help`}
                  title="Info"
                >
                  <Info className="size-4" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-3">
                <DropdownMenuLabel className="px-0 pb-1 pt-0 text-sm font-semibold">{tabHelp.title}</DropdownMenuLabel>
                <p className="text-sm text-muted-foreground">{tabHelp.description}</p>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="camera" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-[#050C10] shadow-sm">
            <div className="relative aspect-[16/10] min-h-[280px]">
              <CornerGuides />
              <span className="absolute left-4 top-4 z-10 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-medium text-white">
                {facingLabel}
              </span>

              {!image ? (
                cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <span className="inline-flex size-14 items-center justify-center rounded-full bg-white/10 text-white">
                      <CameraOff className="size-7" aria-hidden />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-white">Camera is unavailable</p>
                      <p className="mt-1 max-w-sm text-sm text-white/60">
                        You can still continue with a mock card image for this preview.
                      </p>
                    </div>
                    <Button size="sm" onClick={mockCapture}>
                      <ImagePlus className="size-4" aria-hidden />
                      Use mock card image
                    </Button>
                  </div>
                ) : (
                  <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
                )
              ) : (
                <img
                  src={image}
                  alt="Captured card"
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                />
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-border/40 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Camera className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Capture a clear, flat image</p>
                  <p className="text-xs text-muted-foreground">Avoid glare and heavy shadows</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!image ? (
                  <>
                    <Button size="sm" variant="outline" onClick={mockCapture}>
                      <ImagePlus className="size-4" aria-hidden />
                      Mock capture
                    </Button>
                    <Button size="sm" onClick={captureFromVideo} disabled={!!cameraError}>
                      <Camera className="size-4" aria-hidden />
                      Capture card
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setImage(null)}>
                      <RotateCcw className="size-4" /> Retake
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRotation((r) => r + 90)}>
                      Rotate
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Zoom in"
                      onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
                    >
                      <ZoomIn className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Zoom out"
                      onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
                    >
                      <ZoomOut className="size-4" />
                    </Button>
                    <Button size="sm" onClick={() => void confirm()}>
                      Confirm
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {!image ? (
                <SecureFileUpload onFiles={onFiles} multiple label="Drag & drop one or many card images, or browse" />
              ) : (
                <>
                  <img src={image} alt="Uploaded card" className="mx-auto max-h-[360px] rounded-lg border" />
                  {uploadedImages.length > 1 ? (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium">Queued files</p>
                      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                        {uploadedImages.map((item, index) => (
                          <button
                            key={`${item.slice(0, 24)}-${index}`}
                            type="button"
                            onClick={() => setImage(item)}
                            className={`overflow-hidden rounded-lg border ${image === item ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                            aria-label={`Select upload ${index + 1}`}
                          >
                            <img src={item} alt={`Upload ${index + 1}`} className="h-16 w-24 object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setImage(null)
                        setUploadedImages([])
                      }}
                    >
                      Replace
                    </Button>
                    <Button size="sm" onClick={() => void confirm()}>
                      Confirm
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multiple" className="mt-4">
          <Card className="overflow-hidden border-primary/20">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle className="font-display text-base font-semibold">Multiple cards scan</CardTitle>
                <span className="inline-flex items-center gap-2 rounded-md bg-background/80 px-3 py-1.5 text-sm font-medium ring-1 ring-border">
                  <StatusDot tone={batchImages.length ? 'success' : 'muted'} />
                  {batchImages.length} in stack
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {batchFocus === null ? (
                <div className="aspect-video overflow-hidden rounded-lg bg-slate-950 ring-1 ring-white/10">
                  {cameraError ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-300">
                      <p className="text-sm">{cameraError}</p>
                      <Button size="sm" onClick={mockToBatch}>
                        Add mock card
                      </Button>
                    </div>
                  ) : (
                    <video ref={multiVideoRef} className="h-full w-full object-cover" playsInline muted />
                  )}
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={batchImages[batchFocus]}
                    alt={`Batch card ${batchFocus + 1}`}
                    className="mx-auto max-h-[320px] rounded-lg border border-border"
                  />
                  <Button size="sm" variant="secondary" className="absolute right-2 top-2" onClick={() => setBatchFocus(null)}>
                    <X className="size-4" /> Back to camera
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {batchFocus === null ? (
                  <>
                    <Button size="sm" onClick={captureToBatch} disabled={batchImages.length >= MAX_BATCH}>
                      <Camera className="size-4" /> Capture to stack
                    </Button>
                    <Button size="sm" variant="outline" onClick={mockToBatch} disabled={batchImages.length >= MAX_BATCH}>
                      Add mock
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setBatchImages((prev) => prev.filter((_, i) => i !== batchFocus))
                      setBatchFocus(null)
                    }}
                  >
                    <Trash2 className="size-4" /> Remove this card
                  </Button>
                )}
              </div>

              <SecureFileUpload onFiles={onBatchFiles} multiple label="Or add images from gallery (multi-select)" className="py-8" />

              {batchImages.length > 0 ? (
                <div className="space-y-3 rounded-lg border border-border bg-background/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Stack preview</p>
                    <button
                      type="button"
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setBatchImages([])
                        setBatchFocus(null)
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {batchImages.map((item, index) => (
                      <button
                        key={`${item.slice(0, 20)}-${index}`}
                        type="button"
                        onClick={() => setBatchFocus(index)}
                        className={`group relative shrink-0 overflow-hidden rounded-lg border transition ${
                          batchFocus === index ? 'border-primary ring-2 ring-primary/25' : 'border-border hover:border-primary/40'
                        }`}
                        aria-label={`Card ${index + 1}`}
                      >
                        <img src={item} alt="" className="h-20 w-28 object-cover" />
                        <span className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded bg-background/90 text-xs font-semibold tabular-nums shadow-sm">
                          {index + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground">
                      Next: OCR all cards, then <span className="font-medium text-foreground">Save &amp; next</span> through
                      each one.
                    </p>
                    <Button size="sm" onClick={() => void processBatch()} disabled={!batchImages.length}>
                      Process {batchImages.length} card{batchImages.length === 1 ? '' : 's'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
                  <p className="text-sm font-medium">Your stack is empty</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Capture from camera or upload several images to start a batch.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
