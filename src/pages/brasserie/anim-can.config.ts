/**
 * Séquence d’images scrubée au scroll (style Apple).
 * Fichiers dans public/anim-can/ — 0001.png … 0060.png
 */
export const ANIM_CAN_CONFIG = {
  basePath: '/anim-can',
  filePrefix: '',
  frameCount: 60,
  padLength: 4,
  extension: 'png',
  /** Distance de scroll (vh) pour parcourir toute la séquence */
  scrollVh: 280,
  /** Progression PNG (0–1) à laquelle le liquide commence à monter */
  liquidStartAt: 0.8,
  /** Scroll une fois l’écran rempli, avant de reboucler */
  holdScrollVh: 50,
  /** Scroll minimal pour déclencher le retour en haut (boucle) */
  loopScrollVh: 30,
  bg: '#f5f1ea',
  bgTop: '#000000',
  /** Hauteur du bandeau noir en haut (fraction de l’écran, 0–1) */
  bgTopRatio: 0.2,
  /** Ratio des frames (1920×1080) — utilisé pour le cadrage */
  frameAspect: 16 / 9,
  /** `cover` = plein écran bord à bord (recadrage), `contain` = frame entière visible */
  fit: 'cover' as const,
  liquid: {
    color: '#5C45A8',
    top: '#E3D9FF',
    mid: '#9B7AE8',
    bottom: '#5C45A8',
    /** Amplitude des vagues (fraction de la hauteur du canvas) */
    waveAmplitude: 0.022,
  },
} as const

export function getAnimCanFrameUrl(frameIndex: number): string {
  const { basePath, filePrefix, padLength, extension } = ANIM_CAN_CONFIG
  const number = String(frameIndex + 1).padStart(padLength, '0')
  return `${basePath}/${filePrefix}${number}.${extension}`
}

export function getAnimCanFrameUrls(): string[] {
  return Array.from({ length: ANIM_CAN_CONFIG.frameCount }, (_, index) =>
    getAnimCanFrameUrl(index),
  )
}
