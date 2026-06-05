import { useCallback, useEffect, useRef } from 'react'
import {
  AUTO_SCROLL_SPEED,
  publishGalleryScrollVelocity,
} from './galleryScrollSpeed'

type ScrollState = {
  /** Position sur la spirale infinie (en « numéros de carte » : 0, 1, … 23, 24, 25 …) */
  offset: number
  velocity: number
}

const FRICTION = 0.92
const OFFSET_WHEEL = 0.00035
const OFFSET_DRAG = 0.0013

/** Délai sans interaction avant de reprendre l’auto-scroll */
const USER_IDLE_MS = 600
/** Vitesse de retour vers l’auto-scroll après un scroll manuel */
const RETURN_TO_AUTO = 3.5

const SETTLE_START = 0.018
const SNAP_STRENGTH = 9

function smoothstep(value: number) {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

function markUserInput(lastUserInput: { current: number }) {
  lastUserInput.current = performance.now()
}

export function useGalleryScroll(
  enabled: boolean,
  autoScrollEnabled: boolean,
) {
  const state = useRef<ScrollState>({
    offset: 0,
    velocity: AUTO_SCROLL_SPEED,
  })

  const dragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const lastUserInput = useRef(0)
  const autoScrollRef = useRef(autoScrollEnabled)
  autoScrollRef.current = autoScrollEnabled

  useEffect(() => {
    if (!enabled || !autoScrollEnabled || dragging.current) return

    const idle = performance.now() - lastUserInput.current > USER_IDLE_MS
    if (!idle) return

    state.current.velocity = AUTO_SCROLL_SPEED
    publishGalleryScrollVelocity(AUTO_SCROLL_SPEED)
  }, [enabled, autoScrollEnabled])

  const onWheel = useCallback(
    (event: WheelEvent) => {
      if (!enabled) return
      event.preventDefault()
      markUserInput(lastUserInput)
      state.current.velocity -= event.deltaY * OFFSET_WHEEL
      publishGalleryScrollVelocity(state.current.velocity)
    },
    [enabled],
  )

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (!enabled) return
      dragging.current = true
      markUserInput(lastUserInput)
      lastPointer.current = { x: event.clientX, y: event.clientY }
    },
    [enabled],
  )

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!enabled || !dragging.current) return

      markUserInput(lastUserInput)

      const dx = event.clientX - lastPointer.current.x
      const dy = event.clientY - lastPointer.current.y
      lastPointer.current = { x: event.clientX, y: event.clientY }

      state.current.velocity += dx * OFFSET_DRAG
      state.current.velocity -= dy * OFFSET_DRAG
      publishGalleryScrollVelocity(state.current.velocity)
    },
    [enabled],
  )

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  useEffect(() => {
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [onWheel, onPointerDown, onPointerMove, onPointerUp])

  const step = useCallback(
    (delta: number) => {
      const s = state.current

      const userIdle =
        enabled &&
        autoScrollRef.current &&
        !dragging.current &&
        performance.now() - lastUserInput.current > USER_IDLE_MS

      if (!dragging.current) {
        s.offset += s.velocity
        // Pas de friction en auto : sinon la vitesse reste sous AUTO_SCROLL_SPEED
        // et la musique est ralentie en permanence.
        if (!userIdle) {
          s.velocity *= FRICTION
        }
      }

      if (userIdle) {
        const diff = AUTO_SCROLL_SPEED - s.velocity
        if (Math.abs(diff) < AUTO_SCROLL_SPEED * 0.04) {
          s.velocity = AUTO_SCROLL_SPEED
        } else {
          const t = 1 - Math.exp(-RETURN_TO_AUTO * delta)
          s.velocity += diff * t
        }
      } else if (enabled && !dragging.current) {
        if (Math.abs(s.velocity) < 0.00002) s.velocity = 0

        const speed = Math.abs(s.velocity)
        const snapBlend =
          speed < SETTLE_START ? smoothstep(1 - speed / SETTLE_START) : 0

        if (snapBlend > 0.001) {
          const target = Math.round(s.offset)
          const diff = target - s.offset
          const stepT = (1 - Math.exp(-SNAP_STRENGTH * delta)) * snapBlend

          s.offset += diff * stepT
          s.velocity *= 1 - snapBlend * 0.1

          if (snapBlend > 0.98 && Math.abs(diff) < 0.00025) {
            s.offset = target
            s.velocity = 0
          }
        }
      }

      if (enabled) publishGalleryScrollVelocity(s.velocity)

      return s.offset
    },
    [enabled],
  )

  const reset = useCallback(() => {
    state.current = {
      offset: 0,
      velocity: autoScrollRef.current ? AUTO_SCROLL_SPEED : 0,
    }
    lastUserInput.current = 0
    publishGalleryScrollVelocity(state.current.velocity)
  }, [])

  return { step, reset }
}
