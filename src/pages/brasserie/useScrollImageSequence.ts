import { useEffect, type RefObject } from 'react'
import { ANIM_CAN_CONFIG } from './anim-can.config'

type UseScrollImageSequenceOptions = {
  scrollRef: RefObject<HTMLDivElement | null>
  sectionRef: RefObject<HTMLElement | null>
  trackRef: RefObject<HTMLElement | null>
  holdTrackRef: RefObject<HTMLElement | null>
  loopTrackRef: RefObject<HTMLElement | null>
  loopOverlayRef: RefObject<HTMLDivElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  frameUrls: string[]
  onLoopReset?: () => void
}

function getScrollWithinSection(
  scrollEl: HTMLDivElement,
  sectionEl: HTMLElement,
) {
  const scrollRect = scrollEl.getBoundingClientRect()
  const sectionRect = sectionEl.getBoundingClientRect()
  return scrollRect.top - sectionRect.top
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function resizeCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (width <= 0 || height <= 0) return false

  const nextWidth = Math.round(width * dpr)
  const nextHeight = Math.round(height * dpr)
  if (canvas.width === nextWidth && canvas.height === nextHeight) return false

  canvas.width = nextWidth
  canvas.height = nextHeight
  return true
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
) {
  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)

  if (!image.complete || image.naturalWidth <= 0) return

  const scaleFn = ANIM_CAN_CONFIG.fit === 'cover' ? Math.max : Math.min
  const scale = scaleFn(
    width / image.naturalWidth,
    height / image.naturalHeight,
  )
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  const x = (width - drawWidth) / 2
  const y = (height - drawHeight) / 2
  ctx.drawImage(image, x, y, drawWidth, drawHeight)
}

function drawLiquidFill(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  fillProgress: number,
) {
  if (fillProgress <= 0) return

  const { width, height } = canvas
  const { top, mid, bottom, waveAmplitude } = ANIM_CAN_CONFIG.liquid
  const amplitude = height * waveAmplitude
  const surfaceY = height * (1 - fillProgress) - amplitude * 1.5
  const phase = fillProgress * Math.PI * 6

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(0, height)

  for (let x = 0; x <= width; x += 3) {
    const nx = x / width
    const wave =
      Math.sin(nx * Math.PI * 5 + phase) * amplitude +
      Math.sin(nx * Math.PI * 2.3 - phase * 0.6) * amplitude * 0.45
    ctx.lineTo(x, surfaceY + wave)
  }

  ctx.lineTo(width, height)
  ctx.closePath()

  const gradient = ctx.createLinearGradient(0, surfaceY - amplitude * 2, 0, height)
  gradient.addColorStop(0, top)
  gradient.addColorStop(0.35, mid)
  gradient.addColorStop(1, bottom)
  ctx.fillStyle = gradient
  ctx.fill()

  const gloss = ctx.createLinearGradient(0, surfaceY - amplitude, 0, surfaceY + amplitude * 3)
  gloss.addColorStop(0, 'rgba(255, 255, 255, 0.22)')
  gloss.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gloss
  ctx.fill()

  ctx.restore()
}

