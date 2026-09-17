import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Check,
  CheckCheck,
  Download,
  FileText,
  FileImage,
  FileSpreadsheet,
  File as FileIcon,
  Paperclip,
  User,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, initials } from '@/lib/utils'

export type TicketChatAttachment = {
  id: string
  name: string
  size: number
  type: string
  url?: string
}

export type TicketChatDelivery = 'sent' | 'delivered' | 'read' | 'failed'

export type TicketChatMessage = {
  id: string
  author: string
  body: string
  at: string
  internal?: boolean
  status?: TicketChatDelivery
  attachments?: TicketChatAttachment[]
}

export type ChatPresence = 'online' | 'idle' | 'offline'

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function FileTypeIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <FileImage className="size-4" />
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="size-4" />
  if (type.includes('pdf') || type.includes('word') || type.includes('text')) return <FileText className="size-4" />
  return <FileIcon className="size-4" />
}

/**
 * WhatsApp-style ticks:
 * - not connected / sent → single tick
 * - delivered (not seen) → double tick (muted)
 * - read (seen) → blue double tick
 * `meta` = sit beside timestamp (outside bubble) → use muted/blue colors for light bg.
 */
function MessageTicks({ status, meta = false }: { status?: TicketChatDelivery; meta?: boolean }) {
  if (status === 'failed') {
    return <span className="text-[10px] font-bold text-destructive">!</span>
  }
  if (!status || status === 'sent') {
    return (
      <Check
        className={cn('size-3.5', meta ? 'text-muted-foreground' : 'text-white/80')}
        strokeWidth={2.75}
        aria-label="Sent"
      />
    )
  }
  if (status === 'read') {
    return <CheckCheck className="size-3.5 text-[#53bdeb]" strokeWidth={2.75} aria-label="Read" />
  }
  return (
    <CheckCheck
      className={cn('size-3.5', meta ? 'text-muted-foreground' : 'text-white/80')}
      strokeWidth={2.75}
      aria-label="Delivered"
    />
  )
}

function PresenceDot({ status }: { status: ChatPresence }) {
  const tone =
    status === 'online' ? 'bg-emerald-500' : status === 'idle' ? 'bg-orange-500' : 'bg-red-500'
  const ping = status === 'online' || status === 'idle'
  return (
    <span className="absolute -right-0.5 -top-0.5 flex size-3 items-center justify-center" title={status} aria-label={status}>
      {ping ? <span className={cn('absolute size-3 rounded-full opacity-75 animate-status-ping', tone)} aria-hidden /> : null}
      <span className={cn('relative size-2.5 rounded-full border-2 border-card', tone)} aria-hidden />
    </span>
  )
}

function AttachmentCard({
  file,
  onDownload,
}: {
  file: TicketChatAttachment
  onDownload?: (file: TicketChatAttachment) => void
}) {
  return (
    <div className="flex min-w-0 max-w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-card-foreground shadow-sm">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <FileTypeIcon type={file.type} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
        <p className="text-[11px] text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      <button
        type="button"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={`Download ${file.name}`}
        onClick={() => onDownload?.(file)}
      >
        <Download className="size-3.5" />
      </button>
    </div>
  )
}

