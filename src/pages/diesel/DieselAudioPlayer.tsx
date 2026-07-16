import { useEffect, useRef, useState } from 'react'

const DIESEL_AMBIENCE_URL = '/song/Summer_Forest_Ambience.mp3'
const DIESEL_AMBIENCE_VOLUME = 0.4

type DieselAudioPlayerProps = {
  className?: string
}

export function DieselAudioPlayer({ className }: DieselAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.loop = true
    audio.volume = DIESEL_AMBIENCE_VOLUME
    audio.preload = 'auto'

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    const tryPlay = () => {
      void audio.play().catch(() => {
        setPlaying(false)
      })
    }

    tryPlay()

    const unlock = () => {
      tryPlay()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('wheel', unlock)
    }

    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
    window.addEventListener('wheel', unlock, { passive: true })

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('wheel', unlock)
      audio.pause()
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      void audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }

  return (
    <div
      className={['diesel-page__audio', className].filter(Boolean).join(' ')}
    >
      <audio ref={audioRef} src={DIESEL_AMBIENCE_URL} loop playsInline />
      <button
        type="button"
        className={[
          'diesel-page__audio-btn',
          playing ? 'diesel-page__audio-btn--playing' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={playing ? 'Couper l’ambiance' : 'Lancer l’ambiance'}
        aria-pressed={playing}
        onClick={toggle}
      >
        <span className="diesel-page__audio-icon" aria-hidden>
          {playing ? (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M8 5.5v13l11-6.5L8 5.5z" />
            </svg>
          )}
        </span>
        <span className="diesel-page__audio-label">Forest</span>
        <span
          className={[
            'diesel-page__audio-eq',
            playing ? 'diesel-page__audio-eq--on' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden
        >
          <i />
          <i />
          <i />
        </span>
      </button>
    </div>
  )
}
