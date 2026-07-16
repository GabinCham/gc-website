import { useEffect, useRef, useState, type RefObject } from 'react'
import { DIESEL_COLOR_PICKER_FROM } from './content'

type UseDieselScrollResult = {
  scrollRef: RefObject<HTMLDivElement | null>
  scrollProgressRef: RefObject<number>
  scrollHintVisible: boolean
  colorPickerVisible: boolean
}

export function useDieselScroll(): UseDieselScrollResult {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollProgressRef = useRef(0)
  const [scrollHintVisible, setScrollHintVisible] = useState(true)
  const [colorPickerVisible, setColorPickerVisible] = useState(false)

  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    let frame = 0
    let hintHidden = false
    let pickerShown = false

    const readProgress = () => {
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight
      const progress = maxScroll > 0 ? scrollEl.scrollTop / maxScroll : 0
      scrollProgressRef.current = progress

      if (!hintHidden && progress > 0.02) {
        hintHidden = true
        setScrollHintVisible(false)
      }

      const showPicker = progress >= DIESEL_COLOR_PICKER_FROM
      if (showPicker !== pickerShown) {
        pickerShown = showPicker
        setColorPickerVisible(showPicker)
      }
    }

    const onScroll = () => {
      readProgress()
    }

    const tick = () => {
      readProgress()
      frame = requestAnimationFrame(tick)
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    frame = requestAnimationFrame(tick)

    return () => {
      scrollEl.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return {
    scrollRef,
    scrollProgressRef,
    scrollHintVisible,
    colorPickerVisible,
  }
}
