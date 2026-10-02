import type { LoginResponse } from './auth.types'

const SESSION_KEY = 'campus-couriers-session'

export function saveSession(session: LoginResponse) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}
