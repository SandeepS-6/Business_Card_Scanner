import type { ThemeMode } from '@/types'
import type { SessionUser } from '@/security/auth-types'

const SESSION_KEY = 'bcs-demo-session'
const OCR_RESULT_KEY = 'bcs-ocr-result'
const OCR_META_KEY = 'bcs-ocr-meta'
const INSTALL_DISMISS_KEY = 'bcs-install-dismissed'

export type PersistedSession = {
  user: SessionUser
  /** Mock session marker only — never a real credential. */
  mockSessionId: string
  orgId?: string
  themeMode?: ThemeMode
}

/** SECURITY: localStorage is not a secure vault. Persist only non-secret demo session UX state. */
export const secureStorage = {
  readSession(): PersistedSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as PersistedSession & { token?: string; user?: SessionUser & { password?: string } }
      if (!parsed?.user?.id) return null
      const { password: _pw, ...safeUser } = parsed.user as SessionUser & { password?: string }
      return {
        user: safeUser,
        mockSessionId: parsed.mockSessionId ?? parsed.token ?? `mock-session-${safeUser.id}`,
        orgId: parsed.orgId,
        themeMode: parsed.themeMode,
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
  },
  writeSession(session: PersistedSession) {
    const { password: _pw, ...user } = session.user as SessionUser & { password?: string }
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user }))
  },
  clearSession() {
    localStorage.removeItem(SESSION_KEY)
  },
  setOcrDraft(result: string, meta: string) {
    // SECURITY: OCR drafts may contain PII — clear on logout; backend must authorize reads.
    sessionStorage.setItem(OCR_RESULT_KEY, result)
    sessionStorage.setItem(OCR_META_KEY, meta)
  },
  getOcrResult() {
    return sessionStorage.getItem(OCR_RESULT_KEY)
  },
  clearOcrDraft() {
    sessionStorage.removeItem(OCR_RESULT_KEY)
    sessionStorage.removeItem(OCR_META_KEY)
  },
  clearAuthArtifacts() {
    this.clearSession()
    this.clearOcrDraft()
  },
  installDismissed: {
    get: () => localStorage.getItem(INSTALL_DISMISS_KEY) === '1',
    set: () => localStorage.setItem(INSTALL_DISMISS_KEY, '1'),
  },
}
