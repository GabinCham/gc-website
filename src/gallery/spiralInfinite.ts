import { SPIRAL } from './layouts'
import type { GalleryItem } from './images'

const FRONT_ANGLE = Math.PI / 2

/** Espacement fixe entre deux slots (ne dépend pas du nombre de projets) */
export function getHelixSpacing() {
  const span = Math.max(SPIRAL.maxVisibleCards - 1, 1)
  return {
    angleStep: (SPIRAL.turns * Math.PI * 2) / span,
    heightStep: SPIRAL.height / span,
  }
}

export type CardLayout = {
  position: [number, number, number]
  rotation: [number, number, number]
  bendRadius: number
  scale: number
}

/**
 * Une place `slot` sur la spirale infinie (0, 1, 2 … ∞).
 * `offset` = où tu es sur la piste (23.5 = entre image 23 et 24).
 * Image affichée = slot % nombre d’images → 24 affiche l’image 0, etc.
 */
/** Centre de l’hélice (axe Y) — rotation synchronisée avec le scroll. */
export function getSpiralCenterTransform(offset: number): Pick<
  CardLayout,
  'position' | 'rotation'
> {
  const { angleStep } = getHelixSpacing()
  const theta = -offset * angleStep + FRONT_ANGLE
  return {
    position: [0, 0, 0],
    rotation: [0, -theta + Math.PI / 2, 0],
  }
}

export function getInfiniteSpiralLayout(
  slot: number,
  offset: number,
): CardLayout {
  const { angleStep, heightStep } = getHelixSpacing()
  const theta = (slot - offset) * angleStep + FRONT_ANGLE
  const y = (slot - offset) * heightStep

  const x = Math.cos(theta) * SPIRAL.radius
  const z = Math.sin(theta) * SPIRAL.radius

  return {
    position: [x, y, z],
    rotation: [0, -theta + Math.PI / 2, 0],
    bendRadius: SPIRAL.radius * 0.92,
    scale: 1,
  }
}

export function getImageIndexForSlot(slot: number, total: number) {
  return ((slot % total) + total) % total
}

export function getVisibleSlotsBuffer(total: number, mobile = false) {
  if (mobile) return Math.max(5, Math.ceil(total * 0.35))
  return Math.max(10, Math.ceil(total * 0.55))
}

/**
 * Slots montés en avance au-dessus du offset (haut de l’hélice).
 * Évite qu’une carte n’apparaisse d’un coup quand offset franchit un entier.
 */
export const VISIBLE_SLOTS_AHEAD_EXTRA = 3

export function getVisibleSlotRange(
  offset: number,
  total: number,
  mobile = false,
) {
  const buffer = getVisibleSlotsBuffer(total, mobile)
  const minSlot = Math.floor(offset - buffer)
  const maxSlot = Math.ceil(offset + buffer + VISIBLE_SLOTS_AHEAD_EXTRA)
  return { minSlot, maxSlot }
}

export function getVisibleSlots(
  offset: number,
  total: number,
  mobile = false,
) {
  const { minSlot, maxSlot } = getVisibleSlotRange(offset, total, mobile)
  const slots: number[] = []

  for (let slot = minSlot; slot <= maxSlot; slot++) {
    slots.push(slot)
  }

  return slots
}

export function getGalleryItem(slot: number, items: GalleryItem[]) {
  const total = items.length
  if (total === 0) return undefined
  return items[getImageIndexForSlot(slot, total)]
}

/** Hystérésis titre / carte centrale (évite les bascules rapides). */
export const FRONT_SLOT_HYSTERESIS = 0.62

/** Seuil plus bas pour anticiper le fond d’écran pendant la rotation. */
export const BACKGROUND_SLOT_LEAD = 0.38

/** Slot devant la caméra — avec hysteresis pour éviter les bascules rapides */
export function getStableFrontSlot(
  offset: number,
  currentSlot: number,
  hysteresis = FRONT_SLOT_HYSTERESIS,
) {
  const rounded = Math.round(offset)
  if (rounded === currentSlot) return currentSlot
  if (rounded > currentSlot && offset >= currentSlot + hysteresis) return rounded
  if (rounded < currentSlot && offset <= currentSlot - hysteresis) return rounded
  return currentSlot
}

export function getStableFrontGalleryItem(
  offset: number,
  currentSlot: number,
  items: GalleryItem[],
) {
  return getGalleryItem(getStableFrontSlot(offset, currentSlot), items)
}

/** Carte face caméra ± voisins latéraux (cliquables) */
export function isSpiralInteractiveSlot(slot: number, frontSlot: number) {
  return Math.abs(slot - frontSlot) <= 1
}

/** Entrée vidéo côté gauche (m) — plus haut = démarrage plus tôt. */
export const VIDEO_LEFT_X = 5.05

/** Sortie vidéo côté droit (m) — plus haut = poster plus tard. */
export const VIDEO_RELEASE_X = 4.95

/**
 * Zone vidéo basée sur la position X réelle de la carte (pas le slot),
 * pour éviter les trous quand frontSlot et offset se désynchronisent.
 */
export function isSpiralVideoSlot(
  slot: number,
  _frontSlot: number,
  scrollVelocity: number,
  offset: number,
  leftX = VIDEO_LEFT_X,
  releaseX = VIDEO_RELEASE_X,
) {
  const x = getInfiniteSpiralLayout(slot, offset).position[0]

  if (scrollVelocity < -0.00002) {
    return x < leftX && x > -releaseX
  }

  return x > -leftX && x < releaseX
}

