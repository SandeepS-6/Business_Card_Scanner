import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  CreditCard,
  Info,
  MessageSquare,
  RefreshCw,
  ScanLine,
  Shield,
  Trash2,
  Users,
  Workflow,
} from 'lucide-react'
import type { NotificationType } from '@/types'

/** Semantic presentation for notification types — theme-token-friendly, light + dark. */
export type NotificationVisualKind =
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'security'
  | 'team'
  | 'event'
  | 'billing'
  | 'ticket'

export type NotificationTypeConfig = {
  label: string
  kind: NotificationVisualKind
  Icon: LucideIcon
  /** Soft tinted icon well */
  iconWell: string
  /** Optional left accent for unread */
  accent: string
}

const KIND_STYLES: Record<NotificationVisualKind, Pick<NotificationTypeConfig, 'iconWell' | 'accent'>> = {
  success: {
    iconWell: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    accent: 'bg-emerald-500',
  },
  info: {
    iconWell: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    accent: 'bg-sky-500',
  },
  warning: {
    iconWell: 'bg-amber-500/10 text-amber-800 dark:text-amber-400',
    accent: 'bg-amber-500',
  },
  error: {
    iconWell: 'bg-destructive/10 text-destructive',
    accent: 'bg-destructive',
  },
  security: {
    iconWell: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    accent: 'bg-violet-500',
  },
  team: {
    iconWell: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
    accent: 'bg-indigo-500',
  },
  event: {
    iconWell: 'bg-teal-500/10 text-teal-800 dark:text-teal-400',
    accent: 'bg-teal-600 dark:bg-teal-500',
  },
  billing: {
    iconWell: 'bg-orange-500/10 text-orange-800 dark:text-orange-400',
    accent: 'bg-orange-500',
  },
  ticket: {
    iconWell: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    accent: 'bg-blue-500',
  },
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  system: { label: 'System', kind: 'info', Icon: Info, ...KIND_STYLES.info },
  lead: { label: 'Lead', kind: 'event', Icon: Bell, ...KIND_STYLES.event },
  follow_up: { label: 'Follow-up', kind: 'warning', Icon: AlertTriangle, ...KIND_STYLES.warning },
  ocr: { label: 'OCR', kind: 'info', Icon: ScanLine, ...KIND_STYLES.info },
  crm: { label: 'CRM', kind: 'error', Icon: RefreshCw, ...KIND_STYLES.error },
  communication: { label: 'Message', kind: 'success', Icon: CheckCircle2, ...KIND_STYLES.success },
  team: { label: 'Team', kind: 'team', Icon: Users, ...KIND_STYLES.team },
  ticket: { label: 'Ticket', kind: 'ticket', Icon: MessageSquare, ...KIND_STYLES.ticket },
  automation: { label: 'Automation', kind: 'warning', Icon: Workflow, ...KIND_STYLES.warning },
  sync: { label: 'Sync', kind: 'error', Icon: AlertCircle, ...KIND_STYLES.error },
  event: { label: 'Event', kind: 'event', Icon: Calendar, ...KIND_STYLES.event },
  billing: { label: 'Billing', kind: 'billing', Icon: CreditCard, ...KIND_STYLES.billing },
  cms: { label: 'CMS', kind: 'info', Icon: Info, ...KIND_STYLES.info },
  recovery: { label: 'Recovery', kind: 'warning', Icon: Trash2, ...KIND_STYLES.warning },
}

/** Override visual kind when title/message implies success vs failure for dual-use types. */
export function resolveNotificationConfig(
  type: NotificationType,
  title: string,
): NotificationTypeConfig {
  const base = NOTIFICATION_TYPE_CONFIG[type] ?? {
    label: 'General',
    kind: 'info' as const,
    Icon: Bell,
    ...KIND_STYLES.info,
  }
  const t = title.toLowerCase()
  if (type === 'automation' && (t.includes('completed') || t.includes('success'))) {
    return { ...base, kind: 'success', Icon: CheckCircle2, ...KIND_STYLES.success }
  }
  if (type === 'crm' && (t.includes('synced') || t.includes('connected'))) {
    return { ...base, kind: 'success', Icon: CheckCircle2, ...KIND_STYLES.success }
  }
  if (type === 'system' && (t.includes('login') || t.includes('password') || t.includes('permission'))) {
    return { ...base, kind: 'security', Icon: Shield, ...KIND_STYLES.security, label: 'Security' }
  }
  return base
}

const PREVIEW_LEN = 96

export function notificationPreview(message: string, expanded: boolean) {
  const text = message.trim()
  if (expanded || text.length <= PREVIEW_LEN) return { text, truncatable: text.length > PREVIEW_LEN }
  return { text: `${text.slice(0, PREVIEW_LEN).trimEnd()}…`, truncatable: true }
}

/** Compact relative timestamps — never "N/A". */
export function notificationRelativeTime(iso: string | undefined | null) {
  if (!iso) return 'Just now'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'Just now'
  const diff = Date.now() - then
  const m = Math.round(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`
  const d = Math.round(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d} days ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
