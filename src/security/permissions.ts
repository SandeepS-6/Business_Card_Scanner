import type { Role } from '@/types'

/** Fine-grained UI permissions. Backend must re-check every action. */
export type Permission =
  | 'CONTACTS_VIEW'
  | 'CONTACTS_CREATE'
  | 'CONTACTS_EDIT'
  | 'CONTACTS_DELETE'
  | 'LEADS_VIEW'
  | 'LEADS_EDIT'
  | 'EVENTS_VIEW'
  | 'EVENTS_CREATE'
  | 'EVENTS_EDIT'
  | 'FOLLOW_UPS_VIEW'
  | 'FOLLOW_UPS_CREATE'
  | 'COMMS_VIEW'
  | 'TEMPLATES_VIEW'
  | 'CRM_VIEW'
  | 'CRM_MANAGE'
  | 'OFFLINE_VIEW'
  | 'TEAM_VIEW'
  | 'TEAM_MANAGE'
  | 'ORG_VIEW'
  | 'ORG_MANAGE'
  | 'AUDIT_VIEW'
  | 'SETTINGS_VIEW'
  | 'SETTINGS_MANAGE'
  | 'CMS_VIEW'
  | 'CMS_MANAGE'
  | 'SUPER_ADMIN_ACCESS'
  | 'CAPTURE'
  | 'REVIEW'
  | 'RECOVERY_VIEW'
  | 'AUTOMATIONS_VIEW'
  | 'AUTOMATIONS_MANAGE'
  | 'COMMAND_CENTER_VIEW'
  | 'VENUE_VIEW'
  | 'PRESENCE_VIEW'
  | 'SYNC_CENTER_VIEW'
  | 'TICKETS_VIEW'
  | 'TICKETS_MANAGE'
  | 'BILLING_VIEW'
  | 'BILLING_MANAGE'
  | 'VERSIONS_VIEW'

const ALL: Permission[] = [
  'CONTACTS_VIEW',
  'CONTACTS_CREATE',
  'CONTACTS_EDIT',
  'CONTACTS_DELETE',
  'LEADS_VIEW',
  'LEADS_EDIT',
  'EVENTS_VIEW',
  'EVENTS_CREATE',
  'EVENTS_EDIT',
  'FOLLOW_UPS_VIEW',
  'FOLLOW_UPS_CREATE',
  'COMMS_VIEW',
  'TEMPLATES_VIEW',
  'CRM_VIEW',
  'CRM_MANAGE',
  'OFFLINE_VIEW',
  'TEAM_VIEW',
  'TEAM_MANAGE',
  'ORG_VIEW',
  'ORG_MANAGE',
  'AUDIT_VIEW',
  'SETTINGS_VIEW',
  'SETTINGS_MANAGE',
  'CMS_VIEW',
  'CMS_MANAGE',
  'SUPER_ADMIN_ACCESS',
  'CAPTURE',
  'REVIEW',
  'RECOVERY_VIEW',
  'AUTOMATIONS_VIEW',
  'AUTOMATIONS_MANAGE',
  'COMMAND_CENTER_VIEW',
  'VENUE_VIEW',
  'PRESENCE_VIEW',
  'SYNC_CENTER_VIEW',
  'TICKETS_VIEW',
  'TICKETS_MANAGE',
  'BILLING_VIEW',
  'BILLING_MANAGE',
  'VERSIONS_VIEW',
]

const USER_PERMS: Permission[] = [
  'CONTACTS_VIEW',
  'CONTACTS_CREATE',
  'CONTACTS_EDIT',
  'LEADS_VIEW',
  'LEADS_EDIT',
  'EVENTS_VIEW',
  'FOLLOW_UPS_VIEW',
  'FOLLOW_UPS_CREATE',
  'COMMS_VIEW',
  'TEMPLATES_VIEW',
  'OFFLINE_VIEW',
  'SETTINGS_VIEW',
  'CAPTURE',
  'REVIEW',
  'COMMAND_CENTER_VIEW',
  'VENUE_VIEW',
  'PRESENCE_VIEW',
  'SYNC_CENTER_VIEW',
  'TICKETS_VIEW',
]

const ADMIN_PERMS: Permission[] = USER_PERMS.concat([
  'CONTACTS_DELETE',
  'EVENTS_CREATE',
  'EVENTS_EDIT',
  'CRM_VIEW',
  'CRM_MANAGE',
  'TEAM_VIEW',
  'TEAM_MANAGE',
  'ORG_VIEW',
  'ORG_MANAGE',
  'AUDIT_VIEW',
  'SETTINGS_MANAGE',
  'CMS_VIEW',
  'CMS_MANAGE',
  'RECOVERY_VIEW',
  'AUTOMATIONS_VIEW',
  'AUTOMATIONS_MANAGE',
  'BILLING_VIEW',
  'BILLING_MANAGE',
  'VERSIONS_VIEW',
  'TICKETS_MANAGE',
])

const ROLE_PERMS: Record<Role, Permission[]> = {
  user: USER_PERMS,
  org_admin: ADMIN_PERMS,
  super_admin: ALL,
}

/** SECURITY: Frontend UX only — backend authorization required. */
export function permissionsFor(role: Role | null | undefined): Permission[] {
  if (!role) return []
  return ROLE_PERMS[role]
}

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return permissionsFor(role).includes(permission)
}

export function hasRole(role: Role | null | undefined, allowed: Role[]): boolean {
  return !!role && allowed.includes(role)
}

/** Legacy area helper used by sidebar — prefer `can()`. */
export function canAccessArea(role: Role, area: string): boolean {
  if (role === 'super_admin') return true
  if (area.startsWith('platform.')) return false
  if (role === 'org_admin') return true
  const map: Record<string, Permission> = {
    dashboard: 'CAPTURE',
    home: 'CAPTURE',
    capture: 'CAPTURE',
    contacts: 'CONTACTS_VIEW',
    leads: 'LEADS_VIEW',
    events: 'EVENTS_VIEW',
    'follow-ups': 'FOLLOW_UPS_VIEW',
    followups: 'FOLLOW_UPS_VIEW',
    email: 'COMMS_VIEW',
    whatsapp: 'COMMS_VIEW',
    templates: 'TEMPLATES_VIEW',
    crm: 'CRM_VIEW',
    offline: 'OFFLINE_VIEW',
    team: 'TEAM_VIEW',
    organization: 'ORG_VIEW',
    audit: 'AUDIT_VIEW',
    settings: 'SETTINGS_VIEW',
    recovery: 'RECOVERY_VIEW',
    automations: 'AUTOMATIONS_VIEW',
    'command-center': 'COMMAND_CENTER_VIEW',
    venue: 'VENUE_VIEW',
    presence: 'PRESENCE_VIEW',
    sync: 'SYNC_CENTER_VIEW',
    tickets: 'TICKETS_VIEW',
    billing: 'BILLING_VIEW',
    versions: 'VERSIONS_VIEW',
  }
  const perm = map[area]
  return perm ? can(role, perm) : false
}
