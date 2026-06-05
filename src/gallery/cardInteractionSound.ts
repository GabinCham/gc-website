let audioCtx: AudioContext | null = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  audioCtx ??= new AudioContext()
  void audioCtx.resume()
  return audioCtx
}

function playTone(
  frequency: number,
  endFrequency: number,
  duration: number,
  volume: number,
) {
  const ctx = getAudioContext()
  if (!ctx) return

  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, t)
  osc.frequency.exponentialRampToValueAtTime(endFrequency, t + duration * 0.45)

  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

/** Petit glissando discret au survol d’une carte active */
export function playCardHoverSound() {
  playTone(420, 640, 0.09, 0.045)
}

/** Confirmation au clic */
export function playCardClickSound() {
  playTone(280, 220, 0.07, 0.055)
}
