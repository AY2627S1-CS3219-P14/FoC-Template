import { userApiBaseUrl } from './auth.api'
import { authenticatedFetch } from './auth.fetch'

export async function getProfileName(signal: AbortSignal): Promise<string | null> {
  const response = await authenticatedFetch(`${userApiBaseUrl}/api/v1/profiles/me`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) return null

  const profile = await response.json() as { name?: unknown } | null
  return typeof profile?.name === 'string' ? profile.name.trim() || null : null
}
