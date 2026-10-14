import { refreshSession } from './auth.api'

let accessToken: string | null = null
let refreshPromise: Promise<string> | null = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
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
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}