export function useScrollImageSequence({
  scrollRef,
  sectionRef,
  trackRef,
  holdTrackRef,
  loopTrackRef,
  loopOverlayRef,
  canvasRef,
  frameUrls,
  onLoopReset,
}: UseScrollImageSequenceOptions) {
  useEffect(() => {
    const scrollEl = scrollRef.current
    const sectionEl = sectionRef.current
    const trackEl = trackRef.current
    const holdTrackEl = holdTrackRef.current
    const loopTrackEl = loopTrackRef.current
    const loopOverlayEl = loopOverlayRef.current
    const canvas = canvasRef.current
    if (
      !scrollEl ||
      !sectionEl ||
      !trackEl ||
      !holdTrackEl ||
      !loopTrackEl ||
      !canvas ||
      frameUrls.length === 0
    ) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const images = frameUrls.map((url) => {
      const image = new Image()
      image.decoding = 'async'
      image.src = url
      return image
    })

    let frame = 0
    let raf = 0
    let loopLocked = false
    let fadeTimer = 0
    let autoPlayActive = false
    let autoPlayCompleted = false
    let autoPlayStartTime = 0
    let autoPlayStartScrollTop = 0
    let autoPlayTargetScrollTop = 0

    const getImageProgress = () => {
      const scrollDistance = trackEl.offsetHeight
      if (scrollDistance <= 0) return 0
      return clamp(getScrollWithinSection(scrollEl, sectionEl) / scrollDistance, 0, 1)
    }

    const getFillProgress = () => {
      const imageProgress = getImageProgress()
      const start = ANIM_CAN_CONFIG.liquidStartAt
      if (imageProgress <= start) return 0
      return clamp((imageProgress - start) / (1 - start), 0, 1)
    }

    const getLoopTriggerProgress = () => {
      const loopDistance = loopTrackEl.offsetHeight
      if (loopDistance <= 0) return 0
      const loopScroll =
        getScrollWithinSection(scrollEl, sectionEl) -
        trackEl.offsetHeight -
        holdTrackEl.offsetHeight
      return clamp(loopScroll / loopDistance, 0, 1)
    }

    const maybeResetAutoPlay = () => {
      const scrollWithinSection = getScrollWithinSection(scrollEl, sectionEl)
      if (scrollWithinSection < -scrollEl.clientHeight * 0.85) {
        autoPlayActive = false
        autoPlayCompleted = false
      }
    }

    const maybeStartAutoPlay = (now: number) => {
      if (!ANIM_CAN_CONFIG.autoPlay || autoPlayActive || autoPlayCompleted) return

      const scrollWithinSection = getScrollWithinSection(scrollEl, sectionEl)
      if (scrollWithinSection < 0) return

      autoPlayActive = true
      autoPlayStartTime = now
      autoPlayStartScrollTop = scrollEl.scrollTop
      autoPlayTargetScrollTop = sectionEl.offsetTop + trackEl.offsetHeight
    }

    const updateAutoPlay = (now: number) => {
      if (!autoPlayActive) return

      const duration = Math.max(ANIM_CAN_CONFIG.autoPlayDurationMs, 200)
      const progress = clamp((now - autoPlayStartTime) / duration, 0, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      scrollEl.scrollTop =
        autoPlayStartScrollTop +
        (autoPlayTargetScrollTop - autoPlayStartScrollTop) * eased

      if (progress >= 1) {
        autoPlayActive = false
        autoPlayCompleted = true
      }
    }

    const runLoopReset = () => {
      if (loopLocked) return
      loopLocked = true

      if (loopOverlayEl) {
        loopOverlayEl.classList.add('brasserie-page__sequence-loop-overlay--visible')
        loopOverlayEl.classList.remove('brasserie-page__sequence-loop-overlay--fade-out')
      }

      scrollEl.scrollTop = 0
      onLoopReset?.()

      requestAnimationFrame(() => {
        if (!loopOverlayEl) {
          loopLocked = false
          return
        }

        loopOverlayEl.classList.add('brasserie-page__sequence-loop-overlay--fade-out')

        window.clearTimeout(fadeTimer)
        fadeTimer = window.setTimeout(() => {
          loopOverlayEl.classList.remove(
            'brasserie-page__sequence-loop-overlay--visible',
            'brasserie-page__sequence-loop-overlay--fade-out',
          )
          loopLocked = false
        }, 520)
      })
    }

    const maybeTriggerLoop = () => {
      if (loopLocked || getImageProgress() < 1) return

      const loopProgress = getLoopTriggerProgress()
      const holdEnd = trackEl.offsetHeight + holdTrackEl.offsetHeight
      const scrolledPastHold =
        getScrollWithinSection(scrollEl, sectionEl) >= holdEnd - 2

      if (loopProgress > 0.08 || scrolledPastHold) {
        runLoopReset()
      }
    }

    const maybeAutoTriggerLoop = (fillProgress: number) => {
      if (!ANIM_CAN_CONFIG.autoPlay || loopLocked || !autoPlayCompleted) return
      if (fillProgress >= 1) {
        runLoopReset()
      }
    }

    const renderFrame = (imageProgress: number, fillProgress: number) => {
      const nextFrame = Math.min(
        frameUrls.length - 1,
        Math.floor(imageProgress * frameUrls.length),
      )
      frame = nextFrame

      const image = images[frame]
      if (image) {
        drawFrame(ctx, canvas, image)
      }

      if (!loopLocked) {
        drawLiquidFill(ctx, canvas, fillProgress)
      }
    }

    const render = (now: number) => {
      resizeCanvas(canvas)
      maybeResetAutoPlay()
      maybeStartAutoPlay(now)
      updateAutoPlay(now)
      const imageProgress = getImageProgress()
      const fillProgress = getFillProgress()
      maybeTriggerLoop()
      maybeAutoTriggerLoop(fillProgress)
      renderFrame(imageProgress, fillProgress)
      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)

    const onResize = () => {
      resizeCanvas(canvas)
      renderFrame(getImageProgress(), getFillProgress())
    }

    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fadeTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [
    canvasRef,
    frameUrls,
    holdTrackRef,
    loopOverlayRef,
    loopTrackRef,
    onLoopReset,
    scrollRef,
    sectionRef,
    trackRef,
  ])
}
