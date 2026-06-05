import { useCallback, useEffect, useRef, useState } from 'react'
import { SITE_TRACK, getWaveformUrl } from '../audio'
import {
  galleryVelocityToPlaybackRate,
  getGalleryScrollVelocity,
  subscribeGalleryScrollVelocity,
} from '../gallery/galleryScrollSpeed'

const PLAYBACK_RATE_SMOOTH = 0.22

const BAR_COUNT = 48

const PLACEHOLDER_PEAKS = Array.from({ length: BAR_COUNT }, (_, i) =>
  0.25 + 0.55 * Math.abs(Math.sin(i * 0.28) * Math.cos(i * 0.11)),
)

type WaveformFile = {
  barCount?: number
  peaks: number[]
}

async function fetchWaveformPeaks(waveformUrl: string): Promise<number[]> {
  const response = await fetch(encodeURI(waveformUrl))
  if (!response.ok) throw new Error(`waveform ${response.status}`)
  const data = (await response.json()) as WaveformFile
  if (!Array.isArray(data.peaks) || data.peaks.length === 0) {
    throw new Error('invalid waveform payload')
  }
  return data.peaks
}

function drawWaveform(
  canvas: HTMLCanvasElement,
  peaks: number[],
  progress: number,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const { width, height } = canvas.getBoundingClientRect()
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, width, height)

  const gap = 1.5
  const barWidth = (width - gap * (peaks.length - 1)) / peaks.length
  const playedBars = Math.floor(progress * peaks.length)

  peaks.forEach((peak, i) => {
    const barHeight = Math.max(2, peak * height * 0.85)
    const x = i * (barWidth + gap)
    const y = (height - barHeight) / 2

    ctx.fillStyle =
      i < playedBars
        ? 'rgba(255, 255, 255, 0.55)'
        : 'rgba(255, 255, 255, 0.18)'
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barHeight, 1)
    ctx.fill()
  })
}

function applyPlaybackRate(
  audio: HTMLAudioElement,
  target: number,
  smoothed: { current: number },
) {
  if (target === 1) {
    smoothed.current = 1
  } else {
    smoothed.current += (target - smoothed.current) * PLAYBACK_RATE_SMOOTH
  }

  const rate = smoothed.current
  audio.playbackRate = rate
  audio.defaultPlaybackRate = rate
  audio.preservesPitch = Math.abs(rate - 1) < 0.04
}

type AudioPlayerProps = {
  src?: string
  waveformSrc?: string
  syncPlaybackToScroll?: boolean
}

export function AudioPlayer({
  src = SITE_TRACK,
  waveformSrc,
  syncPlaybackToScroll = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const peaksRef = useRef<number[]>(PLACEHOLDER_PEAKS)
  const rafRef = useRef<number>(0)
  const playbackRateRef = useRef(1)
  const syncPlaybackRef = useRef(syncPlaybackToScroll)
  const audioActivatedRef = useRef(false)
  syncPlaybackRef.current = syncPlaybackToScroll

  const resolvedWaveformSrc = waveformSrc ?? getWaveformUrl(src)

  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [audioActivated, setAudioActivated] = useState(false)

  const activateAudio = useCallback(() => {
    if (audioActivatedRef.current) return
    audioActivatedRef.current = true
    setAudioActivated(true)

    const audio = audioRef.current
    if (!audio) return
    audio.preload = 'auto'
    audio.load()
  }, [])

  const redraw = useCallback((progress: number) => {
    const canvas = canvasRef.current
    if (!canvas || peaksRef.current.length === 0) return
    drawWaveform(canvas, peaksRef.current, progress)
  }, [])

  const tick = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    const target = syncPlaybackRef.current
      ? galleryVelocityToPlaybackRate(getGalleryScrollVelocity())
      : 1
    applyPlaybackRate(audio, target, playbackRateRef)

    if (audio.duration) {
      redraw(audio.currentTime / audio.duration)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [redraw])

  useEffect(() => {
    redraw(0)
  }, [redraw])

  useEffect(() => {
    const unsubscribe = subscribeGalleryScrollVelocity(() => {
      const audio = audioRef.current
      if (!audio || !syncPlaybackRef.current) return
      const target = galleryVelocityToPlaybackRate(getGalleryScrollVelocity())
      applyPlaybackRate(audio, target, playbackRateRef)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchWaveformPeaks(resolvedWaveformSrc)
      .then((peaks) => {
        if (cancelled) return
        peaksRef.current = peaks
        redraw(0)
        setReady(true)
      })
      .catch(() => {
        if (cancelled) return
        peaksRef.current = PLACEHOLDER_PEAKS
        redraw(0)
        setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [resolvedWaveformSrc, redraw])

  useEffect(() => {
    const onFirstGesture = () => activateAudio()
    window.addEventListener('pointerdown', onFirstGesture, { once: true })
    window.addEventListener('keydown', onFirstGesture, { once: true })
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture)
      window.removeEventListener('keydown', onFirstGesture)
    }
  }, [activateAudio])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !ready || !audioActivated) return

    audio.loop = true
    audio.volume = 0.35
    audio.preservesPitch = true

    const start = () => {
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }

    if (audio.readyState >= 3) start()
    else audio.addEventListener('canplaythrough', start, { once: true })

    const onPlay = () => {
      setPlaying(true)
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }
    const onPause = () => {
      setPlaying(false)
      cancelAnimationFrame(rafRef.current)
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('canplaythrough', start)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      cancelAnimationFrame(rafRef.current)
    }
  }, [ready, audioActivated, tick])

  useEffect(() => {
    if (!ready) return
    const audio = audioRef.current
    if (!audio) return

    if (syncPlaybackToScroll) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(tick)
    } else {
      playbackRateRef.current = 1
      audio.playbackRate = 1
      audio.defaultPlaybackRate = 1
    }
  }, [ready, syncPlaybackToScroll, tick])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onResize = () => {
      const audio = audioRef.current
      const progress =
        audio && audio.duration ? audio.currentTime / audio.duration : 0
      redraw(progress)
    }

    const observer = new ResizeObserver(onResize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [redraw])

  const toggle = () => {
    activateAudio()
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play()
    else audio.pause()
  }

  return (
    <div className="audio-player" aria-label="Lecteur audio">
      <audio
        ref={audioRef}
        src={encodeURI(src)}
        preload={audioActivated ? 'auto' : 'none'}
      />

      <button
        type="button"
        className="audio-player__btn"
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Lecture'}
        disabled={!ready}
      >
        {playing ? (
          <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
            <rect x="0" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
            <rect x="7" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
          </svg>
        ) : (
          <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
            <path d="M0 0 L10 6 L0 12 Z" fill="currentColor" />
          </svg>
        )}
      </button>

      <canvas
        ref={canvasRef}
        className="audio-player__waveform"
        aria-hidden
      />
    </div>
  )
}
