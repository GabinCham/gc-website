import * as THREE from 'three'
import type { CardLayout } from './layouts'
import { MOBILE_SPIRAL_BREAKPOINT, SPIRAL } from './layouts'
import { getInfiniteSpiralLayout } from './spiralInfinite'

export const CONVERGE_DURATION = 0.95
export const MOVE_DURATION = 0.88

/** Un seul point derrière la focus — toutes les cartes y convergent. */
const PACKED_BEHIND_OFFSET = 0.07

export type ProjectTransitionPhase = 'converge' | 'move' | 'done'

/** Côté de l'écran où la carte hero se pose sur la page projet. */
export type HeroSide = 'left' | 'right'

export type HeroLockState = {
  itemId: string
  layout: CardLayout
  heroSide: HeroSide
}

export type ProjectTransitionCompleteMeta = {
  heroSide: HeroSide
}

export type ProjectTransitionState = {
  active: boolean
  itemId: string
  focusSlot: number
  offset: number
  phase: ProjectTransitionPhase
  convergeT: number
  moveT: number
  heroLayout: CardLayout | null
  slotOrder: Map<number, number>
  totalSlots: number
  spiralLayouts: Map<number, CardLayout>
  /** Carte focus redressée face caméra (même position spirale, taille hero). */
  focusFrontLayout: CardLayout
  heroSide: HeroSide
}

/** Carte à droite du centre → hero à droite, texte à gauche. */
export function getHeroSideForSlot(slot: number, offset: number): HeroSide {
  const x = getInfiniteSpiralLayout(slot, offset).position[0]
  return x > 0.15 ? 'right' : 'left'
}

function heroFacingYaw(viewportWidth: number, heroSide: HeroSide): number {
  const isMobile = viewportWidth < MOBILE_SPIRAL_BREAKPOINT
  if (isMobile) return 0
  return heroSide === 'right' ? -0.12 : 0.12
}

export function computeHeroCardScale(
  viewportWidth: number,
  cardWidth: number,
): number {
  const isMobile = viewportWidth < MOBILE_SPIRAL_BREAKPOINT
  const heroWidth = isMobile ? cardWidth * 1.35 : cardWidth * 1.42
  return heroWidth / SPIRAL.cardWidth
}

/** Redresse la carte focus sur place — évite la largeur « écrasée » des cartes latérales. */
export function computeFocusFrontLayout(
  focusSlot: number,
  offset: number,
  viewportWidth: number,
  cardWidth: number,
  heroSide: HeroSide,
): CardLayout {
  const spiral = getInfiniteSpiralLayout(focusSlot, offset)
  return {
    position: spiral.position,
    rotation: [0, heroFacingYaw(viewportWidth, heroSide), 0],
    bendRadius: 120,
    scale: computeHeroCardScale(viewportWidth, cardWidth),
  }
}

export function createProjectTransitionState(
  itemId: string,
  focusSlot: number,
  visibleSlots: number[],
  offset: number,
  viewportWidth: number,
  cardWidth: number,
): ProjectTransitionState {
  const sorted = [...visibleSlots].sort((a, b) => {
    const da = Math.abs(a - focusSlot)
    const db = Math.abs(b - focusSlot)
    if (da !== db) return da - db
    return a - b
  })

  const slotOrder = new Map<number, number>()
  sorted.forEach((slot, index) => slotOrder.set(slot, index))

  const spiralLayouts = new Map<number, CardLayout>()
  for (const slot of visibleSlots) {
    spiralLayouts.set(slot, getInfiniteSpiralLayout(slot, offset))
  }

  const focusFrontLayout = computeFocusFrontLayout(
    focusSlot,
    offset,
    viewportWidth,
    cardWidth,
    getHeroSideForSlot(focusSlot, offset),
  )

  return {
    active: true,
    itemId,
    focusSlot,
    offset,
    phase: 'converge',
    convergeT: 0,
    moveT: 0,
    heroLayout: null,
    slotOrder,
    totalSlots: visibleSlots.length,
    spiralLayouts,
    focusFrontLayout,
    heroSide: getHeroSideForSlot(focusSlot, offset),
  }
}

export function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

/** Interpolation d'angle sur le chemin le plus court (évite les tours sur elles-mêmes). */
export function lerpAngle(from: number, to: number, t: number): number {
  const diff = Math.atan2(Math.sin(to - from), Math.cos(to - from))
  return from + diff * t
}

function lerpRotation(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    lerpAngle(from[0], to[0], t),
    lerpAngle(from[1], to[1], t),
    lerpAngle(from[2], to[2], t),
  ]
}

function lerpPosition(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ]
}

export function blendLayout(a: CardLayout, b: CardLayout, t: number): CardLayout {
  return {
    position: lerpPosition(a.position, b.position, t),
    rotation: lerpRotation(a.rotation, b.rotation, t),
    bendRadius: a.bendRadius + (b.bendRadius - a.bendRadius) * t,
    scale: a.scale + (b.scale - a.scale) * t,
  }
}

