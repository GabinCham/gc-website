import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  getBrasserieCan,
  getBrasserieCanIndex,
  getBrasserieThemeStyle,
} from './content'

type UseBrasserieScrollResult = {
  scrollRef: RefObject<HTMLDivElement | null>
  viewportRef: RefObject<HTMLDivElement | null>
  scrollTrackRef: RefObject<HTMLDivElement | null>
  scrollProgressRef: RefObject<number>
  activeCanIndex: number
  scrollHintVisible: boolean
  gravityMode: boolean
  setGravityMode: (active: boolean) => void
  resetToStart: () => void
}

export function useBrasserieScroll(): UseBrasserieScrollResult {
  const scrollRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const scrollTrackRef = useRef<HTMLDivElement>(null)
  const scrollProgressRef = useRef(0)
  const [activeCanIndex, setActiveCanIndex] = useState(0)
  const [scrollHintVisible, setScrollHintVisible] = useState(true)
  const [gravityMode, setGravityMode] = useState(false)

  const resetToStart = useCallback(() => {
    const scrollEl = scrollRef.current
    const viewportEl = viewportRef.current
    scrollProgressRef.current = 0

    if (scrollEl) {
      scrollEl.scrollTop = 0
    }

    if (viewportEl) {
      const themeStyle = getBrasserieThemeStyle(getBrasserieCan(0))
      for (const [key, value] of Object.entries(themeStyle)) {
        viewportEl.style.setProperty(key, value)
      }
    }

    setActiveCanIndex(0)
    setScrollHintVisible(true)
    setGravityMode(false)
  }, [])

  useEffect(() => {
    const scrollEl = scrollRef.current
    const viewportEl = viewportRef.current
    const trackEl = scrollTrackRef.current
    if (!scrollEl || !viewportEl || !trackEl) return

    let frame = 0
    let lastIndex = 0

    const update = () => {
      const maxCanScroll = trackEl.offsetHeight
      const progress =
        maxCanScroll > 0
          ? Math.min(1, scrollEl.scrollTop / maxCanScroll)
          : 0
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
    scrollTrackRef,
    scrollProgressRef,
    activeCanIndex,
    scrollHintVisible,
    gravityMode,
    setGravityMode,
    resetToStart,
  }
}
