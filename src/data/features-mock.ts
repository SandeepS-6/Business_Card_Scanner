import type {
  AutomationRule,
  AutomationRun,
  BillingTxn,
  ContentVersion,
  DeletedItem,
  Invoice,
  LiveActivity,
  Plan,
  PlanId,
  SupportTicket,
  SyncConflict,
  SyncRecord,
  TeamPresence,
  VenueBooth,
} from '@/types/features'

export const plans: Plan[] = [
  { id: 'free', name: 'Free', priceMonthly: 0, users: 2, cardsMonth: 100, events: 1, storageGb: 1, ocr: 100, email: 50, whatsapp: 0, crm: false, support: 'Community' },
  { id: 'pro', name: 'Pro', priceMonthly: 49, users: 5, cardsMonth: 2000, events: 5, storageGb: 20, ocr: 2000, email: 2000, whatsapp: 500, crm: true, support: 'Email' },
  { id: 'business', name: 'Business', priceMonthly: 99, users: 10, cardsMonth: 10000, events: 25, storageGb: 100, ocr: 10000, email: 10000, whatsapp: 5000, crm: true, support: 'Priority' },
  { id: 'enterprise', name: 'Enterprise', priceMonthly: 0, users: 999, cardsMonth: 999999, events: 999, storageGb: 1000, ocr: 999999, email: 999999, whatsapp: 999999, crm: true, support: 'Dedicated' },
]

export let deletedItems: DeletedItem[] = [
  { id: 'del1', orgId: 'org-nexus', type: 'contact', name: 'John Smith', company: 'TechCorp', deletedAt: '2026-09-09T17:00:00Z', deletedBy: 'Maya Patel', originalLocation: 'Contacts', daysRemaining: 28 },
  { id: 'del2', orgId: 'org-nexus', type: 'lead', name: 'Marcus Cole', company: 'Northline Soft', deletedAt: '2026-09-08T12:00:00Z', deletedBy: 'Ava Chen', originalLocation: 'Leads · New', daysRemaining: 27 },
  { id: 'del3', orgId: 'org-nexus', type: 'template', name: 'Post-event thank you', deletedAt: '2026-09-07T09:00:00Z', deletedBy: 'Ava Chen', originalLocation: 'Email Templates', daysRemaining: 26 },
  { id: 'del4', orgId: 'org-atlas', type: 'contact', name: 'Sam Lee', company: 'FieldCore', deletedAt: '2026-09-09T10:00:00Z', deletedBy: 'Riley Brooks', originalLocation: 'Contacts', daysRemaining: 28 },
]

export const contentVersions: ContentVersion[] = [
  { id: 'ver1', resourceType: 'cms_page', resourceId: 'p-home', resourceName: 'Home', version: 3, summary: 'Updated capture help copy', createdAt: '2026-09-09T14:00:00Z', createdBy: 'Ava Chen', snapshot: 'Welcome back to Nexus · Capture tip updated' },
  { id: 'ver2', resourceType: 'cms_page', resourceId: 'p-home', resourceName: 'Home', version: 2, summary: 'Merged dashboard + capture', createdAt: '2026-09-08T11:00:00Z', createdBy: 'Ava Chen', snapshot: 'Home combined layout' },
  { id: 'ver3', resourceType: 'email_template', resourceId: 'et1', resourceName: 'Thank you email', version: 2, summary: 'CTA button color', createdAt: '2026-09-06T16:00:00Z', createdBy: 'Maya Patel', snapshot: 'Subject: Thanks for connecting' },
  { id: 'ver4', resourceType: 'branding', resourceId: 'brand', resourceName: 'Brand identity', version: 1, summary: 'Initial teal palette', createdAt: '2026-09-01T09:00:00Z', createdBy: 'Ava Chen', snapshot: 'Primary #0f766e' },
]