function getFocusSpiralLayout(focusSlot: number, offset: number): CardLayout {
  return getInfiniteSpiralLayout(focusSlot, offset)
}

function getBehindSpiralLayout(focusSlot: number, offset: number): CardLayout {
  return getInfiniteSpiralLayout(focusSlot - PACKED_BEHIND_OFFSET, offset)
}

/**
 * Rengaine la spirale sur la carte focus :
 * - focus figée (offset constant)
 * - cartes au-dessus : scroll virtuel (offset++) puis derrière
 * - cartes déjà passées : disparaissent sans traverser l'écran
 */
function getConvergeLayoutAndOpacity(
  transition: ProjectTransitionState,
  spiralSlot: number,
  isFocus: boolean,
  rawT: number,
): { layout: CardLayout; opacity: number } {
  const { focusSlot, offset } = transition
  const progress = easeOutCubic(Math.min(1, rawT))

  if (isFocus) {
    const startLayout =
      transition.spiralLayouts.get(focusSlot) ??
      getFocusSpiralLayout(focusSlot, offset)
    const straightenT = easeOutCubic(Math.min(1, progress / 0.55))
    return {
      layout: straightenFocusLayout(
        startLayout,
        transition.focusFrontLayout,
        straightenT,
      ),
      opacity: 1,
    }
  }

  if (spiralSlot < focusSlot) {
    return {
      layout: getBehindSpiralLayout(focusSlot, offset),
      opacity: Math.max(0, 1 - progress * 4),
    }
  }

  const dist = spiralSlot - focusSlot
  const scrollDelta = progress * (dist + PACKED_BEHIND_OFFSET)
  const layout = getInfiniteSpiralLayout(spiralSlot, offset + scrollDelta)
  const fadeRate = 2.8 + dist * 0.12

  return {
    layout,
    opacity: Math.max(0, 1 - progress * fadeRate),
  }
}

function ndcToWorldOnZPlane(
  camera: THREE.Camera,
  ndcX: number,
  ndcY: number,
): THREE.Vector3 {
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const hit = new THREE.Vector3()
  const ok = raycaster.ray.intersectPlane(plane, hit)
  if (!ok) hit.set(-3.2, 0.15, 0.5)
  return hit
}

/** Position finale de la carte hero (alignée avec la page projet). */
export function computeProjectHeroLayout(
  camera: THREE.Camera,
  viewportWidth: number,
  galleryGroupY: number,
  galleryScale: number,
  cardWidth: number,
  heroSide: HeroSide = 'left',
): CardLayout {
  const isMobile = viewportWidth < MOBILE_SPIRAL_BREAKPOINT
  const ndcX = isMobile ? 0 : heroSide === 'right' ? 0.38 : -0.38
  const ndcY = isMobile ? 0.08 : 0.04

  const world = ndcToWorldOnZPlane(camera, ndcX, ndcY)

  const localX = world.x / galleryScale
  const localY = (world.y - galleryGroupY) / galleryScale
  const localZ = world.z / galleryScale

  const heroWidth = isMobile ? cardWidth * 1.35 : cardWidth * 1.42
  const scale = heroWidth / SPIRAL.cardWidth

  return {
    position: [localX, localY, localZ],
    rotation: [0, heroFacingYaw(viewportWidth, heroSide), 0],
    bendRadius: 120,
    scale,
  }
}

function straightenFocusLayout(
  from: CardLayout,
  to: CardLayout,
  t: number,
): CardLayout {
  return {
    position: from.position,
    rotation: lerpRotation(from.rotation, to.rotation, t),
    bendRadius: from.bendRadius + (to.bendRadius - from.bendRadius) * t,
    scale: from.scale + (to.scale - from.scale) * t,
  }
}

export function getTransitionCardLayout(
  transition: ProjectTransitionState,
  _spiralLayout: CardLayout,
  spiralSlot: number,
  _itemId: string,
): { layout: CardLayout; opacity: number } {
  const isFocus = spiralSlot === transition.focusSlot
  const { focusSlot, offset } = transition

  if (transition.phase === 'converge') {
    return getConvergeLayoutAndOpacity(
      transition,
      spiralSlot,
      isFocus,
      transition.convergeT,
    )
  }

  const focusLayout = transition.focusFrontLayout

  if (!isFocus) {
    return { layout: getBehindSpiralLayout(focusSlot, offset), opacity: 0 }
  }

  const hero = transition.heroLayout
  if (!hero) {
    return { layout: focusLayout, opacity: 1 }
  }

  const t = easeInOutCubic(Math.min(1, transition.moveT))
  return {
    layout: blendLayout(focusLayout, hero, t),
    opacity: 1,
  }
}

export function getTransitionSceneFade(transition: ProjectTransitionState): number {
  return transition.active ? 1 : 0
}
