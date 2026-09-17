import { useState } from 'react'
import { TicketPlus } from 'lucide-react'
import { StatusDot } from '@/components/shared/status-badges'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import { ticketService } from '@/services/features-api'
import type { CrmIntegration } from '@/types'
import type { TicketCategory, TicketPriority } from '@/types/features'
import { toast } from 'sonner'

const PROVIDER_LABEL: Record<CrmIntegration['provider'], string> = {
  hubspot: 'HubSpot',
  salesforce: 'Salesforce',
  zoho: 'Zoho',
  rest: 'REST API',
}

export function ReviewContextBar({
  eventName,
  integrations,
  capturedBy,
  capturedAt,
  avatarUrl,
  orgId,
  cardLabel,
}: {
  eventName: string
  integrations: CrmIntegration[]
  capturedBy: string
  capturedAt: string
  avatarUrl?: string
  orgId: string
  cardLabel: string
}) {
  const [ticketOpen, setTicketOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TicketCategory>('ocr')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [submitting, setSubmitting] = useState(false)

  const initials = capturedBy
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const submitTicket = async () => {
    if (!subject.trim()) return
    setSubmitting(true)
    try {
      const t = await ticketService.create({
        orgId,
        subject: subject.trim(),
        category,
        priority,
        status: 'open',
        requester: capturedBy,
      })
      const detail = description.trim() || `Issue on review of ${cardLabel} (${eventName}).`
      await ticketService.reply(t.id, capturedBy, detail)
      toast.success('Ticket created')
      setTicketOpen(false)
      setSubject('')
      setDescription('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Card className="mb-6">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Event</p>
            <p className="text-sm font-medium">{eventName}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Captured by</p>
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                <AvatarFallback>{initials || '?'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{capturedBy}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(capturedAt)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <p className="text-xs text-muted-foreground">Admin integrations</p>
            <div className="flex flex-wrap gap-1.5">
              {integrations.length ? (
                integrations.map((i) => (
                  <Badge key={i.id} variant={i.connected ? 'success' : 'muted'} className="gap-1.5 font-medium">
                    <StatusDot tone={i.connected ? 'success' : 'muted'} />
                    {PROVIDER_LABEL[i.provider]}
                    <span className="font-normal opacity-80">{i.connected ? 'Connected' : 'Off'}</span>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No CRM integrations</p>
              )}
            </div>
          </div>

          <div className="flex items-end justify-start lg:justify-end">
            <Button type="button" variant="outline" onClick={() => setTicketOpen(true)}>
              <TicketPlus className="size-4" />
              Add ticket
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an issue</DialogTitle>
            <DialogDescription>
              Create a support ticket for OCR, capture, or sync problems on this card.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="rv-ticket-subj">Subject</Label>
              <Input
                id="rv-ticket-subj"
                className="mt-1"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Low confidence on glossy card"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['ocr', 'crm', 'technical', 'whatsapp', 'email', 'other'] as TicketCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="rv-ticket-desc">Details</Label>
              <Textarea
                id="rv-ticket-desc"
                className="mt-1"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What went wrong? Include event and what you expected."
              />
            </div>
            <Button disabled={!subject.trim() || submitting} loading={submitting} onClick={() => void submitTicket()}>
              Submit ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function RatingRow({
  label,
  score,
  max = 5,
  tone,
  caption,
}: {
  label: string
  score: number
  max?: number
  tone: 'success' | 'warning' | 'danger' | 'muted'
  caption: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <StatusDot tone={tone} />
          {caption}
        </span>
      </div>
      <div className="flex gap-1" aria-label={`${label}: ${score} of ${max}`}>
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < score ? (tone === 'success' ? 'bg-emerald-500' : tone === 'warning' ? 'bg-amber-500' : tone === 'danger' ? 'bg-red-500' : 'bg-slate-400') : 'bg-muted'}`}
          />
        ))}
      </div>
    </div>
  )
}

export function ImageQualityRatings({
  imageQuality,
  ocrConfidence,
  sharpness,
}: {
  imageQuality: number
  ocrConfidence: number
  sharpness: number
}) {
  const toneFor = (n: number): 'success' | 'warning' | 'danger' =>
    n >= 4 ? 'success' : n >= 3 ? 'warning' : 'danger'
  const caption = (n: number) => (n >= 4 ? 'Good' : n >= 3 ? 'Fair' : 'Needs review')

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-sm font-semibold">Image assessment</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <RatingRow label="Image quality" score={imageQuality} tone={toneFor(imageQuality)} caption={caption(imageQuality)} />
        <RatingRow label="OCR confidence" score={ocrConfidence} tone={toneFor(ocrConfidence)} caption={caption(ocrConfidence)} />
        <RatingRow label="Sharpness" score={sharpness} tone={toneFor(sharpness)} caption={caption(sharpness)} />
      </div>
    </div>
  )
}
