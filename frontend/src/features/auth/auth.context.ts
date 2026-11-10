import { createContext } from 'react'
import type { LoginCredentials } from './auth.types'
import type { AccountType } from './auth.token'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthContextValue = {
  status: AuthStatus
  currentUserId: string | null
  currentUserType: AccountType | null
  signIn: (credentials: LoginCredentials) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
