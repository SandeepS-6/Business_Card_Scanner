import type { Role } from '@/types'

export type AuthStatus =
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED'
  | 'SESSION_EXPIRED'
  | 'LOGGING_OUT'
  | 'AUTH_ERROR'

/** User shape safe for UI/session — never includes password. */
export type SessionUser = {
  id: string
  orgId: string | null
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: Role
  status: 'active' | 'invited' | 'inactive'
  lastActive: string
  avatarUrl?: string
}

export type AuthSession = {
  user: SessionUser
  mockSessionId: string
}
