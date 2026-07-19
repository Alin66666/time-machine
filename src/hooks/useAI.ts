import { useState, useCallback } from 'react'

type AIStatus = 'idle' | 'loading' | 'success' | 'error'

export function useAI() {
  const [status, setStatus] = useState<AIStatus>('idle')
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    setStatus('loading')
    setError(null)
    try {
      const res = await fn()
      setResult(res)
      setStatus('success')
      return res
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 服务暂时不可用'
      setError(msg)
      setStatus('error')
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
  }, [])

  return { status, result, error, run, reset }
}
