import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { RequireAuth, RequirePermission } from '@/components/security/protected-route'
import { UnauthorizedPage } from '@/components/security/unauthorized-page'
import { SecurityErrorBoundary } from '@/components/security/security-error-boundary'
import { SessionExpiredDialog } from '@/components/security/session-expired-dialog'
import { LoginPage } from '@/pages/login'
import { HomePage } from '@/pages/home'
import { CapturePage } from '@/pages/capture'
import { ReviewPage } from '@/pages/review'
import { ContactsPage } from '@/pages/contacts'
import { ContactDetailPage } from '@/pages/contact-detail'
import { LeadsPage } from '@/pages/leads'
import { EventsPage, EventDetailPage } from '@/pages/events'
import { FollowUpsPage } from '@/pages/follow-ups'
import { EmailCommsPage, WhatsAppCommsPage, TemplatesPage } from '@/pages/communications'
import { CrmIntegrationsPage, CrmSyncPage } from '@/pages/crm'
import { OfflineQueuePage } from '@/pages/offline-queue'
import { TeamPage } from '@/pages/team'
import { OrganizationPage } from '@/pages/organization'
import { AuditLogsPage } from '@/pages/audit-logs'
import { SettingsPage } from '@/pages/settings'
import { RecoveryPage } from '@/pages/recovery'
import { VersionsPage } from '@/pages/versions'
import { AutomationsPage, AutomationBuilderPage } from '@/pages/automations'
import { CommandCenterPage } from '@/pages/command-center'
import { VenueMapPage } from '@/pages/venue-map'
import { PresencePage } from '@/pages/presence'
import { SyncCenterPage } from '@/pages/sync-center'
import { TicketsPage, TicketDetailPage } from '@/pages/tickets'
import { BillingPage } from '@/pages/billing'
import {
  PlatformOrganizationsPage,
  PlatformOrgDetailPage,
  PlatformUsersPage,
  PlatformUsagePage,
  SystemHealthPage,
  PlatformIntegrationsPage,
} from '@/pages/platform'

export function AppRouter() {
  return (
    <SecurityErrorBoundary>
      <SessionExpiredDialog />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="unauthorized" element={<UnauthorizedPage />} />
            <Route index element={<HomePage />} />
            <Route path="capture" element={<CapturePage />} />
            <Route element={<RequirePermission permission="REVIEW" />}>
              <Route path="review" element={<ReviewPage />} />
            </Route>
            <Route element={<RequirePermission permission="CONTACTS_VIEW" />}>
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="contacts/:id" element={<ContactDetailPage />} />
            </Route>
            <Route element={<RequirePermission permission="LEADS_VIEW" />}>
              <Route path="leads" element={<LeadsPage />} />
            </Route>
            <Route element={<RequirePermission permission="EVENTS_VIEW" />}>
              <Route path="events" element={<EventsPage />} />
              <Route path="events/:id" element={<EventDetailPage />} />
            </Route>
            <Route element={<RequirePermission permission="FOLLOW_UPS_VIEW" />}>
              <Route path="follow-ups" element={<FollowUpsPage />} />
            </Route>
            <Route element={<RequirePermission permission="COMMS_VIEW" />}>
              <Route path="communications/email" element={<EmailCommsPage />} />
              <Route path="communications/whatsapp" element={<WhatsAppCommsPage />} />
            </Route>
            <Route element={<RequirePermission permission="TEMPLATES_VIEW" />}>
              <Route path="templates" element={<TemplatesPage />} />
            </Route>
            <Route element={<RequirePermission permission="CRM_VIEW" />}>
              <Route path="crm/integrations" element={<CrmIntegrationsPage />} />
              <Route path="crm/sync" element={<CrmSyncPage />} />
            </Route>
            <Route element={<RequirePermission permission="COMMAND_CENTER_VIEW" />}>
              <Route path="command-center" element={<CommandCenterPage />} />
            </Route>
            <Route element={<RequirePermission permission="VENUE_VIEW" />}>
              <Route path="venue-map" element={<VenueMapPage />} />
            </Route>
            <Route element={<RequirePermission permission="PRESENCE_VIEW" />}>
              <Route path="presence" element={<PresencePage />} />
            </Route>
            <Route element={<RequirePermission permission="SYNC_CENTER_VIEW" />}>
              <Route path="sync-center" element={<SyncCenterPage />} />
            </Route>
            <Route element={<RequirePermission permission="AUTOMATIONS_VIEW" />}>
              <Route path="automations" element={<AutomationsPage />} />
              <Route path="automations/new" element={<AutomationBuilderPage />} />
              <Route path="automations/:id" element={<AutomationBuilderPage />} />
            </Route>
            <Route element={<RequirePermission permission="RECOVERY_VIEW" />}>
              <Route path="recovery" element={<RecoveryPage />} />
            </Route>
            <Route element={<RequirePermission permission="VERSIONS_VIEW" />}>
              <Route path="versions" element={<VersionsPage />} />
            </Route>
            <Route element={<RequirePermission permission="TICKETS_VIEW" />}>
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="tickets/:id" element={<TicketDetailPage />} />
            </Route>
            <Route element={<RequirePermission permission="BILLING_VIEW" />}>
              <Route path="billing" element={<BillingPage />} />
            </Route>
            <Route element={<RequirePermission permission="TEAM_VIEW" />}>
              <Route path="team" element={<TeamPage />} />
            </Route>
            <Route element={<RequirePermission permission="ORG_VIEW" />}>
              <Route path="organization" element={<OrganizationPage />} />
            </Route>
            <Route element={<RequirePermission permission="AUDIT_VIEW" />}>
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>
            <Route element={<RequirePermission permission="OFFLINE_VIEW" />}>
              <Route path="offline-queue" element={<OfflineQueuePage />} />
            </Route>
            <Route element={<RequirePermission permission="SETTINGS_VIEW" />}>
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            {/* SECURITY: Backend authorization required for all platform operations. */}
            <Route element={<RequirePermission permission="SUPER_ADMIN_ACCESS" />}>
              <Route path="platform/organizations" element={<PlatformOrganizationsPage />} />
              <Route path="platform/organizations/:id" element={<PlatformOrgDetailPage />} />
              <Route path="platform/users" element={<PlatformUsersPage />} />
              <Route path="platform/templates" element={<TemplatesPage globalOnly />} />
              <Route path="platform/integrations" element={<PlatformIntegrationsPage />} />
              <Route path="platform/usage" element={<PlatformUsagePage />} />
              <Route path="platform/health" element={<SystemHealthPage />} />
              <Route path="platform/audit" element={<AuditLogsPage platform />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </SecurityErrorBoundary>
  )
}