export let automations: AutomationRule[] = [
  {
    id: 'auto1',
    orgId: 'org-nexus',
    name: 'Tech Expo enterprise welcome',
    status: 'active',
    trigger: 'Contact created',
    conditions: [
      { field: 'Event', op: 'equals', value: 'Tech Expo 2026' },
      { field: 'Company type', op: 'equals', value: 'Enterprise' },
    ],
    conditionLogic: 'and',
    actions: [
      { type: 'Add tag', config: 'Tech Expo' },
      { type: 'Assign owner', config: 'Event Owner' },
      { type: 'Create follow-up', config: 'Email in 1 day' },
      { type: 'Send notification', config: 'Notify Manager' },
    ],
    lastRunAt: '2026-09-09T16:40:00Z',
    runs: 48,
    successRate: 97.9,
    createdBy: 'Ava Chen',
    updatedAt: '2026-09-09T10:00:00Z',
  },
  {
    id: 'auto2',
    orgId: 'org-nexus',
    name: 'Overdue follow-up nudge',
    status: 'paused',
    trigger: 'Follow-up overdue',
    conditions: [{ field: 'Lead status', op: 'equals', value: 'Qualified' }],
    conditionLogic: 'and',
    actions: [{ type: 'Send notification', config: 'Assignee' }],
    lastRunAt: '2026-09-05T08:00:00Z',
    runs: 12,
    successRate: 100,
    createdBy: 'Maya Patel',
    updatedAt: '2026-09-05T08:10:00Z',
  },
  {
    id: 'auto3',
    orgId: 'org-nexus',
    name: 'High intent lead CRM push',
    status: 'draft',
    trigger: 'Lead status changed',
    conditions: [{ field: 'Lead intent', op: 'equals', value: 'High Intent' }],
    conditionLogic: 'and',
    actions: [{ type: 'Change lead status', config: 'Qualified' }],
    runs: 0,
    successRate: 0,
    createdBy: 'Ava Chen',
    updatedAt: '2026-09-09T12:00:00Z',
  },
]

export const automationRuns: AutomationRun[] = [
  { id: 'ar1', automationId: 'auto1', ranAt: '2026-09-09T16:40:00Z', trigger: 'Contact created', contactName: 'Jordan Lee', result: 'success', durationMs: 420, actionsExecuted: ['Add tag', 'Assign owner', 'Create follow-up'] },
  { id: 'ar2', automationId: 'auto1', ranAt: '2026-09-09T15:10:00Z', trigger: 'Contact created', contactName: 'Priya Shah', result: 'skipped', durationMs: 80, actionsExecuted: [] },
  { id: 'ar3', automationId: 'auto2', ranAt: '2026-09-05T08:00:00Z', trigger: 'Follow-up overdue', contactName: 'Marcus Cole', result: 'failed', durationMs: 1100, actionsExecuted: [], error: 'Notification channel unavailable (mock)' },
]

export let presence: TeamPresence[] = [
  { userId: 'user-nexus-1', orgId: 'org-nexus', name: 'Maya Patel', role: 'User', status: 'online', activity: 'Scanning a business card', lastSeen: '2026-09-09T17:05:00Z', eventId: 'evt-tech-expo', cardsScanned: 42, leadsGenerated: 18 },
  { userId: 'user-nexus-admin', orgId: 'org-nexus', name: 'Ava Chen', role: 'Admin', status: 'online', activity: 'Reviewing contact', lastSeen: '2026-09-09T17:04:00Z', eventId: 'evt-tech-expo', cardsScanned: 12, leadsGenerated: 9 },
  { userId: 'user-nexus-2', orgId: 'org-nexus', name: 'Noah Kim', role: 'User', status: 'idle', activity: 'Last active 4 minutes ago', lastSeen: '2026-09-09T17:00:00Z', eventId: 'evt-tech-expo', cardsScanned: 21, leadsGenerated: 7 },
  { userId: 'user-nexus-3', orgId: 'org-nexus', name: 'Sofia Reyes', role: 'User', status: 'offline', activity: 'Last seen 25 minutes ago', lastSeen: '2026-09-09T16:40:00Z', cardsScanned: 5, leadsGenerated: 2 },
]

