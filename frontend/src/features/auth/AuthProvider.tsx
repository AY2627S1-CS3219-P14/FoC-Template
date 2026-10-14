import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { login, logout } from './auth.api'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth.context'
import {
  clearAccessToken,
  getAccessToken,
  refreshAccessToken,
  setAccessToken,
} from './auth.token'

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let active = true

    refreshAccessToken()
      .then(() => {
        if (active) setStatus('authenticated')
      })
      .catch(() => {
        if (active) setStatus('unauthenticated')
      })

    return () => {
      active = false
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      async signIn(credentials) {
        const session = await login(credentials)
        setAccessToken(session.accessToken)
        setStatus('authenticated')
      },
      async signOut() {
        const token = getAccessToken()

        try {
          if (token) await logout(token)
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
