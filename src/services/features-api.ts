import { delay } from '@/lib/utils'
import {
  automationRuns as seedRuns,
  automations as seedAutomations,
  billingTxns,
  contentVersions,
  deletedItems as seedDeleted,
  invoices,
  liveActivities as seedActivities,
  orgPlan,
  plans,
  presence as seedPresence,
  syncConflicts as seedConflicts,
  syncRecords as seedSync,
  tickets as seedTickets,
  venueBooths,
} from '@/data/features-mock'
import type { AutomationRule, SupportTicket } from '@/types/features'

// ponytail: mutable in-memory mock stores — swap for real API later
let deletedItems = structuredClone(seedDeleted)
let automations = structuredClone(seedAutomations)
let liveActivities = structuredClone(seedActivities)
let syncRecords = structuredClone(seedSync)
let syncConflicts = structuredClone(seedConflicts)
let tickets = structuredClone(seedTickets)
let presence = structuredClone(seedPresence)

export const recoveryService = {
  async list(orgId: string) {
    await delay(200)
    return deletedItems.filter((d) => d.orgId === orgId)
  },
  async restore(id: string) {
    await delay(300)
    const item = deletedItems.find((d) => d.id === id)
    deletedItems = deletedItems.filter((d) => d.id !== id)
    return item
  },
  async purge(id: string) {
    await delay(300)
    deletedItems = deletedItems.filter((d) => d.id !== id)
  },
}

export const versionService = {
  async list(resourceId?: string) {
    await delay(150)
    return resourceId ? contentVersions.filter((v) => v.resourceId === resourceId) : contentVersions
  },
}

export const automationService = {
  async list(orgId: string) {
    await delay(200)
    return automations.filter((a) => a.orgId === orgId)
  },
  /** BACKEND REQUIRED: Server must verify org + ownership. Frontend filter is UX only. */
  async get(id: string, orgId?: string) {
    await delay(120)
    const a = automations.find((x) => x.id === id) ?? null
    if (!a) return null
    if (orgId && a.orgId !== orgId) return null
    return a
  },
  async save(rule: AutomationRule) {
    await delay(250)
    const i = automations.findIndex((a) => a.id === rule.id)
    if (i >= 0) automations[i] = rule
    else automations.unshift(rule)
    return rule
  },
  async setStatus(id: string, status: AutomationRule['status']) {
    await delay(200)
    automations = automations.map((a) =>
      a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a,
    )
  },
  async runs(automationId: string) {
    await delay(150)
    return seedRuns.filter((r) => r.automationId === automationId)
  },
}

export const commandCenterService = {
  async kpis(eventId: string) {
    await delay(150)
    void eventId
    return {
      cardsScanned: 312,
      contacts: 286,
      leads: 198,
      qualified: 74,
      followUps: 12,
      teamActive: 3,
      sync: 'synced' as const,
    }
  },
  async activity(orgId: string, eventId: string) {
    await delay(120)
    return liveActivities.filter((a) => a.orgId === orgId && a.eventId === eventId)
  },
  async pushMockActivity(orgId: string, eventId: string) {
    const item = {
      id: `la-${Date.now()}`,
      orgId,
      eventId,
      text: 'Mock live update: card scanned',
      at: new Date().toISOString(),
      kind: 'scan' as const,
    }
    liveActivities = [item, ...liveActivities].slice(0, 20)
    return item
  },
}

export const venueService = {
  async booths() {
    await delay(100)
    return venueBooths
  },
}

export const presenceService = {
  async list(orgId: string) {
    await delay(150)
    return presence.filter((p) => p.orgId === orgId)
  },
}

export const syncCenterService = {
  async list(orgId: string) {
    await delay(180)
    return syncRecords.filter((s) => s.orgId === orgId)
  },
  async conflicts(orgId: string) {
    await delay(120)
    return syncConflicts.filter((c) => c.orgId === orgId)
  },
  async resolveConflict(id: string, _choice: 'mine' | 'server') {
    await delay(250)
    void _choice
    syncConflicts = syncConflicts.filter((c) => c.id !== id)
  },
  async retry(id: string) {
    await delay(300)
    syncRecords = syncRecords.map((s) =>
      s.id === id ? { ...s, status: 'retrying' as const, retryCount: s.retryCount + 1 } : s,
    )
  },
  async remove(id: string) {
    await delay(200)
    syncRecords = syncRecords.filter((s) => s.id !== id)
  },
}

export const ticketService = {
  async list(orgId: string) {
    await delay(200)
    return tickets.filter((t) => t.orgId === orgId)
  },
  /**
   * BACKEND REQUIRED: Server must verify org + ownership and strip internal notes for non-staff.
   * Frontend `includeInternal` is UX-only filtering.
   */
  async get(id: string, orgId?: string, includeInternal = false) {
    await delay(120)
    const t = tickets.find((x) => x.id === id) ?? null
    if (!t) return null
    if (orgId && t.orgId !== orgId) return null
    if (includeInternal) return t
    return {
      ...t,
      messages: t.messages.filter((m) => !m.internal),
    }
  },
  async create(partial: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages' | 'history'>) {
    await delay(300)
    const t: SupportTicket = {
      ...partial,
      id: `tkt-${1000 + tickets.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      history: [{ id: `h-${Date.now()}`, text: 'Created', at: new Date().toISOString() }],
    }
    tickets = [t, ...tickets]
    return t
  },
  /** BACKEND REQUIRED: Only staff may create internal notes; enforce server-side. */
  async reply(id: string, author: string, body: string, internal?: boolean, allowInternal = false) {
    await delay(250)
    const asInternal = !!internal && allowInternal
    tickets = tickets.map((t) =>
      t.id === id
        ? {
            ...t,
            updatedAt: new Date().toISOString(),
            messages: [
              ...t.messages,
              { id: `m-${Date.now()}`, author, body, at: new Date().toISOString(), internal: asInternal },
            ],
            history: [
              ...t.history,
              {
                id: `h-${Date.now()}`,
                text: asInternal ? 'Internal note' : 'Reply added',
                at: new Date().toISOString(),
              },
            ],
          }
        : t,
    )
  },
  async update(id: string, patch: Partial<SupportTicket>) {
    await delay(200)
    tickets = tickets.map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
    )
  },
}

export const billingService = {
  async plans() {
    await delay(100)
    return plans
  },
  async current(orgId: string) {
    await delay(150)
    return orgPlan[orgId] ?? orgPlan['org-nexus']
  },
  async invoices(orgId: string) {
    await delay(150)
    return invoices.filter((i) => i.orgId === orgId)
  },
  async transactions(orgId: string) {
    await delay(150)
    return billingTxns.filter((t) => t.orgId === orgId)
  },
  async setPlan(orgId: string, planId: (typeof plans)[number]['id']) {
    await delay(400)
    orgPlan[orgId] = { ...(orgPlan[orgId] ?? orgPlan['org-nexus']), planId }
  },
}
