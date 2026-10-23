import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../features/auth/auth.context'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('links to account registration and confirms completed registration', () => {
    render(
      <AuthContext.Provider
        value={{
          status: 'unauthenticated',
          currentUserId: null,
          signIn: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        <MemoryRouter
          initialEntries={[{ pathname: '/login', state: { registrationComplete: true } }]}
        >
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register',
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Account created. Sign in with your new credentials.',
    )
  })
})
