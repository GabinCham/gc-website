import { useThree } from '@react-three/fiber'
import {
  CARD_SIZE,
  LIST,
  MOBILE_CARD_WIDTH_FRACTION,
  MOBILE_SPIRAL_BREAKPOINT,
  SPIRAL,
  type LayoutMode,
} from './layouts'

export type GalleryResponsiveLayout = {
  scale: number
  cardSize: { width: number; height: number }
  /** Multiplicateur du GLB central — suit le ratio des cartes sur mobile. */
  centerModelScale: number
}

const CAMERA = { z: 11.5, y: 0.5, fov: 42 }
const REFERENCE_VIEWPORT = { width: 1440, height: 900 }
const MIN_SCALE = 0.38
const MAX_SCALE = 1

function getVisibleWorldWidth(aspect: number): number {
  const dz = CAMERA.z - SPIRAL.radius
  const distance = Math.sqrt(dz * dz + CAMERA.y * CAMERA.y)
  const vFov = (CAMERA.fov * Math.PI) / 180
  const height = 2 * Math.tan(vFov / 2) * distance
  return height * aspect
}

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

function getSpiralScale(visibleWidth: number, viewportWidth: number): number {
  const refAspect = REFERENCE_VIEWPORT.width / REFERENCE_VIEWPORT.height
  const refVisibleWidth = getVisibleWorldWidth(refAspect)
  const targetFraction = SPIRAL.cardWidth / refVisibleWidth
  const widthForScale =
    viewportWidth < MOBILE_SPIRAL_BREAKPOINT ? refVisibleWidth : visibleWidth
  return clampScale((widthForScale * targetFraction) / SPIRAL.cardWidth)
}

function getSpiralCardSize(
  visibleWidth: number,
  galleryScale: number,
  viewportWidth: number,
): { width: number; height: number } {
  const base = CARD_SIZE.all
  if (viewportWidth >= MOBILE_SPIRAL_BREAKPOINT) return base

  const width = (visibleWidth * MOBILE_CARD_WIDTH_FRACTION) / galleryScale
  const aspect = base.height / base.width
  return { width, height: width * aspect }
}

function getSimpleScale(visibleWidth: number, viewportWidth: number): number {
  const gridWidth =
    (LIST.columns - 1) * LIST.gapX + LIST.columns * LIST.cardWidth
  const fitScale = (visibleWidth * 0.9) / gridWidth
  const widthScale = viewportWidth / REFERENCE_VIEWPORT.width
  return clampScale(Math.min(widthScale, fitScale))
}

export function useGalleryResponsiveLayout(
  mode: LayoutMode,
): GalleryResponsiveLayout {
  const { size } = useThree()
  const aspect = size.width / Math.max(size.height, 1)
  const visibleWidth = getVisibleWorldWidth(aspect)

  if (mode !== 'all') {
    return {
      scale: getSimpleScale(visibleWidth, size.width),
      cardSize: CARD_SIZE.simple,
      centerModelScale: 1,
    }
  }

  const scale = getSpiralScale(visibleWidth, size.width)
  const cardSize = getSpiralCardSize(visibleWidth, scale, size.width)
  const centerModelScale =
    size.width < MOBILE_SPIRAL_BREAKPOINT
      ? cardSize.width / SPIRAL.cardWidth
      : 1

  return { scale, cardSize, centerModelScale }
}

export function useGalleryResponsiveScale(mode: LayoutMode): number {
  return useGalleryResponsiveLayout(mode).scale
}
