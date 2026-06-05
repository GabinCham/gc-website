import { useEffect, useState } from 'react'

/** Monte le contenu lourd après le premier paint (WebGL, etc.). */
export function useIdleMount(fallbackMs = 80) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(() => setReady(true), { timeout: 1500 })
      return () => cancelIdleCallback(id)
    }

    const id = setTimeout(() => setReady(true), fallbackMs)
    return () => clearTimeout(id)
  }, [fallbackMs])

  return ready
}
