import { refreshSession } from './auth.api'

let accessToken: string | null = null
let refreshPromise: Promise<string> | null = null
const sessionExpiredListeners = new Set<() => void>()

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