export function TicketChat({
  messages,
  currentUserName,
  peerName,
  canAssign,
  peerPresence = 'online',
  selfPresence = 'online',
  connected = false,
  className,
  onSend,
  onTyping,
}: {
  messages: TicketChatMessage[]
  currentUserName: string
  peerName: string
  canAssign: boolean
  peerPresence?: ChatPresence
  selfPresence?: ChatPresence
  /** Live socket connected — drives single vs double tick when status missing. */
  connected?: boolean
  className?: string
  onSend: (body: string, files: File[]) => Promise<void>
  onTyping?: (isTyping: boolean) => void
}) {
  const [reply, setReply] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingTimer = useRef(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, sending])

  const emitTyping = (next: boolean) => {
    onTyping?.(next)
    window.clearTimeout(typingTimer.current)
    if (next) {
      typingTimer.current = window.setTimeout(() => onTyping?.(false), 2000)
    }
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? [])
    if (list.length) setFiles((prev) => [...prev, ...list].slice(0, 5))
    e.target.value = ''
  }

  const submit = async () => {
    if ((!reply.trim() && files.length === 0) || sending) return
    setSending(true)
    emitTyping(false)
    try {
      await onSend(reply.trim(), files)
      setReply('')
      setFiles([])
    } finally {
      setSending(false)
    }
  }

  const tickFor = (m: TicketChatMessage): TicketChatDelivery => {
    if (m.status) return m.status
    return connected ? 'delivered' : 'sent'
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card',
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-4 scrollbar-thin">
        <div className="mt-auto flex flex-col gap-4">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
          ) : null}
          {messages.map((m) => {
            const own = canAssign
              ? m.author !== peerName
              : m.author === currentUserName || m.author === 'You' || m.author === peerName
            const presence = own ? selfPresence : peerPresence
            return (
              <div key={m.id} className={cn('flex gap-3', own ? 'flex-row-reverse' : 'flex-row')}>
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full text-xs font-semibold',
                      own ? 'bg-primary text-primary-foreground' : 'bg-slate-800 text-white',
                    )}
                  >
                    {own ? initials(m.author || 'SA') : <User className="size-5" aria-hidden />}
                  </div>
                  <PresenceDot status={presence} />
                </div>
                <div className={cn('min-w-0 max-w-[min(100%,22rem)] sm:max-w-md', own ? 'text-right' : 'text-left')}>
                  <div
                    className={cn(
                      'mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground',
                      own ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <span className="font-medium text-foreground/80">
                      {own ? (canAssign ? 'Support Agent' : m.author) : canAssign ? m.author : 'Support Agent'}
                      {m.internal ? ' · Internal' : ''}
                    </span>
                    <span>{formatTime(m.at)}</span>
                    {own && !m.internal ? <MessageTicks status={tickFor(m)} meta /> : null}
                  </div>
                  <div
                    className={cn(
                      'inline-block max-w-full rounded-2xl px-3.5 py-2.5 text-left text-sm',
                      // Internal notes arrive from CMS only — amber surface so they stay distinct.
                      m.internal
                        ? 'border border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100'
                        : 'bg-primary text-primary-foreground',
                    )}
                  >
                    {m.body ? <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p> : null}
                    {m.attachments?.length ? (
                      <div className={cn('space-y-2', m.body ? 'mt-2.5' : '')}>
                        {m.attachments.map((a) => (
                          <AttachmentCard
                            key={a.id}
                            file={a}
                            onDownload={() => {
                              if (a.url && a.url !== '#') window.open(a.url, '_blank', 'noopener,noreferrer')
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border bg-muted/40 p-3 sm:p-4">
        {files.length ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className="flex max-w-full items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-xs"
              >
                <FileTypeIcon type={f.type} />
                <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
                <button
                  type="button"
                  className="flex size-6 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-600 transition-colors hover:bg-red-600 hover:text-white dark:bg-red-950/60 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X className="size-3.5" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex h-[36px] items-center gap-2">
          <input ref={fileRef} type="file" className="hidden" multiple onChange={onPick} />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-[36px] shrink-0"
            aria-label="Attach file"
            disabled={sending}
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip className="size-4" />
          </Button>
          <input
            type="text"
            value={reply}
            onChange={(e) => {
              setReply(e.target.value)
              emitTyping(e.target.value.length > 0)
            }}
            placeholder="Type your message here..."
            disabled={sending}
            className="h-[36px] min-w-0 flex-1 rounded-md border border-border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void submit()
              }
            }}
          />
          <Button
            type="button"
            variant="default"
            size="default"
            className="h-[36px] w-[192px] shrink-0"
            disabled={sending || (!reply.trim() && files.length === 0)}
            loading={sending}
            onClick={() => void submit()}
          >
            Send Message
          </Button>
        </div>
      </div>
    </div>
  )
}
