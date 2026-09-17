import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Crop, RotateCw, SkipForward, ZoomIn, ZoomOut } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { ConfidenceBadge, StatusDot } from '@/components/shared/status-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageQualityRatings, ReviewContextBar } from '@/components/review/review-context'
import { ReviewFollowUpSection } from '@/components/review/review-follow-up'
import { useApp } from '@/context/app-context'
import { advanceOcrBatchIndex } from '@/lib/ocr-batch'
import { contactService, crmService, eventService } from '@/services/api'
import { secureStorage } from '@/security/storage'
import type { Confidence, Contact, OcrBatch, OcrResult } from '@/types'
import { toast } from 'sonner'
import { ErrorState } from '@/components/shared/empty-state'

type FieldKey = keyof OcrResult['fields']

const FIELD_LABELS: Record<Exclude<FieldKey, 'notes'>, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  fullName: 'Full Name',
  jobTitle: 'Job Title',
  company: 'Company',
  email: 'Email',
  phone: 'Phone',
  altPhone: 'Alternate Phone',
  website: 'Website',
  address: 'Address',
  city: 'City',
  state: 'State',
  country: 'Country',
  postalCode: 'Postal Code',
  linkedin: 'LinkedIn',
}

function loadInitial(): { result: OcrResult | null; batch: OcrBatch | null } {
  const batch = secureStorage.getOcrBatch()
  if (batch?.items.length) {
    const item = batch.items[batch.index]
    return { result: item ? structuredClone(item.result) : null, batch }
  }
  const stored = secureStorage.getOcrResult()
  return { result: stored ? (JSON.parse(stored) as OcrResult) : null, batch: null }
}

function scoreFromConfidence(fields: OcrResult['fields']) {
  const values = Object.values(fields)
  const pts = values.reduce((s, f) => s + (f.confidence === 'high' ? 5 : f.confidence === 'medium' ? 3 : 1), 0)
  const avg = pts / Math.max(values.length, 1)
  const ocr = Math.max(1, Math.min(5, Math.round(avg)))
  // ponytail: mock sharpness/quality from OCR until a real image-metrics pipeline exists
  const imageQuality = Math.max(1, Math.min(5, ocr + (avg >= 4 ? 0 : -1)))
  const sharpness = Math.max(1, Math.min(5, ocr + (values.filter((f) => f.confidence === 'low').length > 3 ? -1 : 0)))
  return { imageQuality, ocrConfidence: ocr, sharpness }
}

