import fifaWorldCupLogoUrl from '../../../assets/fifa-world-cup-2026-3.svg'

/** Compose coupe 3D (+ logo FIFA remis plus tard). */
export const WORLD_CUP_COMPOSE_CONFIG = {
  logoUrl: fifaWorldCupLogoUrl,
  logo: {
    x: '0px',
    y: '0px',
    scale: 1,
  },
  coupe: {
    x: '0px',
    y: '0px',
    scale: 1,
  },
} as const
