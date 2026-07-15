import { useEffect, useState } from 'react'
import { isPageVisible, subscribePageVisibility } from './pageVisibility'

export function usePageVisibility() {
  const [visible, setVisible] = useState(isPageVisible)

  useEffect(() => subscribePageVisibility(setVisible), [])

  return visible
}
