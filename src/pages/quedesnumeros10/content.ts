import equipesData from './equipes.json'
import { getMarkThemeStyle, resolveCouleur } from './colors'

export const QDN10_HDR_URL = new URL(
  '../../../assets/forest_slope_4k.hdr',
  import.meta.url,
).href

export const WORLD_CUP_GLB_URL = '/glb/world-cup/wc-trophy.glb'
export const TRIONDA_GLB_URL = '/glb/world-cup/trionda.glb'

export const QDN10_GLB_URLS = [WORLD_CUP_GLB_URL, TRIONDA_GLB_URL] as const

export type EquipeNumero10 = {
  groupe: string
  equipe: string
  numero_10: string
  couleurs: [string, string]
}

export type EquipeNumero10Resolved = EquipeNumero10 & {
  couleurGauche: string
  couleurDroite: string
  texte: string
}

export const EQUIPES: EquipeNumero10Resolved[] = (
  equipesData as EquipeNumero10[]
).map((entry) => {
  const couleurGauche = resolveCouleur(entry.couleurs[0])
  const couleurDroite = resolveCouleur(entry.couleurs[1])

  return {
    ...entry,
    couleurGauche,
    couleurDroite,
    texte: '#ffffff',
  }
})

export const QDN10_SCROLL_SECTIONS = EQUIPES.length

export function getEquipeIndex(scrollProgress: number): number {
  if (EQUIPES.length === 0) return 0
  const sectionFloat = scrollProgress * EQUIPES.length
  return Math.min(Math.floor(sectionFloat), EQUIPES.length - 1)
}

export function getEquipe(scrollProgress: number): EquipeNumero10Resolved {
  return EQUIPES[getEquipeIndex(scrollProgress)]!
}

export function getEquipeThemeStyle(
  equipe: EquipeNumero10Resolved,
): Record<string, string> {
  return {
    '--qdn10-bg-left': equipe.couleurGauche,
    '--qdn10-bg-right': equipe.couleurDroite,
    '--qdn10-text': equipe.texte,
    ...getMarkThemeStyle(equipe.couleurGauche, equipe.couleurDroite),
  }
}
