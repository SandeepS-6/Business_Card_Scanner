import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { ConfidenceBadge } from '@/components/shared/status-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useApp } from '@/context/app-context'
import { contactService } from '@/services/api'
import { secureStorage } from '@/security/storage'
import type { Confidence, Contact, OcrResult } from '@/types'
import { toast } from 'sonner'
import { ErrorState } from '@/components/shared/empty-state'
import { ReviewFollowUpSection } from '@/components/review/review-follow-up'

type FieldKey = keyof OcrResult['fields']

const FIELD_LABELS: Record<FieldKey, string> = {
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
  notes: 'Notes',
}

export function ReviewPage() {
  const navigate = useNavigate()
  const { organization, user, selectedEventId } = useApp()
  const stored = secureStorage.getOcrResult()
  const initial = useMemo(() => (stored ? (JSON.parse(stored) as OcrResult) : null), [stored])
  const [result, setResult] = useState<OcrResult | null>(initial)
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [dupOpen, setDupOpen] = useState(false)
  const [dupes, setDupes] = useState<Contact[]>([])
  const [saving, setSaving] = useState(false)
  const [createLead, setCreateLead] = useState(false)

  if (!result) {
    return (
      <ErrorState
        title="No OCR result"
        description="Capture a card first to review extracted fields."
        onRetry={() => navigate('/capture')}
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
      eventId: selectedEventId ?? undefined,
      leadStatus: createLead ? 'new' : 'new',
      leadQuality: 'warm',
      ownerId: user!.id,
      tags: [],
      source: 'Business card scan',
      cardImageUrl: result.imageUrl,
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
  }

  const saveFlow = async (alsoLead: boolean) => {
    setCreateLead(alsoLead)
    setSaving(true)
    const found = await contactService.findDuplicates(organization!.id, result.fields.email.value, result.fields.phone.value)
    setSaving(false)
    if (found.length) {
      setDupes(found)
      setDupOpen(true)
      return
    }
    await persistNew()
  }

  const persistNew = async () => {
    const contact = buildContact()
    await contactService.create(contact)
    toast.success(createLead ? 'Contact saved & lead created' : 'Contact saved')
    secureStorage.clearOcrDraft()
    navigate(`/contacts/${contact.id}`)
  }

  return (
    <div>
      <PageHeader
        title="Review Card"
        description="Verify OCR fields. Low confidence fields need review."
        backTo="/"
        backLabel="Back to home"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/capture')}>
              Reprocess
            </Button>
            <Button variant="secondary" loading={saving} onClick={() => void saveFlow(false)}>
              Save
            </Button>
            <Button loading={saving} onClick={() => void saveFlow(true)}>
              Save & Create Lead
            </Button>
          </div>
        }
      />

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
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
                Zoom in
              </Button>
              <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}>
                Zoom out
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRotation((r) => r + 90)}>
                Rotate
              </Button>
              <Button size="sm" variant="outline" disabled title="Crop UI placeholder">
                Crop
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracted information</CardTitle>
          </CardHeader>
          <CardContent className="grid max-h-[70vh] gap-3 overflow-y-auto sm:grid-cols-2">
            {(Object.keys(FIELD_LABELS) as FieldKey[]).map((key) => {
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

      <ReviewFollowUpSection
        contactName={result.fields.fullName.value || `${result.fields.firstName.value} ${result.fields.lastName.value}`.trim()}
        eventName="Tech Expo 2026"
      />

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
                navigate(`/contacts/${dupes[0]?.id}`)
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
                navigate(`/contacts/${dupes[0]?.id}`)
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
