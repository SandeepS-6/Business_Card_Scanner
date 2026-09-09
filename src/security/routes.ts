import type { Permission } from '@/security/permissions'

export type AppRouteMeta = {
  path: string
  auth: boolean
  permission?: Permission
  /** SECURITY: Backend tenant isolation required — UI org context is not authorization. */
  tenantScoped?: boolean
}

export const APP_ROUTES: AppRouteMeta[] = [
  { path: '/login', auth: false },
  { path: '/', auth: true, permission: 'CAPTURE', tenantScoped: true },
  { path: '/capture', auth: true, permission: 'CAPTURE', tenantScoped: true },
  { path: '/review', auth: true, permission: 'REVIEW', tenantScoped: true },
  { path: '/contacts', auth: true, permission: 'CONTACTS_VIEW', tenantScoped: true },
  { path: '/contacts/:id', auth: true, permission: 'CONTACTS_VIEW', tenantScoped: true },
  { path: '/leads', auth: true, permission: 'LEADS_VIEW', tenantScoped: true },
  { path: '/events', auth: true, permission: 'EVENTS_VIEW', tenantScoped: true },
  { path: '/events/:id', auth: true, permission: 'EVENTS_VIEW', tenantScoped: true },
  { path: '/follow-ups', auth: true, permission: 'FOLLOW_UPS_VIEW', tenantScoped: true },
  { path: '/communications/email', auth: true, permission: 'COMMS_VIEW', tenantScoped: true },
  { path: '/communications/whatsapp', auth: true, permission: 'COMMS_VIEW', tenantScoped: true },
  { path: '/templates', auth: true, permission: 'TEMPLATES_VIEW', tenantScoped: true },
  { path: '/crm/integrations', auth: true, permission: 'CRM_VIEW', tenantScoped: true },
  { path: '/crm/sync', auth: true, permission: 'CRM_VIEW', tenantScoped: true },
  { path: '/offline-queue', auth: true, permission: 'OFFLINE_VIEW', tenantScoped: true },
  { path: '/sync-center', auth: true, permission: 'SYNC_CENTER_VIEW', tenantScoped: true },
  { path: '/team', auth: true, permission: 'TEAM_VIEW', tenantScoped: true },
  { path: '/presence', auth: true, permission: 'PRESENCE_VIEW', tenantScoped: true },
  { path: '/command-center', auth: true, permission: 'COMMAND_CENTER_VIEW', tenantScoped: true },
  { path: '/venue-map', auth: true, permission: 'VENUE_VIEW', tenantScoped: true },
  { path: '/automations', auth: true, permission: 'AUTOMATIONS_VIEW', tenantScoped: true },
  { path: '/automations/:id', auth: true, permission: 'AUTOMATIONS_VIEW', tenantScoped: true },
  { path: '/automations/new', auth: true, permission: 'AUTOMATIONS_MANAGE', tenantScoped: true },
  { path: '/recovery', auth: true, permission: 'RECOVERY_VIEW', tenantScoped: true },
  { path: '/versions', auth: true, permission: 'VERSIONS_VIEW', tenantScoped: true },
  { path: '/tickets', auth: true, permission: 'TICKETS_VIEW', tenantScoped: true },
  { path: '/tickets/:id', auth: true, permission: 'TICKETS_VIEW', tenantScoped: true },
  { path: '/billing', auth: true, permission: 'BILLING_VIEW', tenantScoped: true },
  { path: '/organization', auth: true, permission: 'ORG_VIEW', tenantScoped: true },
  { path: '/audit-logs', auth: true, permission: 'AUDIT_VIEW', tenantScoped: true },
  { path: '/settings', auth: true, permission: 'SETTINGS_VIEW', tenantScoped: true },
  { path: '/unauthorized', auth: true },
  { path: '/platform/organizations', auth: true, permission: 'SUPER_ADMIN_ACCESS' },
  { path: '/platform/organizations/:id', auth: true, permission: 'SUPER_ADMIN_ACCESS' },
  { path: '/platform/users', auth: true, permission: 'SUPER_ADMIN_ACCESS' },
  { path: '/platform/templates', auth: true, permission: 'SUPER_ADMIN_ACCESS' },
  { path: '/platform/integrations', auth: true, permission: 'SUPER_ADMIN_ACCESS' },
  { path: '/platform/usage', auth: true, permission: 'SUPER_ADMIN_ACCESS' },
  { path: '/platform/health', auth: true, permission: 'SUPER_ADMIN_ACCESS' },
  { path: '/platform/audit', auth: true, permission: 'SUPER_ADMIN_ACCESS' },
]

export function isPublicPath(pathname: string) {
  return pathname === '/login'
}
