import { users } from '@/data/mock'
import { delay } from '@/lib/utils'
import type { AuthSession, SessionUser } from '@/security/auth-types'

function toSessionUser(u: (typeof users)[number]): SessionUser {
  const { password: _p, ...rest } = u
  return rest
}

/**
 * MOCK AUTH ONLY — not production authentication.
 * SECURITY: Backend session/cookie auth required. Do not treat mockSessionId as a secret.
 */
export const mockAuth = {
  async login(email: string, password: string): Promise<AuthSession> {
    await delay(400)
    const found = users.find((u) => u.email === email && u.password === password)
    if (!found) {
      const err = new Error('Invalid email or password')
      ;(err as Error & { code?: string }).code = 'AUTH_INVALID'
      throw err
    }
    return {
      user: toSessionUser(found),
      mockSessionId: `mock-session-${found.id}`,
    }
  },
  demoUsers(): SessionUser[] {
    return users.map(toSessionUser)
  },
}
