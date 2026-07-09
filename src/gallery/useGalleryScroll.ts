import { useCallback, useEffect, useRef } from 'react'
import { publishGalleryScrollVelocity } from './galleryScrollSpeed'

type ScrollState = {
  offset: number
  velocity: number
}

const FRICTION = 0.92
const OFFSET_WHEEL = 0.00035
const OFFSET_DRAG = 0.0013
const SETTLE_START = 0.018
const SNAP_STRENGTH = 9
const STEP_BLEND_RATE = 14

function smoothstep(value: number) {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

type UseGalleryScrollOptions = {
  /** Glisser / molette — désactivé sur mobile (flèches uniquement). */
  freeScroll?: boolean
}

export function useGalleryScroll(
  enabled: boolean,
  { freeScroll = true }: UseGalleryScrollOptions = {},
) {
  const state = useRef<ScrollState>({ offset: 0, velocity: 0 })
  const dragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const stepTargetRef = useRef<number | null>(null)
  const freeScrollRef = useRef(freeScroll)
  freeScrollRef.current = freeScroll

  const onWheel = useCallback(
    (event: WheelEvent) => {
      if (!enabled || !freeScrollRef.current || stepTargetRef.current !== null) {
        return
      }
      event.preventDefault()
      state.current.velocity -= event.deltaY * OFFSET_WHEEL
      publishGalleryScrollVelocity(state.current.velocity)
    },
    [enabled],
  )

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (!enabled || !freeScrollRef.current || stepTargetRef.current !== null) {
        return
      }
      dragging.current = true
      lastPointer.current = { x: event.clientX, y: event.clientY }
    },
    [enabled],
  )

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!enabled || !freeScrollRef.current || !dragging.current) return

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

  const stepBy = useCallback((direction: 1 | -1) => {
    if (stepTargetRef.current !== null) return

    const s = state.current
    s.velocity = 0
    const snapped = Math.round(s.offset)
    s.offset = snapped
    stepTargetRef.current = snapped + direction
    publishGalleryScrollVelocity(0)
  }, [])

  const step = useCallback(
    (delta: number) => {
      const s = state.current

      if (stepTargetRef.current !== null) {
        const target = stepTargetRef.current
        const diff = target - s.offset
        const blend = 1 - Math.exp(-STEP_BLEND_RATE * delta)
        s.offset += diff * blend
        s.velocity = 0

        if (Math.abs(diff) < 0.002) {
          s.offset = target
          stepTargetRef.current = null
        }

        publishGalleryScrollVelocity(0)
        return s.offset
      }

      if (!dragging.current) {
        s.offset += s.velocity
        s.velocity *= FRICTION
      }

      if (enabled && !dragging.current && freeScrollRef.current) {
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
    state.current = { offset: 0, velocity: 0 }
    stepTargetRef.current = null
    publishGalleryScrollVelocity(0)
  }, [])

  return { step, reset, stepBy }
}
