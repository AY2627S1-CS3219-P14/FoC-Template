import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import routeIcon from '../assets/route.svg'
import studentAvatars from '../assets/student-avatars.svg'
import { login } from '../features/auth/auth.api'
import { saveSession } from '../features/auth/auth.storage'

const BENEFITS = [
  'Help fellow students with campus errands',
  'Earn credits on trips you already make',
  'Use credits when you need a helping hand',
]

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const session = await login({ email: email.trim(), password })
      saveSession(session)
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f4] text-[#17211d]">
      <header className="flex h-[76px] items-center border-b border-[#dde3de] bg-white px-6 sm:px-8">
        <div className="flex items-center gap-3" aria-label="Campus Couriers">
          <span className="grid size-10 place-items-center rounded-xl bg-[#175c45]">
            <img src={routeIcon} alt="" width="20" height="20" />
          </span>
          <span className="text-lg font-semibold tracking-[-0.02em]">Campus Couriers</span>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-76px)] lg:grid-cols-[minmax(28rem,45%)_1fr]">
        <aside className="hidden flex-col justify-between overflow-hidden bg-[#0d3c2d] px-12 py-16 text-white lg:flex xl:px-[4.5rem]">
          <div className="max-w-[34rem]">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold tracking-[0.04em]">
              <span className="size-2 rounded-full bg-[#d8f06b]" aria-hidden="true" />
              BUILT FOR THE NUS COMMUNITY
            </div>

            <h1 className="mt-7 text-[clamp(2.5rem,3.4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.04em]">
              Welcome to Campus Couriers.
            </h1>
            <p className="mt-6 max-w-[25rem] text-base leading-7 text-[#d9e5df]">
              Request an errand, lend a hand on your route, and keep campus moving together.
            </p>

            <ul className="mt-8 space-y-4">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#d8f06b] font-bold text-[#0d3c2d]">
                    ✓
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

        </aside>

        <section className="flex items-start justify-center px-5 py-10 sm:px-8 sm:py-16 lg:px-16">
          <div className="w-full max-w-[29rem] rounded-[1.25rem] border border-[#dde3de] bg-white p-6 shadow-[0_18px_50px_rgba(22,59,42,0.09)] sm:p-8">
            <p className="text-xs font-semibold tracking-[0.08em] text-[#175c45]">WELCOME BACK</p>
            <h2 className="mt-2 text-[2rem] font-semibold leading-tight tracking-[-0.035em]">
              Sign in to Campus Couriers
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#68736c]">
              Use your NUS email and password to continue.
            </p>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium" htmlFor="email">
                  NUS email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="e1234567@u.nus.edu"
                  className="mt-2 h-[50px] w-full rounded-xl border border-[#cfd8d1] bg-white px-4 text-sm outline-none transition placeholder:text-[#929c95] focus:border-[#175c45] focus:ring-4 focus:ring-[#175c45]/10"
                />
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="mt-2 h-[50px] w-full rounded-xl border border-[#cfd8d1] bg-white px-4 text-sm outline-none transition placeholder:text-[#929c95] focus:border-[#175c45] focus:ring-4 focus:ring-[#175c45]/10"
                />
              </div>

              {errorMessage ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full cursor-pointer rounded-lg bg-[#d8f06b] text-sm font-semibold text-[#0d3c2d] transition hover:bg-[#cce85b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#175c45] disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-[#68736c]">
              Campus Couriers accounts are available to verified NUS students.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