export const venueBooths: VenueBooth[] = [
  { id: 'b-stage', label: 'Main Stage', x: 20, y: 8, w: 60, h: 14, team: [], cards: 0, leads: 0, lastActivity: '—' },
  { id: 'b-a', label: 'Booth A', x: 8, y: 30, w: 24, h: 18, team: ['Maya Patel'], cards: 86, leads: 31, lastActivity: '10 seconds ago' },
  { id: 'b-b', label: 'Booth B', x: 38, y: 30, w: 24, h: 18, team: ['Ava Chen', 'Noah Kim'], cards: 124, leads: 42, lastActivity: '2 seconds ago' },
  { id: 'b-c', label: 'Booth C', x: 68, y: 30, w: 24, h: 18, team: [], cards: 54, leads: 19, lastActivity: '3 minutes ago' },
  { id: 'b-d', label: 'Booth D', x: 8, y: 54, w: 24, h: 18, team: ['Sofia Reyes'], cards: 33, leads: 11, lastActivity: '25 minutes ago' },
  { id: 'b-e', label: 'Booth E', x: 38, y: 54, w: 24, h: 18, team: [], cards: 41, leads: 14, lastActivity: '8 minutes ago' },
  { id: 'b-f', label: 'Booth F', x: 68, y: 54, w: 24, h: 18, team: [], cards: 22, leads: 6, lastActivity: '12 minutes ago' },
  { id: 'b-reg', label: 'Registration', x: 28, y: 78, w: 44, h: 14, team: ['Maya Patel'], cards: 18, leads: 4, lastActivity: '1 minute ago' },
]

export let liveActivities: LiveActivity[] = [
  { id: 'la1', orgId: 'org-nexus', eventId: 'evt-tech-expo', text: 'Maya scanned a card', at: '2026-09-09T17:05:58Z', kind: 'scan' },
  { id: 'la2', orgId: 'org-nexus', eventId: 'evt-tech-expo', text: 'Ava qualified a lead', at: '2026-09-09T17:05:48Z', kind: 'lead' },
  { id: 'la3', orgId: 'org-nexus', eventId: 'evt-tech-expo', text: 'Noah created a follow-up', at: '2026-09-09T17:05:32Z', kind: 'follow_up' },
  { id: 'la4', orgId: 'org-nexus', eventId: 'evt-tech-expo', text: 'Maya came online', at: '2026-09-09T17:04:00Z', kind: 'presence' },
]

export let syncRecords: SyncRecord[] = [
  { id: 'sr1', orgId: 'org-nexus', label: 'Jordan Lee → HubSpot', status: 'synced', createdAt: '2026-09-09T16:00:00Z', retryCount: 0 },
  { id: 'sr2', orgId: 'org-nexus', label: 'Priya Shah → HubSpot', status: 'pending', createdAt: '2026-09-09T16:50:00Z', retryCount: 0 },
  { id: 'sr3', orgId: 'org-nexus', label: 'Marcus Cole → REST API', status: 'failed', createdAt: '2026-09-09T15:00:00Z', retryCount: 2, error: 'Timeout contacting CRM (mock)' },
  { id: 'sr4', orgId: 'org-nexus', label: 'Offline card batch #12', status: 'processing', createdAt: '2026-09-09T17:00:00Z', retryCount: 0 },
  { id: 'sr5', orgId: 'org-nexus', label: 'Elena Rossi → HubSpot', status: 'retrying', createdAt: '2026-09-09T14:20:00Z', retryCount: 1 },
]

export let syncConflicts: SyncConflict[] = [
  { id: 'sc1', orgId: 'org-nexus', resource: 'Jordan Lee', field: 'Phone', mine: '+1 (415) 555-0198', server: '+1 (415) 555-0100', updatedBy: 'Maya Patel' },
]

