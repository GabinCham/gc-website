/** Master haute qualité — utilisé uniquement par `npm run generate:audio`. */
export const SITE_TRACK_MASTER =
  '/Guided Levitation - Ostensible Figure.mp3'

/** Variante VBR ~160 kbps pour le web (~4–5 Mo vs 12 Mo). */
export const SITE_TRACK = '/Guided Levitation - Ostensible Figure.web.mp3'

export const SITE_TRACK_WAVEFORM =
  '/Guided Levitation - Ostensible Figure.waveform.json'

export function getWaveformUrl(audioSrc: string): string {
  return audioSrc
    .replace(/\.web\.mp3$/i, '.waveform.json')
    .replace(/\.mp3$/i, '.waveform.json')
}
