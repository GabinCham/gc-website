import { useEffect, useMemo, useRef, useState } from 'react'
import type { GalleryBackgroundColors } from '../gallery/images'
import { useIsMobileGallery } from '../gallery/mobilePerf'
import { MeshGradientCanvas } from './MeshGradientCanvas'

const FADE_MS = 2200

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function colorsEqual(a: GalleryBackgroundColors, b: GalleryBackgroundColors) {
  return (
    a.accent === b.accent &&
    a.base === b.base &&
    (a.glow ?? a.accent) === (b.glow ?? b.accent) &&
    (a.deep ?? a.base) === (b.deep ?? b.base)
  )
}

function lerpColors(
  from: GalleryBackgroundColors,
  to: GalleryBackgroundColors,
  t: number,
): GalleryBackgroundColors {
  const mixHex = (a: string, b: string) => {
    const parse = (hex: string) => {
      const value = hex.replace('#', '')
      return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16),
      ] as const
    }

    const [ar, ag, ab] = parse(a)
    const [br, bg, bb] = parse(b)
    const channel = (start: number, end: number) =>
      Math.round(start + (end - start) * t)
        .toString(16)
        .padStart(2, '0')

    return `#${channel(ar, br)}${channel(ag, bg)}${channel(ab, bb)}`
  }

  return {
    accent: mixHex(from.accent, to.accent),
    base: mixHex(from.base, to.base),
    glow: mixHex(from.glow ?? from.accent, to.glow ?? to.accent),
    deep: mixHex(from.deep ?? from.base, to.deep ?? to.base),
  }
}

type AppBackgroundProps = {
  colors: GalleryBackgroundColors
  cardHovered?: boolean
}

export function AppBackground({ colors, cardHovered = false }: AppBackgroundProps) {
  const isMobile = useIsMobileGallery()
  const [from, setFrom] = useState(colors)
  const [to, setTo] = useState(colors)
  const [mix, setMix] = useState(1)
  const targetRef = useRef(colors)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (colorsEqual(colors, targetRef.current)) return

    setFrom(targetRef.current)
    setTo(colors)
    targetRef.current = colors
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
  }, [colors])

  const displayColors = useMemo(
    () => lerpColors(from, to, mix),
    [from, to, mix],
  )

  const backgroundClass = [
    'app-background',
    cardHovered ? 'app-background--card-hover' : '',
    isMobile ? 'app-background--mobile' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={backgroundClass} aria-hidden>
      <div className="mesh-gradient">
        <MeshGradientCanvas colors={displayColors} reduced={isMobile} />
      </div>
      <div className="crt-overlay" />
    </div>
  )
}