export let tickets: SupportTicket[] = [
  {
    id: 'tkt-1042',
    orgId: 'org-nexus',
    subject: 'OCR low confidence on glossy cards',
    category: 'ocr',
    priority: 'high',
    status: 'open',
    requester: 'Maya Patel',
    assignee: 'Support Bot',
    createdAt: '2026-09-09T11:00:00Z',
    updatedAt: '2026-09-09T15:30:00Z',
    messages: [
      { id: 'm1', author: 'Maya Patel', body: 'Glossy laminate cards often need review. Can we improve preprocessing tips in the UI?', at: '2026-09-09T11:00:00Z' },
      { id: 'm2', author: 'Support Bot', body: 'Thanks — we recommend capturing at an angle to reduce glare. Sharing a short guide.', at: '2026-09-09T12:10:00Z' },
    ],
    history: [
      { id: 'h1', text: 'Created', at: '2026-09-09T11:00:00Z' },
      { id: 'h2', text: 'Assigned to Support Bot', at: '2026-09-09T11:01:00Z' },
      { id: 'h3', text: 'Reply added', at: '2026-09-09T12:10:00Z' },
    ],
  },
  {
    id: 'tkt-1038',
    orgId: 'org-nexus',
    subject: 'Invoice copy for August',
    category: 'billing',
    priority: 'medium',
    status: 'resolved',
    requester: 'Ava Chen',
    assignee: 'Billing Desk',
    createdAt: '2026-09-02T09:00:00Z',
    updatedAt: '2026-09-03T10:00:00Z',
    messages: [
      { id: 'm3', author: 'Ava Chen', body: 'Please resend August invoice PDF.', at: '2026-09-02T09:00:00Z' },
      { id: 'm4', author: 'Billing Desk', body: 'Sent to your billing contact. Marking resolved.', at: '2026-09-03T10:00:00Z' },
    ],
    history: [
      { id: 'h4', text: 'Created', at: '2026-09-02T09:00:00Z' },
      { id: 'h5', text: 'Status → Resolved', at: '2026-09-03T10:00:00Z' },
    ],
  },
]

export const invoices: Invoice[] = [
  { id: 'inv1', orgId: 'org-nexus', number: 'INV-2026-08', date: '2026-08-01', amount: 99, status: 'paid' },
  { id: 'inv2', orgId: 'org-nexus', number: 'INV-2026-09', date: '2026-09-01', amount: 99, status: 'paid' },
  { id: 'inv3', orgId: 'org-nexus', number: 'INV-2026-10', date: '2026-10-01', amount: 99, status: 'pending' },
]

export const billingTxns: BillingTxn[] = [
  { id: 'txn1', orgId: 'org-nexus', date: '2026-09-01', description: 'Business plan renewal', amount: 99, status: 'paid', method: 'Visa ••4242' },
  { id: 'txn2', orgId: 'org-nexus', date: '2026-08-01', description: 'Business plan renewal', amount: 99, status: 'paid', method: 'Visa ••4242' },
  { id: 'txn3', orgId: 'org-nexus', date: '2026-07-15', description: 'Upgrade Pro → Business', amount: 50, status: 'paid', method: 'Visa ••4242' },
]

export const orgPlan: Record<string, { planId: PlanId; nextBilling: string; usage: { cards: number; storage: number; users: number; ocr: number; email: number; whatsapp: number } }> = {
  'org-nexus': {
    planId: 'business',
    nextBilling: '2026-10-01',
    usage: { cards: 8200, storage: 42, users: 8, ocr: 7900, email: 4200, whatsapp: 1100 },
  },
  'org-atlas': {
    planId: 'pro',
    nextBilling: '2026-09-20',
    usage: { cards: 1440, storage: 8, users: 3, ocr: 1300, email: 400, whatsapp: 120 },
  },
}
