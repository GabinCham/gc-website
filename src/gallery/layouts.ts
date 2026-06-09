export type LayoutMode = 'all' | 'simple'

export type CardLayout = {
  position: [number, number, number]
  rotation: [number, number, number]
  bendRadius: number
  scale: number
}

/**
 * Nombre de cartes visibles à l'écran en mode spirale.
 * Fixe l'espacement entre chaque carte sur l'hélice : valeur plus haute = cartes
 * plus espacées (moins visibles en même temps), valeur plus basse = l'inverse.
 * Indépendant du nombre total de projets dans la galerie.
 */
export const MAX_VISIBLE_CARDS = 23

/**
 * Largeur viewport (px) en dessous de laquelle la spirale garde l'échelle desktop
 * et déborde volontairement de l'écran, plutôt que de se réduire pour tout faire tenir.
 */
export const MOBILE_SPIRAL_BREAKPOINT = 768

/**
 * Fraction de la largeur visible occupée par la carte centrale sur mobile.
 * Réduit la taille des cartes (ratio conservé) pour qu'elles ne soient pas coupées
 * sur les bords, sans réduire la spirale elle-même.
 */
export const MOBILE_CARD_WIDTH_FRACTION = 0.88

export const SPIRAL = {
  radius: 5.2,
  height: 14,
  turns: 2.5,
  cardWidth: 3.022, // 1.7 * (16/9)
  cardHeight: 1.7,
  maxVisibleCards: MAX_VISIBLE_CARDS,
}

export const LIST = {
  columns: 4,
  gapX: 2,
  gapY: 2,
  bendRadius: 48,
  cardWidth: 1.7384, // Ratio ultra-précis basé sur 1203/692
  cardHeight: 1,
}

export function getSpiralLayout(
  index: number,
  total: number,
  rotation: number,
): CardLayout {
  const t = index / Math.max(total - 1, 1)
  const theta = t * SPIRAL.turns * Math.PI * 2 + rotation
  const y = (t - 0.5) * SPIRAL.height

  const x = Math.cos(theta) * SPIRAL.radius
  const z = Math.sin(theta) * SPIRAL.radius

  return {
    position: [x, y, z],
    rotation: [0, -theta + Math.PI / 2, 0],
    bendRadius: SPIRAL.radius * 0.92,
    scale: 1,
  }
}

export function getListLayout(index: number, total: number): CardLayout {
  const col = index % LIST.columns
  const row = Math.floor(index / LIST.columns)
  const rows = Math.ceil(total / LIST.columns)

  const gridW = (LIST.columns - 1) * LIST.gapX
  const gridH = (rows - 1) * LIST.gapY

  const x = col * LIST.gapX - gridW / 2
  const y = -(row * LIST.gapY - gridH / 2)

  return {
    position: [x, y, 0],
    rotation: [0, 0, 0],
    bendRadius: LIST.bendRadius,
    scale: 0.92,
  }
}

export function getCardLayout(
  mode: LayoutMode,
  index: number,
  total: number,
  rotation: number,
): CardLayout {
  return mode === 'all'
    ? getSpiralLayout(index, total, rotation)
    : getListLayout(index, total)
}

export const CARD_SIZE = {
  all: { width: SPIRAL.cardWidth, height: SPIRAL.cardHeight },
  simple: { width: LIST.cardWidth, height: LIST.cardHeight },
}
