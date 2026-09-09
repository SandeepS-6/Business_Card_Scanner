import {
  activities,
  auditLogs,
  chartSeries,
  communications,
  contacts,
  crmIntegrations,
  crmSyncItems,
  dashboardStats,
  events,
  followUps,
  leads,
  notifications,
  offlineQueue,
  organizations,
  systemHealth,
  templates,
  users,
  cardImg,
} from '@/data/mock'
import { automations, tickets } from '@/data/features-mock'
import { delay } from '@/lib/utils'
import type {
  Contact,
  OcrResult,
  Organization,
  Role,
  User,
} from '@/types'
import { canAccessArea } from '@/security/permissions'
import { mockAuth } from '@/security/mock-auth'

// ponytail: in-memory mutable copies; swap for API client when backend lands
let orgs = structuredClone(organizations)
let contactStore = structuredClone(contacts)
let queueStore = structuredClone(offlineQueue)
let notifStore = structuredClone(notifications)

/** @deprecated Prefer mockAuth — compatibility shim. */
export const authService = {
  async login(email: string, password: string) {
    const session = await mockAuth.login(email, password)
    return { user: session.user, token: session.mockSessionId }
  },
  demoUsers() {
    return mockAuth.demoUsers()
  },
}

export const orgService = {
  async list() {
    await delay(200)
    return orgs
  },
  async get(id: string) {
    await delay(150)
    return orgs.find((o) => o.id === id) ?? null
  },
  async update(id: string, patch: Partial<Organization>) {
    await delay(300)
    orgs = orgs.map((o) => (o.id === id ? { ...o, ...patch, branding: { ...o.branding, ...patch.branding } } : o))
    return orgs.find((o) => o.id === id)!
  },
}

export const userService = {
  async byOrg(orgId: string) {
    await delay(200)
    return users.filter((u) => u.orgId === orgId)
  },
  async platformUsers() {
    await delay(200)
    return users
  },
  get(id: string) {
    return users.find((u) => u.id === id)
  },
}

