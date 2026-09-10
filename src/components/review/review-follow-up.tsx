import { useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateField } from '@/components/shared/date-field'

type Channel = 'email' | 'whatsapp' | 'meeting' | 'call' | 'sms'

type Template = {
  id: string
  channel: Exclude<Channel, 'call' | 'sms' | 'meeting'>
  name: string
  subject?: string
  body: string
}

const MOCK_TEMPLATES: Template[] = [
  {
    id: 'em-post',
    channel: 'email',
    name: 'Post Event Follow-up',
    subject: 'Great meeting you at {{event.name}}',
    body: 'Hi {{contact.name}},\n\nIt was great meeting you at {{event.name}}. I\'d love to continue our conversation about partnership opportunities.\n\nBest regards',
  },
  {
    id: 'em-thanks',
    channel: 'email',
    name: 'Thank you note',
    subject: 'Thanks for connecting, {{contact.name}}',
    body: 'Hi {{contact.name}},\n\nThanks for stopping by our booth. Looking forward to staying in touch.\n\nCheers',
  },
  {
    id: 'wa-post',
    channel: 'whatsapp',
    name: 'Post Event WhatsApp Follow-up',
    body: 'Hi {{contact.name}}, great meeting you at {{event.name}}. I\'d love to continue our conversation.',
  },
  {
    id: 'wa-quick',
    channel: 'whatsapp',
    name: 'Quick check-in',
    body: 'Hi {{contact.name}} — following up from {{event.name}}. Free for a quick chat this week?',
  },
]

const MEETING_PRESETS = [
  {
    id: 'mt-partner',
    name: 'Partnership Discussion',
    title: 'Partnership Discussion',
    duration: '30',
    agenda: 'Discuss partnership opportunities and next steps.',
  },
  {
    id: 'mt-demo',
    name: 'Product demo',
    title: 'Product demo',
    duration: '45',
    agenda: 'Walk through product capabilities and answer questions.',
  },
]

const TIMES = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

type Props = {
  contactName?: string
  eventName?: string
}

export function ReviewFollowUpSection({ contactName = 'Contact', eventName = 'Tech Expo 2026' }: Props) {
  const [enabled, setEnabled] = useState(false)
  const [channel, setChannel] = useState<Channel>('email')
  const [templateId, setTemplateId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [customizing, setCustomizing] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [duration, setDuration] = useState('30')
  const [agenda, setAgenda] = useState('')
  const [presetId, setPresetId] = useState('')
  const [touched, setTouched] = useState(false)

  const channelTemplates = useMemo(
    () => MOCK_TEMPLATES.filter((t) => t.channel === channel),
    [channel],
  )

  const fillVars = (text: string) =>
    text
      .replaceAll('{{contact.name}}', contactName)
      .replaceAll('{{event.name}}', eventName)

  const applyTemplate = (id: string) => {
    setTemplateId(id)
    const t = MOCK_TEMPLATES.find((x) => x.id === id)
    if (!t) return
    setSubject(t.subject ?? '')
    setBody(t.body)
    setCustomizing(false)
  }

  const applyPreset = (id: string) => {
    setPresetId(id)
    const p = MEETING_PRESETS.find((x) => x.id === id)
    if (!p) return
    setMeetingTitle(p.title)
    setDuration(p.duration)
    setAgenda(p.agenda)
  }

  const onChannelChange = (next: Channel) => {
    setChannel(next)
    setTemplateId('')
    setPresetId('')
    setSubject('')
    setBody('')
    setMeetingTitle('')
    setAgenda('')
    setCustomizing(false)
    setTouched(false)
  }

  const dateError = touched && enabled && !date ? 'Select a follow-up date' : undefined
  const showMessageUi = channel === 'email' || channel === 'whatsapp'
  const showMeetingUi = channel === 'meeting'

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Follow-up</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="schedule-follow-up"
            checked={enabled}
            onCheckedChange={(v) => setEnabled(v === true)}
            aria-expanded={enabled}
          />
          <Label htmlFor="schedule-follow-up" className="font-normal">
            Schedule a follow-up
          </Label>
        </div>

        {enabled ? (
          <div className="space-y-4 border-t border-border pt-4" role="region" aria-label="Follow-up details">
            <div className="space-y-1.5">
              <Label htmlFor="fu-channel">Channel</Label>
              <Select value={channel} onValueChange={(v) => onChannelChange(v as Channel)}>
                <SelectTrigger id="fu-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fu-date">Date</Label>
                <DateField
                  id="fu-date"
                  value={date}
                  onChange={(v) => {
                    setDate(v)
                    setTouched(true)
                  }}
                  error={dateError}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fu-time">Time</Label>
                <Select value={time || undefined} onValueChange={setTime}>
                  <SelectTrigger id="fu-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showMessageUi ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fu-template">Content / Template</Label>
                  <Select
                    value={templateId || undefined}
                    onValueChange={applyTemplate}
                  >
                    <SelectTrigger id="fu-template">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {channelTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Templates are managed in CMS → Email / WhatsApp Templates.</p>
                </div>

                {channel === 'email' && templateId ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="fu-subject">Subject</Label>
                    {customizing ? (
                      <Input id="fu-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    ) : (
                      <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">{fillVars(subject) || '—'}</p>
                    )}
                  </div>
                ) : null}

                {templateId ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Preview</Label>
                      <Button type="button" size="sm" variant="outline" onClick={() => setCustomizing((c) => !c)}>
                        {customizing ? 'Done' : 'Customize content'}
                      </Button>
                    </div>
                    {customizing ? (
                      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} aria-label="Customize follow-up message" />
                    ) : (
                      <div className="rounded-md border border-border bg-muted/20 p-3 text-sm whitespace-pre-wrap">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {channel === 'email' ? 'Email' : 'WhatsApp'}
                        </p>
                        {channel === 'email' && subject ? (
                          <p className="mb-2 font-medium">{fillVars(subject)}</p>
                        ) : null}
                        {fillVars(body) || <span className="text-muted-foreground">No template selected</span>}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a template to preview follow-up content.</p>
                )}
              </>
            ) : null}

            {showMeetingUi ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fu-preset">Meeting preset</Label>
                  <Select value={presetId || undefined} onValueChange={applyPreset}>
                    <SelectTrigger id="fu-preset">
                      <SelectValue placeholder="Select preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEETING_PRESETS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Presets are managed in CMS → Meeting Presets.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fu-mtitle">Meeting title</Label>
                  <Input id="fu-mtitle" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Partnership Discussion" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fu-duration">Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="fu-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fu-agenda">Agenda</Label>
                  <Textarea id="fu-agenda" value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3} placeholder="Discuss partnership opportunities…" />
                </div>
                {(meetingTitle || agenda) && (
                  <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Meeting preview</p>
                    <p className="font-medium">{meetingTitle || 'Untitled meeting'}</p>
                    <p className="text-muted-foreground">{duration} minutes · with {contactName}</p>
                    {agenda ? <p className="mt-2 whitespace-pre-wrap">{agenda}</p> : null}
                  </div>
                )}
              </>
            ) : null}

            {(channel === 'call' || channel === 'sms') && (
              <p className="text-sm text-muted-foreground">
                {channel === 'call' ? 'Call' : 'SMS'} follow-ups use date/time only in this UI mock. Message templates stay in Communications.
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
