import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { getAvailableBalance } from './credit.api'
import { CreditContext, type CreditContextValue, type CreditStatus } from './credit.context'

export function CreditProvider({ children }: PropsWithChildren) {
  const [availableBalance, setAvailableBalance] = useState<number | null>(null)
  const [status, setStatus] = useState<CreditStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const requestControllerRef = useRef<AbortController | null>(null)

  const refreshBalance = useCallback(async () => {
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller
    setStatus('loading')
    setError(null)

    try {
      const balance = await getAvailableBalance(controller.signal)
      if (!controller.signal.aborted) {
        setAvailableBalance(balance)
        setStatus('ready')
      }
    } catch (requestError) {
      if (controller.signal.aborted) return
      setAvailableBalance(null)
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load your credit balance.',
      )
      setStatus('error')
    } finally {
      if (requestControllerRef.current === controller) requestControllerRef.current = null
    }
  }, [])

  useEffect(() => {
    void refreshBalance()
    return () => requestControllerRef.current?.abort()
  }, [refreshBalance])

  const value = useMemo<CreditContextValue>(
    () => ({ availableBalance, status, error, refreshBalance }),
    [availableBalance, error, refreshBalance, status],
  )

  return <CreditContext.Provider value={value}>{children}</CreditContext.Provider>
}