export const contactService = {
  async list(orgId: string) {
    await delay(250)
    return contactStore.filter((c) => c.orgId === orgId)
  },
  /** BACKEND REQUIRED: Server must verify org + ownership. Frontend filter is UX only. */
  async get(id: string, orgId?: string) {
    await delay(150)
    const c = contactStore.find((x) => x.id === id) ?? null
    if (!c) return null
    if (orgId && c.orgId !== orgId) return null
    return c
  },
  async create(contact: Contact) {
    await delay(300)
    contactStore = [contact, ...contactStore]
    return contact
  },
  async update(id: string, patch: Partial<Contact>) {
    await delay(250)
    contactStore = contactStore.map((c) => (c.id === id ? { ...c, ...patch } : c))
    return contactStore.find((c) => c.id === id)!
  },
  async findDuplicates(orgId: string, email: string, phone: string) {
    await delay(350)
    return contactStore.filter(
      (c) =>
        c.orgId === orgId &&
        (c.email.toLowerCase() === email.toLowerCase() || c.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')),
    )
  },
}

export const leadService = {
  async list(orgId: string) {
    await delay(200)
    return leads.filter((l) => l.orgId === orgId)
  },
}

export const eventService = {
  async list(orgId: string) {
    await delay(200)
    return events.filter((e) => e.orgId === orgId)
  },
  /** BACKEND REQUIRED: Server must verify org + ownership. Frontend filter is UX only. */
  async get(id: string, orgId?: string) {
    await delay(150)
    const e = events.find((x) => x.id === id) ?? null
    if (!e) return null
    if (orgId && e.orgId !== orgId) return null
    return e
  },
}

export const followUpService = {
  async list(orgId: string) {
    await delay(200)
    return followUps.filter((f) => f.orgId === orgId)
  },
}

export const templateService = {
  async list(orgId: string | null, includeGlobal = true) {
    await delay(200)
    return templates.filter(
      (t) => (orgId && t.orgId === orgId) || (includeGlobal && t.kind === 'global') || (!orgId && t.kind === 'global'),
    )
  },
}

export const commService = {
  async list(orgId: string) {
    await delay(200)
    return communications.filter((c) => c.orgId === orgId)
  },
}

export const crmService = {
  async integrations(orgId: string) {
    await delay(200)
    return crmIntegrations.filter((c) => c.orgId === orgId)
  },
  async syncStatus(orgId: string) {
    await delay(200)
    return crmSyncItems.filter((c) => c.orgId === orgId)
  },
}

export const queueService = {
  async list(orgId: string) {
    await delay(200)
    return queueStore.filter((q) => q.orgId === orgId)
  },
  pendingCount(orgId: string) {
    return queueStore.filter((q) => q.orgId === orgId && ['pending', 'failed', 'retrying', 'uploading'].includes(q.status)).length
  },
  async retry(id: string) {
    await delay(400)
    queueStore = queueStore.map((q) =>
      q.id === id ? { ...q, status: 'retrying' as const, retryCount: q.retryCount + 1 } : q,
    )
    return queueStore.find((q) => q.id === id)!
  },
}

export const notificationService = {
  async list(userId: string) {
    await delay(150)
    return notifStore.filter((n) => n.userId === userId)
  },
  async markRead(id: string) {
    notifStore = notifStore.map((n) => (n.id === id ? { ...n, read: true } : n))
  },
  async markAllRead(userId: string) {
    notifStore = notifStore.map((n) => (n.userId === userId ? { ...n, read: true } : n))
  },
}

export const auditService = {
  async list(orgId: string | null) {
    await delay(200)
    if (orgId === null) return auditLogs
    return auditLogs.filter((a) => a.orgId === orgId || a.orgId === null)
  },
}

export const activityService = {
  async forContact(contactId: string) {
    await delay(150)
    return activities.filter((a) => a.contactId === contactId)
  },
}

export const dashboardService = {
  async stats(orgId: string) {
    await delay(250)
    return dashboardStats[orgId] ?? dashboardStats['org-nexus']
  },
  charts() {
    return chartSeries
  },
}

export const healthService = {
  async list() {
    await delay(200)
    return systemHealth
  },
}

export const searchService = {
  async search(orgId: string | null, q: string) {
    await delay(180)
    const query = q.trim().toLowerCase()
    if (!query) {
      return {
        contacts: [],
        leads: [],
        events: [],
        users: [],
        templates: [],
        tickets: [],
        automations: [],
        organizations: [],
      }
    }
    const orgContacts = contactStore.filter(
      (c) => (!orgId || c.orgId === orgId) && `${c.fullName} ${c.company} ${c.email}`.toLowerCase().includes(query),
    )
    const orgEvents = events.filter((e) => (!orgId || e.orgId === orgId) && e.name.toLowerCase().includes(query))
    const orgUsers = users.filter(
      (u) =>
        (!orgId || u.orgId === orgId || u.role === 'super_admin') &&
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(query),
    )
    const orgTemplates = templates.filter(
      (t) => (t.orgId === orgId || t.kind === 'global') && t.name.toLowerCase().includes(query),
    )
    const orgLeads = leads.filter((l) => (!orgId || l.orgId === orgId) && orgContacts.some((c) => c.id === l.contactId))
    const orgTickets = tickets.filter(
      (t) => (!orgId || t.orgId === orgId) && `${t.id} ${t.subject} ${t.requester}`.toLowerCase().includes(query),
    )
    const orgAutos = automations.filter(
      (a) => (!orgId || a.orgId === orgId) && `${a.name} ${a.trigger}`.toLowerCase().includes(query),
    )
    const orgs = organizations.filter((o) => o.name.toLowerCase().includes(query) || o.slug.toLowerCase().includes(query))
    return {
      contacts: orgContacts.slice(0, 5),
      leads: orgLeads.slice(0, 5),
      events: orgEvents.slice(0, 5),
      users: orgUsers.slice(0, 5),
      templates: orgTemplates.slice(0, 5),
      tickets: orgTickets.slice(0, 5),
      automations: orgAutos.slice(0, 5),
      organizations: orgs.slice(0, 5),
    }
  },
}

export const ocrService = {
  async process(_imageDataUrl: string): Promise<OcrResult> {
    await delay(2800)
    return {
      imageUrl: _imageDataUrl || cardImg,
      fields: {
        firstName: { value: 'Jordan', confidence: 'high' },
        lastName: { value: 'Lee', confidence: 'high' },
        fullName: { value: 'Jordan Lee', confidence: 'high' },
        jobTitle: { value: 'VP Partnerships', confidence: 'medium' },
        company: { value: 'Brightwave Labs', confidence: 'high' },
        email: { value: 'jordan.lee@brightwave.io', confidence: 'high' },
        phone: { value: '+1 (415) 555-0198', confidence: 'medium' },
        altPhone: { value: '', confidence: 'low' },
        website: { value: 'www.brightwave.io', confidence: 'medium' },
        address: { value: '88 Spear St', confidence: 'low' },
        city: { value: 'San Francisco', confidence: 'medium' },
        state: { value: 'CA', confidence: 'high' },
        country: { value: 'USA', confidence: 'high' },
        postalCode: { value: '94105', confidence: 'low' },
        linkedin: { value: '', confidence: 'low' },
        notes: { value: '', confidence: 'low' },
      },
    }
  },
}

export function canAccess(role: Role, area: string) {
  return canAccessArea(role, area)
}

export type { User, Organization }
