import { useEffect, useRef, useState, type RefObject } from 'react'
import { getEquipe, getEquipeIndex, getEquipeThemeStyle } from './content'

type UseQueDesNumeros10ScrollResult = {
  scrollRef: RefObject<HTMLDivElement | null>
  viewportRef: RefObject<HTMLDivElement | null>
  scrollProgressRef: RefObject<number>
  activeEquipeIndex: number
  scrollHintVisible: boolean
}

export function useQueDesNumeros10Scroll(): UseQueDesNumeros10ScrollResult {
  const scrollRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const scrollProgressRef = useRef(0)
  const [activeEquipeIndex, setActiveEquipeIndex] = useState(0)
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

      const equipeIndex = getEquipeIndex(progress)
      const equipe = getEquipe(progress)
      const themeStyle = getEquipeThemeStyle(equipe)

      for (const [key, value] of Object.entries(themeStyle)) {
        viewportEl.style.setProperty(key, value)
      }

      if (equipeIndex !== lastIndex) {
        lastIndex = equipeIndex
        setActiveEquipeIndex(equipeIndex)
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
    activeEquipeIndex,
    scrollHintVisible,
  }
}
