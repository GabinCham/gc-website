import fifaWorldCupLogoUrl from '../../../assets/fifa-world-cup-2026-3.svg'

/** Logo FIFA + coupe 3D — même conteneur, réglages indépendants. */
export const WORLD_CUP_COMPOSE_CONFIG = {
  logoUrl: fifaWorldCupLogoUrl,
  logo: {
    x: '0px',
    y: '0px',
    scale: 1,
  },
  /** Coupe 3D par rapport au logo (scale, décalage x/y). */
  coupe: {
    x: '41px',
    y: '50px',
    scale: 2.22,
  },
} as const
