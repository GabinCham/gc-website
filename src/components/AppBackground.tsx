import { useEffect, useRef, useState } from 'react'
import {
  getGalleryMediaType,
  getGalleryPosterUrl,
  type GalleryItem,
} from '../gallery/images'

const FADE_MS = 2200

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

type BackgroundMediaLayerProps = {
  item: GalleryItem
  opacity: number
}

function BackgroundMediaLayer({ item, opacity }: BackgroundMediaLayerProps) {
  const isVideo = getGalleryMediaType(item) === 'video'
  const posterUrl = isVideo ? getGalleryPosterUrl(item) : null
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isVideo) return

    if (opacity > 0.02) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isVideo, opacity])

  if (opacity <= 0) return null

  return (
    <div
      className="app-background__layer"
      style={{ opacity }}
      aria-hidden
    >
      {isVideo ? (
        <video
          ref={videoRef}
          className="app-background__media"
          src={item.url}
          poster={posterUrl ?? undefined}
          loop
          muted
          playsInline
          preload="auto"
        />
      ) : (
        <img
          className="app-background__media"
          src={item.url}
          alt=""
          decoding="async"
        />
      )}
    </div>
  )
}

type AppBackgroundProps = {
  item: GalleryItem
  cardHovered?: boolean
}

export function AppBackground({ item, cardHovered = false }: AppBackgroundProps) {
  const [fromItem, setFromItem] = useState(item)
  const [toItem, setToItem] = useState(item)
  const [mix, setMix] = useState(1)
  const targetRef = useRef(item)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (item.id === targetRef.current.id) return

    setFromItem(targetRef.current)
    setToItem(item)
    targetRef.current = item
    setMix(0)

    const start = performance.now()

    const step = (now: number) => {
      const t = easeInOutCubic(Math.min(1, (now - start) / FADE_MS))
      setMix(t)
      if (t < 1) {
        animRef.current = requestAnimationFrame(step)
      }
    }

    animRef.current = requestAnimationFrame(step)

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current)
      }
    }
  }, [item])

  const showFrom = mix < 1
  const fromOpacity = 1 - mix
  const toOpacity = mix

  return (
    <div
      className={
        cardHovered
          ? 'app-background app-background--card-hover'
          : 'app-background'
      }
      aria-hidden
    >
      <div className="app-background__media-stack">
        {showFrom ? (
          <BackgroundMediaLayer item={fromItem} opacity={fromOpacity} />
        ) : null}
        <BackgroundMediaLayer item={toItem} opacity={toOpacity} />
      </div>
      <div className="app-background__ambient-overlay" />
      <div className="crt-overlay" />
    </div>
  )
}
