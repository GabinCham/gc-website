import { useEffect, useState } from 'react'
import { MOBILE_SPIRAL_BREAKPOINT } from './layouts'

export function isMobileGallery() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < MOBILE_SPIRAL_BREAKPOINT
}

export function useIsMobileGallery() {
  const [mobile, setMobile] = useState(() => isMobileGallery())

  useEffect(() => {
    const query = `(max-width: ${MOBILE_SPIRAL_BREAKPOINT - 1}px)`
    const mq = window.matchMedia(query)
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return mobile
}
