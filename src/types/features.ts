/** Mock domain types for new product surfaces. Backend will replace these later. */

export type DeletedItemType = 'contact' | 'lead' | 'event' | 'template' | 'page' | 'other'

export type DeletedItem = {
  id: string
  orgId: string
  type: DeletedItemType
  name: string
  company?: string
  deletedAt: string
  deletedBy: string
  originalLocation: string
  daysRemaining: number
}

export type ContentVersion = {
  id: string
  resourceType: string
  resourceId: string
  resourceName: string
  version: number
  summary: string
  createdAt: string
  createdBy: string
  snapshot: string
}

export type AutomationStatus = 'active' | 'draft' | 'paused' | 'error'
export type AutomationRunStatus = 'success' | 'failed' | 'skipped'

export type AutomationRule = {
  id: string
  orgId: string
  name: string
  status: AutomationStatus
  trigger: string
  conditions: { field: string; op: string; value: string }[]
  conditionLogic: 'and' | 'or'
  actions: { type: string; config: string }[]
  lastRunAt?: string
  runs: number
  successRate: number
  createdBy: string
  updatedAt: string
}

export type AutomationRun = {
  id: string
  automationId: string
  ranAt: string
  trigger: string
  contactName: string
  result: AutomationRunStatus
  durationMs: number
  actionsExecuted: string[]
  error?: string
}

export type PresenceStatus = 'online' | 'idle' | 'offline'

export type TeamPresence = {
  userId: string
  orgId: string
  name: string
  role: string
  status: PresenceStatus
  activity: string
  lastSeen: string
  eventId?: string
  cardsScanned: number
  leadsGenerated: number
}

export type VenueBooth = {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  team: string[]
  cards: number
  leads: number
  lastActivity: string
}

export type LiveActivity = {
  id: string
  orgId: string
  eventId: string
  text: string
  at: string
  kind: 'scan' | 'lead' | 'follow_up' | 'presence' | 'sync'
}

export type SyncConflict = {
  id: string
  orgId: string
  resource: string
  field: string
  mine: string
  server: string
  updatedBy: string
}

export type SyncRecord = {
  id: string
  orgId: string
  label: string
  status: 'synced' | 'pending' | 'processing' | 'failed' | 'retrying' | 'offline'
  createdAt: string
  retryCount: number
  error?: string
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'
export type TicketCategory = 'technical' | 'billing' | 'account' | 'ocr' | 'crm' | 'whatsapp' | 'email' | 'other'

export type SupportTicket = {
  id: string
  orgId: string
  subject: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  requester: string
  assignee?: string
  createdAt: string
  updatedAt: string
  messages: { id: string; author: string; body: string; at: string; internal?: boolean }[]
  history: { id: string; text: string; at: string }[]
}

export type PlanId = 'free' | 'pro' | 'business' | 'enterprise'

export type Plan = {
  id: PlanId
  name: string
  priceMonthly: number
  users: number
  cardsMonth: number
  events: number
  storageGb: number
  ocr: number
  email: number
  whatsapp: number
  crm: boolean
  support: string
}

export type Invoice = {
  id: string
  orgId: string
  number: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
}

export type BillingTxn = {
  id: string
  orgId: string
  date: string
  description: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  method: string
}
