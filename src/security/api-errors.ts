export type ApiErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'RATE_LIMITED' | 'SERVER' | 'NETWORK' | 'UNKNOWN'

export class ApiError extends Error {
  code: ApiErrorCode
  status?: number
  constructor(code: ApiErrorCode, message: string, status?: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

/** Map transport/status into safe UX messages — never leak internals. */
export function toUserErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Your session has expired. Please sign in again.'
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.'
      case 'NOT_FOUND':
        return 'We could not find that item.'
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.'
      case 'NETWORK':
        return 'Network problem. Check your connection and retry.'
      case 'SERVER':
        return 'Something went wrong on our side. Please try again.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }
  if (err instanceof Error && err.message === 'Invalid email or password') {
    return 'Invalid email or password'
  }
  return 'Something went wrong. Please try again.'
}

export function fromHttpStatus(status: number): ApiError {
  if (status === 401) return new ApiError('UNAUTHORIZED', 'Session expired', 401)
  if (status === 403) return new ApiError('FORBIDDEN', 'Forbidden', 403)
  if (status === 404) return new ApiError('NOT_FOUND', 'Not found', 404)
  if (status === 429) return new ApiError('RATE_LIMITED', 'Rate limited', 429)
  if (status >= 500) return new ApiError('SERVER', 'Server error', status)
  return new ApiError('UNKNOWN', 'Request failed', status)
}

/**
 * Future fetch wrapper hook point.
 * SECURITY: CSRF (cookie sessions), auth headers, and rate limits are backend-required.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(input, init)
    if (!res.ok) throw fromHttpStatus(res.status)
    return res
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError('NETWORK', 'Network error')
  }
}
