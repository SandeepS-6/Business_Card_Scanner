import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, Check, Image as ImageIcon, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { SecureFileUpload } from '@/components/security/secure-file-upload'
import { secureStorage } from '@/security/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/context/app-context'
import { ocrService } from '@/services/api'
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

export function CapturePanel({
  heading = 'Capture business cards',
  instructions = 'Camera or upload — front and back supported.',
  help,
  compact,
}: {
  heading?: string
  instructions?: string
  help?: string
  compact?: boolean
}) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { offline, organization, selectedEventId } = useApp()
  const [mode, setMode] = useState(params.get('mode') === 'upload' ? 'upload' : 'camera')
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [image, setImage] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    if (params.get('mode') === 'upload') setMode('upload')
  }, [params])

  useEffect(() => {
    if (mode !== 'camera' || image) return
    let stream: MediaStream | null = null
    void navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          void videoRef.current.play()
        }
      })
      .catch(() => setCameraError('Camera unavailable — use upload or mock capture.'))
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [mode, image])

  const captureFromVideo = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 360
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    setImage(canvas.toDataURL('image/jpeg'))
  }

  const mockCapture = () => {
    setImage(
      'data:image/svg+xml,' +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#0f172a"/><text x="40" y="140" fill="#fff" font-size="32" font-family="Georgia">Jordan Lee</text><text x="40" y="180" fill="#94a3b8" font-size="16">VP Partnerships</text></svg>`,
        ),
    )
  }

  const onFiles = (files: File[]) => {
    if (!files.length) return
    void Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(file)
          }),
      ),
    ).then((images) => {
      setUploadedImages(images)
      setImage(images[0] ?? null)
    })
  }

  const confirm = async () => {
    if (!image) return
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
    // SECURITY: OCR drafts may contain PII — cleared on logout; backend must authorize.
    secureStorage.setOcrDraft(
      JSON.stringify(result),
      JSON.stringify({ orgId: organization?.id, eventId: selectedEventId, side }),
    )
    navigate('/review')
  }

  const progress = useMemo(() => ((stepIdx + 1) / STEPS.length) * 100, [stepIdx])

  if (processing) {
    return (
      <Card id="capture">
        <CardHeader>
          <CardTitle>Processing card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} />
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
        </CardContent>
      </Card>
    )
  }

  return (
    <div id="capture" className="scroll-mt-20">
      {!compact ? (
        <div className="mb-3">
          <h2 className="font-display text-lg font-semibold">{heading}</h2>
          <p className="text-sm text-muted-foreground">{instructions}</p>
          {help ? <p className="mt-1 text-xs text-muted-foreground">{help}</p> : null}
        </div>
      ) : null}
      <Tabs value={mode} onValueChange={setMode}>
        <TabsList>
          <TabsTrigger value="camera">
            <Camera className="mr-1 size-4" /> Camera
          </TabsTrigger>
          <TabsTrigger value="upload">
            <ImageIcon className="mr-1 size-4" /> Upload
          </TabsTrigger>
        </TabsList>
        <TabsContent value="camera">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Camera preview</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant={side === 'front' ? 'default' : 'outline'} onClick={() => setSide('front')}>
                  Front
                </Button>
                <Button size="sm" variant={side === 'back' ? 'default' : 'outline'} onClick={() => setSide('back')}>
                  Back
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!image ? (
                <div className="aspect-video overflow-hidden rounded-lg bg-slate-950">
                  {cameraError ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-300">
                      <p className="text-sm">{cameraError}</p>
                      <Button onClick={mockCapture}>Use mock card image</Button>
                    </div>
                  ) : (
                    <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                  )}
                </div>
              ) : (
                <img
                  src={image}
                  alt="Captured card"
                  className="mx-auto max-h-[360px] rounded-lg border border-border"
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                />
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {!image ? (
                  <>
                    <Button onClick={captureFromVideo}>Capture</Button>
                    <Button variant="outline" onClick={mockCapture}>
                      Mock capture
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setImage(null)}>
                      <RotateCcw className="size-4" /> Retake
                    </Button>
                    <Button variant="outline" onClick={() => setRotation((r) => r + 90)}>
                      Rotate
                    </Button>
                    <Button variant="outline" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
                      <ZoomIn className="size-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}>
                      <ZoomOut className="size-4" />
                    </Button>
                    <Button onClick={() => void confirm()}>Confirm</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upload">
          <Card>
            <CardContent className="pt-6">
              {!image ? (
                <div className="space-y-4">
                  <SecureFileUpload onFiles={onFiles} multiple label="Drag & drop one or many card images, or browse" />
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                    Batch upload demo: select multiple images, review the first one now, and switch between queued files below.
                  </div>
                </div>
              ) : (
                <>
                  <img src={image} alt="Uploaded card" className="mx-auto max-h-[360px] rounded-lg border" />
                  {uploadedImages.length > 1 ? (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium">Batch queue</p>
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
                      variant="outline"
                      onClick={() => {
                        setImage(null)
                        setUploadedImages([])
                      }}
                    >
                      Replace
                    </Button>
                    <Button onClick={() => void confirm()}>Confirm</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