export function ReviewPage() {
  const navigate = useNavigate()
  const { organization, user, selectedEventId } = useApp()
  const initial = useMemo(() => loadInitial(), [])
  const [batch, setBatch] = useState<OcrBatch | null>(initial.batch)
  const [result, setResult] = useState<OcrResult | null>(initial.result)
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [dupOpen, setDupOpen] = useState(false)
  const [dupes, setDupes] = useState<Contact[]>([])
  const [saving, setSaving] = useState(false)
  const [createLead, setCreateLead] = useState(false)
  const [pendingAdvance, setPendingAdvance] = useState<'save' | 'lead' | null>(null)
  const capturedAt = useMemo(() => new Date().toISOString(), [])

  const { data: events = [] } = useQuery({
    queryKey: ['events', organization?.id],
    queryFn: () => eventService.list(organization!.id),
    enabled: !!organization?.id,
  })
  const { data: integrations = [] } = useQuery({
    queryKey: ['crm-integrations', organization?.id],
    queryFn: () => crmService.integrations(organization!.id),
    enabled: !!organization?.id,
  })

  const eventName =
    events.find((e) => e.id === (batch?.eventId ?? selectedEventId))?.name ??
    (selectedEventId ? 'Selected event' : 'No event selected')
  const capturedBy = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Unknown user'
  const ratings = result ? scoreFromConfidence(result.fields) : null

  const isBatch = Boolean(batch?.items.length)
  const total = batch?.items.length ?? 1
  const index = batch?.index ?? 0
  const doneCount = (batch?.savedCount ?? 0) + (batch?.skippedCount ?? 0)
  const batchPct = total ? (doneCount / total) * 100 : 0
  const reviewedPct = total ? (doneCount / total) * 100 : 0
  const isLast = isBatch && index >= total - 1

  if (!result) {
    return (
      <ErrorState
        title="No OCR result"
        description="Capture a card first to review extracted fields."
        onRetry={() => navigate('/?focus=capture')}
      />
    )
  }

  const setField = (key: FieldKey, value: string) => {
    setResult((r) => (r ? { ...r, fields: { ...r.fields, [key]: { ...r.fields[key], value } } } : r))
  }

  const buildContact = (): Contact => {
    const f = result.fields
    return {
      id: `c-${Date.now()}`,
      orgId: organization!.id,
      firstName: f.firstName.value,
      lastName: f.lastName.value,
      fullName: f.fullName.value || `${f.firstName.value} ${f.lastName.value}`,
      jobTitle: f.jobTitle.value,
      company: f.company.value,
      email: f.email.value,
      phone: f.phone.value,
      altPhone: f.altPhone.value || undefined,
      website: f.website.value || undefined,
      address: f.address.value || undefined,
      city: f.city.value || undefined,
      state: f.state.value || undefined,
      country: f.country.value || undefined,
      postalCode: f.postalCode.value || undefined,
      linkedin: f.linkedin.value || undefined,
      notes: f.notes.value || undefined,
      eventId: selectedEventId ?? batch?.eventId ?? undefined,
      leadStatus: 'new',
      leadIntent: 'medium',
      ownerId: user!.id,
      tags: [],
      source: isBatch ? 'Business card scan (batch)' : 'Business card scan',
      cardImageUrl: result.imageUrl,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
  }

  const finishBatch = (next: OcrBatch) => {
    secureStorage.clearOcrBatch()
    secureStorage.clearOcrDraft()
    const saved = next.savedCount
    const skipped = next.skippedCount
    toast.success(
      skipped ? `Batch complete — ${saved} saved, ${skipped} skipped` : `Batch complete — ${saved} cards saved`,
    )
    navigate('/contacts')
  }

  const advanceBatch = (status: 'saved' | 'skipped', alsoLead: boolean) => {
    if (!batch) {
      secureStorage.clearOcrDraft()
      navigate(alsoLead ? '/leads' : '/contacts')
      return
    }
    const stepped = advanceOcrBatchIndex(batch.index, batch.items.length, status, batch.savedCount, batch.skippedCount)
    const items = batch.items.map((item, i) => (i === batch.index ? { ...item, status, result } : item))
    if (stepped.done) {
      finishBatch({
        ...batch,
        items,
        savedCount: stepped.savedCount,
        skippedCount: stepped.skippedCount,
        index: batch.items.length,
      })
      return
    }
    const next: OcrBatch = {
      ...batch,
      items,
      savedCount: stepped.savedCount,
      skippedCount: stepped.skippedCount,
      index: stepped.index,
    }
    secureStorage.setOcrBatch(next)
    setBatch(next)
    setResult(structuredClone(next.items[next.index]!.result))
    setZoom(1)
    setRotation(0)
    setSide('front')
    toast.success(status === 'saved' ? (alsoLead ? 'Saved & lead created' : 'Card saved') : 'Skipped — next card')
  }

  const saveFlow = async (alsoLead: boolean) => {
    setCreateLead(alsoLead)
    setSaving(true)
    const found = await contactService.findDuplicates(organization!.id, result.fields.email.value, result.fields.phone.value)
    setSaving(false)
    if (found.length) {
      setPendingAdvance(alsoLead ? 'lead' : 'save')
      setDupes(found)
      setDupOpen(true)
      return
    }
    const contact = buildContact()
    await contactService.create(contact)
    if (isBatch) {
      advanceBatch('saved', alsoLead)
    } else {
      toast.success(alsoLead ? 'Contact saved & lead created' : 'Contact saved')
      secureStorage.clearOcrDraft()
      navigate(`/contacts/${contact.id}`)
    }
  }

  const persistNew = async () => {
    const contact = buildContact()
    await contactService.create(contact)
    setDupOpen(false)
    if (isBatch) {
      advanceBatch('saved', pendingAdvance === 'lead' || createLead)
    } else {
      toast.success(createLead ? 'Contact saved & lead created' : 'Contact saved')
      secureStorage.clearOcrDraft()
      navigate(`/contacts/${contact.id}`)
    }
  }

  const skipCard = () => {
    if (!isBatch) return
    advanceBatch('skipped', false)
  }

  const cardLabel =
    result.fields.fullName.value || `${result.fields.firstName.value} ${result.fields.lastName.value}`.trim() || 'Scanned card'

  return (
    <div>
      <PageHeader
        title={isBatch ? `Review card ${index + 1} of ${total}` : 'Review Card'}
        description={
          isBatch
            ? 'Verify fields, then Save & next — work through the whole stack.'
            : 'Verify OCR fields. Low confidence fields need review.'
        }
        backTo="/"
        backLabel="Back to home"
        actions={
          <div className="flex flex-wrap gap-2">
            {!isBatch ? (
              <Button variant="outline" onClick={() => navigate('/?focus=capture')}>
                Reprocess
              </Button>
            ) : (
              <Button variant="outline" onClick={skipCard}>
                <SkipForward className="size-4" /> Skip
              </Button>
            )}
            {isBatch ? (
              <>
                <Button variant="secondary" loading={saving} onClick={() => void saveFlow(false)}>
                  {isLast ? 'Save last card' : 'Save & next'}
                  {!isLast ? <ChevronRight className="size-4" /> : null}
                </Button>
                <Button loading={saving} onClick={() => void saveFlow(true)}>
                  {isLast ? 'Save & create lead' : 'Save lead & next'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" loading={saving} onClick={() => void saveFlow(false)}>
                  Save
                </Button>
                <Button loading={saving} onClick={() => void saveFlow(true)}>
                  Save & Create Lead
                </Button>
              </>
            )}
          </div>
        }
      />

      <ReviewContextBar
        eventName={eventName}
        integrations={integrations}
        capturedBy={capturedBy}
        capturedAt={capturedAt}
        avatarUrl={user?.avatarUrl}
        orgId={organization!.id}
        cardLabel={cardLabel}
      />

      {isBatch && batch ? (
        <div className="mb-6 space-y-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-sm font-medium">
              <StatusDot tone="warning" />
              Batch review · {doneCount} of {total} done
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {batch.savedCount} saved · {batch.skippedCount} skipped
            </p>
          </div>
          <Progress value={reviewedPct || batchPct} />
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {batch.items.map((item, i) => {
              const tone =
                item.status === 'saved' ? 'success' : item.status === 'skipped' ? 'muted' : i === index ? 'warning' : 'muted'
              const label =
                item.status === 'saved' ? 'Saved' : item.status === 'skipped' ? 'Skipped' : i === index ? 'Current' : 'Queued'
              return (
                <div
                  key={item.id}
                  className={`relative shrink-0 overflow-hidden rounded-lg border ${
                    i === index ? 'border-primary ring-2 ring-primary/20' : 'border-border opacity-80'
                  }`}
                >
                  <img src={item.result.imageUrl} alt="" className="h-14 w-20 object-cover" />
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-background/90 py-0.5 text-[10px] font-medium">
                    {item.status === 'saved' ? <Check className="size-2.5 text-emerald-600" /> : null}
                    <StatusDot tone={tone} />
                    {i + 1} · {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Original card</CardTitle>
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
            <div className="overflow-hidden rounded-lg border border-border bg-muted/30 p-4">
              <img
                src={result.imageUrl}
                alt="Scanned business card"
                className="mx-auto max-h-[420px] transition"
                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              />
            </div>
            <div className="mt-3 flex gap-1">
              <Button
                size="icon"
                variant="outline"
                aria-label="Zoom in"
                title="Zoom in"
                onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              >
                <ZoomIn className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Zoom out"
                title="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              >
                <ZoomOut className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Rotate"
                title="Rotate"
                onClick={() => setRotation((r) => r + 90)}
              >
                <RotateCw className="size-4" />
              </Button>
              <Button size="icon" variant="outline" disabled aria-label="Crop" title="Crop (coming soon)">
                <Crop className="size-4" />
              </Button>
            </div>
            {ratings ? <ImageQualityRatings {...ratings} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracted information</CardTitle>
          </CardHeader>
          <CardContent className="grid max-h-[70vh] gap-3 overflow-y-auto sm:grid-cols-2">
            {(Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>).map((key) => {
              const field = result.fields[key]
              const needsReview = field.confidence === 'low'
              return (
                <div key={key} className={`space-y-1.5 rounded-md p-2 ${needsReview ? 'bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:ring-amber-900' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={key}>{FIELD_LABELS[key]}</Label>
                    <ConfidenceBadge confidence={field.confidence as Confidence} />
                  </div>
                  <Input id={key} value={field.value} onChange={(e) => setField(key, e.target.value)} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Notes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Event context, booth conversation, or anything the team should know under {eventName}.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            id="review-notes"
            rows={4}
            value={result.fields.notes.value}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Add notes for this card…"
            aria-label="Notes"
          />
        </CardContent>
      </Card>

      <ReviewFollowUpSection contactName={cardLabel} eventName={eventName} />

      {isBatch ? (
        <div className="sticky bottom-4 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <p className="text-sm font-medium">
            Card {index + 1} of {total}
            <span className="ml-2 font-normal text-muted-foreground">Save to continue the stack</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={skipCard}>
              Skip
            </Button>
            <Button loading={saving} onClick={() => void saveFlow(false)}>
              {isLast ? 'Save & finish batch' : 'Save & next'}
              {!isLast ? <ChevronRight className="size-4" /> : <Check className="size-4" />}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={dupOpen} onOpenChange={setDupOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Possible duplicate contact found</DialogTitle>
            <DialogDescription>Compare the scanned card with existing records before saving.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Existing</p>
              {dupes[0] ? (
                <dl className="space-y-1 text-sm">
                  <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{dupes[0].fullName}</dd></div>
                  <div><dt className="text-muted-foreground">Company</dt><dd>{dupes[0].company}</dd></div>
                  <div className="text-primary"><dt className="text-muted-foreground">Email (match)</dt><dd>{dupes[0].email}</dd></div>
                  <div className="text-primary"><dt className="text-muted-foreground">Phone (match)</dt><dd>{dupes[0].phone}</dd></div>
                  <p className="pt-2 text-xs text-muted-foreground">Similarity: high</p>
                </dl>
              ) : null}
            </div>
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">New scanned</p>
              <dl className="space-y-1 text-sm">
                <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{result.fields.fullName.value}</dd></div>
                <div><dt className="text-muted-foreground">Company</dt><dd>{result.fields.company.value}</dd></div>
                <div><dt className="text-muted-foreground">Email</dt><dd>{result.fields.email.value}</dd></div>
                <div><dt className="text-muted-foreground">Phone</dt><dd>{result.fields.phone.value}</dd></div>
              </dl>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                toast.success('Using existing contact')
                setDupOpen(false)
                if (isBatch) {
                  advanceBatch('saved', false)
                } else {
                  navigate(`/contacts/${dupes[0]?.id}`)
                }
              }}
            >
              Use Existing Contact
            </Button>
            <Button variant="secondary" onClick={() => void persistNew()}>
              Create New Contact
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toast.message('Merge queued (mock)')
                setDupOpen(false)
                if (isBatch) {
                  advanceBatch('saved', false)
                } else {
                  navigate(`/contacts/${dupes[0]?.id}`)
                }
              }}
            >
              Merge
            </Button>
            <Button variant="ghost" onClick={() => setDupOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
