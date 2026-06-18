import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  getBrasserieCan,
  getBrasserieCanIndex,
  getBrasserieThemeStyle,
} from './content'

type UseBrasserieScrollResult = {
  scrollRef: RefObject<HTMLDivElement | null>
  viewportRef: RefObject<HTMLDivElement | null>
  scrollProgressRef: RefObject<number>
  activeCanIndex: number
  scrollHintVisible: boolean
}

export function useBrasserieScroll(): UseBrasserieScrollResult {
  const scrollRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const scrollProgressRef = useRef(0)
  const [activeCanIndex, setActiveCanIndex] = useState(0)
  const [scrollHintVisible, setScrollHintVisible] = useState(true)

  useEffect(() => {
    const scrollEl = scrollRef.current
    const viewportEl = viewportRef.current
    if (!scrollEl || !viewportEl) return

    let frame = 0
    let lastIndex = 0

    const update = () => {
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight
      const progress = maxScroll > 0 ? scrollEl.scrollTop / maxScroll : 0
      scrollProgressRef.current = progress

      if (progress > 0.02) {
        setScrollHintVisible(false)
      }

      const canIndex = getBrasserieCanIndex(progress)
      const can = getBrasserieCan(progress)
      const themeStyle = getBrasserieThemeStyle(can)

      for (const [key, value] of Object.entries(themeStyle)) {
        viewportEl.style.setProperty(key, value)
      }

      if (canIndex !== lastIndex) {
        lastIndex = canIndex
        setActiveCanIndex(canIndex)
      }

      frame = requestAnimationFrame(update)
    }

    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [])

  return {
    scrollRef,
    viewportRef,
    scrollProgressRef,
    activeCanIndex,
    scrollHintVisible,
  }
}
