import { Badge } from '@/components/ui/badge'
import type { Confidence, EventStatus, FollowUpStatus, HealthStatus, LeadQuality, LeadStatus, QueueStatus, SyncStatus } from '@/types'

const leadStatusVariant: Record<LeadStatus, 'muted' | 'secondary' | 'success' | 'warning' | 'default' | 'danger'> = {
  new: 'muted',
  contacted: 'secondary',
  qualified: 'success',
  interested: 'warning',
  converted: 'default',
  lost: 'danger',
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge variant={leadStatusVariant[status]}>{status.replace('_', ' ')}</Badge>
}

export function LeadQualityBadge({ quality }: { quality: LeadQuality }) {
  const variant = quality === 'hot' ? 'danger' : quality === 'warm' ? 'warning' : 'muted'
  return <Badge variant={variant}>{quality}</Badge>
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const variant = status === 'active' ? 'success' : status === 'upcoming' ? 'secondary' : status === 'completed' ? 'muted' : 'outline'
  return <Badge variant={variant}>{status}</Badge>
}

export function FollowUpStatusBadge({ status }: { status: FollowUpStatus }) {
  const variant =
    status === 'overdue' ? 'danger' : status === 'completed' ? 'success' : status === 'cancelled' ? 'muted' : status === 'in_progress' ? 'warning' : 'secondary'
  return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const variant = confidence === 'high' ? 'success' : confidence === 'medium' ? 'warning' : 'danger'
  return (
    <Badge variant={variant} className="capitalize">
      {confidence === 'low' ? 'Needs review' : `${confidence} confidence`}
    </Badge>
  )
}

export function QueueStatusBadge({ status }: { status: QueueStatus }) {
  const variant =
    status === 'synced'
      ? 'success'
      : status === 'failed'
        ? 'danger'
        : status === 'review_required'
          ? 'warning'
          : 'secondary'
  return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>
}

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const variant = status === 'synced' ? 'success' : status === 'failed' ? 'danger' : status === 'retrying' ? 'warning' : 'secondary'
  return <Badge variant={variant}>{status}</Badge>
}

export function HealthStatusBadge({ status }: { status: HealthStatus }) {
  const variant = status === 'operational' ? 'success' : status === 'degraded' ? 'warning' : 'danger'
  return <Badge variant={variant}>{status}</Badge>
}

export function StatusDot({ tone }: { tone: 'success' | 'warning' | 'danger' | 'muted' }) {
  const color = tone === 'success' ? 'bg-emerald-500' : tone === 'warning' ? 'bg-amber-500' : tone === 'danger' ? 'bg-red-500' : 'bg-slate-400'
  return <span className={`inline-block size-2 rounded-full ${color}`} aria-hidden />
}
