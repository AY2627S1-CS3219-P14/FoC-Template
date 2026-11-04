import { refreshSession } from './auth.api'

let accessToken: string | null = null
let refreshPromise: Promise<string> | null = null
const sessionExpiredListeners = new Set<() => void>()

type AccessTokenPayload = {
  sub?: unknown
}

export function getAccessTokenSubject(token: string | null) {
  if (!token) return null

  try {
    const payloadSegment = token.split('.')[1]
    if (!payloadSegment) return null

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload = JSON.parse(atob(paddedBase64)) as AccessTokenPayload
    return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null
  } catch {
    return null
  }
}

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}

export function subscribeToSessionExpiry(listener: () => void) {
  sessionExpiredListeners.add(listener)
  return () => sessionExpiredListeners.delete(listener)
}

export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .then((session) => {
        setAccessToken(session.accessToken)
        return session.accessToken
      })
      .catch((error: unknown) => {
        clearAccessToken()
        sessionExpiredListeners.forEach((listener) => listener())
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}
