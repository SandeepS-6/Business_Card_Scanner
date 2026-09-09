export type Role = 'super_admin' | 'org_admin' | 'user'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'interested' | 'converted' | 'lost'
export type LeadQuality = 'hot' | 'warm' | 'cold'
export type EventStatus = 'upcoming' | 'active' | 'completed' | 'archived'
export type FollowUpChannel = 'email' | 'whatsapp' | 'phone' | 'meeting' | 'other'
export type FollowUpStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
export type Confidence = 'high' | 'medium' | 'low'
export type QueueStatus = 'pending' | 'uploading' | 'processing' | 'review_required' | 'synced' | 'failed' | 'retrying'
export type SyncStatus = 'synced' | 'pending' | 'failed' | 'retrying'
export type HealthStatus = 'operational' | 'degraded' | 'down'
export type TemplateKind = 'global' | 'organization'
export type ThemeMode = 'light' | 'dark' | 'system'
export type FieldType = 'text' | 'number' | 'dropdown' | 'multi_select' | 'date' | 'checkbox'
export type NotificationType =
  | 'system'
  | 'lead'
  | 'follow_up'
  | 'ocr'
  | 'crm'
  | 'communication'
  | 'team'
  | 'ticket'
  | 'automation'
  | 'sync'
  | 'event'
  | 'billing'
  | 'cms'
  | 'recovery'
export type CommStatus = 'sent' | 'scheduled' | 'draft' | 'failed'

export interface Branding {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  borderRadius: string
  logoUrl: string
  faviconUrl: string
  loginImageUrl: string
  dashboardImageUrl: string
  emailBrandImageUrl: string
  sidebarStyle: 'dark' | 'light' | 'brand'
}

export interface Organization {
  id: string
  name: string
  slug: string
  status: 'active' | 'suspended'
  website: string
  email: string
  phone: string
  address: string
  description: string
  plan: string
  createdAt: string
  branding: Branding
  social: { linkedin?: string; twitter?: string; facebook?: string }
  usage: UsageMetrics
  usersCount: number
}

export interface UsageMetrics {
  cardsMonth: number
  cardsLimit: number
  ocrUsage: number
  ocrLimit: number
  storageGb: number
  storageLimit: number
  users: number
  usersLimit: number
  events: number
  eventsLimit: number
  emails: number
  emailsLimit: number
  whatsapp: number
  whatsappLimit: number
  crmSync: number
  crmSyncLimit: number
}

export interface User {
  id: string
  orgId: string | null
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: Role
  status: 'active' | 'invited' | 'inactive'
  lastActive: string
  avatarUrl?: string
  eventIds: string[]
}

export interface Contact {
  id: string
  orgId: string
  firstName: string
  lastName: string
  fullName: string
  jobTitle: string
  company: string
  email: string
  phone: string
  altPhone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  linkedin?: string
  notes?: string
  eventId?: string
  leadStatus: LeadStatus
  leadQuality: LeadQuality
  ownerId: string
  tags: string[]
  source: string
  cardImageUrl?: string
  lastActivity: string
  createdAt: string
  customFields?: Record<string, string | number | boolean | string[]>
}

export interface Lead {
  id: string
  orgId: string
  contactId: string
  eventId?: string
  ownerId: string
  status: LeadStatus
  quality: LeadQuality
  lastActivity: string
  nextFollowUp?: string
}

export interface CustomField {
  id: string
  eventId: string
  label: string
  type: FieldType
  required: boolean
  options?: string[]
  order: number
}

export interface Event {
  id: string
  orgId: string
  name: string
  description: string
  startDate: string
  endDate: string
  location: string
  ownerId: string
  teamIds: string[]
  status: EventStatus
  cardsScanned: number
  contactsCount: number
  leadsCount: number
  customFields: CustomField[]
}

export interface FollowUp {
  id: string
  orgId: string
  contactId: string
  leadId?: string
  eventId?: string
  assignedUserId: string
  dueDate: string
  channel: FollowUpChannel
  status: FollowUpStatus
  notes?: string
}

export interface Template {
  id: string
  orgId: string | null
  kind: TemplateKind
  channel: 'email' | 'whatsapp'
  name: string
  category: string
  status: 'active' | 'draft' | 'archived' | 'pending_approval'
  language?: string
  subject?: string
  body: string
  variables: string[]
  createdBy: string
  updatedAt: string
}

export interface Communication {
  id: string
  orgId: string
  channel: 'email' | 'whatsapp'
  contactId: string
  templateId?: string
  subject?: string
  body: string
  status: CommStatus
  scheduledAt?: string
  sentAt?: string
  error?: string
}

export interface CrmIntegration {
  id: string
  orgId: string
  provider: 'hubspot' | 'salesforce' | 'zoho' | 'rest'
  connected: boolean
  lastSync?: string
  recordsSynced: number
}

export interface CrmSyncItem {
  id: string
  orgId: string
  provider: string
  resource: string
  status: SyncStatus
  error?: string
  updatedAt: string
}

export interface OfflineQueueItem {
  id: string
  orgId: string
  cardLabel: string
  eventId?: string
  createdAt: string
  status: QueueStatus
  retryCount: number
  error?: string
  imageUrl?: string
}

export interface NotificationItem {
  id: string
  orgId: string | null
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  priority: 'low' | 'normal' | 'high'
  createdAt: string
}

export interface AuditLog {
  id: string
  orgId: string | null
  userId: string
  action: string
  resource: string
  result: 'success' | 'failure'
  ip: string
  createdAt: string
}

export interface ActivityItem {
  id: string
  contactId: string
  type: string
  description: string
  createdAt: string
  userId?: string
}

export interface OcrField<T = string> {
  value: T
  confidence: Confidence
}

export interface OcrResult {
  fields: {
    firstName: OcrField
    lastName: OcrField
    fullName: OcrField
    jobTitle: OcrField
    company: OcrField
    email: OcrField
    phone: OcrField
    altPhone: OcrField
    website: OcrField
    address: OcrField
    city: OcrField
    state: OcrField
    country: OcrField
    postalCode: OcrField
    linkedin: OcrField
    notes: OcrField
  }
  imageUrl: string
  backImageUrl?: string
}

export interface SystemHealthItem {
  name: string
  status: HealthStatus
  responseMs: number
  errorRate: number
  lastChecked: string
}

export interface DashboardStats {
  cardsScanned: number
  contactsCreated: number
  leads: number
  qualifiedLeads: number
  followUpsPending: number
  hotLeads: number
  ocrSuccessRate: number
  duplicateRate: number
}
