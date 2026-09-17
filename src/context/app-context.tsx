import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { orgService } from '@/services/api'
import { mockAuth } from '@/security/mock-auth'
import { secureStorage } from '@/security/storage'
import { queryClient } from '@/lib/query-client'
import { useAppSelector } from '@/store/hooks'
import type { AuthStatus, SessionUser } from '@/security/auth-types'
import type { Branding, Event, Organization } from '@/types'
import { toUserErrorMessage } from '@/security/api-errors'

interface AppState {
  authStatus: AuthStatus
  user: SessionUser | null
  /** Mock session marker — not a real credential. */
  mockSessionId: string | null
  organization: Organization | null
  organizations: Organization[]
  selectedEventId: string | null
  offline: boolean
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  authError: string | null
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  logout: () => void
  expireSession: () => void
  acknowledgeSessionExpired: () => void
  setOrganizationId: (id: string) => Promise<void>
  updateBranding: (branding: Partial<Branding>) => Promise<void>
  setSelectedEventId: (id: string | null) => void
  setOffline: (v: boolean) => void
  setSidebarCollapsed: (v: boolean) => void
  setMobileNavOpen: (v: boolean) => void
}

const AppContext = createContext<AppState | null>(null)

/** Brand CSS vars only — light/dark class is owned by Redux ThemeSync. */
function applyBranding(branding: Branding) {
  const root = document.documentElement
  const dark = root.classList.contains('dark')
  root.style.setProperty('--primary', branding.primaryColor)
  root.style.setProperty('--ring', branding.primaryColor)
  root.style.setProperty('--radius', branding.borderRadius)
  if (!dark) {
    root.style.setProperty('--background', branding.backgroundColor)
    root.style.setProperty('--foreground', branding.textColor)
    root.style.setProperty('--accent', branding.accentColor)
  } else {
    root.style.removeProperty('--background')
    root.style.removeProperty('--foreground')
    root.style.removeProperty('--accent')
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('AUTHENTICATING')
  const [user, setUser] = useState<SessionUser | null>(null)
  const [mockSessionId, setMockSessionId] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>('evt-tech-expo')
  const [offline, setOffline] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const theme = useAppSelector((s) => s.theme.theme)

  useEffect(() => {
    const session = secureStorage.readSession()
    if (!session) {
      setAuthStatus('UNAUTHENTICATED')
      return
    }
    setUser(session.user)
    setMockSessionId(session.mockSessionId)
    void orgService
      .list()
      .then((list) => {
        setOrganizations(list)
        const orgId = session.orgId ?? session.user.orgId ?? list[0]?.id
        // SECURITY: Backend tenant isolation required — UI org pick is not authorization.
        const org = list.find((o) => o.id === orgId) ?? list[0] ?? null
        setOrganization(org)
        setAuthStatus('AUTHENTICATED')
      })
      .catch(() => {
        secureStorage.clearAuthArtifacts()
        setUser(null)
        setMockSessionId(null)
        setAuthStatus('AUTH_ERROR')
        setAuthError('Could not restore session')
      })
  }, [])

  useEffect(() => {
    if (organization) applyBranding(organization.branding)
  }, [organization, theme])

  const persist = useCallback((next: { user: SessionUser; mockSessionId: string; orgId?: string }) => {
    secureStorage.writeSession(next)
  }, [])

  const login = useCallback(
    async (email: string, password: string, remember = true) => {
      setAuthError(null)
      try {
        const res = await mockAuth.login(email, password)
        const list = await orgService.list()
        setOrganizations(list)
        const org =
          list.find((o) => o.id === res.user.orgId) ?? (res.user.role === 'super_admin' ? list[0] : null) ?? null
        setUser(res.user)
        setMockSessionId(res.mockSessionId)
        setOrganization(org)
        setAuthStatus('AUTHENTICATED')
        if (remember) {
          persist({ user: res.user, mockSessionId: res.mockSessionId, orgId: org?.id })
        } else {
          secureStorage.clearSession()
        }
      } catch (e) {
        setAuthStatus('UNAUTHENTICATED')
        setAuthError(toUserErrorMessage(e))
        throw e
      }
    },
    [persist],
  )

  const logout = useCallback(() => {
    setAuthStatus('LOGGING_OUT')
    setUser(null)
    setMockSessionId(null)
    setOrganization(null)
    setSelectedEventId(null)
    secureStorage.clearAuthArtifacts()
    queryClient.clear()
    setAuthStatus('UNAUTHENTICATED')
  }, [])

  const expireSession = useCallback(() => {
    // SECURITY: Triggered by future 401 handling — clears client artifacts.
    setUser(null)
    setMockSessionId(null)
    setOrganization(null)
    secureStorage.clearAuthArtifacts()
    queryClient.clear()
    setAuthStatus('SESSION_EXPIRED')
  }, [])

  const acknowledgeSessionExpired = useCallback(() => {
    setAuthStatus('UNAUTHENTICATED')
  }, [])

  const setOrganizationId = useCallback(
    async (id: string) => {
      // SECURITY: Backend must verify the caller may access this tenant.
      if (user?.role !== 'super_admin' && user?.orgId && user.orgId !== id) {
        return
      }
      const org = await orgService.get(id)
      if (!org) return
      setOrganization(org)
      queryClient.clear()
      if (user && mockSessionId) persist({ user, mockSessionId, orgId: id })
    },
    [persist, mockSessionId, user],
  )

  const updateBranding = useCallback(
    async (branding: Partial<Branding>) => {
      if (!organization) return
      const updated = await orgService.update(organization.id, { branding: { ...organization.branding, ...branding } })
      setOrganization(updated)
      setOrganizations((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    },
    [organization],
  )

  const value = useMemo<AppState>(
    () => ({
      authStatus,
      user,
      mockSessionId,
      organization,
      organizations,
      selectedEventId,
      offline,
      sidebarCollapsed,
      mobileNavOpen,
      authError,
      login,
      logout,
      expireSession,
      acknowledgeSessionExpired,
      setOrganizationId,
      updateBranding,
      setSelectedEventId,
      setOffline,
      setSidebarCollapsed,
      setMobileNavOpen,
    }),
    [
      authStatus,
      user,
      mockSessionId,
      organization,
      organizations,
      selectedEventId,
      offline,
      sidebarCollapsed,
      mobileNavOpen,
      authError,
      login,
      logout,
      expireSession,
      acknowledgeSessionExpired,
      setOrganizationId,
      updateBranding,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export type { Event }
