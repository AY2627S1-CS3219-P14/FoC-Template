import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { AuthApiError, login, logout } from './auth.api'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth.context'
import {
  clearAccessToken,
  getAccessToken,
  refreshAccessToken,
  setAccessToken,
  subscribeToSessionExpiry,
} from './auth.token'

export function AuthProvider({ children }: PropsWithChildren) {
  const mockAuthEnabled =
    import.meta.env.DEV && import.meta.env.VITE_MOCK_AUTH === 'true'
  const [status, setStatus] = useState<AuthStatus>(
    mockAuthEnabled ? 'authenticated' : 'loading',
  )

  useEffect(() => {
    if (mockAuthEnabled) return

    let active = true
    const unsubscribe = subscribeToSessionExpiry(() => {
      if (active) setStatus('unauthenticated')
    })

    refreshAccessToken()
      .then(() => {
        if (active) setStatus('authenticated')
      })
      .catch(() => {
        if (active) setStatus('unauthenticated')
      })

    return () => {
      active = false
      unsubscribe()
    }
  }, [mockAuthEnabled])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      async signIn(credentials) {
        const session = await login(credentials)
        setAccessToken(session.accessToken)
        setStatus('authenticated')
      },
      async signOut() {
        let token = getAccessToken()

        try {
          if (token) {
            try {
              await logout(token)
            } catch (error) {
              if (!(error instanceof AuthApiError) || error.status !== 401) throw error

              token = await refreshAccessToken()
              await logout(token)
            }
          }
        } catch {
          // Local authentication is still cleared when the API is unavailable.
        } finally {
          clearAccessToken()
          setStatus('unauthenticated')
        }
      },
    }),
    [status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
