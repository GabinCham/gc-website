/**
 * Section finale — textes affichés après le scroll des canettes.
 */
export type BrasserieOutroConfig = {
  eyebrow: string
  title: string
  paragraphs: string[]
  ctaLabel?: string
  ctaHref?: string
  bg: string
  text: string
  accent: string
}

export const BRASSERIE_OUTRO_CONFIG: BrasserieOutroConfig = {
  eyebrow: 'La brasserie',
  title: 'Une histoire\nà savourer',
  paragraphs: [
    'Chaque canette raconte un geste, un goût, un moment partagé. Du brassage à la dégustation, nous cultivons l’équilibre entre tradition et créativité.',
    'Découvrez nos recettes, nos engagements et l’art du détail qui fait la différence dans chaque gorgée.',
  ],
  ctaLabel: '← Retour au portfolio',
  ctaHref: '/',
  bg: '#0f0e12',
  text: '#f5f0ea',
  accent: '#e8d5a3',
}
