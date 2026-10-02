import type { LoginCredentials, LoginResponse } from './auth.types'

const userApiBaseUrl = (import.meta.env.VITE_USER_API_URL ?? '').trim().replace(/\/+$/, '')

type ProblemDetails = {
  detail?: string
  title?: string
}

export class AuthApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
  }
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  let response: Response

  try {
    response = await fetch(`${userApiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
  } catch {
    throw new AuthApiError('Could not connect to the User Service.', 0)
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null
    const fallbackMessage =
      response.status === 401
        ? 'The email or password is incorrect.'
        : 'Unable to sign in right now. Please try again.'

    throw new AuthApiError(problem?.detail ?? problem?.title ?? fallbackMessage, response.status)
  }

  return (await response.json()) as LoginResponse
}
